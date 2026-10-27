# Key types evals

The eval set for `/key-types-mentor` (skill 1, `keyframes.types`, spec 009). It scores whether the mentor *teaches*
well, not only whether it is correct: it asks what should snap before proposing, treats a fade as a choice and never a mistake, never says "freeze" or "hidden" wrongly, runs a review with no demo or menu path, and stays honest about expressions. It runs the real skill and server in headless
Claude Code against saved snapshots, so **After Effects doesn't need to be open**. Whether the
measures are *correct* is covered by the unit tests (`cd mentor && npm test`); evals don't repeat them.

Built from the skill 6 set (`product/evals/null-parenting/`), itself copied from easing's runner. Same
options and results format; everything skill-specific is in the `CONFIG` block at the top of `run.mjs`.

## Status (2026-10-26): re-pointed to the live captures; no baseline yet

19 cases (case 10 retired; case 20 new). Every fixture is a live capture from the 2026-10-26 sitting (spec 009 T031 to T033) except `synthetic/linear-basic.json` (case 17, permanent).
Mentor Practice 2 is now `practice2b.json` (24 layers), the comp the captures were planted on. `--dry-run --strict-sources` is clean. **Still no baseline**:
the full run waits for one more `SKILL.md` change, then the planned smoke list below.

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

A full run is about 54 mentor turns plus 19 judge calls. From the smoke runs (about $0.48 a case with its judge call)
expect **about $9 to $10**. Bar: SC-006,
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
| `no_self_instructions`, `no_freeze_for_hold` | skill-specific (see `CONFIG.universal` in `run.mjs`) |
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
turns. Fixture source: `live` (a capture from the 2026-10-26 sitting; the hand-built stand-ins are gone),
`synthetic` (permanent).

| # | Case | Turns | Hard-rule checks (beyond the universal ones) | Rubric | Fixture source |
|---|---|---|---|---|---|
| 01 | First lesson: asks what should snap before proposing; candidates as questions, at most three; real names | 1 | first_tool; tools_called; demo_calls_max; tools_not_called; say: must asks_what_snaps, must asks_question, must names_candidates, never not_mistakes, never no_see_through_hidden | R-KT-INTENT-FIRST, R-KT-CANDIDATES-AS-QUESTIONS, R-USES-MEMORY, R-NAMES-REAL | live |
| 02 | Everything is meant to fade: dropped with no argument; no invented focus; the practice blink or Mentor Practice 2 offered | 2 | tools_called; snapshot_input_matches; snapshot_input_lacks; demo_calls_max; tools_not_called; say: must offers_practice, never no_argument | R-KT-DROP-NO-ARGUMENT, R-KT-PRACTICE-OFFER | live |
| 03 | One hold on the demo target, in plain words, frames either side, Edit > Undo | 3 | demo_calls_min; demo_calls_max; demo_only_on; tools_called; say: must undo, must says_hold | R-KT-DEMO, R-DEMO-PLAIN, R-NAMES-REAL | live |
| 04 | One focus pair (Cut): no demonstration, a walkthrough in words | 3 | demo_calls_max; say: must walks_through | R-KT-WALKTHROUGH, R-NAMES-REAL | live |
| 05 | Two Blink pairs still fading (one held): both named, one with a frame inside it, no fix, no offer | 3 | tools_called; last_check; say: must names_blink, must names_time, never no_offer | R-HINT-NOT-FIX, R-NAMES-REAL, R-ONE-IDEA | live |
| 06 | 'Do the rest': declined warmly, no offer later | 4 | demo_calls_max; say: never no_later_offer | R-DECLINES-WARMLY, R-ONE-IDEA | live |
| 07 | Selects and holds everything: names where the should-fade layer now waits and jumps; asks about the extra holds; no fix | 3 | last_check; say: must names_cut, must names_extra, must asks, never no_offer | R-KT-SHOULD-MOVE-HELD, R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 08 | Logo's Rotation named as constant speed: an expression drives it; no mark, no 'set its keys to linear' | 3 | last_check; say: must says_expression, never no_linear_advice | R-KT-EXPRESSION, R-NAMES-REAL | live |
| 09 | A blink with an expression on isn't a candidate; the expression is a left-out reason | 1 | tools_called; say: must names_expression_layer, must says_expression, never not_a_question_candidate | R-KT-LEFT-OUT, R-NAMES-REAL | live |
| 10 | **Retired 2026-10-27** (was: a layer held at Opacity 0 is vanishing, never "hidden"). See below | | | | |
| 11 | Every pair held, then a constant-speed move named: confirmed linear, remembered | 4 | last_check; record_lesson; say: must asks_constant_speed, must confirms_linear | R-KT-LINEAR-CHECK, R-RECORD-HONEST, R-NAMES-REAL | live |
| 12 | A move meant to be constant speed is eased: one sentence on which end isn't linear; checked again | 4 | last_check; say: must names_spinner, must says_linear, never no_offer | R-KT-LINEAR-CHECK, R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 13 | No Mac shortcut, no 'freeze', the menu path named | 2 | say: must menu_path, never no_freeze_frame | R-KT-VERSION, R-ONE-IDEA | live |
| 14 | Review due: intent asked first, Cut as the target, no demo, walkthrough or menu path | 3 | review_mode; snapshot_with; demo_calls_max; tools_called; say: must asks_intent, must names_cut, must make_it_snap | R-REVIEW-HANDS-ON, R-KT-INTENT-FIRST, R-NAMES-REAL | live |
| 15 | A review that doesn't pass: hints, no reteach; recorded partial with the demo stated false | 5 | review_mode; last_check; record_lesson; say: never no_offer | R-REVIEW-HINT, R-RECORD-HONEST, R-NAMES-REAL | live |
| 16 | Review, the learner says nothing should snap: the review ends and nothing is recorded | 3 | review_mode; demo_calls_max; record_lesson; tools_not_called | R-KT-REVIEW-ENDS, R-REVIEW-HANDS-ON | live |
| 17 | No candidate and nothing named: no invented focus; the practice blink is offered | 2 | tools_called; snapshot_input_lacks; demo_calls_max; tools_not_called; say: must says_nothing, must offers_practice | R-KT-PRACTICE-OFFER, R-NAMES-REAL | synthetic |
| 18 | A hold on the wrong side: never called done; points at the key at the start of the pair | 3 | last_check; say: never not_done, must points_at_key, never no_offer | R-KT-WRONG-SIDE, R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 19 | After Effects can't be reached: nothing claimed about the comp | 1 | tools_not_called; say: must says_cant_see, never no_claims | R-UNREACHABLE | none |
| 20 | A lesson resumed on a comp that matches, with Blink's Opacity as what should snap: said back as the learner's own and confirmed before the intent question, a frame, a demo or a check (FR-046) | 4 | tools_not_called (demo, check); say: must says_focus_back, as_theirs, asks_and_stops, never intent_not_asked_fresh, no_where_kept | R-KT-STORED-CONFIRM, R-ONE-IDEA | live |

