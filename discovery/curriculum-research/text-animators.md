# Research brief: text animators (animators, range selectors, presets)

**AE version: unknown** (not given in the cockpit task). Researched 2026-10-20 (sprint 3,
parallel run 1, group C). **Access note:** Adobe's help pages returned 403 to my fetch tool, so
official claims come from search excerpts. "Background" means my own knowledge of AE, not a
source I read. UXP status per `discovery/ae-bridge-findings.md`: beta due Nov 2026; reads below
assume ExtendScript. Evidence on beginner mistakes is the thinnest of the four briefs in this
group (no forum study of animator mistakes found), so the mistakes table leans on background and
should be tested with learners.

## What it is

A text animator is a group on a text layer that holds properties to change (position, scale,
rotation, opacity, tracking, color) and a range selector that decides which characters, words, or
lines it affects. Animating the selector's Start/End/Offset moves the effect across the text, which
is how "type on", staggered letters, and word-by-word reveals are made.

## Prerequisites

- Text layers (Type tool, Character panel) and keyframing. Easing is highly relevant: the usual
  motion is Offset or End moving 0 to 100, and its feel comes from easing. A text-animator
  lesson works as the first "easing in a new place" practice after the easing slice, because
  the key being eased is on a selector, not on Position.
- Shape layers are not required. Masks and mattes are not required, but "text as a track matte"
  and "Create Shapes from Text" are neighbors, not prerequisites.
- Illustrator/Photoshop learners already know the Character panel (font, tracking, leading).
  What is new: text is animated by property groups under the layer, not by selecting characters
  and keying them. Animator properties are *offsets*, not absolute values (background), which
  is a common surprise.

## How it is usually taught, and in what order

From a PremiumBeat tutorial (2017), Noble Desktop, a CUNY motion class syllabus, VDCI's
character/word/line techniques, a DEV Community article on the expression selector, and Adobe's
learn page on text presets (all via search/fetch excerpts):

1. **Add an animator** (the Animate button on the text layer's properties; pick Position,
   Scale, Rotation, Opacity, Tracking, ...). PremiumBeat names three properties (Line Spacing,
   Tracking, Rotation) and renames them so others can follow the project.
2. **Select the range**: Range Selector Start / End / Offset. PremiumBeat: "it's common to only
   add keyframes to the start or end options" (the Offset is a third approach).
3. **Time and ease** the selector's keys.
4. **Advanced options**: Based On (characters, characters excluding spaces, words, lines),
   Mode (Add, Subtract, ...), Shape (Square, Ramp up, Triangle, ...), Smoothness, Ease High/Low,
   Randomize Order. The CUNY page and Noble Desktop cover these; I found no source that
   teaches them first.
5. **Units**: Percentage vs Index. An Adobe Community bug report (date not seen) says Start/End can
   stick on the previous Based On after changing units.
6. **Add > Selector > Wiggly, or Expression** (the DEV Community article on the expression
   selector), for randomness and code-driven stagger.
7. **Presets**: Effects & Presets > Animation Presets > Text (with an Animate In/Animate Out
   split in some listings). Adobe's learn page and Aejuice-type blog posts teach "select the
   text layer, park the playhead where you want it to start, then double-click or drag the
   preset".

**Disagreement worth surfacing to the designer.** Presets-first vs animators-first. Adobe's
learn page and many "how to animate text" step-by-steps start with presets (fast result, little
understanding); course material and classes (CUNY, Noble, PremiumBeat) start with animator +
range selector (slower, more transferable). The product's thesis (teach to stick, not do-it-for-you)
leans to animators first with presets as a reward or as a diagnostic ("what's inside this preset?").
That is a recommendation, not a decision. A preset also demonstrates the structure: apply one,
twirl it open, and show the learner the animator inside.

## Common beginner mistakes (with what the wrong result looks like)

Sources are thin; I mark each with its basis honestly.

