# Contract: Mentor adapter

The one seam between the panel and whatever runs the mentor (spec › Assumptions, `decisions/005`).
The panel UI talks only to this interface. Today it's backed by headless Claude Code (R1, R2).
Moving to the direct API (option A) means writing a second adapter with the same interface.

Module: `panel/lib/adapter-claude-code.js` (CommonJS, no dependencies).

## Interface

```text
createAdapter(config, { spawn, now }) → adapter
  config: Panel config (data-model) plus { home }
  spawn, now: injected so tests can fake the process and the clock

adapter.start({ resumeSessionId? }) → sessionId
  Starts the process. New lessons get a fresh uuid; resumed lessons pass the stored id.

adapter.send(text, kind) → void
  Sends one user message. Throws BUSY if a turn is in flight (R7).

adapter.on(event, handler)
adapter.stop() → void
  Ends the process. Safe to call twice. Called on panel unload.
```

## Events

Everything the panel needs, and nothing tied to Claude Code's wire format.

| Event | Payload | When |
|---|---|---|
| `turn_start` | `{ kind, at }` | `send` accepted |
| `text_delta` | `{ text }` | Partial words from the mentor (first one stops the SC-004 clock) |
| `text` | `{ text }` | A complete text block. Replaces the deltas shown for that block |
| `tool_call` | `{ id, name }` | The mentor called a tool. `name` without the `mcp__ae-mentor__` prefix |
| `tool_result` | `{ id, name, ok, json?, text?, images[] }` | `json` when the text parses as JSON. `images` as `{ data, mimeType }` |
| `turn_end` | `{ ok, cost_usd?, wait_ms, first_event_ms, total_ms }` | The stream's `result` event, or the timeout. `wait_ms` to the first `text_delta`; `first_event_ms` to the first `text_delta` or `tool_call` |
| `error` | `{ kind, message }` | See below. A turn in flight also gets `turn_end { ok: false }` |
| `exit` | `{ code }` | The process ended |

**`error.kind`**: `not_configured` (no or bad `panel.json`), `not_signed_in`, `start_failed`,
`timeout` (5 min, R7), `process_exited`, `bad_stream` (a line that isn't JSON, logged and skipped
unless it's the only output).

## Claude Code stream mapping (adapter internals)

Verified in the spike task. Only these message types are read. Everything else is ignored.

| Stream message | Becomes |
|---|---|
| `stream_event` with a text delta | `text_delta` |
| `assistant` message: `text` block | `text` |
| `assistant` message: `tool_use` block | `tool_call` (id → name kept for the result) |
| `user` message: `tool_result` block | `tool_result` (text parts joined; `image` parts → `images`) |
| `result` | `turn_end` (`total_cost_usd` → `cost_usd`); `is_error` with an auth message → `error not_signed_in` |

Launch arguments (R2), run with `cwd = repo_path` and an environment of the panel's environment
plus `PATH` = `dirname(claude_path):dirname(node_path):/usr/bin:/bin:/usr/sbin:/sbin` (R3):

```text
--print --input-format stream-json --output-format stream-json --verbose
--include-partial-messages --session-id <uuid> | --resume <uuid>
--mcp-config .mcp.json --strict-mcp-config --tools ToolSearch
--allowedTools mcp__ae-mentor__read_learner_record mcp__ae-mentor__snapshot_project
  mcp__ae-mentor__preview_frame mcp__ae-mentor__set_ease mcp__ae-mentor__diff_since_last
  mcp__ae-mentor__record_lesson
--max-turns 12
```

## Guarantees

- The adapter never reads or writes the AE project, `session.json`, or `learner.json`.
- The adapter never adds tools beyond the six above, and never enables Bash, file or web tools.
- One turn at a time.
- The child process can always find `node`, so the `ae-mentor` server starts inside AE (R3).
- `stop()` leaves no child process running.
