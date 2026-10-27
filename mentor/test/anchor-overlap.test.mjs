// Spec 011 › Edge cases where concepts overlap (FR-027): one named test per row 1 to 29, asserting
// what the focus and the check see on its fixture. Rows marked contract (10, 24, 26) are asserted
// against layer-info.mjs, comp-space.mjs and snapshot.jsx as built.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyze, candidates, demoRefusal, placeNow } from "../lib/anchor.mjs";
import { check } from "../lib/anchor-check.mjs";
import { compPoint, footprint, sampleAt } from "../lib/comp-space.mjs";
import { byIndex, layerInfo } from "../lib/layer-info.mjs";
import { clone, fixture, indexOf, lessonFor, synthetic } from "./fixtures/anchor/load.mjs";

const SNAPSHOT_JSX = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "jsx", "snapshot.jsx"), "utf8");
const P2 = fixture("practice2b");
const OV = fixture("overlaps");
const cand = (snap, name) => candidates(snap).find((c) => c.layer === name);
const run = (base, cur, focus) => check(base, cur, lessonFor(base, focus));
const layerOf = (r, name) => r.layers.find((l) => l.layer === name);
const entry = (snap, name) => snap.layer_info.find((l) => l.name === name);

test("row 1: an expression on keyed Position isn't a candidate, and the demo refuses it", () => {
  const s = synthetic("row1-expressions");
  assert.deepEqual([cand(s, "Slide").bucket, cand(s, "Slide").reason], ["never", "expression_anchor_position"]);
  assert.equal(demoRefusal(s, entry(s, "Slide")), "expression");
});

// Pan Behind on the live Mentor Overlaps, written by hand (no capture of these in the sitting):
// Still (100 x 100, anchor [50, 50] at [100, 100], unturned, 100%) to its top-left corner, so
// anchor [0, 0] and Position [50, 50]; Leaf 2 (80 x 80, anchor [40, 40], X and Y keyed) to the
// middle of its left edge, every X key and sample moved left by the same 40.
function stillPass() {
  const s = clone(OV);
  for (const sm of entry(s, "Still").samples) { sm.anchor = [0, 0, 0]; sm.position = [50, 50, 0]; }
  Object.assign(entry(s, "Still").transform, { anchor: [0, 0, 0], position: [50, 50, 0] });
  return s;
}
function leaf2Pass() {
  const s = clone(OV);
  const leaf = entry(s, "Leaf 2");
  for (const sm of [...leaf.samples, leaf.transform]) { sm.anchor = [0, 40, 0]; sm.position = [sm.position[0] - 40, sm.position[1], 0]; }
  for (const k of s.layers.find((l) => l.name === "Leaf 2").properties.find((p) => p.path.endsWith("ADBE Position_0")).keys) k.value -= 40;
  return s;
}

test("row 2: an expression on unkeyed Position (Drift) is a candidate, and the check reads its rendered values", () => {
  assert.equal(cand(OV, "Drift").bucket, "default");
  const d = entry(OV, "Drift");
  assert.deepEqual(sampleAt(d, 1).position, [1010, 300, 0], "the rendered Position (after the expression), not the static 960");
  const r = run(OV, stillPass(), [{ layer: "Still", place: "top-left" }]);
  assert.equal(r.passed, true);
  assert.ok(!layerOf(r, "Still").item5.moved_layers.some((m) => m.layer === "Drift"), "compared at the same times, Drift didn't move");
});

test("row 3: an expression on keyed Rotation isn't a candidate (Gauge Dial, Spin)", () => {
  assert.equal(cand(OV, "Gauge Dial").reason, "expression_rotation_scale");
  assert.equal(cand(synthetic("row1-expressions"), "Spin").reason, "expression_rotation_scale");
});

test("row 4: keys on Anchor Point aren't a candidate (Wobble); a key added on the focus fails item 5", () => {
  assert.equal(cand(P2, "Wobble").reason, "anchor_keyed");
  const r = run(P2, fixture("stopwatch"), [{ layer: "Door", place: "middle-left" }]);
  assert.equal(layerOf(r, "Door").item5.anchor_keys_added, true);
  assert.deepEqual(layerOf(r, "Door").hints, ["stopwatch"]);
});

