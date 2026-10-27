# Contract: skill 5's three tools (spec 011)

**Status**: Draft, awaiting the builder's approval (2026-10-24). Amended 2026-10-26: `outside_side`
in the snapshot's `pivot_outside` note and in the check's `item1` (spec FR-019a); the hint codes
`content_shifted` and `unchanged_shape` (FR-019b). Round 3: `watch_offer` (FR-008). Round 4
(spec FR-004, B-9): `moves_case`, `position_key_time` and `rest_time` on `position_moves` entries
in `candidates` and `focus_problems`. Round 5 (spec FR-004, B-11): `position_key_label` and
`rest_label` beside them. **Adds to** spec 004's
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
   **Round 3 (spec FR-013a; T252 applies whichever cuts T251's table calls for):** with no
   `skill_options.focus`, read 1 only; with a focus, `needed` is the focus layers' check times
   and Position key times only, passed as read 1's `sample_times` when the session holds a
   baseline of the same comp, and read 2 only if one is still missing. `reads` in the output
   says which happened.
3. `session.start(read, { skill: "transform.anchor", analyze, focus_layers, mode, skill_options,
   fresh })`.

Output: `host` (`parseHost`), `lesson`, `comp`, and the analyzer result's `candidates` (names,
bucket, reason, rank, plus `moves_case` on a `position_moves` entry and `position_key_time`,
`rest_time`, `position_key_label` and `rest_label` when it's `one_key_off_rest`; data-model ›
Candidate, rounds 4 and 5), `focus_problems` (passed through, with the same fields on a
`position_moves` entry), `proposal`, `focus`, `places` (place codes only), `check_times`,
`already_there`, `targets`, `demo_target`, `no_demo_reason`, `notes` (a `pivot_outside` note
carries `side`, FR-019a), `rest_time_not_a_key`, and **`watch_offer`** (`{ layer,
suggested_place }` or `null`, data-model › Analyzer result; spec FR-008, round 3). The tool
nulls it in a review and once `demo_used` is true, whatever the analyzer gave.
The labels are made in `mentor/lib/anchor.mjs` beside the times (one helper, unit tested), not
in the tool file and never in the prompt; the tool passes them through only when present.
`annotations: { readOnlyHint: true }`.

## `anchor_demo`

Input: `{ "target": "anchor/7" }`. Order:

1. `session.assertCanDemo(target)` (`REVIEW_NO_DEMO`, `DEMO_USED`, `NOT_DEMO_TARGET`, before AE).
2. **One fresh read**, `takeSnapshot({ sample_times: [rest time] })` when the layer has Rotation or
   Scale keys, else `takeSnapshot()`; its comp not the lesson's: `NO_ACTIVE_COMP`.
3. Match the demo layer **by name** in that read; the snapshot-side refusals (data-model › Demo)
   → `ANCHOR_REFUSED` with the reason, no snippet run. These include `not_at_rest`: the layer has
   Rotation or Scale keys and the read's `comp.time` isn't within half a frame of its rest key. The
   demo target never switches to the other layer (plan › Q1, approved 2026-10-24).
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
