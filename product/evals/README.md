# Evals

One folder per skill (`easing/`, `key-types/`, `speed-graph/`, `offset/`, `anchor/`, `null-parenting/`) and one for the
hand-over between them (`next-mentor/`, spec 007 T032; `lib/` holds the code the runners share),
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

## Running on option A (spec 013, T022 to T029)

All six runners take `--runtime a|b1`. `b1` (headless Claude Code) is the default until every set meets
FR-033; `--only`, `--changed`, `--repeat`, `--judge-always` and `--dry-run` work on both.

```text
KNACK_EVAL_API_KEY=… node product/evals/<set>/run.mjs --runtime a [--only 07] [--repeat 3]
node product/evals/<set>/run.mjs --runtime a --dry-run     # no key, no request to the service
node product/evals/<set>/run.mjs --runtime a --settings <file>   # an experiment; never a baseline
```

- **What changes:** only the mentor's runtime. The judge is still `claude -p` exactly as before (FR-032).
  The key is read from `KNACK_EVAL_API_KEY`, sent to the helper in its `start` command only, and removed
  from the runner's environment, so neither the helper's children nor the judge ever have it.
- **Per case:** one helper (`panel/helper/main.mjs`), the fixture state file written per turn as on B1.
  A turn with `new_session` starts a fresh helper on the same home. Tool calls, results and mentor text
  become the same transcript events, so every `expect` check and the judge work unchanged.
- **Extra check `allowlist`** (SC-008, FR-016): the case's request log is checked against the allowlist
  before the temp home goes. Code: `lib/allowlist-check.mjs`; it derives the allowlist on its own from
  `preamble.md`, `skill-tool.json`, the server's own `initialize` and `tools/list`, and the `*-mentor`
  `SKILL.md` bodies. A failure fails the case and skips the judge (use `--judge-always` to see both).
- **A dry run** also starts the helper (placeholder key, no turn sent), starts `ae-mentor`, and checks that
  every skill a case starts has a readable `SKILL.md` whose allowed tools the server lists.
- **Results file:** `runtime`, `model`, `effort`, `settings_hash`, `prompt_hash` (per skill),
  `other_model_turns`, `cost_unknown_turns`, `non_baseline`, `baseline` and `vs_baseline`. A turn whose cost
  the service never reported is counted as unknown, not as $0. B1 results now carry `runtime: "b1"`.
- **Baseline for the comparison:** the newest full (not `--only`) results file on B1 or from before the
  field existed, never an `--settings` run. A set's README can name another with one line,
  `A-comparison baseline: results/<file>.json`, which wins.
- **`--changed`** on A adds the helper's files (`main.mjs`, `lib/*`, the settings file in use, `preamble.md`,
  `skill-tool.json`, `prices.json`) to a case's hash, so a model change invalidates earlier A passes. B1
  hashes are unchanged.
- **Tests:** `node --test product/evals/lib/test/` (no key, no network; they run the real helper against
  `panel/helper/test/fake-service.mjs`).
