# Implementation Plan: Easing Test Slice

**Branch**: `002-easing-slice` (spec folder only; no git branch) | **Date**: 2026-09-30 |
**Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-easing-slice/spec.md`

## Summary

A mentor session in Claude Code that leads an easing lesson on the learner's open After Effects
comp: find linear keyframe pairs, explain with a rendered frame, demonstrate on the first pair
only, check the learner's own attempt, and remember the result across sessions.

The approach follows `decisions/003`'s three layers:
- **AE pipe:** the upstream CEP bridge, forked into `bridge/` with its own IDs so it runs next
  to the upstream install.
- **Mentor MCP server (`mentor/`):** six narrow tools. `snapshot_project` takes an optional focus so
  the mentor can teach a manageable chunk of a busy comp. All analysis, checking, and rule
  enforcement is deterministic, unit-tested code here, including the one-demo rule.
- **Teaching:** a Claude Code skill (`/ease-mentor`) decides what to say and when.

Evals run headless Claude Code against saved snapshots, with no AE and no new dependencies.

## Technical Context

**Language/Version**: JavaScript (ES modules) on Node 18+ (dev: 26.8.1); ExtendScript (ES3) for
the fixed AE snippets

**Primary Dependencies**: none from npm. The MCP stdio server, HTTP bridge, and tests use Node
built-ins, the same as upstream. Runtime: Claude Code 2.1.285 (skill and headless evals)

**Storage**: local JSON files in `~/Library/Application Support/AEMentor/` (`learner.json`,
`session.json`), overridable with `AE_MENTOR_HOME`

**Testing**: `node:test` unit tests for analysis, diff, rules, and the learner store; the eval
runner in `product/evals/easing/` for teaching quality; manual live run per `quickstart.md`

**Target Platform**: macOS with After Effects 26.4+ (CEP). Windows install scripts carried
from upstream but not tested in this slice

**Project Type**: local MCP server with an AE extension (CLI-hosted, no custom interface)

**Performance Goals**: snapshot under 2 s and check under 5 s **on the 10-layer practice comp**
(measured in T028 from `calls.jsonl`); full lesson in 15 minutes or less (SC-002). Larger comps
(about 50 layers) aren't tested in this slice

**Constraints**:
- No general script tool reachable by the mentor (FR-013).
- At most one demo per lesson, enforced in code (FR-006).
- No teaching logic inside AE (`decisions/003`).
- No personal data in records (Principle IV).
- The AE-side piece must stay small enough to rewrite for UXP.

**Scale/Scope**: one learner, one machine, one skill (`easing.basic`); a 10-layer practice comp
with 11 linear pairs and 9 traps (research R8); about 10–15 eval cases

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Check | Pre-research | Post-design |
|---|---|---|---|
| I. Spec Before Build | `specs/002-easing-slice/spec.md` committed (`950a5e2`) before planning | ✅ | ✅ |
| II. Decisions Are Recorded | Depends on **`decisions/003`**: the AE pipe stays a pipe (`bridge/` changes are IDs and naming only); narrow tools only (6 tools, none run arbitrary code, R3); the mentor and learner record live outside AE (R4, R5). Depends on **`decisions/004`**: Spec Kit for build work | ✅ | ✅ |
| III. Teaching Quality Is Evaluated | `product/evals/easing/` with a rubric that scores leading, making the learner do the work, naming real layers, and using memory, plus deterministic checks (R6) | ✅ | ✅ |
| IV. Privacy by Default | Learner record has no name field; the server rejects email and phone patterns; snapshots store the project file name, not the folder path | ✅ | ✅ |
| V. Simplicity and Checkpoints | **Zero** new npm dependencies (R6, R10). New machine-level tool: none. This plan is shown before building. Vendoring about 400 lines of upstream bridge code is a copy, not a dependency | ✅ | ✅ |

No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-easing-slice/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0: R1–R10
├── data-model.md        # Phase 1: Snapshot, Segment, Session, Check result, Learner record, Eval case
├── quickstart.md        # Phase 1: end-to-end validation
├── contracts/
│   └── mentor-tools.md  # Phase 1: the 6 MCP tools, errors, fixture mode
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks), not created yet
```

### Source Code (repository root)

