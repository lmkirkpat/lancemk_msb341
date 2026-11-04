// Which tools a B1 lesson launches with (spec 013 FR-042): the opening skill's own `allowed-tools`,
// read from its SKILL.md, so no list is kept by hand. The helper and the eval runners have their own
// readers (helper/lib/skills.mjs, product/evals/lib/skill-tools.mjs), but those are ES modules and
// this runs in CEP's Node, where require can't load them, so this is a plain script and
// test/skill-tools.test.js holds all three to the same lists. Node built-ins only; no `node:`
// imports, `?.` or `??`, for CEP.
"use strict";

const nodeFs = require("fs");
const path = require("path");

const PREFIX = "mcp__ae-mentor__";
// The name pattern runtime.js and the helper use, so no builder skill and no path gets through.
const SKILL_NAME = /^[a-z0-9][a-z0-9-]*-mentor$/;
const COMMAND = /^\s*\/([a-z0-9][a-z0-9-]*-mentor)(?=\s|$)/;
const MENTOR_TOOL = /^mcp__ae-mentor__[A-Za-z0-9_]+$/;

// The skill a request opens: "/key-types-mentor" → "key-types-mentor". null for anything else.
function skillOf(request) {
  const m = typeof request === "string" ? COMMAND.exec(request) : null;
  return m ? m[1] : null;
}

// The ae-mentor tools in a SKILL.md's `allowed-tools`, inline or as a YAML list, with their prefix.
// Everything else is dropped: `Skill` stays out of B1's list (FR-042), and nothing here can add a
// tool from another server or an argument. null with no frontmatter, [] with no list.
function allowedToolsOf(markdown) {
  const front = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(String(markdown).replace(/\r\n/g, "\n"));
  if (!front) return null;
  const lines = front[1].split("\n");
  const i = lines.findIndex((l) => /^allowed-tools\s*:/.test(l));
  if (i < 0) return [];
  const items = lines[i].replace(/^allowed-tools\s*:/, "").trim().replace(/^\[|\]$/g, "").split(/[,\s]+/);
  for (let j = i + 1; j < lines.length && /^\s+-\s+/.test(lines[j]); j++) items.push(lines[j].replace(/^\s+-\s+/, ""));
  return items.map((s) => s.trim().replace(/^["']|["']$/g, "")).filter((s) => MENTOR_TOOL.test(s));
}

// The tools of a skill in the runtime folder, the SKILL.md Claude Code itself loads there (a link to
// the repo's). null when it can't be used: the caller decides what that means. Never throws.
function toolsForSkill(skill, runtimePath, fs) {
  if (typeof skill !== "string" || !SKILL_NAME.test(skill) || !runtimePath) return null;
  try {
    const file = path.join(runtimePath, ".claude", "skills", skill, "SKILL.md");
    const tools = allowedToolsOf((fs || nodeFs).readFileSync(file, "utf8"));
    return tools && tools.length ? tools : null;
  } catch (e) {
    return null;
  }
}

module.exports = { skillOf, allowedToolsOf, toolsForSkill, PREFIX };
