"use strict";
// T054, SC-003: every step 2 state is reachable and shows what it should; SC-002's test half and
// SC-007: each skill's recorded stream runs through the panel with its rows matching the tool's own results.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ready, plain, play, SIX_PATH, LESSON } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const { COPY } = require("../lib/copy.js");
const { rowsOf } = require("../lib/checklist/index.js");
const { STATE_IDS } = require("../lib/view-state.js");

const allText = (h) => { const r = renderApp(h.app.model()); if (!r.lesson) return plain(r.view); const l = r.lesson; return plain([l.head, l.banner, l.chat.earlier || "", ...l.chat.items, l.list, l.status, l.actions, l.ask].join("\n")); };
const open = (skill, ...events) => async () => {
  const h = await ready({ pathData: SIX_PATH });
  h.app.act("start", { skill });
  for (const e of events) h.adapter().emit("tool_result", Object.assign({ ok: true, text: "", images: [] }, e));
  h.adapter().emit("turn_end", { ok: true, kind: "start" });
  return h;
};
const T = (name, json) => ({ name, json });
const KT_CHECK = T("key_types_check", { comp_matches: true, passed: false, pairs: [{ id: "a", label: "Blink › Opacity 1–2 s", verdict: "not_held" }], should_move_held: [], extra_holds: [], other_changes: [], constant_speed: null, items: {} });
const SG_SNAP = T("speed_graph_snapshot", { lesson: "new", focus: ["Title"], demo_target: null, targets: ["a"], pairs: [{ id: "a", label: "Title › Position 0.5–1 s", fastest: { parts: ["middle"] } }], landing_hard_labels: [] });
const SG_CHECK = (credit) => T("speed_graph_check", { comp_matches: true, passed: false, pairs: [{ id: "a", label: "Title › Position 0.5–1 s", result: "passed", credit }], other_changes: [] });
const OF_SNAP = T("offset_snapshot", { lesson: "new", comp: { duration: 8 }, group: { kind: "layers", members: [{ target: "x", label: "Dot 1", start: 0.5 }, { target: "y", label: "Dot 2", start: 0.5 }] }, targets: ["x", "y"], focus: ["Dot 1"], demo_target: null });
const OF_CHECK = (kind) => T("offset_check", { comp_matches: true, passed: false, kind, members: [], still_same: [], order_differs: false, out_of_comp: [], other_changes: [], gaps_frames: [] });
const AN_CHECK = (item4) => T("anchor_check", { comp_matches: true, passed: false, layers: [{ layer: "Door", item1: { passed: true, wanted: "middle-left", place_now: "middle-left" }, item2: { passed: true }, item3: { set_away_from_rest: false }, item4, item5: { passed: true, moved_layers: [] }, cant_check: [], credit: "learner" }], other_changes: [] });
const NU_CHECK = (stage, n3) => T("null_parent_check", { comp_matches: true, passed: false, graded: true, stage, null: { name: "Null 1", found: true, n1: true, n2: true, n3, p4: stage === "move" ? { passed: true, on: ["Position"] } : null, moves: ["Position"] }, layers: [{ layer: "Tile", found: true, credit: "learner", parent: "Null 1", p1: true, p2: { passed: true }, not_checked: [], p3: { passed: true } }], comments: [], other_changes: [], hints: [], codes: [] });

const onHome = (memory) => () => ready({ memory: { status: "ok", record: memory }, pathData: SIX_PATH });
const learned = (id, extra) => ({ skills: { [id]: Object.assign({ status: "learned", last_practiced: "2026-10-26T12:00:00Z" }, extra) }, lessons: [{ skill: id, date: "2026-10-26T12:00:00Z", result: "passed", comp: "Practice" }] });
const skillsTab = (memory) => async () => { const h = await onHome(memory)(); h.app.act("tab", { tab: "skills" }); return h; };
const detail = (memory, skill) => async () => { const h = await skillsTab(memory)(); h.app.act("open_skill", { skill }); return h; };
const PICK = T("recommend_next", { recommendation: { skill: "timing.offset", kind: "lesson", focus_layers: ["Dot 1"] } });
const picking = async () => { const h = await ready({ memory: { status: "ok", record: LESSON }, pathData: SIX_PATH }); h.app.act("find_next"); h.adapter().emit("tool_result", Object.assign({ ok: true, text: "", images: [] }, PICK)); h.adapter().emit("text", { text: "Offset next?" }); h.adapter().emit("turn_end", { ok: true, kind: "find_next" }); return h; };

