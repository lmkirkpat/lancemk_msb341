# Skill 5 (set the pivot) fixtures

Saved snapshots and records for `mentor/test/anchor*.test.mjs` (spec 011 FR-027, research R9).
Every snapshot that isn't a live capture says so in its top-level `synthetic` field.

## Provenance (since T234, 2026-10-26)

Every snapshot in this folder is a **live capture** from the 2026-10-26 sitting
(`specs/011-anchor/live-sitting-2026-10-26.md`), saved with `node mentor/dev/capture.mjs` on AE 26.5,
except `synthetic/`, which spec 011 allows (rows 1, 6, 8, 13 (shy), 16, 26 and 27, the 70-key cap
case and FR-028's measure edges). The stand-ins and their `stand-in/build.mjs`, which also wrote
`synthetic/`, are deleted (in git history before T234). The synthetic files stay as written.

- **Comps.** Every capture is of Mentor Practice 2 (comp 179; the stand-ins used 300). The plants
  and demo runs were done on comp 179 itself, each reset after. The hand moves for L-2 and Pop's
  Scale-0 mistake were done on duplicates: those captures say so in a top-level `captured_from`,
  and their comp id and name were set to 179's. Nothing else in a capture was changed.
- **Bases.** `practice2b.json` here is Mentor Practice 2 as built, all 40 layers (the older shapes,
  wave B and skill 6's), taken with the `--times` list below; `demo-undone.json` and
  `sign-centred.json` equal it. Spec 004's `../layer-info/practice2b.json` is the same comp without
  the `--times` samples. Mentor Overlaps is spec 004's `../layer-info/overlaps.json` (T133).
  `load.mjs › fixture()` reads this folder first, then `../layer-info/`.
- **Derived in the tests, not saved:** the base without `comp.width` and `comp.height` (a read
  from before spec 004 T165) is a copy of `practice2b.json` with them deleted; Still's and Leaf 2's
  passes on Mentor Overlaps (rows 2 and 7) are copies of the live Overlaps with Pan Behind's values
  written by hand in `anchor-overlap.test.mjs`; a base with its playhead at 3.667 s (for
  `sled-on-key.json`) is a copy of `practice2b.json` with `comp.time` set, which its samples cover.
- **The answer key** (`answer-key.json`) is written by hand from the spec, the teaching design and
  the build scripts' declared values, never by running `mentor/lib/anchor.mjs`. T234 updated every
  value the live captures show differently, each with a `note` (or in `live_notes`).

## The `--times` list

Every Mentor Practice 2 capture is taken with
`--times 3.167,3.667,4.167,4.3,4.667,5.433,6.433` (`answer-key.json › times.practice2b`): Gauge's
rest key, Pop's, Sled's three Position keys and Gradient's two. On the live comp, with all 40
layers, `neededTimes()` asked for 30 times until D-4; since T246 the 16 layers with Position keys at
two or more times are never (`position_moves`) and drop out, leaving 4 (`times.needed_practice2b`:
Spinner's, Gauge's, Pop's and Badge's rest keys). The captures hold the list above, `comp.time` and
each layer's own key times, not 0.25 or 4.5 on every layer, so a lesson's snapshot still reads twice.

`sled-slid` and `sled-on-key` are outside the lesson path since D-4 (Sled has three Position key
times, so no lesson can target it): the tests call the check on Sled directly (`load.mjs ›
lessonDirect`) to keep item 4 tested on three keys. `sled-one-key` against `sled-one-key-before` is
the one-key case a lesson can reach.

## Files

| File | What | Comp time | How |
|---|---|---|---|
| `answer-key.json` | Buckets, ranks, places, check times and hints, by hand | | Hand; T234 notes on each live change |
| `load.mjs` | Test helper: loads fixtures, builds a lesson as the session would | | |
| `records/easing-learned.json` | Synthetic record: easing learned, nothing for this skill (T213) | | Synthetic |
| `records/learned-door.json` | Synthetic record: this skill learned and due, Door and Needle as past targets (T225) | | Synthetic |
| `practice2b.json`, `demo-undone.json`, `sign-centred.json` | The base, with `--times`; the demo undone; Sign as built (L-5) | 0 | Live |
| `door-typed.json`, `door-dragged.json`, `wrong-layer.json` | L-4's mistakes: Door's Anchor Point typed; Door dragged; Pan Behind on Background with Needle meant | 0 | Live, script plant |
| `pop-shrunk.json` | L-4: Pop's pivot set at Scale 0. AE set the anchor to [120, 960] (Pop's Position as a layer point), Position unchanged | 3.3 | Live, **by hand**, duplicate |
| `door-pass.json`, `plaque-pass.json`, `banner-neighbour.json` | Pan Behind right on Door and Plaque; Banner one place off (its bottom-left corner) | 0 | Live, script plant |
| `sled-slid.json` | L-2, playhead at 0 before the keys: **AE added a Position key at 0**, the three keys unchanged (the stand-in guessed the first was rewritten) | 0 | Live, **by hand**, duplicate |
| `sled-on-key.json` | Extra, L-2, playhead on the first key: only that key rewritten, no key added | 3.667 | Live, **by hand**, duplicate |
| `sled-one-key-before.json`, `sled-one-key.json` | L-2 with one Position key; Pan Behind at 0 added a key there | 0 | Live, **by hand**, duplicate |
| `lid-pan.json` | L-1: Pan Behind on Lid's own anchor, to the middle of its left edge | 0 | Live, **by hand** |
| `lid-group.json` | L-1: the group's anchor moved (Contents › Rectangle 1). AE moved the group's Anchor and Position together, so **the snapshot equals the base** | 0 | Live, **by hand** |
| `hatch-rig-focus.json` | Hatch Rig's pivot moved from [0, 0] to [50, 50] with nothing moving (row 16). Hatch's own Position is [0, 0] under it | 0 | Live, script plant |
| `sign-left.json` | L-5: Sign left-justified; its rectangle starts 2.455 px right of its pivot | 0 | Live, script plant |
| `demo-separated.json`, `demo-rotated-before.json`, `demo-rotated.json`, `demo-parented.json` | L-4's demo runs: Tab; Peg turned 30° (before and after); Hatch | 0 | Live, after `anchor_demo` |
| `demo-separated-xy.json` | Extra, L-4: the demo on Tab with Position separated (written as X and Y) | 0 | Live, after `anchor_demo` |
| `matte-eye-on.json` | Reveal Matte's eye left on (row 12) | 0 | Live, script plant |
| `gauge-at-rest.json`, `gauge-away.json`, `gauge-before-at-rest.json`, `pop-pass.json` | Gauge's pivot set at its 0° key and at its 90° key; Gauge untouched with the playhead on its rest key; Pop's at full size | 3.167, 4.167, 3.167, 4.3 | Live, script plant |
| `stopwatch.json`, `door-locked.json`, `door-outside.json`, `needle-near-middle.json`, `door-renamed.json`, `door-layer-added.json` | Anchor Point's stopwatch on; Door locked; Door's pivot outside it; Needle's not moved far enough; Tab renamed; a solid added (index 1, every layer below renumbered) | 0 | Live, script plant |
| `synthetic/measures.json`, `measures-moved.json` | FR-028's edges: an 800 × 60 bar, a 30 × 400 needle, a 10 × 2 line, Scale 200%, Scale [-100, 100] | 0 | Synthetic |
| `synthetic/edge-before.json`, `edge-0.9.json`, `edge-1.1.json`, `edge-other-moved.json` | Item 2's 0.9 and 1.1 px; item 5's 2 px | 0 | Synthetic |
| `synthetic/dup-before.json`, `dup-second-pass.json` | Two layers named Card (matching by index) | 0 | Synthetic |
| `synthetic/row1-expressions.json` | Rows 1, 3, 8: expressions on keyed Position and Rotation; a keyed effect | 0 | Synthetic |
| `synthetic/row6-hold-*.json` | Row 6: hold keys on Position | 0 | Synthetic |
| `synthetic/row16-before.json`, `row16-pass.json` | Rows 13 and 16: a shy candidate; a parent with Rotation keys and a child | 0, 1 | Synthetic |
| `synthetic/row26-*.json`, `row27-*.json` | Rows 26 and 27: the playhead moved; a time not sampled; no rectangle | 2, 0 | Synthetic |
| `synthetic/cap70-before.json`, `cap70-pass.json` | A 70-key layer past the 64-sample cap | 0 | Synthetic |
