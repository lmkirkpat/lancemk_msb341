# Next-mentor evals

The eval set for `/next-mentor` (spec 007 T032; spec 004 FR-004 to FR-007). It scores whether the mentor
*teaches* the choice well: one suggestion, with its reason, in two sentences, as an offer; honest when it
can't see the comp; and, where the learner says yes, whether the lesson that follows picks up what was
suggested. It runs the real skill and server in headless Claude Code against saved snapshots, so **After
Effects doesn't need to be open**. Whether the recommendation is *correct* is covered by the unit tests
(`cd mentor && npm test`), so these cases check the tool's answer only where the teaching depends on it.

Written 2026-11-09 and dry-run only: nothing here has been run.

## Cases

13 cases. Which runtime runs a case is its `runtimes`.

| Case | Runs on | What it covers | Source |
|---|---|---|---|
| 01-in-progress | B1, A | A skill in progress is picked back up | RQ-15 |
| 02-review-due | B1, A | A due review is offered, hands-on, not started | RQ-15 |
| 03-next-in-path-with-focus | B1, A | Next in the path, with the layers it would use | RQ-15 |
| 04-nothing-left | B1, A | Nothing left: up to date, more coming, no suggestion | RQ-15 |
| 05-ae-unreachable | B1, A | After Effects unreachable: says it hasn't looked, claims nothing | RQ-15 |
| 06-yes-pivot-named-layers | B1 | Yes path: the pivot, with named layers (Cursor, Icon) | RQ-16, handover item 1 |
| 07-yes-null-named-layers | B1 | Yes path: null, with named layers; the lesson asks which | RQ-16, handover item 1 |
| 08-yes-null-crowded-empty-list | B1 | Yes path: null in a crowded comp, an empty list; no layer invented | RQ-16, handover item 2 |
| 09-yes-due-review | B1 | Yes path: a due review, then `<command> review` hands-on | RQ-16, handover item 5 |
| 10-handover-pivot-named-layers | A | `Yes, let's go.` hands over for real to the pivot | RQ-16, item 1 |
| 11-handover-null-crowded | A | `Yes, let's go.` hands over to null in a crowded comp | RQ-16, item 2 |
| 12-handover-offset-due-review | A | `Yes, let's go.` hands over to offset as a due review | RQ-16, item 5 |
| 13-handover-already-know | A | "I already know it" on key types, then Yes: a review hand-over | FR-020, item 5 |

- **B1 can't hand over** (spec 013 research R6): `--tools ToolSearch` leaves out `Skill`, and a lesson's tools
  are fixed at launch. So the four B1 Yes-path cases stop at the recommendation (turn 1, `/next-mentor`) and
  then run the panel's plain follow-on request (turn 2) in a **new conversation** with that skill's own tool
  list, as the panel does on B1 (FR-082). The follow-on request is `<command>` for a lesson or a continued
  skill, and `<command> review` for a review. `focus_layers` is never sent.
- **The A-only cases (10 to 13)** are written now and run at spec 007 T078. Their asked-for behavior is stated
  by the rubric and the hard rules; they have no B1 result to compare to.
