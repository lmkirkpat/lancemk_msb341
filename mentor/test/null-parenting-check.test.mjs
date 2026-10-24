// Spec 012's check (FR-009, FR-010, FR-013 to FR-016, FR-019 to FR-021; research R5, R6, R8):
// every planted attempt in the answer key, then the rules one by one: N1 to N3, P1, P3 to P5, the
// lesson's null and its name, comments, other changes, and one test per TD § 7 row.

import { test } from "node:test";
import assert from "node:assert/strict";
import { check, findNull, regionOf, storeNull } from "../lib/null-parenting-check.mjs";
import { clone, KEY, lessonFor, load } from "./fixtures/null-parenting/load.mjs";

const GROUP = ["Tile", "Caption", "Stamp"];

// Runs an attempt's checks in order, carrying skill_data from one to the next as the tool does.
export function runAttempt(attempt) {
  const baseline = load(attempt.baseline);
  const lesson = lessonFor(baseline, { focus: attempt.focus, mode: attempt.mode || "lesson" });
  const out = [];
  for (const step of attempt.steps) {
    const { result, skill_data } = check(baseline, load(step.read), lesson, step.input || {});
    if (skill_data) lesson.skill_data = skill_data;
    out.push({ step, result, skill_data: lesson.skill_data });
  }
  return out;
}

function assertStep(id, i, { step, result, skill_data }) {
  const at = `${id} step ${i + 1} (${step.read})`;
  const e = step.expect;
  for (const k of ["stage", "parenting_passed", "passed", "graded"]) if (k in e) assert.equal(result[k], e[k], `${at}: ${k}`);
  if (e.codes) assert.deepEqual([...result.codes].sort(), [...e.codes].sort(), `${at}: codes`);
  if ("stored" in e) assert.equal(!!(result.null && result.null.stored_now), e.stored, `${at}: stored now`);
  if (e.layers_graded === false) assert.deepEqual(result.layers, [], `${at}: no layer graded`);
  for (const [k, v] of Object.entries(e.null || {})) {
    if (v && typeof v === "object") for (const [k2, v2] of Object.entries(v)) assert.deepEqual(result.null[k][k2], v2, `${at}: null.${k}.${k2}`);
    else assert.deepEqual(result.null[k], v, `${at}: null.${k}`);
  }
  for (const [name, want] of Object.entries(e.layers || {})) {
    const l = result.layers.find((x) => x.layer === name);
    assert.ok(l, `${at}: ${name} graded`);
    for (const [k, v] of Object.entries(want)) {
      const got = k === "p2" || k === "p3" ? l[k].passed : ["worst_px", "direction", "time"].includes(k) ? l.p2[k] : l[k];
      assert.deepEqual(got, v, `${at}: ${name}.${k}`);
    }
  }
  if (e.comments) assert.deepEqual(result.comments.map((c) => c.code).sort(), [...e.comments].sort(), `${at}: comments`);
  if (e.comments_include) for (const c of e.comments_include) assert.ok(result.comments.some((x) => x.code === c), `${at}: comment ${c}`);
  for (const want of e.other_changes || []) assert.ok(result.other_changes.some((o) => Object.entries(want).every(([k, v]) => o[k] === v)), `${at}: other change ${JSON.stringify(want)}`);
  return skill_data;
}

for (const attempt of KEY.attempts) {
  test(`answer key: ${attempt.id} (${attempt.story})`, () => {
    runAttempt(attempt).forEach((s, i) => assertStep(attempt.id, i, s));
  });
}

// ---- Every failed check gives the mentor at least one hint (the skill 5 review's lesson)

test("every check that doesn't pass, on every planted attempt, returns at least one hint with a code", () => {
  let failing = 0;
  for (const attempt of KEY.attempts) {
    for (const { step, result } of runAttempt(attempt)) {
      if (result.passed) continue;
      failing++;
      assert.ok(result.hints.length >= 1 && result.codes.length >= 1, `${attempt.id} on ${step.read}: no hint`);
      for (const h of result.hints) assert.match(h.code, /^[a-z_]+$/);
    }
  }
  assert.ok(failing >= 30, `the key plants enough failing checks (${failing})`);
});

