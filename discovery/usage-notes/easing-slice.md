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
