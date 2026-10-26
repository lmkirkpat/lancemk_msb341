# Key types evals

The eval set for `/key-types-mentor` (skill 1, `keyframes.types`, spec 009). It scores whether the mentor *teaches*
well, not only whether it is correct: it asks what should snap before proposing, treats a fade as a choice and never a mistake, never says "freeze" or "hidden" wrongly, runs a review with no demo or menu path, and stays honest about expressions. It runs the real skill and server in headless
Claude Code against saved snapshots, so **After Effects doesn't need to be open**. Whether the
measures are *correct* is covered by the unit tests (`cd mentor && npm test`); evals don't repeat them.

Built from the skill 6 set (`product/evals/null-parenting/`), itself copied from easing's runner. Same
options and results format; everything skill-specific is in the `CONFIG` block at the top of `run.mjs`.

## Status (2026-10-26): built on stand-in and synthetic fixtures

19 cases, dry-run clean, smoke run below. **No baseline yet.** The full run waits for the live sitting (spec 009 L-1 and L-2), because the fixtures are stand-ins the builder wrote by hand.

## Running

```sh
node product/evals/key-types/run.mjs --dry-run                   # free: cases, fixtures, labels, tells
node product/evals/key-types/run.mjs --dry-run --strict-sources  # also fails on a stale fixture label
node product/evals/key-types/run.mjs                             # full run: every case once
node product/evals/key-types/run.mjs --only 04                   # one case, by id prefix
node product/evals/key-types/run.mjs --changed                   # skip cases unchanged since their last pass
node product/evals/key-types/run.mjs --repeat 3                  # each case 3 times; passes on a majority
node product/evals/key-types/run.mjs --judge-always             # judge even after a failed check
```

A full run is about 53 mentor turns plus 19 judge calls. From the smoke run
(about $0.12 to $0.18 a turn, $0.05 to $0.10 a judge call) expect **about $5 to $7**. Bar: SC-006,
at least 80% passing, and every hard-rule check passing; spec 009's SC-003 is about the deterministic parts (unit tests), so this set has no SC of its own beyond SC-006.

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
| `no_freeze_for_hold` | skill-specific (see `CONFIG.universal` in `run.mjs`) |
| **When a case runs a review** | |
| `review_no_demo` | no demo in a review |
| `review_method_before_pass` | /Toggle Hold|Animation\s*>|right-click|\bmenu\b|Keyframe Interpolation|constant speed/ is never said before a pass |

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
| 01 | First lesson: asks what should snap before proposing; candidates as questions, at most three; real names | 1 | first_tool; tools_called; demo_calls_max; tools_not_called; say: must asks_what_snaps, must asks_question, must names_candidates, never not_mistakes, never no_see_through_hidden | R-KT-INTENT-FIRST, R-KT-CANDIDATES-AS-QUESTIONS, R-USES-MEMORY, R-NAMES-REAL | stand-in |
| 02 | Everything is meant to fade: dropped with no argument; no invented focus; the practice blink or Mentor Practice 2 offered | 2 | tools_called; snapshot_input_matches; snapshot_input_lacks; demo_calls_max; tools_not_called; say: must offers_practice, never no_argument | R-KT-DROP-NO-ARGUMENT, R-KT-PRACTICE-OFFER | stand-in |
| 03 | One hold on the demo target, in plain words, frames either side, Edit > Undo | 3 | demo_calls_min; demo_calls_max; demo_only_on; tools_called; say: must undo, must says_hold | R-KT-DEMO, R-DEMO-PLAIN, R-NAMES-REAL | stand-in |
| 04 | One focus pair (Cut): no demonstration, a walkthrough in words | 3 | demo_calls_max; say: must walks_through | R-KT-WALKTHROUGH, R-NAMES-REAL | stand-in |
| 05 | One Blink pair still fading: named with a frame inside it, no fix, no offer | 3 | tools_called; last_check; say: must names_blink, must names_time, never no_offer | R-HINT-NOT-FIX, R-NAMES-REAL, R-ONE-IDEA | stand-in |
| 06 | 'Do the rest': declined warmly, no offer later | 4 | demo_calls_max; say: never no_later_offer | R-DECLINES-WARMLY, R-ONE-IDEA | stand-in |
| 07 | Selects and holds everything: names where the should-fade layer now waits and jumps; asks about the extra holds; no fix | 3 | last_check; say: must names_cut, must names_extra, must asks, never no_offer | R-KT-SHOULD-MOVE-HELD, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 08 | Logo's Rotation named as constant speed: an expression drives it; no mark, no 'set its keys to linear' | 3 | last_check; say: must says_expression, never no_linear_advice | R-KT-EXPRESSION, R-NAMES-REAL | stand-in |
| 09 | A blink with an expression on isn't a candidate; the expression is a left-out reason | 1 | tools_called; say: must names_expression_layer, must says_expression, never not_a_question_candidate | R-KT-LEFT-OUT, R-NAMES-REAL | stand-in |
| 10 | A layer held at Opacity 0 is vanishing, never 'hidden' | 3 | say: never not_hidden | R-KT-NOT-HIDDEN, R-NAMES-REAL | stand-in |
| 11 | Every pair held, then a constant-speed move named: confirmed linear, remembered | 4 | last_check; record_lesson; say: must asks_constant_speed, must confirms_linear | R-KT-LINEAR-CHECK, R-RECORD-HONEST, R-NAMES-REAL | stand-in |
| 12 | A move meant to be constant speed is eased: one sentence on which end isn't linear; checked again | 4 | last_check; say: must names_spinner, must says_linear, never no_offer | R-KT-LINEAR-CHECK, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 13 | No Mac shortcut, no 'freeze', the menu path named | 2 | say: must menu_path, never no_freeze_frame | R-KT-VERSION, R-ONE-IDEA | stand-in |
| 14 | Review due: intent asked first, Cut as the target, no demo, walkthrough or menu path | 3 | review_mode; snapshot_with; demo_calls_max; tools_called; say: must asks_intent, must names_cut, must make_it_snap | R-REVIEW-HANDS-ON, R-KT-INTENT-FIRST, R-NAMES-REAL | stand-in |
| 15 | A review that doesn't pass: hints, no reteach; recorded partial with the demo stated false | 5 | review_mode; last_check; record_lesson; say: never no_offer | R-REVIEW-HINT, R-RECORD-HONEST, R-NAMES-REAL | stand-in |
| 16 | Review, the learner says nothing should snap: the review ends and nothing is recorded | 3 | review_mode; demo_calls_max; record_lesson; tools_not_called | R-KT-REVIEW-ENDS, R-REVIEW-HANDS-ON | stand-in |
| 17 | No candidate and nothing named: no invented focus; the practice blink is offered | 2 | tools_called; snapshot_input_lacks; demo_calls_max; tools_not_called; say: must says_nothing, must offers_practice | R-KT-PRACTICE-OFFER, R-NAMES-REAL | synthetic |
| 18 | A hold on the wrong side: never called done; points at the key at the start of the pair | 3 | last_check; say: never not_done, must points_at_key, never no_offer | R-KT-WRONG-SIDE, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 19 | After Effects can't be reached: nothing claimed about the comp | 1 | tools_not_called; say: must says_cant_see, never no_claims | R-UNREACHABLE | none |

