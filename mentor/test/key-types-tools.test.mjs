// Spec 009 T013, T014, T020, T022, T024: the three key_types_ tools in fixture mode with a temp
// AE_MENTOR_HOME. The lesson, the one demo, the check, the practice blink's fresh restart, the
// kept-linear mark, and review mode.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tempHome } from "./helpers.mjs";
import { recordPath, source } from "./fixtures/key-types/load.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const setProject = (name) => fs.writeFileSync(stateFile, JSON.stringify({ project: source(name) }));
setProject("practice2-before.json");
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const KT = await import("../tools/key-types.mjs");
const { TOOLS } = await import("../tools/index.mjs");
const session = await import("../lib/session.mjs");

const LEARNER = path.join(home, "learner.json");
const SESSION = path.join(home, "session.json");
const EDITS = path.join(home, "fixture-edits.json");
const OPA = "ADBE Transform Group/ADBE Opacity";
const B = (i) => `1/${OPA}/${i}`;
const tool = (name) => TOOLS.find((t) => t.name === name).handler;
const data = async (p) => JSON.parse((await p).content[0].text);
const snap = (args = {}) => data(tool("key_types_snapshot")(args));
const demo = (segment_id) => data(tool("key_types_demo")({ segment_id }));
const check = (args = {}) => data(tool("key_types_check")(args));
const edits = () => (fs.existsSync(EDITS) ? JSON.parse(fs.readFileSync(EDITS, "utf8")) : []);
const record = () => JSON.parse(fs.readFileSync(LEARNER, "utf8"));
const useRecord = (name) => fs.copyFileSync(recordPath(name), LEARNER);
const BLINK = { focus: [{ layer: "Blink", property: "Opacity" }] };
const entry = (over = {}) => ({
  skill: "keyframes.types", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice 2", attempted: "Held the Blink pairs",
  result: "passed", demo_used: false, summary: "Every Blink pair snaps. Said Spinner runs at constant speed.", next: "Try Cut.", ...over,
});

beforeEach(() => {
  for (const f of [LEARNER, SESSION, EDITS]) fs.rmSync(f, { force: true });
  setProject("practice2-before.json");
  useRecord("easing-learned.json");
});

// ---- T013

test("tool names start with key_types_, SKILLS is keyframes.types, and index.mjs finds them", () => {
  assert.deepEqual(KT.SKILLS, ["keyframes.types"]);
  assert.deepEqual(KT.TOOLS.map((t) => t.name), ["key_types_snapshot", "key_types_demo", "key_types_check"]);
  for (const t of KT.TOOLS) assert.ok(TOOLS.includes(t), t.name);
  assert.equal(KT.FINDERS["keyframes.types"].review, true);
});

test("no focus: candidates and no targets; naming Blink gives its pairs and a demo target", async () => {
  const first = await snap();
  assert.equal(first.lesson, "new");
  assert.deepEqual(first.candidates.map((c) => c.layer), ["Blink", "Cut"]);
  assert.deepEqual(first.targets, []);
  assert.equal(first.demo_target, null);
  assert.equal(first.no_demo_reason, "awaiting_focus");
  assert.equal(first.host.version, "26.5");

  const named = await snap({ skill_options: BLINK });
  assert.equal(named.lesson, "continued");
  assert.deepEqual(named.targets, [B(1), B(2), B(3)]);
  assert.equal(named.demo_target, B(1));
  assert.deepEqual(named.focus, ["Blink"]);
  assert.deepEqual(named.target_pairs.map((p) => p.label), ["Blink › Opacity 1–1.4 s", "Blink › Opacity 1.4–1.8 s", "Blink › Opacity 1.8–2.2 s"]);
});

