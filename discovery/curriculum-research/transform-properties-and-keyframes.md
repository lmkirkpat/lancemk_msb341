# Brief: transform properties and setting keyframes

**Group A, wave 1.** Researcher brief, 2026-10-20. **AE version: unknown** (cockpit did not say which version the builder runs). Latest public release found: 26.5 (September 2026). AE UXP beta status (`discovery/ae-bridge-findings.md`): public beta due Nov 2026, so nothing here depends on it.

**Reading guide.** Strength: A = official Adobe page (read only through search snippets, see Limits), B = established teaching, C = single tutorial/forum thread, P = practitioner knowledge I could not source in this session (treat as unverified; check with a test).

## What it is

Every layer has transform properties (Anchor Point, Position, Scale, Rotation, Opacity). A keyframe is a value saved at a time; the stopwatch turns animation on for a property, and After Effects fills in the values between keys. This is the entry skill: nothing else in group A works without it.

## Limits of this brief

- Adobe's help pages (`helpx.adobe.com/.../keyframe-basics`, `keyframe-interpolation`, the 25.4 feature summary) returned HTTP 403 to my fetches. Everything cited to them is from search-result excerpts, not the full page. Re-read them before the spec uses a quoted line.
- I could not read the 24.x release notes. Version claims for 2023-2024 are partial (see the version section).

## Prerequisites

- A comp with at least one non-trivial layer; the learner knows what a layer, the timeline, and the playhead (current-time indicator) are.
- Does easing come before or after this? **After.** The built easing skill needs two or more keys on a property, so it silently assumes this skill (P). Within the current skill, a learner with no keys gets no pairs to ease. Recommendation, not a decision: if the learner's comp already has keyframes (most do, the builder's comp does), this skill can be a short diagnostic ("show me what's animating here") rather than a lesson.

## How it's usually taught, and in what order

