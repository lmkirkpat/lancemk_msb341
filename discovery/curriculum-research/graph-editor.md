# Brief: the graph editor (value graph, speed graph, custom curves)

AE version: unknown. The builder's 2026-10-08 session used the AE beta with Adobe's built-in
assistant (26.5-era). Version-dependent claims are flagged "VERSION". Written 2026-10-20 by the
curriculum researcher, group B, Sprint 3 parallel run 1.

Source strength: A = Adobe official, B = established teaching (book, named instructor, school),
C = single tutorial or forum thread (weak), R = repo evidence. Adobe's help pages
(helpx.adobe.com) returned HTTP 403 to my fetcher, so every "A" claim below is from search-result
summaries of Adobe pages, not a full read. Treat A claims as needing a read in a browser.

## What it is

The Graph Editor shows one or more properties' keyframes as curves over time, in one of two views:
the **speed graph** (how fast the value changes, height = speed) and the **value graph** (the
property's actual number, height = value). It is where "Easy Ease" stops being a preset and
becomes a shape the learner controls (influence and slope of the handles).

## Prerequisites

- Keyframes, and the easing skill (Easy Ease, ease in/out, influence), because every graph
  lesson starts from "you applied Easy Ease; now look at what it did". Relationship to easing:
  the easing slice teaches *which* pairs need easing and applies one ease; the graph editor is the
  *next* layer: reading the shape and changing it. It is not a replacement; keep the easing
  skill's "I do, we do, you do" frame.
- Interpolation types (linear, hold, Auto Bezier, Bezier). Handles only exist on Bezier-family
  keys; linear and hold keys show no handles (C, one tutorial summary). Assumed known from easing.
- Separate dimensions, only for the value-graph route (see disagreement 1).

## How it is usually taught, and in what order

Common spine across sources (B: School of Motion intro, date unknown, undated version; B: Meyer
"Creating Motion Graphics with After Effects", ProVideo Coalition excerpt 2010, CS4/CS5):

1. Apply Easy Ease first (the baseline).
2. Open the Graph Editor (button or Shift+F3), fit the graph to view, show only the selected
   property.
3. Value graph versus speed graph: what the height means.
4. Shape the curve with handles (influence, slope); Shift constrains; Option/Alt breaks handles.
5. Apply to a task: bounce, overshoot, a fast-in/slow-out title.
6. Habits: fewest keyframes possible; judge in real-time playback, not scrubbing.

Adobe's assistant (R, 2026-10-08 transcript) taught: shortcuts (F9 family), then Graph Editor,
**Edit Speed Graph** first ("the easiest view to learn on"), drag handle to change influence
(default 33%), then Keyframe Velocity dialog (Cmd/Ctrl+Shift+K) for typing exact influence, then
problem-specific fixes (Rove Across Time, hold keys, expression override). It is a good
model of what a competitor says.

## Disagreement the designer should see

1. **Which graph first.** Adobe's menu default is Auto-Select: speed graph for spatial properties
   (Position), value graph for the rest (A, via search summary of Adobe help). The Meyers
   recommend leaving Auto-Select on (B). Adobe's assistant teaches the speed graph first (R). School
   of Motion's instructor calls the speed graph the "legacy view", prefers the value graph, and
   separates dimensions early because the combined Position value graph can't be reshaped (B).
   An Adobe Community tutorial listing says the speed graph is "often better" for timing (C).
   Both are defended; they suit different jobs: speed graph for "how does it settle", value graph
   for "does it overshoot / bounce / pass through a value". Sure: 85% that the disagreement is real;
   not sure which is better for a first-time learner. Test it.
2. **Separate dimensions early or late.** SoM separates dimensions as step 5 of 10 (B). Adobe's
   assistant did the opposite on the Bar layer and the separated X/Y made Rove Across Time
   unavailable (R). Separating costs the editable motion path in the comp panel (B, Meyer).

## Common beginner mistakes (what it looks like in the comp)

Frequency is "seen in sources", not measured. No beginner data yet from our own users.

| Mistake | What you see | Source | Seen |
|---|---|---|---|
| Not knowing which graph they are in; speed-graph and value-graph confusion | Dragging a handle "up" and the thing goes the wrong direction or gets faster not further; curve shapes mean different things in each view | C (School of Motion blog, Noble, Adobe Community listing) | common |
| Position curve won't edit | Handles missing or editing does nothing on a combined Position | B (SoM) | common |
| Handles absent because keys are linear/hold | Learner clicks a keyframe, nothing to drag | C | often |
| Easing only one side (in vs out names) | Layer eases out but arrives with a bump; "In means arriving, put it on the end key" | R (Adobe assistant said "the names trip people up") | common, easing slice already covers |
| Extreme influence (near 100%) on both sides | Long float then sudden jump, or curve that looks like a flat line then spike in the speed graph | C inference | likely |
| Speed jump at a middle keyframe | Visible jolt at the middle key; speed graph has a step | R (Bar at 0.6s) | present in our test comp |
| Expression overriding keys | Keyframes edited, no visible change; the property has an `=` toggled on | R (Logo rotation `time * 30`) | present in our test comp |
| Too many keyframes | Hard to adjust later | B (SoM) | taught as a principle |
| Judging by scrubbing, not playback | Easing "looks fine" when scrubbed, wrong at speed | R, B | taught as a habit |
| Rove Across Time on a separated property | Command rejected or unavailable (roving only works on spatial properties with 3+ keys) | R (Adobe assistant, 2026-10-08), B (Meyer) | confirmed once |

Misconceptions to probe: "steep = tall value" (it is speed, not value, in the speed graph);
"flat curve = nothing moves" is right in the speed graph, wrong in the value graph (flat value =
holds still, not nothing happens, similar but easy to flip); "Easy Ease is the finished
answer" (Adobe's assistant: "Easy Ease is only a starting point").

## Version-dependent

- Graph Editor itself: no change I could find in 23.x to 26.x release coverage (CG Channel on 26.0,
  ProVideo Coalition on 25.6, Adobe community post for 26.5, summarized). I did not find a
  "what's new" entry for the Graph Editor in any release 2023 to 2026. Confidence medium; I could not
  read Adobe's release notes directly.
- Shortcuts: Shift+F3 toggles the editor; Cmd/Ctrl+Shift+K Keyframe Velocity (R, 2026-10-08).
  Teaching material from 2010 still matches the core UI (Meyer, CS4/CS5), which is a point for
  stability. The old pages' risk is mainly visual (UI theme changed in 25.0, Oct 2024).
- 25.0 (Oct 2024): new interface themes; icons and colors in tutorials will differ (CG Channel).
- 25.4 (Aug 2025): Cmd+Option / Ctrl+Alt drag offsets layers and keyframes without altering
  their animation (Adobe feature summary, via search). Related, not graph editor.
- 26.5 (Sept 2026, Adobe community post): Effect Controls panel rebuilt; Graph Editor not mentioned.
- Adobe's AI Assistant is beta (26.5). It can't read ease type (R). Our mentor can read temporal
  ease (specs/001), so reading the graph is where we differ.
- Properties panel (since 23.x/24.x): shows transforms and some keyframe controls, not the graph.

## Overlaps with other AE concepts (for the spec's list)

- **Expressions over keys:** the graph still shows the keyframe curves but the live value follows the expression. Graph edits then look like they "do nothing". Highest-risk overlap; seen in the test comp.
- **Single and hold keys:** a single key has no curve to shape; hold keys have no handles; a property that is all holds has a step graph.
- **Separated dimensions:** change which graph can be edited; Rove not available (R).
- **Effects:** effect properties are graphable; some are not keyframable.
- **Precomps:** the graph shows only the selected comp's layers; keys inside a precomp won't be seen from the parent. Time remapping on a precomp is a speed-graph use case (C, SoM blog).
- **Hidden layers:** a hidden (eyeball off) or shy layer's properties can still be selected and graphed; a learner may edit something they can't see.

## What the mentor could check

Reads that exist (specs/001; ae-bridge-findings): temporal ease (speed and influence, in/out),
interpolation types, spatial tangents, key times and values, expressions, parent. No new read
needed for these.

- Right: key pairs on Position/Scale have *unequal* in/out influence (a deliberate shape), not 33/33 default; the landing key has more influence than the start key for an "arrive softly" ask.
- Wrong: both ends at the default 33% after the lesson (nothing was shaped); influence of 100 on both ends; a middle key whose in speed and out speed differ (jolt); linear or hold keys where the task needed Bezier.
- Wrong, hidden: an expression on the property (graph edits would be dead).
- Needs a new read or caution: the selected graph mode (value vs speed) and whether the graph panel is open are UI state, not project state; the mentor cannot see it. Separate-dimension state is probably readable via a script (`dimensionsSeparated`); confirm.
- Judging "feel" is not checkable; the mentor can check shape, not taste.

## Open questions

1. Speed graph first, or value graph first, for a learner who already knows Easy Ease? (Needs a short A/B with a real learner.)
2. Is the graph editor one skill or two: **reading** (diagnosis: "where's the jolt?") and **shaping** (overshoot, bounce)? Interview 007 says finding what broke is the pain; reading is the diagnosis skill. I lean toward two, as a recommendation.
3. Which release first showed any graph change? I couldn't read Adobe's release notes (403).
4. Does the Cmd/Ctrl+Shift+K Keyframe Velocity dialog still match in 26.x? Observed in Adobe's assistant text, not verified in the UI.

## Sources

| Title | Link | Version | Date | Strength |
|---|---|---|---|---|
| Animation basics (Adobe) | https://helpx.adobe.com/il_he/after-effects/desktop/animate-in-after-effects/animation-basics/animation-basics.html | current | updated Jan 2026 per search summary | A (not read in full) |
| Speed between keyframes (Adobe) | https://helpx.adobe.com/ca/after-effects/desktop/animate-in-after-effects/speed-between-keyframes/speed.html | current | unknown | A (not read; 403) |
| Intro to the Graph Editor, Joey Korenman, School of Motion | https://www.schoolofmotion.com/tutorials/intro-to-the-graph-editor-in-after-effects/ | not stated | not stated | B |
| Graph Editor in After Effects, School of Motion blog | https://www.schoolofmotion.com/blog/graph-editor-after-effects | not stated | not stated | B/C |
| Keyframe Velocity, Chris and Trish Meyer, ProVideo Coalition (book excerpt) | https://www.provideocoalition.com/creating_motion_graphics_with_after_effects_hidden_gems_chapter_4_-_keyfram/ | CS4/CS5 | 2010-12-25 | B, old |
| Speed Graph, Noble Desktop | https://www.nobledesktop.com/learn/adobe/speed-graph | not stated | unknown | C |
| Speed graph vs value graph listing | https://community.adobe.com/questions-529/new-ae-tutorial-motion-design-essentials-18-speed-graph-vs-value-graph-41097 | unknown | unknown | C |
| Adobe AI assistant transcript | discovery/usage-notes/adobe-assistant-2026-10-08.md | AE beta (26.5-era) | 2026-10-08 | R |
| AE 26.0 coverage, CG Channel | https://www.cgchannel.com/2026/01/adobe-releases-after-effects-26-0-with-native-substance-support/ | 26.0 | 2026-01-21 | B (news) |
| What's new 26.5, Adobe Community | https://community.adobe.com/announcements-527/after-effects-26-5-is-here-1641108 | 26.5 | 2026-09 | A-ish |
| Bridge findings | discovery/ae-bridge-findings.md; specs/001-ae-mcp-bridge-test/spec.md | CEP, 2026-09 | 2026-09 | R |
