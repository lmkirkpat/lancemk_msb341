# Implementation Plan: Panel UI overhaul (Home, Lesson, Skills)

**Branch**: `007-plan` (spec folder only; the build runs on its own worktree branches) |
**Date**: 2026-11-02 | **Spec**: [spec.md](spec.md) | **Mockup**:
[`product/mockups/ui-overhaul/`](../../product/mockups/ui-overhaul/README.md) (revision 3, linked, not copied)

**Status**: Approved 2026-11-04 with the spec; corrected the same day from the review and
`decisions/011`. Written by hand to
`/speckit-plan`'s structure, because its setup script needs `.specify/feature.json`, outside this folder.

## Summary

Replace the one-screen panel with three tabs, on B1, in three steps that can each stop with a working
panel: easing in the new shell; the other five skills and the Skills tab; practice. The panel gets its
data from tool results it already receives, so **one mentor change is left**: a generated data
file (no eval cost). Two table rows in `next-mentor/SKILL.md` are already on `main` (`6094ee9`) and need a new small eval set. No existing set
needs a full re-run because of this build.

## Technical Context

- **Language:** CommonJS JavaScript in the panel, as today, with no dependencies. `panel/helper/` is untouched.
- **Browser:** AE 26.5, CEP 12.0.1.2, CEF 99 (Chromium 99). See P4.
- **Runtime:** built and evaluated on B1 (FR-097, `decisions/011`: panel features build on B1; A's errors use the fake service, so
  A's kinds are tested from recorded streams). The last check before a tester is on A (below).
- **Storage:** reads `learner.json`, `path.json` and `skills-built.json`; writes only its existing display log
  (`panel-session.json`, `panel-frames/`) and turn log (`panel-turns.jsonl`). FR-067, T075.
- **Testing:** `node --test` in `panel/test/`, on recorded streams and saved records. Live checks by the builder.
- **Constraints:** 260 × 480 minimum; Home draws with no mentor turn, within 1 s (SC-004).

## Constitution Check (1.3.0)

| Principle | Result |
|---|---|
| I. Spec before build | Pass: amended spec, approval gate |
| II. Decisions | Pass: `002`, `003`, `005`, `006`, `007`, `008`, `009`, `010`, `011` respected. The panel holds no teaching logic; row words map tool codes and never decide a state. No new decision record needed |
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
- **P3. B1 allowlist and Yes.** Every B1 start and resume gets that skill's own `allowed-tools` at launch, `next-mentor` included (spec 013 FR-042, landed with
  013 T065, `panel/lib/skill-tools.js`), with `--tools ToolSearch` as today and no `Skill`. It has to be the launch: frontmatter grants tools for one turn only, and `--resume` takes the list given at that launch, not the earlier one (013 research R6). `main.js` hard-codes
  `REQUESTS.start` today, so `startLesson` must take the request and pass `skillOf(request)` (T041).
  **B1 can't hand over, so Yes on B1 is a panel action:** read `recommendation` from `recommend_next`'s `tool_result.json`, which `stream.js` already gives, map it to a
  request ([contracts/button-requests.md](contracts/button-requests.md)), stop next-mentor's process, and start that skill's lesson as Start lesson would (T052). The
  panel looks up data and sends a fixed request with parameters (FR-069), so it stays display-only (FR-065, `decisions/005`). **On A, the same button sends `Yes, let's go.`
  and the real hand-over runs.** Each adapter exposes `handsOver` (A true, B1 false), as with `announcesCalls`. The hazard: `main.js`'s `exit` handler clears
  `state.adapter` and `lessonOpen`, so the stopped process's late `exit` would close the new lesson; handlers must ignore events from an adapter that's been replaced.
- **P4. Short docks without `:has`.** `@media (max-height: 560px)` replaces the mockup's `@container`, since the panel
  fills its viewport. A class on the lesson's own container (`.list-open`), set by the arrow's handler and cleared after a
  check, hides the chat. T011's scan is a named list. CSS: `:has(`, `@container`, `color-mix(`, `text-wrap`, `dvh`, CSS nesting. Scripts in
  `main.js` and `panel/lib/**`: `toSorted`, `toReversed`, `toSpliced`, `.with(`, `Object.groupBy`, `Map.groupBy`, `Promise.withResolvers`,
  `Array.fromAsync`, `Set` methods such as `.union(`, the regex `v` flag, and `:has(` in a selector string. The list grows when a live
  sitting finds something it missed.
