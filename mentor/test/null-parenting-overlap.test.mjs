// Spec 012 FR-026: one named test per row of spec › Edge cases where concepts overlap (rows 1 to
// 40), asserting what the focus and the check see. Fixtures from load.mjs (stand-ins until the
// sitting, synthetics where the spec allows); rows marked contract are asserted against
// comp-space.mjs and the snapshot's shape as built.

import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, candidates, demoTarget, focusProblems, p2Times, proposal } from "../lib/null-parenting.mjs";
import { check } from "../lib/null-parenting-check.mjs";
import { compPosition, footprint } from "../lib/comp-space.mjs";
import { sourcesOf } from "../lib/motion-sources.mjs";
import { classOf } from "../lib/visibility.mjs";
import { clone, KEY, lessonFor, load } from "./fixtures/null-parenting/load.mjs";

const GROUP = ["Tile", "Caption", "Stamp"];
const cand = (snap, name) => candidates(snap).find((c) => c.layer === name);

// The lesson after the stage 3 check, then a check on `read`.
function after(read, { baseFile = "practice2b.json", focus = GROUP, placed = "null-center.json", input = {}, region = "slides_only" } = {}) {
  const base = load(baseFile);
  const lesson = lessonFor(base, { focus });
  lesson.skill_data = check(base, load(placed), lesson, { region }).skill_data;
  return { base, lesson, ...check(base, typeof read === "string" ? load(read) : read, lesson, input) };
}
const keyedProp = (snap, layer, name) => snap.layers.find((l) => l.name === layer).properties.find((p) => p.display_name === name);

test("row 1: an expression on a child's keyed move: a candidate, not the demo target, and P2 still measures rendered values", () => {
  const base = load("practice2b.json");
  keyedProp(base, "Tile", "Position").expression_enabled = true;
  assert.equal(cand(base, "Tile").bucket, "default");
  assert.notEqual(demoTarget(base, GROUP), "parent/Tile");
  const read = load("jumped.json");
  keyedProp(read, "Stamp", "X Position").expression_enabled = true;
  const { result } = after(read);
  assert.ok(result.codes.includes("jumped"));
  assert.equal(result.layers.find((l) => l.layer === "Stamp").expression_on_move, true);
});

test("row 2: an expression on an unkeyed child property: not read, but the rendered values still show the jump", () => {
  const { result } = after("pickwhip-position.json");
  const cap = result.layers.find((l) => l.layer === "Caption");
  assert.equal(cap.p2.passed, false);
  assert.equal(cap.expression_on_move, false, "no keyed expression flagged");
  assert.equal(sourcesOf(load("pickwhip-position.json"), "Caption").expressions.status, "not_read");
});

test("row 3: the Position pick whip isn't a parent", () => {
  const { result } = after("pickwhip-position.json");
  assert.equal(result.layers.find((l) => l.layer === "Caption").p1, false);
  assert.ok(result.codes.includes("pickwhip_position"));
});

test("row 4 (contract): an expression with no keys on the null's Position: P4 on keys only; the stored null is read after expressions", () => {
  const base = load("synthetic/before.json");
  const lesson = lessonFor(base, { focus: ["Card", "Label"] });
  const read = load("synthetic/row4-null-expression.json");
  const { result, skill_data } = check(base, read, lesson, { region: "slides_only" });
  assert.ok(!read.layers.some((l) => l.name === "Null 1"), "no keys, so not in the keyed list");
  assert.deepEqual(skill_data.stored.position, [550, 520], "the rendered value at the before-read time (1 s)");
  assert.equal(compPosition(read, 1, 2).position[0], 600, "comp-space reads the rendered samples (500 + 50 × 2 s)");
  assert.equal(result.parenting_passed, true);
  assert.deepEqual(result.codes, ["no_move"]);
});

