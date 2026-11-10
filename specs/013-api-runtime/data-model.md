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

*Amended 2026-11-05 (T068, `431e556`):* `turn_timeout_ms` is the turn's limit only, no longer each
request's SDK timeout. Requests get their own limits in code, not settings: 20 s plus the body at
50 kB/s for headers, 30 s between bytes (research R3).

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
on each `turn_end`. Rebuilt only at lesson start, at a hand-over, and when a saved lesson is
continued (› Lesson conversation › Continuing, added 2026-11-09).

## Lesson conversation (`panel-conversation.json`, learner home; FR-015, FR-023, FR-024)

*Amended 2026-11-09 (version 2, for T044): the file also holds the lesson's prompt state, so a
continued lesson rebuilds the same next request. Version 1 (T043 as merged, never wired) had no
`prompt` and is not continued. Details in › Prompt state and › Continuing, below.*

```json
{ "version": 2, "session_id": "<uuid, same as panel-session.json's>",
  "settings_hash": "…", "model": "claude-opus-5-5",
  "prompt": { "start_skill": "next-mentor", "skill": "speed-graph-mentor",
              "offered": ["snapshot_project", "…", "Skill"], "handed_over": false,
              "pending_skill": "speed-graph-mentor", "request_hash": "<sha256>" },
  "messages": [ … ] }
```

Version 1's top-level `skill` is gone: `prompt.skill` replaces it.

- `messages` are the API messages exactly as sent and received, in order, including thinking
  blocks, tool uses and tool results, and any mid-conversation system message from a hand-over
  (the new skill's body and, after D2, its tool changes).
- **Complete exchange** (FR-015, D1, amended 2026-10-30): an assistant message with no tool use, or
  an assistant message with tool uses plus the user message holding a result for every one of them.
  The history is only ever the learner's and panel's messages plus complete exchanges (and the
  hand-over system messages between them). When a turn fails, the incomplete tail after the last
  complete exchange is taken back; complete exchanges from the failed turn stay, so a demonstration
  or `record_lesson` that ran is still there next turn. If nothing in the failed turn completed, the
  learner's message comes off too (spec resolved question 6). If a call in an answer already ran,
  or was still running, when the turn failed, that answer is completed instead: the call in flight
  gets the error result "That call didn't finish, so it may or may not have changed the project."
  and each call that never started gets "That call didn't run." (both `is_error: true`; resolved
  question 7, amended 2026-10-30 for review S1). A call in flight completes the answer even when
  it's the first. An assistant message with no tool use cut off at `max_tokens` is a complete
  exchange; one cut off inside a tool use is the incomplete tail. The only other removal: a
  hand-over's skill-body system message taken back when the reply right after it is empty (review
  fix M1).
