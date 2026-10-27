# Sprint 3 Review

**Window:** 2026-10-13 13:10 (the plan's first commit) to 2026-10-26 (evening, local time)
**Sessions reviewed:** 662 across 7 project groups (Claude Code 662, Codex 0; 8 sessions excluded
at your request). The groups are this repo, two of its worktrees, the mentor's runtime folder,
325 temporary mentor runtime folders and the system temp folder (eval and headless lesson runs),
Operation Food Critic and the portfolio site. 582 sessions were non-interactive (`claude -p`) and
80 were interactive.
**Not visible to this review:** Claude Code on the web (cloud sessions).

## Where the work lives

| Repo | Commits in window | Shared with sdmurff |
|---|---|---|
| `lmkirkpat/lancemk_msb341` (public) | 414 on all branches, 382 on `main` | Yes |
| `lmkirkpat/lancekirkpatrick.com` (private, the portfolio site) | 55 on all branches, 10 on `main` | No (collaborator check returned 404) |
| `lmkirkpat/operation-food-critic` (private) | 9 | No (collaborator check returned 404) |

Knack has no hosted version; the panel installs locally.

Portfolio site, merged pull requests in the window:
- 10-13: about page (spec 005, #14)
- 10-19: SEO and link previews (spec 006, #15); home page (spec 002, #16); hero crops, phone hero,
  case study header and card accessibility (#17); brand palette and type (spec 007, #18);
  signature motion and depth (spec 008, #19); branded link-preview card (spec 009, #20); dark-only
  site and arcs (spec 008, #21); arcs only where they clear the hero copy (#22); case study
  spacing and coming-soon list (#23)

Operation Food Critic, all on 10-26: repo set up with the playbook structure, Spec Kit and the
agent team from this repo; identity probe passed; sprint structure for a personal project; sprint
1 plan; sprint skills renamed; desk research (Beli, import sources, alternatives, a side-by-side
script); first beliefs; parallel run 1 logged (two researchers); decision 001 on carry-over.

## When you worked

8 of 14 days had activity: Oct 13, 19, 20, 21, 23, 24, 25 and 26. There was no activity from
Oct 14 to Oct 18 or on Oct 22. Commits in this repo by day: 1 on Oct 13, 14 on Oct 19, 42 on
Oct 20, 55 on Oct 21, 33 on Oct 23, 48 on Oct 24, 23 on Oct 25 and 198 on Oct 26. Oct 26 had 48%
of this repo's commits and about 300 of your own prompts (about 64% of them), most in one
evening of live sittings and live lessons.

## Where you got stuck

1. **Usage limits during parallel runs.** Run 3 (wave B plus skills 5 and 6, Oct 23 to 25) hit
   seven usage-limit stalls. Prompts from Oct 23 and 25 ask whether work continued after a reset
   and to carry on a skill 6 build that ran out. After the second stall, runs went to one Opus
   agent at a time (`discovery/usage-notes/parallel-runs.md`). The run finished on Oct 25 and 26.
2. **Hooks and permissions for unattended agents.** On Oct 19 and 20 you ran a series of probe
   prompts (identity probes, `onFailure` probes, a guard hook test, an AE lock test), and the
   identity probe was run again on Oct 21 and 26. Hooks blocked 18 tool calls in the window. On
   Oct 26 you asked why bypass mode wasn't showing and whether overnight runs would stop for
   permissions; that night the AE lock was fixed to key on session plus agent, and a session in
   the skill 6 worktree hit a permission-denied error. Each was fixed the same day, and
   `decisions/008` got an amendment and a list of five git guard gaps not yet fixed.
3. **Skill 5, set the pivot.** The live sitting (Oct 26 evening) included a Pan Behind tool that
   showed no anchor point, an undo that undid the wrong step, and a drag that didn't work. The
   findings (Pan Behind on a shape's group is invisible to the snapshot; with Position keyed it
   adds a key; it acts on the layer under the cursor) led to spec 011 rounds 2 to 7 and phases 8c
   to 8h in one evening. The skill merged on Oct 26. The review self-note leak is still open after
   two wording fixes, and the next step is a tool change.

A smaller one: `/next-mentor`'s "teach me masking" test (T047) was run three times on Oct 26
before a two-sentence fix passed it.

## What took the most time

The scan does not report session durations, so this is by prompt volume and commits.

- **Live sittings and live lessons on Oct 26:** most of that day's prompts were the learner side
  of lessons and sittings for all five skills (speed graph, key types, offset, pivot, null), plus
  the logging after each one.
- **Eval runs:** 239 judge prompts and 328 headless skill loads in the window, most on Oct 26 for
  skills 5 and 6.
- **Setting up the agent team (Oct 19 and 20):** 125 of your prompts, split between personas,
  `/agent-audit`, hooks and probes, the `/learn` sessions, and the portfolio site.
- **Portfolio site (Oct 19):** 47 commits and 9 merged pull requests in one day.
- **Spec 004 and the five skill specs (Oct 20 to 24):** 167 commits in this repo across those
  days, most by subagents (spec-writer 29 runs, skill-builder 24, curriculum-designer 15).

## Builder tools you used

| Tool | What it is | What you used this sprint |
|---|---|---|
| Skills you wrote | Your own reusable instructions | write-spec (7), merge-worktree (7), usage-session (5), decision (3), ease-mentor (2), claude-api (2), speckit-implement (2), speckit-plan (2), speckit-analyze (2), ship-feature (1); the mentor skills as slash commands below |
| Course skills | The course's sprint and learning skills | sprint-plan (6), sprint-review (1), sprint-coach (1) |
| Plugins | Skills or agents installed from a plugin | not used |
| Slash commands | Commands typed at the prompt | ease-mentor (257), anchor-mentor (40), clear (32), null-parenting-mentor (26), offset-mentor (9), speed-graph-mentor (8), key-types-mentor (6), mcp (5), usage-session (3), next-mentor (3) |
| Hooks | Scripts the harness runs on events | ran: PreToolUse:Bash (21), SessionStart (21); blocked: PreToolUse:Bash (12), PreToolUse:Write (2), After Effects tool calls (4) |
| Subagents | Agents started from a session | named: spec-writer (29), skill-builder (24), curriculum-designer (15), reviewer (14), design-reviewer (14), qa-auditor (12), eval-engineer (9), curriculum-researcher (4), user-researcher (3), case-study-editor (1)<br>built-in: none |
| Messages to other sessions | Messages sent to subagents or other sessions | to a subagent (60), listed reachable sessions (1) |
| Plan mode | Planning before acting | 3 turns in plan mode, 2 ExitPlanMode calls |
| Permission mode | The mode each turn ran in | `default` (694), `bypassPermissions` (515), `auto` (297), `plan` (3) |
| Permission prompts and denials | Prompts answered and calls denied | allowed by a rule (1243), you approved (73), you approved and saved a rule (4), denied by a rule (4), blocked by auto mode (3), you declined (2), blocked by a safety check (1) |
| Where sessions ran | Interactive or headless | non-interactive, `claude -p` (582); interactive terminal (80) |
| Worktrees | Sessions started in a worktree | none by the scan's count (it counts sessions that use the worktree feature); 3 sessions ran in this repo's git worktrees |
| Memory and instructions | Files loaded into sessions | CLAUDE.md loaded 95 times, MEMORY.md 87; edited: CLAUDE.md (55), constitution.md (4), 4 memory files and MEMORY.md (1) |
| Reaching outside the repo | CLI tools, MCP servers, direct API calls | CLI: gh (115), vercel (50), supabase (26); MCP: ae-mentor (1359), after-effects (187), claude-in-chrome (125), vercel (3); direct calls: curl (31) |

Not used this sprint: plugins, built-in subagents.

Scan version: sprint_scan 2026-10-16.

## Users this sprint

No outside users this sprint. The scan's hits were the eval judge's prompts (which read like
user reports) and a merge of your own portfolio pull request.

## Learning sessions

2 `/learn` sessions logged, both Agentic Workflow.

| Date | Section | Axis | Minutes | Asked about | Start, confidence | Still asking |
|---|---|---|---|---|---|---|
| 2026-10-19 | Advice Versus Enforcement | Agentic Workflow | not measured (one session over two days) | chose it with Blast Radius as what you needed before running agents unattended | Proficient; Proficient to Strong | nothing specific |
| 2026-10-19 | Blast Radius | Agentic Workflow | not measured (same session) | same choice | Developing; Proficient to Strong | nothing specific |

You studied two Agentic Workflow sections, and the sprint advanced Agentic Workflow.

## Axis

**Agentic Workflow.** Most of the work was the agent team itself (ten personas, ownership and AE
lock hooks, a git guard, `/merge-worktree`), three parallel runs, five teaching skills with their
evals, and copying the setup into a second project.

## Against your plan

**Goal was:** a developed agent workflow, with a team of subagents and personas that can be
adapted to future projects and work in parallel; with it, build new teaching skills beyond
easing, and lay the groundwork for the UI redesign, diagnostics and an installer.

- **Agent team with a setup README:** met. Ten personas in `.claude/agents/`, hooks in
  `.claude/hooks/` (39 tests), and the team README in `.claude/README.md`.
- **Carry-over proof:** met with the Oct 26 change. The plan moved the proof from the portfolio
  site to Operation Food Critic (your change, with your reason in the plan): the hooks,
  `/merge-worktree` and Spec Kit copied over, ten personas cut to seven, and a two-researcher
  parallel run with no collisions. Your caveat stands: that run was documents only.
- **Parallel work with time and quality notes:** met. Three runs in
  `discovery/usage-notes/parallel-runs.md`; run 2 built spec 004's shared code and skills 008 to
  010 in 96 minutes against an estimated 4 to 5 days solo.
- **5 new teaching skills, each run live, with eval cases:** partly met. All five (key types,
  speed graph, offset, set the pivot, move a group with a null) are on `main`, and each passed a
  first live lesson. Eval cases exist for all five on unmerged branches (`evals-wave-a`,
  `evals-skill-5`, `evals-skill-6`), with dry runs and smoke runs only; none has a baseline yet,
  and the wave A sets were being moved to live captures at the end of the window. The cut from 10
  skills to 5 on Oct 20 was your change, with your reason in the plan.
- **Specs for curriculum, diagnostics, installer and UI overhaul:** met. Specs 004 to 007 are
  approved; 004 is built and done, and 005 to 007 have no plan or tasks yet.

The work matches the goal. The open part is the eval baselines for the five new skills.

---

## Your retro

*The builder's own answers, recorded word for word in step 7.*

**Did you hit the goal?** Yes, mostly. My main goal for this sprint was to build out a team of agents and learn to execute agentic workflows. I definitely met that part of the goal. To put my new agents to use, I speced and tested 5 new mentor skills, speced a UI redesign and an installer, and started work on general diagnosis capabilities. I also showed the agents were transferrable to other projects. The one loose end was that I didn't have enough time to run eval baselines for the new skills.

**What did the report show you?** I didn't realize how much usage limits got in the way of my work. I definitely felt it was frustrating, but I didn't realize how much I was slowed down.

**If the plan changed, why?** The plan changed to put things back in scope. My original plan was quite ambitious, and I decided to pull back so that I could execute a smaller scope well, rather than doing a larger scope slopily.

**Actual difficulty:** 4. Predicted difficulty was correct. I had to learn a lot of new skills for this sprint and it pushed my knowledge, but I was able to achieve all of it in the end.

**What will you change next sprint?** I will go in with a clearer plan of what is possible in two weeks using a team of agents. Now that I have experience with them, I have a better idea of what a reasonable sprint scope is.
