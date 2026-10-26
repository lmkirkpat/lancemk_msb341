# Spec 008 live sitting, 2026-10-26

Hand-back for the 🖐 tasks T029 to T032 (`quickstart.md` › 2 to 5). Run by the cockpit through the
bridge (as in spec 004's sitting), with the builder doing the hand moves. AE 26.5 (`26.5x89`) on
macOS 27.0.1, project `discovery/Claude AE Tutor Test.aep`. Work done on a duplicate, "Mentor
Practice SG test" (id 382), of Mentor Practice (id 97).

## Before the checks

- Mentor Practice read as expected: Title Position 4 keys (0.5, 1.5, 3, 4.367 s) and Scale 2 keys
  (0.5, 1.5 s), all Easy Ease (33.333, speed 0). Position has one ease dimension, Scale three (2D
  layer).
- `practice-now.json` captured from Mentor Practice itself before the duplicate was made (8
  animated layers; no user name or folder path).

## L-1: labels and shortcut (T029)

- Menu path: **Animation › Keyframe Velocity…**, shortcut **⌘⇧K** (Command+Shift+K).
- Graph Editor graph-type menu, top to bottom: "Auto-Select Graph Type", "Edit Value Graph",
  "Edit Speed Graph", "Show Reference Graph", then Show Audio Waveforms, Show Layer In/Out Points,
  Show Layer Markers, Show Graph Tool Tips, Show Expression Editor, Allow Keyframes Between Frames.
  "Edit Speed Graph" and "Auto-Select Graph Type" are spelled as `SKILL.md` assumes. Value graph
  was the checked default on this machine.

## L-2: Scale dimensions (T029)

- Dragging Title Scale 0.5 s's out influence handle in the speed graph changed **X and Y together**
  (both 91.35853), and the read shows the **third dimension unchanged** at 33.333.
- Keyframe Velocity shows **one field per dimension** (X and Y, no Z on a 2D layer), each side with
  a **Lock Dimensions** checkbox, on by default. So one dimension *can* be shaped alone, by
  unticking Lock Dimensions in the dialog; the speed-graph drag alone doesn't do it.
- Consequence: FR-011's "moving dimensions only" is needed (the unused Z never follows a drag) and
  is what `movingDims` already does (Z's value doesn't change, so it isn't graded).
  `planted-one-scale-dim.json` stays, made with Lock Dimensions off.

## L-3: the demo and its undo (T029)

Run in-process (`speed_graph_snapshot` with `focus_layers: ["Title"]`, then `speed_graph_demo`),
fixture mode off, `AE_MENTOR_HOME` a temp folder.

- Snapshot: demo target Title › Position 0.5–1.5 s. Focus pairs: Position 0.5–1.5, 1.5–3,
  3–4.367 s, Scale 0.5–1.5 s **and Opacity 0.5–1.5 s**. Right per spec › 469 (Title Opacity is eased);
  quickstart › 5's expected list just leaves it out (wording fix for the spec writer).
- After the demo: 0.5 s out **15.13**, 1.5 s in **79.87**, read back exactly; speeds 0 and Bezier
  kept; 0.5 s in side and 1.5 s out side untouched. `DEMO_OUT`/`DEMO_IN` stay.
- **Cockpit slip:** the driver was run a second time, which started a fresh lesson (new temp home)
  and applied a second demo on 1.5–3 s, because the fresh lesson saw 0.5–1.5 s as already shaped.
  Behavior worth knowing: a lesson with no record of its own demo treats the demo pair as the
  learner's and moves the demo on.
- Undo: Edit menu read "Undo AE Mentor: speed-graph-demo"; two undos (one per demo), same label,
  restored all four keys to 33.333/33.333, speed 0, Bezier. One undo step per demo. Read-only
  `ae_run_script` calls leave no undo steps.

## L-4: one side of a shared key (T029)

- Dragging Title Position 1.5 s's **in-side** influence handle in the speed graph (to the 100
  limit) left its **out side unchanged**: influence 33.333, speed 0. Key not temporal-continuous,
  not auto-Bezier (Easy Ease leaves both off), so the two sides move independently.
- Shared-key hint for `SKILL.md` (T031): the 1.5 s key has two handles; the left one shapes how the
  first move lands, the right one how the next move starts. Dragging one leaves the other alone.

## Captures (T030)

Split agreed with the builder: shapes that are just values were set by script on the duplicate
(each from a reset to Mentor Practice's state), and only shapes where the hand move itself is under
test were made by hand (dragged up, F9 again, one Scale dimension, the learner's own shape after
the demo, L-6's by-eye reads).

- **Comp identity:** a reset duplicate matches `practice-now.json` key for key; only `comp.id`
  (97 → 382) and `comp.name` differ. The check compares comp ids (`mentor/lib/speed-graph.mjs:400`),
  so every planted capture would read "a different comp". T031: put Mentor Practice's id and name
  on the planted captures and say so in the README's provenance. In a real lesson the learner
  shapes Mentor Practice itself, so the id never changes.
- Scripted: `planted-15-80.json` and `planted-shared-key.json` (same state: 0.5 s out 15, 1.5 s in
  80, 1.5 s out 33.333), `planted-33-33.json` (the reset), `planted-hold-in.json`.

## L-7: hold into the landing key (T030)

- 0.5 s out Bezier, 1.5 s in Hold, 1.5 s out Bezier. **What plays:** Title sits still from 0.5 s,
  then jumps at 1.5 s. So "not a candidate, fails c" is right.
- **But the speed graph still shows an incoming influence handle on the 1.5 s key.** `SKILL.md:161`
  says "it has no handle on that side", which the learner can see is false. Proposed for T031:
  "The key at 1.5 s is set to hold on that side, so the move sits still and then jumps. The handle
  there does nothing until you ease the key. Ease it first." (Linear's handle not checked live.)

## More captures (T030)

- Scripted: `planted-long-both.json` (Scale 0.5 s out 90, 1.5 s in 95, all three dimensions),
  `planted-in-out-mixed.json` (Position 0.5 s **in** 80, out left at 33.333),
  `planted-expression-off.json` (Logo Rotation's expression kept, turned off),
  `planted-key-added.json` (AE's own `addKey` on Title Scale at 1 s: Bezier, influence 33.333,
  **speed 30** so the curve stays smooth; the stand-in had speed 0).
- Demo trio: `after-demo.json` (one driver run, 0.5 s out 15.13, 1.5 s in 79.87);
  `after-demo-undone.json` after one Edit › Undo, which matched `planted-33-33.json`;
  `after-demo-redone.json`, the builder's own speed-graph drag: **18.49 / 83.63**, speeds 0
  (the stand-in assumed 20/85).

## L-6: where the speed graph peaks (T030, SC-004)

All four on Title at once, read by eye in the speed graph before the tool's answer was shown:

| Pair | Shape | Builder saw | `fastest` | Agree |
|---|---|---|---|---|
| Position 0.5–1.5 s | 18.49 / 83.63 (by hand) | first third | first | ✓ |
| Position 1.5–3 s | 15 / 80 | first third | first | ✓ |
| Position 3–4.367 s | 60 / 70 (sum > 100) | middle third | middle | ✓ |
| Scale 0.5–1.5 s | 33.333 / 33.333 | exact middle | middle | ✓ |

SC-004: 3 of 3 (33/33, 15/80, the in-between hand shape). The over-100 pair agrees too (logged,
not counted).

## L-5: landing handle dragged up (T030)

Title reset to Easy Ease; the builder dragged the 1.5 s incoming handle "up a little" on Position
and on Scale, aiming straight up.

- `planted-dragged-up-small.json`: Position 1.5 s in **speed 2.91, influence 32.115**; Scale 1.5 s
  in **speed 1.411, influence 26.963** on X and Y (Z untouched at 0 / 33.333, as in L-2).
- `pairShape`: both fail **a, d**; fastest part middle on both (answer key: middle ✓). `REST_SHARE`
  0.05 catches the small drag on both (Position about 7% of its average speed, Scale about 14%),
  so no tuning is needed for "a little".
- **Finding (answer key and `drag_sideways`):** a hand drag "straight up" also moves the influence
  (33.3 → 32.1 and 27.0). The answer key expects **a, b, d** with `drag_sideways: true`, but b and
  `drag_sideways` both use "within 1 point of 33.33" (`DEFAULT_TOL`), so live gives **a, d** and
  the "drag that handle sideways" hint won't fire for exactly the learner it's written for. For T031
  or the spec writer: base `drag_sideways` on "landing influence not long" (for example under
  about 40) rather than "within 1 point of the default", and update the answer key's b for dragged
  up.
- `planted-dragged-up-large.json` (dragged further, purely up this time: influence unchanged):
  Position 1.5 s in **speed 36.336**, Scale **7.954** (X, Y). Both fail **a, d** (same b and
  `drag_sideways` gap). Fastest: Scale middle (key ✓); Position **middle and last** (peak near the
  two-thirds line) where the key says **last**. Builder by eye, with the shape re-planted from the
  captured values: **middle third**. The tool's answer includes what plays; the key's "last"
  (research R2's 1.0 peak) is wrong for a live drag. Fix the key in T031.

## One Scale dimension and Easy Ease again (T030)

- `planted-one-scale-dim.json`, by hand in Keyframe Velocity with Lock Dimensions unticked: Scale
  0.5 s out X 15, 1.5 s in X 80, Y (and Z) left at 33.333. `pairShape`: fails a, b, dimension
  **height**; fastest **first**. Matches the answer key exactly.
- `planted-easy-ease-again.json` (L-6's F9 part): Scale scripted to 15/80 on every dimension, then
  the builder selected both keys and pressed **F9**. Both facing sides (and the far sides) of both
  keys reset to 33.333, speed 0, Bezier, on all three dimensions; the graph read as the default
  hump. Grades a, b, as the key expects (back to default with `seen_shaped`).

## Close of § 3

- Duplicate deleted; `capture.mjs --compare practice-now.json` on Mentor Practice: **Matches**.
- 16 live captures in `mentor/test/fixtures/speed-graph/`; none holds a user name or folder path.
- `.aep` saved (71 items, as before the sitting); AE lock released.
- `npm test` mid-sitting: 20 speed-graph tests red, as expected while live and stand-in files were
  mixed (comp id 382 vs 97, 4.367 vs 4.37 s). T031 clears them.

## For T031 (desk block) and the spec writer

1. Planted captures: set `comp.id` 97 and `comp.name` "Mentor Practice" (the duplicate's identity
   is the only difference); note it in the README.
2. `SKILL.md:161` `no_handle`: AE shows a handle on a hold side; reword (see L-7).
3. `drag_sideways` and b for dragged up: a real drag moves influence by more than 1 point (L-5).
4. Answer key: dragged-up-large Position fastest is middle (and last), not last only (L-5).
5. Answer key and stand-in values to update from live: the learner's own shape is 18.49 / 83.63,
   the added key has speed 30, and the times are 4.367 s, not 4.37.
6. `SKILL.md` L-1 slots: Animation › Keyframe Velocity… (⌘⇧K); "Edit Speed Graph" and
   "Auto-Select Graph Type" as written. Shared-key hint from L-4.
7. Quickstart › 5: the default focus leaves Opacity out; say so (L-3).
8. `REST_SHARE` 0.05: no change; it catches the small drag on both properties.

## Corrections after the hand-back (found by the skill-builder in T031, checked by the cockpit)

- **Dragged up, all three landings:** in both dragged-up captures, Position's 3 s and 4.367 s
  landings also carry speed 2.91 (influence 32.521 and 32.442), not only 1.5 s. The cockpit read
  only pair 1 during L-5. Most likely every Position key was selected when the handle was dragged,
  which a learner could also do. The answer key now grades P2 and P3 as arriving moving.
- **Position not reset before H5 and H6:** `planted-one-scale-dim.json` and
  `planted-easy-ease-again.json` still hold the large drag on Position's 1.5 s landing (32.115,
  speed 36.336). The cockpit's "reset Position" call after re-planting the large drag for the
  by-eye read reported influence 33.333 but didn't leave the key at Easy Ease; the cause wasn't
  found. Each file's subject (Scale) grades as the key says; the answer key also grades P1 there.
- **Hold side influence:** AE stores influence 16.667 on a hold side, so b doesn't fire on
  `planted-hold-in.json` (fails a, c).
