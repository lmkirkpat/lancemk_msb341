# Research brief: shape layers (contents, groups, Trim Paths, Repeater)

**AE version: unknown** (not given in the cockpit task). Researched 2026-10-20 (sprint 3,
parallel run 1, group C). **Access note:** Adobe's help pages returned 403 to my fetch tool;
official-docs claims come from search excerpts only. "Background" means my own knowledge of AE,
not a source I read; verify before it becomes spec text. Repeater and Trim Paths evidence is thin
(see Open questions): I found no syllabus-level source for Repeater order, so treat that
section as the weakest in the brief. UXP status per `discovery/ae-bridge-findings.md`: beta due
Nov 2026.

## What it is

A shape layer is a layer made of vector paths with fills and strokes, organized in groups, that
you animate directly (by path, by color, by Trim Paths, by Repeater) instead of cutting an
existing layer. It is the building block for lower thirds, icons, loaders, and "line draws
itself" motion, and the AE equivalent of Illustrator artwork.

## Prerequisites

- Layers and the Tools panel (Rectangle, Ellipse, Pen); Fill and Stroke settings in the toolbar.
- Keyframing, and ideally easing. Trim Paths is the classic first "real" use of keyframes plus
  easing: Start or End goes 0 to 100, then the learner eases it. The easing skill is therefore a
  helpful prerequisite for the draw-on lesson (it makes the result look right) but not for
  building a static shape.
- Illustrator knowledge helps: Pen tool, path, fill, stroke, groups, and "Add" (the Contents
  Add menu). Illustrator artwork can be pasted as editable shape layers; in 26.2 (Apr 2026) SVG
  can be pasted or imported as one shape layer per element (see Version-dependent).
- Does not require masks or mattes, but the mask-vs-shape-layer selection trap belongs here too
  (see the masks brief).

## How it is usually taught, and in what order

Sources: Lynda/LinkedIn "After Effects Apprentice: Shape Layers", Noble Desktop, Motion Array,
Adobe how-to on multiline patterns, a university motion class page (all via search excerpts, so
the order is partly my reconstruction):

1. **Draw a shape with no layer selected** (rectangle/ellipse/pen) so a shape layer is made;
   set Fill and Stroke. (PremiumBeat 2014; Adobe Community answers.)
2. **Read the Contents tree:** Group > Path > Fill > Stroke > Transform. Teachers present this
   as the thing that confuses people: properties live inside Contents and Groups, not on the
   layer itself. (Background; consistent with the forum threads about "where is Trim Paths".)
3. **Add > Trim Paths** and animate Start/End (and Offset) for a draw-on line. Usually the first
   animation. Examples include "chase around the outline" using Offset.
4. **Add > Repeater** for patterns and bursts; Motion Array's "shape bursts" tutorial is
   Repeater plus Trim Paths. Repeater copies, offset, and transform.
5. **Merge Paths / Zig Zag / Wiggle Paths / Pucker & Bloat** as extra "Add" items, later.
6. Stagger, then link to expressions.

**Variation.** Two ways are taught for Trim Paths on fill + stroke shapes: add Trim Paths and
accept that it trims the path (and so the fill too), or keep stroke and fill on separate groups
or duplicates. One forum thread recommends duplicating, with the stroke on one copy and fill on
the other, and trimming only the stroke copy. I found no official source that picks one;
show both to the designer.

## Common beginner mistakes (with what the wrong result looks like)

| Mistake | What the comp shows | Source | How often |
|---|---|---|---|
| Drawing with a layer selected, creating a mask not a shape | A mask appears on the selected layer; no new layer | PremiumBeat; Adobe Community | Seems common |
| Fill and stroke both on, then Trim Paths applied to expect only the line to draw | Fill remains or vanishes oddly; "weird fills" | Adobe Community Trim Paths threads (several) | Seems common |
| Animating Trim Paths with one keyframe, or the same value at both keys | Nothing animates | Adobe employee on a "no animation in Start or End" thread (need at least two keyframes with different values) | One thread but a classic |
| Start and End both animated when only End was needed; or neither at 0/100 at the start | Line is partly drawn at the start | Forum advice "Start at 0, animate End 0 to 100" | Plausible |
| Trim Paths applied outside the intended group, or not found (it is in the Add menu on Contents) | Trim has no visible effect, or can't be found | Adobe Community "Where is Trim Path in After Effects?"; a promotional guide says trim paths only works when inside the right group, verify | Seems common; second source weak |
| Rectangle trim draws as a circular or radial wipe, or direction is unexpected | Reveal goes around or from an odd start point | Adobe Community "trim paths of rectangular shape layer wiping radially" | One thread |
| Imported artwork from Illustrator: path drawn with paintbrush, or converted layer has no strokes for Trim | Trim Paths does nothing, or "outline not drawn" | Adobe Community (two threads: Trim Paths on an AI-drawn path; shape layer converted from Illustrator) | Two threads; high relevance to our Illustrator learners |
| Repeater: only the first copy is affected by Merge Paths, or copies animate in lockstep | Pattern looks wrong; all copies move together | Adobe Community ("randomize repeater trim paths"; Merge Paths + Repeater source) | Two threads, details thin |
| Shape invisible: fill and stroke both off, or eyeball off | Layer in stack but nothing shows | Adobe Community ("shape layer fill not visible") | Seems common |
| Looking for mask Feather on a shape layer | Not present | PremiumBeat | One source |

