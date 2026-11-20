// Spec 014 T043 (contracts/ask-tools.md › go_deeper, research R5): go_deeper in fixture mode on spec
// 015's live Comp 1 capture. Each refusal (NOT_ON_THIS_RUNTIME on B1, NO_ANSWER, NOT_OFFERED,
// OFFER_NOT_READY, ROUTE_TO_PIVOT, and the build's WRONG_STEP), with nothing saved; on A, the hand-in
// saved with no learner words, and the reply's practice and missing prerequisite from the record and
// the path. Read-only for After Effects.

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const use = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
const COMP1 = path.join(FIXTURES, "expressions", "comp1.json");
use(COMP1);
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { TOOLS } = await import("../tools/index.mjs");
const askModule = await import("../tools/ask.mjs");
const session = await import("../lib/session.mjs");
const { MESSAGES } = await import("../errors.mjs");

const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");
const EDITS = path.join(home, "fixture-edits.json");
const give = TOOLS.find((t) => t.name === "give_answer").handler;
const deeper = TOOLS.find((t) => t.name === "go_deeper").handler;
const callGive = async (args) => JSON.parse((await give(args)).content[0].text);
const call = async (args) => JSON.parse((await deeper(args)).content[0].text);
const refuses = (args, code) => assert.rejects(() => deeper(args), (e) => e.code === code, code);
const onDisk = () => JSON.parse(fs.readFileSync(SESSION, "utf8"));

const reads = [];
const realTake = askModule.io.takeSnapshot;
beforeEach(() => {
  reads.length = 0;
  askModule.io.takeSnapshot = async (opts) => { reads.push(opts === undefined ? "default" : opts); return realTake(opts); };
  for (const f of fs.readdirSync(home)) if (f.startsWith("session.json") || f === "learner.json" || f === "fixture-edits.json") fs.rmSync(path.join(home, f));
  use(COMP1);
  process.env.AE_MENTOR_RUNTIME = "a";
});
afterEach(() => { askModule.io.takeSnapshot = realTake; delete process.env.AE_MENTOR_RUNTIME; });

