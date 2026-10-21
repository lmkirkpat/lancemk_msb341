// Spec 008 contracts/tools.md: the three speed graph tools in fixture mode (no After Effects), on
// the stand-ins until the live captures replace them. US1 (lesson), US2 (review) and the rules the
// session enforces before After Effects is touched.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const DIR = path.join(FIXTURES, "speed-graph");
const fixturePath = (name) => {
  for (const p of [path.join(DIR, name), path.join(FIXTURES, name), path.join(DIR, "stand-in", name)]) if (fs.existsSync(p)) return p;
  throw new Error(`No fixture ${name}`);
};
const load = (name) => JSON.parse(fs.readFileSync(fixturePath(name), "utf8"));
const KEY = JSON.parse(fs.readFileSync(path.join(DIR, "answer-key.json"), "utf8"));
const id = (k) => KEY.ids[k] || k;

const setProject = (name, extra = {}) =>
  fs.writeFileSync(stateFile, JSON.stringify({ project: path.isAbsolute(name) ? name : fixturePath(name), ...extra }));
const EDITS = path.join(home, "fixture-edits.json");
const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");
const edits = () => (fs.existsSync(EDITS) ? JSON.parse(fs.readFileSync(EDITS, "utf8")) : []);

const index = await import("../tools/index.mjs");
const own = await import("../tools/speed-graph.mjs");
const session = await import("../lib/session.mjs");
const { analyze } = await import("../lib/speed-graph.mjs");
const { pastTargets } = await import("../lib/learner-store.mjs");

const call = async (name, args = {}) => {
  const r = await index.TOOLS.find((t) => t.name === name).handler(args);
  return JSON.parse(r.content[0].text);
};
const US1 = KEY.analysis["practice-now.json"].targets.map(id);

beforeEach(() => {
  for (const f of [SESSION, EDITS, LEARNER]) fs.rmSync(f, { force: true });
  setProject("practice-now.json");
});

test("the tool file plugs in: three speed_graph_ tools, one skill ID, a finder", () => {
  assert.deepEqual(own.SKILLS, ["easing.speed_graph"]);
  assert.deepEqual(own.TOOLS.map((t) => t.name), ["speed_graph_snapshot", "speed_graph_demo", "speed_graph_check"]);
  for (const t of own.TOOLS) assert.ok(index.TOOLS.includes(t), `${t.name} is found by index.mjs`);
  assert.ok(index.SKILLS.includes("easing.speed_graph"));
  assert.equal(index.FINDERS["easing.speed_graph"], own.FINDERS["easing.speed_graph"]);
  assert.equal(own.FINDERS["easing.speed_graph"].review, true, "review mode ships in the first build (FR-021)");
  const recordSkills = index.TOOLS.find((t) => t.name === "record_lesson").inputSchema.properties.skill.enum;
  assert.ok(recordSkills.includes("easing.speed_graph"), "record_lesson accepts this skill");
});

test("snapshot: host, new then continued, and US1's focus on Mentor Practice", async () => {
  const first = await call("speed_graph_snapshot");
  assert.equal(first.lesson, "new");
  assert.equal(first.mode, "lesson");
  assert.deepEqual(first.host, { known: true, version: "26.5", build: "89", os: "macOS 27.0.1", platform: "mac", beta: null });
  assert.deepEqual(first.focus, ["Title"]);
  assert.deepEqual(first.targets, US1);
  assert.equal(first.demo_target, id("P1"));
  assert.equal(first.no_demo_reason, null);
  assert.deepEqual(first.pairs.map((p) => p.label), ["Title › Position 0.5–1.5 s", "Title › Position 1.5–3 s", "Title › Position 3–4.37 s", "Title › Scale 0.5–1.5 s"]);
  assert.ok(first.pairs.every((p) => p.fastest.parts.includes("middle")));
  assert.deepEqual(first.left_out.map((x) => x.kind), ["hidden", "null", "precomp", "expression", "ease_first"]);
  assert.equal(first.comp.name, "Mentor Practice");
  const again = await call("speed_graph_snapshot");
  assert.equal(again.lesson, "continued");
  assert.deepEqual(again.targets, US1);
});

