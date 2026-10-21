# Implementation Plan: Break the lockstep with offset (curriculum skill 3)

**Branch**: `010-offset` (spec folder only; the build runs on its own worktree branch) |
**Date**: 2026-10-21 | **Spec**: [spec.md](spec.md) | **Teaching design**:
[teaching-design.md](teaching-design.md) (the curriculum designer's; linked, not copied; "TD §")

**Input**: Feature specification from `specs/010-offset/spec.md`, approved 2026-10-21.

**Status**: Draft, awaiting the builder's approval.

## Summary

Skill 3 teaches breaking lockstep: layers that all start together, or one layer's properties that
start and land together, get staggered by the learner in an order and gap they choose. It plugs in
by **adding files only** through spec 004's
[skill-module contract](../004-ae-curriculum/contracts/skill-module.md) (record ID `timing.offset`,
prefix `offset_`), after spec 004's wave A branch (T001–T065) has merged.

The approach:

- **A pure analysis file** (`mentor/lib/offset.mjs`) forms groups of both kinds from the shared
  `timing()` and `clusters()` (FR-002, FR-005), proposes one (FR-006), applies spec 004 FR-027's
  floor in one function (`isSame`), and checks the attempt (FR-008, FR-012 to FR-015). Starts,
  landings and moves always come from `timing()`; **other changes** come from the raw keys of every
  keyed property (FR-013), because `timing()`'s exclusions are right for teaching and wrong for
  change detection (the overlap audit's filter 1).
- **Three tools** in `mentor/tools/offset.mjs`. The learner's kind, order, gap and splits travel in
  the session's `skill_options` (spec 004 T060, T061); a continued `offset_snapshot` call with the
  order sets the demo target from the baseline (FR-009), which the session already re-derives on a
  continued lesson.
- **One demo snippet** (`mentor/jsx/offset-demo.jsx`) shifts every key of the demo member later by
  a whole number of frames, keeping each key's value, types, temporal ease and spatial tangents, as
  one undo step, and refuses before writing anything if a key would pass the comp's end, the layer
  is locked, or the gap is under the floor (FR-010). Its fixture twin shifts key times in a saved
  snapshot (FR-024).
- **The skill prompt** (`.claude/skills/offset-mentor/SKILL.md`): TD § 5's stages, the intent
  question, never a gap number (FR-007, SC-004), Quick Offset only after L-1 and only at 25.4 or
  later (FR-017).
- **Cloud first, then one sitting.** Everything builds and tests in the cloud on stand-ins; one
  sitting at the Mac (🖐) runs L-1 to L-4, the captures, a desk block, and the two first live
  lessons (properties kind on Mentor Practice, layers kind on Mentor Practice 2). The review a day
  later (SC-006) is the only live task outside it.

## Technical Context

**Language/Version**: JavaScript (ES modules) on Node 18+; ExtendScript (ES3) for the demo snippet

**Primary Dependencies**: none from npm (constitution V; contract › 7)

**Storage**: none of its own (session through `mentor/lib/session.mjs`; record through the shared
`record_lesson`)

**Testing**: `node:test` files `mentor/test/offset*.test.mjs`; fixtures in
`mentor/test/fixtures/offset/`, live captures by the end except the rows the spec allows as
synthetic (FR-022); spec 004's live `practice2-before.json` and `practice2-60fps.json`; eval cases
by the eval engineer in `product/evals/offset/` (SC-003, SC-004)

**Target Platform**: After Effects 26.5 on macOS 27.0.1; R0 every session (FR-017)

**Project Type**: a skill module for the local `ae-mentor` MCP server, plus a Claude Code skill

**Performance Goals**: as spec 002; the demo snippet re-creates each key of one layer (tens of keys)
in one undo group, under 5 s

**Constraints**: adds files only (FR-001, SC-008); thresholds only from FR-027's floor, never said
as a target (FR-007, SC-004); one demo, never in a review, never with two members; no Quick Offset
before L-1 (FR-017)

**Scale/Scope**: groups of 2 to 5 layers, or 2+ properties of one layer

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.*

| Principle | Check | Pre-research | Post-design |
|---|---|---|---|
| I. Spec Before Build | Spec 010 approved 2026-10-21; this plan and tasks stop for approval | ✅ | ✅ |
| II. Decisions Are Recorded | **`003`/`005`**: one fixed snippet, three narrow tools, no open-ended script. **`007`**: owners as in the spec. **`008`**: 🖐 under the AE lock; worktree; `check-branch.mjs`. **`002`**: the "why" is memory and practice; the depth edge is small here and the spec says so. No new decision | ✅ | ✅ |
| III. Teaching Quality Is Evaluated | The eval engineer writes `product/evals/offset/` from the spec's 20 cases (HO-1); unit tests cover every overlap row and the floor at 30 and 60 fps | ✅ | ✅ |
| IV. Privacy by Default | Records hold layer and property names, order and measured gaps (FR-019); shared email and phone check | ✅ | ✅ |
| V. Simplicity and Checkpoints | No dependency, no refactor, no existing file changed; no new threshold (FR-015 reuses FR-027) | ✅ | ✅ |
| VI. One Owner per File, Independent Checks | Builder doesn't write eval cases; `/overlap-audit` re-run and a reviewer read before evals (HO-2, HO-3) | ✅ | ✅ |

Active decisions: `002`, `003`, `005`, `007`, `008`. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/010-offset/
├── spec.md, teaching-design.md (read only here)
├── plan.md              # This file
├── research.md          # R1–R9
├── data-model.md        # skill_options, group, target IDs, check result, demo
├── quickstart.md        # Cloud checks, then the one live sitting (🖐)
├── contracts/
│   └── tools.md         # offset_snapshot, _demo, _check (adds to spec 004's)
├── checklists/
└── tasks.md
```

Spec 004's [skill-module.md](../004-ae-curriculum/contracts/skill-module.md),
[shared-tools.md](../004-ae-curriculum/contracts/shared-tools.md) and
[data-model.md](../004-ae-curriculum/data-model.md) › Timing measures are linked, not copied.

### Source code: the files this skill adds (and no others)

```text
mentor/
├── tools/offset.mjs                   # SKILLS, FINDERS, TOOLS (three tools)
├── lib/offset.mjs                     # isSame(), groups(), analyze(), check() (pure)
├── lib/offset-keys.mjs                # raw-key reads: other changes, per-property and per-dimension shifts, out-of-comp keys (pure)
├── jsx/offset-demo.jsx                # the one demo write: shift a member's keys later
├── fixture/offset-demo.mjs            # its fixture twin
└── test/
    ├── offset-floor.test.mjs          # FR-023 at 30 and 60 fps
    ├── offset-groups.test.mjs         # FR-004 to FR-006, FR-009, FR-020
    ├── offset-check.test.mjs          # FR-008, FR-011 to FR-015
    ├── offset-tools.test.mjs          # the three tools in fixture mode, review mode
    ├── offset-demo.test.mjs           # snippet build and twin (FR-024)
    ├── offset-overlap.test.mjs        # one test per overlap row 1–22 (FR-022)
    └── fixtures/offset/
        ├── README.md, answer-key.json, records/
        ├── synthetic/                 # rows 5, 18, 19 only (spec allows; stay after merge)
        ├── stand-in/                  # cloud stand-ins; deleted after the sitting
        └── *.json                     # live captures from the sitting
.claude/skills/offset-mentor/SKILL.md
```

**Changes to existing files: none** (not `index.mjs`, `fixture.mjs`, `timing.mjs`, `session.mjs`,
`diff.mjs`, `ease-mentor`, `product/evals/`, `panel/`, `discovery/`).

**Other owners (hand-offs):** `product/evals/offset/` (eval engineer, HO-1);
`discovery/usage-notes/offset-build.md` (cockpit, from the hand-back); the `.aep` (planted shapes on
**duplicates**, deleted before saving).

**Structure Decision**: spec 004's layers, unchanged; every file here is new.

## Phase 0: research

[research.md](research.md): R1 the floor in frames; R2 forming groups; R3 target IDs and refs;
R4 the learner's choices in `skill_options` and the demo target; R5 the demo write; R6 the check;
R7 raw-key other changes and dimensions; R8 fixtures; R9 the one sitting. No NEEDS CLARIFICATION
is left; L-1 to L-4 settle facts with fallbacks.

## Phase 1: design

[data-model.md](data-model.md), [contracts/tools.md](contracts/tools.md),
[quickstart.md](quickstart.md). **Constitution re-check:** unchanged.

## Build order and who does what

| Step | Who | Where | Does | Done when |
|---|---|---|---|---|
| 1 | Skill-builder | Cloud worktree | Phases 1–7 of tasks.md | `npm test` green; `check-branch.mjs` clean without `--shared-owner`; `/agent-audit` run; hands back |
| 2 | The builder at the Mac, with a skill-builder holding the AE lock (🖐) | Local checkout | Phase 8: L-1 to L-4, captures, desk block, two first live lessons | Results handed back; stand-ins gone; tests green |
| 3 | Cockpit | Main tree | Usage note from the hand-back | Committed |
| 4 | Curriculum designer, reviewer | Read only | `/overlap-audit` re-run against the built check (HO-2): rows marked **contract** in the spec's table are re-confirmed against `timing.mjs` as built; `SKILL.md` read against FR-007 and FR-017 (HO-3) | No open row |
| 5 | Eval engineer | Own worktree | `product/evals/offset/` (HO-1); easing re-run after merge (HO-4) | SC-003, SC-004, SC-007 |
| 6 | Cockpit | Main tree | `/merge-worktree <branch> skill-builder` | SC-008 |
| 7 | The builder (🖐, a day or more later) | Mac | Live review on Chip A to C (SC-006) | Logged |

## Requests (not this skill's work)

- **RQ-1 (spec 004 data-model, wording; no code change expected):** data-model › Analyzer result
  says `target_refs` is "one `{layer, property}` per target". This skill's layers kind has one
  target per **layer** but must store every counted property of each layer as a target ref
  (FR-019, FR-020: a review must skip any `{layer, property}` the learner has done). Spec 004 T017
  stores `target_refs` "as given" and T031 de-duplicates them, so several refs per target should
  already work. Ask: confirm, and change the line to "one or more per target". **Fallback** if the
  built session enforces one per target: the layers kind uses one target per counted property
  (`<layer index>/<unit>`), with the demo target the demo layer's first unit and the demo tool
  shifting the whole layer; the analysis already groups them by layer, so only the IDs change.
- **RQ-2 (cockpit, persona):** as spec 008's: `.claude/agents/skill-builder.md` still says skills
  edit `server.mjs` and `session.mjs`.
- **To spec 005's plan (from the spec's Assumptions, no change here):** use the same FR-027 floor
  for DX-03 so a diagnosis finding is always a skill 3 focus.

## Risks

| Risk | Watch | Mitigation |
|---|---|---|
| Re-creating keys loses an attribute (roving, continuous, labels) | L-2 | The snippet copies every readable key attribute; L-2 compares a before and after read and AE's own look; anything lost is fixed in the snippet before merge |
| A layer bar drag doesn't read as moved keys (L-3) | L-3 | Then row 16's hint wording changes; the check itself reads key times either way |
| Quick Offset puts keys between frames (L-1) | L-1 | Half-frame tolerance on shifts (FR-012); row 19's synthetic test |
| `target_refs` enforced one per target | Tool test | RQ-1's fallback |
| Two first live lessons make the sitting long | Timings | The layers-kind lesson can move to the review sitting (open question for the builder) |

## Complexity Tracking

None.
