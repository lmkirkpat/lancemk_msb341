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

## Session 2: 2026-10-07 (T017 re-run, User Story 1)

One lesson on **Title** (4 linear pairs), started with no earlier lessons in the learner record,
so the mentor opened as a first lesson. Every step from a to f ran, including Show me again and a
hint. Nothing was typed in a terminal (SC-001 ✓). Passed in 5.5 min.

### Steps (quickstart §4)

| Step | What happened | Matches the expected result? |
|---|---|---|
| a. Opening (Start lesson) | First-lesson opening, named the 11 linear pairs; I chose Title | Yes |
| b. Explain with a frame | Frame at 1 s, halfway through Title's move | Yes |
| c. Demo (Show me) | Eased one pair only: Position 0.5 s → 1.5 s. Pointed to Edit > Undo | Yes |
| c2. Show me again | Explained the demo pair with two frames, checked first, changed nothing | Yes |
| d. Partial ("why does it still look mechanical?") | Checked first, answered from the check: only the demo pair eased, other three linear. **Quirk:** printed "Must call diff first." before the check | Yes, with the quirk |
| d2. Partial (Check my work) | Scale shown as half done, naming the key still linear at 1.5 s | Yes |
| e. Hint | Checked first, "nothing has changed", then F9 only eases selected keys | Yes |
| f. Complete (Check my work, twice) | Second check: Scale and Opacity done by me, one pair left. Third: passed, all 4 pairs, `record_lesson` saved | Yes |

