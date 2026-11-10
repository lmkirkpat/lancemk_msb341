---
description: "Task list for spec 005: diagnosis"
---

# Tasks: Diagnosis ("what's wrong here?")

**Status**: Approved by the builder 2026-11-09 with [plan.md](plan.md). Spec 005 approved 2026-10-20 and
amended 2026-11-09 (spec › Amendment, T053 done). Teaching design: yes (T001 gates the wording); its fixes
SW-1 to SW-5 and SB-1 to SB-3 approved 2026-11-09 and folded into T003, T006, T011 to T014, T022 and T054. Order: the
first version (Phases 1 to 5), then US4 (Phase 6, not gated), then US3 (Phase 7, gated on T005). T053 is
the only task done; nothing is built.

**Input**: Design documents from `specs/005-diagnosis/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/diagnosis-tools.md](contracts/diagnosis-tools.md),
[contracts/catalogue.md](contracts/catalogue.md), [quickstart.md](quickstart.md).

**Tests**: included. The spec asks for a unit test on a saved snapshot for every catalogue finding and
every overlap row (FR-024), and for an eval set (FR-025). Unit tests are written before the code they
test, in the same branch.

## Format: `[ID] [P?] [Story?] Owner · Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks).
- **[US1]…[US5]**: the spec's user stories.
- **Owner** (`decisions/007`, `.claude/hooks/ownership.json`): **SB** skill-builder (`mentor/**`,
  `.claude/skills/*-mentor/**`); **EE** eval-engineer (`product/evals/**`); **CD** curriculum-designer
  (`specs/*/teaching-design.md`); **PB** panel-builder (`panel/**`); **UR** user-researcher
  (`discovery/**`); **RV** reviewer (reads only); **SW** spec-writer (`specs/**`); **Builder** (the
  human: AE sittings, live sessions); **Cockpit** (merges, numbers, `CLAUDE.md`).
- **Shared edit**: `mentor/**` and `.claude/skills/*-mentor/**` are add-only. A task marked
  **shared edit** changes an existing file and needs the cockpit's `--shared-owner` for that one
  branch (`check-branch.mjs`). There are three: T032, T038, T046.
- **🖐 AE**: needs After Effects 26.5 and the AE lock (`decisions/008`). One sitting at a time: run
  `ae_status` and check `.git/knack-agents/ae.lock.json` has no other holder from the last 10
  minutes. Save a Copy of the practice project outside the repo first.
- **$**: spends API credit (A only). Everything else runs on B1 or for free (`decisions/011`).
- **No heavy runs from the main checkout while eval batches run there**: tests and runners go in the
  agent's own worktree, cut from local `main`.
- **Ticking**: SB and PB may tick this file; EE, CD, UR and RV hand back task IDs and the cockpit
  ticks them.

---

## Phase 1: Setup

**Purpose**: the wording source, the planted comps and their live captures, the answer keys, and the
evidence that gates US3.

