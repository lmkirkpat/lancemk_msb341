# Research: Mentor Panel in After Effects

Phase 0 for `specs/003-mentor-panel/plan.md`. Each item: decision, rationale, alternatives.
Facts about the existing code come from `mentor/`, `bridge/`, and `product/evals/easing/run.mjs`
as of `a4e8446`. CLI facts come from `claude --help` on Claude Code 2.1.289.

## R1. One long-lived Claude Code process per panel session

**Decision:** the panel starts one headless Claude Code process when a lesson starts and keeps it
running until the lesson ends or the panel closes. It talks to it over stdin and stdout with
`--print --input-format stream-json --output-format stream-json --verbose
--include-partial-messages`. Each button press or question is one user message written to stdin.
The process gets a fixed `--session-id <uuid>` so it can be resumed later (R6).

**Rationale:** the main risk in `decisions/005` is slow turns (SC-004, 10 s to the first words).
Starting a fresh `claude -p --resume` for every turn (what the evals do) pays CLI start-up and MCP
server start-up on every click. A long-lived process pays them once per lesson. Partial messages
let the panel show words as they're written, so "the reply starts appearing" is measurable.

**Alternatives considered:**
- *A new `claude -p --resume <id>` per turn* (the eval runner's pattern): simplest, and identical
  to what the evals test. But it starts up on every click. It stays as the fallback if R1's
  stream input misbehaves in the spike (T-spike in tasks).
- *Claude Agent SDK in the panel:* adds an npm dependency (Principle V), and its supported auth for
  products is an API key, which is `decisions/005` option A territory.

**To verify in the first task (spike):** that `/ease-mentor` sent as the first stdin message
starts the skill the same way it does as a `-p` argument, and the exact line format for a user
message (`{"type":"user","message":{"role":"user","content":"..."}}`).

### Spike result (2026-10-05, tasks T005)

`panel/dev/drive.js` (since kept as `panel/dev/record-fixtures.js`) ran three turns through **one** Claude Code 2.1.289 process in fixture mode
(`before`, `before`, `after-demo`). Raw stdout is in `panel/test/fixtures/stream-*.jsonl`
(home folder and session ids scrubbed).

- **(a) Input line:** `{"type":"user","message":{"role":"user","content":"<text>"}}` plus a
  newline. Works.
- **(b) `/ease-mentor` on stdin** starts the skill: `read_learner_record`, then `snapshot_project`,
  then the opening, as in the evals.
- **(c) Stream shapes:**
  - Text deltas: `stream_event` › `event.type: "content_block_delta"`, `delta.type: "text_delta"`.
    Thinking and tool-input deltas use the same envelope with `thinking_delta`, `signature_delta`
    and `input_json_delta`, and are ignored.
  - Tool calls: `assistant` messages with `tool_use` blocks. Tool results: `user` messages with
    `tool_result` blocks.
  - `preview_frame` results are `[image, text, text]` content.
  - `ToolSearch` results are `tool_reference` blocks and are ignored.
  - Each turn ends with one `result` message. It also includes `system/init`, `system/status`,
    `system/thinking_tokens` and `rate_limit_event` lines, which are all ignored.
- **(d) Timing:**

  | Turn | First text | First text or tool call | Turn end | `total_cost_usd` |
  |---|---|---|---|---|
  | `/ease-mentor` | 13.1 s | 5.0 s | 13.1 s | 0.129 |
  | `Show me how first.` | 18.7 s | 4.1 s | 18.7 s | 0.189 |
  | `I'm done. Check my work.` | 9.7 s | 2.2 s | 9.7 s | 0.219 |

  `total_cost_usd` grows across the process, so it's **cumulative per process**. The adapter
  reports each turn's cost as the difference from the previous turn. The whole three-turn lesson
  cost about $0.22, well under the $0.50–$1.50 estimate in `decisions/005`.
- **(e) One process, several turns:** works. Turns 2 and 3 start in under 10 ms, with no
  re-initialization delay.

**What this means for SC-004.** Start-up isn't the slow part. The mentor calls its tools and thinks
first, then writes all its words at the end, so the first words come 10–19 s after a click (1 of 3
turns under 10 s). The first sign of activity (a tool call) always came within 5 s. As written
(first words), SC-004 fails on this evidence.

**Decision (builder, 2026-10-05): option A.** The panel shows a plain status line for each mentor
tool call as it happens (`panel/lib/activity.js`, tasks T014). SC-004 now measures the first
visible activity, which all three spike turns met in under 5 s. First words are still logged for
the usage notes. Rejected: (B) changing the skill to speak before using tools, or lowering effort,
which changes the mentor and needs a full eval re-run; (C) keeping the first-words criterion and
recording a failure.

## R2. The same mentor, the same limits as the evals

**Decision:** the panel launches Claude Code with the eval runner's flags so the mentor in the
panel is the mentor the evals measure:

- `cwd` = the repo root, so `SKILL.md` and `.mcp.json` load as today.
- `--mcp-config .mcp.json --strict-mcp-config`: only the `ae-mentor` server.
- `--tools ToolSearch`: no Bash, Edit, Write, or web tools. The panel's mentor can't touch files
  or run commands.
- `--allowedTools` the six `mcp__ae-mentor__*` tools: no permission prompts, which a headless
  process couldn't answer anyway.
- `--max-turns 12` per user message, as in the evals.

**Rationale:** spec 002's evals (15/16) only describe the panel if the harness matches. These flags
also mean the panel's mentor has strictly less power than an interactive Claude Code session.

**Remaining difference:** the evals resume per turn, and the panel keeps one process. The
conversation the model sees is the same. The quickstart compares a panel lesson with an eval run
of the same steps (quickstart §5).

## R3. Finding Claude Code and the repo from inside AE

**Decision:** a new `panel/install.sh` writes `~/Library/Application Support/AEMentor/panel.json`
with `claude_path` (from `command -v claude`), `node_path` (from `command -v node`) and
`repo_path` (the repo root). The panel reads it at start. If any is missing or not usable, the
panel shows a plain message with the fix (FR-015) and starts nothing.

The adapter spawns Claude Code with `PATH` set to the folders of `claude_path` and `node_path`,
then `/usr/bin:/bin:/usr/sbin:/sbin`. Claude Code starts the mentor through `.mcp.json` as
`"command": "node"`, so without this the `ae-mentor` server can't start inside AE and the mentor
has no tools. On the builder's Mac, `node` is in `/opt/homebrew/bin` and `claude` in
`~/.local/bin`, and neither is on a Dock-launched app's `PATH`.

**Rationale:** apps opened from the Dock don't get the shell's `PATH`, so a bare `claude` (or the
`node` that `.mcp.json` names) would fail inside AE even though it works in Terminal. The repo
path tells Claude Code which skill and `.mcp.json` to load. Terminal-run tests can't catch this,
so a check inside CEP runs before the UI is built (tasks T004).

**Sign-in:** if Claude Code isn't signed in, the process ends with an error result. The panel maps
it to "Claude Code isn't signed in. Open Terminal and run `claude` once to sign in." Other start
failures show the first line of the error and point to `node panel/dev/drive.js` for detail.

**Alternatives considered:** reading the login shell's `PATH` at runtime (slow, and it depends on
the user's shell setup); asking the user to type paths in the panel (more UI for one user).

## R4. A separate extension, not part of the bridge

**Decision:** the panel is its own CEP extension bundle (`com.aementor.panel`, "AE Mentor" in
Window > Extensions) in a new top-level `panel/` folder, with its own `install.sh` and
`uninstall.sh` that symlink it next to the bridge. `bridge/` doesn't change.

**Rationale:** constitution 1.1.0 › II keeps the bridge a thin pipe. Putting the panel in its own
bundle keeps the pipe's code and manifest untouched (no new drift from upstream in
`bridge/UPSTREAM.md`), and the panel can be rebuilt on UXP without touching the bridge.

