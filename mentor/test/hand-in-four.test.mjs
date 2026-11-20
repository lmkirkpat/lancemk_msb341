// Spec 014 T073 (K6, FR-026; contracts/hand-in.md › Per skill): easing, key types, speed graph and
// offset open a lesson from an answer's hand-in. The focus is the hand-in's layer (offset adds the
// other layers its step names; key types the properties its step names); the reply carries the hand-in
// slice; a due review never takes its place (FR-023); a learned skill is practice; the layer gone gives
// hand_in_lost; a layer with no keys opens no focus and never errors; and the lesson hands back to
// the answer's next step (record_lesson or end_lesson).

process.env.TZ = "America/Denver";

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const PRACTICE = path.join(FIXTURES, "expressions", "practice.json");
const PRACTICE2 = path.join(FIXTURES, "expressions", "practice2.json");
const use = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
use(PRACTICE);
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
delete process.env.AE_MENTOR_RUNTIME;

const { TOOLS, FINDERS } = await import("../tools/index.mjs");
const session = await import("../lib/session.mjs");
const LEARNER = path.join(home, "learner.json");
const tool = (name) => TOOLS.find((t) => t.name === name).handler;
const call = async (name, args = {}) => JSON.parse((await tool(name)(args)).content[0].text);
const load = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const LAST = "Play it back and watch it land.";

// One case per skill: its snapshot tool, the fixture, the layer and the step's text.
const CASES = {
  "easing.basic": { tool: "snapshot_project", file: PRACTICE, layer: "Title", text: "Select Title's Position keys and apply Easy Ease." },
  "keyframes.types": { tool: "key_types_snapshot", file: PRACTICE2, layer: "Blink", text: "Select Blink's Opacity keys and make them hold keys." },
  "easing.speed_graph": { tool: "speed_graph_snapshot", file: PRACTICE, layer: "Subtitle", text: "Select Subtitle's last two Position keys and open the speed graph." },
  "timing.offset": { tool: "offset_snapshot", file: PRACTICE2, layer: "Chip A", text: "Shift Chip B and Chip C a few frames after Chip A." },
};
const handIn = (skill, over = {}) => {
  const c = CASES[skill];
  session.saveHandIn({
    skill, comp_id: load(c.file).comp.id, layer: c.layer, step_number: 1,
    steps: [{ text: c.text, skill, layer: c.layer }, { text: LAST, skill: null, layer: null }], goal: "a softer landing", place_named: false, ...over,
  });
};
const learnedDue = (skill) => fs.writeFileSync(LEARNER, JSON.stringify({
  version: 1,
  skills: { "easing.basic": { status: "learned", last_practiced: "2026-10-01T10:00:00.000Z", times_passed: 1, next: "n" }, [skill]: { status: "learned", last_practiced: "2026-10-01T10:00:00.000Z", times_passed: 1, next: "n", review_due: "2026-10-05", reviews_passed_in_row: 1 } },
  lessons: [{ date: "2026-10-01T10:00:00.000Z", skill, project: "x", comp: "y", attempted: "a", result: "passed", demo_used: false, summary: "s", next: "n", kind: "first", targets: [] }],
}));

beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f.startsWith("session.json") || f.startsWith("learner.json")) fs.rmSync(path.join(home, f));
});
afterEach(() => { delete process.env.AE_MENTOR_RUNTIME; });

test("all four finders take a hand-in, with their own skill folder", () => {
  assert.equal(FINDERS["easing.basic"].skill_command, "ease-mentor");
  assert.equal(FINDERS["keyframes.types"].skill_command, "key-types-mentor");
  assert.equal(FINDERS["easing.speed_graph"].skill_command, "speed-graph-mentor");
  assert.equal(FINDERS["timing.offset"].skill_command, "offset-mentor");
  for (const id of Object.keys(CASES)) assert.equal(FINDERS[id].hand_in, true);
});

for (const [skill, c] of Object.entries(CASES)) {
  test(`${skill}: opens on the hand-in's layer, with the slice; used once`, async () => {
    use(c.file);
    handIn(skill);
    const r = await call(c.tool);
    assert.equal(r.mode_source, "hand_in");
    assert.deepEqual(r.hand_in, { layer: c.layer, step_number: 1, steps_after: [LAST], place_named: false, practice: false, keyed: true });
    assert.equal(session.peekHandIn().used, true);
    assert.ok(r.targets.length > 0, "a focus with targets on that layer");
    const again = await call(c.tool);
    assert.notEqual(again.mode_source, "hand_in", "taken once");
    assert.equal(again.lesson, "continued");
    assert.equal(again.hand_in.layer, c.layer, "the continued lesson keeps its slice for the hand-back");
  });

  test(`${skill}: a learned skill with a due review: a lesson, practice, never a review (FR-023)`, async () => {
    use(c.file);
    learnedDue(skill);
    handIn(skill);
    const r = await call(c.tool);
    assert.equal(r.hand_in.practice, true);
    if ("mode" in r) assert.equal(r.mode, "lesson");
  });

  test(`${skill}: the layer gone gives hand_in_lost, and the lesson opens with no focus from it`, async () => {
    use(c.file);
    handIn(skill, { layer: "No Such Layer" });
    const r = await call(c.tool);
    assert.equal(r.mode_source, "hand_in_lost");
    assert.equal(r.hand_in.layer, "No Such Layer");
  });

  test(`${skill}: an end with nothing to record hands back to the next step`, async () => {
    use(c.file);
    handIn(skill);
    await call(c.tool);
    const r = await call("end_lesson");
    assert.deepEqual(r.hand_back, { step_number: 1, next_step: LAST });
  });
}

