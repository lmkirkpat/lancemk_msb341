---
description: "Task list for spec 007: panel UI overhaul"
---

# Tasks: Panel UI overhaul (Home, Lesson, Skills)

**Status**: Awaits the builder's approval with the amended spec. Nothing here starts until then. Written by hand to
`/speckit-tasks`' structure.

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md),
[contracts/](contracts/), [quickstart.md](quickstart.md). Mockup: `product/mockups/ui-overhaul/` (state ids are its).

**Owners**: PB panel-builder (`panel/`) · SB skill-builder (`mentor/`, `*-mentor/SKILL.md`) · EE eval-engineer
(`product/evals/`) · BL the builder, live in AE. **[P]** can run in parallel with other [P] tasks in its phase. **Tests
first** for every PB and SB task. PB and SB work in separate worktrees cut from local `main`; the cockpit merges.

**Defaults assumed:** Open questions 6 to 9 at their recommended answers, and D6 to D11 at their defaults. A different
answer changes T022 (6), T032 (7), T041 (8), T025 (9).

## Phase 0: Before anything changes

- [ ] T001 BL · SC-015, first half: the current panel, quickstart §1. Must happen before T015 merges.

## Phase 1: Step 1 foundations (pure modules, no screen yet)

- [ ] T002 PB · Recorded fixtures for the panel tests: extend `panel/dev/record-fixtures.js` to take tool results from stored eval transcripts, easing first; saved records for none, one lesson, 20 lessons, unreadable, set aside.
- [ ] T003 [P] PB · `lib/copy.js` from `index.html` (plan P10), and SC-011's scan with the one named exception (FR-055). FR-058, FR-063, FR-064.
- [ ] T004 [P] [US1] PB · `lib/memory.js` returns missing, unreadable or ok, with the mentor's shape test and the set-aside file; skill names from `path.json`. FR-011, FR-050, FR-095.
- [ ] T005 [P] [US1] PB · `lib/connection.js`: connected, not connected, busy, polled; `bridgeStarted()` unchanged. FR-002, FR-057, FR-091.
- [ ] T006 [P] [US6] PB · `lib/errors.js` replaces `errors-a.js`: kind → treatment and copy, including B1's `not_signed_in` → `err-mentor`; tests for every kind from recorded streams. FR-056, FR-097.
- [ ] T007 [P] [US2] PB · `lib/lesson.js`: `stageOf` gives Pick / Try / Done; `saved` only on `saved: true`; `recorded_result`. FR-014, PN-15, SC-012.
- [ ] T008 [US2] PB · `lib/checklist/index.js` and `easing.js`: the view model and easing's codes, including `removed` and `unmatched`, which today fall through. FR-016, FR-086, contracts/checklist-rows.md.
- [ ] T009 [US2] PB · Reducer: opening rows joined from `findings`, labels kept by id, Proposed dropping at the first reply or check, rows replaced on new targets, stale marking. FR-015, FR-017, FR-098, `lesson-open`, `lesson-focus-replying`, `lesson-focus-stale`, `lesson-focused`.
- [ ] T010 [P] PB · `contrast.test.js`: narrow the inline-style ban to font sizes (research R4 #13); clear the stale `todo` so only row labels dim, computed on the list's real background. FR-017, FR-075, SC-008.
- [ ] T011 [P] PB · CSS feature scan: fails on anything newer than Chromium 99. FR-090, SC-017.
- [ ] T012 [P] [US7] PB · `requests.js`: label Done, check it, request text unchanged; the existing sync test stays green. FR-016, RQ-14.
- [ ] T013 PB · `lib/view-state.js`: model → state id, with the id list checked against the README's table. FR-006, SC-003.
- [ ] T014 [P] [US1] PB · `lib/home.js`: step 1's Up next (plan P9), memory. FR-007, FR-008, FR-010.

## Phase 2: Step 1 screens (easing in the new panel)

- [ ] T015 [US1] PB · `index.html`, `panel.css`: real tablist with roving tabindex, connection mark, focus rules, spacing. FR-001 to FR-005, FR-077 to FR-081, FR-096.
- [ ] T016 [US1] PB · Home: `home-first`, `home-loading`, `home-unreadable`, `home-unreadable-why`, `home-unreachable`, `home-busy`; held slot's place. FR-007, FR-008, FR-057, SC-004.
- [ ] T017 [US2] PB · Lesson tab: header, strip, chat, checklist, buttons, Ask, status; `lesson-none`, `lesson-starting`, `lesson-partial`, `lesson-outside`, `lesson-stale`, `lesson-othercomp`, `skill-easing-check`. FR-003, FR-014 to FR-017, FR-020, FR-046, FR-060, FR-061.
- [ ] T018 [US2] PB · Short docks by media query and class; the large arrow; after a check, back on the chat. FR-022, plan P4, SC-016.
- [ ] T019 [P] [US2] PB · Following the lesson: Earlier fold, done fold, Next line, "1 more", changed bar, frame sizes, Flip. FR-085.
- [ ] T020 [P] [US2] PB · Easing's Changed in your comp box, Show me and Show me again from `demo_target`. FR-018, FR-019, `lesson-demo`.
- [ ] T021 [P] [US2] PB · `lesson-passed-asking`, `lesson-passed`, `lesson-passed-unsaved`, and a save with no pass (D6). FR-021, FR-053.
- [ ] T022 [US3] PB · Lesson in progress: `home-lessonopen`, `home-cutoff`, `lesson-continued`, `home-aeclosed`, gray End lesson; `panel-session.json` version 2; nothing recorded; a resumed lesson shown as returned. FR-023 to FR-028, FR-073, FR-092, plan P8.
- [ ] T023 [US3] PB · Errors on screen: `err-mentor`, `err-key`, `err-credit`, `lesson-pass-*`, `lesson-start-failed`, `lesson-exited`, `lesson-error`, `lesson-error-demo`; `announcesCalls` on both adapters; B1's stop and resume before a retry after a timeout. FR-029, FR-030, FR-056, plan P7, SC-007.
- [ ] T024 [P] PB · The Skills tab's one-line interim (plan P9).
- [ ] T025 [P] PB · `CSXS/manifest.xml`: `MinSize` height 480 (Open question 9).
- [ ] T026 PB · SC-003's tests for step 1's states; reduced motion; a keyboard pass by test. FR-073, FR-079, FR-080.
- [ ] T027 [P] [US7] EE · Easing: Continue, and the two Try again cases. RQ-12, RQ-13. Hand the case names to PB.
- [ ] T028 BL · Easing live in the new panel, and SC-015's second half (quickstart §1): SC-001, SC-002's easing part. Depends on T015 to T026.

**Stop point:** a working panel, easing only. Other skills stay in Claude Code.

## Phase 3: Step 2 prerequisites

- [ ] T029 [P] SB · `mentor/curriculum/skills-built.json`, `mentor/scripts/write-skills-built.mjs`, `mentor/test/skills-built.test.mjs`. New files only. PN-16, plan P2. No eval cost.
- [ ] T030 [P] PB · Live check, no AE needed (fixture mode): `/next-mentor` under `--tools ToolSearch,Skill` hands over in stream-json, and the next skill's tools run. Record the result in the hand-back. If it fails, take plan P3's fallback and tell the cockpit before T052.
- [ ] T031 SB · `next-mentor/SKILL.md`: add `Set the pivot (anchor point)` → `/anchor-mentor` and `Move a group with a null` → `/null-parenting-mentor`, names exactly as in `path.json`. Editing an existing file: the cockpit passes `--shared-owner`. PN-17.
- [ ] T032 EE · `product/evals/next-mentor/`: runner with the panel's flags, rubric, 9 cases. RQ-15, RQ-16. Depends on T030, T031.
- [ ] T033 [P] [US7] EE · Key types: 6 cases, contracts/button-requests.md.
- [ ] T034 [P] [US7] EE · Speed graph: 6 cases.
- [ ] T035 [P] [US7] EE · Offset: 6 cases.
- [ ] T036 [P] [US7] EE · Pivot: 7 cases.
- [ ] T037 [P] [US7] EE · Null: 7 cases; check its existing Show me again turn.
- [ ] T038 EE · Run the new cases with `--only`, and report by set. A failure needing a `SKILL.md` change goes to the cockpit first: it triggers that set's full run (FR-072). Depends on T027, T032 to T037.

## Phase 4: Step 2 build (all six skills and the Skills tab)

- [ ] T039 PB · B1 allowlist per skill from `SKILL.md`, the union plus `Skill` for next-mentor, and a test against the files. FR-087, plan P3, SC-017.
- [ ] T040 [P] PB · `activity.js`: a line for every tool, claiming only what it does, with a test. FR-062, SC-017.
- [ ] T041 PB · `requests.js` per skill, including Show me again's text (Open question 8), New lesson and Find my next lesson. contracts/button-requests.md.
- [ ] T042 PB · `lib/skills.js`: path, data file and skill table, with its drift test; tool → skill; remove `path.js`. PN-16, data-model.
- [ ] T043 [P] [US2] PB · `checklist/key-types.js`, `skill-keytypes-open`, `-check`.
- [ ] T044 [P] [US2] PB · `checklist/speed-graph.js`, `skill-speedgraph-open`, `-check`; `fastest` never shown; land-hard section.
- [ ] T045 [P] [US2] PB · `checklist/offset.js`, `skill-offset-layers-open`, `-check`, `skill-offset-props-check`.
- [ ] T046 [P] [US2] PB · `checklist/pivot.js`, `skill-pivot-open`, `-check`, `-keyed`.
- [ ] T047 [P] [US2] PB · `checklist/null.js`, `skill-null-open`, `-place`, `-parent`, `-move`; `graded: false` as stale.
- [ ] T048 [US2] PB · Offset's timeline, scale per plan P5, hidden from screen readers. FR-088. Depends on T045.
- [ ] T049 [US2] PB · Per-skill demo: Show me from `demo_target` (null also `null_ready`), the Changed box from each demo tool's result, header from tool → skill. FR-014, FR-018, FR-019.
- [ ] T050 [US5] PB · Skills tab: `skills-empty`, `skills-few`, `skills-many`; removes the interim. FR-048, FR-053.
- [ ] T051 [US5] PB · `skill-detail`, `skill-detail-noreview`, `skill-detail-new`, New lesson. FR-049.
- [ ] T052 [US1] PB · Home's `home-return` and Find my next lesson; `lesson-picking`, Yes only with a recommendation, a hand-over changing the header. FR-009, FR-013, FR-082, FR-094. Depends on T030.
- [ ] T053 [US7] PB · Widen the sync test from EE's case names. FR-071, SC-006. Depends on T027, T032 to T037.
- [ ] T054 PB · SC-003's tests for step 2's states; each skill's recorded stream through the panel. SC-002's test half, SC-007.
- [ ] T055 PB · Hand-back: what ran, what the scans say, anything for the designer.
- [ ] T056 BL · Key types, live in the panel (quickstart §2). SC-014.
- [ ] T057 BL · Speed graph, live. SC-014.
- [ ] T058 BL · Offset, live; react to the timeline. SC-014.
- [ ] T059 BL · Set the pivot, live. SC-014.
- [ ] T060 BL · Move a group with a null, live. SC-014.
- [ ] T061 BL · Find my next lesson through to a hand-over (quickstart §4).
- [ ] T062 BL · SC-010 at 260 × 480 and SC-016 at 480 and 680 (quickstart §3).

**Stop point:** all six live lessons in the panel, sprint 4's first "done" item.

## Phase 5: Step 3 (practice)

- [ ] T063 [P] [US5] PB · Practice due on Home: one card, first in path order, a count of the rest, never easing, date compare only. FR-051, PN-11.
- [ ] T064 [P] [US5] PB · Warm up on Home and `skill-detail`, and ↻ on Skills. FR-048, FR-049, RQ-11.
- [ ] T065 [US5] PB · `practice`, `practice-check`, tagged from `mode`, no Show me. FR-052.
- [ ] T066 [US5] PB · `practice-passed`, `lesson-passed-pivot`, the due lines, gated on the review flag. FR-021.
- [ ] T067 [US5] PB · `practice-nothing-new` from `no_new_target`; nothing recorded. FR-052.
- [ ] T068 PB · SC-003's tests for these states and the final id list against the README.
- [ ] T069 [US7] PB · Sync test covers Warm up on all five.
- [ ] T070 PB · Full panel test run, scans and hand-back.
- [ ] T071 BL · A warm-up live, and nothing new on a comp (quickstart §5).
- [ ] T072 BL · SC-009, the keyboard walk (quickstart §6).
- [ ] T073 BL · SC-013: three sessions' notes.
- [ ] T074 BL · Close: check the comparison and live notes against every in-scope success criterion in `discovery/usage-notes/ui-overhaul.md`.

## Dependencies

Phase 0 → 1 → 2 (stop) → 3 → 4 (stop) → 5. T029 and T030 can start any time after approval. Live tasks run one at a time (one AE lock), each in a fresh
session after a `mentor/` merge. T056 to T060 need T038 reported, so a failing request is known before a sitting.

## Not tasks

Diagnosis screens, setup screens, `home-return-stored`, a real lesson reset, anything on option A beyond mapping its kinds.
