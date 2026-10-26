# Anchor (set the pivot) evals

The eval set for `/anchor-mentor` (skill 5, `transform.anchor`, spec 011). It scores whether the mentor *teaches*
well, not only whether it is correct: it asks before it names a place, never gives a number to type or a tolerance, never says the pivot shows in a frame, never calls a matte hidden, answers Quick Set Anchor plainly, says plainly what it can't check, and runs a review with no tool named before "done". It runs the real skill and server in headless
Claude Code against saved snapshots, so **After Effects doesn't need to be open**. Whether the
measures are *correct* is covered by the unit tests (`cd mentor && npm test`); evals don't repeat them.

Built from the skill 6 set (`product/evals/null-parenting/`), itself copied from easing's runner. Same
options and results format; everything skill-specific is in the `CONFIG` block at the top of `run.mjs`.

## Status (2026-10-26): built on stand-in and synthetic fixtures

25 cases, dry-run clean, smoke run below. **No baseline yet.** The full run waits for the live sitting (spec 011 L-1 to L-5, tasks T233), because every fixture except the `synthetic/` ones is a stand-in the builder wrote by hand. The set was built on the `skill-5-anchor` branch, so it sees skill 5's tools and `SKILL.md` but not whatever else has merged to main since.

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

A full run is about 73 mentor turns plus 25 judge calls. From the smoke run
(about $0.12 to $0.18 a turn, $0.05 to $0.10 a judge call) expect **about $11 to $14**. Bar: SC-006,
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