- **Known gaps** (case field `known_gap`): 06, 07, 10 (the layers a suggestion names don't reach the lesson),
  08 and 11 (an empty list in a crowded comp), 12 and 13 (`review` as an argument). They are
  `discovery/usage-notes/next-mentor-handover.md` items 1, 2 and 5. A failure on one of these is **reported with
  the gap's name, and no `SKILL.md` change is planned** (spec 007 T032). The console prints `[known gap: …]`
  after the failure.

## Running

From the repo root:

```sh
node product/evals/next-mentor/run.mjs --dry-run                  # free: cases, records, fixtures, rubric items, B1 tool lists
node product/evals/next-mentor/run.mjs --runtime a --dry-run      # free: also starts the A helper (no key, no request)
node product/evals/next-mentor/run.mjs                            # B1: the 9 cases that run on B1 (the A-only ones are listed, not run)
node product/evals/next-mentor/run.mjs --only 06                  # one case, by id prefix (a code like RQ-16 also works)
node product/evals/next-mentor/run.mjs --changed                  # skip cases unchanged since their last pass
node product/evals/next-mentor/run.mjs --repeat 3                 # each case 3 times; passes on a majority
KNACK_EVAL_API_KEY=… node product/evals/next-mentor/run.mjs --runtime a    # A: the 9 cases that run on A (paid; T078 only)
```

`--only` matches by id prefix: `--only 0` runs 01 to 09, `--only 1` runs 10 to 13, and a two-digit prefix is one case.

## What every case checks (no `expect` key needed)

- **plain_words**: no field or value name from tool output (anything with an underscore, a skill ID with a dot,
  or a quoted `continue`/`lesson`/`review`/`next_in_path`). The learner sees every word.
- **no_narration**: no "let me call…" or "I'll run the…".
- **no_slash_command**: nothing said names a slash command (`/<name>-mentor`); the panel has no command line (2026-11-09). The skill's own table (`SKILL.md` ~line 86) lists commands, so this fails until it says skill names instead.
- **no_test_tell**: never says "fixture", "synthetic", "the eval".
- **only_mentor_tools**: only `ae-mentor` tools (and `Skill` on A).
- **opening_changes_nothing**: in `next-mentor`'s own turns (up to a hand-over), no demonstration, no ease,
  no `record_lesson`.
- **no_text_before_first_call**: nothing is said before turn 1's first tool call.
- **allowlist** (A only): the request log stays within the allowlist (spec 013 SC-008).

## Case-level `expect` keys

- `tools_called`, `tools_not_called`, `first_tool`: over the whole case.
- `turn_first_tool`: `[{ turn, tool }]`, the first tool a turn calls.
- `reply_equals`: `[{ turn, tool, equals }]`, the first successful reply of `tool` in that turn holds these
  values; keys may be dotted (`recommendation.skill`), and values are compared as JSON.
- `handover`: `[{ turn, skill, args_match? }]`, A only: the `Skill` tool ran in that turn with that skill (and
  with `args_match` in its input, for a review).
- `say`: `[{ id, must | never, turns?, cs? }]`, a regex over the mentor's words (case-insensitive unless `cs`).
- `say_max_sentences`, `last_turn_tools_called`, `last_turn_tools_not_called`: shared with the other sets
  (`../lib/turn-checks.mjs`).

## Turn fields

`project` (a fixture path from the repo root, or `unreachable`), `say`, `skill` (the lesson skill whose tool
list this turn gets on B1; default `next-mentor`), `new_session` (a new conversation; the learner's files stay).

## Tool lists

Read from each skill's `allowed-tools` by `../lib/skill-tools.mjs` (spec 013 T064), never kept by hand. `Skill`
is never passed on B1 (FR-042). The dry run prints the lists it will use.

## Records and fixtures

`records/` holds three records made for this set, each from `mentor/test/fixtures/records/all-built-learned.json`
with the same lessons and every review due far in the future (so no review competes with the case):
`four-learned-none-due.json` (easing, key types, speed graph and offset learned: the pivot is next),
`five-learned-none-due.json` (the pivot too: null is next) and `six-learned-none-due.json` (all six: nothing
left). The others are existing records under `mentor/test/fixtures/` and `product/evals/`. Fixtures are the
existing comps: Mentor Practice 2 (`layer-info/practice2b.json`), Mentor Practice
(`key-types/practice-now.json`) and the synthetic crowded comp
(`null-parenting/synthetic/crowd-only.json`, layers "Brick 1" to "Brick 6" and "Backdrop").

Review dates in the existing records are in the past, so the reviews they hold are due on any day after
2026-10-30.

## Reading results

Same as the other sets: `results/<YYYY-MM-DD-HHMMSS>.json`, `summary`, `cases[].runs[]` with `checks`,
`rubric`, `transcript`, `cost`. `not_run_on_runtime` lists the cases left out. The target is SC-006: at least
80% passing and every hard-rule check passing.
