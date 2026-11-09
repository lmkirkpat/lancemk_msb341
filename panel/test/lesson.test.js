// Spec 007 T007 and T009: the lesson view. Built only from tool results and what the learner sent,
// never from the mentor's wording (FR-014, FR-065).
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { createStreamParser } = require("../lib/stream.js");
const { initialLesson, reduceLesson, stageOf, showsResuming } = require("../lib/lesson.js");
const { rowsOf } = require("../lib/checklist/index.js");
const { COPY } = require("../lib/copy.js");

const ID = (n) => `1/ADBE Transform Group/ADBE Position/${n}`;
const findings = (ns, layer = "Title") => [{ layer, property: "Position", segments: ns.map((n) => ({ id: ID(n), from_time: n, to_time: n + 1, state: "linear" })) }];
const snap = (over) => ({ type: "tool_result", name: "snapshot_project", ok: true, json: Object.assign({ lesson: "new", targets: [ID(1), ID(2)], demo_target: ID(1), findings: findings([1, 2]), focus: null }, over) });
const diff = (over, ok = true) => ({ type: "tool_result", name: "diff_since_last", ok, json: Object.assign({ comp_matches: true, targets: [{ segment_id: ID(1), label: "Title › Position 1–2 s", result: "still_linear" }], unexpected_changes: [], summary: { learner_eased: 0, still_linear: 1, total_for_learner: 1 }, passed: false }, over) });
const sent = (kind) => ({ type: "sent", kind });
const END = { type: "turn_end", ok: true };
const reduce = (v, ...evs) => evs.reduce(reduceLesson, v || initialLesson());
const names = (v) => rowsOf(v.check_list).map((r) => r.subject);
const words = (v) => rowsOf(v.check_list).map((r) => r.word);

function replay(view, file) {
  let v = view;
  const p = createStreamParser((e) => { v = reduceLesson(v, e); });
  p.push(fs.readFileSync(path.join(__dirname, "fixtures", "eval", file), "utf8"));
  p.end();
  return v;
}

// ---------- T007: stage and saved ----------

const states = (v) => stageOf(v).steps.map((s) => s.state);

test("stage labels are Pick, Try, Done", () => {
  assert.deepEqual(stageOf(null).steps.map((s) => s.label), ["Pick", "Try", "Done"]);
});

test("an opening with targets stays on Pick: targets alone don't start Try (FR-014)", () => {
  const v = reduce(null, sent("start"), snap(), END);
  assert.equal(stageOf(v).stage, "pick");
  assert.deepEqual(states(v), ["current", "upcoming", "upcoming"]);
});

test("a first snapshot that returns resumed or continued starts on Try", () => {
  for (const lesson of ["resumed", "continued"]) {
    const v = reduce(null, sent("start"), snap({ lesson }));
    assert.equal(stageOf(v).stage, "try", lesson);
    assert.equal(v.picked_up, true, lesson);
  }
});

test("a later snapshot saying continued doesn't count: a lesson's own second call says that too", () => {
  const v = reduce(null, sent("start"), snap(), snap({ lesson: "continued" }));
  assert.equal(v.picked_up, false);
  assert.equal(stageOf(v).stage, "pick");
  assert.equal(showsResuming(v), false);
});

test("a hand-over's opening starts on Pick: Yes, let's go isn't a reply", () => {
  const v = reduce(null, sent("yes"), snap(), END);
  assert.equal(v.replied, false);
  assert.equal(stageOf(v).stage, "pick");
});

test("Try begins at the first reply, a check or a demo; Continue counts as a reply", () => {
  assert.equal(stageOf(reduce(null, snap(), sent("ask"))).stage, "try");
  assert.equal(stageOf(reduce(null, snap(), diff())).stage, "try");
  assert.equal(stageOf(reduce(null, snap(), { type: "tool_result", name: "set_ease", ok: true, json: {} })).stage, "try");
  assert.equal(reduce(null, sent("continue")).replied, true);
  assert.equal(stageOf({ ...initialLesson(), demo_unknown: true }).stage, "try");
});

test("Done is the check's own passed, all three steps ticked; a later failed check takes it back", () => {
  const v = reduce(null, snap(), diff({ passed: true }));
  assert.equal(stageOf(v).stage, "done");
  assert.deepEqual(states(v), ["done", "done", "done"]);
  assert.equal(stageOf(reduce(v, diff({ passed: false }))).stage, "try");
});

