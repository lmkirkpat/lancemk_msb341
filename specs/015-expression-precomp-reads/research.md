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
classification (the text didn't change), but FR-006 keeps it out of the sources.

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
same times is the smallest change that lets K2 compare bases (OQ-1).

## R6. Why AB turn f blamed the learner (K2's cause)

**Decision: find it before fixing it** (task T004). `anchor-check.mjs` already compares at shared
sample times, so "compared across times" isn't the whole story. Candidates to test against a fixture
shaped like turn f:
1. Times that match after rounding to 0.001 s but were read at slightly different exact times. A
   12 px, 8 Hz sine moves about 0.6 px in 1 ms, far over `VALUE_TOL` (0.01).
2. The `rawChanged` fallback for a layer with no footprint (a null) taking a time that is in one
   read's samples only.
3. The mentor comparing two tool replies' values itself, not the check (then the fix is the reply,
   not the comparison).

The fix (T022 to T025) follows whichever holds; FR-012 and FR-013 are the rule either way.

## R7. K2: what a check does with expression motion

**Decision:**
- Compare at the **same exact time** only. Snapshot sample times are stored rounded, so a shared time
  is one both reads sampled from the same frame (both rounded to a frame when `fps` is known, as the
  caller-time code already does). No shared time → `not_compared`.
- For a property with an active, error-free expression, compare `base`. A footprint or value
  difference with no `base` difference on the layer or any parent is **left out** of the check's
  other-changes list (FR-013's "MAY report" is not used yet: a new kind that no `SKILL.md` knows
  could reach the learner as a field name, rule 5; spec 014 can add it).
- An expression turned on or off, its text changed, or a new error is reported as
  `expression_changed` with what changed (FR-014). Null's existing `expression_toggled` becomes this
  kind; offset's on/off listing keeps its sentence form.

**Sites:** pivot (`anchor-check.mjs`: item 5's moved list and `rawChanged`; `otherChanges`'
anchor comparison), null (`null-parenting-check.mjs`: `value_changed` (OA-4), the jump check's
footprints, `expression_toggled`). Offset, key types and speed graph compare keys, not sampled
values: they get the AB-f replay test (SC-005) and change only if it fails.

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
counted through `usedIn`), and its layers with the R1 fields, keyed properties (path, key count, key
times only), and the R1 expression inventory. Per precomp layer: start time, stretch, in and out,
`time_remap`, and when remap is on, the remap value at every outer frame from in to out (cap 600, then
`remap_cut`). Time mapping is done in Node (`mentor/lib/precomp-time.mjs`).

**Why separate:** the skills' snapshots must not grow by the size of every inner comp (Comp 1's
inner reads are 347 keyed properties), and FR-028 says no skill uses the contents yet.

**Mapping:** without remap, `outer = start + inner × stretch / 100` (negative stretch reverses; **Live**,
T006). With remap, an inner time shows at each outer frame whose remap value is within half an inner
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
