# Sprint 4 Review

**Window:** 2026-10-28 (plan committed 10:49) to 2026-11-09
**Sessions reviewed:** 3,666 across 1,489 project folders (Claude Code 3,666, Codex 0; 34 sessions excluded at your request). Of these, 64 were sessions you worked in, in this repo and two of its worktrees. The other 3,602 were non-interactive `claude -p` runs started by the eval runners and the panel, in temporary runtime folders.
**Not visible to this review:** Claude in the desktop app, and the other macOS user profiles used for installer testing.

## Where the work lives

- **lmkirkpat/lancemk_msb341** (public, shared with sdmurff): 409 commits in the window, all by you, on 10 days. The days with the most commits were 2026-11-09 (198), 10-28 (81), 10-29 (37), 10-30 (37) and 11-04 (34). The eval results from the last run on 11-09 are not committed yet.
- **Live:** none. The panel is installed locally with `bash panel/install.sh` or the installer zip.

## When you worked

You worked on 10 of the 13 days: 10-28 to 10-31, 11-02 to 11-06, and 11-09. You did no interactive work on 11-01, 11-07 or 11-08, although eval runs started on 11-06 continued into the night.

Two periods hold most of the time. On 10-28 and 10-29 you spent about 14 hours in sessions and wrote 192 prompts. On 11-09 you spent about 16 hours of session time across 15 sessions, several of them running in parallel, and wrote 239 prompts. 11-09 also had 198 of the sprint's 409 commits. Between those two periods, sessions were shorter: 3 hours on 10-30, 1.7 hours on 11-02, 5.4 hours on 11-04, 1.7 hours on 11-06, and under an hour on the other days.

## Where you got stuck

1. **The installer on a fresh account (11-09, evening).** The first T017 run failed after the access key was pasted, and the installer said it couldn't finish installing. The cause was two bugs that the tests with fake payloads had not caught (`b45eea8`, `50c581a`). While cleaning up, deleting a test macOS profile left the machine freezing whenever you switched to a new profile. It ended with SC-002 passing on three new accounts (two standard, one admin), with a Rosetta stand-in because there was no Intel Mac.
2. **Usage limits.** Sessions hit the usage limit on 10-28, 10-29 and 11-09. On 10-29 work stopped for about two hours and on 11-09 for about one and a half. On 11-09 two sessions hit the limit at the same time. After the reset you cut the installer goal from three runs to one, then did all three anyway.
3. **How to fund option A (10-30 to 11-04).** It started with the question of which key the A runtime needs and whether an API key could draw on your account's usage limit. You pinned the question on 11-02 while you looked at funding options, then claimed $100 of API credit on 11-03 as the lean budget. On 11-04 you proposed building new features on B1 and shipping on A to keep API costs down, which became `decisions/011`. That decision was yours. The question of where testers' keys come from is still pinned.

There was also the T045 sitting on 11-09. Closing the panel during a demo ended the lesson and reset the learner record. It was fixed in `151c64f` and re-run clean. The warm-ups did not work at the last sitting and were moved to after the sprint.

## What took the most time

Measured as session time and prompts, not commits:

- **Eval pacing rules, re-baselines and the overlap audit (10-28 to 10-29):** about 14 hours and 192 prompts in two long sessions. That includes three rounds of fixes, re-runs of all six sets and about $400 of eval runs on B1. Most of your prompts were approvals ("yes go ahead", "approved the fix round") of fix rounds that the eval-engineer and skill-builder agents proposed.
- **Live testing on 11-09:** about 16 hours of session time across parallel sessions and 239 prompts. That covered six live lessons in the new panel (T028, T056 to T060), the T062 screen check, three easing lessons on A (T021), T045 and T048, and the installer's T004 and T017 to T020 on extra accounts.
- **Option A runtime (10-30, 11-03, 11-04):** about 9 hours. That covered the helper package, the adapter, `--runtime a|b1` in the eval runners, the smoke check, and all six eval sets on A.
- **UI mockup revision (11-02):** about 1.7 hours. You left notes on wireframe copies and then did a copy pass.

The eval runners and panel runs also started 3,602 non-interactive sessions. Most were on 10-28 and 10-29 (about 3,600 prompts) and on 11-09 (about 1,700).

## Builder tools you used

