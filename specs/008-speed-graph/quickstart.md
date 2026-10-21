# Quickstart: validating skill 2, speed graph (spec 008)

**Status**: Draft, awaiting the builder's approval. § 1 runs in the cloud container; § 2 to § 5
are **one sitting** at the builder's Mac (🖐), in order; § 6 is a day or more later. Spec 004's
[quickstart.md](../004-ae-curriculum/quickstart.md) covers the shared branch and isn't repeated.

## 1. Cloud: everything that doesn't need After Effects

```bash
cd mentor && npm test                                       # all green, stand-ins in use
node ../.claude/hooks/check-branch.mjs <branch> skill-builder main   # no --shared-owner: clean
```

`check-branch.mjs` must list only added files, all under the plan's Source Code tree. Run
`/agent-audit` on `.claude/skills/speed-graph-mentor/SKILL.md` and fix what it finds. Hand back;
the cockpit makes the branch available on the Mac.

## 2. 🖐 Live checks L-1 to L-4 (before `SKILL.md`'s wording is final)

Setup: After Effects 26.5 open on `discovery/Claude AE Tutor Test.aep`; the cockpit off AE; one
skill-builder in this branch's local worktree holds the AE lock. Duplicate Mentor Practice
(Edit > Duplicate) and work only on the duplicate. The builder does the hand actions; the agent
reads with `node mentor/dev/capture.mjs` and logs every answer for the hand-back.

| Check | Do | Log |
|---|---|---|
| L-1 | Open Animation > Keyframe Velocity on a Title key; open the Graph Editor's graph-type menu | The exact menu path, the Mac shortcut shown on the menu, and the labels "Edit Speed Graph" and "Auto-Select Graph Type" as written |
| L-2 | On a 2D layer's Scale, drag one influence handle in the speed graph; open Keyframe Velocity | Whether every dimension changed; one field or one per dimension; whether the read shows the third dimension moving |
| L-3 | Run the demo on the duplicate's Title Position 0.5–1.5 s (fixture mode off, `AE_MENTOR_HOME` a temp folder: `speed_graph_snapshot` with `focus_layers: ["Title"]`, then `speed_graph_demo`), read, then Edit > Undo and read | Only the two facing sides changed; speeds and types kept; 1.5 s's out side untouched; 15.13 and 79.87 read back exactly; one undo step restores it |
| L-4 | Drag Title Position's 1.5 s in-side influence handle | Whether the out side's influence or speed changed |

If L-1 shows no shortcut or different labels, `SKILL.md` uses what's shown. If L-3's values don't
read back exactly, change `DEMO_OUT`/`DEMO_IN` (research R1) and repeat L-3.

## 3. 🖐 Captures, with L-5 to L-7 (same duplicate)

Each saved as `mentor/test/fixtures/speed-graph/<name>.json` with `capture.mjs`, after the shape is
made by hand on the duplicate. The names match `answer-key.json`.

| File | Shape |
|---|---|
| `practice-now.json` | Mentor Practice itself (not the duplicate), as it is: Title eased, 4 Position keys (the lesson's first look) |
| `planted-15-80.json` | Title Position 0.5–1.5 s at 15/80 by Keyframe Velocity |
| `planted-33-33.json` | The same pair back at Easy Ease |
| `planted-dragged-up-small.json`, `-large.json` (L-5) | The landing handle dragged up a little and a lot, on Position and on Scale |
| `planted-one-scale-dim.json` | Only if L-2 shows one dimension can be shaped alone |
| `planted-hold-in.json` (L-7) | Title Position 1.5 s's in side set to hold, out of 0.5 s bezier; also note what plays |
| `planted-shared-key.json` | 1.5 s's in side shaped for pair 1 only |
| `planted-long-both.json`, `planted-in-out-mixed.json` | Both ends near 100; the start key's in side lengthened instead of its out side |
| `planted-easy-ease-again.json` (L-6) | A shaped pair, then F9: note whether both facing sides reset |
| `planted-expression-off.json` | Logo Rotation's expression turned off (row 3) |
| `planted-key-added.json` | A key added mid-pair on Title Scale (row 17) |
| `after-demo.json`, `after-demo-undone.json`, `after-demo-redone.json` | The demo (L-3), its undo, then the learner's own shape (row 18) |

L-6: on 33/33, 15/80 and one in-between pair, look at where the speed graph peaks and write the
part (first, middle, last) next to what `fastestPart` says (SC-004's 3 of 3).

Then delete the duplicate comp, check Mentor Practice is as it was (`capture.mjs --compare
mentor/test/fixtures/speed-graph/practice-now.json` says "Matches"), check no capture holds a user
name or folder path, and save. Release the lock.

## 4. Desk block (AE stays open, lock released, not 🖐)

```bash
cd mentor && npm test     # now on live captures; the stand-in folder is deleted
```

Tune `REST_SHARE` from L-5 only toward catching a visible bump. Finalize `SKILL.md`'s version
steps from L-1 and the shared-key hint from L-4. Any live result that changes a requirement goes
in the hand-back for the spec writer before § 5.

## 5. 🖐 First live lesson (SC-001, SC-002, SC-004)

The builder, in a plain Claude Code session in the repo (not a subagent: it writes the real
record), with Mentor Practice active and easing learned in the record: `/speed-graph-mentor`.
Expect: Title proposed (Position 0.5–1.5, 1.5–3, 3–4.37 s and Scale 0.5–1.5 s), leave-outs one
sentence each, the read-the-graph step, a demo on Title Position 0.5–1.5 s only if asked, and a
check that agrees with the Graph Editor on every pair. Time it from the call log
(`calls.jsonl`): 15 minutes or less, at most one demo. Note per pair whether the check matched
your look (SC-002: 9 of 10 across the build, including one dragged-up landing and one Scale pair).

## 6. 🖐 Live review, a day or more later (SC-007, wave C)

With the record from § 5, on Mentor Practice 2 (`Card`, Easy Ease Position and Scale) or a new
eased move: `/speed-graph-mentor` in review mode (or via `/next-mentor`). Expect: a target not on
Title, no demo, walkthrough or reading step, the FR-010 check, recorded as a review.
