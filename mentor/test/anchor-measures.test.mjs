// Spec 011 FR-010, FR-011, FR-028 (research R2, R3): the nine places measured in the layer's own
// space with a per-axis tolerance of max(10%, 3 px), and the rest key's rules.

import { test } from "node:test";
import assert from "node:assert/strict";
import { checkTime, inPlace, placeNow, placePoint, restKey, tolerance } from "../lib/anchor.mjs";
import { sampleAt } from "../lib/comp-space.mjs";
import { synthetic } from "./fixtures/anchor/load.mjs";

const rect = (width, height, left = 0, top = 0) => ({ left, top, width, height });

test("an 800 × 60 bar: 80 px across and 6 px up and down, so the three left places stay apart", () => {
  const bar = rect(800, 60);
  assert.deepEqual(tolerance(bar), [80, 6]);
  assert.equal(placeNow([0, 0], bar), "top-left");
  assert.equal(placeNow([0, 30], bar), "middle-left");
  assert.equal(placeNow([0, 60], bar), "bottom-left");
  assert.equal(placeNow([0, 7], bar), "between", "7 px down from the corner is in neither");
  assert.equal(placeNow([79, 30], bar), "middle-left", "80 px across still counts");
});

test("a 30 × 400 needle: the 3 px floor applies across", () => {
  const needle = rect(30, 400);
  assert.deepEqual(tolerance(needle), [3, 40]);
  assert.ok(inPlace([18, 400], needle, "bottom-middle"));
  assert.ok(!inPlace([18.5, 400], needle, "bottom-middle"));
});

test("a 10 × 2 line: the floor applies on both axes", () => {
  assert.deepEqual(tolerance(rect(10, 2)), [3, 3]);
});

test("exactly at 10% passes and just past fails, on each axis", () => {
  const r = rect(200, 100);
  assert.ok(inPlace([20, 50], r, "middle-left"));
  assert.ok(!inPlace([20.01, 50], r, "middle-left"));
  assert.ok(inPlace([0, 60], r, "middle-left"));
  assert.ok(!inPlace([0, 60.01], r, "middle-left"));
});

test("placeNow gives outside beyond the rectangle and between inside it", () => {
  const r = rect(160, 60, -80, -30);
  assert.equal(placeNow([0, 150], r), "outside", "Lid's pivot, 150 px below its middle");
  assert.equal(placeNow([-100, 0], r), "outside");
  assert.equal(placeNow([-40, 0], r), "between");
  assert.equal(placeNow([-81, 0], r), "middle-left", "within the tolerance just outside the edge");
  assert.deepEqual(placePoint(r, "bottom-right"), [80, 30]);
});

test("Scale 200% and Scale [-100, 100] measured in their own space give the same place as at 100%", () => {
  const s = synthetic("measures");
  const moved = synthetic("measures-moved");
  for (const name of ["Big", "Mirror"]) {
    const before = sampleAt(s.layer_info.find((l) => l.name === name), 0);
    const after = sampleAt(moved.layer_info.find((l) => l.name === name), 0);
    assert.equal(placeNow(before.anchor, before.rect), "center", name);
    assert.equal(placeNow(after.anchor, after.rect), "top-left", `${name}: its own top-left, whatever its scale`);
    assert.deepEqual(tolerance(after.rect), [10, 6], `${name}: 10% of its own 100 × 60, not its comp size`);
  }
});

// ---- The rest key

const TR = "ADBE Transform Group/";
const prop = (name, keys) => ({ path: `${TR}${name}`, display_name: name, keys: keys.map(([time, value]) => ({ time, value })), expression_enabled: false });
const layer = (...props) => ({ index: 1, name: "L", properties: props });
const rot = (keys) => prop("ADBE Rotate Z", keys);
const sc = (keys) => prop("ADBE Scale", keys);

test("rest key: Rotation at 0 and Scale at its largest on one key gives basis both", () => {
  assert.deepEqual(restKey(layer(rot([[1, 30], [2, 0]]), sc([[1, [50, 50, 100]], [2, [100, 100, 100]]]))), { time: 2, basis: "both" });
  assert.deepEqual(restKey(layer(rot([[1, 0], [2, 90]]))), { time: 1, basis: "both" }, "Gauge: only Rotation keyed");
  assert.deepEqual(restKey(layer(sc([[1, [0, 0, 100]], [2, [100, 100, 100]]]))), { time: 2, basis: "both" }, "Pop: only Scale keyed");
});

test("rest key: no one key with both gives the Scale one (S-1's tie-break)", () => {
  assert.deepEqual(restKey(layer(rot([[1, 0], [2, 45]]), sc([[1, [50, 50, 100]], [2, [100, 100, 100]]]))), { time: 2, basis: "scale" });
});

test("rest key: Rotation only, none at 0, gives the closest one (D-1)", () => {
  assert.deepEqual(restKey(layer(rot([[1, 30], [2, 10], [3, 50]]))), { time: 2, basis: "closest_rotation" });
});

test("rest key: 359.6° is a whole turn and 359.4° isn't (0.5°)", () => {
  assert.deepEqual(restKey(layer(rot([[1, 20], [2, 359.6]]))), { time: 2, basis: "both" });
  assert.deepEqual(restKey(layer(rot([[1, 20], [2, 359.4]]))), { time: 2, basis: "closest_rotation" });
  assert.deepEqual(restKey(layer(rot([[1, -720], [2, 20]]))), { time: 1, basis: "both" }, "two turns back is a whole turn");
});

test("rest key: ties go to the earliest time", () => {
  assert.deepEqual(restKey(layer(rot([[3, 0], [1, 0], [2, 90]]))), { time: 1, basis: "both" });
  assert.deepEqual(restKey(layer(rot([[1, 10], [2, -10]]))), { time: 1, basis: "closest_rotation" });
  assert.deepEqual(restKey(layer(sc([[2, [100, 100, 100]], [1, [100, 100, 100]]]))), { time: 1, basis: "both" });
});

test("rest key: a learner's rest_time that is a key wins; one that isn't is ignored and flagged", () => {
  const l = layer(rot([[1, 0], [2, 90]]));
  assert.deepEqual(restKey(l, { rest_time: 2 }), { time: 2, basis: "learner" });
  assert.deepEqual(restKey(l, { rest_time: 1.5 }), { time: 1, basis: "both", rest_time_not_a_key: true });
});

test("no Rotation or Scale keys: the check time is the read's own comp.time (basis current)", () => {
  assert.equal(restKey(layer(prop("ADBE Position", [[1, [0, 0]], [2, [10, 0]]]))), null);
  const snap = { comp: { time: 1.5 }, layers: [] };
  assert.deepEqual(checkTime(snap, 1), { time: 1.5, basis: "current" });
});
