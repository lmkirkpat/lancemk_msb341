# Quickstart: checking spec 014

How to prove each phase works. Shapes are in [data-model.md](data-model.md) and [contracts/](contracts/);
this file is only the run guide.

## Before any live step

- One AE driver at a time: run `ae_status`, and check `.git/knack-agents/ae.lock.json` has no other holder
  in the last 10 minutes (CLAUDE.md).
- The panel is linked to the main checkout: merge `panel/` only between sittings; a `mentor/` merge needs a
  fresh session (MCP servers survive `/clear`) and an AE restart for the panel.
- Live reads on Comp 1 are read-only; the original is never changed. Save a Copy for a restore goes outside
  the repo.

## Unit tests (no AE)

```
cd mentor && npm test
node --test panel/test/*.test.js
cd panel/helper && npm ci && npm test        # after a fresh checkout, npm ci first
node --test .claude/hooks/test/*.test.mjs
```

Phase 1 is done in code when `ask-tools`, `ask-answer`, `runtime-flag` and the panel's ask tests pass with
every existing suite unchanged.

## Phase 1 (B1)

1. Evals: `node product/evals/ask/run.mjs --dry-run`, then `node product/evals/ask/run.mjs` (B1). Expect
   SC-006's bar on the phase 1 cases; `--only 01 --repeat 3` for each of AB's held cases (situations 1, 4, 5).
2. Live smoke in the panel (B1, Comp 1 open): ask "make the rock shake from where the hammer hits, not the
   center". Expect: the first line names Comp 1; the steps are on Shake Control, hit sizes first; Steps
   drawn from data; Your steps folded; **no Go deeper** (B1). Ask "what does the sweep control layer do?":
   no Steps, no dock.
3. No comp: close every comp viewer; Ask on Home stays available, and asking gets "No comp open. Open one, or
   click into its timeline." (`ask-nocomp`). Then reopen the comp, click a footage item in the Project panel
   and ask again: the same line, and clicking into the timeline fixes it (FR-047 withdrawn 2026-11-16, T001).
4. `node panel/dev/turns.js --ask --last 4`: the ask turns, first sign ≤ 10 s.

## Phase 2 (B1, then A in the ship step)

1. `node product/evals/anchor/run.mjs`, `node product/evals/null-parenting/run.mjs`,
   `node product/evals/next-mentor/run.mjs`, `node product/evals/ask/run.mjs` on B1, one at a time.
2. On A only (ship step): situation 16, `node product/evals/ask/run.mjs --runtime a --only 16 --repeat 3`.

## Phase 3 (B1)

All six sets, next-mentor and ask, one at a time. SC-008: `cd mentor && node --test test/asked-record.test.mjs`.

## Ship step (A, `decisions/011`)

1. Free: `node product/evals/lib/ready-for-a.mjs` and `--runtime a --dry-run` on ask, anchor,
   null-parenting and next-mentor.
2. Paid, on the builder's go: `node product/evals/ask/run.mjs --runtime a` (key from the Keychain,
   spec 013 quickstart step 3). Compare with the B1 baseline (spec 013 FR-033).
3. `bash panel/install.sh --runtime a`, restart AE, open one of your own comps (not a demo comp).
4. Each session: ask what you actually want; follow the steps; go deeper at least once if it helps; say
   how it went. The cockpit logs the question, the steps (followed without asking, or not), the layer named
   against a look in AE, and the go-deeper in `discovery/usage-notes/ask-sessions.md`.
5. After each: `node panel/dev/turns.js --ask` for SC-004 and SC-005.
6. Fit (SC-012): every new ask state at the default dock (about 343 pt), at spec 007 SC-010's heights; then
   `ask-answer`, `ask-steps-open` and `ask-deeper-lesson` at 260 × 480 once, logged (OQ-4).
