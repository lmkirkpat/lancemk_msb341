---
description: "Task list for spec 004 wave B: the shared-code owner's second pass (reads R1 and R3, visibility, motion sources, KD-001)"
---

# Tasks: After Effects curriculum, wave B shared pieces

**Status**: Approved 2026-10-23, final for the build. The builder took every recommendation:
W1 to W7 (Phase 8; Q1, the sampled read R3, yes), Q2 (Mentor Overlaps is saved in the practice
`.aep`, T133), Q3 (skills 1 to 3 move to the visibility class in this pass, Phase 5), Q4 (the merge
gate in T143 and T123's sequencing) and Q5 (done by the cockpit: `ownership.json` gives the
skill-builder `specs/*/tasks-*.md`, ticks only). Specs 011 and 012 were approved the same day; their
shared-code requests are T160 to T163 (011 SR-1, 012 SR-1 and SR-3). Spec 012's SR-2 (a stored
parent chain, `parent_matrix`) was **declined** this sprint, so it has no task. **2026-10-24:** the
builder approved one more shared request, spec 011's SR-2 (the same as spec 012's SR-4): the comp's
size in the snapshot, T164 and T165.

**Input**: [plan.md](plan.md) › Waves › Wave B, [spec.md](spec.md) (FR-012 to FR-015, FR-013's
"never the eye switch alone", KD-001, SC-004, SC-006, SC-011), [research.md](research.md) R16 to
R23, [data-model.md](data-model.md) › Wave B shapes, [contracts/skill-module.md](contracts/skill-module.md).
Skill specs: [spec 011](../011-anchor/spec.md) › Dependencies › SR-1 and
[spec 012](../012-null-parenting/spec.md) › Dependencies › SR-1, SR-3; spec 011's
[plan](../011-anchor/plan.md) › Requests › SR-2 and spec 012's
[plan](../012-null-parenting/plan.md) › Requests › SR-4 (one request). Teaching designs are read
only: [curriculum.md](curriculum.md) › 5 and › 8, specs 011 and 012's `teaching-design.md`.

**Scope**: only wave B's **shared** pass (plan › Wave B, step 1). Skills 5 and 6 are specs 011 and
012, built after this merges, adding files only. Wave A's tasks are [tasks.md](tasks.md) (T001 to
T069); nothing here edits them. This file uses **T100 to T199** only.

**Tests**: included and written first. FR-012: every read and both shared rules have unit tests on
saved snapshots with an answer key, from live reads. Pure math (comp-space matrices) and
filter logic may also have synthetic cases, each marked synthetic in its file and test name; every
Edge Cases row still gets a live capture (Phase 6).

## Who builds this: one shared-code owner (FR-032)

**One skill-builder builds every task here, alone, in one worktree, as wave B's shared-code owner.**
No skill builder runs on `mentor/`, `bridge/` or `.claude/skills/*-mentor/` while this branch is
open. The cockpit merges it with `/merge-worktree <branch> skill-builder`, passing `--shared-owner`
to `check-branch.mjs` and **the integration branch as the base** (run 2's lesson: the default base
`main` listed files that weren't the branch's). After the merge, the skill 5 and 6 builders run in
parallel and add files only. A shared change none of this foresaw goes back to the cockpit as a
request.

**Rules carried from wave A** (`discovery/usage-notes/parallel-runs.md` › Run 2 › Verdict):

- **No shared test may enumerate the skills.** No new test asserts `SKILLS`, `FINDERS`, the tool
  list or the files in `mentor/tools/` equal a fixed list (that broke every add-only branch in run
  2). Tests here name the layers and fields they check, not the skills that exist.
- **No test pins the whole snapshot's key set.** Reads R2 and R4 widen the snapshot again in wave D;
  tests check the fields they're about (for example "`layers[i]` has exactly spec 002's fields"),
  never "the snapshot has exactly these top-level keys".
- **No existing test file is edited**, measured against this branch's merge base. If one truly
  can't pass, stop and hand back which and why.
- **Don't read or depend on uncommitted files in `product/evals/easing/`**: another session is
  working on the easing gate there (FR-035; research R23).

**Existing files this owner changes** (and no others). This is the table `check-branch.mjs`'s list
is compared against (T142):

| File | Change | Task |
|---|---|---|
| `mentor/jsx/snapshot.jsx` | Add `comp.time`, `comp.hide_shy` and `layer_info` (reads R1 and R3); `layers`, `precomp_layers`, `host` unchanged; sampled times and the extra R1 fields (Phase 8); `comp.width` and `comp.height` (011 SR-2, 012 SR-4) | T110, T151, T165 |
| `mentor/lib/snapshot.mjs` | `takeSnapshot({ sample_times } = {})` passes `sample_times` to the snippet; with none, the same call as today | T152 |
| `mentor/lib/session.mjs` | `setSkillData()` and the lesson's `skill_data` (spec 012 SR-1); nothing else | T162 |
| `mentor/dev/capture.mjs` | `--compare` also ignores `layer_info`, `comp.time`, `comp.hide_shy` (and `comp.width`, `comp.height`, T165); optional `--times` for `sample_times` | T111, T165 |
| `mentor/lib/analyze.mjs` | `hidden_layers` from the visibility class when known (KD-001); nothing else | T122 |
| `.claude/skills/ease-mentor/SKILL.md` | Step 2: one line, a matte is never called hidden (KD-001) | T123 |
| `mentor/lib/key-types.mjs` | Candidate, left-out and demo filters use the visibility class when known (spec 009 SR-3, FR-023) | T126 |
| `mentor/lib/speed-graph.mjs` | Candidate and left-out filters use the class when known; demo filter unchanged (spec 008 row 10) | T128 |
| `mentor/lib/offset.mjs` | Eligibility uses the class when known, mattes eligible (spec 010 FR-004, filter 2); demo filter as spec 010 says | T130 |
| `specs/004-ae-curriculum/tasks-wave-b.md` | Tick tasks only (`ownership.json` gives the skill-builder `specs/*/tasks-*.md`); no other edit | all |

