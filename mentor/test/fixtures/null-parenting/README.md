# Skill 6 fixtures: move a group with a null (spec 012)

Saved snapshots for `mentor/lib/null-parenting.mjs`, `mentor/lib/null-parenting-check.mjs` and
`mentor/tools/null-parenting.mjs`, with the answer key `answer-key.json` (hand-written from the
build scripts' declared layouts, never by running the skill's code).

`load.mjs` finds each fixture in this order: a live capture in this folder (`<name>.json`), then
spec 004's capture read in place (`mentor/test/fixtures/layer-info/<name>.json`, for
`practice2b.json`, `practice2b-parented.json` and `overlaps.json`), then the stand-in
(`stand-in/<name>.json`).

## Rules

- **Stand-ins are deleted before merge** (research R10, tasks T338): every file in `stand-in/`
  stands in for a live capture named in quickstart › 3 and is replaced by it in the sitting.
  Each says so in its `synthetic` field. `stand-in/build.mjs` writes them (and `synthetic/`):
  `node mentor/test/fixtures/null-parenting/stand-in/build.mjs`.
- **Synthetics stay** (`synthetic/`), only for the overlap rows the spec allows (FR-026): rows 4,
  10, 21, 23, 26, 31, 35, 36, 40, the 70-time cap case and the Scale 150 / Rotation 30 null for
  S-1 (until L-2's `parented-rot.json`). Each is marked `SYNTHETIC` in its `synthetic` field.
- **No user or folder name** in any capture (quickstart › 3, constitution IV).
- Stand-ins carry `comp.width` and `comp.height` (SR-4 has landed on main: `snapshot.jsx` writes
  them), so the 2% rule runs in the cloud.

## Stand-ins (`stand-in/`, deleted after the sitting)

Comp: Mentor Practice 2 (id 300, 1920 × 1080, 30 fps, 8 s), before read at 0 s. Built from
`mentor/dev/build-practice-comp-2b.jsx`'s declared layers (T157 with T163's layout). Text
rectangles are estimates. The group's P2 times are **0, 4.167, 4.367, 4.667, 5.167, 5.367, 5.667**
(Tile's Position and Scale, Stamp's X and Y, Caption at 0 s only); the review rows' are **0, 4.8,
5.167, 5.8, 6.167**.

| Stand-in | Stands in for (live) | Sitting step | `--times` |
|---|---|---|---|
| `practice2b.json` | spec 004's `layer-info/practice2b.json` (T135), read in place | spec 004 T135 | none |
| `practice2b-with-wave-a.json` | the same comp with its 13 wave A layers (the live comp has them) | L-6 | none |
| `practice2b-parented.json` | spec 004's `layer-info/practice2b-parented.json` (T135 a), read in place | spec 004 T135 | group |
| `null-center.json` | `null-center.json`; also `renumbered-after.json` (L-5) | § 3, L-5 | group |
| `null-top-left.json` | `null-top-left.json` | § 3 | group |
| `jumped.json` | `jumped.json` (Stamp 120 px left) | L-3 | group |
| `pickwhip-position.json` | `pickwhip-position.json` (Caption by the Position pick whip, unkeyed) | L-3 | group |
| `visible-parent.json` | `visible-parent.json` (Caption under Tile) | § 3 | group |
| `null-keyed-early.json` | `null-keyed-early.json` (row 30) | § 3 | group |
| `null-moved.json`, `null-moved-before-parenting.json` | `null-moved-before-parenting.json` (row 31) | § 3 | group |
| `fade-null.json`, `rotate-null.json`, `slide-null.json`, `anchor-only-null.json`, `one-key-null.json` | `fade-null.json`, `rotate-null.json`, `anchor-only-null.json` (P4, row 26) | § 3 | group |
| `practice2b-null1.json`, `two-nulls-same-name.json`, `two-nulls-renamed.json` | `two-nulls-same-name.json` (row 40) | § 3 | group |
| `null-renamed.json` | the lesson's null renamed after parenting (Edge Cases) | § 3 | group |
| `plate-parented-too.json` | Plate parented to the null too (row 38) | § 3 | group |
| `playhead-moved.json` | the playhead at 2.5 s after parenting (S-2) | § 3 | group |
| `review-rows-visible.json` | `review-rows-visible.json` (US3 #2) | § 3 | rows |
| `review-rows-null.json`, `review-rows-pass.json`, `review-rows-parented-in-one-go.json` | the review's null, pass and one-go parenting (§ 6) | § 6 | rows |

## Synthetic (`synthetic/`, permanent)

Comp: Synthetic Group (id 600, 1920 × 1080, 30 fps), before read at 1 s: Card (100 × 100, Position
keys at 2 and 3 s) and Label (100 × 40, static), touching.

| File | Row | What |
|---|---|---|
| `before.json` | | the before read |
| `row4-null-expression.json` | 4 | an expression with no keys moves the null; P4 counts keys only |
| `row10-null-separated.json` | 10 | the null keyed on X Position only |
| `row21-nonuniform.json` | 21 | the null at Scale 150 × 100, parented with no jump |
| `row23-still-parent-placed.json`, `row23-still-parent.json` | 23 | the null under Holder, which doesn't move |
| `row23-moving-parent.json` | 23 | the null under Holder, which moves |
| `row26-anchor-only.json` | 26 | the null keyed on Anchor Point only |
| `row31-placed.json`, `row31-moved.json`, `row31-parented.json` | 31 | the null moved before parenting, with and without a check between |
| `row35-out-of-range.json` | 35 | Label's in point after its sampled times |
| `row36-truncated.json` | 36 | a layer past the 64-sample cap |
| `row40-two-nulls.json` | 40 | two new layers called Null 1 |
| `cap70-before.json`, `cap70-parented.json`, `cap70-parented-no-times.json` | R4 | 69 child key times under one null, with and without the P2 times passed |
| `s1-before.json`, `s1-placed.json`, `s1-parented.json`, `s1-jumped.json` | S-1 | a null at Scale 150, Rotation 30 (until L-2's `parented-rot.json`) |
| `zero-scale-null.json` | Q2 | the null at Scale 0 × 100 (the demo's `null_scale_zero`) |

## Records (`records/`)

| File | What |
|---|---|
| `anchor-learned.json` | easing and the pivot learned, nothing for this skill (version 1, no names) |
| `anchor-not-learned.json` | easing only |
| `learned-group.json` | this skill learned and due, Tile, Caption and Stamp past targets on Mentor Practice 2 |

## Live captures (the sitting, quickstart › 3; not taken yet)

Saved here as `<name>.json` with `node mentor/dev/capture.mjs --times <list>` (the group's or the
rows' list above): `parented-rot.json`, `jumped.json`, `pickwhip-position.json`,
`null-top-left.json`, `null-center.json`, `visible-parent.json`, `null-keyed-early.json`,
`null-moved-before-parenting.json`, `fade-null.json`, `rotate-null.json`, `anchor-only-null.json`,
`two-nulls-same-name.json`, `demo-done.json`, `demo-undone.json`, `renumbered-before.json`,
`renumbered-after.json`, `review-rows-visible.json`.
