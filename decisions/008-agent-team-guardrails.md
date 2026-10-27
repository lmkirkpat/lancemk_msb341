# Decision 008: Agent team guardrails: what to take from the kit, and which rules tools enforce

**Date:** 2026-10-19
**Status:** Active. Drafted before the hooks are built or any parallel run; revisit after the first one.
Amended 2026-10-20 (see the end): permission rules, auto mode, fail-closed on crash, more git
rules, and an ExtendScript guard. Amended 2026-10-26 twice: the AE lock keys on the session too,
and the git guard judges where git acts.
**Amends `decisions/007`:** 007 waited for a violation before enforcing file ownership in tools.
This enforces it before the first parallel run.

## Context

`decisions/007` set up ten personas, each owning its own files, with the main session as the
cockpit. It left open which pieces of `ai-foundry-byu/agent-team-kit` to adopt, the After Effects
lock, and how numbers get handed out. `/agent-audit` on the personas (2026-10-19) then found that
three of the team's hard rules exist only in the prompts:

- **Only one agent drives AE at a time.** Just a line in `skill-builder.md`. `ae_run_script` can
  change or save the `.aep`, and worktrees don't help: there's one AE, one bridge.
- **Each persona edits only its own files.** Every writer has Edit, five have Bash. The pair that
  matters most is eval-engineer and skill-builder: the 25/25 baseline (2026-10-12) means
  something only because the builder can't touch the cases.
- **Never push or merge.** No git hooks exist (`.git/hooks` holds only samples).

Facts that shaped it:

- **Hooks can tell which subagent is calling.** Tested 2026-10-19 (Claude Code 2.1.304,
  headless run with a logging `PreToolUse` hook, $0.30): the reviewer subagent's `Read` carried
  `agent_type: "reviewer"` and an `agent_id`. The main session's calls carry neither.
- **Subagents share the cockpit's `session_id`.** Same test: both calls had the same one. The
  kit's schema lock (`bash-guard.mjs`) and cleanup (`session-release.mjs`) key on `session_id`,
  so they'd treat every subagent as the lock holder. The kit was built for one terminal session
  per agent; this team is subagents inside one cockpit session.
- **The kit fails open.** Its `payload()` (`agent-coord.mjs`) returns `{}` when hook input
  can't be parsed, and the hook then allows the call.
- **The kit has no LICENSE file** (`discovery/agent-team-kit-assessment.md`, clash 5).
- **The kit's launchers skip permissions by default** and start separate named sessions; team
  memory loads a shared folder into each of those sessions. Subagents spawned by one cockpit
  already share the repo's CLAUDE.md.
- **Sequential numbers collide in parallel** (assessment). Spec Kit takes the next spec number
  itself unless given `--number` (`create-new-feature.sh:295`).
- **`SubagentStop` carries `agent_id`** (and `agent_type`), so the AE lock is freed the moment
  the holding subagent finishes; the idle lease is only a backstop. Untested when this was
  written; confirmed 2026-10-19 by the re-run below.

## Options considered

### What to take from the kit

1. **Install it wholesale.** Rejected in `decisions/007` (heavy `install.sh`, `pnpm` pre-push,
   web-app skills that clash with Spec Kit).
2. **Copy its hook scripts and adapt them** (`bash-guard`, `agent-coord`, `session-release`,
   `merge-worktree`).
   - *Pros:* fastest start; the git-safety patterns are already written and tested.
   - *Cons:* the locking and cleanup would have to be rewritten anyway (`session_id` to
     `agent_id`), the parsing fails open, and copying needs the foundry's OK on licensing.
3. **Write our own small hooks modeled on the kit's ideas, and adopt `merge-worktree` and
   worktree mode** (chosen).
   - *Pros:* keyed on agent identity from the start; fails closed; no license question for the
     hook code; small enough to read in one sitting, which matters for the setup README.
   - *Cons:* rewriting patterns that already exist, so a little more time up front.
