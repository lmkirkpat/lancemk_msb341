#!/usr/bin/env node
// PreToolUse on Bash: git commands that would hurt other agents' work (decisions/008).
// Modeled on agent-team-kit's bash-guard, keyed on agent_type instead of session_id.

import os from "node:os";
import path from "node:path";
import { readPayload, block, linkedWorktreeTop } from "./lib.mjs";

// `git`, then any global options (`-C dir`, `-c k=v`, `--no-pager`, `--work-tree=x`, `--git-dir x`),
// so an option before the subcommand can't hide it from the rules.
const GLOBAL_OPT = String.raw`(?:-[Cc]\s+\S+|--(?:git-dir|work-tree|namespace|super-prefix)\s+\S+|--[\w-]+(?:=\S+)?|-[a-zA-Z]\b)`;
const GIT = String.raw`\bgit(?:\s+${GLOBAL_OPT})*\s+`;
const rx = (s) => new RegExp(GIT + s);

// Shared-tree rules relax only when git acts on the linked worktree the agent is standing in,
// the one tree that is the agent's own (see `ownTree` below).
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
  [rx(String.raw`(?:merge|rebase)(?![\w-])`), "subagents never merge or rebase. Commit on your branch; the cockpit integrates."],
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

for (const [re, msg] of [...ALWAYS, ...(p.agent_type ? SUBAGENT : [])]) if (re.test(cmd)) block(msg);

// The folder each git call acts on: the agent's folder, moved by any `cd` before the call, then
// by the call's own `-C` paths. Where that can't be worked out (a subshell, a variable, GIT_DIR),
// the call counts as acting on the shared tree. A git call counts as the agent's own only when it
// lands in the same linked worktree the agent is standing in, so a worktree agent can't reach the
// main tree, or another agent's worktree, with `-C` or `cd`.
const ownTree = linkedWorktreeTop(p.cwd);
const OPAQUE = /[()`]|\$\(|\b(?:pushd|popd|eval|xargs|env)\b|\b(?:ba|z)?sh\s+-c\b|\bGIT_(?:DIR|WORK_TREE)\b|--git-dir\b|--work-tree\b/;
const CD = /^cd(?:\s+(?:"([^"]*)"|'([^']*)'|([^\s"'$]+)))?\s*$/;
const GIT_CALL = new RegExp(String.raw`\bgit((?:\s+(?:-C\s+(?:"[^"]*"|'[^']*'|\S+)|${GLOBAL_OPT}))*)\s+`, "g");
const unquote = (s) => s.replace(/^(["'])(.*)\1$/, "$2");
const move = (from, to) => from && (to === "~" || to.startsWith("~/") ? path.join(os.homedir(), to.slice(1)) : path.resolve(from, to));

let dir = OPAQUE.test(cmd) ? null : p.cwd;
for (const seg of cmd.split(/&&|\|\||[;|&\n]/).map((s) => s.trim())) {
  const cd = seg.match(CD);
  if (cd) { dir = move(dir, cd[1] ?? cd[2] ?? cd[3] ?? "~"); continue; }
  if (/^cd\b/.test(seg)) { dir = null; continue; }
  let own = Boolean(ownTree);
  for (const call of seg.matchAll(GIT_CALL)) {
    let at = dir;
    for (const c of call[1].matchAll(/-C\s+("[^"]*"|'[^']*'|\S+)/g)) at = move(at, unquote(c[1]));
    if (!ownTree || linkedWorktreeTop(at) !== ownTree) own = false;
  }
  if (own) continue;
  const rules = [...SHARED_TREE, ...(p.agent_type ? SUBAGENT_SHARED_TREE : [])];
  for (const [re, msg] of rules) {
    if (!re.test(seg)) continue;
    block(ownTree ? `${msg} This call acts outside your own worktree (\`${ownTree}\`), or the guard can't tell where it acts.` : msg);
  }
}

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
