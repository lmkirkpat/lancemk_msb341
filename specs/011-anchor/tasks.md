---
description: "Task list for spec 011: skill 5, set the pivot"
---

# Tasks: Set the pivot (curriculum skill 5)

**Status**: Approved 2026-10-24, with plan › Q1 (`not_at_rest`; the demo target stays entry 1) and
SR-2 (spec 004 T164, T165). Ready for the skill builder.

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
| `mentor/tools/anchor.mjs` | T218, T223, T226 |
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

- [ ] T213 [P] [US1] Write `mentor/test/fixtures/anchor/records/easing-learned.json` (version 1, easing learned, nothing for this skill, no names)
- [ ] T214 [P] [US1] Write `mentor/test/anchor-demo.test.mjs` (FR-015, FR-029, research R6): `demoValues` keeps the footprint within 1 px (with comp-space's math) on a rotated, a scaled, a flipped and a parented layer, and on a layer at Scale 0 on one axis (no inversion, no `singular`); `assemble("anchor-demo", args)` builds with the shared ES3 libraries and no ES5+ syntax; the snippet's source never sets a key (`setValueAtTime`, `addKey`) and writes X and Y on a separated layer; the twin's `apply` writes the anchor and position into `transform` and every sample and leaves `rect` unchanged; its `run` refuses (`ANCHOR_REFUSED`, nothing saved) on a locked, 3D, collapsed, Anchor Point- or Position-keyed layer, an expression, and `not_at_rest`
- [ ] T215 [US1] Write `mentor/test/anchor-tools.test.mjs` in fixture mode (temp `AE_MENTOR_HOME`, `mentor/test/helpers.mjs`): `anchor_snapshot` with no `skill_options` proposes Door with a hinge and lists leave-outs with reasons; with `skill_options.focus` of Door alone, `targets` is one and `demo_target` is `null` with `single_target` (filter 4, pinned); a later call without `skill_options` keeps the focus; `fresh: true` restarts before a check and is refused with `LESSON_UNDERWAY` after; with `layer_info` removed it returns `no_layer_info` and starts nothing; `anchor_check` grades `door-pass`, `door-typed` and `door-dragged` as the answer key says, calls `markChecked` only when the comp matches and never changes the baseline; tool names start with `anchor_`, `SKILLS` is `["transform.anchor"]`, and `registerErrors` adds `ANCHOR_REFUSED`

### Implementation

- [ ] T216 [US1] In `mentor/lib/anchor.mjs`, add `demoValues(sample, rect, place)` (research R6); create `mentor/jsx/anchor-demo.jsx` (ES3) per contracts/tools.md: args `{ comp_id, layer_index, layer_name, anchor, position }`, every refusal before any write (`ANCHOR_REFUSED: <reason>`), Anchor Point then Position (or X and Y), Z kept, never a key, the values before and after returned. Don't edit any existing snippet or `mentor/jsx/lib/`
- [ ] T217 [US1] Create `mentor/fixture/anchor-demo.mjs` (`run`, `apply`, spec 004 contract › 5). T214 passes
- [ ] T218 [US1] Create `mentor/tools/anchor.mjs`: `registerErrors({ ANCHOR_REFUSED: … })` at import with contracts/tools.md's message; `SKILLS`, `FINDERS` (`review: false` for now); the three tools per contracts/tools.md and spec 004 contract › 3 (read 1, the second sampled read when `neededTimes` has a missing time, `session.start` with `skill`, `analyze`, `focus_layers`, `mode`, `skill_options`, `fresh`; `assertCanDemo` and the snapshot-side refusals, including `not_at_rest` when the target has Rotation or Scale keys and the read's `comp.time` isn't within half a frame of its rest key (plan › Q1; the demo target stays entry 1, never switched), before `runSnippet("anchor-demo", …, { undo: true })`, then `recordDemo`; the check's `sample_times` and `markChecked(passed, { demoUndone })` only when the comp matches). T215 passes
- [ ] T219 [US1] Write `.claude/skills/anchor-mentor/SKILL.md` (draft): frontmatter `name: anchor-mentor`, a description triggering on "/anchor-mentor", "pivot", "anchor point", "it swings wide", "turn from the edge", and `allowed-tools` from contracts/tools.md. Body: TD § 5's stages: stage 1 the intent question in both forms first (FR-006), one proposal with a hinge that suits its shape when they have none (H-5), leave-outs one sentence per reason from TD § 4 (a matte never called hidden, FR-009), a parented layer named once and no "trace this one first" (FR-009); stage 2 the place repeated as "the middle of Door's left edge", where the pivot is now in place words, TD § 1's two sentences once, one frame from `preview_frame` with the layer in it, never "you can see the pivot here" (FR-022); stage 3 Pan Behind (Y), A, P, Shift+P; stage 4 no demo with one focus layer, a walkthrough in words (FR-014), with two: A then Shift+P asked first, frames before and after at the same time, "both numbers changed, and Door didn't move" (FR-017); stage 5 the check and TD § 7's hints by hint code, never a number to type or a tolerance (SC-004), never the fix or an offer, "do it for me" declined; `cant_check` said plainly, never "it didn't move" (FR-018); the understanding check after a pass, one light correction, never gating (FR-020); stage 6 the ungraded "try it" and Edit > Undo (FR-021); stage 7 `record_lesson` per FR-025 (layer and place, whether the first try moved the layer, the understanding answer; no pixels, method, motive or names). Version (FR-023): Quick Set Anchor never brought up, one or two plain sentences if asked, no steps, no refusal; Center Anchor Point marked `<!-- L-3 -->` and not named; no crosshair snapping; the Properties panel "you may also see it there". Copy the hard rules block from `.claude/skills/ease-mentor/SKILL.md` › Hard rules (reading it, not editing it)