// ---- N1 to N3

test("N1 on class null: a hidden null still passes (row 15)", () => {
  const base = load("practice2b.json");
  const read = load("null-center.json");
  read.layer_info[0].enabled = false;
  const { result } = check(base, read, lessonFor(base, { focus: GROUP }), {});
  assert.equal(result.null.n1, true);
  assert.deepEqual(result.codes, ["null_ready"]);
});

test("N1 fails on a layer the learner names that isn't a null", () => {
  const base = load("practice2b.json");
  const { result } = check(base, load("null-center.json"), lessonFor(base, { focus: GROUP }), { null: "Plate" });
  assert.equal(result.null.n1, false);
  assert.ok(result.codes.includes("not_a_null"));
  assert.equal(result.parenting_passed, false);
});

test("N2: a 3D null fails with its own code and stores nothing (row 25)", () => {
  const base = load("practice2b.json");
  const read = load("null-center.json");
  read.layer_info[0].three_d = true;
  const { result, skill_data } = check(base, read, lessonFor(base, { focus: GROUP }), {});
  assert.equal(result.null.n2, false);
  assert.ok(result.codes.includes("three_d"));
  assert.equal(skill_data.stored, undefined);
});

test("N2: a moving parent takes the null out of the lesson: nothing graded, nothing stored", () => {
  const base = load("synthetic/before.json");
  const { result, skill_data } = check(base, load("synthetic/row23-moving-parent.json"), lessonFor(base, { focus: ["Card", "Label"] }), {});
  assert.equal(result.graded, false);
  assert.equal(result.null.n2, "moves");
  assert.deepEqual(result.codes, ["null_parent_moves"]);
  assert.equal(result.hints[0].parent, "Holder");
  assert.equal(skill_data.stored, undefined);
});

test("N2: one_level_only is said once, then never again in the lesson", () => {
  const base = load("synthetic/before.json");
  const lesson = lessonFor(base, { focus: ["Card", "Label"] });
  const first = check(base, load("synthetic/row23-still-parent-placed.json"), lesson, { chain_on_purpose: true });
  assert.ok(first.result.codes.includes("one_level_only"));
  lesson.skill_data = first.skill_data;
  const second = check(base, load("synthetic/row23-still-parent-placed.json"), lesson, {});
  assert.ok(!second.result.codes.includes("one_level_only"));
  assert.equal(second.result.null.n2, true);
});

test("N3: the region is per axis at 10% of the group's combined bounds; slides_only skips it", () => {
  const g = { left: 1100, top: 100, right: 1330, bottom: 230 };
  assert.equal(regionOf([1215, 165], g), "center");
  assert.equal(regionOf([1215 + 23, 165 + 13], g), "center", "exactly 10% across and up-down is in");
  assert.equal(regionOf([1215 + 24, 165], g), "between");
  assert.equal(regionOf([1100, 100], g), "top-left");
  assert.equal(regionOf([1330, 230], g), "bottom-right");
  assert.equal(regionOf([900, 165], g), "outside");
  const base = load("practice2b.json");
  const { result } = check(base, load("null-top-left.json"), lessonFor(base, { focus: GROUP }), { region: "slides_only" });
  assert.equal(result.null.n3, null);
  assert.deepEqual(result.codes, ["null_ready"]);
});

test("N3 that can't be measured holds the pass as cant_check, never a pass", () => {
  const base = load("practice2b.json");
  const read = load("null-center.json");
  read.layer_info[0].samples = read.layer_info[0].samples.filter((s) => s.time !== 0);
  const { result } = check(base, read, lessonFor(base, { focus: GROUP }), { region: "center" });
  assert.equal(result.null.n3.cant_check, true);
  assert.equal(result.null.n3.passed, false);
  assert.ok(result.codes.includes("cant_check"));
});

// ---- P1: the Parent link only

test("P1 reads the Parent link only: the Position pick whip isn't a parent (row 3)", () => {
  const base = load("practice2b.json");
  const lesson = lessonFor(base, { focus: GROUP });
  lesson.skill_data = check(base, load("null-center.json"), lesson, {}).skill_data;
  const { result } = check(base, load("pickwhip-position.json"), lesson, {});
  const cap = result.layers.find((l) => l.layer === "Caption");
  assert.equal(cap.parent, null);
  assert.equal(cap.p1, false);
  assert.ok(result.codes.includes("pickwhip_position"));
});

