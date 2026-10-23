# Data model: After Effects curriculum (spec 004), sprint 3 baseline

Shapes for what wave A builds. Snapshot, Segment and Check result for easing are unchanged from
[spec 002's data model](../002-easing-slice/data-model.md). Wave B's shapes (reads R1 and R3, the
visibility class, the motion-sources map) are at the end. Decisions behind each shape are
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

## Kept-linear mark (in `learner.json` › `marks[]`, FR-038)

A new top-level array; the file stays `version: 1`, and readers that don't know it ignore it (the
panel's memory view reads only `version`, `skills` and `lessons`).

```json
{ "kind": "kept_linear", "project": "Claude AE Tutor Test.aep", "comp": "Mentor Practice 2",
  "layer": "Spinner", "path": "ADBE Transform Group/ADBE Rotate Z", "property": "Rotation",
  "key_times": [0, 4], "skill": "keyframes.types", "date": "2026-10-21" }
```

| Field | Rule |
|---|---|
| `kind` | `kept_linear` (the only kind this sprint) |
| `project`, `comp`, `layer`, `path` | Where it applies: the same project file name, comp name, layer name and property path. Anything else is a different property |
| `property` | The display name, for reading only |
| `key_times` | The property's key times (seconds, as the snapshot gives them) when the check confirmed it |
| `skill`, `date` | Which skill's check wrote it, and the local date |

- **Written** only by `record_lesson`, from the current lesson's `kept_linear` list, which only
  `session.keepLinear(snapshot, refs)` fills, and only after it confirms in that snapshot that every
  pair on each property is linear at both ends. A new mark on the same comp, layer and path replaces
  the old one.
- **Applies** while, in the snapshot being read, the property exists with exactly `key_times`, no
  expression on, and every pair `linear` (`segmentState`). Otherwise it has **lapsed**.
- **Removed** by the next `record_lesson` whose lesson baseline is that comp and shows the mark
  lapsed. A lapsed mark that hasn't been removed yet is ignored everywhere.
- **Not personal:** layer and property names and times only (FR-022, the email and phone check runs
  on the names too).

## Session lesson (in `session.json` › `lessons[<skill>|<comp id>]`)

Spec 002's lesson (`lesson_id`, `comp_id`, `baseline`, `focus`, `targets`, `demo_target`, `demo`,
`status`, `checked`, `passed`), plus:

| Field | Rule |
|---|---|
| `skill` | The skill ID. Keys without a `skill` or a `|` are easing's (old files) |
| `mode` | `lesson` or `review`. Fixed when the lesson starts; a new mode on the same skill and comp starts a new lesson |
| `target_refs` | `[{ layer, property }]` from the skill's analyzer, for the record |
| `exclude` | Review only: the past targets the analyzer was given |
| `kept_linear` | `[{ layer, path, property, key_times }]` confirmed by `keepLinear()` this lesson, written to `marks` by `record_lesson` |
| `marks` | The kept-linear marks for this comp and project, read from the record at `start()` and passed to the analyzer as `kept_linear` |
| `skill_options` | The skill's own analyzer options, as last given to `start()`; reused on a continued or resumed lesson when a call gives none (spec 008 SR-1). Not set on a new or `fresh` lesson until given |

`session.json` also gains `review_offers: [{ skill, at }]` (research R7, R8), pruned to the last
3 hours on each write.

## Analyzer result (what a skill's `analyze(snapshot, opts)` returns to the session)

