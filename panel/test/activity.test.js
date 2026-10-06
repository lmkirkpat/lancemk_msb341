"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { statusFor } = require("../lib/activity.js");
const { MENTOR_TOOLS } = require("../lib/adapter-claude-code.js");

test("every mentor tool has a plain status line", () => {
  for (const t of MENTOR_TOOLS) {
    const s = statusFor(t);
    assert.notEqual(s, "Working…", t);
    assert.match(s, /…$/);
    assert.doesNotMatch(s, /_|snapshot|diff|record_|set_ease/, "no tool or field names (FR-017)");
  }
});

test("matches the task's wording", () => {
  assert.equal(statusFor("snapshot_project"), "Looking at your comp…");
  assert.equal(statusFor("diff_since_last"), "Checking your keyframes…");
  assert.equal(statusFor("set_ease"), "Easing one pair to show you…");
});

test("anything else is just Working…", () => {
  assert.equal(statusFor("ToolSearch"), "Working…");
  assert.equal(statusFor(undefined), "Working…");
});
