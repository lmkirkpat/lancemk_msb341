#!/usr/bin/env node
// Knack's installer logic (specs/006-installer T011, contracts/install-layout.md). Run by the
// applet on the private Node, never by a person in Terminal:
//   install.mjs preflight --payload <dir>                 → "ok" | "dev\n<question>" | "stop\n<message>"
//   install.mjs ae-open                                   → "open" | "closed"
//   install.mjs key-check --payload <dir> --node-dir <dir>   (key on stdin)
//                                                         → works | rejected | out_of_credit | offline | no_key | bad_format | unknown
//   install.mjs install --payload <dir> --node-dir <dir> [--replace-dev [yes|no]] [--key-status <status>]   (key on stdin, optional)
//                                                         → "ok\n<note>" | "failed\n<message>"
// The key only ever arrives on stdin, and goes on only over stdin (lib/keychain.mjs). Output is one
// word or plain sentences for the applet to show; nothing here prints a path, a key or a code.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { layout } from "./lib/layout.mjs";
import { guard } from "./lib/fsx.mjs";
import { preflight, STOP, BLOCKED_CODES, blockedStop } from "./lib/preflight.mjs";
import { aeRunning } from "./lib/ae.mjs";
import { installPayload, recordKeychain } from "./lib/payload.mjs";
import { normalizeKey, checkKey, storeKey, shouldStore, uncheckedStatus, KEY_ITEM } from "./lib/keychain.mjs";

export const FAILED = "Knack couldn't finish installing. Open the installer again to finish; your lesson history is safe.";
export const NOTES = Object.freeze({
  not_checked: "Your access key is saved but not yet checked. When you're online, press Check setup.",
  not_accepted: "Your access key wasn't accepted, so it wasn't saved. Open the installer again to add a new one.",
  needs_credit: "Your access key works, but its account needs credit before lessons can start.",
  not_saved: "Knack couldn't save your access key. Open the installer again to add it.",
});

// After the files are in place: store the key if its check allows it (lib/keychain.mjs).
// → the note for the last screen, or "".
async function keyStep({ L, g, key, keyStatus, run, tools }) {
  if (!key) return "";
  if (!shouldStore(keyStatus)) return NOTES.not_accepted;
  if (!(await storeKey({ key, run, tools }))) return NOTES.not_saved;
  recordKeychain(L, g, KEY_ITEM);
  if (uncheckedStatus(keyStatus)) return NOTES.not_checked;
  return keyStatus === "out_of_credit" ? NOTES.needs_credit : "";
}

// opts: { home, payloadDir, nodeDir, run, tools, dirs, afterStep, key, keyStatus }
// → { ok: true, note } or { ok: false, reason, text }
export async function install(opts) {
  const L = layout(opts.home);
  const pre = await preflight({ L, payloadDir: opts.payloadDir, run: opts.run, tools: opts.tools, dirs: opts.dirs, replaceDev: !!opts.replaceDev });
  if (!pre.ok) return pre;
  if (pre.aeOpen) return { ok: false, reason: "ae_open", text: STOP.ae_open };
  if (!opts.nodeDir || !fs.existsSync(path.join(opts.nodeDir, "bin", "node"))) return { ok: false, reason: "bad_payload", text: STOP.bad_payload };
  const g = guard(L.support);
  try {
    installPayload({ L, g, payloadDir: opts.payloadDir, nodeDir: opts.nodeDir, release: pre.release, replaceDev: !!opts.replaceDev, afterStep: opts.afterStep });
  } catch (e) {
    if (opts.onError) opts.onError(e);
    if (BLOCKED_CODES.includes(e && e.code)) return blockedStop({ run: opts.run, tools: opts.tools });
    return { ok: false, reason: "failed", text: FAILED };
  }
  const note = await keyStep({ L, g, key: normalizeKey(opts.key), keyStatus: opts.keyStatus, run: opts.run, tools: opts.tools });
  return { ok: true, note };
}

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const o = { command };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--payload") o.payloadDir = rest[++i];
    else if (a === "--node-dir") o.nodeDir = rest[++i];
    else if (a === "--key-status") o.keyStatus = rest[++i];
    else if (a === "--replace-dev") {
      o.replaceDev = true;
      if (rest[i + 1] === "yes" || rest[i + 1] === "no") o.replaceDev = rest[++i] === "yes";
    }
    else throw new Error("unknown option");
  }
  return o;
}

export function readStdin(stream = process.stdin) {
  return new Promise((resolve) => {
    if (stream.isTTY) return resolve("");
    let data = "";
    stream.setEncoding("utf8");
    stream.on("data", (d) => {
      if (data.length < 4096) data += d;
    });
    stream.on("end", () => resolve(data));
    stream.on("error", () => resolve(""));
  });
}

// One CLI call → the text to print and the exit code. `deps` lets tests swap the parts that touch
// the Mac: { home, run, tools, dirs, afterStep, stdin (text, instead of reading stdin) }.
export async function main(argv, deps = {}) {
  let o;
  try {
    o = parseArgs(argv);
  } catch {
    return { out: "failed\n" + STOP.bad_payload, code: 2 };
  }
  const base = { home: deps.home, run: deps.run, tools: deps.tools, dirs: deps.dirs };
  if (o.command === "preflight") {
    const r = await preflight({ L: layout(deps.home), payloadDir: o.payloadDir, run: deps.run, tools: deps.tools, dirs: deps.dirs });
    if (r.ok) return { out: "ok", code: 0 };
    return { out: `${r.reason === "dev_install" ? "dev" : "stop"}\n${r.text}`, code: 1 };
  }
  if (o.command === "ae-open") {
    return { out: (await aeRunning({ run: deps.run, tools: deps.tools })) ? "open" : "closed", code: 0 };
  }
  const stdin = () => (deps.stdin !== undefined ? Promise.resolve(deps.stdin) : readStdin());
  if (o.command === "key-check") {
    const key = normalizeKey(await stdin());
    if (!key) return { out: "bad_format", code: 0 };
    if (!o.payloadDir || !o.nodeDir) return { out: "unknown", code: 0 };
    const status = await checkKey({
      key,
      nodePath: path.join(o.nodeDir, "bin", "node"),
      helperPath: path.join(o.payloadDir, "version", "panel", "helper", "main.mjs"),
      home: layout(deps.home).home,
      timeoutMs: deps.keyTimeoutMs,
    });
    return { out: status, code: 0 };
  }
  if (o.command === "install") {
    const key = await stdin();
    const r = await install({ ...base, payloadDir: o.payloadDir, nodeDir: o.nodeDir, afterStep: deps.afterStep, key, keyStatus: o.keyStatus, replaceDev: o.replaceDev });
    return r.ok ? { out: `ok${r.note ? `\n${r.note}` : ""}`, code: 0 } : { out: `failed\n${r.text}`, code: 1 };
  }
  return { out: "failed\n" + STOP.bad_payload, code: 2 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = await main(process.argv.slice(2));
  process.stdout.write(r.out + "\n");
  process.exitCode = r.code;
}
