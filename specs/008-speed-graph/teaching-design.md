# Teaching design: Shape the ease in the speed graph (curriculum skill 2)

**Owner:** curriculum designer (`decisions/007`). The spec writer's `spec.md` in this folder links
here and doesn't copy it. Gaps or contradictions come back as questions.
**Date:** 2026-10-20. **Status:** draft, round 1 answered (§ 14).
**Builds on:** `specs/004-ae-curriculum/curriculum.md` § 2 (the lesson shape), § 6 skill 2, § 8,
§ 9, § 13; spec 004 (approved), above all FR-004, FR-005, FR-018 to FR-022, FR-024 to FR-026,
FR-030, FR-037. Research: `discovery/curriculum-research/graph-editor.md`. Evidence:
`discovery/usage-notes/adobe-assistant-2026-10-08.md`. Lesson shape:
`.claude/skills/ease-mentor/SKILL.md`.
**Suggested record ID:** `easing.speed_graph` (the skill builder names it).

Tags: **A** Adobe, **B** established teaching, **C** one tutorial or thread, **R** repo evidence,
**Guess** a design call with no evidence (also listed under open items).

## 1. The one idea, and why

**Idea:** Easy Ease is a starting shape. Influence sets how long an ease lasts, so a soft landing is
a long ease into the last key, and a quick start is a short ease out of the first.

