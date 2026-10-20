# Brief: Effects basics (apply, order, animate)

**AE version: unknown** (cockpit task did not say). Sources describe 2023 to 2026 (23.x to 26.5). Research date: 2026-10-20.
**Group D, wave 1.** Researcher: curriculum-researcher.

**Source note.** helpx.adobe.com returned 403 to direct fetches; Adobe claims come from search excerpts. Claims tagged **[B]** are background knowledge, not re-checked this session.

## What it is

An effect is a processing step (blur, glow, color correction, drop shadow) applied to a layer. Effects run in a stack on the layer, and each effect's properties can be keyframed like transform properties. Adjustment layers apply a stack to everything below them.

## Prerequisites

- Layers and basic keyframing (stopwatch, keys). Easing is relevant: effect properties (blur amount, glow intensity) are the second place beginners meet keys, and the easing lesson's rules transfer, though effect properties often animate with the same linear default **[B]**.
- Precomps are not required, but the effects/precomp interaction is where many problems arise (below).

## How it is usually taught, in order

1. Apply from Effects & Presets panel or Effect menu; see it in Effect Controls panel (ECP). **[B]**, universal in courses.
2. Adjust a property; keyframe it with the stopwatch (same mechanics as Transform).
3. Reset, toggle (the "fx" switch), delete.
4. Stack order: effects at the top of the stack run first, feeding the next. The classic teaching example is Drop Shadow with rotation: normally "effects are calculated before transformations", so a shadow cast to one side rotates with the layer; fix by putting a Transform effect before Drop Shadow. (ProVideo Coalition render-order article, established trade publication.)
5. Adjustment layers for applying one look to many layers **[B]**.
6. Animation presets and Expression Controls (later; links to `expressions-basics.md`).

## Disagreement and a doubtful claim

- Render order. The ProVideo Coalition article says the order is masks, then effects, then transforms for pixel-based layers, and for text and shape layers transforms come first, then masks, then effects. I could not confirm the second half against Adobe's help; my background understanding is that the order is effects before transform for all layer types, with a shape or text layer's contents rendered first. **Do not teach the layer-type split until it is verified.** Flagged for the designer: this is exactly the kind of internet help that goes stale or is wrong.
- Whether to teach Effect Controls first or the Timeline's twirl-down of Effects: courses split. Both reach the same properties. Neither source set I saw tests which a learner finds easier.

## What beginners get wrong (and what it looks like in the comp)

Frequency unmeasured.

| Mistake | What a wrong result looks like | Source and strength |
|---|---|---|
| Effect order wrong | Drop shadow rotates with the layer; glow before color correction looks different from after; blur applied before a mask-like effect gets cut | ProVideo Coalition (established); Adobe Community thread on stack processing (weak) |
| Applying to the wrong layer or level | Effect does nothing visible because it is on a hidden layer, an empty adjustment layer, or a layer below the one the learner thinks it affects | [B] |
| Effect on a layer, not the precomp, or the reverse | A blur on the bottom layer of a precomp does not blur a layer above it; an adjustment layer outside a precomp does not reach inside it unless the precomp is the target | [B]; see `precomps-nesting.md` |
| Effect clipped at layer bounds | Glow or blur or shadow cut off in a hard rectangle at the layer edge (solid or small shape) | [B]; commonly asked in forums, source not captured here |
| Stopwatch toggled off | Clicking the stopwatch off on an effect property deletes its keys after a confirm or silently; the animation flattens to one value | [B] |
| Expecting effects to appear in the timeline's keyframe view | Learner presses U expecting to see effect keys; U shows animated properties including effects (UU for modified ones) but twirl-down is needed for the rest; forum answers cite U and UU as first checks | Adobe forum answers (weak) |
| Keyframing an effect while the layer is not at the right time | Key sits at the wrong frame; "the effect is not animating" | [B] |
| Too many effects on a comp, slow preview | Preview stutters, red "RAM preview" bar; the learner blames AE | [B] |

## Where it overlaps other AE concepts

