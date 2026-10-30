// The option A adapter (spec 013 T018, contracts/helper-protocol.md, spec 003's
// contracts/mentor-adapter.md): a fake helper process for the protocol's edges, then the real
// helper against T005's fake service for one turn end to end. No real API call is ever made.
"use strict";
const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { EventEmitter } = require("events");
const { execFileSync, spawn: realSpawn } = require("child_process");
const { pathToFileURL } = require("url");
const api = require("../lib/adapter-api.js");
const b1 = require("../lib/adapter-claude-code.js");
const { withStartFields } = require("../dev/start-fields.js");

const { createAdapter, HELPER_DIR, HELPER_PATH } = api;
const CONFIG = { runtime: "a", node_path: "/opt/homebrew/bin/node", repo_path: "/repo", home: "/home/u/AEMentor" };
const UUID = "33333333-3333-4333-8333-333333333333";
const EVENTS = ["turn_start", "text_delta", "text", "tool_call", "tool_result", "turn_end", "error", "exit", "skill_loaded"];

function fakeChild() {
  const c = new EventEmitter();
  c.stdout = new EventEmitter();
  c.stderr = new EventEmitter();
  c.written = [];
  c.signals = [];
  c.stdin = new EventEmitter();
  c.stdin.write = (s) => c.written.push(s);
  c.stdin.end = () => { c.stdinEnded = true; };
  c.kill = (sig) => { c.signals.push(sig); if (sig === "SIGTERM" && !c.ignoreTerm) setImmediate(() => c.emit("close", 0)); };
  c.say = (obj) => c.stdout.emit("data", JSON.stringify(obj) + "\n");
  c.commands = () => c.written.join("").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  return c;
}

function harness(extra, config) {
  let clock = 1000;
  const timers = [];
  const spawned = [];
  const events = [];
  const logs = [];
  const adapter = createAdapter(config || CONFIG, Object.assign({
    spawn: (cmd, args, opts) => { const c = fakeChild(); spawned.push({ cmd, args, opts, child: c }); return c; },
    now: () => clock,
    setTimeout: (fn, ms) => { const t = { fn, ms }; timers.push(t); return t; },
    clearTimeout: (t) => { if (t) t.cleared = true; },
    env: { HOME: "/home/u", PATH: "/usr/local/bin:/usr/bin", ANTHROPIC_API_KEY: "sk-ant-api03-NOTFORTHEHELPER_xx", AE_MENTOR_HOME: "/x", SECRET: "s" },
    randomUUID: () => UUID,
    log: (e) => logs.push(e),
  }, extra));
  for (const type of EVENTS) adapter.on(type, (e) => events.push(e));
  return { adapter, spawned, events, logs, timers, child: () => spawned[0].child, tick: (ms) => { clock += ms; } };
}

const brief = (e) => [e.type, e.type === "error" ? e.kind : e.type === "turn_end" ? e.ok : e.code];
const HELPER_END = { ok: true, cost_usd: 0.012, wait_ms: 1, first_event_ms: 1, total_ms: 2, kind: "start", runtime: "a", model: "claude-opus-5-5", effort: "medium", settings_hash: "h", tokens: { input: 10, cache_write: 0, cache_read: 0, output: 5 }, other_model: false, steps: 1, skill: "ease-mentor", prompt_hash: "p" };

test("the same interface as the B1 adapter", () => {
  assert.deepEqual(Object.keys(createAdapter(CONFIG, { spawn: fakeChild })).sort(), Object.keys(b1.createAdapter({}, { spawn: fakeChild })).sort());
  assert.equal(HELPER_PATH, path.join(HELPER_DIR, "main.mjs"));
  assert.ok(fs.existsSync(HELPER_PATH));
});

