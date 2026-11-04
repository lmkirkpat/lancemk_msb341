"use strict";
const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");
const os = require("os");
const { createAdapter, launchArgs, MENTOR_TOOLS, PREFIX, LEARNER_SETTINGS } = require("../lib/adapter-claude-code.js");
const { ensureRuntime } = require("../lib/runtime.js");

const CONFIG = { claude_path: "/home/u/.local/bin/claude", node_path: "/opt/homebrew/bin/node", repo_path: "/repo", runtime_path: "/home/u/AEMentor/runtime" };
const fixture = (name) => fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");

function fakeChild() {
  const c = new EventEmitter();
  c.stdout = new EventEmitter();
  c.stderr = new EventEmitter();
  c.written = [];
  c.stdin = { write: (s) => c.written.push(s), end: () => { c.stdinEnded = true; } };
  c.kill = (sig) => { c.killed = sig; setImmediate(() => c.emit("close", null)); };
  return c;
}

function harness(extra) {
  let clock = 1000;
  const timers = [];
  const spawned = [];
  const events = [];
  const adapter = createAdapter(CONFIG, Object.assign({
    spawn: (cmd, args, opts) => { const c = fakeChild(); spawned.push({ cmd, args, opts, child: c }); return c; },
    now: () => clock,
    setTimeout: (fn, ms) => { const t = { fn, ms }; timers.push(t); return t; },
    clearTimeout: (t) => { if (t) t.cleared = true; },
    env: { HOME: "/home/u", PATH: "/usr/bin:/bin" },
    randomUUID: () => "11111111-1111-4111-8111-111111111111",
  }, extra));
  for (const type of ["turn_start", "text_delta", "text", "tool_call", "tool_result", "turn_end", "error", "exit"]) {
    adapter.on(type, (e) => events.push(e));
  }
  return { adapter, spawned, events, timers, tick: (ms) => { clock += ms; } };
}

// [type, the field that matters]: error → kind, turn_end → ok, exit → code.
const brief = (e) => [e.type, e.type === "error" ? e.kind : e.type === "turn_end" ? e.ok : e.code];

test("start spawns claude with the contract's arguments, cwd and PATH", () => {
  const h = harness();
  const id = h.adapter.start();
  assert.equal(id, "11111111-1111-4111-8111-111111111111");
  const { cmd, args, opts } = h.spawned[0];
  assert.equal(cmd, CONFIG.claude_path);
  assert.equal(opts.cwd, "/home/u/AEMentor/runtime", "never the repo, so the builder's CLAUDE.md and memory stay out");
  assert.equal(opts.env.PATH, "/home/u/.local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin");
  assert.equal(opts.env.HOME, "/home/u");
  assert.deepEqual(args.slice(args.indexOf("--session-id"), args.indexOf("--session-id") + 2), ["--session-id", id]);
  for (const f of ["--print", "--verbose", "--include-partial-messages", "--strict-mcp-config"]) assert.ok(args.includes(f), f);
  assert.equal(args[args.indexOf("--input-format") + 1], "stream-json");
  assert.equal(args[args.indexOf("--output-format") + 1], "stream-json");
  assert.equal(args[args.indexOf("--max-turns") + 1], "12");
  assert.deepEqual(JSON.parse(args[args.indexOf("--settings") + 1]), { outputStyle: "default" }, "no builder output style in the panel");
});

test("the mentor gets only ToolSearch and the six ae-mentor tools (contract › Guarantees)", () => {
  const h = harness();
  h.adapter.start();
  const { args } = h.spawned[0];
  assert.deepEqual(args.slice(args.indexOf("--tools") + 1, args.indexOf("--tools") + 2), ["ToolSearch"]);
  const allowed = args.slice(args.indexOf("--allowedTools") + 1, args.indexOf("--max-turns"));
  assert.deepEqual(allowed, MENTOR_TOOLS.map((t) => PREFIX + t));
  assert.ok(!args.some((a) => /Bash|Edit|Write|WebFetch|WebSearch|dangerously/i.test(a)));
});

