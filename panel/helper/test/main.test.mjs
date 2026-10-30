// The helper protocol end to end (contracts/helper-protocol.md): main.mjs as its own process, the
// real ae-mentor in fixture mode, T005's fake service in place of the Claude API.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { loadSettings, HELPER_DIR } from "../lib/settings.mjs";
import { MESSAGES } from "../lib/errors.mjs";
import { startFakeService, reply, failure, text, thinking, toolUse } from "./fake-service.mjs";

const REPO = path.resolve(HELPER_DIR, "../..");
const FIXTURE = path.join(REPO, "product", "evals", "easing", "fixtures", "before.json");
const KEY = "sk-ant-api03-MAINKEY_abcdefghijklm";
const cleanups = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
const childrenOf = (pid) => {
  try {
    return execFileSync("/usr/bin/pgrep", ["-P", String(pid)], { encoding: "utf8" }).trim().split("\n").filter(Boolean).map(Number);
  } catch {
    return [];
  }
};

async function helper() {
  const svc = await startFakeService();
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-main-"));
  const state = path.join(home, "fixture-state.json");
  fs.writeFileSync(state, JSON.stringify({ project: FIXTURE }));
  // As the adapter starts it: PATH, HOME, TZ. The ANTHROPIC_* variables show they're ignored.
  const env = { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", HOME: process.env.HOME, ANTHROPIC_API_KEY: "sk-ant-api03-WRONGKEY_from_env_xx", ANTHROPIC_BASE_URL: "https://elsewhere.invalid" };
  const proc = spawn(process.execPath, [path.join(HELPER_DIR, "main.mjs")], { cwd: HELPER_DIR, env, stdio: ["pipe", "pipe", "pipe"] });
  const events = [];
  const waiters = [];
  let stdout = "";
  let stderr = "";
  proc.stderr.on("data", (d) => (stderr += d));
  readline.createInterface({ input: proc.stdout }).on("line", (line) => {
    stdout += line + "\n";
    const ev = JSON.parse(line);
    events.push(ev);
    for (const w of waiters.slice()) if (w.match(ev)) waiters.splice(waiters.indexOf(w), 1) && w.resolve(ev);
  });
  const exited = new Promise((resolve) => proc.on("exit", (code) => resolve(code)));
  const h = {
    svc,
    home,
    state,
    proc,
    events,
    exited,
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    },
    cmd: (obj) => proc.stdin.write(JSON.stringify(obj) + "\n"),
    next: (type, after = events.length) =>
      new Promise((resolve, reject) => {
        const found = events.slice(after).find((e) => e.type === type);
        if (found) return resolve(found);
        const timer = setTimeout(() => reject(new Error(`no ${type} event; got ${events.map((e) => e.type).join(",")}; stderr ${stderr}`)), 15000);
        waiters.push({ match: (e) => e.type === type, resolve: (e) => (clearTimeout(timer), resolve(e)) });
      }),
    start: (extra = {}) =>
      h.cmd({
        type: "start",
        session_id: "6f1c2b9e-0000-4000-8000-000000000001",
        resume: false,
        home,
        mcp_config: path.join(REPO, ".mcp.json"),
        skills_dir: path.join(REPO, ".claude", "skills"),
        fixture_env: { AE_MENTOR_FIXTURE_STATE: state },
        key: KEY,
        base_url: svc.url,
        ...extra,
      }),
  };
  cleanups.push(async () => {
    if (proc.exitCode === null) proc.kill("SIGKILL");
    await svc.close();
    fs.rmSync(home, { recursive: true, force: true });
  });
  return h;
}

