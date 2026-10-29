// Overlap audit 2026-10-29 (discovery/usage-notes/overlap-audit-2026-10-29.md), offset's rows:
// OA-1 (a member layer's single keys and expression-driven keys), OA-2 (a key added, or a pause
// given a value, on a member's counted property) and OA-6 (repeated layer names plus a renumber).
// The layers kind grades only where each member starts; everything else a learner changes on a
// member is FR-013's "other changes".

import { test } from "node:test";
import assert from "node:assert/strict";
import { check } from "../lib/offset.mjs";
import { matchLayer } from "../lib/offset-keys.mjs";
import { clone, load, lessonFor, PRACTICE2 } from "./fixtures/offset/load.mjs";

const FPS = 30;
const DOTS = { kind: "layers", order: ["Dot 1", "Dot 2", "Dot 3"], gap_frames: 4 };
const layer = (s, name) => s.layers.find((l) => l.name === name);
const prop = (s, name, display) => layer(s, name).properties.find((p) => p.display_name === display);
const at = (t) => Math.round(t * 1000) / 1000;
const key = (time, value, extra = {}) => ({ index: 1, time, in_type: "linear", out_type: "linear", value, ...extra });
const shiftKeys = (p, frames) => p.keys.forEach((k) => (k.time = at(k.time + frames / FPS)));
const shiftLayer = (s, name, frames) => layer(s, name).properties.forEach((p) => shiftKeys(p, frames));
const shiftCounted = (s, name, frames) =>
  layer(s, name).properties.filter((p) => !["Scale", "Rotation"].includes(p.display_name)).forEach((p) => shiftKeys(p, frames));

// Mentor Practice 2 with Dot 3 given a single Scale key and an expression-driven Rotation: the
// timing analysis leaves both out, so neither is part of the stagger the check grades.
function dotsWithExtras() {
  const s = clone(load(PRACTICE2));
  const d3 = layer(s, "Dot 3");
  const opacity = d3.properties.find((p) => p.display_name === "Opacity");
  d3.properties.push({ ...clone(opacity), path: "ADBE Transform Group/ADBE Scale", display_path: "Transform › Scale", match_name: "ADBE Scale", display_name: "Scale", dimensions: 3, keys: [key(0, [100, 100, 100])] });
  d3.properties.push({ ...clone(opacity), path: "ADBE Transform Group/ADBE Rotate Z", display_path: "Transform › Rotation", match_name: "ADBE Rotate Z", display_name: "Rotation", expression_enabled: true, keys: [key(0.5, 0), key(1.5, 90, { index: 2 })] });
  return s;
}

// A staggered Dots: Dot 2 four frames later, Dot 3 eight, counted properties only.
function staggered(base) {
  const s = clone(base);
  shiftCounted(s, "Dot 2", 4);
  shiftCounted(s, "Dot 3", 8);
  return s;
}

// ---- OA-1

test("OA-1: a member's single key and expression-driven key moving are other changes (layers kind)", () => {
  const base = dotsWithExtras();
  const lesson = lessonFor(base, DOTS);
  assert.deepEqual(lesson.targets, ["layer/5", "layer/6", "layer/7"], "the Dots, as before");
  const s = staggered(base);
  prop(s, "Dot 3", "Scale").keys[0].time = 0.5;
  prop(s, "Dot 3", "Rotation").keys[1].time = 2;
  const r = check(base, s, lesson);
  assert.equal(r.passed, true, "the stagger itself is unchanged");
  assert.deepEqual(r.other_changes, [
    "Dot 3 › Scale: its single key moved from 0 s to 0.5 s",
    "Dot 3 › Rotation: its key at 1.5 s moved to 2 s",
  ]);
});

test("OA-1: a member dragged as a whole bar isn't reported again for its left-out keys moving with it", () => {
  const base = dotsWithExtras();
  const s = clone(base);
  shiftLayer(s, "Dot 2", 4);
  shiftLayer(s, "Dot 3", 8);
  const r = check(base, s, lessonFor(base, DOTS));
  assert.equal(r.passed, true);
  assert.deepEqual(r.other_changes, []);
});

