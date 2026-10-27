# Spec 012 live sitting, 2026-10-26

Hand-back for the 🖐 tasks T336 and T337 (`quickstart.md` › 2 and 3). Run by the cockpit through the
bridge (as in specs 004 and 008 to 011), with the builder doing the hand moves. AE 26.5
(`26.5x89`) on macOS 27.0.1, project `discovery/Claude AE Tutor Test.aep`, Mentor Practice 2 (179).

Before the sitting, `main` was merged into `skill-6-null` (52 commits behind, no conflicts,
`0f9ef94`), so the branch has spec 004's live `layer-info/practice2b.json`, SR-4's `comp.width` and
the current `capture.mjs`. With that in, `load.mjs` prefers the live base (comp 179) over the
stand-in base (comp 300), and 89 of 957 tests fail until the desk block (T338). Before the first
move, a fresh capture of Mentor Practice 2 strict-matched `layer-info/practice2b.json` (`comp`,
`layers`, `layer_info`), so no reset was needed. The comp as built has all 40 layers, wave A's
included.

The `ae-mentor` server in the cockpit session was started from `main` and has no skill 6 tools, so
reads go through `node mentor/dev/capture.mjs` and the branch's `lib/` functions called directly
(the code the tools call).

## L-6: the proposal on Mentor Practice 2 as built

`analyze()` on the live read (no focus): `proposal` **Tile, Caption, Stamp**; `next_proposal`
**Chip A, Chip B, Chip C**; wave A's 13 close layers neither proposed nor listed; `left_out` Hatch
Rig (null), Hatch (parented to the null Hatch Rig), Shadow (parented to Plate), Background (full
frame). Matches TD § 15's table and the answer key's `practice2b-with-wave-a.json`. **Passes.**

## L-1: the null, and Option or Shift while parenting (duplicate "MP2 L-1", 882)

### The null as AE makes it

Nothing selected, playhead 0, Layer > New > Null Object. AE named it **"Null 12"** (the number
carries on from the project's other nulls, not 1) and put it at index 1, so every other layer's
index went up by one (Tile 30 → 31). Read by script and by `capture.mjs`:

| Field | Value |
|---|---|
| Source | a 100 × 100 solid (`nullLayer` true), in 0 to 8 s (the whole comp) |
| Anchor | `[0, 0]`, the **top-left corner** of its square, not the middle |
| Position | (960, 540), the comp's center, so the square draws down and right of center |
| Scale, Rotation | 100 %, 0° |
| **Opacity** | **0** (not 100) |
| Snapshot | `kind: "null"`, `is_null` true, `rect` 100 × 100 at (0, 0), `rect_extents` null |

**For T339:** a null's Opacity reads 0 in 26.5. Any rule that treats Opacity 0 as hidden or as
never on screen mustn't apply to the null (row 15 and row 16 cover hiding and frames; check that
neither keys on Opacity). The square's top-left sits on its Position, so "the null's place" is
its Position, not the square's middle (N3 and the placement wording).

### The column and the pick whip at 26.5

- The column header reads **"Parent & Link"**.
- Hovering the Parent column's pick whip shows the tooltip **"Parent pick whip (select layer from
  which to inherit transforms)"**.

### Parenting Tile with Option held

