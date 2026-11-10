# Quickstart: checking diagnosis works

How the builder and the agents check spec 005, from free checks to live ones. Details of what each
check expects are in [contracts/](contracts/) and [data-model.md](data-model.md); task IDs are
[tasks.md](tasks.md)'s.

## 1. Without After Effects (free)

```bash
cd mentor && npm test                                   # includes diagnosis-*.test.mjs
node product/evals/diagnosis/run.mjs --dry-run          # the set's cases parse and fixtures load
node product/evals/lib/ready-for-a.mjs diagnose-mentor  # name, allowed-tools and runner agree (decisions/011 step 1)
```

Expected:

- Every DX kind's answer-key test passes on its live capture, and every overlap row's test passes
  (SC-001: 100% of the key's findings, 0 the key marks false, on 6 or more snapshots).
- `diagnosis-readonly.test.mjs`: the tool file calls no write snippet.
- `diagnosis-catalogue.test.mjs`: the catalogue matches `teaching-design.md` and `path.json`.
- Existing mentor tests unchanged in count except the new files (the shared edits add tests, they
  don't change old ones).

Only run the suite or the runners when no eval batch is using the main checkout.

## 2. Evals on B1 (subscription, no credit)

```bash
node product/evals/diagnosis/run.mjs                    # SC-006: ≥ 80%, every hard-rule check passing
node product/evals/easing/run.mjs                       # within one case of 27/28, no hard-rule failure
```

The hand-over cases are A-only and are skipped on B1 (the runner's `runtimes` field).

## 3. Live, in After Effects (🖐, one sitting at a time)

Before: `ae_status`, and `.git/knack-agents/ae.lock.json` has no other holder from the last 10 minutes.
Save a Copy of the practice project outside the repo first.

1. Run `mentor/dev/build-diagnosis-comps.jsx` (it builds Diagnosis Practice, Diagnosis Clean and
   Diagnosis Precomps, and touches no other comp). Make Diagnosis Practice the active comp.
2. In a fresh Claude Code session in this repo: "why does my comp look mechanical?"
   - At most 3 findings up front, each with a layer, property and time; one to start with and why;
     how many more; Icon named as not looked inside (US1 › 1, 4).
   - Compare with an inspection in AE: the findings match (SC-002: 6 of Adobe's 8 after US1, 8 of 8
     after US4, plus the linear pairs).
   - Time from asking to the first finding, from the call log (`calls.jsonl`) and the clock: ≤ 30 s
     (SC-004).
3. "Show me the rest": every other finding, none of the first three repeated (US1 › 2).
4. Pick Bar's jolt (no skill yet): hints only, no change. Ease the middle key yourself and say "done":
   gone, plus what's still open, matching AE (US2 › 2, 3; SC-007). Undo it and say "done" again: back.
5. "Just fix all of it": declined in one sentence, no offer to do it later, the next finding named
   (US2 › 4).
6. Pick the linear pairs: the offer names *Easing* on the finding's layers. On A it hands over and the
   easing lesson opens with its own rules. On B1 it stops at the offer (US2 › 1).
7. The project is unchanged by diagnosis: strict compare of a capture before step 2 and after step 5,
   apart from your own fix (SC-003).
8. Switch to Diagnosis Clean and ask again: nothing invented, what it can't see named (US1 › 5).

Log it with `/usage-session` in `discovery/usage-notes/diagnosis.md`.

## 4. Memory (US3, after spec Q1)

Diagnose Diagnosis Practice, fix one finding, end the session. In a new session on the same comp:
the opening re-reads, names what's still open, calls the fixed one fixed (SC-008). Open
`learner.json`: a `diagnoses` entry with IDs, names, times and states only, and `skills` unchanged.

## 5. On A (`decisions/011`)

```bash
node product/evals/diagnosis/run.mjs --runtime a        # paid; against the B1 baseline (FR-033's bar)
bash panel/install.sh --runtime a                       # then one live diagnosis in the panel
```
