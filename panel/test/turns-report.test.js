// Spec 013 T047: the turn log report, per runtime (FR-029, SC-004, research R8).
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { splitLessons, gaps, summarize, report } = require("../dev/turns.js");

const T0 = Date.parse("2026-11-10T02:00:00.000Z");
// at is the send time (app.js logs turn_start's at), total_ms the turn's length.
const turn = (sec, kind, o) => Object.assign({ at: new Date(T0 + sec * 1000).toISOString(), kind, total_ms: 5000, first_event_ms: 2000, wait_ms: 3000, cost_usd: 0.01, ok: true, lesson_passed: false }, o);

test("new_lesson starts a lesson, as start does; continue stays in the one before", () => {
  const ls = splitLessons([turn(0, "start"), turn(10, "ask"), turn(20, "new_lesson"), turn(30, "check"), turn(40, "continue"), turn(50, "start")]);
  assert.deepEqual(ls.map((l) => l.turns.length), [2, 3, 1]);
});

test("a change of runtime starts a lesson; old lines without runtime are B1", () => {
  const ls = splitLessons([turn(0, "start"), turn(10, "ask", { runtime: "b1" }), turn(20, "ask", { runtime: "a" })]);
  assert.deepEqual(ls.map((l) => [l.runtime, l.turns.length]), [["b1", 2], ["a", 1]]);
});

test("a gap is the next send minus this turn's end, within a lesson; tiny negatives count as 0", () => {
  const ls = splitLessons([turn(0, "start"), turn(25, "ask"), turn(29.9, "ask"), turn(400, "check"), turn(410, "new_lesson")]);
  assert.deepEqual(gaps(ls[0]), [20000, 0, 365100]);
  assert.deepEqual(gaps(ls[1]), []);
});

test("per runtime: SC-004 share and median, cost per lesson, cache read share, gaps over 5 minutes", () => {
  const a = { runtime: "a", tokens: { input: 100, cache_write: 100, cache_read: 800, output: 50 } };
  const s = summarize([
    turn(0, "start"), turn(10, "ask", { first_event_ms: 12000, cost_usd: 0.03 }), turn(20, "check", { lesson_passed: true }),
    turn(100, "new_lesson", a), turn(500, "ask", Object.assign({ cost_usd: 0.05 }, a)), turn(510, "new_lesson", Object.assign({}, a, { tokens: null, cost_usd: null })),
  ]);
  assert.deepEqual(Object.keys(s).sort(), ["a", "b1"]);
  assert.equal(s.b1.turns, 3);
  assert.equal(s.b1.lessons.length, 1);
  assert.equal(s.b1.under, 2);
  assert.equal(s.b1.share, 67);
  assert.equal(s.b1.median_first_ms, 2000);
  assert.equal(s.b1.cost_per_lesson.toFixed(2), "0.05");
  assert.equal(s.b1.cache_read_share, null, "B1 logs no tokens");
  assert.equal(s.a.lessons.length, 2);
  assert.equal(s.a.cost_per_lesson.toFixed(2), "0.03");
  assert.equal(s.a.cache_read_share, 80);
  assert.deepEqual([s.a.gaps_over, s.a.gaps_total], [1, 1]);
  assert.deepEqual([s.b1.gaps_over, s.b1.gaps_total], [0, 2]);
});

test("the report prints a section per runtime and reads the log without changing it", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-report-"));
  const file = path.join(home, "panel-turns.jsonl");
  const lines = [turn(0, "start"), turn(10, "check", { lesson_passed: true }), turn(100, "new_lesson", { runtime: "a", tokens: { input: 1, cache_write: 1, cache_read: 2, output: 1 } })];
  fs.writeFileSync(file, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
  const before = fs.readFileSync(file, "utf8");
  const out = execFileSync(process.execPath, [path.join(__dirname, "..", "dev", "turns.js"), "--home", home], { encoding: "utf8" });
  assert.match(out, /B1 \(including lines with no runtime\)/);
  assert.match(out, /^A$/m);
  assert.match(out, /Cache read share: 50%/);
  assert.equal(fs.readFileSync(file, "utf8"), before);
  assert.equal(typeof report(lines), "string");
});

test("an empty or missing log says so", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-report-"));
  const out = execFileSync(process.execPath, [path.join(__dirname, "..", "dev", "turns.js"), "--home", home], { encoding: "utf8" });
  assert.match(out, /No turns logged yet/);
});
