# Brief: parenting and null objects

AE version: unknown (builder's session 2026-10-08 used the AE beta, 26.5-era). Flags: "VERSION".
Written 2026-10-20, group B, Sprint 3 parallel run 1.

Source strength: A = Adobe official, B = established teaching, C = single tutorial or forum
thread, R = repo evidence. Adobe's help pages returned HTTP 403 to my fetcher, so I have no
first-hand Adobe doc text on parenting. The best source I read in full is the Meyers' book chapter
(B) and it is from CS4/CS5 era (2011).

## What it is

Parenting makes one layer's transform (position, scale, rotation) carry other layers with it. A
null object is an invisible layer used as a handle so many layers can move together without
changing their own animation.

## Prerequisites

- Transform properties and the anchor point (the parent's anchor is the pivot for the whole group).
  The anchor point brief sits underneath this one.
- Basic keyframes. Not easing, but easing then becomes relevant: moving a null shifts everything,
  so you ease the null (and the graph editor / easing skills apply to it).

## How it is usually taught, and in what order

The Meyers (B, 2011) give the clearest order, which matches most tutorials:

1. Parent with the pick whip or Parent menu: children inherit Position, Scale, Rotation but **not**
   Opacity, masks, or effects. Parenting works within one comp.
2. Why a null: parenting a visible layer to a visible layer drags the parent's own motion into
   the child; a null avoids that. Children keep their own animation and move with the null.
3. Null defaults: invisible, 100 x 100 default, anchor at upper-left (0,0), never renders. (CS-era detail; VERSION, verify.)
4. Hierarchies (parent chains), symmetric layouts via rotating a central parent.
5. Caveat: non-uniform scale on a parent distorts children and skews them when rotated.
6. Jump behavior: parenting and unparenting with Option/Alt changes whether the child keeps its
   visual place or its numbers.
7. Right-click a parent to select all children; Ctrl/Cmd-click the pick whip to detach; Shift+F4
   shows the Parent column.

Other sources (C): Storyblocks and PremiumBeat tutorials teach the same four steps (create null, pick
whip children to it, animate the null, optional motion blur). Not worth separate treatment.

## Common beginner mistakes (what it looks like in the comp)

Frequencies are "present in sources", not measured. We have no beginner data of our own.

| Mistake | What you see | Source | Seen |
|---|---|---|---|
| Parenting to a visible layer instead of a null | The child inherits the parent's moves/scale; parent can't be moved or animated without dragging children | B (Meyer) | very common |
| Expecting Opacity to follow the parent | Fading the parent/null leaves children fully visible | B (Meyer), C | very common |
| Child "jumps" or snaps when parenting | Layer leaps to a new place the moment it is parented (or when unparented) | B (Meyer); C (Adobe Community, "Shift parenting" thread) | very common |
| Non-uniform parent scale | Children stretch, and skew when they rotate | B (Meyer) | occasional |
| Scale of parent at 0 or very low | Children collapse or vanish; parenting a 0%-scale layer breaks | C (Adobe Community) | occasional |
| Stacked parent and child motion | Child appears to move twice, "settles" off-beat because parent drift and child keys don't share timing | R (Adobe assistant, 2026-10-08, item 3, hedged) | in our test comp |
| Child with rotation and non-proportional scale on solids | Parenting makes it jump and distort (2018 thread; fixed by using masks or a shape layer) | C (2018, AE 15.1.2; old, may be fixed) | old |
| Expression-driven child follows null from the wrong place | Child shifts at parenting time | C (Adobe Community) | occasional |
| Parent pick whip missing for the camera | Learner can't find the Parent pick whip on camera layer; there are now two pickwhip columns | C (Adobe Community, Adobe staff reply) | seen once |
| Circular or accidental parent (dragging the pick whip to the wrong row) | Layer moves when the learner moves a different layer | not found in a source; plausible from interview 007 ("finding what broke") | unverified |

**Stacked parent motion, in detail.** The Adobe assistant said the Title and Subtitle were "moving
twice" because CTRL drifts while they run their own keys, and that this "can make the settle
feel slightly off" (R). This isn't a bug; stacking is how parenting works, and it was hedged
("slightly"). The real trouble is diagnostic: a learner can't tell *where* a motion comes from
(layer keys, a parent's keys, an expression), so "finding what broke" gets slow (interview 007).
Recommendation for the designer: teach "where does this movement come from?" as the parenting
skill's diagnostic step: check parent first.

## Version-dependent

- Parenting basics: unchanged in all teaching I found. The Meyer chapter is from 2011; the pick whip
  and the Parent & Link column are the same in every source up to 2026 (C, A via search).
- Null default properties (size, anchor at 0,0, invisible): from CS4/CS5 text. VERSION: the modern null
  shows an outline in the comp panel and has a layer size you can set; I have not verified opacity
  and anchor defaults in 26.x. Flag as out of date until tested.
- 25.4 (Aug 2025): hold Cmd+Option / Ctrl+Alt while dragging layers to stagger them; "shifts layers
  without altering keyframe animations" (Adobe feature summary, via search). Interacts with parented
  layers; unverified.
- 25.6 (Nov 2025): single 3D gizmo for multiple 3D layers (ProVideo Coalition). Relevant to moving
  groups of 3D layers; parenting not mentioned.
- 26.5 (Sept 2026): no parenting changes found (Adobe Community post). Adobe's AI Assistant (beta,
  26.5) is the thing most likely to answer "why is my layer moving" for learners now.
- The camera pick whip thread shows the UI has two pick-whip columns (Adobe Community): a learner on a
  newer build may see a different Parent column layout than older tutorials (belief 16 trap).
- Tutorials' screenshots from before 25.0 (Oct 2024) predate the new UI themes.

## Overlaps with other AE concepts

- **Expressions over keys:** a parent link via expression (`parent` property or `thisLayer.parent`) vs the pick whip parent are different things; an expression on Position/Scale/Rotation of a child can override what the parent is expected to supply. `parent` in a script reads the pick-whip parent only; an expression-linked follower won't appear (confirm in specs/001: `layer.parent` is script-only and omitted when none).
- **Single and hold keys:** a hold key on the parent makes children jump at the key; a child with a single key is just offset by the parent's current position.
- **Separated dimensions:** a parent or child with separated X/Y Position still inherits fine; reading "its Position" needs two properties.
- **Effects:** effects are not inherited (B, Meyer), so a "glow on the parent" doesn't reach children.
- **Precomps:** parenting works within a comp only (Meyer). A layer parented to a null inside a precomp can't be moved from the outer comp's null. Collapse Transformations changes how transforms flow.
- **Hidden layers:** a hidden null still moves its children (that is the point). A hidden *visible* parent also still moves children, a common source of "what is moving this?" The mentor must not skip hidden parents.
- **Anchor point:** the parent's anchor is the pivot for rotation and scale of the whole group.

## What the mentor could check

Reads available: `layer.parent` via script, transform values and key counts via `ae_comp_info`,
keyframe times/values/ease (specs/001, rows 2-5). Parent names and hierarchy therefore need a
script read; the current tools already pass `layer.parent`.

- Right: shared motion lives on one null; children keep their own keys; the null is named for its purpose; the null is not a visible layer; hierarchy has no more than the needed depth.
- Wrong: the child's own keyframe count is unchanged but it moves after parenting (jump), position value changed at parenting time.
- Wrong: parent has non-uniform scale (X != Y) and has children (distortion risk).
- Wrong: children plus parent both animating the same property over the same window ("stacked motion": a tool can detect overlapping key ranges on parent and child for the same property).
- Wrong: a visible, content-bearing layer used as a parent when the aim was a group handle.
- Wrong: fading the null expecting children to fade (parent opacity != 100 and children at 100).
- New reads likely needed: the whole-comp hierarchy (list every parent chain), the opacity of parents, "is the null enabled/visible/guide". The 2026-10-08 Adobe session already shows why this is a differentiator for *diagnosis*: "equal durations, stacked parent motion" came from reading the whole comp (CLAUDE.md next-step 2).

## Open questions

1. Is parenting one skill or two (parent a few layers to a null, vs. rigging with hierarchies)? Beginners only need the first. Recommendation: one skill, with nulls included (not separate), scoped to "one null, a few children"; push rigging (chains, expressions linking) out of scope.
2. What does a modern 26.x null look like (anchor, opacity, size)? Needs a quick test.
3. Do 2018-era bugs (jump on parenting with rotated, scaled solids) still occur? Test.
4. Will learners meet Adobe's assistant and ask "why is this moving?" Interview question for the next learner.

## Sources

| Title | Link | Version | Date | Strength |
|---|---|---|---|---|
| Parenting Skills, Chris and Trish Meyer (book excerpt), ProVideo Coalition | https://www.provideocoalition.com/cmg_hidden_gems_chapter_17_-_parenting_skills/ | CS4/CS5 | 2011-03-28 | B, old |
| Shift parenting not snapping (Adobe Community) | https://community.adobe.com/t5/after-effects-discussions/shift-parenting-not-causing-layer-to-snap-to-the-exact-position-of-the-null-object/m-p/14703618 | unknown | ~2024 | C |
| Parenting problem, weird results (Adobe Community) | https://community.adobe.com/t5/after-effects-discussions/parenting-problem-what-s-going-on-weird-results/m-p/13087124/highlight/true | 15.1.2 (2018), replies 2022-23 | 2018-12-26 | C |
| Where is the pickwhip for 3D camera (Adobe Community) | https://community.adobe.com/t5/after-effects-discussions/where-is-the-pickwhip-for-3d-camera/m-p/15384204 | recent | ~2025 | C |
| Pick whip in After Effects, PremiumBeat | https://www.premiumbeat.com/blog/pick-whip-adobe-after-effects/ | not stated | unknown | C |
| After Effects 25.4 feature summary (Adobe) | https://helpx.adobe.com/after-effects/using/whats-new/2025-4.html | 25.4 | 2025-08 | A (search summary) |
| After Effects news Nov 2025, ProVideo Coalition | https://www.provideocoalition.com/after-effects-news-november-2025/ | 25.6 | 2025-11 | B/C |
| What's new in 26.5 (Adobe Community) | https://community.adobe.com/announcements-527/after-effects-26-5-is-here-1641108 | 26.5 | 2026-09 | A |
| Adobe AI assistant transcript | discovery/usage-notes/adobe-assistant-2026-10-08.md | beta | 2026-10-08 | R |
| Bridge spec 001 | specs/001-ae-mcp-bridge-test/spec.md | CEP | 2026-09 | R |
