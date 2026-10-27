# Offset evals

The eval set for `/offset-mentor` (skill 3, `timing.offset`, spec 010). It scores whether the mentor *teaches*
well, not only whether it is correct: it never names a gap to use, calls a gap under the floor together without giving a number, runs a review with no demo or method, asks instead of failing an order or a split, and never talks about parents. It runs the real skill and server in headless
Claude Code against saved snapshots, so **After Effects doesn't need to be open**. Whether the
measures are *correct* is covered by the unit tests (`cd mentor && npm test`); evals don't repeat them.

Built from the skill 6 set (`product/evals/null-parenting/`), itself copied from easing's runner. Same
options and results format; everything skill-specific is in the `CONFIG` block at the top of `run.mjs`.

## Status (2026-10-26): re-pointed to the live captures; no baseline yet

28 cases. Every fixture is a live capture from the 2026-10-26 sitting (spec 010 T034) except `synthetic/linear-basic.json` (case 18, permanent). Mentor Practice 2 is now
`practice2b.json` (24 layers). `--dry-run --strict-sources` is clean. **Still no baseline**: the full run waits for one more `SKILL.md` change, then the planned smoke list below.
Cases 25 (the gap changed after the fact, FR-040), 26 (how Quick Offset works, FR-041) 27 (stored choices confirmed, FR-046) and 28 (passed, but the stated gap differs, FR-040 as amended) are new.

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

