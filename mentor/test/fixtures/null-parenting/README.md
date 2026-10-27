# Skill 6 fixtures: move a group with a null (spec 012)

Saved snapshots for `mentor/lib/null-parenting.mjs`, `mentor/lib/null-parenting-check.mjs` and
`mentor/tools/null-parenting.mjs`, with the answer key `answer-key.json` (hand-written from the
build scripts' declared layouts, TD § 15's table and the planted attempts' recipes, never by
running the skill's code).

`load.mjs` finds each fixture in this order: a live capture in this folder (`<name>.json`), then
spec 004's capture read in place (`mentor/test/fixtures/layer-info/<name>.json`, for
`practice2b.json`, `practice2b-parented.json` and `overlaps.json`). Synthetics and records are
read by their folder (`synthetic/<name>.json`, `records/<name>.json`).

## Rules

- **Live first.** Every Mentor Practice 2 fixture is a live read from AE 26.5 (spec 012's sitting,
  2026-10-26, `specs/012-null-parenting/live-sitting-2026-10-26.md`), or spec 004's read in place.
  The stand-ins that filled in for them in the cloud were deleted in T338.
- **Synthetics stay** (`synthetic/`), only for the overlap rows the spec allows (FR-026): rows 4,
  10, 21, 23, 26, 31, 35, 36, 40, the 70-time cap case, the Scale 150 / Rotation 30 null for S-1,
  amendment 1's crowd-only comp and the zero-scale null. Each is marked `SYNTHETIC` in its
  `synthetic` field.
- **No user or folder name** in any capture (quickstart › 3, constitution IV). Checked on all 32
  at the sitting and again in T338.
- **Lesson chains read `parented-center.json`**, the group under the lesson's own Null 1 at the
  group's middle. Spec 004's `practice2b-parented.json` has a different null (Null 11 at the comp's
  center, (960, 540)), so a chain from `null-center.json` to it would change null mid-lesson. It's
  read on its own: SC-006, a renamed focus layer, and the other-comp check.

## Mentor Practice 2 (live)

Comp: Mentor Practice 2 (id 179, 1920 × 1080, 30 fps, 8 s), all 40 layers, wave A's 13 included;
the before read at 0 s. Each capture made here carries a top-level `captured_from`: the
duplicate's id and name, what was planted, and whether by **hand** or by **script**. `comp.id` and
`comp.name` are set to 179's. Planted reads follow the old stand-in recipes (same names, places,
key times and values), with AE's own parenting (`layer.parent = null`, which keeps the child in
place like the Parent pick whip). The lesson's null is renamed **"Null 1"** in each plant so the
answer key holds; AE's own name is "Null N", with N counting every null in the project.

