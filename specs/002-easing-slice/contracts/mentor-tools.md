# Contract: Mentor MCP tools

**Server name**: `ae-mentor` (stdio, registered in the repo's `.mcp.json`)
**Consumers**: the `/ease-mentor` skill in Claude Code, and the eval runner (fixture mode)

This is the **entire** set of tools the mentor has (FR-013). There is no general script tool.
Data shapes are defined in [data-model.md](../data-model.md).

## Errors (all tools)

Tool errors come back as MCP tool errors with a plain-language message the mentor can pass on:

| Code | When | Mentor must |
|---|---|---|
| `AE_UNREACHABLE` | Bridge not running, AE closed, or bad token | Say it can't see the project and give the fix; make no claims about the project (FR-009) |
| `AE_BUSY` | No answer in time (rendering, dialog open) | Same as above |
| `NO_ACTIVE_COMP` | No composition is active | Ask the learner to open a comp |
| `NO_SESSION` | `diff_since_last` or `set_ease` before any snapshot | Take a snapshot first |
| `DEMO_USED` | `set_ease` called a second time in a lesson | Explain the learner does the rest (US1-5) |
| `NOT_DEMO_TARGET` | `set_ease` on anything but the first flagged pair of a flagged property | Same as above |
| `UNKNOWN_LAYER` | `focus_layers` names a layer that isn't in the comp | Re-read the findings and use the exact name |
| `UNSAFE_RECORD` | `record_lesson` text contains an email or phone pattern | Rewrite without it |

## 1. `snapshot_project`

Reads the active comp, starts a new lesson, and returns what to teach.

- **Input**: `{ "focus_layers": string[]? }`. Always reads the active comp. `focus_layers`
  limits the lesson's **targets** to those layers, so the mentor can teach a manageable chunk
  (R8). Omitted means every flagged layer. A typical flow is to call it once with no focus to see
  everything, then again with a focus to start the lesson (nothing changes in between).
- **Effect**: sets `current` to the active comp. Lessons are kept **per comp** (data-model ›
  Session). If the active comp has an unfinished lesson, it **continues** it (same comp as
  before) or **resumes** it (after switching back): `baseline` and `demo` are kept, and
  `focus_layers` recomputes `targets` from the *baseline*, so earlier edits keep their credit.
  Only if the comp has no lesson, or its last check passed, does it start a **new** one (new
  baseline, `demo` reset, state → `started`). The output includes
  `"lesson": "new" | "continued" | "resumed"`.
- **Output**:
  ```json
  {
    "lesson": "new",
    "comp": { "name": "Mentor Practice", "duration": 8 },
    "findings": [
      { "layer": "Title", "property": "Position", "segments": [
          { "id": "1/ADBE Transform Group/ADBE Position/1", "display_path": "Transform › Position",
        "from_time": 0, "to_time": 1, "state": "linear" } ] }
    ],
    "skipped": [ { "layer": "Logo", "property": "Rotation", "reason": "expression" } ],
    "hidden_layers": ["Old Take"],
    "precomp_layers": ["Icon"],
    "focus": ["Title"],
    "targets": ["1/ADBE Transform Group/ADBE Position/1", "1/ADBE Transform Group/ADBE Position/2", "1/ADBE Transform Group/ADBE Scale/1", "1/ADBE Transform Group/ADBE Opacity/1"],
    "demo_target": "1/ADBE Transform Group/ADBE Position/1",
    "counts": { "linear": 11, "eased": 1, "held": 5 }
  }
  ```
- `findings` always covers the whole comp; `targets` is the focused subset that gets graded.
- `demo_target` is the first target on a visible, non-null layer (R7), or null if there is none.
  In a continued or resumed lesson it's recomputed within the new focus **only if no demo has
  happened yet**; after a demo it's always null (N6).
- `findings` is empty when there's nothing to ease (edge case). `demo_target` is then null.
- Errors: `UNKNOWN_LAYER` if a `focus_layers` name isn't in the comp.

## 2. `preview_frame`

- **Input**: `{ "time": number? }` (seconds; defaults to the current time indicator)
- **Output**: MCP image content (PNG), plus text `{ "time": 1.5 }`
- **Effect**: none on the project. Same approach as upstream `ae_preview_frame` (`saveFrameToPng`)

## 3. `set_ease`

The one demonstration (FR-006, "I do").

- **Input**: `{ "segment_id": string }`, which MUST equal the session's `demo_target`
- **Effect**: Easy Ease (speed 0, influence 33.33%) on that pair's out and in sides, as one
  undo step. Records `demo` in `session.json` (state → `demo_done`)
- **Output**: `{ "eased": "Title › Position, 0.000 s → 1.000 s", "undo": "Edit > Undo" }`
- **Errors**: `DEMO_USED`, `NOT_DEMO_TARGET`, `NO_SESSION`

## 4. `diff_since_last`

Checks the learner's attempt against the lesson baseline (FR-007).

- **Input**: `{}`
- **Effect**: takes a fresh read and sets state → `checked`. Does **not** change the baseline, so
  re-checking after a fix works
- **Output**: the Check result from the data model, for example:
  ```json
  {
    "comp_matches": true,
    "targets": [
      { "segment_id": "1/ADBE Transform Group/ADBE Position/1", "label": "Title › Position 0–1 s", "result": "eased_by_demo" },
      { "segment_id": "1/ADBE Transform Group/ADBE Position/2", "label": "Title › Position 1–2 s", "result": "eased_by_learner" },
      { "segment_id": "2/ADBE Transform Group/ADBE Opacity/1", "label": "Subtitle › Opacity 0–0.5 s", "result": "still_linear" }
    ],
    "unexpected_changes": ["Title › Scale was changed (not part of this lesson)"],
    "summary": { "learner_eased": 1, "still_linear": 1, "total_for_learner": 2 },
    "passed": false
  }
  ```
- If `comp_matches` is false, `targets` is empty and the mentor should re-snapshot (edge case).

## 5. `read_learner_record`

- **Input**: `{}`
- **Output**: the `learner.json` contents, or `{ "version": 1, "skills": {}, "lessons": [] }`
  for a new learner. Also returns `path` so the mentor can tell the learner where it is.

## 6. `record_lesson`

- **Input**: a LessonEntry without `date` (the server adds it)
- **Effect**: appends to `lessons` and updates `skills["easing.basic"]` (FR-010). Refuses
  unsafe text (`UNSAFE_RECORD`)
- **Output**: `{ "saved": true, "skill": { "status": "learned", "next": "..." } }`

## Fixture mode (evals and tests only)

When `AE_MENTOR_FIXTURE_STATE` is set, the server never contacts AE:

- The state file holds `{ "project": "<snapshot fixture path>" | "unreachable" }`, and the
  runner rewrites it between turns.
- `snapshot_project` / `diff_since_last` read the named fixture.
- `set_ease` applies the change to an in-memory copy and logs it.
- `preview_frame` returns a placeholder PNG.
- `"unreachable"` makes every AE tool fail with `AE_UNREACHABLE`.
- Every tool call is appended to `$AE_MENTOR_HOME/calls.jsonl` for the deterministic checks.
