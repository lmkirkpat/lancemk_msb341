---
description: "Task list for spec 008: skill 2, shape the ease in the speed graph"
---

# Tasks: Shape the ease in the speed graph (curriculum skill 2)

**Status**: Approved 2026-10-21.

**Input**: Design documents from `specs/008-speed-graph/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/tools.md](contracts/tools.md),
[quickstart.md](quickstart.md); spec 004's
[skill-module.md](../004-ae-curriculum/contracts/skill-module.md) and
[shared-tools.md](../004-ae-curriculum/contracts/shared-tools.md). The teaching design is
[teaching-design.md](teaching-design.md) ("TD §", read only).

**Starts after**: spec 004's wave A shared branch (T001–T065) has merged. This builder runs in
parallel with specs 009 and 010's.

**Tests**: included and written first. The spec requires unit tests for the pass rule, the
fastest part and every overlap row (FR-025, SC-003, SC-004).

## Add-only: the files this branch may touch

The skill-builder **only adds** these files. It changes **no existing file** under `mentor/`,
`bridge/` or `.claude/skills/*-mentor/` (`ownership.json` › addOnly; `.claude/README.md` › Run a
parallel job, step 4), and nothing under `product/evals/`, `panel/` or `discovery/`.

| Added file | Tasks |
|---|---|
| `mentor/lib/speed-graph.mjs` | T008–T011; constants only in T029, T031 |
| `mentor/lib/speed-graph-bezier.mjs` | T007 |
| `mentor/tools/speed-graph.mjs` | T016, T021, T024 |
| `mentor/jsx/speed-graph-demo.jsx` | T014 |
| `mentor/fixture/speed-graph-demo.mjs` | T015 |
| `mentor/test/speed-graph-{shape,fastest,analyze,tools,demo,overlap}.test.mjs` | T004–T006, T012, T013, T019, T022, T025, T031 |
| `mentor/test/fixtures/speed-graph/` (README, answer key, record, stand-ins, live captures) | T002, T003, T018, T030, T031 |
| `.claude/skills/speed-graph-mentor/SKILL.md` | T017, T020, T023, T031 |

A shared change none of this covers goes in **Requests** (end of file) and the hand-back, never
into a task here. `specs/008-speed-graph/tasks.md` itself may be checked off by the builder.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks).
- **[Story]**: US1 (shape my eases), US2 (review), US3 (sent to easing), from spec.md.
- **🖐 Live**: needs After Effects 26.5 on the builder's Mac and the AE lock (`decisions/008`).
  All 🖐 tasks but the last are in **one sitting** (Phase 7, quickstart › 2–5). Everything
  before Phase 7 runs in the cloud container without AE.

---

## Phase 1: Setup (cloud)

- [ ] T001 Confirm the base: `cd mentor && npm test` green on the untouched branch (note the count in the hand-back); `mentor/lib/snapshot.mjs`, `mentor/lib/host.mjs`, `mentor/fixture/README.md` and `mentor/test/fixtures/practice2-before.json` exist; `session.start` accepts `skill`, `analyze`, `mode`, `skill_options` (grep `mentor/lib/session.mjs`). If any is missing, stop and hand back: the shared merge isn't in
- [x] T002 Create `mentor/test/fixtures/speed-graph/README.md` listing every fixture this skill will use, its source (live capture, which sitting step, or stand-in for which live file), and the rule that stand-ins are deleted before merge (research R8)

---

## Phase 2: Foundational (cloud, blocking): the pure analysis

**Purpose**: candidates, the pair check and the fastest part, as pure functions with no AE call.

**⚠️ No user story phase starts until this phase is green.**

### Tests first

- [x] T003 [P] Write the stand-ins in `mentor/test/fixtures/speed-graph/stand-in/`, each starting `"synthetic": "stand-in for <live file>"` (research R8): `practice-now.json` (from `mentor/test/fixtures/practice-before.json` with Title Position at 4 eased keys 0.5, 1.5, 3, 4.37 s, Title Scale and Opacity and Bar Trim Paths End eased, Subtitle Position eased with a key at 4.37 s, values added, per `discovery/usage-notes/mentor-practice-state-2026-10-20.md`), and one per planted shape in quickstart › 3. Write `mentor/test/fixtures/speed-graph/answer-key.json`: per fixture file name, the expected candidates, focus, demo target, and per pair `result`, `failed`, `mistake`, `dimension`, `fastest.parts`
- [x] T004 [P] Write `mentor/test/speed-graph-shape.test.mjs` for the pair check (FR-010 to FR-014, data-model › Pair result): 15/80 passes; 33/33 fails b with `not_shaped` (and `back_to_default` when `seen_shaped` has it); landing 20 points above start passes and 19.9 fails a; both facing sides within 1 of 33.33 fails b; a linear or hold facing side fails c with `no_handle` and `key_time`; landing speed at 5% of average passes, above fails d with `arrives_moving`, and `drag_sideways` when the landing influence is within 1 of baseline; unknown values need speed ≤ 0.001; both ≥ 50 and a failing gives `long_both_ends`; start in side changed, out side not and not another focus pair's landing gives `in_out_mixed`; a moving dimension failing alone names it ("height"); a non-moving Scale dimension isn't graded; shared middle key (FR-013): pair 1's landing change never counts for pair 2 and back; key count or times changed gives `keys_changed`, not graded (FR-014); demo credit `demo`, `learner_after_undo`, `learner_redo`, `unknown` (FR-008, fingerprint within 0.0005 of 15.13 and 79.87). The constants 20, 1, 33.33, 0.05, 0.001 are asserted by name from the lib
- [x] T005 [P] Write `mentor/test/speed-graph-fastest.test.mjs` for `fastestPart()` (FR-016, research R2): Easy Ease → `["middle"]`; 15/80 → includes `"first"`; 80/15 → `"last"`; a peak within 0.05 of 1/3 returns both neighbours; non-zero speeds shift the peak as the curve says; unseparated Position uses the one ease dimension; Scale uses the moving dimension with the largest change; deterministic
- [x] T006 [P] Write `mentor/test/speed-graph-analyze.test.mjs` for `analyze(snapshot, opts)` (FR-003 to FR-007, data-model › Candidate, Analyzer result) on the stand-ins: on `practice-now.json` with no options the focus is Title with exactly Position 0.5–1.5, 1.5–3, 3–4.37 s and Scale 0.5–1.5 s and the demo target is Position 0.5–1.5 s; `left_out` lists hidden (Old Take), null (CTRL), precomp (Icon), expression (Logo), ease first (the linear and half-eased pairs), each once, in FR-005's order; `eased_layers` ranks a named layer first and ignores a missing name; `land_hard` drops a pair from candidates and targets; `focus_layers: ["Bar"]` allows Trim Paths End alone (one target, so the session gives no demo); a pause pair is never a candidate; a pair that already passes is `already_shaped`; no candidate gives `no_demo_reason: "nothing_to_shape"` and `ease_first_count`; `exclude` drops matching `{layer, property}`; `FINDERS["easing.speed_graph"].focus` count is above 0 exactly when `targets` is non-empty with the same `exclude`, on every fixture (contract › 2)

### Implementation

- [x] T007 [P] Create `mentor/lib/speed-graph-bezier.mjs` exporting `fastestPart({ duration, delta, out: { speed, influence }, in: { speed, influence } })` → `{ peak, parts }` per research R2 (200 samples, 0.05 boundary tolerance). T005 passes
- [x] T008 Create `mentor/lib/speed-graph.mjs` with the constants (`MIN_GAP = 20`, `DEFAULT_INFLUENCE = 33.33`, `DEFAULT_TOL = 1`, `REST_SHARE = 0.05`, `REST_ABS = 0.001`, `DEMO_OUT = 15.13`, `DEMO_IN = 79.87`), `movingDims(seg)` (research R4), `averageSpeed(seg, dim)` (research R3) and `pairShape(seg)` → `{ passed, failed, dimension }` for FR-010 a to d, importing `segments`, `segmentId`, `parseSegmentId` from `mentor/lib/analyze.mjs` (no copy, FR-024)
- [x] T009 In `mentor/lib/speed-graph.mjs`: `analyze(snapshot, { focus_layers, exclude = [], kept_linear, skill_options = {} })` returning data-model › Analyzer result, with FR-004's focus rule, FR-005's `left_out`, FR-006's `land_hard`, FR-007's demo target and each pair's `fastest`. T006 passes
- [x] T010 In `mentor/lib/speed-graph.mjs`: `check(baseline, current, lesson, { seen_shaped = [] })` returning data-model › Check result: pair results with research R7's mistake order, FR-013's facing-side ownership, FR-014's key changes, the demo credit, `other_changes` from `unexpectedChanges(baseline, current, new Set(targets))` imported from `mentor/lib/diff.mjs`, `comp_matches`, and `seen_shaped` updated. T004 passes
- [x] T011 In `mentor/lib/speed-graph.mjs`: `finder(snapshot, { exclude })` → `{ count, layers }` from `analyze()` with the same `exclude` (contract › 2). T006's FINDERS test passes

**Checkpoint**: `npm test` green; nothing outside the add-only table touched.

---

## Phase 3: User Story 1 — Shape my eases on my own comp (P1) 🎯 MVP

**Goal**: a lesson on Mentor Practice runs stages 0 to 7 (TD § 5) with one demo at most, and the
check agrees with the Graph Editor pair by pair.

**Independent test**: in fixture mode on `practice-now.json`, the tools give the US1 focus, refuse a
second demo and an off-target demo before any AE call, and grade each planted shape as the answer
key says.

### Tests first

- [x] T012 [P] [US1] Write `mentor/test/speed-graph-demo.test.mjs`: `assemble("speed-graph-demo", args)` from `mentor/bridge-client.mjs` builds the snippet with the shared ES3 libraries; the snippet has no ES5+ syntax (no `let`, `const`, arrow functions, template strings); the twin `mentor/fixture/speed-graph-demo.mjs` `run` returns data-model › Demo result and saves the edit; `apply` sets only key `i`'s out side and key `i+1`'s in side to 15.13 and 79.87 on every dimension, keeps speeds and both other sides (including a shared middle key's far side) and key types (FR-007, FR-024)
- [x] T013 [P] [US1] Write `mentor/test/speed-graph-tools.test.mjs` in fixture mode (`AE_MENTOR_FIXTURE_STATE`, temp `AE_MENTOR_HOME`, helpers from `mentor/test/helpers.mjs`), per contracts/tools.md: `speed_graph_snapshot` returns `host`, `lesson: "new"` then `"continued"`, and the US1 focus; `skill_options` given once is still applied on a later call without it (continued and resumed after another comp); `speed_graph_demo` on a non-target throws `NOT_DEMO_TARGET` and on a second call `DEMO_USED`, both with no snippet run (assert the twin's edit list is unchanged); a one-pair focus has no demo target; `speed_graph_check` grades each planted stand-in as the answer key says, calls `markChecked` only when the comp matches (another comp: `comp_matches: false`, lesson unchanged), never changes the baseline, and returns `seen_shaped`; the tool names all start with `speed_graph_` and `SKILLS` is `["easing.speed_graph"]`

### Implementation

- [x] T014 [US1] Create `mentor/jsx/speed-graph-demo.jsx` (ES3) per research R6 and contracts/tools.md: args `{ comp_id, layer_index, property_path, key_index }`, same comp and key checks as `mentor/jsx/set-ease.jsx`, write 15.13 out and 79.87 in on every dimension keeping speeds, restore each key's other-side type, verify, return the influences read back. Don't edit `set-ease.jsx` or `mentor/jsx/lib/`
- [x] T015 [US1] Create `mentor/fixture/speed-graph-demo.mjs` (`run`, `apply`) per spec 004 contract › 5, importing `DEMO_OUT`, `DEMO_IN` from `mentor/lib/speed-graph.mjs`. T012 passes
- [x] T016 [US1] Create `mentor/tools/speed-graph.mjs`: `SKILLS`, `FINDERS` (`review: false` for now), and the three tools per contracts/tools.md and spec 004 contract › 3 (`takeSnapshot`, `parseHost`, `session.start` with `skill: "easing.speed_graph"`, `analyze`, `skill_options`; `assertCanDemo` before `runSnippet("speed-graph-demo", …, { undo: true })`, then `recordDemo`; a fresh read for the check, `markChecked(passed, { demoUndone })` only when the comp matches). Replies with `json()` from `mentor/lib/reply.mjs`. T013 passes
- [x] T017 [US1] Write `.claude/skills/speed-graph-mentor/SKILL.md` (draft): frontmatter `name: speed-graph-mentor`, a description that triggers on "/speed-graph-mentor", "shape my ease", "speed graph", and `allowed-tools` from contracts/tools.md. Body: TD § 5's stages 0 to 7 (stage 0 reads the record and passes `eased_layers`; stage 1 proposes and says the leave-outs one sentence each, FR-005; the light intent check and `land_hard`, FR-006; stage 2 reads the graph against `pairs[].fastest`, one hint, never gating, FR-016; never claims to see the Graph Editor and asks which graph is showing when an answer fits a value graph, FR-017; stage 3 explains with a frame; stage 4 one demo only when asked or stuck, frames early and late, plain words, FR-009; stage 5 the check and TD § 7's hint for each `mistake`, never the fix or an offer; "play it back at full speed" once at "done"; stage 6 read again; stage 7 `record_lesson` with the reading answers in plain words, no numbers, method or motive, FR-023). Plain speech: no thresholds, 15/80, IDs or field names (FR-018); frame claims only where the layer is on screen (FR-019). Version: the Graph Editor by its timeline button, never Shift+F3, always ask for Edit Speed Graph; **no Keyframe Velocity menu path or shortcut** until T031 (FR-020); mark each place T031 fills with `<!-- L-1 -->`. Copy the hard rules block from `.claude/skills/ease-mentor/SKILL.md` › Hard rules into the new file (reading it, not editing it)

**Checkpoint**: US1 works in fixture mode on stand-ins.

---

## Phase 4: User Story 2 — Review it in a later session (P1)

**Goal**: review mode ships in the first build (spec 004 plan › Wave C): a new target, no demo, no
walkthrough, no reading step, the same check.

**Independent test**: with a saved record that has Title as a past target, a review on
`practice2-before.json` targets Card, refuses the demo, and records as a review.

- [x] T018 [P] [US2] Write a learner record for the tests in `mentor/test/fixtures/speed-graph/record-learned-title.json` (version 1; `easing.speed_graph` learned 3+ days before the test's fixed date, past targets Title Position and Title Scale on Mentor Practice; no names)
- [x] T019 [US2] Add review tests to `mentor/test/speed-graph-tools.test.mjs` (new on this branch): `mode: "review"` with T018's record on `mentor/test/fixtures/practice2-before.json` gives one or two Card pairs, never Title; `speed_graph_demo` throws `REVIEW_NO_DEMO` with no snippet run; a comp whose only candidates are past targets gives `no_demo_reason: "no_new_target"`; `FINDERS` count with the record's past targets as `exclude` agrees with the review's targets; FR-022's "I already know it" path is the same call (`mode: "review"` on an unlearned skill)
- [x] T020 [US2] Add the review section to `.claude/skills/speed-graph-mentor/SKILL.md` per TD § 11 and FR-021: start with `mode: "review"`; no demo, walkthrough, reading step or handle-direction tip; the light intent check stays; a fail gets the § 7 hints and no reteach, the learner can ask for a practice lesson; `no_new_target` → say there's nothing new to review and record nothing; "I already know it" runs as the review (FR-022)
- [x] T021 [US2] Set `FINDERS["easing.speed_graph"].review = true` in `mentor/tools/speed-graph.mjs` once T019 passes (FR-021)

**Checkpoint**: US1 and US2 pass in fixture mode.

---

## Phase 5: User Story 3 — Sent to easing when I'm not ready (P2)

**Goal**: FR-002: easing named and offered first; no candidate means "nothing eased to shape"; a
half-eased or linear focus pair gets easing's hint.

- [x] T022 [P] [US3] Add tests to `mentor/test/speed-graph-analyze.test.mjs` and `speed-graph-shape.test.mjs` (both new on this branch): `mentor/test/fixtures/practice-before.json` (as built) gives only Subtitle Position as a candidate, one pair, no demo; a comp with no eased pair gives `nothing_to_shape` with `ease_first_count` above 0; a focus pair turned half eased or linear fails c with `no_handle` and the linear side's time
- [x] T023 [US3] Add the prerequisites section to `.claude/skills/speed-graph-mentor/SKILL.md` per TD § 3 and FR-002: easing not learned (from `read_learner_record`) → name it and offer it first; if the learner insists, one sentence and no reteach; `nothing_to_shape` → say there's nothing eased to shape and offer easing; a `no_handle` hint adds a suggestion to take easing after this lesson. Key types never blocks
- [x] T024 [US3] Confirm `speed_graph_snapshot`'s output carries `ease_first_count` and `no_demo_reason` as data-model says (adjust `mentor/tools/speed-graph.mjs` only). T022 passes

---

## Phase 6: Overlap rows and cloud hand-back (cloud)

- [x] T025 Write `mentor/test/speed-graph-overlap.test.mjs`: one named test per row 1 to 19 of spec › Edge cases where concepts overlap, each asserting what the candidate test and the check see on its fixture (stand-in for now) from `answer-key.json`: row 1 Logo Rotation skipped and its key edits in `other_changes`; 2 nothing claimed; 3 expression off → graded; 4 single key not a pair; 5 hold or linear side not a candidate and fails c; 6 half eased; 7 bezier out, hold in → not a candidate and fails c; 8 Bar X Position separate; 9 Scale's third dimension not graded; 10 Old Take left out, allowed if named, never the demo; 11 CTRL allowed if named, never the demo; 12 shared key; 13 Icon's own keys only; 14 Trim Paths End allowed if named, not default; 15 Title's own keys only; 16 pause not a candidate; 17 keys changed; 18 demo credit; 19 Easy Ease again
- [x] T026 Run `cd mentor && npm test` and `node --test .claude/hooks/test/`; run `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`) and confirm the changed files are exactly the add-only table's, all added (SC-009)
- [ ] T027 Run `/agent-audit` on `.claude/skills/speed-graph-mentor/SKILL.md` (skill-builder persona › In this repo) and fix what it finds in that file
- [x] T028 Hand back to the cockpit for the sitting: branch and commit, test counts, T026's output, the `<!-- L-1 -->` places, and what Phase 7 needs (quickstart › 2–5)

**Checkpoint**: everything that doesn't need AE is done. The rest is one sitting.

---

## Phase 7: The live sitting (🖐, one sitting at the builder's Mac, quickstart › 2–5)

**Setup**: the branch checked out on the Mac in a local worktree; After Effects 26.5 on
`discovery/Claude AE Tutor Test.aep`; the cockpit off AE; one skill-builder holding the AE lock
(not at the same time as spec 009's or 010's sitting). The builder does the hand actions in AE.

- [ ] T029 🖐 [US1] Live checks L-1 to L-4 on a **duplicate** of Mentor Practice (quickstart › 2), before `SKILL.md`'s wording is final (spec › Live checks, H3). Log each answer for the hand-back. If L-3's influences don't read back exactly, change `DEMO_OUT`/`DEMO_IN` in `mentor/lib/speed-graph.mjs` and repeat L-3
- [ ] T030 🖐 [US1] Captures with L-5 to L-7 (quickstart › 3): every file in quickstart › 3's table saved to `mentor/test/fixtures/speed-graph/` with `node mentor/dev/capture.mjs`, `practice-now.json` from Mentor Practice itself; L-6's three by-eye comparisons logged (SC-004); then delete the duplicate, confirm Mentor Practice matches `practice-now.json`, check no capture holds a user or folder name, save the `.aep`, release the lock
- [ ] T031 [US1] Desk block (AE open, lock released; not 🖐): point every test at the live captures, delete `mentor/test/fixtures/speed-graph/stand-in/`, update `README.md`'s provenance; tune `REST_SHARE` from L-5 only toward catching a visible bump; drop the one-dimension fixture and its row-9 variant if L-2 shows it can't happen; fill each `<!-- L-1 -->` in `SKILL.md` with the menu path and shortcut exactly as L-1 logged them (or the path only if no shortcut shows), and the shared-key hint from L-4; `npm test` green. Any result that changes a requirement goes in the hand-back for the spec writer before T032
- [ ] T032 🖐 [US1] First live lesson (quickstart › 5): the builder runs `/speed-graph-mentor` in a plain Claude Code session (not a subagent) on Mentor Practice; time from `calls.jsonl` (SC-001: ≤ 15 min, ≤ 1 demo); per pair, does the check match the Graph Editor (SC-002); log for the hand-back

---

## Phase 8: Polish and hand-back

- [ ] T033 Re-run T026's checks on the final branch (live fixtures, no stand-ins): `npm test`, hooks tests, `check-branch.mjs` clean without `--shared-owner`
- [ ] T034 Write the hand-back: branch and commit; test counts; L-1 to L-7 results; SC-001, SC-002, SC-004 numbers from T030 and T032; any constant changed and why; anything a live check changed for the spec; the Requests below. The cockpit turns the live results into `discovery/usage-notes/speed-graph-build.md` (the skill-builder doesn't write `discovery/`)
- [ ] T035 🖐 [US2] Later, a day or more after T032's pass (wave C; not in the sitting): the live review (quickstart › 6, SC-007), logged by the builder; the cockpit adds it to the usage note

---

## Hand-offs to other owners (not builder tasks)

- **HO-1 Eval engineer:** `product/evals/speed-graph/` from spec › Eval plan (14 cases; SC-005 ≥ 80%
  with ≥ 6 cases, every hard-rule check; SC-006 review cases deterministic), the runner's tool list
  (the three `speed_graph_` tools plus the shared four), on `practice-now.json` and
  `practice2-before.json` with the demo twin. After `panel/lib/runtime.js` links every `*-mentor`
  skill (spec 004 plan A2) and after T031 (live fixtures). Case numbers from the cockpit.
- **HO-2 Curriculum designer:** `/overlap-audit` on the built branch before HO-1 runs: each row of
  TD § 9 against T025's tests on live fixtures and L-2, L-4, L-7's results; differences go to the
  spec writer as questions.
- **HO-3 Reviewer:** a read of `SKILL.md` against FR-017 to FR-020 (no threshold or 15/80, no
  Shift+F3, no unconfirmed path or shortcut, frame claims) and FR-023, before HO-1.
- **HO-4 Eval engineer, after merge:** the easing set at 25/25 or within one, no hard-rule failure
  (FR-026, SC-008), logged with the merge.

## Requests (to the cockpit; never a task here)

- **RQ-1 (spec 004 T042):** its `--compare practice-before.json` on Mentor Practice expects
  "Matches", but the 2026-10-20 state (Title eased, 4.37 s keys, unsaved) is what this skill's live
  lesson needs. Decide which state the `.aep` is saved in; this skill uses its own
  `practice-now.json` either way (plan › Requests).
- **RQ-2 (cockpit, persona):** `.claude/agents/skill-builder.md` › In this repo still says skills
  edit `server.mjs` and `session.mjs`; correct it to add-only before the parallel builders start.

## Dependencies & execution order

- Phase 1 → Phase 2 (blocking) → Phases 3, 4, 5 → Phase 6 → Phase 7 → Phase 8.
- Phase 4 needs Phase 3's tool file (T016); Phase 5 needs T009 and T017. Phases 4 and 5 don't
  depend on each other.
- Within Phase 2: T003 to T006 first (any order); then T007 and T008 → T009 → T010 → T011.
- Phase 7 in order: T029 → T030 → T031 → T032. T035 a day or more after T032's pass.
- HO-2 and HO-3 after T031; HO-1 after HO-2 and HO-3; the merge after HO-1's first run; HO-4 after
  the merge.

## Parallel opportunities

- T003, T004, T005, T006 (new test and fixture files); T007 with T008; T012 with T013; T018 with
  T019's writing; T022 with Phase 4.
- Across specs: this whole file through T028 runs alongside specs 009 and 010's cloud phases.
  Phase 7 doesn't: one sitting at a time on AE.

## Implementation strategy

1. **MVP:** Phases 1–3 (US1 in fixture mode on stand-ins).
2. Then Phase 4 (review mode must ship in this first build) and Phase 5.
3. Phase 6 closes the cloud part and hands back.
4. Phase 7 is one sitting; Phase 8 hands back for evals and merge.

**Task count:** 35 (T001–T035): Setup 2, Foundational 9, US1 6, US2 4, US3 3, overlap and cloud
hand-back 4, live sitting 4, polish 3. **🖐 live: 4** (T029, T030, T032 in the sitting; T035 a day
or more later). Hand-offs: 4; requests: 2.
