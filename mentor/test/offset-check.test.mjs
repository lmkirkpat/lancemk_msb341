// Spec 010 FR-008, FR-011 to FR-015 (research R6) and FR-013's raw-key other changes (R7): the
// check against the answer key, then each rule on its own.

import { test } from "node:test";
import assert from "node:assert/strict";
import { check } from "../lib/offset.mjs";
import { matchLayer, otherChanges, shifts } from "../lib/offset-keys.mjs";
import { clone, KEY, load, lessonFor, PRACTICE2, PRACTICE_NOW } from "./fixtures/offset/load.mjs";

const resolve = (rel) => (rel === "stand-in/practice-now.json" ? PRACTICE_NOW : rel === "stand-in/practice2-before.json" ? PRACTICE2 : rel);

function run(name, extra = {}) {
  const k = KEY.checks[name];
  const baseline = load(resolve(k.baseline));
  const current = load(k.current);
  const lesson = lessonFor(baseline, k.lesson);
  return { k, r: check(baseline, current, lesson, extra), baseline, current, lesson };
}
const member = (r, layer) => r.members.find((m) => m.layer === layer);

for (const name of Object.keys(KEY.checks)) {
  test(`answer key: ${name}`, () => {
    const { k, r } = run(name);
    assert.equal(r.comp_matches, true);
    assert.equal(r.passed, k.passed, "passed");
    if (k.still_same) assert.deepEqual(r.still_same, k.still_same, "still_same");
    if ("order_differs" in k) assert.equal(r.order_differs, k.order_differs, "order_differs");
    if ("rhythm" in k) assert.deepEqual(r.rhythm, k.rhythm, "rhythm");
    if (k.gaps_frames) assert.deepEqual(r.gaps_frames, k.gaps_frames, "gaps");
    if (k.credit) for (const [layer, c] of Object.entries(k.credit)) assert.equal(member(r, layer).credit, c, `credit ${layer}`);
    if ("demo_undone" in k) assert.equal(r.demo_undone, k.demo_undone);
    if (k.moved_by) for (const [layer, by] of Object.entries(k.moved_by)) assert.deepEqual(member(r, layer).moved_by, by, `moved_by ${layer}`);
    if (k.start_now) for (const [layer, t] of Object.entries(k.start_now)) assert.equal(member(r, layer).start_now, t, `start_now ${layer}`);
    if (k.split) {
      const splits = Object.fromEntries(r.members.filter((m) => m.split).map((m) => [m.layer, { moved: m.split.moved, stayed: m.split.stayed }]));
      assert.deepEqual(splits, k.split, "splits");
    }
    if (k.within_position) {
      for (const [layer, w] of Object.entries(k.within_position)) assert.deepEqual(member(r, layer).split.within_position, w);
    }
    if (k.out_of_comp) assert.deepEqual(r.out_of_comp.map((o) => [o.layer, o.property, o.time]), k.out_of_comp, "out_of_comp");
    if (k.lands_in_comp) for (const [label, v] of Object.entries(k.lands_in_comp)) assert.equal(r.members.find((m) => m.label === label).lands_in_comp, v);
    if (k.other_changes) assert.deepEqual(r.other_changes, k.other_changes);
    if (k.other_changes_match) for (const c of k.other_changes_match) assert.ok(r.other_changes.includes(c), `${c} in ${JSON.stringify(r.other_changes)}`);
  });
}

test("properties kind: a whole shift, a start only, or a landing only each break the lockstep", () => {
  const base = load(PRACTICE_NOW);
  const lesson = lessonFor(base, { kind: "properties" });
  const scale = (s) => s.layers.find((l) => l.name === "Title").properties.find((p) => p.display_name === "Scale");
  const opacity = (s) => s.layers.find((l) => l.name === "Title").properties.find((p) => p.display_name === "Opacity");
  const by = (k, frames) => (k.time = Math.round((k.time + frames / 30) * 1000) / 1000);
  // Scale and Opacity both moved: whole, start only, landing only (each 4 frames).
  const whole = clone(base); scale(whole).keys.forEach((k) => by(k, 4)); opacity(whole).keys.forEach((k) => by(k, 8));
  const startOnly = clone(base); by(scale(startOnly).keys[0], 4); by(opacity(startOnly).keys[0], 8);
  const landingOnly = clone(base); by(scale(landingOnly).keys[1], -4); by(opacity(landingOnly).keys[1], -8);
  for (const [name, s] of [["whole", whole], ["start only", startOnly], ["landing only", landingOnly]]) {
    assert.equal(check(base, s, lesson).passed, true, name);
  }
  const onlyOne = clone(base); scale(onlyOne).keys.forEach((k) => by(k, 4));
  const r = check(base, onlyOne, lesson);
  assert.equal(r.passed, false, "Position and Opacity still start and land together");
  assert.deepEqual(r.still_same, [["Title › Position", "Title › Opacity"]]);
});

