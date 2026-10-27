# Implementation Plan: Set the pivot (curriculum skill 5)

**Branch**: `011-anchor` (spec folder only; the build runs on its own worktree branch) |
**Date**: 2026-10-24 | **Spec**: [spec.md](spec.md) | **Teaching design**:
[teaching-design.md](teaching-design.md) (the curriculum designer's; linked, not copied; "TD §")

**Input**: Feature specification from `specs/011-anchor/spec.md`, approved 2026-10-23.

**Status**: Approved 2026-10-24. The builder took every recommendation: Q1 (below) and SR-2
(spec 004 tasks-wave-b.md T164, T165). Amended 2026-10-26 with the spec (Changes 2026-10-26): the
second read is the usual case on Mentor Practice 2, and tasks T241 to T244 before the live lessons.
Rounds 2 to 4 (2026-10-26, spec › Changes) add tasks.md › Phases 8c (T245 to T248), 8d (T249 to
T253) and 8e (T254 to T256: `moves_case` for D-8, the full-frame test for D-9, and `SKILL.md`'s
two-frames sentence), all skill-builder work on the build branch, in step 3's place in the table
below. Round 5 (2026-10-26, spec › Changes › round 5; TD § 19 approved by the human, the spec's
parts awaiting the builder) adds Phase 8f: T257 (`SKILL.md`'s opening turn, B-10, already in
progress by the cockpit's skill-builder) and T258 (B-11: `position_key_label` and `rest_label` in
`mentor/lib/anchor.mjs`, then `SKILL.md` uses them), plus an HO-1 update for the eval engineer. No
new file, tool or field beyond the two labels; the constitution check below is unchanged. Round 6
(2026-10-26, spec › Changes › round 6; TD § 19a decided by the human, the spec's parts awaiting
the builder) adds Phase 8g: T259 (`SKILL.md` step 1, B-12: the practicing proposal is always the
read's; TD § 19a's sentence for a named null, camera, light or adjustment layer; already in
progress by the cockpit's skill-builder), plus HO-1's cases 32 to 37. No tool, file or field
change; the constitution check is unchanged.

## Summary

Skill 5 teaches setting a layer's pivot where it should turn from without the layer moving. It
plugs in by **adding files only** through spec 004's
[skill-module contract](../004-ae-curriculum/contracts/skill-module.md) (record ID
`transform.anchor`, prefix `anchor_`), on spec 004's wave B shared code, which is on main (d009d35):
`layer-info.mjs`, `comp-space.mjs`, `visibility.mjs`, `motion-sources.mjs`, and `takeSnapshot({
sample_times })`.

The approach:

- **Two pure analysis files.** `mentor/lib/anchor.mjs` builds candidates from `layer_info` (never
  the keyed `layers`, filter 2) with `classOf()` and `sourcesOf()`, ranks them, maps the nine places
  in the layer's own space, finds each focus layer's check time (the rest key, S-1, D-1), works out
  the samples each read needs, and computes the demo's values. `mentor/lib/anchor-check.mjs` grades
  items 1 to 5 from `footprint()` at the check time, reads other changes from `layer_info` for
  every layer (never `unexpectedChanges()`, filter 1), and maps each TD § 7 row to a hint code.
  Every comp-space `reason`, `singular` included, is "can't check" (FR-018, filter 6).
- **Three tools** in `mentor/tools/anchor.mjs`. The learner's layer, place and rest pose travel in
  `skill_options`. The snapshot tool takes a second, sampled read when a needed time is missing, so
  the baseline holds every time the check compares (FR-013); the check passes those times again.
  On the live Mentor Practice 2 (40 layers, 30 needed times, 2026-10-26) that's every lesson
  start, not the exception the stand-ins (19 layers, 7 times) suggested.
- **One demo snippet** (`mentor/jsx/anchor-demo.jsx`) writes Anchor Point and Position (or X and Y)
  from values the server computed, as one undo step, never keying. Its fixture twin writes the same
  values into a saved snapshot (FR-029).
- **The skill prompt** (`.claude/skills/anchor-mentor/SKILL.md`): TD § 5's stages, intent first,
  Pan Behind (Y), never a number to type or a tolerance (SC-004), Quick Set Anchor never brought up
  (SC-005), review mode in this first build.
- **Cloud first, then one sitting.** Everything builds and tests in the cloud on stand-ins and spec
  004's synthetics; one sitting at the Mac (🖐) runs L-1 to L-5, the captures, a desk block and two
  first live lessons, **after spec 004's T133 to T136** (the corner math's live check). The review a
  day later is the only live task outside it.

## Technical Context

**Language/Version**: JavaScript (ES modules) on Node 18+; ExtendScript (ES3) for the demo snippet

**Primary Dependencies**: none from npm (constitution V; contract › 7)

**Storage**: none of its own (session through `mentor/lib/session.mjs`; record through the shared
`record_lesson`). `setSkillData()` isn't needed: everything the tools derive comes from the
baseline and `skill_options`.

**Testing**: `node:test` files `mentor/test/anchor*.test.mjs`; fixtures in
`mentor/test/fixtures/anchor/`, live captures by the end except the rows the spec allows as
synthetic (FR-027); spec 004's live `practice2b.json`, `practice2b-anchor.json` and `overlaps.json`
read in place once T133 and T135 make them; eval cases by the eval engineer in
`product/evals/anchor/` (SC-003 to SC-005)

**Target Platform**: After Effects 26.5 on macOS 27.0.1; R0 every session

**Project Type**: a skill module for the local `ae-mentor` MCP server, plus a Claude Code skill

**Performance Goals**: as spec 002; at most two reads per `anchor_snapshot` (spec 004's 2 s per
read goal), one per check

**Constraints**: adds files only (FR-001, SC-008); tolerances only in this skill's files (10% / 3 px
own space, 1 px comp, 0.5°, half a frame); no number or tolerance said to the learner (SC-004); one
demo, never in a review, never with one focus layer; no Quick Set Anchor (FR-023)

