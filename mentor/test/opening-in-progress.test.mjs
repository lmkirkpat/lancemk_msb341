// Spec 004 Phase 10 review (should-fixes 1 and 2), in fixture mode.
//
// Should-fix 1: a review already under way. A review was picked, the learner never answered (or
// started it), and they open the skill again later the same day: the opening call carries the
// review on (mode review, mode_source in_progress), with no demo target, and the demo tool refuses.
// That's the reply step 0 of key types, offset and speed graph branches on, so each SKILL.md's step 0
// must name in_progress alongside review_due. A review the learner asked for, on a record where none
// is due, carries on the same way: the branch reads mode, not review_due.
//
// Should-fix 2: a speed graph review's target never changes after the opening call. The opening
// call sends no skill_options; a later call sends learner.eased_layers. Both rank layers the same
// way, so the re-analysis of the baseline keeps the target the mentor already named.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const LEARNER = path.join(home, "learner.json");
const P2B = path.join(FIXTURES, "layer-info", "practice2b.json");
const MP = path.join(FIXTURES, "layer-info", "practice-r1.json"); // Mentor Practice: Title, then Subtitle
const project = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
project(P2B);
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
delete process.env.AE_MENTOR_FIXTURE_TWINS;

const { TOOLS } = await import("../tools/index.mjs");
const session = await import("../lib/session.mjs");

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const call = async (name, args = {}) => JSON.parse((await TOOLS.find((t) => t.name === name).handler(args)).content[0].text);
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const THREE = {
  "keyframes.types": {
    tool: "key_types_snapshot", demo: (r) => call("key_types_demo", { segment_id: r.targets[0] || "1/x/y/1" }),
    record: path.join(FIXTURES, "key-types", "records", "learned-blink.json"), skillMd: "key-types-mentor",
  },
  "timing.offset": {
    tool: "offset_snapshot", demo: (r) => call("offset_demo", { target: r.targets[0] || "x" }),
    record: path.join(FIXTURES, "offset", "records", "learned-dots.json"), skillMd: "offset-mentor",
  },
  "easing.speed_graph": {
    tool: "speed_graph_snapshot", demo: (r) => call("speed_graph_demo", { segment_id: r.targets[0] || "1/x/y/1" }),
    record: path.join(FIXTURES, "speed-graph", "record-learned-title.json"), skillMd: "speed-graph-mentor",
  },
};

// This skill practicing, nothing due: only an asked review is a review.
function practicing(skill) {
  const rec = readJson(THREE[skill].record);
  rec.skills[skill] = { status: "practicing", last_practiced: new Date(Date.now() - 2 * 86400000).toISOString(), times_passed: 0, next: "Still off." };
  return rec;
}

beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f !== "fixture-state.json") fs.rmSync(path.join(home, f), { force: true });
  project(P2B);
});

