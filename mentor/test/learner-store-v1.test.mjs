// FR-018, FR-022, FR-023: a v1 record from before spec 004 still reads; lessons recorded with the
// session's lesson gain kind, already_knew and targets; the file stays version 1; the old call is
// unchanged.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, fixture, tempHome } from "./helpers.mjs";

const home = tempHome();
const store = await import("../lib/learner-store.mjs");
const { withReviewFields, localDate, addDays } = await import("../lib/reviews.mjs");
const FILE = path.join(home, "learner.json");
const SKILLS = ["easing.basic", "sample.review"];
const copyRecord = (name) => fs.copyFileSync(path.join(FIXTURES, "records", `${name}.json`), FILE);
const A = fixture("attempt-before");

const entry = (over = {}) => ({
  skill: "easing.basic", project: "Synthetic.aep", comp: "Lower Third", attempted: "Eased the Title pairs",
  result: "passed", demo_used: false, summary: "Every Title pair eased.", next: "Try Subtitle.", ...over,
});
const lesson = (over = {}) => ({
  skill: "easing.basic", mode: "lesson", baseline: A, kept_linear: [],
  target_refs: [{ layer: "Title", property: "Position" }, { layer: "Title", property: "Position" }, { layer: "Title", property: "Scale" }],
  ...over,
});

beforeEach(() => fs.rmSync(FILE, { force: true }));

test("an old v1 record reads as it is, its review fields can be worked out, and reading never rewrites it", () => {
  copyRecord("easing-learned-old-v1");
  const before = fs.readFileSync(FILE, "utf8");
  const r = store.readRecord();
  assert.equal(r.skills["easing.basic"].review_due, undefined, "readRecord returns what's stored");
  const worked = withReviewFields(r.skills["easing.basic"]);
  assert.equal(worked.review_due, addDays(localDate(new Date("2026-10-12T18:00:00.000Z")), 1));
  assert.equal(worked.reviews_passed_in_row, 0);
  store.peekRecord();
  store.pastTargets("easing.basic", "Claude AE Tutor Test.aep", "Mentor Practice");
  assert.equal(fs.readFileSync(FILE, "utf8"), before, "byte-identical");
});

test("recordLesson with the lesson stores kind first, then practice, and the targets de-duplicated", () => {
  const first = store.recordLesson(entry({ result: "partial" }), SKILLS, { lesson: lesson() });
  assert.equal(first.entry.kind, "first");
  assert.deepEqual(first.entry.targets, [{ layer: "Title", property: "Position" }, { layer: "Title", property: "Scale" }]);
  assert.equal("already_knew" in first.entry, false);
  const second = store.recordLesson(entry(), SKILLS, { lesson: lesson({ target_refs: [] }) });
  assert.equal(second.entry.kind, "practice");
  assert.deepEqual(second.entry.targets, []);
  const file = JSON.parse(fs.readFileSync(FILE, "utf8"));
  assert.equal(file.version, 1);
  assert.equal(file.lessons.length, 2);
  assert.equal(file.skills["easing.basic"].status, "learned");
  assert.equal(file.skills["easing.basic"].review_due, addDays(localDate(new Date(second.entry.date)), 1));
  assert.equal(file.skills["easing.basic"].reviews_passed_in_row, 0);
});

test("a review lesson is stored as a review; already_knew only when the skill wasn't learned before it", () => {
  const knew = store.recordLesson(entry({ skill: "sample.review" }), SKILLS, { lesson: lesson({ skill: "sample.review", mode: "review" }) });
  assert.equal(knew.entry.kind, "review");
  assert.equal(knew.entry.already_knew, true);
  assert.equal(knew.skill.status, "learned");
  assert.equal(knew.skill.reviews_passed_in_row, 0);
  const again = store.recordLesson(entry({ skill: "sample.review" }), SKILLS, { lesson: lesson({ skill: "sample.review", mode: "review" }) });
  assert.equal(again.entry.kind, "review");
  assert.equal("already_knew" in again.entry, false, "learned now, so a plain review");
  assert.equal(again.skill.reviews_passed_in_row, 1);
  assert.equal(again.skill.review_due, addDays(localDate(new Date(again.entry.date)), 3));
});

