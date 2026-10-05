---
description: "Task list for the easing test slice"
---

# Tasks: Easing Test Slice

**Input**: Design documents from `specs/002-easing-slice/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/mentor-tools.md](contracts/mentor-tools.md),
[quickstart.md](quickstart.md)

**Tests**: included. The plan calls for `node:test` unit tests written first against fixtures
(plan › Build order, research R2), and the constitution requires an eval set (Principle III).

**Organization**: tasks are grouped by user story so each story can be built and tested on its
own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: which user story the task belongs to (US1, US2, US3)
- **🖐 Live**: needs After Effects open and the builder at the keyboard

## Path Conventions

From plan.md › Project Structure: `bridge/` (forked AE panel), `mentor/` (MCP server),
`.claude/skills/ease-mentor/` (teaching), `product/evals/easing/` (evals). Upstream source:
`~/after-effects-mcp` at commit `2cfff1a`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: fork the bridge and create the folder layout.

- [X] T001 Create the folders from plan.md › Project Structure: `bridge/`, `mentor/lib/`, `mentor/jsx/`, `mentor/dev/`, `mentor/test/fixtures/`, `product/evals/easing/{cases,fixtures,results}/`, `.claude/skills/ease-mentor/`
- [X] T002 Copy `cep/` (all files), `scripts/doctor.mjs`, `install.sh`, `uninstall.sh`, `install.ps1`, `uninstall.ps1`, and `LICENSE` from `~/after-effects-mcp` into `bridge/`, keeping the upstream MIT notice unchanged in `bridge/LICENSE`. Write `bridge/UPSTREAM.md` recording the source repo, commit `2cfff1a`, the date, and a "Changes" list (filled in by T003)
- [X] T003 Rename the fork's identity so it coexists with the installed upstream (research R1):
  - In `bridge/cep/CSXS/manifest.xml`: `ExtensionBundleId="com.aementor.bridge"`, extension IDs `com.aementor.bridge.host` / `.panel`, and `ExtensionBundleName="AE Mentor Bridge"`.
  - In `bridge/cep/host.js`, `bridge/cep/panel.js`, `bridge/install.sh`, `bridge/uninstall.sh`, `bridge/install.ps1`, `bridge/uninstall.ps1`, and `bridge/scripts/doctor.mjs`: config folder `AEMentorBridge` (not `ClaudeAEBridge`) and default port `47671` (not `47670`).
  - Verify that `grep -rn "claudebridge\|ClaudeAEBridge\|47670" bridge/` returns nothing, then list every change in `bridge/UPSTREAM.md`.
- [X] T004 [P] Create `mentor/package.json` with `"name": "ae-mentor"`, `"type": "module"`, `"engines": { "node": ">=18" }`, `"scripts": { "test": "node --test test/" }`, and **no dependencies** (constitution V, research R10)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: a running bridge, a server that answers, and the practice comp with its answer key.
Every story depends on these.

**⚠️ CRITICAL**: no user story work can begin until this phase is complete.

- [X] T005 Create `mentor/paths.mjs` exporting:
  - `MENTOR_HOME`: `process.env.AE_MENTOR_HOME`, else `~/Library/Application Support/AEMentor`, created if missing.
  - `SESSION_FILE`, `LEARNER_FILE`, and `CALLS_LOG` inside it (`session.json`, `learner.json`, `calls.jsonl`).
  - `BRIDGE_CONFIG`: `~/Library/Application Support/AEMentorBridge/bridge.json`.
- [X] T006 Create `mentor/errors.mjs` exporting `class MentorError extends Error { constructor(code, message) }` and the codes from contracts/mentor-tools.md › Errors: `AE_UNREACHABLE`, `AE_BUSY`, `NO_ACTIVE_COMP`, `NO_SESSION`, `DEMO_USED`, `NOT_DEMO_TARGET`, `UNKNOWN_LAYER`, `UNSAFE_RECORD`. Each carries the plain-language message from the contract table
- [X] T007 Create `mentor/bridge-client.mjs`:
  - Adapt `bridge()` and `ctx.health` / `ctx.run` from `~/after-effects-mcp/server/server.mjs`: `node:http`, a Bearer token from `BRIDGE_CONFIG`, and the timeout.
  - Map `ECONNREFUSED`, a missing config, and 401 to `AE_UNREACHABLE`, and a timeout to `AE_BUSY`.
  - Export only `health()` and `runSnippet(name, args)`. `runSnippet` reads `mentor/jsx/<name>.jsx`, prepends `var ARGS = <lit(args)>;`, using `lit()` copied from `~/after-effects-mcp/server/tools.mjs`, and sends it through `/run` with undo name `"AE Mentor: <name>"`.
  - `runSnippet` prepends every `mentor/jsx/lib/*.jsx` before `ARGS` (I1).
  - Script errors whose message starts with a known code (`"NO_ACTIVE_COMP: …"`) become `new MentorError(code, rest)`. Anything else becomes a generic error with the script's line number, like upstream's `scriptError` (U1).
  - Do **not** export a general `run(code)` (FR-013).
- [X] T008 Create `mentor/server.mjs` by adapting `~/after-effects-mcp/server/server.mjs`:
  - JSON-RPC 2.0 over stdio, the same protocol versions, `SERVER_INFO = { name: "ae-mentor", title: "AE Mentor", version: "0.1.0" }`.
  - `INSTRUCTIONS` stating the hard rules: say "Edit > Undo" and never an undo label; make no claims about the project after an `AE_UNREACHABLE` or `AE_BUSY` error; at most one demo per lesson.
  - Lists and calls `TOOLS` from `mentor/tools.mjs`, and returns a `MentorError` as an `isError` tool result with text `"<CODE>: <message>"`.
  - Appends every tool call to `CALLS_LOG` as `{ tool, args, ok, error_code, ms, at }`, in live and fixture mode alike, so SC-004 and the speed goals can be checked from the first live run (U2).
- [X] T009 Create `mentor/tools.mjs` exporting `TOOLS`: the six tools `snapshot_project`, `preview_frame`, `set_ease`, `diff_since_last`, `read_learner_record`, and `record_lesson`, with input schemas exactly as in contracts/mentor-tools.md. Each handler throws `new Error("not implemented")` for now
- [X] T010 Create `.mcp.json` at the repo root registering `ae-mentor` as `{ "type": "stdio", "command": "node", "args": ["mentor/server.mjs"] }`
- [X] T011 🖐 Live: run `bash bridge/install.sh`, restart AE, and confirm Window > Extensions shows both "Claude Bridge" and "AE Mentor Bridge". Run `node bridge/scripts/doctor.mjs` (expect OK) and `claude mcp list` (expect `ae-mentor` connected). Record any install fixes in `bridge/UPSTREAM.md`
- [X] T020a [P] Write `mentor/jsx/lib/paths.jsx` (ES3): `propPath(prop)` builds the match-name `path` and `displayPath(prop)` builds the `display_path` (joined with ` › `) by walking `propertyGroup()` up to the layer; `propByPath(layer, path)` does the reverse lookup. This is the **only** place paths are built (I1). Needed by T012 (answer key) and by T021/T022, so it lives in the foundation phase
- [X] T012 Write `mentor/dev/build-practice-comp.jsx` (ES3) to build **Mentor Practice** exactly as in research.md › R8:
  - Comp: 1920×1080, 30 fps, 8 s, with 10 layers in this order: Title, Subtitle, CTRL (null, parent of Title and Subtitle), Bar, Glow (adjustment), Cursor, Logo, Old Take (hidden), Icon (precomp containing a shape with 2 linear Position keys), Background.
  - Each layer gets the keys, interpolations, and expression listed in the R8 table.
  - Build every path with `propPath` / `displayPath` from `mentor/jsx/lib/paths.jsx` (T020a), never by hand. Write `mentor/dev/assemble.mjs`, which prints `mentor/jsx/lib/*.jsx` + a named dev script, so `node mentor/dev/assemble.mjs build-practice-comp` gives the text to paste into `ae_run_script`.
  - Then write `mentor/test/fixtures/practice-expected.json` (path passed as `ARGS.out`) listing every segment id (`"<layer index>/<match-name path>/<i>"`) and `display_path` with its expected `state` (`linear`, `eased`, or `held`), plus the expected `skipped`, `hidden_layers`, and `precomp_layers`.
  - Totals must be: 11 linear, 1 eased, 5 held, 2 skipped, 1 precomp.
- [X] T013 🖐 Live: open `discovery/Claude AE Tutor Test.aep`, run T012's assembled script through the **upstream** bridge (`ae_run_script`), and save the project. Check `practice-expected.json` against the Graph Editor by eye, and fix the script if they disagree. Leave the original comp untouched (the "nothing to ease" case)

**Checkpoint**: the bridge answers, `ae-mentor` is listed in Claude Code, and the practice comp and
its answer key exist.

---

## Phase 3: User Story 1 - Guided easing lesson on my own comp (Priority: P1) 🎯 MVP

**Goal**: one session, from "what did you find" to a verified eased result: find linear pairs,
pick a focus, explain with a frame, demo the first pair once, and check the learner's attempt.

**Independent Test**: quickstart.md §4 steps a–f on Mentor Practice. The mentor finds the linear
pairs, proposes a focus, demos only Title › Position's first pair, refuses "do the rest", and
correctly grades a partial and then a complete attempt.

### Tests for User Story 1 (write first, confirm they fail) ⚠️

- [X] T014 [P] [US1] Hand-write synthetic snapshots in `mentor/test/fixtures/synthetic/`, following data-model.md › Snapshot (`layers[].properties[].keys[]` with `in_type`/`out_type` ∈ `"linear" | "bezier" | "hold"`, and `in_ease`/`out_ease` as `{ speed, influence }[]`). One file per case:
  - `linear-basic.json`, `eased.json`, `held.json`, `half-eased.json` (key 1 out Bezier, key 2 in linear)
  - `expression.json` (`expression_enabled: true`), `single-key.json`
  - `separated-xy.json` (path `Transform/X Position`), `nested-trim.json` (`Contents/Rectangle 1/Trim Paths 1/End`), `effect.json` (`Effects/Gaussian Blur/Blurriness`)
  - `hidden-layer.json` (`enabled: false`), `null-first.json` (the first linear pair is on an `is_null` layer), `precomp.json` (`precomp_layers` non-empty), `scale-2d.json` (`dimensions: 3`, what AE reports for Scale on a 2D layer, checked in T013)
  - Plus `attempt-*.json` pairs (before/after) for diff tests: learner eased one pair, eased none, removed a key, changed an untargeted property, different comp id, **overdone** (influence 100%, must count as eased), and **undone** (eased then undone, must be still linear) (E1).
  - All paths use the match-name format from data-model.md › AnimatedProperty (`ADBE Transform Group/ADBE Position`), with `display_path` alongside.
- [X] T015 [P] [US1] Write `mentor/test/analyze.test.mjs` (`node:test`) for FR-002 covering:
  - A segment is `linear` if either side is `"linear"`, `held` if key *i* out is `"hold"`, otherwise `eased`.
  - Skips `expression` and `single_key`, with `skipped_reason`.
  - Segment id format `"<layer index>/<match-name path>/<i>"` (for example `"1/ADBE Transform Group/ADBE Position/1"`), and `display_path` carried into findings (I1).
  - `hidden_layers` and `precomp_layers` are passed through.
  - `focus_layers` limits `targets` but not `findings`.
  - `demo_target` is the first target on an `enabled && !is_null` layer, or `null` if there is none (null-first.json must pick the next visible layer).
  - `counts` totals.
  - An unknown focus name throws `UNKNOWN_LAYER`.
- [X] T016 [P] [US1] Write `mentor/test/diff.test.mjs` covering:
  - Per-target `result` ∈ `"eased_by_learner" | "eased_by_demo" | "still_linear" | "removed"`.
  - The demo segment is reported as `eased_by_demo` and excluded from `summary.total_for_learner` (US1-6).
  - `unexpected_changes` lists untargeted changes in plain language.
  - `comp_matches: false` gives empty `targets`.
  - `passed` = `comp_matches && still_linear === 0`.
  - Labels are formatted like `"Title › Position 0–1 s"` (layer name + the last part of `display_path`).
  - Overdone ease counts as `eased_by_learner`; an undone attempt reports `still_linear` (E1).
- [X] T017 [P] [US1] Write `mentor/test/session.test.mjs` for FR-006 and FR-007 covering data-model.md › Session state transitions:
  - `start()` → `started`; `recordDemo()` → `demo_done`; a second `recordDemo()` throws `DEMO_USED`; a demo on anything but `demo_target` throws `NOT_DEMO_TARGET`.
  - `markChecked()` → `checked`, and re-checking is allowed; calls with no session throw `NO_SESSION`; a new `start()` replaces the old session.
  - **Lesson boundaries (C1, C2):** `start()` on the same comp with the lesson not passed keeps `baseline` and `demo`, so `recordDemo()` still throws `DEMO_USED`; a new focus recomputes `targets` from the baseline, not the current state; `start()` after a passed check, or on a different comp id, resets everything; the result reports `lesson: "new" | "continued" | "resumed"`.
  - **Per-comp lessons (N3):** lesson on comp A, then a new lesson on comp B, then `start()` on A again **resumes** A's lesson with its baseline, targets, and `demo` intact (so a demo on A still can't be repeated); passing on B doesn't end A's lesson.
  - State persists to `session.json` in a temp `AE_MENTOR_HOME` and **survives re-importing the module** (research R4).

### Implementation for User Story 1

- [X] T018 [US1] Implement `mentor/lib/analyze.mjs` (FR-002): `analyze(snapshot, { focus_layers })` → `{ findings, skipped, hidden_layers, precomp_layers, focus, targets, demo_target, counts }`, following research R7 and data-model.md › Segment. Make T015 pass
- [X] T019 [US1] Implement `mentor/lib/diff.mjs`: `diff(baseline, current, session)` → the Check result from data-model.md, compared by segment id. Make T016 pass
- [X] T020 [US1] Implement `mentor/lib/session.mjs` over `SESSION_FILE`, shaped `{ "version": 1, "current": comp_id, "lessons": { [comp_id]: Session } }` (N3), where each Session has `lesson_id`, `baseline`, `focus`, `targets`, `demo` (`null | { segment_id, at }`), `comp_id`, `status` (`"started" | "demo_done" | "checked"`), and `passed` (boolean), with the lesson-boundary rules from data-model.md › Session. Make T017 pass
- [X] T021 [P] [US1] Write `mentor/jsx/snapshot.jsx` (ES3, no dialogs) for FR-001:
  - Read the active comp, and throw `NO_ACTIVE_COMP` if it isn't a CompItem.
  - For each layer, record `index`, `name`, `kind`, `enabled`, and `is_null` (`nullLayer`). Walk every property group recursively (transform, shape contents, effects, text animators), keeping properties where `canVaryOverTime && numKeys > 0`.
  - Use `propPath` and `displayPath` from `mentor/jsx/lib/paths.jsx` for `path` and `display_path`, plus `display_name`, `expression_enabled`, and `dimensions` (from `keyInTemporalEase(1).length`).
  - Throw errors as `"CODE: message"`, for example `throw new Error("NO_ACTIVE_COMP: Open a composition first.")` (U1).
  - Per key: `time` (rounded to 3 decimals), `in_type`/`out_type` from `keyIn/OutInterpolationType`, and `in_ease`/`out_ease`.
  - Record `precomp_layers` (`source instanceof CompItem`) without reading inside them, and `project` as the file **name only**.
  - Return JSON.
- [X] T022 [P] [US1] Write `mentor/jsx/set-ease.jsx` (ES3), taking `ARGS = { layer_index, property_path, key_index }`:
  - Resolve the property with `propByPath` from `mentor/jsx/lib/paths.jsx`, and throw `"CODE: message"` errors (U1).
  - Set key *i* out and key *i+1* in to `BEZIER`, keeping each key's other side as it was.
  - Call `setTemporalEaseAtKey` with `new KeyframeEase(0, 33.33)` repeated `dimensions` times for the eased side, and the existing ease for the other side.
  - Return a read-back of both keys.
- [X] T023 [P] [US1] Write `mentor/jsx/preview-frame.jsx` by adapting `ae_preview_frame` in `~/after-effects-mcp/server/tools.mjs` (`saveFrameToPng` to a temp file). Wait for a stable file size in `tools.mjs` the way upstream does, and default `time` to the comp's current time
- [X] T024 [US1] Implement `snapshot_project`, `set_ease`, `diff_since_last`, and `preview_frame` in `mentor/tools.mjs` (FR-001, FR-005, FR-006, FR-007, FR-013), exactly per contracts/mentor-tools.md, including the `lesson: "new" | "continued"` output: inputs, outputs (including `targets`, `demo_target`, `hidden_layers`, `precomp_layers`, and labels), the effects on the session, and error codes. `set_ease` checks the session **before** calling AE, and `diff_since_last` never changes the baseline
- [X] T025 [US1] 🖐 Live: with Mentor Practice active, call `snapshot_project` and save its raw snapshot as `mentor/test/fixtures/practice-before.json`. Add `mentor/test/practice.test.mjs` asserting that `analyze(practice-before)` matches `practice-expected.json` exactly (SC-001), and fix `snapshot.jsx` until it passes
- [X] T026 [US1] 🖐 Live: on a **duplicate** of Mentor Practice, run `set-ease.jsx` through the upstream `ae_run_script` on Title › Scale (2D) and on Bar › X Position. Confirm the read-back shows Bezier with 33.33% influence and the right number of dimensions, and that one Edit > Undo restores it. Delete the duplicate afterwards (plan › Risks: multi-dimension ease)
- [X] T027 [US1] Write `.claude/skills/ease-mentor/SKILL.md`, the teaching behavior (research R9):
  1. Call `snapshot_project` with no focus.
  2. Open with a short summary: propose **one layer (two at most)** and name **no more than 5 pairs**; mention hidden layers and precomps as limits.
  3. Propose a focus and call `snapshot_project` again with it.
  4. Explain easing using the learner's layer names and timing, with at least one `preview_frame`.
  5. Invite the learner to try.
  6. Demo with `set_ease` only when asked or clearly stuck ("I do, we do, you do"), then say what changed and "Edit > Undo".
  7. After the demo, decline "do the rest" and explain why.
  8. On "done", call `diff_since_last`. Give hints and never fix (FR-008), and allow re-checks.
  9. On any `AE_UNREACHABLE` or `AE_BUSY`, say it can't see the project and give the fix (FR-009).
  10. If `comp_matches` is false, ask the learner to return to the lesson's comp by name and re-check. Don't re-snapshot unless they ask for a new lesson (C1).
- [ ] T028 [US1] 🖐 Live: run quickstart.md §4 steps a–g with `/ease-mentor`. Time steps a–f (SC-002 ≤ 15 min). Across sessions, run **10 checks**: at least 3 partial, 2 wrong-property, 1 undone, and the rest complete. Compare each with the Graph Editor and log a table (attempt, mentor's verdict, my verdict, agree?); 9 or more must agree (SC-003). From `calls.jsonl`, confirm `set_ease` ran at most once per lesson and nothing else wrote to the project (SC-004), and report median and max `ms` for `snapshot_project` and `diff_since_last` against < 2 s / < 5 s. Log the results and any skill fixes in `discovery/usage-notes/easing-slice.md` (session 1)

**Checkpoint**: US1 works end to end on the practice comp. This is the MVP.

---

## Phase 4: User Story 2 - The mentor remembers what I learned (Priority: P2)

**Goal**: lessons are recorded, and the next session opens by reviewing or advancing instead of
re-teaching.

**Independent Test**: quickstart.md §5. After a lesson, `learner.json` is readable and has no
personal data. A session at least one day later refers to the lesson unprompted (SC-005).

### Tests for User Story 2 ⚠️

- [X] T029 [P] [US2] Write `mentor/test/learner-store.test.mjs` covering:
  - A missing file reads as `{ "version": 1, "skills": {}, "lessons": [] }`, and the result includes `path`.
  - `recordLesson(entry)` adds `date` and appends to `lessons`. It updates `skills["easing.basic"]`: `status` goes `"not_started" | "practicing" | "learned"`, becoming `learned` after 1 pass, with `last_practiced`, `times_passed`, and `next`.
  - `result` must be one of `"passed" | "partial" | "not_checked"`.
  - Any string field matching an email or phone pattern throws `UNSAFE_RECORD`, and there is no name field.
  - The store honors `AE_MENTOR_HOME`.

### Implementation for User Story 2

- [X] T030 [US2] Implement `mentor/lib/learner-store.mjs` (FR-010, FR-012) over `LEARNER_FILE`, with a LessonEntry of `{ date, skill: "easing.basic", project, comp, attempted, result, demo_used, summary, next }` as in data-model.md › Learner record. Write atomically (temp file + rename). Make T029 pass
- [X] T031 [US2] Implement `read_learner_record` and `record_lesson` in `mentor/tools.mjs` per contracts/mentor-tools.md §5–6
- [ ] T032 [US2] Update `.claude/skills/ease-mentor/SKILL.md` (FR-011, FR-010):
  - Call `read_learner_record` **first**.
  - If there's no easing history, teach. If the last result was `partial`, pick up what was still wrong (US2-3). If `learned`, do a short review on new keyframes or advance to the next focus (US2-2), and mention the earlier lesson in the opening.
  - At the end of a lesson, call `record_lesson` with plain-language `summary` and `next` and no names.
- [ ] T033 [US2] 🖐 Live: after a lesson, open `learner.json` and confirm it reads without tools and contains no name, email, or phone (US2-1, US2-4). **At least one day later**, run `/ease-mentor` and log whether it referred to the earlier lesson and reviewed or advanced (SC-005) in `discovery/usage-notes/easing-slice.md` (session 2). Also check `calls.jsonl` for SC-004 as in T028

**Checkpoint**: US1 and US2 both work. Memory carries across sessions.

---

## Phase 5: User Story 3 - An eval set tells me whether it teaches well (Priority: P3)

**Goal**: a repeatable, affordable eval run that scores teaching quality without AE.

**Independent Test**: quickstart.md §6. `run.mjs` runs at least 10 cases with no AE open, reports
pass or fail per case with reasons, and saves dated results that can be compared.

### Tests for User Story 3 ⚠️

- [ ] T034 [P] [US3] Write `mentor/test/fixture-mode.test.mjs` covering:
  - Spawn `node mentor/server.mjs` with `AE_MENTOR_HOME` (temp) and `AE_MENTOR_FIXTURE_STATE` set, and speak JSON-RPC over stdio.
  - `snapshot_project` reads the fixture named in the state file.
  - `set_ease` changes an in-memory copy, so a following `diff_since_last` shows `eased_by_demo`.
  - `"project": "unreachable"` gives `AE_UNREACHABLE` on every AE tool.
  - Each call appends `{ tool, args, ok, error_code, at }` to `calls.jsonl`.

### Implementation for User Story 3

- [ ] T035 [US3] (FR-014) Add fixture mode to `mentor/bridge-client.mjs` and `mentor/tools.mjs` per contracts/mentor-tools.md › Fixture mode:
  - When `AE_MENTOR_FIXTURE_STATE` is set, never open HTTP.
  - Snapshots come from the named fixture, with `set_ease` applied to an in-memory copy that is persisted in `MENTOR_HOME` so it survives a server restart between turns.
  - `preview_frame` returns a 1×1 placeholder PNG.
  - Make T034 pass.
- [ ] T036 [US3] **Risk check first** (plan › Risks): confirm `claude -p --mcp-config .mcp.json --output-format json` in this repo can load the `/ease-mentor` skill and the `ae-mentor` tools, and that `--resume <session_id>` continues a conversation. If the skill doesn't load headless, use `--append-system-prompt-file .claude/skills/ease-mentor/SKILL.md` instead. Record the working invocation in `product/evals/easing/README.md`
- [ ] T037 [P] [US3] 🖐 Live: capture eval fixtures from Mentor Practice into `product/evals/easing/fixtures/`, using `snapshot_project` after each setup:
  - `before.json`
  - `after-demo.json` (Title › Position pair 1 eased)
  - `partial.json` (demo + Title › Position pair 2 eased; Scale and Opacity still linear)
  - `wrong-property.json` (demo + Title › Scale *values* changed, but the pairs still linear)
  - `title-done.json` (every Title pair eased)
  - `other-comp.json` (a different comp active)
  - `all-eased.json` (the original comp)

  Restore the comp with Edit > Undo between captures.
- [ ] T038 [P] [US3] Write `product/evals/easing/rubric.md` with pass/fail definitions for: `R-LEADS` (proposes a lesson without being asked), `R-FOCUS` (on a busy comp, proposes one layer, two at most, and names no more than 5 pairs in the opening), `R-NAMES-LAYERS` (uses real layer and property names), `R-SHOWS` (uses a frame when explaining), `R-LEARNER-DOES` (asks the learner to act; no extra edits), `R-HINT-NOT-FIX`, `R-USES-MEMORY`, `R-STATES-LIMITS` (hidden layers, precomps), and `R-HONEST-WHEN-BLIND` (no claims when AE is unreachable)
- [ ] T039 [US3] Write at least 10 cases (14 listed) in `product/evals/easing/cases/NN-name.json`, following data-model.md › Eval case (`id`, `title`, `covers`, `learner_record`, `turns[{ project, say }]`, `expect`, `rubric`):

  | # | Case | Covers |
  |---|---|---|
  | 01 | New learner opening on `before` | US1-1, FR-003, R-FOCUS, R-STATES-LIMITS |
  | 02 | Explanation | FR-004, R-SHOWS, R-NAMES-LAYERS |
  | 03 | "Show me" → demo on the target only | FR-006 |
  | 04 | "Do it all" after the demo | US1-5, `set_ease_calls_max: 1` |
  | 05 | "Do it all" before any demo → first pair only | FR-006 |
  | 06 | Correct attempt (`title-done`) | FR-007, verdict pass |
  | 07 | Partial attempt | US1-4, FR-008, R-HINT-NOT-FIX |
  | 08 | Wrong property | US1-4, `unexpected_changes` |
  | 09 | Returning learner who passed | US2-2, R-USES-MEMORY |
  | 10 | Returning learner whose last attempt was partial | US2-3 |
  | 11 | AE unreachable | FR-009, R-HONEST-WHEN-BLIND |
  | 12 | Different comp at the check: `expect` no verdict reported and no `set_ease`; the mentor names the lesson's comp and asks to switch back | edge case, R-HONEST-WHEN-BLIND |
  | 13 | Nothing to ease (`all-eased`) | edge case |
  | 14 | Demo, re-snapshot, then "show me again" → `DEMO_USED`, `set_ease_calls_max: 1` | FR-006, C1 |

  Seed learner records live in `product/evals/easing/cases/learners/`.
- [ ] T040 [US3] Write `product/evals/easing/run.mjs` (Node built-ins only), following research R6:
  - Per case: create a temp `AE_MENTOR_HOME`, seed the learner record, and write the fixture state before each turn. Run turn 1 with `claude -p` (T036's invocation, `--max-turns 12`) and later turns with `--resume`.
  - Run deterministic checks from `calls.jsonl` and the tool results against `expect`.
  - Only if those pass (unless `--judge-always`): run a judge `claude -p` with `rubric.md`, the transcript, and the case's `rubric` items, requiring JSON `{ item, pass, reason }[]`.
  - Flags: `--only <case id | FR/US code>`; `--changed`, which skips cases whose SHA-256 over `SKILL.md`, `mentor/tools.mjs`, `mentor/lib/*`, the case file, and its fixtures matches the last passing result; and `--repeat N`.
  - Write `product/evals/easing/results/<YYYY-MM-DD-HHMM>.json` and print one summary line (passed/total and the percentage against the SC-006 target of 80%), plus the change against the most recent previous result (for example, "+1 pass; 04 now fails") (US3-3).
- [ ] T041 [US3] Write `product/evals/easing/README.md`: how to run (full run vs. `--changed` / `--only` / `--repeat`, and when a full run is required), how to read results, the cost per run (research R6), and the headless invocation from T036
- [ ] T042 [US3] Run the full eval set once, commit the results file as the baseline, and turn any failures into fixes in `.claude/skills/ease-mentor/SKILL.md` or new tasks. Re-run until SC-006 (≥ 80%) passes, or record why not in `discovery/usage-notes/easing-slice.md`

**Checkpoint**: all three stories work, and teaching quality has a baseline score.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T043 [P] Privacy sweep (constitution IV): search `mentor/test/fixtures/`, `product/evals/easing/`, and `discovery/usage-notes/` for email and phone patterns and for folder paths containing a real name. Fix anything found
- [ ] T044 [P] Finish `bridge/UPSTREAM.md` (the full list of changes vs. `2cfff1a`) and confirm `bridge/LICENSE` is the unchanged upstream MIT text
- [ ] T045 [P] Update `CLAUDE.md`: "Where to see it" (`/ease-mentor` + quickstart), "Stack or tools" (Node MCP server + forked CEP bridge per `decisions/003`), and "Current state"
- [ ] T046 🖐 Live: run all of quickstart.md §2–§7 once end to end, and confirm SC-001 through SC-004 hold
- [ ] T047 After at least 3 real sessions, write the SC-007 note in `discovery/usage-notes/easing-slice.md`: did I reach for this or Adobe's assistant while learning easing, and why? Link it from `decisions/002` › What would change our mind if it points either way

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories.
- **US1 (Phase 3)** depends on Foundational only. It's the MVP.
- **US2 (Phase 4)** depends on Foundational. Its code (T029–T031) can be built next to US1. Its
  skill changes and live check (T032–T033) need US1's skill (T027).
- **US3 (Phase 5)** depends on US1's tools (T024). Case 09/10 and memory rubric items need US2
  (T031–T032). Fixture mode (T034–T035) and the risk check (T036) can start as soon as T024 is done.
- **Polish (Phase 6)** after the stories you intend to ship.

### Within each story

- Tests (T015–T017, T029, T034) are written first and fail before implementation.
- `lib/` modules before `tools.mjs`, `tools.mjs` before the skill, and the skill before live runs.
- 🖐 Live tasks batch well: T011 and T013 in one AE sitting, then T025, T026, and T028 in another,
  and T037 in a third.

### Key task dependencies

| Task | Needs |
|---|---|
| T018 analyze | T014, T015 |
| T019 diff | T014, T016, T018 |
| T012 answer key | T020a |
| T021, T022 snippets | T020a |
| T024 tools | T007, T018–T023, T020a |
| T025 practice test | T013, T021, T024 |
| T027 skill | T024 |
| T035 fixture mode | T024, T034 |
| T040 runner | T035, T036, T038, T039 |
| T042 baseline | T037, T040, T032 |

## Parallel Examples

**Phase 1**: T004 alongside T002–T003.

**Phase 2**: T020a (paths.jsx) alongside T005–T010; T012 waits for it.

**US1, tests first (all different files):**
```text
T014 synthetic fixtures   T015 analyze.test.mjs   T016 diff.test.mjs   T017 session.test.mjs
```

**US1, AE snippets (independent of lib/ code):**
```text
T021 snapshot.jsx   T022 set-ease.jsx   T023 preview-frame.jsx   (paths.jsx already exists from T020a, Phase 2)
```

**US2 alongside US1:** T029 and T030 (learner store) can be built while US1's live tasks wait for
an AE sitting.

**US3:** T037 (fixtures), T038 (rubric), and T039 (cases) in parallel once T024 exists.

## Implementation Strategy

### MVP first (User Story 1 only)

1. Phase 1 → Phase 2 (fork, server, practice comp and answer key).
2. Phase 3 (US1), stopping at **T028**: a real lesson on the practice comp, timed and checked.
3. **Stop and evaluate**: does a led lesson with a checked attempt feel better than asking
   Adobe's assistant? Write it down. This is the sprint's main question (`decisions/002`).

### Incremental delivery

1. US1 → a live lesson works (MVP).
2. US2 → memory across sessions (needs a real day's gap, so start T033 early).
3. US3 → an eval baseline, so later skill changes can be measured.
4. Polish → privacy sweep, docs, and the SC-007 note.

### Notes

- **Commit after each phase checkpoint** when asked (constitution V). Never push without being
  asked.
- The upstream bridge stays installed throughout (research R1). It's used by T013, T026, and T037.
- If a task changes a behavior in spec.md, update the spec first (constitution I).
