# Skill 1 (key types) fixtures

Spec 009's saved snapshots, answer key and test records. Tests load snapshots through `load.mjs`.
Every snapshot is a live capture from the 2026-10-26 sitting
(`specs/009-key-types/live-sitting-2026-10-26.md`, T031 and T032), taken with
`node mentor/dev/capture.mjs` in AE 26.5 on `discovery/Claude AE Tutor Test.aep`, apart from the one
synthetic shape in `synthetic/` (row 22, below). The stand-ins were deleted in T033.

**Comp identity:** `practice-now.json` is Mentor Practice itself (id 97). The Mentor Practice 2
captures were taken on a duplicate, "Mentor Practice 2 KT test" (id 404), deleted before the `.aep`
was saved. Reset, the duplicate matched Mentor Practice 2 as built (`../layer-info/practice2b.json`)
key for key: `after-demo-undone.json` differs from it only in `taken_at`, `comp.id` and `comp.name`,
and each other capture only in its planted change. The check grades only the lesson's own comp, so
T033 set `comp.id` 179 and `comp.name` "Mentor Practice 2" on those 16 captures (as spec 008's T031
did for its duplicate); nothing else was edited. `practice-blink-before.json` and
`practice-blink-after.json` keep their own duplicate's id (469, "Mentor Practice Blink"): they are
only read against each other.

**Rule:** `answer-key.json` is written by hand from the spec, not by running the code (SC-003). A live
capture that disagrees with it wins only where it's what After Effects does (ids, indexes, names,
layers the live comp has); each such change carries a `note` in its entry.

## Snapshots

| File | Shape (overlap row) | Source |
|---|---|---|
| `../layer-info/practice2b.json` (read as `practice2b.json`) | Mentor Practice 2 as built, with spec 004's wave B layers | **Live**, spec 004 wave B's capture (T132, T135). L-4 matched it (it doesn't match `../practice2-before.json`, taken before the 2b layers were added). Baseline for every Mentor Practice 2 check |
| `practice-now.json` | Mentor Practice as it is (FR-008) | **Live**, Mentor Practice itself, before any duplicate |
| `blink-one-held.json` | Blink's second pair held (KT-d) | **Live**, script: key 1.4 s out side hold, what Toggle Hold Keyframe writes (L-2) |
| `blink-all-held.json` | Every Blink key held both sides (pass) | **Live**, script |
| `select-all-hold.json` | Blink, Cut, Card (Position, Scale) and Pause all held (rows 16, 19, KT-f) | **Live**, script, every side hold |
| `wrong-side.json` | Blink's second key held on its in side only (FR-011) | **Live**, script. Per L-1 After Effects snaps this pair (1–1.4 s) at its first key |
| `mixed-pair.json` | First key linear out, second key hold in (row 6, L-1) | **Live**, script. After Effects snaps it at 1 s (L-1, SR-2) |
| `separated-x-held.json` | Dot 3: X Position held, Y not (row 7) | **Live**, script: X key 0.5 s out hold |
| `hold-at-zero.json` | Blink held at Opacity 0 (row 12) | **Live**, script: key 1.4 s (value 0) out hold; same shape as `blink-one-held.json` |
| `loopout-blink.json` | A blink with an expression on (row 1) | **Live**, script: shape "Loop Blink" at 41 with `loopOut()` |
| `hold-only-effect.json` | A checkbox effect and Source Text keyed (row 8) | **Live**, script: "Toggle" (41), "Label" (42). AE made both hold itself; Source Text values read null |
| `nested-opacity.json` | A shape fill's and a text animator's Opacity (row 9) | **Live**, script: "Swatch" (41), "Tagline" (42; the stand-in's "Caption" is a 2b layer's name) |
| `spinner-eased.json` | Spinner's first key eased out (stage 6 `not_linear`) | **Live**, script: a real Easy Ease out on the 0.25 s key (speed 0, influence 33.33) |
| `after-demo.json`, `after-demo-undone.json`, `after-demo-reheld.json` | The demo, its undo, the learner's own hold (row 20) | **Live**, L-3: the demo, one Edit › Undo, then the builder's hand toggle. The demo and the hand toggle read the same, influence 16.667 included |
| `practice-blink-before.json`, `practice-blink-after.json` | A Mentor Practice duplicate before and after a 4-key blink on Logo (row 17) | **Live**, duplicate id 469 |
| `keys-moved.json` | Blink's third key moved to 1.9 s (row 18) | **Live**, script. Key 4's in influence reads 33.331 after (AE rounding) |
| `overlap-layers.json` | A precomp's own Opacity, a hidden layer, a track matte with its eye off, a null, a linear 0 to 100 fade, a pause-only property (rows 10, 11, 13, 14, 16, 21) | **Live**, script: Icon (41), Ghost (42), Matte (43, Alpha matte for Window, 44; AE turned its eye off), Rig (45), Fader (46), Still (47). Every added layer has `layer_info`, so the visibility class applies: Matte is a candidate (SR-3) |
| `synthetic/unknown-values.json` | Opacity keys whose values read unknown (row 22) | **Synthetic**, see below |

After Effects writes influence 16.667 on any side made hold, by hand or by script; the check reads
types, not influence, so that changes no verdict.

## Synthetic: row 22

A live read always returns key values, so "unknown values" (older captures, non-numeric reads) can't
be planted in After Effects; the sitting's `overlap-layers.json` has no "Old Values" layer.
`synthetic/make-unknown-values.mjs` writes `synthetic/unknown-values.json` from live files only:
`../layer-info/practice2b.json` plus one shape layer, "Old Values" at index 41, copied from the live
Fader layer (and its `layer_info`) in `overlap-layers.json`, with its two Opacity keys at 6 and 6.5 s
and their values set to null. The file says `synthetic` at the top. Run the script again if either
source changes.

## Other files

- `answer-key.json`: hand-written (above). Pair ids depend on layer indexes.
- `records/`: hand-written learner records for the tool tests (not snapshots, so FR-021's live rule
  doesn't apply): `easing-learned.json` (T012), `kept-linear-spinner.json` (T019),
  `learned-blink.json` (T024). No names, emails or phone numbers.
- `load.mjs`: the loader described above.

None of these captures holds a user name or folder path; check again before adding one.
