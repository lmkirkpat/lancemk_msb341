# Evals

One folder per skill (`easing/`, `key-types/`, `speed-graph/`, `offset/`, `anchor/`, `null-parenting/`),
each with its own `README.md`, `rubric.md`, `cases/`, `fixtures/`, `run.mjs` and `results/`.

## Runtimes

What the evals ran on, recorded 2026-10-30 (spec 013 T001, research R2) so the first option-A
comparison changes only the runtime. B1 means headless `claude -p` (decisions/005). Facts are marked
"fact" (read from a file or output) or "inference".

| Item | Value | Source |
|---|---|---|
| Mentor model (2026-10-29 runs) | `claude-opus-5-5`, all of it. No other model in any session. | Fact. `message.model` in the 409 session files from 10-29 under `~/.claude/projects/*AEMentor*-runtime/` (they cover all six sets: easing, key types, speed graph, offset, anchor, null). One file also has a `<synthetic>` line (Claude Code's own placeholder, not a model call). |
| Mentor model (fresh run, 10-30) | `claude-opus-5-5` | Fact. `node product/evals/easing/run.mjs --only 01` (pass, $0.23): its session file shows `claude-opus-5-5`. The runner doesn't save the `init` message or `modelUsage`, so those came from a one-turn probe with the runner's own judge flags (below): `init.model` and the only `modelUsage` key were both `claude-opus-5-5`. |
| Effort | `medium` | Fact. Every 10-29 mentor session (409 of 409) and judge session (361 of 361) logged `output_config: {"effort":"medium"}`, and so did the fresh run. Where it comes from is inference: no settings file sets it (`~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json` have no effort or model key), and the runners pass no `--effort` or `--model`. The runner spawns `claude` with `process.env`, and a Claude Code session here has `CLAUDE_EFFORT=medium` in its environment, so it is probably the default or that inherited variable. If runs start from a shell without it, the effort could differ. |
| Claude Code version | 2.1.312 for most 10-29 lines (about 14,700 session lines in mentor sessions); 2.1.314 for about 1,200 (the app updated during the day). Now 2.1.314. | Fact. `"version"` in the session files; `claude --version` on 10-30. So 10-29 was mostly, not entirely, one version. |
| Judge model | `claude-opus-5-5` | Fact. `run.mjs` line 310 passes no `--model`; the 361 judge sessions (run from the temp folder, `-private-var-...-T`) on 10-29 all show it. |
| Judge effort | `medium` | Fact. Same 361 sessions. Same inference as above for where it comes from. |
| Thinking | `{"type":"adaptive","display":"updates"}` in the request; thinking text is empty in the saved transcripts (only a signature is kept), so the thinking is not visible there. | Fact. Request parameters logged in the session files (3,051 mentor and 362 judge entries, no other value). Also in the beta list: `thinking-display-updates-2026-08-18`. Whether the thinking is shown anywhere else is unknown. |

Runner flags that matter (`easing/run.mjs`): mentor turns use `-p ... --output-format json --verbose
--max-turns --tools ToolSearch --strict-mcp-config --settings {"outputStyle":"default"}`, run from the
runtime folder (`panel/lib/runtime.js`); the judge uses `--tools "" --max-turns 1` in the temp folder.
Neither passes `--model` or `--effort`, so both take the account's defaults.

Not found: a per-set split by directory (the runtime folders have random names); sets were told
apart by skill name in the transcript, and every set shows only `claude-opus-5-5`.
