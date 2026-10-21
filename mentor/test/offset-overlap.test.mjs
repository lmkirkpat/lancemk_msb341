// Spec 010 › Edge cases where concepts overlap, rows 1 to 22 (FR-022): one test per row, each
// asserting what the focus and the check see on its fixture. Rows marked "contract" in the spec
// (row 4) are asserted against mentor/lib/timing.mjs as built.

import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, check, groups } from "../lib/offset.mjs";
import { timing } from "../lib/timing.mjs";
import { apply, run } from "../fixture/offset-demo.mjs";
import { clone, KEY, load, lessonFor, PRACTICE2, PRACTICE2_60, PRACTICE_NOW } from "./fixtures/offset/load.mjs";

const now = load(PRACTICE_NOW);
const mp2 = load(PRACTICE2);
const PROPS = { kind: "properties", order: ["Position", "Scale", "Opacity"], gap_frames: 4 };
const DOTS = { kind: "layers", order: ["Dot 1", "Dot 2", "Dot 3"], gap_frames: 4 };
const pool = (snap, name) => groups(snap).pool.find((p) => p.tl.layer === name);
const leftOut = (snap, reason) => (analyze(snap).left_out.find((x) => x.reason === reason) || { layers: [] }).layers;
const prop = (s, layer, name) => s.layers.find((l) => l.name === layer).properties.find((p) => p.display_name === name);
const member = (r, layer) => r.members.find((m) => m.layer === layer);
const shiftLayer = (s, name, frames, paths) => {
  const l = s.layers.find((x) => x.name === name);
  return apply(s, { layer_index: l.index, property_paths: paths || l.properties.map((p) => p.path), shift_frames: frames });
};
const allInGroups = (snap) => {
  const g = groups(snap);
  return [...g.layers.flatMap((x) => x.members.map((m) => m.layer)), ...g.properties.map((x) => x.layer)];
};

test("row 1: an expression on a keyed property (Logo's Rotation) is left out, and toggling it is an other change", () => {
  assert.equal(pool(now, "Logo").start, null, "Logo's only counted motion is under an expression: no start");
  assert.deepEqual(leftOut(now, "expression"), ["Logo"]);
  assert.ok(!allInGroups(now).includes("Logo"));
  const r = check(now, load("stand-in/expression-toggled.json"), lessonFor(now, PROPS));
  assert.ok(r.other_changes.includes("Logo › Rotation: an expression was turned off"));
});

test("row 2: an expression with no keys isn't read, so a layer with no keys is never named or grouped", () => {
  // Mentor Practice 2's Background has no keys: the read skips it, and so does everything here.
  assert.ok(!mp2.layers.some((l) => l.name === "Background"));
  const a = analyze(mp2);
  assert.ok(!JSON.stringify(a).includes("Background"));
});

test("row 3: a single key (Logo's Scale) is no start; moving it is an other change, not graded", () => {
  const logo = timing(now).layers.find((l) => l.layer === "Logo");
  assert.equal(logo.units.find((u) => u.unit === "Transform › Scale").excluded, "single_key");
  const r = check(now, load("stand-in/single-key-moved.json"), lessonFor(now, PROPS));
  assert.equal(r.passed, true);
  assert.deepEqual(r.other_changes, ["Logo › Scale: its single key moved from 0 s to 0.2 s"]);
});

test("row 4 (contract): a hold pair starts at its jump: the Cursor at 0.5 s, not 0 s; Dot 1 and Flag the same way", () => {
  const t = timing(now);
  assert.equal(t.layers.find((l) => l.layer === "Cursor").first_start, 0.5);
  assert.equal(pool(now, "Cursor").start, 0.5);
  assert.deepEqual(groups(now).layers.map((g) => g.members.map((m) => m.layer)), KEY.focus["stand-in/practice-now.json"].all_layer_groups);
  assert.equal(pool(mp2, "Dot 1").start, 0.5);
  assert.equal(pool(mp2, "Flag").start, 4.5);
  // The shift is measured at the jump: moving only Dot 1's hold key leaves its start at 0.5 s.
  const r = check(mp2, load("stand-in/hold-group.json"), lessonFor(mp2, DOTS));
  assert.equal(member(r, "Dot 1").start_now, 0.5);
  assert.deepEqual(member(r, "Dot 1").moved_by, { Position: 0, Opacity: 0 });
});