Nothing under `bridge/` changes. `mentor/tools/*.mjs`, `mentor/lib/diff.mjs`,
`mentor/lib/timing.mjs`, `mentor/fixture.mjs` and every other skill's `SKILL.md` don't change. If a
task finds one must, stop and hand back.

**New files this owner adds:**

| File | Task |
|---|---|
| `mentor/lib/layer-info.mjs`, `mentor/lib/comp-space.mjs`, `mentor/lib/visibility.mjs`, `mentor/lib/motion-sources.mjs` | T112, T113 and T153, T117, T118 |
| `mentor/dev/build-overlaps-b.jsx`, `mentor/dev/build-practice-comp-2b.jsx` | T131, T132 (with T157, T160, T163) |
| `mentor/test/snapshot-layer-info.test.mjs`, `layer-info.test.mjs`, `comp-space.test.mjs`, `visibility.test.mjs`, `motion-sources.test.mjs`, `analyze-matte.test.mjs`, `analyze-r1-unchanged.test.mjs`, `key-types-visibility.test.mjs`, `speed-graph-visibility.test.mjs`, `offset-visibility.test.mjs`, `edge-rows-wave-b.test.mjs`, `snapshot-times.test.mjs`, `session-skill-data.test.mjs` (all under `mentor/test/`) | T104–T108, T119–T121, T124, T125, T127, T137, T152, T161 (T164 extends `snapshot-layer-info.test.mjs`) |
| `mentor/test/fixtures/layer-info/` (`README.md`, `synthetic/*.json`, and the live captures and answer keys from Phase 6) | T101, T109, T131–T136 |

**Files outside this owner's row** (requests the cockpit sends to others, not tasks here):
`product/evals/**` (eval engineer: the easing run, cross-skill case 3), `discovery/Claude AE Tutor
Test.aep` (saved by the builder at the keyboard in T133, T135), `discovery/usage-notes/**`
(user-researcher, if the builder wants the live findings logged there).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks). With one builder,
  [P] only means "order doesn't matter".
- **[Story]**: US4 (Knack sees parents, mattes; the shared reads), US5 (skills 5 and 6 can be built on
  them), US6 (evals and easing hold), from spec.md.
- **🖐 Live**: needs After Effects 26.5 on macOS 27.0.1 with `discovery/Claude AE Tutor Test.aep`
  open and the AE lock (`decisions/008`); the builder at the keyboard for anything that saves the
  `.aep`. **Wave A's own live tasks come first**: tasks.md T041, T064 (build Mentor Practice 2) and
  T042 (its captures) must be done before T135, because 2b adds layers to that comp.

---

## Phase 1: Setup

**Purpose**: freeze what exists, so every later task can prove it didn't change.

