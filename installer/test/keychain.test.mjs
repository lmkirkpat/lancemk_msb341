// lib/keychain.mjs and the key steps of install.mjs (T012). A fake helper answers key_check
// (contracts/helper-protocol.md) and a fake `security` stands in for the Keychain. Both record only
// a hash of what they got on stdin, so a search of every file for the key means something.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeKey, checkKey, storeKey, shouldStore, KEY_ITEM } from "../lib/keychain.mjs";
import { main, NOTES } from "../install.mjs";
import { layout } from "../lib/layout.mjs";
import { TOOLS } from "../lib/ae.mjs";
import { tmpdir, write, makePayload, makeNodeDir, makeApps, makeRun } from "./fixtures.mjs";

const INSTALLER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const KEY = (status) => `sk-ant-api03-TESTONLY0123456789abcdef-${status}`;

// The fake helper: replies to key_check from the key's last word, after a short wait (so closing
// stdin early would lose the answer, as with the real helper). LOG gets argv, env, cwd and hashes.
const FAKE_HELPER = (log) => `
import fs from "node:fs"; import crypto from "node:crypto"; import readline from "node:readline";
const log = (o) => fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(o) + "\\n");
log({ argv: process.argv, env: process.env, cwd: process.cwd() });
readline.createInterface({ input: process.stdin }).on("line", (line) => {
  const cmd = JSON.parse(line);
  const key = cmd.key || "";
  log({ type: cmd.type, keySha: crypto.createHash("sha256").update(key).digest("hex") });
  const word = key.split("-").pop();
  setTimeout(() => {
    if (word === "silent") return;
    if (word === "broken") return process.stdout.write(JSON.stringify({ type: "error", kind: "not_implemented", message: "" }) + "\\n");
    process.stdout.write(JSON.stringify({ type: "key_status", status: word }) + "\\n");
  }, 150);
}).on("close", () => process.exit(0));
`;

// The fake security: "-i" reads one add-generic-password line; find-generic-password succeeds once
// something is stored. STATE holds only the stored key's hash.
const FAKE_SECURITY = (log, state, { failAdd } = {}) => `#!${process.execPath}
const fs = require("fs"); const crypto = require("crypto");
const args = process.argv.slice(2);
let input = ""; try { input = fs.readFileSync(0, "utf8"); } catch {}
const m = /^add-generic-password -U -s (\\S+) -a (\\S+) -w (\\S+)\\n$/.exec(input);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args, env: process.env, inputOk: !!m, keySha: m ? crypto.createHash("sha256").update(m[3]).digest("hex") : null, service: m && m[1], account: m && m[2] }) + "\\n");
if (args[0] === "-i") { if (m && !${!!failAdd}) fs.writeFileSync(${JSON.stringify(state)}, m[1] + " " + m[2] + " " + crypto.createHash("sha256").update(m[3]).digest("hex")); process.exit(0); }
if (args[0] === "find-generic-password") { process.exit(fs.existsSync(${JSON.stringify(state)}) ? 0 : 44); }
process.exit(1);
`;

function setup(t, o = {}) {
  const sandbox = tmpdir(t, "knack-key-");
  const home = path.join(sandbox, "home");
  fs.mkdirSync(home);
  const logs = path.join(sandbox, "logs");
  fs.mkdirSync(logs);
  const helperLog = path.join(logs, "helper.jsonl");
  const secLog = path.join(logs, "security.jsonl");
  const secState = path.join(logs, "keychain.txt");
  const payloadDir = makePayload(t, { helperMain: FAKE_HELPER(helperLog) });
  const nodeDir = makeNodeDir(t);
  const apps = makeApps(t);
  const security = write(sandbox, "bin/security", FAKE_SECURITY(secLog, secState, o), 0o755);
  const tools = { ...TOOLS, security };
  const run = makeRun({});
  const readLog = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
  return { sandbox, home, payloadDir, nodeDir, apps, tools, run, helperLog, secLog, secState, readLog, L: layout(home) };
}

// The key appears in no file under these folders, no recorded argument list or environment.
function assertNowhere(key, { dirs, calls, logs }) {
  for (const d of dirs) {
    const walk = (p) => {
      const st = fs.lstatSync(p);
      if (st.isSymbolicLink()) return;
      if (st.isDirectory()) return fs.readdirSync(p).forEach((n) => walk(path.join(p, n)));
      assert.ok(!fs.readFileSync(p).includes(key), `the key is in ${p}`);
    };
    walk(d);
  }
  for (const c of calls || []) {
    assert.ok(!c.args.some((a) => String(a).includes(key)), `the key is in ${c.cmd}'s arguments`);
    assert.ok(!JSON.stringify(c.env || {}).includes(key), `the key is in ${c.cmd}'s environment`);
  }
  for (const l of logs || []) assert.ok(!JSON.stringify(l).includes(key), "the key is in a process's argv or env");
}

