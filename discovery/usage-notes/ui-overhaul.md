# Usage notes: panel UI overhaul (spec 007)

## SC-015, first half: the current panel (T001, 2026-11-09)

Builder, on B1, Mentor Practice, spec 003 quickstart §4 from the panel. Times and costs are from
`panel-turns.jsonl` and `calls.jsonl`. The builder's transcript wasn't captured.

| Measure | Result |
|---|---|
| Time to pass | About 3.5 min from Start lesson (`panel/dev/turns.js`), 7 turns, $0.49 |
| Size | About 375 × 634 by the screenshot, taller than the 260 × 480 asked for, so a narrow dock would be tighter still |

### What the builder said

> dialogue box is super small and you have to scroll to see almost anything. most of the vertical
> space was taken up by the checklist

> everything else functioned pretty much as expected

### What the screenshot shows (end of the lesson)

Share of the panel's height, measured from the screenshot:

| Area | Share |
|---|---|
| Chat | About 19% |
| Header, path and stage strip | About 22% |
| Check list, including 4 "Outside this lesson" rows | About 38% |
| Buttons and Ask | About 14% |

So the mentor's message was cut off mid-sentence, and scrolling was needed to read it. T028 should
log the same things on the new panel: whether the answer is in view without scrolling, and what got
scrolled to.

### How the run differed from the script

- **It was two lessons, not one.** The focus was narrowed to two single-pair layers (CTRL Position,
  Glow Blurriness) so a demo could be shown. The demo took Glow, the builder eased CTRL, and the first
  check passed, so step d's partial list never happened. Hint then moved on to Bar's two separated
  X Position pairs, which passed on the next check with no demo.
- **The turn log marks the second check `lesson_passed: false`** although the mentor recorded a pass
  and the panel showed "All eased. Lesson passed". The first lesson had already passed in that session.
  Not investigated; the old panel is being replaced.
- **The first Show me didn't demonstrate.** That turn took a snapshot and a frame, with no edit. The
  second Show me press made the one demo (`set_ease` on Glow), after the focus narrowed. So step c's
  "second press changes nothing" didn't happen as scripted, and it's worth watching in T028.
- **Slow turns:** the two Show me turns took 20.2 s and 14.0 s to finish. The opening took 17.7 s, with
  first activity at 6.3 s.
- **"Outside this lesson" listed four properties:** Subtitle Opacity, Glow Blurriness, Logo Rotation,
  Old Take Position. All four really differ from the capture taken before the lesson. Glow is the
  lesson's own demo, so it's listed as outside the lesson on the second lesson only because the
  focus moved to Bar.

### Comp handling (for the restore)

- The project open in AE during the lesson was the copy,
  `~/Documents/Tutor Test before T001.aep.aep`, so the repo's `.aep` on disk wasn't changed.
- The capture taken before the lesson read Title's keys as linear, and after the lesson Title was
  shaped (out influence 15.13) in the copy. Reopening the repo's file on 2026-11-09 gave a comp
  identical to that capture, layers and `layer_info` included, so T028 starts where T001 did. It also
  means the saved file's Title is linear, without the shaped ease spec 008's review (T035) expects;
  the shaped version exists only in the copy.

## SC-015, second half: the new panel, step 1 (T028, 2026-11-09)

Builder, on B1, Mentor Practice from the same starting comp, spec 003 quickstart §4 with the new button
names. First run of the new panel in After Effects. It opened and drew normally.

| Measure | Current panel (T001) | New panel (T028) |
|---|---|---|
| Time to pass | About 3.5 min | About 2.5 min |
| Turns, cost | 7, $0.49 | 8, $0.40 |
| Opening, to finish | 17.7 s | 14.8 s |
| Show me, to finish | 20.2 s, 14.0 s | 10.0 s, 6.7 s (Show me again) |

The two runs are one session each and the mentor picked its own focus, so the times are weak evidence.

### What the builder said

> things were pretty smooth

> asking why it looked mechanical didn't lead to a good conceptional explanation and didn't render a frame

> show me and show me again worked well

> it was annoying that the frame checklist expanded after every turn. If the user collapses it, it should stay collapsed until they expand it again

> the hint it gave was actually super helpful. I didn't know clicking the property name would select all keys so that was a great insight

> the box to prompt the mentor goes away after the lesson ends ... it does raise the concern that the prompt box should show up whenever you need it

### Findings

1. **The "why does it look mechanical" answer is the mentor, not the panel, and it happened on both.** Both
   runs called only `diff_since_last` on that turn, no `preview_frame`. T028's answer: "Nothing has changed
   since I looked: 11 of the 12 pairs are still fully linear, so those moves run at one speed and start and
   stop dead". `ease-mentor/SKILL.md` step 8 sends any "how does the motion look" question to the diff, so
   before a focus is agreed the question gets a status report in place of step 4's explanation with a frame.
2. **The checklist's collapse doesn't stick.** `panel/lib/app.js` clears `list_collapsed` at every send and turn
   end, so the default comes back. Fixing: it holds until the learner changes it or a new lesson starts.
3. **Ask isn't there after a lesson ends.** The spec only keeps it through `lesson-passed-asking` (FR at
   `spec.md:515`). Open: where Ask belongs after a pass.