A full run is about 83 mentor turns plus 28 judge calls. From the smoke runs (about $0.38 a case with its judge call)
expect **about $12 to $14**. Bar: SC-006,
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
`snapshot_input_matches` (regexes over a snapshot call's input), `snapshot_calls_max`, `snapshot_calls_ok` (no snapshot call refused; offset only),
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
| 01 | First lesson, properties kind, on Mentor Practice: Title's three properties, the layers kind offered once, what's left out, order and gap asked | 2 | first_tool; tools_called; demo_calls_max; tools_not_called; say: must names_properties, must offers_layers_once, must left_out_null, must left_out_hidden, must asks_first, must asks_apart, never not_everything | R-OFF-PROPOSAL, R-OFF-LEFT-OUT, R-OFF-INTENT, R-USES-MEMORY, R-NAMES-REAL | live |
| 02 | First lesson, layers kind, on Mentor Practice 2: Dot 2's properties first (the tie), the Dots offered in one sentence, the learner picks them | 2 | tools_called; demo_calls_max; snapshot_input_matches; say: must proposes_dot2, must offers_dots, must asks_order | R-OFF-PROPOSAL, R-OFF-INTENT, R-NAMES-REAL | live |
| 03 | One shift on the second member of the learner's order; frames before and after; Edit > Undo | 3 | demo_calls_min; demo_calls_max; demo_only_on; tools_called; say: must names_dot2, must undo | R-OFF-DEMO, R-DEMO-PLAIN, R-NAMES-REAL | live |
| 04 | A two-member group: no demonstration, a walkthrough in words | 3 | demo_calls_max; say: must walks_through | R-OFF-WALKTHROUGH, R-NAMES-REAL | live |
| 05 | 'What gap should I use?': it's their call, no number | 2 | say: must theirs, never no_number, must play_it_back | R-OFF-NO-GAP, R-ONE-IDEA | live |
| 06 | A 1-frame gap at 30 fps still reads as together: said, no number named, asked again | 2 | snapshot_input_matches; demo_calls_max; say: must still_together, must asks_again, never no_number | R-OFF-FLOOR, R-OFF-NO-GAP | live |
| 07 | A 3-frame gap at 60 fps still reads as together: same, on the 60 fps comp | 2 | snapshot_input_matches; demo_calls_max; say: must still_together, must asks_again, never no_number | R-OFF-FLOOR, R-OFF-NO-GAP | live |
| 08 | Uneven gaps: passes with one rhythm sentence, never a fail | 3 | last_check; say: must rhythm, never never_a_fail | R-OFF-RHYTHM, R-NAMES-REAL | live |
| 09 | Opacity moved and Position didn't: the hint shows a frame, asks if it was on purpose, no fix | 3 | tools_called; last_check; say: must names_layer, must names_props, must asks, never no_offer | R-OFF-POPS-IN, R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 10 | An effect's key moved with its layer passes | 3 | last_check; say: never no_fault | R-OFF-PASS, R-NAMES-REAL | live |
| 11 | Properties kind: a landing that moved passes | 3 | last_check; say: must praises | R-OFF-PASS, R-NAMES-REAL | live |
| 12 | A group with a held layer: its start is its jump time, and the jump is graded | 3 | last_check; say: never never_first_key | R-OFF-HOLD, R-NAMES-REAL | live |
| 13 | The order differs from the stated one: asks if it was a change of mind; doesn't fail it | 3 | last_check; say: must asks_change_of_mind, must names_both, never no_fail | R-OFF-ORDER, R-NAMES-REAL | live |
| 14 | Trimmed in point, keys unchanged: the bar-versus-keys hint | 3 | last_check; say: must keys_unchanged, never no_offer | R-OFF-BAR-KEYS, R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 15 | An incomplete stagger: names what's still the same and where; no fix, no offer | 3 | last_check; say: must names_pair, never no_offer | R-OFF-STILL-TOGETHER, R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 16 | 'Do the rest': declined warmly, no offer later | 4 | demo_calls_max; say: never no_later_offer | R-DECLINES-WARMLY, R-ONE-IDEA | live |
| 17 | Review due: a new group (Chip A to C), asks which goes first, no demo, no walkthrough, no gap | 3 | review_mode; snapshot_with; demo_calls_max; tools_called; say: must names_chips, must asks_which_first, must declines_demo | R-REVIEW-HANDS-ON, R-NAMES-REAL | live |
| 18 | A review with no new group: said in a sentence, nothing recorded | 2 | review_mode; snapshot_with; demo_calls_max; record_lesson; tools_not_called | R-REVIEW-NOTHING-NEW | synthetic |
| 19 | Version not known (the first capture of Mentor Practice has no host read): no shortcut for nudging keys and no Quick Offset; the drag is described | 3 | say: never no_quick_offset, must describes_drag | R-OFF-VERSION, R-ONE-IDEA | live |
| 20 | Easing not learned: one sentence, the lesson runs, linear moves mentioned once at 'done' | 4 | last_check; say: must names_easing, must builds_on, must linear_once | R-PREREQ-EASING, R-OFF-LINEAR-ONCE | live |
| 21 | The learner keeps a gap under the floor and asks for the demo: there is none; walked through in words | 3 | demo_calls_max; say: must walks_through, never no_number | R-OFF-FLOOR, R-OFF-WALKTHROUGH | live |
| 22 | A split said on purpose, in answer to the 'pops in' hint: that layer passes on the next check; the summary says it plainly | 4 | last_check; say: never no_blame | R-OFF-SPLIT, R-NAMES-REAL | live |
| 23 | Stops after a stagger that wasn't enough: recorded partial, gaps in plain words, no method or motive | 4 | record_lesson | R-RECORD-HONEST, R-NAMES-REAL | live |
| 24 | After Effects can't be reached: nothing claimed about the comp | 1 | tools_not_called; say: must says_cant_see, never no_claims | R-UNREACHABLE | none |
| 25 | The learner said eight frames, the check measures four and it passed: the gap is said back in their voice, no advice, no "picking up where we left off" (the wording; 28 is the mechanics) | 3 | tools_called; demo_calls_max; snapshot_input_matches (gap_frames 8); last_check; say: must says_measured_gap, never not_picking_up, never not_a_fail | R-OF-GAP-MEASURED, R-ONE-IDEA | live |
| 26 | "How does Quick Offset work?" on 26.5: only the confirmed claims, nothing about selection order, reversing, undo counts, a readout or another key; the record holds no method | 4 | tools_called; demo_calls_max; last_check; record_lesson; say: must states_the_gesture, must top_layer_stays, never no_selection_order, no_reverse_by_dragging, no_undo_count, no_gap_readout, no_other_key | R-OF-QUICK-HOW, R-RECORD-HONEST, R-ONE-IDEA | live |
| 27 | A lesson resumed on a comp that matches, with the old order (Dot 3, Dot 1, Dot 2) and gap (6 frames): said back as the learner's own and confirmed before any frame, demo or check; no field or "stored" said (FR-046, T037's case) | 4 | tools_not_called (demo, check); snapshot_input_matches; snapshot_calls_ok; say: must says_order_back, says_gap_back, as_theirs, asks_and_stops, never no_where_kept | R-OF-STORED-CONFIRM, R-ONE-IDEA | live |
| 28 | Passed, but the stated gap (six frames) differs from the measured (four): one `offset_check`, no `offset_snapshot` after it, the measured gap said back as theirs, `record_lesson` accepted as passed (FR-040 as amended, T199a) | 4 | demo_calls_max; check_calls; no_snapshot_after_check; last_check; record_lesson; say: must says_measured_gap, never not_a_fail | R-OF-GAP-MEASURED, R-RECORD-HONEST | live |

