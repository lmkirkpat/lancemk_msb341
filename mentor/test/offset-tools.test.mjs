// Spec 010's three tools in fixture mode (contracts/tools.md; spec 004 contracts/skill-module.md
// › 3): the lesson on Mentor Practice (properties kind, US1), on Mentor Practice 2 (layers kind,
// US2), and the review (US3). A temp AE_MENTOR_HOME; the real fixture twin, wrapped so a test can
// see whether the demo snippet ran at all.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { tempHome } from "./helpers.mjs";
import { DIR, KEY, load, PRACTICE2, PRACTICE_NOW } from "./fixtures/offset/load.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");
const EDITS = path.join(home, "fixture-edits.json");
const RUNS = path.join(home, "demo-runs.log");

// A twin folder whose offset-demo logs each run, then hands over to the real twin. With the
// REFUSE file present it refuses as the real snippet does through runSnippet (the bare reason), for
// what a read can't show (a locked layer, until spec 004's R1).
const REFUSE = path.join(home, "refuse-locked");
const twins = fs.mkdtempSync(path.join(os.tmpdir(), "ae-mentor-offset-twins-"));
const realTwin = pathToFileURL(path.resolve(DIR, "../../../fixture/offset-demo.mjs")).href;
const errors = pathToFileURL(path.resolve(DIR, "../../../errors.mjs")).href;
fs.writeFileSync(path.join(twins, "offset-demo.mjs"), [
  `import fs from "node:fs";`,
  `import * as real from ${JSON.stringify(realTwin)};`,
  `import { MentorError } from ${JSON.stringify(errors)};`,
  `export function run(args, ctx) {`,
  `  fs.appendFileSync(${JSON.stringify(RUNS)}, "run\\n");`,
  `  if (fs.existsSync(${JSON.stringify(REFUSE)})) throw new MentorError("OFFSET_REFUSED", "locked");`,
  `  return real.run(args, ctx);`,
  `}`,
  `export const apply = real.apply;`,
].join("\n"));

const project = (file, extra = {}) => fs.writeFileSync(stateFile, JSON.stringify({ project: path.isAbsolute(file) ? file : path.join(DIR, file), ...extra }));
project(PRACTICE_NOW);
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
process.env.AE_MENTOR_FIXTURE_TWINS = twins;

const { TOOLS, SKILLS, FINDERS } = await import("../tools/index.mjs");
const offsetTools = await import("../tools/offset.mjs");
const session = await import("../lib/session.mjs");
const { analyze } = await import("../lib/offset.mjs");

const call = async (name, args = {}) => JSON.parse((await TOOLS.find((t) => t.name === name).handler(args)).content[0].text);
const demoRuns = () => (fs.existsSync(RUNS) ? fs.readFileSync(RUNS, "utf8").split("\n").filter(Boolean).length : 0);
const edits = () => (fs.existsSync(EDITS) ? JSON.parse(fs.readFileSync(EDITS, "utf8")) : []);
const useRecord = (rel) => fs.copyFileSync(path.join(DIR, rel), LEARNER);

