// Spec 004 wave B, tasks-wave-b T108: FR-014's motion-sources map, step 1
// (mentor/lib/motion-sources.mjs). Synthetic first (each fixture's comment says so); the live answer
// keys are T136's.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { motionSources, sourcesOf } from "../lib/motion-sources.mjs";
import { FIXTURES, fixture } from "./helpers.mjs";

const synthetic = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "layer-info", "synthetic", `${name}.json`), "utf8"));
const relations = synthetic("relations");

test("synthetic: a child of a null lists the null in parents, with its class", () => {
  const leaf = sourcesOf(relations, "Leaf 1");
  assert.deepEqual(leaf.parents, [{ layer_index: 1, layer: "Rig", class: "null", shy: false, moves_children: true }]);
  assert.equal(sourcesOf(relations, "Leaf 2").parents[0].layer, "Rig", "a separated child too");
});

test("synthetic: a chain of two is nearest first", () => {
  const deep = structuredClone(relations);
  deep.layer_info.find((l) => l.name === "Rig").parent = 4; // Rig follows Shy Parent
  assert.deepEqual(sourcesOf(deep, "Leaf 1").parents.map((p) => p.layer), ["Rig", "Shy Parent"]);
});

test("synthetic: children are the direct ones", () => {
  assert.deepEqual(sourcesOf(relations, "Rig").children, [{ layer_index: 2, layer: "Leaf 1" }, { layer_index: 3, layer: "Leaf 2" }]);
  assert.deepEqual(sourcesOf(relations, "Leaf 1").children, []);
});

test("synthetic: a shy parent keyed only on Opacity doesn't move its children", () => {
  assert.deepEqual(sourcesOf(relations, "Kid").parents, [{ layer_index: 4, layer: "Shy Parent", class: "shy", shy: true, moves_children: false }]);
});

test("synthetic: own keys, by group; separated Position is two properties", () => {
  assert.deepEqual(sourcesOf(relations, "Leaf 2").own_keys.map((k) => [k.path, k.keys, k.group]), [
    ["ADBE Transform Group/ADBE Position_0", 2, "transform"],
    ["ADBE Transform Group/ADBE Position_1", 2, "transform"],
  ]);
  assert.deepEqual(sourcesOf(relations, "Kid").own_keys, []);
});

test("synthetic: a keyed property with an expression on is in own_keys and in expressions.on_keyed", () => {
  const dial = sourcesOf(relations, "Gauge Dial");
  assert.equal(dial.own_keys[0].expression_on, true);
  assert.deepEqual(dial.expressions, { status: "not_read", on_keyed: [{ property: "Rotation", path: "ADBE Transform Group/ADBE Rotate Z" }] });
});

test("synthetic: expressions.status is not_read on every layer, never none (FR-014)", () => {
  const map = motionSources(relations);
  assert.equal(map.layers.length, 10);
  for (const l of map.layers) assert.equal(l.expressions.status, "not_read", l.layer);
  assert.deepEqual(sourcesOf(relations, "Still").expressions, { status: "not_read", on_keyed: [] });
  assert.deepEqual(map.read, { own_keys: true, parents: true, expressions: "keyed_only", precomp_contents: "not_read" });
});

test("synthetic: precomp_contents is not_read on a precomp layer and not_a_precomp elsewhere", () => {
  assert.equal(sourcesOf(relations, "Icon Stretch").precomp_contents, "not_read");
  assert.equal(sourcesOf(relations, "Still").precomp_contents, "not_a_precomp");
});

test("synthetic: a layer with no keys and no parent is static as read; a child or a keyed layer isn't", () => {
  assert.equal(sourcesOf(relations, "Still").static_as_read, true);
  assert.equal(sourcesOf(relations, "Kid").static_as_read, false);
  assert.equal(sourcesOf(relations, "Gauge Dial").static_as_read, false);
});

test("synthetic: sourcesOf() by index, and null for a layer not in the comp", () => {
  assert.equal(sourcesOf(relations, 5).layer, "Kid");
  assert.equal(sourcesOf(relations, "Not Here"), null);
  assert.equal(sourcesOf(relations, 42), null);
});

test("without layer_info: parents null and read.parents not_read", () => {
  const old = fixture("hidden-layer");
  const map = motionSources(old);
  assert.equal(map.known, false);
  assert.equal(map.read.parents, "not_read");
  assert.deepEqual(map.layers.map((l) => l.layer), ["Old Take", "Title"]);
  for (const l of map.layers) {
    assert.equal(l.parents, null);
    assert.equal(l.children, null);
    assert.equal(l.static_as_read, false);
    assert.equal(l.expressions.status, "not_read");
  }
});
