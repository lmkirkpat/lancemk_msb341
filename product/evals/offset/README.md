# Offset evals

The eval set for `/offset-mentor` (skill 3, `timing.offset`, spec 010). It scores whether the mentor *teaches*
well, not only whether it is correct: it never names a gap to use, calls a gap under the floor together without giving a number, runs a review with no demo or method, asks instead of failing an order or a split, and never talks about parents. It runs the real skill and server in headless
Claude Code against saved snapshots, so **After Effects doesn't need to be open**. Whether the
measures are *correct* is covered by the unit tests (`cd mentor && npm test`); evals don't repeat them.

Built from the skill 6 set (`product/evals/null-parenting/`), itself copied from easing's runner. Same
options and results format; everything skill-specific is in the `CONFIG` block at the top of `run.mjs`.

## Status (2026-10-26): built on stand-in and synthetic fixtures

24 cases, dry-run clean, smoke run below. **No baseline yet.** The full run waits for the live sitting (spec 010 L-1 to L-3 and tasks T033), because the fixtures are stand-ins the builder wrote by hand. Spec 010's SC-003 asks for at least 80% of the eval cases and every hard-rule check passing: that is the baseline's job.

## Running

```sh
node product/evals/offset/run.mjs --dry-run                   # free: cases, fixtures, labels, tells
node product/evals/offset/run.mjs --dry-run --strict-sources  # also fails on a stale fixture label
node product/evals/offset/run.mjs                             # full run: every case once
node product/evals/offset/run.mjs --only 04                   # one case, by id prefix
node product/evals/offset/run.mjs --changed                   # skip cases unchanged since their last pass
node product/evals/offset/run.mjs --repeat 3                  # each case 3 times; passes on a majority
node product/evals/offset/run.mjs --judge-always             # judge even after a failed check
```

A full run is about 68 mentor turns plus 24 judge calls. From the smoke run
(about $0.12 to $0.18 a turn, $0.05 to $0.10 a judge call) expect **about $7 to $9**. Bar: SC-006,
at least 80% passing, and every hard-rule check passing; spec 010 SC-003 (at least 80%, every hard-rule check passing).

## What every case checks (no `expect` key needed)

| Check | Rule it enforces |
|---|---|
| `plain_words` | no underscore or dot name, no id, no quoted value from tool output |
| `no_narration` | no announced calls or rules |
| `no_shortcuts` | no keyboard shortcut (the skill quotes none until its live check logs it) |
| `no_test_tell` | never "synthetic", "fixture", "stand-in" |
| `only_mentor_tools` | no After Effects tool during a lesson |
| `demo_at_most_once` | at most one demo call |
| `record_plain` | the record's summary holds no method, motive or number |
| `no_gap_named`, `no_parents`, `no_self_instructions`, `no_sequence_layers` | skill-specific (see `CONFIG.universal` in `run.mjs`) |
| **When a case runs a review** | |
| `review_no_demo` | no demo in a review |
| `review_method_before_pass` | /\bdrag\b|\bbar\b|\bgap\b|\bframes?\b|select the keys|Quick Offset/ is never said before a pass |

## Case-level `expect` keys

