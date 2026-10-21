# Teaching design: Break the lockstep with offset (curriculum skill 3)

**Owner:** curriculum designer (`decisions/007`). The spec writer's `spec.md` in this folder links
here and doesn't copy it. Gaps or contradictions come back as questions.
**Date:** 2026-10-20. **Status:** draft, round 1 answered (§ 14).
**Builds on:** `specs/004-ae-curriculum/curriculum.md` § 2, § 6 skill 3, § 8, § 9, § 13 (C3, H7);
spec 004 (approved), above all FR-004, FR-005, FR-016, FR-017, FR-018 to FR-022, FR-024, FR-027,
FR-030, FR-037; spec 005's DX-02, DX-03, DX-07. Research:
`discovery/curriculum-research/timing-spacing-and-offset.md`. Evidence:
`discovery/usage-notes/adobe-assistant-2026-10-08.md`. Lesson shape:
`.claude/skills/ease-mentor/SKILL.md`.
**Suggested record ID:** `timing.offset` (the skill builder names it).

Tags: **A** Adobe, **B** established teaching, **C** one tutorial or thread, **P** practitioner,
**R** repo evidence, **Guess** a design call with no evidence (also listed under open items).

## 1. The one idea, and why

**Idea:** motion reads as designed when things don't all move together. Shift layers, or one layer's
properties, a few frames apart.

**Why a learner needs it:** equal starts and landings were among Adobe's top findings on the
builder's comp (R): "On the Title, scale and opacity start and finish on the same frames." It's the
step from "technically animated" to "reads as designed" (brief).