for (const [skill, t] of Object.entries(THREE)) {
  test(`${t.tool}: a due review left unanswered, opened again → review, in_progress, no demo`, async () => {
    fs.copyFileSync(t.record, LEARNER);
    const first = await call(t.tool);
    assert.deepEqual([first.mode, first.mode_source, first.lesson], ["review", "review_due", "new"]);

    // The learner never answers; later the same day, the skill is opened again with no mode.
    const again = await call(t.tool);
    assert.deepEqual([again.mode, again.mode_source], ["review", "in_progress"], "the reply step 0 must branch on");
    assert.equal(again.lesson, "continued");
    assert.equal(again.demo_target, null, "a review has no demo target");
    assert.deepEqual(again.targets, first.targets, "the same review, not a new one");
    assert.equal(again.learner.status, "learned");
    assert.equal(typeof again.learner.last_attempted, "string", "what the offer is built from is there");
    assert.equal(Number.isInteger(again.learner.days_since_practiced), true);
    assert.equal(session.currentLesson().mode, "review");
    await assert.rejects(t.demo(again), { code: "REVIEW_NO_DEMO" }, "teaching it as a lesson would fail at the demo");
  });

  test(`${t.tool}: an asked review on a record with none due, opened again → review, in_progress, review_due false`, async () => {
    fs.writeFileSync(LEARNER, JSON.stringify(practicing(skill)));
    const asked = await call(t.tool, { mode: "review" });
    assert.deepEqual([asked.mode, asked.mode_source], ["review", "asked"]);
    const again = await call(t.tool);
    assert.deepEqual([again.mode, again.mode_source], ["review", "in_progress"]);
    assert.equal(again.learner.review_due, false, "so step 0 can't key the review on review_due");
    assert.equal(again.demo_target, null);
  });

  test(`${t.skillMd}/SKILL.md: step 0 has a branch for a review already under way (in_progress)`, () => {
    const text = fs.readFileSync(path.join(REPO, ".claude", "skills", t.skillMd, "SKILL.md"), "utf8");
    assert.match(text, /`in_progress`/, "step 0 names the in_progress source");
    assert.match(text, /`review_due`/, "and still the due one");
  });
}

// Mentor Practice: in comp order the review's target is Title's Position; with Subtitle as the
// easing lessons' layer it's Subtitle's. The record: speed graph learned and due, its past lesson on
// another comp (so nothing here is a past target), and easing's lesson on Subtitle.
function subtitleEased() {
  const rec = readJson(THREE["easing.speed_graph"].record);
  const snap = readJson(MP);
  for (const l of rec.lessons) {
    l.project = snap.project;
    if (l.skill === "easing.basic") l.targets = [{ layer: "Subtitle", property: "Position" }];
    else l.comp = "Somewhere Else";
  }
  return rec;
}

for (const mode of ["review", "lesson"]) {
  test(`speed_graph_snapshot (${mode}): the opening call without options and a later call with eased_layers pick the same target`, async () => {
    project(MP);
    const rec = subtitleEased();
    if (mode === "lesson") rec.skills["easing.speed_graph"].review_due = "2999-01-01";
    fs.writeFileSync(LEARNER, JSON.stringify(rec));
    const first = await call("speed_graph_snapshot");
    assert.equal(first.mode, mode);
    assert.deepEqual(first.learner.eased_layers, ["Subtitle"]);
    assert.deepEqual(first.focus, ["Subtitle"], "ranked by the record's eased layers from the first call");
    const later = await call("speed_graph_snapshot", { skill_options: { eased_layers: first.learner.eased_layers, land_hard: [] } });
    assert.equal(later.mode, mode);
    assert.equal(later.lesson, "continued");
    assert.deepEqual(later.focus, first.focus);
    assert.deepEqual(later.targets, first.targets, "the target the mentor named doesn't change");
    assert.equal(later.demo_target, first.demo_target);
    // A call with only land_hard (no eased layers) still ranks the same way.
    const landOnly = await call("speed_graph_snapshot", { skill_options: { eased_layers: [], land_hard: [] } });
    assert.deepEqual(landOnly.targets, first.targets);
  });
}

test("speed_graph_snapshot: the default is for the analysis only; stored land_hard survives a call without options", async () => {
  project(MP);
  const rec = subtitleEased();
  rec.skills["easing.speed_graph"].review_due = "2999-01-01";
  fs.writeFileSync(LEARNER, JSON.stringify(rec));
  const first = await call("speed_graph_snapshot");
  const hard = first.targets[0];
  const withHard = await call("speed_graph_snapshot", { skill_options: { eased_layers: ["Subtitle"], land_hard: [hard] } });
  assert.deepEqual(withHard.landing_hard, [hard]);
  assert.ok(!withHard.targets.includes(hard));
  const bare = await call("speed_graph_snapshot");
  assert.deepEqual(bare.landing_hard, [hard], "a call without options keeps the stored choices");
  assert.deepEqual(bare.targets, withHard.targets);
});