- **11** and **12** go one step past the pass: the learner is asked the constant-speed question and names the Spinner. 11 expects the record `keyframes.types`, passed, no demo.
- **14**, **15** and **16** each have a "yes, do the review" turn: a due review is offered and waits for a yes.
- **02** and **17** are the two sides of "nothing to snap": everything is meant to fade (Mentor Practice), and no candidate at all (a comp with only linear moves).
- **09** uses the `Loop Blink` layer in the live loop-blink capture; the unit tests prove it is never a candidate, this case checks what the mentor says about it.
- **18** is the wrong-side hold, which the spec said to add once L-1 settles its wording; the case already checks the behavior, not the wording.
- The runner's `last_check.has` compares against the check's reply with the space after each colon removed (fixed during the smoke run).

## The fixture tell

Synthetic fixtures carry the project name `Synthetic.aep`, comp names that start with "Synthetic" and a
`synthetic` note. The runner never hands the mentor the builder's file. For each run it writes a
scrubbed copy named `comp-N.json` into a neutral temp folder: the note is removed, the project becomes
`Studio Reel.aep`, "Synthetic" in a comp name becomes "Studio", and a fixture that still says
"synthetic" or "stand-in" anywhere is refused. `--dry-run` runs the same scrub.

## Fixtures

Fixtures are **not copied** into this folder. A case names a fixture by file name and the runner resolves it in
`CONFIG.fixtureDirs` order (`mentor/test/fixtures/key-types`, `mentor/test/fixtures`, `mentor/test/fixtures/layer-info`, `mentor/test/fixtures/key-types/stand-in`). The stand-in folder is gone; `layer-info` was added to the list on 2026-10-26 so a case can use
`practice2b.json`, Mentor Practice 2 as built. `fixture_sources` labels are all `live` or `synthetic`, and `--strict-sources` fails if one drifts.
The builder's table of where each capture came from is `mentor/test/fixtures/key-types/README.md`.

### Re-pointed 2026-10-26: what each case assumes, checked against the live captures

Checked by running the real tools on each capture (`key_types_snapshot`, then `key_types_check`), not by running the mentor.

- **Mentor Practice 2 is now `practice2b.json` in every case that used `practice2-before.json`.** Every planted capture was taken on the 24-layer comp (the 2b layers
  were added after `practice2-before.json`), so a lesson baselined on the 13-layer file would show 11 layers as changes. Candidates are still Blink and Cut. Seal (a precomp)
  is now a leave-out.
- **Held as written:** 01 to 04, 06 to 09, 11, 13 to 19. On `practice-now.json` (id 97) the candidates are Subtitle and Title and Logo's Rotation reads `expression` (02, 08).
  Select-all-hold (07) lists Cut as a should-move that now waits and jumps, and Card and Pause as extra holds. Loop Blink is an expression leave-out (09).
