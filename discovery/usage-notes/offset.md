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

## Session 2: 2026-10-26 (T037, User Story 2, layers kind on Mentor Practice 2)

One first lesson on the layers kind, in a fresh Claude Code session in the repo (the cockpit, not a
subagent), on the real learner record. Mentor Practice 2 was reset to `layer-info/practice2b.json`
first. Easing, speed graph, key types and offset (properties kind, session 1) were learned. This
session's `ae-mentor` server (pid 54473) started at 16:22 local, after the last `mentor/` merge
(`2082ef5`, 15:52), so session 1's problem 2 didn't apply: the tools matched `main`.

### Steps (quickstart § 5.2)

| Step | What happened | Matches the expected result? |
|---|---|---|
| Setup | Mentor Practice 2 active, reset to `practice2b.json`, fresh server | Yes |
| 0. Remember | Offset learned earlier today (properties kind), not due. Mentioned the earlier Title lesson and that its note pointed to the Dots | Yes |
| 1. Look and propose | The first snapshot came back "resumed", carrying session 1's order (Opacity, Position, Scale) and 64-frame gap, so Scale was unmatched. The mentor didn't say "resumed" and started fresh. Proposed the Dots at 0.5 s (following the record's note), with Dot 2's Position, Opacity and Blurriness offered in one sentence. Seal left out as a precomp | Mostly: **problem 1**. The tool proposed the properties kind first and the mentor led with the Dots; the quickstart expects Dot 2's properties first |
| 2. Explain | Frame at 1 s: all three Dots mid-move, "nothing leads the eye". The frame doesn't show which shapes are the Dots (the same issue as key types' finding) | Yes |
| 3. Order and gap | Dot 1, Dot 2, Dot 3, 6 frames. Said back with my gap and no other number. Over the floor | Yes |
| 4. Invite | Bar drag, key drag, and **Quick Offset offered alongside** (FR-017 live) | Yes |
| (question) | "explain how quick offset works": three steps and what to watch for | Partly: **problem 2** |
| 5. Demo | Not asked for, none run | Yes |
| 7. Check 1 | Dot 2 +6 frames on all three properties, Dot 3 +12 on Position (X and Y) and Opacity, even rhythm, nothing else changed. Pass | Yes |
| 10. Record | Passed, no demo, gaps 6 and 6 as measured, next is the Chips review or Dot 2's properties | Yes, but **problem 3** |
| Wording | No field names, no gap suggested, no announced calls | Yes |

### SC-001: speed and demos

| Measure | Value | Target | Pass? |
|---|---|---|---|
| `read_learner_record` (22:27:20) to `record_lesson` (22:29:25), wall clock | **2 min 5 s** | ≤ 15 min | ✓ |
| Demonstrations | 0 | ≤ 1 | ✓ |
| Checks to a pass | 1 | none | |
| Slowest tool call | `preview_frame`, 991 ms (`offset_check` 535 ms) | none | |

### SC-002: the check vs. a scrub in After Effects (9 of 10 needed across the live runs)

| # | What was checked | What I did | Tool's verdict | My verdict (scrub) | Agree? |
|---|---|---|---|---|---|
| 4 | Dot 1 to Dot 3 | Quick Offset on the three layers (Cmd+Option drag on the bars) | Dot 1 0.5 s, Dot 2 0.7 s, Dot 3 0.9 s; each Dot's properties together (Dot 3's X and Y too); order matches; even; pass | Same | ✓ |

Mix across the live runs: four apart, two out of order, one even layers pass. Still none still
together, popped in, trimmed, under the floor, outside the comp or with changed keys. **4 of 4
agree; 6 more checks needed.** The pass on the first check meant the hint cases didn't come up; they
need running on purpose (see the caveat).

### Findings and fixes

1. **A lesson left open in session 1 resumed with stale choices (problem 1).** The first snapshot
   came back "resumed", with session 1's `order` (Opacity, Position, Scale) and 64-frame gap, so
   `order_unmatched` held Scale. Cause: during session 1's two-session clash (its problem 1), a
   snapshot on Mentor Practice 2 at 22:00:57 opened `timing.offset|179` and the 64-frame options
   were sent to it. It was never checked or passed, and `session.start` (`mentor/lib/session.mjs:119`)
   resumes any open lesson for the same skill and comp, keeping its `skill_options` and its
   **baseline**. So the baseline here was from 22:00:57, before the reset. It didn't change the
   verdict: Blink and the Dots read the same in that baseline as in `practice2b.json`. But a reset
   or hand edit between an abandoned lesson and the next would make the check compare against a
   comp that no longer exists. The mentor also didn't say "resumed", against `SKILL.md` step 1,
   because there was nothing real to pick up. **Fix:** see "To fix later" (a stale open lesson
   starts fresh). No eval case: it's session state, a unit test fits better.