test("row 5: Position keyed is allowed if named; item 4 at every key time; a key added is an other change", () => {
  assert.deepEqual([cand(P2, "Sled").bucket, cand(P2, "Sled").reason], ["if_named", "position_keyed"]);
  const a = analyze(P2, { skill_options: { focus: [{ layer: "Sled", place: "middle-left" }] } });
  assert.ok(a.notes.some((n) => n.note === "position_keyed_tip"));
  // L-2: with the playhead before the keys, Pan Behind adds a Position key there and leaves the rest.
  const slid = run(P2, fixture("sled-slid"), [{ layer: "Sled", place: "middle-left" }]);
  assert.equal(layerOf(slid, "Sled").item4.passed, false);
  assert.ok(slid.other_changes.some((o) => o.kind === "keys_added" && o.layer === "Sled" && o.property === "Position"));
  // The same with one Position key.
  const base = fixture("sled-one-key-before");
  const r = run(base, fixture("sled-one-key"), [{ layer: "Sled", place: "middle-left" }]);
  assert.ok(r.other_changes.some((o) => o.kind === "keys_added" && o.layer === "Sled" && o.property === "Position"));
  assert.equal(layerOf(r, "Sled").item4.passed, false, "it slides at the one old key");
});

test("row 6: hold keys on Position are checked at each key time, not between", () => {
  const base = synthetic("row6-hold-before");
  const focus = [{ layer: "Hopper", place: "middle-left" }];
  const slid = layerOf(run(base, synthetic("row6-hold-slid"), focus), "Hopper");
  assert.equal(slid.item4.passed, false);
  assert.deepEqual(slid.hints, ["slid_at_key"]);
  assert.equal(run(base, synthetic("row6-hold-pass"), focus).passed, true);
});

test("row 7: separated X and Y Position: the footprint comes from bounds, so it checks either way", () => {
  assert.deepEqual([cand(OV, "Leaf 2").bucket, cand(OV, "Leaf 2").reason], ["if_named", "position_keyed"]);
  const r = run(OV, leaf2Pass(), [{ layer: "Leaf 2", place: "middle-left" }]);
  assert.equal(r.passed, true);
  assert.equal(layerOf(r, "Leaf 2").item4.passed, true);
  // Live (L-4): the demo on Tab with Position separated writes X and Y; the read can't tell, and
  // the check passes it as it does the unseparated run.
  const xy = run(P2, fixture("demo-separated-xy"), [{ layer: "Tab", place: "middle-left" }]);
  assert.equal(xy.passed, true);
  assert.deepEqual(layerOf(xy, "Tab").hints, []);
  const tab = (f) => entry(fixture(f), "Tab").transform;
  assert.deepEqual(tab("demo-separated-xy"), tab("demo-separated"));
});

test("row 8: a layer with an effect: a candidate, its footprint from its own rectangle", () => {
  const s = synthetic("row1-expressions");
  const g = cand(s, "Glowy");
  assert.equal(g.bucket, "default");
  const fp = footprint(s, entry(s, "Glowy").index, 0);
  assert.deepEqual(fp.bounds, { left: 1050, top: 250, right: 1150, bottom: 350 });
});

test("row 9: a precomp is a candidate, ranked below, with its frame's size in a note", () => {
  const s = clone(P2);
  entry(s, "Seal").collapse = false;
  const seal = cand(s, "Seal");
  assert.equal(seal.bucket, "default");
  const plain = candidates(s).filter((c) => c.bucket === "default" && c.layer !== "Seal" && !c.flipped);
  for (const c of plain) assert.ok(c.rank < seal.rank, `${c.layer} above Seal`);
  const a = analyze(s, { skill_options: { focus: [{ layer: "Seal", place: "center" }, { layer: "Door", place: "middle-left" }] } });
  assert.deepEqual(a.notes.find((n) => n.note === "precomp_frame"), { layer: "Seal", note: "precomp_frame", width: 400, height: 400 });
});

test("row 10 (contract): a precomp with Collapse Transformations on isn't a candidate; snapshot.jsx reads the switch", () => {
  assert.equal(cand(P2, "Seal").reason, "collapsed");
  assert.match(SNAPSHOT_JSX, /collapse: rd\(function \(\) \{ return L\.collapseTransformation === true; \}\)/);
  assert.equal(demoRefusal(P2, entry(P2, "Seal")), "collapsed");
});