- **Expressions over keys.** Effect properties accept expressions; a property with an expression and keys reads the expression result. `snapshot.jsx` reads `expression_enabled` per keyed property, but a property with an expression and **no** keys is skipped (it only walks properties with `numKeys > 0`). So an effect driven by an expression alone is invisible to the current snapshot.
- **Single and hold keys.** A single key on an effect property sets a constant value, not motion; hold keys on an effect (for example toggling an effect on at a frame) are legitimate and should not be flagged as "linear" by an easing check. `snapshot.jsx` includes effect properties because it walks every property group, so the easing check already sees them (by design, `walk` is recursive).
- **Separated dimensions.** Applies to effect properties that are 2D points (for example Gaussian Blur Dimensions is not a point, but Offset in Transform effect is). Not separable in the UI for effect points; only layer Position can be separated **[B]**.
- **Effects and precomps.** The key overlap. See above and `precomps-nesting.md`.
- **Hidden layers.** An effect on a hidden (eye off) layer does nothing; an adjustment layer turned off hides its whole stack. The fx switch on a layer disables all effects on it.

## What changed between versions (2023 to 2026)

- **26.5 (Sept 2026):** the Effect Controls panel was rebuilt on a newer framework with icon-based controls, and effect instances can get color labels. In the beta the team said the panel "will look nearly identical" and keep behavior, with the Reset command becoming an icon button and informational icons moving to the right. (Adobe Community beta and release announcements; Adobe-staff posts, official but informal.) **Impact for the mentor:** screenshots and wording in any help written before 26.5 (for example "click Reset") may not match the panel. This is belief 16 made concrete: three of the changed items sit in the one panel beginners spend the most time in.
- **26.3 (June 2026):** a Curl Noise effect was added and Depth of Field in Advanced 3D. (Search summary of Adobe's What's New, official, second-hand.)
- **May and Aug 2023 (23.4, 23.6):** Properties panel exposes common layer properties and Essential Properties, so some animation can be done without the ECP.
- **25.0 (Oct 2024):** redesigned interface with themes.
- I did **not** find a documented change to effect stack order behavior in these versions.

## What the mentor could check

Reachable now via `ae_run_script` (spec 001 table says effect parameters read):
- Effects present on each layer, in stack order (the order is observable from property indexes under "ADBE Effect Parade").
- Whether any effect property has keys, how many, and the interpolation and ease (the easing check already includes them via `walk`).
- Whether the effects switch is on, and whether the layer is hidden or an adjustment layer has any content under it.
- Whether the effect's main value is at its default (an applied but untouched effect is a visible signal that the learner applied but did not adjust).
- Expression on an effect property with `expression_enabled`.

Signs of wrong: two Gaussian Blurs stacked; an effect with every property at default; shadow direction spinning with rotation (compare frame previews at two rotation values, `ae_preview_frame`); an adjustment layer with no layers beneath it.

New read needed: effects on properties with no keys and no expression, in a fixed-name list; "does this effect visibly change the frame" (compare previews).

## Open questions

1. Is the stack order lesson best taught on the Drop Shadow plus rotation case, or a color/glow case? No data on which the learner meets first in their own comp.
2. Does the 26.5 rebuilt panel change reorder (drag) behavior or shortcuts? Not documented in what I could reach.
3. Verify layer-type render order against Adobe's help before anyone writes it into a lesson.
4. Which effects do target learners actually use first? Interview question.

## Sources

| Title | Link | Version | Date | Strength |
|---|---|---|---|---|
| After Effects render order issues (ProVideo Coalition) | https://www.provideocoalition.com/after-effects-render-order-issues/ | not stated | not stated | Established trade publication; one claim doubtful |
| Effects stack processing order (Adobe forum) | https://community.adobe.com/t5/after-effects-discussions/effects-stack-processing-order/m-p/9155985 | not stated | not stated | Single thread (weak) |
| After Effects 26.5 is here (Adobe Community announcement) | https://community.adobe.com/announcements-527/after-effects-26-5-is-here-1641108 | 26.5 | Sept 2026 | Official, informal |
| New in beta: modernized Effect Controls panel | https://community.adobe.com/announcements-532/new-in-beta-modernized-effect-controls-panel-1556351 | 26.5 beta | May 2026 | Official, informal |
| What's new in After Effects (Adobe help) | https://helpx.adobe.com/id_en/after-effects/desktop/what-s-new/whats-new.html | 26.2 to 26.5 | 2026 | Official, second-hand |
| Features summary, May 2023 | https://helpx.adobe.com/after-effects/using/whats-new/2023-4.html | 23.4 | May 2023 | Official |
| Adobe forum: U and UU to find keys | https://community.adobe.com/t5/after-effects-discussions/trimming-shape-layer-disappears-all-keyframes/m-p/13408102 | not stated | not stated | Weak |
| Repo: `mentor/jsx/snapshot.jsx` | local | n/a | 2026-10 | Product evidence |
