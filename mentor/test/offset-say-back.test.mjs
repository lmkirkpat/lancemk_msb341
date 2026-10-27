// Spec 004 tasks-wave-b T199a (FR-040, amended 2026-10-27; the reviewer's finding 1 on
// phase9-pass2): after a passed offset check whose measured gap differs from the stated one, step 7
// says the gap back from the check's own `gaps_frames` and calls nothing else, so the passed lesson
// is still the current one and record_lesson accepts "passed". The second test shows why step 7
// may not re-read: an offset_snapshot after a pass opens a new lesson, and "passed" is then refused.
// Fixture mode with a temp AE_MENTOR_HOME, on the live captures offset-tools.test.mjs uses.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tempHome } from "./helpers.mjs";
import { DIR, PRACTICE2 } from "./fixtures/offset/load.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const LEARNER = path.join(home, "learner.json");
const project = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(DIR, file) }));
project(PRACTICE2);
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { TOOLS } = await import("../tools/index.mjs");
const session = await import("../lib/session.mjs");
const call = async (name, args = {}) => JSON.parse((await TOOLS.find((t) => t.name === name).handler(args)).content[0].text);

// The learner said 8 frames apart; layers-pass.json has Dot 2 and Dot 3 at 4 and 8 frames, so the
// check measures 4-frame gaps and passes (every gap is above the floor).
const STATED = { kind: "layers", order: ["Dot 1", "Dot 2", "Dot 3"], gap_frames: 8 };
const RECORD = {
  skill: "timing.offset", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice 2",
  attempted: "Staggered Dot 1, Dot 2 and Dot 3, in that order", result: "passed", demo_used: false,
  summary: "Gaps about 4 frames each.", next: "Stagger the Chips.",
};

async function passWithDifferentGap() {
  project(PRACTICE2);
  const first = await call("offset_snapshot", { skill_options: STATED });
  assert.equal(first.floor_check.gap_frames, 8);
  project("layers-pass.json");
  const check = await call("offset_check");
  assert.equal(check.passed, true);
  assert.ok(check.gaps_frames.length > 0 && check.gaps_frames.every((g) => g !== 8), "the measured gap differs from the stated one");
  return { check };
}

beforeEach(() => {
  for (const f of ["session.json", "learner.json", "fixture-edits.json"]) fs.rmSync(path.join(home, f), { force: true });
  fs.copyFileSync(path.join(DIR, "records/easing-learned.json"), LEARNER);
});

test("passed, stated gap differs: the say-back uses only the check's gaps_frames, and record_lesson accepts passed", async () => {
  const { check } = await passWithDifferentGap();
  const lesson = session.currentLesson();
  assert.equal(lesson.passed, true);
  const sayBack = Math.round(check.gaps_frames[0]);
  assert.equal(sayBack, 4, "what the mentor says back comes from the check itself");
  // Step 7 calls nothing else here, so the passed lesson is still the current one.
  assert.equal(session.currentLesson().lesson_id, lesson.lesson_id);
  await call("record_lesson", RECORD);
  const rec = JSON.parse(fs.readFileSync(LEARNER, "utf8"));
  assert.equal(rec.lessons[rec.lessons.length - 1].result, "passed");
  assert.equal(rec.skills["timing.offset"].status, "learned");
});

test("why step 7 doesn't re-read: an offset_snapshot after a pass opens a new lesson, and passed is refused", async () => {
  await passWithDifferentGap();
  const passedId = session.currentLesson().lesson_id;
  const reread = await call("offset_snapshot", { skill_options: { ...STATED, gap_frames: 4 } });
  assert.equal(reread.lesson, "new");
  assert.notEqual(session.currentLesson().lesson_id, passedId);
  await assert.rejects(call("record_lesson", RECORD), { code: "RECORD_MISMATCH" });
});

// The reviewer's re-review, should-fix 2: a passed check can also say the order changed. After a
// pass nothing is re-sent; the order is recorded as they made it. Re-sending the new order (step
// 3's rule) would open a new lesson and refuse "passed", the same failure by another route.
const DOTS = { kind: "layers", order: ["Dot 1", "Dot 2", "Dot 3"], gap_frames: 4 };
async function passWithOrderChanged() {
  project(PRACTICE2);
  await call("offset_snapshot", { skill_options: DOTS });
  project("order-differs.json");
  const check = await call("offset_check");
  assert.equal(check.passed, true);
  assert.equal(check.order_differs, true);
}

test("passed with the order changed: nothing re-sent, and record_lesson accepts passed with the order as made", async () => {
  await passWithOrderChanged();
  await call("record_lesson", { ...RECORD, attempted: "Staggered Dot 1, Dot 3 and Dot 2, in that order" });
  const rec = JSON.parse(fs.readFileSync(LEARNER, "utf8"));
  assert.equal(rec.lessons[rec.lessons.length - 1].result, "passed");
});

test("passed with the order changed: re-sending the new order opens a new lesson, and passed is refused", async () => {
  await passWithOrderChanged();
  const resent = await call("offset_snapshot", { skill_options: { ...DOTS, order: ["Dot 1", "Dot 3", "Dot 2"] } });
  assert.equal(resent.lesson, "new");
  await assert.rejects(call("record_lesson", RECORD), { code: "RECORD_MISMATCH" });
});