test("resume uses --resume with the stored id", () => {
  const h = harness();
  const id = h.adapter.start({ resumeSessionId: "22222222-2222-4222-8222-222222222222" });
  assert.equal(id, "22222222-2222-4222-8222-222222222222");
  const { args } = h.spawned[0];
  assert.equal(args[args.indexOf("--resume") + 1], id);
  assert.ok(!args.includes("--session-id"));
});

test("send writes one stream-json user line and a second send while busy throws BUSY", () => {
  const h = harness();
  h.adapter.start();
  h.adapter.send("I'm done. Check my work.", "check");
  const c = h.spawned[0].child;
  assert.deepEqual(JSON.parse(c.written[0]), { type: "user", message: { role: "user", content: "I'm done. Check my work." } });
  assert.equal(h.events[0].type, "turn_start");
  assert.equal(h.events[0].kind, "check");
  assert.throws(() => h.adapter.send("again", "check"), (e) => e.code === "BUSY");
});

test("a real recorded turn: events in order, timings and per-turn cost", () => {
  const h = harness();
  h.adapter.start();
  const c = h.spawned[0].child;
  h.adapter.send("I'm done. Check my work.", "check");
  const lines = fixture("stream-check.jsonl").split("\n");
  // 2 s until the first line (a tool call), then everything else.
  h.tick(2000);
  c.stdout.emit("data", lines.slice(0, 8).join("\n") + "\n");
  h.tick(5000);
  c.stdout.emit("data", lines.slice(8).join("\n"));
  const types = h.events.map((e) => e.type);
  assert.ok(types.indexOf("tool_call") < types.indexOf("tool_result"));
  assert.ok(types.indexOf("tool_result") < types.indexOf("text_delta"));
  const end = h.events.find((e) => e.type === "turn_end");
  assert.equal(end.ok, true);
  assert.equal(end.kind, "check");
  assert.equal(end.total_ms, 7000);
  assert.ok(end.first_event_ms <= 2000, `first_event_ms ${end.first_event_ms}`);
  assert.ok(end.wait_ms >= end.first_event_ms);
  assert.ok(Math.abs(end.cost_usd - 0.2192566) < 1e-9, "first turn's cost is the whole total");
  assert.equal(h.adapter.busy(), false);
});

test("cost is per turn when total_cost_usd is cumulative", () => {
  const h = harness();
  h.adapter.start();
  const c = h.spawned[0].child;
  const costs = [];
  h.adapter.on("turn_end", (e) => costs.push(e.cost_usd));
  for (const total of [0.13, 0.19, 0.22]) {
    h.adapter.send("x", "ask");
    c.stdout.emit("data", JSON.stringify({ type: "result", is_error: false, total_cost_usd: total }) + "\n");
  }
  assert.deepEqual(costs.map((v) => Math.round(v * 100) / 100), [0.13, 0.06, 0.03]);
});

test("timeout ends the turn with an error", () => {
  const h = harness();
  h.adapter.start();
  h.adapter.send("x", "check");
  assert.equal(h.timers[0].ms, 5 * 60 * 1000);
  h.timers[0].fn();
  assert.deepEqual(h.events.slice(-2).map(brief), [["error", "timeout"], ["turn_end", false]]);
  assert.equal(h.adapter.busy(), false);
});

test("the process exiting mid-turn reports process_exited, or not_signed_in from stderr", () => {
  for (const [stderr, kind] of [["boom\n", "process_exited"], ["Not logged in. Please run /login\n", "not_signed_in"]]) {
    const h = harness();
    h.adapter.start();
    const c = h.spawned[0].child;
    h.adapter.send("x", "start");
    c.stderr.emit("data", stderr);
    c.emit("close", 1);
    assert.deepEqual(h.events.slice(-3).map(brief), [["error", kind], ["turn_end", false], ["exit", 1]]);
  }
});

test("spawn failure reports start_failed", () => {
  const h = harness({ spawn: () => { throw new Error("ENOENT"); } });
  h.adapter.start();
  assert.equal(h.events[0].kind, "start_failed");
  assert.throws(() => h.adapter.send("x", "start"), (e) => e.code === "NOT_STARTED");
});

