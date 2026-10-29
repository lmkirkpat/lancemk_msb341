# Overlap audit: the five new skills (2026-10-29)

`/overlap-audit` run on speed graph (008), key types (009), offset (010), set the pivot (011) and
move a group with a null (012), after all five were merged and baselined. Each spec already had an
"Edge cases where concepts overlap" matrix written before the build; this audit checked those
matrices against the shipped code and the live findings since (the 10-26 sittings). Five read-only
auditors, one per skill; each WRONG row marked "probe" was reproduced with a throwaway script on a
fixture, the rest are from reading the code. All existing tests passed (key types 83, speed graph
29 in the overlap files, null 240, pivot 217, offset's overlap and check files).

About 100 rows; roughly 80 are right and pinned by a test. This file lists the rest.

## What the audit found about filters

- **No cross-skill reuse of check helpers.** `anchor-check.mjs` and `null-parenting-check.mjs`
  have their own `matchLayer`, `otherChanges` and `clusters`; they don't import `offset-keys.mjs`
  or `timing.mjs`. (A name-only grep suggested they did.)
- **The 6.2 pattern shows up inside each skill instead:** the set chosen for teaching also
  becomes the set the check compares, so edits to what teaching left out go unreported.
- **One shared root cause:** pair ids are keyed on the layer index (`mentor/lib/analyze.mjs:31`),
  and the easing, speed graph and key types checks look pairs up by index. Adding a null (what
  the null lesson teaches) or duplicating a layer renumbers everything below it.

## Wrong rows: a learner's edit goes unreported (the 6.2 class)

| ID | Skill | Overlap | Now | Proposed failing test | Proposed fix |
|---|---|---|---|---|---|
| OA-1 | Offset | Single key or expression-driven key on a **member layer** (layers kind) | `otherChanges` treats every property of a member as inside the group (`offset-keys.mjs:99`, `:120 if (inside) continue`), and the check grades only counted units; nothing reported (probe) | Mentor Practice 2 DOTS lesson; Dot 3's single Scale key moved 0 to 0.5 s and an expression-driven Rotation key moved: `other_changes` names both | A property of a whole-layer member is "inside" only if timing counted it as a unit; excluded units are compared like anything outside |
| OA-2 | Offset | A key added, or a pause given a value, on a member's counted unit (layers kind) | Start time unchanged, not reported (probe: key added on Dot 1) | DOTS lesson, a key added at the end of Dot 1's Position: an other change, or the member `keys_changed` | For the layers kind, compare each member unit's move count as the properties kind does (`offset.mjs:499`) |
| OA-3 | Speed graph | A pair the learner chose to **land hard** | Left out of candidates and also out of the other-changes exclude set, so its edits are silent (`speed-graph.mjs:444`; probe) | `check(now, planted-shared-key, {land_hard:[P1]})` with Title › Position changed: an other change names it | Pass the lesson's targets, not `targets ∪ landHard`, to `unexpectedChanges` |
| OA-4 | Null | An expression added on an **unkeyed** property of a non-focus layer | `expression_toggled` reads only the keyed list (`null-parenting-check.mjs:312`); nothing reported (FR-021 allows it) | `practice2b` + `null-center`, Plate's samples change while it has no keys: an other change | Compare non-focus layers' samples at the before-read time |

## Wrong rows: correct work misgraded

| ID | Skill | Overlap | Now | Proposed failing test | Proposed fix |
|---|---|---|---|---|---|
| OA-5 | Easing, speed graph, key types (shared) | A null added or a layer duplicated mid-lesson renumbers layers | Key types: every Blink pair `removed_or_changed`, fail, ~60 "Layer N is now…" notes (probe). Speed graph: grades whichever layer now has the old index, labelled with the old name (probe; Cmd+D hits it) | Key types: every index +1 and a null at index 1, Blink fully held: all `held_by_learner`. Speed graph: Twin (copy of Title) at 1, Title at 2, focus Title, insert a keyed layer at 2, shape Title's pair 1: graded on Title | Re-map baseline ids to current layers by name (unique) plus key times before lookup; when that can't be done, a "layers renumbered" verdict, never a wrong grade. Shared code (spec 004) |
| OA-6 | Offset, pivot | Duplicate layer names plus a renumber | `matchLayer` falls back to the raw index (`offset-keys.mjs:34`, `anchor-check.mjs:35`) and picks the wrong layer (probe: Dot 2 instead of the "Dot 1" at index 8) | Dot 3 renamed "Dot 1", every index +1: `matchLayer` returns index 8 | When names repeat, the k-th layer with that name in stack order, not the raw index |
| OA-7 | Key types | A should-move pair with only one side held | `should_move_held` tests `isHeld(from)` only (`key-types.mjs:382`): item 2 passes while Cut snaps early | `practice2b`, Cut's key[1].in_type = hold, should_move Cut: one `should_move_held` entry, `passed` false | Count a pair when `isHeld(from) \|\| to.in_type === "hold"`; same rule at `:397` for extra holds outside the focus (OA-8) |
| OA-8 | Key types | A mixed pair outside the focus | Extra-holds checks `state === "held"` only (`:397`); only a generic "was changed" | expect an `extra_holds` entry | as OA-7 |
| OA-9 | Key types | A pause pair inside the focus is held | Generic "Pause › Position was changed (not part of this lesson)" about the learner's own focus (`diff.mjs:55,72`, filter `key-types.mjs:404-406`); spec row 16 says nothing | focus Pause › Position, every key's out_type = hold: no note about Pause › Position | Pass pause pair ids into the targets given to `unexpectedChanges` |
| OA-10 | Key types | An expression turned on over a held focus mid-lesson | Pairs graded `held_by_learner`, lesson passes (`:337-347`); TD § 9 says keys under an expression aren't graded | Blink held plus `expression_enabled`: pair verdict `expression`, `passed` false | Count `expression_enabled` changes at `:337` |
| OA-11 | Pivot | Pan Behind **between** Rotation/Scale keys | `away` needs a baseline sample at the drag time (`anchor-check.mjs:272`); none between keys, so `in_place_moved` and "Undo back…" (probe: gauge-away at 3.6 s) | gauge-away with `comp.time` 3.6 s: `away_from_rest` | Infer `away_from_rest` when there's no baseline sample at the drag time, the layer has Rotation or Scale keys, isn't at rest, and both anchor and position changed |
| OA-12 | Pivot | A masked layer | `mask_count` read (`snapshot.jsx:324`) but unused; places come from the unmasked rect | comp-size solid with one small mask: `if_named` with a masked note | Use `mask_count` as `tools/common.mjs:91` does |
| OA-13 | Pivot | Focus outside its in/out at the check time | `in_point`/`out_point` read but unused; crosshair not visible | Door with `in_point` after the check time: a note or `if_named` | Compare in/out to the check time |
| OA-14 | Null | A grandparent moved by an unkeyed expression | `movesChildren` counts keys only (`motion-sources.mjs:30`); false "jumped" | `row23-still-parent` with the grandparent's sampled Position different at a child key time: `null_parent_moves`, not `jumped` | In the chain branch (`null-parenting-check.mjs:374`) also treat the parent as moving when its samples differ across the P2 times |
| OA-15 | Null | 4 focus layers whose P2 times total over 63 | The tool asks for the capped union (`tools/null-parenting.mjs:204`), `p2For` uses each layer's uncapped times (`null-parenting-check.mjs:118,449`): never passes | `cap70-before`, 4 focus layers over 63 distinct times: the focus is refused, not stuck | Refuse at focus time when `allP2Times` truncates (or pass `times: allP2Times(...)` and say what was skipped) |
| OA-16 | Null | A focus layer duplicated with the same name | `uniqueLayer` null, so `not_found` | two "Caption" layers: `focus_name_not_unique` | Mirror D-3 for focus layers |

## Held for a live sitting (pivot, with T261)

Need a read change (`valueAtTime(t, true)` in `snapshot.jsx`) or a live check first; logged, not
fixed: an expression on unkeyed Position on the focus (L-8: graded `moved_with_pivot`, told to use
Pan Behind); an expression on unkeyed Rotation/Scale (dragging at another time fails item 2); a
layer linked to the focus by expression (reads as `other_layer_moved`); a shy layer with Hide Shy
on ("click it in the timeline", but it's hidden there); stroke edges (T248).

## Design calls (open)

- **D-OA-1: guide and shy layers.** Key types, speed graph and offset treat them as normal layers
  that can be candidates and the demo. A guide layer never renders, so a demo frame can't show it.
- **D-OA-2: a locked child in null parenting.** A candidate today; can AE parent a locked layer?
- **D-OA-3: soloed-elsewhere layers** as the demo (speed graph, key types).

## Right but surprising (pin with a test, no fix)

Speed graph: an expression turned on for a focus pair reads "removed"; pick-whip parenting
mid-lesson is graded on the new values plus "value changed at"; dimensions separated mid-lesson;
auto-orient not read. Key types: constant speed on a mixed pair says "not linear". Offset: a first
move shifted past the second's keys is graded by move number; a guide layer counts. Null: an offset
pick whip on an unkeyed Position reads as `jumped`; non-focus layers that share a name are skipped.

## Where the spec matrices drifted

- 008 rows 7 and 10 and the shared-pieces table: stale (visibility class already used; "no handle"
  is still the internal id).
- 009 row 16 (a held pause changes nothing): the code reports it (OA-9). Row 1 and TD § 9 (keys
  under an expression never graded): not after the baseline (OA-10). No row for renumbering, guide,
  shy, solo or locked.
- 010 rows 1 and 3: single and expression keys are reported only outside the group (OA-1). Row 15:
  parenting is read but never named. Rows 12 and 16: "until R1" is out of date.
- 011 row 2 cites Drift as its test, but Drift is never the focus; row 3's "detection-only" blind
  spot misgrades too; rows 19 and 20 (OA-11); row 16 covers Parent links only; 3D or auto-orient
  parents are tested only in `comp-space`.
- 012 row 23 (moving parent) catches keyed motion only (OA-14); row 36 is per layer, not the
  focus total (OA-15); row 3's pick-whip hint doesn't fire for an offset pick whip.
- CLAUDE.md's open item on speed graph's "already shaped" list was already fixed (`95b8a94`).

## Outcome (2026-10-29, same day)

Built in two waves of agents, merged to `main` (`03f66ff`, `a5d5aee`); mentor tests 1494 pass,
0 fail, 3 todo (from 1431), hooks 39/39.

- **Fixed:** OA-1, OA-2, OA-4 to OA-16 (T440, T442 to T445, T450 to T452, T455 to T462). OA-5 added
  `mentor/lib/renumber.mjs` and an `unmatched` result (FR-053).
- **OA-3:** the code matched the spec (`data-model.md:84`); the builder changed the rule: a land-hard
  pair's edits are now other changes (T466).
- **Decided:** D-OA-1 guide layers out of the default focus and never the demo (key types, speed
  graph, offset; T463 to T465); D-OA-3 a layer hidden by another's solo is never the demo (T463,
  T464); D-OA-2 (locked child) waits for a live check.
- **Demos after a renumber (T467, FR-054):** easing, key types and speed graph demos read the comp
  and send the current index and name; the pivot demo no longer writes to a same-name copy; four
  jsx snippets refuse when the name at the index differs. **Needs a live check in AE.**
- **Specs:** all five matrices updated (`456a591`); 8 right-but-surprising rows still have no
  pinning test.
- **Still open:** the pivot rows held for T261/T248; key types has no rule for a locked layer
  (spec 009 row 32); offset's later landing moved alone isn't listed (same class as OA-2).
- **Evals:** every skill's `SKILL.md` changed, so all six sets need a re-run, plus new cases the
  builders listed (renumber after a null, same-name copy, guide leave-out, land-hard note, masked
  or off-screen pivot focus, a duplicated null group layer, an unkeyed change outside the focus).