All checks matched the Graph Editor, and the mentor's writing was clear, focused, and easy to
follow (builder's read).

**Quirk: a rule leaked into the chat.** Before answering "why does it still look mechanical?"
the mentor wrote "Must call diff first." as its own text, then made the call. This is the
mentor reminding itself of `SKILL.md` step 8, which says to call `diff_since_last` before
answering that kind of question. The panel shows all of the mentor's text, including text
written just before a tool call. Not harmful, but it reads like internal plumbing. To fix later
(see the end of this file).

## SC-002: checks (10 needed: ≥ 3 partial, ≥ 2 outside the lesson, ≥ 1 undone)

| # | Lesson | Attempt type | What I did | Panel list | My verdict (Graph Editor) | Agree? |
|---|---|---|---|---|---|---|
| 1 | 2 (Title) | Question (no edits) | Nothing since the demo | Demo pair eased, 3 linear | Same | ✓ |
| 2 | 2 (Title) | Partial | Eased one key of Scale | Scale half eased (1.5 s still linear) | Same | ✓ |
| 3 | 2 (Title) | Partial (hint, no change) | Nothing since check 2 | No change | Same | ✓ |
| 4 | 2 (Title) | Partial | Finished Scale, eased Opacity | Scale + Opacity mine, 1 pair left | Same | ✓ |
| 5 | 2 (Title) | Complete | Eased Position 1.5 s → 3 s | Passed, all 4 pairs | Same | ✓ |
| 6 | 3 (Subtitle + Bar) | Outside the lesson | Edited Glow › Blurriness, none of the 4 focus pairs | 4 pairs not done (Subtitle half eased), "Glow › Blurriness was changed (not part of this lesson)" | Same | ✓ |
| 7 | 3 (Subtitle + Bar) | Complete | Undid the Glow edit, eased all 4 pairs | Passed, 4 of 4 mine, nothing outside | Same | ✓ |
| 8 | 4 (Glow) | Undone | One of checks 8–9 came after easing Glow and undoing it (order not recorded) | Still linear, nothing else changed | Same: an undone ease looks like no edit | ✓ |
| 9 | 4 (Glow) | Outside the lesson | The other of checks 8–9 came after an edit on a layer outside the focus (which layer not recorded). Terminal `diff_since_last` at this point gave the same result | Still linear, **nothing else changed** | The other layer had changed | **✗ missed** |
| 10 | 4 (Glow) | Complete | Eased the Blurriness pair | Passed, 1 of 1 | Same | ✓ |

## SC-003: project changes

| Lesson | ok `set_ease` calls (`calls.jsonl`) | After Show me again? |
|---|---|---|
| 2 (2026-10-07, Title) | 1 (the demo, 22:51 UTC) | None ✓ |

## SC-004 / SC-005: speed and cost (`node panel/dev/turns.js`)

| Date | Turns | First activity ≤ 10 s | Median first activity | Median first words | Lesson durations | Cost per lesson |
|---|---|---|---|---|---|---|
| 2026-10-06 | 6 | 6/6 ✓ (worst 8.5 s) | 4.7 s | 14.1 s | not meaningful (finished the next day) | $0.50 |
| 2026-10-07 | 10 | 10/10 ✓ (worst 4.1 s) | 1.8 s | 6.9 s | 5.5 min ✓ | $0.51 |

## SC-006: memory section vs `learner.json`

| Check | Memory section showed | `learner.json` says | Match? |
|---|---|---|---|
| No record (`learner.json` moved to `learner.json.bak-T023`, panel reopened) | "No lessons yet." | No file | ✓ |
| After one lesson (lesson 3, 23:25 UTC) | Oct 7 · Easing · passed · Next: Try Glow… then CTRL Position 0–1 s | Same date, `easing.basic`, `passed`, same `next` | ✓ |
| After a second lesson (lesson 4, 23:33 UTC) | Oct 7 · Easing · passed · Next: Try CTRL Position 0–1 s; if keys again don't change, check key selection before F9 | Same | ✓ |

T023 run 2026-10-07. Each panel lesson opened from the record as it was at the time: lesson 3 as a
first lesson, lesson 4 referring back to lesson 3. Afterwards the backup was merged back
(5 lessons, passed 5 times), with the T023 file kept as `learner.json.t023-after`.

**SC-002 after 10 checks:** 9 of 10 agree. Partial ✓ (3+), outside the lesson ✓ (checks 6, 9),
undone ✓ (check 8). Check 9 is a real miss: an edit outside the focus didn't appear in
`unexpected_changes`, in the panel or in the terminal. See To fix later.

**"Check my work" vs Claude Code (sprint 2 item):** on the same attempt (check 9), the panel and a
`diff_since_last` run from the Claude Code terminal both reported Glow › Blurriness still linear,
nothing else changed, not passed. Same verdict ✓.

## Edge cases (quickstart §6)

| Case | Result |
|---|---|

## SC-008: did the panel change how I learn?

After at least 2 panel lessons: compared with the terminal, and whether I reached for Adobe's
assistant instead.

## To fix later

- **"Must call diff first." in the chat** (session 2). The mentor's text before a tool call
  reaches the learner. Possible fixes: a line in `SKILL.md` saying the learner sees every
  word, so never narrate rules or tool calls; or hiding short text that comes just before a
  tool call in the panel. Needs an eval check either way.
- **The learner record reset between sessions 1 and 2.** On 2026-10-06, around 23:06, the whole
  `AEMentor` folder was renamed to `AEMentor.pre-T046` and an empty one replaced it, so session 2
  opened as a first lesson. No code in the repo does this, and no transcript or shell history
  shows who did it. The name points to preparing spec 002 T046 (a run with no record). Opening a
  different AE project was ruled out: the mentor keeps one record in a fixed folder, whatever
  project is open. Recovered 2026-10-07 by merging the old lessons back (3 lessons, passed 3
  times). Fix: any step that needs "no record" (T023, T046) should use `AE_MENTOR_HOME` set to a
  temp folder, never move the real folder, and quickstart should say so.
- **An unreadable `learner.json` would be overwritten.** `read()` in
  `mentor/lib/learner-store.mjs` treats a file it can't parse as an empty record, so the next
  `record_lesson` would replace the whole history with one lesson. Fix: if the file exists but
  can't be parsed, refuse to write, leave the file alone, and return an error the mentor
  explains. Add a unit test.
- **A change outside the focus was missed** (T023 lesson 4, check 9, 2026-10-07). The builder
  edited a layer outside the Glow focus, and `diff_since_last` reported no `unexpected_changes`,
  in the panel and in the terminal. Check 6 caught an edit to Glow in lesson 3, so it isn't
  every edit. Next: re-create it, note the layer, the property, and whether the property had
  keyframes, then see what `snapshot_project` includes. Likely suspects: layers left out of the
  snapshot (hidden, locked, or shy, given "4 visible layers" in the opening) or changes it
  doesn't compare (a value with no keyframes, or a key's time).