**Scale/Scope**: one or two focus layers; comps of up to ~40 layers; at most 64 samples per layer
(spec 004 data-model › Sample times)

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.* Constitution 1.3.0.

| Principle | Check | Pre-research | Post-design |
|---|---|---|---|
| I. Spec Before Build | Spec 011 approved 2026-10-23; this plan and tasks approved 2026-10-24 | ✅ | ✅ |
| II. Decisions Are Recorded | **`003`/`005`**: one fixed snippet, three narrow tools, no open-ended script. **`007`**: owners as in the spec. **`008`**: 🖐 under the AE lock; worktree; `check-branch.mjs`. **`002`**: the "why" is depth (comp-space, per layer, per time) and memory. No new decision | ✅ | ✅ |
| III. Teaching Quality Is Evaluated | The eval engineer writes `product/evals/anchor/` from the spec's 18 cases (HO-1); unit tests cover every overlap row and FR-028's edges | ✅ | ✅ |
| IV. Privacy by Default | Records hold layer names and places only (FR-025); shared email and phone check | ✅ | ✅ |
| V. Simplicity and Checkpoints | No dependency, no refactor, no existing file changed | ✅ | ✅ |
| VI. One Owner per File, Independent Checks | Builder doesn't write eval cases; `/overlap-audit` re-run and a reviewer read before evals (HO-2, HO-3) | ✅ | ✅ |

Active decisions: `002`, `003`, `005`, `007`, `008`. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/011-anchor/
├── spec.md, teaching-design.md (read only here)
├── plan.md              # This file
├── research.md          # R1–R11
├── data-model.md        # skill_options, candidate, analyzer and check results, hint codes, demo
├── quickstart.md        # Cloud checks, then the one live sitting (🖐)
├── contracts/
│   └── tools.md         # anchor_snapshot, _demo, _check (adds to spec 004's)
├── checklists/
└── tasks.md
```

### Source code: the files this skill adds (and no others)

```text
mentor/
├── tools/anchor.mjs                   # SKILLS, FINDERS, TOOLS (three tools)
├── lib/anchor.mjs                     # candidates, places, restKey, neededTimes, analyze, finder, demoValues (pure)
├── lib/anchor-check.mjs               # check, otherChanges, hintCodes (pure)
├── jsx/anchor-demo.jsx                # the one demo write
├── fixture/anchor-demo.mjs            # its fixture twin
└── test/
    ├── anchor-measures.test.mjs       # FR-010, FR-011, FR-028 edges
    ├── anchor-candidates.test.mjs     # FR-003 to FR-009, FR-024's pick
    ├── anchor-check.test.mjs          # FR-012, FR-013, FR-016, FR-018, FR-019, hint codes
    ├── anchor-tools.test.mjs          # the three tools in fixture mode, review mode
    ├── anchor-demo.test.mjs           # snippet build, demoValues, twin (FR-015, FR-029)
    ├── anchor-overlap.test.mjs        # one test per overlap row 1–29 (FR-027)
    └── fixtures/anchor/
        ├── README.md, answer-key.json, load.mjs, records/
        ├── synthetic/                 # rows the spec allows; stay after merge
        ├── stand-in/                  # cloud stand-ins and build.mjs; deleted after the sitting
        └── *.json                     # live captures from the sitting
