# Decision 008: Agent team guardrails: what to take from the kit, and which rules tools enforce

**Date:** 2026-10-19
**Status:** Active. Drafted before the hooks are built or any parallel run; revisit after the first one.
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
- **If two new files ever share a number**, **then** add the number check as a hook.
- **If someone copying the team needs separate terminal sessions** (for example, a second person
  working at the same time), **then** revisit the launchers and team memory, and re-test that the
  hooks key correctly when `session_id` differs.
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
