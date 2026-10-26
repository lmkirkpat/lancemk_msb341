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

// ---- Groups and crowds (FR-005 as amended, research R2, TD § 15)

const row = (names, { y = 0, kinds = {} } = {}) => names.map((name, i) => ({ name, x: i * 100, y, kind: kinds[name] }));

test("a cluster of 2 to 4 is a group; 5 or more is a crowd, never proposed or trimmed", () => {
  // The 6-layer chain E, A, B, C, D, F: one cluster of 6.
  const chain = comp([
    { name: "E", x: 0, y: 900 }, { name: "A", x: 0, y: 0 }, { name: "B", x: 100, y: 0 }, { name: "C", x: 200, y: 0 }, { name: "D", x: 300, y: 0 },
    { name: "F", x: 0, y: 100, h: 800 },
  ]);
  const p = proposal(chain);
  assert.deepEqual([p.proposal, p.next_proposal, p.reason, p.crowd_size], [null, null, "crowded", 6]);
  assert.deepEqual(proposal(comp(row(["A", "B", "C", "D"]))).proposal, ["A", "B", "C", "D"], "exactly 4 is a group");
  assert.equal(proposal(comp(row(["A", "B", "C", "D", "E"]))).reason, "crowded", "5 is a crowd");
});

test("a matte pair counts as 2 and is never split; a lone pair is a group of 2; a lone layer is neither", () => {
  const pairWith = (n) => {
    const s = comp([...row(["Matte", "Fill"]), ...row(Array.from({ length: n }, (_, i) => `L${i}`), { y: 100 })]);
    s.layer_info[0].is_matte = true;
    s.layer_info[0].enabled = false;
    s.layer_info[1].matte = { layer: 1, type: "alpha" };
    return s;
  };
  assert.deepEqual(proposal(pairWith(0)).proposal, ["Matte", "Fill"], "a lone matte pair is a group of 2");
  assert.equal(proposal(pairWith(2)).proposal.length, 4, "a pair and 2 more is 4");
  assert.equal(proposal(pairWith(3)).reason, "crowded", "a pair linked to 3 layers is 5: a crowd");
  assert.deepEqual(proposal(comp([{ name: "Solo", x: 0, y: 0 }])), { proposal: null, next_proposal: null, reason: "no_group", crowd_size: 0 });
});

test("ranking: text with another kind first, then more layers, then the higher top layer", () => {
  // (a) a 2-layer text-and-shape group beats a 4-layer all-shape group.
  const a = comp([...row(["S1", "S2", "S3", "S4"], { kinds: { S1: "shape", S2: "shape", S3: "shape", S4: "shape" } }), ...row(["Word", "Box"], { y: 600, kinds: { Word: "text", Box: "shape" } })]);
  assert.deepEqual(proposal(a).proposal, ["Word", "Box"]);
  assert.deepEqual(proposal(a).next_proposal, ["S1", "S2", "S3", "S4"]);
  // Only text layers isn't (a): size wins.
  const t = comp([...row(["S1", "S2", "S3"], { kinds: { S1: "shape", S2: "shape", S3: "shape" } }), ...row(["T1", "T2"], { y: 600, kinds: { T1: "text", T2: "text" } })]);
  assert.deepEqual(proposal(t).proposal, ["S1", "S2", "S3"]);
  // (b) more layers, then (c) the higher top layer.
  assert.deepEqual(proposal(comp([...row(["P", "Q"]), ...row(["X", "Y", "Z"], { y: 600 })])).proposal, ["X", "Y", "Z"]);
  const c = comp([...row(["M", "N"]), ...row(["P", "Q"], { y: 600 })]);
  assert.deepEqual([proposal(c).proposal, proposal(c).next_proposal], [["M", "N"], ["P", "Q"]]);
});

test("next_proposal is the second-ranked group, null with one group; nothing links is no_group", () => {
  assert.equal(proposal(comp(row(["A", "B"]))).next_proposal, null);
  assert.equal(proposal(comp([{ name: "A", x: 0, y: 0 }, { name: "B", x: 900, y: 900 }])).reason, "no_group");
});

