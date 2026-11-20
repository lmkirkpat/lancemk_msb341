# Ask evals

The eval set for `/ask-mentor` (spec 014, T031 to T033; FR-061; teaching design § 17). It scores whether the
mentor *teaches* well when a learner asks about their own open comp: it reads first, answers on the layer that
makes the motion, says what it read and what it didn't, puts steps in the learner's hands, hands the choice back,
and leaves the project alone. It runs the real skill and server in headless Claude Code against saved snapshots,
so **After Effects doesn't need to be open**. Whether the reads are *correct* is spec 015's unit tests.

Written 2026-11-16. It has run on B1: the T037 baseline at `91fd9c7` (2026-11-18) passed 18/18 with `--repeat 3`
(see Results). It hasn't run on A yet (T089).

## Cases

29 cases. All but 19 run on B1 and A; the A-only expectations in the others are individual checks. Case 19 is `runtimes: ["a"]` (go_deeper refuses on B1, FR-017).

| Case | TD § 17 situation, or row | What it covers | Fixture |
|---|---|---|---|
| 01-parent-source | 1 | A child with no keys rides a null moved by expressions: parent and expressions named, steps on the parent | `comp1.json` |
| 02-review-due-question-first | 4 | A review is due, the first message is a question: answer first, no review or lesson ahead of it; the record is untouched | `practice.json` + `records/review-due-four-skills.json` |
| 03-natural-expression-only | 5 | "Make the rock's shake natural" (the live Comp 1 also has a keyed logo, so "the shake" alone is ambiguous) on all-expression motion: no keyframe skill tagged or offered | `comp1.json` |
| 04-link-described | 6 | "What does Sweep Control do?": a null drives an effect on another layer; described, never "can't see" | `comp1.json` |
| 05-keyed-softer-one-offer | 7 | A question inside one skill on a keyed layer: steps plus one offer of the speed graph, no lesson | `practice.json` |
| 06-do-it-for-me | 9 | "Can you just do it for me?": the decline in one sentence, step 1 again, nothing changed | `practice.json` |
| 07-outside-the-six | 10 | A question fully outside (render settings): the outside line, no general answer | `practice.json` |
| 08-partly-outside | 11 | Inside steps plus an outside part (export): both bands, the outside part not dropped | `practice.json` |
| 09-ambiguous-layer | 12 | "The rock" names two layers whose first steps differ: one question naming both, then an answer with the assumption | `comp1-two-rocks.json` |
| 10-vague-goal-two-ways | 13 | A vague goal with a keyed layer and an expression layer in reach: one question, then an answer | `card-and-glow.json` |
| 11-precomp-unread | 14 | A precomp in reach: "I couldn't see inside", never "nothing inside" | `practice.json` |
| 12-matte-eye-off | 15 | A matte with its eye off by design: a matte, never "hidden" | `matte-eye-off.json` |
| 13-expression-over-keys | EE-4 row 1 (A1) | Keys and an enabled expression on one property: both said, keys not edited as the driver | `practice.json` |
| 14-separated-dimensions | EE-4 row 2 (A4) | X Position, never a Position that isn't there | `practice.json` |
| 15-single-and-hold-keys | EE-4 row 3 (A10) | One key is set, not animated; holds are a jump | `practice.json` |
| 16-locked-layer-in-the-step | EE-4 row 4 (A12) | A locked layer: the unlock is in the step it blocks (locked stands for "locked or Collapse") | `practice-title-locked.json` |
| 17-howto-no-target | FR-019 (PQ-4) | A how-to with no comp target: two sentences, no steps, one offer of the lesson | `practice.json` |
| 18-followup-after-lesson | T104, amendment (e), FR-028 | The first follow-up after a lesson, sent in the full context wrapper (contracts/panel-ask.md): a read first, then a short prose answer (no `give_answer`, FR-028) that follows from the earlier answer (TD § 16's, "What about step 2?"), no wrapper label in what the learner reads | `comp1.json` |
| 19-go-deeper-hands-over-and-back | 16 (A only) | A yes to going deeper on the pivot step: `go_deeper`, the hand-over, the lesson opens on Shake Control with no intent question or proposal, and after the pass the last line hands back to the answer's next step | `comp1.json`, `comp1-shake-pivot-panned.json` |
| 20-asked-again-about-a-learned-skill | 18 | Set the pivot is learned: the same question gets a full answer, the pivot offered as practice on A, never a review or a line that makes the learner feel forgetful (H-5) | `comp1.json` + `records/pivot-learned.json` |

Phase 3 (T078, 2026-11-19), cases 21 to 29, all on B1 and A. They are dry-run only until T080:

| Case | TD § 17 situation, or row | What it covers | Fixture |
|---|---|---|---|
| 21-done-after-the-playhead-moved | 2 | After an answer, "I did steps 1 to 3. Done." with the playhead moved: no `give_answer`, a read at turn 1's read time on the step layers, never "you moved/changed", no verdict, no Undo | `comp1.json`, `comp1-playhead-moved.json` |
| 22-it-landed-on-another-layer | 19 | The learner eased Bar's End keys, not Title's: the read says where it landed (Bar), that Title reads as before, no pass or fail words, no new list | `practice.json`, `practice-bar-eased.json` |
| 23-just-the-steps-no-more-offers | 8 | "Just the steps", then a question about step 1: neither reply offers a lesson (no offer words, no question mark), no hand-over | `practice.json` |
| 24-the-asked-entry-holds-a-general-goal | 17 | One asked entry: a goal of at most 120 characters with no run of 5 words from the question and no layer or effect name, nothing said, no skill state changed | `comp1.json` |
| 25-goal-from-a-question-full-of-names | 17 | A question that names two layers and an effect: the saved goal has none of them (`GOAL_NOT_GENERAL` may cost a retry) | `comp1.json` |
| 26-the-learner-says-it-worked | FR-038 | "The shake works now": `note_said` called, the entry's `said` set in general words, no announcement | `comp1.json` |
| 27-a-question-and-a-did-are-not-how-it-went | FR-038 | A question, then "I did step 3": no `note_said`, nothing said on the entry | `comp1.json` |
| 28-asked-about-after-learning-is-marked-and-never-said | 18 (record half) | Set the pivot learned: `after_learning` holds it, no skill state changes, no word of the mark or FR-041's banned phrases | `comp1.json` + `records/pivot-learned.json` |
| 29-a-new-question-in-the-follow-up-bar-gets-an-answer | FR-031 | Another goal on another layer, plain text: a fresh `give_answer` on Subtitle, two entries, no recital of the first answer | `practice.json` |

Not in this set (later phases or elsewhere): situations 3 (the padded PNG, anchor case 61) and 16 (case 19). The next case takes 30. Case 18's wrapper is written out in full in the case file, from the contract; when the panel adds the wrapper's first line to `REQUESTS`, its sync test should pin case 18's first line to it.

## What a turn looks like

Every turn is sent as `/ask-mentor <question>`, as the panel sends it (contracts/panel-ask.md). A follow-up in a
case (`"followup": true`) is sent as typed, with no prefix. The mentor answers by calling `give_answer`
(contracts/ask-tools.md) as the turn's last call, with no prose of its own (research R2):

- The deterministic checks and the judge read **the answer rebuilt from the call's reply** (explanation, steps with
  their tags, closing offer, Go deeper buttons), never free prose. The judge's transcript shows the answer block,
  not the raw call.
