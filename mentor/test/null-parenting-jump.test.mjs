// Spec 012's P2, the jump (FR-011, FR-012, FR-027, SC-006; research R4, R5): corners in comp
// space at each P2 time, through the null as stored at the before-read time, and "couldn't check"
// for anything the math can't read.

import { test } from "node:test";
import assert from "node:assert/strict";
import { check, p2For, storeNull } from "../lib/null-parenting-check.mjs";
import { allP2Times, p2Times } from "../lib/null-parenting.mjs";
import { compPosition } from "../lib/comp-space.mjs";
import { clone, lessonFor, load } from "./fixtures/null-parenting/load.mjs";
import { sampleList } from "./fixtures/null-parenting/stand-in/build.mjs";

const GROUP = ["Tile", "Caption", "Stamp"];

// The lesson after the stage 3 check on `placed`.
function placed(baseFile, placedFile, focus, input = { region: "slides_only" }) {
  const base = load(baseFile);
  const lesson = lessonFor(base, { focus });
  lesson.skill_data = check(base, load(placedFile), lesson, input).skill_data;
  return { base, lesson };
}

test("practice2b-parented.json passes P2 with 0 false jumps: raw values changed, footprints didn't (SC-006, B9)", () => {
  const { base, lesson } = placed("practice2b.json", "null-center.json", GROUP);
  const read = load("practice2b-parented.json");
  const before = base.layers.find((l) => l.name === "Tile").properties.find((p) => p.display_name === "Position").keys[0].value;
  const after = read.layers.find((l) => l.name === "Tile").properties.find((p) => p.display_name === "Position").keys[0].value;
  assert.notDeepEqual(after, before, "the raw Position values were rewritten");
  const { result } = check(base, read, lesson, {});
  for (const l of result.layers) assert.equal(l.p2.passed, true, l.layer);
  assert.equal(result.codes.includes("jumped"), false);
});

test("a jumped stand-in fails with the right layer, distance, direction and time", () => {
  const { base, lesson } = placed("practice2b.json", "null-center.json", GROUP);
  const { result } = check(base, load("jumped.json"), lesson, {});
  const h = result.hints.find((x) => x.code === "jumped");
  assert.deepEqual(h, { code: "jumped", layer: "Stamp", px: 120, direction: "left", time: 0 });
  assert.equal(result.stage, "parenting");
});

test("S-1: under a null at Scale 150 and Rotation 30, a jump moves the corners by more than 1 px and the anchor by less", () => {
  const { base, lesson } = placed("synthetic/s1-before.json", "synthetic/s1-placed.json", ["Card", "Label"]);
  const read = load("synthetic/s1-jumped.json");
  const card = (s) => s.layer_info.find((l) => l.name === "Card").index;
  const stored = lesson.skill_data.stored;
  const a0 = compPosition(base, card(base), 1).position;
  const a1 = compPosition(read, card(read), 1, { parent_transform: stored }).position;
  assert.ok(Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) < 1, "the anchor barely moved");
  const { result } = check(base, read, lesson, {});
  assert.ok(result.codes.includes("jumped"));
  assert.ok(result.layers.find((l) => l.layer === "Card").p2.worst_px > 1);
  assert.equal(check(base, load("synthetic/s1-parented.json"), lesson, {}).result.parenting_passed, true, "with no jump it passes");
});

test("a null keyed after the stage 3 check passes P2 through the stored null (row 30)", () => {
  const { base, lesson } = placed("practice2b.json", "null-center.json", GROUP);
  const { result } = check(base, load("null-keyed-early.json"), lesson, {});
  assert.equal(result.parenting_passed, true);
  // Through the null's current transform instead, Tile would read as moved at its late key times.
  const read = load("null-keyed-early.json");
  const at7 = { ...lesson.skill_data.stored, position: [1215, 365] }; // the null as it is at 7 s
  const live = p2For(base, read, "Tile", { throughNull: true, stored: at7 });
  assert.equal(live.passed, false, "the null's own move is never compared");
});

test("a playhead moved after the before read passes: the stored time is used (S-2, row 32)", () => {
  const { base, lesson } = placed("practice2b.json", "null-center.json", GROUP);
  const read = load("playhead-moved.json");
  assert.equal(read.comp.time, 2.5);
  const { result } = check(base, read, lesson, {});
  assert.equal(result.parenting_passed, true);
  assert.equal(result.before_time, 0);
});

test("row 31: a null moved after a check, before parenting, isn't a jump; with no check between, it is", () => {
  const { base, lesson } = placed("practice2b.json", "null-center.json", GROUP);
  const noCheck = check(base, load("null-moved-before-parenting.json"), lesson, {});
  assert.ok(noCheck.result.codes.includes("jumped"));
  const again = check(base, load("null-moved.json"), lesson, {});
  assert.equal(again.result.null.stored_now, true, "re-stored while nothing is parented (D-1)");
  lesson.skill_data = again.skill_data;
  assert.deepEqual(lesson.skill_data.stored.position, [1300, 300]);
  assert.equal(check(base, load("null-moved-before-parenting.json"), lesson, {}).result.parenting_passed, true);
});

test("once something is parented the stored null is never taken again", () => {
  const { base, lesson } = placed("practice2b.json", "null-center.json", GROUP);
  const r = check(base, load("practice2b-parented.json"), lesson, {});
  assert.equal(r.result.null.stored_now, false);
  assert.equal(r.skill_data.parented_seen, true);
  lesson.skill_data = r.skill_data;
  const later = check(base, load("null-moved.json"), lesson, {});
  assert.equal(later.result.null.stored_now, false);
  assert.deepEqual(later.skill_data.stored.position, [1215, 165]);
});

