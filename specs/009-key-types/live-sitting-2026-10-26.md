# Spec 009 live sitting, 2026-10-26

Hand-back for the 🖐 tasks T031 and T032 (`quickstart.md` › 2 and 3). Run by the cockpit through the
bridge (as in specs 004 and 008), with the builder doing the hand moves; a subagent can't wait on the
builder mid-run. AE 26.5 (`26.5x89`) on macOS 27.0.1, project `discovery/Claude AE Tutor Test.aep`.
Work done on a duplicate, "Mentor Practice 2 KT test" (id 404), of Mentor Practice 2 (id 179). Ran
while spec 008's T031 desk block was being edited in its own worktree (no AE needed there).

## Before the checks

- `practice-now.json` captured from Mentor Practice itself (id 97) before any duplicate was made: 8
  animated layers, and it matches spec 008's `speed-graph/practice-now.json` from earlier today.

## L-4: Mentor Practice 2 as built (FR-021)

- `capture.mjs --compare mentor/test/fixtures/practice2-before.json` **differs** on 11 layers (Gauge,
  Wobble, Pop, Sled, Tile, Caption, Stamp, Row A, Row C, Plate, Gradient): the 2b layers spec 004's
  sitting added after that capture. Against `mentor/test/fixtures/layer-info/practice2b.json` it
  **matches**. Blink, Spinner and Cut are present with key values, unchanged from both.
- **For the spec writer:** quickstart › 2's L-4 row (and anything else naming `practice2-before.json`
  as Mentor Practice 2 "as built") should compare with `practice2b.json`.
- Blink › Opacity at build: 1, 1.4, 1.8, 2.2 s; 100, 0, 100, 0; every side Bezier, speed 0,
  influence 33.33.

## L-1: the mixed pair (row 6, SR-2)

Planted by script on the duplicate and sampled with `valueAtTime` (what a scrub shows).

- **Linear out, hold in** (Blink keys 1 and 2): 100 at 1.0 s, then **0 from 1.001 s** through 1.4 s.
  Every frame 31 to 42 reads 0.
- **Bezier out, hold in** (keys 3 and 4, put back after): 100 at 1.8 s, then **0 from 1.801 s**.
- **Result: it jumps, and it jumps at the start of the pair**, to the second key's value. A held in
  side makes the whole pair snap, just one pair early compared with holding the first key's out side.
- So **SR-2 applies** (hand back to the shared-code owner): `segmentState` calls this pair
  `partly_eased` or `eased`, but After Effects snaps it. Easing would ask to ease a pair that snaps,
  and skill 1 would call a snapping pair "not held".
- For the "wrong side" hint (`SKILL.md` `<!-- L-1 -->`, teaching design § 7 row 4): the learner
  *sees* a snap, so the hint shouldn't say it isn't held. It's about **when**: the value jumps as soon
  as the earlier key passes, instead of holding until the later key.
- `mixed-pair.json` captured with keys 1 and 2 in this state (linear out, hold in); then restored and
  checked equal to `practice2b.json`.

## L-2: Toggle Hold Keyframe at 26.5

- On Blink's key at 1.0 s, **Animation › Toggle Hold Keyframe** set **only the out side** to hold
  (read: in Bezier, out Hold). `HOLD_SIDES = "out"` stays; L-3 needs no repeat.