test("start spawns node on the helper with only PATH and HOME, and sends the start command", () => {
  const h = harness();
  const id = h.adapter.start();
  assert.equal(id, UUID);
  const { cmd, args, opts } = h.spawned[0];
  assert.equal(cmd, CONFIG.node_path);
  assert.deepEqual(args, [HELPER_PATH]);
  assert.equal(opts.cwd, HELPER_DIR);
  assert.deepEqual(opts.env, { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", HOME: "/home/u" }, "nothing else inherited: no key, no AE_MENTOR_*");
  assert.deepEqual(h.child().commands(), [{
    type: "start",
    session_id: UUID,
    resume: false,
    home: "/home/u/AEMentor",
    mcp_config: "/repo/.mcp.json",
    skills_dir: "/repo/.claude/skills",
  }]);
  const start = h.child().commands()[0];
  for (const f of ["base_url", "key", "request_log", "settings_file", "fixture_env"]) assert.equal(f in start, false, `${f} is never sent by the adapter`);
});

test("TZ is passed when set; home defaults to the learner home", () => {
  const h = harness({ env: { HOME: "/home/u", TZ: "America/Denver" } }, { runtime: "a", node_path: "/n/node", repo_path: "/repo" });
  h.adapter.start();
  assert.deepEqual(h.spawned[0].opts.env, { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", HOME: "/home/u", TZ: "America/Denver" });
  assert.equal(h.child().commands()[0].home, path.join(os.homedir(), "Library", "Application Support", "AEMentor"), "as config.js's defaultHome");
  const set = harness({ env: { HOME: "/home/u", AE_MENTOR_HOME: "/tmp/learner" } }, { runtime: "a", node_path: "/n/node", repo_path: "/repo" });
  set.adapter.start();
  assert.equal(set.child().commands()[0].home, "/tmp/learner", "in the start command, never the helper's environment");
  assert.equal("AE_MENTOR_HOME" in set.spawned[0].opts.env, false);
});

test("a resumed lesson sends its stored id with resume true", () => {
  const h = harness();
  const id = h.adapter.start({ resumeSessionId: "44444444-4444-4444-8444-444444444444" });
  assert.equal(id, "44444444-4444-4444-8444-444444444444");
  assert.equal(h.child().commands()[0].session_id, id);
  assert.equal(h.child().commands()[0].resume, true);
});

test("send goes straight to the helper, even before ready; a second send while busy throws BUSY", () => {
  const h = harness();
  h.adapter.start();
  h.adapter.send("/ease-mentor", "start");
  assert.deepEqual(h.child().commands()[1], { type: "send", text: "/ease-mentor", kind: "start" });
  assert.deepEqual(h.events.map(brief), [["turn_start", undefined]]);
  assert.equal(h.events[0].kind, "start");
  assert.equal(h.adapter.busy(), true);
  assert.throws(() => h.adapter.send("again", "check"), (e) => e.code === "BUSY");
  h.child().say({ type: "turn_start", kind: "start", at: "x" });
  assert.equal(h.events.filter((e) => e.type === "turn_start").length, 1, "the helper's turn_start isn't shown twice");
});

test("a turn: events re-emitted, timings from send, the helper's fields kept, start_ms on the first turn only", () => {
  const h = harness();
  h.adapter.start();
  h.tick(400);
  h.child().say({ type: "ready", session_id: UUID, runtime: "a", model: "claude-opus-5-5", effort: "medium", settings_hash: "h", skill: null });
  h.adapter.send("/ease-mentor", "start");
  h.tick(1500);
  h.child().say({ type: "tool_call", id: "t1", name: "snapshot_project", input: {} });
  h.child().say({ type: "tool_result", id: "t1", name: "snapshot_project", ok: true, text: "{}", json: {}, images: [] });
  h.tick(2000);
  // One line split across two chunks, and two lines in one.
  const line = JSON.stringify({ type: "text_delta", text: "Your Title " }) + "\n";
  h.child().stdout.emit("data", line.slice(0, 10));
  h.child().stdout.emit("data", line.slice(10) + JSON.stringify({ type: "text", text: "Your Title moves." }) + "\n");
  h.child().say({ type: "skill_loaded", skill: "ease-mentor" });
  h.tick(500);
  h.child().say(Object.assign({ type: "turn_end" }, HELPER_END));
  assert.deepEqual(h.events.map((e) => e.type), ["turn_start", "tool_call", "tool_result", "text_delta", "text", "skill_loaded", "turn_end"]);
  assert.deepEqual(h.events[1], { type: "tool_call", id: "t1", name: "snapshot_project", input: {} });
  assert.equal(h.events[3].text, "Your Title ");
  const end = h.events.at(-1);
  assert.equal(end.ok, true);
  assert.equal(end.kind, "start");
  assert.equal(end.first_event_ms, 1500, "the adapter's own clock, from send");
  assert.equal(end.wait_ms, 3500);
  assert.equal(end.total_ms, 4000);
  assert.equal(end.cost_usd, 0.012);
  assert.equal(end.start_ms, 400, "spawn to ready");
  assert.equal(end.error_kind, null);
  for (const f of ["runtime", "model", "effort", "settings_hash", "tokens", "other_model", "steps", "skill", "prompt_hash"]) assert.deepEqual(end[f], HELPER_END[f], f);
  assert.equal(h.adapter.busy(), false);

  h.adapter.send("Check my work.", "check");
  h.child().say(Object.assign({ type: "turn_end" }, HELPER_END, { kind: "check" }));
  assert.equal("start_ms" in h.events.at(-1), false, "a lesson's first turn only");
});

test("start_failed in place of ready ends starting: shown when no turn is waiting, no start_ms", () => {
  const h = harness();
  h.adapter.start();
  h.child().say({ type: "error", kind: "start_failed", message: "The mentor couldn't start. Close and reopen the panel; if it happens again, check setup.", during: "start" });
  assert.deepEqual(h.events.map(brief), [["error", "start_failed"]]);
  h.adapter.send("/ease-mentor", "start"); // the helper tries ae-mentor again on this send
  h.child().say({ type: "error", kind: "start_failed", message: "m" });
  h.child().say(Object.assign({ type: "turn_end" }, HELPER_END, { ok: false, cost_usd: 0 }));
  const end = h.events.at(-1);
  assert.equal(end.ok, false);
  assert.equal(end.error_kind, "start_failed");
  assert.equal("start_ms" in end, false);
});

test("start_failed in place of ready while the first turn waits: shown once, by the turn", () => {
  const h = harness();
  h.adapter.start();
  h.adapter.send("/ease-mentor", "start");
  h.child().say({ type: "error", kind: "start_failed", message: "m", during: "start" }); // the start's
  h.child().say({ type: "error", kind: "start_failed", message: "m" }); // the turn's
  h.child().say(Object.assign({ type: "turn_end" }, HELPER_END, { ok: false }));
  assert.deepEqual(h.events.map(brief), [["turn_start", undefined], ["error", "start_failed"], ["turn_end", false]]);
});

test("which start_failed is hidden goes by its source, not its timing (review S5)", () => {
  // A turn's own start_failed while the helper is still starting is shown; the start's arrives
  // later, after that turn ended, and is shown too (nothing else will report it).
  const h = harness();
  h.adapter.start();
  h.adapter.send("/ease-mentor", "start");
  h.child().say({ type: "error", kind: "start_failed", message: "m" }); // the turn's, before the start's
  h.child().say(Object.assign({ type: "turn_end" }, HELPER_END, { ok: false }));
  h.child().say({ type: "error", kind: "start_failed", message: "m", during: "start" });
  assert.deepEqual(h.events.map(brief), [["turn_start", undefined], ["error", "start_failed"], ["turn_end", false], ["error", "start_failed"]]);
  assert.equal(h.events[2].error_kind, "start_failed");

  // A start error while a turn waits is hidden whatever the turn reports.
  const k = harness();
  k.adapter.start();
  k.adapter.send("/ease-mentor", "start");
  k.child().say({ type: "error", kind: "not_signed_in", message: "m" });
  k.child().say({ type: "error", kind: "start_failed", message: "m", during: "start" });
  k.child().say(Object.assign({ type: "turn_end" }, HELPER_END, { ok: false }));
  assert.deepEqual(k.events.map(brief), [["turn_start", undefined], ["error", "not_signed_in"], ["turn_end", false]]);
  assert.ok(k.logs.some((l) => l.event === "start_failed_during_turn"));
});

test("not_signed_in can come on any send; the lesson goes on", () => {
  const h = harness();
  h.adapter.start();
  h.child().say({ type: "ready" });
  for (let i = 0; i < 2; i++) {
    h.adapter.send("x", "ask");
    h.child().say({ type: "error", kind: "not_signed_in", message: "m" });
    h.child().say(Object.assign({ type: "turn_end" }, HELPER_END, { ok: false, cost_usd: 0 }));
  }
  assert.deepEqual(h.events.map(brief), [["turn_start", undefined], ["error", "not_signed_in"], ["turn_end", false], ["turn_start", undefined], ["error", "not_signed_in"], ["turn_end", false]]);
  assert.equal(h.events[2].error_kind, "not_signed_in");
});

test("bad_command, not_implemented and busy are logged, never shown; a bad line is logged, not echoed", () => {
  const h = harness();
  h.adapter.start();
  for (const kind of ["bad_command", "not_implemented", "busy"]) h.child().say({ type: "error", kind, message: "" });
  h.child().stdout.emit("data", "not json sk-ant-api03-LEAKED_abcdefghijk\n");
  h.child().say({ type: "mystery" });
  assert.deepEqual(h.events, []);
  assert.deepEqual(h.logs.map((l) => l.event), ["helper_error", "helper_error", "helper_error", "bad_line", "unknown_event"]);
  assert.doesNotMatch(JSON.stringify(h.logs), /LEAKED|not json/);
});

test("the helper exiting mid-turn: process_exited, then turn_end false, then exit", () => {
  const h = harness();
  h.adapter.start();
  h.child().say({ type: "ready" });
  h.adapter.send("x", "check");
  h.child().emit("close", 1);
  assert.deepEqual(h.events.slice(1).map(brief), [["error", "process_exited"], ["turn_end", false], ["exit", 1]]);
  assert.equal(h.events[2].error_kind, "process_exited");
  assert.throws(() => h.adapter.send("again", "check"), (e) => e.code === "NOT_STARTED");
});

test("the helper exiting between turns: exit only", () => {
  const h = harness();
  h.adapter.start();
  h.child().emit("close", 0);
  assert.deepEqual(h.events.map(brief), [["exit", 0]]);
});

test("spawn failing, now or later, is start_failed", () => {
  const h = harness({ spawn: () => { throw new Error("ENOENT /opt/homebrew/bin/node"); } });
  h.adapter.start();
  assert.deepEqual(h.events.map(brief), [["error", "start_failed"]]);
  assert.doesNotMatch(h.events[0].message, /ENOENT|homebrew/, "no path in what the panel may show");
  assert.throws(() => h.adapter.send("x", "start"), (e) => e.code === "NOT_STARTED");

  const later = harness();
  later.adapter.start();
  later.adapter.send("x", "start");
  later.child().emit("error", Object.assign(new Error("spawn ENOENT"), { code: "ENOENT" }));
  later.child().emit("close", -2);
  assert.deepEqual(later.events.slice(1).map(brief), [["error", "start_failed"], ["turn_end", false], ["exit", -2]]);
});

test("stop sends stop, ends stdin and terminates; safe twice; no error; SIGKILL if it lingers", async () => {
  const h = harness();
  h.adapter.start();
  h.adapter.send("x", "check");
  h.adapter.stop();
  h.adapter.stop();
  const c = h.child();
  assert.deepEqual(c.commands().at(-1), { type: "stop" });
  assert.equal(c.stdinEnded, true);
  assert.deepEqual(c.signals, ["SIGTERM"]);
  await new Promise((r) => setImmediate(r));
  assert.ok(!h.events.some((e) => e.type === "error"));
  assert.deepEqual(h.events.slice(-2).map((e) => e.type), ["turn_end", "exit"]);
  const kill = h.timers.find((t) => t.ms === api.KILL_AFTER_MS);
  assert.equal(kill.cleared, true, "closed in time: no SIGKILL");

  const stubborn = harness();
  stubborn.adapter.start();
  stubborn.child().ignoreTerm = true;
  stubborn.adapter.stop();
  stubborn.timers.find((t) => t.ms === api.KILL_AFTER_MS).fn();
  assert.deepEqual(stubborn.child().signals, ["SIGTERM", "SIGKILL"]);
});

test("a write to a helper that's gone doesn't throw into the page", () => {
  const h = harness();
  h.adapter.start();
  h.child().stdin.emit("error", Object.assign(new Error("write EPIPE"), { code: "EPIPE" }));
  assert.ok(h.logs.some((l) => l.event === "stdin_error" && l.code === "EPIPE"));
});

test("the adapter's backstop: a helper that never ends a turn is stopped, with the start-again wording (review S6)", async () => {
  const h = harness();
  h.adapter.start();
  h.adapter.send("x", "check");
  const t = h.timers.find((x) => x.ms === api.BACKSTOP_MS);
  assert.ok(api.BACKSTOP_MS > 5 * 60 * 1000, "after the helper's own 5-minute timeout");
  t.fn();
  // process_exited: "The mentor stopped unexpectedly. Start the lesson again." The helper is
  // stopped, so its exit closes the lesson and the panel offers Start again; never "Try again"
  // followed by "the mentor isn't running".
  assert.deepEqual(h.events.slice(1).map(brief), [["error", "process_exited"], ["turn_end", false]]);
  assert.equal(h.events[2].error_kind, "process_exited");
  assert.ok(h.logs.some((l) => l.event === "backstop_timeout"));
  assert.deepEqual(h.child().commands().at(-1), { type: "stop" });
  h.child().say(Object.assign({ type: "turn_end" }, HELPER_END));
  assert.equal(h.events.filter((e) => e.type === "turn_end").length, 1, "a late turn_end is ignored");
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(h.events.at(-1), { type: "exit", code: 0 }, "the exit that closes the lesson");
  assert.throws(() => h.adapter.send("again", "check"), (e) => e.code === "NOT_STARTED");
});

// ---------- the real helper, against T005's fake service ----------

const REPO = path.resolve(__dirname, "..", "..");
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return false; } };
const childrenOf = (pid) => {
  try { return execFileSync("/usr/bin/pgrep", ["-P", String(pid)], { encoding: "utf8" }).trim().split("\n").filter(Boolean).map(Number); } catch (e) { return []; }
};
const tmpDirs = [];
after(() => { for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true }); });