4. **Option 3 plus the launchers and team memory.**
   - *Cons:* they serve separate terminal sessions, which this team doesn't use, and the
     launchers skip permissions. Rejected untested. The ~8 memory items that apply go into the
     setup README instead.

### The After Effects lock

1. **Automatic lease** (chosen): the first caller of an AE tool holds the lock, keyed on
   `agent_id` (the cockpit counts as `main`). Freed when that subagent stops, or after 10 idle
   minutes.
2. **The cockpit grants it:** writes a lock file naming the agent before spawning it. More
   control, but one more step on every spawn, and easy to forget. Rejected untested.
3. **Only the cockpit drives AE:** take AE tools from skill-builder. Strongest, but builders
   couldn't check new ExtendScript reads themselves. Rejected untested.

### File ownership

1. **Prompt only** (007 as written). Rejected: it's the rule that protects the eval baseline.
2. **A `PreToolUse` hook on Write, Edit and NotebookEdit**, checking the path against the
   calling `agent_type`'s rows in one ownership file (chosen).
3. **Worktrees only.** They keep agents apart from each other, but not from files they don't
   own. Rejected.

Writes from Bash (`sed -i`, `git checkout --`) get past option 2. **Covered at merge:** the
cockpit checks a branch's changed files against the ownership file and stops if any fall
outside it. Parsing Bash commands for writes was rejected as brittle and easy to get around.

## Decision

**Write our own hooks, keyed on which agent is calling, and adopt the kit's `merge-worktree`
skill and worktree mode. Nothing else from the kit for now.**

Deciding reason: **the rules have to hold for subagents inside one cockpit session**, and the
kit's locking can't tell those subagents apart (it keys on `session_id`).

What gets built (in committed `.claude/settings.json`, so worktrees and copies get it):

| Hook | Matches | Rule |
|---|---|---|
| AE lock | `mcp__after-effects__.*`, and every `mcp__ae-mentor__` tool except `read_learner_record` | One holder at a time, keyed on `agent_id` (cockpit = `main`); 10-minute idle lease; released on `SubagentStop` if that input carries `agent_id` |
| Ownership | `Write`, `Edit`, `NotebookEdit` from a subagent | Path must match a row for its `agent_type` in `.claude/hooks/ownership.json` (mirrors the 007 table). An unlisted type gets no writes. The cockpit is not restricted |
| Git guard | `Bash` | Everyone: no blanket `git add`, `reset --hard`, `clean -f`, `stash`, force-push. Subagents also: no `git push`, no `git merge` |

All three **fail closed**: if the hook can't read its input, it blocks and says why. Lock state
lives under the common git dir (as the kit does), so every worktree sees the same lock.

**Numbers stay a prompt rule, checked at merge.** The cockpit hands out spec, decision, interview
and eval-case numbers when it sends work out (the personas already say so). At merge it checks
that new numbered files use the number it gave. A hook that guesses which paths are "new
numbers" would be more code than the risk is worth.

**Copying the team** to another project means rewriting each persona's "In this repo" section
and `ownership.json`. The hooks themselves shouldn't change.

## What would change our mind

- **If the ownership hook blocks a write the persona legitimately owns** more than twice in one
  parallel run, **then** the table is wrong or too narrow: fix `ownership.json` and 007's table
  together.
- **If the merge-time check finds a Bash write outside a persona's files**, **then** add a Bash
  write check for that agent type (or take Bash from it), despite the brittleness.
- **If two agents ever get AE replies mixed up or an `AE_BUSY` during a parallel run** with the
  lock on, **then** the matcher is missing a tool or the lease is too short.
- **If the lock is often held by a finished agent** (waits near 10 minutes, counted in the
  parallel-run notes), **then** test `SubagentStop`; if it can't release by `agent_id`, move to
  the cockpit granting the lock.
  - *2026-10-19, live test (headless, AE 26.5 open on Mentor Practice, `ae_status` only, a
    `PostToolUse` logger reading the lock file, $0.56):* a skill-builder subagent got AE and
    held the lock under its `agent_id`; the lock was gone by the time its `Agent` call returned
    (released on `SubagentStop`); the cockpit then got AE and held it as `main`; a second
    skill-builder was blocked with the "cockpit is driving After Effects (last call 4s ago)"
    message. One gap: the cockpit never stops, so once it touches AE every subagent waits the
    full 10 idle minutes. During parallel runs, the cockpit stays off AE while a builder needs it.