test("a failed set_ease (DEMO_USED) isn't a demo", () => {
  assert.equal(reduce(null, { type: "tool_result", name: "set_ease", ok: false, text: "DEMO_USED" }).demo_made, false);
});

test("the mode comes from the snapshot, absent is lesson; focus and demo target are the latest's", () => {
  const v = reduce(null, snap({ focus: ["Title"], mode: "review" }));
  assert.equal(v.mode, "review");
  assert.deepEqual(v.focus, ["Title"]);
  assert.equal(v.demo_target, ID(1));
  const w = reduce(v, snap({ focus: null, demo_target: null, mode: undefined }));
  assert.equal(w.mode, "lesson");
  assert.equal(w.demo_target, null);
});

test("saved is true only on saved: true (PN-15, SC-012)", () => {
  const rec = (ok, json) => ({ type: "tool_result", name: "record_lesson", ok, json });
  assert.equal(initialLesson().saved, null);
  assert.equal(reduce(null, rec(true, { saved: true })).saved, true);
  for (const [ok, json] of [[true, { saved: false }], [true, {}], [true, undefined], [false, { saved: true }]]) {
    assert.equal(reduce(null, rec(ok, json)).saved, false, JSON.stringify([ok, json]));
  }
});

test("a save with no pass is saved, not passed (D6)", () => {
  const v = reduce(null, snap(), diff({ passed: false }), { type: "tool_result", name: "record_lesson", ok: true, json: { saved: true } });
  assert.equal(v.saved, true);
  assert.equal(v.passed, false);
});

test("demo_unknown settles per FR-030: a snapshot naming a target clears it, one that doesn't leaves it", () => {
  const unknown = { ...initialLesson(), demo_unknown: true };
  assert.equal(reduce(unknown, snap({ demo_target: ID(2) })).demo_unknown, false);
  assert.equal(reduce(unknown, snap({ demo_target: null })).demo_unknown, true);
});

test("demo_unknown settles at a check: a demo mark makes it demo_made, no mark clears it", () => {
  const unknown = { ...initialLesson(), demo_unknown: true };
  const marked = reduce(unknown, diff({ targets: [{ segment_id: ID(1), label: "Title › Position 1–2 s", result: "eased_by_demo", demo_credit: "demo" }] }));
  assert.deepEqual([marked.demo_unknown, marked.demo_made], [false, true]);
  const plain = reduce(unknown, diff());
  assert.deepEqual([plain.demo_unknown, plain.demo_made], [false, false]);
});

test("events other than tool results and sends leave the view unchanged", () => {
  const v = initialLesson();
  assert.equal(reduceLesson(v, { type: "text_delta", text: "Show me again" }), v);
  assert.equal(reduceLesson(v, { type: "tool_call", name: "set_ease" }), v);
});

test("the reducer is pure: the old view isn't changed", () => {
  const before = reduce(null, snap());
  const copy = JSON.stringify(before);
  reduce(before, sent("ask"), END, diff(), snap({ targets: [ID(2)] }));
  assert.equal(JSON.stringify(before), copy);
});

// ---------- T009: rows at the opening, and how they change ----------

test("lesson-open: opening rows are the targets, joined from findings, marked Proposed (FR-015)", () => {
  const v = reduce(null, sent("start"), snap({ targets: [ID(1), ID(2)] }));
  const l = v.check_list;
  assert.equal(l.proposed, true);
  assert.deepEqual(l.sections.map((s) => s.title), ["Title"]);
  assert.deepEqual(names(v), ["Position 1–2 s", "Position 2–3 s"]);
  assert.deepEqual(rowsOf(l).map((r) => [r.family, r.glyph, r.word]), [["prop", "◇", "Proposed"], ["prop", "◇", "Proposed"]]);
  assert.equal(l.summary, "2 linear pairs found · Proposed");
  assert.equal(l.sub, COPY.check.source_full);
});

test("labels are kept by id, so a pair that drops out of findings keeps its name", () => {
  const v = reduce(null, snap(), snap({ findings: [], targets: [ID(1)], focus: ["Title"] }));
  assert.deepEqual(names(v), ["Position 1–2 s"]);
  assert.equal(v.labels[ID(2)], "Title › Position 2–3 s");
});

test("lesson-focus-replying: at the first reply the mark drops and the header says updating", () => {
  const v = reduce(null, snap(), sent("ask"));
  assert.equal(v.replied, true);
  assert.equal(v.check_list.proposed, false);
  assert.deepEqual(rowsOf(v.check_list).map((r) => [r.family, r.word]), [["none", "Not checked yet"], ["none", "Not checked yet"]]);
  assert.equal(v.check_list.summary, "2 linear pairs found");
  assert.equal(v.check_list.sub, COPY.check.source_updating);
  assert.equal(v.check_list.updating, true);
});

