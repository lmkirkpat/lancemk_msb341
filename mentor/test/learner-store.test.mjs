// FR-010/FR-012: the learner record in learner.json (data-model.md › Learner record).

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tempHome } from "./helpers.mjs";

const home = tempHome();
const store = await import("../lib/learner-store.mjs");
const FILE = path.join(home, "learner.json");

const entry = (over = {}) => ({
  skill: "easing.basic",
  project: "Claude AE Tutor Test.aep",
  comp: "Mentor Practice",
  attempted: "Eased 3 Position and Scale pairs on Title, 0.5 s to 1.25 s at 33.33% influence",
  result: "partial",
  demo_used: true,
  summary: "Eased Position and Opacity on Title; Scale was still linear at the check.",
  next: "Ease Title › Scale, then move on to Bar.",
  ...over,
});

beforeEach(() => fs.rmSync(FILE, { force: true }));

test("a missing file reads as an empty record, with its path", () => {
  assert.deepEqual(store.readRecord(), { version: 1, skills: {}, lessons: [], path: FILE });
});

test("recordLesson adds a date, appends, and writes a file you can read without tools", () => {
  const before = Date.now();
  store.recordLesson(entry());
  store.recordLesson(entry({ result: "passed" }));
  const file = JSON.parse(fs.readFileSync(FILE, "utf8"));
  assert.equal(file.version, 1);
  assert.equal(file.lessons.length, 2);
  assert.ok(Date.parse(file.lessons[0].date) >= before - 1000);
  assert.equal(file.lessons[1].result, "passed");
  assert.equal(file.path, undefined, "path is returned by readRecord, not stored");
});

test("skill state: partial → practicing, a pass → learned, and learned stays learned", () => {
  let r = store.recordLesson(entry({ result: "partial", next: "Ease Scale" }));
  assert.equal(r.skill.status, "practicing");
  assert.equal(r.skill.times_passed, 0);
  assert.equal(r.skill.next, "Ease Scale");
  assert.equal(r.skill.last_practiced, r.entry.date);

  r = store.recordLesson(entry({ result: "passed", next: "Try Bar" }));
  assert.equal(r.skill.status, "learned");
  assert.equal(r.skill.times_passed, 1);

  r = store.recordLesson(entry({ result: "partial", next: "Review" }));
  assert.equal(r.skill.status, "learned");
  assert.equal(r.skill.times_passed, 1);
  assert.equal(r.skill.next, "Review");
  assert.deepEqual(store.readRecord().skills["easing.basic"], r.skill);
});

test("not_checked counts as practice, not a pass", () => {
  const r = store.recordLesson(entry({ result: "not_checked" }));
  assert.equal(r.skill.status, "practicing");
  assert.equal(r.skill.times_passed, 0);
});

test("result and skill must be known values, and every field is required", () => {
  assert.throws(() => store.recordLesson(entry({ result: "done" })), /result/);
  assert.throws(() => store.recordLesson(entry({ skill: "easing.advanced" })), /skill/);
  assert.throws(() => store.recordLesson(entry({ summary: undefined })), /summary/);
  assert.throws(() => store.recordLesson(entry({ demo_used: "yes" })), /demo_used/);
  assert.equal(fs.existsSync(FILE), false, "nothing is written on a bad entry");
});

test("an email or phone number anywhere is refused with UNSAFE_RECORD", () => {
  for (const bad of ["Sent to someone@example.edu", "Call 801-555-0123", "Call (801) 555 0123", "+44 20 7946 0958"]) {
    assert.throws(() => store.recordLesson(entry({ summary: bad })), { code: "UNSAFE_RECORD" }, bad);
    assert.throws(() => store.recordLesson(entry({ comp: bad })), { code: "UNSAFE_RECORD" }, bad);
  }
  assert.equal(fs.existsSync(FILE), false);
});

test("timings, percentages and dates are not mistaken for phone numbers", () => {
  store.recordLesson(entry({ summary: "Keys at 0.5 s, 1.25 s and 2.0 s; 33.33% influence; frames 12–48; 2026-10-05" }));
  assert.equal(store.readRecord().lessons.length, 1);
});

test("there is no name field: fields outside LessonEntry are not stored", () => {
  const r = store.recordLesson(entry({ name: "Learner", email: "x" }));
  assert.equal("name" in r.entry, false);
  assert.equal("email" in r.entry, false);
  assert.equal(JSON.stringify(store.readRecord()).includes("Learner"), false);
});

test("the store honors AE_MENTOR_HOME", () => {
  store.recordLesson(entry());
  assert.ok(fs.existsSync(path.join(home, "learner.json")));
  assert.equal(store.readRecord().path, path.join(home, "learner.json"));
});