test("recordLesson without a lesson behaves exactly as before spec 004", () => {
  const r = store.recordLesson(entry(), SKILLS);
  assert.deepEqual(Object.keys(r.entry).sort(), ["attempted", "comp", "date", "demo_used", "next", "project", "result", "skill", "summary"]);
  assert.deepEqual(Object.keys(r.skill).sort(), ["last_practiced", "next", "status", "times_passed"]);
  const file = JSON.parse(fs.readFileSync(FILE, "utf8"));
  assert.deepEqual(Object.keys(file).sort(), ["lessons", "skills", "version"]);
});

test("the email and phone check still covers every text field, and nothing is written", () => {
  for (const field of ["project", "comp", "attempted", "summary", "next"]) {
    assert.throws(() => store.recordLesson(entry({ [field]: "write to someone@example.edu" }), SKILLS, { lesson: lesson() }), { code: "UNSAFE_RECORD" }, field);
    assert.throws(() => store.recordLesson(entry({ [field]: "call 801-555-0123" }), SKILLS, { lesson: lesson() }), { code: "UNSAFE_RECORD" }, field);
  }
  assert.throws(() => store.recordLesson(entry(), SKILLS, { lesson: lesson({ target_refs: [{ layer: "someone@example.edu", property: "Position" }] }) }), { code: "UNSAFE_RECORD" }, "target names too");
  assert.equal(fs.existsSync(FILE), false);
});

test("the model can't set kind, already_knew or targets through the entry", () => {
  const r = store.recordLesson(entry({ kind: "review", already_knew: true, targets: [{ layer: "X", property: "Y" }] }), SKILLS, { lesson: lesson() });
  assert.equal(r.entry.kind, "first");
  assert.equal("already_knew" in r.entry, false);
  assert.deepEqual(r.entry.targets.map((t) => t.layer), ["Title", "Title"]);
});

test("pastTargets returns targets only from that skill, project and comp", () => {
  copyRecord("first-three-learned-review-due");
  assert.deepEqual(store.pastTargets("timing.offset", "Claude AE Tutor Test.aep", "Mentor Practice"), [
    { layer: "Subtitle", property: "Position" }, { layer: "Bar", property: "End" }, { layer: "Glow", property: "Blurriness" },
  ]);
  assert.deepEqual(store.pastTargets("timing.offset", "Claude AE Tutor Test.aep", "Mentor Practice 2"), [], "another comp counts as new");
  assert.deepEqual(store.pastTargets("timing.offset", "Other.aep", "Mentor Practice"), [], "another project too");
  assert.deepEqual(store.pastTargets("keyframes.types", "Claude AE Tutor Test.aep", "Mentor Practice"), [{ layer: "Cursor", property: "Opacity" }]);
  copyRecord("easing-learned-old-v1");
  assert.deepEqual(store.pastTargets("easing.basic", "Claude AE Tutor Test.aep", "Mentor Practice"), [], "old entries have no targets");
});

test("a lesson whose targets carry several refs each stores them all, de-duplicated", () => {
  const refs = [
    { layer: "Dot 1", property: "Position" }, { layer: "Dot 1", property: "Opacity" },
    { layer: "Dot 2", property: "Position" }, { layer: "Dot 1", property: "Position" },
  ];
  const r = store.recordLesson(entry(), SKILLS, { lesson: lesson({ targets: ["layer:1", "layer:2"], target_refs: refs }) });
  assert.deepEqual(r.entry.targets, refs.slice(0, 3));
});

test("peekRecord: a missing file is empty, an unreadable one is null and stays where it is", () => {
  assert.deepEqual(store.peekRecord(), { version: 1, skills: {}, lessons: [] });
  copyRecord("unreadable");
  const before = fs.readFileSync(FILE, "utf8");
  assert.equal(store.peekRecord(), null);
  assert.deepEqual(store.pastTargets("easing.basic", "x", "y"), []);
  assert.equal(fs.readFileSync(FILE, "utf8"), before);
  assert.equal(fs.readdirSync(home).filter((f) => f.includes("unreadable-")).length, 0, "not set aside");
});
