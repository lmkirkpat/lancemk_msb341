// Spec 011 FR-003 to FR-009 (research R1, R5): candidates from layer_info with their buckets,
// reasons and ranks; the focus, targets and demo target; the finder; the samples the lesson needs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, candidates, finder, neededTimes, SHAPES_DEFAULT, MAX_NEEDED_TIMES } from "../lib/anchor.mjs";
import { clone, fixture, indexOf, KEY, synthetic } from "./fixtures/anchor/load.mjs";

const P2 = fixture("practice2b");
const OV = fixture("overlaps");
const byLayer = (list) => Object.fromEntries(list.map((c) => [c.layer, c]));

test("on Mentor Practice 2, every layer's bucket, reason, rank and place now are the answer key's", () => {
  const got = byLayer(candidates(P2));
  for (const [name, want] of Object.entries(KEY.practice2b.layers)) {
    const c = got[name];
    assert.ok(c, `${name} is a candidate entry`);
    assert.equal(c.bucket, want.bucket, `${name} bucket`);
    assert.equal(c.reason, want.reason, `${name} reason`);
    assert.equal(c.rank, want.rank, `${name} rank`);
    if (want.place_now !== undefined) assert.equal(c.place_now, want.place_now, `${name} place now`);
    if (want.check_time) assert.deepEqual(c.check_time, want.check_time, `${name} check time`);
  }
  assert.equal(Object.keys(got).length, P2.layer_info.length, "one entry per layer of layer_info");
});

test("candidates come from layer_info: Door and Tab have no keys at all and are candidates (filter 2)", () => {
  const keyed = new Set(P2.layers.map((l) => l.name));
  assert.ok(!keyed.has("Door") && !keyed.has("Tab"));
  const got = byLayer(candidates(P2));
  assert.equal(got.Door.bucket, "default");
  assert.equal(got.Tab.bucket, "default");
});

test("on Mentor Overlaps, the rows this skill reads land as the answer key says", () => {
  const got = byLayer(candidates(OV));
  for (const [name, want] of Object.entries(KEY.overlaps.layers)) {
    assert.equal(got[name].bucket, want.bucket, `${name} bucket`);
    assert.equal(got[name].reason, want.reason, `${name} reason`);
    if (want.rank !== undefined) assert.equal(got[name].rank, want.rank, `${name} rank`);
  }
});

test("shapes are default candidates since L-1 (SHAPES_DEFAULT true): Lid and Banner, and no shape_until_l1 left", () => {
  assert.equal(SHAPES_DEFAULT, true);
  const got = byLayer(candidates(P2));
  for (const n of ["Lid", "Banner", "Blink", "Cut"]) assert.deepEqual([got[n].bucket, got[n].reason], ["default", null], n);
  assert.ok(!Object.values(got).some((c) => c.reason === "shape_until_l1"));
  // A keyed shape still lands by its keys: Dot 1 has Position keys.
  assert.deepEqual([got["Dot 1"].bucket, got["Dot 1"].reason], ["if_named", "position_keyed"]);
});

test("a matte is if_named with reason matte, never hidden, though its eye is off (filter 3)", () => {
  const got = byLayer(candidates(P2));
  assert.equal(P2.layer_info.find((l) => l.name === "Reveal Matte").enabled, false);
  assert.deepEqual([got["Reveal Matte"].bucket, got["Reveal Matte"].reason], ["if_named", "matte"]);
  assert.equal(byLayer(candidates(OV)).Wipe.reason, "matte");
});

test("Locked Bar is if_named with locked; Wobble, Seal, Depth, nulls and adjustment layers are never", () => {
  const ov = byLayer(candidates(OV));
  assert.deepEqual([ov["Locked Bar"].bucket, ov["Locked Bar"].reason], ["if_named", "locked"]);
  assert.equal(ov.Depth.reason, "three_d");
  const p2 = byLayer(candidates(P2));
  assert.equal(p2.Wobble.reason, "anchor_keyed");
  assert.equal(p2.Seal.reason, "collapsed");
  assert.equal(p2["Hatch Rig"].reason, "null");
  const adj = clone(P2);
  adj.layer_info.find((l) => l.name === "Tab").kind = "adjustment";
  assert.deepEqual([byLayer(candidates(adj)).Tab.bucket, byLayer(candidates(adj)).Tab.reason], ["never", "adjustment"]);
  for (const kind of ["camera", "light"]) {
    const s = clone(P2);
    s.layer_info.find((l) => l.name === "Tab").kind = kind;
    assert.equal(byLayer(candidates(s)).Tab.reason, kind);
  }
});

