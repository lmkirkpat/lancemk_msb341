# Contract: hand-in, hand-back and the null pivot (K6, K7; spec 014)

How a lesson starts from an answer and hands back. Research R5 to R7; shapes in
[data-model.md](../data-model.md) § 2 and § 4.

## Which skills take a hand-in

A skill takes one when its `FINDERS` entry has `hand_in: true` (its own tool file). Phase 2: Set the pivot
(`transform.anchor`) and Group with a null (`parenting.null`). Phase 3: easing, key types, speed graph,
offset. `give_answer` and `go_deeper` refuse an offer of any other skill on A (`OFFER_NOT_READY`, PQ-2).

## Opening a lesson from a hand-in (every hand-in-ready snapshot tool)

The snapshot tool calls `opening()` as today. With a hand-in for this skill and comp that hasn't been
used and hasn't lapsed:

1. `mode: "lesson"`, `mode_source: "hand_in"`; never `review`, even when one is due (FR-023).
2. The focus is the hand-in's layer. The skill's proposal and its intent question are skipped (FR-026);
   the tool's reply has no proposal list.
3. The reply adds `hand_in` (data-model § 4). `practice: true` when the skill is learned.
4. The hand-in is marked used.

If the hand-in's layer is gone or renamed, the tool returns its usual "not found" for that layer and
`mode_source: "hand_in_lost"`; the lesson opens as it would from Skills, saying in one sentence it couldn't
find the layer.

## Per skill

| Skill | Focus from a hand-in | Check changes |
|---|---|---|
| Set the pivot (phase 2) | The layer, **including a null with children** (K7). A footage layer with padding is fine | For a null: Anchor Point changed, and every child's comp-space footprint at the same frames didn't move (spec 015 K2: base values for expression-driven properties). With `place_named`: the target row is `your_call` and never decides the pass (rule 2) |
| Group with a null (phase 2) | The hand-in's group (the step's layer and the layers the step names). An existing null that already has children is never this skill's (FR-027; `ROUTE_TO_PIVOT`) | Unchanged; the jump check already gets K2 from spec 015 |

*Added 2026-11-19 (spec amendment (i)), as built after review T060:*
- **Pivot, null focus:** the children-moved hint fires only when the null's pivot moved. When the pivot didn't
  move but a child did, the hint is `carried_layer_moved` ("[null]'s pivot hasn't moved, but [child] moved"),
  and when the null itself was dragged it's `layer_dragged`. Each says what moved without blaming the pivot.
- **Pivot, a named place:** the ask skill sets `place_named` only for a spot the nine places can't hold (such as
  a point on padded art). A place already named among the nine goes straight to the lesson's snapshot with that
  spot, so the lesson doesn't ask for it again.
- **Null:** a null-focus refusal carries whether the refused layer's parent is a null. The skill then routes it
  to Set the pivot in step 1, and does the same for a step that names the control null itself. A lesson from
  an answer stops there, without asking for another group. On A, `go_deeper`'s `ROUTE_TO_PIVOT` stops this
  before a hand-in is saved, so the skill's line is the second guard (spec FR-027's note).
| Easing, key types, speed graph, offset (phase 3) | The hand-in's layer; its pairs or properties as the skill's finder sees them | Unchanged |

## Hand-back (FR-026)

`record_lesson`'s reply adds `hand_back: { step_number, next_step }` when the lesson started from a
hand-in. The lesson's last line is "That was step [n]; next is [step n+1]." with `next_step`'s text, or,
when `next_step` is `null`, "That was the last step." Ended early (End lesson in the panel), the panel
sends "/ask-mentor I've ended that lesson." and the ask skill names the next step from the conversation;
nothing is recorded (MU `ask-ended`).

*Added 2026-11-19 (spec amendment (i)), as built:* a stop **in words** inside a go-deeper lesson follows spec
FR-063. Before any demonstration or check, the skill calls `end_lesson`, whose reply carries the same
`hand_back`; after either, it calls `record_lesson`. Pivot and null end on the hand-back line either way. The
panel takes `hand_back` from either tool's result for the thread's own line (contracts/panel-ask.md).

## Rules the lesson keeps

One demonstration, hints not fixes, the check, the record (TD § 7.2). A learned skill's lesson says no
"review" anywhere and no fail words on a miss; it's recorded as `practice` by today's rule (research R18).

## Tests

- `opening()`: hand-in before a due review; used once; another comp's hand-in ignored; lapsed after the
  window; a version without `hand_in` behaves exactly as today (every existing opening test unchanged).
- Pivot on spec 015's Comp 1 capture: Shake Control as focus; rock.png and the letters' footprints
  compared at the same frames; a planted base Anchor Point change on Shake Control with the children
  still passes; a planted child move fails, naming the child. Padded PNG (AB held 3) with `place_named`:
  passes on "didn't move".
- `record_lesson`: `hand_back` with the right step; absent without a hand-in.
- `end_lesson` (added 2026-11-19 (i)): the same `hand_back` for a lesson opened from a hand-in
  (`mentor/test/end-lesson.test.mjs`).
