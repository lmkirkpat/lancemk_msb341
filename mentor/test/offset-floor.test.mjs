// Spec 010 FR-023, research R1: spec 004 FR-027's floor ("the same" is under 2 frames or under
// 1/15 s, whichever is longer), for starts and for landings, pairwise.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as offset from "../lib/offset.mjs";
import { analyze, check, floorFrames, gapUnderFloor, isSame } from "../lib/offset.mjs";
import { clone, lessonFor } from "./fixtures/offset/load.mjs";

const at = (frame, fps) => Math.round((0.5 + frame / fps) * 1000) / 1000; // as a snapshot reads it

test("floorFrames: 2 frames at 24 and 30 fps, 4 at 60 (1/15 s)", () => {
  assert.equal(floorFrames(24), 2);
  assert.equal(floorFrames(30), 2);
  assert.equal(floorFrames(60), 4);
});

test("30 fps: 1 frame apart is the same, 2 isn't", () => {
  assert.equal(isSame(at(0, 30), at(1, 30), 30), true);
  assert.equal(isSame(at(0, 30), at(2, 30), 30), false);
});

test("60 fps: 3 frames apart is the same, 4 isn't", () => {
  assert.equal(isSame(at(0, 60), at(3, 60), 60), true);
  assert.equal(isSame(at(0, 60), at(4, 60), 60), false);
});

test("times read to the millisecond: 2 frames apart that read as 1.98 frames still aren't the same", () => {
  assert.equal(isSame(0.967, 1.033, 30), false); // 29/30 s and 31/30 s, rounded as the snapshot does
  assert.equal(isSame(0.5, 0.533, 30), true);
});

test("pairwise: A–B and B–C the same while A–C isn't is not one 'same' set", () => {
  const [a, b, c] = [at(0, 30), at(1, 30), at(2, 30)];
  assert.equal(isSame(a, b, 30), true);
  assert.equal(isSame(b, c, 30), true);
  assert.equal(isSame(a, c, 30), false);
});

// A one-layer, two-property comp: Scale and Opacity, 0.5 s to 1.5 s.
function twoProps(fps) {
  const k = (t, v) => ({ index: 1, time: t, in_type: "linear", out_type: "linear", value: v, in_ease: [], out_ease: [] });
  const p = (name, v) => ({ path: `ADBE Transform Group/ADBE ${name}`, display_path: `Transform › ${name}`, display_name: name, match_name: `ADBE ${name}`, dimensions: 1, expression_enabled: false, keys: [k(0.5, v[0]), k(1.5, v[1])] });
  return { project: "Floor.aep", comp: { id: 9, name: "Floor", duration: 4, frame_rate: fps }, precomp_layers: [], layers: [{ index: 1, name: "Box", kind: "shape", enabled: true, is_null: false, properties: [p("Scale", [50, 100]), p("Opacity", [20, 100])] }] };
}
const moveKey = (snap, prop, keyIndex, frames) => {
  const s = clone(snap);
  const k = s.layers[0].properties.find((p) => p.display_name === prop).keys[keyIndex];
  k.time = Math.round((k.time + frames / s.comp.frame_rate) * 1000) / 1000;
  return s;
};

for (const [fps, same, apart] of [[30, 1, 2], [60, 3, 4]]) {
  test(`${fps} fps: a start moved ${same} frames is still together, ${apart} isn't`, () => {
    const base = twoProps(fps);
    const lesson = lessonFor(base, { kind: "properties" });
    assert.equal(check(base, moveKey(base, "Opacity", 0, same), lesson).passed, false);
    assert.equal(check(base, moveKey(base, "Opacity", 0, apart), lesson).passed, true);
  });
  test(`${fps} fps: a landing moved ${same} frames is still together, ${apart} isn't`, () => {
    const base = twoProps(fps);
    const lesson = lessonFor(base, { kind: "properties" });
    assert.equal(check(base, moveKey(base, "Opacity", 1, -same), lesson).passed, false);
    assert.equal(check(base, moveKey(base, "Opacity", 1, -apart), lesson).passed, true);
  });
  test(`${fps} fps: a group forms only while starts and landings are within the floor`, () => {
    const base = twoProps(fps);
    assert.ok(analyze(moveKey(base, "Opacity", 0, same)).group);
    assert.equal(analyze(moveKey(moveKey(base, "Opacity", 0, apart), "Opacity", 1, apart)).group, null);
  });
}

test("the learner's gap: 1 frame at 30 fps and 3 at 60 fps are under the floor; 2 and 4 aren't", () => {
  assert.equal(gapUnderFloor(1, 30), true);
  assert.equal(gapUnderFloor(2, 30), false);
  assert.equal(gapUnderFloor(3, 60), true);
  assert.equal(gapUnderFloor(4, 60), false);
});

test("the floor is the only threshold the skill exports: no other number", () => {
  const numbers = Object.entries(offset).filter(([, v]) => typeof v === "number");
  assert.deepEqual(numbers, []);
});
