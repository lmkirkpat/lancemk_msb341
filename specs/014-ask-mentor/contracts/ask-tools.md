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

**Does, in order:**
1. Reads the session's last read (comp name, project, layers, the motion-sources map). With none (`howto`,
   `outside`, `no_comp`), `comp` is `null`.
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