`first_tool`, `tools_called`, `tools_not_called`, `snapshot_with` (a snapshot call with these inputs),
`snapshot_input_matches` (regexes over a snapshot call's input), `snapshot_calls_max`,
`demo_calls_min` / `demo_calls_max` (attempts), `demo_only_on`, `last_check` (`passed`, `has` and `lacks`:
substrings of the check's reply, `input`), `record_lesson` (`null` for "nothing recorded"),
`review_mode`, and `say`: a list of `{ id, must | never, turns, cs }` regex checks on the mentor's
words (1-based `turns`, default all; case-insensitive unless `cs`).

## Cases

Numbers are mine; the spec's Eval plan item each covers is in `covers`. Turns is the number of mentor
turns. Fixture source: `stand-in` (builder's hand-built file, replaced at the live sitting),
`synthetic` (permanent), `live` (a capture).

| # | Case | Turns | Hard-rule checks (beyond the universal ones) | Rubric | Fixture source |
|---|---|---|---|---|---|
| 01 | First lesson, properties kind, on Mentor Practice: Title's three properties, the layers kind offered once, what's left out, order and gap asked | 2 | first_tool; tools_called; demo_calls_max; tools_not_called; say: must names_properties, must offers_layers_once, must left_out_null, must left_out_hidden, must asks_first, must asks_apart, never not_everything | R-OFF-PROPOSAL, R-OFF-LEFT-OUT, R-OFF-INTENT, R-USES-MEMORY, R-NAMES-REAL | stand-in |
| 02 | First lesson, layers kind, on Mentor Practice 2: Dot 2's properties first (the tie), the Dots offered in one sentence, the learner picks them | 2 | tools_called; demo_calls_max; snapshot_input_matches; say: must proposes_dot2, must offers_dots, must asks_order | R-OFF-PROPOSAL, R-OFF-INTENT, R-NAMES-REAL | stand-in |
| 03 | One shift on the second member of the learner's order; frames before and after; Edit > Undo | 3 | demo_calls_min; demo_calls_max; demo_only_on; tools_called; say: must names_dot2, must undo | R-OFF-DEMO, R-DEMO-PLAIN, R-NAMES-REAL | stand-in |
| 04 | A two-member group: no demonstration, a walkthrough in words | 3 | demo_calls_max; say: must walks_through | R-OFF-WALKTHROUGH, R-NAMES-REAL | stand-in |
| 05 | 'What gap should I use?': it's their call, no number | 2 | say: must theirs, never no_number, must play_it_back | R-OFF-NO-GAP, R-ONE-IDEA | stand-in |
| 06 | A 1-frame gap at 30 fps still reads as together: said, no number named, asked again | 2 | snapshot_input_matches; demo_calls_max; say: must still_together, must asks_again, never no_number | R-OFF-FLOOR, R-OFF-NO-GAP | stand-in |
| 07 | A 3-frame gap at 60 fps still reads as together: same, on the 60 fps comp | 2 | snapshot_input_matches; demo_calls_max; say: must still_together, must asks_again, never no_number | R-OFF-FLOOR, R-OFF-NO-GAP | stand-in |
| 08 | Uneven gaps: passes with one rhythm sentence, never a fail | 3 | last_check; say: must rhythm, never never_a_fail | R-OFF-RHYTHM, R-NAMES-REAL | stand-in |
| 09 | Opacity moved and Position didn't: the hint shows a frame, asks if it was on purpose, no fix | 3 | tools_called; last_check; say: must names_layer, must names_props, must asks, never no_offer | R-OFF-POPS-IN, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 10 | An effect's key moved with its layer passes | 3 | last_check; say: never no_fault | R-OFF-PASS, R-NAMES-REAL | stand-in |
| 11 | Properties kind: a landing that moved passes | 3 | last_check; say: must praises | R-OFF-PASS, R-NAMES-REAL | stand-in |
| 12 | A group with a held layer: its start is its jump time, and the jump is graded | 3 | last_check; say: never never_first_key | R-OFF-HOLD, R-NAMES-REAL | stand-in |
| 13 | The order differs from the stated one: asks if it was a change of mind; doesn't fail it | 3 | last_check; say: must asks_change_of_mind, must names_both, never no_fail | R-OFF-ORDER, R-NAMES-REAL | stand-in |
| 14 | Trimmed in point, keys unchanged: the bar-versus-keys hint | 3 | last_check; say: must keys_unchanged, never no_offer | R-OFF-BAR-KEYS, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 15 | An incomplete stagger: names what's still the same and where; no fix, no offer | 3 | last_check; say: must names_pair, never no_offer | R-OFF-STILL-TOGETHER, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 16 | 'Do the rest': declined warmly, no offer later | 4 | demo_calls_max; say: never no_later_offer | R-DECLINES-WARMLY, R-ONE-IDEA | stand-in |
| 17 | Review due: a new group (Chip A to C), asks which goes first, no demo, no walkthrough, no gap | 3 | review_mode; snapshot_with; demo_calls_max; tools_called; say: must names_chips, must asks_which_first, must declines_demo | R-REVIEW-HANDS-ON, R-NAMES-REAL | stand-in |
| 18 | A review with no new group: said in a sentence, nothing recorded | 2 | review_mode; snapshot_with; demo_calls_max; record_lesson; tools_not_called | R-REVIEW-NOTHING-NEW | synthetic |
| 19 | No shortcut for nudging keys and no Quick Offset before it is confirmed; the drag is described | 3 | say: never no_quick_offset, must describes_drag | R-OFF-VERSION, R-ONE-IDEA | stand-in |
| 20 | Easing not learned: one sentence, the lesson runs, linear moves mentioned once at 'done' | 4 | last_check; say: must names_easing, must builds_on, must linear_once | R-PREREQ-EASING, R-OFF-LINEAR-ONCE | stand-in |
| 21 | The learner keeps a gap under the floor and asks for the demo: there is none; walked through in words | 3 | demo_calls_max; say: must walks_through, never no_number | R-OFF-FLOOR, R-OFF-WALKTHROUGH | stand-in |
| 22 | A split said on purpose, in answer to the 'pops in' hint: that layer passes on the next check; the summary says it plainly | 4 | last_check; say: never no_blame | R-OFF-SPLIT, R-NAMES-REAL | stand-in |
| 23 | Stops after a stagger that wasn't enough: recorded partial, gaps in plain words, no method or motive | 4 | record_lesson | R-RECORD-HONEST, R-NAMES-REAL | stand-in |
| 24 | After Effects can't be reached: nothing claimed about the comp | 1 | tools_not_called; say: must says_cant_see, never no_claims | R-UNREACHABLE | none |

- **01** has two turns: the mentor proposes, offers the other kind and says what's left out first, then asks order and gap after the frame.
- **17** and **18** have a "yes, do the review" turn; in practice the mentor starts the review in turn 1 and the yes is redundant.
- **FR-009 (the demo runs only on a layer whose eye is on) has no eval case.** The eye-off matte fixture is a unit-test variant (`offset-visibility.test.mjs`), not a saved file, and the Dots in the stand-ins all have their eyes on. A case needs a saved fixture whose second member is eye-off; see requests.
- **12** has no stricter check than the pass: whether the mentor names the held layer's start as its jump is for the judge.
- The universal `no_self_instructions` check catches a leaked step ("Review is due -> run the review") that the mentor wrote before its first tool call; 17 fails on it (see the smoke table).

## The fixture tell

Synthetic fixtures carry the project name `Synthetic.aep`, comp names that start with "Synthetic" and a
`synthetic` note. The runner never hands the mentor the builder's file. For each run it writes a
scrubbed copy named `comp-N.json` into a neutral temp folder: the note is removed, the project becomes
`Studio Reel.aep`, "Synthetic" in a comp name becomes "Studio", and a fixture that still says
"synthetic" or "stand-in" anywhere is refused. `--dry-run` runs the same scrub.

## Fixtures and re-pointing after the live sitting

Fixtures are **not copied** into this folder. A case names a fixture by the file name the builder's
tests use, and the runner resolves it in `CONFIG.fixtureDirs` order (`mentor/test/fixtures/offset`, `mentor/test/fixtures`, `mentor/test/fixtures/offset/stand-in`):
a live capture sits before the stand-in folder, so it wins. Each case carries a `fixture_sources`
label per fixture, and `--dry-run` prints where each resolves now.

After the live sitting, once the captures are saved under the stand-ins' names and the stand-in folder is
deleted:

1. `node product/evals/offset/run.mjs --dry-run`. It prints every stale label, for example
   `04-...: planted-15-80.json is labelled stand-in but resolves to live`.
2. Change those labels (`stand-in` to `live`) in each case's `fixture_sources`. `--strict-sources` fails
   until none are stale.
3. A stand-in with **no live twin under the same name** now fails the dry run with "no fixture". Capture it
   under that name or change the cases that use it. `practice2-before.json` and `practice2-60fps.json` are spec 004's live captures: the runner prefers `mentor/test/fixtures/<name>` once it exists. `practice-now.json` is Mentor Practice itself. The stand-ins without a live twin in the builder's table: none that these cases use.
4. Run each case once with `--only` and read the facts the checks assume, which a live capture can change
   (the Dots' start (0.5 s) and Chip A to C's (2 s), the floor at 30 and 60 fps, and the planted results (`layers-pass`, `layers-uneven`, `pops-in`, `order-differs`)). A changed fact is a case edit, not a skill bug.
5. Then the baseline: `node product/evals/offset/run.mjs`. A live capture changes a case's hash, so
   `--changed` re-runs exactly the re-pointed cases.
6. The preview frame comes back as a blank placeholder in every run (the fixture folder has no `frame.png`).
   The rubric tells the judge to ignore it. A `frame.png` next to a live capture would let the mentor see it.


## Smoke run (2026-10-26)

Eight runs, total $3.02 (cases 01, 03, 06, 09, 17):

| Run | Case | Result | Triage |
|---|---|---|---|
| 1 | 01 | FAIL ($0.12) | My case bug: order and gap are asked only after the explain step; the first reply asks which group. Added a second turn |
| 2 | 03 | pass ($0.57) | |
| 3 | 06 | pass ($0.36) | |
| 4 | 01 | FAIL ($0.27) | My check bug: the mentor asked "What order should they go in?"; `asks_first` only accepted "first". Widened |
| 5 | 17 | FAIL ($0.39) | My check bug: a due review starts in turn 1, so the Chips are named there, not after "yes". Moved the check. The transcript also showed a **real finding**: the mentor's first words were "Review is due. Run review." |
| 6 | 09 | pass ($0.57) | |
| 7 | 01 | pass ($0.34) | |
| 8 | 17 | FAIL ($0.40) | **Real**, with the new universal `no_self_instructions` check. The mentor wrote "Review is due → run the review." before its first tool call, two runs of two. Judge not run (check failed) |

Runs 1, 4 and 5 are case or check changes, not skill failures. Run 8 (and run 5's text) is a skill finding: see the hand-back.

## Reading results

Same order as easing: a failed `run` check is plumbing; a failed deterministic check is a hard-rule
break; a failed rubric item is teaching quality. Re-run a flipping case with `--repeat 3` before
changing `SKILL.md`. Rubric items are in `rubric.md`.
