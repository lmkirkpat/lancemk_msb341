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

// Spec 014's ask tools (trial merge with 014-mentor's ask-mentor/SKILL.md): each has its line, and the
// thread's status stays its own timed one, so the learner never sees two reading lines or a flicker.
test("ask-mentor's tools have their lines: describe_layers is MU's \"Reading the open comp…\"", () => {
  const { COPY } = require("../lib/copy.js");
  assert.equal(STATUS.describe_layers, COPY.ask.reading);
  assert.equal(STATUS.describe_layers, "Reading the open comp…");
  assert.equal(STATUS.give_answer, "Writing the answer…");
  for (const t of ["describe_layers", "preview_frame", "give_answer"]) assert.doesNotMatch(STATUS[t], /_|snapshot|ae-mentor/, t);
});

// Spec 014 phase 3: note_said (turn 4) has its own plain line, and in the ask thread it never swaps
// the timed reading line, like every ask tool.
test("note_said's line is plain and says only what it does", async () => {
  assert.equal(STATUS.note_said, "Noting how the steps went…");
  assert.notEqual(statusFor("note_said"), "Working…");
  assert.doesNotMatch(STATUS.note_said, /_|said|record|saved|ae-mentor/i, "no tool or field names, no claim it saved their words");
  const { ready } = require("./app-harness.js");
  const { renderApp } = require("../lib/screens.js");
  const { COPY } = require("../lib/copy.js");
  const h = await ready({ runtime: "a", setTimeout: () => 0 });
  h.app.setDraft("Why does it swing?");
  h.app.act("ask_home");
  h.adapter().emit("tool_call", { name: "note_said" });
  const status = renderApp(h.app.model()).lesson.status.replace(/&#39;/g, "'");
  assert.equal(status.includes(COPY.ask.reading), true, "the thread keeps its own line");
  assert.equal(status.includes(STATUS.note_said), false);
});

test("the ask thread's status comes from its own timer, never the tool: one line, then Still reading at 6 s", async () => {
  const { ready } = require("./app-harness.js");
  const { renderApp } = require("../lib/screens.js");
  const { COPY } = require("../lib/copy.js");
  const timers = [];
  const h = await ready({ runtime: "a", setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; } });
  const fire = (ms) => timers.filter((x) => x.ms === ms).forEach((x) => x.fn());
  h.app.setDraft("Why does it swing?");
  h.app.act("ask_home");
  const status = () => renderApp(h.app.model()).lesson.status.replace(/&#39;/g, "'");
  const count = (s, w) => s.split(w).length - 1;
  h.adapter().emit("tool_call", { name: "describe_layers" });
  assert.equal(count(status(), COPY.ask.reading), 1, "one Reading line, not two");
  h.adapter().emit("tool_call", { name: "give_answer" });
  assert.equal(count(status(), COPY.ask.reading), 1, "a tool call doesn't swap the line");
  assert.equal(status().includes(STATUS.give_answer), false);
  fire(6000);
  assert.equal(count(status(), COPY.ask.reading_long), 1);
  h.adapter().emit("tool_call", { name: "describe_layers" });
  assert.equal(status().includes(COPY.ask.reading_long), true, "a later read doesn't flick it back");
});
