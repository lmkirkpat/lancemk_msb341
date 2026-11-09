"use strict";
// T043 to T049: the five newer skills' rows (contracts/checklist-rows.md), from results shaped like
// their real tools' (product/evals/*/results). Unknown codes read Not checked yet; passes only from `passed`.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { fromCheck, fromSnapshot, labelsFromSnapshot, changeLine, isCheck, isSnapshot, rowsOf } = require("../lib/checklist/index.js");
const { reduceLesson, initialLesson, stageOf } = require("../lib/lesson.js");
const { visibleKinds } = require("../lib/requests.js");
const { stateOf } = require("../lib/view-state.js");
const { COPY } = require("../lib/copy.js");
const { TABLE } = require("../lib/skills.js");

const rows = (l) => rowsOf(l).map((r) => [r.subject, r.family, r.word]);
const titles = (l) => l.sections.map((s) => s.title);
const check = (tool, json, opts) => fromCheck(tool, Object.assign({ comp_matches: true, passed: false }, json), opts);

test("every tool in the table is registered", () => {
  for (const s of TABLE) { assert.ok(isSnapshot(s.snapshot), s.snapshot); assert.ok(isCheck(s.check), s.check); }
});

// ---------- key types ----------

const KT = "key_types_check";
const KT_PAIRS = [
  { id: "a", label: "Blink › Opacity 1–1.4 s", verdict: "held_by_demo" },
  { id: "b", label: "Blink › Opacity 1.4–1.8 s", verdict: "held_by_learner" },
  { id: "c", label: "Blink › Opacity 1.8–2.2 s", verdict: "wrong_side" },
  { id: "d", label: "Card › Scale 0.4–1 s", verdict: "not_held" },
  { id: "e", label: "Card › Scale 1–2 s", verdict: "removed_or_changed" },
  { id: "f", label: "Card › Scale 2–3 s", verdict: "expression" },
  { id: "g", label: "Card › Scale 3–4 s", verdict: "unmatched" },
  { id: "h", label: "Card › Scale 4–5 s", verdict: "from_the_future" },
];

test("key types: section is layer › property, rows are times, every verdict's word", () => {
  const l = check(KT, { pairs: KT_PAIRS, should_move_held: [], extra_holds: [], other_changes: [], constant_speed: null, items: {} });
  assert.deepEqual(titles(l), ["Blink › Opacity", "Card › Scale"]);
  assert.deepEqual(rows(l).slice(0, 3), [["1–1.4 s", "done", "Demo"], ["1.4–1.8 s", "done", "Held by you"], ["1.8–2.2 s", "part", "Hold on the wrong key"]]);
  assert.deepEqual(rows(l).slice(3), [["0.4–1 s", "off", "Not held"], ["1–2 s", "cant", "Keys changed"], ["2–3 s", "cant", "Expression on it"], ["3–4 s", "cant", "Can't tell which"], ["4–5 s", "none", "Not checked yet"]]);
  assert.equal(l.summary, "1 of 7 yours held · 6 to fix");
  assert.equal(l.marks_demo, true);
});

test("key types: Meant to keep moving, Runs at constant speed, Outside", () => {
  const l = check(KT, { pairs: [KT_PAIRS[1]], should_move_held: [{ layer: "Cut", property: "Opacity", from_time: 3, waits_until: 3.1 }], extra_holds: [{ layer: "Card", property: "Position", time: 1.2 }], other_changes: ["Spinner › Rotation was changed (not part of this lesson)"], constant_speed: { ref: { layer: "Spinner", property: "Rotation" }, verdict: "linear" }, items: {} });
  assert.deepEqual(titles(l), ["Blink › Opacity", "Meant to keep moving", "Runs at constant speed"]);
  assert.deepEqual(rows(l).slice(1), [["Cut › Opacity", "off", "Now snaps"], ["Spinner › Rotation", "done", "Linear, stays"]]);
  assert.deepEqual(l.outside, ["Card › Position: a hold at 1.2 s", "Spinner › Rotation was changed (not part of this lesson)"]);
  const not = check(KT, { pairs: [], constant_speed: { ref: { layer: "S", property: "R" }, verdict: "not_linear" } });
  assert.deepEqual(rows(not), [["S › R", "off", "Not linear"]]);
  const expr = check(KT, { pairs: [], constant_speed: { ref: { layer: "S", property: "R" }, verdict: "expression" } });
  assert.deepEqual(rows(expr), [["S › R", "cant", "Expression"]]);
});

