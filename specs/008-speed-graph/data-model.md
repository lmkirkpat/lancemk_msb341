# Data model: skill 2, speed graph (spec 008)

**Status**: Draft, awaiting the builder's approval. Only what this skill adds. The shared shapes
(session lesson, analyzer result, lesson entry, skill state) are spec 004's
[data-model.md](../004-ae-curriculum/data-model.md); nothing here changes them.

## Pair ID

Easing's segment ID, from the shared `segmentId(layer, prop, i)`: `"<layer index>/<property
path>/<i>"`, where `i` is the pair's first key index (1-based, as easing). Parsed with the shared
`parseSegmentId`. Pair IDs follow key order, so adding, removing or moving keys on a property
shifts them (overlap row 17, FR-014).

## `skill_options` (stored by the session, spec 004 T060, T061)

| Field | Type | Rule |
|---|---|---|
| `eased_layers` | `string[]` | Layer names from easing lesson entries in the record (research R5). Ranking only; a name not in the comp is ignored (Edge Cases: the record names a layer that's gone). Default `[]` |
| `land_hard` | `string[]` | Pair IDs the learner said should land hard (FR-006). Left out of candidates, focus and grading for the rest of the lesson. Default `[]` |

Plain JSON only. The prompt sends both on every call that sends `skill_options` (a call that sends
it replaces the stored object).

## Candidate (FR-003)

A pair from the shared `segments(snapshot)` (so already: property keyed, two or more keys, no
enabled expression) where all of:

| Test | Rule |
|---|---|
| Facing sides bezier | `from.out_type === "bezier"` and `to.in_type === "bezier"` (this skill's own test; not `segmentState`, overlap row 7) |
| Moves | at least one moving dimension (research R4); a pair with values known and equal is left out silently (row 16) |
| Not already shaped | it doesn't pass the pair check (FR-010) now |
| Not dropped | its ID isn't in `skill_options.land_hard` |
| Not excluded | in review mode, its `{layer, property}` isn't in `opts.exclude` |

## Analyzer result (spec 004's, plus these fields)

| Field | Rule |
|---|---|
| `targets` | Focus pair IDs, layer then property then time order |
| `target_refs` | One `{ layer, property }` per target (layer name, property display name) |
| `demo_target` | The first target on a visible, non-null layer (FR-007), or `null`. The session forces `null` in a review and with one target |
| `no_demo_reason` | `null`, `single_target`, `no_new_target` (session), or this skill's `nothing_to_shape` (no candidate in the comp), `none_in_focus` (candidates exist, but none on the layers in focus), `no_visible_layer` (two or more targets, none on a visible, non-null layer), and the tool's `demo_used` (the lesson's one demo has run). The last three were added in the build (2026-10-21) |
| `focus` | The focus layer names (one, two at most) |
| `candidates_count` | Candidates in the comp, before the 5-pair cap |
| `left_out` | `[{ kind, layers }]`, one entry per kind present, in FR-005's order: `hidden`, `null`, `precomp`, `expression`, `ease_first` (linear or half eased), `already_shaped` |
| `ease_first_count` | Pairs that need easing first (counts toward US3's "offer easing") |
| `pairs` | Per target: `{ id, layer, property, display_path, from_time, to_time, moving_dims, fastest }` with `fastest` from research R2 (`{ parts: [...] }`) and `display_path` the property's plain path (for an effect, "Effect › Property") |
| `other_candidates` | Candidates outside the focus, one entry per layer and property, `{ layer, property, display_path, pairs }` (`pairs`: how many), so the mentor can offer them by name (added in the build, 2026-10-21) |

Focus rule (FR-004): with no `focus_layers`, candidates on Position or Scale only; rank layers in
`eased_layers` first (in comp layer order), then the rest in layer order; the focus is the first
visible, non-null layer that has a Position or Scale candidate, capped at 5 pairs in property then
time order. A second layer comes in only when the learner names two (`focus_layers`); two named
layers **share the 5-pair cap one pair at a time** (a round from each layer in turn, each layer's
pairs in property then time order), so neither crowds the other out (as built, 2026-10-21).
**Review** (`mode: "review"`, FR-021): one layer and **one property** (Position or Scale first),
**up to 2 pairs** of it. On Mentor
Practice in its 2026-10-20 state this gives Title, Position 0.5–1.5, 1.5–3, 3–4.37 s and Scale
0.5–1.5 s (spec US1). With `focus_layers`, any candidate on those layers, including Opacity,
Rotation, effects, a null or a hidden layer; the cap still applies. `UNKNOWN_LAYER` is the
session's.

## Pair result (`speed_graph_check`, FR-010 to FR-014)

| Field | Rule |
|---|---|
| `id`, `label` | Pair ID and "Title › Position 0.5–1.5 s" |
| `result` | `passed`, `not_passed`, `keys_changed`, `removed` |
| `failed` | Subset of `["a", "b", "c", "d"]` (FR-010) |
| `mistake` | One of `arrives_moving`, `no_handle`, `long_both_ends`, `back_to_default`, `in_out_mixed`, `not_shaped`, or `null` when passed (research R7) |
| `drag_sideways` | `true` with `arrives_moving` when the landing influence is within 1 point of the baseline's |
| `dimension` | The failing moving dimension's plain label ("height"), when only some dimensions fail |
| `key_time` | The key the hint names (the landing for `arrives_moving`, the linear or hold side for `no_handle`) |
| `fastest` | `{ parts }` on the current shape (stage 6's "read again") |
| `credit` | Demo pair only: `demo`, `learner_after_undo`, `learner_redo`, `unknown` (FR-008) |

## Check result

`{ comp_matches, lesson_comp, pairs: [Pair result], other_changes: [string], passed, demo_undone,
seen_shaped: [pair ID] }`. `other_changes` is the shared `unexpectedChanges(baseline, current,
targetSet)`, where `targetSet` is the lesson's targets **plus the pairs the learner said should land
hard** (`land_hard`), so a dropped pair the learner then changes isn't reported as an other change.
`passed` is true when every focus pair (dropped pairs aren't focus pairs) was graded and passed: a
pair whose keys changed (`keys_changed`) or that's gone (`removed`) **holds the pass** until the
learner answers whether that was on purpose (FR-014; as built, 2026-10-21).
`markChecked(passed, { demoUndone })` is called only when `comp_matches`.

## Demo result (`speed_graph_demo`)

`{ layer, property, from_time, to_time, dimensions, out_influence: [n], in_influence: [n],
undo: "Edit > Undo" }`, the influences as read back after the write. The values written come from
the lib's `DEMO_OUT` and `DEMO_IN` (15.13, 79.87), passed to the snippet by the tool, so the snippet,
its twin and the check's fingerprint read one source.

## Reading answer

Not stored by any tool. The mentor compares the learner's answer with `pairs[].fastest` (stage 2)
or the check's `fastest` (stage 6), and puts both answers in plain words in `record_lesson`'s
`summary` (FR-016, FR-023).
