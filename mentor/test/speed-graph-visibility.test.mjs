// Spec 004 wave B, tasks-wave-b T125 (spec 008 row 10, teaching design's Matte row): skill 2 reads the
// visibility class once layer_info is known. A matte's eased Position pair is a candidate and in the
// focus when proposed, never the demo while its eye is off, and not left out as hidden; without
// layer_info, today's result. Synthetic (its comment says so); a live case is T136's.

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