const CASES = {
  "home-return": [onHome(LESSON), COPY.buttons.find_next],
  "skills-empty": [skillsTab({ skills: {}, lessons: [] }), "0 of 6 learned"],
  "skills-few": [skillsTab(learned("easing.basic")), "1 of 6 learned"],
  "skills-many": [skillsTab({ skills: Object.fromEntries(["easing.basic", "keyframes.types", "easing.speed_graph", "timing.offset", "transform.anchor", "parenting.null"].map((id) => [id, { status: "learned" }])), lessons: [] }), "6 of 6 learned"],
  "skill-detail": [detail(learned("timing.offset"), "timing.offset"), COPY.skills.history_note],
  "skill-detail-noreview": [detail(learned("easing.basic"), "easing.basic"), COPY.buttons.new_lesson],
  "skill-detail-new": [detail({ skills: {}, lessons: [] }, "parenting.null"), "Set the pivot"],
  "lesson-picking": [picking, COPY.lesson.picking_title],
  "lesson-picking-starting": [async () => { const h = await picking(); h.app.act("yes"); return h; }, COPY.buttons.pressed.start],
  "lesson-picked": [async () => { const h = await picking(); h.app.act("yes"); h.adapter().emit("tool_result", Object.assign({ ok: true, text: "", images: [] }, OF_SNAP)); h.adapter().emit("turn_end", { ok: true, kind: "yes" }); return h; }, COPY.lesson.stages.pick],
  "skill-keytypes-open": [open("keyframes.types", T("key_types_snapshot", { lesson: "new", targets: [], focus: null })), COPY.check.slot_key_types],
  "skill-keytypes-check": [open("keyframes.types", KT_CHECK), "Not held"],
  "skill-speedgraph-open": [open("easing.speed_graph", SG_SNAP), "Proposed"],
  "skill-speedgraph-check": [open("easing.speed_graph", SG_SNAP, SG_CHECK("learner")), "Shaped by you"],
  "skill-speedgraph-who": [open("easing.speed_graph", SG_SNAP, SG_CHECK("unknown")), COPY.check.who_shaped],
  "skill-offset-layers-open": [open("timing.offset", OF_SNAP), "Proposed"],
  "skill-offset-layers-check": [open("timing.offset", OF_SNAP, OF_CHECK("layers")), COPY.check.offset.all_apart],
  "skill-offset-props-check": [open("timing.offset", OF_CHECK("properties")), COPY.check.offset.all_apart],
  "skill-pivot-open": [open("transform.anchor", T("anchor_snapshot", { lesson: "new", targets: [], focus: null })), COPY.check.slot_pivot],
  "skill-pivot-check": [open("transform.anchor", AN_CHECK(null)), "In place"],
  "skill-pivot-keyed": [open("transform.anchor", AN_CHECK({ passed: true })), "Held"],
  "skill-null-open": [open("parenting.null", T("null_parent_snapshot", { lesson: "new", targets: [], focus: null })), COPY.check.slot_null],
  "skill-null-place": [open("parenting.null", NU_CHECK("parenting", { applies: true, passed: false, region_now: "center", wanted: "top-left" })), "After the null"],
  "skill-null-parent": [open("parenting.null", NU_CHECK("parenting", null)), "Follows Null 1"],
  "skill-null-move": [open("parenting.null", NU_CHECK("move", null)), "The move"],
};

test("step 2's list names only real state ids", () => {
  for (const id of Object.keys(CASES)) assert.ok(STATE_IDS.includes(id), id);
});

