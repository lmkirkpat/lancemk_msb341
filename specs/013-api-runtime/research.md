# Research: Option A Runtime

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-10-30

Each item: decision, why, what else was considered. API facts are from the Claude API reference
as of 2026-10-30 (model ids, prices, effort, caching, refusals); anything marked **verify** is
checked by a task before it's relied on.

## R1. The helper process and its protocol (spec Q1, `decisions/010`)

**Decision**: the A adapter (`panel/lib/adapter-api.js`) spawns `node panel/helper/main.mjs` with
`node_path` from `panel.json`, one process per lesson, and exchanges JSON lines on stdin/stdout
([contracts/helper-protocol.md](contracts/helper-protocol.md)). Commands in: `start`, `send`,
`stop`, `key_check`. Events out: exactly the adapter contract's events plus optional fields the
panel ignores (`tool_call.input`, token counts). The helper starts `ae-mentor` itself.

**Why**: same shape as B1 (spawn, read events), so the panel change is one adapter file; the eval
runners spawn the same entry point; CEP's Node doesn't limit the SDK; it's the helper a UXP panel
would start. **Rejected**: the loop inside the panel's Node (tied to CEP and the page; the evals
would have to fake the panel); importing `mentor/tools/` (bypasses the server's instructions, call
log and error wrapping).

## R2. Which model and effort B1 used (T001, before any A setting)

**Decision**: T001 (eval-engineer) records the model and effort the 2026-10-29 B1 runs used in
a new `product/evals/README.md` › Runtimes and in its hand-back; the spec-writer then adds
the result under this item. Sources, in order:

1. The Claude Code session transcripts those runs left under `~/.claude/projects/` (folders named
   after the eval runtime folders, `…-AEMentor-…-runtime`): each assistant line carries
   `message.model`. Count the models across the 10-29 sessions.
