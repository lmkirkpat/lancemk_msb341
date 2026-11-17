// Spec 014 T013 (contracts/ask-tools.md): give_answer in fixture mode on spec 015's live Comp 1 capture.
// The reply's shape; the comp from the tool's own read, never the input; tags from path.json; the
// session's ask block; read-only for After Effects (a stand-in bridge sees only snapshot reads); no
// learner record write in phase 1; NO_ACTIVE_COMP from the read gives a valid no_comp answer.

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const use = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
const COMP1 = path.join(FIXTURES, "expressions", "comp1.json");
const PRACTICE = path.join(FIXTURES, "expressions", "practice.json");
use(COMP1);
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
delete process.env.AE_MENTOR_RUNTIME;

const { LIVE } = await import("./fixtures/expressions/comp1.mjs");
const { TOOLS, SKILLS, FINDERS } = await import("../tools/index.mjs");
const askModule = await import("../tools/ask.mjs");
const { shortName } = await import("../lib/path.mjs");
const { MentorError } = await import("../errors.mjs");

const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");
const EDITS = path.join(home, "fixture-edits.json");
const handler = TOOLS.find((t) => t.name === "give_answer").handler;
const call = async (args) => JSON.parse((await handler(args)).content[0].text);
const refuses = (args, code) => assert.rejects(() => handler(args), (e) => e.code === code, code);

// The stand-in bridge: every read give_answer asks for goes through io.takeSnapshot, recorded here.
const reads = [];
const realTake = askModule.io.takeSnapshot;
beforeEach(() => {
  reads.length = 0;
  askModule.io.takeSnapshot = async (opts) => { reads.push(opts === undefined ? "default" : opts); return realTake(opts); };
  for (const f of fs.readdirSync(home)) if (f.startsWith("session.json") || f === "learner.json" || f === "fixture-edits.json") fs.rmSync(path.join(home, f));
  use(COMP1);
  delete process.env.AE_MENTOR_RUNTIME;
});
afterEach(() => { askModule.io.takeSnapshot = realTake; });

// TD § 16, as data (lines copied whole).
const td16 = () => ({
  kind: "answer",
  explanation: "In Comp 1, rock.png rides on Shake Control, a null moved by expressions:\n- All three hits are the same size.\n- Rotation moves the rock about 9 px at most, gone in about 1/3 s.\n- The turn centers on the rock, where Shake Control sits.",
  steps: [
    { text: "Open Shake Control's Position expression and look at how it sets each hit's size: it uses the first hit's size for all three. Not something I teach yet.", skill: "not_taught", layer: "Shake Control" },
    { text: "Open Shake Control's Rotation expression and look at its amounts: 0.75° at most. Not something I teach yet.", skill: "not_taught", layer: "Shake Control" },
    { text: "Select Shake Control (the null, not a letter) and Pan Behind its pivot to where the hammer hits.", skill: "transform.anchor", layer: "Shake Control" },
    { text: "Play it back and watch the turn.", skill: null, layer: null },
  ],
  offered_skills: ["transform.anchor"],
  closing_offer: "Try them, or want to go deeper on step 3 with *Set the pivot*?",
  goal: "a shake that turns from where it's hit",
});

test("give_answer is registered from its own file, with TOOLS only: no skill ID and no finder", () => {
  assert.ok(TOOLS.find((t) => t.name === "give_answer"));
  assert.equal(askModule.SKILLS, undefined);
  assert.equal(askModule.FINDERS, undefined);
  assert.ok(!SKILLS.some((s) => s.startsWith("ask")));
  assert.ok(!Object.values(FINDERS).some((f) => f.hand_in === true), "phase 1: no lesson takes a hand-in yet (R13)");
});

test(`reply shape on B1 (${LIVE ? "live" : "derived"} Comp 1): the accepted fields plus comp, runtime and tags; no offer`, async () => {
  const r = await call(td16());
  const { goal, ...shown } = td16();
  assert.deepEqual(r, { ...shown, comp: "Comp 1", offered_skills: [], runtime: "b1", tags: { "transform.anchor": "Set the pivot" } });
  assert.equal(goal.length > 0, true);
  assert.deepEqual(Object.keys(r), ["kind", "comp", "explanation", "steps", "offered_skills", "closing_offer", "runtime", "tags"], "short: no read data echoed");
});

test("comp comes from the tool's read, never the input; a switched comp is refused", async () => {
  assert.equal((await call({ ...td16(), comp: "Mentor Practice" })).comp, "Comp 1");
  use(PRACTICE);
  await refuses(td16(), "COMP_NOT_NAMED");
});

test("tags come from path.json's short names, for every tagged skill", async () => {
  const r = await call(td16());
  for (const [id, tag] of Object.entries(r.tags)) assert.equal(tag, shortName(id));
  use(PRACTICE);
  const softer = await call({
    kind: "answer",
    explanation: "In Mentor Practice, Title moves on its own Position keys.",
    steps: [{ text: "Select Title's last two Position keys and open the speed graph.", skill: "Speed graph", layer: "Title" }],
    offered_skills: ["easing.speed_graph"],
    closing_offer: "Try it, or want to go deeper with *Speed graph*?",
  });
  assert.deepEqual(softer.tags, { "easing.speed_graph": "Speed graph" });
  assert.equal(softer.steps[0].skill, "easing.speed_graph");
  assert.deepEqual(softer.offered_skills, []);
});

