# Research: Move a group with a null (spec 012)

**Status**: Approved 2026-10-24 with the plan. **Amendment 1 (2026-10-25), awaiting approval:**
R2 rewritten for L-6 (TD § 15); R5, R6, R7 and R9 name what branch `skill-6-null` already does for
the review's S5 and S6.

Built against what's on main after the early wave B merge (d009d35; `mentor` 686 tests):
`mentor/lib/layer-info.mjs`, `comp-space.mjs` (with `parent_transform`), `visibility.mjs`,
`motion-sources.mjs`, `snapshot.mjs` (`sample_times`), `mentor/jsx/snapshot.jsx` (the 64-sample
cap) and `session.mjs` (`fresh`, `skill_options`, `setSkillData`). Spec 004 T133 to T136 and T158
are still open, so every live task here comes after them.

## R1. Candidates from `layer_info`, with unique names first

- **Decision:** `candidates(snapshot)` walks `layerInfo(snapshot).layers`, classes from `classOf()`,
  parents and children from `sourcesOf()`, keys and expressions from the keyed `layers` entry of the
  same index. A candidate (FR-004): class `renders` or `shy`, or `matte` taken with the layer it
  mattes (a **matte pair**, `layer_info[].matte` and `is_matte`); `three_d` false; `parent` null;
  kind not `null`, `camera` or `light`, class not `guide`; `auto_orient` not true (until L-4/T158);
  `samples_truncated` false. `hidden` only when the learner names it (`if_named`). Full-frame solids
  (bounds ≥ 95% of the comp both ways) and adjustment layers are `if_named`, never proposed. Each
  left-out layer carries one reason code for TD § 4's sentence. A candidate with children gets the
  `brings_children` note.
- **Unique names** (FR-004, TD § 14): `byName(snapshot, name).length > 1` gives the candidate
  `name_not_unique`; such a layer is never proposed, and `null_parent_snapshot` with it in the focus
  sets no focus and returns `rename_needed: [name]`.
- **Alternatives:** the keyed `layers` list (filter 1: drops a static group member, Row B); the eye
  switch (filter 2: drops a matte and a hidden null that carries children). Rejected by the spec.

## R2. The proposal: groups and crowds (amended 2026-10-25, TD § 15)

- **Decision:** each candidate's bounds are `footprint(snapshot, i, t).bounds` at the before-read
  time `t` (the read's `comp.time`). Two proposable units (bucket `default`; a matte pair is one
  unit of 2 that links when either member does) **link** when the gap between their bounds is at
  most `0.02 · comp.width` on both axes (a negative gap is an overlap). **Clusters** by union-find,
  as before. Then, new:
  - a cluster of 2 to 4 layers (counting a matte pair as 2) is a **group**; 5 or more is a
    **crowd**, never proposed and never trimmed; a lone unit is neither (a lone matte pair is a
    group of 2);
  - groups are sorted by (a) has a `kind: "text"` member and a member of another kind, first;
    (b) more layers; (c) lowest top index. `proposal` = the first, `next_proposal` = the second
    (or `null`), each in stack order;
  - no group: `no_proposal_reason` is `crowded` when any crowd exists, else `no_group`.

  A candidate whose footprint has a `reason` at `t` can't be placed, so it isn't proposed (it stays
  `if_named` with `cant_read`). Deterministic; unit tested; L-6 checks it on Mentor Practice 2 as
  built.
- **Worked on the stand-in** (TD § 15's table): `practice2b-with-wave-a.json` gives `proposal`
  Tile, Caption, Stamp (the only group with text), `next_proposal` Chip A, Chip B, Chip C (3,
  top index 9) ahead of Row A to C (3, top index 33), and wave A's 13 layers as one crowd. On
  `practice2b.json` the proposal is still Tile, Caption, Stamp, and with them excluded Row A to C,
  then the matte pair.
- **The finder** (FR-003, L6-2): the same function's clusters. A group: the proposal's size and
  names. No group, a crowd, and `exclude` empty: the largest crowd's size and `layers: []`. Else 0.
  It's the one deliberate disagreement with the snapshot tool (lesson only); spec › H-6 is the
  review case it can't tell apart.
- **Rejected** (TD § 15): the largest-group rule with "past 4, keep growing" (it chains a busy
  comp into one crowd and then guesses 4 of it); a tighter or relative margin (the chaining links
  are 3 to 25 px); shared key times (the intended group shares none); every pair must touch (splits
  an evenly spaced stack); always asking (the proposal is for the learner with no answer); moving
  the practice comp's layers (the human's call: it hides the problem).
