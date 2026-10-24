// Spec 004 wave B, tasks-wave-b T120 (SC-004; FR-015's before-and-after, for reads R1 and R3): on a
// capture with layer_info, easing's analyze() equals analyze() on the same capture with layer_info,
// comp.time and comp.hide_shy removed. The live captures (T133, T135) are checked once they exist and
// skip until then; a synthetic case on Mentor Practice's saved snapshot runs now. Wave A's
// analyze-unchanged.test.mjs stays as it is.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyze } from "../lib/analyze.mjs";
import { FIXTURES } from "./helpers.mjs";

const LI = path.join(FIXTURES, "layer-info");
const load = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null);
const strip = (snap) => {
  const s = structuredClone(snap);
  delete s.layer_info;
  delete s.comp.time;
  delete s.comp.hide_shy;
  return s;
};

function sameEitherWay(snap, focus) {
  assert.deepEqual(analyze(snap), analyze(strip(snap)));
  assert.deepEqual(analyze(snap, { focus_layers: focus }), analyze(strip(snap), { focus_layers: focus }));
}

// SYNTHETIC: Mentor Practice's saved snapshot (wave A's before) with a layer_info written from its own
// layers (eye, null, kind), no mattes. Replaced by practice-r1.json below once T133 captures it.
test("synthetic: Mentor Practice with a layer_info added gives the same easing result, all layers and Title", () => {
  const snap = load(path.join(FIXTURES, "practice-before.json"));
  snap.comp.time = 0;
  snap.comp.hide_shy = false;
  snap.layer_info = [...snap.layers, ...snap.precomp_layers.map((p) => ({ ...p, kind: "precomp", enabled: true, is_null: false }))]
    .sort((a, b) => a.index - b.index)
    .map((l) => ({ index: l.index, name: l.name, kind: l.kind, enabled: l.enabled, is_null: l.is_null, is_matte: false, guide: false, shy: false, solo: false, parent: null, samples: [] }));
  sameEitherWay(snap, ["Title"]);
});

for (const [file, focus, task] of [["practice-r1.json", ["Title"], "T133"], ["practice2b.json", null, "T135"]]) {
  const snap = load(path.join(LI, file));
  test(`live ${file}: analyze() with and without layer_info is the same`, { skip: snap ? false : `waits for ${task}'s live capture` }, () => {
    sameEitherWay(snap, focus || [snap.layers[0].name]);
  });
}

const overlaps = load(path.join(LI, "overlaps.json"));
test("live overlaps.json: Drift (an expression on unkeyed Position) is in no findings, targets or skipped entry (FR-015)", { skip: overlaps ? false : "waits for T133's live capture" }, () => {
  const r = analyze(overlaps);
  assert.ok(!r.findings.some((f) => f.layer === "Drift"));
  assert.ok(!r.skipped.some((s) => s.layer === "Drift"));
  const drift = overlaps.layer_info.find((l) => l.name === "Drift");
  assert.ok(drift, "Drift is in layer_info");
  assert.ok(!r.targets.some((id) => id.startsWith(`${drift.index}/`)));
});
