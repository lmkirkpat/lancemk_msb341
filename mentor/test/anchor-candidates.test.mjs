// Spec 011 FR-003 to FR-009 (research R1, R5): candidates from layer_info with their buckets,
// reasons and ranks; the focus, targets and demo target; the finder; the samples the lesson needs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, candidates, finder, neededTimes, outsideSide, positionRule, reviewProposal, SHAPES_DEFAULT, MAX_NEEDED_TIMES } from "../lib/anchor.mjs";
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
    if (want.position_times) assert.deepEqual(c.keyed.position_times, want.position_times, `${name} Position key times`);
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
    if (want.position_times) assert.deepEqual(got[name].keyed.position_times, want.position_times, `${name} Position key times`);
  }
});

test("shapes are default candidates since L-1 (SHAPES_DEFAULT true): Lid and Banner, and no shape_until_l1 left", () => {
  assert.equal(SHAPES_DEFAULT, true);
  const got = byLayer(candidates(P2));
  for (const n of ["Lid", "Banner", "Blink", "Cut"]) assert.deepEqual([got[n].bucket, got[n].reason], ["default", null], n);
  assert.ok(!Object.values(got).some((c) => c.reason === "shape_until_l1"));
  // A keyed shape still lands by its keys: Dot 1 has Position keys at three times (D-4).
  assert.deepEqual([got["Dot 1"].bucket, got["Dot 1"].reason], ["never", "position_moves"]);
});

test("a matte is if_named with reason matte, never hidden, though its eye is off (filter 3)", () => {
  const got = byLayer(candidates(P2));
  assert.equal(P2.layer_info.find((l) => l.name === "Reveal Matte").enabled, false);
  assert.deepEqual([got["Reveal Matte"].bucket, got["Reveal Matte"].reason], ["if_named", "matte"]);
  // Never outranks allowed-if-named (D-4): Wipe is a matte whose Position is keyed at two times.
  assert.equal(OV.layer_info.find((l) => l.name === "Wipe").enabled, false);
  assert.deepEqual([byLayer(candidates(OV)).Wipe.bucket, byLayer(candidates(OV)).Wipe.reason], ["never", "position_moves"]);
});

test("a locked layer is if_named with locked (door-locked's Door); Wobble, Seal, Depth, nulls and adjustment layers are never", () => {
  const locked = byLayer(candidates(fixture("door-locked")));
  assert.deepEqual([locked.Door.bucket, locked.Door.reason], ["if_named", "locked"]);
  // Locked Bar is locked too, but its Position keys at 3 and 4 put it in never first (D-4).
  const ov = byLayer(candidates(OV));
  assert.deepEqual([ov["Locked Bar"].bucket, ov["Locked Bar"].reason], ["never", "position_moves"]);
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
    if (want.focus_problem) assert.deepEqual(a.focus_problems, [want.focus_problem], name);
  }
});

// ---- D-4 (T245, T246): counting Position key times. Built on the live one-key capture, where Sled
// has one Position key, at 3.667, no Rotation or Scale keys, and samples at every --times time.

const ONE = fixture("sled-one-key-before");
const POS = "ADBE Transform Group/ADBE Position";
const key = (time, value, hold = false) => ({ index: 1, time, value, ...(hold ? { in_type: "hold", out_type: "hold" } : {}) });
function sledWith(props) {
  const s = clone(ONE);
  s.layers.find((l) => l.name === "Sled").properties = props.map((p) => ({ expression_enabled: false, ...p }));
  return s;
}
const sledOf = (s, opts) => candidates(s, opts).find((c) => c.layer === "Sled");