test("key types: passed only from the tool; opening has no rows but its slot, labels from target_pairs", () => {
  const p = check(KT, { pairs: [KT_PAIRS[1]], passed: true });
  assert.equal(p.passed, true);
  assert.equal(p.summary, "1 of 1 yours held · passed");
  assert.equal(check(KT, { pairs: [KT_PAIRS[1]] }).passed, false);
  const snap = { target_pairs: [{ id: "a", label: "Subtitle › Opacity 0.3–1.3 s" }], targets: ["a"] };
  const labels = labelsFromSnapshot("key_types_snapshot", snap);
  assert.equal(labels.a, "Subtitle › Opacity 0.3–1.3 s");
  const l = fromSnapshot("key_types_snapshot", ["a"], { labels, proposed: false, focus: ["Subtitle"] });
  assert.deepEqual(rows(l), [["0.3–1.3 s", "none", "Not checked yet"]]);
  assert.equal(l.sections[0].title, "Subtitle › Opacity");
  assert.equal(changeLine("key_types_demo", { layer: "Blink", property: "Opacity", from_time: 1, to_time: 1.4 }), "held Blink › Opacity, 1–1.4 s.");
});

// ---------- speed graph ----------

const SG = "speed_graph_check";

test("speed graph: every result, credit and mistake; fastest never shows", () => {
  const p = (id, over) => Object.assign({ id, label: `Title › Position ${id}–2 s` }, over);
  const l = check(SG, { pairs: [
    p("1", { result: "passed", credit: "demo" }), p("2", { result: "passed", credit: "unknown" }), p("3", { result: "passed", credit: "learner", fastest: { parts: ["first"] } }),
    p("4", { result: "not_passed", mistake: "not_shaped" }), p("5", { result: "not_passed", mistake: "no_handle" }), p("6", { result: "not_passed", mistake: "arrives_moving", dimension: "Y" }),
    p("7", { result: "not_passed", mistake: "back_to_default" }), p("8", { result: "not_passed", mistake: "long_both_ends" }), p("9", { result: "not_passed", mistake: "in_out_mixed" }),
    p("10", { result: "keys_changed" }), p("11", { result: "removed" }), p("12", { result: "unmatched" }), p("13", { result: "not_passed", mistake: "brand_new" }),
  ], other_changes: [] });
  const r = rows(l);
  assert.deepEqual(r.map((x) => x[2]), ["Demo", "Who shaped it?", "Shaped by you", "Not shaped yet", "No ease on a key", "Still moving as it lands", "Back to the default", "Long at both ends", "Shaped the wrong side", "Keys changed", "Keys changed", "Can't tell which", "Not checked yet"]);
  assert.deepEqual(r.map((x) => x[1]).slice(0, 6), ["done", "ask", "done", "off", "off", "part"]);
  assert.equal(rowsOf(l)[5].detail, "Y");
  assert.doesNotMatch(JSON.stringify(l), /fastest|first|middle/);
  assert.equal(l.summary.startsWith("1 of "), true);
});

test("speed graph: You said it lands hard is its own section, Your call, and never the Next row", () => {
  const l = check(SG, { pairs: [{ id: "1", label: "Title › Scale 0.5–1 s", result: "not_passed", mistake: "not_shaped" }] }, { landing_hard: ["Bar › X Position 0.6–1.2 s"] });
  assert.deepEqual(titles(l), ["Title", "You said it lands hard · left out"]);
  assert.deepEqual(rows(l)[1], ["Bar › X Position 0.6–1.2 s", "none", "Your call"]);
  assert.equal(l.next, "Scale 0.5–1 s");
  assert.equal(changeLine("speed_graph_demo", { shaped: "Title › Position, 0.500 s → 1.500 s" }), "shaped Title › Position, 0.5–1.5 s.");
  const labels = labelsFromSnapshot("speed_graph_snapshot", { pairs: [{ id: "a", label: "Title › Scale 0.5–1 s", fastest: { parts: ["middle"] } }] });
  assert.equal(labels.a, "Title › Scale 0.5–1 s");
});