**Why a learner needs it:** after easing, motion stops looking robotic but every move has the same
generic feel. "Easy Ease is only a starting point" (Adobe's assistant, R).

**What Adobe's assistant can't do today:**
- **Depth.** On 2026-10-08 it taught this exact shape (15% out, 80% in) and then couldn't check it:
  "my checks couldn't tell eased from linear, so those are unconfirmed" (R). Knack reads in and out
  influence and speed on every key, so it checks every pair's shape.
- **Memory and practice.** It picks pairs the learner eased in an earlier easing lesson ("you eased
  Title's Position last week; now make it land softly"), and the review checks, days later, whether
  a new ease gets shaped or left at the default.

## 2. Outcome

Without help, the learner can shape an eased pair so it starts quickly and lands softly (the landing
ease clearly longer than the start ease, still coming to rest), on Position or Scale, and can say
where in the move it's fastest.

## 3. Prerequisites

| Kind | Skill | If it's missing (C1, FR-005) |
|---|---|---|
| Hard | Easing (`easing.basic`) | Name it and offer it first. If the learner insists, the lesson runs after one sentence ("this builds on easing: it reshapes an ease you've already applied"). No reteach. If the focus rule finds no eased pair, say so and offer easing instead (this is FR-005's example). If the learner's focus pair turns out half eased or linear, give easing's hint ("the key at 1.5 s is still linear, so there's no handle on that side") and suggest easing after this lesson. |
| Soft | Key types (skill 1) | Never blocks. If the learner hits "there's nothing to drag", the hint says the key is linear or hold and has no handles. No key-type lesson inside this one. |

## 4. Focus and demo target

**Focus rule.** Candidates are eased pairs (both ends bezier, `segmentState` "eased") on visible,
non-null layers with no expression on the property. Default to Position or Scale. Any other eased
pair the learner picks is allowed (Rotation, an effect parameter). Rank:
1. pairs on layers the record says the learner eased (easing lesson entries; v1 records name them in
   free text);
2. then other eased pairs;
3. a pair already shaped (it passes § 6 now) is never a candidate. Mention it in one sentence as
   already shaped.

A pair whose two keys hold the same value (no dimension moves) is never a candidate: there's no
move to shape. Leave it out silently; if the learner picks it, say "it holds still between those
keys, so there's nothing to shape" and offer the next pair (round 1, D-1).

Propose one layer (two at most), no more than 5 pairs. Say what's left out and why: hidden layers
(leave them out unless the learner wants them), nulls (the move can't be seen in a frame), precomps
("I can't see inside these yet"), pairs under an expression ("an expression drives this, so graph
edits won't show"), and linear or half-eased pairs ("ease these first; that's the easing lesson").

**Intent check (light).** The skill assumes the move should land softly. If the learner says a move
should land hard (an impact, a slam), drop that pair from the focus without argument. Overshoot and
bounce are out of scope (§ 8).

**Demo target rule.** The first focus pair, in layer then time order, on a visible non-null layer,
with no expression on the property. Never the learner's only pair: with one focus pair there's no
demo, and the mentor walks it through in words (the single-pair rule from easing). The demo is one
write: the start key's outgoing influence about 15% and the landing key's incoming influence about
80%, speeds unchanged (Adobe's own demo values, R). It writes only the sides facing its own pair, as
`set_ease` does, so a shared middle key keeps its other side.

**On Mentor Practice:** as built, the only eased pair is Subtitle Position (one pair, so no demo).
After an easing lesson, Title has Position 0.5–1.5 s, Position 1.5–3 s and Scale 0.5–1.5 s eased:
three Position or Scale pairs, so Title Position 0.5–1.5 s is the demo and the learner shapes the
other two. What the builder's `.aep` holds today is an open item (B-1).

## 5. Sequence

| Stage | Learner does | Mentor checks | What passes |
|---|---|---|---|
| 0. Remember | nothing | The record for this skill, and easing's lesson entries (for the focus ranking) | n/a |
| 1. Look and propose | agrees or picks another layer | Fresh read. Focus rule (§ 4) | A focus with at least one eased pair |
| 2. Read the graph (we do) | Opens the Graph Editor on one focus pair, picks Edit Speed Graph, and says where the move is fastest | The mentor can't see the panel (UI state isn't readable), so it checks the answer against the ease data: with Easy Ease on both ends, the middle | Coarse: first part, middle, or last part of the move. Right after at most one hint. **Recorded, doesn't gate the pass** (a wrong answer may be a panel mix-up, not a misunderstanding) |
| 3. Explain on their comp | watches | At least one frame inside the focus, real layer names and times. The explanation: the horizontal reach of a handle is influence, how long the ease lasts; Easy Ease gives every key the same reach | n/a |
| 4. I do (one demo) | watches, can Edit > Undo | Only when asked or clearly stuck. One write on the demo target (§ 4). Then frames early and late in the pair. Say what changed in plain words ("a short ease out of 0.5 s, a long ease into 1.5 s") | n/a |
| 5. You do | Shapes the other focus pairs by dragging handles or with Keyframe Velocity, says "done" | Fresh read and diff. Each focus pair against § 6. Credit the demo to the demo (easing's `demo_credit` logic). Hints, never the fix | § 6 on every focus pair |
| 6. Read again (understanding check) | Says where the move is fastest now | Against the new shape: it should move toward the start (the short ease) | Recorded, doesn't gate |
| 7. Record | nothing | § 11 | n/a |

**Claims from frames.** The mentor describes only where the layer is on screen in a frame ("at
0.7 s Title is near the top of the frame"), never how far along its own move it is ("close to where
it lands"). It has no value-at-time read, so it never states a percentage of distance travelled.
Until R1 it also can't see a parent's move, which shows in the frame too (Title rides CTRL from 0
to 1 s), so "how far along" could be wrong for reasons the learner can't see. After R1 the mentor
can pick frames where no parent is moving and this can be relaxed (round 1, D-5).

## 6. Pass, per focus pair

All three, counting the demo pair (FR-026 sets the measures):
1. **Longer landing:** the landing key's incoming influence is at least 20 points more than the start
   key's outgoing influence.
2. **Shaped, not default:** the pair's two **facing** sides (the start key's out side, the landing
   key's in side) aren't both at Easy Ease's default (within 1 point of 33.33%). A key's far side
   belongs to the neighbouring pair (§ 9, shared key) and is never graded here. Item 1 already
   implies this; it stays so the check can tell "back to default" apart for its hint (round 1, D-2).
3. **Still eased:** both facing sides are still bezier.
4. **Still comes to rest:** the landing key's incoming speed is close to 0, small next to the pair's
   average speed (spec 008 FR-010d sets the tolerance). Dragging a speed-graph handle up instead of
   sideways changes speed, not influence, and the layer arrives moving, a bump instead of a soft
   landing (graph-editor brief, C, "common"). Without this check, that mistake passes. (Was S-1;
   taken.)

**Every moving dimension.** For a property with more than one ease dimension (Scale reads three on
a 2D layer, R), every dimension whose value changes between the two keys must meet the rule. A
dimension that doesn't move (Scale's third on a 2D layer) isn't graded: the learner can't see it
(round 1, D-4, pending live check L-2). If only some moving dimensions pass, the hint names which
one. Whether dragging a Scale handle moves all dimensions together at 26.5 is open item B-3.

**Never stated as a target.** The mentor doesn't tell the learner "20 points" or "use 15/80". It
says "make the landing ease clearly longer than the start".

## 7. Common mistakes and the hint for each

| Mistake | What the check sees | Hint (where to look, never the fix) | Evidence |
|---|---|---|---|
| Not knowing which graph is showing (value vs speed), so a handle "goes the wrong way" | A shape that doesn't match the ask, or a reading answer that fits a value graph ("it goes up and stays") | "Check the graph menu at the bottom of the Graph Editor says Edit Speed Graph. In the value graph the same drag means something else" | C, common |
| Dragging the handle up or down instead of sideways | Landing incoming speed no longer 0; influence barely changed | "At 1.5 s the move arrives still moving. Drag that handle sideways, along the bottom, to make the ease longer" | C, inference |
| No handles because the keys are linear or hold | A focus pair has a linear or hold side | "The key at 1.5 s is linear, so it has no handle. Ease it first" (skill 1 and easing words, no lesson) | C, "often" |
| Long ease on both ends (near 100% each) | Both influences high, landing not 20 points longer | "Both ends of Scale ease for nearly the whole move, so it floats and then has to rush. Make the start short" | inference |
| Applying Easy Ease again after shaping | Both keys back within 1 point of 33.33% | "Scale is back to the default shape on both keys. Easy Ease resets it" | Guess |
| In and out mixed up (shaping the start key's incoming side) | Start key's in side changed, out side default, and that in side isn't another focus pair's landing (on a shared key it may be the earlier pair's correct landing) | "On the first key it's the outgoing side that matters: that's the side facing the move" | R, Adobe: "the names trip people up" |
| Judging by scrubbing, not playback | Not checkable | Said once at "done": "Play it back at full speed to judge it" | B, habit |

## 8. Teaching scope (not taught here)

The value graph, overshoot and bounce (deferred); separating dimensions to edit the value graph
(deferred 12, motion paths); the speed jolt at a middle key and Rove Across Time (DX-04, deferred 14,
"Smooth a middle key"); diagnosis may point at the jolt and gives hints until then. Easing which pairs
(easing). Key types (skill 1). Graph Editor options (Show Reference Graph, snapping).

## 9. Where AE concepts overlap, and what the check must see

| Overlap | What the check must see | What it must not do |
|---|---|---|
| Expression over keys | A pair on a property with an expression on is not a candidate; name it in one sentence | Grade it, or let the learner shape it and wonder why nothing changed |
| Expression with no keys | Not read until R2. The mentor never says a layer has no expression | Claim the focus is everything that moves |
| Single key | Not a pair; not a candidate | Count it |
| Pair with no value change (a pause, Mentor Practice 2) | Not a candidate; nothing to shape (§ 4) | Grade it, or call it unshaped |
| Hold or linear keys | Not "eased", so not a candidate; if a focus pair becomes linear or held, hint 3 | Pass it, or treat it as unshaped Easy Ease |
| Mixed pair (one side bezier, one side linear) | `partly_eased`: send to easing (C1 hint) | Shape it |
| Separated dimensions | X Position and Y Position are separate pairs with separate curves; each focus pair checked on its own (Bar X Position in Mentor Practice) | Combine them, or check the combined Position |
| Multi-dimension ease (Scale) | Every moving dimension checked (§ 6) | Check dimension 1 only, or fail a dimension that doesn't move |
| Effects | An eased effect pair is a valid pick (graphable) | Exclude it if the learner chose it |
| Precomps | Inside keys aren't read; "I can't see inside these yet" | Say the precomp is fine |
| Hidden layer (eye off) | Left out of the focus unless the learner wants it (the learner can still edit it) | Make it the demo target |
| Matte (KD-001) | Until R1 (wave B) a matte looks like any eye-off layer and is left out like one, with the same "unless you want it". After R1, a matte uses the visibility class and is a normal candidate (its shape shows in the reveal); still never the demo target if its eye is off | Say "you've hidden this" about a matte once R1 can tell |
| Null | Not a default candidate (its move can't be seen in a frame); allowed if the learner picks it; never the demo | Demo on it |
| Parenting | A parent's motion adds to what the learner sees, but the graph shows only the layer's own keys. Parent isn't read until R1, so in wave A the mentor says nothing about it, and frame claims say only where the layer is on screen (§ 5). After R1: name the parent in one sentence; FR-037 hand-off only if skill 4 is learned | Blame the shape for motion the parent adds, or say how far along its move a child is in a frame |
| Shared middle key | Pair 1's landing and pair 2's start are the same key: its in side belongs to pair 1, out side to pair 2 | Count pair 2 as shaped because pair 1's landing changed |

## 10. Version notes (After Effects 26.5, macOS 27.0.1)

- **Graph Editor:** no change found 23.x to 26.5 (brief, medium confidence). The 25.0 themes change
  how tutorials look. Name the menu, not a picture.
- **Graph type:** Auto-Select is the default (speed graph for Position, value graph for the rest,
  A). So Scale opens in the value graph. The lesson always asks the learner to pick Edit Speed Graph
  and asks which graph is showing if an answer doesn't fit.
- **Open and close the editor:** the Graph Editor button in the timeline. Don't quote Shift+F3
  (function keys on a Mac may need fn).
- **Keyframe Velocity:** offer it by menu. My understanding is Animation > Keyframe Velocity (and
  right-click on a key); Adobe's assistant said right-click > Keyframe Assistant > Keyframe Velocity
  and Cmd+Shift+K on Mac (R). Unverified at 26.5 (B-2): never quote a path or shortcut until checked.

## 11. Review (in this sprint's baseline)

- **When:** spec 004 FR-019 to FR-021 (1, 3, 7, 14, 30 days; offered, at most one per session; no
  new target means no review, and it stays due).
- **New target:** an eased, unshaped pair (§ 4 focus rule) on a layer and property the record doesn't
  show for this skill on this comp. A pair already shaped by the learner isn't a target (nothing to
  do); mention it, don't grade it.
- **What it asks:** "Here's Card's Position, 1 s to 2 s. Make it start quickly and land softly." No
  demo, no walkthrough, no reading step, no handle-direction tip. Skill 2 has no intent question
  beyond the light one in § 4 (if the learner says this one should land hard, it isn't a target).
- **What passes:** § 6 on that pair (one pair is enough; two if the layer has them).
- **Not a pass:** § 7's hints, no reteach. The learner can ask for a practice lesson (which may have
  a demo). Recorded as a review that didn't pass; "learned" stays.
- **"I already know it" (C4):** runs exactly as the review above.

## 12. What the record stores

Spec 004 FR-018's shared fields, nothing more in structure. In plain words in the lesson entry:
- **kind** (first lesson, practice, review) and **targets** (layer, property, pair times, comp);
- **attempted:** which pairs were shaped ("Shaped Title Position 1.5–3 s and Scale: short start,
  long landing");
- **summary:** what the checks showed, including the reading answers ("said 'the middle' first
  time; after shaping, said 'near the start'") and anything still off ("Scale's landing still
  arrived moving");
- **next:** one thing ("Shape Subtitle Position, or try a review on a new move").
No influence numbers the learner never saw, no method (which panel or drag), no motive.

## 13. Open items

**For the builder (needs a live AE check on Mentor Practice, `discovery/Claude AE Tutor Test.aep`):**
- **B-1** What the builder's `.aep` holds now: is Title eased from earlier lessons, or back to the
  build script's linear state? The demo target and the live lesson depend on it. If it's linear,
  the live run needs an easing pass first or the second practice comp.
- **B-2** At 26.5: the Keyframe Velocity menu path and Mac shortcut; the Graph Editor's graph-type
  menu labels (Edit Speed Graph, Auto-Select).
- **B-3** For Scale on a 2D layer: does dragging an influence handle in the speed graph change every
  dimension together, and does Keyframe Velocity show one field or one per dimension? Decides how the
  per-dimension hint is worded.
- **B-4** Demo write tool (curriculum B7): set influence on one pair's facing sides, speeds unchanged.
  Extending `set_ease` vs a new tool is yours. Check live that it writes only the facing sides of a
  shared key.
- **B-5** Second practice comp (curriculum B1, FR-031): a layer with at least two eased (Easy Ease)
  Position or Scale pairs for a first lesson with a demo, and another layer with one or two eased
  pairs for review runs and evals.
- **B6 (curriculum):** shared analysis owner before wave A runs in parallel (FR-032). Skill 2 reuses
  `segmentState` and the demo-credit logic; it needs read access, not edits.

**For the spec writer (S):**
- **S-1** (settled by spec 008 FR-010d, see § 14) § 6 item 4 (landing speed still 0) isn't in
  FR-026. It's my addition: without it, the classic "dragged it up" mistake passes.
- **S-2** The reading step is checked and recorded but doesn't gate the pass. FR-026 doesn't mention
  it; please carry it as a step, not a pass condition.
- **S-3** How "fastest" is worked out from the ease data for the coarse check (first part, middle,
  last part) is yours.

**For the eval engineer (E):** an expression-over-keys pair the learner names (it must be refused as
a target, kindly); a "dragged up" pair (speed changed, influence not) that must not pass if S-1 is
taken; a Scale pair shaped on one dimension only; a 15/80 pair passes and a 33/33 pair fails.

**Guesses:** "Applying Easy Ease again resets it" as a common mistake; demo values fixed at 15/80
rather than chosen per move.

**Curriculum B items this skill settles:** B6 (read access only), B7 (set influence).

## 14. Answers to the spec writer, round 1 (2026-10-20)

| Q | Answer | Spec default |
|---|---|---|
| D-1 Pair with no value change | **Agreed: not a candidate.** Nothing moves, so there's nothing to shape. Left out silently; named in one sentence only if the learner picks it (§ 4, § 9). | Kept |
| D-2 § 6 item 2 | **Agreed: the pair's two facing sides.** The far sides belong to the neighbouring pairs and are never graded here; my curriculum § 13 note meant the same thing, worded badly. Item 2 catches nothing item 1 doesn't; it stays only to drive the "back to default" hint (§ 6). | Kept |
| D-3 "Mixed up" hint on a shared key | **Agreed:** only when the start key's in side isn't another focus pair's landing (§ 7). | Kept |
| D-4 "Every dimension" | **Agreed: every moving dimension**, pending L-2 (§ 6, § 9). | Kept |
| D-5 Frames while a parent moves | **Agreed:** frame claims say only where the layer is on screen, never how far along its move, until R1 (§ 5, § 9). | Kept |
| S-1 tolerance (FR-010d: landing speed ≤ 5% of the pair's average speed, tuned on L-5) | **Matches my intent.** "Comes to rest" means the arrival speed is small next to the move's own speed, so a relative measure is right, and 0 within 0.001 where the value can't be read is fine. If L-5 tunes it, tune toward catching a visible bump, not toward passing more pairs. | Kept |
