# Data model: Expression and precomp reads (spec 015)

Shapes, not code. Field names are internal: no reply may show one to the learner (ae-mentor rule 5).
"Not read" is always explicit (FR-018): a missing field on an old snapshot reads as
`{ status: "not_read", reason: "older_snapshot" }`, never as empty.

## 1. Raw snapshot additions (`snapshot.jsx`, phase 1)

Additive only. `layers`, `precomp_layers` and every existing `layer_info` field keep their shape.

### `expressions` (top level): one entry per property with a non-empty expression

| Field | Type | Notes |
|---|---|---|
| `layer` | int | layer index |
| `path` | string | match-name path, as `layers[].properties[].path` |
| `display_path` | string | e.g. `Effects › CC Light Sweep › Center` |
| `group` | `transform` \| `effect` \| `text` \| `mask` \| `shape` \| `other` | from the path's root |
| `keys` | int | `numKeys` |
| `enabled` | bool | `expressionEnabled` |
| `active` | bool | `enabled` and no `error` (T001: AE 27.0 keeps an erroring expression on, at the base value). Only the in-use side of a separable Position is walked (`inUse`, as today), since the hidden half holds stale values (FR-006a); separating or joining clears the expression (T003) |
| `error` | string \| null | `expressionError`, trimmed to 300 characters |
| `text` | string | up to 20,000 characters (research R2) |
| `text_length` | int | full length |
| `text_cut` | bool | |

`expressions_read`: `"all"` when the walk finished with every property read; `{ status: "partial",
reason, skipped: int }` when one or more properties threw while being read (the rest are kept, and
the read is never called complete, FR-018); `{ status: "not_read", reason }` when the walk itself
threw.

### `layer_info[].effects`

`[{ name, match_name }]` for every effect on the layer, keyed or not (FR-007). Effect names can be
renamed by the learner, so they go to the model only and never into the record (FR-020).

### `layer_info[].samples[].base`

Present only on layers with an active, error-free transform expression. Holds only the properties
with one: `{ position?, anchor?, scale?, rotation?, opacity? }`, each read before the expression at the
sample's exact time.

### `expression_sweeps` (top level)

