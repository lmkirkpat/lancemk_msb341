# Data model: Set the pivot (spec 011)

**Status**: Draft, awaiting the builder's approval (2026-10-24). Amended 2026-10-26 with the spec
(Changes 2026-10-26): `keyed.any` and the ranking, `outside_side`, `content_shifted` and
`unchanged_shape`, `shape_until_l1` retired. Round 2 (TD § 16, D-4): `position_moves`,
`keyed.position_times`, the time on `position_keyed_tip`, `item3.now`, and the hint codes
`in_place_moved` and `other_layer_moved` (built, now listed). Round 3 (TD § 17, B-8; spec
FR-008, FR-013a): `watch_offer`, the focus's needed times, and "never" first in `reason`. Round 4
(TD § 18, D-8, D-9, B-9): `moves_case`, `position_key_time` and `rest_time` on `position_moves`
entries, and `watch_offer` never full-frame. Round 5 (B-11): `position_key_label` and
`rest_label` on `one_key_off_rest` entries. Shapes this skill adds; the
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
  "keyed": { "anchor": false, "position": false, "rotation": false, "scale": false, "any": false,
             "position_times": [] },
  "pivot_as_placed": true, "full_frame": false, "place_now": "center", "outside_side": null }
```

| Field | Rule |
|---|---|
| `bucket` | `default`, `if_named` or `never` (FR-004) |
| `reason` | `null` for `default`; else one code, and a `never` code wins over an `if_named` one (a matte or locked layer that already moves is `position_moves`; spec FR-004 precedence) (`shape_until_l1` retired 2026-10-26, L-1): `position_moves` (`never`: Position keyed at two or more times, or at one time that isn't the check time; spec FR-004, D-4), `position_keyed` (`if_named`: one Position key time, on the check time), `hidden`, `matte`, `guide`, `locked`, `full_frame`, `anchor_keyed`, `expression_rotation_scale`, `expression_anchor_position`, `three_d`, `collapsed`, `null`, `camera`, `light`, `adjustment`, `cant_read` |
| `moves_case` | Only when `reason` is `position_moves` (round 4, spec FR-004, B-9): `two_or_more` (Position keyed at two or more key times) or `one_key_off_rest` (one key time, the rest key more than half a frame from it). The mentor picks TD § 4's Sled line or TD § 18's two-frames sentence from it and never counts keys itself |
| `position_key_time` | Only with `moves_case: "one_key_off_rest"`: the one Position key's time, in seconds (the same value as `keyed.position_times[0]`) |
| `rest_time` | Only with `moves_case: "one_key_off_rest"`: the time the Position rule compared against, in seconds: the learner's own `rest_time` when the focus entry gave one and it was used (FR-011), else the tool's rest key |
| `position_key_label` | Only with `moves_case: "one_key_off_rest"` (round 5, spec FR-004, B-11): `position_key_time` as the mentor says it, a string: seconds rounded to the nearest tenth (a half rounds up), a trailing ".0" dropped, a space, "s" ("1 s", "3.7 s"). If it would equal `rest_label`, both use the fewest decimals, up to three, at which they differ, trailing zeros dropped (3.667 and 3.7 → "3.67 s" and "3.7 s"). `null` exactly when `position_key_time` is `null`. The mentor says it as given and never formats a time itself |
| `rest_label` | Only with `moves_case: "one_key_off_rest"`: `rest_time` labelled by the same rule (the learner's 4.167 → "4.2 s"). `null` exactly when `rest_time` is `null`; with either label `null` the mentor says spec FR-004's short "already moves" line, no time |
| `rank` | 1 = first proposed, among `default` only (research R1's sort) |
| `keyed.position_times` | Position's key times in seconds, sorted, X and Y counted together when separated, hold keys included, times within half a frame merged (spec FR-004, D-4). Its length decides `position_moves` (2 or more) against `position_keyed` (1, on the check time) |
| `keyed.any` | Any property of the layer has keys in the snapshot's keyed `layers` (Opacity, effects, masks, text animators included). The ranking's first animation step (FR-004, 2026-10-26) |
| `full_frame` | `true` or `false` when the snapshot has `comp.width` and `comp.height` (SR-2); `null` before that |
| `place_now` | The place the anchor is in at the check time, `between` or `outside` |
| `outside_side` | Only when `place_now` is `outside`: `above`, `below`, `left`, `right` or a pair (`below-left`), the anchor's comp-space point against the layer's comp-space bounds at the check time (FR-019a); `null` when either can't be read |

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
| `needed_times` | Research R4's union (for the snapshot tool's second read). **After T252 (spec FR-013a, if T251's table says so):** with a focus, only each focus layer's check time and Position key times; with no focus, unused (one read) |
| `watch_offer` | `{ layer, suggested_place }` or `null` (spec FR-008, TD § 17, B-8). Set only in a lesson, with exactly one focus target and the demo unused: the highest-ranked `default` candidate (lesson ranking) that isn't the focus, isn't already at `suggested_place`, and has no Rotation or Scale keys or its rest key within half a frame of the focus's check time; never a `full_frame: true` layer (round 4, D-9; it's `if_named`, so never in the pool), with no extra filter on `full_frame: null`. `suggested_place` by `proposal`'s hinge rule (tall and thin `bottom-middle`, else `middle-left`). `null` in a review, with two focus layers, with no focus, once the demo is used, or when none qualifies. The record condition (no pass yet) and "once" are the prompt's |
| `notes` | `[{ layer, note }]`, each once: `parent` (with its name), `text_baseline`, `flipped`, `precomp_frame`, `position_keyed_tip` (with `time`, the one Position key's time, for TD § 4's "playhead right on it" line), `matte`, `hidden`, `shy`, `locked`, `pivot_outside` (with `side`, FR-019a; for a focus layer and for the proposal) |
| `focus_problems` | `[{ layer, problem, reason? }]`, problem `no_layer`, `name_not_unique`, `no_place`, `not_a_candidate` (with the candidate's `reason`) or `past_target`. A `not_a_candidate` entry with reason `position_moves` also carries `moves_case`, and for `one_key_off_rest` `position_key_time`, `rest_time`, `position_key_label` and `rest_label`, as the candidate entry (round 4; labels round 5) |
| `rest_time_not_a_key` | Present when a learner's `rest_time` was ignored |

## Check result (`anchor_check`; FR-019)

```json
{ "comp_matches": true, "passed": false,
  "layers": [ {
    "layer": "Door", "credit": "learner",
    "item1": { "passed": false, "place_now": "center", "wanted": "middle-left", "outside_side": null },
    "item2": { "passed": false, "edges_px": { "left": 150, "top": 0, "right": 150, "bottom": 0 },
               "direction": "right", "distance_px": 150 },
    "item3": { "now": 0, "at_rest": true, "set_away_from_rest": false },
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
| `item3.now` | The check read's own `comp.time` (where the playhead was at "done"), for the `away_from_rest` line (spec FR-019, round 2) |
| `item3.set_away_from_rest` | `true` when item 2 fails at the check time and holds at the check read's own `comp.time`; `null` when the baseline has no sample at that time |
| `item4` | `null` unless the focus layer has Position keys; else `{ passed, worst: { time, dx, dy } }` |
| `item5.not_compared` | `[{ layer, time, reason }]` for comparisons dropped for a comp-space reason; never read as "didn't move" |
| `item1.outside_side` | As the candidate's `outside_side`, from the check read (FR-019a) |
| `rect_shifted` | Anchor unchanged and `rect` moved in own space: what's drawn moved inside the layer (text justification, an edited path, a group's own Position). **Not** a group's pivot moved with Pan Behind, which changes nothing the read holds (L-1, FR-019b) |
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
| `in_place_moved` | not `away_from_rest`, item 1 passes, item 2 fails, and none of `moved_with_pivot`, `layer_dragged` or `content_shifted` fits (in practice anchor and Position both changed: TD § 7's "in place but moved" row) |
| `other_layer_moved` | no `wrong_layer`, items 1, 2 and 4 pass, and `item5.moved_layers` isn't empty (TD § 7's "another layer moved" row; its direction from `moved_layers`) |
| `content_shifted` | `rect_shifted` and item 2 fails (renamed from `group_anchor` 2026-10-26, FR-019b) |
| `unchanged_shape` | focus `kind` is `shape`, not passed, `!anchor_changed` and `!position_changed`, item 2 holds, and no `wrong_layer`; added after the place hint (FR-019b, 2026-10-26) |
| `away_from_rest` | `item3.set_away_from_rest` |
| `slid_at_key` | item 4 fails and item 2 passes. Since D-4 a lesson reaches it only on a one-key layer dragged off its key (`sled-one-key`) |
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
