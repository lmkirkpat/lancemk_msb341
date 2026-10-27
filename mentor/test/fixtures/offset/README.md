# Skill 3 (offset) fixtures

Saved snapshots and records for `mentor/test/offset*.test.mjs` (spec 010 FR-022, research R8).
Every snapshot that isn't a live capture says so in its top-level `synthetic` field.

## Provenance (since T034, 2026-10-26)

Every snapshot here is a **live capture** from the 2026-10-26 sitting
(`specs/010-offset/live-sitting-2026-10-26.md`), saved with `node mentor/dev/capture.mjs` on AE 26.5,
except one synthetic file for overlap row 5, which has no live case. The stand-ins and their
`stand-in/build.mjs` are deleted (in git history before T034).

- **Comps.** The Mentor Practice 2 captures were taken on a duplicate of Mentor Practice 2 ("Mentor
  Practice 2 OF test", id 491); the Mentor Practice ones on "Mentor Practice OF test" (id 543). Each
  carries the real comp's id and name instead (179 "Mentor Practice 2", 97 "Mentor Practice"), as
  specs 008 and 009 did, so a lesson started on the base comp checks against them. Nothing else in
  a capture was changed.
- **Bases.** Mentor Practice 2 as built is `../layer-info/practice2b.json` (spec 004's wave B layers
  included; `after-demo-undone.json` equals it). Mentor Practice is `practice-now.json`, captured
  from the comp itself. The 60 fps comp is spec 004's `../practice2-60fps.json`. `load.mjs` exports
  the three as `PRACTICE2`, `PRACTICE_NOW` and `PRACTICE2_60`.
- **Times** are rounded to 3 decimals (frame 19 reads 0.633 s, 18.99 frames), so tests compare in
  frames with the check's half-frame tolerance.
- **Planted by script or by hand.** Most captures were planted by script on the duplicate (each key
  copied with its value, types, ease, flags and tangents to its new time, after a reset). The ones
  the builder made by hand are marked below.

## Files

| File | Shape (overlap row) | How |
|---|---|---|
| `practice-now.json` | Mentor Practice as it is: Title's three properties, Bar and Glow, CTRL, Old Take, Icon, Logo (rows 1, 3, 8, 11 to 15, 22) | Live, the comp itself |
| `props-pass-landing.json` | Title's Scale +4 frames, Opacity's landing 4 frames earlier (US1 #3, row 15) | Live, script |
| `props-one-frame.json` | Title's Scale +1 frame (US1 #4) | Live, script |
| `single-key-moved.json` | Title's Scale +4, Opacity +8, Logo's single Scale key 0 → 0.2 s (row 3) | Live, script |
| `expression-toggled.json` | Logo's Rotation expression off (row 1) | Live, script |
| `layers-pass.json`, `layers-uneven.json` | Dots: Dot 2 +4, Dot 3 +8; Dot 2 +4, Dot 3 +12 (FR-015) | Live, script |
| `layers-one-frame.json` | Dot 2 +1, Dot 3 +2 (the floor) | Live, script |
| `pops-in.json` | Dot 1's Opacity +6 (its Position not), Dot 2 +4, Dot 3 +8 (FR-012) | Live, script |
| `order-differs.json` | Dot 3 +4, Dot 2 +8 | Live, script |
| `effect-with-layer.json` | Dot 2 +4 with its Blurriness, Dot 3 +10 (row 10) | Live, script |
| `separated-x-only.json` | Dot 2 +4; Dot 3's X Position and Opacity +8, Y not (row 7) | Live, script |
| `reordered.json` | Dot 1 and Dot 3 swapped in the stack, key times unchanged (row 17) | Live, script |
| `hold-group.json` | `layers-pass` plus Dot 1's hold key 0 → 3 frames, its jump unchanged (row 4) | Live, script |
| `bar-dragged.json` | Dot 3's layer bar dragged 6 frames: every key +6 in comp time (row 16, L-3) | Live, **by hand** |
| `in-point-trimmed.json` | Dot 3's in point at frame 6, keys unchanged (row 16, L-3). The builder's hand trim showed the behavior; this one was re-planted by script to compare with the base | Live, script |
| `after-demo.json` | The demo on Dot 2, 4 frames (L-2) | Live, `offset_demo` |
| `after-demo-undone.json` | One Edit > Undo after it: equals the base | Live, by hand |
| `after-demo-redone.json` | Then the builder **dragged Dot 2's layer bar 4 frames**; Dot 3 not moved (FR-011). The stand-in had Dot 2 +6 and Dot 3 +12; the live one doesn't pass, and its credit depends on a check having seen the undo | Live, **by hand** |
| `past-end.json` | Chip B +4, Chip C +165: keys at 7.5 s and 8.5 s, the comp ends at 8 s (**row 18's live case**: AE keeps a key past the end) | Live, script |
| `quick-offset.json` | Quick Offset (⌘⌥ drag) on the selected Dots: whole layers, Dot 2 +12.5 frames, Dot 3 +25, keys between frames (**row 19's live case**, L-1) | Live, **by hand** |
| `quick-offset-keys.json` | Quick Offset on the selected keys: whole frames, bottom-up, Dot 3 unchanged, Dot 2 +38, Dot 1 +76, Dot 1's hold key at 0 s not moved (L-1, an extra) | Live, **by hand** |
| `synthetic/two-held-jumps.json` | Row 5: two held jumps on one layer at the same time. No live case. Written by the deleted `stand-in/build.mjs` | Synthetic |
| `answer-key.json` | Written by hand from the shapes above, not by running the analysis; entries changed for the live captures carry a `note` | Hand |
| `load.mjs` | Test helper: loads fixtures and builds a lesson as the session would (`demo_undone` marks a demo a check has seen undone) | Code |
| `records/easing-learned.json` | Synthetic record: easing learned, nothing for offset (T013) | Hand |
| `records/learned-dots.json` | Synthetic record: offset learned and due, Dot 1 to 3's units as past targets on Mentor Practice 2 (T025) | Hand |

Rows 18 and 19 used synthetic comps until T034; they're replaced by `past-end.json` and
`quick-offset.json`. What those live captures don't show (a properties-kind landing past the end;
two properties of one layer shifted by amounts within half a frame of each other) is tested by
editing a live capture inside the test, marked there as a synthetic edit.
