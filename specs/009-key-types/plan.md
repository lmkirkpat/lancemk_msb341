# Implementation Plan: Pick the key type on purpose (curriculum skill 1, key types)

**Branch**: `009-key-types` (spec folder only; the build runs on its own worktree branch) |
**Date**: 2026-10-21 | **Spec**: [spec.md](spec.md) | **Teaching design**:
[teaching-design.md](teaching-design.md) (the curriculum designer's; linked, not copied; "TD §")

**Input**: Feature specification from `specs/009-key-types/spec.md`, approved 2026-10-21.

**Status**: Draft, awaiting the builder's approval.

## Summary

Skill 1 teaches choosing hold and linear on purpose: a blink, an on/off or a cut should snap, and
a constant spin should stay linear. It plugs into the mentor by **adding files only**, through
spec 004's [skill-module contract](../004-ae-curriculum/contracts/skill-module.md) (record ID
`keyframes.types`, prefix `key_types_`), after spec 004's wave A branch (T001–T065) has merged.
It's the one skill that **writes** kept-linear marks (contract › 6, spec 004 FR-038).

The approach:

- **A pure analysis file** (`mentor/lib/key-types.mjs`) finds candidates (FR-003: Transform
  Opacity pairs between 0 and 100, not held), turns what the learner named into a focus by layer
  and property (FR-005), lists what's left out with reasons (FR-006), and checks each focus pair
  against the baseline (FR-011 to FR-013). A second pure function gives the stage 6 verdict on a
  named constant-speed move (FR-014). Both use the shared `segments()`, `segmentState()`,
  `segmentId()`, `parseSegmentId()` and `applies()`/`isKeptLinear()` and copy none of them.
- **Three tools** in `mentor/tools/key-types.mjs` (contract › 3). The named focus and the
  should-move list travel in the session's `skill_options` (spec 004 T060, T061), so a resumed
  headless turn keeps them. A practice blink made after the first look restarts the lesson with
  `fresh: true` (spec 004 T062, T063). `key_types_check` calls `session.keepLinear` only on a
  **linear** verdict.
- **One demo snippet** (`mentor/jsx/key-types-demo.jsx`) sets the demo pair's first key to hold
  exactly as Toggle Hold Keyframe does at 26.5 (L-2 decides which sides), with its fixture twin
  (`mentor/fixture/key-types-demo.mjs`).
- **The skill prompt** (`.claude/skills/key-types-mentor/SKILL.md`) carries TD § 5's stages, the
  hints, the intent question first, and no Mac shortcut until L-2 (FR-018). Never "freeze".
- **Cloud first, then one sitting.** Everything is built and unit tested in the cloud on
  synthetic stand-ins; then one sitting at the Mac (🖐) runs L-1 to L-4, the captures, a desk
  block, and the first live lesson on Mentor Practice 2's Blink (quickstart › 2–5). The review a
  day later (SC-007) is the only live task outside it.

## Technical Context

**Language/Version**: JavaScript (ES modules) on Node 18+; ExtendScript (ES3) for the demo snippet

**Primary Dependencies**: none from npm (constitution V; contract › 7)

**Storage**: none of its own. Session through `mentor/lib/session.mjs`; marks through
`session.keepLinear` and the shared `record_lesson` (contract › 6)

**Testing**: `node:test` files `mentor/test/key-types*.test.mjs`; fixtures in
`mentor/test/fixtures/key-types/` (live captures with key values by the end, FR-021); eval cases by
the eval engineer in `product/evals/key-types/` (SC-005)

**Target Platform**: After Effects 26.5 on macOS 27.0.1; R0 read every session (FR-018)

**Project Type**: a skill module for the local `ae-mentor` MCP server, plus a Claude Code skill

**Performance Goals**: as spec 002 (snapshot under 2 s, check under 5 s on a 10-layer comp)

**Constraints**: adds files only (FR-001, SC-004); one demo, never in a review or on a hidden layer
or null; a mark only after a **linear** verdict (FR-014, SC-006); no "freeze", no unconfirmed
shortcut (FR-017, FR-018); the shared pair classification used as it is (FR-022)

