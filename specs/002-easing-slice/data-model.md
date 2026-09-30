# Data Model: Easing Test Slice

**Date**: 2026-09-30 | **Spec**: [spec.md](spec.md) | **Research**: [research.md](research.md)

All times are in seconds, rounded to 3 decimals. IDs come from After Effects (`comp.id`,
`layer.index`, `property.matchName`) so snapshots taken minutes apart can be compared.

## Snapshot

What the mentor saw in one comp at one moment. Produced by `snapshot_project`, stored as the
lesson baseline in `session.json`, and saved as eval fixtures.

| Field | Type | Notes |
|---|---|---|
| `taken_at` | ISO datetime | |
| `project` | string | Project file name only (no folder path, which can contain a real name) |
| `comp` | `{ id, name, duration, frame_rate }` | |
| `layers` | Layer[] | Only layers with at least one animated property |

**Layer**: `{ index, name, kind, enabled, is_null, properties: AnimatedProperty[] }`

Also on the Snapshot: `precomp_layers: { index, name }[]`, the precomp layers whose insides
weren't read (R8).

**AnimatedProperty**: `{ path, display_path, match_name, display_name, dimensions, expression_enabled, keys: Key[] }`
- `path`: the stable ID path, built from `matchName`s by `mentor/jsx/lib/paths.jsx`, for example
  `ADBE Transform Group/ADBE Position`, `ADBE Transform Group/ADBE Position_0` (separated X),
  `ADBE Root Vectors Group/.../ADBE Vector Trim End`, or
  `ADBE Effect Parade/ADBE Gaussian Blur 2/ADBE Gaussian Blur 2-0001`. It survives layer renames
  and a different AE language.
- `display_path`: for people, built from display names, for example `Transform › Position` or
  `Contents › Rectangle 1 › Trim Paths 1 › End`. Used in labels and by the mentor. **Never used for
  matching.**
- `dimensions`: number of temporal ease dimensions (1 for Position/Opacity, 2–3 for Scale).

**Key**: `{ index, time, in_type, out_type, in_ease: Ease[], out_ease: Ease[] }`
- `in_type` / `out_type`: `"linear" | "bezier" | "hold"`.
- **Ease**: `{ speed, influence }`.

Validation: `keys` are in time order and `index` starts at 1, matching AE.

## Segment (derived, never stored on its own)

A keyframe pair, key *i* → key *i+1*, on one property. Computed from a Snapshot by
`mentor/lib/analyze.mjs`.

| Field | Type | Notes |
|---|---|---|
| `id` | string | `"<layer index>/<path>/<i>"` using the match-name `path`, for example `"1/ADBE Transform Group/ADBE Position/1"` |
| `display_path` | string | Carried from the property, for labels |
| `layer_name`, `property`, `from_time`, `to_time` | | For the mentor to name in plain language |
| `state` | `"linear" \| "eased" \| "held"` | Rules in research R7 |
| `skipped_reason` | `null \| "expression" \| "single_key"` | Why a property wasn't analyzed |

**Findings** = the Segments with `state: "linear"`, grouped by layer and property. These are the
lesson's **targets**.

## Session (`session.json`)

One lesson in progress. Created by the first `snapshot_project`, and replaced when a new
lesson starts.

| Field | Type | Notes |
|---|---|---|
| `lesson_id` | string | Timestamp-based |
| `baseline` | Snapshot | The "before" |
| `focus` | string[] \| null | Layer names the lesson is limited to (null = all) |
| `targets` | Segment id[] | Linear segments at baseline within the focus. Only these are graded |
| `demo` | `null \| { segment_id, at }` | Set once by `set_ease`; see state transitions |
| `status` | `"started" \| "demo_done" \| "checked"` | |
| `passed` | boolean | Set by the last `diff_since_last`. A lesson only ends by passing or by switching comps |

**State transitions**:

```
(no session) ──snapshot_project──▶ started ──set_ease (first time)──▶ demo_done
     started / demo_done ──diff_since_last──▶ checked ──diff_since_last──▶ checked (re-check allowed)
snapshot_project, same comp, lesson not passed ──▶ same lesson: baseline and demo kept;
                                                  focus_layers recomputes targets from the baseline
snapshot_project, no session / last check passed / different comp ──▶ started (new lesson,
                                                  new baseline, demo reset)
set_ease when demo ≠ null ──▶ error "demo already used" (FR-006)
```

Why: if re-snapshotting started a new lesson, a second `snapshot_project` would reset `demo` and
allow a second demonstration, and would make the learner's earlier edits part of the new
"before". Tying lesson boundaries to passing (or a comp change) closes both. An unfinished lesson
also carries over to the next day, which is what US2-3 asks for.

```
```

## Check result (returned by `diff_since_last`, never stored on its own)

| Field | Type | Notes |
|---|---|---|
| `comp_matches` | boolean | False if the active comp isn't the baseline comp (edge case: different comp) |
| `targets` | `{ segment_id, result }[]` | `result`: `"eased_by_learner" \| "eased_by_demo" \| "still_linear" \| "removed"` |
| `unexpected_changes` | string[] | Plain-language notes, for example "Opacity on Title now has 3 keys (was 2)" |
| `summary` | `{ learner_eased, still_linear, total_for_learner }` | Excludes the demo segment (scenario 1.6) |

**Pass** = `comp_matches` is true and `still_linear` is 0. The mentor turns this into words.

## Learner record (`learner.json`)

| Field | Type | Notes |
|---|---|---|
| `version` | 1 | For future format changes |
| `skills` | `{ [skill_id]: SkillState }` | Only `"easing.basic"` in this slice |
| `lessons` | LessonEntry[] | Append-only history |

**SkillState**: `{ status: "not_started" | "practicing" | "learned", last_practiced, times_passed, next }`
- `learned` after 1 pass in this slice. The review logic (Story 2) uses `last_practiced`.

**LessonEntry** (FR-010):

| Field | Type | Notes |
|---|---|---|
| `date` | ISO date | |
| `skill` | `"easing.basic"` | |
| `project`, `comp` | string | Names only |
| `attempted` | string | Plain language: "Eased 4 Position and Opacity pairs on Title and Shape" |
| `result` | `"passed" \| "partial" \| "not_checked"` | |
| `demo_used` | boolean | |
| `summary` | string | Plain language, what happened |
| `next` | string | Plain language, what to review or do next |

Validation: no field may contain an email or phone number pattern. The server rejects writes
that match (FR-012, Principle IV). There is no field for the learner's name.

## Eval case (`product/evals/easing/cases/*.json`)

| Field | Type | Notes |
|---|---|---|
| `id`, `title` | string | |
| `covers` | string[] | Spec references, for example `["US1-4", "FR-008"]` |
| `learner_record` | `null \| path` | Starting `learner.json`, or none for a new learner |
| `turns` | `{ project: fixture path \| "unreachable", say: string }[]` | Which snapshot is "the project" on each turn, and what the learner says |
| `expect` | Deterministic checks | For example `{ "set_ease_calls_max": 1, "verdict": "partial" }` |
| `rubric` | string[] | Rubric items from `rubric.md` that apply to this case |
