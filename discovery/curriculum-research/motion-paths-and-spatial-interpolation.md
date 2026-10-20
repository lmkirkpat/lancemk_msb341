# Brief: motion paths and spatial vs temporal interpolation (incl. roving and separated dimensions)

**Group A, wave 1.** Researcher brief, 2026-10-20. **AE version: unknown** (flagged). Latest release found: 26.5 (Sept 2026). UXP beta (Nov 2026) irrelevant to content; relevant to what the mentor can read (see check section).

Strength key: A = official Adobe (search excerpt only; pages returned 403), B = established teaching, C = single tutorial/forum thread, P = practitioner knowledge not sourced here.

## What it is

Position motion has two separate behaviors: *spatial* (the shape of the path in the Composition panel) and *temporal* (how fast the layer moves along it over time, the speed/ease). Learners need this to understand why a layer swerves, overshoots, or loses its curve, and why the easing they already learned affects timing, not the path.

## Split/merge recommendation

This is the densest of the group A candidates and could be two lessons: (1) shape the path (spatial; Auto/Continuous/Bezier handles on the motion path), (2) spatial vs temporal as a mental model (what the easing skill didn't say). Separated dimensions and roving are the sharp edges; I recommend they appear as "what to check" rather than their own lessons. That is a recommendation only.

## Prerequisites

- Setting keyframes on Position (brief: transform-properties-and-keyframes).
- **Easing before this.** Temporal ease is the more common need; SoM and No Film School teach spatial/temporal together as a pair, but the learner's practical pain (stiff motion) is temporal first (P). Advice to the designer: use the existing easing skill's "speed" vocabulary, then introduce the path as the other half. The sources split on this: SoM puts spatial/temporal before types, Chris and Trish Meyer-style roving pieces assume both are known.

## How it's usually taught

1. Define interpolation as how AE fills values between keys; split it into spatial (path in the Composition panel) and temporal (timing on the timeline) ([School of Motion](https://www.schoolofmotion.com/blog/after-effects-keyframe-types), B; [No Film School, 2017](https://nofilmschool.com/2017/07/beyond-basics-keyframing-adobe-after-effects), B).
2. Show the motion path: dots are time ticks, so closer dots mean slower, wider spacing means faster (School of Motion, second page found via search, B; secondary).
3. Show Auto Bezier (default spatial), Continuous Bezier, and Bezier handles on the path. Adobe's help: Auto Bezier is the default for spatial changes; a Composition preference can switch to linear; it doesn't change existing keys ([Adobe: Keyframe interpolation](https://helpx.adobe.com/en/after-effects/using/keyframe-interpolation.html), A via excerpt).
4. Fix a harsh corner by changing the middle key's interpolation (No Film School, B).
5. Roving keyframes: select three or more keys, right-click one, "Rove Across Time". Only the first and last stay put in time; middle keys slide to even out speed, without changing the path. Meant for complex paths (map tracing, Motion Sketch). Needs at least three keys ([ProVideo Coalition, Nov 2015](https://www.provideocoalition.com/after-effects-hidden-gems-weekly-roving-keyframes/), B; No Film School, B). Only Position is shown as an example in the source; whether it works on other properties is unconfirmed here.

Disagreement worth showing: the source of the "dots" view (more dots = slower) tells the learner to read speed from the path, while the Graph Editor view tells them to read speed from a curve. The two are the same fact in two forms. A mentor read of the path cannot see the Graph Editor view at all (bridge limit, `discovery/ae-bridge-findings.md`: "It can't see the UI"), so the mentor must work from key times, tangents and eases.

Auto Bezier quirk: School of Motion says moving an Auto Bezier key converts it to Continuous Bezier (B, single source, not confirmed in Adobe excerpt).

## Common beginner mistakes

| Mistake | What a wrong result looks like in the comp | Source / frequency |
|---|---|---|
| Separated dimensions on, learner tries to curve the path | Handles on the motion path vanish; the path is straight or an unexpected shape; "I can't make the path curve" | C, several threads (e.g. [Adobe Community on handles](https://community.adobe.com/t5/after-effects-discussions/need-help-with-bezier-handles/m-p/13804367)) plus [Lester Banks, 2020](https://lesterbanks.com/2020/12/why-separate-dimensions-messes-with-your-keyframes/) (B-): "Most people assume that this is just a cosmetic difference in the user interface". Strongest-evidenced mistake in group A. |
| Separated dimensions turned on by default | New position props arrive already split (preference "Default Position Properties to Separated Dimensions") so the learner never chose it | C (forum advice to switch off preference). Is the preference default-on in the builder's version? Unverified; check. |
| Recombining dimensions loses information | Path/speed changes subtly after recombining; Adobe help says "some information about the motion path and speed is lost" (quoted on Creative Cow, so secondhand) | C |
| Editing X in the Graph Editor changes Y path/time | Axis edits interact, Y timing seems off | C |
| Roving applied to a 2-key pair or start/end key | Nothing happens or option unavailable | B (No Film School: need at least three keys) |
| Roving, then moving keys by hand | Timing changes the learner didn't intend because middle keys slide again | P; the ProVideo Coalition source doesn't cover it |
| Fixes path with temporal ease (or reverse) | Tweaks speed curve to fix a corner; corner remains; or vice versa | P, but consistent with spatial/temporal framing in B sources |
| Linear spatial interpolation left on after pref change | Sharp corners at every key | A (preference) |
| Hold on position | Layer teleports instead of moving along the path | overlap with keyframe-types |

## Overlaps (for the spec's list)

- **Expressions over keys.** A Position expression can ignore the path entirely (e.g. wiggle added to keys). The path still draws; the layer doesn't follow it. Existing property-level checks flag expression (`analyze.mjs` line 36).
- **Single and hold keys.** One Position key has no path. Hold in/out on Position makes the layer jump, no path segment between.
- **Separated dimensions.** The central overlap: no spatial handles, two properties, X and Y each with their own ease. `mentor/jsx/snapshot.jsx` lines 55-56 already skip the combined leader when split and keep the followers; the practice comp has a separated bar (`mentor/dev/build-practice-comp.jsx` line 142). Any path check must treat X/Y as the temporal-only case.
- **Effects.** Effects' point parameters (e.g. a center point) have spatial interpolation too; a path appears on the effect point in the Composition panel. Easy to miss.
- **Precomps.** Motion path of a layer inside a precomp is shown in the precomp, not the parent; collapse transformations also changes it (P).
- **Hidden layers.** A hidden or shy layer's motion path may not display; the learner sees nothing and assumes no motion.
- **Parenting.** Not in the user's overlap list but strongly relevant: a child's path is drawn in the parent's space, so it can "look" wrong (P). Suggest adding to the spec's list.

## Version dependence (2023 to 2026)

- Spatial/temporal interpolation, roving, and separated dimensions are long-standing and I found no release note changing them. Confidence: medium (24.x notes unread).
- Sources are dated: roving piece 2015, No Film School 2017, Peachpit CS4 2009, Lester Banks 2020. The concepts hold; menu items and panel layouts may not (belief 16). The Adobe Help page is current but was only read via excerpt.
- Quick Offset (25.4, August 2025) interacts with keyframe timing across layers; see timing brief. It shifts whole animations without touching spatial shape ([Adobe feature summary 25.4](https://helpx.adobe.com/after-effects/using/whats-new/2025-4.html), A via excerpt).
- 26.5 rebuilt Effect Controls (Sept 2026) may change how effect point parameters present their paths.
- The AI Assistant panel (26.5 beta) and the mentor's comparison in `discovery/usage-notes/adobe-assistant-2026-10-08.md`: not part of this brief.

## What the mentor could check

Reads that exist: key times, in/out types, temporal ease (speed, influence); separated-dimension handling in the snapshot.
- Right: the learner's Position keys are non-separated (or the learner knowingly split), keys have bezier spatial type, and the path has the shape intended; the timing eases still pair correctly.
- Wrong: dimensions separated and the learner expecting handles; hold or linear on a Position key; roving applied on a path with fewer than three keys; an expression on Position.
- **New read needed:** spatial tangents and spatial interpolation type per key (ExtendScript exposes them: `keyInSpatialTangent`, `keySpatialAutoBezier`, `keySpatialContinuous`, `isRoving`; per `discovery/ae-bridge-findings.md` "interpolation and spatial tangents" are reachable via `ae_run_script`, but the current `snapshot.jsx` does not return them). Roving state is an extra read (`keyRoving` is my memory of the API, not verified).
- The Graph Editor view and the on-screen path handles are not readable (bridge limit). To avoid the "can't see UI" gap, the mentor should ask the learner to describe what they see, or use a rendered frame via preview.

## Open questions

1. Is Default Position Properties to Separated Dimensions on in the builder's AE? (Tests: read the preference or check a new layer's Position.)
2. Does Rove Across Time work on non-Position properties? (Test in the comp.)
3. Is this one lesson or two? Risk: spatial vs temporal as a concept lesson with no artifact to check. The path shape is the artifact.
4. Auto-to-Continuous conversion on move: confirm in Adobe's page.

## Sources

| Title | Link | Version | Date | Strength |
|---|---|---|---|---|
| Adobe: Keyframe interpolation | https://helpx.adobe.com/en/after-effects/using/keyframe-interpolation.html | current help | undated | A (excerpt; 403 on fetch) |
| School of Motion: After Effects keyframe types | https://www.schoolofmotion.com/blog/after-effects-keyframe-types | unstated | undated | B |
| No Film School: Beyond the Basics, Keyframing | https://nofilmschool.com/2017/07/beyond-basics-keyframing-adobe-after-effects | CC 2017-era | 2017-07 | B |
| ProVideo Coalition: Hidden Gems, Roving Keyframes | https://www.provideocoalition.com/after-effects-hidden-gems-weekly-roving-keyframes/ | unstated | 2015-11-24 | B, old |
| Lester Banks: Why Separate Dimensions Messes With Your Keyframes | https://lesterbanks.com/2020/12/why-separate-dimensions-messes-with-your-keyframes/ | unstated (2020) | 2020-12 | B-/C |
| Adobe Community: need help with bezier handles | https://community.adobe.com/t5/after-effects-discussions/need-help-with-bezier-handles/m-p/13804367 | unstated | c. 2023 | C |
| Adobe Community: motion path not showing in shape layer groups | https://community.adobe.com/t5/after-effects-discussions/motion-path-not-showing-in-shape-layer-groups/m-p/14164440 | unstated | c. 2023 | C |
| Adobe Community: separate dimensions greyed out | https://community.adobe.com/t5/after-effects-discussions/separate-dimensions-greyed-out/m-p/12126716/highlight/true | unstated | c. 2021 | C |
| Adobe 25.4 feature summary | https://helpx.adobe.com/after-effects/using/whats-new/2025-4.html | 25.4 | Aug 2025 | A (excerpt) |
| Repo: `discovery/ae-bridge-findings.md`, `mentor/jsx/snapshot.jsx`, `mentor/dev/build-practice-comp.jsx` | | | | product code |
