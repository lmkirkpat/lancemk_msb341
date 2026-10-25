// Spec 012's candidates, proposal and demo target (FR-003 to FR-008; research R1, R2): from
// layer_info, matte pairs whole, unique names first, the 2% rule, the largest group, and the
// finder agreeing with the proposal.

import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, candidates, demoTarget, finder, focusProblems, proposal } from "../lib/null-parenting.mjs";
import { clone, KEY, load } from "./fixtures/null-parenting/load.mjs";

const byLayer = (snap) => new Map(candidates(snap).map((c) => [c.layer, c]));

// A small hand-made comp: solids at time 0, one sample each, 1920 wide unless told otherwise.
function comp(layers, { width = 1920, height = 1080 } = {}) {
  return {
    synthetic: "SYNTHETIC (spec 012 proposal tests)", project: "Synthetic.aep",
    comp: { id: 700, name: "Rule", duration: 4, frame_rate: 30, time: 0, hide_shy: false, ...(width ? { width, height } : {}) },
    layers: [], precomp_layers: [],
    layer_info: layers.map((l, i) => ({
      index: i + 1, name: l.name, kind: l.kind || "solid", enabled: l.enabled ?? true, is_null: l.kind === "null", adjustment: !!l.adjustment,
      has_video: true, three_d: false, collapse: false, auto_orient: false, parent: l.parent ?? null, shy: false, solo: false, guide: false,
      locked: false, in_point: 0, out_point: 4, start_time: 0, stretch: 100, time_remap: false, matte: null, is_matte: false,
      motion_blur: false, effect_count: 0, transform: { anchor: [0, 0, 0], position: [l.x, l.y, 0], scale: [100, 100, 100], rotation: 0, opacity: 100 },
      samples: [{ time: 0, anchor: [0, 0, 0], position: [l.x, l.y, 0], scale: [100, 100, 100], rotation: 0, rect: { left: 0, top: 0, width: l.w ?? 100, height: l.h ?? 100 }, rect_extents: null }],
      samples_truncated: false,
    })),
  };
}

// ---- Candidates (FR-004)

test("candidates come from layer_info: Row B, with no keys, is one (filter 1)", () => {
  const s = load("practice2b.json");
  assert.ok(!s.layers.some((l) => l.name === "Row B"), "Row B isn't in the keyed list");
  assert.equal(byLayer(s).get("Row B").bucket, "default");
});

test("a matte and its layer are one pair, counted as 2, never split, never called hidden (row 17)", () => {
  const s = load("practice2b.json");
  const c = byLayer(s);
  assert.equal(c.get("Reveal Matte").class, "matte");
  assert.equal(c.get("Reveal Matte").reason, null, "eye off by design, not hidden");
  assert.equal(c.get("Reveal Matte").matte_pair, "Gradient");
  assert.equal(c.get("Gradient").matte_pair, "Reveal Matte");
  const p = focusProblems(s, ["Gradient", "Row A"]);
  assert.deepEqual(p.focus, ["Row A", "Reveal Matte", "Gradient"], "naming one brings the other");
  assert.deepEqual(p.matte_added, ["Reveal Matte"]);
  assert.equal(focusProblems(s, ["Gradient", "Row A", "Row B", "Row C"]).size, "too_many", "the pair counts as 2 toward the 4");
  // Proposed together: drop everything else nearby, and the pair is the group.
  const only = proposal(s, { exclude: ["Tile", "Caption", "Stamp", "Row A", "Row B", "Row C"].map((layer) => ({ layer, property: "Parent" })) });
  assert.deepEqual(only.proposal, ["Reveal Matte", "Gradient"]);
});

