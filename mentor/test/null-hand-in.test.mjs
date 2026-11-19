// Spec 014 T046 (contracts/hand-in.md › Per skill, K6): Group with a null from a hand-in, in fixture
// mode. The hand-in's group (the step's layer and every other layer the step names) becomes the
// focus with no intent question; a group the lesson can't take is refused as usual and the lesson
// keeps its hand-in; a later call keeps it; no hand-in leaves the reply as it was; a lost layer is
// hand_in_lost. Nothing here touches After Effects.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";
import { where } from "./fixtures/null-parenting/load.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");
const use = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
const PRACTICE = where("practice2b.json");
const COMP1 = path.join(FIXTURES, "expressions", "comp1.json");
use(PRACTICE);
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { TOOLS } = await import("../tools/index.mjs");
const session = await import("../lib/session.mjs");
const call = async (args = {}) => JSON.parse((await TOOLS.find((t) => t.name === "null_parent_snapshot").handler(args)).content[0].text);
const SNAP = JSON.parse(fs.readFileSync(PRACTICE, "utf8"));
const COMP1_ID = JSON.parse(fs.readFileSync(COMP1, "utf8")).comp.id;

const STEP = { text: "Add a null where the group turns, and parent Caption and Stamp to it with Tile.", skill: "parenting.null", layer: "Tile" };
const handIn = (over = {}) => session.saveHandIn({ skill: "parenting.null", comp_id: SNAP.comp.id, layer: "Tile", step_number: 1, steps: [STEP, { text: "Play it back.", skill: null, layer: null }], goal: "move the card as one", place_named: false, ...over });

beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f.startsWith("session.json") || f.startsWith("learner.json")) fs.rmSync(path.join(home, f));
  use(PRACTICE);
});

test("the hand-in's group is the focus: the step's layer, then the layers it names, in the comp's order; no proposal asked", async () => {
  handIn();
  const r = await call();
  assert.equal(r.mode, "lesson");
  assert.equal(r.mode_source, "hand_in");
  assert.equal(r.focus_set, true);
  assert.deepEqual([...r.focus].sort(), ["Caption", "Stamp", "Tile"]);
  assert.deepEqual(r.hand_in, { layer: "Tile", step_number: 1, steps_after: ["Play it back."], place_named: false, practice: false });
  const lesson = Object.values(JSON.parse(fs.readFileSync(SESSION, "utf8")).lessons)[0];
  assert.deepEqual(lesson.hand_in, { layer: "Tile", step_number: 1, steps: [STEP.text, "Play it back."], place_named: false });
});

test("a later call keeps the lesson's hand-in, and a changed focus (a fresh restart) keeps it too", async () => {
  handIn();
  await call();
  const again = await call();
  assert.equal(again.mode_source, "in_progress");
  assert.equal(again.hand_in.step_number, 1);
  const changed = await call({ skill_options: { focus: ["Tile", "Caption"] } });
  assert.equal(changed.focus_set, true);
  assert.equal(changed.hand_in.layer, "Tile");
});

test("a learned null skill: practice, still a lesson", async () => {
  fs.writeFileSync(LEARNER, JSON.stringify({ version: 1, lessons: [], skills: { "parenting.null": { status: "learned", last_practiced: "2026-11-01T18:00:00.000Z", times_passed: 1, next: "x", review_due: "2026-11-02", reviews_passed_in_row: 1 } } }));
  handIn();
  const r = await call();
  assert.equal(r.mode, "lesson");
  assert.equal(r.hand_in.practice, true);
});

test("a group the lesson refuses (a layer already parented) is said as usual, and the lesson keeps its hand-in", async () => {
  use(COMP1);
  session.saveHandIn({ skill: "parenting.null", comp_id: COMP1_ID, layer: "outline.png", step_number: 1, goal: null, place_named: false,
    steps: [{ text: "Add a null and parent rock.png and outline.png to it.", skill: "parenting.null", layer: "outline.png" }] });
  const r = await call();
  assert.equal(r.focus_set, false);
  assert.equal(r.mode_source, "hand_in");
  assert.deepEqual(r.focus_tried, ["outline.png", "rock.png"]);
  assert.ok(r.refused.some((x) => x.layer === "rock.png"));
  assert.equal(r.hand_in.layer, "outline.png");
  const lesson = Object.values(JSON.parse(fs.readFileSync(SESSION, "utf8")).lessons)[0];
  assert.equal(lesson.hand_in.layer, "outline.png");
});

test("the hand-in's layer gone: hand_in_lost, and the lesson opens as from Skills", async () => {
  handIn({ layer: "Old Tile" });
  const r = await call();
  assert.equal(r.mode_source, "hand_in_lost");
  assert.equal(r.focus, null);
  assert.equal(r.hand_in.layer, "Old Tile");
});

test("no hand-in: the reply has no hand_in field", async () => {
  const r = await call();
  assert.equal("hand_in" in r, false);
  assert.equal(r.mode_source, "default");
});
