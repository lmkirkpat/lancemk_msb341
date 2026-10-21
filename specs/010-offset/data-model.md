# Data model: skill 3, offset (spec 010)

**Status**: Draft, awaiting the builder's approval. Only what this skill adds. Shared shapes
(timing measures, session lesson, analyzer result, lesson entry) are spec 004's
[data-model.md](../004-ae-curriculum/data-model.md); nothing here changes them.

## Floor

`floorFrames(fps) = max(2, fps / 15)`; two times are **the same** when they're fewer than that many
frames apart, less 0.1 frame for millisecond rounding (`|a − b| × fps < floorFrames(fps) − 0.1`,
research R1). Never shown to the learner.

## `skill_options` (stored by the session, spec 004 T060, T061)

| Field | Type | Rule |
|---|---|---|
| `kind` | `"layers" \| "properties"` | The learner's pick; default the proposal (FR-006) |
| `members` | `string[]` | Layer names the learner named for a layers group; default the proposal |
| `order` | `string[]` | Member labels (layer names, or property names for the properties kind) in the learner's order |
| `gap_frames` | integer ≥ 1 | The learner's gap in frames (the mentor converts seconds to frames to say it back) |
| `split` | `string[]` | Layers whose properties the learner wants split (up front, or after the "pops in" hint) |

Plain JSON; sent whole whenever it changes.

## Group (FR-005)

| Field | Rule |
|---|---|
| `kind` | `layers` or `properties` |
| `members` | Layers kind: `[{ layer_index, layer, start }]`. Properties kind: `[{ layer_index, layer, unit, move_index, start, end }]` |
| `start`, `end` | The shared start (and landing, properties kind) of the first member |

Eligible layer: `enabled`, not `is_null`, not `precomp`, `first_start` not null. Eligible unit: not
`excluded`, on an eligible layer.

## Target IDs

Layers kind: `"layer/<layer index>"`; properties kind: `"<layer index>/<unit>/<move_index>"`.
`target_refs`: layers kind, one `{ layer, property }` per counted unit of each member layer (several
per target, plan › RQ-1); properties kind, one per target.

## Analyzer result (spec 004's, plus these fields)

| Field | Rule |
|---|---|
| `group` | The lesson's group (the learner's pick, or the proposal) |
| `proposed_kind`, `other_kind` | The proposal and the other kind if it has a group (offered in one sentence), or `null` |
| `left_out` | `[{ reason, layers }]`: `null`, `hidden`, `precomp`, `expression` |
| `demo_target` | Research R4, or `null` |
| `no_demo_reason` | `null`, `single_target`, `no_new_target` (session), or this skill's `no_group`, `awaiting_order`, `two_members`, `gap_under_floor` |
| `focus` | The group's layer names |
| `frame_together` | A time inside the group's shared motion, for stage 2's frame |

## Member result (`offset_check`)

| Field | Rule |
|---|---|
| `target` | Target ID and plain label ("Glow", "Title › Opacity") |
| `start_before`, `start_now` | Seconds (`end_before`, `end_now` for the properties kind) |
| `moved_by` | Per counted property (and per dimension for separated Position): frames shifted, half-frame tolerance |
| `split` | Layers kind, in any layer where a counted property moved: properties moved by different amounts, `{ moved, stayed, within_position, on_purpose }` (`within_position` for separated X and Y moved apart; `on_purpose` when `split` exempts it) |
| `credit` | Demo member: `demo`, `undone`, `learner` |
| `status` | `graded`, `keys_changed` (properties kind: the move count changed, so the remembered move is gone; layers kind: no start now). A `keys_changed` member isn't graded and doesn't block a pass while at least 2 members are graded |

## Check result

`{ comp_matches, lesson_comp, members: [Member result], still_same: [[label, label]],
order_differs, out_of_comp: [{ layer, property, time }], other_changes: [string], rhythm: { uneven }
| null, passed, demo_undone }`. `still_same` lists every pair that's still the same (layers: starts;
properties: start and landing). `passed` needs at least 2 graded members, no `still_same` pair and
no split that isn't `on_purpose`. `markChecked(passed, { demoUndone })` only when `comp_matches`.

## Demo result (`offset_demo`)

`{ layer, properties: [display name], shift_frames, from, to, undo: "Edit > Undo" }` where `from`
and `to` are the member's start before and after.
