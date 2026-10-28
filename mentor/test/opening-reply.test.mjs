// Spec 004 Phase 10, T402 (FR-048, FR-049, FR-051; contracts/skill-module.md § 3): the five snapshot
// tools of skills with a review, in fixture mode on Mentor Practice 2, each called without `mode`.
// Each reply carries mode, mode_source, learner and server_current; learner is this skill's slice of
// the record and nothing more. A call with an explicit mode gives the same reply as one without where
// the opening picks that mode, apart from mode_source.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");
const EDITS = path.join(home, "fixture-edits.json");
const P2B = path.join(FIXTURES, "layer-info", "practice2b.json");
const NO_INFO = path.join(FIXTURES, "practice-before.json"); // a capture from before layer_info
const project = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
project(P2B);
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
delete process.env.AE_MENTOR_FIXTURE_TWINS;

const { TOOLS, FINDERS } = await import("../tools/index.mjs");
const session = await import("../lib/session.mjs");
const { readPath } = await import("../lib/path.mjs");
const { localDate } = await import("../lib/reviews.mjs");

const PATH = readPath();
const SNAP = JSON.parse(fs.readFileSync(P2B, "utf8"));
const call = async (name, args = {}) => JSON.parse((await TOOLS.find((t) => t.name === name).handler(args)).content[0].text);

const TOOL = {
  "keyframes.types": "key_types_snapshot",
  "easing.speed_graph": "speed_graph_snapshot",
  "timing.offset": "offset_snapshot",
  "transform.anchor": "anchor_snapshot",
  "parenting.null": "null_parent_snapshot",
};
const FIVE = Object.keys(TOOL).filter((id) => FINDERS[id] && TOOLS.some((t) => t.name === TOOL[id]));

// Saved records where this skill is learned, due, and has a new target on Mentor Practice 2.
const LEARNED_DUE = {
  "keyframes.types": path.join(FIXTURES, "key-types", "records", "learned-blink.json"),
  "easing.speed_graph": path.join(FIXTURES, "speed-graph", "record-learned-title.json"),
  "timing.offset": path.join(FIXTURES, "offset", "records", "learned-dots.json"),
  "transform.anchor": path.join(FIXTURES, "anchor", "records", "learned-door.json"),
  "parenting.null": path.join(FIXTURES, "null-parenting", "records", "learned-group.json"),
};
const UNREADABLE = path.join(FIXTURES, "records", "unreadable.json");
const readRecord = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const todayMinus = (days) => { const d = new Date(); d.setDate(d.getDate() - days); d.setHours(12, 0, 0, 0); return d; };
function practicing(skill) {
  const last = todayMinus(2);
  return {
    version: 1,
    skills: {
      "easing.basic": { status: "learned", last_practiced: "2026-10-12T18:00:00.000Z", times_passed: 1, next: "x", review_due: "2999-01-01", reviews_passed_in_row: 0 },
      "transform.anchor": { status: "learned", last_practiced: "2026-10-12T18:00:00.000Z", times_passed: 1, next: "x", review_due: "2999-01-01", reviews_passed_in_row: 0 },
      [skill]: { status: "practicing", last_practiced: last.toISOString(), times_passed: 0, next: "Card still lands moving." },
    },
    lessons: [
      { date: last.toISOString(), skill, project: SNAP.project, comp: SNAP.comp.name, attempted: "Worked on Card", result: "partial", demo_used: false, summary: "s", next: "Card still lands moving.", kind: "first", targets: [] },
      { date: todayMinus(9).toISOString(), skill, project: SNAP.project, comp: "Mentor Practice", attempted: "An older go", result: "partial", demo_used: false, summary: "s", next: "n", kind: "first", targets: [] },
    ],
  };
}

const clear = () => { for (const f of [SESSION, LEARNER, EDITS]) fs.rmSync(f, { force: true }); };
beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f !== "fixture-state.json") fs.rmSync(path.join(home, f), { force: true });
  project(P2B);
});

const ids = [PATH.on_ramp.id, ...PATH.skills.map((s) => s.id)];
function assertClean(learner, what) {
  const text = JSON.stringify(learner);
  for (const id of ids) assert.ok(!text.includes(`"${id}"`) && !(id.includes(".") && text.includes(id)), `${what}: no skill ID ${id}`);
  assert.ok(!text.includes("learner.json"), `${what}: no file name`);
  assert.ok(!text.includes(home), `${what}: no path`);
  assert.ok(!/"(skills|lessons|path)"/.test(text), `${what}: no lesson list or record keys`);
}
function assertShape(r, what) {
  for (const k of ["mode", "mode_source", "learner"]) assert.ok(k in r, `${what}: ${k}`);
  assert.ok("server_current" in r, `${what}: server_current`);
  assertClean(r.learner, what);
}

