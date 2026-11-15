# Quickstart: checking spec 015's reads

How to prove each phase works. Shapes are in [data-model.md](data-model.md) and
[contracts/](contracts/); this file is only the run guide.

## Before any live step

- One AE driver at a time: run `ae_status`, and check `.git/knack-agents/ae.lock.json` has no other
  holder in the last 10 minutes (CLAUDE.md).
- Planted cases go on duplicates; the original comp is reset and checked with a strict compare
  (`capture.mjs --compare` skips `layer_info`, so compare the full JSON).
- `mentor/dev/capture.mjs` captures the **active** comp: check the name it prints.
- Save a Copy for a restore goes outside the repo.

## Unit tests (no AE)

```
cd mentor && npm test
node --test .claude/hooks/test/*.test.mjs
```

Phase 1 is done in code when the new tests for FR-001 to FR-021 pass with the existing suite
unchanged, including the easing-unchanged tests (SC-004).

## Phase 1 live checks

1. Open Comp 1 (saved copy, AE 27.0). Capture with sweeps for Shake Control and Sweep Control:
   `node mentor/dev/capture.mjs mentor/test/fixtures/expressions/comp1.json --measure 25,26 --times 0.6 --time`
   Expect: 3 expressions; Shake Control Position base (960, 540), after about (952.4, 542.5) at 0.6 s
   (SC-001, SC-003); the printed time shows the added cost (SC-008: ≤ 0.5 s over a capture without
   the new passes).
2. Same on Mentor Practice (SC-008, and the fixture for SC-004's live half).
3. Spot checks in AE by the builder (SC-010): 10 facts from the read, at least one off and one error
   expression (from the Phase 0 planted copies), logged in the usage note.

## Phase 1 eval gate (eval-engineer)

- All six sets on B1 at the merge commit: `node product/evals/<set>/run.mjs` (see each README).
  Bar: SC-006 in each set's README, every hard-rule check passing.
- The new K2 cases 3/3 each (`--only <case> --repeat 3`).
- Free A check: `--runtime a --dry-run` on each set (decision 011 step 2).

## Phase 2 live checks

1. Comp 1: `node mentor/dev/capture.mjs mentor/test/fixtures/precomps/comp1.json --contents mentor/test/fixtures/precomps/comp1-contents.json --time`
   Expect: 20 precomp layers read, 347 keyed properties on 123 inner layers (SC-011), ≤ 1.5 s
   (SC-013).
2. Mentor Practice (Icon) and the planted time-mapping copies from Phase 0: mapped key times within
   half a frame of the Phase 0 answer key (SC-012).
