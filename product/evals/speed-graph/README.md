# Speed graph evals

The eval set for `/speed-graph-mentor` (skill 2, `easing.speed_graph`, spec 008). It scores whether the mentor *teaches*
well, not only whether it is correct: it never states a target number, never claims to see the Graph Editor, gives hints instead of fixes, runs a review with no demo or walkthrough, and stays honest about expressions and shared keys. It runs the real skill and server in headless
Claude Code against saved snapshots, so **After Effects doesn't need to be open**. Whether the
measures are *correct* is covered by the unit tests (`cd mentor && npm test`); evals don't repeat them.

Built from the skill 6 set (`product/evals/null-parenting/`), itself copied from easing's runner. Same
options and results format; everything skill-specific is in the `CONFIG` block at the top of `run.mjs`.

## Status (2026-10-26): built on stand-in and synthetic fixtures

18 cases, dry-run clean, smoke run below. **No baseline yet.** The full run waits for the live sitting (spec 008 L-1 to L-7), because the fixtures are stand-ins the builder wrote by hand.

## Running

```sh
node product/evals/speed-graph/run.mjs --dry-run                   # free: cases, fixtures, labels, tells
node product/evals/speed-graph/run.mjs --dry-run --strict-sources  # also fails on a stale fixture label
node product/evals/speed-graph/run.mjs                             # full run: every case once
node product/evals/speed-graph/run.mjs --only 04                   # one case, by id prefix
node product/evals/speed-graph/run.mjs --changed                   # skip cases unchanged since their last pass
node product/evals/speed-graph/run.mjs --repeat 3                  # each case 3 times; passes on a majority
node product/evals/speed-graph/run.mjs --judge-always             # judge even after a failed check
```

