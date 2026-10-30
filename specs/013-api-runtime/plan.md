# Implementation Plan: Option A Runtime (the Panel Calls the Claude API Directly)

**Branch**: `013-api-runtime` (spec folder only; no git branch) | **Date**: 2026-10-30 |
**Spec**: [spec.md](spec.md) (approved 2026-10-30)

**Input**: Feature specification from `specs/013-api-runtime/spec.md`, with Resolved Questions 1 to 5.

## Summary

Option A runs the six mentor skills on the Claude API with nothing added, and proves it with the
eval sets. The approach (research R1 to R14):

- **A local helper process** (`decisions/010`, spec Q1). The A adapter in the panel starts one small
  Node process per lesson, the helper. The helper runs the agent loop on the Claude API through the
  official Anthropic Node SDK (Q3), and starts `ae-mentor` over stdio exactly as `.mcp.json`
  describes. It talks to the adapter in JSON lines that carry the adapter contract's events
  ([contracts/helper-protocol.md](contracts/helper-protocol.md)), so B1's shape (the adapter starts a
  process and reads events) is kept. The panel stays dependency-free and never sees the key.
- **The evals run the same helper**, not a copy: a runner started with `--runtime a` spawns the
  helper per case and turns its events into today's transcript shape, so every deterministic check
  and the judge work unchanged (FR-030, FR-031). The judge stays on Claude Code (FR-032).
- **What the model sees is an allowlist**: a short preamble (shown in full below for approval), the
  server's own instructions from its `initialize` reply, the active skill's `SKILL.md` body
  byte-for-byte in the system prompt (Q5), and the tools the skill's `allowed-tools` lists, as the
  server describes them. Nothing from `CLAUDE.md`, `~/.claude/`, settings or the repo's other files
  can get in (FR-016), and a request log lets the eval engineer check that independently (SC-008).
- **Settings in one file** (`panel/helper/settings.json`): model, effort, thinking display, cache
  lifetime, skill placement, step limit, timeout, output limit, fallbacks. The panel and the evals both read it (FR-028). The first
  comparison uses Opus 5.5 at the effort B1's Claude Code actually used, found first (T001), so only
  the runtime changes.
- **Comparison order** (Q4): easing on A; stop and triage if it misses B1 by more than 5 points;
  then the other five sets; then `--repeat 3` on regressions; then the cheaper-model runs (Q2).
  About $115 plus about $60.

The skills, `mentor/`, the server's instructions, eval cases, fixtures and rubrics are unchanged.
A gap found by the comparison goes to that file's owner as its own change (spec › Out of scope).

## Technical Context

**Language/Version**: JavaScript. Helper: ES modules on Node 18+ (the builder's Node from
`panel.json`'s `node_path` today, Knack's private Node from spec 006 FR-003 later). Panel adapter:
CommonJS for CEP, as the rest of `panel/lib/`. Eval runners: ES modules, Node 18+.

**Primary Dependencies**: `@anthropic-ai/sdk` (official Anthropic Node SDK), exact version pinned
in `panel/helper/package.json` with a committed lockfile; approved 2026-10-30 (constitution V,
spec Q3). Only the helper depends on it. `panel/lib/`, `mentor/` and the eval runners stay
built-ins only. Reuses `mentor/server.mjs` over stdio unchanged.

**Storage**: the learner home (`~/Library/Application Support/AEMentor/` or `AE_MENTOR_HOME`):
`panel.json` gains `runtime`; new `panel-conversation.json` and `panel-conversation-frames/`
(FR-023); `panel-turns.jsonl` gains fields (FR-029). The access key lives only in the macOS
Keychain (FR-018). Repo files: `panel/helper/settings.json`, `prices.json`, `preamble.md`.

**Testing**: `node:test` in `panel/helper/test/` (loop, prompt assembly, MCP client, errors, cost,
conversation, key handling) against a fake Messages service and the real `ae-mentor` in fixture
mode; `panel/test/` for the A adapter, config and turn log; the six eval runners with
`--runtime a`; an allowlist check and a key scan owned by the eval engineer; live lessons by the
builder per [quickstart.md](quickstart.md).

