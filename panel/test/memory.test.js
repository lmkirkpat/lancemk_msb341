"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { readLearnerRecord, isValidRecord, memoryView, readSkillNames, shortDate } = require("../lib/memory.js");
const { COPY } = require("../lib/copy.js");

const LEARNERS = path.join(__dirname, "..", "..", "product", "evals", "easing", "cases", "learners");
const RECORDS = path.join(__dirname, "fixtures", "records");
const REPO = path.join(__dirname, "..", "..");
const load = (name) => JSON.parse(fs.readFileSync(path.join(LEARNERS, name), "utf8"));
const NAMES = { "easing.basic": "Easing", "transform.anchor": "Set the pivot (anchor point)" };

test("the eval's learned record: date, skill, result, and the skill's next note", () => {
  const rec = load("learned-title.json");
  const m = memoryView(rec, { names: NAMES });
  assert.equal(m.empty, false);
  assert.match(m.date, /^[A-Z][a-z]{2} \d{1,2}$/);
  assert.equal(m.skill, "Easing");
  assert.equal(m.result, "passed");
  assert.equal(m.next, rec.skills["easing.basic"].next);
});

test("result words for each value, and next falls back to the lesson", () => {
  const base = { version: 1, skills: {}, lessons: [{ date: "2026-10-03T18:00:00Z", skill: "easing.basic", result: "partial", next: "Finish Opacity." }] };
  assert.deepEqual(memoryView(base, { names: NAMES }), { empty: false, date: shortDate("2026-10-03T18:00:00Z"), skill: "Easing", result: "not finished", next: "Finish Opacity." });
  base.lessons[0].result = "not_checked";
  assert.equal(memoryView(base).result, "not checked");
  base.lessons[0].result = "weird";
  assert.equal(memoryView(base).result, "not checked");
});

test("skill names come from the path data, and an id never shows (FR-064)", () => {
  const names = readSkillNames({ repoPath: REPO });
  assert.equal(names["transform.anchor"], "Set the pivot (anchor point)");
  const rec = { skills: {}, lessons: [{ skill: "transform.anchor", result: "passed" }] };
  assert.equal(memoryView(rec, { names }).skill, "Set the pivot (anchor point)");
  assert.equal(memoryView({ skills: {}, lessons: [{ skill: "made.up", result: "passed" }] }, { names }).skill, COPY.home.a_skill);
  assert.deepEqual(readSkillNames({ repoPath: "/nowhere" }), {});
});

test("no record or no lessons reads as empty, in the mockup's words", () => {
  assert.deepEqual(memoryView(null), { empty: true, text: COPY.home.memory_empty });
  assert.deepEqual(memoryView({ version: 1, skills: {}, lessons: [] }), { empty: true, text: COPY.home.memory_empty });
});

test("an older record's missing fields are left out, never an error (FR-050)", () => {
  const m = memoryView({ skills: {}, lessons: [{ skill: "easing.basic" }] }, { names: NAMES });
  assert.deepEqual(m, { empty: false, date: "", skill: "Easing", result: "", next: "" });
});

test("never shows field names (FR-017)", () => {
  const m = memoryView(load("practicing-title.json"), { names: NAMES });
  assert.doesNotMatch(JSON.stringify(m), /easing\.basic|practicing|not_checked|last_practiced/);
});

test("the shape test matches the mentor's: an object with a skills object and a lessons array (FR-095)", () => {
  assert.equal(isValidRecord({ skills: {}, lessons: [] }), true);
  for (const bad of [null, 3, [], {}, { skills: {} }, { lessons: [] }, { skills: null, lessons: [] }, { skills: {}, lessons: {} }]) {
    assert.equal(isValidRecord(bad), false, JSON.stringify(bad));
  }
});

test("readLearnerRecord on the saved records: missing, ok, unreadable, set aside (FR-011, FR-095)", () => {
  const read = (name) => readLearnerRecord({ home: path.join(RECORDS, name) });
  assert.deepEqual(read("none"), { status: "missing", record: null });
  assert.equal(read("one-lesson").status, "ok");
  assert.equal(read("one-lesson").record.lessons.length, 1);
  assert.equal(read("twenty-lessons").record.lessons.length, 20);
  assert.deepEqual(read("unreadable"), { status: "unreadable", record: null });
  assert.deepEqual(read("set-aside"), { status: "unreadable", record: null });
});

test("a wrong shape, or a file that can't be opened, is unreadable and not a first run", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-memory-"));
  fs.writeFileSync(path.join(home, "learner.json"), JSON.stringify({ version: 1, lessons: [] }));
  assert.equal(readLearnerRecord({ home }).status, "unreadable");
  const denied = { readFileSync() { throw Object.assign(new Error("no"), { code: "EACCES" }); }, readdirSync: () => [] };
  assert.equal(readLearnerRecord({ home, fs: denied }).status, "unreadable");
});

test("reading never writes", () => {
  const calls = [];
  const spy = new Proxy(fs, { get: (t, k) => { if (/write|rename|unlink|mkdir|append|rm/i.test(String(k))) calls.push(k); return t[k]; } });
  readLearnerRecord({ home: path.join(RECORDS, "unreadable"), fs: spy });
  assert.deepEqual(calls, []);
});
