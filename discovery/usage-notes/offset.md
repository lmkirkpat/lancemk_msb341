# Offset: usage notes

Live runs of `/offset-mentor` (spec 010) in `discovery/Claude AE Tutor Test.aep`. Each session
logs results against the success criteria in `specs/010-offset/spec.md`. Timings come from
`calls.jsonl` (times are UTC). The live checks and captures before the first lesson are in
`specs/010-offset/live-sitting-2026-10-26.md`. The build hand-back (T039) goes in
`offset-build.md`.

## Session 1: 2026-10-26 (T036, User Story 1, properties kind on Mentor Practice)

One first lesson, in a plain Claude Code session in the repo (the cockpit, not a subagent), on
the real learner record. It ran in the same session as speed graph's and key types' first lessons
(`speed-graph.md`, `key-types.md`). Easing, speed graph and key types were learned, and there was
no offset history.

**Two things affected the run** (findings 1 and 2): a second session was driving After Effects
during the start of the lesson, and this session's `ae-mentor` server was older than the offset
code on `main`.

### Steps (quickstart § 5.1)

| Step | What happened | Matches the expected result? |
|---|---|---|
| Setup | Mentor Practice 2 was active at "go". After a switch, the first snapshot read Mentor Practice | No: **problem 1** |
| 0. Remember | Easing learned, so no offer to do it first. Mentioned that speed graph was earlier today on the same layer | Yes |
| 1. Look and propose | Title's Position, Scale and Opacity, 0.5 to 1.5 s, proposed. Bar and Glow (both at 0 s) offered once as the layers kind. Left out, one sentence each: CTRL (null), Old Take (hidden), Icon (precomp), Logo's Rotation (expression) | Yes |
| 2. Explain | Frame at 1 s: Title mid-fade, mid-scale and mid-slide at once, "nothing leads the eye" | Yes |
| 3. Order and gap | I said Opacity, then Position, then Scale, 64 frames apart. The snapshot came back "resumed" on Mentor Practice 2 (another session had switched comps) and couldn't match Scale. Paused about 11 minutes for the lock fix, then re-sent on Mentor Practice and said back in plain words, with my gap and none of its own | Yes after the pause, but **problem 1** |
| 4. Invite | Named what moves and in what order, described the key drag. Quick Offset not offered | No: **problem 2** |
| 5. Demo | Not asked for, none run | Yes |
| 7. Check 1 | All apart, 30 frames each (I changed my gap from 64 without saying so), but the order reversed. Asked whether it was a change of mind, didn't fail it or call it a pass | Yes, but **problem 3** |
| 7. Check 2 | Opacity first, Scale and Position swapped. Asked again | Yes |
| 7. Check 3 | Opacity 0.5 s, Position 1.5 s, Scale 2.5 s, in the stated order, nothing else changed. Pass | Yes |
| 10. Record | Passed, no demo, gaps 30 and 30 frames as measured, the two order corrections noted, next is the Dots on Mentor Practice 2 | Yes |
| Wording | No field names, no gap suggested, no announced calls, Edit > Undo not needed | Yes |

### SC-001: speed and demos

| Measure | Value | Target | Pass? |
|---|---|---|---|
| First Mentor Practice snapshot (22:01:43) to `record_lesson` (22:16:17), wall clock | 14 min 34 s | ≤ 15 min | ✓ (just) |
| Same, without the pause for the lock fix (22:02:39 to 22:13:27, 10 min 48 s) | **about 3 min 46 s** | ≤ 15 min | ✓ |
| Demonstrations | 0 | ≤ 1 | ✓ |
| Checks to a pass | 3 | none | |
| Slowest tool call | `offset_snapshot`, 315 ms | none | |

### SC-002: the check vs. a scrub in After Effects (9 of 10 needed across the live runs)

| # | What was checked | What I did | Tool's verdict | My verdict (scrub) | Agree? |
|---|---|---|---|---|---|
| 1 | Title's three properties | Staggered 30 frames, in the wrong order | All apart; Position 0.5 s, Scale 1.5 s, Opacity 2.5 s; order differs | Same | ✓ |
| 2 | Title's three properties | Moved Opacity first | Opacity 0.5 s, Scale 1.5 s, Position 2.5 s; order differs | Same | ✓ |
| 3 | Title's three properties | Swapped Position and Scale | Opacity 0.5 s, Position 1.5 s, Scale 2.5 s; order matches; pass | Same, including Position's first move at 1.5 to 2.5 s | ✓ |

Mix: three apart, two out of order, none still together, under the floor, outside the comp or
with changed keys. **3 of 3 agree.** T037 should fill the rest of the mix on purpose: one pair
still together, one layer that pops in, and one trimmed in point.

### Findings and fixes

1. **Two sessions drove After Effects at once (problem 1).** Session `7ff427e2`, preparing spec
   011's sitting in the `skill-5-anchor` worktree, made 26 AE calls from 21:58 to 22:05, including
   13 `ae_run_script`. That overlapped with the lesson's first three snapshots. It showed up as
   the wrong comp being active at "go" and a snapshot that "resumed" on Mentor Practice 2. Cause:
   the AE lock keyed on `agent_id` alone, so both top-level sessions were the holder `main`. The
   cockpit also didn't check whether another session was driving AE before starting, and at first
   put the comp change down to AE. **Fixed** in `35acf9c` (`decisions/008`, amendment
   2026-10-26): the lock keys on session plus agent, `SessionEnd` releases it, and CLAUDE.md
   says to run one sitting or live lesson at a time and check the lock first. No eval case: it's
   plumbing, not mentor behavior.