test("the first check drops the mark too", () => {
  const v = reduce(null, snap(), sent("check"));
  assert.equal(v.check_list.proposed, false);
});

test("lesson-focused: a re-read in that turn replaces the rows and the list says so", () => {
  const v = reduce(null, snap(), sent("ask"), snap({ targets: [ID(1)], focus: ["Title"] }), END);
  assert.deepEqual(names(v), ["Position 1–2 s"]);
  assert.equal(v.check_list.summary, "1 pair on Title · not checked yet");
  assert.equal(v.check_list.sub, null);
  assert.equal(v.check_list.updating, false);
  assert.equal(v.check_list.focus_stale, false);
  assert.equal(v.check_list.proposed, false);
});

test("lesson-focus-stale: no re-read leaves the old rows, unmarked, saying where they came from (FR-098)", () => {
  const v = reduce(null, snap(), sent("ask"), END);
  assert.deepEqual(names(v), ["Position 1–2 s", "Position 2–3 s"]);
  assert.equal(v.check_list.summary, COPY.check.source_stale);
  assert.equal(v.check_list.sub, COPY.check.source_stale_sub);
  assert.equal(v.check_list.focus_stale, true);
  assert.equal(v.check_list.stale, null, "it isn't the can't-compare stale");
});

test("only the first reply: a later reply with no re-read changes nothing", () => {
  const v = reduce(null, snap(), sent("ask"), snap({ targets: [ID(1)], focus: ["Title"] }), END);
  assert.deepEqual(reduce(v, sent("ask"), END).check_list, v.check_list);
});

test("the opening's own second call stays Proposed: nobody has replied", () => {
  const v = reduce(null, snap(), snap({ targets: [ID(1)] }));
  assert.equal(v.check_list.proposed, true);
  assert.deepEqual(names(v), ["Position 1–2 s"]);
});

test("after a check, a re-read with the same targets keeps the results; new targets replace them", () => {
  const checked = reduce(null, snap({ targets: [ID(1)] }), diff());
  const same = reduce(checked, snap({ targets: [ID(1)] }));
  assert.deepEqual(words(same), ["Still linear"]);
  const moved = reduce(checked, snap({ targets: [ID(2)], focus: ["Title"] }));
  assert.deepEqual(names(moved), ["Position 2–3 s"]);
  assert.deepEqual(words(moved), ["Not checked yet"]);
});

test("no targets at the opening: no rows, never placeholders", () => {
  assert.equal(reduce(null, snap({ targets: [] })).check_list, null);
});

test("a resumed lesson is unmarked, with the resuming line and a count of unlabelled targets (FR-092, FR-100)", () => {
  const v = reduce(null, sent("start"), snap({ lesson: "resumed", targets: [ID(1), ID(7), ID(8)], focus: ["Title"], findings: findings([1]) }));
  assert.equal(showsResuming(v), true);
  assert.equal(v.check_list.proposed, false);
  assert.deepEqual(names(v), ["Position 1–2 s"]);
  assert.deepEqual(words(v), ["Not checked yet"]);
  assert.equal(v.check_list.more, "2 more pairs. They get names at your next check.");
  assert.equal(v.check_list.summary, "3 pairs on Title · not checked yet");
  assert.doesNotMatch(JSON.stringify(rowsOf(v.check_list).map((r) => r.subject)), /ADBE/);
});

test("one unlabelled target: the singular count line", () => {
  const v = reduce(null, snap({ lesson: "resumed", targets: [ID(1), ID(7)], findings: findings([1]) }));
  assert.equal(v.check_list.more, COPY.check.unnamed_more(1));
});

test("Continue lesson doesn't add the resuming line: it has its own divider", () => {
  const v = reduce(null, sent("continue"), snap({ lesson: "continued" }));
  assert.equal(v.picked_up, true);
  assert.equal(showsResuming(v), false);
});

test("the check names the counted pairs, so the count line goes; an unnamed pair reads A pair", () => {
  const before = reduce(null, snap({ lesson: "resumed", targets: [ID(1), ID(7)], findings: findings([1]) }));
  const v = reduce(before, diff({ targets: [{ segment_id: ID(1), label: "Title › Position 1–2 s", result: "still_linear" }, { segment_id: ID(7), label: ID(7), result: "eased_by_learner" }] }));
  assert.equal(v.check_list.more, null);
  assert.deepEqual(names(v), ["Position 1–2 s", COPY.check.a_pair]);
});

