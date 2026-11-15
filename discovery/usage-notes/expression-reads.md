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
2. **Pan Behind on a null over the art is an easy slip.** The null sits at the comp center on top of
   the rock, so the tool takes the null. That's the anchor live finding from 10-26 ("it acts on the
   layer under the cursor") in a real comp. Worth a teaching line where the pivot skill meets a parent
   null.
3. **An erroring expression looks "on".** Any rule that reads only the switch would call a broken
   expression a working one, which is wrong in the very case the ask mode cares about most ("what
   broke").
4. **Renumbering moves wiggles.** The 10-29 overlap audit found that renumbering breaks checks;
   this is the same cause showing up in values.

### Still open

- T005 (Pan Behind on the expression-driven null, by hand) now confirms turn f's likely action, as
  well as SB-2.
- T006 (time mapping on Icon plus planted copies, a scrub check by hand).
- `separate-dims.jsx`, the renumber step in `random-expression.jsx` and the edited
  `error-expression.jsx` were folded together after the live runs and haven't been run as written.
  Run each once at the T005 and T006 sitting.
