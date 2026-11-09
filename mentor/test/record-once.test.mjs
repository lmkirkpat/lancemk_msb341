// Spec 007 FR-046: a question after a pass must not write a second lesson record. Once a lesson's
// pass is saved, the record for that lesson is finished: record_lesson refuses anything more for it,
// in every skill, in a review, and after the session is read back from disk. A save that wasn't a
// pass leaves the lesson open, because a learner who stopped can come back and pass it.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FIXTURES, fixture, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "synthetic", "attempt-before.json") }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const COMMON = new URL("../tools/common.mjs", import.meta.url);
const { commonTools } = await import(COMMON);
const session = await import("../lib/session.mjs");
const { MESSAGES } = await import("../errors.mjs");
const SAMPLE = await import(path.join(FIXTURES, "sample-skill", "lib", "sample.mjs"));

// Every skill's record_lesson is this one shared tool, and every skill's check ends in markChecked.
const SKILLS = ["easing.basic", "easing.speed_graph", "keyframes.types", "timing.offset", "transform.anchor", "parenting.null"];
const TOOLS = commonTools({ skills: SKILLS, finders: {} });
const record = TOOLS.find((t) => t.name === "record_lesson").handler;
const FILE = path.join(home, "learner.json");
const SESSION = path.join(home, "session.json");
const A = fixture("attempt-before");
const SKILL = "keyframes.types";
const options = (skill = SKILL, more = {}) => ({ skill, analyze: SAMPLE.analyze, ...more });

const entry = (over = {}) => ({
  skill: SKILL, project: "Synthetic.aep", comp: "Lower Third", attempted: "Worked the Opacity pairs",
  result: "passed", demo_used: false, summary: "Both Opacity pairs right.", next: "Try another comp.", ...over,
});
const saved = () => JSON.parse(fs.readFileSync(FILE, "utf8")).lessons;
const refused = { code: "LESSON_ALREADY_SAVED" };

beforeEach(() => {
  fs.rmSync(FILE, { force: true });
  fs.rmSync(SESSION, { force: true });
});

for (const skill of SKILLS) {
  for (const mode of ["lesson", "review"]) {
    test(`${skill} ${mode}: a second save after a saved pass is refused and the record doesn't change`, async () => {
      session.start(A, options(skill, { mode }));
      session.markChecked(true);
      await record(entry({ skill }));
      const before = fs.readFileSync(FILE, "utf8");
      session.markChecked(true); // the check a question after the pass ran
      await assert.rejects(record(entry({ skill, summary: "Asked a question." })), refused);
      assert.equal(fs.readFileSync(FILE, "utf8"), before);
    });
  }
}

test("the refusal tells the mentor what to do and carries no field name", async () => {
  const message = MESSAGES.LESSON_ALREADY_SAVED;
  assert.match(message, /already saved/i);
  assert.match(message, /answer/i);
  assert.doesNotMatch(message, /[a-z]_[a-z]|record_lesson|"/);
});

test("a stop, then a real pass in the same lesson, saves both", async () => {
  session.start(A, options());
  session.markChecked(false);
  await record(entry({ result: "partial" }));
  const id = session.currentLesson().lesson_id;
  const back = session.start(A, options());
  assert.equal(back.lesson, "continued");
  assert.equal(back.session.lesson_id, id);
  session.markChecked(true);
  await record(entry());
  assert.deepEqual(saved().map((l) => l.result), ["partial", "passed"]);
});

test("a stop before any check, a stop after one, then a pass: all three save", async () => {
  session.start(A, options());
  await record(entry({ result: "not_checked" }));
  session.markChecked(false);
  await record(entry({ result: "partial" }));
  session.markChecked(true);
  await record(entry());
  assert.deepEqual(saved().map((l) => l.result), ["not_checked", "partial", "passed"]);
});

test("a review stopped partway can still save its pass", async () => {
  session.start(A, options(SKILL, { mode: "review" }));
  session.markChecked(false);
  await record(entry({ result: "partial" }));
  session.markChecked(true);
  await record(entry());
  assert.deepEqual(saved().map((l) => l.result), ["partial", "passed"]);
  await assert.rejects(record(entry()), refused);
});

test("a failing check after the saved pass can't turn the pass into a partial", async () => {
  session.start(A, options());
  session.markChecked(true);
  await record(entry());
  session.markChecked(false); // the learner changed something, then asked about it
  await assert.rejects(record(entry({ result: "partial" })), refused);
  await assert.rejects(record(entry()), refused, "not RECORD_MISMATCH, whose fix would be to save again");
  assert.deepEqual(saved().map((l) => l.result), ["passed"]);
});

test("a lesson with a saved pass stays finished, so the next snapshot is a new lesson that can save", async () => {
  session.start(A, options());
  session.markChecked(true);
  await record(entry());
  const first = session.currentLesson().lesson_id;
  session.markChecked(false); // without this rule, the snapshot below would continue the old lesson
  await new Promise((r) => setTimeout(r, 2));
  const next = session.start(A, options());
  assert.equal(next.lesson, "new");
  assert.notEqual(next.session.lesson_id, first);
  session.markChecked(true);
  await record(entry());
  assert.equal(saved().length, 2);
});

test("a save that failed doesn't count: fixing it and saving again works", async () => {
  session.start(A, options());
  session.markChecked(true);
  await assert.rejects(record(entry({ summary: "Email a@b.co" })), { code: "UNSAFE_RECORD" });
  await record(entry());
  assert.equal(saved().length, 1);
});

test("another skill's record is still the skill mismatch, not a repeat", async () => {
  session.start(A, options());
  session.markChecked(true);
  await record(entry());
  await assert.rejects(record(entry({ skill: "timing.offset" })), { code: "RECORD_MISMATCH" });
});

test("a session file from before this rule has no saved pass, so its lesson can still save", async () => {
  session.start(A, options());
  session.markChecked(true);
  const file = JSON.parse(fs.readFileSync(SESSION, "utf8"));
  for (const l of Object.values(file.lessons)) delete l.pass_saved;
  fs.writeFileSync(SESSION, JSON.stringify(file));
  await record(entry());
  assert.equal(saved().length, 1);
});

// Continue relaunches the mentor, so the rule has to hold in a process that starts from the file.
function saveInNewProcess(over = {}) {
  const script = `
    const { commonTools } = await import(${JSON.stringify(pathToFileURL(COMMON.pathname).href)});
    const tools = commonTools({ skills: ${JSON.stringify(SKILLS)}, finders: {} });
    try {
      await tools.find((t) => t.name === "record_lesson").handler(${JSON.stringify(entry(over))});
      console.log("saved");
    } catch (e) {
      console.log(e.code);
    }`;
  return execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    env: { ...process.env, AE_MENTOR_HOME: home }, encoding: "utf8",
  }).trim();
}

test("a saved pass is still remembered by a new mentor process", async () => {
  session.start(A, options());
  session.markChecked(true);
  await record(entry());
  assert.equal(saveInNewProcess(), "LESSON_ALREADY_SAVED");
  assert.equal(saved().length, 1);
});

test("a new mentor process doesn't block the pass after a saved stop", async () => {
  session.start(A, options());
  session.markChecked(false);
  await record(entry({ result: "partial" }));
  session.markChecked(true);
  assert.equal(saveInNewProcess(), "saved");
  assert.deepEqual(saved().map((l) => l.result), ["partial", "passed"]);
});