- **P5. Offset's scale.** One scale per lesson, in seconds:
  - **Start:** the earliest start seen (`group.members[].start`, each check's `start_before`, `start_now`).
  - **End:** the latest start seen on the layers kind, or the latest landing (`end_before`, `end_now`) on the properties
    kind, then padded by 25%, with a span of at least 1 s.
  - **Clamp:** to `offset_snapshot.comp.duration`, unless a key is already past it.
  - **Widen only** during a lesson, so diamonds don't jump between checks.
  - Rows draw from the snapshot at the opening and from `start_now` afterward. Comp length is rejected (research R8).
- **P6. Connection.** `lib/connection.js` extends the bridge read to return `connected`, `not_connected` or `busy`, polled
  every 5 s while the panel is visible and on Try again. `bridgeStarted()` keeps its contract, and `canContinue` still reads null as "can't", but only a start time that answers
  and differs ends a saved lesson (FR-028), so the read also returns the start time.
- **P7. Retry.** Each adapter exposes `announcesCalls`. The panel applies FR-030 from it, including `demo_unknown`. B1's Try again
  after a timeout stops the process and resumes the session first (research R5).
- **P8. Saved session.** `panel-session.json` moves to version 2 because the view's shape changes. An older file reads as
  nothing to continue, as the reader already does for another version. It keeps `claude_session_id`, which spec 013's continue flow
  (013 T044) reads, keeps the opening `skill` that 013 T065 added at version 1, because resuming on B1 needs that skill's launch list, and adds the `labels` and `picked_up` of the lesson view. Try again's
  resume passes the saved skill too (T023); without it a non-easing lesson falls back to easing's list and is denied. Next-mentor's picking process isn't a lesson, so it writes no display log (T052).
- **P9. Step 1's interim.** Up next always shows the path's first skill with Start lesson, and the Skills tab shows one line
  plus that same start. Step 2 removes both, so stopping after step 1 still tells the truth. Home with a record at step 1 has the id
  `home-return-interim`: the `home-first` card plus the memory card, so no new drawing.
- **P10. Copy.** `lib/copy.js` takes the wording from `index.html`, not the README's error table, which still holds the
  pre-pass text. `copy-pass.html` shows which is final.

## Project Structure

```text
specs/007-ui-overhaul/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md, tasks.md
└── contracts/button-requests.md, contracts/checklist-rows.md

panel/lib/        skill-tools.js (spec 013's, already there); skills.js, home.js, skills-view.js, view-state.js, errors.js, copy.js,
                  connection.js, checklist/ (new); lesson.js, requests.js, activity.js,
                  memory.js, adapter-*.js, panel-session.js (changed); path.js, errors-a.js (removed)
panel/            main.js, index.html, panel.css, CSXS/manifest.xml (changed)
panel/test/       one test file per module; contrast and sync tests changed
mentor/           curriculum/skills-built.json, scripts/write-skills-built.mjs,
                  test/skills-built.test.mjs (all new)
product/evals/    next-mentor/ (new), new cases in all six sets
```

## Shared work with spec 013 (`decisions/011`)

Each piece has one owning task. The other task points to it and never rebuilds it. If 007 gets there first, its panel-builder or eval
engineer runs the owning 013 task as written, and the cockpit ticks it in 013.

| Work | Owning task | 007's task | If 013 gets there first | If 007 gets there first |
|---|---|---|---|---|
| A lesson's `--allowedTools` from its skill's `allowed-tools`, in `adapter-claude-code.js` (013 FR-042) | 013 T065 (landed, `9fc10bb`) | T039 done by it. T041 and T023 pass the skill on their new paths | Landed | n/a |
| Whether `next-mentor` hands over on B1 | 013 T065's check (it can't) | T030, done | Settled | n/a |
| Yes on B1 | T052 (013 T065 built nothing for it) | T052 | n/a | n/a |
| Runners' lists from `allowed-tools` (FR-042) | 013 T064 (done) | T032's new runner uses its reader, without `Skill` on B1 | T032 uses it | n/a |
| `bash panel/install.sh --runtime a\|b1` | 013 T066 (done) | None. 007 changes the manifest only (T025), and T066 doesn't touch it; T079 uses the flag | T079 uses it | n/a |
| `ready-for-a.mjs` | 013 T067 (done) | T077 runs it again once the new cases and runner exist | T077 re-runs it | n/a |
| Paid A runs of whole sets | 013 T031, T032 | T078 pays only for what those runs leave out | T078 runs only 007's new cases, with `--only` | The new cases are in the sets, so 013's runs include them |
| `adapter-claude-code.js`'s other lines (`announcesCalls`, stop and resume) | T023 | T023 | 013 T049 sees them as merged | Same (FR-097) |
| `adapter-api.js` | 013 T044 owns resume; T023 owns `announcesCalls` | T023 | Different lines; the cockpit merges one at a time | Same |