.claude/skills/anchor-mentor/SKILL.md
```

**Changes to existing files: none** (not `index.mjs`, `fixture.mjs`, `comp-space.mjs`,
`layer-info.mjs`, `visibility.mjs`, `motion-sources.mjs`, `session.mjs`, `snapshot.jsx`, `diff.mjs`,
any other skill, `product/evals/`, `panel/`, `discovery/`). `mentor/tools/index.mjs` finds the tool
file and `mentor/fixture.mjs` the twin by name, as for skills 1 to 3.

**Other owners (hand-offs):** `product/evals/anchor/` (eval engineer, HO-1);
`discovery/usage-notes/anchor-build.md` (cockpit, from the hand-back); the `.aep` (mistakes made on
a **duplicate** of Mentor Practice 2, deleted before saving).

**Structure Decision**: spec 004's layers, unchanged; every file here is new.

## Phase 0: research

[research.md](research.md): R1 candidates; R2 places and item 1; R3 the rest key; R4 samples and the
cap; R5 focus, targets and the demo target; R6 the demo write; R7 the check; R8 review; R9 fixtures;
R10 version; R11 the sitting. No NEEDS CLARIFICATION is left; L-1 to L-5 settle facts with
fallbacks.

## Phase 1: design

[data-model.md](data-model.md), [contracts/tools.md](contracts/tools.md),
[quickstart.md](quickstart.md). **Constitution re-check:** unchanged.

## Build order and who does what

| Step | Who | Where | Does | Done when |
|---|---|---|---|---|
| 1 | Skill-builder | Cloud worktree, parallel with spec 012's | Phases 1–7 of tasks.md | `npm test` green; `check-branch.mjs` clean without `--shared-owner`; `/agent-audit` run; hands back |
| 2 | Shared-code owner (spec 004) | Mac | T133 to T136, T158 | Spec 004's live answer keys pass |
| 3 | The builder at the Mac, with a skill-builder holding the AE lock (🖐) | Local checkout | Phase 8: L-1 to L-5, captures, desk block, two first live lessons | Results handed back; stand-ins gone; tests green |
| 4 | Cockpit | Main tree | Usage note from the hand-back | Committed |
| 5 | Curriculum designer, reviewer | Read only | `/overlap-audit` re-run against the built check (HO-2), rows marked **contract** re-confirmed against wave B's code as built; `SKILL.md` read against FR-023 and SC-004 (HO-3) | No open row |
| 6 | Eval engineer | Own worktree | `product/evals/anchor/` (HO-1); easing re-run after merge (HO-4) | SC-003, SC-004, SC-005, SC-007 |
| 7 | Cockpit | Main tree | `/merge-worktree <branch> skill-builder` | SC-008 |
| 8 | The builder (🖐, a day or more later) | Mac | Live review on Tab or Peg (SC-009) | Logged |

## Requests (not this skill's work)

- **SR-2 (approved 2026-10-24; spec 004 tasks-wave-b.md T164 tests, T165 code; the same request as
  spec 012's SR-4): the comp's size in the snapshot.** Checked 2026-10-24: `mentor/jsx/snapshot.jsx` reads no comp width or height, and
  nothing else in the snapshot gives them. Ask: `comp` gains `width` and `height` (`comp.width`,
  `comp.height`, pixels), absent on older captures; a unit test in spec 004's snapshot tests; the
  data-model's Snapshot additions row. **Why here:** FR-004's full-frame bucket ("allowed if named,
  proposed only when nothing else exists"). **Without it** the build still works: full-frame layers
  rank last by area (research R1) and `full_frame` stays `null`; the bucket turns on by itself once
  the field appears. Not blocking for this skill; it is for spec 012's proposal. Wanted before the
  Phase 8 captures so they carry the field.

Every other shared piece the spec relies on is on main (checked 2026-10-24 against `mentor/lib/`
and `mentor/jsx/snapshot.jsx`).

## Open questions (answered 2026-10-24)

- **Q1 (FR-014, "the current time is on its rest key"), approved as recommended:** the session fixes the demo target when the
  lesson starts, from the baseline's time, so it can't switch layers when the learner later moves
  the playhead. **Recommended:** keep entry 1 as the demo target; `anchor_demo` refuses with
  `not_at_rest` when the playhead isn't on its rest key, and the mentor asks for the playhead there
  (FR-015's own refusal). No spec change needed beyond this reading.

## Risks

| Risk | Watch | Mitigation |
|---|---|---|
| T136 shows the corner math off by more than 1 px | Spec 004 T136 | No live task here starts before it; the cloud build doesn't depend on it |
| `rect` doesn't match shapes or text on screen | L-1, L-5 | `RECT_KIND` per kind, one constant. **Closed 2026-10-26:** both `rect`; shapes default |
| Pan Behind rewrites Position keys (L-2) | L-2 | Item 4 grades either way; only the tip's wording changes |
| A busy comp hits the 64-sample cap | Tool test on the 70-key synthetic | Caller times are kept first; `not_sampled` is "can't check" |
| Two reads per snapshot feel slow | SC-001 timings; **T236 logs `anchor_snapshot`'s own time** | The second read only when a needed time is missing, which on Mentor Practice 2 is every lesson start (30 times, 2026-10-26). Over 10 s is logged as a finding; if it is, narrow the second read to the times the check can compare (a spec change, not a build call). **Happened (T236, T237: 9.95 s to 11.7 s):** spec FR-013a and SC-010 (round 3), Phase 8d T251 to T253: time each read first, then cut where the time is |
| With shapes on, the proposal lands on another skill's layer | Answer key ranks | **Seen 2026-10-26** (Blink): FR-004's three-step animation key (T241) |

## Complexity Tracking

None.
