# Skill 1 (key types) fixtures

Spec 009's saved snapshots, answer key and test records. Tests load snapshots through `load.mjs`,
which takes a live capture in this folder when there is one and the stand-in in `stand-in/`
otherwise.

**Rule (research R8):** the stand-ins are synthetic and exist only until the live sitting. In the
desk block (tasks T033) every file below is captured live with `node mentor/dev/capture.mjs` into
this folder, `stand-in/` is deleted, and this table's Source column is updated. None may be
deleted from here before merge without its capture in place.

## Snapshots

| File | Shape (overlap row) | Source now | Live capture (sitting step) |
|---|---|---|---|
| `practice2-before.json` | Mentor Practice 2 as built | Stand-in, from `mentor/dev/build-practice-comp-2.jsx` | Spec 004 T042's `mentor/test/fixtures/practice2-before.json` (`load.mjs` reads it from there); L-4 compares |
| `practice-now.json` | Mentor Practice as it is (FR-008) | Stand-in, from `discovery/usage-notes/mentor-practice-state-2026-10-20.md` with values added | quickstart › 3 |
| `blink-one-held.json` | Blink's second pair held (KT-d) | Stand-in | quickstart › 3 |
| `blink-all-held.json` | Every Blink key held both sides (pass) | Stand-in | quickstart › 3 |
| `select-all-hold.json` | Blink, Cut, Card and Pause all held (rows 16, 19, KT-f) | Stand-in. Quickstart › 3 says "every key on Title", but Title is on Mentor Practice; this uses Mentor Practice 2's layers | quickstart › 3 |
| `wrong-side.json` | Blink's second key held on its in side only (FR-011) | Stand-in | quickstart › 3 |
| `mixed-pair.json` | First key linear out, second key hold in (row 6, L-1) | Stand-in | quickstart › 3 |
| `separated-x-held.json` | Dot 3: X Position held, Y not (row 7) | Stand-in | quickstart › 3 |
| `hold-at-zero.json` | Blink held at Opacity 0 (row 12) | Stand-in | quickstart › 3 |
| `loopout-blink.json` | A blink with an expression on (row 1) | Stand-in | quickstart › 3 |
| `hold-only-effect.json` | A checkbox effect and Source Text keyed (row 8) | Stand-in | quickstart › 3 |
| `nested-opacity.json` | A shape fill's and a text animator's Opacity (row 9) | Stand-in | quickstart › 3 |
| `spinner-eased.json` | Spinner's first key eased out (stage 6 `not_linear`) | Stand-in | quickstart › 3 |
| `after-demo.json`, `after-demo-undone.json`, `after-demo-reheld.json` | The demo, its undo, the learner's own hold (row 20) | Stand-ins | quickstart › 3 |
| `practice-blink-before.json`, `practice-blink-after.json` | A Mentor Practice duplicate before and after a 4-key blink on Logo (row 17) | Stand-ins | quickstart › 3 |
| `keys-moved.json` | Blink's third key moved to 1.9 s (row 18) | Stand-in | quickstart › 3 |
| `overlap-layers.json` | A precomp's own Opacity, hidden layers, a matte with its eye off, a null, unknown values, a linear 0 to 100 fade, a pause-only property (rows 10, 11, 13, 14, 16, 21, 22) | Stand-in | **Not in quickstart › 3 yet**: to capture in the sitting |

`stand-in/make-stand-ins.mjs` wrote the stand-ins and is deleted with them.

Mentor Practice 2's comp id in the stand-ins is 300 (synthetic); the captures will have the real one.
Tests never hard-code a comp id except through the fixture itself.

## Other files

- `answer-key.json`: written by hand from the shapes above, not by running the code (SC-003). Pair
  ids depend on layer indexes; if a capture's layer order differs from the build script's, the key
  is updated in T033.
- `records/`: hand-written learner records for the tool tests (not snapshots, so FR-021's live rule
  doesn't apply): `easing-learned.json` (T012), `kept-linear-spinner.json` (T019),
  `learned-blink.json` (T024). No names, emails or phone numbers.
- `load.mjs`: the loader described above.
