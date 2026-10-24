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

test("item 4 fails on a slide at one Position key time while item 2 passes", () => {
  const r = run(P2, fixture("sled-slid"), [{ layer: "Sled", place: "middle-left" }]);
  const sled = layerOf(r, "Sled");
  assert.equal(sled.item2.passed, true);
  assert.equal(sled.item4.passed, false);
  assert.ok([4.167, 4.667].includes(sled.item4.worst.time));
  assert.equal(r.passed, false);
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
  ["group_anchor", "lid-group"],
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
    const r = run(P2, fixture(file), want.focus);
    const l = layerOf(r, want.focus[0].layer);
    assert.equal(r.passed, want.passed, `${file} passed`);
    assert.deepEqual(l.hints, want.hints, `${file} hints`);
    if (want.check_time !== undefined) assert.equal(l.check_time, want.check_time, `${file} check time`);
    if (want.item1 !== undefined) assert.equal(l.item1.passed, want.item1, `${file} item 1`);
    if (want.item2 !== undefined) assert.equal(l.item2.passed, want.item2, `${file} item 2`);
    if (want.item4 !== undefined) assert.equal(l.item4.passed, want.item4, `${file} item 4`);
    if (want.other_changes) assert.deepEqual(r.other_changes, want.other_changes, `${file} other changes`);
  }
});
