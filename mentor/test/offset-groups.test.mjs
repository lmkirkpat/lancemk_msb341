// Spec 010 FR-004 to FR-006, FR-009, FR-020 (research R2 to R4): forming groups of both kinds, the
// proposal, what's left out, the demo target from the learner's order, review exclusions, target
// IDs and refs, and the finder agreeing with the analysis on every fixture.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyze, finder, groups } from "../lib/offset.mjs";
import { clone, DIR, KEY, load, PRACTICE2, PRACTICE2_60, PRACTICE_NOW } from "./fixtures/offset/load.mjs";

const now = load(PRACTICE_NOW);
const mp2 = load(PRACTICE2);
const keyNow = KEY.focus["stand-in/practice-now.json"];
const keyMp2 = KEY.focus["stand-in/practice2-before.json"];
const labels = (g) => g.members.map((m) => m.label);
const propPairs = (g) => g.members.map((m) => [m.label, m.move_index]);

test("Mentor Practice: the properties group is Title's Position (move 1), Scale and Opacity, and it's the proposal", () => {
  const a = analyze(now);
  assert.equal(a.proposed_kind, keyNow.proposed_kind);
  assert.equal(a.group.kind, "properties");
  assert.equal(a.group.layer, keyNow.properties.layer);
  assert.deepEqual(propPairs(a.group), keyNow.properties.members);
  assert.equal(a.group.start, keyNow.properties.start);
  assert.equal(a.group.end, keyNow.properties.end);
  assert.equal(a.focus.length, 1);
  assert.deepEqual(a.targets, keyNow.targets);
});

test("Mentor Practice: the other kind is the layers kind, Bar and Glow at 0 s", () => {
  const a = analyze(now);
  assert.equal(a.other_kind, "layers");
  assert.deepEqual(labels(a.other_group), keyNow.layers.members);
  assert.equal(a.other_group.start, keyNow.layers.start);
  const g = groups(now);
  assert.deepEqual(g.layers.map(labels), keyNow.all_layer_groups, "Title and the Cursor (its first jump) at 0.5 s are the second pair");
  assert.deepEqual(g.properties.map((x) => [x.layer, labels(x)]), keyNow.all_property_groups);
});

test("Mentor Practice: CTRL, Old Take, Logo's Rotation and Icon are left out with their reasons", () => {
  const out = Object.fromEntries(analyze(now).left_out.map((x) => [x.reason, x.layers]));
  assert.deepEqual(out, keyNow.left_out);
  const expr = analyze(now).left_out.find((x) => x.reason === "expression");
  assert.deepEqual(expr.properties, [{ layer: "Logo", property: "Rotation" }]);
});

test("Mentor Practice 2: the largest layers group is Dot 1 to 3, then the Chips; Badge is a properties group", () => {
  const g = groups(mp2);
  assert.deepEqual(g.layers.map(labels), keyMp2.all_layer_groups);
  assert.deepEqual(g.properties.map((x) => x.layer), keyMp2.property_group_layers);
  const badge = g.properties.find((x) => x.layer === "Badge");
  assert.deepEqual(labels(badge), ["Scale", "Opacity"]);
});

test("Mentor Practice 2: Dot 1's start is its 0.5 s jump, and its Position joins through the ramp after it", () => {
  const g = groups(mp2);
  const dots = g.layers[0].members;
  assert.equal(dots.find((m) => m.layer === "Dot 1").start, 0.5);
  const dot1 = g.properties.find((x) => x.layer === "Dot 1");
  assert.equal(dot1.members.find((m) => m.label === "Position").move_index, keyMp2.dot1_position_move);
});

test("a tie goes to the properties kind (Dot 2's three properties against the three Dots)", () => {
  const a = analyze(mp2);
  assert.equal(a.proposed_kind, keyMp2.proposed_kind);
  assert.deepEqual(propPairs(a.group), keyMp2.properties.members);
  assert.equal(a.other_kind, "layers");
  assert.deepEqual(labels(a.other_group), keyMp2.layers.members);
});

