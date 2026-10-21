# Data model: After Effects curriculum (spec 004), sprint 3 baseline

Shapes for what wave A builds. Snapshot, Segment and Check result for easing are unchanged from
[spec 002's data model](../002-easing-slice/data-model.md). Wave B's shapes (layer relations, the
visibility class, the motion-sources map) are outlined at the end. Decisions behind each shape are
in [research.md](research.md).

## Path (`mentor/curriculum/path.json`, FR-001)

```json
{
  "about": "Mirror of curriculum.md › 4 and › 10. Change both in the same merge (FR-002).",
  "on_ramp": { "id": "keyframes", "name": "Setting keyframes" },
  "skills": [
    { "position": 0, "id": "easing.basic", "name": "Easing", "hard": ["keyframes"], "soft": [] },
    { "position": 1, "id": "keyframes.types", "name": "Pick the key type on purpose", "hard": ["easing.basic"], "soft": [] },
    { "position": 2, "id": "easing.speed_graph", "name": "Shape the ease in the speed graph", "hard": ["easing.basic"], "soft": ["keyframes.types"] },
    { "position": 8, "id": "matte.track", "name": "Show one layer through another", "hard": [], "needs_in_comp": "a shape or text layer to use", "soft": ["shape.trim_paths"] }
  ],
  "findings": { "DX-01": "easing.basic", "DX-02": null, "DX-03": "timing.offset", "DX-05": "keyframes.types" }
}
```

(Excerpt; the file lists all eleven skills and DX-01 to DX-09.)

| Field | Rule |
|---|---|
| `skills[].position` | 0 for easing, 1 to 10 as `curriculum.md` › 4's `#` column. Path order is position order |
| `skills[].id` | research R4. Unique |
| `skills[].name` | The plain name the mentor says (FR-008). Never the ID |
| `hard`, `soft` | Skill IDs, or `"keyframes"` (the on-ramp, always met). Skill 4's soft `1–3` is three IDs |
| `needs_in_comp` | A prerequisite that's a thing in the comp, not a skill (skill 8). Never blocks a recommendation; the skill's own focus rule handles it |
| `findings` | DX-ID → skill ID, or `null` for "no skill yet" (`curriculum.md` › 10). DX-08 maps to `motion.sources` |
| Built | **Not stored.** A skill is built when a `mentor/tools/*.mjs` file declares its ID in `SKILLS` (FR-003) |

## Skill state (in `learner.json` › `skills[<id>]`, FR-018)

| Field | Type | Since | Rule |
|---|---|---|---|
| `status` | `not_started` \| `practicing` \| `learned` | spec 002 | `learned` after one pass, of any kind, and stays learned |
| `last_practiced` | ISO timestamp | spec 002 | Every recorded lesson |
| `times_passed` | integer | spec 002 | Every pass, including reviews |
| `next` | text | spec 002 | One "next" (FR-022) |
| `review_due` | `YYYY-MM-DD` local date | **004** | research R5. Absent until the first pass; if absent on a learned skill, read as `last_practiced`'s date + 1 |
| `reviews_passed_in_row` | integer | **004** | research R5. Absent reads as 0 |

Transitions on `record_lesson` (`d` = the lesson's local date):

| Lesson | Result | `status` | `review_due` | `reviews_passed_in_row` |
|---|---|---|---|---|
| first or practice, skill not yet learned | passed | → learned | d + 1 | 0 |
| first or practice, skill not yet learned | partial, not_checked | → practicing | unchanged (absent) | unchanged |
| practice, skill learned | any | learned | unchanged | unchanged |
| review, skill learned | passed | learned | d + 3, 7, 14, 30 for a run of 1, 2, 3, ≥ 4 | + 1 |
| review, skill learned | partial | learned | d + 1 | 0 |
| review | not_checked | unchanged | unchanged | unchanged |
| review, skill **not** learned ("already knew it") | passed | → learned | d + 1 | 0 |
| review, skill **not** learned | partial | → practicing | unchanged | unchanged |

**Due:** today's local date ≥ `review_due`.

## Lesson entry (in `learner.json` › `lessons[]`, FR-018)

Spec 002's fields (`date`, `skill`, `project`, `comp`, `attempted`, `result`, `demo_used`,
`summary`, `next`), plus:

| Field | Type | From | Rule |
|---|---|---|---|
| `kind` | `first` \| `practice` \| `review` | the session | `review` if the lesson ran in review mode; else `first` if the record has no entry for this skill; else `practice` |
| `already_knew` | `true`, or absent | the session and record | Only on a review of a skill that wasn't learned before it |
| `targets` | `[{ layer, property }]` | the session's `target_refs` | Layer and property **names**, de-duplicated. Empty if the lesson had none |

None of these is an input to `record_lesson`; the model can't set them (research R3). The file
keeps `version: 1`.

**Past targets** (for a review's new target, FR-021): the set of `{layer, property}` from every
entry for that skill whose `comp` and `project` match the open comp. Different comp or project
means new (Edge Cases).

## Session lesson (in `session.json` › `lessons[<skill>|<comp id>]`)

Spec 002's lesson (`lesson_id`, `comp_id`, `baseline`, `focus`, `targets`, `demo_target`, `demo`,
`status`, `checked`, `passed`), plus:

| Field | Rule |
|---|---|
| `skill` | The skill ID. Keys without a `skill` or a `|` are easing's (old files) |
| `mode` | `lesson` or `review`. Fixed when the lesson starts; a new mode on the same skill and comp starts a new lesson |
| `target_refs` | `[{ layer, property }]` from the skill's analyzer, for the record |
| `exclude` | Review only: the past targets the analyzer was given |

`session.json` also gains `review_offers: [{ skill, at }]` (research R7, R8), pruned to the last
3 hours on each write.

## Analyzer result (what a skill's `analyze(snapshot, opts)` returns to the session)

| Field | Required | Rule |
|---|---|---|
| `targets` | yes | Target IDs, strings, stable for the same snapshot. Skills 1 and 2 use segment IDs; skill 3 picks its own (layer-level) |
| `target_refs` | yes | One `{layer, property}` per target, by name |
| `demo_target` | yes | One of `targets`, or `null`. The session forces `null` in review mode and when there's one target |
| `no_demo_reason` | yes | `null` or a short code (`single_target`, `nothing_to_teach`, `no_new_target`, or the skill's own) |
| `focus` | yes | The focus layer names, or `null` |
| anything else | no | Passed through to the skill's own tool output |

Contract: [contracts/skill-module.md](contracts/skill-module.md).

## Host (R0, from `snapshot.host`)

| Field | Example | Rule |
|---|---|---|
| `known` | `true` | `false` when the snapshot has no `host` (all fixtures before wave A) |
| `version` | `"26.5"` | Major.minor from `app.version` ("26.5x12") |
| `build` | `"12"` | The part after the `x`, or `null` |
| `os` | `"macOS 27.0.1"` | From `$.os`; only the OS name and version |
| `platform` | `"mac"` \| `"win"` | |
| `beta` | `null` | Unknown until quickstart › 2 settles whether `app.version` shows it |

Nothing else from the raw values is kept (FR-011).

## Timing measures (`timing(snapshot)`, FR-016)

```text
{
  frame_rate, comp_duration,
  layers: [{
    layer_index, layer, kind, enabled, is_null, precomp,
    units: [{
      unit,            // "Position" for separated X/Y/Z; else the property's display path
      paths,           // the snapshot property paths it covers
      excluded,        // null | "expression" | "single_key" | "no_change"
      first_key, last_key,              // seconds
      moves: [{ start, end, duration, kind }],   // kind: "ramp" | "instant" (a hold out side)
      starts, landings                  // seconds, from moves
    }],
    first_start, last_landing          // over the layer's non-excluded units, or null
  }],
  starts_by_frame:   [{ frame, time, at: [{ layer_index, layer, unit }] }],   // 2+ entries only
  landings_by_frame: [{ frame, time, at: [...] }],
  last_motion_end    // latest landing in the comp, or null
}
```

| Rule (spec Edge Cases, timing rows) | How |
|---|---|
| Single key | `excluded: "single_key"`, no moves |
| Hold pair | A move with `kind: "instant"`, `start` = `end` = the second key's time, duration 0 (a start, not a move with a duration) |
| Two neighbouring keys with equal values | A pause: no move. A unit with only pauses is `excluded: "no_change"`. Unknown values (null) count as a change |
| Separated dimensions | X, Y, Z Position on one layer are one unit. Moves from each dimension that overlap or touch in time merge into one move (earliest start, latest landing), so X and Y moving together read as one move, not two landing together |
| Effect keys | Counted, like any property |
| Expression on | `excluded: "expression"`; keys listed, not counted |
| Precomp layer | `precomp: true`; its own transform keys counted; inner time not read |
| Frames | `frame = round(time × frame_rate)` |

`clusters(events, toleranceSeconds)` → groups of events (each `{time, ...}`) where neighbours are
within the tolerance, in time order. Callers set the tolerance (FR-017).

## Wave B shapes (outline only; detailed in wave B's tasks)

- **Layer relations (R1)** as a separate `layer_info` array in the snapshot, one entry per layer
  **including layers with no keys** (parent, shy, solo, guide, locked, in and out points, stretch,
  time remap, matte target and type, is-a-matte, motion blur), so `layers` and easing's
  `hidden_layers` don't change shape.
- **Static transforms and bounds (R3)** in the same array: unkeyed anchor, position, scale,
  rotation, opacity, and comp-space bounds at the current time.
- **Visibility class** (FR-013): one of `renders`, `hidden`, `matte`, `guide`, `shy`, `null` per
  layer, from `layer_info`.
- **Motion-sources map, step 1** (FR-014): per layer, `own_keys`, `parents` (the chain, each with
  shy and visibility), and `expressions: "not_read"`, `precomp_contents: "not_read"`.
