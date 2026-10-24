// Spec 004 wave B, tasks-wave-b T137: FR-012's checklist for wave B in one file. One test named after
// each row of spec.md › Edge Cases that wave B covers, each on a live capture of Mentor Overlaps
// (T131's script, captured in T133). They skip until those captures exist. The rows that wait for
// reads R2 and R4 are todos, naming wave D.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyze } from "../lib/analyze.mjs";
import { analyze as offsetAnalyze } from "../lib/offset.mjs";
import { timing } from "../lib/timing.mjs";
import { visibility, classOf } from "../lib/visibility.mjs";
import { sourcesOf } from "../lib/motion-sources.mjs";
import { byName } from "../lib/layer-info.mjs";
import { FIXTURES } from "./helpers.mjs";

const LI = path.join(FIXTURES, "layer-info");
const load = (name) => {
  const file = path.join(LI, name);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
};
const overlaps = load("overlaps.json");
const solo = load("overlaps-solo.json");
const key = load("overlaps-expected.json");
const live = overlaps && key ? false : "waits for T133's live captures (layer-info/overlaps.json and overlaps-expected.json)";
const idx = (name) => {
  const found = byName(overlaps, name);
  assert.equal(found.length, 1, `exactly one layer named ${name}`);
  return found[0].index;
};

test("Track matte, eye off: class matte, and its motion counts in easing and offset (KD-001)", { skip: live }, () => {
  assert.equal(classOf(overlaps, idx("Wipe")), "matte");
  assert.equal(byName(overlaps, "Wipe")[0].enabled, false);
  const easing = analyze(overlaps);
  assert.ok(easing.findings.some((f) => f.layer === "Wipe"));
  assert.ok(!easing.hidden_layers.includes("Wipe"));
  const hidden = offsetAnalyze(overlaps).left_out.find((x) => x.reason === "hidden");
  assert.ok(!hidden || !hidden.layers.includes("Wipe"));
});

test("Hidden null with children: class null, in each child's motion sources", { skip: live }, () => {
  assert.equal(classOf(overlaps, idx("Rig")), "null");
  for (const child of ["Leaf 1", "Leaf 2"]) {
    const parents = sourcesOf(overlaps, child).parents;
    assert.equal(parents[0].layer, "Rig", child);
    assert.equal(parents[0].class, "null");
    assert.equal(parents[0].moves_children, true);
  }
});

test("Shy parent: the child's map names the parent, marked hidden from the timeline; still renders", { skip: live }, () => {
  const parent = sourcesOf(overlaps, "Kid").parents[0];
  assert.equal(parent.layer, "Shy Parent");
  assert.equal(parent.shy, true);
  const v = visibility(overlaps).find((e) => e.layer === "Shy Parent");
  assert.equal(v.class, "shy");
  assert.equal(v.timeline_hidden, true);
});

test("Guide layer: class guide", { skip: live }, () => {
  assert.equal(classOf(overlaps, idx("Guide Grid")), "guide");
});

test("Solo on another layer: solo is read, and the class still describes the layer itself", { skip: solo && !live ? false : "waits for T133's overlaps-solo.json" }, () => {
  const v = visibility(solo);
  for (const e of v) assert.equal(e.soloed_elsewhere, e.layer !== "Still", e.layer);
  assert.deepEqual(v.map((e) => e.class), visibility(overlaps).map((e) => e.class));
});

test("Expression on a keyed property: the map lists the expression and the keys, and timing doesn't count them", { skip: live }, () => {
  const dial = sourcesOf(overlaps, "Gauge Dial");
  const rot = dial.own_keys.find((k) => k.path === "ADBE Transform Group/ADBE Rotate Z");
  assert.equal(rot.expression_on, true);
  assert.ok(rot.keys >= 2);
  assert.deepEqual(dial.expressions.on_keyed.map((k) => k.path), ["ADBE Transform Group/ADBE Rotate Z"]);
  const t = timing(overlaps).layers.find((l) => l.layer === "Gauge Dial");
  assert.ok(t.units.every((u) => u.excluded === "expression"));
});

test("Precomp layer: in and out points, stretch and time remap read; contents not_read", { skip: live }, () => {
  for (const name of ["Icon Stretch", "Icon Remap"]) {
    const entry = byName(overlaps, name)[0];
    const declared = key.layers.find((l) => l.name === name);
    assert.equal(entry.in_point, declared.in_point, name);
    assert.equal(entry.out_point, declared.out_point, name);
    assert.equal(entry.stretch, declared.expect.stretch, name);
    assert.equal(entry.time_remap, declared.expect.time_remap, name);
    assert.equal(sourcesOf(overlaps, name).precomp_contents, "not_read");
  }
});

test("Layer with no keys, no parent, no expression: static, never missing", { skip: live }, () => {
  const still = sourcesOf(overlaps, "Still");
  assert.ok(still);
  assert.equal(still.static_as_read, true);
  assert.equal(still.expressions.status, "not_read");
});

test("A layer outside the active comp: sourcesOf() is null", { skip: live }, () => {
  assert.equal(sourcesOf(overlaps, "Title"), null, "Mentor Practice's layer");
  assert.equal(sourcesOf(overlaps, "Door"), null, "Mentor Practice 2's layer");
});

// T158 (live, 🖐): does the snapshot's rotation for an auto-oriented layer include auto-orient? This
// reports the answer; it doesn't fail either way, since comp-space keeps returning auto_orient until a
// later shared-owner branch acts on it.
test("Auto-orient (T158): Orbit's rotation sample against AE's on-screen angle", { skip: live }, (t) => {
  const orbit = byName(overlaps, "Orbit")[0];
  const rows = key.orbit_check.map((c) => {
    const s = orbit.samples.find((x) => Math.abs(x.time - c.time) <= 0.0005);
    return { time: c.time, read: s ? s.rotation : null, on_screen: c.screen_angle };
  });
  const includes = rows.every((r) => r.read != null && Math.abs(((r.read - r.on_screen + 540) % 360) - 180) < 0.5);
  t.diagnostic(`Orbit: ${JSON.stringify(rows)}; the rotation read ${includes ? "includes" : "does not include"} auto-orient`);
});

test.todo("Expression with no keys: listed as a source (wave D, read R2)");
test.todo("Expression turned off: listed as off, keys drive (wave D, read R2)");
test.todo("Precomp layer: contents as a source (wave D, read R4)");