test("checks replace the rows, count up, and compare with the last check", () => {
  const a = reduce(null, snap(), diff());
  assert.equal(a.checks, 1);
  const b = reduce(a, diff({ targets: [{ segment_id: ID(1), label: "Title › Position 1–2 s", result: "eased_by_learner" }], summary: { learner_eased: 1, still_linear: 0, total_for_learner: 1 } }));
  assert.equal(b.checks, 2);
  assert.equal(rowsOf(b.check_list)[0].changed, true);
  assert.equal(b.check_list.sub, COPY.check.more_since(1));
});

// ---------- stale ----------

const AT = "2026-11-09T21:12:00";

test("lesson-othercomp: another comp never replaces the list, and the note names the lesson's comp", () => {
  const before = reduce(null, { ...diff(), at: AT });
  const v = reduce(before, diff({ comp_matches: false, lesson_comp: "Mentor Practice", targets: [] }));
  assert.equal(v.checks, 1);
  assert.deepEqual(words(v), ["Still linear"]);
  assert.equal(v.check_list.stale, "From your last check, on Mentor Practice.");
  assert.equal(v.check_list.stale_kind, "other_comp");
  assert.equal(before.check_list.stale, null, "pure");
});

test("lesson-stale: AE unreachable or busy keeps the rows, with the last check's time", () => {
  const before = reduce(null, { ...diff(), at: AT });
  for (const text of ["AE_UNREACHABLE: gone", "AE_BUSY: rendering"]) {
    const v = reduce(before, { type: "tool_result", name: "diff_since_last", ok: false, text });
    assert.equal(v.checks, 1);
    assert.equal(v.check_list.stale, "From your last check, 9:12 pm.");
    assert.equal(v.check_list.stale_kind, "ae");
  }
});

test("a snapshot that can't reach AE marks the rows stale too, with no results to lose", () => {
  const v = reduce(null, snap(), { type: "tool_result", name: "snapshot_project", ok: false, text: "AE_UNREACHABLE: gone" });
  assert.equal(v.check_list.stale_kind, "ae");
  assert.equal(v.check_list.stale, COPY.check.source_stale);
});

test("an unreadable check never replaces the list and isn't counted; no list stays no list", () => {
  const before = reduce(null, diff());
  const v = reduce(before, { type: "tool_result", name: "diff_since_last", ok: true, text: "not json" });
  assert.equal(v.checks, 1);
  assert.ok(v.check_list.stale);
  assert.equal(reduce(null, diff({ comp_matches: false })).check_list, null);
});

test("a fresh check clears stale", () => {
  const stale = reduce(null, diff(), diff({ comp_matches: false, targets: [] }));
  assert.equal(reduce(stale, diff()).check_list.stale, null);
});

// ---------- recorded lessons ----------

test("the recorded opening: Proposed rows, every target named, on Pick", () => {
  const v = replay(initialLesson(), "easing-01-new-learner-opening.jsonl");
  assert.equal(stageOf(v).stage, "pick");
  assert.equal(v.check_list.proposed, true);
  assert.equal(v.check_list.more, null);
  assert.ok(rowsOf(v.check_list).length >= 4);
});

test("the recorded show-me and partial lessons: a demo, then rows from the check", () => {
  const demo = replay(initialLesson(), "easing-03-show-me.jsonl");
  assert.equal(demo.demo_made, true);
  const partial = replay(initialLesson(), "easing-07-partial-attempt.jsonl");
  assert.ok(partial.checks >= 1);
  assert.equal(stageOf(partial).stage === "pick", false);
  assert.equal(partial.check_list.source, "check");
});

test("the recorded other-comp case: the list goes stale and no check is counted", () => {
  const events = [];
  const p = createStreamParser((e) => { if (e.type === "tool_result" && e.name === "diff_since_last") events.push(e); });
  p.push(fs.readFileSync(path.join(__dirname, "fixtures", "eval", "easing-12-other-comp.jsonl"), "utf8"));
  p.end();
  const other = events.filter((e) => e.json && e.json.comp_matches === false);
  assert.ok(other.length >= 1, "the fixture has a check on another comp");
  const v = replay(initialLesson(), "easing-12-other-comp.jsonl");
  assert.equal(v.passed, false);
  assert.equal(v.checks, events.length - other.length);
  assert.equal(v.check_list.stale_kind, "other_comp");
});
