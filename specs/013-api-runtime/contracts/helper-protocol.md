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
| `start` | `session_id`, `resume` (bool), `home`, `mcp_config` (path to `.mcp.json`), `skills_dir`, `fixture_env` (object, evals only: passed to `ae-mentor`), `key` (evals only, R11), `request_log` (path, evals only), `settings_file` (evals only; default `panel/helper/settings.json`), `base_url` (tests only, see below), `keychain` (tests only, `false` only, with a local `base_url`; added 2026-10-30) | Read settings, read the key, start `ae-mentor`, load the conversation if `resume`. Replies `ready` or `error`. `session_id`, `mcp_config` and `skills_dir` are required. A second `start` gets `error bad_command` |
| `send` | `text`, `kind` | One turn. Refused with `error { kind: "busy" }` if a turn is in flight |
| `stop` | | End the turn in flight (no save), stop `ae-mentor`, exit 0 |
| `key_check` | `key`? | Needs no `start`. Replies `key_status`. Makes one free request (R11) |

A `start` without `key` makes the helper read the Keychain item (service `Knack`, account
`anthropic-api-key`), unless it has `keychain: false` (tests only, below). The key is never echoed
in any reply.

*Amended 2026-10-30 (review; must be in before T017, the A adapter):*

- **`base_url` is test-only.** It points the SDK at T005's fake service (`panel/helper/test/`,
  `panel/dev/drive.js --fault`). It must be `http://127.0.0.1` or `http://localhost` with an optional
  port, else `start` fails with `start_failed`, so the key can't be sent anywhere else by mistake.
  **The adapter never sends it**; neither do the eval runners.
