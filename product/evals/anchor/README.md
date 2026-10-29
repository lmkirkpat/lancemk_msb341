# Anchor (set the pivot) evals

The eval set for `/anchor-mentor` (skill 5, `transform.anchor`, spec 011). It scores whether the mentor *teaches*
well, not only whether it is correct: it asks before it names a place, never gives a number to type or a tolerance, never says the pivot shows in a frame, never calls a matte hidden, answers Quick Set Anchor plainly, says plainly what it can't check, and runs a review with no tool named before "done". It runs the real skill and server in headless
Claude Code against saved snapshots, so **After Effects doesn't need to be open**. Whether the
measures are *correct* is covered by the unit tests (`cd mentor && npm test`); evals don't repeat them.

Built from the skill 6 set (`product/evals/null-parenting/`), itself copied from easing's runner. Same
options and results format; everything skill-specific is in the `CONFIG` block at the top of `run.mjs`.

## Status (2026-10-27, evening): updated for the opening read (T413, T414); ready for SC-015's repeats and the re-baseline

The set now has 46 case files (44 + 40 and 41; case 17 renamed). Changes and smoke results are in "Opening read changes"
at the end. The score below is the baseline **before** those changes (27/44, 61%, SC-006 not met); it is not the
current state.

### Earlier status: baseline taken, 27/44 (61%), SC-006 not met

The set runs on the live captures of Mentor Practice 2 (comp 179, `mentor/test/fixtures/anchor/`,
`practice2b.json` the base) plus a few synthetic fixtures. 44 case files (spec cases 1 to 37, the cockpit's 38 and 39,
and the cases from the first set numbered 25 to 31); 21, 23 and 24 have variants (a, b, c). **First baseline, 2026-10-27, on
skill 5 as merged (`f6effae`) plus `main` at `d48b31e`: 27 of 44 (61%), $26.70.** SC-006 needs 80% and every
hard-rule check passing; it fails on both, almost wholly because of one real hard-rule break (text said before the first
snapshot). See "Baseline (2026-10-27)" at the end.

## Running

```sh
node product/evals/anchor/run.mjs --dry-run                   # free: cases, fixtures, labels, tells
node product/evals/anchor/run.mjs --dry-run --strict-sources  # also fails on a stale fixture label
node product/evals/anchor/run.mjs                             # full run: every case once
node product/evals/anchor/run.mjs --only 04                   # one case, by id prefix
node product/evals/anchor/run.mjs --changed                   # skip cases unchanged since their last pass
node product/evals/anchor/run.mjs --repeat 3                  # each case 3 times; passes on a majority
node product/evals/anchor/run.mjs --judge-always             # judge even after a failed check
```

A full run is about 109 mentor turns plus up to 44 judge calls. The 2026-10-27 baseline cost **$26.70**.
**`--only` is a prefix match:** `--only 24` also runs 24b and 24c (three cases, about $1.4 a repeat). Bar: SC-006,
at least 80% passing, and every hard-rule check passing; spec 011's SC-004 (no numbers) and SC-005 (Quick Set Anchor) are covered by the universal number check and case 08.

## What every case checks (no `expect` key needed)

| Check | Rule it enforces |
|---|---|
| `plain_words` | no underscore or dot name, no id, no quoted value from tool output |
| `no_narration` | no announced calls or rules |
| `no_shortcuts` | no keyboard shortcut (the skill quotes none until its live check logs it) |
| `no_test_tell` | never "synthetic", "fixture", "stand-in" |
| `only_mentor_tools` | no After Effects tool during a lesson |
| `no_read_learner_record` | `read_learner_record` is never called (FR-052, OR-2); it is also out of the runner's `--allowedTools` |
| `no_text_before_snapshot` | nothing is said before the first `anchor_snapshot` call |
| `demo_at_most_once` | at most one demo call |
| `record_plain` | the record's summary holds no method, motive or number |
| `no_number_or_tolerance`, `no_place_codes`, `no_pivot_in_frame`, `no_self_instructions`, `matte_not_hidden` | skill-specific (see `CONFIG.universal` in `run.mjs`) |
| **When a case runs a review** | |
| `review_no_demo` | no demo in a review |
| `review_method_before_pass` | /Pan Behind|\bpress Y\b|\bshortcut\b|\bcrosshair\b|\bdrag the\b/ is never said before a pass |

## Case-level `expect` keys