- **05 changed meaning in degree** (also 06 and 15, same capture). `blink-one-held` has the middle pair held (1.4 to 1.8 s) and **two** pairs still fading (1 to 1.4 s, frame at 1.2 s; and
  1.8 to 2.2 s, frame at 2 s). The case's title said one. Title reworded; the checks (a frame time 1.2 or 2, no fix, no offer) hold.
- **10 retired 2026-10-27** (Lance's call). `hold-at-zero` differs from `blink-one-held` only in `taken_at`, and no tool reply carries the held value (the frame is a blank placeholder), so the case cannot fail for the reason it exists. The file is in `cases/retired/`, which the runner does not read. **Bring it back if a spec adds the held value to the replies**: move it to `cases/`, check it against a capture that shows the value, and re-add it to the smoke list.
  frame is a blank placeholder, so the mentor has nothing that says "vanishing" or "hidden". What is left is "never says Blink is hidden" on a capture identical to 05's. It still
  runs, but it cannot fail for the reason the case exists. Request to the builder: have `key_types_snapshot` or `key_types_check` say the value a hold waits at (or a frame
  that shows it), or retire the case.
- **12 changed meaning.** `spinner-eased` is the base comp with only the Spinner's ease changed, so at turn 4 Blink's pairs read not held again after turn 3 showed them held. The check
  still returns `not_linear` for the Spinner (the case's subject), but the reply also shows a regression the learner did not make. Not bent. Request to the builder: a capture with Blink held
  and the Spinner eased.
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

After the smoke runs the universal `no_self_instructions` check was added (it catches a leaked step such as "Review is due -> run the review"). Run 3's transcript (case 16) contains exactly that, "Key types learned, review due -> run the review.", before its first tool call, so case 16 would fail it now; it has not been re-run (budget).


## Smoke results (2026-10-27, `main` at `e09012c` merged in; $3.64)

Files are in `results/`. Case 10 is retired and was not run.

| Run | Result | Triage |
|---|---|---|
| 16 x3 (`2026-10-27-134116`) | **FAIL 0/3**, $1.14 | Hard rule, SC-014: `no_self_instructions` failed every run: "Review is due. Go to review." (twice) and "Review is due -> review mode", written between `read_learner_record` and the first snapshot. Real. See the hand-back |
| 01 (`-134135`) | pass, $0.19 | First run on `practice2b.json` |
| 05 (`-134221`) | FAIL, $0.61 | Rubric only: R-ONE-IDEA, turn 2 recaps the three pairs, mentions the failed frames, teaches what a hold looks like and gives two methods. Deterministic checks passed |
| 12 (`-140047`) | FAIL, $0.70 | Plumbing: the judge timed out. Every deterministic check passed (not_linear, names the Spinner). Needs a judge re-run; the Blink regression question is still open |
| 20 (`-140135`) | FAIL, $1.00 | Rubric only: R-ONE-IDEA, turn 2. R-KT-STORED-CONFIRM passed and every deterministic check passed |


## Smoke re-run (2026-10-27, after `main` at `4bd5f85`; $2.14)

| Run | Result | Triage |
|---|---|---|
| 16 x3 (`2026-10-27-150200`) | **pass 3/3**, $1.30 | SC-014 met: `no_self_instructions` clean in all three. The case already had a "yes, let's do the review" turn, so it expects the offer first and needed no change |
| 12 (`-150317`) | pass, $0.84 | Replaces the judge timeout; the Blink-regression oddity in the turn 4 check did not fail it |

Still open: 05 and 20 failed only on R-ONE-IDEA (see above; the curriculum designer, sprint 4). Proposals for the baseline round, not built: a case for the review **offer** and an "I already know this" case.


## Planned smoke list (for after the next `SKILL.md` change; nothing here has been run)

Written 2026-10-26 when the three wave A sets were re-pointed to the live captures. **No paid run has
happened since.** One run each unless it says `--repeat 3`. Cost is an estimate from the earlier smoke runs' per-case cost for a case
of that length (about $0.40 for 2 to 3 turns, $0.60 or more for 4). The cockpit's hand-back adds the three sets together.

| Run | Why | Est. cost |
|---|---|---|
| `--only 16 --repeat 3` | SC-014: `no_self_instructions` 3 of 3 (the review-due case; run 3 of the first smoke leaked "Key types learned, review due -> run the review.") | $1.25 |
| `--only 01` | First run on `practice2b.json` (24 layers, Seal left out) | $0.20 |
| `--only 05` | Premise changed: two pairs still fading | $0.40 |
| `--only 12` | Premise changed: Blink regresses in the turn 4 check | $0.70 |
| `--only 20` | New case (FR-046); reaches `stored_choices` true the same way as offset 27 | $0.65 |
| **Total, key types** | 7 runs | **about $3.25** |

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
