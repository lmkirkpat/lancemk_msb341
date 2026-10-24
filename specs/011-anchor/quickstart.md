# Quickstart: validating skill 5, set the pivot (spec 011)

**Status**: Draft, awaiting the builder's approval (2026-10-24). § 1 runs in the cloud; § 2 to § 5
are **one sitting** at the builder's Mac (🖐), after spec 004's T133 to T136 have passed; § 6 is a
day or more later. Spec 004's [quickstart.md](../004-ae-curriculum/quickstart.md) covers the shared
branch.

## 1. Cloud: everything that doesn't need After Effects

```bash
cd mentor && npm test                                                # green on stand-ins and synthetics
node ../.claude/hooks/check-branch.mjs <branch> skill-builder main   # no --shared-owner: clean
```

Run `/agent-audit` on `.claude/skills/anchor-mentor/SKILL.md`. Hand back.

## 2. 🖐 Live checks L-1 to L-5

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

## 3. 🖐 Captures

Saved as `mentor/test/fixtures/anchor/<name>.json` with `--times` set to the answer key's list
for that file; names match `answer-key.json`.

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

## 5. 🖐 First live lessons (SC-001, SC-002)

The builder, in a plain Claude Code session in the repo, easing learned, on Mentor Practice 2:

1. `/anchor-mentor`, no layer in mind: Door proposed with its left edge, then the lesson.
2. `/anchor-mentor` again: Gauge (or Pop), the rest key named, the playhead asked for, the lesson.

Each to a verified pass in ≤ 10 minutes with ≤ 1 demo (times from `calls.jsonl`); per check, whether
it matched the crosshair and the layer's place on screen (SC-002: 9 of 10, one L-4 mistake among
them).

## 6. 🖐 Live review, a day or more later (SC-009, stretch)

With § 5's record: the review names Tab or Peg, asks where it turns from, names no tool; checked and
recorded as a review.