| Mistake | What the comp shows | Basis | How often |
|---|---|---|---|
| Applying a preset with the wrong layer selected or the playhead in the wrong place | Preset keyframes start at the current time (e.g. mid-timeline), so the text sits unanimated at the start | Adobe learn page and blog guides (several): keyframes begin wherever the current-time indicator is parked | Seems common (several sources describe it as a warning) |
| Keyframing the animator property (e.g. Position) rather than the range selector | Whole text moves at once, not letter by letter | Background; the PremiumBeat order (animator, then range, then keyframe the range) implies it | Plausible |
| Range Start/End or Offset left at default (0 to 100) so every character is selected | All letters move together | Background | Plausible |
| Changing Units or Based On and the numbers stop meaning what they did | Range values wrong or not updating | Adobe Community bug thread | One thread |
| Animator Position set to a large value expecting an absolute position | Letters fly to the wrong place; value is an offset from the original | Background | Hypothesis |
| Text layer converted to shapes ("Create Shapes from Text") before animating, or text with per-character 3D turned on by accident | Animator no longer available; text turns into a shape layer. Or "Enable Per-character 3D" changes the look | Background | Hypothesis |
| Typing in a new font or style after animating (overwrites) or changing Based On | Preset or animation breaks | Background | Hypothesis |
| Multiple animators, with names unchanged ("Animator 1/2/3") | Nobody can tell which does what; hard to find what broke | PremiumBeat renames its animators precisely so others can follow | Teaching tip, not a mistake count; ties to interview 007 |
| Expecting a smooth wave but getting stair-steps; Smoothness/Ease/Shape not touched | Letters pop one at a time | Background | Hypothesis |

Illustrator/Photoshop angle (hypothesis): learners expect to select characters and animate them.
In AE the selection lives in a range selector with percentages and the properties are on an
animator group. Interview 007's pain ("finding what broke") maps directly: with several animators
and selectors on one text layer, the cause of a wrong result is hard to find without a map of
animator -> property -> selector.

## Overlaps with other AE concepts (each spec must list and test these)