test("a keyed Position with a new expression and no parent reads as the pick whip too", () => {
  const base = load("practice2b.json");
  const lesson = lessonFor(base, { focus: GROUP });
  lesson.skill_data = check(base, load("null-center.json"), lesson, {}).skill_data;
  const read = load("practice2b-parented.json");
  const tile = read.layer_info.find((l) => l.name === "Tile");
  tile.parent = null;
  read.layers.find((l) => l.name === "Tile").properties.find((p) => p.display_name === "Position").expression_enabled = true;
  const { result } = check(base, read, lesson, {});
  assert.ok(result.hints.some((h) => h.code === "pickwhip_position" && h.layer === "Tile"));
});

// ---- P3: counts and times only

test("P3 compares key counts and times within half a frame, never raw values (B9)", () => {
  const base = load("practice2b.json");
  const lesson = lessonFor(base, { focus: GROUP });
  lesson.skill_data = check(base, load("null-center.json"), lesson, {}).skill_data;
  const read = load("practice2b-parented.json");
  const tilePos = read.layers.find((l) => l.name === "Tile").properties.find((p) => p.display_name === "Position");
  tilePos.keys[0].time += 0.016; // under half a frame at 30 fps
  assert.equal(check(base, read, lesson, {}).result.parenting_passed, true);
  tilePos.keys[0].time += 0.01; // now over
  const { result } = check(base, read, lesson, {});
  assert.ok(result.codes.includes("own_keys_changed"));
  assert.equal(result.layers.find((l) => l.layer === "Tile").p3.passed, false);
});

test("P3 counts separated X and Y apart, and effect keys too", () => {
  const base = load("practice2b.json");
  const lesson = lessonFor(base, { focus: GROUP });
  lesson.skill_data = check(base, load("null-center.json"), lesson, {}).skill_data;
  const read = load("practice2b-parented.json");
  const stamp = read.layers.find((l) => l.name === "Stamp");
  stamp.properties.find((p) => p.display_name === "Y Position").keys.pop();
  const r1 = check(base, read, lesson, {}).result;
  assert.deepEqual(r1.layers.find((l) => l.layer === "Stamp").p3.changed, [{ property: "Y Position", before: 2, now: 1 }]);
  const read2 = load("practice2b-parented.json");
  read2.layers.find((l) => l.name === "Caption").properties.push({ path: "ADBE Effect Parade/ADBE Gaussian Blur 2/ADBE Gaussian Blur 2-0001", display_path: "Effects › Gaussian Blur › Blurriness", match_name: "ADBE Gaussian Blur 2-0001", display_name: "Blurriness", dimensions: 1, expression_enabled: false, keys: [{ index: 1, time: 1, in_type: "linear", out_type: "linear", value: 5, in_ease: [], out_ease: [] }] });
  assert.equal(check(base, read2, lesson, {}).result.layers.find((l) => l.layer === "Caption").p3.passed, false);
});

// ---- P4 and P5

test("P4 counts Position, X, Y, Scale or Rotation with two different values; never Opacity, effects, one key or an unkeyed expression", () => {
  const base = load("practice2b.json");
  const lesson = lessonFor(base, { focus: GROUP });
  lesson.skill_data = check(base, load("null-center.json"), lesson, {}).skill_data;
  const same = load("one-key-null.json");
  const pos = same.layers.find((l) => l.name === "Null 1").properties[0];
  pos.keys.push({ ...pos.keys[0], index: 2, time: 7 });
  assert.deepEqual(check(base, same, lesson, {}).result.codes, ["one_key"], "two keys with the same value hold still");
  const fx = load("practice2b-parented.json");
  fx.layers.unshift({ index: 1, name: "Null 1", kind: "null", enabled: true, is_null: true, properties: [{ path: "ADBE Effect Parade/ADBE Slider Control/ADBE Slider Control-0001", display_path: "Effects › Slider Control › Slider", match_name: "ADBE Slider Control-0001", display_name: "Slider", dimensions: 1, expression_enabled: false, keys: [{ index: 1, time: 6, in_type: "linear", out_type: "linear", value: 0, in_ease: [], out_ease: [] }, { index: 2, time: 7, in_type: "linear", out_type: "linear", value: 9, in_ease: [], out_ease: [] }] }] });
  assert.deepEqual(check(base, fx, lesson, {}).result.codes, ["effect_move"]);
});

