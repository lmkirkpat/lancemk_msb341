// Spec 015 T024 (K2: FR-012 to FR-014a, SC-005 (a) to (d), E28) through the null check, on T015's
// live captures (AE 27.0). 015 Planted's "Null 1" is the learner's new null: adding it renumbered
// every layer below, Wiggle from 18 to 19, which moves a wiggle with no edit (T002).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { check, p2For } from "../lib/null-parenting-check.mjs";
import { FIXTURES } from "./helpers.mjs";

const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", `${name}.json`), "utf8"));
const RIG = load("rig");
const PLANTED = load("planted");
const RENUMBERED = load("planted-renumbered");
// The other-changes list doesn't depend on the group being a valid lesson, so the lesson is built
// directly (015 Rig has no group of 2 to 4 free layers).
const lessonOn = (baseline, focus) => ({ comp_id: baseline.comp.id, skill: "parenting.null", mode: "lesson", baseline, focus, targets: [], demo_target: null, demo: null, skill_data: {}, exclude: [] });
const othersFor = (base, now, focus) => check(base, now, lessonOn(base, focus), {}).result.other_changes;
const about = (list, layer) => list.filter((o) => o.layer === layer);

test("SC-005 (a), live: Pan Behind's values on Shake Control are one change, its Anchor Point (Position folded in)", () => {
  const list = about(othersFor(RIG, load("rig-panned"), ["White Solid 1"]), "Shake Control");
  assert.equal(list.length, 1);
  assert.deepEqual([list[0].kind, list[0].properties], ["value_changed", ["Anchor Point"]]);
  assert.equal(list[0].effect, undefined, "still at the before-read time (0.601 s), so no visible shift there");
});

test("SC-005 (b), live: only the playhead moved, so nothing is reported, and a child of the moving parent doesn't jump", () => {
  const later = load("rig-later");
  assert.deepEqual(othersFor(RIG, later, ["White Solid 1"]), []);
  const p2 = p2For(RIG, later, "rock.png", { times: [0.6, 2.636] });
  assert.deepEqual([p2.passed, p2.worst_px, p2.not_checked], [true, 0, []]);
});

test("SC-005 (c), E28, live: the learner's new null renumbers a wiggle below it; no change on that layer", () => {
  const list = othersFor(PLANTED, RENUMBERED, ["Comp Ref", "Over Keys"]);
  for (const layer of ["Wiggle", "Index Link", "Offset Link", "Err Transform", "Err Effect"]) assert.deepEqual(about(list, layer), [], layer);
  assert.deepEqual(list, [], "Null 1 is the lesson's null, never an other change");
});

test("E28 in the jump check, live: a wiggling focus layer renumbered by the new null doesn't jump", () => {
  const p2 = p2For(PLANTED, RENUMBERED, "Wiggle", { times: [0.6, 1.5] });
  assert.deepEqual([p2.passed, p2.worst_px], [true, 0]);
  const w0 = PLANTED.layer_info.find((l) => l.name === "Wiggle").samples[0].position;
  const w1 = RENUMBERED.layer_info.find((l) => l.name === "Wiggle").samples[0].position;
  assert.ok(Math.hypot(w1[0] - w0[0], w1[1] - w0[1]) > 10, "the values after the wiggle really moved");
});

test("SC-005 (d), live: a hand edit to Shake Control's base Position is its Position, with the 40 px shift", () => {
  const list = about(othersFor(RIG, load("rig-moved"), ["White Solid 1"]), "Shake Control");
  assert.equal(list.length, 1);
  assert.deepEqual([list[0].kind, list[0].properties, list[0].effect.distance_px, list[0].effect.direction], ["value_changed", ["Position"], 40, "right"]);
});

test("FR-014: an expression turned off is expression_changed (was expression_toggled), never a move", () => {
  const now = structuredClone(RIG);
  Object.assign(now.expressions.find((e) => e.path.endsWith("ADBE Rotate Z")), { enabled: false, active: false });
  const list = othersFor(RIG, now, ["White Solid 1"]);
  assert.deepEqual(list.map(({ kind, layer, property, what }) => ({ kind, layer, property, what })), [
    { kind: "expression_changed", layer: "Shake Control", property: "Rotation", what: "turned_off" },
  ]);
});

test("review S7: a change on a layer whose footprint can't be read carries an unknown effect with the reason, never none", () => {
  const now = structuredClone(load("rig-moved"));
  const before = structuredClone(RIG);
  for (const snap of [before, now]) for (const s of snap.layer_info.find((l) => l.name === "Shake Control").samples) s.rect = null;
  const list = about(othersFor(before, now, ["White Solid 1"]), "Shake Control");
  assert.deepEqual(list.map((o) => [o.kind, o.properties, o.effect]), [["value_changed", ["Position"], { distance_px: null, direction: null, time: 0.601, reason: "no_rect" }]]);
});
