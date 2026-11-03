# Implementation Plan: Panel UI overhaul (Home, Lesson, Skills)

**Branch**: `007-plan` (spec folder only; the build runs on its own worktree branches) |
**Date**: 2026-11-02 | **Spec**: [spec.md](spec.md) | **Mockup**:
[`product/mockups/ui-overhaul/`](../../product/mockups/ui-overhaul/README.md) (revision 3, linked, not copied)

**Status**: Awaits approval with the amended spec. Nothing is built until then. Written by hand to
`/speckit-plan`'s structure, because its setup script needs `.specify/feature.json`, outside this folder.

## Summary

Replace the one-screen panel with three tabs, on B1, in three steps that can each stop with a working
panel: easing in the new shell; the other five skills and the Skills tab; practice. The panel gets its
data from tool results it already receives, so **only two mentor changes** are needed: a generated data
file (no eval cost) and two table rows in `next-mentor/SKILL.md` (a new small eval set). No existing set
needs a full re-run because of this build.

## Technical Context

- **Language:** CommonJS JavaScript in the panel, as today, with no dependencies. `panel/helper/` is untouched.
- **Browser:** AE 26.5, CEP 12.0.1.2, CEF 99 (Chromium 99). See P4.
- **Runtime:** B1 throughout (FR-097). A's error kinds are tested from recorded streams.
- **Storage:** reads `learner.json`, `path.json` and `skills-built.json`; writes only its existing
  `panel-session.json` and frames.
- **Testing:** `node --test` in `panel/test/`, on recorded streams and saved records. Live checks by the builder.
- **Constraints:** 260 × 480 minimum; Home draws with no mentor turn, within 1 s (SC-004).

## Constitution Check (1.3.0)

| Principle | Result |
|---|---|
| I. Spec before build | Pass: amended spec, approval gate |
| II. Decisions | Pass: `002`, `003`, `005`, `006`, `007`, `008`, `009`, `010` respected. The panel holds no teaching logic; row words map tool codes and never decide a state. No new decision record needed |
| III. Teaching evaluated | Pass: every new request has cases; next-mentor gets the set it lacks |
| IV. Privacy | Pass: no names; the panel stores nothing new about the learner |
| V. Simplicity | Pass: no dependencies, smallest-first steps |
| VI. One owner | Pass: tasks split by owner; eval-engineer writes the cases |

## Plan decisions

