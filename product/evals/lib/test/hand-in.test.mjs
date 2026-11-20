// The seeded hand-in a lesson-set case starts with (spec 014 T058): valid cases pass, bad ones are named,
// and the file it writes is one the mentor's own session code takes once, for its skill, on any comp.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handInProblems, handInSession, seedHandIn } from "../hand-in.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const GOOD = { skill: "transform.anchor", layer: "Shake Control", step_number: 2, steps: [{ text: "Look.", skill: "not_taught", layer: "Shake Control" }, { text: "Pan Behind.", skill: "transform.anchor", layer: "Shake Control" }] };

test("a hand-in with a skill, a layer, a step number and steps is valid; absent is fine", () => {
  assert.deepEqual(handInProblems(GOOD), []);
  assert.deepEqual(handInProblems(undefined), []);
});

test("each way a hand-in can be wrong is named", () => {
  assert.match(handInProblems({ ...GOOD, skill: "color.grade" })[0], /skill must be one of/);
  assert.match(handInProblems({ ...GOOD, step_number: 3 })[0], /past the last step/);
  assert.match(handInProblems({ ...GOOD, steps: [] })[0], /needs the answer's steps/);
  assert.match(handInProblems({ ...GOOD, layer: 4 })[0], /layer name or null/);
  assert.match(handInProblems(7)[0], /must be an object/);
});

test("the session holds one unused hand-in stamped with the run's clock", () => {
  const now = new Date("2026-11-19T18:00:00.000Z");
  const s = handInSession({ ...GOOD, place_named: true }, now);
  assert.equal(s.hand_in.at, now.toISOString());
  assert.equal(s.hand_in.used, false);
  assert.equal(s.hand_in.comp_id, null);
  assert.equal(s.hand_in.place_named, true);
  assert.equal(s.hand_in.goal, null);
});

test("the mentor's own session code takes it: for its skill, any comp, once", async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-"));
  process.env.AE_MENTOR_HOME = home;
  seedHandIn(home, GOOD);
  const session = await import(path.join(REPO, "mentor", "lib", "session.mjs"));
  assert.equal(session.takeHandIn("parenting.null", 5), null, "another skill's");
  const taken = session.takeHandIn("transform.anchor", 5);
  assert.equal(taken.layer, "Shake Control");
  assert.equal(taken.step_number, 2);
  assert.equal(session.takeHandIn("transform.anchor", 5), null, "once");
  fs.rmSync(home, { recursive: true, force: true });
});
