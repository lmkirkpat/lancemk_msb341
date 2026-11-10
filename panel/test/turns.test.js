"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { appendTurn } = require("../lib/turns.js");

const read = (home) => fs.readFileSync(path.join(home, "panel-turns.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));

test("appends one line per turn with exactly the logged fields", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-turns-"));
  appendTurn({ home }, { at: "2026-10-05T20:00:00.000Z", kind: "check", wait_ms: 9656, first_event_ms: 2229, total_ms: 9684, cost_usd: 0.03, ok: true, lesson_passed: false, text: "secret words" });
  appendTurn({ home }, { kind: "show_me", ok: false });
  const lines = read(home);
  assert.equal(lines.length, 2);
  assert.deepEqual(Object.keys(lines[0]).sort(), ["at", "cost_usd", "first_event_ms", "kind", "lesson_passed", "ok", "runtime", "total_ms", "wait_ms"]);
  assert.equal(lines[0].wait_ms, 9656);
  assert.equal(lines[1].wait_ms, null);
  assert.equal(lines[1].ok, false);
  assert.doesNotMatch(fs.readFileSync(path.join(home, "panel-turns.jsonl"), "utf8"), /secret words/);
});

test("an unknown kind is logged as ask", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-turns-"));
  appendTurn({ home }, { kind: "weird", ok: true });
  assert.equal(read(home)[0].kind, "ask");
});

test("never throws when the folder can't be written", () => {
  assert.equal(appendTurn({ home: "/dev/null/nope" }, { kind: "check", ok: true }), false);
});

// ---------- spec 013 T046: runtime, model, effort, tokens, errors, start-up (FR-029) ----------

test("a B1 line gets runtime b1 and nothing else new", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-turns-"));
  appendTurn({ home }, { kind: "check", ok: true, runtime: "b1", model: "x", tokens: { input: 1 }, error_kind: "timeout", start_ms: 5 });
  appendTurn({ home }, { kind: "check", ok: true });
  const [a, b] = read(home);
  assert.equal(a.runtime, "b1");
  assert.equal(b.runtime, "b1", "a missing runtime is B1");
  assert.deepEqual(Object.keys(a).sort(), ["at", "cost_usd", "first_event_ms", "kind", "lesson_passed", "ok", "runtime", "total_ms", "wait_ms"]);
});

test("an A line carries model, effort, settings hash, tokens, other model, error kind and start-up", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-turns-"));
  appendTurn({ home }, { kind: "new_lesson", ok: true, runtime: "a", model: "claude-opus-5-5", effort: "medium", settings_hash: "06339ff3", tokens: { input: 10, cache_write: 200, cache_read: 3000, output: 40, extra: 9 }, other_model: false, error_kind: null, start_ms: 812, text: "secret words" });
  appendTurn({ home }, { kind: "ask", ok: false, runtime: "a", model: "claude-opus-5-5", tokens: null, other_model: true, error_kind: "timeout" });
  const [a, b] = read(home);
  assert.equal(a.runtime, "a");
  assert.equal(a.model, "claude-opus-5-5");
  assert.equal(a.effort, "medium");
  assert.equal(a.settings_hash, "06339ff3");
  assert.deepEqual(a.tokens, { input: 10, cache_write: 200, cache_read: 3000, output: 40 });
  assert.equal(a.other_model, false);
  assert.equal(a.error_kind, null);
  assert.equal(a.start_ms, 812);
  assert.equal("start_ms" in b, false, "only a lesson's first turn has start-up time");
  assert.equal(b.tokens, null);
  assert.equal(b.other_model, true);
  assert.equal(b.error_kind, "timeout");
  assert.doesNotMatch(fs.readFileSync(path.join(home, "panel-turns.jsonl"), "utf8"), /secret words/);
});

test("free text can't ride in on the new string fields", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-turns-"));
  appendTurn({ home }, { kind: "ask", ok: true, runtime: "a", model: "Please ease my Title layer", effort: { x: 1 }, settings_hash: "a b c", error_kind: "Something broke: details", tokens: { input: "12", output: NaN } });
  const [a] = read(home);
  assert.equal(a.model, null);
  assert.equal(a.effort, null);
  assert.equal(a.settings_hash, null);
  assert.equal(a.error_kind, "other");
  assert.deepEqual(a.tokens, { input: null, cache_write: null, cache_read: null, output: null });
});

test("never throws on a hostile entry", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-turns-"));
  const bad = { get kind() { throw new Error("boom"); } };
  assert.equal(appendTurn({ home }, bad), false);
  assert.equal(appendTurn({ home }, null), false);
});

test("the app passes the adapter's turn_end fields through to the log, with the runtime", async () => {
  const { ready } = require("./app-harness.js");
  const h = await ready({ runtime: "a" });
  h.app.act("start");
  h.adapter().emit("turn_end", { ok: true, kind: "start", cost_usd: 0.02, runtime: "a", model: "m-1", effort: "low", settings_hash: "abc123", tokens: { input: 1, cache_write: 2, cache_read: 3, output: 4 }, other_model: false, error_kind: null, start_ms: 700 });
  const t = h.turns[h.turns.length - 1];
  assert.equal(t.runtime, "a");
  assert.equal(t.model, "m-1");
  assert.equal(t.effort, "low");
  assert.equal(t.settings_hash, "abc123");
  assert.deepEqual(t.tokens, { input: 1, cache_write: 2, cache_read: 3, output: 4 });
  assert.equal(t.other_model, false);
  assert.equal(t.error_kind, null);
  assert.equal(t.start_ms, 700);

  const b = await ready({});
  b.app.act("start");
  b.adapter().emit("turn_end", { ok: true, kind: "start", cost_usd: 0.02 });
  assert.equal(b.turns[b.turns.length - 1].runtime, "b1");
});