test("Hatch ranks below the unparented ones and gets the parent note", () => {
  const got = byLayer(candidates(P2));
  const unparented = Object.values(got).filter((c) => c.bucket === "default" && !c.parent && !c.keyed.rotation && !c.keyed.scale && !c.flipped);
  for (const c of unparented) assert.ok(c.rank < got.Hatch.rank, `${c.layer} above Hatch`);
  const a = analyze(P2, { skill_options: { focus: [{ layer: "Hatch", place: "middle-left" }] } });
  assert.deepEqual(a.notes.find((n) => n.note === "parent"), { layer: "Hatch", note: "parent", parent: "Hatch Rig" });
});

test("a full-frame solid: if_named with full_frame when the comp's size is known; null without, and it still ranks last", () => {
  assert.equal(byLayer(candidates(P2)).Background.full_frame, true);
  // A read from before spec 004 T165: the live base without the comp's size.
  const noSize = clone(P2);
  delete noSize.comp.width;
  delete noSize.comp.height;
  const got = byLayer(candidates(noSize));
  assert.equal(got.Background.full_frame, null, "unknown, never a default size");
  assert.equal(got.Background.bucket, "default");
  const ranks = Object.values(got).filter((c) => c.rank).map((c) => c.rank);
  assert.equal(got.Background.rank, Math.max(...ranks), "ranked last");
});

test("D-3: an anchor at its rectangle's centre or at [0, 0] ranks the same", () => {
  const s = clone(P2);
  const tab = s.layer_info.find((l) => l.name === "Tab");
  for (const sm of tab.samples) sm.anchor = [0, 0, 0];
  const got = byLayer(candidates(s));
  assert.equal(got.Tab.pivot_as_placed, true);
  assert.equal(got.Tab.rank, byLayer(candidates(P2)).Tab.rank);
  for (const sm of tab.samples) sm.anchor = [30, 10, 0];
  assert.equal(byLayer(candidates(s)).Tab.pivot_as_placed, false);
  assert.ok(byLayer(candidates(s)).Tab.rank > byLayer(candidates(P2)).Tab.rank, "a moved pivot ranks lower");
});

test("a zero-area footprint at the check time is never, with cant_read", () => {
  const s = clone(P2);
  for (const sm of s.layer_info.find((l) => l.name === "Tab").samples) sm.scale = [100, 0, 100];
  assert.deepEqual([byLayer(candidates(s)).Tab.bucket, byLayer(candidates(s)).Tab.reason], ["never", "cant_read"]);
});

test("skill_options.focus gives targets anchor/<index> and one target_refs entry each", () => {
  const a = analyze(P2, { skill_options: { focus: [{ layer: "Door", place: "middle-left" }, { layer: "Needle", place: "bottom-middle" }] } });
  assert.deepEqual(a.targets, [`anchor/${indexOf(P2, "Door")}`, `anchor/${indexOf(P2, "Needle")}`]);
  assert.deepEqual(a.target_refs, [{ layer: "Door", property: "Anchor Point" }, { layer: "Needle", property: "Anchor Point" }]);
  assert.deepEqual(a.places.Door, { place: "middle-left", point: [0, 250] });
  assert.deepEqual(a.check_times.Door, { time: 0, basis: "current" });
});

test("Sign with center isn't already there (its pivot is on the baseline); a layer at its named place is (FR-007)", () => {
  const sign = analyze(P2, { skill_options: { focus: [{ layer: "Sign", place: "center" }] } });
  assert.deepEqual(sign.targets, [`anchor/${indexOf(P2, "Sign")}`]);
  assert.deepEqual(sign.already_there, []);
  assert.ok(sign.notes.some((n) => n.layer === "Sign" && n.note === "text_baseline"));
  const door = analyze(P2, { skill_options: { focus: [{ layer: "Door", place: "center" }] } });
  assert.deepEqual(door.targets, []);
  assert.deepEqual(door.already_there, [{ layer: "Door", place: "center" }]);
});