test("the real helper: one easing turn on a fixture, then stop leaves no helper and no ae-mentor", { timeout: 60000 }, async () => {
  const fake = await import(pathToFileURL(path.join(HELPER_DIR, "test", "fake-service.mjs")).href);
  const svc = await fake.startFakeService();
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-adapter-"));
  tmpDirs.push(home);
  const state = path.join(home, "fixture-state.json");
  fs.writeFileSync(state, JSON.stringify({ project: path.join(REPO, "product", "evals", "easing", "fixtures", "before.json") }));
  svc.script(
    fake.reply([fake.thinking("", "s1"), fake.text("Let me look."), fake.toolUse("snapshot_project", {}, "tu_s")], { stop_reason: "tool_use" }),
    fake.reply([fake.text("Your Title moves at one speed.")]),
  );
  let helperProc = null;
  // Dev-only, as panel/dev/drive.js --fault does: the fake service's address and a stand-in key are
  // added to the start command outside the adapter, which never sends either.
  const spawn = withStartFields((cmd, args, opts) => (helperProc = realSpawn(cmd, args, opts)), {
    base_url: svc.url,
    key: "sk-ant-api03-FAKEFORTESTS_abcdefghij",
    fixture_env: { AE_MENTOR_FIXTURE_STATE: state },
  });
  const adapter = createAdapter({ runtime: "a", node_path: process.execPath, repo_path: REPO, home }, { spawn });
  const events = [];
  const waitFor = (type) => new Promise((resolve) => adapter.on(type, resolve));
  for (const type of EVENTS) adapter.on(type, (e) => events.push(e));
  const ended = waitFor("turn_end");
  adapter.start();
  adapter.send("/ease-mentor", "start");
  const end = await ended;
  try {
    assert.equal(end.ok, true, JSON.stringify(events.filter((e) => e.type === "error")));
    assert.deepEqual(events.map((e) => e.type).filter((t, i, a) => t !== "text_delta" || a[i - 1] !== "text_delta"),
      ["turn_start", "text_delta", "text", "tool_call", "tool_result", "text_delta", "text", "turn_end"]);
    const result = events.find((e) => e.type === "tool_result");
    assert.equal(result.name, "snapshot_project");
    assert.equal(result.ok, true);
    assert.equal(typeof result.json, "object");
    assert.equal(end.runtime, "a");
    assert.equal(end.skill, "ease-mentor");
    assert.equal(end.steps, 2);
    assert.equal(typeof end.start_ms, "number");
    assert.ok(end.first_event_ms >= 0 && end.first_event_ms <= end.total_ms);
    assert.equal(svc.messageRequests.length, 2);
    assert.equal(svc.messageRequests[0].headers["x-api-key"] || svc.messageRequests[0].headers.authorization.replace("Bearer ", ""), "sk-ant-api03-FAKEFORTESTS_abcdefghij");
    assert.match(fs.readFileSync(path.join(home, "calls.jsonl"), "utf8"), /snapshot_project/, "ae-mentor ran with the start command's home");

    const kids = childrenOf(helperProc.pid);
    assert.ok(kids.length >= 1, "ae-mentor was running under the helper");
    const exited = waitFor("exit");
    adapter.stop();
    await exited;
    await new Promise((r) => setTimeout(r, 300));
    assert.equal(alive(helperProc.pid), false);
    for (const k of kids) assert.equal(alive(k), false, "ae-mentor stopped too");
  } finally {
    adapter.stop();
    await svc.close();
  }
});
