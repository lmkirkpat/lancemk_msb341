// Spec 014 T044 (research R6, contracts/hand-in.md › Opening a lesson from a hand-in): opening()'s
// hand-in step. A hand-in for this skill and comp comes before a due review, is used once, is ignored
// for another comp or skill, lapses after the window, and gives hand_in_lost when its layer is gone.
// Without a hand-in, opening() returns what it always did (the existing opening tests, unchanged,
// cover every other row). The time is injected; nothing here touches After Effects.

process.env.TZ = "America/Denver";

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const LEARNER = path.join(home, "learner.json");
const SESSION = path.join(home, "session.json");

const { opening } = await import("../lib/opening.mjs");
const session = await import("../lib/session.mjs");
const { FINDERS } = await import("../tools/index.mjs");

const SNAP = JSON.parse(fs.readFileSync(path.join(FIXTURES, "layer-info", "practice2b.json"), "utf8"));
const COMP_ID = SNAP.comp.id;
const NOW = new Date("2026-10-25T18:00:00.000Z");
const HOUR = 3600 * 1000;
const PIVOT = "transform.anchor";
const LAYER = SNAP.layer_info.find((l) => l.kind === "solid" || l.kind === "shape").name;

const dueRecord = () => fs.writeFileSync(LEARNER, JSON.stringify({
  version: 1, lessons: [],
  skills: { [PIVOT]: { status: "learned", last_practiced: "2026-10-12T18:00:00.000Z", times_passed: 1, next: "x", review_due: "2026-10-20", reviews_passed_in_row: 1 } },
}));
const handIn = (over = {}, at = NOW.getTime() - HOUR) => session.saveHandIn({ skill: PIVOT, comp_id: COMP_ID, layer: LAYER, step_number: 1, steps: [], goal: null, place_named: false, ...over }, { now: at });
const open = (over = {}) => opening({ skill: PIVOT, snapshot: SNAP, finder: FINDERS[PIVOT], now: NOW, ...over });

beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f.startsWith("session.json") || f.startsWith("learner.json")) fs.rmSync(path.join(home, f));
  dueRecord();
});

test("the fixture has a due review for the pivot without a hand-in (the row the hand-in comes before)", () => {
  const r = open();
  assert.equal(r.mode, "review");
  assert.equal(r.mode_source, "review_due");
  assert.equal("hand_in" in r, false);
});

test("a hand-in comes before a due review: a lesson, hand_in, never review (FR-023)", () => {
  handIn();
  const r = open();
  assert.equal(r.mode, "lesson");
  assert.equal(r.mode_source, "hand_in");
  assert.equal(r.hand_in.layer, LAYER);
  assert.equal(r.hand_in.used, true);
  assert.equal(r.learner.status, "learned", "the slice is the same as ever, so the lesson knows it's practice");
  assert.equal(session.reviewOffers().length, 0, "no review offer is remembered");
});

test("used once: the next opening is as it would be without one", () => {
  handIn();
  assert.equal(open().mode_source, "hand_in");
  const again = open();
  assert.equal(again.mode_source, "review_due");
  assert.equal("hand_in" in again, false);
});

test("another comp's hand-in, or another skill's, is ignored and left as it was", () => {
  handIn({ comp_id: COMP_ID + 1 });
  assert.equal(open().mode_source, "review_due");
  assert.equal(session.peekHandIn().used, false);
  handIn({ skill: "parenting.null" });
  assert.equal(open().mode_source, "review_due");
  assert.equal(session.peekHandIn().used, false);
});

test("lapsed after the session window", () => {
  handIn({}, NOW.getTime() - 4 * HOUR);
  assert.equal(open().mode_source, "review_due");
});

test("a skill whose finder doesn't take a hand-in never takes one, even its own", () => {
  handIn({ skill: "keyframes.types" });
  const r = opening({ skill: "keyframes.types", snapshot: SNAP, finder: FINDERS["keyframes.types"], now: NOW });
  assert.notEqual(r.mode_source, "hand_in");
  assert.equal(session.peekHandIn().used, false);
});

test("the call's mode: review leaves the hand-in for later; lesson takes it", () => {
  handIn();
  const asked = open({ mode: "review" });
  assert.equal(asked.mode, "review");
  assert.equal(asked.mode_source, "asked");
  assert.equal(session.peekHandIn().used, false);
  const lesson = open({ mode: "lesson" });
  assert.equal(lesson.mode_source, "hand_in");
  assert.equal(open({ mode: "lesson" }).mode_source, "asked", "and once taken, a lesson asked for is just that");
});

test("the hand-in's layer gone from the comp: hand_in_lost, a lesson, and the hand-in used", () => {
  handIn({ layer: "No Such Layer" });
  const r = open();
  assert.equal(r.mode, "lesson");
  assert.equal(r.mode_source, "hand_in_lost");
  assert.equal(r.hand_in.layer, "No Such Layer");
  assert.equal(session.peekHandIn().used, true);
});

test("a how-to's hand-in (no layer, no comp) opens a lesson on any comp", () => {
  handIn({ layer: null, comp_id: null, step_number: null });
  const r = open();
  assert.equal(r.mode_source, "hand_in");
  assert.equal(r.hand_in.layer, null);
});

test("a hand-in beats a lesson in progress too (step 2 comes before step 3)", () => {
  session.start(SNAP, { skill: PIVOT, analyze: () => ({ focus: null, targets: [], target_refs: [], demo_target: null }), mode: "review" });
  assert.equal(open().mode_source, "in_progress");
  handIn();
  assert.equal(open().mode_source, "hand_in");
});

test("with no hand-in, opening() writes nothing to session.json", () => {
  fs.rmSync(LEARNER);
  open();
  assert.equal(fs.existsSync(SESSION), false);
});

// ---- Spec 014 T072 (FR-032, research R6, rule 5): no due review opens a session started with a question.

const ask = (at) => session.saveAnswer({ comp_id: COMP_ID, project: SNAP.project, comp: SNAP.comp.name, kind: "answer", steps: [], offered_skills: [], goal: "g" }, { now: at });

test("T072: an ask in this session window: the due review isn't the opening; a lesson, and no review offer remembered", () => {
  ask(NOW.getTime() - HOUR);
  const r = open();
  assert.equal(r.mode, "lesson");
  assert.equal(r.mode_source, "default");
  assert.equal(session.reviewOffers().length, 0);
});

test("T072: a describe or how-to counts as an ask too (any answer started the session)", () => {
  session.saveAnswer({ comp_id: null, project: null, comp: null, kind: "howto", steps: [], offered_skills: [], goal: null }, { now: NOW.getTime() - HOUR });
  assert.equal(open().mode_source, "default");
});

test("T072: an ask before the window doesn't hold the review back", () => {
  ask(NOW.getTime() - 4 * HOUR);
  assert.equal(open().mode_source, "review_due");
});

test("T072: the learner can still ask for the review, and a hand-in still comes first", () => {
  ask(NOW.getTime() - HOUR);
  assert.equal(open({ mode: "review" }).mode, "review");
  handIn();
  assert.equal(open().mode_source, "hand_in");
});