test("normalizeKey trims a pasted key and refuses anything that can't be one", () => {
  assert.equal(normalizeKey(`  ${KEY("works")}\n`), KEY("works"));
  assert.equal(normalizeKey(""), null);
  assert.equal(normalizeKey("short"), null);
  assert.equal(normalizeKey(`${KEY("works")}\nadd-generic-password -s x -a y -w z`), null, "no second line for security -i");
  assert.equal(normalizeKey(`${KEY("works")} extra`), null);
  assert.equal(normalizeKey(`"${KEY("works")}"`), null);
});

test("a key is stored unless the service refused it", () => {
  assert.deepEqual(["works", "rejected", "out_of_credit", "offline", "no_key", "unknown"].filter(shouldStore), ["works", "out_of_credit", "offline", "unknown"]);
});

test("checkKey: each status from the helper, with the key on stdin only", async (t) => {
  const s = setup(t);
  const helperPath = path.join(s.payloadDir, "version", "panel", "helper", "main.mjs");
  const nodePath = path.join(s.nodeDir, "bin", "node");
  for (const status of ["works", "rejected", "out_of_credit", "offline", "no_key"]) {
    assert.equal(await checkKey({ key: KEY(status), nodePath, helperPath, home: s.home }), status);
  }
  const logs = s.readLog(s.helperLog);
  const starts = logs.filter((l) => l.argv);
  assert.equal(starts.length, 5);
  for (const st of starts) {
    // PWD and SHLVL are added by the fixture's /bin/sh wrapper around Node, not by checkKey.
    assert.deepEqual(Object.keys(st.env).filter((k) => !["__CF_USER_TEXT_ENCODING", "PWD", "SHLVL", "_"].includes(k)).sort(), ["HOME", "PATH"]);
    assert.equal(st.env.HOME, s.home);
    assert.equal(fs.realpathSync(st.cwd), fs.realpathSync(path.dirname(helperPath)));
  }
  const checks = logs.filter((l) => l.type === "key_check");
  assert.deepEqual(checks.map((c) => c.keySha), ["works", "rejected", "out_of_credit", "offline", "no_key"].map((w) => sha(KEY(w))));
  assertNowhere(KEY("works"), { dirs: [s.sandbox], logs });
});

test("checkKey: no answer, an error reply or no helper is unknown, never works", async (t) => {
  const s = setup(t);
  const helperPath = path.join(s.payloadDir, "version", "panel", "helper", "main.mjs");
  const nodePath = path.join(s.nodeDir, "bin", "node");
  assert.equal(await checkKey({ key: KEY("silent"), nodePath, helperPath, home: s.home, timeoutMs: 600 }), "unknown");
  assert.equal(await checkKey({ key: KEY("broken"), nodePath, helperPath, home: s.home }), "unknown");
  assert.equal(await checkKey({ key: KEY("works"), nodePath, helperPath: path.join(s.sandbox, "nope.mjs"), home: s.home }), "unknown");
  assert.equal(await checkKey({ key: KEY("works"), nodePath: path.join(s.sandbox, "no-node"), helperPath, home: s.home }), "unknown");
});

test("storeKey: security -i over stdin, service Knack, account anthropic-api-key", async (t) => {
  const s = setup(t);
  assert.equal(await storeKey({ key: KEY("works"), run: s.run, tools: s.tools }), true);
  const sec = s.readLog(s.secLog);
  assert.deepEqual(sec.map((l) => l.args), [["-i"], ["find-generic-password", "-s", "Knack", "-a", "anthropic-api-key"]]);
  assert.equal(sec[0].inputOk, true);
  assert.equal(sec[0].keySha, sha(KEY("works")));
  assert.deepEqual([sec[0].service, sec[0].account], [KEY_ITEM.service, KEY_ITEM.account]);
  for (const l of sec) assert.deepEqual(Object.keys(l.env).filter((k) => k !== "__CF_USER_TEXT_ENCODING"), ["PATH"]);
  assertNowhere(KEY("works"), { dirs: [s.sandbox], calls: s.run.calls, logs: sec });
});