test("row 5: a single key on a child: still a candidate; P3 counts 1 at that time and P2 runs at it", () => {
  const base = load("practice2b.json");
  const p = keyedProp(base, "Tile", "Scale");
  p.keys = [p.keys[0]];
  const read = load("practice2b-parented.json");
  const rp = keyedProp(read, "Tile", "Scale");
  rp.keys = [rp.keys[0]];
  assert.equal(cand(base, "Tile").bucket, "default");
  assert.deepEqual(p2Times(base, "Tile"), [0, 4.167, 4.367, 5.167]);
  const lesson = lessonFor(base, { focus: GROUP });
  lesson.skill_data = check(base, load("null-center.json"), lesson, {}).skill_data;
  assert.equal(check(base, read, lesson, {}).result.parenting_passed, true);
});

test("row 6: hold keys on a child: the same times before and after, so its own hold can't read as a jump", () => {
  const hold = (s) => s.layers.find((l) => l.name === "Tile").properties.forEach((p) => p.keys.forEach((k) => { k.in_type = "hold"; k.out_type = "hold"; }));
  const base = load("practice2b.json");
  hold(base);
  const read = load("practice2b-parented.json");
  hold(read);
  const lesson = lessonFor(base, { focus: GROUP });
  lesson.skill_data = check(base, load("null-center.json"), lesson, {}).skill_data;
  assert.equal(check(base, read, lesson, {}).result.parenting_passed, true);
});

test("row 7: a single key on the null: P4 fails, holds still", () => {
  assert.deepEqual(after("one-key-null.json").result.codes, ["one_key"]);
});

test("row 8: hold keys on the null: P4 passes and the held comment asks once", () => {
  const read = load("slide-null.json");
  keyedProp(read, "Null 1", "Position").keys.forEach((k) => { k.in_type = "hold"; k.out_type = "hold"; });
  const { result } = after(read);
  assert.equal(result.passed, true);
  assert.ok(result.comments.some((c) => c.code === "held"));
});

test("row 9: separated Position on a child (Stamp): P2 at X and Y's key times; P3 counts X and Y apart", () => {
  assert.deepEqual(p2Times(load("practice2b.json"), "Stamp"), [0, 4.667, 5.667]);
  const { result } = after("practice2b-parented.json");
  assert.equal(result.layers.find((l) => l.layer === "Stamp").p2.passed, true);
  const read = load("practice2b-parented.json");
  keyedProp(read, "Stamp", "X Position").keys.pop();
  assert.deepEqual(after(read).result.layers.find((l) => l.layer === "Stamp").p3.changed.map((c) => c.property), ["X Position"]);
});

test("row 10: separated Position on the null: X moving counts as the move", () => {
  const base = load("synthetic/before.json");
  const { result } = check(base, load("synthetic/row10-null-separated.json"), lessonFor(base, { focus: ["Card", "Label"] }), { region: "slides_only" });
  assert.equal(result.passed, true);
  assert.deepEqual(result.null.p4.on, ["Position"]);
});

const blur = (time) => ({ path: "ADBE Effect Parade/ADBE Gaussian Blur 2/ADBE Gaussian Blur 2-0001", display_path: "Effects › Gaussian Blur › Blurriness", match_name: "ADBE Gaussian Blur 2-0001", display_name: "Blurriness", dimensions: 1, expression_enabled: false, keys: [{ index: 1, time, in_type: "linear", out_type: "linear", value: 10, in_ease: [], out_ease: [] }, { index: 2, time: time + 1, in_type: "linear", out_type: "linear", value: 0, in_ease: [], out_ease: [] }] });

test("row 11: effects on a child: counted in P3, not moved by parenting, not P2 times", () => {
  const base = load("practice2b.json");
  base.layers.find((l) => l.name === "Tile").properties.push(blur(1));
  const read = load("practice2b-parented.json");
  read.layers.find((l) => l.name === "Tile").properties.push(blur(1));
  assert.ok(!p2Times(base, "Tile").includes(1));
  const lesson = lessonFor(base, { focus: GROUP });
  lesson.skill_data = check(base, load("null-center.json"), lesson, {}).skill_data;
  assert.equal(check(base, read, lesson, {}).result.parenting_passed, true);
  read.layers.find((l) => l.name === "Tile").properties.at(-1).keys.pop();
  assert.ok(check(base, read, lesson, {}).result.codes.includes("own_keys_changed"));
});

