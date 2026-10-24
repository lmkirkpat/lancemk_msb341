# `layer_info` fixtures (spec 004 wave B, reads R1 and R3)

Snapshots with the wave B `layer_info` array (data-model.md › Wave B shapes), for the shared
reads and rules: `mentor/lib/layer-info.mjs`, `comp-space.mjs`, `visibility.mjs`,
`motion-sources.mjs`, and the visibility switch in easing and skills 1 to 3.

## Synthetic (`synthetic/`)

Hand-written, **never** from AE. Only pure math (comp-space) and filter logic may rest on them
(FR-012); every Edge Cases row still gets a live capture below. Each file has a `comment` field
saying it's synthetic and which live capture replaces it in tasks-wave-b.md T136.

| File | What it is | Replaced by (T136) |
|---|---|---|
| `synthetic/matte.json` | `hidden-layer.json` plus a moving matte: Photo matted by Wipe (eye off, linear Position keys, an Opacity blink), Old Take hidden by the learner, Title visible | `overlaps.json` (Wipe) |
| `synthetic/relations.json` | One layer per visibility and motion-sources row: a hidden null with two children (one with separated Position), a shy parent keyed only on Opacity, a guide with its eye off, a shy guide, a keyed property with an expression on, a precomp layer, a static layer | `overlaps.json`, `overlaps-solo.json` |
| `synthetic/chain.json` | A rotated, non-uniformly scaled null parenting a keyed solid, for comp-space math | `overlaps.json` (Pivot and Arm), with AE's `to_comp` in `overlaps-expected.json` |

## Live captures (Phase 6, 🖐, not captured yet)

Each is `node mentor/dev/capture.mjs <file>` with the comp active, at the CTI given.

| File | Comp | CTI | Built by |
|---|---|---|---|
| `practice-r1.json` | Mentor Practice, as it is now | as found | `mentor/dev/build-practice-comp.jsx` (spec 002), not rebuilt (T133) |
| `overlaps.json` | Mentor Overlaps (Draft is the layer hidden by the learner) | 1 s | `mentor/dev/build-overlaps-b.jsx` (T131, T133) |
| `overlaps-solo.json` | Mentor Overlaps, Solo on for Still by hand | 1 s | as above (T133) |
| `practice2b.json` | Mentor Practice 2 with wave B's layers | 0 s | `mentor/dev/build-practice-comp-2b.jsx` (T132, T135) |
| `practice2b-parented.json` | as above, Tile, Caption and Stamp parented to a new null by hand | 0 s | T135 (a) |
| `practice2b-anchor.json` | as above, Door's anchor moved to its left edge with Pan Behind | 0 s | T135 (b) |

Answer keys, written by the build scripts as they build (never by running the mentor's code):
`overlaps-expected.json` and `practice2b-expected.json`. Each holds, per layer, the declared
`layer_info` fields and AE's own `toComp()` of the anchor (`to_comp`, from a temporary Probe layer
the script deletes) at the probed times.