test("row 11: a layer hidden by the learner is allowed if named, never the demo", () => {
  const s = clone(P2);
  entry(s, "Tab").enabled = false;
  assert.deepEqual([cand(s, "Tab").bucket, cand(s, "Tab").reason], ["if_named", "hidden"]);
  const a = analyze(s, { skill_options: { focus: [{ layer: "Door", place: "middle-left" }, { layer: "Tab", place: "middle-left" }] } });
  assert.equal(a.demo_target, `anchor/${indexOf(s, "Door")}`, "the demo moves to the other layer");
});

test("row 12: a matte with its eye off is allowed if named, never hidden, never the demo; its eye left on is an other change", () => {
  assert.deepEqual([cand(P2, "Reveal Matte").bucket, cand(P2, "Reveal Matte").reason], ["if_named", "matte"]);
  const a = analyze(P2, { skill_options: { focus: [{ layer: "Door", place: "middle-left" }, { layer: "Reveal Matte", place: "middle-left" }] } });
  assert.equal(a.demo_target, `anchor/${indexOf(P2, "Door")}`);
  assert.ok(a.notes.some((n) => n.layer === "Reveal Matte" && n.note === "matte"));
  const r = run(P2, fixture("matte-eye-on"), [{ layer: "Door", place: "middle-left" }]);
  assert.ok(r.other_changes.some((o) => o.kind === "eye_changed" && o.layer === "Reveal Matte" && o.was_class === "matte"));
});

test("row 13: a guide is allowed if named; a shy layer is a candidate, ranked below", () => {
  assert.deepEqual([cand(OV, "Guide Grid").bucket, cand(OV, "Guide Grid").reason], ["if_named", "guide"]);
  const s = synthetic("row16-before");
  assert.equal(cand(s, "Quiet").bucket, "default");
  assert.ok(cand(s, "Quiet").rank > cand(s, "Loud").rank);
});

test("row 14: nulls, cameras, lights and adjustment layers are never candidates", () => {
  assert.equal(cand(P2, "Hatch Rig").reason, "null");
  assert.equal(cand(OV, "Rig").reason, "null");
  for (const kind of ["camera", "light", "adjustment"]) {
    const s = clone(P2);
    entry(s, "Peg").kind = kind;
    assert.deepEqual([cand(s, "Peg").bucket, cand(s, "Peg").reason], ["never", kind]);
  }
});

test("row 15: a parented layer is a candidate, ranked below, its parent named once; the comp-space footprint includes the parent", () => {
  const h = cand(P2, "Hatch");
  assert.equal(h.bucket, "default");
  assert.equal(h.parent, "Hatch Rig");
  const fp = footprint(P2, entry(P2, "Hatch").index, 0);
  assert.deepEqual(fp.bounds, { left: 565, top: 920, right: 715, bottom: 1000 }, "through Hatch Rig");
  const r = run(P2, fixture("demo-parented"), [{ layer: "Hatch", place: "middle-left" }]);
  assert.equal(r.passed, true);
  const a = analyze(P2, { skill_options: { focus: [{ layer: "Hatch", place: "middle-left" }] } });
  assert.equal(a.notes.filter((n) => n.note === "parent").length, 1);
});

test("row 16: a focus layer's children are compared only at its check time", () => {
  const r = run(synthetic("row16-before"), synthetic("row16-pass"), [{ layer: "Arm", place: "middle-left" }]);
  assert.equal(r.passed, true);
  assert.deepEqual(layerOf(r, "Arm").item5.moved_layers, []);
  // Hatch Rig as named focus (a null) isn't a target at all.
  const a = analyze(P2, { skill_options: { focus: [{ layer: "Hatch Rig", place: "center" }] } });
  assert.deepEqual(a.targets, []);
  assert.deepEqual(a.focus_problems, [{ layer: "Hatch Rig", problem: "not_a_candidate", reason: "null" }]);
  // Hatch Rig's pivot moved with nothing moving (live: [0, 0] to [50, 50]; Hatch's own Position is
  // [0, 0] under it): Hatch, its child, didn't move.
  assert.deepEqual([entry(P2, "Hatch Rig").transform.anchor, entry(P2, "Hatch").transform.position], [[0, 0, 0], [0, 0, 0]]);
  assert.deepEqual(entry(fixture("hatch-rig-focus"), "Hatch Rig").transform.anchor, [50, 50, 0]);
  const h = run(P2, fixture("hatch-rig-focus"), [{ layer: "Door", place: "center" }, { layer: "Tab", place: "middle-left" }]);
  assert.ok(!layerOf(h, "Tab").item5.moved_layers.some((m) => m.layer === "Hatch"));
  assert.deepEqual(h.other_changes, [{ kind: "anchor_changed", layer: "Hatch Rig" }]);
});