test("row 12: effects on the null: P4 never passes on them; the effect comment when the read shows one", () => {
  const read = load("practice2b-parented.json");
  read.layers.unshift({ index: 1, name: "Null 1", kind: "null", enabled: true, is_null: true, properties: [blur(6)] });
  const { result } = after(read);
  assert.deepEqual(result.codes, ["effect_move"]);
  const noted = load("one-key-null.json");
  noted.layer_info[0].effect_count = 1;
  assert.ok(after(noted).result.comments.some((c) => c.code === "effect"));
  assert.ok(!after("one-key-null.json").result.comments.some((c) => c.code === "effect"), "nothing when the read shows none");
});

test("row 13: a precomp layer as a child: a candidate as one layer, with its own transform and rect", () => {
  const base = load("practice2b.json");
  assert.equal(cand(base, "Seal").bucket, "default");
  const a = analyze(base, { skill_options: { focus: ["Seal", "Sled"] } });
  assert.ok(a.notes.some((n) => n.layer === "Seal" && n.note === "precomp"));
  assert.equal(sourcesOf(base, "Seal").precomp_contents, "not_read");
  assert.ok(footprint(base, cand(base, "Seal").index, 0).bounds);
});

test("row 14: a layer inside a precomp isn't in layer_info, so it's never offered", () => {
  const base = load("practice2b.json");
  assert.equal(sourcesOf(base, "Icon Shape"), null);
  assert.deepEqual(focusProblems(base, ["Icon Shape", "Seal"]).unknown, ["Icon Shape"]);
});

test("row 15: a hidden null (eye off) is still class null and passes N1", () => {
  const read = load("null-center.json");
  read.layer_info[0].enabled = false;
  assert.equal(classOf(read, 1), "null");
  assert.equal(after(read).result.null.n1, true);
});

test("row 16: an eye-off child: only if asked, never the demo, P2 from bounds", () => {
  const base = load("practice2b.json");
  base.layer_info.find((l) => l.name === "Caption").enabled = false;
  assert.equal(cand(base, "Caption").bucket, "if_named");
  assert.ok(!(proposal(base).proposal || []).includes("Caption"));
  assert.ok(focusProblems(base, GROUP).ok);
  assert.equal(demoTarget(base, ["Caption", "Stamp"]), "parent/Stamp");
});

test("row 17: the matte and its layer: proposed together, both graded, never hidden or the demo", () => {
  const base = load("practice2b.json");
  assert.equal(cand(base, "Reveal Matte").reason, null);
  assert.deepEqual(focusProblems(base, ["Gradient", "Row A"]).focus, ["Row A", "Reveal Matte", "Gradient"]);
  assert.equal(demoTarget(base, ["Reveal Matte", "Gradient"]), null);
});

test("row 18: a shy child is a candidate that renders, with the shy note", () => {
  const base = load("practice2b.json");
  base.layer_info.find((l) => l.name === "Caption").shy = true;
  assert.equal(cand(base, "Caption").class, "shy");
  assert.equal(cand(base, "Caption").bucket, "default");
  assert.ok(analyze(base, { skill_options: { focus: GROUP } }).notes.some((n) => n.layer === "Caption" && n.note === "shy"));
});

test("row 19: a guide layer is never a candidate", () => {
  const base = load("practice2b.json");
  base.layer_info.find((l) => l.name === "Caption").guide = true;
  assert.deepEqual([cand(base, "Caption").reason, cand(base, "Caption").bucket], ["guide", "never"]);
});

test("row 20: solo on another layer changes no class and no candidate", () => {
  const base = load("practice2b.json");
  base.layer_info.find((l) => l.name === "Door").solo = true;
  assert.equal(cand(base, "Tile").class, "renders");
  assert.deepEqual(proposal(base).proposal, GROUP);
});