test("Shadow (parented), nulls, guides, cameras, lights, 3D, auto-oriented and truncated layers are out with their reason", () => {
  const s = load("practice2b.json");
  const c = byLayer(s);
  assert.equal(c.get("Shadow").reason, "parented");
  assert.equal(c.get("Shadow").parent, "Plate");
  assert.equal(c.get("Shadow").parent_is_null, false);
  assert.equal(c.get("Hatch").parent_is_null, true);
  assert.equal(c.get("Hatch Rig").reason, "null");
  const x = clone(s);
  const set = (name, f) => f(x.layer_info.find((l) => l.name === name));
  set("Door", (l) => (l.guide = true));
  set("Needle", (l) => (l.three_d = true));
  set("Gauge", (l) => (l.auto_orient = true));
  set("Lid", (l) => (l.samples_truncated = true));
  set("Tab", (l) => (l.kind = "camera"));
  set("Peg", (l) => (l.kind = "light"));
  const cx = byLayer(x);
  assert.deepEqual(["Door", "Needle", "Gauge", "Lid", "Tab", "Peg"].map((n) => cx.get(n).reason), ["guide", "three_d", "auto_orient", "samples_truncated", "camera", "light"]);
  for (const n of ["Door", "Needle", "Gauge", "Lid", "Tab", "Peg", "Shadow", "Hatch Rig"]) assert.equal(cx.get(n).bucket, "never", n);
  assert.equal(byLayer(load("synthetic/row36-truncated.json")).get("Ticker").reason, "samples_truncated", "row 36");
});

test("a hidden layer is if_named; a full-frame solid and an adjustment layer are never proposed but allowed if picked", () => {
  const s = load("practice2b.json");
  const x = clone(s);
  x.layer_info.find((l) => l.name === "Caption").enabled = false;
  const tab = x.layer_info.find((l) => l.name === "Tab");
  tab.adjustment = true;
  tab.kind = "adjustment";
  const c = byLayer(x);
  assert.deepEqual([c.get("Caption").reason, c.get("Caption").bucket], ["hidden", "if_named"]);
  assert.deepEqual([c.get("Background").reason, c.get("Background").bucket], ["full_frame", "if_named"]);
  assert.deepEqual([c.get("Tab").reason, c.get("Tab").bucket], ["adjustment", "if_named"]);
  const rows = ["Row A", "Row B", "Row C"].map((layer) => ({ layer, property: "Parent" }));
  assert.deepEqual(proposal(x, { exclude: rows }).proposal, ["Tile", "Stamp"], "hidden Caption isn't proposed");
  assert.ok(focusProblems(x, ["Caption", "Tile"]).ok, "but it's allowed when named");
  assert.ok(focusProblems(x, ["Background", "Tile"]).ok);
});

test("Plate brings its children: brings_children names Shadow", () => {
  const s = load("practice2b.json");
  const a = analyze(s, { skill_options: { focus: ["Plate", "Row A"] } });
  assert.deepEqual(a.notes.find((n) => n.layer === "Plate"), { layer: "Plate", note: "brings_children", children: ["Shadow"] });
});

test("two layers called Shape Layer 1: name_not_unique, never proposed, and no focus (rename_needed)", () => {
  const s = comp([{ name: "Shape Layer 1", x: 100, y: 100 }, { name: "Shape Layer 1", x: 150, y: 100 }, { name: "Dot", x: 200, y: 100 }]);
  const c = candidates(s);
  assert.deepEqual(c.map((x) => x.reason), ["name_not_unique", "name_not_unique", null]);
  assert.equal(proposal(s).proposal, null);
  const a = analyze(s, { skill_options: { focus: ["Shape Layer 1", "Dot"] } });
  assert.equal(a.focus, null);
  assert.deepEqual(a.rename_needed, ["Shape Layer 1"]);
  assert.deepEqual(a.targets, []);
  assert.deepEqual(a.duplicate_names, ["Shape Layer 1"]);
});

// ---- The 2% rule and the largest group (FR-005)