Illustrator/Photoshop angle (hypothesis): AE's Contents tree resembles Illustrator's
appearance/group structure but the "Add" menu and operators (Trim, Repeater, Merge) act as
modifiers that apply to *everything above them in the group*. That order-dependence is the
learner-facing surprise; I found no source that states it plainly, so it is background
knowledge. Test it with a real learner before treating it as a finding.

## Overlaps with other AE concepts (each spec must list and test these)

- **Expressions over keys.** Trim Paths End/Offset are often driven by expressions
  (wiggle, loopOut) or by a slider; an expression-driven Trim has zero keyframes yet moves.
  Repeater copies and offsets are also commonly expression-driven. A check on "is End
  animated" must read expression text as well as key counts (the same rule the easing slice
  uses).
- **Single and hold keys.** One key on Trim End is the classic "nothing animates" mistake (one
  Adobe employee answer); hold keys give a pop-on. Both are readable. Counts alone don't tell
  which.
- **Separated dimensions.** Applies to the shape layer's Transform and to the group's Transform
  (Position can be separated). Repeater Transform has its own Position, Scale, Rotation and
  does not have separated dimensions in the same way (background; check).
- **Effects.** The old way and tutorials use effects (Stroke, Write-on, Fill) for what shape
  layers now do natively; both are in the wild. Cases: learner applies the Stroke *effect* on a
  mask instead of a shape layer stroke. Checks must look at effects as well as Contents.
- **Precomps.** Trim Paths is per-layer. Precomposing a shape layer is common to apply
  effects, but changes where keyframes live (Move all attributes vs leave). Also "Continuously
  Rasterize" and collapse switches matter for shape layers inside precomps (background).
- **Hidden layers.** Shape layers used as track mattes get their eye switch turned off; a
  mentor must not flag them. Also a shape group's own visibility toggle (the eyeball inside
  Contents) is separate from the layer's eye. A hidden group is invisible to a layer-level
  check. This overlap is directly caught by the overlap-audit rule in CLAUDE.md.
- **Masks.** A shape layer can also have masks; mask feather and mask modes on shape layers are
  limited. Mixed cases need testing.

## Version-dependent