test("storeKey refuses a malformed key without calling security", async (t) => {
  const s = setup(t);
  assert.equal(await storeKey({ key: "not a key\nanother command", run: s.run, tools: s.tools }), false);
  assert.equal(s.readLog(s.secLog).length, 0);
});

test("storeKey reports a failed save", async (t) => {
  const s = setup(t, { failAdd: true });
  assert.equal(await storeKey({ key: KEY("works"), run: s.run, tools: s.tools }), false);
});

async function fullInstall(s, key, keyStatus) {
  return main(["install", "--payload", s.payloadDir, "--node-dir", s.nodeDir, ...(keyStatus ? ["--key-status", keyStatus] : [])], {
    home: s.home,
    run: s.run,
    tools: s.tools,
    dirs: [s.apps],
    stdin: key,
  });
}

test("install stores a working key, records the item, and says nothing more", async (t) => {
  const s = setup(t);
  const check = await main(["key-check", "--payload", s.payloadDir, "--node-dir", s.nodeDir], { home: s.home, stdin: KEY("works") + "\n" });
  assert.deepEqual(check, { out: "works", code: 0 });
  const r = await fullInstall(s, KEY("works") + "\n", check.out);
  assert.deepEqual(r, { out: "ok", code: 0 });
  assert.match(fs.readFileSync(s.secState, "utf8"), /^Knack anthropic-api-key /);
  assert.deepEqual(JSON.parse(fs.readFileSync(s.L.state, "utf8")).keychain, { service: "Knack", account: "anthropic-api-key" });
  assertNowhere(KEY("works"), {
    dirs: [s.sandbox, s.payloadDir, s.nodeDir],
    calls: s.run.calls,
    logs: [...s.readLog(s.secLog), ...s.readLog(s.helperLog)],
  });
  assert.ok(!r.out.includes(KEY("works")) && !check.out.includes(KEY("works")));
});

test("offline: the install finishes, the key is stored, and it says not yet checked", async (t) => {
  for (const status of ["offline", "unknown"]) {
    const s = setup(t);
    const r = await fullInstall(s, KEY("offline"), status);
    assert.deepEqual(r, { out: `ok\n${NOTES.not_checked}`, code: 0 });
    assert.ok(fs.existsSync(s.L.current), "installed");
    assert.ok(fs.existsSync(s.secState), "the key was stored");
    assert.ok(JSON.parse(fs.readFileSync(s.L.state, "utf8")).keychain, "the item is recorded");
  }
});

test("out of credit: the key is stored and the note says it needs credit", async (t) => {
  const s = setup(t);
  const r = await fullInstall(s, KEY("out_of_credit"), "out_of_credit");
  assert.deepEqual(r, { out: `ok\n${NOTES.needs_credit}`, code: 0 });
  assert.ok(fs.existsSync(s.secState));
});

test("a rejected key, or none, is never stored", async (t) => {
  const s = setup(t);
  assert.equal((await fullInstall(s, KEY("rejected"), "rejected")).out, `ok\n${NOTES.not_accepted}`);
  assert.equal((await fullInstall(s, "", undefined)).out, "ok");
  assert.equal(s.readLog(s.secLog).length, 0);
});

test("a failed save is named on the last screen", async (t) => {
  const s = setup(t, { failAdd: true });
  assert.deepEqual(await fullInstall(s, KEY("works"), "works"), { out: `ok\n${NOTES.not_saved}`, code: 0 });
});

test("key-check: a malformed paste is bad_format and starts nothing", async (t) => {
  const s = setup(t);
  assert.deepEqual(await main(["key-check", "--payload", s.payloadDir, "--node-dir", s.nodeDir], { home: s.home, stdin: "hello" }), { out: "bad_format", code: 0 });
  assert.equal(s.readLog(s.helperLog).length, 0);
});

test("key-check as a program: the key goes in on stdin and the status comes out", async (t) => {
  const s = setup(t);
  const out = execFileSync(process.execPath, [path.join(INSTALLER, "install.mjs"), "key-check", "--payload", s.payloadDir, "--node-dir", s.nodeDir], {
    input: KEY("rejected") + "\n",
    env: { PATH: "/usr/bin:/bin", HOME: s.home },
    encoding: "utf8",
  });
  assert.equal(out.trim(), "rejected");
  assertNowhere(KEY("rejected"), { dirs: [s.sandbox], logs: s.readLog(s.helperLog) });
});

test("the notes are plain", () => {
  for (const text of Object.values(NOTES)) {
    assert.doesNotMatch(text, /\/|`|\b[a-z]+_[a-z_]+\b|Keychain item|Terminal/, text);
  }
});