test("the learner can pick the other kind; the other group is then the one offered", () => {
  const a = analyze(mp2, { skill_options: { kind: "layers" } });
  assert.deepEqual(labels(a.group), keyMp2.layers.members);
  assert.deepEqual(a.targets, keyMp2.layers_targets);
  assert.deepEqual(labels(a.other_group), ["Position", "Opacity", "Blurriness"]);
});

test("within a kind, a tie goes to the earlier start, then the comp's layer order", () => {
  // Dots (0.5 s) and Chips (2 s) are both 3 layers: the Dots start earlier.
  assert.deepEqual(labels(groups(mp2).layers[0]), ["Dot 1", "Dot 2", "Dot 3"]);
  // Chips moved to 0.4 s: same size, earlier start, so the Chips come first.
  const s = clone(mp2);
  for (const l of s.layers.filter((x) => x.name.startsWith("Chip"))) for (const p of l.properties) for (const k of p.keys) k.time = Math.round((k.time - 1.6) * 1000) / 1000;
  assert.deepEqual(labels(groups(s).layers[0]), ["Chip A", "Chip B", "Chip C"]);
  // Chips at 0.5 s with the Dots: one cluster of six, so the first 5 in layer order. (Equal size
  // and start across groups shows in the properties kind: Chip A, B, C in layer order, test above.)
  for (const l of s.layers.filter((x) => x.name.startsWith("Chip"))) for (const p of l.properties) for (const k of p.keys) k.time = Math.round((k.time + 0.1) * 1000) / 1000;
  const g = groups(s).layers;
  assert.equal(g.length, 1, "within the floor of each other, the six make one cluster");
  assert.deepEqual(labels(g[0]), ["Dot 1", "Dot 2", "Dot 3", "Chip A", "Chip B"], "more than 5: the first 5 in layer order");
});

test("demo target: none before an order, the second in the order after, none for two members or a gap under the floor", () => {
  for (const want of keyNow.demo_targets) {
    const a = analyze(now, { skill_options: { order: want.order ?? undefined, gap_frames: want.gap_frames ?? undefined } });
    assert.equal(a.demo_target, want.demo_target, JSON.stringify(want));
    if (want.no_demo_reason) assert.equal(a.no_demo_reason, want.no_demo_reason);
  }
  for (const want of keyMp2.demo_targets) {
    const a = analyze(mp2, { skill_options: { kind: want.kind, order: want.order, gap_frames: want.gap_frames } });
    assert.equal(a.demo_target, want.demo_target, JSON.stringify(want));
    if (want.no_demo_reason) assert.equal(a.no_demo_reason, want.no_demo_reason);
  }
  for (const want of KEY.focus["stand-in/practice2-60fps.json"].demo_targets) {
    const a = analyze(load(PRACTICE2_60), { skill_options: { kind: want.kind, order: want.order, gap_frames: want.gap_frames } });
    assert.equal(a.demo_target, want.demo_target, `60 fps ${JSON.stringify(want)}`);
  }
  const two = analyze(load("synthetic/two-held-jumps.json"), { skill_options: { order: ["Opacity", "Scale"], gap_frames: 4 } });
  assert.equal(two.demo_target, null);
  assert.equal(two.no_demo_reason, "two_members");
});

test("demo target: the next in order when the second has an expression on a keyed property", () => {
  const s = clone(mp2);
  s.layers.find((l) => l.name === "Dot 2").properties.find((p) => p.display_name === "Blurriness").expression_enabled = true;
  const a = analyze(s, { skill_options: { kind: "layers", order: ["Dot 1", "Dot 2", "Dot 3"], gap_frames: 4 } });
  assert.equal(a.demo_target, "layer/7");
});

