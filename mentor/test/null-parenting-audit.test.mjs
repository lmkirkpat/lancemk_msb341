// The 2026-10-29 overlap audit's null rows (discovery/usage-notes/overlap-audit-2026-10-29.md):
// OA-4, OA-14, OA-15 and OA-16 (spec 012 tasks T455 to T458).

import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, focusProblems, MAX_P2_TIMES, p2Times } from "../lib/null-parenting.mjs";
import { check } from "../lib/null-parenting-check.mjs";
import { clone, lessonFor, load } from "./fixtures/null-parenting/load.mjs";

const GROUP = ["Tile", "Caption", "Stamp"];

function placed() {
  const base = load("practice2b.json");
  const lesson = lessonFor(base, { focus: GROUP });
  lesson.skill_data = check(base, load("null-center.json"), lesson, { region: "slides_only" }).skill_data;
  return { base, lesson };
}

test("OA-4: an unkeyed property of a non-focus layer changes (an expression, say): reported as an other change, never graded", () => {
  const { base, lesson } = placed();
  const read = load("parented-center.json");
  const before = check(base, read, lesson, {}).result;
  assert.ok(!before.other_changes.some((o) => o.layer === "Background"), "nothing about Background yet");
  const bg = read.layer_info.find((l) => l.name === "Background");
  assert.ok(!read.layers.some((l) => l.name === "Background"), "Background has no keys");
  for (const s of bg.samples) s.position = [s.position[0] + 40, s.position[1], s.position[2]];
  const { result } = check(base, read, lesson, {});
  assert.deepEqual(result.other_changes.filter((o) => o.layer === "Background"), [{ kind: "value_changed", layer: "Background", properties: ["Position"] }]);
  assert.equal(result.parenting_passed, before.parenting_passed, "FR-021: reported, not graded");
  assert.equal(result.passed, before.passed);
});

test("OA-4: a non-focus layer already reported (keys or parent changed) isn't reported twice", () => {
  const { base, lesson } = placed();
  const { result } = check(base, load("plate-parented-too.json"), lesson, {});
  assert.ok(result.other_changes.some((o) => o.layer === "Plate" && o.kind === "parented_to_null"));
  assert.ok(!result.other_changes.some((o) => o.layer === "Plate" && o.kind === "value_changed"));
});

test("OA-14: a grandparent moved by an unkeyed expression is a moving parent, not a jump", () => {
  const base = load("synthetic/before.json");
  const lesson = lessonFor(base, { focus: ["Card", "Label"] });
  lesson.skill_data = check(base, load("synthetic/row23-still-parent-placed.json"), lesson, { region: "slides_only" }).skill_data;
  lesson.skill_data = check(base, load("synthetic/row23-still-parent-placed.json"), lesson, { chain_on_purpose: true }).skill_data;
  const read = load("synthetic/row23-still-parent.json");
  const holder = read.layer_info.find((l) => l.name === "Holder");
  assert.ok(!(read.layers || []).some((l) => l.name === "Holder"), "Holder has no keys");
  holder.samples.find((s) => s.time === 3).position = [340, 300, 0];
  const { result } = check(base, read, lesson, {});
  assert.deepEqual([result.graded, result.codes], [false, ["null_parent_moves"]]);
});

test("OA-14: a still grandparent with no keys still passes (the row 23 pass)", () => {
  const base = load("synthetic/before.json");
  const lesson = lessonFor(base, { focus: ["Card", "Label"] });
  lesson.skill_data = check(base, load("synthetic/row23-still-parent-placed.json"), lesson, { region: "slides_only" }).skill_data;
  lesson.skill_data = check(base, load("synthetic/row23-still-parent-placed.json"), lesson, { chain_on_purpose: true }).skill_data;
  assert.equal(check(base, load("synthetic/row23-still-parent.json"), lesson, {}).result.parenting_passed, true);
});

test("OA-15: a focus whose P2 times total more than the snapshot can sample is refused at focus time, never stuck", () => {
  const base = load("synthetic/cap70-before.json");
  const names = ["Card", "Label", "Extra"];
  const total = new Set(names.flatMap((n) => p2Times(base, n))).size;
  assert.ok(total > MAX_P2_TIMES, `${total} distinct times`);
  const p = focusProblems(base, names);
  assert.equal(p.ok, false);
  assert.equal(p.size, "too_many_times");
  assert.equal(analyze(base, { skill_options: { focus: names } }).focus, null);
  assert.equal(focusProblems(base, ["Card", "Label"]).ok, true, "two of them fit");
});

test("OA-16: a focus layer duplicated with the same name asks for a rename, not 'can't find'", () => {
  const { base, lesson } = placed();
  const read = load("parented-center.json");
  const cap = read.layer_info.find((l) => l.name === "Caption");
  read.layer_info.push({ ...clone(cap), index: Math.max(...read.layer_info.map((l) => l.index)) + 1, parent: null });
  const { result } = check(base, read, lesson, {});
  assert.ok(result.codes.includes("focus_name_not_unique"));
  assert.ok(result.hints.some((h) => h.code === "focus_name_not_unique" && h.layer === "Caption"));
  assert.ok(!result.codes.includes("not_found"));
  assert.equal(result.parenting_passed, false);
  const row = result.layers.find((l) => l.layer === "Caption");
  assert.deepEqual([row.found, row.name_unique], [true, false]);
});
