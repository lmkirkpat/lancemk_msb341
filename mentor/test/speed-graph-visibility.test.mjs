// Spec 004 wave B, tasks-wave-b T125 (spec 008 row 10, teaching design's Matte row): skill 2 reads the
// visibility class once layer_info is known. A matte's eased Position pair is a candidate and in the
// focus when proposed, never the demo while its eye is off, and not left out as hidden; without
// layer_info, today's result. Synthetic (its comment says so), then T136's live case on overlaps.json.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyze, finder } from "../lib/speed-graph.mjs";
import { FIXTURES } from "./helpers.mjs";

const eased = JSON.parse(fs.readFileSync(path.join(FIXTURES, "layer-info", "synthetic", "matte-eased.json"), "utf8"));
const withoutInfo = (snap) => { const s = structuredClone(snap); delete s.layer_info; return s; };
const hiddenOut = (a) => (a.left_out.find((x) => x.kind === "hidden") || { layers: [] }).layers;
const onWipe = (id) => typeof id === "string" && id.startsWith("3/");

test("synthetic: a matte's eased Position pair is a candidate and in the proposed focus", () => {
  const a = analyze(eased);
  assert.deepEqual(a.focus, ["Wipe"]);
  assert.ok(a.targets.includes("3/ADBE Transform Group/ADBE Position/1"));
  assert.deepEqual(finder(eased).layers, ["Wipe"]);
});

test("synthetic: never the demo target while its eye is off", () => {
  const solo = analyze(eased, { focus_layers: ["Wipe"] });
  assert.ok(solo.targets.length >= 2);
  assert.equal(solo.demo_target, null);
  assert.equal(solo.no_demo_reason, "no_visible_layer");
  const two = analyze(eased, { focus_layers: ["Wipe", "Card"] });
  assert.ok(two.targets.some(onWipe));
  assert.ok(two.demo_target && !onWipe(two.demo_target), "the demo goes to Card");
});

test("synthetic: the matte isn't left out as hidden; the layer the learner hid is", () => {
  const a = analyze(eased);
  assert.deepEqual(hiddenOut(a), ["Old Take"]);
});

test("synthetic: without layer_info, today's result (the matte is left out as hidden)", () => {
  const old = analyze(withoutInfo(eased));
  assert.deepEqual(old.focus, ["Card"]);
  assert.deepEqual(hiddenOut(old), ["Old Take", "Wipe"]);
});

// Review B1: a keyed null with its eye off is still left out as hidden (and as a null) once
// layer_info is known. SYNTHETIC: matte-eased.json plus Rig, a null with its eye off and Wipe's eased
// keys.
test("synthetic: a keyed null with its eye off is still in the hidden list (B1)", () => {
  const s = structuredClone(eased);
  s.layers.push({ index: 9, name: "Rig", kind: "null", enabled: false, is_null: true, properties: structuredClone(s.layers[2].properties) });
  s.layer_info.push({ ...structuredClone(s.layer_info[2]), index: 9, name: "Rig", kind: "null", is_null: true, is_matte: false });
  const a = analyze(s);
  assert.deepEqual(hiddenOut(a), ["Old Take", "Rig"]);
  assert.deepEqual(a.left_out.find((x) => x.kind === "null").layers, ["Rig"]);
  assert.deepEqual(a.focus, ["Wipe"]);
  assert.deepEqual(hiddenOut(analyze(withoutInfo(s))), ["Old Take", "Wipe", "Rig"]);
});

// ---- T136: live overlaps.json. Wipe (the matte, eye off) has a linear Position pair and an Opacity
// blink the build script shaped (80/15), so it's read as eligible: its pairs are sorted by easing state
// (ease first, already shaped), never left out as hidden; Draft (hidden by the learner) and Rig (an
// eye-off null) are.
const overlaps = JSON.parse(fs.readFileSync(path.join(FIXTURES, "layer-info", "overlaps.json"), "utf8"));
const kindOf = (a, kind) => (a.left_out.find((x) => x.kind === kind) || { layers: [], refs: [] });

test("live overlaps.json: the matte isn't left out as hidden; its pairs are read like any visible layer's; the learner's hidden layer and the eye-off null are", () => {
  const a = analyze(overlaps);
  assert.deepEqual(hiddenOut(a), ["Rig", "Draft"]);
  assert.ok(kindOf(a, "ease_first").refs.some((r) => r.layer === "Wipe" && r.property === "Position"));
  assert.ok(kindOf(a, "already_shaped").refs.some((r) => r.layer === "Wipe" && r.property === "Opacity"));
});

test("live overlaps.json: without layer_info, today's result (Wipe is left out as hidden)", () => {
  const old = analyze(withoutInfo(overlaps));
  assert.ok(hiddenOut(old).includes("Wipe"));
  assert.ok(!kindOf(old, "ease_first").refs.some((r) => r.layer === "Wipe"), "a hidden layer's linear pair isn't offered to ease first");
});
