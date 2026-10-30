// Reads a mentor skill from a skills folder (spec 013 FR-010, FR-017; research R5, R6): the
// `allowed-tools` frontmatter for the tool list and the body, byte for byte, for the model. Only
// `*-mentor` names are accepted (the pattern panel/lib/runtime.js uses), so no builder skill can
// be loaded into a lesson.

import fs from "node:fs";
import path from "node:path";

export const SKILL_PATTERN = /^[a-z0-9][a-z0-9-]*-mentor$/;
export const MCP_PREFIX = "mcp__ae-mentor__";

export class SkillError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// The frontmatter's `allowed-tools`, inline ("a, b c") or as a YAML list ("- a").
function parseAllowedTools(front) {
  const lines = front.split("\n");
  const i = lines.findIndex((l) => /^allowed-tools\s*:/.test(l));
  if (i < 0) return [];
  const inline = lines[i].replace(/^allowed-tools\s*:/, "").trim();
  const items = [];
  if (inline) items.push(...inline.replace(/^\[|\]$/g, "").split(/[,\s]+/));
  for (let j = i + 1; j < lines.length && /^\s+-\s+/.test(lines[j]); j++) items.push(lines[j].replace(/^\s+-\s+/, ""));
  return items.map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
}

// → { name, allowedTools, body } where allowedTools has the server prefix removed (Skill kept as
// is) and body is the exact text after the closing `---` line. Throws SkillError.
export function readSkill(skillsDir, name) {
  if (typeof name !== "string" || !SKILL_PATTERN.test(name)) throw new SkillError("NOT_A_MENTOR_SKILL", "Only *-mentor skills can be loaded.");
  const file = path.join(skillsDir, name, "SKILL.md");
  let buf;
  try {
    buf = fs.readFileSync(file);
  } catch {
    throw new SkillError("NO_SUCH_SKILL", `No skill named ${name}.`);
  }
  // The frontmatter is between a first line `---` and the next line that is exactly `---`.
  const nl = (from) => buf.indexOf(0x0a, from);
  const lineAt = (start, end) => buf.subarray(start, end).toString("utf8").replace(/\r$/, "");
  let end = nl(0);
  if (end < 0 || lineAt(0, end) !== "---") throw new SkillError("NO_FRONTMATTER", `${name} has no frontmatter.`);
  const frontStart = end + 1;
  let start = frontStart;
  for (;;) {
    end = nl(start);
    const stop = end < 0 ? buf.length : end;
    if (lineAt(start, stop) === "---") {
      const front = buf.subarray(frontStart, start).toString("utf8");
      const body = end < 0 ? "" : buf.subarray(end + 1).toString("utf8");
      const allowedTools = parseAllowedTools(front).map((t) => (t.startsWith(MCP_PREFIX) ? t.slice(MCP_PREFIX.length) : t));
      return { name, allowedTools, body };
    }
    if (end < 0) throw new SkillError("NO_FRONTMATTER", `${name}'s frontmatter never closes.`);
    start = end + 1;
  }
}

// The names of the mentor skills in a folder, sorted.
export function listSkills(skillsDir) {
  let names;
  try {
    names = fs.readdirSync(skillsDir);
  } catch {
    return [];
  }
  return names.filter((n) => SKILL_PATTERN.test(n) && fs.existsSync(path.join(skillsDir, n, "SKILL.md"))).sort();
}

// A message that starts with a mentor skill's command (`/ease-mentor`, `/offset-mentor review`).
// → { name, args } or null. The text itself is passed on to the model unchanged (FR-002).
export function commandOf(text) {
  const m = /^\s*\/([a-z0-9][a-z0-9-]*-mentor)(?=\s|$)\s*([\s\S]*)$/.exec(typeof text === "string" ? text : "");
  return m ? { name: m[1], args: m[2].trim() } : null;
}
