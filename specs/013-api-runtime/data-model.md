# Data Model: Option A Runtime

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

Shapes the helper, the panel and the eval runners share. Spec 003's data model still holds for
everything not listed here.

## Runtime settings (`panel/helper/settings.json`, repo; FR-028)

| Field | Type | First value | Rule |
|---|---|---|---|
| `version` | 1 | 1 | Other versions refused |
| `model` | string | `claude-opus-5-5` | Must have a row in the price table, else the helper refuses to start |
| `effort` | `low`…`max` | `medium` (T001, R2) | Always sent (`output_config.effort`) |
| `thinking_display` | `omitted` \| `summarized` \| `updates` | `updates` (B1's, T001) | Forced to `omitted` on Haiku 5.5 (R7). Needs beta `thinking-display-updates-2026-08-18` when `updates` |
| `cache_ttl` | `5m` \| `1h` | `5m` (R8) | Sent on every breakpoint as `ttl` |
| `skill_placement` | `system` \| `message` | `system` (Q5, R5) | `message` is the fallback |
| `max_steps` | integer 1–100 | 12 | B1's `--max-turns 12` |
| `turn_timeout_ms` | integer | 300000 | B1's timeout; also each request's SDK timeout |
| `max_tokens` | integer 1–128000 | 32000 | Per request (added in the build) |
| `fallbacks` | `"default"` \| null | `"default"` (R10) | Forced to null on Haiku 5.5. Needs beta `server-side-fallback-2026-07-01` when set |

Every field is required and an unknown field is refused. Always sent, whatever the settings: beta
`thinking-binding-controls-2026-08-01` with `thinking.block_binding` (R10, FR-021a). After D2 (T060),
Opus 5.5 and Sonnet 5.5 also send beta `mid-conversation-tool-changes-2026-07-01`.

A **settings hash** (sha256 of this file, `preamble.md`, `skill-tool.json`, `main.mjs` and the
helper's `lib/*.mjs`, each with its label and length) is reported in `ready` and recorded in eval
results and turn log lines. It covers everything that decides what the model gets, including the
runtime text FR-012 allowlists. `prices.json` isn't in it (it changes cost, not the request); the
eval runners' `--changed` hash adds it (contracts/eval-runtime.md).

## Panel config (`panel.json`, learner home): one new field

`runtime`: `"b1"` | `"a"`, optional. Missing → B1 until T054 flips the code default (FR-037). On
`"a"`, `claude_path` isn't required; `node_path` and `repo_path` still are.

## Lesson prompt (in memory; FR-010 to FR-013)

`{ tools[], system[3], prompt_hash }`. `system` = preamble, server instructions, skill body, in that
order (two blocks with `skill_placement: "message"`); `tools` = the server's tools filtered by
`allowed-tools`, plus `Skill` (from `skill-tool.json`) if listed. After D2 (T060) on Opus 5.5 and
Sonnet 5.5, `tools` declares every server tool plus `Skill`, those the active skill doesn't list with
`defer_loading: true`, and stays the same for the whole lesson. The `prompt_hash` (sha256 over the
serialized tools, system without cache markers, placement and skill name) goes in eval results and
on each `turn_end`. Rebuilt only at lesson start and at a hand-over.

## Lesson conversation (`panel-conversation.json`, learner home; FR-015, FR-023, FR-024)

```json
{ "version": 1, "session_id": "<uuid, same as panel-session.json's>", "skill": "ease-mentor",
  "settings_hash": "…", "model": "claude-opus-5-5", "messages": [ … ] }
```

- `messages` are the API messages exactly as sent and received, in order, including thinking
  blocks, tool uses and tool results, and any mid-conversation system message from a hand-over
  (the new skill's body and, after D2, its tool changes).
- **Complete exchange** (FR-015, D1, amended 2026-10-30): an assistant message with no tool use, or
  an assistant message with tool uses plus the user message holding a result for every one of them.
  The history is only ever the learner's and panel's messages plus complete exchanges (and the
  hand-over system messages between them). When a turn fails, the incomplete tail after the last
  complete exchange is taken back; complete exchanges from the failed turn stay, so a demonstration
  or `record_lesson` that ran is still there next turn. If nothing in the failed turn completed, the
  learner's message comes off too (spec resolved question 6). If a call in an answer already ran, that answer is completed instead: each call that didn't run gets the error result "That call didn't run." (resolved question 7). The only other removal: a hand-over's skill-body
  system message taken back when the reply right after it is empty (review fix M1).
- Image data in tool results is replaced on disk by `{ "frame_file": "panel-conversation-frames/<name>.png" }`
  and restored from the file when the conversation is loaded.
- Written (temp file and rename) after each complete exchange: a turn that fails mid-answer saves
  its complete exchanges and nothing of its incomplete tail.
- Unreadable, another version, another `session_id`, or another `model` → not continued (spec 003's
  rule: say nothing alarming). A new lesson deletes the file and the frames folder.

## Price table (`panel/helper/prices.json`, repo; FR-026)

`{ "checked": "2026-10-30", "models": { "<id>": { "input", "output", "cache_read", "cache_write_5m", "cache_write_1h", "long_prompt"? } } }`,
dollars per million tokens. `long_prompt` (Haiku 5.5) holds the prices above 100K prompt tokens.

## Turn log entry (`panel-turns.jsonl`): new fields (FR-029)

Added to spec 003's entry, still with no text: `runtime` (`b1` | `a`; missing on old lines = `b1`),
`model` (the model that answered), `effort`, `settings_hash`, `tokens` `{ input, cache_write,
cache_read, output }`, `other_model` (true when the answer came from a model other than settings'),
`error_kind` (or null), `start_ms` (A, a lesson's first turn only: helper spawn to ready, for
`decisions/010`'s start-up signal). B1 lines get `runtime: "b1"` only.

## Eval results: new fields (FR-029, FR-030, FR-033)

Top level: `runtime`, `model`, `effort`, `settings_hash`, `prompt_hash` per skill, `other_model_turns`
(count), `baseline` `{ file, passed, total }` and `vs_baseline` `{ b1_pass_a_fail[], b1_fail_a_pass[] }`.
Old files without `runtime` are B1.

## Equivalence record (each set's `README.md` › Option A; FR-033, FR-035)

Per set: the A results file, the B1 baseline file it's compared with, pass rates, each case that
passed on B1 and failed on A with its `--repeat 3` result, and its outcome (`noise`, `fixed in
<commit>`, or `accepted by the builder on <date>: <reason>`). Once all six meet FR-033: the A
baseline (file, model, effort, cost).

## Helper protocol messages

See [contracts/helper-protocol.md](contracts/helper-protocol.md).
