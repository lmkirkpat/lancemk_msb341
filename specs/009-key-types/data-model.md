# Data model: skill 1, key types (spec 009)

**Status**: Draft, awaiting the builder's approval. Only what this skill adds. Shared shapes
(session lesson, analyzer result, lesson entry, skill state, kept-linear mark) are spec 004's
[data-model.md](../004-ae-curriculum/data-model.md); nothing here changes them.

## Pair ID

The shared `segmentId(layer, prop, i)` (`"<layer index>/<property path>/<i>"`), parsed with
`parseSegmentId`. Separated dimensions have their own paths, so their own pair IDs.

## Property ref

`{ layer, property }`: the layer's name and the property's display name or path. Resolved against
the snapshot; a name that doesn't resolve is `not_found` (check) or refused as `not_found` (focus),
never thrown (as built, 2026-10-21).

## `skill_options` (stored by the session, spec 004 T060, T061)

| Field | Type | Rule |
|---|---|---|
| `focus` | `Property ref[]` | What the learner named (FR-005). Empty until they answer the intent question (FR-004) |
| `should_move` | `Property ref[]` | Candidates the learner said are meant to fade or move, and any property they say should move (FR-004, FR-012) |

Plain JSON. Sent whole whenever it changes.

## Candidate (FR-003)

A pair on a layer's own `ADBE Transform Group/ADBE Opacity` where: one key's value is within 0.5 of
0 and the other's within 0.5 of 100; the first key's `out_type` isn't `hold`; the property is in
`segments()` (two or more keys, no enabled expression); the layer's `enabled` is true and
`is_null` false; both values are numbers; no applying kept-linear mark. Listed per property:
`{ layer, property, first_time, pairs }`, at most 3, earliest `first_time` then layer index.

## Focus and targets (FR-005)

For each focus ref: all of that property's pairs whose first key's out side isn't hold and whose
values aren't known to be equal (pause, row 16). Separated Position expands to each keyed
dimension. A ref is **refused** (with `reason`) when: `expression`, `single_key`, `all_held`,
`only_pauses`, `precomp_inside`, `not_found`, or (review mode) `past_target`, when every keyed
property it names was a target for this skill before (added in the build, 2026-10-21). Hidden
layers and nulls are allowed when named.

## Analyzer result (spec 004's, plus these fields)

| Field | Rule |
|---|---|
| `targets`, `target_refs` | Focus pair IDs and one `{layer, property}` each; `[]` before the learner names a focus |
| `target_pairs` | The targets described for the mentor (layer, property and times of each pair), so it can name them without parsing IDs (added in the build) |
| `demo_target` | Earliest target in time on an `enabled`, non-null layer, or `null` |
| `no_demo_reason` | `null`, `single_target`, `no_new_target` (session), or this skill's `awaiting_focus`, `no_candidate`, `hidden_or_null`, `demo_used` (the lesson's one demo has run; added in the build) |
| `focus` | Focus layer names, or `null` |
| `candidates` | Candidate list (above), minus `should_move` refs |
| `more_candidates` | How many candidates there are beyond the 3 named (0 when none), so the mentor can say there are more without naming them (added in the build) |
| `should_move` | The stored `skill_options.should_move`, echoed back (added in the build) |
| `refused` | `[{ layer, property, reason }]` for focus refs that can't be a focus |
| `held_examples` | Up to 2 already-held pairs on visible layers, `{ layer, property, jump_time }`, for stage 2's frames |
| `left_out` | `[{ reason, layers, properties }]`: `hidden`, `precomp`, `expression`, `already_held`, `kept_linear`, `unknown_values`; `properties` lists the items behind each reason (`properties` added in the build) |

## Pair verdict (`key_types_check`)

| Field | Rule |
|---|---|
| `id`, `label` | Pair ID and "Blink › Opacity 0.5–1 s" |
| `verdict` | `held_by_learner`, `held_by_demo`, `not_held`, `wrong_side`, `removed_or_changed` |
| `state` | `not_held` only: the shared `segmentState` |
| `frame_time` | `not_held` only: the pair's midpoint rounded to a frame, for the hint |

## Constant-speed verdict (stage 6)

`{ ref, verdict, detail }` where `verdict` is `linear`, `not_linear`, `held`, `expression`,
`single_key`, `not_found`; `detail` for `not_linear` lists `{ pair, side }` that aren't linear;
`marked: true` only when `keepLinear` stored it.

## Check result

`{ comp_matches, lesson_comp, pairs: [Pair verdict], should_move_held: [{ layer, property,
waits_until }], extra_holds: [{ layer, property, time }], other_changes: [string],
constant_speed: Constant-speed verdict | null, items: { held, none_should_move_held,
constant_speed }, passed, demo_undone }`.

`items.constant_speed` is `true`, `false`, or `null` (not named, or `expression`). `passed` is all
non-null items true and every pair `held_*`. `markChecked(passed, { demoUndone })` only when
`comp_matches`.

## Demo result (`key_types_demo`)

`{ layer, property, from_time, to_time, in_type, out_type, frames: { before, after }, undo:
"Edit > Undo" }`, the first key's types as read back; `frames` are one frame before and one after
the jump (clamped at 0 s), for stage 3's two frames (`frames` added in the build).
