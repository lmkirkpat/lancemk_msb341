# Easing evals

The eval set for the `/ease-mentor` slice (spec 002, User Story 3). How to run it and read the
results is added in T041. This section records the headless invocation proven in T036.

## Headless invocation (T036, 2026-10-05, Claude Code 2.1.289)

**Turn 1** starts the lesson through the project skill:

```sh
AE_MENTOR_HOME=<temp dir> AE_MENTOR_FIXTURE_STATE=<state file> \
claude -p '/ease-mentor' \
  --mcp-config .mcp.json --strict-mcp-config \
  --output-format json --max-turns 8 \
  --allowedTools mcp__ae-mentor__read_learner_record mcp__ae-mentor__snapshot_project \
                 mcp__ae-mentor__preview_frame mcp__ae-mentor__set_ease \
                 mcp__ae-mentor__diff_since_last mcp__ae-mentor__record_lesson
```

**Later turns** continue the same conversation:

```sh
claude -p '<what the learner says>' --resume <session_id> <same flags>
```

What the check showed:

- **The skill loads headless.** `/ease-mentor` works as the prompt, and the
  `--append-system-prompt-file` fallback isn't needed. The `init` message lists `ease-mentor`
  in `slash_commands`.
- **The MCP server loads.** With `--strict-mcp-config`, only `ae-mentor` is connected
  (`mcp_servers[0].status: "connected"`), and all six tools appear. The model loads them with
  `ToolSearch` first, which counts as one turn.
- **`--resume` keeps the conversation and the session.** Turn 2 used the opening from turn 1
  ("Just Glow, please" → `snapshot_project` with `focus_layers: ["Glow"]`). The `session_id` is
  unchanged, and `session.json` in `AE_MENTOR_HOME` carried the lesson over.
- **Tools need `--allowedTools`.** The default permission mode has no one to approve prompts.
  Only listed tools run, so leaving `set_ease` out makes a run read-only.
- **`--max-turns` works**, although `claude --help` no longer lists it.

**Output shape.** With `--output-format json`, stdout is a JSON **array** of messages, not a
single object. `run.mjs` takes the last element (`type: "result"`) for `result`,
`session_id`, `total_cost_usd`, `num_turns` and `permission_denials`, and reads `tool_use`
blocks from the `assistant` messages to get the transcript.

**Cost.** Turn 1 (`/ease-mentor`, 2 tool calls) cost $0.20 and took 18 s. Turn 2 (2 tool calls)
cost $0.27 and took 13 s. The cost per turn grows with the conversation. At ~$0.25 per turn,
14 cases averaging 2–3 turns, plus a judge call each, come to roughly **$8–12 for a full run**.
That's why the runner skips the judge after a deterministic failure and supports `--changed`
(research R6).

## Fixtures (T037, 2026-10-05)

These are raw snapshots of the live project, captured with `node mentor/dev/capture.mjs <out>`.
That script is read-only and goes around the tools, so it never starts a lesson. Before
capturing, `node mentor/dev/capture.mjs --compare mentor/test/fixtures/practice-before.json`
confirmed that Mentor Practice matched its original build. `mentor/test/eval-fixtures.test.mjs`
checks each fixture's verdict as a Title lesson with the demo used. Re-run `npm test` after any
re-capture.

| Fixture | State | Verdict (Title lesson) |
|---|---|---|
| `before.json` | Mentor Practice as built: 11 linear pairs on 6 layers | — |
| `after-demo.json` | The real `set-ease.jsx` demo on Title › Position 0.5–1.5 s | demo eased, 3 still linear |
| `partial.json` | Demo, plus Position 1.5–3 s eased with F9 | 2 eased, Scale and Opacity still linear |
| `wrong-property.json` | Demo, plus an extra **Scale key at 1 s** (no easing) | 3 still linear; "Title › Scale now has 3 keys (was 2)" |
| `wrong-layer.json` | Demo, plus **Subtitle › Opacity** eased instead of a Title pair | 3 still linear; Subtitle flagged as outside the lesson |
| `title-done.json` | Demo, plus every other Title pair eased | pass |
| `all-eased.json` | "Comp 1", the original comp: 4 eased pairs, nothing linear | nothing to ease |
| `other-comp.json` | Same capture as `all-eased.json`, used as "a different comp is active" | `comp_matches: false` |

**Differences from the T037 list:**
- **`wrong-layer.json` is new.** It's the mistake actually made in usage session 1.
- **`wrong-property.json` adds a key instead of changing a value.** Snapshots record key
  times and ease, **not values**, so a value-only change is invisible to the diff and would
  look the same as `after-demo.json`. **Since then, `snapshot.jsx` records values** (numbers
  and number arrays), and the check reports "… value changed at … s". These fixtures were
  captured before that change and have no values, so the check skips the value comparison for
  them. A value-only wrong-property fixture needs a new capture.

Fixture mode's fake `set_ease` was compared with the real `after-demo.json`. Both change only
the inner sides of the pair (Bezier at 33.33%) and leave the outer sides and all other layers as
they were.