for (const skill of FIVE) {
  const name = TOOL[skill];

  test(`${name}: no record → lesson, default, not started`, async () => {
    const r = await call(name);
    assertShape(r, name);
    assert.deepEqual([r.mode, r.mode_source], ["lesson", "default"]);
    assert.equal(r.learner.readable, true);
    assert.equal(r.learner.status, "not_started");
    assert.equal(r.learner.times_passed, 0);
    assert.equal(r.learner.review_due, false);
  });

  test(`${name}: practicing → lesson, default, with next, last_attempted and days since`, async () => {
    fs.writeFileSync(LEARNER, JSON.stringify(practicing(skill)));
    const r = await call(name);
    assertShape(r, name);
    assert.deepEqual([r.mode, r.mode_source], ["lesson", "default"]);
    assert.equal(r.learner.status, "practicing");
    assert.equal(r.learner.next, "Card still lands moving.");
    assert.equal(r.learner.last_attempted, "Worked on Card");
    assert.equal(r.learner.days_since_practiced, 2);
  });

  test(`${name}: learned and due with a new target → review, review_due, the offer remembered`, async () => {
    const rec = readRecord(LEARNED_DUE[skill]);
    assert.equal(rec.skills[skill].status, "learned");
    fs.copyFileSync(LEARNED_DUE[skill], LEARNER);
    const r = await call(name);
    assertShape(r, name);
    assert.deepEqual([r.mode, r.mode_source], ["review", "review_due"]);
    assert.equal(r.learner.status, "learned");
    assert.equal(r.learner.review_due, true);
    assert.equal(r.learner.times_passed, rec.skills[skill].times_passed);
    assert.equal(r.learner.next, rec.skills[skill].next);
    const mine = rec.lessons.filter((l) => l.skill === skill).sort((a, b) => a.date.localeCompare(b.date));
    assert.equal(r.learner.last_attempted, mine[mine.length - 1].attempted);
    const [y, m, d] = localDate(new Date(rec.skills[skill].last_practiced)).split("-").map(Number);
    const [ty, tm, td] = localDate(new Date()).split("-").map(Number);
    assert.equal(r.learner.days_since_practiced, Math.round((new Date(ty, tm - 1, td) - new Date(y, m - 1, d)) / 86400000));
    assert.deepEqual(session.reviewOffers().map((o) => o.skill), [skill]);
    // A later call in the same lesson stays a review.
    const again = await call(name);
    assert.deepEqual([again.mode, again.mode_source, again.lesson], ["review", "in_progress", "continued"]);
  });

  test(`${name}: an unreadable record → lesson, default, the same error read_learner_record gives`, async () => {
    fs.copyFileSync(UNREADABLE, LEARNER);
    let expected = null;
    await assert.rejects(TOOLS.find((t) => t.name === "read_learner_record").handler({}), (e) => {
      expected = { code: e.code, message: e.message };
      return true;
    });
    for (const f of fs.readdirSync(home)) if (f.startsWith("learner.json")) fs.rmSync(path.join(home, f));
    fs.copyFileSync(UNREADABLE, LEARNER);
    const r = await call(name);
    assertShape(r, name);
    assert.deepEqual([r.mode, r.mode_source], ["lesson", "default"]);
    assert.equal(r.learner.readable, false);
    assert.deepEqual(r.learner.error, expected);
    assert.equal(r.learner.status, "not_started");
    assert.equal(fs.existsSync(LEARNER), false, "set aside");
    const next = await call(name);
    assert.equal(next.learner.readable, true, "said once: the next call reads as empty");
  });

  test(`${name}: an explicit mode gives the same reply as no mode where the opening picks it, apart from mode_source`, async () => {
    const strip = (r) => { const { mode_source, ...rest } = r; return rest; };
    // review
    fs.copyFileSync(LEARNED_DUE[skill], LEARNER);
    const picked = await call(name);
    assert.equal(picked.mode_source, "review_due");
    fs.rmSync(SESSION, { force: true });
    const asked = await call(name, { mode: "review" });
    assert.equal(asked.mode_source, "asked");
    assert.deepEqual(strip(asked), strip(picked));
    // lesson
    clear();
    const def = await call(name);
    assert.equal(def.mode_source, "default");
    fs.rmSync(SESSION, { force: true });
    const askedLesson = await call(name, { mode: "lesson" });
    assert.equal(askedLesson.mode_source, "asked");
    assert.deepEqual(strip(askedLesson), strip(def));
  });

  test(`${name}: turning a due review down (mode lesson) → lesson, asked`, async () => {
    fs.copyFileSync(LEARNED_DUE[skill], LEARNER);
    const r = await call(name, { mode: "lesson" });
    assert.deepEqual([r.mode, r.mode_source], ["lesson", "asked"]);
    assert.equal(r.learner.review_due, true);
    assert.deepEqual(session.reviewOffers(), []);
  });

  test(`${name}: AE unreachable → the tool's error, as today, and nothing starts`, async () => {
    fs.copyFileSync(LEARNED_DUE[skill], LEARNER);
    fs.writeFileSync(stateFile, JSON.stringify({ project: "unreachable" }));
    await assert.rejects(call(name), { code: "AE_UNREACHABLE" });
    assert.equal(fs.existsSync(SESSION), false, "no lesson and no offer");
  });
}

