// Spec 007 T014: Home at step 1 (plan P9, FR-007, FR-008, FR-010, FR-012): from the record and the
// path data alone, with no mentor turn.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { homeView, readPathData, startRequest } = require("../lib/home.js");
const { readLearnerRecord } = require("../lib/memory.js");
const { REQUESTS } = require("../lib/requests.js");
const { COPY } = require("../lib/copy.js");

const REPO = path.join(__dirname, "..", "..");
const RECORDS = path.join(__dirname, "fixtures", "records");
const pathData = readPathData({ repoPath: REPO });
const read = (n) => readLearnerRecord({ home: path.join(RECORDS, n) });

test("the path data is read from the repo; unreadable reads as nothing", () => {
  assert.equal(pathData.skills[0].id, "easing.basic");
  assert.equal(readPathData({ repoPath: "/nowhere" }), null);
});

test("home-first: no record, Up next is the path's first skill with Start lesson", () => {
  const v = homeView({ memory: read("none"), pathData });
  assert.equal(v.has_history, false);
  assert.equal(v.hello.text, COPY.home.welcome_first);
  assert.equal(v.up_next.kicker, COPY.home.up_next);
  assert.equal(v.up_next.name, "Easing");
  assert.equal(v.up_next.why, COPY.home.first_why);
  assert.deepEqual(v.up_next.start, { kind: "start", label: COPY.buttons.start, request: REQUESTS.start.request });
  assert.equal(v.up_next.pick_skill, COPY.buttons.pick_skill);
  assert.deepEqual(v.memory, { empty: true, text: COPY.home.memory_empty });
});

test("FR-010: Up next is position 0 in the path data, not a skill the panel picks", () => {
  const skills = [{ id: "keyframes.types", name: "Second" }, { id: "easing.basic", name: "Easing" }];
  const v = homeView({ memory: read("none"), pathData: { skills } });
  assert.equal(v.up_next.name, "Second");
  assert.equal(v.up_next.start, null, "step 1 can only start easing, so nothing else offers Start lesson");
});

test("home-return-interim (plan P9): a record keeps step 1's Up next and adds the memory card", () => {
  const v = homeView({ memory: read("one-lesson"), pathData });
  assert.equal(v.has_history, true);
  assert.equal(v.up_next.name, "Easing");
  assert.deepEqual(v.up_next.start.request, "/ease-mentor");
  assert.equal(v.memory.empty, false);
  assert.equal(v.memory.skill, "Easing");
  assert.equal(v.memory.result, "passed");
  assert.equal(v.memory.next, "Practice note 1.");
  assert.equal(v.hello.text, COPY.home.welcome_back);
  assert.match(v.hello.sub, /^Last lesson [A-Z][a-z]{2} \d{1,2}: Easing, passed\.$/);
});

test("a record with no lessons in it is still a first run", () => {
  const v = homeView({ memory: { status: "ok", record: { skills: {}, lessons: [] } }, pathData });
  assert.equal(v.has_history, false);
  assert.equal(v.hello.text, COPY.home.welcome_first);
});

test("unreadable is never a first run, though its cards read like one (FR-011)", () => {
  for (const name of ["unreadable", "set-aside"]) {
    const v = homeView({ memory: read(name), pathData });
    assert.equal(v.unreadable, true, name);
    assert.equal(v.hello, null, name);
    assert.equal(v.up_next.name, "Easing", name);
  }
});

test("missing fields leave that part out of the hello line (FR-050)", () => {
  const memory = { status: "ok", record: { skills: {}, lessons: [{ skill: "easing.basic" }] } };
  assert.equal(homeView({ memory, pathData }).hello.sub, "Last lesson: Easing.");
});

test("FR-007: with no path data the Up next card is left out, not shown empty", () => {
  assert.equal(homeView({ memory: read("none"), pathData: null }).up_next, null);
});

test("Start lesson sends the skill's start request, and the same request every time (FR-012, RQ-01)", () => {
  assert.equal(startRequest("easing.basic").request, "/ease-mentor");
  assert.equal(startRequest("made.up"), null);
  assert.equal(startRequest("toString"), null);
});

test("SC-004: a 20-lesson record draws well under a second, with no mentor turn", () => {
  const start = process.hrtime.bigint();
  const v = homeView({ memory: read("twenty-lessons"), pathData });
  assert.equal(v.memory.next, "Practice note 20.");
  assert.ok(Number(process.hrtime.bigint() - start) / 1e6 < 1000);
});

test("no ids or field names reach the view", () => {
  const v = homeView({ memory: read("twenty-lessons"), pathData });
  const shown = JSON.stringify({ hello: v.hello, name: v.up_next.name, why: v.up_next.why, memory: v.memory });
  assert.doesNotMatch(shown, /easing\.basic|last_practiced|times_passed/);
});