2. One fresh B1 easing case (`--only 01`) with the runner's flags and `--output-format json
   --verbose`: the `system` `init` message's `model` and the `result`'s `modelUsage`.
3. Effort: Claude Code's effective effort setting for that account and version (its settings and
   `/model` view; the version from `claude --version`), and the judge's model and effort the same
   way (FR-032 keeps the judge as is, so this is only recorded).
4. Thinking display: whatever Claude Code requests, if a debug log shows it; otherwise "unknown".

If B1 ran a model other than Opus 5.5, the panel-builder writes that in the result and the
cockpit asks the builder before T006 sets `settings.json` (flagged in the plan; the spec's Q2 says
Opus 5.5).

**Why**: FR-033's comparison is only about the runtime if the model and effort match.

## R3. The SDK and credentials (spec Q3)

**Decision**: `@anthropic-ai/sdk`, exact version pinned (`"x.y.z"`, no range) with a committed
`package-lock.json`, installed by `npm ci` in `panel/helper/` (`panel/install.sh`, T004). The client
is built with an explicit `apiKey` from R11 and `maxRetries: 2`, `timeout` per request under the
5-minute turn timeout. The helper's own environment is checked at start: `ANTHROPIC_API_KEY`,
`ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_PROFILE` and `ANTHROPIC_BASE_URL` are removed before the client
is built, so the SDK can't fall back to a shell variable or a CLI profile on disk.

**Why**: the SDK covers streaming, retries on 429/5xx and connection errors, and typed errors
(`AuthenticationError`, `PermissionDeniedError`, `RateLimitError`, `InternalServerError`,
`APIConnectionError`, `APIConnectionTimeoutError`), which are where FR-022 and FR-027 go wrong
hand-written. **Rejected**: built-in `https` only (more code to write and test).

## R4. Reaching `ae-mentor` (FR-004, FR-009, FR-011)

**Decision**: `mcp-client.mjs` reads the `ae-mentor` entry of the `.mcp.json` it's given (the
repo's for the builder; the installed copy's later), resolves `"node"` to the helper's own
`process.execPath` and relative script paths against that file's folder (as `runtime.js` does), and
spawns it with an **allowlisted** environment: `PATH=/usr/bin:/bin:/usr/sbin:/sbin`, `HOME`, `TZ`
(if set), `AE_MENTOR_HOME`, and any `AE_MENTOR_FIXTURE_*` and `AE_MENTOR_TOOLS_DIR` from the
helper's start command. Never the key. It sends `initialize` (protocol `2025-06-18`), keeps the
reply's `instructions` string, sends `notifications/initialized`, then `tools/list`. One server per
lesson, kept for the helper's life; if it exits, the turn ends `start_failed` and the next `send`
starts it again.

**Why**: the server is the same code, call log and fixtures mode the evals measure today; taking
its instructions from its own reply keeps one source (FR-011).

**Watch (verify in T030)**: B1's eval runner starts a new `claude -p` per turn, so `ae-mentor`
restarts every turn there, while the panel keeps one per lesson. A keeps one per case, which
matches the panel. If a multi-turn case differs between runtimes, check this first: anything the
server holds in memory between turns rather than in `session.json` would behave differently.

## R5. Where things go in the request (FR-010, FR-012, FR-013, spec Q5)

**Decision**: render order is tools, system, messages.

- **tools**: the server's tool list in the server's order, filtered to the active skill's
  `allowed-tools` (R6), each `{ name, description, input_schema }` exactly as the server gives
  them, plus the runtime's `Skill` tool only if the skill lists `Skill` (FR-014).
- **system**: three text blocks in fixed order: `preamble.md`; the server's instructions; the
  skill's `SKILL.md` body (bytes after the closing frontmatter `---` line, unedited). Cache
  breakpoint on the last block. Nothing that varies (date, paths, ids).
- **messages**: the learner's and panel's texts verbatim, including a leading `/ease-mentor` or
  `/offset-mentor review` (so the model sees what Claude Code's mentor saw typed; the skill itself
  is already in the system prompt).
- **Hand-over** (`Skill` called with `{ skill, args }`): the helper answers the tool call with a
  short result (`Loaded <skill>.`), then appends a mid-conversation system message holding the new
  skill's body before the next request, and swaps the tool list to the new skill's. Earlier
  messages are never edited. Mid-conversation system messages are supported on Opus 5.5, Sonnet 5.5
  and Haiku 5.5.
- **Fallback placement** (`settings.skill_placement: "message"`): the skill body goes in the first
  user message ahead of the learner's text, the way Claude Code expands a `/skill`. One setting, no
  code change, so the eval engineer can switch if FR-033 shows drift the prompt can't explain.

**Why**: the system prompt is the stable, cacheable spot, and the learner's text can't sit above
the skill. **Rejected**: copying Claude Code's own system prompt (FR-012: not ours, and not an
allowlisted source).

## R6. Which tools a lesson gets (FR-005, FR-008)

**Decision**: exactly the active skill's `allowed-tools` (the `mcp__ae-mentor__` prefix removed)
that the server lists. A call to any other name isn't run; it gets an `is_error` tool result
("That tool isn't available in this lesson."), and the helper logs the name (no input).

**Found while planning**: five of the six B1 runners pass `--allowedTools` lists that include
`read_learner_record`, which those skills' `allowed-tools` no longer list since spec 004 Phase 10
(the snapshot reads the record). On B1 the mentor could still call it; on A it can't. Expected to
matter little (the skills no longer mention it), but if a case diverges and the transcript shows a
`read_learner_record` attempt, this is why. The eval engineer notes it in the equivalence record;
the fix, if any, is the skill's or the runner's owner's call, not the runtime's.

## R7. Thinking, effort and history (FR-015, FR-022, spec Q2)

**Decision**: `thinking` is left at the model's default (adaptive; Opus 5.5 can't turn it off),
`output_config.effort` is always sent from `settings.effort` (Opus 5.5's default is `medium`, so it
is never left implicit). Thinking blocks are kept in the history exactly as returned and never
shown; only `text` blocks reach the panel. The thinking `display` setting matches what T001 finds
Claude Code sends, or the API default if unknown.

**Why**: on Opus 5.5, Sonnet 5.5 and Haiku 5.5 thinking blocks are bound to the conversation, and
an edited history fails the service's history check, so append-only (FR-015) is required, not just
tidy. **Watch**: on Opus 5.5, text written between tool calls can come back as progress-update
thinking blocks rather than text. Claude Code is on the same API, so B1 should see the same; if
A's transcripts show fewer mentor lines before tool calls than B1's, compare the display setting
first (T031).

## R8. Prompt caching (FR-025)

**Decision**: 5-minute cache lifetime. Breakpoints: the end of the system blocks, and the last
content block of the newest message on every request (up to 4 allowed). The turn log records cache
reads and writes per turn (FR-029) so the choice can be checked after SC-001's lessons.

**Why**: the builder's B1 turn log (`panel-turns.jsonl`, 44 turns, 2026-10-07 to 10-19) has 32
gaps between a turn's end and the next send within a lesson: median 20 s, 75th percentile 43 s,
90th 77 s, none over 5 minutes. A 1-hour lifetime would double the cache-write price for nothing.
Re-check after SC-001: if more than 1 in 10 gaps go over 5 minutes, revisit.

**Known cost**: a hand-over (R5) changes the tool list, which sits ahead of the system prompt, so
that one request writes the cache again.

## R9. Streaming into the adapter's events (FR-022)

**Decision**: the loop streams each model step. `content_block_delta` with text →
`text_delta`; a finished text block → `text`; a `tool_use` block's start → `tool_call` (id, name;
`input` added when the block finishes); each tool result → `tool_result` with `ok`, `text`, `json`
(when the text parses) and `images` (`{ data, mimeType }`), as `stream.js` builds them for B1.
Thinking blocks produce no events. `turn_end` carries `ok`, `cost_usd`, `wait_ms`,
`first_event_ms`, `total_ms`, plus `runtime`, `model`, `effort`, token counts by kind and
`other_model`. Fine-grained tool-input streaming is left off: the mentor's tool inputs are a few
fields, and the panel only needs the call's start.

## R10. Errors, refusals and retries (FR-007, FR-027)

| Cause | Detected by | Kind | B1 equivalent |
|---|---|---|---|
| No key stored | R11 read returns nothing; no request made | `not_signed_in` | `not_signed_in` |
| Key rejected | `AuthenticationError` (401); `PermissionDeniedError` (403) | `not_signed_in` | `not_signed_in` |
| Out of credit, spend limit | billing-type error from the service (**verify** the exact type and status, T038) | `out_of_credit` | none |
| Rate limited | `RateLimitError` (429) after the SDK's 2 retries | `rate_limited` | none |
| Overloaded, server error | `InternalServerError` / 529 after retries | `service_busy` | none |
| Can't reach the service | `APIConnectionError`, `APIConnectionTimeoutError` | `offline` | none |
| Safety refusal | `stop_reason: "refusal"` (category logged, never text) | `refused` | none |
| 5 minutes | the turn timer | `timeout` | `timeout` |
| `ae-mentor` won't start or exits | spawn error, `initialize` failure, exit | `start_failed` | `start_failed` |
| 12 model steps | the step counter | none: `turn_end { ok: false }` | Claude Code's `error_max_turns` result → `turn_end { ok: false }` |
| Helper exits | adapter sees the process close | `process_exited` | `process_exited` |

Messages are fixed plain strings chosen by kind (contracts/helper-protocol.md), never built from
service text. Service text that reaches a log is scrubbed of anything shaped like a key
(`sk-ant-…`) first (FR-021).

**Refusal fallback**: `settings.fallbacks: "default"` (server-side fallback beta) is sent, so a
refusal on Opus 5.5 can be answered by another model instead of ending the turn. It needs the beta
`server-side-fallback-2026-07-01` (SDK `betas` on the beta messages call); without it the field is
rejected. Sonnet 5.5 accepts only the `"default"` form, and Haiku 5.5 has no server-side fallback,
so settings validation forces `fallbacks` to `null` when the model is Haiku 5.5 (checked by the
cockpit against the claude-api reference, 2026-10-30). Any turn whose
response model differs from `settings.model` is marked `other_model` (FR-029) and an eval run with
one is flagged. Setting it to `null` turns fallback off with no code change.

## R11. The access key (FR-018 to FR-021)

**Decision**:
- **Panel**: the helper reads the key itself with `/usr/bin/security find-generic-password -s Knack
  -a anthropic-api-key -w` (the item spec 006 FR-004 will write; service `Knack`, account
  `anthropic-api-key`). The key passes only through that child's stdout into the helper's memory.
  The panel never reads it.
- **Evals**: `--runtime a` runners pass the key to the helper only through the helper's start
  command on stdin (not its environment), read from `KNACK_EVAL_API_KEY` in the builder's shell.
  Not `ANTHROPIC_API_KEY`: the B1 mentor and the judge are `claude -p` children of the same runner,
  and Claude Code would switch to that key, changing the judge's billing and maybe its model
  (FR-032). The runners also strip `KNACK_EVAL_API_KEY` from every child's environment (SC-005).
- **Key check** (FR-020): one `models.retrieve(settings.model)` call, which costs nothing and
  changes nothing: works, rejected (401/403), can't reach the service. **Limit, flagged**: a free
  call can't show "out of credit"; the check reports "works" and the first lesson turn reports
  `out_of_credit`. T038 checks whether any free call distinguishes it.
- **Builder setup**: the builder adds the item once with `security add-generic-password -s Knack -a
  anthropic-api-key -w` (prompts for the key; quickstart §1). Writing it for learners is spec 006's
  or 007's.

## R12. The evals on A (FR-030 to FR-036)

**Decision**: a shared `product/evals/lib/runtime-a.mjs` exports `runTurnsOnA(case, env, opts)`:
one helper per case with `AE_MENTOR_HOME`, `AE_MENTOR_FIXTURE_STATE` (and twins where a set uses
them) in its start command; before each turn the runner writes the fixture state file as today,
then sends the turn's text and collects events until `turn_end`. Events map to today's transcript
events (`say` from each `text`; `tool` from `tool_call` + `tool_result` with `input`, `ok`,
`result` = the text parts joined), so `check()`, `renderTranscript()` and `judge()` are untouched.
Each runner gains `--runtime a|b1` (default `b1` until FR-035), results fields from
[contracts/eval-runtime.md](contracts/eval-runtime.md), and a summary line comparing with that
set's named B1 baseline. `--changed`'s hash adds `panel/helper/**` (except tests) and
`settings.json`, `preamble.md`.

**Why**: one module, not six copies of the loop glue; the runners stay where today's checks are.

## R13. Costs and prices (FR-026, SC-004)

**Decision**: `prices.json`, checked 2026-10-30, per million tokens:

| Model | Input | Output | Cache read | Cache write (5 min / 1 h) |
|---|---|---|---|---|
| `claude-opus-5-5` | $4.00 | $20.00 | $0.20 | 1.25× / 2× input |
| `claude-sonnet-5-5` | $2.00 | $10.00 | $0.20 | 1.25× / 2× input |
| `claude-haiku-5-5` | $0.10 (prompts ≤ 100K; $0.50 above) | $0.50 ($2.50 above) | **verify** | 1.25× / 2× input |

A model or token kind missing from the table makes `cost_usd: null` ("unknown"), never 0. A
lesson's cost is the sum of its turns. Thinking tokens bill as output.

## R14. B1 stays as it is (FR-037, SC-009)

**Decision**: `panel.json` gains an optional `runtime` (`"b1"` or `"a"`). Missing means B1 until the
cockpit records that SC-001 to SC-008 passed, then the code default flips to A (T054). On B1,
`config.js` validates exactly as today; on A, `claude_path` isn't required and `runtime.js` isn't
called (FR-017, FR-038). `adapter-claude-code.js`, `stream.js` and `runtime.js` aren't edited.
