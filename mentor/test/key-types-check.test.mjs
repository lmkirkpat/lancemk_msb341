// Spec 009 T005, T006: the check per pair, should-move holds, extra holds, demo credit (FR-011 to
// FR-013, FR-016, research R5), and the stage 6 constant-speed verdict (FR-014, research R6). Pure:
// the lesson is a plain object shaped like the session's.

import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, check, constantSpeed, grade, OPACITY_PATH } from "../lib/key-types.mjs";
import { answerKey, load } from "./fixtures/key-types/load.mjs";

const KEY = answerKey();
const B = (i) => `1/${OPACITY_PATH}/${i}`;

function lessonFor(baselineFile, { focus, should_move, demo, demoUndone, mode = "lesson" } = {}) {
  const baseline = load(baselineFile);
  const skill_options = { focus: focus || [], should_move: should_move || [] };
  const a = analyze(baseline, { skill_options });
  const lesson = { comp_id: baseline.comp.id, mode, baseline, targets: a.targets, skill_options, demo: null };
  if (demo) lesson.demo = { segment_id: demo, at: "2026-10-21T12:00:00.000Z", ...(demoUndone ? { undone: "2026-10-21T12:01:00.000Z" } : {}) };
  return lesson;
}

test("every check in the answer key grades as written", () => {
  for (const c of KEY.checks) {
    const lesson = lessonFor(c.baseline, { focus: c.focus, demo: c.demo, demoUndone: c.demo_seen_undone });
    const r = check(lesson.baseline, load(c.current), lesson, { should_move: c.should_move || [] });
    assert.equal(r.comp_matches, c.comp_matches ?? true, c.name);
    const got = Object.fromEntries(r.pairs.map(({ id, verdict, state, frame_time }) =>
      [id, { verdict, ...(state ? { state } : {}), ...(frame_time != null ? { frame_time } : {}) }]));
    assert.deepEqual(got, c.pairs, c.name);
    assert.deepEqual(r.should_move_held, c.should_move_held, c.name);
    assert.deepEqual(r.extra_holds, c.extra_holds, c.name);
    assert.equal(r.passed, c.passed, c.name);
    if ("demo_undone" in c) assert.equal(r.demo_undone, c.demo_undone, c.name);
  }
});

test("a not-held pair's frame_time is inside the pair, on a frame", () => {
  const lesson = lessonFor("practice2-before.json", { focus: [{ layer: "Blink", property: "Opacity" }] });
  const r = check(lesson.baseline, load("practice2-before.json"), lesson);
  for (const p of r.pairs) {
    const [from, to] = p.label.match(/([\d.]+)–([\d.]+) s$/).slice(1).map(Number);
    assert.ok(p.frame_time > from && p.frame_time < to, p.label);
    assert.ok(Math.abs(p.frame_time * 30 - Math.round(p.frame_time * 30)) < 0.02, p.label);
  }
  assert.equal(r.pairs[0].label, "Blink › Opacity 1–1.4 s");
});

test("a wrong-side or mixed pair is never a pass (row 6, FR-016)", () => {
  for (const file of ["wrong-side.json", "mixed-pair.json"]) {
    const lesson = lessonFor("practice2-before.json", { focus: [{ layer: "Blink", property: "Opacity" }] });
    const r = check(lesson.baseline, load(file), lesson);
    assert.equal(r.items.held, false, file);
    assert.equal(r.passed, false, file);
  }
});

test("should-move is the union of the stored list and the check's input", () => {
  const lesson = lessonFor("practice2-before.json", { focus: [{ layer: "Blink", property: "Opacity" }], should_move: [{ layer: "Cut", property: "Opacity" }] });
  const r = check(lesson.baseline, load("select-all-hold.json"), lesson, { should_move: [{ layer: "Card", property: "Position" }] });
  assert.deepEqual(r.should_move_held.map((s) => `${s.layer} › ${s.property}`), ["Cut › Opacity", "Card › Position"]);
  assert.deepEqual(r.extra_holds.map((s) => `${s.layer} › ${s.property}`), ["Card › Scale", "Pause › Position", "Pause › Position"]);
  assert.equal(r.items.none_should_move_held, false);
  // Neither list is repeated in other_changes.
  assert.equal(r.other_changes.some((n) => /^(Cut|Card|Pause) › /.test(n)), false, r.other_changes.join("; "));
});

test("a should-move pair already held at the start isn't the learner's doing", () => {
  const lesson = lessonFor("practice2-before.json", { focus: [{ layer: "Blink", property: "Opacity" }], should_move: [{ layer: "Flag", property: "Position" }] });
  const r = check(lesson.baseline, load("practice2-before.json"), lesson);
  assert.deepEqual(r.should_move_held, []);
});

test("the demo pair stays the demo's until a check sees it not held, then it's the learner's (row 20)", () => {
  const focus = [{ layer: "Blink", property: "Opacity" }];
  const lesson = lessonFor("practice2-before.json", { focus, demo: B(1) });
  // No check in between: a hold there can't be told from the demo.
  assert.equal(check(lesson.baseline, load("after-demo-reheld.json"), lesson).pairs[0].verdict, "held_by_demo");
  const undone = check(lesson.baseline, load("after-demo-undone.json"), lesson);
  assert.equal(undone.demo_undone, true);
  assert.equal(undone.pairs[0].demo_undone, true);
  lesson.demo.undone = "2026-10-21T12:01:00.000Z"; // what markChecked({ demoUndone: true }) stores
  assert.equal(check(lesson.baseline, load("after-demo-reheld.json"), lesson).pairs[0].verdict, "held_by_learner");
});