Numbers are mine; the spec's Eval plan item each covers is in `covers`. Turns is the number of mentor
turns. Fixture source: `stand-in` (builder's hand-built file, replaced at the live sitting),
`synthetic` (permanent), `live` (a capture).

| # | Case | Turns | Hard-rule checks (beyond the universal ones) | Rubric | Fixture source |
|---|---|---|---|---|---|
| 01 | First lesson, no layer in mind: intent asked first; one candidate offered with a hinge; leave-outs named once | 2 | first_tool; tools_called; demo_calls_max; tools_not_called; say: must asks_intent, must asks_question, must offers_door, must hinge, must leave_out | R-AN-INTENT-FIRST, R-AN-PROPOSAL-HINGE, R-AN-LEAVE-OUTS, R-NAMES-REAL, R-ONE-IDEA | stand-in |
| 02 | Layer named: the place repeated in plain words, the two sentences once, a frame, no 'you can see the pivot' | 2 | tools_called; snapshot_input_matches; demo_calls_max; say: must repeats_back, must anchor_vs_position | R-AN-REPEAT-BACK, R-NAMES-REAL, R-ONE-IDEA | stand-in |
| 03 | Anchor Point typed (the layer moved with it): doesn't pass; the 'moved with it' hint with a direction, no numbers | 3 | tools_called; last_check; say: must names_door, must direction, must undo, never no_offer | R-AN-MOVED-WITH-PIVOT, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 04 | Banner one place off: fails; the hint names the place it's in | 3 | last_check; say: must names_banner, must names_place, never no_offer | R-AN-NEIGHBOUR, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 05 | Pan Behind on a layer at Scale 200% (Plaque) passes | 3 | last_check; say: must says_passed | R-AN-PASS, R-NAMES-REAL | stand-in |
| 06 | Pan Behind on Background instead of the focus: 'select it first' | 3 | last_check; say: must names_both, must select_first | R-AN-WRONG-LAYER, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 07 | Pop set while shrunk: fails with the rest-key hint; the rest key named before they start | 3 | last_check; say: must names_rest_before, must rest_hint, must full_size, never no_offer | R-AN-REST-KEY, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 08 | The learner asks about Quick Set Anchor: answered plainly, not refused, no steps; the lesson goes on with Pan Behind | 2 | say: must says_beta, must pan_behind, never no_refusal, never no_steps | R-AN-QUICK-SET, R-ONE-IDEA | stand-in |
| 09 | A matte named as the target: never called hidden; Pan Behind needs it visible | 2 | tools_called; say: must eye | R-AN-MATTE, R-NAMES-REAL | stand-in |
| 10 | The matte's eye left on after a pass: the eye sentence | 3 | say: must eye_off | R-AN-MATTE-EYE, R-NAMES-REAL | stand-in |
| 11 | Text, 'turn from the middle': told the pivot is on the baseline, not that it's already there | 2 | say: must baseline, never not_already_there | R-AN-BASELINE, R-NAMES-REAL | stand-in |
| 12 | Two focus layers: A and Shift+P asked first; one pivot moved on the layer they care less about; frames at the same time; Edit > Undo | 4 | demo_calls_min; demo_calls_max; demo_only_on; tools_called; say: must asks_show_numbers, must undo, must names_tab | R-AN-DEMO, R-DEMO-PLAIN, R-NAMES-REAL | stand-in |
| 13 | One focus layer: no demonstration, a walkthrough in words | 3 | demo_calls_max; say: must walks_through, must names_door | R-AN-WALKTHROUGH, R-NAMES-REAL | stand-in |
| 14 | After a pass: which part stays still. A wrong answer gets one light correction and the pass stands | 5 | last_check; record_lesson; say: must asks_what_stays, must light_correction, never pass_stands | R-AN-UNDERSTANDING, R-RECORD-HONEST | stand-in |
| 15 | A layer with Position keyed: the tip once; a slide at another key fails | 3 | last_check; say: must tip, must names_sled, must names_time | R-AN-POSITION-KEYED, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 16 | The layer was dragged, not the pivot: names what's off, no fix, no offer | 3 | last_check; say: must names_door, must names_tool, never no_offer | R-AN-DRAGGED, R-HINT-NOT-FIX, R-NAMES-REAL | stand-in |
| 17 | 'Just do it for me': declined warmly, no offer later | 4 | demo_calls_max; say: never no_later_offer | R-DECLINES-WARMLY, R-ONE-IDEA | stand-in |
| 18 | Review due: a new layer (Tab), the hinge asked first, no tool named before 'done', no demo; passes | 3 | review_mode; snapshot_with; demo_calls_max; last_check; say: must names_tab, must asks_where, must declines_demo | R-REVIEW-HANDS-ON, R-NAMES-REAL | stand-in |
| 19 | A layer that can't be checked (no rectangle): says so and never claims it didn't move | 3 | say: must says_cant, never no_false_claim | R-AN-CANT-CHECK, R-NAMES-REAL | synthetic |
| 20 | A menu command to center the anchor: no unconfirmed menu path or shortcut; Pan Behind goes on | 3 | say: never no_menu_path, must pan_behind | R-AN-NO-MENU, R-ONE-IDEA | stand-in |
| 21 | 'What numbers do I type?': no number, no tolerance; the place in words | 3 | say: never no_numbers, must place_in_words | R-AN-NO-NUMBER, R-ONE-IDEA | stand-in |
| 22 | Anchor Point's stopwatch left on: the hint says to turn it off and keep the pivot | 3 | last_check; say: must stopwatch, never no_offer | R-AN-STOPWATCH, R-HINT-NOT-FIX | stand-in |
| 23 | A locked layer: unlock it first | 3 | last_check; say: must unlock, never no_offer | R-AN-LOCKED, R-HINT-NOT-FIX | stand-in |
| 24 | The learner stops after a try that moved the layer: recorded partial, plain words, no method or numbers | 4 | record_lesson | R-RECORD-HONEST, R-NAMES-REAL | stand-in |
| 25 | After Effects can't be reached: nothing claimed about the comp | 1 | tools_not_called; say: must says_cant_see, never no_claims | R-UNREACHABLE | none |

- **14** ends with a fifth turn ("I tried the rotation and undid it") because the mentor asks the understanding question, then the ungraded try-it step, and records the lesson after both. It was edited after its smoke run and **has not run since**.
- **18** is edited the same way (the record expectation moved to 14 and 24, since in the smoke run the mentor asked the understanding question after a review pass and recorded later); it was **not re-run after the edit**.
- **19** (can't check) uses `synthetic/edge-before.json` as the baseline and `row27-no-rect.json` as the read.
- **No case for a review with no new candidate** (EP-17): no fixture gives zero candidates in review mode (the stand-ins and the `measures`/`row16` synthetics all have one). See requests.
- **`shortcutAllow`**: the skill teaches Shift+P, so the shortcut check removes `Shift+<letter>` before it looks. Y, A and the other single keys aren't matched anyway.
- The review-banned words stop at the first `anchor_check` call (the skill allows Pan Behind in a hint after a check), not at a pass.

## The fixture tell

Synthetic fixtures carry the project name `Synthetic.aep`, comp names that start with "Synthetic" and a
`synthetic` note. The runner never hands the mentor the builder's file. For each run it writes a
scrubbed copy named `comp-N.json` into a neutral temp folder: the note is removed, the project becomes
`Studio Reel.aep`, "Synthetic" in a comp name becomes "Studio", and a fixture that still says
"synthetic" or "stand-in" anywhere is refused. `--dry-run` runs the same scrub.

## Fixtures and re-pointing after the live sitting

Fixtures are **not copied** into this folder. A case names a fixture by the file name the builder's
tests use, and the runner resolves it in `CONFIG.fixtureDirs` order (`mentor/test/fixtures/anchor`, `mentor/test/fixtures/layer-info`, `mentor/test/fixtures/anchor/stand-in`, `mentor/test/fixtures/anchor/synthetic`):
a live capture sits before the stand-in folder, so it wins. Each case carries a `fixture_sources`
label per fixture, and `--dry-run` prints where each resolves now.

After the live sitting, once the captures are saved under the stand-ins' names and the stand-in folder is
deleted:

1. `node product/evals/anchor/run.mjs --dry-run`. It prints every stale label, for example
   `04-...: planted-15-80.json is labelled stand-in but resolves to live`.
2. Change those labels (`stand-in` to `live`) in each case's `fixture_sources`. `--strict-sources` fails
   until none are stale.
3. A stand-in with **no live twin under the same name** now fails the dry run with "no fixture". Capture it
   under that name or change the cases that use it. `practice2b.json` is spec 004's capture (T135), read in place from `mentor/test/fixtures/layer-info/` once it exists. The stand-ins' live names are in the builder's `mentor/test/fixtures/anchor/README.md` table: all the files these cases use are listed there.
4. Run each case once with `--only` and read the facts the checks assume, which a live capture can change
   (Door at the middle of its left edge, Tab as the demo target and the review's proposal, Pop's rest key at 4.3 s, Sled's slid key time, Banner's neighbour place (bottom-left), and each planted hint code). A changed fact is a case edit, not a skill bug.
5. Then the baseline: `node product/evals/anchor/run.mjs`. A live capture changes a case's hash, so
   `--changed` re-runs exactly the re-pointed cases.
6. The preview frame comes back as a blank placeholder in every run (the fixture folder has no `frame.png`).
   The rubric tells the judge to ignore it. A `frame.png` next to a live capture would let the mentor see it.


## Smoke run (2026-10-26)

Six runs, total $3.68 (over the $3.50 cap by $0.18: the last repeat was started before the total was added up). Cases 01, 07, 12, 14 and 18:

| Run | Case | Result | Triage |
|---|---|---|---|
| 1 | 01 | pass ($0.37) | |
| 2 | 12 | FAIL ($0.82) | **Real, judge-only.** R-DEMO-PLAIN: the mentor said Anchor Point and Position "changed by the same amount in opposite directions"; the demo's reply shows both going down by the same amount. A small embellishment past what the skill says ("Both numbers changed, and Tab didn't move") |
| 3 | 18 | FAIL ($0.48) | My case bug: after a review pass the mentor asks the understanding question and records later, not at once. **Also a real finding:** the mentor's first words were "Learned, review due -> review mode." |
| 4 | 18 | FAIL ($0.68) | **Real.** With the new universal `no_self_instructions` check: the mentor said "Run review" before its first tool call (the same leaked step as the offset set's case 17) |
| 5 | 07 | pass ($0.62) | |
| 6 | 14 | FAIL ($0.71) | My case bug: the mentor goes on to the ungraded try-it step and records after that. Added a fifth turn (not re-run) |

## Reading results

Same order as easing: a failed `run` check is plumbing; a failed deterministic check is a hard-rule
break; a failed rubric item is teaching quality. Re-run a flipping case with `--repeat 3` before
changing `SKILL.md`. Rubric items are in `rubric.md`.
