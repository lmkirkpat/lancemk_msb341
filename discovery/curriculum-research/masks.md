# Research brief: masks (and the mask-vs-shape-layer trap)

**AE version: unknown** (not given in the cockpit task). Researched 2026-10-20 (sprint 3,
parallel run 1, group C). **Access note:** Adobe's help pages (helpx) returned 403 to my fetch
tool, so the official-docs claims here come from search excerpts only. Claims marked
"background" are my own knowledge of AE, not tied to a source I read; the designer should verify
them before they become spec text. UXP status per `discovery/ae-bridge-findings.md`: public beta
due Nov 2026, so reads below assume ExtendScript through the current CEP bridge.

## What it is

A mask is a path drawn on a layer that decides which part of that layer is visible (or, with
modes, how several paths combine). It is the AE version of a vector clipping or layer mask, and
the usual first way to cut out or reveal part of footage or artwork.

## Prerequisites

- Layers, the Selection tool, and the Pen/Shape tools. Illustrator and Photoshop learners already
  know the Pen tool; the AE-specific surprise is that the same tool makes either a mask or a
  shape layer depending on what is selected (see mistakes).
- Keyframing basics, only for animating a mask path. Static masks need none. Easing is relevant
  later: a mask path has a keyframe (Mask Path) with interpolation and ease like any other
  property, so a mask reveal is a natural second use of the easing lesson.
- Not required: shape layers. They are an alternative, not a prerequisite. Teaching order
  (below) varies on which one comes first.

## How it is usually taught, and in what order

Reconstructed from two teaching sources plus Adobe doc excerpts; no single canonical syllabus
was found, which is itself a finding.

1. **Mask vs shape layer.** PremiumBeat (2014): the same tools (Q for shape tools, G for Pen)
   produce a mask if a layer is selected and a shape layer if nothing is. Tools panel shows
   Fill and Stroke when set to make shapes. [teaching article, weak-medium, old]
2. **Draw a mask on a footage or solid layer; the visible part is inside the path.**
3. **Mask modes** (None, Add, Subtract, Intersect, Lighten, Darken, Difference). The PremiumBeat
   piece names Add, Subtract, Intersect, None. I found no source that teaches the full mode list
   in order; the search did not turn up Adobe's mode section. (Background: Lighten, Darken and
   Difference only change things when masks overlap with different opacities.)
4. **Mask feather, mask opacity, mask expansion** for soft edges. PremiumBeat: feathering exists
   for masks, not shape layers.
5. **Animating the mask path** (stopwatch on Mask Path), then **mask tracking** for footage
   (Roto, tracking). The mask tracker got a faster algorithm and Timeline-panel controls in 26.3
   (June 2026), see Version-dependent.
6. **Alternatives:** track mattes (see the track-mattes brief) and shape layers.

**Variation.** Some teachers go masks first (cut things out of footage); others go shape layers
first and treat masks as a side feature. Motion-design-focused sources (shape-layer-heavy
tutorials) lean the second way; the PremiumBeat article presents them as one tool with two
outputs. Treat this as a genuine design choice for the curriculum rather than a settled order.
My reading: since the two share a tool and the failure mode (wrong output type) is the first
thing beginners hit, the two briefs should be read together.

## Common beginner mistakes (with what the wrong result looks like)

| Mistake | What the comp shows | Source | How often |
|---|---|---|---|
| Drawing with a layer selected when a shape layer was wanted (or the reverse) | A mask appears on the selected layer instead of a new shape layer; or an unexpected extra layer appears. Layer's outline is visible but nothing new in the stack. | PremiumBeat; Adobe Community threads ("shape layer fill not visible", "can't see the shape layer") | Seems common (several threads) |
| Mask appears to do nothing | Footage or solid shows fully; looks like the mask isn't applied | Adobe Community ("layer masks aren't working or switched off"); one thread reports an app bug later fixed by updating | Seems common; cause varies, so treat as a diagnosis exercise |
| Mask mode set to None (or Subtract) by accident | Mask outline visible but layer shows fully; or the inside disappears instead of the outside | Adobe Community, plus background | Plausible, not counted |
| Mask path hidden in the viewer, so the learner can't find or edit it | Layer cut but no outline to click | Adobe Community ("toggle mask and shape path visibility not showing"); PremiumBeat suggests hiding outlines with Cmd/Ctrl+Shift+H | Seems common |
| Accidentally creating many masks with every click-drag while the layer is selected | Several mask rows on the layer; the shape looks cut in odd ways | PremiumBeat | One source |
| Looking for Feather on a shape layer | No feather option | PremiumBeat | One source; a shape layer has no mask feather |
| Pen tool: not closing the path, or RotoBezier turned on | Open path does nothing as a mask; every click makes a curve | PremiumBeat | One source |
| Mask feather on a layer that has already been scaled or precomposed (background) | Feather looks different in size than expected | Not sourced | Hypothesis |

