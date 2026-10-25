// Spec 012's three tools in fixture mode (contracts/tools.md; spec 004 contracts/skill-module.md
// › 3): the lesson on Mentor Practice 2 (US1), the jump (US2), the review (US3) and the missing
// prerequisite (US4). A temp AE_MENTOR_HOME; the real fixture twin, wrapped so a test can see
// whether the demo snippet ran at all.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { tempHome } from "./helpers.mjs";
import { DIR, load, where } from "./fixtures/null-parenting/load.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");
const EDITS = path.join(home, "fixture-edits.json");
const RUNS = path.join(home, "demo-runs.log");

const twins = fs.mkdtempSync(path.join(os.tmpdir(), "ae-mentor-null-twins-"));
const realTwin = pathToFileURL(path.resolve(DIR, "../../../fixture/null-parent-demo.mjs")).href;
fs.writeFileSync(path.join(twins, "null-parent-demo.mjs"), [
  `import fs from "node:fs";`,
  `import * as real from ${JSON.stringify(realTwin)};`,
  `export function run(args, ctx) {`,
  `  fs.appendFileSync(${JSON.stringify(RUNS)}, "run\\n");`,
  `  return real.run(args, ctx);`,
  `}`,
  `export const apply = real.apply;`,
].join("\n"));

const project = (name, extra = {}) => fs.writeFileSync(stateFile, JSON.stringify({ project: path.isAbsolute(name) ? name : where(name), ...extra }));
project("practice2b.json");
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
process.env.AE_MENTOR_FIXTURE_TWINS = twins;

const { TOOLS, FINDERS } = await import("../tools/index.mjs");
const nullTools = await import("../tools/null-parenting.mjs");
const session = await import("../lib/session.mjs");
const { proposal } = await import("../lib/null-parenting.mjs");

const tool = (name) => TOOLS.find((t) => t.name === name);
const call = async (name, args = {}) => JSON.parse((await tool(name).handler(args)).content[0].text);
const fails = async (name, args, code) => {
  await assert.rejects(tool(name).handler(args), (e) => {
    assert.equal(e.code, code);
    return true;
  });
};
const demoRuns = () => (fs.existsSync(RUNS) ? fs.readFileSync(RUNS, "utf8").split("\n").filter(Boolean).length : 0);
const useRecord = (rel) => fs.copyFileSync(path.join(DIR, "records", rel), LEARNER);
const lesson = () => session.currentLesson();

