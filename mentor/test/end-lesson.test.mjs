// Spec 014 T106: end_lesson, for a learner who stops a lesson before it's recorded. It ends the
// lesson in session.json (no later snapshot continues or resumes it), writes nothing to the learner
// record, and refuses with no lesson open (LESSON_NOT_OPEN) or once record_lesson has saved it
// (LESSON_ALREADY_ENDED). A lesson opened from an answer hands back, as record_lesson does. Fixture
// mode; nothing here touches After Effects.

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const PRACTICE = path.join(FIXTURES, "layer-info", "practice2b.json");
const COMP1 = path.join(FIXTURES, "expressions", "comp1.json");
const use = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
use(PRACTICE);
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { TOOLS } = await import("../tools/index.mjs");
const { MESSAGES } = await import("../errors.mjs");
const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");
const EDITS = path.join(home, "fixture-edits.json");
const handler = (name) => TOOLS.find((t) => t.name === name).handler;
const call = async (name, args = {}) => JSON.parse((await handler(name)(args)).content[0].text);
const refuses = (code) => assert.rejects(() => handler("end_lesson")({}), (e) => e.code === code, code);
const onDisk = () => JSON.parse(fs.readFileSync(SESSION, "utf8"));
const DOOR = { focus: [{ layer: "Door", place: "middle-left" }] };
const record = (over = {}) => ({ skill: "transform.anchor", project: "p", comp: "c", attempted: "Set Door's pivot to the middle of its left edge", result: "not_checked", demo_used: false, summary: "Stopped before trying.", next: "Set Door's pivot on its left edge without Door moving", ...over });

beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f.startsWith("session.json") || f.startsWith("learner.json") || f === "fixture-edits.json") fs.rmSync(path.join(home, f));
  use(PRACTICE);
});
afterEach(() => { delete process.env.AE_MENTOR_RUNTIME; });

test("registered once, with no arguments", () => {
  const t = TOOLS.filter((x) => x.name === "end_lesson");
  assert.equal(t.length, 1);
  assert.deepEqual(t[0].inputSchema, { type: "object", properties: {}, additionalProperties: false });
});

test("no lesson open: LESSON_NOT_OPEN, and nothing is written", async () => {
  await refuses("LESSON_NOT_OPEN");
  assert.equal(fs.existsSync(SESSION), false);
});

test("an open lesson ends: gone from session.json, nothing in the learner record, no edit to the project", async () => {
  await call("anchor_snapshot");
  await call("anchor_snapshot", { skill_options: DOOR });
  const r = await call("end_lesson");
  assert.deepEqual(r, { ended: true, skill_name: "Set the pivot (anchor point)" });
  assert.equal(onDisk().current, null);
  assert.deepEqual(onDisk().lessons, {});
  assert.equal(fs.existsSync(LEARNER), false, "nothing recorded");
  assert.equal(fs.existsSync(EDITS), false);
  await refuses("LESSON_NOT_OPEN");
});

test("after an end, the next snapshot starts a new lesson, never the ended one", async () => {
  await call("anchor_snapshot", { skill_options: DOOR });
  await call("anchor_check");
  await call("end_lesson");
  const next = await call("anchor_snapshot");
  assert.equal(next.lesson, "new");
  assert.equal(next.focus, null);
});

test("once record_lesson has saved the lesson, any result: LESSON_ALREADY_ENDED", async () => {
  await call("anchor_snapshot", { skill_options: DOOR });
  await call("record_lesson", record());
  await refuses("LESSON_ALREADY_ENDED");
  assert.equal(Object.keys(onDisk().lessons).length, 1, "the recorded lesson stays as it was");
});

test("the ask's answer and hand-in stay; a lesson from an answer hands back to the next step", async () => {
  use(COMP1);
  process.env.AE_MENTOR_RUNTIME = "a";
  await call("give_answer", {
    kind: "answer",
    explanation: "In Comp 1, rock.png rides on Shake Control, a null moved by expressions:\n- All three hits are the same size.",
    steps: [
      { text: "Select Shake Control (the null, not a letter) and Pan Behind its pivot to where the hammer hits.", skill: "transform.anchor", layer: "Shake Control" },
      { text: "Play it back and watch the turn.", skill: null, layer: null },
    ],
    offered_skills: ["transform.anchor"],
    closing_offer: "Try them, or want to go deeper on step 1 with *Set the pivot*?",
  });
  await call("go_deeper", { skill: "transform.anchor", step: 1 });
  await call("anchor_snapshot");
  const r = await call("end_lesson");
  assert.deepEqual(r.hand_back, { step_number: 1, next_step: "Play it back and watch the turn." });
  assert.equal(onDisk().ask.comp, "Comp 1");
  assert.equal(onDisk().hand_in.used, true);
});

test("an unreadable session file: SESSION_UNREADABLE, set aside, as for every reader", async () => {
  fs.writeFileSync(SESSION, "{ not json");
  await refuses("SESSION_UNREADABLE");
  await refuses("LESSON_NOT_OPEN");
});

test("the refusal messages name no field or tool", () => {
  for (const code of ["LESSON_NOT_OPEN", "LESSON_ALREADY_ENDED"]) assert.doesNotMatch(MESSAGES[code], /[a-z]_[a-z]|`/, code);
});