- **A missing key doesn't fail `start`.** The helper still replies `ready`; each `send` re-reads the
  Keychain (or the start command's key) and, while there's none, ends with `error not_signed_in` and
  `turn_end { ok: false }` without calling the service. So a key added after the panel opened works
  on the next send.
- **`ae-mentor` can't start during `start`**: the helper replies `error start_failed` and **no
  `ready`**; it stays started, and each later `send` tries to start the server again. The adapter
  must treat that `error` as the end of starting (no `start_ms`), not wait for `ready`.
- **`resume`** is accepted but, until T043 and T044, logged and ignored: the lesson starts fresh
  (spec 003's rule: say nothing alarming).
- **`send` before a successful `start`**: `error start_failed` and `turn_end { ok: false }`.

*Amended 2026-10-30 (after the `013-adapter` merge, `5963fef`; review S3, S5):*

- **`keychain: false` is test-only.** A `start` with `keychain: false` never reads the Keychain: the
  key is the start command's `key`, or none. It's accepted only together with a `base_url` (which
  must be local, above); `keychain: false` without one, or any other `keychain` value, fails `start`
  with `start_failed`. `panel/dev/drive.js --fault` and the panel's tests send it, so no fault run
  or test reads the real Keychain or raises its access dialog. **The adapter never sends it**;
  neither do the eval runners.
- **The start command's own errors carry `during: "start"`**: a missing required field, a
  `base_url` or `keychain` that isn't allowed, unreadable settings or runtime text, and `ae-mentor`
  failing to start. The adapter uses it to tell the start's error from a turn's. A second `start`'s
  `bad_command` and the error for a `send` before a successful `start` don't carry it.

## Events (helper → adapter)

The adapter contract's events, unchanged in meaning, plus fields the panel may ignore:

| Event | Payload |
|---|---|
| `ready` | `{ session_id, runtime: "a", model, effort, settings_hash, skill, settings_file? }` (`skill` is null until the first message loads one; `settings_file` only when it isn't the default; helper only, the adapter doesn't re-emit it) |
| `turn_start` | `{ kind, at }` |
| `text_delta` | `{ text }` |
| `text` | `{ text }` |
| `tool_call` | `{ id, name, input }`, sent once the model's whole answer is in, only for calls that will run: never for a call from an attempt declined before a fallback or an answer cut off mid-call, and never for the hand-over tool (research R9, amended 2026-10-30). A call the turn's failure leaves answered with a fixed text ("That call didn't run." or "That call didn't finish, so it may or may not have changed the project.") still got its `tool_call` and gets no `tool_result` (amended 2026-10-30, review S1); a call to a tool that isn't available gets both |
| `tool_result` | `{ id, name, ok, json?, text?, images[] }` |
| `turn_end` | `{ ok, cost_usd, wait_ms, first_event_ms, total_ms, kind, runtime, model, effort, settings_hash, tokens, other_model, steps, skill, prompt_hash }`. `steps`: model requests in the turn (12 when it hit the limit); `skill`: the active skill after the turn (null if none loaded); `prompt_hash`: the lesson prompt's hash (data-model). `cost_usd` is `null` when a request was billed but its counts never came, and `0` when no request was made |
| `error` | `{ kind, message, during? }` (`during: "start"` only on the start command's own errors, above) |
| `key_status` | `{ status: "works" \| "rejected" \| "out_of_credit" \| "offline" \| "no_key" }` |
| `skill_loaded` | `{ skill }` on a hand-over, by the hand-over tool or by a message starting with another mentor skill's command (log only) |

The adapter times `wait_ms` and `first_event_ms` itself from the events it sees, as B1's adapter
does, so the SC-004 clock includes the helper's own start. `exit` comes from the process closing.

## The A adapter against spec 003's contract (added 2026-10-30, as merged)

Spec 003's `contracts/mentor-adapter.md` is unchanged; this spec doesn't edit it. What
`panel/lib/adapter-api.js` emits beyond it, all ignorable by a panel written to 003's contract:

- **`turn_end`**: 003's `{ ok, cost_usd, wait_ms, first_event_ms, total_ms }` (its own timings, as
  above), plus `kind`, the helper's extras passed on as they come (`runtime`, `model`, `effort`,
  `settings_hash`, `tokens`, `other_model`, `steps`, `skill`, `prompt_hash`), `error_kind` (the
  kind of the turn's shown `error`, or null) and, on the lesson's first turn only, `start_ms`
  (spawn to the helper's `ready`; absent when starting ended in an error). The helper's own
  `turn_end` carries neither `error_kind` nor `start_ms`; the adapter adds them.
- **`tool_call`** carries `input` (003 lists `{ id, name }`).
- **`skill_loaded`** and **`key_status`** are passed on; `ready` and the helper's `turn_start` are
  not (the adapter sends its own `turn_start` when it accepts a `send`).
- **`error`** is re-emitted as `{ kind, message }` (no `during`). Kinds beyond 003's: the A kinds in
  the table below. `busy`, `bad_command` and `not_implemented` are logged, never emitted. An
  `error` with `during: "start"` ends starting; if a turn is already waiting, it isn't shown (the
  turn reports its own error).
- **The backstop** (review S6): if the helper hasn't ended a turn 30 seconds after its own
  5-minute timeout (5 min 30 s from `send`), the adapter emits `error process_exited` and
  `turn_end { ok: false, error_kind: "process_exited" }`, and stops the helper (SIGTERM, then
  SIGKILL after 3 s). The lesson is over: the message says to start it again, and the panel offers
  Start once `exit` arrives.
- **The helper's process failing to spawn**: `error start_failed`, and `turn_end { ok: false }` if
  a turn was waiting.

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
| `bad_command` | never shown to a learner: an unknown command, a line that isn't JSON (logged, never echoed), or a second `start`. Empty message |
| `not_implemented` | never shown to a learner: `key_check` with a key present, until T037 builds the real check (then this kind goes away). Empty message |

`start_failed` also covers a request the service rejects with a status the table in research R10
doesn't list (400, 404, 413 …) and any error in the helper that isn't from the service or the
network (logged as `internal_error`). Only network errors are `offline` (amended 2026-10-30).

A turn that hits 12 model steps ends with `turn_end { ok: false }` and no `error`, as on B1; the
panel's existing "The mentor stopped before finishing. Try again." covers it.

## Guarantees

- Neither the helper nor the adapter reads or writes the AE project, `session.json` or
  `learner.json`. Only `ae-mentor` does.
- The model gets only the allowlisted inputs (FR-016) and can call only the active skill's tools
  plus `Skill` where listed (FR-005, FR-008); other tools may be declared hidden (FR-014, D2).
- The key is held in the helper's memory only, never in `ae-mentor`'s environment, any event, the
  conversation file, logs or the request log (FR-019, FR-021).
- With `request_log` in the start command (evals only), every request body is appended as one JSON line, without the key and with image data replaced by its length.
- Log lines go to the helper's stderr as JSON, scrubbed of the key and anything key-shaped. They hold
  names, codes, kinds and the service's own error text (scrubbed, cut to 300 characters) for the
  builder. The helper never logs the learner's words, a tool's input or a response's text itself;
  the service's error text is logged as it came, and could quote part of a request. The service's
  `input_transformations` are logged as type, reason and path only.
- The helper removes every `ANTHROPIC_*` variable from its own environment at start (research R3).
- `stop()` leaves no helper and no `ae-mentor` process running.