- **Expressions over keys.** The Expression selector (an expression on a selector's Amount)
  and Wiggly selector produce motion with no keyframes. The DEV Community article teaches the
  expression selector explicitly. A "has this been animated" check that counts keys will miss
  selector-driven animation and presets that use wiggly selectors. Also, 25.0 added expression
  control of text style (see Version-dependent).
- **Single and hold keys.** One key on Start/End/Offset is static; hold keys make letters pop on.
  Offset values that go beyond 0 to 100 are valid. Counting keys on the selector is the check.
- **Separated dimensions.** Animator Position has X/Y(/Z) and may or may not be separable in the
  same way as layer Position; the separated-dimensions rule applies to the text layer's own
  Position, not the animator's. Confirm on the builder's version (background).
- **Effects.** Many text-reveal tutorials use effects (Typewriter plugins, Fractal Noise) in
  place of animators; the Effects panel may be empty while the text animates, because presets
  load animators, not effects.
- **Precomps.** Animator ranges act inside the text layer; precomposing a text layer keeps them,
  but changing a precomp's size can clip animated text that moves outside the comp (background).
  Text used as a track matte with an animator stays animated in the matte.
- **Hidden layers.** Text used as a matte has its eye switch off (not a bug). An animator group has
  its own eye toggles; a disabled animator (the animator's eye or enabled switch) hides its effect
  without the layer looking hidden.
- **Masks and mattes.** "Text as a window for video" is the standard use of track mattes; the
  text can carry an animator at the same time. See the track-mattes brief.
- **Shape layers.** "Create Shapes from Text" converts a text layer to shapes and loses animators.

## Version-dependent

| Claim | Version | Source | Strength |
|---|---|---|---|
| Expressions can control text styling for whole text layers (not only characters) and new paragraph attributes (direction, alignment, first-line indent, margins) | 25.0 (Oct 2024) | CG Channel 25.0 release article | Medium |
| Variable-font filtering in the font list ("show only variable fonts") | Listed on the 2026 What's new page; release not pinned | Adobe What's new (excerpt) | Medium; date unclear |
| 50 new animation presets | 23.0 (Oct 2022) | CG Channel 23.0 | Medium; unclear whether text-specific |
| Scripting hooks for fonts (app.fonts.mruFontFamilyList) | 24.6 (Aug 2024) | CG Channel; Adobe feature summary | Medium; scripting only |
| Animator, range selector, Based On / Mode / Shape UI unchanged across 2023 to 2026 | n/a | Nothing found; classes from 2019 still match | Weak: release notes unread |
| Older tutorials: PremiumBeat 2017 and CUNY 2019 syllabi still describe the same workflow | 2017-2020 | Those pages | Weak-medium |
| Aejuice/Adobe learn pages for presets: text presets live in Animation Presets > Text | Not dated | Adobe learn page, Aejuice | Medium |

Observation for belief 16: unlike track mattes, I found no major text-animator UI change in 2023
to 2026, so old text-animator tutorials are likely mostly safe; the risk is in fonts and text
styling features and in presets, not the core animator path. Hedge: this is absence of evidence.

## What the mentor could check

Reads via `ae_run_script`; names from background (text layer "ADBE Text Properties",
"ADBE Text Animators", each animator's "ADBE Text Selectors" and "ADBE Text Selector" with
"ADBE Text Percent Start/End/Offset", Advanced "ADBE Text Range Type2", "ADBE Text Selector
Based On" etc.). Confirm on the builder's version. The built-in tools give layer kinds and
keyframe counts only, so an animator read would be new.

- **Right:** the text layer has at least one animator; the animator contains the intended
  property (e.g. Position or Opacity); the range selector has a keyframed Start, End, or Offset
  (2+ keys, different values), eased if the lesson called for it; Based On set to the unit
  the lesson used (words vs characters); preview frames at three times show letters at different
  states (staggered), not all at once.
- **Wrong, readable:** animator property keyframed but selector static; selector keyed but the
  animator has no property (nothing to select); range left at 0 to 100 with no keys; keys at
  equal values; unnamed "Animator 1/2/3" (a teaching issue, not an error); text layer converted
  to shapes (layer is a shape now); presets applied at the wrong time (first key late in the
  comp).
- **Wrong, frame only:** result looks like everything moves together or stair-steps.
- **Needs a new read:** the animator tree (names, properties, selector values). Build a
  narrow read or use `ae_run_script`.
- **Change detection:** diff on animator count, selector key counts, Based On, and layer type.

## Open questions

1. No target-market evidence on which text-animation mistakes happen in practice. A short test
   (one learner, one text layer, "make the letters appear one by one") would produce a real
   mistakes table.
2. Presets-first or animators-first? Genuine disagreement; test with learners whether a
   preset-first start leaves them unable to fix a result (interview 007's pain).
3. Is there a real "what broke" use case here? A text layer with several animators is a strong
   candidate for a "map the animator tree" diagnosis tool. Check with a built-in read.
4. What do official docs say about Advanced options defaults and the Shape/Ease controls?
   Re-read the Adobe animating-text page (blocked).
5. Which "Create Shapes from Text" cases lose the text? Unverified background.

## Sources

| Title | Link | AE version | Date | Strength |
|---|---|---|---|---|
| Adobe: Animating text (help page; blocked, not read) | https://helpx.adobe.com/after-effects/using/animating-text.html | Current | n/a | Official; unread |
| Adobe Learn: Animate text with presets (search excerpt) | https://www.adobe.com/learn/after-effects/web/animate-text-presets | Not stated | n/a | Official learn content, partially seen |
| PremiumBeat: Animating text in After Effects | https://www.premiumbeat.com/blog/?p=88440 | Not stated | 2017-04-17 | Established teaching blog, medium-weak, old |
| CUNY BMCC MMP 260 class pages (range selector, advanced) | https://openlab.bmcc.cuny.edu/mmp260/?p=630 | Not stated | 2019-2020 | University syllabus, medium; seen as excerpts |
| Noble Desktop: Even more text animation / Create and save text animations | https://blog.nobledesktop.com/learn/after-effects/even-more-text-animation | Not stated | n/a | Course material, medium-weak |
| VDCI: Character, word, and line techniques | https://vdci.edu/learn/after-effects/character-word-line-techniques | Not stated | n/a | School material, weak-medium |
| DEV Community: After Effects text animation and the expression selector | https://dev.to/kocreative/after-effects-text-animation-and-the-expression-selector-a2l | Not stated | n/a | Single tutorial, weak |
| Adobe Community bug: text position animator range selector does not update when selecting Units/Based On | https://community.adobe.com/t5/after-effects-bugs/text-position-animator-range-selector-does-not-update-when-selecting-units-based-on/m-p/14841823 | 2024-25 | 2024-25 | Forum bug, weak |
| Aejuice: How to apply text presets | https://aejuice.com/blog/how-to-apply-text-presets-in-after-effects | Not stated | n/a | Vendor blog, weak |
| CG Channel: After Effects 25.0 | https://www.cgchannel.com/2024/10/adobe-releases-after-effects-25-0 | 25.0 | 2024-10-14 | Trade press, medium |
| CG Channel: After Effects 24.6 | https://www.cgchannel.com/2024/08/adobe-releases-after-effects-24-6 | 24.6 | 2024-08-24 | Trade press, medium |
| Adobe: What's new in After Effects (excerpt) | https://helpx.adobe.com/uk/after-effects/desktop/what-s-new/whats-new.html | 26.2 to 26.3 | Updated 2026-06-17 | Official, partially seen |
| Interview 007 (finding what broke) | discovery/interviews/007-student-photographer-social-animator.md | n/a | 2026-10-07 | Repo evidence (cite only) |