- Animation menu shortcuts (builder's screenshot): **Toggle Hold Keyframe ⌃⌥⌘H**
  (Control+Option+Command+H); **Keyframe Interpolation… ⌥⌘K**; Keyframe Velocity… ⇧⌘K.
- Right-click on a key: **Toggle Hold Keyframe** and **Keyframe Interpolation…** are both there,
  one above the other, below Select Equal / Previous / Following Keyframes, above Rove Across Time and
  Keyframe Velocity….
- Keyframe Interpolation dialog: **Temporal Interpolation** is the top dropdown (Current Settings,
  Linear, Bezier, Continuous Bezier, Auto Bezier, Hold). With only the out side held it shows "Hold".
  Spatial Interpolation and Roving were greyed out (Opacity).

## L-3: the demo and its undo

Run in-process (`key_types_snapshot` with `skill_options.focus` Blink › Opacity, then
`key_types_demo`), fixture mode off, `AE_MENTOR_HOME` a temp folder.

- Snapshot: focus Blink; targets its three pairs (all `eased`); candidates Blink (3 pairs) and Cut
  (1); held examples Dot 1 and Flag Position; demo target Blink › Opacity 1–1.4 s.
- Demo: key 1 in Bezier, **out Hold**; frames returned 1.367 and 1.433 s (either side of the jump at
  1.4 s). The out influence reads **16.667** after (was 33.33).
- Hand toggle on the same key after the undo (`after-demo-reheld.json`) reads **identically**,
  16.667 included. So that's After Effects resetting the held side's ease, not the demo.
- Key icon: same as the hand-held one (builder).
- Undo: the Edit menu read **"Undo AE Mentor: key-types-demo"**; one undo restored Blink exactly
  (`after-demo-undone.json` equals `practice2b.json` on Blink).

## Captures (T032)

| File | How | Notes |
|---|---|---|
| `practice-now.json` | Mentor Practice itself | See above |
| `mixed-pair.json` | Script plant, L-1 | Keys 1–2 linear out, hold in |
| `after-demo.json` | After the demo, L-3 | |
| `after-demo-undone.json` | After one Edit › Undo | Blink equals as built |
| `after-demo-reheld.json` | Builder's hand toggle on key 1 | Same as `after-demo.json` |
| `blink-one-held.json` | Script: key 1.4 s out side hold | What Toggle Hold Keyframe writes (L-2) |
| `blink-all-held.json` | Script: every Blink side hold | |
| `wrong-side.json` | Script: key 1.4 s in side hold | Per L-1, this pair (1.4–1.8 s) *snaps*, at 1.4 s |
| `hold-at-zero.json` | Script: key 1.4 s (value 0) out side hold | Same shape as `blink-one-held.json`, as the stand-ins had it |
| `separated-x-held.json` | Script: Dot 3 X Position key 0.5 s out hold | Y untouched |
| `spinner-eased.json` | Script: Spinner key 0.25 s out side Easy Ease (speed 0, 33.33), in stays linear | Setting the type alone kept speed 90, which still moves at constant speed, so a real ease was planted |
| `select-all-hold.json` | Script: Blink, Cut, Card (Position, Scale), Pause, every side hold | |
| `loopout-blink.json` | Script: shape "Loop Blink" (index 41), Opacity 100 → 0 at 6–6.25 s linear, `loopOut()` on | |
| `hold-only-effect.json` | Script: shape "Toggle" (41) with Checkbox Control keyed 1 → 0 at 6–6.5 s; text "Label" (42) Source Text keyed at 6 and 7 s | AE made both hold on its own; Source Text values read null |
| `nested-opacity.json` | Script: shape "Swatch" (41) Fill Opacity 0 → 100; text **"Tagline"** (42) Animator 1 Opacity 100 → 0, both 6–6.5 s linear | The stand-in's "Caption" is taken by a 2b layer on Mentor Practice 2, so renamed |
| `overlap-layers.json` | Script: Icon precomp (41), Ghost eye off (42), Matte (43) as Alpha matte for Window (44), Rig null (45), Fader (46), Still (47) | AE turned Matte's eye off itself. **No "Old Values" layer**: unknown values can't be planted live, so row 22 keeps a synthetic fixture. Unlike the stand-in, every added layer has `layer_info` (wave B reads them) |
| `keys-moved.json` | Script: Blink key 3 moved 1.8 → 1.9 s | Key 4's in influence reads 33.331 after (AE rounding) |
| `practice-blink-before.json`, `practice-blink-after.json` | Duplicate "Mentor Practice Blink" (id 469); after: Logo Opacity 100, 0, 100, 0 at 3, 3.5, 4, 4.5 s linear | |

Every plant started from a reset that copied Blink, Spinner, Cut, Card, Pause and Dot 3's key types and
eases back from Mentor Practice 2, and each capture was diffed against `practice2b.json` to confirm only
the planted change showed. The added layers were moved to the bottom so Blink stays index 1 (pair ids).

## After the captures

- Both duplicates deleted; Mentor Practice 2 **matches** `practice2b.json`, Mentor Practice
  **matches** `practice-now.json`. No capture holds a user or folder name. `.aep` saved.
- `npm test`: **720 pass, 28 fail** (751). `load.mjs` reads a live capture over its stand-in as soon as
  it exists, so the key-types tests now read live data against an answer key written from the
  stand-ins. Expected differences for T033: comp ids (404, 469), the 2b layers, added layers at 41+
  not 15+, held sides at 16.667, "Tagline", no live "Old Values", `layer_info` on added layers, and
  L-1's mixed pair (SR-2).

## For the hand-back

- **SR-2 (shared-code owner):** a mixed pair (linear or bezier out, hold in) snaps, at its first key.
  `segmentState` should treat it as held, or as its own state; easing has the same blind spot.
- **Spec writer:** L-4 should compare with `practice2b.json`; row 6 / FR-022's "not held" no longer
  matches what AE does; quickstart › 3 should add `overlap-layers.json` and say "Tagline".
- **T034:** `HOLD_SIDES` stays `"out"`. `SKILL.md` L-2 places: Animation › Toggle Hold Keyframe
  (⌃⌥⌘H), or right-click the key › Toggle Hold Keyframe; linear by Animation › Keyframe
  Interpolation… (⌥⌘K) or right-click › Keyframe Interpolation…, Temporal Interpolation dropdown ›
  Linear. Wrong-side hint from L-1: about *when* it snaps, not whether.
