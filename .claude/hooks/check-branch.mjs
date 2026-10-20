#!/usr/bin/env node
// Run by the cockpit before merging an agent's branch (decisions/008, /merge-worktree):
//   node .claude/hooks/check-branch.mjs <branch> <agent-type> [base]
// Lists every file the branch changed that the agent doesn't own, which catches writes the
// ownership hook can't see (Bash). Exit 0 if all owned, 1 if not, 2 on a usage or git error.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { git, owns, ownerOf, loadOwnership } from "./lib.mjs";

const [branch, agent, base = "main"] = process.argv.slice(2);
if (!branch || !agent) {
  console.error("usage: check-branch.mjs <branch> <agent-type> [base]");
  process.exit(2);
}

const table = loadOwnership(path.join(path.dirname(fileURLToPath(import.meta.url)), "ownership.json"));
const patterns = table.agents[agent];
if (!patterns) {
  console.error(`${agent} isn't in ownership.json.`);
  process.exit(2);
}

const out = git(["diff", "--name-only", `${base}...${branch}`], process.cwd());
if (out === null) {
  console.error(`git couldn't compare ${base} with ${branch}.`);
  process.exit(2);
}

const changed = out ? out.split("\n") : [];
const outside = changed.filter((f) => !owns(patterns, f));
for (const f of outside) console.log(`${f}  (owner: ${ownerOf(table, f) || "cockpit"})`);
console.log(outside.length ? `\n${outside.length} of ${changed.length} files are outside ${agent}'s.` : `All ${changed.length} files are ${agent}'s.`);
process.exit(outside.length ? 1 : 0);