- **If two new files ever share a number**, **then** add the number check as a hook.
- **If someone copying the team needs separate terminal sessions** (for example, a second person
  working at the same time), **then** revisit the launchers and team memory, and re-test that the
  hooks key correctly when `session_id` differs.
  - *2026-10-26, it happened with one person:* two top-level sessions drove AE at once. One ran
    spec 011's sitting prep from the `skill-5-anchor` worktree (26 AE calls, 21:58 to 22:05 UTC,
    13 of them `ae_run_script`); the other was the cockpit starting offset's live lesson (T036).
    Both had no `agent_id`, so both were the holder `main` in the shared lock file, and neither
    was blocked. Seen as the active comp flipping and an `offset_snapshot` that "resumed" on
    Mentor Practice 2. Fixed in the amendment below.
- **If a Claude Code update stops sending `agent_type` or `agent_id` to hooks**, subagents would
  look like the cockpit and every hook would wave them through, silently. **Then** stop parallel
  runs until it's fixed. Re-run the logging test before each sprint's first parallel run, so
  this shows up as a test result rather than a surprise.
  - *2026-10-19, re-run (Claude Code 2.1.304, headless, logging hook passed with `--settings`
    so the repo's settings were untouched, $0.48):* still sent. The cockpit's `Glob`, `Read` and
    `Agent` carried no identity; the reviewer's `Read` carried `agent_type: "reviewer"` and an
    `agent_id`; all shared one `session_id`. The reviewer's `SubagentStop` carried the same
    `agent_type` and `agent_id`, which also settles the `SubagentStop` question above. Sprint 3's
    first parallel run is clear on this signal.

## Amendment 2026-10-20: the rules around the hooks

**Why:** a review against the course book's Advice Versus Enforcement and Blast Radius sections
(`learning/2026-10-19-*.md`) found the hooks sound but the setup around them open. Seven gaps,
all closed in one change:

| Gap | Fix |
|---|---|
| "Fail closed" covered bad input only. A crash, a timeout or a missing `node` exits non-zero, and Claude Code lets the call through | `"onFailure": "block"` on every `PreToolUse` hook. Probed headless (Claude Code 2.1.304, Haiku, $0.01): the same crashing hook let `touch` run without it and blocked it with it |
| The cockpit ran in bypass permissions on the laptop, where only deny rules and hooks hold | `defaultMode: "auto"` and `disableBypassPermissionsMode: "disable"` in `.claude/settings.json` |
| The cockpit's push was a prompt rule (memory and CLAUDE.md), and auto mode allows pushes to the working repo | `ask` rule for `Bash(git push)` and `Bash(git push *)`, backed by the git guard answering `ask` for any cockpit push, including `git -C . push` that the rule's text match misses |
| The cockpit could send email, share or trash Drive files, delete Notion pages, and deploy, with no prompt | `deny` for those MCP tools, the whole Vercel server, `vercel *`, `npm publish *`, `gh pr merge *`, `gh repo delete *`. Also `Read` of `.env` files. Confirmed live: saving the rules removed exactly those tools from the session |
| `ae_run_script` runs ExtendScript inside AE, past every Bash guard: `system.callSystem`, saving the `.aep`, deleting or writing files | `ae-script-guard.mjs`: blocks those calls for subagents. Text match, like the git guard |
| Bash writes in the shared tree were never checked: `check-branch` runs only on branches | Process rule (README, "Run a parallel job"): every persona with Bash runs in a worktree. No new code |
| Subagents could remove worktrees, delete or force branches, and switch branches in the shared tree | Added to the git guard's subagent rules. The cockpit's merge cleanup still works |
| *2026-10-20:* ownership is per persona, so two skill-builders in one wave can both edit shared `mentor/` code (spec 004 FR-032) | `addOnly` patterns in `ownership.json`: `check-branch.mjs` flags a branch that changes or removes an existing file under `mentor/`, `bridge/` or `.claude/skills/*-mentor/`, unless the cockpit passes `--shared-owner` for the one branch it named owner. Checked at merge, not per write, so it needs no new hook |

*2026-10-26:* `disableBypassPermissionsMode` removed on purpose to reactivate bypass mode; the
deny rules, the push `ask` and the hooks still hold in bypass, and the settings test no longer
checks for the line.

**Rejected:** staying in bypass with `deny` on push (the human pushes from their own terminal).
Safer on push alone, but leaves every other action with no prompt and no classifier.

**What would change our mind:**

- **If the ExtendScript guard blocks a legitimate build step** (most likely `layer.remove()` on a
  layer the builder added), **then** narrow `.remove(` to file and folder objects, or let the
  builder hand it back for the cockpit.
- **If auto mode's prompts slow a parallel run enough to matter** (counted in the run notes),
  **then** add narrow `allow` rules for the prompts that keep coming up, never bypass.

## Amendment 2026-10-26: the AE lock keys on the session too

**Why:** the lock keyed on `agent_id` alone, with every top-level session as `main`. That held for
one cockpit and its subagents, but two top-level sessions (two terminals, or a cockpit plus a
session in a worktree) shared the holder `main` and walked past each other (evidence above).

**Change:**

| Before | After |
|---|---|
| Holder is `agent_id`, or `main` with none | Holder is `session_id:agent_id`, or `session_id:main`: subagents differ by `agent_id`, top-level sessions by `session_id` |
| Released only on `SubagentStop`, so a top-level session kept it until the 10-minute lease ran out | Also `SessionEnd` (`--end-session`), which frees a lock held by that session or any of its subagents. `SubagentStop` still frees only its own subagent |
| Block message named the agent type | Also names the worktree it's driving from |

Tests: two top-level sessions in different worktrees (the second is blocked, with where), a
subagent blocked by its own cockpit, `SubagentStop` never freeing a top-level lock, `SessionEnd`
freeing its own session only.

**Still a rule, not a hook:** a lock spaces out calls, but AE has one active comp, so a live lesson
and a sitting can't share it even taking turns. One sitting or live lesson at a time; before
starting one, check `ae_status` and that no other session holds the lock (CLAUDE.md).

**What would change our mind:**

- **If a top-level session that's only waiting on the learner loses the lock mid-lesson** (more
  than 10 idle minutes, then another session takes AE), **then** hold the lock for a whole sitting
  or lesson: a skill or command takes it at the start and frees it at the end.
