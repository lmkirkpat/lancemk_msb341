"use strict";
// Spec 007 step 3 (T063 to T067): Practice due, Warm up, the tagged review and its endings.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ready, plain, SIX_PATH, SKILLS_BUILT } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const { homeView } = require("../lib/home.js");
const { practiceDue } = require("../lib/skills-view.js");
const { builtSkills } = require("../lib/skills.js");
const { COPY } = require("../lib/copy.js");

const NOW = new Date("2026-11-09T12:00:00.000Z");
const built = builtSkills(SIX_PATH, SKILLS_BUILT);
const ok = (record) => ({ status: "ok", record });
const LAST = "2026-10-26T12:00:00.000Z";
const lessons = [{ skill: "timing.offset", date: LAST, result: "passed" }];
const learned = (review_due, extra) => Object.assign({ status: "learned", last_practiced: LAST, review_due }, extra);
const TWO_DUE = { skills: { "easing.basic": learned("2026-10-13"), "timing.offset": learned("2026-11-09"), "transform.anchor": learned("2026-11-01") }, lessons };
const homeText = (h) => plain(renderApp(h.app.model()).view);
const onHome = (record, opts) => ready(Object.assign({ memory: ok(record), pathData: SIX_PATH }, opts));

// ---------- T063: Practice due on Home ----------

test("Practice due names the first due skill in path order and counts the rest (FR-051)", () => {
  const p = practiceDue({ memory: ok(TWO_DUE), built, now: NOW });
  assert.equal(p.skill, "timing.offset");
  assert.equal(p.rest, 1);
});

test("Practice due is never easing, whatever its date says (FR-051)", () => {
  const record = { skills: { "easing.basic": learned("2026-10-13") }, lessons };
  assert.equal(practiceDue({ memory: ok(record), built, now: NOW }), null);
});

test("Practice due compares the stored date with today and nothing more (PN-11)", () => {
  const at = (d) => practiceDue({ memory: ok({ skills: { "timing.offset": learned(d) }, lessons }), built, now: NOW });
  assert.ok(at("2026-11-09"), "today is due");
  assert.ok(at("2026-11-08"), "earlier is due");
  assert.equal(at("2026-11-10"), null, "tomorrow isn't");
  assert.equal(practiceDue({ memory: ok({ skills: { "timing.offset": { status: "learned", last_practiced: LAST } }, lessons }), built, now: NOW }), null, "no date, nothing due");
});

test("Practice due needs a learned skill (FR-051)", () => {
  const record = { skills: { "timing.offset": learned("2026-11-01", { status: "practicing" }) }, lessons };
  assert.equal(practiceDue({ memory: ok(record), built, now: NOW }), null);
});

test("an unreadable or missing record has nothing due", () => {
  assert.equal(practiceDue({ memory: { status: "unreadable", record: null }, built, now: NOW }), null);
  assert.equal(practiceDue({ memory: { status: "missing", record: null }, built, now: NOW }), null);
});

test("homeView without skills data still draws, with no card (older callers)", () => {
  assert.equal(homeView({ memory: ok(TWO_DUE), pathData: SIX_PATH }).practice, null);
});

test("Home's card: the skill, last practiced and the count, between Up next and memory", async () => {
  const h = await onHome(TWO_DUE);
  const text = homeText(h);
  assert.ok(text.includes(COPY.home.practice_due));
  assert.ok(text.includes("Break the lockstep with offset"));
  assert.ok(text.includes(`${COPY.home.last_practiced} Oct 26.`));
  assert.ok(text.includes(COPY.home.more_due(1)));
  assert.ok(text.indexOf(COPY.home.up_next) < text.indexOf(COPY.home.practice_due));
  assert.ok(text.indexOf(COPY.home.practice_due) < text.indexOf(COPY.home.memory_title));
  assert.doesNotMatch(text, /about \d+ min/, "no expected length");
});

test("Home's card with one due has no count line, and a record without last_practiced leaves that out", async () => {
  const h = await onHome({ skills: { "timing.offset": { status: "learned", review_due: "2026-11-01" } }, lessons });
  const text = homeText(h);
  assert.ok(text.includes(COPY.home.practice_due));
  assert.ok(!text.includes("is due in Skills"));
  assert.ok(!text.includes(COPY.home.last_practiced));
});

test("no card when nothing is due", async () => {
  const h = await onHome({ skills: { "timing.offset": learned("2026-12-01") }, lessons });
  assert.ok(!homeText(h).includes(COPY.home.practice_due));
});
