// FR-038, SC-013: easing leaves a property with an applying kept-linear mark out of its findings,
// targets and demo, and lists it as skipped. With no marks, its output equals the saved baseline.
// The same check on Mentor Practice 2's live capture (a mark on Spinner's Rotation), against the
// build script's answer key, practice2-expected.json (T050).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyze } from "../lib/analyze.mjs";
import { FIXTURES } from "./helpers.mjs";

const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, name), "utf8"));
const practice = load("practice-before.json");
const baseline = load("practice-findings-baseline.json");
const POS = "ADBE Transform Group/ADBE Position";
const CTRL_MARK = {
  kind: "kept_linear", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice", layer: "CTRL", path: POS,
  property: "Position", key_times: [0, 1], skill: "keyframes.types", date: "2026-10-21",
};
const CTRL_PAIR = `3/${POS}/1`;

test("a marked property is skipped (kept_linear), out of findings and targets; counts unchanged; demo elsewhere", () => {
  const a = analyze(practice, { kept_linear: [CTRL_MARK] });
  assert.equal(a.findings.some((f) => f.layer === "CTRL"), false);
  assert.equal(a.targets.includes(CTRL_PAIR), false);
  assert.deepEqual(a.skipped.filter((s) => s.reason === "kept_linear"),
    [{ layer: "CTRL", layer_index: 3, property: "Position", path: POS, display_path: "Transform › Position", reason: "kept_linear" }]);
  assert.deepEqual(a.counts, baseline.all_layers.counts, "counts still count its pairs");
  assert.equal(a.targets.length, baseline.all_layers.targets.length - 1);
  assert.equal(a.demo_target, baseline.all_layers.demo_target);
  assert.notEqual(a.demo_target, CTRL_PAIR);
});

test("naming the marked layer as the focus doesn't lift the mark", () => {
  const a = analyze(practice, { kept_linear: [CTRL_MARK], focus_layers: ["CTRL"] });
  assert.deepEqual(a.targets, []);
  assert.equal(a.demo_target, null);
  assert.equal(a.no_demo_reason, "nothing_to_ease");
  assert.ok(a.skipped.some((s) => s.layer === "CTRL" && s.reason === "kept_linear"));
});

test("a lapsed mark (CTRL Position eased in a copy) changes nothing", () => {
  const eased = structuredClone(practice);
  const ctrl = eased.layers.find((l) => l.name === "CTRL").properties[0];
  ctrl.keys[0].out_type = "bezier";
  ctrl.keys[1].in_type = "bezier";
  assert.deepEqual(analyze(eased, { kept_linear: [CTRL_MARK] }), analyze(eased));
  const moved = structuredClone(practice);
  moved.layers.find((l) => l.name === "CTRL").properties[0].keys[1].time = 1.5;
  assert.deepEqual(analyze(moved, { kept_linear: [CTRL_MARK] }), analyze(moved));
});

test("expression and single_key reasons win over a mark", () => {
  const rot = { ...CTRL_MARK, layer: "Logo", path: "ADBE Transform Group/ADBE Rotate Z", property: "Rotation", key_times: [0, 2] };
  const a = analyze(practice, { kept_linear: [rot] });
  assert.deepEqual(a.skipped.filter((s) => s.layer === "Logo").map((s) => s.reason).sort(), ["expression", "single_key"]);
});

test("no marks, or an empty list, deep-equals the saved baseline (SC-004, SC-013)", () => {
  assert.deepEqual(analyze(practice, { kept_linear: [] }), baseline.all_layers);
  assert.deepEqual(analyze(practice), baseline.all_layers);
  assert.deepEqual(analyze(practice, { kept_linear: [], focus_layers: ["Title"] }), baseline.focus_title);
});

// ---- Mentor Practice 2 (live capture), a mark on Spinner's Rotation (T050)

const mp2 = load("practice2-before.json");
const key2 = load("practice2-expected.json");
const ROT = "ADBE Transform Group/ADBE Rotate Z";
const SPIN_PAIR = `2/${ROT}/1`;
const SPIN_MARK = {
  kind: "kept_linear", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice 2", layer: "Spinner", path: ROT,
  property: "Rotation", key_times: [0.25, 4.25], skill: "keyframes.types", date: "2026-10-26",
};
const linear2 = key2.segments.filter((s) => s.state === "linear").map((s) => s.id);

test("Mentor Practice 2: Spinner's marked Rotation is skipped (kept_linear), out of findings and targets; counts are the key's; demo elsewhere", () => {
  const a = analyze(mp2, { kept_linear: [SPIN_MARK] });
  assert.equal(a.findings.some((f) => f.layer === "Spinner"), false);
  assert.deepEqual([...a.targets].sort(), linear2.filter((id) => id !== SPIN_PAIR).sort());
  assert.deepEqual(a.skipped.filter((s) => s.reason === "kept_linear"),
    [{ layer: "Spinner", layer_index: 2, property: "Rotation", path: ROT, display_path: "Transform › Rotation", reason: "kept_linear" }]);
  assert.deepEqual(a.counts, { ...key2.totals, partly_eased: 0 }, "counts still count its pair");
  assert.ok(a.demo_target && a.demo_target !== SPIN_PAIR && linear2.includes(a.demo_target));
});

test("Mentor Practice 2: naming Spinner as the focus doesn't lift the mark", () => {
  const a = analyze(mp2, { kept_linear: [SPIN_MARK], focus_layers: ["Spinner"] });
  assert.deepEqual(a.targets, []);
  assert.equal(a.demo_target, null);
  assert.equal(a.no_demo_reason, "nothing_to_ease");
  assert.ok(a.skipped.some((s) => s.layer === "Spinner" && s.reason === "kept_linear"));
});

test("Mentor Practice 2: a lapsed Spinner mark (eased, or a key moved, in a copy) changes nothing", () => {
  const eased = structuredClone(mp2);
  const rot = eased.layers.find((l) => l.name === "Spinner").properties[0];
  rot.keys[0].out_type = "bezier";
  rot.keys[1].in_type = "bezier";
  assert.deepEqual(analyze(eased, { kept_linear: [SPIN_MARK] }), analyze(eased));
  const moved = structuredClone(mp2);
  moved.layers.find((l) => l.name === "Spinner").properties[0].keys[1].time = 4;
  assert.deepEqual(analyze(moved, { kept_linear: [SPIN_MARK] }), analyze(moved));
});

test("Mentor Practice 2: no marks or an empty list finds exactly the key's linear pairs; a mark for another comp doesn't apply", () => {
  for (const a of [analyze(mp2), analyze(mp2, { kept_linear: [] })]) {
    assert.deepEqual([...a.targets].sort(), [...linear2].sort());
    assert.deepEqual(a.skipped, key2.skipped);
  }
  assert.deepEqual(analyze(mp2, { kept_linear: [{ ...SPIN_MARK, comp: "Mentor Practice" }] }), analyze(mp2));
});