test("row 17: Scale 200% measures the place in the layer's own space (Plaque)", () => {
  const r = run(P2, fixture("plaque-pass"), [{ layer: "Plaque", place: "middle-left" }]);
  assert.equal(r.passed, true);
  assert.equal(layerOf(r, "Plaque").item1.place_now, "middle-left");
});

test("row 18: a flipped layer ranks last and goes by its own sides", () => {
  const ranks = candidates(P2).filter((c) => c.rank).map((c) => c.rank);
  assert.equal(cand(P2, "Flip").rank, Math.max(...ranks));
  const a = analyze(P2, { skill_options: { focus: [{ layer: "Flip", place: "middle-left" }] } });
  assert.ok(a.notes.some((n) => n.note === "flipped"));
  const flip = entry(P2, "Flip");
  const ownLeft = compPoint(P2, flip.index, a.places.Flip.point, 0).point;
  assert.ok(ownLeft[0] > flip.transform.position[0], "its own left edge is on the right of the screen");
});

test("row 19: Rotation keyed: the rest key is named and the check is at it", () => {
  assert.deepEqual(cand(P2, "Gauge").check_time, { time: 3.167, basis: "both" });
  const focus = [{ layer: "Gauge", place: "bottom-middle" }];
  assert.equal(run(P2, fixture("gauge-at-rest"), focus).passed, true);
  const away = layerOf(run(P2, fixture("gauge-away"), focus), "Gauge");
  assert.deepEqual(away.hints, ["away_from_rest"]);
  assert.equal(away.item3.at_rest, false);
});

test("row 20: Scale keyed from 0: the rest key is the full-size key; a pivot set at Scale 0 fails", () => {
  assert.deepEqual(cand(P2, "Pop").check_time, { time: 4.3, basis: "both" });
  const focus = [{ layer: "Pop", place: "bottom-middle" }];
  // Live (L-4): AE set the anchor at Scale 0 to Pop's Position read as a layer point, far outside
  // Pop; nothing shows at 3.3 s. Graded as set away from rest, one hint.
  const shrunk = layerOf(run(P2, fixture("pop-shrunk"), focus), "Pop");
  assert.deepEqual(entry(fixture("pop-shrunk"), "Pop").transform.anchor, [120, 960, 0]);
  assert.equal(shrunk.item3.set_away_from_rest, true);
  assert.equal(shrunk.item1.place_now, "outside");
  assert.deepEqual(shrunk.hints, ["away_from_rest"]);
  assert.equal(run(P2, fixture("pop-pass"), focus).passed, true);
});

test("row 21: text: a candidate whose pivot starts on its baseline; its rectangle is the letters' box at the check time", () => {
  assert.equal(cand(P2, "Sign").bucket, "default");
  assert.equal(cand(P2, "Sign").place_now, "between");
  const a = analyze(P2, { skill_options: { focus: [{ layer: "Sign", place: "center" }] } });
  assert.deepEqual(a.already_there, []);
  assert.ok(a.notes.some((n) => n.note === "text_baseline"));
  const left = sampleAt(entry(fixture("sign-left"), "Sign"), 0);
  assert.equal(left.rect.left, 2.455, "live (L-5): the letters start just right of the pivot, not on it");
  assert.equal(placeNow(left.anchor, left.rect), "between", "left-justified: its pivot on the left of the baseline");
});

test("row 22: a shape is a default candidate since L-1; a group's anchor moved shows no change at all (L-1)", () => {
  assert.deepEqual([cand(P2, "Lid").bucket, cand(P2, "Lid").reason], ["default", null]);
  const group = fixture("lid-group");
  for (const k of ["layer_info", "layers", "comp"]) assert.deepEqual(group[k], P2[k], `lid-group's ${k} is the base's`);
  const r = layerOf(run(P2, group, [{ layer: "Lid", place: "middle-left" }]), "Lid");
  assert.equal(r.rect_shifted, false);
  assert.equal(r.anchor_changed, false);
  assert.deepEqual(r.hints, ["outside"], "Lid's own pivot, still outside it; the group hint can't fire (for the spec writer)");
});