test("a later call without skill_options keeps the focus, continued and resumed", async () => {
  await snap({ skill_options: BLINK });
  const again = await snap();
  assert.equal(again.lesson, "continued");
  assert.deepEqual(again.targets, [B(1), B(2), B(3)]);
  setProject("practice-now.json");
  await snap(); // a key types lesson on Mentor Practice
  setProject("practice2-before.json");
  const back = await snap();
  assert.equal(back.lesson, "resumed");
  assert.deepEqual(back.targets, [B(1), B(2), B(3)]);
});

test("the demo: off target is refused, the target works once, and no snippet runs on a refusal", async () => {
  await snap({ skill_options: BLINK });
  await assert.rejects(tool("key_types_demo")({ segment_id: B(2) }), { code: "NOT_DEMO_TARGET" });
  assert.deepEqual(edits(), []);
  const r = await demo(B(1));
  assert.deepEqual(r, { layer: "Blink", property: "Opacity", from_time: 1, to_time: 1.4, in_type: "bezier", out_type: "hold", frames: { before: 1.367, after: 1.433 }, undo: "Edit > Undo" });
  await assert.rejects(tool("key_types_demo")({ segment_id: B(1) }), { code: "DEMO_USED" });
  assert.equal(edits().length, 1);
  assert.equal(edits()[0].snippet, "key-types-demo");
  const after = await snap();
  assert.equal(after.demo_target, null);
  assert.equal(after.no_demo_reason, "demo_used");
});

test("the check grades per the answer key, marks the check only when the comp matches, and never moves the baseline", async () => {
  await snap({ skill_options: BLINK });
  const baseline = JSON.stringify(session.currentLesson().baseline);
  setProject("practice-now.json");
  const other = await check();
  assert.equal(other.comp_matches, false);
  assert.equal(session.currentLesson().checked, undefined, "no markChecked on another comp");

  setProject("practice2-before.json");
  await demo(B(1));
  setProject("blink-one-held.json");
  const r = await check();
  assert.deepEqual(r.pairs.map((p) => p.verdict), ["held_by_demo", "held_by_learner", "not_held"]);
  assert.equal(r.pairs[2].frame_time, 2);
  assert.equal(r.passed, false);
  assert.equal(session.currentLesson().checked, true);
  assert.equal(session.currentLesson().passed, false);
  assert.equal(JSON.stringify(session.currentLesson().baseline), baseline);
});

test("Edit > Undo of the demo, then the learner's own hold: credited to the learner (row 20)", async () => {
  await snap({ skill_options: BLINK });
  await demo(B(1));
  fs.writeFileSync(stateFile, JSON.stringify({ project: source("practice2-before.json"), undo_demo: true }));
  const undone = await check();
  assert.equal(undone.pairs[0].verdict, "not_held");
  assert.equal(undone.demo_undone, true);
  setProject("blink-all-held.json");
  const all = await check();
  assert.deepEqual(all.pairs.map((p) => p.verdict), ["held_by_learner", "held_by_learner", "held_by_learner"]);
  assert.equal(all.passed, true);
});

// ---- T014: the practice blink (row 17, FR-007)

const FADES = [{ layer: "Title", property: "Opacity" }, { layer: "Subtitle", property: "Opacity" }];

test("practice blink: nothing to target before; fresh: true after the blink makes its pairs the targets", async () => {
  setProject("practice-blink-before.json");
  const before = await snap({ skill_options: { should_move: FADES } });
  assert.deepEqual(before.candidates, []);
  assert.deepEqual(before.targets, []);
  assert.equal(before.no_demo_reason, "no_candidate");

  setProject("practice-blink-after.json");
  const logo = { focus: [{ layer: "Logo", property: "Opacity" }], should_move: FADES };
  const stale = await snap({ skill_options: logo });
  assert.equal(stale.lesson, "continued");
  assert.deepEqual(stale.targets, [], "the first look's baseline has no blink");

  const fresh = await snap({ fresh: true, skill_options: logo });
  assert.equal(fresh.lesson, "new");
  assert.deepEqual(fresh.targets, [`7/${OPA}/1`, `7/${OPA}/2`, `7/${OPA}/3`]);
  assert.equal(fresh.demo_target, `7/${OPA}/1`);
  assert.ok(session.currentLesson().baseline.layers.find((l) => l.name === "Logo").properties.some((p) => p.path === OPA));
});

