# Quickstart: validating skill 3, offset (spec 010)

**Status**: Draft, awaiting the builder's approval. § 1 runs in the cloud container; § 2 to § 5
are **one sitting** at the builder's Mac (🖐), in order; § 6 is a day or more later. Spec 004's
[quickstart.md](../004-ae-curriculum/quickstart.md) covers the shared branch.

## 1. Cloud: everything that doesn't need After Effects

```bash
cd mentor && npm test                                                # green on stand-ins and synthetics
node ../.claude/hooks/check-branch.mjs <branch> skill-builder main   # no --shared-owner: clean
```

Run `/agent-audit` on `.claude/skills/offset-mentor/SKILL.md`. Hand back; the cockpit makes the
branch available on the Mac.

## 2. 🖐 Live checks L-1 to L-4

Setup: After Effects 26.5 on `discovery/Claude AE Tutor Test.aep`; the cockpit off AE; one
skill-builder in this branch's local worktree holds the AE lock (not during spec 008's or 009's
sitting). Duplicate Mentor Practice 2; work on the duplicate. The builder does the hand actions;
the agent reads with `node mentor/dev/capture.mjs` and logs.

| Check | Do | Log |
|---|---|---|
| L-1 | Quick Offset at 26.5: Cmd+Option drag on Dot 1 to Dot 3's layers, then on selected keys across them; read after each | The gesture that works; whether effect keys move; whether in points move or keys only; whether any key lands between frames (row 19) |
| L-2 | `offset_demo` on Dot 2 (temp `AE_MENTOR_HOME`; `offset_snapshot` with an order and a 4-frame gap first); read; compare with the read before | Every key on every property (Blurriness, Position, Opacity) moved by exactly 4 frames; values, types, temporal ease, spatial tangents unchanged; one Edit > Undo restores it |
| L-3 | Drag Dot 3's layer bar 6 frames later; read. Then trim Dot 3's in point; read | Key times are the new comp times after the drag; unchanged after the trim (row 16) |
| L-4 | Lock Dot 2; `offset_demo` on it | Refused, nothing changed (read before and after) |

If L-2 shows an attribute lost, fix the snippet in the desk block (§ 4) and repeat L-2 then.

## 3. 🖐 Captures (duplicates of Mentor Practice and Mentor Practice 2)

Saved as `mentor/test/fixtures/offset/<name>.json`; names match `answer-key.json`.

| File | Shape (overlap row, eval) |
|---|---|
| `practice-now.json` | Mentor Practice itself, as it is (the properties-kind lesson's first look; Title Position's four keys, row 8) |
| `props-pass-landing.json` | Title's Opacity landing 4 frames earlier and Scale shifted later (US1 #3) |
| `props-one-frame.json` | Title's Scale moved 1 frame (US1 #4) |
| `layers-pass.json`, `layers-uneven.json` | Dots staggered evenly, then unevenly (FR-015) |
| `layers-one-frame.json` | Dots 1 frame apart (floor) |
| `pops-in.json` | Dot 1's Opacity moved, Position not (FR-012) |
| `order-differs.json` | Dots staggered in another order than stated |
| `effect-with-layer.json` | Dot 2 shifted with its Blurriness key (row 10) |
| `separated-x-only.json` | Dot 3's X moved, Y not (row 7) |
| `reordered.json` | Dots reordered in the stack, key times unchanged (row 17) |
| `bar-dragged.json`, `in-point-trimmed.json` | L-3's two shapes (row 16) |
| `past-end.json` | Chip C's last key pushed after the comp's end (row 18's live case, if it can be made) |
| `hold-group.json` | Dot 1's hold-then-ramp in a staggered group (row 4) |
| `quick-offset.json` | L-1's result (row 19's live case if keys land between frames) |
| `after-demo.json`, `after-demo-undone.json`, `after-demo-redone.json` | The demo, its undo, the learner's own shift (FR-011) |
| `single-key-moved.json`, `expression-toggled.json` | Logo's single Scale key moved; Logo's expression turned off (rows 1, 3, FR-013) |

Then delete the duplicates, check both practice comps match their captures, check no capture holds a
user or folder name, save, release the lock.

## 4. Desk block (AE open, lock released, not 🖐)

```bash
cd mentor && npm test     # on live captures; stand-in folder deleted, synthetic/ kept for rows 5, 18, 19
```

Fill `SKILL.md`'s `<!-- L-1 -->` places: if L-1 confirmed the gesture, Quick Offset is offered at
25.4 or later alongside dragging; if not, it stays out. Write row 16's hint from L-3. Any result
that changes a requirement goes in the hand-back for the spec writer before § 5.

## 5. 🖐 First live lessons (SC-001, SC-002)

The builder, in a plain Claude Code session in the repo (not a subagent), easing learned:

1. Mentor Practice active, `/offset-mentor`: Title's Position, Scale and Opacity proposed, the layers
   kind offered once, leave-outs named, the order and gap asked and said back, a demo on the second
   property only if asked, the check.
2. Mentor Practice 2 active, `/offset-mentor`: the Dots proposed (or picked), the same flow.

Each to a verified pass in ≤ 15 minutes with ≤ 1 demo (times from `calls.jsonl`); note per check
whether it matched a scrub in After Effects (SC-002: 9 of 10 across the live runs).

## 6. 🖐 Live review, a day or more later (SC-006)

With § 5's record, on Mentor Practice 2: the review names Chip A, Chip B and Chip C at 2 s, asks
which goes first, says to stagger them however you like, no demo or walkthrough; checked and
recorded as a review.
