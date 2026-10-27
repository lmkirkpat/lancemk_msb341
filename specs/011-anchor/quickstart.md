# Quickstart: validating skill 5, set the pivot (spec 011)

**Status**: Draft, awaiting the builder's approval (2026-10-24). § 1 runs in the cloud; § 2 to § 5
are **one sitting** at the builder's Mac (🖐), after spec 004's T133 to T136 have passed; § 6 is a
day or more later. Spec 004's [quickstart.md](../004-ae-curriculum/quickstart.md) covers the shared
branch. **2026-10-26:** § 2 to § 4 are done (`live-sitting-2026-10-26.md`, T232 to T235); the spec
was amended from them, and § 4b (T241 to T244) comes before § 5.

## 1. Cloud: everything that doesn't need After Effects

```bash
cd mentor && npm test                                                # green on stand-ins and synthetics
node ../.claude/hooks/check-branch.mjs <branch> skill-builder main   # no --shared-owner: clean
```

Run `/agent-audit` on `.claude/skills/anchor-mentor/SKILL.md`. Hand back.

## 2. 🖐 Live checks L-1 to L-5 (and L-6 and L-8 at the next sitting)

Setup: After Effects 26.5 on `discovery/Claude AE Tutor Test.aep` with Mentor Practice 2's 2b
layers (spec 004 T135); the cockpit off AE; one skill-builder in this branch's local worktree holds
the AE lock (not during spec 012's sitting). Work on a **duplicate** of Mentor Practice 2. The
builder does the hand actions; the agent reads with `node mentor/dev/capture.mjs` and logs.

| Check | Do | Log |
|---|---|---|
| L-1 | Select Lid (the layer, not a group), Pan Behind, drag; read. Compare `rect` and `rect_extents` with the shape as drawn, stroke included | Whether the Transform anchor moved; which rectangle matches (1 px) |
| L-2 | Sled (three Position keys): Pan Behind with the playhead on a key, then off a key; read after each. Then a one-key layer, playhead off its key | Whether existing keys were rewritten or only the current value; whether a second key was added |
| L-3 | Pan Behind clicked on another layer; a selected eye-off matte (Reveal Matte); Layer > Transform > Center Anchor Point in Layer Content; a new shape layer's pivot | Each answer, as seen at 26.5 |
| L-4 | The four mistakes, each captured then undone: Door with a typed Anchor Point; Door dragged with the Selection tool; Pan Behind on Background with Needle meant; Pop's pivot set at Scale 0. Then `anchor_demo` (temp `AE_MENTOR_HOME`) on a separated, a rotated and a parented layer, and on a locked one | Footprint within 1 px after each demo; one Edit > Undo reverts it; the locked one refused with no change |
| L-5 | Sign, centred, then left-justified: `rect` at the check time vs the letters on screen | Left, top, width, height within 1 px |
| L-6 (added 2026-10-26, round 2; **the next sitting**, with § 5.2, not before § 5.1) | On a duplicate, give Lid a stroke (any width, say 10 px) and read it as `lid-stroke.json`; delete the duplicate after | Whether `rect` includes the stroke: its edges against the shape's outer edge on screen (1 px). If not, to the spec writer |
| L-8 (added 2026-10-26, round 7, T261; **the next sitting**, with L-6) | On a duplicate: (a) a layer with an auto-center expression on its unkeyed Anchor Point, (b) a layer with an expression on its unkeyed Position that ignores `value`. Read, Pan Behind as the lesson teaches it, read again; delete the duplicate after | For each: does the layer move on screen, and which hint the check returns (spec › Live checks › L-8). To the spec writer and the designer; no `SKILL.md` line until then |

## 3. 🖐 Captures

Saved as `mentor/test/fixtures/anchor/<name>.json` with `--times` set to the answer key's list
for that file; names match `answer-key.json`. (Taken 2026-10-26 with the 7-time list. The live comp
needs 30 times for a lesson's baseline, answer key `needed_practice2b`, so a live lesson start
takes a second read; the captures hold the 7 plus each layer's own key times, enough for the
tests.)

| File | Shape (row, eval) |
|---|---|
| `door-typed.json`, `door-dragged.json`, `wrong-layer.json`, `pop-shrunk.json` | L-4's four mistakes (eval 3, 6, 7) |
| `door-pass.json`, `plaque-pass.json`, `banner-neighbour.json` | Pan Behind correct on Door and Plaque; Banner one place off (eval 4, 5) |
| `sled-slid.json`, `sled-one-key.json` | L-2 (row 5, eval 13) |
| `lid-pan.json`, `lid-group.json` | L-1, the layer's anchor and a group's (rows 22, 23) |
| `hatch-rig-focus.json` | Hatch Rig as focus (row 16) |
| `sign-centred.json`, `sign-left.json` | L-5 (row 21) |
| `demo-separated.json`, `demo-rotated.json`, `demo-parented.json`, `demo-undone.json` | L-4's demo runs (FR-029) |
| `matte-eye-on.json` | Reveal Matte's eye left on (row 12, eval 9) |

Then delete the duplicates, confirm Mentor Practice 2 matches `practice2b.json`, check no capture
holds a user or folder name, save, release the lock.

## 4. Desk block (lock released, not 🖐)

Point the tests at the captures, delete `stand-in/`, set `SHAPES_DEFAULT` and `RECT_KIND` from L-1
and L-5, fill the `<!-- L-2 -->` and `<!-- L-3 -->` places in `SKILL.md`, fix the snippet for
anything L-4 showed. `npm test` green. A result that changes a requirement goes to the spec writer
before § 5.

## 4b. Amendment tasks (not 🖐, 2026-10-26)

T241 (the ranking; Door proposed), T242 (the side of a pivot outside), T243 (the group and
content hints), T244 (`SKILL.md`). `npm test` green and `check-branch.mjs` clean. T241 must land
before § 5.1; the rest before § 5.2.

**Round 2 (2026-10-26, Phase 8c):** T245 (two or more Position key times left out, the one-key
rule), T246 (answer key and tests), T247 (`SKILL.md` from TD § 16, then `/agent-audit`). Before
§ 5.2 and the evals, not before § 5.1. T248 is L-6, at the § 5.2 sitting.

**Round 5 (2026-10-26, Phase 8f):** T257 (the opening turn, TD § 19) and T258 (time labels for the
two-frames sentence). Both before the next live lesson that opens with no layer in mind, and before
the evals' re-run (HO-1).

## 5. 🖐 First live lessons (SC-001, SC-002)

The builder, in a plain Claude Code session in the repo, easing learned, on Mentor Practice 2:

1. `/anchor-mentor`, no layer in mind: Door proposed with its left edge (FR-004 as amended
   2026-10-26; without T241 it's Blink), then the lesson. Note `anchor_snapshot`'s own time in
   `calls.jsonl`: on this comp it takes two reads (FR-013). **The opening (round 5, after T257;
   spec FR-006a, TD § 19):** one turn that asks which layer and where it should turn from, offers
   Door from its left edge in one sentence, and ends on that choice. No list of what's left out,
   no "idea for today", and no recap of other skills on a first lesson of this one. If you name a
   layer that already moves (Sled, say), its "set the pivot before you key" sentence comes then,
   on that turn, and another layer is offered. Watch for "what do you mean by turn from?" (TD
   § 19's guess that the question carries the topic) and note it if it happens.
2. `/anchor-mentor` again: Gauge (or Pop), the rest key named, the playhead asked for, the lesson.

Each to a verified pass in ≤ 10 minutes with ≤ 1 demo (times from `calls.jsonl`); per check, whether
it matched the crosshair and the layer's place on screen (SC-002: 9 of 10, one L-4 mistake among
them).

## 6. 🖐 Live review, a day or more later (SC-009, stretch)

With § 5's record: the review names **Needle** (the first layer with no keys that isn't in the
record, after Door and Gauge or Pop; Tab if Needle was in a lesson too), asks where it turns from,
names no tool; checked and
recorded as a review.