test("D-4 base: the live one-key Sled is if_named with position_keyed, and its tip carries the key's time", () => {
  const want = KEY.attempts["sled-one-key"];
  const c = sledOf(ONE);
  assert.deepEqual([c.bucket, c.reason], [want.bucket, want.reason]);
  assert.deepEqual(c.keyed.position_times, [want.tip_time]);
  const a = analyze(ONE, { skill_options: { focus: want.focus } });
  assert.deepEqual(a.targets, [`anchor/${indexOf(ONE, "Sled")}`]);
  assert.deepEqual(a.notes.filter((n) => n.note === "position_keyed_tip"), [{ layer: "Sled", note: "position_keyed_tip", time: want.tip_time }]);
});

test("D-4: separated X keyed at 1 s and Y at 2 s is two times (position_moves); both at 1 s is one", () => {
  const two = sledWith([{ path: `${POS}_0`, keys: [key(1, 320)] }, { path: `${POS}_1`, keys: [key(2, 960)] }]);
  assert.deepEqual(sledOf(two).keyed.position_times, [1, 2]);
  assert.deepEqual([sledOf(two).bucket, sledOf(two).reason], ["never", "position_moves"]);
  const one = sledWith([{ path: `${POS}_0`, keys: [key(1, 320)] }, { path: `${POS}_1`, keys: [key(1, 960)] }]);
  assert.deepEqual(sledOf(one).keyed.position_times, [1]);
  assert.deepEqual([sledOf(one).bucket, sledOf(one).reason], ["if_named", "position_keyed"]);
  // Within half a frame (1/60 s at 30 fps) is one time; a whole frame apart is two.
  const near = sledWith([{ path: `${POS}_0`, keys: [key(1, 320)] }, { path: `${POS}_1`, keys: [key(1.01, 960)] }]);
  assert.deepEqual(sledOf(near).keyed.position_times, [1]);
  const frame = sledWith([{ path: `${POS}_0`, keys: [key(1, 320)] }, { path: `${POS}_1`, keys: [key(1.033, 960)] }]);
  assert.equal(sledOf(frame).reason, "position_moves");
});

test("D-4: hold keys count like any key: two hold times are position_moves, one is position_keyed", () => {
  const two = sledWith([{ path: POS, keys: [key(3.667, [320, 960, 0], true), { ...key(4.167, [420, 960, 0], true), index: 2 }] }]);
  assert.deepEqual([sledOf(two).bucket, sledOf(two).reason], ["never", "position_moves"]);
  const one = sledWith([{ path: POS, keys: [key(3.667, [320, 960, 0], true)] }]);
  assert.deepEqual([sledOf(one).bucket, sledOf(one).reason], ["if_named", "position_keyed"]);
});

test("D-4: one Position key with Scale's rest key on another frame is position_moves; on the same frame (or within half a frame) it's allowed", () => {
  const pos = { path: POS, keys: [key(3.667, [320, 960, 0])] };
  const scale = (restTime) => ({ path: "ADBE Transform Group/ADBE Scale", keys: [key(3, [50, 50, 100]), { ...key(restTime, [100, 100, 100]), index: 2 }] });
  const off = sledWith([pos, scale(4.167)]);
  assert.deepEqual([sledOf(off).bucket, sledOf(off).reason], ["never", "position_moves"]);
  assert.ok(!neededTimes(off).includes(3.667), "a never layer adds no needed time");
  const on = sledWith([pos, scale(3.667)]);
  assert.deepEqual([sledOf(on).bucket, sledOf(on).reason], ["if_named", "position_keyed"]);
  assert.deepEqual(sledOf(on).check_time, { time: 3.667, basis: "both" });
  // 0.013 s off is within half a frame (1/60 s). The capture has no sample at 3.68, so the footprint
  // can't be read there (cant_read); the Position rule itself is what's tested.
  const near = sledWith([pos, scale(3.68)]);
  assert.equal(positionRule(near, near.layers.find((l) => l.name === "Sled")), "position_keyed");
  const far = sledWith([pos, scale(3.7)]);
  assert.equal(positionRule(far, far.layers.find((l) => l.name === "Sled")), "position_moves", "a whole frame off");
});

