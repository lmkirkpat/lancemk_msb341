// Spec 004 wave B, tasks-wave-b T107: FR-013's visibility class (mentor/lib/visibility.mjs). Synthetic
// first (each fixture's comment says so); the live answer keys are T136's.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { visibility, classOf } from "../lib/visibility.mjs";
import { FIXTURES, fixture } from "./helpers.mjs";

const synthetic = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "layer-info", "synthetic", `${name}.json`), "utf8"));
const relations = synthetic("relations");
const matte = synthetic("matte");
const classes = (snap) => Object.fromEntries(visibility(snap).map((v) => [v.layer, v.class]));

// One layer_info entry per row of data-model › Visibility class, from a template.
function one(attrs) {
  return { comp: { id: 1, name: "Rows", hide_shy: false }, layers: [], layer_info: [{ index: 1, name: "X", is_null: false, is_matte: false, enabled: true, guide: false, shy: false, solo: false, ...attrs }] };
}

test("synthetic: each class in order, first match wins", () => {
  assert.equal(classOf(one({ is_null: true }), 1), "null");
  assert.equal(classOf(one({ is_matte: true }), 1), "matte");
  assert.equal(classOf(one({ enabled: false }), 1), "hidden");
  assert.equal(classOf(one({ guide: true }), 1), "guide");
  assert.equal(classOf(one({ shy: true }), 1), "shy");
  assert.equal(classOf(one({}), 1), "renders");
});

test("synthetic: the ties: a null with its eye off is null, a matte with its eye off is matte, a guide with its eye off is hidden, a shy guide is guide", () => {
  assert.equal(classOf(one({ is_null: true, enabled: false }), 1), "null");
  assert.equal(classOf(one({ is_matte: true, enabled: false }), 1), "matte");
  assert.equal(classOf(one({ guide: true, enabled: false }), 1), "hidden");
  assert.equal(classOf(one({ guide: true, shy: true }), 1), "guide");
  assert.equal(classOf(one({ is_null: true, is_matte: true }), 1), "null");
});

test("synthetic: every layer of the relations and matte fixtures", () => {
  assert.deepEqual(classes(relations), {
    Rig: "null", "Leaf 1": "renders", "Leaf 2": "renders", "Shy Parent": "shy", Kid: "renders",
    "Guide Grid": "hidden", "Shy Guide": "guide", "Gauge Dial": "renders", "Icon Stretch": "renders", Still: "renders",
  });
  assert.deepEqual(classes(matte), { "Old Take": "hidden", Title: "renders", Wipe: "matte", Photo: "renders" });
});

test("synthetic: solo on one layer gives soloed_elsewhere on every other layer and changes no class", () => {
  const solo = structuredClone(relations);
  solo.layer_info.find((l) => l.name === "Still").solo = true;
  const v = visibility(solo);
  for (const e of v) assert.equal(e.soloed_elsewhere, e.layer !== "Still", e.layer);
  assert.equal(v.find((e) => e.layer === "Still").solo, true);
  assert.deepEqual(classes(solo), classes(relations));
  assert.ok(visibility(relations).every((e) => e.soloed_elsewhere === false), "no solo, nothing soloed elsewhere");
});

test("synthetic: shy with the comp's shy filter on and off (timeline_hidden)", () => {
  const on = visibility(relations).find((e) => e.layer === "Shy Parent");
  assert.equal(on.shy, true);
  assert.equal(on.timeline_hidden, true);
  const offSnap = structuredClone(relations);
  offSnap.comp.hide_shy = false;
  const off = visibility(offSnap).find((e) => e.layer === "Shy Parent");
  assert.equal(off.timeline_hidden, false);
  assert.equal(off.class, "shy");
  assert.equal(visibility(relations).find((e) => e.layer === "Still").timeline_hidden, false);
});

test("without layer_info: known false, one entry per keyed layer, classed null, hidden or renders only", () => {
  const old = fixture("hidden-layer");
  const v = visibility(old);
  assert.deepEqual(v.map((e) => e.layer), old.layers.map((l) => l.name));
  assert.ok(v.every((e) => e.known === false));
  assert.deepEqual(classes(old), { "Old Take": "hidden", Title: "renders" });
  assert.equal(classOf(fixture("null-first"), fixture("null-first").layers.find((l) => l.is_null).index), "null");
  const noInfo = structuredClone(matte);
  delete noInfo.layer_info;
  assert.deepEqual(classes(noInfo), { "Old Take": "hidden", Title: "renders", Wipe: "hidden" }, "a matte looks hidden without R1 (KD-001)");
  for (const e of v) assert.ok(["null", "hidden", "renders"].includes(e.class));
});

test("classOf() is null for a layer that isn't there", () => {
  assert.equal(classOf(relations, 99), null);
  assert.equal(classOf(fixture("hidden-layer"), 99), null);
});