- [x] T100 On a worktree cut from the integration branch, run `cd mentor && npm test` and `node --test .claude/hooks/test/*.test.mjs`; note both pass counts and the merge-base commit in the hand-back (the base for "no existing test edited", T141)
- [x] T101 [P] Create `mentor/test/fixtures/layer-info/` with a `README.md`: what each capture is, which script built it, the comp time it was captured at, and which files are synthetic (only under `synthetic/`)
- [x] T102 [P] Read `mentor/test/fixtures/practice-findings-baseline.json` and `mentor/test/analyze-unchanged.test.mjs` (wave A's SC-004 proof) and confirm they're the "before" for this pass; no new baseline file is needed, because no fixture before this pass has `layer_info`
- [x] T103 [P] Note in the hand-back which built skills' libraries test the eye switch today (`enabled` or `is_null` reads in `mentor/lib/*.mjs`, outside `timing.mjs`), so T126 to T130's list is complete; any file not in this task list's table goes back to the cockpit as a request

---

## Phase 2: Foundational — reads R1 and R3 in the snapshot (blocking)

**Purpose**: `layer_info` and the comp-space math every later phase reads (research R16, R17,
data-model › Snapshot additions). Built here with read R3 at `comp.time` only (the outline); Phase 8's
T151 to T153 widen it to sampled times.

**⚠️ No later phase starts until this phase is green.**

### Tests first

- [x] T104 [P] [US4] Write `mentor/test/snapshot-layer-info.test.mjs`: run `mentor/jsx/snapshot.jsx` in `node:vm` against a **mock AE defined in this new file** (the pattern of `mentor/test/snippets.test.mjs`, which stays untouched). The mock comp has: a keyed text layer parented to a null; an unkeyed solid; an eye-off shape layer used as the solid's track matte; a guide layer; a shy layer; a locked layer; a precomp layer with stretch 50; a layer whose `sourceRectAtTime` throws. Assert: `layer_info` has one entry per layer in index order, unkeyed ones included; `layers` holds only the keyed layers and each entry has exactly spec 002's fields (`index`, `name`, `kind`, `enabled`, `is_null`, `properties`); `precomp_layers` and `host` as before; `comp.time` and `comp.hide_shy` read; every data-model field present with the mock's value; a throwing read gives `null` for that field and the snapshot still returns; position assembled from X and Y when separated; the mock's `source.name`, `file` and `fsName` getters are **never called** (instrumented, FR-011)
- [x] T105 [P] [US4] Write `mentor/test/layer-info.test.mjs` for `mentor/lib/layer-info.mjs` on synthetic snapshots in `mentor/test/fixtures/layer-info/synthetic/`: `layerInfo()` with and without `layer_info`; `byIndex()`; `byName()` returns every layer with a duplicated name; nothing in the returned entries that isn't in the snapshot
- [x] T106 [P] [US4] Write `mentor/test/comp-space.test.mjs` (synthetic cases, marked so): `layerMatrix` for identity, translate, anchor offset, rotate 90°, non-uniform scale (200, 50), negative scale; `compPosition` of an unparented layer equals its position; a two-level chain; `footprint` corners and bounds for an unrotated rect and a 45° rotated one; `toLayerSpace` round-trips: the raw matrices (`compMatrix` then `invert`) within 1e-6, and the exported functions, which round to 0.001 px, within 0.002 (reworded 2026-10-24, review N2); a scale of 0 gives `singular`; `parent_transform` replaces only the direct parent; each `reason` (`no_layer_info`, `no_layer`, `not_sampled`, `three_d`, `auto_orient`, `no_rect`, `singular`); deterministic. The live answer-key checks are added in T136

### Implementation

- [x] T110 [US4] Update `mentor/jsx/snapshot.jsx` (research R16, data-model › Snapshot additions): add `comp.time`, `comp.hide_shy`, and `layer_info` with every field in the data-model table except Phase 8's (`three_d`, `collapse`, `auto_orient`, `effect_count`, `rect_extents`, and samples at times other than `comp.time`). `transform` and a single `samples` entry at `comp.time` with `rect`. Each read in its own try/catch → `null`. The existing loop that builds `layers` and `precomp_layers` is unchanged line for line (the new code is a second loop). ES3 only. T104's non-Phase-8 assertions pass; `snippets.test.mjs` and `jsx-lib.test.mjs` pass unchanged
- [x] T111 [P] [US4] Update `mentor/dev/capture.mjs`: `--compare` strips `layer_info`, `comp.time` and `comp.hide_shy` as well as `taken_at` and `host`, and prints "layer_info differs" as a note (not a failure) when only that differs; add `--times 0.5,1.2` to pass `sample_times` (used once T152 lands)
- [x] T112 [P] [US4] Create `mentor/lib/layer-info.mjs` (`layerInfo`, `byIndex`, `byName`). T105 passes
- [x] T113 [US4] Create `mentor/lib/comp-space.mjs` (`layerMatrix`, `compMatrix`, `compPoint`, `compPosition`, `footprint`, `toLayerSpace`; pure, 2D, no tolerances). T106 passes

**Checkpoint**: `npm test` green (T100's count plus the new tests); no existing test edited.

---

## Phase 3: User Story 4 — the visibility class and the motion-sources map, step 1 (P2, baseline)

**Goal**: FR-013's one classification and FR-014's first step, each from `layer_info`, each falling
back to today's behaviour without it (research R18, R19).

**Independent test**: on every live capture from Phase 6, each layer's class and map entry match the
answer key (SC-006); on every fixture without `layer_info`, the fallback matches today's eye-switch
behaviour.

### Tests first

- [x] T107 [P] [US4] Write `mentor/test/visibility.test.mjs` (synthetic first, live in T136): each row of data-model › Visibility class's order, including the ties (a null with its eye off is `null`; a matte with its eye off is `matte`; a guide with its eye off is `hidden`; a shy guide is `guide`); solo on one layer gives `soloed_elsewhere: true` on every other layer and changes no class; shy with the comp's filter on and off (`timeline_hidden`); without `layer_info`, `known: false`, one entry per keyed layer, classed `null`, `hidden` or `renders` only
- [x] T108 [P] [US4] Write `mentor/test/motion-sources.test.mjs` (synthetic first, live in T136): a child of a null lists the null in `parents` with its class; a chain of two is nearest first; `children`; `moves_children` false for a parent keyed only on Opacity; a keyed property with an expression on is in `own_keys` with `expression_on: true` and in `expressions.on_keyed`; `expressions.status` is `"not_read"` on **every** layer, including layers with no keyed expression (FR-014: never "none"); `precomp_contents` `"not_read"` on a precomp layer, `"not_a_precomp"` elsewhere; a layer with no keys and no parent is `static_as_read: true`; `sourcesOf()` with a name not in the comp returns `null`; without `layer_info`, `parents: null` and `read.parents: "not_read"`
- [x] T109 [P] [US4] Write the synthetic fixtures T105 to T108 use in `mentor/test/fixtures/layer-info/synthetic/` (each a copy of an existing synthetic snapshot plus a hand-written `layer_info`, with a `comment` field saying it's synthetic and which live capture replaces it in T136)

### Implementation

- [x] T117 [P] [US4] Create `mentor/lib/visibility.mjs` (`visibility`, `classOf`). T107 passes
- [x] T118 [P] [US4] Create `mentor/lib/motion-sources.mjs` (`motionSources`, `sourcesOf`), using `layer-info.mjs` and `visibility.mjs`. T108 passes

**Checkpoint**: both shared rules unit tested; nothing that existed reads them yet.

---

## Phase 4: User Story 4 — KD-001 in easing (SC-011, SC-004, FR-015)

**Goal**: a moving matte with its eye off is in easing's findings and isn't left out as hidden;
easing is otherwise unchanged (research R20).

**Independent test**: SC-011 on the matte capture; SC-004 on Mentor Practice with and without
`layer_info`.

### Tests first

- [x] T119 [P] [US4] Write `mentor/test/analyze-matte.test.mjs` on a synthetic matte snapshot (T109) and, after T133, on `mentor/test/fixtures/layer-info/overlaps.json`: the matte (Wipe, eye off, linear Position keys) has its pairs in `findings` and `targets` **every time** and isn't in `hidden_layers`; a layer hidden by the learner in the same snapshot is still in `hidden_layers`; `demo_target` is never on the matte (eye off); the same snapshot with `layer_info` removed gives today's result (the matte in `hidden_layers`)
- [x] T120 [P] [US4] Write `mentor/test/analyze-r1-unchanged.test.mjs` (SC-004; FR-015's before-and-after, applied to this widening): on `mentor/test/fixtures/layer-info/practice-r1.json` (T133, Mentor Practice captured with reads R1 and R3), `analyze()` with and without `focus_layers: ["Title"]` deep-equals `analyze()` on the same capture with `layer_info`, `comp.time` and `comp.hide_shy` removed; the same on `practice2b.json` (T135); and on `overlaps.json`, Drift (an expression on **unkeyed** Position) is in no `findings`, `targets` or `skipped` entry (FR-015's second clause; US4 scenario 4). Wave A's `analyze-unchanged.test.mjs` keeps passing unchanged **Done 2026-10-26: the live cases (practice-r1, practice2b, overlaps' Drift) run and pass now the captures exist; no test change needed.**
- [x] T121 [P] [US4] Add to `mentor/test/analyze-matte.test.mjs`: `snapshot_project` in fixture mode on the matte capture returns `hidden_layers` without the matte and every other field with today's shape (no new field)

### Implementation

- [x] T122 [US4] Update `mentor/lib/analyze.mjs`: `hidden_layers` is the keyed layers whose `classOf()` is `hidden` when `layerInfo(snapshot).known`, else today's eye-off list. Change nothing else (the demo picker keeps `enabled && !is_null`). T119 to T121 pass; wave A's T004 test and every existing analyze, diff and eval-fixture test pass unchanged
- [ ] T123 [US4] Update `.claude/skills/ease-mentor/SKILL.md` step 2's "Say what you're leaving out and why" bullet with one sentence: only layers in `hidden_layers` are called hidden; a track matte is never in it, even with its eye off, because its motion is what shows through the layer it mattes, so its pairs are ordinary candidates. Change nothing else. **Do this task last, after the other session's `SKILL.md` work has landed** (Q4): (1) the cockpit's go-ahead names the integration-branch commit that holds the easing-gate session's `SKILL.md` edit; (2) `git log --oneline <T100's merge base>..<integration branch> -- .claude/skills/ease-mentor/SKILL.md` shows that commit; (3) in the main checkout and in every worktree `git worktree list` shows, `git -C <path> status --porcelain -- .claude/skills/ease-mentor/SKILL.md` prints nothing. Then bring the integration branch into this branch (rebase or merge, never `reset --hard`) and make the edit on top of it. If any of (1) to (3) fails, leave T123 unticked, finish everything else, and hand back saying which check failed; T143 waits for T123

**Checkpoint**: SC-011's unit test passes; easing's output on Mentor Practice is identical (SC-004).

---

## Phase 5: User Story 4 — skills 1, 2 and 3 read the visibility class (FR-013)

**Goal**: no built skill filters layers by the eye switch alone once `layer_info` is known (research
R21). Each switch is what that skill's spec already says. Without `layer_info` each skill behaves
exactly as it does today, so its existing tests and eval fixtures don't change.

**Independent test**: each skill's new visibility test on the matte capture; every existing test of
that skill passes unchanged.

- [x] T124 [P] [US4] Write `mentor/test/key-types-visibility.test.mjs` (spec 009 SR-3, FR-023, overlap row 13) on the synthetic matte and, after T133, `overlaps.json` (its matte gets an Opacity blink in T131 for this): a matte's non-held 0 to 100 Opacity pair is a candidate; it can be the demo target (SR-3: "candidate and demo filter"); it isn't in `left_out`'s hidden list; a layer hidden by the learner still is; with `layer_info` removed, today's result
- [x] T125 [P] [US4] Write `mentor/test/speed-graph-visibility.test.mjs` (spec 008 row 10, teaching design's Matte row): a matte's eased Position pair is a candidate and in the focus when proposed; never the demo target while its eye is off; not in `left_out`'s hidden list; without `layer_info`, today's result
- [x] T127 [P] [US4] Write `mentor/test/offset-visibility.test.mjs` (spec 010 FR-004 filter 2, teaching design's Matte row: "after R1, the visibility class includes mattes by default"): a matte with a start is eligible and joins a layers group; a hidden layer is still left out "unless you want it"; the demo rule is whatever spec 010 FR-009/FR-010 say (if spec 010 doesn't say whether an eye-off matte can be the demo, keep the eye-on demo filter and say so in the hand-back); without `layer_info`, today's result
- [x] T126 [US4] Update `mentor/lib/key-types.mjs`: every eye-switch test (`visible`, the hidden list in `leftOut`, the `!layer.enabled` skip) uses `classOf()` when known (`hidden` is left out; `matte` is in; `null` stays out), else today's test. T124 and every existing key-types test pass unchanged
- [x] T128 [US4] Update `mentor/lib/speed-graph.mjs`: the `eligible` filter and the hidden `leftOut` use the class when known; the demo `visible` filter stays on the eye switch. T125 and every existing speed-graph test pass unchanged
- [x] T129 [P] [US4] Confirm (read only) that `key-types-mentor`, `speed-graph-mentor` and `offset-mentor` `SKILL.md`s say "hidden" only about what their tools list as hidden, so they need no edit. If one would call a matte hidden, hand back the line; don't edit it here
- [x] T130 [US4] Update `mentor/lib/offset.mjs`: `layerPool`'s `why = "hidden"` uses the class when known (`matte` eligible); the demo pick per T127. T127 and every existing offset test pass unchanged

**Checkpoint**: `grep -n "enabled" mentor/lib/{key-types,speed-graph,offset}.mjs` shows each remaining
eye test either behind the `known: false` fallback or a demo filter its spec keeps.

---

## Phase 6: 🖐 Live captures: the planted-overlaps comp and Mentor Practice 2's wave B layers (FR-012, FR-031, SC-006)

**Purpose**: every wave B Edge Cases row on a live capture with an answer key, and the targets skills
5 and 6 need (research R22). The scripts (T131, T132) are written without AE; the runs are one
sitting, after wave A's tasks.md T041, T064 and T042.

- [x] T131 [US4] Write `mentor/dev/build-overlaps-b.jsx` (ES3, dev chore, run through the upstream bridge's `ae_run_script` as spec 002 T014; refuses if "Mentor Overlaps" exists unless `{"replace": true}`; never touches "Mentor Practice", "Mentor Practice 2" or "Icon Precomp"). It builds **"Mentor Overlaps"** (1920×1080, 30 fps, 6 s; CTI set to 1 s; shy filter on) and writes its answer key to `ARGS.out` (`mentor/test/fixtures/layer-info/overlaps-expected.json`), declared next to each layer as it's built, never derived by running the mentor's code. One layer per row, named in the key with its Edge Cases row:
  - **Photo** (solid 800×450) matted by **Wipe** (a solid 800×450, alpha matte, eye off as AE sets it; Position keys linear 0.6 → 1.6 s, so it's a moving matte, KD-001; plus an Opacity blink 100 → 0 → 100 eased at 3 to 4 s for T124)
  - **Rig** (null, eye off, Position keys 1 → 2 s) parenting **Leaf 1** (solid, own Scale keys) and **Leaf 2** (solid, **separated** X and Y Position keys): hidden null with children; separated child
  - **Shy Parent** (solid, shy, Rotation keys) parenting **Kid** (solid, no keys): shy parent
  - **Guide Grid** (solid, guide layer, no keys): guide
  - **Pivot** (null, Rotation 90, Scale [200, 50], no keys) parenting **Arm** (solid 200×40, own Position keys at 0, 1, 2 s): the comp-space answer key
  - **Drift** (solid, an expression on unkeyed Position, `[960 + time * 50, 300]`): expression with no keys (FR-015)
  - **Gauge Dial** (solid, Rotation keyed 0 → 90 with an expression on, `value`): expression on a keyed property
  - **Still** (solid, no keys, no parent, no expression): static
  - **Icon Stretch** (a layer of Icon Precomp, stretch 50%) and **Icon Remap** (Icon Precomp, time remap on; the key notes the two Time Remap keys easing will see): precomp rows (in and out points, stretch and time remap read; contents not read)
  - **Locked Bar** (solid, locked, Position keys eased 15/80): locked
  - **Depth** (solid, 3D, no keys): 3D (`three_d`, comp-space `null`)
  - **Orbit** (solid, Auto-Orient along path, Position keys on a curve): auto-orient (T158)
  **AE's own answer for the math:** before finishing, the script adds a temporary layer **Probe** with one Point Control per chosen layer (Arm, Leaf 1, Leaf 2, Kid, Wipe) whose expression is `thisComp.layer("<name>").toComp(thisComp.layer("<name>").anchorPoint)`, reads each one with `valueAtTime(t, false)` at 0, 1 and 2 s and at each of that layer's key times, writes them to the key as `to_comp`, then deletes Probe. It also writes each layer's own rectangle at 1 s (`sourceRectAtTime`) as `rect`. No layer's name or key time is shared with Mentor Practice 2's script
- [x] T132 [US5] Write `mentor/dev/build-practice-comp-2b.jsx`: adds wave B's targets to **"Mentor Practice 2"** (refuses if that comp is missing, or if any 2b layer exists unless `{"replace": true}`; never changes MP2's existing layers, "Mentor Practice", "Mentor Overlaps" or "Icon Precomp"), with its own answer key at `ARGS.out` (`mentor/test/fixtures/layer-info/practice2b-expected.json`): per new layer, its `layer_info` expectations, AE's `to_comp` from a temporary Probe (as T131), its easing pair states, and its timing measures, so skills 1 to 3's answer keys can add the new layers. **Targets:** Phase 8's T157 as amended by T160 (skill 5) and T163 (skill 6). **Rules for every 2b layer**, so it doesn't become another skill's target by accident (the same care as tasks.md T064): no first key at 0.5 s or 2 s and no start within 2 frames of another layer's start (skill 3); keys bezier at a non-default influence (15/80), never linear and never Easy Ease defaults, unless the target says otherwise (easing, skill 2); no Opacity going between 0 and 100 (20 → 100) (skill 1); names not used in Mentor Practice 2 (Blink, Spinner, Cut, Card, Dot 1 to 3, Chip A to C, Badge, Flag, Pause) or Mentor Overlaps
- [x] T133 🖐 [US4] (After T165, so the captures carry `comp.width` and `comp.height`.) With Mentor Practice active (as it is now, not as built), capture `mentor/test/fixtures/layer-info/practice-r1.json` with `node mentor/dev/capture.mjs`. Run `build-overlaps-b` (`node mentor/dev/assemble.mjs build-overlaps-b '{"out": "<abs path>/mentor/test/fixtures/layer-info/overlaps-expected.json"}'`, then `ae_run_script`); capture `overlaps.json` at CTI 1 s; turn Solo on for **Still** by hand, capture `overlaps-solo.json`, turn Solo off. Record in the hand-back: which track-matte scripting names worked (curriculum B8), whether AE turned the matte's eye off itself, and how long each snapshot took (the 2 s goal, plan › Technical Context). Save the `.aep` **Done 2026-10-26 (live): setTrackMatte(layer, TrackMatteType.ALPHA) worked; AE turned the matte's eye off itself; snapshots 0.15-0.18 s. build-overlaps-b.jsx fixed (held effect property invalidated by the next addProperty).**
- [x] T134 🖐 [US4] Run `node mentor/dev/capture.mjs --compare mentor/test/fixtures/practice-before.json` with Mentor Practice active: the differences are the same layers T042 listed (wave A), and `layer_info` and `comp.time` aren't among them (T111). Check no capture holds a user name, folder path or source file name **Done 2026-10-26 (live): same 8 layers as T042; layer_info and comp.time not listed; no names, paths or source file names.**
- [x] T135 🖐 [US5] After wave A's T042 is done: run `build-practice-comp-2b` on Mentor Practice 2; capture `practice2b.json` (CTI at 0 s). Then, **by hand**, the two moves skills 5 and 6 grade, each captured and then undone with Edit > Undo: (a) add a null, parent Tile, Caption and Stamp to it with the pick whip in the Parent column, capture `practice2b-parented.json`; (b) move Door's anchor to the middle of its left edge with Pan Behind (Y), capture `practice2b-anchor.json`. Record in the hand-back whether parenting changed the children's raw Position key values (curriculum B9, spec 012 L-2). Pan Behind on a Position-keyed layer (curriculum B5) is spec 011's L-2 on Sled, not this task. Save the `.aep` **Done 2026-10-26 (live): parenting DID change the children's raw Position values, keys included (each shifted by minus the null's position, -960,-540); the new null went to index 1 and renumbered every layer below. Door: anchor 150,250 -> 0,250, position 200,300 -> 50,300, footprint unchanged. Both undone exactly.**
- [x] T136 [US4] Add the live answer-key checks to the Phase 2 to 5 tests, from T133 and T135's captures and keys: `layer-info.test.mjs` (every layer present, fields as declared), `comp-space.test.mjs` (`compPosition` within **0.5 px** of AE's `to_comp` at every probed time; on `practice2b-parented.json`, each child's footprint at each sampled time equals `practice2b.json`'s within 1 px, which is what skill 6's P2 will measure; on `practice2b-anchor.json`, the hinge layer's footprint is unchanged within 1 px, skill 5's measure), `visibility.test.mjs` and `motion-sources.test.mjs` (every layer's class and entry as declared; on `practice-r1.json`, Title's map lists its own keys and CTRL, US4 scenario 2), `analyze-matte.test.mjs`, `analyze-r1-unchanged.test.mjs`, and T124, T125, T127's skill tests. Tolerances are test inputs, not constants in shared code **Done 2026-10-26: live checks added to layer-info, comp-space (to_comp within 0.5 px at every sampled probe; parented and Pan Behind footprints within 1 px; bounds_at_0 and set unions), visibility, motion-sources, speed-graph-visibility and offset-visibility; analyze-matte, analyze-r1-unchanged and key-types-visibility already ran live. One finding left as a todo: `practice2b-expected.json` declares collapse false on Lid, Banner, Sign, Tile and Caption (shape and text), and AE reads true.**
- [x] T137 [US4] Write `mentor/test/edge-rows-wave-b.test.mjs`: one test **named after each row** of spec.md › Edge Cases that wave B covers, each asserting on a live capture (track matte eye off; hidden null with children; shy parent; guide layer; solo on another layer; expression on a keyed property; precomp layer: in and out points, stretch and time remap read, contents `"not_read"`; layer with no keys, no parent, no expression; a layer outside the active comp: `sourcesOf()` is `null`), plus `test.todo` for the rows that wait for reads R2 and R4 in wave D (expression with no keys as a listed source; expression turned off; precomp contents as a source), naming wave D. FR-012's checklist in one file **Done 2026-10-26: every row runs on the live captures (none skipped); three wave D todos.**

**Checkpoint**: SC-006 for wave B's reads: 100% of layers match the key on at least 6 captures
(`practice-r1`, `overlaps`, `overlaps-solo`, `practice2b`, `practice2b-parented`,
`practice2b-anchor`).

---

## Phase 7: User Story 6 — easing still holds, and the hand-over (P1)

- [x] T141 [US6] Run `cd mentor && npm test` and `node --test .claude/hooks/test/*.test.mjs`: all green; `git diff --stat <T100's merge base> -- mentor/test/*.test.mjs` shows only new files; `grep -rnE "SKILLS|FINDERS" mentor/test/<this branch's new tests>` finds no assertion that lists the skills (rule above)
- [x] T142 [US6] Run `node .claude/hooks/check-branch.mjs <this branch> skill-builder <integration branch> --shared-owner`: every changed file is the skill-builder's, and the changed existing files match this file's table exactly. Paste the output in the hand-back
- [ ] T143 [US6] Hand off to the cockpit for the **eval engineer** (their run, their files; research R23): the easing set (`node product/evals/easing/run.mjs`) on this branch, after T123, **and** on its merge base the same day. **Merge gate (Q4):** the branch is no worse than the merge base: it passes at least as many cases, and no hard-rule check fails on the branch that passes on the base. A case that fails only on the branch is run once more before it counts (noise). FR-035 itself closes with the other session's easing work. If a case drops because of T123's line, fix it on this branch before merge
- [ ] T144 [US6] Hand off to the **eval engineer**: cross-skill eval case 3 (spec › Eval plan, matte, KD-001; SC-011) using `overlaps.json` (a live capture; Wipe is the moving matte). The case and its number are theirs and the cockpit's
- [x] T145 [US6] Write the hand-back: branch and commit; the changed-files table with any difference from this file's; test counts; T133's matte names, eye behaviour and snapshot timings; T158's auto-orient answer; T135's B9 observation; the captures specs 011 and 012 can reuse; and the later per-skill branches below, as requests

---

## Phase 8: Skill specs' shared-code requests (T150 onward)

**From the teaching designs and specs for skills 5 and 6** (2026-10-23). W1 to W7 came from the
teaching designs; T160 to T163 from specs 011 and 012. All approved; each task runs with the phase
it extends (each says which).

- [x] T150 Cockpit and builder approve or decline each request below (W1 to W7): all approved 2026-10-23

| Req | From | Ask | Decision (2026-10-23) |
|---|---|---|---|
| W1 | 012 B-3, 011 B-2 | **Sampled read R3**: rendered anchor, position, scale, rotation and the layer's rectangle at a list of times (a child's key times, a stored time, and the same for its parent), with the 2D corner math in the server. Skill 5 asked for bounds at a given time too, so **one read serves both** | **Yes**, approved (Q1; research R17). It's the only way to measure skill 6's P2 and skill 5's rest key without asking the learner to move the playhead, and it stays read only |
| W2 | 011 B-2 | The layer's **own rectangle** (left, top, width, height in its own space), the comp's **current time**, **rendered values** after expressions | **Yes**, already in Phase 2 (T110: `rect`, `comp.time`, `valueAtTime(t, false)`) |
| W3 | 011 B-2 | Which bounds: letters for text, the stroke for shapes | **Read both** on shape and text layers (`rect`, `rect_extents`); spec 011's L-1 and L-5 decide which the skill uses |
| W4 | 012 B-5, 011 B-3 | R1 also carries **is-null**, **is-3D**, **layer kind**, **Collapse Transformations**; an effect count is optional | **Yes**: `is_null` and `kind` are already in T110 (the visibility class needs them); add `three_d`, `collapse`, `effect_count` (one property read each) |
| W5 | 012 B-6 | Does the rotation read include **auto-orient**? Unknown | **Read `auto_orient`** in R1, have the comp-space math return `null` (`auto_orient`) for such a chain, and **check it live** (T158). If the live check shows the rotation does include it, drop that `null` case in a later owner branch |
| W6 | 012 S-3 | Measure "through the null as stored at parenting" | **Yes, as an option of the shared math** (`parent_transform`, the direct parent only), not a read and not in skill 6's file: it's the same matrix code (FR-032). Spec 012's SR-2 (`parent_matrix`, a whole stored chain) was declined: a lesson null whose parent moves is refused by the skill instead (spec 012 FR-009) |
| W7 | 011, 012 B-1 | Mentor Practice 2's wave B targets | **Yes**, T157, amended by T160 and T163 |

Tasks (each test first, then code):

- [x] T151 [US5] Extend T104's mock test, then `mentor/jsx/snapshot.jsx` (with T110): `three_d`, `collapse`, `auto_orient`, `effect_count`, and `rect_extents` on shape and text layers; sample times per data-model (`comp.time`, the layer's own key times, its children's sample times recursively, `sample_times` from the args), deduplicated, sorted, capped at 64 with `samples_truncated`. Mock cases: a parent with no keys of its own is sampled at its child's key times; a grandparent at its grandchild's; `sample_times: [2.5]` appears on every layer; 70 key times truncate at 64
- [x] T152 [US5] `mentor/lib/snapshot.mjs`: `takeSnapshot({ sample_times } = {})` → `runSnippet("snapshot", sample_times ? { sample_times } : {})`. Test in a new `mentor/test/snapshot-times.test.mjs` (fixture mode: `sample_times` is ignored and a missing time gives `not_sampled` from `compMatrix`). Every existing call (`takeSnapshot()`) is unchanged
- [x] T153 [US5] Add T106's cases for `parent_transform` and multi-time samples, then extend `mentor/lib/comp-space.mjs` (with T113): `compMatrix` at any sampled time; `parent_transform` replaces only the direct parent; `{ extents: true }` in `footprint`
- [x] T157 [US5] **Targets for `build-practice-comp-2b.jsx` (T132)** from 011 › 14 B-1 and 012 › 13 B-1, with names that clash with neither Mentor Practice 2 nor Mentor Overlaps. The set, confirmed by specs 011 and 012 with T160's details and additions and T163's layout:
  - **Skill 5:** **Door** (solid ~300×500, no keys; hinge left edge); **Needle** (solid ~30×400, no keys; hinge bottom middle); **Banner** (an 800×60 shape, no keys; left-middle vs corners); **Sign** (a centred text layer, no keys; the baseline case); **Lid** (a shape whose pivot sits outside it); **Gauge** (Rotation 0 → 90; rest pose); **Pop** (Scale 0 → 100; the shrunk case); **Sled** (Position keyed; B5); **Hatch** (parented to a null **Hatch Rig**); review targets **Tab**, **Peg** (no keys)
  - **Skill 6:** a group of three unparented layers that sit together: **Tile** (shape, own Position keys), **Caption** (text, an Opacity fade **20 → 100**, so it isn't a skill 1 candidate; 012 asked for "Label" with a fade, renamed so Mentor Practice 2's Badge and Card don't clash), **Stamp** (separated Position keys); a review group **Row A**, **Row B**, **Row C**; one layer parented to a visible layer (**Shadow** follows **Plate**, the mistake row); a matte pair (**Gradient** matted by **Reveal Matte**)
  - Every layer follows T132's rules; starts at 3.0 s and later, at least 4 frames apart
- [x] T158 🖐 [US4] Auto-orient (012 B-6), in T133's sitting: on Mentor Overlaps' **Orbit**, compare the snapshot's `rotation` sample at three times with AE's own rotation shown in the comp (the Probe's `toComp` of a point one rectangle-width along the layer's x axis gives its on-screen angle). Record whether the read includes auto-orient. The comp-space `auto_orient` null stays until a later owner branch acts on the answer **Done 2026-10-26 (live): the read does NOT include auto-orient (rotation 0 at 0.5, 1, 1.5 s; AE on screen -33.69, 33.69, 33.69).**
**Specs 011 and 012's requests (approved 2026-10-23):**

- [x] T160 [US5] **Spec 011 SR-1, skill 5's targets in 2b** (amends T157 and T132's answer key; with T132): Sign is a **centred** text layer; Gauge's Rotation keys go 0 → 90 (rest key at 0); Pop's Scale goes 0 → 100; Sled has **three** Position keys; Lid's pivot sits outside its shape. **Add four layers**, none keyed except Wobble: **Plaque** (a solid at Scale 200%: the own-space measure, spec 011 row 17), **Flip** (a solid at Scale [-100, 100]: own sides, row 18), **Wobble** (a solid with Anchor Point keys: never a candidate, row 4), **Seal** (a layer of Icon Precomp with Collapse Transformations on, row 10). All follow T132's rules. The answer key gains, **per skill 5 layer**, its anchor's place as built (which of the nine places of its own rectangle, or `null` for none) and its rest key time (`null` when it has no Rotation or Scale keys), declared as each layer is built, so spec 011's tests read them
- [x] T161 [P] [US5] **Spec 012 SR-1, tests first**: write `mentor/test/session-skill-data.test.mjs` (new; the existing session tests stay untouched), with a stub analyzer: `setSkillData(skill, compId, data)` on the current unpassed lesson stores `data` as the lesson's `skill_data`; `currentLesson()` returns it; a continued lesson and a lesson resumed after another comp keep it; a second call replaces it whole; it is separate from `skill_options` (setting one never changes the other, and the analyzer is never given `skill_data`); calling it for a skill or comp with no unpassed lesson throws `NO_LESSON` and `session.json` is byte-identical; a value that isn't plain JSON data throws before any write; a new lesson (after a pass, a change of `mode`, or `fresh: true`) starts with none; the session never reads inside it; easing's behaviour is unchanged
- [x] T162 [US5] **Spec 012 SR-1, code**: in `mentor/lib/session.mjs`, add `setSkillData(skill, compId, data)` and the lesson field `skill_data` per contracts/skill-module.md › 4 and data-model › Session lesson. Nothing else in the file changes. T161 and every existing session test pass unchanged
- [x] T163 [US5] **Spec 012 SR-3, skill 6's layout in 2b** (amends T157 and T132; with T132): keep T157's skill 6 names; at 0 s Tile, Caption and Stamp's bounds overlap one another, and Row A, Row B and Row C's overlap one another; each of the four sets (the group, the Row group, Plate with Shadow, Gradient with Reveal Matte) is more than **10% of the comp's width** from every other set and from the skill 5 layers; **Row B has no keys** (a static group member); **Tile has Position and Scale keys**. The answer key declares the four sets and each layer's bounds at 0 s, so spec 012's L-6 (its 2% "nearly touch" rule) is checked against it

**Spec 011 SR-2 = spec 012 SR-4 (approved 2026-10-24), the comp's size.** Wanted **before the live
captures (T133)**, so every wave B capture carries it; neither task needs AE.

- [x] T164 [P] [US5] **Tests first**: extend `mentor/test/snapshot-layer-info.test.mjs` (T104's mock AE): give the mock comp a `width` and `height` (for example 1920 × 1080) and assert the snapshot's `comp` carries `width: 1920` and `height: 1080` (whole pixels, as AE gives them), next to `time` and `hide_shy`; `layers`, `precomp_layers`, `host` and `layer_info` are byte-identical to the same mock's result without the new fields. Fails until T165
- [x] T165 [US5] **Code**: in `mentor/jsx/snapshot.jsx`, add `width: comp.width, height: comp.height` to the snapshot's `comp` object (ES3; nothing else in the file changes); in `mentor/dev/capture.mjs`, `--compare` also strips `comp.width` and `comp.height`, so T134's compare against a pre-wave-B fixture still lists only wave A's layers. Older captures stay as they are (the fields are absent there, and readers treat absent as unknown, never a default; data-model › Snapshot additions). T164 and every existing test pass

---

## Later per-skill branches (not this pass; requests for the cockpit)

What specs 008 to 010 say happens "when R1 lands", beyond the visibility switch above. Each is a
teaching change (its spec, `SKILL.md`, eval cases), so each is a later branch that changes that
skill's merged files: **one at a time, named shared owner (`--shared-owner`) while no other branch
touches `mentor/`**, after skills 5 and 6 merge. Its spec update comes first (the spec writer, then
the curriculum designer where the teaching changes).

| Skill | Change | From |
|---|---|---|
| 2, speed graph | Name a parent in one sentence; choose frames where no parent moves, so frame claims can say how far along a move a layer is | spec 008 rows 15, teaching design D-5, § 5 |
| 3, offset | Name a parent's shared motion in one sentence, never grade it (the known blind spot); precomp layers eligible through in points, stretch and time remap; a locked layer as demo target refused before AE (L-4); a trimmed in point named | spec 010 rows 12, 15, 16, 21; teaching design § 9 |
| 1, key types | None beyond SR-3 (done here, T126) | spec 009 |
| Diagnosis (spec 005) | Uses `visibility.mjs` and `motion-sources.mjs` from its first build (its Edge Cases "Track mattes" row) | spec 004 KD-001 |

---

## Dependencies & execution order

- **Phase 1** → **Phase 2** (blocking) → Phases 3 → 4 and 5 (4 and 5 need Phase 3's
  `visibility.mjs`) → Phase 6's scripts (T131, T132) → the 🖐 sitting (T133, T134, T158, then T135)
  → T136, T137 → **Phase 7**.
- Phase 8: T151 with T110; T152 after T110; T153 with T113; T157, T160 and T163 before T132's
  targets are written; T158 in T133's sitting; T161 then T162 any time after Phase 1 (no AE);
  T164 then T165 any time after T151, **before T133** (no AE).
- **T123 last** before T143, once its three checks pass (Q4); T143 runs after T123.
- 🖐 order in one Mac sitting: wave A's tasks.md T041 and T064 (build Mentor Practice 2), T042 (its
  captures), then T133, T134, T158, then T135. The cockpit stays off AE.
- Tests are written before their code in every phase; live checks extend them in T136.

## Parallel opportunities

With one builder, [P] only means order doesn't matter: T104 to T109 are independent new files;
T117 and T118; T124, T125, T127; T131 and T132; T161 and T164 with any of them.

## Implementation strategy

1. Phases 1 to 3 without AE: the read, the math, the class and the map, unit tested.
2. Phases 4 and 5: KD-001 and the three skills' switch, each falling back to today's behaviour.
3. The scripts, then one live sitting after wave A's.
4. Phase 7 and the hand-back. **Don't merge before T136**: skills 5 and 6 build on these captures.
   (Run 2 started cloud work before the live gate and it held, because the 🖐 tasks only added
   captures. Here they also check the math against AE, so a builder could start the cloud part of
   skills 5 and 6 after Phases 1 to 5 merge, at the cockpit's call, but their checks aren't trusted
   until T136 passes.)

**Task count:** 52, T100 to T165: Setup 4 (T100–T103), Foundational 7 (T104–T106, T110–T113),
visibility and map 5 (T107–T109, T117, T118), KD-001 5 (T119–T123), skills 1 to 3's switch 7
(T124–T130), live captures 7 (T131–T137), hand-over 5 (T141–T145), requests 12 (T150 approval, done;
T151–T153, T157, T158, T160–T165). Four are 🖐 live (T133, T134, T135, T158). IDs skip on purpose
(T114–T116, T138–T140, T146–T149, T154–T156, T159) so phases keep their own ranges; T166 to T199
are unused.