- **01** has two turns: the mentor proposes, offers the other kind and says what's left out first, then asks order and gap after the frame.
- **17** and **18** have a "yes, do the review" turn; in practice the mentor starts the review in turn 1 and the yes is redundant.
- **FR-009 (the demo runs only on a layer whose eye is on) has no eval case.** The eye-off matte fixture is a unit-test variant (`offset-visibility.test.mjs`), not a saved file, and the Dots all have their eyes on in the live captures. A case needs a saved fixture whose second member is eye-off; see requests.
- **27** reaches `stored_choices` true (checked on the `phase9-pass2` tools with these fixtures) by choosing in turn 2, starting the lesson on Mentor Practice (a different comp, so the Dots' lesson is no longer current) in turn 3, and coming back to the unchanged Dots in turn 4: resumed, baseline matching, nothing checked, no demo. The turn 4 checks are on that turn only; "no frame before asking" is the judge's, because the runner's `tools_not_called` is whole-case and turns 1 to 3 do call `preview_frame`.
- **T196's re-runs** (11, 14, 15 and 23) carry a new case-level check, `snapshot_calls_ok`: no `offset_snapshot` call came back refused (T199: a measured gap of 0 never reaches `gap_frames`).
- **25 and 28 after T199a (2026-10-27).** FR-040 no longer re-reads: step 7 has no `offset_snapshot` call and says a passed check's measured gap back from `gaps_frames`. Case 25 used to expect a snapshot call sending the measured gap (`"gap_frames":4`); that expectation is removed, and its rubric item no longer mentions a call. The two cases split the work so neither fails for two reasons: 25 is the wording (stated 8, measured 4), 28 the mechanics (stated 6, measured 4; one check, nothing after it, the record accepted). 28 has a fourth turn ("that's all for today") so a lesson recorded at the end is still caught. Two new case-level checks in this runner: `check_calls` and `no_snapshot_after_check`; they parse, and the logic is untested until the first run.
- **25** (as first written) states eight frames and then checks `layers-pass` (measured gaps 4 and 4), so FR-040's rule fires without a second reason. It stops at the pass; a "show me one" turn after a pass would shift an already-staggered Dot 2 and say nothing about the rule. **26** states four frames so the check agrees and FR-040 stays out of the way; the claims it forbids are FR-041's list, one regex each, with the judge on the whole explanation.
- **12** has no stricter check than the pass: whether the mentor names the held layer's start as its jump is for the judge.
- The universal `no_self_instructions` check catches a leaked step ("Review is due -> run the review") that the mentor wrote before its first tool call; 17 fails on it (see the smoke table).

## The fixture tell

Synthetic fixtures carry the project name `Synthetic.aep`, comp names that start with "Synthetic" and a
`synthetic` note. The runner never hands the mentor the builder's file. For each run it writes a
scrubbed copy named `comp-N.json` into a neutral temp folder: the note is removed, the project becomes
`Studio Reel.aep`, "Synthetic" in a comp name becomes "Studio", and a fixture that still says
"synthetic" or "stand-in" anywhere is refused. `--dry-run` runs the same scrub.

## Fixtures

Fixtures are **not copied** into this folder. A case names a fixture by file name and the runner resolves it in
`CONFIG.fixtureDirs` order (`mentor/test/fixtures/offset`, `mentor/test/fixtures`, `mentor/test/fixtures/layer-info`, `mentor/test/fixtures/offset/stand-in`). The stand-in folder is gone; `layer-info` was added to the list on 2026-10-26 so a case can use
`practice2b.json`, Mentor Practice 2 as built. `fixture_sources` labels are all `live` or `synthetic`, and `--strict-sources` fails if one drifts.
The builder's table of where each capture came from is `mentor/test/fixtures/offset/README.md`.

### Re-pointed 2026-10-26: what each case assumes, checked against the live captures

Checked by running the real tools on each capture (`offset_snapshot` with the learner's options, then `offset_check`), not by running the mentor.

- **Mentor Practice 2 is `practice2b.json` in every case that used `practice2-before.json`.** Every planted capture was taken on the 24-layer comp, so a 13-layer baseline would show 11 layers as changes.
  The Dots' group is unchanged (start 0.5 s), the Chips are the review's group (start 2 s), and Seal (a precomp) is now a leave-out.
- **Held as written:** 01 to 09, 12 to 18, 20 to 24. Verified: the 30 and 60 fps floors (1 and 3 frames are under it, no demo); `layers-uneven` (gaps 4 and 8, uneven); `pops-in` (Dot 1's Opacity moved, Position stayed);
  `order-differs` (Dot 3 first, still a pass); `in-point-trimmed` and `bar-dragged` (not passed, pairs still together); `pops-in` with Dot 1 split on purpose (passes); `layers-pass`.
- **10, a small change.** In `effect-with-layer` Dot 3 moved 10 frames, so the gaps are 4 and 6 and the rhythm reads uneven. The pass and the no-fault check hold; the mentor may add the rhythm sentence.
- **11 changed meaning.** In `props-pass-landing` Position and Opacity both start at 0.5 s and only Opacity's landing moved, so the measured start gaps are 0 and 4. The learner's order
  was written Position, Scale, Opacity, which the capture does not match (the answer key's order is Position, Opacity, Scale; the check reads "order differs" for the old one). I changed the learner's line to the
  key's order; nothing else. The gap of 0 is a **finding for the builder**: step 7's new re-read rule says to re-send the first measured gap, and `gap_frames` must be 1 or more. The same happens in
  14, 15 and 23, whose checks measure a 0 gap (pairs still together).
- **19 lost its premise and was retargeted.** It tested "Quick Offset isn't mentioned" on a comp whose version is not offered it. Every live offset capture is 26.5, where `quick_offset` is true and the skill rightly offers it
  (cases 25 and 26 depend on that). It now runs on `practice-before.json`, the first capture of Mentor Practice, which has no host read, so it covers the "version not known" half of FR-017 only. The learner's lines are
  Title's three properties instead of the Dots.
- **FR-040 reach.** Any case where the stated gap and the measured gap differ now triggers the re-read: 25 on purpose; 11, 14, 15, 23 by accident (a 0 gap, above). Cases 08 and 10 start with a matching first gap.
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


## Planned smoke list (for after the next `SKILL.md` change; nothing here has been run)

Written 2026-10-26 when the three wave A sets were re-pointed to the live captures. **No paid run has
happened since.** One run each unless it says `--repeat 3`. Cost is an estimate from the earlier smoke runs' per-case cost for a case
of that length (about $0.40 for 2 to 3 turns, $0.60 or more for 4). The cockpit's hand-back adds the three sets together.

| Run | Why | Est. cost |
|---|---|---|
| `--only 17 --repeat 3` | SC-014: `no_self_instructions` 3 of 3 (the review-due case; the first smoke leaked "Review is due -> run the review." in two runs of two) | $1.20 |
| `--only 25` | New case (FR-040, the wording) | $0.45 |
| `--only 28` | New case (FR-040 as amended, the mechanics: one check, no snapshot after, record passed) | $0.65 |
| `--only 26` | New case (FR-041) | $0.60 |
| `--only 02` | First run on `practice2b.json` (layers kind, Seal left out) | $0.30 |
| `--only 11` | Premise changed: a gap of 0. T196 re-run: `snapshot_calls_ok` (no refused snapshot call) | $0.45 |
| `--only 15` | T196 re-run: the re-read must not misfire on a failed check with a 0 gap (`snapshot_calls_ok`) | $0.40 |
| `--only 14` | T196 re-run, same check | $0.40 |
| `--only 23` | T196 re-run, same check | $0.60 |
| `--only 27` | New case (FR-046, T037's case) | $0.65 |
| `--only 19` | Premise lost and retargeted: version not known | $0.40 |
| `--only 10` | Premise changed in degree: uneven rhythm | $0.45 |
| **Total, offset** | 14 runs after the repeats | **about $6.55** |

Still coming, not costed: **T195**, the easing gate again, after spec 004 Phase 9's second pass merges. T196's cases are written and on the list above.

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
