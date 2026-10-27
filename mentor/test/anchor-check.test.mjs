// Spec 011 FR-012, FR-013, FR-016, FR-018, FR-019 (research R7; data-model › Check result, Hint
// codes): items 1 to 5, matching, "can't check", credit, other changes and one hint code per TD § 7
// row.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as compSpace from "../lib/comp-space.mjs";
import { check, checkSampleTimes, hintCodes, otherChanges } from "../lib/anchor-check.mjs";
import { unexpectedChanges } from "../lib/diff.mjs";
import { analyze, demoValues, rectOf } from "../lib/anchor.mjs";
import { apply as applyDemo } from "../fixture/anchor-demo.mjs";
import { clone, fixture, indexOf, KEY, lessonFor, synthetic } from "./fixtures/anchor/load.mjs";

const P2 = fixture("practice2b");
const DOOR = [{ layer: "Door", place: "middle-left" }];
const run = (base, cur, focus, opts) => check(base, cur, lessonFor(base, focus, opts));
const layerOf = (result, name) => result.layers.find((l) => l.layer === name);

// ---- Item 2's edges (FR-028)

test("item 2: 0.9 px passes and 1.1 px fails on an edge", () => {
  const base = synthetic("edge-before");
  const ok = run(base, synthetic("edge-0.9"), DOOR);
  assert.equal(layerOf(ok, "Door").item2.passed, true);
  assert.equal(ok.passed, true);
  const no = run(base, synthetic("edge-1.1"), DOOR);
  assert.equal(layerOf(no, "Door").item2.passed, false);
  assert.equal(layerOf(no, "Door").item2.direction, "right");
  assert.equal(no.passed, false);
});

test("the result carries the check read's own time, for the rest hint", () => {
  const r = run(P2, fixture("pop-shrunk"), [{ layer: "Pop", place: "bottom-middle" }]);
  assert.equal(r.time, 3.3);
  assert.equal(layerOf(r, "Pop").check_time, 4.3);
});

// The live base with its playhead somewhere else, as a learner who started the lesson there would
// have it (the base holds samples at every --times time).
const at = (snap, time) => { const s = clone(snap); s.comp.time = time; return s; };
const baseFor = (want) => (want.baseline_comp_time !== undefined ? at(P2, want.baseline_comp_time) : P2);

test("item 4 fails on a slide at the Position keys while item 2 passes (L-2, playhead before the keys: a key added at 0)", () => {
  const r = run(P2, fixture("sled-slid"), [{ layer: "Sled", place: "middle-left" }]);
  const sled = layerOf(r, "Sled");
  assert.equal(sled.item2.passed, true);
  assert.equal(sled.item4.passed, false);
  assert.equal(sled.item4.worst.time, KEY.attempts["sled-slid"].item4_worst_time, "every old key slid the same, so the first is the worst");
  assert.deepEqual(r.other_changes, [{ kind: "keys_added", layer: "Sled", property: "Position" }], "AE added a key at the playhead");
  assert.equal(r.passed, false);
});

test("L-2, playhead on the first key: only that key is rewritten, Sled slides at the other two, no key added", () => {
  const want = KEY.attempts["sled-on-key"];
  const base = baseFor(want);
  const r = run(base, fixture("sled-on-key"), want.focus);
  const sled = layerOf(r, "Sled");
  assert.equal(sled.check_time, 3.667);
  assert.equal(sled.item2.passed, true, "still at the playhead");
  assert.equal(sled.item4.passed, false);
  assert.equal(sled.item4.worst.time, want.item4_worst_time);
  assert.deepEqual(sled.hints, ["slid_at_key"]);
  assert.deepEqual(r.other_changes, []);
});

test("item 5 fails when another layer moved 2 px", () => {
  const r = run(synthetic("edge-before"), synthetic("edge-other-moved"), DOOR);
  const door = layerOf(r, "Door");
  assert.equal(door.item1.passed && door.item2.passed, true);
  assert.equal(door.item5.passed, false);
  assert.deepEqual(door.item5.moved_layers.map((m) => m.layer), ["Other"]);
  assert.equal(r.passed, false);
});

