# Data model: Move a group with a null (spec 012)

**Status**: Approved 2026-10-24 with the plan. **Amendment 1 (2026-10-25), awaiting approval:**
the L-6 proposal rule (spec FR-005, FR-005a; TD § 15) and the review's S6 gaps, which branch
`skill-6-null` already builds (5c9de8c): this file now names what that code returns. Shapes this skill adds; the
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
{ "null": { "name": "Group Null", "region": "center", "parent_asked": null,
            "chain_on_purpose": null, "one_level_said": false, "existing_said": false },
  "stored": { "anchor": [0, 0], "position": [960, 540], "scale": [100, 100], "rotation": 0,
              "time": 3, "from": "check" },
  "parented_seen": false, "children_named": [] }
```

The example's `stored.anchor` is `[0, 0]`, AE 26.5's default for a new null (its square's top-left,
on its Position; spec › L-1, amended 2026-10-26 from the live sitting; it was `[50, 50]`).

| Field | Rule |
|---|---|
| `null.name` | Stored only once no other layer has it (FR-019, D-3) |
| `null.region` | One of the nine codes (spec 011's grid, on the group's bounds) or `slides_only`; from the check's input |
| `null.parent_asked` | The parent's name at the last check that gave `null_has_parent` (FR-009, S5) |
| `null.chain_on_purpose` | The parent's name, set only when the check input says `chain_on_purpose: true` **and** `parent_asked` is that same parent (S5); `null` otherwise. N2 passes on it only while the null's parent is still that layer |
| `null.one_level_said`, `null.existing_said` | `one_level_only` and `existing_null` are said once each |
| `stored` | The null's sampled transform at the before-read time; re-stored at each check and at the demo while `parented_seen` is false; and, when nothing is stored yet, stored at the first check that sees the null passing N1 and N2 even if focus layers are already parented (FR-012, S6). `from` is `check` or `demo` |
| `children_named` | Focus layers whose `children_brought` other change was already named (FR-021, once) |
| `parented_seen` | `true` from the first read where any focus layer's parent is the null; never back |

## Candidate (analyzer, per layer of `layer_info`; FR-004)

```json
{ "layer": "Tile", "index": 21, "kind": "shape", "bucket": "default", "reason": null,
  "class": "renders", "matte_pair": null,
  "bounds": { "left": 300, "top": 200, "right": 520, "bottom": 330 },
  "has_children": false, "children": [] }
```

| Field | Rule |
|---|---|
| `kind` | The layer's `layer_info.kind` (spec 004 data-model: `null`, `text`, `shape`, `camera`, `light`, `adjustment`, `precomp`, `solid`, `footage`); FR-005's rank (a) reads `text` (added 2026-10-25) |
| `bucket` | `default`, `if_named` or `never` |
| `reason` | `null`, or one code: `hidden`, `full_frame`, `adjustment`, `parented`, `null`, `guide`, `camera`, `light`, `three_d`, `auto_orient`, `samples_truncated`, `name_not_unique`, `cant_read` |
| `matte_pair` | The other layer's name for a matte or matted layer, else `null` |
| `bounds` | Comp-space bounds at the before-read time, or `null` with `cant_read` |
| `children`, `parent`, `parent_is_null` | The layer's children's names; for a `parented` layer, its parent and whether that's a null (TD § 4's sentences) |

A crowd's layers keep `reason: null` and bucket `default`: they're candidates the learner may
name, never `left_out` (TD § 4).

## Analyzer result (adds to spec 004's)

| Field | Rule |
|---|---|
| `candidates` | Every layer's entry above |
| `proposal` | The first-ranked group's names in stack order (FR-005, research R2), 2 to 4, or `null` |
| `next_proposal` | The second-ranked group's names, or `null` (one group, or none). Kept for a "no" in a lesson (FR-005a); a review never uses it (FR-024). Added 2026-10-25 |
| `no_proposal_reason` | `null` with a proposal; else `crowded` (no group, at least one crowd of 5 or more), `no_group` (nothing links into a cluster of 2 or more), `no_comp_size` (`comp.width` absent, SR-4) or `no_layer_info`. `crowded` added 2026-10-25 |
| `left_out` | `[{ layer, reason, parent?, parent_is_null? }]`, one sentence's worth each; never a crowd's layers |
| `rename_needed` | Focus names another layer shares; no focus is set while it's non-empty |
| `duplicate_names` | Every candidate name another layer shares (`name_not_unique`), for the rename ask before a focus is agreed (FR-004) |
| `matte_added` | Matte partners the tool added to a learner-named focus (FR-004: the pair goes in together), so the mentor says so |
| `focus` | The focus names, or `null` |
| `targets` | `parent/<name>` per focus layer |
| `target_refs` | `[{ layer, property: "Parent" }]`, one per target |
| `demo_target` | Research R7: skips mattes, eye-off, 3D, **locked** layers (S6) and a keyed move with an expression; or `null` |
| `no_demo_reason` | `null`, `no_qualifying_layer`, `review`, `no_new_target`, `awaiting_focus`, `no_layer_info` |
| `before_time` | The baseline's `comp.time` |
| `p2_times` | `{ <layer>: [times] }` (research R4) |
| `notes` | `[{ layer, note }]`: `brings_children` (with `children`), `matte_pair` (with `with`), `shy`, `precomp` |

The clusters themselves (crowds included) are internal: no reply lists a crowd's layers (TD § 4
step 5). The finder (FR-003) reads the largest crowd's size from the same function.

## Snapshot reply (`null_parent_snapshot`; contract)

| Field | Rule |
|---|---|
| `can_teach` | `false` with `why: "no_layer_info"` when the read has no `layer_info`; nothing started. Absent otherwise |
| `focus_set` | On a call with `skill_options.focus`: `true` when the lesson started from that read; `false` with `rename_needed`, `refused: [{ layer, reason, parent? }]` (`past_target` in a review, or a candidate reason) and `focus_size` (`too_few`, `too_many` or `null`), and no lesson change |
| `proposal`, `next_proposal`, `no_proposal_reason`, `left_out`, `duplicate_names`, `rename_needed`, `matte_added`, `notes` | From the analyzer, above |
| `next_proposal` in a review | Always `null`: a review offers its one group only (FR-024) |
| `focus`, `targets`, `demo_target`, `demo_used`, `mode`, `lesson` | From the session |
| `no_demo_reason` | In a review: `review` with a focus, `awaiting_focus` with a proposal, else `no_new_target` (so a crowd-only comp gives `no_new_target`) |
| `before_time` | The baseline's `comp.time` once a focus is set, else `null` |
| `null_ready` | `true` once `skill_data.stored` exists, so the demo can run (FR-008) |

## Check input (`null_parent_check`)

`{ "null"?: name, "region"?: code | "slides_only", "chain_on_purpose"?: true }`, all optional, each
the learner's own answer in the conversation. The tool stores them in `skill_data`.

## Check result (`null_parent_check`; FR-019)

```json
{ "comp_matches": true, "lesson_comp": "Mentor Practice 2", "before_time": 3, "graded": true,
  "stage": "parenting", "parenting_passed": false, "passed": false, "demo_undone": false,
  "null": { "name": "Group Null", "found": true, "name_unique": true, "n1": true, "n2": true,
            "n3": { "applies": true, "passed": false, "region_now": "top-left", "wanted": "center" },
            "p4": null, "p5": null, "moves": [], "renamed_from": null, "stored_now": true },
  "layers": [ { "layer": "Stamp", "credit": "learner", "parent": null,
                "p1": false, "p2": { "passed": false, "worst_px": 120, "direction": "left", "time": 3.2 },
                "not_checked": [], "p3": { "passed": true, "before": {...}, "now": {...} } } ],
  "hints": [{ "code": "jumped", "layer": "Stamp", "px": 120, "direction": "left", "time": 3.2 }],
  "codes": ["jumped"], "comments": [], "other_changes": [] }
