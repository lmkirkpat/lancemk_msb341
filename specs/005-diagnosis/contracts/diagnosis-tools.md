# Contract: the diagnosis tools (`mentor/tools/diagnosis.mjs`)

Three tools in the `ae-mentor` server, found by `mentor/tools/index.mjs`. The file exports `TOOLS`,
`SKILLS = []` (diagnosis isn't a learner-record skill) and no `FINDERS`. Shapes are in
[../data-model.md](../data-model.md). The panel's held diagnosis screens (spec 007 FR-031 to FR-047)
read these replies out of the tool results; they must not rank, filter or count beyond them.

Shared rules for all three:

- **Read-only on the project.** Each calls `takeSnapshot()` at most once and never `runSnippet` with
  `undo: true` or any snippet but `snapshot`. A unit test checks the file imports no demo snippet and
  calls no write snippet (SC-003's structural half).
- **Errors:** `AE_UNREACHABLE`, `AE_BUSY` and `NO_ACTIVE_COMP` pass through unchanged (server rule 2;
  the skill makes no claims). New: `NO_DIAGNOSIS` (check or mark with no diagnosis of this comp),
  `UNKNOWN_FINDING` (a key not in the open diagnosis), `DIAGNOSIS_UNREADABLE` (the file was set aside;
  reported once as `notes_unreadable: true` in the reply, never as a failure).
- **Fixture mode:** works unchanged (`AE_MENTOR_FIXTURE_STATE`), so evals run without AE.
- **Plain output:** every learner-facing string the skill needs comes from `teaching-design.md` via
  the catalogue's wording keys; replies carry keys and data, not sentences.

## `diagnose_comp`

Read the whole active comp and diagnose it. Starts a diagnosis of this comp, or re-reads the open one.

**Input**

| Field | Type | Required | Notes |
|---|---|---|---|
| `symptom_layers` | string[] | no | Layer names, exactly as in a previous result's `layers` or the comp; for FR-008 |
| `symptom_time` | number ≥ 0 | no | Seconds; only with `symptom_layers` |
| `fresh` | boolean | no | Start a new diagnosis of this comp instead of re-reading the open one |

**Reply** (JSON text)

```json
{
  "diagnosis": "id",
  "is_new": true,
  "project": "Claude AE Tutor Test.aep",
  "comp": { "name": "Diagnosis Practice", "duration": 8, "frame_rate": 30 },
  "layers": ["Title", "Subtitle", "CTRL", "…"],
  "symptom_matched": null,
  "top": [ Finding, Finding, Finding ],
  "start_here": "key",
  "start_here_reason": "depth | symptom | only_one | first_non_ask",
  "more": { "count": 6, "ask_count": 2 },
  "rest": [ Finding ],
  "scope": { "set_aside": [], "not_checked": [] },
  "since": null,
  "recommendation": Recommendation,
  "notes_unreadable": false
}
```

- `rest` is always present, so "see the rest" (US1 › 2, spec 007 FR-036) needs no new call.
- Intended findings (FR-016) are left out of `top` and `rest` and counted in `since.intended`.
- An empty `top` means nothing was found (FR-009); `scope` is still filled.

**Annotations**: `readOnlyHint: true` (it writes only the learner home's `diagnosis.json`).

## `check_finding`

The learner says "done" on one finding. Re-reads the comp (FR-014: never an earlier read).

**Input**: `{ "finding": "key" }` (required).

**Reply**

```json
{
  "diagnosis": "id",
  "finding": "key",
  "result": "fixed | still | changed | unmatched",
  "now": Finding | null,
  "also_fixed": ["key"],
  "still_open": [ Finding ],
  "new_findings": [ Finding ]
}
```

- `also_fixed` credits anything else that went away (edge case: fixing something other than the
  chosen finding). `new_findings` lists findings that weren't there before, without calling them
  mistakes.
- An undone fix shows as `still` on the chosen finding, or as `open` again in `still_open` for another.

**Annotations**: `readOnlyHint: true`.

## `mark_intended`

The learner says a finding is on purpose (FR-016, US2 › 5).

**Input**: `{ "finding": "key" }` (required).

**Reply**: `{ "diagnosis": "id", "finding": "key", "intended": true, "still_open": [ Finding ] }`.

- Writes the mark to `diagnosis.json` for this project and comp only; with US3, to the record too.
- No snapshot is taken: the mark is about the learner's intent, not the comp.

**Annotations**: `readOnlyHint: true` on the project; `destructiveHint: false`.

## What the panel can rely on (for spec 007's held screens)

| Screen (spec 007) | Comes from |
|---|---|
| `diag-results` top 3, Start here, "See the other N" | `top`, `start_here`, `more` |
| `diag-rest` | `rest` (no new turn) |
| Finding kind glyph and word | `Finding.kind` |
| Learn: skill › / No lesson yet · Get hints › | `Finding.skill` (`built` false or null → hints) |
| That's on purpose | `Finding.kind` is `style` or `ask` |
| Couldn't check | `scope` |
| `diag-recheck-gone/-still/-changed` | `check_finding.result`, only from a call in the same turn |
| `diag-intended` | `mark_intended` |
| `diag-again`, `diag-othercomp` | `since`, and `comp.name` against the remembered comp |
| "Looked only: no changes were made." | Every tool in the turn is one of these three, `preview_frame`, `read_learner_record` or `recommend_next` (spec 007 FR-044's list, panel-builder's) |
