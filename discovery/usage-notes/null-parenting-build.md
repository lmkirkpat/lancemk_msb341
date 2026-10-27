# Null parenting: build hand-back (spec 012, T342)

Written by the cockpit on 2026-10-26 (local) from T333's checks, re-run on the final branch before
the merge. The live lessons are in `null-parenting.md`. The sitting is in
`specs/012-null-parenting/live-sitting-2026-10-26.md`.

## Branch

`skill-6-null` at `0ac3edb`. Behind `main` only by spec 011 documents, `CLAUDE.md`, and the
`.aep` save (`2ebcadb` to `a4f1987`).

## T333's checks, re-run

| Check | Result |
|---|---|
| `cd mentor && npm test` | **955 pass, 0 fail**, 3 todo (958 tests). 686 at T301 on 2026-10-24 |
| `node --test .claude/hooks/test/*.test.mjs` | **37 pass, 0 fail** |
| `check-branch.mjs skill-6-null skill-builder main` | 84 files changed. Every `mentor/` and `.claude/` file is an **add**, all in the add-only table: two `lib` files, one `tools` file, one `jsx` file, one `fixture` file, six test files, the fixtures folder, and `SKILL.md`. The 7 files outside skill-builder's are spec 012's documents and `discovery/usage-notes/null-parenting.md`, written by their owners and the cockpit. The only existing files modified are spec 012's own documents. **No shared file is touched (SC-008)** |

Fixtures are live captures and spec 004's live reads, plus the permanent `synthetic/`. The
stand-ins were deleted at T338. One plant was added after T341, `slide-top-left.json`, for eval 30.

## L-1 to L-6

From the sitting: L-1 (Option or Shift while parenting both jump, so parent with no key held), L-2
(a plain pick whip under a scaled and turned null doesn't move the child), L-3 (the demo doesn't
jump and takes one undo; the Position pick whip, by hand), L-4 (auto-orient isn't in the rotation
read, so auto-oriented layers stay left out), L-5 (adding a null renumbers the layers below it), and
L-6 (the proposal on Mentor Practice 2 as built is Tile, Caption and Stamp, then Chip A to C). No
snippet fix was needed (L-3).

## Success criteria

| SC | Status |
|---|---|
| SC-001 | **Met**: session 2 proposed Tile, Caption and Stamp with the reason, the learner took them, and it passed in 4 min 28 s with no demo. Session 1 took 3 min 51 s with one demo. Builder-only |
| SC-002 | **8 of 8** checks agree with the scrub, and **2 of 2** deliberate jumps. 2 more checks are needed for the sample of 10; they ride along with T343 |
| SC-003 | Open: the baseline comes after the merge (CLAUDE.md, about $13 to $17). So far: smoke runs, case 29 1 of 1, case 30 2 of 3 (the one fail was the judge, not the mentor) |
| SC-004 | Covered by the review cases' deterministic check; it gets graded at the baseline |
| SC-005 | Met: the overlap rows and FR-027's P2 cases are in `npm test`, all passing |
| SC-006 | Met: `null-parenting-jump.test.mjs` on `practice2b-parented.json` and `parented-rot.json`, 0 false jumps |
| SC-007 | **After the merge** (HO-4): the easing set at 25/25 or within one, about $12 |
| SC-008 | Met (above) |
| SC-009 | Open, stretch: T343, a day or more after the first pass |

## For the spec

- **The null's key times (usage note finding 1).** At a pass the check returns no times, so the
  mentor can't show the group moving. The proposed fix is `p4.from` and `p4.to` in
  `mentor/lib/null-parenting-check.mjs:227`, which changes the contract, so the spec writer
  approves it before a builder takes it. Not a blocker for the merge.
- **The judge and `SKILL.md`'s names.** Eval 30 run 2's R-NAMES-REAL flag was a false one. The
  rubric change is waiting to see whether it recurs (`null-parenting.md` › To fix later).

## Requests

None open. SR-4 landed (spec 004 T164 and T165), and the snapshot carries `comp.width`.