test("a duplicate name gives name_not_unique and no target", () => {
  const dup = synthetic("dup-before");
  const a = analyze(dup, { skill_options: { focus: [{ layer: "Card", place: "middle-left" }] } });
  assert.deepEqual(a.targets, []);
  assert.deepEqual(a.focus_problems, [{ layer: "Card", problem: "name_not_unique" }]);
});

test("a name that isn't in the comp throws UNKNOWN_LAYER; a never layer named is not a target, with its reason", () => {
  assert.throws(() => analyze(P2, { skill_options: { focus: [{ layer: "Nope", place: "center" }] } }), { code: "UNKNOWN_LAYER" });
  assert.throws(() => analyze(P2, { focus_layers: ["Nope"] }), { code: "UNKNOWN_LAYER" });
  const a = analyze(P2, { skill_options: { focus: [{ layer: "Wobble", place: "middle-left" }] } });
  assert.deepEqual(a.targets, []);
  assert.deepEqual(a.focus_problems, [{ layer: "Wobble", problem: "not_a_candidate", reason: "anchor_keyed" }]);
});

test("demo target: entry 1 when it's default, else entry 0, else not_a_default_candidate", () => {
  for (const [name, want] of Object.entries(KEY.two_focus_demos)) {
    const a = analyze(P2, { skill_options: { focus: want.focus } });
    const layer = want.demo_target_layer;
    assert.equal(a.demo_target, layer ? `anchor/${indexOf(P2, layer)}` : null, name);
    if (want.no_demo_reason) assert.equal(a.no_demo_reason, want.no_demo_reason, name);
  }
});

test("no focus: the proposal is the answer key's (Blink, tall, so from its bottom edge), and the demo waits for a focus", () => {
  const a = analyze(P2);
  assert.deepEqual(a.proposal, KEY.practice2b.proposal);
  assert.deepEqual(a.targets, []);
  assert.equal(a.no_demo_reason, "awaiting_focus");
  assert.deepEqual(analyze(P2, { focus_layers: ["Needle"] }).proposal, { layer: "Needle", suggested_place: "bottom-middle" }, "tall and thin turns from its bottom");
});

test("FINDERS' count is above 0 exactly when a default candidate not in exclude exists, and 0 without layer_info", async () => {
  const { FINDERS } = await import("../tools/transform-anchor.mjs");
  const f = FINDERS["transform.anchor"];
  for (const snap of [P2, OV, synthetic("measures"), synthetic("row16-before"), synthetic("cap70-before")]) {
    const defaults = candidates(snap).filter((c) => c.bucket === "default").map((c) => c.layer);
    assert.equal(f.focus(snap).count, defaults.length);
    assert.equal(f.focus(snap).count > 0, analyze(snap).proposal !== null);
    const all = defaults.map((layer) => ({ layer, property: "Anchor Point" }));
    assert.equal(f.focus(snap, { exclude: all }).count, 0);
  }
  const noInfo = clone(P2);
  delete noInfo.layer_info;
  assert.deepEqual(f.focus(noInfo), { count: 0, layers: [] });
  assert.deepEqual(finder(P2, { exclude: [{ layer: "Door", property: "Position" }] }).count, finder(P2).count, "only Anchor Point targets exclude");
});

test("neededTimes lists every candidate's rest-key and Position key times, at most 63", () => {
  assert.deepEqual(neededTimes(P2), KEY.times.needed_practice2b);
  const many = clone(P2);
  const sled = many.layers.find((l) => l.name === "Sled").properties[0];
  sled.keys = Array.from({ length: 80 }, (_, i) => ({ ...sled.keys[0], index: i + 1, time: Math.round((0.1 + i * 0.05) * 1000) / 1000 }));
  assert.equal(neededTimes(many).length, MAX_NEEDED_TIMES);
});