- **P1. Panel modules.** Pure and tested, with `main.js` as DOM wiring only:
  `lib/skills.js` (path, data file, skill table), `lib/checklist/<skill>.js` plus `index.js` (tool result →
  rows), `lib/lesson.js` (reducer, Pick / Try / Done), `lib/home.js`, `lib/skills-view.js`, `lib/view-state.js`
  (model → README state id, which SC-003's tests drive), `lib/errors.js` (replaces `errors-a.js`), `lib/copy.js`
  (all panel copy, for the scan), `lib/connection.js`. `requests.js` gains per-skill text; `path.js` goes.
- **P2. The data file: skill-builder owns it.** `mentor/curriculum/skills-built.json`, written by
  `mentor/scripts/write-skills-built.mjs` from `discover()` (built from `SKILLS`, review from
  `FINDERS[id].review === true`), with `mentor/test/skills-built.test.mjs` failing when it's out of date. New
  files only, so the add-only rule holds and no eval is affected. `path.json` is left alone: it mirrors
  `curriculum.md` and says "built" isn't stored there on purpose. The panel reads it through `cfg.repo_path`. If it
  can't be read, only the path's first skill counts as built, and the panel logs it.
- **P3. B1 allowlist and hand-over.** A lesson started directly gets that skill's own `allowed-tools`, as its eval
  runner does. Next-mentor's run gets every skill's tools plus `Skill`, with `--tools ToolSearch,Skill`. The list comes
  from `SKILL.md` frontmatter, matching option A. **This hand-over has never run under these flags, so T030 checks it
  first.** If it fails, Yes, let's go sends the recommended skill's own command instead, read from `recommend_next`'s
  result. That's panel-only and also works on A; typed agreement would then stop short, which the eval cases would show.
- **P4. Short docks without `:has`.** `@media (max-height: 560px)` replaces the mockup's `@container`, since the panel
  fills its viewport. A class on the lesson's own container (`.list-open`), set by the arrow's handler and cleared after a
  check, hides the chat. T011's scan fails on `:has(`, `@container`, `color-mix(`, `text-wrap`, `dvh`, CSS nesting and
  anything else newer than Chromium 99.
- **P5. Offset's scale.** One scale per lesson, in seconds:
  - **Start:** the earliest start seen (`group.members[].start`, each check's `start_before`, `start_now`).
  - **End:** the latest start seen on the layers kind, or the latest landing (`end_before`, `end_now`) on the properties
    kind, then padded by 25%, with a span of at least 1 s.
  - **Clamp:** to `offset_snapshot.comp.duration`, unless a key is already past it.
  - **Widen only** during a lesson, so diamonds don't jump between checks.
  - Rows draw from the snapshot at the opening and from `start_now` afterward. Comp length is rejected (research R8).
- **P6. Connection.** `lib/connection.js` extends the bridge read to return `connected`, `not_connected` or `busy`, polled
  every 5 s while the panel is visible and on Try again. `bridgeStarted()` keeps its contract for continuing a lesson.
- **P7. Retry.** Each adapter exposes `announcesCalls`. The panel applies FR-030 from it. B1's Try again after a timeout
  stops the process and resumes the session first (research R5).
- **P8. Saved session.** `panel-session.json` moves to version 2 because the view's shape changes. An older file reads as
  nothing to continue, as the reader already does for another version.
- **P9. Step 1's interim.** Up next always shows the path's first skill with Start lesson, and the Skills tab shows one line
  plus that same start. Step 2 removes both, so stopping after step 1 still tells the truth.
- **P10. Copy.** `lib/copy.js` takes the wording from `index.html`, not the README's error table, which still holds the
  pre-pass text. `copy-pass.html` shows which is final.

## Project Structure

```text
specs/007-ui-overhaul/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md, tasks.md
└── contracts/button-requests.md, contracts/checklist-rows.md

panel/lib/        skills.js, home.js, skills-view.js, view-state.js, errors.js, copy.js,
                  connection.js, checklist/ (new); lesson.js, requests.js, activity.js,
                  memory.js, adapter-*.js, panel-session.js (changed); path.js, errors-a.js (removed)
panel/            main.js, index.html, panel.css, CSXS/manifest.xml (changed)
panel/test/       one test file per module; contrast and sync tests changed
mentor/           curriculum/skills-built.json, scripts/write-skills-built.mjs,
                  test/skills-built.test.mjs (all new)
.claude/skills/next-mentor/SKILL.md   two rows
product/evals/    next-mentor/ (new), new cases in all six sets
```

## Mentor changes and eval cost

Estimates use about $0.50 to $1 a case, from easing's $12 for 26 and the 2026-10-29 round's $180.

| Change | Owner | Eval cost |
|---|---|---|
| `skills-built.json`, generator, test | skill-builder | None |
| Two rows in `next-mentor/SKILL.md` | skill-builder | The new next-mentor set: about 9 cases, $5 to $10 |
| New button cases (no mentor change) | eval-engineer | 35 cases, about $18 to $35 |

**Total about $22 to $45, plus repeats on failures.** A new case that fails and needs a `SKILL.md` fix triggers that skill's
full set under FR-072, about $12 to $40 a set. That's the real risk: these buttons have never been run on the five newer
skills. No tool behaviour changes.

## Risks

- **Hand-over on B1** is untested (P3). Checked first, with a fallback.
- **Row mapping is the bulk of the work** across six vocabularies. A real recorded stream per skill keeps it honest; the eval
  transcripts supply fixtures.
- **The mockup hasn't been seen in a browser** by its own note, so fit at 260 × 480 may move. SC-010 is checked in AE.
- **One sitting at a time:** one AE lock, so live tasks run in series.