test("speed_graph_snapshot: learner.eased_layers from easing targets", async () => {
  const rec = readRecord(path.join(FIXTURES, "records", "easing-learned.json"));
  rec.lessons.push({ ...rec.lessons[0], date: "2026-10-13T18:00:00.000Z", comp: "Mentor Practice 2", targets: [{ layer: "Card", property: "Scale" }, { layer: "Title", property: "Opacity" }] });
  fs.writeFileSync(LEARNER, JSON.stringify(rec));
  const r = await call("speed_graph_snapshot");
  assert.deepEqual(r.learner.eased_layers, ["Title", "Card"]);
});

test("speed_graph_snapshot: an older easing entry with no targets names layers of this comp by their exact name", async () => {
  const rec = readRecord(path.join(FIXTURES, "records", "easing-learned-old-v1.json"));
  rec.lessons[0].attempted = "Eased Card's Scale, and the Dot 1 move";
  rec.lessons[0].summary = "Cards and Spinners aren't layer names here.";
  fs.writeFileSync(LEARNER, JSON.stringify(rec));
  const names = new Set([...SNAP.layers.map((l) => l.name), ...SNAP.layer_info.map((l) => l.name)]);
  assert.ok(names.has("Card") && names.has("Dot 1") && names.has("Spinner"));
  const r = await call("speed_graph_snapshot");
  assert.deepEqual([...r.learner.eased_layers].sort(), ["Card", "Dot 1"]);
});

test("speed_graph_snapshot: no record, or an unreadable one → no eased layers", async () => {
  assert.deepEqual((await call("speed_graph_snapshot")).learner.eased_layers, []);
  clear();
  fs.copyFileSync(UNREADABLE, LEARNER);
  assert.deepEqual((await call("speed_graph_snapshot")).learner.eased_layers, []);
});

test("eased_layers is speed graph's only", async () => {
  fs.copyFileSync(path.join(FIXTURES, "records", "easing-learned.json"), LEARNER);
  for (const skill of FIVE.filter((s) => s !== "easing.speed_graph")) {
    clear();
    fs.copyFileSync(path.join(FIXTURES, "records", "easing-learned.json"), LEARNER);
    assert.equal("eased_layers" in (await call(TOOL[skill])).learner, false, TOOL[skill]);
  }
});

test("null_parent_snapshot: other_skills has the pivot (hard) and easing (not hard)", async () => {
  const r = await call("null_parent_snapshot");
  assert.deepEqual(r.learner.other_skills, [
    { skill_name: "Set the pivot (anchor point)", learned: false, hard: true },
    { skill_name: "Easing", learned: false, hard: false },
  ]);
  clear();
  fs.copyFileSync(LEARNED_DUE["parenting.null"], LEARNER);
  const l = await call("null_parent_snapshot");
  assert.deepEqual(l.learner.other_skills.map((s) => s.learned), [true, true]);
  assert.deepEqual(FINDERS["parenting.null"].mentions, ["easing.basic"]);
});

test("null_parent_snapshot: the can_teach false reply carries mode, mode_source, learner and server_current", async () => {
  project(NO_INFO);
  fs.copyFileSync(LEARNED_DUE["parenting.null"], LEARNER);
  const r = await call("null_parent_snapshot");
  assert.equal(r.can_teach, false);
  assertShape(r, "can_teach false");
  assert.deepEqual([r.mode, r.mode_source], ["lesson", "default"], "nothing to review without layer_info");
  assert.equal(r.learner.status, "learned");
});

test("anchor_snapshot: the reply before layer_info carries the same fields", async () => {
  project(NO_INFO);
  const r = await call("anchor_snapshot");
  assert.equal(r.no_layer_info, true);
  assertShape(r, "no_layer_info");
});

test("anchor_snapshot and null_parent_snapshot: server_current, as the other three", async () => {
  for (const name of ["anchor_snapshot", "null_parent_snapshot"]) {
    clear();
    const r = await call(name);
    assert.ok(r.server_current === null || typeof r.server_current === "boolean", name);
  }
});

test("key_types_snapshot: fresh on an open lesson keeps its mode", async () => {
  fs.copyFileSync(LEARNED_DUE["keyframes.types"], LEARNER);
  const first = await call("key_types_snapshot", { mode: "lesson" });
  assert.equal(first.mode, "lesson");
  const again = await call("key_types_snapshot", { fresh: true });
  assert.deepEqual([again.mode, again.mode_source, again.lesson], ["lesson", "in_progress", "new"]);
});
