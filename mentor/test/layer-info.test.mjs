// Spec 004 wave B, tasks-wave-b T105: mentor/lib/layer-info.mjs on synthetic snapshots (marked so in
// each fixture's comment). The live answer-key checks are T136's.

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
