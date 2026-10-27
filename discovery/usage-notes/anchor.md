# Anchor: usage notes

Live runs of `/anchor-mentor` (spec 011) in `discovery/Claude AE Tutor Test.aep`. Each session logs
results against the success criteria in `specs/011-anchor/spec.md`. Timings come from `calls.jsonl`
(times are UTC). The live checks and captures before the first lesson are in
`specs/011-anchor/live-sitting-2026-10-26.md`. The build hand-back (T239) goes in `anchor-build.md`.

## Session 1: 2026-10-26 (T236, User Story 1, Door on Mentor Practice 2)

One first lesson, in a plain Claude Code session on `skill-5-anchor` (the cockpit, not a subagent),
on the real learner record. Easing, speed graph, key types and offset were learned, and there was no
anchor history. The server was started for this session, after T241 to T244, so it ran the
current branch code.

### Steps (quickstart § 5.1)

| Step | What happened | Matches the expected result? |
|---|---|---|
| 0. Remember | No anchor record, so a first lesson. Mentioned the earlier easing, key types and offset work; didn't hold the lesson for keys | Yes |
| 1. Ask, then propose | Asked which layer and where before naming a place. Offered Door from its left edge (FR-004 as amended; T241's ranking). Left out Wobble (Anchor Point keyed) and Seal (Collapse Transformations), one sentence each; nothing said about Hatch Rig (null) | Yes |
| 1. Reads | The first snapshot was two reads, as expected on this comp (FR-013), but took 9.95 s | Yes, but **problem 1** |
| 2. Focus | I said "Door from its left edge". Said back in plain words as the middle of its left edge, with the pivot at its center now. The two sentences once. One frame at 0 s, without claiming the pivot shows in it. No rest key (Door has no keys) | Yes |
| 3. Show where | Y for Pan Behind, select Door, start the drag on its crosshair; A, then Shift+P | Yes |
| 5. Demo | One focus layer, so none, with the one sentence on why. No offer to watch one on Tab first. I'd have taken it | **No: problem 2** |
| 7. Check 1 | Pivot outside Door, to its left; Door didn't move; nothing else changed. The hint said outside, to its left, and to select Door to see its crosshair, with no distance. It also praised Door staying still | Yes |
| 7. Check 2 | Pivot on the middle of the left edge, Door didn't move, nothing else changed. Pass | Yes |
| 8. Understanding | "Which part of Door will stay still?" I said the left edge. Agreed in a few words | Yes |
| 9. Try it | Invited a Rotation drag, then Edit > Undo; not checked. The swing hinged from the left edge | Yes |
| 11. Record | Passed, no demo, the outside first try and the answer noted, next is a keyed swing on Door or Needle's bottom edge. No method or motive | Yes |
| Wording | No field names, no numbers or tolerances, no announced calls, no Quick Set Anchor | Yes |

### SC-001: speed and demos (unkeyed layer)

| Measure | Value | Target | Pass? |
|---|---|---|---|
| `read_learner_record` (01:03:55.7) to `record_lesson` (01:06:51.5), wall clock | **2 min 56 s** | ≤ 10 min | ✓ |
| Demonstrations | 0 | ≤ 1 | ✓ |
| Checks to a pass | 2 | none | |
| `anchor_snapshot`, no options (two reads) | **9,953 ms** | ≤ 10 s a turn (spec 003 SC-004, logged as a finding) | **✗ for the turn: problem 1** |
| `anchor_snapshot` with the focus | **10,693 ms** | same | **✗ problem 1** |
| `anchor_check` | 663 ms, 722 ms | none | |
| `preview_frame` | 524 ms | none | |

The first turn (record, then snapshot) was about 15 s of tool time, and the focus turn about 13 s
(snapshot, then frame).

### SC-002: the check vs. a look in After Effects (9 of 10 needed across the live runs, one L-4 mistake among them)

| # | What was checked | What I did | Tool's verdict | My verdict (crosshair and Door's place) | Agree? |
|---|---|---|---|---|---|
| 1 | Door, middle of the left edge | Pan Behind, dragged past the left edge | Pivot outside Door, to its left; Door didn't move; nothing else moved | Same | ✓ |
| 2 | Door, middle of the left edge | Pan Behind, brought it back to the edge | Pivot at the middle of the left edge; Door didn't move; pass | Same | ✓ |

Mix: one outside, one pass. No L-4 mistake yet (the layer dragged, the pivot moved with the layer,
the wrong layer, set away from rest). **2 of 2 agree.** T237 needs at least one L-4 mistake on
purpose, and the rest of the 10 should cover the other L-4 kinds.

### Findings and fixes

- **Problem 1: each `anchor_snapshot` took about 10 s on Mentor Practice 2.** The spec expected the
  second read to add "about a second" (spec › FR-013's note, plan › Risks). Both calls were close to
  10 s (9.95 s and 10.69 s), so the second read is far slower than planned, or both reads are.
  `anchor_check`, at one read, took 0.7 s, so it's not AE being slow in general. Cause not known
  yet: likely the 30 times the second read samples on 40 layers (answer key
  `needed_practice2b`). Over spec 003 SC-004's 10 s turn bar, so it's a finding, not a fail. SC-001
  isn't at risk at 2 min 56 s. **Fix:** see "To fix later". No eval case: the eval fixtures don't
  time AE.
- **Problem 2: with one focus layer, the mentor never offered to show one on Tab first, and I'd have
  taken it.** `SKILL.md:185` says "Offer a second layer only if they'd like to watch one first",
  which reads as "wait until they ask". The teaching design says the mentor *can* offer one (TD
  › Focus size and the demo target). So the lesson went straight to "try it", and a first-timer who
  wants to watch first has to know to ask. Being the builder, I knew; a learner wouldn't. **Fix:**
  see "To fix later" (a `SKILL.md` change, the skill builder's file, and a question for the
  curriculum designer). **Eval case proposed:** "one layer, first lesson: offers a watch on another
  layer in one sentence".
- **Not seen this time: the frame didn't get in the way.** The 0 s frame shows about 30 overlapping
  shapes, as key types' problem 1 found, and the mentor didn't point at a shape it couldn't name. I
  knew where Door was, so it didn't bite. A learner may not.

**Caveat:** I was the learner, I built the skill, and I know where Door is, so this is builder-only
evidence on one unkeyed layer. It counts for SC-001's first half and two of SC-002's ten checks,
not for belief 7. A target-market learner on a busy comp of their own would test the frame and the
demo offer properly.

### Criteria after session 1

- **SC-001:** half met (the unkeyed lesson, 2 min 56 s, no demo). The keyed lesson (T237) is open.
- **SC-002:** 2 of 2 agree so far, 10 needed, and no L-4 mistake yet. Open.
- **SC-003 to SC-008:** not touched by a live run.
- **SC-009 (stretch):** open, a day or more after T237.
- No decision's "what would change our mind" signal moved.

## To fix later

- **`anchor_snapshot` takes about 10 s on Mentor Practice 2 (problem 1).** Both calls in session 1
  were 9.9 s and 10.7 s, against "about a second" for the second read. **Proposed fix:** time the
  two reads on their own (in `mentor/lib/anchor.mjs`'s snapshot path), then cut the second read to
  only the times it needs (only keyed candidates' Rotation and Scale keys, not every layer's), or
  read the layers' rects once and sample only transform values per time. **Test:** a unit test that
  the second read's time list on `practice2b.json` holds only what the check needs, and a live
  timing on Mentor Practice 2 under 3 s. A spec 011 desk task, before T237 if it's cheap, since
  T237's keyed layer will hit the same two reads.
- **The one-layer demo offer is easy to skip (problem 2).** `SKILL.md:185` to 186. **Proposed
  fix:** "With one focus layer, offer a watch on another layer once, in one sentence, after the
  walk-through: name the `proposal`'s next default candidate ('I could show you on Tab first, if you
  like'). Don't offer it again." Ask the curriculum designer first whether the TD's "can offer"
  should be "offers", since it changes stage 5 for every one-layer lesson. **Test:** the eval case
  above (expect: one offer naming a default candidate; no `anchor_demo` call before the learner
  agrees; rubric: the offer is one sentence and comes before "try it").

## Edge cases to plan for

None new from session 1.
