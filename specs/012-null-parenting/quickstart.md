# Quickstart: validating skill 6, move a group with a null (spec 012)

**Status**: Draft, awaiting the builder's approval (2026-10-24). § 2 and § 3 ran 2026-10-26
(T336, T337) and § 4 the same day (T338, T339); § 5 is next. § 1 runs in the cloud; § 2 to § 5
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
| L-6 | `null_parent_snapshot` with no focus on Mentor Practice 2 as built, wave A's layers included (needs SR-4's `comp.width`; amended 2026-10-25, spec › L-6) | `proposal` Tile, Caption and Stamp; `next_proposal` Chip A to C; wave A's 13 close layers a crowd, not listed. If not, it goes to the designer as a rule question; no layer is moved |

## 3. 🖐 Captures

Saved as `mentor/test/fixtures/null-parenting/<name>.json` with `--times` set to the answer key's
list; names match `answer-key.json`.

**How the sitting made them (amended 2026-10-26 from the live sitting,
[live-sitting-2026-10-26.md](live-sitting-2026-10-26.md) › Captures):** only L-1 to L-3 need the
builder's hands. Every other capture is **planted by script**:

- a **fresh duplicate of Mentor Practice 2 for each** capture, deleted after it;
- the plant follows the old stand-in recipe exactly (names, places, key times and values), with
  AE's own parenting (`layer.parent = null`, which keeps the child in place like the Parent pick
  whip), not arithmetic;
- read with the mentor's own `snapshot.jsx` at the listed times (the group's times, or the row's,
  as in the fixtures README);
- planted keys are **AE's default linear** unless the plant eases them (the stand-in recipe's
  eased null keys weren't carried over, so a test that needs an eased null eases the keys itself,
  `6039c78`);
- the lesson's null is **renamed "Null 1"** so the hand-written answer key holds (AE's own name is
  "Null N", N counting the project's other nulls);
- every file gets a top-level **`captured_from`**: the duplicate's id and name, the plant, and
  "hand" or "script";
- **`comp.id` and `comp.name` normalized to 179** and "Mentor Practice 2".

| File | Shape (row, eval) |
|---|---|
| `parented-rot.json`, `jumped.json`, `pickwhip-position.json` | L-2, L-3 (FR-027, eval 5, 6, 7). At the sitting `jumped.json` and `pickwhip-position.json` (Tile and Stamp parented, Caption by expression) were planted; the hand captures are the extras below |
| `null-top-left.json`, `null-center.json` | The null placed at the group's top-left and middle (US1 #3, N3) |
| `visible-parent.json` | Caption parented to Tile (eval 10) |
| `null-keyed-early.json` | The null keyed before the parenting check (eval 8, row 30) |
| `null-moved-before-parenting.json` | The null dragged after a check, before parenting (row 31) |
| `fade-null.json`, `rotate-null.json`, `anchor-only-null.json` | P4 cases (eval 9, row 26) |
| `two-nulls-same-name.json` | Two layers called "Null 1" (row 40) |
| `demo-done.json`, `demo-undone.json` | The demo and its undo (FR-018, row 39) |
| `renumbered-before.json`, `renumbered-after.json` | L-5 (row 33) |
| `review-rows-visible.json` | Row B and Row C parented to Row A (US3 #2a, eval 17) |
| **Extras (added 2026-10-26 from the live sitting)** | |
| `parented-center.json` | The group parented to the lesson's Null 1 at the group's middle; lesson chains from `null-center.json` read it, since spec 004's `practice2b-parented.json` has Null 11 at the comp's center |
| `pickwhip-position-hand.json` | By hand (L-3): Caption's Position pick-whipped to the null, unkeyed, nothing else parented |
| `pickwhip-position-keyed-hand.json` | By hand (L-3): Tile's keyed Position pick-whipped to the null |
| Planted replacements for every former stand-in | `slide-null.json`, `one-key-null.json`, `null-moved.json`, `practice2b-null1.json`, `two-nulls-renamed.json`, `null-renamed.json`, `plate-parented-too.json`, `playhead-moved.json`, `practice2b-with-wave-a-parented.json`, `review-rows-null.json`, `review-rows-pass.json`, `review-rows-parented-in-one-go.json` |
| Not captured | `practice2b.json` and `practice2b-with-wave-a.json`: spec 004's live `layer-info/practice2b.json` is the comp as built, wave A included |

Then delete the duplicates, confirm Mentor Practice 2 matches `practice2b.json`, check no capture
holds a user or folder name, save, release the lock.

## 4. Desk block (lock released, not 🖐)

Point the tests at the captures, delete `stand-in/`, fill the `<!-- L-1 -->` places in `SKILL.md`
from L-1, allow auto-oriented candidates if L-4 says so, fix the snippet for anything L-3 showed.
`npm test` green. A result that changes a requirement goes to the spec writer before § 5.

## 5. 🖐 First live lesson (SC-001, SC-002)

The builder, in a plain Claude Code session, skill 5 learned, on Mentor Practice 2:
`/null-parenting-mentor`, no group in mind: Tile, Caption and Stamp proposed with the reason (log
whether you took it, the second group or your own, L6-3), CTRL explained on
Mentor Practice if open (or one frame of the group), the null added and placed, a demo on Tile if
asked, the rest parented, one deliberate jump on one of them (checked, then undone and redone), the
null's move. ≤ 15 minutes, ≤ 1 demo (times from `calls.jsonl`); per check, whether it matched a
scrub of each focus layer at its key times (SC-002: 9 of 10, and every deliberate jump).

## 6. 🖐 Live review, a day or more later (SC-009, stretch)

With § 5's record: the review names Chip A, Chip B and Chip C (L6-1; spec 004's live
`practice2b.json` is the comp as built, so Chip A to C there too; amended 2026-10-26 from the live
sitting), never says "null", asks whether the
group turns or scales; checked and recorded as a review.