Order seen across sources (B/P; the Adobe "Animation basics" page was not readable):
1. Reveal transform properties with shortcuts: P (Position), S (Scale), R (Rotation), T (Opacity), A (Anchor Point) (P, widely taught; not re-verified here). Shift adds a property to what's showing.
2. Click the stopwatch at a first time, move the playhead, change the value; AE adds the second key automatically (P).
3. Scrub/RAM preview to see the in-between frames.
4. Then straight to interpolation (linear, Easy Ease). School of Motion's keyframe-types article goes: interpolation types, spatial vs temporal, then motion paths ([School of Motion](https://www.schoolofmotion.com/blog/after-effects-keyframe-types), B, undated; icons described are the long-standing ones).
5. U / UU to show only animated / modified properties (P). Forum helpers give "press U" as the answer when keys seem missing ([Adobe Community thread](https://community.adobe.com/t5/after-effects-discussions/moving-layer-key-frames-not-moving/m-p/9330549/highlight/true), C).

Disagreement worth noting: teaching sources start from "make it move" and reach keyframe *types* quickly. None of the sources I read teaches *finding what is already animating* (U/UU, which layers have keys), yet that is the learner's stated pain (interview 007). That gap is the designer's opening.

## Common beginner mistakes and misconceptions

| Mistake | What a wrong result looks like in the comp | Frequency/source |
|---|---|---|
| Changes a value without the stopwatch on | The whole layer is just moved/scaled for all time; no keys appear; "my animation doesn't play" | P (very common in my experience); no source found. Verify via interview question. |
| Stopwatch on, then edits a value at a time between keys | A new key appears unexpectedly; the earlier motion changes shape | P |
| Looks for keys and can't see them | Property group collapsed; learner thinks nothing is animated | C ([Adobe Community](https://community.adobe.com/t5/after-effects-discussions/moving-layer-key-frames-not-moving/m-p/9330549/highlight/true)), recurring answer "press U" |
| Drags the layer bar when meaning to move keys (or the reverse) | Whole animation shifts in time; or layer in/out points move | C (several "keyframes don't move with layer" threads, e.g. [this one](https://community.adobe.com/t5/after-effects-discussions/keyframes-don-t-move-with-drag-layers/td-p/14114690)) |
| Time-remap or time-stretch on, unnoticed | Keys won't land where expected; timing differs from the numbers | C (same search result set) |
| Precomp with a different frame rate than the main comp | Keys on the precomp layer won't move | C (single thread; low weight) |
| Anchor point confusion | Scale/rotate pivots around the wrong spot; layer swings or drifts | P. Related new-in-26.5-beta: Quick Set Anchor ([Adobe Community 26.5 post](https://community.adobe.com/announcements-527/after-effects-26-5-is-here-1641108/index1.html), B-ish, beta feature) |
| Position has a hidden second layer of animation | Layer moves though the learner set no keys on it (parent, expression, or precomp) | P; overlap list below |

Frequency is weak across the board: forum threads show that these happen, not how often. Nothing here comes from the product's own users except interview 007's "finding what broke" theme.

## Overlaps with other AE concepts (for the spec's list)

- **Expressions over keys.** An expression on Position (alt-click stopwatch) overrides the keys' effect; the stopwatch looks active and keys display, but the layer does not follow them. The existing check already flags expression properties (`mentor/lib/analyze.mjs` line 36) and the Logo Rotation case in `discovery/usage-notes/mentor-panel.md`. A "set a keyframe" check must too.
- **Single and hold keys.** One key on a property means the value is constant (no motion), so "I set a keyframe and it doesn't move" is the single-key case. Existing `segments()` treats `keys.length < 2` as `single_key`.
- **Separated dimensions.** Position can be split into X/Y(/Z); the stopwatch and keys then live on separate properties. Existing `snapshot.jsx` lines 55-56 already handle leader/follower. See the motion-path brief.
- **Effects.** Effect parameters use the same stopwatch but sit under Effects, not Transform; "P/S/R/T/A" shortcuts do not reveal them (P). Teach `E`/`EE` only if the designer wants effects in scope.
- **Precomps.** Keys inside a precomp are invisible from the parent comp's timeline; a layer that looks static may be animated inside.
- **Hidden layers.** Shy layers and eyeball-off layers still have keys; a "what's animating" read should say whether the layer renders.

## Version dependence (2023 to 2026)

- Core model (stopwatch, keys, shortcuts) has been stable; I found no release note that changes it. Confidence: medium, because 24.x notes were unreadable.
- Properties panel: appeared in beta late 2021 (build 22.2), gained Text and Shape layer support in 23.4 (May 2023), Essential Properties in 23.6 (August 2023) (search excerpts of [Adobe 23.4](https://helpx.adobe.com/after-effects/using/whats-new/2023-4.html) and [23.6](https://helpx.adobe.com/after-effects/using/whats-new/2023-6.html), A). A learner may be changing values in the Properties panel rather than the timeline; the stopwatch may be in a different place. Whether it is the default in 26.x was not confirmed.
- 26.2 (April 2026): "proportional scrubbing in the timeline" listed ([Adobe What's new](https://helpx.adobe.com/uk/after-effects/desktop/what-s-new/whats-new.html), A via excerpt). Changes how scrubbing feels; not how keys behave.
- 26.5 (September 2026): Effect Controls panel rebuilt with icon-based controls, Quick Set Anchor (beta), AI Assistant panel (beta) ([Adobe Community announcement](https://community.adobe.com/announcements-527/after-effects-26-5-is-here-1641108/index1.html), A). The rebuilt Effect Controls may move where effect stopwatches appear; check on the builder's version.
- Help written before the Properties panel or the rebuilt Effect Controls will describe a different UI (belief 16, interview 008).

## What the mentor could check

Reads that exist today (`mentor/jsx/snapshot.jsx`: per key time, in/out type, ease; expression flag; separated-dimension handling):
- Right: a property has two or more keys at different times with different values; the expected property (not another) was keyed.
- Wrong: value changed with no keys (the snapshot shows 0 keys and a different value from before: diff the value across snapshots); a single key; a key on the wrong property; an expression enabled on the property.
- New read needed: whether the stopwatch is on with zero keys left (rare); layer parent and precomp contents; parent-driven motion; whether a layer is shy or its eyeball is off.

## Open questions

1. How many designers new to AE already know the stopwatch? Interview 007's student did (class). Ask target learners.
2. Is the Properties panel the default entry in the builder's version?
3. Should this be a lesson or a diagnostic ("what's animating here")? Evidence leans diagnostic (belief 1, interview 007) but nothing tests it.

## Sources

| Title | Link | Version | Date | Strength |
|---|---|---|---|---|
| Adobe: What's new in After Effects | https://helpx.adobe.com/uk/after-effects/desktop/what-s-new/whats-new.html | 26.2 to 26.5 | Sept 2026 | A (excerpt only) |
| Adobe Community: After Effects 26.5 is here | https://community.adobe.com/announcements-527/after-effects-26-5-is-here-1641108/index1.html | 26.5 | Sept 2026 | A |
| Adobe: Features summary Aug 2023 / May 2023 | https://helpx.adobe.com/after-effects/using/whats-new/2023-6.html | 23.6, 23.4 | 2023 | A (excerpt only) |
| School of Motion: After Effects keyframe types | https://www.schoolofmotion.com/blog/after-effects-keyframe-types | unstated | undated | B |
| Adobe Community: moving layer key frames not moving | https://community.adobe.com/t5/after-effects-discussions/moving-layer-key-frames-not-moving/m-p/9330549/highlight/true | 2017-era thread | 2017 | C |
| Adobe Community: keyframes don't move with drag layers | https://community.adobe.com/t5/after-effects-discussions/keyframes-don-t-move-with-drag-layers/td-p/14114690 | unstated | c. 2023 | C |
| Repo: interview 007, 008; mentor-panel usage notes | `discovery/interviews/`, `discovery/usage-notes/mentor-panel.md` | | | product evidence |
