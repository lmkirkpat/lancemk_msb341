# Tasks: Ask the mentor (spec 014)

**Input**: [spec.md](spec.md) (approved 2026-11-14), [plan.md](plan.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md),
[teaching-design.md](teaching-design.md) (TD), [`product/mockups/ask-mentor/`](../../product/mockups/ask-mentor/README.md) (MU).

**Status**: Approved by the builder 2026-11-14 (PQ-1 to PQ-5 as recommended).

**Format**: `- [ ] T### [P?] [Story?] (owner) Description`. `[P]` = can run alongside the other `[P]` tasks
in the same block (different files, no unfinished dependency). Owners (`decisions/007`,
`.claude/hooks/ownership.json`): **skill-builder** (`mentor/**`, `bridge/**`, `.claude/skills/*-mentor/**`),
**panel-builder** (`panel/**`, the helper included), **eval-engineer** (`product/evals/**`),
**spec-writer** (`specs/**` except teaching designs), **reviewer**, **design-reviewer**, **cockpit**
(branches, merges, usage notes, case numbers). **AE** = needs the AE lock, one sitting at a time.
**Builder's hands** = the builder does it in AE or the panel; the agent only reads before and after.
**Paid** = spends A credit; only on the builder's go.

Tests are required for every tool and panel change (constitution III, spec SC-008, SC-011). Mentor tests use
spec 015's live captures (015 T015), never hand-written snapshots.

**Shared code:** `mentor/**`, `bridge/**` and `.claude/skills/*-mentor/**` are add-only (research R15). Each
spec phase's skill work is **one skill-builder branch** the cockpit names `--shared-owner`; `[P]` inside it
marks order freedom only. The panel-builder's branch runs in parallel. A task touching `bridge/` also updates
`bridge/UPSTREAM.md`.

