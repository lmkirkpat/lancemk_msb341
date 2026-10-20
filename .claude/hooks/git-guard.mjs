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

const PUSH = rx(String.raw`push\b`);

const SUBAGENT = [
  [PUSH, "subagents never push. The cockpit pushes when the human asks."],
  [rx(String.raw`(?:merge|rebase)\b`), "subagents never merge or rebase. Commit on your branch; the cockpit integrates."],
  [rx(String.raw`worktree\s+(?:remove|prune|move)\b`),
    "subagents never remove or move worktrees; another agent's uncommitted work may be in one. The cockpit cleans up."],
  [rx(String.raw`branch\b[^|&;]*\s(?:-[a-zA-Z]*[DdfMm]\b|--(?:force|delete|move)\b)`),
    "subagents never delete, force or rename branches. The cockpit cleans up after a merge."],
];

// A subagent switching branches in the shared tree changes every file under the agents working there.
const SUBAGENT_SHARED_TREE = [
  [rx(String.raw`switch\b`), "switching branches in the shared tree changes every agent's files. Ask the cockpit for a worktree."],
  [rx(String.raw`checkout\b(?![^|&;]*\s--(?:\s|$))`),
    "`git checkout` without `--` can switch branches under every agent. To restore your own file, use `git restore <path>`."],
];

const p = readPayload();
const cmd = p.tool_input && p.tool_input.command;
if (typeof cmd !== "string") block("this Bash call has no command, so it's blocked.");
if (!/\bgit\b/.test(cmd)) process.exit(0);

const shared = !inLinkedWorktree(p.cwd);
const rules = [...ALWAYS, ...(p.agent_type ? SUBAGENT : [])];
if (shared) rules.push(...SHARED_TREE);
if (shared && p.agent_type) rules.push(...SUBAGENT_SHARED_TREE);
for (const [re, msg] of rules) if (re.test(cmd)) block(msg);

// The cockpit's push leaves the laptop, so the human approves each one, even in auto mode. This
// backs up the `ask` rule in settings.json, which matches only `git push ...` written plainly.
if (PUSH.test(cmd)) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: "A push leaves this laptop and can't be recalled (decisions/008). Approve it only if you asked for it.",
    },
  }) + "\n");
}
process.exit(0);
