# Expression and precomp reads: live checks (spec 015)

Spec 015 Phase 0 (T001 to T006), logged here by the cockpit (T007). The earlier read-only checks on
Comp 1 (speed, the precomp tree, the Sweep Control link) are in `ask-baseline.md` › "live checks for
the expression and precomp reads".

## Session 1: 2026-11-14, T001 to T004 (skill-builder, about 11.5 min by timestamps)

AE 27.0, the builder's own `Comp 1.aep` (saved, outside the repo). Plants went on a duplicate comp
("Comp 1 015 live") with probe nulls. The restore point is a byte copy of the saved `.aep` in the
session's scratchpad.
- **Before planting:** Comp 1 matched `mentor/test/fixtures/ask/comp1-snapshot.json` on a strict
  full-JSON compare (`--times 0.5,0.6,1.5,2.5,3.4`).
- **After the cockpit deleted the duplicate and its five nulls** (subagents can't run `.remove()`):
  it matched again, and the project was back to 34 items. AE keeps its unsaved flag; the file on disk
  is unchanged.

| Task | Question | Answer (AE 27.0) | Spec consequence |
|---|---|---|---|
| T001 (E4) | An expression that errors: is it still on, and what value does it give? | `expressionEnabled` stays **true**. `expressionError` starts "Expression disabled. Error at line 1…". The value falls back to the base value (base and result read the same, at two times, on a transform and a Slider). Nothing throws | "Running" means **on and no error**. The spec's assumption that AE switches it off is wrong for 27.0 |
| T002 (E18) | Do `random()` with no seed or `wiggle()` change between reads at one time? | No: the same value across two reads in two runs. **But wiggle changes when the layer's index changes** (moving the probe in the stack shifted it by about 6 px, and moving it back restored it); random didn't | A new K2 case: adding a layer (such as the null skill's null) renumbers the layers below it and moves their wiggles with no edit by the learner |
| T003 (E7) | After separating or joining dimensions, which expression is active? | Separating clears Position's expression, and joining clears X's and Y's. Neither comes back on the reverse. A script can't set an expression on the hidden property ("property … is hidden"). When separated, Position's value after the expression is the drawn value | E7's "expression left on the hidden property" can't be made by script. A UI separate or join isn't tested |
| T004 (R6) | What produced turn f's "Shake Control moved; Edit > Undo"? | **Not** the playhead (a replay with only time changed gives no change), rounding, a missing footprint, or the mentor's own guess. The check's reply has `anchor_changed` on Shake Control. A fitted anchor move of about (572, −114) px reproduces the saved reply (the rock's edges to within 0.001 px). Turn g shows it back, which fits an Undo. The fit is an **inference** from the saved reply, not a read of AE | Finding 4 is corrected in `ask-baseline.md`: the edit was real (Pan Behind on the null, the layer under the cursor), and the wording failed. SC-005, E17 and T022 are restated by the spec-writer (T008) |

### Findings

1. **Turn f was a real edit, said badly.** The check reported a side effect ("moved up at 2.6 s")
   instead of the cause ("Shake Control's pivot moved, not rock.png's"). Fix: report the changed
   property on the layer that changed, in the learner's terms. This fits K2's other half: an
   expression's motion must never be reported, and a real edit to a layer with an expression must be.
2. **Pan Behind on the parent instead of the art is an easy slip.** *Corrected by session 2:* the
   tool took Shake Control because it was **selected**, not because it was under the cursor. Either
   way, a learner working on a parented layer moves the parent's pivot without meaning to. Worth a
   teaching line where the pivot skill meets a parent null.
3. **An erroring expression looks "on".** Any rule that reads only the switch would call a broken
   expression a working one, which is wrong in the very case the ask mode cares about most ("what
   broke").
4. **Renumbering moves wiggles.** The 10-29 overlap audit found that renumbering breaks checks;
   this is the same cause showing up in values.

## Session 2: 2026-11-14, T005 and the scripts as written (cockpit with the builder)

The cockpit ran it from the main session, not a skill-builder, because each step waits on the
builder's hands. Same project. Duplicates "Comp 1 T005" (T005) and "Comp 1 015 live" (scripts) were
deleted afterwards with their probe nulls. Comp 1 matched `comp1-snapshot.json` on a strict
full-JSON compare, and the project was back to 34 items.

### T005: Pan Behind on the expression-driven null (SB-2, turn f)

The builder selected Shake Control, as in turn f, and used Pan Behind toward the rock's top-right,
where the hammer hits. Read with `mentor/dev/live-015/pan-behind-read.jsx` at 0.6 s, before and
after:

| | Before | After | Change |
|---|---|---|---|
| Shake Control Anchor Point | 0, 0 | 561.0, −120.1 | +561.0, −120.1 |
| Shake Control base Position (before the expression) | 960, 540 | 1521.0, 420.0 | +561.0, −120.0 |
| Shake Control Position (after the expression) | 952.35, 542.49 | 1513.35, 422.49 | the same shift; the shake is unchanged |
| rock.png's top-right corner in the comp | 1815.01, 251.32 | 1815.03, 251.39 | 0.07 px: the child stayed still |
| Selected layer | none | Shake Control | |

- **SB-2 confirmed by hand.** Pan Behind changes the base Position and the Anchor Point together.
  The expression builds on `value`, so the shake carries on from the new base. The children stay
  still, and the turning point is now the hit point.
- **Turn f's action confirmed.** The hand move gives (561, −120), against T004's fitted (572, −114),
  which is the same edit within a few pixels. Turn f's "Shake Control moved" was this edit.
- **Correction:** Pan Behind took Shake Control because it was **selected**, not because it was the
  layer under the cursor (finding 2 above is corrected).

### The three scripts, run once as written

- `error-expression.jsx` reproduces T001 exactly (on, an error starting "Expression disabled.", the
  base value at two times, on Position and on a Slider).
- `random-expression.jsx` (two plain runs, then one with `ARGS = { renumber: true }`, prepended)
  reproduces T002 to the last digit. Moving the random probe to the top shifted the wiggle from
  (601.17, 288.81) to (606.85, 295.47), and moving it back restored it. The random value never changed.
- `separate-dims.jsx` reproduces T003. **New:** the hidden half keeps stale values that don't render.
  When Position is joined, X and Y Position read 960, 540; when it's separated, Position reads the last
  joined value. A read that walks every property must skip the hidden half (Position when separated,
  X/Y/Z when joined), or it reports values that never show.

### Still open

- T006 (time mapping on Icon plus planted copies, a scrub check by hand).
