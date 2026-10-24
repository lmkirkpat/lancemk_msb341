# Contract: skill 6's three tools (spec 012)

**Status**: Draft, awaiting the builder's approval (2026-10-24). **Adds to** spec 004's
[skill-module.md](../../004-ae-curriculum/contracts/skill-module.md) › 3 and
[shared-tools.md](../../004-ae-curriculum/contracts/shared-tools.md); doesn't repeat them. Shapes are
in [data-model.md](../data-model.md).

File: `mentor/tools/null-parenting.mjs`.

```js
export const SKILLS = ["parenting.null"];
export const FINDERS = {
  "parenting.null": {
    focus(snapshot, { exclude = [] } = {}) { /* { count: size of the proposal, layers }; 0 without layer_info */ },
    review: true,   // set once the review tests pass (FR-003, FR-024)
  },
};
export const TOOLS = [nullParentSnapshot, nullParentDemo, nullParentCheck];
```

`registerErrors` adds one code, `NULL_PARENT_REFUSED`, with the message "I can't parent that one
without it moving or changing something I shouldn't, so I've left it as it was." The reply adds the
reason (data-model › Demo).

## `null_parent_snapshot`

Input (all optional): `{ "mode": "lesson" | "review", "skill_options": { "focus": [...] } }`.

1. `takeSnapshot()`. If `layerInfo(read).known` is false, reply `no_layer_info`, start nothing.
2. If `skill_options.focus` is given and differs from the open lesson's (or there is none), check
   every name is unique in the read (`rename_needed` otherwise, no lesson change), then
   `session.start(read, { skill: "parenting.null", analyze, mode, skill_options, fresh: true })`
   (`LESSON_UNDERWAY` after a demo or check). Otherwise `session.start` without `fresh`.

Output: `host`, `lesson`, `comp`, and the analyzer result's `proposal`, `left_out`,
`rename_needed`, `focus`, `targets`, `demo_target`, `no_demo_reason`, `before_time`, `notes`.
`annotations: { readOnlyHint: true }`.

## `null_parent_demo`

Input: `{ "target": "parent/Tile" }`. Order:

1. `session.assertCanDemo(target)` (`REVIEW_NO_DEMO`, `DEMO_USED`, `NOT_DEMO_TARGET`, before AE);
   `skill_data.stored` absent → `NULL_PARENT_REFUSED` (`null_not_ready`).
2. **One fresh read** with `sample_times` = the target's P2 times; comp not the lesson's:
   `NO_ACTIVE_COMP`.
3. Find the null and the target by name; the refusals (data-model › Demo, FR-017) →
   `NULL_PARENT_REFUSED`, no snippet run. These include `null_scale_zero`: the null's Scale is 0 on
   an axis at the read's `comp.time`, so `toLayerSpace` would return `singular` (plan › Q2, approved
   2026-10-24). While no focus layer is parented to the null, re-store it (`setSkillData`).
4. `runSnippet("null-parent-demo", { comp_id, layer_index, layer_name, null_index, null_name }, {
   undo: true })`; the snippet repeats the lock and parent checks before writing.
5. `session.recordDemo(target)`.
6. A second read with the same `sample_times`; P2 for the target through the stored null →
   `moved_px`, `jumped`. Never retried.

## `null_parent_check`

Input: data-model › Check input. A fresh `takeSnapshot({ sample_times })` with the union of the
focus's P2 times; find and store the null (research R5); `check(baseline, current, skill_data)`;
`setSkillData` with what it stored; `session.markChecked(passed, { demoUndone })` when the comp
matches, except on `null_parent_moves`. Never changes the baseline. `annotations: { readOnlyHint:
false }` (it writes `skill_data`; nothing in After Effects).

## `allowed-tools` for `.claude/skills/null-parenting-mentor/SKILL.md`

`mcp__ae-mentor__null_parent_snapshot`, `mcp__ae-mentor__null_parent_demo`,
`mcp__ae-mentor__null_parent_check`, `mcp__ae-mentor__read_learner_record`,
`mcp__ae-mentor__preview_frame`, `mcp__ae-mentor__record_lesson`,
`mcp__ae-mentor__recommend_next`. No `after-effects` tool.
