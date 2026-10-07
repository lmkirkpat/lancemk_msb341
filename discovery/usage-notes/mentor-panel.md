# Mentor panel: usage notes

Live runs of the AE Mentor panel (spec 003) on **Mentor Practice** in `discovery/Claude AE Tutor
Test.aep`. Each session logs results against the success criteria in
`specs/003-mentor-panel/spec.md`. Turn timings and cost come from `panel-turns.jsonl`
(`node panel/dev/turns.js`), and tool calls from `calls.jsonl`.

## Session 1: 2026-10-05 to 2026-10-06 (T017, User Story 1)

One lesson, started in the evening and finished the next day. The mentor picked up from the
learner record (Subtitle passed earlier) and proposed **Glow › Gaussian Blur › Blurriness**, a
single pair on an effect property. Nothing was typed in a terminal (SC-001 ✓).

### Steps (quickstart §4)

| Step | What happened | Matches the expected result? |
|---|---|---|
| a. Opening (Start lesson) | Opened from memory, named the 11 linear pairs, proposed Glow. Pressed twice by accident, so two `start` turns | Yes |
| b. Explain with a frame (Ask the mentor) | "let's start with glow": frame at 0.5 s, how to find effect keys with U | Yes |
| c. Demo (Show me) | Eased the **only** Glow pair, so the demo did the whole lesson. It told me to undo it and redo it myself | **No: problem 2** |
| c2. Show me again | Not run | — |
| d. Partial | Undid the demo, eased one of the two keys, asked "why does it still look mechanical?". The check reported the pair as plain linear, and the mentor said my demo ease "isn't there anymore" | **No: problem 1** |
| e. Hint | Not run | — |
| f. Complete (Check my work) | Eased the other key. The check credited the pair to the **demo** and passed with 0 pairs of mine. The mentor said honestly it couldn't tell who eased it | **No: problem 2** |

**Problems found, all fixed 2026-10-06 (spec 002 FR-006/FR-007 amended):**

1. **A half-eased pair read as "linear".** `segmentState` called a pair linear if *either* side
   was linear, so "one key eased" looked like "nothing done". New state `partly_eased`, with the
   key that's still linear, shown as "half eased" in the panel. `SKILL.md` explains it ("eases at
   one end, still stops hard at the other") and checks before answering "how does it look now?".
2. **A one-pair focus let the demo take the whole lesson,** and an undone-then-redone demo pair
   was credited to the demo. Now there's no demo when the focus has one pair. Once a check sees
   the demo undone, the pair is the learner's. An undo **without** a check in between is caught by
   the demo's fingerprint: the demo sets influence 33.33 and F9 records 33.333 (seen in the real
   captures). An eased demo pair with neither side at 33.33 was redone by the learner. If a
   snapshot has no ease values to compare, the mentor asks (options A + C, chosen 2026-10-06).
3. **The builder's output style leaked into the mentor.** The repo's `.claude/settings.local.json`
   sets Explanatory, and headless runs picked it up: the last reply ended with a "★ Insight"
   note meant for the builder. The baseline eval results (`2026-10-05-1611.json`) contain the same
   notes. The panel and the eval runner now launch with `outputStyle: default` (verified with the
   init line's `output_style`).
4. **Minor:** the turn log's `at` was the turn's end, not when it was sent. Fixed.

New eval cases: 21 (single pair, no demo), 22 (half eased, "why mechanical?"), 23 (undo, then
redo after a check), 24 (undo and redo with no check in between).

## SC-002: checks (10 needed: ≥ 3 partial, ≥ 2 outside the lesson, ≥ 1 undone)

| # | Lesson | Attempt type | What I did | Panel list | My verdict (Graph Editor) | Agree? |
|---|---|---|---|---|---|---|

## SC-003: project changes

| Lesson | ok `set_ease` calls (`calls.jsonl`) | After Show me again? |
|---|---|---|

## SC-004 / SC-005: speed and cost (`node panel/dev/turns.js`)

| Date | Turns | First activity ≤ 10 s | Median first activity | Median first words | Lesson durations | Cost per lesson |
|---|---|---|---|---|---|---|
| 2026-10-06 | 6 | 6/6 ✓ (worst 8.5 s) | 4.7 s | 14.1 s | not meaningful (finished the next day) | $0.50 |

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