test("layers kind: a split named in the check's split, or stored in skill_options, passes", () => {
  const { r } = run("pops-in");
  assert.equal(r.passed, false);
  assert.equal(member(r, "Dot 1").split.on_purpose, false);
  const withInput = run("pops-in", { split: ["Dot 1"] }).r;
  assert.equal(withInput.passed, true);
  assert.equal(member(withInput, "Dot 1").split.on_purpose, true);
  const base = load(PRACTICE2);
  const stored = lessonFor(base, { ...KEY.checks["pops-in"].lesson, split: ["Dot 1"] });
  assert.equal(check(base, load("stand-in/pops-in.json"), stored).passed, true);
});

test("per-property shifts are measured within half a frame (row 19)", () => {
  const { r } = run("half-frame");
  const d2 = member(r, "D2");
  assert.equal(d2.split, null);
  assert.ok(Math.abs(d2.moved_by.Position - 2.5) < 0.05);
  assert.ok(Math.abs(d2.moved_by.Opacity - 2.7) < 0.05);
});

test("a member whose remembered move is gone is keys_changed, isn't graded, and holds the pass", () => {
  const base = load(PRACTICE_NOW);
  const lesson = lessonFor(base, { kind: "properties" });
  const s = clone(base);
  const pos = s.layers.find((l) => l.name === "Title").properties.find((p) => p.display_name === "Position");
  pos.keys.splice(2, 1); // one fewer key: one fewer move
  const scale = s.layers.find((l) => l.name === "Title").properties.find((p) => p.display_name === "Scale");
  scale.keys.forEach((k) => (k.time = Math.round((k.time + 4 / 30) * 1000) / 1000));
  const r = check(base, s, lesson);
  assert.equal(r.members.find((m) => m.label === "Title › Position").status, "keys_changed");
  assert.deepEqual(r.still_same, [], "Scale and Opacity no longer start together");
  assert.equal(r.passed, false, "the two graded members are apart, but the changed one could still be in step: held");
});

test("a pass held by changed keys comes back once the member is graded again (keys undone)", () => {
  const base = load(PRACTICE_NOW);
  const lesson = lessonFor(base, { kind: "properties" });
  const title = (snap) => snap.layers.find((l) => l.name === "Title");
  const prop = (snap, name) => title(snap).properties.find((p) => p.display_name === name);
  const by = (k, frames) => (k.time = Math.round((k.time + frames / 30) * 1000) / 1000);
  // Scale and Opacity staggered away from Position; Position itself left in place.
  const staggered = clone(base);
  prop(staggered, "Scale").keys.forEach((k) => by(k, 4));
  prop(staggered, "Opacity").keys.forEach((k) => by(k, 8));
  assert.equal(check(base, staggered, lesson).passed, true, "every member graded and apart");
  // A key added on Position: its move count changes, so the pass is held.
  const added = clone(staggered);
  const pk = prop(added, "Position").keys;
  const last = pk[pk.length - 1];
  pk.push({ ...last, time: Math.round((last.time + 0.5) * 1000) / 1000, value: last.value.map((v) => v + 100) }); // a new move
  const held = check(base, added, lesson);
  assert.equal(held.members.find((m) => m.label === "Title › Position").status, "keys_changed");
  assert.deepEqual(held.still_same, [], "nothing still together among the graded ones");
  assert.equal(held.passed, false, "held, not failed: the changed member is the only thing in the way");
  // Undo the added key: Position is graded again and the pass is back.
  const undone = check(base, staggered, lesson);
  assert.ok(undone.members.every((m) => m.status === "graded"));
  assert.equal(undone.passed, true);
});

test("layers kind: a member whose keys are all gone is keys_changed and holds the pass", () => {
  const { baseline, lesson, current, r } = run("pops-in", { split: ["Dot 1"] });
  assert.equal(r.passed, true, "the starting point passes with the split kept on purpose");
  const s = clone(current);
  const dot = s.layers.find((l) => l.name === "Dot 1");
  for (const p of dot.properties) p.keys = [];
  const held = check(baseline, s, lesson, { split: ["Dot 1"] });
  assert.equal(member(held, "Dot 1").status, "keys_changed");
  assert.equal(held.passed, false);
});

test("another comp: comp_matches false, nothing graded", () => {
  const base = load(PRACTICE_NOW);
  const r = check(base, load(PRACTICE2), lessonFor(base, { kind: "properties" }));
  assert.equal(r.comp_matches, false);
  assert.equal(r.lesson_comp, "Mentor Practice");
  assert.equal(r.passed, false);
  assert.deepEqual(r.members, []);
});