2. **The tool code was older than the skill (problem 2).** This session's `ae-mentor` server
   (pid 58197) started at 16:03 UTC, and `/clear` doesn't restart MCP servers. Commits that came
   after it: `45bed30` (offset lists Transform properties first), `cf17a83` (`quick_offset`,
   creditFor reads `demo.undone`), and `c19ad23` (the demo pick skips locked layers). `SKILL.md`
   is read fresh each time the skill runs, so the lesson ran today's prompt against this
   morning's tools. That showed up two ways: `offset_snapshot` returned no `quick_offset`, so
   Quick Offset was never offered on 26.5, and Mentor Practice 2's Dot 2 listed Blurriness before
   Position and Opacity. **What still counts:** the check logic for this lesson (no demo, nothing
   locked) didn't change in those commits, so the three verdicts and the pass stand. Quick Offset
   and the property order still need checking live, in T037 with a fresh server. The same server
   ran speed graph's and key types' first lessons, after `1bfe235` and `a4a8a07`. Those notes
   should say so. **Fix:** see "To fix later".
3. **The learner changed the gap without saying so (problem 3).** I asked for 64 frames, then
   staggered by 30. The check reads key times, so the pass is right, but the session still holds
   64 frames. A demo after that would have shifted by the wrong amount. `SKILL.md` step 3 re-sends
   the options when the learner *says* something new, but doesn't say what to do when a check
   shows a different gap from the stated one. **Fix:** propose an eval case (below). The smallest
   prompt fix is in step 7: when the measured gaps don't match the stated gap and no demo has run
   yet, say the gap back as measured and re-send `skill_options` with it.
4. **The order question worked.** Two checks with the order changed each got a question, never a
   fail, and the mentor held off saying "pass" until the order matched, even though `passed` was
   true on all three. Its first question also pointed out what the reversed order did on screen
   (Title moves and scales before it fades in).

**Eval case proposed (offset set, case number from the cockpit):** *gap changed after the fact.*
State: order and a 64-frame gap stated, then a check whose measured gaps are 30 and 30 with the
order reversed. Learner turn: "it was backwards, you're right", then "can you show me one?"
`expect`: no `offset_demo` call before an `offset_snapshot` that sends `gap_frames: 30`; no gap
number other than the learner's own (64 or 30). Rubric: "Says the measured gap back as the
learner's and doesn't suggest another." Offer `/eval-set` to add it when the offset set is merged
from `evals-wave-a`.

**Caveat:** I was the learner and I built Mentor Practice, so I knew what Title does and where its
keys are. The 3 of 3 agreement is evidence about the check, whoever the learner is. The 3 min 46 s
lesson time is a builder's time. A target-market learner on their own comp is what would make
SC-001 count as teaching evidence (belief 7).

**Criteria after this session:** SC-001 met for the properties kind (builder only). SC-002 is 3 of
the 10 checks it needs. FR-017 (Quick Offset offered at 25.4 or later) is still open live, because
of problem 2. Layers kind (T037) and the review (T040, a day or more later) are still to run.

**Decision signals moved:** `decisions/008`'s "separate terminal sessions" signal fired with one
person, and is answered by its 2026-10-26 amendment.

**Afterwards:** Title's three properties are left staggered (Opacity 0.5 s, Position 1.5 s, Scale
2.5 s). Mentor Practice's captures (`practice-now.json` and the speed-graph and easing fixtures)
read Title before this, so put it back, or re-capture on purpose, before the next lesson on
Mentor Practice. Mentor Practice 2 has to go back to `layer-info/practice2b.json` before T037.

## To fix later

- **A live lesson can run on a stale mentor server.** MCP servers start with the session and
  survive `/clear`, while `SKILL.md` is read fresh, so merges during a long session leave the
  prompt and tools out of step. Proposed: `mentor/server.mjs` records the `mentor/` tree's git
  hash when it starts (`git rev-parse HEAD:mentor`). Each lesson's snapshot tool returns
  `server_current: false` when the hash on disk differs, and every skill's step 0 says, in the
  learner's words, that the mentor needs a restart before the lesson. That means a spec 004
  shared-code request, since it touches `common.mjs` and every snapshot tool. Until then,
  CLAUDE.md's pre-lesson check: start a fresh session for a live lesson after any merge into
  `mentor/`. Test: a unit test where a changed hash returns `server_current: false`, and the same
  hash returns true.
- **Stated gap vs. measured gap** (finding 3): the step 7 sentence above in
  `.claude/skills/offset-mentor/SKILL.md`, with the eval case.

## Edge cases to plan for

Overlaps found in live use that future features must test (see `/overlap-audit`).

- **A property with several moves.** Title's Position has later moves (1.5 to 3 s, 3 to 4.37 s,
  from speed graph's lesson). Staggering its first move to 1.5 to 2.5 s put it alongside the next
  move's start, and the check still graded it with the right key count. Worth a fixture where a
  shifted first move overlaps or passes the second move's keys.
