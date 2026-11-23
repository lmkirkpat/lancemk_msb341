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

// ---------- spec 014 T021: What the mentor remembers moved from Home to Skills, under the path ----------
const { ready, plain, LESSON } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");

test("the memory section draws on Skills, after the path, and never on Home", async () => {
  const h = await ready({ memory: { status: "ok", record: LESSON } });
  assert.equal(plain(renderApp(h.app.model()).view).includes(COPY.home.memory_title), false, "not on Home (decisions/012)");
  h.app.act("tab", { tab: "skills" });
  const v = plain(renderApp(h.app.model()).view);
  assert.ok(v.includes(COPY.home.memory_title));
  assert.ok(v.indexOf(COPY.home.memory_title) > v.indexOf('class="skills"'), "under the path");
  assert.ok(v.includes("Glow next."), "the record's next line");
  assert.equal(v.includes(COPY.buttons.all_skills), false, "no link to where it already is");
});

test("an empty record's memory line still reads on Skills", async () => {
  const h = await ready();
  h.app.act("tab", { tab: "skills" });
  assert.ok(plain(renderApp(h.app.model()).view).includes(COPY.home.memory_empty));
});

// ---------- spec 014 T070 (FR-043, data-model § 3): asked entries never show ----------
// The learner record's `asked` list (written by give_answer, go_deeper and note_said on the mentor's
// side) is the mentor's own scheduling data. The panel draws nothing from it: no entry in What the
// mentor remembers, no "asked again", no history row, no skill state. A record with the list and the
// same record without it render byte for byte the same, on every screen that reads the record.
const { SIX_PATH, SKILLS_BUILT } = require("./app-harness.js");

const WITH_ASKED = () => readLearnerRecord({ home: path.join(RECORDS, "with-asked") }).record;
const withoutAsked = (r) => { const c = JSON.parse(JSON.stringify(r)); delete c.asked; return c; };
// Words the asked entries hold (goal, said, comp, layers) and wording FR-043 rules out.
const ASKED_WORDS = /point of impact|soften a title|said the steps worked|Shake Control|Comp 1|asked again|asked about|after learning/i;

test("T070: a record with asked entries reads as ok, and the rest of it is as it was", () => {
  const r = readLearnerRecord({ home: path.join(RECORDS, "with-asked") });
  assert.equal(r.status, "ok");
  assert.equal(r.record.asked.length, 2);
  assert.deepEqual(withoutAsked(r.record), readLearnerRecord({ home: path.join(RECORDS, "one-lesson") }).record);
});

test("T070: an odd asked list (not a list, junk inside, null) never makes a record unreadable", () => {
  for (const asked of ["x", 3, null, {}, [null, 7, "x", { kind: "asked" }]]) {
    const rec = Object.assign(withoutAsked(WITH_ASKED()), { asked });
    assert.equal(isValidRecord(rec), true, JSON.stringify(asked));
    assert.deepEqual(memoryView(rec, { names: NAMES }), memoryView(withoutAsked(rec), { names: NAMES }));
  }
});

test("T070: What the mentor remembers shows the latest lesson, even when an asked entry is newer", () => {
  const rec = WITH_ASKED();
  assert.ok(rec.asked.every((a) => a.date > rec.lessons[rec.lessons.length - 1].date), "the fixture's asked entries come after its lesson");
  const m = memoryView(rec, { names: NAMES });
  assert.deepEqual(m, memoryView(withoutAsked(rec), { names: NAMES }));
  assert.equal(m.skill, "Easing");
  assert.equal(m.next, "Practice note 1.");
  assert.doesNotMatch(JSON.stringify(m), ASKED_WORDS);
});

test("T070: asked entries with no lessons read as an empty memory, as no record does", () => {
  const rec = { version: 1, skills: {}, lessons: [], asked: WITH_ASKED().asked };
  assert.deepEqual(memoryView(rec, { names: NAMES }), { empty: true, text: COPY.home.memory_empty });
});

// Every screen that reads the record: Home, Skills, and each built skill's detail.
async function screensOf(record) {
  const h = await ready({ memory: { status: "ok", record }, pathData: SIX_PATH, skillsBuilt: SKILLS_BUILT });
  const out = {};
  const draw = () => { const r = renderApp(h.app.model()); return r.nav + r.view; };
  out.home = { state: h.app.model().state, html: draw() };
  h.app.act("tab", { tab: "skills" });
  out.skills = { state: h.app.model().state, html: draw() };
  for (const id of Object.keys(SKILLS_BUILT.skills)) {
    h.app.act("open_skill", { skill: id });
    out[id] = { state: h.app.model().state, html: draw() };
    h.app.act("back_skills");
  }
  return out;
}

test("T070: Home, Skills and every skill's detail render the same with and without asked entries", async () => {
  const rec = WITH_ASKED();
  const withA = await screensOf(rec);
  const without = await screensOf(withoutAsked(rec));
  assert.deepEqual(Object.keys(withA), ["home", "skills", ...Object.keys(SKILLS_BUILT.skills)]);
  for (const k of Object.keys(withA)) {
    assert.equal(withA[k].state, without[k].state, `${k}: same state`);
    assert.equal(withA[k].html, without[k].html, `${k}: same screen`);
    assert.doesNotMatch(plain(withA[k].html), ASKED_WORDS, `${k}: nothing from an asked entry`);
  }
});

test("T070: an asked entry about a skill never makes it look tried, learned or due", async () => {
  // Only asked entries: the pivot was asked about and went deeper on, easing asked about after learning.
  const rec = { version: 1, skills: {}, lessons: [], asked: WITH_ASKED().asked };
  const withA = await screensOf(rec);
  const without = await screensOf(withoutAsked(rec));
  for (const k of Object.keys(withA)) assert.equal(withA[k].html, without[k].html, k);
  assert.equal(withA["transform.anchor"].state, without["transform.anchor"].state);
});
