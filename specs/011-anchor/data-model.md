# Data model: Set the pivot (spec 011)

**Status**: Draft, awaiting the builder's approval (2026-10-24). Shapes this skill adds; the
snapshot, `layer_info`, comp-space results and the session lesson are spec 004's
[data-model.md](../004-ae-curriculum/data-model.md) › Wave B shapes and › Session lesson, linked,
not copied. Decisions are in [research.md](research.md).

## `skill_options` (model-supplied, plain data; FR-005, FR-008, FR-011)

```json
{ "focus": [ { "layer": "Door", "place": "middle-left" },
             { "layer": "Gauge", "place": "bottom-middle", "rest_time": 0 } ] }
```

| Field | Rule |
|---|---|
| `focus` | One or two entries. Entry 0 is the learner's layer; entry 1 the one they care less about (the demo candidate, FR-014). Absent: the analyzer proposes and sets no targets |
| `layer` | A layer name, unique in the baseline. A duplicate gives `name_not_unique` and no target |
| `place` | One of the nine codes (research R2). Off-grid places are mapped by asking the learner, never by the tool |
| `rest_time` | Optional: the learner's own rest pose, in seconds. Used only when it's a key time of that layer's Rotation or Scale |

## Candidate (analyzer, per layer of `layer_info`; FR-004)

```json
{ "layer": "Door", "index": 7, "bucket": "default", "reason": null, "rank": 1,
  "class": "renders", "kind": "solid", "parent": null, "has_children": false,
  "keyed": { "anchor": false, "position": false, "rotation": false, "scale": false },
  "pivot_as_placed": true, "full_frame": false, "place_now": "center" }
```

| Field | Rule |
|---|---|
| `bucket` | `default`, `if_named` or `never` (FR-004) |
| `reason` | `null` for `default`; else one code: `shape_until_l1`, `position_keyed`, `hidden`, `matte`, `guide`, `locked`, `full_frame`, `anchor_keyed`, `expression_rotation_scale`, `expression_anchor_position`, `three_d`, `collapsed`, `null`, `camera`, `light`, `adjustment`, `cant_read` |
| `rank` | 1 = first proposed, among `default` only (research R1's sort) |
| `place_now` | The place the anchor is in at the check time, `between` or `outside` |

## Analyzer result (adds to spec 004's)

| Field | Rule |
|---|---|
| `candidates` | Every layer's entry above |
| `proposal` | The rank-1 `default` candidate (review: the first with no Rotation or Scale keys, if any), or `null` |
| `focus` | The resolved focus layer names, or `null` |
| `places` | `{ <layer>: { place, point: [x, y] } }`, own space at the check time |
| `check_times` | `{ <layer>: { time, basis } }`, basis `both`, `scale`, `closest_rotation`, `learner` or `current` |
| `already_there` | `[{ layer, place }]`: not targets (FR-007) |
| `targets` | `anchor/<baseline index>` per focus layer not already there |
| `target_refs` | `[{ layer, property: "Anchor Point" }]`, one per target |
| `demo_target` | Per research R5, or `null` |
| `no_demo_reason` | `null`, `single_target` (the session's), `not_a_default_candidate`, `review`, `no_new_target`, `awaiting_focus` |
| `needed_times` | Research R4's union (for the snapshot tool's second read) |
| `notes` | `[{ layer, note }]`, each once: `parent` (with its name), `text_baseline`, `flipped`, `precomp_frame`, `position_keyed_tip`, `matte` |
| `rest_time_not_a_key` | Present when a learner's `rest_time` was ignored |

## Check result (`anchor_check`; FR-019)

```json
{ "comp_matches": true, "passed": false,
  "layers": [ {
    "layer": "Door", "credit": "learner",
    "item1": { "passed": false, "place_now": "center", "wanted": "middle-left" },
    "item2": { "passed": false, "edges_px": { "left": 150, "top": 0, "right": 150, "bottom": 0 },
               "direction": "right", "distance_px": 150 },
    "item3": { "at_rest": true, "set_away_from_rest": false },
    "item4": null,
    "item5": { "passed": true, "moved_layers": [], "anchor_keys_added": false, "not_compared": [] },
    "anchor_changed": true, "position_changed": false, "rect_shifted": false, "locked": false,
    "cant_check": [], "hints": ["moved_with_pivot"] } ],
  "other_changes": [ { "kind": "anchor_changed", "layer": "Background" } ] }
```

| Field | Rule |
|---|---|
| `credit` | `demo`, `undone` or `learner` (FR-016) |
| `item2.direction` | `left`, `right`, `up`, `down` or a pair (`down-right`), from the bounds' center; hint only |
| `item3.set_away_from_rest` | `true` when item 2 fails at the check time and holds at the check read's own `comp.time`; `null` when the baseline has no sample at that time |
| `item4` | `null` unless the focus layer has Position keys; else `{ passed, worst: { time, dx, dy } }` |
| `item5.not_compared` | `[{ layer, time, reason }]` for comparisons dropped for a comp-space reason; never read as "didn't move" |
| `rect_shifted` | Anchor unchanged and `rect` moved in own space (a shape group's anchor) |
| `cant_check` | `[{ what, reason }]`; any entry holds the pass (FR-018) |
| `other_changes[].kind` | `anchor_changed`, `eye_changed`, `keys_added`, `layer_added`, `layer_removed`, `renamed` |

## Hint codes (one per TD § 7 row; FR-019)

| Code | When (on one focus layer) |
|---|---|
| `moved_with_pivot` | `anchor_changed` and `!position_changed` and item 2 fails |
| `layer_dragged` | `position_changed` and `!anchor_changed` and item 2 fails |
| `not_moved_enough` | item 2 passes, item 1 fails, `place_now` is `center` or `between` and the wanted place isn't `center` |
| `neighbour_place` | item 2 passes, item 1 fails, `place_now` is another of the nine |
| `outside` | item 1 fails with `place_now: "outside"` |
| `wrong_layer` | `!anchor_changed` on the focus and an `anchor_changed` other change |
| `group_anchor` | `rect_shifted` and item 2 fails |
| `away_from_rest` | `item3.set_away_from_rest` |
| `slid_at_key` | item 4 fails and item 2 passes |
| `stopwatch` | `item5.anchor_keys_added` |
| `matte_eye` | an `eye_changed` other change on a layer of class `matte` in the baseline |
| `locked` | `locked` at "done" |
| `cant_check` | `cant_check` not empty (said instead of any other hint for that layer) |

## Demo (`anchor_demo`; FR-015)

Args to `anchor-demo.jsx`: `{ comp_id, layer_index, layer_name, anchor: [x, y], position: [x, y] }`
(values from `demoValues()`, research R6). Result: `{ layer, place, anchor_before, anchor_after,
position_before, position_after, separated, undo: "Edit > Undo" }`. Refusal reasons
(`ANCHOR_REFUSED`): `locked`, `three_d`, `collapsed`, `anchor_or_position_keyed`, `expression`,
`not_at_rest`, `not_found`.

## Record (FR-025)

No new fields: targets come from `target_refs`. The prompt writes `attempted`, `summary` and `next`
in plain words.