## Mentor changes and eval cost

Estimates use about $0.50 to $1 a case, from easing's $12 for 26 and the 2026-10-29 round's $180. A's rate is about the same (013 T031,
T032: about $0.50 to $0.55 a case).

**On B1, in this build (subscription limits, no API credit, `decisions/011`):**

| Change | Owner | Eval cost |
|---|---|---|
| `skills-built.json`, generator, test | skill-builder | None |
| Two rows in `next-mentor/SKILL.md` (done, `6094ee9`) | skill-builder | The new next-mentor set on B1: 9 cases (5 openings, 4 Yes-path cases that stop at the recommendation and the follow-on start), $5 to $10 worth |
| New button cases (no mentor change) | eval-engineer | 35 cases, about $18 to $35 worth |

**Total about $22 to $45 worth, plus repeats on failures.** A new case that fails and needs a `SKILL.md` fix triggers that skill's
full set under FR-072, about $12 to $40 worth a set. That's the real risk: these buttons have never been run on the five newer
skills. No tool behaviour changes.

**Moving to A, before the first tester (FR-099; API credit where noted; nothing starts without the builder's go):**

| Step | Task | Cost |
|---|---|---|
| Free check and dry runs | T077 | Free |
| Paid eval run: next-mentor's set (the 5 openings, plus 4 real hand-over cases that run only on A, about $2 to $4 of it), plus any new cases 013's runs left out | T078 | Credit: $5 to $10 for next-mentor, and up to $18 to $35 for the rest. About $5 to $10 of that if only easing and pivot's 10 cases were left out |
| Live on A: a lesson and a hand-over | T079 | Credit: about $1 |

Easing and speed graph have no real hand-over case for now (builder's decision, 2026-11-04). They can be added at the first tester check, 2 more cases on A, about $1 to $2.

The real hand-over cases have no B1 result to compare with, so they're judged on their rubric and hard rules, and a problem with them shows up only here.

So this spec adds **about $24 to $46 of credit** to the first-tester checkpoint, on top of decision 011's six sets (about $115), and no
credit before it. On a fixed credit, that checkpoint and the $100 budget already don't fit; this widens the gap.

## Risks

- **Yes differs by runtime** (P3): B1 tests the follow-on start, and only A tests the real hand-over, late (T078, 013 T055).
- **next-mentor's hand-over mismatches** (`discovery/usage-notes/next-mentor-handover.md`, read from the skills and tools, not run). No `SKILL.md` change or re-run is planned for them here:
  - **Item 1:** the suggestion can name layers, and then the lesson asks or proposes on its own, since Yes sends no layers. T032 covers it.
  - **Item 2:** on null's crowded comp, `focus_layers` is empty and step 3 has no wording for that. T032 covers it. Yes still works; the wording is the mentor's.
  - **Item 3, known issue:** anchor's list can be long, so the suggestion could read out many names. Yes still works.
  - **Item 4, known issue:** a prerequisite can be offered twice, by next-mentor and again by the lesson.
  - **Item 5:** next-mentor passes `review` as an argument, while the skills send `mode: "review"` only on the learner's own words. A due review is fine; "I already know it" is the doubt. T032 covers it.
- **B1 passing doesn't prove A passes** (`decisions/011`). The new buttons reach A last, at FR-099's paid steps, so a problem there shows
  up late.
- **Row mapping is the bulk of the work** across six vocabularies. A real recorded stream per skill keeps it honest; the eval
  transcripts supply fixtures.
- **The mockup hasn't been seen in a browser** by its own note, so fit at 260 × 480 may move. SC-010 is checked in AE.
- **One sitting at a time:** one AE lock, so live tasks run in series.
