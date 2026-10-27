# Speed graph evals

The eval set for `/speed-graph-mentor` (skill 2, `easing.speed_graph`, spec 008). It scores whether the mentor *teaches*
well, not only whether it is correct: it never states a target number, never claims to see the Graph Editor, gives hints instead of fixes, runs a review with no demo or walkthrough, and stays honest about expressions and shared keys. It runs the real skill and server in headless
Claude Code against saved snapshots, so **After Effects doesn't need to be open**. Whether the
measures are *correct* is covered by the unit tests (`cd mentor && npm test`); evals don't repeat them.

Built from the skill 6 set (`product/evals/null-parenting/`), itself copied from easing's runner. Same
options and results format; everything skill-specific is in the `CONFIG` block at the top of `run.mjs`.

## Status (2026-10-26): re-pointed to the live captures; no baseline yet

19 cases. Every fixture is a live capture from the 2026-10-26 sitting (spec 008 T029 to T031), except `synthetic/linear-basic.json`
(cases 13 and 17, permanent). `--dry-run --strict-sources` is clean. **Still no baseline**: the full run waits for one more `SKILL.md` change, then the
planned smoke list below. Case 19 (a reading answer given as a frame, FR-039) is new.

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

A full run is about 47 mentor turns plus 19 judge calls. From the smoke runs (about $0.38 a case with its judge call)
expect **about $7 to $8**. Bar: SC-006,
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
| `no_self_instructions`, `no_target_number`, `no_graph_vision`, `no_unconfirmed_velocity_path` | skill-specific (see `CONFIG.universal` in `run.mjs`) |
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
turns. Fixture source: `live` (a capture from the 2026-10-26 sitting; the hand-built stand-ins are gone),
`synthetic` (permanent).

