# Offset evals

The eval set for `/offset-mentor` (skill 3, `timing.offset`, spec 010). It scores whether the mentor *teaches*
well, not only whether it is correct: it never names a gap to use, calls a gap under the floor together without giving a number, runs a review with no demo or method, asks instead of failing an order or a split, and never talks about parents. It runs the real skill and server in headless
Claude Code against saved snapshots, so **After Effects doesn't need to be open**. Whether the
measures are *correct* is covered by the unit tests (`cd mentor && npm test`); evals don't repeat them.

Built from the skill 6 set (`product/evals/null-parenting/`), itself copied from easing's runner. Same
options and results format; everything skill-specific is in the `CONFIG` block at the top of `run.mjs`.

## Re-baseline rb3 (2026-10-29, after the overlap-audit fixes; mentor at `df65d41`)

**33/37 (89%), $21.38**, results `2026-10-29-144419.json` (rb2 was 29/33, 88%). SC-006 met on the score, but **one hard-rule check failed** (23 `record_plain`), so the bar is not clean. Failures were repeated once with `--repeat 3` ($8.74: `-144627` case 13, `-144824` case 20, `-145024` case 23, `-145202` case 33).

**New cases (numbers from the cockpit: 34 to 37, all four used; all four passed first time).** Fixtures are synthetic, built from `practice2b.json` by script into `fixtures/synthetic/` (the runner now searches that folder); the mentor wasn't edited.
- **34 member-single-and-expression-keys-moved** (OA-1): Dot 3 has a single Scale key and an expression-driven Rotation; the stagger passes and both keys also moved. Rubric `R-OF-OTHER-CHANGES`.
- **35 key-added-on-dot-1** (OA-2): a key added on Dot 1's Position. Same rubric.
- **36 guide-layer-left-out** (guide wording): Dot 3 is a guide layer; one opening turn. Rubric `R-OFF-GUIDE-LEFT-OUT`.
- **37 whole-bar-drag-not-double-reported** (OA-1): each Dot's whole bar dragged, so the keys the stagger doesn't count moved with it; the pass mentions no other change. Rubric `R-OF-NO-OTHER-CHANGES`.

**Failures and verdicts**

