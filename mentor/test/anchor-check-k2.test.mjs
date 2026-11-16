// Spec 015 T023 (K2: FR-012 to FR-014a, SC-005 (a) to (d), E17, E17a, E28) through the pivot check,
// on T015's live captures (AE 27.0): 015 Rig is Comp 1's Shake and Sweep rig with Comp 1's own
// expression texts, read at the lesson's playhead (0.6 s), with the playhead moved (3.4 s), with Pan
// Behind's values on Shake Control (T005's +561, -120) and with its base Position moved 40 px; 015
// Planted before and after a null renumbers its wiggle. Turn f itself is k2-turn-f.test.mjs.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { check } from "../lib/anchor-check.mjs";
import { FIXTURES } from "./helpers.mjs";

const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", `${name}.json`), "utf8"));
const RIG = load("rig");
const PLANTED = load("planted");
const lessonOn = (base, layer, place) => {
  const e = base.layer_info.find((l) => l.name === layer);
  return { comp_id: base.comp.id, baseline: base, targets: [`anchor/${e.index}`], skill_options: { focus: [{ layer, place }] }, exclude: [] };
};
const ROCK = lessonOn(RIG, "rock.png", "top-right");
const learner = (r) => ({ moved: r.layers[0].item5.moved_layers, other: r.other_changes });

test("SC-005 (a), live: Pan Behind's values on Shake Control are one change, its Anchor Point, with the shift attached", () => {
  const r = check(RIG, load("rig-panned"), ROCK);
  assert.equal(r.comp_matches, true);
  assert.equal(r.other_changes.length, 1);
  const [c] = r.other_changes;
  assert.deepEqual([c.kind, c.layer], ["anchor_changed", "Shake Control"]);
  assert.equal(c.effect.time, 2.636, "held still at the edit's frame; turned away from it by the Rotation expression later");
  assert.ok(c.effect.distance_px > 1, String(c.effect.distance_px));
  assert.deepEqual(r.layers[0].item5.moved_layers, [], "no moved entry for Shake Control, nor for rock.png under it");
});

test("SC-005 (b), live: only the playhead moved (0.6 s to 3.4 s), so nothing is reported", () => {
  const r = check(RIG, load("rig-later"), ROCK);
  assert.deepEqual(learner(r), { moved: [], other: [] });
  assert.equal(r.layers[0].item5.passed, true);
});

test("SC-005 (c), E28, live: a null added above a wiggle renumbers it; the wiggle's new values aren't a change", () => {
  const base = PLANTED;
  const now = load("planted-renumbered");
  const w0 = base.layer_info.find((l) => l.name === "Wiggle");
  const w1 = now.layer_info.find((l) => l.name === "Wiggle");
  assert.deepEqual([w0.index, w1.index], [18, 19]);
  assert.notDeepEqual(w0.samples[0].position, w1.samples[0].position, "the wiggle really moved (T002: it follows the index)");
  const r = check(base, now, lessonOn(base, "Comp Ref", "top-left"));
  assert.deepEqual(r.other_changes, [{ kind: "layer_added", layer: "Null 1" }]);
  assert.deepEqual(r.layers[0].item5.moved_layers, [], "neither Wiggle nor Index Link, whose layer(1) is now the null");
});

test("SC-005 (d), live: a hand edit to Shake Control's base Position is reported as its Position, with the shift", () => {
  const r = check(RIG, load("rig-moved"), ROCK);
  assert.equal(r.other_changes.length, 1);
  const [c] = r.other_changes;
  assert.deepEqual([c.kind, c.layer, c.property], ["value_changed", "Shake Control", "Position"]);
  assert.equal(c.effect.direction, "right");
  assert.ok(Math.abs(c.effect.distance_px - 40) <= 0.5, String(c.effect.distance_px));
  assert.deepEqual(r.layers[0].item5.moved_layers, []);
  assert.equal(r.layers[0].item5.passed, false);
  // Review M1: the "another layer moved" hint has its layer and way.
  assert.deepEqual(r.layers[0].item5.changed_layers.map((c) => [c.layer, c.direction]), [["Shake Control", "right"]]);
});

test("no shared time for a layer: not compared, never moved", () => {
  const now = structuredClone(load("rig-moved"));
  for (const s of now.layer_info.find((l) => l.name === "Sweep Control").samples) s.time += 0.25;
  const r = check(RIG, now, ROCK);
  assert.ok(r.layers[0].item5.not_compared.some((n) => n.layer === "Sweep Control" && n.reason === "no_shared_time"));
  assert.ok(!r.layers[0].item5.moved_layers.some((m) => m.layer === "Sweep Control"));
  assert.ok(!r.other_changes.some((o) => o.layer === "Sweep Control"));
});

test("FR-014: an expression turned off on another layer is an expression change, not a move", () => {
  const now = structuredClone(RIG);
  const x = now.expressions.find((e) => e.path.endsWith("ADBE Rotate Z"));
  x.enabled = false;
  x.active = false;
  const r = check(RIG, now, ROCK);
  assert.deepEqual(r.other_changes.map(({ kind, layer, property, what }) => ({ kind, layer, property, what })), [
    { kind: "expression_changed", layer: "Shake Control", property: "Rotation", what: "turned_off" },
  ]);
  assert.deepEqual(r.layers[0].item5.moved_layers, []);
});
