---
description: "Task list for spec 007: panel UI overhaul"
---

# Tasks: Panel UI overhaul (Home, Lesson, Skills)

**Status**: Approved 2026-11-04 with the spec, and corrected the same day from the review and
`decisions/011` (T075 to T080 added). 80 tasks: PB 52 (T030 and T039 done), EE 10, BL 15, SB 2 (T031 and T029 done), SW 1. Written by hand to `/speckit-tasks`' structure.

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md),
[contracts/](contracts/), [quickstart.md](quickstart.md). Mockup: `product/mockups/ui-overhaul/` (state ids are its).

**Owners**: PB panel-builder (`panel/`) · SB skill-builder (`mentor/`, `*-mentor/SKILL.md`) · EE eval-engineer
(`product/evals/`) · BL the builder, live in AE · SW spec-writer. **[P]** can run in parallel with other [P] tasks in its phase. **Tests
first** for every PB and SB task. PB and SB work in separate worktrees cut from local `main`; the cockpit merges.

**Ticking:** PB and SB tick their own tasks. The eval engineer can't edit this file (ownership hook), so the cockpit ticks EE's tasks from
its hand-back, and BL's and SW's too.

**"013 Tnnn"** means a task in spec 013's list; this spec has its own T060 and others with the same numbers. Which spec owns shared work,
and what happens whichever gets there first: [plan.md](plan.md) › Shared work with spec 013. Panel work and its evals run on B1
(`decisions/011`); nothing before T078 spends API credit.

**Answered 2026-11-04:** Open questions 6 to 9 (T022, T032, T041, T025), and D16 ("Set it aside", T022). **Defaults assumed:** D6 to D15, and D16's resuming line.

## Phase 0: Before anything changes

- [x] T001 BL · SC-015, first half: the current panel, quickstart §1. Must happen before the first `panel/` merge from this build, since the panel is linked to the main checkout.

## Phase 1: Step 1 foundations (pure modules, no screen yet)