`first_tool`, `tools_called`, `tools_not_called`, `snapshot_with` (a snapshot call with these inputs),
`snapshot_input_matches` (regexes over a snapshot call's input), `snapshot_calls_max`,
`demo_calls_min` / `demo_calls_max` (attempts), `demo_only_on`, `demo_not_in_turns` (1-based turns in which `anchor_demo` must not be called; added 2026-10-28 for 23c's asking turn), `last_check` (`passed`, `has` and `lacks`:
substrings of the check's reply, `input`), `record_lesson` (`null` for "nothing recorded"),
`review_mode` (the first snapshot reply's `mode` is review, or a call asked for one), `first_snapshot_mode` (the first snapshot reply's `mode` is `lesson` or `review`), and `say`: a list of `{ id, must | never, turns, cs }` regex checks on the mentor's
words (1-based `turns`, default all; case-insensitive unless `cs`).

## Cases

Numbers are the spec's Eval plan; cases 25 to 31 are kept from the first set (not in the Eval plan). Turns is
the number of mentor turns. Fixtures: `live` (a capture) or `synthetic` (derived, see below).

| # | Case | Turns | Fixtures | Rubric |
|---|---|---|---|---|
| 01 | First lesson, one turn (TD 19): the intent question, then Door as a one-sentence fallback with a hinge, ending on the choice; **no** leave-out, idea statement or other-skill recap in turn 1 | 1 | live | R-AN-INTENT-FIRST, R-AN-PROPOSAL-HINGE, R-ONE-IDEA |
| 02 | Layer named: place repeated, the two sentences once, a frame, no 'you can see the pivot' | 2 | live | R-AN-REPEAT-BACK |
| 03 | Anchor Point typed: the 'moved with it' hint with a direction | 3 | live | R-AN-MOVED-WITH-PIVOT |
| 04 | Banner one place off (bottom-left): the hint names the place | 3 | live | R-AN-NEIGHBOUR |
| 05 | Pan Behind on a Scale 200% layer (Plaque) passes | 3 | live | R-AN-PASS |
| 06 | Pan Behind started on Background instead of Needle: start the drag on Needle's own crosshair; "select it first" never the fix (L-3) | 3 | live | R-AN-WRONG-LAYER |
| 07 | Pop set while shrunk: rest key named first; the hint says the pivot did move, Edit > Undo, then 4.3 s (L-4) | 3 | live | R-AN-REST-KEY |
| 08 | Quick Set Anchor asked about: answered plainly, no steps, Pan Behind goes on | 2 | live | R-AN-QUICK-SET |
| 09 | A matte named as the target: never hidden; its eye | 2 | live | R-AN-MATTE |
| 10 | Text, 'turn from the middle': the pivot is on the baseline | 2 | live | R-AN-BASELINE |
| 11 | One focus layer: no demo, a walk-through, and one offer of a watch on Needle as the **last sentence** of the invite turn, never twice (round 3) | 3 | live | R-AN-WATCH-OFFER, R-AN-WALKTHROUGH |
| 12 | After a pass: which part stays still; a wrong answer gets one light correction; recorded passed | 5 | live | R-AN-UNDERSTANDING, R-RECORD-HONEST |
| 13 | Sled named (three Position key times; leave-out checked on the naming turn, none in turn 1): "already moves" once, its other keys, set the pivot before you key, another layer offered; no check or demo; never "jump" (round 2) | 2 | live | R-AN-ALREADY-MOVES |
| 14 | The layer was dragged, not the pivot: no fix, no offer | 3 | live | R-AN-DRAGGED |
| 15 | 'Just do it for me' (pacing, 2026-10-28): declined in one or two sentences, the same A and Shift+P ask again, no offer to do it later; the watch offer made once in turns 2 to 4 (an extra turn, 'Both numbers are showing', reaches the invite turn), never twice | 5 | live | R-DECLINES-WARMLY, R-ONE-IDEA, R-AN-WATCH-OFFER |
| 16 | Review due: Tab, hinge asked first, **nothing said before the first call**, no tool named before 'done', no demo, no watch offer | 3 | live | R-REVIEW-HANDS-ON, R-AN-NO-WATCH-OFFER |
| 17 | Review with no new candidate (record lists every default layer): says nothing new, records nothing, no demo | 1 | live + synthetic record | R-REVIEW-NOTHING-NEW |
| 18 | A layer that can't be checked (no rectangle): says so, never claims it didn't move | 3 | synthetic | R-AN-CANT-CHECK |
| 19 | Lid named, pivot outside (round 1): the side and 'click Lid in the timeline' in the what-the-pivot-is turn, 'start there' on the crosshair in the move turn (a third turn, 'Lid is selected and both show', added 2026-10-28, FR-019a); no distance | 3 | live | R-AN-OUTSIDE, R-NAMES-REAL, R-ONE-IDEA |
| 20 | `lid-group` as the attempt (round 1): Lid's own pivot unchanged, the Contents possibility, **not** the expression line too, never claims they moved the group | 3 | live | R-AN-GROUP-PIVOT |
| 21a | Menu command asked for with a left-edge place: no Center Anchor Point, Pan Behind goes on (L-3) | 3 | live | R-AN-CENTER-MENU |
| 21b | Same question with the center as the place: the menu path by name, never a key combination | 3 | live | R-AN-CENTER-MENU |
| 22 | One Position key, dragged with the playhead off it (round 2): slid hint with the key's time, Edit > Undo, playhead on the key; never "jump" | 3 | live | R-AN-SLID |
| 23a | Watch offer, "no, I'll just try" then a failed check: one offer, none after, no demo | 3 | live | R-AN-WATCH-OFFER |
| 23b | Watch offer, this skill passed before (record): no offer at all | 2 | live + synthetic record | R-AN-NO-WATCH-OFFER |
| 23c | Watch offer, yes (pacing, 2026-10-28): two focus entries (Door, then Needle at the bottom edge), A and Shift+P asked in turn 3 with **no demo in that turn** (`demo_not_in_turns`), the demo in turn 4 on Needle only, Door handed back with no second walk-through | 4 | live | R-AN-WATCH-YES, R-AN-DEMO, R-DEMO-PLAIN, R-NAMES-REAL, R-ONE-IDEA |
| 24 | A one-key layer named, rest key on another frame (round 4): the two-frames sentence once with the labels exactly ("3.7 s", "4.2 s"), "set the pivot before you key", another layer offered; no check or demo; never "other keys" or "jump" | 2 | synthetic | R-AN-TWO-FRAMES |
| 24b | Same, but the learner names their own rest pose (4.167 s) while the tool's rest key is on the Position key: the sentence uses their time, written "4.2 s" (never 4.167), and passes `rest_time` | 2 | synthetic | R-AN-TWO-FRAMES |
| 24c | No layer named: turn 1 holds no leave-out sentence at all (not only the two-frames one); Door proposed in turn 1 | 2 | synthetic | R-AN-INTENT-FIRST |
| 25 | A matte's eye left on after a pass: the eye sentence | 3 | live + synthetic | R-AN-MATTE-EYE |
| 26 | Two focus layers (Door, Tab): A and Shift+P, one demo on Tab, frames at the same time, Edit > Undo | 4 | live | R-AN-DEMO, R-DEMO-PLAIN |
| 27 | Anchor Point's stopwatch on | 3 | live | R-AN-STOPWATCH |
| 28 | Door locked | 3 | live | R-AN-LOCKED |
| 29 | 'What numbers do I type?': no number, no tolerance | 3 | live | R-AN-NO-NUMBER |
| 30 | Stops early after a failed try: recorded partial, plain words | 4 | live | R-RECORD-HONEST |
| 31 | After Effects can't be reached: nothing claimed | 1 | none | R-UNREACHABLE |
| 32 | Practicing, `next` names Pop: turn 1 proposes the snapshot's own proposal (compared to this run's snapshot output), not Pop; one memory clause; ends on the choice | 1 | live + synthetic record | R-AN-PRACTICING-PROPOSAL, R-ONE-IDEA |
| 33 | The learner names CTRL (a null, on a Mentor Practice read, `layer-info/practice-r1.json`): the TD 19a sentence once, then the snapshot's proposal (Cursor); no null lesson, null's pivot or parenting | 2 | live | R-AN-NAMED-NULL |
| 34 | A lesson left open on Needle, reopened in a **new Claude session**: where it left off in a sentence; no intent question, proposal or Door | 2 | live | R-AN-CONTINUED |
| 35 | A lesson left open before a layer was chosen, reopened in a new session: opens as a first lesson (Door, intent question), no "left off", no leave-out | 2 | live | R-AN-INTENT-FIRST |
| 36 | "Which layers can I use?": at most three layers named, all `default` candidates in this run's snapshot, none that already moves; ends on the choice | 2 | live | R-AN-WHICH-LAYERS, R-ONE-IDEA |
| 37 | A one-key layer whose Position key and rest key are one frame apart (synthetic): both labels, "3.67 s" and "3.7 s" | 2 | synthetic | R-AN-TWO-FRAMES |
| 38 | A comp with only a background (a full-frame layer): no layer proposed, the new-solid line instead; the background never offered, no place on it, no demo | 1 | synthetic | R-AN-NO-CANDIDATE, R-NAMES-REAL |
| 39 | A layer named with no place given (Needle, whose own hinge is the bottom middle): the mentor asks where it should turn from, picks none, no snapshot call carries a place, no demo or check | 2 | live | R-AN-ASKS-PLACE, R-NAMES-REAL |

Dropped from the first set: the Sled-slid case (old 15). Since D-4 no lesson can reach Sled with three keys
(`sled-slid` is a unit-test fixture), so cases 13 and 22 replace it.

- **Synthetic fixtures** are built from live files by `fixtures/build.mjs` (run it to regenerate them; the
  output is committed): `sled-one-key-rest-away.json` and `sled-one-key-rest-on-key.json` (24, 24b, 24c: the live
  `sled-one-key-before.json` with Scale or Rotation keys written onto Sled), `door-pass-matte-eye-on.json`
  (25: the live `door-pass.json` with the one field `matte-eye-on.json` changes), and two records
  (`every-layer-done.json` for 17, `anchor-passed-not-due.json` for 23b). Mentor Practice 2 has no one-key
  layer, so 24 has no live evidence yet (spec 011 round 4). `synthetic/edge-before.json` and `row27-no-rect.json`
  (18) are the builder's. `background-only.json` (38) is the live `practice2b.json` cut down to its Background layer.
- **`no_text_before_snapshot`** (every case): nothing said between the first tool call and the first
  `anchor_snapshot`. It is the smoke finding of a leaked self-note ("Review is due. Run the review.",
  "First lesson on this skill."). `no_self_instructions` also looks for the known review phrasings.
- **`new_session`** on a turn starts a fresh Claude session on the same learner home, so `session.json` is all
  the mentor has (cases 34, 35). **`proposal_named`** and **`named_layers`** compare a turn to this run's own
  snapshot output (cases 32, 36).
- **`no_opposite_directions`** (every case) is the smoke finding of the demo reading "opposite directions".
- **`at_most`** in a `say` check counts matches ("the offer is made once").
- **Wording drift.** The two-frames sentence is said verbatim in TD section 18; the model sometimes
  paraphrases ("before you add keys", "two times"). Case 24b accepts a few variants of "before you key", 24 does not.
- **Watch offers** are detected with `ANY_OFFER` ("I could / I can / want me to ... show or watch") in 16, 17, 23b
  and 26, and with `Needle` next to "show" or "watch" in 11, 23a.

## The fixture tell

Synthetic fixtures carry the project name `Synthetic.aep`, comp names that start with "Synthetic" and a
`synthetic` note. The runner never hands the mentor the builder's file. For each run it writes a
scrubbed copy named `comp-N.json` into a neutral temp folder: the note is removed, the project becomes
`Studio Reel.aep`, "Synthetic" in a comp name becomes "Studio", and a fixture that still says
"synthetic" or "stand-in" anywhere is refused. `--dry-run` runs the same scrub.

## Fixtures

Fixtures are **not copied** here, except the synthetic ones above. A case names a fixture by the file
name the builder's tests use, and the runner resolves it in `CONFIG.fixtureDirs` order
(`mentor/test/fixtures/anchor`, `.../layer-info`, `.../anchor/synthetic`, then `product/evals/anchor/fixtures`).
Each case carries a `fixture_sources` label (`live` or `synthetic`) per fixture; `--dry-run` prints where each
resolves and `--strict-sources` fails on a stale label. Records are paths from the repo root.

After a re-capture, `--dry-run` shows what changed; then run the affected cases once with `--only` and read
the facts the checks assume: Door at the middle of its left edge and the review's Tab (the proposal),
Needle (the watch offer, `bottom-middle`), Pop's rest key at 4.3 s and its 3.3 s try, Lid's side (below),
Sled's key time (3.667 s) and the target ids `anchor/15` (Needle) and `anchor/19` (Tab). A changed fact
is a case edit, not a skill bug. The preview frame comes back as a blank placeholder in every run (no
`frame.png`); the rubric tells the judge to ignore it.

## Smoke run 1 (2026-10-26, stand-in fixtures, history only)

The first set's cases (old numbering) on the stand-ins; kept for the findings, which the rows below on live captures follow up.

Six runs, total $3.68 (over the $3.50 cap by $0.18: the last repeat was started before the total was added up). Cases 01, 07, 12, 14 and 18:

| Run | Case | Result | Triage |
|---|---|---|---|
| 1 | 01 | pass ($0.37) | |
| 2 | 12 | FAIL ($0.82) | **Real, judge-only.** R-DEMO-PLAIN: the mentor said Anchor Point and Position "changed by the same amount in opposite directions"; the demo's reply shows both going down by the same amount. A small embellishment past what the skill says ("Both numbers changed, and Tab didn't move") |
| 3 | 18 | FAIL ($0.48) | My case bug: after a review pass the mentor asks the understanding question and records later, not at once. **Also a real finding:** the mentor's first words were "Learned, review due -> review mode." |
| 4 | 18 | FAIL ($0.68) | **Real.** With the new universal `no_self_instructions` check: the mentor said "Run review" before its first tool call (the same leaked step as the offset set's case 17) |
| 5 | 07 | pass ($0.62) | |
| 6 | 14 | FAIL ($0.71) | My case bug: the mentor goes on to the ungraded try-it step and records after that. Added a fifth turn (not re-run) |

## Smoke run 2 (2026-10-26, live captures, HO-1): changed and added cases, one repeat each

Capped at about $4; total **$4.02** from the runner (nine runs; the cap was passed by $0.02 on the last).
Only five of the 36 cases ran; the other cases are dry-run clean and were not run. Every run is listed.

| Run | Case | Result | Triage |
|---|---|---|---|
| 1 | 24 | FAIL ($0.35) | **My case bug.** `snapshot_input_matches: Sled` expected a focus call; the mentor read `moves_case` from the opening candidates and answered correctly without one. Removed |
| 2 | 24 | pass ($0.45) | After the fix |
| 3 | 24b | FAIL ($0.37) | **My case bug, partly wording.** The mentor wrote the learner's own "3.667 s" and "4.167 s" (my regex wanted 3.7 and 4.2) and "before you add keys" (not "before you key"). The regex now takes both forms |
| 4 | 24c | pass ($0.44) | |
| 5 | 24b | FAIL ($0.37) | Same time-format cause (an unedited re-run: my fix to the generator failed and I ran it before noticing). Not a skill failure |
| 6 | 24b | FAIL ($0.37) | **My case bug.** `no_other_keys` fired on the opening, where the mentor said Card and Pause (three or more Position keys) "would shift where they sit at their other keys", which is true of them. The check now covers turn 2 only (24c: only about Sled) |
| 7 | 24b | pass ($0.48) | The learner's time reached the tool (`rest_time` 4.167) and the sentence came back as 3.7 s and 4.2 s |
| 8 | 13 | FAIL ($0.45) | **Rubric, real, not about Sled.** R-ONE-IDEA: turn 1 packs the memory recap, the pivot idea, the intent question, a proposal and a three-bullet list. All deterministic checks passed. R-ONE-IDEA removed from 13 and 24 (one reason per case); not re-run |
| 9 | 11 | pass ($0.74) | One offer, last sentence of the invite turn, on Needle; no demo; a walk-through on turn 3 |

Not run: 23a, 23b, 23c, 22, 19, 20, 21a, 21b, 17, 16 (with `quiet_before_tool`), 06, 07, 25, 26 and the rest. Their
checks are dry-run validated only.

## Smoke run 3 (2026-10-26, rounds 5 and 6): one repeat each, $6.02

Cap about $7. Cases 1, 13, 24b (the unconfirmed re-runs), 32 to 37, and 16 and 26 for the known findings.
Before this run `SKILL.md` had changed (one-ask opening, no leave-outs in turn 1, labels). Every run listed.

| Case | Result | Cost | Triage |
|---|---|---|---|
| 01 | pass | $0.29 | One turn; the opening is the question plus the Door fallback. Transcript has a leaked "First lesson on this skill." (see finding 1) that no check caught yet |
| 13 | pass | $0.44 | R-ONE-IDEA is not on this case (one reason per case); its earlier fail was the crowded opening, now fixed by TD 19 |
| 24b | pass | $0.49 | Labels exact: "3.7 s" and "4.2 s" |
| 32 | pass | $0.28 | Proposal is Door, Pop only in the memory clause |
| 33 | pass | $0.41 | |
| 34 | pass | $0.51 | New-session continued lesson works |
| 35 | pass | $0.33 | |
| 36 | pass | $0.44 | |
| 37 | pass | $0.45 | |
| 16 | FAIL | $0.62 | **Hard rule, real:** "Review is due. Run the review." said between `read_learner_record` and `anchor_snapshot` (known finding, still there). And **my regex bug:** `no_watch_offer` matched "I won't show you first" (a decline). Regex now needs an offer shape |
| 26 | FAIL | $0.89 | **My regex bug:** "If you want to watch the numbers change" is the walk-through, not an offer. The other checks passed; the transcript also leaks "First lesson on this skill." |
| 16 (repeat, judged) | pass | $0.87 | After the regex fix; no leak in this sample |

Findings: (1) **7 of the 11 transcripts say a self-note between `read_learner_record` and `anchor_snapshot`**
("First lesson on this skill." or "Review is due. Run the review."). It breaks the hard rule that the learner sees
every word. The new universal `no_text_before_snapshot` check catches it; **those seven would fail it today**, so a
baseline needs the fix first. Smallest skill fix: step 0 and step 1, one sentence: "Make `read_learner_record`
and `anchor_snapshot` back to back and say nothing until the snapshot has come back." Not run since the check was
added (budget). (2) The demo, the pivot idea and the two-sentence lines in 26's turn 2 are as designed.

## Smoke run 4 (2026-10-26, after B-13, `skill-5-anchor` 7741b29): $4.23

`no_text_before_snapshot` on. One repeat each, except 26 (re-run once after a judge plumbing failure).

| Case | Result | Cost | Text before the first snapshot? |
|---|---|---|---|
| 01 | pass | $0.27 | none |
| 16 | FAIL | $0.62 | **yes**: "Learned and review due → review." (the review's self-note, a changed wording of the old one). Hard rule, real |
| 26 | FAIL | $1.04 | none. Plumbing: the judge's reply was not valid JSON; not a mentor failure (the regex fix itself held: no false offer) |
| 26 (repeat) | pass | $1.03 | none |
| 35 | pass | $0.33 | none |
| 13 | pass | $0.44 | none |
| 24b | pass | $0.50 | none |

The first-lesson leak is gone in all five first-lesson runs. The review path still leaks once in one run (16);
`no_self_instructions` did not match this wording ("Learned and review due → review."), `no_text_before_snapshot` did.
Smallest skill fix: the same sentence in The review (step 0's "run The review below"): say nothing between
`read_learner_record` and the review snapshot.

## To do (older; see "Opening read changes" for the current list)

- Cases 38 and 39 were built on 2026-10-27 (the two bullets that were here). Case 39 covers the naming turn only;
  the demo-at-the-place-given rule (SKILL.md step 5) has no case of its own yet.
- After the fixes in the baseline's proposals: re-run `--changed`, then the failing cases with `--repeat 3`.

## Reading results

Same order as easing: a failed `run` check is plumbing; a failed deterministic check is a hard-rule
break; a failed rubric item is teaching quality. Re-run a flipping case with `--repeat 3` before
changing `SKILL.md`. Rubric items are in `rubric.md`.

## Baseline (2026-10-27)

Run on `evals-skill-5` after the merge of `main` (`d48b31e`; skill 5 at `f6effae`). Results file:
`results/2026-10-27-152657.json` (the full run). Cases 38 and 39 were smoked first
(`2026-10-27-150723.json`, `2026-10-27-150742.json`).

**Score: 27 of 44 (61%), $26.70.** SC-006 (at least 80%, every hard-rule check passing) is **not met**, on both
counts. The universal `no_text_before_snapshot` check failed in 11 cases (9 first lesson, 2 review) and is the real
cause of 11 of the 17 failures. Cases 16 and 17 are the known review leak (a planned shared tool change). The other 9
leaks are the **first-lesson** self-note ("First lesson on this skill." / "First lesson on transform.anchor."): the
README's earlier note said it was gone after B-13, and in the five first-lesson runs of smoke run 4 it was; here it is
back in about 9 of 30 first-lesson runs. Without the leak (and case 18's regex bug, fixed below) the same run would
be about 38 of 44 (86%).

| Case | Failed check | Call | Real or noise | Smallest fix |
|---|---|---|---|---|
| 01, 02, 05, 20, 21b, 24 | `no_text_before_snapshot`: "First lesson on this skill." | **Hard rule** | Real, intermittent. Repeats: 01 2 of 3 passed, 24 1 of 3, 24c 2 of 3, 39 2 of 3 (24b and 38: no leak in 3). Also seen in smoke on 38 and 39 | Same change as 16: have the snapshot tool read the record and pick the mode, so the mentor makes one call with nothing to narrate (shared code, spec item first). Prompt-only stopgap: none that has held |
| 09, 15 | `plain_words` ("transform.anchor") plus `no_text_before_snapshot` | **Hard rule**, one cause | Real. The same self-note, this time with the skill's internal id, so it breaks two checks | Same as above |
| 16 | `no_text_before_snapshot`: "Review is due." (baseline); "Review is due → review mode" and "Learned and review due → review." (repeats) | **Hard rule** | Real, known. Repeat x3: run 1 plumbing (`claude ETIMEDOUT`, not a mentor result), runs 2 and 3 both leaked, so 3 of 3 completed runs. Run 2 also failed turn 2's `review|yours|your own` check, a follow-on | The shared tool change above. **This case alone breaks the "every hard-rule check" half of SC-006**, and so do the first-lesson leaks |
| 17 | `no_self_instructions` ("Review is due → review mode") plus `no_text_before_snapshot` | **Hard rule**, one cause | Real, same as 16 | Same |
| 18 | `no_text_before_snapshot` plus `say:no_false_claim` ("stayed put") | Leak: hard rule. `no_false_claim`: **my regex bug** | The mentor said "I can't tell ... whether Door stayed put", a hedge, which the regex took as a claim | Regex fixed (a lookbehind for "whether", "if", "can't tell"); checked on sample sentences, not re-run. The leak is real |
| 21a | `say:no_menu_path`: turn 3 said "Layer > Transform > Center Anchor Point in Layer Content" | **Hard rule**, arguably | Real by SKILL.md's letter ("never for any other place"); the mentor did say it only reaches the center and sent the learner to Pan Behind. One sample, not repeated | If the cockpit reads that as allowed (the learner asked about the command), loosen 21a to "never recommends it for a left edge"; else one line in SKILL.md: when asked, say there is a center command and name the path only when the place is the center |
| 30 | `record_plain`: the record says "because" | **Hard rule** | Real, one sample: "Door slid to the right with it because only Anchor Point changed" (a reason in the record) | Rubric-level: SKILL.md's `record_lesson` line already bans motive; add "no because" to the example summary, or make the tool refuse it |
| 04 | R-AN-NEIGHBOUR, R-HINT-NOT-FIX | Rubric | Probably real, one sample: the hint named both places correctly, then gave the fix ("Drag the crosshair up along that left end until it's halfway ...") | Not repeated. If it repeats: SKILL.md's hint wording for a neighbour place says what is off and where, no drag steps |
| 19 | R-ONE-IDEA | Rubric | Noisy-looking: turn 2 packs repeat-back, outside pivot, the two sentences, a walkthrough and the watch offer | Repeat first; the fix, if real, is to drop the walkthrough from the outside-pivot turn |
| 26 | R-AN-DEMO | Rubric | Real wording, small: "Position moved to make up for it" explains how the numbers changed (the same family as the old "opposite directions") | Add "make up for it" to `no_opposite_directions`, and a SKILL.md line: say both numbers changed, nothing more |
| 29 | R-ONE-IDEA | Rubric | One sample: an unrequested second idea about typing into Anchor Point alone | Repeat first |

Nothing in the plumbing: no `run` check failed except one `ETIMEDOUT` on a repeat of 16, and the judge's JSON held every time.

**Repeats** (every run, $8.07, over the $5 plan because `--only 24` also ran 24b and 24c, $4.12 of it):

| Case | Runs | Result |
|---|---|---|
| 01 | 3 | pass, fail (first-lesson leak), pass: 2 of 3 |
| 16 | 3 | fail (ETIMEDOUT), fail (review leak), fail (review leak): 0 of 3 |
| 38 | 3 | 3 of 3 |
| 24 | 3 | pass, fail (leak), fail (leak): 1 of 3 |
| 24b | 3 | 3 of 3 |
| 24c | 3 | pass, pass, fail (leak): 2 of 3 |
| 39 | 3 | fail (leak), pass, pass: 2 of 3 |

**Cost:** smoke $0.50 (38, 39) + baseline $26.70 + repeats $8.07 = **$35.27**.

**New cases.** 38 passed in the baseline and 3 of 3 on repeat; in smoke it failed once on the first-lesson leak, nothing
else. 39 passed in the baseline and 2 of 3 on repeat (the other: the leak); in smoke it failed once on the same leak.
Neither new case has failed for a case reason; both fail only when the mentor leaks. What the spec left unclear:
(1) 38: whether the opening should still ask the intent question when `proposal` is null. SKILL.md says the solid line
replaces it; the case checks the solid line and not the question. (2) 39: the task text joined "no place given" with "any demo goes at the
place they give", which are two rules in SKILL.md (step 2 asks for the missing place; step 5 asks for a place before a demo
on another layer). Case 39 tests step 2 only; a demo-request case needs its own number.

## Opening read changes (2026-10-27, spec 004 T413 and T414; FR-052, SC-015)

Phase 10 (`1a28b1d`): `anchor_snapshot` reads the learner record and picks lesson or review itself; `/anchor-mentor` opens
with it and never calls `read_learner_record`. Dry run with `--strict-sources`: 46 cases valid, exit 0.

**Runner (`run.mjs`).**
- `read_learner_record` is out of `--allowedTools` (OR-2); it stays in the list the runner watches, so an attempt is seen.
- New universal check `no_read_learner_record` (never called, in any case).
- A review is detected from the first snapshot **reply's** `mode` (or a call that sent `mode: "review"` because the learner asked), so the
  review-only universal checks (`review_no_demo`, `review_method_before_pass`) still key on the right cases.
- New expect key `first_snapshot_mode` (`"lesson"` or `"review"`, on the first snapshot reply).
- `no_text_before_snapshot` was already there (unchanged).

**Changed cases.**

| Case | Change |
|---|---|
| 01, 32, 38 | `first_tool` `read_learner_record` becomes `anchor_snapshot` |
| 16 | `snapshot_with: { mode: review }` becomes `first_snapshot_mode: "review"`, plus `first_tool: anchor_snapshot` |
| 17 | **Renamed** `17-due-review-nothing-new-lesson` (was `17-review-nothing-new`). OR-1: a due review with nothing new starts a lesson; checks `first_snapshot_mode: "lesson"`, no `review`, `nothing new` or `due` in turn 1, the intent question, no record, no demo. Rubric item `R-AN-DUE-NOTHING-NEW-LESSON` (the old `R-REVIEW-NOTHING-NEW` is marked retired in `rubric.md`) |
| 18 | No change this round; its regex fix from the baseline was re-run once and held (below) |

**New cases** (numbers 40 and 41 of the cockpit's 40 to 43; 42 and 43 are not used).

| Case | What it is for | Rubric |
|---|---|---|
| 40 `unreadable-record` | An unreadable `learner.json` (the builder's `mentor/test/fixtures/records/unreadable.json`, used by path, no new fixture needed): snapshot first, nothing before it, the notes sentence once in the error's words, then the first-lesson question. Covers SC-015's unreadable-record case for this set | `R-AN-UNREADABLE-RECORD` |
| 41 `review-asked-none-due` | The learner asks for a review while none is due (`anchor-passed-not-due.json`): a review runs, hinge asked first, no demo, and nothing says it wasn't due | `R-REVIEW-ASKED-NONE-DUE` |

**Not added, and why.** *Practicing with a memory clause:* case 32 already is it (one memory clause, the snapshot's own proposal, no
skill ID), so only its `first_tool` changed. *A resumed lesson with stored choices:* FR-046's confirm sentence is only for
speed graph, key types and offset (the spec says skills 5 and 6 get theirs in a later per-skill branch), so there is no sentence to
check here; cases 34 and 35 already cover a lesson left open and reopened in a new session. A true "resumed" (a different comp in between)
needs a second fixture and a second record state; add it when the anchor skill gets the FR-046 sentence.

**Smoke, 2026-10-27, one run each** (`results/2026-10-27-203543.json` to `-204610.json`; about $5.0 in all, judge included except where the checks failed first):

| Case | Result | Text before the first snapshot? |
|---|---|---|
| 40 | FAIL then pass. Run 1 failed on **my own** regexes (the mentor repeated the tool's sentence "I couldn't read my notes from your earlier lessons", and I had counted `notes` twice and banned `earlier lesson`). Fixed the case; run 2 passes ($0.27). Mentor behavior was right both times | none |
| 41 | pass | none |
| 17 | pass (lesson starts, review never mentioned) | none |
| 16 | pass (review mode read from the reply; was 0 of 3 on this check in the baseline) | none |
| 01 | pass | none |
| 18 | pass (the lookbehind regex fix held) | none |
| 32, 38, 39 | pass | none |
| 24, 24b, 24c | pass | none |

`no_text_before_snapshot` and `no_read_learner_record` passed in every smoked run (12 runs on 11 cases, plus 40's second run). **One run each is
not SC-015's bar**, which needs repeats: the baseline leak was intermittent (about 9 of 30 first-lesson runs), so a clean single run
on 01, 16, 24 and 39 only says the self-note is probably gone, not that it is.

**Next:** ready for SC-015's repeats (`--repeat 3` on 01, 16, 17, 24, 39, 40, 41, about $10 to $12) and the re-baseline (about $27 for 46 cases).
Nothing blocks them. Unchanged and still open from the baseline: 21a (menu path wording), 30 (`because` in a record), 04, 19, 26, 29.

## T415: SC-015's counted runs (2026-10-28)

Spec 004 T415, on `evals-skill-5` with `mentor/` and `.claude/skills/` identical to `main` (Phase 10 merged, `1a28b1d`).
`--repeat 3` on the four opening situations, one case each, one invocation per case. Cost approved for the day.

| Opening | Case | Runs | Result | Cost | Results file |
|---|---|---|---|---|---|
| First lesson | 01 | 3 | 3/3 pass | $0.62 | `results/2026-10-28-115000.json` |
| Practicing | 32 | 3 | 3/3 pass | $0.84 | `results/2026-10-28-115059.json` |
| Review due | 16 | 3 | 3/3 pass | $2.24 | `results/2026-10-28-115239.json` |
| Unreadable record | 40 | 3 | 3/3 pass | $0.63 | `results/2026-10-28-115320.json` |

12 runs, 12 passes, **$4.33**. No plumbing failures, no re-runs, no rubric failures.

SC-015 counts (all must be 0):

- Runs with learner-visible text before the first snapshot call: **0 of 12** (`no_text_before_snapshot` passed in all 12).
- Runs whose first tool isn't `anchor_snapshot`: **0 of 12** (`first_tool` passed in all 12).
- Skill IDs in learner-visible text: **0 of 12**. `plain_words` passed in all 12, and a separate scan of every `MENTOR:` block in the transcripts for skill names and dotted or underscored ids found none.

Scope: 3 repeats of one case per opening, not the full SC-015 count; the set's full re-baseline is separate.

## Re-baseline after Phase 10 (2026-10-28)

Full run, one repeat, 46 cases, on `evals-skill-5` with `mentor/` and `.claude/skills/` identical to `main` (Phase 10
merged). **37 of 46 (80.4%), $27.50** (`results/2026-10-28-121321.json`). Against the first baseline (27/44, 61%, `c853f9e`).

**SC-015 (this run, all 46):** text before the first snapshot **0**; first tool not `anchor_snapshot` **0**; skill IDs in
learner-visible text **0**. All 11 cases that failed on the self-note now pass. SC-015 is met for the pivot set.

**SC-006: 80.4% meets the 80% line, but every hard-rule check does not pass.** Three deterministic checks failed (below),
so the bar is not met.

Failures (one run each, then repeats of the four deterministic ones, 2 more runs each, $4.21; every run listed):

| Case | Run 1 | Repeats | Triage |
|---|---|---|---|
| 21a menu path | FAIL `no_menu_path` ("Layer > Transform") | FAIL, FAIL (`2026-10-28-121533`) | **Real, hard-rule, 3 of 3.** Asked "is there a menu command that centers the anchor point?" with a left-edge place, the mentor names the menu path while saying it doesn't fit. Same finding as the first baseline (L-3). |
| 23c "same amount" | FAIL `no_opposite_directions` | pass; second repeat a **plumbing timeout** ($0, `claude ETIMEDOUT`, not re-run) (`2026-10-28-122503`) | **Real but intermittent, hard-rule** (1 of 2 completed). Demo reply wording "moves the same amount the other way". |
| 19 outside | FAIL `says_outside` (said "below it", never "outside") | FAIL, FAIL on the rubric (`2026-10-28-121442`); the check passed both times | **Real, honesty.** The word check is wording noise (2 of 3 say "outside"), but R-AN-OUTSIDE fails 2 of 2: the snapshot gives only `"Lid": "outside"` with no side, and the mentor says "below it" and "below the shape" anyway. Either the side must be in the tool output, or the mentor guesses. Also R-ONE-IDEA. |
| 36 ends on choice | FAIL `ends_on_choice` (ended on "tell me where..." without a question mark) | pass, pass (`2026-10-28-123306`) | **Noise** (wording; 1 of 3). |
| 02, 15, 21b, 29 | FAIL R-ONE-IDEA | not repeated | **Rubric, real.** Turn 2 packs repeat-back, two terms, the slide explanation, a frame description, a four-step walkthrough and the watch offer into one turn (29 also turn 3). 04 and 19 show the same. Not repeated (budget). |
| 04 | FAIL R-AN-NEIGHBOUR and R-HINT-NOT-FIX | not repeated | **Rubric, real** (a repeat from the first baseline): the hint adds "Drag the crosshair up along the left edge until...". |

First-baseline smaller findings: 21a's menu path **still shows**; 30's "because" in the record **gone** (30 passes); 26's
"make up for it" **gone** (26 passes); rubric repeats for 04, 19 and 29 **still show** (as R-HINT-NOT-FIX, R-AN-OUTSIDE
and R-ONE-IDEA). New this run: 02, 15 and 21b on R-ONE-IDEA, 23c's "same amount".

Proposed fixes, smallest first: (1) 21a: say in `SKILL.md` that the menu command is named only when the wanted place
is the middle (case 21b), and for an off-centre place answer "no, that only does the middle" without the path;
(2) 23c: add "same amount" to the demo wording list next to "opposite directions"; (3) 19: put the side in the
snapshot's output for an outside pivot, or tell the mentor to say "outside" and not name a side the tool didn't give;
(4) R-ONE-IDEA (02, 15, 21b, 29) and 04: the second turn of a named-layer lesson should drop the frame description and
the extra slide explanation, and the hint should say what is off and where, not the drag to fix it.

Total for the day: T415 $4.33 + baseline $27.50 + repeats $4.21 = $36.04. The baseline plus repeats came to $31.71.

## Fix re-runs 2026-10-28

After the skill-builder's wording fixes (`e82a7d2`, merged into this branch as `21a0a10`), `--repeat 3` on the eight failing
cases, each its own invocation. **Cost $18.13, over the $10 stop line**: my cost guard mis-parsed the runner's output
and never tripped, so the whole list ran. Every run is below.

| Case | Result | Files | What failed, and whether it is the same problem |
|---|---|---|---|
| 21a | 1/3 | `2026-10-28-132126` | The hard check `no_menu_path` now passes 3/3 (fix worked). The 2 failures are R-ONE-IDEA on **turn 3** (menu answer + walkthrough + A/Shift+P tip + watch offer): a new problem, not the old one. |
| 23c | 2/3 | `2026-10-28-132339` | "same amount" did not recur (fix worked). Run 3 made **2 demo calls** (`demo_at_most_once`, hard rule, demo on Needle): **new**, 1 of 3. |
| 19 | 0/3 | `2026-10-28-132503` | `says_outside` passes. **Same problem:** R-AN-OUTSIDE, "below it" is a guess because the tool gives no side (3/3); plus R-ONE-IDEA. The wording fix did not touch this; it needs the snapshot to carry the side. |
| 04 | 2/3 | `2026-10-28-132631` | Run 2 is a **plumbing failure** (the judge's reply was not parseable JSON; the item it did show, R-AN-NEIGHBOUR, passed). Not re-run. The hint-not-fix finding did not recur. |
| 02 | 3/3 | `2026-10-28-133218` | Fixed. |
| 15 | 0/3 | `2026-10-28-133419` | R-ONE-IDEA, now on **turn 3** (decline + three steps + A/Shift+P aside + watch offer), plus turn 2's extra slide sentence. Same rubric item, moved. |
| 21b | 0/3 | `2026-10-28-133539` | R-ONE-IDEA, mostly turn 3 (menu answer + comparison + four steps + tip + watch offer). Same item. |
| 29 | 0/3 | `2026-10-28-133714` | R-ONE-IDEA, turn 3 (refusal + repeat of the slide + three or four steps + offer). Same item. |

Reading: the specific fixes landed (menu path, "same amount", 04's drag, 02's turn 2). What is left is R-ONE-IDEA
in the turn after the walkthrough was already given (turn 3 stacks the answer, a second walkthrough, the A/Shift+P tip
and the watch offer), which the skill-builder flagged as a design change; and 19's guessed side. New: 23c's double demo
(1 of 3).

SC-006 at a full re-baseline: the 80% line looks reachable (this would flip 02, 04 and 21a's hard check, and 36 and 23c
are mostly noise, for about 39 to 40 of 46 if nothing else moves). **Every hard-rule check passing is less certain**:
23c's double demo is intermittent and unexplained, and 19's guessed side is a rubric item that will keep failing until
the snapshot or the wording changes. Treat a clean hard-rule run as a coin flip until 23c's double demo is understood.

## Check fixes and re-runs, 2026-10-28, round 2

- **Case 19's `says_side` stays as it was (`must: below`).** The brief assumed the snapshot gives Lid no
  side. It does: `analyze` on `practice2b.json` returns `{"note":"pivot_outside","side":"below"}`
  (FR-019a, `outsideSide`). The mentor saying "below" is right, and the "guessed side" findings from earlier
  today were a judge artifact: the runner cut each tool result at 6000 characters, and the `notes` array comes
  after that cut, so the judge never saw the side. The runner now keeps 16000 characters
  of a tool result (`renderTranscript`); this affects the judge's view in every case, so re-judge before
  comparing with older baselines.
- **Run A** (check changed to fail any side word, 6000-char cap; `2026-10-28-140802`): 0/3, `names_no_side`
  failed on "below" 3 of 3, $1.14. Kept as the record of why the change was reverted; the checks were wrong.
- **Run B** (original check, 16000-char cap; `2026-10-28-141004`): 19 is 0/3, $1.56. `R-AN-OUTSIDE` now
  passes; `R-ONE-IDEA` fails 3 of 3 on the sentence "If you change Anchor Point by itself, the layer slides..."
  (same item as before). That sentence is in `SKILL.md` "The words the lesson uses", so the rubric item and the
  prompt disagree.
- **23c** (`2026-10-28-141230`): 3/3, $3.35.

## Pacing changes (2026-10-28, T263; TD § 20, spec 011 Eval plan 15, 19 and 23c)

Written on `pacing-evals`; no paid run yet. Dry run: 46 cases valid. T264 runs the five cases (below) with the mentor from
the T262 branch.

- **Rubric.** `R-ONE-IDEA` takes TD § 20 › What R-ONE-IDEA should see: the turn that says what the pivot is passes when it
  ends on the A, then Shift+P ask and fails on a second explanatory sentence (the slide sentence, unasked); the move turn is
  two steps in prose, and **the watch offer is the same action's alternative** (last sentence); a side-question turn passes as
  the answer plus the pending action and fails when it adds the next stage. `R-AN-WATCH-YES` now says the asking turn runs
  nothing and Door is handed back with no second walk-through.
- **Case 15** (5 turns now). Turn 3 is the refusal, turn 4 'Both numbers are showing.' reaches the invite turn, turn 5 is the check.
  Checks: `no_later_offer` on turns 3 and 5 (as before, plus the decline turn); `decline_names_door_again` (turn 3 says Door,
  the same pending action); `watch_offer_made` (turns 2 to 4) and `watch_offer_once` (`at_most` 1 over the whole run), using
  case 23a's Needle offer pattern; `no_offer_after_check` (turn 5). Rubric adds `R-ONE-IDEA` and `R-AN-WATCH-OFFER`. A mentor that makes no offer
  at all fails `watch_offer_made`; one that repeats it fails `watch_offer_once`.
- **Case 19** (3 turns now). Turn 2 (TD turn 3) must say outside, the side (below), 'timeline' and Lid; the new turn 3 (TD turn
  4) must say 'start there' or name the crosshair. Rubric adds `R-ONE-IDEA`.
- **Case 23c.** `asks_show_numbers` is turn 3 only (was 3 to 4); new `demo_not_in_turns: [3]` (a runner key added for this);
  turn 4 must name Door and must not repeat the steps (`door_no_second_walkthrough`: no 'press Y', 'Pan Behind', 'start your
  drag', 'take it to', no numbered line). Rubric adds `R-ONE-IDEA`.
- **Runner.** The judge sees each tool result up to 16000 characters (was 6000). The 6000 cap hid the snapshot's side note
  from the judge and produced a false 'guessed the side' failure (cases 19 and 23c); earlier results were judged on the cut.
- **Not changed.** Cases 02, 21 and 29 keep their checks; T264 re-runs them with `R-ONE-IDEA` read by the new rubric text.

## T264 pacing re-runs (2026-10-28, `--repeat 3` each, $11.97 in all)

On the pivot `SKILL.md` with T262's pacing edits. Results: `results/2026-10-28-142947.json` (02, $1.60),
`-143149` (15, $3.72), `-143433` (21a and 21b, $4.53), `-143550` (29, $2.12). Majority passes.

| Case | Result | Triage |
|---|---|---|
| 02 | 3/3 | |
| 15 | 3/3 | |
| 21a | 3/3 | |
| 21b | 3/3 | |
| 29 | 0/3 | Run 1 and 3: **R-ONE-IDEA, prompt, real.** The "what numbers should I type" answer adds an unasked sentence ("If you change Anchor Point by itself, the layer slides...") to the decline. Run 2: **check, too strict** (`place_in_words` wants "left edge" or "middle of" in the short answer; the pacing rule makes the answer shorter and it didn't repeat the place; the answer itself was fine). Fix the check to drop `place_in_words` or accept turn 3 without the place; not changed here |

### Case 29 triage corrected (2026-10-28)

My triage of case 29 above was wrong. TD 011 § 20 (`specs/011-anchor/teaching-design.md`, "What moved, what's on
request", line 1282) makes the slide sentence ("Change Anchor Point alone and the layer slides...") the sanctioned
answer when the learner asks for numbers to type, which is case 29's moment. The judge calling it "unasked" in runs 1
and 3 was a **rubric miss, not a prompt problem**. Fixes, both in this set: (1) `rubric.md` R-ONE-IDEA now has an
exception: no numbers, then the slide sentence, then the pending action again passes; (2) the check `place_in_words`
became `pending_action_restated` (matches the restated A / Shift+P / Pan Behind action), so a short answer that doesn't
repeat the place passes. Run 2 still counts as the check being too strict. Case 29 is to be re-run once the builder's
decline-answer tightening lands; the three runs above (0/3) stay on record against the old rubric and check.

### Case 29 re-run after the fix round (2026-10-28, `-145857`, $2.28)

On `8a2405b` (the builder's tightened decline answers merged) with the corrected rubric and `pending_action_restated`.
**3/3, pass.** Counted result for case 29 is this run; the earlier 0/3 (`-143550`) stays on record against the old
rubric and check.

## Re-baseline rb3 (T265, 2026-10-28, mentor at `7de3cc2`)

One full run, no `--only`, 46 cases, mentor `7de3cc2` (fix round 3 on `main`). **41 of 46 (89%), $28.89**
(`results/2026-10-28-231410.json`). Earlier: 27/44 (61%, 2026-10-27, `c853f9e`), then 37/46 (80.4%, `-121321`, after
Phase 10). **SC-006 met:** above 80%, and every universal (hard-rule) check passed in all 46 cases, including
`no_text_before_snapshot`, `no_pivot_in_frame`, `matte_not_hidden` and `no_number_or_tolerance`. R-ONE-IDEA and the pacing
rules (TD 011 § 20) are in force and R-ONE-IDEA passed in the cases that failed otherwise. One run per case, no repeats.

| Case | Failed on | Triage | Design line |
|---|---|---|---|
| 09 matte named | `say:eye` (turn 2 must match eye or visible) | **Check** (case script). The learner says "Reveal Matte should turn from its center", and the matte already does, so the mentor said so and asked for another place. The turn where the eye is mentioned is never reached. The case needs an off-centre place. | TD 011, the already-at-the-place case (section not checked) |
| 11 one layer, one offer | `offers_needle`, `offer_is_last` (turn 2), `walks_through` (turn 3) | **Check** (stale turn numbers). § 20 moved the walk-through and the offer to turn 4. Turn 2 now ends on "press A, then Shift+P", and in turn 3 ("show me how") the mentor declined and handed the pending step back in one sentence, which is rule 3. | TD 011 § 20 sequence, curriculum § 2 rule 3 |
| 23a watch offer, no | `offers_needle`, `offer_is_last` (turn 2) | **Check**, same cause as 11. `offered_once` and `no_offer_after_check` pass. | TD 011 § 20 turn 4 |
| 23c watch offer, yes | `door_no_second_walkthrough` (turn 4 said "press Y") | **Check, with a small prompt question.** The script has the learner say yes in turn 3, before the offer exists (it is now in turn 4), so Door's walk-through had not been given yet and turn 4 is its first, not its second. But after a demo § 20 says the rest is handed back in one sentence, and turn 4 gave four. Fix the script first, then see whether it recurs. | TD 011 § 20 (W1, W2), curriculum § 2 "after a demonstration" |
| 29 no number to type | R-AN-NO-NUMBER (place in words not repeated) | **Rubric.** The reply answered in one sentence, gave no number and handed A, Shift+P back. That is rule 3. The item asks for the place in words, which the pending step doesn't carry. R-ONE-IDEA passed. Case 29 passed 3/3 on the earlier rubric (`-145857`). | curriculum § 2 rule 3; TD 011 § 20 answered question 1 |

No case failed on a prompt. Four of five trace to case scripts and checks written before the § 20 sequence moved the
offer and the walk-through to turn 4; proposed in the hand-back, not changed here.

## Changed after seeing results (2026-10-29, human-approved, fix round 4)

Design line for all four: TD 011 § 20 and `anchor-mentor/SKILL.md` steps 2 to 4 (turn 2 is the explanation turn ending on "press A, then Shift+P"; the move, the invite and the watch offer are turn 3, after the learner shows both numbers). Cases 09, 11, 23a and 23c failed in the `2026-10-28-231410` run on scripts written for the offer one turn earlier. No dry-run-only change was scored; all need paid re-runs.

- **Case 09:** the learner now names an off-centre place ("Reveal Matte should turn from the middle of its left edge", was "center", which the mentor rightly answered with "already there"), a turn 3 is added ("Reveal Matte is selected and both numbers are showing."), and `eye` reads turns 2 to 3. Still EP-9: a matte is accepted, never called hidden, and the eye note is made.
- **Case 11:** turns are now /anchor-mentor, the place, "Door is selected and both numbers are showing.", then "Can you show me how to do it on Door?". `offers_needle`, `offer_is_last` and `walks_through` read turn 3; `names_door` reads turn 4. `offered_once` is unchanged. Still EP-11 and FR-008.
- **Case 23a:** the same turn 3 is added; `offers_needle` and `offer_is_last` read turn 3; `no_offer_after_check` reads turn 4 (the "no thanks, done" turn, on `door-outside.json`). Still EP-23a and FR-008.
- **Case 23c:** the same turn 3 is added, the yes is turn 4 and the Needle ready-message turn 5. `asks_show_numbers`, `needle_place` and `demo_not_in_turns` read turn 4; `undo` and the three `door_*` checks read turn 5. Still EP-23c, FR-008, FR-017, TD20-W1-W2. The `door_no_second_walkthrough` failure in the old run (the mentor said "press Y" in the hand-back) is kept as it was: with the learner now having had the walk-through in turn 3, it is a real prompt question for the builder.
- **R-AN-NO-NUMBER (case 29):** no longer asks for the place in words or "without the layer moving" on the decline turn. Pacing rule 3 hands the pending step back; the no-number and no-tolerance part is unchanged.

Coverage notes (accepted by the builder 2026-10-29, to restore later): case 09 no longer covers "matte already there" (its learner now names an off-centre place), and case 11 no longer covers refusing a show-me before the walk-through (the walk-through now comes first in the script).

## Re-run after the overlap-audit fixes, with cases 42 to 45 (2026-10-29, mentor at `df65d41`)

**48 of 50 (96%), $33.15** (`results/2026-10-29-143900.json`; last baseline 41/46, 89%, $28.89). **SC-006 met on the score.**
One universal (hard-rule) check failed: `record_plain` in case 30, see below. The full run was one pass; the
two failures were then repeated `--repeat 3` once (`-150633`, `-150753`, $5.22). Total for the set with the four
new-case smoke runs ($2.63): about $41.

**New cases** (builder's OA rows, fixtures built by `fixtures/build.mjs` from live captures; each passed on its
first run and again in the full run):

| Case | Covers | Result |
|---|---|---|
| 42 masked layer named | OA-12: Door has a mask; taught, one sentence on the whole layer's edges | pass |
| 43 masked layer not offered | OA-12: practicing proposes Needle, not the masked Door | pass |
| 44 focus not on screen | OA-13: Door starts at 2 s; "isn't showing at this time ... move the playhead into Door's bar" | pass |
| 45 Pan Behind between rotation keys | OA-11: Gauge set at 3.6 s; away-from-rest hint, rest time 3.2 s, Edit > Undo first | pass |

Not covered: the same-name copy (OA-6 and T467's demo guard). The only mentor-visible part is a demo that writes to the
right layer; the unit tests (`anchor-audit`, `demo-renumber`) own it.

**Failures**

| Case | Failed on | Repeats | Verdict |
|---|---|---|---|
| 20 group pivot moved | judge: R-HINT-NOT-FIX (turn 3 restates the Pan Behind steps; once also offered to show Door first) | pass, FAIL, pass (2 of 4 runs pass) | **Noise**, watch list. Checks all passed; the earlier baseline passed. Not from the audit changes. |
| 30 stop early record | `record_plain`: record says "Pan Behind" (hard rule) | FAIL, FAIL, pass (1 of 4) | **Mentor** (prompt gap). The `next` field names the method ("... with Pan Behind"); `SKILL.md` step 11 says "no tool or method" only for `summary`. Proposed smallest fix: add "no tool or method" to the `next` line too, with an example in the Pass-line style ("Set Door's pivot on its left edge without Door moving"). Passed in the 10-28 baseline, so it is variance on an unconstrained field, not a new regression. |