// ---------- offset ----------

const OF = "offset_check";
const M = (label, start, over) => Object.assign({ target: `layer/${label}`, label, layer: label, start_before: 0.5, start_now: start, moved_by: { Position: 0, Opacity: 0 }, split: null, credit: null, status: "graded" }, over);

test("offset, layers: rows from the group, never passes on its own, footer and group line", () => {
  const l = check(OF, { kind: "layers", members: [M("Dot 1", 0.5), M("Dot 2", 0.633, { moved_by: { Position: 4 }, credit: "demo" }), M("Dot 3", 0.633, { moved_by: { Position: 4 } }), M("Dot 4", 0.8, { split: { on_purpose: true } }), M("Dot 5", 0.9, { split: { on_purpose: false } }), M("Dot 6", 1, { status: "keys_changed" })], still_same: [["Dot 2", "Dot 3"]], order_differs: true, out_of_comp: ["Dot 3"], other_changes: ["Title moved"], gaps_frames: [4, 4], passed: false });
  assert.deepEqual(rows(l), [["Dot 1", "done", "On its own"], ["Dot 2", "off", "With Dot 3"], ["Dot 3", "off", "With Dot 2"], ["Dot 4", "done", "Split on purpose"], ["Dot 5", "ask", "Split"], ["Dot 6", "cant", "Keys changed"]]);
  assert.equal(rowsOf(l)[0].detail, "starts 0.5 s · stayed");
  assert.equal(rowsOf(l)[1].detail, "starts 0.63 s · moved 4 f · demo");
  assert.equal(l.summary, "Dot 2 and Dot 3 still start together");
  assert.deepEqual(l.footer, ["The order's different from what you said."]);
  assert.deepEqual(l.outside, ["Dot 3 is past the end of the comp", "Title moved"]);
  assert.equal(l.marks_demo, true);
  assert.equal(l.passed, false);
});

test("offset, properties: section is the layer, Lands past the end, Apart; all ✓ isn't passed", () => {
  const P = (label, over) => Object.assign({ target: `t/${label}`, label: `Title › ${label}`, layer: "Title", start_now: 0.5, end_now: 1.5, lands_in_comp: true, moved_by: { start: 0, end: 0 }, credit: null, status: "graded" }, over);
  const l = check(OF, { kind: "properties", members: [P("Position"), P("Scale", { start_now: 1.5, end_now: 2.5, moved_by: { start: 30, end: 30 } }), P("Opacity", { lands_in_comp: false })], still_same: [], gaps_frames: [30], passed: false });
  assert.deepEqual(titles(l), ["Title"]);
  assert.deepEqual(rows(l), [["Position", "done", "Apart"], ["Scale", "done", "Apart"], ["Opacity", "part", "Lands past the end"]]);
  assert.equal(rowsOf(l)[1].detail, "1.5–2.5 s · moved 30 f");
  assert.equal(l.summary, "All apart · gaps 30 f");
  assert.equal(l.passed, false);
  assert.equal(check(OF, { kind: "properties", members: [P("A")], still_same: [], passed: true, gaps_frames: [] }).summary, "All apart · passed");
});

test("offset: opening rows from the group, the Changed line from the demo", () => {
  const snap = { group: { kind: "layers", members: [{ target: "layer/5", label: "Dot 1", start: 0.5 }, { target: "layer/6", label: "Dot 2", start: 0.5 }] }, targets: ["layer/5", "layer/6"] };
  const labels = labelsFromSnapshot("offset_snapshot", snap);
  const l = fromSnapshot("offset_snapshot", snap.targets, { labels, proposed: true, focus: ["Dot 1", "Dot 2"] });
  assert.deepEqual(rows(l), [["Dot 1", "prop", "Proposed"], ["Dot 2", "prop", "Proposed"]]);
  assert.equal(l.summary, "2 layers start together · Proposed");
  assert.equal(changeLine("offset_demo", { layer: "Dot 2", properties: ["Position"], shift_frames: 4 }), "moved Dot 2 4 frames later.");
  assert.equal(changeLine("offset_demo", { layer: "Dot 2", shift_frames: 1 }), "moved Dot 2 1 frame later.");
});

