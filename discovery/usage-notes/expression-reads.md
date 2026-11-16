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
2. **Pan Behind on the parent instead of the art is an easy slip.** *Session 2:* Shake Control was
   selected as well as under the cursor, so which rule decides is still open (T034's A/B test). Either
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
- **Which layer Pan Behind takes is still open:** Shake Control was both selected and under the
  cursor, so this run can't tell the two rules apart. T034 tests it (select A, drag over B).

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

### T006: time mapping (E22)

On the practice project (`Claude AE Tutor Test (converted).aep`, AE 27.0). Icon Precomp's Icon Shape
sits left at its 0 s key and right at its 1 s key. `mentor/dev/live-015/time-mapping.jsx` built a new
comp, "T006 time mapping", with four layers of it: A start offset 0.5 s, B stretch 50%, C stretch
−100% starting at 3.5 s, and D time remapped (0.5 s → 1 s, 2.5 s → 0 s, linear). The comp was deleted
afterwards, and the project was back to 77 items. Answer key:
`mentor/test/fixtures/precomps/time-mapping-key.json`.

| Copy | Inner key → outer time (formula) | AE's `sourceTime` there | Builder by eye |
|---|---|---|---|
| A offset | 0 → 0.5 s, 1 → 1.5 s | 0, 1 | left, right ✓ |
| B stretch | 0 → 0 s, 1 → 0.5 s | 0, 1 | left, right ✓ |
| C reverse | 1 → 2.5 s, 0 → 3.5 s | 1, 0 | right ✓; nearly left on the frame before 3.5 s, **gone at 3.5 s** ✓ |
| D remap | 1 → 0 to 0.5 s (held), 0 → 2.5 s onward (held) | 1, 0 | right holding, halfway at 1.5 s, left holding ✓ |

- **The formula holds for all eight keys:** start time + inner time × stretch, or, with time remap,
  the frames whose remap value equals the inner time. It matches AE and the builder's eye.
- **With a negative stretch, AE reports the in point after the out point** (C: 3.5 and −4.5). A read
  that assumes in < out says a reversed layer never shows. Inner time 0 lands exactly on the end, so
  that key never shows at all.
- **Time remap holds a key's pose over a range,** not at one time (D: inner 1 holds for 16 frames,
  inner 0 for 165). The read should report a range when the remap value is flat.
- **`sourceTime()` exists only in expressions,** not in ExtendScript. The answer key came from a
  Slider with `sourceTime(time)` on each copy.
- **"How many places" must count layers:** `usedIn` lists 3 comps for Icon Precomp, but 4 layers
  use it (Mentor Overlaps has two).

### Still open

- Nothing in Phase 0. The spec-writer's second fold (T008) takes session 2's new facts: which layer Pan
  Behind takes (open, T034), stale hidden dimension values, the reversed in and out points, held remap
  ranges, and counting layers for "how many places".

## Session 3: 2026-11-16, T033 (Comp 1), T015 and T034 (cockpit with the builder)

AE 27.0, the builder's own `Comp 1.aep`, after the phase 1 merge. Spot checks ran on a duplicate,
"Comp 1 T034", with two planted expressions; it was deleted afterwards. Comp 1 then matched the T015
capture (`mentor/test/fixtures/expressions/comp1.json`) on a strict full-JSON compare, and the project
was back to 34 items.

### T015 capture and T033 on Comp 1

- **SC-003 ✓:** Shake Control's Position at 0.6 s is 960, 540 before the expression and 952.352,
  542.492 after; rock.png's motion source is Shake Control, by expression.
- **SC-008 ✓:** a Comp 1 snapshot took about 165 ms before the merge and about 210 ms after (wall clock,
  3 runs each, +45 ms against a 0.5 s budget); the fine sweep on two layers adds nothing measurable.
- **The capture found three faults the derived fixture hid** (fixed, merge `1499819`): AE 27.0 returns
  expression text with `\r` line ends, so the parser read Shake Control's two expressions as setting
  their own value (a `//` comment ran to the end of the text); SC-001's exact compare; and the
  whole-comp summary at 12.4 KB over its 12 KB cap (each of 13 children repeated its parent's sweep;
  now 10.5 KB).

- **Mentor Practice (practice project):** about 129 ms before the merge and about 137 ms after (+8 ms,
  4 runs each; 10 layers, 1 expression). SC-004's phase 1 half: the easing findings are identical
  before and after.

### T034: ten spot checks (SC-010)

The read was `describe_layers` run live on the copy at 0.6 s. Planted: logo.png's Opacity `value * 0.5`,
switched off; outline.png's Scale `thisComp.layer("Nope").transform.scale`, which errors.

| # | The read said | Builder in AE |
|---|---|---|
| 1 | Shake Control: Position and Rotation expressions, both on | ✓ |
| 2 | Black Solid 1: one expression, on CC Light Sweep's Center | ✓ |
| 3 | Sweep Control: one link in, from Black Solid 1's Center | ✓ |
| 4 | Black Solid 1 doesn't render (eye off) | ✓ |
| 5 | Shake Control has 13 children, rock.png among them | ✓ |
| 6 | Shake Control's Position moves most, about 12.1 px, at about 1.5 s | ✓ |
| 7 | Shake Control's Rotation peaks at about 0.59° near 2.57 s | ✓ |
| 8 | logo.png's Opacity expression is off (planted) | ✓ |
| 9 | outline.png's Scale expression is on, with an error (planted) | ✓ |
| 10 | outline.png doesn't render (eye off) | ✓ |

**10 of 10 agree** (SC-010 needs 9). A reference to a missing layer ("Nope") reads as not found, not
as unresolved, so other layers' "no links" stays true; that's as designed (FR-010 counts only names it
can't read). Black Solid 1 moved from layer 23 to 20 in the copy during the checks, probably an
accidental drag; Comp 1 itself was untouched.

### Pan Behind: which layer it takes (T005's open question)

Read every layer's Anchor Point before and after, on the copy.

| Test | Selected | Under the cursor | Pivot that moved |
|---|---|---|---|
| A | the text layer only | rock.png (logo.png on top, O2 Fragments higher) | **the text** (0, 0 → 176.8, −77.0) |
| B | nothing | the same area of the rock | **O2 Fragments** (layer 2, the top layer there), which AE then selected |

- **Rule on AE 27.0: the selected layer; with nothing selected, the top layer under the cursor.** The
  rock and logo never moved.
- This overturns `anchor-mentor/SKILL.md`'s lines from spec 011's live session (2026-10-26, AE 26.5, a
  shape layer's group): "the layer under the cursor even when another layer is selected". Test B
  agrees with that session if nothing was selected then. T058 rewrites those lines.
- Turn f fits rule A: Shake Control was selected.