test("a still parent above the null passes through parent_transform, its chain from samples (row 23)", () => {
  const base = load("synthetic/before.json");
  const lesson = lessonFor(base, { focus: ["Card", "Label"] });
  lesson.skill_data = check(base, load("synthetic/row23-still-parent-placed.json"), lesson, { region: "slides_only" }).skill_data;
  lesson.skill_data = check(base, load("synthetic/row23-still-parent-placed.json"), lesson, { chain_on_purpose: true }).skill_data;
  assert.ok(lesson.skill_data.stored, "the null's own transform stored");
  const { result } = check(base, load("synthetic/row23-still-parent.json"), lesson, {});
  assert.equal(result.parenting_passed, true);
  for (const l of result.layers) assert.equal(l.p2.worst_px, 0, l.layer);
});

test("the 70-time null: with the P2 times passed, every one is sampled; read without them, a child's late time goes to not_checked", () => {
  const base = load("synthetic/cap70-before.json");
  const times = allP2Times(base, ["Card", "Label"]);
  assert.equal(times.length, 46, "1 s is both the before-read time and one of Card's keys");
  const read = load("synthetic/cap70-parented.json");
  const nul = read.layer_info.find((l) => l.name === "Null 1");
  assert.equal(nul.samples_truncated, true, "the null's own list is capped");
  for (const t of times) assert.ok(nul.samples.some((s) => s.time === t), `the null has ${t}`);
  // The snapshot's own order, checked once: caller times are kept ahead of the merged key times.
  assert.ok(sampleList(1, times, Array.from({ length: 69 }, (_, i) => i / 10 + 0.05)).times.length === 64);
  const lesson = lessonFor(base, { focus: ["Card", "Label"] });
  lesson.skill_data = { null: { name: "Null 1", region: "slides_only" }, stored: storeNull(read, nul.index, 1), parented_seen: false };
  assert.equal(check(base, read, lesson, {}).result.parenting_passed, true);
  // A child read with a sample missing at one of its times: couldn't check, never a pass.
  const gap = clone(read);
  const card = gap.layer_info.find((l) => l.name === "Card");
  card.samples = card.samples.filter((s) => s.time !== times[5]);
  const { result } = check(base, gap, lesson, {});
  const c = result.layers.find((l) => l.layer === "Card");
  assert.deepEqual(c.not_checked, [times[5]]);
  assert.equal(c.p2.passed, false);
  assert.equal(result.parenting_passed, false);
  assert.ok(result.hints.some((h) => h.code === "cant_check" && h.layer === "Card"));
});

test("every comp-space reason is couldn't check, never didn't move: 3D, auto-orient, no rect, singular", () => {
  const { base, lesson } = placed("practice2b.json", "null-center.json", GROUP);
  for (const [why, change] of [
    ["three_d", (l) => (l.three_d = true)],
    ["auto_orient", (l) => (l.auto_orient = true)],
    ["no_rect", (l) => l.samples.forEach((s) => (s.rect = null))],
  ]) {
    const read = load("practice2b-parented.json");
    change(read.layer_info.find((l) => l.name === "Caption"));
    const r = check(base, read, lesson, {}).result;
    const cap = r.layers.find((l) => l.layer === "Caption");
    assert.equal(cap.p2.passed, false, why);
    assert.ok(cap.not_checked.length > 0, why);
    assert.equal(r.parenting_passed, false, why);
  }
  // A stored null with Scale 0: compMatrix can still compose it, but the footprint collapses, so it reads as moved.
  const read = load("practice2b-parented.json");
  const z = clone(lesson);
  z.skill_data.stored.scale = [0, 100];
  assert.equal(check(base, read, z, {}).result.parenting_passed, false);
});

test("the 63-time cap always keeps the before-read time, then the earliest of the rest (S2)", () => {
  const base = load("synthetic/cap70-before.json");
  base.comp.time = 7.5; // later than every key
  const extra = base.layers.find((l) => l.name === "Card").properties[0];
  for (let i = 0; i < 30; i++) extra.keys.push({ ...extra.keys[0], index: extra.keys.length + 1, time: 3 + i * 0.1 });
  const times = allP2Times(base, ["Card", "Label"]);
  assert.equal(times.length, 63);
  assert.ok(times.includes(7.5), "the before-read time is kept");
  assert.equal(times[0], 0.2, "the earliest of the rest come next");
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
});

test("P2 times are the union of Anchor Point, Position, X, Y, Scale and Rotation key times plus the before-read time", () => {
  const base = load("practice2b.json");
  assert.deepEqual(p2Times(base, "Tile"), [0, 4.167, 4.367, 5.167, 5.367]);
  assert.deepEqual(p2Times(base, "Caption"), [0], "Opacity keys don't count");
  assert.deepEqual(p2Times(base, "Stamp"), [0, 4.667, 5.667], "X and Y");
  assert.deepEqual(p2Times(base, "Wobble"), [0, 3.8, 4.8], "Anchor Point");
  assert.deepEqual(p2Times(base, "Gauge"), [0, 3.167, 4.167], "Rotation");
  assert.deepEqual(allP2Times(base, GROUP), [0, 4.167, 4.367, 4.667, 5.167, 5.367, 5.667]);
});
