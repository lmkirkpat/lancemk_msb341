# Brief: timing, spacing and offset between layers

**Group A, wave 1.** Researcher brief, 2026-10-20. **AE version: unknown** (flagged). Latest release found: 26.5 (Sept 2026). One 2025 feature (Quick Offset, 25.4) is directly relevant, so the builder's version matters here more than in the other group A briefs.

Strength key: A = official Adobe (search excerpt only; pages returned 403), B = established teaching, C = single tutorial/forum thread, P = practitioner knowledge not sourced here.

## What it is

*Timing* is when things happen and how long they take (key positions on the timeline). *Spacing* is how the in-between positions are distributed (how far the layer moves per frame, set by easing and the motion path). *Offset* is shifting layers or keys against each other so motion overlaps and staggers instead of everything starting and stopping together. This is the skill that separates "technically animated" from "reads as designed", and it is where the Adobe assistant out-diagnosed the mentor (equal durations, stacked parent motion, dead time: `CLAUDE.md`, `discovery/usage-notes/adobe-assistant-2026-10-08.md`).

## Source caution

Sources teach "timing" and "spacing" inconsistently. The Lester Banks piece notes a video's use of "timing" really means "spacing" ([2020](https://lesterbanks.com/2020/12/why-separate-dimensions-messes-with-your-keyframes/), B-/C). Animation theory (Thomas and Johnston, Animator's Survival Kit) defines the pair, but I did not read those books and found no AE-specific source that cites them. So the definitions above are the common animation-craft usage (P) and the designer should set one definition for the mentor.

## Prerequisites

- Setting keyframes (brief 1). Easing: **after.** Spacing is largely the result of easing, so the learner needs to know what ease does to speed before "spacing" has an AE meaning. Counterpoint: stagger/offset needs no easing and could come early and give a quick win; the evidence doesn't say which is better. It's the designer's call.
- At least two animated layers in the comp.

## How it's usually taught