**Checkpoint**: US1 in fixture mode on stand-ins.

---

## Phase 4: User Story 2 — Set the pivot on a layer that's already animated (P1)

**Goal**: the rest key named and checked on Gauge and Pop, Position keys held still on Sled, and
the demo on the second of two focus layers.

- [ ] T220 [P] [US2] Add to `answer-key.json` the keyed attempts: Gauge at its 0° key and away from it, Pop set at its Scale 0 key (`pop-shrunk`, hint `away_from_rest`) and at full size, Sled slid at a Position key (`slid_at_key`), and two-focus demos (Door with Tab, Gauge with Peg)
- [ ] T221 [US2] Add keyed tests to `mentor/test/anchor-tools.test.mjs`: on Pop the check time is its full-size key and on Gauge its 0° key, and the snapshot's second read samples them on every layer including Hatch Rig's children (FR-013); `anchor_check` passes those times as `sample_times`; with two focus layers the demo target is entry 1, `anchor_demo` off target throws `NOT_DEMO_TARGET`, twice `DEMO_USED`, with the playhead off the rest key `ANCHOR_REFUSED` (`not_at_rest`), each with no snippet run; the twin's result passes the check; after the demo is undone the layer is the learner's
- [ ] T222 [US2] Add the keyed parts to `.claude/skills/anchor-mentor/SKILL.md`: the rest key named in plain words with a request for the playhead there before they start (FR-011), the `scale` and `closest_rotation` bases said in one sentence with "is that how it looks at rest?", a learner's own rest pose passed back as `rest_time`; the Position-keyed tip once (TD § 4, wording marked `<!-- L-2 -->`); `not_at_rest` turned into a playhead request; the rest hint and the slide hint by code; the "play it back" sentence when Rotation or Scale is keyed (FR-021)
- [ ] T223 [US2] Confirm `mentor/tools/anchor.mjs` and `mentor/lib/anchor-check.mjs` handle item 4 and the second read as T221 needs; adjust those files only. T221 passes

---

## Phase 5: User Story 3 — Review the skill in a later session (P2)

**Goal**: review mode in the first build: a new layer, the hinge asked first, no demo, walkthrough or
tool named.