test("P5 asks for the region when the move turns or scales with none named (region_needed)", () => {
  const base = load("practice2b.json");
  const lesson = lessonFor(base, { focus: GROUP });
  lesson.skill_data = check(base, load("null-center.json"), lesson, {}).skill_data;
  const { result } = check(base, load("rotate-null.json"), lesson, {});
  assert.deepEqual(result.codes, ["region_needed"]);
  assert.equal(result.passed, false);
  const after = check(base, load("rotate-null.json"), { ...lesson, skill_data: result.null ? lesson.skill_data : lesson.skill_data }, { region: "center" });
  assert.equal(after.result.passed, true);
});

test("parenting_passed without the move; passed only with P4 and P5", () => {
  const [placed, parented] = runAttempt(KEY.attempts.find((a) => a.id === "us1-all-parented"));
  assert.equal(placed.result.parenting_passed, false);
  assert.equal(parented.result.parenting_passed, true);
  assert.equal(parented.result.passed, false);
  assert.equal(parented.result.stage, "move");
});

// ---- Finding the null

test("the null: named, else the one new null, else which_null for several", () => {
  const base = load("practice2b.json");
  const read = load("null-center.json");
  assert.equal(findNull(base, read, {}, {}).name, "Null 1");
  assert.equal(findNull(base, read, {}, { null: "Hatch Rig" }).name, "Hatch Rig");
  const two = clone(read);
  two.layer_info.unshift({ ...clone(two.layer_info[0]), name: "Null 2" });
  two.layer_info.forEach((l, i) => (l.index = i + 1));
  const f = findNull(base, two, {}, {});
  assert.equal(f.found, false);
  assert.deepEqual(f.which_null.sort(), ["Null 1", "Null 2"]);
  const { result } = check(base, two, lessonFor(base, { focus: GROUP }), {});
  assert.ok(result.codes.includes("which_null"));
});

test("an existing null with keys or children is noted once when the learner picks it", () => {
  const base = load("practice2b.json");
  const lesson = lessonFor(base, { focus: GROUP });
  const r1 = check(base, base, lesson, { null: "Hatch Rig" });
  assert.ok(r1.result.codes.includes("existing_null"));
  lesson.skill_data = r1.skill_data;
  assert.ok(!check(base, base, lesson, {}).result.codes.includes("existing_null"));
});

test("two layers with the null's name: nothing stored, no N or P run; after the rename it's stored and checked (row 40)", () => {
  const [dup, renamed] = runAttempt(KEY.attempts.find((a) => a.id === "row40-duplicate-null-name"));
  assert.equal(dup.result.null.name_unique, false);
  assert.equal(dup.result.null.n1, null);
  assert.equal(dup.result.null.n3, null);
  assert.equal(dup.skill_data.stored, undefined);
  assert.equal((dup.skill_data.null || {}).name, undefined, "the name isn't stored either");
  assert.equal(renamed.skill_data.null.name, "Group Null");
  assert.ok(renamed.skill_data.stored);
});

test("a focus layer renamed or deleted is not_found, never guessed", () => {
  const base = load("practice2b.json");
  const read = load("practice2b-parented.json");
  read.layer_info.find((l) => l.name === "Caption").name = "Caption copy";
  const { result } = check(base, read, lessonFor(base, { focus: GROUP }), {});
  assert.ok(result.hints.some((h) => h.code === "not_found" && h.layer === "Caption"));
  assert.equal(result.layers.find((l) => l.layer === "Caption").found, false);
  assert.equal(result.parenting_passed, false);
});

