// Spec 004 wave B, tasks-wave-b T161 (spec 012 SR-1; contracts/skill-module.md › 4, data-model ›
// Session lesson): setSkillData() stores a skill's own measured data on its open lesson, separate
// from skill_options. The existing session tests stay as they are.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fixture, tempHome } from "./helpers.mjs";

const home = tempHome();
const session = await import("../lib/session.mjs");
const { analyze } = await import("../lib/analyze.mjs");

const SESSION = path.join(home, "session.json");
const SKILL = "parenting.null";
const A = fixture("attempt-before"); // comp 200
const B = fixture("linear-basic");   // comp 100

const calls = [];
function stub(snapshot, opts = {}) {
  calls.push(structuredClone(opts));
  const targets = snapshot.layers.flatMap((l) => l.properties.map((p) => `${l.index}:${p.path}`));
  return { targets, target_refs: targets.map(() => ({ layer: "x", property: "y" })), demo_target: targets[0] ?? null, no_demo_reason: null, focus: null };
}
const startSkill = (snap, opts = {}) => session.start(snap, { skill: SKILL, analyze: stub, ...opts });
const bytes = () => fs.readFileSync(SESSION, "utf8");
const NULL_DATA = { null_layer: "Group Null", region: "centre", stored: { anchor: [0, 0, 0], position: [960, 540, 0], scale: [100, 100, 100], rotation: 0 } };

beforeEach(() => {
  fs.rmSync(SESSION, { force: true });
  calls.length = 0;
});

test("setSkillData stores data on the open lesson, and currentLesson() returns it", () => {
  startSkill(A);
  const back = session.setSkillData(SKILL, 200, NULL_DATA);
  assert.deepEqual(back, NULL_DATA);
  assert.deepEqual(session.currentLesson().skill_data, NULL_DATA);
});

test("a continued lesson and a lesson resumed after another comp keep it", () => {
  startSkill(A);
  session.setSkillData(SKILL, 200, NULL_DATA);
  assert.equal(startSkill(A).lesson, "continued");
  assert.deepEqual(session.currentLesson().skill_data, NULL_DATA);
  startSkill(B);
  assert.equal(session.currentLesson().skill_data, undefined, "the other comp's lesson has none");
  const r = startSkill(A);
  assert.equal(r.lesson, "resumed");
  assert.deepEqual(r.session.skill_data, NULL_DATA);
});

test("a second call replaces it whole", () => {
  startSkill(A);
  session.setSkillData(SKILL, 200, NULL_DATA);
  session.setSkillData(SKILL, 200, { region: "left" });
  assert.deepEqual(session.currentLesson().skill_data, { region: "left" });
});

test("it's separate from skill_options, and the analyzer is never given it", () => {
  startSkill(A, { skill_options: { focus: ["Title"] } });
  session.setSkillData(SKILL, 200, NULL_DATA);
  assert.deepEqual(session.currentLesson().skill_options, { focus: ["Title"] });
  startSkill(A, { skill_options: { focus: ["Bar"] } });
  assert.deepEqual(session.currentLesson().skill_options, { focus: ["Bar"] });
  assert.deepEqual(session.currentLesson().skill_data, NULL_DATA, "setting skill_options didn't touch it");
  for (const opts of calls) assert.ok(!("skill_data" in opts), "the analyzer never sees skill_data");
});

test("no open lesson for that skill and comp: NO_LESSON, and session.json is byte-identical", () => {
  assert.throws(() => session.setSkillData(SKILL, 200, NULL_DATA), { code: "NO_LESSON" });
  assert.equal(fs.existsSync(SESSION), false);
  startSkill(A);
  const before = bytes();
  assert.throws(() => session.setSkillData(SKILL, 100, NULL_DATA), { code: "NO_LESSON" }, "another comp");
  assert.throws(() => session.setSkillData("anchor.pivot", 200, NULL_DATA), { code: "NO_LESSON" }, "another skill");
  session.markChecked(true);
  const passed = bytes();
  assert.throws(() => session.setSkillData(SKILL, 200, NULL_DATA), { code: "NO_LESSON" }, "a passed lesson");
  assert.equal(bytes(), passed);
  assert.notEqual(before, passed);
});

test("NO_LESSON's message is for the learner: no field or code names", () => {
  startSkill(A);
  let err;
  try { session.setSkillData(SKILL, 999, {}); } catch (e) { err = e; }
  assert.equal(err.code, "NO_LESSON");
  assert.doesNotMatch(err.message, /_|\w\.\w|NO_LESSON/);
});

test("a value that isn't plain JSON data throws before any write", () => {
  startSkill(A);
  const before = bytes();
  class Thing { constructor() { this.x = 1; } }
  for (const bad of [undefined, () => 1, new Date(), NaN, Infinity, { a: undefined }, [1, () => 2], new Thing(), new Map()]) {
    assert.throws(() => session.setSkillData(SKILL, 200, bad), (e) => e.code !== "NO_LESSON");
  }
  assert.equal(bytes(), before);
  assert.throws(() => session.setSkillData(SKILL, 999, () => 1), (e) => e.code !== "NO_LESSON", "bad data is refused first");
});

test("a new lesson after a pass, a change of mode, or fresh: true starts with none", () => {
  startSkill(A);
  session.setSkillData(SKILL, 200, NULL_DATA);
  assert.equal(startSkill(A, { fresh: true }).lesson, "new");
  assert.equal(session.currentLesson().skill_data, undefined, "fresh");

  session.setSkillData(SKILL, 200, NULL_DATA);
  startSkill(A, { mode: "review" });
  assert.equal(session.currentLesson().skill_data, undefined, "review mode");

  startSkill(A);
  session.setSkillData(SKILL, 200, NULL_DATA);
  session.markChecked(true);
  assert.equal(startSkill(A).lesson, "new");
  assert.equal(session.currentLesson().skill_data, undefined, "after a pass");
});

test("the session never reads inside it", () => {
  const plain = startSkill(A).session;
  session.setSkillData(SKILL, 200, { demo_target: "nope", targets: [], passed: true, mode: "review", demo: { at: "x" } });
  const again = startSkill(A);
  assert.equal(again.lesson, "continued");
  assert.deepEqual(again.session.targets, plain.targets);
  assert.equal(again.session.demo_target, plain.demo_target);
  assert.doesNotThrow(() => session.assertCanDemo(plain.demo_target));
  assert.throws(() => session.assertCanDemo("nope"), { code: "NOT_DEMO_TARGET" });
});

test("easing's behaviour is unchanged", () => {
  const first = session.start(A);
  fs.rmSync(SESSION, { force: true });
  startSkill(A);
  session.setSkillData(SKILL, 200, NULL_DATA);
  const second = session.start(A);
  assert.deepEqual(second.analysis, first.analysis);
  assert.deepEqual(second.analysis, { ...analyze(A), demo_target: second.analysis.demo_target });
  assert.equal(second.session.skill_data, undefined);
  assert.equal(second.lesson, "new");
});