**Scale/Scope**: one learner; at most three candidates named; one focus property or a few

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.*

| Principle | Check | Pre-research | Post-design |
|---|---|---|---|
| I. Spec Before Build | Spec 009 approved 2026-10-21; this plan and tasks stop for the builder's approval | ✅ | ✅ |
| II. Decisions Are Recorded | **`003`/`005`**: one fixed demo snippet, three narrow tools; marks only through the shared `keepLinear` (no tool writes a mark directly). **`007`**: the skill-builder owns code and `SKILL.md`, the eval engineer the cases, the designer the teaching design. **`008`**: 🖐 tasks under the AE lock; worktree; `check-branch.mjs`. **`002`**: the "why" (depth: reading both sides of every key; memory: marks) unchanged. No new decision | ✅ | ✅ |
| III. Teaching Quality Is Evaluated | The eval engineer writes `product/evals/key-types/` from the spec's 14 named cases (HO-1); unit tests cover candidates, verdicts, marks and every overlap row | ✅ | ✅ |
| IV. Privacy by Default | Records hold layer and property names, times, and what the learner said a pair is meant to do (FR-020); marks pass the shared email and phone check | ✅ | ✅ |
| V. Simplicity and Checkpoints | No dependency, no refactor, no existing file changed | ✅ | ✅ |
| VI. One Owner per File, Independent Checks | The builder doesn't write eval cases; `/overlap-audit` and a reviewer read before evals (HO-2, HO-3); SR-2 and SR-3 go to the shared owner | ✅ | ✅ |

Active decisions this plan depends on: `002`, `003`, `005`, `007`, `008`. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/009-key-types/
├── spec.md              # Approved 2026-10-21
├── teaching-design.md   # Curriculum designer's (read only here)
├── plan.md              # This file
├── research.md          # R1–R9
├── data-model.md        # skill_options, candidate, focus, verdicts, check result
├── quickstart.md        # Cloud checks, then the one live sitting (🖐)
├── contracts/
│   └── tools.md         # key_types_snapshot, _demo, _check (adds to spec 004's)
├── checklists/
└── tasks.md
```

Spec 004's [skill-module.md](../004-ae-curriculum/contracts/skill-module.md) (including › 6,
kept-linear marks) and [shared-tools.md](../004-ae-curriculum/contracts/shared-tools.md) are
linked, not copied.

### Source code: the files this skill adds (and no others)

```text
mentor/
├── tools/key-types.mjs                # SKILLS, FINDERS, TOOLS (three tools)
├── lib/key-types.mjs                  # analyze(), candidates, focus, check(), constantSpeed() (pure)
├── jsx/key-types-demo.jsx             # the one demo write: hold on the demo pair's first key
├── fixture/key-types-demo.mjs         # its fixture twin
└── test/
    ├── key-types-analyze.test.mjs     # FR-003 to FR-009, FR-015
    ├── key-types-check.test.mjs       # FR-011 to FR-014, FR-016
    ├── key-types-tools.test.mjs       # the three tools in fixture mode, fresh restart, marks, review
    ├── key-types-demo.test.mjs        # snippet build and twin
    ├── key-types-overlap.test.mjs     # one test per overlap row 1–23 (FR-021)
    └── fixtures/key-types/
        ├── README.md, answer-key.json, records/
        ├── stand-in/                  # synthetic stand-ins; deleted after the sitting
        └── *.json                     # live captures from the sitting
