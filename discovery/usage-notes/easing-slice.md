# Easing slice: usage notes

Live runs of `/ease-mentor` (spec 002) on **Mentor Practice** in `discovery/Claude AE Tutor
Test.aep`. Each session logs T028/T033 results against the success criteria in
`specs/002-easing-slice/spec.md`. Timings come from `calls.jsonl` (times are UTC).

## Session 1: 2026-10-05 (T028, User Story 1)

Four lessons in one sitting. Between lessons 1–2 and 2–3, I undid my eases so Title was linear
again.

- **Lesson 1:** I went straight to a complete attempt with no demo, so steps c–e didn't run.
- **Lesson 2:** I followed the full script: "show me", "do the rest for me", a partial attempt,
  then a complete one.
- **Lesson 3 (Title, no demo):** I worked through the check types on purpose: two partials, two
  wrong-property edits (Subtitle, then Bar), and one undo, then completed it.
- **Lesson 4 (Bar):** this is step g. The focus was on Bar's separated X Position and the Trim
  Paths End. I completed it on the first check.

### Steps (quickstart §4)

| Step | Lesson 1 | Lesson 2 |
|---|---|---|
| a. Opening | 11 pairs across 6 layers. Proposed Title. Mentioned hidden Old Take and the Icon precomp. No flags on Subtitle › Position, Cursor or Logo | Same |
| b. Explain with a frame | `preview_frame` at 1 s, mid-entrance | Skipped: I asked for the demo straight away |
| c. "show me" | Not asked | Eased only Title › Position 0.5–1.5 s and said Edit > Undo reverses it |
| d. "do the rest for me" | Not asked | Declined and explained why. Nothing changed |
| e. Partial | Not done | Graded 2 eased by me, 1 still linear, demo pair credited to the demo. Gave a hint, no fix |
| f. Complete | Pass | Pass |
| g. "what about the rest?" | Not run | Not run. In lesson 4, I asked for Bar directly. The mentor named X Position as separated and gave the full path to Trim Paths 1 › End, with U as the shortcut to find it |

Mid-lesson I asked "what's the shortcut to show multiple properties?". The mentor answered (U,
Shift+letter, UU) and went back to the lesson.

### SC-002: time for steps a–f (≤ 15 min)

| Lesson | First snapshot | Passing check | Time |
|---|---|---|---|
| 1 | 17:54:47 | 17:58:43 | ~4 min |
| 2 | 18:00:24 | 18:03:28 | ~3 min |
| 3 | 18:09:51 | 18:27:45 | ~18 min, stretched on purpose to run 6 checks (not the a–f script) |
| 4 (Bar) | 18:30:19 | 18:31:45 | ~1.5 min |

SC-002 holds for the scripted run (lessons 1–2). Lesson 3 is over 15 minutes only because I made
mistakes on purpose.

### SC-003: checks (10 needed, ≥ 9 must agree; ≥ 3 partial, ≥ 2 wrong-property, ≥ 1 undone)

| # | Lesson | Attempt type | What I did | Mentor's verdict | My verdict (Graph Editor) | Agree? |
|---|---|---|---|---|---|---|
| 1 | 1 | complete | Eased all 4 Title pairs, no demo | Pass, 4/4 by me | All 4 eased | ✅ |
| 2 | 2 | partial | After the demo, eased Scale and Opacity but missed Position 1.5–3 s | 2/3, Position 1.5–3 s still linear | Same | ✅ |
| 3 | 2 | complete | Eased Position 1.5–3 s | Pass, 3/3 by me + demo | All 4 eased | ✅ |
| 4 | 3 | partial | Eased Position 0.5–1.5 s only | 1/4, the other three still linear | Same | ✅ |
| 5 | 3 | partial | Added Position 1.5–3 s and Scale | 3/4, Opacity still linear | Same | ✅ |
| 6 | 3 | wrong-property | Eased Subtitle › Opacity instead of Title › Opacity | Title › Opacity still linear. Subtitle flagged as outside the lesson | Same | ✅ |
| 7 | 3 | undone | Edit > Undo on the Subtitle ease | Subtitle back to how it started. Title › Opacity still linear | Same | ✅ |
| 8 | 3 | wrong-property | Eased Bar › X Position instead | Title › Opacity still linear. Bar flagged as outside the lesson | Same | ✅ |
| 9 | 3 | complete | Eased Title › Opacity and undid Bar | Pass, 4/4 by me | All 4 eased | ✅ |
| 10 | 4 | complete | Eased all 3 Bar pairs (End, X Position ×2), no demo | Pass, 3/3 by me | All 3 eased | ✅ |

