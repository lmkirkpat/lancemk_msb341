// contracts/shared-tools.md › record_lesson and read_learner_record, at the tool level, in fixture
// mode: the record must match the current lesson's skill, a review can't say a demo was used, and
// reading the record gives the worked-out review fields without writing anything.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, fixture, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "synthetic", "attempt-before.json") }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { commonTools } = await import("../tools/common.mjs");
const session = await import("../lib/session.mjs");
const { localDate } = await import("../lib/reviews.mjs");
const SAMPLE = await import(path.join(FIXTURES, "sample-skill", "lib", "sample.mjs"));

const SKILLS = ["easing.basic", "sample.skill"];
const TOOLS = commonTools({ skills: SKILLS, finders: {} });
const tool = (name) => TOOLS.find((t) => t.name === name).handler;
const data = async (p) => JSON.parse((await p).content[0].text);
const FILE = path.join(home, "learner.json");
const A = fixture("attempt-before");
const SAMPLE_SKILL = { skill: "sample.skill", analyze: SAMPLE.analyze };

const entry = (over = {}) => ({
  skill: "sample.skill", project: "Synthetic.aep", comp: "Lower Third", attempted: "Worked the Opacity pairs",
  result: "passed", demo_used: false, summary: "Both Opacity pairs right.", next: "Try another comp.", ...over,
});

beforeEach(() => {
  fs.rmSync(FILE, { force: true });
  fs.rmSync(path.join(home, "session.json"), { force: true });
});

test("record_lesson refuses a skill other than the current lesson's", async () => {
  session.start(A); // an easing lesson
  session.markChecked(true);
  await assert.rejects(tool("record_lesson")(entry()), (e) => e.code === "RECORD_MISMATCH" && /skill/.test(e.message));
  assert.equal(fs.existsSync(FILE), false);
  const saved = await data(tool("record_lesson")(entry({ skill: "easing.basic" })));
  assert.deepEqual(saved, { saved: true, skill: { status: "learned", next: "Try another comp." } });
});

test("a review can't be recorded with demo_used: true", async () => {
  session.start(A, { ...SAMPLE_SKILL, mode: "review" });
  session.markChecked(true);
  await assert.rejects(tool("record_lesson")(entry({ demo_used: true })), (e) => e.code === "RECORD_MISMATCH" && /review/.test(e.message));
  assert.equal(fs.existsSync(FILE), false);
});

test("a review lesson is stored with kind review and its targets; the reply is unchanged", async () => {
  session.start(A, { ...SAMPLE_SKILL, mode: "review" });
  session.markChecked(true);
  const saved = await data(tool("record_lesson")(entry()));
  assert.deepEqual(saved, { saved: true, skill: { status: "learned", next: "Try another comp." } });
  const file = JSON.parse(fs.readFileSync(FILE, "utf8"));
  const last = file.lessons.at(-1);
  assert.equal(last.kind, "review");
  assert.equal(last.already_knew, true);
  assert.deepEqual(last.targets, [{ layer: "Title", property: "Opacity" }, { layer: "Subtitle", property: "Opacity" }]);
  assert.equal(file.version, 1);
});

test("the demo mismatch message speaks of the demonstration, not a tool", async () => {
  session.start(A, SAMPLE_SKILL);
  session.markChecked(false);
  await assert.rejects(tool("record_lesson")(entry({ result: "partial", demo_used: true })),
    (e) => e.code === "RECORD_MISMATCH" && /the demonstration didn't run/.test(e.message) && !/set_ease/.test(e.message));
});

test("read_learner_record gives review_due, reviews_passed_in_row and review_is_due per skill, and writes nothing", async () => {
  fs.copyFileSync(path.join(FIXTURES, "records", "easing-learned-old-v1.json"), FILE);
  const before = fs.readFileSync(FILE, "utf8");
  const r = await data(tool("read_learner_record")({}));
  const easing = r.skills["easing.basic"];
  assert.equal(easing.status, "learned");
  assert.equal(easing.review_due, localDate(new Date(new Date("2026-10-12T18:00:00.000Z").getTime() + 24 * 3600 * 1000)));
  assert.equal(easing.reviews_passed_in_row, 0);
  assert.equal(easing.review_is_due, localDate(new Date()) >= easing.review_due);
  assert.ok(r.path.endsWith("learner.json"));
  assert.equal(fs.readFileSync(FILE, "utf8"), before);
});

test("read_learner_record: a skill still practicing has no due date and isn't due", async () => {
  fs.copyFileSync(path.join(FIXTURES, "records", "easing-practicing.json"), FILE);
  const easing = (await data(tool("read_learner_record")({}))).skills["easing.basic"];
  assert.equal(easing.review_due, undefined);
  assert.equal(easing.review_is_due, false);
});
