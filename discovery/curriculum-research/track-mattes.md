# Research brief: track mattes

**AE version: unknown** (the cockpit task did not say which version the builder runs). Every
version-dependent claim is flagged. Researched 2026-10-20 (sprint 3, parallel run 1, group C).
**Access note:** Adobe's help site (helpx) returned 403 to my fetch tool, so Adobe-doc claims
below rest on search-result excerpts of the official pages, not a full read. Re-read the official
page before the spec is written.
**UXP status:** `discovery/ae-bridge-findings.md` (2026-09-28): AE UXP public beta is due Nov 2026;
everything here that mentions reading the project assumes the current CEP/ExtendScript path.

## What it is

A track matte uses one layer's transparency (alpha) or brightness (luma) to decide which parts of
another layer show. It is the "put a text or shape window over a video" skill, and the
beginner's first step from masks to layer-to-layer relationships.

## Prerequisites

- Layer stack and the switches/Modes columns (the Track Matte menu lives in the Modes column;
  it is often hidden and has to be turned on from the timeline's column menu). [School of Motion,
  weak-to-medium]
- Knowing what alpha (transparency) is. Illustrator and Photoshop learners get this from layer
  masks and clipping masks, which is the right bridge: a clipping mask is "layer above clips
  layer below" and an AE alpha matte is the same idea with the roles reversed on the stack
  (matte on top, hidden). Interview 006 had done clipping masks "and still had to look it up".
