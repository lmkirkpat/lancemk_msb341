# Speed graph evals

The eval set for `/speed-graph-mentor` (skill 2, `easing.speed_graph`, spec 008). It scores whether the mentor *teaches*
well, not only whether it is correct: it never states a target number, never claims to see the Graph Editor, gives hints instead of fixes, runs a review with no demo or walkthrough, and stays honest about expressions and shared keys. It runs the real skill and server in headless
Claude Code against saved snapshots, so **After Effects doesn't need to be open**. Whether the
measures are *correct* is covered by the unit tests (`cd mentor && npm test`); evals don't repeat them.

Built from the skill 6 set (`product/evals/null-parenting/`), itself copied from easing's runner. Same
options and results format; everything skill-specific is in the `CONFIG` block at the top of `run.mjs`.

## Spec 007 button cases (T034, written 2026-11-09, dry-run only)

6 cases added, ids 30 to 35. Each sends one panel request, word for word (`contracts/button-requests.md`), into a lesson that is open. The first run is spec 007 T038: `node product/evals/speed-graph/run.mjs --only FR-070` runs exactly these cases (every one lists `FR-070` in `covers`).
Not yet run: the set's full-run baseline is unchanged. New rubric items: `R-CONTINUES`, `R-SHOW-ME-AGAIN`, `R-NEW-LESSON-ASKED`. New expect keys (shared, `../lib/turn-checks.mjs`): `last_turn_tools_called`, `last_turn_tools_not_called`, `say_max_sentences`.
The turn named is the one that carries the request under test; earlier turns set the lesson up (typed answers on the way in, since these skills ask first).

| Case | Turn | Exact request | Request |
|---|---|---|---|
| 30-button-check-partial | 3 | `I'm done. Check my work.` | RQ-14 Done, check it |
| 31-button-hint | 4 | `Can I have a hint?` | RQ-14 Hint |
| 32-button-show-me | 3 | `Show me how first.` | RQ-14 Show me |
| 33-button-show-me-again | 4 | `Show me again: explain the change you already made, with a frame. Don't change anything.` | RQ-14 Show me again |
| 34-button-new-lesson-due-record | 1 | `/speed-graph-mentor lesson` | RQ-02 New lesson |
| 35-button-continue | 3 | `I'm back. Pick up where we left off.` | RQ-12 Continue lesson |

## Re-baseline rb3 (2026-10-29, after the overlap-audit fixes; mentor at `df65d41`)

**29/29 (100%), $14.91**, results `2026-10-29-142640.json` (rb2 was 21/25, 84%). SC-006 met, every hard-rule check passing, no failures, so no repeats. The watch-list case 03 passed.

**New cases (numbers from the cockpit: 26 to 29; smoke runs `-141111`, `-141141`, `-141209`, `-141238`, $2.01, all passed first time, and passed again in the full run).** Fixtures are synthetic, built from `practice-now.json` by script into `fixtures/synthetic/` (the runner now searches that folder). The mentor wasn't edited.
- **26 null-added-then-shaped** (OA-5): a null is added at the top and Title is fully shaped; Title moved to layer 2, the check still grades Title and passes. Rubric `R-SG-RENUMBER-OK`. The mentor mentioned the null in one plain sentence.
- **27 same-name-copy-unmatched** (OA-5, FR-053): Title duplicated with its own name; every pair `unmatched`. The mentor asked for a rename or Edit > Undo and "done" again, with no verdict. Rubric `R-SG-UNMATCHED`.
- **28 land-hard-pair-edited** (OA-3, T466): the learner says Title's last move lands hard, then shapes the rest and also changes that move. The mentor said it saw the change, "yours to shape however you want", once. Rubric `R-SG-LANDS-HARD-EDIT`.
- **29 guide-layer-not-default-focus** (D-OA-1): Title is a guide layer; the record eases Title and Subtitle (`records/learned-title-subtitle-eased.json`). The focus is Subtitle and the opening names it. Rubric `R-SG-GUIDE-NOT-FOCUS`.

