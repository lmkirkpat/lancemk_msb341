# Spec 011 live sitting, 2026-10-26

Hand-back for the 🖐 tasks T232 and T233 (`quickstart.md` › 2 and 3). Run by the cockpit through the
bridge (as in specs 004, 008, 009 and 010), with the builder doing the hand moves. AE 26.5
(`26.5x89`) on macOS 27.0.1, project `discovery/Claude AE Tutor Test.aep`, Mentor Practice 2 (179).

Before the sitting, `main` was merged into `skill-5-anchor` (64 commits behind, no conflicts), so
the branch has spec 004's live `layer-info/practice2b.json` and the current `capture.mjs`. With that
in, `load.mjs` prefers the live base over the stand-in and 55 of 905 tests fail until the desk block
(T234).

**Departures from the quickstart.** Scripted plants and the demo runs were done on Mentor Practice 2
itself, each reset and checked equal to the base before the next, so the captures keep comp 179.
The hand moves for L-2, L-3 and the Pop mistake were done on duplicates, one per step, so the
builder could do them in a row. Those captures say so in a top-level `captured_from` field, and
their comp id and name were set to Mentor Practice 2's. `capture.mjs --compare` doesn't compare
`layer_info`, so it can't see static layers. Every reset was checked with a strict compare of
`layer_info`, `layers` and `comp` against `anchor/practice2b.json` instead.

## L-1: Pan Behind on a shape (Lid)

- **The pivot isn't on the shape.** Lid's anchor `[0, 150]` sits 120 px below its 160 × 60
  rectangle (row 23), and the builder first couldn't find any crosshair. With Lid clicked in the
  timeline it was there, below the shape. **For `SKILL.md`:** when a shape's pivot sits outside it,
  say where to look ("below the shape"), not only that it's outside.
- **On the layer:** the Transform anchor moved, `[0, 150]` → `[-80, 0]` (middle-left), and Position
  by the same amount, (640, 450) → (560, 300). Nothing moved on screen. Snapping (⌘) worked.
  `rect` and `rect_extents` both read 160 × 60 at [-80, -30], the shape as drawn (no stroke).
  **`SHAPES_DEFAULT` can be true; `RECT_KIND.shape` stays `rect`.** Undo read **"Undo Pan"**, one
  step. `lid-pan.json`.
- **On the group (Contents › Rectangle 1):** AE changed the **group's** Anchor and Position
  together (both about −47.7, −4.4), so the rectangle didn't move in layer space either. The
  snapshot is **identical to the base** (`lid-group.json` strict-matches `practice2b.json`).
  **Finding for the spec writer:** row 22's `group_anchor` hint assumed the rectangle shifts. Live,
  nothing this skill reads can tell a group-anchor move from no change. The check will say the
  pivot hasn't moved, which is true of the layer's pivot. The hint needs a different signal (a
  group transform read) or a "not seen" wording. Reset by script to [0, 0] for both.

## L-2: Pan Behind with Position keyed (Sled, keys at frames 110, 125, 140)

| Case | What AE did | File |
|---|---|---|
| Playhead **on** the first key (110) | Rewrote **only that key** (320 → 270); 125 and 140 unchanged. No new key. Sled still at 110, slides 50 px at 125 and 140 | `sled-on-key.json` (extra) |
| Playhead at **0**, before the keys | **Added a key at frame 0** (270, 960); the three keys unchanged. Still at 0; 50 px right at every old key | `sled-slid.json` |
| One Position key (110), playhead at 0 | **Added a key at frame 0** (270, 960); the old key unchanged | `sled-one-key-before.json`, `sled-one-key.json` |

After the drag at 0, Sled sits still at frame 0 and draws 50 px right from 3;20 onward (the
anchor is 50 px left, and Position after frame 0 is unchanged). The builder confirmed this on
screen; their first note said "sits still" by a typo. This is the slide the check's item 4 is for.

**For `<!-- L-2 -->`:** with Position keyed, Pan Behind changes or adds **one** Position key, at
the playhead. Other keys stay put, so the layer slides at them. The stand-in's guess (first key
rewritten) was wrong for the playhead-before-keys case.

## L-3: as seen at 26.5

- **Pan Behind on another layer:** with Door selected, dragging on Needle moved **Needle's** pivot
  (A `[0, 200]`, P 405). Pan Behind acts on the layer under the cursor, not the selected one, so
  row 25's wrong-layer mistake happens.
- **A selected eye-off matte (Reveal Matte):** no crosshair, can't be dragged. Row 12's "turn its
  eye back on first" is needed if a lesson ever names a matte.
- **Layer › Transform › Center Anchor Point in Layer Content:** present at 26.5. On Lid it put the
  pivot at the shape's centre (A `[0, 0]`, P (640, 300)), nothing moved. It can go in `SKILL.md`
  for the centre place.
- **A new shape layer's pivot:** drawn with the Rectangle tool and nothing selected, the layer's
  anchor is `[0, 0]` at the **comp centre** (960, 540), away from the drawn rectangle. Another
  "pivot outside the shape" case (row 23).

## L-4: the four mistakes and the demo runs