test("the stored null is the null's own sample at the before-read time", () => {
  const read = load("null-center.json");
  assert.deepEqual(storeNull(read, 1, 0, "demo"), { anchor: [50, 50], position: [1215, 165], scale: [100, 100], rotation: 0, time: 0, from: "demo" });
  assert.equal(storeNull(read, 1, 9.9), null, "a time that wasn't sampled stores nothing");
});

// ---- Comments (FR-020) and other changes (FR-021)

test("comments show only when the read shows them, never change a result, and four of them explain a failure", () => {
  const [, slide] = runAttempt(KEY.attempts.find((a) => a.id === "us1-slide-comments"));
  assert.equal(slide.result.passed, true);
  assert.deepEqual(slide.result.comments.map((c) => c.code).sort(), ["default_name", "linear"]);
  const [, keyed] = runAttempt(KEY.attempts.find((a) => a.id === "us2-keyed-early"));
  assert.deepEqual(keyed.result.comments.map((c) => c.code), ["default_name"], "eased keys: not linear");
  // Stacked: the null's move overlaps Tile's own Position keys in time.
  const base = load("practice2b.json");
  const lesson = lessonFor(base, { focus: GROUP });
  lesson.skill_data = check(base, load("null-center.json"), lesson, { region: "slides_only" }).skill_data;
  const read = load("slide-null.json");
  const np = read.layers.find((l) => l.name === "Null 1").properties[0];
  np.keys[0].time = 4.5;
  np.keys[1].time = 5;
  const st = check(base, read, lesson, {}).result;
  assert.equal(st.passed, true);
  assert.ok(st.comments.some((c) => c.code === "stacked" && c.layer === "Tile" && c.from === 4.5 && c.to === 5));
  // Before a pass: opacity explains a P4 failure; uneven scale explains a jump; a held move doesn't show.
  const fade = runAttempt(KEY.attempts.find((a) => a.id === "one-key"))[1];
  assert.deepEqual(fade.result.comments, []);
  const op = load("one-key-null.json");
  op.layer_info[0].transform.opacity = 50;
  assert.ok(check(base, op, lesson, {}).result.comments.some((c) => c.code === "opacity"));
  const sc = load("jumped.json");
  sc.layer_info[0].transform.scale = [120, 100, 100];
  assert.ok(check(base, sc, lesson, {}).result.comments.some((c) => c.code === "non_uniform_scale"));
  const held = load("slide-null.json");
  held.layers.find((l) => l.name === "Null 1").properties[0].keys.forEach((k) => { k.in_type = "hold"; k.out_type = "hold"; });
  const hr = check(base, held, lesson, {}).result;
  assert.equal(hr.passed, true);
  assert.ok(hr.comments.some((c) => c.code === "held"));
  // Zero scale at a key, and an effect on the null.
  const z = load("slide-null.json");
  z.layers.find((l) => l.name === "Null 1").properties.push({ path: "ADBE Transform Group/ADBE Scale", display_path: "Transform › Scale", match_name: "ADBE Scale", display_name: "Scale", dimensions: 1, expression_enabled: false, keys: [{ index: 1, time: 6, in_type: "bezier", out_type: "bezier", value: [100, 100, 100], in_ease: [], out_ease: [] }, { index: 2, time: 6.5, in_type: "bezier", out_type: "bezier", value: [0, 100, 100], in_ease: [], out_ease: [] }] });
  z.layer_info[0].effect_count = 1;
  const zr = check(base, z, lesson, { region: "center" }).result; // it scales now, so P5 needs the region
  assert.equal(zr.passed, true);
  assert.ok(zr.comments.some((c) => c.code === "zero_scale_at_key" && c.time === 6.5));
  assert.ok(zr.comments.some((c) => c.code === "effect"));
});