test("on practice2b.json the proposal is Tile, Caption and Stamp, then Row A to C", () => {
  const p = proposal(load("practice2b.json"));
  assert.deepEqual(p.proposal, KEY.fixtures["practice2b.json"].proposal);
  assert.deepEqual(p.next_proposal, KEY.fixtures["practice2b.json"].next_proposal);
});

test("L-6 on the comp as built, wave A's layers included: Tile, Caption and Stamp, then Chip A to C, and the 13-layer crowd named nowhere", () => {
  const want = KEY.fixtures["practice2b-with-wave-a.json"];
  const s = load("practice2b-with-wave-a.json");
  const p = proposal(s);
  assert.deepEqual(p.proposal, want.proposal);
  assert.deepEqual(p.next_proposal, want.next_proposal);
  assert.equal(p.crowd_size, want.crowd);
  const a = analyze(s);
  const named = new Set([...(a.proposal || []), ...(a.next_proposal || []), ...a.left_out.map((l) => l.layer), ...a.notes.map((n) => n.layer)]);
  for (const n of want.crowd_layers) assert.ok(!named.has(n), `${n} is in the crowd`);
});

test("crowd-only.json: no proposal (crowded), left_out without the crowd, and a named focus of 3 still works", () => {
  const s = load("synthetic/crowd-only.json");
  const a = analyze(s);
  assert.deepEqual([a.proposal, a.next_proposal, a.no_proposal_reason], [null, null, "crowded"]);
  assert.deepEqual(a.left_out.map((l) => l.layer), ["Backdrop"]);
  const f = analyze(s, { skill_options: { focus: ["Brick 2", "Brick 3", "Brick 4"] } });
  assert.deepEqual(f.focus, ["Brick 2", "Brick 3", "Brick 4"]);
});

test("candidates carry kind from layer_info", () => {
  const s = load("practice2b.json");
  for (const c of candidates(s)) assert.equal(c.kind, s.layer_info.find((l) => l.index === c.index).kind, c.layer);
});

test("without comp.width: no_comp_size and no proposal, while a named focus still works (SR-4)", () => {
  const s = load("practice2b.json");
  delete s.comp.width;
  delete s.comp.height;
  assert.deepEqual(proposal(s), { proposal: null, next_proposal: null, reason: "no_comp_size", crowd_size: 0 });
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

test("the finder: a crowd with an empty exclude counts its size with no names; any exclude makes it 0 (L6-2)", () => {
  const s = load("synthetic/crowd-only.json");
  assert.deepEqual(finder(s), { count: 6, layers: [] });
  assert.equal(finder(s, { exclude: [{ layer: "Brick 1", property: "Parent" }] }).count, 0);
  assert.deepEqual(finder(load("practice2b.json")), { count: 3, layers: ["Tile", "Caption", "Stamp"] });
});

test("the finder agrees with the proposal on every fixture and exclude, except a crowd with an empty exclude", () => {
  const files = ["practice2b.json", "practice2b-with-wave-a.json", "null-center.json", "practice2b-parented.json", "review-rows-visible.json", "synthetic/before.json", "synthetic/row36-truncated.json", "synthetic/crowd-only.json"];
  const excludes = [[], ["Tile", "Caption", "Stamp"].map((layer) => ({ layer, property: "Parent" }))];
  for (const f of files) {
    for (const exclude of excludes) {
      const s = load(f);
      const p = proposal(s, { exclude });
      const fd = finder(s, { exclude });
      if (!p.proposal && p.reason === "crowded" && !exclude.length) {
        assert.deepEqual(fd, { count: p.crowd_size, layers: [] }, f);
        continue;
      }
      assert.equal(fd.count, p.proposal ? p.proposal.length : 0, f);
      assert.deepEqual(fd.layers, p.proposal || [], f);
    }
  }
});
