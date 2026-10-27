# Speed graph: usage notes

Live runs of `/speed-graph-mentor` (spec 008) on **Mentor Practice** in `discovery/Claude AE Tutor
Test.aep`. Each session logs results against the success criteria in
`specs/008-speed-graph/spec.md`. Timings come from `calls.jsonl` (times are UTC). The live checks
and captures before the first lesson are in `specs/008-speed-graph/live-sitting-2026-10-26.md`.

## Session 1: 2026-10-26 (T032, User Story 1)

One first lesson, in a plain Claude Code session in the repo (the cockpit, not a subagent), on
the real learner record. Starting state: Mentor Practice as captured in `practice-now.json`, with
Title eased by Easy Ease and no speed-graph history in the record. Easing counted as learned
(6 passes; its review has been due since 2026-10-13). The record's easing lessons have no
`targets`, so the eased layers came from the lesson text: Title, Subtitle, Glow, Bar.

**Stale server (noted after the fact, from `offset.md` session 1 problem 2):** this lesson ran on
an `ae-mentor` server started at 10:03 that morning, so it missed `1bfe235` (14:49), the only
later commit that changed speed graph's logic: `drag_sideways` now keys on a landing that fails a
and is under 53.33 influence, not on the baseline. No pair in this lesson arrived moving, so that
rule never ran, and the four verdicts below stand. The other later `mentor/` commits changed only
fixtures and tests. `SKILL.md` is read fresh each run, so the prompt was current.

### Steps (quickstart § 5)

| Step | What happened | Matches the expected result? |
|---|---|---|
| Prerequisite | Read the record. Easing learned, so no offer to do easing first. No speed-graph history | Yes |
| 1. Look and propose | Proposed Title as the focus, with Position 0.5–1.5, 1.5–3, 3–4.37 s and Scale 0.5–1.5 s. Opacity was left out of the focus and not mentioned. Leave-outs, one sentence each: Old Take hidden, CTRL a null, Icon a precomp, Logo Rotation under an expression, Subtitle Opacity, Bar X Position and Glow Blurriness still to ease. Asked whether anything should land hard; I said all soft | Yes |
| 2. Read the graph | Asked me to open the speed graph on Position 0.5–1.5 s. I said "in the middle". The tool said middle | Yes |
| 3. Explain | `preview_frame` at 0.7 s. Said where Title was on screen only. Explained reach as how long the ease lasts, short out and long in, and keeping the landing handle on the bottom. No numbers | Yes |
| 4. Demo | Asked to be shown. One `speed_graph_demo` on Title Position 0.5–1.5 s, then frames at 0.65 s and 1.35 s. Said the peak moved toward the start and that Edit > Undo reverses it. No numbers | Yes |
| 5. Check 1 | Both of my Position pairs passed, and the demo pair was credited to the demo. Scale was not shaped. Hint at Scale, with a reminder to choose Edit Speed Graph (Scale opens in the value graph) | Yes |
| 5. Check 2 | All four passed with no other changes. Said to play it back at full speed | Yes |
| 6. Read again | I answered "it's fastest at 19 frames", not start, middle or end. The mentor judged that as near the start (frame 19 at 30 fps is 0.63 s, about 0.13 of the way through the pair, the check's first part) | Yes, but **problem 1** |
| 7. Record | `record_lesson`: passed, demo used, reading answers in plain words, next is Title's Opacity with no demo or a review | Yes |

### SC-001: speed and demos

| Measure | Value | Target | Pass? |
|---|---|---|---|
| Start to verified pass (`read_learner_record` 21:41:42 to second check, 21:45:17) | **3 min 35 s** (4 min 15 s to `record_lesson`) | ≤ 15 min | ✓ |
| Demonstrations | 1 | ≤ 1 | ✓ |
| Demo to first check (two Position pairs shaped by me) | 45 s | none | |
| Slowest tool call | `preview_frame`, 534 ms | none | |

### SC-002: the check vs. my look in the Graph Editor (4 of 10 needed across the build)

| # | Pair | Check 1 | Check 2 | My verdict (Graph Editor) | Agree? |
|---|---|---|---|---|---|
| 1 | Title Position 0.5–1.5 s (demo) | Passed, credited to the demo | Passed, demo | Shaped, by the demo | ✓ |
| 2 | Title Position 1.5–3 s | Passed | Passed | Shaped | ✓ |
| 3 | Title Position 3–4.37 s | Passed | Passed | Shaped | ✓ |
| 4 | Title Scale 0.5–1.5 s | Not shaped | Passed | Not shaped, then shaped | ✓ |

Mix: one Scale pair (needed), one demo pair, no dragged-up landing yet. **4 of 4 agree.** That
makes 4 of the 10 pairs SC-002 needs. The dragged-up landing has to come from a later session
(T035's review, or a lesson where I drag a landing up on purpose).

### Findings and fixes

- **A frame number as the reading answer isn't covered (problem 1).** At step 6 I answered "19
  frames". `SKILL.md` stage 6 only expects start, middle or end (`fastest.parts`), so the mentor
  had to turn the frame into a part by itself. It got it right, but it was guessing at the frame
  rate, which the snapshot doesn't return. **Fix:** see "To fix later". **Eval case proposed:**
  below.
- **The Scale miss on the first check matches the value-graph default.** I shaped both Position
  pairs and missed Scale, the one property that opens in the value graph. The mentor's hint
  reminded me to choose Edit Speed Graph. This is one data point that the version step in
  `SKILL.md` matters, not a problem.
- **"Ease first" disagreed with the record, and that was correct.** The opening said Subtitle, Bar
  and Glow still need easing, though the record says I eased them on 10-05 to 10-07. The comp
  was reset since then, the snapshot reads the comp as it is now, and eased layers only steer the
  focus. Nothing to fix, but a learner who remembers easing those layers may find it confusing.
- **No leaks.** No numbers, field names, undo labels or announced calls reached me in the lesson.

**Proposed eval case (for the eval engineer, on `evals-wave-a`): reading answer given as a time.**
Situation: a passed check, stage 6. Turn: "fastest at 19 frames" (and a variant, "around 0.6
seconds"). `expect`: no `speed_graph_demo`, and no influence or speed numbers. Rubric: the mentor
places the answer in the pair (start, middle or end) from the pair's times, says whether it agrees
with the check, and doesn't say a percentage.

**Caveat:** I was the learner, and I built the skill and the comp, so I knew what Easy Ease looks
like in the speed graph before the reading step. This is one session. For SC-001 and SC-002 to
count as evidence that the lesson teaches, a target-market learner needs to run it (the same gap
as belief 7). As a check on the tools, the 4-of-4 agreement holds no matter who the learner was.

## To fix later

- **A time or frame reading answer.** `SKILL.md` stage 2 and stage 6 check the answer only against
  start, middle or end. Proposed fix: one sentence in stages 2 and 6, "If they answer with a time
  or a frame, place it in the pair from its key times", and add the comp's frame rate to
  `speed_graph_snapshot`'s `comp` block (`mentor/tools/speed-graph.mjs`) so frames can be turned
  into seconds without guessing. Test: a unit test that `comp.frame_rate` is returned, and the
  eval case above.

## Edge cases to plan for

Overlaps found in live use that future features must test (see `/overlap-audit`).

- **A record of a skill vs. the comp now.** A layer named in an easing lesson can be linear again
  after a reset. The focus uses it as "eased before" while the leave-outs say it needs easing.
  Both are right, but each skill that reads `eased_layers` (or another skill's targets) should
  test a fixture where the record and the comp disagree.