test("the session's ask block holds the checked offer and the goal, even on B1", async () => {
  await call(td16());
  const ask = JSON.parse(fs.readFileSync(SESSION, "utf8")).ask;
  assert.equal(ask.comp_id, 1);
  assert.equal(ask.project, "Comp 1.aep");
  assert.equal(ask.comp, "Comp 1");
  assert.equal(ask.kind, "answer");
  assert.deepEqual(ask.offered_skills, ["transform.anchor"]);
  assert.equal(ask.goal, "a shake that turns from where it's hit");
  assert.equal(ask.steps.length, 4);
  assert.equal(ask.entry_date, null);
});

test("on A, an offer needs a lesson that takes a hand-in: none does in phase 1, so it's refused; no offer is fine", async () => {
  process.env.AE_MENTOR_RUNTIME = "a";
  await refuses(td16(), "OFFER_NOT_READY");
  assert.equal(fs.existsSync(SESSION), false, "a refusal saves nothing");
  const r = await call({ ...td16(), offered_skills: [], closing_offer: "Try them?" });
  assert.equal(r.runtime, "a");
  assert.deepEqual(r.offered_skills, []);
});

test("read-only: one default snapshot, no other snippet, no edits, no learner record (phase 1)", async () => {
  await call(td16());
  await call({ kind: "describe", explanation: "In Comp 1, Sweep Control is a null whose Position drives the Center of the CC Light Sweep on Black Solid 1.", steps: [], offered_skills: [], closing_offer: "Want to know what moves Sweep Control?" });
  assert.deepEqual(reads, ["default", "default"]);
  assert.equal(fs.existsSync(EDITS), false, "no fixture edit, so nothing in the project changed");
  assert.equal(fs.existsSync(LEARNER), false, "no learner record write in phase 1");
  const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "tools", "ask.mjs"), "utf8");
  assert.doesNotMatch(src, /bridge-client|runSnippet|undo\s*:/, "no way into AE but the snapshot read");
});

test("howto and outside read nothing; their comp is null", async () => {
  const howto = await call({ kind: "howto", explanation: "The speed graph shows how fast a property changes between two keys.", steps: [], offered_skills: ["easing.speed_graph"], closing_offer: "Want to learn it on one of your layers?" });
  const outside = await call({ kind: "outside", explanation: "Render settings are outside what I cover; I help with how things move in your comp.", steps: [], offered_skills: [], closing_offer: "Want to ask about how something in your comp moves?" });
  assert.deepEqual(reads, []);
  assert.equal(howto.comp, null);
  assert.equal(outside.comp, null);
  const ask = JSON.parse(fs.readFileSync(SESSION, "utf8")).ask;
  assert.equal(ask.kind, "howto", "outside isn't saved; the howto is");
  assert.equal(ask.comp_id, null);
  assert.deepEqual(ask.offered_skills, ["easing.speed_graph"]);
});

test("NO_ACTIVE_COMP from the read gives a valid no_comp answer; any other kind gets the error", async () => {
  askModule.io.takeSnapshot = async () => { throw new MentorError("NO_ACTIVE_COMP"); };
  const r = await call({ kind: "no_comp", explanation: "No comp is open. Open one, or click into its timeline, then ask again.", steps: [], offered_skills: [], closing_offer: null });
  assert.deepEqual(r, { kind: "no_comp", comp: null, explanation: "No comp is open. Open one, or click into its timeline, then ask again.", steps: [], offered_skills: [], closing_offer: null, runtime: "b1", tags: {} });
  assert.equal(fs.existsSync(SESSION), false, "no_comp isn't saved");
  await refuses(td16(), "NO_ACTIVE_COMP");
});

test("no_comp with a comp open is refused; AE_UNREACHABLE stays an error", async () => {
  await refuses({ kind: "no_comp", explanation: "No comp is open.", steps: [], offered_skills: [], closing_offer: null }, "COMP_IS_OPEN");
  fs.writeFileSync(stateFile, JSON.stringify({ project: "unreachable" }));
  await refuses(td16(), "AE_UNREACHABLE");
  await refuses({ kind: "no_comp", explanation: "No comp is open.", steps: [], offered_skills: [], closing_offer: null }, "AE_UNREACHABLE");
});

test("goal is checked like a record field: no personal details, no copied expression text", async () => {
  await refuses({ ...td16(), goal: "shake for someone@example.com" }, "UNSAFE_RECORD");
  await refuses({ ...td16(), goal: "Rock shake with multiple impacts (Position + shared array)" }, "RECORD_HAS_EXPRESSION");
  assert.equal(fs.existsSync(SESSION), false);
  const r = await call({ ...td16(), goal: undefined });
  assert.equal(r.kind, "answer");
  assert.equal(JSON.parse(fs.readFileSync(SESSION, "utf8")).ask.goal, null);
});

test("an unreadable session file doesn't lose the answer: it's set aside and the answer is saved", async () => {
  fs.writeFileSync(SESSION, "{ not json");
  const r = await call(td16());
  assert.equal(r.comp, "Comp 1");
  assert.equal(JSON.parse(fs.readFileSync(SESSION, "utf8")).ask.comp, "Comp 1");
  assert.equal(fs.readdirSync(home).filter((f) => f.startsWith("session.json.unreadable-")).length, 1);
});

test("a refusal names the step and says what to fix, with no field names", async () => {
  const bad = td16();
  bad.steps[2] = { ...bad.steps[2], skill: "easing.basic" };
  bad.offered_skills = [];
  await assert.rejects(() => handler(bad), (e) => {
    assert.equal(e.code, "KEYFRAME_SKILL_ON_KEYLESS");
    assert.match(e.message, /^Step 3 is on Shake Control\. /);
    assert.doesNotMatch(e.message, /[a-z]_[a-z]/);
    return true;
  });
});