Caveats: case 29 checks the proposal (`focus_named` plus the rubric), not a demo on a guide layer, since it never asks for one. Case 26's mentor sentence about the null ("moves Title from above") is the mentor's guess about parenting, not something the tool said; it passed `R-NAMES-REAL` and is harmless here.

## Re-baseline rb2 (T431, 2026-10-28, mentor at `a8e34ef`)

**21/25 (84%), $12.09**, results `2026-10-28-215903.json`. SC-006 met on the score; two deterministic say checks failed (03 `walks_through`, 23 `asks_something`), both triaged as checks that predate the pacing rules. No demo, tool-count or record check failed. Rubric failures: 05 `R-ONE-IDEA`, 16 `R-RECORD-HONEST`.

## Status (2026-10-26): re-pointed to the live captures; no baseline yet

25 cases after Phase 10 (21 to 25 new). Every fixture is a live capture from the 2026-10-26 sitting (spec 008 T029 to T031), except `synthetic/linear-basic.json`
(cases 13 and 17, permanent). `--dry-run --strict-sources` is clean. **Still no baseline**: the full run waits for one more `SKILL.md` change, then the
planned smoke list below. Case 19 (a reading answer given as a frame, FR-039) is new.

## Phase 10: the opening read (T413, T414; 2026-10-27, `main` at `1a28b1d` merged in)

The snapshot tool now reads the learner record and picks lesson or review itself (spec 004 FR-048 to FR-052), and the skill opens with
`speed_graph_snapshot`, never calling `read_learner_record`. This set follows it. **25 cases.**

**Runner changes** (`run.mjs`):
- Universal `no_text_before_snapshot` (copied from the pivot set): nothing the learner sees between the lesson's first tool call and its first `speed_graph_snapshot`.
- Universal `no_read_learner_record`: the tool is never called. It is also out of `--allowedTools` (OR-2: `ALLOWED_TOOLS`), but stays in `MENTOR_TOOLS` so an attempted call is still seen and fails this check instead of reading as a foreign tool.
- A review is recognised from a snapshot **reply** (`mode: "review"`), not the call's input (the opening call sends no mode). `review_mode` and the review-only checks use it.
- New expect key `snapshot_reply`: `[{ turn?, equals: { "mode": "review", "learner.readable": false } }]`, compared with the first successful snapshot reply (of that turn). New turn key `new_session: true`: the learner comes back in a fresh conversation; the mentor's files persist.
- New expect keys `focus_stable` (every snapshot reply focuses on the same layer) and `focus_named` (`{ turn }`: that layer is named in the turn).

**Changed cases**
- **01**: `first_tool` is now `speed_graph_snapshot`; `R-USES-MEMORY` dropped (same reason as key types 01; it passed in the one smoke run, so this is the consistent change, not a fix).
- **08**: `snapshot_with` became `snapshot_reply` (turn 1, `mode: "review"`).
- **17** (was `17-review-nothing-new`, now `17-due-review-nothing-new-opens-lesson`): OR-1, as offset 18. A lesson opens on `linear-basic`, nothing is recorded, no review mentioned. Rubric `R-OR1-LESSON`.

**New cases** (numbers from the cockpit; 21 to 25, all five used)
- **21** unreadable notes (as key types 21).
- **22** practicing: Title's landing still needed to be longer, said in plain words with when.
- **23** a review asked for with none due: it runs on a new move (Card), nothing says due.
- **24** a review offered and left open, then a new session: offered again, no lesson, no demo.
- **25** the Phase 10 review's second should-fix: the easing lesson's layer (Subtitle) isn't first in the comp (record `learned-subtitle-eased.json`), a review runs, and every snapshot reply focuses on the layer the first one did, named in turn 2. **Caveat:** in the smoke run the mentor made one snapshot call, so `focus_stable` had only one reply to compare; the case checks the opening call's pick (Subtitle, not Title) but only catches the later-call bug if the mentor makes a later call. The unit test is the real guard for that.
- Case 20 (stored land-hard choice, FR-046) is the resumed-lesson case.

Records the new cases need are in `product/evals/speed-graph/records/` (the runner takes any repo path). The "not due" records have `review_due` of 2099-12-31, because the saved ones are dated in October 2026 and a "none due" record built from them is due forever once the date passes.

