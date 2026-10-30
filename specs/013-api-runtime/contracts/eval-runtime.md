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

*Amended 2026-10-30 (as merged, `5963fef`):*

- A `tool_call` with no `tool_result` (a call the turn's failure answered with "That call didn't
  run." or "That call didn't finish, …", helper-protocol › Events) stays in the transcript with
  `ok` and `result` null; the turn has failed, so the case fails with check `run` anyway.
- **The request-field allowlist.** A logged request may hold only these top-level fields: `model`,
  `max_tokens`, `system`, `tools`, `messages`, `thinking`, `output_config`, `fallbacks`, `stream`,
  `input_transformations`. Any other fails the check. A helper change that adds a request field
  (T060's included) must add it here and in `lib/allowlist-check.mjs` in the same change, through
  the eval engineer.
- **Fixed runtime texts in tool results**: exactly FR-012 items 3 to 7. "That call didn't run." and
  "That call didn't finish, so it may or may not have changed the project." pass only with
  `is_error: true`.
- **Mid-conversation tool changes** (`tool_addition` / `tool_removal` in a `role: "system"`
  message) pass when every tool they name is a server tool or `Skill`. Until T060 settles the
  service's block shape, the check reads a name from `name`, `tool_name`, `names` or `tools`. Once
  T060 lands, the real shape goes into this contract and the allowlist test, and the other readings
  come out.

## Results file

Adds the fields in [data-model.md](../data-model.md) › Eval results. `--changed`'s hash adds
`panel/helper/main.mjs`, `panel/helper/lib/*`, `settings.json`, `preamble.md` and `prices.json` on
A runs only, so a model change invalidates earlier A passes and B1 hashes are unchanged.

*Amended 2026-10-30 (as merged):* the hash also covers `skill-tool.json` (the hand-over tool's
definition, FR-012 item 2), and on a `--settings` run it covers that file in place of
`settings.json` (`product/evals/lib/runtime-a.mjs` `helperHashFiles`).

## Summary line

```text
26/28 passed (93%, target 80%) ✓  $14.80  runtime a, claude-opus-5-5, effort <e>
vs B1 baseline 2026-10-29-144158.json (27/28): -1; B1 pass → A fail: 07; A pass → B1 fail: none
other-model turns: 0
```

The baseline is the newest full (not `--only`) results file with `runtime` b1 or no `runtime`, unless
the set's README names a different file, which wins.

*Amended 2026-10-30 (as merged, `product/evals/lib/compare.mjs`):* the README names it with one
line anywhere in the file, `A-comparison baseline: results/<file>.json` (backticks and the
`results/` prefix optional). If the named file isn't in the set's `results/`, the newest full B1
file is used. A `--settings` run (`non_baseline: true`) is never picked as the newest.
