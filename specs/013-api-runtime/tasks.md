---
description: "Task list for spec 013: the option A runtime"
---

# Tasks: Option A Runtime (the Panel Calls the Claude API Directly)

**Status**: Tasked 2026-10-30. Spec, plan and the preamble (plan.md › The preamble) approved by the
builder 2026-10-30. The helper stays at `panel/helper/` (panel-builder) until the UXP rebuild.
Amended 2026-10-30 after the `013-helper` review (merged `d934115`): T059 to T061 added (Phase 10),
notes on T011, T014, T016, T018, T023, T031, T037, T039, T054 and T055 (spec › Amendments).
Amended 2026-11-04 by `decisions/011`: T032, T051, T053 and T054 changed, T062 to T067 added (Phase 11).
Amended again 2026-10-30 after `013-evals` and `013-adapter` merged (`5963fef`): notes on T023, T040
and T060 (spec › Amendments after the merge). No task ticked or unticked by this amendment.

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

- [x] T005 [P] PB · Write `panel/helper/test/fake-service.mjs`: a local HTTP server that speaks the Messages API's streaming events from scripted responses (text, `tool_use`, thinking blocks, usage with cache counts, `stop_reason` `refusal`, 401, 403, 429, 529, a billing error, a dropped connection, a different response `model`), and records each request body; the SDK points at it through `baseURL` in tests only.
- [x] T006 PB · Write `panel/helper/settings.json` per data-model › Runtime settings (`"model": "claude-opus-5-5"`, `"effort"` = T001's finding, `"cache_ttl": "5m"`, `"skill_placement": "system"`, `"max_steps": 12`, `"turn_timeout_ms": 300000`, `"fallbacks": "default"`) as the one place for these settings (FR-028), and `panel/helper/lib/settings.mjs` (load, validate: "Other versions refused", the model "Must have a row in the price table, else the helper refuses to start", settings hash over `settings.json`, `preamble.md`, `main.mjs` and `lib/`), with `test/settings.test.mjs` first. Depends on T001, T003.
- [x] T007 [P] PB · Test first (`test/skills.test.mjs`), then `panel/helper/lib/skills.mjs`: given a skills folder and a name, accept only names matching `/^[a-z0-9][a-z0-9-]*-mentor$/` (the pattern in `panel/lib/runtime.js`), return `allowed-tools` from the frontmatter with `mcp__ae-mentor__` removed (keep `Skill` as is) and the body as the exact bytes after the closing `---` line; test against all six real `SKILL.md` files plus `next-mentor` (FR-010, FR-017).
- [x] T008 [P] PB · Test first (`test/mcp-client.test.mjs`, against the real `mentor/server.mjs` with `AE_MENTOR_FIXTURE_STATE`), then `panel/helper/lib/mcp-client.mjs` per research R4: read the `ae-mentor` entry of a given `.mcp.json`, run `"node"` as `process.execPath`, resolve script paths against that file's folder, spawn with only `PATH=/usr/bin:/bin:/usr/sbin:/sbin`, `HOME`, `TZ`, `AE_MENTOR_HOME` and the passed `AE_MENTOR_*` variables; `initialize` (keep `instructions`), `notifications/initialized`, `tools/list`, `tools/call` returning content parts and `isError` whole; report exit; restart on demand. A test asserts the child's environment has no key-shaped value and no `ANTHROPIC_*` variable (FR-004, FR-009, FR-011, FR-019).
- [x] T009 [P] PB · Test first (`test/cost.test.mjs`), then `panel/helper/lib/cost.mjs`: cost from token counts by kind (input, cache write at the 5m or 1h rate, cache read, output) and `prices.json`, Haiku's long-prompt prices above 100K prompt tokens, `null` when the model or a price is missing, never 0 (FR-026).
- [x] T010 [P] PB · Test first (`test/errors.test.mjs`), then `panel/helper/lib/errors.mjs`: research R10's table from SDK error classes and stop reasons to kinds, the fixed messages in contracts/helper-protocol.md › Error kinds, and `scrub(text)` replacing anything shaped like `sk-ant-[A-Za-z0-9_-]{10,}` before any log line (FR-021, FR-027). The billing row's matcher is provisional until T038.
- [x] T011 [P] PB · Test first (`test/key.test.mjs`, with a faked `security` runner), then `panel/helper/lib/key.mjs`: read the Keychain item (service `Knack`, account `anthropic-api-key`) with `/usr/bin/security find-generic-password -s Knack -a anthropic-api-key -w`, or take the `key` from the `start` command (evals); return nothing (not throw) when missing; delete `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_PROFILE`, `ANTHROPIC_BASE_URL` from the helper's own `process.env` at start (research R3, R11; FR-018, FR-019, FR-038). *Built 2026-10-30 as every `ANTHROPIC_*` variable (review; research R3 amended).*
- [x] T012 PB · Test first (`test/prompt.test.mjs`), then `panel/helper/lib/prompt.mjs` per research R5: tools = the server's list in its order filtered by the skill's `allowed-tools`, as `{ name, description, input_schema }`, plus a `Skill` tool (`{ skill, args? }`) only when listed; system = preamble, server instructions, skill body as three text blocks, cache breakpoint on the last (FR-025); `skill_placement: "message"` puts the body ahead of the first learner text instead; no date, time, path or id anywhere; `prompt_hash`. Tests: byte-for-byte skill body, identical output on two calls, an unlisted tool absent, both placements (FR-005, FR-010–FR-013, FR-016). Depends on T006–T008.
- [x] T013 [P] PB · Test first, then `panel/helper/lib/request-log.mjs`: append each request body as one JSON line when a `request_log` path was given, with the key absent and image `data` replaced by its length (SC-008 input for T023).
- [x] T014 PB · Test first (`test/loop.test.mjs` with T005's fake service and the real server in fixture mode), then `panel/helper/lib/loop.mjs`: one turn = up to `max_steps` streamed requests with `output_config.effort`, the cache breakpoint on the newest message's last block (FR-025, `cache_ttl` from settings), and `fallbacks` when set (with the `server-side-fallback-2026-07-01` beta; `null` forced on Haiku 5.5, research R10); map stream events to `text_delta`, `text`, `tool_call` (then `input`), `tool_result` per research R9; run only allowed tools, answering any other with an `is_error` result "That tool isn't available in this lesson." and logging the name; return tool results whole (text, images, `is_error`); thinking blocks kept in history, never emitted; history append-only (a test compares each request's messages prefix with the previous request's, byte for byte); the `Skill` hand-over per R5 (mid-conversation system message, tool swap, no edit to earlier messages; only `*-mentor` skills); step limit → `turn_end { ok: false }` with no `error`; 5-minute timeout → `error timeout`; refusal → `error refused` with its category logged; `other_model` when the response model differs (FR-005, FR-006, FR-007, FR-008, FR-014, FR-015, FR-022, FR-025, FR-029). Depends on T005, T009, T010, T012, T013. *Amended 2026-10-30 (review; not unticked):* as built, `tool_call` goes out once the whole answer is in (S6, FR-022), every request carries the history check (M2, FR-021a), and a failed turn still cuts the history back to the turn's start, which T059 changes (D1); the tool swap at a hand-over is Haiku 5.5's fallback once T060 lands (D2).
- [x] T015 PB · Write `panel/helper/main.mjs` per contracts/helper-protocol.md: JSON-line commands `start` (fields `session_id`, `resume`, `home`, `mcp_config`, `skills_dir`, `fixture_env`, `key`, `request_log`, `settings_file`), `send`, `stop`, `key_check` (stub until T037); `ready` with `settings_hash`; `busy` refusal; `turn_end` fields from data-model › Turn log; no event or log ever holds the key. `settings_file` defaults to `panel/helper/settings.json`; another file is for eval experiments only (T051) and is reported in `ready`. Protocol test `test/main.test.mjs`: a fixture lesson on easing end to end with the fake service, and `stop` leaves no helper or `ae-mentor` process. Depends on T011, T014.
- [x] T016 PB · Write `panel/helper/dev/chat.mjs` (FR-039, builder-only, not installed for learners): a terminal chat over `main.mjs` with `--skill <name>-mentor [args]`, `--home`, `--key-check`, printing the mentor's words and one line per tool call, using the Keychain key; with `--fixture <file>` it runs on `ae-mentor`'s fixture mode. Smoke check by the builder: one easing turn on a fixture with the real service ($ under $0.20). *Added 2026-10-30 (review):* also one `--skill next-mentor` turn that hands over (on a fixture), with the helper log (stderr) read for `input_transformations` after the hand-over: record whether any entry appeared and its type and reason. While on the real service, record the answer to each of the three unknowns the build couldn't settle from the docs (below), and hand them back for research R10.

**Checkpoint**: `cd panel/helper && npm test` passes; a fixture easing lesson and a `next-mentor` hand-over turn run through `chat.mjs` on the real service, and the three real-service unknowns are answered:

1. Whether the service accepts the binding, updates and fallback betas (`thinking-binding-controls-2026-08-01`, `thinking-display-updates-2026-08-18`, `server-side-fallback-2026-07-01`) together on one Opus 5.5 request.
2. Whether it accepts taking a just-sent mid-conversation system message back off the end of the history (review fix M1: the skill body taken back after an empty reply, then sent again).
3. Whether it accepts `cache_control` with `ttl: "5m"` written out, and a top-level `system` given as an array of content blocks (both sent on every request).

---

## Phase 3: User Story 1 - The builder takes a full lesson in the panel on option A (P1) 🎯 MVP

**Goal**: spec 003's quickstart a–f in the panel on A, no Claude Code running.

**Independent test**: quickstart.md §5, SC-001.

- [x] T017 [P] [US1] PB · Test first (`panel/test/config.test.js`), then `panel/lib/config.js`: optional `runtime` (`"b1"` | `"a"`); missing → `"b1"` (FR-037); on `"a"`, `claude_path` isn't required and its check is skipped, `node_path` and `repo_path` still are; existing B1 validation and messages unchanged.
- [x] T018 [P] [US1] PB · Test first (`panel/test/adapter-api.test.js` with a fake helper process), then `panel/lib/adapter-api.js`: same exports and interface as `adapter-claude-code.js`; spawn `node_path panel/helper/main.mjs` with `cwd` `panel/helper/` and only `PATH`, `HOME`, `TZ`; send `start` with `mcp_config` = `<repo>/.mcp.json`, `skills_dir` = `<repo>/.claude/skills`, `home`; re-emit the helper's events; time `wait_ms` and `first_event_ms` itself from `send` as B1 does; `BUSY` while a turn is in flight; `start_ms` (spawn to the helper's `ready`) carried on the lesson's first `turn_end`, for `decisions/010`'s 2-second start-up signal; `stop()` leaves no process; helper exit mid-turn → `error process_exited` + `turn_end { ok: false }`. CommonJS, no dependencies (FR-001, FR-002, FR-003). *Per the contract as amended 2026-10-30:* never send `base_url`; an `error start_failed` in place of `ready` ends starting (no `start_ms`; the next `send` retries); `bad_command` and `not_implemented` are logged, never shown; `not_signed_in` can come on any `send`.
- [x] T019 [US1] PB · In `panel/main.js`: choose `adapter-api.js` when `cfg.runtime === "a"` and skip `ensureRuntime`; add the A kinds' messages from contracts/helper-protocol.md › Error kinds (on A, `start_failed` shows only its fixed message, no appended detail; B1's messages unchanged); no other change (FR-001, FR-027).
- [x] T020 [US1] PB · Add `--runtime a` and `--fault <kind>` to `panel/dev/drive.js` (the fault flag points the helper at T005's fake service with that scripted fault; dev only).
- [ ] T021 [US1] 🖐 AE · Builder · With `"runtime": "a"`, no Claude Code process, and the AE lock: run quickstart.md §5 (spec 003 quickstart §4 a–f on Mentor Practice) three times; each check's list matches AE every time (SC-001). Log with `/usage-session` in `discovery/usage-notes/api-runtime.md`. ($ about $1.20) Depends on T016–T019.

**Checkpoint**: SC-001 met; the turn log has A lines for US5.

---

## Phase 4: User Story 2 - The evals run on option A and show it teaches the same as B1 (P1)

**Goal**: all six sets meet FR-033 on A (SC-003, SC-008). Starts after Phase 2; runs in parallel with Phase 3 (different owner, no AE).

**Independent test**: quickstart.md §4.

- [x] T022 [P] [US2] EE · Test first (`product/evals/lib/test/runtime-a.test.mjs`, with a recorded helper event stream), then `product/evals/lib/runtime-a.mjs` per contracts/eval-runtime.md › Mentor turns on A: one helper per case, fixture state written per turn as today, events mapped to `{ kind: "say" }` and `{ kind: "tool", name, input, ok, result }`, a failed turn fails the case with check `run`, cost summed with `null` reported as unknown; `KNACK_EVAL_API_KEY` sent only in `start` and deleted from every child's environment, so the judge's `claude -p` runs exactly as today (FR-032).
- [x] T023 [P] [US2] EE · Test first, then `product/evals/lib/allowlist-check.mjs` (SC-008, FR-016): derive the allowlist independently (read `panel/helper/preamble.md`, the server's `initialize` instructions and `tools/list` by starting `mentor/server.mjs` itself, the `*-mentor` `SKILL.md` bodies) and check every request in a request log: system blocks and tools only from those sources, messages only learner/panel text, tool results, tool uses and the model's own blocks; no text containing `CLAUDE.md`, sprint or eval-fixture paths, or anything from `~/.claude/`. *Amended 2026-10-30 (D3, D2; spec FR-012, FR-016):* the runtime text allowed is exactly the preamble, the hand-over tool's definition from `panel/helper/skill-tool.json`, and the fixed tool-result texts "Loaded <skill>.", "Loaded <skill>. Arguments: <args>", "That skill isn't available.", "That tool isn't available in this lesson." and "That call didn't run." (where `<skill>` is a `*-mentor` name and `<args>` the model's own argument from the matching `Skill` call); any other runtime text fails. Also allowed: a `role: "system"` message holding a `*-mentor` `SKILL.md` body, server tools declared with `defer_loading: true`, and (after T060) `tool_addition` / `tool_removal` blocks naming a server tool or `Skill`. *Amended 2026-10-30 (review S1, builder's decision; as merged):* the fixed texts also include "That call didn't finish, so it may or may not have changed the project." (FR-012 item 7); it and "That call didn't run." pass only with `is_error: true`. Request fields are limited to contracts/eval-runtime.md's list.
- [x] T024 [US2] EE · In `product/evals/easing/run.mjs`: `--runtime a|b1` (default `b1`), `--settings <file>` (A only, recorded; a run with a non-default file can't become a baseline), A turns through T022, the allowlist check per case through T023, results fields per data-model › Eval results, the summary line and B1-baseline comparison per contracts/eval-runtime.md, `--changed`'s hash adding the helper's files on A runs only, `--dry-run` on A checking the helper starts with no service request; B1 path untouched (FR-030, FR-031, FR-033, FR-036). Depends on T015, T022, T023.
- [x] T025 [P] [US2] EE · Same change as T024 in `product/evals/key-types/run.mjs`. Depends on T024.
- [x] T026 [P] [US2] EE · Same change as T024 in `product/evals/speed-graph/run.mjs`. Depends on T024.
- [x] T027 [P] [US2] EE · Same change as T024 in `product/evals/offset/run.mjs`. Depends on T024.
- [x] T028 [P] [US2] EE · Same change as T024 in `product/evals/anchor/run.mjs`. Depends on T024.
- [x] T029 [P] [US2] EE · Same change as T024 in `product/evals/null-parenting/run.mjs` (including `AE_MENTOR_FIXTURE_TWINS` where it's set today). Depends on T024.
- [x] T030 [US2] EE · FR-031 shape test `product/evals/lib/test/transcript-shape.test.mjs`: run easing case 01 once on each runtime (recorded, then replayed in the test), and assert both transcripts have the same event kinds and fields and that `check()` and `renderTranscript()` accept both. While here, check research R4's watch item (one server per case on A vs. one per turn on B1) on one multi-turn case and note the result. ($ about $1) Depends on T024.
- [x] T031 [US2] EE · Depends on T060 (spec resolved question 9: T060 changes every request's tool list on Opus 5.5). Full easing run on A (`--runtime a`). Apply the stop rule (spec Q4): if more than 5 points below the B1 baseline (27/28, 2026-10-29), stop, triage with `/eval-triage`, and hand back before T032; the first suspect is the skill placement (R5), the second the thinking display (R7). ($ about $15)
- [x] T032 [P] [US2] EE · *Done 2026-11-04: pivot 48/50, mentor $2.30. The builder also approved the other four now, once easing and pivot showed the rate: key types 28/30, speed graph 28/29, offset 33/37, null 43/44, on `4edba27`.* *Amended 2026-11-04 (`decisions/011`):* a full A run of pivot (`anchor`) against its 2026-10-29 B1 baseline (48/50) now. ($ about $25) Key types, speed graph, offset and null (29/30, 29/29, 33/37, 42/44) run later, on the commit given to the first tester, against whatever their B1 baselines are then; they don't hold this spec open. (The earlier figure for all five was about $70, and the per-case rate suggests about $100.) Depends on T025–T029, T031 passing the stop rule.
- [x] T033 [US2] EE · *Done 2026-11-04 for all six: every repeat was a majority pass except pivot 14 and key types 22. Both also fail on B1 on the same commit (1/3 each), so neither is the runtime; pivot 14 goes to T035, key types 22 to T069.* For every case that passed on B1 and failed on A: `--only <id> --repeat 3 --runtime a`; majority pass = noise; majority fail = regression, triaged (`/eval-triage`), with research R6's `read_learner_record` note checked for the five non-easing sets. ($ about $30)
- [x] T034 [US2] EE · *All six records written 2026-11-04: easing, speed graph, offset and null meet FR-033; pivot and key types wait on T035 and T069.* Write each set's `README.md` › Option A equivalence record per data-model › Equivalence record, and say whether the set meets FR-033.
- [x] T035 [US2] SB or PB (by the gap) · *2026-11-04: the builder chose to fix pivot case 14 (a prompt gap, SB).* *2026-11-06: fix merged (`3765964`), plus the rule for a "done" before the walk-through (`5c245e9`), pivot case 46, and "show" in `no_offer` for cases 03, 14 and 28.* Only if T033 finds a regression the builder doesn't accept: a placement or display change is PB's in `panel/helper/settings.json` (one setting, research R5), applied to all six sets; a prompt or tool gap is SB's in that `SKILL.md` or `mentor/` file, as its own change. No change to eval cases or rubrics.
- [x] T036 [US2] EE · *Done 2026-11-06: pivot B1 51/51 and A 50/51 at `c2d5f8d`; easing A 27/28 after the helper change. The other four re-run on the first tester's commit.* After any T035 change: re-run the affected set on B1 and on A on the same commit (FR-034; for a settings change, all six on A), and update T034's records. ($ depends)
- [ ] T068 PB · *2026-11-06: stall guard (`431e556`), error kinds (`lib/reach.mjs`) and the runner's `failed_turns` log merged; the cause is still not found.* *2026-11-04: the stall half is built, unproven live; the cause isn't found, so this stays open. All 6 were an API request with no answer, not a tool call. A request now has 20 s plus upload time to get headers and 30 s between bytes, and goes again; request bodies unchanged, `settings_hash` changed (it covers `lib/`), so whether all six re-run is the builder's call (T036).* Find why A's turns time out (6 in about 800 turns, every one in the easing set; none in 515 turns of the other five), and stop one stalled request from costing a learner 5 minutes. `createClient` gives each request the same limit as the whole turn (`panel/helper/lib/loop.mjs:41`), so the SDK's retries probably can't run. Any change to `settings.json` means all six re-run on A (T036).
- [x] T069 EE · *Done 2026-11-04: pattern widened in key types 22, offset 30, speed graph 22; key types case 22 2/3 on B1 and A.* Fix key types case 22's stale check: widen `says_when` to accept "a week and a half ago" and similar, and stop the check depending on how old the fixture's date is. Find any other case with the same dependency. Re-run on B1 and A with `--repeat 3`, then record key types' A baseline (T053).

**Checkpoint**: SC-003 met (all six), SC-008 met on every case.

---

## Phase 5: User Story 3 - A learner's access key works, stays secret, and its problems are explained (P2)

**Goal**: the key check, the seven faults' messages, no key anywhere.

**Independent test**: quickstart.md §3 and §8.

- [x] T037 [P] [US3] PB · *Done 2026-11-09 (spec 006 T008, branch `006-panel`): one `models.retrieve` with no retries; a status that can't say whether the key works (429, 5xx, 404, a helper fault) reads as `offline` (not checked); `base_url` and `keychain: false` are accepted on `key_check` as on `start` (test-only, local only); settings hash now `7a2ec82f…`.* Test first, then the key check in `panel/helper/lib/key.mjs` and `main.mjs`'s `key_check`: one `models.retrieve(settings.model)` → `works` / `rejected` (401, 403) / `offline` / `no_key` (no request made); expose it in `dev/chat.mjs --key-check` (FR-020, research R11). A key passed in the `key_check` command must be added to the log scrubber (`errors.mjs` `scrub`, as `main.mjs` does for the start command's key) before any log line the check writes; `not_implemented` goes away (contracts/helper-protocol.md).
- [ ] T038 [US3] PB with Builder · Verify research R10's and R11's open items against the service: the error type and status for out of credit and for a workspace spend limit (the builder supplies a key from a workspace with its limit reached or credit exhausted, set up in the console), and whether any free request can tell `out_of_credit` from `works`; fix `errors.mjs`'s billing matcher and `key_status` accordingly, and add the real response shapes (scrubbed) to T005's fake service. Report the finding in the hand-back for the spec-writer to add to research. ($ none or cents)
- [ ] T039 [P] [US3] PB · `panel/helper/test/faults.test.mjs`: the 7 faults of SC-006 (no key, rejected key, out of credit, rate limited, overloaded, offline, `ae-mentor` can't start) through `main.mjs` with T005's fake service: each gives its kind, its fixed message, no `tool_result` for that turn, and no message containing a status code, a path, a tool name or the key; a dropped connection mid-answer keeps that turn's complete exchanges and nothing of its incomplete answer (spec FR-015 as amended 2026-10-30, T059; › Edge Cases). Depends on T038 for the out-of-credit shape, and T059 for the dropped-connection case.
- [ ] T040 [US3] Builder · Run `node panel/dev/drive.js --runtime a --fault <kind>` for each of the 7 faults and read each message as the panel shows it: plain, says what to do, no check result shown (SC-006, the human half). Depends on T020, T039. *Note 2026-10-30 (review S3, as merged):* every `--fault` run sends `keychain: false` with its local `base_url`, so it never reads the real Keychain or raises its access dialog; `--fault no_key` sends no key at all, so the helper has none and makes no request.
- [ ] T041 [P] [US3] EE · Test first, then `product/evals/lib/key-scan.mjs` (SC-005): reads the key from `KNACK_EVAL_API_KEY`, searches every file under a given learner home (including `panel-conversation.json`, frames folder excluded only as binary-but-scanned), the given eval results folders, a given copied report, and the environments of running `node` processes whose command line is the helper or `mentor/server.mjs` (`ps -E`/`ps eww`); prints only counts per place, never the key or matched text.
- [ ] T042 [US3] EE · Run T041 after T032's runs, during one A eval case in progress (for the process environments), and over the builder's learner home after T021's lessons; 0 occurrences everywhere (SC-005). Depends on T021, T032, T041.

---

## Phase 6: User Story 4 - Continue a lesson after closing the panel (P2)

**Goal**: continuing on A works like B1's `--resume`.

**Independent test**: quickstart.md §6, SC-007.

- [x] T043 [US4] PB · Test first (`panel/helper/test/conversation.test.mjs`), then `panel/helper/lib/conversation.mjs` per data-model › Lesson conversation: saved (temp file and rename) only after a complete exchange; images as files in `panel-conversation-frames/` and restored on load; not continued when unreadable, another version, another `session_id` or another `model`; deleted with its frames when a new lesson starts. The test asserts the resumed request's history equals what was sent before, byte for byte (FR-015, FR-023, FR-024, SC-007 automated half).
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

- [ ] T049 [P] [US6] PB · *Amended 2026-11-04: the empty `git diff` clause below no longer applies to `adapter-claude-code.js` (FR-042); easing's arguments stay the same set.* `panel/test/b1-unchanged.test.js`: with `runtime` missing or `"b1"`, `main.js`'s adapter choice is `adapter-claude-code.js` and its `launchArgs` output, `runtime.js` and `stream.js` behave as before (existing fixtures), and `git diff main -- panel/lib/adapter-claude-code.js panel/lib/stream.js panel/lib/runtime.js` is empty on the branch (FR-037).
- [ ] T050 [US6] EE · SC-009 after the panel and runner changes merge: `cd panel && npm test`, then a full B1 easing run (no `--runtime`); within noise of 27/28. ($ about $15)
- [ ] T051 [US6] EE · *Deferred 2026-11-04 (`decisions/011`): not on the $100 budget; run it when funding allows.* Spec Q2: once easing meets FR-033 on Opus 5.5, run easing and pivot on A with `--settings` files for Sonnet 5.5 and Haiku 5.5 (same effort; files in `product/evals/runtimes/`); if one meets FR-033 on both, run the other four on it. Report each model's pass rates and cost per run. ($ about $60)
- [ ] T052 [US6] PB · Only if T051 finds a cheaper model meeting FR-033 on all six sets and the builder agrees: set `model` in `panel/helper/settings.json` to it; EE then re-runs all six on the new default for the A baseline.
- [ ] T053 [US6] EE · *A baselines recorded for all six (pivot and easing renewed 2026-11-06 on helper `0d5cda88ea83`; the other four on `20bff077e6af`). Open until the four re-run on the tester's commit.* *Amended 2026-11-04 (`decisions/011`):* when a set meets FR-033, record in its README the A baseline (results file, model, effort, cost, commit) next to its B1 baseline (FR-035). The runners' default stays `b1`.
- [ ] ~~T054~~ *Dropped 2026-11-04 (`decisions/011`):* a missing `runtime` stays B1 (FR-037). What a tester's install writes moves to spec 006's plan.

---

## Phase 9: Polish and cross-cutting

- [ ] T055 🖐 AE · Builder · Depends on T060. Quickstart.md §7 with `panel/helper/dev/chat.mjs`: a short lesson on a non-easing skill on the live comp (its tools only), and a `/next-mentor` hand-over that runs the suggested skill (FR-014, FR-039). `next-mentor` has no eval set, so this is its only check on A. Log in `discovery/usage-notes/api-runtime.md`. ($ about $1)
- [x] T056 [P] PB · `panel/helper/README.md`: what the helper is, the protocol link, settings, how to run tests and `dev/chat.mjs`, the Keychain item, and that it holds no teaching logic.
- [ ] T057 PB and EE (each on their branch) · Before hand-back: `cd panel/helper && npm test`, `cd panel && npm test`, `cd mentor && npm test` (unchanged), `node --test .claude/hooks/test/*.test.mjs`, and `node .claude/hooks/check-branch.mjs <branch> <persona> main`; nothing outside the persona's paths; PB also confirms the helper uses no CEP API and `lib/loop.mjs` imports nothing from `panel/lib/` or the page (FR-040); nothing under `mentor/`, `bridge/` or `.claude/skills/` unless a T035 change.
- [ ] T058 Cockpit · After merge: update `CLAUDE.md` (A built, settings, baselines), add dated evidence under `decisions/009`'s signals (evals vs B1, cost), and send spec 006 and 007's owners the amended items (installer ships the helper and SDK; error wording).

---

## Phase 10: Amendments after the helper review (added 2026-10-30)

**Purpose**: the builder's decisions D1 and D2 and one review follow-up (spec › Amendments). Each
lists what it must land before.

- [x] T059 PB · D1, test first (`panel/helper/test/loop.test.mjs`, T005's fake service, the real `ae-mentor` in fixture mode): a turn whose step 1 calls `set_ease` (the demo) and step 2 makes another `ae-mentor` call (its result, error or not, completes the exchange), then fails at step 3 (one case each: a dropped connection, a service error, the turn timeout); assert the next turn's request still holds both calls and their results byte for byte, and only the failed step's incomplete answer is gone. Also: a demo runs, then the next call in the same answer fails (`ae-mentor` exits), then the next turn still has the demo's call and result, and the failed call has the error result "That call didn't run." (spec resolved question 7); a failure at step 1 takes the learner's message back too (resolved question 6); a completed hand-over in the failed turn stays in force (skill, tools, body); the step-limit and M1 paths unchanged. Then change `panel/helper/lib/loop.mjs` `fail()` from cutting the history back to the turn's start to cutting it back to the end of the last complete exchange (spec FR-015, data-model › Lesson conversation). Add "That call didn't run." next to the other fixed texts in `loop.mjs`. Before T043 (the saved conversation) and T021. *Note 2026-10-30 (review S1, builder's decision, merged `0ba8c47`):* a call still in flight when the turn fails gets "That call didn't finish, so it may or may not have changed the project." and completes the answer even as its first call (spec FR-015).
- [x] T060 PB · D2. First a live check on the real service (Builder's key, $ cents), both points recorded in the hand-back for research R5: (a) whether `tool_removal` / `tool_addition` blocks can share one `role: "system"` message with the skill body's text, or need their own message; (b) where the `tool_removal` must sit when the body follows the tool result (the docs: immediately before an assistant message or last). Then, test first (`test/prompt.test.mjs`, `test/loop.test.mjs`): on Opus 5.5 and Sonnet 5.5, `tools` declares every server tool plus `Skill`, those outside the active skill with `defer_loading: true`, identical bytes on every request of a lesson; a hand-over (by `Skill` or by a typed command) appends `tool_removal` and `tool_addition` blocks per the check's answer, plus the body, with beta `mid-conversation-tool-changes-2026-07-01`; a call to a hidden tool still gets "That tool isn't available in this lesson."; on Opus 5.5 and Sonnet 5.5 every request keeps `prefix_mismatch_behavior: "error"` for the whole lesson, hand-over or not, and `input_transformations` stays empty after a hand-over (spec resolved question 8); on Haiku 5.5, the as-built swap plus `drop_block` from the hand-over on, unchanged (the only place `drop_block` is used). Update `lib/prompt.mjs` and `lib/loop.mjs` (spec FR-005, FR-014; research R5, R8). Depends on T059 (same file). Before T031 and T055 (spec resolved question 9). *Added 2026-10-30 (after the `013-evals` merge):* the allowlist check (`product/evals/lib/allowlist-check.mjs`) only guesses the tool-change blocks' shape (it reads a name from `name`, `tool_name`, `names` or `tools`) and rejects any request field outside contracts/eval-runtime.md's list. Hand back the real `tool_addition` / `tool_removal` shape and any new request field, so the eval engineer puts the real shape into the contract and the allowlist test (and adds the field to the list) in the same merge window, before T031.
- [x] T061 [P] [US6] PB · `panel/install.sh`: when `panel.json` already has `"runtime": "a"`, don't require Claude Code (skip the `claude` check, write no `claude_path` or keep an existing one) and still install the helper with `npm ci`; with `runtime` missing or `"b1"`, unchanged. Add a test or a scripted dry run for both (FR-038). Before T054.

---

## Phase 11: Build on B1, ship on A (added 2026-11-04, `decisions/011`)

**Purpose**: moving work between the runtimes is one step, and B1 can't quietly allow what A refuses. T062 and T063 land before T031. None of these spends API credit; T065's check uses the subscription.

- [x] T062 EE · T060's hand-back: `product/evals/lib/allowlist-check.mjs` `namedBy()` reads `block.tool.name` (the real shape: `{ "type": "tool_removal", "tool": { "type": "tool_reference", "name": "…" } }`, `tool_addition` the same); take out the guessed readings; a system message may hold only a `tool_removal`. Fixes the failing test at `product/evals/lib/test/allowlist-check.test.mjs:82`. Hand back the wording for `contracts/eval-runtime.md`; the cockpit updates it (the file isn't the eval engineer's). Before T031.
- [x] T063 EE · On A, results and the printed summary report the mentor's cost (credit) and the judge's (subscription) separately, so the printed total stops overstating what the credit paid for. B1 output stays byte-identical unless the builder agrees otherwise. Before T031.
- [x] T064 EE · FR-042 for the runners: test first, then build each B1 runner's `--allowedTools` from its skill's `allowed-tools`, with one shared reader (`lib/ab.mjs` has `allowedToolsOf`). A test asserts each set is the same set the 2026-10-29 baselines used. Say in the hand-back whether this changes `--changed`'s hash, so nothing re-runs by surprise.
- [x] T065 PB · FR-042 for the panel: first check headlessly on a fixture (subscription, not credit) whether a non-easing skill's tools work under today's list, and whether `next-mentor` can hand over on B1. Record both in research R6. Then test first, build `adapter-claude-code.js`'s `--allowedTools` from the opening skill's `allowed-tools`, keeping easing's arguments the same set as today (`panel/test/b1-unchanged.test.js`). If B1 can't hand over, say so and hand back; don't build around it. *Checked 2026-11-04 (research R6): B1 can't hand over. The builder approved the list change, with hand-overs tested on A only, `Skill` left out of B1's list, and the opening skill saved so Continue uses the same list.*
- [x] T066 PB · FR-041: test first, then `bash panel/install.sh --runtime a|b1`, with T061's rules for each runtime and a line saying which runtime is on. Document it in `install.sh`'s header; T056's README picks it up.
- [x] T067 EE · FR-043: test first, then `product/evals/lib/ready-for-a.mjs <skill>`, and run it on all seven `*-mentor` skills. Report any mismatch to the skill's owner rather than fixing it. Depends on T064.

---

**Note (2026-11-04, from spec 007; no task or state changed by this note):** spec 007 builds its panel on B1 (`decisions/011`, its FR-097), in either order with this list. One owner for shared work, in [spec 007's plan](../007-ui-overhaul/plan.md) › Shared work with spec 013: T064 owns the runners' reader, T065 the per-skill list, T066 `install.sh`, T067 `ready-for-a.mjs`, and T031 and T032 the whole-set runs on A. T065 has landed, which also completes spec 007's T039. Its T032 and T078 on T064 and T031/T032. Yes on B1 is 007's own (its FR-082, T052), so T065 builds nothing for it.

- **If 007's panel work merges first:** T049 checks B1 against the panel as merged, where `launchArgs` and `adapter-claude-code.js` carry 007's T023 and T052, not the panel as it is today. T044's "existing continue flow" means 007's: `panel-session.json` is version 2 and keeps `claude_session_id`, and a busy or absent bridge keeps the session (007 FR-028). T021 and T045 follow the same steps with 007's labels (Done, check it; Continue lesson; Pick · Try · Done); the requests are unchanged, so results stay comparable. T055's "no eval set" stops being true once 007's `product/evals/next-mentor/` lands, with real hand-over cases on A only.

## Dependencies and order

- **T001 → T006** (settings need B1's effort). T002, T003 alongside T001.
- **Phase 2** blocks everything: T005, T007–T011, T013 in parallel; then T012 → T014 → T015 → T016.
- **US1 (PB)** and **US2 (EE)** run in parallel after T015. US2's runs (T031–T033) need no AE.
- **US3**: T037 and T041 after Phase 2; T039 after T038 and T059; T040 after T020; T042 after T021 and T032.
- **US4** after T018 (adapter). **US5** T046–T047 any time after T019; T048 after T021, T045.
- **US6**: T049 with US1; T050 after merges; T051 deferred; T053 after each set meets FR-033.
- **AE sittings (one at a time)**: T021, T045 (can share T021's sitting), T048 only if more turns are needed, T055.
- **Phase 10**: T059 before T039, T043 and T021; T060 after T059, before T031 and T055; T061 any time.
- **Phase 11**: T062 and T063 before T031. T064 before T067. T065 and T066 any time.

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
| panel-builder | T002–T020, T037, T038 (with Builder), T039, T043, T044, T046, T047, T049, T052, T056, T059–T061, T065, T066 | 34 |
| eval-engineer | T001, T022–T034, T036, T041, T042, T050, T051, T053, T062–T064, T067 | 24 |
| skill-builder (conditional, shared with PB) | T035 | 1 |
| Builder | T021, T040, T045, T048, T055 | 5 |
| Cockpit | T058 | 1 |
| Both PB and EE | T057 | (counted once, not above) |

66 tasks (T054 dropped, T062 to T067 added). 🖐 AE: T021, T045, T055 (and T048 only if an extra lesson is needed).