| Field | Required | Rule |
|---|---|---|
| `targets` | yes | Target IDs, strings, stable for the same snapshot. Skills 1 and 2 use segment IDs; skill 3 picks its own (layer-level) |
| `target_refs` | yes | One or more `{layer, property}` per target, by name (skill 3's layers kind stores every counted property of the layer) |
| `demo_target` | yes | One of `targets`, or `null`. The session forces `null` in review mode and when there's one target |
| `no_demo_reason` | yes | `null` or a short code (`single_target`, `nothing_to_teach`, `no_new_target`, or the skill's own) |
| `focus` | yes | The focus layer names, or `null` |
| anything else | no | Passed through to the skill's own tool output |

Analyzers also receive `kept_linear` (the applying marks for this comp) in `opts`. Easing's
`analyze` puts each marked property in `skipped` with `reason: "kept_linear"` instead of in
`findings` or `targets` (`counts` still count its pairs). With no marks its result is unchanged
(SC-004). Other skills may ignore marks unless their spec says otherwise.

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
| Back-to-back pairs | Every key pair that isn't a pause is its own move: Title's Position with keys at 0.5, 1.5 and 3 s is two moves, not one (spec 010 SR-1, tasks T058, T059) |
| Separated dimensions | X, Y, Z Position on one layer are one unit. A move merges only with moves from a **different** dimension that overlap or touch it in time (earliest start, latest landing), so X and Y moving together read as one move, not two landing together. Two moves of the same dimension never merge with each other, though both can join one merged move through another dimension's move that overlaps them |
| Effect keys | Counted, like any property |
| Expression on | `excluded: "expression"`; keys listed, not counted |
| Precomp layer | `precomp: true`; its own transform keys counted; inner time not read |
| Frames | `frame = round(time × frame_rate)` |

`clusters(events, toleranceSeconds)` → groups of events (each `{time, ...}`) where neighbours are
within the tolerance, in time order. Callers set the tolerance (FR-017).

## Wave B shapes (reads R1 and R3, the visibility class, the motion-sources map step 1)

Detailed 2026-10-23 for [tasks-wave-b.md](tasks-wave-b.md). Decisions: research R16 to R22.

### Snapshot additions

`layers`, `precomp_layers` and `host` don't change. `comp` gains two fields and the snapshot gains
`layer_info`:

```json
{
  "comp": { "id": 12, "name": "Mentor Overlaps", "duration": 6, "frame_rate": 30,
            "time": 1, "hide_shy": true },
  "layer_info": [
    {
      "index": 4, "name": "Leaf 1", "kind": "solid",
      "enabled": true, "is_null": false, "adjustment": false, "has_video": true,
      "three_d": false, "collapse": false, "auto_orient": false,
      "parent": 3, "shy": false, "solo": false, "guide": false, "locked": false,
      "in_point": 0, "out_point": 6, "start_time": 0, "stretch": 100, "time_remap": false,
      "matte": null, "is_matte": false, "motion_blur": false, "effect_count": 0,
      "transform": { "anchor": [50, 50, 0], "position": [-120, 40, 0], "scale": [100, 100, 100],
                     "rotation": 0, "opacity": 100 },
      "samples": [
        { "time": 1, "anchor": [50, 50, 0], "position": [-120, 40, 0], "scale": [100, 100, 100],
          "rotation": 0, "rect": { "left": 0, "top": 0, "width": 100, "height": 100 },
          "rect_extents": null }
      ],
      "samples_truncated": false
    }
  ]
}
```

| Field | Rule |
|---|---|
| `comp.time` | The current time (`comp.time`), rounded to 0.001 s like key times |
| `comp.hide_shy` | The comp's shy filter (`hideShyLayers`) |
| `layer_info` | **One entry per layer in the active comp, keyed or not**, in index order. Never anything from another comp |
| `kind` | As `layers[].kind` (`null`, `text`, `shape`, `camera`, `light`, `adjustment`, `precomp`, `solid`, `footage`) |
| `three_d` | `threeDLayer` (011 B-3, 012 B-5) |
| `collapse` | Collapse Transformations (`collapseTransformation`), on precomp and vector layers; `false` elsewhere (011 B-3) |
| `auto_orient` | `true` when the layer's Auto-Orient isn't Off (012 B-6). Whether `rotation` includes it is a live check (tasks T128) |
| `parent` | The parent's layer index, or `null`. Only the Parent link: an expression link isn't a parent |
| `in_point`, `out_point`, `start_time` | Seconds, comp time |
| `stretch` | Percent (100 = normal; negative = reversed) |
| `time_remap` | `timeRemapEnabled` |
| `matte` | On the layer **being matted**: `{ "layer": <index of the matte>, "type": "alpha" \| "alpha_inverted" \| "luma" \| "luma_inverted" }`, or `null`. Scripting names (`trackMatteLayer`, `trackMatteType`) are curriculum B8, checked live |
| `is_matte` | `isTrackMatte`: this layer is used as a matte |
| `effect_count` | Number of effects on the layer (optional, 012 B-5; lets a hint fire on an unkeyed effect). Effects themselves aren't read |
| `transform` | Rendered values (after expressions) at `comp.time`: `anchor`, `position` (assembled from X, Y, Z when separated), `scale` (percent), `rotation` (Z rotation, degrees), `opacity` |
| `samples` | At each **sample time**: rendered `anchor`, `position`, `scale`, `rotation`, and `rect` (`sourceRectAtTime(t, false)`, the layer's own rectangle in its own space). `rect_extents` (`sourceRectAtTime(t, true)`) on shape and text layers only, else `null` (which one matches what the learner sees is spec 011's L-1) |
| Sample times | Union of `comp.time`; every key time on the layer's own keyed properties; each child's sample times (recursively); and the caller's `sample_times`. Sorted, deduplicated, rounded to 0.001 s, at most 64 (`samples_truncated: true` past that) |
| Unreadable value | `null` for that field, never a failed snapshot |
| Not read | Source names, file paths, anything about the machine or user (FR-011, Principle IV); expressions' text (read R2); what's inside precomps (read R4) |

`takeSnapshot({ sample_times } = {})` passes `sample_times` to the snippet; with none, the snippet
gets `{}` as today. In fixture mode `sample_times` is ignored (a saved capture can't be re-sampled).

### `mentor/lib/layer-info.mjs`

`layerInfo(snapshot)` → `{ known, layers }` (`known: false`, `layers: []` with no `layer_info`);
`byIndex(snapshot, index)` → entry or `null`; `byName(snapshot, name)` → every entry with that name
(AE allows duplicates; callers that need one use the index).

### `mentor/lib/comp-space.mjs` (2D, pure)

| Export | Returns |
|---|---|
| `layerMatrix({ anchor, position, scale, rotation })` | The affine matrix translate(position) · rotate(rotation) · scale(scale / 100) · translate(−anchor), as `[a, b, c, d, e, f]` |
| `compMatrix(snapshot, index, time, { parent_transform } = {})` | `{ matrix }` composed up the parent chain from samples at `time`, or `{ matrix: null, reason }`. `parent_transform` replaces the direct parent's sampled transform (skill 6's "null at parenting"; the parent's own parents still come from samples) |
| `compPoint(snapshot, index, point, time, opts)` | A point in the layer's own space, in comp pixels |
| `compPosition(snapshot, index, time, opts)` | The anchor in comp space (where the layer "is") |
| `footprint(snapshot, index, time, opts)` | `{ corners: [[x, y] × 4], bounds: { left, top, right, bottom } }` from `rect` at `time` (`{ extents: true }` uses `rect_extents`) |
| `toLayerSpace(snapshot, index, point, time, opts)` | The inverse (for fixture twins, such as skill 6's parenting demo) |

`reason` is one of `no_layer_info`, `no_layer`, `not_sampled` (a layer in the chain has no sample at
that time, within 0.0005 s), `three_d`, `auto_orient`, `no_rect`. Values are rounded to 0.001 px.
Callers set every tolerance (FR-028 and FR-029 are the skills' measures, not this file's).

### Visibility class (`mentor/lib/visibility.mjs`, FR-013)

`visibility(snapshot)` → `[{ layer_index, layer, class, known, enabled, solo, soloed_elsewhere, shy,
timeline_hidden }]`; `classOf(snapshot, index)` → the class.

| Order | Class | When |
|---|---|---|
| 1 | `null` | A null layer, whatever its eye |
| 2 | `matte` | `is_matte`, whatever its eye |
| 3 | `hidden` | Eye off ("hidden by the learner") |
| 4 | `guide` | A guide layer |
| 5 | `shy` | Shy (renders; `timeline_hidden` when the comp's shy filter is on) |
| 6 | `renders` | Anything else (cameras, lights, adjustment and audio-only layers too; `kind` tells them apart) |

`soloed_elsewhere` is true when another layer is soloed and this one isn't; it never changes the
class. **Without `layer_info`:** `known: false`, one entry per keyed layer in `layers`, classed
`null`, `hidden` (eye off) or `renders`, so every consumer behaves as before wave B.

### Motion-sources map, step 1 (`mentor/lib/motion-sources.mjs`, FR-014)

```text
motionSources(snapshot) → {
  known,                                    // false without layer_info
  read: { own_keys: true, parents: true | "not_read", expressions: "keyed_only", precomp_contents: "not_read" },
  layers: [{
    layer_index, layer, class,
    own_keys:  [{ property, path, display_path, keys, group: "transform" | "effect" | "other", expression_on }],
    parents:   [{ layer_index, layer, class, shy, moves_children }] | null,   // nearest first
    children:  [{ layer_index, layer }],
    expressions: { status: "not_read", on_keyed: [{ property, path }] },
    precomp_contents: "not_read" | "not_a_precomp",
    static_as_read                          // no own keys and no parents, in what was read
  }]
}
sourcesOf(snapshot, nameOrIndex) → one entry, or null for a layer not in the active comp
```

| Rule | How |
|---|---|
| `moves_children` | The parent has keys on Anchor Point, Position (or X, Y, Z), Scale or Rotation. Opacity and effects aren't inherited |
| Hidden null with children | Class `null`, listed in each child's `parents` |
| Shy parent | Listed with `shy: true`; class `shy` |
| Expression on a keyed property | In `own_keys` with `expression_on: true` and in `expressions.on_keyed` |
| Anything about unkeyed or turned-off expressions | Not known: `expressions.status` stays `"not_read"` until read R2 (wave D) |
| Precomp layer | `precomp_contents: "not_read"` until read R4 |

### KD-001 in easing

`analyze()`'s `hidden_layers`: keyed layers whose class is `hidden` when `layer_info` is known; the
eye-off list otherwise. Shape unchanged. The demo picker is unchanged (eye on, not a null).