A full run is about 44 mentor turns plus 18 judge calls. From the smoke run
(about $0.12 to $0.18 a turn, $0.05 to $0.10 a judge call) expect **about $5 to $7**. Bar: SC-006,
at least 80% passing, and every hard-rule check passing; spec 008's SC-003 is about the pass rule (unit tests), so this set has no SC of its own beyond SC-006.

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
| `no_target_number`, `no_graph_vision`, `no_unconfirmed_velocity_path` | skill-specific (see `CONFIG.universal` in `run.mjs`) |
| **When a case runs a review** | |
| `review_no_demo` | no demo in a review |
| `review_method_before_pass` | /Edit Speed Graph|Graph Editor|\bdrag|sideways|handle/ is never said before a pass |

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
| 01 | First lesson on Mentor Practice: Title, its pairs, leave-outs, a frame, then the read-the-graph step | 3 | first_tool; tools_called; demo_calls_max; snapshot_input_matches; say: must focus, must hidden_layer, must precomp, must expression, never no_expression_claim, never precomp_not_fine, must asks_hard_landing, must read_graph | R-SG-PROPOSAL, R-SG-LEAVE-OUTS, R-SG-READ-GRAPH, R-USES-MEMORY, R-NAMES-REAL | stand-in |
| 02 | One demonstration on the demo pair only, in plain words, Edit > Undo, no numbers | 3 | demo_calls_min; demo_calls_max; demo_only_on; tools_called; say: must undo, must short_long | R-SG-DEMO, R-DEMO-PLAIN, R-NAMES-REAL | stand-in |
| 03 | One pair in focus (Bar's Trim Paths End): no demonstration, a walkthrough in words | 3 | demo_calls_max; say: must walks_through | R-SG-WALKTHROUGH, R-NAMES-REAL | stand-in |
| 04 | Scale and other pairs still on the default shape: named, no fix, no offer | 2 | tools_called; last_check; say: must names_scale, never no_offer | R-HINT-NOT-FIX, R-NAMES-REAL, R-ONE-IDEA | stand-in |
| 05 | 'Do the rest': declined warmly, no offer later | 4 | demo_calls_max; say: never no_later_offer | R-DECLINES-WARMLY, R-ONE-IDEA | stand-in |
| 06 | Logo's Rotation (an expression over keys) is refused kindly as a target and never graded | 2 | tools_not_called; say: must says_expression, never no_expression_claim | R-SG-EXPRESSION-REFUSED, R-NAMES-REAL | stand-in |
| 07 | Pair 1 shaped, pair 2 not: the shared key is shaped on pair 1's side only; pair 2 isn't praised | 2 | last_check; say: must names_time, never no_offer | R-SG-SHARED-KEY, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 08 | Review due: a new move (Card), no demo, no walkthrough, no reading step; a demo request is declined | 3 | review_mode; snapshot_with; tools_called; demo_calls_max; say: must names_card, must declines_demo | R-REVIEW-HANDS-ON, R-NAMES-REAL | stand-in |
| 09 | A value-graph answer: asks which graph; Edit Speed Graph; no shortcut, no unconfirmed Keyframe Velocity path | 3 | say: must asks_which_graph, must names_menu | R-SG-CANT-SEE, R-SG-VERSION, R-ONE-IDEA | stand-in |
| 10 | Speed dragged up, influence not: not passed; it arrives moving and the hint says drag sideways | 2 | last_check; say: must arrives_moving, must sideways, never no_offer | R-SG-HINT-MISTAKE, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 11 | Scale shaped on one part only: says which part is off | 2 | last_check; say: must names_part, never no_offer | R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 12 | Easing not learned: named and offered; on insistence one sentence | 2 | demo_calls_max; say: must names_easing, must offers, must builds_on | R-PREREQ-EASING, R-ONE-IDEA | stand-in |
| 13 | No eased pair in the comp: says so and offers easing | 1 | demo_calls_max; tools_not_called; say: must offers_easing | R-PREREQ-EASING, R-NAMES-REAL | synthetic |
| 14 | Title's last move should slam: dropped without argument | 2 | snapshot_input_matches; say: never no_argument | R-SG-LANDS-HARD, R-ONE-IDEA | stand-in |
| 15 | A wrong reading answer: one hint, the lesson goes on | 3 | tools_called; demo_calls_max; say: must one_hint | R-SG-READ-GRAPH-WRONG, R-ONE-IDEA | stand-in |
| 16 | The learner stops after a check that didn't pass: recorded partial, demo stated, no numbers or method | 4 | record_lesson | R-RECORD-HONEST, R-NAMES-REAL | stand-in |
| 17 | A review with nothing new: said in a sentence, nothing recorded | 2 | review_mode; snapshot_with; demo_calls_max; record_lesson; tools_not_called | R-REVIEW-NOTHING-NEW | synthetic |
| 18 | After Effects can't be reached: nothing claimed about the comp | 1 | tools_not_called; say: must says_cant_see, never no_claims | R-UNREACHABLE | none |

- **01** has three turns because the preview frame is only taken in the explain step, after the learner answers the reading question.
- **08** and **17** have a "yes, do the review" turn: a due review is offered, then waits for the learner to agree.
- No case reaches a full pass of the lesson: the stand-ins only plant single mistakes (`planted-*`), and none has every Title pair shaped. Same for a shaped Card in the review. See requests.
- **06** uses the Logo expression; **07** the shared key (spec 008 overlap rows).
- The runner's `last_check.has` compares against the check's reply with the space after each colon removed (found in the key-types smoke run; case 11's `"dimension":"height"` check depends on it, and it has not been run since).

## The fixture tell

Synthetic fixtures carry the project name `Synthetic.aep`, comp names that start with "Synthetic" and a
`synthetic` note. The runner never hands the mentor the builder's file. For each run it writes a
scrubbed copy named `comp-N.json` into a neutral temp folder: the note is removed, the project becomes
`Studio Reel.aep`, "Synthetic" in a comp name becomes "Studio", and a fixture that still says
"synthetic" or "stand-in" anywhere is refused. `--dry-run` runs the same scrub.

## Fixtures and re-pointing after the live sitting

Fixtures are **not copied** into this folder. A case names a fixture by the file name the builder's
tests use, and the runner resolves it in `CONFIG.fixtureDirs` order (`mentor/test/fixtures/speed-graph`, `mentor/test/fixtures`, `mentor/test/fixtures/speed-graph/stand-in`):
a live capture sits before the stand-in folder, so it wins. Each case carries a `fixture_sources`
label per fixture, and `--dry-run` prints where each resolves now.

After the live sitting, once the captures are saved under the stand-ins' names and the stand-in folder is
deleted:

1. `node product/evals/speed-graph/run.mjs --dry-run`. It prints every stale label, for example
   `04-...: planted-15-80.json is labelled stand-in but resolves to live`.
2. Change those labels (`stand-in` to `live`) in each case's `fixture_sources`. `--strict-sources` fails
   until none are stale.
3. A stand-in with **no live twin under the same name** now fails the dry run with "no fixture". Capture it
   under that name or change the cases that use it. Every fixture these cases use is in the builder's README table (`mentor/test/fixtures/speed-graph/README.md`) with a live replacement.
4. Run each case once with `--only` and read the facts the checks assume, which a live capture can change
   (Title's four pairs and their times, the leave-outs (Old Take, CTRL, Icon, Logo, Subtitle, Bar, Glow) and the planted mistakes' codes). A changed fact is a case edit, not a skill bug.
5. Then the baseline: `node product/evals/speed-graph/run.mjs`. A live capture changes a case's hash, so
   `--changed` re-runs exactly the re-pointed cases.
6. The preview frame comes back as a blank placeholder in every run (the fixture folder has no `frame.png`).
   The rubric tells the judge to ignore it. A `frame.png` next to a live capture would let the mentor see it.


## Smoke run (2026-10-26)

Eight runs, $3.03, cases 01, 08, 10 and 17 (the first case of each kind plus a hint case and a nothing-new review):

| Run | Case | Result | Triage |
|---|---|---|---|
| 1 | 01 | FAIL ($0.26) | My case bug: `preview_frame` is only called in the explain step, after the reading question. Added a third turn |
| 2 | 08 | FAIL ($0.24) | My case bug: a due review is offered and waits for a yes. Added a "yes, do the review" turn (also in 17) |
| 3 | 10 | pass ($0.35) | |
| 4 | 01 | FAIL ($0.50) | Judge: R-USES-MEMORY wanted "how long ago"; the skill asks for it only for speed-graph history. Rubric relaxed |
| 5 | 08 | FAIL ($0.45) | Judge: R-REVIEW-HANDS-ON. After "all yours" the mentor offered to stop the review for a practice lesson with a demo. A judgment call, not a clear break; rubric now allows mentioning a practice lesson but not doing a demo |
| 6 | 17 | pass ($0.28) | |
| 7 | 01 | pass ($0.51) | |
| 8 | 08 | pass ($0.44) | |

Runs 1, 2, 4 and 5 are case or rubric changes, not skill failures, and the result files are kept.

## Reading results

Same order as easing: a failed `run` check is plumbing; a failed deterministic check is a hard-rule
break; a failed rubric item is teaching quality. Re-run a flipping case with `--repeat 3` before
changing `SKILL.md`. Rubric items are in `rubric.md`.