**Target Platform**: macOS (the builder's Mac: AE 26.5, macOS 27.0.1), CEP panel. Not Windows.

**Project Type**: a local helper process (CLI-shaped, JSON lines on stdio) behind the panel's
adapter seam, shared with the eval runners.

**Performance Goals**: first sign of the mentor working within 10 s in at least 9 of 10 turns
(SC-002, spec 003 SC-004's clock); median lesson cost at most $0.40 (SC-004).

**Constraints**:
- Same tools, same text, nothing added (FR-004 to FR-016); append-only history (FR-015, and
  preserved thinking on Opus 5.5 requires it anyway, R7).
- The key in memory in the helper only; never in a child's environment, a file, a log or the
  panel (FR-018 to FR-021).
- One helper per lesson, one turn at a time, 12 model steps, 5-minute turn timeout (FR-007).
- B1 unchanged byte-for-byte while the setting is B1 (FR-037, SC-009).
- One AE sitting at a time (`decisions/008`); every live task holds the AE lock.

**Scale/Scope**: one learner, one Mac. About 10 helper modules, 1 new adapter, 4 changed panel
files, 1 shared eval module plus a small change in each of 6 runners, 3 data files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.* Constitution 1.3.0.

| Principle | Check | Pre-research | Post-design |
|---|---|---|---|
| I. Spec Before Build | Spec 013 approved 2026-10-30 with Q1 to Q5 resolved, before this plan | ✅ | ✅ |
| II. Decisions Are Recorded | Depends on **`decisions/009`** (option A ships; B1 until A is built), **`decisions/010`** (the helper process starts `ae-mentor` over stdio; amends **`005`**'s option-A sketch of importing `mentor/tools/`), **`decisions/005`** (one adapter seam, the panel only displays), **`decisions/003`** (thin pipe, narrow tools, learner record in local files; nothing here touches `bridge/` or adds a tool), **`decisions/004`** (Spec Kit), **`decisions/007`/`008`** (owners and hooks). Panel rules: the panel holds no teaching logic, never reads or changes the project, `session.json` or `learner.json` (the helper doesn't either; only `ae-mentor` does); the preamble holds no teaching rules (FR-012, shown below) | ✅ | ✅ |
| III. Teaching Quality Is Evaluated | All six eval sets move with the runtime and must meet FR-033 before A becomes the default (SC-003); B1 baselines re-run on the same commit after any fix (FR-034) | ✅ | ✅ |
| IV. Privacy by Default | No personal fields added; turn log keeps no text; saved conversation stays in the learner home, never the repo; eval results keep `scrubHome`; the key is scanned for (SC-005) | ✅ | ✅ |
| V. Simplicity and Checkpoints | **One** new dependency, approved (Q3), confined to `panel/helper/`; no framework; no new top-level folder. This plan is shown before building; commit only when asked | ✅ | ✅ |
| VI. One Owner per File | Helper and adapter: panel-builder (`panel/**`). Runner changes, allowlist check, key scan, equivalence records: eval-engineer (`product/evals/**`), so the checks of the helper aren't written by its builder. `SKILL.md`/`mentor/` gaps: skill-builder, only through a separate change. Live lessons: the builder, one AE sitting at a time | ✅ | ✅ |

No violations, so Complexity Tracking is empty.

## Who owns the helper

`ownership.json`: panel-builder owns `panel/**`; skill-builder owns `mentor/**` (built-ins only,
add-only shared code). **The helper goes to panel-builder, at `panel/helper/`.** Reasons: it is the
A half of the panel's adapter seam (`decisions/005`: everything model-facing behind one adapter in
the panel), B1's equivalents (`runtime.js`, `adapter-claude-code.js`) are already panel-builder's,
and the eval runners already import from `panel/lib/`. It does not fit `mentor/`: it holds the SDK
dependency `mentor/` forbids, and `mentor/` is add-only shared code.

**Flagged, not decided here:** the helper outlives the CEP panel (a UXP panel would start the same
helper, FR-040), and the installer ships it as an outside-AE part (spec 006 FR-026). If the cockpit
would rather it sit outside `panel/` before UXP, that's a `decisions/007` and `ownership.json`
change by the cockpit, not a path this plan invents. Nothing in the helper depends on living under
`panel/`; it finds its data files relative to itself.

## The preamble (FR-012), approved 2026-10-30

The only text the runtime adds. One file, `panel/helper/preamble.md`, versioned by its hash in every
eval result. No teaching rules (what to teach, when to demonstrate, how to grade, what to record):

```text
You are the mentor inside Knack, a panel docked in Adobe After Effects. The person you're talking
with is learning After Effects in their own open project. They read your replies in a narrow panel
beside their comp, and they answer by typing or by pressing the panel's buttons, whose requests
arrive as ordinary messages. You can see and change their project only through the tools you've
been given. Your instructions for this lesson follow.
```

Changing it later is a builder approval plus a re-run of every set (FR-036's hash covers it).

## Project Structure

### Documentation (this feature)

```text
specs/013-api-runtime/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0: R1–R14
├── data-model.md        # Phase 1: runtime settings, lesson prompt, conversation, price table, turn log, results fields, equivalence record
├── quickstart.md        # Phase 1: setup, tests, eval comparison, live lessons, faults, scans
├── contracts/
│   ├── helper-protocol.md   # Adapter ⇄ helper JSON lines; the A adapter's events and error kinds; the key check
│   └── eval-runtime.md      # The runners' --runtime switch, transcript mapping, results fields, summary line
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
panel/helper/                    # NEW (panel-builder): the option A helper (decisions/010)
├── package.json                 # "type": "module"; @anthropic-ai/sdk pinned exactly; "test": "node --test test/"
├── package-lock.json
├── main.mjs                     # Entry: JSON lines in (start, send, stop, key_check), events out (contracts/helper-protocol.md)
├── settings.json                # FR-028: model, effort, thinking_display, cache_ttl, skill_placement, max_steps, turn_timeout_ms, max_tokens, fallbacks
├── skill-tool.json              # FR-012 item 2: the hand-over tool's definition (allowlisted runtime text, D3)
├── prices.json                  # FR-026: dated per-model prices by token kind
├── preamble.md                  # FR-012: the text above
├── lib/
│   ├── settings.mjs             # Load and validate settings.json; settings hash
│   ├── skills.mjs               # Read a *-mentor SKILL.md: allowed-tools from frontmatter, body bytes (FR-010, FR-017)
│   ├── mcp-client.mjs           # Start ae-mentor per .mcp.json with an allowlisted env; initialize → instructions; tools/list; tools/call (FR-004, FR-009, FR-011)
│   ├── prompt.mjs               # Fixed-order system blocks, tool definitions, cache breakpoints, prompt hash (FR-005, FR-012, FR-013, FR-016)
│   ├── loop.mjs                 # One turn: stream, run allowed tools, step limit, timeout, hand-over, history check, failed-turn tail (FR-005–FR-008, FR-014, FR-015, FR-021a, FR-022)
│   ├── conversation.mjs         # Append-only save after each complete exchange; frames as files; load for continue (FR-023, FR-024)
│   ├── key.mjs                  # Keychain read (security CLI), eval env fallback, key check (FR-018–FR-020)
│   ├── errors.mjs               # SDK errors and stop reasons → error kinds; key scrubbing (FR-021, FR-027)
│   ├── cost.mjs                 # Usage by kind × price table → cost_usd, or null if unknown (FR-026)
│   └── request-log.mjs          # Opt-in request dump without the key, for the allowlist check (SC-008)
├── dev/
│   └── chat.mjs                 # FR-039: builder-only terminal chat over the same helper, any skill, live comp
└── test/                        # node:test; fake Messages service; ae-mentor in fixture mode

panel/lib/
├── adapter-api.js               # NEW: the A adapter (same interface and events as adapter-claude-code.js)
├── config.js                    # + runtime setting; claude_path not required on A (FR-037, FR-038)
└── turns.js                     # + runtime, model, effort, token counts by kind, other_model flag (FR-029)
panel/main.js                    # Choose the adapter; A's error messages (FR-027, spec 007 FR-056)
panel/dev/turns.js               # Cost and SC-004 per runtime (US5)
panel/install.sh                 # npm ci in panel/helper; keep runtime as set
panel/test/                      # adapter-api, config and turns tests
.gitignore                       # already ignores node_modules/ (no change)

product/evals/                   # eval-engineer
├── lib/runtime-a.mjs            # NEW: spawn the helper per case, collect events, map to the transcript shape
├── lib/allowlist-check.mjs      # NEW: SC-008 over a run's request log
├── lib/key-scan.mjs             # NEW: SC-005 scan of files and child environments
└── */run.mjs, */README.md       # --runtime switch, results fields, B1-baseline diff, A baseline (FR-030–FR-036)

mentor/, bridge/, .claude/skills/*-mentor/   # Unchanged by this feature
```

**Structure Decision**: one new folder inside the panel's tree, `panel/helper/`, holding the only
code with a dependency. The panel's own code (`panel/lib/`, `main.js`) stays dependency-free and
CEP-compatible; it only spawns the helper with `node_path`, as B1 spawns `claude`. The eval runners
spawn the same helper, so what the evals measure is what the panel runs.

## Phases and order

1. **Find B1's model and effort (T001), before anything is configured.** The 2026-10-29 baselines
   ran on Claude Code's default for the builder's account; the results files don't record it. R2
   lists where to look. A's `settings.json` starts on Opus 5.5 at that effort. If B1 wasn't Opus
   5.5, the builder decides whether the first A comparison uses B1's model instead (flagged in the
   hand-back; the spec says Opus 5.5).
2. **Helper core (foundational)**: settings, skills reader, MCP client, prompt, loop, errors, cost,
   with tests against a fake service and the real server in fixture mode.
3. **In parallel once the core's protocol is fixed**: the A adapter and panel wiring
   (panel-builder) and the runners' `--runtime a` (eval-engineer).
4. **Comparison runs** (eval-engineer, about $115): easing, the stop rule, the other five, repeats;
   then the equivalence records. Gaps go to skill-builder as separate changes (FR-034 re-runs B1).
5. **Key, continue, turn log** (panel-builder), then the scans and fault tests (eval-engineer and
   the builder).
6. **Live** (the builder, one AE sitting at a time): SC-001 (3 lessons), SC-002, SC-004, SC-007,
   then FR-039's terminal chat for a non-easing skill and a hand-over.
7. **Cheaper models** (Q2, about $60), then **A becomes the default** (FR-035, FR-037).

## Amendments after the helper's build (2026-10-30)

The helper core (T002 to T015) is on `main` (`d934115`). The review and the builder's decisions D1 to
D3 changed the spec (spec › Amendments); three tasks were added:

- **T059** (D1): a failed turn keeps its complete exchanges. Test first: a failure at step 3 after a
  demonstration, then the next turn still has the demo's call and result.
- **T060** (D2): tool changes for the hand-over on Opus 5.5 and Sonnet 5.5, after a live check of the
  two open points (research R5). Before T031 and T055 (spec resolved question 9).
- **T061**: `panel/install.sh` doesn't require Claude Code when `runtime` is `"a"` (FR-038), before
  T054.

The amended contract (contracts/helper-protocol.md) is what T017 builds against.

## Amendments after the evals and adapter merge (2026-10-30)

`013-evals` (T022 to T029) and `013-adapter` (T017 to T020, T059, T061, and the review's fixes) are
on `main` (`5963fef`). No task added. The spec, data model and both contracts now match the merged
code (spec › Amendments after the merge): a call in flight when a turn fails is kept with a seventh
fixed text (S1), the learner's text joins a history-ending user message (M1), the test-only
`keychain: false`, `during: "start"`, the adapter's `turn_end` extras and backstop, and the eval
contract's request-field list, hash files and README baseline line. T060 now also owes the eval
engineer the real tool-change block shape.

## Complexity Tracking

None.