1. Move key positions to change duration (drag keys closer together to speed up, wider to slow) (P, universally taught).
2. Offset layers to stagger: the sources show three ways, and they disagree on which is the beginner default:
   - Manual: drag layer bars or keys in the timeline (P).
   - Keyframe Assistant > Sequence Layers with the Overlap option: Overlap lets each layer begin before the previous ends; unchecked, each waits ([AE Juice](https://aejuice.com/blog/how-to-stagger-layers-in-after-effects), C; [Frame.io Insider, Dec 2023](https://blog.frame.io/2023/12/13/insider-tips-how-to-create-a-staggered-layer-sequence-in-after-effects), B-). Sequence Layers moves *layers*, not keys.
   - **Quick Offset (25.4, Aug 2025):** hold Cmd+Option (Mac) or Ctrl+Alt (Windows) and drag layers or selected keys across layers in the timeline; first stays, last moves the whole drag, in-between ones are spaced evenly; an overlay shows total offset and per-layer offset. "Shifts layers without altering their keyframe animations" ([Adobe feature summary Aug 2025](https://helpx.adobe.com/after-effects/using/whats-new/2025-4.html), A via excerpt; [Adobe Community feature focus](https://community.adobe.com/t5/after-effects-beta-discussions/feature-focus-quick-offset-stagger-your-layers-just-by-dragging-them/m-p/15483846), A-). First appeared in beta in June 2025.
   - Driver-layer scripts/expressions (Blast-Frame Overlap, delayed follow expressions) are third-party and out of scope for new learners (C).
3. Overlap and follow-through as design principles: secondary elements continue past the primary stop; stagger entrances (C; a low-authority page, not relied on).
4. Spacing: closer dots on the path mean slower; the Graph Editor speed graph is the other view (B, from School of Motion; see motion-path brief).

Disagreement worth showing: pre-2025 tutorials (Sequence Layers, manual drag, expressions) vs. the native Quick Offset. A learner on 25.4 or later who follows a 2023 tutorial will do it the long way and may not know the shortcut; a learner on 24.x or earlier who reads Quick Offset instructions will find nothing (belief 16 and interview 008 describe this exact failure).

## Common beginner mistakes

| Mistake | What a wrong result looks like in the comp | Source / frequency |
|---|---|---|
| Everything starts and stops on the same frames | Layers move in lockstep; feels robotic; "motion graphics looks stiff" | Product evidence: the Adobe assistant found equal durations as a cause in the builder's own comp (`discovery/usage-notes/adobe-assistant-2026-10-08.md`). Builder-only. |
| Equal durations everywhere | Every move takes the same number of frames | same |
| Dead time at ends | A long hold or empty stretch before first or after last motion | same |
| Stacked parent motion (child moves while parent moves) | Combined motion over-complicated or oddly fast | same |
| Drags a layer bar to offset, but the keys inside don't move (or reverse) | Layer in/out points shift while animation stays at timeline positions; or whole animation shifts | C (Adobe Community drag/keys threads) |
| Offsets keys on one property but not related ones | Position moves late but Scale/Opacity stay early; layer pops in before it moves | P |
| Offsets by hand by eye, inconsistent gaps | Uneven stagger rhythm | P |
| Sequence Layers applied to the wrong selection order | Order of appearance reversed vs. stack order | P; selection order matters per the Sequence Layers tutorials (unverified in excerpt) |
| Offset applied with Overlap off | Each layer waits until the previous ends; sequence feels slow | C (AE Juice) |

Frequency is weak: single tutorials and the builder's own comp. The strongest signal for target learners comes from interview 007 (finding what broke), which suggests a *diagnostic* framing ("why does this feel stiff") rather than a technique lesson.

## Overlaps (for the spec's list)

- **Expressions over keys.** A delayed-follow expression ties a layer's motion to another's; offsetting its keys does nothing because it has none. Existing expression flag applies. Also a time offset can be an expression (`time - 0.1`).
- **Single and hold keys.** A layer with one key has no duration; hold keys have a duration of zero motion but a visible gap, so "dead time" counts differ.
- **Separated dimensions.** X and Y can have different timing; "same duration" checks must compare the pair, not the combined property.
- **Effects.** Effect parameters animate on their own clocks; Quick Offset on selected keys across layers may include effect keys (unverified).
- **Precomps.** Offsetting a precomp layer moves the whole inner animation; offsetting keys inside needs opening it. A check at the parent level will miss inner timing; time remap on a precomp changes timing invisibly.
- **Hidden layers.** A hidden or shy layer's keys still count in timing totals but not on screen; ignore or flag them.
- **Parenting** (add to the list): stacked parent motion is an Adobe-assistant finding.

## Version dependence (2023 to 2026)

- Quick Offset: 25.4, August 2025, first beta June 2025 (A via excerpts). On earlier versions, absent. Verify the builder's version before using it.
- 26.2 (April 2026): proportional scrubbing in the timeline (A via excerpt): affects how timing feels to scrub; not behavior of keys.
- Sequence Layers and manual offsetting unchanged across 2023-2026 as far as I could tell (medium confidence).
- The AI Assistant panel in 26.5 beta is a competitor, not a source for this brief.

## What the mentor could check

Existing reads: key times per property; layer start/end; parenting and expression flags (expression flag exists; parent flag unconfirmed in the snapshot).
- Right: layers' first-key times differ by a roughly consistent small offset (a few frames to a few tenths of a second, designer's choice); durations vary on purpose; the learner can say why.
- Wrong: identical first-key times across layers; identical durations across all pairs; leading or trailing dead time; layer in-point moved but key times unchanged.
- This is a **whole-comp** read (the diagnosis capability in `CLAUDE.md` next steps), which the per-pair `analyze()` does not do. A new read (or a new analysis pass over the existing snapshot) is needed: compare first-key time and span across layers. The snapshot already has the data; the analysis is new.
- Taste warning: any threshold ("too even") is a judgment, not a rule. The designer should decide whether the mentor states one or only points out the pattern.

## Open questions

1. Is this one skill or two (duration/spacing vs. offset/overlap)? The sources treat them as separate tutorials; the Adobe diagnosis treats them as one finding.
2. What version does the builder run? If under 25.4, Quick Offset can't be taught.
3. Is the mentor allowed to say "this is too even", or must the learner conclude it (restraint, `decisions/002`)?
4. Do target learners think in "timing" vs. "spacing"? Ask; the words may not land.

## Sources

| Title | Link | Version | Date | Strength |
|---|---|---|---|---|
| Adobe: After Effects feature summary (August 2025 release) | https://helpx.adobe.com/after-effects/using/whats-new/2025-4.html | 25.4 | Aug 2025 | A (excerpt; 403 on fetch) |
| Adobe Community: Feature Focus, Quick Offset | https://community.adobe.com/t5/after-effects-beta-discussions/feature-focus-quick-offset-stagger-your-layers-just-by-dragging-them/m-p/15483846 | 25.4 beta/GA | 2025 | A- |
| Adobe Community: After Effects 25.4 is now available | https://community.adobe.com/t5/after-effects-discussions/after-effects-25-4-is-now-available-to-download/td-p/15459398 | 25.4 | 2025 | A- |
| Frame.io Insider: staggered layer sequence | https://blog.frame.io/2023/12/13/insider-tips-how-to-create-a-staggered-layer-sequence-in-after-effects | c. 23.x | 2023-12-13 | B- |
| AE Juice: How to Stagger Layers | https://aejuice.com/blog/how-to-stagger-layers-in-after-effects | unstated | undated | C |
| Lester Banks: timing vs spacing remark | https://lesterbanks.com/2020/12/why-separate-dimensions-messes-with-your-keyframes/ | unstated | 2020-12 | B-/C |
| Adobe What's new (26.2, 26.5) | https://helpx.adobe.com/uk/after-effects/desktop/what-s-new/whats-new.html | 26.2-26.5 | 2026 | A (excerpt) |
| Repo: Adobe side-by-side usage note | `discovery/usage-notes/adobe-assistant-2026-10-08.md` | AE builder version unknown | 2026-10-08 | product evidence (builder only) |
