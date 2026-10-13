# Sprint 2 Review

**Window:** 2026-09-28 19:35 (plan committed) to 2026-10-12
**Sessions reviewed:** 369 across 32 projects (8 sessions excluded at your request)

- **Interactive (you typing in Claude Code):** 24 sessions, all in this repo. 171 prompts, about
  15 hours of active time.
- **Headless (`claude -p`), counted separately:** 345 sessions: eval cases, eval judge calls, and
  panel lessons. 248 learner-side prompts, about 4 hours. They sit in the repo folder (285)
  until 2026-10-12, then in the temp runtime folders (31) and the system temp folder (29, the
  judge). Panel lessons where you were the learner (panel sessions 1 and 2, T023, T033, T034)
  are in this group, so some of its time is yours.

Active time counts gaps of 30 minutes or less, after removing messages that resumed sessions
copied from earlier ones. 58 commits in the window.

## When you worked

10 of 15 calendar days: 09-28, 09-29, 09-30, 10-01, 10-02, 10-05, 10-06, 10-07, 10-08, and 10-12.
There were two pushes with gaps between them:

- **09-28 to 10-02 (about 5 hours):** the bridge test, decisions 003 and 004, Spec Kit, spec
  002 through tasks, and Phases 1–3. 10-02 was a single 5-minute session.
- **10-03 and 10-04:** no sessions (one commit just after midnight on 10-03).
- **10-05 to 10-08 (about 8 hours):** the busiest stretch. 10-05 was the largest day of the
  sprint: 3.4 hours, 58 prompts, and 19 commits (Phases 4–5, the eval baseline, raised goals,
  decision 005, and spec 003 from spec to build).
- **10-09 to 10-11:** no sessions.
- **10-12 (2.6 hours):** the finish: the rest of spec 003, the agent audit, interview 008, and
  a full eval run.

## Where you got stuck

1. **Panel session 1's teaching problems (10-06).**
   - **Symptoms:** the first real lesson in the panel turned up four problems. A half-eased
     pair read as linear. A focus with only one pair let the demo take the whole lesson. A
     demo you undid and redid yourself wasn't credited to you. The builder's output style
     leaked into headless runs.
   - **How long:** from about midday to 23:05, with two fix commits (83a406a, then the demo
     fingerprint in 68ae320). Eval case 21 failed once along the way.
   - **Ended:** all four fixed, cases 21–24 added, and a new baseline of 23/24.
2. **The learner record reset (10-07).**
   - **Symptoms:** `learner.json` came back empty between sessions. You hadn't touched it, and
     no code, transcript, or shell history explained it.
   - **Ended:** the cause was never found. The record was restored by merging the old folder
     back, and it was logged under To fix later. The guard against it (use `AE_MENTOR_HOME` or
     rename only the file) went into the quickstarts on 10-12.
3. **A change outside the focus that the check missed (10-08).**
   - **Symptoms:** Easy Ease on Logo › Rotation, which has an expression, didn't show up as a
     change. The teaching filter (skip properties with expressions) had been reused for change
     detection.
   - **How long:** about 70 minutes from report to fix (64adfdd), with regression tests and a
     live confirmation the same day.
   - **Ended:** it also produced the "edge cases where concepts overlap" rule now in
     CLAUDE.md and the spec workflow.

Smaller: getting the CEP panel to start Claude Code on 10-05. Node v17 and a short `PATH`
inside CEP needed one round of pasted diagnostics, and the panel was built the same evening.

## What took the most time

- **By active time (interactive):**
  - 10-05: 3.4 h
  - 10-12: 2.6 h
  - 09-30: 2.4 h
  - 10-08: 1.8 h
  - The other six days: 0.1–1.0 h each
- **By prompt volume:** 10-05 (58) and 10-08 (31) lead.
- **By kind of work:**
  - **Most of it:** building and testing the mentor, meaning the slice and panel tasks plus
    live lessons checked against the Graph Editor.
  - **Next:** spec and plan work through Spec Kit on 09-30, and spec 003 on 10-05.
  - **Discovery:** 3 interview logs, the insights review, the interview guide rewrite, and the
    Adobe side-by-side. Under an hour each, on 10-01, 10-08, and 10-12.
- **Headless:** 345 sessions and about 4 hours of machine time. Most came on 10-05 and 10-06
  (baseline evals, reruns after the panel session 1 fixes) and 10-12 (audit spot checks and
  the 25/25 run).

## Axis

**AI Systems.** The most time and prompts went into how the mentor behaves in the product:
- `SKILL.md` teaching rules
- the narrow tool contracts and the checks behind them
- an eval set grown from 16 to 25 cases with a separate judge, run to 25/25
- the agent audit's fixes for narration, record honesty, and runtime isolation

It is split with **Application Architecture** (the forked bridge, the MCP server, the CEP
panel, and 173 unit tests), which took the second-largest share.

## Against your plan

**Goal was:** spec the product, test the MCP bridge, decide the architecture, build a working
slice tested on one After Effects skill, and interview 3 more people in the target market.
Raised on 10-05: also a rudimentary mentor panel in AE that runs one easing lesson start to
finish and shows memory.

The work matches the goal. Every "done looks like" item in both lists is checked, and each has
a commit:

| Item | Done | Evidence |
|---|---|---|
| Spec before the build | 09-30 | Spec 002 at 12:34; first build commit at 14:21 |
| Bridge note | 09-28 | |
| `decisions/003` | 09-29 | |
| Slice running with usage notes | 10-05 | T028 |
| 3 interviews | 10-12 | 006 on 10-01, 007 on 10-08, 008 on 10-12 |
| `decisions/005` before spec 003 | 10-05 | 16:22, then spec 003 at 16:47 |
| Panel lesson a–f with nothing typed in the terminal | 10-07 | T017 |
| Same verdict in the panel and in Claude Code | 10-08 | SC-002, check 9 |
| Memory shown in the panel | 10-07 | |
| Panel usage notes | 10-06 | |

Work beyond both lists:
- spec 003 taken to Shipped, including continue-a-lesson and 10/10 edge cases
- the eval set
- the Adobe assistant side-by-side
- the agent audit

The third interview came on the last day of the window.