test("skill_options given once still apply later, continued and resumed after another comp", async () => {
  const first = await call("speed_graph_snapshot", { skill_options: { eased_layers: ["Title"], land_hard: [id("P3")] } });
  assert.deepEqual(first.targets, [id("P1"), id("P2"), id("S")]);
  assert.deepEqual(first.landing_hard, [id("P3")]);
  const continued = await call("speed_graph_snapshot");
  assert.equal(continued.lesson, "continued");
  assert.deepEqual(continued.targets, [id("P1"), id("P2"), id("S")]);
  setProject("practice2-before.json");
  const other = await call("speed_graph_snapshot");
  assert.equal(other.lesson, "new");
  assert.deepEqual(other.focus, ["Card"]);
  setProject("practice-now.json");
  const resumed = await call("speed_graph_snapshot");
  assert.equal(resumed.lesson, "resumed");
  assert.deepEqual(resumed.targets, [id("P1"), id("P2"), id("S")]);
  // A call that sends skill_options replaces them.
  const replaced = await call("speed_graph_snapshot", { skill_options: { eased_layers: ["Title"], land_hard: [] } });
  assert.deepEqual(replaced.targets, US1);
});

test("demo: refused off target and a second time, both before any snippet runs", async () => {
  await assert.rejects(call("speed_graph_demo", { segment_id: id("P1") }), { code: "NO_SESSION" });
  await call("speed_graph_snapshot");
  await assert.rejects(call("speed_graph_demo", { segment_id: id("P2") }), { code: "NOT_DEMO_TARGET" });
  assert.deepEqual(edits(), []);
  const r = await call("speed_graph_demo", { segment_id: id("P1") });
  assert.equal(r.layer, "Title");
  assert.equal(r.property, "Position");
  assert.deepEqual(r.out_influence, [15.13]);
  assert.deepEqual(r.in_influence, [79.87]);
  assert.equal(r.undo, "Edit > Undo");
  assert.equal(edits().length, 1);
  assert.equal(edits()[0].snippet, "speed-graph-demo");
  await assert.rejects(call("speed_graph_demo", { segment_id: id("P1") }), { code: "DEMO_USED" });
  assert.equal(edits().length, 1, "the second call ran nothing");
  const after = await call("speed_graph_snapshot");
  assert.equal(after.demo_target, null);
  assert.equal(after.no_demo_reason, "demo_used");
});

test("a one-pair focus has no demo target, and the demo is refused", async () => {
  const r = await call("speed_graph_snapshot", { focus_layers: ["Bar"] });
  assert.equal(r.targets.length, 1);
  assert.equal(r.demo_target, null);
  assert.equal(r.no_demo_reason, "single_target");
  await assert.rejects(call("speed_graph_demo", { segment_id: r.targets[0] }), { code: "NOT_DEMO_TARGET" });
  assert.deepEqual(edits(), []);
});

test("another skill's lesson never gets this skill's demo or check", async () => {
  session.start(load("practice-now.json")); // an easing lesson
  const easingDemo = session.currentLesson().demo_target;
  await assert.rejects(call("speed_graph_demo", { segment_id: easingDemo }), { code: "NO_SESSION" });
  await assert.rejects(call("speed_graph_check"), { code: "NO_SESSION" });
  assert.deepEqual(edits(), []);
});