// A temp copy of a fixture, changed, for shapes no saved fixture has.
function variant(rel, change) {
  const s = load(rel);
  change(s);
  const file = path.join(home, `variant-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(file, JSON.stringify(s));
  return file;
}

beforeEach(() => {
  for (const f of [SESSION, LEARNER, EDITS, RUNS, REFUSE]) fs.rmSync(f, { force: true });
  useRecord("records/easing-learned.json");
  project(PRACTICE_NOW);
});

const PROPS = { kind: "properties", order: ["Position", "Scale", "Opacity"], gap_frames: 4 };
const DOTS = { kind: "layers", order: ["Dot 1", "Dot 2", "Dot 3"], gap_frames: 4 };

// ---- The module

test("tool names start with offset_, and SKILLS is the one record ID", () => {
  assert.deepEqual(offsetTools.SKILLS, ["timing.offset"]);
  assert.deepEqual(offsetTools.TOOLS.map((t) => t.name), ["offset_snapshot", "offset_demo", "offset_check"]);
  assert.ok(SKILLS.includes("timing.offset"));
  assert.equal(FINDERS["timing.offset"].review, true, "review mode passes its tests (T025, T026)");
});

// ---- US1: properties kind on Mentor Practice

test("offset_snapshot proposes Title's three properties, with no demo target until there's an order", async () => {
  const r = await call("offset_snapshot");
  assert.equal(r.lesson, "new");
  assert.equal(r.host.known, true);
  assert.equal(r.host.version, "26.5");
  assert.equal(r.proposed_kind, "properties");
  assert.deepEqual(r.group.members.map((m) => m.label), ["Position", "Scale", "Opacity"]);
  assert.equal(r.other_kind, "layers");
  assert.deepEqual(r.other_group.members.map((m) => m.label), ["Bar", "Glow"]);
  assert.equal(r.demo_target, null);
  assert.equal(r.no_demo_reason, "awaiting_order");
  assert.ok(r.frame_together > 0.5 && r.frame_together < 1.5);
  assert.equal(r.floor_check, undefined);
});

test("the call with the order and gap sets the demo target; a later call without skill_options keeps it", async () => {
  await call("offset_snapshot");
  const r = await call("offset_snapshot", { skill_options: PROPS });
  assert.equal(r.lesson, "continued");
  assert.equal(r.demo_target, "1/Transform › Scale/1");
  assert.deepEqual(r.order, ["Position", "Scale", "Opacity"]);
  assert.deepEqual(r.floor_check, { gap_frames: 4, gap_seconds: 0.133, gap_under_floor: false });
  const again = await call("offset_snapshot");
  assert.equal(again.demo_target, "1/Transform › Scale/1");
  assert.deepEqual(session.currentLesson().skill_options, PROPS);
});

test("floor_check: a 1-frame gap at 30 fps is under the floor, and there's no demo", async () => {
  const r = await call("offset_snapshot", { skill_options: { ...PROPS, gap_frames: 1 } });
  assert.equal(r.floor_check.gap_under_floor, true);
  assert.equal(r.demo_target, null);
  assert.equal(r.no_demo_reason, "gap_under_floor");
  await assert.rejects(call("offset_demo", { target: "1/Transform › Scale/1" }), { code: "NOT_DEMO_TARGET" });
  assert.equal(demoRuns(), 0);
});

test("offset_demo: off target refuses with no snippet run; on target shifts every key of that property; twice refuses", async () => {
  await call("offset_snapshot", { skill_options: PROPS });
  await assert.rejects(call("offset_demo", { target: "1/Transform › Opacity/1" }), { code: "NOT_DEMO_TARGET" });
  assert.equal(demoRuns(), 0);
  const r = await call("offset_demo", { target: "1/Transform › Scale/1" });
  assert.deepEqual(r, { layer: "Title", properties: ["Scale"], shift_frames: 4, from: 0.5, to: 0.633, undo: "Edit > Undo" });
  assert.equal(demoRuns(), 1);
  assert.deepEqual(edits().map((e) => [e.snippet, e.layer_index, e.property_paths, e.shift_frames]), [["offset-demo", 1, ["ADBE Transform Group/ADBE Scale"], 4]]);
  await assert.rejects(call("offset_demo", { target: "1/Transform › Scale/1" }), { code: "DEMO_USED" });
  assert.equal(demoRuns(), 1);
  // The demo survives into the next read, and the check credits it to the demo.
  const c = await call("offset_check");
  const scale = c.members.find((m) => m.label === "Title › Scale");
  assert.equal(scale.credit, "demo");
  assert.equal(scale.start_now, 0.633);
  assert.equal(c.passed, false, "Position and Opacity still start and land together");
  assert.deepEqual(c.still_same, [["Title › Position", "Title › Opacity"]]);
});

test("offset_demo: a shift past the comp's end refuses (OFFSET_REFUSED) with no snippet run, in plain words", async () => {
  project(variant(PRACTICE_NOW, (s) => (s.comp.duration = 1.6)));
  await call("offset_snapshot", { skill_options: PROPS });
  await assert.rejects(call("offset_demo", { target: "1/Transform › Scale/1" }), (e) => e.code === "OFFSET_REFUSED" && e.reason === "past_comp_end" && /after the end of the comp/.test(e.message) && !/_/.test(e.message));
  assert.equal(demoRuns(), 0);
  assert.equal(session.currentLesson().demo, null, "the demo isn't used up");
});

test("offset_demo: a locked layer refuses with no snippet run when the read shows it", async () => {
  project(variant(PRACTICE_NOW, (s) => (s.layers.find((l) => l.name === "Title").locked = true)));
  await call("offset_snapshot", { skill_options: PROPS });
  await assert.rejects(call("offset_demo", { target: "1/Transform › Scale/1" }), (e) => e.code === "OFFSET_REFUSED" && e.reason === "locked");
  assert.equal(demoRuns(), 0);
});

test("offset_demo: the snippet's own refusal (a lock the read can't see) reaches the learner in plain words", async () => {
  await call("offset_snapshot", { skill_options: PROPS });
  fs.writeFileSync(REFUSE, "");
  try {
    await assert.rejects(call("offset_demo", { target: "1/Transform › Scale/1" }),
      (e) => e.code === "OFFSET_REFUSED" && e.reason === "locked" && /left it as it was\. That layer is locked\.$/.test(e.message));
  } finally {
    fs.rmSync(REFUSE, { force: true });
  }
  assert.equal(demoRuns(), 1);
  assert.deepEqual(edits(), [], "nothing saved");
  assert.equal(session.currentLesson().demo, null, "the demo isn't used up");
});

test("offset_check grades as the answer key says, marks the lesson checked, and never changes the baseline", async () => {
  await call("offset_snapshot", { skill_options: { ...PROPS, order: ["Position", "Opacity", "Scale"] } });
  const before = JSON.stringify(session.currentLesson().baseline);
  project("stand-in/props-one-frame.json");
  const fail = await call("offset_check");
  assert.equal(fail.passed, false);
  assert.deepEqual(fail.still_same, KEY.checks["props-one-frame"].still_same);
  assert.equal(session.currentLesson().status, "checked");
  assert.equal(session.currentLesson().passed, false);
  project("stand-in/props-pass-landing.json");
  const pass = await call("offset_check");
  assert.equal(pass.passed, true);
  assert.equal(session.currentLesson().passed, true);
  assert.equal(JSON.stringify(session.currentLesson().baseline), before);
});

test("offset_check on another comp doesn't grade and doesn't mark the lesson", async () => {
  await call("offset_snapshot", { skill_options: PROPS });
  project(PRACTICE2);
  const r = await call("offset_check");
  assert.equal(r.comp_matches, false);
  assert.equal(r.lesson_comp, "Mentor Practice");
  assert.equal(session.currentLesson().status, "started");
});

test("offset_check with no offset lesson in progress says so", async () => {
  await assert.rejects(call("offset_check"), { code: "NO_SESSION" });
});

test("a focus of two properties has no demo (Subtitle)", async () => {
  const r = await call("offset_snapshot", { skill_options: { kind: "properties", members: ["Subtitle"], order: ["Opacity", "Position"], gap_frames: 4 } });
  assert.deepEqual(r.group.members.map((m) => m.label), ["Position", "Opacity"]);
  assert.equal(r.demo_target, null);
  assert.equal(r.no_demo_reason, "two_members");
});

// ---- US2: layers kind on Mentor Practice 2

test("layers kind: the demo shifts every keyed property on Dot 2 (effect key included)", async () => {
  project(PRACTICE2);
  const r = await call("offset_snapshot", { skill_options: DOTS });
  assert.deepEqual(r.group.members.map((m) => m.label), ["Dot 1", "Dot 2", "Dot 3"]);
  assert.equal(r.demo_target, "layer/6");
  const d = await call("offset_demo", { target: "layer/6" });
  assert.deepEqual(d.properties, ["Position", "Opacity", "Blurriness"]);
  assert.equal(d.from, 0.5);
  assert.equal(d.to, 0.633);
  const c = await call("offset_check");
  const dot2 = c.members.find((m) => m.layer === "Dot 2");
  assert.deepEqual(dot2.moved_by, { Position: 4, Opacity: 4, Blurriness: 4 });
  assert.equal(dot2.split, null);
  assert.equal(dot2.credit, "demo");
  assert.deepEqual(c.still_same, [["Dot 1", "Dot 3"]]);
});

test("layers kind: the demo on Dot 3 shifts both separated dimensions and a single key", async () => {
  const file = variant(PRACTICE2, (s) => {
    const dot3 = s.layers.find((l) => l.name === "Dot 3");
    dot3.properties.push({ path: "ADBE Transform Group/ADBE Rotate Z", display_path: "Transform › Rotation", match_name: "ADBE Rotate Z", display_name: "Rotation", dimensions: 1, expression_enabled: false, keys: [{ index: 1, time: 0.5, in_type: "linear", out_type: "linear", value: 0, in_ease: [], out_ease: [] }] });
  });
  project(file);
  await call("offset_snapshot", { skill_options: { ...DOTS, order: ["Dot 1", "Dot 3", "Dot 2"] } });
  const d = await call("offset_demo", { target: "layer/7" });
  assert.deepEqual(d.properties, ["X Position", "Y Position", "Opacity", "Rotation"]);
  const snap = await (await import("../bridge-client.mjs")).runSnippet("snapshot", {});
  const dot3 = snap.layers.find((l) => l.name === "Dot 3");
  assert.deepEqual(dot3.properties.map((p) => p.keys[0].time), [0.633, 0.633, 0.633, 0.633]);
  const c = await call("offset_check");
  assert.equal(c.members.find((m) => m.layer === "Dot 3").split, null, "moved together, not split");
});

test("layers kind: 'pops in' fails with the split; named as on purpose on the next check, it passes", async () => {
  project(PRACTICE2);
  await call("offset_snapshot", { skill_options: DOTS });
  project("stand-in/pops-in.json");
  const first = await call("offset_check");
  assert.equal(first.passed, false);
  assert.deepEqual(first.members.find((m) => m.layer === "Dot 1").split, { moved: ["Opacity"], stayed: ["Position"], within_position: null, on_purpose: false });
  const next = await call("offset_check", { split: ["Dot 1"] });
  assert.equal(next.passed, true);
  // Said up front, it counts from the first check.
  fs.rmSync(SESSION, { force: true });
  project(PRACTICE2);
  await call("offset_snapshot", { skill_options: { ...DOTS, split: ["Dot 1"] } });
  project("stand-in/pops-in.json");
  assert.equal((await call("offset_check")).passed, true);
});

test("layers kind: a changed order is flagged, never a fail; uneven gaps set the rhythm, never a fail", async () => {
  project(PRACTICE2);
  await call("offset_snapshot", { skill_options: DOTS });
  project("stand-in/order-differs.json");
  const o = await call("offset_check");
  assert.equal(o.passed, true);
  assert.equal(o.order_differs, true);
  project("stand-in/layers-uneven.json");
  const u = await call("offset_check");
  assert.equal(u.passed, true);
  assert.deepEqual(u.rhythm, { uneven: true });
  project("stand-in/layers-pass.json");
  assert.deepEqual((await call("offset_check")).rhythm, { uneven: false });
});

// ---- US3: review

test("review: gives the Chips, never a Dot; no demo, and no snippet run", async () => {
  useRecord("records/learned-dots.json");
  project(PRACTICE2);
  const r = await call("offset_snapshot", { mode: "review" });
  assert.equal(r.mode, "review");
  assert.equal(r.group.kind, "layers");
  assert.deepEqual(r.group.members.map((m) => m.label), KEY.focus["stand-in/practice2-before.json"].review_after_dots.members);
  assert.ok(!r.focus.some((l) => l.startsWith("Dot")));
  assert.equal(r.demo_target, null);
  assert.equal(r.no_demo_reason, "review");
  const withOrder = await call("offset_snapshot", { mode: "review", skill_options: { order: ["Chip A", "Chip B", "Chip C"], gap_frames: 4 } });
  assert.equal(withOrder.demo_target, null);
  await assert.rejects(call("offset_demo", { target: "layer/10" }), { code: "REVIEW_NO_DEMO" });
  assert.equal(demoRuns(), 0);
});

test("review: with every group's units in the record, no_new_target", async () => {
  const mp2 = load(PRACTICE2);
  const { groups } = await import("../lib/offset.mjs");
  const all = groups(mp2).pool.flatMap((p) => p.units.map((u) => ({ layer: p.tl.layer, property: u.name })));
  const rec = JSON.parse(fs.readFileSync(path.join(DIR, "records/learned-dots.json"), "utf8"));
  rec.lessons[1].targets = all;
  fs.writeFileSync(LEARNER, JSON.stringify(rec));
  project(PRACTICE2);
  const r = await call("offset_snapshot", { mode: "review" });
  assert.equal(r.group, null);
  assert.deepEqual(r.targets, []);
  assert.equal(r.no_demo_reason, "no_new_target");
  assert.equal(FINDERS["timing.offset"].focus(mp2, { exclude: all }).count, 0);
});

test("FINDERS with the record's past targets as exclude agrees with the review", async () => {
  const mp2 = load(PRACTICE2);
  const rec = JSON.parse(fs.readFileSync(path.join(DIR, "records/learned-dots.json"), "utf8"));
  const past = rec.lessons[1].targets;
  const f = FINDERS["timing.offset"].focus(mp2, { exclude: past });
  assert.equal(f.count, 3);
  assert.deepEqual(f.layers, ["Chip A", "Chip B", "Chip C"]);
  assert.equal(analyze(mp2, { exclude: past }).group.members.length, f.count);
});

test("recommend_next offers this skill's review on Mentor Practice 2 when it's due", async () => {
  useRecord("records/learned-dots.json");
  project(PRACTICE2);
  const r = await call("recommend_next");
  assert.equal(r.recommendation.skill, "timing.offset");
  assert.equal(r.recommendation.kind, "review");
  assert.deepEqual(r.recommendation.focus_layers, ["Chip A", "Chip B", "Chip C"]);
});

test("record_lesson after a layers-kind lesson stores every counted unit of each member layer (RQ-1)", async () => {
  project(PRACTICE2);
  await call("offset_snapshot", { skill_options: DOTS });
  project("stand-in/layers-pass.json");
  assert.equal((await call("offset_check")).passed, true);
  await call("record_lesson", {
    skill: "timing.offset", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice 2",
    attempted: "Staggered Dot 1, Dot 2 and Dot 3, in that order", result: "passed", demo_used: false,
    summary: "Gaps about 4 frames each.", next: "Stagger the Chips.",
  });
  const rec = JSON.parse(fs.readFileSync(LEARNER, "utf8"));
  const last = rec.lessons[rec.lessons.length - 1];
  assert.deepEqual(last.targets.map((t) => [t.layer, t.property]), KEY.focus["stand-in/practice2-before.json"].layers_target_refs);
  assert.equal(rec.skills["timing.offset"].status, "learned");
});

test("record_lesson after a properties-kind lesson stores Title's three properties", async () => {
  await call("offset_snapshot", { skill_options: { ...PROPS, order: ["Position", "Opacity", "Scale"] } });
  project("stand-in/props-pass-landing.json");
  await call("offset_check");
  await call("record_lesson", {
    skill: "timing.offset", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice",
    attempted: "Staggered Title's Position, Opacity and Scale, in that order", result: "passed", demo_used: false,
    summary: "Opacity lands about 4 frames early; Scale about 4 frames later.", next: "Try a group of layers on Mentor Practice 2.",
  });
  const rec = JSON.parse(fs.readFileSync(LEARNER, "utf8"));
  assert.deepEqual(rec.lessons.at(-1).targets, [
    { layer: "Title", property: "Position" }, { layer: "Title", property: "Scale" }, { layer: "Title", property: "Opacity" },
  ]);
});
