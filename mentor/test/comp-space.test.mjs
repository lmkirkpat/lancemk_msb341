// Spec 004 wave B, tasks-wave-b T106 and T153: mentor/lib/comp-space.mjs. Every case here is
// SYNTHETIC (pure math, allowed by FR-012), except T136's live checks at the end: AE's own toComp()
// from the build scripts' Probe layers, and the footprints skills 5 and 6 will measure.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { layerMatrix, compMatrix, compPoint, compPosition, footprint, toLayerSpace, apply, invert, sampleAt } from "../lib/comp-space.mjs";
import { byName } from "../lib/layer-info.mjs";
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

// ---- T136: live captures. Tolerances are test inputs (FR-017), not constants in comp-space.mjs.

const LIVE = path.join(FIXTURES, "layer-info");
const live = (name) => JSON.parse(fs.readFileSync(path.join(LIVE, name), "utf8"));
const TO_COMP_PX = 0.5;
const FOOTPRINT_PX = 1;
const only = (snap, name) => {
  const found = byName(snap, name);
  assert.equal(found.length, 1, `exactly one layer named ${name}`);
  return found[0];
};
const boundsOff = (a, b) => Math.max(...["left", "top", "right", "bottom"].map((k) => Math.abs(a[k] - b[k])));

for (const [file, keyFile] of [["overlaps.json", "overlaps-expected.json"], ["practice2b.json", "practice2b-expected.json"]]) {
  test(`live ${file}: compPosition is within ${TO_COMP_PX} px of AE's to_comp at every probed time the capture sampled; unsampled times say not_sampled`, () => {
    const snap = live(file);
    let compared = 0;
    for (const probe of live(keyFile).to_comp) {
      const entry = only(snap, probe.layer);
      for (const { time, point } of probe.points) {
        const r = compPosition(snap, entry.index, time);
        if (!sampleAt(entry, time)) {
          assert.deepEqual(r, { position: null, reason: "not_sampled" }, `${probe.layer} at ${time} s`);
          continue;
        }
        assert.ok(r.position, `${probe.layer} at ${time} s: ${r.reason}`);
        const off = Math.hypot(r.position[0] - point[0], r.position[1] - point[1]);
        assert.ok(off <= TO_COMP_PX, `${probe.layer} at ${time} s: ${r.position} vs AE ${point} (${off.toFixed(3)} px)`);
        compared++;
      }
    }
    assert.ok(compared >= live(keyFile).to_comp.length, `compared ${compared} points`);
  });
}

test("live overlaps.json: the to_comp check above goes through a Parent chain (Arm, Leaf 1, Leaf 2 and Kid are probed and parented)", () => {
  const probed = live("overlaps-expected.json").to_comp.map((p) => p.layer);
  const snap = live("overlaps.json");
  for (const name of ["Arm", "Leaf 1", "Leaf 2", "Kid"]) {
    assert.ok(probed.includes(name), `${name} is probed`);
    assert.notEqual(only(snap, name).parent, null, `${name} has a parent`);
  }
});

test(`live practice2b-parented.json: Tile, Caption and Stamp's footprints at each sampled time equal practice2b.json's within ${FOOTPRINT_PX} px (skill 6's P2)`, () => {
  const before = live("practice2b.json");
  const after = live("practice2b-parented.json");
  const nul = after.layer_info.find((l) => l.is_null && !byName(before, l.name).length);
  assert.ok(nul, "the new null is in the parented capture");
  for (const name of ["Tile", "Caption", "Stamp"]) {
    const a = only(before, name);
    const b = only(after, name);
    assert.equal(b.parent, nul.index, `${name} is parented to the new null`);
    assert.ok(a.samples.length > 0);
    for (const { time } of a.samples) {
      const fa = footprint(before, a.index, time);
      const fb = footprint(after, b.index, time);
      assert.ok(fa.bounds && fb.bounds, `${name} at ${time} s: ${fa.reason || fb.reason}`);
      assert.ok(boundsOff(fa.bounds, fb.bounds) <= FOOTPRINT_PX, `${name} at ${time} s: ${JSON.stringify(fa.bounds)} vs ${JSON.stringify(fb.bounds)}`);
      fa.corners.forEach((c, i) => assert.ok(Math.hypot(c[0] - fb.corners[i][0], c[1] - fb.corners[i][1]) <= FOOTPRINT_PX, `${name} corner ${i} at ${time} s`));
    }
  }
});

test(`live practice2b-anchor.json: Door's footprint is unchanged within ${FOOTPRINT_PX} px after Pan Behind (skill 5's measure)`, () => {
  const before = live("practice2b.json");
  const after = live("practice2b-anchor.json");
  const a = only(before, "Door");
  const b = only(after, "Door");
  assert.notDeepEqual(sampleAt(b, 0).anchor, sampleAt(a, 0).anchor, "the anchor did move");
  for (const { time } of a.samples) {
    const fa = footprint(before, a.index, time);
    const fb = footprint(after, b.index, time);
    assert.ok(boundsOff(fa.bounds, fb.bounds) <= FOOTPRINT_PX, `Door at ${time} s`);
  }
});

test(`live practice2b.json: each built layer's footprint at 0 s is its declared bounds_at_0 within ${FOOTPRINT_PX} px, and each set's union is the set's`, () => {
  const snap = live("practice2b.json");
  const key = live("practice2b-expected.json");
  const at0 = (name) => footprint(snap, only(snap, name).index, 0).bounds;
  for (const d of key.layers) {
    const b = at0(d.name);
    assert.ok(b, d.name);
    assert.ok(boundsOff(b, d.bounds_at_0) <= FOOTPRINT_PX, `${d.name}: ${JSON.stringify(b)} vs ${JSON.stringify(d.bounds_at_0)}`);
  }
  for (const set of key.sets) {
    const bs = set.layers.map(at0);
    const union = { left: Math.min(...bs.map((b) => b.left)), top: Math.min(...bs.map((b) => b.top)), right: Math.max(...bs.map((b) => b.right)), bottom: Math.max(...bs.map((b) => b.bottom)) };
    assert.ok(boundsOff(union, set.bounds_at_0) <= FOOTPRINT_PX, set.set);
  }
});

test("live overlaps.json: Depth (3D) and Orbit (auto-orient) give their reasons, never a guess", () => {
  const snap = live("overlaps.json");
  assert.equal(compPosition(snap, only(snap, "Depth").index, 1).reason, "three_d");
  assert.equal(compPosition(snap, only(snap, "Orbit").index, 1).reason, "auto_orient");
});
