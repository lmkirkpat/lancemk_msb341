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

## Status (2026-10-26): re-pointed at the live captures, before the first live lesson

28 cases, dry-run clean (`--strict-sources` too). **No baseline yet.** The set was re-pointed after
spec 012's sitting and desk block (T336 to T339): every stand-in fixture is now a live capture or
spec 004's read in place, and `stand-in/` is gone. The baseline waits for the first live lesson
(T340, T341) and the merge into `main`, because the mentor server and `SKILL.md` can still change.
Smoke runs so far: $1.99 (6 runs, before the sitting) and $2.91 (5 runs, after; see "Smoke runs").

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

A full run is about 92 mentor turns plus 28 judge calls. From the smoke run (about $0.15 a turn,
$0.05 to $0.10 a judge call) expect **$14 to $18**. Bar: SC-006, at least 80% passing, and every
hard-rule check passing. SC-003 (at least 12 cases): met, 28.

## What every case checks (no `expect` key needed)

| Check | Rule it enforces |
|---|---|
| `plain_words` | no underscore or dot name, no target ID, no quoted value from tool output |
| `no_narration` | no announced calls or rules |
| `no_pixel_target` | never "1 pixel", "within a pixel", a tolerance or threshold |
| `no_shortcuts` | no keyboard shortcut |
| `no_modifier_advice` | never tells the learner to hold Option or Shift (a negated sentence, "hold no key", passes) |
| `matte_not_hidden` | a matte is never called hidden |
| `no_test_tell` | never "synthetic", "fixture", "stand-in" |
| `only_mentor_tools` | no After Effects tool during a lesson |
| `demo_at_most_once` | at most one `null_parent_demo` call |
| `record_plain` | the record's summary holds no method or motive |
| **When a case runs a review** | |
| `review_no_demo` | no demo in a review |
| `review_no_null_before_pass` | SC-004: "null" is said 0 times before a pass |
| `review_no_method_before_pass` | no menu path, pick whip, Parent column or key to hold before a pass |

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
the builder flagged and the spec's cross-cases; 27 and 28 were added 2026-10-26 for the live
sitting's findings (L-1). Turns is the number of mentor turns. Fixture
source: `live` (a capture on Mentor Practice 2, by hand or by script per its `captured_from`, or
spec 004's read in place) or `synthetic` (permanent, only for the overlap rows the spec allows).

| # | Case | Turns | Hard-rule checks (beyond the universal ones) | Rubric | Fixture source |
|---|---|---|---|---|---|
| 01 | First lesson on the wave A comp: asks first, then proposes the group | 2 | first_tool; tools_called; tools_not_called; no_focus_set; say: must asks_first, must asks_which_layers, must names_group, must reason_apart, never no_position, never no_crowd_names, never no_crowd_count, never second_group_not_yet | R-ASKS-FIRST, R-PROPOSAL, R-NO-POSITION, R-CROWD-HIDDEN, R-NAMES-REAL, R-USES-MEMORY, R-ONE-IDEA | live |
| 02 | Explain: position, scale and rotation pass down; not opacity or effects | 2 | say: must position, must scale, must rotation, must opacity_named, never opacity_not_passed | R-INHERITS-RIGHT, R-NAMES-REAL, R-ONE-IDEA | live |
| 03 | The pivot is asked, never picked; it'll only slide is accepted | 4 | tools_called; last_check; say: must asks_region, never never_picks | R-REGION-ASKED, R-REGION-NEVER-PICKED, R-ACCEPTS-SLIDES, R-ONE-IDEA | live |
| 04 | One demonstration on the target only, moved 0 pixels, none before the null passes | 4 | demo_calls_min; demo_calls_max; demo_only_on; demo_after_null_ready; say: must moved_zero, must undo | R-DEMO-PLAIN, R-NAMES-REAL, R-ONE-IDEA | live |
| 05 | B9: a correct parenting passes though the children's own values changed | 4 | last_check; say: never no_jump_claim, must asks_for_move | R-B9-PASS, R-NAMES-REAL | live |
| 06 | A layer that jumped: layer, distance, direction, no cause, Edit > Undo | 4 | last_check; say: must layer, must distance, must direction, must undo, never no_cause | R-JUMP-STATED, R-NO-CAUSE, R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 07 | The wrong pick whip is not a parent; the Parent column is named | 4 | last_check; say: must parent_column, never not_called_parented | R-PICKWHIP-COLUMN, R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 08 | A null keyed before the parenting check still passes; nothing asked to be undone | 4 | last_check; say: never no_redo | R-KEYED-EARLY-OK, R-NAMES-REAL | live |
| 09 | A fade on the null: P4 fails with the opacity hint | 4 | last_check; say: must opacity | R-OPACITY-HINT, R-HINT-NOT-FIX | live |
| 10 | A visible parent: the hint names who drags whom | 4 | last_check; say: must names_both, must says_follows | R-VISIBLE-PARENT, R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 11 | After a pass, the comments (linear move, default name) are offered, not graded; the new null (Opacity 0) is never called faded | 4 | last_check; say: never not_graded, never null_not_faded, never no_opacity_after_pass | R-COMMENTS-UNGRADED, R-NULL-NOT-FADED, R-NAMES-REAL | live |
| 12 | Asked for a shortcut and about holding Option: the menu path, no shortcut, hold no key, never advised | 2 | say: must menu_path, must hold_no_key, never no_shortcut_given | R-VERSION-TRAP, R-ONE-IDEA | live |
| 13 | The pivot lesson isn't learned: named and offered; on insistence, one sentence | 2 | tools_not_called; record_lesson; say: must names_pivot_lesson, must offers, must one_sentence_then_on, never no_refusal | R-PREREQ, R-ONE-IDEA | live |
| 14 | An incomplete attempt: says what's still off and where; doesn't fix or offer to | 4 | last_check; say: must names_layers, must names_where, never no_offer | R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 15 | Do the rest: declined warmly, no offer later | 5 | demo_calls_max; say: never no_later_offer | R-DECLINES-WARMLY, R-ONE-IDEA | live |
| 16 | Review on the wave A comp: Chip A to C, no 'null', no method, no demo | 2 | review_mode; snapshot_with; tools_called; tools_not_called; last_check; snapshot_focus_excludes; say: must names_chips, must turn_or_scale | R-REVIEW-HANDS-ON, R-REVIEW-HINT, R-NAMES-REAL | live |
| 17 | Review with a visible parent (the learner names Row A to C, not the offered Chips): the hint has no 'null'; the skill stays learned | 3 | review_mode; snapshot_with; tools_not_called; last_check; record_lesson; say: must names_rows | R-REVIEW-HINT, R-REVIEW-RECORD-HONEST, R-NAMES-REAL | live |
| 18 | A review with no new group: not offered, nothing recorded | 1 | review_mode; snapshot_with; tools_not_called; no_focus_set; record_lesson; say: never no_crowd_names, never no_crowd_count | R-REVIEW-NOTHING-NEW, R-CROWD-HIDDEN | synthetic |
| 19 | After a no: Chip A to C once, then the mentor asks; never a third offer | 4 | no_focus_set; tools_not_called; say: never chips_not_early, must chips_offered, never no_third_offer, never no_rows_offered, must asks_which_layers, must asks_to_name | R-SECOND-GROUP-ONCE, R-NAMES-REAL | live |
| 20 | A crowd-only comp: the crowd question, no proposal, no layer named or counted | 2 | tools_not_called; no_focus_set; say: must crowd_question, never no_layer_names, never no_count, never no_proposal | R-CROWD-QUESTION, R-CROWD-HIDDEN, R-NAMES-REAL | synthetic |
| 21 | A null that follows another layer is asked about; the chain is checked only after the learner says so | 4 | chain_on_purpose_from_turn; last_check; say: must names_holder, must asks_on_purpose, must one_level | R-CHAIN-ASKED, R-NAMES-REAL | synthetic |
| 22 | The learner asks the mentor to choose the spot: the choice is handed back | 3 | say: never never_picks, must hands_back | R-REGION-NEVER-PICKED, R-REGION-ASKED | live |
| 23 | Asked how close is close enough: no number, no pixel | 4 | say: never no_pixel_count | R-NO-NUMBER-TARGET, R-ONE-IDEA | live |
| 24 | A second demonstration is declined; the one demo stays on its target | 5 | demo_calls_min; demo_calls_max; demo_only_on | R-ONE-DEMO-ONLY, R-NAMES-REAL | live |
| 25 | After Effects can't be reached: nothing claimed about the comp | 1 | tools_not_called; no_focus_set; say: must says_cant_see, never no_claims | R-UNREACHABLE | none |
| 26 | A review that passes (the learner names Row A to C) is recorded as passed, with no demo | 2 | review_mode; snapshot_with; tools_not_called; last_check; record_lesson | R-REVIEW-PASS-HONEST, R-NAMES-REAL | live |
| 27 | Asked which part of the null's square is its place: the top-left corner, not the middle | 3 | say: must names_corner, must says_corner, never not_middle_of_square | R-NULL-CORNER, R-NAMES-REAL | live |
| 28 | A layer flew off when parented: may ask once whether a key was held, never as the cause, never Option or Shift | 5 | last_check; say: must asks_key_once, never key_not_repeated, never key_not_the_cause, never no_option_or_shift_named, must states_jump, must undo | R-JUMP-STATED, R-KEY-QUESTION-ONLY, R-NO-CAUSE, R-NAMES-REAL | live |

### Case notes

- **01** needs the opening to ask and the second turn (the learner has no group) to propose.
  `reason_apart` accepts "apart from", "away from" or "separate from" everything or the rest.
  The crowd check allows "Door's pivot", which is the memory of the earlier pivot lesson, not the
  crowd's Door. The 13 crowd layers: Blink, Spinner, Cut, Badge, Peg, Banner, Card, Dot 1, Dot 2,
  Dot 3, Door, Plaque, Sign.
- **02** asks its question on the live comp (Mentor Practice 2), where Hatch Rig has a child.
- **11** covers the linear move and the default name only; the held move and the stacked motion
  comments have no fixture yet. Its extra checks are the Opacity-0 rule (T339): every new null in
  26.5 is made at Opacity 0, so a passing lesson must give no opacity hint or comment and never call
  the null faded. `null_not_faded` looks only at turns 3 and 4 and at a state ("the null is
  transparent"), because step 2 says "Fading the null does nothing" and "a null is an invisible
  handle". Its first form matched the second line (a check bug, run `2026-10-26-190518`, kept).
- **16** is the L6-1 case: a review on the live comp after the lesson, Chip A to C offered and taken.
  **17** and **26** keep the Row A to C review fixtures, and the learner says "Not those, I'd rather
  use Row A, Row B and Row C", so they are the cases where the learner names Rows. There is no live
  Chip A to C read with a visible parent or a pass yet; capture `review-chips-visible` and
  `review-chips-pass` to move 17 and 26 onto the Chips. **18** uses the crowd-only comp, where a
  review has nothing new.
- **12** changed with L-1: the skill now says what Option and Shift do and to hold no key, so the old
  "never claim anything about a modifier" check would fail a correct answer. It now requires "hold
  no key" and bans a shortcut; the universal `no_modifier_advice` bans telling the learner to hold
  one.
- **27** and **28** cover what the sitting found. 27: the null's anchor is its square's top-left, so
  its place is that corner. 28: Option keeps the child's raw values (it jumps), Shift snaps it onto
  the null; the hint may ask once whether a key was held. 28 runs two jumped turns to test "once".
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

## Fixtures

Fixtures are **not copied** into this folder. A case names a fixture by the file name the
builder's `load.mjs` uses, and the runner resolves it in the same order: a live capture in
`mentor/test/fixtures/null-parenting/`, then spec 004's capture in `.../layer-info/`;
`synthetic/…` is only ever synthetic. Each case carries a `fixture_sources` label for every fixture
it uses, and `--dry-run` prints where each resolves to now (`--strict-sources` fails on a stale
label).

The mapping the desk block used in the unit tests, and now the cases:

| Was (stand-in) | Is now |
|---|---|
| `practice2b-with-wave-a.json` (comp 300) | `practice2b.json`, spec 004's live read of Mentor Practice 2 (comp 179, wave A included) |
| `practice2b-parented.json` inside a lesson chain (cases 05, 15) | `parented-center.json`, the group under the lesson's own Null 1 at the group's middle |
| `practice2b-with-wave-a-parented.json` | the live capture of the same name (case 16) |
| every other stand-in (`null-center.json`, `jumped.json`, ...) | the live capture of the same name (by hand or script) |

Spec 004's `practice2b-parented.json` (Null 11 at the comp center) is not used by any case: it
isn't the lesson's null. What a live capture changed that the cases rely on: the comp id is 179
(not 300), the text boxes are AE's own, and a new null is a 100 x 100 square with its anchor at
(0, 0), Opacity 0, at the comp's center. No case asserts those numbers directly; cases 11 and 27
test the behavior that follows from them. The 120 px left jump at 0 s (06, 28) is unchanged in
`jumped.json`.

The preview frame comes back as a blank placeholder in every run (no `frame.png` beside the
captures). The rubric tells the judge to ignore it.

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

## Smoke runs after the sitting (2026-10-26, $2.91, 5 runs)

| Run | Case | Result | Why |
|---|---|---|---|
| 1 | 27 | FAIL | judge: R-ONE-IDEA on turn 2 (the skill's step 2 explanation is long). R-NULL-CORNER passed and all checks passed. Not this case's reason, so R-ONE-IDEA was dropped from 27 (not re-run, budget) |
| 2 | 16 | pass | Chip A to C review on the live comp |
| 3 | 11 | FAIL | check bug: `null_not_faded` matched the skill's own "A null is an invisible handle". Check narrowed |
| 4 | 01 | pass | live `practice2b.json`; turn 1 asked and stopped (see below) |
| 5 | 11 | pass | after the check fix |

Not yet run at all: 28 (the held-key case) and the other re-pointed cases. Case 12's new checks are
also unrun.

**Known: case 01 ask-and-stop.** The earlier smoke (run 3 above) saw turn 1 name Tile, Caption and
Stamp in the same message as the question. `SKILL.md` step 1 is unchanged on this point (it says "ask
first" with no "ask and stop"), but the one run on the live fixture asked and stopped. One run
proves nothing, so this stays a watch item: if the full run or a `--repeat 3` of case 01 fails
`R-ASKS-FIRST` or `second_group_not_yet`, the proposal is the skill's wording, not the fixture.

## Reading results

Same order as easing: a failed `run` check is plumbing; a failed deterministic check is a hard-rule
break; a failed rubric item is teaching quality. Re-run a flipping case with `--repeat 3` before
changing `SKILL.md`. Rubric items are in `rubric.md`.
