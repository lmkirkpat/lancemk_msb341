# Brief: Precomposing and nesting

**AE version: unknown** (cockpit task did not say). Sources describe 2023 to 2026 (23.x to 26.5). Research date: 2026-10-20.
**Group D, wave 1.** Researcher: curriculum-researcher. Not a design: recommendations are marked as such.

**Source note.** helpx.adobe.com returned 403 to direct fetches. Adobe claims below come from search-result excerpts of the official page, so they are official but second-hand. Claims tagged **[B]** are background knowledge not re-checked this session; verify before a lesson depends on them.

## What it is

Precomposing wraps one or more layers in a new composition that sits as a single layer in the parent comp. Used to group things that should move or be styled together, to reuse an animation, and to tidy a crowded timeline. The price is that the work inside is one level down and hidden from the parent's timeline.

## Prerequisites

- Layers, comps, and the timeline (basic).
- Keyframing (position, scale) so there is something to hide. Easing is not required, but a learner who has done the easing lesson will already have keys that "disappear" when precomposed.
- Parenting is useful to contrast with ("group by parent" vs "group by precomp"). Not required.

## How it is usually taught, in order

1. **Why:** organization, group animation, reuse. School of Motion's guide leads with organization, then "apply an effect or keyframes to a whole group at once", then nesting an animation built in one comp inside another. (School of Motion, established teaching.)
2. **How:** select layers, Layer > Precompose, name it, double-click to open it. (School of Motion; Adobe Learn "animate layer groups".)
3. **The two options:** Leave all attributes vs Move all attributes. Adobe's help says Leave keeps the original layer's transforms and keyframes in the parent comp (and the new comp takes the layer's frame size), while Move puts transforms and keyframes inside the precomp, one level below the root, and the new comp takes the parent comp's size. Leave is unavailable when more than one layer, a text layer, or a shape layer is selected. (Adobe help, English text via search excerpt.)
4. **Collapse Transformations and nesting depth** (later, usually a second lesson) **[B]**.
5. **Pre-rendering** is on the same Adobe page but is a performance topic; beginner courses mostly skip it.

Both the Adobe page and School of Motion teach Move-all as the working default for multi-layer groups; neither disagrees with the other. One teaching disagreement worth showing the designer: Korenman's tutorial warns that precomping "can feel like hiding your keyframes" and counsels doing it late, once the animation is working (School of Motion tutorial, single instructor). Other sources present precomping as an early organizing habit. Both are defensible; the second hides work from a beginner who is already lost (interview 007: "Everything is like hidden").

## What beginners get wrong (and what it looks like in the comp)

Frequency is unmeasured. Counts below are how many of my search results touched the issue, not rates.

| Mistake | What a wrong result looks like | Source and strength |
|---|---|---|
| Precomposing a layer with "Leave all attributes" and expecting the group to move as one, or the reverse (Move, then looking for keys in the parent) | Parent timeline shows a precomp layer with no keyframe diamonds; the animation still plays. Learner presses U on the precomp, sees nothing, concludes the keys are gone | Adobe help (official) for the behaviors; the "feels like hiding" framing is a single instructor |
| Opening the wrong level to edit | Edits made to the precomp layer's Transform in the parent do not change the timing inside; the learner changes the same-named property on the wrong layer | [B], consistent with School of Motion's "double-click to get back to the original layers" |
| Precomp duration or size does not cover the content | Animation clipped at the precomp's last frame or edge; freezes or vanishes mid-lesson. The Adobe help describes the new comp taking the original layer's size (Leave) or the parent size (Move); a forum answer points to the duration option "Adjust the composition duration to the span of the selected layers" | Adobe help plus one forum thread (weak) |
| Moving a layer with `]` instead of trimming (Alt/Opt+`]`) so its keyframes shift in time | Keys appear to be missing or wrong because they slid later; fix is trimming not moving. Applies to precomp layers as much as any layer | One Adobe-employee forum answer (weak) |
| Trim Comp to Work Area, or lengthening or shortening a parent, leaves nested comps too short | Nested comp layers end early; keys "gone" until the nested comps are lengthened | One expert forum answer (weak) |
| Precomposing text or shape layers and expecting Leave all attributes to be an option | The option is greyed out; learner thinks AE is broken | Adobe help (official) |
| Not renaming (default name "Pre-comp 1") | Project panel full of "Pre-comp 1, 2, 3"; later cannot find what to open | [B]; teaching sources all tell learners to name it |
| Precomposing something that has an effect applied, expecting the effect to stay | Effects on a single layer: with Move all, they travel inside; with Leave, they stay on the precomp layer. The look can change because an effect now processes a precomp-sized frame | [B] |

## Where it overlaps other AE concepts (for each spec's overlap list)

- **Hidden keys.** This is the core overlap. A precomp layer shows only its own Transform keys in the parent. Everything inside is invisible to a parent-only read. In this repo, `mentor/jsx/snapshot.jsx` line 108 says it directly: "A precomp layer's own transform is read; what's inside it isn't, in this slice (R8)". It returns a `precomp_layers` list but reads nothing inside. So an easing check passes or fails nothing for precomped motion. A new read is needed that walks `layer.source` for CompItem layers, including nested precomps and shared precomps used more than once.
- **Time remapping and stretch.** A precomp layer with time remapping on or a changed stretch means key times inside differ from key times in the parent. **[B]**
- **Expressions over keys.** An expression on the precomp layer's transform can hide what the precomp itself contains, and an expression inside can read the parent's time. See `expressions-basics.md`.
- **Single and hold keys.** A single key or hold keys inside a precomp are invisible from the parent exactly as multi-key motion is.
- **Separated dimensions.** `snapshot.jsx` already handles X/Y Position; the inside-precomp read must reuse that rule.
- **Effects.** Effects on the precomp layer act on the flattened result of the precomp; effects inside act on single layers. Order and scope differ. See `effects-basics.md`. Adjustment layers placed inside vs outside a precomp is a common point of confusion **[B]**.
- **Hidden layers.** `layer.enabled` (the eye) already shows in the snapshot. A hidden layer inside a precomp is invisible to the parent read. A precomp layer that is itself shy or hidden can also hide a whole animation.
- **Collapse Transformations.** The sun-shaped switch (Collapse Transformations / Continuously Rasterize) changes whether the precomp's inner layers keep their own 3D and effects relation to the parent, and can change how a blur or mask looks **[B]**. Not in the sources I could open; needs an official source before it is taught.

## What changed between versions (2023 to 2026)

- I found **no change** to the precompose dialog's two options between 2023 and 2026 in the sources I could reach. Absence of evidence: a release-notes diff of each version was not possible (see gaps).
- Properties panel (May 2023, 23.4; Essential Properties added August 2023, 23.6) lets you edit a selected layer's key properties and a precomp's Essential Properties without opening it. This changes what "I cannot reach the controls inside the precomp" means for new versions. (Adobe features summary pages, official.)
- AE 2025 (25.0, October 2024) shipped a redesigned interface with themes, which changes screenshots in older tutorials. (CG Channel review, secondary; Adobe release.)
- Older help describes menu and panel names consistently; the mismatch risk is mostly UI look, not wording (belief 16, interview 008).

## What the mentor could check

Already reachable (spec 001 reads, `snapshot.jsx`):
- Does the comp have precomp layers (`precomp_layers`)? Which were created since the last snapshot (diff)?
- Is a precomp layer's own transform keyed? Is the layer enabled?
- Layer names: did the learner rename the precomp (default "Pre-comp N" vs anything else)?

Needs a new read (via `ae_run_script` or a new narrow tool):
- Contents of each precomp: layers, keys, easing, expressions, enabled state, recursing to depth.
- Whether the precomp's duration and frame size cover the child layers' span and extents.
- Whether the precomp is used in more than one place (editing one affects all).
- Time remap or stretch on the precomp layer.
- For "Leave vs Move", compare keys on the precomp layer before and after: keys stay on the parent layer (Leave) or move into the new comp (Move).

Signs of a wrong result: the key count on the parent layer drops to zero while motion still plays, a precomp 1 frame long, or a precomp layer ending before its content.

## Open questions

1. Does the learner's mental model need "Move" as the default, or is it better to teach "Leave" first because the keys stay visible? Sources teach Move-first; no source I found tests learners on this. A usage session would answer it.
2. How often do target learners precompose at all in their first projects? Interview question for the next round.
3. Collapse Transformations explanation is unverified against current Adobe text.
4. Whether the hidden-keys problem is a first-order diagnosis case (interview 007: finding what broke was the biggest sink). My recommendation: treat "keys inside a precomp" as a diagnosis item, not only a precomp lesson. This is a recommendation, not a decision.

## Sources

| Title | Link | Version | Date | Strength |
|---|---|---|---|---|
| Precomposing, nesting, and pre-rendering (Adobe help) | https://helpx.adobe.com/sa_ar/after-effects/desktop/work-with-compositions/precomposing-and-nesting/precomposing-nesting-pre-rendering.html | current help (version not stated) | accessed 2026-10-20, via search excerpt | Official, second-hand |
| A Guide to Precomposing in After Effects (School of Motion) | https://www.schoolofmotion.com/blog/precomposing-in-after-effects | not stated | not stated | Established teaching |
| Tutorial: Precompose Your Work (School of Motion) | https://www.schoolofmotion.com/blog/precomp-animation-after-effects | not stated | not stated | Established teaching; single instructor opinion on "hiding" |
| Animate layer groups (Adobe Learn) | https://www.adobe.com/uk/learn/after-effects/web/animate-layer-groups | not stated | not stated | Official tutorial |
| Features summary, May 2023 (Properties panel) | https://helpx.adobe.com/after-effects/using/whats-new/2023-4.html | 23.4 | May 2023 | Official |
| Features summary, August 2023 (Essential Properties in panel) | https://helpx.adobe.com/after-effects/using/whats-new/2023-6.html | 23.6 | Aug 2023 | Official |
| Trimming shape layer disappears all keyframes (Adobe forum) | https://community.adobe.com/t5/after-effects-discussions/trimming-shape-layer-disappears-all-keyframes/m-p/13408102 | not stated | not stated | Single thread (weak) |
| Trim comp to work area ruined work (Adobe forum) | https://community.adobe.com/questions-529/trim-comp-to-work-area-ruined-3-days-of-work-a-project-deadline-54246 | not stated | not stated | Single thread (weak) |
| Repo: `mentor/jsx/snapshot.jsx` | local | n/a | 2026-10 | Product evidence |
| Interview 007 | `discovery/interviews/007-student-photographer-social-animator.md` | n/a | 2026-10 | Product evidence |