test("D-4: a learner rest_time off the one Position key's frame is refused with position_moves", () => {
  const rot = { path: "ADBE Transform Group/ADBE Rotate Z", keys: [key(3.667, 0), { ...key(4.167, 90), index: 2 }] };
  const s = sledWith([{ path: POS, keys: [key(3.667, [320, 960, 0])] }, rot]);
  assert.equal(sledOf(s).reason, "position_keyed", "the default rest key (Rotation 0) is on the Position key");
  const off = analyze(s, { skill_options: { focus: [{ layer: "Sled", place: "middle-left", rest_time: 4.167 }] } });
  assert.deepEqual(off.targets, []);
  assert.deepEqual(off.focus_problems, [{ layer: "Sled", problem: "not_a_candidate", reason: "position_moves" }]);
  const on = analyze(s, { skill_options: { focus: [{ layer: "Sled", place: "middle-left", rest_time: 3.667 }] } });
  assert.deepEqual(on.targets, [`anchor/${indexOf(s, "Sled")}`]);
});

test("D-4: Sled on Mentor Practice 2 (three times) is refused with position_moves, gets no tip, and isn't a target", () => {
  const a = analyze(P2, { skill_options: { focus: [{ layer: "Sled", place: "middle-left" }] } });
  assert.deepEqual(a.targets, []);
  assert.deepEqual(a.focus_problems, [{ layer: "Sled", problem: "not_a_candidate", reason: "position_moves" }]);
  assert.ok(!a.notes.some((n) => n.note === "position_keyed_tip"));
  assert.equal(finder(P2).layers.includes("Sled"), false);
});

test("no focus: the proposal is the answer key's (Door, from the middle of its left edge), and the demo waits for a focus", () => {
  const a = analyze(P2);
  assert.deepEqual(a.proposal, KEY.practice2b.proposal);
  assert.deepEqual(a.targets, []);
  assert.equal(a.no_demo_reason, "awaiting_focus");
  assert.deepEqual(analyze(P2, { focus_layers: ["Needle"] }).proposal, { layer: "Needle", suggested_place: "bottom-middle" }, "tall and thin turns from its bottom");
});

// ---- T241: how animated a layer already is, three steps (FR-004, FR-024, amended 2026-10-26)

test("T241: keyed.any counts any keyed property: Opacity on Blink and Caption, Rotation on Spinner, none on Door", () => {
  const got = byLayer(candidates(P2));
  assert.equal(got.Blink.keyed.any, true);
  assert.equal(got.Caption.keyed.any, true);
  assert.equal(got.Spinner.keyed.any, true);
  assert.equal(got.Door.keyed.any, false);
  assert.equal(got.Lid.keyed.any, false);
});

test("T241: on Mentor Practice 2 the lesson proposes Door and the review (Door and Needle recorded) picks Tab", () => {
  assert.deepEqual(analyze(P2).proposal, { layer: "Door", suggested_place: "middle-left" });
  const exclude = [{ layer: "Door", property: "Anchor Point" }, { layer: "Needle", property: "Anchor Point" }];
  assert.equal(reviewProposal(P2, { exclude }).layer, KEY.review.proposal);
  assert.equal(finder(P2, { exclude }).count, KEY.review.count_with_exclude);
});

test("T241: a review with Door and Gauge in the record (quickstart 5's two lessons) picks Needle", () => {
  for (const second of ["Gauge", "Pop"]) {
    const exclude = [{ layer: "Door", property: "Anchor Point" }, { layer: second, property: "Anchor Point" }];
    assert.equal(reviewProposal(P2, { exclude }).layer, KEY.review.with_door_and_gauge, `Door and ${second}`);
  }
});

