// data-model › Skill state › Transitions, the row "review | not_checked | unchanged" (spec 004
// review, round 5b): a review with no check keeps the skill's status as it was, whatever it was.

process.env.TZ = "America/Denver";

import { test } from "node:test";
import assert from "node:assert/strict";
import { nextState } from "../lib/reviews.mjs";

const D = new Date("2026-10-21T21:00:00.000Z");

test("a not_checked review of a skill never started leaves it not started", () => {
  assert.deepEqual(nextState(undefined, { kind: "review", result: "not_checked", date: D }), { status: "not_started", times_passed: 0 });
  assert.deepEqual(nextState({ status: "not_started", times_passed: 0 }, { kind: "review", result: "not_checked", date: D }),
    { status: "not_started", times_passed: 0 });
});

test("a not_checked review keeps practicing and learned as they were", () => {
  const practicing = { status: "practicing", last_practiced: "2026-10-15T16:00:00.000Z", times_passed: 0, next: "x" };
  assert.equal(nextState(practicing, { kind: "review", result: "not_checked", date: D }).status, "practicing");
  const learned = { ...practicing, status: "learned", times_passed: 1, review_due: "2026-10-20", reviews_passed_in_row: 2 };
  assert.deepEqual(nextState(learned, { kind: "review", result: "not_checked", date: D }),
    { status: "learned", times_passed: 1, review_due: "2026-10-20", reviews_passed_in_row: 2 });
});

test("a partial review of a skill never started still moves it to practicing", () => {
  assert.equal(nextState(undefined, { kind: "review", result: "partial", date: D }).status, "practicing");
});

test("first and practice lessons with no check still move a new skill to practicing", () => {
  for (const kind of ["first", "practice"]) {
    assert.equal(nextState(undefined, { kind, result: "not_checked", date: D }).status, "practicing", kind);
  }
});
