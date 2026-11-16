# Tasks: Expression and precomp reads (spec 015)

**Input**: [spec.md](spec.md) (approved `944cd8c`), [plan.md](plan.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md).

**Status**: Draft, awaiting the builder's approval with the plan.

**Format**: `- [ ] T### [P?] [Story?] (owner) Description`. `[P]` = can run alongside the other
`[P]` tasks in the same block (different files, no unfinished dependency). Owners: **skill-builder**
(mentor code, tests, fixtures, captures), **eval-engineer** (eval cases and runs),
**curriculum-designer** (CD-1, CD-2), **spec-writer** (spec files), **reviewer**, **cockpit**
(branches, merges, usage notes). **AE** = needs the AE lock (one driver at a time). **Builder's hands**
= the builder does it by hand in AE; the agent only reads before and after.

Tests are required (spec FR-029): every test uses fixtures from live reads, never written by hand,
except text-only cases for the expression parser (E5, E6, E12, E13), which test strings, not
snapshots.

**Shared code:** `mentor/**` is add-only (research R14). Each spec phase is **one skill-builder
branch** that the cockpit names `--shared-owner`. No parallel builders inside a phase; `[P]` marks
order freedom inside that one branch.

---

## Phase 0: Live checks (before any read code)

**Purpose:** settle the claims the reads build on (spec › Assumptions). Each runs on a duplicate
comp, then resets the original and checks it with a strict compare (quickstart › Before any live
step). Read-only scripts except where a plant is named.

