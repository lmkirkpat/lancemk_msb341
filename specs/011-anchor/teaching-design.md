# Teaching design: Set the pivot (curriculum skill 5)

**Owner:** curriculum designer (`decisions/007`). The spec writer's `spec.md` in this folder links
here and doesn't copy it. Gaps or contradictions come back as questions.
**Date:** 2026-10-23, amended 2026-10-26 after the live sitting (L-1 to L-5,
`live-sitting-2026-10-26.md` on `skill-5-anchor`), and again 2026-10-26 after the first live
lesson (T236, § 17). **Status:** draft, round 1 answered (§ 15), round 2 answered (§ 16: D-4 and the
wording list), the one-layer watch offer decided (§ 17), round 3 answered (§ 18: D-8 and D-9,
2026-10-26). § 19 (the opening turn, from HO-1's smoke run) is **proposed**, waiting for the human.
**Builds on:** `specs/004-ae-curriculum/curriculum.md` § 2, § 4, § 6 skill 5, § 8, § 9, § 12 (B5),
§ 13, § 14; spec 004 (approved), above all FR-004, FR-005, FR-013, FR-014, FR-018 to FR-024,
FR-028, FR-030, FR-031, FR-037, its Edge Cases table, and plan.md › Waves › Wave B (skill 5 teaches
Pan Behind, never Quick Set Anchor). Research: `discovery/curriculum-research/anchor-point.md`.
Evidence: `discovery/usage-notes/adobe-assistant-2026-10-08.md`. Lesson shape:
`.claude/skills/ease-mentor/SKILL.md`; section shape matches `specs/008-speed-graph/` and
`specs/010-offset/` teaching designs.
**Suggested record ID:** `transform.anchor` (the skill builder names it).

Tags: **A** Adobe, **B** established teaching, **C** one tutorial or thread, **P** practitioner,
**R** repo evidence, **Guess** a design call with no evidence (also listed under open items).
The anchor brief found **no B source** for this skill on its own, so most mistake evidence here is C.

## 1. The one idea, and why

**Idea:** rotation and scale turn around the anchor point. Move it with Pan Behind so the layer
stays where it is.

The words the lesson uses for it, once: **Anchor Point is where the pivot sits inside the layer;
Position is where that pivot sits in the comp** (brief, C; and Adobe's own "those numbers are in each
layer's own space", R). Change Anchor Point alone and the layer slides so the new pivot lands on the
old Position. Pan Behind changes both together, so nothing moves on screen.

**Why a learner needs it:** "I rotated it and it swung wide" (or spun in place when it should hinge)
is the most common rotation failure (brief, C, "very common"). It shows up the first time a designer
animates a door, a flap, a needle, a bar growing from its left end, or a badge popping up from its
base.

**What Adobe's assistant can't do today:**
- **Depth.** On 2026-10-08 it said its screen-position samples didn't work "because those numbers are
  in each layer's own space" (R). Knack reads each layer's bounds in comp space (R3), so it can check
  the two things that make this skill right at once: the pivot moved to the named place inside the
  layer, and the layer didn't move on screen. It also checks every other layer didn't move (a missed
  click with Pan Behind grabs the wrong layer, § 7).
- **Memory and practice.** The review, days later, gives a new layer and asks where it hinges, with no
  tool named. The record keeps whether the learner's first try jumped, so a later lesson on any skill
  can say "set the pivot first" only to someone who has had that trouble.

## 2. Outcome

Without help, the learner can put a layer's pivot where its motion needs it (a corner, an edge, the
base, the center) without the layer moving on screen, and can say which part stays still when it
turns.

## 3. Prerequisites

| Kind | Skill | If it's missing (C1, FR-005) |
|---|---|---|
| Hard | Setting keyframes (on-ramp, not a skill; spec 003 FR-010 shows it done) | Nothing to offer. The main path of the lesson changes no keys at all. Keys matter only in § 4's rest-pose rule, and there the mentor says which key to stand on. |
| Soft | none | |

Skill 5 is the hard prerequisite of skill 6 (curriculum § 4): the null's pivot is the group's pivot.
The lesson's last line can say so when skill 6 is built (§ 5, stage 8).

## 4. Focus and demo target

### The intent question comes first

The mentor can't read where something should hinge, so it **asks** (FR-021 keeps this in the
review). Two forms:
- **The learner has a layer in mind:** "Which layer do you want to turn or grow from somewhere other
  than its middle?" then "Where should it turn from: a corner, an edge, or the middle?"
- **They don't:** the mentor offers one candidate in one sentence, from § 4's ranking, with a hinge
  that suits its shape ("Door could swing from its left edge. Want to try that one?"). The learner
  can name another place. If there's no candidate at all, it offers a new solid (Layer > New >
  Solid, a small rectangle), since a solid's anchor and bounds are the simplest case.

