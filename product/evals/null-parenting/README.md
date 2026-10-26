# Null parenting evals

The eval set for `/null-parenting-mentor` (skill 6, "Move a group with a null", `parenting.null`,
spec 012 › Eval plan). It scores whether the mentor *teaches* well: asks before it proposes,
never picks the learner's pivot, gives hints instead of fixes, keeps a review free of the word
"null", and stays honest about what it can't see. It runs the real skill and server in headless
Claude Code against saved snapshots, so **After Effects doesn't need to be open**. Whether the
measures (the jump, the null's checks, the proposal rule) are *correct* is covered by the unit
tests (`cd mentor && npm test`); evals don't repeat them.

Built by copying `product/evals/easing/run.mjs`, not sharing it, so easing's files stay untouched.
Same options and results format.

## Status (2026-10-26): built on stand-in and synthetic fixtures

26 cases, dry-run clean, and a 6-run smoke ($1.99, cases 01, 16 and 20; see "Smoke run" below).
**No baseline yet.** The full run waits for the live sitting (tasks T338), because most fixtures
are stand-ins the builder wrote by hand, and the set must be re-pointed first (see
"Re-pointing after T338").

## Running

From the repo root:

```sh
node product/evals/null-parenting/run.mjs --dry-run                   # free: cases, fixtures, labels, tells
node product/evals/null-parenting/run.mjs --dry-run --strict-sources  # also fails on a stale fixture label
node product/evals/null-parenting/run.mjs                             # full run: every case once
node product/evals/null-parenting/run.mjs --only 16                   # one case, by id prefix
node product/evals/null-parenting/run.mjs --only FR-005a              # every case that covers a code
node product/evals/null-parenting/run.mjs --changed                   # skip cases unchanged since their last pass
node product/evals/null-parenting/run.mjs --repeat 3                  # each case 3 times; passes on a majority
node product/evals/null-parenting/run.mjs --judge-always             # judge even after a failed check
```

A full run is about 84 mentor turns plus 26 judge calls. From the smoke run (about $0.15 a turn,
$0.05 to $0.10 a judge call) expect **$13 to $17**. Bar: SC-006, at least 80% passing, and every
hard-rule check passing. SC-003 (at least 12 cases): met, 26.

## What every case checks (no `expect` key needed)

| Check | Rule it enforces |
|---|---|
| `plain_words` | no underscore or dot name, no target ID, no quoted value from tool output |
| `no_narration` | no announced calls or rules |
| `no_pixel_target` | never "1 pixel", "within a pixel", a tolerance or threshold |
| `no_shortcuts` | no keyboard shortcut (the skill quotes none until live check L-1) |
| `matte_not_hidden` | a matte is never called hidden |
| `no_test_tell` | never "synthetic", "fixture", "stand-in" |
| `only_mentor_tools` | no After Effects tool during a lesson |
| `demo_at_most_once` | at most one `null_parent_demo` call |
| `record_plain` | the record's summary holds no method or motive |
| **When a case runs a review** | |
| `review_no_demo` | no demo in a review |
| `review_no_null_before_pass` | SC-004: "null" is said 0 times before a pass |
| `review_no_method_before_pass` | no menu path, pick whip or Parent column before a pass |

## Case-level `expect` keys

`first_tool`, `tools_called`, `tools_not_called`, `snapshot_with` (a snapshot call with these
inputs), `snapshot_focus_excludes`, `no_focus_set`, `demo_calls_min` / `demo_calls_max` (attempts),
`demo_only_on`, `demo_after_null_ready`, `last_check` (`passed`, `parenting_passed`,
`codes_include`, `codes_exclude`, `region`), `chain_on_purpose_from_turn`, `record_lesson`
(`null` for "nothing recorded"), `review_mode`, and `say`: a list of
`{ id, must | never, turns, cs }` regex checks on the mentor's words. `turns` is 1-based
(`[2]` or `[1, 3]`), default all turns; case-insensitive unless `cs` is true.

## Cases

Numbers 1 to 20 are the numbers in spec 012's Eval plan; 21 to 26 cover the prompt-only rules
the builder flagged and the spec's cross-cases. Turns is the number of mentor turns. Fixture
source: `stand-in` (builder's hand-built file, replaced at T338), `synthetic` (permanent),
`live` (a capture; none yet).

| # | Case | Turns | Hard-rule checks (beyond the universal ones) | Rubric | Fixture source |
|---|---|---|---|---|---|
| 01 | First lesson on the wave A comp: asks first, then proposes the group | 2 | first_tool; tools_called; tools_not_called; no_focus_set; say: must asks_first, must asks_which_layers, must names_group, must reason_apart, never no_position, never no_crowd_names, never no_crowd_count, never second_group_not_yet | R-ASKS-FIRST, R-PROPOSAL, R-NO-POSITION, R-CROWD-HIDDEN, R-NAMES-REAL, R-USES-MEMORY, R-ONE-IDEA | stand-in |
| 02 | Explain: position, scale and rotation pass down; not opacity or effects | 2 | say: must position, must scale, must rotation, must opacity_named, never opacity_not_passed | R-INHERITS-RIGHT, R-NAMES-REAL, R-ONE-IDEA | stand-in |
| 03 | The pivot is asked, never picked; it'll only slide is accepted | 4 | tools_called; last_check; say: must asks_region, never never_picks | R-REGION-ASKED, R-REGION-NEVER-PICKED, R-ACCEPTS-SLIDES, R-ONE-IDEA | stand-in |
| 04 | One demonstration on the target only, moved 0 pixels, none before the null passes | 4 | demo_calls_min; demo_calls_max; demo_only_on; demo_after_null_ready; say: must moved_zero, must undo | R-DEMO-PLAIN, R-NAMES-REAL, R-ONE-IDEA | stand-in |
| 05 | B9: a correct parenting passes though the children's own values changed | 4 | last_check; say: never no_jump_claim, must asks_for_move | R-B9-PASS, R-NAMES-REAL | stand-in |
| 06 | A layer that jumped: layer, distance, direction, no cause, Edit > Undo | 4 | last_check; say: must layer, must distance, must direction, must undo, never no_cause | R-JUMP-STATED, R-NO-CAUSE, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 07 | The wrong pick whip is not a parent; the Parent column is named | 4 | last_check; say: must parent_column, never not_called_parented | R-PICKWHIP-COLUMN, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 08 | A null keyed before the parenting check still passes; nothing asked to be undone | 4 | last_check; say: never no_redo | R-KEYED-EARLY-OK, R-NAMES-REAL | stand-in |
| 09 | A fade on the null: P4 fails with the opacity hint | 4 | last_check; say: must opacity | R-OPACITY-HINT, R-HINT-NOT-FIX | stand-in |
| 10 | A visible parent: the hint names who drags whom | 4 | last_check; say: must names_both, must says_follows | R-VISIBLE-PARENT, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 11 | After a pass, the comments (linear move, default name) are offered, not graded | 4 | last_check; say: never not_graded | R-COMMENTS-UNGRADED, R-NAMES-REAL | stand-in |
| 12 | No shortcut, no null defaults, no Option or Shift claim; the menu path for Null Object | 2 | say: must menu_path, never no_modifier_claim, never no_null_defaults | R-VERSION-TRAP, R-ONE-IDEA | stand-in |
| 13 | The pivot lesson isn't learned: named and offered; on insistence, one sentence | 2 | tools_not_called; record_lesson; say: must names_pivot_lesson, must offers, must one_sentence_then_on, never no_refusal | R-PREREQ, R-ONE-IDEA | stand-in |
| 14 | An incomplete attempt: says what's still off and where; doesn't fix or offer to | 4 | last_check; say: must names_layers, must names_where, never no_offer | R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 15 | Do the rest: declined warmly, no offer later | 5 | demo_calls_max; say: never no_later_offer | R-DECLINES-WARMLY, R-ONE-IDEA | stand-in |
| 16 | Review on the wave A comp: Chip A to C, no 'null', no method, no demo | 2 | review_mode; snapshot_with; tools_called; tools_not_called; last_check; snapshot_focus_excludes; say: must names_chips, must turn_or_scale | R-REVIEW-HANDS-ON, R-REVIEW-HINT, R-NAMES-REAL | stand-in |
| 17 | Review with a visible parent: the hint has no 'null'; the skill stays learned | 3 | review_mode; snapshot_with; tools_not_called; last_check; record_lesson; say: must names_rows | R-REVIEW-HINT, R-REVIEW-RECORD-HONEST, R-NAMES-REAL | stand-in |
| 18 | A review with no new group: not offered, nothing recorded | 1 | review_mode; snapshot_with; tools_not_called; no_focus_set; record_lesson; say: never no_crowd_names, never no_crowd_count | R-REVIEW-NOTHING-NEW, R-CROWD-HIDDEN | synthetic |
| 19 | After a no: Chip A to C once, then the mentor asks; never a third offer | 4 | no_focus_set; tools_not_called; say: never chips_not_early, must chips_offered, never no_third_offer, never no_rows_offered, must asks_which_layers, must asks_to_name | R-SECOND-GROUP-ONCE, R-NAMES-REAL | stand-in |
| 20 | A crowd-only comp: the crowd question, no proposal, no layer named or counted | 2 | tools_not_called; no_focus_set; say: must crowd_question, never no_layer_names, never no_count, never no_proposal | R-CROWD-QUESTION, R-CROWD-HIDDEN, R-NAMES-REAL | synthetic |
| 21 | A null that follows another layer is asked about; the chain is checked only after the learner says so | 4 | chain_on_purpose_from_turn; last_check; say: must names_holder, must asks_on_purpose, must one_level | R-CHAIN-ASKED, R-NAMES-REAL | synthetic |
| 22 | The learner asks the mentor to choose the spot: the choice is handed back | 3 | say: never never_picks, must hands_back | R-REGION-NEVER-PICKED, R-REGION-ASKED | stand-in |
| 23 | Asked how close is close enough: no number, no pixel | 4 | say: never no_pixel_count | R-NO-NUMBER-TARGET, R-ONE-IDEA | stand-in |
| 24 | A second demonstration is declined; the one demo stays on its target | 5 | demo_calls_min; demo_calls_max; demo_only_on | R-ONE-DEMO-ONLY, R-NAMES-REAL | stand-in |
| 25 | After Effects can't be reached: nothing claimed about the comp | 1 | tools_not_called; no_focus_set; say: must says_cant_see, never no_claims | R-UNREACHABLE | none |
| 26 | A review that passes is recorded as passed, with no demo | 2 | review_mode; snapshot_with; tools_not_called; last_check; record_lesson | R-REVIEW-PASS-HONEST, R-NAMES-REAL | stand-in |

### Case notes

- **01** needs the opening to ask and the second turn (the learner has no group) to propose.
  `reason_apart` accepts "apart from", "away from" or "separate from" everything or the rest.
  The crowd check allows "Door's pivot", which is the memory of the earlier pivot lesson, not the
  crowd's Door. The 13 crowd layers: Blink, Spinner, Cut, Badge, Peg, Banner, Card, Dot 1, Dot 2,
  Dot 3, Door, Plaque, Sign.
- **02** is not on Mentor Practice's CTRL group: no fixture of that comp carries the layer
  information the skill needs. It asks the same question on the wave A comp, where Hatch Rig has a
  child. Re-point it when a Mentor Practice capture with `layer_info` exists.
- **11** covers the linear move and the default name only. The held move and the stacked motion
  comments have no fixture yet (request below).
- **16** is the L6-1 case: a review on the wave A comp after the lesson, Chip A to C offered.
  **17** and **26** use the Row A to C review fixtures; **18** uses the crowd-only comp, where a
  review has nothing new.
- **19** takes four turns: open, "no group in mind" (proposal), "no" (Chip A to C once), "no"
  (the mentor asks; nothing offered).
- **21** is the only case on `synthetic/before.json` and Holder (the null under a still parent).
- **24** is case 04's flow plus "show me again on Caption".

## The fixture tell

Synthetic fixtures carry the project name `Synthetic.aep`, the comp name `Synthetic Group` and a
`synthetic` note. The runner never hands the mentor the builder's file. For each run it writes a
scrubbed copy named `comp-N.json` into a neutral temp folder: the note is removed, the project
becomes `Lower Thirds.aep`, the comp `Lower Thirds`, and it refuses a fixture that still says
"synthetic" or "stand-in" anywhere. `--dry-run` runs the same scrub, so a new tell fails for free.
Stand-ins and live captures already use `Claude AE Tutor Test.aep` and `Mentor Practice 2`, which
match the learner records in `mentor/test/fixtures/null-parenting/records/`.

## Fixtures and re-pointing after T338

Fixtures are **not copied** into this folder. A case names a fixture by the file name the
builder's `load.mjs` uses, and the runner resolves it in the same order: a live capture in
`mentor/test/fixtures/null-parenting/`, then spec 004's capture in `.../layer-info/`, then
`stand-in/`; `synthetic/…` is only ever synthetic. Each case carries a `fixture_sources` label
for every fixture it uses, and `--dry-run` prints where each resolves to now.

After the sitting (T338), once the live captures are saved under the stand-ins' names and
`stand-in/` is deleted:

1. `node product/evals/null-parenting/run.mjs --dry-run`. It prints every stale label, such as
   `09-fade-instead-of-move: fade-null.json is labelled stand-in but resolves to live`.
2. Change those labels (`stand-in` to `live`) in each case's `fixture_sources`.
   `--strict-sources` fails until none are stale.
3. A stand-in with **no live twin under the same name** now fails the dry run with "no fixture".
   Either capture it under that name or change the cases that use it. The names the builder's
   README doesn't list as live captures, and that these cases use: `slide-null.json` (11),
   `review-rows-pass.json` (26), `practice2b-with-wave-a.json` and
   `practice2b-with-wave-a-parented.json` (01, 02, 16, 19). `practice2b.json` and
   `practice2b-parented.json` are spec 004's captures read in place.
4. Run each case once with `--only` and read the facts the checks assume, which a live capture can
   change: the 120 px left jump at 0 s (06), the Chip A to C and Row A to C proposals (16, 17, 19,
   26), and the three-layer proposal with the 2% rule (01). A changed fact is a case edit, not a
   skill bug.
5. Then the baseline: `node product/evals/null-parenting/run.mjs`. A live capture changes a case's
   hash, so `--changed` re-runs exactly the re-pointed cases.
6. The preview frame comes back as a blank placeholder in every run (the builder's fixture folder
   has no `frame.png`). The rubric tells the judge to ignore it. If live captures come with a
   `frame.png` next to them, the mentor will see it.

## Smoke run (2026-10-26)

Before the sitting, three single-case runs to prove the plumbing. Six runs, $1.99:

| Run | Case | Result | Why |
|---|---|---|---|
| 1 | 01 | FAIL | check bug: `no_position` matched "lower third" (the skill's own example) and `no_crowd_names` matched "Door's pivot" (memory). Both checks fixed |
| 2 | 01 | FAIL | check bug: `reason_apart` didn't accept "away from the rest". Fixed |
| 3 | 01 | FAIL | real: judge failed R-ASKS-FIRST. Turn 1 asked and named Tile, Caption and Stamp in the same message |
| 4 | 16 | FAIL | check bug: `not_old_group` matched "Tile" in "you did this three days ago with Tile, Caption and Stamp" (memory). Replaced by `snapshot_focus_excludes` |
| 5 | 16 | pass | |
| 6 | 20 | pass | |

Results are in `results/` (the six files, one per run). Runs 1, 2 and 4 are failures of the
checks, not the skill, and are kept because they are what the runner did.

## Reading results

Same order as easing: a failed `run` check is plumbing; a failed deterministic check is a hard-rule
break; a failed rubric item is teaching quality. Re-run a flipping case with `--repeat 3` before
changing `SKILL.md`. Rubric items are in `rubric.md`.