- [ ] T001 CD · Write `specs/005-diagnosis/teaching-design.md` (spec Q4, recommended answer). Cover: (a) a **Catalogue** section with one anchored entry per DX-01 to DX-09 (`dx-NN-title`, `dx-NN-effect` = what it does to the motion in plain words, `dx-NN-question` for ask kinds DX-05 and DX-06 and for each style kind's "is that on purpose?", `dx-NN-where` = where to look for kinds with no skill: panel, layer, property, time); (b) the **rank order** of the nine kinds and the words for each start-here reason (`depth`, `symptom`, `only_one`, `first_non_ask`), starting from research R5's default; (c) the **first answer** (at most 3, one to start with and why, how many more, the not-checked line, when to say the standing "motion only an expression drives" item per research R6); (d) **"fix all of it"**: one sentence, the reason, no offer to do it later, the next finding; (e) the **hint shape** for a finding no skill covers (FR-013); (f) the **re-check** words for fixed, still there, changed; (g) the **pattern** and review sentences (FR-020, US3); (h) the short **opening** (FR-026). Also answer, in the file: should DX-08 map to *Move a group with a null* (built) rather than *Find what's moving it* (not built)? If yes, that is a change to `curriculum.md` › findings and, through it, `path.json` (the curriculum's owner and SB, together). Don't restate the spec's requirements; link to them.
- [ ] T002 SB · Write `mentor/dev/build-diagnosis-comps.jsx` (research R14): in the open project, build three new comps and touch no other comp. **Diagnosis Practice**: the layers of `mentor/dev/build-practice-comp.jsx` as it built Mentor Practice (Title linear, Subtitle, CTRL null parenting Title and Subtitle with Position 0 to 1 s, Bar with Trim Paths End and separated X Position 0 / 0.6 / 1.2 s, Glow, Logo with Rotation keys and `time * 30`, Old Take hidden, Icon precomp, Background), with Cursor's Opacity **ramping linearly** between 100 and 0 at 0, 0.5, 1, 1.5, 2, 2.5 s (a fade, so Adobe's finding 5 is there to find; SC-002 counts it on this comp, approved 2026-11-09), layer and comp motion blur off, 8 s at 30 fps. **Diagnosis Clean**: four layers, eased, offset by at least 4 frames, different durations, motion until 0.5 s before the end, motion blur on for the layers and comp. **Diagnosis Precomps**: three precomp layers (one with time remap on, one stretched to 150%) and one keyed shape layer. Each comp is deleted and rebuilt if it already exists. Return an `expect` block per comp, as `build-practice-comp.jsx` does.
- [ ] T003 [P] SB · Write the answer keys by hand from T002's script, not by running any analysis (spec 004 T037's method), in `mentor/test/fixtures/diagnosis/`: `practice-expected.json` (DX-01 to DX-07 with layers, properties and times; DX-08 and DX-09 listed under `"story": "US4"`; the scope lists), `clean-expected.json` (no findings; the standing item only), `precomps-expected.json` (each precomp named as not checked inside; remap and stretch named), and `practice-bar-fixed-expected.json` (DX-04 gone, everything else as before). In `practice-expected.json`, Cursor's Opacity is DX-05 with `shape: "fade"` and is **not** in DX-01's layers and properties (SW-5, approved 2026-11-09); a `sources` line says so. Add answer keys for the overlap rows on the existing captures `mentor/test/fixtures/layer-info/overlaps.json`, `practice2b.json` and `practice2b-parented.json`, as `overlaps-diagnosis-expected.json` and so on, listing for each row in plan.md › Overlaps what must and must not be reported. Mark each key's source lines in a `sources` field.
- [ ] T004 Builder 🖐 AE · Run `mentor/dev/build-diagnosis-comps.jsx` on the practice project, then capture each comp active with `node mentor/dev/capture.mjs` (check the comp name it prints) into `mentor/test/fixtures/diagnosis/`: `practice.json`, `clean.json`, `precomps.json`; then ease Bar's middle X Position key by hand and capture `practice-bar-fixed.json`; Edit > Undo and capture `practice-bar-undone.json`; then add a null above Title by hand (renumbering) and capture `practice-renumbered.json`. Strict-compare `practice-bar-undone.json` with `practice.json` (the sitting method; `--compare` skips `layer_info`). Hand the files to SB.
- [ ] T005 [P] UR · Run spec SC-009's hidden-fault session with one target-market After Effects user who isn't the builder (`discovery/diagnosis-evidence.md` › 8; `discovery/interview-prep-2026-11-09.md`): a comp with a known hidden fault, watch which help they reach for first and what they do with the answer, pitch last. Log it in `discovery/interviews/` with the evidence-by-belief table (`/interview-log`), anonymized. Either result counts. **This gates Phase 7 (US3)** under spec Q1; it can run any time.

---

## Phase 2: Foundational (blocks every story)

**Purpose**: the catalogue, the scope rules, the open-diagnosis file and the analysis entry point.