test("fresh: true after a demo or a check is LESSON_UNDERWAY and changes nothing", async () => {
  await snap({ skill_options: BLINK });
  await demo(B(1));
  const before = fs.readFileSync(SESSION, "utf8");
  await assert.rejects(tool("key_types_snapshot")({ fresh: true, skill_options: BLINK }), { code: "LESSON_UNDERWAY" });
  assert.equal(fs.readFileSync(SESSION, "utf8"), before);

  fs.rmSync(SESSION);
  fs.rmSync(EDITS);
  await snap({ skill_options: BLINK });
  await check();
  await assert.rejects(tool("key_types_snapshot")({ fresh: true, skill_options: BLINK }), { code: "LESSON_UNDERWAY" });
});

// ---- T020, T022: linear on purpose (FR-014, SC-006)

test("Spinner named at stage 6: linear, marked, and record_lesson writes exactly one mark", async () => {
  await snap({ skill_options: BLINK });
  setProject("blink-all-held.json");
  const r = await check({ constant_speed: { layer: "Spinner", property: "Rotation" } });
  assert.equal(r.constant_speed.verdict, "linear");
  assert.equal(r.constant_speed.marked, true);
  assert.equal(r.items.constant_speed, true);
  assert.equal(r.passed, true);
  assert.equal(session.currentLesson().checked, true, "the check is recorded before the note");
  await data(tool("record_lesson")(entry()));
  const marks = record().marks;
  assert.equal(marks.length, 1);
  assert.deepEqual({ layer: marks[0].layer, path: marks[0].path, key_times: marks[0].key_times, comp: marks[0].comp },
    { layer: "Spinner", path: "ADBE Transform Group/ADBE Rotate Z", key_times: [0.25, 4.25], comp: "Mentor Practice 2" });
});

test("expression, not linear, not found, withdrawn: nothing noted, 0 marks", async () => {
  const cases = [
    ["practice-now.json", { focus: [{ layer: "Title", property: "Opacity" }] }, { layer: "Logo", property: "Rotation" }, "expression"],
    ["spinner-eased.json", BLINK, { layer: "Spinner", property: "Rotation" }, "not_linear"],
    ["practice2-before.json", BLINK, { layer: "Nobody", property: "Rotation" }, "not_found"],
    ["practice2-before.json", BLINK, null, null],
  ];
  for (const [file, opts, cs, verdict] of cases) {
    for (const f of [LEARNER, SESSION, EDITS]) fs.rmSync(f, { force: true });
    useRecord("easing-learned.json");
    setProject(file);
    await snap({ skill_options: opts });
    const r = await check(cs ? { constant_speed: cs } : {});
    assert.equal(r.constant_speed ? r.constant_speed.verdict : null, verdict, file);
    if (r.constant_speed) assert.equal(r.constant_speed.marked, false);
    assert.deepEqual(session.currentLesson().kept_linear, [], `${file}: keepLinear not called`);
    await data(tool("record_lesson")(entry({ comp: r.lesson_comp, result: "partial" })));
    assert.equal((record().marks || []).length, 0, file);
  }
});

test("after the mark, an easing lesson on that comp leaves Spinner out; key types lists it as kept linear (FR-015)", async () => {
  useRecord("kept-linear-spinner.json");
  const easing = await data(tool("snapshot_project")({}));
  assert.ok(easing.skipped.some((s) => s.layer === "Spinner" && s.property === "Rotation" && s.reason === "kept_linear"));
  assert.equal(easing.findings.some((f) => f.layer === "Spinner"), false);
  fs.rmSync(SESSION);
  const kt = await snap();
  const kept = kt.left_out.find((g) => g.reason === "kept_linear");
  assert.deepEqual(kept.properties, [{ layer: "Spinner", property: "Rotation" }]);
  assert.equal(kt.candidates.some((c) => c.layer === "Spinner"), false);
});

