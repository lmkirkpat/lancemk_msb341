# Contract: the ask tools (spec 014)

Three tools in `mentor/tools/ask.mjs` (TOOLS only: no SKILLS, no FINDERS). None runs a snippet that
changes the project, the selection, the playhead or the active comp (FR-002); each is tested for that.
`ask-mentor`'s `allowed-tools` (FR-057): `describe_layers` (spec 015), `preview_frame`, `give_answer`,
`go_deeper` (phase 2), `note_said` (phase 3), `Skill` (phase 2; B1 drops it as today).

The server's existing rules and codes apply (`AE_UNREACHABLE`, `AE_BUSY`, `NO_ACTIVE_COMP`; ae-mentor rule 2).
Shapes are in [data-model.md](../data-model.md) § 1, § 2, § 8.

## `give_answer` (phase 1)

**When:** once per answer turn, as the turn's last call, after `describe_layers` (or after its
`NO_ACTIVE_COMP`). The turn has no other prose (PQ-1, research R2).

**Input:** `kind`, `explanation`, `steps` (`[{ text, skill, layer }]`), `offered_skills`, `closing_offer`,
`goal` (optional; general motion terms, required in phase 3 when `kind` is `answer`).

*Clarified 2026-11-16 (f), from the T037 triage (FR-008, FR-018; data-model § 1):* `closing_offer` is required
for `answer`, `describe`, `howto` and `outside`, and `null` only for `clarify` and `no_comp`. `outside` has no
offered skills, but its closing sentence says what the mentor does cover.

**Does, in order:**
1. Takes its own snapshot of the active comp for each answer about a comp (`answer`, `describe`, `clarify`,
   `no_comp`), and takes the comp name, project, layers and the motion-sources map from it. *Amended
   2026-11-16 (b):* it never uses "the session's last read": `describe_layers` doesn't write to the session
   (spec 015 FR-019, FR-020; a 015 test checks it), so there is none. Reading again also catches a comp
   switched between the mentor's read and its answer (`COMP_NOT_NAMED`). A `NO_ACTIVE_COMP` from this read
   makes a `no_comp` answer valid; `AE_UNREACHABLE` and `AE_BUSY` stay errors. `howto` and `outside` read
   nothing, and `comp` is `null`.
2. Checks the rules in research R3 and refuses the first that fails, with its code; nothing is saved.
3. On B1, keeps the checked offer for the record of the call but returns `offered_skills: []`.
3a. Normalizes each not-taught step (amended 2026-11-14, T035 design review): a step whose `skill` is "not
   taught yet" gets "Not something I teach yet." appended to its `text` if the text doesn't already end with it.
   The panel draws no separate tag for it, so this sentence is the only marker and must never be missing.
4. Saves `session.ask` (data-model § 2) for `answer`, `describe` and `howto`.
5. Phase 3: for `answer`, writes one asked entry (data-model § 3) and links it.

**Reply:** the accepted fields (data-model § 1) plus `runtime` and `tags`. Short: no read data echoed.

**Never:** accepts a step list in `explanation`; offers more than two skills; offers a skill no step uses
(except PQ-4's `howto`); changes AE.

### Refusals

Each refusal returns its code and a plain message (data-model § 8); nothing is saved, and the mentor tries
again. The codes in research R3: `TOO_MANY_STEPS`, `BAD_STEP_SKILL`, `BAD_OFFER`, `BAD_CLOSING`,
`COMP_NOT_NAMED`, `STEPS_IN_EXPLANATION`, `KEYFRAME_SKILL_ON_KEYLESS`, `ROUTE_TO_PIVOT`, `OFFER_NOT_READY`,
`NOT_ACTIONABLE`. *Added 2026-11-16 (b), five more the build added (`mentor/lib/ask-answer.mjs`, T013):*

| Code | Refused when |
|---|---|
| `ANSWER_SHAPE` | A field is missing or has the wrong type (an empty explanation; the steps or offered skills not a list; a step's text, a step's layer, an offered skill, the closing offer or the goal not text), or `kind` isn't one of the six kinds |
| `KIND_MISMATCH` | An `answer` with no steps, or a `describe` or `howto` with steps |
| `STEP_NEEDS_LAYER` | A step is tagged with a skill but names no layer (a not-taught or untagged step may have none) |
| `COMP_IS_OPEN` | A `no_comp` answer while the read found a comp open |
| `UNKNOWN_LAYER` | *(added 2026-11-16 (d), from the build, `mentor/lib/ask-answer.mjs`)* A step names a layer that `give_answer`'s own read doesn't find in the comp |
| `NO_ACTIVE_COMP` | *(added 2026-11-16 (d), from the build)* An answer about a comp (`answer`, `describe`, `clarify`), but `give_answer`'s own read finds no comp active |
| `NOT_PLAIN_WORDS` | The explanation, a step or the closing offer holds code, a backtick, a skill ID, or an underscore name from tool output. Names from the learner's own comp (the comp, its layers and their effects) are exempt, underscores and all |

*Added 2026-11-16 (d):* `COMP_NOT_NAMED` and `NO_ACTIVE_COMP` from `give_answer` mean the comp changed between
the mentor's read and its answer. The mentor then reads again before answering, and never answers from the
earlier read.

## `go_deeper` (phase 2)

**When:** the learner says yes to the offer (typed, or the panel's "Yes, go deeper on [short name].");
"show me" counts as yes (FR-020).

**Input:** `skill` (ID or short name), `step` (the step number it goes deeper on; optional when one step
has that skill).

**Does:**
1. B1: refuses `NOT_ON_THIS_RUNTIME`; the mentor says TD § 7.1's B1 line, naming the skill, never a
   command, and nothing hands over.
2. Refuses `NO_ANSWER`, `NOT_OFFERED` (not in `session.ask.offered_skills`), `OFFER_NOT_READY`,
   `ROUTE_TO_PIVOT`.
3. Saves `session.hand_in` (data-model § 2).
4. Phase 3: sets `went_deeper` on the linked asked entry.

**Reply:** `{ skill_name, short_name, command_skill (the *-mentor name for the Skill call), practice:
bool, missing_prerequisite: skill_name | null }`. The mentor names a missing prerequisite in one sentence
(FR-023) and then calls `Skill` with `command_skill`. It never says the name to the learner.

## `note_said` (phase 3)

**When:** the learner says how the steps went ("that worked", "the steps didn't help"). Not for questions.

**Input:** `said` (≤ 120 characters, general terms, as the learner's).

**Does:** sets `said` on the latest asked entry; personal-detail check; `NO_ANSWER` without one.
Reply: `{ saved: true }`.

## Tests (each tool)

- Read-only: a fake bridge records every snippet; none is a write snippet.
- The § 16 answer, as data, on spec 015's Comp 1 capture: accepted; reply equals the input plus `comp`,
  `runtime`, `tags`; on B1 `offered_skills: []`.
- One refusal per row of research R3, each from a minimal change to the § 16 answer.
- `go_deeper`: each refusal; on A, the hand-in saved with no learner words.