test("row 5: two held jumps on one layer at the same time form a properties group; either jump moved past the floor passes", () => {
  const s = load("synthetic/two-held-jumps.json");
  const a = analyze(s);
  assert.equal(a.group.kind, "properties");
  assert.deepEqual(a.group.members.map((m) => [m.label, m.start, m.end]), [["Scale", 1, 1], ["Opacity", 1, 1]]);
  const lesson = lessonFor(s, { kind: "properties" });
  const oneFrame = clone(s);
  prop(oneFrame, "Lamp", "Opacity").keys[1].time = 1.033;
  assert.equal(check(s, oneFrame, lesson).passed, false);
  const moved = clone(s);
  prop(moved, "Lamp", "Opacity").keys[1].time = 1.133;
  assert.equal(check(s, moved, lesson).passed, true);
});

test("row 6: a hold jump and a ramp starting together aren't a properties group, but share a layer start", () => {
  const s = load("synthetic/two-held-jumps.json");
  const lamp = s.layers[0];
  // Scale: a ramp from 1 s to 2 s; Opacity: a jump at 1 s.
  lamp.properties[0].keys.forEach((k) => { k.in_type = "linear"; k.out_type = "linear"; });
  lamp.properties[0].keys[0].time = 1;
  lamp.properties[0].keys[1].time = 2;
  lamp.properties[1].keys[0].time = 0.5;
  assert.equal(groups(s).properties.length, 0);
  const other = clone(lamp);
  other.index = 2;
  other.name = "Lamp 2";
  s.layers.push(other);
  assert.deepEqual(groups(s).layers.map((g) => g.members.map((m) => m.layer)), [["Lamp", "Lamp 2"]]);
  assert.equal(groups(s).layers[0].start, 1);
});

test("row 7: separated X and Y are one Position unit starting at the earlier; X moved and Y not is a split within Position", () => {
  const dot3 = timing(mp2).layers.find((l) => l.layer === "Dot 3");
  const pos = dot3.units.find((u) => u.unit === "Position");
  assert.deepEqual(pos.paths, ["ADBE Transform Group/ADBE Position_0", "ADBE Transform Group/ADBE Position_1"]);
  assert.equal(pos.moves[0].start, 0.5);
  const r = check(mp2, load("stand-in/separated-x-only.json"), lessonFor(mp2, DOTS));
  assert.equal(r.passed, false);
  assert.deepEqual(member(r, "Dot 3").split.within_position, { moved: ["X Position"], stayed: ["Y Position"] });
  assert.deepEqual(member(r, "Dot 3").dimensions, { "X Position": 8, "Y Position": 0 });
});

test("row 8: Title's Position (four keys, three moves) joins through its first move; a changed move count isn't graded", () => {
  const units = timing(now).layers.find((l) => l.layer === "Title").units;
  assert.equal(units.find((u) => u.unit === "Transform › Position").moves.length, 3);
  const a = analyze(now);
  assert.deepEqual(a.group.members.map((m) => [m.label, m.move_index]), [["Position", 1], ["Scale", 1], ["Opacity", 1]]);
  const s = clone(now);
  prop(s, "Title", "Position").keys.pop();
  const r = check(now, s, lessonFor(now, PROPS));
  assert.equal(r.members.find((m) => m.label === "Title › Position").status, "keys_changed");
});

test("row 9: a pause isn't a move; a pause given a new value is an other change", () => {
  const pause = timing(mp2).layers.find((l) => l.layer === "Pause").units[0];
  assert.deepEqual(pause.moves.map((m) => [m.start, m.end]), [[5, 5.5], [6, 6.5]]);
  const s = clone(mp2);
  prop(s, "Pause", "Position").keys[2].value = [600, 900];
  const r = check(mp2, s, lessonFor(mp2, DOTS));
  assert.ok(r.other_changes.includes("Pause › Position: the pause from 5.5 s has a new value, so it moves there now"));
});

