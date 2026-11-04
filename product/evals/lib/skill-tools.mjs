// The one reader of a skill's `allowed-tools` (spec 013 T064, FR-042). The B1 runners build their
// `--allowedTools` from it, `ab.mjs`'s dry run and `ready-for-a.mjs` read the same lists, so no
// runner keeps a tool list by hand. Node built-ins only.

import fs from "node:fs";
import path from "node:path";

export const MCP_PREFIX = "mcp__ae-mentor__";

// The `allowed-tools` of a SKILL.md (inline or as a list), with the ae-mentor prefix removed.
// null when the file has no frontmatter; [] when it has no allowed-tools line.
export function allowedToolsOf(markdown) {
  const front = /^---\n([\s\S]*?)\n---\n/.exec(markdown);
  if (!front) return null;
  const lines = front[1].split("\n");
  const i = lines.findIndex((l) => /^allowed-tools\s*:/.test(l));
  if (i < 0) return [];
  const items = lines[i].replace(/^allowed-tools\s*:/, "").trim().replace(/^\[|\]$/g, "").split(/[,\s]+/);
  for (let j = i + 1; j < lines.length && /^\s+-\s+/.test(lines[j]); j++) items.push(lines[j].replace(/^\s+-\s+/, ""));
  return items.map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean).map((s) => s.replace(MCP_PREFIX, ""));
}

export function skillFile(repo, skill) {
  return path.join(repo, ".claude", "skills", skill, "SKILL.md");
}

// → { mentor, allowed } for a B1 runner.
//   allowed: the skill's own `allowed-tools`, in its order: what `--allowedTools` gets.
//   mentor: every call the runner recognizes: `allowed`, plus `read_learner_record` (first) so a call
//   to it is still seen and reported by the universal check even when the skill no longer lists it.
// Throws when the skill can't be read or lists nothing, so a runner never starts with an empty list.
export function toolSets(repo, skill) {
  const file = skillFile(repo, skill);
  if (!fs.existsSync(file)) throw new Error(`${skill}: no SKILL.md at ${path.relative(repo, file)}`);
  const allowed = allowedToolsOf(fs.readFileSync(file, "utf8"));
  if (!allowed || !allowed.length) throw new Error(`${skill}: SKILL.md has no allowed-tools`);
  return { mentor: ["read_learner_record", ...allowed.filter((t) => t !== "read_learner_record")], allowed };
}
