# Contract: skill 1's three tools (spec 009)

**Status**: Draft, awaiting the builder's approval. **Adds to** spec 004's
[skill-module.md](../../004-ae-curriculum/contracts/skill-module.md) › 3 and › 6 and
[shared-tools.md](../../004-ae-curriculum/contracts/shared-tools.md); doesn't repeat them. Shapes
are in [data-model.md](../data-model.md).

File: `mentor/tools/key-types.mjs`.

```js
export const SKILLS = ["keyframes.types"];
export const FINDERS = {
  "keyframes.types": {
    focus(snapshot, { exclude = [] } = {}) { /* { count: candidate properties not in exclude, layers } */ },
    review: true,   // set in the first build once the review tests pass (FR-009, FR-019)
  },
};
export const TOOLS = [keyTypesSnapshot, keyTypesDemo, keyTypesCheck];
```

No `registerErrors`: errors use existing codes (`NO_SESSION`, `DEMO_USED`, `NOT_DEMO_TARGET`,
`REVIEW_NO_DEMO`, `UNKNOWN_LAYER`, `LESSON_UNDERWAY`, `AE_UNREACHABLE`, `AE_BUSY`).

## `key_types_snapshot`

Input (all optional):

```json
{
  "mode": "lesson",
  "fresh": false,
  "skill_options": {
    "focus": [{ "layer": "Blink", "property": "Opacity" }],
    "should_move": [{ "layer": "Title", "property": "Opacity" }]
  }
}
```

Calls `takeSnapshot()`, then `session.start(snapshot, { skill: "keyframes.types", analyze,
focus_layers: <focus layer names>, mode, skill_options, fresh })`. `LESSON_UNDERWAY` is passed
through unchanged (FR-007).

Output: `host`, `lesson`, `comp`, and the analyzer result's `focus`, `targets`, `demo_target`,
`no_demo_reason` (with research R1's review rule), `candidates`, `refused`, `held_examples`,
`left_out`. `annotations: { readOnlyHint: true }`.

## `key_types_demo`

Input: `{ "segment_id": "<pair ID>" }`. Order: `session.assertCanDemo` → `runSnippet("key-types-demo",
{ comp_id, layer_index, property_path, key_index }, { undo: true })` → `session.recordDemo`.
Output: data-model › Demo result.

## `key_types_check`

Input (all optional):

```json
{
  "should_move": [{ "layer": "Title", "property": "Position" }],
  "constant_speed": { "layer": "Spinner", "property": "Rotation" }
}
```

`should_move` is added to the stored list for this check (union). `constant_speed` is stage 6's
named move (or one volunteered in a review, H-4). Calls `takeSnapshot()`, grades against the
lesson's baseline and targets, computes the constant-speed verdict, and **only on `linear`** calls
`session.keepLinear(snapshot, refs)`. Calls `session.markChecked(passed, { demoUndone })` only when
the comp matches; never changes the baseline. Output: data-model › Check result.

The mark reaches `learner.json` only through the shared `record_lesson` (contract › 6). No input
on any tool writes a mark directly.

## Snippet `key-types-demo` and its twin

- `mentor/jsx/key-types-demo.jsx`: research R4; `HOLD_SIDES` constant at the top.
- `mentor/fixture/key-types-demo.mjs`: `run` returns the demo result and saves `{ layer_index,
  property_path, key_index }`; `apply` sets the key's out type (and in type when `HOLD_SIDES` is
  `"both"`) to `hold`, nothing else.

## The prompt's `allowed-tools`

`mcp__ae-mentor__key_types_snapshot`, `mcp__ae-mentor__key_types_demo`,
`mcp__ae-mentor__key_types_check`, `mcp__ae-mentor__read_learner_record`,
`mcp__ae-mentor__preview_frame`, `mcp__ae-mentor__record_lesson`, `mcp__ae-mentor__recommend_next`.