test("T241: an Opacity-keyed layer above an unkeyed one: the unkeyed one is proposed", () => {
  const s = clone(synthetic("measures"));
  const bar = s.layer_info.find((l) => l.name === "Bar");
  assert.equal(analyze(s).proposal.layer, "Bar", "with no keys anywhere, layer order decides");
  s.layers.push({
    index: bar.index, name: bar.name,
    properties: [{ path: "ADBE Transform Group/ADBE Opacity", name: "Opacity", expression_enabled: false, keys: [
      { index: 1, time: 0, value: 0 }, { index: 2, time: 1, value: 100 },
    ] }],
  });
  const got = byLayer(candidates(s));
  assert.equal(got.Bar.bucket, "default", "a ranking step, never a filter");
  assert.ok(got.Bar.rank > got.Needle.rank, "Bar drops below the unkeyed Needle");
  assert.equal(analyze(s).proposal.layer, "Needle");
});

test("T241: when every candidate has keys there's still a proposal (a ranking step, never a filter)", () => {
  const s = clone(P2);
  for (const e of s.layer_info) {
    if (s.layers.some((l) => l.index === e.index)) continue;
    s.layers.push({ index: e.index, name: e.name, properties: [{ path: "ADBE Transform Group/ADBE Opacity", name: "Opacity", expression_enabled: false, keys: [
      { index: 1, time: 0, value: 0 }, { index: 2, time: 1, value: 100 },
    ] }] });
  }
  const list = candidates(s);
  assert.ok(list.filter((c) => c.bucket === "default").every((c) => c.keyed.any));
  assert.equal(list.filter((c) => c.bucket === "default").length, candidates(P2).filter((c) => c.bucket === "default").length);
  // Every one keyed: the keys-but-no-Rotation-or-Scale step leads, by layer order, so Blink again.
  assert.equal(analyze(s).proposal.layer, "Blink");
});

// ---- T242: which side a pivot outside its layer sits on, as seen on screen (FR-019a)

test("T242: Lid's pivot is outside it, below, on the candidate and in the pivot_outside note for a focus and a proposal", () => {
  const got = byLayer(candidates(P2));
  assert.equal(got.Lid.place_now, "outside");
  assert.equal(got.Lid.outside_side, KEY.practice2b.layers.Lid.outside_side);
  assert.equal(got.Door.outside_side, null, "only on a pivot outside");
  const focus = analyze(P2, { skill_options: { focus: [{ layer: "Lid", place: "middle-left" }] } });
  assert.deepEqual(focus.notes.find((n) => n.note === "pivot_outside"), { layer: "Lid", note: "pivot_outside", side: "below" });
  const proposed = analyze(P2, { focus_layers: ["Lid"] });
  assert.equal(proposed.proposal.layer, "Lid");
  assert.deepEqual(proposed.notes.find((n) => n.note === "pivot_outside"), { layer: "Lid", note: "pivot_outside", side: "below" });
  assert.ok(!analyze(P2).notes.some((n) => n.note === "pivot_outside"), "Door's pivot is inside it");
});

test("T242: a flipped layer's side is the screen's, not its own (row 18)", () => {
  const s = clone(P2);
  // Past Flip's own right edge (its rectangle is 0 to 100 across); at Scale [-100, 100] that's the
  // screen's left.
  for (const sm of s.layer_info.find((l) => l.name === "Flip").samples) sm.anchor = [150, 30, 0];
  const flip = byLayer(candidates(s)).Flip;
  assert.equal(flip.place_now, "outside");
  assert.equal(flip.outside_side, "left");
});