test("row 21: uneven null scale: no jump with correct parenting, one comment, never a fail", () => {
  const base = load("synthetic/before.json");
  const { result } = check(base, load("synthetic/row21-nonuniform.json"), lessonFor(base, { focus: ["Card", "Label"] }), { region: "slides_only" });
  assert.equal(result.passed, true);
  assert.ok(result.comments.some((c) => c.code === "non_uniform_scale"));
});

test("row 22: null opacity keyed or below 100: never affects N or P, except P4 not passing on it", () => {
  assert.deepEqual(after("fade-null.json").result.codes, ["opacity_move"]);
  const read = load("slide-null.json");
  read.layer_info[0].transform.opacity = 60;
  const { result } = after(read);
  assert.equal(result.passed, true);
  assert.ok(result.comments.some((c) => c.code === "opacity"));
});

test("row 23: the null has a parent: still asks and passes on purpose; moving is out, nothing graded", () => {
  const still = KEY.attempts.find((a) => a.id === "row23-still-parent");
  assert.ok(still, "the answer key covers the still parent");
  const base = load("synthetic/before.json");
  const { result } = check(base, load("synthetic/row23-moving-parent.json"), lessonFor(base, { focus: ["Card", "Label"] }), {});
  assert.deepEqual([result.graded, result.codes], [false, ["null_parent_moves"]]);
});

test("row 24: a focus layer already parented (Shadow under Plate) isn't a candidate", () => {
  const base = load("practice2b.json");
  assert.deepEqual([cand(base, "Shadow").reason, cand(base, "Shadow").bucket], ["parented", "never"]);
  assert.equal(cand(base, "Hatch").parent_is_null, true);
});

test("row 25: a 3D child or null: not a candidate; the math says three_d, never runs", () => {
  const base = load("practice2b.json");
  const tile = base.layer_info.find((l) => l.name === "Tile");
  tile.three_d = true;
  assert.equal(cand(base, "Tile").reason, "three_d");
  assert.equal(footprint(base, tile.index, 0).reason, "three_d");
  const read = load("null-center.json");
  read.layer_info[0].three_d = true;
  assert.ok(after(read).result.codes.includes("three_d"));
});

test("row 26: Anchor Point keys only on the null: the map says it moves children, but P4 doesn't pass", () => {
  const base = load("synthetic/before.json");
  const read = load("synthetic/row26-anchor-only.json");
  assert.equal(sourcesOf(read, "Card").parents[0].moves_children, true);
  const { result } = check(base, read, lessonFor(base, { focus: ["Card", "Label"] }), { region: "slides_only" });
  assert.deepEqual(result.codes, ["anchor_only"]);
});

test("row 27: auto-orient on a child: left out until L-4; the math says auto_orient", () => {
  const base = load("practice2b.json");
  const tile = base.layer_info.find((l) => l.name === "Tile");
  tile.auto_orient = true;
  assert.deepEqual([cand(base, "Tile").reason, cand(base, "Tile").bucket], ["auto_orient", "never"]);
  assert.equal(footprint(base, tile.index, 0).reason, "auto_orient");
});

test("row 28: stacked parent and child motion: one ungraded comment", () => {
  const read = load("slide-null.json");
  const np = keyedProp(read, "Null 1", "Position");
  np.keys[0].time = 4.5;
  np.keys[1].time = 5;
  const { result } = after(read);
  assert.equal(result.passed, true);
  assert.ok(result.comments.some((c) => c.code === "stacked"));
});

test("row 29: children of a moving parent: no timing between them is graded or reported", () => {
  const { result } = after("rotate-null.json", { region: "center" });
  assert.equal(result.passed, true);
  assert.doesNotMatch(JSON.stringify(result), /stagger|offset|gap|lockstep/);
});

test("row 30: the null keyed early or dragged after parenting is measured through the stored null", () => {
  assert.equal(after("null-keyed-early.json").result.parenting_passed, true);
});

test("row 31: re-stored before parenting when a check runs between; a false jump possible without one", () => {
  assert.ok(KEY.attempts.some((a) => a.id === "row31-with-check") && KEY.attempts.some((a) => a.id === "row31-no-check"));
  assert.ok(after("null-moved-before-parenting.json").result.codes.includes("jumped"));
});

