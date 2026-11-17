# Research: Expression and precomp reads (spec 015)

**Date:** 2026-11-14. **Spec:** [spec.md](spec.md) (approved `944cd8c`, OQ-1 to OQ-5 as recommended).

Each item: the decision, why, and what else was considered. Items marked **Live** are settled only by
a live check (tasks Phase 0); until then the plan builds to the stated assumption and the check can
change it.

## R1. Where the expression read runs

**Decision:** a new pass in `mentor/jsx/snapshot.jsx`, after the R1/R3 loop, that walks every
property of every layer in the active comp and records each one with a non-empty expression
(`canSetExpression` and `expression !== ""`). The result is a new top-level `expressions` array in
the raw snapshot (data-model › Raw snapshot additions). The existing `layers` and `layer_info`
loops are left as they are.

**Why:** every skill already takes one snapshot per turn, so the read costs one walk (60 ms on all
4,720 of Comp 1's properties, AB follow-up), no second bridge round trip, and every check sees the
same read. A top-level array is additive: the easing analysis reads only `layers`, so FR-021 holds by
construction and is proved by the existing unchanged-findings tests.

**Considered:** a separate snippet called only by the ask tool (rejected: the K2 and K3 changes need
expressions in every skill's snapshot, and two reads at two moments could disagree); putting the
expression on each `layers[].properties[]` entry (rejected: unkeyed properties aren't in `layers`,
and adding them there would change what easing iterates).

**Hidden dimension half (FR-006a, E29; session 2):** the hidden half of a separable Position keeps
stale values (joined: X/Y read 960, 540; separated: Position reads the last joined value). Every new
pass uses the snippet's existing `inUse()` test, which already keeps the keyed walk off the hidden half.

## R2. Expression text in the raw read, and its size

**Decision:** the raw read keeps each expression's full text up to **20,000 characters**, with
`text_length` and `text_cut` when longer. The reply cap (R11) is separate and much smaller.

**Why:** the builds-on-value test (R3) and the link search (R4) need the whole text, and they run in
Node. The raw snapshot never reaches the model; only tool replies do. 20,000 characters covers any
hand-written expression; the cap only guards against a pasted data blob.

## R3. "Builds on its own value", from the text

**Decision:** a Node module (`mentor/lib/expressions.mjs`) strips comments and string literals, then
classifies:

| Result | When |
|---|---|
| `builds_on` | a bare `value` identifier, or `thisProperty.value`; or a bare or `thisProperty.` call to `wiggle`, `temporalWiggle`, `smooth`, `loopIn`, `loopOut`, `loopInDuration`, `loopOutDuration`, `key`, `nearestKey`, `numKeys`, `valueAtTime`, `velocity`, `speed` |
| `sets_own` | none of the above, and the text was stripped cleanly |
| `cant_tell` | the strip failed (unbalanced quotes or comment), the text contains `eval(`, or the text was cut (R2) |

`.value` after another property (`thisComp.layer("A").transform.position.value`) is **not** this
property's value. Always reported with `inferred: true`. An expression with an error still gets a
classification (the text didn't change), but FR-006 keeps it out of the sources: in AE 27.0 it stays on
and gives the base value (T001).

**Why:** the spec asks for a plain text test, marked inferred (TD 014 Q3), and E5/E6 name the traps.
**Considered:** evaluating in AE with `value` swapped (rejected: it edits the project, FR-019).

## R4. "What links here", from the text

**Decision:** the same module finds layer references in the stripped text (strings kept aside for the
names):

| Pattern | Resolved to | Marked |
|---|---|---|
| `thisComp.layer("Name")` / `('Name')` | the topmost layer with that name (AE's rule) | inferred; `shared_name` when two or more layers have it |
| `thisComp.layer(N)` | layer N | inferred |
| `thisComp.layer(index ± N)` | this layer's index ± N | inferred |
| `thisLayer` | this layer | inferred |
| `parent` / `thisLayer.parent` | this layer's parent from `layer_info` | inferred |
| `thisComp.layer(<anything else>)` | not resolved | `cant_resolve` |
| `comp("…")` | not followed | `other_comp` |

The referenced property is read off the chain after the reference when it's plain: `.transform.X`,
`.position` (and the other transform shorthands), `.effect("E")("P")` or `.effect("E").param("P")`.
Otherwise the link has no property. A layer's incoming links are every resolved reference to it.
"No links" (FR-010) is said only when every expression in the comp was read and none has a
`cant_resolve` reference; otherwise the answer is "none found" plus the unresolved count.

**Why:** a regex pass over a stripped text is enough for the forms in the expressions brief and Comp
1, and it's deterministic and testable. **Considered:** a JavaScript parser (rejected: a new
dependency, constitution V, for forms the table already covers).

## R5. Base value and value after the expression

**Decision:** for each layer with an active transform expression, every `layer_info` sample gains a
`base` object holding only those properties, read with `valueAtTime(t, true)`. The existing sample
fields stay the value after expressions (`valueAtTime(t, false)`, as today). For FR-003 at a
caller's time, the time goes in `sample_times` as now.

**Why:** the checks already compare samples at shared times; giving them the base value at the
same times is the smallest change that lets K2 compare bases (OQ-1). For an erroring expression, base
and after are the same (T001), so it needs no special case.

## R6. Why AB turn f blamed the learner (K2's cause): answered by T004

**Answer (2026-11-14, `discovery/usage-notes/expression-reads.md` T004):** none of the three
candidates. Replaying the reads with only the playhead moved gives no change (the check already
compares at shared times), and rounding, a missing footprint and the mentor's own guess don't arise.
The saved reply is reproduced, to 0.001 px on rock.png's edges, only by an **Anchor Point change on
Shake Control** of about (572, −114) px: Pan Behind on Shake Control. Turn g shows it back, which
fits an Undo. This was an inference from the saved reply; **T005 confirmed it by hand** (session 2):
Pan Behind on Shake Control moved its base Position and Anchor Point together by (+561, −120), the
children stayed still (0.07 px) and the shake carried on. Pan Behind took Shake Control, which was
both selected and under the cursor; which rule decides is open (T034).

**Consequence:** the check was right to see a change. It failed by reporting the side effect (Shake
Control's footprint "moved up at 2.6 s") as its own entry, next to an `anchor_changed` entry the mentor
didn't lead with. K2 now has two halves (R7).

## R7. K2: what a check does with real edits and with expression motion

**Decision:**
- **Real edits are reported by cause (FR-014a).** When a layer outside the focus has a property change
  (Anchor Point, base Position, Scale, Rotation, parent, an expression), its footprint shift at the
  shared times is attached to that entry as `effect: { distance_px, direction, time }`, and no separate
  moved entry is made for that layer. Turn f becomes one entry: Shake Control's Anchor Point, with the
  shift as its effect. As built (data-model § 5), `effect` is omitted when nothing visibly moved, and
  is `{ distance_px: null, direction: null, reason }` when the footprint can't be read. A moved entry stays only for a footprint shift with no property change on the
  layer or a parent behind it, and only when the base rule below doesn't rule it out.
- **Same time only.** Shared times are the same frame in both reads (both rounded to a frame when
  `fps` is known). No shared time gives `not_compared`. T004 showed the pivot check already does this;
  the null check's before-read time and the other checks get the same helper.
  *As built:* there is no separate `same-time.mjs`. Pivot and null each keep their own half-frame
  window (`anchor-check.mjs`, `null-parenting-check.mjs`), and the shared helper
  `mentor/lib/k2-changes.mjs` matches sample times within 0.0005 s rather than rounding to a frame.
- **Expression motion is never reported.** For a property with an active expression (on, no error),
  compare `base` (as built: `pairValues` in `k2-changes.mjs` uses `base` only when both reads have it
  for that property, so a read from before spec 015 compares as read; `baseViews` gives the pivot and
  null checks two reads with `base` swapped in, so their footprints differ only by real edits). A
  footprint or value difference with no `base` difference on the layer or a parent is
  left out of the other-changes list (FR-013's "MAY report" isn't used yet: a new kind no `SKILL.md`
  knows could reach the learner as a field name, rule 5; spec 014 can add it).
- **Renumbering (FR-013a, E28).** `wiggle` follows the layer's index (T002: about 6 px), so a layer
  added above it moves its after-values with no edit. The base rule covers it; layers are already
  matched across a renumber by `renumber.mjs` and the checks' `matchLayer`. A test pins it.
- **Expression changes.** On or off, text changed, or a new error is reported as `expression_changed`
  with what changed (FR-014). Null's `expression_toggled` becomes this kind; offset's on/off listing
  keeps its sentence form.

**Sites (as built, phase 1 merge `a3300e3`):** the shared helper is `mentor/lib/k2-changes.mjs`
(`pairValues`, `baseViews`, `unkeyedChanges`, `unkeyedChangeNotes`). Pivot
(`mentor/lib/anchor-check.mjs`: item 5's moved list, `rawChanged`, `otherChanges`, the
`changed_layers` entries with `effect`), null (`mentor/lib/null-parenting-check.mjs`:
`value_changed` (OA-4), `parent_changed`, the jump check's footprints; `expression_toggled` is now
`expression_changed`), both through `pairValues` and `baseViews`. The pivot and null snapshot tools
(`mentor/tools/transform-anchor.mjs`, `mentor/tools/null-parenting.mjs`) add `motion_from` (R8).
**Differs from this decision:** offset, key types and speed graph were planned to change only if an
SC-005 replay failed; the build (T025) gives all three `unkeyedChangeNotes` from the shared helper,
so they now list unkeyed transform changes outside the focus (data-model § 5). Keyed changes stay
with each check's own key diff. Offset's on/off sentence form is unchanged.

## R8. K3: `moves_children` and the snapshot field (FR-005, FR-015)

**Decision:** a parent moves its children when it has keys on a moving transform property (today) or
an active, error-free transform expression whose result **varies** (R9's coarse sweep). The reason
is `keys`, `expression` or `both`. The pivot and null snapshot tools add `motion_from` to each focus
or candidate layer they already return (data-model), built from the map (OQ-3: those two only).
`SKILL.md` is not changed; the eval gate catches any leak.

## R9. How much an expression moves (FR-004), and "varies"

**Decision:** two sweeps in the snippet, over `[0, comp duration]`:
- **Coarse, always:** 24 evenly spaced times, for every active, error-free transform expression in
  the comp. Gives `varies` for R8, and a rough size for the summary when no fine sweep ran.
- **Fine, on request:** `ARGS.measure_layers` (layer indexes: the asked layers plus their parents,
  chosen by the describe tool) at a step of `max(1 frame, duration / 240)`. Gives the largest
  distance from base (vector length for Position, Anchor Point and Scale; absolute for Rotation and
  Opacity), its time, and `sampled_every`.

**Why:** the coarse sweep is cheap enough for every snapshot (96 value reads for Comp 1's two); the
fine one only runs when an answer needs it. Budgets checked live (T033). **Considered:** fine sweep
in every snapshot (rejected: an expression-heavy comp could cost seconds every turn).

## R10. The ask's read tool (OQ-2)

**Decision:** one read-only MCP tool, `describe_layers`, in a new file `mentor/tools/comp-reads.mjs`
that exports `TOOLS` and no `SKILLS` (index.mjs already allows that). It takes the snapshot with
`measure_layers`, builds the map and links, and returns the summary or the detail shape
([contracts/describe-layers.md](contracts/describe-layers.md)). No skill lists it in `allowed-tools`
in this spec; spec 014 does.

## R11. Reply sizes

**Decision:** summary per layer with its sources ≤ 4 KB, whole-comp summary ≤ 12 KB (SC-007); detail
text cut at **1,500 characters** per expression (`cut_short`, `full_length`), detail reply ≤ 16 KB with
a `more` list of layers left out. Comp 1's Position expression is 520 characters; 1,500 keeps every
hand-written shake or wiggle whole.

## R12. Phase 2: the precomp read

**Decision:** a separate snippet, `mentor/jsx/precomp-contents.jsx`, called by `describe_layers` only
when the request touches a precomp (or asks for a comp id). It reads the active comp's precomp layers
recursively, **once per comp id** (a memo), depth limit **5** (OQ-5), and a stack of ids for loops.
Per comp: id, name, duration, frame rate, size, places used (layers in the project whose source is it,
counted in each comp `usedIn` lists, since one comp can hold it twice), and its layers with the R1 fields, keyed properties (path, key count, key
times only), and the R1 expression inventory. Per precomp layer: start time, stretch, in and out,
`time_remap`, and when remap is on, the remap value at every outer frame from in to out (cap 600, then
`remap_cut`). Time mapping is done in Node (`mentor/lib/precomp-time.mjs`).

**Why separate:** the skills' snapshots must not grow by the size of every inner comp (Comp 1's
inner reads are 347 keyed properties), and FR-028 says no skill uses the contents yet.

**Mapping (confirmed live, T006, all 8 keys against AE's `sourceTime()` and the builder's eye):**
- Without remap, `outer = start + inner × stretch / 100`. A negative stretch reverses, and AE reports
  the in point **after** the out point (copy C: 3.5 and −4.5), so the shown span is
  `[min(in, out), max(in, out))`. A key landing exactly on the upper end never shows (copy C's inner 0).
- With remap, an inner time shows at every outer frame whose remap value equals it (within half an
  inner frame). A flat stretch of remap is a **range**: copy D's inner 1 holds for 16 frames (0 to
  0.5 s), inner 0 for 165 (2.5 s on). Report `{ first, last, frames }`.
- `sourceTime()` exists only in expressions, not in ExtendScript, so the snippet can't ask AE for the
  mapping; it reads start, stretch, in and out and the remap values, and Node maps.
- **Places used counts layers:** `usedIn` lists comps (3 for Icon Precomp), but 4 layers use it
  (Mentor Overlaps holds two). The snippet counts layers in each `usedIn` comp whose source is it. With remap, an inner time shows at each outer frame whose remap value is within half an inner
frame of it. Nested mappings compound from the inside out. A key "never shows" when no outer time in
the precomp layer's in-out range (and the outer comp's 0 to duration) maps to it.

## R13. Fixtures and fixture mode

**Decision:** `mentor/dev/capture.mjs` gains `--measure 25,26` (passes `measure_layers`) and
`--contents <file>` (also saves the precomp read). Fixture mode returns a snapshot's saved sweeps
when the fixture has them and `not_read: fixture` otherwise; `precomp-contents` gets a fixture twin
(`mentor/fixture/precomp-contents.mjs`) that loads the companion file named in the state file, or
returns `not_read`. Old fixtures have no `expressions` key, which every reader treats as `not_read`
(E27).

## R14. Shared-code ownership

`mentor/**` is add-only shared code (`.claude/hooks/ownership.json`, spec 004 FR-032). Phase 1
changes existing shared files (`snapshot.jsx`, `motion-sources.mjs`, `anchor-check.mjs`,
`null-parenting-check.mjs`, the pivot and null tool files, `capture.mjs`, `fixture.mjs`), so it runs as
**one skill-builder branch with the cockpit's `--shared-owner`**, not parallel worktrees. Phase 2 is a
second branch the same way. Eval work (eval-engineer) runs in parallel once a phase's branch is
merged.

## R15. Footprint shift in comp pixels (FR-004a, OQ-10; added 2026-11-16)

**Decision:** a pure function in a new file, `mentor/lib/footprint-shift.mjs`, on top of
`comp-space.mjs` (which already gives a layer's box corners through its parent chain and returns
`null` with a reason for `three_d`, `auto_orient`, `no_rect`, `not_sampled` and `singular`).
`describe_layers` calls it for each named layer and each parent-chain expression with
`moves_children` by expression.

- **Peak:** the fine sweep's `max_offset` and `max_at` only (the coarse sweep misses peaks: Comp 1's
  coarse Rotation peak is 0.283° against the fine 0.589°).
- **Rotation:** the box corners through the chain at the reading time, with the source property at its
  base and at base + `max_offset`; the shift is the largest corner distance. The sign doesn't change
  the distance, so `max_offset` (absolute) is enough.
- **Position and Anchor Point** (a pure translation of the children): every corner moves the same
  distance, `max_offset` times the scale of the layers it passes through (the source layer's own
  scale too, for Anchor Point). With uniform scale on those layers that's exact; with a non-uniform
  one it needs the peak's direction.
- **Scale:** always needs the peak's direction (`max_offset` is a vector length).
- **The peak's direction:** the snippet's fine sweep adds `max_value`, the after-expression value it
  already read at `max_at` (additive; fine sweeps only run with `measure_layers`, which only
  `describe_layers` sends, so no skill's snapshot changes). Without it (older snapshots, including
  today's `comp1.json`), the cases above that need it return `direction_unknown`. Comp 1 needs it for
  nothing: its two are Rotation and Position with no layer above.
- **`chain_moves`:** the samples are at the reading time, not the peak, so the conversion is exact only
  if the values it depends on are the same at both. Those are the transform values of the named layer
  and every layer between it and the source layer, the source layer's Anchor Point and Scale (and
  Rotation, for a Scale source in a non-uniform chain), and the Scale of every layer above the source.
  If any of them has keys or a varying active expression, the result is `chain_moves`. The source
  layer's own Position is exempt for a Rotation or Scale source (moving the pivot doesn't change the
  distance to it), and so is any Rotation above the source layer (a turn doesn't change a length).
  On Comp 1, Shake Control's Position shakes, but it is exempt for its Rotation, so both convert.

**Why:** it uses only what's already read, so it adds no AE time or write and works on the live
fixture. **Considered:** (a) sampling the chain at each peak time in the same snapshot (exact for
moving chains, but a snippet change for every measured layer and not testable on today's fixture;
revisit if `chain_moves` turns up often in 014's sessions); (b) a lever-arm estimate from the box size
alone (rejected: a guess, FR-004a); (c) giving the number in property units with the pixel version left
to the mentor's prose (rejected: the model would do the arithmetic, OQ-10).

**Expected on `comp1.json`** (a scratch check from the fixture, 2026-11-16, not a requirement beyond
SC-003a): Rotation gives rock.png about 9.36 px, logo.png about 8.60 and the ten Shakers precomps about
11.3 each; Position gives 12.147 on each of those. *Corrected 2026-11-16 (spec Amendment 8):* this note
first gave the title layer about 6.84 px, worked from its position at the reading time (3.403 s). Its own
Position keys (2.503 s and 2.636 s) bracket the peak (2.569 s), so by the rule above it's `chain_moves`
(`shift_px: null`) for both sources, which is what T064 returns (`2440c62`).
