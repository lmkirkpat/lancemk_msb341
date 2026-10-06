# Implementation Plan: Mentor Panel in After Effects

**Branch**: `003-mentor-panel` (spec folder only; no git branch) | **Date**: 2026-10-05 |
**Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-mentor-panel/spec.md`

## Summary

A panel inside After Effects that runs spec 002's easing lesson from start to finish with nothing
typed in a terminal, and shows the lesson's stage, the learning path and the learner's memory.

The approach follows `decisions/005` (option B1):
- **Runtime:** the panel keeps one headless Claude Code process per lesson and talks to it over
  stdin and stdout as JSON lines (R1). The process is launched with the eval runner's flags, so the
  mentor in the panel is the mentor the evals measure, with no Bash, file or web tools (R2).
- **One seam:** everything model-facing sits in one adapter module with a small event interface
  (`contracts/mentor-adapter.md`). Option A later means writing a second adapter.
- **Data, not wording:** the check list, demo button, stage, path and memory come from tool results
  and the learner record, never from the mentor's text (R5).
- **Separate extension:** the panel is its own CEP bundle in `panel/`. The bridge doesn't change
  (R4).

The mentor itself (skill, server, learner record) is unchanged, except for fixes the four new
button eval cases turn up (R10).

## Technical Context

**Language/Version**: JavaScript. Panel: CommonJS, ES2020, plain HTML and CSS in CEP (AE's
bundled Chromium and Node). Tests and dev scripts: Node 18+ (dev: 26.8.1)

**Primary Dependencies**: none from npm. Runtime: Claude Code 2.1.289 (headless, stream-json in
and out). Reuses `mentor/` and `.mcp.json` unchanged

**Storage**: local files in the AEMentor folder (`~/Library/Application Support/AEMentor/` or
`AE_MENTOR_HOME`): `panel.json` (config), `panel-session.json` (display log), `panel-turns.jsonl`
(timings and cost). Reads `learner.json`; never writes it

**Testing**: `node:test` unit tests in `panel/test/` for the adapter (with a fake process and
recorded stream lines), check list, stage, path, memory, safe text rendering, and the
requests-to-eval-cases check; the existing eval runner with 4 new cases; `panel/dev/drive.js`
against fixture mode; a manual live run per `quickstart.md`

**Target Platform**: macOS, After Effects 26.4+ (CEP). Not tested on Windows

**Project Type**: AE extension panel (UI) driving a local CLI agent

**Performance Goals**: the first sign of the mentor working (a status line or its words) within
10 s of a click in at least 9 of 10 turns (SC-004, measured as `first_event_ms`); a full lesson in 15 minutes or less (SC-005)

**Constraints**:
- Constitution 1.1.0 › II: the panel holds no teaching logic, touches the project only through the
  mentor's tools, and only reads the learner record.
- No general tools for the panel's mentor (R2): only the six `ae-mentor` tools plus ToolSearch.
- At most one demonstration per lesson, still enforced by the server (`DEMO_USED`).
- No npm dependencies; code must run in CEP's older Node (R8).
- Everything model-facing behind one adapter (`decisions/005`).
- AE's child processes don't inherit the Terminal's `PATH`, so the adapter sets it (R3), and a
  check inside CEP runs before the UI is built (tasks T004).

**Scale/Scope**: one learner, one Mac, one skill. About 12 small panel modules, 2 dev scripts,
install and uninstall scripts, 4 eval cases, 1 new eval check

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.* Constitution 1.1.0.

| Principle | Check | Pre-research | Post-design |
|---|---|---|---|
| I. Spec Before Build | `specs/003-mentor-panel/spec.md` committed (`a4e8446`) before this plan | ✅ | ✅ |
| II. Decisions Are Recorded | Depends on **`decisions/005`** (B1, one adapter seam), **`decisions/003`** as amended (thin pipe, narrow tools; `bridge/` unchanged, R4), **`decisions/004`** (Spec Kit). 1.1.0 panel rules: no teaching logic (requests describe what the learner wants, `contracts/button-requests.md`); no project access except the mentor's tools (the adapter's guarantees; the only bridge call is the status endpoint for the "same AE session" test, which returns no project data, R6); the learner record is only read (data-model) | ✅ | ✅ |
| III. Teaching Quality Is Evaluated | The panel adds new inputs to the mentor, so 4 button eval cases (17–20) join `product/evals/easing/` with the existing rubric, plus one new deterministic check; a unit test keeps case text and `requests.js` in sync (R10) | ✅ | ✅ |
| IV. Privacy by Default | Panel files live outside the repo; no personal fields; the turn log holds no message text; dev scripts print `~` for the home folder (R11) | ✅ | ✅ |
| V. Simplicity and Checkpoints | **Zero** npm dependencies; no framework; one new top-level folder (`panel/`). Adds one machine-level item: a second CEP symlink. This plan is shown before building. Commit only when asked | ✅ | ✅ |

No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-mentor-panel/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0: R1–R11
├── data-model.md        # Phase 1: Panel config, Panel session, LessonView, CheckList, Path, Memory, Turn log
├── quickstart.md        # Phase 1: install, tests, drive, live lesson, evals, edge cases, speed
├── contracts/
│   ├── mentor-adapter.md    # The one seam: interface, events, stream mapping, launch flags
│   └── button-requests.md   # Labels, fixed requests, eval cases 17–20
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
panel/                          # NEW: the AE Mentor panel (its own CEP bundle, R4)
├── CSXS/manifest.xml           # com.aementor.panel, "AE Mentor", Node enabled
├── index.html                  # Layout from product/mockups/ae-panel.md
├── panel.css                   # AE dark UI, single column, wraps when narrow
├── main.js                     # DOM wiring only: buttons, input, rendering, unload → adapter.stop()
├── lib/                        # Pure CommonJS, no DOM, no CEP: runs under node --test
│   ├── config.js               # Read and validate panel.json (R3)
│   ├── adapter-claude-code.js  # The seam (contracts/mentor-adapter.md)
│   ├── stream.js               # Claude Code stream lines → adapter events
│   ├── lesson.js               # LessonView: demo_made, checks, passed, stage, check list (data-model)
│   ├── path.js                 # Path view
│   ├── memory.js               # Memory view from learner.json
│   ├── requests.js             # Button labels and fixed requests (contracts/button-requests.md)
│   ├── activity.js             # Tool name → plain status line ("Checking your keyframes…"), FR-012
│   ├── text.js                 # Safe rendering subset for mentor text (R8)
│   ├── panel-session.js        # Read and write panel-session.json; continue rules (R6)
│   ├── bridge-status.js        # The bridge's start time from /health, nothing else (R6)
│   └── turns.js                # Append panel-turns.jsonl (R9)
├── test/                       # node:test; recorded stream lines in test/fixtures/
├── dev/
│   ├── drive.js                # Run the adapter from Terminal (fixture or live)
│   ├── record-fixtures.js      # Re-record test/fixtures/stream-*.jsonl (the T005 spike)
│   └── turns.js                # SC-004 share and cost per lesson from panel-turns.jsonl
├── package.json                # "test": "node --test test/" (no dependencies)
├── install.sh                  # Symlink AEMentorPanel, write panel.json (claude, node, repo paths)
└── uninstall.sh

product/evals/easing/
├── cases/17-button-check-partial.json      # NEW
├── cases/18-button-hint.json               # NEW
├── cases/19-button-show-me.json            # NEW
├── cases/20-button-show-me-again.json      # NEW
└── run.mjs                                 # + "preview_frame called this turn" check

discovery/usage-notes/mentor-panel.md       # NEW: live checks, SC-004 numbers, SC-008 note

mentor/, bridge/, .claude/skills/ease-mentor/   # Unchanged (SKILL.md only if cases 17–20 fail)
```

**Structure Decision**: one new top-level folder, `panel/`, beside `bridge/` and `mentor/`,
matching `decisions/003`'s layers: the pipe (`bridge/`), the tools (`mentor/`), and now the
interface (`panel/`). Logic that decides what's shown is in `panel/lib/` so it's tested without AE;
`main.js` stays a thin DOM layer.

## Build order (for /speckit-tasks)

1. **Spike (first, half a day at most):** confirm R1 with `panel/dev/drive.js`: the stream-json
   input line format, `/ease-mentor` as the first stdin message, partial messages, and how long the
   first reply takes. Record real stream lines as test fixtures. If stream input fails, fall back to
   one `-p --resume` per turn (R1 alternative) behind the same adapter interface.
2. Adapter and stream mapping with tests (US1 foundation).
3. Lesson, check list, requests, text rendering with tests; the panel shell, install script, and
   the US1 live run (MVP).
4. Stage and path (US2), memory (US3).
5. Eval cases 17–20 and the new check (US4); full eval run.
6. Continue after reopen (FR-016), edge cases, turn log and `dev/turns.js`; usage notes.

## Complexity Tracking

No constitution violations.
