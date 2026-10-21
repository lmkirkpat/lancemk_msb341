# Skill 3 (offset) fixtures

Saved snapshots and records for `mentor/test/offset*.test.mjs` (spec 010 FR-022, research R8).
Every snapshot that isn't a live capture says so in its top-level `synthetic` field.

## The rule

**Stand-ins are deleted before merge.** Everything in `stand-in/` is built in the cloud from the
answer keys we have, because After Effects isn't there. The live sitting (tasks T033) captures each
one with `node mentor/dev/capture.mjs` into this folder under the same name; the desk block (T034)
points the tests at the captures and deletes `stand-in/` (with its `build.mjs`). The tests already
prefer a live capture when one exists (`load.mjs`).

`synthetic/` stays: spec 010 allows rows 5, 18 and 19 of its overlap table to be synthetic, as
there's no live case for them (row 18 or 19 can be replaced by a live capture if the sitting makes
one).

## Files

| File | Source | Replaced by |
|---|---|---|
| `answer-key.json` | Written by hand from the spec, teaching design and `stand-in/build.mjs` | Kept; only paths change after T034 |
| `load.mjs` | Test helper: loads fixtures, prefers live captures, builds a lesson as the session would | Kept |
| `records/easing-learned.json` | Synthetic record: easing learned, nothing for offset (T013) | Kept |
| `records/learned-dots.json` | Synthetic record: offset learned and due, Dot 1 to 3's units as past targets on Mentor Practice 2 (T025) | Kept |
| `stand-in/build.mjs` | Writes every stand-in and synthetic below: `node mentor/test/fixtures/offset/stand-in/build.mjs` | Deleted with `stand-in/` |
| `stand-in/practice-now.json` | `mentor/test/fixtures/practice-before.json` changed to the 2026-10-20 state (Title Position at 0.5, 1.5, 3, 4.37 s, eased; `discovery/usage-notes/mentor-practice-state-2026-10-20.md`) | `practice-now.json`, quickstart › 3 |
| `stand-in/practice2-before.json` | Built from `mentor/dev/build-practice-comp-2.jsx`'s answer key (layer order, times, values, types) | Spec 004's live `mentor/test/fixtures/practice2-before.json` (its T042) |
| `stand-in/practice2-60fps.json` | The same at 60 fps | Spec 004's live `mentor/test/fixtures/practice2-60fps.json` |
| `stand-in/props-pass-landing.json` | Title's Opacity lands 4 frames early, Scale 4 frames later (US1 #3) | Live capture, quickstart › 3 |
| `stand-in/props-one-frame.json` | Title's Scale moved 1 frame (US1 #4) | Live capture |
| `stand-in/layers-pass.json`, `layers-uneven.json` | Dots staggered 4 and 8 frames; 4 and 12 (FR-015) | Live captures |
| `stand-in/layers-one-frame.json` | Dots 1 frame apart (the floor) | Live capture |
| `stand-in/pops-in.json` | Dot 1's Opacity moved, its Position not (FR-012) | Live capture |
| `stand-in/order-differs.json` | Dots staggered Dot 1, Dot 3, Dot 2 | Live capture |
| `stand-in/effect-with-layer.json` | Dot 2 shifted with its Blurriness key (row 10) | Live capture |
| `stand-in/separated-x-only.json` | Dot 3's X Position and Opacity moved, Y not (row 7) | Live capture |
| `stand-in/reordered.json` | Dot 1 and Dot 3 swapped in the stack, key times unchanged (row 17) | Live capture |
| `stand-in/bar-dragged.json`, `in-point-trimmed.json` | Dot 3's keys 6 frames later; keys unchanged (row 16, L-3) | Live captures |
| `stand-in/hold-group.json` | Dot 1's hold key moved, its jump not, in a staggered group (row 4) | Live capture |
| `stand-in/after-demo.json`, `after-demo-undone.json`, `after-demo-redone.json` | The demo on Dot 2 (4 frames), its undo, the learner's own shift (FR-011) | Live captures |
| `stand-in/single-key-moved.json`, `expression-toggled.json` | Logo's single Scale key moved; Logo's expression off (rows 1, 3) | Live captures |
| `synthetic/two-held-jumps.json` | Row 5: two held jumps on one layer at the same time | Stays |
| `synthetic/past-end-before.json`, `past-end.json` | Row 18: keys pushed past the comp's end | Stays (or a live `past-end.json`) |
| `synthetic/half-frame-before.json`, `half-frame.json` | Row 19: keys between frames, as Quick Offset's even spacing can leave them | Stays (or L-1's `quick-offset.json`) |

Quickstart › 3's `quick-offset.json` has no stand-in: row 19's synthetic covers it until L-1.
