# Spec 010 live sitting, 2026-10-26

Hand-back for the 🖐 tasks T032 and T033 (`quickstart.md` › 2 and 3). Run by the cockpit through the
bridge (as in specs 004, 008 and 009), with the builder doing the hand moves, while a skill-builder
ran spec 009's desk block in its own worktree (no AE). AE 26.5 (`26.5x89`) on macOS 27.0.1, project
`discovery/Claude AE Tutor Test.aep`. Work done on "Mentor Practice 2 OF test" (id 491) and "Mentor
Practice OF test" (id 543), duplicates of Mentor Practice 2 (179) and Mentor Practice (97).

## Before the checks

- `practice-now.json` captured from Mentor Practice itself (8 animated layers); it matches spec 008's
  `speed-graph/practice-now.json`.
- Mentor Practice 2's base is `mentor/test/fixtures/layer-info/practice2b.json` (spec 009's L-4).
  Dot 1 to 3 at build: keys at frames 15 and 45 (Dot 1's Position also a hold key at 0; Dot 3's Y
  Position lands at 37.5), all linear; Dot 2 has Blurriness, Position, Opacity (AE reads Blurriness
  first).

## L-1: Quick Offset at 26.5 (row 19)

Builder's hand gesture: ⌘⌥ drag (Command+Option), "worked as expected".

- **On the selected layers (Dot 1 to 3):** moves **whole layers** (start time and in point), so
  effect keys go with them. Even spacing, fixed top layer: Dot 2 **+12.5 frames**, Dot 3 **+25**. Keys
  land **between frames** (27.5, 57.5, 62.5). Captured as `quick-offset.json`: row 19's live case.
- **On the selected keys:** the layers stay; only keys move, on **whole frames**, spread **bottom-up**
  this time: Dot 3 unchanged, Dot 2 +38, Dot 1 +76. Dot 2's Blurriness keys moved with its other keys.
  Dot 1's hold key at frame 0 did **not** move; whether it was in the selection box wasn't confirmed.
  Captured as an extra, `quick-offset-keys.json`.
- Undo: the Edit menu read **"Undo Edit Keyframe Movement"**. Whether one drag is one undo step is
  **unknown**: the first press didn't restore the keys and the builder then pressed several times.
  Every comp was checked against its capture afterwards; all matched.
- For `SKILL.md`'s `<!-- L-1 -->`: the gesture works at 26.5 on layers and on keys. On layers it can
  leave keys between frames, which the check reports (row 19).

## L-2: the demo (Dot 2, 4 frames)

Run in-process (`offset_snapshot` kind layers, members and order Dot 1, Dot 2, Dot 3, gap 4 frames;
then `offset_demo` on the demo target), fixture mode off, `AE_MENTOR_HOME` a temp folder.

- First read proposed the **properties** kind (Dot 2's three properties tie with Dot 1 to 3, and a tie
  goes to properties, as quickstart › 5.2 expects). Demo target with the Dots: `layer/6` (Dot 2).
- Every key on Blurriness, Position and Opacity moved **15 → 19 and 45 → 49, exactly 4 frames**.
  Values, key types (linear), temporal ease (16.667 and the speeds -10, 400, 80) and spatial tangents
  (0) unchanged. No attribute lost; the snippet needs no fix.
- Undo: **"Undo AE Mentor: offset-demo"**; one undo put the duplicate back equal to `practice2b.json`.
- The builder's own shift after the undo: **dragged Dot 2's layer bar 4 frames** (start 4, keys read
  19 and 49 in comp time). `after-demo-redone.json` is that. The stand-in had Dot 2 +6 and Dot 3 +12;
  the answer key needs the desk block's look.

## L-3: layer bar and in point (row 16)

- Dragging Dot 3's bar 6 frames later (builder): start and in point 6; every key reads **+6 in comp
  time** (15 → 21, 45 → 51, Y 37.5 → 43.5). `bar-dragged.json`.
- Then trimming Dot 3's in point (builder, to about frame 11): **keys unchanged** (21, 51, 43.5).
- `in-point-trimmed.json` was re-planted by script to the stand-in's shape (Dot 3 not moved, in point
  at frame 6, keys at 15 and 45), so it compares with the base. The builder's hand trim showed the
  behavior; the script plant matches the answer key's shape.
