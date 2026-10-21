# Contract: skill 2's three tools (spec 008)

**Status**: Draft, awaiting the builder's approval. **Adds to** spec 004's
[skill-module.md](../../004-ae-curriculum/contracts/skill-module.md) › 3 (what every skill's three
tools must do) and [shared-tools.md](../../004-ae-curriculum/contracts/shared-tools.md); doesn't
repeat them. Shapes are in [data-model.md](../data-model.md).

File: `mentor/tools/speed-graph.mjs`.

```js
export const SKILLS = ["easing.speed_graph"];
export const FINDERS = {
  "easing.speed_graph": {
    focus(snapshot, { exclude = [] } = {}) { /* { count, layers } from analyze() with the same exclude */ },
    review: true,   // set in the first build once the review tests pass (FR-021)
  },
};
export const TOOLS = [speedGraphSnapshot, speedGraphDemo, speedGraphCheck];
```

No `registerErrors` call: every error this skill raises uses an existing code (`NO_SESSION`,
`DEMO_USED`, `NOT_DEMO_TARGET`, `REVIEW_NO_DEMO`, `UNKNOWN_LAYER`, `AE_UNREACHABLE`, `AE_BUSY`).

## `speed_graph_snapshot`

Input:

```json
{
  "focus_layers": ["Title"],
  "mode": "lesson",
  "skill_options": { "eased_layers": ["Title"], "land_hard": [] }
}
```

All optional. `mode` is `"lesson"` (default) or `"review"`. Calls `takeSnapshot()`, then
`session.start(snapshot, { skill: "easing.speed_graph", analyze, focus_layers, mode,
skill_options })`. The session doesn't pass `mode` to the analyzer, so the tool passes a wrapper,
`analyze: (snap, o) => analyze(snap, { ...o, mode })`, so a review picks its one layer and property
(as built, 2026-10-21; spec › Open questions asks the shared owner whether the session should pass
it).

Output: `host` (from `parseHost`), `lesson` (`new`, `continued`, `resumed`), `mode`, `comp`, and
the analyzer result's `focus`, `targets`, `demo_target`, `no_demo_reason` (`demo_used` once the
demo has run), `left_out`, `ease_first_count`, `candidates_count`, `other_candidates`, `pairs`
(data-model › Analyzer result).
`annotations: { readOnlyHint: true }`.

## `speed_graph_demo`

Input: `{ "segment_id": "1/ADBE Transform Group/ADBE Position/1" }`.

Order: `session.assertCanDemo(segment_id)` (before any AE call) → `runSnippet("speed-graph-demo",
{ comp_id, layer_index, property_path, key_index, out_influence: DEMO_OUT, in_influence: DEMO_IN },
{ undo: true })` → `session.recordDemo(segment_id)`. The influences come from the lib's constants
(data-model › Demo result).
Output: data-model › Demo result. Never runs in a review (`REVIEW_NO_DEMO`), twice
(`DEMO_USED`), or off target (`NOT_DEMO_TARGET`).

## `speed_graph_check`

Input:

```json
{ "seen_shaped": ["1/ADBE Transform Group/ADBE Position/4"] }
```

Optional: the `seen_shaped` list from the previous check's output (research R7). Calls
`takeSnapshot()`, grades against `session.currentLesson().baseline` and the lesson's targets minus
`skill_options.land_hard`, lists other changes with `unexpectedChanges`, and calls
`session.markChecked(passed, { demoUndone })` only when the comp matches. Never changes the
baseline. Output: data-model › Check result. `annotations: { readOnlyHint: true }`.

## Snippet `speed-graph-demo` and its twin

- `mentor/jsx/speed-graph-demo.jsx`: research R6. Errors: the same "not the lesson's comp" and
  "keys don't exist" messages as `set-ease.jsx`; a failed verify throws asking for Edit > Undo.
- `mentor/fixture/speed-graph-demo.mjs`: `run(args, { snapshot, saveEdit })` returns the demo
  result and saves `{ layer_index, property_path, key_index }`; `apply(snapshot, edit)` sets the
  same two facing sides to `DEMO_OUT`/`DEMO_IN`, speeds and every other side untouched.

## The prompt's `allowed-tools`

`mcp__ae-mentor__speed_graph_snapshot`, `mcp__ae-mentor__speed_graph_demo`,
`mcp__ae-mentor__speed_graph_check`, `mcp__ae-mentor__read_learner_record`,
`mcp__ae-mentor__preview_frame`, `mcp__ae-mentor__record_lesson`, `mcp__ae-mentor__recommend_next`
(spec 004 contract › 3's shared list).
