// Tool-level rules that must hold before After Effects is ever contacted (contracts/mentor-tools.md).
// Fixture mode (T035) will cover the full tools; these need no AE and no bridge.

import { test } from "node:test";
import assert from "node:assert/strict";
import { fixture, tempHome } from "./helpers.mjs";

tempHome();
const { TOOLS } = await import("../tools.mjs");
const session = await import("../lib/session.mjs");
const tool = (name) => TOOLS.find((t) => t.name === name).handler;

test("set_ease checks the session before calling AE", async () => {
  // With no bridge running, reaching AE would fail with AE_UNREACHABLE instead.
  await assert.rejects(tool("set_ease")({ segment_id: "1/ADBE Transform Group/ADBE Position/1" }), { code: "NO_SESSION" });
  session.start(fixture("attempt-before"));
  await assert.rejects(tool("set_ease")({ segment_id: "1/ADBE Transform Group/ADBE Position/2" }), { code: "NOT_DEMO_TARGET" });
  session.recordDemo("1/ADBE Transform Group/ADBE Position/1");
  await assert.rejects(tool("set_ease")({ segment_id: "1/ADBE Transform Group/ADBE Position/1" }), { code: "DEMO_USED" });
});

test("record_lesson saves without AE, and read_learner_record returns it with its path", async () => {
  const empty = JSON.parse((await tool("read_learner_record")({})).content[0].text);
  assert.deepEqual(empty.lessons, []);
  const entry = {
    skill: "easing.basic", project: "Test.aep", comp: "Mentor Practice", attempted: "Eased 4 Title pairs",
    result: "passed", demo_used: true, summary: "Eased every Title pair.", next: "Try Bar next.",
  };
  const saved = JSON.parse((await tool("record_lesson")(entry)).content[0].text);
  assert.deepEqual(saved, { saved: true, skill: { status: "learned", next: "Try Bar next." } });
  const after = JSON.parse((await tool("read_learner_record")({})).content[0].text);
  assert.equal(after.lessons.length, 1);
  assert.ok(after.path.endsWith("learner.json"));
  await assert.rejects(tool("record_lesson")({ ...entry, summary: "Email me at a@b.co" }), { code: "UNSAFE_RECORD" });
});