- **Mistakes**, scripted as the hand move would leave them, captured, reset: `door-typed.json`
  (Anchor X typed 0, Position not), `door-dragged.json` (Position 260, 340), `wrong-layer.json`
  (Pan Behind on Background to 400, 300, which L-3 shows is a real hand path).
- **Pop's pivot at Scale 0** (by hand): the builder "wouldn't let me drag", but AE **did set the
  anchor**, to `[120, 960]` (Pop's Position, read as a layer point), with Position unchanged. Nothing
  shows at 3;09, so the learner sees no change. At full size Pop draws far off its place.
  `pop-shrunk.json` is this live state. The answer key's `away_from_rest` expected the stand-in's
  `[60, 120]`; the desk block decides whether this reads as `away_from_rest`, `outside` or both.
- **`anchor_demo`** (in-process, temp `AE_MENTOR_HOME`), each footprint before and after by
  `comp-space.footprint`, then one Edit › Undo (`app.executeCommand(16)`) and a strict compare:

| Run | Focus | Result | Footprint | One undo |
|---|---|---|---|---|
| Tab (unseparated) | Door, Tab middle-left | A 100,25 → 0,25; P 620 → 520 | 0 px | Back to the base |
| Tab, Position **separated** | same | Same values written as X and Y, `separated: true`, no key | 0 px | Back to the plant |
| Peg turned 30° | Door, Peg top-left | A 15,15 → 0,0; P → 814.51, 459.51 | 0.001 px | Back to the plant |
| Hatch (parented to Hatch Rig) | Door, Hatch middle-left | A 75,40 → 0,40; P 0,0 → −75,0 | 0 px | Back to the base |
| Tab locked **before** the snapshot | Door, Tab | The snapshot put the demo on **Door**; demo ran there | 0 px | Back to the plant |
| Tab locked **after** the snapshot | Door, Tab | **Refused**: `ANCHOR_REFUSED`, reason `locked`; Tab unchanged | | Nothing to undo |

No snippet fix needed. Unlike spec 010's L-4, the snapshot doesn't offer a locked layer as the demo.

## L-5: Sign's rectangle vs its letters

Everything but Sign switched off on a duplicate, frame 0 saved as PNG, ink bounds measured:

| Justify | `rect` on screen (left–right × top–bottom) | Ink | Within 1 px |
|---|---|---|---|
| Centred | 126.6–272.2 × 725.5–795.6 | 126–273 × 725–796 | Yes |
| Left | 202.5–348.1 × 725.5–795.6 | 202–348 × 725–796 | Yes |

**`RECT_KIND.text` stays `rect`.** Left-justified, the rectangle starts at **+2.45** from the
pivot, not at 0 as the stand-in assumed.

## Captures (T233)

| File | How |
|---|---|
| `practice2b.json`, `demo-undone.json`, `sign-centred.json` | The base, with `--times` |
| `door-typed`, `door-dragged`, `wrong-layer`, `door-pass`, `plaque-pass`, `banner-neighbour`, `hatch-rig-focus` (to 50, 50), `sign-left`, `matte-eye-on`, `gauge-at-rest`, `gauge-away`, `pop-pass`, `gauge-before-at-rest`, `stopwatch`, `door-locked`, `door-outside`, `needle-near-middle`, `door-renamed`, `door-layer-added`, `demo-rotated-before` | Script plant on 179, Pan Behind's values (Position += Scale × Rotation × the anchor's change), then reset |
| `demo-separated` (Tab unseparated), `demo-separated-xy` (extra: Position separated), `demo-rotated`, `demo-parented` | After `anchor_demo` |
| `lid-pan`, `lid-group` | Builder, on 179 |
| `sled-on-key` (extra), `sled-slid`, `sled-one-key-before`, `sled-one-key`, `pop-shrunk` | Builder, on duplicates (`captured_from`) |

`door-layer-added`: the new solid lands at index 1 and renumbers every layer below (as spec 004's
sitting found). All `--times 3.167,3.667,4.167,4.3,4.667,5.433,6.433`.

## After the captures

All seven duplicates deleted. Mentor Practice 2 strict-matches `anchor/practice2b.json` and
`--compare` matches `layer-info/practice2b.json`. The project has 72 items, as before. No capture
holds a user or folder name. `.aep` saved.

## For the hand-back

- **T234:** the answer key needs the live values for `lid-group` (no change seen), `sled-slid` (key
  added at 0, not the first key rewritten), `sign-left` (left 2.45), `pop-shrunk` (anchor 120, 960),
  `hatch-rig-focus` (the null's anchor starts at 0, 0) and Hatch's Position (0, 0 under its parent).
  Two extras: `sled-on-key.json`, `demo-separated-xy.json`.
- **T235:** `SHAPES_DEFAULT = true`, `RECT_KIND.shape` and `.text` stay `rect`. `<!-- L-2 -->`: one
  key changed or added at the playhead. `<!-- L-3 -->`: Pan Behind acts on the layer under the
  cursor; an eye-off matte shows no crosshair; Center Anchor Point in Layer Content exists and
  centres; a new shape's pivot is at the comp centre. No snippet fix.
- **Spec writer:** row 22's group hint can't fire on what the snapshot reads (L-1). A shape whose
  pivot sits outside needs a "where to look" line. Pop's Scale-0 mistake leaves an anchor far
  outside, not near the rest place.
