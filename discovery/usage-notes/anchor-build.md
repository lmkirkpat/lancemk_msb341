# Set the pivot: build hand-back (spec 011, T239)

Written by the cockpit on 2026-10-26 (local) from T238's checks, re-run on the final branch before
the merge. The live lessons are in `anchor.md`. The sitting is in
`specs/011-anchor/live-sitting-2026-10-26.md`.

## Branch

`skill-5-anchor` at `28ab518`, with `main` merged in at `f113fc0` plus round 7 (so it carries
skill 6 and the git guard amendment). Built in eight passes on 2026-10-26: Phases 8b to 8h
(T241 to T260), each from an approved teaching design section (§ 16 to § 19b) and spec round
(1 to 7).

## T229's checks, re-run (T238)

| Check | Result |
|---|---|
| `cd mentor && npm test` | **1148 pass, 0 fail**, 3 todo (1151 tests; includes skill 6's, from `main`) |
| `node --test .claude/hooks/test/*.test.mjs` | **39 pass, 0 fail** |
| `check-branch.mjs skill-5-anchor skill-builder main` | Against `main`, **73 files added** and only `specs/011-anchor/tasks.md` modified. Every `mentor/` and `.claude/` file is an add. The 2 files outside skill-builder's are the cockpit's sitting log and `discovery/usage-notes/anchor.md`. **No shared file is touched (SC-008)** |

Fixtures are the 34 live captures from T233 (comp 179), plus synthetic clones of them, each marked.
The stand-ins were deleted at T234.

## L-1 to L-5

From the sitting:
- **L-1:** Pan Behind on a shape moves the layer's anchor and position together, so nothing moves
  on screen. On a shape's group it moves the group's own anchor and position, which the snapshot
  can't see.
- **L-2:** with Position keyed, Pan Behind changes or adds one key at the playhead, so the layer
  slides at its other keys. That's why layers with Position keys at two or more times are left out
  (`position_moves`).
- **L-3:** Pan Behind acts on the layer under the cursor, not the selected one. An eye-off matte
  shows no crosshair. Center Anchor Point in Layer Content exists at 26.5. A new shape's pivot
  starts at the comp centre.
- **L-4:** the four mistakes and six demo runs; the demo takes one undo and refuses a locked layer.
  Pop's pivot set at Scale 0 lands at [120, 960], far outside.
- **L-5:** a text layer's rectangle matches its letters within 1 px.

No snippet fix was needed. L-6 (a stroke) and L-8 (an unkeyed expression on Anchor Point or
Position) are for the next sitting (T248, T261).

## Success criteria

| SC | Status |
|---|---|
| SC-001 | **Met**: T236 Door (unkeyed) 2 min 56 s and T237 Pop (keyed) 3 min 54 s, no demo in either. Builder-only. Both ran on the opening before § 19 (one question, no leave-out list); the new opening has eval cases but no live lesson yet |
| SC-002 | **4 of 4** checks agree with a look in AE, with the L-4 mistake included. 6 more are needed for 10; they ride along with T240 and the next lessons |
| SC-003 | Open: the baseline comes after the merge (about $15 to $20). Four smoke runs on `evals-skill-5` (`product/evals/anchor/README.md`), about $18 in all. The last, after B-13, passed 01, 13, 24b, 26 and 35 with nothing written before the first snapshot; review case 16 still wrote a self-note there, fixed by one line in The review's step 1 (`SKILL.md`) and not yet re-run |
| SC-004, SC-005 | Covered by deterministic checks in every eval case; graded at the baseline |
| SC-006 | Met: every overlap row in `anchor-overlap.test.mjs` passes; HO-2 re-checked them against the built branch |
| SC-007 | **Met** (HO-4, 2026-10-27): T183's base run (`product/evals/easing/results/2026-10-26-233056-phase9-base.json`) ran on `main` after both skill 5 (`f6effae`) and skill 6 (`31fe72d`) merged: **25/26**, $13.05, no hard-rule failure. The one miss was case 09's R-FOCUS rubric item (the opening named more than 5 pairs), which also went 2 of 3 in T195, so it looks flaky. One shared run covers specs 011 and 012 |
| SC-008 | Met (above) |
| SC-009 | Open, stretch: T240, a day or more after T237 |
| SC-010 | Deferred with T252 and T253: the 10 s lesson start was AE throttled in the background (T251), not the reads |

## Reviews

- **HO-2 (curriculum designer):** passed. Every overlap in TD § 9 has a named test. Its gaps went
  into TD § 19b: a background is never proposed, nothing is said about a Transform effect this
  release, the turned-far sentence is for flipped layers only, and L-8 at the next sitting.
- **HO-3 (reviewer):** ready to merge. Its five "later" findings: three are fixed in B-13 (no
  proposal opens with the solid line, a demo on a layer the learner names asks for the place, the
  practicing note isn't said aloud), one stays under H-6 (other times the mentor writes itself),
  and one is the curriculum question C-6 (`next` is written as an action, read as what was off).

## For the spec

- **H-6:** label the other times the mentor says (the one-key tip, the rest key, two hints) if an
  eval or live lesson shows one drifting.
- **C-6:** where the practicing memory clause comes from, for every skill (curriculum § 2).
- **The opening is untested live.** § 19 to § 19b changed the first turn after T236 and T237. The
  first live lesson after the merge should watch for "what do you mean by turn from?".

## Requests

- **SR-2:** landed (spec 004 T164 and T165); the snapshot carries the comp size.
- **SR-3:** still open. `mentor/test/skill-module.test.mjs:86` asserts easing is the first skill,
  so the tool file stays `transform-anchor.mjs` rather than the contract's `anchor.mjs`. Not a
  blocker.
