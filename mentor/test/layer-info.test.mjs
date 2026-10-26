// Spec 004 wave B, tasks-wave-b T105: mentor/lib/layer-info.mjs on synthetic snapshots (marked so in
// each fixture's comment), then T136's live answer-key checks: Mentor Overlaps and Mentor Practice 2b
// (captured 2026-10-26) against the fields their build scripts declared.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { layerInfo, byIndex, byName } from "../lib/layer-info.mjs";
import { FIXTURES, fixture } from "./helpers.mjs";

const synthetic = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "layer-info", "synthetic", `${name}.json`), "utf8"));
const relations = synthetic("relations");

test("synthetic: layerInfo() with layer_info is known and lists every layer, keyed or not", () => {
  const r = layerInfo(relations);
  assert.equal(r.known, true);
  assert.equal(r.layers.length, 10);
  assert.ok(r.layers.length > relations.layers.length, "unkeyed layers are there too");
});

test("layerInfo() without layer_info (a snapshot from before wave B) is unknown and empty", () => {
  assert.deepEqual(layerInfo(fixture("linear-basic")), { known: false, layers: [] });
  assert.deepEqual(layerInfo(undefined), { known: false, layers: [] });
});

test("synthetic: byIndex() finds the entry, or null", () => {
  assert.equal(byIndex(relations, 5).name, "Kid");
  assert.equal(byIndex(relations, 99), null);
  assert.equal(byIndex(fixture("linear-basic"), 1), null);
});

test("synthetic: byName() returns every layer with a duplicated name", () => {
  const dup = structuredClone(relations);
  dup.layer_info[9].name = "Kid";
  assert.deepEqual(byName(dup, "Kid").map((l) => l.index), [5, 10]);
  assert.deepEqual(byName(relations, "Nobody"), []);
});

test("synthetic: the entries returned are the snapshot's own, with nothing added", () => {
  for (const entry of layerInfo(relations).layers) {
    const raw = relations.layer_info.find((l) => l.index === entry.index);
    assert.deepEqual(entry, raw);
    assert.deepEqual(Object.keys(entry), Object.keys(raw));
  }
  assert.equal(byIndex(relations, 1), relations.layer_info[0]);
});

// ---- T136: live captures against the build scripts' declared fields

const LI = path.join(FIXTURES, "layer-info");
const live = (name) => JSON.parse(fs.readFileSync(path.join(LI, name), "utf8"));
const overlaps = live("overlaps.json");
const overlapsKey = live("overlaps-expected.json");
const p2b = live("practice2b.json");
const p2bKey = live("practice2b-expected.json");
const RECT_TOL = 0.001; // a test input: the capture rounds rects to 0.001 px; the key's text rects aren't rounded

// The key names layers where the read has indexes (parent, matte layer).
const nameAt = (snap, index) => (index == null ? null : byIndex(snap, index).name);
function declaredView(snap, entry, field) {
  if (field === "parent") return nameAt(snap, entry.parent);
  if (field === "matte") return entry.matte ? { ...entry.matte, layer: nameAt(snap, entry.matte.layer) } : null;
  return entry[field];
}
const closeRect = (got, want, label) => {
  for (const k of ["left", "top", "width", "height"]) assert.ok(Math.abs(got[k] - want[k]) <= RECT_TOL, `${label} ${k}: ${got[k]} vs ${want[k]}`);
};
// `class` is visibility's, checked in visibility.test.mjs.
const FIELD_SKIP = new Set(["class"]);

test("live overlaps.json: every layer is in layer_info at its declared index, and nothing else", () => {
  assert.deepEqual(layerInfo(overlaps).layers.map((l) => [l.index, l.name]), overlapsKey.layers.map((l) => [l.index, l.name]).sort((a, b) => a[0] - b[0]));
});

test("live overlaps.json: every declared field, in and out point and rect is as the build script declared", () => {
  for (const d of overlapsKey.layers) {
    const [entry] = byName(overlaps, d.name);
    for (const [field, want] of Object.entries(d.expect)) {
      if (FIELD_SKIP.has(field)) continue;
      assert.deepEqual(declaredView(overlaps, entry, field), want, `${d.name}.${field}`);
    }
    assert.equal(entry.in_point, d.in_point, `${d.name} in point`);
    assert.equal(entry.out_point, d.out_point, `${d.name} out point`);
    assert.ok(entry.samples.length > 0, `${d.name} is sampled`);
    for (const sample of entry.samples) closeRect(sample.rect, d.rect, `${d.name} at ${sample.time} s`);
  }
});

test("live practice2b.json: every layer is present: the 13 built before at their old indexes, the new ones at theirs, Background last", () => {
  const want = [
    ...p2bKey.existing_layers.map((l) => [l.after, l.name]),
    ...p2bKey.layers.map((l) => [l.index, l.name]),
  ].sort((a, b) => a[0] - b[0]);
  assert.deepEqual(layerInfo(p2b).layers.map((l) => [l.index, l.name]), want);
});

test("live practice2b.json: every declared field and the rect at 0 s is as the build script declared", () => {
  for (const d of p2bKey.layers) {
    const [entry] = byName(p2b, d.name);
    for (const [field, want] of Object.entries(d.expect)) {
      if (FIELD_SKIP.has(field)) continue;
      assert.deepEqual(declaredView(p2b, entry, field), want, `${d.name}.${field}`);
    }
    closeRect(entry.samples.find((x) => x.time === 0).rect, d.rect_at_0, `${d.name} at 0 s`);
  }
});

// AE reads collapseTransformation true on every shape and text layer; the build script declared
// false until 2026-10-26, so the key was corrected from the live read.
test("live practice2b.json: shape and text layers read collapse on, as the key declares", () => {
  const vector = p2bKey.layers.filter((d) => ["shape", "text"].includes(d.expect.kind));
  assert.ok(vector.length > 0);
  for (const d of vector) assert.equal(d.expect.collapse, true, `${d.name} in the key`);
});
