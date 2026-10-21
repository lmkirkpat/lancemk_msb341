// Spec 009 T027 (FR-021, SC-003): one test per row of spec › Edge cases where concepts overlap, each
// saying what candidates and focus see and what the check sees, on its fixture (stand-ins until the
// live sitting; tasks T033 swaps them).

import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, candidates, check, constantSpeed, OPACITY_PATH } from "../lib/key-types.mjs";
import { answerKey, load } from "./fixtures/key-types/load.mjs";

const KEY = answerKey();
const names = (list) => list.map((c) => `${c.layer} › ${c.property}`);
const focus = (file, refs, opts = {}) => analyze(load(file), { ...opts, skill_options: { focus: refs } });
const leftOut = (r, reason) => (r.left_out.find((g) => g.reason === reason) || { properties: [], layers: [] });
const B = (i) => `1/${OPACITY_PATH}/${i}`;
const BLINK = [{ layer: "Blink", property: "Opacity" }];

function grade(baselineFile, currentFile, refs, { demo, should_move, demoUndone } = {}) {
  const baseline = load(baselineFile);
  const skill_options = { focus: refs, should_move: should_move || [] };
  const lesson = { comp_id: baseline.comp.id, baseline, targets: analyze(baseline, { skill_options }).targets, skill_options, demo: null };
  if (demo) lesson.demo = { segment_id: demo, ...(demoUndone ? { undone: "x" } : {}) };
  return check(baseline, load(currentFile), lesson);
}
const checkCase = (name) => KEY.checks.find((c) => c.name.startsWith(name));
const verdicts = (r) => Object.fromEntries(r.pairs.map((p) => [p.id, p.verdict]));

test("row 1: expression over keys: not a candidate, refused as a focus, reported as expression at stage 6", () => {
  const r = analyze(load("loopout-blink.json"));
  assert.ok(!names(r.candidates).includes("Loop Blink › Opacity"));
  assert.deepEqual(names(leftOut(r, "expression").properties), ["Loop Blink › Opacity"]);
  assert.deepEqual(focus("loopout-blink.json", [{ layer: "Loop Blink", property: "Opacity" }]).refused[0].reason, "expression");
  assert.equal(constantSpeed(load("practice-now.json"), { layer: "Logo", property: "Rotation" }).verdict, "expression");
});

test("row 2: an expression with no keys isn't read, and nothing claims there's no expression", () => {
  const r = analyze(load("practice2-before.json"));
  const text = JSON.stringify(r);
  assert.doesNotMatch(text, /no_expression|without_expression|"none"/);
  assert.deepEqual(r.left_out, [], "nothing is said about properties the read can't see");
  assert.equal(focus("practice2-before.json", [{ layer: "Cut", property: "Scale" }]).refused[0].reason, "not_found");
});

test("row 3: a single key isn't a pair, a candidate or a focus", () => {
  const r = focus("practice-now.json", [{ layer: "Logo", property: "Scale" }]);
  assert.deepEqual(r.refused, [{ layer: "Logo", property: "Scale", reason: "single_key" }]);
  assert.equal(constantSpeed(load("practice-now.json"), { layer: "Logo", property: "Scale" }).verdict, "single_key");
});

test("row 4: an already held pair (the Cursor) isn't a candidate, is a stage 2 example, and is never the learner's", () => {
  const r = analyze(load("practice-now.json"));
  assert.ok(!names(r.candidates).includes("Cursor › Opacity"));
  assert.equal(r.held_examples[0].layer, "Cursor");
  assert.deepEqual(names(leftOut(r, "already_held").properties), ["Cursor › Opacity"]);
  assert.equal(focus("practice-now.json", [{ layer: "Cursor", property: "Opacity" }]).refused[0].reason, "all_held");
});

test("row 5: some pairs held already: targets are the others only", () => {
  assert.deepEqual(focus("blink-one-held.json", BLINK).targets, [B(1), B(3)]);
});

test("row 6: a mixed pair is not held: a candidate, never a pass, reported as wrong_side", () => {
  assert.ok(names(candidates(load("mixed-pair.json"))).includes("Blink › Opacity"));
  const r = grade("practice2-before.json", "mixed-pair.json", BLINK);
  assert.equal(verdicts(r)[B(1)], "wrong_side");
  assert.equal(r.passed, false);
});

test("row 7: separated Position means each dimension, each checked on its own", () => {
  const c = checkCase("X Position held");
  const r = grade(c.baseline, c.current, c.focus);
  assert.deepEqual(verdicts(r), Object.fromEntries(Object.entries(c.pairs).map(([k, v]) => [k, v.verdict])));
  assert.deepEqual(r.pairs.map((p) => p.label), ["Dot 3 › X Position 0.5–1.5 s", "Dot 3 › Y Position 0.5–1.25 s"]);
});

