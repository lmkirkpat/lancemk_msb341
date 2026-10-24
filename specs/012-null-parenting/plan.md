# Implementation Plan: Move a group with a null (curriculum skill 6)

**Branch**: `012-null-parenting` (spec folder only; the build runs on its own worktree branch) |
**Date**: 2026-10-24 | **Spec**: [spec.md](spec.md) | **Teaching design**:
[teaching-design.md](teaching-design.md) (the curriculum designer's; linked, not copied; "TD §")

**Input**: Feature specification from `specs/012-null-parenting/spec.md`, approved 2026-10-23
(D-3 folded in 2026-10-24).

**Status**: Draft, awaiting the builder's approval.

## Summary

Skill 6 teaches moving a group with a null: add a null, place it where the group should turn or
scale from, parent the group to it with no jump, then give the null one move. It plugs in by
**adding files only** through spec 004's
[skill-module contract](../004-ae-curriculum/contracts/skill-module.md) (record ID `parenting.null`,
prefix `null_parent_`), on spec 004's wave B shared code, which is on main (d009d35):
`layer-info.mjs`, `comp-space.mjs` (with `parent_transform`), `visibility.mjs`,
`motion-sources.mjs`, `takeSnapshot({ sample_times })` and `setSkillData()`.

The approach:

- **Two pure analysis files.** `mentor/lib/null-parenting.mjs` builds candidates from `layer_info`
  (never the keyed `layers`, filter 1) with `classOf()` and `sourcesOf()`, enforces unique names,
  proposes a group by the 2% "nearly touch" rule, and picks the demo target.
  `mentor/lib/null-parenting-check.mjs` finds and stores the lesson's null, grades N1 to N3 and P1
  to P5, writes comments and other changes. FR-001 names one lib file; the plan splits it in two
  under the skill's own prefix, both new and both this skill's.
- **P2 through the stored null.** Every child's four corners at each of its key times and the
  before-read time, composed through `parent_transform` = the null as stored at the before-read
  time (FR-011, FR-012). The stored null lives in `skill_data`, written only by this skill's tools.
  Every comp-space `reason` (`not_sampled` from the 64-sample cap included, `singular` from the
  twin's `toLayerSpace`) is "couldn't check" and holds the pass.
- **Three tools** in `mentor/tools/null-parenting.mjs`. The focus travels in `skill_options` and
  restarts the lesson with `fresh: true`, so the baseline **is** the before read (FR-006). The
  check takes the learner's null name, region and "on purpose" answers as input and stores them.
- **One demo snippet** (`mentor/jsx/null-parent-demo.jsx`) sets one layer's parent, as one undo
  step; the tool measures the result on a second read and never retries (FR-017). Its fixture twin
  rewrites the child into the null's space with `toLayerSpace` (FR-018).
- **The skill prompt** (`.claude/skills/null-parenting-mentor/SKILL.md`): TD § 5's stages, the
  jump caught before the move is asked for, version notes held behind L-1, review mode with no
  "null" in it (SC-004), all in this first build.
- **Cloud first, then one sitting** after spec 004's T133 to T136 and T158, not overlapping spec
  011's sitting.

## Technical Context

**Language/Version**: JavaScript (ES modules) on Node 18+; ExtendScript (ES3) for the demo snippet

**Primary Dependencies**: none from npm (constitution V; contract › 7)

**Storage**: none of its own: the lesson's null in `skill_data` (`setSkillData`), the record through
the shared `record_lesson`

**Testing**: `node:test` files `mentor/test/null-parenting*.test.mjs`; fixtures in
`mentor/test/fixtures/null-parenting/`; spec 004's live `practice2b.json`,
`practice2b-parented.json` and `overlaps.json` read in place once T133 and T135 make them; eval
cases by the eval engineer in `product/evals/null-parenting/` (SC-003, SC-004)

**Target Platform**: After Effects 26.5 on macOS 27.0.1; R0 every session

**Project Type**: a skill module for the local `ae-mentor` MCP server, plus a Claude Code skill

**Performance Goals**: as spec 002; one read per snapshot and check, two per demo

**Constraints**: adds files only (FR-001, SC-008); tolerances only in this skill's files (1 px,
half a frame, FR-028's 10%, 2% of the comp's width); "1 pixel" never said as a target; one demo,
never in a review; no stored chain (SR-2 declined)

**Scale/Scope**: a focus of 2 to 4 layers; P2 times per check at most 63 (the cap)

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.* Constitution 1.3.0.

| Principle | Check | Pre-research | Post-design |
|---|---|---|---|
| I. Spec Before Build | Spec 012 approved 2026-10-23; this plan and tasks stop for approval | ✅ | ✅ |
| II. Decisions Are Recorded | **`003`/`005`**: one fixed snippet, three narrow tools. **`007`**: owners as in the spec. **`008`**: 🖐 under the AE lock; worktree; `check-branch.mjs`. **`002`**: the "why" is depth (the jump, in comp space, per corner and time) and memory. No new decision | ✅ | ✅ |
| III. Teaching Quality Is Evaluated | The eval engineer writes `product/evals/null-parenting/` from the spec's 18 cases (HO-1); unit tests cover every overlap row and FR-027's P2 cases | ✅ | ✅ |
| IV. Privacy by Default | Records hold layer names and what the checks showed (FR-025); shared email and phone check | ✅ | ✅ |
| V. Simplicity and Checkpoints | No dependency, no refactor, no existing file changed; one shared request (SR-4), not built here | ✅ | ✅ |
| VI. One Owner per File, Independent Checks | Builder doesn't write eval cases; `/overlap-audit` re-run and a reviewer read before evals (HO-2, HO-3) | ✅ | ✅ |

Active decisions: `002`, `003`, `005`, `007`, `008`. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/012-null-parenting/
├── spec.md, teaching-design.md (read only here)
├── plan.md              # This file
├── research.md          # R1–R12
├── data-model.md        # skill_options, skill_data, candidate, analyzer and check results, demo
├── quickstart.md        # Cloud checks, then the one live sitting (🖐)
├── contracts/
│   └── tools.md         # null_parent_snapshot, _demo, _check (adds to spec 004's)
├── checklists/
└── tasks.md
```

### Source code: the files this skill adds (and no others)

```text
mentor/
├── tools/null-parenting.mjs                 # SKILLS, FINDERS, TOOLS (three tools)
├── lib/null-parenting.mjs                   # candidates, proposal, p2Times, analyze, finder (pure)
├── lib/null-parenting-check.mjs             # findNull, storeNull, check (N1–N3, P1–P5), comments, otherChanges (pure)
├── jsx/null-parent-demo.jsx                 # the one demo write: set one layer's parent
├── fixture/null-parent-demo.mjs             # its fixture twin
└── test/
    ├── null-parenting-proposal.test.mjs     # FR-003 to FR-008, FR-024's pick
    ├── null-parenting-jump.test.mjs         # FR-011, FR-012, FR-027 (P2 and the stored null)
    ├── null-parenting-check.test.mjs        # FR-009, FR-010, FR-013 to FR-016, FR-019 to FR-021
    ├── null-parenting-tools.test.mjs        # the three tools in fixture mode, review mode
    ├── null-parenting-demo.test.mjs         # snippet build and twin (FR-017, FR-018)
    ├── null-parenting-overlap.test.mjs      # one test per overlap row 1–40 (FR-026)
    └── fixtures/null-parenting/
        ├── README.md, answer-key.json, load.mjs, records/
        ├── synthetic/                       # rows the spec allows; stay after merge
        ├── stand-in/                        # cloud stand-ins and build.mjs; deleted after the sitting
        └── *.json                           # live captures from the sitting
.claude/skills/null-parenting-mentor/SKILL.md
```

**Changes to existing files: none** (not `index.mjs`, `fixture.mjs`, `comp-space.mjs`,
`layer-info.mjs`, `visibility.mjs`, `motion-sources.mjs`, `session.mjs`, `snapshot.jsx`, `diff.mjs`,
any other skill, `product/evals/`, `panel/`, `discovery/`).

**Other owners (hand-offs):** `product/evals/null-parenting/` (eval engineer, HO-1);
`discovery/usage-notes/null-parenting-build.md` (cockpit); the `.aep` (mistakes made on a
**duplicate** of Mentor Practice 2, deleted before saving).

**Structure Decision**: spec 004's layers, unchanged; every file here is new.

## Phase 0: research

[research.md](research.md): R1 candidates and unique names; R2 the proposal and the comp's width;
R3 the before read; R4 sample times and the cap; R5 the lesson's null and the stored null; R6 the
checks; R7 the demo; R8 other changes and comments; R9 review; R10 fixtures; R11 version; R12 the
sitting. No NEEDS CLARIFICATION is left; L-1 to L-6 settle facts with fallbacks.

## Phase 1: design

[data-model.md](data-model.md), [contracts/tools.md](contracts/tools.md),
[quickstart.md](quickstart.md). **Constitution re-check:** unchanged.

## Build order and who does what

| Step | Who | Where | Does | Done when |
|---|---|---|---|---|
| 1 | Skill-builder | Cloud worktree, parallel with spec 011's | Phases 1–8 of tasks.md | `npm test` green; `check-branch.mjs` clean without `--shared-owner`; `/agent-audit` run; hands back |
| 2 | Shared-code owner (spec 004) | Own branch, then Mac | SR-4 (`comp.width`, `comp.height`) if approved; T133 to T136, T158 | Merged; spec 004's live answer keys pass |
| 3 | The builder at the Mac, with a skill-builder holding the AE lock (🖐) | Local checkout | Phase 9: L-1 to L-6, captures, desk block, the first live lesson | Results handed back; stand-ins gone; tests green |
| 4 | Cockpit | Main tree | Usage note from the hand-back | Committed |
| 5 | Curriculum designer, reviewer | Read only | `/overlap-audit` re-run against the built check (HO-2), rows marked **contract** re-confirmed against wave B's code as built; `SKILL.md` read against FR-023 and FR-024 (HO-3) | No open row |
| 6 | Eval engineer | Own worktree | `product/evals/null-parenting/` (HO-1); easing re-run after merge (HO-4) | SC-003, SC-004, SC-007 |
| 7 | Cockpit | Main tree | `/merge-worktree <branch> skill-builder` | SC-008 |
| 8 | The builder (🖐, a day or more later) | Mac | Live review on Row A to C (SC-009) | Logged |

## Requests (not this skill's work)

- **SR-4 (to spec 004's shared-code owner; the same request as spec 011's SR-2): the comp's size in
  the snapshot.** Checked 2026-10-24: `mentor/jsx/snapshot.jsx` reads no comp width or height.
  FR-005's "nearly touch" is 2% of the comp's width. Ask: `comp` gains `width` and `height`
  (pixels), absent on older captures, with a unit test and the data-model row. **Without it** the
  learner-named focus works and the proposal returns `no_comp_size` (the mentor asks the learner to
  name the group), so US1 #1, eval case 1 and L-6 wait for it. The build and its tests don't: stand-ins
  carry the field. Wanted before Phase 9's captures.

## Open questions (for the builder)

- **Q1 (FR-008, "no demo target until the null passes N1 and N2"):** the session fixes the demo
  target when the lesson starts. **Recommended:** the analyzer sets it from the focus, and
  `null_parent_demo` refuses with `null_not_ready` until the null has been stored (it passed N1 and
  N2 at a check). Same outcome, no shared change.
- **Q2 (a refusal FR-017 doesn't list):** the demo refuses `null_scale_zero` when the null's Scale
  is 0 on an axis at the current time, because no parenting can keep the child still under it and
  the twin's `toLayerSpace` returns `singular`. **Recommended:** yes, add it; the spec's list is
  safety refusals and this is one.

## Risks

| Risk | Watch | Mitigation |
|---|---|---|
| T136 shows the corner math off by more than 1 px | Spec 004 T136 | No live task here starts before it |
| A parent's merged key times hit the 64-sample cap | Tool test on the 70-time synthetic | P2 times passed first; P2 reads the stored null, not the null's samples; `not_sampled` holds the pass |
| `layer.parent = null` in a script doesn't compensate like the pick whip | L-3 | The tool's second read reports `jumped`; the snippet is fixed in the desk block, never retried live |
| SR-4 isn't approved | Cockpit | The proposal stays off; the learner names the group; record the outcome for spec 004 |
| The null re-placed with no check before parenting gives a false jump | Row 31's synthetic | TD § 7's jump hint names a moved null (spec, accepted) |

## Complexity Tracking

None.