for (const [id, [drive, marker]] of Object.entries(CASES)) {
  test(`SC-003: ${id} is reachable and shows what it should`, async () => {
    const h = await drive();
    assert.equal(h.app.model().state, id);
    assert.ok(allText(h).includes(marker), `${id} shows "${marker}"`);
    assert.doesNotMatch(allText(h).replace(/<[^>]*>/g, ""), /keyframes\.types|easing\.speed_graph|timing\.offset|transform\.anchor|parenting\.null|mcp__|ae-mentor|_snapshot|_check\b/, "no internal ids (FR-064)");
  });
}

// ---------- recorded streams ----------

const STREAMS = [
  ["keyframes.types", "key-types-06-do-the-rest-for-me"],
  ["easing.speed_graph", "speed-graph-05-do-the-rest-for-me"],
  ["timing.offset", "offset-16-do-the-rest-for-me"],
  ["transform.anchor", "anchor-22-one-key-dragged-off-it"],
  ["parenting.null", "null-parenting-04-demonstration"],
];

function jsonResults(file, tool) {
  const out = [];
  for (const line of fs.readFileSync(path.join(__dirname, "fixtures", "eval", `${file}.jsonl`), "utf8").split("\n")) {
    if (!line) continue;
    const m = JSON.parse(line);
    for (const b of (m.message && m.message.content) || []) if (b.type === "tool_result") for (const c of b.content || []) if (c.type === "text") { try { out.push(JSON.parse(c.text)); } catch (e) { /* not json */ } }
  }
  return out;
}

for (const [skill, file] of STREAMS) {
  test(`SC-002, SC-007: ${skill}'s recorded stream runs through the panel`, async () => {
    const h = await ready({ pathData: SIX_PATH });
    h.app.act("start", { skill });
    play(h, `eval/${file}.jsonl`);
    const m = h.app.model();
    assert.equal(m.lesson.skill, skill);
    assert.ok(m.messages.some((x) => x.role === "mentor"), "the mentor's words reached the chat");
    assert.doesNotMatch(allText(h), /undefined|\[object Object\]|mcp__|_check\b|_snapshot\b/);
    const checks = jsonResults(file).filter((r) => r && r.comp_matches !== undefined && (r.passed === true || r.passed === false));
    assert.ok(checks.length >= 1, "the stream has a check");
    assert.equal(m.lesson.passed, checks.at(-1).passed === true, "passed is only the tool's");
    if (m.lesson.check_list) {
      assert.ok(rowsOf(m.lesson.check_list).length >= 1);
      for (const r of rowsOf(m.lesson.check_list)) assert.notEqual(r.word, COPY.check.not_checked.toUpperCase());
      if (checks.at(-1).passed !== true) assert.ok(rowsOf(m.lesson.check_list).some((r) => r.family !== "done"), "a list that hasn't passed has something open");
    }
  });
}

test("a cut-off Show me on the other five: the demo landed, Show me again (FR-030, lesson-error-demo-other)", async () => {
  const h = await ready({ pathData: SIX_PATH });
  h.app.act("start", { skill: "keyframes.types" });
  h.adapter().emit("tool_result", { name: "key_types_snapshot", ok: true, text: "", images: [], json: { targets: ["a"], target_pairs: [{ id: "a", label: "Blink › Opacity 1–2 s" }], focus: ["Blink"], demo_target: "a" } });
  h.adapter().emit("turn_end", { ok: true, kind: "start" });
  h.app.act("show_me");
  h.adapter().emit("tool_result", { name: "key_types_demo", ok: true, text: "", images: [], json: { layer: "Blink", property: "Opacity", from_time: 1, to_time: 2, undo: "Edit > Undo" } });
  h.adapter().emit("turn_end", { ok: false, kind: "show_me" });
  assert.equal(h.app.model().state, "lesson-error-demo-other");
  assert.ok(allText(h).includes(COPY.errors.demo_other.title));
  assert.ok(allText(h).includes(COPY.buttons.show_me_again));
});