| Claim | Version | Source | Strength |
|---|---|---|---|
| Paste SVG/Illustrator content directly as editable shape layers (Edit > Paste) | Current "What's new" list, 26.x (date not in excerpt) | Adobe What's new (search excerpt) | Medium: unverified which release |
| SVG import as composition (one shape layer per element) or footage (single layer) | 26.2 (Apr 2026) | CG Channel | Medium |
| Depth of Field in the Advanced 3D renderer applies to shape layers | 26.x (June 2026 page) | Adobe What's new (excerpt) | Weak-medium |
| 3D Shape layers in Advanced 3D | 25.x (background, unverified) | none | Do not rely on |
| Core Contents/Trim Paths/Repeater UI: no changes found 23.0 to 26.3 | n/a | Searches turned up none | Weak: helpx notes unread |
| Old tutorials (before Adobe's Properties-panel and interface changes) use different menus in places; the 25.0 interface refresh (themes) changes look only | 25.0 (Oct 2024) | CG Channel 25.0 | Medium for "themes", nothing on shape layers |
| Old tutorials teach the Stroke/Write-on effects, not shape layer Trim Paths | 2000s-2010s teaching; Trim Paths and shape layers arrive CS5/CS3 era | PremiumBeat 2014 says shape layers date to CS3; Trim Paths timing is background | Medium/weak |

## What the mentor could check

Reads via `ae_run_script` (background on names: layer "ADBE Root Vectors Group" for Contents;
groups "ADBE Vector Group"; Trim "ADBE Vector Filter - Trim"; Repeater "ADBE Vector Filter -
Repeater"; each has Start/End/Offset, Copies/Offset, Transform). Confirm on the builder's
version.

- **Right:** a shape layer exists (layer type is shape); expected group contents (path, fill,
  stroke) present; Trim Paths exists in the group that holds the stroke; End has two or more keys
  with different values (0 to 100); ease applied (reuse the easing reads); Repeater has copies
  greater than 1 with non-zero transform; preview frame shows a partially drawn line mid-way.
- **Wrong, readable:** a mask was made instead of a shape layer (the diff shows no new layer);
  Trim Paths missing or on an unrelated group; one key on End or equal values; fill and stroke
  both on with Trim and the learner meant line-only; Repeater copies = 1; stroke width 0; fill
  and stroke both "none".
- **Wrong, frame only:** the line doesn't look like it is drawing; chase direction wrong;
  fill pops.
- **Needs a new read:** the built-in tools return a layer summary, not Contents. A
  `read_shape_contents` narrow tool (or `ae_run_script`) is required for every check above.
- **Change detection:** diff should compare Contents tree names plus Trim/Repeater values.

## Open questions

1. Should this be one skill or two (draw-on with Trim Paths vs the Contents/Repeater system)?
   Recommendation (not decision): split. Trim Paths is the high-value first animation and
   leads on from easing; Repeater is a separate, later pattern skill and the weakest-evidenced.
2. What do the target learners start with: Illustrator artwork pasted into AE (a real route)
   or shapes drawn in AE? Ask in interviews; it changes the first lesson's opening.
3. Is operator order (what sits above or below Repeater and Trim in the group) taught well
   anywhere? I could not find a source; need Adobe's doc page or a dedicated syllabus.
4. Which of the Contents-tree mistakes does a beginner hit in the first 10 minutes? Needs a
   test with a real learner or the builder's own usage notes.
5. When was Paste SVG added and which version needs it? Release notes unread.

## Sources

| Title | Link | AE version | Date | Strength |
|---|---|---|---|---|
| PremiumBeat: Mask vs shape layers | https://www.premiumbeat.com/blog/mask-vs-shape-layers-in-after-effects | CS-era | 2014-03-25 | Teaching blog, weak-medium, old |
| Adobe: Creating shapes and masks (blocked, not read) | https://helpx.adobe.com/after-effects/using/creating-shapes-masks.html | Current | n/a | Official; unread |
| Adobe: What's new in After Effects (search excerpt only) | https://helpx.adobe.com/uk/after-effects/desktop/what-s-new/whats-new.html | 26.2 to 26.3 | Updated 2026-06-17 | Official, partially seen |
| CG Channel: After Effects 26.2 | https://www.cgchannel.com/2026/04/adobe-releases-after-effects-26-2/ | 26.2 | 2026-04-15 | Trade press, medium |
| Adobe: Animate multiline patterns (how-to) | https://helpx.adobe.com/lv/after-effects/how-to/animate-multiline-patterns.html | Not stated | n/a | Official how-to, seen as a search hit only |
| Lynda/LinkedIn: After Effects Apprentice, 14 Shape Layers | https://www.lynda.com/After-Effects-tutorials/Exploring-shape-effects/79643/119548-4.html | Not stated | n/a | Established instructor course, seen as a search hit only |
| Noble Desktop: Animating shapes and text | https://blog.nobledesktop.com/learn/after-effects/animating-shapes-text | Not stated | n/a | Course material, hit only |
| Motion Array: Shape bursts in After Effects CC | https://blog.motionarray.com/?p=12340 | CC | n/a | Single tutorial, weak |
| Adobe Community: Trim paths causing weird effects / trim on AI-drawn path / where is trim path / rectangle trim wiping radially / converted from Illustrator | https://community.adobe.com/t5/after-effects-discussions/trim-paths-causing-weird-effects/m-p/8862067 (and related threads) | Mixed | 2016-2022 | Forum, weak individually |
| Adobe Community: randomize repeater trim paths | https://community.adobe.com/t5/after-effects-discussions/randomize-repeater-trim-paths/td-p/14654124 | 2024 | 2024 | Forum, weak |
| Interview 006, 007 | discovery/interviews/ | n/a | 2026-10 | Repo evidence (cite only) |
