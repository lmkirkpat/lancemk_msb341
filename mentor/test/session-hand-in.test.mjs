// Spec 014 T042 (data-model § 2, research R5): session.json's hand-in. saveHandIn writes its shape
// with no learner words; takeHandIn gives it once, to its own skill on the same comp, inside the
// session window; session.start keeps a lesson's hand-in through a continue and a fresh restart, and
// starts a lesson without one exactly as before.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tempHome } from "./helpers.mjs";

const home = tempHome();
const SESSION = path.join(home, "session.json");
const session = await import("../lib/session.mjs");
const { SESSION_WINDOW_HOURS } = await import("../lib/recommend.mjs");

const HOUR = 3600 * 1000;
const T0 = Date.parse("2026-11-19T15:00:00.000Z");
const STEPS = [
  { text: "Open Shake Control's Rotation expression and look at its amounts: 0.75° at most. Not something I teach yet.", skill: "not_taught", layer: "Shake Control" },
  { text: "Select Shake Control (the null, not a letter) and Pan Behind its pivot to where the hammer hits.", skill: "transform.anchor", layer: "Shake Control" },
  { text: "Play it back and watch the turn.", skill: null, layer: null },
];
const handIn = (over = {}) => ({ skill: "transform.anchor", comp_id: 1, layer: "Shake Control", step_number: 2, steps: STEPS, goal: "a shake that turns from where it's hit", place_named: true, ...over });
const onDisk = () => JSON.parse(fs.readFileSync(SESSION, "utf8"));

beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f.startsWith("session.json")) fs.rmSync(path.join(home, f));
});

test("saveHandIn writes data-model § 2's shape, and nothing else", () => {
  const saved = session.saveHandIn({ ...handIn(), question: "make it shake from where the hammer hits" }, { now: T0 });
  const want = { ...handIn(), at: "2026-11-19T15:00:00.000Z", used: false };
  assert.deepEqual(saved, want);
  assert.deepEqual(onDisk().hand_in, want);
  assert.deepEqual(Object.keys(onDisk().hand_in).sort(), ["at", "comp_id", "goal", "layer", "place_named", "skill", "step_number", "steps", "used"]);
  assert.ok(!JSON.stringify(onDisk()).includes("make it shake"), "the learner's words are never saved");
});

test("additive: lessons, current, review_offers and ask keep their shapes", () => {
  session.saveAnswer({ comp_id: 1, project: "Comp 1.aep", comp: "Comp 1", kind: "answer", steps: STEPS, offered_skills: ["transform.anchor"], goal: null }, { now: T0 });
  session.recordReviewOffer("easing.basic");
  const before = onDisk();
  session.saveHandIn(handIn(), { now: T0 });
  const after = onDisk();
  for (const k of ["version", "current", "lessons", "review_offers", "ask"]) assert.deepEqual(after[k], before[k], k);
});

test("takeHandIn: once, for its own skill on the same comp", () => {
  session.saveHandIn(handIn(), { now: T0 });
  assert.equal(session.takeHandIn("parenting.null", 1, { now: T0 }), null, "another skill's");
  assert.equal(session.takeHandIn("transform.anchor", 2, { now: T0 }), null, "another comp's");
  assert.equal(onDisk().hand_in.used, false, "a miss leaves it as it was");
  const taken = session.takeHandIn("transform.anchor", 1, { now: T0 + 60000 });
  assert.equal(taken.layer, "Shake Control");
  assert.equal(taken.used, true);
  assert.equal(onDisk().hand_in.used, true);
  assert.equal(session.takeHandIn("transform.anchor", 1, { now: T0 + 120000 }), null, "used once");
});

test("takeHandIn: lapses after the session window", () => {
  session.saveHandIn(handIn(), { now: T0 });
  assert.equal(session.takeHandIn("transform.anchor", 1, { now: T0 + (SESSION_WINDOW_HOURS * HOUR) + 1 }), null);
  assert.equal(session.takeHandIn("transform.anchor", 1, { now: T0 + SESSION_WINDOW_HOURS * HOUR - 1 }).used, true);
});

