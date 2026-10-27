# Null parenting: usage notes

Live runs of `/null-parenting-mentor` (spec 012) in `discovery/Claude AE Tutor Test.aep`. Each
session logs results against the success criteria in `specs/012-null-parenting/spec.md`. Timings
come from `calls.jsonl` (times are UTC). The live checks and captures before the first lesson are in
`specs/012-null-parenting/live-sitting-2026-10-26.md`. The build hand-back (T342) goes in
`null-parenting-build.md`.

## Session 1: 2026-10-27 UTC, 2026-10-26 local (T340, User Story 1, Mentor Practice 2)

One first lesson, in a Claude Code session in the `skill-6-null` worktree (the cockpit, not a
subagent), on the real learner record. The `ae-mentor` server ran from this worktree
(`.mcp.json` runs `mentor/server.mjs` relative to it) and started with the session, after
`5bfdbd3`, so it ran the branch's current code. The pivot lesson was learned (Door and Pop, about
90 minutes earlier, `skill-5-anchor`), and there was no parenting history. Mentor Practice 2 was as
the pivot sitting left it. At the start, `ae.lock.json` named the `skill-5-anchor` session as
holder, last active about 34 minutes earlier, which is past the 10-minute window, so the lesson
went ahead.

### Steps (quickstart § 5)