// ---------- pivot ----------

const AN = "anchor_check";
const LAYER = (over) => Object.assign({ layer: "Door", credit: "learner", item1: { passed: true, place_now: "middle-left", wanted: "middle-left", outside_side: null }, item2: { passed: true, direction: null }, item3: { set_away_from_rest: false }, item4: null, item5: { passed: true, moved_layers: [] }, cant_check: [], passed: true }, over);

test("pivot: one section a layer, a row per condition; passed from the tool; no pixel numbers", () => {
  const l = check(AN, { layers: [LAYER({ item2: { passed: false, direction: "left", distance_px: 40 } })], other_changes: [], passed: false });
  assert.deepEqual(titles(l), ["Door"]);
  assert.deepEqual(rows(l), [["Pivot on the middle of its left edge", "done", "In place"], ["Door stays where it is", "off", "Moved left"], ["Nothing else moves", "done", "Nothing did"]]);
  assert.equal(l.summary, "Door · 2 of 3 holding");
  assert.doesNotMatch(JSON.stringify(l), /\b40\b/);
  assert.equal(check(AN, { layers: [LAYER()], passed: true }).summary, "Door · passed");
});

test("pivot: every pivot word, set away from rest, Position keys, Others, Can't check", () => {
  const w = (item1) => rows(check(AN, { layers: [LAYER({ item1 })] }))[0].slice(1);
  assert.deepEqual(w({ passed: false, place_now: "between", wanted: "top-left" }), ["part", "Near it"]);
  assert.deepEqual(w({ passed: false, place_now: "center", wanted: "top-left" }), ["part", "Near it"]);
  assert.deepEqual(w({ passed: false, place_now: "outside", wanted: "top-left", outside_side: "left" }), ["off", "Outside, to its left"]);
  assert.deepEqual(w({ passed: false, place_now: "bottom-right", wanted: "top-left" }), ["off", "At its bottom-right corner"]);
  const keyed = check(AN, { layers: [LAYER({ item3: { set_away_from_rest: true }, item4: { passed: false, worst: { time: 3.667, dx: 50 } }, item5: { passed: false, moved_layers: ["Tab"] }, cant_check: [{ what: "position_key", time: 2, reason: "x" }] })] });
  assert.deepEqual(rows(keyed).slice(1), [["Door stays where it is", "done", "Stayed"], ["At rest", "off", "Set away from rest"], ["Holds at its Position keys", "cant", "Can't check"], ["Nothing else moves", "off", "Tab moved"]]);
  const held = check(AN, { layers: [LAYER({ item4: { passed: true } })] });
  assert.deepEqual(rows(held)[2], ["Holds at its Position keys", "done", "Held"]);
  const slid = check(AN, { layers: [LAYER({ item4: { passed: false, worst: { time: 3.667 } } })] });
  assert.equal(rows(slid)[2][2], "Slid at 3.67 s");
  const gone = check(AN, { layers: [{ layer: "Door", item1: null, item2: null, item3: null, item4: null, item5: null, cant_check: [{ what: "layer", reason: "not_found" }] }] });
  assert.deepEqual(rows(gone), [["Door", "cant", "Can't check"]]);
});

test("pivot: Outside in panel words for each kind; opening rows from focus; demo's Changed line", () => {
  const l = check(AN, { layers: [LAYER()], other_changes: [{ kind: "layer_removed", layer: "A" }, { kind: "renamed", layer: "B", now: "C" }, { kind: "eye_changed", layer: "D", eye_on: true }, { kind: "anchor_changed", layer: "E" }, { kind: "keys_added", layer: "F", property: "Position" }, { kind: "layer_added", layer: "G" }, { kind: "from_the_future", layer: "H" }] });
  assert.deepEqual(l.outside, ["A was removed", "B was renamed to C", "D's eye was turned on", "E's pivot changed", "Position keys were added on F", "G was added", "Something else changed"]);
  const labels = labelsFromSnapshot("anchor_snapshot", { focus: ["Door"], targets: ["anchor/2"] });
  assert.deepEqual(labels, { "anchor/2": "Door" });
  assert.equal(changeLine("anchor_demo", { layer: "Door", place: "middle-left" }), "moved Door's pivot to the middle of its left edge.");
});

