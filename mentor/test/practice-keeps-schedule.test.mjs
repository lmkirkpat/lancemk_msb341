// Spec 014 T003 (research R18, FR-023; teaching design § 7.1 and § 11): going deeper on a learned
// skill runs as practice, never a review. A non-review lesson on a learned skill, passed or partial,
// leaves the skill's status, review_due and reviews_passed_in_row as they were, and its lesson entry's
// kind is practice. Phase 0: this records what today's code does (learner-store.recordLesson with a
// session lesson, the path record_lesson always takes, and reviews.nextState).

process.env.TZ = "America/Denver";

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tempHome } from "./helpers.mjs";

const home = tempHome();
const store = await import("../lib/learner-store.mjs");
const { isDue, localDate } = await import("../lib/reviews.mjs");
const FILE = path.join(home, "learner.json");
const SKILL = "transform.anchor";
const SKILLS = [SKILL, "easing.basic"];

const PROJECT = "Practice.aep";
const COMP = "Logo";

const learned = (over = {}) => ({
  status: "learned",
  last_practiced: "2026-11-01T17:00:00.000Z",
  times_passed: 2,
  next: "Set the pivot on another layer.",
  review_due: "2026-11-20",
  reviews_passed_in_row: 1,
  ...over,
});

const pastLesson = {
  date: "2026-11-01T17:00:00.000Z", skill: SKILL, project: PROJECT, comp: "Door", attempted: "Set a pivot.",
  result: "passed", demo_used: false, summary: "Set the pivot at the hinge.", next: "Try another layer.",
  kind: "review", targets: [{ layer: "Door", property: "Anchor Point" }],
};

function seed(skill, lessons = [pastLesson]) {
  fs.writeFileSync(FILE, JSON.stringify({ version: 1, skills: { [SKILL]: skill }, lessons }, null, 2) + "\n");
}

const entry = (result) => ({
  skill: SKILL, project: PROJECT, comp: COMP, attempted: "Moved a layer's pivot to where it should turn from.",
  result, demo_used: false, summary: "Set a pivot on the shake layer.", next: "Try a pivot on a parent null.",
});

// A go-deeper lesson: the session's lesson in its ordinary mode (session.mjs MODES: lesson, review).
const goDeeper = { mode: "lesson", target_refs: [{ layer: "Hammer", property: "Anchor Point" }] };

const record = (result, lesson = goDeeper) => store.recordLesson(entry(result), SKILLS, { lesson });
const stored = () => JSON.parse(fs.readFileSync(FILE, "utf8"));

beforeEach(() => fs.rmSync(FILE, { force: true }));

for (const result of ["passed", "partial"]) {
  test(`a ${result} non-review lesson on a learned skill keeps status, review_due and reviews_passed_in_row`, () => {
    const before = learned();
    seed(before);
    const { skill } = record(result);
    const after = stored().skills[SKILL];
    for (const s of [skill, after]) {
      assert.equal(s.status, "learned");
      assert.equal(s.review_due, before.review_due);
      assert.equal(s.reviews_passed_in_row, before.reviews_passed_in_row);
    }
  });

  test(`a ${result} non-review lesson on a learned skill is recorded with kind practice`, () => {
    seed(learned());
    const { entry: e } = record(result);
    assert.equal(e.kind, "practice");
    const last = stored().lessons.at(-1);
    assert.equal(last.kind, "practice");
    assert.equal(last.already_knew, undefined, "practice is never an already-knew review");
  });

  test(`a ${result} practice lesson leaves an overdue review still due`, () => {
    seed(learned({ review_due: "2026-11-02", reviews_passed_in_row: 3 }));
    record(result);
    const after = stored().skills[SKILL];
    assert.equal(after.review_due, "2026-11-02");
    assert.equal(after.reviews_passed_in_row, 3);
    assert.equal(isDue(after, new Date("2026-11-14T18:00:00.000Z")), true);
  });
}

test("only times_passed, last_practiced and next move: a pass counts, a partial doesn't", () => {
  seed(learned());
  let r = record("passed");
  assert.equal(r.skill.times_passed, 3);
  assert.equal(r.skill.last_practiced, r.entry.date);
  r = record("partial");
  assert.equal(r.skill.times_passed, 3);
  assert.equal(r.skill.next, "Try a pivot on a parent null.");
});

test("an older learned skill with no review fields gets the due date it already read as, and a run of 0", () => {
  // FR-023: a missing review_due reads as the day after last_practiced; practice writes that same date.
  const before = learned({ review_due: undefined, reviews_passed_in_row: undefined });
  delete before.review_due;
  delete before.reviews_passed_in_row;
  seed(before);
  record("passed");
  const after = stored().skills[SKILL];
  assert.equal(after.status, "learned");
  const d = new Date(before.last_practiced);
  assert.equal(after.review_due, localDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)));
  assert.equal(after.reviews_passed_in_row, 0);
});

test("another skill's schedule is untouched", () => {
  const other = learned({ review_due: "2026-12-01", reviews_passed_in_row: 4 });
  fs.writeFileSync(FILE, JSON.stringify({ version: 1, skills: { [SKILL]: learned(), "easing.basic": other }, lessons: [pastLesson] }) + "\n");
  record("passed");
  assert.deepEqual(stored().skills["easing.basic"], other);
});

test("contrast: the same pass in review mode does move the schedule", () => {
  seed(learned());
  const { entry: e, skill } = record("passed", { ...goDeeper, mode: "review" });
  assert.equal(e.kind, "review");
  assert.equal(skill.reviews_passed_in_row, 2);
  assert.notEqual(skill.review_due, "2026-11-20");
});

test("a learned skill with no lesson entries of its own keeps its schedule", () => {
  // e.g. a hand-edited or trimmed record: learned in skills, nothing for it in lessons.
  seed(learned(), []);
  const { skill } = record("passed");
  assert.equal(skill.status, "learned");
  assert.equal(skill.review_due, "2026-11-20");
  assert.equal(skill.reviews_passed_in_row, 1);
});

test("a learned skill with no lesson entries of its own is recorded as practice", { todo: "today's kind is 'first': learner-store.mjs:122 picks practice only when lessons already has an entry for the skill, not from its learned status" }, () => {
  seed(learned(), []);
  const { entry: e } = record("passed");
  assert.equal(e.kind, "practice");
});
