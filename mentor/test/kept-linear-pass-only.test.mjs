// FR-038's "Only a passing check writes one" (spec 004 review, round 5b): keepLinear() needs the
// lesson's own comp and a check on this lesson, and record_lesson writes the lesson's kept-linear
// marks only with a passed result. Also the record fixes from the same review: a write with no
// lesson keeps the review schedule, a stray null in marks doesn't break a write, and already_knew
// needs a passing review.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, fixture, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "practice-before.json") }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { commonTools } = await import("../tools/common.mjs");
const session = await import("../lib/session.mjs");
const store = await import("../lib/learner-store.mjs");
const { MESSAGES } = await import("../errors.mjs");
const SAMPLE = await import(path.join(FIXTURES, "sample-skill", "lib", "sample.mjs"));

const FILE = path.join(home, "learner.json");
const SESSION = path.join(home, "session.json");
const practice = JSON.parse(fs.readFileSync(path.join(FIXTURES, "practice-before.json"), "utf8"));
const POS = "ADBE Transform Group/ADBE Position";
const SKILLS = ["easing.basic", "keyframes.types"];
const COMMON = commonTools({ skills: SKILLS, finders: {} });
const record = (e) => COMMON.find((t) => t.name === "record_lesson").handler(e);
const KT = { skill: "keyframes.types", analyze: SAMPLE.analyze };
const CTRL = [{ layer: "CTRL", property: "Position" }];
const entry = (over = {}) => ({
  skill: "keyframes.types", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice", attempted: "Held the Cursor pairs",
  result: "passed", demo_used: false, summary: "Said CTRL's move runs at constant speed.", next: "Hold a blink.", ...over,
});
const file = () => JSON.parse(fs.readFileSync(FILE, "utf8"));

beforeEach(() => {
  fs.rmSync(FILE, { force: true });
  fs.rmSync(SESSION, { force: true });
});

// ---- keepLinear

test("keepLinear before any check on this lesson is refused and stores nothing", () => {
  session.start(practice, KT);
  assert.throws(() => session.keepLinear(practice, CTRL), { code: "KEEP_LINEAR_NO_CHECK" });
  assert.deepEqual(session.currentLesson().kept_linear, []);
});

test("keepLinear with a snapshot of another comp is refused and stores nothing", () => {
  session.start(practice, KT);
  session.markChecked(true);
  const other = structuredClone(practice);
  other.comp = { ...other.comp, id: 98, name: "Mentor Practice 2" };
  assert.throws(() => session.keepLinear(other, CTRL), { code: "KEEP_LINEAR_OTHER_COMP" });
  const otherProject = structuredClone(practice);
  otherProject.project = "Another.aep";
  assert.throws(() => session.keepLinear(otherProject, CTRL), { code: "KEEP_LINEAR_OTHER_COMP" }, "same comp id, another project");
  assert.deepEqual(session.currentLesson().kept_linear, []);
});

test("keepLinear after a check stores the mark, whether that check passed or not", () => {
  for (const passed of [true, false]) {
    fs.rmSync(SESSION, { force: true });
    session.start(practice, KT);
    session.markChecked(passed);
    assert.deepEqual(session.keepLinear(practice, CTRL), [{ layer: "CTRL", path: POS, property: "Position", key_times: [0, 1] }]);
  }
});

test("keepLinear after a check still refuses a property that isn't linear all the way", () => {
  session.start(practice, KT);
  session.markChecked(true);
  assert.throws(() => session.keepLinear(practice, [{ layer: "Cursor", property: "Opacity" }]), { code: "NOT_KEPT_LINEAR" });
  assert.deepEqual(session.currentLesson().kept_linear, []);
});

test("the new codes have messages a learner can read: no field names", () => {
  for (const code of ["KEEP_LINEAR_NO_CHECK", "KEEP_LINEAR_OTHER_COMP"]) {
    assert.ok(MESSAGES[code], code);
    assert.doesNotMatch(MESSAGES[code], /_|kept_linear|keepLinear|lesson\./, code);
  }
});

// ---- record_lesson writes marks only on a pass

test("a passed lesson writes its kept-linear marks", async () => {
  session.start(practice, KT);
  session.markChecked(true);
  session.keepLinear(practice, CTRL);
  await record(entry());
  assert.deepEqual(file().marks.map((m) => `${m.layer}/${m.path}`), [`CTRL/${POS}`]);
});

