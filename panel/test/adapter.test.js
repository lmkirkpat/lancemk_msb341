"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");
const { createAdapter, MENTOR_TOOLS, PREFIX } = require("../lib/adapter-claude-code.js");

const CONFIG = { claude_path: "/home/u/.local/bin/claude", node_path: "/opt/homebrew/bin/node", repo_path: "/repo" };
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
  assert.equal(opts.cwd, "/repo");
  assert.equal(opts.env.PATH, "/home/u/.local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin");
  assert.equal(opts.env.HOME, "/home/u");
  assert.deepEqual(args.slice(args.indexOf("--session-id"), args.indexOf("--session-id") + 2), ["--session-id", id]);
  for (const f of ["--print", "--verbose", "--include-partial-messages", "--strict-mcp-config"]) assert.ok(args.includes(f), f);
  assert.equal(args[args.indexOf("--input-format") + 1], "stream-json");
  assert.equal(args[args.indexOf("--output-format") + 1], "stream-json");
  assert.equal(args[args.indexOf("--max-turns") + 1], "12");
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
