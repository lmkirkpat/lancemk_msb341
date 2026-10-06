# Easing evals

The eval set for the `/ease-mentor` slice (spec 002, User Story 3). It scores whether the mentor
*teaches* well: leading, focusing, hints instead of fixes, and using memory. It runs the real
skill and server in headless Claude Code against saved snapshots, so **After Effects doesn't
need to be open**. Whether the detection and grading are *correct* is covered by the unit tests
(`cd mentor && npm test`), which are free and instant. Evals cost real usage, so they don't
repeat what the unit tests already prove.

## Running

From the repo root:

```sh
node product/evals/easing/run.mjs --dry-run          # free: check cases, fixtures and rubric items
node product/evals/easing/run.mjs                    # full run: every case once
node product/evals/easing/run.mjs --only 07          # one case, by id prefix
node product/evals/easing/run.mjs --only FR-006      # every case that covers a requirement
node product/evals/easing/run.mjs --changed          # skip cases unchanged since their last pass
node product/evals/easing/run.mjs --repeat 3         # each case 3 times; passes on a majority
node product/evals/easing/run.mjs --judge-always     # judge even after a failed check
```

**When to use which:**
- **While editing `SKILL.md` or the tools:** `--only` for the cases you're working on, then
  `--changed` to catch side effects without paying for unchanged cases. A case's hash covers
  `SKILL.md`, `mentor/tools.mjs`, `mentor/fixture.mjs`, `mentor/server.mjs`, `mentor/lib/*`,
  `rubric.md`, the case file, its learner record and its fixtures.
- **Full run required:** before committing a change to `SKILL.md` or the tools, and for the
  baseline. Commit its results file. `--changed` never replaces a full run, because a model
  update can change behavior when no file has.
- **`--repeat 3`:** when a case flips between runs, to tell a real failure from noise.
  Runs aren't deterministic.
- **Always `--dry-run` first** after editing cases. It's free and catches a missing fixture or a
  misspelled rubric item before you pay for a run.

## Reading results

The console prints one line per case: `pass` or `FAIL`, the cost, and for failures each failed
check or rubric item with its reason. Then a summary line:

```
14/16 passed (88%, target 80%) ✓  $9.12 | vs 2026-10-06-0930.json: +1 pass; 04 now passes, 11 now fails
```

**The target is SC-006:** at least 10 cases, at least 80% passing.

Each run writes `results/<YYYY-MM-DD-HHMM>.json`:
- `summary`: passed, total, percent and target.
- `cases[].runs[]`: for each run of a case:
  - `checks`: the deterministic checks. These are facts from the tool calls: `set_ease` counts
    and targets, the check's verdict, and what was recorded.
  - `rubric`: the judge's `{ item, pass, reason }` for each of the case's rubric items.
  - `transcript`: everything the learner said, everything the mentor said, and every tool call
    and result.
  - `cost`, `session_id`.
- `cases[].hash`: what `--changed` compares. `skipped: true` marks cases carried over by
  `--changed`.

**When a case fails, read in this order:**
1. **A failed `run` check** means headless Claude or the server broke (a timeout, an error
   turn). Fix the plumbing before reading anything else.
2. **A failed deterministic check** means a hard rule broke: an extra `set_ease`, a verdict
   given when it shouldn't be, a wrong record. These are the serious ones.
3. **A failed rubric item** means teaching quality. Read the `reason`, then the transcript. If
   the judge looks wrong, re-run with `--repeat 3` before changing `SKILL.md`.

Turn real failures into a `SKILL.md` fix or a new task, and log what changed in
`discovery/usage-notes/easing-slice.md`.

## Cases

16 cases in `cases/NN-name.json` (data-model.md › Eval case): the 14 from T039, plus
**15 · wrong layer** (the mistake from usage session 1) and **16 · stopping early** (step 11's
"record a partial" branch). Seed learner records are in `cases/learners/`.

Each turn names the fixture that is "the project" for that turn (or `"unreachable"`), and what
the learner says. `expect` holds the deterministic checks:

| Key | Passes when |
|---|---|
| `first_tool` | the first mentor tool call is this one |
| `set_ease_max` / `set_ease_min` | the number of **successful** `set_ease` calls is within range (a refused `DEMO_USED` doesn't count; the judge grades the attempt) |
| `set_ease_only_on` | every successful `set_ease` was on this segment |
| `verdict` | the last turn's final `diff_since_last` was `pass`, `fail`, or `none` (error, a different comp, or no check) |
| `tools_called` | each tool was called at least once |
| `last_turn_tools_not_called` | none of these were called in the last turn |
| `last_turn_tools_called` | each of these was called **successfully** in the last turn (spec 003, case 20) |
| `record_lesson` | `null`: nothing was recorded. Otherwise, the last recorded lesson has these field values |

In eval turns the mentor gets only `ToolSearch` and the six `ae-mentor` tools (`--tools
ToolSearch`), so it can't read files such as the fixtures or `SKILL.md`. The judge gets no
tools.

## Headless invocation (T036, 2026-10-05, Claude Code 2.1.289)

`run.mjs` builds these commands. Here's what the T036 check proved about them.

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
