// Spec 011's three tools in fixture mode (contracts/tools.md; spec 004 contracts/skill-module.md
// › 3): the lesson on Door (US1), the keyed layers and the demo (US2), and the review (US3). A temp
// AE_MENTOR_HOME; the tool file's `io` is wrapped so a test can see what each read asked for and
// whether the demo snippet ran at all.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tempHome } from "./helpers.mjs";
import { absolute, clone, DIR, fixture, indexOf, KEY } from "./fixtures/anchor/load.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");
const EDITS = path.join(home, "fixture-edits.json");

const project = (file, extra = {}) => fs.writeFileSync(stateFile, JSON.stringify({ project: path.isAbsolute(file) ? file : absolute(file), ...extra }));
project("practice2b");
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
delete process.env.AE_MENTOR_FIXTURE_TWINS;

const { TOOLS, SKILLS, FINDERS } = await import("../tools/index.mjs");
const anchorTools = await import("../tools/transform-anchor.mjs");
const { CODES } = await import("../errors.mjs");
const { checkSampleTimes } = await import("../lib/anchor-check.mjs");

// Watch the reads and the snippet runs.
const reads = [];
const runs = [];
const realTake = anchorTools.io.takeSnapshot;
const realRun = anchorTools.io.runSnippet;
anchorTools.io.takeSnapshot = async (opts) => { reads.push(opts || {}); return realTake(opts); };
anchorTools.io.runSnippet = async (name, args, opts) => { runs.push({ name, args, opts }); return realRun(name, args, opts); };

const call = async (name, args = {}) => JSON.parse((await TOOLS.find((t) => t.name === name).handler(args)).content[0].text);
const session = () => JSON.parse(fs.readFileSync(SESSION, "utf8"));
const lessonNow = () => { const s = session(); return s.lessons[String(s.current)]; };
const useRecord = (rel) => fs.copyFileSync(path.join(DIR, rel), LEARNER);
const P2 = fixture("practice2b");
const idx = (name) => indexOf(P2, name);