| Building block | What it is | What you used this sprint |
|---|---|---|
| Skills you wrote | Your own skills in `.claude/skills/` or `~/.claude/skills/` | merge-worktree (21), decision (8), usage-session (3), speckit-implement (2), speckit-plan (2), speckit-analyze (2), ease-mentor (2), agent-audit (1), overlap-audit (1); claude-api (3, built in) |
| Course skills | The class skills | sprint-plan (4), sprint-review (2), sprint-coach (1); eli5 (2, as a slash command) |
| Plugins | Skills or agents installed from a plugin | not used |
| Slash commands | Commands typed at the prompt | clear (19), ease-mentor (10), mcp (5), compact (5), output-style (2), null-parenting-mentor (2); in eval and panel runs: anchor-mentor (471), null-parenting-mentor (390), speed-graph-mentor (208), offset-mentor (199), key-types-mentor (156), ease-mentor (120), next-mentor (13) |
| Hooks | Scripts that run on tool calls | PreToolUse:Bash ran 2 times; hooks blocked 13 calls (Bash 8, Write 1, AE status, run-script and preview 1 each) |
| Subagents | Agents the main session sends work to | Named: eval-engineer (48), skill-builder (35), panel-builder (29), spec-writer (25), curriculum-designer (12), reviewer (9), ui-designer (2), user-researcher (1). Built-in: general-purpose (5) |
| Messages to other sessions | Messages sent to subagents or other sessions | to a subagent (58), listed reachable sessions (4) |
| Plan mode | Planning before acting | not used |
| Permission mode | How tool calls are approved | `bypassPermissions` (833 turns), `auto` (88), `default` (2) in your sessions; `default` in the eval and panel runs |
| Permission prompts and denials | Prompts answered and calls denied | You approved 17 and declined 1. A rule allowed 10. A built-in safety check blocked 1. In the runs, a rule allowed 5,335 and denied 3 |
| Where sessions ran | Interactive or headless | interactive in the terminal (62); non-interactive with `claude -p` (3,604) |
| Worktrees | Separate git checkouts for agents | the scan recorded none, but two worktree folders (`rebaseline-a`, `skill-6-null`) had one session each, and `/merge-worktree` ran 21 times |
| Memory and instructions | Files loaded into each session | CLAUDE.md loaded 73 times and MEMORY.md 69 times. Files edited: CLAUDE.md 62 times, constitution.md 4, MEMORY.md 2, panel-copy-voice.md 2, push-only-when-asked.md 1, easing-regression-shared-run.md 1 |
| Reaching outside the repo | CLI tools, MCP servers, direct API calls | CLI tools: supabase (26), vercel (23), gh (15). MCP servers: ae-mentor (89 in your sessions, 5,335 in the runs), after-effects (78), claude-artifacts (77). Direct API calls: curl (8) |

Not used this sprint: plan mode, plugins.

Scan version: sprint_scan 2026-10-16.

## Users this sprint

No outside users this sprint. The scan flagged a "user report" on many eval judge prompts and one of your own prompts. All of them came from you or the eval runner. The three installer accounts were your own test profiles.

## Learning sessions

None logged this sprint.

## Axis

**Application Architecture.** Most of the sprint built and tested how Knack runs and ships: the option A runtime that calls the Claude API directly (cost and latency measured in T021 and T048, plus the saved conversation), the installer on new accounts, and the panel's tests and error handling. The work was split. The eval pacing and re-baseline work on 10-28 and 10-29 (Agentic Workflow) took about as many session hours.

## Against your plan

**Goal was:** an overhauled UI for the mentor panel that makes lessons easier to follow and more engaging, with the new curriculum flows from sprint 3's skills, plus the option A runtime and an installer that lets other users install Knack on their own devices.

Most of the work matches the goal. Checking each "done looks like" item on 2026-11-09:

- **All six skills as live lessons in the new panel:** done on B1 (T028, T056 to T060).
- **A usage session comparing the new panel with the current one, checked against spec 007's success criteria:** partly done. T001 and T028 compared the two panels and you prefer the new one. SC-002's live half and SC-010 at the default dock passed. T071 to T074 are still open, so the box is unchecked.
- **Option A runtime built, with easing and pivot proven on it:** built and merged, with all six eval sets run on A. Easing was proven live on A (T021, T045, T048). Pivot was proven by evals on A (50/51), not by a live lesson. The box is unchecked in the plan.
- **Knack installed with the installer on a fresh account:** done (SC-002, 3 of 3).
- **Eval baselines for the five new skills:** done on 10-28 and 10-29.
- **The five skills' live reviews (T035, T038, T040, T240, T343):** not done.
- **Stretch, an outside tester installs Knack:** not done. It is blocked on where testers' keys come from (spec 006 Q2).

The installer reached a fresh account but no one else's device, so "other users" is not proven yet.

---

## Your retro

*The builder's own answers, recorded word for word in step 7.*

**Did you hit the goal?** partly. I got live lessons for all six skills, the installer on a fresh account, and eval baselines. I mostly got runtime option A (running via API) built, but not tested on all live cases. I didn't get an outside user to test anything and I didn't get the five live reviews due to time limits. Everything got most of the way there, but I ran out of time to finish everything including evals and live tests.

**What did the report show you?** I didn't realize how few app architecture concepts I touched last sprint. In hindsight, that makes sense and most of the work I was setting up to do got done this sprint, but I didn't realize that at first

**If the plan changed, why?** skip

**Actual difficulty:** 4.5 I think it was harder because I didn't realize how much time needed to be spent on evals and live testing. I also didn't realize what would go into testing installs, which ended up taking me much longer than I anticipated.

**What will you change next sprint?** I will make sure I have something running each day so that I don't have to cram things at the end of the two weeks
