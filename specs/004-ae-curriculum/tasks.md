---
description: "Task list for spec 004 wave A: the shared pieces skills 2, 1 and 3 build on"
---

# Tasks: After Effects curriculum, wave A shared pieces

**Status**: Approved 2026-10-21. T058 to T065 were added the same day from the skill specs'
shared-code requests (spec 008 SR-1, spec 009 SR-1, spec 010 SR-1 and SR-2), all approved by the
builder.

**Input**: Design documents from `specs/004-ae-curriculum/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/skill-module.md](contracts/skill-module.md),
[contracts/shared-tools.md](contracts/shared-tools.md), [quickstart.md](quickstart.md). The teaching
design is [curriculum.md](curriculum.md) (read only).

**Scope**: only wave A's **shared** pieces (plan › Waves › A1). Skills 2, 1 and 3 are specs 008,
009 and 010, with their own tasks. Waves B, C and D aren't tasked here.

**Tests**: included and written first. The spec requires unit tests on saved snapshots and saved
records for every shared piece (FR-012, FR-036, SC-004 to SC-006).

## Who builds this: one shared-code owner (FR-032)

**One skill-builder builds every task in this file, alone, in one worktree, and is wave A's
shared-code owner.** No other builder runs on `mentor/`, `bridge/` or `.claude/skills/*-mentor/`
while this branch is open. The cockpit merges it with `/merge-worktree <branch> skill-builder`,
passing `--shared-owner` to `check-branch.mjs` for this branch only. After it merges, the three
skill builders (specs 008 to 010) run in parallel and **may only add files**
(`.claude/README.md` › Run a parallel job, steps 3 and 4). A shared change none of this foresaw goes
back to the cockpit as a request, not into a skill branch.

**Existing files this owner changes** (and no others):

| File | Change | Task |
|---|---|---|
| `mentor/errors.mjs` | Reword `DEMO_USED`, `NOT_DEMO_TARGET`; add `REVIEW_NO_DEMO`; `registerErrors()` | T009 |
| `mentor/bridge-client.mjs` | Build the coded-error pattern lazily | T010 |
| `mentor/jsx/snapshot.jsx` | Add `host: { ae_version, os }` (R0) | T012 |
| `mentor/dev/capture.mjs` | `--compare` ignores `host` | T013 |
| `mentor/lib/analyze.mjs` | Add `parseSegmentId` (moved), no behaviour change; `kept_linear` option (FR-038) | T014, T052 |
| `mentor/lib/diff.mjs` | Export `unexpectedChanges` | T014 |
| `mentor/tools/easing.mjs` | Use the shared `takeSnapshot` and `parseSegmentId`; add `FINDERS` | T015 |
| `mentor/lib/session.mjs` | Per skill and comp; analyzer passed in; review mode; `review_offers`; marks passed to analyzers, `keepLinear()`; `skill_options` kept across a resumed lesson; `fresh` restart | T017, T053, T061, T063 |
| `mentor/fixture.mjs` | Load `mentor/fixture/<snippet>.mjs` twins; edits carry `snippet` | T019 |
| `mentor/tools/index.mjs` | Collect `FINDERS`; pass skills and finders to `commonTools` | T020 |
| `mentor/server.mjs` | Instructions: "After Effects skills"; rule 3 generalised | T021 |
| `mentor/lib/learner-store.mjs` | Lesson `kind`, `already_knew`, `targets`; skill `review_due`, `reviews_passed_in_row`; `pastTargets()` read; `marks` | T017, T034, T054 |
| `mentor/tools/common.mjs` | `record_lesson` checks and stored fields; review fields in `read_learner_record`; `recommend_next` | T035, T036, T027, T054 |
| `mentor/errors.mjs` (again) | `NOT_KEPT_LINEAR`; `LESSON_UNDERWAY` | T053, T063 |
| `.claude/skills/ease-mentor/SKILL.md` | Step 2: one line for a kept-linear property (FR-038) | T055 |

Nothing under `bridge/` changes; `.claude/skills/ease-mentor/SKILL.md` changes only in T055. **No existing test
file is edited**: every existing test must pass as it is. If one truly can't, stop and hand back
which and why instead of editing it.

**Files outside this owner's row** (requests the cockpit sends to others, not tasks here):
`panel/lib/runtime.js` (panel-builder: link every `.claude/skills/*-mentor` folder; plan › P3),
`product/evals/**` (eval engineer), `discovery/Claude AE Tutor Test.aep` (saved by the builder in
T041).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks). With one
  builder, [P] only means "order doesn't matter".
- **[Story]**: US1 (first three lessons; FR-038's marks are under US1 because skill 1 writes them and easing reads them), US2 (what to learn next), US3 (reviews), US6 (evals and
  easing holds), from spec.md.
- **🖐 Live**: needs After Effects 26.5 open on `discovery/Claude AE Tutor Test.aep` and the AE
  lock (`decisions/008`); the builder at the keyboard for anything that saves the `.aep`.

---

## Phase 1: Setup

**Purpose**: freeze what easing does today, so every later task can prove it didn't change.

- [x] T001 Run `cd mentor && npm test` on the untouched branch and note the pass count in the PR notes (the number every later run must keep)
- [x] T002 Save easing's current output on Mentor Practice as `mentor/test/fixtures/practice-findings-baseline.json`: the full return of `analyze()` from `mentor/lib/analyze.mjs` on `mentor/test/fixtures/practice-before.json`, with and without `focus_layers: ["Title"]`. Generate it with a throwaway script before any code changes; don't commit the script
- [x] T003 [P] Create the folders `mentor/curriculum/`, `mentor/fixture/` (with a one-line `README.md`: "Fixture twins of skill snippets; see specs/004-ae-curriculum/contracts/skill-module.md › 5"), `mentor/test/fixtures/records/`, `mentor/test/fixtures/timing/`

---

## Phase 2: Foundational (blocking)

**Purpose**: the plumbing every skill and every later phase uses: errors, R0, the shared easing
parts, the per-skill session, fixture twins, finders, server text.

**⚠️ No user story phase starts until this phase is green.**

### Tests first

- [x] T004 [P] Write `mentor/test/analyze-unchanged.test.mjs`: `analyze()` on `practice-before.json` deep-equals `practice-findings-baseline.json` (both variants from T002) (SC-004, FR-015)
- [x] T005 [P] Write `mentor/test/host.test.mjs` for `mentor/lib/host.mjs` (data-model › Host): `parseHost({ host: { ae_version: "26.5x12", os: "Macintosh OS 27.0.1/64" } })` → `{ known: true, version: "26.5", build: "12", os: "macOS 27.0.1", platform: "mac", beta: null }`; a Windows `$.os` string → `platform: "win"`; no `host` → `{ known: false }`; extra keys and anything after the OS version are dropped (FR-011: no user, path or machine name); `atLeast(host, "25.4")` true at 26.5, false at 25.3, false when unknown
- [x] T006 [P] Write `mentor/test/session-skills.test.mjs` for the session contract (contracts/skill-module.md › 4, data-model › Session lesson), using a small stub analyzer in the test:
  - `start(snapshot)` with no options behaves exactly as today (easing, key without `|` read as easing's; an old `session.json` written in the test with a comp-id key is continued as easing).
  - Two skills on one comp keep separate lessons; `currentLesson().skill` is the last one started.
  - `mode: "review"` → `demo_target` null even with 2+ targets, `assertCanDemo` throws `REVIEW_NO_DEMO`, lesson stores `mode` and `exclude`; the analyzer receives `exclude` read from a learner record holding past targets for that skill, comp and project, and none from other comps.
  - Review with no targets → `no_demo_reason: "no_new_target"`.
  - Changing `mode` for the same skill and comp starts a new lesson.
  - One target → no demo (`single_target`), as easing's single-pair rule.
  - `target_refs` stored as given by the analyzer.
  - `review_offers` entries older than 3 hours are pruned on write.
- [x] T007 [P] Write `mentor/test/fixture-plugins.test.mjs`: a twin file written to a temp copy of `mentor/fixture/` (or loaded through an injectable folder) is found by snippet name; its `run` gets the current fixture snapshot and `saveEdit`; saved edits carry `snippet`; on the next `snapshot`, each edit is replayed by its twin's `apply`; an old edit without `snippet` replays as an ease (existing eval fixtures keep working); an unknown snippet still throws
- [x] T008 [P] Write `mentor/test/skill-module.test.mjs`: a sample skill (tool file, lib, finder, stub analyzer) placed in a temp tools folder through the same discovery `index.mjs` uses is found, its `FINDERS` collected, its tool names listed, its skill ID in `record_lesson`'s enum; a duplicate tool or skill ID refuses to start; a tool name without the skill's prefix fails a lint check in the test. Keep the sample's files under `mentor/test/fixtures/sample-skill/` so the cockpit can copy them for quickstart › 6

### Implementation

- [x] T009 Update `mentor/errors.mjs` per contracts/shared-tools.md › Errors: reword `DEMO_USED` and `NOT_DEMO_TARGET` to the contract's text, add `REVIEW_NO_DEMO`, export `registerErrors(map)` (adds codes; throws on a code that exists with a different message). Keep `CODES` as a live view (a getter or function) so later registrations count
- [x] T010 Update `mentor/bridge-client.mjs`: build the `CODED` pattern from the current codes when `toError` first needs it (and again after `registerErrors`), not at import. `mentor/test/snippets.test.mjs` and `jsx-lib.test.mjs` pass unchanged
- [x] T011 [P] Create `mentor/lib/host.mjs` (`parseHost`, `atLeast`) to pass T005
- [x] T012 Update `mentor/jsx/snapshot.jsx`: add `host: { ae_version: app.version, os: $.os }` to the returned object, nothing else (R0, research R10). Wrap each in try/catch → null
- [x] T013 [P] Update `mentor/dev/capture.mjs`: `--compare` strips `host` as well as `taken_at`
- [x] T014 [P] Move `parseSegmentId` from `mentor/tools/easing.mjs` into `mentor/lib/analyze.mjs` (exported, same code); export `unexpectedChanges` from `mentor/lib/diff.mjs` (same code). T004 and the existing analyze, diff and eval-fixture tests pass
- [x] T015 Create `mentor/lib/snapshot.mjs` exporting `takeSnapshot()` (moved from `mentor/tools/easing.mjs`: `runSnippet("snapshot", {})` plus `taken_at`). Update `mentor/tools/easing.mjs` to import it and `parseSegmentId`, and add `export const FINDERS = { "easing.basic": { focus: (snapshot, { exclude = [] } = {}) => ({ count, layers }), review: false } }`, where `count` is the number of pairs `needsEase` on layers and properties not in `exclude`. `snapshot_project`, `set_ease`, `diff_since_last` inputs and outputs unchanged
- [x] T016 [P] Add a unit test to `mentor/test/skill-module.test.mjs` (new file from T008, so not an existing test): easing's `FINDERS.focus` count on `practice-before.json` equals the number of `targets` easing's `analyze` gives with the same layers
- [x] T017 Rewrite `mentor/lib/session.mjs` to the contract (contracts/skill-module.md › 4, data-model › Session lesson): `start(snapshot, { skill = "easing.basic", analyze = easingAnalyze, focus_layers, mode = "lesson" })`; key `${skill}|${comp.id}`, reading old comp-id keys as easing's; lessons store `skill`, `mode`, `target_refs`, `exclude`; in review mode read past targets with `pastTargets(skill, project, comp)` from `mentor/lib/learner-store.mjs` (add that read-only export; the write changes are T034), pass them as `exclude`, force `demo_target: null`, and set `no_demo_reason: "no_new_target"` on an empty result; the session (not the analyzer) forces no demo when there's one target; `assertCanDemo` throws `REVIEW_NO_DEMO` in review mode; add `recordReviewOffer(skill)` and `reviewOffers()` with 3-hour pruning (research R8). For easing, `target_refs` come from its targets' layer and property display names (the session derives them when an analyzer doesn't return them, so easing's `analyze` stays unchanged). Existing `session.test.mjs`, `tools.test.mjs`, `fixture-mode.test.mjs` pass unchanged; T006 passes. Build T061 and T063 (Phase 5c) into this same rewrite
- [x] T018 [P] Write `mentor/test/fixtures/sample-skill/` twin `sample-snippet.mjs` for T007 (a no-op change recorded and replayed)
- [x] T019 Update `mentor/fixture.mjs` (research R9, contracts/skill-module.md › 5): keep `snapshot`, `set-ease`, `preview-frame` built in; load `mentor/fixture/<name>.mjs` (`run`, `apply`) for any other snippet; `saveEdit` stores `{ snippet, comp_id, ...edit }`; replay calls the edit's twin (`set-ease` when `snippet` is missing). Allow tests to point it at another twin folder (an env var such as `AE_MENTOR_FIXTURE_TWINS`, test-only). T007 and `fixture-mode.test.mjs` pass
- [x] T020 Update `mentor/tools/index.mjs`: collect `FINDERS` from every tool module into one map (refuse a finder whose ID isn't in that module's `SKILLS`); export it; call `commonTools({ skills: SKILLS, finders: FINDERS })`. Keep the duplicate checks. Allow tests to point discovery at another folder the same way as T019. T008 passes
- [x] T021 Update `mentor/server.mjs` `INSTRUCTIONS` per contracts/shared-tools.md › Server instructions: the opening says the tools teach After Effects skills in the learner's own comp; rule 3 becomes "At most one demonstration per lesson, with the lesson's own demonstration tool (set_ease for easing), on its demo target only, and none in a review; the learner does the rest." Rules 1, 2, 4 to 8 unchanged word for word

**Checkpoint**: `npm test` green (T001's count plus the new tests); easing's tool outputs unchanged.

---

## Phase 3: User Story 2 — Know what to learn next, and why (P1) 🎯

**Goal**: the path is data, checked against `curriculum.md`, and one deterministic function picks
what's next (FR-001 to FR-008, FR-020's limits, FR-036).

**Independent test**: on at least 12 saved records (SC-005), `recommend()` matches FR-004 every
time and never recommends an unbuilt skill or one with an unlearned hard prerequisite.

### Tests first

- [x] T022 [P] [US2] Write `mentor/test/path.test.mjs` (FR-002): parse the tables in `specs/004-ae-curriculum/curriculum.md` › "## 4. The path" (columns `#`, Skill, Hard prerequisites, Soft) and › "## 10. Diagnosis findings to skills" (Finding, Skill) with plain string splitting, map the curriculum's words to IDs with one small table in the test ("keyframes" → on-ramp, "easing" → `easing.basic`, "1–3" → skills 1, 2, 3, "none in the 10 …" → `null`, "a shape or text layer to use" → `needs_in_comp`), and assert that `mentor/curriculum/path.json` has the same skills, order, hard and soft prerequisites, and finding map. Also: every ID unique; every prerequisite ID exists; no cycles. The test reads `curriculum.md`; it never writes it
- [x] T023 [P] [US2] Save at least 12 learner records in `mentor/test/fixtures/records/` (all `version: 1`, written by hand from data-model › Skill state; these are records, not snapshots, so FR-012's live-capture rule doesn't apply): `empty`, `easing-practicing`, `easing-learned`, `easing-learned-old-v1` (no review fields), `speed-graph-practicing`, `speed-graph-and-key-types-practicing` (most recent wins), `first-three-learned-review-due`, `first-three-learned-none-due`, `review-due-practiced-today` (a practice lesson on that skill in the last 3 hours), `all-built-learned`, `hard-prereq-missing` (asks for skill 2 with easing not learned), `already-knew` (a review passed before any first lesson), `unreadable` (bad JSON)
- [x] T024 [P] [US2] Write `mentor/test/recommend.test.mjs` for `recommend({ path, record, built, finders, snapshot, now, offers })` (contracts/shared-tools.md › `recommend_next`), with stub finders and a fixed `now`. One test per record from T023 asserting the full result, plus:
  - Step order 1 → 4; practicing beats a due review (C2).
  - A due review needs `review: true`, a finder count above 0 with past targets excluded, no unprompted offer in `offers` within 3 hours, and no practice lesson on that skill in the last 3 hours; at most one review returned.
  - Step 3 tie-break: soft prerequisites all learned first, then path order.
  - Step 4 sets `offer_practice_comp: true`; with `snapshot: null` (AE unreachable) it's `false`, `looked_at_comp: false`, and step 2 offers nothing.
  - Unbuilt skills and skills with an unlearned hard prerequisite never come back (SC-005: 0 times across all states).
  - `requested_skill`: `built`, `learned`, `missing_prerequisites` (hard only; skill 4's are empty, FR-007), `has_focus`.
  - No review is ever recommended for an unlearned skill.
  - Unreadable record → every skill not started, `record_readable: false`.
  - Same input → same output (deterministic).

### Implementation

- [x] T025 [P] [US2] Create `mentor/curriculum/path.json` per data-model › Path, with all eleven skills (IDs from research R4, names from `curriculum.md` › 4's Skill column, easing named "Easing"), the on-ramp, and DX-01 to DX-09. Create `mentor/lib/path.mjs` exporting `readPath()`, `skillName(id)`, `pathOrder()`, `isBuilt(id, skills)`. T022 passes
- [x] T026 [US2] Create `mentor/lib/recommend.mjs` (pure; `SESSION_WINDOW_HOURS = 3`) using `mentor/lib/path.mjs` and `mentor/lib/reviews.mjs`'s `isDue` (T033). T024 passes
- [x] T027 [US2] Add `recommend_next` to `mentor/tools/common.mjs` (contracts/shared-tools.md): input `{ requested_skill?: string }` (no enum, so an unbuilt skill can be asked about); read the record (`RECORD_UNREADABLE` → `record_readable: false`, file untouched); try `takeSnapshot()` and fall back to `snapshot: null` on `AE_UNREACHABLE` or `AE_BUSY`; call `recommend()`; when it returns a `review`, call `session.recordReviewOffer(skill)`; return `skill_name` from `skillName()`. `annotations: { readOnlyHint: true }`
- [x] T028 [US2] Add a tool-level test in a new file `mentor/test/recommend-tool.test.mjs` running `recommend_next` in fixture mode on `practice-before.json` with T023's records: AE unreachable gives a record-only answer; a returned review is remembered and not offered again inside 3 hours
- [x] T029 [US2] Create `.claude/skills/next-mentor/SKILL.md` (plan › P4): frontmatter `name: next-mentor`, a description that triggers on "what should I learn next", "/next-mentor", or a session started with no skill named; `allowed-tools`: `read_learner_record`, `recommend_next`. Steps: read the record; call `recommend_next` (with `requested_skill` when the learner names one); say the recommendation in at most two sentences with the reason, using `skill_name`, never an ID or field name (FR-008); if the comp wasn't looked at, say so; for a missing hard prerequisite, name it and offer it first, and if the learner insists, hand to the asked-for skill with one sentence on what it builds on (FR-005); never start an unbuilt skill (FR-006); never offer a review for an unlearned skill, but if the learner says they already know one, hand to that skill in review mode (FR-020). On agreement, hand over by invoking that skill's `/<short>-mentor` (with `mode: "review"` for a review). Include the hard rules block from `.claude/skills/ease-mentor/SKILL.md` › Hard rules that apply (no `after-effects` tools, no claims without a read, plain speech, never announce a call). Spec 005's diagnosis entry replaces this skill's role at session start once it's built (spec 005 FR-026)

**Checkpoint**: recommendation fully unit tested; `/next-mentor` reachable in Claude Code.

---

## Phase 4: User Story 3 — Reviews: the data, the schedule, the rules in code (P1)

**Goal**: the record holds what a review needs, the schedule is computed in one place, and the
tools refuse a review that breaks FR-021 (FR-018, FR-019, FR-021's code rules, FR-022, FR-023).
Each skill's review *teaching* is in its own spec (wave C).

**Independent test**: on saved records, the schedule matches data-model › Skill state's
transition table in every row; an old v1 record reads with worked-out review fields and isn't
rewritten by a read.

### Tests first

- [x] T030 [P] [US3] Write `mentor/test/reviews.test.mjs` for `mentor/lib/reviews.mjs` (research R5), with `process.env.TZ` set at the top of the file and fixed dates: every row of data-model › Skill state's transition table; intervals 1, 3, 7, 14, 30, and 30 again after a fifth passed review; a failed review → 1 day and run 0; `not_checked` review → unchanged; practice on a learned skill → unchanged; "already knew it" pass → learned, d + 1; a learned skill with no `review_due` → `last_practiced`'s local date + 1; `isDue` true on and after the due date, false before; a pass at 23:30 local is due the next calendar day
- [x] T031 [P] [US3] Write `mentor/test/learner-store-v1.test.mjs`: an existing v1 record (`easing-learned-old-v1` from T023) reads with `review_due` and `reviews_passed_in_row` worked out and the file byte-identical after the read (FR-023); `recordLesson(input, skills, { lesson, prevRecord })` stores `kind` (`first`, `practice`, `review`), `already_knew` only on a review of an unlearned skill, `targets` from the lesson's `target_refs` de-duplicated by layer and property; the file stays `version: 1`; `recordLesson(input, skills)` with no lesson context behaves exactly as today (the old call); the email and phone check still covers every text field (FR-022); `pastTargets(skill, project, comp)` returns targets only from that skill, project and comp (Edge Cases: another comp counts as new)
- [x] T032 [P] [US3] Write the tool-level rules in a new `mentor/test/record-tool.test.mjs` (fixture mode): `record_lesson` refuses (`RECORD_MISMATCH`) a `skill` other than the current lesson's, and `demo_used: true` on a review; a review lesson's entry is stored with `kind: "review"`; `read_learner_record` returns `review_due`, `reviews_passed_in_row`, `review_is_due` per learned skill; the `record_lesson` reply stays `{ saved, skill: { status, next } }`

### Implementation

- [x] T033 [P] [US3] Create `mentor/lib/reviews.mjs` (pure): `INTERVALS = [1, 3, 7, 14, 30]`, `localDate(date)`, `addDays(ymd, n)`, `nextState(prevSkill, { kind, result, date, wasLearned })`, `withReviewFields(skill)` (fills missing fields for old records), `isDue(skill, now)`. T030 passes
- [x] T034 [US3] Update `mentor/lib/learner-store.mjs`: `recordLesson(input, skills, context = {})` adds `kind`, `already_knew`, `targets` and the review fields via `reviews.nextState` when `context.lesson` is given, and keeps today's exact behaviour without it; add `pastTargets(skill, project, comp)` (if not already added in T017); `readRecord()` unchanged in what it returns (the worked-out fields are added by the tool, T036, so `learner-store.test.mjs` passes unchanged). T031 passes
- [x] T035 [US3] Update `record_lesson` in `mentor/tools/common.mjs` (contracts/shared-tools.md › `record_lesson`): `assertMatchesLesson` also checks the skill matches the current lesson and refuses `demo_used: true` for a review; its message says "the demonstration ran" / "didn't run" instead of naming `set_ease`; pass `{ lesson }` to `learner.recordLesson`. Input schema and reply unchanged. `tools.test.mjs` passes unchanged
- [x] T036 [US3] Update `read_learner_record` in `mentor/tools/common.mjs`: return each skill with `reviews.withReviewFields()` applied and `review_is_due`; never write the file. T032 passes

**Checkpoint**: a skill builder can run a review lesson with `mode: "review"` and the record and
schedule follow FR-018 to FR-021 with no shared change.

---

## Phase 5: User Story 1 — What skills 2, 1 and 3 need from shared code (P1)

**Goal**: the cross-layer timing analysis (FR-016, FR-017) and the second practice comp's wave A
targets (FR-031), so skills 2, 1 and 3 can be built by adding files.

**Independent test**: the timing analysis matches its answer key on Mentor Practice, Mentor
Practice 2 (30 and 60 fps) and the synthetic timing cases, layer by layer (SC-006, wave A's part).

### Tests first

- [x] T037 [P] [US1] Write `mentor/test/fixtures/practice-timing-expected.json` by hand from the key times and types in `mentor/dev/build-practice-comp.jsx` (not from running `timing()`), following data-model › Timing measures: each layer's units, `excluded` reasons (Logo's expression property, single keys, Cursor's holds as instant moves), moves, starts and landings, Bar's separated X Position as one unit, Glow's effect keys counted, Icon marked `precomp`, `starts_by_frame` and `landings_by_frame`, `last_motion_end`. Note in the file which script lines each entry comes from
- [x] T038 [P] [US1] Write the synthetic timing cases in `mentor/test/fixtures/timing/` for rows no live capture has yet, each a copy of an existing synthetic snapshot with times changed and a comment field saying so: `equal-values.json` (two neighbouring keys with the same value: a pause), `separated-xyz-offset.json` (X and Y moving over overlapping spans), `sixty-fps.json` (frame rounding at 60 fps). Prefer the live 60 fps capture from T042 when it exists
- [ ] T039 [P] [US1] Write `mentor/test/timing.test.mjs`: `timing()` deep-equals `practice-timing-expected.json` on `practice-before.json`; each synthetic case's expected measures; `clusters(events, tol)` groups by the caller's tolerance (a 1-frame gap at 30 fps grouped with tolerance `max(2/30, 1/15)`, a 3-frame gap at 60 fps grouped with `max(2/60, 1/15)`; these are test inputs, not thresholds in the code, FR-017); deterministic; no field in the output is a verdict (no `lockstep`, `same`, `too`); `timing()` on a snapshot with no layers returns empty arrays and `last_motion_end: null`. After T042, add the Mentor Practice 2 answer-key checks (30 and 60 fps)

### Implementation

- [x] T040 [US1] Create `mentor/lib/timing.mjs` (pure; research R11, data-model › Timing measures): `timing(snapshot)` and `clusters(events, toleranceSeconds)`. Units per layer: separated `ADBE Position_0/_1/_2` merged into one "Position" unit, every other property its own unit by `display_path`; `excluded: "expression"` when `expression_enabled`, `"single_key"` for one key, `"no_change"` when every pair is a pause; a pair whose first key's `out_type` is `hold` is `kind: "instant"` at the second key's time; equal neighbouring values (deep-equal, non-null) are a pause; frames `Math.round(time * frame_rate)`; back-to-back pairs stay separate moves (T059, Phase 5c). T039 passes
- [ ] T041 🖐 [US1] Write `mentor/dev/build-practice-comp-2.jsx` (research R13) building "Mentor Practice 2" (1920×1080, 30 fps, 8 s) in the open project, refusing to run if it exists unless `{"replace": true}`, never touching "Mentor Practice" or "Icon Precomp". Targets, each declared next to its keys in an answer key written to `ARGS.out` (`mentor/test/fixtures/practice2-expected.json`; pass `out` on the command line rather than adding a default to `mentor/dev/assemble.mjs`, so that file stays unchanged). The answer key lists each property's expected easing pair states and its timing measures:
  - Skill 1: "Blink", 4 opacity keys alternating 100 and 0, **eased** (should be held); "Spinner", Rotation 0 → 360 over 4 s, **linear** (should stay linear); "Cut", a second on/off opacity change for skill 1's review.
  - Skill 2's review: "Card", Position and Scale pairs at Easy Ease defaults (33.33 both sides).
  - Skill 3 and its review: "Dot 1", "Dot 2", "Dot 3" whose first Position keys share 0.5 s; "Badge", Scale and Opacity starting and landing on the same frames.
  - Timing overlaps: a hold pair that starts a move ("Flag", hold then ramp); two neighbouring keys with equal values ("Pause", Position).
  - No layers for waves B or D.
  - Plus T064's targets (Phase 5c), built in the same script.
  Run it via `node mentor/dev/assemble.mjs build-practice-comp-2 '{"out": "<abs path>/mentor/test/fixtures/practice2-expected.json"}'` and the upstream bridge's `ae_run_script` (dev chore, as spec 002 T014). The builder saves `discovery/Claude AE Tutor Test.aep`
- [ ] T042 🖐 [US1] Capture fixtures with `mentor/dev/capture.mjs` (quickstart › 2 and 3): first `--compare mentor/test/fixtures/practice-before.json` with Mentor Practice active, recording the differences it lists in the hand-back (it no longer has to say "Matches": the live Mentor Practice has changed since that capture, so the builder decided 2026-10-21 that `practice-before.json` stays the answer key for Mentor Practice as it was built, and each skill takes its own capture of the comp as it is now in its own plan; `--compare` still exits non-zero on a mismatch; this run still checks T012's `host` is ignored); then `mentor/test/fixtures/practice2-before.json` with Mentor Practice 2 active; then a 60 fps duplicate as `mentor/test/fixtures/practice2-60fps.json` (duplicate, change frame rate, capture, delete the duplicate, save). Record the `host` values seen and whether `app.version` marks a beta build in the PR notes (FR-030, quickstart › 2). Check no capture holds a user name or folder path
- [ ] T043 [US1] Add Mentor Practice 2's checks to `mentor/test/timing.test.mjs` (from `practice2-expected.json`'s timing section) and a test that easing's `analyze()` on `practice2-before.json` finds exactly the pairs the answer key lists as linear (the new comp doesn't confuse easing)

**Checkpoint**: everything specs 008 to 010 need is merged-ready.

---

## Phase 5b: User Story 1 — Linear on purpose is remembered (FR-038, P1)

**Goal**: when skill 1's check confirms a move the learner said runs at constant speed, the record
keeps a kept-linear mark, and easing stops proposing that property while the mark applies
(data-model › Kept-linear mark, contracts/skill-module.md › 6). Added 2026-10-20 (builder's call).

**Independent test**: SC-013: on saved snapshots, a marked property is in easing's findings and
targets 0 times while the mark applies and back every time after its keys change; with no marks,
easing's output equals `practice-findings-baseline.json`.

### Tests first

- [x] T049 [P] [US1] Write `mentor/test/marks.test.mjs` for `mentor/lib/marks.mjs` on `practice-before.json` and the synthetic `linear-basic.json`, `eased.json`, `expression.json`: `applies(mark, snapshot)` true when the layer and path exist with exactly `key_times`, no expression, and every pair `linear` (`segmentState`); false (lapsed) after one pair is eased, a key is held, a key is added or moved, the expression is turned on, or the layer is renamed; `marksFor(record, project, comp)` returns only that project and comp's marks; `isKeptLinear(marks, layer, path, snapshot)`; a record with no `marks` gives `[]`
- [ ] T050 [P] [US1] Write `mentor/test/analyze-kept-linear.test.mjs`: `analyze(practice-before, { kept_linear: [CTRL Position mark] })` leaves CTRL Position out of `findings` and `targets`, lists it in `skipped` with `reason: "kept_linear"`, keeps `counts` the same, and picks a `demo_target` elsewhere; with `focus_layers: ["CTRL"]` it stays skipped and `targets` is empty (`no_demo_reason: "nothing_to_ease"`); a lapsed mark (CTRL Position eased in a copy) changes nothing; `kept_linear: []` and no option both deep-equal `practice-findings-baseline.json` (SC-004, SC-013). After T042, add the same on `practice2-before.json` with a mark on Spinner Rotation
- [x] T051 [P] [US1] Write `mentor/test/kept-linear-record.test.mjs` (fixture mode, temp home): `session.keepLinear(snapshot, [{ layer, property }])` stores `{ layer, path, property, key_times }` on the current lesson for an all-linear property, and throws `NOT_KEPT_LINEAR` for a property not found, one with an expression on, or one with any non-linear side, storing nothing; with no lesson it throws `NO_SESSION`; `record_lesson` writes the lesson's marks to `learner.json` › `marks` (replacing one on the same comp, layer and path), removes marks for that comp that are lapsed in the lesson's baseline, leaves other comps' marks alone, keeps `version: 1`, and its reply is unchanged; the email and phone check rejects a mark whose layer name is an email; `read_learner_record` returns `marks`; a second easing lesson on that comp (`session.start`) passes the applying marks to the analyzer and leaves the property out; no tool input lets the model write a mark

### Implementation

- [x] T052 [US1] Create `mentor/lib/marks.mjs` (`applies`, `marksFor`, `isKeptLinear`, `markFrom(snapshotProp, layer)`), and add the `kept_linear` option to `analyze()` in `mentor/lib/analyze.mjs`: a property with an applying mark goes to `skipped` with `reason: "kept_linear"` (after the existing `expression` and `single_key` reasons, which win) and is left out of `findings` and `targets`; `counts` unchanged. T049, T050 pass; T004 still passes
- [x] T053 [US1] Update `mentor/lib/session.mjs`: `start()` reads `marksFor(record, project, comp)` from the learner record (unreadable record → no marks, never an error from here), keeps the applying ones on the lesson as `marks`, and passes them to any analyzer as `opts.kept_linear`; add `keepLinear(snapshot, refs)` per contracts/skill-module.md › 6, resolving each property by display name or path on the named layer. Add `NOT_KEPT_LINEAR` to `mentor/errors.mjs` with the text in contracts/shared-tools.md › Errors
- [x] T054 [US1] Update `mentor/lib/learner-store.mjs` and `record_lesson` in `mentor/tools/common.mjs`: write `context.lesson.kept_linear` to `record.marks` (data-model › Kept-linear mark: `kind: "kept_linear"`, `project`, `comp`, `layer`, `path`, `property`, `key_times`, `skill`, `date` as a local `YYYY-MM-DD`), replacing on the same comp, layer and path; drop that comp's marks that don't `apply` to the lesson's baseline; run the email and phone check on `layer` and `property`. A record without `marks` reads as `[]`; `recordLesson(input, skills)` without a lesson behaves exactly as today. T051 passes; `learner-store.test.mjs` and `tools.test.mjs` pass unchanged
- [x] T055 [US1] Update `.claude/skills/ease-mentor/SKILL.md` step 2's "Say what you're leaving out and why" list with one item: a `skipped` property with reason `kept_linear` is named once in plain words with the learner's reason ("Logo's Rotation stays linear: you said it runs at constant speed"), never proposed or demonstrated on; if the learner asks to ease it after all, they can ease it themselves whenever they like and it's an ordinary pair from then on. Change nothing else in the file
- [x] T056 [US1] Add a learner record with a kept-linear mark to `mentor/test/fixtures/records/` (`easing-learned-kept-linear.json`, a mark on Mentor Practice's CTRL Position with its real key times) for the eval engineer's case 12 and for T050's tool-level check through `snapshot_project`; and assert in `mentor/test/kept-linear-record.test.mjs` that `snapshot_project` in fixture mode with that record lists CTRL Position in `skipped` with reason `kept_linear`
- [x] T057 [US1] Note for spec 009 and spec 005 in the hand-back (T048): skill 1's check calls `keepLinear` with what the learner named; diagnosis reads marks with `marksFor` and `isKeptLinear` (contracts/skill-module.md › 6). No code in this task beyond confirming the exports exist and are covered by T049 to T051

**Checkpoint**: SC-013's unit tests pass; easing's output with no marks is unchanged.

---

## Phase 5c: Requests from the skill specs (approved 2026-10-21)

**Purpose**: the shared changes specs 008, 009 and 010 asked for, built on this branch so the
parallel skill builders never need to touch a shared file. Added 2026-10-21; they run before
Phase 6 despite their numbers. Each pair is test first, then code.

**Independent test**: the tests below pass, and T004 and every existing test still pass unchanged.

### Back-to-back pairs are separate moves (spec 010 SR-1)

- [x] T058 [P] [US1] Add to `mentor/test/timing.test.mjs` (new in T039) and to T037's answer key: on `practice-before.json`, Title's Position (keys 0.5, 1.5, 3 s) gives **two** moves, 0.5–1.5 s and 1.5–3 s, not one 0.5–3 s move; Bar's separated X Position (keys 0, 0.6, 1.2 s, X only keyed) gives two moves. Add a synthetic `mentor/test/fixtures/timing/back-to-back.json` (marked synthetic in its comment field): a four-key Position like Title's on the builder's comp today (0.5, 1.5, 3, 4.37 s) gives three moves; a ramp, then a pause (equal values), then a ramp gives two moves; a separated Position where Y moves 0.5–1.5 s while X moves 0.5–1 s and 1–1.5 s gives one merged move (0.5–1.5 s), because each X move overlaps the Y move; X alone with the same two moves gives two
- [x] T059 [US1] In `mentor/lib/timing.mjs` (T040): every key pair that isn't a pause is its own move. Merging (data-model › Timing measures, Separated dimensions row) happens only between moves of **different** separated dimensions that overlap or touch in time; two moves of the same dimension, or of an unseparated property, are never merged with each other, though both can end up in one merged move through another dimension's move that overlaps them. Update nothing else. T058 passes

### A lesson keeps a skill's own analyzer options (spec 008 SR-1)

- [x] T060 [P] [US1] Add to `mentor/test/session-skills.test.mjs` (new in T006), with the stub analyzer recording what it's given: `start(snapshot, { skill, analyze, skill_options: { land_hard: [<pair id>] } })` passes `opts.skill_options` to the analyzer (as well as `focus_layers`, `exclude`, `kept_linear`) and stores it on the lesson as `skill_options`; a later `start()` for the same skill and comp **without** `skill_options` (continued, and resumed after another comp) passes the stored value again, for both the current read and the baseline; a later `start()` **with** `skill_options` replaces the stored value; a new lesson (after a pass, or a change of `mode`) starts with none; easing with no `skill_options` gets exactly what it gets today; a value that isn't plain JSON data throws before any write
- [x] T061 [US1] In `mentor/lib/session.mjs` (part of T017's rewrite): add the `skill_options` option and lesson field per contracts/skill-module.md › 4 and data-model › Session lesson. The session stores and passes it through and never reads inside it. T060 passes

### A skill can restart a lesson from the current comp before any demo or check (spec 009 SR-1)

- [x] T062 [P] [US1] Add to `mentor/test/session-skills.test.mjs`: `start(snapshot, { skill, analyze, fresh: true })` on an unpassed lesson for that skill and comp with no demo recorded and no check made starts a **new** lesson (`lesson: "new"`, a new `lesson_id`) with this snapshot as the baseline, so a target that exists only in this snapshot (a practice blink added after the first look) is in `targets`; after `recordDemo` or after `markChecked`, `fresh: true` throws `LESSON_UNDERWAY` and `session.json` is byte-identical; with no lesson to replace it's an ordinary start; it works the same in `mode: "review"`; other skills' lessons on the comp and the same skill's lessons on other comps are untouched; a fresh lesson carries nothing from the one it replaces (no `skill_options`, `kept_linear` or demo); without `fresh`, today's continue and resume behaviour is unchanged
- [x] T063 [US1] In `mentor/lib/session.mjs` (part of T017's rewrite): add the `fresh` option per contracts/skill-module.md › 4; add `LESSON_UNDERWAY` to `mentor/errors.mjs` with the text in contracts/shared-tools.md › Errors. T062 passes

### More skill 3 targets in Mentor Practice 2 (spec 010 SR-2)

- [ ] T064 🖐 [US1] In `mentor/dev/build-practice-comp-2.jsx` (T041, same script and sitting, before T042's captures), with every entry in the answer key. Keys are linear unless stated, so these layers aren't skill 2 candidates, and no Opacity on a skill 3 layer goes between 0 and 100 (use 20 → 100), so none is a skill 1 candidate (spec 009 FR-003); this applies to T041's Badge too:
  - The **first layers group** is T041's Dot 1, Dot 2 and Dot 3, each with **two** animated properties (Position and Opacity) whose first moves start at 0.5 s. Dot 1's Position is **hold then ramp**: a hold key at 0 s, a jump at 0.5 s, then a ramp to 1.5 s (its start is the jump at 0.5 s). Dot 2 also has an **effect key** pair (Gaussian Blur's Blurriness) starting at 0.5 s. Dot 3's Position is **separated**, with X and Y both keyed from 0.5 s.
  - A **second layers group** for reviews and evals on other layers: "Chip A", "Chip B", "Chip C", each Position and Opacity starting at 2 s.
  - No other layer's first key is at 0.5 s or 2 s (Blink, Spinner, Cut, Card, Badge, Flag, Pause), so nothing else joins either group (spec 009 teaching-design § 14, C-3, for skill 1's layers). Cut is built eased, as Blink is (C-3).
  The answer key lists, per new layer, its timing measures (moves, starts, landings) and its easing pair states
- [ ] T065 [US1] After T042: add to `mentor/test/timing.test.mjs` the checks for T064's layers from `practice2-expected.json` (30 and 60 fps): Dot 1's start is 0.5 s from the hold jump, Dot 2's effect key counts in its start, Dot 3's X and Y read as one Position unit, the Dots share a start in `starts_by_frame` and so do the Chips, and no other layer's start shares a frame with either group; T043's easing check covers the new layers

**Checkpoint**: T058 to T065 pass; easing's output on Mentor Practice is unchanged (T004).

---

## Phase 6: User Story 6 — Easing still holds, and the hand-over (P1)

**Purpose**: prove FR-035 and SC-004 on the branch, and leave the parallel builders a working
contract.

- [x] T044 [US6] Run `cd mentor && npm test` and `node --test .claude/hooks/test/`: all green, T001's count plus the new tests, no existing test edited (`git diff --stat main -- mentor/test/*.test.mjs` shows only new files)
- [x] T045 [US6] Run `node .claude/hooks/check-branch.mjs <this branch> skill-builder main --shared-owner`: every changed file is the skill-builder's, and the list of changed existing files matches this file's table exactly. Paste the output in the hand-back
- [ ] T046 [US6] Hand back to the cockpit for the easing eval run (eval engineer, `node product/evals/easing/run.mjs`, about $12): expect 25/25 or 24/25 with no hard-rule failure (FR-035, SC-003). If a case drops because of T021's wording or T036's extra fields, fix it on this branch before merge (plan › Risks)
- [ ] T047 [US6] Quickstart › 5 (🖐, Claude Code, a temp `AE_MENTOR_HOME` with `easing-learned` copied in): `/next-mentor` answers in at most two sentences with no IDs; asking for an unbuilt skill says it isn't ready and starts nothing. Note the result in the hand-back
- [x] T048 [US6] Write the hand-back for the cockpit: the branch and commit; the changed-files table with any difference from this file's; test counts; the T042 host values and the beta finding; anything specs 008 to 010 need that the contract doesn't give (as requests, not changes); and a reminder that `panel/lib/runtime.js` must link every `*-mentor` skill before new-skill evals run (plan › P3)

---

## Dependencies & execution order

- **Phase 1** → **Phase 2** (blocking) → Phases 3, 4, 5 → Phases 5b and 5c → **Phase 6**. Phase 5b
  (T049–T057) needs T017 (session) and T034 (record writes) done, and runs before T044–T048.
  Phase 5c: T058 → T059 with T040; T060 → T061 and T062 → T063 with T017 (write T060 and T062
  with T006, before the rewrite); T064 with T041, before T042; T065 after T042.
- Phases 3, 4 and 5 don't depend on each other except: T026 needs T033 (`isDue`); T017 adds
  `pastTargets` which T034 extends. Do Phase 4's T033 before T026, or stub `isDue` first.
- Within Phase 2: tests T004 to T008 first; then T009 → T010; T011 → T012; T014 → T015 → T017 →
  T019 → T020 → T021.
- 🖐 tasks T041, T064, T042 and T047 need AE and the lock; batch them in one sitting after Phase 5's
  pure tasks, with the cockpit off AE.
- After Phase 6 and the merge: the cockpit runs quickstart › 6 (add-only check), then starts specs
  008 to 010's builders in parallel (at most three Opus agents).

## Parallel opportunities (if more than one sitting)

Tests marked [P] in each phase can be written in any order. T022, T023, T024, T030, T031, T037,
T038 are all independent new files; so are T058, T060 and T062's test additions. With one builder this only means the order is free.

## Implementation strategy

1. **MVP of the shared branch:** Phases 1, 2 and 5's T040 (timing): enough for skills 2 and 1 to
   start (they need only the session, review mode, analysis exports and fixture twins) and skill 3
   (timing).
2. Then Phase 4 (reviews data), so each skill can ship its review mode in its first build (plan ›
   Wave C).
3. Then Phase 3 (path and recommendation) and `/next-mentor`.
4. Live tasks last, in one sitting; then Phase 6 and the hand-back.

Don't merge a partial branch: the parallel builders start only from the full merge, because
after it nothing shared can change without a new owner branch.

**Task count:** 65 (T001–T065): Setup 3, Foundational 18, US2 8, US3 7, US1 24 (7 in Phase 5, 9 in Phase 5b, 8 in Phase 5c), US6 5. Four are 🖐 live (T041, T064, T042, T047). T049–T057 were added 2026-10-20 for FR-038 and T058–T065 on 2026-10-21 for the skill specs' requests; both run before Phase 6 despite their numbers.