function variant(name, change) {
  const s = load(name);
  change(s);
  const file = path.join(home, `variant-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(file, JSON.stringify(s));
  return file;
}

beforeEach(() => {
  for (const f of [SESSION, LEARNER, EDITS, RUNS]) fs.rmSync(f, { force: true });
  useRecord("anchor-learned.json");
  project("practice2b.json");
});

const GROUP = ["Tile", "Caption", "Stamp"];
async function startGroup() {
  project("practice2b.json");
  return call("null_parent_snapshot", { skill_options: { focus: GROUP } });
}
async function placeNull(input = { region: "center" }) {
  project("null-center.json");
  return call("null_parent_check", input);
}

// ---- The module

test("tool names start with null_parent_, SKILLS is the one record ID, and review mode is on", () => {
  assert.deepEqual(nullTools.SKILLS, ["parenting.null"]);
  assert.deepEqual(nullTools.TOOLS.map((t) => t.name), ["null_parent_snapshot", "null_parent_demo", "null_parent_check"]);
  assert.equal(FINDERS["parenting.null"].review, true);
});

// ---- US1: the lesson

test("null_parent_snapshot with no focus proposes Tile, Caption and Stamp and lists what it leaves out", async () => {
  const r = await call("null_parent_snapshot");
  assert.equal(r.lesson, "new");
  assert.equal(r.host.version, "26.5");
  assert.deepEqual(r.proposal, GROUP);
  assert.deepEqual(r.targets, []);
  assert.equal(r.demo_target, null);
  assert.equal(r.no_demo_reason, "awaiting_focus");
  assert.ok(r.left_out.some((l) => l.layer === "Shadow" && l.reason === "parented" && l.parent === "Plate"));
  assert.ok(!r.left_out.some((l) => l.layer === "Reveal Matte"), "the matte isn't left out as hidden");
  assert.equal(r.before_time, null);
});

test("with skill_options.focus the lesson starts again from that read; its time is the stored before-read time", async () => {
  await call("null_parent_snapshot");
  const r = await startGroup();
  assert.equal(r.focus_set, true);
  assert.equal(r.lesson, "new");
  assert.deepEqual(r.focus, GROUP);
  assert.deepEqual(r.targets, ["parent/Tile", "parent/Caption", "parent/Stamp"]);
  assert.equal(r.demo_target, "parent/Tile");
  assert.equal(r.before_time, 0);
  assert.equal(r.null_ready, false);
  assert.equal(lesson().baseline.comp.time, 0);
  // The same focus again continues the lesson.
  const again = await call("null_parent_snapshot", { skill_options: { focus: [...GROUP].reverse() } });
  assert.equal(again.lesson, "continued");
});

test("a focus with a name another layer shares is refused (rename_needed) and changes no lesson", async () => {
  await startGroup();
  const before = fs.readFileSync(SESSION, "utf8");
  project(variant("practice2b.json", (s) => { s.layer_info.find((l) => l.name === "Row B").name = "Row A"; }));
  const r = await call("null_parent_snapshot", { skill_options: { focus: ["Row A", "Row C"] } });
  assert.equal(r.focus_set, false);
  assert.deepEqual(r.rename_needed, ["Row A"]);
  assert.equal(fs.readFileSync(SESSION, "utf8"), before);
});

test("after a check, a new focus is refused with LESSON_UNDERWAY", async () => {
  await startGroup();
  await placeNull();
  project("practice2b.json");
  await fails("null_parent_snapshot", { skill_options: { focus: ["Row A", "Row B"] } }, "LESSON_UNDERWAY");
});

test("without layer_info nothing starts", async () => {
  project(variant("practice2b.json", (s) => delete s.layer_info));
  const r = await call("null_parent_snapshot", { skill_options: { focus: GROUP } });
  assert.deepEqual([r.can_teach, r.why], [false, "no_layer_info"]);
  assert.equal(fs.existsSync(SESSION), false);
});

test("null_parent_check stores the null in skill_data, re-stores it while nothing is parented, and not after", async () => {
  await startGroup();
  const r1 = await placeNull({ region: "slides_only" });
  assert.deepEqual(r1.codes, ["null_ready"]);
  assert.equal(lesson().skill_data.null.name, "Null 1");
  assert.equal(lesson().skill_data.null.region, "slides_only");
  assert.deepEqual(lesson().skill_data.stored.position, [1215, 165]);
  project("null-moved.json");
  await call("null_parent_check");
  assert.deepEqual(lesson().skill_data.stored.position, [1300, 300], "re-stored (D-1)");
  project("null-moved-before-parenting.json");
  const r3 = await call("null_parent_check");
  assert.equal(r3.parenting_passed, true);
  assert.equal(lesson().skill_data.parented_seen, true);
  project("null-center.json");
  await call("null_parent_check");
  assert.deepEqual(lesson().skill_data.stored.position, [1300, 300], "never again once parented");
});

test("the model can't supply the stored null: the check takes only the learner's answers", () => {
  const props = tool("null_parent_check").inputSchema.properties;
  assert.deepEqual(Object.keys(props).sort(), ["chain_on_purpose", "null", "region"]);
  assert.equal(tool("null_parent_check").inputSchema.additionalProperties, false);
});

test("null_parent_demo before the null is stored refuses null_not_ready, with no snippet run", async () => {
  await startGroup();
  await assert.rejects(tool("null_parent_demo").handler({ target: "parent/Tile" }), (e) => e.code === "NULL_PARENT_REFUSED" && e.reason === "null_not_ready" && !/null_not_ready/.test(e.message));
  assert.equal(demoRuns(), 0);
});

test("null_parent_demo off target is NOT_DEMO_TARGET and twice is DEMO_USED, each with no snippet run", async () => {
  await startGroup();
  await placeNull();
  await fails("null_parent_demo", { target: "parent/Caption" }, "NOT_DEMO_TARGET");
  assert.equal(demoRuns(), 0);
  const r = await call("null_parent_demo", { target: "parent/Tile" });
  assert.equal(demoRuns(), 1);
  assert.deepEqual([r.layer, r.null, r.moved_px, r.jumped, r.undo, r.frame_time], ["Tile", "Null 1", 0, false, "Edit > Undo", 0]);
  await fails("null_parent_demo", { target: "parent/Tile" }, "DEMO_USED");
  assert.equal(demoRuns(), 1);
});

test("the demo refuses null_scale_zero before any write", async () => {
  await startGroup();
  await placeNull();
  project(variant("null-center.json", (s) => { s.layer_info[0].samples.forEach((x) => (x.scale = [0, 100, 100])); }));
  await assert.rejects(tool("null_parent_demo").handler({ target: "parent/Tile" }), (e) => e.reason === "null_scale_zero");
  assert.equal(demoRuns(), 0);
  assert.equal(lesson().demo, null, "the demo isn't used up");
});

test("the demo layer is credited to the demo, then the learner's after an undo and their own parenting (row 39)", async () => {
  await startGroup();
  await placeNull();
  await call("null_parent_demo", { target: "parent/Tile" });
  project("null-center.json");
  const r1 = await call("null_parent_check");
  assert.equal(r1.layers.find((l) => l.layer === "Tile").credit, "demo");
  assert.equal(r1.layers.find((l) => l.layer === "Tile").p1, true);
  project("null-center.json", { undo_demo: true });
  const r2 = await call("null_parent_check");
  assert.equal(r2.demo_undone, true);
  assert.ok(lesson().demo.undone);
  project("practice2b-parented.json", { undo_demo: true });
  const r3 = await call("null_parent_check");
  assert.equal(r3.layers.find((l) => l.layer === "Tile").credit, "learner");
  assert.equal(r3.parenting_passed, true);
});

test("markChecked only when the comp matches", async () => {
  await startGroup();
  project(variant("null-center.json", (s) => { s.comp.id = 999; }));
  const r = await call("null_parent_check");
  assert.equal(r.comp_matches, false);
  assert.equal(lesson().checked, undefined);
  assert.equal(lesson().skill_data, undefined);
});

test("a full lesson passes and records { layer, property: \"Parent\" } per focus layer", async () => {
  await startGroup();
  await placeNull();
  project("rotate-null.json");
  const r = await call("null_parent_check");
  assert.equal(r.passed, true);
  const saved = await call("record_lesson", {
    skill: "parenting.null", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice 2",
    attempted: "Parented Tile, Caption and Stamp to Null 1 and turned it from 6 to 7 s", result: "passed", demo_used: false,
    summary: "Nothing jumped; the group turned from its middle.", next: "Ease the null's move.",
  });
  assert.equal(saved.saved, true);
  const rec = JSON.parse(fs.readFileSync(LEARNER, "utf8"));
  assert.deepEqual(rec.lessons.at(-1).targets, GROUP.map((layer) => ({ layer, property: "Parent" })));
});

// ---- US2: a jump caught on its own

test("Stamp's jump comes back with its numbers, and the parenting check never reports P4 or P5", async () => {
  await startGroup();
  await placeNull();
  project("jumped.json");
  const r = await call("null_parent_check");
  assert.equal(r.stage, "parenting");
  assert.deepEqual(r.hints.find((h) => h.code === "jumped"), { code: "jumped", layer: "Stamp", px: 120, direction: "left", time: 0 });
  assert.equal(r.null.p4, null);
  assert.equal(r.null.p5, null);
  assert.equal(lesson().checked, true);
});

test("the rotated-null jump, the null keyed before the check and the playhead moved, through the tools", async () => {
  project("synthetic/s1-before.json");
  await call("null_parent_snapshot", { skill_options: { focus: ["Card", "Label"] } });
  project("synthetic/s1-placed.json");
  await call("null_parent_check", { region: "slides_only" });
  project("synthetic/s1-jumped.json");
  assert.ok((await call("null_parent_check")).codes.includes("jumped"));

  await startGroup();
  await placeNull();
  project("null-keyed-early.json");
  assert.equal((await call("null_parent_check")).passed, true);
  fs.rmSync(SESSION);
  await startGroup();
  await placeNull();
  project("playhead-moved.json");
  assert.equal((await call("null_parent_check")).parenting_passed, true);
});

test("a moving parent on the null: nothing graded and no markChecked", async () => {
  project("synthetic/before.json");
  await call("null_parent_snapshot", { skill_options: { focus: ["Card", "Label"] } });
  project("synthetic/row23-moving-parent.json");
  const r = await call("null_parent_check", { chain_on_purpose: true });
  assert.deepEqual(r.codes, ["null_parent_moves"]);
  assert.equal(lesson().checked, undefined);
});

// ---- US3: review

test("review: proposes Row A to C, never Tile, Caption or Stamp, and the finder agrees", async () => {
  useRecord("learned-group.json");
  const r = await call("null_parent_snapshot", { mode: "review" });
  assert.deepEqual(r.proposal, ["Row A", "Row B", "Row C"]);
  assert.equal(r.mode, "review");
  const exclude = GROUP.map((layer) => ({ layer, property: "Parent" }));
  assert.deepEqual(FINDERS["parenting.null"].focus(load("practice2b.json"), { exclude }).layers, ["Row A", "Row B", "Row C"]);
  const set = await call("null_parent_snapshot", { mode: "review", skill_options: { focus: ["Row A", "Row B", "Row C"] } });
  assert.equal(set.focus_set, true);
  assert.equal(set.demo_target, null);
  assert.equal(set.no_demo_reason, "review");
});

test("review: a focus on a past target is refused before any lesson is written", async () => {
  useRecord("learned-group.json");
  const r = await call("null_parent_snapshot", { mode: "review", skill_options: { focus: ["Tile", "Row A"] } });
  assert.equal(r.focus_set, false);
  assert.deepEqual(r.refused, [{ layer: "Tile", reason: "past_target" }]);
  assert.equal(fs.existsSync(SESSION), false);
});

test("review: null_parent_demo throws REVIEW_NO_DEMO with no snippet run", async () => {
  useRecord("learned-group.json");
  await call("null_parent_snapshot", { mode: "review", skill_options: { focus: ["Row A", "Row B", "Row C"] } });
  await fails("null_parent_demo", { target: "parent/Row A" }, "REVIEW_NO_DEMO");
  assert.equal(demoRuns(), 0);
});

test("review: the stored null comes from the first check that sees it, and a pass records Parent targets", async () => {
  useRecord("learned-group.json");
  await call("null_parent_snapshot", { mode: "review", skill_options: { focus: ["Row A", "Row B", "Row C"] } });
  project("review-rows-parented-in-one-go.json");
  const r1 = await call("null_parent_check", { region: "slides_only" });
  assert.equal(r1.null.stored_now, true);
  assert.equal(r1.parenting_passed, true);
  project("review-rows-pass.json");
  const r2 = await call("null_parent_check");
  assert.equal(r2.passed, true);
  await call("record_lesson", {
    skill: "parenting.null", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice 2", attempted: "Moved Row A to C together and slid them down",
    result: "passed", demo_used: false, summary: "Nothing jumped.", next: "Try a group that turns.",
  });
  const rec = JSON.parse(fs.readFileSync(LEARNER, "utf8"));
  assert.deepEqual(rec.lessons.at(-1).targets, ["Row A", "Row B", "Row C"].map((layer) => ({ layer, property: "Parent" })));
  assert.equal(rec.lessons.at(-1).kind, "review");
});

test("review: with no unparented group left, no_new_target", async () => {
  useRecord("learned-group.json");
  const none = variant("practice2b.json", (s) => {
    s.layer_info = s.layer_info.filter((l) => !["Gradient", "Reveal Matte"].includes(l.name));
    for (const n of ["Row B", "Row C"]) s.layer_info.find((l) => l.name === n).parent = s.layer_info.find((l) => l.name === "Row A").index;
  });
  project(none);
  const r = await call("null_parent_snapshot", { mode: "review" });
  assert.equal(r.proposal, null);
  assert.equal(r.no_demo_reason, "no_new_target");
  assert.equal(FINDERS["parenting.null"].focus(load(none), { exclude: GROUP.map((layer) => ({ layer, property: "Parent" })) }).count, 0);
  assert.equal(proposal(load(none), { exclude: GROUP.map((layer) => ({ layer, property: "Parent" })) }).proposal, null);
});

// ---- US4: not ready for it

test("with the pivot not learned the lesson still starts and checks the same way, and recommend_next names the pivot first", async () => {
  useRecord("anchor-not-learned.json");
  const r = await startGroup();
  assert.equal(r.focus_set, true);
  assert.deepEqual((await placeNull()).codes, ["null_ready"]);
  const rec = await call("recommend_next", { requested_skill: "parenting.null" });
  assert.equal(rec.requested.skill, "parenting.null");
  assert.ok(rec.requested.missing_prerequisites.some((p) => p.skill === "transform.anchor"));
  assert.notEqual(rec.recommendation && rec.recommendation.skill, "parenting.null");
});

// ---- SKILL.md never reads a field the tools don't return (the skill 5 review's lesson)

test("every field, code and value SKILL.md names in backticks is in a tool's reply, input or errors", async () => {
  const { MESSAGES } = await import("../errors.mjs");
  const { check } = await import("../lib/null-parenting-check.mjs");
  const { KEY, lessonFor } = await import("./fixtures/null-parenting/load.mjs");
  const { analyze } = await import("../lib/null-parenting.mjs");
  const seen = new Set();
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { seen.add(k); walk(x); }
    else if (typeof v === "string") seen.add(v);
  };
  // Every check over the answer key, and the analyzer on the fixtures.
  for (const a of KEY.attempts) {
    const base = load(a.baseline);
    const lesson = lessonFor(base, { focus: a.focus, mode: a.mode || "lesson" });
    for (const step of a.steps) {
      const { result, skill_data } = check(base, load(step.read), lesson, step.input || {});
      if (skill_data) lesson.skill_data = skill_data;
      walk(result);
    }
  }
  for (const f of ["practice2b.json", "practice2b-with-wave-a.json"]) walk(analyze(load(f), { skill_options: { focus: ["Plate", "Row A", "Gradient"] } }));
  // Replies from the tools themselves.
  walk(await call("null_parent_snapshot"));
  walk(await call("null_parent_snapshot", { skill_options: { focus: ["Tile", "Shadow"] } }));
  walk(await call("null_parent_snapshot", { skill_options: { focus: GROUP } }));
  await placeNull();
  walk(await call("null_parent_demo", { target: "parent/Tile" }));
  project(variant("practice2b.json", (s) => delete s.layer_info), { undo_demo: true });
  walk(await call("null_parent_snapshot"));
  // Inputs, tool names and error codes.
  for (const t of TOOLS) {
    seen.add(t.name);
    walk(t.inputSchema);
  }
  for (const c of Object.keys(MESSAGES)) seen.add(c);
  // Codes the planted runs above don't reach still have to be ones the code can emit: string
  // literals and reply keys in this skill's files (and the session's lesson kinds).
  for (const f of ["lib/null-parenting.mjs", "lib/null-parenting-check.mjs", "tools/null-parenting.mjs", "lib/session.mjs"]) {
    const src = fs.readFileSync(path.resolve(DIR, "../../..", f), "utf8");
    for (const m of src.matchAll(/["']([a-z][a-z0-9_-]*)["']/g)) seen.add(m[1]);
    for (const m of src.matchAll(/\b([a-z][a-z0-9_]*): /g)) seen.add(m[1]);
  }
  // Not from these tools: names the hard rules forbid, and the record's skill IDs.
  const outside = new Set(["ae-mentor", "ae_run_script", "snapshot_project", "after-effects", "skills", "next", "parenting.null", "transform.anchor", "easing.basic"]);
  const md = fs.readFileSync(path.resolve(DIR, "../../../../.claude/skills/null-parenting-mentor/SKILL.md"), "utf8");
  const named = [...md.matchAll(/`([^`]+)`/g)].map((m) => m[1]).flatMap((t) => t.split(/[:,{}\s]+/)).map((t) => t.replace(/^["[(]+|["\])]+$/g, ""))
    .filter((t) => /^[a-z][a-z0-9_.-]*$/.test(t) && t !== "true" && t !== "false" && t !== "null");
  const missing = [...new Set(named)].filter((t) => !seen.has(t) && !outside.has(t) && !t.startsWith("mcp__"));
  assert.deepEqual(missing, [], `SKILL.md names fields the tools never return: ${missing.join(", ")}`);
});