test("the 2% rule: a gap of exactly 2% of the comp's width links and just over doesn't, on each axis", () => {
  const gap = 0.02 * 1920; // 38.4 px
  const across = (g) => proposal(comp([{ name: "A", x: 0, y: 0 }, { name: "B", x: 100 + g, y: 0 }])).proposal;
  assert.deepEqual(across(gap), ["A", "B"]);
  assert.equal(across(gap + 0.1), null);
  const down = (g) => proposal(comp([{ name: "A", x: 0, y: 0 }, { name: "B", x: 0, y: 100 + g }])).proposal;
  assert.deepEqual(down(gap), ["A", "B"]);
  assert.equal(down(gap + 0.1), null);
  assert.equal(proposal(comp([{ name: "A", x: 0, y: 0 }, { name: "B", x: 100 + gap, y: 100 + gap + 1 }])).proposal, null, "both axes must be close");
  assert.deepEqual(proposal(comp([{ name: "A", x: 0, y: 0 }, { name: "B", x: 100 + 20, y: 0 }], { width: 1000 })).proposal, ["A", "B"], "2% of 1000 is 20");
});

test("the largest group wins; a tie goes to the highest top layer; past 4 the first 4 in stack order that still link", () => {
  const two = [{ name: "P", x: 0, y: 0 }, { name: "Q", x: 100, y: 0 }];
  const three = [{ name: "X", x: 1000, y: 0 }, { name: "Y", x: 1100, y: 0 }, { name: "Z", x: 1200, y: 0 }];
  assert.deepEqual(proposal(comp([...two, ...three])).proposal, ["X", "Y", "Z"]);
  const twoMore = [{ name: "M", x: 1000, y: 500 }, { name: "N", x: 1100, y: 500 }];
  assert.deepEqual(proposal(comp([...twoMore, ...two])).proposal, ["M", "N"], "tie: the group with the higher top layer");
  // A chain of 6 in stack order E, A, B, C, D, F: E links only to F, which is last.
  const chain = comp([
    { name: "E", x: 0, y: 900 }, { name: "A", x: 0, y: 0 }, { name: "B", x: 100, y: 0 }, { name: "C", x: 200, y: 0 }, { name: "D", x: 300, y: 0 },
    { name: "F", x: 0, y: 100, h: 800 },
  ]);
  // E first; then the first in stack order that links to what's kept: F (to E), A (to F), B (to A).
  assert.deepEqual(proposal(chain).proposal, ["E", "A", "B", "F"]);
});

test("on practice2b.json the proposal is Tile, Caption and Stamp (L-6's expectation)", () => {
  assert.deepEqual(proposal(load("practice2b.json")).proposal, KEY.fixtures["practice2b.json"].proposal);
});

test("L-6 on the comp as built, wave A's layers included", { todo: "FR-005's largest-group rule links Mentor Practice 2's wave A layers into a bigger group (Cut and Banner are 10 px apart); the layout (SR-3) or H-4 has to change, not this test" }, () => {
  assert.deepEqual(proposal(load("practice2b-with-wave-a.json")).proposal, KEY.fixtures["practice2b-with-wave-a.json"].l6_expected);
});

test("without comp.width: no_comp_size and no proposal, while a named focus still works (SR-4)", () => {
  const s = load("practice2b.json");
  delete s.comp.width;
  delete s.comp.height;
  assert.deepEqual(proposal(s), { proposal: null, reason: "no_comp_size" });
  const a = analyze(s, { skill_options: { focus: ["Tile", "Caption", "Stamp"] } });
  assert.deepEqual(a.focus, ["Tile", "Caption", "Stamp"]);
  assert.equal(a.no_proposal_reason, "no_comp_size");
  assert.equal(finder(s).count, 0);
});

test("without layer_info: nothing proposed, no targets, and the finder counts 0 (FR-003)", () => {
  const s = load("practice2b.json");
  delete s.layer_info;
  const a = analyze(s, { skill_options: { focus: ["Tile", "Caption"] } });
  assert.equal(a.known, false);
  assert.deepEqual(a.targets, []);
  assert.equal(finder(s).count, 0);
});

// ---- Focus, targets and the demo target (FR-006, FR-008)