| Case | Full run | Repeat x3 | Verdict |
|---|---|---|---|
| 13 order-differs | FAIL, `asks_change_of_mind` (no question mark in turn 3: "that's fine if you meant it") | 3/3 pass | Noise (watch list; the mentor sometimes states instead of asks) |
| 20 easing-not-learned | FAIL, `builds_on` (turn 2 never says easing) | **0/3**: `R-OFF-LINEAR-ONCE` twice (linear said at the opt-in and again at "done"), `builds_on` once | **Mentor / skill text**. SKILL.md lines 105 to 108 say to give the "still linear" sentence when they opt in, and then "mention it once at done"; the rubric and line 298 say once. Smallest fix: drop one of the two (the opt-in sentence, keeping "builds on easing" for `builds_on`, or the done mention, and then change the rubric). Needs the cockpit's call |
| 23 record-honesty | FAIL, hard rule `record_plain` (`next`: "Start Dot 2 later than Dot 1.") | 2/3 pass; run 1 `record_plain` "Moved" (summary: "Moved the last layer ...") | **Mentor**. Real, 2 of 4 runs. SKILL.md step 10 lists method words "shortened, shifted, dragged, trimmed" but not "moved", and it bars layer names only for `summary`. Smallest fix: add "moved, nudged" to that list and say `next` holds no layer or property names either |
| 33 order-and-gap-in-one-answer | FAIL, `R-ONE-IDEA` (three-sentence how-to after the plan) | 3/3 pass | Noise (rubric judgment; the 10-28 failure was this case's check) |

## Re-baseline rb2 (T435, 2026-10-28, mentor at `a8e34ef`)

**29/33 (88%), $18.83**, results `2026-10-28-221447.json`. SC-006 met on the score; two deterministic say checks failed (04 `no_second_walkthrough`, 33 `ends_on_task`). No demo, tool-count or record check failed. Rubric failures: 08 `R-OFF-RHYTHM`, 11 `R-OFF-PASS`. New cases 27 and 33: 27 passed, 33 failed (check). 

## Status (2026-10-26): re-pointed to the live captures; no baseline yet

32 cases after Phase 10 (29 to 32 new). Every fixture is a live capture from the 2026-10-26 sitting (spec 010 T034) except `synthetic/linear-basic.json` (case 18, permanent). Mentor Practice 2 is now
`practice2b.json` (24 layers). `--dry-run --strict-sources` is clean. **Still no baseline**: the full run waits for one more `SKILL.md` change, then the planned smoke list below.
Cases 25 (the gap changed after the fact, FR-040), 26 (how Quick Offset works, FR-041) 27 (stored choices confirmed, FR-046) and 28 (passed, but the stated gap differs, FR-040 as amended) are new.

## Phase 10: the opening read (T413, T414; 2026-10-27, `main` at `1a28b1d` merged in)

The snapshot tool now reads the learner record and picks lesson or review itself (spec 004 FR-048 to FR-052), and the skill opens with
`offset_snapshot`, never calling `read_learner_record`. This set follows it. **32 cases.**

**Runner changes** (`run.mjs`):
- Universal `no_text_before_snapshot` (copied from the pivot set): nothing the learner sees between the lesson's first tool call and its first `offset_snapshot`.
- Universal `no_read_learner_record`: the tool is never called. It is also out of `--allowedTools` (OR-2: `ALLOWED_TOOLS`), but stays in `MENTOR_TOOLS` so an attempted call is still seen and fails this check instead of reading as a foreign tool.
- A review is recognised from a snapshot **reply** (`mode: "review"`), not the call's input (the opening call sends no mode). `review_mode` and the review-only checks use it.
- New expect key `snapshot_reply`: `[{ turn?, equals: { "mode": "review", "learner.readable": false } }]`, compared with the first successful snapshot reply (of that turn). New turn key `new_session: true`: the learner comes back in a fresh conversation; the mentor's files persist.

**Changed cases**
- **01**: `first_tool` is now `offset_snapshot`; `R-USES-MEMORY` dropped (same reason as key types 01).
- **17**: `snapshot_with` became `snapshot_reply` (turn 1, `mode: "review"`).
- **18** (was `18-review-nothing-new`, now `18-due-review-nothing-new-opens-lesson`): OR-1. The record has a due review and the comp (`linear-basic`) has no new group; a **lesson** opens (`mode: "lesson"`), nothing is recorded, and no review, "due" or catch-up is mentioned. One turn now (no "yes, do the review"); rubric `R-OR1-LESSON` replaces `R-REVIEW-NOTHING-NEW` (left in `rubric.md`, unused here).

**New cases** (numbers from the cockpit; 29 to 32, all four used)
- **29** unreadable notes (as key types 21).
- **30** practicing: the opening picks up the unfinished Dot 3 stagger in plain words with when.
- **31** a review asked for with none due: it runs on the Chips, nothing says due.
- **32** a review offered and left open, then a new session: offered again, no lesson, no demo.
- Case 27 (stored choices, FR-046) already exists and is the resumed-lesson case.

Records the new cases need are in `product/evals/offset/records/` (the runner takes any repo path). The "not due" records have `review_due` of 2099-12-31, because the saved ones are dated in October 2026 and a "none due" record built from them is due forever once the date passes.

**Smoke results (2026-10-27, one run each unless noted; $3.12 including re-runs)**

| Case | Result | Notes |
|---|---|---|
| 29 (`-203846`, then x2 `-204441`) | pass, pass, **FAIL** | The failure (R-UNREADABLE-NOTES): the notice came in two sentences, notes cited again ("your notes don't show easing as learned yet"), and a prerequisite question replaced the lesson. Mentor (below) |
| 30 (`-203905`) | pass | |
| 31 (`-203922`) | pass | |
| 32 (`-203940`) | pass | |
| 17 (`-204008`) | pass | |
| 18 (`-204023`) | pass | The mentor opened with "About two weeks ago you staggered Dot 1, Dot 2 and Dot 3" and pointed the learner at Mentor Practice 2. No review mentioned |
| 01 (`-204055`) | FAIL, $0.37 | R-USES-MEMORY (stale; dropped). Re-run x2 (`-204347`): FAIL then pass. The failure was R-OFF-PROPOSAL: the group was given in two sentences ("...all run from 0.5 s to 1.5 s." then "They start on the same frame and land on the same frame."). Rubric judgment, one in three, not touched |

**Ready for T415?** Yes for the runner and the checks. SC-015's runs wait for the merge into `main`. The unreadable-notes case will not reach 3 of 3 until the mentor-side issue below is fixed.

**Mentor-side finding from the unreadable-notes case (fixed by Phase 10 round 2, Fix A, 2026-10-28; see above)**

With the notes unreadable, the tool reports easing as not learned (`other_skills[].learned` false), so the skill's "easing isn't learned" branch fires: the mentor offers easing instead of teaching, and key types said once "you haven't learned easing yet", which the missing notes can't support. Smallest fix: in `opening.mjs` `slice()`, when the record is unreadable, leave `other_skills` out (or give `learned: null`); or one line in each `SKILL.md` step 0, "if `learner.error` is there, skip the easing branch". Observed: key types 1 claim in 3 runs; offset 1 of 2 runs replaced the lesson with the easing question; speed graph 0 of 3 (it said it didn't know).


## Phase 10 round 2: unreadable notes, `learned` is null (2026-10-28, `main` at `0309044` merged in)

Fix A made `other_skills[].learned` `null` on an unreadable record (confirmed in all three snapshot replies) and step 0 makes no claim or offer from it. Case 29-unreadable-notes changed: the easing-only `no_easing_claim_from_unreadable_notes` check became `no_other_skill_claim_from_unreadable_notes` (any skill: easing, speed graph, key types, offset, pivot, anchor, null, parenting, said as "haven't learned/done/covered", "isn't done", or "you haven't X"), and a new `notes_sentence_once` check fails if the "couldn't read my notes" sentence appears twice. Both regexes were tried on sample sentences first. The rubric is unchanged.

| Run | Result | Notes |
|---|---|---|
| `--only 29 --repeat 3` (`2026-10-28-105756`) | **3/3 pass**, $0.66 | Every check and all three rubric items passed in every run. The notes sentence came once, first, with no claim about any skill. In this repo `--only 29` matches only this case. It failed on the 2026-10-27 smoke; now it passes. |

**Ready for T415?** Yes for this case. The mentor-side finding below is fixed (Fix A); it is kept for the record.

## Pacing evals (T433, 2026-10-28; mentor from the T432 branch)

Dry run only so far (`--dry-run --strict-sources`: 33 cases valid).
- **Rubric:** `R-ONE-IDEA` takes TD § 15 › What R-ONE-IDEA should see (explanation turn ends on the intent question; task turn ends on "play it back and say done" with no bulleted methods, trim warning, "top layer stays" or properties rule unasked; order and gap given with the choice make turns 2 and 3 one; a side question is the answer plus the pending step). New item `R-ASK-RUNS-DEMO`.
- **Changed case:** 16 (Eval plan 14, amended 2026-10-28): "stagger the rest for me" after an order, before any demo, is the ask, so the one demo runs (`demo_calls_min` 1, `demo_only_on` `layer/6`, `undo` said in turn 3) and the rest is handed back; `no_later_offer` still holds on turn 4, whose project is now `layers-pass.json`. Rubric: `R-ASK-RUNS-DEMO`, `R-DEMO-PLAIN`, `R-ONE-IDEA` (was `R-DECLINES-WARMLY`). Case 01's `asks_first` and `asks_apart` stay on turn 2, as built.
- **New case (number 33, after the highest, 32):** **33** order and gap given together in answer to the intent question (turn 3): their plan said back, a one-or-two-sentence how-to, ends on "say done"; no bullets, trim warning or Quick Offset spreading rule.
- **Not yet run:** 33. The T434 repeats are 01 to 06, 16, 19, 25, 26, 27.

**Pacing repeats (2026-10-28, mentor at `df6efdb`; $11.17, stopped at the $50 limit):** 01 3/3, 02 3/3, 03 3/3, 04 2/3, 05 3/3, 06 3/3, 16 3/3. Not run: 19, 25, 26, 27 (and the new 33). 04 run 2: the "Can you show me how?" answer walks the drag through a second time (TD § 15 rule 3, "never the walk-through a second time"; minor prompt). 16 passes 3/3 with the demo-on-ask.

**Fix-round repeats (2026-10-28, mentor at `86fc67f`; $7.87, stopped at the $15 limit):** 04 1/3, 19 3/3, 25 3/3, 26 2/3 (27 not run). 04 run 1: "show me how" repeats the full how-to with Quick Offset (prompt, TD § 15 rule 3); run 3: answers in one sentence and the pending step, which is the design, but fails the `walks_through` check (check, mine: the answer to a side question carries no drag/keys/bar). 26 run 1: `top_layer_stays` wants "stays" and the mentor said "staying put" (check bug, mine).

**Changed after seeing results (2026-10-28, human-approved):** (1) case 26's `top_layer_stays` now accepts "staying" (`stay(?:s|ing)`); the mentor said "the top layer staying put", which is correct (check bug; design line: the `SKILL.md` "if they ask how Quick Offset works" paragraph, L-1). (2) case 04 turn 3: the `walks_through` check (drag, keys or bar) is replaced by `no_second_walkthrough`, a `never` on "Quick Offset" or "drag the middle"; design line: TD § 15 rule 3, a side question gets one or two sentences plus the pending step, "never the walk-through a second time". Case 04 still lists `R-OFF-WALKTHROUGH`; its fixture's turn 2 already carried the walk-through, so watch that item at the next run. The 1/3 and 2/3 scores for 04 and 26 in the fix-round repeats were on the old checks.

**Changed after seeing results (2026-10-28, human-approved, batch 1 re-baseline):** case 33's `ends_on_task` now allows quotes around the word (`say "?done"?`); the mentor wrote `say "done"`. Design line: TD § 15 turn 3 (end on the task and the word to say). Tested on the logged line and a line with no task.

**Changed after seeing results (2026-10-29, human-approved, fix round 4):** `record_plain` now also fails a record whose `summary` or `next` holds a layer name (Title, Dot 1, Chip A, Bar, Glow and the other practice layers) or a method word (shortened, shifted, moved, dragged, nudged, slid, Quick Offset). Measured gaps ("about 4 and 8 frames") stay allowed, since the builder decided they stay in the offset record; `attempted` may name members and is exempt; "moved together" is a result, not a method, and passes. The bare word "bar" is no longer a method word (Mentor Practice has a layer named Bar, and "try a layers stagger on Bar and Glow" was reported as a method word); only "the/a/its/each/layer bar" is, and a capitalized Bar in `summary` or `next` is reported by the layer-name rule under its own name. Design line: `SKILL.md` step 10 ("no layer or property names, never how they did it") and the earlier 08 and 11 findings above, where the old check missed them. The check is now `record-plain.mjs` (tested by `record-plain.test.mjs`, `node --test product/evals/offset/record-plain.test.mjs`). Run against the 15 record calls logged in the latest results, it flags 11 cases (08, 10, 11, 12, 13, 20, 22, 23, 25, 26, 28), all from records written before the general-terms skill fix, so those scores are not comparable with the new check. The other sets' `record_plain` checks are unchanged.

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
| `no_text_before_snapshot` | nothing said before the first snapshot call (FR-052) |
| `no_read_learner_record` | the skill never calls `read_learner_record` (FR-052, OR-2) |
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
`review_mode`, `snapshot_reply` (values of a snapshot reply: `[{ turn?, equals }]`), and `say`: a list of `{ id, must | never, turns, cs }` regex checks on the mentor's
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
| 17 | Review due: a new group (Chip A to C), asks which goes first, no demo, no walkthrough, no gap | 3 | review_mode; snapshot_reply; demo_calls_max; tools_called; say: must names_chips, must asks_which_first, must declines_demo | R-REVIEW-HANDS-ON, R-NAMES-REAL | live |
| 18 | A review is due but the comp has nothing new: a lesson opens, nothing recorded, no review mentioned (OR-1) | 1 | snapshot_reply (lesson); record_lesson null; tools_not_called; say: never no_review_mentioned | R-OR1-LESSON | synthetic |
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
| 29 | Unreadable notes: one sentence about it, a lesson follows, nothing before the snapshot, no easing claim from missing notes | 1 | first_tool; snapshot_reply (learner.readable false, mode lesson); say: must says_notes_unreadable, must goes_on_to_lesson, never notes_plain, never no_easing_claim_from_unreadable_notes | R-UNREADABLE-NOTES, R-UNREADABLE-NOT-A-CLAIM, R-NAMES-REAL | live |
| 30 | Practicing: picks up the unfinished Dot 3 stagger, plain words and when, no skill ID | 1 | first_tool; snapshot_reply (practicing, lesson); say: must picks_up_where_it_was, must says_when, never no_skill_name_as_id | R-PRACTICING-MEMORY, R-NAMES-REAL, R-ONE-IDEA | live |
| 31 | A review asked for with none due: it runs on the Chips; nothing says due or early | 1 | first_tool; snapshot_reply (review, asked, review_due false); review_mode; say: never never_says_due | R-REVIEW-ASKED-NOT-DUE, R-REVIEW-HANDS-ON, R-NAMES-REAL | live |
| 32 | A review offered and never answered, then a new session: offered again, no lesson, no demo | 2 | snapshot_reply (turn 1 review_due, turn 2 in_progress); snapshot_input_lacks; tools_not_called; say: must offers_review_again, never no_lesson_started | R-REVIEW-REOFFER, R-NAMES-REAL | live |

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


## Smoke results (2026-10-27, `main` at `e09012c` merged in; $8.08)

Files are in `results/`. One run each unless marked.

| Run | Result | Triage |
|---|---|---|
| 17 x3 (`2026-10-27-134132`) | **FAIL 0/3**, $1.28 | Hard rule, SC-014: `no_self_instructions` failed every run ("Review is due -> review mode" twice, "Learned and review due ->" once). Real |
| 25 (`-134211`) | FAIL, $0.63 | Rubric only: R-ONE-IDEA, turn 2 (plan, why a stagger leads the eye, three methods). `gap_frames` 8 check passed |
| 28 (`-135032`) | FAIL, $0.78 | The mechanics passed (one check, no snapshot after it, record accepted as passed). Rubric: R-OF-GAP-MEASURED, real: the mentor said the measured gap, then "if not, try it at 6 and compare", advice back to the stated gap. R-RECORD-HONEST: **my rubric bug**, it banned numbers while `SKILL.md` step 10 prescribes measured gaps; fixed (not re-run) |
| 26 (`-140034`) | FAIL, $0.00 | Plumbing: `claude` timed out before the first turn. Not run; FR-041 is still untested |
| 02 (`-140111`) | pass, $0.44 | First run on `practice2b.json` |
| 11 (`-140142`) | FAIL, $0.53 | **My check bug**: `praises` wanted "Title"; the mentor named Scale and Position without the layer and said the pass. Widened (not re-run); the judge didn't run. `snapshot_calls_ok` passed |
| 15 (`-140233`) | FAIL, $0.65 | Rubric, real: R-HINT-NOT-FIX and R-OFF-STILL-TOGETHER, the hint ends with "Dragging the whole bar, or selecting its keys and dragging them, does". `snapshot_calls_ok` passed |
| 14 (`-140315`) | FAIL, $0.62 | Rubric, real: R-OFF-BAR-KEYS and R-HINT-NOT-FIX, the hint spells out dragging the bar or keys, a shift of "your 4 frames" and Edit > Undo. `snapshot_calls_ok` passed |
| 23 (`-140415`) | FAIL, $0.84 | R-RECORD-HONEST only, the same rubric bug as 28 (measured gaps in the summary, as `SKILL.md` says). Fixed (not re-run). `snapshot_calls_ok` passed |
| 27 (`-140458`) | FAIL, $1.09 | Rubric only: R-ONE-IDEA, turn 2. R-OF-STORED-CONFIRM passed and every deterministic check passed |
| 19 (`-140532`) | pass, $0.59 | |
| 10 (`-140611`) | pass, $0.63 | |


## Smoke re-run (2026-10-27, after `main` at `4bd5f85`; $6.33)

Case 17's expectation changed: `names_chips` and `asks_which_first` moved from turn 1 to turn 2, because the mentor's first words are now the review offer and the review opens after the learner says yes. Nothing else changed.

| Run | Result | Triage |
|---|---|---|
| 17 x3 (`2026-10-27-150208`) | **pass 3/3**, $1.52 | SC-014 met: `no_self_instructions` clean in all three |
| 11 (`-150248`) | FAIL, $0.62 | Rubric, R-OFF-PASS: "That passes," then asks whether the split landing was on purpose. One run; the check had passed |
| 14 (`-150327`) | pass, $0.62 | The hint no longer names a method |
| 15 (`-150403`) | pass, $0.61 | Same |
| 23 (`-150446`) | pass, $0.83 | |
| 28 (`-150528`) | FAIL, $0.86 | Mechanics and gap say-back passed (no "try it at 6"). R-RECORD-HONEST: the summary adds "Stated gap was 6 frames", a number not in the check |
| 26 (`-150614`) | FAIL, $0.84 | **FR-041's first real result:** all 22 deterministic checks passed, and R-OF-QUICK-HOW and R-RECORD-HONEST passed. The explanation used only confirmed claims. Failed on R-ONE-IDEA only (turn 2's list of three methods; turn 1 is long) |

`snapshot_calls_ok` passed again in 11, 14, 15 and 23. Proposals for the baseline round, not built: a case for the review **offer** and an "I already know this" case.


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

## T415: SC-015's repeats (2026-10-28)

Cases 01 (first lesson, properties kind), 17 (review due), 29 (unreadable record), 30 (practicing); each `--only <id> --repeat 3`, 12 runs plus one plumbing re-run, **$4.33** (results `2026-10-28-115526`, `-115629`, `-115727`, `-115827`, and the re-run `-115906`). Case 18 is the OR-1 "due review, nothing new" case, so 17 is the review-due case.

SC-015 counts: runs with learner-visible text before the first snapshot call **0**; runs whose first tool was not the snapshot tool **0**; skill IDs in learner-visible text **0**. Counted from the saved transcripts (every `MENTOR:` block before the first snapshot call; the first tool call; a regex for skill IDs in every `MENTOR:` block), and agreeing with the runner's own `no_text_before_snapshot`, `first_tool`, `plain_words` and `no_read_learner_record` checks, which passed in every run. Not baselines; not whole-set runs. Run against the worktree's `mentor/` and `.claude/skills/`, which match `main`.

| Case | Result | Triage |
|---|---|---|
| 01, 29, 30 | 3/3 each | Clean |
| 17 | 2 of 3 counted, 1 plumbing | Run 2: **plumbing**, the judge's reply could not be parsed ("unreadable judge reply"); every deterministic check passed and the visible judge text marked R-REVIEW-HANDS-ON as passing. Re-run once as 1 run (`-115906`): pass, $0.47. Counted in the SC-015 totals as 13 runs (the plumbing run included, it had clean transcripts) |

**Judge input (2026-10-28):** `run.mjs` now gives the judge each tool result up to 16000 characters (was 6000). The cap hid the snapshot's side note from the judge in the anchor set and produced a false "guessed" failure; the same cut could hide long snapshot replies here. Results taken before this date were judged on the shorter cut.

## Fix round 3 re-runs (2026-10-28, $7.49 in all)

Mentor at `7de3cc2` (fix round 3: record-summary rule, offset's one how-to, speed graph's demo turn, easing's layer count, four check fixes). `--repeat 3` per command, majority passes. R-ONE-IDEA and the pacing rules (curriculum § 2) are in force. Results in the files named; no check or rubric was changed after seeing results.

| Case | Result | Triage |
|---|---|---|
| 04 | 3/3 (`-225004`, $1.90) | Clean |
| 08 | 2/3 (`-225142`, $1.82) | Run 2 failed `record_plain` ("so that" in the record). **Noise at this rate, but real leakage**: the record summaries in the other runs still carry "about 4 and 8 frames", which the record-summary rule (no times) rules out and the check doesn't see. Prompt, TD 010 § 15 / curriculum § 2 stage 5. |
| 11 | **0/3** (`-225340`, $1.87) | Run 1 failed `record_plain` (the record's `next` names "Bar and Glow"). Runs 2 and 3 failed R-OFF-PASS: the check passed with `still_same` empty and the mentor credited the pass, then added a fault the check didn't list (Opacity "still starts at 0.5 s along with Position"), and the record's `next` says to stagger the starts. **Prompt.** The records also say "about 0 and 4 frames" and describe the method ("shortened", "shifted"). The mentor adds to the check's verdict instead of reporting it. |
| 33 | 2/3 (`-225517`, $1.90) | Run 1: R-ONE-IDEA, the how-to ran to three sentences and Quick Offset was its own sentence rather than a clause. Borderline wording on the one-how-to rule; passes by majority. Rubric judgment, treat as noise until it repeats. |

## Case 22 learner line (2026-10-29, human-approved)

Changed after seeing results (`results/2026-10-29-005809.json`). The learner line said "Opacity going before its Position was on purpose", but the fixture (`pops-in.json`) has Dot 1's Position starting at 0 s and Opacity at 0.7 s, so Position goes first. The mentor correctly asked which was meant and `offset_check` never got the on-purpose flag. The line now reads "Position going before its Opacity". Same single reason and tags (EP-20, D-2); no check or rubric changed.