// TD § 16, as data (lines copied whole).
const td16 = () => ({
  kind: "answer",
  explanation: "In Comp 1, rock.png rides on Shake Control, a null moved by expressions:\n- All three hits are the same size.\n- Rotation moves the rock about 9 px at most, near 2.6 s.",
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

const record = (skills) => fs.writeFileSync(LEARNER, JSON.stringify({ version: 1, skills, lessons: [] }));
const learned = { status: "learned", last_practiced: "2026-11-10T18:00:00.000Z", times_passed: 1, next: "x", review_due: "2026-11-30", reviews_passed_in_row: 1 };

test("registered beside give_answer, with skill required and nothing that changes After Effects", () => {
  const t = TOOLS.find((x) => x.name === "go_deeper");
  assert.deepEqual(t.inputSchema.required, ["skill"]);
  assert.deepEqual(Object.keys(t.inputSchema.properties), ["skill", "step", "place_named"]);
  assert.equal(askModule.SKILLS, undefined);
  assert.equal(askModule.FINDERS, undefined);
});

test("on A, the Comp 1 answer's yes: the hand-in is saved with the step, the layer and no learner words", async () => {
  await callGive(td16());
  const r = await call({ skill: "Set the pivot", step: 3, place_named: true });
  assert.deepEqual(r, { skill_name: "Set the pivot (anchor point)", short_name: "Set the pivot", command_skill: "anchor-mentor", practice: false, missing_prerequisite: null });
  const h = onDisk().hand_in;
  assert.equal(h.skill, "transform.anchor");
  assert.equal(h.comp_id, 1);
  assert.equal(h.layer, "Shake Control");
  assert.equal(h.step_number, 3);
  assert.equal(h.steps.length, 4);
  assert.equal(h.goal, "a shake that turns from where it's hit");
  assert.equal(h.place_named, true);
  assert.equal(h.used, false);
  assert.deepEqual(Object.keys(h).sort(), ["at", "comp_id", "goal", "layer", "place_named", "skill", "step_number", "steps", "used"]);
  const askSteps = onDisk().ask.steps;
  assert.deepEqual(h.steps, askSteps, "the answer's own lines, nothing more");
});

test("the step may be left out when one step has the skill; place_named defaults to false", async () => {
  await callGive(td16());
  await call({ skill: "transform.anchor" });
  assert.equal(onDisk().hand_in.step_number, 3);
  assert.equal(onDisk().hand_in.place_named, false);
});

test("WRONG_STEP: a step that doesn't use the skill, or none named when two do; nothing saved", async () => {
  await callGive(td16());
  await refuses({ skill: "transform.anchor", step: 1 }, "WRONG_STEP");
  await refuses({ skill: "transform.anchor", step: 9 }, "WRONG_STEP");
  const two = td16();
  two.steps[1] = { text: "Select rock.png and Pan Behind its pivot to the rock's corner.", skill: "transform.anchor", layer: "rock.png" };
  await callGive(two);
  await refuses({ skill: "transform.anchor" }, "WRONG_STEP");
  assert.equal(onDisk().hand_in, undefined);
  assert.equal((await call({ skill: "transform.anchor", step: 2 })).command_skill, "anchor-mentor");
  assert.equal(onDisk().hand_in.layer, "rock.png");
});

test("B1: NOT_ON_THIS_RUNTIME before anything else, and nothing saved", async () => {
  await callGive(td16());
  delete process.env.AE_MENTOR_RUNTIME;
  await refuses({ skill: "transform.anchor", step: 3 }, "NOT_ON_THIS_RUNTIME");
  process.env.AE_MENTOR_RUNTIME = "b1";
  await refuses({ skill: "transform.anchor", step: 3 }, "NOT_ON_THIS_RUNTIME");
  assert.equal(onDisk().hand_in, undefined);
});

test("NO_ANSWER: no answer in the session, or one from before the window", async () => {
  await refuses({ skill: "transform.anchor" }, "NO_ANSWER");
  session.saveAnswer({ comp_id: 1, project: "Comp 1.aep", comp: "Comp 1", kind: "answer", steps: td16().steps, offered_skills: ["transform.anchor"], goal: null }, { now: Date.now() - 4 * 3600 * 1000 });
  await refuses({ skill: "transform.anchor" }, "NO_ANSWER");
});

test("NOT_OFFERED: a skill the answer didn't offer, a step's tag that wasn't offered, not-taught, or a name that isn't a skill", async () => {
  await callGive({ ...td16(), offered_skills: [], closing_offer: "Try them?" });
  await refuses({ skill: "transform.anchor", step: 3 }, "NOT_OFFERED");
  await callGive(td16());
  await refuses({ skill: "parenting.null" }, "NOT_OFFERED");
  await refuses({ skill: "not_taught" }, "NOT_OFFERED");
  await refuses({ skill: "Pivot lessons" }, "NOT_OFFERED");
  assert.equal(onDisk().hand_in, undefined);
});

test("OFFER_NOT_READY: an offer saved for a lesson that can't take a hand-in (saved on B1, say) is refused on A", async () => {
  // Phase 3: all six take one (R13), so the guard is shown with one finder's flag turned off.
  const { FINDERS } = await import("../tools/index.mjs");
  FINDERS["easing.speed_graph"].hand_in = false;
  try {
    session.saveAnswer({ comp_id: 1, project: "p", comp: "Comp 1", kind: "howto", steps: [], offered_skills: ["easing.speed_graph"], goal: null });
    await refuses({ skill: "easing.speed_graph" }, "OFFER_NOT_READY");
    assert.equal(onDisk().hand_in, undefined);
  } finally {
    FINDERS["easing.speed_graph"].hand_in = true;
  }
});

test("a how-to's yes hands in no layer and no step (PQ-4)", async () => {
  session.saveAnswer({ comp_id: null, project: null, comp: null, kind: "howto", steps: [], offered_skills: ["transform.anchor"], goal: null });
  const r = await call({ skill: "transform.anchor" });
  assert.equal(r.command_skill, "anchor-mentor");
  const h = onDisk().hand_in;
  assert.equal(h.layer, null);
  assert.equal(h.step_number, null);
  assert.equal(h.comp_id, null);
  assert.deepEqual(reads, [], "a pivot hand-in reads nothing");
});

test("ROUTE_TO_PIVOT: Group with a null on a null that already carries children, read on the comp now", async () => {
  // As if saved before the comp changed: give_answer itself refuses this offer on Comp 1.
  session.saveAnswer({
    comp_id: 1, project: "Comp 1.aep", comp: "Comp 1", kind: "answer", goal: null, offered_skills: ["parenting.null"],
    steps: [{ text: "Select Shake Control and parent the letters to it.", skill: "parenting.null", layer: "Shake Control" }],
  });
  await refuses({ skill: "Group with a null" }, "ROUTE_TO_PIVOT");
  assert.deepEqual(reads, ["default"]);
  assert.equal(onDisk().hand_in, undefined);
});

test("Group with a null on a layer that isn't a null: saved, with the missing prerequisite named from the path", async () => {
  session.saveAnswer({
    comp_id: 1, project: "Comp 1.aep", comp: "Comp 1", kind: "answer", goal: "the rock and its outline move as one", offered_skills: ["parenting.null"],
    steps: [{ text: "Add a null and parent rock.png and outline.png to it.", skill: "parenting.null", layer: "outline.png" }],
  });
  const r = await call({ skill: "parenting.null" });
  assert.deepEqual(r, { skill_name: "Move a group with a null", short_name: "Group with a null", command_skill: "null-parenting-mentor", practice: false, missing_prerequisite: "Set the pivot (anchor point)" });
  record({ "transform.anchor": learned });
  assert.equal((await call({ skill: "parenting.null" })).missing_prerequisite, null);
});

test("practice: true when the record has the skill learned (FR-023); an unreadable record names no prerequisite", async () => {
  await callGive(td16());
  record({ "transform.anchor": learned });
  assert.equal((await call({ skill: "transform.anchor" })).practice, true);
  fs.writeFileSync(LEARNER, "{ broken");
  const r = await call({ skill: "transform.anchor" });
  assert.equal(r.practice, false);
  assert.equal(r.missing_prerequisite, null);
});

test("read-only: no fixture edit; the record gains only the answer's asked entry, marked went deeper (phase 3)", async () => {
  await callGive(td16());
  await call({ skill: "transform.anchor" });
  assert.equal(fs.existsSync(EDITS), false);
  const rec = JSON.parse(fs.readFileSync(LEARNER, "utf8"));
  assert.deepEqual(rec.skills, {});
  assert.deepEqual(rec.lessons, []);
  assert.equal(rec.asked.length, 1);
  assert.equal(rec.asked[0].went_deeper, "transform.anchor");
});

test("the refusal messages are data-model § 8's, with no field names", () => {
  assert.equal(MESSAGES.NOT_OFFERED, "Only a skill the last answer offered can start from it.");
  assert.equal(MESSAGES.NOT_ON_THIS_RUNTIME, "The lesson can't start from here. Say so in one sentence and name where to start it.");
  assert.equal(MESSAGES.NO_ANSWER, "There's no answer in this session yet.");
  for (const code of ["NOT_OFFERED", "NOT_ON_THIS_RUNTIME", "NO_ANSWER", "WRONG_STEP", "OFFER_NOT_READY", "ROUTE_TO_PIVOT"]) {
    assert.doesNotMatch(MESSAGES[code], /[a-z]_[a-z]|`/, code);
  }
});