- **If `SessionEnd` doesn't fire on a closed terminal or a crash** (a lock left by a dead session
  shows up in the lock file), **then** the lease stays the backstop; shorten it only if waits add up.

## Amendment 2026-10-26: the git guard judges where git acts

**Why:** writing up parallel run 3 (`discovery/usage-notes/parallel-runs.md` › Run 3 ›
Guardrails), a hard reset was blocked in run 3 but not in run 2, with no change to the guard in
between. A probe with five payloads showed why: the guard chose its shared-tree rules from the
agent's working folder (`p.cwd`), not from the folder git acts on. So it blocked a reset of an
agent's own worktree from the main tree with `git -C`, and let a subagent standing in a worktree
reset, stash or clean **the main tree** with `git -C <main>` or `cd <main> &&`. The shared tree is
what the guard exists to protect. Two smaller gaps turned up while testing the fix: any git option
before the subcommand (`--no-pager`, `--work-tree=x`, `-p`) hid it from every rule, and
`merge\b` also blocked `git merge-base`, a read.

**Change:**

| Before | After |
|---|---|
| Shared-tree rules apply unless the agent's folder is a linked worktree | They apply to each git call unless that call lands in **the same** linked worktree the agent is standing in, worked out from any `cd` before it and its own `-C` paths. Reaching the main tree or another agent's worktree from a worktree is blocked |
| No notion of "can't tell" | A subshell, `$(...)`, backticks, `pushd`, `eval`, `env`, `xargs`, `sh -c`, `GIT_DIR`, `--git-dir`, `--work-tree`, or a `cd` to a variable makes the target unknown, and unknown counts as shared |
| Rules matched `git`, then only `-C`/`-c`, then the subcommand | Any global option may sit in between (`--no-pager`, `--git-dir x`, `--work-tree=x`, `-p`) |
| Subagents couldn't run `git merge-base` | Allowed; `merge` and `rebase` still blocked |

