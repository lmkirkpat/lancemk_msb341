# Mentor panel: usage notes

Live runs of the AE Mentor panel (spec 003) on **Mentor Practice** in `discovery/Claude AE Tutor
Test.aep`. Each session logs results against the success criteria in
`specs/003-mentor-panel/spec.md`. Turn timings and cost come from `panel-turns.jsonl`
(`node panel/dev/turns.js`), and tool calls from `calls.jsonl`.

## Session 1: YYYY-MM-DD (T017, User Story 1)

### Steps (quickstart §4)

| Step | What happened | Matches the expected result? |
|---|---|---|
| a. Opening (Start lesson) | | |
| b. Explain with a frame (Ask the mentor) | | |
| c. Demo (Show me) | | |
| c2. Show me again (nothing changes in AE) | | |
| d. Partial (Check my work) | | |
| e. Hint | | |
| f. Complete (Check my work) | | |

Typed in a terminal during the lesson? (SC-001: must be no)

## SC-002: checks (10 needed: ≥ 3 partial, ≥ 2 outside the lesson, ≥ 1 undone)

| # | Lesson | Attempt type | What I did | Panel list | My verdict (Graph Editor) | Agree? |
|---|---|---|---|---|---|---|

## SC-003: project changes

| Lesson | ok `set_ease` calls (`calls.jsonl`) | After Show me again? |
|---|---|---|

## SC-004 / SC-005: speed and cost (`node panel/dev/turns.js`)

| Date | Turns | First activity ≤ 10 s | Median first activity | Median first words | Lesson durations | Cost per lesson |
|---|---|---|---|---|---|---|

## SC-006: memory section vs `learner.json`

| Check | Memory section showed | `learner.json` says | Match? |
|---|---|---|---|
| No record | | | |
| After one lesson | | | |
| After a second lesson | | | |

## Edge cases (quickstart §6)

| Case | Result |
|---|---|

## SC-008: did the panel change how I learn?

After at least 2 panel lessons: compared with the terminal, and whether I reached for Adobe's
assistant instead.
