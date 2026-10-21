// FR-019 and research R5: the review schedule in local calendar days, every row of data-model ›
// Skill state's transition table. Fixed time zone and dates, so the calendar arithmetic is pinned.

process.env.TZ = "America/Denver";

import { test } from "node:test";
import assert from "node:assert/strict";
import { INTERVALS, localDate, addDays, nextState, withReviewFields, isDue } from "../lib/reviews.mjs";

// 2026-10-21 at 15:00 in Denver (MDT, UTC-6).
const D = new Date("2026-10-21T21:00:00.000Z");
const learned = (over = {}) => ({ status: "learned", last_practiced: "2026-10-15T16:00:00.000Z", times_passed: 1, next: "x", review_due: "2026-10-16", reviews_passed_in_row: 0, ...over });
const practicing = (over = {}) => ({ status: "practicing", last_practiced: "2026-10-15T16:00:00.000Z", times_passed: 0, next: "x", ...over });

test("dates are local calendar days", () => {
  assert.equal(localDate(D), "2026-10-21");
  assert.equal(localDate(new Date("2026-10-22T05:30:00.000Z")), "2026-10-21", "23:30 in Denver is still the 21st");
  assert.equal(addDays("2026-10-21", 1), "2026-10-22");
  assert.equal(addDays("2026-10-30", 3), "2026-11-02", "across a month and the end of daylight saving");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.deepEqual(INTERVALS, [1, 3, 7, 14, 30]);
});

test("first or practice lesson, not yet learned, passed → learned, due d + 1, run 0", () => {
  for (const kind of ["first", "practice"]) {
    const s = nextState(practicing(), { kind, result: "passed", date: D });
    assert.deepEqual(s, { status: "learned", times_passed: 1, review_due: "2026-10-22", reviews_passed_in_row: 0 }, kind);
  }
  assert.deepEqual(nextState(undefined, { kind: "first", result: "passed", date: D }),
    { status: "learned", times_passed: 1, review_due: "2026-10-22", reviews_passed_in_row: 0 }, "no earlier state");
});

test("first or practice lesson, not yet learned, partial or not_checked → practicing, schedule unchanged (absent)", () => {
  for (const kind of ["first", "practice"]) {
    for (const result of ["partial", "not_checked"]) {
      const s = nextState(practicing(), { kind, result, date: D });
      assert.deepEqual(s, { status: "practicing", times_passed: 0 }, `${kind} ${result}`);
    }
  }
  assert.deepEqual(nextState(undefined, { kind: "first", result: "partial", date: D }), { status: "practicing", times_passed: 0 });
});

test("practice on a learned skill → learned, schedule unchanged, whatever the result", () => {
  for (const result of ["passed", "partial", "not_checked"]) {
    const s = nextState(learned({ review_due: "2026-10-25", reviews_passed_in_row: 2 }), { kind: "practice", result, date: D });
    assert.equal(s.status, "learned", result);
    assert.equal(s.review_due, "2026-10-25", result);
    assert.equal(s.reviews_passed_in_row, 2, result);
    assert.equal(s.times_passed, result === "passed" ? 2 : 1, result);
  }
  assert.equal(nextState(learned(), { kind: "first", result: "passed", date: D }).review_due, "2026-10-16");
});

test("passed reviews: d + 3, 7, 14, 30 for a run of 1, 2, 3, 4, and 30 again after a fifth", () => {
  let s = learned();
  const due = [];
  for (let i = 0; i < 6; i++) {
    s = nextState(s, { kind: "review", result: "passed", date: D });
    due.push([s.reviews_passed_in_row, s.review_due]);
  }
  assert.deepEqual(due, [
    [1, "2026-10-24"], [2, "2026-10-28"], [3, "2026-11-04"], [4, "2026-11-20"], [5, "2026-11-20"], [6, "2026-11-20"],
  ]);
  assert.equal(s.status, "learned");
  assert.equal(s.times_passed, 7);
});

test("a review that isn't a pass → due d + 1, run back to 0, still learned", () => {
  const s = nextState(learned({ reviews_passed_in_row: 3, review_due: "2026-10-20" }), { kind: "review", result: "partial", date: D });
  assert.deepEqual(s, { status: "learned", times_passed: 1, review_due: "2026-10-22", reviews_passed_in_row: 0 });
});

test("a review recorded not_checked changes nothing", () => {
  const before = learned({ reviews_passed_in_row: 2, review_due: "2026-10-20" });
  const s = nextState(before, { kind: "review", result: "not_checked", date: D });
  assert.deepEqual(s, { status: "learned", times_passed: 1, review_due: "2026-10-20", reviews_passed_in_row: 2 });
});

test("'already knew it': a passed review of an unlearned skill → learned, d + 1, run 0", () => {
  for (const prev of [undefined, practicing()]) {
    assert.deepEqual(nextState(prev, { kind: "review", result: "passed", date: D }),
      { status: "learned", times_passed: 1, review_due: "2026-10-22", reviews_passed_in_row: 0 });
  }
});

test("a review of an unlearned skill that isn't a pass → practicing, no schedule yet", () => {
  for (const result of ["partial", "not_checked"]) {
    assert.deepEqual(nextState(practicing(), { kind: "review", result, date: D }), { status: "practicing", times_passed: 0 }, result);
  }
});

test("wasLearned can be given; otherwise it's read from the earlier state", () => {
  const s = nextState(practicing(), { kind: "review", result: "passed", date: D, wasLearned: true });
  assert.equal(s.reviews_passed_in_row, 1, "treated as a review of a learned skill");
});

test("an old learned skill with no review_due works it out from last_practiced's local date + 1", () => {
  const old = { status: "learned", last_practiced: "2026-10-13T04:30:00.000Z", times_passed: 1, next: "x" }; // the 12th, 22:30 in Denver
  assert.deepEqual(withReviewFields(old), { ...old, review_due: "2026-10-13", reviews_passed_in_row: 0 });
  assert.equal(old.review_due, undefined, "the input isn't changed");
  assert.deepEqual(withReviewFields(practicing()), { ...practicing(), reviews_passed_in_row: 0 }, "no due date before a pass");
  // A practice lesson on it keeps that worked-out date, rather than moving it with last_practiced.
  assert.equal(nextState(old, { kind: "practice", result: "passed", date: D }).review_due, "2026-10-13");
});

test("isDue: on and after the due date, not before; never for a skill that isn't learned", () => {
  assert.equal(isDue(learned({ review_due: "2026-10-21" }), D), true, "on the day");
  assert.equal(isDue(learned({ review_due: "2026-10-20" }), D), true, "after");
  assert.equal(isDue(learned({ review_due: "2026-10-22" }), D), false, "before");
  assert.equal(isDue(practicing({ review_due: "2026-10-01" }), D), false);
  assert.equal(isDue(undefined, D), false);
  assert.equal(isDue({ status: "learned", last_practiced: "2026-10-20T16:00:00.000Z", times_passed: 1 }, D), true, "an old record's worked-out date");
});

test("a pass at 23:30 local is due the next calendar day, not 24 hours later", () => {
  const late = new Date("2026-10-22T05:30:00.000Z"); // 2026-10-21 23:30 in Denver
  const s = nextState(practicing(), { kind: "first", result: "passed", date: late });
  assert.equal(s.review_due, "2026-10-22");
  assert.equal(isDue(s, new Date("2026-10-22T14:00:00.000Z")), true, "08:00 the next morning");
  assert.equal(isDue(s, new Date("2026-10-22T05:45:00.000Z")), false, "23:45 the same night");
});
