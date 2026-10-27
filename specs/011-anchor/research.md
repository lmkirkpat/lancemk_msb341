# Research: Set the pivot (spec 011)

**Status**: Draft, awaiting the builder's approval (2026-10-24). Amended 2026-10-26 (spec ›
Changes 2026-10-26): R1's ranking, R4's numbers.

Built against what's on main after the early wave B merge (d009d35; `mentor` 686 tests):
`mentor/lib/layer-info.mjs`, `comp-space.mjs`, `visibility.mjs`, `motion-sources.mjs`, and
`session.mjs` (`fresh`, `skill_options`, `setSkillData`). Spec 004 T133 to T136 (the live captures
and answer keys) and T158 are still open, so every live task here comes after them.

## R1. Candidates come from `layer_info`, classed by `classOf()`

- **Decision:** `candidates(snapshot)` walks `layerInfo(snapshot).layers` (every layer), takes the
  class from `classOf()`, the parent chain from `sourcesOf(snapshot, index).parents`, and keys and
  expressions on Anchor Point, Position (and X, Y), Rotation and Scale from the snapshot's keyed
  `layers` entry for the same index (the only place keys are read). Each layer lands in exactly one
  bucket of FR-004 (`default`, `if_named`, `never`) with one reason code, so the prompt can say
  TD § 4's sentence. Shape layers were `if_named` with reason `shape_until_l1` until the desk block (tasks T235, from L-1)
  flipped one constant, `SHAPES_DEFAULT`, in `mentor/lib/anchor.mjs`; L-1 passed and it's `true`
  (2026-10-26).
- **Footprint readable** (FR-004, FR-018): a default candidate needs a `footprint()` with corners
  at its check time (R3) in the first read and a non-zero area there. A zero-area footprint (Scale
  0 on an axis at that time) is `never` with reason `cant_read`, never a pass later.