| # | Case | Turns | Hard-rule checks (beyond the universal ones) | Rubric | Fixture source |
|---|---|---|---|---|---|
| 01 | First lesson on Mentor Practice: Title, its pairs, leave-outs, a frame, then the read-the-graph step | 3 | first_tool; tools_called; demo_calls_max; snapshot_input_matches; say: must focus, must hidden_layer, must precomp, must expression, never no_expression_claim, never precomp_not_fine, must asks_hard_landing, must read_graph | R-SG-PROPOSAL, R-SG-LEAVE-OUTS, R-SG-READ-GRAPH, R-USES-MEMORY, R-NAMES-REAL | live |
| 02 | One demonstration on the demo pair only, in plain words, Edit > Undo, no numbers | 3 | demo_calls_min; demo_calls_max; demo_only_on; tools_called; say: must undo, must short_long | R-SG-DEMO, R-DEMO-PLAIN, R-NAMES-REAL | live |
| 03 | One pair in focus (Bar's Trim Paths End): no demonstration, a walkthrough in words | 3 | demo_calls_max; say: must walks_through | R-SG-WALKTHROUGH, R-NAMES-REAL | live |
| 04 | Scale and other pairs still on the default shape: named, no fix, no offer | 2 | tools_called; last_check; say: must names_scale, never no_offer | R-HINT-NOT-FIX, R-NAMES-REAL, R-ONE-IDEA | live |
| 05 | 'Do the rest': declined warmly, no offer later | 4 | demo_calls_max; say: never no_later_offer | R-DECLINES-WARMLY, R-ONE-IDEA | live |
| 06 | Logo's Rotation (an expression over keys) is refused kindly as a target and never graded | 2 | tools_not_called; say: must says_expression, never no_expression_claim | R-SG-EXPRESSION-REFUSED, R-NAMES-REAL | live |
| 07 | Pair 1 shaped, pair 2 not: the shared key is shaped on pair 1's side only; pair 2 isn't praised | 2 | last_check; say: must names_time, never no_offer | R-SG-SHARED-KEY, R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 08 | Review due: a new move (Card), no demo, no walkthrough, no reading step; a demo request is declined | 3 | review_mode; snapshot_with; tools_called; demo_calls_max; say: must names_card, must declines_demo | R-REVIEW-HANDS-ON, R-NAMES-REAL | live |
| 09 | A value-graph answer: asks which graph; Edit Speed Graph; no shortcut, no unconfirmed Keyframe Velocity path | 3 | say: must asks_which_graph, must names_menu | R-SG-CANT-SEE, R-SG-VERSION, R-ONE-IDEA | live |
| 10 | Speed dragged up, influence not: not passed; it arrives moving and the hint says drag sideways | 2 | last_check; say: must arrives_moving, must sideways, never no_offer | R-SG-HINT-MISTAKE, R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 11 | Scale shaped on one part only: says which part is off | 2 | last_check; say: must names_part, never no_offer | R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 12 | Easing not learned: named and offered; on insistence one sentence | 2 | demo_calls_max; say: must names_easing, must offers, must builds_on | R-PREREQ-EASING, R-ONE-IDEA | live |
| 13 | No eased pair in the comp: says so and offers easing | 1 | demo_calls_max; tools_not_called; say: must offers_easing | R-PREREQ-EASING, R-NAMES-REAL | synthetic |
| 14 | Title's last move should slam: dropped without argument | 2 | snapshot_input_matches; say: never no_argument | R-SG-LANDS-HARD, R-ONE-IDEA | live |
| 15 | A wrong reading answer: one hint, the lesson goes on | 3 | tools_called; demo_calls_max; say: must one_hint | R-SG-READ-GRAPH-WRONG, R-ONE-IDEA | live |
| 16 | The learner stops after a check that didn't pass: recorded partial, demo stated, no numbers or method | 4 | record_lesson | R-RECORD-HONEST, R-NAMES-REAL | live |
| 17 | A review with nothing new: said in a sentence, nothing recorded | 2 | review_mode; snapshot_with; demo_calls_max; record_lesson; tools_not_called | R-REVIEW-NOTHING-NEW | synthetic |
| 18 | After Effects can't be reached: nothing claimed about the comp | 1 | tools_not_called; say: must says_cant_see, never no_claims | R-UNREACHABLE | none |
| 19 | A reading answer given as a frame ("around frame 30" on a 0.5 to 1.5 s pair): placed in the pair from its key times, agreed with, not taken for a value-graph answer | 3 | tools_called; demo_calls_max; say: never not_a_value_graph_answer, never not_called_wrong, must places_it | R-SG-READ-TIME, R-ONE-IDEA | live |

- **01** has three turns because the preview frame is only taken in the explain step, after the learner answers the reading question.
- **08** and **17** have a "yes, do the review" turn: a due review is offered, then waits for the learner to agree.
- No case reaches a full pass of the lesson: no live capture has every Title pair shaped, or a shaped Card for the review. That is why case 19 asks at the first reading step (stage 2), not after a pass (stage 6, where `discovery/usage-notes/speed-graph.md` met it). Request to the builder: a capture with all four Title pairs shaped (or Card's) lets a stage 6 variant run.
- **19** is FR-039's proof on the model side (a unit test covers `comp.frame_rate`). It uses a right answer given in frames: 30 frames is 1 s at 30 fps, the middle of Title's first Position move (0.5 to 1.5 s), where the move is fastest. A wrong frame ("frame 19") would be a separate hint case; not added, one reason per case.
- **06** uses the Logo expression; **07** the shared key (spec 008 overlap rows).
- The runner's `last_check.has` compares against the check's reply with the space after each colon removed (found in the key-types smoke run; case 11's `"dimension":"height"` check depends on it, and it has not been run since).

## The fixture tell

Synthetic fixtures carry the project name `Synthetic.aep`, comp names that start with "Synthetic" and a
`synthetic` note. The runner never hands the mentor the builder's file. For each run it writes a
scrubbed copy named `comp-N.json` into a neutral temp folder: the note is removed, the project becomes
`Studio Reel.aep`, "Synthetic" in a comp name becomes "Studio", and a fixture that still says
"synthetic" or "stand-in" anywhere is refused. `--dry-run` runs the same scrub.

## Fixtures

Fixtures are **not copied** into this folder. A case names a fixture by file name and the runner resolves it in
`CONFIG.fixtureDirs` order (`mentor/test/fixtures/speed-graph`, `mentor/test/fixtures`, `mentor/test/fixtures/layer-info`, `mentor/test/fixtures/speed-graph/stand-in`). The stand-in folder is gone; `layer-info` was added to the list on 2026-10-26 so a case can use
`practice2b.json`, Mentor Practice 2 as built. `fixture_sources` labels are all `live` or `synthetic`, and `--strict-sources` fails if one drifts.
The builder's table of where each capture came from is `mentor/test/fixtures/speed-graph/README.md`.

### Re-pointed 2026-10-26: what each case assumes, checked against the live captures

Checked by running the real tools on each capture (`speed_graph_snapshot`, then `speed_graph_check`), not by running the mentor.

- **Held as written:** 01 to 07, 09, 12 to 15, 17, 18. Title's four pairs (Position 0.5 to 1.5 s, 1.5 to 3 s, 3 to 4.367 s; Scale 0.5 to 1.5 s)
  and the leave-outs (Old Take, CTRL, Icon, Logo; Subtitle, Bar and Glow as ease first) are what cases 01 to 03 and 06 name. Bar's Trim Paths End is
  one pair (0.2 to 1.2 s), so no demo (03). Logo has no targets (06). `planted-15-80` passes Position's first pair only (04); in
  `planted-shared-key` pair 2 shares the 1.5 s key and is not shaped (07). The label "Position 1.5-3 s" carries the 1.5 that 07 looks for.
- **08 moved to `practice2b.json`** (Mentor Practice 2 as it is now, 24 layers, id 179) from `practice2-before.json` (13 layers). The review still lands on
  Card's Position. A precomp (Seal) and 11 already-shaped layers join the leave-outs; the case says nothing about them.
- **10 changed meaning in degree.** In the live `planted-dragged-up-small` the hand drag also moved the influence a little (about 32, not 33.3) and moved
  Position's 3 s and 4.367 s landings too, so all four Title pairs read "arrives moving", not two. The expectations (arrives moving, drag sideways, no
  offer) hold. The learner says only "the first Position move and Scale", so a mentor that names the other pairs is right. Title reworded; not bent.
- **11 changed meaning.** `planted-one-scale-dim` was captured with Title Position still dragged up from the earlier hand captures, so the check reply has
  two failures: Position's first pair (arrives moving) and Scale (height not shaped). The subject (Scale's height) holds and the `has` check passes, but the mentor
  may talk about Position too, which the case does not expect. Not bent. Request to the builder: re-capture with Position reset.
- **16, watch.** The demo overlay (applied to every snapshot of comp 97) shapes Position's first pair on the dragged-up capture, so it grades as the demo's.
  The case only needs "not passed, then stopped", which holds.
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


## Planned smoke list (for after the next `SKILL.md` change; nothing here has been run)

Written 2026-10-26 when the three wave A sets were re-pointed to the live captures. **No paid run has
happened since.** One run each unless it says `--repeat 3`. Cost is an estimate from the earlier smoke runs' per-case cost for a case
of that length (about $0.40 for 2 to 3 turns, $0.60 or more for 4). The cockpit's hand-back adds the three sets together.

| Run | Why | Est. cost |
|---|---|---|
| `--only 08 --repeat 3` | SC-014: `no_self_instructions` 3 of 3. Also the first run on `practice2b.json` (case 08 moved) | $1.35 |
| `--only 19` | New case (FR-039) | $0.45 |
| `--only 10` | Premise changed: the live drag arrives moving on all four pairs | $0.35 |
| `--only 11` | Premise changed: a second failure (Position) is in the check reply | $0.35 |
| **Total, speed graph** | 6 runs | **about $2.50** |

### SC-014 and the `no_self_instructions` check

SC-014 (spec 004, FR-042): the review-due case of each set passes this universal check **3 of 3** with `--repeat 3`. `--repeat` passes a case on a
majority, so read each run's `no_self_instructions` line in the results file; the criterion is all three runs, not the majority.

The check was widened on 2026-10-26 because Phase 9 reworded step 0 ("never narrate the branch or what you'll do next"). The old pattern
caught only the original leak ("Review is due -> run the review", "Run review", "review mode", a line starting "Learned, review due"). It missed
paraphrases of the same thing. It now also catches a review-due line that goes on to say what it will run, "straight to the review", the word
"branch" next to review or lesson, and "easing isn't learned, so I'll ..." Checked by hand against 13 leak lines (all caught; the old pattern caught 4)
and 7 lines a mentor may say (none caught, including "a review is due if you want one", which the offer step may use). It applies to every mentor
word in every turn, so a note between tool calls is covered too, not just before the first call. What it can't see: a leak in words I didn't
think of. The judge's R-ONE-IDEA and a read of the three transcripts cover that.

## Reading results

Same order as easing: a failed `run` check is plumbing; a failed deterministic check is a hard-rule
break; a failed rubric item is teaching quality. Re-run a flipping case with `--repeat 3` before
changing `SKILL.md`. Rubric items are in `rubric.md`.
