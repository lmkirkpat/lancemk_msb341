# Research: skill 1, key types (spec 009)

**Status**: Draft, awaiting the builder's approval. Phase 0 of [plan.md](plan.md). Shared
interfaces are spec 004's ([research.md](../004-ae-curriculum/research.md),
[contracts/skill-module.md](../004-ae-curriculum/contracts/skill-module.md) › 4 and 6).

## R1. The named focus and the should-move list (FR-004 to FR-006, FR-012)

- **Decision:** `skill_options = { focus: [{ layer, property }], should_move: [{ layer, property }] }`.
  `property` is the display name the snapshot shows ("Opacity", "X Position") or the property path.
  `key_types_snapshot` passes `focus_layers` (the focus's layer names) to `session.start` so the
  session's `UNKNOWN_LAYER` check still applies, and the analyzer narrows to the named properties.
  A candidate the learner says is meant to fade goes into `should_move` (FR-004). The prompt sends
  the whole object every time it changes (a call with `skill_options` replaces the stored value,
  spec 004 T060). `key_types_check` also accepts `should_move` as input and grades the union with
  the stored list, so a list the model re-sends late still counts.
- **Before the learner names anything**, the first `key_types_snapshot` call sends no focus: the
  analyzer returns candidates and `targets: []` (`no_demo_reason: "awaiting_focus"`), so nothing
  becomes the focus without the learner's answer (FR-004).
- **In a review**, the session marks any result with no targets `no_new_target` (spec 004
  contract › 4), which before the intent question would wrongly read as "nothing to review". So
  `key_types_snapshot` reports `awaiting_focus` itself in review mode while `skill_options.focus` is
  empty and `candidates` (with past targets excluded) isn't; only an empty candidate list is
  `no_new_target`. The prompt goes by the tool's field. No shared change: the session's reason is
  only a field, and an empty review lesson records nothing.
- **Rationale:** FR-006 says the property focus goes to the skill's own analyzer and needs no
  shared change; `skill_options` is the shared way to keep it across a resumed turn.
- **Alternatives:** a layer-only focus (too coarse: Title has Position, Scale and Opacity);
  should-move as check input only (lost on a resumed turn).

## R2. The practice blink and `fresh` (FR-007, overlap row 17)

- **Decision:** after the learner says they've made the blink, the prompt calls
  `key_types_snapshot` with `fresh: true` and `skill_options.focus` naming the blink's layer and
  Opacity. The tool passes `fresh` to `session.start`. If the session throws `LESSON_UNDERWAY`
  (a demo or check already happened), the tool returns that error unchanged and the prompt says
  the learner's message and carries on with the lesson as it is; it never retries.
- **Rationale:** SR-1 as tasked in spec 004 (T062, T063).

## R3. The candidate test on values (FR-003)

- **Decision:** a pair is a candidate when its property path is
  `ADBE Transform Group/ADBE Opacity`; `|v − 0| ≤ 0.5` for one key and `|v − 100| ≤ 0.5` for the
  other (either order); the first key's `out_type` isn't `hold`; the property is in `segments()`
  (two or more keys, no enabled expression); the layer is `enabled` and not `is_null`; both values
  are numbers; and no applying kept-linear mark (`opts.kept_linear`, spec 004 data-model) covers it.
  Group by layer and property; order by earliest first-key time, then layer index; name at most 3.
- **Rationale:** FR-003 and H-2 (strict values). Values come from the snapshot's `value` field
  (absent in pre-values captures, which is why fixtures must be live captures with values, row 22).

## R4. The demo write and its credit (FR-010, FR-011, row 20)

- **Decision:** `key-types-demo.jsx` takes `{ comp_id, layer_index, property_path, key_index }`
  and calls `setInterpolationTypeAtKey(i, inSide, HOLD)` where `inSide` is the key's current in type
  when `HOLD_SIDES = "out"`, or `HOLD` when `HOLD_SIDES = "both"`. `HOLD_SIDES` is one constant at
  the top of the snippet, mirrored in `mentor/lib/key-types.mjs` for the twin, and set from L-2 in
  the desk block (default `"out"` until then). It verifies the out side reads hold, returns layer,
  property, the pair's times and the types read back, and runs with `undo: true`.
- **Credit:** a hold has no fingerprint. The demo pair is `held_by_demo` while it's held and no
  earlier check in this lesson saw it not held; once a check sees it not held, the session's
  `demo.undone` is set (`markChecked(passed, { demoUndone: true })`) and from then on a hold there is
  `held_by_learner`. The check result says the credit plainly (FR-011).
- **Rationale:** FR-010's "exactly as Toggle Hold Keyframe writes it", so the timeline looks the
  same either way (L-3 compares).

## R5. The check's verdicts (FR-011 to FR-013, FR-016)

- **Decision:** per focus pair (by pair ID against the baseline): `removed_or_changed` if the
  property's key count or times differ from the baseline; else `held_by_demo` / `held_by_learner`
  if the first key's out side is hold; else `wrong_side` if the second key's in side is hold and the
  first key's out side isn't; else `not_held` with the shared `segmentState` and a frame time inside
  the pair (its midpoint, rounded to a frame) for the hint. A `wrong_side` pair is never a pass and
  the mentor never says it's done (row 6). Should-move pairs (FR-012): any pair on a should-move
  property that's held now and wasn't at the baseline fails item 2, with layer, property and the
  time it now waits until (the second key's time). Extra holds (FR-013): every pair outside the
  focus and should-move list whose first key's out side became hold since the baseline, except
  pause pairs; the first key's in side and the last key's out side face no pair and are ignored.
  Other changes: the shared `unexpectedChanges` as well, for everything else.
- **Pass:** every focus pair held (counting the demo), no should-move failure, and stage 6's item 3
  when a move was named and its verdict isn't `expression`.

## R6. The stage 6 verdict and the mark (FR-014, SC-006)

- **Decision:** `constantSpeed(snapshot, { layer, property })` returns one of `linear`,
  `not_linear` (with which pairs and which side), `held`, `expression`, `single_key`, `not_found`.
  A layer with one keyed property means that property; Position on a separated layer means each
  keyed dimension (all must be linear). Only on `linear` does `key_types_check` call
  `session.keepLinear(freshSnapshot, refs)` with every resolved property. If `keepLinear` throws
  `NOT_KEPT_LINEAR` anyway, the tool reports `not_linear` and stores nothing (spec 004 T051 pins
  that a throw stores nothing). Volunteered in a review: same call, ungraded (H-4).
- **Rationale:** FR-014: the learner never hears "set its keys to linear" for an expression or a
  name the check couldn't find.

## R7. Separated dimensions (overlap row 7)

- **Decision:** naming "Position" on a layer whose snapshot has `ADBE Position_0`/`_1`/`_2` means
  every keyed dimension; each dimension's pairs are targets in their own right, reported by their
  display names ("X Position", "Y Position"). Pass needs every one held.

## R8. Fixtures: stand-ins in the cloud, live captures in the sitting (FR-021)

- **Decision:** as spec 008 research R8: stand-ins in `mentor/test/fixtures/key-types/stand-in/`
  with `"synthetic": "stand-in for <live file>"`, built from spec 004's live
  `practice2-before.json` (Blink, Spinner, Cut, Pause, Card with values); one `answer-key.json` by
  file name; the sitting's captures replace them and the stand-ins are deleted before merge. Records
  for tests (learned with Blink as target; a kept-linear mark on Spinner) are hand-written records,
  not snapshots, so FR-021's live rule doesn't apply to them.

## R9. One sitting

- **Decision:** quickstart › 2–5: L-4 first (Mentor Practice 2 as built, with values) and L-1 to
  L-3 before `SKILL.md`'s wording and the snippet are final (FR-024); then the captures on a
  duplicate of Mentor Practice 2 (and the practice blink on a duplicate of Mentor Practice); a desk
  block (swap fixtures, set `HOLD_SIDES`, wording); then the first live lesson on Blink in a plain
  Claude Code session (it writes the real record). The review on Cut is a day or more later.
