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

**Cases 39 and 40 (added 2026-10-28, dry-run only so far).** 39 is FR-023 (rig example only on request); 40 is the
resumed-before-the-region-question branch (SKILL.md ~:162). Known overlap: **case 37** (same fixture, same shape) expects
`must \bnull\b` on the reopened turn, which the new branch contradicts if the region was never answered. Expect 37 to fail
`goes_to_null_step` or `R-NULL-CONTINUED` until it is re-pointed (it should pass the region question first, or answer it in
turn 1). Not changed here: 37 was not in this task's runs. `R-NULL-CONTINUED` now says asking the region question first passes.

## First full baseline (2026-10-28, 38 cases, `results/2026-10-28-125016.json`)

On `main`'s mentor, Phase 10 as merged. **23/38 (61%)** in the one full run, $23.45. Three plumbing reruns (05 timed out
with `claude` ETIMEDOUT; 09 and 10 had unreadable judge replies) cost $2.39: 05 pass (`-125611`), 09 pass (`-125650`),
10 FAIL on a hard rule (`-125719`). With the reruns: **25/38 (66%), $25.84 in all. SC-006 not met** (needs 80% and every
hard-rule check passing).

**SC-015 over the 38 runs (37 with a tool call; 05's first run timed out before any, and its rerun is clean):** text before
the first snapshot **0**; first tool not `null_parent_snapshot` **0**; skill IDs in learner-visible text **0**. The
"nothing before the first snapshot" check failed 0 times. Met.

T415 slips today: 01 skipped the memory clause again (fail, R-USES-MEMORY); 35 and 34 passed this time (no repeat of
the slide claim or the two notes sentences).

Failures (not repeated beyond the plumbing reruns: the $26 budget left no room):

| Case | Kind | Triage |
|---|---|---|
| 03, 10 | hard rule, `no_pixel_target` | **Mentor, real.** "a single pixel" in both (10 on its rerun). `SKILL.md:42` bans "1 pixel" only |
| 20 | hard rule, `say:no_count` | **Check bug (fixed 2026-10-28).** "several layers" is the lesson's generic intro; spec 012 FR-005a bans listing, counting or naming the crowd, and the sanctioned line says "many layers". `no_count` now bans numerals and number words only (2 to 4 allowed: the question itself) |
| 32 | hard rule, `say:no_rig_move_claim` | **Check bug (fixed 2026-10-28).** "I can't show you how Hatch Rig moves" matched a check that bans the claim, not the denial; the regex now skips a match after a denial word in the same sentence |
| 04, 11, 28, 30 | rubric R-NAMES-REAL | **Rubric too wide (fixed 2026-10-28).** "Parent & Link" is the real column label in AE 26.5 (Columns menu, confirmed by the builder); R-NAMES-REAL now exempts After Effects interface names, layer and property names still need tool output |
| 02, 04, 15, 23 | rubric R-ONE-IDEA | Mentor, real: the step 2 explanation runs long (bullets, null, example, menu path, question) |
| 01 | rubric R-USES-MEMORY | Mentor, noise-prone (same as T415, 2 of 4 runs today) |
| 11 | rubric R-COMMENTS-UNGRADED | Mentor, one run: a third note the tool never listed |
| 18 | rubric R-DUE-NO-NEW-LESSON | Mentor/check: crowded comp asked "which layers" rather than the crowd question. Judge may be right; one run |

Proposed fixes, smallest first: (1) `SKILL.md:42` ban "a single pixel" along with every pixel wording (fixes 03, 10);
(2) drop or source the "Parent & Link" menu path (fixes 4 R-NAMES-REAL fails); (3) cap step 2's explanation at a few
sentences with no bullets (4 R-ONE-IDEA fails); (4) fix check `no_rig_move_claim` to ignore "can't show you how X moves"
and decide whether "several" is a count in 20 (eval side; both done 2026-10-28, and (2) is now rubric-side: the menu path is real).

## T415 (2026-10-28): SC-015's repeats, 12 runs, $4.26

Spec 004 T415, `--repeat 3` on four cases, on `main`'s mentor (this worktree's `mentor/` and skills match `main`).
Cases: **01** (first lesson), **35** (practicing), **16** (review due), **34** (unreadable record). Results:
`results/2026-10-28-115040.json` (01), `-115153` (16), `-115246` (34), `-115338` (35). No plumbing failures.

| SC-015 count over the 12 runs | Result |
|---|---|
| Runs with learner-visible text before the first snapshot call | **0** |
| Runs whose first tool isn't `null_parent_snapshot` | **0** |
| Skill IDs in learner-visible text | **0** |

Cases passed (majority): 01 2/3, 16 3/3, 34 2/3, 35 2/3. The three rubric failures do not count against SC-015:
- 01 run 3, R-USES-MEMORY: the mentor never mentions the earlier pivot lesson. Mentor wording (a memory clause
  skipped), judgment item, one of three.
