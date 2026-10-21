#!/usr/bin/env node
// Run by the cockpit before merging an agent's branch (decisions/008, /merge-worktree):
//   node .claude/hooks/check-branch.mjs <branch> <agent-type> [base] [--shared-owner]
// Lists every file the branch changed that the agent doesn't own, which catches writes the
// ownership hook can't see (Bash). Also lists files in ownership.json's addOnly patterns that the
// branch changed or removed rather than added: during a parallel run only the branch the cockpit
// named shared-code owner (--shared-owner) may change those (spec 004 FR-032).
// Exit 0 if all clear, 1 if not, 2 on a usage or git error.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { git, owns, ownerOf, loadOwnership } from "./lib.mjs";

const args = process.argv.slice(2);
const sharedOwner = args.includes("--shared-owner");
const [branch, agent, base = "main"] = args.filter((a) => a !== "--shared-owner");
if (!branch || !agent) {
  console.error("usage: check-branch.mjs <branch> <agent-type> [base] [--shared-owner]");
  process.exit(2);
}

const table = loadOwnership(path.join(path.dirname(fileURLToPath(import.meta.url)), "ownership.json"));
const patterns = table.agents[agent];
if (!patterns) {
  console.error(`${agent} isn't in ownership.json.`);
  process.exit(2);
}

const out = git(["diff", "--name-status", `${base}...${branch}`], process.cwd());
if (out === null) {
  console.error(`git couldn't compare ${base} with ${branch}.`);
  process.exit(2);
}

// Each line is "A\tpath", "M\tpath" or "R100\told\tnew"; a rename changes the old path too.
const entries = out ? out.split("\n").map((l) => l.split("\t")) : [];
const changed = [...new Set(entries.flatMap(([, ...paths]) => paths))];
const outside = changed.filter((f) => !owns(patterns, f));
for (const f of outside) console.log(`${f}  (owner: ${ownerOf(table, f) || "cockpit"})`);

const addOnly = table.addOnly?.patterns || [];
const shared = sharedOwner
  ? []
  : [...new Set(entries.filter(([s]) => s !== "A").flatMap(([, ...p]) => p).filter((f) => owns(addOnly, f) && !outside.includes(f)))];
for (const f of shared) console.log(`${f}  (shared: changes go to the shared-code owner)`);

if (!outside.length && !shared.length) console.log(`All ${changed.length} files are ${agent}'s.`);
else {
  console.log("");
  if (outside.length) console.log(`${outside.length} of ${changed.length} files are outside ${agent}'s.`);
  if (shared.length) console.log(`${shared.length} existing shared files changed without --shared-owner.`);
}
process.exit(outside.length || shared.length ? 1 : 0);