Illustrator/Photoshop angle (hypothesis, from background and interview 006): learners expect the
mask to live on a separate object, as in a Photoshop layer mask or Illustrator clipping path.
In AE it lives inside the layer's Masks group, so a mask that exists is easy to miss when
scanning the stack. Interview 006's clipping-mask story ("I've done the clipping mask") shows
experienced designers still look up masking.

## Overlaps with other AE concepts (each spec must list and test these)

- **Hidden layers.** A mask on a layer whose eye switch is off is invisible but present. Also:
  the Masks twirl-down is a property group that the layer-level eye does not govern, but the
  per-mask "lock" and visibility toggles in the viewer do. Checks should read layer and mask
  states separately.
- **Expressions over keys.** Mask Path can have an expression or be linked; ExtendScript reads
  keyframe count and expression separately. A mask path driven by expression has 0 keyframes
  and looks "unanimated" to a keyframe-count check. (Background; same issue the easing slice
  already handled for other properties.)
- **Single and hold keys.** One mask-path keyframe means a static mask; hold interpolation on a
  mask path gives pops rather than morphs. Any "is it animated" check must count keys and read
  interpolation.
- **Separated dimensions.** Not applicable to Mask Path (a shape property, not x/y/z). It
  applies to the layer under the mask: if a learner animates position to simulate a mask
  moving, they are animating the layer, not the mask. Include in "what's being animated".
- **Effects.** Many tutorials fake a mask with an effect (e.g. a Matte or Set Matte effect, Roto
  effects, or a Rectangle/Ellipse effect). Mask feather and an effect's feather are separate
  controls with different names. Mask tracker output and Object Matte (26.2) are new routes to
  the same outcome.
- **Precomps.** A mask on a precomp layer cuts the precomp's result; a mask inside the precomp
  cuts only that layer. Beginners who precompose after masking sometimes lose the cutout, and
  "Move all attributes" vs "Leave all attributes" decides where masks end up. (Background;
  confirm.) Collapse Transformations also changes where a mask applies.
- **Track mattes.** An alternative to masking each layer; a mask can also shape the matte layer.
  See the track-mattes brief.

## Version-dependent

| Claim | Version | Source | Strength |
|---|---|---|---|
| Updated mask tracker, up to 5x faster, tracking started from the Timeline panel (not only the Tracker panel); a July 2026 report says tracking failed at half resolution in 26.3 and a fix was said to be in later betas | 26.3 (June 17, 2026) | Adobe release notes via search excerpt; ProVideo Coalition June 2026; Adobe Community bug thread | Medium for the feature, weak for the bug |
| AI Object Matte tool as a no-paint alternative to Roto Brush | 26.2 (Apr 2026) | CG Channel, Digital Production | Medium |
| No change to the mask UI itself (modes, feather, path) found between 23.0 and 26.3 | n/a | Searches for 24.x, 25.0, 26.2 release coverage turned up none | Weak: absence of evidence; helpx release notes unread |
| Shape-layer vs mask behavior (selection decides the output) is described in a 2014 article and still matches current descriptions | CS3-era behavior; the PremiumBeat article is 2014 | PremiumBeat; forum answers still say the same in 2024-2025 | Medium |
| 25.0 (Oct 2024) added interface themes; nothing mask-specific found | 25.0 | CG Channel | Weak: look and feel only |

## What the mentor could check