Option held, Tile's **Parent & Link** pick whip dragged onto Null 12. **Tile jumped off the
comp** (the builder saw it leave the visible frame). The read shows why: AE **kept Tile's raw
values** (Position (1200, 150), the keys at 4.167 and 5.167 s, Scale's keys at 4.367 and 5.367 s,
all unchanged) and only set the parent (`parent` 1). Read in the null's space they put Tile at
about (2160, 690), past the comp's right edge. So **Option = parent without keeping the child in
place**, the opposite of a plain pick whip, which rewrites the keys (spec 004's live sitting).
Capture kept in the scratchpad, not a fixture (`jumped.json` comes from L-3).

**For `SKILL.md` (L-1 place):** never suggest holding Option while parenting; if the learner says
the layer flew off when they parented, ask whether Option was held, and the fix is Edit > Undo
and parenting again without it.

Edit > Undo after the Option parenting read **"Undo Pick Whip Layer Parent"**, one step, and Tile
was back.

### Parenting Tile with Shift held

Shift held, the same drag. **Tile moved** (the builder saw it). AE **moved Tile onto the null**:
Position's keys were rewritten to **(0, 0) at 4.167 s and (40, 0) at 5.167 s**, so Tile's first
place is the null's Position (960, 540) and its 40 px slide is kept relative to it. Scale's keys
(4.367, 5.367 s) were unchanged. The null didn't move.

| Held while parenting | Parent set | Child's Position keys | On screen |
|---|---|---|---|
| nothing (spec 004) | yes | rewritten so the child stays put | no move |
| **Option** | yes | **kept as they were** | jumps by the null's place (off the comp here) |
| **Shift** | yes | **rewritten so the first key sits on the null**, the motion kept | snaps to the null |

**For `SKILL.md` (L-1 place):** parent with no key held. Both modifiers make a jump that P1 to P3
should catch (jumped, with the distance); the hint can ask whether a key was held. Shift's jump
lands every child on the same spot, which is a sign of Shift; Option's lands each child the null's
offset away. Undo label for both is the same as a plain parent, so the prompt still says only
"Edit > Undo".

Edit > Undo after the Shift parenting also read **"Undo Pick Whip Layer Parent"**, one step; Tile
back unparented at (1200, 150) and (1240, 150). Both modifiers undo under the same label as a plain
parent.

## L-2: a plain pick whip under a scaled and turned null (same duplicate)

Null 12 set by script to Scale 150 % and Rotation 30° (its own undo step), Position (960, 540)
unchanged.

Plain pick whip (no key held), Tile onto the scaled and turned Null 12. **Tile didn't move, change
size or turn** (the builder). AE **rewrote all three** of Tile's transforms so it stays put:

| Property | Before | After |
|---|---|---|
| Position keys | (1200, 150) at 4.167 s, (1240, 150) at 5.167 s | (8.564, −305.167), (31.658, −318.5) |
| Scale keys | 100 % at 4.367 s, 110 % at 5.367 s | 66.667 %, 73.333 % (÷ 1.5) |
| Rotation (unkeyed) | 0° | **−30°** (the static value rewritten) |

Key times and counts unchanged. `parented-rot.json` captured with the group's times (0, 4.167,
4.367, 4.667, 5.167, 5.367, 5.667). `compPosition` and `footprint` on it against the base:
**within 0.001 px** at 0, 4.167 and 5.167 s (the base's only sampled times in range). So P3's
"compare counts and times, never raw values" (B9) is right, and the comp-space read holds under a
parent with scale and rotation (**SC-006 on `parented-rot.json`: passes**; T338 re-runs it in the
tests). Captured from the duplicate (comp 882); T338 sets its comp id and name to 179's.

## L-3: the demo, its undo, and the Position pick whip (duplicate "MP2 L-3", 938)

Tools run **in-process** from the branch (`tools/index.mjs` handlers, temp `AE_MENTOR_HOME`), on a
fresh duplicate of the base.

1. `null_parent_snapshot` with focus Tile, Caption, Stamp: lesson `new`, `targets` the three
   parents, `demo_target` `parent/Tile`, `null_ready` false.
2. A null planted by script at the group's middle, **(1215, 165)** (the group's footprint 1100 to
   1330 by 100 to 230 at 0 s). AE named it **Null 13**; Opacity again **0**, anchor `[0, 0]`.
3. `null_parent_check` (no args): `null_ready`, N1 and N2 true, N3 `null` (not yet graded),
   `stored_now` true; every layer P2 0 px, P1 false.
4. **`null_parent_demo` `parent/Tile`: `moved_px` 0, `jumped` false, no `couldnt_check`.** Tile's
   Position keys rewritten to (−15, −15) and (25, −15), Scale's unchanged; parent Null 13.
   `demo-done.json`.
5. Edit > Undo, **once**: it read **"Undo AE Mentor: null-parent-demo"**, and Tile lost its parent
   (the builder). Read: Tile unparented, keys back to (1200, 150) and (1240, 150), Null 13 still
   there. `demo-undone.json`. `null_parent_check` after it: `demo_undone` true, null still ready.

**L-3's demo half passes**: no jump, one undo step. No snippet fix needed for T339.

### The Position pick whip (row 3), unkeyed and keyed

- **Unkeyed (Caption):** the pick whip beside Caption's Position dragged onto Null 13's Position.
  Caption **moved to the null's place** and the Parent & Link column stayed empty (the builder).
  The snapshot reads Caption's Position as (1215, 165) with no parent; `null_parent_check` gives
  **`pickwhip_position`** (Caption, Null 13), P1 false, P2 **50 px up at 0 s**.
  `pickwhip-position.json`. Edit > Undo read **"Undo Pick Whip Expression"**, one step.