test("a fixture easing lesson end to end; stop leaves no helper and no ae-mentor", async () => {
  const h = await helper();
  h.start();
  const ready = await h.next("ready");
  const loaded = loadSettings();
  assert.deepEqual(ready, {
    type: "ready",
    session_id: "6f1c2b9e-0000-4000-8000-000000000001",
    runtime: "a",
    model: "claude-opus-5-5",
    effort: "medium",
    settings_hash: loaded.hash,
    skill: null,
  });

  h.svc.script(
    reply([thinking("", "s1"), text("Let me look."), toolUse("snapshot_project", {}, "tu1")], { stop_reason: "tool_use" }),
    reply([text("Your Title moves at one speed the whole way.")]),
  );
  const at = h.events.length;
  h.cmd({ type: "send", text: "/ease-mentor", kind: "start" });
  const end = await h.next("turn_end", at);
  const turn = h.events.slice(at);
  const types = turn.map((e) => e.type);
  assert.equal(types[0], "turn_start");
  assert.deepEqual(turn[0].kind, "start");
  for (const t of ["text_delta", "text", "tool_call", "tool_result"]) assert.ok(types.includes(t), t);
  assert.ok(!types.includes("error"));
  assert.equal(end.ok, true);
  assert.equal(end.kind, "start");
  assert.equal(end.runtime, "a");
  assert.equal(end.model, "claude-opus-5-5");
  assert.equal(end.effort, "medium");
  assert.equal(end.settings_hash, loaded.hash);
  assert.equal(end.other_model, false);
  assert.equal(typeof end.cost_usd, "number");
  assert.ok(end.cost_usd > 0);
  assert.deepEqual(Object.keys(end.tokens).sort(), ["cache_read", "cache_write", "input", "output"]);
  assert.ok(end.first_event_ms >= 0 && end.wait_ms >= end.first_event_ms && end.total_ms >= end.wait_ms);
  assert.equal(h.svc.messageRequests[0].headers.authorization, `Bearer ${KEY}`, "the start command's key, not the environment's");
  assert.match(fs.readFileSync(path.join(h.home, "calls.jsonl"), "utf8"), /snapshot_project/);

  // Neither the events nor the log ever hold the key.
  assert.ok(!h.stdout.includes("MAINKEY") && !h.stderr.includes("MAINKEY"));
  assert.ok(!h.stdout.includes("WRONGKEY") && !h.stderr.includes("WRONGKEY"));
  assert.match(h.stderr, /env_removed/);

  const kids = childrenOf(h.proc.pid);
  assert.equal(kids.length, 1, "one ae-mentor");
  h.cmd({ type: "stop" });
  assert.equal(await h.exited, 0);
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(alive(h.proc.pid), false);
  for (const k of kids) assert.equal(alive(k), false, "ae-mentor stopped too");
});

test("a second send while a turn is in flight is refused with busy", async () => {
  const h = await helper();
  h.start();
  await h.next("ready");
  h.svc.script(reply([text("Slow answer.")], { delayMs: 400 }));
  const at = h.events.length;
  h.cmd({ type: "send", text: "/ease-mentor", kind: "start" });
  await h.next("turn_start", at);
  h.cmd({ type: "send", text: "Hello?", kind: "typed" });
  const busy = await h.next("error", at);
  assert.deepEqual(busy, { type: "error", kind: "busy", message: "" });
  const end = await h.next("turn_end", at);
  assert.equal(end.ok, true);
  assert.equal(h.events.slice(at).filter((e) => e.type === "turn_end").length, 1);
  h.cmd({ type: "stop" });
  assert.equal(await h.exited, 0);
});

test("a service fault: the error event with its fixed message, then a failed turn_end", async () => {
  const h = await helper();
  h.start();
  await h.next("ready");
  h.svc.script(failure(401, "authentication_error", `invalid x-api-key ${KEY}`));
  const at = h.events.length;
  h.cmd({ type: "send", text: "/ease-mentor", kind: "start" });
  const end = await h.next("turn_end", at);
  const err = h.events.slice(at).find((e) => e.type === "error");
  assert.deepEqual(err, { type: "error", kind: "not_signed_in", message: MESSAGES.not_signed_in });
  assert.equal(end.ok, false);
  assert.ok(!h.events.slice(at).some((e) => e.type === "tool_result"));
  assert.ok(!h.stdout.includes("MAINKEY") && !h.stderr.includes("MAINKEY"));
  h.proc.stdin.end(); // closing stdin stops it too
  assert.equal(await h.exited, 0);
});

