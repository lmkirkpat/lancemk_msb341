# Agent team setup

A team of ten Claude Code subagents that build, design, research and check work in parallel, with
your main session as the **cockpit** that sends work out and merges it back. Built for Knack (an
After Effects mentor), and written so you can copy it into another project.

Why it's shaped this way: `decisions/007` (the roster and who owns what) and `decisions/008` (the
guardrails, and what was tested). This file is the how-to.

## How it works, in four rules

1. **One owner per set of files.** Each persona writes only its own files, so parallel agents
   don't collide and nobody checks their own work. A hook enforces it.
2. **The cockpit runs the show.** Subagents can't start other subagents, so your main session
   sends work out, hands out numbers (spec, decision, eval case), merges branches and pushes when
   you ask. Subagents never push, merge or rebase. A hook enforces that too, and every push the
   cockpit makes stops and asks you first.
3. **Builders work in their own git worktree** when others run at the same time, and commit on
   their own branch. The cockpit merges with `/merge-worktree`.
4. **One agent at a time on a shared single resource.** Here that's After Effects (one app, one
   bridge, one `.aep`). A hook gives it to the first caller and frees it when that agent stops.

## The team

| Persona | Does | Writes |
|---|---|---|
| `curriculum-researcher` | Research briefs on how a skill is taught | `discovery/curriculum-research/` |
| `curriculum-designer` | What a lesson teaches and in what order | `teaching-design.md`, `curriculum.md` |
| `spec-writer` | Specs, plans, tasks | `specs/` (not the teaching design) |
| `ui-designer` | Flows and mockups | `product/mockups/` |
| `design-reviewer` | Reviews designs | nothing (read only) |
| `skill-builder` | Teaching skills, mentor tools, unit tests | `mentor/`, `bridge/`, `.claude/skills/*-mentor/` |
| `panel-builder` | The in-app panel | `panel/` |
| `eval-engineer` | Eval cases, runs, triage | `product/evals/` |
| `reviewer` | Reviews branches before merge | nothing (read only, runs tests) |
| `user-researcher` | Interviews, beliefs, competitors | `discovery/` |

The exact paths are in `.claude/hooks/ownership.json`, which is what the hook reads. Seven
personas run on Opus and three on Sonnet (the `model:` line in each file).

## What's in this folder

| Path | What it is |
|---|---|
| `agents/*.md` | The ten personas. Each ends with an **In this repo** section: the only part that's project-specific |
| `hooks/ae-lock.mjs` | One agent at a time on After Effects. 10-minute idle lease, freed on `SubagentStop` |
| `hooks/ownership.mjs` + `ownership.json` | Blocks a subagent's `Write`/`Edit` outside its row. The cockpit isn't restricted |
| `hooks/git-guard.mjs` | Blocks blanket `git add`, `commit -a`, `reset --hard`, `clean -f`, `stash` and force-push for everyone; push, merge, rebase, removing worktrees, deleting branches, and switching branches in the shared tree for subagents. Makes every cockpit push ask you |
| `hooks/ae-script-guard.mjs` | Blocks a subagent's `ae_run_script` from reaching past the comp: shell (`callSystem`), saving the `.aep`, deleting or writing files, quitting AE |
| `hooks/check-branch.mjs` | Run at merge: lists files a branch changed outside its persona's row (catches writes through Bash, which the ownership hook can't see) |
| `hooks/probe/identity.mjs` | Checks that hooks can still tell agents apart (see "Check it works") |
| `hooks/test/` | Unit tests for all of the above |
| `settings.json` | Wires the hooks in, and sets the permission rules: auto mode, no bypass mode, ask before `git push`, deny secrets and actions that reach other people (email, sharing, deploys) |
| `skills/merge-worktree/` | The cockpit's merge: ownership check, number check, one branch at a time, never pushes |

All hooks use Node built-ins only and **fail closed** in two layers. In the code: if a hook
can't read its input, it blocks the call and says why. In `settings.json`: every `PreToolUse`
hook has `"onFailure": "block"`, so a crash, a timeout or a missing `node` blocks too. Without
it, Claude Code treats any exit other than 0 or 2 as the hook failing and lets the call through
(probed 2026-10-20, Claude Code 2.1.304; needs 2.1.295 or later).

## Copy it to another project

1. **Copy** `.claude/agents/`, `.claude/hooks/`, `.claude/skills/merge-worktree/`, and the
   `hooks` and `permissions` blocks of `.claude/settings.json` (merge them into yours if you have
   one). Edit the deny list to fit: this repo denies the whole Vercel server and `vercel *`
   because it never deploys; a web project that deploys should switch those to `ask`.
2. **Rewrite each persona's "In this repo" section**: where things live, how to run tests, the
   project's rules. Leave the rest of the persona alone; that's the reusable part. Delete personas
   you don't need (a project without a curriculum doesn't need the two curriculum agents).