- **Keyed (Tile):** the same on Tile's keyed Position. Tile **moved to the null's place and its
  keys stayed** (the builder). Read: Position `expression_enabled` true, both keys kept, every
  sample (1215, 165). The check: **`pickwhip_position`** (Tile), `expression_on_move` true, P2
  **29 px down and left at 5.167 s** ((1240, 150) to (1215, 165)). Kept in the scratchpad as an
  extra (not in the quickstart's table).

So the snapshot sees both pick whips as an expression on Position with no parent, and the hint
fires either way. Matches row 3 and the answer key's `pickwhip_position`.

## L-4: auto-oriented layers

Answered by spec 004's live sitting (T158, `specs/004-ae-curriculum/live-sitting-2026-10-26.md`):
**the snapshot's rotation read doesn't include auto-orient.** So auto-oriented layers stay out of
the focus (`comp-space`'s `auto_orient` reason); T339 leaves `null-parenting.mjs` as it is.

## L-5: the renumbering (duplicate "MP2 L-5")

Lesson started on the duplicate (focus Tile, Caption, Stamp at 30, 31, 32;
`renumbered-before.json`), then a null added by script with nothing selected (AE: "Null 41" at
(960, 540), index 1; Tile, Caption, Stamp now 31, 32, 33; `renumbered-after.json`).
`null_parent_check`: every focus layer **found by name**, P2 0 px, P3 passing, `null_ready` on the
new null. **Passes.**

## Captures (T337)

**Departure from the quickstart, as in spec 011:** only L-1 to L-3 needed the builder's hands.
The rest of § 3's table, and every stand-in that had no live file listed, were **planted by
script** on a fresh duplicate of Mentor Practice 2 each, read with the mentor's own `snapshot.jsx`
(the group's times or the rows' times, as in the README), and the duplicate deleted. Each file
carries a top-level `captured_from` (the duplicate's id and name, the plant, and "hand" or
"script"), with `comp.id` and `comp.name` set to 179's. The plants follow `stand-in/build.mjs`'s
recipes exactly (same names, places, key times and values), except that parenting is AE's own
(`layer.parent = null`, which keeps the child in place like the Parent pick whip) rather than
plain arithmetic. The lesson's null is **renamed "Null 1"** in every plant so the hand-written
answer key holds; AE's own name is "Null N" with N counting every null in the project (12, 13
and 41 in this sitting), 1 only in a project with no nulls yet.

| Kind | Files |
|---|---|
| By hand (L-2, L-3) | `parented-rot.json`, `demo-done.json`, `demo-undone.json`, `pickwhip-position-hand.json` (Caption, nothing else parented), `pickwhip-position-keyed-hand.json` (Tile, keyed) |
| L-5 | `renumbered-before.json`, `renumbered-after.json` |
| Planted, quickstart › 3 | `null-center.json`, `null-top-left.json`, `jumped.json`, `pickwhip-position.json` (Tile and Stamp parented, Caption by expression, as the stand-in), `visible-parent.json`, `null-keyed-early.json`, `null-moved-before-parenting.json`, `fade-null.json`, `rotate-null.json`, `anchor-only-null.json`, `two-nulls-same-name.json`, `review-rows-visible.json` |
| Planted, the other stand-ins | `slide-null.json`, `one-key-null.json`, `null-moved.json`, `practice2b-null1.json`, `two-nulls-renamed.json`, `null-renamed.json`, `plate-parented-too.json`, `playhead-moved.json`, `practice2b-with-wave-a-parented.json`, `review-rows-null.json`, `review-rows-pass.json`, `review-rows-parented-in-one-go.json` |
| Extra | `parented-center.json`: the group parented to Null 1 at the group's middle (see below) |

`practice2b.json` and `practice2b-with-wave-a.json` need no capture: spec 004's live
`layer-info/practice2b.json` is the comp as built, wave A included.

**For T338:** spec 004's `layer-info/practice2b-parented.json` has its null **"Null 11" at
(960, 540)**, not Null 1 at the group's middle, so attempts that go `null-center.json` →
`practice2b-parented.json` change null mid-lesson. `parented-center.json` is the same lesson's
parented read on the stored null; point those attempts at it, and keep spec 004's file for SC-006
and the tests that read it on its own.

Closing: the three duplicates and the 30 null solids this sitting made (Null 12 to Null 41, none
used) deleted, Null 1 to Null 11 kept; the project back to 72 items. Mentor Practice 2
**strict-matches** `layer-info/practice2b.json` (`comp`, `layers`, `layer_info`). No capture
holds a user or folder name. `.aep` saved. With live captures first in `load.mjs`, the skill 6
tests are at 172 of 198 (T338's work).

## For T339 and the spec writer

- **SKILL.md, L-1 places:** the column is **"Parent & Link"**; the pick whip's tooltip is "Parent
  pick whip (select layer from which to inherit transforms)"; parent with no key held (Option
  keeps the raw values and the child jumps by the null's place; Shift snaps the child onto the
  null). A new null's anchor is its square's top-left, on its Position.
- **A null's Opacity reads 0** in 26.5. Check that nothing in the check or the focus treats it as
  hidden or never on screen (rows 15, 16).
- **No snippet fix** (L-3: no jump, one undo). **Auto-orient** stays out (L-4).
- Nothing found changes a requirement.
