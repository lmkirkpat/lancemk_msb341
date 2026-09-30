# Quickstart: Validate the Easing Test Slice

**Spec**: [spec.md](spec.md) | **Tools**: [contracts/mentor-tools.md](contracts/mentor-tools.md)

Runs the slice end to end and checks it against the spec's success criteria. Commands run from
the repo root.

## Prerequisites

- macOS, After Effects 26.4+, Node 18+, Claude Code signed in
- The upstream bridge still installed (used once, to build the practice comp)

## 1. Install the mentor bridge

```bash
bash bridge/install.sh        # installs the forked panel (com.aementor.bridge); restart AE after
node bridge/scripts/doctor.mjs  # expect: panel found, bridge.json present, /health OK
```

Expected: both "Claude Bridge" (upstream) and "AE Mentor Bridge" appear under
Window > Extensions, and doctor reports OK.

## 2. Unit tests (no AE needed)

```bash
node --test mentor/test/
```

Expected: all pass, covering linear/eased/held detection, the expression and single-key skips,
demo attribution, the one-demo rule, and learner-record privacy rejection.

## 3. Build the practice comp (once)

Open `discovery/Claude AE Tutor Test.aep` and run `mentor/dev/build-practice-comp.jsx` through
the upstream bridge (research R8). It creates **Mentor Practice**, a 10-layer lower third with
11 linear pairs and the traps listed in R8, and writes the answer key to
`mentor/test/fixtures/practice-expected.json`. Save the project. The original comp stays as-is
for the "nothing to ease" case.

Check the answer key against the comp once by eye in the Graph Editor before trusting it.

## 4. Live lesson (User Story 1)

In Claude Code: `/ease-mentor`. With "Mentor Practice" active:

| Step | You do | Expect |
|---|---|---|
| a | Start | The mentor opens with a short summary (11 pairs across 6 layers) and **proposes a focus** (for example, Title) instead of listing all 11. No flags on Subtitle › Position, Cursor, or Logo. It mentions the hidden Old Take layer and that it can't see inside Icon (SC-001, edge cases) |
| b | Listen | An explanation tied to your layers, with at least one frame from your comp (FR-004) |
| c | Say "show me" | It eases **only** Title › Position, first pair, and tells you what changed and that Edit > Undo reverses it |
| d | Say "do the rest for me" | It declines and explains why (US1-5). Nothing else in the project changes |
| e | Ease 2 of the 3 remaining Title pairs (for example, skip Scale), say "done" | Reports 2 eased by you, Title › Scale still linear, credits the demo pair to itself, and gives a hint without fixing it (US1-4, US1-6) |
| f | Ease Title › Scale, say "done" | Pass for the Title focus. The lesson is recorded, and the mentor may suggest the next focus |
| g | *(Optional, limits)* Ask "what about the rest?" | It picks a next focus without re-teaching basics, and handles Bar's separated X Position and Trim Paths by name |

Time steps a–f; SC-002 target is 15 minutes or less. Check the result against the Graph Editor
yourself for SC-003.

## 5. Memory (User Story 2)

```bash
cat "$HOME/Library/Application Support/AEMentor/learner.json"
```

Expected: one lesson entry, readable without tools, with no name, email, or phone (US2-1,
US2-4). **At least one day later**, run `/ease-mentor` again. Expect it to mention the earlier
lesson in its opening and review or advance instead of re-teaching (SC-005).

## 6. Evals (User Story 3)

```bash
node product/evals/easing/run.mjs              # full run: all cases, once (required before committing skill/tool changes)
node product/evals/easing/run.mjs --changed    # dev loop: only cases whose inputs changed since the last pass
node product/evals/easing/run.mjs --only FR-006  # one behavior
node product/evals/easing/run.mjs --repeat 3   # flakiness check
```

Expected: at least 10 cases, pass or fail per case with reasons, a summary line, and results
saved under `product/evals/easing/results/<date>.json` for comparing runs. Target: 80% or more
pass (SC-006).

## 7. Edge cases (spot check)

- Close AE, then `/ease-mentor`: the mentor says it can't see the project and makes no claims
  (FR-009).
- Switch comps between "try it" and "done": the mentor notices and re-snapshots.

## 8. Usage notes (SC-007)

After three or more sessions, add a note to `discovery/` on whether you reached for this or
Adobe's assistant while learning easing, and why.