test("row 10: effect keys count in the layer's start; moved with the layer, it passes", () => {
  assert.ok(pool(mp2, "Dot 2").units.some((u) => u.name === "Blurriness"));
  const r = check(mp2, load("stand-in/effect-with-layer.json"), lessonFor(mp2, DOTS));
  assert.equal(r.passed, true);
  assert.equal(member(r, "Dot 2").moved_by.Blurriness, 4);
  // Moving the layer's other keys but not the effect is a split.
  const s = shiftLayer(clone(mp2), "Dot 2", 4, ["ADBE Transform Group/ADBE Position", "ADBE Transform Group/ADBE Opacity"]);
  shiftLayer(s, "Dot 3", 8);
  const split = check(mp2, s, lessonFor(mp2, DOTS));
  assert.deepEqual(member(split, "Dot 2").split.stayed, ["Blurriness"]);
});

test("row 11: an adjustment layer (Glow) is eligible like any layer", () => {
  assert.equal(pool(now, "Glow").why, null);
  assert.deepEqual(analyze(now).other_group.members.map((m) => m.layer), ["Bar", "Glow"]);
});

test("row 12: a precomp (Icon) is left out and can't be added", () => {
  assert.deepEqual(leftOut(now, "precomp"), ["Icon"]);
  const a = analyze(now, { skill_options: { kind: "layers", members: ["Icon", "Bar", "Glow"] } });
  assert.deepEqual(a.refused_members, [{ layer: "Icon", reason: "precomp" }]);
  assert.deepEqual(a.group.members.map((m) => m.layer), ["Bar", "Glow"]);
});

test("row 13: a hidden layer (Old Take) is left out, unless the learner adds it", () => {
  assert.deepEqual(leftOut(now, "hidden"), ["Old Take"]);
  assert.ok(!allInGroups(now).includes("Old Take"));
  const a = analyze(now, { skill_options: { kind: "layers", members: ["Old Take", "Bar"] } });
  assert.deepEqual(a.group.members.map((m) => m.layer), ["Bar", "Old Take"]);
});

test("row 14: a null (CTRL) is left out, is never a demo, and is refused if the learner adds it", () => {
  assert.deepEqual(leftOut(now, "null"), ["CTRL"]);
  const a = analyze(now, { skill_options: { kind: "layers", members: ["CTRL", "Bar", "Glow"], order: ["Bar", "CTRL", "Glow"], gap_frames: 4 } });
  assert.deepEqual(a.refused_members, [{ layer: "CTRL", reason: "null" }]);
  assert.ok(!a.targets.includes("layer/3"));
  assert.notEqual(a.demo_target, "layer/3");
});

test("row 15: parenting: a child's start is its own keys (Title at 0.5 s while CTRL moves from 0 s)", () => {
  assert.equal(pool(now, "Title").start, 0.5);
  assert.equal(pool(now, "CTRL").why, "null");
  const r = check(now, load("stand-in/props-pass-landing.json"), lessonFor(now, { ...PROPS, order: ["Position", "Opacity", "Scale"] }));
  assert.equal(r.passed, true, "graded on Title's own keys");
});

test("row 16: a dragged layer bar moves the keys (seen); a trimmed in point doesn't (still in lockstep)", () => {
  const dragged = check(mp2, load("stand-in/bar-dragged.json"), lessonFor(mp2, DOTS));
  assert.equal(member(dragged, "Dot 3").start_now, 0.7);
  const trimmed = check(mp2, load("stand-in/in-point-trimmed.json"), lessonFor(mp2, DOTS));
  assert.equal(trimmed.passed, false);
  assert.equal(trimmed.still_same.length, 3);
});

test("row 17: layers reordered in the stack are matched by name: still in lockstep, nothing else changed", () => {
  const r = check(mp2, load("stand-in/reordered.json"), lessonFor(mp2, DOTS));
  assert.equal(r.passed, false);
  assert.deepEqual(r.still_same, KEY.checks.reordered.still_same);
  assert.deepEqual(r.other_changes, []);
});

