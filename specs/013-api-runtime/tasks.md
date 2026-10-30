---
description: "Task list for spec 013: the option A runtime"
---

# Tasks: Option A Runtime (the Panel Calls the Claude API Directly)

**Status**: Tasked 2026-10-30. Spec, plan and the preamble (plan.md › The preamble) approved by the
builder 2026-10-30. The helper stays at `panel/helper/` (panel-builder) until the UXP rebuild.

**Input**: Design documents from `specs/013-api-runtime/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/helper-protocol.md](contracts/helper-protocol.md),
[contracts/eval-runtime.md](contracts/eval-runtime.md), [quickstart.md](quickstart.md); spec 003's
[mentor-adapter.md](../003-mentor-panel/contracts/mentor-adapter.md).

**Starts after**: `decisions/010` is on `main` (the cockpit's). T001 runs first and alone; T006
waits for it.

**Tests**: included and written first where the spec asks for an automated check (FR-016, FR-031,
SC-005 to SC-009).

## Format: `[ID] [P?] [Story?] Owner · Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks).
- **[US1]…[US6]**: the spec's user stories.
- **Owner** (`decisions/007`, `.claude/hooks/ownership.json`): **PB** panel-builder (`panel/**`,
  including the helper at `panel/helper/`, plan › Who owns the helper); **EE** eval-engineer
  (`product/evals/**`); **SB** skill-builder (`mentor/**`, `SKILL.md`; only if the comparison finds
  a gap); **Builder** (the human: live lessons, reading messages, Keychain, console); **Cockpit**.
- **🖐 AE**: needs After Effects 26.5 on the builder's Mac and the AE lock (`decisions/008`). One
  sitting at a time: run `ae_status` and check `.git/knack-agents/ae.lock.json` has no other holder
  from the last 10 minutes. Everything else runs without AE (fixture mode or a fake service).
- **$**: spends on the Claude API; amounts from spec Q4.
- **Ticking tasks**: panel-builder and skill-builder may tick this file (`ownership.json`); the
  eval-engineer can't write it, so it hands back its task IDs and the cockpit ticks them.

---

## Phase 1: Setup

