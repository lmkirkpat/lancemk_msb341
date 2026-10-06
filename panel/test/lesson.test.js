"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { createStreamParser } = require("../lib/stream.js");
const { initialLesson, reduceLesson, stageOf } = require("../lib/lesson.js");

function replay(view, file) {
  let v = view;
  const p = createStreamParser((e) => { v = reduceLesson(v, e); });
  p.push(fs.readFileSync(path.join(__dirname, "fixtures", file), "utf8"));
  p.end();
  return v;
}

const diff = (json, ok = true) => ({ type: "tool_result", name: "diff_since_last", ok, json });
const partial = {
  comp_matches: true,
  targets: [
    { label: "Title › Position 0.5–1.5 s", result: "eased_by_demo" },
    { label: "Title › Position 1.5–3 s", result: "eased_by_learner" },
    { label: "Title › Scale 0.5–1.5 s", result: "still_linear" },
  ],
  unexpected_changes: ["Subtitle › Opacity was changed (not part of this lesson)"],
  summary: { learner_eased: 1, still_linear: 1, total_for_learner: 2 },
  passed: false,
};

test("the recorded show-me and check turns: demo made, one failed check, demo row credited", () => {
  let v = replay(initialLesson(), "stream-opening.jsonl");
  assert.deepEqual(v, initialLesson());
  v = replay(v, "stream-show-me.jsonl");
  assert.equal(v.demo_made, true);
  v = replay(v, "stream-check.jsonl");
  assert.equal(v.checks, 1);
  assert.equal(v.passed, false);
  assert.equal(v.check_list.rows[0].shown, "demo (mentor)");
  assert.deepEqual(v.check_list.rows.slice(1).map((r) => r.shown), ["linear ✗", "linear ✗", "linear ✗"]);
  assert.equal(v.check_list.summary, "0 of 3 yours eased · 3 still linear");
});

test("partial attempt: rows, outside changes listed separately, summary", () => {
  const v = reduceLesson(initialLesson(), diff(partial));
  assert.deepEqual(v.check_list.rows.map((r) => r.shown), ["demo (mentor)", "you ✓", "linear ✗"]);
  assert.deepEqual(v.check_list.outside, ["Subtitle › Opacity was changed (not part of this lesson)"]);
  assert.equal(v.check_list.summary, "1 of 2 yours eased · 1 still linear");
  assert.equal(v.passed, false);
});

test("a passing check sets passed", () => {
  const v = reduceLesson(initialLesson(), diff({ ...partial, targets: partial.targets.slice(0, 2), summary: { learner_eased: 1, still_linear: 0, total_for_learner: 1 }, passed: true }));
  assert.equal(v.passed, true);
  assert.equal(v.check_list.passed, true);
});

test("another comp, AE unreachable, or unreadable output never replace the list; the old one goes stale", () => {
  const before = reduceLesson(initialLesson(), diff(partial));
  for (const ev of [
    diff({ comp_matches: false, lesson_comp: "Mentor Practice", targets: [] }),
    { type: "tool_result", name: "diff_since_last", ok: false, text: "AE_UNREACHABLE: can't reach After Effects" },
    diff(undefined),
  ]) {
    const v = reduceLesson(before, ev);
    assert.equal(v.checks, 1);
    assert.equal(v.check_list.rows.length, 3);
    assert.equal(v.check_list.stale, true);
    assert.equal(before.check_list.stale, false, "pure: the old view isn't changed");
  }
  assert.equal(reduceLesson(initialLesson(), diff({ comp_matches: false })).check_list, null);
});

test("an unknown result value is shown as not checked, never as a pass", () => {
  const v = reduceLesson(initialLesson(), diff({ ...partial, targets: [{ label: "X", result: "mystery" }] }));
  assert.equal(v.check_list.rows[0].shown, "not checked");
  assert.equal(v.check_list.rows[0].ok, false);
});

test("a failed set_ease (DEMO_USED) doesn't count as a demo; record_lesson ok sets recorded", () => {
  let v = reduceLesson(initialLesson(), { type: "tool_result", name: "set_ease", ok: false, text: "DEMO_USED" });
  assert.equal(v.demo_made, false);
  v = reduceLesson(v, { type: "tool_result", name: "record_lesson", ok: true, json: { saved: true } });
  assert.equal(v.recorded, true);
});

test("events other than tool results leave the view unchanged", () => {
  const v = initialLesson();
  assert.equal(reduceLesson(v, { type: "text_delta", text: "Show me again" }), v);
  assert.equal(reduceLesson(v, { type: "tool_call", name: "set_ease" }), v);
});

const states = (v) => stageOf(v).steps.map((s) => s.state);

test("stage: I do before anything, We do after the demo, You do after a check, done on a pass", () => {
  const v0 = initialLesson();
  assert.equal(stageOf(v0).stage, "i_do");
  assert.deepEqual(states(v0), ["current", "upcoming", "upcoming"]);
  const v1 = { ...v0, demo_made: true };
  assert.equal(stageOf(v1).stage, "we_do");
  assert.deepEqual(states(v1), ["done", "current", "upcoming"]);
  const v2 = { ...v1, checks: 1 };
  assert.equal(stageOf(v2).stage, "you_do");
  assert.deepEqual(states(v2), ["done", "done", "current"]);
  const v3 = { ...v2, passed: true };
  assert.equal(stageOf(v3).stage, "done");
  assert.deepEqual(states(v3), ["done", "done", "done"]);
});

test("stage: checking without a demo skips I do", () => {
  assert.deepEqual(states({ ...initialLesson(), checks: 1 }), ["skipped", "done", "current"]);
  assert.deepEqual(states({ ...initialLesson(), checks: 2, passed: true }), ["skipped", "done", "done"]);
});

test("stage labels are plain words", () => {
  assert.deepEqual(stageOf(null).steps.map((s) => s.label), ["I do", "We do", "You do"]);
});