test("item 5 compares a focus layer's child only at the focus's check time (row 16)", () => {
  const base = synthetic("row16-before");
  const r = run(base, synthetic("row16-pass"), [{ layer: "Arm", place: "middle-left" }]);
  const arm = layerOf(r, "Arm");
  assert.equal(arm.check_time, 1);
  assert.deepEqual(arm.item5.moved_layers, [], "Hand turns with the new pivot at 2 s, which is the point");
  assert.equal(r.passed, true);
  // Compared at every time, Hand would have moved at 2 s.
  const hand = compSpace.footprint(base, indexOf(base, "Hand"), 2);
  const handNow = compSpace.footprint(synthetic("row16-pass"), indexOf(base, "Hand"), 2);
  assert.ok(Math.abs(hand.bounds.left - handNow.bounds.left) > 1);
});

test("item 5 fails on a new Anchor Point key on the focus", () => {
  const r = run(P2, fixture("stopwatch"), DOOR);
  assert.equal(layerOf(r, "Door").item5.anchor_keys_added, true);
  assert.equal(r.passed, false);
});

test("matching by name, and by index when a name repeats", () => {
  const base = synthetic("dup-before");
  const lesson = lessonFor(base, null);
  lesson.targets = ["anchor/2"];
  lesson.skill_options = { focus: [] };
  // The analyzer gives no target for a repeated name, so the second Card's place is set directly.
  const a = analyze(base, {});
  assert.equal(a.targets.length, 0);
  const second = base.layer_info[1];
  assert.equal(second.name, "Card");
  // Matched by index: the first Card unchanged, the second moved with Pan Behind.
  const cur = synthetic("dup-second-pass");
  const first = compSpace.sampleAt(cur.layer_info[0], 0);
  assert.deepEqual(first.anchor.slice(0, 2), [100, 50]);
  assert.deepEqual(compSpace.sampleAt(cur.layer_info[1], 0).anchor.slice(0, 2), [0, 50]);
  const others = otherChanges(base, cur, [2]);
  assert.deepEqual(others, [], "the second Card's anchor is the focus's; nothing else changed");
  const all = otherChanges(base, cur, []);
  assert.deepEqual(all, [{ kind: "anchor_changed", layer: "Card" }], "matched by index, the second Card is the one that changed");
});

test("each comp-space reason on a focus layer makes it can't-check and holds the pass (filter 6)", () => {
  const base = synthetic("edge-before");
  const notSampled = run(base, synthetic("row27-not-sampled"), DOOR);
  assert.ok(layerOf(notSampled, "Door").cant_check.some((c) => c.reason === "not_sampled"));
  assert.equal(notSampled.passed, false);
  assert.deepEqual(layerOf(notSampled, "Door").hints, ["cant_check"]);
  const noRect = run(base, synthetic("row27-no-rect"), DOOR);
  assert.ok(layerOf(noRect, "Door").cant_check.some((c) => c.reason === "no_rect"));
  assert.equal(noRect.passed, false);
  for (const flag of ["three_d", "auto_orient"]) {
    const cur = clone(synthetic("edge-0.9"));
    cur.layer_info.find((l) => l.name === "Door")[flag] = true;
    const r = run(base, cur, DOOR);
    assert.ok(layerOf(r, "Door").cant_check.some((c) => c.reason === flag), flag);
    assert.equal(r.passed, false, flag);
  }
  const gone = clone(synthetic("edge-0.9"));
  gone.layer_info = gone.layer_info.filter((l) => l.name !== "Door");
  const r = run(base, gone, DOOR);
  assert.deepEqual(layerOf(r, "Door").cant_check, [{ what: "layer", reason: "not_found" }]);
  assert.equal(r.passed, false);
  // A no_layer from the chain (a parent the read lost) and singular through a wrapped call.
  for (const reason of ["no_layer", "singular"]) {
    const space = { ...compSpace, footprint: (s, i, t, o) => (s === base ? compSpace.footprint(s, i, t, o) : { corners: null, bounds: null, reason }) };
    const w = check(base, synthetic("edge-0.9"), lessonFor(base, DOOR), { space });
    assert.ok(layerOf(w, "Door").cant_check.some((c) => c.reason === reason), reason);
    assert.equal(w.passed, false, reason);
  }
});

