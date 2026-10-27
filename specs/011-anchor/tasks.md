---
description: "Task list for spec 011: skill 5, set the pivot"
---

# Tasks: Set the pivot (curriculum skill 5)

**Status**: Approved 2026-10-24, with plan › Q1 (`not_at_rest`; the demo target stays entry 1) and
SR-2 (spec 004 T164, T165). Ready for the skill builder. **Amended 2026-10-26** (spec › Changes
2026-10-26): Phase 8b, T241 to T244, before the live lessons; awaiting the builder's approval.
**Round 3 (2026-10-26):** Phase 8d, T249 to T253 (the watch offer; the lesson-start speed), from
spec › Changes › round 3; the builder approved both items. **Round 4 (2026-10-26):** Phase 8e,
T254 to T256 (D-8's two-frames sentence with `moves_case`; D-9's full-frame test), from spec ›
Changes › round 4; the builder approved D-8 and D-9. **Round 5 (2026-10-26):** Phase 8f, T257 and T258
(TD § 19's opening turn, in progress; B-11's time labels), from spec › Changes › round 5; TD § 19
and B-11 approved by the human, this phase awaiting the builder's approval. **Round 6
(2026-10-26):** Phase 8g, T259 (TD § 19a's B-12 in `SKILL.md`, in progress), from spec › Changes ›
round 6; TD § 19a decided by the human, this phase awaiting the builder's approval. **Round 7
(2026-10-26):** Phase 8h, T260 (TD § 19b's B-13 in `SKILL.md`, plus the smoke run's self-note fix;
in progress) and T261 (L-8, 🖐, listed after T248 in Phase 8c's list for the next sitting), from
spec › Changes › round 7; TD § 19b decided by the cockpit under the human's go-ahead, this phase
awaiting the builder's approval.

**Input**: Design documents from `specs/011-anchor/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/tools.md](contracts/tools.md),
[quickstart.md](quickstart.md); spec 004's
[skill-module.md](../004-ae-curriculum/contracts/skill-module.md),
[shared-tools.md](../004-ae-curriculum/contracts/shared-tools.md) and
[data-model.md](../004-ae-curriculum/data-model.md) › Wave B shapes. The teaching design is
[teaching-design.md](teaching-design.md) ("TD §", read only).

**Starts after**: spec 004's wave B shared merge
([tasks-wave-b.md](../004-ae-curriculum/tasks-wave-b.md) T100 to T163, including T160, this
spec's SR-1, and T161 to T163, spec 012's), which is on main as an early merge (d009d35) for the
cloud part. **Phase 8's live tasks wait for spec 004's T133 to T136** (the live captures and the
corner math's answer keys) **and T158** (auto-orient). Runs in parallel with spec 012's builder
through Phase 7; the two sittings don't overlap (one AE lock).

**Tests**: included and written first (FR-027 to FR-029, SC-006).

## Add-only: the files this branch may touch

The skill-builder **only adds** these files and changes **no existing file** under `mentor/`,
`bridge/` or `.claude/skills/*-mentor/` (`ownership.json` › addOnly; `.claude/README.md` › Run a
parallel job, step 4), and nothing under `product/evals/`, `panel/` or `discovery/`. The merge
check is `node .claude/hooks/check-branch.mjs <branch> skill-builder main` **without**
`--shared-owner`: every path it lists must be in this table, and every one must be an add.

| Added file | Tasks |
|---|---|
| `mentor/lib/anchor.mjs` | T208, T209, T210, T216, T235 |
| `mentor/lib/anchor-check.mjs` | T211, T212, T223 |
| `mentor/tools/transform-anchor.mjs` (not `anchor.mjs`: see Requests › SR-3) | T218, T223, T226 |
| `mentor/jsx/anchor-demo.jsx` | T216, T235 |
| `mentor/fixture/anchor-demo.mjs` | T217 |
| `mentor/test/anchor-{measures,candidates,check,tools,demo,overlap}.test.mjs` | T204–T207, T214, T215, T221, T225, T228, T234 |
| `mentor/test/fixtures/anchor/` (README, `load.mjs`, answer key, records, synthetic, stand-ins, live captures) | T202, T203, T213, T220, T225, T233, T234 |
| `.claude/skills/anchor-mentor/SKILL.md` | T219, T222, T224, T227, T235 |

Shared changes go in **Requests** and the hand-back, never in a task. The builder may check off
`specs/011-anchor/tasks.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks).
- **[Story]**: US1 (set a layer's pivot without it moving), US2 (on a layer that's already
  animated), US3 (review), from spec.md.
- **🖐 Live**: After Effects 26.5 on the builder's Mac and the AE lock (`decisions/008`). All but
  the last are in **one sitting** (Phase 8). Everything before Phase 8 runs in the cloud.

---

## Phase 1: Setup (cloud)

- [x] T201 Confirm the base: `cd mentor && npm test` green (note the count; 686 on 2026-10-24); `mentor/lib/layer-info.mjs` exports `layerInfo`, `byIndex`, `byName`; `mentor/lib/comp-space.mjs` exports `footprint`, `compPosition`, `compMatrix`, `layerMatrix`, `toLayerSpace` and returns the reasons `no_layer_info`, `no_layer`, `not_sampled`, `three_d`, `auto_orient`, `no_rect`, `singular`; `mentor/lib/visibility.mjs` exports `classOf`; `mentor/lib/motion-sources.mjs` exports `sourcesOf`; `takeSnapshot({ sample_times })` exists in `mentor/lib/snapshot.mjs`; `mentor/dev/capture.mjs` takes `--times`; `mentor/dev/build-practice-comp-2b.jsx` builds T157's skill 5 layers with T160's four additions (Plaque, Flip, Wobble, Seal). If any is missing, stop and hand back
- [x] T202 Create `mentor/test/fixtures/anchor/README.md`: every fixture, its source (live capture and sitting step; spec 004's capture read in place; synthetic and which overlap row allows it; or stand-in for which live file), the `--times` list each capture needs (research R4), and the rule that stand-ins are deleted before merge (research R9)

---

## Phase 2: Foundational (cloud, blocking): measures, candidates, check

**⚠️ No user story phase starts until this phase is green.**

### Tests first

- [x] T203 [P] Write fixtures: `mentor/test/fixtures/anchor/stand-in/build.mjs` and the stand-ins it writes, each `"synthetic": "stand-in for <live file>"`: `practice2b.json` from `build-practice-comp-2b.jsx`'s declared values (Door, Needle, Banner, Sign, Lid, Gauge, Pop, Sled, Hatch with Hatch Rig, Tab, Peg, Plaque, Flip, Wobble, Seal, with `layer_info` and samples at every key time and 0 s), `overlaps.json` from `build-overlaps-b.jsx` (Drift, Gauge Dial, Leaf 2, Wipe, Guide Grid, Depth, Locked Bar, Orbit), and one stand-in per quickstart › 3 capture; the permanent synthetics in `synthetic/` (rows 1, 6, 8, 16, 26, 27, a shy candidate for row 13, Anchor Point's stopwatch turned on, a 70-key layer for the sample cap, the FR-028 edge layers: an 800 × 60 bar, a 30 × 400 needle, a 10 px line, Scale 200%, Scale [-100, 100]), each marked synthetic; `load.mjs` (prefers a live capture in this folder, then spec 004's `mentor/test/fixtures/layer-info/<name>.json`, then the stand-in); and `answer-key.json`: per fixture, each layer's bucket, reason and rank, place now, rest key and basis, and per planted attempt the check result and hint codes (data-model)
- [x] T204 [P] Write `mentor/test/anchor-measures.test.mjs` (FR-010, FR-011, FR-028, research R2, R3): on the 800 × 60 bar, the tolerance is 80 px across and 6 px up and down, and top-left, middle-left and bottom-left stay three places; on the 30 × 400 needle the 3 px floor applies across; on a 10 px line the floor applies on both axes; exactly at 10% passes and just past fails on each axis; `placeNow` gives `outside` and `between`; Scale 200% and Scale [-100, 100] measured in their own space give the same place as at 100%; the rest key: both at one key (`both`), none sharing (`scale`), Rotation only with none at 0 (`closest_rotation`, D-1), 359.6° counts as a whole turn and 359.4° doesn't (0.5°), ties to the earliest, a learner `rest_time` that is a key (`learner`) and one that isn't (`rest_time_not_a_key`); no key: the baseline's `comp.time` (`current`)
- [x] T205 [P] Write `mentor/test/anchor-candidates.test.mjs` (FR-003 to FR-009, research R1, R5): on `practice2b.json` every layer's bucket, reason and rank as the answer key says, built from `layer_info` (Door and Tab are candidates with no keys at all, filter 2); shapes are `if_named` with `shape_until_l1` while `SHAPES_DEFAULT` is false; a matte is `if_named` with reason `matte`, never `hidden` (filter 3); Locked Bar `if_named` with `locked`; Wobble, Seal, Depth, nulls and adjustment layers `never`; Hatch ranks below the unparented ones and gets the `parent` note; a full-frame solid ranks last by area, and with `comp.width` and `comp.height` present (stand-ins carry them, marked synthetic) is `if_named` with `full_frame`, and without them `full_frame` is `null`; the D-3 rule: an anchor at its rect's center or at [0, 0] ranks the same; a zero-area footprint at the check time is `never` with `cant_read`; `skill_options.focus` gives targets `anchor/<index>` and one `target_refs` entry `{ layer, property: "Anchor Point" }` each; Sign with "center" isn't already there (its pivot is on the baseline) and a layer already at its named place is in `already_there` with no target (FR-007); a duplicate name gives `name_not_unique`; demo target entry 1 when it's `default`, else entry 0, else `not_a_default_candidate`; `FINDERS["transform.anchor"].focus` count above 0 exactly when a `default` candidate not in `exclude` exists, on every fixture, and 0 without `layer_info`; `neededTimes` lists every candidate's rest-key and Position key times, at most 63
- [x] T206 [P] Write `mentor/test/anchor-check.test.mjs` (FR-012, FR-013, FR-016, FR-018, FR-019, research R7): item 2 at 0.9 px passes and 1.1 px fails on each edge; item 4 fails on a slide at one Position key time with item 2 passing; item 5 fails when another layer moved 2 px, ignores a child of the focus at times other than the focus's check time, and fails on a new Anchor Point key on the focus; matching by name, by index when a name repeats; each comp-space reason on a focus layer (`not_sampled`, `no_rect`, `three_d`, `auto_orient`, `no_layer`, and `singular` through a wrapped call) makes it `cant_check` and holds the pass, and on another layer goes to `not_compared`, never "didn't move" (filter 6); the 70-key layer's late keys dropped by the cap narrow item 5 and never fail it; the playhead moved between reads changes nothing (row 26); credit `demo` within 0.01 px of the written anchor, `undone` after, then `learner`; `comp_matches: false` on another comp
- [x] T207 [P] Write other-changes and hint tests in `mentor/test/anchor-check.test.mjs` (FR-019, data-model › Hint codes): `anchor_changed` on another, unkeyed layer (Pan Behind on Background, filter 1: `unexpectedChanges()` would miss it), `eye_changed`, `keys_added` on Anchor Point or Position anywhere, `layer_added`, `layer_removed`, `renamed`; one test per TD § 7 row giving exactly its hint code and no other (`moved_with_pivot`, `layer_dragged`, `not_moved_enough`, `neighbour_place`, `outside`, `wrong_layer`, `group_anchor`, `away_from_rest`, `slid_at_key`, `stopwatch`, `matte_eye`, `locked`, `cant_check`)

### Implementation

- [x] T208 Create `mentor/lib/anchor.mjs` (pure) with the nine place codes, `placePoint`, `inPlace`, `placeNow` (research R2), `RECT_KIND`, `SHAPES_DEFAULT = false`, and `restKey` and `checkTime` (research R3). Every comp-space value through `mentor/lib/comp-space.mjs`; no matrix math of its own beyond reading `layerMatrix`'s linear part. T204 passes
- [x] T209 In `mentor/lib/anchor.mjs`: `candidates(snapshot)` from `layerInfo`, `classOf`, `sourcesOf` and the keyed `layers`, with buckets, reasons and research R1's ranking (no eye-switch filter, no re-derived class or parent chain, FR-002); `full_frame` from `snapshot.comp.width` and `height` when present, else `null` (SR-2, never assumed)
- [x] T210 In `mentor/lib/anchor.mjs`: `neededTimes(snapshot)` (research R4), `analyze(snapshot, { focus_layers, exclude, kept_linear, skill_options })` → data-model › Analyzer result, and `finder(snapshot, { exclude })`. T205 passes
- [x] T211 Create `mentor/lib/anchor-check.mjs` (pure): `check(baseline, current, lesson)` → data-model › Check result, items 1 to 5 from `footprint()` with `RECT_KIND`'s rectangle for both item 1 and item 2 (filter 5). T206 passes
- [x] T212 In `mentor/lib/anchor-check.mjs`: `otherChanges(baseline, current, focusIndexes)` from `layer_info` for every layer, never `unexpectedChanges()`, and `hintCodes(layerResult, otherChanges)`. T207 passes

**Checkpoint**: `npm test` green; nothing outside the add-only table touched.

---

## Phase 3: User Story 1 — Set a layer's pivot without it moving (P1) 🎯 MVP

**Goal**: a lesson on Door to a verified pass, with no demo for one focus layer.

**Independent test**: in fixture mode on the `practice2b.json` stand-in, the tools propose Door with
its left edge, refuse a demo with one focus layer, and grade each planted Door attempt as the
answer key says.

### Tests first

- [x] T213 [P] [US1] Write `mentor/test/fixtures/anchor/records/easing-learned.json` (version 1, easing learned, nothing for this skill, no names)
- [x] T214 [P] [US1] Write `mentor/test/anchor-demo.test.mjs` (FR-015, FR-029, research R6): `demoValues` keeps the footprint within 1 px (with comp-space's math) on a rotated, a scaled, a flipped and a parented layer, and on a layer at Scale 0 on one axis (no inversion, no `singular`); `assemble("anchor-demo", args)` builds with the shared ES3 libraries and no ES5+ syntax; the snippet's source never sets a key (`setValueAtTime`, `addKey`) and writes X and Y on a separated layer; the twin's `apply` writes the anchor and position into `transform` and every sample and leaves `rect` unchanged; its `run` refuses (`ANCHOR_REFUSED`, nothing saved) on a locked, 3D, collapsed, Anchor Point- or Position-keyed layer, an expression, and `not_at_rest`
- [x] T215 [US1] Write `mentor/test/anchor-tools.test.mjs` in fixture mode (temp `AE_MENTOR_HOME`, `mentor/test/helpers.mjs`): `anchor_snapshot` with no `skill_options` proposes Door with a hinge and lists leave-outs with reasons; with `skill_options.focus` of Door alone, `targets` is one and `demo_target` is `null` with `single_target` (filter 4, pinned); a later call without `skill_options` keeps the focus; `fresh: true` restarts before a check and is refused with `LESSON_UNDERWAY` after; with `layer_info` removed it returns `no_layer_info` and starts nothing; `anchor_check` grades `door-pass`, `door-typed` and `door-dragged` as the answer key says, calls `markChecked` only when the comp matches and never changes the baseline; tool names start with `anchor_`, `SKILLS` is `["transform.anchor"]`, and `registerErrors` adds `ANCHOR_REFUSED`

### Implementation

- [x] T216 [US1] In `mentor/lib/anchor.mjs`, add `demoValues(sample, rect, place)` (research R6); create `mentor/jsx/anchor-demo.jsx` (ES3) per contracts/tools.md: args `{ comp_id, layer_index, layer_name, anchor, position }`, every refusal before any write (`ANCHOR_REFUSED: <reason>`), Anchor Point then Position (or X and Y), Z kept, never a key, the values before and after returned. Don't edit any existing snippet or `mentor/jsx/lib/`
- [x] T217 [US1] Create `mentor/fixture/anchor-demo.mjs` (`run`, `apply`, spec 004 contract › 5). T214 passes
- [x] T218 [US1] Create `mentor/tools/transform-anchor.mjs`: `registerErrors({ ANCHOR_REFUSED: … })` at import with contracts/tools.md's message; `SKILLS`, `FINDERS` (`review: false` for now); the three tools per contracts/tools.md and spec 004 contract › 3 (read 1, the second sampled read when `neededTimes` has a missing time, `session.start` with `skill`, `analyze`, `focus_layers`, `mode`, `skill_options`, `fresh`; `assertCanDemo` and the snapshot-side refusals, including `not_at_rest` when the target has Rotation or Scale keys and the read's `comp.time` isn't within half a frame of its rest key (plan › Q1; the demo target stays entry 1, never switched), before `runSnippet("anchor-demo", …, { undo: true })`, then `recordDemo`; the check's `sample_times` and `markChecked(passed, { demoUndone })` only when the comp matches). T215 passes
- [x] T219 [US1] Write `.claude/skills/anchor-mentor/SKILL.md` (draft): frontmatter `name: anchor-mentor`, a description triggering on "/anchor-mentor", "pivot", "anchor point", "it swings wide", "turn from the edge", and `allowed-tools` from contracts/tools.md. Body: TD § 5's stages: stage 1 the intent question in both forms first (FR-006), one proposal with a hinge that suits its shape when they have none (H-5), leave-outs one sentence per reason from TD § 4 (a matte never called hidden, FR-009), a parented layer named once and no "trace this one first" (FR-009); stage 2 the place repeated as "the middle of Door's left edge", where the pivot is now in place words, TD § 1's two sentences once, one frame from `preview_frame` with the layer in it, never "you can see the pivot here" (FR-022); stage 3 Pan Behind (Y), A, P, Shift+P; stage 4 no demo with one focus layer, a walkthrough in words (FR-014), with two: A then Shift+P asked first, frames before and after at the same time, "both numbers changed, and Door didn't move" (FR-017); stage 5 the check and TD § 7's hints by hint code, never a number to type or a tolerance (SC-004), never the fix or an offer, "do it for me" declined; `cant_check` said plainly, never "it didn't move" (FR-018); the understanding check after a pass, one light correction, never gating (FR-020); stage 6 the ungraded "try it" and Edit > Undo (FR-021); stage 7 `record_lesson` per FR-025 (layer and place, whether the first try moved the layer, the understanding answer; no pixels, method, motive or names). Version (FR-023): Quick Set Anchor never brought up, one or two plain sentences if asked, no steps, no refusal; Center Anchor Point marked `<!-- L-3 -->` and not named; no crosshair snapping; the Properties panel "you may also see it there". Copy the hard rules block from `.claude/skills/ease-mentor/SKILL.md` › Hard rules (reading it, not editing it)

**Checkpoint**: US1 in fixture mode on stand-ins.

---

## Phase 4: User Story 2 — Set the pivot on a layer that's already animated (P1)

**Goal**: the rest key named and checked on Gauge and Pop, Position keys held still on Sled, and
the demo on the second of two focus layers.

- [x] T220 [P] [US2] Add to `answer-key.json` the keyed attempts: Gauge at its 0° key and away from it, Pop set at its Scale 0 key (`pop-shrunk`, hint `away_from_rest`) and at full size, Sled slid at a Position key (`slid_at_key`), and two-focus demos (Door with Tab, Gauge with Peg)
- [x] T221 [US2] Add keyed tests to `mentor/test/anchor-tools.test.mjs`: on Pop the check time is its full-size key and on Gauge its 0° key, and the snapshot's second read samples them on every layer including Hatch Rig's children (FR-013); `anchor_check` passes those times as `sample_times`; with two focus layers the demo target is entry 1, `anchor_demo` off target throws `NOT_DEMO_TARGET`, twice `DEMO_USED`, with the playhead off the rest key `ANCHOR_REFUSED` (`not_at_rest`), each with no snippet run; the twin's result passes the check; after the demo is undone the layer is the learner's
- [x] T222 [US2] Add the keyed parts to `.claude/skills/anchor-mentor/SKILL.md`: the rest key named in plain words with a request for the playhead there before they start (FR-011), the `scale` and `closest_rotation` bases said in one sentence with "is that how it looks at rest?", a learner's own rest pose passed back as `rest_time`; the Position-keyed tip once (TD § 4, wording marked `<!-- L-2 -->`); `not_at_rest` turned into a playhead request; the rest hint and the slide hint by code; the "play it back" sentence when Rotation or Scale is keyed (FR-021)
- [x] T223 [US2] Confirm `mentor/tools/transform-anchor.mjs` and `mentor/lib/anchor-check.mjs` handle item 4 and the second read as T221 needs; adjust those files only. T221 passes

---

## Phase 5: User Story 3 — Review the skill in a later session (P2)

**Goal**: review mode in the first build: a new layer, the hinge asked first, no demo, walkthrough or
tool named.

- [x] T224 [US3] Add the review section to `.claude/skills/anchor-mentor/SKILL.md` per TD § 12 and FR-024: name the layer ("Here's Tab. Where should it turn from?"), then "set its pivot there without it moving"; no demo, walkthrough, tool or shortcut before "done"; the rest key still named on a keyed layer; a fail gets TD § 7's hints (which may name Pan Behind) and no reteach; `no_new_target` → no review and nothing recorded; "I already know it" runs the same way
- [x] T225 [US3] Add review tests to `mentor/test/anchor-tools.test.mjs` with `mentor/test/fixtures/anchor/records/learned-door.json` (written here: skill learned and due, Door and Needle as past targets on Mentor Practice 2): `mode: "review"` proposes Tab or Peg (no Rotation or Scale keys preferred), never Door or Needle; `anchor_demo` throws `REVIEW_NO_DEMO` with no snippet run; with every `default` candidate in the record, `no_new_target`; `FINDERS` with the record's past targets as `exclude` agrees; `record_lesson` after a lesson stores `{ layer, property: "Anchor Point" }` per focus layer
- [x] T226 [US3] Set `FINDERS["transform.anchor"].review = true` in `mentor/tools/transform-anchor.mjs` once T225 passes (FR-003, FR-024)

---

## Phase 6: Overlap rows (cloud)

- [x] T227 [P] Add to `.claude/skills/anchor-mentor/SKILL.md` the overlap wording the rows need: an expression drives it (rows 1, 2), "I can't tell where it sits at rest" and never "the expression ignores the pivot" (row 3), the precomp's frame with its size (row 9), "turn its eye back off" for a matte (row 12), nulls are skill 6's (row 14, only if built), the parent sentence (row 15), "I'll go by its own sides" (row 18), the text baseline (row 21), the group-anchor hint (row 22), "its pivot sits outside" (row 23), 3D a later topic (row 24), "select it in the timeline first" (row 25), the unlock sentence (row 28), "I can't check that one" (rows 27, 29)
- [x] T228 Write `mentor/test/anchor-overlap.test.mjs`: one named test per row 1 to 29 of spec › Edge cases where concepts overlap, each asserting what the focus and the check see on its fixture from `answer-key.json`; the rows marked **contract** (10, 24, 26) are asserted against `layer-info.mjs`, `comp-space.mjs` and `snapshot.jsx` as built

---

## Phase 7: Cloud hand-back

- [x] T229 Run `cd mentor && npm test` and `node --test .claude/hooks/test/*.test.mjs`; run `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`) and confirm the changed files are exactly the add-only table's, all added (FR-001, SC-008)
- [x] T230 Run `/agent-audit` on `.claude/skills/anchor-mentor/SKILL.md` and fix what it finds in that file
- [x] T231 Hand back for the sitting: branch and commit, test counts, T229's output, the `<!-- L-2 -->` and `<!-- L-3 -->` places, and what Phase 8 needs (quickstart › 2–5)

---

## Phase 8: The live sitting (🖐, one sitting at the builder's Mac, quickstart › 2–5)

**Setup**: after spec 004's T133 to T136 and T158 have passed; the branch on the Mac in a local
worktree; After Effects 26.5 on `discovery/Claude AE Tutor Test.aep` with Mentor Practice 2's 2b
layers; the cockpit off AE; one skill-builder holding the AE lock (not during spec 012's sitting).
The builder does the hand actions.

- [x] T232 🖐 [US1] Live checks L-1 to L-5 on a **duplicate** of Mentor Practice 2 (quickstart › 2); log each answer for the hand-back. If L-4's demo runs show a footprint off by more than 1 px or more than one undo step, note it for T235
- [x] T233 🖐 [US1] Captures (quickstart › 3): every file in its table saved to `mentor/test/fixtures/anchor/` with `node mentor/dev/capture.mjs --times <the answer key's list>`; then delete the duplicates, confirm Mentor Practice 2 matches spec 004's `practice2b.json`, check no capture holds a user or folder name, save the `.aep`, release the lock
- [x] T234 Desk block, part 1 (not 🖐): point every test at the live captures and spec 004's (keeping `synthetic/`), delete `mentor/test/fixtures/anchor/stand-in/`, update `README.md`'s provenance; `npm test` green
- [x] T235 [US1] Desk block, part 2 (not 🖐): from L-1, set `SHAPES_DEFAULT` and `RECT_KIND.shape` in `mentor/lib/anchor.mjs`; from L-5, `RECT_KIND.text`; fix `mentor/jsx/anchor-demo.jsx` for anything L-4 showed (and repeat that L-4 run before T236); fill each `<!-- L-2 -->` and `<!-- L-3 -->` in `SKILL.md` (Center Anchor Point by menu path for the center place only if L-3 confirmed it, otherwise left out); `npm test` green. Any result that changes a requirement goes to the spec writer before T236
- [x] T236 🖐 [US1] First live lesson, Door on Mentor Practice 2 (quickstart › 5.1), by the builder in a plain Claude Code session: time from `calls.jsonl` (SC-001), per check agreement with the crosshair and the layer's place on screen (SC-002)
- [x] T237 🖐 [US2] First live lesson, Gauge or Pop (quickstart › 5.2), same measures; at least one L-4 mistake made on purpose and checked (SC-002)

---

## Phase 8b: Amendment of 2026-10-26 (cloud or desk, not 🖐; before T236 and T237)

From the sitting and the desk block (spec › Changes 2026-10-26). Same add-only rule: every file
below is one this branch added. T241 blocks T236; T242 to T244 block T237 and HO-1. **T236 also
logs `anchor_snapshot`'s own time from `calls.jsonl`** (two reads on this comp, FR-013, plan ›
Risks; over 10 s is a finding, not a fail).

- [x] T241 [US1] Ranking (FR-004, FR-024, research R1): in `mentor/lib/anchor.mjs`, add `keyed.any` to each candidate (any property with keys in the snapshot's keyed `layers` entry, Opacity, effects, masks and text animators included) and make `rankOrder`'s animation key three steps (no keys at all, then keys but none on Rotation or Scale, then Rotation or Scale keys), keeping its place after "unparented" and the review's move of it (R8). In `mentor/test/fixtures/anchor/answer-key.json`, by hand from spec FR-004: `practice2b.proposal` Door, `middle-left`; ranks Door 1 to Flip 19 as FR-004 lists; `review.proposal` Tab, `count_with_exclude` 17 (unchanged); Mentor Overlaps' ranks unchanged; replace the T234 `proposal_note` with one citing this task. Tests in `mentor/test/anchor-candidates.test.mjs`: the proposal and review pick on `practice2b.json`; a synthetic comp where an Opacity-keyed layer sits above an unkeyed one and the unkeyed one is proposed; a comp where every candidate has keys still gets a proposal (a ranking step, never a filter); a review with Door and Gauge in the record picks Needle. `npm test` green
- [x] T242 [P] [US1] Which side a pivot outside sits on (FR-019a): one function in `mentor/lib/anchor.mjs` that compares the anchor's comp-space point (`comp-space.mjs`'s `compPosition`, never re-derived) with the layer's comp-space bounds at the check time and returns `above`, `below`, `left`, `right`, a pair (`below-left`), or `null` when either can't be read; add it as `outside_side` on candidates with `place_now: "outside"`, as `side` on the `pivot_outside` note (for a focus layer and for the proposal), and as `item1.outside_side` in `mentor/lib/anchor-check.mjs`; `mentor/tools/transform-anchor.mjs` passes the note through. Answer key: Lid in `practice2b` below; `door-outside` left; `pop-shrunk` at 4.3 s below. Tests in `anchor-candidates.test.mjs` and `anchor-check.test.mjs`, plus a synthetic flipped layer whose side is the screen's, not its own, and an unreadable case giving `null`
- [x] T243 [P] [US1] Hints for row 22 (FR-019b, data-model › Hint codes): in `mentor/lib/anchor-check.mjs`, rename `group_anchor` to `content_shifted` (same field combination, any layer kind) and add `unchanged_shape` (focus kind `shape`, not passed, anchor and Position unchanged, item 2 holds, not `wrong_layer`; after the place hint). Answer key: `lid-group` hints `["outside", "unchanged_shape"]`; `live_notes.sign-left-check` names `content_shifted`. Update the row 22 test in `mentor/test/anchor-overlap.test.mjs` and the per-row hint tests in `anchor-check.test.mjs` (each code exactly once on its fixture)
- [x] T244 [US1] `.claude/skills/anchor-mentor/SKILL.md`, after T241 to T243: the pivot-outside line and hint say the side from `outside_side` and where to look (select the layer in the timeline), never a distance, and say "outside" with no side when it's null (FR-019a); replace the group hint with `content_shifted`'s and `unchanged_shape`'s sentences (FR-019b; spec Open questions › D, item 3 has the proposed wording, used until the designer confirms); the set-away-from-rest hint says the pivot did move though nothing showed and asks for Edit > Undo before the playhead goes to the rest key (FR-019; D item 5). No other change. Then `npm test`, `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`) and `/agent-audit` on the file; hand back the diff for HO-3

---

## Phase 8c: Round 2 of 2026-10-26 (skill-builder on `skill-5-anchor`; cloud or desk, not 🖐 except T248)

From TD § 16 (D-4 and the wording list, `8ab6adc`) and spec › Changes › round 2. Same add-only
rule: every file below is one this branch added. **None blocks T236** (Door has no keys; its
lesson runs on Phase 8b as built). **T245 to T247 block T237 and HO-1.** T248 doesn't block
anything. The answer key's values are derived by hand from the spec and the captures, never by
running the code and copying its output.

- [x] T245 [US2] Leave-out for layers that already move (FR-004, FR-009, FR-013; data-model › Candidate): in `mentor/lib/anchor.mjs`, add `keyed.position_times` to each candidate (Position's key times, X and Y counted together when separated, hold keys included, times within half a frame merged); two or more times → `never` with reason `position_moves`; one time → `if_named` with `position_keyed` only when the layer has no Rotation or Scale keys or its rest key is within half a frame of that time, else `position_moves`; a focus whose learner `rest_time` is off its one Position key's frame is refused in `focus_problems` with `position_moves`; `position_keyed_tip` carries `time`. `neededTimes` follows (never-bucket layers drop out, unchanged code path). In `mentor/lib/anchor-check.mjs`, add `item3.now` (the check read's `comp.time`). The demo and review are unchanged (they already take default candidates only). `npm test` green after T246
- [x] T246 [US2] Answer key and tests (FR-004, FR-012, FR-013, rows 5, 5b, 6): in `mentor/test/fixtures/anchor/answer-key.json`, by hand: Sled and every other Position-keyed layer of `practice2b` confirmed at two or more key times and set to `never`, `position_moves` (spec FR-004 lists 16), Leaf 2 in Mentor Overlaps by its own key count; `needed_practice2b` and its `needed_note` re-derived without those layers' Position key times and Card's and Tile's rest keys; `sled_with_gradient` replaced (both are `never` now) by a two-focus case of two `if_named` layers picked by hand, still giving no demo; `sled-one-key` as the one-key case (baseline `sled-one-key-before`, Sled `if_named`, `position_keyed`, tip time 3.667; the attempt fails with `slid_at_key`, item 2 holds at the check time, a `keys_added` on Position); `sled-slid` and `sled-on-key` kept as item 4 unit tests outside the lesson path (the check called with Sled as focus directly, its note saying a lesson can't reach it). Tests in `anchor-candidates.test.mjs` and `anchor-overlap.test.mjs`: synthetic X key at 1 s and Y key at 2 s → `position_moves`; X and Y both at 1 s → one time; two hold keys → `position_moves`; one key with Scale's rest key on another frame → `position_moves`, on the same frame → `if_named`; a learner `rest_time` off the key refused; `item3.now` on `pop-shrunk` is that capture's own `comp.time` (3.3 s by TD § 7's line; confirm from the file). Rows 5, 5b and 6 each map to one test
- [x] T247 [US2] `.claude/skills/anchor-mentor/SKILL.md`, after T245 and T246: (1) swap in TD § 7's lines as TD § 16 rewrote them for `unchanged_shape`, `content_shifted` (text and shape wordings), `outside`, `away_from_rest` (the Pop line, with `item3.now`), `wrong_layer` and `other_layer_moved`, replacing the spec's proposed lines T244 used; (2) add TD § 4's leave-out sentence for `position_moves` (said once, then the next candidate offered; never "jump") and the one-key "put the playhead right on its key" line with the note's `time`; (3) narrow the slid hint to the one-key case (TD § 7's one-key row); (4) the leftover audit finding: on a shape with `unchanged_shape`, say that line **instead of** the general "Door's pivot didn't change. If something drives it…" line, not both (FR-019b); (5) D-5 to D-7 as the spec recommends until the designer answers. Nothing else. Then `npm test`, `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`), `/agent-audit` on the file and fix what it finds there; hand back the diff for HO-3
- [ ] T248 🖐 L-6 at the next sitting (with T237; quickstart › 2, spec › Live checks): on a duplicate of Mentor Practice 2, a stroked Lid read as `mentor/test/fixtures/anchor/lid-stroke.json`; log whether `rect` includes the stroke (1 px); duplicate deleted, Mentor Practice 2 still matches `practice2b.json`. A "no" goes to the spec writer (filter 5, row 22); blocks nothing
- [ ] T261 🖐 **Added round 7 (2026-10-26, TD § 19b item 4; spec › Live checks › L-8, row 2).** L-8 at the next sitting, with T248, under the AE lock: on a duplicate of Mentor Practice 2, (a) a layer with an auto-center expression on its **unkeyed** Anchor Point and (b) a layer with an expression on its unkeyed Position that ignores `value`; for each, a read, Pan Behind as the lesson teaches it, a read (four captures in `mentor/test/fixtures/anchor/`, named in spec › Live checks › L-8, the builder may rename). Log for each: does the layer move on screen, and which hint `anchor_check` returns. Duplicate deleted, Mentor Practice 2 still matches `practice2b.json` (strict compare; `capture.mjs --compare` skips `layer_info`). The result goes to the spec writer and the designer; no `SKILL.md` line until then. Blocks nothing

---

## Phase 8d: Round 3 of 2026-10-26 (skill-builder on `skill-5-anchor`; T251 and T253 🖐)

From spec › Changes › round 3: the watch offer (TD § 17, FR-008, B-8) and the lesson-start speed
(FR-013a, SC-010). Same add-only rule: every file below is one this branch added. **T249 and T250
block HO-1** (cases 11 and 23 read `watch_offer`). **T251 to T253 block nothing**: not HO-1 (fixture
mode doesn't time AE), not T240, not the merge; T252 goes in before the merge only if it's done by
then. **T240 waits on nothing in this phase.** Answer-key values are derived by hand from the spec
and the captures, never copied from the code's output.

- [x] T249 [US1] `watch_offer` (spec FR-008, B-8; data-model › Analyzer result; contracts › `anchor_snapshot`): in `mentor/lib/anchor.mjs`, `analyze()` returns `watch_offer: { layer, suggested_place }` or `null`: with exactly one focus target, the highest-ranked `default` candidate by the lesson ranking that isn't the focus, isn't already at its suggested place (FR-007), and has no Rotation or Scale keys or its rest key within half a frame of the focus's check time; `suggested_place` by `proposalFrom`'s hinge rule (reuse it, don't copy it); `null` with no focus, two focus layers, or none qualifying. `mentor/tools/transform-anchor.mjs` passes it through and nulls it in a review and once `demo_used`. Answer key (`answer-key.json › watch_offer`), by hand from spec FR-008: Door → Needle, `bottom-middle`; Pop → Door, `middle-left`; Door and Needle → `null`; review → `null`. Tests in `anchor-candidates.test.mjs` (the four above, plus synthetic: one default candidate only → `null`; the next-ranked layer already at its suggested place → the one after it; the next-ranked layer with a Scale rest key on another time → skipped, on the focus's check time → offered) and `anchor-tools.test.mjs` (the field in the tool's output; `null` after `anchor_demo` ran and in review mode). `npm test` green
- [x] T250 [US1] `.claude/skills/anchor-mentor/SKILL.md`, after T249 (spec FR-008, US1 #7; TD § 4 › The watch offer, § 17): move the one-layer offer from step 5 (now it runs only on an ask, `SKILL.md:190`) to the **last sentence of step 4's invite turn**, after the walk-through: TD § 17's line with `watch_offer.layer`, once; never when `watch_offer` is null, in a review, when the record read at step 0 shows this skill passed, or when the learner already asked to watch or named a second layer. On a yes: resend `skill_options` with two focus entries (theirs first, the offered layer at `watch_offer.suggested_place`), name that place in one sentence, then step 5 as for two layers. On no or no answer: no second offer, not after a failed check; a later ask still gets the demo. Nothing else. Then `npm test`, `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`), `/agent-audit` on the file and fix what it finds there; hand back the diff for HO-3
- [x] T251 🖐 Time each read on its own (spec FR-013a step 1), by the builder under the AE lock, on `skill-5-anchor` after Phase 8c, Mentor Practice 2 reset to `practice2b.json`'s state, playhead at 0 s. Three runs of each, the first after AE has sat idle for a few minutes logged apart: (a) the plain read, `time node mentor/dev/capture.mjs <scratch>/plain.json`; (b) today's second read, the same with `--times 0.25,3.167,4.3,4.5` (`answer-key.json › times.needed_practice2b`); (c) a focus-only read, `--times 4.3` (Pop's rest key); and `time node -e 0` once, for Node's own start-up. Captures go to a scratch folder, not `fixtures/`. Then, with the MCP server restarted on the branch and a temp learner home (`AE_MENTOR_HOME` in an MCP config's `env`), one lesson start each for Door and Pop: `anchor_snapshot`'s `ms` from `calls.jsonl` and `reads` from its output, with no focus and with the focus. Hand back a table of every time, and which row of FR-013a's table it lands on; the cockpit adds it to `discovery/usage-notes/anchor.md`
- [ ] T252 Cut the lesson-start cost where T251 found it (spec FR-013a step 2's table and step 3's cuts; contracts › `anchor_snapshot` step 2), in `mentor/lib/anchor.mjs` and `mentor/tools/transform-anchor.mjs`'s `lessonRead()`. For each cut the table calls for: **no focus, one read**, after a test that `analyze()` gives the same candidates (bucket, reason, rank), proposal and notes on spec 004's plain `mentor/test/fixtures/layer-info/practice2b.json` as on `fixtures/anchor/practice2b.json` (if it doesn't, skip this cut and say why); **the focus's times only** (each focus layer's check time and Position key times; answer key by hand: Door → none beyond the playhead, Pop → `[4.3]`); **asked for in read 1** when the session holds a baseline of the same comp, read 2 only if a time is still missing. If the time was outside the reads, compute `candidates()` once per call. Tests in `anchor-tools.test.mjs` through the `io` spies: the number of `takeSnapshot` calls and their `sample_times` for a no-focus call, a focus call after it (one read), and a cold focus call (two when a time is missing); `anchor_check`'s sample times unchanged. If T251's plain read alone was over 3 s, also write SR-4 in the hand-back (spec › Dependencies). `npm test` green; `check-branch.mjs` as T250 **Deferred 2026-10-27 (builder):** T251 found the cost is AE in the background (App Nap), not the reads; revisit only if the panel (spec 003) still shows it.
- [ ] T253 🖐 SC-010, after T252: in the next live lesson start on Mentor Practice 2 (T240's review counts if T252 is in by then; else a lesson start for Door and one for Pop on a temp learner home), each `anchor_snapshot`'s `ms` from `calls.jsonl` and its `reads`, against 3 s; logged by the builder, added to the usage note by the cockpit. Over 3 s is a finding with T251's table row, not a fail **Deferred 2026-10-27 (builder):** T251 found the cost is AE in the background (App Nap), not the reads; revisit only if the panel (spec 003) still shows it.

---

## Phase 8e: Round 4 of 2026-10-26 (skill-builder on `skill-5-anchor`; desk, no 🖐)

From spec › Changes › round 4: D-8 and B-9 (TD § 18; spec FR-004 `moves_case`, FR-009, US2 #6,
row 5b) and D-9 (TD § 18; spec FR-008). Same add-only rule: every file below is one this branch
added. **T254 and T256 block HO-1** (case 24 reads `moves_case`). **T255 blocks nothing.** None
blocks T240 or the live lessons. No live evidence exists for the one-key case (Mentor Practice 2
has none): its fixtures are synthetic, built from `sled-one-key-before` like T246's, and marked
so. Answer-key values are derived by hand from the spec and the fixtures, never copied from the
code's output.

- [x] T254 [US2] `moves_case` (spec FR-004 › Which `position_moves` case, B-9; data-model › Candidate and › Analyzer result `focus_problems`; contracts › `anchor_snapshot`): in `mentor/lib/anchor.mjs`, every candidate entry with reason `position_moves` carries `moves_case`, `"two_or_more"` or `"one_key_off_rest"`; the second also carries `position_key_time` (the one key's time) and `rest_time` (the time the rule compared against: the learner's `rest_time` when the focus gave one and it was used, else the tool's rest key). `focus_problems` entries with reason `position_moves` carry the same fields. No entry with another reason carries any of them; bucket, reason, precedence and `neededTimes` unchanged. Have `positionRule()` (or a helper beside it) give the case, so the rule lives in one place. `mentor/tools/transform-anchor.mjs` adds the three fields to its `candidates` output only when present. Answer key (`answer-key.json`), by hand: Sled on `practice2b` and every other `position_moves` layer there → `two_or_more`; Mentor Overlaps' Wipe (a matte) and Locked Bar → `two_or_more` (the precedence case). Tests in `anchor-candidates.test.mjs`, extending T246's synthetics on `sled-one-key-before`: one key at 3.667 with Scale's rest key at 4.167 → `one_key_off_rest`, 3.667, 4.167; with the rest key at 3.667 → `position_keyed`, none of the fields; Rotation's rest key on the key and the learner's `rest_time` 4.167 → the candidate (with that `rest_time`) and `focus_problems` both `one_key_off_rest`, 3.667, 4.167; separated X at 1 s and Y at 2 s, and two hold keys → `two_or_more`, no times; Sled on `practice2b` as a focus → `focus_problems` with `two_or_more`; Door, Background (`full_frame`) and a matte → no `moves_case`. In `anchor-tools.test.mjs`: the fields in `anchor_snapshot`'s `candidates` and `focus_problems` on the synthetic, and absent on Door. Then `npm test`, `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`)
- [x] T255 [P] [US1] `watch_offer` never full-frame (spec FR-008, TD § 18 D-9): a test in `anchor-candidates.test.mjs` on a synthetic built from `practice2b` (marked synthetic): Door the one focus layer, and every other layer that isn't `never` removed or made `never` (say which), except Background (`full_frame: true`) → `watch_offer: null`; the same comp without `comp.width` and `comp.height` (`full_frame: null`) → Background, `middle-left` (no extra filter on `null`); FR-008's four answer-key cases still pass unchanged. The built `watchOffer()` already draws only from `default` candidates, so expect no code change; change `mentor/lib/anchor.mjs` only if the test fails, and say which in the hand-back. Then `npm test`, `check-branch.mjs` as T254
- [x] T256 [US2] `.claude/skills/anchor-mentor/SKILL.md`, after T254 (spec FR-004, FR-009, US2 #6; TD § 18 D-8): in the leave-out list, split the "already moves" line by `moves_case`: `two_or_more` keeps TD § 4's Sled line; `one_key_off_rest` gets TD § 18's two-frames sentence, verbatim, with `position_key_time` and `rest_time` written the way the file writes times ("at rest" is `rest_time`, which is the learner's own time when they named the rest pose). Both said once, when the learner names that layer; then offer the next candidate as usual. In the opening, with no layer named, a one-key layer stays under the general "already move" sentence (D-7), not the two-frames one. Never "its other keys" or "jump" about a one-key layer; never count keys or compare times in the prompt. Nothing else. Then `npm test`, `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`), `/agent-audit` on the file and fix what it finds there; hand back the diff for HO-3

## Phase 8f: Round 5 of 2026-10-26 (skill-builder on `skill-5-anchor`; desk, no 🖐)

From spec › Changes › round 5: the opening turn (TD § 19, B-10; spec FR-006a, FR-009, US1 #1) and
the time labels (B-11; spec FR-004 › Time labels and › Missing time, US2 #6, row 5b). Same
add-only rule: every file below is one this branch added. **T257 blocks HO-1's round 5 re-run;
T258 blocks case 24's.** Neither blocks T240 or the live lessons, but run the next live lesson that
opens with no layer in mind after T257 (quickstart › 5, step 1). Answer-key values are derived by
hand from the spec, never copied from the code's output.

- [x] T257 [US1] **In progress by the cockpit's skill-builder, 2026-10-26** (started from TD § 19's B-10 directly, before this task was written; listed here so the phase is complete). `.claude/skills/anchor-mentor/SKILL.md` step 0 and step 1 per TD § 19 › Items › B-10 and spec FR-006a: the opening is the memory clause (this skill's history or a continued lesson only; nothing about other skills on a first lesson of this one), the intent question, and the proposal, ending on the offer; "Don't state the lesson's idea here; it comes in step 2, with the frame"; every leave-out sentence said when the learner names that layer (spec FR-009); D-7's general sentence only for a learner who asks about several moving layers; "which can I use?" answered with up to three default candidates. No tool change. Then `npm test`, `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`), `/agent-audit` on the file; hand back the diff for HO-3
- [x] T258 [US2] Time labels (B-11; spec FR-004 › Time labels; data-model › Candidate; contracts › `anchor_snapshot`), after T257 (both edit `SKILL.md`). In `mentor/lib/anchor.mjs`, one helper beside `positionCase()` makes **`position_key_label`** and **`rest_label`** for every `one_key_off_rest` entry, candidates and `focus_problems` alike (through the same spread as the three round 4 fields), and `mentor/tools/transform-anchor.mjs` passes them through only when present. Tests in `anchor-candidates.test.mjs` on T254's synthetics, values by hand: 3.667 and 4.167 → "3.7 s" and "4.2 s"; 1 and 3 → "1 s" and "3 s"; 2.95 → "3 s"; 3.667 and 3.7 → "3.67 s" and "3.7 s" (the same-label rule); the learner's `rest_time` 4.167 → `rest_label` "4.2 s" on the candidate and the `focus_problems` entry; `rest_time` null → `rest_label` null, `position_key_label` still set; `two_or_more` and every other reason → neither label. In `anchor-tools.test.mjs`: both labels in `anchor_snapshot`'s output on the synthetic, absent on Sled (`two_or_more`) and Door. Then `SKILL.md`: the two-frames sentence uses the two labels as given and the line "Both times are always written as this file writes times … even when the learner said 3.667" becomes "say the two labels exactly as given; never round or write a time yourself"; the missing-time line (spec FR-004 › Missing time) keys on either label being missing. Nothing else. Then `npm test`, `check-branch.mjs` as T257, `/agent-audit` on the `SKILL.md` diff; hand back the diff for HO-3
- **HO-1 update (eval engineer, through the cockpit; not a builder task):** see Hand-offs › HO-1 › Round 5.

## Phase 8g: Round 6 of 2026-10-26 (skill-builder on `skill-5-anchor`; desk, no 🖐)

From spec › Changes › round 6: TD § 19a's B-12 (spec FR-006a, FR-009, US1 #8 and #9, row 14).
Same add-only rule: the file below is one this branch added. **T259 blocks HO-1's round 6 cases
(32 to 36).** It doesn't block T240 or the live lessons. No tool change.

- [x] T259 [US1] **In progress by the cockpit's skill-builder, 2026-10-26** (started from TD § 19a's B-12 directly, before this task was written; listed here so the phase is complete). `.claude/skills/anchor-mentor/SKILL.md` step 1, per TD § 19a › Items › B-12 and spec FR-006a and FR-009: (1) practicing: the proposal is always the read's `proposal`, and `next` gives only the memory clause; a learner who wants another go at `next`'s layer names it; (2) the leave-out list's null, camera, light and adjustment line becomes TD § 19a item 2's sentence with the layer's name and kind, then the proposal as for any layer that can't be the focus; never a pointer to the null lesson or a word about a null's pivot; (3) on the two-frames line (TD § 18, T258's wording), "never round or write a time yourself" becomes "never round or write these two times yourself", so it reads as a rule about the two labels, not every time in the file (the cockpit's addition to B-12). Also confirm the continued-with-no-focus line (spec FR-006a, Open questions › D-10) opens as a new lesson **by the record** (the practicing form when this skill has history), and change it only if it doesn't. Nothing else. Then `npm test`, `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`), `/agent-audit` on the file; hand back the diff for HO-3
- **HO-1 update (eval engineer, through the cockpit; not a builder task):** see Hand-offs › HO-1 › Round 6.

## Phase 8h: Round 7 of 2026-10-26 (skill-builder on `skill-5-anchor`; desk, no 🖐 here)

From spec › Changes › round 7: TD § 19b's B-13 (spec FR-004, FR-006a, US1 #10, Edge Cases) and
the eval smoke run's leaked self-note (spec › Eval plan › `no_text_before_snapshot`). Same
add-only rule: the file below is one this branch added. **T260 blocks HO-1's baseline** (seven of
eleven smoke transcripts would fail `no_text_before_snapshot` without it). It doesn't block T240
or the live lessons. No tool change. L-8 is T261, listed with T248 in Phase 8c for the next
sitting.

- [x] T260 [US1] **In progress by the cockpit's skill-builder, 2026-10-26** (started from TD § 19b's B-13 directly, before this task was written; listed here so the phase is complete). `.claude/skills/anchor-mentor/SKILL.md`, per TD § 19b › Items › B-13 (its wording, not copied here) and spec FR-004, FR-006a, FR-008: (1) step 1, the no-candidate wording fires when `proposal` is null (drop "and nothing can be named"), even if a background, hidden layer or matte could still be named; (2) step 1, after the leave-out heading, "With no proposal and no candidate left, step 1's solid line", and drop the null, camera, light, adjustment line's own "(with none left, step 1's solid line)"; (3) step 1, full-frame: it can be named, never offer it; (4) step 5, one focus layer, a watch the learner asks for on a layer they name: the demo at the place they give, else ask which of the nine before `anchor_snapshot`, never a hinge the mentor picks; (5) step 1, practicing: "No sentence for this." after "they can name it"; (6) step 1, continued with no focus: a new lesson, the memory clause only if step 0 found this skill practicing, then the intent question and the proposal (D-10); (7) step 1, the can't-read sentence for every cause ("I can't read Orbit well enough to check its pivot right now, so I'll leave it out."); (8) **from the eval smoke run (rounds 5 and 6, not in B-13):** steps 0 and 1, call `read_learner_record` and `anchor_snapshot` back to back and write nothing until the snapshot has come back, so no self-note ("First lesson on this skill.", "Review is due. Run the review.") reaches the learner; review mode too. Nothing else. Then `npm test`, `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`), `/agent-audit` on the file; hand back the diff for HO-3, then the eval engineer re-runs the cases that leaked (HO-1 › Round 7)

---

## Phase 9: Polish and hand-back

- [ ] T238 Re-run T229's checks on the final branch (live fixtures, no stand-ins)
- [ ] T239 Write the hand-back: branch and commit; test counts; L-1 to L-5 results; SC-001 and SC-002 from T236 and T237; any snippet fix; anything for the spec; the Requests below. The cockpit writes `discovery/usage-notes/anchor-build.md` from it
- [ ] T240 🖐 [US3] Later, a day or more after the first pass: the live review on the layer the review names, Needle after quickstart › 5's two lessons (amended 2026-10-26, was "Tab or Peg"; quickstart › 6, SC-009, stretch), logged by the builder; the cockpit adds it to the usage note

---

## Hand-offs to other owners (not builder tasks)

- **HO-1 Eval engineer:** hand off to eval-engineer: `product/evals/anchor/` from spec › Eval plan.
  After T234. Case numbers from the cockpit. **2026-10-26:** after T241 to T244 too; the cases on
  `evals-skill-5` move to the live captures (spec › Open questions › E). **Round 2:** after T245
  to T247 too (case 13 is now Sled as a leave-out; case 22, one key dragged off it, is new).
  **Round 3:** after T249 and T250 too (case 11 is now "none on the learner's layer; one offer on
  another"; case 16 adds no offer; case 23, the watch offer with variants no, already passed and
  yes, is new). Not after T251 to T253. **Round 4:** after T254 and T256 too (case 24, a one-key
  layer named with its rest key on another frame, TD § 18's two-frames sentence, is new, on a
  synthetic fixture built from `practice2b`; spec › Eval plan 24). Not after T255.
  **Round 5 (2026-10-26, TD § 19, B-11):** after T257 (and T258 for case 24). Cases that look for
  a leave-out sentence in turn 1 move that check to the turn the learner names the layer, and
  turn 1 is checked for none (case 1; 24c checks no leave-out sentence at all, not only the
  two-frames one); R-ONE-IDEA goes back on case 1 with TD § 19's reading in its case note;
  case 24's time checks take the labels exactly ("3.7 s", "4.2 s"), dropping the "3.667"
  alternative; the README's case table follows spec › Eval plan 11 (one focus, the watch offer)
  and 25 to 31 (26 the two-layer demo). Re-run 1, 13, 24, 24b, 24c once each before a baseline.
  **Round 6 (2026-10-26, TD § 19a, B-12):** after T259 (and T258 for 37). New cases from spec ›
  Eval plan › Round 6: 32 practicing (the proposed layer equals the snapshot's `proposal`,
  whatever `next` names); 33 the learner names CTRL (TD § 19a's sentence; no turn mentions a
  null's pivot or the null lesson; Hatch Rig on `practice2b` stands in if no Mentor Practice read
  can be built without AE); 34 a continued lesson with a focus (Needle; handed back, no intent
  question or proposal); 35 a continued lesson with no focus (opens as a first lesson); 36 "which
  layers can I use?" (up to three `default` candidates, no `position_moves` layer); 37 the
  same-label times ("3.67 s" and "3.7 s", a variant of 24's synthetic). The missing-time line
  stays unit-tested. Run each new case once before a baseline.
  **Round 7 (2026-10-26, TD § 19b):** no case change needed (spec › Eval plan now matches the set
  as built: case 1 in one turn, 34 and 35 checked on turn 2, universal `no_text_before_snapshot`).
  After T260, re-run the cases whose smoke transcripts leaked a self-note (at least 01, 16, 26)
  once each before a baseline. Optional, the eval engineer's call: 35's practicing variant and a
  background-only comp (spec › Open questions › E › round 7).
- **HO-2 Curriculum designer:** `/overlap-audit` re-run on the built branch before HO-1: TD § 9
  against T228's tests on live fixtures, the rows marked **contract** re-confirmed against wave B's
  code as built, and L-1 to L-5's results.
- **HO-3 Reviewer:** a read of `SKILL.md` against FR-023 (Quick Set Anchor never brought up, one or
  two sentences when asked; Center Anchor Point by menu path for the center place only, confirmed by
  L-3) and SC-004 (no number to type, no tolerance) before HO-1; after T244, again on its diff
  (FR-019a, FR-019b, the rest hint); after T247, again on its diff (TD § 16's lines, the
  `position_moves` sentence, never "jump", and FR-019b's "not both lines"); after T250, on its diff
  (FR-008: one offer, one sentence, last in the invite turn; none after a pass, in a review, or a
  second time); after T256, on its diff (TD § 18's sentence verbatim and only for
  `one_key_off_rest`, once, never in the opening, never "its other keys" or "jump").
  After T257, on its diff (spec FR-006a: one choice, no leave-out, no idea, no other-skill recap
  in the opening; each leave-out on the naming turn). After T258, on its diff (the labels said as
  given, no time formatted in the prompt, the missing-time line). After T259, on its diff (spec
  FR-006a: the proposal is always the read's; FR-009: TD § 19a's sentence for the four kinds, no
  null lesson pointer, no null's pivot). After T260, on its diff (spec FR-004 and FR-006a: no
  background offered, the solid line when `proposal` is null, D-10's practicing clause, a named
  watch layer's place asked not picked, nothing written between the record read and the snapshot).
- **HO-6 Curriculum designer (round 3, 2026-10-26):** D-8 (the "already moves" sentence on a
  one-key layer whose rest key is on another frame) and D-9 (the spec's reading of which layer
  the watch is on), spec › Open questions › D. **Done 2026-10-26** (TD § 18, `47c90bd`); tasked
  as Phase 8e.
- **HO-5 Curriculum designer (2026-10-26):** D-4 (Sled, two or more Position keys) and the TD
  wording list in spec › Open questions › D. **Done 2026-10-26** (TD § 16, `8ab6adc`); tasked as
  Phase 8c. New: D-5 to D-7 (wording only, spec › Open questions › D), not blocking; T247 uses
  the spec's recommendations until answered.
- **HO-4 Eval engineer, after merge:** the easing set at 25/25 or within one (SC-007), logged.

## Requests (to the cockpit; never a task here)

- **SR-2 (approved 2026-10-24 as spec 004 tasks-wave-b.md T164, T165; same as spec 012's SR-4):**
  `comp.width` and `comp.height` in the snapshot (plan › Requests). Not blocking: the build reads them when present (T209) and
  ranks by area until then. Wanted before T233 so the captures carry them.
- **SR-3 (from the build, 2026-10-24; for the shared-code owner):** `mentor/test/skill-module.test.mjs:86`
  asserts `found.SKILLS[0] === "easing.basic"`, and `mentor/tools/index.mjs` loads tool files in
  name order, so a tool file named `anchor.mjs` sorts before `easing.mjs` and fails it. Ask: check
  that `easing.basic` is present (once), not that it comes first. Until then the tool file is
  `mentor/tools/transform-anchor.mjs`; it can be renamed to the contract's `anchor.mjs` after.
- Plan › Open questions Q1: approved 2026-10-24 (`anchor_demo` refuses `not_at_rest`; T214, T216, T218, T221, T222).

## Dependencies & execution order

- Phase 1 → Phase 2 (blocking) → Phase 3 → Phases 4 and 5 (either order) → Phase 6 → Phase 7 →
  (spec 004 T133 to T136, T158) → Phase 8 → Phase 9.
- Within Phase 2: T203 to T207 first; then T208 → T209 → T210, and T211 → T212 (T211 after T208).
- Phase 4 and Phase 5 need T218. T227 after T219.
- Phase 8 in order: T232 → T233 → T234 → T235 → T236 → T237. T240 a day or more after the first pass.
- Phase 8b (2026-10-26): T241 → T236; T242 and T243 in parallel, then T244 → T237 and HO-1.
- Phase 8c (2026-10-26, round 2): T245 → T246 → T247 → T237 and HO-1. None blocks T236. T248 at
  T237's sitting, blocking nothing.
- Phase 8d (2026-10-26, round 3): T249 → T250 → HO-1. T251 → T252 → T253, blocking nothing (not
  HO-1, not T240, not the merge). The two chains can run in parallel; T251 needs the AE lock.
  T240 waits on nothing in Phase 8d.
- Phase 8e (2026-10-26, round 4): T254 → T256 → HO-1. T255 any time, blocking nothing. None
  blocks T240, the live lessons or the merge beyond HO-1.
- Phase 8f (2026-10-26, round 5): T257 (in progress) → T258 → HO-1's round 5 re-run. Neither
  blocks T240 or the merge beyond HO-1; the next no-layer-in-mind live lesson after T257.
- Phase 8g (2026-10-26, round 6): T259 (in progress), after T257 (both edit `SKILL.md` step 1) →
  HO-1's round 6 cases. Blocks nothing else.
- Phase 8h (2026-10-26, round 7): T260 (in progress), after T259 (both edit `SKILL.md` step 1) →
  HO-3 → HO-1's re-run and baseline. T261 at the next sitting with T248, blocking nothing.
- HO-2 and HO-3 after T235; HO-1 after them; merge after HO-1's first run; HO-4 after merge.

## Parallel opportunities

- T203 to T207 (new files); T208 with T211's start once T208's places exist; T213 and T214 with
  T215's writing; T220 with Phase 5; T227 with T228.
- Across specs: through T231 this runs alongside spec 012's builder (no shared file; both only add).
  Phase 8 doesn't overlap spec 012's sitting.

## Implementation strategy

1. **MVP:** Phases 1–3 (US1, Door, in fixture mode).
2. Phases 4 and 5 (keyed layers and review mode both ship in this first build).
3. Phases 6–7 close the cloud part; Phase 8 is one sitting after spec 004's live tasks; Phase 9
   hands back.

**Task count:** 61 (T201–T261): Setup 2, Foundational 10, US1 7, US2 4, US3 3, overlap 2, cloud
hand-back 3, live sitting 6, amendment 4 (2026-10-26), round 2 4 (2026-10-26), round 3 5
(2026-10-26), round 4 3 (2026-10-26), round 5 2 (2026-10-26), round 6 1 (2026-10-26), round 7 2
(2026-10-26, T260 and T261), polish 3. **🖐 live: 9** (T232, T233, T236, T237 in the sitting; T248
and T261 at the next sitting; T251 and T253; T240 a day or more later). Hand-offs: 6; requests: 1 (SR-2), plus SR-4 if T251
calls for it.
