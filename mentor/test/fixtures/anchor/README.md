# Skill 5 (set the pivot) fixtures

Saved snapshots and records for `mentor/test/anchor*.test.mjs` (spec 011 FR-027, research R9).
Every snapshot that isn't a live capture says so in its top-level `synthetic` field.

## The rule

**Stand-ins are deleted before merge.** Everything in `stand-in/` is built in the cloud by
`stand-in/build.mjs`, because After Effects isn't there. The live sitting (tasks T233) captures
each one with `node mentor/dev/capture.mjs <file> --times <list>` into this folder under the same
name; the desk block (T234) deletes `stand-in/` (with `build.mjs`) and updates this table. The
tests already prefer a live capture (`load.mjs › fixture()`): this folder first, then spec 004's
own capture of the same name in `../layer-info/` (`practice2b.json`, `overlaps.json`, after its
T133 and T135), then the stand-in.

`synthetic/` stays: spec 011 allows rows 1, 6, 8, 13 (shy), 16 (until L-4), 26 and 27, the
stopwatch case, the 70-key cap case and FR-028's measure edges to be synthetic. `build.mjs`
writes them too; before deleting `stand-in/`, move the synthetic half of `build.mjs` to
`synthetic/build.mjs` (or keep the written files and drop the script).

## The `--times` list

Every Mentor Practice 2 capture is taken with
`--times 3.167,3.667,4.167,4.3,4.667,5.433,6.433` (`answer-key.json › times`): Gauge's rest key,
Pop's, Sled's three Position keys and Gradient's two, which is what `neededTimes()` asks for, so
every layer is sampled where the check compares. Mentor Overlaps needs none beyond its own keys.
Each capture's comp time is the one in the table.

## Files

| File | Source | Comp time | Replaced by |
|---|---|---|---|
| `answer-key.json` | By hand, from the spec, the teaching design and the build scripts' declared values (never by running `mentor/lib/anchor.mjs`) | | Kept; T234 updates any value a live capture shows differently, with a note |
| `load.mjs` | Test helper: loads fixtures (live first), builds a lesson as the session would | | Kept |
| `records/easing-learned.json` | Synthetic record: easing learned, nothing for this skill (T213) | | Kept |
| `records/learned-door.json` | Synthetic record: this skill learned and due, Door and Needle as past targets on Mentor Practice 2 (T225) | | Kept |
| `stand-in/build.mjs` | Writes every stand-in and synthetic: `node mentor/test/fixtures/anchor/stand-in/build.mjs` | | Deleted with `stand-in/` |
| `stand-in/practice2b.json` | Mentor Practice 2's wave B layers from `build-practice-comp-2b.jsx` (Door to Seal, Reveal Matte, Gradient, Background; the older shapes and skill 6's other layers left out) | 0 | Spec 004's `../layer-info/practice2b.json` (T135), or `practice2b.json` here taken with `--times` |
| `stand-in/practice2b-no-size.json` | The same without `comp.width` and `comp.height` (a capture from before spec 004 T165) | 0 | Stays a stand-in until T234 decides: then synthetic |
| `stand-in/overlaps.json` | Mentor Overlaps' Orbit, Depth, Locked Bar, Still, Gauge Dial, Drift, Guide Grid, Rig, Leaf 2, Wipe, Photo from `build-overlaps-b.jsx` | 1 | Spec 004's `../layer-info/overlaps.json` (T133) |
| `stand-in/overlaps-still-pass.json`, `leaf2-pass.json` | Still's pivot moved; Leaf 2's (separated Position, every X key rewritten) | 1 | Live captures in the sitting |
| `stand-in/door-typed.json`, `door-dragged.json`, `wrong-layer.json`, `pop-shrunk.json` | L-4's four mistakes: Door's Anchor Point typed; Door dragged; Pan Behind on Background with Needle meant; Pop's pivot set at Scale 0 | 0, 0, 0, 3.3 | Live captures (quickstart › 3) |
| `stand-in/door-pass.json`, `plaque-pass.json`, `banner-neighbour.json` | Pan Behind correct on Door and Plaque; Banner one place off (its bottom-left corner) | 0 | Live captures |
| `stand-in/sled-slid.json` | L-2: Sled's pivot moved before its keys, only the first Position key rewritten (a guess L-2 replaces) | 0 | Live capture |
| `stand-in/sled-one-key-before.json`, `sled-one-key.json` | L-2 with one Position key, and a second key added | 0 | Live captures |
| `stand-in/lid-pan.json`, `lid-group.json` | L-1: Lid's own anchor moved; a group's anchor moved (the rectangle shifts in its own space) | 0 | Live captures |
| `stand-in/hatch-rig-focus.json` | Hatch Rig's pivot moved with nothing moving (row 16) | 0 | Live capture |
| `stand-in/sign-centred.json`, `sign-left.json` | L-5: Sign as built; Sign left-justified (its rectangle starts at its pivot) | 0 | Live captures |
| `stand-in/demo-separated.json`, `demo-rotated-before.json`, `demo-rotated.json`, `demo-parented.json`, `demo-undone.json` | L-4's demo runs: Tab, Peg turned 30°, Hatch; the demo undone | 0 | Live captures |
| `stand-in/matte-eye-on.json` | Reveal Matte's eye left on (row 12) | 0 | Live capture |
| `stand-in/gauge-at-rest.json`, `gauge-away.json`, `gauge-before-at-rest.json`, `pop-pass.json` | Gauge's pivot set at its 0° key and at its 90° key; Gauge untouched with the playhead on its rest key; Pop's at full size (T220) | 3.167, 4.167, 3.167, 4.3 | Live captures |
| `stand-in/stopwatch.json`, `door-locked.json`, `door-outside.json`, `needle-near-middle.json`, `door-renamed.json`, `door-layer-added.json` | Anchor Point's stopwatch on; Door locked; Door's pivot outside it; Needle's not moved far enough; Tab renamed; a solid added | 0 | Live captures (or synthetic, if the sitting has no time: each is one hand action) |
| `synthetic/measures.json`, `measures-moved.json` | FR-028's edges: an 800 × 60 bar, a 30 × 400 needle, a 10 × 2 line, Scale 200%, Scale [-100, 100] | 0 | Stays |
| `synthetic/edge-before.json`, `edge-0.9.json`, `edge-1.1.json`, `edge-other-moved.json` | Item 2's 0.9 and 1.1 px; item 5's 2 px | 0 | Stays |
| `synthetic/dup-before.json`, `dup-second-pass.json` | Two layers named Card (matching by index) | 0 | Stays |
| `synthetic/row1-expressions.json` | Rows 1, 3, 8: expressions on keyed Position and Rotation; a keyed effect | 0 | Stays |
| `synthetic/row6-hold-*.json` | Row 6: hold keys on Position | 0 | Stays |
| `synthetic/row16-before.json`, `row16-pass.json` | Rows 13 and 16: a shy candidate; a parent with Rotation keys and a child | 0, 1 | Stays (row 16 until L-4) |
| `synthetic/row26-*.json`, `row27-*.json` | Rows 26 and 27: the playhead moved; a time not sampled; no rectangle | 2, 0 | Stays |
| `synthetic/cap70-before.json`, `cap70-pass.json` | A 70-key layer past the 64-sample cap | 0 | Stays |