test("a comp-space reason on another layer goes to not_compared, never 'didn't move'", () => {
  const base = synthetic("edge-before");
  const cur = clone(synthetic("edge-0.9"));
  cur.layer_info.find((l) => l.name === "Other").three_d = true;
  const r = run(base, cur, DOOR);
  const door = layerOf(r, "Door");
  assert.ok(door.item5.not_compared.some((n) => n.layer === "Other" && n.reason === "three_d"));
  assert.deepEqual(door.item5.moved_layers, []);
});

test("the 70-key layer's late keys dropped by the cap narrow item 5 and never fail it", () => {
  const base = synthetic("cap70-before");
  const cur = synthetic("cap70-pass");
  const busyB = base.layer_info.find((l) => l.name === "Busy");
  const busyC = cur.layer_info.find((l) => l.name === "Busy");
  assert.equal(busyB.samples_truncated, true);
  assert.equal(busyB.samples.length, 64);
  for (const t of [5.5, 5.6, 5.7, 0]) assert.ok(compSpace.sampleAt(busyC, t), `the caller's time ${t} is kept`);
  const r = run(base, cur, DOOR);
  assert.deepEqual(layerOf(r, "Door").item5.moved_layers, []);
  assert.equal(r.passed, true);
});

test("the playhead moved between reads changes nothing (row 26)", () => {
  const base = synthetic("edge-before");
  const r = run(base, synthetic("row26-moved-playhead"), DOOR);
  assert.equal(layerOf(r, "Door").check_time, 0);
  assert.equal(r.passed, true);
  const same = run(base, synthetic("row26-untouched"), DOOR);
  assert.deepEqual(same.other_changes, []);
  assert.deepEqual(layerOf(same, "Door").hints, ["not_moved_enough"]);
});

test("credit: the demo's within 0.01 px of the written anchor, undone after, then the learner's", () => {
  const twoFocus = [{ layer: "Door", place: "middle-left" }, { layer: "Tab", place: "middle-left" }];
  const tab = `anchor/${indexOf(P2, "Tab")}`;
  const demoed = clone(P2);
  const entry = demoed.layer_info.find((l) => l.name === "Tab");
  const s = compSpace.sampleAt(entry, 0);
  applyDemo(demoed, { layer_index: entry.index, ...demoValues(s, rectOf(s, entry.kind), "middle-left") });
  const r = run(P2, demoed, twoFocus, { demo: tab });
  assert.equal(layerOf(r, "Tab").credit, "demo");
  assert.equal(layerOf(r, "Tab").passed, true);
  assert.equal(r.demo_undone, false);
  const undone = run(P2, P2, twoFocus, { demo: tab });
  assert.equal(layerOf(undone, "Tab").credit, "undone");
  assert.equal(undone.demo_undone, true);
  const later = run(P2, demoed, twoFocus, { demo: tab, demoUndone: true });
  assert.equal(layerOf(later, "Tab").credit, "learner");
  assert.equal(layerOf(later, "Door").credit, "learner");
});

test("comp_matches is false on another comp, and nothing is graded", () => {
  const other = clone(fixture("door-pass"));
  other.comp.id = 999;
  const r = run(P2, other, DOOR);
  assert.equal(r.comp_matches, false);
  assert.equal(r.passed, false);
  assert.deepEqual(r.layers, []);
});

test("checkSampleTimes: the focus's check times, the baseline's comp.time and its Position key times", () => {
  const l = lessonFor(P2, [{ layer: "Pop", place: "bottom-middle" }, { layer: "Sled", place: "middle-left" }]);
  assert.deepEqual(checkSampleTimes(P2, l), [0, 3.667, 4.167, 4.3, 4.667]);
});