**Spec 015 dependencies** are named as "015 T###" (spec 015's `tasks.md`). No task here builds a read.

---

## Phase 0: Before build

**Purpose:** settle the facts the design rests on, and do the spec housekeeping.

- [ ] T001 (skill-builder, AE; **builder's hands** for the focus and render states) **Is a comp active? (research R10).** Read-only script
  `mentor/dev/live-014/comp-active.jsx`: `app.project.activeItem instanceof CompItem` and its time, in six
  states: comp viewer focused; the Knack panel focused right after clicking into a comp; a footage item
  selected in the Project panel; every comp viewer closed; no project open; a render running (does the call
  queue?). Answer: is it a reliable yes or no, and does panel focus change it?
- [x] T002 [P] (panel-builder) **Hand-over on the fake service (research R4, R5).** `panel/helper/test/ask-handover.test.mjs`:
  a test skill named `*-mentor` with `Skill` in its tools hands over to another; the conversation is kept,
  the tool list switches to the second skill's, a `session.json` value written by a tool before the switch
  is read by a tool after it, and a mid-conversation `/ask-mentor` command switches back.
- [x] T003 [P] (skill-builder) **Practice keeps the schedule (research R18).** `mentor/test/practice-keeps-schedule.test.mjs`:
  a non-review lesson on a learned skill, passed or partial, leaves status, `review_due` and
  `reviews_passed_in_row` as they were, and its entry's kind is `practice`.
- [ ] T004 (cockpit) Log T001 to T003 in `discovery/usage-notes/ask-build.md` (new): each question, the
  answer, what it changes.
- [ ] T005 (spec-writer) Fold T001 to T003 into research R4, R10, R18 and data-model § 6. If T001 shows
  focus changes the flag, apply R10's fallback; if an answer changes a requirement, stop and hand it to the
  builder before T015.
- [x] T006 [P] (spec-writer) Spec 014 housekeeping in `specs/014-ask-mentor/spec.md`: the mockup is v5; FR-047
  and OQ-1 say the 1.5.0 amendment is in; CD-2 to CD-4 marked answered (TD updated 2026-11-14); the builder's
  PQ-4 and PQ-5 answers written into FR-016, FR-019 and FR-006; a pointer to plan › PQ-1 in FR-009.
- [x] T007 [P] (spec-writer) **FR-055: amend spec 007.** In `specs/007-ui-overhaul/spec.md`: FR-006
  (`home-cutoff` → `home-inprogress`; add `home-lessonopen-deeper`, `home-nocomp`, `home-thread` and MU's ask
  states), FR-007 and FR-009 (no Up next card; the quiet line; Pick a skill on Skills), FR-010 (empty record:
  "Welcome to Knack." and Find my next lesson), FR-026 (the quiet line, Set it aside), FR-046 (Ask on Home,
  `decisions/012`), FR-050 and FR-051 (memory and Practice due on Skills), SC-010 (the Home list; ask states at
  the default dock; OQ-4's one-time 260 × 480 log), FR-008 still holds; each dated and pointing at spec 014.
  In `specs/007-ui-overhaul/tasks.md`: T061's note (`home-first` shows the ask card and Find my next lesson; the
  flow from `lesson-picking` on is unchanged).

**Checkpoint:** live facts logged; spec 007 says what the panel will build.

---

# Spec phase 1: Answer (US1, US3)

## Setup

- [ ] T008 (cockpit) Cut the panel-builder worktree from local `main` now. Cut the skill-builder worktree from
  local `main` **after 015 T040** (spec 015 phase 1 shippable; FR-059), and name it `--shared-owner` for
  `mentor/**`, `bridge/**` and `.claude/skills/*-mentor/**`. Hand out the ask set's case numbers to the
  eval-engineer.

## Mentor foundational (skill-builder; blocks US1)

- [ ] T009 (skill-builder) `mentor/lib/runtime-flag.mjs`: `runtime()` returns `"a"` only when
  `AE_MENTOR_RUNTIME` is `a`, else `"b1"` (research R4). Tests in `mentor/test/runtime-flag.test.mjs`.
- [ ] T010 [P] (skill-builder) FR-021: add `short_name` to every skill in `mentor/curriculum/path.json` (MU ›
  Short skill tags) and `shortName(id)` in `mentor/lib/path.mjs`. Tests in `mentor/test/path.test.mjs`: all
  six, and a skill without one falls back to its full name.
- [ ] T011 (skill-builder) `mentor/lib/session.mjs`: the `ask` block (data-model § 2): `saveAnswer`,
  `latestAnswer`, `askStartedAt`; an unreadable file behaves as today. Tests in `mentor/test/session-ask.test.mjs`.
- [ ] T012 (skill-builder) `mentor/lib/ask-answer.mjs`: validate and normalize an asked result (research R3,
  data-model § 1, contracts/ask-tools.md), using spec 015's motion-sources map (015 T019) for K4. Tests in
  `mentor/test/ask-answer.test.mjs` on 015's Comp 1 capture: TD § 16's answer accepted (with PQ-5's untagged
  step 4); one refusal per R3 row; `describe` with no steps accepted; B1 returns `offered_skills: []`.

## User Story 1: an answer with steps that fit the comp (P1)

**Goal:** `give_answer` and the `ask-mentor` skill on B1. **Independent test:** the ask set's phase 1 cases
(T032) on B1, no panel.

- [ ] T013 [US1] (skill-builder) `mentor/tools/ask.mjs` with `give_answer` (contracts/ask-tools.md; no record
  write in this phase). Tests in `mentor/test/ask-tools.test.mjs`: reply shape; `comp` from the last read, never
  the input; `tags` from `path.json`; read-only (a fake bridge sees no write snippet); `NO_ACTIVE_COMP` from the
  read gives a valid `no_comp` answer.
- [ ] T014 [US1] (skill-builder) `.claude/skills/ask-mentor/SKILL.md` (new; name `ask-mentor`, FR-057):
  `allowed-tools` = `describe_layers`, `preview_frame`, `give_answer`. Teaching from TD § 5, § 6 turns 1 to 3
  and 7, § 8 (read the named layers and their sources, summary first, detail for the moving layers), § 9,
  § 13, § 14; FR-001 to FR-020 except the offer's hand-over. The answer turn is one `give_answer` call and no
  other words (PQ-1). Example lines only from TD § 16 and § 19, copied whole. No slash command named. Under
  about 2,500 words (research R16).
- [ ] T015 [US3] (skill-builder) FR-047: `bridge/cep/host.js` `/health` adds `comp_active` from a cached,
  non-blocking read (research R10, as T005 left it); `null` while a job runs or before the first read. Note
  the change in `bridge/UPSTREAM.md` › Changes. Test the cache logic in `bridge/test/comp-active.test.mjs` (new
  folder; Node built-ins, no CEP).
- [ ] T016 (skill-builder) Run `cd mentor && npm test` and `node --test .claude/hooks/test/*.test.mjs`; all
  pass. Note the counts in the hand-back.

## User Story 3: Home opens on a place to ask (P1) and the thread (panel-builder)

**Goal:** every phase 1 MU state, drawn from fixture events. **Independent test:** panel tests, no mentor.

- [ ] T017 [P] [US3] (panel-builder) `panel/lib/copy.js`: MU › Copy's strings and the hand-back line
  (contracts/panel-ask.md); `panel/test/copy.test.js` extended: no underscore names, tool names or commands.
- [ ] T018 [P] [US3] (panel-builder) `panel/lib/view-state.js`: `home-cutoff` → `home-inprogress`; add MU's new
  ids. A test in `panel/test/view-state.test.js` reads MU's States table and checks every new and changed id
  is in `STATE_IDS`.
- [ ] T019 [US1] (panel-builder) `panel/lib/ask-result.js`: a `give_answer` tool result → AskView or `null`
  (data-model § 7; fail closed, FR-048); a `b1` panel always gets `offers: []`. Tests in
  `panel/test/ask-result.test.js`: TD § 16's result; every malformed shape in contracts/panel-ask.md › Tests.
- [ ] T020 [US3] (panel-builder) `panel/lib/home.js` and `panel/lib/screens.js`: ask card and quiet line
  (contracts/panel-ask.md › Home): `home-return`, `home-first`, `home-inprogress`, `home-review-due` (identical
  to `home-return`), `home-lessonopen`, `home-loading`, `home-unreadable`, `home-unreachable`, `home-busy`.
  Tests in `panel/test/home.test.js` (updated: no Up next, Practice due or memory on Home).
- [ ] T021 [P] [US3] (panel-builder) `panel/lib/skills-view.js`, `panel/lib/memory.js`, `panel/lib/screens.js`:
  `skills-due` (Practice due line at the top with Warm up; memory under the path) and `lesson-none`'s new copy.
  Tests in `panel/test/skills-view.test.js` and `panel/test/memory.test.js`.
- [ ] T022 [US3] (panel-builder) `panel/lib/ask-thread.js` (new): the thread model (data-model § 7): questions,
  folding into "Earlier questions (n)", `latest_steps`, the 6 s "Still reading" switch. Tests in
  `panel/test/ask-thread.test.js`.
- [ ] T023 [US3] (panel-builder) `panel/lib/screens.js` and `panel/panel.css`: `ask-typing`, `ask-sending`,
  `ask-reading`, `ask-reading-long`, `ask-answer`, `ask-followup`, `ask-steps-open`, `ask-clarify`,
  `ask-outside` ("See what's covered ›" to Skills), `ask-new-question`, `ask-unreachable`, `ask-nocomp`,
  `ask-busy`, `home-thread`; Your steps in the checklist frame (FR-049: folded, no glyphs, header text, 38%
  cap, swap at short docks). Tests in `panel/test/ask-states.test.js`.
- [ ] T024 [P] [US3] (panel-builder) `panel/lib/requests.js`: the ask and follow-up requests (contracts/panel-ask.md
  › Requests); bubbles show the typed text, never the prefix. `panel/test/requests-eval-sync.test.js` covers the
  new strings.
- [ ] T025 [US3] (panel-builder) `panel/lib/connection.js` reads `comp_active`; Home pauses Ask only on `false`
  (`home-nocomp`, focusable, reason linked); `null` or absent leaves Ask on. Tests in `panel/test/connection.test.js`.
- [ ] T026 [US3] (panel-builder) `panel/lib/panel-session.js` version 3 with the thread (research R12); a
  version 2 file reads as today; a Skills lesson ends the thread. Tests in `panel/test/panel-session.test.js`
  and `panel/test/close-continue.test.js`.
- [ ] T027 [P] [US3] (panel-builder) FR-058: `panel/lib/turns.js` adds `thread` and the kinds `question`,
  `followup`, `go_deeper` (research R11); `panel/dev/turns.js --ask` reports answer turns and go-deeper lessons
  apart. Tests in `panel/test/turns.test.js` and `panel/test/turns-report.test.js`.
- [ ] T028 [P] (panel-builder) `panel/helper/lib/mcp-client.mjs`: `serverEnv` sets `AE_MENTOR_RUNTIME=a`
  (research R4); the B1 runtime folder's `.mcp.json` (`panel/lib/runtime.js`) sets nothing. Tests in the
  helper's `mcp-client` test and `panel/test/runtime.test.js`.
- [ ] T029 [US3] (panel-builder) FR-054 in the new states: `aria-disabled` with `aria-describedby`; steps toggle
  `aria-expanded` and `aria-controls`; Steps a heading; focus never dropped; Enter sends, Shift+Enter adds a
  line; nothing under 11 px. Tests in `panel/test/ask-a11y.test.js`.
- [ ] T030 (panel-builder) Run `node --test panel/test/*.test.js` and the helper's tests; all pass. List any
  phase 1 MU id without a test (expected none).

## User Story 1 eval set (eval-engineer)

- [ ] T031 [P] (eval-engineer) Build `product/evals/ask/` on the next-mentor runner's shape: `run.mjs`
  (`--runtime a|b1`, `--only`, `--repeat`, `--changed`, `--dry-run`, per-case `runtimes`), `README.md`,
  `rubric.md`, fixtures derived from 015 T015's Comp 1 capture and planted copies (no real names). The judge
  reads the answer rebuilt from `give_answer`'s call. Make `product/evals/lib/ready-for-a.mjs` accept
  `describe_layers` and `Skill` in `ask-mentor`.
- [ ] T032 (eval-engineer) Phase 1 cases (numbers from the cockpit): TD § 17 situations 1, 4, 5, 6, 7, 9, 10,
  11, 12, 13, 14, 15, plus EE-4's four rows (expressions over keys, separated dimensions, single and hold keys,
  locked or Collapse) and one how-to (FR-019). Deterministic checks per FR-061 that apply on B1, plus
  `answer_prose_empty` (research R2) and a refusal count per run. Rubric: TD § 5.3's kinds, R-ONE-IDEA as "one
  answer, ending on one choice", about 120 words.
- [ ] T033 (eval-engineer) `node product/evals/ask/run.mjs --dry-run`; fix the set until it validates.

## Phase 1 gate

- [ ] T034 (reviewer) Review the skill-builder branch against FR-001 to FR-021, FR-047, FR-057 and Edge Cases
  A1 to A13, and the contracts.
- [ ] T035 (design-reviewer) Review the panel-builder branch against MU's phase 1 states, Copy and
  Accessibility, FR-046, FR-048 to FR-050, FR-053, FR-054.
- [ ] T036 (cockpit) Merge both with `/merge-worktree` (skill-builder's shared owner named), between live
  sittings.
- [ ] T037 (eval-engineer) The ask set on B1 at the merge commit: at least 80% and every hard check passing;
  situations 1, 4 and 5 at 3 of 3 (SC-006's B1 half). Triage with `/eval-triage`; log in the set's README with
  the refusal counts (plan › Risks).
- [ ] T038 (skill-builder reads, AE, **builder's hands**) Live B1 smoke in the panel (quickstart › Phase 1
  steps 2 to 4): the rock and sweep questions on Comp 1, `home-nocomp`, `turns.js --ask` timing and one
  answer's tokens (research R16).
- [ ] T039 (cockpit) Log T037 and T038 in `discovery/usage-notes/ask-build.md`.
- [ ] T040 (spec-writer) Fold T034 to T039 into the spec (status, any amendments). **Asking works on B1.**

**Checkpoint:** answers on B1, Home ask-first.

---

# Spec phase 2: Go deeper (US2)

**Starts after T040 and 015 T026** (`motion_from` in pivot and null) **and 015 T023** (K2 in the pivot check).

- [ ] T041 (cockpit) Cut the phase 2 skill-builder worktree (`--shared-owner`) and panel-builder worktree from
  local `main`.

## User Story 2: go deeper on my own layer, then back (P1)

**Goal:** on A, a yes opens the pivot or null lesson on the moving layer and hands back.
**Independent test:** the ask set's situation 16 on A (ship step) and the pivot and null sets on B1.

- [ ] T042 [US2] (skill-builder) `mentor/lib/session.mjs`: `saveHandIn`, `takeHandIn(skill, compId)` (once,
  same comp, lapses after the window). Tests in `mentor/test/session-hand-in.test.mjs`.
- [ ] T043 [US2] (skill-builder) `go_deeper` in `mentor/tools/ask.mjs` (contracts/ask-tools.md): B1 refusal,
  `NO_ANSWER`, `NOT_OFFERED`, `OFFER_NOT_READY`, `ROUTE_TO_PIVOT`; `practice` and `missing_prerequisite` from
  the record and path. Tests in `mentor/test/ask-go-deeper.test.mjs` (no learner words saved).
- [ ] T044 [US2] (skill-builder) `mentor/lib/opening.mjs`: the hand-in step (research R6; contracts/hand-in.md):
  `mode_source: "hand_in"`, never review, `hand_in_lost`. Tests in `mentor/test/opening-hand-in.test.mjs`;
  every existing opening test unchanged.
- [ ] T045 [US2] (skill-builder) Set the pivot, K6 and K7: `mentor/tools/transform-anchor.mjs`,
  `mentor/lib/anchor.mjs`, `mentor/lib/anchor-check.mjs`: `hand_in: true` in its FINDERS entry; a null with
  children as a hand-in focus; children's footprints at the same frames on base values (015 K2); `your_call`
  when `place_named` (research R7). Tests in `mentor/test/anchor-hand-in.test.mjs` per contracts/hand-in.md ›
  Tests, including AB held 3's padded PNG.
- [ ] T046 [P] [US2] (skill-builder) Group with a null, K6: `mentor/tools/null-parenting.mjs`: `hand_in: true`;
  the hand-in group as focus. Tests in `mentor/test/null-hand-in.test.mjs`.
- [ ] T047 [US2] (skill-builder) `record_lesson`'s reply adds `hand_back` (`mentor/tools/common.mjs`). Tests in
  `mentor/test/hand-back.test.mjs`.
- [ ] T048 [P] [US2] (skill-builder) FR-022 in `recommend_next`: a test on 015's Comp 1 capture that no keyframe
  skill is recommended with focus on expression-only layers (`mentor/test/recommend-k4.test.mjs`); change
  `mentor/lib/recommend.mjs` only if it fails.
- [ ] T049 [US2] (skill-builder) `.claude/skills/anchor-mentor/SKILL.md`: hand-in opening ("We're on [layer], …",
  first step A then Shift+P); rule 1 with `motion_from` (the parent note rewritten where the parent carries
  Rotation or Scale); rule 2 (say what's checked; never ask for a spot the learner called wrong); K7's null
  focus; a learned skill's lesson with no "review" and no fail words; FR-024's offers; the hand-back last line.
- [ ] T050 [P] [US2] (skill-builder) `.claude/skills/null-parenting-mentor/SKILL.md`: hand-in opening; rule 1
  (a group whose motion comes from a parent above it); routing (an existing control null is Set the pivot's);
  the hand-back last line.
- [ ] T051 [US2] (skill-builder) `.claude/skills/ask-mentor/SKILL.md` phase 2: offers (FR-022 to FR-024), the yes
  (typed, pressed or "show me") → `go_deeper` then `Skill`; the missing prerequisite sentence; TD § 7.1's B1 line
  on `NOT_ON_THIS_RUNTIME`; End lesson → name the next step. `allowed-tools` adds `go_deeper` and `Skill`.
- [ ] T052 (skill-builder) Mentor and hooks suites; all pass.
- [ ] T053 [US2] (panel-builder) `panel/lib/ask-thread.js`: Go deeper per offer, inside its answer only; Back to
  your lesson while open; gone after (FR-050). Tests in `panel/test/ask-thread.test.js`.
- [ ] T054 [US2] (panel-builder) `panel/lib/screens.js`, `panel/lib/lesson.js`: `ask-deeper-starting`,
  `ask-deeper-lesson` (from-your-question line, Pick ticked, Practice tag, Back to the thread),
  `ask-deeper-notyet`, `ask-deeper-passed` (✓ Done, Back to your steps ›), `ask-lessonopen`, `ask-back` (divider,
  hand-back line from `hand_back`, dock opens once), `ask-ended`, `home-lessonopen-deeper`. Tests in
  `panel/test/ask-deeper-states.test.js`.
- [ ] T055 [P] [US2] (panel-builder) `panel/lib/requests.js`: Go deeper and End lesson requests; the first
  follow-up after a lesson gets the prefix (contracts/panel-ask.md). Eval sync test updated.
- [ ] T056 [P] [US2] (panel-builder) Result lines and dividers for all six (contracts/panel-ask.md, PQ-3) in
  `panel/lib/copy.js`, chosen by skill and the check's `passed`. Tests for each skill.
- [ ] T057 (panel-builder) A `b1` panel shows no Go deeper for any result (SC-011); panel and helper suites pass;
  every new and changed MU id has a test (SC-011: 100%).
- [ ] T058 [P] (eval-engineer) Cases (numbers from the cockpit): ask situations 16 (`runtimes: ["a"]`) and 18;
  next-mentor K4; pivot: AB held 1 through a hand-in (K7), AB held 3 (padded PNG, rule 2), rule 1 on a child of an
  expression-driven parent; null: rule 1 and routing. Checks: no "review" in a learned-skill go-deeper; no lesson
  started without a yes.
- [ ] T059 (eval-engineer) On B1 at the branch's merge commit, one set at a time: anchor, null-parenting,
  next-mentor, ask. Each meets its SC-006 with every hard check passing; T058's cases 3 of 3 (SC-007 for pivot
  and null).

## Phase 2 gate

- [ ] T060 (reviewer) Review the skill-builder branch against FR-022 to FR-027, FR-033 and FR-034 for pivot and
  null, and contracts/hand-in.md.
- [ ] T061 (design-reviewer) Review the panel branch against MU › Going deeper and FR-050 to FR-052.
- [ ] T062 (cockpit) Merge both, between sittings; then T059's runs on the merge commit if they ran on the branch.
- [ ] T063 (spec-writer) Fold T058 to T062 into the spec. **Go deeper is ready for A.**

**Checkpoint:** the MVP (phases 1 and 2) is ready for the ship step.

---

# Spec phase 3: Follow-through (US4, US5, US6)

**Starts after T040.** FR-029 and FR-035 (turn 4, rule 3) wait on 015 T022 to T025. May land between sessions;
must land before session 3 (T094).

- [ ] T064 (cockpit) Cut the phase 3 skill-builder (`--shared-owner`) and panel-builder worktrees from local `main`.

## User Story 5: remembered without judging (P2)

- [ ] T065 [US5] (skill-builder) `mentor/lib/asked-record.mjs` (new) and `mentor/lib/learner-store.mjs`: the
  `asked` list (data-model § 3; research R8): `recordAsked`, `markWentDeeper`, `setSaid`, `markRaised`; the
  personal-detail check on every text field (FR-044). Tests in `mentor/test/asked-record.test.mjs` (SC-008): no
  skill field changes; an old record without `asked` reads as empty; reviews, `pastTargets`, marks and the
  practice rule unchanged.
- [ ] T066 [US5] (skill-builder) `give_answer` writes one asked entry for `kind: "answer"` with `after_learning`
  from the record; `go_deeper` sets `went_deeper` (`mentor/tools/ask.mjs`). Tests in `mentor/test/ask-tools.test.mjs`.
- [ ] T067 [P] [US5] (skill-builder) `note_said` (contracts/ask-tools.md). Tests in `mentor/test/ask-note-said.test.mjs`.
- [ ] T068 [US5] (skill-builder) FR-042: `mentor/lib/recommend.mjs` raises an unlearned skill from an asked entry
  when its finder finds something on this comp, below a lesson in progress, once per entry (`raised`); the reply
  carries the entry's goal in general terms. Tests in `mentor/test/recommend-asked.test.mjs`.
- [ ] T069 [P] [US5] (skill-builder) `.claude/skills/next-mentor/SKILL.md`: the asked-candidate line ("last
  week you asked about …", once); K4 respected.
- [ ] T070 [P] [US5] (panel-builder) FR-043: `panel/lib/memory.js` and the Skills view never show asked entries
  or "asked again"; turn 4's answer changes nothing to ✓ or ✗. Tests in `panel/test/memory.test.js`,
  `panel/test/ask-thread.test.js`.

## User Story 6: every lesson traces the motion first (P2)

- [ ] T071 [US6] (skill-builder) K5 (FR-036, research R9): the session's `attributed` list from every check;
  `record_lesson` refuses `RECORD_UNATTRIBUTED` (`mentor/tools/common.mjs`, `mentor/lib/session.mjs`). Tests in
  `mentor/test/record-k5.test.mjs`: AB 6's summary refused; a summary naming a change a check attributed saved.
- [ ] T072 [US6] (skill-builder) FR-032: `mentor/lib/opening.mjs` picks no due review when an ask started in the
  session window (research R6). Tests in `mentor/test/opening-hand-in.test.mjs`.
- [ ] T073 [US6] (skill-builder) K3 and K6 for the other four: `motion_from` (spec 015's shape) and `hand_in: true`
  with a hand-in focus in `mentor/tools/easing.mjs`, `key-types.mjs`, `speed-graph.mjs`, `offset.mjs` (FR-026,
  FR-033). Tests in `mentor/test/motion-from-four.test.mjs` and `mentor/test/hand-in-four.test.mjs`; easing's
  findings unchanged (015's easing-unchanged test re-run).
- [ ] T074 [US6] (skill-builder) The four `SKILL.md` files (`ease-`, `key-types-`, `speed-graph-`, `offset-mentor`):
  rule 1 in one sentence from `motion_from`; rule 4 wording; rule 5; rule 6 (hand-in opening, hand-back last
  line); a learned skill's lesson from a hand-in says no "review".
- [ ] T075 [P] [US6] (skill-builder) `anchor-mentor` and `null-parenting-mentor` `SKILL.md`: rule 3's wording on
  spec 015's K2 ("looks different from my last read; that may be its expression moving it"), rule 4, rule 5.

## User Story 4: follow up, try, say how it went (P2)

- [ ] T076 [US4] (skill-builder) `.claude/skills/ask-mentor/SKILL.md` phase 3: turn 3 (one or two sentences, then
  the pending step), turn 4 (a fresh `describe_layers` read of the same layers at the same time; rule 3; where a
  change landed, as a hint; no pass or fail), "just the steps" (FR-030), a new question (FR-031), asking again
  is normal (FR-041's banned phrases; a crediting bridge allowed), `note_said`; `allowed-tools` adds `note_said`.
- [ ] T077 (skill-builder) Mentor and hooks suites; all pass.
- [ ] T078 [P] (eval-engineer) Ask cases: situations 2, 8, 17, 19, a new question, a learned skill asked about
  (SC-010's phrase check plus rubric); record checks (FR-061: the asked entry changes no skill state; no question
  text in `goal`, checked as no run of 5 words from the question).
- [ ] T079 [P] (eval-engineer) Cases in easing, key types, speed graph and offset: rule 1, rule 5, hand-in (K6,
  `runtimes: ["a"]` where it hands over); a K5 case in each of the six sets; next-mentor's FR-042 candidate.
- [ ] T080 (eval-engineer) On B1 at the branch's merge commit, one set at a time: easing, key types, speed graph,
  offset, anchor, null-parenting, next-mentor, ask. Each meets its SC-006 with every hard check passing; new rule
  cases 3 of 3 (SC-006, SC-007).

## Phase 3 gate

- [ ] T081 (reviewer) Review against FR-028 to FR-045, FR-062 and contracts.
- [ ] T082 (design-reviewer) Review T070 (nothing shows asked entries; no ticks on turn 4).
- [ ] T083 (cockpit) Merge both, between sittings; T080 on the merge commit if it ran on the branch.
- [ ] T084 (spec-writer) Fold T078 to T083 into the spec.

## Later, when spec 015 phase 2 lands (not on the sessions' path)

- [ ] T085 (skill-builder) After 015 T056 and its CD-1 (015 T038): the precomp wording in `ask-mentor/SKILL.md`
  (FR-012, Edge Cases A7).
- [ ] T086 (eval-engineer) Situation 14 updated to the new wording; re-run the ask set on B1.
- [ ] T087 (spec-writer) Amend FR-012 and A7 to the new wording.

---

# Ship step: A and the three sessions (`decisions/011`, FR-056, FR-060)

**Starts after T063** (phases 1 and 2 merged) **and spec 015's SC-001 to SC-003 passing** (015 T040).

- [ ] T088 (eval-engineer) Free checks: `product/evals/lib/ready-for-a.mjs`, and `--runtime a --dry-run` on ask,
  anchor, null-parenting and next-mentor.
- [ ] T089 (eval-engineer, **paid**) One full A run of the ask set, situation 16 at `--repeat 3`; spec 013
  FR-033 against T037's (or T059's) B1 baseline (SC-006's A half; SC-013's eval half). Log cost.
- [ ] T090 (eval-engineer, **paid**, recommended) Anchor and null-parenting on A, since every go-deeper in the
  sessions runs them on A.
- [ ] T091 (cockpit) `bash panel/install.sh --runtime a`; restart AE; check the panel reads runtime A, the AE lock
  is free, and the learner record is the builder's real one (spec › Assumptions).
- [ ] T092 (cockpit logs, AE, **builder's hands**) Session 1 on one of the builder's own comps not set up for
  demos: a question, the steps, at least one go-deeper. Log in `discovery/usage-notes/ask-sessions.md` (new): the
  question in general terms, each step line followed without asking or not, the layer named against a look in
  AE, the go-deeper and whether it was forced.
- [ ] T093 (cockpit logs, AE, **builder's hands**) Session 2, another comp. Merge `panel/` changes only between
  sessions.
- [ ] T094 (cockpit logs, AE, **builder's hands**) Session 3, after phase 3 is merged (T083).
- [ ] T095 (cockpit) Tally in the usage note: SC-001 (go-deeper per session; the watch signal), SC-002 (≥ 80% of
  step lines followed, 0 explanation-only), SC-003 (9 of 10 right layer), SC-009, SC-010, SC-013 (3 of 3 hand-ins
  across two skills).
- [ ] T096 (cockpit) `node panel/dev/turns.js --ask`: SC-004 (≥ 9 of 10 ask turns ≤ 10 s, median; reads past
  15 s logged) and SC-005 (median answer ≤ $0.10, go-deeper lesson ≤ $0.40).
- [ ] T097 (**builder's hands**) SC-012: every new ask state at the default dock, at spec 007 SC-010's heights;
  then `ask-answer`, `ask-steps-open`, `ask-deeper-lesson` at 260 × 480 once (OQ-4). Cockpit logs.
- [ ] T098 (cockpit) SC-008 against the builder's record after session 3: no asked entry changed a skill's fields;
  no question, expression text or personal detail; no unattributed change in any entry.
- [ ] T099 (eval-engineer, **paid**, before the first tester, not a session gate) A re-runs of every set whose
  skill changed in this spec (SC-007's A half; spec 006 FR-025).
- [ ] T100 (spec-writer) Close the spec: status, SC results, the watch signal's outcome for `decisions/012` (if no
  session went deeper unforced, say the decision needs revisiting before sprint 6), and a CLAUDE.md note for the
  cockpit.

---

## Dependencies and order

- **Phase 0:** T001 → T004 → T005 (T005 before T015). T002, T003, T006, T007 any time.
- **Phase 1, mentor:** 015 T040 → T008's skill-builder cut → T009, T010, T011 → T012 → T013 → T014; T015 after
  T005; T016 last. **Phase 1, panel:** T008's panel cut (no 015 wait) → T017, T018, T024, T027, T028 in any order
  → T019 → T020, T021, T022 → T023, T025, T026 → T029 → T030. **Evals:** T031 after T008 (fixtures from 015 T015)
  → T032 → T033.
- **Gate 1:** T016, T030, T033 → T034, T035 → T036 → T037, T038 → T039 → T040.
- **Phase 2:** T040 and 015 T023, T026 → T041 → T042 → T043, T044 → T045, T046 → T047 → T049, T050, T051 → T052.
  Panel T053 to T057 in parallel with the mentor work. T058 after T041; T059 after T052 and T057.
- **Gate 2:** T060, T061 → T062 → T063.
- **Phase 3:** after T040 (T076's turn 4 and T075's rule 3 after 015 T022 to T025). T065 → T066 → T067, T068 →
  T069. T071, T072, T073 → T074, T075 → T076 → T077. T070 any time after T064. T078, T079 → T080 after T077.
- **Ship:** T063 and 015 T040 → T088 → T089 (→ T090) → T091 → T092 → T093 → T094 (needs T083) → T095 to T098 →
  T100. T099 before any tester.

### Critical path

015 T040 → T008 → T011 → T012 → T013 → T014 → T016 → T034 → T036 → T037 → T040 → T041 → T042 → T043 → T044 →
T045 → T049 → T051 → T052 → T060 → T062 → T063 → T088 → T089 → T091 → T092 → T093 → T094 → T100. The panel's
phase 1 (T017 to T030) and T001 to T007 run before 015 lands, so they're off the critical path. The AE tasks
(T001, T038, T092 to T094, T097) are serial (one driver), and T038, T092 to T094 and T097 wait on the builder.

### Parallel examples

- Now, before 015 merges: T001 (AE), T002, T003, T006, T007, and the whole panel phase 1 (T017 to T030).
- Phase 1 gate: T034 and T035 (different reviewers and branches).
- Phase 2: the panel's T053 to T057 alongside the skill-builder's T042 to T052; T058 alongside both.
- Phase 3: T078 and T079 (eval-engineer) alongside T070 (panel-builder).

## Implementation strategy

1. **MVP = phases 1 and 2 on A** (an answer with steps, a go-deeper on pivot or null, the hand-back). That's one
   session's worth (SC-001). Phase 1 alone is useful on B1 for building and evals, not for the sessions: the
   sprint's measure needs a go-deeper.
2. Phase 3 lands between sessions 2 and 3 at the latest; session 3 checks memory (US5) and the other four
   skills' hand-ins.
3. T085 to T087 follow spec 015 phase 2, whenever it lands.

**Task count:** 100. Phase 0: 7. Spec phase 1: 33 (setup and foundational 5, US1 3, US3 12, suites and the
runtime flag 3, evals 3, gate 7). Spec phase 2: 23 (setup 1, US2 14, suites and evals 4, gate 4). Spec phase 3:
24 (setup 1, US5 6, US6 5, US4 1, suites 1, evals 3, gate 4, later 3). Ship: 13.

**By owner:** skill-builder 35 (T001 and T038 on AE), panel-builder 21, cockpit 15 (three of them logging the
builder's sessions), eval-engineer 14, spec-writer 8, reviewer 3, design-reviewer 3, the builder 1 (T097).
Builder's hands in 6 (T038, T092 to T094, T097, and T001's panel-focus state). Paid: T089, T090 (recommended),
T099.