// Each planted shape through the real tool, as the answer key says.
for (const [name, want] of Object.entries(KEY.check)) {
  test(`check (tool) grades ${name} as the answer key says`, async () => {
    await call("speed_graph_snapshot");
    const file = want.file || name;
    if (want.demo) {
      await call("speed_graph_demo", { segment_id: id(want.demo) });
      // The demo edit replays on later reads; an undone or redone demo is the learner's Edit > Undo.
      setProject(file, file === "after-demo.json" ? {} : { undo_demo: true });
    } else {
      setProject(file);
    }
    const r = await call("speed_graph_check", { seen_shaped: (want.seen_shaped || []).map(id) });
    assert.equal(r.comp_matches, true);
    assert.equal(r.passed, want.passed);
    for (const p of r.pairs) {
      const k = Object.keys(want.pairs).find((x) => id(x) === p.id);
      const w = k ? want.pairs[k] : KEY.untouched;
      assert.equal(p.result, w.result, `${p.id} result`);
      if ("mistake" in w) assert.equal(p.mistake, w.mistake, `${p.id} mistake`);
      if ("credit" in w) assert.equal(p.credit, w.credit, `${p.id} credit`);
      if ("parts" in w) assert.deepEqual(p.fastest.parts, w.parts, `${p.id} fastest`);
    }
    assert.ok(Array.isArray(r.seen_shaped));
  });
}

test("check: markChecked only when the comp matches; the baseline never changes", async () => {
  await call("speed_graph_snapshot");
  const baseline = JSON.stringify(session.currentLesson().baseline);
  setProject("practice2-before.json");
  const elsewhere = await call("speed_graph_check");
  assert.equal(elsewhere.comp_matches, false);
  assert.equal(elsewhere.lesson_comp, "Mentor Practice");
  assert.equal(session.currentLesson().status, "started", "no check recorded");
  assert.ok(!session.currentLesson().checked);
  setProject("planted-15-80.json");
  const r = await call("speed_graph_check");
  assert.equal(r.comp_matches, true);
  assert.equal(session.currentLesson().status, "checked");
  assert.equal(session.currentLesson().passed, false);
  assert.deepEqual(r.seen_shaped, [id("P1")]);
  assert.equal(JSON.stringify(session.currentLesson().baseline), baseline);
});

test("a full pass is recorded as passed by the session", async () => {
  await call("speed_graph_snapshot");
  const done = load("practice-now.json");
  for (const p of done.layers[0].properties.slice(0, 2)) {
    for (const k of p.keys) {
      k.out_ease.forEach((e) => (e.influence = 15));
      k.in_ease.forEach((e) => (e.influence = 80));
    }
  }
  const file = path.join(home, "all-shaped.json");
  fs.writeFileSync(file, JSON.stringify(done));
  setProject(file);
  const r = await call("speed_graph_check");
  assert.equal(r.passed, true);
  assert.equal(session.currentLesson().passed, true);
});

test("AE unreachable: the snapshot says so and nothing starts", async () => {
  fs.writeFileSync(stateFile, JSON.stringify({ project: "unreachable" }));
  await assert.rejects(call("speed_graph_snapshot"), { code: "AE_UNREACHABLE" });
  assert.ok(!fs.existsSync(SESSION));
});

// --- US2: review (FR-021, FR-022)

const useRecord = (extraTargets = []) => {
  const r = JSON.parse(fs.readFileSync(path.join(DIR, "record-learned-title.json"), "utf8"));
  if (extraTargets.length) r.lessons[1].targets.push(...extraTargets);
  fs.writeFileSync(LEARNER, JSON.stringify(r));
};

test("review on Mentor Practice 2: one or two Card pairs, never Title, no demo", async () => {
  useRecord();
  setProject("practice2-before.json");
  const r = await call("speed_graph_snapshot", { mode: "review" });
  assert.equal(r.mode, "review");
  assert.ok(r.targets.length >= 1 && r.targets.length <= 2);
  assert.deepEqual(r.focus, ["Card"]);
  assert.ok(r.pairs.every((p) => p.layer === "Card"));
  assert.equal(r.demo_target, null);
  assert.equal(r.no_demo_reason, "review");
  await assert.rejects(call("speed_graph_demo", { segment_id: r.targets[0] }), { code: "REVIEW_NO_DEMO" });
  assert.deepEqual(edits(), []);
});