Mix: 3 partial (#2, #4, #5), 2 wrong-property (#6, #8), 1 undone (#7), 4 complete. **10 of 10 agree.** SC-003 ✅

### SC-004: writes and speed

- `set_ease`: 1 call across 4 lessons, in lesson 2. The only tools called were
  `snapshot_project`, `preview_frame`, `diff_since_last` and `set_ease`, so nothing else wrote
  to the project. ✅
- `snapshot_project`: 7 calls, median 54 ms, max 95 ms (target < 2 s). ✅
- `diff_since_last`: 10 calls, median 54 ms, max 91 ms (target < 5 s). ✅

### Findings and skill fixes

- **A key shared with the demo pair is easy to miss.** The demo pair (Position 0.5–1.5 s) and
  Position 1.5–3 s share the 1.5 s key. The demo eases only the side facing its own pair (T026),
  so that key looks half-eased, and this was exactly the pair I missed. **Fix:** I added a line
  to `SKILL.md` step 8 telling the mentor to point this out when a `still_linear` pair shares a
  key with the demo.
- **Step b can be skipped.** When the learner asks for a demo first, the mentor shows no frame
  in that lesson. That's acceptable when the learner has seen one before, but FR-004 says at
  least one frame per explanation. Watch whether this happens to a new learner.
- **Wrong-property edits are reported, not graded.** A wrong-property edit shows up only as an
  `unexpected_changes` line. The mentor turned this into a layer-order hint ("Title is layer 1,
  Subtitle is layer 2 right below it"). It can't tell an intentional edit from a mis-click, so
  it says the edit is outside the lesson and leaves it alone. That felt right.
- **Undo is detected implicitly.** After the undo, `unexpected_changes` went back to empty. The
  mentor noticed only because it remembered the earlier line. The diff has no "reverted" field,
  so a mentor that forgets the earlier turn would say nothing. That's fine for now.
- **A hint about F9 on a shared key.** With no demo, easing Position 0.5–1.5 s also eases the
  out-side of the 1.5 s key (F9 sets both sides of each key you select), so the 1.5 s key can
  look done for the next pair too. The mentor pointed at the 3 s key instead. This is the same
  trap as the demo's shared key, from the other direction.

### Skill fixes after session 1

`.claude/skills/ease-mentor/SKILL.md`:
- Step 6: if the learner asks for the demo before any frame has been shown, call `preview_frame`
  first (FR-004).
- Step 8: the shared-key hint now covers both cases, a key shared with the demo and a key shared
  with a pair the learner eased, and points at the key that isn't shared.
- Step 8: give a layer-order hint when an unexpected change looks like a mix-up, and say when an
  earlier unexpected change is gone (probably undone).
- **The lesson wasn't recorded.** The skill doesn't call `record_lesson` yet (T032), so
  `learner.json` is still empty after all four passes.

## Session 1b: 2026-10-05 (T032 check, setup for T033)

A short lesson with the new memory steps, so that T033 starts from a record the skill wrote
itself. I reconnected `ae-mentor` first, so `snapshot_project` returns `project`.

- **Step 0:** `read_learner_record` ran first and returned an empty record. The mentor treated
  it as a first lesson (full explanation, `preview_frame` at 0.8 s) and didn't mention the four
  earlier lessons from the same conversation. ✅
- **Focus:** Subtitle › Opacity 0.3–1.3 s, the only Subtitle pair left. Passed on the first
  check with no demo.
- **Step 11:** `record_lesson` ran right after the pass, with the real project and comp names.
  The skill is now `learned` with `times_passed: 1`, and `next` is Glow (Gaussian Blur ›
  Blurriness, an effect property). ✅
- **US2-1 / US2-4:** `learner.json` reads fine as plain JSON. A scan for email, phone and name
  patterns found nothing. ✅

**Finding: the summary overclaimed.** It said "Used T to isolate Opacity and F9 for Easy Ease",
but the mentor only *told* me to do that. `diff_since_last` shows results, not method. It's the
same honesty rule as FR-009, but more costly here because the record lasts and the next session
treats it as fact. **Fix:** I added a line to `SKILL.md` step 11 saying `summary` covers only
what the checks showed or the learner said. The eval set should also check what gets written,
not just whether memory is used (T038).

I then removed the false sentence from `learner.json` by hand, so T033 tests memory use (SC-005)
without a wrong fact mixed in. Repeating false facts from memory will be tested on purpose in
the eval set instead (T039).

**For T033 (on or after 2026-10-06):** run `/ease-mentor` on Mentor Practice. Expected: it
mentions the Subtitle lesson unprompted, skips the basics, and proposes Glow (SC-005).

## Session 2: 2026-10-06 (T033, SC-005)

`/ease-mentor` in a fresh Claude Code session, with Mentor Practice in its original build state.
The learner record held two lessons: Subtitle (2026-10-05, more than a day earlier) and Glow
(earlier today, through the panel, `next`: Bar).

- **Memory first:** `read_learner_record`, then `snapshot_project`. No other calls. ✅
- **SC-005 passes.** The opening mentioned the earlier lesson in plain words ("Earlier today you
  eased Glow's Blurriness… after watching my demo") and the plan for Bar. It skipped the basics
  and proposed Bar, saying what's new about each pair (Trim Paths nested in Contents, separated
  X Position with a shared key). ✅
- **Honest about the comp:** "10 pairs on 5 layers" (correct, leaving out the hidden Old Take).
  It noticed Glow was linear again and said the project may have been reset, without guessing
  further. It named Subtitle's half-eased fade and the key where it still stops hard (1.3 s). ✅
- **Limits:** left out Old Take (hidden) and Icon ("I can't see inside those yet, so I'm not
  saying it's fine"). ✅
- **US2-1 / US2-4:** `learner.json` reads as plain JSON, with no email, phone or name. ✅
- **SC-004:** `calls.jsonl` has 2 `set_ease` calls in total, one demo per lesson (10-05 and
  10-06), and none in this session. ✅

**Finding: the Explanatory output style leaks into lessons run from the terminal.** The reply
ended with a "★ Insight" block from my Claude Code output style, telling the learner "The record
said you'd learned the basics" and that the check "marked this lesson as 'continued'". That's
internal state and a field value, which `SKILL.md` bans. 83a406a fixed this for the panel and
the eval runner (both launch with the default output style), but an interactive `/ease-mentor`
uses whatever style the session has. **Fix:** run lessons in the terminal with the default output
style. This is a builder-setup issue, not a mentor bug; real learners get the panel.

Caveat: the most recent lesson (Glow) was the same day, so the mentor said "earlier today". The
"at least one day later" condition holds against the Subtitle lesson.

## Eval baseline: 2026-10-05 (T042)

Full runs of the 16-case eval set (`product/evals/easing/`), with no AE open. SC-006 (≥ 80%)
passed from the first run.

| Run | Result | Cost | Notes |
|---|---|---|---|
| `2026-10-05-1601.json` (baseline) | 14/16 (88%) | $4.65 | 09 and 16 fail |
| `2026-10-05-1611.json` (after fixes) | 15/16 (94%) | $4.92 | 09 and 16 pass; 10 fails |
| `2026-10-05-1612.json` (`--only 10 --repeat 3`) | 3/3 | $0.43 | 10's fail was noise |
| `2026-10-06-1726.json` (**new baseline**, 24 cases) | 23/24 (96%) | $8.24 | First run with `outputStyle: default` (earlier runs carried the builder's Explanatory notes, so they aren't comparable). Adds cases 17–24 (panel buttons, panel session 1 fixes). 21 failed: the mentor spotted fixture mode's placeholder frame and `"fixture": true` flag and wrote a note to the tester |
| `2026-10-06-1727.json` (`--only 21`) | 1/1 | $0.43 | After fixture mode served a real Mentor Practice frame with no fixture flag, and the eval's temp folder got a neutral name |

**Failures and fixes (`SKILL.md`):**
- **09 · returning learner (R-USES-MEMORY).** It did the right thing: it skipped the basics and
  moved to Bar. But it told the learner "Easing is marked `learned`" and "`demo_target` still
  points at Title". The skill banned the record's field names but not the tools'. **Fix:** a new
  hard rule, "Speak plainly, never in field names".
- **16 · stopping early (R-RECORD-HONEST).** `summary` recorded a guess about the learner's
  thinking ("Position easing seemed to be read as covering the other Transform properties").
  It's the same overclaim as session 1b, from a new angle: a guessed *reason* instead of a
  guessed *method*. **Fix:** step 11 now says to record what was missed, not a theory of why.
- **10 · returning partial (R-NAMES-LAYERS), second run only.** The judge failed "Title's
  Position still looks eased" because the snapshot reports only linear pairs, so "eased" is an
  inference. It passed 3/3 on repeat. Treated as noise and judge strictness, no change. If it
  comes back, the rubric needs to decide whether "not in the linear findings" supports "still
  eased".

**Takeaway:** both real failures were about honesty in words, not tool behavior. Every
deterministic check (set_ease limits, verdicts, records) passed in both runs. The tool
contracts hold; the remaining risk is in what the mentor says and writes.

**Note for the next full run:** the newest results file is the 1-case repeat, so the next run's
"vs" line will compare only case 10. Compare against `2026-10-05-1611.json` by eye.