- [ ] T006 SB · Create `mentor/curriculum/diagnosis.json` per [contracts/catalogue.md](contracts/catalogue.md): nine kinds, research R3's thresholds, R5's rank weights (or T001's order), wording keys that name T001's anchors, `"enabled": false` for DX-08 and DX-09. Write `mentor/test/diagnosis-catalogue.test.mjs`: exactly nine kinds; `rank_weight` is a permutation of 1 to 9 and matches `teaching-design.md`'s order; every wording key is an anchor in `specs/005-diagnosis/teaching-design.md`; ask kinds have a `question_key`; every kind has a `where_key`; an optional `first_key`, when present, is an anchor in the design too (SB-1, approved 2026-11-09); every DX ID has an entry in `path.json › findings`. Needs T001.
- [ ] T007 [P] SB · Write `mentor/lib/diagnosis-scope.mjs` (research R6, data-model › Not-checked list): `counted(snapshot)` (visibility class `renders` or `matte`, not soloed elsewhere, keys inside the layer's in and out points), `setAside` (`hidden`, `guide`, `soloed_elsewhere`), and `notChecked` (`precomp_inside` per precomp, `precomp_time` when `time_remap` is on or `stretch` isn't 100, `comp_motion_blur` when the snapshot has no `comp.motion_blur`, and `expression_only_motion` with `standing: true`, always). Reuse `visibility.mjs` and `layer-info.mjs`; a snapshot without `layer_info` falls back as `visibility()` does. Tests in `mentor/test/diagnosis-scope.test.mjs` on `layer-info/overlaps.json`, `overlaps-solo.json` and T004's `precomps.json`.
- [ ] T008 [P] SB · Write `mentor/lib/diagnosis-store.mjs` (research R8, data-model › Open diagnosis file): `diagnosis.json` in `MENTOR_HOME` (imported from `paths.mjs`, not edited), keyed `"<project>|<comp name>"`, `"version": 1`, read and written on every call with the temp-file-and-rename write, an unreadable file set aside through `json-file.mjs` with a new `DIAGNOSIS_UNREADABLE` code (`registerErrors`). Functions: `openFor(project, comp)`, `saveResult(project, comp, result)`, `markIntended(project, comp, key, date)`, `intendedFor(project, comp)`. Tests in `mentor/test/diagnosis-store.test.mjs` with `AE_MENTOR_HOME` set to a temp folder: round trip, two comps kept apart, a broken file set aside and not overwritten.
- [ ] T009 SB · Write `mentor/lib/diagnosis.mjs` › `analyze(snapshot, { catalogue, intended, symptom })` returning data-model › Diagnosis with empty findings, the scope from T007, and no detectors yet. Test in `mentor/test/diagnosis-analyze.test.mjs` that two calls on the same snapshot are deep-equal (FR-003) and that `analyze` touches no file.

**Checkpoint**: an empty diagnosis with a correct not-checked list runs on every capture.

---

## Phase 3: User Story 1 - Ask "what's wrong here?" and get a short, honest answer (P1) 🎯 MVP

**Goal**: one read of the whole comp, a ranked list, at most 3 up front, one place to start, what
wasn't checked, no change to the project.

**Independent Test**: spec US1 › Independent Test on Diagnosis Practice (quickstart § 3 steps 2, 3, 8).

- [ ] T010 [P] [US1] SB · Write `mentor/test/diagnosis-findings.test.mjs`: for each of DX-01 to DX-07, the finding T003's `practice-expected.json` lists is found on `practice.json` with its layers, property and times; nothing is found on `clean.json`; the thresholds' edges (DX-02 with only 2 layers; DX-04 at ratio 1.49 and 1.5; DX-07 at 1.9 s and 2 s of gap) from small synthetic snapshots under `mentor/test/fixtures/diagnosis/synthetic/`, each with a `comment` saying it's synthetic. Fails until T012 and T013.
- [ ] T011 [P] [US1] SB · Write `mentor/test/diagnosis-overlap.test.mjs`: one test per row of plan.md › Overlaps except parenting and the comp motion blur switch (US4), on T003's overlap answer keys: expression keys left out of DX-01 to DX-05 and DX-07 and raised as DX-06; single keys never a move; held pairs an instant change, a run of holds no DX-05; half-eased counted as not eased with the linear end; separated X and Y one unit; effect keys counted; a precomp's own transform read and its inside named; hidden, guide and soloed-elsewhere layers set aside and named; a matte's motion counted with its eye off; moves outside in and out points left out; a property raised as DX-05's fade shape not in DX-01 (SW-5); a static layer never reported; `practice-renumbered.json` gives the same findings as `practice.json` by name.
- [ ] T012 [US1] SB · Write DX-01 to DX-04 in `mentor/lib/diagnosis-findings.mjs` with research R3's rules and R4's shapes, thresholds read only from the catalogue. DX-01 uses `analyze.mjs` › `segments()` and `segmentState()` on counted layers (one finding per comp, `measures.partly_eased` naming the linear end), leaving out any property DX-05 raises with `shape: "fade"`, so `analyze()` runs DX-05's fade check before DX-01 (SW-5). DX-02 and DX-03 use `timing.mjs` › `timing()` units and moves (ramps only), compared in whole frames. DX-04 uses key values (straight-line distance for multi-value keys; a bezier middle key's in and out ease speeds) and skips properties whose values weren't read (shape and text). Wire them into `analyze()`.
- [ ] T013 [US1] SB · Write DX-05 to DX-07 in `mentor/lib/diagnosis-findings.mjs`. DX-05 (ask): (a) ramps alternating between exactly two values over 3 or more keys, `measures.shape: "fade"`, (b) a lone held pair on Position, Scale or Rotation between different values, `measures.shape: "jump"`; `measures.values` the two values (SB-2). DX-06 (ask): one per keyed property with `expression_enabled`. DX-07: last change = latest counted landing, instant change, or a counted layer's in or out point inside the comp; fires at ≥ 2 s and ≥ 25% of the comp; `measures` = `{ last_change, comp_duration, gap, expression_moving: [{ layer, property }] }`, data only: no sentence in the result, the words come from `dx-07-effect` (SB-3, contract › replies carry data). T010 and T011 pass.
- [ ] T014 [US1] SB · Write `mentor/lib/diagnosis-rank.mjs` (research R5): symptom first (`symptom.layers`, optional `symptom.time` ±0.5 s) with `symptom_matched`; then `rank_weight`; ties by layer count then earliest time; `start_here` per research R5 as amended 2026-11-09 (SW-1, SW-2): with a matched symptom, the highest-ranked non-ask among the matched findings, else the first matched one (`symptom`); without, the highest-ranked non-ask (`depth`, or `only_one` with one finding), else rank 1 (`all_questions`); no `first_non_ask`; `top` = first 3, `more = { count, ask_count }`. Intended keys left out. Tests in `mentor/test/diagnosis-rank.test.mjs`: a symptom on Bar puts DX-04 first; a symptom on a layer with no finding gives `symptom_matched: false` and the normal order; all-ask comps start at rank 1 with `all_questions`; a symptom on Cursor alone starts at Cursor's DX-05 with `symptom`, not at an unmatched non-ask.
- [ ] T015 [US1] SB · Write `mentor/tools/diagnosis.mjs` with `TOOLS = [diagnose_comp]`, `SKILLS = []`, no `FINDERS`, per [contracts/diagnosis-tools.md](contracts/diagnosis-tools.md) › `diagnose_comp`: one `takeSnapshot()`, `analyze()`, rank, `rest`, `scope`, `is_new`, `layers`, `notes_unreadable`; saves the result with `diagnosis-store.saveResult` (data-model fields; no learner record yet). Tool description says at most 3 up front, one to start with, never call a style or ask finding a mistake, and changes nothing. `readOnlyHint: true`. Tests: `mentor/test/diagnosis-tools.test.mjs` in fixture mode (`AE_MENTOR_FIXTURE_STATE`) on `practice.json`, `clean.json` and `unreachable` (the error passes through); `mentor/test/diagnosis-readonly.test.mjs` asserting the file calls `runSnippet` with no snippet but `snapshot` and never with `undo: true`, and that `tools/index.mjs` loads it with no duplicate names.
- [ ] T016 [US1] SB · Write `mentor/test/diagnosis-answer-keys.test.mjs` for SC-001: on every capture with an answer key (at least 6: `practice`, `clean`, `precomps`, `overlaps`, `practice2b`, `practice2b-parented`), 100% of the key's US1 findings are found and 0 that the key marks false are reported.
- [ ] T017 [US1] SB · Write `.claude/skills/diagnose-mentor/SKILL.md` (research R13): frontmatter `name: diagnose-mentor`, the description's triggers, `allowed-tools: mcp__ae-mentor__diagnose_comp, mcp__ae-mentor__check_finding, mcp__ae-mentor__mark_intended, mcp__ae-mentor__preview_frame, mcp__ae-mentor__read_learner_record, mcp__ae-mentor__recommend_next, Skill` (no demonstration tool, no `after-effects` tool). Hard rules as `next-mentor`'s (only `ae-mentor` tools; no claims after AE errors; plain speech, never a DX ID, field or quoted value; never announce a call), plus: never call a style or ask finding a mistake; never say keys "do nothing". Steps for the first answer, in T001's words: call `diagnose_comp` (with `symptom_layers` and `symptom_time` mapped from what the learner said to names in `layers`); lead with `top` and `start_here`; say `more`; name precomps and set-aside layers; the standing item only per research R6; `symptom_matched: false` → say nothing it can read explains it; empty `top` → nothing found, what it can't see, then `recommend_next`; "show me the rest" → `rest` without a new call. Copy wording only from `teaching-design.md` › Pass lines, not as fixed sentences (the pacing lesson: the model copies examples word for word).
- [ ] T018 [US1] SB · Run `/overlap-audit` on diagnosis (detectors, scope, rank). Add a regression test for each miss in `mentor/test/diagnosis-overlap.test.mjs`, fix it, and hand any change to plan.md › Overlaps or the spec's Edge Cases to SW as a proposed edit (SW owns those files).

