// Spec 004 wave B, tasks-wave-b T119 and T121: KD-001 in easing (SC-011). A moving matte with its eye
// off is an ordinary candidate, not "hidden"; a layer the learner hid still is; without layer_info,
// today's result. Synthetic matte first (marked so in its comment); the live overlaps.json cases run
// once T133 has captured it, and skip until then.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, fixture, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
const setProject = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: path.relative(home, file) }));

const { analyze } = await import("../lib/analyze.mjs");
const { TOOLS } = await import("../tools/index.mjs");
const tool = (name) => TOOLS.find((t) => t.name === name).handler;

const LI = path.join(FIXTURES, "layer-info");
const MATTE_FILE = path.join(LI, "synthetic", "matte.json");
const matte = JSON.parse(fs.readFileSync(MATTE_FILE, "utf8"));
const OVERLAPS_FILE = path.join(LI, "overlaps.json");
const overlaps = fs.existsSync(OVERLAPS_FILE) ? JSON.parse(fs.readFileSync(OVERLAPS_FILE, "utf8")) : null;
const waitsForCapture = overlaps ? false : "waits for T133's live capture, layer-info/overlaps.json";

const withoutInfo = (snap) => {
  const s = structuredClone(snap);
  delete s.layer_info;
  if (s.comp) { delete s.comp.time; delete s.comp.hide_shy; }
  return s;
};
const pairsOf = (result, layer) => result.findings.filter((f) => f.layer === layer).flatMap((f) => f.segments.map((s) => s.id));
const layerIndex = (snap, name) => snap.layers.find((l) => l.name === name).index;
const onLayer = (id, snap, name) => id != null && id.startsWith(`${layerIndex(snap, name)}/`);

function matteCase(snap, matteName, hiddenName) {
  const focuses = hiddenName ? [undefined, [matteName], [matteName, hiddenName], [hiddenName, matteName]] : [undefined, [matteName]];
  for (const focus_layers of focuses) {
    const r = analyze(snap, { focus_layers });
    const mine = pairsOf(r, matteName);
    assert.ok(mine.length > 0, `the matte's pairs are findings (${focus_layers})`);
    for (const id of mine) assert.ok(r.targets.includes(id), `the matte's pair ${id} is a target (${focus_layers})`);
    assert.ok(!r.hidden_layers.includes(matteName), "a matte is never hidden");
    if (hiddenName) assert.ok(r.hidden_layers.includes(hiddenName), "a layer the learner hid still is");
    assert.ok(!onLayer(r.demo_target, snap, matteName), "the demo is never on an eye-off matte");
  }
  const old = analyze(withoutInfo(snap));
  assert.ok(old.hidden_layers.includes(matteName), "without layer_info the matte is in hidden_layers, as before");
}

test("synthetic: Wipe (moving matte, eye off) is in findings and targets every time, and not hidden (SC-011)", () => {
  matteCase(matte, "Wipe", "Old Take");
  const both = analyze(matte, { focus_layers: ["Wipe", "Old Take"] });
  assert.equal(both.demo_target, null);
  assert.equal(both.no_demo_reason, "no_visible_layer");
  assert.equal(analyze(matte).demo_target, `2/ADBE Transform Group/ADBE Opacity/1`, "the demo goes to the visible layer");
});

test("synthetic: with layer_info removed, every other field is today's", () => {
  const now = analyze(matte);
  const old = analyze(withoutInfo(matte));
  assert.deepEqual({ ...now, hidden_layers: null }, { ...old, hidden_layers: null });
  assert.deepEqual(old.hidden_layers, ["Old Take", "Wipe"]);
  assert.deepEqual(now.hidden_layers, ["Old Take"]);
});

test("live overlaps.json: Wipe is a candidate, not hidden, never the demo (SC-011)", { skip: waitsForCapture }, () => {
  const hidden = overlaps.layers.find((l) => l.enabled === false && !overlaps.layer_info.find((i) => i.index === l.index).is_matte && !l.is_null);
  // T131's comp lists no keyed layer the learner hid, so that half is the synthetic case's.
  matteCase(overlaps, "Wipe", hidden ? hidden.name : null);
});

test("snapshot_project in fixture mode on the matte: hidden_layers without the matte, and no new field (T121)", async () => {
  setProject(path.join(FIXTURES, "synthetic", "hidden-layer.json"));
  const before = JSON.parse((await tool("snapshot_project")({})).content[0].text);
  setProject(MATTE_FILE);
  const reply = JSON.parse((await tool("snapshot_project")({})).content[0].text);
  assert.deepEqual(reply.hidden_layers, ["Old Take"]);
  assert.deepEqual(Object.keys(reply).sort(), Object.keys(before).sort());
  assert.ok(reply.targets.some((id) => id.startsWith("3/")), "Wipe's pair is a target");
  for (const f of reply.findings) assert.deepEqual(Object.keys(f).sort(), ["layer", "property", "segments"]);
});

test("live overlaps.json: snapshot_project's reply has today's fields", { skip: waitsForCapture }, async () => {
  setProject(path.join(FIXTURES, "synthetic", "hidden-layer.json"));
  const before = JSON.parse((await tool("snapshot_project")({})).content[0].text);
  setProject(OVERLAPS_FILE);
  const reply = JSON.parse((await tool("snapshot_project")({})).content[0].text);
  assert.ok(!reply.hidden_layers.includes("Wipe"));
  assert.deepEqual(Object.keys(reply).sort(), Object.keys(before).sort());
});

test("fixtures from before wave B are unchanged by this (hidden-layer.json)", () => {
  assert.deepEqual(analyze(fixture("hidden-layer")).hidden_layers, ["Old Take"]);
});

// Review B1: only mattes leave hidden_layers. A keyed null with its eye off stays, as before (FR-015).
// SYNTHETIC: matte.json plus Rig, a null with its eye off and Old Take's Position keys.
function withHiddenNull(snap) {
  const s = structuredClone(snap);
  const from = s.layers.find((l) => l.name === "Old Take");
  s.layers.push({ index: 9, name: "Rig", kind: "null", enabled: false, is_null: true, properties: structuredClone(from.properties) });
  s.layer_info.push({ ...structuredClone(s.layer_info[0]), index: 9, name: "Rig", kind: "null", enabled: false, is_null: true, is_matte: false, matte: null });
  return s;
}

test("synthetic: a keyed null with its eye off stays in hidden_layers once layer_info is known (B1)", () => {
  const s = withHiddenNull(matte);
  const r = analyze(s);
  assert.deepEqual(r.hidden_layers, ["Old Take", "Rig"]);
  assert.ok(r.findings.some((f) => f.layer === "Rig"), "its pairs are still findings, as before");
  assert.deepEqual(analyze(withoutInfo(s)).hidden_layers, ["Old Take", "Wipe", "Rig"]);
  assert.ok(!onLayer(r.demo_target, s, "Rig"));
});