// ---------- null ----------

const NU = "null_parent_check";
const NULL = (over) => Object.assign({ name: "Null 1", found: true, n1: true, n2: true, n3: { applies: true, passed: true, region_now: "top-left", wanted: "top-left" }, p4: null, moves: [] }, over);
const L = (layer, over) => Object.assign({ layer, found: true, credit: "learner", parent: "Null 1", p1: true, p2: { passed: true }, not_checked: [], p3: { passed: true, changed: [] } }, over);

test("null, placing: the null's rows, the group and move wait, and they're never Next", () => {
  const l = check(NU, { stage: "parenting", graded: true, null: NULL({ n3: { applies: true, passed: false, region_now: "center", wanted: "top-left" } }), layers: [L("Tile"), L("Caption")], comments: [], other_changes: [], hints: [], codes: ["pivot_region"] });
  assert.deepEqual(titles(l), ["The null", "The group", "The move"]);
  assert.deepEqual(rows(l), [["Null 1", "done", "2D, no parent"], ["Pivot at the group's top-left", "off", "At its center"], ["Tile, Caption", "none", "After the null"], ["One move on the null", "none", "After the group"]]);
  assert.equal(l.summary, "The null · 1 of 2 holding");
  assert.equal(l.next, "Pivot at the group's top-left");
  assert.equal(l.view_fields.null_stage, "place");
});

test("null, the group: Follows, Jumped, wrong parent, pick whip, keys, couldn't check, not parented", () => {
  const hints = [{ code: "jumped", layer: "A" }, { code: "wrong_parent", layer: "B" }, { code: "pickwhip_position", layer: "C" }, { code: "focus_name_not_unique", layer: "F" }];
  const l = check(NU, { stage: "parenting", graded: true, null: NULL(), layers: [
    L("A", { p2: { passed: false, worst_px: 132, direction: "up and left", time: 0 } }), L("B", { parent: "Blink", p1: false }), L("C", { p1: false }),
    L("D", { p3: { passed: false, changed: [{ property: "Position" }] } }), L("E", { not_checked: [{ time: 1 }] }), L("F", {}), L("G", { parent: null, p1: false }), L("H", { found: false }), L("I"),
  ], comments: [], other_changes: [], hints, codes: [] });
  const r = rows(l).filter((x) => x[0].length === 1);
  assert.deepEqual(r, [["A", "off", "Jumped 132 px up and left"], ["B", "off", "Follows Blink"], ["C", "part", "Position linked, not parented"], ["D", "off", "Its keys changed"], ["E", "cant", "Couldn't check"], ["F", "ask", "Two layers share its name"], ["G", "off", "Not parented yet"], ["H", "cant", "Not in the comp"], ["I", "done", "Follows Null 1"]]);
  assert.equal(rowsOf(l).find((x) => x.subject === "A").detail, "at 0 s");
  assert.equal(rowsOf(l).find((x) => x.subject === "I").detail, "own keys kept");
  assert.equal(l.view_fields.null_stage, "parent");
});

test("null, the null's own codes", () => {
  const w = (over, codes) => rows(check(NU, { stage: "parenting", graded: true, null: NULL(over), layers: [], comments: [], other_changes: [], hints: codes.map((code) => ({ code })), codes }))[0].slice(1);
  assert.deepEqual(w({ found: false, name: null }, ["no_null"]), ["off", "No null yet"]);
  assert.deepEqual(w({ n1: false }, ["not_a_null"]), ["off", "Not a null"]);
  assert.deepEqual(w({}, ["null_has_parent"]), ["ask", "Has a parent"]);
  assert.deepEqual(w({ n2: false }, ["three_d"]), ["off", "It's 3D"]);
  assert.deepEqual(w({}, ["which_null"]), ["ask", "Which null?"]);
  assert.deepEqual(w({}, ["null_name_not_unique"]), ["ask", "Two layers share its name"]);
});