- Row 16's hint: a dragged bar moves the keys with it (a real shift), and a trim doesn't.

## L-4: locked layer

- Dot 2 locked, a fresh lesson, `offset_demo` on `layer/6`: **refused** ("That layer is locked."),
  code `OFFSET_REFUSED`, reason `locked`; a capture before and after matched.
- **Finding:** `offset_snapshot` still names the locked Dot 2 as `demo_target` (`no_demo_reason`
  null). The tool refuses at the demo, so the hard rule holds, but a lesson could offer a demo it can't
  give. For the spec writer / skill-builder.

## Captures (T033)

| File | How | Notes |
|---|---|---|
| `practice-now.json` | Mentor Practice itself | |
| `after-demo.json` | After L-2's demo | Dot 2 +4 |
| `after-demo-undone.json` | One Edit › Undo | Equals the base |
| `after-demo-redone.json` | Builder dragged Dot 2's bar 4 frames | Differs from the stand-in (see L-2) |
| `quick-offset.json` | L-1 on layers | Half frames |
| `quick-offset-keys.json` | L-1 on keys | Extra; not in quickstart › 3 |
| `bar-dragged.json` | Builder, L-3 | |
| `in-point-trimmed.json` | Script: Dot 3 in point at frame 6 | See L-3 |
| `layers-pass.json` | Script: Dot 2 +4, Dot 3 +8 | |
| `layers-uneven.json` | Script: Dot 2 +4, Dot 3 +12 | |
| `layers-one-frame.json` | Script: Dot 2 +1, Dot 3 +2 | |
| `pops-in.json` | Script: Dot 1 Opacity +6 (Position not), Dot 2 +4, Dot 3 +8 | |
| `order-differs.json` | Script: Dot 3 +4, Dot 2 +8 | |
| `effect-with-layer.json` | Script: Dot 2 +4 (Blurriness with it), Dot 3 +10 | |
| `separated-x-only.json` | Script: Dot 2 +4, Dot 3 X Position and Opacity +8, Y not | |
| `reordered.json` | Script: Dot 1 and Dot 3 swapped in the stack (indexes 7 and 5) | Key times unchanged |
| `hold-group.json` | Script: layers-pass plus Dot 1's hold key 0 → 3 frames | Jump at 15 unchanged |
| `past-end.json` | Script: Chip B +4, Chip C +165 (keys at 7.5 and **8.5 s**, comp ends at 8) | **Row 18's live case**: AE keeps a key past the end |
| `props-pass-landing.json` | Script on Mentor Practice OF test: Title Scale +4, Opacity's landing 4 frames earlier | |
| `props-one-frame.json` | Script: Title Scale +1 | |
| `single-key-moved.json` | Script: Title Scale +4, Opacity +8, Logo's single Scale key 0 → 0.2 s | |
| `expression-toggled.json` | Script: Logo Rotation's expression (`time * 30`) off | |

Script plants moved keys by copying each key (value, types, temporal ease, continuous and auto-bezier
flags, spatial tangents) to its new time, after a reset from the original comp. A reset with no shift
was checked equal to `practice2b.json` first. Times in captures are rounded to 3 decimals, so frame 19
reads 0.633 s (18.99 frames).

## After the captures

- Both duplicates deleted; Mentor Practice 2 **matches** `practice2b.json`, Mentor Practice
  **matches** `practice-now.json`; Mentor Overlaps matched `layer-info/overlaps.json` after the extra
  undos. No capture holds a user or folder name. `.aep` saved.
- `npm test` with the captures in place: **745 pass, 3 fail** (751). All three read
  `single-key-moved.json` (other-changes checks, row 3); likely the duplicate's comp id (543) against
  the answer key, as in spec 009's desk block. For T034.

## For the hand-back

- **T034:** comp ids on duplicate captures (491, 543); `after-demo-redone.json`'s real shape; row 18
  and row 19 now have live captures (`past-end.json`, `quick-offset.json`), so `synthetic/` may shrink;
  `quick-offset-keys.json` is new.
- **T035:** L-2 needs no snippet fix. `SKILL.md`'s L-1 places: Quick Offset (⌘⌥ drag) works at 26.5
  on layers and on keys; row 16's hint from L-3.
- **Spec writer / skill-builder:** the snapshot offers a locked layer as the demo target (L-4).
