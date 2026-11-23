// Spec 014 T067 (contracts/ask-tools.md › note_said; FR-038, FR-044): the learner says how the steps
// went, and it's kept on the latest answer's asked entry, as theirs, in general terms. NO_ANSWER with
// no answer with steps in the session; a quiet saved: false when the record can't take it. Never a
// skill change, never After Effects.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "expressions", "comp1.json") }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
delete process.env.AE_MENTOR_RUNTIME;

const { TOOLS } = await import("../tools/index.mjs");
const { MESSAGES } = await import("../errors.mjs");
const session = await import("../lib/session.mjs");

const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");
const EDITS = path.join(home, "fixture-edits.json");
const tool = (name) => TOOLS.find((t) => t.name === name).handler;
const call = async (name, args) => JSON.parse((await tool(name)(args)).content[0].text);
const refuses = (args, code) => assert.rejects(() => tool("note_said")(args), (e) => e.code === code, code);

const answer = () => ({
  kind: "answer",
  explanation: "In Comp 1, rock.png rides on Shake Control, a null moved by expressions.",
  steps: [
    { text: "Select Shake Control (the null, not a letter) and Pan Behind its pivot to where the hammer hits.", skill: "transform.anchor", layer: "Shake Control" },
    { text: "Play it back and watch the turn.", skill: null, layer: null },
  ],
  offered_skills: [],
  closing_offer: "Try them?",
  goal: "a shake that turns from where it's hit",
});

beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f.startsWith("session.json") || f.startsWith("learner.json") || f === "fixture-edits.json") fs.rmSync(path.join(home, f));
});

test("note_said is registered with one text input and no AE annotation that reads as read-only", () => {
  const t = TOOLS.find((x) => x.name === "note_said");
  assert.ok(t);
  assert.deepEqual(t.inputSchema.required, ["said"]);
  assert.deepEqual(Object.keys(t.inputSchema.properties), ["said"]);
});

test("after an answer: said lands on that answer's entry, as given, and nothing else changes", async () => {
  await call("give_answer", answer());
  const before = JSON.parse(fs.readFileSync(LEARNER, "utf8"));
  const r = await call("note_said", { said: "said the steps worked" });
  assert.deepEqual(r, { saved: true });
  const after = JSON.parse(fs.readFileSync(LEARNER, "utf8"));
  assert.equal(after.asked[0].said, "said the steps worked");
  assert.deepEqual(after.skills, before.skills);
  assert.deepEqual(after.lessons, before.lessons);
  assert.deepEqual({ ...after.asked[0], said: undefined }, { ...before.asked[0], said: undefined });
  assert.equal(fs.existsSync(EDITS), false, "nothing in After Effects");
});

test("only the latest answer's entry: a second answer takes the next said", async () => {
  await call("give_answer", answer());
  const second = answer();
  second.steps[1] = { text: "Play it back and watch the hits.", skill: null, layer: null };
  await call("give_answer", { ...second, goal: "a softer landing" });
  await call("note_said", { said: "said step 1 didn't help" });
  const [a, b] = JSON.parse(fs.readFileSync(LEARNER, "utf8")).asked;
  assert.equal(a.said, undefined);
  assert.equal(b.said, "said step 1 didn't help");
});

test("NO_ANSWER: no answer in the session, a lapsed one, or the latest has no steps (describe, howto)", async () => {
  await refuses({ said: "said it worked" }, "NO_ANSWER");
  session.saveAnswer({ comp_id: 1, project: "Comp 1.aep", comp: "Comp 1", kind: "answer", steps: [], offered_skills: [], goal: "g", entry_date: "2026-01-01T00:00:00.000Z" }, { now: Date.now() - 4 * 3600 * 1000 });
  await refuses({ said: "said it worked" }, "NO_ANSWER");
  await call("give_answer", { kind: "describe", explanation: "In Comp 1, Sweep Control is a null.", steps: [], offered_skills: [], closing_offer: "Want to know what moves it?" });
  await refuses({ said: "said it worked" }, "NO_ANSWER");
  assert.equal(MESSAGES.NO_ANSWER, "There's no answer in this session yet.");
});

test("the text is checked: general terms, 120 characters at most, no personal details (FR-044)", async () => {
  await call("give_answer", answer());
  await refuses({ said: "" }, "SAID_NOT_GENERAL");
  await refuses({ said: "z".repeat(121) }, "SAID_NOT_GENERAL");
  await refuses({ said: 4 }, "SAID_NOT_GENERAL");
  await refuses({ said: "said to email jo@example.com" }, "UNSAFE_RECORD");
  // T081 review (FR-045): no expression or error text, no backticks, no IDs.
  await refuses({ said: "said wiggle(2,30) still errors" }, "NOT_PLAIN_WORDS");
  await refuses({ said: "said `value` was off" }, "NOT_PLAIN_WORDS");
  await refuses({ said: "said transform.anchor helped" }, "NOT_PLAIN_WORDS");
  assert.equal(JSON.parse(fs.readFileSync(LEARNER, "utf8")).asked[0].said, undefined);
  for (const code of ["SAID_NOT_GENERAL"]) assert.doesNotMatch(MESSAGES[code], /_|said:|`/, "no field names in the message");
});

test("the record can't take it: saved false, quietly, and an unreadable record is left as it is", async () => {
  await call("give_answer", answer());
  fs.writeFileSync(LEARNER, "{ broken");
  assert.deepEqual(await call("note_said", { said: "said it worked" }), { saved: false });
  assert.equal(fs.readFileSync(LEARNER, "utf8"), "{ broken");
  fs.writeFileSync(LEARNER, JSON.stringify({ version: 1, skills: {}, lessons: [] }));
  assert.deepEqual(await call("note_said", { said: "said it worked" }), { saved: false }, "the entry is gone");
  assert.ok(fs.existsSync(SESSION));
});
