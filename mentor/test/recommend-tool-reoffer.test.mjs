// recommend_next at the tool level (spec 004 review, round 5b): a repeat call in the same 3-hour
// window offers the same review again without moving the window, and the tool says it writes.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "practice-before.json") }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { commonTools } = await import("../tools/common.mjs");
const { FINDERS } = await import("../tools/easing.mjs");

const keyTypes = {
  focus(snapshot, { exclude = [] } = {}) {
    const hits = snapshot.layers.filter((l) => l.name === "Cursor" && !exclude.some((e) => e.layer === "Cursor" && e.property === "Opacity"));
    return { count: hits.length, layers: hits.map((l) => l.name) };
  },
  review: true,
};
const TOOLS = commonTools({ skills: ["easing.basic", "keyframes.types"], finders: { ...FINDERS, "keyframes.types": keyTypes } });
const tool = TOOLS.find((t) => t.name === "recommend_next");
const call = async (args = {}) => JSON.parse((await tool.handler(args)).content[0].text);
const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");

beforeEach(() => {
  fs.rmSync(SESSION, { force: true });
  const r = JSON.parse(fs.readFileSync(path.join(FIXTURES, "records", "easing-learned.json"), "utf8"));
  r.skills["keyframes.types"] = { status: "learned", last_practiced: "2026-10-15T16:00:00.000Z", times_passed: 1, next: "x", review_due: "2026-10-16", reviews_passed_in_row: 0 };
  fs.writeFileSync(LEARNER, JSON.stringify(r));
});

test("a repeat call in the window offers the same review again", async () => {
  const first = await call();
  assert.equal(first.recommendation.kind, "review");
  const second = await call();
  assert.deepEqual(second.recommendation, first.recommendation);
});

test("the repeat doesn't add a second offer, so the window doesn't move", async () => {
  await call();
  const before = JSON.parse(fs.readFileSync(SESSION, "utf8")).review_offers;
  await call();
  await call();
  const after = JSON.parse(fs.readFileSync(SESSION, "utf8")).review_offers;
  assert.deepEqual(after, before);
  assert.equal(after.length, 1);
});

test("recommend_next isn't marked read-only: it remembers review offers", () => {
  assert.equal(tool.annotations.readOnlyHint, false);
  assert.equal(tool.annotations.destructiveHint, false);
});