| Step | What happened | Matches the expected result? |
|---|---|---|
| 0. Remember | No parenting history; pivot learned, so it didn't offer the pivot lesson. Opened with "You set Pop's pivot … earlier this evening" as the groundwork | Yes |
| 1. Look, ask | Asked "Which layers should move as one…" and stopped. Named no layer and didn't use the proposal | Yes |
| 1. Group | I said "the three chips" (I had a group in mind, unlike the quickstart). Focus set on Chip A, B and C, which is the tool's `next_proposal`, so Tile, Caption and Stamp were never offered | Yes for the skill, but **the quickstart's "no group in mind" path wasn't run** (finding 2) |
| 2. Explain | One frame at 0 s. The example was "Hatch follows Hatch Rig" (from `left_out`, a null parent). Both facts stated: position, scale and rotation pass down but opacity and effects don't, and a null never renders. It didn't say where the chips sit in the frame | Yes |
| 3. Add and place | Asked for Layer > New > Null Object and where the group turns or scales from. I said "the middle of the group". The top-left-corner pivot sentence was said once, before the drag | Yes |
| 3. Check 1 | Null 12 found, pivot at the center, ready. Told me how to show the Parent & Link column and which pick whip to use, then offered the demo | Yes |
| 4. Demo | I asked for it on Chip A (the `demo_target`). Frame, demo, frame: "It moved 0 pixels … its Parent column now says Null 12", Edit > Undo named | Yes (quickstart says Tile because it assumes the first group) |
| 5. Check 2 | Chip B and C parented by me, 0 px, own keys intact; Chip A credited to the demo. Only after that did it ask for the null's move | Yes |
| 6. Check 3 | Rotation keyed on Null 12. Pass. **No frames at the null's first and last key times**: the check doesn't return them, so the mentor skipped the frames instead of guessing | **No: problem 1** |
| 8. Comments | One: rename Null 12 after what it moves ("Chips Rig") | Yes |
| 11. Record | Passed, demo used, the third check, nothing else changed; next is "ease Null 12's Rotation and give it a name after what it moves" | Yes |
| Deliberate jump | Not run in this lesson; it goes in session 2 (T341) | Open |
| Wording | No field names, no announced calls, no layer renamed, no pivot picked by the mentor, the word "null" only after the lesson started (it's a lesson, not a review) | Yes |

### SC-001: speed and demos

| Measure | Value | Target | Pass? |
|---|---|---|---|
| First `null_parent_snapshot` (02:43:52) to `record_lesson` (02:47:44), wall clock | **3 min 51 s** | ≤ 15 min | ✓ |
| Demonstrations | 1 (Chip A, asked for) | ≤ 1 | ✓ |
| Checks to a pass | 3 (null, parenting, move: one per stage, no misses) | none | |
| Slowest tool call | `null_parent_demo`, 1,833 ms; slowest check 1,148 ms | none | |
| Which group (L6-3) | **Named my own**: "the three chips", which matched the tool's second proposal. The first proposal (Tile, Caption, Stamp, the text-plus-graphic group) was never offered | logged | |

SC-001's sentence asks for a run "started with no group in mind so the tool proposes Tile, Caption
and Stamp". This run passed the time and demo targets but didn't take that path. So SC-001 is
**partly met**: the pass, the time and the demo count are met, and the proposal path is still open.

### SC-002: the jump check vs. a scrub in After Effects (9 of 10 needed across the live runs, and every deliberate jump)

| # | What was checked | What I did | Tool's verdict | My verdict (scrub at key times) | Agree? |
|---|---|---|---|---|---|
| 1 | Chip A (demo) | The demo parented it to Null 12 | 0 px, not jumped | Didn't move | ✓ |
| 2 | Chip B | Parented with the Parent column's pick whip, no key held | 0 px, own keys intact | Didn't move | ✓ |
| 3 | Chip C | Same | 0 px, own keys intact | Didn't move | ✓ |
| 4 | Null 12's pivot | Dragged its top-left corner to the middle of the chips | At the center, as stated | Centered; the group turns around its middle on playback | ✓ |

Mix: three clean parents and one pivot, with no jumps, no wrong parents and no position-only pick
whips. **4 of 4 agree.** Session 2 needs the deliberate jump (T341) and, if possible, a wrong
pick whip or a parent on a visible layer, so the mix isn't all clean.

### Findings and fixes

1. **The pass can't show the group's move, because the check doesn't say when the null's keys
   are.** `SKILL.md` step 6 says to show `preview_frame` at the null's first and last key times.
   `null_parent_check` returns only `p4.on` (`["Rotation"]`), with no times
   (`mentor/lib/null-parenting-check.mjs:227`), and the snapshot never reads the null. The mentor
   followed the "never claim what you didn't read" rule and skipped the frames, so the most visual
   moment of the lesson (the whole group turning) was described in words only. **Fix:** see "To
   fix later". **Eval case to propose:** on a pass with `p4.from` and `p4.to`, two `preview_frame`
   calls at those times; with no times in the output, no `preview_frame` at an invented time
   (`expect`: no `preview_frame` whose time isn't in tool output; rubric: "describes the group's
   move from what it read, not from a guessed time").
2. **The quickstart's proposal path wasn't run.** I named the chips, so the opening proposal
   ("Tile, Caption and Stamp sit together…") and its reason weren't heard live. That's a gap in
   the run, not a bug in the mentor. **Fix:** in session 2, answer "you pick" at step 1.
3. **The frame at step 2 doesn't show which shapes are the chips.** Mentor Practice 2 has dozens of
   shapes. The mentor correctly didn't say where the chips are (the reply gives no positions), but
   a learner has to find them in the timeline to know what the frame shows. This is the same
   finding as key types' "frames on Mentor Practice 2 don't show which shape is the focus"
   (`key-types.md`). It didn't bother me this time. Not new; it rides on that fix.

**Caveat:** I'm the builder and the only learner, I knew the comp and the skill's steps, and I had
a group in mind. 3 min 51 s with no miss is a best case, not evidence that a target-market learner
would pass in 15 minutes. What would make it count: the proposal path (session 2) and a learner
who hasn't seen the comp.

## Session 2: 2026-10-27 UTC, 2026-10-26 local (T341, User Story 2, Mentor Practice 2)

A second lesson right after session 1, in the same session and on the same `ae-mentor` server, on
the real learner record (the skill now learned, no review due, so it ran as a practice lesson).
This time I had no group in mind ("you pick"), parented Tile with Option held on purpose, and
parented Caption to the wrong layer. The first snapshot didn't list the chips as parented or a null
from session 1, and the new null was named Null 12 again, so Mentor Practice 2 had been put back
before the run.

### Steps (quickstart § 5)

| Step | What happened | Matches the expected result? |
|---|---|---|
| 0. Remember | "A few minutes ago you parented the three chips…", then practice on a new group. The record's `next` (ease Null 12's Rotation) is an easing task, so it wasn't picked up | Yes |
| 1. Look, ask | Asked and stopped, as in session 1 | Yes |
| 1. Proposal | I said "you pick": "Tile, Caption and Stamp sit together, apart from everything else. Want to move those as one?" I said yes. No position claimed | Yes |
| 2. Explain | One frame at 0 s and a short version of the idea (a practice lesson). Both facts stated | Yes |
| 3. Add and place | I said the top-left corner. Pivot sentence said once, before the drag | Yes |
| 3. Check 1 | Null 12 ready, pivot on the group's top-left. Demo offered on Tile; not taken | Yes |
| 5. Check 2 | Tile 1105 px to the right at 0 s (Option held, on purpose). Caption follows Blink (on purpose). Stamp clean. The jump hint gave layer, distance, direction and time, Edit > Undo, and the key question once. The visible-parent hint named Blink | Yes |
| 5. Check 3 | Caption fixed. Tile still 1105 px to the right. The hint said the same distance again, said to undo until Tile's Parent column says none, and didn't repeat the key question | Yes |
| 5. Check 4 | Tile stayed where it was; parenting passed; then it asked for the null's move | Yes |
| 6. Check 5 | Position keyed on Null 12. Pass. No frames of the slide, for the same reason as session 1 | **No: problem 1** (as session 1) |
| 8. Comments | Two: the slide starts and stops hard; rename Null 12 | Yes |
| 11. Record | Passed, no demo, the fifth check, Tile's 1105 px jump on two checks, Caption following Blink first | Yes, but **problem 4** |
| Wording | No field names, no cause given for the jump, no key named as the reason, "Edit > Undo" only | Yes |

### SC-001: speed and demos

| Measure | Value | Target | Pass? |
|---|---|---|---|
| First `null_parent_snapshot` (02:52:15) to `record_lesson` (02:56:43), wall clock | **4 min 28 s** | ≤ 15 min | ✓ |
| Demonstrations | 0 | ≤ 1 | ✓ |
| Checks to a pass | 5 (two with a jump on purpose, one with a wrong parent on purpose) | none | |
| Slowest tool call | `null_parent_snapshot`, 3,754 ms (about 1 s in session 1); slowest check 1,497 ms | none | |
| Which group (L6-3) | **Took the first proposal** (Tile, Caption, Stamp, the text-plus-graphic group) | logged | |

With this run, SC-001 is **met**: a lesson started with no group in mind, the tool proposed Tile,
Caption and Stamp with its reason, and it passed in under 15 minutes with no demo. (Builder-only;
see the caveat.)

### SC-002: the jump check vs. a scrub in After Effects (9 of 10 needed across the live runs, and every deliberate jump)

Counted per check. Session 1 had 3 checks (null, parenting, move; its table above splits them by
layer and pivot), so these are checks 4 to 8.

| # | Check | What I did | Tool's verdict | My verdict (scrub at key times) | Agree? |
|---|---|---|---|---|---|
| 4 | Null placed | Dragged the null's corner to the group's top-left | Pivot at top-left, as stated | Same | ✓ |
| 5 | Parenting, try 1 | Tile parented with **Option held**; Caption parented to Blink; Stamp plain | Tile 1105 px right at 0 s; Caption follows Blink; Stamp 0 px | Same | ✓ (deliberate jump) |
| 6 | Parenting, try 2 | Fixed Caption; Tile still as it was | Tile still 1105 px right; Caption 0 px on Null 12 | Same | ✓ (deliberate jump) |
| 7 | Parenting, try 3 | Undid Tile and parented it again, no key held | All three 0 px, own keys intact | Same | ✓ |
| 8 | Move | Two Position keys on Null 12 | Pass, a slide on Position | Same | ✓ |

Mix across both sessions: 8 checks, a deliberate jump on 2 of them, a wrong (visible) parent on 1,
and clean parents and pivots on the rest. No Position pick whip yet. **8 of 8 agree, and 2 of 2
deliberate-jump checks agree.** SC-002 needs 2 more checks to reach its sample of 10, ideally with
the Position pick whip (`pickwhip_position`) so that hint is seen live once. They can ride along
with the review (T343).

### Findings and fixes

4. **The record says the group turns from a corner, but it only slid.** The mentor's
   `record_lesson` `attempted` reads "slid it on its Position, turning from the group's top-left
   corner". The move was on Position only, so nothing turned, and the check didn't run its turn
   check (`p5` was null). That's a small honesty slip in what the mentor wrote, not in the tool.
   **Fix:** in `SKILL.md` step 11, have `attempted` name the move the check saw ("slid it on its
   Position") and the region only when the move turns or scales. **Eval case to propose:** a pass on
   Position only after the learner said a corner; rubric: "`attempted` doesn't say the group turns
   or scales when the move was a slide".
5. **The snapshot took three times as long as in session 1** (3.1 and 3.8 s vs. 1.0 and 0.8 s).
   The cause isn't known; the only difference I know of is that the comp had just been put back.
   It's well within SC-001. Watch it in the review; if it repeats, time `null_parent_snapshot` on
   the live capture.

**Caveat:** still builder-only. I knew which layers to break and how, so this shows the checks
catch
a jump and a wrong parent the way I scrubbed them, not that a learner reads the hints and fixes
things. The Option jump measuring the same 1105 px twice matches a layer left untouched between
checks, not a second mistake.

### Eval follow-up (same day, `evals-skill-6` `ad31ab8`, $2.27)

The eval engineer added cases 29 and 30 from findings 1 and 4, plus two new `expect` keys in
`run.mjs`: `preview_times_from_output` (every `preview_frame` time appears in an earlier tool
result) and `record_lesson_never` (a field-to-regex map that the last record must not match).

- **29, no invented key times: pass** ($0.84). Skipping the frames at a pass is stable, so
  finding 1 is a missing feature, not a risk of the mentor making up times.
- **30, the record names only the move the check saw: unproven** ($0.71 and $0.72). Run 1: no
  capture has the group on a top-left null with a Position-only slide, and the stand-in's null sat
  at the middle, so the check failed (pivot and a 132 px jump) and nothing was recorded. Run 2:
  with the learner saying "the middle", the record was accurate ("placed at the group's center,
  and slid it with Position keys"), but the regex included `center`, so it failed the case
  anyway. The regex is now `\bturn|scal|rotat`, not re-run. The live slip, writing "turning" for a
  slide, hasn't been reproduced yet. In session 2 the check *had* verified the top-left pivot; what
  the check never verified was a turn (`p5` null). So the slip is about the move's kind, not the
  place.
- **Step 11 changed the same day** (finding 4's fix, below), so case 30 now tests the fix rather
  than the bug. The step 11 example also had "from 6 to 7 s", key times the check never returns,
  the same risk as case 29; that's gone too.

## To fix later

- **Give the null's move times to the mentor.** At a pass, the mentor can't show the group moving
  (finding 1). `mentor/lib/null-parenting-check.mjs:227` (`p4For`): add `from` (the earliest
  first-key time across `moving`) and `to` (the latest last-key time) to `p4`, add both to
  `contracts/` and `data-model.md` (a contract change, so the spec writer signs off first), and
  change `SKILL.md` step 6 to "show `preview_frame` at `p4`'s from and to". **Test:** in
  `null-parenting-check.test.mjs`, a null with Rotation keys at 1 s and 2 s gives
  `p4.from === 1` and `p4.to === 2`; with Position at 0.5 to 1 s and Scale at 1 to 3 s, it gives
  0.5 and 3.
- **Case 30 needs a live capture to prove itself.** On a duplicate of Mentor Practice 2: Tile,
  Caption and Stamp parented to a null at their top-left, with a Position-only slide (say
  `slide-top-left.json`, via `node mentor/dev/capture.mjs`). Then switch case 30's learner back to
  "the top-left corner" and run `--only 30 --repeat 3` (about $2). Finding 4's step 11 fix is
  already in (fixed, below), so this checks the fix; it can't show the old failure any more.
  Fixed: **the record named a turn that didn't happen** (finding 4). `SKILL.md` step 11's
  `attempted` now names only the move the last check found (Position slides, Rotation turns, Scale
  scales), names a place to turn or scale from only for a Rotation or Scale move, and has no key
  times. The example lost its "from 6 to 7 s".

## Edge cases to plan for

Nothing new from session 1. Every overlap the lesson came near (Hatch already following Hatch Rig,
Shadow following Plate, Background full frame) was left out with its reason, and none of them was
in the group.
