"use strict";
// T042: the skill table, its drift test against the repo, and tool → skill (PN-16, data-model).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TABLE, skillById, skillIdForTool, readSkillsBuilt, builtSkills, EASING } = require("../lib/skills.js");
const { allowedToolsOf } = require("../lib/skill-tools.js");

const REPO = path.join(__dirname, "..", "..");
const PATH = JSON.parse(fs.readFileSync(path.join(REPO, "mentor", "curriculum", "path.json"), "utf8"));
const allowed = (name) => allowedToolsOf(fs.readFileSync(path.join(REPO, ".claude", "skills", name, "SKILL.md"), "utf8"));
const BUILT = { skills: { "easing.basic": { review: false }, "keyframes.types": { review: true } } };

test("every command has a SKILL.md, and every tool is in that skill's allowed-tools", () => {
  for (const s of TABLE) {
    assert.equal(`/${s.skill}`, s.command);
    const tools = allowed(s.skill);
    for (const t of [s.snapshot, s.demo, s.check]) assert.ok(tools.includes(`mcp__ae-mentor__${t}`), `${s.skill}: ${t}`);
  }
});

test("every id in the table is in the path, and tool → skill finds each", () => {
  const ids = new Set(PATH.skills.map((s) => s.id));
  for (const s of TABLE) {
    assert.ok(ids.has(s.id), s.id);
    for (const t of [s.snapshot, s.demo, s.check]) assert.equal(skillIdForTool(t), s.id);
  }
  assert.equal(skillIdForTool("preview_frame"), null);
  assert.equal(skillIdForTool("record_lesson"), null);
  assert.equal(skillById("nope"), null);
});

test("built skills come from the data file, in path order, with name, hard and review", () => {
  const list = builtSkills(PATH, BUILT);
  assert.deepEqual(list.map((s) => s.id), ["easing.basic", "keyframes.types"]);
  assert.equal(list[1].name, "Pick the key type on purpose");
  assert.deepEqual(list[1].hard, ["easing.basic"]);
  assert.equal(list[1].review, true);
  assert.equal(list[0].review, false);
});

test("with no data file only the path's first skill counts as built (plan P2)", () => {
  assert.deepEqual(builtSkills(PATH, null).map((s) => s.id), ["easing.basic"]);
  assert.deepEqual(builtSkills(null, null), []);
  assert.equal(EASING.command, "/ease-mentor");
});

test("readSkillsBuilt: the file, or null when it can't be read", () => {
  const fake = (text) => ({ readFileSync: () => { if (text === null) throw new Error("gone"); return text; } });
  assert.deepEqual(readSkillsBuilt({ repoPath: "/x", fs: fake(JSON.stringify(BUILT)) }), BUILT);
  assert.equal(readSkillsBuilt({ repoPath: "/x", fs: fake(null) }), null);
  assert.equal(readSkillsBuilt({ repoPath: "/x", fs: fake("{ nope") }), null);
  assert.equal(readSkillsBuilt({ repoPath: "/x", fs: fake("{}") }), null);
});