4. **Show me made the demo on the first press this time,** and Show me again changed nothing in AE (`set_ease`
   ran once, on Subtitle's Opacity), so step c ran as scripted.

**Not run in this sitting:** End lesson greyed during a turn, a check's rows staying after asking about another
layer, and the connection mark when After Effects quits. 
**Which panel:** the builder said "new panel is better". SC-015 met for step 1, with the three checks above still to run.

**Decided after this sitting:** keep Ask after a pass in the same session (FR-046), and fix the mentor's answer to "why does it look mechanical" (finding 1).

## Six live lessons (quickstart §2, SC-014, SC-002)

### Key types (T056, 2026-11-09)

Builder, on B1, Mentor Practice 2, focus Blink's Opacity (3 pairs). New panel at 260 × 480, panel installed with
`--runtime b1`. Captured before: `practice2-before.json` (24 layers) in the session scratchpad. Times and costs from the raw
`panel-turns.jsonl` and `calls.jsonl` lines, not `panel/dev/turns.js` (finding 3).

| Measure | Result |
|---|---|
| Time to pass | 2 min 36 s (Start lesson 21:21:36Z, passing check 21:24:12Z), 7 turns |
| Time to saved | 5 min 17 s, 8 turns, including the closing question and the builder's reply |
| Slowest turn | 11.4 s to finish (check 2); first activity 4.8 s at worst (the opening) |
| Cost | $0.51 (B1, so not API credit) |
| Demo | None (`demo_made: false`) |
| `lesson-focus-stale` | 0 |
| Terminal needed | No |

| Step (quickstart §2) | What happened | Matches? |
|---|---|---|
| Opening | Asked what's meant to snap; named Blink and Cut; said it can't see inside Seal (a precomp). Check slot empty | Yes |
| Focus | "blink is supposed to snap"; one frame at 1.2 s showing Blink half see-through | Yes |
| Check 1 | 1 of 3 held, partial; rows matched AE | Yes |
| Check 2 | Still 1 of 3; Card's Position and Scale newly held at 1.2 s, listed outside the lesson; rows matched AE | Yes |
| Hint | Said the selection may have been on Card's row; check the highlighted keys first | Yes |
| Show me | No demo: the one demo pair was already held, so it gave the steps in words | No: finding 1 |
| Check 3 | 3 of 3 held, passed; Card's holds still listed outside | Yes |
| "Meant to keep moving" | The constant-speed question came after the pass; the builder said "no not right now", so the row never showed | Not reached |
| Saved | `record_lesson` at 21:26:51Z after the reply: `passed`, `demo_used: false` | Yes |

**SC-002 agreement.** The builder checked each against AE: the rows matched.

| Check | Check's result | Panel rows | Builder in AE | Kind |
|---|---|---|---|---|
| 1 | 1 of 3 held | Same | Same | Partial |
| 2 | 1 of 3; Card held outside | Same | Same | Partial, outside the lesson |
| 3 | 3 of 3, passed; Card held outside | Same | Same | Outside the lesson |

Card's holds were planted on purpose for the tally, not a slip.

**SC-002 live tally so far** (T028 wasn't tallied):

| Needed | Count |
|---|---|
| Checks, panel vs check 100%, vs AE ≥ 9 of 10 | 3 of 10 (3/3 and 3/3) |
| Partial | 2 of 3 |
| Outside the lesson | 2 of 2 ✓ |
| Something undone | 0 of 1 |
| Openings on easing, speed graph or offset: Proposed, then not | 0 of 3 (key types doesn't count) |

### What the builder said

> everything felt smooth it was easy to follow

> it all worked in panel

### Findings

1. **Show me was offered when there was nothing it could show.** The demo target (Blink 1–1.4 s) was already held by the
   learner, so the mentor gave the steps in words. That's right for the mentor (one demo, on its target only), but the
   button promised a demo. *Fix, for the designer:* when the demo target is already done, either hide Show me or let it
   read as steps. *Eval:* none; the mentor did the right thing.
2. **The frames couldn't show the fade, and the mentor kept sending them.** Blink sits on a red square, so red on red hides
   half see-through. The mentor said so at check 1 ("I should have said so earlier") but took the same two frames (1.6 s,
   2 s) again at check 2. *Eval case (key types):* a focus layer the same color as what's behind it; after the mentor says
   frames won't show it, no `preview_frame` on later checks; rubric "says once that the frame can't show the change, and
   doesn't lean on frames after that". *Overlap:* a check's verdict and the picture disagree when layers blend. Worth a
   line in the curriculum's edge cases.
3. **`panel/dev/turns.js` merges lessons.** It reported lesson 15 as starting 17:26Z with 20 turns, "2.5 min", which
   includes this lesson (a `new_lesson` turn at 21:21:36Z) and probably the pivot lesson saved at 19:49Z. Cause not
   checked. *To fix later:* split on every `new_lesson` turn, with a test using three lessons in one log. Until then,
   take times from the raw lines.
4. **The planted holds are in the real record.** `next` says to decide whether Card's holds are meant. Harmless, but
   planting for a tally on the real learner home leaves test notes in the builder's memory. For the remaining lessons,
   use a temp `AE_MENTOR_HOME` or accept it.

**Comp handling:** Card's Position and Scale still hold at 1.2 s, and Blink's three pairs are held. Restore from the copy
saved before the lesson, then strict-compare with `practice2-before.json` (including `layer_info`) before T058 (offset,
same comp).

**SC-014:** key types met (live in the panel, no terminal, checklist agreed with the check, stale counted: 0). Builder
only, so it says the panel works, not that a learner finds it easy.
