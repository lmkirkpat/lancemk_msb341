---
description: "Task list for spec 012 amendment 1: the L-6 group-and-crowd proposal rule"
---

# Tasks: spec 012 amendment 1, the L-6 proposal rule (skill 6)

**Status**: Approved 2026-10-25 with the spec's amendment 1. Not started.

**Why a second file**: `tasks.md` (T301 to T343) is ticked on branch `skill-6-null`; editing it on
main would conflict at the merge. These tasks run on the same branch, after 5c9de8c, and before
Phase 9's sitting (T336).

**Input**: [spec.md](spec.md) amendment 1 (FR-003, FR-004, FR-005, FR-005a, FR-024, L-6, SC-001,
Eval plan 1, 19, 20, Open questions › H-6), [data-model.md](data-model.md) (Candidate `kind`,
Analyzer result `next_proposal` and `no_proposal_reason`, Snapshot reply),
[contracts/tools.md](contracts/tools.md), [research.md](research.md) › R2 and R9. What is taught:
[teaching-design.md](teaching-design.md) § 4, § 5 stage 1, § 11 and § 15 ("TD §", read only).

**Add-only still holds**: every file below is one the branch added (tasks.md › Add-only table), so
`check-branch.mjs <branch> skill-builder main` without `--shared-owner` stays clean. No shared
file changes: `mentor/lib/recommend.mjs` and next-mentor's prompt are spec › H-6's request, not a
task here.

**Tests**: written first; each must fail before T356 and T357 and pass after.

## Phase A: tests first

- [x] T350 In `mentor/test/null-parenting-proposal.test.mjs`, replace the test "the largest group
  wins; a tie goes to the highest top layer; past 4 the first 4 in stack order that still link"
  with the FR-005 rule, on synthetic comps (`comp()` helper, kinds set per layer):
  - the 6-layer chain (E, A, B, C, D, F) is a **crowd**: `proposal` and `next_proposal` `null`,
    `no_proposal_reason: "crowded"`, and no 4 of it proposed (the old "past 4" answer must not
    appear);
  - a cluster of exactly 4 is a group and of 5 a crowd; a matte pair counts as 2 (a matte pair
    linked to 3 layers is a crowd), and is never split;
  - a lone layer is neither; a lone matte pair is a group of 2;
  - ranking, each step on its own: (a) a 2-layer group with a `text` layer and a `shape` beats a
    4-layer all-shape group; a group of only text layers doesn't count as (a); (b) then more
    layers; (c) then the higher top layer;
  - `next_proposal` is the second-ranked group, `null` with one group;
  - nothing links: `no_group`; the 2% boundary test stays as it is.