test("layers are matched by unique name, by index when names repeat (row 17)", () => {
  const base = load(PRACTICE2);
  const reordered = load("stand-in/reordered.json");
  const dot1 = base.layers.find((l) => l.name === "Dot 1");
  assert.equal(matchLayer(base, reordered, dot1).index, 7, "found by name at its new place in the stack");
  const twins = clone(base);
  twins.layers.find((l) => l.name === "Dot 3").name = "Dot 1";
  const twinsNow = clone(twins);
  assert.equal(matchLayer(twins, twinsNow, twins.layers.find((l) => l.index === 7)).index, 7, "two named Dot 1: by index");
  const renamed = clone(base);
  renamed.layers.find((l) => l.name === "Dot 2").name = "Dot Two";
  assert.equal(matchLayer(base, renamed, base.layers.find((l) => l.name === "Dot 2")).name, "Dot Two", "renamed in place: by index");
});

test("shifts: the first key's shift in frames, and whether every key moved by it", () => {
  const base = load(PRACTICE2);
  const now = load("stand-in/layers-pass.json");
  const p = (s, layer, name) => s.layers.find((l) => l.name === layer).properties.find((x) => x.display_name === name);
  assert.deepEqual(shifts(p(base, "Dot 2", "Blurriness"), p(now, "Dot 2", "Blurriness"), 30), { frames: 4, moved: true, uniform: true });
  assert.deepEqual(shifts(p(base, "Dot 1", "Opacity"), p(now, "Dot 1", "Opacity"), 30), { frames: 0, moved: false, uniform: true });
});

// ---- FR-013, research R7: other changes come from the raw keys, outside the group

const base = load(PRACTICE_NOW);
const titleGroup = [{ layer_index: 1, paths: ["ADBE Transform Group/ADBE Position", "ADBE Transform Group/ADBE Scale", "ADBE Transform Group/ADBE Opacity"] }];
const prop = (s, layer, name) => s.layers.find((l) => l.name === layer).properties.find((p) => p.display_name === name);

test("other changes: a moved single key (timing() leaves single keys out)", () => {
  const s = clone(base);
  prop(s, "Logo", "Scale").keys[0].time = 0.2;
  assert.deepEqual(otherChanges(base, s, titleGroup), ["Logo › Scale: its single key moved from 0 s to 0.2 s"]);
});

test("other changes: an expression turned off or on, inside the group or out", () => {
  const off = clone(base);
  prop(off, "Logo", "Rotation").expression_enabled = false;
  assert.deepEqual(otherChanges(base, off, titleGroup), ["Logo › Rotation: an expression was turned off"]);
  const on = clone(base);
  prop(on, "Title", "Scale").expression_enabled = true;
  assert.deepEqual(otherChanges(base, on, titleGroup), ["Title › Scale: an expression was turned on"]);
});

test("other changes: a key added or removed, and key times moved, on a property under an expression", () => {
  const s = clone(base);
  prop(s, "Logo", "Rotation").keys.push({ ...prop(s, "Logo", "Rotation").keys[1], index: 3, time: 3 });
  assert.deepEqual(otherChanges(base, s, titleGroup), ["Logo › Rotation has 3 keys now (it had 2)"]);
  const t = clone(base);
  prop(t, "Logo", "Rotation").keys[1].time = 2.5;
  assert.deepEqual(otherChanges(base, t, titleGroup), ["Logo › Rotation: its key at 2 s moved to 2.5 s"]);
});

test("other changes: a property newly animated, or no longer animated", () => {
  const s = clone(base);
  const glow = s.layers.find((l) => l.name === "Glow");
  glow.properties.push({ ...clone(prop(base, "Title", "Opacity")) });
  const bar = s.layers.find((l) => l.name === "Bar");
  bar.properties = bar.properties.filter((p) => p.display_name !== "End");
  const out = otherChanges(base, s, titleGroup);
  assert.ok(out.includes("Glow › Opacity is newly animated"), JSON.stringify(out));
  assert.ok(out.includes("Bar › End is no longer animated"), JSON.stringify(out));
});

test("other changes: a pause given a new value (timing() doesn't count a pause as a move)", () => {
  const mp2 = load(PRACTICE2);
  const s = clone(mp2);
  prop(s, "Pause", "Position").keys[2].value = [600, 900];
  assert.deepEqual(otherChanges(mp2, s, []), ["Pause › Position: the pause from 5.5 s has a new value, so it moves there now"]);
});

test("other changes: key changes inside the group aren't listed (they're the check's to grade)", () => {
  assert.deepEqual(otherChanges(base, load("stand-in/props-pass-landing.json"), titleGroup), []);
});

test("other changes in the check itself, on a stagger that passes", () => {
  const { r } = run("single-key-moved");
  assert.equal(r.passed, true);
  assert.deepEqual(r.other_changes, ["Logo › Scale: its single key moved from 0 s to 0.2 s"]);
});
