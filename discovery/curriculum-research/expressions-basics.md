# Brief: Beginner expressions (wiggle, loopOut, time, pick-whip)

**AE version: unknown** (cockpit task did not say). Sources describe 2018 (16.0) to 2026. Research date: 2026-10-20.
**Group D, wave 1.** Researcher: curriculum-researcher.

**Source note.** helpx.adobe.com returned 403 to direct fetches; Adobe claims come from search excerpts. **[B]** means background knowledge, not re-checked this session.

## What it is

An expression is a short piece of code typed on a property that computes its value every frame, replacing or building on the keyframed value. Beginner use is a handful of one-liners: `wiggle(freq, amp)` for jitter, `loopOut("cycle")` to repeat keyed motion, `time` to drive a value from the clock, and the pick-whip to link one property to another.

## Prerequisites

- Keyframes and the stopwatch (Alt/Opt-click on the stopwatch opens the expression field). Needed because `loopOut` requires keys and the main teachable trap is expressions versus keys.
- Easing: very relevant. A loop only looks seamless if the first and last keys' ease agree. A learner who has just eased one pair is ready for "eased in and out, then looped".
- Parenting and null layers help for the "wiggle on a null, parent the layer" pattern. Precomps are not required.

## How it is usually taught, in order

School of Motion's beginner guide (established teaching), PremiumBeat's "top 5 expressions" (single trade blog), and tutorial sites agree broadly:

1. What an expression is and how to open the field (Alt/Opt-click the stopwatch).
2. `wiggle(2, 50)`: two numbers, wiggles per second and distance. Almost everyone starts here, because it needs no keyframes and gives an immediate, visible result.
3. `loopOut()`: it needs keyframes; modes `cycle`, `pingpong`, `offset`. PremiumBeat and School of Motion both state the keyframe requirement.
4. `time`: for continuous rotation or drift, e.g. `time*90`. **[B]**
5. Pick-whip: drag to link a property to a slider control or another layer's property, via an Expression Control effect (School of Motion shows `effect("Slider Control")("Slider")`).
6. Combining: separate lines with a semicolon (a Lynda/LinkedIn Learning course preview shows loopOut plus wiggle on one property).
7. Practical wiggle: wiggle on a null, parent the target to it, so main motion stays keyframed and the jitter is separate (School of Motion).

**Where good sources differ or leave gaps:** none of the beginner sources I read (School of Motion, PremiumBeat, tutkit.com, Noble Desktop snippets) puts the keyframes-versus-expression conflict first; they bury it. The Adobe forum shows the conflict is the thing beginners ask about (below). Recommendation for the designer: start with *what the expression does to the keys you already have*, since that connects to the easing lesson.

## What beginners get wrong (and what it looks like in the comp)

Frequency unmeasured.

| Mistake | What a wrong result looks like | Source and strength |
|---|---|---|
| Typing an absolute-value expression on a keyframed property | The keyframes still show in the timeline but the property ignores them; layer sits still or jumps to the expression's value. An Adobe employee confirms an expression that sets an absolute value overrides keyframes; a beginner thread describes keys becoming "inactive" | Adobe Community thread (weak, but staff-answered) |
| `loopOut` on a property with no keys, or with one key | Nothing happens. PremiumBeat states loopOut requires keyframes; **[B]** one key gives nothing to loop | PremiumBeat (single blog) |
| Cycle seam: first and last key values or ease differ | Loop visibly jumps or hesitates at the seam | [B]; consistent with easing teaching in this repo |
| Wiggle values meaningless for the property | `wiggle(2, 50)` on Opacity changes by 50 percent, on Rotation by 50 degrees, on Scale by 50 percent; the learner copy-pastes numbers and the effect is far too strong | [B]; tutorials use pixels examples only |
| Wiggle on a property with keys, learner thinks it replaced them | Wiggle actually adds jitter to the keyframed value **[B]**; learners who expect only noise are surprised that the animation continues | [B] |
| Copy-pasting code from the web that fails | Yellow warning triangle or red banner at the bottom of the comp; expression is switched off ("= " sign shown with a slash) and the property reverts to its keyframes or static value | Adobe Community thread on expressions disabling themselves (weak) |
| Engine mismatch (JavaScript vs Legacy ExtendScript) | Modern syntax (arrow functions, `filter`, `map`) errors in a project that is set to Legacy; old projects can revert the setting; fix in File > Project Settings > Expressions, or run Upgrade Legacy Expressions | Adobe help (official) via search excerpt; community answer for the revert |
| Disabling an expression by deleting text, leaving the stopwatch on | Property still shows the stopwatch on and an empty expression; some learners then re-add keyframes and nothing changes | [B] |
| Keyframes added on top of an expression record the raw value, not the calculated one | A new key lands at a value that does not match what the learner sees | Adobe Community ideas thread (user report, weak) |
| Expecting expressions to show up where keys do | Press U: expressions are not shown, only keys; press EE to reveal expressions. A property with an expression and no keys is invisible to a U-based scan **[B]** | [B] |

## Where it overlaps other AE concepts

