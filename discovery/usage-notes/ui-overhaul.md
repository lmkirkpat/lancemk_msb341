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

### Speed graph (T057, 2026-11-09)

Builder, on B1, Mentor Practice, focus Subtitle's Position (2 Easy Ease pairs). Comp restored after T056 and checked
(strict compare, `layer_info` included) before this lesson; captured before as `practice1-before.json`. In this file
Title is linear: its shaped ease lives only in `~/Documents/Tutor Test before T001.aep.aep` (see T001's comp handling).

| Measure | Result |
|---|---|
| Time to pass | 2 min 19 s (Start lesson 21:41:56Z, passing check ended 21:44:15Z), 6 turns |
| Time to saved | About 2 min 41 s (`record_lesson` 21:44:37Z), 7 turns; 8 with the closing request |
| Slowest turn | 13.7 s to finish (the opening); first activity 5.5 s at worst |
| Cost | $0.31 (B1) |
| Demo | None (offered, not asked for) |
| `lesson-focus-stale` | 0 |
| Terminal needed | No |

| Step (quickstart §2) | What happened | Matches? |
|---|---|---|
| Opening | Proposed Subtitle; listed what it leaves out (hidden, null, precomp, expression, still linear); asked about hard landings | No: finding 3 |
| Rows from the opening; Proposed until first reply | Checklist was collapsed, so not seen | Not judged |
| `fastest` not shown | Never shown | Yes |
| Read the graph | "middle" | Yes |
| Check 1 | 1 of 2 shaped, partial | Yes |
| Check 2 | Still 1 of 2; Title's Position, Scale and Opacity listed outside the lesson | Yes |
| Check 3 | 2 of 2, passed; Title still listed outside | Yes |
| Read again | "toward the start" | Yes |
| Saved | `passed`, `demo_used: false` | Yes, but finding 2 |
| Close | Told the learner to start with `/speed-graph-mentor` | No: finding 1 |

**SC-002 agreement.** The builder checked each against AE: the rows matched.

| Check | Check's result | Panel rows | Builder in AE | Kind |
|---|---|---|---|---|
| 4 | 1 of 2 shaped | Same | Same | Partial |
| 5 | 1 of 2; Title changed outside | Same | Same | Partial, outside the lesson |
| 6 | 2 of 2, passed; Title outside | Same | Same | Outside the lesson |

Title's changes were the builder easing it on purpose for the tally. No undo.

**SC-002 live tally so far:**

| Needed | Count |
|---|---|
| Checks, panel vs check 100%, vs AE ≥ 9 of 10 | 6 of 10 (6/6 and 6/6) |
| Partial | 4 of 3 ✓ |
| Outside the lesson | 4 of 2 ✓ |
| Something undone | 0 of 1 |
| Openings on easing, speed graph or offset: Proposed, then not | 0 of 3 (this one not judged: list collapsed) |

### What the builder said

> everything felt good

### Findings

1. **The close named a Claude Code command.** Asked to finish, the mentor said "Just start with
   **/speed-graph-mentor** when you're ready." A panel learner can't type that. `speed-graph-mentor/SKILL.md` never says
   it, so the model added it. *Eval case (speed graph, likely every skill):* a close after "let's finish up"; `expect`:
   no `/` followed by a skill name in anything said; rubric "points to the next step in the panel's terms, or not at
   all". *To fix:* one line in each `SKILL.md`'s close (never name a slash command; the panel has buttons), after the
   eval case fails on B1.
2. **The record guesses why.** Summary: "the second still had the default shape for two checks, because only one side
   of the shared middle key had been shaped". `SKILL.md:311–315` says no method and "no guess at why something was
   missed". Same kind as offset 23 and pivot 30's `record_plain` leaks. *Eval case:* a check where a shared key is
   shaped on one side only, then passes; `record_plain` should catch "because" plus a handle or side. *To fix:* check
   whether speed graph's `recordMethod` pattern would match this; if not, widen it before changing the prompt.
3. **The opening contradicted itself.** "Two weeks ago you shaped Title's moves", then Title's Position, Scale and
   Opacity in the still-needs-easing list. The record remembers Title shaped (T032), but this file's Title is linear
   after the T001 restore. A real learner gets here by undoing or reverting. *Fix:* when the record says a layer was
   shaped and the snapshot says it's linear, don't claim it from memory. *Overlap:* the record and the comp disagree;
   add to "Edge cases to plan for". Low priority.
4. **The checklist was collapsed at the opening,** so the Proposed check couldn't be judged. Collapse now sticks (T028
   finding 2), which also hides the rows SC-002 needs. For the next two openings (offset, and easing or another speed
   graph), expand the list before replying.

