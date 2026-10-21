# Research: skill 3, offset (spec 010)

**Status**: Draft, awaiting the builder's approval. Phase 0 of [plan.md](plan.md). The timing
analysis is spec 004's ([research.md](../004-ae-curriculum/research.md) R11,
[data-model.md](../004-ae-curriculum/data-model.md) › Timing measures, tasks T040, T058, T059).

## R1. The floor, in frames (FR-008, FR-023; spec 004 FR-027)

- **Decision:** `floorFrames(fps) = max(2, fps / 15)`; `isSame(a, b, fps)` is
  `|a − b| × fps < floorFrames(fps) − 0.1`. The 0.1 frame (replacing the first draft's `1e-6`,
  2026-10-21, as built) allows for key times read to the millisecond: 0.967 s and 1.033 s at 30
  fps are exactly 2 frames apart but read as 1.98, and must not count as the same. At 30 fps the floor is 2 frames (1 apart is the same, 2
  isn't); at 60 fps it's 4 (3 the same, 4 not). The same function serves starts, landings, the demo
  refusal (FR-010), the stage 3 gap check (FR-007) and the rhythm sentence (FR-015). It's the only
  threshold in the skill's code.
- **Rationale:** comparing in frames avoids 2/30 vs 1/15 float ties; pairwise, as FR-008 says.

## R2. Forming groups (FR-004 to FR-006)

- **Decision:** from `timing(snapshot)`:
  - **Eligible layers:** `enabled`, not `is_null`, not `precomp`, `first_start` not null (FR-004).
  - **Layers kind:** `clusters(eligible layers' first_start events, floorSeconds)` from the shared
    `mentor/lib/timing.mjs`, then pairwise: a group is 2–5 layers all pairwise `isSame`; more than 5
    → the first 5 in layer order.
  - **Properties kind:** per eligible layer, for each non-excluded unit and each of its moves, a
    `{ unit, move_index, start, end }`. A group is 2+ units with one move each where every pair of
    members is `isSame` on start **and** on end. A unit joins through at most one move (the first
    that matches, in time order); the group remembers `move_index` (FR-005).
  - **Proposal (FR-006):** the kind with the larger largest group; a tie → properties; within a
    kind, the earlier start, then layer order. The other kind is offered when it has a group.
  - **Review (FR-020):** before forming groups, drop every unit whose `{layer, property}` is in
    `opts.exclude`; a group whose members are already pairwise not the same isn't a group.
- **Rationale:** the timing analysis gives the measures, the skill only applies FR-027 to them
  (FR-002). `clusters()` is the shared grouping; the pairwise pass makes FR-008's "no chaining" hold
  for groups too.
- **Check:** on Mentor Practice this proposes Title's Position (its first move), Scale and Opacity,
  and offers the layers kind (Bar and Glow at 0 s; Title and the Cursor at 0.5 s).

## R3. Target IDs and refs (FR-019, FR-020)

- **Decision:** layers kind: target ID `"layer/<layer index>"`, one per member; `target_refs` holds
  `{ layer, property }` for **every counted unit** of each member (separated Position as
  "Position"). Properties kind: target ID `"<layer index>/<unit>/<move_index>"`, one ref each.
  This plan's RQ-1 asks spec 004 to confirm several refs per target; the fallback is there too.

## R4. The learner's choices and the demo target (FR-007, FR-009)

- **Decision:** `skill_options = { kind, members, order, gap_frames, split }`, all optional:
  `kind` (`"layers"` or `"properties"`, the learner's pick), `members` (layer names, when they name
  the layers themselves), `order` (member labels in the learner's order), `gap_frames` (their gap
  converted to frames, a positive integer), `split` (layer names whose properties they want split).
  The prompt sends the whole object each time it changes. The analyzer sets `demo_target`:
  `null` with `awaiting_order` until `order` is set; `two_members` for a group of 2; `gap_under_floor`
  when `gap_frames` is under the floor; otherwise the second member in `order`, or the next one if
  it has an expression on a keyed property. Since the session re-derives `demo_target` from the
  baseline on each continued call until a demo has run, the call that sends `order` sets it.
- **Rationale:** FR-009 ties the demo to the order, which comes after the first look.

## R5. The demo write (FR-010)

- **Decision:** `offset-demo.jsx` takes `{ comp_id, layer_index, property_paths, shift_frames }`.
  Before any write it checks: the comp is the lesson's; the layer isn't `locked`; `shift_frames` is
  a whole number ≥ 1 and not under the floor at `comp.frameRate`; no shifted key would land after
  `comp.duration`. Then for each property, from its **last key to its first** (so a moved key never
  lands on one not yet moved), it reads the key's time, value, in and out interpolation types,
  in and out temporal ease, temporal continuous and auto-bezier, and for spatial properties the in
  and out spatial tangents, spatial continuous and auto-bezier and roving; adds a key at
  `time + shift_frames / frameRate`; sets every attribute; and removes the old key. It verifies the
  new times and returns what moved. Run with `undo: true` (one undo step). Layers kind:
  `property_paths` is every keyed property on the layer (effects, both separated dimensions, single
  keys); properties kind: the demo property's paths. Before calling, the tool takes **one fresh
  read** (not the lesson's baseline), refuses if the active comp isn't the lesson's, matches the
  demo layer by name in that read, and repeats the refusals (whole frames, floor, lock where the
  read shows it, comp end) on it, so a refusal usually never reaches AE and a layer moved in the
  stack or keys the learner already pushed are seen as they are now (2026-10-21, as built).
- **Rationale:** ExtendScript has no "move key"; re-creating keys is the only fixed way. Last to
  first is collision-free for a later shift. Locked layers aren't in the snapshot until R1, so the
  snippet reads `layer.locked` itself.
- **Check live:** L-2 (attributes kept, one undo), L-4 (locked layer refuses, nothing changed).

## R6. The check (FR-008, FR-011, FR-012, FR-014, FR-015)

- **Decision:** layers are matched baseline to now by name when names are unique in the comp, else
  by index (FR-012, row 17). Per member, start and landing before and now from `timing()` on each
  snapshot (properties kind: the remembered `move_index`; if that unit's move count changed, the
  member is `keys_changed` and not graded; layers kind: `keys_changed` when the layer has no start
  now). A `keys_changed` member holds the pass: `passed` is false while any member is
  `keys_changed`, and the mentor asks if the change was on purpose (spec 008 FR-014's rule; the
  builder's decision 2026-10-21, replacing "at least 2 graded members pass anyway"). The "pops in" split is looked
  for in every layer where **any** counted property (or dimension) moved, not only where the
  layer's start moved (FR-008). Pass per FR-008, with `split` (stored plus the check's
  `split` input, union) exempting a layer from L2. Demo credit: the demo member is `demo` while its
  start is within half a frame of baseline + gap, `undone` when back at the baseline (then
  `markChecked(passed, { demoUndone: true })`), else the learner's. Order: if the new start order
  differs from `order`, `order_differs: true` (asked, never a fail). Out-of-comp keys from raw keys
  (FR-014); a landing after the comp's end doesn't count as a landing. Rhythm (FR-015): after a pass
  with 3+ layers, `uneven: true` when largest minus smallest consecutive gap ≥ the floor.

## R7. Raw-key reads (FR-013, overlap row 7)

- **Decision:** `mentor/lib/offset-keys.mjs` compares every keyed property of the two snapshots by
  layer (as R6) and path: key count, key times, expression on or off, newly animated or no longer
  animated, a single key moved, and a pause given a new value; it lists those outside the group as
  other changes. It also gives per-property and per-dimension first-key shifts (half-frame
  tolerance), so a layer whose X Position moved and Y didn't is a split within Position (row 7).
  It never uses `timing()`'s `excluded` to decide what changed, and doesn't use easing's
  `unexpectedChanges` (pair-keyed, filter 3).

## R8. Fixtures (FR-022)

- **Decision:** as spec 008 research R8 (stand-ins in `stand-in/`, replaced by live captures and
  deleted), with one difference: rows 5, 18 and 19 have no live case and stay **synthetic** in
  `mentor/test/fixtures/offset/synthetic/`, each marked, as the spec allows. Spec 004's
  `practice2-before.json` and `practice2-60fps.json` are used as they are (live).

## R9. One sitting

- **Decision:** quickstart › 2–5: L-1 to L-4 first (L-1 decides Quick Offset's wording; L-2 and L-4
  the snippet), then captures on duplicates, a desk block, then the properties-kind lesson on Mentor
  Practice and the layers-kind lesson on Mentor Practice 2 (SC-001 asks for both), in a plain Claude
  Code session. The review (SC-006) is a day or more later.
