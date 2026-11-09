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
layer, and the connection mark when After Effects quits. Which panel the builder would rather use isn't recorded yet.