function variant(name, change) {
  const s = clone(fixture(name));
  change(s);
  const file = path.join(home, `variant-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(file, JSON.stringify(s));
  return file;
}

beforeEach(() => {
  for (const f of [SESSION, LEARNER, EDITS]) fs.rmSync(f, { force: true });
  useRecord("records/easing-learned.json");
  project("practice2b");
  reads.length = 0;
  runs.length = 0;
});

const DOOR = { focus: [{ layer: "Door", place: "middle-left" }] };

// ---- The module

test("tool names start with anchor_, SKILLS is the one record ID, and ANCHOR_REFUSED is registered", () => {
  assert.deepEqual(anchorTools.SKILLS, ["transform.anchor"]);
  assert.deepEqual(anchorTools.TOOLS.map((t) => t.name), ["anchor_snapshot", "anchor_demo", "anchor_check"]);
  assert.ok(SKILLS.includes("transform.anchor"));
  assert.ok(CODES.includes("ANCHOR_REFUSED"));
  assert.equal(FINDERS["transform.anchor"].review, true, "review mode passes its tests (T225, T226)");
  const desc = anchorTools.TOOLS.map((t) => t.description).join(" ");
  assert.doesNotMatch(desc, /Quick Set Anchor/);
});

// ---- US1: Door

test("anchor_snapshot with no skill_options proposes the answer key's layer with a hinge and lists leave-outs with reasons", async () => {
  const r = await call("anchor_snapshot");
  assert.equal(r.lesson, "new");
  assert.deepEqual(r.proposal, KEY.practice2b.proposal);
  assert.deepEqual(r.place_now, { [KEY.practice2b.proposal.layer]: KEY.practice2b.layers[KEY.practice2b.proposal.layer].place_now });
  assert.deepEqual(r.targets, []);
  assert.equal(r.demo_target, null);
  assert.equal(r.no_demo_reason, "awaiting_focus");
  const by = Object.fromEntries(r.candidates.map((c) => [c.layer, c]));
  assert.deepEqual(by.Wobble, { layer: "Wobble", bucket: "never", reason: "anchor_keyed", rank: null });
  assert.equal(by["Reveal Matte"].reason, "matte");
  assert.equal(r.host.version, "26.5");
  // The live capture holds the --times list, comp.time and each layer's own keys, not every other
  // layer's key times, so the snapshot reads again for the rest (R4).
  assert.equal(r.reads, 2);
  assert.deepEqual(reads, [{}, { sample_times: KEY.times.needed_practice2b }]);
});

test("with Door alone as the focus: one target and no demo (single_target, filter 4)", async () => {
  const r = await call("anchor_snapshot", { skill_options: DOOR });
  assert.deepEqual(r.targets, [`anchor/${idx("Door")}`]);
  assert.equal(r.demo_target, null);
  assert.equal(r.no_demo_reason, "single_target");
  assert.deepEqual(r.places, { Door: "middle-left" });
  const proposed = KEY.practice2b.proposal.layer;
  assert.deepEqual(r.place_now, { Door: "center", [proposed]: KEY.practice2b.layers[proposed].place_now }, "where the pivot is now, for SKILL.md's stage 2 (the focus's, and the proposal's)");
  await assert.rejects(call("anchor_demo", { target: `anchor/${idx("Door")}` }), { code: "NOT_DEMO_TARGET" });
  assert.equal(runs.length, 0);
});

test("a later call without skill_options keeps the focus", async () => {
  await call("anchor_snapshot", { skill_options: DOOR });
  const r = await call("anchor_snapshot");
  assert.equal(r.lesson, "continued");
  assert.deepEqual(r.focus, ["Door"]);
  assert.deepEqual(r.targets, [`anchor/${idx("Door")}`]);
});

test("fresh: true restarts before a check and is refused with LESSON_UNDERWAY after one", async () => {
  await call("anchor_snapshot", { skill_options: DOOR });
  const first = lessonNow().lesson_id;
  await new Promise((r) => setTimeout(r, 5));
  const again = await call("anchor_snapshot", { fresh: true });
  assert.equal(again.lesson, "new");
  assert.notEqual(lessonNow().lesson_id, first);
  await call("anchor_snapshot", { skill_options: DOOR });
  await call("anchor_check");
  await assert.rejects(call("anchor_snapshot", { fresh: true }), { code: "LESSON_UNDERWAY" });
});

test("with layer_info removed it returns no_layer_info and starts nothing", async () => {
  project(variant("practice2b", (s) => { delete s.layer_info; }));
  const r = await call("anchor_snapshot");
  assert.equal(r.no_layer_info, true);
  assert.equal(r.lesson, null);
  assert.ok(!fs.existsSync(SESSION));
});

test("anchor_check grades door-pass, door-typed and door-dragged as the answer key says, and never changes the baseline", async () => {
  await call("anchor_snapshot", { skill_options: DOOR });
  const baseline = JSON.stringify(lessonNow().baseline);
  for (const file of ["door-typed", "door-dragged", "door-pass"]) {
    project(file);
    const r = await call("anchor_check");
    const want = KEY.attempts[file];
    assert.equal(r.passed, want.passed, file);
    assert.deepEqual(r.layers[0].hints, want.hints, file);
    assert.equal(JSON.stringify(lessonNow().baseline), baseline, `${file}: baseline unchanged`);
  }
  assert.equal(lessonNow().passed, true);
});

test("anchor_check passes the check times as sample_times, and calls markChecked only when the comp matches", async () => {
  await call("anchor_snapshot", { skill_options: DOOR });
  reads.length = 0;
  project(variant("door-pass", (s) => { s.comp.id = 999; }));
  const r = await call("anchor_check");
  assert.equal(r.comp_matches, false);
  assert.equal(lessonNow().status, "started", "not marked checked on another comp");
  assert.deepEqual(reads, [{ sample_times: [0] }]);
});

// ---- US2: keyed layers and the demo

test("Pop's check time is its full-size key and Gauge's its 0° key", async () => {
  const r = await call("anchor_snapshot", { skill_options: { focus: [{ layer: "Pop", place: "bottom-middle" }, { layer: "Gauge", place: "bottom-middle" }] } });
  assert.deepEqual(r.check_times, { Pop: { time: 4.3, basis: "both" }, Gauge: { time: 3.167, basis: "both" } });
});

test("the snapshot's second read samples every needed time on every layer, Hatch Rig's children too (FR-013)", async () => {
  // A read 1 where Hatch (Hatch Rig's child) lacks Pop's rest key time.
  project(variant("practice2b", (s) => {
    const hatch = s.layer_info.find((l) => l.name === "Hatch");
    hatch.samples = hatch.samples.filter((x) => x.time !== 4.3);
  }));
  const r = await call("anchor_snapshot");
  assert.equal(r.reads, 2);
  assert.deepEqual(reads, [{}, { sample_times: KEY.times.needed_practice2b }]);
  assert.ok(KEY.times.needed_practice2b.includes(4.3) && KEY.times.needed_practice2b.includes(3.167));
});

test("anchor_check asks for the rest keys and Position key times of the focus", async () => {
  await call("anchor_snapshot", { skill_options: { focus: [{ layer: "Pop", place: "bottom-middle" }, { layer: "Sled", place: "middle-left" }] } });
  reads.length = 0;
  await call("anchor_check");
  assert.deepEqual(reads, [{ sample_times: [0, 3.667, 4.167, 4.3, 4.667] }]);
  assert.deepEqual(reads[0].sample_times, checkSampleTimes(lessonNow().baseline, lessonNow()));
});

test("two focus layers: the demo is on entry 1; off target, twice, or off the rest key it's refused before the snippet", async () => {
  const s = await call("anchor_snapshot", { skill_options: { focus: KEY.two_focus_demos.gauge_with_peg.focus } });
  assert.equal(s.demo_target, `anchor/${idx("Peg")}`);
  await assert.rejects(call("anchor_demo", { target: `anchor/${idx("Gauge")}` }), { code: "NOT_DEMO_TARGET" });
  assert.equal(runs.length, 0);
  const d = await call("anchor_demo", { target: `anchor/${idx("Peg")}` });
  assert.deepEqual(d, { layer: "Peg", place: "bottom-middle", anchor_before: [15, 15], anchor_after: [15, 30], position_before: [820, 480], position_after: [820, 495], separated: false, time: 0, undo: "Edit > Undo" });
  assert.equal(runs.length, 1);
  assert.equal(runs[0].opts.undo, true);
  await assert.rejects(call("anchor_demo", { target: `anchor/${idx("Peg")}` }), { code: "DEMO_USED" });
  assert.equal(runs.length, 1);
});

test("a keyed demo target with the playhead off its rest key: ANCHOR_REFUSED not_at_rest, nothing run, the demo not used", async () => {
  const s = await call("anchor_snapshot", { skill_options: { focus: [{ layer: "Door", place: "middle-left" }, { layer: "Gauge", place: "bottom-middle" }] } });
  assert.equal(s.demo_target, `anchor/${idx("Gauge")}`, "the target stays entry 1 (plan › Q1)");
  await assert.rejects(call("anchor_demo", { target: s.demo_target }), (e) => e.code === "ANCHOR_REFUSED" && e.reason === "not_at_rest" && /rest key/.test(e.message));
  assert.equal(runs.length, 0);
  assert.equal(lessonNow().demo, null);
  assert.deepEqual(reads.at(-1), { sample_times: [3.167] }, "the demo's one read samples the rest key");

  // The playhead on the rest key: it runs, and the twin's result passes the check for Gauge.
  project("gauge-before-at-rest");
  const d = await call("anchor_demo", { target: s.demo_target });
  assert.deepEqual(d.anchor_after, [20, 200]);
  assert.equal(runs.length, 1);
  const c = await call("anchor_check");
  const gauge = c.layers.find((l) => l.layer === "Gauge");
  assert.equal(gauge.credit, "demo");
  assert.equal(gauge.passed, true);
  assert.equal(c.passed, false, "Door is still the learner's to do");

  // Undone: the demo layer is back, named like any other, then the learner's.
  project("gauge-before-at-rest", { undo_demo: true });
  const u = await call("anchor_check");
  assert.equal(u.layers.find((l) => l.layer === "Gauge").credit, "undone");
  assert.ok(lessonNow().demo.undone);
  const again = await call("anchor_check");
  assert.equal(again.layers.find((l) => l.layer === "Gauge").credit, "learner");
});

test("anchor_demo on another comp: NO_ACTIVE_COMP, nothing run", async () => {
  const s = await call("anchor_snapshot", { skill_options: { focus: KEY.two_focus_demos.door_with_tab.focus } });
  project(variant("practice2b", (x) => { x.comp.id = 999; }));
  await assert.rejects(call("anchor_demo", { target: s.demo_target }), { code: "NO_ACTIVE_COMP" });
  assert.equal(runs.length, 0);
});

test("anchor_demo on a layer locked since the lesson started: ANCHOR_REFUSED locked, nothing run", async () => {
  const s = await call("anchor_snapshot", { skill_options: { focus: KEY.two_focus_demos.door_with_tab.focus } });
  project(variant("practice2b", (x) => { x.layer_info.find((l) => l.name === "Tab").locked = true; }));
  await assert.rejects(call("anchor_demo", { target: s.demo_target }), (e) => e.code === "ANCHOR_REFUSED" && e.reason === "locked");
  assert.equal(runs.length, 0);
});

// ---- US3: the review

test("review: proposes the answer key's layer, never Door or Needle; no demo, nothing run", async () => {
  useRecord(KEY.review.record);
  const r = await call("anchor_snapshot", { mode: "review" });
  assert.equal(r.mode, "review");
  assert.equal(r.proposal.layer, KEY.review.proposal);
  assert.equal(r.no_demo_reason, "review");
  const withFocus = await call("anchor_snapshot", { mode: "review", skill_options: { focus: [{ layer: "Tab", place: "middle-left" }] } });
  assert.deepEqual(withFocus.targets, [`anchor/${idx("Tab")}`]);
  await assert.rejects(call("anchor_demo", { target: `anchor/${idx("Tab")}` }), { code: "REVIEW_NO_DEMO" });
  assert.equal(runs.length, 0);
  const door = await call("anchor_snapshot", { mode: "review", skill_options: { focus: [{ layer: "Door", place: "middle-left" }] } });
  assert.deepEqual(door.targets, []);
  assert.deepEqual(door.focus_problems, [{ layer: "Door", problem: "past_target" }]);
});

test("review prefers a layer with no Rotation or Scale keys, ahead of an unparented keyed one", async () => {
  const { reviewProposal, analyze } = await import("../lib/anchor.mjs");
  const only = ["Gauge", "Hatch"];
  const exclude = P2.layer_info.filter((l) => !only.includes(l.name)).map((l) => ({ layer: l.name, property: "Anchor Point" }));
  assert.equal(analyze(P2, { exclude }).proposal.layer, "Gauge", "a lesson: unparented first");
  assert.equal(reviewProposal(P2, { exclude }).layer, "Hatch", "a review: no Rotation or Scale keys first");
});

test("review with every default candidate in the record: no_new_target, and FINDERS agrees", async () => {
  const rec = JSON.parse(fs.readFileSync(path.join(DIR, KEY.review.record), "utf8"));
  const defaults = FINDERS["transform.anchor"].focus(P2).layers;
  rec.lessons.at(-1).targets = defaults.map((layer) => ({ layer, property: "Anchor Point" }));
  fs.writeFileSync(LEARNER, JSON.stringify(rec));
  const r = await call("anchor_snapshot", { mode: "review" });
  assert.equal(r.proposal, null);
  assert.equal(r.no_demo_reason, "no_new_target");
  assert.equal(FINDERS["transform.anchor"].focus(P2, { exclude: rec.lessons.at(-1).targets }).count, 0);
  const past = JSON.parse(fs.readFileSync(path.join(DIR, KEY.review.record), "utf8")).lessons.at(-1).targets;
  assert.equal(FINDERS["transform.anchor"].focus(P2, { exclude: past }).count, KEY.review.count_with_exclude);
});

test("record_lesson after a lesson stores { layer, property: \"Anchor Point\" } per focus layer", async () => {
  await call("anchor_snapshot", { skill_options: { focus: [{ layer: "Door", place: "middle-left" }, { layer: "Plaque", place: "middle-left" }] } });
  project(variant("door-pass", (s) => {
    const src = fixture("plaque-pass").layer_info.find((l) => l.name === "Plaque");
    const i = s.layer_info.findIndex((l) => l.name === "Plaque");
    s.layer_info[i] = src;
  }));
  const c = await call("anchor_check");
  assert.equal(c.passed, true);
  await call("record_lesson", {
    skill: "transform.anchor", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice 2",
    attempted: "Set Door's pivot to the middle of its left edge, and Plaque's to the middle of its left edge",
    result: "passed", demo_used: false, summary: "Set both without a jump. Said the left edge stays still.", next: "Key a swing on Door and play it back.",
  });
  const rec = JSON.parse(fs.readFileSync(LEARNER, "utf8"));
  assert.deepEqual(rec.lessons.at(-1).targets, [{ layer: "Door", property: "Anchor Point" }, { layer: "Plaque", property: "Anchor Point" }]);
});
