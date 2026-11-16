// Spec 015 T029 (FR-020, OQ-7): record_lesson refuses a summary or next that holds 24 or more
// characters copied from an expression's text or error in the lesson's snapshot (the live 015 Rig
// and 015 Planted captures), with a plain message, and saves as before otherwise.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "expressions", "rig.json") }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { commonTools, copiesExpression, COPY_RUN } = await import("../tools/common.mjs");
const session = await import("../lib/session.mjs");
const { MESSAGES } = await import("../errors.mjs");

const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", `${name}.json`), "utf8"));
const RIG = load("rig");
const PLANTED = load("planted");
const TOOLS = commonTools({ skills: ["easing.basic"], finders: {} });
const record = (over) => TOOLS.find((t) => t.name === "record_lesson").handler({
  skill: "easing.basic", project: "Practice.aep", comp: "Rig", attempted: "Eased the sweep", result: "passed", demo_used: false,
  summary: "Eased both keys of the sweep.", next: "Try a longer move.", ...over,
});
const FILE = path.join(home, "learner.json");
const SHAKE = RIG.expressions.find((x) => x.path.endsWith("ADBE Position")).text;

beforeEach(() => {
  fs.rmSync(FILE, { force: true });
  fs.rmSync(path.join(home, "session.json"), { force: true });
});

test(`a summary with ${COPY_RUN} characters copied from an expression is refused, and nothing is written`, async () => {
  session.start(RIG);
  session.markChecked(true);
  const run = SHAKE.slice(SHAKE.indexOf("impacts ="), SHAKE.indexOf("impacts =") + COPY_RUN);
  assert.equal(run.length, COPY_RUN);
  await assert.rejects(record({ summary: `The null runs ${run} on its Position.` }), (e) => e.code === "RECORD_HAS_EXPRESSION");
  await assert.rejects(record({ next: `Look at ${run}` }), (e) => e.code === "RECORD_HAS_EXPRESSION");
  await assert.rejects(record({ attempted: `Eased ${run}` }), (e) => e.code === "RECORD_HAS_EXPRESSION", "review S5: attempted too");
  assert.equal(fs.existsSync(FILE), false);
});

test("one character short of the run is saved; a copy with its line breaks reflowed is still caught", async () => {
  session.start(RIG);
  session.markChecked(true);
  const short = SHAKE.slice(SHAKE.indexOf("impacts ="), SHAKE.indexOf("impacts =") + COPY_RUN - 1);
  const saved = JSON.parse((await record({ summary: `Shake uses "${short}".` })).content[0].text);
  assert.equal(saved.saved, true);
  const start = SHAKE.indexOf("offset += [");
  const reflowed = SHAKE.slice(start, start + 60).replace(/\s+/g, " ");
  assert.equal(copiesExpression(`See ${reflowed}`, RIG), true);
});

test("an error's text is guarded too (015 Planted's erroring expression)", () => {
  const err = PLANTED.expressions.find((x) => x.error).error;
  assert.equal(copiesExpression(`It said: ${err.slice(0, 40)}`, PLANTED), true);
  assert.equal(copiesExpression("The expression on that layer has an error.", PLANTED), false);
});

test("a lesson snapshot from before spec 015 has nothing to guard; plain summaries always pass", () => {
  const old = structuredClone(RIG);
  delete old.expressions;
  assert.equal(copiesExpression(SHAKE.slice(0, 80), old), false);
  assert.equal(copiesExpression("Eased Sweep Control's two keys; the null shakes by itself.", RIG), false);
});

test("the message is plain: no field or code names", () => {
  const m = MESSAGES.RECORD_HAS_EXPRESSION;
  assert.ok(m);
  assert.doesNotMatch(m, /_|summary|next\b|record_lesson/);
});
