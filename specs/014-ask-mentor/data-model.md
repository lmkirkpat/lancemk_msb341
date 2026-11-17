# Data model: Ask the mentor (spec 014)

Shapes, not code. Field names are internal: no reply may show one to the learner (ae-mentor rule 5), and
no panel copy names one (FR-053). "Not read" stays explicit, as spec 015's data model says. Spec 015's
shapes (`describe_layers`, the motion-sources map, `motion_from`) are used as they are and not repeated.

## 1. Asked result (`give_answer`, spec Key Entities)

The call's input and the tool's reply have the same fields; the reply holds what the tool accepted
(normalized), and that's what the panel draws.

| Field | Type | Notes |
|---|---|---|
| `kind` | `answer` \| `describe` \| `howto` \| `clarify` \| `outside` \| `no_comp` | **Added by the plan** (spec allowed renames with a reason): lets the panel pick `ask-answer`, `ask-new-question`, `ask-clarify`, `ask-outside`, `ask-nocomp` without reading words. `describe` = a describe-the-comp answer with no steps (US1 scenario 2) |
| `comp` | string \| null | Set by the tool from its own read of the active comp, taken for each answer (contracts/ask-tools.md step 1; *corrected 2026-11-16 (b)* from "the session's last read"), never by the model. `null` for `no_comp` and when no read ran (`outside`, `howto`) |
| `explanation` | string | The mentor's words for part 1: one or two sentences, or a lead line and up to four `- ` bullets. No numbers, no "Steps:" (FR-004, FR-009) |
| `steps` | array, 0 to 4 | Each `{ text, skill, layer }`. `skill`: a skill ID, `"not_taught"`, or `null` (an untagged look or playback step, PQ-5). `layer`: a layer name from the last read, or `null`. **Normalized in the reply:** a `"not_taught"` step's `text` ends with "Not something I teach yet.", appended by the tool when missing (contracts/ask-tools.md step 3a, FR-006); the panel draws no tag for it, so this sentence is its only marker |
| `offered_skills` | array, 0 to 2 | Skill IDs, each among the steps' skills (PQ-4: a `howto` may carry one with no steps). **Always `[]` in the reply on B1** (FR-017, research R4) |
| `closing_offer` | string \| null | One sentence; a question when there are steps or an offer. `null` only for `clarify` (the question is the explanation) and `no_comp` |
| `runtime` | `a` \| `b1` | Reply only. For the panel's display guard and the eval runner |
| `tags` | object | Reply only: `{ [skill ID]: short name }` for every skill in `steps` and `offered_skills`, from `path.json`'s `short_name` (FR-021), so the panel and the evals use one source |

`kind` rules: `answer` needs at least one step; `describe` and `howto` have none; `clarify`, `outside` and
`no_comp` have no steps and no offer (FR-014, FR-016). Contract: [contracts/ask-tools.md](contracts/ask-tools.md).

## 2. Session additions (`session.json`, `mentor/lib/session.mjs`)

Additive; the existing `lessons`, `current` and `review_offers` keep their shapes.

### `ask` (the latest answer; one per session file)

`{ at, comp_id, project, comp, kind, steps: [{ text, skill, layer }], offered_skills, goal, entry_date |
null, started_at }`

