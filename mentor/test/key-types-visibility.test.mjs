// Spec 004 wave B, tasks-wave-b T124 (spec 009 SR-3, FR-023, overlap row 13): skill 1 reads the
// visibility class once layer_info is known. A track matte's on-off Opacity pair is a candidate and
// can be the demo; a layer the learner hid is still left out; without layer_info, today's result.
// Synthetic matte first (its comment says so); overlaps.json once T133 captures it.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyze, finder } from "../lib/key-types.mjs";
import { FIXTURES } from "./helpers.mjs";

const LI = path.join(FIXTURES, "layer-info");
const load = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null);
const matte = load(path.join(LI, "synthetic", "matte.json"));
const overlaps = load(path.join(LI, "overlaps.json"));
const withoutInfo = (snap) => { const s = structuredClone(snap); delete s.layer_info; return s; };
const hiddenOut = (a) => (a.left_out.find((x) => x.reason === "hidden") || { layers: [] }).layers;
const WIPE_OPACITY = { layer: "Wipe", property: "Opacity" };

function matteCase(snap, hiddenName) {
  const a = analyze(snap);
  assert.ok(a.candidates.some((c) => c.layer === "Wipe" && c.property === "Opacity"), "the matte's blink is a candidate");
  assert.ok(finder(snap).layers.includes("Wipe"));
  assert.ok(!hiddenOut(a).includes("Wipe"), "a matte isn't left out as hidden");
  if (hiddenName) assert.ok(hiddenOut(a).includes(hiddenName), "a layer the learner hid still is");
  const f = analyze(snap, { skill_options: { focus: [WIPE_OPACITY] } });
  assert.ok(f.targets.length >= 2);
  assert.ok(f.demo_target && f.demo_target.startsWith(`${snap.layers.find((l) => l.name === "Wipe").index}/`), "the matte can be the demo (SR-3)");
}

test("synthetic: a matte's on-off Opacity pair is a candidate and the demo; the hidden layer is still left out", () => {
  matteCase(matte, "Old Take");
});

test("synthetic: with layer_info removed, today's result (the matte looks hidden)", () => {
  const old = analyze(withoutInfo(matte));
  assert.ok(!old.candidates.some((c) => c.layer === "Wipe"));
  assert.deepEqual(hiddenOut(old), ["Old Take", "Wipe"]);
  const f = analyze(withoutInfo(matte), { skill_options: { focus: [WIPE_OPACITY] } });
  assert.equal(f.demo_target, null);
  assert.equal(f.no_demo_reason, "hidden_or_null");
});

test("synthetic: a null stays out, whatever the class says about its eye", () => {
  const s = structuredClone(matte);
  s.layers[2].is_null = true;
  s.layers[2].kind = "null";
  s.layer_info[2].is_null = true;
  assert.ok(!analyze(s).candidates.some((c) => c.layer === "Wipe"));
});

test("live overlaps.json: Wipe's blink is a candidate and can be the demo", { skip: overlaps ? false : "waits for T133's live capture" }, () => {
  matteCase(overlaps, null);
});