test("row 18: keys past the comp's end are flagged, and such a landing isn't a landing", () => {
  const before = load("synthetic/past-end-before.json");
  const after = load("synthetic/past-end.json");
  const props = check(before, after, lessonFor(before, { kind: "properties", order: ["Position", "Opacity"], gap_frames: 4 }));
  assert.equal(props.members.find((m) => m.label === "Card › Opacity").lands_in_comp, false);
  assert.equal(props.passed, true, "a landing the comp never plays doesn't land with Position");
  assert.deepEqual(props.out_of_comp, [{ layer: "Card", property: "Opacity", time: 3.2 }]);
});

test("row 19: keys between frames: shifts within half a frame are one shift", () => {
  const r = check(load("synthetic/half-frame-before.json"), load("synthetic/half-frame.json"), lessonFor(load("synthetic/half-frame-before.json"), { kind: "layers", order: ["D1", "D2", "D3"], gap_frames: 4 }));
  assert.equal(r.passed, true);
  assert.equal(member(r, "D2").split, null);
});

test("row 20: at 60 fps the floor is 4 frames: 3 frames apart is still together, 4 isn't", () => {
  const s60 = load(PRACTICE2_60);
  const lesson = lessonFor(s60, DOTS);
  const three = shiftLayer(shiftLayer(clone(s60), "Dot 2", 3), "Dot 3", 8);
  const r3 = check(s60, three, lesson);
  assert.deepEqual(r3.still_same, [["Dot 1", "Dot 2"]]);
  const four = shiftLayer(shiftLayer(clone(s60), "Dot 2", 4), "Dot 3", 8);
  assert.equal(check(s60, four, lesson).passed, true);
});

test("row 21: the demo on a locked layer refuses and changes nothing (the twin; the snippet is live check L-4)", () => {
  const s = clone(mp2);
  s.layers.find((l) => l.name === "Dot 2").locked = true;
  const saved = [];
  assert.throws(() => run({ comp_id: s.comp.id, layer_index: 6, property_paths: s.layers.find((l) => l.index === 6).properties.map((p) => p.path), shift_frames: 4 }, { snapshot: s, saveEdit: (e) => saved.push(e) }),
    (e) => e.code === "OFFSET_REFUSED" && e.reason === "locked");
  assert.deepEqual(saved, []);
});

test("row 22: shape, mask and text keys count like any keyed property", () => {
  // Bar's Trim Paths End is a shape property: it's one of Bar's counted units.
  assert.ok(pool(now, "Bar").units.some((u) => u.name === "End"));
  // A mask path (its value isn't read, so it counts as change) joins Dot 1's start and refs.
  const s = clone(mp2);
  s.layers.find((l) => l.name === "Dot 1").properties.push({
    path: "ADBE Mask Parade/ADBE Mask Atom#1/ADBE Mask Shape", display_path: "Masks › Mask 1 › Mask Path", match_name: "ADBE Mask Shape",
    display_name: "Mask Path", dimensions: 1, expression_enabled: false,
    keys: [0.5, 1.5].map((t, i) => ({ index: i + 1, time: t, in_type: "linear", out_type: "linear", value: null, in_ease: [], out_ease: [] })),
  });
  const a = analyze(s, { skill_options: { kind: "layers" } });
  assert.ok(a.target_refs.some((r) => r.layer === "Dot 1" && r.property === "Mask Path"));
  const moved = shiftLayer(shiftLayer(clone(s), "Dot 2", 4), "Dot 3", 8);
  assert.equal(check(s, moved, lessonFor(s, DOTS)).passed, true);
  const maskOnly = shiftLayer(clone(moved), "Dot 1", 6, ["ADBE Mask Parade/ADBE Mask Atom#1/ADBE Mask Shape"]);
  assert.deepEqual(member(check(s, maskOnly, lessonFor(s, DOTS)), "Dot 1").split.moved, ["Mask Path"]);
});