test("null, the move: the property, Opacity, no move, region; Worth a look in panel words", () => {
  const l = check(NU, { stage: "move", graded: true, null: NULL({ n3: null, p4: { passed: true, on: ["Position"] }, moves: ["Position"] }), layers: [L("Tile")], comments: [{ code: "linear", null: "Null 1" }, { code: "default_name", null: "Null 1" }, { code: "stacked", layer: "Tile" }, { code: "from_the_future" }], other_changes: [{ kind: "keys_changed", layer: "T", properties: ["Position"] }], hints: [], codes: [], passed: true });
  assert.deepEqual(rows(l).at(-1), ["Position", "done", "Moves"]);
  assert.equal(l.view_fields.null_stage, "move");
  assert.equal(l.summary, "The move · passed");
  assert.deepEqual(l.worth_a_look, ["The null's move is linear.", "The null still has its default name.", "Tile has its own move too."]);
  assert.deepEqual(l.outside, ["T's keys changed"]);
  const ww = (null_, codes) => rows(check(NU, { stage: "move", graded: true, null: NULL(null_), layers: [], comments: [], other_changes: [], hints: codes.map((code) => ({ code })), codes })).at(-1).slice(1);
  assert.deepEqual(ww({ p4: { passed: false } }, ["opacity_move"]), ["off", "Opacity doesn't carry"]);
  assert.deepEqual(ww({ p4: { passed: false } }, []), ["off", "No move yet"]);
  assert.deepEqual(ww({ p4: { passed: false } }, ["region_needed"]), ["ask", "Where does it turn from?"]);
});

test("null: opening rows from targets; the demo's Changed line", () => {
  const labels = labelsFromSnapshot("null_parent_snapshot", { focus: ["Tile"], targets: ["parent/Tile", "parent/Caption"] });
  assert.equal(labels["parent/Tile"], "Tile");
  assert.equal(labels["parent/Caption"], "Caption");
  assert.equal(changeLine("null_parent_demo", { layer: "Tile", null: "Null 1" }), "parented Tile to Null 1.");
});

// ---------- the lesson view, T047 to T049 ----------

const R = (name, json, ok = true) => ({ type: "tool_result", name, ok, json, at: "2026-11-09T12:00:00.000Z" });
const run = (skill, events) => events.reduce(reduceLesson, initialLesson({ skill }));

test("null: graded false keeps the list as it was and marks it stale, no verdict (FR-017)", () => {
  const first = R(NU, { comp_matches: true, stage: "parenting", graded: true, passed: false, null: NULL(), layers: [L("Tile")], comments: [], other_changes: [], hints: [], codes: [] });
  const v = run("parenting.null", [first, R(NU, { comp_matches: true, graded: false, stage: "parenting", passed: false, null: null, layers: [], comments: [], other_changes: [], hints: [{ code: "null_parent_moves" }], codes: [] })]);
  assert.equal(v.check_list.stale_kind, "ungraded");
  assert.ok(v.check_list.stale);
  assert.equal(v.checks, 1);
  assert.deepEqual(rows(v.check_list), rows(reduceLesson(initialLesson({ skill: "parenting.null" }), first).check_list));
  const m = { config_ok: true, tab: "lesson", step: 2, lesson_open: true, lesson: v, connection: { state: "connected" } };
  assert.equal(stateOf(m), "skill-null-parent", "not the AE-lost state");
});

test("Show me per skill (T049): from demo_target; null also needs null_ready; null_ready from a snapshot or a check's codes", () => {
  assert.deepEqual(visibleKinds({ skill: "parenting.null", demo_target: "parent/Tile", null_ready: false, checks: 0 }, { lessonOpen: true }), ["check"]);
  assert.deepEqual(visibleKinds({ skill: "parenting.null", demo_target: "parent/Tile", null_ready: true, checks: 0 }, { lessonOpen: true }), ["check", "show_me"]);
  assert.deepEqual(visibleKinds({ skill: "timing.offset", demo_target: "layer/6", checks: 0 }, { lessonOpen: true }), ["check", "show_me"]);
  const v = run("parenting.null", [R(NU, { comp_matches: true, graded: true, stage: "parenting", passed: false, null: NULL(), layers: [L("Tile")], comments: [], other_changes: [], hints: [], codes: ["null_ready"] })]);
  assert.equal(v.null_ready, true);
  const u = run("parenting.null", [R("null_parent_snapshot", { demo_target: "parent/Tile", null_ready: true, targets: ["parent/Tile"], focus: ["Tile"] })]);
  assert.equal(u.null_ready, true);
});