Still blocked on purpose: from the main tree, a reset of any worktree, even one the agent cut
itself. The guard can't tell a worktree an agent cut from another agent's. The way through is to
`cd` into the worktree in one call and run git from there in the next.

Tests (`.claude/hooks/test/hooks.test.mjs`, 39 pass): its own worktree from inside it (`-C` to
itself, `cd sub`); the main tree and another worktree from inside a worktree, by `-C`, `cd`, quoted
paths and two `cd`s; five unknown-target forms; the main tree reaching into a worktree; global
options before the subcommand; `merge-base` against `merge` and `merge --ff-only`.

**Still a text match:** the guard reads the command string, so a heredoc that only *writes* a
destructive git command is blocked (run 3's cockpit, and twice while writing this amendment).
Harmless: a false block, not a false pass.

**What would change our mind:**

- **If the "can't tell" list blocks ordinary work in worktrees more than twice in a run** (counted
  in the run notes), **then** narrow it (most likely `env` or `xargs`), never drop the
  unknown-means-shared rule.
- **If a destructive git command reaches the shared tree some other way** (an alias, a script
  file, `make`), **then** the string guard has hit its limit: move the protection to the tree
  itself (commit before every wave, or give each agent a worktree so the main tree holds no
  agent's uncommitted work).

**Known gaps, not fixed yet** (2026-10-26, held back so the change doesn't land under other
sessions mid-run; fix between runs, with tests, in this order):

1. **The stash is shared across worktrees.** `refs/stash` lives in the common git dir: a stash
   made in worktree A is listed, and can be popped or dropped, from worktree B and from `main`
   (checked in a throwaway repo). The guard allows `git stash` inside an agent's own worktree,
   so one agent's `stash pop` or `stash drop` can take or delete another's work. Fix: block
   `stash` (except `list` and `show`) everywhere for subagents, not only in the shared tree.
2. **Not verified: does a subagent's `cd` carry over to its next call's `cwd`?** The README's
   hand-cut worktree method depends on it (step 2: `cd` into the worktree in the first call). If
   it doesn't, a hand-cut worktree's agent stands in the main tree on every call: its destructive
   commands are blocked (safe), but so are `git add -A` and branch switches in its own tree.
   Check with the identity probe's method (a logging hook on two Bash calls) before the next run.
3. **Destructive commands with no rule:** `git rm -f` and `git rm -r` (delete working-tree files,
   modified ones included), `git checkout -f <branch>` and `git switch --discard-changes` for the
   cockpit in the shared tree, `git checkout <ref> -- <dir>` (overwrites a folder), and
   `git reflog expire` or `git gc --prune=now` (the object store is shared, so this removes every
   worktree's way back). Fix: add them to the shared-tree rules, the last two to ALWAYS.
4. **Text inside strings is matched as commands.** A heredoc, an `echo`, or a commit message that
   mentions a destructive git command is blocked; three times on 2026-10-26. Fix: strip heredoc
   bodies and quoted arguments before matching. The README's load check
   (`echo "git reset --hard"` should be blocked) depends on this false positive, so replace that
   check in the same change.
5. **`git config` and aliases.** A subagent can write `alias.x = reset --hard` into the shared
   config and run `git x`, and config is shared across worktrees. Fix: block `git config` writes
   for subagents (`--get` and `--list` stay allowed).