- [x] T002 PB · Recorded fixtures for the panel tests: extend `panel/dev/record-fixtures.js` to take tool results from stored eval transcripts, easing first; saved records for none, one lesson, 20 lessons, unreadable, set aside.
- [x] T003 [P] PB · `lib/copy.js` from `index.html` (plan P10), with "Set it aside" for the mockup's "Start fresh" (D16), and SC-011's scan with the one named exception (FR-055). FR-058, FR-063, FR-064.
- [x] T004 [P] [US1] PB · `lib/memory.js` returns missing, unreadable or ok, with the mentor's shape test and the set-aside file; skill names from `path.json`. FR-011, FR-050, FR-095.
- [x] T005 [P] [US1] PB · `lib/connection.js`: connected, not connected, busy, polled, plus the start time when the bridge answers; `bridgeStarted()` unchanged. FR-002, FR-028, FR-057, FR-091.
- [x] T006 [P] [US6] PB · `lib/errors.js` replaces `errors-a.js`: kind → treatment and copy, including B1's `not_signed_in` → `err-mentor`, and the logged-only kinds (`bad_stream`, `busy`, `bad_command`, `not_implemented`) listed ahead of the fallback to `start_failed`; tests for every kind from recorded streams, including one bad stream line leaving the lesson running. FR-056, FR-097.
- [x] T007 [P] [US2] PB · `lib/lesson.js`: `stageOf` gives Pick / Try / Done by FR-014's rule, with tests for an opening with targets (Pick), a `resumed` first snapshot (Try) and a hand-over's opening (Pick); `saved` only on `saved: true`. FR-014, PN-15, SC-012.
- [x] T008 [US2] PB · `lib/checklist/index.js` and `easing.js`: the view model and easing's codes, including `removed` and `unmatched`, which today fall through, `demo_credit` `unknown` as a "?" row, and a `label` equal to its id as an unnamed pair. FR-016, FR-086, FR-100, D13, D15, contracts/checklist-rows.md.
- [x] T009 [US2] PB · Reducer: opening rows joined from `findings`, labels kept by id, Proposed dropping at the first reply or check and absent on a `continued` or `resumed` lesson, which also gets D16's resuming line, unlabelled targets as a count line, rows replaced on new targets, stale marking. FR-015, FR-017, FR-092, FR-098, FR-100, `lesson-open`, `lesson-focus-replying`, `lesson-focus-stale`, `lesson-focused`.
- [x] T010 [P] PB · `contrast.test.js`: narrow the inline-style ban to font sizes (research R4 #13), and scan `panel/lib/` with its subfolders, since it reads only the top level today and `lib/checklist/` would escape the font-size check. The stale `todo` stays until T017 writes the CSS it checks. FR-075, FR-076, SC-008.
- [x] T011 [P] PB · CSS and script feature scan over `panel.css`, `index.html`, `main.js` and `panel/lib/**` (not `panel/helper/`): fails on plan P4's named list. FR-090, SC-017.
- [x] T012 [P] [US7] PB · `requests.js`: label Done, check it, request text unchanged; the existing sync test stays green. FR-016, RQ-14.
- [x] T013 PB · `lib/view-state.js`: model → state id, with the id list checked against the README's table, plus step 1's `home-return-interim` as the one named addition. FR-006, SC-003.
- [x] T014 [P] [US1] PB · `lib/home.js`: step 1's Up next (plan P9), memory, and Start lesson sending the skill's start request. FR-007, FR-008, FR-010, FR-012.
- [x] T075 PB · Tests first. `panel/test/boundaries.test.js`: a static list of what the panel writes (`panel-session.json`, `panel-frames/`, `panel-turns.jsonl`, never `learner.json`, `path.json` or `session.json`) and calls on the bridge (`bridge.json`, `GET /health`), failing on anything new, with `panel/helper/` out of its scope. A scan of log output: a recorded stream with a planted fake name and email leaves none in the turn log or console output, so `bad_stream` logs its kind and length, not the line. FR-065's part: the same stream with the mentor's words swapped for nonsense gives the same stage, rows and state id. FR-065 to FR-068.

## Phase 2: Step 1 screens (easing in the new panel)

- [x] T015 [US1] PB · `index.html`, `panel.css`: real tablist with roving tabindex, connection mark, focus rules, spacing. FR-001 to FR-005, FR-077 to FR-081, FR-096.
- [x] T016 [US1] PB · Home: `home-first`, `home-return-interim`, `home-loading`, `home-unreadable`, `home-unreadable-why`, `home-unreachable`, `home-busy`; held slot's place. FR-007, FR-008, FR-057, SC-004.
- [x] T017 [US2] PB · Lesson tab: header, strip, chat, checklist, buttons, Ask, status; `lesson-none`, `lesson-starting`, `lesson-partial`, `lesson-outside`, `lesson-stale`, `lesson-othercomp`, `skill-easing-check`. Writes the stale CSS (only row labels dim) and clears `contrast.test.js`'s `todo`, computed on the list's real background. FR-003, FR-014 to FR-017, FR-020, FR-046, FR-060, FR-061, FR-075, SC-008.
- [x] T018 [US2] PB · Short docks by media query and class; the large arrow; after a check, back on the chat. FR-022, plan P4, SC-016.
- [x] T019 [US2] PB · Following the lesson: Earlier fold, done fold, Next line, "1 more", changed bar, frame sizes, Flip. FR-085.
- [x] T020 [US2] PB · Easing's Changed in your comp box, Show me and Show me again from `demo_target`. FR-018, FR-019, `lesson-demo`.
- [x] T021 [US2] PB · `lesson-passed-asking`, `lesson-passed`, `lesson-passed-unsaved`, and a save with no pass (D6). FR-021, FR-053.
- [x] T022 [US3] PB · Lesson in progress: `home-lessonopen`, `home-cutoff`, `lesson-continued`, `home-aeclosed`, gray End lesson; `panel-session.json` version 2, keeping `skill` (plan P8); nothing recorded; a resumed lesson shown as returned; `home-aeclosed` only on a different start time, with a busy or absent bridge keeping the session and re-checking on the poll. FR-023 to FR-028, FR-073, FR-092, plan P8.
- [x] T023 [US3] PB · Errors on screen: `err-mentor`, `err-key`, `err-credit`, `lesson-pass-*`, `lesson-start-failed`, `lesson-exited`, `lesson-error`, `lesson-error-demo`; `announcesCalls` on both adapters; B1's stop and resume before a retry after a timeout, passing the saved skill and ignoring late events from the stopped adapter; `demo_unknown` hiding Show me and Show me again until a snapshot or check settles it; the no-result line (D12). FR-019, FR-029, FR-030, FR-056, plan P7, SC-007.
- [x] T024 [P] PB · The Skills tab's one-line interim (plan P9).
- [x] T025 [P] PB · `CSXS/manifest.xml`: `MinSize` height 480 (Open question 9).
- [x] T026 PB · SC-003's tests for step 1's states, `home-return-interim` included; reduced motion; a keyboard pass by test. FR-073, FR-079, FR-080.
- [x] T027 [P] [US7] EE · Easing: Continue, and the two Try again cases. RQ-12, RQ-13. Hand the case names to PB.
- [x] T028 BL · Easing live in the new panel, and SC-015's second half (quickstart §1): SC-001, SC-002's easing part. Depends on T015 to T026.

**Stop point:** a working panel, easing only. Other skills stay in Claude Code.

## Phase 3: Step 2 prerequisites

- [x] T029 [P] SB · `mentor/curriculum/skills-built.json`, `mentor/scripts/write-skills-built.mjs`, `mentor/test/skills-built.test.mjs`. New files only. PN-16, plan P2. No eval cost.
- [x] T030 [P] PB · Settled by 013 T065's check (013's research R6): B1 can't hand over. T052 follows it. `--tools ToolSearch,Skill` stays untested and unplanned (research R11).
- [x] T031 SB · `next-mentor/SKILL.md`: `Set the pivot (anchor point)` → `/anchor-mentor` and `Move a group with a null` → `/null-parenting-mentor`. Done on `main` by `6094ee9`. PN-17.
- [x] T032 EE · `product/evals/next-mentor/`: runner with `--runtime a|b1` from the start, tool lists from `allowedToolsOf` (013 T064's reader, never hand-kept; no `Skill` on B1), rubric. Covers `discovery/usage-notes/next-mentor-handover.md`'s items 1, 2 and 5. **B1, 9 cases:** 5 openings; 4 Yes-path cases that check the `recommend_next` result, then run the panel's plain follow-on request in a fresh session with that skill's list: the pivot with named layers (1), null with named layers, where the lesson asks (1), null's crowded comp with an empty list, where no layer may be invented (2), and a due review (5). **A only, 4 more cases, written now, run at T078:** real hand-overs from `Yes, let's go.` to the pivot with named layers (1), null's crowded comp (2), offset as a due review (5), and key types after "I already know it" on an unlearned skill (5). A failure on these known items is reported, with no `SKILL.md` change planned. RQ-15, RQ-16, FR-082.
- [x] T033 [P] [US7] EE · Key types: 6 cases, contracts/button-requests.md.
- [x] T034 [P] [US7] EE · Speed graph: 6 cases.
- [x] T035 [P] [US7] EE · Offset: 6 cases.
- [x] T036 [P] [US7] EE · Pivot: 7 cases.
- [x] T037 [P] [US7] EE · Null: 7 cases; check its existing Show me again turn.
- [ ] T038 EE · Run the new cases on B1 with `--only`, leaving out next-mentor's A-only cases, and report by set. A failure needing a `SKILL.md` change goes to the cockpit first: it triggers that set's full run (FR-072). Depends on T027, T032 to T037.

## Phase 4: Step 2 build (all six skills and the Skills tab)

- [x] T039 PB · Done by 013 T065 (`9fc10bb`, merged `4d6d627`): each skill launches with its own tools, `Skill` is left out, the session saves the skill, `--resume` honours the list (013's research R6), and `panel/test/adapter.test.js` holds every skill's list to its `SKILL.md`. FR-087, SC-017's allowlist half.
- [x] T040 [P] PB · `activity.js`: a line for every tool, claiming only what it does, with a test. FR-062, SC-017.
- [x] T041 PB · `requests.js` per skill, including Show me again's text (Open question 8), New lesson and Find my next lesson; `startLesson` takes the request and passes `skillOf(request)`, since `main.js` hard-codes `REQUESTS.start` today, and no non-easing lesson can start without this; `turns.js` `KINDS` gains the new kinds, so the turn log doesn't count them as Ask. contracts/button-requests.md.
- [x] T042 PB · `lib/skills.js`: path, data file and skill table, with its drift test; tool → skill; remove `path.js`. PN-16, data-model.
- [x] T043 [P] [US2] PB · `checklist/key-types.js`, `skill-keytypes-open`, `-check`.
- [x] T044 [P] [US2] PB · `checklist/speed-graph.js`, `skill-speedgraph-open`, `-check`; `fastest` never shown; land-hard section; `credit` `unknown` as a "?" row (D13).
- [x] T045 [P] [US2] PB · `checklist/offset.js`, `skill-offset-layers-open`, `-check`, `skill-offset-props-check`.
- [x] T046 [P] [US2] PB · `checklist/pivot.js`, `skill-pivot-open`, `-check`, `-keyed`.
- [x] T047 [P] [US2] PB · `checklist/null.js`, `skill-null-open`, `-place`, `-parent`, `-move`; `graded: false` as stale.
- [x] T048 [US2] PB · Offset's timeline, scale per plan P5, hidden from screen readers. FR-088. Depends on T045.
- [x] T049 [US2] PB · Per-skill demo: Show me from `demo_target` (null also `null_ready`), the Changed box from each demo tool's result, header from tool → skill. FR-014, FR-018, FR-019.
- [x] T050 [US5] PB · Skills tab: `skills-empty`, `skills-few`, `skills-many`; removes the interim. FR-048, FR-053.
- [x] T051 [US5] PB · `skill-detail`, `skill-detail-noreview`, `skill-detail-new`, New lesson. FR-049.
- [x] T052 [US1] PB · Home's `home-return` and Find my next lesson; `lesson-picking`, Yes per FR-082: `handsOver` on both adapters; on B1, stop next-mentor's process and start the recommended lesson from `recommendation`, ignoring late events from the stopped adapter, with the skill from the follow-on request; next-mentor's picking process writes no display log, so it can't show as `home-cutoff`; on A, send `Yes, let's go.`; hidden with `requested`, no recommendation or a skill not in the table; a test that the request is the same with `focus_layers` empty, null or very long. A review reached before step 3 has no practice tag yet. Removes `home-return-interim`. FR-009, FR-013, FR-082, FR-094, plan P3. Depends on T041.
- [x] T053 [US7] PB · Widen the sync test from EE's case names, covering RQ-16's `Yes, let's go.` and the follow-on requests. FR-071, SC-006. Depends on T027, T032 to T037.
- [x] T054 PB · SC-003's tests for step 2's states; each skill's recorded stream through the panel. SC-002's test half, SC-007.
- [x] T055 PB · Hand-back: what ran, what the scans say, anything for the designer.
- [x] T056 BL · Key types, live in the panel (quickstart §2). SC-002, SC-014.
- [x] T057 BL · Speed graph, live. SC-002, SC-014.
- [x] T058 BL · Offset, live; react to the timeline. SC-002, SC-014.
- [x] T059 BL · Set the pivot, live. SC-002, SC-014.
- [x] T060 BL · Move a group with a null, live. SC-002, SC-014; closes the live tally in quickstart §2.
- [ ] T061 BL · Find my next lesson through Yes into the recommended lesson, on B1 (quickstart §4). *Also `home-first` (SC-010), from T062: the temp learner home starts empty, so check Home before adding the four-skill record.* First confirm the temp learner home reaches both Home and the mentor; that setup is untested.
- [x] T062 BL · SC-010 at 260 × 480, 11 of its 12 states (`practice-check` waits for T071), and SC-016 at 480 and 680 (quickstart §3). *Done 2026-11-09 at the default dock (SC-010 amended); `home-first` moved to T061.*
- [ ] T076 SW · `specs/003-mentor-panel/contracts/mentor-adapter.md`. The launch arguments and `start`'s `skill` were updated 2026-11-04, after 013 T065. Left: when T023 and T052 merge, add `announcesCalls` and `handsOver`. The cockpit asks when each lands.

**Stop point:** all six live lessons in the panel, sprint 4's first "done" item.

## Phase 5: Step 3 (practice)

- [x] T063 [P] [US5] PB · Practice due on Home: one card, first in path order, a count of the rest, never easing, date compare only. FR-051, PN-11.
- [x] T064 [P] [US5] PB · Warm up on Home and `skill-detail`, and ↻ on Skills. FR-048, FR-049, RQ-11.
- [x] T065 [US5] PB · `practice`, `practice-check`, tagged from `mode`, no Show me. FR-052.
- [x] T066 [US5] PB · `practice-passed`, `lesson-passed-pivot`, the due lines, gated on the review flag. FR-021.
- [x] T067 [US5] PB · `practice-nothing-new` from `no_new_target`; nothing recorded. FR-052.
- [x] T068 PB · SC-003's tests for these states and the final id list against the README.
- [x] T069 [US7] PB · Sync test covers Warm up on all five.
- [x] T070 PB · Full panel test run, scans and hand-back.
- [ ] T071 BL · A warm-up live, and nothing new on a comp (quickstart §5); `practice-check` at 260 × 480, the last of SC-010's states.
- [ ] T072 BL · SC-009, the keyboard walk (quickstart §6).
- [ ] T073 BL · SC-013: three sessions' notes.
- [ ] T074 BL · Close: check the comparison and live notes against every in-scope success criterion in `discovery/usage-notes/ui-overhaul.md`. SC-018's paid half is checked at T078 and T079, before a tester.

**Stop point:** the build is done on B1.

## Phase 6: Moving to A, before the first tester (FR-099, `decisions/011`)

**T077 is free and part of this build. T078 and T079 spend API credit, and T080 is a decision: they're for the builder, before a tester sees the panel, and they don't hold the stop points above open. Nothing here has started.**

- [ ] T077 EE · Free. After T038: `product/evals/lib/ready-for-a.mjs` (013 T067) on all seven skills, then `--runtime a --dry-run` on each set with new cases and on the next-mentor set. Report any mismatch to its owner. SC-018's free half. Depends on 013 T067, T038.
- [ ] T078 EE · **Paid, on the builder's go.** On A, at spec 013 FR-033's bar, against each set's B1 result: the next-mentor set, plus any new cases 013 T031 and T032 didn't include, with `--only`. Easing and speed graph have no real hand-over case for now; 2 more, about $1 to $2, can be added here. The 4 real hand-over cases run only here, and have no B1 result, so they're judged on their rubric and hard rules. Whole-set runs stay 013's. Credit: $5 to $10 for next-mentor, up to $18 to $35 for the rest (plan › Mentor changes and eval cost). Depends on T077 and on 013 T060 and 013 T062.
- [ ] T079 BL · **Paid, on the builder's go.** Live on A, in the new panel: `bash panel/install.sh --runtime a` (013 T066), one easing lesson, then Find my next lesson through a hand-over (quickstart §7). Can share 013 T021's sitting if that hasn't run. Credit: about $1. Depends on T078 and 013 T066.
- [ ] T080 BL · **Before the first tester:** revisit what the display log keeps. For this build, what a learner types in Ask stays in the local `panel-session.json` (FR-068, builder's decision, 2026-11-04). Decide whether testers' typed text should stay there, and tell the spec writer if it changes.

## Dependencies

Phase 0 → 1 → 2 (stop) → 3 → 4 (stop) → 5. T029 can start any time after approval. T076 follows the merge it names. Phase 6 follows T038 (T077) and the builder's go (T078, T079); shared tasks in 013 can land in either order (plan › Shared work with spec 013). Live tasks run one at a time (one AE lock), each in a fresh
session after a `mentor/` merge. T056 to T060 need T038 reported, so a failing request is known before a sitting.

**No non-easing lesson can start in the panel until T041 lands.** The launch list is in (013 T065), but `main.js` starts only `/ease-mentor`. Phases 1 and 2 are easing only. Phases 3 and 4's eval and recorded-stream tasks don't start the panel. Every live task from T056 on, T050 to T052's manual use, and Phase 5 depend on T041.

## Not tasks

Diagnosis screens, setup screens, `home-return-stored`, a real lesson reset, anything on option A beyond mapping its kinds and Phase 6's check.
