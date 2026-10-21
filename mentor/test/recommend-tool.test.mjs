// recommend_next at the tool level, in fixture mode on Mentor Practice (practice-before.json) with
// the saved records: a record-only answer when AE can't be reached, and a review offer remembered
// so it isn't offered again within 3 hours (FR-020, research R8).

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const setProject = (project) => fs.writeFileSync(stateFile, JSON.stringify({ project }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { commonTools } = await import("../tools/common.mjs");
const { FINDERS } = await import("../tools/easing.mjs");

// Easing's real finder, plus a stand-in for a skill with a review mode (no such skill is built
// yet): it finds the Cursor's Opacity on Mentor Practice.
const keyTypes = {
  focus(snapshot, { exclude = [] } = {}) {
    const hits = snapshot.layers.filter((l) => l.name === "Cursor" && !exclude.some((e) => e.layer === "Cursor" && e.property === "Opacity"));
    return { count: hits.length, layers: hits.map((l) => l.name) };
  },
  review: true,
};
const TOOLS = commonTools({ skills: ["easing.basic", "keyframes.types"], finders: { ...FINDERS, "keyframes.types": keyTypes } });
const call = async (args = {}) => {
  const r = await TOOLS.find((t) => t.name === "recommend_next").handler(args);
  return JSON.parse(r.content[0].text);
};
const useRecord = (name) => fs.copyFileSync(path.join(FIXTURES, "records", `${name}.json`), path.join(home, "learner.json"));
const SESSION = path.join(home, "session.json");

// A record with key types learned and due, its past target on another comp.
function keyTypesDue() {
  const r = JSON.parse(fs.readFileSync(path.join(FIXTURES, "records", "easing-learned.json"), "utf8"));
  r.skills["keyframes.types"] = { status: "learned", last_practiced: "2026-10-15T16:00:00.000Z", times_passed: 1, next: "x", review_due: "2026-10-16", reviews_passed_in_row: 0 };
  fs.writeFileSync(path.join(home, "learner.json"), JSON.stringify(r));
}

beforeEach(() => {
  fs.rmSync(SESSION, { force: true });
  fs.rmSync(path.join(home, "learner.json"), { force: true });
  setProject(path.join(FIXTURES, "practice-before.json"));
});

test("with the comp in view, a first-time learner is offered easing on Mentor Practice", async () => {
  useRecord("empty");
  const r = await call();
  assert.equal(r.looked_at_comp, true);
  assert.equal(r.comp, "Mentor Practice");
  assert.equal(r.recommendation.skill, "easing.basic");
  assert.equal(r.recommendation.skill_name, "Easing");
  assert.equal(r.recommendation.reason, "next_in_path");
  assert.ok(r.recommendation.focus_layers.includes("Title"));
});

test("AE unreachable gives a record-only answer and says the comp wasn't looked at", async () => {
  useRecord("easing-practicing");
  setProject("unreachable");
  const r = await call();
  assert.equal(r.looked_at_comp, false);
  assert.equal(r.comp, null);
  assert.equal(r.recommendation.kind, "continue");
  assert.equal(r.recommendation.focus_layers, null);
});

test("a returned review is remembered, and inside 3 hours the same one is offered again, not another", async () => {
  keyTypesDue();
  const first = await call();
  assert.equal(first.recommendation.kind, "review");
  assert.equal(first.recommendation.skill, "keyframes.types");
  const offers = JSON.parse(fs.readFileSync(SESSION, "utf8")).review_offers;
  assert.deepEqual(offers.map((o) => o.skill), ["keyframes.types"]);
  const second = await call();
  assert.deepEqual(second.recommendation, first.recommendation);
  assert.deepEqual(JSON.parse(fs.readFileSync(SESSION, "utf8")).review_offers, offers, "still one offer in the window");
});

test("an unreadable record: record_readable false, and the file is left as it was", async () => {
  useRecord("unreadable");
  const before = fs.readFileSync(path.join(home, "learner.json"), "utf8");
  const r = await call();
  assert.equal(r.record_readable, false);
  assert.equal(r.recommendation.skill, "easing.basic");
  assert.equal(fs.readFileSync(path.join(home, "learner.json"), "utf8"), before);
});

test("asking for an unbuilt skill says it isn't built and names its missing prerequisite", async () => {
  useRecord("easing-learned");
  const r = await call({ requested_skill: "parenting.null" });
  assert.equal(r.requested.built, false);
  assert.deepEqual(r.requested.missing_prerequisites.map((p) => p.skill), ["transform.anchor"]);
});

test("recommend_next is read-only for the record and doesn't start a lesson", async () => {
  useRecord("easing-learned");
  const before = fs.readFileSync(path.join(home, "learner.json"), "utf8");
  await call();
  assert.equal(fs.readFileSync(path.join(home, "learner.json"), "utf8"), before);
  const s = fs.existsSync(SESSION) ? JSON.parse(fs.readFileSync(SESSION, "utf8")) : { lessons: {} };
  assert.deepEqual(s.lessons, {});
});
