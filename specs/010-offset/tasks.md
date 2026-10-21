---
description: "Task list for spec 010: skill 3, break the lockstep with offset"
---

# Tasks: Break the lockstep with offset (curriculum skill 3)

**Status**: Approved 2026-10-21.

**Input**: Design documents from `specs/010-offset/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/tools.md](contracts/tools.md),
[quickstart.md](quickstart.md); spec 004's
[skill-module.md](../004-ae-curriculum/contracts/skill-module.md),
[shared-tools.md](../004-ae-curriculum/contracts/shared-tools.md) and
[data-model.md](../004-ae-curriculum/data-model.md) › Timing measures. The teaching design is
[teaching-design.md](teaching-design.md) ("TD §", read only).

**Starts after**: spec 004's wave A branch (T001–T065) has merged, including T037–T043 (timing,
Mentor Practice 2), T058–T059 (back-to-back moves) and T064–T065 (the Dots and Chips). Runs in
parallel with specs 008 and 009's builders.

**Tests**: included and written first (FR-022, FR-023, FR-024, SC-005).

## Add-only: the files this branch may touch

The skill-builder **only adds** these files and changes **no existing file** under `mentor/`,
`bridge/` or `.claude/skills/*-mentor/` (`ownership.json` › addOnly; `.claude/README.md` › Run a
parallel job, step 4), and nothing under `product/evals/`, `panel/` or `discovery/`.

| Added file | Tasks |
|---|---|
| `mentor/lib/offset.mjs` | T009, T010, T011, T012 |
| `mentor/lib/offset-keys.mjs` | T008 |
| `mentor/tools/offset.mjs` | T018, T023, T026 |
| `mentor/jsx/offset-demo.jsx` | T016, T035 |
| `mentor/fixture/offset-demo.mjs` | T017 |
| `mentor/test/offset-{floor,groups,check,tools,demo,overlap}.test.mjs` | T004–T007, T014, T015, T021, T025, T028, T034 |
| `mentor/test/fixtures/offset/` (README, answer key, records, synthetic, stand-ins, live captures) | T002, T003, T013, T020, T025, T033, T034 |
| `.claude/skills/offset-mentor/SKILL.md` | T019, T022, T024, T027, T035 |

Shared changes go in **Requests** and the hand-back, never in a task. The builder may check off
`specs/010-offset/tasks.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks).
- **[Story]**: US1 (stagger one layer's properties), US2 (stagger a group of layers), US3 (review),
  from spec.md.
- **🖐 Live**: After Effects 26.5 on the builder's Mac and the AE lock (`decisions/008`). All but
  the last are in **one sitting** (Phase 8). Everything before Phase 8 runs in the cloud.

---

## Phase 1: Setup (cloud)

- [x] T001 (2026-10-21: 274 tests green; `practice2-*.json` not captured yet, so stand-ins per the cockpit, in `mentor/test/fixtures/offset/stand-in/`) Confirm the base: `cd mentor && npm test` green (note the count); `mentor/lib/timing.mjs` exports `timing` and `clusters` and gives Title's Position two or more moves (spec 004 T058); `mentor/test/fixtures/practice2-before.json` and `practice2-60fps.json` exist with Dot 1 to 3 and Chip A to C; `registerErrors` is exported from `mentor/errors.mjs`. If any is missing, stop and hand back
- [x] T002 Create `mentor/test/fixtures/offset/README.md`: every fixture, its source (live capture and sitting step, synthetic for rows 5, 18, 19, or stand-in for which live file), and the rule that stand-ins are deleted before merge (research R8)

---

## Phase 2: Foundational (cloud, blocking): floor, raw keys, groups, check

**⚠️ No user story phase starts until this phase is green.**

### Tests first

- [x] T003 [P] Write fixtures: stand-ins in `mentor/test/fixtures/offset/stand-in/` for each live file in quickstart › 3 (each `"synthetic": "stand-in for <live file>"`, derived from `practice2-before.json` and `mentor/test/fixtures/practice-before.json` with Title Position at 0.5, 1.5, 3, 4.37 s per `discovery/usage-notes/mentor-practice-state-2026-10-20.md`); the permanent synthetics in `mentor/test/fixtures/offset/synthetic/` (`two-held-jumps.json` row 5, `past-end.json` row 18, `half-frame.json` row 19), each marked synthetic; and `mentor/test/fixtures/offset/answer-key.json`: per fixture, the groups of both kinds, the proposal, demo target per order, and per member the check result
- [x] T004 [P] Write `mentor/test/offset-floor.test.mjs` (FR-023, research R1): at 30 fps, 1 frame apart is the same and 2 isn't; at 60 fps, 3 is the same and 4 isn't; for starts and for landings; pairwise (A–B and B–C the same, A–C not, is not one "same" set); `floorFrames(24)` is 2; the floor is the only threshold exported
- [x] T005 [P] Write `mentor/test/offset-groups.test.mjs` (FR-004 to FR-006, FR-009, FR-020, research R2 to R4): on Mentor Practice, the properties group is Title's Position (move 1), Scale and Opacity, the proposal is properties, the other kind is layers (Bar and Glow at 0 s); CTRL, Old Take, Logo's Rotation, Icon are in `left_out` with their reasons; on Mentor Practice 2 the largest layers group is Dot 1 to 3 (Dot 1's start is the 0.5 s jump), the Chips form another, Badge is a properties group; a tie goes to properties; within a kind, earlier start then layer order; more than 5 layers → first 5; demo target `null` with `awaiting_order` before an order, the second member after, the next one if the second has an expression on a keyed property, `two_members` for 2, `gap_under_floor` under the floor; `exclude` drops matching units before grouping, an already staggered group isn't a group, nothing left gives no group; target IDs and `target_refs` per research R3; `FINDERS["timing.offset"].focus` count above 0 exactly when a group exists with the same `exclude`, on every fixture
- [x] T006 [P] Write `mentor/test/offset-check.test.mjs` (FR-008, FR-011 to FR-015, research R6, R7): properties kind passes when no two members both start and land the same (whole shift, start only, landing only each break it) and fails with `still_same` naming the pair; layers kind fails on a shared start and on an unexplained split in a moved layer, and passes the split when `split` names the layer (stored or check input); per-property shifts within half a frame; separated X moved and Y not is a split within Position; a member whose remembered move is gone is `keys_changed`; demo credit `demo`, `undone`, `learner`; `order_differs` set, never a fail; keys before 0 s or after the comp's end are in `out_of_comp` and such a landing doesn't count; rhythm `uneven` after a pass with 3+ layers when largest minus smallest gap ≥ the floor; layers matched by unique name, by index when names repeat (row 17); another comp → `comp_matches: false`
- [x] T007 [P] Write raw-key tests in `mentor/test/offset-check.test.mjs` (FR-013, research R7): outside the group, a moved single key, an expression turned on or off, a key added or removed, a newly animated or no longer animated property, and a pause given a new value each appear in `other_changes`, including on properties `timing()` excludes

### Implementation

- [x] T008 Create `mentor/lib/offset-keys.mjs` (pure): layer matching (research R6), `otherChanges(baseline, current, groupRefs)`, `shifts(baselineProp, currentProp, fps)` per property and per dimension, `outOfComp(snapshot, refs)`. Reads raw keys only; doesn't use `timing()`'s `excluded` or easing's `unexpectedChanges`. T007 passes
- [x] T009 Create `mentor/lib/offset.mjs` with `floorFrames`, `isSame` (research R1). T004 passes
- [x] T010 In `mentor/lib/offset.mjs`: `groups(snapshot, { exclude })` and the proposal, from `timing()` and `clusters()` imported from `mentor/lib/timing.mjs` (no re-derived starts, landings, moves or exclusions, FR-002)
- [x] T011 In `mentor/lib/offset.mjs`: `analyze(snapshot, { focus_layers, exclude, kept_linear, skill_options })` → data-model › Analyzer result, and `finder(snapshot, { exclude })`. T005 passes
- [x] T012 In `mentor/lib/offset.mjs`: `check(baseline, current, lesson, { split })` → data-model › Check result, using `offset-keys.mjs`. T006 passes

**Checkpoint**: `npm test` green; nothing outside the add-only table touched.

---

## Phase 3: User Story 1 — Stagger one layer's properties (P1) 🎯 MVP

**Goal**: a properties-kind lesson on Mentor Practice to a verified pass with at most one demo.

**Independent test**: in fixture mode on `practice-now.json`, the tools propose Title's three
properties, demo one property by the learner's gap, and grade each planted shape as the answer key
says.

### Tests first

- [x] T013 [P] [US1] Write `mentor/test/fixtures/offset/records/easing-learned.json` (version 1, easing learned, nothing for this skill, no names)
- [x] T014 [P] [US1] Write `mentor/test/offset-demo.test.mjs` (FR-010, FR-024): `assemble("offset-demo", args)` builds with the shared ES3 libraries; no ES5+ syntax; the twin's `apply` adds `shift_frames / frame_rate` to every key time on the given paths and keeps values, types, eases and every other property; its `run` refuses (`OFFSET_REFUSED`, nothing saved) past the comp's end, under the floor, or with a non-whole or zero gap
- [x] T015 [US1] Write `mentor/test/offset-tools.test.mjs` in fixture mode (temp `AE_MENTOR_HOME`, `mentor/test/helpers.mjs`): `offset_snapshot` proposes the properties group with `demo_target: null` (`awaiting_order`); a second call with `skill_options.order` and `gap_frames` sets the demo target to the second property, and a later call without `skill_options` keeps it; `floor_check.gap_under_floor` for a 1-frame gap at 30 fps; `offset_demo` off target throws `NOT_DEMO_TARGET`, twice `DEMO_USED`, a refusal throws `OFFSET_REFUSED` with the reason, each with no snippet run where the snapshot already shows it; `offset_check` grades as the answer key says, calls `markChecked` only when the comp matches, never changes the baseline; tool names start with `offset_` and `SKILLS` is `["timing.offset"]`

### Implementation

- [x] T016 [US1] Create `mentor/jsx/offset-demo.jsx` (ES3) per research R5 and contracts/tools.md: args `{ comp_id, layer_index, property_paths, shift_frames }`; every refusal before any write (`OFFSET_REFUSED: <reason>`); keys re-created last to first with every attribute copied; verify; return the demo result. Don't edit any existing snippet or `mentor/jsx/lib/`
- [x] T017 [US1] Create `mentor/fixture/offset-demo.mjs` (`run`, `apply`, spec 004 contract › 5). T014 passes
- [x] T018 [US1] Create `mentor/tools/offset.mjs`: `registerErrors({ OFFSET_REFUSED: … })` at import with contracts/tools.md's message; `SKILLS`, `FINDERS` (`review: false` for now); the three tools per contracts/tools.md and spec 004 contract › 3 (`takeSnapshot`, `parseHost`, `session.start` with `skill`, `analyze`, `focus_layers`, `mode`, `skill_options`; `assertCanDemo` and the snapshot-side refusals before `runSnippet("offset-demo", …, { undo: true })`, then `recordDemo`; the check with `markChecked(passed, { demoUndone })` only when the comp matches). T015 passes
- [x] T019 [US1] Write `.claude/skills/offset-mentor/SKILL.md` (draft): frontmatter `name: offset-mentor`, a description triggering on "/offset-mentor", "stagger", "offset", "lockstep", and `allowed-tools` from contracts/tools.md. Body: TD § 5's stages: stage 1 proposes in one sentence, offers the other kind in one sentence, names leave-outs one sentence per reason (FR-006); stage 2 one frame at `frame_together` (FR-016); stage 3 the order and gap, repeated back in plain words with any split, the gap converted to frames only to say it back, never a gap to use even when asked ("that's your call; try one and play it back"), a gap under the floor said to still read as together with no number, and if kept, no demo (FR-007); stage 4 one demo only when asked or stuck, frames before and after at the same time; stage 5 the check and TD § 7's hints by result, never the fix or an offer, "do the rest" declined; "done" by any method; stage 7 `record_lesson` per FR-019 (kind, members in order, measured gaps, kept splits; no names, motive or method). Version: dragging keys and layer bars always; **Quick Offset not mentioned** until T035, marked `<!-- L-1 -->`, and then only when `host` is known and at least 25.4 (FR-017); no nudge shortcuts; Sequence Layers not taught. Missing easing: TD § 3 and FR-018. Copy the hard rules block from `.claude/skills/ease-mentor/SKILL.md` › Hard rules (reading it, not editing it)

**Checkpoint**: US1 in fixture mode on stand-ins.

---

## Phase 4: User Story 2 — Stagger a group of layers (P1)

**Goal**: a layers-kind lesson on Mentor Practice 2: the demo shifts a whole layer's keys, the check
catches "pops in", asks about a changed order, and adds a rhythm sentence.

- [x] T020 [P] [US2] Add Mentor Practice 2 stand-ins' answers for the layers kind to `answer-key.json` (Dots: pass, pops in, order differs, uneven, effect with layer, separated X only, hold group)
- [x] T021 [US2] Add layers-kind tests to `mentor/test/offset-tools.test.mjs`: with `kind: "layers"` and an order, `offset_demo` shifts every keyed property on the second Dot (Blurriness, both separated dimensions, single keys) in the twin; the check gives the "pops in" split, exempts a layer named in `split` on the next check, sets `order_differs`, and `rhythm.uneven` per FR-015
- [x] T022 [US2] Add the layers-kind parts to `.claude/skills/offset-mentor/SKILL.md`: the "pops in" hint with a frame where it shows, unless they asked for a split, and "on purpose" → `split` on the next check (FR-012); a changed order asked about, never failed; stage 6's one rhythm sentence only when `rhythm.uneven`, never a fail (FR-015); trimmed in point → the bar-versus-keys hint (row 16, wording from L-3 in T035); layers reordered in the stack → "the order in the stack isn't when they move" (row 17)
- [x] T023 [US2] Confirm `mentor/tools/offset.mjs` passes the layers kind's `property_paths` (every keyed property on the demo layer) to the snippet; adjust that file only. T021 passes

---

## Phase 5: User Story 3 — Review the skill in a later session (P1)

**Goal**: review mode in the first build: a new group, the order asked, no demo, walkthrough,
method or gap.

- [x] T024 [US3] Add the review section to `.claude/skills/offset-mentor/SKILL.md` per TD § 11 and FR-021: name the group in one sentence, ask "which goes first?", say to stagger them however they like; no demo, walkthrough, method or gap; a fail gets the § 7 hints and no reteach; `no_new_target` → no review and nothing recorded; "I already know it" runs the same way
- [x] T025 [US3] Add review tests to `mentor/test/offset-tools.test.mjs` with `mentor/test/fixtures/offset/records/learned-dots.json` (written here: skill learned, every counted unit of Dot 1 to 3 as past targets on Mentor Practice 2): `mode: "review"` gives the Chips, never a Dot; `offset_demo` throws `REVIEW_NO_DEMO` with no snippet run; with every group's units in the record, `no_new_target`; `FINDERS` with the record's past targets as `exclude` agrees; `record_lesson` after a layers-kind lesson stores every counted unit of each member layer as a target (RQ-1; if the session stores one ref per target, switch to the plan's fallback IDs and say so in the hand-back)
- [x] T026 [US3] Set `FINDERS["timing.offset"].review = true` in `mentor/tools/offset.mjs` once T025 passes (FR-003, FR-020)

---

## Phase 6: Overlap rows (cloud)

- [x] T027 [P] Add to `.claude/skills/offset-mentor/SKILL.md` the overlap wording the rows need: an expression drives it (row 1), never "everything that moves" (row 2), the Cursor's first jump as its start (row 4), "I can't check their timing yet" for precomps (row 12), the null in one sentence (row 14), nothing about parents (row 15), past the end "so it never finishes" (row 18)
- [x] T028 Write `mentor/test/offset-overlap.test.mjs`: one named test per row 1 to 22 of spec › Edge cases where concepts overlap, each asserting what the focus and the check see on its fixture (stand-in or permanent synthetic) from `answer-key.json`; the rows marked **contract** in the spec (row 4) are asserted against `timing.mjs` as built

---

## Phase 7: Cloud hand-back

- [x] T029 Run `cd mentor && npm test` and `node --test .claude/hooks/test/`; run `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`) and confirm the changed files are exactly the add-only table's, all added (FR-001, SC-008)
- [ ] T030 (not run 2026-10-21: `/agent-audit` isn't installed in the cloud container) Run `/agent-audit` on `.claude/skills/offset-mentor/SKILL.md` and fix what it finds in that file
- [x] T031 Hand back for the sitting: branch and commit, test counts, T029's output, the `<!-- L-1 -->` places, RQ-1's outcome from T025, and what Phase 8 needs (quickstart › 2–5)

---

## Phase 8: The live sitting (🖐, one sitting at the builder's Mac, quickstart › 2–5)

**Setup**: the branch on the Mac in a local worktree; After Effects 26.5 on
`discovery/Claude AE Tutor Test.aep`; the cockpit off AE; one skill-builder holding the AE lock (not
during spec 008's or 009's sitting). The builder does the hand actions.

- [ ] T032 🖐 [US2] Live checks L-1 to L-4 on a **duplicate** of Mentor Practice 2 (quickstart › 2); log each answer for the hand-back. If L-2 shows a lost attribute, note it for T035
- [ ] T033 🖐 [US1] Captures (quickstart › 3): every file in its table saved to `mentor/test/fixtures/offset/` with `node mentor/dev/capture.mjs`, `practice-now.json` from Mentor Practice itself; then delete the duplicates, confirm both practice comps match their captures, check no capture holds a user or folder name, save the `.aep`, release the lock
- [ ] T034 Desk block, part 1 (not 🖐): point every test at the live captures (keeping `synthetic/` for rows 5, 18, 19, or replacing row 18 or 19 with its live capture if T033 made one), delete `mentor/test/fixtures/offset/stand-in/`, update `README.md`'s provenance; `npm test` green
- [ ] T035 [US1] Desk block, part 2 (not 🖐): fix `mentor/jsx/offset-demo.jsx` for any attribute L-2 showed lost (and repeat L-2 before T036); fill each `<!-- L-1 -->` in `SKILL.md` (Quick Offset offered at 25.4 or later alongside dragging if L-1 confirmed the gesture, otherwise left out) and row 16's hint from L-3; `npm test` green. Any result that changes a requirement goes to the spec writer before T036
- [ ] T036 🖐 [US1] First live lesson, properties kind on Mentor Practice (quickstart › 5.1), by the builder in a plain Claude Code session: time from `calls.jsonl` (SC-001), per check agreement with a scrub (SC-002)
- [ ] T037 🖐 [US2] First live lesson, layers kind on Mentor Practice 2 (quickstart › 5.2), same measures

---

## Phase 9: Polish and hand-back

- [ ] T038 Re-run T029's checks on the final branch (live fixtures, no stand-ins)
- [ ] T039 Write the hand-back: branch and commit; test counts; L-1 to L-4 results; SC-001 and SC-002 from T036 and T037; any snippet fix; RQ-1's outcome; anything for the spec; the Requests below. The cockpit writes `discovery/usage-notes/offset-build.md` from it
- [ ] T040 🖐 [US3] Later, a day or more after the first pass: the live review on the Chips (quickstart › 6, SC-006), logged by the builder; the cockpit adds it to the usage note

---

## Hand-offs to other owners (not builder tasks)

- **HO-1 Eval engineer:** `product/evals/offset/` from spec › Eval plan (20 cases; SC-003 ≥ 80% on
  ≥ 12 cases, every hard-rule check; SC-004's "no gap named" rubric item on every case and the
  deterministic check on the "what gap?" case), the runner's tool list (three `offset_` tools plus
  the shared four), on the live captures, synthetics and T013, T025 records, with the demo twin.
  After spec 004 plan A2 (`runtime.js`) and T034. Case numbers from the cockpit.
- **HO-2 Curriculum designer:** `/overlap-audit` re-run on the built branch before HO-1: TD § 9
  against T028's tests on live fixtures, the rows marked **contract** re-confirmed against
  `timing.mjs`, and L-1, L-3's results.
- **HO-3 Reviewer:** a read of `SKILL.md` against FR-007 (no gap number, ever) and FR-017 (Quick
  Offset only after L-1 and at 25.4+; no nudge shortcuts) before HO-1.
- **HO-4 Eval engineer, after merge:** the easing set at 25/25 or within one (SC-007), logged.

## Requests (to the cockpit; never a task here)

- **RQ-1 (spec 004 data-model):** `target_refs` may hold more than one ref per target; confirm and
  reword "one per target" to "one or more" (plan › Requests, with a fallback).
- **RQ-2 (cockpit, persona):** `.claude/agents/skill-builder.md` › In this repo still says skills
  edit `server.mjs` and `session.mjs`.
- **To spec 005's plan:** DX-03 uses the same FR-027 floor (spec › Assumptions).

## Dependencies & execution order

- Phase 1 → Phase 2 (blocking) → Phase 3 → Phases 4 and 5 (either order) → Phase 6 → Phase 7 →
  Phase 8 → Phase 9.
- Within Phase 2: T003 to T007 first; then T008 and T009 → T010 → T011 → T012.
- Phase 4 and Phase 5 need T018. T027 after T019.
- Phase 8 in order: T032 → T033 → T034 → T035 → T036 → T037. T040 a day or more after the first pass.
- HO-2 and HO-3 after T035; HO-1 after them; merge after HO-1's first run; HO-4 after merge.

## Parallel opportunities

- T003 to T007 (new files); T008 with T009; T013 and T014 with T015's writing; T020 with Phase 5;
  T027 with T028.
- Across specs: through T031 this runs alongside specs 008 and 009. Phase 8 doesn't.

## Implementation strategy

1. **MVP:** Phases 1–3 (US1, the properties kind, on Mentor Practice in fixture mode).
2. Phases 4 and 5 (layers kind and review mode both ship in this first build).
3. Phases 6–7 close the cloud part; Phase 8 is one sitting; Phase 9 hands back.

**Task count:** 40 (T001–T040): Setup 2, Foundational 10, US1 7, US2 4, US3 3, overlap 2, cloud
hand-back 3, live sitting 6, polish 3. **🖐 live: 5** (T032, T033, T036, T037 in the sitting; T040
a day or more later). Hand-offs: 4; requests: 3.