- 34 run 2, R-UNREADABLE-ONCE: two sentences about the notes where the item wants one. Mentor wording, one of three.
- 35 run 3, R-USES-MEMORY: "instead of just a slide" claims earlier work the record doesn't hold. Mentor, honesty
  in the memory clause, one of three. Watch item: not repeated.
The full baseline is not run.

## Status (2026-10-28): 38 cases, round 2 fixes verified, ready for T415 and the baseline

**Round 2 re-run (2026-10-28, after `phase10-round2`, each `--repeat 3`, $7.43 in all):** 34 3/3, 18 3/3, 38 (new) 3/3,
17 3/3, 37 3/3 on the second pass. The first 37 pass was 1/3, and both fails were my regex (`does_not_say_null_placed`
matched "haven't placed the null" and "Your null isn't"); fixed to a positive claim only, rerun 3/3. All three earlier
mentor failures (18, 34, 37) and case 17's record wording are gone; no mentor failure open. Unrun since the
re-pointing are still the cases listed below, so expect check bugs in the first full run. Full run now about $20.

Status as of 2026-10-27 (kept for the history): 37 cases, Phase 10 checks in, not ready for SC-015's repeats yet

37 cases, dry-run clean (`--strict-sources` too). **No baseline yet.** Skill 6 is merged (`31fe72d`) and so is
Phase 10 (`1a28b1d`, "The opening read"); T413 and T414 (spec 004) are done on this branch: see "Phase 10 changes
(T413, T414)" below. Smoke on the new and changed cases: 8 of 12 cases passed once or more, 3 fail on the mentor (18,
34, 37) and 1 flips (17). **Blocks SC-015's repeats and the baseline:** three mentor items for the cockpit to route
(case 18: the snapshot picks a review on a crowded comp; case 34: the pivot lesson offered as "not done" from an
unread record; case 37: the explanation is repeated on a lesson left open), and case 17's record wording. Nothing in
the plumbing blocks. **Never run since the re-pointing:** 02, 03, 04, 06 to 10, 13 to 15, 19, 21 to 25.
The first full run is also their first run, so expect a few check bugs there; the cost of a failed case is
about $0.5.

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

A full run is about 117 mentor turns plus 37 judge calls. From the smokes (cases run at $0.13 to $1.13, mean
about $0.55; about $0.15 a turn, $0.05 to $0.10 a judge call) expect **$18 to $22**. Bar: SC-006, at least 80% passing, and every
hard-rule check passing. SC-003 (at least 12 cases): met, 37.

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
| `no_text_before_snapshot` | nothing said between the first tool call and the first `null_parent_snapshot` (FR-052; catches the leaked "Review is due." self-note) |
| `read_learner_record_never_called` | the opening reads the record through the snapshot, so `read_learner_record` is never called (FR-052). It is not in the runner's `--allowedTools` either (OR-2) |
| `record_plain` | the record's summary holds no method or motive |
| **When a case runs a review** | |
| `review_no_demo` | no demo in a review |
| `review_no_null_before_pass` | SC-004: "null" is said 0 times before a pass |
| `review_no_method_before_pass` | no menu path, pick whip, Parent column or key to hold before a pass |

## Case-level `expect` keys