.claude/skills/key-types-mentor/SKILL.md
```

**Changes to existing files: none** (not `index.mjs`, `fixture.mjs`, `session.mjs`, `marks.mjs`,
`analyze.mjs`, `errors.mjs`, `ease-mentor`, `product/evals/`, `panel/`, `discovery/`).

**Other owners (hand-offs):** `product/evals/key-types/` (eval engineer, HO-1, after spec 004 plan
A2); `discovery/usage-notes/key-types-build.md` (cockpit, from the sitting's hand-back); the `.aep`
(the sitting plants overlaps on a **duplicate** of Mentor Practice 2 and deletes it before saving).

**Structure Decision**: spec 004's layers, unchanged; every file here is new and found by the
shared discovery.

## Phase 0: research

[research.md](research.md): R1 the property focus and should-move list in `skill_options`; R2 the
practice blink and `fresh`; R3 the candidate test on values; R4 the demo write and its credit
without a fingerprint; R5 the check's per-pair verdicts and the wrong-side case; R6 the stage 6
verdict and `keepLinear`; R7 separated dimensions; R8 stand-ins then live captures; R9 the one
sitting. No NEEDS CLARIFICATION is left; L-1 to L-4 settle facts with fallbacks the build handles.

## Phase 1: design

[data-model.md](data-model.md), [contracts/tools.md](contracts/tools.md),
[quickstart.md](quickstart.md). **Constitution re-check:** unchanged.

## Build order and who does what

| Step | Who | Where | Does | Done when |
|---|---|---|---|---|
| 1 | Skill-builder | Cloud worktree | Phases 1–7 of tasks.md | `npm test` green on stand-ins; `check-branch.mjs` clean without `--shared-owner`; `/agent-audit` run; hands back |
| 2 | The builder at the Mac, with a skill-builder holding the AE lock (🖐) | Local checkout of the branch | Phase 8: L-1 to L-4, captures, desk block, first live lesson on Blink | Results handed back; stand-ins gone; tests green on live captures |
| 3 | Cockpit | Main tree | Usage note; SR-2 to the shared owner if L-1 shows a jump | Note committed |
| 4 | Curriculum designer, reviewer | Read only | `/overlap-audit` (HO-2); `SKILL.md` read against FR-017, FR-018 and SC-008 (HO-3) | No open row |
| 5 | Eval engineer | Own worktree | `product/evals/key-types/` (HO-1); easing re-run after merge (HO-4) | SC-004, SC-005, SC-006, SC-007's eval part |
| 6 | Cockpit | Main tree | `/merge-worktree <branch> skill-builder` | SC-004's 0 changed files |
| 7 | The builder (🖐, a day or more later) | Mac | Live review on Cut (SC-007) | Logged |

The cloud phase runs alongside specs 008 and 010; the sitting doesn't (one agent on AE).

## Requests (not this skill's work)

- **SR-2 (spec's own, conditional):** if L-1 shows After Effects jumps on a mixed pair, the shared
  owner changes `segmentState` and re-runs easing's evals. This skill keeps treating it as not held
  until then (FR-022).
- **SR-3 (spec's own, wave B):** switch this skill's candidate and demo filter from the eye switch
  to the visibility class when R1 lands; a shared-owner change to this skill's merged file.
- **Note (spec 004 contract, no change asked):** contract › 6 says `keepLinear` throws
  `NOT_KEPT_LINEAR` for "any pair not linear at both ends". This skill pre-checks (FR-014) so the
  throw shouldn't happen; if a race does throw it, the tool returns the verdict `not_linear`
  instead of the error. No change asked; noting that the skill relies on `keepLinear` storing
  nothing when it throws (spec 004 T051 tests this).
- **RQ-1 (cockpit, persona):** as spec 008's: `.claude/agents/skill-builder.md` still says skills
  edit `server.mjs` and `session.mjs`.

## Risks

| Risk | Watch | Mitigation |
|---|---|---|
| Toggle Hold writes both sides (L-2), so the demo differs from a hand toggle | L-2, L-3 | `HOLD_SIDES` is one constant in the snippet and twin; set it from L-2 in the desk block |
| Mixed pairs jump (L-1) | L-1 | SR-2; until merged the check never calls a mixed pair done (FR-016), which is still honest |
| A resumed turn forgets the should-move list | Tool test | Stored in `skill_options`; the check also accepts it as input and takes the union |
| `fresh` refused after a demo or check | Tool test | The tool passes `LESSON_UNDERWAY` through and the prompt doesn't retry (FR-007) |
| Mentor Practice's fades make a review nag (H-1) | SC-007 live review | Accepted this sprint; a "meant to fade" mark next sprint would be shared work |
| The sitting runs long | Timings | Split after the desk block (open question for the builder) |

## Complexity Tracking

None.