```

| Field | Rule |
|---|---|
| `graded` | `false` on `other_comp`, `null_parent_moves` and an unreadable comp (`cant_check`): no `markChecked` |
| `stage` | `parenting` until `parenting_passed`, then `move` |
| `null.found` | `false` with `which_null: [names]` when several new nulls and none named |
| `null.name_unique` | `false` → `codes: ["null_name_not_unique"]`, nothing stored, N1 to N3 and P1 to P3 not run |
| `null.n2` | `true`, `false`, or `"moves"` (out of the lesson: `codes: ["null_parent_moves"]`, nothing graded, no `markChecked`) |
| `null.p4` | `null` at stage `parenting`; else `{ passed, on: [properties], anchor_only }` |
| `null.p5` | `null` unless the move includes Scale or Rotation; else `{ passed, region_needed }` |
| `layers[].p2.direction` | `left`, `right`, `up`, `down` or a pair, from the worst corner's delta |
| `layers[].not_checked` | The times P2 couldn't measure (`no_layer`, `not_stored`, or a comp-space `reason`); any entry fails P2 ("couldn't check") |
| `layers[].credit`, `layers[].expression_on_move` | `demo` or `learner` (FR-018); whether a keyed Position, Scale or Rotation has an expression (overlap row 1) |
| `hints` | `[{ code, ...facts }]`: the facts the prompt's sentence needs (layer, parent, px, direction, time, region, properties), never a cause the read can't see |
| `codes` | The distinct `hints[].code`s. One per TD § 7 row and § 14 answer: `visible_parent`, `jumped`, `pickwhip_position`, `wrong_parent`, `opacity_move`, `no_move`, `one_key`, `pivot_region`, `region_needed`, `null_has_parent`, `one_level_only`, `null_parent_moves`, `null_name_not_unique`, `which_null`, `null_renamed`, `anchor_only`, `not_found`, `cant_check`; and (S6, added 2026-10-25): `null_ready` (N1 to N3 pass, the null is stored, nothing is parented yet and no pick-whip link: go on to parenting), `no_null` (no lesson null found; `named` when the learner's name matched nothing), `not_a_null` (N1), `three_d` (N2: a 3D null), `not_parented` (a focus layer with no parent while another is parented to the null), `own_keys_changed` (P3, with the properties), `effect_move` (P4: only effect keys move on the null), `existing_null` (an existing null with children or keys, once), `other_comp` (the active comp isn't the lesson's; `graded: false`) |
| `comments` | Research R8's codes; graded never |
| `other_changes[].kind` | `parented_to_null`, `parent_changed`, `keys_changed`, `expression_toggled`, `layer_added`, `layer_removed`, `children_brought` |

## Demo (`null_parent_demo`; FR-017)

Args to `null-parent-demo.jsx`: `{ comp_id, layer_index, layer_name, null_index, null_name }`.
Result: `{ layer, null, moved_px, jumped, direction, couldnt_check, frame_time, undo: "Edit > Undo" }`.
`couldnt_check` lists the times the second read couldn't measure (then `moved_px` is `null` and the
mentor says what it couldn't see, FR-011); `frame_time` is the before-read time for the demo's
frame (FR-022). Refusal reasons
(`NULL_PARENT_REFUSED`): `null_not_ready`, `not_found`, `null_fails_n1`, `null_fails_n2`,
`already_parented`, `locked`, `three_d`, `null_scale_zero`.

## Record (FR-025)

No new fields: targets come from `target_refs` (`{ layer, property: "Parent" }`).
