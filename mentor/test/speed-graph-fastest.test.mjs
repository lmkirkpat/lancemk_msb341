// Spec 008 FR-016, research R2: where a pair's move is fastest, as the first, middle or last part.

import { test } from "node:test";
import assert from "node:assert/strict";
import { tempHome } from "./helpers.mjs";

tempHome();
const { fastestPart, partsOf, SAMPLES, PART_TOLERANCE } = await import("../lib/speed-graph-bezier.mjs");
const { fastestFor } = await import("../lib/speed-graph.mjs");

const shape = (out, inn, { outSpeed = 0, inSpeed = 0, delta = 40, duration = 1 } = {}) =>
  fastestPart({ duration, delta, out: { speed: outSpeed, influence: out }, in: { speed: inSpeed, influence: inn } });

test("research R2's constants", () => {
  assert.equal(SAMPLES, 200);
  assert.equal(PART_TOLERANCE, 0.05);
});

test("Easy Ease peaks in the middle", () => {
  const r = shape(33.333, 33.333);
  assert.ok(Math.abs(r.peak - 0.5) < 0.01);
  assert.deepEqual(r.parts, ["middle"]);
  assert.deepEqual(shape(33.33, 33.33, { duration: 1.37, delta: -70 }).parts, ["middle"], "any duration and direction");
});

test("15/80 is fastest in the first part; 80/15 in the last", () => {
  assert.ok(shape(15, 80).parts.includes("first"));
  assert.ok(shape(15, 80).peak < 0.2);
  assert.ok(shape(80, 15).parts.includes("last"));
  assert.ok(shape(15.13, 79.87).parts.includes("first"), "the demo's shape too");
});

test("a peak within 0.05 of a third returns both neighbours", () => {
  const r = shape(40, 80); // peak about 0.31
  assert.ok(Math.abs(r.peak - 1 / 3) <= 0.05, `peak ${r.peak}`);
  assert.deepEqual(r.parts, ["first", "middle"]);
  assert.deepEqual(partsOf(0.7), ["middle", "last"]);
  assert.deepEqual(partsOf(0.2), ["first"]);
  assert.deepEqual(partsOf(0.9), ["last"]);
  assert.deepEqual(partsOf(0.5), ["middle"]);
});

test("speeds shift the peak as the curve says", () => {
  assert.deepEqual(shape(33.333, 33.333, { outSpeed: 80 }).parts, ["first"], "leaving fast: fastest at the start");
  assert.deepEqual(shape(33.333, 33.333, { inSpeed: 60 }).parts, ["last"], "arriving fast: fastest at the end");
  assert.ok(shape(33.333, 33.333, { inSpeed: 8 }).peak > 0.5, "a small landing speed moves the peak later");
});

test("influences adding to more than 100 are scaled, never time running backwards", () => {
  const r = shape(90, 95, { delta: 20 });
  assert.ok(r.peak > 0 && r.peak < 1);
  assert.deepEqual(r.parts, ["middle"]);
});

test("deterministic", () => {
  assert.deepEqual(shape(22, 71, { outSpeed: 3 }), shape(22, 71, { outSpeed: 3 }));
});

// fastestFor reads a pair from a snapshot: which dimension, and spatial speeds.
const key = (time, value, n, inf, speed = 0) => ({ time, in_type: "bezier", out_type: "bezier", value, in_ease: Array.from({ length: n }, () => ({ speed, influence: inf })), out_ease: Array.from({ length: n }, () => ({ speed, influence: inf })) });
const seg = (path, from, to) => ({ id: `1/${path}/1`, layer: { name: "L" }, prop: { path, display_name: "P" }, from, to, from_time: from.time, to_time: to.time });

test("unseparated Position uses its one ease dimension and the straight-line distance", () => {
  const from = key(0, [0, 0], 1, 15);
  const to = key(1, [30, 40], 1, 80);
  assert.deepEqual(fastestFor(seg("ADBE Transform Group/ADBE Position", from, to)).parts, ["first"]);
  // AE reports spatial speeds as magnitudes: a landing speed of 120 on a 50 px move arrives fast.
  to.in_ease[0] = { speed: 120, influence: 33.333 };
  from.out_ease[0] = { speed: 0, influence: 33.333 };
  assert.deepEqual(fastestFor(seg("ADBE Transform Group/ADBE Position", from, to)).parts, ["last"]);
});

test("Scale uses the moving dimension with the largest change", () => {
  const from = key(0, [80, 50, 100], 3, 33.333);
  const to = key(1, [100, 100, 100], 3, 33.333);
  from.out_ease[1] = { speed: 0, influence: 15 };
  to.in_ease[1] = { speed: 0, influence: 80 };
  assert.deepEqual(fastestFor(seg("ADBE Transform Group/ADBE Scale", from, to)).parts, ["first"], "height moves 50, width 20");
});