test("T242: a pair when the pivot is past two edges, and null when it can't be read", () => {
  const s = clone(P2);
  for (const sm of s.layer_info.find((l) => l.name === "Plaque").samples) sm.anchor = [-100, 200, 0];
  assert.equal(byLayer(candidates(s)).Plaque.outside_side, "below-left");
  const lid = indexOf(P2, "Lid");
  assert.equal(outsideSide(P2, lid, 99, "shape"), null, "not sampled at that time");
  assert.equal(outsideSide(P2, lid, null, "shape"), null);
  const flat = clone(P2);
  for (const sm of flat.layer_info.find((l) => l.name === "Lid").samples) delete sm.position;
  assert.equal(outsideSide(flat, lid, 0, "shape"), null, "no Position read: no matrix");
  const noRect = clone(P2);
  for (const sm of noRect.layer_info.find((l) => l.name === "Lid").samples) sm.rect = null;
  assert.equal(outsideSide(noRect, lid, 0, "shape"), null, "no rectangle");
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
  // Since D-4 a layer with many Position keys is never, so it adds nothing: 80 keys on Sled change nothing.
  const sledMany = clone(P2);
  const sled = sledMany.layers.find((l) => l.name === "Sled").properties[0];
  sled.keys = Array.from({ length: 80 }, (_, i) => ({ ...sled.keys[0], index: i + 1, time: Math.round((0.1 + i * 0.05) * 1000) / 1000 }));
  assert.deepEqual(neededTimes(sledMany), KEY.times.needed_practice2b);
  // The cap: 70 one-key layers (each allowed if named), every key at its own time.
  const many = clone(P2);
  const door = many.layer_info.find((l) => l.name === "Door");
  let index = Math.max(...many.layer_info.map((l) => l.index));
  for (let i = 0; i < 70; i++) {
    index += 1;
    many.layer_info.push({ ...clone(door), index, name: `One Key ${i}` });
    many.layers.push({ index, name: `One Key ${i}`, properties: [{ path: "ADBE Transform Group/ADBE Position", expression_enabled: false, keys: [{ index: 1, time: Math.round((0.1 + i * 0.05) * 1000) / 1000, value: [0, 0, 0] }] }] });
  }
  assert.equal(candidates(many).find((c) => c.layer === "One Key 0").reason, "position_keyed");
  assert.equal(neededTimes(many).length, MAX_NEEDED_TIMES);
});

test("T245: neededTimes leaves out every layer that already moves, so Mentor Practice 2 needs 4 times, not 30", () => {
  const got = neededTimes(P2);
  assert.equal(got.length, 4);
  const moving = candidates(P2).filter((c) => c.reason === "position_moves");
  assert.equal(moving.length, 16, "spec FR-004's 16 Position-keyed layers");
  // What's left is the rest keys of layers a lesson can reach (Flag's key at 4.5 shares Badge's rest key).
  const rest = candidates(P2).filter((c) => c.bucket !== "never" && c.check_time.basis !== "current").map((c) => c.check_time.time);
  for (const c of moving) for (const t of c.keyed.position_times) assert.ok(!got.includes(t) || rest.includes(t), `${c.layer}'s key at ${t} isn't needed`);
  assert.deepEqual([...new Set(rest)].sort((x, y) => x - y), got);
  assert.ok(!got.includes(2.4) && !got.includes(5.367), "Card's and Tile's rest keys drop out with them");
});

// ---- T249: the watch offer with one focus layer (spec FR-008, TD § 17, B-8)

test("T249: watch_offer is the answer key's for Door (Needle) and Pop (Door), and null with two focus layers or none", () => {
  for (const name of ["door", "pop", "door_and_needle"]) {
    const want = KEY.watch_offer[name];
    const a = analyze(P2, { skill_options: { focus: want.focus } });
    assert.deepEqual(a.watch_offer, want.watch_offer, name);
    if (want.focus_check_time !== undefined) assert.equal(a.check_times[want.focus[0].layer].time, want.focus_check_time, `${name}'s check time`);
  }
  assert.equal(analyze(P2).watch_offer, null, "no focus yet");
  assert.equal(analyze(P2, { skill_options: { focus: [{ layer: "Door", place: "center" }] } }).watch_offer, null, "the one focus layer is already there: no target, no offer");
  assert.equal(analyze(P2, { skill_options: { focus: [{ layer: "Sled", place: "middle-left" }] } }).watch_offer, null, "the one focus layer is refused: no offer");
});