**Checkpoint**: `diagnose_comp` gives the answer key's findings on every capture; the skill leads the first answer.

---

## Phase 4: User Story 2 - Be led into the fix, not handed it (P1) 🎯 MVP

**Goal**: pick a finding; a lesson is offered (or hints given); "done" is checked from a fresh read;
"fix all of it" is declined; intended findings are dropped for the comp.

**Independent Test**: spec US2 › Independent Test (quickstart § 3 steps 4 to 7).

- [ ] T019 [P] [US2] SB · Write `mentor/lib/diagnosis-compare.mjs` (research R7, data-model › state changes): finding keys from DX ID + sorted layer names + property display path; `compare(before, after)` → per key `fixed`, `still`, `changed` (measures differ, or another DX on the same layer and property), `unmatched` (a name now on two layers), plus `also_fixed`, `still_open` and `new_findings`; a fixed key that comes back is `open`. Tests in `mentor/test/diagnosis-compare.test.mjs` on `practice.json` → `practice-bar-fixed.json` (DX-04 fixed, others still), → `practice-bar-undone.json` (back), and `practice.json` → `practice-renumbered.json` (no state change from renumbering).
- [ ] T020 [P] [US2] SB · Write `mentor/lib/diagnosis-recommend.mjs` steps 1 to 3 of research R10: the start-here finding's skill from `path.json › findings`; `not_teachable_yet` for `null` or a skill no tool file declares (`motion.sources` today); `review` when learned and its finder has `review: true`; `practice` when learned without (easing); else `lesson`; `focus_layers` = the finding's layer names. It never calls `session.recordReviewOffer` (FR-020). Fill `Finding.skill` for every finding. Tests in `mentor/test/diagnosis-recommend.test.mjs` with records from `mentor/test/fixtures/records/`: DX-01 → Easing lesson or practice; DX-06 → not teachable yet; DX-05 with key types learned → review; `session.json`'s `review_offers` unchanged after a call.
- [ ] T021 [US2] SB · Add `check_finding` and `mark_intended` to `mentor/tools/diagnosis.mjs` per the contract: `check_finding` takes a fresh snapshot every call (FR-014), compares with `diagnosis.json`'s open result, saves the new states, errors `NO_DIAGNOSIS` and `UNKNOWN_FINDING`; `mark_intended` takes no snapshot, writes the mark for this project and comp only, and later `diagnose_comp` calls leave the key out of `top` and `rest` and count it in `since.intended`. Wire `recommendation` into `diagnose_comp`. Tests in `mentor/test/diagnosis-tools.test.mjs` (fixture mode, the state file switched between captures as the eval runner does): "done" on DX-04 after the fix gives `fixed`; after the undo, `still`; marking Cursor's DX-05 intended drops it on the next read and not on another comp.
- [ ] T022 [US2] SB · Add US2's steps to `.claude/skills/diagnose-mentor/SKILL.md` in T001's words: picking a finding with a built skill → offer that lesson by `skill_name` on its `focus_layers`, hand over with the `Skill` tool as `/next-mentor` › step 6 does (same table, layer names as arguments, `review` for a review); if the hand-over can't run (B1), stop at the offer; no skill, or the learner turns the lesson down → the hint from the kind's `where_key` (where: panel, layer, property, time), ask them to change it, make no change (FR-013 as amended 2026-11-09); "done" → `check_finding`, then say the result and what's still open; "fix all of it" or "do the rest" → decline in one sentence with the reason, no offer to do it later, name the next finding; style and ask findings → ask whether it's on purpose before treating it as something to fix, and on "yes" call `mark_intended`.
- [ ] T023 [US2] SB · Run `/agent-audit` on `.claude/skills/diagnose-mentor/SKILL.md` and `mentor/tools/diagnosis.mjs` (hard rules enforced in tools, nothing internal reaching the learner, unreadable files not treated as empty, quirks stated at the tool layer). Fix the findings; hand the audit's list back with the branch.