test("row 23: a shape whose pivot sits outside it reads outside the layer", () => {
  assert.equal(cand(P2, "Lid").place_now, "outside");
  const a = analyze(P2, { skill_options: { focus: [{ layer: "Lid", place: "middle-left" }] } });
  assert.ok(a.notes.some((n) => n.note === "pivot_outside"));
  assert.equal(run(P2, fixture("lid-pan"), [{ layer: "Lid", place: "middle-left" }]).passed, true);
});

test("row 24 (contract): a 3D layer isn't a candidate; comp-space returns three_d; snapshot.jsx reads the switch", () => {
  assert.equal(cand(OV, "Depth").reason, "three_d");
  assert.equal(footprint(OV, entry(OV, "Depth").index, 1).reason, "three_d");
  assert.match(SNAPSHOT_JSX, /three_d: rd\(function \(\) \{ return !!L\.threeDLayer; \}\)/);
});

test("row 25: Pan Behind on the wrong layer: the focus unchanged, another layer's anchor changed, item 5 holds", () => {
  const r = run(P2, fixture("wrong-layer"), [{ layer: "Needle", place: "bottom-middle" }]);
  const n = layerOf(r, "Needle");
  assert.equal(n.item1.passed, false);
  assert.equal(n.item5.passed, true);
  assert.deepEqual(r.other_changes, [{ kind: "anchor_changed", layer: "Background" }]);
  assert.deepEqual(n.hints, ["wrong_layer"]);
});

test("row 26 (contract): the playhead moved between reads: compared at the check time from samples", () => {
  const r = run(synthetic("edge-before"), synthetic("row26-moved-playhead"), [{ layer: "Door", place: "middle-left" }]);
  assert.equal(r.passed, true);
  assert.equal(layerOf(r, "Door").check_time, 0);
  assert.match(SNAPSHOT_JSX, /comp\.time and the caller's times first, so a cap never drops them/);
});

test("row 27: a time not sampled, or a layer with no rectangle, is can't check", () => {
  const base = synthetic("edge-before");
  const focus = [{ layer: "Door", place: "middle-left" }];
  for (const file of ["row27-not-sampled", "row27-no-rect"]) {
    const r = run(base, synthetic(file), focus);
    assert.deepEqual(layerOf(r, "Door").hints, ["cant_check"], file);
    assert.equal(r.passed, false, file);
  }
});

test("row 28: a locked layer is allowed if named, never proposed or the demo; the demo refuses; still locked at done names the lock", () => {
  assert.deepEqual([cand(OV, "Locked Bar").bucket, cand(OV, "Locked Bar").reason], ["if_named", "locked"]);
  assert.equal(demoRefusal(OV, entry(OV, "Locked Bar")), "locked");
  const a = analyze(OV, { skill_options: { focus: [{ layer: "Still", place: "top-left" }, { layer: "Locked Bar", place: "middle-left" }] } });
  assert.equal(a.demo_target, `anchor/${indexOf(OV, "Still")}`);
  assert.ok(a.notes.some((n) => n.layer === "Locked Bar" && n.note === "locked"));
  const r = layerOf(run(P2, fixture("door-locked"), [{ layer: "Door", place: "middle-left" }]), "Door");
  assert.equal(r.locked, true);
  assert.deepEqual(r.hints, ["locked"]);
});

test("row 29: Auto-Orient on: comp-space returns auto_orient, so it isn't a candidate and a focus can't be checked", () => {
  assert.equal(footprint(OV, entry(OV, "Orbit").index, 1).reason, "auto_orient");
  assert.deepEqual([cand(OV, "Orbit").bucket, cand(OV, "Orbit").reason], ["never", "cant_read"]);
  const cur = clone(OV);
  entry(cur, "Still").auto_orient = true;
  const r = run(OV, cur, [{ layer: "Still", place: "top-left" }]);
  assert.ok(layerOf(r, "Still").cant_check.some((c) => c.reason === "auto_orient"));
  assert.equal(r.passed, false);
});

test("every overlap fixture is a known layer_info snapshot (no row rests on a pre-wave-B read)", () => {
  for (const s of [P2, OV, synthetic("row1-expressions"), synthetic("row6-hold-before"), synthetic("row16-before")]) {
    assert.equal(layerInfo(s).known, true);
    assert.ok(byIndex(s, 1));
  }
});
