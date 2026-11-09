"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { statusFor } = require("../lib/activity.js");
const { MENTOR_TOOLS } = require("../lib/adapter-claude-code.js");
const fs = require("fs");
const path = require("path");
const { STATUS } = require("../lib/activity.js");
const { allowedToolsOf } = require("../lib/skill-tools.js");

const SKILLS = path.join(__dirname, "..", "..", ".claude", "skills");
const mentorSkills = fs.readdirSync(SKILLS).filter((d) => /-mentor$/.test(d));

test("FR-062: every ae-mentor tool in every *-mentor skill has its own line, and no line names a tool", () => {
  assert.ok(mentorSkills.length >= 7);
  for (const d of mentorSkills) {
    for (const t of allowedToolsOf(fs.readFileSync(path.join(SKILLS, d, "SKILL.md"), "utf8"))) {
      const name = t.replace("mcp__ae-mentor__", "");
      assert.ok(Object.prototype.hasOwnProperty.call(STATUS, name), `${d}: ${name}`);
      assert.doesNotMatch(STATUS[name], /_|snapshot|ae-mentor/, name);
    }
  }
});

test("FR-062: a line claims only what its tool does", () => {
  assert.match(STATUS.key_types_check, /holds/);
  assert.match(STATUS.speed_graph_check, /shapes/);
  assert.match(STATUS.offset_check, /stagger/);
  assert.match(STATUS.anchor_check, /pivot/);
  assert.match(STATUS.null_parent_check, /null/);
  assert.match(STATUS.key_types_demo, /Holding one pair/);
  assert.match(STATUS.speed_graph_demo, /Shaping one pair/);
  assert.match(STATUS.recommend_next, /history/);
});

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
