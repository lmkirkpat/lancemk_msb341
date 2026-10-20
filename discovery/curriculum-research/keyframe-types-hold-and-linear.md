# Brief: keyframe types (linear, hold, bezier family)

**Group A, wave 1.** Researcher brief, 2026-10-20. **AE version: unknown** (flagged). Latest public release found: 26.5 (Sept 2026). AE UXP beta (Nov 2026) is irrelevant to this content.

Strength key: A = official Adobe (search excerpt only, pages returned 403 to me), B = established teaching, C = single tutorial/forum thread, P = practitioner knowledge not sourced here (verify).

## What it is

The type of a keyframe says how the value travels into and out of it: linear (constant speed), hold (no travel, the value jumps), or a bezier variant (curved, with handles). This skill is about choosing the *right* type, and above all about the types easing doesn't cover: hold for on/off and cut-style changes, linear where constant speed is correct.

## Split/merge recommendation

Keep separate from easing (already built; it handles temporal bezier on linear pairs and treats `hold` as "held, skip" in `mentor/lib/analyze.mjs`). Keep separate from motion paths (spatial side). The Auto/Continuous/Bezier trio belongs in the motion-path brief because those names mostly describe *spatial* behavior; see disagreement below.

## Prerequisites

- Setting keyframes (brief: transform-properties-and-keyframes).
- Easing: **teach hold after easing, or alongside as its contrast.** Reason: the easing skill's existing vocabulary (linear = mechanical, Easy Ease = natural) is what gives hold meaning ("neither, on purpose"). School of Motion also introduces types first and only then builds toward feel ([School of Motion](https://www.schoolofmotion.com/blog/after-effects-keyframe-types), B). Order is a designer choice; the evidence does not split cleanly.

## How it's usually taught

