# Ask the mentor: usage notes

Live sessions of asking the mentor about my own comps (spec 014, T092 to T094), against the success criteria in
`specs/014-ask-mentor/spec.md`. Timings and cost come from `panel-turns.jsonl` and `calls.jsonl` in the learner
home (`node panel/dev/turns.js --ask`).

## Session 1: 2026-11-23 (T092)

My own logo comp (Comp 1), `main` at `c74967b` with phase 3 merged. **It ran on B1, not A:** AE had been open
since Nov 19, 19:56, the panel loaded then (`panel-loaded.json`), and `panel.json` was switched to `"a"` at 21:05
that night (T091). The panel reads its runtime at load, so every turn logged `"runtime":"b1"`, on the Nov 19 panel
code. Nobody restarted AE before the session, and the cockpit's pre-session check read `panel.json` but not when
AE started.

### Steps

| Step | What happened | Matches? |
|---|---|---|
| a. Ask: how to make the text that falls out of the rock not shake like the rock | One read (`describe_layers` on layer 1), one answer: the fall is the text's own 2 eased Position keys, the shake is from riding on Shake Control (a null moved by expressions). Two steps: set Parent & Link to None; play it back and check the fall. Goal saved as "keep a falling layer's own move while dropping a parent's shake" | Yes |
| b. "Let's go deeper on step 1" | `go_deeper` refused `NOT_ON_THIS_RUNTIME`; "open Group with a null from the Skills tab" | Correct for B1, but **No: problem 1** (the offer showed at all) |
| c. Started Group with a null from the Skills tab | Lesson opened, ended about 47 s later (`end_lesson`). "Almost entirely unhelpful for what I was trying to do" | **No: problem 2** |
| d. "Okay done, is that right?" | Whole-comp read, then 7 sentences: "I don't have my earlier read", the shake's numbers again, a pivot it can't confirm, "which step did you just do?" | **No: problem 3** |
| e. "I set the layer 1 parent control to None" | Read layer 1 again: "Yes, it worked", no parent now, its own eased keys are all that move it; play it back to check | Yes |

### SC-002 and SC-003: steps followed, layer named

| # | Step line | Followed without asking? | Layer named | Right in AE? |
|---|---|---|---|---|
| 1 | Set Parent & Link of DISCOVER the past to INSPIRE the future from Shake Control to None | ✓ | DISCOVER the past to INSPIRE the future | ✓ |
| 2 | Play it back and check the text still falls and lands where you want | ✓ | none | n/a |

2 of 2 followed, 0 explanation-only. 1 of 1 layer right. Builder: "the steps were very clear to follow and super
helpful", and every layer name in the thread was accurate.

### Verdicts

| # | What I did | Mentor's verdict | My verdict | Agree? |
|---|---|---|---|---|
| 1 | Parent of the text set to None | "Yes, it worked": no parent, its own keys move it | Done, and it falls without the shake | ✓ |

### SC-004 and SC-005: speed and cost (B1, so cost doesn't count toward SC-005)

| Measure | Value | Target | Pass? |
|---|---|---|---|
| First activity, question | 3.0 s (whole turn 14.7 s) | ≤ 10 s | ✓ |
| First activity, follow-ups | 2.7 s, 4.3 s, 1.8 s | ≤ 10 s | ✓ |
| Answer turn cost | $0.62 (B1, notional) | ≤ $0.10 on A | n/a on B1 |

### Findings

1. **The go-deeper offer showed on B1, then couldn't run.** The answer carried `parenting.null` and the closing
   "Try it, or want to go deeper on step 1 with *Group with a null*?". B1 should strip offers. The Nov 19 panel
   was running, so this may already be fixed on `main`; check it in session 2 only if it's B1 again. On A it's
   the intended path.
2. **The Skills-tab lesson didn't fit the question.** Started cold, Group with a null teaches putting layers under
   a null, while the step was taking one layer *out* of a parent. On A the hand-in would carry the layer and the
   step into the lesson (FR-034, phase 3's hand-in for null), which is what needs testing; a cold lesson is the
   wrong comparison. The step's skill tag is still debatable: unparenting is part of parenting, but the lesson
   never teaches it. **Watch on A:** does the hand-in lesson start from "take this layer off its parent"?
3. **The "done, is that right?" reply is the eval finding, live.** 7 sentences (the eval caps are 3 to 5), and a
   pivot comment unrelated to the question. Its "I don't have my earlier read" is true: the follow-up came after
   a lesson, and the wrapper (amendment (e)) carries the last question and answer but not the read. It still
   asked "which step did you do?" when the answer had one change step. Same shape as ask 21, 26 and 30, all 0/3
   on A. Strengthens the case for `ask-build.md` › Phase 3 merge fix 1 (a cap on the try-went reply) and fix 2.
4. **The shake's numbers moved between turns.** The answer gave Position about 12 px near 1.5 s and Rotation 0.59°
   near 2.6 s; the whole-comp read in step d gave 12 px near 2.5 s and 0.28° near 1.7 s. Likely measured on
   different layers (the text vs. the comp summary), but the reply doesn't say so, so it reads as
   inconsistent. Not noticed by the builder.

**Proposed eval case (ask 32):** a follow-up "done, is that right?" after a lesson ended mid-thread (wrapper, no
earlier read), on `comp1.json` with layer 1's parent now None. `expect`: first tool `describe_layers` on layer 1,
prose ≤ 4 sentences, never "pivot" or "anchor", never asks which step when the answer had one change step.
Rubric: R-TRY-READ.

**Caveat:** builder as user, one session, on B1. The steps and layer names count toward SC-002 and SC-003. The
go-deeper doesn't count toward SC-001 or SC-013: it was never handed in. **Before session 2: quit and restart AE**,
then check `panel-loaded.json`'s time is after the restart and the first turn logs `"runtime":"a"`.

## To fix later

- **Pre-session check misses a stale panel.** `panel.json` can say `"a"` while a panel loaded earlier runs B1.
  Proposed: the panel shows its loaded runtime (or the turn log's `runtime`) in the Home footer, and
  `/usage-session` compares `panel-loaded.json` to AE's start time before a sitting.
- **Numbers across turns** (finding 4): when a follow-up's read is wider than the answer's, say which layer the
  numbers are measured on.
