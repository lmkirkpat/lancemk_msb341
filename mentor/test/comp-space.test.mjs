// Spec 004 wave B, tasks-wave-b T106 and T153: mentor/lib/comp-space.mjs. Every case here is
// SYNTHETIC (pure math, allowed by FR-012); the live checks against AE's own toComp() are T136's.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { layerMatrix, compMatrix, compPoint, compPosition, footprint, toLayerSpace, apply, invert } from "../lib/comp-space.mjs";
import { FIXTURES, fixture } from "./helpers.mjs";

const synthetic = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "layer-info", "synthetic", `${name}.json`), "utf8"));
const chain = synthetic("chain");
const relations = synthetic("relations");
const TOL = 1e-6;
const close = (a, b, tol = TOL) => {
  assert.equal(a.length, b.length);
  a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) <= tol, `${JSON.stringify(a)} vs ${JSON.stringify(b)}`));
};

// A snapshot with only layer_info, from short entries.
function snap(entries, times = [1]) {
  return {
    comp: { id: 1, name: "Inline", time: times[0] }, layers: [], precomp_layers: [],
    layer_info: entries.map((e) => ({
      index: e.index, name: e.name || `L${e.index}`, parent: e.parent ?? null, three_d: false, auto_orient: false,
      samples: times.map((time) => ({
        time, anchor: e.anchor || [0, 0, 0], position: e.position || [0, 0, 0], scale: e.scale || [100, 100, 100],
        rotation: e.rotation || 0, rect: e.rect === undefined ? { left: 0, top: 0, width: 100, height: 100 } : e.rect,
        rect_extents: e.rect_extents ?? null,
      })),
    })),
  };
}
const T = (o) => ({ anchor: [0, 0], position: [0, 0], scale: [100, 100], rotation: 0, ...o });

test("synthetic: layerMatrix identity and translate", () => {
  close(layerMatrix(T()), [1, 0, 0, 1, 0, 0]);
  close(layerMatrix(T({ position: [10, 20] })), [1, 0, 0, 1, 10, 20]);
});

test("synthetic: layerMatrix anchor offset puts the anchor at the position", () => {
  const m = layerMatrix(T({ anchor: [5, 5], position: [10, 10] }));
  close(apply(m, [5, 5]), [10, 10]);
  close(apply(m, [0, 0]), [5, 5]);
});

test("synthetic: layerMatrix rotate 90 turns clockwise on screen (x toward y-down)", () => {
  close(apply(layerMatrix(T({ rotation: 90 })), [1, 0]), [0, 1]);
  close(apply(layerMatrix(T({ rotation: 90 })), [0, 1]), [-1, 0]);
});

test("synthetic: layerMatrix non-uniform scale (200, 50) and negative scale", () => {
  close(apply(layerMatrix(T({ scale: [200, 50] })), [1, 1]), [2, 0.5]);
  close(apply(layerMatrix(T({ scale: [-100, 100] })), [1, 1]), [-1, 1]);
});

test("synthetic: layerMatrix with a missing value is null", () => {
  assert.equal(layerMatrix(T({ rotation: null })), null);
  assert.equal(layerMatrix(T({ scale: null })), null);
});

test("synthetic: compPosition of an unparented layer equals its position", () => {
  assert.deepEqual(compPosition(chain, 1, 1), { position: [960, 540] });
  assert.deepEqual(compPosition(relations, 10, 1), { position: [960, 540] });
});

test("synthetic: a two-level chain (Pivot rotated 90, scale [200, 50]) at each sampled time", () => {
  assert.deepEqual(compPosition(chain, 2, 0), { position: [960, 540] });
  assert.deepEqual(compPosition(chain, 2, 1), { position: [960, 740] });
  assert.deepEqual(compPosition(chain, 2, 2), { position: [910, 740] });
  assert.deepEqual(compPoint(chain, 2, [100, 20], 1), { point: [960, 740] });
  close(compMatrix(chain, 2, 1).matrix, [0, 2, -0.5, 0, 970, 540]);
});

test("synthetic: a sample time matches within 0.0005 s, and not past it", () => {
  assert.deepEqual(compPosition(chain, 2, 1.0004), { position: [960, 740] });
  assert.deepEqual(compPosition(chain, 2, 1.001), { position: null, reason: "not_sampled" });
});

test("synthetic: footprint of an unrotated rect", () => {
  assert.deepEqual(footprint(relations, 10, 1), {
    corners: [[960, 540], [1060, 540], [1060, 640], [960, 640]],
    bounds: { left: 960, top: 540, right: 1060, bottom: 640 },
  });
});

test("synthetic: footprint of a 45° rotated rect", () => {
  const s = snap([{ index: 1, rotation: 45, rect: { left: -50, top: -50, width: 100, height: 100 } }]);
  const h = 70.711;
  assert.deepEqual(footprint(s, 1, 1), {
    corners: [[0, -h], [h, 0], [0, h], [-h, 0]],
    bounds: { left: -h, top: -h, right: h, bottom: h },
  });
});

