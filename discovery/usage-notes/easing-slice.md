# Easing slice: usage notes

Live runs of `/ease-mentor` (spec 002) on **Mentor Practice** in `discovery/Claude AE Tutor
Test.aep`. Each session logs T028/T033 results against the success criteria in
`specs/002-easing-slice/spec.md`. Timings come from `calls.jsonl` (times are UTC).

## Session 1: 2026-10-05 (T028, User Story 1)

Two lessons back to back. In between, I undid my eases so Title was linear again.

- **Lesson 1:** I went straight to a complete attempt with no demo, so steps c–e didn't run.
- **Lesson 2:** I followed the full script: "show me", "do the rest for me", a partial attempt,
  then a complete one.

### Steps (quickstart §4)

| Step | Lesson 1 | Lesson 2 |
|---|---|---|
| a. Opening | 11 pairs across 6 layers. Proposed Title. Mentioned hidden Old Take and the Icon precomp. No flags on Subtitle › Position, Cursor or Logo | Same |
| b. Explain with a frame | `preview_frame` at 1 s, mid-entrance | Skipped: I asked for the demo straight away |
| c. "show me" | Not asked | Eased only Title › Position 0.5–1.5 s and said Edit > Undo reverses it |
| d. "do the rest for me" | Not asked | Declined and explained why. Nothing changed |
| e. Partial | Not done | Graded 2 eased by me, 1 still linear, demo pair credited to the demo. Gave a hint, no fix |
| f. Complete | Pass | Pass |
| g. "what about the rest?" | Not run | Not run |

Mid-lesson I asked "what's the shortcut to show multiple properties?". The mentor answered (U,
Shift+letter, UU) and went back to the lesson.

### SC-002: time for steps a–f (≤ 15 min)

| Lesson | First snapshot | Passing check | Time |
|---|---|---|---|
| 1 | 17:54:47 | 17:58:43 | ~4 min |
| 2 | 18:00:24 | 18:03:28 | ~3 min |

### SC-003: checks (10 needed, ≥ 9 must agree; ≥ 3 partial, ≥ 2 wrong-property, ≥ 1 undone)

| # | Lesson | Attempt type | What I did | Mentor's verdict | My verdict (Graph Editor) | Agree? |
|---|---|---|---|---|---|---|
| 1 | 1 | complete | Eased all 4 Title pairs, no demo | Pass, 4/4 by me | All 4 eased | ✅ |
| 2 | 2 | partial | After the demo, eased Scale and Opacity but missed Position 1.5–3 s | 2/3, Position 1.5–3 s still linear | Same | ✅ |
| 3 | 2 | complete | Eased Position 1.5–3 s | Pass, 3/3 by me + demo | All 4 eased | ✅ |
| 4–10 | | | *to do: ≥ 2 more partial, ≥ 2 wrong-property, ≥ 1 undone* | | | |

**So far: 3 of 3 agree.**

### SC-004: writes and speed

- `set_ease`: 1 call in total, in lesson 2. No other tool wrote to the project. ✅
- `snapshot_project`: 4 calls, median 71 ms, max 89 ms (target < 2 s). ✅
- `diff_since_last`: 3 calls, median 54 ms, max 56 ms (target < 5 s). ✅

### Findings and skill fixes

- **A key shared with the demo pair is easy to miss.** The demo pair (Position 0.5–1.5 s) and
  Position 1.5–3 s share the 1.5 s key. The demo eases only the side facing its own pair (T026),
  so that key looks half-eased, and this was exactly the pair I missed. **Fix:** I added a line
  to `SKILL.md` step 8 telling the mentor to point this out when a `still_linear` pair shares a
  key with the demo.
- **Step b can be skipped.** When the learner asks for a demo first, the mentor shows no frame
  in that lesson. That's acceptable when the learner has seen one before, but FR-004 says at
  least one frame per explanation. Watch whether this happens to a new learner.
- **The lesson wasn't recorded.** The skill doesn't call `record_lesson` yet (T032), so
  `learner.json` is still empty after both passes.
