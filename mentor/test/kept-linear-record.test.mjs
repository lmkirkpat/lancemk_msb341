// FR-038 end to end, in fixture mode with a temp home: keepLinear() notes a confirmed constant-speed
// property on the lesson, record_lesson writes it to the record's marks, and the next easing lesson
// leaves it out. No tool input lets the model write a mark.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, fixture, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "practice-before.json") }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { TOOLS } = await import("../tools/index.mjs");
const { commonTools } = await import("../tools/common.mjs");
const session = await import("../lib/session.mjs");
const SAMPLE = await import(path.join(FIXTURES, "sample-skill", "lib", "sample.mjs"));

const FILE = path.join(home, "learner.json");
const SESSION = path.join(home, "session.json");
const practice = JSON.parse(fs.readFileSync(path.join(FIXTURES, "practice-before.json"), "utf8"));
const POS = "ADBE Transform Group/ADBE Position";
// A "key types" lesson stand-in: the sample analyzer, under a skill ID record_lesson accepts here.
const COMMON = commonTools({ skills: ["easing.basic", "keyframes.types"], finders: {} });
const tool = (name) => (COMMON.find((t) => t.name === name) || TOOLS.find((t) => t.name === name)).handler;
const data = async (p) => JSON.parse((await p).content[0].text);
const KT = { skill: "keyframes.types", analyze: SAMPLE.analyze };
const entry = (over = {}) => ({
  skill: "keyframes.types", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice", attempted: "Held the Cursor pairs",
  result: "not_checked", demo_used: false, summary: "Said CTRL's move runs at constant speed.", next: "Hold a blink.", ...over,
});
const file = () => JSON.parse(fs.readFileSync(FILE, "utf8"));

beforeEach(() => {
  fs.rmSync(FILE, { force: true });
  fs.rmSync(SESSION, { force: true });
});

test("keepLinear stores { layer, path, property, key_times } for an all-linear property", () => {
  session.start(practice, KT);
  const list = session.keepLinear(practice, [{ layer: "CTRL", property: "Position" }]);
  assert.deepEqual(list, [{ layer: "CTRL", path: POS, property: "Position", key_times: [0, 1] }]);
  assert.deepEqual(session.currentLesson().kept_linear, list);
  session.keepLinear(practice, [{ layer: "CTRL", property: POS }]); // by path, the same mark again
  assert.equal(session.currentLesson().kept_linear.length, 1, "replaced, not doubled");
});

test("keepLinear refuses a missing property, one with an expression, or one not linear, and stores nothing", () => {
  session.start(practice, KT);
  const eased = fixture("eased"); // Title Position eased
  for (const [snap, refs] of [
    [practice, [{ layer: "CTRL", property: "Scale" }]],
    [practice, [{ layer: "Nobody", property: "Position" }]],
    [practice, [{ layer: "Logo", property: "Rotation" }]],
    [practice, [{ layer: "Cursor", property: "Opacity" }]],
    [practice, [{ layer: "Subtitle", property: "Opacity" }]],
    [practice, [{ layer: "Logo", property: "Scale" }]],
    [practice, [{ layer: "CTRL", property: "Position" }, { layer: "Cursor", property: "Opacity" }]],
    [eased, [{ layer: "Title", property: "Position" }]],
  ]) {
    assert.throws(() => session.keepLinear(snap, refs), { code: "NOT_KEPT_LINEAR" }, JSON.stringify(refs));
  }
  assert.deepEqual(session.currentLesson().kept_linear, []);
});

test("keepLinear with no lesson throws NO_SESSION", () => {
  assert.throws(() => session.keepLinear(practice, [{ layer: "CTRL", property: "Position" }]), { code: "NO_SESSION" });
});