**What Adobe's assistant can't do today, said plainly:** Adobe reads key times too, so the **depth
edge is small**. The edge is **memory and practice**: the learner does the stagger with their own
hands, each layer is checked, the review checks a new set of entrances days later, and the record
notices lockstep coming back on new comps (spec 005's pattern rule, FR-020).

## 2. Outcome

Without help, the learner can stagger a group of moves so no two start together, keeping each
layer's properties moving together unless they mean to split them, or split one layer's properties
so they don't start and land together.

## 3. Prerequisites

| Kind | Skill | If it's missing (C1, FR-005) |
|---|---|---|
| Hard | Easing (`easing.basic`) | Name it and offer it first. If the learner insists, the lesson runs after one sentence ("this builds on easing: offsetting moves that are still linear still looks mechanical"). No reteach and no grading of ease. If the focus moves are linear, say so once at "done" and suggest easing after this lesson. |
| Soft | none | |

## 4. Focus and demo target

**Two kinds of focus, one per lesson** (curriculum § 6):
- **Layers:** 2 to 5 layers whose **starts** are the same (FR-027's floor). A layer's start is the
  earliest start of any of its animated properties (§ 9 for holds, single keys and dimensions).
- **Properties:** one layer whose animated properties **start and land** together (spec 005 DX-03's
  definition: Title Position, Scale and Opacity, all 0.5 s to 1.5 s, in Mentor Practice).

**Proposing.** From a fresh read and the shared timing analysis (FR-016), the mentor names the
pattern in one sentence ("Bar and Glow both start at 0 s"; "Title's Position, Scale and Opacity all
run 0.5 s to 1.5 s"). It proposes the kind with the larger group of visible, non-null layers or
properties, and offers the other kind in one sentence if both exist. The learner agrees or picks.
Then the mentor asks the **intent question**: "Which should go first?" The learner picks the order
**and the gap**. The mentor never names a gap to use; asked, it says that's their call and to try one
and play it back (FR-027; curriculum H7). If the learner says up front that they want a layer's
properties split (Opacity before Position, say), the mentor repeats that back too.

**A properties focus with several moves.** When a property moves more than once (Title's Position
has four keys), it joins the group through the one move that starts and lands with the others, and
the lesson remembers which move that is, per property (round 1).

Say what's left out: hidden layers, nulls (their move shows only through children), precomps ("I
can't check their timing yet"), properties under an expression.

**Demo target rule.**
- **Layers kind:** the second layer in the learner's order (the first stays put), if it's visible,
  non-null, not a precomp, and has no expression on a keyed property; otherwise the next one that
  is. The demo shifts **every keyed property on that layer** (effects and separated X and Y included)
  by the learner's gap. Keys only, not the layer's in point (in points aren't read until R1).
- **Properties kind:** the second property in the learner's order; the demo shifts all of that
  property's keys by the gap.
- **No demo** when only one thing has to move (2 layers or 2 properties): the mentor walks it through
  in words.

**On Mentor Practice (as built, 30 fps):** the property focus on Title is the clean target (three
properties, so a demo and one left for the learner). The layer focus finds two pairs of two: Bar and Glow at 0 s
(Glow is an adjustment layer's blur, an odd "entrance"), and Title and the Cursor at 0.5 s (the
Cursor's first jump, by § 9's hold rule). CTRL is a null and left out. So the lesson there
will usually be the property kind. A clean layer target (3 to 4 entrances starting together) is for
the second practice comp (B-1).

## 5. Sequence

| Stage | Learner does | Mentor checks | What passes |
|---|---|---|---|
| 0. Remember | nothing | The record for this skill | n/a |
| 1. Look and propose | agrees or picks the other kind or other layers | Fresh read; the timing analysis's shared starts; focus rule (§ 4) | A group of at least 2 |
| 2. Explain on their comp | watches | One frame where the group visibly moves together, real names and times. Words: when everything moves at once, nothing leads the eye | n/a |
| 3. Intent | picks the order and the gap | The mentor repeats it back in plain words. If the gap is under the floor (1 frame at 30 fps), it says a gap that small still reads as together and asks them to pick again, naming no number. If they keep it, there's no demo: the mentor walks it through in words, and the check applies the floor as usual (round 1, D-1) | n/a |
| 4. I do (one demo) | watches, can Edit > Undo | Only when asked or clearly stuck. One write on the demo target (§ 4). Frames before and after the shift at the same time, so the difference shows | n/a |
| 5. You do | Offsets the rest, by any method, says "done" | Fresh read and diff. § 6. Credit the demo to the demo. Hints, never the fix | § 6 |
| 6. Rhythm comment (layers kind) | nothing | If gaps are uneven, one sentence on the rhythm, never a fail. If even, nothing | Never graded |
| 7. Record | nothing | § 11 | n/a |

The check reads key times, so the method doesn't matter (Quick Offset, dragging layer bars, dragging
keys).

## 6. Pass

FR-027 sets the measures: two times are **the same** if they're under 2 frames apart or under 1/15 s,
whichever is longer. That floor is never shown as a target.

**Layers kind:**
1. No two focus layers start the same (counting the demo layer).
2. Within each layer that moved, all its animated properties moved by the same amount (within half a
   frame), unless the learner said they want them split. They can say it up front (stage 3) or in
   answer to the "pops in" hint: the hint comes first, and if the learner says the split is on
   purpose, that layer passes on the next check. Ask, don't fail (round 1, D-2).

**Properties kind:**
1. No two focus properties **both start and land** the same. Shifting a whole property, moving only
   its start, or moving only its landing all break the lockstep (Adobe's own advice on Title was to
   land Opacity 4 to 6 frames early, R).

**Both kinds:** nothing is graded on the size or evenness of the gaps (H7, recommendation stands).

## 7. Common mistakes and the hint for each

| Mistake | What the check sees | Hint (where to look, never the fix) | Evidence |
|---|---|---|---|
| Everything still in lockstep | Starts still the same | Name the pair: "Bar and Glow still both start at 0 s" | R, builder-only |
| Moving one property, not the ones that belong with it (it pops in, or fades before it moves) | In a moved layer, properties moved by different amounts | A frame where it shows: "At 0.5 s Title's Opacity is already up but Position hasn't started. Scale and Opacity stayed at 0.5 s" | P |
| Moving the layer's in point (trimming), keys stay put, or the reverse | Key times unchanged on a layer the learner says they moved | "Title's keys still start at 0.5 s. Its bar may have moved, but the animation inside it didn't" | C, several threads |
| A nudge too small to read (1 frame) | Starts under the floor | "Title and Subtitle still start within a frame of each other, which reads as together." No number to aim for | FR-027, C3 |
| Pushing keys past the end of the comp | A last key after the comp's duration | "Glow's last key is now at 8.2 s, after the comp ends at 8 s, so it never finishes" | Guess |
| Using Sequence Layers (older help) and getting a reversed or overlapping order | Starts staggered, order not the one the learner said | "Bar now starts after Glow. You said Bar first; was that a change of mind?" Ask, don't fail | P |

## 8. Teaching scope (not taught here)

Varying durations (DX-02, deferred 11); Sequence Layers as a technique (it may be used, not taught);
delay expressions; follow-through and overlap as principles; dead time (DX-07, diagnosis hints
only); offsetting keys inside a precomp; time remapping.

## 9. Where AE concepts overlap, and what the check must see

All of these come from the shared timing analysis (FR-016), not this skill's own code.

| Overlap | What the check must see | What it must not do |
|---|---|---|
| Expression over keys | A property with an expression on is left out of starts, and named ("an expression drives Logo's Rotation, so its keys aren't what you see") | Count its keys as a start |
| Expression with no keys (delay expressions) | Not read until R2. The mentor never says the focus is everything that moves | Claim no other layer moves |
| Single key | A set value, not a move: no start | A move of zero length |
| Hold pair | A start at the moment it **jumps** (the second key's time), not the first key's time. A held Opacity 0 at 0 s jumping to 100 at 0.5 s starts at 0.5 s | Use the first key's time; or treat the hold as a move with a duration |
| Separated dimensions | X and Y Position as one move: the layer's Position starts at the earlier of the two; both shift together | Two moves, or one dimension left behind passing |
| Effects | Effect keys are motion: they count in the layer's start and must shift with its other keys (Glow's blur) | Skip them, or fail a layer because an effect key moved with it |
| Precomps | Not in the focus until R1 (in points, stretch, time remap); named as not checked. Inside keys aren't read | Compare inside key times to the parent's |
| Hidden layer (eye off) | Left out, "unless you want it" | Count it in the group |
| Matte (KD-001) | **Mattes should be in**: their motion is the reveal. Until R1, a matte looks like any eye-off layer, so it's left out with the same "unless you want it", and the learner can add it. After R1, the visibility class includes mattes by default | Leave a matte out once R1 can tell |
| Null | Left out as a focus layer (its motion shows only through children); named in one sentence | Demo on it |
| Parenting | A child's visible start includes its parent's motion. Not read until R1: in wave A the mentor says nothing about parents. **Known blind spot until R1:** staggering two children of a moving parent passes on their own keys, while the parent's shared motion still moves them together on screen. After R1: name it in one sentence, don't grade it; FR-037 hand-off only if skill 4 is learned | Grade a child's start by the parent's keys, or claim in wave A that the children no longer move together at all |
| Keys before 0 s or after the comp's end | Flag in a hint (§ 7) | Count a key the comp never plays as a landing |

## 10. Version notes (After Effects 26.5, macOS 27.0.1)

- **Quick Offset:** shipped in 25.4 (Aug 2025, A via excerpt), so it's in 26.5. Brief: hold
  Cmd+Option and drag layers, or selected keys across layers; the first stays, the last moves the
  whole drag, the rest are spaced evenly; an overlay shows the offsets. Offered **only if R0 reads
  25.4 or later** (R0 is wave A, FR-010), and only **after the live run confirms the gesture** (B-2).
  Until then, teach dragging.
- **Dragging layer bars or keys** works on every version. Dragging a bar moves its in point and keys
  together; dragging selected keys moves only keys.
- **Sequence Layers** (Animation > Keyframe Assistant) is what pre-2025 help teaches. Not taught;
  if the learner uses it, the check still reads key times.
- **26.2:** proportional scrubbing changes how scrubbing feels, not keys. Remind them to judge by
  playback.
- Don't quote nudge shortcuts (Option+Page Up and Down need fn on many Mac keyboards).

## 11. Review (in this sprint's baseline)

- **When:** spec 004 FR-019 to FR-021.
- **New target:** a group (either kind) on layers and properties the record doesn't show for this
  skill on this comp. No group → no review offered; it stays due. A group already staggered isn't a
  target (nothing to do; mention it, don't grade).
- **What it asks:** names the group in one sentence ("Card, Icon and Label all start at 1 s") and asks
  the intent question: "Which goes first?" (FR-021). Then "Stagger them however you like." No demo,
  no walkthrough, no method, no gap.
- **What passes:** § 6 for that kind.
- **Not a pass:** § 7's hints, no reteach; recorded as a review that didn't pass; "learned" stays.
- **"I already know it" (C4):** runs as above.

## 12. What the record stores

Spec 004 FR-018's shared fields. In plain words in the lesson entry:
- **kind** and **targets** (layers, or one layer's properties, and the comp), plus which focus kind;
- **attempted:** "Staggered Bar, Glow and Cursor, in that order";
- **summary:** what the checks showed ("Title's Position moved but Scale and Opacity stayed at
  0.5 s at first"; "gaps about 4 and 8 frames"; "split Title's Opacity on purpose"). The gap the
  learner chose is a measure of the work, not a method;
- **next:** one thing.

## 13. Open items

**For the builder (needs a live AE check on Mentor Practice, `discovery/Claude AE Tutor Test.aep`):**
- **B-1** Second practice comp (curriculum B1, FR-031): a clean layer target (3 or 4 visible
  entrance layers whose first keys share a time, each with two properties, one with an effect key,
  one with separated Position), and a second group on another layer set for review runs and evals.
- **B-2** Quick Offset at 26.5 on the Mac: the gesture; whether it moves effect keys too; whether it
  moves the layer (in point and keys) or only keys; and whether the even spacing can put keys between
  frames. If it can, the "same amount within half a frame" check needs a live look.
- **B-3** Demo write tool (curriculum B7: shift one layer's keys): all keyed properties on one layer,
  by a whole number of frames, keys only. Check it keeps each key's ease and type.
- **B-4** What the builder's `.aep` holds now (Title's keys, the Cursor), since § 4's Mentor Practice
  note is from the build script.
- **B6 (curriculum):** the shared timing analysis (FR-016) needs its owner and must exist before this
  skill is built. Skill 3 consumes its measures and applies FR-027; it never copies it.

**For the spec writer (S):**
- **S-1 (agreed; curriculum § 6 skill 3 updated 2026-10-20):** the properties kind passes when no
  two focus properties **both start and land** the same, not "start" alone. DX-03 is defined as
  "start and end on the same frames", and Adobe's fix for Title moved only the landing.
- **S-2** The hold-pair start is the jump time (second key). Spec 004's Edge Cases says only "a hold
  pair: a start, in timing"; please pin it in FR-016's rules, since spec 005 uses the same analysis.
- **S-3** Proposing the larger group, then offering the other kind: the tie-break is yours.

**For the eval engineer (E):** a 1-frame offset at 30 fps and a 3-frame offset at 60 fps still
called lockstep (spec 004); the mentor never names a gap, even when asked; uneven gaps get a rhythm
comment, never a fail; a layer whose Opacity moved but Position didn't gets the "pops in" hint; an
effect key that moved with its layer passes; a properties-kind lesson where only the landing moved
passes.

**For the human (H):** H7 (the taste rule) is assumed as recommended: name the pattern, never fail
on rhythm.

**Guesses:** "keys pushed past the comp's end" as a mistake; preferring the larger group when
proposing.

**Curriculum B items this skill settles:** B1 (skill 3's targets), B6 (consumer of FR-016), B7 (shift
one layer's keys).

## 14. Answers to the spec writer, round 1 (2026-10-20)

| Q | Answer | Spec default |
|---|---|---|
| D-1 Demo gap under the floor | **Agreed, and moved earlier:** catch it at stage 3 when the gap is repeated back, not only at the demo. Plain words ("a gap that small still reads as together"), no number, let them pick again. If they keep it, no demo; walk it through in words and check as usual. The one demo must show a real stagger (§ 5). | **Changed** (stage 3, not only the demo) |
| D-2 "Unless they said they want them split" | **Agreed: ask, don't fail.** The "pops in" hint first; if the learner says the split is on purpose, that layer passes on the next check. Saying it up front at stage 3 counts too (§ 4, § 6). The record's summary says it in plain words ("split Title's Opacity on purpose"). | Kept, plus the up-front case |
| Several moves in one property (FR-005) | **Confirmed:** the matching move counts, remembered per property (§ 4). | Kept |
| Children of a moving parent in wave A | **Confirmed** as a known blind spot until R1 (§ 9). The mentor says nothing about the parent and doesn't claim the children are now fully apart on screen. | Kept |
| Tie-break (properties kind) and rhythm threshold (FR-027's floor) | **No conflict.** The properties kind on a tie fits "one layer is a smaller lesson". Reusing the floor for "uneven" is right: no new number, and the comment is never a fail. | Kept |
