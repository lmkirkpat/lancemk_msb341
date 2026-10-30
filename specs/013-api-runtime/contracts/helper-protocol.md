# Contract: the option A helper and its adapter

The A adapter (`panel/lib/adapter-api.js`) has the same interface and events as
`specs/003-mentor-panel/contracts/mentor-adapter.md` (`createAdapter`, `start`, `send`, `stop`,
`on`, `busy`). Behind it is one helper process per lesson, `panel/helper/main.mjs`, speaking JSON
lines. The eval runners and `panel/helper/dev/chat.mjs` speak the same protocol.

## Starting the helper

`<node_path> panel/helper/main.mjs` with `cwd` = `panel/helper/`, `stdio` piped, and an environment
of only `PATH=/usr/bin:/bin:/usr/sbin:/sbin`, `HOME`, `TZ` (if set). Nothing else is inherited.

## Commands (adapter → helper, one JSON object per line)

| Command | Fields | Effect |
|---|---|---|
| `start` | `session_id`, `resume` (bool), `home`, `mcp_config` (path to `.mcp.json`), `skills_dir`, `fixture_env` (object, evals only: passed to `ae-mentor`), `key` (evals only, R11), `request_log` (path, evals only), `settings_file` (evals only; default `panel/helper/settings.json`) | Read settings, read the key, start `ae-mentor`, load the conversation if `resume`. Replies `ready` or `error` |
| `send` | `text`, `kind` | One turn. Refused with `error { kind: "busy" }` if a turn is in flight |
| `stop` | | End the turn in flight (no save), stop `ae-mentor`, exit 0 |
| `key_check` | `key`? | Needs no `start`. Replies `key_status`. Makes one free request (R11) |

A `start` without `key` makes the helper read the Keychain item (service `Knack`, account
`anthropic-api-key`). The key is never echoed in any reply.

## Events (helper → adapter)

The adapter contract's events, unchanged in meaning, plus fields the panel may ignore:

| Event | Payload |
|---|---|
| `ready` | `{ session_id, runtime: "a", model, effort, settings_hash, skill? }` (helper only; the adapter doesn't re-emit it) |
| `turn_start` | `{ kind, at }` |
| `text_delta` | `{ text }` |
| `text` | `{ text }` |
| `tool_call` | `{ id, name, input? }` (`input` when the block is complete) |
| `tool_result` | `{ id, name, ok, json?, text?, images[] }` |
| `turn_end` | `{ ok, cost_usd, wait_ms, first_event_ms, total_ms, kind, runtime, model, effort, settings_hash, tokens, other_model }` |
| `error` | `{ kind, message }` |
| `key_status` | `{ status: "works" \| "rejected" \| "out_of_credit" \| "offline" \| "no_key" }` |
| `skill_loaded` | `{ skill }` on a hand-over (log only) |

The adapter times `wait_ms` and `first_event_ms` itself from the events it sees, as B1's adapter
does, so the SC-004 clock includes the helper's own start. `exit` comes from the process closing.

## Error kinds and the panel's wording

Every message is fixed text chosen by kind, with no status code, path, tool name or key
(FR-027, spec 007 FR-058). Spec 007's `err-mentor` and setup screens replace this wording later.

| Kind | Panel message (CEP panel, until spec 007) |
|---|---|
| `not_signed_in` | "The mentor can't start: its access key is missing or isn't working. Check setup, then start the lesson again." |
| `out_of_credit` | "The mentor's access key has run out of credit or hit its spending limit. Check setup or top it up, then try again." |
| `rate_limited` | "The mentor is getting too many requests right now. Wait a minute, then try again." |
| `service_busy` | "The mentor's service is busy right now. Try again in a moment." |
| `offline` | "The mentor can't reach the internet. Check your connection, then try again." |
| `refused` | "The mentor couldn't answer that. Try rephrasing." |
| `timeout` | (as B1) "The mentor took more than 5 minutes to answer, so the panel stopped waiting. Try again." |
| `start_failed` | "The mentor couldn't start. Close and reopen the panel; if it happens again, check setup." |
| `process_exited` | "The mentor stopped unexpectedly. Start the lesson again." |
| `busy` | not shown (the panel already blocks a second send) |

A turn that hits 12 model steps ends with `turn_end { ok: false }` and no `error`, as on B1; the
panel's existing "The mentor stopped before finishing. Try again." covers it.

## Guarantees

- Neither the helper nor the adapter reads or writes the AE project, `session.json` or
  `learner.json`. Only `ae-mentor` does.
- The model gets only the allowlisted inputs (FR-016) and only the skill's tools plus `Skill` where
  listed (FR-005, FR-008).
- The key is held in the helper's memory only, never in `ae-mentor`'s environment, any event, the
  conversation file, logs or the request log (FR-019, FR-021).
- With `request_log` in the start command (evals only), every request body is appended as one JSON line, without the key and with image data replaced by its length.
- `stop()` leaves no helper and no `ae-mentor` process running.