**Alternatives considered:** a third extension in the bridge's bundle (one install, but UI code
in the pipe's folder and manifest); replacing the bridge's status panel (same problem, and it
loses the bridge's own diagnostics).

## R5. Where each part of the panel gets its data

**Decision:** the mentor's words are the only thing the panel shows that comes from the model.
Everything else comes from data:

| Panel part | Source | Spec |
|---|---|---|
| Mentor's words | text deltas and text blocks in the stream | FR-003 |
| Frames | `preview_frame` tool results: image blocks (base64 PNG) in the stream | FR-004 |
| Check list | the JSON in the latest successful `diff_since_last` tool result | FR-007 |
| Demo button label | whether a `set_ease` call in this lesson succeeded | FR-006 |
| Stage | `set_ease` and `diff_since_last` results (data-model › Lesson stage) | FR-009 |
| Path, memory | `learner.json`, read from disk; re-read after `record_lesson` succeeds | FR-010, FR-011 |

**Rationale:** FR-007 says the list must come from the comparison result, not the mentor's
wording. The same rule applied to stage and memory means the panel can't drift from what really
happened, and moving to option A later only changes where the events come from.

**Not used:** `session.json` (the server's lesson state). The panel doesn't read the server's
internal files. The tool results in the stream carry everything it needs.

## R6. Continuing after the panel is reopened

**Decision:** the panel keeps a small display log in
`AEMentor/panel-session.json`: the Claude session id, the bridge's start time, the lesson's
derived state (stage, demo made, last check list), the messages and frames shown, and whether the
lesson ended. On reopen, if a lesson didn't end and the bridge's start time is unchanged (the same
AE session), the panel offers **Continue lesson**. Continuing redraws from the log and starts
Claude Code with `--resume <session id>`. Otherwise it offers a new lesson.

**Rationale:** CEP unloads a panel's page when it's closed, which ends its child process. The
display log and Claude Code's own session history are enough to pick up where it stopped. The
bridge's start time (from its status endpoint, which returns no project data) is a simple "same
AE session" test, since the bridge restarts with AE.

**Known limit:** the bridge's own status panel has a Restart button that restarts the bridge but
not AE. After using it, the start time changes and Continue lesson isn't offered, even though AE
didn't restart. That's acceptable for one user and noted here, not handled.

**Frames in the log:** stored as file paths in the frames temp folder, not base64, to keep the
log small. A missing file shows "frame no longer available".

**Alternatives considered:** running the Claude Code process in the bridge's invisible host,
which outlives the panel (rejected: it puts the runtime inside the pipe, against constitution
II); no continue at all (fails FR-016).

## R7. One request at a time

**Decision:** the panel has one in-flight turn. Sending disables the buttons and the input and
shows a working indicator. The turn ends on the stream's `result` event, on the process exiting,
or after 5 minutes (the eval runner's timeout), which shows a plain error. There's no queue and no
cancel button in this slice.

**Rationale:** FR-012. Duplicate "check" clicks would cost money and could confuse the stage.

## R8. Plain web tech, CommonJS, no dependencies

**Decision:** the panel UI is plain HTML, CSS and JavaScript. Logic that doesn't touch the DOM or
CEP lives in small CommonJS modules in `panel/lib/` with no npm dependencies, so the same files
run in CEP and under `node --test` in the repo. Mentor text is rendered from a small safe subset
(paragraphs, bold, italics, inline code, lists), with everything else escaped, never inserted as
raw HTML.

**Rationale:** Principle V (no new dependencies without asking). AE's CEP runtime ships its own,
older Node, so the panel avoids ES modules and very new syntax. Pure modules make the parts that
decide what's shown (stream parsing, check list, stage, memory) unit-testable without AE.

**Look:** follows `product/mockups/ae-panel.md` and AE's dark UI colors. Narrow-width layout is a
single column that wraps (edge case: narrow panel).

### CEP check (2026-10-05, tasks T004)

Run in AE 26 from a throwaway panel page with the adapter's `PATH`:

```text
process.version: v17.7.2
crypto.randomUUID: yes
inherited PATH: /usr/bin:/bin:/usr/sbin:/sbin
adapter PATH: ~/.local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin
claude --version: exit 0 in 216 ms -> 2.1.290 (Claude Code)
node --version (bare name): exit 0 in 190 ms -> v26.8.1
```

- CEP's Node is **v17.7.2**: CommonJS and ES2020 are fine. `crypto.randomUUID` exists, so no
  fallback is needed.
- AE's inherited `PATH` has neither `claude` nor `node`. That confirms research R3: without the
  adapter's `PATH`, the `ae-mentor` server couldn't start inside AE.
- Spawning from CEP works, with stdio pipes, in about 0.2 s per process.

## R9. Measuring SC-004 and cost

**Decision:** the panel appends one line per turn to `AEMentor/panel-turns.jsonl`:
`{ at, kind, wait_ms, first_event_ms, total_ms, cost_usd, ok, lesson_passed }`.
`first_event_ms` runs from the click to the first tool call or text delta: it's the SC-004 measure
(option A, R1). `wait_ms` runs to the first text delta and is logged for context. `cost_usd` is
the turn's share of the process's cumulative `total_cost_usd`. `node panel/dev/turns.js` prints
the share of turns under 10 s, lesson durations, and the cost per lesson for the usage notes.

**Rationale:** SC-004 and the cost estimate in `decisions/005` both need real numbers. The
mentor's own `calls.jsonl` already logs tool timings.

## R10. Button requests are eval cases

**Decision:** each button sends one fixed message, defined once in `panel/lib/requests.js` and
listed in `contracts/button-requests.md`. Four new eval cases (17–20) use those exact strings:
Check my work (partial), Hint after a partial check, Show me, and Show me again after a demo. A
unit test fails if a case's text and `requests.js` disagree.

**Rationale:** FR-019 and Principle III. The skill already understands similar phrasing ("done",
"Show me how first", eval 14). The new cases confirm it handles the exact panel wording,
especially that Show me again never leads to a second `set_ease`, which the server also blocks
(`DEMO_USED`).

## R11. Privacy

**Decision:** the panel's files (`panel.json`, `panel-session.json`, `panel-turns.jsonl`) live in
the AEMentor folder outside the repo, like the learner record. They hold project and layer names
and the mentor's text, no personal fields. `panel.json` holds paths that include the user's home
folder, and it's never committed. `panel/dev/` scripts print `~` in place of the home folder, as
the eval runner does.

**Rationale:** Principle IV, FR-018.