test("an order naming all but the last member counts; a name that isn't a member doesn't", () => {
  const a = analyze(now, { skill_options: { order: ["Opacity", "Scale"], gap_frames: 4 } });
  assert.deepEqual(a.order, ["Opacity", "Scale", "Position"]);
  assert.equal(a.demo_target, "1/Transform › Scale/1");
  const b = analyze(now, { skill_options: { order: ["Opacity", "Rotation", "Scale"], gap_frames: 4 } });
  assert.equal(b.demo_target, null);
  assert.equal(b.no_demo_reason, "awaiting_order");
  assert.deepEqual(b.order_unmatched, ["Rotation"]);
});

test("exclude drops matching units before grouping; nothing left gives no group", () => {
  const dots = keyMp2.layers_target_refs.map(([layer, property]) => ({ layer, property }));
  const a = analyze(mp2, { exclude: dots });
  assert.equal(a.group.kind, keyMp2.review_after_dots.kind);
  assert.deepEqual(labels(a.group), keyMp2.review_after_dots.members);
  assert.ok(a.targets.every((t) => !["layer/5", "layer/6", "layer/7"].includes(t)));
  const everything = groups(mp2).pool.flatMap((p) => p.units.map((u) => ({ layer: p.tl.layer, property: u.name })));
  const none = analyze(mp2, { exclude: everything });
  assert.equal(none.group, null);
  assert.deepEqual(none.targets, []);
  assert.equal(none.no_demo_reason, "no_group");
});

test("a group already staggered isn't a group", () => {
  const staggered = load("stand-in/layers-pass.json");
  const g = groups(staggered);
  assert.ok(!g.layers.some((x) => labels(x).includes("Dot 2") && labels(x).includes("Dot 3")));
});

test("target IDs and refs: layers kind, one ID per layer and every counted unit as a ref; properties kind, one each", () => {
  const layersKind = analyze(mp2, { skill_options: { kind: "layers" } });
  assert.deepEqual(layersKind.targets, keyMp2.layers_targets);
  assert.deepEqual(layersKind.target_refs.map((r) => [r.layer, r.property]), keyMp2.layers_target_refs);
  const props = analyze(now);
  assert.deepEqual(props.target_refs, [
    { layer: "Title", property: "Position" }, { layer: "Title", property: "Scale" }, { layer: "Title", property: "Opacity" },
  ]);
});

test("the learner can name layers, a hidden one included; a null or a precomp is refused", () => {
  const a = analyze(now, { skill_options: { kind: "layers", members: ["Title", "Old Take", "CTRL", "Icon"] } });
  assert.deepEqual(labels(a.group), ["Title", "Old Take"]);
  assert.deepEqual(a.refused_members, [{ layer: "CTRL", reason: "null" }, { layer: "Icon", reason: "precomp" }]);
  assert.throws(() => analyze(now, { skill_options: { members: ["Nope"] } }), { code: "UNKNOWN_LAYER" });
  assert.throws(() => analyze(now, { focus_layers: ["Nope"] }), { code: "UNKNOWN_LAYER" });
});

test("frame_together is inside the group's shared motion, on a frame", () => {
  const a = analyze(now);
  assert.ok(a.frame_together > 0.5 && a.frame_together < 1.5);
  assert.ok(Math.abs(a.frame_together * 30 - Math.round(a.frame_together * 30)) < 0.05);
});

test("FINDERS focus agrees with the analysis on every fixture, with and without exclude", async () => {
  const { FINDERS } = await import("../tools/offset.mjs");
  const f = FINDERS["timing.offset"];
  const files = ["stand-in", "synthetic"].flatMap((d) => fs.readdirSync(path.join(DIR, d)).filter((x) => x.endsWith(".json")).map((x) => `${d}/${x}`));
  const dots = keyMp2.layers_target_refs.map(([layer, property]) => ({ layer, property }));
  for (const rel of files) {
    const snap = load(rel);
    for (const exclude of [[], dots]) {
      const a = analyze(snap, { exclude });
      const r = f.focus(snap, { exclude, kept_linear: [] });
      assert.equal(r.count > 0, a.group !== null, rel);
      assert.equal(r.count, a.group ? a.group.members.length : 0, rel);
      assert.deepEqual(r, finder(snap, { exclude }));
    }
  }
});