- [ ] T224 [US3] Add the review section to `.claude/skills/anchor-mentor/SKILL.md` per TD § 12 and FR-024: name the layer ("Here's Tab. Where should it turn from?"), then "set its pivot there without it moving"; no demo, walkthrough, tool or shortcut before "done"; the rest key still named on a keyed layer; a fail gets TD § 7's hints (which may name Pan Behind) and no reteach; `no_new_target` → no review and nothing recorded; "I already know it" runs the same way
- [ ] T225 [US3] Add review tests to `mentor/test/anchor-tools.test.mjs` with `mentor/test/fixtures/anchor/records/learned-door.json` (written here: skill learned and due, Door and Needle as past targets on Mentor Practice 2): `mode: "review"` proposes Tab or Peg (no Rotation or Scale keys preferred), never Door or Needle; `anchor_demo` throws `REVIEW_NO_DEMO` with no snippet run; with every `default` candidate in the record, `no_new_target`; `FINDERS` with the record's past targets as `exclude` agrees; `record_lesson` after a lesson stores `{ layer, property: "Anchor Point" }` per focus layer
- [ ] T226 [US3] Set `FINDERS["transform.anchor"].review = true` in `mentor/tools/anchor.mjs` once T225 passes (FR-003, FR-024)

---

## Phase 6: Overlap rows (cloud)

- [ ] T227 [P] Add to `.claude/skills/anchor-mentor/SKILL.md` the overlap wording the rows need: an expression drives it (rows 1, 2), "I can't tell where it sits at rest" and never "the expression ignores the pivot" (row 3), the precomp's frame with its size (row 9), "turn its eye back off" for a matte (row 12), nulls are skill 6's (row 14, only if built), the parent sentence (row 15), "I'll go by its own sides" (row 18), the text baseline (row 21), the group-anchor hint (row 22), "its pivot sits outside" (row 23), 3D a later topic (row 24), "select it in the timeline first" (row 25), the unlock sentence (row 28), "I can't check that one" (rows 27, 29)
- [ ] T228 Write `mentor/test/anchor-overlap.test.mjs`: one named test per row 1 to 29 of spec › Edge cases where concepts overlap, each asserting what the focus and the check see on its fixture from `answer-key.json`; the rows marked **contract** (10, 24, 26) are asserted against `layer-info.mjs`, `comp-space.mjs` and `snapshot.jsx` as built

---

## Phase 7: Cloud hand-back

- [ ] T229 Run `cd mentor && npm test` and `node --test .claude/hooks/test/*.test.mjs`; run `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`) and confirm the changed files are exactly the add-only table's, all added (FR-001, SC-008)
- [ ] T230 Run `/agent-audit` on `.claude/skills/anchor-mentor/SKILL.md` and fix what it finds in that file
- [ ] T231 Hand back for the sitting: branch and commit, test counts, T229's output, the `<!-- L-2 -->` and `<!-- L-3 -->` places, and what Phase 8 needs (quickstart › 2–5)

---

## Phase 8: The live sitting (🖐, one sitting at the builder's Mac, quickstart › 2–5)