Reads through `ae_run_script`/ExtendScript; names are background knowledge of the API, to
confirm on the builder's version (layer.mask / "ADBE Mask Parade", `maskMode`, `maskFeather`,
`maskOpacity`, `maskExpansion`, `inverted`, `locked`, mask path keyframes via the normal
property key reads, `numKeys`).

- **Right:** the intended layer has a mask; mode is what the lesson called for (e.g. Add for a
  reveal, Subtract for a hole); feather and expansion set if the lesson asked; for animation,
  Mask Path has two or more keys with non-hold interpolation, and optionally ease applied (reuse
  the easing reads); preview frame at start and end shows the shape.
- **Wrong, readable:** a mask exists with mode None; mask on the wrong layer; mask inverted by
  accident; many stray masks (count > expected); a shape layer was made when a mask was
  intended (a new layer appears; the snapshot diff shows a layer added instead of a mask added);
  mask path has one key; mask path driven by expression (0 keys but animated).
- **Wrong, frame only:** cutout in the wrong place or feathering too soft; needs
  `ae_preview_frame`.
- **Needs a new read:** per-mask details (the six built-in tools give counts and names, not
  masks), so a narrow `read_masks` tool would be needed before a mentor tool can check this
  without `ae_run_script`.
- **Change detection:** snapshot and diff would show masks added/removed, mode changes, and key
  counts; that is enough for "did the learner do the thing".

## Open questions

1. Which first: mask or shape layer? No source gave an evidence-based order. A quick test
   would be to watch two target-market learners, or ask in the next interview which they met
   first and what went wrong (links to interview 007's "finding what broke").
2. Does the PremiumBeat selection rule hold in the current version (26.x) for the builder? It is
   a 2014 article; recent forum answers still say it, but confirm live.
3. How do mask tracker and Object Matte change what a beginner lesson should cover? Possibly
   they belong in a later "roto and tracking" skill, not here.
4. What does "Mask feather" teach that the Gaussian-blur-on-a-matte workaround doesn't (an
   Illustrator/Photoshop learner might try that)? Unsourced.
5. Full mode list, and what Adobe's docs say about Lighten, Darken, Difference. Re-read the
   official page; my fetch was blocked.

## Sources

| Title | Link | AE version | Date | Strength |
|---|---|---|---|---|
| PremiumBeat: Mask vs shape layers in After Effects | https://www.premiumbeat.com/blog/mask-vs-shape-layers-in-after-effects | Not stated; CS-era | 2014-03-25 | Established teaching blog, weak-medium, old |
| Adobe: Creating shapes and masks (help page; blocked, not read) | https://helpx.adobe.com/after-effects/using/creating-shapes-masks.html | Current | n/a | Official; unread |
| Adobe Community: shape layer fill not visible | https://community.adobe.com/t5/after-effects-discussions/shape-layer-fill-not-visible-this-should-be-a-really-easy-one-for-you-guys/m-p/14985026 | 2024-25 | 2024-25 | Forum, weak |
| Adobe Community: layer masks aren't working | https://community.adobe.com/questions-534/layer-masks-aren-t-working-or-are-switched-off-somehow-314302 | Mixed | n/a | Forum, weak |
| Adobe Community: toggle mask and shape path visibility not showing | https://community.adobe.com/t5/after-effects-discussions/my-toggle-mask-and-shape-path-visibility-is-not-showing-on-anything-in-the-comp/m-p/11836122 | Mixed | n/a | Forum, weak |
| ProVideo Coalition: After Effects portal June 2026 | https://www.provideocoalition.com/after-effects-portal-june-2026/ | 26.3 | 2026-06 | Trade press, medium |
| Adobe Community: track mask only works at full res (26.3) | https://community.adobe.com/bug-reports-528/track-mask-only-works-when-viewing-at-full-res-v26-30-1630579 | 26.3 | 2026-07 | Forum, weak |
| CG Channel: After Effects 26.2 | https://www.cgchannel.com/2026/04/adobe-releases-after-effects-26-2/ | 26.2 | 2026-04-15 | Trade press, medium |
| Interview 006 (clipping mask looked up again), 004 (found masking through ChatGPT in Lightroom) | discovery/interviews/ | n/a | 2026-09/10 | Repo evidence (cite only) |