- `answer_prose_empty` fails an answer turn that also wrote words.
- Follow-up turns (the decline in 06, replies to a question in 09 and 10) are plain prose or a new answer, as the case says.

## What every case checks (no `expect` key needed)

On the words the learner reads (explanation, step lines, closing offer, and any prose):

- **plain_words**: no field or value name from tool output (an underscore name, a skill ID, a quoted `outside`).
- **no_narration**, **no_test_tell**, **no_slash_command**: as the other sets.
- **no_cant_see**: never "can't see", "couldn't see", "cannot see" about a read (AB 1); "couldn't see inside" (a precomp) is allowed.
- **no_undo**: never Undo, Ctrl+Z or Cmd+Z. The ask mode changes nothing, so nothing is undone.
- **no_code**: no backticks, no `wiggle(`, no `value +`, no `thisComp` (H-2: no code written or rewritten).

On the tools:

- **read_before_answer**: on an answer, describe or clarify turn, `describe_layers` was called before `give_answer` (FR-001; the tool can't enforce it). A how-to or outside answer needs no read.
- **only_ask_tools**: `describe_layers`, `preview_frame` and `give_answer` only; from a case's yes turn on (phase 2), also `go_deeper`, `Skill` and the named lesson skill's own tools (`lesson_skill`).
- **no_project_change**: no demonstration, no `set_*`, no `pan_*`, no `record_lesson`, no `end_lesson` (before a yes turn).
- **no_lesson_started**: no `Skill`, no `go_deeper`, no snapshot or `recommend_next` call before the case's yes turn (T058: no lesson starts without a yes). Only case 19 has one; every other case never says yes.
- **no_undo** covers the turns before the yes turn only: a lesson's hint says Edit > Undo.
- **record_changes_only_the_lesson** (a case with a yes turn): only the skill the yes handed over to may change in the record. **no_answer_after_yes**: no `give_answer` once the lesson has begun.
- **record_skills_unchanged**: the learner record's `skills` and `lessons` are as the case began (the asked entry changes no skill state).

On each answer a case expects (`expect.answers`):

- **answer_given**, **kind**, **one_answer** (one accepted call per turn), **answer_prose_empty**.
- **no_steps_for_kind** (describe, howto, clarify, outside, no_comp have none), **steps_one_to_four**, **steps_count**.
- **no_offer_for_kind** (clarify and no_comp carry no offered skills and no closing offer; outside carries no offered skills, and its closing offer is the one sentence on what the mentor does cover, FR-018).
- **offers_valid**: on B1 `offered_skills` is `[]` (FR-017); on A at most two, each among the step skills (a how-to may offer one with no steps).
- **runtime_field**: the reply's `runtime` is the run's.
- **closing_offer**: one sentence ending in "?" when there are steps or an offer.
- **first_line_names_comp**: the explanation's first line names the fixture's comp (answer and describe).
- **no_step_list_in_prose**: no numbered list, no "Steps:", and no step's text repeated in the explanation.
- **step_skills_known**, **step_layers_real** (a step's layer is a layer in the comp), **not_taught_marked** (ends "Not something I teach yet.").
- **step_starts_with_action** and **answer_length** are **warnings** (reported, never failed): the verb list and the 120 words are guesses to tune on the three sessions.

## Case-level `expect` keys

- `answers`: `[{ turn, kind (a string or a list), steps: [min, max], no_keyframe_skills, step_skills_include, step_skills_forbid, offered_equals (A only), step_on_layer, skill_step_on_layer: [{ skill, layer }], max_sentences: [{ field: "explanation"|"closing_offer", max }], step_order: [{ id, first, then, needs_sweeps }], step_text_order: [{ id, first, then, needs_sweeps }] }]`.
  `step_order` compares step skill tags; `step_text_order` compares regexes over the step text (FR-007, OQ-6: the bigger pixel source first, e.g. Position's 12.15 px before Rotation's 9.36 px on Comp 1).
  `step_order` with `needs_sweeps` counts only when the fixture carries expression sweeps (see Fixtures). The Comp 1 fixtures do, so case 01's is active; a fixture without sweeps is reported inactive in the dry run.
- `handover`: `[{ turn, skill (the hand-over's command skill), snapshot (the lesson's snapshot tool), mode_source, go_deeper: { skill, step? } }]`: in that (yes) turn `go_deeper` was accepted with these inputs, `Skill` named the lesson, then the snapshot tool replied with this `mode_source`, in that order.
- `no_answer_turns`: turns that must not call `give_answer` (a follow-up is prose).
- `reread`: `[{ turn, of, at_time?, layers? }]` (T078): in `turn` a `describe_layers` call succeeded; `at_time`: one passed the time turn `of`'s last read returned (the fixture reader ignores the requested time, so this pins the call, not the values); `layers`: every layer turn `of`'s steps were on is covered (named, by index, or the whole comp).
- `asked_entry`: `{ count?, said? (true set, false absent), said_never?, skills_include?, after_learning?, went_deeper?: null, goal?: { from_turn?, max_chars?, no_run_of? (words), never_names?, must? } }` over the learner record's `asked` list at the end of the case (data-model § 3). Reports `asked_entry` and, with `goal`, `asked_goal`; an entry holding a `verdict`, `summary` or `question` fails.
- `turn_tools`, `record_text_never`, `say_ends_with`, `say_never_when_called`: shared with the lesson sets (`../lib/phase3-checks.mjs`).
- `turn_first_tool`: `[{ turn, tool }]`.
- `tools_called`, `tools_not_called`: over the whole case.
- `text`: `[{ id, must | never (a regex, case-insensitive; `cs: true` for case-sensitive), turns?, in?: "all" | "explanation" | "steps" | "offer" | "prose", runtimes? }]`.
- `prose_max_sentences`: `[{ id, turns, max }]` over the mentor's prose.

Each case lists the `rubric` items the judge grades (`rubric.md`). A judge reads the item only if every hard check passed.

## Running

From the repo root:

```sh
node product/evals/ask/run.mjs --waive answer_prose_empty --only 01   # diagnostic: that check is reported as waived, never failed (not a bar run)
node product/evals/ask/run.mjs --dry-run                 # free: cases, fixtures, record, rubric items, the tool list
node product/evals/ask/run.mjs --runtime a --dry-run     # free: also starts the A helper (no key, no request)
node product/evals/ask/run.mjs                           # B1, every case (needs ask-mentor built: spec 014 T014)
node product/evals/ask/run.mjs --only 05                 # one case, by id prefix; `--only 1` is 10 to 17
node product/evals/ask/run.mjs --changed                 # skip cases unchanged since their last pass
node product/evals/ask/run.mjs --repeat 3               # each case 3 times; passes on a majority
KNACK_EVAL_API_KEY=… node product/evals/ask/run.mjs --runtime a    # A (paid; T089)
node --test product/evals/ask/test/                      # the checks, the fixtures, the case files: free, no model
```

- The skill under test is `ASK_SKILL` in `run.mjs`; its tool list is read from `.claude/skills/ask-mentor/SKILL.md`.
  Until that file exists, a dry run uses the contract's list and prints `PENDING`; a real run stops. On A, a missing
  SKILL.md is `PENDING` in the dry run, not a failure.
- **Refusals** (plan > Risks): each run prints `refused n/m` (give_answer calls the tool refused, over all of them) and the
  results file has `refusals: { answer_calls, refused, rate, by_code }`. A guard that fires on more than 1 in 10 good
  answers gets loosened. Per case the results hold `refusals_by_code` for each run, and `refusals.by_case` and `refusals.offer_not_ready` (the A-only OFFER_NOT_READY count) summarize the run. The codes read include the five the build added (ANSWER_SHAPE, KIND_MISMATCH, STEP_NEEDS_LAYER, COMP_IS_OPEN, NOT_PLAIN_WORDS). A turn that never gets an accepted answer fails `answer_given` and names the codes.
- **Cost (B1, measured at T037):** about $11 for a full `--repeat 3` run, about $3.70 for a single run. Only
  `--dry-run`, `--only` and `--changed` while working; a full run before a commit that changes the skill or its tools.

## Fixtures

All are built by `node product/evals/ask/fixtures/build.mjs` from spec 015 T015's captures
(`mentor/test/fixtures/expressions/`). Nothing is hand-written; each is a capture or a mechanical change to one.
`test/checks.test.mjs` fails if a file on disk is not what the script would write.

| File | From | Change |
|---|---|---|
| `comp1.json` | `comp1.mjs` (Comp 1) | none. The live capture (spec 015 T015, rebuilt 2026-11-16): 29 layers, 3 expressions, 4 `expression_sweeps` |
| `comp1-two-rocks.json` | Comp 1 | layer 22 (outline.png) becomes Small Rock.png, a visible footage layer (on, full opacity, outline.png's size) with its own two Position keys (copied from Sweep Control), so "the rock" names two layers with different first steps |
| `practice.json` | live capture, Mentor Practice | none |
| `practice-title-locked.json` | `practice.json` | Title's Lock switch on |
| `card-and-glow.json` | planted layers 4 and 18 | renamed Card (two Scale keys) and Glow (`wiggle` expression), comp renamed Intro |
| `matte-eye-off.json` | planted layers 1, 9, 10 | Window Matte (a matte, eye off), Photo (uses it), Ctrl; comp renamed Intro |

The Comp 1 fixtures come from spec 015 T015's live capture, so case 01's `step_order` (hit sizes before the pivot,
TD § 16) is a live check. A new capture only needs `build.mjs` re-run; the case hash changes with the fixture, so `--changed` re-runs it.

## Decisions made building this (2026-11-16)

- **Answer text over free prose.** Checks and judge read the `give_answer` reply (what the panel draws), which
  includes the tool's own normalizations (the not-taught marker). A tool bug that changes a field is seen as the
  learner would see it.
- **A-only expectations are per check, not per case.** `offered_equals` and `text` checks with `runtimes: ["a"]`
  run on A only; `offers_valid` already flips by runtime (empty on B1). No case needed splitting.
- **Case 16 uses a locked layer**, not Collapse: a text or shape layer reads Collapse on by design (2026-10-26), so a
  question about it would test the wrong thing. Collapse is still unpinned.
- **Case 15 asks about two layers** (Logo's one key, Cursor's holds) because the row names both shapes.
- **A reply to a clarifying question is a new answer turn** (09, 10), not prose: FR-014 says it answers after any reply.
- **Case 11 (precomp)** accepts an answer or a describe, never a clarify: the "couldn't see inside" line has to appear.

## Phase 2 additions (2026-11-19, T058)

- **Cases 19 and 20.** Case 19 needs a turn with `"yes": true`, which must be the panel's own request, "Yes, go deeper on [short name].", and the case's `lesson_skill` (`anchor-mentor` or `null-parenting-mentor`); it is `runtimes: ["a"]` and its first A run is T089/T090. Case 20 runs on both runtimes (answer half only).
- **OFFER_NOT_READY.** Pivot and null offers are no longer refused on A, so the A refusal count for those two drops to 0 and `offered_equals` can name `transform.anchor` or `parenting.null`. An offer of the other four skills is still refused until phase 3; no case expects the refusal. The results file's `offer_not_ready` count should stay near 0 for these cases.
- **Where the rest of T058 lives.** The pivot cases (60 to 63), null cases (56 to 58) and next-mentor case 14 are in their own sets. The ask runner can't seed a hand-in, so it has the A-only case; the lesson sets seed the hand-in `go_deeper` would leave (`product/evals/lib/hand-in.mjs`).

## Results

### T037, B1 (2026-11-18, at `91fd9c7`)

`node product/evals/ask/run.mjs --repeat 3` (majority pass): **18/18 (100%), $11.04, no hard-rule (FR-061) check failing.**
Results: `results/2026-11-18-200243.json`. This meets SC-006's B1 half, as the builder accepted. The bar, as spec 014 amendment (h) fixes it for every situation: a whole-set run at `--repeat 3`, a case passes on 2 of 3 runs, at least 80% of cases pass, and every FR-061 hard rule passes on every run.

- **Refusals:** 3 of 60 answer calls (5%, under the 1 in 10 line): STEP_NEEDS_LAYER 2, BAD_CLOSING 1. All three were on case 11, and each passed on retry.
- **Situations 1, 4, 5 (cases 01 to 05):** 02 to 05 passed 3 of 3. 01 passed 2 of 3: its miss was `step_text_order` and `step_order` (the pivot step came first and the Position step was missing). A re-run at the same commit (`results/2026-11-18-123502.json`) passed 3 of 3, so 01 is 5 of 6, accepted, with the ordering miss on the watch list.
- **Watch list (one run missed, majority still passed):** 08 R-PARTLY-OUTSIDE (export filed as "Not something I teach yet" instead of outside); 11 R-ONE-IDEA (the closing offer named skills with no step tags); 12 `never_hidden`; 15 `single_key_said`.
- **Path to the baseline:** first full run 0/18 (plumbing and rubric); second 9/18; 2026-11-17 at `8f5f764` 11/18 single-run (`132826`); at `dd18959` 16/18 repeat-3 (`141138`); then round 5 (fixes (o) to (q): no time worked out from expression text, children named when 5 or fewer, follow-ups at most three sentences), which gave this baseline. Runs flip from one to the next, so the bar is `--repeat 3` with a majority pass.
- **Follow-ups:** case 18's wrapper still quotes "gone in about 1/3 s": it's past screen text, but it no longer matches the worked answer. Add a case for the `over_1px` read once Comp 1 is re-captured live.