- **Comp width:** checked 2026-10-24: the snapshot doesn't read the comp's size (`snapshot.jsx`'s
  `comp` holds `id`, `name`, `duration`, `frame_rate`, `time`, `hide_shy`), and nothing else gives
  it. That's a change to an existing shared file, so it's **shared-code request SR-4** (plan ›
  Requests; the same request as spec 011's SR-2), not a task here (approved 2026-10-24 as spec 004
  T164, T165). Until it lands, the analyzer reads
  `snapshot.comp.width` when present and otherwise returns `no_comp_size` and proposes nothing;
  a focus the learner names still works, and the mentor asks them to name the group (one
  sentence). Stand-ins and synthetics carry `comp.width` (marked synthetic) so the rule is tested
  now; live captures carry it once SR-4 is merged, and L-6 waits for it.

## R3. The before read and its stored time

- **Decision:** the `null_parent_snapshot` call that sets the focus (`skill_options.focus` given for
  the first time, or changed) passes `fresh: true` to `session.start` (allowed while no demo or check
  has run; `LESSON_UNDERWAY` otherwise), so its read **is** the baseline and its `comp.time` is the
  stored before-read time (FR-006, S-2). That read is taken with `sample_times` = the before-read
  time (always kept, as `comp.time`) plus nothing else: a focus layer's own key times are its own
  samples, and its footprint at its own key times needs only its own samples (it has no parent yet,
  FR-004). Calls without a focus change continue the lesson and keep the baseline.

## R4. Sample times in the check, and the cap

- **Decision:** `p2Times(baseline, focus)` per focus layer = the union of its key times on Anchor
  Point, Position (and X, Y), Scale and Rotation in the baseline, plus the before-read time
  (FR-011). `null_parent_check` reads with `sample_times` = the union over the focus, sorted, at
  most 63. The snapshot keeps `comp.time` and the caller's times first on **every** layer (spec 004
  data-model › Sample times, S5), so each P2 time is sampled on each child and on the null.
- **What reads the null's samples:** P2 composes through the **stored** null with
  `parent_transform` (FR-012), which replaces the direct parent's samples, so P2 doesn't read the
  null's samples at all. They're read for N3 (the null's anchor at the before-read time), for a
  still parent's chain above the null (FR-009), for re-storing the null, and for frames and comments.
  All of these use caller times.
- **The cap's edge** (the reviewer's note): a parent's own sample list is filled with every child's
  key times after the caller's, so with many children's keys a parent can lack a child's **late**
  key time that wasn't passed. With the P2 union passed, that can only happen when the union is over
  63 times. Then, and on any other `not_sampled`, the time goes to that layer's `not_checked` list
  and P2 doesn't pass: "couldn't check", never a guess (FR-011). A unit test pins it on a synthetic
  null with 70 merged child key times.

## R5. The lesson's null and the stored null (`setSkillData`)

- **Decision:** `skill_data` (written only by this skill's tools; spec 004 data-model › Session
  lesson):
  `{ null: { name, region, chain_on_purpose }, stored: { anchor, position, scale, rotation, time,
  from }, parented_seen: false }`.
- **Finding the null** (FR-007), at each check: the name the learner gave (`null_parent_check`
  input `null`), else the one null (class `null`) not in the baseline, else `which_null` with the
  new nulls' names. **Duplicate name** (FR-019, TD § 14 D-3): if another layer has the null's name,
  return `null_name_not_unique`, store nothing, grade nothing else on the null and run no P1 to P3.
  An existing null with children or keys only if the learner named it (`existing_null` hint, said
  once). No null found and none named: `no_null`; a named one not in the comp: `no_null` with
  `named`.
