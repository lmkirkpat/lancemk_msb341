# Contract: skill 3's three tools (spec 010)

**Status**: Draft, awaiting the builder's approval; amended 2026-10-26 after live checks L-1 to L-4
(`quick_offset`, the locked skip, the demo credit). **Adds to** spec 004's
[skill-module.md](../../004-ae-curriculum/contracts/skill-module.md) › 3 and
[shared-tools.md](../../004-ae-curriculum/contracts/shared-tools.md); doesn't repeat them. Shapes
are in [data-model.md](../data-model.md).

File: `mentor/tools/offset.mjs`.

```js
export const SKILLS = ["timing.offset"];
export const FINDERS = {
  "timing.offset": {
    focus(snapshot, { exclude = [] } = {}) { /* { count: members of the proposed group, layers } */ },
    review: true,   // set once the review tests pass (FR-003, FR-020)
  },
};
export const TOOLS = [offsetSnapshot, offsetDemo, offsetCheck];
```

`registerErrors` adds one code, `OFFSET_REFUSED`, with the message "I can't shift that one without
changing something I shouldn't, so I've left it as it was." The tool's reply adds the reason
(`past_comp_end`, `locked`, `gap_under_floor`, `not_whole_frames`) for the mentor to say in plain
words. Everything else uses existing codes.

## `offset_snapshot`

Input (all optional):

```json
{
  "mode": "lesson",
  "focus_layers": ["Dot 1", "Dot 2", "Dot 3"],
  "skill_options": { "kind": "layers", "order": ["Dot 1", "Dot 3", "Dot 2"], "gap_frames": 4, "split": [] }
}
```

Calls `takeSnapshot()`, then `session.start(snapshot, { skill: "timing.offset", analyze,
focus_layers, mode, skill_options })`. Output: `host`, `quick_offset`, `lesson`, `comp`, the
analyzer result's `group`, `proposed_kind`, `other_kind`, `left_out`, `targets`, `demo_target`,
`no_demo_reason`, `focus`, `frame_together`, and `floor_check: { gap_under_floor }` when
`gap_frames` is given (so the mentor can say a gap that small still reads as together, naming no
number, FR-007). `annotations: { readOnlyHint: true }`.

- **`quick_offset`** (boolean, added 2026-10-26, T035): `atLeast(host, "25.4")`, so `true` only
  when the version is known and 25.4 or later, `false` otherwise (unknown included). The prompt
  offers Quick Offset only when it's `true` and never compares versions itself (FR-017).
- **`demo_target`** (amended 2026-10-26, L-4): the pick skips a member with an expression on a
  keyed property, an eye-off member, or a **locked** member (FR-009). `no_demo_reason` adds this
  skill's `expression` and `locked` (none left after the skips; `locked` when a lock ruled out the
  last one) to data-model's list.

## `offset_demo`

Input: `{ "target": "layer/5" }`. Order (as built, 2026-10-21):

1. `session.assertCanDemo(target)` (`REVIEW_NO_DEMO`, `DEMO_USED`, `NOT_DEMO_TARGET`, before AE).
2. **One fresh read**, `takeSnapshot()`; if its comp isn't the lesson's, `NO_ACTIVE_COMP`.
3. Match the demo layer **by name** in that read (by index when names repeat) and list its
   property paths as they are now.
4. The refusals on that read (research R5: not whole frames, under the floor, locked where the
   read shows it, a key past the comp's end) → `OFFSET_REFUSED` with the reason, no snippet run.
5. `runSnippet("offset-demo", { comp_id, layer_index, property_paths, shift_frames }, { undo: true })`;
   the snippet repeats the lock and comp-end checks itself before any write. Since 2026-10-26 the
   snapshot never names a locked member, so the lock refusals here are the backstop for a lock set
   after the snapshot (L-4 confirmed: refused, nothing changed).
6. `session.recordDemo(target)`.

`shift_frames` is the stored `gap_frames`. Output: data-model › Demo result.

## `offset_check`

Input (optional): `{ "split": ["Dot 2"] }`, added to the stored list for this check. Calls
`takeSnapshot()`, grades against the lesson's baseline and group, calls `session.markChecked(passed,
{ demoUndone })` only when the comp matches, never changes the baseline. Output: data-model › Check
result. The demo member's credit reads the session's undone mark first (2026-10-26, T034): once a
check has seen the demo undone, any later shift is the learner's; with no check between an undo
and the same shift by hand, it's still the demo's (FR-011's limit).

## Snippet `offset-demo` and its twin

- `mentor/jsx/offset-demo.jsx`: research R5; throws `OFFSET_REFUSED: <reason>` before any write.
- `mentor/fixture/offset-demo.mjs`: `run` applies the same refusals on the fixture snapshot, returns
  the demo result and saves `{ layer_index, property_paths, shift_frames }`; `apply` adds
  `shift_frames / frame_rate` to every key time on those paths, keeping every other key field.

## The prompt's `allowed-tools`

`mcp__ae-mentor__offset_snapshot`, `mcp__ae-mentor__offset_demo`, `mcp__ae-mentor__offset_check`,
`mcp__ae-mentor__read_learner_record`, `mcp__ae-mentor__preview_frame`,
`mcp__ae-mentor__record_lesson`, `mcp__ae-mentor__recommend_next`.
