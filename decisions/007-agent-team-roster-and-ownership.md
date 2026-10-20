# Decision 007: The agent team: roster and who owns what

**Date:** 2026-10-19
**Status:** Active. Drafted before any parallel run; revisit after the first one (see the signals).

## Context

Sprint 3 (`sprints/sprint-3-plan.md`) needs a team of subagents with personas I can copy to other
projects, so curriculum, building, specs and evals can run in parallel. Done also needs proof
they carry over (my portfolio website) and notes on time and quality.

Facts that shaped it:

- **The starting kit has no personas.** `ai-foundry-byu/agent-team-kit` keeps parallel agents
  from colliding (worktrees, launchers, git-safety hooks, team memory) but defines no agents
  (`discovery/agent-team-kit-assessment.md`).
- **Parallel agents share files.** `SKILL.md`, the eval set, `mentor/tools.mjs` and the panel's
  requests are each touched by more than one kind of work (CLAUDE.md, next step 1). Two agents
  editing one file in parallel means merge conflicts.
- **Evals only count if the builder can't change them.** The 25/25 baseline (2026-10-12) means
  something because the cases weren't written to pass.
- **Subagents can't start subagents**, so the main session has to be the one that sends work
  out and merges it.
- **The panel and the evals are tied.** `panel/test/requests-eval-sync.test.js` requires the
  panel's button requests to match eval cases 17-20 word for word.

## Options considered

1. **No personas: the main session does everything, with generic subagents when needed.**
   - *Pros:* nothing to set up or maintain.
   - *Cons:* no reusable team for the sprint goal; every task re-explains the rules; nothing
     keeps a builder from editing its own evals. Rejected untested.
2. **A few broad roles** (one builder, one researcher, one reviewer).
   - *Pros:* fewer files, fewer hand-offs.
   - *Cons:* one builder owns both skills and panel, so two panel and skill tasks can't run at
     once without sharing files; one researcher mixes forum-level evidence about how to teach
     After Effects into the beliefs about users. Rejected untested.
3. **Narrow roles, each owning its own files** (chosen).
   - *Pros:* parallel agents never edit the same file; whoever checks the work is never the one
     who made it; each persona's project details sit in one "In this repo" section, so copying
     it to another project means rewriting one section.
   - *Cons:* more hand-offs, and more files to keep in step (the team rules are repeated in
     every persona).
4. **Install the kit wholesale with its `install.sh`.**
   - *Cons:* it adds three sections to CLAUDE.md, a `.claude/*` ignore rule, a `pre-push` hook
     that runs `pnpm` (this repo uses npm), and web-app skills that clash with Spec Kit. Rejected
     after reading it, not after running it.

## Decision

**Option 3: ten narrow personas in `.claude/agents/`, each owning its own files, with the main
session as the cockpit.**

Deciding reason: **one owner per set of files**, so agents can work in parallel without
conflicts, and nobody checks their own work.

| Agent | Owns |
|---|---|
| curriculum-researcher | Research briefs, `discovery/curriculum-research/` |
| curriculum-designer | The teaching design: `specs/NNN-name/teaching-design.md`, or `curriculum.md` for the curriculum spec |
| spec-writer | `spec.md`, `plan.md`, `tasks.md` |
| ui-designer | Mockups, `product/mockups/` |
| design-reviewer | Findings only (read only) |
| skill-builder | Skill prompts, `mentor/`, their unit tests |
| panel-builder | `panel/` and its tests |
| eval-engineer | `product/evals/` |
| reviewer | Findings only (read only, plus running tests) |
| user-researcher | Interviews, `discovery/insights.md`, personas, competitors |
| cockpit (main session) | Sending work out, assigning numbers, merging, pushing when asked |

**The line between curriculum-designer and spec-writer.** The curriculum designer owns **what is
taught**; the spec writer owns **the spec document**. The designer decides the learning outcomes,
the order of steps, what the lesson doesn't teach, what the mentor checks at each step, the
overlaps, and which skills exist in what order. The spec writer decides the structure,
requirement IDs, the measure and target for each outcome, what the release doesn't build, which
tool, test or eval proves each check, priorities, plan and tasks. They write separate files in
the same spec folder. The spec links to the teaching design instead of copying it, and neither
edits the other's file: disagreements go back as questions. Both personas carry the same table.

**Not decided here: which pieces of the kit to adopt.** The assessment recommends worktree mode,
the launchers, `merge-worktree`, the git safety in `bash-guard`, team memory and about 8 memory
items, and skipping the release, database and web-app pieces. That needs its own decision,
together with the After Effects lock hook and the rule for handing out numbers.

## What would change our mind

- **If two agents edit the same file in one parallel run**, **then** the ownership table is
  wrong for that file: give it one owner or split the file before the next run.
- **If a teaching spec takes more than two rounds of questions between curriculum-designer and
  spec-writer** (counted in the parallel-run notes), **then** merge the two for teaching specs,
  or have the designer write a draft spec that the spec writer only structures.
- **If the eval engineer's proposed fixes keep being skipped, or a builder edits eval files**,
  **then** enforce the line in tools (a hook that blocks writes outside each agent's folders),
  not just in the persona.
- **If copying the team to the portfolio site takes more than rewriting each "In this repo"
  section**, **then** pull what had to change out of the general part of each persona.
- **If a read-only reviewer changes a file**, **then** add a `PreToolUse` hook that blocks it.
  *2026-10-19 (`decisions/008`):* ownership and the read-only rule are now enforced by a hook
  before any violation, amending this signal and the "a builder edits eval files" one above.
- **If the hand-offs make a parallel build slower than building it alone** (sprint 3 notes on
  time and quality), **then** cut back to the roles that actually ran in parallel.
