# Speed graph fixtures (spec 008)

Every fixture skill 2's tests use, where it comes from, and what replaces it. Tests load a file
from this folder when it's there and fall back to `stand-in/` until then, so swapping a stand-in
for its live capture needs no test change (research R8). `answer-key.json` names files without the
folder, so one key serves both.

**Rule:** everything in `stand-in/` is synthetic and is deleted before this branch merges (tasks
T031). Each stand-in starts with `"synthetic": "stand-in for <live file>"`.

| File | Now | Replaced by (tasks T030, quickstart › 3) | Used for |
|---|---|---|---|
| `answer-key.json` | Hand-written from the spec | Kept; a live capture that disagrees wins only if it's what AE plays (logged for the spec writer) | Every analyze and check test |
| `record-learned-title.json` | Hand-written learner record (T018) | Kept (a record, not a capture) | Review tests |
| `stand-in/practice-now.json` | From `../practice-before.json` with the 2026-10-20 state note's changes and made-up values | `practice-now.json`, Mentor Practice itself | US1 focus, baseline for every check |
| `stand-in/planted-15-80.json` | practice-now, Title Position 0.5–1.5 s at 15/80 | `planted-15-80.json` | SC-003 pass |
| `stand-in/planted-33-33.json` | practice-now, that pair back at Easy Ease | `planted-33-33.json` | SC-003 fail, back to default |
| `stand-in/planted-dragged-up-small.json`, `-large.json` | Landing speeds raised, influence unchanged | Live (L-5) | Arrives moving, drag sideways, REST_SHARE |
| `stand-in/planted-one-scale-dim.json` | Scale shaped on width only | Live only if L-2 shows it can happen; else deleted with its test row | FR-011 dimension |
| `stand-in/planted-hold-in.json` | 1.5 s in side set to hold | Live (L-7) | Overlap row 7, no handle |
| `stand-in/planted-shared-key.json` | Pair 1 shaped, pair 2 not | Live (L-4) | FR-013, row 12 |
| `stand-in/planted-long-both.json` | Scale 90/95 | Live | Long on both ends |
| `stand-in/planted-in-out-mixed.json` | 0.5 s in side lengthened | Live | In and out mixed up |
| `stand-in/planted-easy-ease-again.json` | Scale back at F9's 33.333 | Live (L-6) | Back to default, row 19 |
| `stand-in/planted-expression-off.json` | Logo Rotation's expression off | Live | Row 3 |
| `stand-in/planted-key-added.json` | A key added on Title Scale at 1 s | Live | Row 17, FR-014 |
| `stand-in/after-demo.json`, `after-demo-undone.json`, `after-demo-redone.json` | The demo, its undo, the learner's own 20/85 | Live (L-3) | Demo credit, row 18 |
| `stand-in/practice2-before.json` | Hand-built from `mentor/dev/build-practice-comp-2.jsx`; comp id made up | `../practice2-before.json` (spec 004 T042's live capture; tests prefer it once it exists) | Review on Card, overlap row 16 |

Also used, unchanged: `../practice-before.json` (Mentor Practice as built, US3) and
`../synthetic/linear-basic.json` (nothing eased).

Captures are taken with `node mentor/dev/capture.mjs` on a **duplicate** of Mentor Practice, deleted
before the `.aep` is saved, except `practice-now.json`, which is Mentor Practice itself. Check no
capture holds a user name or folder path.