test("another settings file is reported in ready; a bad one or a remote base_url fails to start", async () => {
  const h = await helper();
  const alt = path.join(h.home, "alt-settings.json");
  fs.writeFileSync(alt, JSON.stringify({ ...JSON.parse(fs.readFileSync(path.join(HELPER_DIR, "settings.json"), "utf8")), effort: "high" }));
  h.start({ settings_file: alt });
  const ready = await h.next("ready");
  assert.equal(ready.effort, "high");
  assert.equal(ready.settings_file, alt);
  assert.notEqual(ready.settings_hash, loadSettings().hash);
  h.cmd({ type: "stop" });
  await h.exited;

  const bad = await helper();
  fs.writeFileSync(path.join(bad.home, "bad.json"), JSON.stringify({ version: 2 }));
  bad.start({ settings_file: path.join(bad.home, "bad.json") });
  assert.deepEqual(await bad.next("error"), { type: "error", kind: "start_failed", message: MESSAGES.start_failed, during: "start" });
  bad.cmd({ type: "send", text: "/ease-mentor" });
  const end = await bad.next("turn_end");
  assert.equal(end.ok, false);
  bad.cmd({ type: "stop" });
  await bad.exited;

  const remote = await helper();
  remote.start({ base_url: "https://example.com" });
  assert.equal((await remote.next("error")).kind, "start_failed");
  assert.match(remote.stderr, /base_url must be on this Mac/);
  remote.cmd({ type: "stop" });
  await remote.exited;
});

test("ae-mentor can't start: start_failed at start and on the next send, no service request", async () => {
  const h = await helper();
  const cfg = path.join(h.home, ".mcp.json");
  fs.writeFileSync(cfg, JSON.stringify({ mcpServers: { "ae-mentor": { command: "node", args: [path.join(h.home, "missing-server.mjs")] } } }));
  h.start({ mcp_config: cfg });
  // The start command's own error says so (during: "start"), so the adapter can tell it from a
  // turn's error by its source (review S5); the turn's error doesn't carry it.
  assert.deepEqual(await h.next("error"), { type: "error", kind: "start_failed", message: MESSAGES.start_failed, during: "start" });
  const at = h.events.length;
  h.cmd({ type: "send", text: "/ease-mentor", kind: "start" });
  const end = await h.next("turn_end", at);
  assert.equal(end.ok, false);
  assert.deepEqual(h.events.slice(at).find((e) => e.type === "error"), { type: "error", kind: "start_failed", message: MESSAGES.start_failed });
  assert.equal(h.svc.requests.length, 0, "no service request without the mentor's server");
  h.cmd({ type: "stop" });
  assert.equal(await h.exited, 0);
});

test("unknown commands and lines that aren't JSON are refused without echoing them", async () => {
  const h = await helper();
  h.proc.stdin.write(`not json ${KEY}\n`);
  h.cmd({ type: "dance" });
  assert.deepEqual(await h.next("error"), { type: "error", kind: "bad_command", message: "" });
  assert.ok(!h.stderr.includes("MAINKEY"));
  h.cmd({ type: "stop" });
  await h.exited;
});

test("keychain false (tests only, with a local base_url): no Keychain read; no key means not_signed_in, no request", async () => {
  const h = await helper();
  h.start({ key: undefined, keychain: false });
  await h.next("ready");
  assert.match(h.stderr, /"event":"keychain_off"/);
  const at = h.events.length;
  h.cmd({ type: "send", text: "/ease-mentor", kind: "start" });
  const end = await h.next("turn_end", at);
  assert.equal(end.ok, false);
  assert.equal(h.events.slice(at).find((e) => e.type === "error").kind, "not_signed_in");
  assert.equal(h.svc.requests.length, 0);
  h.cmd({ type: "stop" });
  await h.exited;

  // Without a local base_url it's refused, so the panel's path can't turn the Keychain off.
  const remote = await helper();
  remote.start({ base_url: undefined, keychain: false });
  assert.deepEqual(await remote.next("error"), { type: "error", kind: "start_failed", message: MESSAGES.start_failed, during: "start" });
  assert.match(remote.stderr, /keychain false needs a local base_url/);
  remote.cmd({ type: "stop" });
  await remote.exited;
});