test("a layer with no keys: keyed false, no focus from it, and no error (K4 should keep this from happening)", async () => {
  use(PRACTICE2);
  for (const skill of ["keyframes.types", "timing.offset"]) {
    handIn(skill, { layer: "Hatch Rig" });
    const r = await call(CASES[skill].tool);
    assert.equal(r.mode_source, "hand_in");
    assert.equal(r.hand_in.keyed, false);
  }
  use(PRACTICE);
  for (const skill of ["easing.basic", "easing.speed_graph"]) {
    const snap = load(PRACTICE);
    const unkeyed = snap.layer_info.find((l) => l.kind === "solid" && !snap.layers.some((k) => k.name === l.name)).name; // Background
    handIn(skill, { layer: unkeyed });
    const r = await call(CASES[skill].tool);
    assert.equal(r.hand_in.keyed, false, skill);
  }
});

test("key types: the step's properties are the focus; offset: the layers its step names are the group", async () => {
  use(PRACTICE2);
  handIn("keyframes.types");
  const kt = await call("key_types_snapshot");
  assert.deepEqual(kt.focus, ["Blink"]);
  assert.ok(kt.target_pairs.every((p) => p.layer === "Blink" && p.property === "Opacity"));
  handIn("timing.offset");
  const off = await call("offset_snapshot");
  assert.deepEqual([...new Set(off.group.members.map((m) => m.layer))].sort(), ["Chip A", "Chip B", "Chip C"]);
});

test("easing end to end on A: give_answer, go_deeper, the snapshot, then record_lesson hands back", async () => {
  process.env.AE_MENTOR_RUNTIME = "a";
  use(PRACTICE);
  const c = CASES["easing.basic"];
  await call("give_answer", {
    kind: "answer",
    explanation: "In Mentor Practice, Title moves on its own Position keys, at one speed all the way.",
    steps: [{ text: c.text, skill: "easing.basic", layer: "Title" }, { text: LAST, skill: null, layer: null }],
    offered_skills: ["easing.basic"],
    closing_offer: "Try them, or want to go deeper with *Easing*?",
    goal: "a softer landing",
  });
  const go = await call("go_deeper", { skill: "Easing" });
  assert.equal(go.command_skill, "ease-mentor");
  const r = await call("snapshot_project");
  assert.equal(r.mode_source, "hand_in");
  assert.deepEqual(r.focus, ["Title"]);
  const saved = await call("record_lesson", { skill: "easing.basic", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice", attempted: "Easing on Title", result: "not_checked", demo_used: false, summary: "Started easing on Title.", next: "Ease Title's Position keys" });
  assert.deepEqual(saved.hand_back, { step_number: 1, next_step: LAST });
  assert.equal(JSON.parse(fs.readFileSync(LEARNER, "utf8")).asked[0].went_deeper, "easing.basic");
});

test("a later call with no focus keeps the hand-in's focus (speed graph's second opening call, a snapshot after a demo)", async () => {
  for (const skill of ["easing.basic", "easing.speed_graph", "timing.offset"]) {
    const c = CASES[skill];
    use(c.file);
    handIn(skill);
    const first = await call(c.tool);
    const args = skill === "easing.speed_graph" ? { skill_options: { eased_layers: [], land_hard: [] } } : {};
    const again = await call(c.tool, args);
    assert.deepEqual(again.focus, first.focus, skill);
    assert.deepEqual(again.targets, first.targets, skill);
  }
});

test("a lesson not from a hand-in keeps its old focus behaviour (no carried focus)", async () => {
  use(PRACTICE);
  const a = await call("snapshot_project", { focus_layers: ["Title"] });
  const b = await call("snapshot_project");
  assert.deepEqual(a.focus, ["Title"]);
  assert.notDeepEqual(b.focus, ["Title"], "a call with no focus covers the comp, as before");
});

test("T081 review: a stale hand-in lesson (begun an earlier day, nothing done) carries no focus and no hand-back on the next call", async () => {
  for (const skill of ["easing.basic", "easing.speed_graph", "timing.offset"]) {
    for (const f of fs.readdirSync(home)) if (f.startsWith("session.json")) fs.rmSync(path.join(home, f));
    const c = CASES[skill];
    use(c.file);
    handIn(skill);
    const first = await call(c.tool);
    assert.equal(first.hand_in.layer, c.layer);
    // Make it yesterday's: session.start then starts a new lesson, as for any stale one.
    const file = path.join(home, "session.json");
    const state = JSON.parse(fs.readFileSync(file, "utf8"));
    const key = String(state.current);
    state.lessons[key].lesson_id = new Date(Date.now() - 2 * 86400000).toISOString();
    fs.writeFileSync(file, JSON.stringify(state));
    const again = await call(c.tool);
    assert.equal(again.lesson, "new", skill);
    assert.equal("hand_in" in again, false, `${skill}: no slice, so no "That was step n"`);
    // Speed graph's own default proposal is Subtitle on this comp too, so only the other two show it.
    if (skill !== "easing.speed_graph") assert.notDeepEqual(again.targets, first.targets, `${skill}: the focus isn't carried`);
    const ended = await call("end_lesson");
    assert.equal("hand_back" in ended, false, skill);
  }
});