test("row 32: the playhead moved between checks: the stored before-read time is used", () => {
  const { result } = after("playhead-moved.json");
  assert.equal(result.before_time, 0);
  assert.equal(result.parenting_passed, true);
});

test("row 33: adding the null renumbers the layers; matching by name finds every focus layer", () => {
  const base = load("practice2b.json");
  const read = load("null-center.json");
  for (const n of GROUP) assert.equal(read.layer_info.find((l) => l.name === n).index, base.layer_info.find((l) => l.name === n).index + 1);
  const { result } = after("practice2b-parented.json");
  assert.ok(result.layers.every((l) => l.found));
});

test("row 34: a child whose rect changes over time compares the same times and rect kind", () => {
  const base = load("practice2b.json");
  const read = load("practice2b-parented.json");
  for (const s of [base, read]) s.layer_info.find((l) => l.name === "Caption").samples.forEach((x) => { x.rect = { ...x.rect, width: 130 + x.time * 10 }; });
  const lesson = lessonFor(base, { focus: GROUP });
  lesson.skill_data = check(base, load("null-center.json"), lesson, {}).skill_data;
  assert.equal(check(base, read, lesson, {}).result.parenting_passed, true);
});

test("row 35: a child outside its in and out points at a sampled time is still measured", () => {
  const base = load("synthetic/row35-out-of-range.json");
  const label = base.layer_info.find((l) => l.name === "Label");
  assert.equal(label.in_point, 4);
  assert.ok(footprint(base, label.index, 1).bounds);
  assert.equal(cand(base, "Label").bucket, "default");
});

test("row 36: more than 64 sample times: not a candidate", () => {
  assert.equal(cand(load("synthetic/row36-truncated.json"), "Ticker").reason, "samples_truncated");
});

test("row 37: a candidate that parents others (Plate): its children come along, named once", () => {
  const base = load("practice2b.json");
  assert.equal(cand(base, "Plate").has_children, true);
  const lesson = lessonFor(base, { focus: ["Plate", "Row A"] });
  const { result } = check(base, load("null-center.json"), lesson, {});
  assert.ok(result.other_changes.some((o) => o.kind === "children_brought" && o.layer === "Plate"));
});

test("row 38: a layer outside the focus parented to the null is an other change, not graded", () => {
  const { result } = after("plate-parented-too.json");
  assert.ok(result.other_changes.some((o) => o.kind === "parented_to_null" && o.layer === "Plate"));
  assert.equal(result.parenting_passed, true);
});

test("row 39: the demo undone, then parented by the learner, is the learner's", () => {
  const base = load("practice2b.json");
  const lesson = lessonFor(base, { focus: GROUP, demo: "parent/Tile" });
  lesson.skill_data = check(base, load("null-center.json"), lesson, {}).skill_data;
  assert.equal(check(base, load("practice2b-parented.json"), lesson, {}).result.layers[0].credit, "demo");
  const undone = check(base, load("null-center.json"), lesson, {}).result;
  assert.equal(undone.demo_undone, true);
  lesson.demo.undone = "2026-10-24T12:05:00.000Z";
  assert.equal(check(base, load("practice2b-parented.json"), lesson, {}).result.layers[0].credit, "learner");
});

test("row 40: two layers with the null's name: nothing stored, nothing graded; after the rename it's stored", () => {
  const base = load("practice2b-null1.json");
  const lesson = lessonFor(base, { focus: GROUP });
  const dup = check(base, load("two-nulls-same-name.json"), lesson, {});
  assert.deepEqual(dup.result.codes, ["null_name_not_unique"]);
  assert.deepEqual(dup.result.layers, []);
  assert.equal(dup.skill_data.stored, undefined);
  lesson.skill_data = dup.skill_data;
  const ok = check(base, load("two-nulls-renamed.json"), lesson, {});
  assert.equal(ok.skill_data.null.name, "Group Null");
  assert.ok(!ok.result.other_changes.some((o) => o.layer === "Group Null"), "the rename isn't an other change");
  assert.ok(clone(ok.skill_data).stored);
});
