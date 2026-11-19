// Spec 014 T047 (FR-026, contracts/hand-in.md › Hand-back, data-model § 4): record_lesson's reply
// carries hand_back for a lesson opened from an answer's step, with the next step's text, or null
// after the last; it's absent for every other lesson. In fixture mode on spec 015's Comp 1 capture,
// from give_answer to go_deeper to the pivot lesson. Nothing here touches After Effects.

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "expressions", "comp1.json") }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { TOOLS } = await import("../tools/index.mjs");
const { handBack } = await import("../tools/common.mjs");
const call = async (name, args = {}) => JSON.parse((await TOOLS.find((t) => t.name === name).handler(args)).content[0].text);

const LAST = "Play it back and watch the turn.";
const td16 = (pivotStep = 3) => {
  const steps = [
    { text: "Open Shake Control's Position expression and look at how it sets each hit's size: it uses the first hit's size for all three. Not something I teach yet.", skill: "not_taught", layer: "Shake Control" },
    { text: "Open Shake Control's Rotation expression and look at its amounts: 0.75° at most. Not something I teach yet.", skill: "not_taught", layer: "Shake Control" },
    { text: "Select Shake Control (the null, not a letter) and Pan Behind its pivot to where the hammer hits.", skill: "transform.anchor", layer: "Shake Control" },
    { text: LAST, skill: null, layer: null },
  ];
  if (pivotStep === 4) steps.push(steps.splice(2, 1)[0]);
  return {
    kind: "answer",
    explanation: "In Comp 1, rock.png rides on Shake Control, a null moved by expressions:\n- All three hits are the same size.\n- Rotation moves the rock about 9 px at most, near 2.6 s.",
    steps, offered_skills: ["transform.anchor"],
    closing_offer: `Try them, or want to go deeper on step ${pivotStep} with *Set the pivot*?`,
  };
};
const record = (over = {}) => ({ skill: "transform.anchor", project: "Comp 1.aep", comp: "Comp 1", attempted: "Set Shake Control's pivot where the hits land", result: "partial", demo_used: false, summary: "Tried once; the pivot hadn't moved yet.", next: "Set the null's pivot without its layers moving", ...over });

beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f.startsWith("session.json") || f.startsWith("learner.json")) fs.rmSync(path.join(home, f));
  process.env.AE_MENTOR_RUNTIME = "a";
});
afterEach(() => { delete process.env.AE_MENTOR_RUNTIME; });

async function lessonFromAnswer(answer, step) {
  await call("give_answer", answer);
  await call("go_deeper", { skill: "transform.anchor", step, place_named: true });
  await call("anchor_snapshot");
  await call("anchor_check");
}

test("a lesson from step 3 hands back to step 4, with its text", async () => {
  await lessonFromAnswer(td16(), 3);
  const r = await call("record_lesson", record());
  assert.equal(r.saved, true);
  assert.deepEqual(r.hand_back, { step_number: 3, next_step: LAST });
});

test("a lesson from the last step hands back with no next step", async () => {
  await lessonFromAnswer(td16(4), 4);
  const r = await call("record_lesson", record());
  assert.deepEqual(r.hand_back, { step_number: 4, next_step: null });
});

test("a lesson started from Skills has no hand_back; the reply is as before", async () => {
  await call("anchor_snapshot");
  await call("anchor_snapshot", { skill_options: { focus: [{ layer: "outline.png", place: "middle-left" }] } });
  const r = await call("record_lesson", record({ result: "not_checked", attempted: "Set outline.png's pivot to the middle of its left edge" }));
  assert.deepEqual(Object.keys(r), ["saved", "skill"]);
});

test("handBack: absent with no lesson, no hand-in, or a hand-in with no step (a how-to's)", () => {
  assert.deepEqual(handBack(null), {});
  assert.deepEqual(handBack({}), {});
  assert.deepEqual(handBack({ hand_in: { layer: null, step_number: null, steps: [] } }), {});
  assert.deepEqual(handBack({ hand_in: { layer: "x", step_number: 1, steps: ["a", "b"] } }), { hand_back: { step_number: 1, next_step: "b" } });
});