School of Motion's order: Linear, Auto Bezier, Continuous Bezier, Bezier, Hold, introduced after spatial vs temporal (B, undated). Icons: diamond (linear), circle (auto bezier), hourglass-like (continuous bezier / Easy Ease), square (hold) per that page. It says linear is "always abrupt and very mechanical" and rarely used by professionals; I consider that over-stated: linear is correct for constant-speed motion (a loop of rotation, a ticker). Disagreement: SoM frames linear as a flaw; Adobe's help describes it neutrally (constant rate, abrupt stop at the last key) ([Adobe: Keyframe interpolation](https://helpx.adobe.com/en/after-effects/using/keyframe-interpolation.html), A via excerpt).

Hold practice:
- Toggle Hold Keyframe: Ctrl+Alt+H on Windows; Mac forum posts give a conflicting combination, so read the Animation menu on the builder's version rather than quoting it ([Adobe Community](https://community.adobe.com/t5/after-effects-discussions/remove-tween-between-keyframes-to-hide-and-show-image/m-p/14642978), C, with conflict noted).
- Classic use: opacity 0 to 100 as an on/off cut, blinking, slide-style step changes (C, same thread).
- Teaching source for hold in School of Motion uses Layer > Time > Freeze Frame, which is a *different* thing (freezes footage) and confuses the term; flag for the mentor's wording.

Easy Ease is a keyframe type shortcut: F9 (P). SoM describes it via the Keyframe Assistant menu and does not mention F9 (B), so shortcut-first versus menu-first teaching differs.

## Common beginner mistakes

| Mistake | Wrong result in the comp | Source / frequency |
|---|---|---|
| Hold set on the first key, forgotten | Layer sits still, then snaps at the next key; "my animation is stuck" | C: Adobe Community answer notes people struggle to stop the pause made by the first hold ([thread](https://community.adobe.com/t5/after-effects-discussions/can-t-get-composition-to-stop-and-hold-in-after-effects/m-p/9777140)). One thread. |
| Wants a cut, gets a fade | Opacity 0 to 100 crossfades over frames instead of snapping | C (Adobe Community thread above) |
| Can't undo Easy Ease | Learner reverts by trial; expects an "unease" command | C: there are repeated threads titled "revert an Easy Ease keyframe to a normal one" ([one](https://community.adobe.com/t5/after-effects-discussions/how-to-revert-an-easy-ease-keyframe-to-a-normal-one/m-p/2353576/highlight/true)). Frequency: at least two threads, 2010s and 2020s. |
| Confuses keyframe type with temporal ease | Believes "Bezier" and "Easy Ease" are alternatives; icon changes but speed curve may not look different at a glance | P |
| Applies hold to all keys at once | Every move becomes a jump | C (thread says select all then Ctrl+Alt+H turns all to hold) |
| Linear used everywhere | Motion looks mechanical | B (SoM) and the builder's own comp (existing easing slice) |

## Overlaps (for the spec's list)

- **Expressions over keys.** If an expression drives the property, changing key types does nothing visible. Same trap as easing.
- **Single and hold keys.** A property with one key cannot have an interpolation that shows. A *hold* out side on a pair makes the pair "held": existing `segmentState()` handles hold first. A pair with hold *in* on the end key but bezier out on the start is a mixed case the designer should test.
- **Separated dimensions.** Each of X and Y has its own key types; toggling hold on X leaves Y moving. After recombining, per-dimension info collapses (see motion-path brief).
- **Effects.** Hold is common on effect parameters (toggle-type parameters, checkboxes are hold-only (P)).
- **Precomps.** Hold in a precomp is invisible from the parent timeline; the visible symptom is a layer that "pops".
- **Hidden layers.** Opacity-0 hold hides a layer without turning the eyeball off; "hidden layer" detection by eyeball misses it.

## Version dependence (2023 to 2026)

- Interpolation types are long-standing; I found no change to them in any release note I could see. Confidence medium (24.x notes unreadable, Adobe pages 403).
- Adobe's help says Auto Bezier is the default spatial interpolation and that a Composition preference can switch it to linear; the preference does not alter existing keys (Adobe: Keyframe interpolation, A via excerpt). Check the builder's preference when interpreting a "default" key.
- Old tutorials: Peachpit's CS4 article ([Keyframe Interpolation in Adobe After Effects CS4](https://peachpit.com/articles/article.aspx?p=1327260), B, 2009) and the 2015 ProVideo Coalition piece show concepts that still hold but UI icons, Graph Editor look, and menu paths have moved. This is belief 16's exact trap.

## What the mentor could check

Existing reads (`snapshot.jsx` returns `in_type`/`out_type` per key):
- Right: for a cut/blink the pair has hold out on the first key; for a constant-speed move both keys are linear on purpose.
- Wrong: hold left on a key the learner wanted to ease; all keys hold; Easy Ease'd keys where hold was intended.
- Gap: a check cannot know the learner's *intent* (linear on purpose vs by accident). The existing easing slice flags all linear pairs; for this skill the mentor must ask, not assume. New read needed: none for types themselves; "is the layer hidden by opacity" is a plain value read.

## Open questions

1. How often do target learners actually use hold? Probably rare for solo designers' first projects; ask in the next interview (needs a user question, no source answers it).
2. Does the Mac hold shortcut match the Windows one? Read the builder's Animation menu.
3. Should "Easy Ease is a keyframe type" move to the easing skill's vocabulary instead?

## Sources

| Title | Link | Version | Date | Strength |
|---|---|---|---|---|
| Adobe: Keyframe interpolation | https://helpx.adobe.com/en/after-effects/using/keyframe-interpolation.html | current help page | undated | A (excerpt only; 403 on fetch) |
| School of Motion: After Effects keyframe types | https://www.schoolofmotion.com/blog/after-effects-keyframe-types | unstated | undated | B |
| Peachpit: Keyframe Interpolation in AE CS4 | https://peachpit.com/articles/article.aspx?p=1327260 | CS4 | 2009 | B, out of date (not read in full) |
| Adobe Community: remove tween to hide/show image | https://community.adobe.com/t5/after-effects-discussions/remove-tween-between-keyframes-to-hide-and-show-image/m-p/14642978 | unstated | c. 2023 | C |
| Adobe Community: can't get composition to stop and hold | https://community.adobe.com/t5/after-effects-discussions/can-t-get-composition-to-stop-and-hold-in-after-effects/m-p/9777140 | unstated | c. 2018 | C |
| Adobe Community: revert Easy Ease | https://community.adobe.com/t5/after-effects-discussions/how-to-revert-an-easy-ease-keyframe-to-a-normal-one/m-p/2353576/highlight/true | unstated | 2010 | C |
| Repo: `mentor/lib/analyze.mjs`, `mentor/jsx/snapshot.jsx` | | | | product code |
