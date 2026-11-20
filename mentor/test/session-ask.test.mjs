// Spec 014 T011 (data-model § 2): session.json's `ask` block. saveAnswer, latestAnswer and
// askStartedAt; the lessons, current and review_offers keep their shapes; an unreadable file behaves
// as it does for every other session reader (set aside, SESSION_UNREADABLE, then a fresh start).

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tempHome } from "./helpers.mjs";

const home = tempHome();
const SESSION = path.join(home, "session.json");
const session = await import("../lib/session.mjs");
const { SESSION_WINDOW_HOURS } = await import("../lib/recommend.mjs");
const { comp1 } = await import("./fixtures/expressions/comp1.mjs");

const HOUR = 3600 * 1000;
const T0 = Date.parse("2026-11-16T15:00:00.000Z");
const STEPS = [
  { text: "Open Shake Control's Position expression and look at how it sets each hit's size: it uses the first hit's size for all three. Not something I teach yet.", skill: "not_taught", layer: "Shake Control" },
  { text: "Select Shake Control (the null, not a letter) and Pan Behind its pivot to where the hammer hits.", skill: "transform.anchor", layer: "Shake Control" },
  { text: "Play it back and watch the turn.", skill: null, layer: null },
];
const answer = (over = {}) => ({ comp_id: 1, project: "Comp 1.aep", comp: "Comp 1", kind: "answer", steps: STEPS, offered_skills: ["transform.anchor"], goal: "shake turns from the hit point", ...over });
const onDisk = () => JSON.parse(fs.readFileSync(SESSION, "utf8"));

beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f.startsWith("session.json")) fs.rmSync(path.join(home, f));
});

test("saveAnswer writes data-model § 2's shape, and latestAnswer reads it back", () => {
  const saved = session.saveAnswer(answer(), { now: T0 });
  const want = {
    at: "2026-11-16T15:00:00.000Z", comp_id: 1, project: "Comp 1.aep", comp: "Comp 1", kind: "answer",
    steps: STEPS, offered_skills: ["transform.anchor"], goal: "shake turns from the hit point",
    explanation: null, entry_date: null, started_at: "2026-11-16T15:00:00.000Z",
  };
  assert.deepEqual(saved, want);
  assert.deepEqual(onDisk().ask, want);
  assert.deepEqual(session.latestAnswer({ now: T0 + HOUR }), want);
});

test("a howto with no comp saves nulls, never undefined, and a missing goal is null", () => {
  const saved = session.saveAnswer({ comp_id: null, project: null, comp: null, kind: "howto", steps: [], offered_skills: ["easing.speed_graph"] }, { now: T0 });
  assert.equal(saved.comp, null);
  assert.equal(saved.goal, null);
  assert.deepEqual(saved.steps, []);
  assert.deepEqual(Object.keys(onDisk().ask).sort(), ["at", "comp", "comp_id", "entry_date", "explanation", "goal", "kind", "offered_skills", "project", "started_at", "steps"]);
});

test("additive: an existing lesson, current and review_offers are untouched", () => {
  session.start(comp1(), { skill: "transform.anchor", analyze: () => ({ focus: [], targets: [], target_refs: [], demo_target: null }) });
  session.recordReviewOffer("keyframes.types");
  const before = onDisk();
  session.saveAnswer(answer(), { now: Date.now() });
  const after = onDisk();
  assert.deepEqual(after.lessons, before.lessons);
  assert.equal(after.current, before.current);
  assert.deepEqual(after.review_offers, before.review_offers);
  assert.equal(session.currentLesson().skill, "transform.anchor", "the lesson is still current");
});

test("a second answer replaces the first; started_at stays the first ask's time within the window", () => {
  session.saveAnswer(answer(), { now: T0 });
  const second = session.saveAnswer(answer({ kind: "describe", steps: [], offered_skills: [] }), { now: T0 + 2 * HOUR });
  assert.equal(second.kind, "describe");
  assert.equal(second.at, new Date(T0 + 2 * HOUR).toISOString());
  assert.equal(second.started_at, new Date(T0).toISOString());
  assert.equal(session.askStartedAt({ now: T0 + 2 * HOUR }), new Date(T0).toISOString());
});

test("started_at starts again once the window has lapsed", () => {
  session.saveAnswer(answer(), { now: T0 });
  const later = T0 + (SESSION_WINDOW_HOURS + 1) * HOUR;
  assert.equal(session.askStartedAt({ now: later }), null, "lapsed");
  const again = session.saveAnswer(answer(), { now: later });
  assert.equal(again.started_at, new Date(later).toISOString());
});

test("latestAnswer is null with no answer, or one older than the window unless asked for any", () => {
  assert.equal(session.latestAnswer(), null, "no session file");
  session.start(comp1(), { skill: "transform.anchor", analyze: () => ({ focus: [], targets: [], target_refs: [], demo_target: null }) });
  assert.equal(session.latestAnswer(), null, "a session with lessons only");
  assert.equal(session.askStartedAt(), null);
  session.saveAnswer(answer(), { now: T0 });
  const later = T0 + (SESSION_WINDOW_HOURS + 1) * HOUR;
  assert.equal(session.latestAnswer({ now: later }), null);
  assert.equal(session.latestAnswer({ now: later, any: true }).comp, "Comp 1");
});

test("a malformed ask block reads as none and is replaced by the next answer", () => {
  fs.writeFileSync(SESSION, JSON.stringify({ version: 1, current: null, lessons: {}, ask: "garbage" }));
  assert.equal(session.latestAnswer(), null);
  assert.equal(session.askStartedAt(), null);
  const saved = session.saveAnswer(answer(), { now: T0 });
  assert.equal(saved.started_at, saved.at);
});

test("latestAnswer returns a copy: changing it doesn't change the file", () => {
  session.saveAnswer(answer(), { now: Date.now() });
  const a = session.latestAnswer();
  a.steps.push({ text: "x", skill: null, layer: null });
  assert.equal(session.latestAnswer().steps.length, 3);
});

test("an unreadable session file behaves as today: set aside, SESSION_UNREADABLE, then a fresh start", () => {
  fs.writeFileSync(SESSION, "{ not json");
  assert.throws(() => session.saveAnswer(answer()), { code: "SESSION_UNREADABLE" });
  const aside = fs.readdirSync(home).filter((f) => f.startsWith("session.json.unreadable-"));
  assert.equal(aside.length, 1, "set aside, not written over");
  assert.equal(fs.readFileSync(path.join(home, aside[0]), "utf8"), "{ not json");
  const saved = session.saveAnswer(answer(), { now: T0 });
  assert.equal(saved.comp, "Comp 1", "the next call starts fresh");

  fs.writeFileSync(SESSION, JSON.stringify({ no: "lessons" }));
  assert.throws(() => session.latestAnswer(), { code: "SESSION_UNREADABLE" });
  fs.writeFileSync(SESSION, "[]");
  assert.throws(() => session.askStartedAt(), { code: "SESSION_UNREADABLE" });
});

test("saveAnswer refuses data that isn't plain JSON, before writing", () => {
  assert.throws(() => session.saveAnswer(null));
  assert.throws(() => session.saveAnswer(answer({ goal: () => 1 })));
  assert.equal(fs.existsSync(SESSION), false);
});