**Checkpoint**: US1 + US2 run end to end in Claude Code on fixtures; ready for the eval set.

---

## Phase 5: User Story 5 - Diagnosis is evaluated (P1) 🎯 MVP

**Goal**: a diagnosis eval set that scores teaching as well as correctness, and the easing set unmoved.

**Independent Test**: spec US5 › Independent Test (quickstart § 2).

- [ ] T024 [US5] EE · Create `product/evals/diagnosis/` on the shape of `product/evals/next-mentor/`: `run.mjs` (headless runs on saved snapshots, `--dry-run`, `--only`, `--changed`, `--repeat`, `--runtime a|b1`, cost tracking, `runtimes` per case), `README.md`, `rubric.md` with the spec's rubric additions (leads with one place to start; honest about limits; asks about intent before calling something wrong; doesn't lecture the whole list), `fixtures/` copied from `mentor/test/fixtures/diagnosis/` and `layer-info/` (copied, not linked; the eval engineer doesn't edit `mentor/`), and `records/`. Case numbers from the cockpit.
- [ ] T025 [US5] EE · Write the deterministic checks for every case in `product/evals/diagnosis/run.mjs` or `product/evals/lib/`: at most 3 findings named in the first answer and one named to start (SC-005); every precomp and set-aside layer in the result named when present (SC-005); no tool called outside the skill's `allowed-tools`, no demonstration tool, and no `fixture-edits.json` written (SC-003); plain speech in every learner-facing turn: no `DX-`, no underscore or dotted names, no quoted values (spec eval case 14); a decline of "fix all" holds no offer to do it later.
- [ ] T026 [US5] EE · Write cases for the spec's eval plan items 1 to 5 and 7 to 10 (runs on B1 and A): open on Diagnosis Practice (Logo's expression as a question); symptom named on Bar, and a symptom nothing explains; Diagnosis Clean; Diagnosis Precomps; "fix all of it" and "do the rest"; a finding no skill covers (hints only); "done" with the after-fix capture as the turn-2 fixture; the Cursor fade raised as a question and dropped on "it's meant to fade"; AE unreachable. At least 10 cases with these (SC-006).
- [ ] T027 [P] [US5] EE · Write eval plan item 6 (pick a finding a skill covers): on B1 the offer only, naming the skill and layer; on A (A-only case, as next-mentor's 10 to 13) the real hand-over to `/ease-mentor` with the finding's layer, and the lesson's demo rule holding. Mark next-mentor's inherited gap (named layers may not reach the lesson) as `known_gap`.
- [ ] T028 [US5] EE · Dry-run, then the first B1 run of the set; triage with `/eval-triage` (plumbing, hard-rule, rubric); send `SKILL.md` or tool failures to SB with the case IDs and the smallest proposed fix; record the result file in the README.
- [ ] T029 [US5] SB · Fix what T028 sent (conditional): `SKILL.md` wording from the rubric's Pass lines, or tool output; add a unit test for any tool fix.
- [ ] T030 [US5] EE · Re-run T028's failures `--repeat 3`, then the whole set; record the B1 baseline (≥ 80%, every hard-rule check passing; SC-006).
- [ ] T031 [US5] EE · Re-run the easing set on the commit with diagnosis merged: within one case of 27/28 (2026-10-29) with no hard-rule failure (US5 › 2). Dry-run the other five sets and confirm their tool lists and prompts didn't change (the server's instructions are untouched, research R12). Note in the hand-back that the `mentor/` tree hash moved, for spec 006 FR-025's A re-use rule.