test("another comp: comp_matches false, nothing graded (row 23)", () => {
  const lesson = lessonFor("practice2-before.json", { focus: [{ layer: "Blink", property: "Opacity" }] });
  const r = check(lesson.baseline, load("practice-now.json"), lesson, { constant_speed: { layer: "Logo", property: "Rotation" } });
  assert.equal(r.comp_matches, false);
  assert.equal(r.lesson_comp, "Mentor Practice 2");
  assert.deepEqual(r.pairs, []);
  assert.equal(r.constant_speed, null);
  assert.equal(r.passed, false);
});

test("a lesson with no targets can't pass", () => {
  const lesson = lessonFor("practice2-before.json");
  const r = check(lesson.baseline, load("blink-all-held.json"), lesson);
  assert.deepEqual(r.pairs, []);
  assert.equal(r.passed, false);
});

test("key changes under an expression are still listed as other changes (row 1)", () => {
  const before = load("loopout-blink.json");
  const now = structuredClone(before); // in-test edit: a key under the expression set to hold
  now.layers.find((l) => l.name === "Loop Blink").properties[0].keys[0].out_type = "hold";
  const lesson = { comp_id: before.comp.id, baseline: before, targets: analyze(before, { skill_options: { focus: [{ layer: "Blink", property: "Opacity" }] } }).targets, skill_options: {}, demo: null };
  const r = check(before, now, lesson);
  assert.ok(r.other_changes.some((n) => n.startsWith("Loop Blink › Opacity keys were changed") && /expression/.test(n)), r.other_changes.join("; "));
  assert.deepEqual(r.extra_holds, [], "not graded as an extra hold");
});

// ---- Stage 6 (T006)

test("constant-speed verdicts match the answer key", () => {
  for (const [file, key] of Object.entries(KEY.fixtures)) {
    for (const c of key.constant_speed || []) {
      const v = constantSpeed(load(file), c.ref);
      assert.equal(v.verdict, c.verdict, `${file}: ${JSON.stringify(c.ref)}`);
      if (c.detail) assert.deepEqual(v.detail.map(({ from_time, to_time, side }) => ({ from_time, to_time, side })), c.detail);
    }
  }
});

test("Spinner linear; one pair eased is not_linear with the pair and side", () => {
  assert.equal(constantSpeed(load("practice2-before.json"), { layer: "Spinner", property: "Rotation" }).verdict, "linear");
  const v = constantSpeed(load("spinner-eased.json"), { layer: "Spinner", property: "Rotation" });
  assert.equal(v.verdict, "not_linear");
  assert.deepEqual(v.detail, [{ pair: "Spinner › Rotation 0.25–4.25 s", from_time: 0.25, to_time: 4.25, side: "start" }]);
  assert.deepEqual(v.properties, [{ layer: "Spinner", property: "Rotation" }]);
});

test("separated Position needs every dimension linear", () => {
  const ok = constantSpeed(load("practice2-before.json"), { layer: "Dot 3", property: "Position" });
  assert.equal(ok.verdict, "linear");
  assert.deepEqual(ok.properties.map((p) => p.property), ["X Position", "Y Position"]);
  assert.equal(constantSpeed(load("separated-x-held.json"), { layer: "Dot 3", property: "Position" }).verdict, "held");
});

test("items.constant_speed: null when nothing is named or the verdict is expression; false blocks the pass", () => {
  const lesson = lessonFor("practice2-before.json", { focus: [{ layer: "Blink", property: "Opacity" }] });
  const all = load("blink-all-held.json");
  assert.equal(check(lesson.baseline, all, lesson).items.constant_speed, null);
  const lin = check(lesson.baseline, all, lesson, { constant_speed: { layer: "Spinner", property: "Rotation" } });
  assert.equal(lin.items.constant_speed, true);
  assert.equal(lin.passed, true);
  const notFound = check(lesson.baseline, all, lesson, { constant_speed: { layer: "Nobody", property: "Rotation" } });
  assert.equal(notFound.items.constant_speed, false);
  assert.equal(notFound.passed, false);
  // An expression doesn't apply: in Mentor Practice 2's loopOut fixture, Loop Blink.
  const loop = lessonFor("loopout-blink.json", { focus: [{ layer: "Blink", property: "Opacity" }] });
  const loopAll = structuredClone(load("loopout-blink.json"));
  for (const k of loopAll.layers[0].properties[0].keys) k.out_type = "hold"; // in-test edit: Blink held
  const ex = check(loop.baseline, loopAll, loop, { constant_speed: { layer: "Loop Blink", property: "Opacity" } });
  assert.equal(ex.constant_speed.verdict, "expression");
  assert.equal(ex.items.constant_speed, null);
  assert.equal(ex.passed, true);
});

test("in a review a volunteered constant-speed move doesn't change the pass (H-4)", () => {
  const lesson = lessonFor("practice2-before.json", { focus: [{ layer: "Blink", property: "Opacity" }], mode: "review" });
  const r = check(lesson.baseline, load("blink-all-held.json"), lesson, { constant_speed: { layer: "Blink", property: "Opacity" } });
  assert.equal(r.constant_speed.verdict, "held");
  assert.equal(r.items.constant_speed, null);
  assert.equal(r.passed, true);
  assert.equal(grade(r, { mode: "lesson" }).passed, false, "the same result in a lesson fails item 3");
});
