#!/usr/bin/env node
// Knack's installer logic (specs/006-installer T011, contracts/install-layout.md). Run by the
// applet on the private Node, never by a person in Terminal:
//   install.mjs preflight --payload <dir>                 → "ok" | "stop\n<message>"
//   install.mjs ae-open                                   → "open" | "closed"
//   install.mjs key-check --payload <dir>   (key on stdin) → works | rejected | out_of_credit | offline | no_key | bad_format
//   install.mjs install --payload <dir> --node-dir <dir> [--key-status <status>]   (key on stdin, optional)
//                                                         → "ok\n<note>" | "failed\n<message>"
// The key only ever arrives on stdin, and goes on only over stdin (lib/keychain.mjs). Output is one
// word or plain sentences for the applet to show; nothing here prints a path, a key or a code.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { layout } from "./lib/layout.mjs";
import { guard } from "./lib/fsx.mjs";
import { preflight, STOP } from "./lib/preflight.mjs";
import { aeRunning } from "./lib/ae.mjs";
import { installPayload } from "./lib/payload.mjs";

export const FAILED = "Knack couldn't finish installing. Open the installer again to finish; your lesson history is safe.";

// opts: { home, payloadDir, nodeDir, run, tools, dirs, afterStep, key, keyStatus, keychain }
// → { ok: true, note } or { ok: false, reason, text }
export async function install(opts) {
  const L = layout(opts.home);
  const pre = await preflight({ L, payloadDir: opts.payloadDir, run: opts.run, tools: opts.tools, dirs: opts.dirs });
  if (!pre.ok) return pre;
  if (pre.aeOpen) return { ok: false, reason: "ae_open", text: STOP.ae_open };
  if (!opts.nodeDir || !fs.existsSync(path.join(opts.nodeDir, "bin", "node"))) return { ok: false, reason: "bad_payload", text: STOP.bad_payload };
  const g = guard(L.support);
  try {
    installPayload({ L, g, payloadDir: opts.payloadDir, nodeDir: opts.nodeDir, release: pre.release, afterStep: opts.afterStep });
  } catch (e) {
    if (opts.onError) opts.onError(e);
    return { ok: false, reason: "failed", text: FAILED };
  }
  const note = opts.afterInstall ? await opts.afterInstall({ L, g }) : "";
  return { ok: true, note: note || "" };
}

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const o = { command };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--payload") o.payloadDir = rest[++i];
    else if (a === "--node-dir") o.nodeDir = rest[++i];
    else if (a === "--key-status") o.keyStatus = rest[++i];
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
// the Mac (tools, AE folders, the key steps).
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
    return r.ok ? { out: "ok", code: 0 } : { out: `stop\n${r.text}`, code: 1 };
  }
  if (o.command === "ae-open") {
    return { out: (await aeRunning({ run: deps.run, tools: deps.tools })) ? "open" : "closed", code: 0 };
  }
  if (o.command === "key-check" && deps.keyCheck) return deps.keyCheck(o);
  if (o.command === "install") {
    const extra = deps.installExtras ? await deps.installExtras(o) : {};
    const r = await install({ ...base, payloadDir: o.payloadDir, nodeDir: o.nodeDir, afterStep: deps.afterStep, ...extra });
    return r.ok ? { out: `ok${r.note ? `\n${r.note}` : ""}`, code: 0 } : { out: `failed\n${r.text}`, code: 1 };
  }
  return { out: "failed\n" + STOP.bad_payload, code: 2 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = await main(process.argv.slice(2));
  process.stdout.write(r.out + "\n");
  process.exitCode = r.code;
}
