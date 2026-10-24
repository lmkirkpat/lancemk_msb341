# Quickstart: validating skill 6, move a group with a null (spec 012)

**Status**: Draft, awaiting the builder's approval (2026-10-24). § 1 runs in the cloud; § 2 to § 5
are **one sitting** at the builder's Mac (🖐), after spec 004's T133 to T136 and T158, and not
during spec 011's sitting; § 6 is a day or more later.

## 1. Cloud: everything that doesn't need After Effects

```bash
cd mentor && npm test                                                # green on stand-ins and synthetics
node ../.claude/hooks/check-branch.mjs <branch> skill-builder main   # no --shared-owner: clean
```

Run `/agent-audit` on `.claude/skills/null-parenting-mentor/SKILL.md`. Hand back.

## 2. 🖐 Live checks L-1 to L-6

Setup: After Effects 26.5 on `discovery/Claude AE Tutor Test.aep` with Mentor Practice 2's 2b
layers (spec 004 T135); the cockpit off AE; one skill-builder in this branch's local worktree holds
the AE lock. Work on a **duplicate** of Mentor Practice 2. The builder does the hand actions; the
agent reads with `node mentor/dev/capture.mjs --times <list>` and logs.

| Check | Do | Log |
|---|---|---|
| L-1 | Layer > New > Null Object; read. Parent Tile with Option, then with Shift held; read after each, undo each. Look at the Parent & Link column and the two pick-whip columns | The null's size, anchor and how it draws; whether Option or Shift moves the child; the column and pick-whip labels at 26.5 |
| L-2 | A null at Scale 150, Rotation 30; parent Tile with the Parent column's pick whip; capture `parented-rot.json` | Whether Tile's Position, Scale and Rotation key values were rewritten |
| L-3 | `null_parent_demo` on Tile (temp `AE_MENTOR_HOME`, lesson set up first); read; one Edit > Undo. Then parent Caption by dragging the pick whip from Position, keyed and unkeyed, capture `pickwhip-position.json`; a jump, capture `jumped.json` | `moved_px` 0; one undo reverts it; what the snapshot sees for each pick whip |
| L-4 | Spec 004 T158's answer on Orbit | Whether auto-oriented layers can join the focus |
| L-5 | Capture before and after Layer > New > Null Object (`renumbered-before.json`, `renumbered-after.json`) | Every focus layer found by name after the renumbering |
| L-6 | `null_parent_snapshot` with no focus on 2b (needs SR-4's `comp.width`) | The proposal is Tile, Caption and Stamp, not linked to the matte pair, Plate or the Rows |

## 3. 🖐 Captures

Saved as `mentor/test/fixtures/null-parenting/<name>.json` with `--times` set to the answer key's
list; names match `answer-key.json`.

| File | Shape (row, eval) |
|---|---|
| `parented-rot.json`, `jumped.json`, `pickwhip-position.json` | L-2, L-3 (FR-027, eval 5, 6, 7) |
| `null-top-left.json`, `null-center.json` | The null placed at the group's top-left and middle (US1 #3, N3) |
| `visible-parent.json` | Caption parented to Tile (eval 10) |
| `null-keyed-early.json` | The null keyed before the parenting check (eval 8, row 30) |
| `null-moved-before-parenting.json` | The null dragged after a check, before parenting (row 31) |
| `fade-null.json`, `rotate-null.json`, `anchor-only-null.json` | P4 cases (eval 9, row 26) |
| `two-nulls-same-name.json` | Two layers called "Null 1" (row 40) |
| `demo-done.json`, `demo-undone.json` | The demo and its undo (FR-018, row 39) |
| `renumbered-before.json`, `renumbered-after.json` | L-5 (row 33) |
| `review-rows-visible.json` | Row B and Row C parented to Row A (US3 #2, eval 17) |

Then delete the duplicates, confirm Mentor Practice 2 matches `practice2b.json`, check no capture
holds a user or folder name, save, release the lock.

## 4. Desk block (lock released, not 🖐)

Point the tests at the captures, delete `stand-in/`, fill the `<!-- L-1 -->` places in `SKILL.md`
from L-1, allow auto-oriented candidates if L-4 says so, fix the snippet for anything L-3 showed.
`npm test` green. A result that changes a requirement goes to the spec writer before § 5.

## 5. 🖐 First live lesson (SC-001, SC-002)

The builder, in a plain Claude Code session, skill 5 learned, on Mentor Practice 2:
`/null-parenting-mentor`, no group in mind: Tile, Caption and Stamp proposed, CTRL explained on
Mentor Practice if open (or one frame of the group), the null added and placed, a demo on Tile if
asked, the rest parented, one deliberate jump on one of them (checked, then undone and redone), the
null's move. ≤ 15 minutes, ≤ 1 demo (times from `calls.jsonl`); per check, whether it matched a
scrub of each focus layer at its key times (SC-002: 9 of 10, and every deliberate jump).

## 6. 🖐 Live review, a day or more later (SC-009, stretch)

With § 5's record: the review names Row A, Row B and Row C, never says "null", asks whether the
group turns or scales; checked and recorded as a review.
