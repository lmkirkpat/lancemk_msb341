# Contract: skill 5's three tools (spec 011)

**Status**: Draft, awaiting the builder's approval (2026-10-24). **Adds to** spec 004's
[skill-module.md](../../004-ae-curriculum/contracts/skill-module.md) › 3 and
[shared-tools.md](../../004-ae-curriculum/contracts/shared-tools.md); doesn't repeat them. Shapes are
in [data-model.md](../data-model.md).

File: `mentor/tools/anchor.mjs`.

```js
export const SKILLS = ["transform.anchor"];
export const FINDERS = {
  "transform.anchor": {
    focus(snapshot, { exclude = [] } = {}) { /* { count: default candidates not in exclude, layers } ; 0 without layer_info */ },
    review: true,   // set once the review tests pass (FR-003, FR-024)
  },
};
export const TOOLS = [anchorSnapshot, anchorDemo, anchorCheck];
```

`registerErrors` adds one code, `ANCHOR_REFUSED`, with the message "I can't move that pivot without
changing something I shouldn't, so I've left it as it was." The reply adds the reason (data-model ›
Demo) for the mentor to say in plain words. Everything else uses existing codes.

## `anchor_snapshot`

Input (all optional): `{ "mode": "lesson" | "review", "focus_layers": [...], "skill_options":
{ "focus": [...] }, "fresh": true }`.

1. `takeSnapshot()` (read 1). If `layerInfo(read1).known` is false, reply with `no_layer_info` and
   start nothing (the skill can't run before wave B's reads).
2. `needed = neededTimes(read1)`; if any needed time is missing from any layer's samples,
   `takeSnapshot({ sample_times: needed })` (read 2). The lesson read is read 2, else read 1.
3. `session.start(read, { skill: "transform.anchor", analyze, focus_layers, mode, skill_options,
   fresh })`.

Output: `host` (`parseHost`), `lesson`, `comp`, and the analyzer result's `candidates` (names,
bucket, reason, rank only), `proposal`, `focus`, `places` (place codes only), `check_times`,
`already_there`, `targets`, `demo_target`, `no_demo_reason`, `notes`, `rest_time_not_a_key`.
`annotations: { readOnlyHint: true }`.

## `anchor_demo`

Input: `{ "target": "anchor/7" }`. Order:

1. `session.assertCanDemo(target)` (`REVIEW_NO_DEMO`, `DEMO_USED`, `NOT_DEMO_TARGET`, before AE).
2. **One fresh read**, `takeSnapshot({ sample_times: [rest time] })` when the layer has Rotation or
   Scale keys, else `takeSnapshot()`; its comp not the lesson's: `NO_ACTIVE_COMP`.
3. Match the demo layer **by name** in that read; the snapshot-side refusals (data-model › Demo)
   → `ANCHOR_REFUSED` with the reason, no snippet run.
4. `demoValues()` at the read's `comp.time` for the lesson's place.
5. `runSnippet("anchor-demo", { comp_id, layer_index, layer_name, anchor, position }, { undo: true })`;
   the snippet repeats the lock, key and expression checks before any write.
6. `session.recordDemo(target)`.

Output: data-model › Demo.

## `anchor_check`

Input: none. A fresh `takeSnapshot({ sample_times })` with the baseline's check times for the
focus, the baseline's `comp.time` and the focus's Position key times; `check(baseline, current,
lesson)` (data-model › Check result); `session.markChecked(passed, { demoUndone })` only when
`comp_matches`. Never changes the baseline. `annotations: { readOnlyHint: true }`.

## `allowed-tools` for `.claude/skills/anchor-mentor/SKILL.md`

`mcp__ae-mentor__anchor_snapshot`, `mcp__ae-mentor__anchor_demo`, `mcp__ae-mentor__anchor_check`,
`mcp__ae-mentor__read_learner_record`, `mcp__ae-mentor__preview_frame`,
`mcp__ae-mentor__record_lesson`, `mcp__ae-mentor__recommend_next`. No `after-effects` tool.
