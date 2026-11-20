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
  // Phase 2 (R13): pivot and null take a hand-in; the other four wait for phase 3.
  assert.deepEqual(Object.keys(FINDERS).filter((id) => FINDERS[id].hand_in === true).sort(), ["parenting.null", "transform.anchor"]);
});

test(`reply shape on B1 (${LIVE ? "live" : "derived"} Comp 1): the accepted fields plus comp, runtime and tags; no offer`, async () => {
  const r = await call(td16());
  const { goal, ...shown } = td16();
  assert.deepEqual(r, { ...shown, comp: "Comp 1", offered_skills: [], runtime: "b1", tags: { "transform.anchor": "Set the pivot" }, done: askModule.DONE });
  assert.equal(goal.length > 0, true);
  assert.deepEqual(Object.keys(r), ["kind", "comp", "explanation", "steps", "offered_skills", "closing_offer", "runtime", "tags", "done"], "short: no read data echoed");
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
    goal: "a softer landing",
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
  // Phase 3: the asked entry it wrote (FR-038), by its date.
  const entry = JSON.parse(fs.readFileSync(LEARNER, "utf8")).asked.find((e) => e.date === ask.entry_date);
  assert.ok(entry, "linked to the record's asked entry");
});

test("on A, an offer needs a lesson that takes a hand-in: Set the pivot does (phase 2), Speed graph doesn't yet; no offer is fine", async () => {
  process.env.AE_MENTOR_RUNTIME = "a";
  const r = await call(td16());
  assert.equal(r.runtime, "a");
  assert.deepEqual(r.offered_skills, ["transform.anchor"]);
  fs.rmSync(SESSION);
  use(PRACTICE);
  await refuses({
    kind: "answer",
    explanation: "In Mentor Practice, Title moves on its own Position keys.",
    steps: [{ text: "Select Title's last two Position keys and open the speed graph.", skill: "Speed graph", layer: "Title" }],
    offered_skills: ["easing.speed_graph"],
    closing_offer: "Try it, or want to go deeper with *Speed graph*?",
  }, "OFFER_NOT_READY");
  assert.equal(fs.existsSync(SESSION), false, "a refusal saves nothing");
  use(COMP1);
  const none = await call({ ...td16(), offered_skills: [], closing_offer: "Try them?" });
  assert.deepEqual(none.offered_skills, []);
});