- **No two user messages in a row** (M1 as built, amended 2026-10-30). When the history ends with a
  user message (a kept failure's tool results, the step limit, or an empty reply after a hand-over),
  the next learner or panel text is added to that message as a text block after its `tool_result`
  blocks. A later turn that completes nothing removes only that added block (the take-back works at
  block level on the last kept message).
- Image data in tool results is replaced on disk by `{ "frame_file": "panel-conversation-frames/<name>.png" }`
  and restored from the file when the conversation is loaded.
- Written (temp file and rename) after each complete exchange: a turn that fails mid-answer saves
  its complete exchanges and nothing of its incomplete tail.
- Unreadable, another version, another `session_id`, or another `model` → not continued (spec 003's
  rule: say nothing alarming). A new lesson deletes the file and the frames folder.

### Prompt state (`prompt`, added 2026-11-09)

What the loop holds besides `messages` that decides the next request (`panel/helper/lib/loop.mjs`:
`prompt`, `handedOver`, `offered`, `pendingBody`). Every field is required; `null` where shown.

| Field | Type | Meaning | Rebuilt from |
|---|---|---|---|
| `start_skill` | `*-mentor` name \| null | The skill the lesson opened with. Its body is the third system block (placement `system`), and on Opus 5.5 and Sonnet 5.5 its `allowed-tools` decide which declared tools are hidden. Never changes in a lesson | `buildLessonPrompt` with that skill |
| `skill` | `*-mentor` name \| null | The active skill (`prompt.skillName`): which tools run, and on Haiku 5.5 the tool list | `switchTo` with that skill, when it isn't `start_skill` |
| `offered` | tool names \| null | What the history has told the model it can call (the loop's `offered`), in the declared order. `null` on Haiku 5.5 | Saved as is |
| `handed_over` | boolean | Haiku 5.5 only: the tool list has been replaced, so requests use `drop_block`. Always `false` on Opus 5.5 and Sonnet 5.5 | Saved as is |
| `pending_skill` | `*-mentor` name \| null | A hand-over whose exchange completed but whose body hasn't gone into the history yet (the loop's `pendingBody`). The body isn't stored: it's read again from that skill's `SKILL.md` | `readSkill` |
| `request_hash` | sha256 hex | The check that the rebuild is exact (below) | Computed |

**`request_hash`** is the sha256 of the JSON of `{ params, betas, allowed, offered, pending_body }`,
where `params` is what `requestParams()` sends with `messages` left out and every `cache_control`
marker removed (so it covers the model, `max_tokens`, `thinking` with its `block_binding`, `effort`,
`fallbacks`, `system` and `tools`), `betas` the request's beta list, `allowed` the runnable tool names
in the order the helper builds them, `offered` as above, and `pending_body` the waiting body's text or
null. It covers everything except the history that decides the next request or what a hand-over
already completed will put in it. Cache markers are left out on purpose: moving a breakpoint isn't an
edit (R8), and a `cache_ttl` change only changes cost.

**Which state is saved.** The state at the same point as the saved `messages`: the loop's last
complete exchange, which is exactly the mark a failed turn goes back to (FR-015 item 1). So the file
is always what the loop would hold if the turn in progress failed now. A save never takes the state
from mid-step (a hand-over typed at a turn's start, or a body placed for a request still running,
isn't in force until an exchange after it completes).

### Continuing (`start { resume: true }`, added 2026-11-09)

**The rule:** a continued lesson sends, as its next request, exactly the request the same helper
would have sent had it stayed open and the turn in progress at the close had failed at that moment,
with the same learner or panel text (FR-015, FR-023; SC-007's automated half). The close is treated
as a failed turn: complete exchanges are kept, the incomplete tail never reached the file, and if no
exchange completed since the learner's last message, that message isn't there either. Nothing else
from the closed helper (a turn number, a stream, a timer) affects a request. (A close mid-call is
made to fail the same way, › Saving and clearing.)

1. `loadConversation` as built (version, `session_id`, `model`, well-formed, frames). Version 1 →
   `version`.
2. Once `ae-mentor` has started (in `start`, or the first `send` that starts it, if it couldn't
   start during `start`), the helper rebuilds the state: `buildLessonPrompt` from the preamble, the
   server's instructions and tools, `start_skill` and `skill-tool.json`; then `skill`'s tools if it
   differs from `start_skill` (the tool list stays on Opus 5.5 and Sonnet 5.5, is replaced on Haiku
   5.5); `offered`, `handed_over` as saved; the body of `pending_skill`, read again. It computes
   `request_hash` and compares.
3. Equal → the lesson continues with the saved `messages` and the rebuilt state. The next text joins
   the history by FR-015's rules (a history ending in a user message gets it as a block, M1), a
   waiting body goes in before the first request (`placeHandOver`), and `turn_end` reports the same
   `prompt_hash` as before the close.
4. Not equal, or a named skill can't be read → not continued, reason `prompt` (a fixed word, logged
   as the other reasons are). This catches any change between the close and the reopen to the
   preamble, the server's tools or instructions, a `SKILL.md` that's in the prompt or waiting to go
   in, or a setting that goes in a request. **Resolved 2026-11-09, OQ-C1:** approved as recommended
   (refuse and start fresh); the alternative is below the list.
5. Any refusal (`none`, `unreadable`, `version`, `session`, `model`, `frames`, `prompt`) → the
   helper deletes the file and frames (a fresh lesson starts) and the lesson starts as a new one with
   the start command's `skill` (the opening skill the panel saved in `panel-session.json`, as B1's
   Continue uses it; contracts/helper-protocol.md): its prompt is built at the first `send` as if that
   send had started with the skill's command, and the send's text goes in unchanged. The learner sees
   no error and no notice (spec 003's rule); `ready` carries `resumed: false`. **Resolved 2026-11-09,
   OQ-C2:** approved as recommended; see below.

A different `settings_hash` alone is still not a refusal (T043): it covers helper code that doesn't
change a request, and `request_hash` catches what does.

*OQ-C1's alternative:* keep the saved `system` and `tools` in the file and send them as saved, so an
update between close and reopen doesn't end the lesson. Rejected in the recommendation: the request
would then hold a skill body or a tool definition that's no longer in the repo, which the FR-016
allowlist (derived from today's sources) would reject, and tools run by today's `ae-mentor` would be
described by yesterday's definitions. Updates between close and reopen are rare for learners (they
come through the installer) and the builder already merges only between sittings.

*OQ-C2's alternative:* the panel, told `resumed: false`, sends the opening skill's start request
instead of "I'm back. Pick up where we left off." That's a panel change in spec 007's continue flow,
which T044 keeps unchanged. With the recommendation the mentor hears "I'm back…" with no history,
then opens as the skill's `SKILL.md` says.

### A hand-over across a close (added 2026-11-09)

| When the panel closed | What the file holds | On continuing |
|---|---|---|
| The `Skill` call was written but its result wasn't in (the answer still streaming, or the call not yet answered) | The exchange before it; `skill` the old one, `pending_skill` null | No hand-over. The model is where it was before the answer, as after a failed turn |
| The `Skill` call's exchange completed ("Loaded <skill>." in the history), the body not yet placed, or placed for a request that never finished | `skill` the new one, `pending_skill` the new one, `offered` the old skill's tools | The next text joins the last user message (M1), then the tool changes and the body go in one system message before the first request, as they would have |
| The body went in and an exchange after it completed | `skill` the new one, `pending_skill` null, `offered` the new skill's | Normal continue |
| A typed command (a message starting with another mentor skill's command) and no exchange completed after it | The exchange before it; the old skill; the learner's message not there | No hand-over, as after a failed turn that completed nothing (resolved question 6). The learner sends again |
| The reply right after a placed body was empty (M1's take-back) | As the second row (the turn ended `ok`, nothing completed after the body) | As the second row |

A chain (A hands to B, B to C) needs only `start_skill` and `skill`: the system prompt is the first
skill's, the tools the active one's, and the hand-overs between are in the history.

### Saving and clearing (added 2026-11-09)

- The loop calls the save after each complete exchange with the messages and the prompt state from
  that moment (one call per complete exchange, inside the turn, not only at its end), so a close
  mid-turn loses only the incomplete tail.
- A save that fails (`write_failed`) deletes the file and its frames, best effort, and is logged.
  An older save must not be continued, since it may be missing a demonstration or `record_lesson`
  that ran after it (the one-demo rule). The lesson itself goes on. If deleting fails too, that's
  logged and nothing more is done.
- **Closing mid-call** (`stop`, SIGTERM or stdin closing, which is how the panel closes the
  helper): if the turn in flight has an answer with a call that already ran or is still running (a
  demonstration, say), the helper completes that answer as a failed turn does (FR-015 item 1: "That
  call didn't finish, …" for the call in flight, "That call didn't run." for calls not started),
  saves, and then exits. Anything else in flight is dropped unsaved, as today. Why: without this, a
  demonstration that ran in the closing answer is missing from the file and a continued lesson can
  demonstrate a second time (SC-007). A helper killed outright (SIGKILL, a crash) saves nothing more.
  **Resolved 2026-11-09, OQ-C3:** approved as recommended; it changes the protocol's "`stop`: no save".
- `start { resume: false }` deletes the file and frames before `ready` (a new lesson). Uninstall
  removes both (FR-023; spec 006's inventory, see spec › Amendments 2026-11-09).

**As built (T044, merged 2026-11-09 `27dd7c6`; the builder accepted these the same day):**
- **The exact match (FR-023a) holds only at complete exchanges.** If a turn ends `ok` having completed
  nothing (an empty reply that isn't the one right after a placed skill body) and the panel closes right
  then, the file doesn't have that learner message, so the continued lesson's next request lacks it.
  Accepted, not fixed: it's rare and does what a failed turn does (the text is gone, nothing else).
- **A turn cut short makes no more `ae-mentor` calls.** After `stop` or the 5-minute timeout, a call not yet
  started gets "That call didn't run." Before T044, a timeout between two calls still sent the next one.
- **Closing waits at most 0.8 s** for the turn to save before stopping `ae-mentor`, inside the adapter's
  3-second wait before SIGKILL.
- **With no `home` in `start`,** the file goes to the panel's default learner home.

## Price table (`panel/helper/prices.json`, repo; FR-026)

`{ "checked": "2026-10-30", "models": { "<id>": { "input", "output", "cache_read", "cache_write_5m", "cache_write_1h", "long_prompt"? } } }`,
dollars per million tokens. `long_prompt` (Haiku 5.5) holds the prices above 100K prompt tokens.

## Turn log entry (`panel-turns.jsonl`): new fields (FR-029)

Added to spec 003's entry, still with no text: `runtime` (`b1` | `a`; missing on old lines = `b1`),
`model` (the model that answered), `effort`, `settings_hash`, `tokens` `{ input, cache_write,
cache_read, output }`, `other_model` (true when the answer came from a model other than settings'),
`error_kind` (or null), `start_ms` (A, a lesson's first turn only: helper spawn to ready, for
`decisions/010`'s start-up signal). B1 lines get `runtime: "b1"` only. On A, `error_kind` and
`start_ms` come from the adapter's `turn_end` (it adds them; the helper's `turn_end` carries
neither, contracts/helper-protocol.md, amended 2026-10-30).

*Amended 2026-11-05 (after T068):* on A, the entry's `cost_usd` follows the helper's rule: `null`
when an attempt received headers and its counts never came (including a quiet attempt whose re-send
succeeded), and nothing counted for an attempt that never received headers, so a turn with only
such attempts logs `0` (unverified whether they're billed). Contracts/helper-protocol.md › Stalls
and request timing.

## Eval results: new fields (FR-029, FR-030, FR-033)

Top level: `runtime`, `model`, `effort`, `settings_hash`, `prompt_hash` per skill, `other_model_turns`
(count), `baseline` `{ file, passed, total }` and `vs_baseline` `{ b1_pass_a_fail[], b1_fail_a_pass[] }`.
Old files without `runtime` are B1.

*Amended 2026-10-30 (as merged, `product/evals/lib/ab.mjs` `resultFields`):* also `cost_unknown_turns`
(turns whose cost the service never reported; from 2026-11-05 this includes a turn with a quiet
attempt that had received headers, even if its re-send succeeded), `non_baseline` (true for a `--settings` run, which is
never picked as a baseline) and `settings_file` (its name, only on such a run). B1 runs now write
`runtime: "b1"`. Each A case also records its `allowlist` result.

## Equivalence record (each set's `README.md` › Option A; FR-033, FR-035)

Per set: the A results file, the B1 baseline file it's compared with, pass rates, each case that
passed on B1 and failed on A with its `--repeat 3` result, and its outcome (`noise`, `fixed in
<commit>`, or `accepted by the builder on <date>: <reason>`). Once all six meet FR-033: the A
baseline (file, model, effort, cost).

## Helper protocol messages

See [contracts/helper-protocol.md](contracts/helper-protocol.md).