3. **Rewrite `ownership.json`** to match. Patterns apply in order, the last match wins, and `!`
   takes a path back out. An unlisted persona writes nothing.
4. **Decide about the lock.** If your project has one shared thing two agents mustn't drive at
   once (an app, a database migration, a device), point the `ae-lock.mjs` matcher in
   `settings.json` at its tools and rename it. If not, delete that hook and its `SubagentStop`
   entry.
5. **Install the user-level skills the personas call**, or remove the lines that mention them.
   These live in `~/.claude/skills/`, not in this repo:
   `agent-audit` (reviewer, skill-builder), `eval-set` and `eval-triage` (eval-engineer),
   `overlap-audit` (curriculum-designer), `interview-log`, `insights-review` and `side-by-side`
   (user-researcher). Spec Kit (`/speckit-*`, spec-writer and builders) is in `.claude/skills/`.
6. **Restart Claude Code** (or approve the hooks in `/hooks`) so the hooks load, then run the
   checks below.

## Check it works

```bash
node --test .claude/hooks/test/*.test.mjs   # unit tests, free
node .claude/hooks/probe/identity.mjs    # one headless run, about $0.50
```

The probe answers the one question everything depends on: do hooks still receive `agent_type` and
`agent_id` for a subagent's calls, and nothing for the cockpit's? Subagents share the cockpit's
`session_id`, so identity is the only way to tell them apart. If a Claude Code update stops
sending it, every hook silently waves subagents through. **Run it before each sprint's first
parallel run and after updating Claude Code.** A FAIL means: no parallel runs until it's fixed.

To see the hooks are loaded in your session, run a harmless `echo "git reset --hard"`: the git
guard should block it.

## Run a parallel job

1. **Plan in the cockpit.** Decide the pieces, which persona does each, and hand out any numbers
   (spec `012`, eval case `26`) in the prompt. Numbers taken by agents themselves collide.
2. **Commit and push first.** `git status --short` should be empty, including the `.aep`. A
   worktree is a fresh checkout of `origin/main`, not your local `main`, so unpushed commits and
   uncommitted changes (a CLAUDE.md edit, say) never reach it, and a subagent's edits aren't
   covered by `/rewind`: the commit is the way back.
3. **Stagger the launches.** At most **3 Opus agents at once**; Sonnet personas (the two
   researchers, eval-engineer) can add up to 3 more. Launch the next agent as one hands back, and
   start anything that depends on another's output (a mockup on its spec, a spec on its teaching
   design) only after that output is merged. Run 1 launched nine Opus agents in 13 minutes and
   stalled for 80 on the usage limit.
4. **Name one shared-code owner** for each build wave (spec 004 FR-032): the one branch that may
   change existing files under `mentor/`, `bridge/` and `.claude/skills/*-mentor/`. Every other
   builder only adds files (its own tool file, which `mentor/tools/index.mjs` finds) and hands
   back any change it needs to a shared file as a request. Build the shared pieces first, merge
   them, then start the parallel builders. `check-branch.mjs` enforces this at merge
   (`addOnly` in `ownership.json`).
5. **Spawn every persona that has Bash in a worktree** (`isolation: "worktree"`): skill-builder,
   panel-builder, eval-engineer, spec-writer, reviewer. The ownership hook can't see a write made
   through Bash; the merge check (`check-branch.mjs`) can, but only on a branch. Personas without
   Bash (researchers, designers, design-reviewer) can share the main tree, since the hook covers
   every write they can make.
6. **Stay off the shared resource** while a builder needs it. The cockpit never stops, so if it
   takes the lock, every subagent waits the full 10 idle minutes.
7. **Merge one branch at a time** with `/merge-worktree <branch> <persona>`. It stops on conflicts
   and on files outside the persona's row instead of guessing.
8. **Write down time and quality** compared with doing it alone. That's what tells you whether the
   team is worth it.

## Lessons so far

These come from building this team, not from a general guide.

- **Rules in prompts get broken; rules in tools don't.** Every hard rule here (ownership, one
  agent on AE, no push) started as a prompt line. The audit found each could be broken, so each
  became a hook.
- **Key on `agent_id`, not `session_id`.** Kits built for one terminal per agent key on
  `session_id`; subagents in one cockpit all share it.
- **A checker never edits what it checks.** The eval baseline means something only because the
  builder can't touch the cases.
- **Shared lists are merge hot spots.** Ten builders adding to one array means a conflict on every
  merge. Here each skill adds its own `mentor/tools/<skill>.mjs` and an index finds it.
- **Subagents hand back; they don't ask.** A subagent can't wait for your answer. Each persona
  says to stop and report what it needs instead.
- **Test hooks with a probe, not by trusting the docs.** Each question about hook input
  (identity, `SubagentStop`) was settled by a headless run with a logging hook, for well under $1.