| Field | Notes |
|---|---|
| `layer`, `path` | which property |
| `kind` | `coarse` (24 times, always, every active transform expression) or `fine` (`measure_layers` only) |
| `sampled_every` | seconds |
| `varies` | bool: the result changed by more than the tolerance across the sweep |
| `status` | present only when the sweep didn't run: `{ status: "not_read", reason: "budget" }` for coarse sweeps past the snippet's time or count budget (the plan's number), so `varies` is unknown, never false |
| `max_offset` | largest distance from base, in the property's units |
| `max_at` | time of that peak |
| `max_value` | *Added 2026-11-16 (FR-004a, research R15), fine sweeps only:* the after-expression value the sweep read at `max_at`. Absent on older snapshots, which is `direction_unknown` where FR-004a needs a direction, never a guess |

## 2. Derived (Node, `mentor/lib/expressions.mjs`)

### Expression read (spec: Key Entities)

`{ layer_index, layer, property, display_path, group, keys, on, active, error, builds_on:
"builds_on" | "sets_own" | "cant_tell", builds_on_inferred: true, moves: { varies, max_offset, max_at,
units, sampled_every } | { status: "not_read", reason }, refs: [Reference] }`

`is_source` = `active` (on and no error). Only sources count in the motion-sources map (FR-006).

### Reference (out of one expression)

`{ how: "name" | "index" | "index_offset" | "this_layer" | "parent" | "unresolved" | "other_comp",
target_index | null, target_name | null, property | null, shared_name: bool, inferred: true }`

### Link (into a layer) = a resolved reference seen from its target

`{ from_layer_index, from_layer, from_property, property | null, how, shared_name, inferred: true,
from_renders: { renders: bool | null, why: "eye_off" | "guide" | "matte_renders" | "null" |
"soloed_elsewhere" | "outside_in_out" | "renders" | "not_read", at_time } }`. `from_renders` is the
**from layer's** state (the layer holding the expression, which the link drives), using spec 004
FR-013's class plus in and out at the comp's current time (FR-011). In a summary's `links_in.first`
it's the bool `renders` only; detail carries the whole object.

*Renamed 2026-11-17 (spec 014 T037 fix (l)):* was `target_renders`. The value never changed (it was
always the from layer's), but "target" read as the linked layer: on Comp 1, Sweep Control (a null,
which never renders) instead of Black Solid 1 (eye off). FR-011's "target" is this from layer.

Per layer: `links_in: { status: "read", links: [Link], unresolved_in_comp: int }`. "No links" is said
only when `links` is empty and `unresolved_in_comp` is 0.

## 3. Motion-sources map changes (`motion-sources.mjs`, FR-005)

- `read.expressions`: `"keyed_only"` → `"all"` when the snapshot has `expressions`; else stays
  `"keyed_only"` (older snapshot).
- Per layer `expressions`: `{ status: "read", list: [Expression read] }` (was `not_read` with
  `on_keyed`). `on_keyed` stays for old snapshots.
- Per parent: `moves_children: bool` plus `moves_by: "keys" | "expression" | "both" | null`.
- `static_as_read`: on snapshots with the new expression fields, true only when own keys, own source
  expressions and parents are all empty. On **older snapshots it keeps its old meaning** (no own keys
  and no parents), because expressions weren't read there. Nothing in production reads it today
  (review, T031); a consumer that needs "static" must check `read.expressions` too.

## 4. `motion_from` (pivot and null snapshot tools, FR-015)

On each focus or candidate layer those tools already return, **only when the snapshot has the new
expression fields**:
`{ own_keys: bool, own_expressions: [property], parents: [{ layer, by: "keys" | "expression" | "both" }] }`.
On an older snapshot (every eval fixture captured before phase 1) the field is **absent**, not
`not_read`, so those tool replies are byte-identical to before. The eval gate covers the field
through cases on new captures (eval-engineer, T035).

## 5. Check changes (K2, FR-012 to FR-014)

- Other-change entries attributed to the learner need a difference at a **same-frame** time (see
  research R7) on a non-expression value or on `base`.
- A real change outside the focus is one entry per changed property on that layer (Anchor Point,
  Position, Scale, Rotation, parent, expression), with `effect` for the footprint shift it caused. No
  separate moved entry for that layer (FR-014a). `effect` is:
  - **omitted** when nothing visibly moved;
  - `{ distance_px, direction, time }` when the footprint shift was measured;
  - `{ distance_px: null, direction: null, reason }` when the footprint can't be read (a null, a layer
    with no bounds). Pivot and null use the same shape.
- **Offset, key types and speed graph** list changes to unkeyed properties outside their focus too,
  compared on `base` at a same-frame time, through one shared helper, `mentor/lib/k2-changes.mjs`
  (review, T031). Keyed changes stay with each skill's own comparison.
- A layer whose index changed is matched by the existing renumber matching and compared on `base`
  (FR-013a).
- New kind `expression_changed`: `{ layer, property, what: "turned_on" | "turned_off" | "text" | "error" }`.
- Layers with no shared time: in the check's existing `not_compared` list, never in moved lists.

## 6. Reply shapes (`describe_layers`, FR-016)

See [contracts/describe-layers.md](contracts/describe-layers.md). Summary per layer: `layer_index`,
`layer`, `kind`, `class`, `parents` (with `moves_by`), `children` count, `effects` (names),
`expressions` (property, on, error flag, builds_on, moves), `links_in` count and first three,
`refs_out` count, `precomp` (phase 2 summary or `not_read`), `read` statuses. Detail adds each
expression's `text` (cut at 1,500), `error`, every link, and every reference.

