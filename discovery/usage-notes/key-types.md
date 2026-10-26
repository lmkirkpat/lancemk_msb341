# Key types: usage notes

Live runs of `/key-types-mentor` (spec 009) on **Mentor Practice 2** in `discovery/Claude AE Tutor
Test.aep`. Each session logs results against the success criteria in
`specs/009-key-types/spec.md`. Timings come from `calls.jsonl` (times are UTC). The live checks
and captures before the first lesson are in `specs/009-key-types/live-sitting-2026-10-26.md`. The
build hand-back (T037) goes in `key-types-build.md`.

## Session 1: 2026-10-26 (T035, User Story 1)

One first lesson, in a plain Claude Code session in the repo (the cockpit, not a subagent), on
the real learner record. It ran right after speed graph's first lesson (`speed-graph.md`) in the
same session. Starting state: `capture.mjs --compare` against `layer-info/practice2b.json` said
"Matches" (on the first try the active comp was still Mentor Practice, so it listed every layer
until I switched). Easing was learned and there was no key-types history.

### Steps (quickstart § 5)

| Step | What happened | Matches the expected result? |
|---|---|---|
| 0. Remember | Easing learned, so no offer to do easing first. No key-types history, so nothing to recall | Yes |
| 1. Look and ask | The intent question came first. Blink, then Cut, were named as questions (two candidates). Seal was left out as a precomp. None of the 2b layers was a candidate | Yes |
| 2. Focus | I said Blink's Opacity should snap. The focus was its three pairs (1–1.4, 1.4–1.8, 1.8–2.2 s). I didn't answer about Cut, so it was neither a focus nor marked as a fade | Yes |
| 3. Explain | Frames at 1.2 s (mid-fade) and at 0.467 and 0.533 s (either side of Dot 1's held jump). Said hold keeps the value until the next key, then jumps, and that the hold goes on the key at the start of each pair. Gave Animation > Toggle Hold Keyframe ⌃⌥⌘H and the right-click | Yes, but **problem 1** |
| 5. Demo | I asked to be shown. `key_types_demo` on Blink 1–1.4 s only, with frames at 1.367 and 1.433 s. It said Blink snaps to 0 and vanishes at 1.4 s, never that it's hidden, and that Edit > Undo reverses it | Yes, but **problem 1** |
| 7. Check | Passed on the first check: the demo pair was credited to the demo, 1.4 and 1.8 s to me, with no extra holds and no other changes | Yes |
| 8. Linear on purpose | I named Spinner's Rotation. The check said it's linear, it said so and that it'll stay that way. Exactly one kept-linear mark was written (Spinner Rotation, 0.25 and 4.25 s) | Yes |
| 10. Record | Passed, demo used, Spinner's constant speed noted, next is to decide Cut at 3 s with no demo | Yes |
| Wording | Only ⌃⌥⌘H was named, no "freeze" or Freeze Frame, no field names, no announced calls | Yes |

### SC-001: speed and demos

| Measure | Value | Target | Pass? |
|---|---|---|---|
| Start to verified pass (`read_learner_record` 21:50:18 to first check, 21:54:16) | **3 min 58 s** (4 min 49 s to `record_lesson`) | ≤ 15 min | ✓ |
| Demonstrations | 1 | ≤ 1 | ✓ |
| Demo to check (two pairs held by me) | 59 s | none | |
| Slowest tool call | `key_types_snapshot` with a focus, 1,385 ms; `key_types_check` with constant speed, 1,337 ms | none | |

### SC-002: the check vs. the timeline (4 of 10 needed across the build)

| # | What was checked | What I did | Tool's verdict | My verdict (timeline) | Agree? |
|---|---|---|---|---|---|
| 1 | Blink Opacity 1–1.4 s | Asked for the demo | Held by the demo | Held at 1 s, by the demo | ✓ |
| 2 | Blink Opacity 1.4–1.8 s | Toggled hold on 1.4 s | Held by me | Held | ✓ |
| 3 | Blink Opacity 1.8–2.2 s | Toggled hold on 1.8 s | Held by me | Held | ✓ |
| 4 | Spinner Rotation (constant speed) | Nothing | Linear | Linear at both ends | ✓ |

Mix: all holds made with the toggle, none wrong or partial. **4 of 4 agree.** That makes 4 of the
10 SC-002 needs. The optional wrong-side try from the quickstart (Hold set on Blink's 1.4 s key
with Keyframe Interpolation…, so the pair snaps too early) **wasn't run**. It's still the one
SC-002 case L-2 didn't read live, so it's the first thing to try in the review or another session.

SC-006, live part: exactly one mark was written for the confirmed move ✓. The second half (the
next easing lesson on Mentor Practice 2 leaves Spinner out) wasn't run.

### Findings and fixes

- **Frames on Mentor Practice 2 don't show which shape is the focus (problem 1).** The comp,
  with its 2b layers, has about 30 overlapping red and tan shapes. In the frames at 1.2, 0.467,
  0.533, 1.367 and 1.433 s, the mentor couldn't pick out Blink or Dot 1. It correctly described
  the snap from the tool data and never pointed at a shape it couldn't identify, but stage 3's
  "show what a snap looks like on your own comp" lost most of its value. A real learner's busy
  comp would do the same. Cause: `preview_frame` renders the whole comp, with nothing to say
  which layer to look at. **Fix:** see "To fix later". No eval case: the eval fixtures don't
  render frames.
- **An unanswered candidate stays open, and that's correct.** I answered for Blink only. Cut wasn't
  put in the focus or marked "should fade", and the record's next step brings it back. That
  keeps Cut unheld for § 6's review, as the quickstart needs.
- **Demo and check matched the sitting.** The demo's frames (1.367, 1.433 s) and the credit on
  the demo pair were as the quickstart expected.

**Caveat:** I was the learner and I built Mentor Practice 2, so I knew where Blink was and what
it does. All four verdicts matching is evidence about the check, whoever the learner is. Whether
a learner gets the snap from these frames is the open question, and problem 1 suggests a
learner who didn't build the comp would see less. A target-market learner on their own comp is
what would make SC-001 count as teaching evidence (belief 7).

**Afterwards:** the lesson left Blink held. Mentor Practice 2 has to go back to
`layer-info/practice2b.json` before the offset, pivot and null lessons (quickstart § 5).

## To fix later

- **Point at the focus layer in a frame.** `preview_frame` (`mentor/tools/common.mjs`) renders
  the whole comp. Proposed: an optional `layer` argument that returns the layer's on-screen
  bounds alongside the image, or a second image with the other layers dimmed (solo is a
  project change, so it would have to be undone in the same step, or rendered from a duplicate).
  This changes a shared tool, so it needs a spec 004 shared-code request first. Test: a unit test
  that the bounds come back for a visible layer and are absent for a hidden one or a null.

## Edge cases to plan for

Overlaps found in live use that future features must test (see `/overlap-audit`).

- **A busy comp vs. frame-based teaching.** Every skill's "explain with a frame" step assumes the
  learner can find the focus layer in the frame. Skills 5 and 6 (pivot, null) also lean on
  frames. Test them on Mentor Practice 2 as built, not on a clean comp.
