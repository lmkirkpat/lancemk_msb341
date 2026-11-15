# Implementation Plan: Expression and precomp reads

**Branch**: `015-expression-precomp-reads` (spec folder only; build branches are the cockpit's) |
**Date**: 2026-11-14 | **Spec**: [spec.md](spec.md) (approved `944cd8c`, OQ-1 to OQ-5 as recommended)

**Status**: Draft, awaiting the builder's approval with [tasks.md](tasks.md).

## Summary

Add spec 004's reads R2 (expressions on any property) and R4 (inside precomps) to the `ae-mentor`
server, ahead of skills 4 and 10, so spec 014's ask mode can answer about real comps.

- **Phase 1 (expressions, US1 to US3):** one new pass in the shared snapshot records every
  expression, its state and text, with the property's base value at each sample and a cheap sweep
  of how much it moves. A Node module turns that into expression reads (with a "builds on its own
  value" guess) and "what links here". The motion-sources map counts expression-driven parents. The
  pivot and null checks compare at the same frame and on base values, so expression motion is never
  the learner's edit (K2). A new read-only tool, `describe_layers`, gives the ask mode a summary
  and a detail shape.
- **Phase 2 (precomps, US4):** a separate snippet reads inside precomps by comp id, with time
  mapping through start, stretch and time remap, and `describe_layers` reports it. No skill's
  findings change.

Live claims are checked first (Phase 0), because three of them decide details of the reads.

## Technical Context

**Language/Version**: Node ≥ 18 (ES modules, built-ins only) for `mentor/`; ExtendScript (ES3) for
the snippets in `mentor/jsx/`.

**Primary Dependencies**: none new (constitution V). The bridge (`bridge/`) is unchanged.

**Storage**: none new. The learner record is untouched except for FR-020's guard.

**Testing**: `node --test` in `mentor/test/` on fixtures captured live (spec 004 FR-012); eval sets in
`product/evals/` on B1; live checks in AE 27.0 logged in a usage note.

**Target Platform**: macOS, After Effects 27.0, through the forked CEP bridge.

**Project Type**: MCP server (read tools) plus ES3 snippets.

**Performance Goals**: phase 1 adds ≤ 0.5 s to a snapshot (SC-008); a whole-project precomp read
≤ 1.5 s (SC-013); first activity on a turn stays ≤ 10 s.

**Constraints**: read-only (FR-019); replies within SC-007's sizes; "not read" never said as "none"
(FR-018); easing findings unchanged (FR-021); `mentor/**` is add-only shared code (research R14).

**Scale/Scope**: measured on Comp 1 (29 layers, 4,720 properties; 22 comps and 33,447 properties in
the project) and Mentor Practice.

## Constitution Check

*GATE: passed before Phase 0 research; re-checked after design (below).*

| Principle | How this plan meets it |
|---|---|
| I. Spec before build | Spec 015 approved 2026-11-14 (`944cd8c`) |
| II. Decisions recorded | `decisions/003` and `005`: fixed read-only snippets through the bridge, no teaching logic there, narrow tools (`describe_layers` takes layers, not script). No new decision needed: the read order is within spec 004 FR-010 (amended 2026-11-14) |
| III. Teaching quality evaluated | No new AI feature, so no new set; all six sets re-run on B1 per phase (SC-006), and the eval engineer adds K2 cases (spec › Eval plan) |
| IV. Privacy | Expression text, error text and effect names go to the model only; FR-020's guard keeps them out of the record (T029). Fixtures come from the builder's own comps with no real names |
| V. Simplicity and checkpoints | No new dependency (research R3, R4 chose regex over a parser). Touches many files, so this plan and tasks go to the builder first |
| VI. One owner per file | Code and tests: skill-builder. Eval cases and runs: eval-engineer. TD 014 edits (CD-1, CD-2): curriculum-designer. Spec files: spec-writer. Shared `mentor/**` files change in one skill-builder branch per phase with the cockpit's `--shared-owner` (research R14). One AE driver at a time |
| Build on B1, ship on A (`decisions/011`) | Built and evaluated on B1. The reads don't depend on the runtime. **Moving to A:** step 1 and 2 (free checks, `--runtime a --dry-run`) are T037; the paid A runs and live A lessons happen in spec 014's ship step, since these reads ship with the ask mode, not alone |

**Active decisions relied on:** 003, 004, 005, 007, 008, 011, 012.

**Re-check after design:** still passes. Two design choices worth naming: `describe_layers` is a new
tool that no skill lists yet (R10), so it can't change any lesson; and K2 leaves expression motion
out of other-changes lists rather than adding a new kind no `SKILL.md` knows (R7).

## Project Structure

### Documentation (this feature)

```text
specs/015-expression-precomp-reads/
├── spec.md
├── plan.md              # this file
├── research.md          # R1 to R14
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── describe-layers.md
│   └── snippets.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
mentor/
├── jsx/
│   ├── snapshot.jsx            # changed: expressions, effects, base samples, sweeps (phase 1)
│   └── precomp-contents.jsx    # new (phase 2)
├── lib/
│   ├── expressions.mjs         # new: expression reads, builds-on, references, links
│   ├── same-time.mjs           # new: same-frame shared times (K2), if T004 shows it's needed
│   ├── precomp-time.mjs        # new (phase 2): time mapping
│   ├── motion-sources.mjs      # changed: expressions read, moves_by
│   ├── anchor-check.mjs        # changed: K2
│   └── null-parenting-check.mjs # changed: K2
├── tools/
│   ├── comp-reads.mjs          # new: describe_layers
│   ├── transform-anchor.mjs    # changed: motion_from (FR-015)
│   ├── null-parenting.mjs      # changed: motion_from (FR-015)
│   └── common.mjs              # changed: FR-020 guard in record_lesson
├── fixture/precomp-contents.mjs # new (phase 2): fixture twin
├── fixture.mjs                 # changed: sweeps in fixture mode
├── dev/capture.mjs             # changed: --measure, --time, --contents
└── test/
    ├── fixtures/expressions/   # new live captures (Comp 1, Mentor Practice, planted)
    ├── fixtures/precomps/      # new (phase 2)
    └── *.test.mjs              # new tests per FR

product/evals/{anchor,null-parenting,offset or key-types}/  # eval-engineer's K2 cases
```

**Structure Decision**: everything lives in the existing `mentor/` server; no new package. New logic
goes in new files where possible, so the shared-file edits stay small.

## Phases

| Phase | Tasks | Ships | Gate |
|---|---|---|---|
| **0. Live checks** | T001 to T008 | Facts for the reads | Results logged and folded into research before T010 |
| **1. Expressions** (US1, US2, US3) | T009 to T040 | On its own: spec 014 can build on it | SC-001 to SC-010; six sets on B1 (SC-006) |
| **2. Precomps** (US4) | T041 to T056 | After phase 1 is merged and its gate passes | SC-011 to SC-013; easing unchanged; eval gate (spec OQ-6) |

## Risks

- **AB 4 was a real edit, said badly** (T004, research R6). K2 now reports real edits by cause as well as leaving out expression motion; T022 to T025 wait on the builder's approval of spec Amendment 1 and OQ-8. T005 confirms the action by hand.
- **A new snapshot field leaks into a lesson's wording** (`motion_from`, base samples). The six-set
  gate catches it; OQ-3 already narrowed `motion_from` to two skills.
- **Expression-heavy comps cost more than Comp 1.** The fine sweep runs only on request; T033
  measures, and research R9's step can drop to 120 samples.
- **Usage limits stall the eval gate** (seven stalls in parallel run 3). Run the six sets one at a
  time.

## Complexity Tracking

No constitution violations to justify.