**Footprint shift (FR-004a, added 2026-11-16).** On each layer named in `layers`, summary and detail:
`shifts: [{ from_layer_index, from_layer, property, shift_px, at, sampled_every, sampled: true,
measured_on: "box" } | { from_layer_index, from_layer, property, shift_px: null, reason }]`, one per
active parent-chain transform expression that moves the layer (Opacity excluded). `shift_px` is
rounded to 0.01 px. `reason` is one of `three_d`, `auto_orient`, `no_rect`, `not_sampled`,
`no_fine_sweep`, `chain_moves`, `direction_unknown`, `singular`, and (*added 2026-11-16, spec
Amendment 9*) `switch_not_read`: a 3D or Auto-Orient switch in the chain read as anything but true or
false, never taken as off. `chain_moves` also covers a named text or shape layer whose box changes over
time, and `direction_unknown` a Rotation source under non-uniform scale (research R15). An empty list means the layer has no
such parent expression, and is only given when the motion-sources map read expressions (`read.expressions`
is `"all"`); otherwise `shifts` is `{ status: "not_read", reason: "older_snapshot" }`. Layers not
named get no `shifts`, and the reply's `read.shifts` is `"read"` or `{ status: "not_read", reason:
"not_asked" }`. Computed by `mentor/lib/footprint-shift.mjs` (research R15).

**Own keys and switches (FR-004b, added 2026-11-16, Amendment 7).** From the snapshot the tool already
takes; nothing new is read.

- `own_keys`: `[{ property, keys, key_types, expression_on? }]`, one per property in the snapshot's
  `layers[].properties` for that layer, in snapshot order. `property` is the display name (as in
  `expressions`); detail adds `display_path`. `key_types` is one of:
  - `single_key`: one key (set, not animated; `analyze.mjs`'s existing skip reason);
  - `all_held`: two or more keys and every pair snaps;
  - `none_held`: two or more keys and no pair snaps;
  - `some_held`: two or more keys, some pairs snap and some don't.

  A pair snaps when the first key's `out_type` or the second key's `in_type` is `hold` (key types'
  `snaps`, L-1; reused, not copied). `expression_on: true` is present only when the property's
  expression is on (the snapshot's `expression_enabled`). Summary: at most 8 entries, then
  `own_keys_more: n` when there are more. Detail: every entry.
- `locked`, `three_d`: booleans from `layer_info`. `collapse`: boolean, on `precomp` and `footage`
  layers only (spec OQ-12). A switch the snapshot read as `null` is `{ status: "not_read", reason:
  "error" }`; with no `layer_info`, `switches: { status: "not_read", reason: "older_snapshot" }` replaces
  all three.
- **Named layers** (in `layers`, summary or detail): `own_keys` always present (`[]` when none), and
  every switch that applies to the kind, `false` included.
- **Whole-comp summary** (no `layers`): `own_keys` only when non-empty, and a switch only when `true`
  (or not read). The reply's `read` block gains `own_keys: "read"` and `switches: "read" | not_read`,
  which say that a layer without them has no keys and those switches off.

## 7. Phase 2: comp contents (`precomp-contents.jsx` + `precomp-time.mjs`)

### Comp contents (keyed by `comp_id`)

`{ comp_id, name, duration, frame_rate, width, height, places_used (layers, not comps; FR-023), depth, layers: [{ index, name,
kind, parent, enabled, in_point, out_point, start_time, stretch, time_remap, source_comp_id | null,
keyed: [{ path, display_name, keys, times }], expressions: [as § 1] }], status: "read" | { status:
"not_read", reason: "too_deep" | "loop" | "error" } }`

### Time mapping (per precomp layer, outer to inner)

`{ outer_layer, source_comp_id, start_time, stretch, remap: null | { every_frame: [inner times],
cut: bool }, shown: [lower, upper) }`, where lower and upper are the in and out points in either order
(a negative stretch reports in after out; FR-025). Derived per inner key: `{ inner_time, outer:
[{ first, last, frames }], shows: bool }`: a single time is a range with `frames: 1`, and a held remap
gives a longer one (FR-024). A key on `upper` doesn't show. Nested layers compound mappings from the inside out.

### Precomp summary (FR-027)

Per precomp layer: `comp_id`, `name`, `inner_layers`, `keyed_properties`, `expression_properties`,
`key_span_outer: [first, last] | null`, `keys_never_shown`, `places_used`, `status`.
