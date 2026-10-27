# Speed graph fixtures (spec 008)

Every fixture skill 2's tests use and where it comes from. All captures are live, from the
2026-10-26 sitting (`specs/008-speed-graph/live-sitting-2026-10-26.md`, T029 and T030), taken with
`node mentor/dev/capture.mjs` in AE 26.5 on `discovery/Claude AE Tutor Test.aep`. The synthetic
stand-ins were deleted in T031.

**Comp identity:** `practice-now.json` is Mentor Practice itself (id 97). Every other capture was
taken on a duplicate, "Mentor Practice SG test" (id 382), deleted before the `.aep` was saved. A
reset duplicate matched `practice-now.json` key for key (checked again in T031: `planted-33-33.json`
and `after-demo-undone.json` have the same layers, precomps and comp settings apart from the
playhead), and only `comp.id` and `comp.name` differed. The check grades only the lesson's own comp,
so T031 set `comp.id` 97 and `comp.name` "Mentor Practice" on each of those captures; nothing else
was edited. In a real lesson the learner shapes Mentor Practice itself, so the id never changes.
Samples in `layer_info` are taken at the playhead and key times of each capture, so they differ from
file to file where the playhead did.

**Rule:** `answer-key.json` is written by hand from the spec and research R2 to R7. A live capture
that disagrees with it wins only if it's what AE plays; each such change carries a `note` in its
entry.

| File | How it was made (sitting step) | Used for |
|---|---|---|
| `answer-key.json` | Hand-written from the spec, updated in T031 where live differs | Every analyze and check test |
| `record-learned-title.json` | Hand-written learner record (T018), not a capture | Review tests |
| `practice-now.json` | Mentor Practice itself, before the duplicate was made | US1 focus, baseline for every check |
| `planted-15-80.json` | Script: Title Position 0.5 s out 15, 1.5 s in 80 | SC-003 pass |
| `planted-33-33.json` | Script: the reset (Easy Ease) | SC-003 fail, back to default |
| `planted-shared-key.json` | Script: same state as 15/80, 1.5 s out left at 33.333 (L-4) | FR-013, row 12 |
| `planted-hold-in.json` | Script: 1.5 s in side set to hold (L-7); AE stores influence 16.667 there | Overlap row 7, the hold-side hint |
| `planted-long-both.json` | Script: Scale 0.5 s out 90, 1.5 s in 95 | Long on both ends |
| `planted-in-out-mixed.json` | Script: Position 0.5 s in 80 | In and out mixed up |
| `planted-expression-off.json` | Script: Logo Rotation's expression kept, turned off | Row 3 |
| `planted-key-added.json` | Script: AE's own `addKey` on Title Scale at 1 s (speed 30) | Row 17, FR-014 |
| `planted-dragged-up-small.json` | By hand: 1.5 s landings dragged up a little (L-5). The drag also moved Position's 3 s and 4.367 s landings (speed 2.91) | Arrives moving, drag sideways, `REST_SHARE` |
| `planted-dragged-up-large.json` | By hand: dragged further, from the small drag | Arrives moving, fastest part near the two-thirds line |
| `planted-one-scale-dim.json` | By hand in Keyframe Velocity, Lock Dimensions off (L-2). Title Position still has the large drag | FR-011 dimension |
| `planted-easy-ease-again.json` | Script to 15/80 on Scale, then F9 by hand (L-6). Title Position still has the large drag | Back to default, row 19 |
| `after-demo.json` | One demo run (L-3): 15.13 / 79.87 | Demo credit, row 18 |
| `after-demo-undone.json` | After one Edit › Undo; matches `planted-33-33.json` | Demo credit, row 18 |
| `after-demo-redone.json` | The builder's own speed-graph drag: 18.49 / 83.63 | Demo credit, row 18 |

Also used, unchanged: `../practice-before.json` (Mentor Practice as built, US3),
`../practice2-before.json` (Mentor Practice 2, spec 004 T042's live capture; review on Card,
overlap row 16, another comp) and `../synthetic/linear-basic.json` (nothing eased).

None of these captures holds a user name or folder path; check again before adding one.