test("a how-to's hand-in (no comp) fits any comp", () => {
  session.saveHandIn(handIn({ comp_id: null, layer: null, step_number: null, steps: [] }), { now: T0 });
  assert.equal(session.takeHandIn("transform.anchor", 7, { now: T0 }).layer, null);
});

test("no hand-in: takeHandIn reads only and returns null, and writes no file", () => {
  assert.equal(session.takeHandIn("transform.anchor", 1), null);
  assert.equal(fs.existsSync(SESSION), false);
  assert.equal(session.peekHandIn(), null);
});

test("an unreadable session file: SESSION_UNREADABLE, set aside, as for every reader", () => {
  fs.writeFileSync(SESSION, "{ not json");
  assert.throws(() => session.takeHandIn("transform.anchor", 1), (e) => e.code === "SESSION_UNREADABLE");
  assert.equal(session.takeHandIn("transform.anchor", 1), null);
});

// ---- session.start carries the lesson's hand-in

const snap = (id = 1, time = 0) => ({ project: "p.aep", comp: { id, name: "Comp 1", time }, layers: [] });
const seen = [];
const analyze = (s, o) => { seen.push(o); return { focus: o.skill_options ? o.skill_options.focus : null, targets: ["a/1", "a/2"], target_refs: [], demo_target: null, no_demo_reason: "x" }; };
const LESSON_HAND_IN = { layer: "Shake Control", step_number: 2, steps: STEPS.map((s) => s.text), place_named: true };

test("start with hand_in: stored on the lesson and passed to the analyzer; a continue and a fresh restart keep it", () => {
  seen.length = 0;
  const first = session.start(snap(), { skill: "transform.anchor", analyze, hand_in: LESSON_HAND_IN });
  assert.equal(first.lesson, "new");
  assert.deepEqual(first.session.hand_in, LESSON_HAND_IN);
  assert.ok(seen.every((o) => o.hand_in === LESSON_HAND_IN));
  const again = session.start(snap(), { skill: "transform.anchor", analyze, skill_options: { focus: ["x"] } });
  assert.equal(again.lesson, "continued");
  assert.deepEqual(again.session.hand_in, LESSON_HAND_IN);
  const restarted = session.start(snap(), { skill: "transform.anchor", analyze, fresh: true });
  assert.equal(restarted.lesson, "new");
  assert.deepEqual(restarted.session.hand_in, LESSON_HAND_IN, "a fresh restart of the same lesson keeps it");
});

test("start with hand_in replaces a lesson already checked, where fresh alone is refused", () => {
  session.start(snap(), { skill: "transform.anchor", analyze });
  session.markChecked(false);
  assert.throws(() => session.start(snap(), { skill: "transform.anchor", analyze, fresh: true }), (e) => e.code === "LESSON_UNDERWAY");
  const r = session.start(snap(), { skill: "transform.anchor", analyze, hand_in: LESSON_HAND_IN });
  assert.equal(r.lesson, "new");
  assert.equal(r.session.checked, undefined);
  assert.deepEqual(r.session.hand_in, LESSON_HAND_IN);
});

test("without a hand-in, a lesson has no hand_in key and its analyzer gets none, as before", () => {
  seen.length = 0;
  const r = session.start(snap(), { skill: "transform.anchor", analyze });
  assert.equal("hand_in" in r.session, false);
  assert.ok(seen.every((o) => !("hand_in" in o)));
  session.markChecked(true);
  const next = session.start(snap(), { skill: "transform.anchor", analyze, hand_in: undefined });
  assert.equal("hand_in" in next.session, false);
});

test("a passed hand-in lesson doesn't hand its hand-in to the next lesson", () => {
  session.start(snap(), { skill: "transform.anchor", analyze, hand_in: LESSON_HAND_IN });
  session.markChecked(true);
  const next = session.start(snap(), { skill: "transform.anchor", analyze, fresh: true });
  assert.equal("hand_in" in next.session, false);
});

test("hand_in only on a lesson, as plain data", () => {
  assert.throws(() => session.start(snap(), { skill: "transform.anchor", analyze, mode: "review", hand_in: LESSON_HAND_IN }), /hand_in/);
  assert.throws(() => session.start(snap(), { skill: "transform.anchor", analyze, hand_in: { at: new Date() } }), /hand_in/);
});