// ---- Other changes (FR-019), from layer_info for every layer

test("anchor_changed on another, unkeyed layer: Pan Behind on Background, which unexpectedChanges() misses (filter 1)", () => {
  const cur = fixture("wrong-layer");
  const others = otherChanges(P2, cur, [indexOf(P2, "Needle")]);
  assert.deepEqual(others, [{ kind: "anchor_changed", layer: "Background" }]);
  assert.deepEqual(unexpectedChanges(P2, cur, []), [], "the keyed-only diff sees nothing");
});

test("eye_changed, keys_added on Anchor Point and Position, layer_added, layer_removed, renamed", () => {
  const eye = otherChanges(P2, fixture("matte-eye-on"), []);
  assert.deepEqual(eye, [{ kind: "eye_changed", layer: "Reveal Matte", eye_on: true, was_class: "matte" }]);
  assert.ok(otherChanges(P2, fixture("stopwatch"), [indexOf(P2, "Door")]).some((o) => o.kind === "keys_added" && o.layer === "Door" && o.property === "Anchor Point"));
  const oneKey = otherChanges(fixture("sled-one-key-before"), fixture("sled-one-key"), []);
  assert.ok(oneKey.some((o) => o.kind === "keys_added" && o.layer === "Sled" && o.property === "Position"));
  assert.deepEqual(otherChanges(P2, fixture("door-layer-added"), []), [{ kind: "layer_added", layer: "New Solid" }]);
  assert.deepEqual(otherChanges(fixture("door-layer-added"), P2, []), [{ kind: "layer_removed", layer: "New Solid" }]);
  assert.deepEqual(otherChanges(P2, fixture("door-renamed"), []), [{ kind: "renamed", layer: "Tab", now: "Tab 2" }]);
});

// ---- One hint per TD § 7 row

const passMatteEyeOn = () => {
  const cur = clone(fixture("matte-eye-on"));
  const door = cur.layer_info.find((l) => l.name === "Door");
  const s = compSpace.sampleAt(door, 0);
  applyDemo(cur, { layer_index: door.index, ...demoValues(s, rectOf(s, door.kind), "middle-left") });
  return cur;
};

const ROWS = [
  ["moved_with_pivot", "door-typed"],
  ["layer_dragged", "door-dragged"],
  ["not_moved_enough", "needle-near-middle"],
  ["neighbour_place", "banner-neighbour"],
  ["outside", "door-outside"],
  ["wrong_layer", "wrong-layer"],
  ["away_from_rest", "pop-shrunk"],
  ["slid_at_key", "sled-slid"],
  ["stopwatch", "stopwatch"],
  ["locked", "door-locked"],
];
for (const [code, file] of ROWS) {
  test(`hint ${code}: ${file} gives exactly that code`, () => {
    const want = KEY.attempts[file];
    const r = run(P2, fixture(file), want.focus);
    const l = layerOf(r, want.focus[0].layer);
    assert.deepEqual(l.hints, [code]);
    assert.equal(r.passed, false);
    if (want.direction) assert.equal(l.item2.direction, want.direction);
    if (want.place_now) assert.equal(l.item1.place_now, want.place_now);
  });
}