**Comp handling:** Subtitle's two Position moves are shaped, and Title is eased (Position, Scale, Opacity). Restore
from the copy saved before the lesson and strict-compare with `practice1-before.json` before the next sitting on
Mentor Practice.

**SC-014:** speed graph met (live in the panel, no terminal, checklist agreed with the check, stale counted: 0). Builder
only.

### Offset (T058, 2026-11-09)

Builder, on B1, Mentor Practice 2, layers kind, focus Dot 1, Dot 2 and Dot 3. Captured before as `practice2-before.json`,
identical to the state restored and checked after T056. Checklist expanded before the first reply, for the Proposed check.

| Measure | Result |
|---|---|
| Time to pass | 7 min 22 s wall clock (22:42:37Z to 22:49:59Z), including about 4.6 min with the panel closed; about 2.8 min of lesson |
| Turns, cost | 7 turns, $0.53 (B1); the Continue turn alone was $0.24 |
| Slowest turn | 8.7 s to finish (the opening); first activity 4.7 s at worst |
| Demo | None |
| Checks | 1, passed |
| `lesson-focus-stale` | 0 |
| Terminal needed | No |

| Step (quickstart §2) | What happened | Matches? |
|---|---|---|
| Opening | Offered properties inside Dot 2 (Position, Opacity, Blurriness) or the three Dots; left out Seal (a precomp) | Yes |
| Proposed until first reply | Rows said Proposed, gone after the first reply | Yes |
| Kind | "let's do the layers"; one frame at 1 s with all three mid-move | Yes |
| Close and reopen the panel | "Picked up where you left off" divider; Continue lesson restated where it was and took a new snapshot | Yes: finding 2 |
| Order and gap | Asked which goes second twice | No: finding 1 |
| Quick Offset | Offered with the steps | Yes (FR-017) |
| Timeline | Read well, straightforward (builder) | Yes |
| Check 1 | Passed: Dot 1 stayed at 0.5 s, Dot 2 moved 6 f to 0.7 s, Dot 3 moved 12 f to 0.9 s; rows matched AE | Yes |
| Saved | `passed`, `demo_used: false`; gaps kept as numbers, which offset allows | Yes |

**SC-002 agreement.** One check; the builder checked it against AE and the rows matched.

| Check | Check's result | Panel rows | Builder in AE | Kind |
|---|---|---|---|---|
| 7 | All apart, passed | Same | Same | Pass on the first check |

**SC-002 live tally so far:**

| Needed | Count |
|---|---|
| Checks, panel vs check 100%, vs AE ≥ 9 of 10 | 7 of 10 (7/7 and 7/7) |
| Partial | 4 of 3 ✓ |
| Outside the lesson | 4 of 2 ✓ |
| Something undone | 0 of 1 |
| Openings on easing, speed graph or offset: Proposed, then not | 1 of 3 (offset) |

### What the builder said

> the timeline read well it was pretty straightforward

> no need for the terminal everything was smooth

### Findings

1. **The mentor asked which Dot goes second twice.** Its first question asked the order and the gap together; the
   builder answered the gap ("6 frames"), so the mentor asked the order again, one turn later. Minor: one extra turn. Not
   checked against `offset-mentor/SKILL.md`'s turn rules yet. *Eval case (offset):* the learner names the first layer and a vague gap;
   `expect`: the next turn asks one question; rubric "asks one thing at a time". Low priority.