test("row 8: hold-only effect parameters and Source Text read as held: not candidates, refused, never credited", () => {
  const r = analyze(load("hold-only-effect.json"));
  assert.deepEqual(names(leftOut(r, "already_held").properties), KEY.fixtures["hold-only-effect.json"].left_out.already_held);
  const f = focus("hold-only-effect.json", [{ layer: "Toggle", property: "Checkbox" }, { layer: "Label", property: "Source Text" }]);
  assert.deepEqual(f.refused.map((x) => x.reason), ["all_held", "all_held"]);
  const g = grade("hold-only-effect.json", "hold-only-effect.json", BLINK);
  assert.deepEqual(g.extra_holds, [], "already held at the start, so not the learner's");
});

test("row 9: Opacity on a shape fill or text animator isn't a candidate, but is graded when named", () => {
  assert.deepEqual(names(candidates(load("nested-opacity.json"))), ["Blink › Opacity", "Cut › Opacity"]);
  const f = KEY.fixtures["nested-opacity.json"].focus[0];
  assert.deepEqual(focus("nested-opacity.json", f.refs).targets, f.targets);
});

test("row 10: a precomp layer's own keys can be candidates; inside isn't read", () => {
  const r = analyze(load("overlap-layers.json"));
  assert.ok(names(candidates(load("overlap-layers.json"))).includes("Icon › Opacity"));
  assert.deepEqual(leftOut(r, "precomp").layers, ["Icon"]);
  assert.equal(focus("overlap-layers.json", [{ layer: "Icon", property: "Scale" }]).refused[0].reason, "precomp_inside");
  assert.equal(focus("practice-now.json", [{ layer: "Icon", property: "Opacity" }]).refused[0].reason, "precomp_inside");
});

test("row 11: a hidden layer isn't a candidate, is left out, can be the focus, never the demo", () => {
  const r = analyze(load("overlap-layers.json"));
  assert.ok(leftOut(r, "hidden").layers.includes("Ghost"));
  const f = focus("overlap-layers.json", [{ layer: "Ghost", property: "Opacity" }]);
  assert.equal(f.targets.length, 2);
  assert.equal(f.demo_target, null);
});

test("row 12: a hold at Opacity 0 is a normal layer: still enabled, graded as held, never left out as hidden", () => {
  const snap = load("hold-at-zero.json");
  assert.equal(snap.layers.find((l) => l.name === "Blink").enabled, true);
  const r = analyze(snap);
  assert.ok(!leftOut(r, "hidden").layers.includes("Blink"));
  assert.equal(verdicts(grade("practice2-before.json", "hold-at-zero.json", BLINK))[B(2)], "held_by_learner");
});

test("row 13: a matte with its eye off is left out like any eye-off layer until wave B", () => {
  const r = analyze(load("overlap-layers.json"));
  assert.ok(leftOut(r, "hidden").layers.includes("Matte"));
  assert.ok(!names(candidates(load("overlap-layers.json"))).includes("Matte › Opacity"));
  assert.equal(focus("overlap-layers.json", [{ layer: "Matte", property: "Opacity" }]).targets.length, 1);
});

test("row 14: a null isn't a candidate, can be the focus, never the demo", () => {
  assert.ok(!names(candidates(load("overlap-layers.json"))).includes("Rig › Opacity"));
  const f = focus("overlap-layers.json", [{ layer: "Rig", property: "Opacity" }, { layer: "Rig", property: "Position" }]);
  assert.equal(f.targets.length, 2);
  assert.equal(f.demo_target, null);
  assert.equal(f.no_demo_reason, "hidden_or_null");
});

test("row 15: parenting: only the layer's own keys are read", () => {
  // Title and Subtitle are parented to CTRL in Mentor Practice; CTRL's Position isn't anyone else's pair.
  const r = analyze(load("practice-now.json"));
  assert.deepEqual(names(r.candidates), ["Subtitle › Opacity", "Title › Opacity"]);
  const f = focus("practice-now.json", [{ layer: "Title", property: "Position" }]);
  assert.ok(f.targets.every((id) => id.startsWith("1/")), "Title's own pairs only");
  assert.equal(f.targets.length, 2, "its 3 s to 4.37 s pair is a pause in the stand-in");
});

test("row 16: pause pairs are neither candidates nor targets; a held pause isn't an extra hold; a pause-only property is refused", () => {
  assert.deepEqual(focus("practice2-before.json", [{ layer: "Pause", property: "Position" }]).targets, [
    `13/ADBE Transform Group/ADBE Position/1`, `13/ADBE Transform Group/ADBE Position/3`,
  ]);
  const r = grade("practice2-before.json", "select-all-hold.json", BLINK, { should_move: [{ layer: "Cut", property: "Opacity" }] });
  assert.deepEqual(r.extra_holds.filter((h) => h.layer === "Pause").map((h) => h.time), [5, 6]);
  assert.equal(focus("overlap-layers.json", [{ layer: "Still", property: "Position" }]).refused[0].reason, "only_pauses");
});