test("read-only: one default snapshot, no other snippet, no edits; the record gains only an asked entry for the answer (phase 3)", async () => {
  await call(td16());
  await call({ kind: "describe", explanation: "In Comp 1, Sweep Control is a null whose Position drives the Center of the CC Light Sweep on Black Solid 1.", steps: [], offered_skills: [], closing_offer: "Want to know what moves Sweep Control?" });
  assert.deepEqual(reads, ["default", "default"]);
  assert.equal(fs.existsSync(EDITS), false, "no fixture edit, so nothing in the project changed");
  const rec = JSON.parse(fs.readFileSync(LEARNER, "utf8"));
  assert.deepEqual(rec.skills, {}, "no skill state");
  assert.deepEqual(rec.lessons, [], "no lesson");
  assert.equal(rec.asked.length, 1, "one entry for the answer, none for the describe");
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
  assert.deepEqual(r, { kind: "no_comp", comp: null, explanation: "No comp is open. Open one, or click into its timeline, then ask again.", steps: [], offered_skills: [], closing_offer: null, runtime: "b1", tags: {}, done: askModule.DONE });
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
  // Phase 3: an answer with steps needs a goal, since its asked entry keeps it (contracts/ask-tools.md).
  await refuses({ ...td16(), goal: undefined }, "GOAL_NOT_GENERAL");
  await refuses({ ...td16(), goal: "x".repeat(121) }, "GOAL_NOT_GENERAL");
  await refuses({ ...td16(), goal: "a cc light sweep across the logo" }, "GOAL_NOT_GENERAL");
  assert.equal(fs.existsSync(SESSION), false);
  // Kinds with no entry still don't need one.
  const d = await call({ kind: "describe", explanation: "In Comp 1, Sweep Control is a null.", steps: [], offered_skills: [], closing_offer: "Want to know what moves it?" });
  assert.equal(d.kind, "describe");
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

test("review S5: a comp switched since the read is refused with a message that says it changed and names the open comp", async () => {
  use(PRACTICE);
  await assert.rejects(() => handler(td16()), (e) => {
    assert.equal(e.code, "COMP_NOT_NAMED");
    assert.match(e.message, /The comp open now is Mentor Practice/);
    assert.match(e.message, /changed/);
    assert.doesNotMatch(e.message, /[a-z]_[a-z]/);
    return true;
  });
});

test("eval fix (a): every accepted reply ends with a plain done note that's safe for the learner to read", async () => {
  const r = await call(td16());
  assert.equal(r.done, askModule.DONE);
  assert.match(r.done, /finished: write nothing more\.$/);
  assert.doesNotMatch(r.done, /[_`]|give_answer|panel|tool/i, "no tool names, fields or panel talk");
});

test("eval fix (b): the schema says the closing is required for answer, describe, howto and outside", () => {
  const d = TOOLS.find((t) => t.name === "give_answer").inputSchema.properties.closing_offer.description;
  assert.match(d, /Required for answer, describe, howto and outside; null only for clarify and no_comp\./);
});

// ---- Spec 014 T066 (FR-038 to FR-041): give_answer writes one asked entry for kind answer only.

const recordWith = (skills) => fs.writeFileSync(LEARNER, JSON.stringify({ version: 1, skills, lessons: [] }));

test("T066: an answer writes one asked entry from the tool's read; after_learning from the record; no skill state changes", async () => {
  const skills = { "transform.anchor": { status: "learned", last_practiced: "2026-11-10T10:00:00.000Z", times_passed: 1, next: "n", review_due: "2026-11-30", reviews_passed_in_row: 1 } };
  recordWith(skills);
  await call({ ...td16(), comp: "Other" });
  const rec = JSON.parse(fs.readFileSync(LEARNER, "utf8"));
  assert.deepEqual(rec.skills, skills, "FR-039: status, times passed, review date, reviews in a row unchanged");
  assert.deepEqual(rec.lessons, []);
  assert.equal(rec.asked.length, 1);
  const e = rec.asked[0];
  assert.equal(e.project, "Comp 1.aep");
  assert.equal(e.comp, "Comp 1", "from the read, never the input");
  assert.deepEqual(e.layers, ["Shake Control"]);
  assert.equal(e.goal, "a shake that turns from where it's hit");
  assert.deepEqual(e.skills, ["transform.anchor"], "skill IDs only: no not-taught, no untagged");
  assert.deepEqual(e.after_learning, ["transform.anchor"]);
  assert.equal(e.went_deeper, null);
  assert.equal("said" in e, false);
  assert.equal(JSON.parse(fs.readFileSync(SESSION, "utf8")).ask.entry_date, e.date);
});

test("T066: describe, howto, clarify, outside and no_comp write no entry; a refusal writes none", async () => {
  await refuses({ ...td16(), goal: undefined }, "GOAL_NOT_GENERAL");
  await call({ kind: "describe", explanation: "In Comp 1, Sweep Control is a null.", steps: [], offered_skills: [], closing_offer: "Want to know what moves it?" });
  await call({ kind: "howto", explanation: "The speed graph shows how fast a property changes.", steps: [], offered_skills: [], closing_offer: "Want to learn it on one of your layers?" });
  await call({ kind: "outside", explanation: "Render settings are outside what I cover.", steps: [], offered_skills: [], closing_offer: "Want to ask about how something in your comp moves?" });
  assert.equal(fs.existsSync(LEARNER), false);
});

test("T066: the entry never holds the learner's question or expression text (FR-040, FR-045)", async () => {
  await call(td16());
  const text = fs.readFileSync(LEARNER, "utf8");
  assert.doesNotMatch(text, /thisComp|wiggle|Math\.|amps/);
  assert.doesNotMatch(text, /explanation|closing_offer|Pan Behind/, "no answer text either: the goal and names only");
});

test("T066: an unreadable record doesn't block the answer; it's left as it is and the answer has no entry", async () => {
  fs.writeFileSync(LEARNER, "{ broken");
  const r = await call(td16());
  assert.equal(r.kind, "answer");
  assert.equal(fs.readFileSync(LEARNER, "utf8"), "{ broken");
  assert.equal(JSON.parse(fs.readFileSync(SESSION, "utf8")).ask.entry_date, null);
});

test("T066: go_deeper sets went_deeper on the answer's entry", async () => {
  process.env.AE_MENTOR_RUNTIME = "a";
  await call(td16());
  const go = TOOLS.find((t) => t.name === "go_deeper").handler;
  await go({ skill: "transform.anchor" });
  assert.equal(JSON.parse(fs.readFileSync(LEARNER, "utf8")).asked[0].went_deeper, "transform.anchor");
});

test("T066: read_learner_record leaves asked entries out (FR-041, FR-043); a record without them reads as before", async () => {
  await call(td16());
  const read = TOOLS.find((t) => t.name === "read_learner_record").handler;
  const r = JSON.parse((await read({})).content[0].text);
  assert.equal("asked" in r, false);
  assert.ok(Array.isArray(r.lessons));
});
