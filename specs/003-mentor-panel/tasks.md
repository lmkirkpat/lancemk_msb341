---
description: "Task list for the mentor panel in After Effects"
---

# Tasks: Mentor Panel in After Effects

**Input**: Design documents from `specs/003-mentor-panel/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/mentor-adapter.md](contracts/mentor-adapter.md),
[contracts/button-requests.md](contracts/button-requests.md), [quickstart.md](quickstart.md)

**Tests**: included. The plan calls for `node:test` unit tests for everything in `panel/lib/`
(plan › Technical Context), and the constitution requires eval cases for new mentor inputs
(Principle III, research R10). Write each module's tests in the same task, before or with the
code.

**Organization**: tasks are grouped by user story so each story can be built and tested on its
own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: which user story the task belongs to (US1–US4)
- **🖐 Live**: needs After Effects open and the builder at the keyboard
- **💲**: spends real Claude usage (headless Claude Code runs)

## Path Conventions

From plan.md › Project Structure: `panel/` (new CEP extension: `lib/` pure CommonJS modules,
`test/`, `dev/`), `product/evals/easing/` (eval cases and runner), `discovery/usage-notes/`.
`mentor/`, `bridge/` and `.claude/skills/ease-mentor/` don't change, except `SKILL.md` if cases
17–20 fail (T027). Everything in `panel/lib/` is CommonJS with no dependencies and no DOM or CEP
calls, so it runs in CEP and under `node --test` (research R8).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: create the panel extension and install it next to the bridge.

- [ ] T001 Create `panel/`, `panel/lib/`, `panel/test/`, `panel/test/fixtures/`, `panel/dev/`, `panel/CSXS/`, and `panel/package.json` with `{ "name": "ae-mentor-panel", "version": "0.1.0", "private": true, "description": "AE Mentor panel (specs/003-mentor-panel).", "engines": { "node": ">=18" }, "scripts": { "test": "node --test test/" } }` (CommonJS, no dependencies)
- [ ] T002 [P] Write `panel/CSXS/manifest.xml` (research R4): `ExtensionBundleId="com.aementor.panel"`, `ExtensionBundleName="AE Mentor"`, one extension `com.aementor.panel.main`, host `AEFT` version `[18.0,99.9]`, `CSXS` 9.0, `MainPath` `./index.html`, `CEFCommandLine` `--enable-nodejs` and `--mixed-context` (as in `bridge/cep/CSXS/manifest.xml`), `UI` type `Panel`, menu name "AE Mentor", default size 340×720, minimum 260×400. Don't touch `bridge/`
- [ ] T003 [P] Write `panel/install.sh` and `panel/uninstall.sh` modeled on `bridge/install.sh` (research R3): symlink `panel/` to `~/Library/Application Support/Adobe/CEP/extensions/AEMentorPanel` (refuse if a non-symlink exists); set `PlayerDebugMode 1` for CSXS 9–14; find `claude` with `command -v claude` (exit with a plain error if missing); find `node` with `command -v node` (same); write `panel.json` = `{ "version": 1, "claude_path": <absolute>, "node_path": <absolute>, "repo_path": <repo root> }` to `${AE_MENTOR_HOME:-~/Library/Application Support/AEMentor}/panel.json` with mode 600; print paths with `~` for the home folder (R11). `uninstall.sh` removes the symlink and `panel.json` only, never `learner.json` or other AEMentor files
- [ ] T004 🖐 Check spawning from inside AE before building on it (research R3, R8): temporarily replace `panel/index.html` with a throwaway page whose script uses CEP's Node (`require("child_process")`) to spawn `claude --version` and `node --version` with `cwd` = `repo_path` and `PATH` = `dirname(claude_path):dirname(node_path):/usr/bin:/bin:/usr/sbin:/sbin` from `panel.json`, and shows each command's stdout, exit code, `process.version`, and whether `crypto.randomUUID` exists. Run `bash panel/install.sh`, restart AE, open Window > Extensions > AE Mentor. Record the results in `specs/003-mentor-panel/research.md` › R8 under "CEP check". If `crypto.randomUUID` is missing, T009 uses `crypto.randomBytes(16)` formatted as a v4 uuid. If either spawn fails, stop and fix `PATH` handling before T009

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the spike that confirms R1, and the adapter seam every story uses.

**⚠️ CRITICAL**: T005 decides how the adapter runs Claude Code. Finish it before T008–T009.

- [ ] T005 💲 Spike (research R1, at most half a day): write a first `panel/dev/drive.js` that spawns `claude` with the launch arguments in `contracts/mentor-adapter.md` › Launch arguments, `cwd` = repo root, and the eval runner's fixture env (`AE_MENTOR_HOME` = a temp folder, `AE_MENTOR_FIXTURE_STATE` = a state file naming `before`, as `product/evals/easing/run.mjs` does around line 284). Send `/ease-mentor` as the first stdin line, then `Show me how first.`, then switch the state file to `after-demo` and send `I'm done. Check my work.` Confirm and write down in `specs/003-mentor-panel/research.md` › R1 under a new "Spike result" heading: (a) the exact stdin line format for a user message, (b) whether `/ease-mentor` on stdin starts the skill, (c) which stream lines carry text deltas, tool calls, tool results (including the `preview_frame` image block) and the `result` with `total_cost_usd`, (d) seconds from send to first text delta for each turn, (e) whether one process handles several turns. Save the raw stdout of each turn to `panel/test/fixtures/stream-opening.jsonl`, `stream-show-me.jsonl`, `stream-check.jsonl`, with the home folder replaced by `~` and session ids replaced by `00000000-0000-0000-0000-000000000000`. **If (b) or (e) fails**, record that the adapter falls back to one `claude -p <text> --resume <id>` process per turn (R1 alternative) and use that in T009
- [ ] T006 [P] Write `panel/lib/config.js` and `panel/test/config.test.js` (data-model › Panel config): `loadConfig({ home, fs })` returns `{ ok: true, claude_path, repo_path }` or `{ ok: false, fix }`. Fails with a plain `fix` message when the file is missing ("Run `bash panel/install.sh` from the repo, then reopen the panel."), is not JSON, has `version` other than 1, `claude_path` or `node_path` doesn't exist or isn't executable, or `repo_path` has no `.mcp.json`. Returns `node_path` too. `home` defaults to `AE_MENTOR_HOME` or `~/Library/Application Support/AEMentor`
- [ ] T007 [P] Write `panel/lib/requests.js` and `panel/test/requests.test.js` exporting the table in `contracts/button-requests.md` exactly: for each kind (`start`, `continue`, `show_me`, `show_me_again`, `check`, `hint`) its `label` and `request` string, plus `visibleKinds(lessonView, { lessonOpen, canContinue })` implementing the "Shown when" column (`show_me` only when `demo_made` is false; `show_me_again` only when it's true; `hint` only after at least one check). Test that no request string contains "rest", "all of it" or "for me" (FR-006)
- [ ] T008 Write `panel/lib/stream.js` and `panel/test/stream.test.js`: `createStreamParser()` takes stdout chunks, splits on newlines (keeping a partial last line), JSON-parses each line, and emits the adapter events from `contracts/mentor-adapter.md` › Claude Code stream mapping (`text_delta`, `text`, `tool_call`, `tool_result` with `json` when the text parses and `images` as `{ data, mimeType }`, `turn_end` with `cost_usd` from `total_cost_usd`). Strip the `mcp__ae-mentor__` prefix from tool names and match each `tool_result` to its call by id. A non-JSON line emits `error { kind: "bad_stream" }` and is skipped. A `result` with `is_error` whose text mentions login or authentication emits `error { kind: "not_signed_in" }`. Test against the T005 fixture files
- [ ] T009 Write `panel/lib/adapter-claude-code.js` and `panel/test/adapter.test.js` implementing `contracts/mentor-adapter.md` › Interface with injected `spawn` and `now`: `start({ resumeSessionId })` returns a new uuid (`crypto.randomUUID`, or the T004 fallback) or the resumed one and spawns with `--session-id` or `--resume`, `cwd` = `repo_path`, and `env` = the panel's environment with `PATH` = `dirname(claude_path):dirname(node_path):/usr/bin:/bin:/usr/sbin:/sbin` (contract › Launch arguments; test that `PATH` is set this way); `send(text, kind)` writes one stdin line in the T005 format, emits `turn_start`, and throws an error with `code: "BUSY"` while a turn is in flight; `turn_end` carries `wait_ms` (send to first `text_delta`, null if none), `first_event_ms` (send to the first `text_delta` or `tool_call`, null if none) and `total_ms`; a 5-minute timeout emits `error { kind: "timeout" }` and `turn_end { ok: false }`; process exit mid-turn emits `error { kind: "process_exited" }`, `turn_end { ok: false }` and `exit`; spawn failure emits `error { kind: "start_failed" }`; `stop()` kills the child and is safe to call twice. Use a fake child process in the tests. Assert the spawned argument list contains no tools beyond `ToolSearch` and the six `mcp__ae-mentor__*` tools (contract › Guarantees). If T005 chose the per-turn fallback, `send` spawns one process per turn with `-p` and keeps the same events
- [ ] T010 [P] Write `panel/lib/text.js` and `panel/test/text.test.js` (research R8): `renderMentorText(text)` returns an HTML string that escapes everything, then allows only paragraphs, `**bold**`, `*italics*`, `` `code` ``, and `-` / `1.` lists. Test that `<script>`, `<img onerror>`, and raw HTML come out escaped
- [ ] T011 [P] Write `panel/lib/turns.js` and `panel/test/turns.test.js` (data-model › Turn log): `appendTurn({ home, fs }, entry)` appends one JSON line `{ at, kind, wait_ms, first_event_ms, total_ms, cost_usd, ok, lesson_passed }` to `panel-turns.jsonl`; `kind` is one of `"start" | "check" | "hint" | "show_me" | "show_me_again" | "ask" | "continue"`; never logs message text; never throws (a logging failure must not break a lesson)

**Checkpoint**: `cd panel && npm test` passes, and `node panel/dev/drive.js` runs a three-turn fixture lesson through the real adapter.

---

## Phase 3: User Story 1 - Take an easing lesson without leaving After Effects (Priority: P1) 🎯 MVP

**Goal**: quickstart steps a–f run entirely in the panel.

**Independent Test**: quickstart §4 on the Mentor Practice comp with nothing typed in a terminal;
each check list matches what's eased in AE.

- [ ] T012 [P] [US1] Write `panel/lib/lesson.js` and `panel/test/lesson.test.js` (data-model › LessonView, CheckList): `reduceLesson(view, event)` updates `demo_made` (a `tool_result` for `set_ease` with `ok: true`), `checks` and `passed` (an ok `diff_since_last` result with `comp_matches: true`), `check_list`, and `recorded` (an ok `record_lesson` result). Check list rows map `eased_by_learner` → "you ✓", `eased_by_demo` → "demo (mentor)", `still_linear` → "linear ✗", any other value → "not checked" (never a pass); `unexpected_changes` go to `outside[]`; summary reads "N of M yours eased · K still linear" from `summary`. A result with `comp_matches: false` or `ok: false` (for example `AE_UNREACHABLE`, `AE_BUSY`) never replaces `check_list`; it sets `check_list.stale = true` so the panel greys it as "from your last check". Test with the T005 `stream-check.jsonl` fixture and hand-written results for partial, outside-the-lesson, other-comp and unreachable
- [ ] T013 [US1] Write `panel/index.html` and `panel/panel.css` from `product/mockups/ae-panel.md` › Panel up close: a connection line, a scrollable conversation (learner, mentor and notice messages; frames under their message), the check list block, the button row, the Ask the mentor input, and empty containers for stage, path and memory (filled in US2 and US3). AE dark colors as CSS variables; one column; long text wraps; no horizontal scroll at the 260 px minimum width (edge case: narrow panel). Load `main.js` with a plain script tag
- [ ] T014 [US1] Write `panel/main.js` (DOM wiring only, no teaching logic, FR-013): on load, `loadConfig` (a failure shows the `fix` as a notice and nothing starts, FR-015); **Start lesson** calls `adapter.start()` then `send(requests.start)`; buttons from `visibleKinds` send their fixed request but the conversation shows the **label** (data-model › DisplayMessage); the Ask input sends the typed text as `ask`; `text_delta` appends to the current mentor message and `text` replaces it with `renderMentorText`; `tool_result.images` render as `data:` URIs under the current mentor message (FR-004); every event goes through `reduceLesson`, and the check list and button labels re-render from the view (FR-006, FR-007); while a turn is in flight, show a working indicator and disable buttons and input (FR-012); `error` events show plain notices (map `not_signed_in` to "Claude Code isn't signed in. Open Terminal and run `claude` once to sign in."); `window` `beforeunload` calls `adapter.stop()`. Never show tool names, field names or raw JSON (FR-017)
- [ ] T015 [US1] Wire `appendTurn` into `panel/main.js` on every `turn_end` with the turn's `kind`, `wait_ms`, `first_event_ms`, `total_ms`, `cost_usd`, `ok`, and `lesson_passed` (true when this turn's `reduceLesson` changed `passed` to true) (research R9)
- [ ] T016 [US1] Create `discovery/usage-notes/mentor-panel.md` in the shape of `discovery/usage-notes/easing-slice.md`: a session log, a steps table (a–f), an SC-002 checks table (#, lesson, attempt type, what I did, panel list, my verdict in the Graph Editor, agree?), an SC-004 table, and an SC-008 section
- [ ] T017 🖐 💲 [US1] Run `bash panel/install.sh`, restart AE, and run quickstart §1 and §4 (steps a–f) on the Mentor Practice comp without typing in a terminal (SC-001). Log each step and every check in `discovery/usage-notes/mentor-panel.md`. Confirm Show me again changed nothing in AE (SC-003). Fix what breaks in `panel/` and note the fix

**Checkpoint**: the MVP. A lesson runs end to end in the panel.

---

## Phase 4: User Story 2 - See where I am in the lesson and the path (Priority: P2)

**Goal**: the stage indicator and the learning path show progress from data, not wording.

**Independent Test**: during a panel lesson, the stage and path match what happened and the
learner record (spec › US2).

- [ ] T018 [P] [US2] Add `stageOf(view)` to `panel/lib/lesson.js` with tests in `panel/test/lesson.test.js` implementing data-model › Lesson stage in order: `passed` → `"done"`; `checks > 0` → `"you_do"`; `demo_made` → `"we_do"`; otherwise `"i_do"`. When `checks > 0` and `demo_made` is false, mark "I do" as skipped (–), not done
- [ ] T019 [P] [US2] Write `panel/lib/path.js` and `panel/test/path.test.js` (data-model › Path view): the fixed list Keyframes (no skill id, not teachable, always "done (assumed)"), Easing (`easing.basic`, done if the record's `skills["easing.basic"].status` is `"learned"` or the current lesson `passed`, else current), Graph Editor (next once Easing is done, else upcoming), Bounce (upcoming). Takes the parsed learner record (or null) and the LessonView
- [ ] T020 [US2] Render the stage indicator (I do ━ We do ━ You do with ✓ ● ○ –) and the path row in `panel/index.html`, `panel/panel.css` and `panel/main.js`, re-rendered after every event and on open (US2-4 shows the path before any lesson starts)

**Checkpoint**: US1 and US2 work together.

---

## Phase 5: User Story 3 - See what the mentor remembers (Priority: P2)

**Goal**: a read-only memory section that matches the learner record.

**Independent Test**: compare the memory section with `learner.json` for no record, one lesson,
and two lessons (SC-006).

- [ ] T021 [P] [US3] Write `panel/lib/memory.js` and `panel/test/memory.test.js` (data-model › Memory view): `readLearnerRecord({ home, fs })` returns the parsed file or null (missing or unreadable); `memoryView(record)` returns the last lesson's date as "Oct 3" style, the skill in plain words (`easing.basic` → "Easing"), the result (`passed` → "passed ✓", `partial` → "not finished", `not_checked` → "not checked"), and next (`skills[skill].next`, else `lessons[-1].next`). No file or empty `lessons` → "No lessons yet."; `version` other than 1 → "Memory format not recognised" with nothing else. Never output field names (FR-017). The module only reads (constitution 1.1.0 › II)
- [ ] T022 [US3] Render the memory section in `panel/index.html`, `panel/panel.css` and `panel/main.js`: read on open, re-read after a `tool_result` for `record_lesson` with `ok: true` (US3-3), and also re-render the path (T020). No edit controls (US3-4)
- [ ] T023 🖐 [US3] Check SC-006: with `learner.json` backed up and removed, then after one panel lesson, then after a second, compare the memory section with the file each time. Log in `discovery/usage-notes/mentor-panel.md`

**Checkpoint**: US1–US3 work together.

---

## Phase 6: User Story 4 - The panel's buttons are evaluated (Priority: P3)

**Goal**: the mentor teaches well when asked by the panel's exact requests.

**Independent Test**: run the eval set, including cases 17–20, without AE open.

- [ ] T024 [P] [US4] Add `product/evals/easing/cases/17-button-check-partial.json`, `18-button-hint.json`, `19-button-show-me.json`, `20-button-show-me-again.json` per `contracts/button-requests.md` › Eval cases, in the format of the existing cases (see `07-partial-attempt.json` and `14-demo-again.json`). Use the existing fixtures (`before`, `after-demo`, `partial`). Each case's last turn `say` is the exact `request` string from `panel/lib/requests.js`. Expectations: 17 `tools_called` includes `diff_since_last`, verdict fail, no new `set_ease`; 18 no `set_ease` and no `record_lesson`; 19 `set_ease_max: 1` and `set_ease_only_on` the demo target; 20 `set_ease_max: 1` across the case and the new `preview_frame_this_turn: true`. Rubric ids as in the contract
- [ ] T025 [US4] Add the `preview_frame_this_turn` expectation to `product/evals/easing/run.mjs`: passes when the last turn's events include an ok `preview_frame` tool call. Include it in `--dry-run` validation of `expect` keys and in `product/evals/easing/README.md`
- [ ] T026 [P] [US4] Write `panel/test/requests-eval-sync.test.js`: for cases 17–20, read the JSON from `product/evals/easing/cases/` and assert the last turn's `say` equals the matching `request` in `panel/lib/requests.js` (research R10)
- [ ] T027 💲 [US4] Run `node product/evals/easing/run.mjs --dry-run`, then `--only 17`, `--only 18`, `--only 19`, `--only 20`. If a case fails on teaching (not on the case file), fix `.claude/skills/ease-mentor/SKILL.md` and re-run it. Then one full run; ask the builder before committing its results file (constitution V). Record pass rate and cost in `discovery/usage-notes/easing-slice.md` › evals table (SC-007: ≥ 80% overall, cases 01–16 at their previous rate or better)

**Checkpoint**: all four stories done.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: continue after reopening (FR-016), edge cases, speed and cost numbers, docs.

- [ ] T028 [P] Write `panel/lib/bridge-status.js` and `panel/test/bridge-status.test.js` (research R6): `bridgeStarted({ fs, http })` reads `~/Library/Application Support/AEMentorBridge/bridge.json` (port and token), calls `GET /health` with `Authorization: Bearer <token>` and a 2-second timeout, and returns the response's `started` value or null on any failure. It calls nothing else on the bridge (constitution 1.1.0 › II). Use a fake `http` in tests
- [ ] T029 [P] Write `panel/lib/panel-session.js` and `panel/test/panel-session.test.js` (data-model › Panel session): read and write `panel-session.json` atomically (temp file and rename, like `mentor/lib/session.mjs`) with fields `version: 1`, `claude_session_id`, `bridge_started`, `started_at`, `updated_at`, `ended`, `lesson` (LessonView), `messages` (`{ role: "learner" | "mentor" | "notice", text, frames: string[] }`); `saveFrame({ home, fs }, image)` writes a base64 image to `AEMentor/panel-frames/frame-<time>.png` and returns the path; `canContinue(saved, bridgeStartedNow)` is true only when `saved.ended` is false and `saved.bridge_started` is non-null and equals `bridgeStartedNow`. A new lesson replaces the file
- [ ] T030 Wire continue into `panel/main.js` (FR-016): save the panel session after every event (frames saved with `saveFrame`; set `ended` on an ok `record_lesson` result or when the learner starts a new lesson); on open, if `canContinue`, show **Continue lesson** and **New lesson**; Continue redraws messages and frames from the file (a missing frame shows "frame no longer available"), restores the LessonView, calls `adapter.start({ resumeSessionId })`, and sends `requests.continue`; New lesson clears the file and shows Start lesson
- [ ] T031 [P] Write `panel/dev/turns.js`: read `panel-turns.jsonl` and print the number of turns, the share with `wait_ms` ≤ 10000 (SC-004 target: at least 90%), the median and worst `wait_ms`, the median `first_event_ms` (context only, not SC-004), total and per-lesson `cost_usd`, and each lesson's duration from its `start` to the first turn with `lesson_passed: true` (SC-005: at most 15 minutes; "not passed" if none). A lesson starts at each `start` and continues through `continue` turns. Print `~` for the home folder
- [ ] T032 Finish `panel/dev/drive.js` from the T005 spike into the tool in quickstart §3: `--fixture <name>` (fixture mode with a temp `AE_MENTOR_HOME`) or live; prints each adapter event on one line; reads `check`, `hint`, `show_me`, `show_me_again`, `quit` or free text from stdin; uses the real `panel/lib/adapter-claude-code.js`
- [ ] T033 🖐 💲 Run quickstart §6 (edge cases) and log each row's result in `discovery/usage-notes/mentor-panel.md`. Fix what fails
- [ ] T034 🖐 💲 Over at least 2 panel lessons, reach 10 logged checks for SC-002 (at least 3 partial, 2 outside the lesson, 1 undone), run `node panel/dev/turns.js` for SC-004, SC-005 and cost, count ok `set_ease` calls per lesson in `AEMentor/calls.jsonl` for every panel lesson (SC-003: at most 1 each, and none after a Show me again), and write the SC-008 note (did the panel change how I learn compared with the terminal; did I reach for Adobe's assistant). If SC-004 fails, add a line to `decisions/005` › What would change our mind with the measured numbers
- [ ] T035 [P] Privacy sweep (constitution IV, FR-018): search `panel/test/fixtures/`, `discovery/usage-notes/mentor-panel.md` and `product/evals/easing/cases/17-*` to `20-*` for email and phone patterns, the home folder path, and real names. Fix anything found
- [ ] T036 [P] Update `CLAUDE.md` (Where to see it: the panel and `bash panel/install.sh`; Stack: `panel/`; Current state) and `README.md` (Where to see it), and correct `specs/003-mentor-panel/quickstart.md` with anything the live runs changed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none. T002 and T003 run in parallel after T001. T004 (CEP check) needs T002
  and T003, and must pass before T009.
- **Foundational (Phase 2)**: T005 (spike) first. T006, T007, T010, T011 can run alongside T005.
  T008 needs T005's fixtures. T009 needs T005's decision and T008.
- **US1 (Phase 3)**: needs Phase 2. T012 can start once T008 is done. T013 → T014 → T015 → T017.
  T016 any time before T017.
- **US2 (Phase 4)**: needs T012 (LessonView) and T014 (rendering). T018 and T019 in parallel.
- **US3 (Phase 5)**: needs T014. Independent of US2 except that T022 re-renders the path from T020.
- **US4 (Phase 6)**: needs only T007 (`requests.js`). Can run in parallel with US1–US3.
- **Polish (Phase 7)**: T028 and T029 any time after Phase 2. T030 needs T014 and T029. T033 and
  T034 need everything above.

### User Story Dependencies

```text
Phase 1 ─▶ Phase 2 ─┬─▶ US1 (P1) ─┬─▶ US2 (P2)
                    │             └─▶ US3 (P2)
                    └─▶ US4 (P3, needs only requests.js)
                                         ▼
                                  Phase 7 (continue, edge cases, numbers)
```

### Within Each Story

- Pure modules and their tests (`panel/lib/`) before DOM wiring (`main.js`).
- Wiring before the live run.
- Live (🖐) tasks last in each phase.

---

## Parallel Examples

### Phase 2

```text
Alongside T005 (spike):
  T006 config.js + test
  T007 requests.js + test
  T010 text.js + test
  T011 turns.js + test
```

### US1–US4

```text
After T012:
  T018 stage (US2)        T019 path.js (US2)        T021 memory.js (US3)
Any time after T007:
  T024 eval cases (US4)   T026 sync test (US4)
Any time after Phase 2:
  T028 bridge-status.js   T029 panel-session.js     T031 dev/turns.js
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (including the T004 check inside AE) and the T005 spike. If the spike shows the long-lived process doesn't work, switch to
   the per-turn fallback before writing T009.
2. Phase 2, then US1 (T012–T017).
3. **Stop and validate**: one full a–f lesson in the panel with nothing typed in a terminal. This
   alone meets the sprint's raised goal except memory.

### Incremental Delivery

1. MVP (US1).
2. US3 (memory). The sprint's done list names it, so do it before US2 if time is short.
3. US2 (stage and path).
4. US4 (button evals) can run in parallel any time after T007. It must pass before the sprint ends.
5. Phase 7: continue after reopening, edge cases, SC-002/SC-004/SC-008 numbers, docs.

### Sprint fit (about a week left)

The sprint's done list needs: T001–T017 (lesson in the panel), T021–T023 (memory), T024–T027
(evals stay ≥ 80%), and the usage notes (T034). US2 and FR-016 (T018–T020, T028–T030) are in the
spec but not the sprint's done list. If time runs short, they're the first to move to the next
sprint. Spec 003 isn't complete until they're done too. Track any left over in the Sprint 3 plan.
