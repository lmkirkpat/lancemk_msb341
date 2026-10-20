#!/usr/bin/env node
// PreToolUse on Write, Edit and NotebookEdit: a subagent writes only the files its persona owns
// (decisions/007's table, kept in ownership.json; decisions/008). The cockpit isn't restricted.
// Writes from Bash get past this; the cockpit checks those at merge (check-branch.mjs).

import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPayload, block, repoRelative, isTempPath, owns, ownerOf, loadOwnership } from "./lib.mjs";

const TABLE = path.join(path.dirname(fileURLToPath(import.meta.url)), "ownership.json");

const p = readPayload();
if (!p.agent_type) process.exit(0);

const file = p.tool_input && (p.tool_input.file_path || p.tool_input.notebook_path);
if (typeof file !== "string" || !file) block("this write names no file, so it's blocked.");
const abs = path.resolve(p.cwd || process.cwd(), file);
if (isTempPath(abs)) process.exit(0);

const where = repoRelative(abs);
if (!where) block(`${abs} is outside the repo. Subagents write only inside the repo or a temp folder.`);

let table;
try {
  table = loadOwnership(TABLE);
} catch {
  block(`the ownership table (${TABLE}) is unreadable, so subagent writes are blocked until it's fixed.`);
}

const patterns = table.agents[p.agent_type];
if (!patterns) {
  block(`${p.agent_type} isn't in .claude/hooks/ownership.json, so it has no writes. The cockpit adds a row if it needs one.`);
}
if (!owns(patterns, where.rel)) {
  const owner = ownerOf(table, where.rel);
  block(
    `${where.rel} isn't ${p.agent_type}'s to edit (decisions/007). ` +
      (owner ? `It belongs to ${owner}. ` : "It belongs to the cockpit. ") +
      "Put the change in your hand-back as a question or a proposal for its owner."
  );
}
process.exit(0);
