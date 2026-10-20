#!/usr/bin/env node
// PreToolUse on Bash: git commands that would hurt other agents' work (decisions/008).
// Modeled on agent-team-kit's bash-guard, keyed on agent_type instead of session_id.

import { readPayload, block, inLinkedWorktree } from "./lib.mjs";

const GIT = String.raw`\bgit(?:\s+-[Cc]\s+\S+)*\s+`;
const rx = (s) => new RegExp(GIT + s);

// Shared-tree rules relax inside a linked worktree, where the tree is the agent's own.
const SHARED_TREE = [
  [rx(String.raw`add\s+(?:-A\b|--all\b|-u\b|--update\b|\.(?:\s|$))`),
    "a blanket `git add` stages every agent's changes, not just yours. Stage explicit paths."],
  [rx(String.raw`commit\s+(?:-[a-zA-Z]*a[a-zA-Z]*\b|--all\b)`),
    "`git commit -a` commits every agent's changed files. Stage explicit paths, then `git commit -m`."],
  [rx(String.raw`reset\s+--hard\b`),
    "`git reset --hard` throws away every agent's uncommitted work. Revert only your own paths."],
  [rx(String.raw`clean\s+-[a-zA-Z]*f`),
    "`git clean -f` deletes every agent's new files."],
  [rx(String.raw`stash\b(?!\s+(?:list|show)\b)`),
    "`git stash` pockets every agent's uncommitted changes, not just yours."],
  [rx(String.raw`(?:checkout|restore)\s+(?:--\s+)?\.(?:\s|$)`),
    "reverting `.` throws away every agent's uncommitted work. Revert only your own paths."],
];

const ALWAYS = [
  [rx(String.raw`push\b[^|&;]*(?:--force\b|--force-with-lease\b|\s-f\b)`),
    "force-push rewrites shared history. Never force-push."],
];

const SUBAGENT = [
  [rx(String.raw`push\b`), "subagents never push. The cockpit pushes when the human asks."],
  [rx(String.raw`(?:merge|rebase)\b`), "subagents never merge or rebase. Commit on your branch; the cockpit integrates."],
];

const p = readPayload();
const cmd = p.tool_input && p.tool_input.command;
if (typeof cmd !== "string") block("this Bash call has no command, so it's blocked.");
if (!/\bgit\b/.test(cmd)) process.exit(0);

const rules = [...ALWAYS, ...(p.agent_type ? SUBAGENT : [])];
if (!inLinkedWorktree(p.cwd)) rules.push(...SHARED_TREE);
for (const [re, msg] of rules) if (re.test(cmd)) block(msg);
process.exit(0);
