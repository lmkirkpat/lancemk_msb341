// Spec 004 wave B, tasks-wave-b T127 (spec 010 FR-004 filter 2, teaching design's Matte row: "after
// R1, the visibility class includes mattes by default"): a matte with a start is eligible and joins a
// layers group; a layer the learner hid is still left out "unless you want it"; without layer_info,
// today's result. The demo pick keeps the eye-on test: spec 010 FR-009 and FR-010 don't say an
// eye-off matte may be the demo. Synthetic (derived from synthetic/matte.json in this file), then
// T136's live case on overlaps.json.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyze, finder } from "../lib/offset.mjs";
import { FIXTURES } from "./helpers.mjs";

const matte = JSON.parse(fs.readFileSync(path.join(FIXTURES, "layer-info", "synthetic", "matte.json"), "utf8"));
const withoutInfo = (snap) => { const s = structuredClone(snap); delete s.layer_info; return s; };
const hiddenOut = (a) => (a.left_out.find((x) => x.reason === "hidden") || { layers: [] }).layers;

// SYNTHETIC: matte.json plus Card and Chip, each a Position move starting with Wipe's at 0.6 s.
function withMates() {
  const s = structuredClone(matte);
  const pos = s.layers[2].properties[0];
  for (const [index, name] of [[5, "Card"], [6, "Chip"]]) {
    s.layers.push({ index, name, kind: "solid", enabled: true, is_null: false, properties: [structuredClone(pos)] });
    s.layer_info.push({ ...structuredClone(s.layer_info[3]), index, name, matte: null });
  }
  return s;
}
const memberNames = (a) => (a.group ? a.group.members.map((m) => m.layer) : []);

test("synthetic: a matte with a start is eligible and joins a layers group", () => {
  const a = analyze(withMates());
  assert.equal(a.group.kind, "layers");
  assert.deepEqual(memberNames(a), ["Wipe", "Card", "Chip"]);
  assert.ok(finder(withMates()).layers.includes("Wipe"));
});

test("synthetic: a layer the learner hid is still left out, unless the learner adds it", () => {
  const a = analyze(withMates());
  assert.deepEqual(hiddenOut(a), ["Old Take"]);
  const asked = analyze(withMates(), { skill_options: { kind: "layers", members: ["Old Take", "Title"] } });
  assert.ok(!hiddenOut(asked).includes("Old Take"));
});

test("synthetic: the demo skips an eye-off matte (spec 010 keeps the eye-on demo filter)", () => {
  const a = analyze(withMates(), { skill_options: { kind: "layers", order: ["Card", "Wipe", "Chip"], gap_frames: 3 } });
  assert.ok(a.demo_target, a.no_demo_reason);
  assert.equal(a.demo_target, "layer/6", "the demo is Chip's (index 6), not Wipe's (index 3)");
});

test("synthetic: without layer_info, today's result (the matte is left out as hidden)", () => {
  const old = analyze(withoutInfo(withMates()));
  assert.deepEqual(hiddenOut(old), ["Old Take", "Wipe"]);
  assert.deepEqual(memberNames(old), ["Card", "Chip"]);
});

// ---- T136: live overlaps.json. Wipe (the matte, eye off) starts alone at 0.6 s, so it joins no group,
// but it's eligible: never left out as hidden. Draft (hidden by the learner) is.
const overlaps = JSON.parse(fs.readFileSync(path.join(FIXTURES, "layer-info", "overlaps.json"), "utf8"));

test("live overlaps.json: the matte isn't left out as hidden; the learner's hidden layer is; the eye-off null is left out as a null", () => {
  const a = analyze(overlaps);
  assert.deepEqual(hiddenOut(a), ["Draft"]);
  assert.deepEqual(a.left_out.find((x) => x.reason === "null").layers, ["Rig"]);
  assert.ok(!a.left_out.some((x) => x.layers.includes("Wipe")));
});

test("live overlaps.json: without layer_info, today's result (Wipe is left out as hidden)", () => {
  assert.deepEqual(hiddenOut(analyze(withoutInfo(overlaps))), ["Wipe", "Draft"]);
});