**Setup**: after spec 004's T133 to T136 and T158 have passed; the branch on the Mac in a local
worktree; After Effects 26.5 on `discovery/Claude AE Tutor Test.aep` with Mentor Practice 2's 2b
layers; the cockpit off AE; one skill-builder holding the AE lock (not during spec 012's sitting).
The builder does the hand actions.

- [ ] T232 🖐 [US1] Live checks L-1 to L-5 on a **duplicate** of Mentor Practice 2 (quickstart › 2); log each answer for the hand-back. If L-4's demo runs show a footprint off by more than 1 px or more than one undo step, note it for T235
- [ ] T233 🖐 [US1] Captures (quickstart › 3): every file in its table saved to `mentor/test/fixtures/anchor/` with `node mentor/dev/capture.mjs --times <the answer key's list>`; then delete the duplicates, confirm Mentor Practice 2 matches spec 004's `practice2b.json`, check no capture holds a user or folder name, save the `.aep`, release the lock
- [ ] T234 Desk block, part 1 (not 🖐): point every test at the live captures and spec 004's (keeping `synthetic/`), delete `mentor/test/fixtures/anchor/stand-in/`, update `README.md`'s provenance; `npm test` green
- [ ] T235 [US1] Desk block, part 2 (not 🖐): from L-1, set `SHAPES_DEFAULT` and `RECT_KIND.shape` in `mentor/lib/anchor.mjs`; from L-5, `RECT_KIND.text`; fix `mentor/jsx/anchor-demo.jsx` for anything L-4 showed (and repeat that L-4 run before T236); fill each `<!-- L-2 -->` and `<!-- L-3 -->` in `SKILL.md` (Center Anchor Point by menu path for the center place only if L-3 confirmed it, otherwise left out); `npm test` green. Any result that changes a requirement goes to the spec writer before T236
- [ ] T236 🖐 [US1] First live lesson, Door on Mentor Practice 2 (quickstart › 5.1), by the builder in a plain Claude Code session: time from `calls.jsonl` (SC-001), per check agreement with the crosshair and the layer's place on screen (SC-002)
- [ ] T237 🖐 [US2] First live lesson, Gauge or Pop (quickstart › 5.2), same measures; at least one L-4 mistake made on purpose and checked (SC-002)

---

## Phase 9: Polish and hand-back

- [ ] T238 Re-run T229's checks on the final branch (live fixtures, no stand-ins)
- [ ] T239 Write the hand-back: branch and commit; test counts; L-1 to L-5 results; SC-001 and SC-002 from T236 and T237; any snippet fix; anything for the spec; the Requests below. The cockpit writes `discovery/usage-notes/anchor-build.md` from it
- [ ] T240 🖐 [US3] Later, a day or more after the first pass: the live review on Tab or Peg (quickstart › 6, SC-009, stretch), logged by the builder; the cockpit adds it to the usage note

---

## Hand-offs to other owners (not builder tasks)

- **HO-1 Eval engineer:** hand off to eval-engineer: `product/evals/anchor/` from spec › Eval plan.
  After T234. Case numbers from the cockpit.
- **HO-2 Curriculum designer:** `/overlap-audit` re-run on the built branch before HO-1: TD § 9
  against T228's tests on live fixtures, the rows marked **contract** re-confirmed against wave B's
  code as built, and L-1 to L-5's results.
- **HO-3 Reviewer:** a read of `SKILL.md` against FR-023 (Quick Set Anchor never brought up, one or
  two sentences when asked; no Center Anchor Point before L-3) and SC-004 (no number to type, no
  tolerance) before HO-1.
- **HO-4 Eval engineer, after merge:** the easing set at 25/25 or within one (SC-007), logged.

## Requests (to the cockpit; never a task here)

- **SR-2 (approved 2026-10-24 as spec 004 tasks-wave-b.md T164, T165; same as spec 012's SR-4):**
  `comp.width` and `comp.height` in the snapshot (plan › Requests). Not blocking: the build reads them when present (T209) and
  ranks by area until then. Wanted before T233 so the captures carry them.
- Plan › Open questions Q1: approved 2026-10-24 (`anchor_demo` refuses `not_at_rest`; T214, T216, T218, T221, T222).

## Dependencies & execution order

- Phase 1 → Phase 2 (blocking) → Phase 3 → Phases 4 and 5 (either order) → Phase 6 → Phase 7 →
  (spec 004 T133 to T136, T158) → Phase 8 → Phase 9.
- Within Phase 2: T203 to T207 first; then T208 → T209 → T210, and T211 → T212 (T211 after T208).
- Phase 4 and Phase 5 need T218. T227 after T219.
- Phase 8 in order: T232 → T233 → T234 → T235 → T236 → T237. T240 a day or more after the first pass.
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

**Task count:** 40 (T201–T240): Setup 2, Foundational 10, US1 7, US2 4, US3 3, overlap 2, cloud
hand-back 3, live sitting 6, polish 3. **🖐 live: 5** (T232, T233, T236, T237 in the sitting; T240
a day or more later). Hand-offs: 4; requests: 1 (SR-2).