// Row 22's hints (FR-019b, T243). Live (L-1), AE moves a group's anchor and position together, so
// nothing this skill reads changes: on a shape that gives unchanged_shape after the place hint.
// content_shifted (was group_anchor) fires when a layer's rectangle shifts with its anchor unchanged:
// live, a text layer whose justification changed (sign-left), and a shape's shifted rectangle, kept
// as a clone here.
test("hint content_shifted: what's drawn moved, its pivot didn't, on any layer kind; exactly that code", () => {
  const sign = layerOf(run(P2, fixture("sign-left"), [{ layer: "Sign", place: "middle-left" }]), "Sign");
  assert.deepEqual([sign.anchor_changed, sign.position_changed, sign.rect_shifted], [false, false, true]);
  assert.deepEqual(sign.hints, ["content_shifted"], "a text layer: a justification change (L-5)");
  const shifted = clone(P2);
  for (const sm of shifted.layer_info.find((l) => l.name === "Lid").samples) sm.rect = { ...sm.rect, left: sm.rect.left - 40 };
  const r = layerOf(run(P2, shifted, [{ layer: "Lid", place: "middle-left" }]), "Lid");
  assert.equal(r.rect_shifted, true);
  assert.deepEqual(r.hints, ["content_shifted"], "a shape whose rectangle shifted: item 2 fails, so no unchanged_shape");
  assert.ok(!hintCodes({ ...r, rect_shifted: false }).includes("content_shifted"));
  assert.ok(!["group_anchor"].some((c) => r.hints.includes(c) || sign.hints.includes(c)), "the old code is gone");
});

test("hint unchanged_shape: live lid-group (nothing the read holds changed) gives the place hint, then unchanged_shape", () => {
  const want = KEY.attempts["lid-group"];
  const live = layerOf(run(P2, fixture("lid-group"), want.focus), "Lid");
  assert.deepEqual(live.hints, want.hints);
  assert.deepEqual(live.hints, ["outside", "unchanged_shape"]);
  assert.equal(live.hints.filter((c) => c === "unchanged_shape").length, 1);
  assert.deepEqual([live.kind, live.anchor_changed, live.position_changed, live.item2.passed, live.rect_shifted], ["shape", false, false, true, false]);
});

test("unchanged_shape fires only on a shape that didn't pass, own pivot and Position unchanged, item 2 holding, not wrong_layer", () => {
  const lid = layerOf(run(P2, fixture("lid-group"), [{ layer: "Lid", place: "middle-left" }]), "Lid");
  const has = (r, o = []) => hintCodes(r, o).includes("unchanged_shape");
  assert.equal(has(lid), true);
  assert.equal(has({ ...lid, kind: "solid" }), false, "a solid: not a shape");
  assert.equal(has({ ...lid, kind: "text" }), false, "a text layer: not a shape");
  assert.equal(has({ ...lid, passed: true }), false, "passed");
  assert.equal(has({ ...lid, anchor_changed: true }), false, "its own pivot changed");
  assert.equal(has({ ...lid, position_changed: true }), false, "its Position changed");
  assert.equal(has({ ...lid, item2: { ...lid.item2, passed: false } }), false, "item 2 fails");
  assert.equal(has(lid, [{ kind: "anchor_changed", layer: "Background" }]), false, "another layer's pivot moved: wrong_layer instead");
  assert.deepEqual(hintCodes(lid, [{ kind: "anchor_changed", layer: "Background" }]), ["wrong_layer"]);
  // A solid with nothing changed (Door untouched): the place hint only.
  const door = layerOf(run(P2, P2, [{ layer: "Door", place: "middle-left" }]), "Door");
  assert.deepEqual(door.hints, ["not_moved_enough"]);
});

test("hint matte_eye: a pass with a matte's eye left on gives exactly that code", () => {
  const r = run(P2, passMatteEyeOn(), DOOR);
  assert.equal(r.passed, true);
  assert.deepEqual(layerOf(r, "Door").hints, ["matte_eye"]);
});

test("hint cant_check: said instead of any other hint for that layer", () => {
  const r = run(synthetic("edge-before"), synthetic("row27-no-rect"), DOOR);
  assert.deepEqual(layerOf(r, "Door").hints, ["cant_check"]);
  assert.deepEqual(hintCodes({ cant_check: [{ reason: "three_d" }], locked: true, item1: { passed: false }, item2: { passed: false } }), ["cant_check"]);
});

