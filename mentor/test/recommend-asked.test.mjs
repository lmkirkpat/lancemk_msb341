// Spec 014 T068 (FR-042, TD § 11): recommend_next raises an unlearned skill from an asked entry when
// its finder finds something on this comp, below a lesson in progress, once per entry (`raised`, with
// a repeat in the same session window allowed). The reply carries the entry's goal and how many days
// ago it was asked, never the entry's date or a field the learner could be shown as "asked again".

process.env.TZ = "America/Denver";

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const LEARNER = path.join(home, "learner.json");
const SESSION = path.join(home, "session.json");
const { recommend, SESSION_WINDOW_HOURS } = await import("../lib/recommend.mjs");
const { readPath } = await import("../lib/path.mjs");

const NOW = new Date("2026-11-19T21:00:00.000Z"); // 14:00 in Denver
const PATH = readPath();
const BUILT = ["easing.basic", "keyframes.types", "easing.speed_graph", "timing.offset", "transform.anchor", "parenting.null"];
const SNAP = { project: "P.aep", comp: { id: 1, name: "Logo" }, layers: [] };
const finder = (count, review = true) => ({ focus: () => ({ count, layers: count ? ["Rock"] : [] }), review });
const FINDERS = {
  "easing.basic": finder(0, false), "keyframes.types": finder(0), "easing.speed_graph": finder(0), "timing.offset": finder(0),
  "transform.anchor": finder(1), "parenting.null": finder(1),
};
const learned = { status: "learned", last_practiced: "2026-11-01T10:00:00.000Z", times_passed: 1, next: "n", review_due: "2026-12-30", reviews_passed_in_row: 1 };
const entry = (over = {}) => ({ kind: "asked", date: "2026-11-12T18:00:00.000Z", project: "P.aep", comp: "Comp 1", layers: ["Shake Control"], goal: "a shake that turns from where it's hit", skills: ["transform.anchor"], after_learning: [], went_deeper: null, ...over });
const rec = (asked, skills = { "easing.basic": learned }) => ({ version: 1, skills, lessons: [], asked });
const run = (record, extra = {}) => recommend({ path: PATH, record, built: BUILT, finders: FINDERS, snapshot: SNAP, now: NOW, ...extra });

test("an unlearned skill from an asked entry is raised when its finder finds something here, with the goal and days ago", () => {
  const r = run(rec([entry()]));
  assert.equal(r.recommendation.skill, "transform.anchor");
  assert.equal(r.recommendation.kind, "lesson");
  assert.equal(r.recommendation.reason, "asked_before");
  assert.deepEqual(r.recommendation.asked, { goal: "a shake that turns from where it's hit", days_ago: 7 });
  assert.deepEqual(r.recommendation.focus_layers, ["Rock"]);
  assert.equal(r.raised_entry, "2026-11-12T18:00:00.000Z", "for the tool");
  assert.doesNotMatch(JSON.stringify(r), /raised_entry|2026-11-12|after_learning|Shake Control/, "the reply holds no date, entry field or old layer");
});

test("without an entry, the same record gives the path's next skill (nothing else changes)", () => {
  const r = run(rec([]));
  assert.notEqual(r.recommendation.reason, "asked_before");
  assert.deepEqual(run(rec(undefined)), r, "a record without asked reads as before");
});

test("below a lesson in progress", () => {
  const r = run(rec([entry()], { "easing.basic": learned, "keyframes.types": { status: "practicing", last_practiced: "2026-11-18T10:00:00.000Z", times_passed: 0, next: "n" } }));
  assert.equal(r.recommendation.skill, "keyframes.types");
  assert.equal(r.recommendation.reason, "in_progress");
});

test("below a due review (the builder's decision, T081): lesson in progress, then due review, then the asked skill", () => {
  const due = { status: "learned", last_practiced: "2026-11-01T10:00:00.000Z", times_passed: 1, next: "n", review_due: "2026-11-10", reviews_passed_in_row: 1 };
  const r = run(rec([entry()], { "easing.basic": learned, "parenting.null": due, "transform.anchor": { ...learned, status: "practicing" } }));
  assert.equal(r.recommendation.reason, "in_progress", "a lesson in progress first");
  const r2 = run(rec([entry({ skills: ["parenting.null"] })], { "easing.basic": learned, "transform.anchor": due }));
  assert.equal(r2.recommendation.kind, "review", "a due review comes before the asked skill");
  assert.equal(r2.recommendation.skill, "transform.anchor");
  assert.equal(r2.raised_entry, undefined, "the entry isn't marked when it wasn't raised");
  const r3 = run(rec([entry({ skills: ["parenting.null"] })], { "easing.basic": learned, "transform.anchor": learned }));
  assert.equal(r3.recommendation.reason, "asked_before", "with no review due, the asked skill");
});