2. **Continuing after closing the panel works, and costs.** Close, reopen, Continue lesson: the divider showed, the
   mentor restated the lesson and re-read the comp before going on. That turn cost $0.24 against $0.01 to $0.06 for a
   normal one, since B1 resumes the whole session. Watch on A (spec 013 T043 to T045's saved conversation).

**Comp handling:** the Dots are staggered (Dot 2 later by 6 frames, Dot 3 by 12). Restore from the copy saved before the
lesson and strict-compare with `practice2-before.json` before T059 (pivot, same comp).

**SC-014:** offset met (live in the panel, no terminal, checklist agreed with the check, stale counted: 0). Builder only.

### Set the pivot (T059, 2026-11-09)

Builder, on B1, Mentor Practice 2, focus Door (pivot to the middle of its left edge). Comp restored after T058 and checked
(strict compare, `layer_info` included); that state is the capture before this lesson.

| Measure | Result |
|---|---|
| Time to pass | 1 min 35 s (23:02:49Z to 23:04:25Z), 7 turns |
| Time to saved | 1 min 47 s (`record_lesson` 23:04:36Z), 8 turns |
| Slowest turn | 7.5 s to finish (the opening); first activity 4.2 s at worst (the closing question) |
| Cost | $0.36 (B1) |
| Demo | None |
| `lesson-focus-stale` | 0 |
| Terminal needed | No |

| Step (quickstart §2) | What happened | Matches? |
|---|---|---|
| Opening | Asked one thing, with Door's left edge as a suggestion; no leave-out list | Yes |
| Setup | Anchor Point and Position shown (A, then Shift+P); one frame of Door | Yes |
| Check 1 | Partway; Door stayed | Yes |
| Check 2 | Back at the center (builder's undo); Door stayed | Yes |
| Check 3 | No change since check 2 (builder's second undo); mentor guessed an expression might be driving it | No: finding 1 |
| Check 4 | At the middle of the left edge, Door didn't move; passed | Yes |
| `lesson-passed-asking`, then saved | Asked which part stays still; "the left side"; saved | Yes |
| Close | Suggested dragging Rotation to see the swing, then Edit > Undo | Yes |

**SC-002 agreement.** The builder checked each against AE: the rows matched.

| Check | Check's result | Panel rows | Builder in AE | Kind |
|---|---|---|---|---|
| 8 | Partway, Door stayed | Same | Same | Partial |
| 9 | Pivot back at center | Same | Same | Undone |
| 10 | No change since the last check | Same | Same | Undone (a second undo with nothing new to undo in the check's terms) |
| 11 | Passed | Same | Same | Pass |

**SC-002 live tally so far:**

| Needed | Count |
|---|---|
| Checks, panel vs check 100%, vs AE ≥ 9 of 10 | 11 of 10 ✓ (11/11 and 11/11) |
| Partial | 5 of 3 ✓ |
| Outside the lesson | 4 of 2 ✓ |
| Something undone | 2 of 1 ✓ |
| Openings on easing, speed graph or offset: Proposed, then not | 1 of 3 |

Only the Proposed openings are left: two more on easing, speed graph or offset, with the list expanded before the
first reply.

### What the builder said

Nothing felt off; no terminal.

### Findings

1. **The mentor guessed a cause that wasn't there.** At check 3 nothing had changed, and the mentor said "If you dragged
   it and it went back, something may be driving it, like an expression, and I can't see that yet." Door has no
   expression; the builder had used Undo. A real learner could go looking for an expression. The spec's L-8 (an
   unkeyed expression on Anchor Point or Position, T261) is probably the case this line is for: the mentor said
   it can't see one, so it may be hedging by design. Not checked against `anchor-mentor/SKILL.md` or the tool yet.
   *Eval case (pivot):* a check with no change after a partial, no expression on the layer, learner hasn't said a drag
   snapped back; `expect`: no "expression" in what's said; rubric "when nothing changed, says so and asks what they
   did, without guessing a cause". *To fix:* raise an expression only after the learner says the pivot went back on
   its own, after the eval case fails on B1.

**Comp handling:** Door's pivot is at the middle of its left edge. Restore from the copy and strict-compare with
`practice2-before.json` before T060 (null, same comp).

**SC-014:** pivot met (live in the panel, no terminal, checklist agreed with the check, stale counted: 0). Builder only.

### Move a group with a null (T060, 2026-11-09)

Builder, on B1, Mentor Practice 2, focus Tile, Caption and Stamp (suggested by the mentor). Comp restored after T059 and
checked (strict compare, `layer_info` included); that state is the capture before this lesson. The builder said "slide",
then keyed Rotation on purpose, to see the mentor adapt.

| Measure | Result |
|---|---|
| Time to pass | 6 min 14 s (23:08:02Z to 23:14:16Z), 11 turns; about 1.3 min of that was finding 1 |
| Cost | $0.36 (B1) |
| Slowest turn | 10.0 s to finish (the passing check, which also saved); first activity 5.8 s at worst (the opening) |
| Demo | None (offered in words at the parenting stage, not taken) |
| `lesson-focus-stale` | 0 (none in the session state) |
| Terminal | All turns ran in the panel |

| Step (quickstart §2) | What happened | Matches? |
|---|---|---|
| Opening | Asked which layers move as one; on "any suggestions?" proposed Tile, Caption and Stamp | Yes |
| Frame and idea | One frame at 0 s; what a parent passes on and what it doesn't | Yes |
| Stages open in order | The null, then the group, then the move (builder) | Yes |
| Show me after the null is ready | Yes (builder); the mentor also offered to parent Tile, in words | Yes |
| Check 1 (the null) | Null 12 in place | Yes |
| Check 2 (the group) | All three follow Null 12, none jumped | Yes |
| Check 3 (the move) | Keys on Rotation, not a slide; asked where the group turns from | Yes |
| Where to turn from | Three turns to agree on the group's top-left corner | No: finding 1 |
| Check 4 (the move) | Null's pivot outside the group, not passed | Yes |
| Check 5 (the move) | Passed: turns from the group's top-left; two ungraded notes (linear move, default name) | Yes |
| Saved | `passed`, `demo_used: false` | Yes |

**SC-002 agreement.** The builder checked each against AE: the rows matched.

| Check | Check's result | Panel rows | Builder in AE | Kind |
|---|---|---|---|---|
| 12 | Null in place | Same | Same | Stage passed |
| 13 | Group follows, none jumped | Same | Same | Stage passed |
| 14 | Rotation, not a slide; place not set | Same | Same | Partial |
| 15 | Pivot outside the group | Same | Same | Partial |
| 16 | Passed | Same | Same | Pass |

**SC-002 live tally, closed for quickstart §2's six lessons:**

| Needed | Count |
|---|---|
| Checks, panel vs check 100%, vs AE ≥ 9 of 10 | 16 of 10 ✓ (16/16 and 16/16) |
| Partial | 7 of 3 ✓ |
| Outside the lesson | 4 of 2 ✓ |
| Something undone | 2 of 1 ✓ |
| Openings on easing, speed graph or offset: Proposed, then not | 1 of 3: two more needed |

### What the builder said

> confusing but i got there eventually

(About agreeing where the group turns from.)

### Findings

1. **The mentor's "where" question mixed up the null's corner and the group's.** After "it should turn from where it
   is right now", the mentor asked "Where on the group is Null 12 sitting right now", and the builder answered "the top
   left corner of the null", which is where a null's pivot always is. It took a rephrase and a failed check to land on
   the group's top-left. Builder: confusing. *Cause:* the question asked about the null's place on the group, when the
   learner thinks of the null as the thing with the corner. *Eval case (null):* the learner keys Rotation after saying
   slide, then answers "where it is right now"; `expect`: at most one follow-up question about the place; rubric "asks
   about a place on the group (a corner, an edge, the middle) and never about the null's own corner". *To fix:* in
   `null-parenting-mentor/SKILL.md`, ask "which part of Tile, Caption and Stamp should stay still while they turn?",
   the pivot lesson's wording, which the builder answered at once in T059.

**Comp handling:** Mentor Practice 2 now has Null 12, with Tile, Caption and Stamp parented to it, and Rotation keys.
Adding the null renumbered the layers below it. Restore from the copy and strict-compare with `practice2-before.json`
before any other sitting on this comp.

**SC-014:** null met (live in the panel, checklist agreed with the check, stale counted: 0). Builder only.

### SC-014 summary

All six skills completed one live lesson in the new panel on 2026-11-09: easing (T028), key types (T056), speed graph
(T057), offset (T058), set the pivot (T059), null (T060). For the five today, none needed the terminal, every checklist
agreed with the check, and `lesson-focus-stale` showed 0 times. T028's notes above don't record its stale count or a
row-by-row agreement, so easing rests on its "things were pretty smooth" and the panel's pass. With that caveat, sprint
4's first "done" item is met. Builder only, on B1.

### Proposed openings (SC-002, 2026-11-09)

Two short openings after T060, checklist expanded before the first reply (Start lesson at 23:17:13Z for easing and
23:18:49Z for speed graph in `panel-turns.jsonl`).

| Opening | Rows said | Matches? |
|---|---|---|
| Offset (T058) | Proposed, gone after the first reply | Yes |
| Easing | "Not checked yet", never Proposed | **No: finding 1** |
| Speed graph | Proposed, gone after the first reply (builder) | Yes |
| Easing, on Mentor Practice (23:25:21Z) | Proposed, gone after the first reply (builder); a new lesson, no pick-up | Yes |

**SC-002's opening part: 3 of 3, met** (offset, speed graph, and easing re-run on Mentor Practice). The easing opening
on Mentor Practice 2 doesn't count: it was a resumed lesson (finding 1). With the checks above, **SC-002's live half is
met.**

1. **Easing's first opening was a resume, not a new lesson, so the panel was right.** An easing lesson from
   2026-11-05 was still open on Mentor Practice 2: never checked, never passed. The last snapshot before it was key
   types', so `start()` in `mentor/lib/session.mjs` (lines 199–201, 220) resumed the old lesson; it counts an old
   unchecked lesson as stale only if the comp no longer matches, and the restore after T060 made it match again. A
   resumed lesson is never Proposed (spec 007 FR-092, `panel/lib/lesson.js:74` and `:92`). The call order
   (`read_learner_record` first) wasn't the cause: the recorded easing opening makes the same calls and shows
   Proposed. Panel-builder added `panel/test/easing-opening.test.js` (from New lesson and Home, Proposed then dropped;
   the same stream as "resumed" gives Not checked yet), merged with this note. *To decide later (spec-writer):*
   New lesson silently resumes any unfinished lesson on a matching comp, and restores make that likely; an unchecked
   lesson with no demo a day or more old could count as stale on resume too. Mentor Practice 2 still has unfinished
   easing, key types, pivot and speed graph lessons, so new lessons there may resume ("Picking up your earlier lesson
   on this comp.").

## States at the default dock (T062, 2026-11-09)

Builder, on B1. The panel was docked on the right of AE at its default width, with the height dragged to a size that
looked right; the builder expects users to do the same, so SC-010 was amended to this size (`spec.md`, SC-010). Ten
screenshots in `~/Desktop/t062/` (4:28 to 4:37 pm; not in the repo). Sizes from the pixels, assuming a 2× screen:
about 343 pt wide; about 583 pt tall for the first five and 688 pt for the last five, including AE's own "Knack ☰"
tab (about 36 pt), so the panel's content area is about 547 and 652 pt.

| State | Screenshot | Sideways scroll | Clipped button or Ask |
|---|---|---|---|
| `home-return` | 4.28.39 | None | None |
| `skills-many` | 4.28.45 | None | None |
| `lesson-open` (speed graph, rows Proposed) | 4.29.27 | None | None |
| `skill-speedgraph-check` (rows collapsed, chat showing) | 4.30.22 | None | None |
| `lesson-partial` (rows expanded) | 4.30.27 | None | None |
| `home-cutoff` | 4.31.11 | None | None |
| `skill-keytypes-check` | 4.32.52 | None | None |
| `skill-offset-layers-check` | 4.34.32 | None | None |
| `skill-pivot-check` | 4.36.08 | None | None |
| `skill-null-parent` | 4.37.35 | None | None |

**SC-010 (as amended): met** for these 10 states. `home-first` needs an empty learner record, so it moves to T061,
which sets up a temp learner home anyway; `practice-check` stays with T071.

**SC-016:** at a content height of about 547 pt (under 560), exactly one of chat and rows shows: chat with the rows
collapsed (4.30.22), rows alone when expanded (4.30.27). At about 652 pt (over 560), both show, and each check left the
chat in view (4.32.52 to 4.37.35). **Met** at these two heights, not at exactly 480 and 680.

### Findings

1. **Row times have three decimals where the mentor says two.** Speed graph's rows read "Position 1.3–4.367 s" and
   "Next: Position 1.3–4.367 s" while the mentor says "4.37 s" (4.30.22, 4.30.27). The label comes straight from the
   tool. *For panel-builder:* round row times the way the mentor does, with a test.
2. **The narrowest dock is untested.** AE lets a docked panel be dragged narrower than its default; 260 was the guard
   for that. Re-check if a tester docks narrower.

## The live findings fixed, and the evals after (2026-11-09)

The four mentor findings from T057, T059 and T060 got eval cases first (branch `evals-live-findings`, merged
`d50330a`): speed graph 36 (the close names no slash command) and 37 (the record guesses why), pivot 54 (an
expression guessed before the learner says what they did, after the 2026-11-09 teaching design amendment `69a8e08`)
and null 52 (the "where" question asks about the group, not the null). 37, 54 and 52 failed on B1 before the fix.
The same branch added a check that no skill's mentor ever says a slash command (`no_slash_command`, all seven
runners). Re-scoring every saved run found it in offset case 20 only ("type **/ease-mentor**"), from
`offset-mentor/SKILL.md`; key types had the same line.

The `SKILL.md` fixes merged as `ad4a257`: pivot asks "What did you do?" and guesses no cause; null's `region_needed`
question names a part of the group; speed graph's record says what the checks showed, never why; offset and key
types offer "the easing lesson" by name; all six closes name what comes next in words. Mentor tests 1530 pass.

### Full runs on B1 after both merges

| Set | Score | Last full B1 run | The live-lesson case |
|---|---|---|---|
| Speed graph | 34/37 (92%), $22.34, `-173733` | 29/29, 10-29 | 36 pass (3/3 on repeat), 37 pass |
| Pivot | 56/59 (95%), $42.54, `-175705` | 51/51, 11-06 | 54 pass |
| Null | 45/52 (87%), $39.05, `-181838` | 42/44, 10-29 | 52 pass |
| Offset case 20 only, ×3 | 3/3, $2.56, `-182007` | | no slash command |

Every set meets SC-006, and the sets grew since their baselines (spec 007's request cases, then today's four).

### The failures, repeated ×3

| Case | Full run | Repeat | Verdict |
|---|---|---|---|
| Speed graph 04 | R-ONE-IDEA (the shared key's two handles explained in the same turn) | 2/3 (`-184802`), same item | Noise, watch; it failed once on A on 11-04 |
| Speed graph 36 | judge reply unreadable, item passed | 3/3 (`-184952`) | Plumbing |
| Pivot 07 | no check call came back | 3/3 (`-185108`) | Plumbing |
| Pivot 45 | judge reply unreadable, item passed | 1 pass, 1 unreadable judge, 1 R-AN-REST-KEY (`-185230`) | Watch: one real miss in four samples today (turn 3 didn't say the pivot did move); 5/5 before. Not the changed lines, but near them |
| Null 05 | said "jumped" | 3/3 (`-185350`) | Noise |
| Null 17 | the review record named the method | 3/3 (`-185538`) | Noise |
| Null 18 | crowded comp, no crowd question | 2/3 (`-185920`), same item | Noise, watch; failed once on 10-28 too |
| Null 30 | named Rotation or Scale no tool held | 3/3 (`-185717`) | Noise; failed twice on 10-29 |
| Null 37 | restated the opening on continue | 2/3 (`-185834`), same item | Noise, watch |

**Failing before today's merges (not caused by them):** spec 007's request cases speed graph 34 (a "New lesson"
request with a review due opens a review: a hard-rule fail), pivot 50 (Show me again runs to eight sentences),
null 45 (Done, check it offers to parent one) and null 46 (the hint gives the exact fix). Each failed in this
morning's runs too (11-09 11:35 to 12:04). They want `SKILL.md` fixes under spec 007.

**Plumbing:** the judge twice returned a malformed key (`"R-ONE-IDEA":"pass"`), and the runner counts that as a
fail. *For eval-engineer:* parse the judge leniently or retry once.

About $133 on B1 in all (full runs $106, repeats $21, offset 20 $2.56, before that the skill-builder's targeted
runs $22.55).
