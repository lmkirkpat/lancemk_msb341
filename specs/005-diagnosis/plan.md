# Implementation Plan: Diagnosis ("what's wrong here?")

**Branch**: `005-diagnosis` (spec folder only; no git branch) | **Date**: 2026-11-09 |
**Spec**: [spec.md](spec.md) (approved 2026-10-20; amended and all questions resolved 2026-11-09)

**Input**: Feature specification from `specs/005-diagnosis/spec.md`.

**Status**: Approved by the builder 2026-11-09 with [tasks.md](tasks.md), all five plan questions answered as
recommended (research R9, R14, R15, R16; spec › Amendment 2026-11-09). Nothing here is built.

## Summary

Diagnosis reads the whole active comp once, compares things with each other (durations across layers,
properties within a layer, a child against its parent, the comp's length against when motion stops),
and returns a ranked, deterministic list of findings plus what it couldn't see. The model then leads:
at most 3 up front, one place to start, and the learner fixes it with their own hands or is handed to
the skill that teaches it. The approach (research R1 to R16):

- **One new tool file, no new reads for US1.** `mentor/tools/diagnosis.mjs` adds three read-only
  tools: `diagnose_comp`, `check_finding` and `mark_intended`. They call the same `takeSnapshot()`
  every skill uses. Since the spec was written, spec 004 wave B added the reads US4 was waiting for
  (parent, per-layer motion blur, track matte, in and out points, solo, shy, guide; research R1). The
  shared `timing.mjs` was written "for skill 3 and spec 005", and `motion-sources.mjs` already walks
  parent chains. Diagnosis applies its own thresholds on top of them. The one new read is the comp's
  own motion blur switch (US4, one line in `snapshot.jsx`).
- **The analysis is pure and lives in `mentor/lib/`**: the nine DX detectors, the not-checked list,
  ranking, finding identity across reads (fixed, still there, changed), and the recommendation of
  what to learn next. Same snapshot in, same findings out (FR-003), so saved snapshots with answer
  keys prove it (SC-001).
- **The catalogue is data**: `mentor/curriculum/diagnosis.json` holds each DX kind's thresholds,
  rank weight and the wording keys from the curriculum designer's `teaching-design.md`, and a test
  checks the two agree, the same way `path.json` mirrors `curriculum.md`. The skill map is the
  `findings` block that `path.json` already has (FR-010), so there's no second map.
- **A new skill, `/diagnose-mentor`**, with only the three diagnosis tools, `preview_frame`,
  `read_learner_record` and `Skill` in `allowed-tools`. No demonstration tool and no `after-effects`
  tool can be called, so "diagnosis never changes the project" (FR-011, SC-003) is enforced by the
  tool list, not the prompt. It hands over to a lesson the way `/next-mentor` does: for real on A,
  and on B1 it stops at the offer and the panel sends the follow-on request (spec 013 research R6).
- **Memory in the tools, not the model**: an open diagnosis per comp, with its intended marks, lives in
  `diagnosis.json` in the learner home (US1, US2). With US3, each complete read also writes the comp's
  entry to a new top-level `diagnoses` array in `learner.json` (the room spec 004 research R3 left for
  it), from tool state only: IDs, layer and property names, times, states, and the recommendation.
  There's no free text, so no method, motive or personal details can get in (FR-017, FR-018). Skill
  status is never touched (FR-021).
- **Evals**: a new set, `product/evals/diagnosis/` (eval-engineer), built to the spec's 15-case
  outline on saved snapshots taken from live reads; the easing set re-run to show nothing moved.

**Why this is worth building** (spec › Why, CLAUDE.md › Next steps 4): Adobe's lead is breadth, and
it came from reading the whole comp, which per-skill, per-pair checks can't produce. This plan builds
that reading as its own capability. What stays hard for Adobe to copy is built into it: **depth**
(DX-01 is graded per pair from the real ease, which Adobe said it couldn't read), **memory**
(findings carry across sessions and a repeated kind becomes a pattern), and **practice** (a finding
leads into the skill lesson that teaches its fix, or into a review if it's already learned).
Restraint and leading are kept too, but they're product choices Adobe could copy with a mode switch.

## Technical Context

**Language/Version**: JavaScript, ES modules, Node 18+ (`mentor/`, as today); ExtendScript (ES3) for
the one line added to `mentor/jsx/snapshot.jsx` in US4.

**Primary Dependencies**: none new. `mentor/` stays Node built-ins only. Reuses `mentor/lib/snapshot.mjs`,
`timing.mjs`, `analyze.mjs` (`segments`, `segmentState`), `motion-sources.mjs`, `visibility.mjs`,
`layer-info.mjs`, `path.mjs`, `learner-store.mjs`, `reviews.mjs`.

**Storage**: the learner home (`~/Library/Application Support/AEMentor/` or `AE_MENTOR_HOME`):
- `learner.json` gains a top-level `diagnoses` array with US3, version stays 1 (spec 004 research R3; the
  panel's `memory.js` accepts any record with `skills` and `lessons`).
- New `diagnosis.json`: the last diagnosis per comp and its intended marks, which last for that comp (FR-016).
  Spec 006's uninstall must cover it (task T055).

**Testing**: `node:test` in `mentor/test/` (skill-builder) on saved snapshots with answer keys, one per
DX kind and one per overlap row (FR-024); `product/evals/diagnosis/` (eval-engineer) for teaching
quality (FR-025); live usage sessions by the builder (SC-002, SC-004, SC-007). No eval runner, mentor
test suite or heavy job was run while writing this plan.

**Target Platform**: macOS, After Effects 26.5 (CLAUDE.md › My setup); Claude Code (B1) and the panel
on B1 for building, the helper on A to ship (`decisions/011`).

**Project Type**: new tools and a new skill in the existing `ae-mentor` MCP server.

**Performance Goals**: the first finding shown within 30 s of asking, in at least 9 of 10 turns
(SC-004). One snapshot takes about 0.2 s (spec 004 live sitting), and the analysis is milliseconds, so
the budget is the model's.

**Constraints**:
- Read-only on the project in every step (FR-002, FR-011). There's no open-ended script, and no write
  snippet is reachable from the diagnosis tools.
- The server's `INSTRUCTIONS` stay byte-for-byte as they are, so the six existing eval sets keep
  describing what runs (research R12). Diagnosis's own rules live in its `SKILL.md` and tool
  descriptions.
- `mentor/**` is add-only shared code (`ownership.json` › `addOnly`). Changes to existing files are
  limited to three, each named and done by the cockpit's `--shared-owner` branch: `learner-store.mjs`
  (one export, US3), `snapshot.jsx` (one comp field, US4) and `next-mentor/SKILL.md` (its trigger
  line, FR-026).
- One AE sitting at a time (`decisions/008`). Live captures and usage sessions hold the AE lock.

**Scale/Scope**: one learner, one active comp, up to about 100 layers (an analysis linear in keys).
About 6 new `mentor/lib` modules, 1 tool file, 1 data file, 1 skill, 1 dev build script, 3 shared
edits, 1 eval set of at least 15 cases.

## Constitution Check

*GATE: must pass before Phase 0 research. Re-checked after Phase 1 design.* Constitution 1.4.0.

| Principle | Check | Pre-research | Post-design |
|---|---|---|---|
| I. Spec Before Build | Spec 005 approved 2026-10-20. Spec question 4 resolved 2026-11-09 (a `teaching-design.md`: yes): T001 writes it before any wording reaches `SKILL.md` or the catalogue. Q1 gates US3 only (research R15). The spec's stale facts are amended in the spec itself (Amendment 2026-11-09, T053), not silently overridden | ✅ | ✅ |
| II. Decisions Are Recorded | Relies on **`decisions/002`** (the bet; Adobe trigger), **`003`** (thin bridge, narrow tools, local learner record: one comp field added to the existing snapshot, three narrow read-only tools, no script tool), **`005`** (the panel only displays: no diagnosis logic in `panel/`, FR-023), **`007`/`008`** (owners, hooks, one agent on AE), **`010`** (on A the helper starts `ae-mentor` over stdio, so the new tools reach A unchanged), **`011`** (build on B1, ship on A: moving to A below). No new decision needed. Writing the record from the tools on every complete read (research R9) was approved 2026-11-09; spec 007's held edge case "FR-017 writes only at the end of a diagnosis" is amended to match by T054 | ✅ | ✅ |
| III. Teaching Quality Is Evaluated | New set `product/evals/diagnosis/` (≥ 10 cases, SC-006) scoring leads, restraint and honesty as well as correctness; easing set re-run to stay within one case of its baseline (27/28, 2026-10-29) | ✅ | ✅ |
| IV. Privacy by Default | The diagnosis record has no free-text field: every value comes from tool state, and layer and property names are checked with the record's existing email and phone test (`UNSAFE_RECORD`). Fixtures are captures of the builder's practice comps | ✅ | ✅ |
| V. Simplicity and Checkpoints | No dependency. US1 needs no new read from AE. Three shared edits, each one function or line. Plan shown before building; commit only when asked | ✅ | ✅ |
| VI. One Owner per File | Detectors, tools, skill: skill-builder. Eval cases, fixtures copied into the set, rubric: eval-engineer, who doesn't write the code it checks. Wording: curriculum-designer (`teaching-design.md`). Any panel change: panel-builder, through spec 007's held tasks. Case numbers from the cockpit. Live work: the builder, one sitting at a time | ✅ | ✅ |
| `decisions/011` (moving to A) | Built and evaluated on B1. Then: `ready-for-a.mjs` on `diagnose-mentor` (its name ends `-mentor`, every tool it names is in its `allowed-tools`), the set's `--runtime a --dry-run`, a paid A run against the B1 baseline (FR-033's bar), one live diagnosis on A, then a tester. Hand-over cases run on A only (B1 can't hand over). Adding a tool file moves the `mentor/` tree hash, so the other sets' A results are re-used or re-run under spec 006 FR-025 at the next release | ✅ | ✅ |

No violations, so Complexity Tracking is empty.

## Architecture

```text
learner: "what's wrong here?"  ─►  /diagnose-mentor (SKILL.md: how to lead; wording from teaching-design.md)
                                        │ calls only:
                                        ▼
   mentor/tools/diagnosis.mjs   diagnose_comp · check_finding · mark_intended   (+ preview_frame, read_learner_record)
            │                         │
            │ takeSnapshot()          │ pure, deterministic
            ▼                         ▼
   lib/snapshot.mjs ─► AE      lib/diagnosis.mjs ── orchestrates:
   (existing reads; US4 adds        ├─ lib/diagnosis-findings.mjs   DX-01..DX-09 detectors
    comp.motion_blur)               │     uses timing.mjs, analyze.mjs, motion-sources.mjs, visibility.mjs
                                    ├─ lib/diagnosis-scope.mjs      what's set aside, what's not checked
                                    ├─ lib/diagnosis-rank.mjs       symptom first, rank weights, start here
                                    ├─ lib/diagnosis-compare.mjs    identity; open / fixed / still / changed
                                    └─ lib/diagnosis-recommend.mjs  FR-020: pattern, review, not teachable yet
                                            reads curriculum/path.json (skill map) and curriculum/diagnosis.json (catalogue)
   lib/diagnosis-store.mjs ─► diagnosis.json (open diagnosis, intended marks)
                          └─► learner.json › diagnoses   (through learner-store.saveDiagnosis)
```

- **The tools decide; the model leads.** Ranking, the start-here pick, identity across reads, the
  recommendation and what's recorded are all computed. The model's choices are limited to the words, which
  findings to talk about first when the learner names a symptom (it passes layer names and a time,
  and the tool re-ranks), and when to hand over.
- **Restraint by construction.** The tools are `readOnlyHint: true` on the project (`mark_intended`
  writes only the learner home), and the skill's `allowed-tools` has no demonstration tool. A lesson
  started from a finding runs under its own skill and tools, with its own one demonstration.
- **A finding's layers go to the lesson** as the hand-over argument, the same way `/next-mentor`
  passes them. That path carries next-mentor's known gap (the layers don't always reach the lesson).
  Diagnosis inherits whatever fixes it and adds no workaround (research R11).

## Overlaps: what the diagnosis sees (CLAUDE.md › Edge cases)

The spec's Edge Cases table stays the requirement. This is how the plan meets each row, with the read
it relies on. Every row gets a unit test on a saved snapshot (T011, T033, FR-024), and `/overlap-audit` runs
once the detectors exist (T018).

| Overlap | Read it relies on (exists today unless marked) | How the analysis treats it |
|---|---|---|
| Expressions over keys | `expression_enabled` per keyed property | DX-06 (ask) on that property. Its keys are left out of DX-01 to DX-05 and DX-07 (timing's `excluded: "expression"`). DX-07 then says motion an expression drives can't be timed |
| Expression-only motion (no keys) | none (expression text and unkeyed properties: read R2 not built) | A standing not-checked item. The skill says it whenever the answer would otherwise imply motion has ended (DX-07) or that nothing's wrong |
| Single keys | key count | A set value: not a move, never a duration (timing's `single_key`) |
| Hold keys | `out_type: "hold"` | A held pair is an instant change at its second key: it counts as "something changed then" for DX-07 and never as a duration in DX-02 or DX-03. A run of two or more holds is a pattern (no DX-05) |
| Half-eased pairs | `segmentState` → `partly_eased` | Counted as not eased in DX-01, with the linear end named |
| Separated dimensions | property paths `Position_0/1/2` | One Position unit (timing's `mergeDimensions`): X and Y landing together is never DX-03 |
| Effects | effect property paths | Keyed effect properties are motion in DX-02, DX-03, DX-04 and DX-07 |
| Precomps | `precomp_layers`, `kind: "precomp"` | The precomp layer's own transform is analyzed; its inside is named as not checked. DX-07 and a clean result both say so |
| Precomp time remap or stretch | `time_remap`, `stretch` | Named as not checked when on or not 100%. No comparison of inner time with outer |
| Hidden layers | `enabled: false` → visibility class `hidden` | Set aside from every comparison and named as set aside (as easing does) |
| Track mattes | `is_matte` → visibility class `matte` | **Now read** (spec 004 wave B): a matte's motion counts as seen through the layer it mattes, so it is in DX-02, DX-03 and DX-07 even with its eye off, and is never called unused |
| Guide, solo, shy | `guide`, `solo`, `shy` | Guide layers and layers not rendered because another is soloed are set aside like hidden ones, and named. Shy changes nothing (it only hides the timeline row) |
| Null and other invisible layers | `is_null`, `adjustment` | A null's motion counts only through its children (DX-08) and is never a finding the viewer sees. An adjustment layer's keyed effects count (they change the picture) |
| Parenting | `parent` per layer, parent chain | **Now read**: DX-08 (US4). A parent keyed only on Opacity or effects doesn't move its children (`motion-sources` › MOVES), so it raises nothing. A grandparent counts. A parent with an expression on its transform makes the child's DX-08 a not-checked note |
| Layer trimmed (in and out points) | `in_point`, `out_point` | **Added row.** Moves entirely outside the layer's time are left out (nobody sees them). A layer that comes in or goes out partway is a change in the frame for DX-07 |
| Layers with no keys | `layer_info` | Static, never missing or broken |
| Renumbering (a null added) | layer names | Findings are matched across reads by layer name and property, never by index. Duplicate names match as `unmatched` (as easing does) |
| Comp motion blur switch | **new read** `comp.motion_blur` (US4) | DX-09 fires only when the comp switch is off, or every animated layer's switch is off. Without the read (an older capture), only the layer half is checked and the comp switch is named as not checked |

## Project Structure

### Documentation (this feature)

```text
specs/005-diagnosis/
├── spec.md               # approved 2026-10-20 (spec-writer)
├── teaching-design.md    # NEW, curriculum-designer (T001): wording, intent questions, hints, opening
├── plan.md               # this file
├── research.md           # R1–R16
├── data-model.md         # Finding, Diagnosis, Not-checked, Diagnosis record, Catalogue entry
├── quickstart.md         # how to check it works, without and with AE
├── contracts/
│   ├── diagnosis-tools.md      # diagnose_comp, check_finding, mark_intended
│   └── catalogue.md            # curriculum/diagnosis.json and how it mirrors teaching-design.md
├── checklists/requirements.md
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
mentor/
├── curriculum/
│   ├── path.json                  # existing: `findings` is the DX → skill map (unchanged)
│   └── diagnosis.json             # NEW: the catalogue (thresholds, rank weights, wording keys)
├── lib/
│   ├── diagnosis.mjs              # NEW: analyze(snapshot, options) → the result
│   ├── diagnosis-findings.mjs     # NEW: DX-01..DX-09
│   ├── diagnosis-scope.mjs        # NEW: set-aside layers, not-checked list
│   ├── diagnosis-rank.mjs         # NEW: ranking, symptom, start here
│   ├── diagnosis-compare.mjs      # NEW: identity and states across reads
│   ├── diagnosis-recommend.mjs    # NEW: FR-020
│   ├── diagnosis-store.mjs        # NEW: diagnosis.json; calls learner-store.saveDiagnosis
│   └── learner-store.mjs          # SHARED EDIT (T038, US3): export saveDiagnosis()
├── tools/diagnosis.mjs            # NEW: TOOLS only (SKILLS = [], no FINDERS)
├── jsx/snapshot.jsx               # SHARED EDIT (T032, US4): comp.motion_blur
├── dev/build-diagnosis-comps.jsx  # NEW: builds the planted comps for live capture
└── test/
    ├── diagnosis-*.test.mjs       # NEW
    └── fixtures/diagnosis/        # NEW: live captures + answer keys

.claude/skills/diagnose-mentor/SKILL.md   # NEW
.claude/skills/next-mentor/SKILL.md       # SHARED EDIT (T046): trigger line only (FR-026)

product/evals/diagnosis/                  # NEW (eval-engineer): run.mjs, cases/, fixtures/, records/, rubric.md, README.md
```

**Structure Decision**: everything goes in the existing `mentor/` server and the skills folder. The
panel finds `diagnose-mentor` by itself (`panel/lib/runtime.js` links every `*-mentor` skill), and
the helper on A starts the same server, so neither runtime needs code for the tools to exist. The
panel's diagnosis screens are spec 007's held FR-031 to FR-047 and are built there, against
[contracts/diagnosis-tools.md](contracts/diagnosis-tools.md).

## Phases (summary; detail in tasks.md)

1. **Setup**: the teaching design (curriculum-designer), the planted comps and live captures (builder,
   🖐 AE), and answer keys written from the build scripts.
2. **Foundation**: the catalogue data, the open-diagnosis store (`diagnosis.json`), the scope
   and not-checked list.
3. **US1** (P1): DX-01 to DX-07, ranking, symptom, `diagnose_comp`, `/diagnose-mentor` steps for
   the first answer. MVP with US2 and US5.
4. **US2** (P1): identity across reads, `check_finding`, `mark_intended`, hand-over and hints.
5. **US5** (P1): the eval set and the easing re-run.
6. **US4** (P2): DX-08 and DX-09, the comp motion blur read.
7. **US3** (P2, gated on spec Q1): the shared `saveDiagnosis` export, memory across sessions, the pattern and review recommendation.
8. **Entry** (FR-026, low priority): the trigger line.
9. **Close**: live sessions, the move to A, and spec amendments.

## Complexity Tracking

None.