test("record_lesson writes the lesson's marks; the reply and version are unchanged", async () => {
  session.start(practice, KT);
  session.keepLinear(practice, [{ layer: "CTRL", property: "Position" }]);
  const saved = await data(tool("record_lesson")(entry()));
  assert.deepEqual(saved, { saved: true, skill: { status: "practicing", next: "Hold a blink." } });
  const f = file();
  assert.equal(f.version, 1);
  assert.equal(f.marks.length, 1);
  const m = f.marks[0];
  assert.deepEqual({ ...m, date: undefined }, {
    kind: "kept_linear", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice", layer: "CTRL", path: POS,
    property: "Position", key_times: [0, 1], skill: "keyframes.types", date: undefined,
  });
  assert.match(m.date, /^\d{4}-\d{2}-\d{2}$/);
  const read = await data(tool("read_learner_record")({}));
  assert.deepEqual(read.marks, f.marks, "read_learner_record returns the marks");
});

test("a new mark replaces one on the same comp, layer and path; lapsed marks for this comp go; other comps' stay", async () => {
  const other = { kind: "kept_linear", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice 2", layer: "Spinner",
    path: "ADBE Transform Group/ADBE Rotate Z", property: "Rotation", key_times: [0, 4], skill: "keyframes.types", date: "2026-10-20" };
  const lapsed = { ...other, comp: "Mentor Practice", layer: "Title", path: POS, property: "Position", key_times: [0, 1] }; // Title's keys are 0.5, 1.5, 3
  const old = { ...other, comp: "Mentor Practice", layer: "CTRL", path: POS, property: "Position", key_times: [0, 1], date: "2026-10-01" };
  fs.writeFileSync(FILE, JSON.stringify({ version: 1, skills: {}, lessons: [], marks: [other, lapsed, old] }));
  session.start(practice, KT);
  session.keepLinear(practice, [{ layer: "CTRL", property: "Position" }]);
  await tool("record_lesson")(entry());
  const marks = file().marks;
  assert.deepEqual(marks.map((m) => `${m.comp}/${m.layer}`), ["Mentor Practice 2/Spinner", "Mentor Practice/CTRL"]);
  assert.notEqual(marks[1].date, "2026-10-01", "replaced by the new one");
});

test("the email and phone check covers a mark's layer name", async () => {
  const snap = structuredClone(practice);
  snap.layers.find((l) => l.name === "CTRL").name = "someone@example.edu";
  session.start(snap, KT);
  session.keepLinear(snap, [{ layer: "someone@example.edu", property: "Position" }]);
  await assert.rejects(tool("record_lesson")(entry()), { code: "UNSAFE_RECORD" });
  assert.equal(fs.existsSync(FILE), false);
});

test("the next easing lesson on that comp leaves a marked property out", () => {
  fs.copyFileSync(path.join(FIXTURES, "records", "easing-learned-kept-linear.json"), FILE);
  const s = session.start(practice);
  assert.equal(s.session.marks.length, 1);
  assert.equal(s.analysis.targets.includes(`3/${POS}/1`), false);
  assert.ok(s.analysis.skipped.some((x) => x.layer === "CTRL" && x.reason === "kept_linear"));
});

test("snapshot_project with the kept-linear record lists CTRL Position as skipped, kept_linear (T056)", async () => {
  fs.copyFileSync(path.join(FIXTURES, "records", "easing-learned-kept-linear.json"), FILE);
  const r = await data(tool("snapshot_project")({}));
  assert.deepEqual(r.skipped.filter((s) => s.reason === "kept_linear"), [{ layer: "CTRL", property: "Position", reason: "kept_linear" }]);
  assert.equal(r.findings.some((f) => f.layer === "CTRL"), false);
});

test("no tool input lets the model write a mark", () => {
  for (const t of [...TOOLS, ...COMMON]) {
    const props = Object.keys(t.inputSchema.properties || {});
    assert.equal(props.some((p) => /mark|kept|linear/i.test(p)), false, t.name);
  }
  const record = TOOLS.find((t) => t.name === "record_lesson");
  assert.equal(record.inputSchema.additionalProperties, false);
});