`first_tool`, `first_snapshot_reply` (fields of the first successful snapshot **reply**, e.g. `{ "mode": "review", "mode_source": "review_due" }`; replaces `snapshot_with` for the opening call, which sends no mode), `tools_called`, `tools_not_called`, `snapshot_with` (a snapshot call with these
inputs; now unused by any case), `snapshot_focus_excludes`, `no_focus_set`, `demo_calls_min` / `demo_calls_max` (attempts),
`demo_only_on`, `demo_after_null_ready`, `last_check` (`passed`, `parenting_passed`,
`codes_include`, `codes_exclude`, `region`), `chain_on_purpose_from_turn`, `record_lesson`
(`null` for "nothing recorded"), `record_lesson_never` (`{ field: regex }` the last record's fields must not match), `preview_times_from_output` (every `preview_frame` time appears as a number in an earlier mentor tool result), `review_mode` (a snapshot reply said `mode` review), and `say`: a list of
`{ id, must | never, turns, cs }` regex checks on the mentor's words. `turns` is 1-based
(`[2]` or `[1, 3]`), default all turns; case-insensitive unless `cs` is true.

## Cases

Numbers 1 to 20 are the numbers in spec 012's Eval plan; 21 to 26 cover the prompt-only rules
the builder flagged and the spec's cross-cases; 27 and 28 were added 2026-10-26 for the live
sitting's findings (L-1); 29 and 30 for the first lessons' findings 1 and 4 (`null-parenting.md`); 31 to 33
(2026-10-27) for D-4's corner sentence and step 2's "never describe a null's move"; 34 to 37 (2026-10-27) for Phase 10's new cases (T414). Turns is the number of mentor turns. Fixture
source: `live` (a capture on Mentor Practice 2, by hand or by script per its `captured_from`, or
spec 004's read in place) or `synthetic` (permanent, only for the overlap rows the spec allows).

| # | Case | Turns | Hard-rule checks (beyond the universal ones) | Rubric | Fixture source |
|---|---|---|---|---|---|
| 01 | First lesson on the wave A comp: asks first, then proposes the group | 2 | first_tool (null_parent_snapshot); tools_called; tools_not_called; no_focus_set; say: must asks_first, must asks_which_layers, must names_group, must reason_apart, never no_position, never no_crowd_names, never no_crowd_count, never second_group_not_yet | R-ASKS-FIRST, R-PROPOSAL, R-NO-POSITION, R-CROWD-HIDDEN, R-NAMES-REAL, R-USES-MEMORY, R-ONE-IDEA | live |
| 02 | Explain (pacing, 2026-10-28): the learner names the group; position, scale and rotation pass down, not opacity or effects, in one sentence; no CTRL or Hatch Rig unless asked; no null task; ends on the turn-or-scale question | 2 | say: must position, must scale, must rotation, must opacity_named, never opacity_not_passed, never no_rig_example_unasked, never no_null_task_in_explain, must asks_region, must ends_on_question | R-INHERITS-RIGHT, R-NAMES-REAL, R-ONE-IDEA | live |
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
| 15 | Do the rest (pacing, 2026-10-28): declined warmly, no offer to do it later; the one demo offer made once (turns 3 to 4) and never twice (turns 3 to 5) | 5 | demo_calls_max 0; say: never no_later_offer, must demo_offer_made, at_most 1 demo_offer_once | R-DECLINES-WARMLY, R-ONE-IDEA | live |
| 16 | Review on the wave A comp: Chip A to C, no 'null', no method, no demo | 2 | review_mode; first_snapshot_reply; tools_called; tools_not_called; last_check; snapshot_focus_excludes; say: must names_chips, must turn_or_scale | R-REVIEW-HANDS-ON, R-REVIEW-HINT, R-NAMES-REAL | live |
| 17 | Review with a visible parent (the learner names Row A to C, not the offered Chips): the hint has no 'null'; the skill stays learned | 4 | review_mode; first_snapshot_reply; tools_not_called; last_check; record_lesson; say: must names_rows | R-REVIEW-HINT, R-REVIEW-RECORD-HONEST, R-NAMES-REAL | live |
| 18 | A due review with no new group (OR-1): a lesson starts, no review mentioned, nothing recorded | 1 | first_tool; first_snapshot_reply (lesson, default); tools_called; tools_not_called; no_focus_set; record_lesson; say: never no_review_mentioned, must asks_group, never no_crowd_names, never no_crowd_count | R-DUE-NO-NEW-LESSON, R-CROWD-HIDDEN | synthetic |
| 19 | After a no: Chip A to C once, then the mentor asks; never a third offer | 4 | no_focus_set; tools_not_called; say: never chips_not_early, must chips_offered, never no_third_offer, never no_rows_offered, must asks_which_layers, must asks_to_name | R-SECOND-GROUP-ONCE, R-NAMES-REAL | live |
| 20 | A crowd-only comp: the crowd question, no proposal, no layer named or counted | 2 | tools_not_called; no_focus_set; say: must crowd_question, never no_layer_names, never no_count, never no_proposal | R-CROWD-QUESTION, R-CROWD-HIDDEN, R-NAMES-REAL | synthetic |
| 21 | A null that follows another layer is asked about; the chain is checked only after the learner says so | 4 | chain_on_purpose_from_turn; last_check; say: must names_holder, must asks_on_purpose, must one_level | R-CHAIN-ASKED, R-NAMES-REAL | synthetic |
| 22 | The learner asks the mentor to choose the spot: the choice is handed back | 3 | say: never never_picks, must hands_back | R-REGION-NEVER-PICKED, R-REGION-ASKED | live |
| 23 | Asked how close is close enough: no number, no pixel | 4 | say: never no_pixel_count | R-NO-NUMBER-TARGET, R-ONE-IDEA | live |
| 24 | A second demonstration is declined; the one demo stays on its target | 5 | demo_calls_min; demo_calls_max; demo_only_on | R-ONE-DEMO-ONLY, R-NAMES-REAL | live |
| 25 | After Effects can't be reached: nothing claimed about the comp | 1 | tools_not_called; no_focus_set; say: must says_cant_see, never no_claims | R-UNREACHABLE | none |
| 26 | A review that passes (the learner names Row A to C) is recorded as passed, with no demo | 3 | review_mode; first_snapshot_reply; tools_not_called; last_check; record_lesson | R-REVIEW-PASS-HONEST, R-NAMES-REAL | live |
| 27 | Asked which part of the null's square is its place: the top-left corner, not the middle | 3 | say: must names_corner, must says_corner, never not_middle_of_square | R-NULL-CORNER, R-NAMES-REAL | live |
| 28 | A layer flew off when parented: may ask once whether a key was held, never as the cause, never Option or Shift | 5 | last_check; say: must asks_key_once, never key_not_repeated, never key_not_the_cause, never no_option_or_shift_named, must states_jump, must undo | R-JUMP-STATED, R-KEY-QUESTION-ONLY, R-NO-CAUSE, R-NAMES-REAL | live |
| 29 | At a pass on a Rotation move the check gives no key times: no preview frame at a time no tool output held | 4 | last_check; preview_times_from_output | R-NO-GUESSED-TIME, R-NAMES-REAL | live |
| 30 | The learner says the group turns but only slid the null: the record doesn't say it turned or scaled | 4 | last_check; tools_called; record_lesson_never | R-RECORD-SEEN-MOVE, R-NAMES-REAL | live |
| 31 | The null's corner sentence is said once, at the place question (turn 3), and not again once the learner placed it (turn 4); never the square's size or Opacity | 4 | say: must corner_said, never corner_not_repeated, never no_size_or_opacity | R-CORNER-ONCE, R-NAMES-REAL | live |
| 32 | Asked how the null Hatch already follows moves: the explain step never describes a null's move | 2 | tools_not_called; say: never no_rig_move_claim | R-NO-NULL-MOVE, R-NAMES-REAL | live |
| 33 | A review whose pivot misses the place the learner named (rows' middle, said top-left): the hint has no square, no corner sentence | 3 | review_mode; first_snapshot_reply; tools_not_called; last_check (pivot_region); say: never no_square, must names_rows | R-REVIEW-NO-SQUARE, R-NAMES-REAL | live |
| 34 | An unreadable record (FR-049): one sentence about the notes, said once; a first lesson; no claim from the unread record; no review | 2 | first_tool; first_snapshot_reply (lesson, default); tools_called; tools_not_called; no_focus_set; say: must says_notes_unreadable, never no_claim_from_unread_record, never notes_said_once (turn 2), never no_review, never no_memory_claim, never no_file_or_code | R-UNREADABLE-ONCE, R-NAMES-REAL, R-ONE-IDEA | live |
| 35 | Practicing (a partial lesson yesterday): one memory clause in plain words, no review, then it asks which layers | 1 | first_tool; first_snapshot_reply (lesson, default); tools_called; tools_not_called; no_focus_set; say: must memory_clause, must names_earlier_work, must asks_which_layers, never no_review, never no_skill_name_or_status | R-USES-MEMORY, R-ASKS-FIRST, R-ONE-IDEA, R-NAMES-REAL | live |
| 36 | A review asked for when none is due: it runs, and nothing says it was early or not due | 1 | first_tool; review_mode; first_snapshot_reply (review, asked); tools_called; tools_not_called; snapshot_focus_excludes; say: must names_chips, must turn_or_scale, never nothing_about_schedule | R-ASKED-REVIEW-QUIET, R-REVIEW-HANDS-ON, R-NAMES-REAL | live |
| 37 | A lesson left open on Tile, Caption and Stamp, reopened in a new session: where it left off, no "which layers" question, no new proposal | 2 | tools_called; tools_not_called; say: must names_group, never no_which_layers, never no_new_proposal, never no_review | R-NULL-CONTINUED, R-NAMES-REAL | live |
| 38 | A lesson left open with the null placed, reopened in a new session (round 2 C): where it left off (group, null placed), then parenting; no recap, no second null | 3 | tools_called; tools_not_called; say: must names_group, must says_null_placed, must goes_to_parenting, never no_which_layers, never no_new_proposal, never no_recap, never no_second_null, never no_review | R-NULL-CONTINUED, R-NAMES-REAL | live |
| 39 | The rig example (Hatch follows Hatch Rig) stays out of the explanation turn and is named only when asked (2026-10-28, FR-023, TD 012 § 16) | 3 | tools_not_called; say: never no_rig_in_explain, must names_rig_when_asked, never no_rig_move_claim, never no_null_task, must asks_region_again, must ends_on_question | R-NO-NULL-MOVE, R-NAMES-REAL, R-ONE-IDEA | live |
| 40 | A lesson reopened in a new session before the turn-or-scale question was answered: that question first, on its own, no null task, no recap (SKILL.md step 2 picked up again) | 2 | tools_called; tools_not_called (demo, check); say: must names_group, must asks_region_first, must ends_on_question, never no_null_task, no_which_layers, no_new_proposal, no_recap, no_review | R-NULL-CONTINUED, R-ONE-IDEA, R-NAMES-REAL | live |

Round 2 (2026-10-28): 34 gained `notes_sentence_once_in_turn_1` and a wider `no_claim_from_unread_record` (any word about
easing or the pivot). 37 is now the null-not-placed branch (adds `no_recap`, `goes_to_null_step`, `does_not_say_null_placed`).
38 is the placed branch. 18 and 17 unchanged (18 already expected a lesson).

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
  due review has nothing new to review on (now: a lesson starts, OR-1).
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
- **31 to 33** (2026-10-27). 31: the check is the sentence's shape (`corner ... square`), so a pivot hint that
  names the corner of the square would also match; turn 4 uses `null-top-left.json` (the null already placed), so
  no pivot hint is due and any corner talk is a repeat. 32 uses the live `Hatch` / `Hatch Rig` pair (a layer that
  follows a null; the snapshot carries no keys for it). Its `never` bans a verb right after "Hatch Rig"; generic
  talk ("anything Hatch Rig does to its Position") and "I can't tell whether Hatch Rig has keys" pass.
  33 plants the one review branch where a pivot hint is due (`review-rows-pass.json`: the rows parented, the null
  at their middle) and bans the word "square" across the whole case.
- **Review cases need the learner's rows named while the comp is still the before comp** (17, 26, 33): turn 2 on
  `practice2b.json` names the rows, turn 3 on the after fixture says "Done". The first form of 17 and 26 sent both
  in one turn on the after fixture, so the mentor's focus snapshot saw rows that already followed a layer and
  said it couldn't review them (case 33's first run, and case 26's run, `check: no successful null_parent_check`).
- **24** is case 04's flow plus "show me again on Caption".

- **29** guards a regression (passes today, 1 of 1, $0.84). **30** was written to fail until `SKILL.md`
  step 11 names only the move the check saw. Its two runs (2026-10-26, results `-210142`, `-210247`)
  failed for test reasons (a fixture mismatch, then a check that was too wide); its last record was
  clean, so the live defect isn't reproduced yet. See the case's `notes`.

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

**2026-10-26, `--only 01 --repeat 3` ($1.10, `results/2026-10-26-203004.json`):** 3 of 3 pass;
`R-ASKS-FIRST` and `second_group_not_yet` passed in every run (turn 1 asked and stopped each
time). With the live-fixture smoke, 4 of 4 on `practice2b.json`; the stand-in failure is taken as
the fixture. Still worth a look in T340's transcript.

**2026-10-26, after the pre-T340 `SKILL.md` pass (`5bfdbd3`: ask and stop, step 2 frame only,
invented example names, D-4's corner sentence at stage 3, review jump hint), $2.13:** 01, 11, 12
and 27 each pass once (`results/2026-10-26-203846.json` to `-204021.json`). The corner sentence's once-per-lesson and
never-in-a-review rules and step 2's "never describe a null's move" are now cases 31, 33 and 32.

## Smoke round 2026-10-27 ($7.56, 12 runs, 7 cases, mentor on `main` at `79eb6ed`)

Cases that already had a pass since the re-pointing (01, 11, 12, 16, 27, 29, 30) were not re-run. Triage:

| Run | Case | Result | Cost | Triage |
|---|---|---|---|---|
| 1 | 31 | pass | $0.80 | corner sentence at turn 3, none at turn 4 |
| 2 | 32 | FAIL | $0.31 | check bug: `Hatch Rig has keys` matched "I can't tell whether Hatch Rig has keys". Verb list narrowed (dropped keys) |
| 3 | 33 | FAIL | $0.33 | case bug: rows named and "Done" in one turn on the parented comp; mentor said it couldn't review rows that already follow a layer. Turns split |
| 4 | 28 | FAIL | $0.96 | check bug: `key_not_repeated` matched the instruction "with no key held". The mentor asked the question once at turn 4 and the other checks passed. Never now bans a question form only |
| 5 | 26 | FAIL | $0.33 | same case bug as run 3. Turns split |
| 6 | 32 | FAIL | $0.31 | check bug: "anything Hatch Rig does to its Position, Scale" is the generic explanation. Regex now needs a verb right after "Hatch Rig" |
| 7 | 33 | pass | $0.63 | after the split |
| 8 | 26 | pass | $0.64 | after the split |
| 9 | 28 | pass | $1.13 | after the regex fix (first pass of the held-key case) |
| 10 | 17 | FAIL | $0.86 | **mentor, minor, real?** all checks passed; judge failed R-REVIEW-RECORD-HONEST: the record's summary says "followed Row A, a visible layer, rather than a separate handle", which names the fix. One run, not repeated |
| 11 | 32 | pass | $0.41 | after the second fix |
| 12 | 05 | pass | $0.85 | B9, a correct parenting passes though raw values changed |

Files: `results/2026-10-27-150943.json` to `-151638.json`.
Runs 2 to 6 are failures of my cases or checks, not the mentor (run 6 is the second fix of 32), and are kept as the runner recorded them.

**Real mentor findings.**
1. Case 17: the review's partial record puts the fix in the summary. Smallest fix: in `SKILL.md` step 11 (and the
   review's step 5), "`summary` says what the learner did and what the check saw, never what they should have
   done instead." Repeat 17 three times first (`--only 17 --repeat 3`, about $2.50) before changing anything.
2. Self-note leak ("Review is due. Run the review." before the first snapshot) appeared again in case 33's first run and in
   case 17 (turn 1 of each review); the known cross-skill item (snapshot reads the record and picks review mode),
   not new. The universal `no_narration` did not flag it.

## Phase 10 changes (T413, T414; 2026-10-27)

Spec 004 FR-052, on the mentor as `1a28b1d` leaves it (`null_parent_snapshot` reads the record and picks lesson
or review; `SKILL.md` never calls `read_learner_record`).

**Runner (T413).** New universal checks `no_text_before_snapshot` (copied from the pivot set's `run.mjs`) and
`read_learner_record_never_called`; `read_learner_record` is out of `--allowedTools` (OR-2) but stays in the list of
tool names the runner recognises, so a call to it is reported by the check rather than as a foreign tool. A review
is now whatever a snapshot **reply** says (`mode` review), not a call's input. New `expect.first_snapshot_reply`;
`first_snapshot_reply` replaces `snapshot_with` in the four review cases. Two small runner additions the new cases
needed: a turn can set `new_session` (as in the pivot set), and `learner_record` may be a path from the repo root
(this set's own `records/`) or a name in the shared `mentor/test/fixtures/records/`.

**Changed cases (T413).**

| Case | Change |
|---|---|
| 01 | `first_tool` is `null_parent_snapshot` |
| 16, 17, 26, 33 | `snapshot_with: { mode: review }` replaced by `first_snapshot_reply: { mode: review, mode_source: review_due }` |
| 18 | Renamed `18-due-review-no-new-group`. Was "a review with nothing new: says so, records nothing"; now OR-1: a lesson starts (`first_snapshot_reply` lesson, default), no word about a review (`no_review_mentioned`), nothing recorded. Rubric `R-REVIEW-NOTHING-NEW` replaced by `R-DUE-NO-NEW-LESSON` |

**New cases (T414).** Four of the cockpit's numbers (34 to 37) are used, one per FR-052 bullet. Three records:
`unreadable.json` (shared, from `mentor/test/fixtures/records/`), and two this set owns in `records/`:
`null-practicing.json` (a partial lesson yesterday, status practicing) and `null-learned-not-due.json` (learned,
review due in December 2027). New rubric items: `R-UNREADABLE-ONCE`, `R-ASKED-REVIEW-QUIET`, `R-NULL-CONTINUED`,
`R-DUE-NO-NEW-LESSON`. **37 is the continued form of FR-046** (a lesson left open, reopened in a new session); a
lesson resumed after another comp's lesson has no case yet. The practicing record's dates are fixed, so 35's
`memory_clause` accepts any plain "how long ago" wording rather than "yesterday" only.

**Smoke, 2026-10-27, 20:36 to 20:45 (about 9 minutes), $6.61, 14 runs** (results `2026-10-27-203633` to
`-204413`). The first run's output file was overwritten by a neighbouring agent writing to the same scratch name;
the results files above are the record.

| Case | Runs | Result | Triage |
|---|---|---|---|
| 35 | 1 | pass | |
| 36 | 1 | pass | review ran on request, nothing about the schedule |
| 01 | 1 | pass | |
| 16 | 1 | pass | |
| 26 | 1 | pass | |
| 33 | 1 | pass | |
| 17 | 3 | **2 pass, 1 FAIL** | `R-REVIEW-RECORD-HONEST`, mentor, real (below) |
| 18 | 1 | FAIL | **mentor, real.** The snapshot picked `review` (`review_due`) on the crowded comp: `finder()` in `mentor/lib/null-parenting.mjs:314` returns the crowd's size as a count when nothing is excluded, so `reviewFor` sees a target, though `proposal` is null. The mentor then said "nothing new to review". OR-1 / FR-051 row 5 not met for a crowded comp |
| 34 | 2 | FAIL, FAIL | Run 1: three of my check bugs (`asks_which_layers` was wrong for this case, `earlier lesson` and `kept as they were` are the error's own words); fixed. Run 2: **mentor, real.** After the right notes sentence it says "Set the pivot, which you haven't done yet" from a record it couldn't read |
| 37 | 2 | FAIL, FAIL | `R-NULL-CONTINUED`, mentor, judgment, 2 of 2: says where it left off and names the group, then re-explains ("Here's a quick recap. A parent carries ...") |

**Self-note.** `no_text_before_snapshot` and `first_tool` passed in all 14 runs, including the review runs (16, 17 x3,
26, 33, 36). "Review is due." never appeared before a snapshot. The self-note is gone in every smoked case.

**Round 2 results (2026-10-28, `results/2026-10-28-*.json`).** 34: 3/3 ($1.12). 18: 3/3 ($0.69). 37: 1/3 first pass
(my regex, $0.98), then 3/3 ($1.20). 38: 3/3 ($1.82). 17: 3/3 ($2.60). The Case 17 and earlier tables below are the 10-27 smoke.

**Case 17 (`--only 17 --repeat 3`, $2.55).** 2 of 3 pass. The failing run's record put method in the summary and
next ("no separate control layer yet", "follow one invisible control layer"). With the earlier smoke run
(`2026-10-27-151638`, "followed Row A, a visible layer, rather than a separate handle") that is 2 failures in 4
runs on this item. Real, minor. Smallest fix: `SKILL.md` step 11, and the review's step 5, add "`summary` and
`next` say what the learner did and what the check saw, never what they should have done or how."

**Ready for SC-015's repeats and the baseline?** The plumbing is. The mentor items below should be routed first, or
SC-015 will count them: the repeats of 18, 34 and 37 would fail 3 of 3 as the mentor stands. 35, 36, 01, 16, 26 and
33 can start now.

## Reading results

Same order as easing: a failed `run` check is plumbing; a failed deterministic check is a hard-rule
break; a failed rubric item is teaching quality. Re-run a flipping case with `--repeat 3` before
changing `SKILL.md`. Rubric items are in `rubric.md`.

## Fix re-runs 2026-10-28

After the check and rubric fixes (`5ec8553`) and the `SKILL.md` wording fixes (`e82a7d2`), eight cases were
re-run with `--repeat 3`, one invocation each, $14.37 in all. Cases 15, 18, 23, 28 and 30 were not run: the
budget limit ($15) would have been passed.

| Case | Passed | Result |
|---|---|---|
| 01 | 3/3 | Fixed (R-USES-MEMORY; the memory clause is in the opening) |
| 02 | 1/3 | Same problem: R-ONE-IDEA, step 2 still packs several ideas |
| 03 | 0/3 | Run 1 a new hard-rule break (`never_picks`, "put it on"); runs 2 and 3 the same R-ONE-IDEA |
| 04 | 0/3 | Same problem: R-ONE-IDEA in turns 2 to 4 (a hard-rule pass, the judge fails them) |
| 10 | 2/3 | Run 3 `no_pixel_target` on "one-pixel" (hyphenated; the skill ban may not cover it) |
| 11 | 3/3 | Fixed (comments) |
| 20 | 3/3 | Fixed (check; the lead-in "Today's idea is..." still appears once, unjudged) |
| 32 | 3/3 | Fixed (check) |

Not fixed: step 2 is still too long for R-ONE-IDEA (02, 03, 04 = 7 of 9 runs failed on it). Result files:
`results/2026-10-28-132042.json` (01), `-132156` (02), `-132344` (03), `-132609` (04), `-133243` (10), `-133512` (11),
`-133607` (20), `-133728` (32).

## Check fixes and re-runs, 2026-10-28, round 2

- **Case 03 `never_picks`:** the last part now needs a place word after "put it in/at/on" (top, bottom,
  center, middle, corner, left, right), so "You put it on the spot the group should turn or scale from" no
  longer matches. Checked offline: it passes all three runs of `2026-10-28-132344` (the old pattern failed run
  1 on "put it on"), and still fails "Put it at the top-left", "Place it in the center" and "Park it on the left
  edge". Not re-run live (see below).
- **Case 10 preview image:** the fixture server returns a 1 x 1 placeholder unless a `frame.png` sits beside the
  snapshot copies. The runner now writes a flat dark 1920 x 1080 PNG (`blankFrame()`, about 8 KB, valid PNG)
  there for every run. It isn't the easing set's `frame.png`, which shows another comp ("An easing lesson")
  that doesn't match Tile, Caption and Stamp. Dry run is clean; no live run has seen it yet, so whether the
  mentor stops commenting on the image is untested. `mentor/` is untouched. The anchor set has the same 1 x 1
  placeholder.
- **Re-runs not done:** the budget guard stopped before cases 03 and 10 (see the hand-back for the spend).

## Pacing changes (2026-10-28, T345; TD § 16, spec 012 Eval plan 2 and 15, FR-023a)

Written on `pacing-evals`; no paid run yet. T346 runs 02, 03, 04, 15 and 23 (and 10) with the mentor from `pacing-skills`.

- **Rubric.** `R-ONE-IDEA` takes TD § 16 › What R-ONE-IDEA should see: the explanation turn (frame, group, idea sentence
  and the turn-or-scale question) is one idea and passes when it ends on the question, and a second explanatory sentence
  (why a null, an example rig nobody asked for) or any null task fails it; the add-the-null turn (menu path, never-renders,
  corner) is one task; the parenting turn's demo offer is the action's alternative; a side-question or 'do it for me' turn
  passes as the answer plus the pending action.
- **Case 02.** The learner now names the group (as in 03) instead of asking 'why do I need a null'; that question invited the
  rig example. New checks on turn 2: `no_rig_example_unasked` (never CTRL or Hatch Rig), `no_null_task_in_explain` (no menu
  path, 'add a null', Null Object), `asks_region`, `ends_on_question`. The 'rig only when asked' half has no case yet (proposal in the hand-back).
- **Case 15.** `demo_calls_max` is 0 (the learner never says yes). New `demo_offer_made` (turns 3 to 4) and `demo_offer_once`
  (`at_most` 1, turns 3 to 5). **The offer pattern is a guess**: the current `SKILL.md` has no fixed offer wording, so
  check it against the first `pacing-skills` transcripts and tighten it. Rubric stays `R-DECLINES-WARMLY` and `R-ONE-IDEA`.
- **Case 03** unchanged: its `never_picks` break should go because the null sentence moved to the add-the-null turn
  (TD § 16, the eval engineer's note); T346 checks it.
- **Runner.** The judge sees each tool result up to 16000 characters (was 6000). New: a `say` check may carry `at_most`
  with `must` (counts matches, as in the anchor set).

## T346 pacing re-runs (2026-10-28, `--repeat 3` each, 8 commands, $21.74 in all)

On the null `SKILL.md` with T344's pacing edits. Majority passes. Counted result per case is the last line of each row.

| Case | Runs | Counted | Triage |
|---|---|---|---|
| 03 | `-143926` 3/3 ($2.65) | **3/3** | |
| 04 | `-144115` 3/3 ($2.91) | **3/3** | |
| 10 | `-144641` 3/3 ($2.73) | **3/3** | |
| 23 | `-144508` 2/3 ($2.69) | **2/3, pass** | Run 2 R-ONE-IDEA, prompt, real but one of three: the side-question answer ran three sentences before the pending action |
| 02 | `-143705` 0/3 ($1.01); `-144732` 0/3 ($1.01) | **not scored by the runner; hand-scored 6/6 offline** | **Check bug, mine.** `opacity_named` wanted the word "opacity"; the skill's sanctioned sentence says "fade". Both runs failed it 3/3 and the judge never ran. My first two fixes never landed: I used `sed -i 'script' file`, which BSD sed on macOS reads as a backup suffix and fails, so the `&&` chain stopped (the second 02 run therefore went against the old check, $1.01 wasted). Fixed with a Python edit so the check accepts "opacity" or "fade" (diff below). Offline: all six turn-2 replies contain "fade", name no rig, have no null task, end on the question, and are the frame sentence, the idea sentence and the question. Rubric items not judged (no paid run) |
| 15 | `-144253` 1/3 ($3.19); `-144952` 1/3 ($3.49) | **1/3, FAIL** | First run: both failures were `demo_offer_once` (2 matches), **check bug**: one offer sentence ("If you'd like to watch one first, I can parent Tile for you") matched two alternatives of the regex, so one offer counted twice. Now one match per sentence. Second run (fixed regex): all checks pass; runs 1 and 2 fail **R-ONE-IDEA, prompt, real**: the do-it-for-me decline in turn 4 runs three sentences. The offer regex held (it was a guess; now confirmed against six transcripts) |

The diff of the 02 check: `-"must": "opacity",` `+"must": "opacity|fade",`.

Cases 39 and 40 (added the same day) are dry-run only.

### Case 37 reconciled with case 40 (2026-10-28)

37 and 40 share the same two turns (a lesson with a focus, region never answered, reopened in a new session). The design
(SKILL.md step 2, picked up again) asks the turn-or-scale question first on its own when it was never answered, so 37's
`goes_to_null_step` (must "null") contradicted it. It is now `next_step_null_or_region`: the reopened turn passes if it
goes to the null step or asks the question first. Case 40 holds the strict form (the question on its own, no null task,
no "say done"). `does_not_say_null_placed`, no recap, no new proposal and no review are unchanged. Not run.

### Fix-round re-runs (2026-10-28, `--repeat 3`, `8a2405b`, $7.42 in all)

On the null `SKILL.md` with the two-sentence cap at line 326, the fixed case 02 check and the fixed case 15 offer
regex. All three pass; these are the counted results for 15, 02 and 23.

| Case | Result | File | Cost |
|---|---|---|---|
| 15 | 3/3 | `-145617` | $3.41 |
| 02 | 3/3 | `-145732` | $1.33 |
| 23 | 3/3 | `-150110` | $2.68 |

No failures to triage. Earlier runs for these cases (15: 1/3 twice; 02: 0/3 twice on the old check; 23: 2/3) stay in the
section above; the 15 failures were a check bug and then the prompt's three-sentence decline, fixed by the cap; 23's one
failure was the same three-sentence pattern. Three-run passes are a small sample, so the cap holding is likely, not proven.
Case 02 now has a runner-scored result for the first time.
