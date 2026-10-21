# Research: skill 2, speed graph (spec 008)

**Status**: Draft, awaiting the builder's approval. Phase 0 of [plan.md](plan.md). Shared
interfaces are spec 004's ([research.md](../004-ae-curriculum/research.md) R4, R9, R12); this file
covers only this skill's calls.

## R1. The demo's fingerprint values (FR-008)

- **Decision:** the demo writes out-side influence **15.13** and in-side influence **79.87** on every
  dimension, speeds unchanged. The check calls a pair "the demo's" when at least one facing side
  still reads within 0.0005 of its value on every dimension (the same test as easing's
  `DEMO_INFLUENCE`). Constants `DEMO_OUT = 15.13`, `DEMO_IN = 79.87` live in
  `mentor/lib/speed-graph.mjs`, imported by the snippet's twin and the tests.
- **Rationale:** within 0.5 of 15 and 80 (FR-008); two decimals nobody types in Keyframe Velocity
  (people type whole numbers) and a drag lands on such values by chance about once in a million.
  Easing's 33.33 reads back as 33.33 through the snapshot's 3-decimal rounding, so two decimals do.
- **Check live:** L-3 reads them back. If AE rounds either, choose the nearest two-decimal pair
  that reads back exactly and change only the two constants.
- **Alternatives:** exactly 15 and 80 (a learner types them, so credit would be wrong); 15.5/79.5
  (people type halves).

## R2. Where the move is fastest (FR-016)

- **Decision:** `fastestPart(pair)` in `mentor/lib/speed-graph-bezier.mjs` builds the temporal
  bezier After Effects uses for one dimension: with duration `T`, value change `Δ`, out speed `s0`
  and influence `a` (as a share, 0–1), in speed `s1` and influence `b`:
  `P0 = (0, 0)`, `P1 = (a·T, s0·a·T)`, `P2 = (T − b·T, Δ − s1·b·T)`, `P3 = (T, Δ)`. It samples the
  curve at 200 even steps of its parameter, takes speed as `|dv/du| / (dt/du)`, and returns the
  time of the peak as a share of `T`. Part: first below 1/3, last above 2/3, middle between; within
  0.05 of a boundary both neighbours are returned (`parts: ["first", "middle"]`). It uses the
  moving dimension with the largest `|Δ|` (for unseparated Position, the one ease dimension and the
  straight-line distance). Speeds' sign follows `Δ` (AE reports magnitudes for spatial
  properties).
- **Rationale:** spec Assumptions name this model; TD § 5 stage 2 needs only the coarse part. On
  Easy Ease (33.33, speed 0 both) the peak is at 0.5; on 15/80 it's near 0.3, inside "first" and
  within 0.05 of the boundary on some pairs, which the tolerance handles.
