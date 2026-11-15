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
| `comp` | string \| null | Set by the tool from the session's last read, never by the model. `null` for `no_comp` and when no read ran (`outside`, `howto`) |
| `explanation` | string | The mentor's words for part 1: one or two sentences, or a lead line and up to four `- ` bullets. No numbers, no "Steps:" (FR-004, FR-009) |
| `steps` | array, 0 to 4 | Each `{ text, skill, layer }`. `skill`: a skill ID, `"not_taught"`, or `null` (an untagged look or playback step, PQ-5). `layer`: a layer name from the last read, or `null` |
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
| `project`, `comp` | string | From the session's last read, never the model |
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

## 4. Hand-in slice and hand-back (contract: [contracts/hand-in.md](contracts/hand-in.md))

- Snapshot reply (each hand-in-ready skill): `mode_source: "hand_in"`, and
  `hand_in: { layer, step_number, steps_after: [text], place_named, practice: bool }`. `practice` is true
  when the skill is learned (the lesson's wording follows FR-023).
- `record_lesson` reply, for a lesson started from a hand-in: `hand_back: { step_number, next_step: text |
  null }`. `null` when the go-deeper step was the last.

## 5. `motion_from` in the other four snapshot tools (FR-033, phase 3)

Spec 015 data-model § 4's shape, unchanged, added to the focus and candidate layers of `snapshot_project`
(easing), `key_types_snapshot`, `speed_graph_snapshot` and `offset_snapshot` (spec 015 OQ-3).

## 6. Health check (`bridge/cep/host.js`, research R10)

`GET /health` adds `comp_active: true | false | null`. Nothing else about the project: no name, id or
count (constitution II, 1.5.0).

## 7. Panel

### AskView (`panel/lib/ask-result.js`)

From one `give_answer` tool result: `{ kind, explanation, steps: [{ number, text, tag | null,
not_taught: bool }], offers: [{ skill, tag }], closing_offer }`, or **`null`** when the result is missing,
not JSON, has an unknown `kind`, more than 4 steps, more than 2 offers, an offer not among the steps'
skills (outside `howto`), or a field of the wrong type. `null` means FR-048's fallback: the mentor's words
as they came, no STEPS, no dock, no Go deeper. On a `b1` panel, `offers` is always `[]`.

### Thread (`panel/lib/ask-thread.js`, saved in `panel-session.json` version 3)

`{ id, questions: [{ text, at, view: AskView | null, prose | null, folded }], latest_steps: [step] | null,
deeper: null | { skill, tag, step_number, state: "starting" | "open" | "passed" | "ended", layer },
steps_open_once: bool }`. `latest_steps` is the last answer's steps, or `null` when it had none (MU
`ask-new-question`: the dock goes away).

### Turn log line (research R11)

Adds `thread: "ask"` (optional) and kinds `question`, `followup`, `go_deeper` to today's line.

## 8. Error codes (new; plain messages, no field names)

| Code | Tool | Message (to the mentor) |
|---|---|---|
| `TOO_MANY_STEPS` | give_answer | "Give at most four steps; give the first three and say there's more in the closing offer." |
| `BAD_STEP_SKILL` | give_answer | "Each step's skill must be a skill, not taught, or none." |
| `BAD_OFFER` | give_answer | "Offer at most two skills, each one a step uses." |
| `BAD_CLOSING` | give_answer | "End on one question that hands the choice back." |
| `COMP_NOT_NAMED` | give_answer | "Start with the comp you read: In [comp], …" |
| `STEPS_IN_EXPLANATION` | give_answer | "Leave the steps out of the explanation; they go only in the steps." |
| `KEYFRAME_SKILL_ON_KEYLESS` | give_answer | "That layer's motion has no keys, so a keyframe skill can't help with it." |
| `ROUTE_TO_PIVOT` | give_answer, go_deeper | "That null already carries children; moving where it turns is Set the pivot." |
| `OFFER_NOT_READY` | give_answer, go_deeper | "That lesson can't start from an answer yet; keep the step and leave out the offer." |
| `NOT_ACTIONABLE` | give_answer | "A question back, an outside line or no comp has no steps and no offer." |
| `NOT_OFFERED` | go_deeper | "Only a skill the last answer offered can start from it." |
| `NOT_ON_THIS_RUNTIME` | go_deeper | "The lesson can't start from here. Say so in one sentence and name where to start it." |
| `NO_ANSWER` | go_deeper, note_said | "There's no answer in this session yet." |
| `RECORD_UNATTRIBUTED` | record_lesson | "The record says the learner changed something no check saw them change. Say only what a check saw or they said." |
