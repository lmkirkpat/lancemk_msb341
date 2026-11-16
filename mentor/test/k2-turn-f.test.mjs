// Spec 015 T004 (research R6, K2, Edge Case E17): what made the pivot check say "Shake Control moved"
// in AB turn f (discovery/usage-notes/ask-baseline.md). Both reads are derived from the committed
// live capture fixtures/ask/comp1-snapshot.json (AE 27.0), never written by hand: the lesson's read
// at playhead 0.5 (turn f's was 0; rotation and the Shake Control shake are both still at 0 there)
// and the check's read at 3.403 (turn f's was 4.338; the shake has died down at both). Each keeps
// only the samples the snapshot would take at its playhead: the playhead, the check time (0.5) and
// the text layer's key times (2.503 and 2.636, which go up the parent chain to Shake Control).
//
// T004's answer: none of R6's three candidates. Moving the playhead alone gives no change (test 1),
// so the check already compares at shared times only. Turn f's reply is reproduced to the saved
// numbers only when Shake Control's own Anchor Point changed, as Pan Behind on it would change it
// (test 2): AE keeps a layer still at the edit's frame, and the Rotation expression turns it to other
// angles at other times, so the footprint shifts there. The check's report was of a real edit.
//
// Test 3 is SC-005 (a) as amended (spec 015 Amendment 1, T022): the real edit is reported as one
// change, Shake Control's Anchor Point, with the shift it caused attached as its effect, and no
// separate "Shake Control moved" entry (FR-014a). Test 2 keeps proving T004's fit, through the
// effect now instead of the old moved entry.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { check } from "../lib/anchor-check.mjs";

const load = (name) => JSON.parse(fs.readFileSync(new URL(`./fixtures/ask/${name}`, import.meta.url), "utf8"));
const SNAP = load("comp1-snapshot.json");
const TURN_F = load("turn-f-check-reply.json");
const clone = (o) => JSON.parse(JSON.stringify(o));
const r3 = (v) => Math.round(v * 1000) / 1000;

const KEY_TIMES = [2.503, 2.636]; // the text layer's keys, sampled up the chain
function read(playhead, times) {
  const s = clone(SNAP);
  s.comp.time = playhead;
  for (const l of s.layer_info) l.samples = l.samples.filter((x) => times.includes(x.time));
  return s;
}
const BASE = read(0.5, [0.5, ...KEY_TIMES]);
const NOW = read(3.403, [3.403, 0.5, ...KEY_TIMES]);
const ROCK = BASE.layer_info.find((l) => l.name === "rock.png");
const LESSON = { comp_id: 1, baseline: BASE, targets: [`anchor/${ROCK.index}`], skill_options: { focus: [{ layer: "rock.png", place: "top-right" }] }, exclude: [] };

// Pan Behind on Shake Control: anchor += d, base Position += R(rotation at the edit) d.
function panBehindOnShakeControl(snapshot, d, rotationDeg) {
  const out = clone(snapshot);
  const th = (rotationDeg * Math.PI) / 180;
  const off = [Math.cos(th) * d[0] - Math.sin(th) * d[1], Math.sin(th) * d[0] + Math.cos(th) * d[1]];
  for (const s of out.layer_info.find((l) => l.name === "Shake Control").samples) {
    s.anchor = [r3(s.anchor[0] + d[0]), r3(s.anchor[1] + d[1]), s.anchor[2]];
    s.position = [r3(s.position[0] + off[0]), r3(s.position[1] + off[1]), s.position[2]];
  }
  return out;
}

const learnerChanges = (r) => ({ moved: r.layers[0].item5.moved_layers, other: r.other_changes });

test("turn f: the playhead moved and nothing was edited, so nothing is reported (E17; R6 candidates 1 and 2 don't arise)", () => {
  const r = check(BASE, NOW, LESSON);
  assert.equal(r.comp_matches, true);
  assert.deepEqual(learnerChanges(r), { moved: [], other: [] });
  assert.deepEqual(r.layers[0].item5.not_compared, []);
  assert.equal(r.layers[0].item2.distance_px, 0);
});

test("turn f: Pan Behind on Shake Control reproduces the saved reply's numbers, now as the anchor change's effect (T004's cause)", () => {
  const { anchor_delta, rotation_at_edit_deg } = TURN_F.pan_behind_fit;
  const r = check(BASE, panBehindOnShakeControl(NOW, anchor_delta, rotation_at_edit_deg), LESSON);
  const saved = TURN_F.reply;
  const old = saved.layer.item5.moved_layers.find((m) => m.layer === "Shake Control");
  const change = r.other_changes.find((o) => o.layer === "Shake Control");
  assert.deepEqual(change.effect, { distance_px: old.distance_px, direction: old.direction, time: old.time });
  assert.deepEqual(r.layers[0].item5.not_compared, []);
  assert.equal(r.layers[0].item2.passed, true);
  assert.equal(r.layers[0].item2.distance_px, saved.layer.item2.distance_px);
  // Edges match the saved reply to 0.001 px (rounding of the fitted values).
  for (const k of ["left", "top", "right", "bottom"]) {
    assert.ok(Math.abs(r.layers[0].item2.edges_px[k] - saved.layer.item2.edges_px[k]) <= 0.001, k);
  }
});

test("SC-005 (a): turn f's edit is one change, Shake Control's Anchor Point with its shift attached, and no moved entry", () => {
  const { anchor_delta, rotation_at_edit_deg } = TURN_F.pan_behind_fit;
  const r = check(BASE, panBehindOnShakeControl(NOW, anchor_delta, rotation_at_edit_deg), LESSON);
  assert.deepEqual(r.other_changes, [{ kind: "anchor_changed", layer: "Shake Control", effect: { distance_px: 4.087, direction: "up", time: 2.636 } }]);
  assert.deepEqual(r.layers[0].item5.moved_layers, [], "neither Shake Control nor the text under it is a moved entry of its own");
  assert.equal(r.layers[0].item5.passed, false, "a change that visibly shifted a layer still holds the pass");
});