- **Check live:** L-6 compares three pairs with the graph's peak by eye (SC-004).
- **Alternatives:** an analytic root of the speed's derivative (more code, same coarse answer);
  thirds of influence alone (wrong when speeds aren't 0).

## R3. "Still comes to rest" (FR-010d)

- **Decision:** `average = |Δ| / T` in the dimension being graded (unseparated Position: distance
  between the two key values in pixels). Pass when the landing's in-side speed `≤ 0.05 × average`.
  When the values can't be read (no `value`, or not numbers), pass only when the speed is `≤ 0.001`.
  `REST_SHARE = 0.05` and `REST_ABS = 0.001` are named constants.
- **Rationale:** spec FR-010d, approved 2026-10-21. Easy Ease and the demo write speed 0, so both
  pass with any share.
- **Check live:** L-5 (small and large upward drags on Position and Scale). The constant may only
  get stricter (spec).

## R4. Moving dimensions (FR-011)

- **Decision:** a dimension moves when its value differs between the two keys by more than 1e-6.
  Unseparated Position and other spatial properties have one ease dimension: it moves when the two
  values differ at all. When values are unknown, every ease dimension is graded (the strict
  reading). The pair result names the failing dimension by index; the tool adds a plain label
  ("width" and "height" for Scale's 0 and 1, "X", "Y", "Z" otherwise) so the mentor can say it.
- **Rationale:** D-4 agreed. Scale reads three ease dimensions on a 2D layer; the third never moves.
- **Check live:** L-2 decides whether one Scale dimension can be shaped alone; if not, the
  per-dimension test stays and only the "one dimension" fixture and eval case drop.

## R5. What reaches the analyzer through `skill_options` (FR-004, FR-006)

- **Decision:** `skill_options = { eased_layers: string[], land_hard: string[] }`.
  `eased_layers` are the layer names the mentor read from `read_learner_record` (lesson entries'
  `targets` for `easing.basic`; for older entries, a layer whose exact name appears in the entry's
  text); the prompt passes them on the first `speed_graph_snapshot` call. `land_hard` are pair IDs
  the learner said should land hard. Both are stored by the session and reused on a continued or
  resumed lesson (spec 004 T060, T061); a later call that sends `skill_options` replaces the whole
  object, so the prompt always sends both lists.
- **Rationale:** FR-004 says the skill never reads the record file; FR-006 needs the dropped pairs
  to survive a resumed headless turn.
- **Alternatives:** reading `learner.json` in the tool (forbidden, contract › 7); a separate
  "drop pair" tool (a fourth tool the contract doesn't have; the session already stores options).

## R6. The demo write (FR-007)

- **Decision:** `speed-graph-demo.jsx` takes `{ comp_id, layer_index, property_path, key_index }`
  like `set-ease.jsx`, reads the current ease on key `i`'s in side and key `i+1`'s out side,
  writes `KeyframeEase(speed kept, 15.13)` on key `i`'s out side and `KeyframeEase(speed kept,
  79.87)` on key `i+1`'s in side for every dimension, then restores each key's other-side
  interpolation type (the same `setTemporalEaseAtKey` caveat `set-ease.jsx` documents). It verifies
  both facing sides are bezier and the other sides unchanged, else throws asking for Edit > Undo.
  It returns layer, property, times, dimensions and the four influences read back. Run with
  `undo: true` (one undo step).
- **Rationale:** FR-007's "leave speeds, key types and each key's other side untouched". It uses
  the shared ES3 helpers `propByPath` and `displayPath` from `mentor/jsx/lib/`, which every
  snippet gets, without changing them.
- **Check live:** L-3.

## R7. Which mistake a failing pair matches (FR-012)

- **Decision:** checked in this order, first match wins: keys changed (FR-014) → no handle (c) →
  arrives moving (d; adds "drag sideways" when the landing influence is within 1 point of the
  baseline's) → back to default (b, and an earlier check this lesson saw the pair passing or
  shaped) → long on both ends (a fails, both ≥ 50) → in and out mixed up (start key's in side
  changed since baseline, out side didn't, and that in side isn't another focus pair's landing) →
  not shaped yet. The check stores which pairs it has seen shaped in its own result history:
  `speed_graph_check` returns `seen_shaped` and the prompt passes it back on the next check
  (`seen_shaped` input). The session isn't asked to hold it.
- **Rationale:** a broken handle explains every other symptom, so it comes first; "back to
  default" needs history, which the skill can't store in the session after `start()`. Passing it
  back through the model is the add-only way. If a resumed turn loses it, the hint falls back to
  "not shaped yet", which is still true (never a wrong claim).
- **Alternatives:** a shared "check history" field on the lesson (a shared change; not worth a
  request for one hint).

## R8. Fixtures: stand-ins in the cloud, live captures in the sitting (FR-025)

- **Decision:** the cloud build writes every test against hand-made stand-ins in
  `mentor/test/fixtures/speed-graph/stand-in/`, each a copy of spec 004's live
  `practice2-before.json` or a planted-shape variant, with `"synthetic": "stand-in for <live
  file>"` at the top. One answer key (`answer-key.json`) names the expected result per fixture and
  pair, by file name without the folder, so the same key works for the stand-in and its live
  capture. After the sitting's captures, the tests load the live file, the stand-ins are deleted,
  and `npm test` must stay green with the same answer key. Where a live capture disagrees with the
  key, the capture wins only if it's what AE plays (logged), and the change is noted for the
  spec writer.
- **Rationale:** FR-025 wants live captures; the cloud container has no AE. The stand-ins let the
  builder finish everything else first, and they never merge.
- **Alternatives:** waiting for captures before writing tests (blocks the cloud build).

## R9. One sitting (the cockpit's constraint; spec "Live checks" order)

- **Decision:** quickstart › 2–5, in order: L-1 to L-4 (before `SKILL.md`'s wording is final);
  captures with L-5 to L-7 on a duplicate comp (deleted before saving); a desk block with AE left
  open but the lock released (swap fixtures, tune, finalize wording, `npm test`); then the first
  live lesson on Mentor Practice, run by the builder in a plain Claude Code session with
  `/speed-graph-mentor` (the skill-builder has no `record_lesson`, persona › In this repo).
- **Rationale:** the cockpit asked for one sitting; the spec puts L-1 to L-4 first. The first live
  lesson needs final wording, so the desk block sits between.
- **Alternative:** two sittings, split after the desk block (open question for the builder).
