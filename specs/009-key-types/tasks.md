---
description: "Task list for spec 009: skill 1, pick the key type on purpose"
---

# Tasks: Pick the key type on purpose (curriculum skill 1, key types)

**Status**: Approved 2026-10-21.

**Input**: Design documents from `specs/009-key-types/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/tools.md](contracts/tools.md),
[quickstart.md](quickstart.md); spec 004's
[skill-module.md](../004-ae-curriculum/contracts/skill-module.md) (› 3, › 4, › 6) and
[shared-tools.md](../004-ae-curriculum/contracts/shared-tools.md). The teaching design is
[teaching-design.md](teaching-design.md) ("TD §", read only).

**Starts after**: spec 004's wave A branch (T001–T065) has merged, including T049–T054 (marks,
`keepLinear`) and T062–T063 (`fresh`). Runs in parallel with specs 008 and 010's builders.

**Tests**: included and written first (FR-021, SC-003, SC-006).

## Add-only: the files this branch may touch

The skill-builder **only adds** these files and changes **no existing file** under `mentor/`,
`bridge/` or `.claude/skills/*-mentor/` (`ownership.json` › addOnly; `.claude/README.md` › Run a
parallel job, step 4), and nothing under `product/evals/`, `panel/` or `discovery/`.

| Added file | Tasks |
|---|---|
| `mentor/lib/key-types.mjs` | T008–T011; `HOLD_SIDES` only in T034 |
| `mentor/tools/key-types.mjs` | T017, T021, T022, T025 |
| `mentor/jsx/key-types-demo.jsx` | T015; `HOLD_SIDES` only in T034 |
| `mentor/fixture/key-types-demo.mjs` | T016 |
| `mentor/test/key-types-{analyze,check,tools,demo,overlap}.test.mjs` | T004–T007, T013, T014, T020, T022, T024, T027, T033, T034 |
| `mentor/test/fixtures/key-types/` (README, answer key, records, stand-ins, live captures) | T002, T003, T012, T019, T024, T032, T033 |
| `.claude/skills/key-types-mentor/SKILL.md` | T018, T023, T026, T034 |

Shared changes go in **Requests** and the hand-back, never in a task. The builder may check off
`specs/009-key-types/tasks.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks).
- **[Story]**: US1 (make a cut snap), US2 (constant speed remembered), US3 (review), US4 (evaluated,
  easing holds), from spec.md.
- **🖐 Live**: After Effects 26.5 on the builder's Mac and the AE lock (`decisions/008`). All but
  the last are in **one sitting** (Phase 8). Everything before Phase 8 runs in the cloud.

---

## Phase 1: Setup (cloud)

- [ ] T001 Confirm the base: `cd mentor && npm test` green (note the count); `mentor/lib/marks.mjs` exports `applies`, `marksFor`, `isKeptLinear`; `session.mjs` exports `keepLinear` and `start` accepts `skill_options` and `fresh`; `mentor/test/fixtures/practice2-before.json` exists with key values on Blink, Spinner and Cut. If any is missing, stop and hand back
- [ ] T002 Create `mentor/test/fixtures/key-types/README.md`: every fixture, its source (live capture and sitting step, or stand-in for which live file), and the rule that stand-ins are deleted before merge (research R8)

---

## Phase 2: Foundational (cloud, blocking): the pure analysis

**⚠️ No user story phase starts until this phase is green.**

### Tests first

- [ ] T003 [P] Write stand-ins in `mentor/test/fixtures/key-types/stand-in/`, each with `"synthetic": "stand-in for <live file>"`, derived from `mentor/test/fixtures/practice2-before.json` and `mentor/test/fixtures/practice-before.json` with values added per `discovery/usage-notes/mentor-practice-state-2026-10-20.md`, one per file in quickstart › 3; and `mentor/test/fixtures/key-types/answer-key.json`: per fixture, the expected candidates, refused refs, targets, demo target, per pair verdict, should-move and extra holds, constant-speed verdicts
- [ ] T004 [P] Write `mentor/test/key-types-analyze.test.mjs` (FR-003 to FR-009, FR-015, data-model › Candidate, Focus, Analyzer result): on Mentor Practice 2 Blink and Cut are candidates, Spinner isn't; on `practice-now.json` Title and Subtitle Opacity are, the Cursor is `already_held` and in `held_examples`, Logo's Rotation is `expression` (FR-008); values 0.4 and 99.6 qualify, 0.6 or 80 don't (H-2); a mixed pair counts as not held; effect, fill and text-animator Opacity aren't candidates; hidden layers and nulls aren't candidates but are allowed when named; at most 3 named, earliest first; with no focus `targets` is `[]` and `no_demo_reason: "awaiting_focus"`; a named property gives all its non-held, non-pause pairs, separated Position each dimension; refusals `expression`, `single_key`, `all_held`, `only_pauses`, `not_found`; a `should_move` candidate drops out of `candidates`; a property with an applying kept-linear mark (`opts.kept_linear`) isn't a candidate and is in `left_out` as `kept_linear` (FR-015); demo target is the earliest target on an enabled non-null layer, none on a hidden layer or null; `exclude` drops matching refs; `FINDERS["keyframes.types"].focus` count equals the candidate properties not in `exclude`, on every fixture
- [ ] T005 [P] Write `mentor/test/key-types-check.test.mjs` (FR-011 to FR-013, FR-016, research R5): per pair `held_by_learner`, `held_by_demo`, `not_held` with `state` and a `frame_time` inside the pair, `wrong_side`, `removed_or_changed`; a `wrong_side` or mixed pair never passes; should-move pairs held since the baseline fail item 2 with `waits_until`; extra holds outside focus and should-move are listed, held pauses aren't, the first key's in side and last key's out side are ignored; a check on another comp gives `comp_matches: false`; the demo pair stays the demo's until a check sees it not held, then the learner's (row 20)
- [ ] T006 [P] Write constant-speed tests in `mentor/test/key-types-check.test.mjs` (FR-014, research R6): Spinner Rotation → `linear`; one pair eased → `not_linear` with the pair and side; held → `held`; Logo's Rotation → `expression`; a single key → `single_key`; an unknown name → `not_found`; a layer with one keyed property resolves to it; separated Position needs every dimension linear; `items.constant_speed` is `null` when nothing is named or the verdict is `expression`
- [ ] T007 [P] Write `mentor/test/key-types-demo.test.mjs`: `assemble("key-types-demo", args)` builds with the shared ES3 libraries; no ES5+ syntax; the twin's `apply` sets the key's out type to `hold` (and in type too only when `HOLD_SIDES` is `"both"`), keeps values, eases and every other key; `run` returns data-model › Demo result and saves the edit

### Implementation

- [ ] T008 Create `mentor/lib/key-types.mjs` with constants (`OPACITY_PATH = "ADBE Transform Group/ADBE Opacity"`, `VALUE_TOL = 0.5`, `MAX_NAMED = 3`, `HOLD_SIDES = "out"`), ref resolution (display name or path, separated Position expanded), and `candidates(snapshot, { kept_linear, exclude, should_move })`, using `segments`, `segmentState`, `segmentId` from `mentor/lib/analyze.mjs` and `applies` from `mentor/lib/marks.mjs` (no copies)
- [ ] T009 In `mentor/lib/key-types.mjs`: `analyze(snapshot, { focus_layers, exclude, kept_linear, skill_options })` → data-model › Analyzer result (focus from `skill_options.focus`, refusals, `held_examples`, `left_out`, demo target). T004 passes
- [ ] T010 In `mentor/lib/key-types.mjs`: `check(baseline, current, lesson, { should_move })` → data-model › Check result minus the constant-speed part, with `unexpectedChanges` from `mentor/lib/diff.mjs` for `other_changes`. T005 passes
- [ ] T011 In `mentor/lib/key-types.mjs`: `constantSpeed(snapshot, ref)` → data-model › Constant-speed verdict; and `finder(snapshot, { exclude })`. T006 passes

**Checkpoint**: `npm test` green; nothing outside the add-only table touched.

---

## Phase 3: User Story 1 — Make a cut snap on my own comp (P1) 🎯 MVP

**Goal**: the intent question first, a focus by layer and property, one hold demo at most, a check
per pair that names what still fades.

**Independent test**: in fixture mode on Mentor Practice 2, the tools take Blink as the named focus,
demo one pair only, and grade each planted shape as the answer key says.

### Tests first

- [ ] T012 [P] [US1] Write a record for the tests, `mentor/test/fixtures/key-types/records/easing-learned.json` (version 1, easing learned, nothing for this skill, no names)
- [ ] T013 [US1] Write `mentor/test/key-types-tools.test.mjs` in fixture mode (temp `AE_MENTOR_HOME`, `mentor/test/helpers.mjs`): `key_types_snapshot` with no focus returns candidates and no targets; with `skill_options.focus` Blink › Opacity it returns Blink's pairs and a demo target; a later call without `skill_options` keeps the focus (continued and resumed); `key_types_demo` off target throws `NOT_DEMO_TARGET` and twice `DEMO_USED`, with no snippet run; `key_types_check` grades as the answer key says, calls `markChecked` only when the comp matches and never changes the baseline; tool names start with `key_types_` and `SKILLS` is `["keyframes.types"]`
- [ ] T014 [US1] Add the practice blink to `mentor/test/key-types-tools.test.mjs` (row 17, FR-007): on `practice-blink-before.json` (stand-in) nothing is a target; after the blink, `fresh: true` with the blink as focus makes its pairs the targets with the new read as baseline; `fresh: true` after a demo or a check returns `LESSON_UNDERWAY` and changes nothing

### Implementation

- [ ] T015 [US1] Create `mentor/jsx/key-types-demo.jsx` (ES3) per research R4 and contracts/tools.md: args `{ comp_id, layer_index, property_path, key_index }`, the comp and key checks as in `mentor/jsx/set-ease.jsx`, `HOLD_SIDES` at the top, verify, return the types read back. Don't edit `set-ease.jsx` or `mentor/jsx/lib/`
- [ ] T016 [US1] Create `mentor/fixture/key-types-demo.mjs` (`run`, `apply`, spec 004 contract › 5), importing `HOLD_SIDES` from `mentor/lib/key-types.mjs`. T007 passes
- [ ] T017 [US1] Create `mentor/tools/key-types.mjs`: `SKILLS`, `FINDERS` (`review: false` for now), the three tools per contracts/tools.md and spec 004 contract › 3 (`takeSnapshot`, `parseHost`, `session.start` with `skill`, `analyze`, `focus_layers` from the focus, `mode`, `skill_options`, `fresh`; `assertCanDemo` before `runSnippet("key-types-demo", …, { undo: true })`, then `recordDemo`; the check with `markChecked(passed, { demoUndone })` only when the comp matches). T013, T014 pass
- [ ] T018 [US1] Write `.claude/skills/key-types-mentor/SKILL.md` (draft): frontmatter `name: key-types-mentor`, a description triggering on "/key-types-mentor", "make it snap", "hold keyframes", "key types", and `allowed-tools` from contracts/tools.md. Body: TD § 5's stages 0 to 7: the intent question first naming at most three candidates as questions, never mistakes (FR-003, FR-004, FR-008); "meant to fade" drops it with no argument into `should_move`; what's left out, one sentence per reason; a named non-candidate accepted or refused in one sentence (FR-005); no candidate and nothing named → the practice blink or Mentor Practice 2, then `fresh: true` (FR-007); stage 2's frames from `held_examples`; stage 3 one demo only when asked or stuck, frames one before and one after the jump, the layer "vanishes" at Opacity 0 and is never called hidden (FR-010, row 12); stage 4 the check and TD § 7's hints by verdict, never the fix or an offer, "do the rest" declined (FR-017); stage 5 should-move and extra holds (ask if meant); stage 6's question (US2, T023); stage 7 `record_lesson` per FR-020. Never "freeze" or Freeze Frame. Version: menu paths and right-click only, **no Mac shortcut** and no Keyframe Interpolation path until T034, each place marked `<!-- L-2 -->` (FR-018); the wrong-side hint marked `<!-- L-1 -->`. Copy the hard rules block from `.claude/skills/ease-mentor/SKILL.md` › Hard rules (reading it, not editing it)

**Checkpoint**: US1 in fixture mode on stand-ins.

---

## Phase 4: User Story 2 — Say what runs at constant speed, and have it remembered (P2)

**Goal**: FR-014: a confirmed constant-speed move writes exactly one mark, through `keepLinear` and
`record_lesson`; anything else writes none.

**Independent test**: SC-006 on fixtures: Spinner named → one mark in the record after
`record_lesson`; Logo's Rotation, an eased Spinner, an unknown name or a withdrawn move → 0; an
easing lesson on that comp afterwards leaves Spinner out.

- [ ] T019 [P] [US2] Add `mentor/test/fixtures/key-types/records/kept-linear-spinner.json` (version 1, a mark on Mentor Practice 2's Spinner Rotation with its real key times from `practice2-before.json`)
- [ ] T020 [US2] Add to `mentor/test/key-types-tools.test.mjs`: `key_types_check` with `constant_speed` Spinner › Rotation → `linear`, `marked: true`, and after `record_lesson` the record has exactly one mark for it; `expression`, `not_linear`, `not_found`, and no `constant_speed` → no `keepLinear` call (spy) and 0 marks; then `snapshot_project` (easing) in fixture mode on the same comp lists Spinner Rotation in `skipped` with `kept_linear`; and `key_types_snapshot` with T019's record leaves Spinner out of candidates as `kept_linear` (FR-015)
- [ ] T021 [US2] Wire `constantSpeed` and `session.keepLinear` into `key_types_check` in `mentor/tools/key-types.mjs` (research R6: only on `linear`; a `NOT_KEPT_LINEAR` throw becomes `not_linear`). T020 passes
- [ ] T022 [US2] Confirm `mentor/tools/key-types.mjs` exposes no input that writes a mark other than `constant_speed` through the check (a test in T020 lists every tool's input schema)
- [ ] T023 [US2] Add stage 6 to `.claude/skills/key-types-mentor/SKILL.md` per TD § 5 and FR-014: ask whether a move should run at constant speed; on `not_linear`, one sentence on how (menu path only, `<!-- L-2 -->`) and check again on "done"; on `expression`, say an expression drives it and the mentor can't check the keys, no mark, not a fail; on `held`, ask which they meant; nothing named or "never mind" → item 3 doesn't apply

---

## Phase 5: User Story 3 — Review it in a later session (P1)

**Goal**: review mode in the first build: intent first, a new target, no demo, walkthrough or menu
path; "nothing should snap" records nothing.

**Independent test**: with a record that has Blink as a past target, a review on Mentor Practice 2
offers Cut, refuses a demo and records a review.

- [ ] T024 [US3] Add review tests to `mentor/test/key-types-tools.test.mjs` with `mentor/test/fixtures/key-types/records/learned-blink.json` (written here: skill learned, Blink › Opacity a past target): `mode: "review"` gives Cut as a candidate and not Blink; before a focus is named `no_demo_reason` is `awaiting_focus`, not `no_new_target` (research R1); a comp whose only candidates are past targets gives `no_new_target`; `key_types_demo` throws `REVIEW_NO_DEMO` with no snippet run; `constant_speed` volunteered in a review is confirmed and marked but doesn't change `passed` (H-4); `FINDERS` with the past targets as `exclude` agrees with the candidates
- [ ] T025 [US3] Add the review-mode output rule (research R1) to `mentor/tools/key-types.mjs` and set `FINDERS["keyframes.types"].review = true` once T024 passes (FR-009, FR-019)
- [ ] T026 [US3] Add the review section to `.claude/skills/key-types-mentor/SKILL.md` per TD § 11 and FR-019: intent question first; then "make it snap" with no demo, walkthrough or menu path; items 1 and 2 on what they named; no stage 6 question; "nothing should snap" ends it with nothing recorded; a fail gets the hints, no reteach; "I already know it" runs the same way

---

## Phase 6: User Story 4 — Overlap rows (cloud)

- [ ] T027 [US4] Write `mentor/test/key-types-overlap.test.mjs`: one named test per row 1 to 23 of spec › Edge cases where concepts overlap, each asserting what candidates and focus see and what the check sees on its fixture (stand-in for now) from `answer-key.json`. Row 2 asserts nothing claims "no expression"; row 15 asserts only the layer's own keys are read; row 23 asserts `comp_matches: false`

---

## Phase 7: Cloud hand-back

- [ ] T028 Run `cd mentor && npm test` and `node --test .claude/hooks/test/`; run `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`) and confirm the changed files are exactly the add-only table's, all added (FR-001, SC-004)
- [ ] T029 Run `/agent-audit` on `.claude/skills/key-types-mentor/SKILL.md` and fix what it finds in that file
- [ ] T030 Hand back for the sitting: branch and commit, test counts, T028's output, the `<!-- L-1 -->` and `<!-- L-2 -->` places, and what Phase 8 needs (quickstart › 2–5)

---

## Phase 8: The live sitting (🖐, one sitting at the builder's Mac, quickstart › 2–5)

**Setup**: the branch on the Mac in a local worktree; After Effects 26.5 on
`discovery/Claude AE Tutor Test.aep`; the cockpit off AE; one skill-builder holding the AE lock (not
during spec 008's or 010's sitting). The builder does the hand actions.

- [ ] T031 🖐 [US1] Live checks L-4, then L-1 to L-3 (quickstart › 2) on a **duplicate** of Mentor Practice 2, before `SKILL.md`'s wording and the snippet are final (FR-024). Log each answer for the hand-back
- [ ] T032 🖐 [US1] Captures (quickstart › 3): every file in its table saved to `mentor/test/fixtures/key-types/` with `node mentor/dev/capture.mjs`; then delete the duplicates, confirm both practice comps match their captures, check no capture holds a user or folder name, save the `.aep`, release the lock
- [ ] T033 [US4] Desk block, part 1 (not 🖐): point every test at the live captures, delete `mentor/test/fixtures/key-types/stand-in/`, update `README.md`'s provenance; `npm test` green
- [ ] T034 [US1] Desk block, part 2 (not 🖐): set `HOLD_SIDES` from L-2 in `mentor/jsx/key-types-demo.jsx` and `mentor/lib/key-types.mjs` (and their tests); fill each `<!-- L-2 -->` in `SKILL.md` with the menu path and shortcut exactly as logged (or none), and the `<!-- L-1 -->` wrong-side hint from L-1; `npm test` green. If L-1 shows a jump, SR-2 goes in the hand-back; any result that changes a requirement goes to the spec writer before T035
- [ ] T035 🖐 [US1] First live lesson (quickstart › 5): the builder runs `/key-types-mentor` in a plain Claude Code session on Mentor Practice 2, Blink to a verified pass, Spinner named at stage 6; time from `calls.jsonl` (SC-001); per pair, does the check match the timeline (SC-002); log for the hand-back

---

## Phase 9: Polish and hand-back

- [ ] T036 Re-run T028's checks on the final branch (live fixtures, no stand-ins)
- [ ] T037 Write the hand-back: branch and commit; test counts; L-1 to L-4 results; SC-001, SC-002 from T035; `HOLD_SIDES` and why; SR-2 if L-1 showed a jump; anything for the spec; the Requests below. The cockpit writes `discovery/usage-notes/key-types-build.md` from it (SC-008: L-1 to L-4 logged before merge)
- [ ] T038 🖐 [US3] Later, a day or more after T035's pass: the live review on Cut (quickstart › 6, SC-007), logged by the builder; the cockpit adds it to the usage note

---

## Hand-offs to other owners (not builder tasks)

- **HO-1 Eval engineer:** `product/evals/key-types/` from spec › Eval plan (KT-a to KT-n; SC-005
  ≥ 80%, every hard-rule check: 0 demos in reviews, 0 "freeze", 0 Mac shortcuts before L-2, 0 IDs;
  SC-006's mark checks deterministic; SC-007's review checks), the runner's tool list (three
  `key_types_` tools plus the shared four), on the live captures and records from T012, T019 and
  T024, with the demo twin. After spec 004 plan A2 (`runtime.js`) and T033. "Held the wrong side"
  gets a case after L-1. Case numbers from the cockpit.
- **HO-2 Curriculum designer:** `/overlap-audit` on the built branch before HO-1: TD § 9 against
  T027's tests on live fixtures and L-1's result.
- **HO-3 Reviewer:** a read of `SKILL.md` against FR-017, FR-018 and SC-008 (no "freeze", no
  unconfirmed shortcut or step) before HO-1.
- **HO-4 Eval engineer, after merge:** the easing set at 25/25 or within one (SC-004), logged.

## Requests (to the cockpit; never a task here)

- **SR-2 (conditional, spec's own):** if L-1 shows a jump, the shared owner changes `segmentState`
  and re-runs easing's evals (FR-022).
- **SR-3 (wave B, spec's own):** the visibility class for this skill's candidate and demo filter.
- **RQ-1 (cockpit, persona):** `.claude/agents/skill-builder.md` › In this repo still says skills
  edit `server.mjs` and `session.mjs`.

## Dependencies & execution order

- Phase 1 → Phase 2 (blocking) → Phase 3 → Phases 4 and 5 (either order) → Phase 6 → Phase 7 →
  Phase 8 → Phase 9.
- Within Phase 2: T003 to T007 first; then T008 → T009 → T010 → T011.
- Phase 4 needs T017; T021 needs T011. Phase 5 needs T017.
- Phase 8 in order: T031 → T032 → T033 → T034 → T035. T038 a day or more after T035's pass.
- HO-2 and HO-3 after T034; HO-1 after them; merge after HO-1's first run; HO-4 after merge.

## Parallel opportunities

- T003 to T007 (new files); T012 with T013's writing; T019 with Phase 5; T015 with T016's test.
- Across specs: through T030 this runs alongside specs 008 and 010. Phase 8 doesn't.

## Implementation strategy

1. **MVP:** Phases 1–3 (US1 in fixture mode).
2. Phases 4 and 5 (the mark and review mode both ship in this first build).
3. Phases 6–7 close the cloud part; Phase 8 is one sitting; Phase 9 hands back.

**Task count:** 38 (T001–T038): Setup 2, Foundational 9, US1 7, US2 5, US3 3, US4 overlap 1, cloud
hand-back 3, live sitting 5, polish 3. **🖐 live: 4** (T031, T032, T035 in the sitting; T038 a day
or more later). Hand-offs: 4; requests: 3.