test("no tool input writes a mark except constant_speed through the check", () => {
  const inputs = Object.fromEntries(KT.TOOLS.map((t) => [t.name, Object.keys(t.inputSchema.properties)]));
  assert.deepEqual(inputs, {
    key_types_snapshot: ["mode", "fresh", "skill_options"],
    key_types_demo: ["segment_id"],
    key_types_check: ["should_move", "constant_speed"],
  });
  for (const t of KT.TOOLS) {
    assert.equal(t.inputSchema.additionalProperties, false, t.name);
    assert.equal(JSON.stringify(t.inputSchema).match(/mark|kept|linear/i), null, t.name);
  }
});

// ---- T024: review mode (FR-009, FR-019, research R1)

test("review: Cut is the candidate, not Blink; awaiting_focus before a focus; no demo", async () => {
  useRecord("learned-blink.json");
  const r = await snap({ mode: "review" });
  assert.equal(r.mode, "review");
  assert.deepEqual(r.candidates.map((c) => c.layer), ["Cut"]);
  assert.deepEqual(r.targets, []);
  assert.equal(r.no_demo_reason, "awaiting_focus");
  const named = await snap({ mode: "review", skill_options: { focus: [{ layer: "Cut", property: "Opacity" }] } });
  assert.deepEqual(named.targets, [`3/${OPA}/1`]);
  assert.equal(named.demo_target, null);
  await assert.rejects(tool("key_types_demo")({ segment_id: `3/${OPA}/1` }), { code: "REVIEW_NO_DEMO" });
  assert.deepEqual(edits(), []);
  const blink = await snap({ mode: "review", skill_options: BLINK });
  assert.deepEqual(blink.refused, [{ layer: "Blink", property: "Opacity", reason: "past_target" }]);
});

test("review: a comp whose only candidates are past targets gives no_new_target", async () => {
  const rec = JSON.parse(fs.readFileSync(recordPath("learned-blink.json"), "utf8"));
  rec.lessons[1].targets.push({ layer: "Cut", property: "Opacity" });
  fs.writeFileSync(LEARNER, JSON.stringify(rec));
  const r = await snap({ mode: "review" });
  assert.deepEqual(r.candidates, []);
  assert.equal(r.no_demo_reason, "no_new_target");
});

test("review: a volunteered constant-speed move is confirmed and marked but doesn't change the pass (H-4)", async () => {
  useRecord("learned-blink.json");
  await snap({ mode: "review", skill_options: { focus: [{ layer: "Cut", property: "Opacity" }] } });
  setProject("select-all-hold.json"); // Cut held (and Blink, Card, Pause as extras)
  const r = await check({ constant_speed: { layer: "Spinner", property: "Rotation" } });
  assert.deepEqual(r.pairs.map((p) => p.verdict), ["held_by_learner"]);
  assert.equal(r.constant_speed.verdict, "linear");
  assert.equal(r.constant_speed.marked, true);
  assert.equal(r.items.constant_speed, null);
  assert.equal(r.passed, true);
  assert.ok(r.extra_holds.length > 0);
  const held = await check({ constant_speed: { layer: "Blink", property: "Opacity" } });
  assert.equal(held.constant_speed.verdict, "held");
  assert.equal(held.passed, true, "not graded in a review");
});

test("the finder with the past targets as exclude agrees with the review's candidates", async () => {
  useRecord("learned-blink.json");
  const r = await snap({ mode: "review" });
  const f = KT.FINDERS["keyframes.types"].focus(session.currentLesson().baseline, { exclude: [{ layer: "Blink", property: "Opacity" }] });
  assert.equal(f.count, r.candidates.length);
  assert.deepEqual(f.layers, r.candidates.map((c) => c.layer));
});