test("other changes come from every layer: parented to the null, a parent changed, keys, expressions, layers added or removed", () => {
  const base = load("practice2b.json");
  const lesson = lessonFor(base, { focus: GROUP });
  lesson.skill_data = check(base, load("null-center.json"), lesson, {}).skill_data;
  const read = load("practice2b-parented.json");
  const shadow = read.layer_info.find((l) => l.name === "Shadow");
  shadow.parent = read.layer_info.find((l) => l.name === "Row A").index;
  read.layers.find((l) => l.name === "Gauge").properties[0].keys.pop();
  read.layers.find((l) => l.name === "Plate").properties[0].expression_enabled = true;
  read.layer_info = read.layer_info.filter((l) => l.name !== "Peg");
  read.layer_info.push({ ...clone(read.layer_info.find((l) => l.name === "Tab")), name: "Tab 2", index: 99 });
  const { result } = check(base, read, lesson, {});
  const kinds = (k) => result.other_changes.filter((o) => o.kind === k).map((o) => o.layer);
  assert.deepEqual(kinds("parent_changed"), ["Shadow"]);
  assert.deepEqual(kinds("keys_changed"), ["Gauge"]);
  assert.deepEqual(kinds("expression_toggled"), ["Plate"]);
  assert.deepEqual(kinds("layer_removed"), ["Peg"]);
  assert.deepEqual(kinds("layer_added"), ["Tab 2"]);
  assert.ok(!result.other_changes.some((o) => o.layer === "Null 1"), "the lesson's null is never an other change");
  assert.equal(result.parenting_passed, true, "never graded");
});

test("a focus layer's children are named once as children_brought, and the null's rename is never an other change", () => {
  const base = load("practice2b.json");
  const lesson = lessonFor(base, { focus: ["Plate", "Row A"] });
  assert.deepEqual(lesson.focus, ["Row A", "Plate"]);
  const r1 = check(base, load("null-center.json"), lesson, {});
  assert.ok(r1.result.other_changes.some((o) => o.kind === "children_brought" && o.layer === "Plate" && o.children[0] === "Shadow"));
  lesson.skill_data = r1.skill_data;
  assert.ok(!check(base, load("null-center.json"), lesson, {}).result.other_changes.some((o) => o.kind === "children_brought"));
  const [, , renamed] = runAttempt(KEY.attempts.find((a) => a.id === "null-renamed"));
  assert.deepEqual(renamed.result.other_changes, []);
});

// ---- One test per TD § 7 row and § 14 answer (data-model › Check result codes)

const codeOf = (id, step = -1) => {
  const steps = runAttempt(KEY.attempts.find((a) => a.id === id));
  return steps.at(step).result.codes;
};
for (const [code, id] of [
  ["visible_parent", "visible-parent"], ["jumped", "us2-jumped"], ["pickwhip_position", "us1-pickwhip"], ["opacity_move", "us1-fade"],
  ["no_move", "us1-all-parented"], ["one_key", "one-key"], ["pivot_region", "us1-pivot-region"], ["region_needed", "us1-rotate-slides-only"],
  ["anchor_only", "anchor-only"], ["null_parent_moves", "row23-moving-parent"], ["null_name_not_unique", "row40-synthetic"], ["null_renamed", "null-renamed"],
]) {
  test(`TD § 7 / § 14: ${code}`, () => assert.ok(codeOf(id).includes(code), `${id} gives ${code}`));
}

test("TD § 7: wrong_parent when a focus layer follows another null", () => {
  const base = load("practice2b.json");
  const lesson = lessonFor(base, { focus: GROUP });
  lesson.skill_data = check(base, load("null-center.json"), lesson, {}).skill_data;
  const read = load("practice2b-parented.json");
  read.layer_info.find((l) => l.name === "Caption").parent = read.layer_info.find((l) => l.name === "Hatch Rig").index;
  const { result } = check(base, read, lesson, {});
  assert.ok(result.hints.some((h) => h.code === "wrong_parent" && h.layer === "Caption" && h.parent === "Hatch Rig"));
});

test("TD § 14: null_has_parent, then one_level_only on purpose", () => {
  assert.ok(codeOf("row23-still-parent", 0).includes("null_has_parent"));
  assert.ok(codeOf("row23-still-parent", 1).includes("one_level_only"));
});

test("a comp that isn't the lesson's isn't graded", () => {
  const base = load("practice2b.json");
  const read = load("practice2b-parented.json");
  read.comp.id = 999;
  const { result, skill_data } = check(base, read, lessonFor(base, { focus: GROUP }), {});
  assert.equal(result.comp_matches, false);
  assert.equal(result.graded, false);
  assert.equal(skill_data, null);
});