- No hard dependency on easing or keyframes. Mattes are static unless the matte layer moves, so
  the lesson can be taught with no animation, then connected to keyframes ("move the matte
  layer"). Relation to easing: a moving matte (a wipe or a reveal) is a natural practice target
  after easing, because the learner can ease the matte's position.
- Soft prerequisite: shape layers or text layers (the usual matte sources) and masks (the
  alternative way to get the same result). See the shape-layers and masks briefs.

## How it is usually taught, and in what order

1. What a matte does: one layer carves a window for the layer below. [School of Motion article;
   Adobe help page excerpt: "text layer as a Track Matte ... show through the shapes defined by
   the text characters"]
2. Set-up: put the matte above the fill layer, show the Modes column, choose Alpha Matte.
   School of Motion's order: matte on top (supplies alpha or luminance), fill layer below.
3. Alpha vs luma: alpha uses transparency; luma uses brightness.
4. Inverted variants (cut a hole instead of a window).
5. Animate the matte layer (move, scale) or the content under it, for reveals and text-fill.
6. Often added: when to use a matte instead of a mask (text as a window onto footage; a matte can
   be animated and restyled as a whole, where masking each character is tedious).

**Disagreement or variation worth showing the designer.** Older tutorials (most of what a
learner will find) teach "the matte must be directly above the layer it affects". Since AE 23.0
(Oct 2022) that is no longer true: the matte can be anywhere in the stack, chosen from a
dropdown or pickwhip, one matte can serve several layers, and Alpha/Luma and Invert are two
toggle switches rather than four menu items. Older videos therefore show four menu entries
("Alpha Matte", "Alpha Inverted Matte", "Luma Matte", "Luma Inverted Matte") where the current UI shows
a layer picker plus two toggles. This is a direct instance of belief 16 (help for the wrong
version), and it is documented. See "Version-dependent".

## Common beginner mistakes (with what the wrong result looks like)

Frequency is judged from forum-thread count and tutorial warnings only; I did not find a count
anywhere. "Seems common" means several independent threads; "one thread" means a single source.

| Mistake | What the comp shows | Where it came from | How often |
|---|---|---|---|
| Matte layer has no transparency (a full-frame solid, or a shape with fill set to None), so nothing is cut | Target layer vanishes entirely, or nothing changes | Adobe Community "track matte not working" threads (a shape matte with no fill or stroke; an expert's advice to solo the matte and turn on the transparency grid) | Seems common (several threads) |
| Choosing alpha when the matte is meant to be luma (a black and white image), or the reverse | Wrong area shows, or all of it shows | Tutorial explanations of alpha vs luma (School of Motion); inferred for the failure mode | Plausible, one source for the concept |
| Forgetting the Modes column is hidden, so "there is no track matte option" | Learner can't find the control | School of Motion; Adobe help (right-click the timeline header, Columns, Modes) | Seems common |
| Setting the Track Matte dropdown when meaning to parent (or the reverse); the Parent & Link column sits next to it | Layer disappears after a "parenting" attempt | Adobe Community thread (layer disappeared after parenting to a tracked null) | One thread, but a plausible Illustrator-to-AE confusion |
| Expecting the matte layer to stay visible, or turning it back on | Matte layer's own picture shows over the result, or "my matte vanished" | Adobe Community expert: setting a matte turns the matte layer's visibility off by design | Seems common; School of Motion does not explain it |
| Expecting mattes to stack (matte on a matte) | Second matte has no effect | Adobe Community Manager, May 2024: "as designed" for the render graph; moved to feature requests | One thread, official answer |
| Matte and target are different sizes and Set Matte is tried as a workaround | Odd or unusable results | One commenter in the same community thread | Weak |
| Opening an old project or tutorial in a new version and the matte menu looks different | Confusion about missing menu entries | Inferred from the 23.0 change | Plausible; not directly evidenced |

Illustrator/Photoshop angle (my inference, flag as a hypothesis to test): learners from clipping
masks expect the matte to stay visible and expect "the layer above clips the layer below" to hold
for any arrangement. In AE the matte is hidden and can be anywhere.

## Overlaps with other AE concepts (each spec must list and test these)

- **Hidden layers.** Setting a layer as a matte turns off its video (eye) switch automatically.
  A "hidden" matte layer is therefore normal, not an error. A checker that treats every hidden
  layer as a problem would flag every correct matte. The reverse also matters: turning the eye
  back on is a very common wrong state (the matte shows over the result).
- **Precomps.** Track mattes act within a comp. A matte in a nested comp doesn't affect layers in
  the parent, and precomposing the target layer without its matte breaks the link (the AE 23.0
  note says mattes can be shared by several layers; moving some of them into a precomp splits
  them). Also the usual workaround for "matte on a matte" is to precompose. [Reasoning from AE
  behavior, partly the Adobe Community thread; no single source states all of it.]
- **Effects.** Set Matte (an effect) and Alpha Matte/Luma Matte effects do similar jobs; old
  tutorials use them. "Effects" and "mattes" overlap in what the learner sees, and a check that
  looks only at the Track Matte menu will miss a matte built with the Set Matte effect. The
  sanity check: read both the matte setting and the effect list.
- **Masks.** A mask on the matte layer shapes the matte. A mask on the target layer is the other
  way to the same result. Both can be present at once; a check must say which one is doing the work.
- **Expressions over keys / single and hold keys / separated dimensions.** A matte is itself
  static. When the matte layer's position, scale, or opacity is keyframed, those rules from
  the easing slice apply unchanged (hold keys on a matte layer's position produce jump cuts in
  the reveal; separated dimensions hide x/y keys behind separate properties). The matte *setting*
  is not animatable, so there is nothing to detect there.
- **Opacity.** Opacity of the matte layer, set below 100%, thins the matte (alpha) without any
  message. A frame check or an alpha read is the only way to see it.

## Version-dependent

| Claim | Version | Source | Strength |
|---|---|---|---|
| Matte can be any layer; dropdown or pickwhip; two toggle switches (alpha/luma, invert); one matte for several layers; legacy scripts that don't name a matte source fall back to "layer above" | AE 23.0 (Oct 2022) | CG Channel 23.0 release article; Adobe Community beta posts "Feature focus: selectable track matte layers" and "new scripting API for selectable track matte layers" | Medium (trade press quoting Adobe, plus Adobe Community announcements) |
| Projects saved in the 23.0 beta could not open in earlier versions | 23.0 beta | Adobe Community beta post | Weak-medium |
| Mattes can't be stacked (still true, called "as designed") | Thread May 2024; no later change found | Adobe Community | Medium (staff answer), but as of 2024, re-check in current version |
| AI Object Matte tool (click a moving subject; generates and tracks a matte). Different from Track Matte, and the name will confuse beginners | AE 26.2 (Apr 2026) | CG Channel and Digital Production, Apr 2026; Adobe's help "What's new" page excerpt | Medium. Unconfirmed: what it produces in the timeline (mask, layer, or effect). |
| Draft 3D mode once made mattes seem not to work until a 3D layer existed | AE 2021 | One Adobe Community thread | Weak, likely obsolete |
| Whether current UI labels in 2025-2026 differ (a 2025 thread mentions the Track Matte column showing layer names without the older Alpha/Luma options) | 2025 | One community post, no resolution seen | Weak; test on the builder's version |

Nothing found that changes the track matte UI between 24.0 and 26.3. I could not read the
version-by-version release notes (helpx blocked), so this is "not seen", not "not changed".

## What the mentor could check

Signals reachable with the existing reads (`ae_run_script` ExtendScript), plus the frame preview.
The 23.0 scripting API exposes the matte layer and type on a layer; I believe these are
`layer.trackMatteLayer`, `layer.trackMatteType`, `layer.hasTrackMatte`, `layer.isTrackMatte` and
`layer.setTrackMatte(layer, type)`, but I did not verify the exact names in the scripting guide;
test them on the builder's version first.

- **Right:** the target layer has a matte layer set; the type is alpha or luma as intended; the
  matte layer is flagged as a matte and its eye switch is off; the matte layer has real alpha
  (a shape with a fill; a text layer) or real luma values; preview frame shows the fill through
  the window.
- **Wrong, and visible in a read:** target has no matte; matte layer is the wrong layer (e.g. the
  background); type is alpha on a luma image; matte layer is a full-frame solid (no alpha to cut);
  matte layer's video switch is on (matte shows) or layer is both matte and below the visible
  fill; shape matte with fill None.
- **Wrong, only visible in a frame:** the output is empty or fully visible. Needs `ae_preview_frame`
  and a model look; an alpha read is not available from the summary tools.
- **Needs a new read:** a "matte graph" for the whole comp (which layer matte-targets which),
  since only `ae_run_script` can read it today, and the narrow mentor tools do not.
- **Change detection:** snapshot/diff would catch a changed matte layer or type; it would also
  catch an eye switch flipping.

## Open questions

1. What is the builder's AE version? The matte lesson's wording and its checks depend on 23.0+
   (almost certainly true for any current install, but confirm).
2. What does Object Matte (26.2) create in the timeline, and does the mentor's snapshot see it?
3. Do target-market learners meet the old four-item menu (via old videos) and get confused? Ask
   "did the steps match what you saw on screen?" (belief 16 follow-up).
4. Does the pre-23.0 "layer directly above" teaching still lead to wrong results in 26.x? E.g.
   a learner following an old video and picking the layer above by habit. Test, don't assume.

## Sources

| Title | Link | AE version | Date | Strength |
|---|---|---|---|---|
| Adobe: Track mattes and traveling mattes (help page, seen only through search excerpts) | https://helpx.adobe.com/after-effects/using/track-mattes-and-traveling-mattes.html | Current docs, includes 23.0 matte-picker wording | Not shown | Strong for what it says; I did not read it in full |
| School of Motion: How to use track mattes in After Effects | https://schoolofmotion.com/blog/how-to-use-track-mattes-after-effects | Not stated | Not shown | Established teaching, medium (no version mention, no mistakes section) |
| CG Channel: Adobe releases After Effects 23.0 | https://www.cgchannel.com/2022/10/adobe-releases-after-effects-23-0/ | 23.0 | 2022-10-18 | Trade press, medium |
| Adobe Community: Feature focus, selectable track matte layers | https://community.adobe.com/t5/after-effects-beta-discussions/feature-focus-selectable-track-matte-layers-have-arrived/m-p/13110664 | 23.0 beta | 2022 | Official announcement on forum, medium |
| Adobe Community: New scripting API for selectable track matte layers | https://community.adobe.com/questions-534/new-scripting-api-for-selectable-track-matte-layers-314161 | 23.0 beta | 2022 | Official, medium |
| Adobe Community: Allow track mattes to stack (staff: "as designed") | https://community.adobe.com/feature-requests-530/allow-track-mattes-to-stack-1214678 | 24.x | 2024-05 | Staff answer, medium |
| Adobe Community: Track matte not working (several threads) | https://community.adobe.com/t5/after-effects-discussions/track-matte-not-working/m-p/10398671 | Mixed, incl. 2021 | 2019-2023 | Forum, weak individually |
| CG Channel: Adobe releases After Effects 26.2 | https://www.cgchannel.com/2026/04/adobe-releases-after-effects-26-2/ | 26.2 | 2026-04-15 | Trade press, medium |
| Digital Production: AE 26.2 adds Object Matte | https://digitalproduction.com/2026/04/17/adobe-after-effects-26-2-adds-object-matte-and-more/ | 26.2 | 2026-04-17 | Trade press, medium |
| Interview 006 (clipping mask looked up again) | discovery/interviews/006-graphic-designer-photographer.md | n/a | 2026-10-01 | Repo evidence (cite only) |
| Belief 16, interview 008 | discovery/insights.md; discovery/interviews/008-freelance-web-graphic-designer.md | n/a | 2026-10-12 | Repo evidence, Hunch |