// Synthetic Measures (unkeyed solids at time 0): Bar 800 x 60, Needle 30 x 400 (tall), Line, Big,
// and Mirror (flipped, so it ranks last). `keep` names the layers left; the rest are dropped.
function measuresWith(keep, change = () => {}) {
  const s = clone(synthetic("measures"));
  s.layer_info = s.layer_info.filter((l) => keep.includes(l.name));
  change(s);
  return s;
}
// Scale keys at 1 s and 2 s, full size at `restTime` and half size at the other, with samples there.
function scaleKeys(s, name, restTime) {
  const e = s.layer_info.find((l) => l.name === name);
  const other = restTime === 1 ? 2 : 1;
  e.samples.push({ ...clone(e.samples[0]), time: restTime });
  e.samples.push({ ...clone(e.samples[0]), time: other, scale: [50, 50, 100] });
  const keys = [{ time: other, value: [50, 50, 100] }, { time: restTime, value: [100, 100, 100] }]
    .sort((x, y) => x.time - y.time).map((k, i) => ({ index: i + 1, ...k }));
  s.layers.push({ index: e.index, name, properties: [{ path: "ADBE Transform Group/ADBE Scale", name: "Scale", expression_enabled: false, keys }] });
}
const BAR = [{ layer: "Bar", place: "middle-left" }];

test("T249 synthetic: the focus the only default candidate gives no offer", () => {
  const s = measuresWith(["Bar"]);
  const a = analyze(s, { skill_options: { focus: BAR } });
  assert.deepEqual(a.targets, [`anchor/${indexOf(s, "Bar")}`]);
  assert.equal(a.watch_offer, null);
});

test("T249 synthetic: the next-ranked layer already at its suggested place is passed over for the one after it", () => {
  const plain = measuresWith(["Bar", "Needle", "Line"]);
  assert.deepEqual(analyze(plain, { skill_options: { focus: BAR } }).watch_offer, { layer: "Needle", suggested_place: "bottom-middle" });
  // Needle's rectangle drawn up from [0, 0], with the pivot at [0, 0]: still where AE put it (D-3), so
  // still rank 2, but already at the middle of its bottom edge.
  const there = measuresWith(["Bar", "Needle", "Line"], (s) => {
    const n = s.layer_info.find((l) => l.name === "Needle").samples[0];
    n.rect = { left: -15, top: -400, width: 30, height: 400 };
    n.anchor = [0, 0, 0];
  });
  assert.equal(candidates(there).find((c) => c.layer === "Needle").rank, 2);
  assert.deepEqual(analyze(there, { skill_options: { focus: BAR } }).watch_offer, { layer: "Line", suggested_place: "middle-left" });
});

test("T249 synthetic: a Scale-keyed next layer is offered only when its rest key is on the focus's check time", () => {
  // Bar (the focus) rests at 1 s; Needle's Scale rests at 2 s or 1 s; Mirror (flipped, unkeyed) ranks after.
  const off = measuresWith(["Bar", "Needle", "Mirror"], (s) => { scaleKeys(s, "Bar", 1); scaleKeys(s, "Needle", 2); });
  const offA = analyze(off, { skill_options: { focus: BAR } });
  assert.equal(offA.check_times.Bar.time, 1);
  const ranked = candidates(off).filter((c) => c.bucket === "default").sort((x, y) => x.rank - y.rank).map((c) => c.layer);
  assert.deepEqual(ranked, ["Bar", "Needle", "Mirror"]);
  assert.deepEqual(offA.watch_offer, { layer: "Mirror", suggested_place: "middle-left" }, "Needle's rest key is at another time: skipped");
  const on = measuresWith(["Bar", "Needle", "Mirror"], (s) => { scaleKeys(s, "Bar", 1); scaleKeys(s, "Needle", 1); });
  assert.deepEqual(analyze(on, { skill_options: { focus: BAR } }).watch_offer, { layer: "Needle", suggested_place: "bottom-middle" }, "on the focus's check time: offered");
});