- [x] T001 EE · Find what the 2026-10-29 B1 runs used, per research R2, before any A setting: the model (from the `message.model` of the 10-29 eval sessions under `~/.claude/projects/`, then one fresh `node product/evals/easing/run.mjs --only 01` with `--verbose` output read for the `init` message's `model` and the result's `modelUsage`), the effort (Claude Code's effective setting and version), the judge's model and effort, and the thinking display if a debug log shows it. Write them in a new `product/evals/README.md` › Runtimes and in the hand-back. If B1 wasn't on Opus 5.5, say so in the hand-back so the cockpit asks the builder before T006. ($ about $0.50)
- [x] T002 [P] PB · Create `panel/helper/package.json` (`"type": "module"`, `"private": true`, `"engines": { "node": ">=18" }`, `"test": "node --test test/"`) with `@anthropic-ai/sdk` at one exact version (no `^` or `~`), run `npm install` once to write `panel/helper/package-lock.json`, and confirm `git status` shows no `node_modules/` (the root `.gitignore` covers it) (research R3).
- [x] T003 [P] PB · Add `panel/helper/prices.json` with research R13's table, `"checked": "2026-10-30"`, Haiku 5.5's `long_prompt` row, and Haiku 5.5's cache-read price checked against the pricing page (R13 **verify**); add `panel/helper/preamble.md` holding exactly plan.md › The preamble's text, nothing else (FR-012).
- [x] T004 PB · In `panel/install.sh`, run `npm ci` in `panel/helper/` with the found `node`'s npm, and keep an existing `runtime` field when rewriting `panel.json` (today the script overwrites the file); `panel/uninstall.sh` unchanged (spec 006 owns learner uninstall).

---

## Phase 2: Foundational (the helper core, blocks every story)

**Purpose**: a helper that runs one lesson end to end against a fake service and the real `ae-mentor` in fixture mode, speaking contracts/helper-protocol.md. US1 and US2 both build on it.

- [ ] T005 [P] PB · Write `panel/helper/test/fake-service.mjs`: a local HTTP server that speaks the Messages API's streaming events from scripted responses (text, `tool_use`, thinking blocks, usage with cache counts, `stop_reason` `refusal`, 401, 403, 429, 529, a billing error, a dropped connection, a different response `model`), and records each request body; the SDK points at it through `baseURL` in tests only.
- [ ] T006 PB · Write `panel/helper/settings.json` per data-model › Runtime settings (`"model": "claude-opus-5-5"`, `"effort"` = T001's finding, `"cache_ttl": "5m"`, `"skill_placement": "system"`, `"max_steps": 12`, `"turn_timeout_ms": 300000`, `"fallbacks": "default"`) as the one place for these settings (FR-028), and `panel/helper/lib/settings.mjs` (load, validate: "Other versions refused", the model "Must have a row in the price table, else the helper refuses to start", settings hash over `settings.json`, `preamble.md`, `main.mjs` and `lib/`), with `test/settings.test.mjs` first. Depends on T001, T003.
- [ ] T007 [P] PB · Test first (`test/skills.test.mjs`), then `panel/helper/lib/skills.mjs`: given a skills folder and a name, accept only names matching `/^[a-z0-9][a-z0-9-]*-mentor$/` (the pattern in `panel/lib/runtime.js`), return `allowed-tools` from the frontmatter with `mcp__ae-mentor__` removed (keep `Skill` as is) and the body as the exact bytes after the closing `---` line; test against all six real `SKILL.md` files plus `next-mentor` (FR-010, FR-017).
- [ ] T008 [P] PB · Test first (`test/mcp-client.test.mjs`, against the real `mentor/server.mjs` with `AE_MENTOR_FIXTURE_STATE`), then `panel/helper/lib/mcp-client.mjs` per research R4: read the `ae-mentor` entry of a given `.mcp.json`, run `"node"` as `process.execPath`, resolve script paths against that file's folder, spawn with only `PATH=/usr/bin:/bin:/usr/sbin:/sbin`, `HOME`, `TZ`, `AE_MENTOR_HOME` and the passed `AE_MENTOR_*` variables; `initialize` (keep `instructions`), `notifications/initialized`, `tools/list`, `tools/call` returning content parts and `isError` whole; report exit; restart on demand. A test asserts the child's environment has no key-shaped value and no `ANTHROPIC_*` variable (FR-004, FR-009, FR-011, FR-019).
- [ ] T009 [P] PB · Test first (`test/cost.test.mjs`), then `panel/helper/lib/cost.mjs`: cost from token counts by kind (input, cache write at the 5m or 1h rate, cache read, output) and `prices.json`, Haiku's long-prompt prices above 100K prompt tokens, `null` when the model or a price is missing, never 0 (FR-026).
- [ ] T010 [P] PB · Test first (`test/errors.test.mjs`), then `panel/helper/lib/errors.mjs`: research R10's table from SDK error classes and stop reasons to kinds, the fixed messages in contracts/helper-protocol.md › Error kinds, and `scrub(text)` replacing anything shaped like `sk-ant-[A-Za-z0-9_-]{10,}` before any log line (FR-021, FR-027). The billing row's matcher is provisional until T038.
- [ ] T011 [P] PB · Test first (`test/key.test.mjs`, with a faked `security` runner), then `panel/helper/lib/key.mjs`: read the Keychain item (service `Knack`, account `anthropic-api-key`) with `/usr/bin/security find-generic-password -s Knack -a anthropic-api-key -w`, or take the `key` from the `start` command (evals); return nothing (not throw) when missing; delete `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_PROFILE`, `ANTHROPIC_BASE_URL` from the helper's own `process.env` at start (research R3, R11; FR-018, FR-019, FR-038).
- [ ] T012 PB · Test first (`test/prompt.test.mjs`), then `panel/helper/lib/prompt.mjs` per research R5: tools = the server's list in its order filtered by the skill's `allowed-tools`, as `{ name, description, input_schema }`, plus a `Skill` tool (`{ skill, args? }`) only when listed; system = preamble, server instructions, skill body as three text blocks, cache breakpoint on the last (FR-025); `skill_placement: "message"` puts the body ahead of the first learner text instead; no date, time, path or id anywhere; `prompt_hash`. Tests: byte-for-byte skill body, identical output on two calls, an unlisted tool absent, both placements (FR-005, FR-010–FR-013, FR-016). Depends on T006–T008.
- [ ] T013 [P] PB · Test first, then `panel/helper/lib/request-log.mjs`: append each request body as one JSON line when a `request_log` path was given, with the key absent and image `data` replaced by its length (SC-008 input for T023).
- [ ] T014 PB · Test first (`test/loop.test.mjs` with T005's fake service and the real server in fixture mode), then `panel/helper/lib/loop.mjs`: one turn = up to `max_steps` streamed requests with `output_config.effort`, the cache breakpoint on the newest message's last block (FR-025, `cache_ttl` from settings), and `fallbacks` when set (with the `server-side-fallback-2026-07-01` beta; `null` forced on Haiku 5.5, research R10); map stream events to `text_delta`, `text`, `tool_call` (then `input`), `tool_result` per research R9; run only allowed tools, answering any other with an `is_error` result "That tool isn't available in this lesson." and logging the name; return tool results whole (text, images, `is_error`); thinking blocks kept in history, never emitted; history append-only (a test compares each request's messages prefix with the previous request's, byte for byte); the `Skill` hand-over per R5 (mid-conversation system message, tool swap, no edit to earlier messages; only `*-mentor` skills); step limit → `turn_end { ok: false }` with no `error`; 5-minute timeout → `error timeout`; refusal → `error refused` with its category logged; `other_model` when the response model differs (FR-005, FR-006, FR-007, FR-008, FR-014, FR-015, FR-022, FR-025, FR-029). Depends on T005, T009, T010, T012, T013.
- [ ] T015 PB · Write `panel/helper/main.mjs` per contracts/helper-protocol.md: JSON-line commands `start` (fields `session_id`, `resume`, `home`, `mcp_config`, `skills_dir`, `fixture_env`, `key`, `request_log`, `settings_file`), `send`, `stop`, `key_check` (stub until T037); `ready` with `settings_hash`; `busy` refusal; `turn_end` fields from data-model › Turn log; no event or log ever holds the key. `settings_file` defaults to `panel/helper/settings.json`; another file is for eval experiments only (T051) and is reported in `ready`. Protocol test `test/main.test.mjs`: a fixture lesson on easing end to end with the fake service, and `stop` leaves no helper or `ae-mentor` process. Depends on T011, T014.
- [ ] T016 PB · Write `panel/helper/dev/chat.mjs` (FR-039, builder-only, not installed for learners): a terminal chat over `main.mjs` with `--skill <name>-mentor [args]`, `--home`, `--key-check`, printing the mentor's words and one line per tool call, using the Keychain key; with `--fixture <file>` it runs on `ae-mentor`'s fixture mode. Smoke check by the builder: one easing turn on a fixture with the real service ($ under $0.20).

**Checkpoint**: `cd panel/helper && npm test` passes; a fixture easing lesson runs through `chat.mjs` on the real service.

---

## Phase 3: User Story 1 - The builder takes a full lesson in the panel on option A (P1) 🎯 MVP

**Goal**: spec 003's quickstart a–f in the panel on A, no Claude Code running.

**Independent test**: quickstart.md §5, SC-001.

- [ ] T017 [P] [US1] PB · Test first (`panel/test/config.test.js`), then `panel/lib/config.js`: optional `runtime` (`"b1"` | `"a"`); missing → `"b1"` (FR-037); on `"a"`, `claude_path` isn't required and its check is skipped, `node_path` and `repo_path` still are; existing B1 validation and messages unchanged.
- [ ] T018 [P] [US1] PB · Test first (`panel/test/adapter-api.test.js` with a fake helper process), then `panel/lib/adapter-api.js`: same exports and interface as `adapter-claude-code.js`; spawn `node_path panel/helper/main.mjs` with `cwd` `panel/helper/` and only `PATH`, `HOME`, `TZ`; send `start` with `mcp_config` = `<repo>/.mcp.json`, `skills_dir` = `<repo>/.claude/skills`, `home`; re-emit the helper's events; time `wait_ms` and `first_event_ms` itself from `send` as B1 does; `BUSY` while a turn is in flight; `start_ms` (spawn to the helper's `ready`) carried on the lesson's first `turn_end`, for `decisions/010`'s 2-second start-up signal; `stop()` leaves no process; helper exit mid-turn → `error process_exited` + `turn_end { ok: false }`. CommonJS, no dependencies (FR-001, FR-002, FR-003).
- [ ] T019 [US1] PB · In `panel/main.js`: choose `adapter-api.js` when `cfg.runtime === "a"` and skip `ensureRuntime`; add the A kinds' messages from contracts/helper-protocol.md › Error kinds (on A, `start_failed` shows only its fixed message, no appended detail; B1's messages unchanged); no other change (FR-001, FR-027).
- [ ] T020 [US1] PB · Add `--runtime a` and `--fault <kind>` to `panel/dev/drive.js` (the fault flag points the helper at T005's fake service with that scripted fault; dev only).
- [ ] T021 [US1] 🖐 AE · Builder · With `"runtime": "a"`, no Claude Code process, and the AE lock: run quickstart.md §5 (spec 003 quickstart §4 a–f on Mentor Practice) three times; each check's list matches AE every time (SC-001). Log with `/usage-session` in `discovery/usage-notes/api-runtime.md`. ($ about $1.20) Depends on T016–T019.

**Checkpoint**: SC-001 met; the turn log has A lines for US5.

---

## Phase 4: User Story 2 - The evals run on option A and show it teaches the same as B1 (P1)

**Goal**: all six sets meet FR-033 on A (SC-003, SC-008). Starts after Phase 2; runs in parallel with Phase 3 (different owner, no AE).

**Independent test**: quickstart.md §4.

- [ ] T022 [P] [US2] EE · Test first (`product/evals/lib/test/runtime-a.test.mjs`, with a recorded helper event stream), then `product/evals/lib/runtime-a.mjs` per contracts/eval-runtime.md › Mentor turns on A: one helper per case, fixture state written per turn as today, events mapped to `{ kind: "say" }` and `{ kind: "tool", name, input, ok, result }`, a failed turn fails the case with check `run`, cost summed with `null` reported as unknown; `KNACK_EVAL_API_KEY` sent only in `start` and deleted from every child's environment, so the judge's `claude -p` runs exactly as today (FR-032).
- [ ] T023 [P] [US2] EE · Test first, then `product/evals/lib/allowlist-check.mjs` (SC-008, FR-016): derive the allowlist independently (read `panel/helper/preamble.md`, the server's `initialize` instructions and `tools/list` by starting `mentor/server.mjs` itself, the `*-mentor` `SKILL.md` bodies) and check every request in a request log: system blocks and tools only from those sources, messages only learner/panel text, tool results, tool uses and the model's own blocks; no text containing `CLAUDE.md`, sprint or eval-fixture paths, or anything from `~/.claude/`.
- [ ] T024 [US2] EE · In `product/evals/easing/run.mjs`: `--runtime a|b1` (default `b1`), `--settings <file>` (A only, recorded; a run with a non-default file can't become a baseline), A turns through T022, the allowlist check per case through T023, results fields per data-model › Eval results, the summary line and B1-baseline comparison per contracts/eval-runtime.md, `--changed`'s hash adding the helper's files on A runs only, `--dry-run` on A checking the helper starts with no service request; B1 path untouched (FR-030, FR-031, FR-033, FR-036). Depends on T015, T022, T023.
- [ ] T025 [P] [US2] EE · Same change as T024 in `product/evals/key-types/run.mjs`. Depends on T024.
- [ ] T026 [P] [US2] EE · Same change as T024 in `product/evals/speed-graph/run.mjs`. Depends on T024.
- [ ] T027 [P] [US2] EE · Same change as T024 in `product/evals/offset/run.mjs`. Depends on T024.
- [ ] T028 [P] [US2] EE · Same change as T024 in `product/evals/anchor/run.mjs`. Depends on T024.
- [ ] T029 [P] [US2] EE · Same change as T024 in `product/evals/null-parenting/run.mjs` (including `AE_MENTOR_FIXTURE_TWINS` where it's set today). Depends on T024.
- [ ] T030 [US2] EE · FR-031 shape test `product/evals/lib/test/transcript-shape.test.mjs`: run easing case 01 once on each runtime (recorded, then replayed in the test), and assert both transcripts have the same event kinds and fields and that `check()` and `renderTranscript()` accept both. While here, check research R4's watch item (one server per case on A vs. one per turn on B1) on one multi-turn case and note the result. ($ about $1) Depends on T024.
- [ ] T031 [US2] EE · Full easing run on A (`--runtime a`). Apply the stop rule (spec Q4): if more than 5 points below the B1 baseline (27/28, 2026-10-29), stop, triage with `/eval-triage`, and hand back before T032; the first suspect is the skill placement (R5), the second the thinking display (R7). ($ about $15)
- [ ] T032 [P] [US2] EE · Full A runs of key types, speed graph, offset, pivot (`anchor`) and null against their 2026-10-29 B1 baselines (29/30, 29/29, 33/37, 48/50, 42/44); the five can run as parallel processes. ($ about $70) Depends on T025–T029, T031 passing the stop rule.
- [ ] T033 [US2] EE · For every case that passed on B1 and failed on A: `--only <id> --repeat 3 --runtime a`; majority pass = noise; majority fail = regression, triaged (`/eval-triage`), with research R6's `read_learner_record` note checked for the five non-easing sets. ($ about $30)
- [ ] T034 [US2] EE · Write each set's `README.md` › Option A equivalence record per data-model › Equivalence record, and say whether the set meets FR-033.
- [ ] T035 [US2] SB or PB (by the gap) · Only if T033 finds a regression the builder doesn't accept: a placement or display change is PB's in `panel/helper/settings.json` (one setting, research R5), applied to all six sets; a prompt or tool gap is SB's in that `SKILL.md` or `mentor/` file, as its own change. No change to eval cases or rubrics.
- [ ] T036 [US2] EE · After any T035 change: re-run the affected set on B1 and on A on the same commit (FR-034; for a settings change, all six on A), and update T034's records. ($ depends)

**Checkpoint**: SC-003 met (all six), SC-008 met on every case.

---

## Phase 5: User Story 3 - A learner's access key works, stays secret, and its problems are explained (P2)

**Goal**: the key check, the seven faults' messages, no key anywhere.

**Independent test**: quickstart.md §3 and §8.

- [ ] T037 [P] [US3] PB · Test first, then the key check in `panel/helper/lib/key.mjs` and `main.mjs`'s `key_check`: one `models.retrieve(settings.model)` → `works` / `rejected` (401, 403) / `offline` / `no_key` (no request made); expose it in `dev/chat.mjs --key-check` (FR-020, research R11).
- [ ] T038 [US3] PB with Builder · Verify research R10's and R11's open items against the service: the error type and status for out of credit and for a workspace spend limit (the builder supplies a key from a workspace with its limit reached or credit exhausted, set up in the console), and whether any free request can tell `out_of_credit` from `works`; fix `errors.mjs`'s billing matcher and `key_status` accordingly, and add the real response shapes (scrubbed) to T005's fake service. Report the finding in the hand-back for the spec-writer to add to research. ($ none or cents)
- [ ] T039 [P] [US3] PB · `panel/helper/test/faults.test.mjs`: the 7 faults of SC-006 (no key, rejected key, out of credit, rate limited, overloaded, offline, `ae-mentor` can't start) through `main.mjs` with T005's fake service: each gives its kind, its fixed message, no `tool_result` for that turn, and no message containing a status code, a path, a tool name or the key; a dropped connection mid-answer saves nothing from that turn (spec › Edge Cases). Depends on T038 for the out-of-credit shape.
- [ ] T040 [US3] Builder · Run `node panel/dev/drive.js --runtime a --fault <kind>` for each of the 7 faults and read each message as the panel shows it: plain, says what to do, no check result shown (SC-006, the human half). Depends on T020, T039.
- [ ] T041 [P] [US3] EE · Test first, then `product/evals/lib/key-scan.mjs` (SC-005): reads the key from `KNACK_EVAL_API_KEY`, searches every file under a given learner home (including `panel-conversation.json`, frames folder excluded only as binary-but-scanned), the given eval results folders, a given copied report, and the environments of running `node` processes whose command line is the helper or `mentor/server.mjs` (`ps -E`/`ps eww`); prints only counts per place, never the key or matched text.
- [ ] T042 [US3] EE · Run T041 after T032's runs, during one A eval case in progress (for the process environments), and over the builder's learner home after T021's lessons; 0 occurrences everywhere (SC-005). Depends on T021, T032, T041.

---

## Phase 6: User Story 4 - Continue a lesson after closing the panel (P2)

**Goal**: continuing on A works like B1's `--resume`.

**Independent test**: quickstart.md §6, SC-007.

- [ ] T043 [US4] PB · Test first (`panel/helper/test/conversation.test.mjs`), then `panel/helper/lib/conversation.mjs` per data-model › Lesson conversation: saved (temp file and rename) only after a complete exchange; images as files in `panel-conversation-frames/` and restored on load; not continued when unreadable, another version, another `session_id` or another `model`; deleted with its frames when a new lesson starts. The test asserts the resumed request's history equals what was sent before, byte for byte (FR-015, FR-023, FR-024, SC-007 automated half).
- [ ] T044 [US4] PB · Wire continuing: `adapter-api.js` `start({ resumeSessionId })` sends `resume: true` with that id; `main.mjs` loads the conversation or, if it can't, starts fresh and says nothing alarming (spec 003's rule); the panel's existing continue flow (`panel-session.js`, `canContinue`) unchanged. Depends on T018, T043.
- [ ] T045 [US4] 🖐 AE · Builder · Quickstart.md §6 three times: no second demonstration, the earlier part referred to correctly (SC-007). Log in `discovery/usage-notes/api-runtime.md`. Can share T021's sitting. ($ about $1)

---

## Phase 7: User Story 5 - The builder sees what each lesson costs and how fast it answers (P3)

**Goal**: per-runtime cost and speed from the turn log.

**Independent test**: quickstart.md §5's report.

- [ ] T046 [P] [US5] PB · Test first, then `panel/lib/turns.js`: add `runtime` (B1 lines get `"b1"`), `model`, `effort`, `settings_hash`, `tokens` `{ input, cache_write, cache_read, output }`, `other_model`, `error_kind` from `turn_end`/`error`, and `start_ms` on a lesson's first turn; still no message text; never throws (FR-029); `panel/main.js` passes the new fields through.
- [ ] T047 [US5] PB · `panel/dev/turns.js`: report SC-004's share and median and the cost per lesson separately per runtime (missing `runtime` = B1), plus the cache read share and the gaps over 5 minutes (research R8's re-check).
- [ ] T048 [US5] Builder · From T021's and T045's lessons: SC-002 (≥ 9 of 10 turns first activity ≤ 10 s over ≥ 10 turns, median next to B1's from spec 003 T034) and SC-004 (median lesson cost ≤ $0.40 over ≥ 3 lessons), R8's gap check, and the median helper start time (`start_ms`) against `decisions/010`'s 2-second signal; log in `discovery/usage-notes/api-runtime.md`. If fewer than 10 A turns were logged, one more lesson (🖐 AE). If SC-004 misses, T051 runs before the first tester.

---

## Phase 8: User Story 6 - B1 keeps working until A is proven (P3)

**Goal**: B1 untouched; then A becomes the default, and the cheaper-model check (Q2).

**Independent test**: quickstart.md §9.

- [ ] T049 [P] [US6] PB · `panel/test/b1-unchanged.test.js`: with `runtime` missing or `"b1"`, `main.js`'s adapter choice is `adapter-claude-code.js` and its `launchArgs` output, `runtime.js` and `stream.js` behave as before (existing fixtures), and `git diff main -- panel/lib/adapter-claude-code.js panel/lib/stream.js panel/lib/runtime.js` is empty on the branch (FR-037).
- [ ] T050 [US6] EE · SC-009 after the panel and runner changes merge: `cd panel && npm test`, then a full B1 easing run (no `--runtime`); within noise of 27/28. ($ about $15)
- [ ] T051 [US6] EE · Spec Q2: once easing meets FR-033 on Opus 5.5, run easing and pivot on A with `--settings` files for Sonnet 5.5 and Haiku 5.5 (same effort; files in `product/evals/runtimes/`); if one meets FR-033 on both, run the other four on it. Report each model's pass rates and cost per run. ($ about $60)
- [ ] T052 [US6] PB · Only if T051 finds a cheaper model meeting FR-033 on all six sets and the builder agrees: set `model` in `panel/helper/settings.json` to it; EE then re-runs all six on the new default for the A baseline.
- [ ] T053 [US6] EE · After the cockpit records SC-001 to SC-008 as passed: make `a` the runners' default `--runtime` (FR-035), and record in each set's README the A baseline (results file, model, effort, cost).
- [ ] T054 [US6] PB · Same gate as T053: a missing `runtime` in `panel.json` now means A (FR-037), B1 still selectable; update `panel/test/config.test.js`.

---

## Phase 9: Polish and cross-cutting

- [ ] T055 🖐 AE · Builder · Quickstart.md §7 with `panel/helper/dev/chat.mjs`: a short lesson on a non-easing skill on the live comp (its tools only), and a `/next-mentor` hand-over that runs the suggested skill (FR-014, FR-039). `next-mentor` has no eval set, so this is its only check on A. Log in `discovery/usage-notes/api-runtime.md`. ($ about $1)
- [ ] T056 [P] PB · `panel/helper/README.md`: what the helper is, the protocol link, settings, how to run tests and `dev/chat.mjs`, the Keychain item, and that it holds no teaching logic.
- [ ] T057 PB and EE (each on their branch) · Before hand-back: `cd panel/helper && npm test`, `cd panel && npm test`, `cd mentor && npm test` (unchanged), `node --test .claude/hooks/test/*.test.mjs`, and `node .claude/hooks/check-branch.mjs <branch> <persona> main`; nothing outside the persona's paths; PB also confirms the helper uses no CEP API and `lib/loop.mjs` imports nothing from `panel/lib/` or the page (FR-040); nothing under `mentor/`, `bridge/` or `.claude/skills/` unless a T035 change.
- [ ] T058 Cockpit · After merge: update `CLAUDE.md` (A built, settings, baselines), add dated evidence under `decisions/009`'s signals (evals vs B1, cost), and send spec 006 and 007's owners the amended items (installer ships the helper and SDK; error wording).

---

## Dependencies and order

- **T001 → T006** (settings need B1's effort). T002, T003 alongside T001.
- **Phase 2** blocks everything: T005, T007–T011, T013 in parallel; then T012 → T014 → T015 → T016.
- **US1 (PB)** and **US2 (EE)** run in parallel after T015. US2's runs (T031–T033) need no AE.
- **US3**: T037 and T041 after Phase 2; T039 after T038; T040 after T020; T042 after T021 and T032.
- **US4** after T018 (adapter). **US5** T046–T047 any time after T019; T048 after T021, T045.
- **US6**: T049 with US1; T050 after merges; T051 after T031; T053 and T054 last, gated on the cockpit.
- **AE sittings (one at a time)**: T021, T045 (can share T021's sitting), T048 only if more turns are needed, T055.

## Parallel examples

```text
After T001:            T002 ‖ T003 ‖ T005 ‖ T007 ‖ T008 ‖ T009 ‖ T010 ‖ T011 ‖ T013
After T015 (two owners): PB: T017 ‖ T018 → T019 → T020      EE: T022 ‖ T023 → T024 → T025 ‖ T026 ‖ T027 ‖ T028 ‖ T029
After T031 passes:     T032's five sets as parallel processes
US3 alongside US2:     PB: T037, T038 → T039      EE: T041
```

## Implementation strategy

1. **MVP = Phase 1, Phase 2 and US1**: a lesson in the panel on A (SC-001).
2. **Then US2**, which is what makes A shippable at all (SC-003); easing first with the stop rule.
3. **US3 and US4** before any tester (spec 006 and 007 depend on the key check and error kinds).
4. **US5, US6** close it: cost and speed against B1, cheaper models, then A becomes the default.

## Task count by owner

| Owner | Tasks | Count |
|---|---|---|
| panel-builder | T002–T020, T037, T038 (with Builder), T039, T043, T044, T046, T047, T049, T052, T054, T056 | 30 |
| eval-engineer | T001, T022–T034, T036, T041, T042, T050, T051, T053 | 20 |
| skill-builder (conditional, shared with PB) | T035 | 1 |
| Builder | T021, T040, T045, T048, T055 | 5 |
| Cockpit | T058 | 1 |
| Both PB and EE | T057 | (counted once, not above) |

58 tasks. 🖐 AE: T021, T045, T055 (and T048 only if an extra lesson is needed).