- **Ranking** (FR-004, D-3): sort keys in order: unparented (`parents.length === 0`); **how
  animated already, three steps: no keyed property at all (`keyed.any` false), then keys but none
  on Rotation or Scale, then Rotation or Scale keys** (amended 2026-10-26, was two steps; the
  review moves this whole key up, R8); pivot "where AE put it" (the anchor within 0.5 px of its `rect`'s center **or** of
  [0, 0], either one); smaller footprint area first (so a full-frame layer always ranks last,
  which is FR-004's "smaller over full-frame" with no comp size needed); then index. Deterministic,
  one comparator.
- **Full-frame bucket** (FR-004: "allowed if named, proposed only when nothing else exists"): a
  layer whose footprint bounds cover ≥ 95% of the comp both ways. The snapshot doesn't read the
  comp's size (checked 2026-10-24), so this needs **shared-code request SR-2** (plan › Requests;
  the same as spec 012's SR-4; approved 2026-10-24 as spec 004 T164, T165). Until it lands, `full_frame` is `null` (unknown) and such a layer
  stays `default` but ranks last by area, so it's proposed only when nothing smaller qualifies,
  which is the same outcome on Mentor Practice 2. Stand-ins carry `comp.width` and `comp.height`
  (marked synthetic) so the bucket rule is tested now.
- **Alternatives:** the keyed `layers` list (filter 2: drops every unkeyed layer), the eye switch
  (filter 3: calls a matte hidden). Rejected by the spec.

## R2. The nine places and item 1, in the layer's own space

- **Decision:** a place is one of nine codes (`top-left`, `top-middle`, `top-right`,
  `middle-left`, `center`, `middle-right`, `bottom-left`, `bottom-middle`, `bottom-right`). Its
  point is `rect.left + {0, ½, 1}·width`, `rect.top + {0, ½, 1}·height` from the layer's sample at
  the check time. The anchor (the same sample's `anchor`, own space) is **in** a place when it's
  within `max(0.1·width, 3)` across **and** `max(0.1·height, 3)` up and down. `placeNow()` returns
  the place it's in, else `outside` when the anchor is beyond the rectangle by more than the
  tolerance on an axis, else `between`. One function, `inPlace(sample, place)`, serves item 1, the
  already-there rule (FR-007) and the review's leave-out, so they can't disagree.
- **Rectangle kind** (filter 5): one table `RECT_KIND = { shape: "rect", text: "rect", default:
  "rect" }` in `anchor.mjs`, used by item 1 **and** item 2. L-1 (shapes) and L-5 (text) can switch a
  kind to `rect_extents` in the desk block; nothing else reads the kinds.
- **Why own space:** S-2; Scale 200%, Scale [-100, 100], rotation and a parent's scale don't change
  which place is which. Comp pixels are used only for "did it move" (items 2, 4, 5).

## R3. The check time and the rest key

- **Decision:** `restKey(keyedLayer)` reads Rotation (`ADBE Rotate Z`) and Scale (`ADBE Scale`) key
  values from the snapshot's `layers`:
  1. Times where Rotation is 0 or a whole turn within 0.5° **and** Scale's |x·y| is its largest key
     value (Scale at its largest; a time with no key on one property counts as matching it if that
     property isn't keyed). Earliest wins: basis `both`.
  2. None: the Scale key with the largest |x·y| (S-1's tie-break): basis `scale`.
  3. Rotation only, none at 0 or a whole turn: the key closest to one, earliest on a tie: basis
     `closest_rotation` (D-1).
  The learner's own choice, `skill_options.focus[i].rest_time`, replaces it when it's a key time of
  that layer (basis `learner`); any other value is ignored and returned as `rest_time_not_a_key`.
- **Check time:** the rest key's time for a layer with Rotation or Scale keys; otherwise the
  baseline's `comp.time`. Always from the baseline, never the playhead now (row 26).
- **Alternatives:** read Rotation and Scale from samples (rendered): rejected, keys are what the
  learner places the playhead on, and the sampled values at a key time equal the key values anyway.

## R4. Samples: what each read must hold, and the cap

- **Decision:** `neededTimes(snapshot)` is the union of every candidate's (all three buckets but
  `never`) rest-key time and Position key times, sorted, at most 63. `anchor_snapshot` takes read 1
  with `takeSnapshot()`; if any needed time is missing from any layer's samples (`sampleAt` finds
  none), it takes read 2 with `takeSnapshot({ sample_times: neededTimes })` and passes read 2 to
  `session.start` (FR-013). A continued lesson keeps its baseline, so this only matters for a new
  or `fresh` one. `anchor_check` always reads with `sample_times` = the baseline's check times for
  the focus, its `comp.time`, and the focus's Position key times from the baseline.
- **The cap** (spec 004 data-model › Sample times, S5): caller times are kept first on every layer,
  then key times earliest first, up to 64. So a needed time is never dropped by the cap, but a
  **layer outside the focus** with many key times can lose late ones; item 5 compares only times
  sampled in **both** reads, so that just narrows what it sees. Any `not_sampled` on a focus layer
  is "can't check" (FR-018). A unit test pins both on a synthetic 70-key layer.
- **Fixture mode** ignores `sample_times` (a capture can't be re-sampled), so live captures in the
  sitting are taken with `node mentor/dev/capture.mjs --times <list>` and the answer key records
  the list.

## R5. Focus, targets and the demo target

- **Decision:** the learner's focus travels in `skill_options` (model-supplied, plain data, kept on
  continue): `{ focus: [{ layer, place, rest_time? }] }`, one or two entries (FR-008), entry 0 the
  learner's layer, entry 1 the one they care less about (the mentor's offer, or the second they
  named). The analyzer resolves names against the baseline (unique name, else `UNKNOWN_LAYER`
  through `focus_layers`; a duplicate name returns `name_not_unique` and no target, since name is
  how the check matches). Target IDs `anchor/<baseline index>`; `target_refs` one `{ layer,
  property: "Anchor Point" }` per target (FR-025).
- **Already there** (FR-007): an entry whose anchor is already `inPlace` at its check time in the
  baseline gives no target and is returned in `already_there`.
- **Demo target** (FR-014): entry 1 if it's a `default` candidate, else entry 0 if it is, else none
  (`no_demo_reason: "not_a_default_candidate"`); with one entry the session's single-target rule
  gives `single_target` (filter 4, pinned by a test). "The current time is on its rest key" can't
  be judged when the session fixes the demo target (from the baseline's time); it's judged at the
  demo call instead: `anchor_demo` refuses with `not_at_rest` (FR-015's own refusal) and the mentor
  asks for the playhead on the rest key. It doesn't switch to the other layer (Open question Q1).
- **No candidate** (Edge Cases): after the learner adds a solid, `anchor_snapshot` with `fresh:
  true` restarts the lesson from the new read (allowed before any demo or check; `LESSON_UNDERWAY`
  after).

## R6. The demo write: values in the server, two writes in the snippet

- **Decision:** `demoValues(sample, rect, place)` (pure, in `anchor.mjs`): new anchor A′ = the
  place's point; Δ = A′ − A; new Position P′ = P + L·Δ, where L is the 2 × 2 linear part
  (`[a, b, c, d]`) of `layerMatrix(sample)` (own rotation and scale). Since the layer's matrix is
  T(P)·R·S·T(−A), this keeps every point of the layer where it was, and so its footprint, through
  any parent chain (the parent's matrix multiplies both sides). No inversion, so `singular` can't
  arise here; a Scale 0 axis gives P′ = P on that axis, which is still exact.
- **`anchor-demo.jsx`** (ES3): args `{ comp_id, layer_index, layer_name, anchor: [x, y], position:
  [x, y] }`. Refuses before any write (`ANCHOR_REFUSED: <reason>`) if the comp or layer doesn't
  match, the layer is locked, 3D, or has keys or an expression on Anchor Point or Position (or X,
  Y). Writes Anchor Point, then Position (or X and Y when separated), keeping Z. Never keys. One
  undo group via `runSnippet(..., { undo: true })`. Returns the values before and after.
- **The tool's refusals first**, on its one fresh read (FR-015): comp not the lesson's
  (`NO_ACTIVE_COMP`), target not found by name, locked, 3D, collapsed, keys or expression on Anchor
  Point or Position, Rotation or Scale keys with `comp.time` more than half a frame from the rest
  key (`not_at_rest`). Then `runSnippet`, then `recordDemo`.
- **Twin** (`mentor/fixture/anchor-demo.mjs`): `run` returns the same result from the fixture
  snapshot; `apply` writes A′ and P′ into the layer's `transform` and **every** sample (Anchor
  Point and Position aren't keyed, so they're constant), and leaves `rect` alone.
- **Credit** (FR-016): the demo layer is `demo` while its anchor is within 0.01 px of the written
  A′, `undone` once a check sees otherwise (`markChecked(passed, { demoUndone: true })`), then the
  learner's.

## R7. The check: items 1 to 5, other changes, hints

- **Matching** (FR-019): by name when unique in **both** reads, else by index. A focus layer not
  found: `cant_check: [{ reason: "not_found" }]`.
- **Item 2:** `footprint(baseline, i, t)` vs `footprint(current, j, t)` at the check time `t`;
  passes when each of the four bounds edges moved ≤ 1 px (FR-028: 0.9 passes, 1.1 doesn't). The
  direction and size (`dx`, `dy` of the bounds' center, comp px) feed the hint only.
- **Item 3:** the current read's `comp.time` within half a frame of the check time (`at_rest`),
  reported; the measures already run at the check time, so item 3 is what tells the mentor the
  pivot may have been set away from rest (TD § 7 rest row): `set_away_from_rest` is true when item
  2 fails at the check time **and** passes at the current read's time.
- **Item 4:** for a Position-keyed focus layer, item 2 at every baseline Position key time.
  (2026-10-26, D-4: a layer with Position keys at two or more times is `never`, so a lesson
  reaches item 4 only on a one-key layer; the function is unchanged and stays unit tested on
  three keys, spec FR-012.)
- **Item 5:** every other layer's footprint at every time sampled in both reads (children of a
  focus layer only at that layer's check time, `sourcesOf().children`), ≤ 1 px per edge; and no
  new Anchor Point keys on the focus.
- **Can't check** (FR-018, filter 6): any comp-space result with a `reason` (`not_sampled`,
  `three_d`, `auto_orient`, `no_rect`, `no_layer`, `no_layer_info`, and `singular` from any call
  that inverts) on a focus layer makes that layer `cant_check` and holds the pass. On another layer
  it drops that comparison from item 5 and lists it in `not_compared`, never "didn't move".
- **Other changes** (FR-019, filter 1), from `layer_info` for every layer, never
  `unexpectedChanges()`: `anchor_changed` on another layer (Pan Behind on the wrong one),
  `eye_changed`, `keys_added` on Anchor Point or Position anywhere, `layer_added`,
  `layer_removed`, `renamed` (same index and kind, new name, when no layer was added or removed).
- **Hints:** `hintCodes(result)` maps each TD § 7 row to exactly one field combination (data-model
  › Hint codes); the prompt words them. A unit test per row.
- **Pass:** every focus layer passes items 1, 2, 4 (when it applies) and 5, and none is
  `cant_check`. `markChecked` only when the comp matches.

## R8. Review mode

- **Decision:** `mode: "review"`: the session passes the record's past targets as `exclude`; the
  analyzer drops any layer with a `{ layer, property: "Anchor Point" }` in it, then proposes the
  top-ranked `default` candidate, preferring one with no Rotation or Scale keys (a sort key ahead
  of the rest for reviews only). None: `no_new_target`. The review's place comes later in
  `skill_options`, as in a lesson. `FINDERS["transform.anchor"].focus` returns the count of
  `default` candidates not in `exclude` (FR-003), 0 without `layer_info`. `review: true` after the
  review tests pass.

## R9. Fixtures

- **Decision:** `mentor/test/fixtures/anchor/` holds `README.md`, `answer-key.json`, `records/`,
  `synthetic/` (rows the spec allows: 1, 6, 8, 13 shy, 16 until L-4, 26, 27, the stopwatch case,
  the 70-key cap case, and the measure edges of FR-028), `stand-in/` (until the sitting) and the
  live captures. Stand-ins are built by `stand-in/build.mjs` from `mentor/dev/build-practice-comp-2b.jsx`
  and `build-overlaps-b.jsx`'s declared values, each marked `"synthetic": "stand-in for <file>"`.
  Where spec 004's own live captures exist (`mentor/test/fixtures/layer-info/practice2b.json`,
  `practice2b-anchor.json`, `overlaps.json`, after T133 and T135), the tests read them in place
  and prefer them over a stand-in (a `load.mjs` helper, as spec 010's).

## R10. Version

- **Decision:** Pan Behind (Y), A, P, R, S, Shift+P in the prompt; Quick Set Anchor never brought
  up (H-3; one or two plain sentences if asked, SC-005); Center Anchor Point in Layer Content only
  after L-3 and by menu path, marked `<!-- L-3 -->` until then; no crosshair snapping; Properties
  panel "you may also see it there". R0 is still read (`parseHost`) and returned.

## R11. The live sitting

- **Decision:** one sitting, after spec 004 T133 to T136 (the corner math's live check, T136, must
  pass before this skill's checks are trusted): L-1 to L-5, the captures (quickstart › 3), the desk
  block, and two first lessons (Door, unkeyed; Gauge or Pop, keyed) for SC-001 and SC-002. The
  review (SC-009) a day or more later.