test("not when its finder finds nothing here (K4: a keyframe skill on keyless motion finds no pairs), not learned, not unbuilt, not missing a hard prerequisite", () => {
  assert.notEqual(run(rec([entry({ skills: ["easing.speed_graph"] })])).recommendation.reason, "asked_before", "finder count 0");
  assert.notEqual(run(rec([entry()], { "easing.basic": learned, "transform.anchor": learned })).recommendation.reason, "asked_before", "learned: never as a candidate");
  assert.notEqual(run(rec([entry({ skills: ["shape.trim_paths"] })])).recommendation.reason, "asked_before", "not built");
  const noPivot = run(rec([entry({ skills: ["parenting.null"] })]));
  assert.notEqual(noPivot.recommendation.reason, "asked_before", "Group with a null needs Set the pivot learned");
  assert.equal(run(rec([entry({ skills: ["parenting.null"] })], { "easing.basic": learned, "transform.anchor": learned })).recommendation.skill, "parenting.null");
});

test("not without the comp in view", () => {
  const r = recommend({ path: PATH, record: rec([entry()]), built: BUILT, finders: FINDERS, snapshot: null, now: NOW });
  assert.notEqual(r.recommendation.reason, "asked_before");
});

test("once per entry: raised before this session window, never again; raised inside it, it may come back on a repeat call", () => {
  const old = new Date(NOW.getTime() - (SESSION_WINDOW_HOURS + 1) * 3600 * 1000).toISOString();
  assert.notEqual(run(rec([entry({ raised: old })])).recommendation.reason, "asked_before");
  const recent = new Date(NOW.getTime() - 3600 * 1000).toISOString();
  assert.equal(run(rec([entry({ raised: recent })])).recommendation.reason, "asked_before");
});

test("newest entry first; its skills in path order; junk entries skipped", () => {
  const r = run(rec(["junk", null, entry({ date: "2026-11-01T18:00:00.000Z", goal: "older" }), entry({ date: "2026-11-18T18:00:00.000Z", goal: "newer", skills: ["parenting.null", "transform.anchor"] })]));
  assert.equal(r.recommendation.asked.goal, "newer");
  assert.equal(r.recommendation.skill, "transform.anchor", "pivot comes before null in the path");
  assert.equal(r.recommendation.asked.days_ago, 1);
});

test("an unreadable record (null) raises nothing", () => {
  assert.notEqual(recommend({ path: PATH, record: null, built: BUILT, finders: FINDERS, snapshot: SNAP, now: NOW }).recommendation?.reason, "asked_before");
});

// ---- The tool: marks the entry raised, once, and leaves skills alone.

beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f.startsWith("learner.json") || f.startsWith("session.json") || f.startsWith("fixture")) fs.rmSync(path.join(home, f));
});

test("recommend_next marks the raised entry, keeps the time of the first raise, and changes no skill", async () => {
  const stateFile = path.join(home, "fixture-state.json");
  fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "expressions", "comp1.json") }));
  process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
  const { TOOLS } = await import("../tools/index.mjs");
  const tool = TOOLS.find((t) => t.name === "recommend_next").handler;
  const now = Date.now();
  const e = entry({ date: new Date(now - 2 * 86400000).toISOString() });
  const skills = { "easing.basic": learned };
  fs.writeFileSync(LEARNER, JSON.stringify(rec([e], skills)));
  const r1 = JSON.parse((await tool({})).content[0].text);
  const after = JSON.parse(fs.readFileSync(LEARNER, "utf8"));
  assert.deepEqual(after.skills, skills);
  assert.equal(r1.recommendation.reason, "asked_before", "Comp 1 has pivot candidates");
  assert.deepEqual(r1.recommendation.asked, { goal: e.goal, days_ago: r1.recommendation.asked.days_ago });
  assert.equal(typeof after.asked[0].raised, "string");
  const first = after.asked[0].raised;
  const r2 = JSON.parse((await tool({})).content[0].text);
  assert.equal(r2.recommendation.reason, "asked_before", "a repeat call in the window gives the same suggestion");
  assert.equal(JSON.parse(fs.readFileSync(LEARNER, "utf8")).asked[0].raised, first);
  assert.equal("raised_entry" in r1, false);
});