- [x] T001 (skill-builder, AE) **Erroring expression (E4).** On a duplicate of Comp 1, plant by
  script an expression that errors (a reference to a layer name that doesn't exist) on a transform
  and on an effect property. Read `expressionEnabled`, `expressionError`, `valueAtTime(t, false)` and
  `valueAtTime(t, true)` at two times. Answer: does AE 27.0 keep it on, and what value does it give?
  Script in `mentor/dev/live-015/error-expression.jsx`. **Done 2026-11-14:** stays on; value is the
  base value (`expression-reads.md`).
- [x] T002 [P] (skill-builder, AE) **Random without a seed (E18).** On the same duplicate, plant
  `value + [random(10), 0]` and `wiggle(5, 20)`. Read each twice at one time across two snippet runs.
  Answer: does either change between reads at the same time? Script in
  `mentor/dev/live-015/random-expression.jsx`. **Done 2026-11-14:** no change at one time; `wiggle`
  moves when the layer's index changes (new E28, FR-013a).
- [x] T003 [P] (skill-builder, AE) **Separated dimensions (E7).** Plant by script an expression on
  Position, then separate dimensions; then the reverse (expressions on X and Y, then join). Read
  `expression`, `expressionEnabled`, and whether the value follows the expression in each state.
  Answer: which property's expression is active. Script in `mentor/dev/live-015/separate-dims.jsx`.
  **Done 2026-11-14:** separating or joining clears the expression; the hidden-side state can't be made
  by script (E7 narrowed to "UI not tested").
- [x] T004 (skill-builder, no AE) **Find AB turn f's cause (research R6).** Build a fixture shaped
  like turn f from `mentor/test/fixtures/ask/comp1-snapshot.json` (Shake Control's samples at two
  playhead times; derive, don't hand-write values; take the session's saved tool replies too if the
  cockpit can provide them read-only) and run `anchor-check.mjs`'s `check` on it. Report which of
  R6's three candidates (or another) gives "Shake Control moved". Add the failing test as
  `mentor/test/k2-turn-f.test.mjs` (marked todo until T022 to T025). **Done 2026-11-14:** a real
  Anchor Point edit on Shake Control (Pan Behind), by inference; the failure was the wording (spec
  Amendment 1, research R6).
- [x] T005 (skill-builder, AE; **builder's hands**) **Pan Behind on an expression-driven null
  (SB-2).** On a duplicate of Comp 1, the agent reads Shake Control's base Position, Anchor Point and
  rock.png's footprint at 0.6 s; the builder uses Pan Behind on Shake Control by hand; the agent reads
  again at 0.6 s. Answer: did the base value and anchor change together, and did the children stay
  still? **Also confirms turn f's likely action:** does Pan Behind take Shake Control when it's
  selected (session 2: it took Shake Control, which was both selected and under the cursor, so this
  can't tell the two rules apart; T034 tests it), and
  does its anchor change match T004's fitted
  (572, −114) px in kind? Script in `mentor/dev/live-015/pan-behind-read.jsx`. At the same sitting,
  run once as written the three scripts folded together after the live runs and not yet run:
  `separate-dims.jsx`, the renumber step in `random-expression.jsx`, and the edited
  `error-expression.jsx` (`expression-reads.md` › Still open). **Done 2026-11-14 (cockpit with the builder, `expression-reads.md` session 2): SB-2 and turn f confirmed by hand; Pan Behind took Shake Control (selected; whether selection or the cursor decides is T034's A/B test); the scripts reproduce T001 to T003; new: hidden dimension properties hold stale values.**
- [x] T006 (skill-builder, AE; **builder's hands** for the scrub check) **Time mapping (E22).** Read
  Mentor Practice's Icon. On a duplicate, plant by script four copies of a keyed precomp: start
  offset 0.5 s, stretch 50%, stretch −100%, and time remap with two remap keys. For two inner keys per
  copy, the agent computes the outer time from `startTime`, `stretch` and the remap values; the
  builder scrubs to each and confirms the key's pose shows there (by eye). Answer key saved as
  `mentor/test/fixtures/precomps/time-mapping-key.json`. Script in
  `mentor/dev/live-015/time-mapping.jsx`. **Done 2026-11-14 (cockpit with the builder, `expression-reads.md` session 2): all eight keys match AE and the builder's eye; negative stretch reports in > out; remap holds a range; count layers, not `usedIn`.**
- [x] T007 (cockpit) Log T001 to T006 in `discovery/usage-notes/expression-reads.md` (new): each
  question, the answer, and what it changes. **Done for T001 to T004 (session 1);** the cockpit adds
  T005 and T006 to the same note when they run.
- [x] T008 (spec-writer) Fold the answers into spec › Assumptions and Edge Cases (E4, E7, E18, E22),
  research R3, R5, R7 and R12, and data-model § 1 `active`. If an answer changes a requirement, stop
  and hand it back to the builder before T010. **Done 2026-11-14 for T001 to T004** (spec Amendment
  1; research R3, R5, R6, R7; data-model § 1 and § 5). T004 changed US3, SC-005 and added FR-013a,
  FR-014a and OQ-8, so it goes back to the builder before T022. T005 and T006's answers get a short
  second fold when they run. **Second fold done 2026-11-14 for T005 and T006** (spec Amendment 2: new
  FR-006a and E29; FR-023 to FR-025, SC-005 (a), SC-011, SC-012, E21 to E23 tightened; research R1,
  R6, R12; data-model § 1 and § 7). Nothing in it changes an approved decision.

**Checkpoint:** live facts logged; research matches them.

---

# Spec phase 1: Expressions (US1, US2, US3)

## Setup

- [x] T009 (cockpit) Cut the phase 1 skill-builder worktree from local `main` (not `origin/main`;
  CLAUDE.md next step 3) and name it `--shared-owner` for `mentor/**`. **Done 2026-11-14: `../wt-015-reads`, branch `015-reads-p1` from `71dc7c9`.**

## Foundational (blocks US1 to US3)

- [x] T010 (skill-builder) In `mentor/jsx/snapshot.jsx`, add the expressions pass (research R1, R2):
  top-level `expressions` (one entry per property with a non-empty expression, fields per data-model
  § 1: `layer`, `path`, `display_path`, `group`, `keys`, `enabled`, `active`, `error` "trimmed to
  300 characters", `text` "up to 20,000 characters", `text_length`, `text_cut`) and `expressions_read`.
  Walk every group; skip markers; each read in its own try. `active` follows T003's answer.
- [x] T011 [P] (skill-builder) In `mentor/jsx/snapshot.jsx`, add `layer_info[].effects`:
  `[{ name, match_name }]` for every effect, keyed or not (FR-007).
- [x] T012 (skill-builder) In `mentor/jsx/snapshot.jsx`, add `samples[].base` with only the
  properties that have an active, error-free transform expression, read with `valueAtTime(t, true)`
  at the sample's exact time (research R5; data-model § 1).
- [x] T013 (skill-builder) In `mentor/jsx/snapshot.jsx`, add `expression_sweeps`: a coarse sweep
  (24 times, every active, error-free transform expression) and a fine sweep for
  `ARGS.measure_layers` at `max(1 frame, duration / 240)`, giving `varies`, `max_offset`, `max_at`,
  `sampled_every` (research R9; contracts/snippets.md).
- [x] T014 (skill-builder) In `mentor/dev/capture.mjs` add `--measure <indexes>` and `--time` (prints
  elapsed ms); in `mentor/fixture.mjs` return saved sweeps and mark missing fine sweeps
  `not_read: fixture` (research R13). Tests in `mentor/test/fixture-sweeps.test.mjs`.
- [ ] T015 (skill-builder, AE) Capture fixtures into `mentor/test/fixtures/expressions/`: Comp 1
  (`--measure 25,26 --times 0.6`), Mentor Practice, Mentor Practice 2, Mentor Overlaps, and one
  duplicate comp with the planted cases from T001 and T002 (an erroring expression on a transform
  and on an effect property; a `wiggle` layer with a layer added above it, read before and after, E28)
  plus: a joined layer and a separated layer whose hidden half holds a different stale value (E29),
  a link to a guide layer, a link to a
  matte, a link by index and by `index - 1`, a `comp("…")` reference, a run-time name, a Source Text
  expression, a constant `value` expression on a parent (E19), and a comp with 30 expressions (for
  SC-007). Reset and strict-compare every original.
  **Partly done 2026-11-14:** every capture but Comp 1 (the builder's project was closed). Mentor Practice, Mentor
  Practice 2 and Mentor Overlaps (each also captured with `main`'s snippet: identical apart from read R2), and three
  planted comps from `mentor/dev/live-015/plant-t015.jsx`: 015 Rig (Comp 1's rig with Comp 1's own expression
  texts; playhead moved, Pan Behind's values and a base Position edit, each reset and strict-compared), 015 Planted
  (before and after a null renumbers its wiggle) and 015 Thirty. Comp 1 tests run on a shape derived from the
  committed live reads (`fixtures/expressions/comp1.mjs`) until `comp1.json` is captured.
- [x] T016 (skill-builder) **Easing unchanged (FR-021, SC-004).** Extend
  `mentor/test/analyze-unchanged.test.mjs` (or add `analyze-r2-unchanged.test.mjs`) so the easing
  findings on the new Mentor Practice and Mentor Practice 2 captures equal the committed baselines
  (`practice-findings-baseline.json`), and Comp 1 gives 0 keyframe-skill findings from Shake Control
  or the Sweep Center, in all five keyframe and timing analyses.

**Checkpoint:** snapshots carry the new fields; nothing existing changed.

## User Story 1: every expression, keyed or not (P1)

**Goal:** expression reads with state, text, builds-on, base and after values, and how much they move.
**Independent test:** SC-001 and SC-003 on the Comp 1 capture, E1 to E9 and E27 on the others.

- [x] T017 [US1] (skill-builder) Create `mentor/lib/expressions.mjs`: expression reads from the
  snapshot (data-model § 2), `is_source` = on, active and no error (FR-006), base and after values at
  a given time (FR-003), and `moves` from the sweeps or `not_read` (FR-004). Tests in
  `mentor/test/expressions-read.test.mjs`: SC-001's 3 expressions with text identical to
  `comp1-ground-truth.json`; SC-003's (960, 540) and (952.4, 542.5) within 0.1 px at 0.6 s; E1 to E4,
  E7, E9, E27; E29 (FR-006a: on T015's joined and separated layers, no expression, base value or sweep
  comes from the hidden half).
- [x] T018 [US1] (skill-builder) Add the builds-on classifier to `mentor/lib/expressions.mjs`
  (research R3: `builds_on`, `sets_own`, `cant_tell`, always `inferred: true`). Tests in
  `mentor/test/expressions-builds-on.test.mjs`: Comp 1 gives 2 `builds_on` and 1 `sets_own`; E5
  (`wiggle`, `loopOut`, `smooth`, `temporalWiggle` without `value`), E6 (`value` in a comment and in a
  string), `.value` on another property, cut text gives `cant_tell`.
- [x] T019 [US1] (skill-builder) Update `mentor/lib/motion-sources.mjs` (FR-005, data-model § 3):
  `read.expressions` "all" when the snapshot has `expressions`; per-layer `expressions` read;
  `moves_children` true for keys **or** a source transform expression whose sweep `varies`;
  `moves_by`; `static_as_read` only when expressions were read. Tests in
  `mentor/test/motion-sources.test.mjs`: rock.png's parent Shake Control `moves_by: "expression"`;
  E19's constant expression doesn't move children; an older snapshot keeps `"keyed_only"`.

## User Story 2: what links to a layer, and whether it shows (P1)

**Goal:** incoming links per layer, marked inferred, with whether the target renders.
**Independent test:** SC-002 on Comp 1; E10 to E16 on the planted captures and strings.

- [x] T020 [US2] (skill-builder) Add the reference finder to `mentor/lib/expressions.mjs` (research
  R4's table: name, index, `index ± N`, `thisLayer`, `parent`, unresolved, other comp; the referenced
  property when the chain is plain). Tests in `mentor/test/expressions-refs.test.mjs`: E10 (Comp 1's
  two "G Shakers" and "Y Fragments": topmost, `shared_name`), E11, E12, E13, E26 (string cases), and
  Sweep Center → Sweep Control's Position.
- [x] T021 [US2] (skill-builder) Add `links_in` and `target_renders` (FR-008 to FR-011; data-model
  § 2) using `mentor/lib/visibility.mjs` and in and out at the comp's time. Tests in
  `mentor/test/expressions-links.test.mjs`: SC-002 (exactly 1 link into Sweep Control, target
  `eye_off`; every other Comp 1 layer `status: "read"` with 0 links and `unresolved_in_comp: 0`); E14
  to E16; "no links" never said when `unresolved_in_comp > 0`.

## User Story 3: a check never calls expression motion the learner's edit (P1)

**Goal:** K2's two halves in every check with an other-changes list: (a) a real edit to a layer,
expression or not, is reported as the property that changed on that layer, with its side effect
attached; (b) expression motion (playhead, renumber) is never reported. Plus K3's `motion_from` in
pivot and null.
**Independent test:** SC-005 (a) to (d) through each check (spec, Amendment 1).

**Starts after the builder approves Amendment 1 and answers OQ-8.** Both done 2026-11-14 (OQ-8 as recommended).

- [x] T022 [US3] (skill-builder) Rewrite `mentor/test/k2-turn-f.test.mjs`'s third test (the todo for
  the old SC-005) to SC-005 (a): on `BASE` against `panBehindOnShakeControl(NOW, …)` with the fitted
  `pan_behind_fit`, `check` returns **exactly one** other change for Shake Control, its Anchor Point,
  carrying an `effect` whose `distance_px` and `direction` equal the saved reply's old moved entry
  (`turn-f-check-reply.json`), and `item5.moved_layers` has **no** Shake Control entry. Keep test 1
  (playhead only: no change, SC-005 b). Change test 2 to assert the same numbers through the new
  `effect` instead of the old moved entry, so it still proves T004's fit. The test stays failing
  until T023.
- [x] T023 [US3] (skill-builder) In `mentor/lib/anchor-check.mjs` (FR-012 to FR-014a; research R7;
  data-model § 5): (a) a changed property on a layer outside the focus becomes one entry per property
  with the footprint shift attached as `effect`, and no separate moved entry for that layer; (b)
  item 5's moved list, `rawChanged` and `otherChanges` compare `base` for properties with an active
  expression, so a footprint difference with no base difference on the layer or a parent is left out;
  add `expression_changed`. Tests in `mentor/test/anchor-check-k2.test.mjs`: SC-005 (b), (c) with the
  T015 renumber capture, (d) a planted base Position change reported as Position; no shared time gives
  `not_compared`. Makes T022 pass.
- [x] T024 [US3] (skill-builder) In `mentor/lib/null-parenting-check.mjs`, the same two halves:
  `value_changed` (OA-4) and the jump check compare `base` for expression-driven properties at the same
  frame; a real property change is one entry with its effect attached; `expression_toggled` becomes
  `expression_changed` (keep every existing test's meaning). Tests in
  `mentor/test/null-parenting-k2.test.mjs`: SC-005 (a) to (d), including **the learner's new null
  renumbering a `wiggle` layer below it gives no change on that layer** (FR-013a, E28).
- [x] T025 [P] [US3] (skill-builder) Replay SC-005 (a) to (d) through offset, key types and speed
  graph (`mentor/test/k2-replay-keyed.test.mjs`): (a) is reported as the anchor change (these checks
  compare keys, so expect a property entry, not a moved one), (b) and (c) give nothing, (d) is
  reported. Change `mentor/lib/offset-keys.mjs`, `mentor/lib/key-types.mjs` or
  `mentor/lib/speed-graph.mjs` only if a replay fails.
- [x] T026 [US3] (skill-builder) Add `motion_from` (data-model § 4) to the focus and candidate
  layers that `mentor/tools/transform-anchor.mjs` and `mentor/tools/null-parenting.mjs` return
  (FR-015, OQ-3: these two only). Tests in the existing `anchor-tools` and `null-parenting-tools`
  tests: rock.png gives `parents: [{ layer: "Shake Control", by: "expression" }]`. Don't edit any
  `SKILL.md`.

## Shared: the ask's read tool, honesty and privacy (US1 to US3)

- [x] T027 (skill-builder) Create `mentor/tools/comp-reads.mjs` with `describe_layers` per
  [contracts/describe-layers.md](contracts/describe-layers.md): `TOOLS` only, no `SKILLS`; summary and
  detail shapes; `NAME_SHARED`, `NOT_FOUND`, `DETAIL_NEEDS_LAYERS`; `read.precomps` always
  `not_read` in phase 1; caps "≤ 4 KB per layer", "≤ 12 KB" whole comp, text "cut at 1,500
  characters", detail "≤ 16 KB". Tests in `mentor/test/comp-reads.test.mjs`: SC-007 on Comp 1 and the
  30-expression capture; no expression text in any summary; read-only (no write snippet called).
- [x] T028 [P] (skill-builder) Honesty sweep, `mentor/test/not-read.test.mjs` (FR-018, SC-009): the
  committed `comp1-snapshot.json` (no `expressions`), a capture with an unresolved reference, an
  other-comp reference, and a fixture without fine sweeps: every reply and map says `not_read` or
  `cant_resolve`, never `none`, `[]` or `false` for a read that didn't run.
- [x] T029 [P] (skill-builder) FR-020 guard in `record_lesson` (`mentor/tools/common.mjs`): refuse a
  summary or `next` that contains 24 or more characters copied from any expression text or error in
  the session's last snapshot, with a new code (plain message, no field names). Tests in
  `mentor/test/record-expression-guard.test.mjs`. See OQ-7.
- [x] T030 (skill-builder) Run `cd mentor && npm test` and `node --test .claude/hooks/test/*.test.mjs`;
  all pass. Note the counts in the hand-back.

## Phase 1 gate

- [x] T031 (reviewer) Review the phase 1 branch against FR-001 to FR-021 and the Edge Cases rows
  E1 to E19, E27. **Done:** fix round M1, S1, S3 to S5, S7 and the small items in; the replay of 938
  tool calls across 253 cases changed only null case 42 (gains `effect`), before and after the fixes.
- [x] T032 (cockpit) Merge with `/merge-worktree` (shared owner named), between live sittings
  (CLAUDE.md: a `mentor/` merge needs a fresh session for live lessons). **Done 2026-11-16 (`a3300e3`):**
  mentor tests 1677 pass, 4 todo, 0 fail; hooks 39/39.
- [ ] T033 (skill-builder, AE) Live on `main`: SC-003's one live read of Shake Control at 0.6 s, and
  SC-008's timing (`capture.mjs --time` on Comp 1 and Mentor Practice, with and without the new
  passes; ≤ 0.5 s added). If over, drop the fine sweep to 120 samples (research R9) and re-measure.
  **Comp 1 half done 2026-11-16 (cockpit):** SC-003 live ✓ (base 960, 540; after 952.352, 542.492 at 0.6 s;
  rock.png's source is Shake Control by expression). SC-008 on Comp 1 ✓: about 165 ms before the merge,
  about 210 ms after (+45 ms, wall clock, 3 runs each), fine sweep adds nothing measurable. The T015 Comp 1
  capture (merged `1499819`) found three faults the derived fixture hid, fixed there: AE 27.0 gives
  expression text with `\r` line ends, which made `strip()` read Shake Control's two as setting their own
  value; SC-001's compare; the whole-comp summary at 12.4 KB (now 10.5 KB, no cap change). **Open:** Mentor
  Practice's timing; `contracts/describe-layers.md` should say a child's parent entry omits `moves` when the
  parent is in the same reply (spec-writer, with T040); an eval case where the learner asks about Shake
  Control's shake and hears it builds on the null's own Position (eval-engineer).
- [ ] T034 (skill-builder reads, **builder's hands**) SC-010: 10 spot checks of the read's facts in AE
  across Comp 1 and the T001 and T015 planted copies, including one off and one erroring expression; at
  least 9 of 10 agree. Logged by the cockpit in `discovery/usage-notes/expression-reads.md`. **Plus the
  Pan Behind A/B test** (T005 couldn't separate the rules): select layer A, use Pan Behind with the
  cursor over layer B, and read which anchor moved. It decides the pivot `SKILL.md` "wrong layer" lines,
  frozen until then.
- [x] T035 [P] (eval-engineer) Add the K2 cases from spec › Eval plan (five rows, Amendment 1: turn
  f's real edit named by cause; expression motion; a renumbered `wiggle`) to `product/evals/anchor/`,
  `product/evals/null-parenting/` and `product/evals/offset/` (or key types), with fixtures derived
  from the T015 Comp 1 capture. Case numbers from the cockpit. **Also:** pivot and null cases on new
  captures where the check's reply carries `motion_from` (an edit reported by its cause, FR-014a), since
  the replay's existing fixtures predate it.
  **Done 2026-11-16 (`da09e60`, merged `73a6dee`):** pivot 55, 56, null 53, 54, offset 44, each 3/3 on B1
  (about $19 with two superseded drafts, both case bugs). Built on the live 015 Rig and Planted captures;
  three stand-ins to re-derive after T015 (marked in the READMEs). Pivot 57 and null 55 held: `motion_from`
  has no `SKILL.md` wording yet, so no case can pin how it's said (OQ-8 or spec 014).
- [ ] T036 (eval-engineer) Re-run all six sets on B1 at the merge commit, one set at a time: easing,
  key types, speed graph, offset, pivot, null. Each meets its SC-006 bar with every hard-rule check
  passing; T035's cases pass 3 of 3. Triage with `/eval-triage`; log in each README (SC-006).
- [x] T037 [P] (eval-engineer) Free A checks (`decisions/011` steps 1 and 2):
  `product/evals/lib/ready-for-a.mjs` and `--runtime a --dry-run` on all six sets. Paid A runs wait
  for spec 014's ship step.
  **Done 2026-11-16 (no commit):** all six ready; A dry runs valid (easing 33, key types 36, speed graph 37,
  offset 44, pivot 61, null 54 cases); settings hash unchanged at `3acbda26`. The hash covers the helper's
  settings, not `mentor/`, so it doesn't make the old A results reusable: phase 1 changed what every
  skill's tools return, and the new cases have never run on A. All six need a fresh A run at 014's ship step.
- [x] T038 [P] (curriculum-designer) CD-1 in `specs/014-ask-mentor/teaching-design.md`: update Q8 and
  the § 13 precomps row for phase 2, and say whether § 5.1's "in order of visible effect" needs a
  "too small to see" threshold. **Start only after the other session's uncommitted edits to that
  file are committed.**
  **CD-1 done 2026-11-16: 014 TD § 5.1a (proposed 1 px "too small to see" threshold, builder's H-7), § 5.5 (answers once inside a precomp is read), Q8 and § 13 updated; also `motion_from` wording in 011 TD § 21 and 012 TD § 17 (unblocks pivot 57, null 55).**
- [x] T039 [P] (curriculum-designer) CD-2: the wording that replaces easing's "I can't see inside these
  yet" once phase 2 lands, in the easing teaching design (`specs/002-easing-slice/` or curriculum
  § 6, skill 0). Design only; the `SKILL.md` change is a later skill-builder task.
  **CD-2 done 2026-11-16: curriculum § 6 skill 0, wording per precomp read state; the not-read line kept word for word.**
- [ ] T040 (spec-writer) Fold T033 to T039's results into the spec (status, any SC amendments) and
  hand the cockpit a CLAUDE.md note. **Phase 1 is shippable here** (to spec 014).

### Phase 1 follow-ups (Amendment 4, builder decisions 2026-11-16)

Numbered after phase 2's T041 to T056 so nothing renumbers. They don't block phase 2 except as noted.

- [x] T057 (skill-builder) OQ-9 as answered: the session baseline keeps expression text and errors
  during a lesson for `copiesExpression` (`mentor/tools/common.mjs`), and blanks them once the
  lesson's record is saved or a new lesson replaces the baseline; `calls.jsonl` logs a refused
  `record_lesson` call without the refused text. Tests for both blanking paths, a guard refusal across
  two fresh servers (B1), and a log line with no refused text. **In progress on branch `015-oq9`.**
  Before T040.
  **Done 2026-11-16 (`f7fe578`, merged `4ce9bec`; mentor 1705 pass, 0 fail):** text cleared at the pass save
  and for other passed lessons when one starts (SHA-256 kept, so "text changed" still works); refused calls
  logged without the copied fields. Open: an abandoned unpassed lesson keeps its text until the next start
  on that skill and comp (uninstall removes it); `UNSAFE_RECORD` refusals still log their arguments (one-line
  fix with the same `omitFromLog`, not yet asked for).
- [ ] T058 (skill-builder) The `motion_from` wording in `.claude/skills/anchor-mentor/SKILL.md` and
  `.claude/skills/null-parenting-mentor/SKILL.md`, from `specs/011-anchor/teaching-design.md` § 21 and
  `specs/012-null-parenting/teaching-design.md` § 17 (OQ-8, widened). Wording only; leave the Pan
  Behind "wrong layer" lines alone until T034. Take example sentences from the Pass lines, not
  invented ones.
- [ ] T059 (eval-engineer) After T058: pivot 57 and null 55 from those sections' Pass lines (held
  since T035), plus one case where the learner asks about Shake Control's shake and the mentor says
  it builds on the null's own Position (never "sets its own value"; E30), on the live T015 Comp 1
  capture with its `\r` text. Case numbers from the cockpit. Each 3/3 on B1; the pivot and null sets
  still meet SC-006 (T036's bar).
- [ ] T060 (spec-writer) Record in the spec and hand to spec 014: the 1 px "too small to see" floor
  (014 TD § 5.1a, H-7) is approved; the "hard to tell apart" band is deferred until after spec 014's
  three sessions. Fold with T040.

**Checkpoint:** spec 014 can build on phase 1.

---

# Spec phase 2: Inside precomps (US4, P2)

**Starts after T040.** Goal: the same reads inside precomps, by comp id, with time mapping.
**Independent test:** SC-011 to SC-013 on Comp 1's project, Icon and T006's planted copies.

## Setup

- [ ] T041 (cockpit) Cut the phase 2 skill-builder worktree from local `main`, `--shared-owner` for
  `mentor/**`.
- [ ] T042 (skill-builder, AE) Ground truth for Comp 1's inner comps (read-only script
  `mentor/dev/live-015/comp1-contents-truth.jsx`) into
  `mentor/test/fixtures/ask/comp1-contents-ground-truth.json`: every comp by id, places used, inner
  layers and keyed properties with key times (expected 347 on 123), expressions inside (expected 0),
  and whether any key sits after the 5 s the outer comp shows.

## User Story 4: inside precomps (P2)

- [ ] T043 [US4] (skill-builder) Create `mentor/jsx/precomp-contents.jsx` (research R12;
  contracts/snippets.md): recursion by comp id with a memo, `max_depth` default 5, an id stack for
  loops, places used counted as **layers** in each comp `usedIn` lists (FR-023), per-layer R1 fields
  with in and out points as AE reports them (in after out on a negative stretch), keyed properties as
  path, count and times, skipping the hidden half of a separable Position (FR-006a), the expression
  inventory, and remap values per outer frame (cap 600, `remap_cut`). No `sourceTime()`: it's
  expression-only (research R12).
- [ ] T044 [US4] (skill-builder) Add `--contents <file>` to `mentor/dev/capture.mjs` and the fixture
  twin `mentor/fixture/precomp-contents.mjs` (state file key `contents`; `not_read: fixture` without
  it). Tests in `mentor/test/fixture-precomp.test.mjs`.
- [ ] T045 [US4] (skill-builder, AE) Capture into `mentor/test/fixtures/precomps/`: Comp 1's project,
  Mentor Practice (Icon), and T006's four copies, re-planted with `mentor/dev/live-015/time-mapping.jsx`
  (the T006 comp was deleted) and deleted again after, plus a 7-deep nest (for the depth limit).
- [ ] T046 [US4] (skill-builder) Create `mentor/lib/precomp-time.mjs`: start, stretch (including
  negative, per T006) and remap mapping, compounding through nests (FR-024), each key as ranges
  `{ first, last, frames }`. Tests in `mentor/test/precomp-time.test.mjs`: SC-012, all 8 keys of
  `time-mapping-key.json` within half an outer frame, copy D's two keys as ranges matching
  `outer_first`, `outer_last` and `frames` (16 and 165).
- [ ] T047 [US4] (skill-builder) Keys never shown (FR-025, E23) in `mentor/lib/precomp-time.mjs`,
  using the span `[min(in, out), max(in, out))`. Tests: copy C's inner 0 (lands on the upper end) is
  never shown and its inner 1 is; Comp 1's 30 s precomps against T042's ground truth.
- [ ] T048 [P] [US4] (skill-builder) Tests in `mentor/test/precomp-read.test.mjs`: SC-011 (20 precomp
  layers; 347 and 123; 353/321 and 242/131 told apart by id; places used), E21 (Icon Precomp's places
  used is 4 layers, not 3 comps), E24 (Collapse
  reported), E25 (7-deep nest gives `too_deep` past 5; a loop fixture built by editing a capture's ids
  in the test, since AE prevents one).
- [ ] T049 [US4] (skill-builder) Phase 2 in `describe_layers` (`mentor/tools/comp-reads.mjs`):
  `comp_id` input, `COMP_NOT_FOUND`, per-precomp summary (FR-027), detail per inner comp,
  `read.precomps`. Tests in `mentor/test/comp-reads.test.mjs`: the 20-layer precomp summary ≤ 12 KB
  (SC-013's size half).
- [ ] T050 [US4] (skill-builder) `precomp_contents` in `mentor/lib/motion-sources.mjs` reads
  "read" only when contents are passed in; skill snapshots never pass them (FR-028). Test
  `mentor/test/skill-outputs-unchanged.test.mjs`: every skill tool's reply on every eval fixture is
  byte-identical before and after phase 2, and the easing findings are identical (SC-004).
- [ ] T051 (skill-builder) Run the mentor and hooks suites; all pass.

## Phase 2 gate

- [ ] T052 (reviewer) Review the phase 2 branch against FR-022 to FR-028 and E20 to E26.
- [ ] T053 (cockpit, then skill-builder, AE) Merge with `/merge-worktree`; then live SC-013 timing
  (`capture.mjs --contents --time` on Comp 1's project: ≤ 1.5 s).
- [ ] T054 (skill-builder reads, **builder's hands**) Five spot checks inside Comp 1's precomps and
  one time-mapped case in AE; logged by the cockpit in the usage note.
- [ ] T055 (eval-engineer) Eval gate for phase 2, per OQ-6: either all six sets on B1 (SC-006 as
  written) or, if the builder accepts OQ-6, T050's byte-identical test stands in and only a
  `--dry-run` per set runs.
- [ ] T056 (spec-writer) Close the spec: status, amendments from T053 to T055, and a CLAUDE.md note
  for the cockpit.

---

## Dependencies and order

- **Phase 0 before phase 1 code:** T001 and T003 fed T010 (`active` = on and no error); T002 added
  E28 to T015, T023 and T024; T004 reshaped T022 to T025, which wait on the builder's approval of
  Amendment 1 and OQ-8. T005 confirms turn f's action and SB-2 (feeds T023's planted edit); T006 feeds
  T046.
- **Inside phase 1:** T010 → T012 → T013 → T014 → T015 → everything after. T016 right after T015.
  US1 (T017 to T019) → US2 (T020, T021, which use T017's reads) and US3 (T022 to T026, which use
  T017 and T019). T027 needs T017 to T021. T028 and T029 any time after T017.
- **Gate:** T030 → T031 → T032 → T033, T034, T035 to T039 (T035, T037, T038, T039 in parallel; T036
  after T035) → T040. T057 before T040; T058 → T059 (T059 after T036's run or folded into it); T060
  with T040.
- **Phase 2:** after T040. T042 and T043 can start together; T044 → T045 → T046 to T050 → T051 →
  gate.

### Critical path

T004 → (T001, T003) → T010 → T012 → T013 → T014 → T015 → T017 → T019 → T022 → T023 → T027 → T030 →
T031 → T032 → T035 → T036 → T040. Phase 1 ships at T040. The AE tasks (T001, T003, T005, T006, T015,
T033, T034) are serial because of the one-driver rule, and T005, T006, T034 wait on the builder.

### Parallel examples

- Phase 0: T004 (no AE) runs while one AE task runs; the AE tasks run one after another.
- Phase 1 gate: T035, T037, T038 and T039 together (different owners and files).
- Phase 2: T042 (AE) while T043 is written.

## Implementation strategy

1. **MVP = spec phase 1** (US1 to US3 plus `describe_layers`). It's what spec 014's ask mode needs
   (TD 014 § 8). US1 alone is not shippable: without US3 the six skills would still blame the
   learner, and the ask mode needs US2's links for AB 1.
2. Phase 2 follows when phase 1's gate passes, and doesn't block spec 014's first version (the
   answer says "I couldn't see inside [precomp]" until then).

**Task count:** 60 (Phase 0: 8; spec phase 1: 32, of which US1 3, US2 2, US3 5; spec phase 2: 16, of
which US4 8; phase 1 follow-ups T057 to T060: 4, added 2026-11-16).