test("a partial lesson doesn't write its kept-linear marks", async () => {
  session.start(practice, KT);
  session.markChecked(false);
  session.keepLinear(practice, CTRL);
  await record(entry({ result: "partial" }));
  assert.equal("marks" in file(), false, "a record with no marks gains none");
});

test("a non-pass still drops this comp's lapsed marks, and keeps the ones that apply", async () => {
  const kept = { kind: "kept_linear", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice", layer: "CTRL", path: POS,
    property: "Position", key_times: [0, 1], skill: "keyframes.types", date: "2026-10-01" };
  const lapsed = { ...kept, layer: "Title", key_times: [0, 1] }; // Title's keys are 0.5, 1.5, 3
  fs.writeFileSync(FILE, JSON.stringify({ version: 1, skills: {}, lessons: [], marks: [kept, lapsed] }));
  session.start(practice, KT);
  session.markChecked(false);
  await record(entry({ result: "partial" }));
  assert.deepEqual(file().marks, [kept]);
});

test("store.recordLesson with a lesson: marks only when the result is passed", () => {
  const lesson = { skill: "keyframes.types", mode: "lesson", baseline: practice, target_refs: [],
    kept_linear: [{ layer: "CTRL", path: POS, property: "Position", key_times: [0, 1] }] };
  store.recordLesson(entry({ result: "partial" }), SKILLS, { lesson });
  assert.equal("marks" in file(), false);
  store.recordLesson(entry({ result: "not_checked" }), SKILLS, { lesson });
  assert.equal("marks" in file(), false);
  store.recordLesson(entry(), SKILLS, { lesson });
  assert.equal(file().marks.length, 1);
});

test("a stray null in the record's marks doesn't break writing a new mark", () => {
  fs.writeFileSync(FILE, JSON.stringify({ version: 1, skills: {}, lessons: [], marks: [null] }));
  const lesson = { skill: "keyframes.types", mode: "lesson", baseline: practice, target_refs: [],
    kept_linear: [{ layer: "CTRL", path: POS, property: "Position", key_times: [0, 1] }] };
  store.recordLesson(entry(), SKILLS, { lesson });
  assert.deepEqual(file().marks.filter(Boolean).map((m) => m.layer), ["CTRL"]);
});

// ---- A record write with no lesson keeps the review schedule

test("a write with no lesson carries over review_due and reviews_passed_in_row", () => {
  fs.writeFileSync(FILE, JSON.stringify({
    version: 1, lessons: [],
    skills: { "easing.basic": { status: "learned", last_practiced: "2026-10-15T16:00:00.000Z", times_passed: 2, next: "x", review_due: "2026-10-24", reviews_passed_in_row: 2 } },
  }));
  const { skill } = store.recordLesson(entry({ skill: "easing.basic", result: "not_checked" }), SKILLS);
  assert.equal(skill.review_due, "2026-10-24");
  assert.equal(skill.reviews_passed_in_row, 2);
  assert.equal(skill.status, "learned");
  const saved = file().skills["easing.basic"];
  assert.equal(saved.review_due, "2026-10-24");
  assert.equal(saved.reviews_passed_in_row, 2);
});

test("a write with no lesson on a skill with no schedule adds none", () => {
  const { skill } = store.recordLesson(entry({ skill: "easing.basic", result: "not_checked" }), SKILLS);
  assert.equal("review_due" in skill, false);
  assert.equal("reviews_passed_in_row" in skill, false);
});

// ---- already_knew needs a passing review

test("already_knew only on a passing review of a skill that wasn't learned", () => {
  const lesson = (over = {}) => ({ skill: "keyframes.types", mode: "review", baseline: fixture("attempt-before"), kept_linear: [], target_refs: [], ...over });
  const partial = store.recordLesson(entry({ result: "partial" }), SKILLS, { lesson: lesson() });
  assert.equal("already_knew" in partial.entry, false, "partial");
  const unchecked = store.recordLesson(entry({ result: "not_checked" }), SKILLS, { lesson: lesson() });
  assert.equal("already_knew" in unchecked.entry, false, "not_checked");
  const passed = store.recordLesson(entry(), SKILLS, { lesson: lesson() });
  assert.equal(passed.entry.already_knew, true);
});