AE 26.5's null, as read (L-1): a 100 × 100 square, **anchor (0, 0)** (its top-left, on its
Position), **Opacity 0**, at the comp's center when added. The group's P2 times are **0, 4.167,
4.367, 4.667, 5.167, 5.367, 5.667**; the review rows' are **0, 4.8, 5.167, 5.8, 6.167**. Each
read's sample list also has the layers' own key times (`snapshot.jsx`'s merge).

### Spec 004's, read in place (`../layer-info/`)

| File | What |
|---|---|
| `practice2b.json` | Mentor Practice 2 as built (T135). Also the answer key's wave A comp (L-6): `proposal` Tile, Caption, Stamp; `next_proposal` Chip A to C; a 13-layer crowd |
| `practice2b-parented.json` | Tile, Caption and Stamp parented to **Null 11** at (960, 540) (T135 a). SC-006 and solo reads only |

### By hand (L-2, L-3)

| File | What |
|---|---|
| `parented-rot.json` | L-2: Tile parented with the Parent & Link pick whip (no key held) to Null 12 at Scale 150, Rotation 30; Caption and Stamp left alone. SC-006 |
| `demo-done.json` | L-3: `null_parent_demo` on Tile, Null 13 at the group's middle |
| `demo-undone.json` | L-3: one Edit > Undo after the demo |
| `pickwhip-position-hand.json` | L-3: Caption (unkeyed) linked with its Position pick whip onto Null 13, nothing else parented |
| `pickwhip-position-keyed-hand.json` | L-3: Tile (keyed) linked the same way |

### By script (quickstart › 3, L-5 and the old stand-ins' list)

| File | What | Times |
|---|---|---|
| `null-center.json` | a null at the group's middle, (1215, 165), nothing parented | group |
| `parented-center.json` | Tile, Caption and Stamp parented to that Null 1, no jump (the lesson's own parented read) | group |
| `null-top-left.json` | the null at the group's top-left (US1 #3) | group |
| `jumped.json` | the group parented, then Stamp's X keys 120 px left (US2 #2) | group |
| `pickwhip-position.json` | Tile and Stamp parented; Caption linked by its Position's expression | group |
| `visible-parent.json` | Tile and Stamp parented to the null, Caption to Tile | group |
| `null-keyed-early.json` | the group parented; the null keyed at 6 and 7 s before the check (row 30) | group |
| `null-moved.json`, `null-moved-before-parenting.json` | the null dragged to (1300, 300) after the stage 3 check, then the group parented there (row 31) | group |
| `fade-null.json`, `rotate-null.json`, `slide-null.json`, `anchor-only-null.json`, `one-key-null.json` | the null's move: Opacity keys, Rotation keys, linear Position keys, Anchor Point keys only, one Position key (P4, row 26) | group |
| `slide-top-left.json` | Tile, Caption and Stamp parented to Null 1 at the group's top-left (1100, 100), then a linear Position-only slide at 6 to 7 s; read after `null-top-left.json` with region top-left it passes on Position with no turn check (eval 30, from usage note session 2 finding 4). Planted 2026-10-26 after T341, on a duplicate cleaned of the lesson's Null 12 that matched `practice2b.json` layer for layer | group |
| `practice2b-null1.json`, `two-nulls-same-name.json`, `two-nulls-renamed.json` | an existing empty Null 1, a second Null 1 added, then the new one renamed Group Null (row 40) | group |
| `null-renamed.json` | the lesson's null renamed Group Null after parenting (Edge Cases) | group |
| `plate-parented-too.json` | Plate parented to the null too (row 38) | group |
| `playhead-moved.json` | the group parented, the playhead at 2.5 s (S-2) | group |
| `renumbered-before.json`, `renumbered-after.json` | L-5: the before read, then a null added with nothing selected (every layer below renumbered by one) | group |
| `practice2b-with-wave-a-parented.json` | the comp after the lesson, the group under Group Null (L6-1's review) | group |
| `review-rows-visible.json` | Row B and Row C parented to Row A (US3 #2) | rows |
| `review-rows-null.json`, `review-rows-pass.json`, `review-rows-parented-in-one-go.json` | the review's null, a pass (the null slides) and the rows parented before any check (§ 6, TD § 11) | rows |

## Synthetic (`synthetic/`, permanent)

Written by `synthetic/build.mjs` (moved out of the old `stand-in/build.mjs` in T338, unchanged, so
it rewrites `synthetic/` byte for byte): `node mentor/test/fixtures/null-parenting/synthetic/build.mjs`.
It also exports `sampleList`, `snapshot.jsx`'s sampling order, for the cap test. Synthetic nulls
keep that script's defaults (Opacity 100, anchor at the square's middle), not AE 26.5's; the live
captures cover AE's.

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
| `s1-before.json`, `s1-placed.json`, `s1-parented.json`, `s1-jumped.json` | S-1 | a null at Scale 150, Rotation 30 (with L-2's live `parented-rot.json` beside it) |
| `crowd-only.json` | amendment 1 (T352) | six layers chained within 2% into one crowd, nothing else proposable |
| `zero-scale-null.json` | Q2 | the null at Scale 0 × 100 (the demo's `null_scale_zero`) |

## Records (`records/`)

| File | What |
|---|---|
| `anchor-learned.json` | easing and the pivot learned, nothing for this skill (version 1, no names) |
| `anchor-not-learned.json` | easing only |
| `learned-group.json` | this skill learned and due, Tile, Caption and Stamp past targets on Mentor Practice 2 |
