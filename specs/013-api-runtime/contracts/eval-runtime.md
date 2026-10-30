# Contract: the eval runners on option A

Owner: eval-engineer. Applies to all six `product/evals/*/run.mjs`.

## Switch

`--runtime a|b1`. Default `b1` until every set meets FR-033 (then `a`, FR-035). Every existing
option (`--only`, `--changed`, `--repeat`, `--judge-always`, `--dry-run`) works on both. `--dry-run`
on A also checks that the helper starts, `settings.json` loads, and every skill a case uses has a
readable `SKILL.md` and tools the server lists, with no request to the service.

`--settings <file>` (A only) runs an experiment on other settings (spec Q2's cheaper models, a
skill-placement trial). The file's hash is recorded, and such a run is never a baseline: the
panel and the default runs both use `panel/helper/settings.json` (FR-028).

On A the runner needs `KNACK_EVAL_API_KEY` in the shell; it's passed to the helper in the `start`
command, and removed from every child's environment (helper, `claude` mentor on B1, judge).

## Mentor turns on A

`product/evals/lib/runtime-a.mjs`, used by every runner:

1. Per case: a temp home as today, then one helper with `home`, `mcp_config` = the repo's
   `.mcp.json`, `skills_dir` = `.claude/skills/` (only `*-mentor` folders are read), `fixture_env` =
   the same `AE_MENTOR_*` variables B1 gets, `request_log` = a file in the temp home.
2. Per turn: write the fixture state file exactly as today, `send` the turn's `say`, collect events
   until `turn_end`.
3. Map to today's transcript events: each `text` → `{ kind: "say", text }`; each `tool_call` +
   matching `tool_result` → `{ kind: "tool", name, input, ok, result }` with `result` = `text`
   (the text parts joined, as `transcriptOf` does). Nothing else changes for `check()`,
   `renderTranscript()` or `judge()`.
4. A turn with `turn_end.ok === false` or an `error` ends the case with `run` failed, as a B1
   `is_error` result does. Cost is the sum of `turn_end.cost_usd`; `null` makes the case's cost
   unknown and is reported, not counted as 0.
5. Before deleting the temp home, the request log is checked by `lib/allowlist-check.mjs` (SC-008);
   a failure fails the case with check `allowlist`.

## Results file

Adds the fields in [data-model.md](../data-model.md) › Eval results. `--changed`'s hash adds
`panel/helper/main.mjs`, `panel/helper/lib/*`, `settings.json`, `preamble.md` and `prices.json` on
A runs only, so a model change invalidates earlier A passes and B1 hashes are unchanged.

## Summary line

```text
26/28 passed (93%, target 80%) ✓  $14.80  runtime a, claude-opus-5-5, effort <e>
vs B1 baseline 2026-10-29-144158.json (27/28): -1; B1 pass → A fail: 07; A pass → B1 fail: none
other-model turns: 0
```

The baseline is the newest full (not `--only`) results file with `runtime` b1 or no `runtime`, unless
the set's README names a different file, which wins.