```text
bridge/                          # Forked from LiamcKerr/after-effects-mcp @ 2cfff1a (MIT)
├── cep/                         # Panel: tokenized localhost pipe → evalScript. IDs renamed only
│   ├── CSXS/manifest.xml        #   com.aementor.bridge
│   ├── host.js, host.html, panel.js, panel.html
│   └── jsx/bridge.jsx
├── scripts/doctor.mjs
├── install.sh, uninstall.sh     # (+ .ps1 carried, untested)
├── LICENSE                      # Upstream MIT notice, kept
└── UPSTREAM.md                  # Source commit, and what changed and why

mentor/                          # MCP server "ae-mentor" (stdio)
├── server.mjs                   # JSON-RPC over stdio, adapted from upstream server.mjs
├── paths.mjs                    # AE_MENTOR_HOME, session/learner/calls file paths, bridge config
├── errors.mjs                   # MentorError and the contract's error codes
├── bridge-client.mjs            # HTTP + token to the panel (from upstream), or fixture mode
├── tools.mjs                    # The 6 tools from contracts/mentor-tools.md
├── lib/
│   ├── analyze.mjs              # Snapshot → segments, findings, demo_target (R7)
│   ├── diff.mjs                 # Baseline + current + demo → check result
│   ├── session.mjs              # session.json state machine (data-model)
│   └── learner-store.mjs        # learner.json read/append, privacy check
├── jsx/                         # Fixed ExtendScript snippets (the only code sent to AE)
│   ├── lib/paths.jsx            # The only place property paths are built (id + display)
│   ├── snapshot.jsx
│   ├── set-ease.jsx
│   └── preview-frame.jsx
├── dev/
│   ├── build-practice-comp.jsx  # R8: builds "Mentor Practice" and writes its answer key
│   └── assemble.mjs             # Prints lib/*.jsx + a dev script for pasting into ae_run_script
└── test/
    ├── fixtures/                # practice-expected.json (answer key) + snapshots for unit tests
    └── *.test.mjs               # node:test

.claude/skills/ease-mentor/
└── SKILL.md                     # Teaching behavior (R9)

product/evals/easing/
├── README.md                    # How to run, how to read results
├── rubric.md                    # Teaching-quality criteria
├── run.mjs                      # Headless claude -p runner + judge (R6)
├── fixtures/                    # Mentor Practice snapshots: before, after demo, partial, wrong
│                                #   property, Title done, other comp; plus the all-eased original comp
├── cases/*.json                 # 10+ cases (data-model: Eval case)
└── results/                     # Dated run outputs, committed for comparison

.mcp.json                        # Registers ae-mentor for this repo

discovery/usage-notes/
└── easing-slice.md              # Live-run logs: SC-002/003/004 tables, SC-005, SC-007
```

**Structure Decision**: two code folders that match `decisions/003`'s layers. `bridge/` is the
AE-side pipe, and the only part that moves to UXP later. `mentor/` is the replaceable tools
layer. Teaching lives in the skill, and evals live where the constitution says
(`product/evals/`). There's no shared `src/`, since the two folders deploy to different places
(inside AE vs. a Node process).

## Build order (input for /speckit-tasks)

1. **Foundation:**
   - `mentor/jsx/lib/paths.jsx`, then the practice comp and its answer key (the analysis tests
     are written against it).
   - `bridge/` fork with renamed IDs, installed, doctor passes.
   - `mentor/server.mjs` + `bridge-client.mjs` answering a health check.
   - `.mcp.json`.
2. **US1, core loop:**
   - `snapshot.jsx` + `analyze.mjs` (tests first on fixtures).
   - `set-ease.jsx` + session rules.
   - `diff.mjs`.
   - `preview_frame`.
   - `/ease-mentor` skill.
   - Live run, quickstart steps 4a–f.
3. **US2, memory:** `learner-store.mjs`, `read_learner_record` / `record_lesson`, and the skill's
   opening logic.
4. **US3, evals:**
   - Fixture mode.
   - Capture fixtures from Mentor Practice.
   - Rubric (including "picks a focus" and "states its limits"), cases, `run.mjs` with
     `--changed`, `--only`, `--repeat`, and skip-judge-on-fail (R6).
   - First baseline run committed.

## Risks

- **Headless evals and skills:** if `claude -p` can't load the project skill or MCP server the
  way an interactive session does, fall back to `--append-system-prompt-file` with the skill
  text. Check this early in US3.
- **Multi-dimension ease:** `setTemporalEaseAtKey` needs one ease per dimension. Getting
  Scale wrong throws in AE. Cover it with a fixture and a live check on Scale.
- **Traversal gaps:** separated dimensions, shape-layer contents, effects, and text animators all
  sit at different depths in AE's property tree. The answer key catches anything the walk misses.
  Text animator properties aren't in the practice comp yet; add one if the first live run shows a
  gap.
- **Undo labeling** (spec 001, row 11): never tell the learner a label. Always say Edit > Undo.

## Complexity Tracking

No constitution violations to justify.