test("row 17: the practice blink's keys aren't in the first look; after the blink they're targets", () => {
  const fades = [{ layer: "Title", property: "Opacity" }, { layer: "Subtitle", property: "Opacity" }];
  const logo = [{ layer: "Logo", property: "Opacity" }];
  assert.deepEqual(analyze(load("practice-blink-before.json"), { skill_options: { focus: logo, should_move: fades } }).targets, []);
  const after = KEY.fixtures["practice-blink-after.json"].focus[0];
  assert.deepEqual(analyze(load("practice-blink-after.json"), { skill_options: { focus: logo, should_move: fades } }).targets, after.targets);
});

test("row 18: a key moved mid-attempt: the affected pairs are removed or changed", () => {
  const r = grade("practice2-before.json", "keys-moved.json", BLINK);
  assert.deepEqual(verdicts(r), { [B(1)]: "not_held", [B(2)]: "removed_or_changed", [B(3)]: "removed_or_changed" });
  const added = structuredClone(load("practice2-before.json")); // in-test edit: one key added
  const keys = added.layers[0].properties[0].keys;
  keys.push({ ...keys[3], index: 5, time: 2.6 });
  const baseline = load("practice2-before.json");
  const lesson = { comp_id: baseline.comp.id, baseline, targets: [B(1), B(2), B(3)], skill_options: {}, demo: null };
  const g = check(baseline, added, lesson);
  assert.ok(g.pairs.every((p) => p.verdict === "removed_or_changed"));
  assert.ok(g.other_changes.includes("Blink › Opacity now has 5 keys (was 4)"));
});

test("row 19: select all, toggle hold: holds outside the focus are listed; edge sides ignored", () => {
  const c = checkCase("Select all");
  const r = grade(c.baseline, c.current, c.focus, { should_move: c.should_move });
  assert.deepEqual(r.extra_holds, c.extra_holds);
  assert.deepEqual(r.should_move_held, c.should_move_held);
  // Blink's last key held on its out side, and its first key on its in side, face no pair.
  assert.equal(grade("practice2-before.json", "blink-all-held.json", BLINK).extra_holds.length, 0);
});

test("row 20: the demo pair re-held is the demo's unless a check saw it undone", () => {
  assert.equal(verdicts(grade("practice2-before.json", "after-demo-reheld.json", BLINK, { demo: B(1) }))[B(1)], "held_by_demo");
  assert.equal(grade("practice2-before.json", "after-demo-undone.json", BLINK, { demo: B(1) }).demo_undone, true);
  assert.equal(verdicts(grade("practice2-before.json", "after-demo-reheld.json", BLINK, { demo: B(1), demoUndone: true }))[B(1)], "held_by_learner");
});

test("row 21: a kept-linear mark on an Opacity 0 to 100 property: not a candidate, named as left out", () => {
  const snap = load("overlap-layers.json");
  const prop = snap.layers.find((l) => l.name === "Fader").properties[0];
  const m = { kind: "kept_linear", project: snap.project, comp: snap.comp.name, layer: "Fader", path: OPACITY_PATH, property: "Opacity", key_times: prop.keys.map((k) => k.time) };
  const r = analyze(snap, { kept_linear: [m] });
  assert.ok(!names(candidates(snap, { kept_linear: [m] })).includes("Fader › Opacity"));
  assert.deepEqual(names(leftOut(r, "kept_linear").properties), ["Fader › Opacity"]);
});

test("row 22: unknown values: not a candidate by value; a focus when named, graded on types", () => {
  const r = analyze(load("overlap-layers.json"));
  assert.deepEqual(names(leftOut(r, "unknown_values").properties), ["Old Values › Opacity"]);
  const f = focus("overlap-layers.json", [{ layer: "Old Values", property: "Opacity" }]);
  assert.deepEqual(f.targets, [`19/${OPACITY_PATH}/1`]);
  const baseline = load("overlap-layers.json");
  const now = structuredClone(baseline); // in-test edit: the learner's hold
  now.layers.find((l) => l.name === "Old Values").properties[0].keys[0].out_type = "hold";
  const g = check(baseline, now, { comp_id: baseline.comp.id, baseline, targets: f.targets, skill_options: {}, demo: null });
  assert.equal(g.pairs[0].verdict, "held_by_learner");
});

test("row 23: a check on another comp: comp_matches false", () => {
  const r = grade("practice2-before.json", "practice-now.json", BLINK);
  assert.equal(r.comp_matches, false);
  assert.equal(r.passed, false);
});