**The nine places** (curriculum § 6; they also match Quick Set Anchor's grid): top-left corner,
middle of the top edge, top-right corner, middle of the left edge, center, middle of the right edge,
bottom-left corner, middle of the bottom edge, bottom-right corner. The mentor repeats the place back
in plain words ("the middle of Needle's bottom edge").

- **A place off the grid** (the shoulder of an arm, a hole in a hinge): the mentor says it can check
  the nine places, asks for the nearest one for this lesson, and says they can nudge it after. Guess
  (open item S-3).
- **The pivot is already there:** not a target. Say so in one sentence ("Card already turns from its
  center") and ask for another layer or place. Text layers are the common surprise here: their pivot
  sits on the baseline, not the middle (§ 9).

### Which layers are candidates

From a fresh read, using the visibility class (FR-013), never the eye switch alone:

| Layer | Candidate? | What the mentor says |
|---|---|---|
| *renders*, 2D, solid, shape, text, footage or precomp, Anchor Point and Position with no keys and no expression on a keyed property | **Yes** (the default) | n/a |
| Shape layer | **Yes** (L-1 passed 2026-10-26: Pan Behind on the layer moves its own Transform anchor and Position together, and the read matches the shape as drawn) | Nothing extra. If its pivot sits outside the shape, say which side and where to look (§ 7). The group hint is in § 7 |
| Text layer | Yes | Its pivot starts on the text's baseline (§ 9) |
| Precomp layer | Yes, ranked below the others | "Icon's edges are its precomp's frame, 400 × 400, not the square inside it." Collapse Transformations on: not a candidate once R1 reads it (open item B-3); until then, say once that it's not checked |
| Parented layer | Yes, ranked below unparented ones | Names the parent in one sentence ("Title rides on CTRL; that doesn't change where its own pivot goes"). FR-037's hand-off doesn't fire: the parent's motion can't change this check (§ 9) |
| Position keyed at **two or more times** (X and Y counted together; hold keys too) | **No** (D-4, § 16). Pan Behind at 26.5 changes or adds one Position key, at the playhead, so the layer always slides at its other keys and no taught move can pass | "Sled already moves, so moving its pivot now would shift where it sits at its other keys. Set the pivot before you key. Pick a layer that doesn't move yet?" |
| Position keyed at **one** time | **Not a default candidate.** Allowed if named, only when that key's time is also the check time (no Rotation or Scale keys, or the rest key is on the same frame). Otherwise treated as the row above, but with its own sentence (D-8, § 18) | On the check time: "Sled has one Position key, at 3.7 s. Put the playhead right on it before you drag, so the pivot change goes into that key". Rest key on another frame: "Sled's Position key is at 1 s, but it's at rest at 3 s, so moving its pivot now would shift where it sits on one of those two frames. Set the pivot before you key. Pick another layer?" |
| Rotation or Scale has keys | Ranked below layers with none; allowed | The rest-pose rule below |
| Rotation or Scale under an expression (Logo in Mentor Practice) | No | "An expression turns Logo, so I can't tell where it sits at rest" |
| Anchor Point has keys | No (an animated pivot is out of scope) | "Anchor Point is animated on Badge, which this lesson doesn't cover" |
| 3D layer | No (out of scope) | "3D layers have a depth to their pivot; that's for later" |
| *hidden by the learner* (eye off) | No, unless the learner wants it. Never the demo | "You've hidden this, so turn its eye on first if you want it": Pan Behind needs to see it |
| *matte* | Not a default candidate; allowed if named (its pivot shapes the reveal). Never the demo | Never "you've hidden this". If they turn its eye on to drag and leave it on, one sentence: "it's a matte, so turn its eye back off" |
| *guide* | Not a default candidate; allowed if named | n/a (it doesn't render, so frames can't show it) |
| *shy* | Yes, ranked below the rest | "It's shy, so turn off the timeline's shy filter to see its properties" |
| *null*, camera, light, adjustment layer | No | Nulls: "a null's pivot is skill 6's job" (only if skill 6 is built; otherwise say nothing) |
| A full-frame solid or footage (a background) | Last resort only | n/a |
| Locked layer | Never proposed, never the demo; allowed if the learner names it (round 1, D-2) | "Sign is locked, so unlock it first (the lock switch in the timeline)" |

**Ranking among candidates:** unparented first; then **how animated the layer already is, in three
steps: no keys on anything, then keys but none on Rotation or Scale, then Rotation or Scale keys**
(amended 2026-10-26; any keyed property counts, Opacity, an effect, a mask or a text animator, not
only Transform). A layer with keys is finished or half-finished work, and the pivot set before any
keys is the habit the review looks for. Then layers whose pivot is still where AE put it (a learner
moving a pivot they already moved is fixing, not learning); then smaller layers over full-frame
ones. History can't be read, so "where AE put it" means: the anchor is at the center of the layer's
own rectangle, or at the layer's own origin (0, 0), which is where text layers and new shape layers
start (round 1, D-3; L-3 found a new shape layer's origin is the comp's center, often away from what
was drawn, so such a layer is also a "pivot outside" case, § 7). It's only a tie-break, so a wrong
guess costs nothing. The steps rank, they never filter: a comp where every layer has keys still gets
a proposal.

### The rest pose (layers with Rotation or Scale keys)

Moving the pivot keeps the layer still **at the frame where you move it**. At other frames, with a
different angle or size, the layer now turns around the new pivot, which is the point. But if the
pivot is moved while the layer is turned or shrunk, its **resting** position shifts. A pop-in that
starts at Scale 0 is the sharp case: at that frame the layer is a dot, so nothing visible moves, and
the move goes wrong at every other frame (P, Guess on how common). **L-4 (2026-10-26)** confirmed it
and added two things: the learner reads it as "it wouldn't let me drag", and AE does move the pivot,
**far outside the layer** (Pop: to the comp point under the cursor, read as a layer point), not near
the place they meant. So a learner who says "it won't let me drag" on a keyed layer gets a check,
not agreement, and the hint asks for Edit > Undo before the second try (§ 7), so they don't start
again from a pivot far off.

So for a layer with Rotation or Scale keys, the mentor names a **rest key**: a key time where
Rotation is 0 (or a whole turn) and Scale is at its largest key value. If no one key time has both,
it picks the Scale one, says so, and asks whether that's how the layer looks at rest. If Rotation
is the only one keyed and no key is at 0 (or a whole turn), it uses the key closest to 0, says so in
one sentence, and asks the same question (round 1, D-1). It asks the
learner to put the playhead there before they start, and the check uses that time (§ 6 item 3).

### Focus size and the demo target

**Focus: one or two layers, each with its own place.** The learner's layer is always in it. If the
learner wants to watch one first (asked, or a yes to the watch offer below), or a second layer
clearly needs it, the focus has two.

**Demo target rule** (one write, FR-024):
- With **two** focus layers, the demo goes on the one the learner cares less about: the one the mentor
  offered, or the second one they named. It must be a default candidate (renders, 2D, no keys and no
  expression on Anchor Point or Position, not a precomp with Collapse Transformations on; shape
  layers qualify), and if it has Rotation or Scale keys the playhead must be on its rest key. If
  the other layer qualifies and this one doesn't, swap; if neither does, no demo.
- With **one** focus layer, **no demo on it**: the mentor walks it through in words (easing's
  single-pair rule).
- The demo is only when asked or clearly stuck (curriculum § 2, stage 3).

**The watch offer (one focus layer; decided 2026-10-26, § 17).** With one focus layer, the mentor
**offers** a watch on another layer, **once**, in **one sentence**, as the last sentence of the turn
that invites the learner to try (stage 3), after the walk-through in words:

> "I could show you on Needle first, if you like."

- **Which layer:** the highest-ranked default candidate (§ 4's table and ranking) other than the
  learner's that would qualify as the demo target (the demo target rule above). On Mentor Practice 2
  with Door as the focus, that's **Needle** (rank 2), not Tab. If none qualifies, **no offer**:
  never offer a watch the demo would refuse. "Would qualify" means (D-9, § 18): a default candidate,
  never a full-frame layer, not already at its suggested place, and, if it has Rotation or Scale
  keys, its rest key on the focus layer's check time.
- **When:** only when the learner hasn't passed this skill before (a first lesson, or practicing
  without a pass). **Never in a review** (no demo there, § 12), and **not in a practice lesson after a
  pass** (they've already set a pivot without help; the walk-through is enough, and they can still
  ask). Not when the learner already asked to watch one, or already named a second layer: the
  two-layer rule covers those.
- **Yes:** the focus becomes two, theirs first; the mentor names the demo layer's place in one
  sentence from a hinge that suits its shape ("I'll turn Needle from the middle of its bottom
  edge"), and stage 3 runs as for two layers. Door is still theirs to do.
- **No, or no answer** (they just try, or say "done"): the lesson goes on with one layer. **No
  second offer**, not after a failed check either; § 7's hints carry it from there. If they ask
  later, they get it (the one demo is still unused).

**What the demo does:** moves that layer's Anchor Point to the named place and moves Position by
exactly what keeps it still, at the current time, in one undo step. Separated X and Y Position get
written as two values. It never keys anything.

**What the demo shows:** before it runs, the mentor asks the learner to select the demo layer and
press **A**, then **Shift+P**, so Anchor Point and Position both show in the timeline. Then:
1. A frame **before** and a frame **after**, at the same time. They look the same, and that's the
   point: "Both numbers changed, and Door didn't move."
2. No rotated frame from the mentor. A rotated frame would need a second change to the project, and
   the anchor crosshair isn't in a rendered frame anyway. Instead the learner tries it (stage 6): drag
   Rotation, watch it swing from the hinge, Edit > Undo. (The curriculum outline asked for "then a
   rotated frame"; open item B-5 asks whether a preview could rotate without a change. I recommend
   not.)

### On Mentor Practice (as built by `mentor/dev/build-practice-comp.jsx`)

There's no good target. Logo turns under an expression; Bar has keys on X Position; Title and
Subtitle have Position keys and ride CTRL; Old Take is hidden; CTRL is a null; Glow is an adjustment
layer; Background is full-frame. That leaves **Icon** (a precomp whose frame, 400 × 400, is much
bigger than the square moving inside it, so its edges aren't what the learner sees) and **Cursor** (a
"|" that has no real hinge). A lesson there would likely be one weak layer and no demo. **The live
lesson runs on Mentor Practice 2 with its 2b layers** (B-1, built). There, with the three-step
ranking, the proposal is **Door, the middle of its left edge**, and a review with Door and Needle in
the record picks **Tab** (spec FR-004's answer key). Sled (three Position keys) is a leave-out, with
§ 4's sentence.

## 5. Sequence

| Stage | Learner does | Mentor checks | What passes |
|---|---|---|---|
| 0. Remember | nothing | The record for this skill (first lesson, practicing, learned: offer a review, § 12) | n/a |
| 1. Ask and propose | names a layer and a place, or agrees to the mentor's | Fresh read (snapshot plus R1 and R3). § 4's candidate table and the intent question. Says what's left out and why in one sentence | A focus of 1 or 2 layers, each with a place that isn't already where the pivot is |
| 2. Explain on their comp | watches | One frame from their comp with the focus layer in it, real names. The two sentences from § 1 (inside the layer vs in the comp). Where the pivot is now, in place words ("Needle's pivot is at its center"; "Title's is on its baseline"). Rest key named, if § 4 needs one | n/a |
| 3. I do (one demo) | shows Anchor Point and Position (A, Shift+P), watches, can Edit > Undo | Only when asked or clearly stuck, on the demo target (§ 4). Frames before and after. **With one focus layer:** the walk-through in words, then the invite to try, ending with the watch offer, once (§ 4, § 17) | n/a |
| 4. You do | Pan Behind (Y), drags the pivot to the place on their layer, says "done" | Fresh read and diff against stage 1's read. § 6 for each focus layer, crediting the demo to the demo. Hints from § 7, never the fix | § 6 |
| 5. Understanding check | Says which part of the layer will stay still when it turns | Their answer against the named place. Light: right after at most one hint | **Recorded, doesn't gate** (it's nearly given away by the place they named, so it only catches a real mix-up) |
| 6. Try it (we do, ungraded) | Drags the Rotation (or Scale) value a little in the timeline, watches it swing from the hinge, then Edit > Undo | Nothing graded. The check already passed in stage 4 | n/a |
| 7. Play-back note | nothing | If Rotation or Scale is keyed: one sentence to play it back and see the move turn from the new place | n/a |
| 8. Record | nothing | § 13. If skill 6 is built: "the same idea makes a null a good handle for a group" as the "next" | n/a |

**Why "try it" is after the check, not before:** dragging Rotation changes the layer's footprint. Done
before the check, a learner who forgets Edit > Undo would fail the no-move check for something the
lesson asked them to do.

**Frames and the crosshair.** The anchor crosshair is a panel overlay, not part of a rendered frame.
The mentor never says "you can see the pivot here" about a frame. It says where the pivot is in place
words, from the read.

**The method doesn't matter to the check.** Pan Behind is what's taught. Typing both numbers by hand,
Quick Set Anchor (§ 11) or Layer > Transform > Center Anchor Point in Layer Content (for the center
place, B-4) all pass if § 6 holds.

## 6. Pass, per focus layer

All of these, counting the demo layer (FR-028 sets the first two measures):

1. **In the named place:** the anchor is within **10% of the layer's width** of the place's point
   horizontally and **within 10% of its height** vertically. **Both measured in the layer's own space**
   (Anchor Point against the layer's own rectangle, R3), not in the comp. So Scale not at 100%,
   a rotated layer, or a parent's scale doesn't change what "the bottom-left corner" means. On an
   800 × 60 bar that's 80 px across and 6 px up and down, so top-left, left-middle and bottom-left
   stay three different places (curriculum § 13).
2. **Didn't move:** every edge of the layer's comp-space bounds moved by **1 pixel or less**, at the
   check time (item 3).
3. **At the right time:** the check time is the current time, or the rest key's time when Rotation or
   Scale is keyed (§ 4). If the read can't take a time (open item B-2), the check needs the playhead
   on the rest key, within half a frame, and the hint asks for it.
4. **Only if Position had a key and the learner chose this layer anyway:** item 2 holds at **every
   Position key time** of the first read too, so a pivot that slides the animation at other times
   doesn't pass. Since D-4 (§ 16) only a one-key layer can get here, so in practice this catches
   Pan Behind with the playhead off that key: AE adds a second key at the playhead and the layer
   slides at the old one (L-2).
5. **Nothing else moved:** no other layer's comp-space bounds moved by more than 1 pixel (children of
   the focus layer included), and Anchor Point gained no keys. This is what catches Pan Behind
   grabbing the wrong layer.

**Never stated as a target.** The mentor doesn't say "within 10%" or "1 pixel". It says "on the
bottom edge, in the middle" and "without Needle moving".

**What doesn't fail:** the exact spot inside the place's tolerance; how they did it; a pivot moved on
a layer the learner then decides to leave out (it's not graded, and item 5 only looks at bounds).

## 7. Common mistakes and the hint for each

Hints name the layer, what moved and where to look, never the numbers to type.

| Mistake | What the check sees | Hint | Evidence |
|---|---|---|---|
| Typed a new Anchor Point value (or scrubbed it), so the layer jumped | Anchor moved; Position unchanged; bounds moved | "Door's pivot moved, but Door moved with it, down and to the right. Edit > Undo, then try Pan Behind (Y) and drag the crosshair instead" | C, very common |
| Dragged the layer itself with the Selection tool | Position changed, anchor unchanged, bounds moved | "Door moved, and its pivot is still at its center. Pan Behind (Y) drags the pivot, not the layer" | C (brief, "or dragging it with the Selection tool") |
| Pivot left at the center, or not moved far enough | Anchor still in the center place, or between places | "Needle's pivot is still near its middle; you wanted the middle of its bottom edge" | C, very common |
| Close, but in the neighbouring place (thin layers) | Anchor in another place, often a corner instead of an edge middle | "Banner's pivot is at its bottom-left corner. You said the middle of the left edge, a little higher" | Inference from FR-028's thin-layer case |
| Pivot outside the layer (a shape drawn with the pivot left where the layer started) | Anchor outside the layer's rectangle, with the side it's on as seen on screen (spec FR-019a) | "Lid's pivot sits outside the lid, below it, which is why it would swing wide. Click Lid in the timeline and its crosshair shows up below the shape; start your drag there." No side read: "outside the lid", and the same "click Lid in the timeline" to find it. Never a distance | R (L-1: the builder couldn't find Lid's crosshair until Lid was selected; L-3: a new shape's pivot lands at the comp's center) |
| Pan Behind grabbed another layer | Focus anchor unchanged; another layer's anchor changed and bounds didn't | "Needle's pivot hasn't moved, but Background's did. Pan Behind moves the pivot of whatever layer is under the cursor when you start dragging, even if Needle is selected. Edit > Undo, then start the drag right on Needle's crosshair." Never "select it first" as the fix (selecting only makes the crosshair show) | R (L-3, 2026-10-26: with Door selected, a drag on Needle moved Needle's pivot) |
| In place but moved: the pivot landed in the place, but the layer moved too (Pan Behind, then a nudge with the Selection tool; or both values typed, one wrong) | Anchor in the named place; Anchor Point and Position both changed; bounds moved, in a known direction | "Needle's pivot is in the right place, but Needle moved too, up and to the left. Edit > Undo back to where only the pivot had moved" | Review of the build, 2026-10-24 |
| Another layer moved: the focus layer passes, but a different layer moved (a stray drag with the Selection tool; Pan Behind alone wouldn't move it on screen) | Focus passes § 6 items 1 to 4; another layer's bounds moved, in a known direction | "Needle looks good, but Background moved too, down and to the right. Edit > Undo until Background is back, then check Needle's pivot is still where you put it" | Review of the build, 2026-10-24; L-3 |
| A shape's own pivot didn't change (it may have been a group's pivot, inside Contents) | **No change at all** on the layer: anchor, Position and bounds as before, no other layer's anchor changed. A group's pivot moved by Pan Behind can't be told apart from not trying (L-1) | "Lid's own pivot hasn't changed. If you dragged a pivot while something under Contents was selected, that one belongs to a group inside Lid, not Lid itself. Click Lid's name in the timeline, then drag its crosshair." Said as a possibility, never "you moved the group's pivot" | R (L-1, 2026-10-26: one drag on Contents › Rectangle 1 did it, and the read was identical to the base) |
| What's drawn moved, the pivot didn't (any layer: a text layer's justification changed, a path edited, a shape group's own Position) | Anchor unchanged; the layer's own rectangle shifted; bounds moved | Text: "Sign's letters moved, but its pivot didn't: changing how text lines up moves the letters, not the pivot. Edit > Undo that, and move only the pivot, with Pan Behind (Y)." Shape or other: "Lid's shape moved inside the layer, but its pivot didn't, so Lid shifted on screen. Edit > Undo that, and move only the pivot, with Pan Behind (Y)." Names no group on a text layer | R (L-5: a justification change shifts Sign's letters this way) |
| Set the pivot away from the rest key (turned or shrunk) | Check time isn't the rest key, or bounds moved at the rest key | "Gauge is part-way through its turn here. Put the playhead on its first key, where it's at rest, and set the pivot there" (with the rest key's time, as the read gives it) | P, Guess |
| Set the pivot while the layer was shrunk to nothing (Pop at Scale 0), often reported as "it wouldn't let me drag" | As the row above (one hint, the cause). The pivot is also far outside the layer, on a known side; that's said in the same hint, not as a second one | "Pop is shrunk to nothing at 3.3 s, so the drag looked like it did nothing, but it did move Pop's pivot, far below it. Edit > Undo first, then put the playhead on 4.3 s, where Pop is full size, and set the pivot there" | R (L-4, 2026-10-26: AE set Pop's anchor far outside; the builder said "it wouldn't let me drag") |
| Pan Behind on a one-key layer with the playhead off that key, so AE added a second key and the layer slides at the first | Item 4 fails at the old key time; a Position key was added | "Sled stays put at 0 s, but at 3.7 s it now sits to the right of where it was. Pan Behind changed Position only where the playhead was, and added a key there. Edit > Undo, put the playhead right on Sled's key at 3.7 s, and drag again" | R (L-2, 2026-10-26: `sled-one-key`) |
| Turned on Anchor Point's stopwatch by accident | Anchor Point has a new key | "Anchor Point has a stopwatch on now, so the pivot would move over time. Turn it off, and keep the pivot you set" | Guess |
| Left a matte's eye on after dragging it | Matte's eye switch changed | "Window is a matte, so turn its eye back off" | C (skill 8's mistake, seen early here) |

## 8. Teaching scope (not taught here)

- 3D anchors and the 3D gizmo; cameras.
- Shape **group** anchors inside Contents (named in a hint only); effect points (Transform effect,
  Twirl, Warp centers).
- Collapse Transformations (precomps brief, unverified against Adobe's help).
- Animating the anchor point itself.
- Snapping the crosshair (⌘ while dragging; L-1 saw it work, § 11). Not this sitting's idea.
- Quick Set Anchor as a step (§ 11).
- Parenting and nulls (skill 6). Precomposing (skill 10).
- Fixing Position keys after a pivot change, and re-pivoting a layer that already moves (two or more
  Position keys). Not a candidate here (D-4, § 16); not taught anywhere in the ten-skill path yet
  (curriculum follow-up C-3).

## 9. Where AE concepts overlap, and what the check must see

| Overlap | What the check must see | What the mentor says | What it must never do |
|---|---|---|---|
| Expression on a **keyed** Anchor Point or Position | The snapshot's expression flag: not a candidate | "An expression drives Door's Position, so moving its pivot may not show" | Grade it, or demo on it |
| Expression on an **unkeyed** Anchor Point or Position (an auto-center expression is a common pro trick) | Not read until R2. R3 should return what renders (after expressions, B-2), so the check grades the result | If the pivot didn't move after "done": "Door's pivot didn't change. If something drives it, like an expression, I can't see that yet" | Say there's no expression |
| Expression on Rotation or Scale | Flag on a keyed property: not a candidate (no rest pose can be found) | "An expression turns Logo, so I can't tell where it sits at rest" | Say the expression ignores the pivot (it doesn't; a Rotation expression still turns around the anchor) |
| Keys on Anchor Point | Not a candidate | One sentence (§ 4) | Teach an animated pivot |
| Keys on Position at two or more times (L-2: Pan Behind changes or adds one key, at the playhead, and leaves the others) | Not a candidate (D-4) | § 4's sentence ("set the pivot before you key") | Accept it as a target the learner can't pass |
| One Position key (the stopwatch is on, so a drag off that key adds a second one, L-2) | Allowed if named, when the key is on the check time; § 6 item 4 | § 4's "playhead right on it" line; § 7's slid hint if they drag off it | Grade only the current time on a keyed Position |
| Hold keys on Position | Counted like any key: two or more times, not a candidate; one, as above | n/a | Treat a hold jump as the pivot's fault |
| Separated dimensions (Bar's X Position) | Footprint from bounds, so separated or not doesn't matter. The demo writes X and Y | n/a | Read "Position" as one value and miss a dimension |
| Effects | Bounds read without effects (what the layer itself occupies). Effect points don't move with Pan Behind. Unkeyed effects aren't read in wave B | Only if an effect key shows a Transform effect: "Door's Transform effect has its own pivot, which this doesn't move" | Count a glow's spread as the layer's edges |
| Precomp layer | Regions from the precomp's frame (its own size), not its contents (R4 isn't read) | "Icon's edges are its precomp's frame, 400 × 400, not the square inside it" | Promise the pivot sits on what's drawn inside |
| Precomp with Collapse Transformations on | Needs R1 to read the switch (B-3). Not a candidate once read | Until read: "I can't check precomps that pass their layers through yet" only if Pan Behind fails for them | Grade it |
| Hidden layer (eye off) | Visibility class *hidden by the learner*: not a candidate unless wanted; never the demo | § 4 | Make it the demo target |
| Matte (eye off by design) | Class *matte*: allowed if named, never the demo; its eye state is compared in the diff | § 4 | Call it hidden, or leave its eye on without a word |
| Guide, shy, null | Per the class (§ 4) | § 4 | Treat shy as not rendering; teach a null's pivot here |
| Parented layer | Comp-space bounds already include the parent. The compensation is in the parent's space, which the check never needs | One sentence naming the parent | Fire FR-037's hand-off (the parent can't change this check); grade raw Position values |
| Layer with children | Children's bounds unchanged (§ 6 item 5) | n/a | Miss a child that moved |
| Scale not 100% (including non-uniform, or a parent's scale) | Place measured in the layer's own space (§ 6 item 1) | n/a | Measure the place in comp pixels |
| Negative scale (flipped) or a static rotation far from 0 | The layer's own left may be the screen's right | Ranked last. If chosen: "Banner is flipped, so I'll go by its own sides: its own left edge is on the right of the screen" | Grade the learner's screen words against the layer's own sides without saying so |
| Rotation already keyed | The rest key (§ 4); check at that time (§ 6 item 3) | Names the rest key | Pass a pivot set mid-turn |
| Scale keyed from 0 (a pop-in) | Rest key is the full-size key | § 7 hint | Check at a frame where the layer is a dot |
| Text layer | Pivot starts on the baseline (where it sits along the baseline depends on justification). Bounds are the letters' box at the check time, within 1 px of the ink, centred or left-justified (L-5). Left-justified, the letters start about 2.45 px right of the pivot, not on it, so the middle of the left edge is never "already there" (it's on the baseline, below the middle, and a hair to the left). Changing justification moves the letters, not the pivot (§ 7). Source Text keys or text animators change the box over time (R6 isn't read) | "Title's pivot starts on its baseline, under the letters, not in their middle" | Call a baseline pivot "the center", or the left end of the baseline "the left edge" |
| Shape layer | Layer anchor only; bounds are the shape as drawn (L-1, Lid). **With a stroke: untested** (Lid has none), so whether the stroke counts in the edges is open (L-6). A group's pivot moved with Pan Behind changes nothing the read holds (L-1) | § 7's "own pivot hasn't changed" hint, as a possibility | Claim the learner moved the group's pivot, or that it's fine (neither can be read) |
| 3D layer | Not a candidate (needs the 3D switch, B-3) | § 4 | Grade a 3D anchor's x and y and ignore z |

## 10. Reads: what wave B gives, and what this design needs beyond it

Wave B plans R1 (layer relations and switches) and R3 (unkeyed anchor, position, scale, rotation,
opacity, and comp-space bounds at the current time) in `layer_info` (data-model › Wave B), plus the
visibility class. Skill 5 also needs these, which **wave B doesn't plan yet** (open item B-2, B-3):

| Need | Why | If it's missing |
|---|---|---|
| **The layer's own rectangle** (left, top, width, height, in its own space) | § 6 item 1 is measured in the layer's own space. Comp-space bounds alone can't give it once the layer is scaled or turned | Can't grade the place on any scaled, rotated or parented-and-scaled layer. **Needed** |
| **The comp's current time** | § 6 item 3; the "before" and "after" must be compared at the same time | The check can't tell the playhead moved. **Needed** (the snapshot doesn't read it today) |
| **Rendered values** (after expressions) for anchor and position | § 9's unkeyed-expression row | The check grades a value nobody sees. Recommended |
| **Bounds and rectangle at a given time**, not only the current one | § 6 items 3 and 4 (rest key, Position key times) | Fall back to asking for the playhead on the rest key, and keep Position-keyed layers out entirely. Recommended |
| **3D switch**, and **Collapse Transformations** on precomp and vector layers | § 4's candidate table | 3D layers and collapsed precomps can't be told apart and would be graded wrongly. **Needed** (small additions to R1) |
| Which bounds: letters for text, including the stroke for shapes | What the learner sees | Ask on L-1 |
| Unkeyed effects by kind (optional) | § 9's Transform effect row | The mentor says nothing about effects without keys. Fine for v1 |

**The demo write tool** (curriculum B7, FR-024): one layer; set Anchor Point to the place's point in
the layer's own rectangle and set Position (or X and Y) to what keeps it still at the current time,
in one undo step; refuse a layer with keys or an expression on Anchor Point or Position, a 3D layer,
or a precomp with Collapse Transformations on. Never keys anything.

## 11. Version notes (After Effects 26.5, macOS 27.0.1)

- **Pan Behind (Y):** long-stable; community answers from 2012 to 2024 describe the same behaviour
  (brief, C). In the Tools panel it's the Pan Behind (Anchor Point) tool. Y is the same on Mac and
  Windows, so the mentor can say it. So can A, P, R and S for showing transform properties, and
  Shift to add one. **At 26.5 (L-3, 2026-10-26):** it moves the pivot of the layer under the cursor
  where the drag starts, not the selected layer's; selecting a layer makes its crosshair show, which
  is why the mentor still says "click it in the timeline" when the crosshair is hard to find. An
  eye-off matte shows no crosshair and can't be dragged. With Position keyed it changes or adds one
  Position key, at the playhead, and leaves the others (L-2).
- **Quick Set Anchor** (nine points, 2D only, Shift+Tab, applies to all selected layers): beta from
  25.1 and still listed as beta at 26.5 (A, the 26.5 announcement). **Never a step, a pass condition,
  a hint or an eval need** (FR-030). **In this build the mentor never brings it up** (spec 011 H-3:
  R0 can't tell a beta build). If the learner asks about it, it answers plainly in one or two
  sentences: it's a beta feature, the lesson uses Pan Behind, and the check works either way. It never
  walks them through it or says they don't have it. If the learner
  uses it anyway, the check reads the result like any method. One difference to know: as of April
  2026 it **rewrites existing Position keys** so the move looks the same, which Pan Behind may not do
  (B5). So "my layer didn't slide with Quick Set Anchor but did with Pan Behind" is a real thing a
  learner on the beta could hit.
- **Center Anchor Point in Layer Content** (Layer > Transform): **confirmed at 26.5** (L-3: on Lid it
  centred the pivot and nothing moved). The mentor may name it by menu path, **for the center place
  only**, when the learner asks for a menu command or is stuck on the center of a text layer. Never
  its shortcut (it needs a Home key, which many Mac keyboards don't have). For any other place,
  Pan Behind.
- **Properties panel** (23.x and later) shows Anchor Point too. "You may also see it there", no more.
- **New shape layers' pivot:** at 26.5, drawn with the Rectangle tool and nothing selected, the
  pivot is at the layer's origin, the comp's center, away from the drawn shape (L-3). Preferences may
  change this, so the mentor still never predicts it; the check reads where it is, and § 7's outside
  hint covers it.
- **Snapping (⌘ while dragging with Pan Behind)** worked on Lid in L-1. Still not taught (§ 8): one
  sitting, one layer; it can come back as a tip after a live lesson shows the drag is fiddly.

## 12. Review (stretch this sprint, P2; design it now so the first build includes review mode)

Plan.md › Wave C: specs 008 to 010 included review mode in the first build, so a later branch doesn't
have to change a merged tool file. Same here.

- **When:** spec 004 FR-019 to FR-021 (1, 3, 7, 14, 30 days; offered, at most one per session; no new
  target means no review, and it stays due).
- **New target:** a default candidate (§ 4) the record doesn't show for this skill on this comp,
  whose pivot isn't already in the place the learner names. Picked by § 4's ranking, so a layer with
  no keys at all comes first, then keys but none on Rotation or Scale (the "pivot first" habit). On
  Mentor Practice 2 with Door and Needle recorded, that's Tab. No candidate, no review.
- **What it asks:** the intent question first, as FR-021 requires: "Here's Lid. Where should it turn
  from?" Then: "Set its pivot there without it moving." **No demo, no walkthrough, no tool named** (not
  Pan Behind, not A and Shift+P). If the layer has Rotation or Scale keys, it still names the rest key,
  because without that the check grades the playhead, not the skill.
- **What passes:** § 6 on that layer.
- **Not a pass:** § 7's hints, which may name Pan Behind (it's a hint after a check, not a
  walkthrough). No reteach. Recorded as a review that didn't pass; "learned" stays. The learner can
  ask for a practice lesson, which may have a demo.
- **"I already know it" (C4):** runs exactly as above.
- **Curriculum § 6's review line** ("with the pivot set first and no jump"): "set first" isn't
  checkable from two reads, so the review checks it through § 6 item 3 instead (a pivot moved after
  rotation keys, away from rest, fails). Open item C-1 asks to align the curriculum wording.

## 13. What the record stores

Spec 004 FR-018's shared fields, nothing more in structure. In plain words in the lesson entry:
- **kind** (first lesson, practice, review) and **targets**: layer, the place named, the comp;
- **attempted:** "Set Needle's pivot to the middle of its bottom edge";
- **summary:** what the checks showed: "first try moved Needle with its pivot; then set it without
  a jump"; "said the bottom edge stays still"; "set while Badge was shrunk at first";
- **next:** one thing ("Key a swing on Needle and play it back", or skill 6 if built).
No pixel numbers the learner never saw, no tool or method, no motive. "First try jumped" is what the
check saw, not a method, so it may be recorded.

## 14. Open items

**For the builder (needs a live AE check at 26.5):**
- **B-1** Second practice comp, wave B targets in their own script (`build-practice-comp-2b.jsx`,
  plan.md › Wave B), names that don't clash with Mentor Practice 2's (Blink, Spinner, Cut, Card, Dot
  1 to 3, Chip A to C, Badge, Flag, Pause). Recommended: **Door** (a solid, about 300 × 500, no keys,
  hinge left edge); **Needle** (a thin solid, about 30 × 400, no keys, hinge bottom middle: the
  per-axis tolerance case); **Banner** (an 800 × 60 shape, no keys: left-middle vs corners);
  **Sign** (a text layer, centered, no keys: the baseline case); **Lid** (a shape whose pivot sits
  outside it); **Gauge** (Rotation keyed 0 → 90, the rest-pose case); **Pop** (Scale keyed 0 → 100,
  the shrunk case); **Sled** (Position keyed, for B5 and its eval); **Hatch** (parented to a null);
  and review targets on two more no-key layers (**Tab**, **Peg**).
- **B-2** The reads in § 10: the layer's own rectangle; current time; rendered values; bounds and
  rectangle at a given time; which bounds for text and shapes. **Recommended: add all five to R3 in
  the wave B shared pass**, since they're one `sourceRectAtTime` plus `toComp` call per layer and the
  time argument covers § 6 items 3 and 4 without asking the learner to move the playhead.
- **B-3** Add the 3D switch and Collapse Transformations to R1. **Recommended: yes**, both are one
  property read.
*Answered 2026-10-26 by the live sitting: B-1 (built), B-4 (L-3, § 11), B-5 (L-2, D-4 in § 16),
B-6 (Mentor Practice 2 is comp 179, 40 layers), L-1 (passed). Kept below for the record.*
- **B-4** At 26.5 on the Mac: Pan Behind selection behaviour (does a click on another layer switch
  to it?); whether a selected eye-off layer (a matte) shows its crosshair; the snapping modifier;
  Layer > Transform > Center Anchor Point in Layer Content; where a new shape layer's pivot lands.
- **B-5** (curriculum B5, the big one): **does Pan Behind rewrite existing Position keys, or only the
  value at the current time?** Also with a single Position key and the playhead off it (does it add a
  second key?). Decides whether § 4's line is a tip or a rule, § 7's hint wording, and whether
  Position-keyed layers can ever be default candidates. **Recommended until answered:** keep them out
  of the default focus, as written.
- **B-6** What the builder's `.aep` holds today (§ 4's Mentor Practice note is from the build script).
- **L-1** Shape layers: with the layer (not a group) selected, does Pan Behind move the layer's
  Transform anchor, and does the bounds read match the visible shape, stroke included? Until it
  passes, shape layers aren't default candidates (§ 4).
- **B-7** A rotated preview frame without a lasting change (§ 4, demo). **Recommended: don't build
  it.** The learner's own "try it" (stage 6) shows the swing better, and the mentor's write stays one
  change.
- **L-6 (new, 2026-10-26, not a blocker)** A stroked shape: does `rect` include the stroke, so the
  edges the check uses are the edges the learner sees? Lid has no stroke (§ 9). Banner or a copy of
  Lid with a stroke, one capture.
- **L-7 (new, optional, information only)** With every Position key selected, does Pan Behind shift
  them all and keep the layer still at every key time? If yes, log it; D-4 is revisited for a later
  release, not this one (§ 16).

**For the spec writer (S):**
- **S-1** § 6 items 3 to 5 (rest key, Position key times, nothing else moved) aren't in FR-028. They're
  my additions: without item 3 a pivot set on a shrunk pop-in passes and the move is wrong; without
  item 5 Pan Behind grabbing the wrong layer passes. **Recommended:** add them, reusing FR-028's
  1-pixel measure, and set the rest key rule's tie-break (Scale first is my default).
- **S-2** FR-028 says "the layer's width" without saying in which space. **Recommended:** the layer's
  own space (its own rectangle), so scale, rotation and parents don't change the places.
- **S-3** Tiny layers: 10% of a 10 px line is 1 px, which a drag can't hit without snapping.
  **Recommended:** a floor of 3 px per axis (`max(10% of that axis, 3 px)`). Guess; tune on a live run.
  Also off-grid places: **recommended** "the nearest of the nine for this lesson" (§ 4), not a new
  measure.
- **S-4** The understanding check (stage 5) is recorded and doesn't gate the pass, as in spec 008's
  reading step. Please carry it as a step, not a pass condition.

**For the eval engineer (E):** a typed Anchor Point value (the layer jumped) must not pass and gets
the "moved with it" hint; a pivot in the neighbouring place on an 800 × 60 bar fails; a correct
Pan Behind on a Scale-200% layer passes (layer-space measure); Pan Behind on Background instead of
the focus gets the "start the drag on its crosshair" hint, never "select it first" (L-3); Sled named
gets § 4's leave-out sentence and another layer, never a lesson it can't pass (D-4); a learner who asks for Quick Set Anchor at 26.5 isn't
walked through it (the version trap case FR-030 asks for); a matte named as the target is never
called hidden; a review never names Pan Behind before "done"; a learner who says "turn from the
middle" on a text layer is told the pivot is on the baseline, not that it's already there.

**For the human (H):**
- **H-1** Is a lesson this short worth a whole skill (curriculum H6)? With the rest key and the
  understanding check it's about 5 to 10 minutes. **Recommended:** keep it separate, as the
  curriculum decided; the live run says whether it feels thin.
- **H-2** The mentor suggests a hinge when the learner has none in mind ("Door could swing from its
  left edge"). That's a light guess at their intent. **Recommended:** keep it, as skill 1 does with a
  practice blink; the learner can always name another place.

**For me (curriculum, follow-ups in `curriculum.md`, not edited in this round):**
- **C-1** Align § 6 skill 5's review line with § 12 here (checked through the rest key, not "set
  first").
- **C-2** § 8's row for skill 5 says "Position or Rotation expressions may ignore the new pivot". A
  Rotation expression still turns around the anchor; the trouble is not knowing the rest pose. Fix
  the wording.
- **C-3 (2026-10-26)** Re-pivoting a layer that already moves isn't taught anywhere in the path
  (D-4). Candidates for later: a tip in skill 5's review once L-7 is known, or a "fix the pivot on
  finished work" lesson after skill 6. Not added this sprint.
- **C-4 (2026-10-26, § 17)** Curriculum § 2's stage 3 says only "If the focus has only one target,
  there's no demo". Add the watch offer as the shared rule for every skill (once, one sentence, on
  another target, first lessons only, never in a review), if the human agrees to carry it to skills
  2 to 4.

**For the builder (2026-10-26, § 17):**
- **B-8** The watch offer needs, from the first `anchor_snapshot` with the focus, the next default
  candidate that would qualify as the demo target (and its suggested place), or nothing when none
  does. Today `proposal` is one layer and `candidates` carries buckets; if the ranked order and the
  demo test aren't already there, add them rather than have the mentor rank by hand.
- **B-9 (2026-10-26, § 18 D-8)** The leave-out for a layer that already moves needs to tell the
  mentor which of the two cases it is (two or more Position key times, or one key time off the rest
  key), and for the second, both times (the Position key's and the rest key's, the learner's
  `rest_time` when they named one). Today both return `position_moves` with no times. The builder
  names the field or reason; the mentor must never count keys itself.

**Guesses:** how common the "set it while shrunk or turned" mistake is (L-4 shows it's easy to do,
not how often); how often learners drag a group's pivot (L-1 shows it happens in one drag); the 3 px
floor; ranking unparented layers first; the off-grid rule; the accidental Anchor
Point stopwatch as a mistake; how often a learner names a one-key layer whose rest key is on
another frame (§ 18 D-8); whether a watch on the focus layer's parent or child confuses (§ 18 D-9).

**Curriculum B items this skill settles:** B1 (skill 5's targets, B-1 above); B5 (answered by L-2:
"set the pivot before you key" is a rule for layers that already move, § 16); B7 (anchor with
compensation, § 10).

## 15. Answers to the spec writer, round 1 (2026-10-23)

| Q | Answer | Spec default |
|---|---|---|
| D-1 Rotation-only layer with no key at 0 | **Agreed:** the key closest to 0 (or a whole turn), said in one sentence, then "is that how it looks at rest?" (§ 4) | Kept |
| D-2 Locked layers | **Agreed:** never proposed, never the demo, allowed if named, with one sentence asking them to unlock it (§ 4 table). Pan Behind can't move a locked layer, so if it's still locked at "done", the hint names the lock | Kept |
| D-3 "Still where AE put it" | **Agreed, widened slightly:** the center of the layer's own rectangle, **or** the layer's own origin (0, 0). That covers text and also new shape layers, which start at their origin. It's only a tie-break (§ 4) | **Changed** (origin counts for any layer type, not only text) |
| S-1 to S-4 taken | Confirmed, as recommended in § 14 | Kept |
| H-3 Never mention Quick Set Anchor in this build | **Agreed; nothing I need is lost.** One condition: "never mention" means the mentor never **brings it up**. If the learner asks, it answers plainly (a beta feature, the lesson uses Pan Behind, the check works either way) and doesn't refuse or walk them through it. The FR-030 version-trap eval should be that case (§ 11) | Kept, with that condition |

## 16. Answers to the spec writer, round 2 (2026-10-26, after the live sitting)

### D-4: a layer with two or more Position keys

**Answer: accept, with three adjustments.** A layer with Position keys at two or more times is **not
a candidate**. A layer with one Position key stays allowed if named, with the playhead on that key.

Why: the lesson's one idea is "move the pivot with Pan Behind and the layer stays put". On a layer
that already moves, L-2 shows Pan Behind can't do that at 26.5: it changes or adds one key at the
playhead and the layer slides at every other key. Teaching it there would mean a second idea
(shifting every Position key by the right amount), which § 8 already leaves out, and a lesson that
can't end in a pass breaks "you do": the learner's last try fails because of what AE does, not what
they did, and the record would say so. The thing worth learning from Sled is the habit, "set the
pivot before you key", and one sentence teaches that.

**Adjustments to the spec's proposal:**
1. **Count key times, not keys:** X and Y Position counted together when separated (one key on X at
   1 s and one on Y at 2 s is two times), hold keys included.
2. **The one-key exception needs the key on the check time.** If the layer also has Rotation or
   Scale keys and the rest key isn't on the Position key's frame, the learner can't satisfy both, so
   it's treated like the two-or-more row. Otherwise the mentor names the key's time and asks for the
   playhead right on it (§ 4), and § 7's slid hint covers a drag off it (L-2's `sled-one-key`: AE
   adds a key at the playhead).
3. **Wording.** The spec's sentence says Sled "would jump at its other keys". It slides (the path
   shifts and it eases into the wrong place), it doesn't jump, and "jump" is the word § 7 uses for
   a typed Anchor Point. Mine (§ 4): "Sled already moves, so moving its pivot now would shift where
   it sits at its other keys. Set the pivot before you key. Pick a layer that doesn't move yet?"
   Said once, then the next candidate is offered as usual.

**Rejected:**
- *Keep Sled allowed and say up front it can't pass.* Teaches the trap but leaves a lesson with no
  pass, a record of a fail that isn't the learner's, and a mentor that knowingly sets a task it
  can't check as done.
- *Teach shifting every Position key* (select all of Position's keys, then move the layer back by
  the pivot's change). A second idea in one sitting, hard to do exactly by hand, and § 8 leaves it
  out.
- *Pan Behind with every Position key selected* (the spec's untested third). A guess. Logged as
  L-7, information only. Even if it works, it changes a learner's finished animation in one drag, so
  it'd come in later as a tip (C-3), not in this release.
- *Parent the layer to a null at the hinge* (skill 6). That turns the layer around a **fixed point
  in the comp**, which is right for a group or a still layer, but a layer that slides moves away
  from the null, so the hinge drifts off the layer. It isn't a re-pivot for Sled. It belongs in
  skill 6 for what skill 6 teaches (a still group), and skill 6 doesn't need a change for D-4.
- *Quick Set Anchor*, which rewrites existing keys (April 2026 notes, § 11): beta, never brought up
  in this build (H-3, FR-030).

**Consequences:**
- **Spec:** FR-004 moves "Position keyed (any count, including one)" to two rows: two or more
  Position key times under **Never** (with § 4's sentence); one key time under **Allowed if named**,
  only when it's on the check time. FR-012 item 4 stays (it catches a drag off the one key). Rows
  5 and 6 follow the § 9 rows. US2 #4 becomes "the learner names Sled; the mentor gives § 4's
  sentence once and offers another layer". A new reason code for the leave-out (the builder names
  it). Out of scope: "re-pivoting a layer that already moves". The answer key: Sled not a
  candidate; `sled-slid` and `sled-on-key` become checks the lesson never reaches (keep them as
  unit tests for item 4); `sled-one-key` is the one-key fail case.
- **Skill:** `SKILL.md`'s leave-out line for Sled, the one-key playhead line, and § 7's slid hint
  for the one-key case only. The demo is unchanged (it already refuses Position keys); the review is
  unchanged (default candidates only).
- **Evals:** case 13 becomes "Sled named: the sentence once, no lesson on it, another layer offered,
  never 'jump'". Optional extra: a one-key layer with the playhead off the key fails with the slid
  hint and Edit > Undo.

### The wording list (spec › Open questions D, items 1 to 7)

| # | Item | Answer | Where |
|---|---|---|---|
| 1 | Ranking: a "no keys at all" step | **Confirmed.** Written as three steps, any keyed property counts, ranks never filter; § 12's review follows it | § 4, § 12 |
| 2 | Drop "until L-1" | **Confirmed**, in the candidate table and the demo rule. D-3's origin note keeps, with L-3's finding that a new shape's origin is the comp's center | § 4 |
| 3 | The group row | **Rewritten** (below). The check sees no change at all. Plus a separate "what's drawn moved, the pivot didn't" row for `content_shifted`, with a text and a shape wording | § 7, § 9 |
| 4 | Pivot outside: where to look | **Confirmed, reworded** (below): the side, "click Lid in the timeline", and start the drag there. No side read: "outside the lid" with no guess | § 7 |
| 5 | Pop at Scale 0 | **Confirmed, reworded** (below). Also: "it wouldn't let me drag" on a keyed layer gets a check, never agreement | § 4, § 7 |
| 6 | "Select it first" | **Confirmed wrong; rewritten** (below). Selecting only shows the crosshair; the fix is where the drag starts. The another-layer-moved row also changed: a layer that moved on screen wasn't Pan Behind, so the fix there is Edit > Undo, not where to drag | § 7, § 11 |
| 7 | § 9 facts | **All taken:** stroke untested (new L-6); left-justified letters start about 2.45 px right of the pivot, so the left-edge middle is never "already there"; Center Anchor Point confirmed, menu path for the center only; the slid row now covers only the one-key case (D-4) | § 7, § 9, § 11 |

**Wording that differs from the spec's proposal:**
- **Item 3, group:** spec: "Lid's own pivot, under Transform, hasn't changed. If you dragged a pivot
  inside Contents, that one belongs to the shape's group: select Lid itself in the timeline and drag
  its crosshair." Mine: "Lid's own pivot hasn't changed. If you dragged a pivot while something under
  Contents was selected, that one belongs to a group inside Lid, not Lid itself. Click Lid's name in
  the timeline, then drag its crosshair." (Drops "under Transform"; says what the learner would have
  done, selecting under Contents, which is the step that causes it.)
- **Item 3, content shifted (new):** text: "Sign's letters moved, but its pivot didn't: changing how
  text lines up moves the letters, not the pivot. Edit > Undo that, and move only the pivot, with
  Pan Behind (Y)." Shape or other: "Lid's shape moved inside the layer, but its pivot didn't, so Lid
  shifted on screen. Edit > Undo that, and move only the pivot, with Pan Behind (Y)."
- **Item 4, outside:** spec: "select Lid in the timeline; its crosshair is below the lid". Mine:
  "Lid's pivot sits outside the lid, below it, which is why it would swing wide. Click Lid in the
  timeline and its crosshair shows up below the shape; start your drag there."
- **Item 5, Pop:** spec: "Pop is still shrunk at 3.3 s, so nothing showed, but its pivot did move,
  far below it. Edit > Undo, put the playhead on 4.3 s, where it's full size, and set the pivot
  there." Mine: "Pop is shrunk to nothing at 3.3 s, so the drag looked like it did nothing, but it
  did move Pop's pivot, far below it. Edit > Undo first, then put the playhead on 4.3 s, where Pop is
  full size, and set the pivot there." (Meets the learner's "it wouldn't let me drag"; "first" makes
  the order plain. "Below" is the tool's side, not fixed text.)
- **Item 6, wrong layer:** spec: "start the drag on Needle's own crosshair". Mine: "Needle's pivot
  hasn't moved, but Background's did. Pan Behind moves the pivot of whatever layer is under the
  cursor when you start dragging, even if Needle is selected. Edit > Undo, then start the drag right
  on Needle's crosshair." (Says why, once, so the learner doesn't keep re-selecting.)
- **Item 6, another layer moved:** "Needle looks good, but Background moved too, down and to the
  right. Edit > Undo until Background is back, then check Needle's pivot is still where you put it."
- **Item 7, slid at a key (one-key only):** "Sled stays put at 0 s, but at 3.7 s it now sits to the
  right of where it was. Pan Behind changed Position only where the playhead was, and added a key
  there. Edit > Undo, put the playhead right on Sled's key at 3.7 s, and drag again."
- **D-4 sentence:** "would make it jump" becomes "would shift where it sits".

Times in these lines are Mentor Practice 2's at 30 fps, written the way `SKILL.md` writes times;
the mentor uses the read's own times on another comp.

## 17. The watch offer with one focus layer (decided 2026-10-26, after T236)

**Question.** With one focus layer there's no demo on it. § 4 said the mentor "can offer" a second
candidate; `SKILL.md` read that as "only if they'd like to watch one first", which in practice means
"only if they ask". In T236 (`discovery/usage-notes/anchor.md`, session 1, problem 2) the mentor never
offered, the lesson went straight to "try it", and the builder said they'd have taken a watch. A
first-timer doesn't know a watch exists, so can't ask for it.

**Decision: "can offer" becomes "offers", once, in one sentence.** The rule and its conditions are in
§ 4 (The watch offer). Wording:

> "I could show you on Needle first, if you like."

The layer is whatever the read gives as the next qualifying candidate; Needle is Mentor Practice 2's
with Door as the focus. (The usage note's example said Tab, which is the review's pick with Door and
Needle recorded, not the next candidate after Door.)

**Why.**
- **Restraint is about doing, not offering.** "At most one demo, on its own target only" still holds:
  the offer runs nothing, the watch is on a layer the learner cares less about, and Door stays
  entirely theirs. Curriculum § 2's "only when asked" is kept, because the yes *is* the ask; the
  offer only makes asking possible for someone who doesn't know they can.
- **Easing already does this.** `/ease-mentor` step 6: "Offer a layer with more pairs if they'd rather
  watch a demo first", and easing case 21 has seen that offer in every run since 2026-10-06 without
  breaking R-LEARNER-DOES. Skill 5's "can offer" was meant to follow easing; the skill drifted.
- **Evidence it's wanted:** T236's builder would have taken it (R, builder-only). Interview 004's
  "I would rather see a mouse on a screen moving" (R) says the same about watching first. How many
  target-market learners take it is a guess; the usage notes should count yeses.
- **Placement:** last sentence of the invite turn, after the walk-through. Earlier (stage 1 or 2) it
  comes before they know what Pan Behind is; later (after a failed check) it's a rescue, and the
  hints already do that job without taking the attempt away.

**Rejected.**
- *Keep "only if they ask"* (the build as is). A choice the learner can't see isn't a choice; T236
  showed the path skips it even for someone who knows it's there.
- *Always demo on a second layer with one focus* (no offer, just do it). Spends the demo every lesson,
  lengthens the shortest lesson in the path (H-1) for learners who don't want it, and undercuts "only
  when asked".
- *Offer again after a failed check.* Two offers in a short lesson is pressure, and after a fail it
  reads as "let me do it". The hints name what's off; a learner who wants the watch can ask.
- *Offer in reviews or after a pass.* Reviews have no demo by design (§ 12); a learner who has passed
  has shown they don't need the watch, and a practice lesson after a pass is for their hands.
- *Name the place in the offer* ("on Needle, turning from its bottom edge"). One more clause for a
  learner deciding yes or no; the place comes in one sentence on a yes.

**What changes elsewhere** (owners' files, not edited here): `SKILL.md` moves the offer from step 5
(which runs only on an ask) to the end of step 4; spec FR-008 and US1 #5; a new eval case; curriculum
follow-up C-4; builder item B-8.

## 18. Answers to the spec writer, round 3 (2026-10-26)

### D-8: the "already moves" sentence on a one-key layer

**Answer: a second sentence, about the two frames.** The spec writer is right that § 4's Sled line
reads wrong on a one-key layer: there are no "other keys" on Position, and what actually conflicts
is two frames, the Position key's and the rest key's. Pan Behind can only set the pivot on one of
them. Set it on the rest key and AE adds a second Position key there (L-2), so the layer sits wrong
at the first key and now drifts between the two. Set it on the Position key and the compensation is
worked out for the turned or shrunk pose, so the layer sits wrong at rest (L-4's pattern). Either way
it shifts on one of the frames, so it's still a leave-out; only the sentence changes.

**The sentence** (times from the read, written the way `SKILL.md` writes times):

> "Sled's Position key is at 1 s, but it's at rest at 3 s, so moving its pivot now would shift where
> it sits on one of those two frames. Set the pivot before you key. Pick another layer?"

**When each is used:**

| The layer | Sentence |
|---|---|
| Position keyed at **two or more** times (X and Y together, hold keys too) | § 4's Sled line, unchanged: "Sled already moves, so moving its pivot now would shift where it sits at its other keys. Set the pivot before you key. Pick a layer that doesn't move yet?" |
| Position keyed at **one** time, rest key (the tool's, or the learner's own `rest_time`) more than half a frame away | The two-frames sentence above. "At rest" is the rest key's time; when the learner named the rest pose, it's their time, which they'll recognize |
| Position keyed at one time, on the check time | Not a leave-out: § 4's "playhead right on it" line |

Both leave-out sentences are said once, when the learner names that layer, and then the next
candidate is offered as usual (§ 16 D-4, adjustment 3). In the opening, with no layer named, a
one-key layer is just one of the layers that already move, under whatever D-7's general sentence
becomes; the two-frames sentence is only for a learner who names it.

**Rejected:**
- *The spec writer's draft*, "so I can't set its pivot without it shifting at one of them". Right
  idea, and the two frames are kept from it. But "I can't set" makes it the mentor's limit and
  implies the mentor would be the one setting it; the learner does the setting, and the limit is how
  Pan Behind writes Position. Mine keeps the Sled line's shape ("moving its pivot now would shift
  where it sits") so the two read as one rule, and keeps "Set the pivot before you key", the habit
  this case teaches too.
- *One sentence for both*, e.g. "would shift where it sits at another frame". Vaguer for the common
  case (two or more keys), where "its other keys" is what the learner sees in the timeline.
- *Leave the D-4 line as is.* "Its other keys" points at Position, which has one key, so a learner
  who looks finds nothing to match, and the sentence loses them.
- *Make the case passable*: ask the learner to move the Position key onto the rest key first. That
  edits their animation, a second idea in a one-idea lesson, and § 8 leaves re-pivoting animated
  work out (C-3).
- *Keep "Pick a layer that doesn't move yet?" as the ending.* A one-key layer whose only Rotation or
  Scale key holds still may not move on screen at all, and the next candidate offered may well move
  (Gauge does). "Pick another layer?" is true in every case. (The Sled line keeps its ending: there
  the layer does move.)

**Evidence:** none from a learner; Mentor Practice 2 has no one-key layer (spec FR-004), and L-2's
`sled-one-key-before` has no Rotation or Scale keys. The mechanics are L-2 and L-4. How often a
learner names such a layer is a guess (rare: it needs a single Position key plus Rotation or Scale
keys off that frame).

### D-9: which layer the watch is on

**Answer: the spec's reading is confirmed, with one clarification.** "Would qualify as the demo
target" means all of:
1. A **default candidate** (§ 4's table), other than the focus layer, ranked by § 4's lesson
   ranking. (As the spec reads it.)
2. **Not already at its suggested place** (§ 4, "The pivot is already there"): the demo would set no
   target. (As the spec reads it.)
3. **With Rotation or Scale keys, only when its rest key is within half a frame of the focus layer's
   check time** (as the spec reads it). The check time is the current one: if the learner named
   their own rest pose (`rest_time`), that's the time used. Reason, beyond "the demo would refuse":
   a watch that asks the learner to move the playhead somewhere else, then back for their own
   layer, puts a second time into the shortest lesson in the path for a first-timer.
4. **Clarification: never a full-frame layer.** § 4's table says a background is "last resort
   only", meaning proposed only when nothing else exists, so it isn't in the pool a watch is chosen
   from. A watch on the background is also the one layer § 7's wrong-layer hint teaches them not
   to move. This applies when the read says the layer is full-frame (`full_frame` true); when that's
   unknown (`null`, before SR-2), no extra filter, since it ranks last by area anyway and the read
   is never assumed.

**What this changes in the build:** only item 4, and only if `watch_offer` doesn't already leave
out `full_frame: true` layers (the spec's "default candidate" puts full-frame under "allowed if
named", so the builder may already have it). One unit test: a comp whose only other candidate is
full-frame returns `watch_offer: null`. Spec FR-008's answer key on Mentor Practice 2 is unchanged
(Door → Needle, `bottom-middle`; Pop → Door, `middle-left`; two layers or a review → null).

**Rejected:**
- *Any default candidate, keyed or not, and ask for the playhead on its rest key on a yes.* Two
  playhead times in one short first lesson, for a watch that's meant to make the idea plain.
- *No Rotation- or Scale-keyed layers at all.* Simpler, but on a comp where every other layer turns
  or scales it removes the offer even when the rest keys line up, and the demo handles that case.
- *Also leave out the focus layer's parent or children.* A guess with no case behind it: a demo on
  a parent moves its pivot, not its motion, so the child stays put. Logged under § 14's guesses,
  not a rule: if live lessons show a watch on the focus layer's parent or child confuses, leave
  those out of `watch_offer` then.

## 19. The opening turn (2026-10-26, from HO-1's smoke run)

**Status: proposed, not decided.** Waiting for the human's approval. Until then § 4 and § 5 stand
as written, and nothing below is for the builder or the spec writer to act on.

**Question.** In eval cases 13 and 24b (`evals-skill-5`, README rows 6 to 8), the mentor's first
turn held a memory recap, "the idea for today" (§ 1's idea, in bold), a bulleted list of three
leave-outs (already moving, Anchor Point keyed, Collapse Transformations), the intent question and,
in 13, the Door proposal. The judge failed 13 on R-ONE-IDEA: "packs a memory recap, the pivot
concept, the intent question, a Door proposal and a three-bullet list of exclusions". The eval
engineer is right that this is the design's, not the mentor's: § 5 stage 1 says "Says what's left
out and why", D-7's general sentence added another leave-out line, and nothing said where the idea
is *not* stated.

**Answer: the opening carries one decision, which layer and where, and nothing else.** No
leave-out list, no statement of the idea, and a memory clause only when it changes what happens in
this lesson.

### What the opening turn carries, in order

| # | Part | When | Length |
|---|---|---|---|
| 1 | **Memory clause** | Only when this skill has history (practicing: what `next` said was still off) or a lesson is continued or resumed. **Not** for a first lesson on this skill, whatever other skills the record holds: this skill's only hard prerequisite is setting keyframes, which isn't a skill (§ 3), so "you eased Title two weeks ago, and this doesn't depend on it" tells the learner nothing they can use | One clause, in plain words, with how long ago |
| 2 | **The intent question** | Always (§ 4: it comes first) | One sentence, two parts |
| 3 | **The proposal**, as the fallback to the same question | When `proposal` isn't null and the lesson isn't continued | One sentence, ending on the offer |

The turn ends on the learner's choice. That's the one idea: pick a layer and a hinge. The proposal
isn't a second idea; it's the same question answered for someone with nothing in mind, and saying it
now saves the first-timer a turn (T236 and T237 both opened this way and passed live).

**The exact wording** (Mentor Practice 2, from the read):

- **First lesson on this skill:**
  > "Which layer do you want to turn or grow from somewhere other than its middle, and where should
  > it turn from: a corner, an edge, or the middle? If nothing comes to mind, Door could swing from
  > its left edge. Want to try that one?"
- **Practicing** (the clause from `next`, then the same turn):
  > "Last time, Pop's pivot went in while Pop was still shrunk. Which layer do you want to turn or
  > grow from somewhere other than its middle, and where should it turn from? Or Needle could
  > swing from the middle of its bottom edge. Want to try that one?"

  (If `next` names a layer, that layer is the proposal; otherwise the read's.)
- **Continued or resumed lesson:** no intent question and no proposal; say where it left off in one
  sentence and hand it back ("We were on Door, from the middle of its left edge. Ready to set it?").
- **No candidate at all** (`proposal` null, nothing can be named): one clause of why, then the solid
  (§ 4): "Nothing in this comp is a clean first pivot, so let's make one: Layer > New > Solid, a
  small rectangle. Tell me when it's there." Not a list of reasons.
- **Review:** unchanged (§ 12); its opening is already one question.

### What moves out of the opening, and where it goes

- **"The idea for today" is dropped from the opening.** § 1's idea and its two sentences belong to
  stage 2, with a frame from their comp and their layer named, where they mean something (§ 5). The
  intent question already names the topic in the learner's terms ("turn or grow from somewhere other
  than its middle"), which is all they need to answer it. Stated before a layer is chosen, the idea is
  a lecture, and stage 2 then says it a second time.
- **Leave-outs wait until the learner names that layer.** Every leave-out in § 4's table already has
  its own sentence for a learner who names it (§ 4, § 16 D-4, § 18 D-8). In the opening they're said
  about nothing the learner has chosen. This includes D-7's general "Sled and Card already move"
  sentence: **D-7 is withdrawn from the opening** (see "For the spec writer" below).
- **Where the general sentence still has a use:** if the learner asks which layers they *can* use, or
  why a layer wasn't suggested, answer that question: name up to three default candidates, and give
  the asked-about layer its own § 4 sentence. D-7's two-layer sentence is kept only for a learner who
  asks about several animated layers at once.

### Why leave-outs are up front in skills 2 to 4 but not here

Speed graph, key types and offset open with their leave-out sentences, and passed live. The
difference is who picks the focus. There, the mentor proposes the focus **from a scan of the
comp**, so a layer it skipped without a word would read as "that one's fine" (a hidden layer, a
precomp it can't see inside); the leave-out sentence is about honesty, not teaching. Here the
question is open: the learner can name any layer, and the one proposal is a suggestion, not a
verdict on the rest of the comp. Saying nothing about Wobble claims nothing about Wobble, and if they
name it they get its sentence. Skill 5's leave-out list also grew after the live lessons: T236 and
T237 had two leave-outs (Wobble, Seal); Phase 8c's `position_moves` added 16 on Mentor Practice 2,
which is what turned two sentences into a bulleted list.

### Cost, said plainly

On a learner's own finished comp, most layers may already move, so the first layer they name may be
a leave-out. That's one extra turn: they name it, hear the "set the pivot before you key" sentence
about **their** layer, and pick again (the proposal follows that sentence, as now). I think that's
the better place for that habit anyway: said about a layer they care about, at the moment it
applies, rather than as a line in a list before they've chosen anything. How often it happens on real
comps is a guess (below).

### What R-ONE-IDEA should see (the eval engineer's to change; this is only the intent)

- **The design means the opening to pass R-ONE-IDEA as written**, not to be judged more loosely.
  Asking for a looser opening would hide exactly what failed.
- For the judge, the intended reading of "one idea" in the opening: **the intent question plus a
  one-sentence proposal as its fallback is one idea** (one choice for the learner), and a memory
  clause of this skill's history is context, not an idea. A statement of the pivot idea, a
  leave-out list, or a turn that ends on anything but the choice is a second idea.
- R-ONE-IDEA was removed from cases 13 and 24 (README row 8: "one reason per case"). If § 19 is
  approved, the design would like it back on one opening case (case 1, first lesson, no layer in
  mind, is the natural one), so the opening is judged somewhere.

### Rejected

- *The eval engineer's smallest fix: at most the leave-outs that matter, in one sentence, and don't
  restate the idea.* Close, and it would likely pass the judge. But "the ones that matter" is a call
  the mentor can't make before it knows the learner's layer, so it would either list the biggest
  group (16 "already moves" layers, two named) or guess. And one leave-out sentence is still a second
  subject in a turn whose job is a choice. Its "don't restate the idea" half is kept.
- *Keep D-7's one general sentence for layers that already move, drop the rest.* The best of the
  leave-outs to keep, because "set the pivot before you key" is a habit worth teaching. Rejected
  because it teaches that habit before the learner has a layer, and because the named-layer
  sentence (§ 4, § 18) teaches it better when it's needed.
- *Split the turn: intent question alone, proposal only after "I don't know".* Cleanest for the
  judge, but costs every first-timer a turn for nothing; § 4's two forms were always meant as one
  turn's either/or, and the live openings that did this passed.
- *State the idea first, then ask.* What easing does with its first frame, but there the frame comes
  with it. Here there's no layer yet to show it on, and stage 2 says it again with one.
- *A recap of other skills for a first lesson* (what 13 and 24b did). Memory is worth showing when it
  changes the lesson (this skill's `next`, a review); "this doesn't depend on that" is the record
  talking, not the mentor teaching. Key types and offset mention easing because it's their
  prerequisite; this skill has none in the record.
- *Leave § 5 as is and let the judge pass it.* The judge was right: the turn was a wall, and it ended
  on a list.

### Evidence and guesses

- **R:** case 13, run 8 (`results/2026-10-26-211156.json`): judge's R-ONE-IDEA fail, quoted above;
  every deterministic check passed. Case 24b (`results/2026-10-26-211046.json`, turn 1): the same
  shape, with "The idea for today", a three-bullet leave-out list, and the recap "this lesson doesn't
  depend on any of that". T236 and T237 (`discovery/usage-notes/anchor.md` on `skill-5-anchor`):
  intent question, proposal and two leave-out sentences in one opening, passed live, before Phase
  8c's 16 `position_moves` layers. Skills 2 to 4 `SKILL.md` step 1 on `main`: leave-outs up front,
  with the mentor proposing from a scan.
- **Guess:** that a first-timer can answer the intent question without the idea stated first (its
  words carry the topic; no learner has tried it this way). Watch the next live lesson for "what do
  you mean by turn from?".
- **Guess:** how often a learner on their own comp names a layer that already moves first. If live
  lessons show it's most first answers, revisit: one clause before the question ("most of this comp
  already moves, so pick one that doesn't yet") would be the next thing to try.
- **Guess (H-2, already open):** whether the proposal in the same turn pulls a learner away from
  their own layer. T236 and T237 are builder-only.

### Items, if approved

**For the builder:**
- **B-10 (2026-10-26, § 19)** `SKILL.md` step 1 (on `skill-5-anchor`): the opening is the memory
  clause (only as in the table above), the intent question, and the proposal, ending on the offer.
  Move "Say what you're leaving out" out of the opening: each leave-out sentence is said when the
  learner names that layer (step 2's `focus_problems` already carries this for `position_moves`; the
  others need the same "when named" wording). Drop the "In the opening, that's the only wording for
  layers that already move" line and D-7's sentence from the opening; keep it only for a learner who
  asks about several moving layers. Add to step 1: "Don't state the lesson's idea here; it comes in
  step 2, with the frame." Step 0: "Mention only the earlier work" becomes "mention this skill's
  earlier work only (`next`), in one clause; for a first lesson, say nothing about other skills". No
  tool change: the snapshot still returns `candidates` with buckets, which step 2 and the
  "which can I use?" answer need.

**For the spec writer:**
- **S-5 (2026-10-26, § 19)** US1 #1 ("names what it leaves out in one sentence per reason")
  becomes: asks the intent question, offers the proposal in one sentence, and names no leave-outs
  until the learner names one; the turn ends on the choice. Eval plan item 1 ("leave-outs named once
  each") changes the same way, and a leave-out's sentence is checked on the turn the layer is named.
  FR-009 stands ("once, in plain words") with "when the learner names that layer" added for the
  leave-out sentences. **D-7 closes as withdrawn from the opening**, kept only for a learner who asks
  about several moving layers. Quickstart § 5.1's step 1 expected result (leave-outs said in the
  opening) changes to match.

**For the eval engineer (through the cockpit):** cases that look for a leave-out sentence in turn 1
move that check to the turn the layer is named; case 1 (or whichever is the plain first-lesson
opening) gets R-ONE-IDEA back, with the reading above in its case note.

**For me (curriculum follow-up, not edited here):**
- **C-5 (2026-10-26, § 19)** A shared opening rule for curriculum § 2's stage 1: "the opening is one
  choice for the learner; the idea comes with the first frame; leave-outs are said up front only when
  the mentor proposes the focus from a scan (honesty), otherwise when the learner names that layer".
  Skills 2 to 4 already fit it. Skill 6 (null) should be checked against it before its live lesson.