test("stop kills the child, is safe twice, and reports no error", async () => {
  const h = harness();
  h.adapter.start();
  const c = h.spawned[0].child;
  h.adapter.send("x", "check");
  h.adapter.stop();
  h.adapter.stop();
  assert.equal(c.killed, "SIGTERM");
  assert.equal(c.stdinEnded, true);
  await new Promise((r) => setImmediate(r));
  assert.ok(!h.events.some((e) => e.type === "error"));
  assert.deepEqual(h.events.slice(-2).map((e) => e.type), ["turn_end", "exit"]);
});

test("with no runtime folder, start refuses rather than run from the repo", () => {
  const spawned = [];
  const events = [];
  const noRuntime = Object.assign({}, CONFIG, { runtime_path: undefined });
  const adapter = createAdapter(noRuntime, { spawn: () => spawned.push(1), env: { HOME: "/home/u" }, randomUUID: () => "id" });
  adapter.on("error", (e) => events.push(e));
  adapter.start();
  assert.equal(spawned.length, 0);
  assert.equal(events[0].kind, "start_failed");
});

// ---------- the tool list (spec 013 FR-042, T065) ----------

const REPO = path.resolve(__dirname, "..", "..");
const allowedIn = (args) => args.slice(args.indexOf("--allowedTools") + 1, args.indexOf("--max-turns"));
const ID = "33333333-3333-4333-8333-333333333333";
// Today's easing launch, written out by hand: the set T049's check holds B1 to.
const EASING_ARGS = (flag) => ["--print", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose",
  "--include-partial-messages", flag, ID, "--mcp-config", ".mcp.json", "--strict-mcp-config", "--tools", "ToolSearch",
  "--allowedTools", "mcp__ae-mentor__read_learner_record", "mcp__ae-mentor__snapshot_project", "mcp__ae-mentor__preview_frame",
  "mcp__ae-mentor__set_ease", "mcp__ae-mentor__diff_since_last", "mcp__ae-mentor__record_lesson", "--max-turns", "12",
  "--settings", LEARNER_SETTINGS];
const asSet = (list) => [...list].sort();

// The real thing: the runtime folder the panel builds, linked to the repo's skills.
const realRuntime = fs.mkdtempSync(path.join(os.tmpdir(), "panel-adapter-runtime-"));
ensureRuntime(REPO, realRuntime);
after(() => fs.rmSync(realRuntime, { recursive: true, force: true }));

test("easing's arguments stay what they were, with the skill named or not, new or resumed", () => {
  for (const flag of ["--session-id", "--resume"]) {
    assert.deepEqual(launchArgs(flag, ID), EASING_ARGS(flag), "no skill");
    assert.deepEqual(launchArgs(flag, ID, { skill: "ease-mentor", runtimePath: realRuntime }), EASING_ARGS(flag), "from easing's SKILL.md");
  }
});

test("each real skill launches with its own tools and nothing else changes", () => {
  const skills = fs.readdirSync(path.join(realRuntime, ".claude", "skills"));
  assert.ok(skills.includes("key-types-mentor") && skills.includes("next-mentor"), skills.join());
  for (const skill of skills) {
    const args = launchArgs("--session-id", ID, { skill, runtimePath: realRuntime });
    const listed = allowedIn(args);
    const front = fs.readFileSync(path.join(realRuntime, ".claude", "skills", skill, "SKILL.md"), "utf8").split("\n").find((l) => l.startsWith("allowed-tools:"));
    assert.deepEqual(listed, front.replace("allowed-tools:", "").split(",").map((t) => t.trim()).filter((t) => t !== "Skill"), skill);
    assert.ok(!listed.includes("Skill"), `${skill}: Skill stays out of B1's list`);
    assert.equal(args[args.indexOf("--tools") + 1], "ToolSearch", skill);
    assert.ok(!args.includes("Skill"), skill);
    const outside = args.filter((a) => !listed.includes(a));
    assert.deepEqual(outside, EASING_ARGS("--session-id").filter((a) => !MENTOR_TOOLS.map((t) => PREFIX + t).includes(a)), `${skill}: only the list differs`);
  }
});