test("targets are parent/<name> and target_refs { layer, property: \"Parent\" }; the demo target is Tile", () => {
  const a = analyze(load("practice2b.json"), { skill_options: { focus: ["Stamp", "Tile", "Caption"] } });
  assert.deepEqual(a.focus, ["Tile", "Caption", "Stamp"], "in stack order");
  assert.deepEqual(a.targets, ["parent/Tile", "parent/Caption", "parent/Stamp"]);
  assert.deepEqual(a.target_refs, [{ layer: "Tile", property: "Parent" }, { layer: "Caption", property: "Parent" }, { layer: "Stamp", property: "Parent" }]);
  assert.equal(a.demo_target, KEY.fixtures["practice2b.json"].demo_target_for_group);
  assert.deepEqual(a.p2_times, KEY.fixtures["practice2b.json"].p2_times);
  assert.equal(a.before_time, 0);
});

test("the demo target is never a matte, its layer or an eye-off layer, nor one with an expression on a keyed move; own keys preferred", () => {
  const s = load("practice2b.json");
  assert.equal(demoTarget(s, ["Gradient", "Reveal Matte", "Row B"]), "parent/Row B");
  assert.equal(demoTarget(s, ["Row B", "Row A"]), "parent/Row A", "Row A has its own keys");
  const x = clone(s);
  x.layers.find((l) => l.name === "Tile").properties.find((p) => p.display_name === "Position").expression_enabled = true;
  assert.equal(demoTarget(x, ["Tile", "Caption", "Stamp"]), "parent/Stamp", "row 1: an expression on Tile's keyed Position");
  const locked = clone(s);
  locked.layer_info.find((l) => l.name === "Tile").locked = true;
  assert.equal(demoTarget(locked, ["Tile", "Caption", "Stamp"]), "parent/Stamp", "a locked layer is skipped");
  x.layer_info.find((l) => l.name === "Stamp").enabled = false;
  assert.equal(demoTarget(x, ["Tile", "Caption", "Stamp"]), "parent/Caption");
  assert.equal(demoTarget(x, ["Gradient", "Reveal Matte"]), null);
  assert.equal(analyze(x, { skill_options: { focus: ["Gradient", "Reveal Matte"] } }).no_demo_reason, "no_qualifying_layer");
});

test("a focus of 1 or more than 4, a refused layer or an unknown name sets no focus", () => {
  const s = load("practice2b.json");
  assert.equal(focusProblems(s, ["Tile"]).size, "too_few");
  assert.equal(focusProblems(s, ["Tile", "Caption", "Stamp", "Row A", "Row B"]).size, "too_many");
  assert.deepEqual(focusProblems(s, ["Tile", "Shadow"]).refused, [{ layer: "Shadow", reason: "parented", parent: "Plate" }]);
  assert.throws(() => analyze(s, { skill_options: { focus: ["Tile", "Nope"] } }), (e) => e.code === "UNKNOWN_LAYER");
});

test("review: past targets and already-parented layers are dropped before proposing (FR-024)", () => {
  const s = load("practice2b.json");
  const exclude = ["Tile", "Caption", "Stamp"].map((layer) => ({ layer, property: "Parent" }));
  assert.deepEqual(proposal(s, { exclude }).proposal, KEY.fixtures["practice2b.json"].review_proposal_after_group);
  assert.equal(focusProblems(s, ["Tile", "Row A"], { exclude }).refused[0].reason, "past_target");
});

test("the finder agrees with the proposal on every fixture, with the same exclude", () => {
  const files = ["practice2b.json", "practice2b-with-wave-a.json", "null-center.json", "practice2b-parented.json", "review-rows-visible.json", "synthetic/before.json", "synthetic/row36-truncated.json"];
  const excludes = [[], ["Tile", "Caption", "Stamp"].map((layer) => ({ layer, property: "Parent" }))];
  for (const f of files) {
    for (const exclude of excludes) {
      const s = load(f);
      const p = proposal(s, { exclude }).proposal;
      const fd = finder(s, { exclude });
      assert.equal(fd.count, p ? p.length : 0, f);
      assert.deepEqual(fd.layers, p || [], f);
    }
  }
});