- **11** and **12** go one step past the pass: the learner is asked the constant-speed question and names the Spinner. 11 expects the record `keyframes.types`, passed, no demo.
- **14**, **15** and **16** each have a "yes, do the review" turn: a due review is offered and waits for a yes.
- **02** and **17** are the two sides of "nothing to snap": everything is meant to fade (Mentor Practice), and no candidate at all (a comp with only linear moves).
- **09** uses the `Loop Blink` layer in the loop-blink stand-in; the unit tests prove it is never a candidate, this case checks what the mentor says about it.
- **18** is the wrong-side hold, which the spec said to add once L-1 settles its wording; the case already checks the behavior, not the wording.
- The runner's `last_check.has` compares against the check's reply with the space after each colon removed (fixed during the smoke run).

## The fixture tell

Synthetic fixtures carry the project name `Synthetic.aep`, comp names that start with "Synthetic" and a
`synthetic` note. The runner never hands the mentor the builder's file. For each run it writes a
scrubbed copy named `comp-N.json` into a neutral temp folder: the note is removed, the project becomes
`Studio Reel.aep`, "Synthetic" in a comp name becomes "Studio", and a fixture that still says
"synthetic" or "stand-in" anywhere is refused. `--dry-run` runs the same scrub.

## Fixtures and re-pointing after the live sitting

Fixtures are **not copied** into this folder. A case names a fixture by the file name the builder's
tests use, and the runner resolves it in `CONFIG.fixtureDirs` order (`mentor/test/fixtures/key-types`, `mentor/test/fixtures`, `mentor/test/fixtures/key-types/stand-in`):
a live capture sits before the stand-in folder, so it wins. Each case carries a `fixture_sources`
label per fixture, and `--dry-run` prints where each resolves now.

After the live sitting, once the captures are saved under the stand-ins' names and the stand-in folder is
deleted:

1. `node product/evals/key-types/run.mjs --dry-run`. It prints every stale label, for example
   `04-...: planted-15-80.json is labelled stand-in but resolves to live`.
2. Change those labels (`stand-in` to `live`) in each case's `fixture_sources`. `--strict-sources` fails
   until none are stale.
3. A stand-in with **no live twin under the same name** now fails the dry run with "no fixture". Capture it
   under that name or change the cases that use it. `practice2-before.json` is spec 004 T042's live capture: tests prefer `mentor/test/fixtures/practice2-before.json` once it exists, and so does this runner (`mentor/test/fixtures` is searched before the stand-in folder). `practice-now.json` is Mentor Practice itself.
4. Run each case once with `--only` and read the facts the checks assume, which a live capture can change
   (Blink's three pairs at 1, 1.4, 1.8 and 2.2 s, Cut at 3 s, the candidate list (Blink, Cut), the left-out layers (Old Take, Icon, Logo, Cursor, Loop Blink) and the planted verdicts). A changed fact is a case edit, not a skill bug.
5. Then the baseline: `node product/evals/key-types/run.mjs`. A live capture changes a case's hash, so
   `--changed` re-runs exactly the re-pointed cases.
6. The preview frame comes back as a blank placeholder in every run (the fixture folder has no `frame.png`).
   The rubric tells the judge to ignore it. A `frame.png` next to a live capture would let the mentor see it.


## Smoke run (2026-10-26)

Six runs, total $2.88 (cases 01, 02, 07, 11, 16):

| Run | Case | Result | Triage |
|---|---|---|---|
| 1 | 01 | pass ($0.18) | |
| 2 | 07 | pass ($0.56) | |
| 3 | 16 | pass ($0.42) | |
| 4 | 11 | FAIL ($0.66) | Runner bug: `last_check.has` compared against pretty-printed JSON (`"verdict": "linear"`). The mentor's behavior was right in the transcript. Fixed in the runner (also in the speed-graph set, which had the same latent bug in case 11) |
| 5 | 02 | pass ($0.31) | |
| 6 | 11 | pass ($0.75) | |

## Reading results

Same order as easing: a failed `run` check is plumbing; a failed deterministic check is a hard-rule
break; a failed rubric item is teaching quality. Re-run a flipping case with `--repeat 3` before
changing `SKILL.md`. Rubric items are in `rubric.md`.
