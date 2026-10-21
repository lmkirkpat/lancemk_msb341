# Implementation Plan: Shape the ease in the speed graph (curriculum skill 2)

**Branch**: `008-speed-graph` (spec folder only; the build runs on its own worktree branch) |
**Date**: 2026-10-21 | **Spec**: [spec.md](spec.md) | **Teaching design**:
[teaching-design.md](teaching-design.md) (the curriculum designer's; linked, not copied; "TD §")

**Input**: Feature specification from `specs/008-speed-graph/spec.md`, approved 2026-10-21.

**Status**: Approved 2026-10-21.

## Summary

Skill 2 teaches shaping an ease in the speed graph: a short ease out of the start key, a long ease
into the landing, and a landing that still comes to rest. It plugs into the mentor by **adding
files only**, through spec 004's [skill-module contract](../004-ae-curriculum/contracts/skill-module.md)
(record ID `easing.speed_graph`, prefix `speed_graph_`), after spec 004's wave A shared branch
(T001–T065) has merged.

The approach:

- **A pure analysis file** (`mentor/lib/speed-graph.mjs`) finds candidate pairs (FR-003), ranks
  the focus (FR-004), names the leave-outs (FR-005), and grades each pair on FR-010's four rules,
  per moving dimension (FR-011), with the § 7 mistake for each fail (FR-012). A second pure file
  (`mentor/lib/speed-graph-bezier.mjs`) works out where a pair is fastest from its ease (FR-016).
  Both reuse `segments()`, `segmentId()`, `parseSegmentId()` and `unexpectedChanges()` and copy
  none of them (FR-024).
- **Three tools** in `mentor/tools/speed-graph.mjs`, shaped like easing's (contract › 3). The
  learner's "lands hard" pairs and the easing-lesson layers for ranking travel in the session's
  `skill_options` (spec 004 T060, T061), so a resumed headless turn keeps them (FR-004, FR-006).
- **One demo snippet** (`mentor/jsx/speed-graph-demo.jsx`) sets the two facing sides to the
  fingerprint values 15.13 and 79.87 and puts each key's other side back, as `set-ease.jsx` does
  (FR-007, FR-008). Its fixture twin (`mentor/fixture/speed-graph-demo.mjs`) lets evals run
  without After Effects.
- **The skill prompt** (`.claude/skills/speed-graph-mentor/SKILL.md`) carries TD § 5's stages,
  the hints and the version wording. Its version steps stay unquoted until live check L-1 (FR-020).
- **Two kinds of work, kept apart.** Everything above is built and unit tested in a cloud
  container on synthetic stand-in fixtures. Then **one sitting at the builder's Mac** (🖐) runs
  L-1 to L-4, the fixture captures with L-5 to L-7, a short desk block that swaps the stand-ins for
  live captures and settles the wording, and the first live lesson (quickstart › 2 to 5). The
  review a day later (SC-007) is the only live task outside that sitting.

## Technical Context

**Language/Version**: JavaScript (ES modules) on Node 18+; ExtendScript (ES3) for the one demo
snippet

**Primary Dependencies**: none from npm (constitution V; contract › 7). Node built-ins and
spec 004's shared modules only

**Storage**: none of its own. The lesson lives in `session.json` through `mentor/lib/session.mjs`;
the record is written only by the shared `record_lesson` (contract › 7)

**Testing**: `node:test` files `mentor/test/speed-graph*.test.mjs`, run by `cd mentor && npm test`;
fixtures in `mentor/test/fixtures/speed-graph/` (live captures by the end, FR-025); eval cases by
the eval engineer in `product/evals/speed-graph/` (SC-005, SC-006)

**Target Platform**: After Effects 26.5 on macOS 27.0.1 (CLAUDE.md › My setup); R0 read every
session (FR-020)

**Project Type**: a skill module for the local `ae-mentor` MCP server, plus a Claude Code skill

**Performance Goals**: as spec 002: snapshot under 2 s, check under 5 s on a 10-layer comp. The
fastest-part sampling (research R2) is 200 points per pair, well under 1 ms each

**Constraints**: adds files only (FR-024, SC-009; `check-branch.mjs` without `--shared-owner`); one
demo, never in a review, enforced by the session before AE is touched; no `after-effects` tools or
open-ended scripts; no threshold or 15/80 said to the learner (FR-018); Mentor Practice, its build
script and the easing fixtures unchanged (FR-025)

**Scale/Scope**: one learner; one skill; at most 5 focus pairs per lesson

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.*

| Principle | Check | Pre-research | Post-design |
|---|---|---|---|
| I. Spec Before Build | Spec 008 approved 2026-10-21; this plan and tasks stop for the builder's approval | ✅ | ✅ |
| II. Decisions Are Recorded | **`003`/`005`**: one fixed demo snippet, three narrow tools, nothing in the bridge or panel. **`007`**: the skill-builder owns the code and `SKILL.md`; the eval engineer the cases; the curriculum designer `teaching-design.md` (read only). **`008`**: live tasks (🖐) under the AE lock, one agent on AE; worktree; `check-branch.mjs`. **`002`**: the "why" (depth, memory) is unchanged. No new decision needed | ✅ | ✅ |
| III. Teaching Quality Is Evaluated | The eval engineer writes `product/evals/speed-graph/` from the spec's 14-case Eval plan (hand-off HO-1); unit tests cover the pass rule, fastest part and every overlap row | ✅ | ✅ |
| IV. Privacy by Default | The skill stores layer and property names, times and the learner's reading answers only (FR-023); `record_lesson`'s email and phone check is shared and unchanged; fixtures checked for user names and paths at capture | ✅ | ✅ |
| V. Simplicity and Checkpoints | No dependency, no refactor, no existing file changed. Smallest set: one lib, one helper lib, one tool file, one snippet and twin, one prompt | ✅ | ✅ |
| VI. One Owner per File, Independent Checks | The builder doesn't write eval cases; `/overlap-audit` by the curriculum designer and a reviewer read of `SKILL.md` before evals (HO-2, HO-3); numbers from the cockpit | ✅ | ✅ |

Active decisions this plan depends on: `002`, `003`, `005`, `007`, `008`. No violations, so
Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/008-speed-graph/
├── spec.md              # Approved 2026-10-21
├── teaching-design.md   # Curriculum designer's (read only here)
├── plan.md              # This file
├── research.md          # R1–R9: the calls this plan makes
├── data-model.md        # This skill's options, analyzer extras, pair and check results
├── quickstart.md        # The cloud checks, then the one live sitting (🖐)
├── contracts/
│   └── tools.md         # speed_graph_snapshot, _demo, _check inputs and outputs (adds to spec 004's)
├── checklists/
└── tasks.md             # /speckit-tasks output
```

Spec 004's [skill-module.md](../004-ae-curriculum/contracts/skill-module.md) and
[shared-tools.md](../004-ae-curriculum/contracts/shared-tools.md) are linked, not copied: this
folder's `contracts/tools.md` only adds what's particular to this skill's three tools.

### Source code: the files this skill adds (and no others)

```text
mentor/
├── tools/speed-graph.mjs              # SKILLS, FINDERS, TOOLS (three tools)
├── lib/speed-graph.mjs                # analyze(), candidates, focus, pair shape, check (pure)
├── lib/speed-graph-bezier.mjs         # fastestPart(): temporal bezier sampling (pure)
├── jsx/speed-graph-demo.jsx           # the one demo write (ES3, undo: true)
├── fixture/speed-graph-demo.mjs       # the snippet's fixture twin (run, apply)
└── test/
    ├── speed-graph-shape.test.mjs     # FR-010 to FR-014 on pair shapes
    ├── speed-graph-fastest.test.mjs   # FR-016
    ├── speed-graph-analyze.test.mjs   # FR-003 to FR-006, FINDERS agreement
    ├── speed-graph-tools.test.mjs     # the three tools in fixture mode, review mode
    ├── speed-graph-demo.test.mjs      # snippet build and fixture twin
    ├── speed-graph-overlap.test.mjs   # one test per overlap row (FR-025)
    └── fixtures/speed-graph/
        ├── README.md                  # provenance of every file: live capture or stand-in
        ├── answer-key.json            # expected result per fixture and pair
        ├── stand-in/                  # synthetic stand-ins for the cloud build; deleted after the sitting
        └── *.json                     # live captures from the sitting (quickstart › 3)
.claude/skills/speed-graph-mentor/SKILL.md
```

**Changes to existing files: none.** Not `mentor/tools/index.mjs` (it finds the new tool file),
not `mentor/fixture.mjs` (it finds the twin), not `ease-mentor`, `server.mjs`, `session.mjs`,
`errors.mjs`, `product/evals/`, `panel/` or `discovery/`. Anything more is a request (below).

**Outside this skill's files (other owners; hand-offs, not builder tasks):**

- `product/evals/speed-graph/` (eval engineer, HO-1), after `panel/lib/runtime.js` links every
  `*-mentor` skill (spec 004 plan A2).
- `discovery/usage-notes/speed-graph-build.md` (cockpit, from the sitting's hand-back; the
  skill-builder's row doesn't include `discovery/`).
- The `.aep`: the sitting works on a **duplicate** comp, deleted before the file is saved.

**Structure Decision**: the existing three layers (`bridge/`, `mentor/`, `.claude/skills/`) as
spec 004 left them. Everything here is a new file the shared discovery picks up.

## Phase 0: research

[research.md](research.md) settles: R1 the fingerprint values; R2 the fastest-part model; R3 the
"comes to rest" measure; R4 moving dimensions; R5 how the record's easing layers and the "lands
hard" pairs reach the analyzer; R6 the demo write; R7 the mistake order for FR-012; R8 stand-in
fixtures, then live captures; R9 the one sitting. No NEEDS CLARIFICATION is left; L-1 to L-7 are
facts the sitting logs, and each has a fallback the build already handles.

## Phase 1: design

- [data-model.md](data-model.md): `skill_options`, the analyzer's extra fields, the pair result and
  check result.
- [contracts/tools.md](contracts/tools.md): the three tools' inputs and outputs.
- [quickstart.md](quickstart.md): the cloud checks, then the sitting, in order.

**Constitution re-check after design**: unchanged (table above). The design adds no shared file,
no dependency and no write beyond the one demo snippet.

## Build order and who does what

| Step | Who | Where | Does | Done when |
|---|---|---|---|---|
| 1 | Skill-builder | Cloud worktree | Phases 1–6 of tasks.md: lib, tools, snippet and twin, `SKILL.md` draft, review mode, every overlap row on stand-ins | `npm test` green; `check-branch.mjs` clean without `--shared-owner`; `/agent-audit` run; hands back for the sitting |
| 2 | The builder at the Mac, with a skill-builder holding the AE lock (🖐) | Local checkout of the same branch | Phase 7: L-1 to L-4, captures with L-5 to L-7, desk block, first live lesson | Live checks and timings handed back; stand-ins gone; tests green on live captures |
| 3 | Cockpit | Main tree | Usage note from the hand-back; any spec change a live check forces goes to the spec writer | Note committed |
| 4 | Curriculum designer, reviewer | Read only | `/overlap-audit` on the built check (HO-2); reviewer read of `SKILL.md` against FR-017 to FR-020 (HO-3) | No open row |
| 5 | Eval engineer | Own worktree | `product/evals/speed-graph/` (HO-1); easing re-run after merge (HO-4) | SC-005, SC-006, SC-008 |
| 6 | Cockpit | Main tree | `/merge-worktree <branch> skill-builder` (no `--shared-owner`) | SC-009 |
| 7 | The builder (🖐, a day or more later) | Mac | The live review (SC-007), wave C | Logged |

The three skill builds (008, 009, 010) run in parallel in step 1. Their sittings in step 2 can't:
one agent on AE at a time (`decisions/008`). Suggested order 008, 009, 010, as spec 004's build
order.

## Requests (not this skill's work)

To the cockpit, for spec 004's owner or others. None blocks the cloud build.

- **RQ-1 (spec 004, T042):** T042 expects `capture.mjs --compare practice-before.json` to say
  "Matches" on Mentor Practice. The 2026-10-20 read (`discovery/usage-notes/mentor-practice-state-2026-10-20.md`)
  shows Title eased and keys added at 4.37 s, unsaved; this skill's live lesson needs that state
  (spec 008 US1). If the builder saves the `.aep` that way, T042's compare will differ. Suggest T042
  log the differences rather than require a match, and this skill keep its own capture of the comp
  as it is (`practice-now.json`). The builder's call (open question for the cockpit).
- **RQ-2 (skill-builder persona):** `.claude/agents/skill-builder.md` › In this repo still says
  `server.mjs` and `session.mjs` are "still edited by every skill". After wave A that's wrong
  (add-only); a builder following it would fail `check-branch.mjs`. Suggest the cockpit update
  that line before the parallel builders start.
- **Observation for the shared owner (no change asked):** `segmentState()` calls bezier-out into
  hold-in "eased" (overlap row 7). This skill's own facing-sides test doesn't inherit it. L-7 logs
  what AE plays; if it holds, that's a note for easing's next shared pass.

## Risks

| Risk | Watch | Mitigation |
|---|---|---|
| Fastest-part model disagrees with the graph (FR-016) | L-6 and SC-004's 3 by-eye pairs | The reading step never gates the pass; fix the model in the lib before merge |
| 5% "comes to rest" is too loose or tight (FR-010d) | L-5 | Change the one constant only toward catching a visible bump (spec); log it |
| AE rounds the fingerprint (FR-008) | L-3 | Pick other two-decimal values that read back exactly; the check reads `DEMO_OUT`/`DEMO_IN` from one place |
| Scale's handles move all dimensions together (L-2) | L-2 | Then "one dimension shaped" can't happen: drop that fixture and eval 10, keep the per-dimension check |
| A resumed headless turn forgets "lands hard" | Tool test | Stored in `skill_options` by the session (T060, T061), not re-sent by the model |
| The sitting runs long | Quickstart timings | Split after the desk block into two sittings (open question for the builder) |

## Complexity Tracking

None.