test("every planted attempt in the answer key grades as it says", () => {
  for (const [file, want] of Object.entries(KEY.attempts)) {
    const r = run(baseFor(want), fixture(file), want.focus);
    const l = layerOf(r, want.focus[0].layer);
    assert.equal(r.passed, want.passed, `${file} passed`);
    assert.deepEqual(l.hints, want.hints, `${file} hints`);
    if (want.check_time !== undefined) assert.equal(l.check_time, want.check_time, `${file} check time`);
    if (want.item1 !== undefined) assert.equal(l.item1.passed, want.item1, `${file} item 1`);
    if (want.place_now !== undefined) assert.equal(l.item1.place_now, want.place_now, `${file} place now`);
    if (want.outside_side !== undefined) assert.equal(l.item1.outside_side, want.outside_side, `${file} outside side`);
    if (want.item2 !== undefined) assert.equal(l.item2.passed, want.item2, `${file} item 2`);
    if (want.item4 !== undefined) assert.equal(l.item4.passed, want.item4, `${file} item 4`);
    if (want.item4_worst_time !== undefined) assert.equal(l.item4.worst.time, want.item4_worst_time, `${file} item 4's worst key`);
    if (want.other_changes) assert.deepEqual(r.other_changes, want.other_changes, `${file} other changes`);
  }
});

// ---- T242: item 1 says which side a pivot outside sits on, on screen (FR-019a)

test("T242: item1.outside_side: door-outside left, pop-shrunk below at its rest key, lid-group below", () => {
  const door = layerOf(run(P2, fixture("door-outside"), DOOR), "Door");
  assert.equal(door.item1.place_now, "outside");
  assert.equal(door.item1.outside_side, KEY.attempts["door-outside"].outside_side);
  const pop = layerOf(run(P2, fixture("pop-shrunk"), [{ layer: "Pop", place: "bottom-middle" }]), "Pop");
  assert.equal(pop.check_time, 4.3);
  assert.equal(pop.item1.outside_side, KEY.attempts["pop-shrunk"].outside_side);
  assert.deepEqual(pop.hints, ["away_from_rest"], "the side is a fact, not a second hint");
  const lid = layerOf(run(P2, fixture("lid-group"), [{ layer: "Lid", place: "middle-left" }]), "Lid");
  assert.equal(lid.item1.outside_side, "below");
  const pass = layerOf(run(P2, fixture("door-pass"), DOOR), "Door");
  assert.equal(pass.item1.outside_side, null, "only when the pivot is outside");
});

test("T242: a flipped focus layer's side is the screen's; an unreadable one is null, never a guess", () => {
  const flipped = clone(P2);
  for (const sm of flipped.layer_info.find((l) => l.name === "Flip").samples) sm.anchor = [150, 30, 0];
  const flip = layerOf(run(P2, flipped, [{ layer: "Flip", place: "middle-left" }]), "Flip");
  assert.equal(flip.item1.place_now, "outside");
  assert.equal(flip.item1.outside_side, "left", "past its own right edge, which is the screen's left");
  // No Position in the read: item 1 still reads the anchor in its own rectangle, but comp space
  // can't be read, so no side (and the layer can't be checked).
  const noPos = clone(fixture("door-outside"));
  for (const sm of noPos.layer_info.find((l) => l.name === "Door").samples) delete sm.position;
  const d = layerOf(run(P2, noPos, DOOR), "Door");
  assert.equal(d.item1.place_now, "outside");
  assert.equal(d.item1.outside_side, null);
  assert.deepEqual(d.hints, ["cant_check"]);
});

// ---- Review S1: two more rows, and no failed layer without a hint

test("hint in_place_moved: the pivot is in its place, but the layer moved too (both values changed)", () => {
  const cur = clone(fixture("door-pass"));
  for (const sm of cur.layer_info.find((l) => l.name === "Door").samples) { sm.position[0] -= 30; sm.position[1] -= 20; }
  const door = layerOf(run(P2, cur, DOOR), "Door");
  assert.equal(door.item1.passed, true);
  assert.equal(door.item2.passed, false);
  assert.equal(door.anchor_changed && door.position_changed, true);
  assert.deepEqual(door.hints, ["in_place_moved"]);
  assert.equal(door.item2.direction, "up-left");
});