test("the header follows the tool, and each demo tool marks its demo and ticks its row (FR-018, T049)", () => {
  const v = run(null, [R("offset_snapshot", { group: { kind: "layers", members: [{ target: "layer/6", label: "Dot 2", start: 0.5 }] }, targets: ["layer/6"], focus: ["Dot 2"], demo_target: "layer/6" }), R("offset_demo", { layer: "Dot 2", shift_frames: 4 })]);
  assert.equal(v.skill, "timing.offset");
  assert.equal(v.demo_made, true);
  assert.equal(stageOf(v).stage, "try");
  assert.deepEqual(rows(v.check_list)[0], ["Dot 2", "done", "Demo"]);
});

test("view fields drive the skill state ids: offset's kind, the pivot's keys, the null's stage", () => {
  const base = { config_ok: true, tab: "lesson", step: 2, lesson_open: true, connection: { state: "connected" } };
  const off = run("timing.offset", [R("offset_snapshot", { group: { kind: "properties", members: [{ target: "t/a", label: "Position", start: 0.5, end: 1.5 }] }, targets: ["t/a"], focus: ["Title"] }), R(OF, { comp_matches: true, kind: "properties", members: [], still_same: [], gaps_frames: [], passed: false })]);
  assert.equal(stateOf(Object.assign({ lesson: off }, base)), "skill-offset-props-check");
  const piv = run("transform.anchor", [R(AN, { comp_matches: true, passed: false, layers: [LAYER({ item4: { passed: true } })], other_changes: [] })]);
  assert.equal(stateOf(Object.assign({ lesson: piv }, base)), "skill-pivot-keyed");
});

test("offset's timeline (T048, plan P5): shared scale, padded, clamped, widens only", () => {
  const snap = (members, duration = 8) => R("offset_snapshot", { comp: { duration }, group: { kind: "layers", members }, targets: members.map((m) => m.target), focus: [] });
  const v1 = run("timing.offset", [snap([{ target: "a", label: "A", start: 0.5 }, { target: "b", label: "B", start: 1 }])]);
  assert.equal(v1.timeline.start, 0.5);
  assert.ok(v1.timeline.end >= 1.5, "at least 1 s");
  assert.equal(v1.timeline.end, 1.5);
  const check1 = R(OF, { comp_matches: true, kind: "layers", members: [M("A", 0.5), M("B", 3, { start_before: 1 })], still_same: [], gaps_frames: [], passed: false });
  const v2 = reduceLesson(v1, check1);
  assert.equal(v2.timeline.start, 0.5);
  assert.equal(v2.timeline.end, 3 + (3 - 0.5) * 0.25);
  const v3 = reduceLesson(v2, R(OF, { comp_matches: true, kind: "layers", members: [M("A", 0.5), M("B", 1)], still_same: [], gaps_frames: [], passed: false }));
  assert.equal(v3.timeline.end, v2.timeline.end, "never narrows");
  const clamped = run("timing.offset", [snap([{ target: "a", label: "A", start: 7 }, { target: "b", label: "B", start: 7.9 }], 8)]);
  assert.equal(clamped.timeline.end, 8, "clamped to the comp");
  const past = run("timing.offset", [snap([{ target: "a", label: "A", start: 7 }, { target: "b", label: "B", start: 9 }], 8)]);
  assert.ok(past.timeline.end >= 9, "a key past the end isn't clipped");
  const rowsTrack = rowsOf(v2.check_list).map((r) => r.time);
  assert.deepEqual(rowsTrack, [0.5, 3]);
});

// ---------- on screen ----------

