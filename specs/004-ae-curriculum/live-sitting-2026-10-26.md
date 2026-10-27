# Spec 004 live sitting, 2026-10-26

Hand-back for the 🖐 tasks in `tasks.md` (T041, T064, T042) and `tasks-wave-b.md` (T133, T134,
T135, T158). Run by the cockpit through the bridge, with the builder doing Solo and the two hand
moves. AE 26.5 on macOS 27.0.1, project `discovery/Claude AE Tutor Test.aep` (saved after).

## Host (T042, FR-030)

- `host.ae_version`: `26.5x89`. `host.os`: `Macintosh OS 27.0.1/64`. No user or machine name.
- Nothing in the version string marks a beta build (`x89` is the build number). `host.beta` can't be
  set from this string alone.

## Mentor Practice compare (T042, T134)

`capture.mjs --compare practice-before.json` lists all 8 layers (Title, Subtitle, CTRL, Bar, Glow,
Cursor, Logo, Old Take), as expected after the lessons. `host`, `layer_info` and `comp.time` are not
listed. Same result before the Mentor Practice 2 build, after it, and at T134. Snapshots taken before
and after the build are identical apart from `taken_at`, so the build never touched Mentor Practice.

## Mentor Practice 2 (T041, T064)

`build-practice-comp-2` ran first time: 14 layers (13 animated plus Background), totals 21 linear, 6
eased, 2 held, answer key written. Captured at 0 s as `practice2-before.json`; a 60 fps duplicate
captured as `practice2-60fps.json` and deleted.

## Mentor Overlaps (T133, T158)

- **Script fix:** `build-overlaps-b.jsx` stopped with "Object is invalid" at the Orbit probe: adding
  the second Point Control invalidated the first, which was still held. `probePoint` now returns the
  effect's index and `readPoint` looks it up each time. `build-practice-comp-2b.jsx` has the same
  helper but reads each probe before adding the next, so it ran unchanged.
- Track matte (curriculum B8): `setTrackMatte(layer, TrackMatteType.ALPHA)` worked. AE turned the
  matte's eye off itself.
- Captures at CTI 1 s: `overlaps.json`; `overlaps-solo.json` with Solo on Still (by hand). The two
  differ only in Still's `solo`.
- Snapshot time: 0.15 to 0.18 s wall-clock per capture (the 2 s goal).
- **Auto-orient (T158): the read doesn't include it.** Orbit's `rotation` sample is 0 at 0.5, 1 and
  1.5 s; AE's `toComp()` puts it on screen at −33.69°, 33.69°, 33.69°.

## Mentor Practice 2b (T135, curriculum B9, spec 012 L-2)

- `build-practice-comp-2b` added 26 layers (40 total). The original 13 animated layers are identical
  to `practice2-before.json`. Captured at 0 s as `practice2b.json`.
- **(a) Null, by hand:** Layer › New › Null Object went in at index 1, at (960, 540), renumbering
  every layer below it. After pick-whipping Tile, Caption and Stamp to it, **the children's raw
  Position values changed, keys included**, each by −(960, 540): Tile's keys (1200, 150) → (240, −390)
  and (1240, 150) → (280, −390); Stamp's separated X keys 1290 → 330 and 1310 → 350; Caption's static
  (1220, 215) → (260, −325). Captured as `practice2b-parented.json`. Undone; the comp matched
  `practice2b.json` exactly.
- **(b) Door, Pan Behind with snapping:** anchor (150, 250) → (0, 250), position (200, 300) → (50,
  300), footprint unchanged (x 50 to 350, y 50 to 550); only Door changed. Captured as
  `practice2b-anchor.json`. Undone; matched `practice2b.json` exactly.

## Privacy

No capture holds a user name or folder path. The only file name in any of them is the project's own,
`Claude AE Tutor Test.aep`, as in `practice-before.json`.

## Tests after the sitting

Mentor tests: 654 pass, **51 fail**, 3 todo. With `practice2-before.json` moved aside: 705 pass, 0
fail (up from 688: the layer-info captures turned on the tests that were skipped waiting for them).

The 51 are in key types, offset and speed graph. Their loaders switch the *base* to the live
`practice2-before.json` once it exists, but their derived stand-ins (`pops-in`, `layers-pass` and so
on) are still built from the stand-in base, which guessed comp id 300 (live: 179), placeholder ease
speeds of 10, and 2D Position values (live: 3D). Base and derived states disagree. The fix is the
skills' stand-in builders deriving from whichever base is present, then the non-live tasks that
wait on these captures (T039, T043, T050, T065, T136, T137). Sent to a shared-owner skill-builder on
this branch.
