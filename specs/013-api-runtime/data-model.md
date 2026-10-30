# Data Model: Option A Runtime

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

Shapes the helper, the panel and the eval runners share. Spec 003's data model still holds for
everything not listed here.

## Runtime settings (`panel/helper/settings.json`, repo; FR-028)

| Field | Type | First value | Rule |
|---|---|---|---|
| `version` | 1 | 1 | Other versions refused |
| `model` | string | `claude-opus-5-5` | Must have a row in the price table, else the helper refuses to start |
| `effort` | `low`…`max` | from T001 (R2) | Always sent |
| `cache_ttl` | `5m` \| `1h` | `5m` (R8) | |
| `skill_placement` | `system` \| `message` | `system` (Q5, R5) | `message` is the fallback |
| `max_steps` | integer | 12 | B1's `--max-turns 12` |
| `turn_timeout_ms` | integer | 300000 | B1's timeout |
| `fallbacks` | `"default"` \| null | `"default"` (R10) | |

A **settings hash** (sha256 of this file, `preamble.md` and the helper's `lib/` and `main.mjs`) is
reported in `ready` and recorded in eval results and turn log lines.

## Panel config (`panel.json`, learner home): one new field

`runtime`: `"b1"` | `"a"`, optional. Missing → B1 until T054 flips the code default (FR-037). On
`"a"`, `claude_path` isn't required; `node_path` and `repo_path` still are.

## Lesson prompt (in memory; FR-010 to FR-013)

`{ tools[], system[3], prompt_hash }`. `system` = preamble, server instructions, skill body, in that
order; `tools` = the server's tools filtered by `allowed-tools`, plus `Skill` if listed. The
`prompt_hash` (sha256 over the serialized tools and system) goes in eval results. Rebuilt only at
lesson start and at a hand-over.

## Lesson conversation (`panel-conversation.json`, learner home; FR-015, FR-023, FR-024)

```json
{ "version": 1, "session_id": "<uuid, same as panel-session.json's>", "skill": "ease-mentor",
  "settings_hash": "…", "model": "claude-opus-5-5", "messages": [ … ] }
```

- `messages` are the API messages exactly as sent and received, in order, including thinking
  blocks, tool uses and tool results, and any mid-conversation system message from a hand-over.
- Image data in tool results is replaced on disk by `{ "frame_file": "panel-conversation-frames/<name>.png" }`
  and restored from the file when the conversation is loaded.
- Written (temp file and rename) only after a complete exchange: a turn that ends mid-answer saves
  nothing from that turn.
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