- Written by `give_answer` for `answer`, `describe` and `howto`. `started_at` is the first ask's time in the
  session window and stays until the window lapses (FR-032's test, phase 3).
- `goal` is `give_answer`'s optional `goal` input (general motion terms; checked like a record field) and
  is used only by the hand-in and the asked entry.
- `entry_date` links to the asked entry written for this answer (phase 3), so `go_deeper` and `note_said`
  update the right one.

### `hand_in` (K6; research R5)

`{ skill, comp_id, layer, step_number, steps, goal, place_named, at, used: false }`

- Written by `go_deeper`. Taken once by that skill's snapshot tool on the same comp (`used: true`); lapses
  after the session window. No learner words (FR-045).
- Confirmed 2026-11-16 (T002, research R5): a `session.json` value written before the helper's `Skill` switch
  is read after it, so the hand-in survives the hand-over as designed.

### `attributed` (K5; research R9, phase 3)

`[{ layer, property | null, at }]` on the current lesson: every change a check reported as the learner's.
`record_lesson` reads it.

## 3. Asked entry (learner record, phase 3; research R8)

A new top-level list `asked` in `learner.json`, beside `skills` and `lessons`. Version stays 1; a record
without the key reads as `asked: []`.

| Field | Type | Notes |
|---|---|---|
| `kind` | `"asked"` | |
| `date` | ISO time | Set by the tool |
| `project`, `comp` | string | From `give_answer`'s own read (*corrected 2026-11-16 (b)*), never the model |
| `layers` | string[] | The steps' layers, de-duplicated; personal-detail check on each |
| `goal` | string | General motion terms (≤ 120 characters); never the question (FR-040); personal-detail check |
| `skills` | string[] | Skill IDs the steps referenced (tags and offers) |
| `after_learning` | string[] | The subset already `learned` when asked; set by the tool from the record (FR-041) |
| `went_deeper` | string \| null | Skill ID; set by `go_deeper`, not the model |
| `said` | string \| absent | Set only by `note_said`, in general terms, stored as said ("said the steps worked"); personal-detail check |
| `raised` | ISO time \| absent | Set when `recommend_next` raises it (FR-042: once per entry) |

Never: `summary`, a verdict, expression or error text, effect names, the learner's sentence. Only answers
with steps (`kind: "answer"`) write an entry (FR-038). No skill's `status`, `times_passed`, `review_due` or
`reviews_passed_in_row` changes (FR-039).

A go-deeper lesson on a learned skill is a lesson entry of kind `practice` (not `review`), and keeps the
skill's `status`, `review_due` and `reviews_passed_in_row` (FR-023). Confirmed in today's code 2026-11-16
(T003, research R18); a skill marked learned only by hand, with no lesson entries, logs `first` instead (a
`todo` in that test; the schedule is still kept).

## 4. Hand-in slice and hand-back (contract: [contracts/hand-in.md](contracts/hand-in.md))

- Snapshot reply (each hand-in-ready skill): `mode_source: "hand_in"`, and
  `hand_in: { layer, step_number, steps_after: [text], place_named, practice: bool }`. `practice` is true
  when the skill is learned (the lesson's wording follows FR-023).
- `record_lesson` reply, for a lesson started from a hand-in: `hand_back: { step_number, next_step: text |
  null }`. `null` when the go-deeper step was the last.

## 5. `motion_from` in the other four snapshot tools (FR-033, phase 3)

Spec 015 data-model § 4's shape, unchanged, added to the focus and candidate layers of `snapshot_project`
(easing), `key_types_snapshot`, `speed_graph_snapshot` and `offset_snapshot` (spec 015 OQ-3).

## 6. ~~Health check~~ (withdrawn 2026-11-16; research R10)

No change to `GET /health`. The planned `comp_active: true | false | null` was dropped with FR-047: T001 found
a "no" wrong whenever the learner last clicked footage or an empty spot in the Project panel
([`ask-build.md`](../../discovery/usage-notes/ask-build.md) › T001). The bridge carries nothing about the
project to the panel (constitution II, 1.6.0). No comp at ask time is the mentor's `no_comp` answer (§ 1).

## 7. Panel

### AskView (`panel/lib/ask-result.js`)

From one `give_answer` tool result: `{ kind, explanation, steps: [{ number, text, tag | null,
not_taught: bool }], offers: [{ skill, tag }], closing_offer }`, or **`null`** when the result is missing,
not JSON, has an unknown `kind`, more than 4 steps, more than 2 offers, an offer not among the steps'
skills (outside `howto`), or a field of the wrong type. `null` means FR-048's fallback: the mentor's words
as they came, no STEPS, no dock, no Go deeper. On a `b1` panel, `offers` is always `[]`.

### Thread (`panel/lib/ask-thread.js`, saved in `panel-session.json` version 3)

`{ id, questions: [{ text, kind, at, view: AskView | null, prose | null, folded, answered, notice }],
latest_steps: [step] | null, deeper: null | { skill, tag, step_number, state: "starting" | "open" | "passed" |
"ended", layer }, steps_open_once: bool }`.

Each thread entry (added 2026-11-16 from the panel build, T035 review):
- `kind`: `question` | `followup` | `go_deeper` (the turn log's kinds, research R11). A new `question` folds
  the entries before it; a follow-up or Go deeper press stays in view with the answer it follows.
  *Added 2026-11-16 (spec amendment (d)):* a follow-up whose `give_answer` result has kind `answer`,
  `describe` or `howto` becomes `question` (folds the earlier entries; Go deeper acts on it), from the tool's
  data, never the prose. Starting another lesson ends the thread's conversation but keeps the thread's last
  question, answer and `latest_steps` saved and visible, and Back to your question still opens them (research
  R12); nothing is deleted.
- `answered`: whether the turn has ended; Try again resets it to `false`.
- `notice`: `null` | `{ title | null, text }`, a passing error shown on the latest entry ("Your question's
  still here."); cleared by Try again.

The build also keeps `version`, `claude_session_id` and `started_at` on the thread (bookkeeping for the saved
session). `latest_steps` is the last answer's steps, or `null` when it had none (MU
`ask-new-question`: the dock goes away).

### Turn log line (research R11)

Adds `thread: "ask"` (optional) and kinds `question`, `followup`, `go_deeper` to today's line.

## 8. Error codes (new; plain messages, no field names)

*Added 2026-11-16 (d):* `COMP_NOT_NAMED` or `NO_ACTIVE_COMP` from `give_answer` means the comp changed between
the mentor's read and its answer; the mentor reads again before answering (contracts/ask-tools.md › Refusals).

| Code | Tool | Message (to the mentor) |
|---|---|---|
| `TOO_MANY_STEPS` | give_answer | "Give at most four steps; give the first three and say there's more in the closing offer." |
| `BAD_STEP_SKILL` | give_answer | "Each step's skill must be a skill, not taught, or none." |
| `BAD_OFFER` | give_answer | "Offer at most two skills, each one a step uses." |
| `BAD_CLOSING` | give_answer | "End on one question that hands the choice back." |
| `COMP_NOT_NAMED` | give_answer | "Start with the comp you read: In [comp], …" |
| `UNKNOWN_LAYER` | give_answer | *(added 2026-11-16 (d), from the build, `mentor/lib/ask-answer.mjs`)* A step names a layer the answer's own read doesn't find in the comp. Message as the build words it |
| `NO_ACTIVE_COMP` | give_answer | *(added 2026-11-16 (d), from the build)* The answer is about a comp, but its own read finds none active (a `no_comp` answer is the valid one). Message as the build words it |
| `STEPS_IN_EXPLANATION` | give_answer | "Leave the steps out of the explanation; they go only in the steps." |
| `KEYFRAME_SKILL_ON_KEYLESS` | give_answer | "That layer's motion has no keys, so a keyframe skill can't help with it." |
| `ROUTE_TO_PIVOT` | give_answer, go_deeper | "That null already carries children; moving where it turns is Set the pivot." |
| `OFFER_NOT_READY` | give_answer, go_deeper | "That lesson can't start from an answer yet; keep the step and leave out the offer." |
| `NOT_ACTIONABLE` | give_answer | "A question back, an outside line or no comp has no steps and no offer." |
| `ANSWER_SHAPE` | give_answer | "Give the answer as the tool describes it: a kind, an explanation, the steps as a list, the offered skills as a list, and a closing offer." *(added 2026-11-16 (b), from the build)* |
| `KIND_MISMATCH` | give_answer | "An answer has one to four steps; a description or a how-to has none. Pick the kind that fits." *(added 2026-11-16 (b))* |
| `STEP_NEEDS_LAYER` | give_answer | "A step tagged with a skill names the layer it's on, exactly as it appears in the comp." *(added 2026-11-16 (b))* |
| `COMP_IS_OPEN` | give_answer | "A comp is open, so read it and answer about it." *(added 2026-11-16 (b))* |
| `NOT_PLAIN_WORDS` | give_answer | "Say it in plain words: no code, no backticks, and no names from tool output; name a skill by its short name." *(added 2026-11-16 (b))* |
| `NOT_OFFERED` | go_deeper | "Only a skill the last answer offered can start from it." |
| `NOT_ON_THIS_RUNTIME` | go_deeper | "The lesson can't start from here. Say so in one sentence and name where to start it." |
| `NO_ANSWER` | go_deeper, note_said | "There's no answer in this session yet." |
| `RECORD_UNATTRIBUTED` | record_lesson | "The record says the learner changed something no check saw them change. Say only what a check saw or they said." |