test("hint other_layer_moved: the focus holds items 1 to 4 and another layer's bounds moved, with which way", () => {
  const r = run(synthetic("edge-before"), synthetic("edge-other-moved"), DOOR);
  const door = layerOf(r, "Door");
  assert.deepEqual(door.hints, ["other_layer_moved"]);
  assert.deepEqual(door.item5.moved_layers.map((m) => [m.layer, m.direction]), [["Other", "right"]]);
  assert.deepEqual(layerOf(run(P2, fixture("wrong-layer"), [{ layer: "Needle", place: "bottom-middle" }]), "Needle").hints, ["wrong_layer"], "not when the focus's pivot never moved");
});

test("a failed focus layer always has at least one hint", () => {
  const cases = [];
  for (const [file, want] of Object.entries(KEY.attempts)) cases.push([file, baseFor(want), fixture(file), want.focus]);
  for (const name of ["door-renamed", "door-layer-added", "matte-eye-on", "hatch-rig-focus", "gauge-away", "pop-shrunk"]) {
    for (const focus of [DOOR, [{ layer: "Gauge", place: "bottom-middle" }], [{ layer: "Pop", place: "bottom-middle" }, { layer: "Needle", place: "top-left" }]]) cases.push([name, P2, fixture(name), focus]);
  }
  const edge = synthetic("edge-before");
  for (const f of ["edge-0.9", "edge-1.1", "edge-other-moved", "row26-untouched", "row27-no-rect", "row27-not-sampled"]) cases.push([f, edge, synthetic(f), DOOR]);
  // Variants: scale or rotation changed, both values changed off place, a nudge of every kind.
  const tweak = (change) => { const c = clone(P2); change(c.layer_info.find((l) => l.name === "Door")); return c; };
  cases.push(["scaled", P2, tweak((d) => d.samples.forEach((s) => { s.scale = [110, 110, 100]; })), DOOR]);
  cases.push(["rotated", P2, tweak((d) => d.samples.forEach((s) => { s.rotation = 10; })), DOOR]);
  cases.push(["both off place", P2, tweak((d) => d.samples.forEach((s) => { s.anchor = [100, 100, 0]; s.position = [210, 290, 0]; })), DOOR]);
  let failed = 0;
  for (const [name, base, cur, focus] of cases) {
    for (const l of run(base, cur, focus).layers) {
      if (l.passed) continue;
      failed++;
      assert.ok(l.hints.length > 0, `${name}: ${l.layer} failed with no hint`);
    }
  }
  assert.ok(failed > 20, "the sweep covers many failures");
});

// ---- Review S4: an unreadable other layer whose own transform changed

test("the reviewer's hand-check: Needle moved 50 px with its rect nulled doesn't pass Door's lesson", () => {
  for (const both of [false, true]) {
    const base = clone(P2);
    const cur = clone(fixture("door-pass"));
    for (const snap of both ? [base, cur] : [cur]) for (const sm of snap.layer_info.find((l) => l.name === "Needle").samples) sm.rect = null;
    for (const sm of cur.layer_info.find((l) => l.name === "Needle").samples) sm.position[0] += 50;
    const r = check(base, cur, lessonFor(base, DOOR));
    const door = layerOf(r, "Door");
    assert.equal(r.passed, false, `rect nulled in ${both ? "both reads" : "the check read"}`);
    assert.ok(door.item5.not_compared.some((n) => n.layer === "Needle"));
    assert.deepEqual(door.item5.moved_layers.map((m) => [m.layer, m.direction, m.from_transform]), [["Needle", null, true]]);
    assert.ok(door.hints.length > 0);
  }
});

test("an unreadable other layer whose own transform didn't change stays not compared, and the pass holds", () => {
  const cur = clone(fixture("door-pass"));
  for (const sm of cur.layer_info.find((l) => l.name === "Needle").samples) sm.rect = null;
  const r = check(P2, cur, lessonFor(P2, DOOR));
  assert.equal(r.passed, true);
  assert.ok(layerOf(r, "Door").item5.not_compared.some((n) => n.layer === "Needle" && n.reason === "no_rect"));
});
