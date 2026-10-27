# Anchor (set the pivot) evals

The eval set for `/anchor-mentor` (skill 5, `transform.anchor`, spec 011). It scores whether the mentor *teaches*
well, not only whether it is correct: it asks before it names a place, never gives a number to type or a tolerance, never says the pivot shows in a frame, never calls a matte hidden, answers Quick Set Anchor plainly, says plainly what it can't check, and runs a review with no tool named before "done". It runs the real skill and server in headless
Claude Code against saved snapshots, so **After Effects doesn't need to be open**. Whether the
measures are *correct* is covered by the unit tests (`cd mentor && npm test`); evals don't repeat them.

Built from the skill 6 set (`product/evals/null-parenting/`), itself copied from easing's runner. Same
options and results format; everything skill-specific is in the `CONFIG` block at the top of `run.mjs`.

## Status (2026-10-26, HO-1 rounds 1 to 6): live captures, 42 case files (spec cases 1 to 37), no baseline yet

The set now runs on the live captures of Mentor Practice 2 (comp 179, `mentor/test/fixtures/anchor/`,
`practice2b.json` the base) plus a few synthetic fixtures. Nothing points at the stand-ins or comp 300
(deleted on `skill-5-anchor`). Case numbers are the spec's Eval plan (spec 011 > Eval plan, now 1 to 37); 21, 23 and 24
have variants (a, b, c). Seven cases from the first set are not in the Eval plan and are numbered 25 to 31 (assigned by the cockpit). **No baseline**: that waits until skill 5 merges after the review
lesson (T240). The smoke run of the changed and added cases is at the end of this file.

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

A full run is about 109 mentor turns plus 42 judge calls. From the smoke runs
(about $0.35 to $0.75 a case) expect **about $18 to $24**. Bar: SC-006,
at least 80% passing, and every hard-rule check passing; spec 011's SC-004 (no numbers) and SC-005 (Quick Set Anchor) are covered by the universal number check and case 08.

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
| `no_number_or_tolerance`, `no_place_codes`, `no_pivot_in_frame`, `no_self_instructions`, `matte_not_hidden` | skill-specific (see `CONFIG.universal` in `run.mjs`) |
| **When a case runs a review** | |
| `review_no_demo` | no demo in a review |
| `review_method_before_pass` | /Pan Behind|\bpress Y\b|\bshortcut\b|\bcrosshair\b|\bdrag the\b/ is never said before a pass |

## Case-level `expect` keys

`first_tool`, `tools_called`, `tools_not_called`, `snapshot_with` (a snapshot call with these inputs),
`snapshot_input_matches` (regexes over a snapshot call's input), `snapshot_calls_max`,
`demo_calls_min` / `demo_calls_max` (attempts), `demo_only_on`, `last_check` (`passed`, `has` and `lacks`:
substrings of the check's reply, `input`), `record_lesson` (`null` for "nothing recorded"),
`review_mode`, and `say`: a list of `{ id, must | never, turns, cs }` regex checks on the mentor's
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

Dropped from the first set: the Sled-slid case (old 15). Since D-4 no lesson can reach Sled with three keys
(`sled-slid` is a unit-test fixture), so cases 13 and 22 replace it.

- **Synthetic fixtures** are built from live files by `fixtures/build.mjs` (run it to regenerate them; the
  output is committed): `sled-one-key-rest-away.json` and `sled-one-key-rest-on-key.json` (24, 24b, 24c: the live
  `sled-one-key-before.json` with Scale or Rotation keys written onto Sled), `door-pass-matte-eye-on.json`
  (25: the live `door-pass.json` with the one field `matte-eye-on.json` changes), and two records
  (`every-layer-done.json` for 17, `anchor-passed-not-due.json` for 23b). Mentor Practice 2 has no one-key
  layer, so 24 has no live evidence yet (spec 011 round 4). `synthetic/edge-before.json` and `row27-no-rect.json`
  (18) are the builder's.
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

## Reading results

Same order as easing: a failed `run` check is plumbing; a failed deterministic check is a hard-rule
break; a failed rubric item is teaching quality. Re-run a flipping case with `--repeat 3` before
changing `SKILL.md`. Rubric items are in `rubric.md`.