- [x] T351 Make the L-6 todo a real test (drop `{ todo }`): on `stand-in/practice2b-with-wave-a.json`,
  `proposal` is Tile, Caption, Stamp, `next_proposal` is Chip A, Chip B, Chip C, and no layer of
  wave A's 13-layer crowd is in `proposal`, `next_proposal` or `left_out`. Update `answer-key.json`:
  that fixture's entry gets `proposal`, `next_proposal` and `crowd: 13` (the note and `l6_expected`
  go); `practice2b.json` gets `next_proposal` as the stand-in computes it (TD § 15 expects Row A to
  C) and keeps `review_proposal_after_group`. Worked by hand in TD § 15's table; if the code's
  answer differs, stop and hand back (it's a rule question for the designer, not a test edit)
- [x] T352 Add `mentor/test/fixtures/null-parenting/synthetic/crowd-only.json` (marked synthetic in
  the README): 6 proposable layers that chain within 2% and nothing else proposable. Tests:
  analyzer `proposal` `null`, `next_proposal` `null`, `no_proposal_reason: "crowded"`, `left_out`
  without them; a learner-named focus of 3 of them still sets the focus; `null_parent_snapshot`
  in review mode gives `no_demo_reason: "no_new_target"` (TD § 11)
- [x] T353 Finder (FR-003, L6-2), in the proposal tests: on `crowd-only.json`, `finder(s)` is
  `{ count: 6, layers: [] }`, and `finder(s, { exclude: [<any past target>] })` is `{ count: 0 }`;
  on a group comp it's still the proposal's size and names. Rewrite "the finder agrees with the
  proposal on every fixture, with the same exclude" to assert agreement everywhere except the
  crowd-with-empty-exclude case, which it asserts separately. `candidates()` entries carry `kind`
  equal to `layer_info.kind` (data-model › Candidate)
- [x] T354 In `mentor/test/null-parenting-tools.test.mjs`:
  - the snapshot reply carries `next_proposal` and `no_proposal_reason`, and lists no crowd layer
    in any field; in review mode `next_proposal` is `null`;
  - **the second group after a "no"**: with no focus the reply's `proposal` is Tile, Caption,
    Stamp; a second call with `skill_options.focus` = the reply's `next_proposal` (Chip A to C)
    gives `focus_set: true` and a fresh baseline at that read, exactly as a proposal or a named
    focus would (FR-005a, FR-006);
  - **L6-1**: on the wave A stand-in with a record whose past targets are Tile, Caption and Stamp
    (and those three parented), review mode proposes Chip A to C; the existing "review: proposes
    Row A to C" test on `practice2b.json` stays.
- [x] T355 Close the three S6 codes no test asserts yet (data-model › Check result): `no_null`
  (no null in the comp, and a named null not found, with `named`), `not_parented` (one focus layer
  unparented while another is parented to the null), and the demo's `couldnt_check` (a second read
  that can't place the target: `moved_px` `null`, `jumped` false), in the check and demo tests

## Phase B: code

- [x] T356 `mentor/lib/null-parenting.mjs` (FR-004, FR-005, FR-003; research R2):
  - `candidates()` adds `kind` from `layer_info` (for every entry);
  - replace `proposal()`'s largest-group sort and "past 4" growth with one `clusters()` step: the
    same units and union-find, then each cluster is a group (2 to 4 layers, a matte pair as 2) or a
    crowd (5 or more); groups ranked (a) text plus another kind, (b) size, (c) lowest top index;
    returns `{ proposal, next_proposal, reason, crowd_size }`, with `reason` `crowded` or
    `no_group` when there's no group (`no_layer_info` and `no_comp_size` unchanged);
  - `analyze()` returns `next_proposal` and `no_proposal_reason` (with `crowded`); `notes` and
    `left_out` never name a crowd's layers;
  - `finder()` per FR-003: a group → its size and names; no group, a crowd and an empty
    `exclude` → `{ count: crowd_size, layers: [] }`; else 0. Update the file's header comment
    (the 2 to 4 "group" and 5+ "crowd" numbers are the skill's own, FR-002).
- [x] T357 `mentor/tools/null-parenting.mjs`: the snapshot reply adds `next_proposal` (`null` when
  `mode` is `review`), next to `no_proposal_reason`; the tool description says it proposes a group
  of 2 to 4 layers that sit together apart from the rest, or none when many layers crowd together.
  `FINDERS` stays `finder()`. `npm test` green with T350 to T355.

## Phase C: the skill prompt

- [x] T358 `.claude/skills/null-parenting-mentor/SKILL.md` step 1, "They don't know" (FR-005a,
  TD § 4 steps 4 and 5):
  - say `proposal` in one sentence **with its reason** ("Tile, Caption and Stamp sit together at
    the top right, apart from everything else. Want to move those as one?");
  - on a "no", offer `next_proposal` once ("Or Chip A, Chip B and Chip C?"); on a second "no", or
    with no `next_proposal`, ask them to name the layers. Never a third offer;
  - `no_proposal_reason` `crowded`: TD § 4 step 5's question in plain words ("A lot of your layers
    sit close together, so I can't tell which ones belong together. Which 2 to 4 should move as
    one?"), never naming or counting the crowd's layers; `no_group`: make a small group to practice
    on; `no_comp_size`: ask them to name the layers;
  - the left-out sentences stay about `left_out`'s reasons and never list a crowd.
  No field name or quoted value reaches the learner (server rule 5).
- [x] T359 `SKILL.md` › The review, step 2: `proposal` `null` (a crowd included) means nothing new
  to review, record nothing; a review never offers `next_proposal` (FR-024).
- [x] T360 Run `/agent-audit` on the changed parts of `SKILL.md` and fix what it finds in that file

## Phase D: hand back

- [x] T361 `cd mentor && npm test`; `node --test .claude/hooks/test/*.test.mjs`;
  `node .claude/hooks/check-branch.mjs <branch> skill-builder main` (no `--shared-owner`): still
  only the add-only table's files, all added (FR-001, SC-008)
- [ ] T362 Hand back: commit, test counts, T351's answer on the wave A stand-in (proposal,
  `next_proposal`, crowd size), and whether anything in TD § 15's table didn't hold

## What changes for `tasks.md`'s live tasks (read, not edited there)

- **T336 (L-6)** uses quickstart › 2's amended L-6 row: on Mentor Practice 2 as built, `proposal`
  Tile, Caption and Stamp, `next_proposal` Chip A to C, wave A's 13 layers a crowd. A different
  answer goes to the designer as a rule question; no layer in the practice comp is moved.
- **T340 (SC-001)** starts with no group in mind and logs whether the learner took the proposal,
  the second group or their own (L6-3).
- **T343 (SC-009)**: the live review is on **Chip A to C**, not Row A to C (L6-1).

## Hand-off note for HO-1 (eval engineer; case numbers from the cockpit)

Read with tasks.md › HO-1, after T338. From spec › Eval plan as amended:

- **Case 1** runs on Mentor Practice 2 as built (the wave A stand-in's layout until the live
  capture replaces it). Deterministic checks: Tile, Caption and Stamp named together before any
  focus is set; no layer of wave A's crowd (Blink, Spinner, Cut, Badge, Peg, Banner, Card, Dot 1,
  Dot 2, Dot 3, Door, Plaque, Sign) named by the mentor before the learner names it. Rubric: the
  reason is said (they sit together, apart from the rest), and the proposal comes only after the
  learner had no answer.
- **Case 19, second group:** a scripted learner says no twice. Deterministic: Chip A to C named
  once after the first no; no third group offered; after the second no the mentor asks for names.
- **Case 20, crowd only:** on T352's `crowd-only.json` (or the eval engineer's own fixture of the
  same shape). Deterministic: no `null_parent_snapshot` call with a focus the learner didn't give;
  no crowd layer named or counted in the mentor's text before the learner names one. Rubric: the
  plain-words "can't tell which belong together" question.
- **Reviews (cases 16 to 18)**: on the wave A layout the review's group is Chip A to C (L6-1); a
  crowd-only comp gets no review (the existing case 18 shape).

## Dependencies and order

- T350 to T355 first (they fail), then T356 → T357, then T358 to T360, then T361 → T362.
- All before `tasks.md`'s T336. T351 needs only the stand-in, not SR-4's live `comp.width`.

**Task count:** 13 (T350 to T362): tests 6, code 2, prompt 3, hand-back 2. No 🖐 task; the live
parts ride on T336, T340 and T343.
