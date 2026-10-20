# Agent Team Kit: assessment for Knack

**Date:** 2026-10-19
**Source:** https://github.com/ai-foundry-byu/agent-team-kit (cloned to `../agent-team-kit`, head `e66a512`)
**Why:** Sprint 3 (`sprints/sprint-3-plan.md`) needs a team of reusable agents. This checks
whether the kit is a good starting point and what to change or add.

## Summary

The kit keeps several agents from getting in each other's way. It does **not** define an
agent team: there are no `.claude/agents/*.md` files and no personas. Sprint 3 needs both
layers: **who the agents are** (missing) and **how they avoid colliding** (the kit).

## What's in it

| Part | What it is | Fit for Knack |
|---|---|---|
| Two ways to run (`README`, `docs/WORKTREE-MODE.md`) | Every agent on `main` in its own area, or each agent in its own worktree with a "cockpit" session that merges | High. Parallel agents share `SKILL.md`, evals and `mentor/` |
| Launchers (`worktree-commands.sh`) | `cs <name>`, `wt <name>`, `cockpit`, `wtls`: named, remote-control sessions | High, but every launcher skips permissions by default |
| `merge-worktree` skill | Cockpit merges a finished branch, stops on conflicts, prunes, never pushes | High |
| Hooks (`hooks/scripts/`) | Per-session dev ports; blocks blanket `git add`, `reset --hard`, `stash` on shared `main`; one-agent-at-a-time schema lock; file-size and import checks | Mixed. Git safety fits. Ports and schema lock assume SvelteKit, Supabase, pnpm |
| Team memory (`team-memory.mjs`, `/share-memory`, 31-item `memory-pack/`) | A tracked memory folder loaded into every teammate's session | Medium to high, for "someone else can copy the agents" |
| Process skills | `spec`, `build-spec`, `mockup`, `regression-check`, `ux-critique`, `userflow-map` | Mixed, see conflicts |
| Release skills and build specs | `push`, `stage`, `promote`, `remove-flag`, `fix-bug`, plus impersonation, staging twin, feedback loop, crawlers | Low for Knack (Vercel, Supabase, a `bug_reports` table). Possibly useful for the portfolio website |

## Where it clashes with this repo

1. `/spec` and `/build-spec` overlap Spec Kit (`decisions/004`) and write to a gitignored
   `.specs/`, which breaks the rule that specs are committed in `specs/NNN-name/`. Skip both.
2. `install.sh` is heavy: it appends three sections to `CLAUDE.md`, adds a `.claude/*`
   ignore rule (this repo ignores nothing under `.claude`), adds `scripts/hooks/`,
   `.githooks/` and 31 memory files, and sets `core.hooksPath`. Copy pieces by hand instead.
3. The `pre-push` hook runs `pnpm -s check`. This repo uses npm and plain Node, so it would
   block every push until edited.
4. The memory pack is mostly about web apps (release flags, staging, buttons). About 8 of the
   31 items apply here.
5. The kit has no LICENSE file. Confirm with the foundry before copying it into a public repo.

## Knack-specific findings

- **The shared resource is After Effects, not a database.** There's one open AE, one `.aep`
  and one bridge. Two agents running `ae_run_script` or `set_ease` at once collide the way two
  agents migrating one database would, and worktrees don't prevent it. Adapt the kit's schema
  lock (`bash-guard.mjs`) into a `PreToolUse` hook matching
  `mcp__after-effects__.*|mcp__ae-mentor__set_ease` that allows one agent at a time.
- **Sequential IDs collide in parallel** (memory-pack item). `decisions/NNN`, `specs/NNN` and
  eval case numbers will collide when several worktrees each take "the next number."
- **`mentor/tools.mjs` is the merge hot spot.** Ten skills adding tools to one file in
  parallel means a conflict on every merge. Split it per skill before the parallel build.
  Note the eval hash covers `mentor/tools.mjs`, so the split changes every case's hash once.

## What to add

1. Agent personas in `.claude/agents/` (drafted 2026-10-19): curriculum designer, skill
   builder, eval engineer, reviewer, researcher. The main session is the cockpit: it plans,
   sends work out and merges, because subagents can't start other subagents.
2. An After Effects lock hook, plus a rule that only one agent drives the live comp at a time.
3. One file per skill for mentor tools, and per-skill folders
   (`.claude/skills/<skill>-mentor/`, `product/evals/<skill>/`).
4. An ID rule: the cockpit assigns spec, decision and eval case numbers when it sends work out.
5. A parallel-run log template, for the "notes on time and quality" done item.
6. A setup README written for this setup (the kit's `ADOPT.md` assumes a web app with a DB).
7. A trimmed kit: worktree mode, launchers, `merge-worktree`, `bash-guard` git safety, team
   memory, about 8 memory items. Leave the release, database and web-app pieces for the
   portfolio site.
8. A decision record (`decisions/007`): which kit pieces were adopted, and the personas.
