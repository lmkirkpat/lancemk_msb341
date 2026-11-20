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

test("a case that asked first seeds an ask in the window, so no due review opens the lesson; with a hand-in both are in one file", async () => {
  const { seedSession, sessionProblems } = await import("../hand-in.mjs");
  const { spawnSync } = await import("node:child_process");
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-"));
  // The session module reads its folder once, so each read runs in its own process.
  const read = (src) => spawnSync(process.execPath, ["--input-type=module", "-e", `import * as s from ${JSON.stringify(path.join(REPO, "mentor", "lib", "session.mjs"))}; console.log(JSON.stringify(${src}));`], { env: { ...process.env, AE_MENTOR_HOME: home }, encoding: "utf8" }).stdout.trim();
  seedSession(home, { ask_started: true });
  assert.notEqual(read("s.askStartedAt()"), "null", "the ask is in the window");
  seedSession(home, { ask_started: true, hand_in: GOOD });
  assert.notEqual(read("s.askStartedAt()"), "null");
  assert.match(read('s.takeHandIn("transform.anchor", 5)'), /Shake Control/);
  seedSession(home, { hand_in: GOOD });
  assert.equal(read("s.askStartedAt()"), "null", "no ask without ask_started");
  assert.deepEqual(sessionProblems({ ask_started: true }), []);
  assert.match(sessionProblems({ ask_started: "yes" })[0], /true or false/);
  fs.rmSync(home, { recursive: true, force: true });
});
