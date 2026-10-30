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

**Result (T001, 2026-10-30, `product/evals/README.md` › Runtimes)**: the 2026-10-29 B1 runs were all
`claude-opus-5-5` at effort `medium`, with `thinking: {type: "adaptive", display: "updates"}` and the
`thinking-display-updates-2026-08-18` beta; the judge the same model and effort. Claude Code 2.1.312
for most of the day, 2.1.314 for the rest. Where `medium` comes from is inferred (likely an inherited
`CLAUDE_EFFORT` or the default), so a run from another shell could differ. `settings.json` took these
values (T006).

## R3. The SDK and credentials (spec Q3)

**Decision**: `@anthropic-ai/sdk`, exact version pinned (`"x.y.z"`, no range) with a committed
`package-lock.json`, installed by `npm ci` in `panel/helper/` (`panel/install.sh`, T004). The client
is built with an explicit `apiKey` from R11 and `maxRetries: 2`, `timeout` per request under the
5-minute turn timeout. The helper's own environment is checked at start: **every `ANTHROPIC_*`
variable** is removed before the client is built (their names, never values, logged), so the SDK
can't fall back to a shell variable or a CLI profile on disk. Pinned at `@anthropic-ai/sdk` 1.3.0
(T002).

*Amended 2026-10-30 (review):* the plan named four variables; the build strips all of them, because
the SDK also reads others, such as `ANTHROPIC_LOG` (its own logging) and `ANTHROPIC_CUSTOM_HEADERS`
(extra headers on every request), and the helper is configured only by its start command and
`settings.json` (`panel/helper/lib/key.mjs` `scrubEnv`).

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
starts it again. If it can't start during `start`, the helper replies `error start_failed` and no
`ready`, and each later `send` tries again (as built, `main.mjs`).

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
- **Hand-over** (`Skill` called with `{ skill, args }`, or a message starting with another mentor
  skill's command): the helper answers the tool call with a fixed result ("Loaded <skill>." or
  "Loaded <skill>. Arguments: <args>"; "That skill isn't available." if it can't be loaded), then
  appends a mid-conversation system message holding the new skill's body before the next request.
  The service takes such a message only right after a user message, as the last message or followed
  by an assistant turn, so the body waits until the history ends with a user message; if the reply
  right after it is empty, the body is taken back off the end and waits again (review fix M1).
  Earlier messages are never edited. Mid-conversation system messages are supported on Opus 5.5,
  Sonnet 5.5 and Haiku 5.5.
- **Tools at a hand-over (D2, amended 2026-10-30)**:
  - *As built* (`lib/loop.mjs` `switchTo`): the request's tool list is replaced with the new skill's,
    and from then on every request sends `prefix_mismatch_behavior: "drop_block"` (R10), because the
    replaced list invalidates every reasoning block from before it.
  - *Decided, on Opus 5.5 and Sonnet 5.5* (T060): the first request declares every tool the lesson
    can reach (the server's list plus `Skill`), those outside the starting skill with
    `defer_loading: true`; the tool list then never changes. A hand-over appends a `role: "system"`
    message with a `tool_removal` block for each tool leaving and a `tool_addition` block for each
    tool arriving, each naming the tool by `tool_reference` (beta
    `mid-conversation-tool-changes-2026-07-01`). Documented rules: an added tool must already be
    declared with `defer_loading: true`; a `tool_removal` must sit immediately before an assistant
    message or last in `messages`. The beta's model list includes Opus 5.5 and Sonnet 5.5, not Haiku
    5.5.
  - *Haiku 5.5*: keeps the as-built swap plus `drop_block`.
  - *Open, checked live first in T060*: whether the tool-change blocks can share one system message
    with the skill body's text, and where the `tool_removal` must sit when the body follows it.
  - *Which tools "the lesson can reach"*: every tool the server lists plus `Skill` (one fixed list per
    lesson, so it's the same bytes on every request). A call to a hidden tool gets "That tool isn't
    available in this lesson." as today (FR-005).
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
shown; only `text` blocks reach the panel. The thinking `display` setting matches what T001 found
Claude Code sends: `"updates"` (beta `thinking-display-updates-2026-08-18`), in `settings.json` as
`thinking_display`. The reference documents `"updates"` for Opus 5.5 and Sonnet 5.5, not Haiku 5.5,
so settings validation forces it to `"omitted"` on Haiku 5.5 (review S7, 2026-10-30).

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

**Known cost (corrected 2026-10-30, review S2)**: the plan said a hand-over rewrites the cache once.
That's wrong for the as-built swap: replacing the tool list changes the very front of the prefix, so
that request writes the cache again, and from then on the service drops the invalidated reasoning
blocks (`drop_block`, R10). With `drop_block`, the service drops the first mismatched block and every
reasoning block after it, so what's sent differs from the cached prefix from the first dropped block
on, and the cache can miss from that point, not only once. D2's tool changes (R5, T060) keep the
tool list and history unchanged, so a hand-over on Opus 5.5 and Sonnet 5.5 costs only the new
messages; the swap's cost stays on Haiku 5.5. The turn log's cache reads after a hand-over show
which happened.

## R9. Streaming into the adapter's events (FR-022)

**Decision**: the loop streams each model step. `content_block_delta` with text →
`text_delta`; a finished text block → `text`; `tool_call` (id, name, input) once the whole answer is
in, only for calls that will run: never for a call from an attempt declined before a server-side
fallback (it's dropped by the echo rule, R10), never for an answer cut off at `max_tokens` mid-call,
and never for the hand-over tool's own call, which B1's `stream.js` doesn't emit either (amended
2026-10-30, review S6; the plan had `tool_call` at the block's start). Each tool result → `tool_result` with `ok`, `text`, `json`
(when the text parses) and `images` (`{ data, mimeType }`), as `stream.js` builds them for B1.
Thinking blocks produce no events. `turn_end` carries `ok`, `cost_usd`, `wait_ms`,
`first_event_ms`, `total_ms`, plus `runtime`, `model`, `effort`, `settings_hash`, token counts by
kind, `other_model`, and (added in the build) `steps`, `skill` and `prompt_hash`. Fine-grained tool-input streaming is left off: the mentor's tool inputs are a few
fields, and the panel only needs the call's start.

## R10. Errors, refusals and retries (FR-007, FR-027)

| Cause | Detected by | Kind | B1 equivalent |
|---|---|---|---|
| No key stored | R11 read returns nothing; no request made | `not_signed_in` | `not_signed_in` |
| Key rejected | `AuthenticationError` (401); `PermissionDeniedError` (403) | `not_signed_in` | `not_signed_in` |
| Out of credit, spend limit | billing-type error from the service (**verify** the exact type and status, T038) | `out_of_credit` | none |
| Rate limited | `RateLimitError` (429) after the SDK's 2 retries | `rate_limited` | none |
| Overloaded, server error | `InternalServerError` / 529 after retries; an error event mid-stream of a type the table doesn't list | `service_busy` | none |
| Can't reach the service | `APIConnectionError`, `APIConnectionTimeoutError`; a dropped connection mid-answer (a network error code or undici's wording anywhere in the error's cause chain) | `offline` | none |
| A status the table doesn't list (400, 404, 413 …) | any other `APIError` with a status | `start_failed` (a setup or helper fault, not the learner's) | none |
| Any other error (not from the service, not a network error) | everything else | `start_failed`, logged as `internal_error` | none |
| Answer cut off mid tool call | `stop_reason: "max_tokens"` with a `tool_use` block | none: `turn_end { ok: false }`; the call never runs | none |
| Safety refusal | `stop_reason: "refusal"` (category logged, never text) | `refused` | none |
| 5 minutes | the turn timer | `timeout` | `timeout` |
| `ae-mentor` won't start or exits | spawn error, `initialize` failure, exit | `start_failed` | `start_failed` |
| 12 model steps | the step counter | none: `turn_end { ok: false }` | Claude Code's `error_max_turns` result → `turn_end { ok: false }` |
| Helper exits | adapter sees the process close | `process_exited` | `process_exited` |
| Helper stops answering (added 2026-10-30, as merged) | the adapter's backstop, 30 s past the 5-minute turn timeout; it stops the helper | `process_exited` | none |

Messages are fixed plain strings chosen by kind (contracts/helper-protocol.md), never built from
service text. Service text that reaches a log is scrubbed of anything shaped like a key
(`sk-ant-…`) and of the key itself first (FR-021).

*Amended 2026-10-30 (review S5, `panel/helper/lib/errors.mjs` `classify`):* only network errors are
`offline`. The plan sent every non-API error there, which would tell a learner to check their
internet for a bug in the helper. The billing row stays provisional until T038.

**The history check (amended 2026-10-30, review M2; FR-021a)**: every request sends the beta
`thinking-binding-controls-2026-08-01` with `thinking.block_binding.prefix_mismatch_behavior`:
`"error"` until the lesson's first hand-over, `"drop_block"` after it (`lib/loop.mjs`
`requestParams`). Why on every request: the service enforces the check by default only for accounts
created on or after 2026-08-31; on older accounts (the builder's) a request is checked only if it
sets the field. Without it, an edited history would pass on the builder's account and fail on every
learner's. With the beta, each response lists what the service changed in `input_transformations`;
a non-empty list is logged as each entry's type, reason and path, never text. `block_binding` works
only with adaptive thinking, which every model here uses. After D2 is built, Opus 5.5 and Sonnet 5.5 keep `error` for the whole lesson; `drop_block` stays only for Haiku 5.5's swap fallback (spec resolved question 8).

**The fallback echo rule**: after a mid-answer server-side fallback, the reasoning and tool-call
blocks before the last `fallback` block aren't sent back; text and everything after it are
(`lib/loop.mjs` `echoContent`). This is FR-015's third exception. Cost counts every attempt from
`usage.iterations` when present (`lib/cost.mjs`).

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
