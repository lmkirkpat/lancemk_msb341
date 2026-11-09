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
- The capture taken before the lesson read Title's keys as linear. After the lesson Title is shaped,
  with an out influence of 15.13. That capture can't be the check for Title; check Title against
  the T032 shape after reopening the repo's file.