test("key types gets key types' tools, not easing's (the turn 2 denial in research R6)", () => {
  const listed = allowedIn(launchArgs("--session-id", ID, { skill: "key-types-mentor", runtimePath: realRuntime }));
  assert.ok(listed.includes(PREFIX + "key_types_snapshot"));
  assert.ok(!listed.includes(PREFIX + "set_ease"));
  assert.notDeepEqual(asSet(listed), asSet(MENTOR_TOOLS.map((t) => PREFIX + t)));
});

test("the fallback is easing's six: no skill, a bad name, an unreadable or unusable SKILL.md", () => {
  const six = EASING_ARGS("--session-id");
  const noFile = { readFileSync() { throw new Error("ENOENT"); } };
  const content = (text) => ({ readFileSync: () => text });
  const cases = {
    "no options": undefined,
    "empty options": {},
    "a request with no skill": { skill: null, runtimePath: realRuntime },
    "a save with no skill": { skill: undefined, runtimePath: realRuntime },
    "a save with a bad skill": { skill: 7, runtimePath: realRuntime },
    "a path for a name": { skill: "../../../etc-mentor", runtimePath: realRuntime },
    "not a mentor skill": { skill: "sprint-plan", runtimePath: realRuntime },
    "a skill that's gone": { skill: "gone-mentor", runtimePath: realRuntime },
    "no runtime folder": { skill: "key-types-mentor" },
    "a read error": { skill: "key-types-mentor", runtimePath: "/runtime", fs: noFile },
    "no frontmatter": { skill: "key-types-mentor", runtimePath: "/runtime", fs: content("# Key types") },
    "no allowed-tools": { skill: "key-types-mentor", runtimePath: "/runtime", fs: content("---\nname: x\n---\n") },
    "only Skill": { skill: "key-types-mentor", runtimePath: "/runtime", fs: content("---\nallowed-tools: Skill\n---\n") },
  };
  for (const [name, opts] of Object.entries(cases)) assert.deepEqual(launchArgs("--session-id", ID, opts), six, name);
});

test("start({ skill }) launches with that skill's list, read from the runtime folder", () => {
  const h = { spawned: [] };
  const adapter = createAdapter(Object.assign({}, CONFIG, { runtime_path: realRuntime }), {
    spawn: (cmd, args, opts) => { const c = fakeChild(); h.spawned.push({ args, opts, child: c }); return c; },
  });
  adapter.start({ skill: "key-types-mentor" });
  assert.deepEqual(allowedIn(h.spawned[0].args), allowedIn(launchArgs("--session-id", ID, { skill: "key-types-mentor", runtimePath: realRuntime })));
  assert.equal(h.spawned[0].opts.cwd, realRuntime);
});

test("a Continue with the saved skill launches with the same list; an older save gets easing's", () => {
  const spawned = [];
  const make = () => createAdapter(Object.assign({}, CONFIG, { runtime_path: realRuntime }), {
    spawn: (cmd, args) => { const c = fakeChild(); spawned.push(args); return c; },
  });
  make().start({ skill: "offset-mentor" });
  make().start({ resumeSessionId: ID, skill: "offset-mentor" });
  make().start({ resumeSessionId: ID });
  assert.deepEqual(allowedIn(spawned[1]), allowedIn(spawned[0]));
  assert.ok(spawned[1].includes("--resume"));
  assert.deepEqual(allowedIn(spawned[2]), MENTOR_TOOLS.map((t) => PREFIX + t));
});

test("the list doesn't change mid-lesson: a typed /other-skill goes through as words (research R6)", () => {
  const spawned = [];
  const adapter = createAdapter(Object.assign({}, CONFIG, { runtime_path: realRuntime }), {
    spawn: (cmd, args) => { const c = fakeChild(); spawned.push({ args, child: c }); return c; },
    setTimeout: () => ({}), clearTimeout: () => {},
  });
  adapter.start({ skill: "key-types-mentor" });
  adapter.send("/offset-mentor", "ask");
  assert.equal(spawned.length, 1, "no new launch");
  assert.deepEqual(JSON.parse(spawned[0].child.written[0]).message.content, "/offset-mentor");
});
