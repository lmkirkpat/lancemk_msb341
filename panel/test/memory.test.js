"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { readLearnerRecord, memoryView } = require("../lib/memory.js");

const LEARNERS = path.join(__dirname, "..", "..", "product", "evals", "easing", "cases", "learners");
const load = (name) => JSON.parse(fs.readFileSync(path.join(LEARNERS, name), "utf8"));

test("the eval's learned record: date, skill, result, and the skill's next note", () => {
  const rec = load("learned-title.json");
  const m = memoryView(rec);
  assert.equal(m.empty, false);
  assert.match(m.date, /^[A-Z][a-z]{2} \d{1,2}$/);
  assert.equal(m.skill, "Easing");
  assert.equal(m.result, "passed ✓");
  assert.equal(m.next, rec.skills["easing.basic"].next);
});

test("result words for each value, and next falls back to the lesson", () => {
  const base = { version: 1, skills: {}, lessons: [{ date: "2026-10-03T18:00:00Z", skill: "easing.basic", result: "partial", next: "Finish Opacity." }] };
  assert.deepEqual(memoryView(base), { empty: false, date: memoryView(base).date, skill: "Easing", result: "not finished", next: "Finish Opacity." });
  base.lessons[0].result = "not_checked";
  assert.equal(memoryView(base).result, "not checked");
  base.lessons[0].result = "weird";
  assert.equal(memoryView(base).result, "not checked");
});

test("no record, empty lessons, or another version", () => {
  assert.deepEqual(memoryView(null), { empty: true, text: "No lessons yet." });
  assert.deepEqual(memoryView({ version: 1, skills: {}, lessons: [] }), { empty: true, text: "No lessons yet." });
  assert.deepEqual(memoryView({ version: 2, lessons: [{}] }), { empty: true, text: "Memory format not recognised." });
});

test("never shows field names (FR-017)", () => {
  const m = memoryView(load("practicing-title.json"));
  assert.doesNotMatch(JSON.stringify(m), /easing\.basic|practicing|not_checked|last_practiced/);
});

test("readLearnerRecord: a missing or broken file is null", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-memory-"));
  assert.equal(readLearnerRecord({ home }), null);
  fs.writeFileSync(path.join(home, "learner.json"), "{ broken");
  assert.equal(readLearnerRecord({ home }), null);
  fs.writeFileSync(path.join(home, "learner.json"), JSON.stringify({ version: 1, lessons: [] }));
  assert.deepEqual(readLearnerRecord({ home }), { version: 1, lessons: [] });
});