**Smoke results (2026-10-27, one run each unless noted; $3.10 including re-runs)**

| Case | Result | Notes |
|---|---|---|
| 21 (`-203849`, then x2 `-204445`) | pass x3 | The mentor said it didn't know whether easing was done and asked: the honest form |
| 22 (`-203912`) | pass | |
| 23 (`-203929`) | pass | |
| 24 (`-203954`) | pass | |
| 25 (`-204033`) | pass | See the caveat on one snapshot reply, above |
| 08 (`-204051`) | pass | |
| 17 (`-204105`) | pass | The mentor said the comp has nothing eased yet and offered easing; no review mentioned |
| 01 (`-204144`) | pass | |

**Ready for T415?** Yes for the runner and the checks. SC-015's runs wait for the merge into `main`. The unreadable-notes case will not reach 3 of 3 until the mentor-side issue below is fixed.

**Mentor-side finding from the unreadable-notes case (fixed by Phase 10 round 2, Fix A, 2026-10-28; see above)**

With the notes unreadable, the tool reports easing as not learned (`other_skills[].learned` false), so the skill's "easing isn't learned" branch fires: the mentor offers easing instead of teaching, and key types said once "you haven't learned easing yet", which the missing notes can't support. Smallest fix: in `opening.mjs` `slice()`, when the record is unreadable, leave `other_skills` out (or give `learned: null`); or one line in each `SKILL.md` step 0, "if `learner.error` is there, skip the easing branch". Observed: key types 1 claim in 3 runs; offset 1 of 2 runs replaced the lesson with the easing question; speed graph 0 of 3 (it said it didn't know).


## Phase 10 round 2: unreadable notes, `learned` is null (2026-10-28, `main` at `0309044` merged in)

Fix A made `other_skills[].learned` `null` on an unreadable record (confirmed in all three snapshot replies) and step 0 makes no claim or offer from it. Case 21-unreadable-notes changed: the easing-only `no_easing_claim_from_unreadable_notes` check became `no_other_skill_claim_from_unreadable_notes` (any skill: easing, speed graph, key types, offset, pivot, anchor, null, parenting, said as "haven't learned/done/covered", "isn't done", or "you haven't X"), and a new `notes_sentence_once` check fails if the "couldn't read my notes" sentence appears twice. Both regexes were tried on sample sentences first. The rubric is unchanged.

| Run | Result | Notes |
|---|---|---|
| `--only 21 --repeat 3` (`2026-10-28-105919`) | **3/3 pass**, $0.77 | Every check and all three rubric items passed in every run. The notes sentence came once, first, with no claim about any skill. In this repo `--only 21` matches only this case. |

Watched for a stall (`eased_layers` is empty on an unreadable record): none. All three runs picked Title as the focus (its moves carry the default Easy Ease, which the snapshot still finds), named the eased layers it left out, and asked one question. Subtitle, Bar and Glow were named as "still need easing, that's the easing lesson", which is a statement about the comp, not about the learner's notes.

**Ready for T415?** Yes for this case. The mentor-side finding below is fixed (Fix A); it is kept for the record.

## Pacing evals (T429, 2026-10-28; mentor from the T428 branch)

Dry run only so far (`--dry-run --strict-sources`: 25 cases valid).
- **Rubric:** `R-ONE-IDEA` takes TD § 15 › What R-ONE-IDEA should see (explanation turn ends on "do that on [the pairs] and say done", a demo offer may follow once; a drag-up warning, a bulleted block or the peak giveaway fails it; the pass turn carries the read-again question; a side question is the answer plus the pending step).
- **Cases:** none change. Case 10 still looks for "sideways" in turn 2's hint (`sideways` check, unchanged). Case 05 already asks "do the rest" after a demo, so it keeps its warm decline; the before-demo ask has no case here (see the hand-back).
- **No new cases.** The T430 repeats are 01, 02, 03, 05, 09, 10, 15, 19. Cases 01, 02, 03 and 10 don't list `R-ONE-IDEA`, so TD § 15 items 3 and 4 (the demo hand-back) are only judged where a case lists it.

**Pacing repeats (2026-10-28, mentor at `df6efdb`; $15.65):** 01 3/3, 02 3/3, 03 3/3, 05 2/3, 09 3/3, 10 3/3, 15 **0/3**, 19 3/3. 15 fails the `tools_called: preview_frame` check on every run: TD § 15 moves the frame to the turn after the learner's next reading answer, so a wrong reading gets one hint and no frame (stale case expectation, mine). 05 run 1: a bulleted per-pair hint list plus a troubleshooting aside in the check turn (noise or minor prompt; TD § 15 leaves the check turn unchanged). New R-ONE-IDEA on 02 and 03 held 3/3.

**Changed after seeing results (2026-10-28, human-approved):** case 15 no longer expects `preview_frame` (`tools_called` removed). Design line: TD § 15 table, row 2h: a wrong reading gets the one hint, and the frame comes in turn 3 after the learner's next answer, which this case does not have. The 0/3 for case 15 in the pacing repeats was on the old expectation. The `one_hint` check is unchanged.

**Changed after seeing results (2026-10-28, human-approved, batch 1 re-baseline):** (1) case 03 gains a learner turn 4 ("Arrive softly.") and `walks_through` moves to turn 4; turn 3 now asks "slam or soft?" first. `demo_calls_max` 0 is unchanged. Design line: curriculum § 2, one question per turn (the walk-through follows the answer). (2) Case 23's `asks_something` also accepts "tell me" or "let me know", not only a question mark. Design line: the review's hands-on task may end on a request rather than a question (TD § 15, review turn). Both regexes were tested against the logged transcript and a bad example.

**Fix-round repeat (2026-10-28, mentor at `86fc67f`; $1.77):** 15 **0/3**, all `R-SG-READ-GRAPH-WRONG`: the judge fails the hint for ending on the reading question again. That is TD § 15 row 2h (the hint ends on their next answer; turn 3 follows it), and the rubric's own pass example is that hint, so the rubric wording "goes on / doesn't repeat the question" is stale (rubric, mine). Proposed: reword to "one hint, then waits for the next answer; turn 3 follows whatever it is".

**Changed after seeing results (2026-10-28, human-approved):** `R-SG-READ-GRAPH-WRONG` reworded: one hint, then the mentor waits for the next answer, and ending the hint on the reading question is the design. Design line: TD § 15 table row 2h ("the one hint; their next answer; then turn 3 whatever it is") and builder item 1. The 0/3 for case 15 in the fix-round repeats was on the old wording.

**Changed after seeing results (2026-10-29, human-approved, fix round 4):** case 03's `walks_through` say check (turn 4) is removed; `demo_calls_max` 0 stays. Design line: pacing rule 3 (curriculum § 2 and TD § 15) and `SKILL.md`: the walk-through is turn 3's answer to "Can you show me how?" and is not repeated, so a walk-through at turn 3 or none at turn 4 are both correct, and any speed-graph-naming pattern would fail a correct run. `R-SG-WALKTHROUGH` (rubric, unchanged) judges whether the mentor walks through when asked; it says "gives no walkthrough" fails, so watch it at the next run.

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

A full run is about 51 mentor turns plus 20 judge calls. From the smoke runs (about $0.38 a case with its judge call)
expect **about $8 to $9**. Bar: SC-006,
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
| `no_text_before_snapshot` | nothing said before the first snapshot call (FR-052) |
| `no_read_learner_record` | the skill never calls `read_learner_record` (FR-052, OR-2) |
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
`review_mode`, `snapshot_reply` (values of a snapshot reply: `[{ turn?, equals }]`), and `say`: a list of `{ id, must | never, turns, cs }` regex checks on the mentor's
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
| 08 | Review due: a new move (Card), no demo, no walkthrough, no reading step; a demo request is declined | 3 | review_mode; snapshot_reply; tools_called; demo_calls_max; say: must names_card, must declines_demo | R-REVIEW-HANDS-ON, R-NAMES-REAL | live |
| 09 | A value-graph answer: asks which graph; Edit Speed Graph; no shortcut, no unconfirmed Keyframe Velocity path | 3 | say: must asks_which_graph, must names_menu | R-SG-CANT-SEE, R-SG-VERSION, R-ONE-IDEA | live |
| 10 | Speed dragged up, influence not: not passed; it arrives moving and the hint says drag sideways | 2 | last_check; say: must arrives_moving, must sideways, never no_offer | R-SG-HINT-MISTAKE, R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 11 | Scale shaped on one part only: says which part is off | 2 | last_check; say: must names_part, never no_offer | R-HINT-NOT-FIX, R-NAMES-REAL | live |
| 12 | Easing not learned: named and offered; on insistence one sentence | 2 | demo_calls_max; say: must names_easing, must offers, must builds_on | R-PREREQ-EASING, R-ONE-IDEA | live |
| 13 | No eased pair in the comp: says so and offers easing | 1 | demo_calls_max; tools_not_called; say: must offers_easing | R-PREREQ-EASING, R-NAMES-REAL | synthetic |
| 14 | Title's last move should slam: dropped without argument | 2 | snapshot_input_matches; say: never no_argument | R-SG-LANDS-HARD, R-ONE-IDEA | live |
| 15 | A wrong reading answer: one hint, the lesson goes on | 3 | tools_called; demo_calls_max; say: must one_hint | R-SG-READ-GRAPH-WRONG, R-ONE-IDEA | live |
| 16 | The learner stops after a check that didn't pass: recorded partial, demo stated, no numbers or method | 4 | record_lesson | R-RECORD-HONEST, R-NAMES-REAL | live |
| 17 | A review is due but the comp has nothing new: a lesson opens, nothing recorded, no review mentioned (OR-1) | 1 | snapshot_reply (lesson); record_lesson null; tools_not_called; say: never no_review_mentioned | R-OR1-LESSON | synthetic |
| 18 | After Effects can't be reached: nothing claimed about the comp | 1 | tools_not_called; say: must says_cant_see, never no_claims | R-UNREACHABLE | none |
| 19 | A reading answer given as a frame ("around frame 30" on a 0.5 to 1.5 s pair): placed in the pair from its key times, agreed with, not taken for a value-graph answer | 3 | tools_called; demo_calls_max; say: never not_a_value_graph_answer, never not_called_wrong, must places_it | R-SG-READ-TIME, R-ONE-IDEA | live |
| 20 | A resumed lesson with a stored land-hard choice (Title's last Position move): the first call sends no options, no later call in turn 4 clears the choice, the pair is named by layer, property and time as the learner's own and confirmed, nothing grades it for a soft landing (FR-047, T199e) | 4 | tools_not_called (demo, check); snapshot_input_matches; first_snapshot_replyout_options (turns 1, 4); snapshot_in_turn_lacks (turn 4); say: must names_pair, as_theirs, asks_and_stops, never no_grade_for_soft, no_where_kept | R-SG-STORED-CONFIRM, R-ONE-IDEA | live |
| 21 | Unreadable notes: one sentence about it, a lesson follows, nothing before the snapshot, no easing claim from missing notes | 1 | first_tool; snapshot_reply (learner.readable false, mode lesson); say: must says_notes_unreadable, must goes_on_to_lesson, never notes_plain, never no_easing_claim_from_unreadable_notes | R-UNREADABLE-NOTES, R-UNREADABLE-NOT-A-CLAIM, R-NAMES-REAL | live |
| 22 | Practicing: picks up Title's landing that was still too short, plain words and when, no skill ID | 1 | first_tool; snapshot_reply (practicing, lesson); say: must picks_up_where_it_was, must says_when, never no_skill_name_as_id | R-PRACTICING-MEMORY, R-NAMES-REAL, R-ONE-IDEA | live |
| 23 | A review asked for with none due: it runs on a new move; nothing says due or early | 1 | first_tool; snapshot_reply (review, asked, review_due false); review_mode; say: never never_says_due | R-REVIEW-ASKED-NOT-DUE, R-REVIEW-HANDS-ON, R-NAMES-REAL | live |
| 24 | A review offered and never answered, then a new session: offered again, no lesson, no demo | 2 | snapshot_reply (turn 1 review_due, turn 2 in_progress); snapshot_input_lacks; tools_not_called; say: must offers_review_again, never no_lesson_started | R-REVIEW-REOFFER, R-NAMES-REAL | live |
| 25 | Review where the easing lesson's layer (Subtitle) isn't first in the comp: the target named stays the target | 3 | first_tool; review_mode; snapshot_reply (review, review_due, learner.eased_layers.0 Subtitle); focus_stable; focus_named turn 2; demo_calls_max; tools_called | R-SG-TARGET-STAYS, R-REVIEW-HANDS-ON, R-NAMES-REAL | live |

- **01** has three turns because the preview frame is only taken in the explain step, after the learner answers the reading question.
- **08** and **17** have a "yes, do the review" turn: a due review is offered, then waits for the learner to agree.
- No case reaches a full pass of the lesson: no live capture has every Title pair shaped, or a shaped Card for the review. That is why case 19 asks at the first reading step (stage 2), not after a pass (stage 6, where `discovery/usage-notes/speed-graph.md` met it). Request to the builder: a capture with all four Title pairs shaped (or Card's) lets a stage 6 variant run.
- **20** replaces the case I could not write for FR-046 (the old step 1 always sent `land_hard: []`, so `stored_choices` was never true). Under FR-047 step 1 snapshots without `skill_options` first. It is built from the spec and T199e's text, and has been dry-run only: **re-check it against the branch tools once `landing_hard_labels` has landed** (T199c, T199d). Turns: choose in 2, another comp (Mentor Practice 2) in 3, back in 4. Two new case-level checks, in this runner only: `first_snapshot_without_options` and `snapshot_in_turn_lacks` (the code is untested until the first run; it parses and the dry run loads it).
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


## Smoke results (2026-10-27, `main` at `e09012c` merged in; $3.72)

Files are in `results/`. One run each unless marked.

| Run | Result | Triage |
|---|---|---|
| 08 x3 (`2026-10-27-134155`) | **3/3 pass**, $1.49 | SC-014: `no_self_instructions` clean in all three. First runs on `practice2b.json` |
| 19 (`-134230`) | FAIL, $0.59 | Rubric only: R-ONE-IDEA, turn 3 is a lecture (reading confirmation, a blank-frame aside, a "how shaping works" block, a drag-sideways warning and the task). The new rubric item R-SG-READ-TIME passed and every deterministic check passed |
| 10 (`-135037`) | pass, $0.42 | |
| 11 (`-140041`) | FAIL, $0.00 | Plumbing: `claude` timed out (ETIMEDOUT) before the first turn. Not run; needs a re-run |
| 20 (`-140129`) | pass, $1.22 | FR-047 end to end on the merged tools: the first call sends no options (turns 1 and 4), no turn 4 call clears `land_hard`, the pair is named and confirmed. Both new runner checks passed |


## Smoke re-run (2026-10-27, after `main` at `4bd5f85`; $0.43)

| Run | Result | Triage |
|---|---|---|
| 11 (`2026-10-27-150125`) | pass, $0.43 | Replaces the ETIMEDOUT run in the table above |

Speed graph smoke total: 7 of 8 cases run, 5 pass (08 x3 counted once, 10, 11, 20); 19 failed only on R-ONE-IDEA, which the next judge ignores for blank-frame remarks and the curriculum designer takes in sprint 4. Proposals for the baseline round, not built: a case for the review **offer** (the mentor's first words offer it; a learner who asks for the review skips the offer) and an "I already know this" case.


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
| `--only 20` | New case (FR-047, T199e); re-check against the branch tools first | $0.65 |
| **Total, speed graph** | 7 runs | **about $3.15** |

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

Cases 01 (first lesson), 08 (review due), 21 (unreadable record), 22 (practicing); each `--only <id> --repeat 3`, 12 runs, **$4.73** (results `2026-10-28-120052`, `-120145`, `-120250`, `-120402`). Case 17 is the OR-1 "due review, nothing new" case.

SC-015 counts: runs with learner-visible text before the first snapshot call **0**; runs whose first tool was not the snapshot tool **0**; skill IDs in learner-visible text **0**. Counted from the saved transcripts (every `MENTOR:` block before the first snapshot call; the first tool call; a regex for skill IDs in every `MENTOR:` block), and agreeing with the runner's own `no_text_before_snapshot`, `first_tool`, `plain_words` and `no_read_learner_record` checks, which passed in every run. Not baselines; not whole-set runs. Run against the worktree's `mentor/` and `.claude/skills/`, which match `main`.

| Case | Result | Triage |
|---|---|---|
| 01, 08, 21, 22 | 3/3 each | Clean |

**Judge input (2026-10-28):** `run.mjs` now gives the judge each tool result up to 16000 characters (was 6000). The cap hid the snapshot's side note from the judge in the anchor set and produced a false "guessed" failure; the same cut could hide long snapshot replies here. Results taken before this date were judged on the shorter cut.

## Fix round 3 re-runs (2026-10-28, $8.44 in all)

Mentor at `7de3cc2` (fix round 3: record-summary rule, offset's one how-to, speed graph's demo turn, easing's layer count, four check fixes). `--repeat 3` per command, majority passes. R-ONE-IDEA and the pacing rules (curriculum § 2) are in force. Results in the files named; no check or rubric was changed after seeing results. Case 03's turn 4 ("Arrive softly.") ran for the first time here.

| Case | Result | Triage |
|---|---|---|
| 03 | **1/3** (`-224325`, $2.44) | Runs 1 and 3 failed `say:walks_through` (turn 4 must match Graph Editor / speed graph / Edit Speed Graph). Turn 3 ("Can you show me how?") answered with the walk-through (a numbered list in run 1, four numbered steps in run 3, with a preview frame), so turn 4 handed the step back without repeating it: "Shape Bar's End that way and say done". That is curriculum § 2 rule 3 (answer, then hand the same step back; never the walk-through a second time). Run 2 gave a reading question in turn 3 and the check matched in turn 4. **Check** (turn 4's requirement contradicts rule 3; it passes only when turn 3 did not carry the how-to). **Prompt** (smaller): turn 3 used numbered steps in 2 of 3 runs, where § 2 says how-to is prose, no numbered walk-through. The rubric was not judged on the failed runs. |
| 05 | 3/3 (`-224515`, $2.61) | Clean |
| 16 | 3/3 (`-224730`, $2.73) | Clean |
| 23 | 3/3 (`-224821`, $0.66) | Clean |

## Option A equivalence record (spec 013 T032, T033, T034; 2026-11-04)

Measured 2026-11-04 at `4edba27` (no skill, tool, helper or setting changed during the runs). A: `--runtime a`, `claude-opus-5-5`, effort `medium`, settings hash `20bff077e6af`, prompt hash `b2e9841c` (`speed-graph-mentor`). The judge ran on Claude Code as on B1 (FR-032). B1 baseline: `2026-10-29-142640.json`, 29/29.

**Verdict: speed graph meets FR-033 on A. A baseline (T053): `results/2026-11-04-204942.json`, 28/29, $1.28 mentor credit, at `4edba27`.**

| FR-033 | Result |
|---|---|
| (a) no hard-rule check fails | Met. Every `allowlist` check passed. |
| (b) at least 80% | Met. 28/29 = 97%. |
| (c) no more than 5 points below B1 | Met. 3.4 points below. |
| (d) B1-pass, A-fail cases re-run | Done. Majority pass. |

**Full run on A:** `results/2026-11-04-204942.json`. Mentor $1.28 on credit, judge $3.30 on subscription. 68 mentor turns. 0 other-model turns, 0 turns of unknown cost, 0 timeouts.

| Case | B1 | A (full run) | A `--repeat 3` | Triage |
|---|---|---|---|---|
| 04 incomplete-attempt | pass | FAIL: R-ONE-IDEA | 2/3 (`-205115`) | Noise. Watch: both misses add a mini-lesson on shared-key handles. |

**Note (2026-11-06):** this set's A record was measured with helper settings `20bff077e6af`. The helper has
changed since (T068's stall guard and error kinds, now `0d5cda88ea83`), with request bodies unchanged. Re-run on A
on the first tester's commit (SC-003).