test("review on Mentor Practice: a target the record doesn't show; none left means no_new_target", async () => {
  useRecord();
  const r = await call("speed_graph_snapshot", { mode: "review" });
  assert.deepEqual(r.focus, ["Subtitle"]);
  assert.ok(r.pairs.every((p) => !(p.layer === "Title" && ["Position", "Scale"].includes(p.property))));
  fs.rmSync(SESSION, { force: true });
  useRecord([{ layer: "Subtitle", property: "Position" }]);
  const none = await call("speed_graph_snapshot", { mode: "review" });
  assert.deepEqual(none.targets, []);
  assert.equal(none.no_demo_reason, "no_new_target");
});

test("FINDERS with the record's past targets as exclude agrees with the review's targets", async () => {
  const snap = load("practice-now.json");
  for (const extra of [[], [{ layer: "Subtitle", property: "Position" }]]) {
    fs.rmSync(SESSION, { force: true });
    useRecord(extra);
    const exclude = pastTargets("easing.speed_graph", snap.project, snap.comp.name);
    const found = own.FINDERS["easing.speed_graph"].focus(snap, { exclude });
    const r = await call("speed_graph_snapshot", { mode: "review" });
    assert.equal(found.count > 0, r.targets.length > 0, JSON.stringify(extra));
    assert.deepEqual(analyze(snap, { exclude, mode: "review" }).targets, r.targets);
  }
});

test("'I already know it' on an unlearned skill is the same review call, recorded as a review", async () => {
  const r = await call("speed_graph_snapshot", { mode: "review" });
  assert.deepEqual(r.targets, [id("P1"), id("P2")]);
  await assert.rejects(call("speed_graph_demo", { segment_id: r.targets[0] }), { code: "REVIEW_NO_DEMO" });
  const done = load("practice-now.json");
  const pos = done.layers[0].properties[0];
  for (const k of pos.keys) {
    k.out_ease.forEach((e) => (e.influence = 15));
    k.in_ease.forEach((e) => (e.influence = 80));
  }
  const file = path.join(home, "position-shaped.json");
  fs.writeFileSync(file, JSON.stringify(done));
  setProject(file);
  const checked = await call("speed_graph_check");
  assert.equal(checked.passed, true);
  const saved = await call("record_lesson", {
    skill: "easing.speed_graph", project: done.project, comp: done.comp.name, attempted: "Shaped Title Position 0.5–1.5 s and 1.5–3 s",
    result: "passed", demo_used: false, summary: "Both moves start quickly and land softly.", next: "Shape Title Scale.",
  });
  assert.equal(saved.skill.status, "learned");
  const record = JSON.parse(fs.readFileSync(LEARNER, "utf8"));
  const entry = record.lessons.at(-1);
  assert.equal(entry.kind, "review");
  assert.equal(entry.already_knew, true);
  assert.deepEqual(entry.targets, [{ layer: "Title", property: "Position" }]);
});

// --- US3: sent to easing (FR-002), what the snapshot tool says (T024)

test("as built, Mentor Practice has one pair to shape and no demo; a comp with nothing eased has nothing to shape", async () => {
  setProject(path.join(FIXTURES, "practice-before.json"));
  const one = await call("speed_graph_snapshot");
  assert.deepEqual(one.focus, ["Subtitle"]);
  assert.equal(one.targets.length, 1);
  assert.equal(one.demo_target, null);
  assert.equal(one.no_demo_reason, "single_target");
  assert.ok(one.ease_first_count > 0);
  setProject(path.join(FIXTURES, "synthetic", "linear-basic.json"));
  const none = await call("speed_graph_snapshot");
  assert.deepEqual(none.targets, []);
  assert.equal(none.no_demo_reason, "nothing_to_shape");
  assert.ok(none.ease_first_count > 0);
  assert.equal(none.candidates_count, 0);
});
