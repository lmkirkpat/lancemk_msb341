# Data model: Move a group with a null (spec 012)

**Status**: Draft, awaiting the builder's approval (2026-10-24). Shapes this skill adds; the
snapshot, `layer_info`, comp-space results, the motion-sources map and the session lesson (with
`skill_data`) are spec 004's [data-model.md](../004-ae-curriculum/data-model.md), linked, not
copied. Decisions are in [research.md](research.md).

## `skill_options` (model-supplied, plain data)

```json
{ "focus": ["Tile", "Caption", "Stamp"] }
```

| Field | Rule |
|---|---|
| `focus` | 2 to 4 layer names, each unique in the comp. The call that first gives it, or changes it, restarts the lesson with `fresh: true` (research R3). Absent: the analyzer proposes and sets no targets |

## `skill_data` (tool-written only, `setSkillData`; FR-007, FR-012)

```json
{ "null": { "name": "Group Null", "region": "center", "chain_on_purpose": false },
  "stored": { "anchor": [50, 50], "position": [960, 540], "scale": [100, 100], "rotation": 0,
              "time": 3, "from": "check" },
  "parented_seen": false }
```

| Field | Rule |
|---|---|
| `null.name` | Stored only once no other layer has it (FR-019, D-3) |
| `null.region` | One of the nine codes (spec 011's grid, on the group's bounds) or `slides_only`; from the check's input |
| `null.chain_on_purpose` | `true` once the learner said a still parent is on purpose (FR-009) |
| `stored` | The null's sampled transform at the before-read time; re-stored at each check and at the demo while `parented_seen` is false; `from` is `check` or `demo` |
| `parented_seen` | `true` from the first read where any focus layer's parent is the null; never back |

## Candidate (analyzer, per layer of `layer_info`; FR-004)

```json
{ "layer": "Tile", "index": 21, "bucket": "default", "reason": null, "class": "renders",
  "matte_pair": null, "bounds": { "left": 300, "top": 200, "right": 520, "bottom": 330 },
  "has_children": false }
```

| Field | Rule |
|---|---|
| `bucket` | `default`, `if_named` or `never` |
| `reason` | `null`, or one code: `hidden`, `full_frame`, `adjustment`, `parented`, `null`, `guide`, `camera`, `light`, `three_d`, `auto_orient`, `samples_truncated`, `name_not_unique`, `cant_read` |
| `matte_pair` | The other layer's name for a matte or matted layer, else `null` |
| `bounds` | Comp-space bounds at the before-read time, or `null` with `cant_read` |

## Analyzer result (adds to spec 004's)

| Field | Rule |
|---|---|
| `candidates` | Every layer's entry above |
| `proposal` | Up to 4 names (research R2), or `null`; `no_comp_size` when `comp.width` is absent (SR-4) |
| `left_out` | `[{ layer, reason }]`, one sentence's worth each |
| `rename_needed` | Focus names another layer shares; no focus is set while it's non-empty |
| `focus` | The focus names, or `null` |
| `targets` | `parent/<name>` per focus layer |
| `target_refs` | `[{ layer, property: "Parent" }]`, one per target |
| `demo_target` | Research R7, or `null` |
| `no_demo_reason` | `null`, `no_qualifying_layer`, `review`, `no_new_target`, `awaiting_focus` |
| `before_time` | The baseline's `comp.time` |
| `p2_times` | `{ <layer>: [times] }` (research R4) |
| `notes` | `[{ layer, note }]`: `brings_children`, `matte_pair`, `shy` |

## Check input (`null_parent_check`)

`{ "null"?: name, "region"?: code | "slides_only", "chain_on_purpose"?: true }`, all optional, each
the learner's own answer in the conversation. The tool stores them in `skill_data`.

## Check result (`null_parent_check`; FR-019)

```json
{ "comp_matches": true, "stage": "parenting", "parenting_passed": false, "passed": false,
  "null": { "name": "Group Null", "found": true, "name_unique": true, "n1": true, "n2": true,
            "n3": { "applies": true, "passed": false, "region_now": "top-left", "wanted": "center" },
            "p4": null, "p5": null, "moves": [], "renamed_from": null, "stored_now": true },
  "layers": [ { "layer": "Stamp", "credit": "learner", "parent": null,
                "p1": false, "p2": { "passed": false, "worst_px": 120, "direction": "left", "time": 3.2 },
                "not_checked": [], "p3": { "passed": true, "before": {...}, "now": {...} } } ],
  "codes": ["visible_parent"], "comments": [], "other_changes": [] }
```

| Field | Rule |
|---|---|
| `stage` | `parenting` until `parenting_passed`, then `move` |
| `null.found` | `false` with `which_null: [names]` when several new nulls and none named |
| `null.name_unique` | `false` → `codes: ["null_name_not_unique"]`, nothing stored, N1 to N3 and P1 to P3 not run |
| `null.n2` | `true`, `false`, or `"moves"` (out of the lesson: `codes: ["null_parent_moves"]`, nothing graded, no `markChecked`) |
| `null.p4` | `null` at stage `parenting`; else `{ passed, on: [properties], anchor_only }` |
| `null.p5` | `null` unless the move includes Scale or Rotation; else `{ passed, region_needed }` |
| `layers[].p2.direction` | `left`, `right`, `up`, `down` or a pair, from the worst corner's delta |
| `layers[].not_checked` | `[{ time, reason }]`; any entry fails P2 ("couldn't check") |
| `codes` | One per TD § 7 row and § 14 answer: `visible_parent`, `jumped`, `pickwhip_position`, `wrong_parent`, `opacity_move`, `no_move`, `one_key`, `pivot_region`, `region_needed`, `null_has_parent`, `one_level_only`, `null_parent_moves`, `null_name_not_unique`, `which_null`, `null_renamed`, `anchor_only`, `not_found`, `cant_check` |
| `comments` | Research R8's codes; graded never |
| `other_changes[].kind` | `parented_to_null`, `parent_changed`, `keys_changed`, `expression_toggled`, `layer_added`, `layer_removed`, `children_brought` |

## Demo (`null_parent_demo`; FR-017)

Args to `null-parent-demo.jsx`: `{ comp_id, layer_index, layer_name, null_index, null_name }`.
Result: `{ layer, null, moved_px, jumped, undo: "Edit > Undo" }`. Refusal reasons
(`NULL_PARENT_REFUSED`): `null_not_ready`, `not_found`, `null_fails_n1`, `null_fails_n2`,
`already_parented`, `locked`, `three_d`, `null_scale_zero`.

## Record (FR-025)

No new fields: targets come from `target_refs` (`{ layer, property: "Parent" }`).
