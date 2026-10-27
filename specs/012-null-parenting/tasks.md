---
description: "Task list for spec 012: skill 6, move a group with a null"
---

# Tasks: Move a group with a null (curriculum skill 6)

**Status**: Approved 2026-10-24, with plan › Q1 (`null_not_ready`), Q2 (`null_scale_zero`) and
SR-4 (spec 004 T164, T165). Ready for the skill builder.

**Input**: Design documents from `specs/012-null-parenting/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/tools.md](contracts/tools.md),
[quickstart.md](quickstart.md); spec 004's
[skill-module.md](../004-ae-curriculum/contracts/skill-module.md),
[shared-tools.md](../004-ae-curriculum/contracts/shared-tools.md) and
[data-model.md](../004-ae-curriculum/data-model.md) › Wave B shapes and › Session lesson. The
teaching design is [teaching-design.md](teaching-design.md) ("TD §", read only).

**Starts after**: spec 004's wave B shared merge
([tasks-wave-b.md](../004-ae-curriculum/tasks-wave-b.md) T100 to T163, including T161 and T162,
this spec's SR-1 (`setSkillData`), T163, its SR-3 (2b's layout), and T160, spec 011's), which is on
main as an early merge (d009d35) for the cloud part. **Phase 9's live tasks wait for spec 004's
T133 to T136** (the live captures and the corner math's answer keys), **T158** (auto-orient) and,
for L-6, **SR-4** (below). Runs in parallel with spec 011's builder through Phase 8; the two
sittings don't overlap (one AE lock).

**Tests**: included and written first (FR-026, FR-027, SC-005, SC-006).

## Add-only: the files this branch may touch

The skill-builder **only adds** these files and changes **no existing file** under `mentor/`,
`bridge/` or `.claude/skills/*-mentor/` (`ownership.json` › addOnly; `.claude/README.md` › Run a
parallel job, step 4), and nothing under `product/evals/`, `panel/` or `discovery/`. The merge
check is `node .claude/hooks/check-branch.mjs <branch> skill-builder main` **without**
`--shared-owner`: every path it lists must be in this table, and every one must be an add.

| Added file | Tasks |
|---|---|
| `mentor/lib/null-parenting.mjs` | T309, T310, T311 |
| `mentor/lib/null-parenting-check.mjs` | T312, T313, T324, T339 |
| `mentor/tools/null-parenting.mjs` | T320, T324, T328 |
| `mentor/jsx/null-parent-demo.jsx` | T318, T339 |
| `mentor/fixture/null-parent-demo.mjs` | T319 |
| `mentor/test/null-parenting-{proposal,jump,check,tools,demo,overlap}.test.mjs` | T304–T308, T316, T317, T322, T327, T330, T332, T338 |
| `mentor/test/fixtures/null-parenting/` (README, `load.mjs`, answer key, records, synthetic, stand-ins, live captures) | T302, T303, T314, T315, T322, T325, T337, T338 |
| `.claude/skills/null-parenting-mentor/SKILL.md` | T321, T323, T326, T329, T331, T339 |

Shared changes go in **Requests** and the hand-back, never in a task. The builder may check off
`specs/012-null-parenting/tasks.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks).
- **[Story]**: US1 (move a group with a null), US2 (a jump caught on its own), US3 (review), US4
  (not ready for it), from spec.md.
- **🖐 Live**: After Effects 26.5 on the builder's Mac and the AE lock (`decisions/008`). All but
  the last are in **one sitting** (Phase 9). Everything before Phase 9 runs in the cloud.

---

## Phase 1: Setup (cloud)

- [x] T301 Confirm the base: `cd mentor && npm test` green (note the count; 686 on 2026-10-24); `comp-space.mjs` exports `footprint`, `compPosition`, `compMatrix`, `toLayerSpace` and `compMatrix` takes `{ parent_transform }`, with the reasons `no_layer_info`, `no_layer`, `not_sampled`, `three_d`, `auto_orient`, `no_rect`, `singular`; `layer-info.mjs` exports `byName`; `motion-sources.mjs`'s `sourcesOf()` gives `parents` with `moves_children`; `session.mjs` exports `setSkillData` and `start` takes `fresh`; `takeSnapshot({ sample_times })` exists; `mentor/jsx/snapshot.jsx` keeps `comp.time` and caller times first under `MAX_SAMPLES = 64`; `build-practice-comp-2b.jsx` builds T157's skill 6 layers with T163's layout. Note whether the snapshot's `comp` has `width` (SR-4): the tests use stand-ins either way. If anything else is missing, stop and hand back
- [x] T302 Create `mentor/test/fixtures/null-parenting/README.md`: every fixture, its source (live capture and sitting step; spec 004's capture read in place; synthetic and which overlap row allows it; or stand-in for which live file), the `--times` list each capture needs (research R4), and the rule that stand-ins are deleted before merge (research R10)

---

## Phase 2: Foundational (cloud, blocking): candidates, proposal, the jump, the check

**⚠️ No user story phase starts until this phase is green.**

### Tests first

- [x] T303 [P] Write fixtures: `mentor/test/fixtures/null-parenting/stand-in/build.mjs` and the stand-ins it writes, each `"synthetic": "stand-in for <live file>"` and carrying `comp.width` and `comp.height` (marked synthetic until SR-4): `practice2b.json` (Tile, Caption, Stamp, Row A to C with Row B unkeyed, Plate with Shadow, Gradient with Reveal Matte, the skill 5 layers, per T163's bounds), `practice2b-parented.json` (the three parented to a null with raw Position values rewritten, footprints unchanged), `overlaps.json` (Drift, Rig hidden null, Shy Parent, Depth, Orbit), and one stand-in per quickstart › 3 capture; the permanent synthetics in `synthetic/` (rows 4, 10, 21, 23 still and moving parent, 26, 31 with and without a check between, 35, 36, 40, a null with 70 merged child key times for the cap, a null at Scale 150 and Rotation 30 for S-1 until L-2's capture), each marked synthetic; `load.mjs` (prefers a live capture in this folder, then spec 004's `mentor/test/fixtures/layer-info/<name>.json`, then the stand-in); and `answer-key.json`: per fixture, candidates, the proposal, demo target, and per planted attempt the check result, codes and comments (data-model)
- [x] T304 [P] Write `mentor/test/null-parenting-proposal.test.mjs` (FR-003 to FR-008, research R1, R2): candidates from `layer_info` (Row B, with no keys, is one: filter 1); a matte and its layer are one pair, never split, counted as 2, never called hidden; Shadow (parented) and nulls, guides, cameras, lights, 3D, auto-oriented and `samples_truncated` layers are out with their reason; a hidden layer is `if_named`; a full-frame solid and an adjustment layer are never proposed; Plate gets `brings_children`; two layers called "Shape Layer 1" give `name_not_unique` and no focus (`rename_needed`); the 2% rule: a gap of exactly 2% of `comp.width` links and just over doesn't, on each axis; the largest group wins, a tie goes to the highest top layer, past 4 the first 4 in stack order that still link; on `practice2b.json` the proposal is Tile, Caption and Stamp (L-6's expectation); without `comp.width`, `no_comp_size` and no proposal while a named focus still works; demo target per FR-008 (never a matte or eye-off layer, a layer with its own transform keys preferred); targets `parent/<name>` and `target_refs` `{ layer, property: "Parent" }`; `FINDERS["parenting.null"].focus` agrees with the proposal on every fixture with the same `exclude`, and is 0 without `layer_info`
- [x] T305 [P] Write `mentor/test/null-parenting-jump.test.mjs` (FR-011, FR-012, FR-027, SC-006, research R4, R5): `practice2b-parented.json` passes P2 with 0 false jumps (raw values changed, footprints didn't); a jumped stand-in fails with the right layer, worst corner, distance and direction at the right time; the Scale 150 / Rotation 30 null where a jump moves corners by more than 1 px and the anchor by less fails (S-1); a null keyed after parenting passes (through the stored null, row 30); a playhead moved after the before read passes (S-2, row 32); a null moved after a check but before parenting doesn't read as a jump (re-stored, D-1), and with no check in between it does (row 31); a still parent above the null passes through `parent_transform` with its chain from samples; the 70-time null: with the P2 times passed none is lost; a `not_sampled` time goes to `not_checked` and P2 fails, never a pass; P2 times are the union of Anchor Point, Position, X, Y, Scale and Rotation key times plus the before-read time
- [x] T306 [P] Write `mentor/test/null-parenting-check.test.mjs` (FR-009, FR-010, FR-013 to FR-016, FR-019, research R5, R6): N1 on class `null` (a hidden null passes, row 15); N2: 3D fails, a moving parent gives `null_parent_moves` with nothing graded and no `markChecked`, a still parent gives `null_has_parent` and passes with `chain_on_purpose`, then `one_level_only` once; N3 per axis at 10% of the group's combined bounds, skipped with `slides_only`; P1 on the Parent link only (a Position pick whip isn't a parent, row 3); P3 counts and times within half a frame, X and Y apart, effect keys counted, raw values never compared; P4 on Position, X, Y, Scale or Rotation with two different values, never on Opacity, effects, one key or an unkeyed expression, `anchor_only` on Anchor Point keys only (row 26); P5 asks for the region (`region_needed`) when the move turns or scales with none; `parenting_passed` without the move, `passed` only with P4 and P5; finding the null: named, the one new null, `which_null` for several; **two layers with the null's name** (row 40): `null_name_not_unique`, nothing stored, N1 to N3 and P1 to P3 not run, and after the rename the null is stored and checked; the null renamed after parenting is found (`null_renamed`); a focus layer renamed or deleted is `not_found`, never guessed
- [x] T307 [P] Write comments and other-changes tests in `mentor/test/null-parenting-check.test.mjs` (FR-020, FR-021, research R8): each comment (`linear`, `held`, `stacked`, `default_name`, `non_uniform_scale`, `zero_scale_at_key`, `opacity`, `effect`) only when the read shows it, never changing a result; the last four and `anchor_only` also before a pass when they explain a failure; other changes from `layer_info` and raw keys of every layer: a layer outside the focus parented to the null, a parent changed, keys added, moved or removed outside the focus, an expression toggled on a keyed property, a layer added or deleted (the null aside); a focus layer's children named once as `children_brought`; the asked-for rename of the null is never one
- [x] T308 [P] Write one test per TD § 7 row in `mentor/test/null-parenting-check.test.mjs` giving exactly its code (data-model › Check result `codes`): `visible_parent`, `jumped`, `pickwhip_position`, `wrong_parent`, `opacity_move`, `no_move`, `one_key`, `pivot_region`, plus the § 14 answers' codes

### Implementation

- [x] T309 Create `mentor/lib/null-parenting.mjs` (pure): `candidates(snapshot)` from `layerInfo`, `classOf`, `sourcesOf` and the keyed `layers`, with matte pairs and unique names (research R1); no eye-switch filter, no re-derived class, chain or matrix (FR-002)
- [x] T310 In `mentor/lib/null-parenting.mjs`: `proposal(snapshot, { exclude })` by research R2's rule, reading `snapshot.comp.width` only when present (`no_comp_size` otherwise, never assumed; SR-4); `p2Times(baseline, layer)` (research R4)
- [x] T311 In `mentor/lib/null-parenting.mjs`: `analyze(snapshot, { focus_layers, exclude, kept_linear, skill_options })` → data-model › Analyzer result, the demo target (FR-008), and `finder(snapshot, { exclude })`. T304 passes
- [x] T312 Create `mentor/lib/null-parenting-check.mjs` (pure): `findNull(baseline, current, skillData, input)` with the unique-name rule and rename detection, `storeNull(current, nullIndex, beforeTime)` while `parented_seen` is false, and P2 through `footprint(..., { parent_transform })` with every `reason` going to `not_checked`. T305 passes
- [x] T313 In `mentor/lib/null-parenting-check.mjs`: `check(baseline, current, skillData, input)` → data-model › Check result (N1 to N3, P1, P3 to P5, `codes`), `comments()` and `otherChanges()`. T306 to T308 pass

**Checkpoint**: `npm test` green; nothing outside the add-only table touched.

---

## Phase 3: User Story 1 — Move a group with a null on a practice comp (P1) 🎯 MVP

**Goal**: a lesson on Tile, Caption and Stamp to a verified pass with at most one demo.

**Independent test**: in fixture mode on the `practice2b.json` stand-in, the tools propose the
group, restart on the focus, store the null, refuse the demo until then, parent Tile in the twin
with 0 px moved, and grade each planted attempt as the answer key says.

### Tests first

- [x] T314 [P] [US1] Write `mentor/test/fixtures/null-parenting/records/anchor-learned.json` (version 1, easing and `transform.anchor` learned, nothing for this skill, no names) and `records/anchor-not-learned.json` (easing only)
- [x] T315 [P] [US1] Add the US1 attempts to `answer-key.json`: null at the group's top-left with "the middle" (`pivot_region`), the null in the middle, Caption by the Position pick whip (`pickwhip_position`), all three parented, a Rotation move (pass), a fade instead of a move (`opacity_move`)
- [x] T316 [P] [US1] Write `mentor/test/null-parenting-demo.test.mjs` (FR-017, FR-018): `assemble("null-parent-demo", args)` builds with the shared ES3 libraries and no ES5+ syntax; the snippet sets `parent` only and refuses (`NULL_PARENT_REFUSED: <reason>`) before any write when the target is locked or already parented; the twin's `apply` rewrites the target's keyed and sampled position, scale and rotation into the null's space with `toLayerSpace` and sets `parent`, and its result passes P2 and P3 on Tile, on Stamp (separated), and under the Scale 150 / Rotation 30 null; a null with Scale 0 on an axis gives `singular` from `toLayerSpace` and the twin refuses with `null_scale_zero`, saving nothing
- [x] T317 [US1] Write `mentor/test/null-parenting-tools.test.mjs` in fixture mode (temp `AE_MENTOR_HOME`, `mentor/test/helpers.mjs`): `null_parent_snapshot` with no focus proposes Tile, Caption and Stamp and lists leave-outs; with `skill_options.focus` it restarts with `fresh: true` (the baseline is that read, `before_time` its `comp.time`), refuses a focus with a duplicate name (`rename_needed`, no lesson change), and after a check refuses a new focus with `LESSON_UNDERWAY`; without `layer_info`, `no_layer_info` and nothing started; `null_parent_check` stores the null in `skill_data` (via `setSkillData`, never from the model), re-stores it while nothing is parented and not after; `null_parent_demo` before the null is stored throws `NULL_PARENT_REFUSED` (`null_not_ready`), off target `NOT_DEMO_TARGET`, twice `DEMO_USED`, each with no snippet run; after it, a second read reports `moved_px: 0`; the demo layer is credited to the demo, then the learner's after an undo and their own parenting (row 39); `markChecked` only when the comp matches; tool names start with `null_parent_`, `SKILLS` is `["parenting.null"]`

### Implementation

- [x] T318 [US1] Create `mentor/jsx/null-parent-demo.jsx` (ES3) per contracts/tools.md: args `{ comp_id, layer_index, layer_name, null_index, null_name }`; match both by index and name, refuse before any write (locked, already parented, not found), set `layer.parent`, return what changed. Don't edit any existing snippet or `mentor/jsx/lib/`
- [x] T319 [US1] Create `mentor/fixture/null-parent-demo.mjs` (`run`, `apply`, spec 004 contract › 5). T316 passes
- [x] T320 [US1] Create `mentor/tools/null-parenting.mjs`: `registerErrors({ NULL_PARENT_REFUSED: … })` at import with contracts/tools.md's message; `SKILLS`, `FINDERS` (`review: false` for now); the three tools per contracts/tools.md and spec 004 contract › 3 (the focus restart with `fresh: true`; the check's `sample_times` from `p2Times`, `findNull`, `setSkillData`, `markChecked(passed, { demoUndone })` except on `null_parent_moves`; the demo's `assertCanDemo`, `null_not_ready`, refusals including `null_scale_zero` before `runSnippet("null-parent-demo", …, { undo: true })`, `recordDemo`, then the second read and `moved_px`). T317 passes
- [x] T321 [US1] Write `.claude/skills/null-parenting-mentor/SKILL.md` (draft): frontmatter `name: null-parenting-mentor`, a description triggering on "/null-parenting-mentor", "move them together", "null", "parent", "group these", and `allowed-tools` from contracts/tools.md. Body: TD § 5's stages: stage 1 ask which layers move as one; propose when they have none (or ask them to name it on `no_comp_size`); leave-outs one sentence per reason, a matte never hidden, Shadow follows Plate, children come along; the rename ask for a duplicate name (FR-004); stage 2 CTRL with Title and Subtitle when the comp has them, else one frame of the group, then position, scale and rotation pass down, not opacity or effects; stage 3 Layer > New > Null Object, ask where the group turns or scales from, never pick it, "it'll only slide" accepted; the null's rename ask on `null_name_not_unique` ("two layers are called Null 1; rename the one you just added so I can tell which is yours"), never asking which one it is, never renaming; stage 4 one demo when asked or stuck, "it moved 0 pixels" in plain words, a frame at the before-read time; on `null_not_ready` the mentor asks for a check of the null first (no demo until it has passed, plan › Q1), and on `null_scale_zero` says in plain words that the null's Scale is 0, so nothing parented to it can stay put, never naming the code; stage 5 hints by code, never the fix, never a cause it can't see, never "1 pixel" as a target; ask for the move only after `parenting_passed`; a null keyed early is fine; stage 6 frames at the null's first and last keys; stage 7 comments, one sentence each, never graded; stage 8 `record_lesson` per FR-025 (layers, the null, the move, a jump and its distance, a move on Opacity or "said the group only slides"; no tolerances, method, motive or names). Version (FR-023): no Shift+F4, the Parent & Link column and how to show it, "the pick whip in the Parent column"; null defaults, Option or Shift while parenting and Quick Offset marked `<!-- L-1 -->` and not said. Copy the hard rules block from `.claude/skills/ease-mentor/SKILL.md` › Hard rules (reading it, not editing it)

**Checkpoint**: US1 in fixture mode on stand-ins.

---

## Phase 4: User Story 2 — A jump is caught on its own (P1)

**Goal**: a jump named with layer, distance, direction and time before any move is asked for.

- [x] T322 [P] [US2] Add to `answer-key.json` and `null-parenting-tools.test.mjs`: Stamp 120 px left at 3.2 s (the hint's numbers come from the result), the rotated-null jump, the null keyed before the check, the playhead moved; the check at stage `parenting` never reports P4 or P5
- [x] T323 [US2] Add the jump parts to `.claude/skills/null-parenting-mentor/SKILL.md`: "Stamp is 120 px left of where it was at 3.2 s" with real numbers from the result, no cause, Edit > Undo and parent it again, "if the null moved after you placed it, that can show up here too"; `not_checked` said as "I couldn't check Stamp at 4 s", never "it stayed put"; Option or Shift mentioned only after L-1 (`<!-- L-1 -->`)
- [x] T324 [US2] Confirm `mentor/tools/null-parenting.mjs` and `mentor/lib/null-parenting-check.mjs` give T322's results; adjust those files only. T322 passes

---

## Phase 5: User Story 3 — Review the skill in a later session (P2)

**Goal**: review mode in the first build: a new group, no "null", the turn-or-scale question, no demo.

- [x] T325 [US3] Write `mentor/test/fixtures/null-parenting/records/learned-group.json` (skill learned and due, Tile, Caption and Stamp as past targets on Mentor Practice 2)
- [x] T326 [US3] Add the review section to `.claude/skills/null-parenting-mentor/SKILL.md` per TD § 11 and FR-024: name the layers and the task ("Row A, Row B and Row C should move as one; set that up so you can move them together, then give them one move") **without the word "null"** anywhere before a pass, ask whether the group turns or scales and from where; no demo, walkthrough, menu path or mention of jumps; a fail gets TD § 7's hints with no "null" ("Row B and Row C follow Row A, so anything you do to Row A drags them along"); `no_new_target` → no review and nothing recorded; "I already know it" runs the same way
- [x] T327 [US3] Add review tests to `mentor/test/null-parenting-tools.test.mjs` with T325's record: `mode: "review"` proposes Row A to C, never Tile, Caption or Stamp, and drops already-parented layers; `null_parent_demo` throws `REVIEW_NO_DEMO` with no snippet run; with no unparented group left, `no_new_target`; `FINDERS` with the record's past targets as `exclude` agrees; the review's stored null is taken at the first check that sees the null; `record_lesson` stores `{ layer, property: "Parent" }` per focus layer
- [x] T328 [US3] Set `FINDERS["parenting.null"].review = true` in `mentor/tools/null-parenting.mjs` once T327 passes (FR-003, FR-024)

---

## Phase 6: User Story 4 — Not ready for it (P2)

- [x] T329 [US4] Add the prerequisite parts to `.claude/skills/null-parenting-mentor/SKILL.md` per TD § 3 and spec 004 FR-005: skill 5 not learned → name it and offer it; on "go ahead", TD § 3's one sentence and no reteach; a missed N3 then suggests the pivot lesson as `next`; skill 4 (soft) never blocks and no "trace this one first" hand-off fires (FR-037); easing not learned: comments worded for someone who hasn't met it
- [x] T330 [US4] Add tests to `mentor/test/null-parenting-tools.test.mjs` with `records/anchor-not-learned.json`: the lesson still starts and checks the same way (the gate is the prompt's, spec 004 FR-005), and `recommend_next` names `transform.anchor` before `parenting.null`

---

## Phase 7: Overlap rows (cloud)

- [x] T331 [P] Add to `.claude/skills/null-parenting-mentor/SKILL.md` the overlap wording the rows need: an expression on a child (rows 1, 2), a move needs keys (row 4), "I can't see inside Icon, but it moves as a whole" (row 13), never "you've hidden this" for a hidden null (row 15), never claimed visible in a frame (row 16), shy is hidden in the timeline (row 18), never "hidden" for solo (row 20), the null's parent sentences (row 23), 3D a later topic (row 25), the Anchor Point-only hint (row 26), auto-orient (row 27), stacked motion one ungraded sentence (row 28), nothing about staggering (row 29), the null renamed noticed (Edge Cases), the rename ask (row 40)
- [x] T332 Write `mentor/test/null-parenting-overlap.test.mjs`: one named test per row 1 to 40 of spec › Edge cases where concepts overlap, each asserting what the focus and the check see on its fixture from `answer-key.json`; the rows marked **contract** (row 4) asserted against `comp-space.mjs` and `snapshot.jsx` as built

---

## Phase 8: Cloud hand-back

- [x] T333 Run `cd mentor && npm test` and `node --test .claude/hooks/test/*.test.mjs`; run `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`) and confirm the changed files are exactly the add-only table's, all added (FR-001, SC-008)
- [x] T334 Run `/agent-audit` on `.claude/skills/null-parenting-mentor/SKILL.md` and fix what it finds in that file
- [x] T335 Hand back for the sitting: branch and commit, test counts, T333's output, the `<!-- L-1 -->` places, whether SR-4 has landed, and what Phase 9 needs (quickstart › 2–5) *(superseded 2026-10-26: the sitting ran from the branch as it stood; its results are in live-sitting-2026-10-26.md)*

---

## Phase 9: The live sitting (🖐, one sitting at the builder's Mac, quickstart › 2–5)

**Setup**: after spec 004's T133 to T136 and T158 have passed (and SR-4 for L-6); the branch on the
Mac in a local worktree; After Effects 26.5 on `discovery/Claude AE Tutor Test.aep` with Mentor
Practice 2's 2b layers; the cockpit off AE; one skill-builder holding the AE lock (not during spec
011's sitting). The builder does the hand actions.

- [x] T336 🖐 [US1] Live checks L-1 to L-6 on a **duplicate** of Mentor Practice 2 (quickstart › 2); log each answer. If L-3 shows the scripted parenting jumps or takes more than one undo, note it for T339; if SR-4 hasn't landed, log L-6 as waiting
- [x] T337 🖐 [US2] Captures (quickstart › 3): every file in its table saved to `mentor/test/fixtures/null-parenting/` with `node mentor/dev/capture.mjs --times <the answer key's list>`; then delete the duplicates, confirm Mentor Practice 2 matches spec 004's `practice2b.json`, check no capture holds a user or folder name, save the `.aep`, release the lock
- [x] T338 Desk block, part 1 (not 🖐): point every test at the live captures and spec 004's (keeping `synthetic/`), delete `mentor/test/fixtures/null-parenting/stand-in/`, update `README.md`'s provenance; SC-006 on `practice2b-parented.json` and `parented-rot.json`; `npm test` green
- [x] T339 [US1] Desk block, part 2 (not 🖐): fix `mentor/jsx/null-parent-demo.jsx` for anything L-3 showed (and repeat that L-3 run before T340); allow auto-oriented candidates in `mentor/lib/null-parenting.mjs` only if L-4 (T158) says the rotation read includes it; fill each `<!-- L-1 -->` in `SKILL.md` with what L-1 logged at 26.5 (or leave it out); adjust `mentor/lib/null-parenting-check.mjs` only if a capture contradicts the answer key; `npm test` green. Any result that changes a requirement goes to the spec writer before T340
- [x] T340 🖐 [US1] First live lesson on Mentor Practice 2 (quickstart › 5), by the builder in a plain Claude Code session: time from `calls.jsonl` (SC-001). Done 2026-10-26 (`discovery/usage-notes/null-parenting.md` sessions 1 and 2: 3 min 51 s with one demo, then 4 min 28 s with none, Tile, Caption and Stamp proposed and taken)
- [x] T341 🖐 [US2] In the same lesson or right after: one deliberate jump checked, and every check compared with a scrub of each focus layer at its key times (SC-002: 9 of 10, and every deliberate jump). Done 2026-10-26 (session 2: an Option jump checked twice and a wrong parent once, all matching the scrub; SC-002 is 8 of 8 so far, and the last 2 checks ride along with T343)

---

## Phase 10: Polish and hand-back

- [ ] T342 Re-run T333's checks on the final branch (live fixtures, no stand-ins), and write the hand-back: branch and commit; test counts; L-1 to L-6 results; SC-001, SC-002 and SC-006; any snippet fix; anything for the spec; the Requests below. The cockpit writes `discovery/usage-notes/null-parenting-build.md` from it
- [ ] T343 🖐 [US3] Later, a day or more after the first pass: the live review on Row A to C (quickstart › 6, SC-009, stretch), logged by the builder; the cockpit adds it to the usage note

---

## Hand-offs to other owners (not builder tasks)

- **HO-1 Eval engineer:** hand off to eval-engineer: `product/evals/null-parenting/` from spec ›
  Eval plan. After T338. Case numbers from the cockpit.
- **HO-2 Curriculum designer:** `/overlap-audit` re-run on the built branch before HO-1: TD § 9
  against T332's tests on live fixtures, the rows marked **contract** re-confirmed against wave B's
  code as built, and L-1 to L-6's results.
- **HO-3 Reviewer:** a read of `SKILL.md` against FR-023 (version notes behind L-1; no Shift+F4) and
  FR-024 (no "null" in a review) before HO-1.
- **HO-4 Eval engineer, after merge:** the easing set at 25/25 or within one (SC-007), logged.

## Requests (to the cockpit; never a task here)

- **SR-4 (approved 2026-10-24 as spec 004 tasks-wave-b.md T164, T165, before T133; same as spec
  011's SR-2):** `comp.width` and `comp.height` in the snapshot (plan › Requests). The build and its tests don't wait (stand-ins carry the
  fields); the live proposal, eval case 1 and L-6 do.
- Plan › Open questions Q1 and Q2: approved 2026-10-24 (`null_not_ready`: T317, T320, T321;
  `null_scale_zero`: T316, T320, T321).

## Dependencies & execution order

- Phase 1 → Phase 2 (blocking) → Phase 3 → Phases 4, 5 and 6 (any order) → Phase 7 → Phase 8 →
  (spec 004 T133 to T136, T158; SR-4 for L-6) → Phase 9 → Phase 10.
- Within Phase 2: T303 to T308 first; then T309 → T310 → T311, and T312 → T313.
- Phases 4 to 6 need T320. T331 after T321.
- Phase 9 in order: T336 → T337 → T338 → T339 → T340 → T341. T343 a day or more after the first pass.
- HO-2 and HO-3 after T339; HO-1 after them; merge after HO-1's first run; HO-4 after merge.

## Parallel opportunities

- T303 to T308 (new files); T309 with T312's start; T314 to T316 with T317's writing; T322 with
  Phase 5; T331 with T332.
- Across specs: through T335 this runs alongside spec 011's builder (no shared file; both only add).
  Phase 9 doesn't overlap spec 011's sitting.

## Implementation strategy

1. **MVP:** Phases 1–3 (US1 in fixture mode).
2. Phases 4 to 6 (the jump, review mode and the prerequisite all ship in this first build).
3. Phases 7–8 close the cloud part; Phase 9 is one sitting after spec 004's live tasks; Phase 10
   hands back.

**Task count:** 43 (T301–T343): Setup 2, Foundational 11, US1 8, US2 3, US3 4, US4 2, overlap 2,
cloud hand-back 3, live sitting 6, polish 2. **🖐 live: 5** (T336, T337, T340, T341 in the sitting;
T343 a day or more later). Hand-offs: 4; requests: 1 (SR-4).
