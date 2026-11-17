# Ask evals

The eval set for `/ask-mentor` (spec 014, T031 to T033; FR-061; teaching design § 17). It scores whether the
mentor *teaches* well when a learner asks about their own open comp: it reads first, answers on the layer that
makes the motion, says what it read and what it didn't, puts steps in the learner's hands, hands the choice back,
and leaves the project alone. It runs the real skill and server in headless Claude Code against saved snapshots,
so **After Effects doesn't need to be open**. Whether the reads are *correct* is spec 015's unit tests.

Written 2026-11-16 and **dry-run only**: nothing here has been run, and `ask-mentor` (spec 014 T014) and its
tools `describe_layers` and `give_answer` don't exist yet. T037 is the first run, at the phase 1 merge commit.

## Cases

18 cases. All run on B1 and A (no case sets `runtimes`); the A-only expectations are individual checks.

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

Not in this set (they need later phases): situations 2, 3, 8, 16, 17, 18 and 19 of § 17 (turn 4's fresh read,
the padded PNG, "just the steps", the hand-in, the record entry, a learned skill as practice, a change on the
wrong layer). Case numbers 01 to 17 are the cockpit's; the next case takes 19. Case 18's wrapper is written out in full in the case file, from the contract; when the panel adds the wrapper's first line to `REQUESTS`, its sync test should pin case 18's first line to it.

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
- **only_ask_tools**: `describe_layers`, `preview_frame` and `give_answer` only.
- **no_project_change**: no demonstration, no `set_*`, no `pan_*`, no `record_lesson`.
- **no_lesson_started**: no `Skill`, no `go_deeper`, no snapshot or `recommend_next` call. This set never says yes.
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

- `answers`: `[{ turn, kind (a string or a list), steps: [min, max], no_keyframe_skills, step_skills_include, step_skills_forbid, offered_equals (A only), step_on_layer, max_sentences: [{ field: "explanation"|"closing_offer", max }], step_order: [{ id, first, then, needs_sweeps }], step_text_order: [{ id, first, then, needs_sweeps }] }]`.
  `step_order` compares step skill tags; `step_text_order` compares regexes over the step text (FR-007, OQ-6: the bigger pixel source first, e.g. Position's 12.15 px before Rotation's 9.36 px on Comp 1).
  `step_order` with `needs_sweeps` counts only when the fixture carries expression sweeps (see Fixtures). The Comp 1 fixtures do, so case 01's is active; a fixture without sweeps is reported inactive in the dry run.
- `no_answer_turns`: turns that must not call `give_answer` (a follow-up is prose).
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
- **Cost estimate (B1, full run, not measured):** 21 mentor turns and 18 judge calls, about $6 to $9. Only
  `--dry-run`, `--only` and `--changed` while working; one full run at the phase 1 merge commit (T037).

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

## Results

None yet.
