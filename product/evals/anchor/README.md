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
`demo_calls_min` / `demo_calls_max` (attempts), `demo_only_on`, `last_check` (`passed`, `has` and `lacks`:
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
| 15 | 'Just do it for me': declined warmly, no demo, no offer later | 4 | live | R-DECLINES-WARMLY |
| 16 | Review due: Tab, hinge asked first, **nothing said before the first call**, no tool named before 'done', no demo, no watch offer | 3 | live | R-REVIEW-HANDS-ON, R-AN-NO-WATCH-OFFER |
| 17 | Review with no new candidate (record lists every default layer): says nothing new, records nothing, no demo | 1 | live + synthetic record | R-REVIEW-NOTHING-NEW |
| 18 | A layer that can't be checked (no rectangle): says so, never claims it didn't move | 3 | synthetic | R-AN-CANT-CHECK |
| 19 | Lid named, pivot outside (round 1): says outside, below, click Lid in the timeline; no distance | 2 | live | R-AN-OUTSIDE |
| 20 | `lid-group` as the attempt (round 1): Lid's own pivot unchanged, the Contents possibility, **not** the expression line too, never claims they moved the group | 3 | live | R-AN-GROUP-PIVOT |
| 21a | Menu command asked for with a left-edge place: no Center Anchor Point, Pan Behind goes on (L-3) | 3 | live | R-AN-CENTER-MENU |
| 21b | Same question with the center as the place: the menu path by name, never a key combination | 3 | live | R-AN-CENTER-MENU |
| 22 | One Position key, dragged with the playhead off it (round 2): slid hint with the key's time, Edit > Undo, playhead on the key; never "jump" | 3 | live | R-AN-SLID |
| 23a | Watch offer, "no, I'll just try" then a failed check: one offer, none after, no demo | 3 | live | R-AN-WATCH-OFFER |
| 23b | Watch offer, this skill passed before (record): no offer at all | 2 | live + synthetic record | R-AN-NO-WATCH-OFFER |
| 23c | Watch offer, yes: two focus entries (Door, then Needle at the bottom edge), A and Shift+P asked, demo only on Needle | 4 | live | R-AN-WATCH-YES, R-AN-DEMO |
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
