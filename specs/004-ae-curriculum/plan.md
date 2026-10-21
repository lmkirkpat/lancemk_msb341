# Implementation Plan: After Effects curriculum (sprint 3 baseline)

**Branch**: `004-ae-curriculum` (spec folder only; no git branch) | **Date**: 2026-10-20 |
**Spec**: [spec.md](spec.md) | **Teaching design**: [curriculum.md](curriculum.md) (the curriculum
designer's; linked, not copied)

**Input**: Feature specification from `specs/004-ae-curriculum/spec.md`, approved 2026-10-20.

**Status**: Draft, awaiting the builder's approval. Tasks ([tasks.md](tasks.md)) cover wave A's
shared pieces only.

## Summary

Spec 004 decides the ten-skill path and the shared pieces every skill needs. This sprint's baseline
(H2) is skills 2, 1, 3, 5 and 6, plus reviews for 2, 1 and 3. This plan:

- **Wave A, in detail.** One shared-code owner builds, alone, everything skills 2, 1 and 3 need
  from shared code: the path data and recommendation, the record's review fields and schedule,
  R0, the cross-layer timing analysis, the easing analysis parts they reuse, a per-skill session
  with a review mode, kept-linear marks (FR-038: a learner's "this runs at constant speed" is
  remembered and easing stops proposing it), fixture plugins, and the second practice comp's wave A
  targets. Then three
  skill builders build skills 2, 1 and 3 in parallel (specs 008, 009, 010), **adding files only**.
- **Wave C (reviews for 2, 1, 3), in detail.** Because wave A builds the review data, schedule,
  review mode and recommendation, wave C needs **no shared-code change**: each skill's review mode
  is in its own spec and files, plus eval cases and SC-009's live reviews.
- **Wave B, outlined.** A second shared-owner pass (R1, R3, the visibility class, the
  motion-sources map's first step, KD-001's fix), then skills 5 and 6 in parallel.
- **Wave D, outlined.** Stretch.

The approach keeps `decisions/003` and `005`: the bridge stays a pipe, every new read is part of a
fixed snippet, every rule a tool can enforce (one demo, no demo in a review, the record matching
the session, the recommendation order) is enforced in `mentor/` code with unit tests, and the
teaching stays in each skill's `SKILL.md`.

## Technical Context

**Language/Version**: JavaScript (ES modules) on Node 18+; ExtendScript (ES3) for the fixed AE
snippets

**Primary Dependencies**: none from npm (constitution V). Node built-ins only. Runtime: Claude Code
(skills, headless evals), `decisions/005` option B1 for the builder's panel

**Storage**: `learner.json` and `session.json` in `AE_MENTOR_HOME` (default
`~/Library/Application Support/AEMentor/`), unchanged location; the record stays `version: 1` with
additive fields (research R3). Path data in `mentor/curriculum/path.json` (in the repo, not
learner data)

**Testing**: `node:test` in `mentor/test/` (unit tests on saved snapshots and saved records,
FR-012, FR-036); eval sets in `product/evals/` by the eval engineer (FR-033); live runs logged in
usage notes (SC-001, SC-002, SC-009)

**Target Platform**: After Effects 26.5 on macOS 27.0.1 (CLAUDE.md › My setup, H1). R0 reads the
version each session (FR-030)

**Project Type**: local MCP server with an AE extension, plus Claude Code skills

**Performance Goals**: as spec 002 (snapshot under 2 s, check under 5 s on a 10-layer comp);
`recommend_next` adds at most one snapshot. A lesson in 15 minutes or less (SC-001)

**Constraints**: one demo per lesson and none in a review, in code; no open-ended scripts
(FR-009); no personal data (FR-011, FR-022); Mentor Practice, its script and the easing fixtures
unchanged (FR-031); easing evals at 25/25 or within one after every merge (FR-035); one shared-code
owner per wave, everyone else adds files only (FR-032, `check-branch.mjs`)

**Scale/Scope**: one learner; 11 skills in the path data, 3 built in wave A (plus easing), 5 by
the end of wave B; two practice comps

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.*

| Principle | Check | Pre-research | Post-design |
|---|---|---|---|
| I. Spec Before Build | Spec 004 approved 2026-10-20. Skills 2, 1, 3 each get their own spec (008, 009, 010) before they're built; this plan builds only shared pieces | ✅ | ✅ |
| II. Decisions Are Recorded | **`decisions/003`, `005`**: the bridge is unchanged; R0 is one line in the existing snapshot snippet; every new tool is narrow (`recommend_next` reads only); the panel gets no logic. **`007`**: the spec writer owns these files; the skill-builder owns `mentor/` and skill prompts; the eval engineer owns the cases; the curriculum designer owns `curriculum.md`, which a test reads but nobody here edits. **`008`**: one agent on AE (live tasks are marked 🖐 and run by one builder); worktrees; `check-branch.mjs`'s `addOnly` enforces FR-032. **`009`**: shipped Knack moves to the direct API later; nothing here depends on the runtime (tools, record and skills are reused by option A). No new decision needed | ✅ | ✅ |
| III. Teaching Quality Is Evaluated | Eval plan below names the cases the eval engineer writes; the easing set is re-run after the shared merge (FR-035). The recommendation and review data are unit tested; how the mentor *says* them is evaluated | ✅ | ✅ |
| IV. Privacy by Default | R0 keeps only version and OS (FR-011, unit test). New record fields are layer and property names, kinds and dates; the existing email and phone check covers every text field | ✅ | ✅ |
| V. Simplicity and Checkpoints | Zero new dependencies. No refactor of easing's tools beyond moving `takeSnapshot` and `parseSegmentId` to shared files and exporting two functions; easing's tool inputs and outputs don't change. This plan stops for approval | ✅ | ✅ |
| VI. One Owner per File, Independent Checks | One skill-builder is wave A's shared-code owner and the only one changing existing shared files; parallel builders add files only. Eval cases by the eval engineer, never the builder. Numbers (specs 008 to 010, eval cases) from the cockpit | ✅ | ✅ |

No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-ae-curriculum/
├── spec.md              # Approved 2026-10-20
├── curriculum.md        # Curriculum designer's teaching design (read only here)
├── plan.md              # This file
├── research.md          # R1–R14: the shared interfaces and the plan's calls
├── data-model.md        # Path, skill state, lesson entry, session lesson, analyzer result, host, timing
├── quickstart.md        # Validating wave A's shared branch
├── contracts/
│   ├── skill-module.md  # How a skill plugs in by adding files (for specs 008–010 and later)
│   └── shared-tools.md  # read_learner_record, record_lesson, recommend_next, server rules, errors
├── checklists/
└── tasks.md             # Wave A's shared pieces only
```

### Source code: what wave A's shared-code owner changes and adds

**Changes (existing files; only the owner may):**

```text
mentor/
├── server.mjs                 # instructions: "teaches After Effects skills"; rule 3 generalised
├── errors.mjs                 # DEMO_USED, NOT_DEMO_TARGET reworded; REVIEW_NO_DEMO; registerErrors()
├── bridge-client.mjs          # error pattern built lazily, so registered codes are recognised
├── fixture.mjs                # loads mentor/fixture/<snippet>.mjs twins; edits carry `snippet`
├── tools/index.mjs            # collects FINDERS; passes skills and finders to commonTools
├── tools/common.mjs           # record_lesson checks and stored fields; read_learner_record review
│                              #   fields; recommend_next
├── tools/easing.mjs           # takeSnapshot and parseSegmentId from shared files; FINDERS (review: false)
├── lib/analyze.mjs            # + parseSegmentId (moved); kept_linear option (FR-038); no change without marks
├── lib/diff.mjs               # export unexpectedChanges; no behaviour change
├── lib/session.mjs            # per skill and comp; analyzer passed in; review mode; review_offers
├── lib/learner-store.mjs      # kind, already_knew, targets; review_due, reviews_passed_in_row; marks
├── jsx/snapshot.jsx           # + host { ae_version, os } (R0)
└── dev/capture.mjs            # --compare ignores host
.claude/skills/ease-mentor/SKILL.md   # step 2: one line for a kept-linear property (FR-038)
```

Nothing under `bridge/` changes. `.claude/skills/ease-mentor/SKILL.md` gets one line (step 2: name a
kept-linear property among what it leaves out, FR-038).
No existing test file is edited; if one must change, its task says why.

**Adds (new files):**

```text
mentor/
├── curriculum/path.json       # FR-001 path data and finding map
├── lib/path.mjs               # readPath(), skillName(), built(skills)
├── lib/reviews.mjs            # FR-019 schedule (pure)
├── lib/recommend.mjs          # FR-004–FR-007, FR-020 limits (pure)
├── lib/timing.mjs             # FR-016 timing measures, clusters() (pure)
├── lib/host.mjs               # R0 parse and atLeast()
├── lib/marks.mjs              # FR-038 kept-linear marks: applies(), marksFor(), isKeptLinear()
├── lib/snapshot.mjs           # takeSnapshot() shared by every skill
├── fixture/                   # (folder for skill fixture twins; set-ease stays built in)
├── dev/build-practice-comp-2.jsx
└── test/
    ├── path.test.mjs, reviews.test.mjs, recommend.test.mjs, timing.test.mjs, host.test.mjs,
    │   session-skills.test.mjs, learner-store-v1.test.mjs, fixture-plugins.test.mjs,
    │   skill-module.test.mjs, analyze-unchanged.test.mjs, recommend-tool.test.mjs,
    │   record-tool.test.mjs
    └── fixtures/
        ├── records/           # ≥ 12 saved learner records (SC-005)
        ├── practice-findings-baseline.json   # easing findings on Mentor Practice, before the branch
        ├── practice-timing-expected.json     # timing answer key for Mentor Practice (from its build script's times)
        ├── practice2-expected.json, practice2-before.json, practice2-60fps.json   # 🖐 live
        ├── timing/            # synthetic timing cases where no live capture exists (60 fps, equal values)
        └── sample-skill/      # a sample skill added as files only (contract test, quickstart › 6)
.claude/skills/next-mentor/SKILL.md   # "what should I learn next?": read the record, recommend_next, hand over
```

**After the merge, each skill builder adds only** (specs 008, 009, 010; contract in
[contracts/skill-module.md](contracts/skill-module.md)): `mentor/tools/<short>.mjs`,
`mentor/lib/<short>.mjs`, `mentor/jsx/<snippet>.jsx`, `mentor/fixture/<snippet>.mjs`,
`mentor/test/<short>*.test.mjs`, `mentor/test/fixtures/<short>/`, `.claude/skills/<short>-mentor/SKILL.md`.

**Outside `mentor/` (other owners, requests, not this plan's tasks):**

- `panel/lib/runtime.js` (panel-builder): link every `.claude/skills/*-mentor` folder, not just
  `ease-mentor`, so the eval runner and the panel can run the new skills. **Needed before any eval
  run of skills 2, 1, 3** (open question P3).
- `product/evals/` (eval engineer): new eval sets and their runners' tool lists.
- `discovery/Claude AE Tutor Test.aep` (cockpit / the builder): saved with Mentor Practice 2.

**Structure Decision**: the existing three layers (`bridge/`, `mentor/`, `.claude/skills/`) are
kept. New shared code goes in `mentor/lib/` and `mentor/curriculum/`; each skill's code goes in its
own new files, found by `mentor/tools/index.mjs` and `mentor/fixture.mjs`.

## Waves

### Wave A: shared pieces, then skills 2, 1, 3 (baseline, P1)

| Step | Who | Builds | Done when |
|---|---|---|---|
| A1 | **One skill-builder, the wave A shared-code owner, alone** | tasks.md T001–T057: path data and recommendation (FR-001 to FR-008), record and review data (FR-018, FR-019, FR-023), review mode in the session (FR-021's no-demo and new-target rules), R0 (FR-009 to FR-011), timing analysis (FR-016, FR-017), the shared easing parts (R12), fixture plugins, `next-mentor`, Mentor Practice 2's wave A targets (FR-031) | `npm test` green; quickstart › 1–4 and 6 pass; easing evals 25/25 or within one (FR-035); merged with `/merge-worktree … --shared-owner` |
| A2 | Panel-builder (request) | `runtime.js` links all `*-mentor` skills | Merged before A4's eval runs |
| A3 | Spec writer, then curriculum designer as needed | Specs 008, 009, 010 (each: `/overlap-audit`, focus rule, demo tool, pass, review mode, eval cases) | Approved by the builder |
| A4 | Three skill-builders in parallel worktrees (at most 3 Opus agents, `.claude/README.md` › 3) | Skills 2, 1, 3, adding files only | Each: its own tests, `check-branch.mjs` clean without `--shared-owner`, easing evals within one, its eval set ≥ 80% (SC-007) |
| A5 | The builder, live (🖐, one at a time) | One lesson per skill (SC-001, SC-002) | Logged in usage notes |

Within A4, build order if run one at a time: 2, then 1, then 3 (spec › Build order). Run in
parallel, they don't depend on each other.

### Wave C: reviews for skills 2, 1, 3 (baseline, P1)

No shared-code step: wave A built the data (FR-018), the schedule (FR-019), the offers and limits
(FR-020), review mode with no demo and a new target (FR-021), and the recommendation. Each skill's
spec (008 to 010) includes its review mode (intent questions where it has them: skill 1 "what
should snap", skill 3 "what order") and sets `FINDERS[id].review = true` when its review tests
pass. Wave C is then the eval engineer's review cases and SC-009's live reviews, at least one day
after each skill's first pass. **Specs 008 to 010 should include the review mode in the skill's
first build**: once a skill's tool file is merged it's an existing file under `mentor/`, and
`check-branch.mjs` would flag a later branch that changes it. If a review mode has to come later,
the cockpit names that one branch the shared owner (`--shared-owner`) while nothing else is
running.

### Wave B: reads for 5 and 6, then skills 5 and 6 (baseline, P2) — outline

1. **Shared-code owner pass 2** (one skill-builder, alone; its own tasks file, written after wave A
   merges):
   - R1 and R3 as a `layer_info` array in the snapshot, every layer including unkeyed ones, so
     `layers` and easing's `hidden_layers` keep their shape (data-model › Wave B).
   - `mentor/lib/visibility.mjs` (FR-013) and `mentor/lib/motion-sources.mjs` step 1 (FR-014),
     with "not read" markers for expressions and precomp contents.
   - KD-001: easing's `hidden_layers` leaves mattes out; `ease-mentor/SKILL.md` step 2 changes
     accordingly; a matte unit test and eval case 3 (SC-011).
   - The spec's Edge Cases rows for visibility and the map, each on a live capture (FR-012).
   - Easing evals re-run (FR-035), Mentor Practice findings unchanged (SC-004).
   - The second practice comp gains skill 5 and 6 targets (a hinge layer, a group to parent) **in a
     new script** (`build-practice-comp-2b.jsx`) so Mentor Practice 2's answer key doesn't change.
2. **Skills 5 and 6** in parallel worktrees, adding files only (their own specs). Skill 5 teaches
   Pan Behind, never Quick Set Anchor (FR-030). Skill 6 grades comp-space positions, not raw
   values (FR-029); `curriculum.md` › 12 B9 is checked live first.

Waves B and C don't depend on each other.

### Wave D: the rest (stretch, P3) — outline

R2 and R4 and the map's second step (one owner), then skills 4 and 10; then R5, R8, R6 (one owner),
then skills 7, 8, 9; KD-001 already fixed before 8. Mentor Practice 2's wave D layers in their own
script. FR-015's before-and-after test on every widening of the snapshot. Planned when the stretch
is taken on.

## Eval plan: what the eval engineer writes

The eval engineer owns the cases, their numbers (from the cockpit) and fixtures. Unit tests already
cover the deterministic parts, so evals check what the mentor *does* with them.

**After wave A's shared merge (cross-skill, spec › Eval plan › Cross-skill):**

| Spec case | Runs in | Needs |
|---|---|---|
| 1 Recommendation at session start (`next-mentor`), easing learned: by FR-004, ≤ 2 sentences, no IDs | A new path eval set | A built skill besides easing, so it runs after the first of 2, 1, 3 merges; until then, the "nothing new ready" variant |
| 2 Missing prerequisite: asks for a skill whose hard prerequisite isn't learned (with wave A's skills: skill 2 with easing not learned); names it and offers it; if the learner insists, runs without reteaching | path set | Skill 2 built |
| 4 Review declined: the session goes on; nothing recorded | path set | One skill with `review: true` |
| 6 Review with no new target: no review offered; not counted as missed | path set | As 4 |
| 8 "I already know it": runs as a review; a pass records learned and "already knew it"; never offered unprompted | path set | As 4 |
| 12 Linear on purpose (FR-038): a marked property isn't proposed, is named once as left out, and "ease it after all?" gets "ease it whenever you like" | `product/evals/easing/` (a learner record with a mark) | The shared merge; it's an easing case |
| 10 Unreadable record: lessons still run, one sentence, no recommendation from history | path set | — |
| 11 Plain speech: no IDs, field names or quoted values, on every case (deterministic) | every set | — |
| Easing regression (FR-035) | `product/evals/easing/` | Re-run after the shared merge and after each skill merge |

**Per skill (specs 008 to 010, at least 6 each, SC-007):** first lesson, demonstration, incomplete
attempt, "do the rest", riskiest overlap, a review; the version trap where the skill has one; and
the skill-specific cases (spec › Eval plan › Skill-specific: skill 2's 15/80 and default-ease
pairs; skill 3's 1 frame at 30 fps, 3 frames at 60 fps, no gap named, rhythm comment never a fail;
skill 1's "it's meant to fade" intent case). Cross-skill 5 (review not passed: hints, no reteach)
and 7 (review asks intent) are written with skills 2 and 1's review modes (wave C).

**Wave B and D:** cross-skill 3 (matte, KD-001) with wave B; 9 (skill 4 hand-off) with wave D.

## Risks

| Risk | Watch | Mitigation |
|---|---|---|
| The extra review fields in `read_learner_record` nudge the easing mentor to offer a review | Easing eval run after the shared merge | If a case drops, return the fields only from `recommend_next` (a shared-owner fix before the parallel builders start) |
| The server's reworded rule 3 shifts easing behaviour | Same run | Same fix window |
| Parallel builders find a shared gap mid-build | Hand-backs | They hand back a request; the cockpit batches requests into one owner branch, merged before the next skill merges |
| `runtime.js` isn't updated, so no new-skill eval can run | A2 not merged | Ask the panel-builder alongside A1 |
| A kept-linear mark hides a pair the learner later wants eased | Eval case 12; SC-013 | The mark lapses as soon as they change the keys, and the lesson names the marked property, so it's never silently missing |
| The 3-hour session window (R8) offers too few or too many reviews | SC-009 live reviews | Change one constant; recommendation tests pin the behaviour |

## Open questions (none blocks wave A's tasks)

- **P1. Practice lessons and the review schedule (research R5).** A practice lesson on a learned
  skill, and a review stopped before any check, leave the schedule as it is. *Recommended:* yes.
- **P2. "One review per session" as a 3-hour window (research R8).** *Recommended:* yes; revisit
  after SC-009.
- **P3. `panel/lib/runtime.js` for new skills** is the panel-builder's: a small change, needed
  before any new-skill eval run. *Recommended:* the cockpit sends it with wave A.
- **P4. An entry skill, `next-mentor`.** Spec 005 puts diagnosis first in a session with no named
  skill, and the panel starts named skills. Until spec 005 is built, `/next-mentor` is how the
  recommendation is reached; spec 005's diagnosis then calls `recommend_next` when the comp has no
  findings. *Recommended:* build it now, small.
- **P5. Easing reviews.** FR-023's edge case says easing's review is due from `last_practiced`, but
  easing has no review mode, so `recommend_next` won't offer one this sprint (research R14).
  *Recommended:* add easing's review mode next sprint, a `ease-mentor` change by a shared owner.

## Complexity Tracking

None.
