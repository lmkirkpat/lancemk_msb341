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
size in the snapshot, T164 and T165. **2026-10-26:** the builder approved seven loose ends on the
merged skills 2, 1 and 3 (spec FR-039 to FR-045, SC-014): **Phase 9, T167 to T185**, for one
shared-code owner on a branch of its own. The builder answered LE-1 to LE-3 the same day (all as
recommended), so nothing in Phase 9 is blocked. **2026-10-26, later:** Phase 9 merged as `d4a9bd6`
without T173 and T174 (LE-1's rule broke four existing tests), and the builder approved a **second
pass** (FR-043 rewritten as "confirm + baseline", FR-046, FR-044 and FR-045 amended; research R24 and
R25 amended, R26; and FR-040's re-read only on a pass): Phase 9 › Second pass, T186 to T199, with T173, T174 and T181 rewritten in place.
It's written to the recommended answers of open questions LE-4 to LE-6, so nothing is blocked.

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
T069); nothing here edits them. This file uses **T100 to T199** only, plus **T199a to T199e**, numbered by the cockpit on 2026-10-27 when the range was used up (letters after T199).

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
- [x] T123 [US4] Update `.claude/skills/ease-mentor/SKILL.md` step 2's "Say what you're leaving out and why" bullet with one sentence: only layers in `hidden_layers` are called hidden; a track matte is never in it, even with its eye off, because its motion is what shows through the layer it mattes, so its pairs are ordinary candidates. Change nothing else. **Do this task last, after the other session's `SKILL.md` work has landed** (Q4): (1) the cockpit's go-ahead names the integration-branch commit that holds the easing-gate session's `SKILL.md` edit; (2) `git log --oneline <T100's merge base>..<integration branch> -- .claude/skills/ease-mentor/SKILL.md` shows that commit; (3) in the main checkout and in every worktree `git worktree list` shows, `git -C <path> status --porcelain -- .claude/skills/ease-mentor/SKILL.md` prints nothing. Then bring the integration branch into this branch (rebase or merge, never `reset --hard`) and make the edit on top of it. If any of (1) to (3) fails, leave T123 unticked, finish everything else, and hand back saying which check failed; T143 waits for T123. **Done 2026-10-26** (branch `offset-order`): check (1) is satisfied by `23b37e9` (2026-10-24, the easing-gate session's work), which changed the rubric only and no `SKILL.md`, so there was no `SKILL.md` edit to wait for and (2) has nothing to show; `23b37e9` is already in this branch's history; (3) `status --porcelain` on the file was empty in the main checkout and all 8 worktrees. The added sentence ends step 2's "leaving out" bullet

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
- [x] T143 [US6] Hand off to the cockpit for the **eval engineer** (their run, their files; research R23): the easing set (`node product/evals/easing/run.mjs`) on this branch, after T123, **and** on its merge base the same day. **Merge gate (Q4):** the branch is no worse than the merge base: it passes at least as many cases, and no hard-rule check fails on the branch that passes on the base. A case that fails only on the branch is run once more before it counts (noise). FR-035 itself closes with the other session's easing work. If a case drops because of T123's line, fix it on this branch before merge **Done 2026-10-26: branch `offset-order` 24/25 vs merge base `2bcfb54` 25/25, same day ($25.24 with the re-run). The branch-only failure was case 17's rubric item R-NAMES-LAYERS ("6 visible layers" counted 5 by the judge); passed on re-run, no hard-rule check failed on either side. Gate passed; merged `decc9d8`.**
- [x] T144 [US6] Hand off to the **eval engineer**: cross-skill eval case 3 (spec › Eval plan, matte, KD-001; SC-011) using `overlaps.json` (a live capture; Wipe is the moving matte). The case and its number are theirs and the cockpit's **Done 2026-10-26: easing case 26 (`26-matte-eye-off.json`, fixture `matte.json` from the live `overlaps.json`), merged `35a17d5`. Smoke 3/3 ($1.12), and it passes without T123's line too: the tool already keeps the matte out of `hidden_layers`.**
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

## Phase 9: Loose ends on the merged skills 2, 1 and 3 (T167 onward)

**Approved by the builder 2026-10-26** (all seven items; a tasking pass, not a design round). From
the first live lessons of speed graph (008), key types (009) and offset (010). Requirements:
[spec.md](spec.md) › Loose ends in the merged skills, **FR-039 to FR-046** and **SC-014**; fields:
[data-model.md](data-model.md) › Loose-ends pass; decisions: [research.md](research.md) R24, R25.
Sources (read them; the requirements don't restate them): `discovery/usage-notes/speed-graph.md`,
`key-types.md` and `offset.md` › To fix later, and the wave A eval READMEs on `evals-wave-a`.
Teaching designs are untouched: no item changes what a skill teaches.

**Who builds it:** one skill-builder, alone, as the shared-code owner (FR-032), in a worktree the
cockpit cuts from **local `main`** (at or after `31fe72d`, skill 6's merge), merged with
`/merge-worktree <branch> skill-builder --shared-owner`. Every task edits a file another task here
also edits (`common.mjs`, three skills' `SKILL.md`), so **nothing in this phase is [P] except the four
new test files**. The wave B rules above still hold: no existing test file edited, no test that lists
the skills or pins a whole reply's key set. Easing must still hold: FR-035's bar, by T183. **Don't
touch** `specs/011*`, `specs/012*`, `.claude/skills/anchor-mentor/`, `.claude/skills/null-parenting-mentor/`,
`mentor/tools/null-parenting.mjs` or anything only on `skill-5-anchor` (their follow-ups are in Later
per-skill branches). On 2026-10-26, `skill-5-anchor` didn't differ from `main` in any file below.

**Existing files this phase changes** (and no others; T182 compares against this table):

| File | Change | Task |
|---|---|---|
| `mentor/tools/speed-graph.mjs` | `comp.frame_rate` in `speed_graph_snapshot`'s `comp`; `server_current` | T169, T176 |
| `mentor/tools/key-types.mjs`, `mentor/tools/offset.mjs` | `server_current` in the snapshot tool's reply; nothing else | T176 |
| `mentor/tools/common.mjs` | `server_current` in `read_learner_record`; `preview_frame`'s optional `layer` and its reply fields | T176, T179 |
| `mentor/server.mjs` | Record the `mentor/` tree hash once at start (through the new lib below) | T176 |
| `mentor/lib/session.mjs` | `start()`: a stale open lesson starts fresh (FR-043); nothing else | T174 |
| `.claude/skills/speed-graph-mentor/SKILL.md` | Stages 2 and 6, one sentence each (FR-039); FR-042 only if T172 finds the pattern; the restart line (FR-044) | T169, T172, T177 |
| `.claude/skills/key-types-mentor/SKILL.md` | Step 0 wording (FR-042); the restart line (FR-044); steps 3 and 5's frames (FR-045) | T172, T177, T180 |
| `.claude/skills/offset-mentor/SKILL.md` | Step 7's measured-gap sentence (FR-040); the Quick Offset paragraph (FR-041); step 0 wording (FR-042); the restart line (FR-044) | T170, T171, T172, T177 |
| `.claude/skills/ease-mentor/SKILL.md`, `.claude/skills/next-mentor/SKILL.md` | The restart line in step 0 (easing) and step 1 (next) only (FR-044) | T177 |
| `specs/004-ae-curriculum/tasks-wave-b.md` | Tick tasks only | all |

`mentor/tools/easing.mjs` (`snapshot_project`) doesn't change (FR-044). Nothing under `bridge/` or
`mentor/jsx/` changes: FR-045 reuses read R3 (R24).

**New files:** `mentor/lib/server-current.mjs` (T176); `mentor/test/speed-graph-frame-rate.test.mjs`
(T168), `session-stale.test.mjs` (T173), `server-current.test.mjs` (T175),
`preview-frame-layer.test.mjs` (T178), all under `mentor/test/`.

### Setup

- [x] T167 On the worktree, run `cd mentor && npm test` and `node --test .claude/hooks/test/*.test.mjs`; note both pass counts and the worktree's base commit in the hand-back (the base for "no existing test edited" and for T183)

### FR-039: speed graph, a reading answer given as a time or a frame

- [x] T168 [P] [US1] **Tests first**: new `mentor/test/speed-graph-frame-rate.test.mjs`, in fixture mode on an existing live capture (for example `practice-before.json`): `speed_graph_snapshot`'s reply has `comp.frame_rate` equal to the snapshot's `comp.frame_rate`, and its `comp.name` and `comp.duration` are as before. Fails until T169
- [x] T169 [US1] **Code and prompt**: in `mentor/tools/speed-graph.mjs`, add `frame_rate: snapshot.comp.frame_rate` to the reply's `comp`. In `.claude/skills/speed-graph-mentor/SKILL.md` stages 2 and 6, one sentence each: an answer given as a time or a frame is placed in the pair from its key times (a frame divided by the comp's frame rate, counted from the comp's start), then checked against `fastest.parts` as usual; an answer outside the pair gets a question. No other wording changes. **Done when:** T168 and every existing test pass; the two sentences are in stages 2 and 6 and nowhere else

### FR-040 and FR-041: offset's two sentences

- [x] T170 [US1] **FR-040**, `.claude/skills/offset-mentor/SKILL.md` step 7: one bullet, "the gap they stated vs. the gap the check measured": when the measured gaps (`gaps_frames`) don't match the stated gap and `offset_demo` hasn't run, say the gap back as measured, as theirs ("you went with about 30 frames"), never as advice, and call `offset_snapshot` again with `skill_options` carrying the measured gap. Nothing else in step 7 changes. **Done when:** the bullet is there; it names no number of its own; the proposed eval case (gap changed after the fact, `offset.md` session 1) is in T184's hand-off
- [x] T171 [US1] **FR-041**, `.claude/skills/offset-mentor/SKILL.md` › Where things are: a short "if they ask how Quick Offset works" paragraph, still only when `quick_offset` is true, using **only** FR-041's five claims (the gesture; on layers whole layers move and spread evenly, the top layer stays; on keys only keys move and they can spread the other way; keys can land between frames on layers; check the order after the drag, play it back, then say "done"). It must not say that selection order sets the direction, that dragging the other way reverses it, that one Edit > Undo reverses one drag, any way to read the gap while dragging, or any shortcut but Command and Option. **Done when:** a reviewer can match every claim in the paragraph to FR-041's list (paste the paragraph in the hand-back); the proposed eval case (how does Quick Offset work, `offset.md` session 2) is in T184's hand-off

### FR-042: no leaked self-note before the first call

- [x] T172 [US1] **Prompt fix**: read the step 0 branch text in `key-types-mentor` and `offset-mentor` (and speed graph's "Before the lesson"), which the smoke runs echoed as "Key types learned, review due -> run the review." and "Review is due → run the review.". Reword so a branch reads as what to do, never as a line to say, and add one sentence to step 0: the first words the learner sees are the lesson's or review's own opening, never which branch you took. Apply it to speed graph only if its text has the same "is due, run the review" shape; say which in the hand-back. Don't change the review steps themselves. **Done when:** none of the three files has a line the eval sets' `no_self_instructions` pattern (`git show evals-wave-a:product/evals/offset/run.mjs`) would match if echoed; SC-014's runs are in T184's hand-off

### FR-043: a resumed lesson whose comp changed starts fresh (rewritten 2026-10-26, second pass)

T173 and T174 weren't built in the first pass: LE-1's rule failed `key-types-tools.test.mjs:73`,
`session-skill-data.test.mjs:42`, `session-skills.test.mjs:224` and `speed-graph-tools.test.mjs:77`,
which guard choices kept across a resume. Both are rewritten for FR-043 as it now stands and are
built on the **second pass's** branch (below), not the first.

- [x] T173 [P] [US1] **Tests first** (rewritten, second pass; FR-043, research R26): new `mentor/test/session-stale.test.mjs`, on saved snapshots with a stub analyzer (as `session-skill-data.test.mjs` does) whose `target_refs` name real layers of the capture. An open lesson never checked and with no demo, holding `skill_options` (an `order` and a `gap_frames`) and `skill_data`: (a) **T037's case**: same day, **resumed** (another skill's or comp's lesson was current in between), the comp matching the baseline → `lesson: "resumed"`, the old baseline, `skill_options` and `skill_data` kept, and `stored_choices: true`; the same with this call sending `skill_options` → `resumed`, replaced, `stored_choices: false`; (b) resumed with a target layer's keys changed (a key moved, a value changed, a key added or removed) → `lesson: "new"`, this snapshot as baseline, no `skill_data`, `skill_options` only if this call sends them, `stored_choices: false`; the same for a target layer's in point moved and for its parent set (on `layer_info` captures), and for a target name now missing; (c) resumed with a change only on a layer no target or focus names → `resumed`, kept; (d) **continued** the same day with target keys that differ (the learner's own edit before "done") → `continued`, the old baseline and `skill_options` kept, `stored_choices: false`; (e) continued the same day, nothing changed → `continued`, `stored_choices: false`; (f) continued, `lesson_id` from an earlier local day → `new` (LE-4, as approved); (g) resumed with no targets and no focus yet → `resumed`, kept; (h) a target name found in neither snapshot (the stub refs the four existing tests use) → matches. A lesson that was checked, or had a demo, resumed with changed keys → `resumed`, baseline kept. `fresh: true` on a checked lesson still throws `LESSON_UNDERWAY`. Easing, with its own analyzer: resumed with changed keys → `new`; resumed matching → `resumed`. Fails until T174
- [x] T174 [US1] **Code** (rewritten, second pass): in `mentor/lib/session.mjs` `start()`, before `continuing` is chosen, an `open` lesson that was never checked and has no demo is stale when (1) it would be **resumed** (the current pointer is another lesson) and R26's compare finds a difference between its `baseline` and this snapshot on the layers its `target_refs` and `focus` name, or (2) it would be **continued** and its `lesson_id` time is from an earlier local day; a stale lesson is replaced as if none existed (data-model › Loose-ends pass › Session lesson). `start()` also returns `stored_choices` (R26; not written to `session.json`). Nothing else in the file changes. **Done when:** T173 and every existing test pass unchanged, the four named above among them (name them in the hand-back)

### FR-044: the mentor says when its tools are older than the repo

- [x] T175 [P] [US1] **Tests first**: new `mentor/test/server-current.test.mjs`, with the hash read injected (no real git in the test): the same hash at start and now → `server_current: true`; a different hash now → `false`; a read that throws or times out, at start or now → `null`; `read_learner_record`'s reply carries the field, and so do `speed_graph_snapshot`, `key_types_snapshot` and `offset_snapshot` in fixture mode; `snapshot_project`'s reply doesn't have it; no reply carries the hash or a path. Fails until T176
- [x] T176 [US1] **Code**: new `mentor/lib/server-current.mjs` per R25 (`git rev-parse HEAD:./` with its working directory the folder holding `server.mjs`, from `import.meta.url`; a short time-out; any failure is `null`), with the read injectable for tests; `mentor/server.mjs` records the start hash once; `read_learner_record` (`common.mjs`) and the three snapshot tools add `server_current` to their replies. No reply field is removed or renamed. **Done when:** T175 and every existing test pass; from the panel's runtime folder (`panel/lib/runtime.js`'s `.mcp.json`) a fresh server returns `true`, checked once by hand and noted in the hand-back
- [x] T177 [US1] **Prompts**: one sentence in step 0 of `ease-mentor`, `speed-graph-mentor` ("Before the lesson"), `key-types-mentor` and `offset-mentor`, and in step 1 of `next-mentor`: when `read_learner_record` (or a later snapshot) returns `server_current` false, say once, in plain words, that the mentor's tools were updated since this session started and it needs a restart (a new Claude Code session) before the lesson, then stop. `null` and `true` say nothing. No field name in the learner's words. **Done when:** the sentence is in all five files; easing's is its only change in this phase (T183 runs the easing gate)

### FR-045: point at the focus layer in a frame

- [x] T178 [P] [US1] **Tests first**: new `mentor/test/preview-frame-layer.test.mjs`, in fixture mode on live captures with `layer_info` (`layer-info/practice2b.json` and `layer-info/overlaps.json`, each at its `comp.time`): `preview_frame({ layer: "Blink" })` returns `layer_bounds` equal to `footprint()`'s bounds for that layer (`rect_extents` on a shape or text layer, else `rect`), plus `comp_size` and `image_size`; a hidden layer, a null and a matte (from `overlaps.json`) have no `layer_bounds` and the reasons `not_rendered`, `null_layer`, `not_rendered`; a name not in the comp gives `not_found`; a duplicated name gives `ambiguous`; a time with no sample gives `not_sampled`; a capture without `layer_info` gives `no_layer_info`; without `layer`, the reply is exactly today's `{ comp, time }` and no snapshot is taken. Fails until T179
- [x] T179 [US1] **Code**, `mentor/tools/common.mjs`: `preview_frame`'s schema gains `layer` (string, optional). With it: one `takeSnapshot({ sample_times: [t] })` (t is `time`, or the snapshot's `comp.time` when `time` is omitted), find the layer by name with `layer-info.mjs`, apply FR-045's absent cases through `visibility.mjs` and the layer's in and out points, else `footprint()`'s bounds; read the PNG's width and height from its header (IHDR, Node built-ins only). The frame is rendered exactly as today. **Done when:** T178 and every existing test pass; a call without `layer` makes the same bridge calls as before (check `calls.jsonl` or the test's call count)
- [x] T180 [US1] **Prompt**, `.claude/skills/key-types-mentor/SKILL.md` steps 3 and 5: pass the focus layer to `preview_frame`, and say in plain words where it is in the frame ("the small square near the top left"), scaling the bounds by the image's size over the comp's; never a pixel number. With no bounds back, point at nothing and describe the snap from the tool data, as today. **Done when:** both steps say so; nothing else in the file changes for FR-045
- [ ] T181 🖐 [US1] **Live check of the bounds** (R24's open points; rewritten 2026-10-26, second pass). **Runs after the merge:** the builder chose to merge Phase 9 before this check (2026-10-26), so it runs live from `main` in a fresh Claude Code session (MCP servers survive `/clear`), once T193 and T194 have merged so the second-pass rows see their reasons; the first five layers may run on `main` sooner, at the cockpit's call. With the AE lock and nobody else on AE (`ae_status`, then `.git/knack-agents/ae.lock.json`), on Mentor Practice 2 reset to `layer-info/practice2b.json`: `preview_frame` with `layer` on Blink, Dot 1, a text layer (Caption), a parented layer (Hatch) and, on Mentor Overlaps, the guide layer. For each, compare the bounds (scaled to the image) with where the layer is in the PNG. Record: the image's size against the comp's at Full and at Half viewer resolution; whether Caption's box matches its letters; whether the guide layer shows in the frame. **Second-pass rows:** (1) **a masked solid**: plant by script on Mentor Overlaps a solid (for example 400 × 400 px) with one small mask (about a quarter of its size, away from its middle); `preview_frame` on it gives no bounds and the reason `masked`, the snapshot's `mask_count` for it is 1, and the PNG shows only the masked part (note how far the unmasked rectangle would have been off); then delete it by script; (2) **Blink at Opacity 0**: at a time its Opacity is 0 → `transparent`; at a time it's 100 → bounds; the sample's `opacity` matches the Timeline at both; (3) a precomp layer, if Mentor Practice or Mentor Practice 2 already has one → `precomp`; (4) LE-6: a footage layer with transparent areas, only if the project already has one (no planting). Undo nothing the tool did (it writes nothing); after the masked solid is deleted, check each comp still matches its capture with a strict compare (the capture predates `mask_count` and sample `opacity`, so compare without those two). **Done when:** the results are in the hand-back; any that disagree with R24 or FR-045 (for example, guides do show) go to the spec writer

### Close

- [x] T182 [US6] Run `cd mentor && npm test` and `node --test .claude/hooks/test/*.test.mjs`: all green; `git diff --stat <T167's base> -- mentor/test/*.test.mjs` shows only the four new files; then `node .claude/hooks/check-branch.mjs <this branch> skill-builder main --shared-owner`: the changed existing files match this phase's table exactly, and `git diff --stat <T167's base> -- .claude/skills/null-parenting-mentor/ mentor/tools/null-parenting.mjs .claude/skills/anchor-mentor/` is empty (skill 6 is on `main` since `31fe72d`, but its files are LE-2's follow-up). Paste all of it in the hand-back **2026-10-26:** done apart from T173's test file (`session-stale.test.mjs`), which moved to the second pass with T174; T197 repeats this check for the second pass's branch (ticked 2026-10-27 on that basis, reviewer nit 6)
- [x] T183 [US6] Hand off to the cockpit for the **eval engineer**: the easing set (26 cases) on this branch and on its base the same day, as T143 did. **Merge gate:** at 25/26 or better with no hard-rule failure (FR-035's bar), and no worse than the base (a branch-only failure is re-run once before it counts). The changes easing can see: step 0's restart line, `read_learner_record`'s new field, and the stale-lesson rule **Passed 2026-10-26:** branch 25/26, base 25/26, branch case 08 `--repeat 3` 3/3 (`product/evals/easing/results/2026-10-26-2*phase9*.json`). It ran without T174, so the stale-lesson rule wasn't in it: T195 runs the gate again for the second pass
- [ ] T184 [US6] Hand off to the cockpit for the **eval engineer** (their files and numbers): (a) **SC-014**: key types case 16, offset case 17 and speed graph case 08, `--repeat 3` each, on `evals-wave-a` with this branch's `SKILL.md` (the cockpit decides how: merging `main` into `evals-wave-a` after this merges, or a run from a worktree with both); (b) the cases the usage notes propose: speed graph's reading answer given as a time or a frame (`speed-graph.md`), offset's gap changed after the fact (`offset.md` session 1) and how Quick Offset works (`offset.md` session 2), for when the wave A sets merge. FR-043, FR-044 and FR-045 get no eval case: unit tests cover them, and eval fixtures don't render frames
- [ ] T185 [US6] Write the hand-back: branch and commit; T167's and T182's counts and output; LE-1's answer as built; T171's paragraph; T172's finding for speed graph; T176's runtime-folder check; T181's results; and the follow-ups below, as requests

### Second pass (2026-10-26, T186 to T199, plus T173, T174 and T181 rewritten above)

**Approved by the builder 2026-10-26**, a tasking pass after Phase 9 merged (`d4a9bd6`).
Requirements: [spec.md](spec.md) FR-043 (rewritten), **FR-046** (new), FR-040, FR-044 and FR-045 (amended);
decisions: [research.md](research.md) R24 and R25 (amended) and **R26**; fields: [data-model.md](data-model.md)
› Loose-ends pass and the `layer_info` table (`mask_count`, sample `opacity`). Sources: the builder's
Phase 9 hand-back (the four failing tests) and the reviewer's findings on `mentor/lib/server-current.mjs`
and `mentor/tools/common.mjs`. Teaching designs are untouched.

**Who builds it:** one skill-builder, alone, as the shared-code owner (FR-032), in a worktree cut
from **local `main`** at or after `d4a9bd6`, merged with `/merge-worktree <branch> skill-builder
--shared-owner`. The first pass's rules hold: no existing test file edited (that now includes
Phase 9's `server-current.test.mjs` and `preview-frame-layer.test.mjs`), no test that lists the skills
or pins a whole reply's key set, and **don't touch** `specs/011*`, `specs/012*`,
`.claude/skills/anchor-mentor/`, `.claude/skills/null-parenting-mentor/`, `mentor/tools/transform-anchor.mjs`
or `mentor/tools/null-parenting.mjs`. **Merge timing:** `session.mjs` and `snapshot.jsx` reach skills 5
and 6 too (the stale rule; two new snapshot fields), so the cockpit merges when no skill 5 or 6 live
lesson or sitting is running, and their next live lesson starts in a fresh session and notes that it
ran on the new rule. **First**, on the worktree, run `cd mentor && npm test` and
`node --test .claude/hooks/test/*.test.mjs` and note both counts and the base commit in the hand-back,
as T167 did (the base for T195 and T197).

**Existing files the second pass changes** (and no others; T197 compares against this table):

| File | Change | Task |
|---|---|---|
| `mentor/lib/session.mjs` | `start()`: FR-043's stale test (R26) and `stored_choices` in its return; nothing else | T174 |
| `mentor/tools/speed-graph.mjs`, `mentor/tools/key-types.mjs`, `mentor/tools/offset.mjs` | `stored_choices` in the snapshot tool's reply; nothing else (speed graph also gets `landing_hard_labels`, T199c) | T187, T199c |
| `mentor/lib/server-current.mjs` | The runtime-only listing hash and the `.git` check (FR-044, R25 amended) | T190 |
| `mentor/jsx/snapshot.jsx` | `mask_count` in each `layer_info` entry, `opacity` in each sample (ES3); nothing else | T193 |
| `mentor/tools/common.mjs` | `preview_frame`'s four new no-bounds reasons; nothing else | T194 |
| `.claude/skills/speed-graph-mentor/SKILL.md`, `.claude/skills/key-types-mentor/SKILL.md`, `.claude/skills/offset-mentor/SKILL.md` | FR-046's confirm sentence, one place each; nothing else | T188 |
| `.claude/skills/speed-graph-mentor/SKILL.md` (also in T188's row) | Step 1: snapshot without `skill_options` first; T188's paragraph names land-hard pairs from `landing_hard_labels` (FR-047) | T199d |
| `.claude/skills/ease-mentor/SKILL.md` | Step 0's doubled "before anything else", said once; nothing else | T191 |
| `.claude/skills/offset-mentor/SKILL.md` (also in T188's row) | Step 7's measured-gap bullet: only on a passed check (FR-040, amended), then no re-read at all (2026-10-27) | T199, T199a |
| `specs/004-ae-curriculum/tasks-wave-b.md` | Tick tasks only | all |

**New files**, all under `mentor/test/`: `session-stale.test.mjs` (T173), `stored-choices.test.mjs`
(T186), `server-current-runtime.test.mjs` (T189), `preview-frame-reasons.test.mjs` (T192), and
`speed-graph-land-hard.test.mjs` (T199b, 2026-10-27). Edited
captures for tests are temp copies the test writes; no new fixture files.

#### FR-043 and FR-046: a resumed lesson, its choices kept and confirmed

T173 (above) and T186 are the tests; T174 (above), then T187, then T188.

- [x] T186 [P] [US1] **Tests first** (FR-043, FR-046, R26): new `mentor/test/stored-choices.test.mjs`, in fixture mode, for each of `speed_graph_snapshot`, `key_types_snapshot` and `offset_snapshot` with that skill's own `skill_options`: a first call that sends them → `stored_choices: false`; a continued call without them → `false`; a call on another comp (or another skill's lesson), then a call back on the same capture without them → `lesson: "resumed"`, `stored_choices: true`, and the reply's existing fields still show the choices (for example offset's `order`); back with `skill_options` → `false`. `snapshot_project`'s reply has no `stored_choices` key. Fails until T174 and T187

- [x] T187 [US1] **Code**: in `mentor/tools/speed-graph.mjs`, `key-types.mjs` and `offset.mjs`, add `stored_choices` from `session.start()`'s return to the snapshot tool's reply, as it is. No other reply field changes. **Done when:** T186 and every existing test pass
- [x] T188 [US1] **Prompts, FR-046**: in `speed-graph-mentor`, `key-types-mentor` and `offset-mentor`'s `SKILL.md`, one short paragraph where the lesson's snapshot reply is first read: when `stored_choices` is true, before any demo, check, frame or hint that uses a stored choice, say back in plain words, as the learner's own, what they chose last time (from this reply's fields that show it: offset's order, focus and gap; key types' focus and what should move; speed graph's landing-hard pairs and eased layers), ask whether it still holds, and stop for the answer; a change goes back through `skill_options` as the skill already does, a yes goes on. Never a field name, never "stored" or "session". **Done when:** the paragraph is in all three files and nothing else in them changes; the hand-back pastes the three paragraphs and lists, per skill, each `skill_options` key the skill sends and the reply field that shows it (a key with no field is reported there, not added); easing gets no paragraph (it stores no choices)

#### FR-040: the measured-gap re-read only on a pass

- [x] T199 [US1] **Prompt**, `.claude/skills/offset-mentor/SKILL.md` step 7, the bullet "the gap they stated vs. the gap the check measured" (T170): add its condition, **only when the check passed** (`passed`); otherwise the other step 7 bullets run (still together, changed keys, and so on) and `skill_options` isn't re-sent. A measured gap of 0 (members still together, offset eval cases 11, 14, 15 and 23) never reaches `gap_frames`. No tool change: `passed` already means every gap is at or above the floor (`mentor/lib/offset.mjs`, `still_same` through `isSame`), and `gap_frames`' minimum of 1 still refuses a bad call before any write. Nothing else in step 7 changes; T188's paragraph is in another step, so do the two one at a time. **Done when:** the bullet has the condition; T196's hand-off also asks the eval engineer to re-run offset cases 11, 14, 15 and 23 on this branch and confirm that no `offset_snapshot` call is refused (for when the wave A sets merge)
- [x] T199a [US1] **Prompt** (the cockpit's number, past this file's range; FR-040 amended 2026-10-27, reviewer finding 1 on `phase9-pass2`), `.claude/skills/offset-mentor/SKILL.md` step 7, the same bullet T199 changed: **no `offset_snapshot` call in step 7**. After a pass, when `gaps_frames` differs from the gap they stated, say the gap back from `gaps_frames` (the first one if they differ, to the nearest whole frame), as theirs, never as advice; no floor hint (a pass is at or above the floor). Before a pass, the other step 7 bullets run and nothing is re-sent. Remove the bullet's re-read, its "this re-read is part of the check" sentence and its after-the-re-read floor branch; nothing else in step 7 changes. Supersedes T199's re-read (T199's condition goes with it). **Done when:** step 7 has no `offset_snapshot` call; the hand-back pastes the bullet; T196's hand-off carries the "passed, but the stated gap differs" eval note (one `offset_check`, no later `offset_snapshot`, the measured gap said back as theirs, `record_lesson` accepted as passed)

#### FR-047: speed graph keeps and names a stored land-hard choice (2026-10-27)

The cockpit's numbers, past this file's range. T199b is the test; then T199c, then T199d (after T188, which edits the same `SKILL.md`).

- [x] T199b [P] [US1] **Tests first**: new `mentor/test/speed-graph-land-hard.test.mjs`, in fixture mode on `practice-now.json`: (a) a call with `skill_options` `{ eased_layers: ["Title"], land_hard: [<P3's id>] }` returns `landing_hard_labels` equal to `["Title › Position 3–4.367 s"]` (the same form as `pairs[].label`), next to `landing_hard` unchanged; (b) no land-hard pairs → `landing_hard_labels: []`; (c) an id that names no pair in the baseline → `null` in its place; (d) **the two-call flow**: a first call without `skill_options` → `lesson: "new"`; a second with `eased_layers` → `continued`, the same baseline; (e) after a lesson on another comp, a call **without** `skill_options` → `resumed`, `stored_choices: true`, `landing_hard` and `landing_hard_labels` kept. `speed-graph-tools.test.mjs` stands unchanged. Fails until T199c (and (e) until T174 and T187)
- [x] T199c [US1] **Code**, `mentor/tools/speed-graph.mjs`: add `landing_hard_labels` to `speed_graph_snapshot`'s reply (FR-047; data-model › Loose-ends pass), built from the lesson's baseline with the same label code `pairs[].label` uses. No other reply field changes. **Done when:** T199b and every existing test pass
- [ ] T199d [US1] **Prompt**, `.claude/skills/speed-graph-mentor/SKILL.md` step 1: call `speed_graph_snapshot` first **without** `skill_options`; if `lesson` is `resumed` or `continued`, go on with the stored choices (T188's paragraph confirms them when `stored_choices` is true, naming land-hard pairs from `landing_hard_labels` in plain words); if `new`, call again with `skill_options` `{ "eased_layers": [...], "land_hard": [] }` as before. Point T188's paragraph at `landing_hard_labels` for speed graph. The review step's call doesn't change. Nothing else in the file changes. **Done when:** step 1 says so; the hand-back pastes step 1 and T188's paragraph as they now read
- [ ] T199e [US6] Hand off to the cockpit for the **eval engineer** (their files and numbers), for when the wave A sets merge: a **resumed speed graph lesson with a stored land-hard choice**: earlier turns named one pair that lands hard, then another comp's lesson, then back on a comp that matches. Expect: the first `speed_graph_snapshot` call sends no `skill_options`; no later call sends `land_hard: []` before the learner answers; the mentor names the land-hard pair in plain words (from `landing_hard_labels`) and asks whether it still holds before any frame, demo or check; no field name or pair id. This replaces T196's speed graph case, which the eval engineer found couldn't be reached under the old step 1

#### FR-044: hash only what the server runs; no git without a checkout

- [x] T189 [P] [US1] **Tests first**: new `mentor/test/server-current-runtime.test.mjs`, with the listing read and the process start injected (no real git): two listings that differ only on the `test` or `dev` line → `server_current: true`; differing on `lib`, `tools`, `jsx`, `fixture`, `fixture.mjs`, `server.mjs` or `package.json` → `false`; an empty or malformed listing, at start or now → `null`; with no `.git` folder or file in the folder or any folder above it (a temp folder; the test skips itself if the OS temp folder sits inside a checkout) → `null` and git is never started; with a `.git` **file** two levels up (as in a worktree) → git is started. No reply carries the hash, the listing or a path. `server-current.test.mjs` (T175) stands unchanged. Fails until T190
- [x] T190 [US1] **Code**, `mentor/lib/server-current.mjs` (R25, amended): the default read checks for `.git` (`fs.existsSync`) in `MENTOR_DIR` and each folder above it before starting anything, and returns `null` if there's none; otherwise it runs `git ls-tree HEAD` with `cwd: MENTOR_DIR` and the same time-out, drops the lines whose name is `test` or `dev`, and returns the sha256 (`node:crypto`) of the remaining lines joined with newlines. `setHashReader` keeps working as T175 uses it; the hash never leaves the file. **Done when:** T189, T175 and every existing test pass; by hand once, on the worktree, a running server reports `true` after a commit that touches only `mentor/test/` and `false` after one that touches `mentor/lib/`, and a fresh server from the panel's runtime folder reports `true` (noted in the hand-back)
- [x] T191 [US1] **Prompt tidy**, `.claude/skills/ease-mentor/SKILL.md` step 0: it says "before anything else" twice in a row (the `read_learner_record` line, then the restart line T177 added). Say it once, keeping both meanings: call `read_learner_record` first, and the restart check comes before every branch below. No other word in the file changes. **Done when:** the phrase appears once in step 0; T195 runs the easing gate

#### FR-045: no bounds for a precomp, effects, masks or Opacity 0

- [x] T192 [P] [US1] **Tests first**: new `mentor/test/preview-frame-reasons.test.mjs`, in fixture mode on temp copies of `layer-info/practice2b.json` that the test edits: on Blink, `mask_count: 1` → no `layer_bounds`, reason `masked`; `mask_count: null` → `masked`; `mask_count: 0` → bounds; `effect_count: 2` → `effects`; `effect_count: null` → `effects`; `kind: "precomp"` → `precomp`; the sample at `time` with `opacity: 0` → `transparent`, `0.5` → `transparent`, `1` → bounds; the capture as saved (no `mask_count`, no sample `opacity`) → the same bounds T178 gets. Order: a hidden layer with a mask → `not_rendered`; a masked layer outside its in and out points → `not_on_screen`; a precomp with effects → `precomp`. `preview-frame-layer.test.mjs` (T178) stands unchanged. Fails until T194
- [x] T193 [US1] **Read**, `mentor/jsx/snapshot.jsx` (ES3): each `layer_info` entry gains `mask_count` (`L.property("ADBE Mask Parade").numProperties`, through the same guarded read as `effect_count`), and each sample gains `opacity` (`L.transform.opacity.valueAtTime(t, false)`, rounded as the sample's other values). Nothing else in the file changes. Existing captures aren't re-taken; `mentor/dev/capture.mjs --compare` already skips `layer_info`, so it needs no change. **Done when:** every existing test passes; T181 confirms both reads live **One-off exception (Lance, 2026-10-27):** `mentor/test/snapshot-layer-info.test.mjs` gained `mask_count` in its exact key list (:185) and the sample's `opacity` in its field-by-field compare (:282); nothing else in it changed
- [x] T194 [US1] **Code**, `mentor/tools/common.mjs` (`locateLayer`): after the in and out point test and before `footprint()`, return no bounds with `precomp` (`kind` is `precomp`), then `effects` (`effect_count` above 0, or `null`), then `masked` (`mask_count` above 0, or `null`), then `transparent` (the sample at `t` has `opacity` under 1); an absent `mask_count` or sample `opacity` is no reason. Nothing else changes, and a call without `layer` is still today's. **Done when:** T192, T178 and every existing test pass

#### Close

- [x] T195 [US6] Hand off to the cockpit for the **eval engineer**: the easing set (26 cases) on this branch and on its base the same day, as T183 did, with the same merge gate (25/26 or better, no hard-rule failure, no worse than the base; a branch-only failure re-run once). What easing can see: the stale rule (a resumed easing lesson whose keys changed starts new; one that matches resumes as before) and step 0's tidy (T191) **Passed 2026-10-27** (the cockpit's bar: within one of 25/26, no hard-rule failure; base is T183's 25/26): branch 24/26, both failures rubric item R-NAMES-LAYERS (a layer count); `--repeat 3` on 03 and 09 passed 2 of 3 each, a different rubric item failing each time (`product/evals/easing/results/2026-10-27-0*phase9-pass2*.json`)
- [ ] T196 [US6] Hand off to the cockpit for the **eval engineer** (their files and numbers), for when the wave A sets merge: one case per skill for FR-046 (key types, offset; speed graph's is T199e): a resumed lesson on a comp that matches, with stored choices; the mentor says them back in plain words and asks before any demo or check, and names no field. Offset's is T037's case (`discovery/usage-notes/offset.md` session 2). Also (T199, T199a): offset cases 11, 14, 15 and 23 re-run on this branch, with no refused `offset_snapshot` call; and a **"passed, but the stated gap differs"** case: the learner states one gap, makes another that passes; expect one `offset_check`, no `offset_snapshot` after it, the measured gap said back as theirs (never as advice), and `record_lesson` accepted as passed. FR-043's rule, FR-044 and FR-045's changes get no eval case (unit tests; eval fixtures don't render frames). **Corrected 2026-10-27:** the eval engineer found no reachable speed graph case for FR-046, because the old step 1 always sent `land_hard: []`, which cleared the stored choice and made `stored_choices` false; FR-047 fixes that (T199b to T199d), and T199e is the speed graph case
- [x] T197 [US6] Run `cd mentor && npm test` and `node --test .claude/hooks/test/*.test.mjs`: all green; `git diff --stat <the base> -- mentor/test/*.test.mjs` shows only the four new files above; `node .claude/hooks/check-branch.mjs <this branch> skill-builder main --shared-owner`: the changed existing files match the second pass's table exactly; and `git diff --stat <the base> -- .claude/skills/null-parenting-mentor/ .claude/skills/anchor-mentor/ mentor/tools/null-parenting.mjs mentor/tools/transform-anchor.mjs` is empty. Paste all of it in the hand-back **Done 2026-10-27:** mentor 1245 tests (1242 pass, 3 todo, 0 fail), hooks 39/39; check-branch `--shared-owner` "All 17 files are skill-builder's."; the changed existing files match the table, plus `snapshot-layer-info.test.mjs` under T193's one-off exception (Lance, 2026-10-27); skills 5 and 6 untouched
- [x] T198 [US6] Write the hand-back: branch and commit; the first run's and T197's counts and output; the four named tests passing unchanged; T188's three paragraphs and its field list; T199's bullet as changed; T190's by-hand checks; how LE-4 to LE-6 were built (to the recommendations unless the builder answered otherwise); and the follow-ups in Later per-skill branches, as requests **Done 2026-10-27** (the hand-back to the cockpit)

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
| 5, set the pivot; 6, null | FR-044's restart sentence in step 0 of `anchor-mentor` and `null-parenting-mentor`, and `server_current` in `anchor_snapshot` and `null_parent_snapshot`. Both already get the field from `read_learner_record` once Phase 9 merges; only the sentence and the snapshot field wait. Each after that skill's live lessons, on its own branch or after its merge (skill 6 merged `31fe72d`) | spec 004 FR-044, LE-2 |
| 5, set the pivot; 6, null | **Second pass:** FR-046's confirm paragraph in `anchor-mentor` and `null-parenting-mentor`, and `stored_choices` in `anchor_snapshot` and `null_parent_snapshot` (both send `skill_options`; skill 6's `skill_data` is the null's stored state, not a choice, and its spec writer pass says whether it's confirmed too). FR-043's rule reaches their lessons through `session.mjs` when T174 merges, with no change to their files; their next live lesson after that merge says so in its usage note. Each after that skill's live lessons, on its own branch | spec 004 FR-043, FR-046 |
| 6, null (with every skill's session) | **R26 and layer order (reviewer should-fix 3, 2026-10-27; carried to sprint 4 by the builder).** R26 matches a resumed lesson's layers by name, so a layer added above the targets counts as matching, but speed graph, key types, offset and easing key their targets and checks by layer index, so `diff` then misreads the resumed lesson. **Recommended fix:** R26 also requires each named layer's index to be unchanged (a renumbered target makes the lesson stale, so it starts fresh), with a `session.start` option to skip that test for a skill whose check matches by name. Only skill 6 sends it (`mentor/tools/null-parenting.mjs`): its own lesson adds a null, which renumbers the layers below, and its check already matches by name (`mentor/lib/null-parenting-check.mjs`). Without the option, every resumed skill 6 lesson would start fresh after the null was added, losing its `skill_data`. **The session change and skill 6's opt-out merge together, on skill 6's branch**, never one without the other. **Size:** small. In `session.mjs`, one comparison and one option; about four test cases in a new test file (a layer added above a speed graph target → new; the same with the option → resumed; skill 6 resumed after adding a null → resumed; a target moved down the stack → new); one line in skill 6's tool file; and a note in skill 6's next live lesson. About 1 to 2 builder hours. Needs a spec writer pass first (R26 and FR-043 amended) | spec 004 R26, FR-043; the reviewer's should-fix 3 on `phase9-pass2` |
| 3, offset; 5; 6 | The frame pointer (FR-045's `layer`) in their frame steps. Not in this pass (LE-3: key types only); a request for after T181 proves the bounds | spec 004 LE-3; `offset.md` session 2 step 2 |
| Diagnosis (spec 005) | Uses `visibility.mjs` and `motion-sources.mjs` from its first build (its Edge Cases "Track mattes" row) | spec 004 KD-001 |

---

## Dependencies & execution order

- **Phase 1** → **Phase 2** (blocking) → Phases 3 → 4 and 5 (4 and 5 need Phase 3's
  `visibility.mjs`) → Phase 6's scripts (T131, T132) → the 🖐 sitting (T133, T134, T158, then T135)
  → T136, T137 → **Phase 7**.
- Phase 8: T151 with T110; T152 after T110; T153 with T113; T157, T160 and T163 before T132's
  targets are written; T158 in T133's sitting; T161 then T162 any time after Phase 1 (no AE);
  T164 then T165 any time after T151, **before T133** (no AE).
- **Phase 9** (its own branch, cut from local `main` after Phase 8): T167 first; then each test
  before its code (T168 → T169, T173 → T174, T175 → T176 → T177, T178 → T179 →
  T180); T170, T171 and T172 in any order, one at a time (all edit `offset-mentor/SKILL.md`); T181 🖐
  after T179, one sitting at a time with the AE lock checked; T182 after every code task; T183 and
  T184 after T182. **Merge after T183's gate and T181.** **The builder chose to merge before T181
  (2026-10-26):** Phase 9 merged as `d4a9bd6` without T173 and T174, and T181 now runs live after the
  merge, from `main`, with the second pass's masked-solid and Opacity rows (so after T193 and T194
  merge).
- **Phase 9 second pass** (its own branch, cut from local `main` at or after `d4a9bd6`): the first
  test run; then T173 → T174 → T186 → T187 → T188, then T199, then T199a (all edit `offset-mentor/SKILL.md`); T199b → T199c → T199d (after T188: both edit `speed-graph-mentor/SKILL.md`); T199e with T196; T189 → T190; T191 any time; T192 → T193 → T194;
  T197 after every code task; T195 and T196 after T197. **Merge after T195's gate**, when no skill 5
  or 6 live lesson or sitting is running (the cockpit's call). Then T181 🖐 on `main`.
- **T123 last** before T143, once its three checks pass (Q4); T143 runs after T123.
- 🖐 order in one Mac sitting: wave A's tasks.md T041 and T064 (build Mentor Practice 2), T042 (its
  captures), then T133, T134, T158, then T135. The cockpit stays off AE.
- Tests are written before their code in every phase; live checks extend them in T136.

## Parallel opportunities

With one builder, [P] only means order doesn't matter: T104 to T109 are independent new files;
T117 and T118; T124, T125, T127; T131 and T132; T161 and T164 with any of them. Phase 9: only the
four new test files (T168, T173, T175, T178); every other Phase 9 task shares a file with another.
Second pass: only its four new test files (T173, T186, T189, T192); T174, T187 and T188 run in order
(T187 needs T174's return value), and T190, T191 and T193 touch files nothing else in the pass does,
so they could go in any order.

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
(T114–T116, T138–T140, T146–T149, T154–T156, T159) so phases keep their own ranges; T166 is unused.
**Phase 9 adds 19** (T167 to T185): setup 1, FR-039 2, FR-040 to FR-042 3, FR-043 2, FR-044 3,
FR-045 4 (one 🖐, T181), close 4. **The second pass adds 14** (T186 to T199) and rewrites three in
place (T173, T174, T181): FR-043 and FR-046 3 (T186 to T188), FR-040's fix 1 (T199), FR-044 3 (T189
to T191, with easing's tidy), FR-045 3 (T192 to T194), close 4 (T195 to T198). The range is used up;
**T199a** (2026-10-27, the cockpit's number) is FR-040's second fix; **T199b to T199e** (the same day)
are FR-047: test, code, prompt, eval hand-off.