**Checkpoint**: MVP done: US1, US2, US5. Then live session 1 (T049) can run.

---

## Phase 6: User Story 4 - Diagnosis sees parents and switches (P2)

**Goal**: DX-08 (a child's motion fighting its parent's) and DX-09 (motion blur off), the two of
Adobe's 8 that need parenting and switches. Built right after Phase 5, not gated (approved 2026-11-09,
research R15).

**Independent Test**: spec US4 › Independent Test (quickstart § 3 step 2, SC-002's 8 of 8).

- [ ] T032 [US4] SB · **Shared edit**: add `motion_blur: comp.motionBlur` (through `rd()`) to the `comp` object in `mentor/jsx/snapshot.jsx` (research R1). Nothing else in the file changes. Test in `mentor/test/diagnosis-scope.test.mjs` that a capture without the field lists `comp_motion_blur` as not checked and one with it doesn't. Run the existing mentor suite in the worktree: only new tests added.
- [ ] T033 [P] [US4] SB · Write tests for DX-08 and DX-09 in `mentor/test/diagnosis-findings.test.mjs` and the parenting and motion blur rows in `mentor/test/diagnosis-overlap.test.mjs`: Title and Subtitle under CTRL on `practice.json` give one DX-08 for CTRL with both overlap spans (0.5 to 1 s, 0.3 to 1 s); a parent keyed only on Opacity raises nothing; a grandparent's move counts; a parent with an expression on a transform property gives a `parent_expression` not-checked item and no DX-08; a static parent raises nothing (US4 › 3). DX-09: comp switch off fires once; all animated layers off fires once; mixed with the comp on doesn't fire; an unread comp switch checks only the layers.
- [ ] T034 [US4] SB · Write DX-08 (with `motion-sources.mjs` › parent chains and MOVES, overlap ≥ 1 frame, one finding per parent) and DX-09 (one per comp, kind `setting`) in `mentor/lib/diagnosis-findings.mjs`; set `"enabled": true` for both in `mentor/curriculum/diagnosis.json`; update `practice-expected.json`'s US4 block and T016's test to include them. T033 passes.
- [ ] T035 [US4] SB · Add to `.claude/skills/diagnose-mentor/SKILL.md`, in T001's words: name both layers and the overlapping time for DX-08; say motion blur once, as a setting, never per layer (US4 › 2).
- [ ] T036 [US4] Builder 🖐 AE · After T032 is merged, in a fresh session, re-capture `practice.json` and `clean.json` with the comp switch read, strict-compare them with T004's captures (only `comp.motion_blur` should differ), and hand them to SB and EE.
- [ ] T037 [US4] EE · Add cases for US4's acceptance scenarios 1 to 3 to `product/evals/diagnosis/` with T036's captures, and re-run the set on B1.

---

## Phase 7: User Story 3 - What was found carries into the next session (P2) — gated on spec Q1

**Gate**: start only after T005 is logged and the builder releases US3 (spec Q1's recommendation). If
the learner reaches for a chatbot and is satisfied, rethink before building this phase.

**Goal**: the record keeps what was found; the next session re-reads before saying anything is still
open; a repeated kind becomes the thing to practice.

**Independent Test**: spec US3 › Independent Test (quickstart § 4).

- [ ] T038 [US3] SB · **Shared edit**: export `saveDiagnosis(entry)` from `mentor/lib/learner-store.mjs` (research R9, data-model › Diagnosis record): upsert by `id` into a top-level `diagnoses` array, version stays 1, layer and property names checked with the existing email and phone patterns (`UNSAFE_RECORD`, nothing written), same read and write as `recordLesson`. No other function changes. Tests in `mentor/test/learner-store-diagnoses.test.mjs`: `skills`, `lessons` and `marks` byte-identical before and after (FR-021); a record without `diagnoses` gains it only on the first save; `recordLesson` keeps `diagnoses` untouched; `learner-store-v1.test.mjs` unchanged and passing.
- [ ] T039 [US3] SB · In `mentor/lib/diagnosis-store.mjs`, upsert the learner record after every complete `diagnose_comp`, `check_finding` and `mark_intended` (research R9), with only data-model › Diagnosis record's fields ("no free-text field exists (FR-018)"). A refused save still returns the diagnosis. Tests: no field outside the data model reaches `learner.json`; an `UNSAFE_RECORD` layer name leaves the file unchanged.
- [ ] T040 [US3] SB · Fill `since` in `diagnose_comp` (FR-019): from the record's latest diagnosis of this project and comp (and `diagnosis.json`), compared with a fresh read through `diagnosis-compare.mjs`: what looks fixed, what changed, what's intended, what's still open, with the earlier date. Another comp's diagnosis is never shown. An unreadable record sets `notes_unreadable: true` and the diagnosis still runs (US3 › 5). Tests on `practice.json` with records for: no earlier diagnosis, one finding fixed since, all fixed since (SC-008's three checks).
- [ ] T041 [US3] SB · Add step 4 of research R10 to `mentor/lib/diagnosis-recommend.mjs`: `pattern` when the same DX ID appears in 2 or more record diagnoses on any comps, counting this one. Tests in `mentor/test/diagnosis-recommend.test.mjs` with a record holding DX-02 twice (spec eval case 12) and a learned skill (case 13).
- [ ] T042 [US3] SB · Add to `.claude/skills/diagnose-mentor/SKILL.md`, in T001's words: an opening with `since` in one or two sentences, only after the fresh read; what looks fixed said as fixed; the pattern named with its skill; a learned skill's finding offered as a review, not a first lesson; `notes_unreadable` said once.
- [ ] T043 [P] [US3] PB · Add a test in `panel/test/` that `panel/lib/memory.js` reads a record holding a `diagnoses` array exactly as it reads one without (version 1, same memory text). No panel behavior changes here; showing a remembered diagnosis is spec 007's held FR-047.
- [ ] T044 [US3] EE · Add spec eval items 11 to 13 to `product/evals/diagnosis/` with records in `records/`: a next session with an open diagnosis (opens with what's still open after re-reading; the fixed one called fixed), the pattern, the learned-skill review; plus SC-008's three opening checks. Add a deterministic check that the record after each case has no keys outside data-model › Diagnosis record. Run on B1.
- [ ] T045 [US3] Builder 🖐 AE · Quickstart § 4: diagnose Diagnosis Practice, fix one finding, end the session; open a new one on the same comp and check the opening against a fresh read (SC-008's live half). Open `learner.json` and confirm the entry holds IDs, names, times and states only. Log it in `discovery/usage-notes/diagnosis.md`.

---

## Phase 8: Entry (FR-026, low priority)

**Goal**: a session started in Claude Code without naming a skill opens with the short diagnosis; a
session that names a skill never does. The panel starts named skills, so it's unaffected.

- [ ] T046 SB · **Shared edit**: in `.claude/skills/next-mentor/SKILL.md`, remove "or starts a session without naming a skill" from the `description` and update the paragraph that says "once spec 005's diagnosis is built" to say diagnosis now opens those sessions and calls `recommend_next` when the comp has no findings. In `.claude/skills/diagnose-mentor/SKILL.md`, add that trigger and the short opening (one or two sentences, one place to start) in T001's words. No other line in `next-mentor` changes.
- [ ] T047 EE · Add spec eval item 15 (both halves: no skill named → the short opening; a skill named → no diagnosis opening) to `product/evals/diagnosis/`, and re-run next-mentor's cases 01 to 05 on B1 to confirm they didn't move.

---

## Phase 9: Close (live sessions, the move to A, spec updates)

- [ ] T048 RV · Review the merged diagnosis branches against spec FR-001 to FR-026 and the contracts: read-only on the project, no free text in the record, tool-made decisions not left to the prompt, overlap rows covered by tests. Hand findings to the owners; the reviewer edits nothing.
- [ ] T049 Builder 🖐 AE · Live session 1 on Diagnosis Practice, quickstart § 3 steps 1 to 8: SC-002 (6 of Adobe's 8 after US1, plus the linear pairs, each matching an inspection in AE), SC-004 (≤ 30 s to the first finding, from `calls.jsonl` and the clock), SC-003 (strict compare before and after, apart from your own fix). Log with `/usage-session` in `discovery/usage-notes/diagnosis.md`; any behavior problem becomes a proposed eval case for EE.
- [ ] T050 Builder 🖐 AE · Live sessions 2 and 3 (SC-007: in each, resolve at least one finding with your own hands after the lead, and the re-check agrees with AE). After Phase 6, check SC-002's 8 of 8.
- [ ] T051 EE $ · Move to A (`decisions/011`): `node product/evals/lib/ready-for-a.mjs diagnose-mentor`; `--runtime a --dry-run` on the set; then the paid A run against T030's B1 baseline (FR-033's bar), A-only hand-over cases included (about $2 to $4, from easing's $2.03 for 28 cases). Triage any A-only failure before T052.
- [ ] T052 Builder 🖐 AE $ · One live diagnosis in the panel on A (`bash panel/install.sh --runtime a`), on Diagnosis Practice through a hand-over into the easing lesson. Log it in `discovery/usage-notes/diagnosis.md`.
- [x] T053 SW · Amend `specs/005-diagnosis/spec.md` with research R16's six items, as approved (2026-11-09), and set its status line to planned and tasked. Done 2026-11-09: spec › Amendment 2026-11-09 and Resolved questions.
- [ ] T054 SW · Amend `specs/007-ui-overhaul/spec.md` (awaiting approval): un-hold the diagnosis screens (FR-031 to FR-047, RQ-03 to RQ-10) against [contracts/diagnosis-tools.md](contracts/diagnosis-tools.md), and change the stopped-turn edge case to match research R9 (approved 2026-11-09: a tool call that completed before Stop is recorded). Also FR-035: **No lesson yet · Get hints ›** becomes available for findings whose skill is built too (DX-01, DX-03, DX-05), since hints apply when a lesson is turned down (spec FR-013, SW-3 and SW-4, approved 2026-11-09). The panel's diagnosis tasks then go in spec 007's tasks, for PB.
- [ ] T055 SW · Amend `specs/006-installer/spec.md` (awaiting approval): its uninstall also removes `diagnosis.json` from the learner home.
- [ ] T056 Cockpit · Update `CLAUDE.md` › Current state with spec 005's progress, and close the spec when SC-001 to SC-008 are met (SC-009 is logged either way).

---

## Dependencies and order

- **T001 → T006**, and every `SKILL.md` task (T017, T022, T035, T042, T046) needs T001.
- **T002 → T004 → T003's capture-backed checks**; T003 can start from T002's script alone.
- **Phase 2** (T006 to T009) blocks every story. T007 and T008 in parallel.
- **US1**: T010 ‖ T011 first (failing), then T012 → T013 → T014 → T015 → T016; T017 after T015; T018 after T013.
- **US2** after T015: T019 ‖ T020, then T021 → T022 → T023.
- **US5** after T023: T024 → T025 → T026 ‖ T027 → T028 → T029 → T030; T031 after the merge.
- **US4** after US1 (needs T013's detectors and T016's test): T032 → T036; T033 → T034 → T035; T037 after T034 and T036.
- **US3** after T005 and the builder's release: T038 → T039 → T040; T041 after T020; T042 after T040 and T041; T043 any time after T038; T044 after T042; T045 last.
- **Entry** after T017: T046 → T047.
- **Close**: T048 after the MVP merge; T049 after T030; T050 after T049 (and after Phase 6 for 8 of 8); T051 after T030; T052 after T051; T053 to T055 any time after approval; T056 last.
- **AE sittings, one at a time**: T004, T036, T045, T049, T050, T052.

## Parallel examples

```text
Day one:        CD: T001        SB: T002 → T003        UR: T005 (independent, any time)
After T006:     SB: T007 ‖ T008, then T009
US1 tests:      T010 ‖ T011
US2 start:      T019 ‖ T020
US5:            EE: T026 ‖ T027 while SB starts US4's T033
US3 (released): T043 (PB) alongside T039 to T042 (SB)
```

## Implementation strategy

1. **MVP = Phases 1 to 5** (US1, US2, US5): a diagnosis that reads the whole comp, leads into the fix,
   and is evaluated. Then live session 1 (T049). That is the smallest test of whether diagnosis is
   worth anything to a learner.
2. **US4 next**: cheap now that the reads exist; it closes SC-002 to 8 of 8.
3. **US3 only after T005**: memory is the harder-to-copy part, but it's unevidenced (claim L). The
   hidden-fault session decides whether it's worth building yet.
4. **Entry last**, small.
5. **Then A** (T051, T052), and spec 007's held screens through T054.

## Task count by owner

| Owner | Tasks | Count |
|---|---|---|
| skill-builder | T002, T003, T006–T023, T029, T032–T035, T038–T042, T046 | 31 |
| eval-engineer | T024–T028, T030, T031, T037, T044, T047, T051 | 11 |
| Builder | T004, T036, T045, T049, T050, T052 | 6 |
| spec-writer | T053–T055 | 3 |
| curriculum-designer | T001 | 1 |
| user-researcher | T005 | 1 |
| panel-builder | T043 | 1 |
| reviewer | T048 | 1 |
| Cockpit | T056 | 1 |

56 tasks. By phase: Setup 5, Foundational 4, US1 9, US2 5, US5 8, US4 6, US3 8, Entry 2, Close 9.
🖐 AE: T004, T036, T045, T049, T050, T052. $: T051, T052. Shared edits: T032, T038, T046.
