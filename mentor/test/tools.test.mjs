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