- **Expressions over keys.** The core of this brief. Rules worth stating to the designer: an expression can override, add to, or ignore the keyframed value depending on whether it reads `value`; the keys still exist and still show in the timeline when overridden. For the mentor this is the central edge case: **an easing check that sees keys cannot tell whether an expression is making them irrelevant.** `snapshot.jsx` records `expression_enabled` on each keyed property (line 84), so the signal exists for properties that have keys. It skips properties with no keys, so a pure wiggle or `time` expression on an unkeyed property is not in the snapshot at all.
- **Single and hold keys.** A property with a single key plus `loopOut` does nothing; hold keys cycle as steps. An expression on a hold-keyed property still sees the held values. **[B]**
- **Separated dimensions.** Position has separated X and Y (and Z) properties when Separate Dimensions is on. An expression written for `position` stops working or errors if dimensions are separated, because the property is no longer one array; expressions need to go on the X or Y Position property, and `wiggle(f, a)` on a separated property returns a single value. The repo's `inUse` handling in `snapshot.jsx` (lines 51 to 59) already reads only the side in use; expression reads must follow the same rule. **[B]** for the expression behavior; verify with a test.
- **Effects.** Pick-whip needs an Expression Control effect (Slider Control, etc.) for the common beginner pattern, so effects and expressions meet on day one. Effects' own properties accept expressions. See `effects-basics.md`.
- **Precomps.** Expressions inside a precomp see the precomp's time, not the parent's; a `time`-based expression's behavior changes with time remapping and layer in-point. A pick-whip across comps links to properties in other comps. **[B]**
- **Hidden layers.** An expression referencing a layer by name (or index) breaks when the layer is renamed, deleted or reordered; the error banner appears on the dependent property. **[B]**

## What changed between versions (2018 to 2026)

- **16.0 (CC 2018):** the JavaScript expression engine (ECMAScript 2018) became default, replacing the Legacy ExtendScript engine (ECMAScript 3). Adobe says it is not backward compatible and some old syntax breaks. Old tutorials (pre-2018) can show syntax that fails or is unnecessary. (Adobe help, official.)
- **25.0 (Oct 2024):** expressions gained per-character control for text animation. (CG Channel summary, secondary.) New text expression features will not exist in older help.
- **2023 to 2026:** I found no change to `wiggle`, `loopOut`, `time` or pick-whip behavior. The risk for beginners is older tutorials (pre-2018) and pasted snippets, not 2023 to 2026 differences.
- Expression error display: not documented here; the yellow triangle and banner behavior is long standing **[B]**.

## What the mentor could check

Reachable now (expression text and errors read via `ae_run_script`, per spec 001):
- Does the property have an expression, and is it enabled? (`expressionEnabled`, already in the snapshot for keyed properties.)
- Does the expression have an error (`expressionError`)? A non-empty error is the most direct "what broke" signal and matches the pain in interview 007.
- Does a property with `loopOut` have at least two keys? Do first and last values and ease agree?
- Is the property both keyed and expression-enabled, so the keys do not drive the value? This is the hidden-key overlap and needs a rule so easing checks do not tell the learner to ease keys that an expression is overriding.
- After the learner types `wiggle(...)`, compare two frames (`ae_preview_frame`) to see motion at a time with no keys.

New read needed: a scan of all properties for expressions regardless of keys (the current snapshot only walks properties with keys), Expression Control effects present, and pick-whip targets that resolve.

## Open questions

1. Is `wiggle` the right first expression for this audience? It is the universal choice, but the conflict with keys, which relates directly to easing, is more diagnostic. Sources teach wiggle first because it gives an immediate result; no source tested this for learning.
2. How often do target learners meet expressions at all before being told to? Interview question (the student in 007 mentions things being "hidden", which is consistent with expressions being invisible without EE, but did not mention expressions by name).
3. Behavior with separated dimensions is stated from background; needs a test on the practice comp.
4. Should the curriculum split this into two skills, "link properties (pick-whip, sliders)" and "motion from code (wiggle, loop, time)"? My read: yes if the designer has the slots. They have different prerequisites (pick-whip needs effects; loop needs keys and easing) and different failure signals. Recommendation only.

## Sources

| Title | Link | Version | Date | Strength |
|---|---|---|---|---|
| Legacy and ExtendScript expression engine (Adobe help) | https://helpx.adobe.com/at/after-effects/desktop/work-with-expressions/expression-basics/legacy-and-extend-script-engine.html | 16.0 onward | accessed 2026-10-20, via search excerpt | Official, second-hand |
| After Effects Expressions: What You Need To Know To Get Started (School of Motion) | https://schoolofmotion.com/blog/after-effects-expressions-what-you-need-to-know-to-get-started | not stated | not stated | Established teaching |
| Top 5 After Effects expressions for better designs (PremiumBeat) | https://www.premiumbeat.com/blog/top-5-after-effects-expressions-for-better-designs | not stated | not stated | Single blog |
| Combining expressions: loopOut + wiggle (LinkedIn Learning/Lynda preview) | https://www.lynda.com/After-Effects-tutorials/Combining-expressions-loopOut-wiggle/483235/509418-4.html | not stated | not stated | Course preview |
| My knowledge is conflicting about expression and keyframes (Adobe forum) | https://community.adobe.com/questions-529/my-knowledge-is-conflicting-with-each-other-about-expression-and-keyframes-48896 | not stated | not stated | Single thread, staff-answered (weak) |
| Expression trouble, disabling itself (Adobe forum) | https://community.adobe.com/t5/after-effects-discussions/after-effects-expression-trouble-disabling-itself-but-it-works-kind-of/m-p/10618476 | not stated | 2019 | Single thread (weak) |
| Native JS ES5 features not supported in some environments (Adobe forum) | https://community.adobe.com/t5/after-effects-discussions/native-js-es5-features-quot-randomly-quot-not-supported-in-some-environments-ae2020/td-p/10870294 | AE 2020 | 2020 | Single thread (weak) |
| Adobe After Effects 2025 v25.0 summary (CG Channel) | https://www.cgchannel.com/2024/10/adobe-releases-after-effects-25-0 | 25.0 | Oct 2024 | Secondary |
| Repo: `mentor/jsx/snapshot.jsx` | local | n/a | 2026-10 | Product evidence |
| Interview 007 | `discovery/interviews/007-student-photographer-social-animator.md` | n/a | 2026-10 | Product evidence |