test("synthetic: footprint through the chain, and { extents: true } uses rect_extents", () => {
  const fp = footprint(chain, 2, 1);
  assert.deepEqual(fp.bounds, { left: 950, top: 540, right: 970, bottom: 940 });
  const s = snap([{ index: 1, position: [10, 10], rect_extents: { left: -2, top: -2, width: 104, height: 104 } }]);
  assert.deepEqual(footprint(s, 1, 1, { extents: true }).bounds, { left: 8, top: 8, right: 112, bottom: 112 });
  assert.deepEqual(footprint(s, 1, 1).bounds, { left: 10, top: 10, right: 110, bottom: 110 });
  const none = snap([{ index: 1 }]);
  assert.deepEqual(footprint(none, 1, 1, { extents: true }), { corners: null, bounds: null, reason: "no_rect" });
});

test("synthetic: toLayerSpace inverts the chain: the matrices round-trip within 1e-6", () => {
  for (const t of [0, 1, 2]) {
    const { matrix } = compMatrix(chain, 2, t);
    for (const p of [[0, 0], [100, 20], [200, 40], [13.37, -4.2]]) close(apply(invert(matrix), apply(matrix, p)), p);
  }
  // The exported functions round to 0.001 px, so their round trip is within that.
  const there = compPoint(chain, 2, [13.37, -4.2], 1).point;
  close(toLayerSpace(chain, 2, there, 1).point, [13.37, -4.2], 0.002);
  assert.deepEqual(toLayerSpace(chain, 2, [960, 740], 1), { point: [100, 20] });
});

test("synthetic: toLayerSpace through a scale of 0 is singular, never a guess", () => {
  const s = snap([{ index: 1, scale: [0, 100] }]);
  assert.deepEqual(toLayerSpace(s, 1, [0, 0], 1), { point: null, reason: "singular" });
});

test("synthetic: parent_transform replaces only the direct parent", () => {
  const s = snap([
    { index: 1, name: "G", position: [100, 100] },
    { index: 2, name: "P", parent: 1, position: [10, 0] },
    { index: 3, name: "C", parent: 2, position: [1, 0] },
  ]);
  assert.deepEqual(compPosition(s, 3, 1), { position: [111, 100] });
  assert.deepEqual(compPosition(s, 3, 1, { parent_transform: T({ position: [20, 0] }) }), { position: [121, 100] });
  assert.deepEqual(compPosition(s, 2, 1, { parent_transform: T({ position: [50, 50] }) }), { position: [60, 50] }, "P's parent is G");
  assert.deepEqual(compPosition(s, 1, 1, { parent_transform: T({ position: [50, 50] }) }), { position: [100, 100] }, "ignored with no parent");
  // Through the stored parent, at a time the parent wasn't sampled: the child's own sample is enough.
  const at0 = snap([{ index: 1, position: [0, 0] }], [5]);
  at0.layer_info.push({ ...s.layer_info[2], index: 2, parent: 1, samples: [{ ...s.layer_info[2].samples[0], time: 0 }] });
  assert.equal(compPosition(at0, 2, 0).reason, "not_sampled");
  assert.deepEqual(compPosition(at0, 2, 0, { parent_transform: T({ position: [5, 5] }) }), { position: [6, 5] });
});

test("synthetic: parent_transform with Pivot's own values gives the sampled answer", () => {
  const stored = chain.layer_info[0].samples[1];
  assert.deepEqual(compPosition(chain, 2, 1, { parent_transform: stored }), compPosition(chain, 2, 1));
});

test("synthetic: each reason", () => {
  assert.deepEqual(compMatrix(fixture("linear-basic"), 1, 0), { matrix: null, reason: "no_layer_info" });
  assert.deepEqual(compMatrix(chain, 99, 1), { matrix: null, reason: "no_layer" });
  assert.deepEqual(compMatrix(chain, 2, 0.5), { matrix: null, reason: "not_sampled" });
  assert.deepEqual(compMatrix(chain, 3, 1), { matrix: null, reason: "three_d" });
  assert.deepEqual(compMatrix(chain, 5, 1), { matrix: null, reason: "three_d" }, "a 3D parent");
  assert.deepEqual(compMatrix(chain, 4, 1), { matrix: null, reason: "auto_orient" });
  assert.deepEqual(footprint(snap([{ index: 1, rect: null }]), 1, 1), { corners: null, bounds: null, reason: "no_rect" });
  assert.deepEqual(compPosition(chain, 99, 1), { position: null, reason: "no_layer" });
  const unreadable = structuredClone(chain);
  unreadable.layer_info[0].samples[1].rotation = null;
  assert.deepEqual(compPosition(unreadable, 2, 1), { position: null, reason: "not_sampled" }, "an unreadable value in the chain");
  const orphan = snap([{ index: 2, parent: 7 }]);
  assert.equal(compMatrix(orphan, 2, 1).reason, "no_layer");
});

test("synthetic: deterministic, and the snapshot isn't changed", () => {
  const before = JSON.stringify(chain);
  assert.deepEqual(footprint(chain, 2, 2), footprint(chain, 2, 2));
  assert.deepEqual(compMatrix(chain, 2, 2), compMatrix(chain, 2, 2));
  assert.equal(JSON.stringify(chain), before);
});