test("OA-1: a left-out key that moved by a different amount than its layer's stagger is still reported", () => {
  const base = dotsWithExtras();
  const s = clone(base);
  shiftLayer(s, "Dot 2", 4);
  shiftLayer(s, "Dot 3", 8);
  prop(s, "Dot 3", "Scale").keys[0].time = 1;
  const r = check(base, s, lessonFor(base, DOTS));
  assert.deepEqual(r.other_changes, ["Dot 3 › Scale: its single key moved from 0 s to 1 s"]);
});

test("OA-1: the stagger alone, on the plain Dots, still has no other changes", () => {
  const base = load(PRACTICE2);
  const r = check(base, staggered(base), lessonFor(base, DOTS));
  assert.equal(r.passed, true);
  assert.deepEqual(r.other_changes, []);
});

// ---- OA-2

test("OA-2: a key added on a member's counted property is an other change (layers kind)", () => {
  const base = load(PRACTICE2);
  const s = staggered(base);
  const pos = prop(s, "Dot 1", "Position");
  pos.keys.push(key(2, [900, 400, 0], { index: pos.keys.length + 1 }));
  const r = check(base, s, lessonFor(base, DOTS));
  assert.ok(r.other_changes.includes("Dot 1 › Position has 4 keys now (it had 3)"), JSON.stringify(r.other_changes));
});

test("OA-2: a pause on a member's counted property given a value is an other change (layers kind)", () => {
  const base = clone(load(PRACTICE2));
  const pos = prop(base, "Dot 1", "Position");
  pos.keys.push(key(2, [700, 400, 0], { index: pos.keys.length + 1 }));
  const s = staggered(base);
  prop(s, "Dot 1", "Position").keys[3].value = [800, 400, 0];
  const r = check(base, s, lessonFor(base, DOTS));
  assert.ok(r.other_changes.includes("Dot 1 › Position: the pause from 1.5 s has a new value, so it moves there now"), JSON.stringify(r.other_changes));
});

test("OA-2: the properties kind still grades its own members' key counts, not as other changes", () => {
  const base = load(PRACTICE2);
  const lesson = lessonFor(base, { kind: "properties", order: ["Position", "Opacity"], gap_frames: 4 });
  const s = clone(base);
  const g = lesson.target_refs[0].layer;
  const p = prop(s, g, lesson.target_refs[0].property);
  p.keys.push(key(2.9, p.keys[p.keys.length - 1].value, { index: p.keys.length + 1 }));
  const r = check(base, s, lesson);
  assert.equal(r.other_changes.some((c) => c.startsWith(`${g} › ${lesson.target_refs[0].property} has`)), false, JSON.stringify(r.other_changes));
});

// ---- OA-6

test("OA-6: names repeated after a rename plus a renumber: the k-th layer with that name in stack order", () => {
  const base = load(PRACTICE2);
  const s = clone(base);
  s.layers.forEach((l) => (l.index += 1)); // a layer added at the top
  layer(s, "Dot 3").name = "Dot 1"; // now two "Dot 1"s, at 6 and 8
  const got = matchLayer(base, s, layer(base, "Dot 1"));
  assert.equal(got && got.index, 6, "the first Dot 1 in the stack, not whatever sits at the old index");
});

test("OA-6: two layers that share a name in both reads, renumbered: each keeps its own match", () => {
  const base = clone(load(PRACTICE2));
  layer(base, "Dot 3").name = "Dot"; layer(base, "Dot 2").name = "Dot";
  const s = clone(base);
  s.layers.forEach((l) => (l.index += 1));
  const [upper, lower] = base.layers.filter((l) => l.name === "Dot").sort((a, b) => a.index - b.index);
  assert.equal(matchLayer(base, s, upper).index, upper.index + 1);
  assert.equal(matchLayer(base, s, lower).index, lower.index + 1);
});