- **Storing** (FR-012, D-1): at each check and at the demo's fresh read, while no focus layer's
  parent is the null and N1 and N2 pass, the tool stores the null's sampled anchor, position, scale
  and rotation **at the before-read time** (from that read's samples; the time was passed) with
  `from: "check" | "demo"`. Once any focus layer is parented, `parented_seen: true` and it's never
  re-stored. **With nothing stored yet** (a review, or a lesson where the learner parented before
  any check passed N1 and N2), the first check that sees the null passing N1 and N2 stores it, from
  that read's sample at the before-read time, even with focus layers parented (S6). Until then a
  layer parented to the null is `not_stored` in `not_checked`.
- **Renamed null** (Edge Cases): the stored name is gone and exactly one null is the parent of every
  parented focus layer → that's the null; its new name is stored and `null_renamed` is returned.
- **Region and "only slides"**: the learner's answer travels as `null_parent_check` input `region`
  (one of the nine codes of spec 011's grid applied to the group's bounds, or `slides_only`); the
  tool stores it. The model never supplies the stored transform.

## R6. The checks: N1 to N3, P1 to P5

- **N1:** `classOf === "null"`. **N2:** `three_d` false and `parent` null; with a parent, moving
  when any entry of `sourcesOf(read, null).parents` has `moves_children` in the baseline **or** the
  check read → `null_parent_moves` (out of the lesson: nothing graded, `markChecked` not called, no
  record of a miss); still → `null_has_parent` hint (storing `parent_asked`), and with input
  `chain_on_purpose: true` **at a later check whose parent is still `parent_asked`** N2 passes
  (stored as that parent's name) and `one_level_only` is returned once (S5). An "on purpose" with no
  earlier hint for that parent is ignored. A 3D null: `three_d`; not class `null`: `not_a_null`.
- **N3** (S-5): the null's anchor in comp space at the before-read time (`compPosition`) against
  the named region of the **group's combined bounds** (the union of the focus footprints' bounds in
  the baseline at that time), within 10% of the group's width across and 10% of its height up and
  down (spec 004 FR-028's per-axis rule). Skipped with `slides_only` until P5 needs it.
- **P1:** `sourcesOf(current, name).parents[0]?.layer === null name` (the Parent link only).
- **P2:** for each time in the layer's `p2Times`, each of the four corners of `footprint(current,
  j, t, { parent_transform: stored })` (only when its parent is the null; otherwise plain) within
  1 px (Euclidean) of `footprint(baseline, i, t)`'s same corner, both with `rect`. Reports the worst
  corner, its distance, direction (from that corner's delta) and time; any `reason` → `not_checked`
  and P2 fails.
- **P3:** per keyed property (transform, effects and others; X and Y apart) the key count and every
  key time within half a frame of the baseline's. Raw values never compared (B9).
- **P4** (S-4): the null has ≥ 2 keys with different values on Position, X, Y, Scale or Rotation.
  Only Anchor Point keys → P4 fails with `anchor_only` (D-2's hint). Opacity, effects or an
  unkeyed expression don't count.
- **P5:** a move that includes Scale or Rotation needs N3; with `slides_only` or no region,
  `region_needed`.
- **Stages** (FR-014): `parenting_passed` = N1 to N3 (as they apply) and P1 to P3 for every focus
  layer; `passed` = that and P4 and P5. The prompt asks for the move only after
  `parenting_passed`. `markChecked(passed, { demoUndone })` on every check whose comp matches,
  except `null_parent_moves`.

## R7. Demo: parent one layer, measure it, never retry

- **Decision:** demo target (FR-008), set by the analyzer from the baseline: the first focus layer
  in index order of class `renders` or `shy` (never `matte` or eye off), 2D, not locked (S6), with
  no expression on a
  keyed Position, Scale or Rotation, preferring one with its own transform keys. The rule "no demo
  until the null passes N1 and N2" is enforced by `null_parent_demo`, which refuses with
  `null_not_ready` while `skill_data.stored` is absent (the session fixes the target at the start).
- **`null_parent_demo`:** `assertCanDemo`; one fresh read with the P2 times; refusals before any
  write (`NULL_PARENT_REFUSED: <reason>`): comp not the lesson's, null or target not found by name,
  null fails N1 or N2, target already parented, locked or 3D, `null_scale_zero` (the null's Scale is
  0 on an axis at the current time: AE can't place a child under it without a jump, and the twin
  can't invert it; Open question Q2). Re-store the null while none is parented. Then
  `runSnippet("null-parent-demo", { comp_id, layer_index, layer_name, null_index, null_name }, {
  undo: true })` (sets `layer.parent`, which compensates as the Parent column's pick whip does; L-3
  confirms); `recordDemo`; a second read and P2 for the target: `moved_px` (0 when within 1 px) and
  `jumped: true` with the distance when more, never retried (TD B-7).
- **Twin:** `apply` rewrites the target's keyed and sampled anchor (unchanged), position
  (`toLayerSpace(snapshot, null, compPosition, t)` at each sample time), scale (divided by the null's
  scale per axis) and rotation (minus the null's) using the null's samples, and sets `parent`. A
  `singular` from `toLayerSpace` refuses with `null_scale_zero` and saves nothing. The twin's
  result passes P2 and P3 (FR-018).

## R8. Other changes and comments

- **Other changes** (FR-021, filter 5), from `layer_info` and raw keys of every layer, not the
  focus filter and not `unexpectedChanges()`: a layer outside the focus now parented to the null,
  or whose parent changed; keys added, moved or removed outside the focus; an expression on or off
  on a keyed property; a layer added or deleted (the null aside). A focus layer's children brought
  along are named once (`brings_children`), not as a fault. A rename the mentor asked for is never
  one (the focus rename is in the baseline; the null's is of a layer added after it).
- **Comments** (FR-020): `linear`, `held` (asked), `stacked` (the null's key time range overlaps a
  focus layer's own Position, Scale or Rotation key range, from `own_keys` and key times), `default_name`
  (`/^Null \d+$/`), `non_uniform_scale`, `zero_scale_at_key`, `opacity` (keyed, or static strictly
  between 0 and 100, while a child's isn't; a null's static 0 is AE 26.5's default and never
  counts; amended 2026-10-26 from the live sitting, L-1), `effect` (`effect_count > 0` or a keyed effect). The last four and `anchor_only`
  are also returned before a pass when they explain a failure.

## R9. Review mode

- **Decision:** `mode: "review"`: `exclude` from the record's past targets (`{ layer, property:
  "Parent" }`); the analyzer drops those layers and every already-parented layer, then proposes as
  R2, taking `proposal` only (never `next_proposal`). None, including a crowd only:
  `no_new_target`. The review's before read is the read when the task is given (`fresh:
  true` with the focus, as R3). `FINDERS["parenting.null"].focus` returns the proposal's size with
  the same `exclude` (FR-003), or a crowd's size with `layers: []` only when `exclude` is empty
  (R2, L6-2), 0 without `layer_info`; `review: true` after the review tests pass.

## R10. Fixtures

- **Decision:** `mentor/test/fixtures/null-parenting/` with `README.md`, `answer-key.json`,
  `load.mjs`, `records/`, `synthetic/` (rows 4, 10, 21, 23, 26, 31, 35, 36, 40, the 70-time cap
  case, a null at Scale 150 and Rotation 30 for S-1 until L-2's capture), `stand-in/` (built by
  `stand-in/build.mjs` from `build-practice-comp-2b.jsx` and `build-overlaps-b.jsx`; deleted after
  the sitting) and the live captures. Spec 004's `practice2b.json`, `practice2b-parented.json` and
  `overlaps.json` (T133, T135) are read in place when present.

## R11. Version

- **Decision:** Layer > New > Null Object (no shortcut); the Parent & Link column and how to show
  it (right-click a column heading, Columns); "the pick whip in the Parent column"; never Shift+F4;
  no null defaults, no Option or Shift while parenting, no Quick Offset until L-1 logs each
  (`<!-- L-1 -->` places).

## R12. The live sitting

- **Decision:** one sitting after spec 004's T133 to T136 and T158, not overlapping spec 011's:
  L-1 to L-6, the captures, the desk block, the first live lesson on 2b and a deliberate jump
  (SC-001, SC-002). The review (SC-009) a day or more later.