const { ready, plain } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const lesson = (h) => renderApp(h.app.model()).lesson;
const startSkill = async (skill, events) => {
  const h = await ready();
  h.app.act("start", { skill });
  for (const e of events || []) h.adapter().emit("tool_result", e);
  h.adapter().emit("turn_end", { ok: true, kind: "start" });
  return h;
};

test("the skills with no opening targets show their slot and header (T043, T046, T047)", async () => {
  for (const [skill, tool, slot, head] of [["keyframes.types", "key_types_snapshot", COPY.check.slot_key_types, COPY.lesson.no_focus], ["transform.anchor", "anchor_snapshot", COPY.check.slot_pivot, COPY.lesson.no_focus], ["parenting.null", "null_parent_snapshot", COPY.check.slot_null, COPY.lesson.no_group]]) {
    const h = await startSkill(skill, [{ name: tool, ok: true, text: "", images: [], json: { targets: [], focus: null } }]);
    assert.ok(plain(lesson(h).list).includes(slot), skill);
    assert.ok(plain(lesson(h).head).includes(head), skill);
    assert.match(h.app.model().state, /^skill-[a-z]+-open$/, skill);
  }
});

test("Offset's rows draw on the timeline, aria-hidden; footer, Worth a look and Outside show (T048, FR-086)", async () => {
  const snap = { name: "offset_snapshot", ok: true, text: "", images: [], json: { comp: { duration: 8 }, group: { kind: "layers", members: [{ target: "layer/5", label: "Dot 1", start: 0.5 }, { target: "layer/6", label: "Dot 2", start: 1 }] }, targets: ["layer/5", "layer/6"], focus: ["Dot 1", "Dot 2"], demo_target: null } };
  const h = await startSkill("timing.offset", [snap]);
  const open = lesson(h).list;
  assert.match(open, /class="track" aria-hidden="true"><i style="left:0\.0%"/);
  h.app.ask("ok");
  h.adapter().emit("tool_result", { name: "offset_check", ok: true, text: "", images: [], json: { comp_matches: true, kind: "layers", members: [M("Dot 1", 0.5), M("Dot 2", 1, { start_before: 1 })], still_same: [], order_differs: true, out_of_comp: [], other_changes: ["Other moved"], gaps_frames: [15], passed: false } });
  h.adapter().emit("turn_end", { ok: true, kind: "ask" });
  const l = plain(lesson(h).list);
  assert.ok(l.includes("The order's different from what you said."));
  assert.ok(l.includes("Other moved"));
  const nul = await startSkill("parenting.null", [{ name: "null_parent_check", ok: true, text: "", images: [], json: { comp_matches: true, stage: "move", graded: true, passed: true, null: NULL({ n3: null, p4: { passed: true, on: ["Position"] }, moves: ["Position"] }), layers: [L("Tile")], comments: [{ code: "linear" }], other_changes: [], hints: [], codes: [] } }]);
  assert.ok(plain(lesson(nul).list).includes(COPY.check.worth_a_look));
  assert.ok(plain(lesson(nul).list).includes("The null's move is linear."));
});

test("a non-easing demo shows Changed in your comp with its own line", async () => {
  const h = await startSkill("keyframes.types", [{ name: "key_types_snapshot", ok: true, text: "", images: [], json: { targets: ["a"], target_pairs: [{ id: "a", label: "Blink › Opacity 1–1.4 s" }], focus: ["Blink"], demo_target: "a" } }]);
  h.app.act("show_me");
  assert.equal(h.adapter().sent.at(-1).text, "Show me how first.");
  assert.equal(h.app.model().turn.status, "Holding one pair to show you…");
  h.adapter().emit("tool_result", { name: "key_types_demo", ok: true, text: "", images: [], json: { layer: "Blink", property: "Opacity", from_time: 1, to_time: 1.4, undo: "Edit > Undo" } });
  h.adapter().emit("turn_end", { ok: true, kind: "show_me" });
  const chat = plain(lesson(h).chat.items.join(""));
  assert.ok(chat.includes(COPY.lesson.changed_in_comp));
  assert.ok(chat.includes("held Blink › Opacity, 1–1.4 s."));
  assert.ok(plain(lesson(h).actions).includes("Show me again"));
});