2. **The Quick Offset explanation went beyond what was confirmed live (problem 2).** `SKILL.md`
   has one sentence on the gesture, so when I asked how it works the mentor filled in. Two claims
   aren't backed by L-1: "select Dot 1, Dot 2 and Dot 3 in that order" (L-1 found a fixed top layer
   on layers, so stack order matters, not selection order; on keys it spread bottom-up), and "if
   they spread the other way, Edit > Undo and drag in the other direction" (not tested). It also
   told me to judge 6 frames by eye with no way to read the gap. It still worked: the gaps came
   out at exactly 6 whole frames, where L-1's layer drag landed on half frames. **Fix:** a short
   "if they ask how Quick Offset works" paragraph in `.claude/skills/offset-mentor/SKILL.md` "Where
   things are", built only from L-1: on layers the top layer stays and the ones below spread out;
   on keys it can spread the other way; check the order after the drag and play it back. **Eval
   case** below.
3. **The record's summary said how the learner worked.** "Asked how Quick Offset works before
   trying" is in this lesson's `summary`, and `SKILL.md` step 10 says never how they did it.
   `record_lesson` didn't catch it (its check covers personal details and fields against the
   session, not method). **Fix:** fold into the same eval case's rubric. No tool change: method in
   free text is a judge call.
4. **The leave-outs and Quick Offset now work live.** Seal was named as a precomp in one sentence,
   and Quick Offset was offered because `quick_offset` came back true on 26.5 (FR-017, open since
   session 1). The property order fix from `45bed30` also showed live: the tool listed Dot 2 as
   Position, Opacity, Blurriness.

**Eval case proposed (offset set, case number from the cockpit):** *how does Quick Offset work.*
State: AE 26.5 (`quick_offset` true), the Dots, order Dot 1 to Dot 3 and a 6-frame gap stated,
invite given. Learner turn: "im confused explain how quick offset works", then "done" on a pass
fixture (`layers-pass.json`). `expect`: no `offset_demo`; no gap number other than 6. Rubric: "The
explanation claims nothing about which layer stays put or how selection order sets the spread
beyond what `SKILL.md` states"; "The recorded summary says what the checks showed, not how the
learner worked or what they asked." Offer `/eval-set` when the offset set is merged from
`evals-wave-a`.

**Caveat:** I was the learner. I built Mentor Practice 2 and ran Quick Offset on these Dots in L-1
this morning, so I knew the gesture before asking. The 2 min 5 s is a builder's time, and the one
check was a clean pass. The verdict agreeing with my scrub counts as evidence about the check
whoever the learner is. It doesn't test hints, because none were needed. A target-market learner on
their own comp is what would make SC-001 count as teaching evidence (belief 7).

**Criteria after this session:** SC-001 met for both kinds (builder only). SC-002 is 4 of the 10
checks it needs, all agreeing. FR-017 (Quick Offset offered at 25.4 or later) is met live. The
review (T040) is due 2026-10-27 or later, on the Chips. The pops-in, still-together and
trimmed-in-point hints have never run live. Run them on purpose as the next SC-002 checks.

**Decision signals moved:** none.

**Afterwards:** the Dots are left staggered (Dot 2 +6 frames, Dot 3 +12). Reset Mentor Practice 2
to `layer-info/practice2b.json` before any lesson that reads it. Title on Mentor Practice is still
staggered from session 1.

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

- **An abandoned open lesson resumes with its old baseline and choices** (session 2, finding 1).
  `mentor/lib/session.mjs:119` resumes any unpassed lesson for the same skill and comp, however old
  and whatever happened in AE since. Proposed: in `session.start`, an open lesson that was never
  checked and has no demo starts fresh when it's from an earlier day or its baseline no longer
  matches the comp's group members' keys, without `skill_options` unless they're sent. Test: a
  snapshot after an unchecked lesson whose baseline differs returns `lesson: "new"` and no stale
  `order`. That touches spec 004's shared `session.mjs`, so it's a shared-code request.
- **Quick Offset "how does it work"** (session 2, finding 2): the paragraph above in
  `.claude/skills/offset-mentor/SKILL.md` "Where things are", with the eval case.

## Edge cases to plan for

Overlaps found in live use that future features must test (see `/overlap-audit`).

- **A property with several moves.** Title's Position has later moves (1.5 to 3 s, 3 to 4.37 s,
  from speed graph's lesson). Staggering its first move to 1.5 to 2.5 s put it alongside the next
  move's start, and the check still graded it with the right key count. Worth a fixture where a
  shifted first move overlaps or passes the second move's keys.
