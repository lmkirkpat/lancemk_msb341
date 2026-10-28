# Teaching design: Move a group with a null (curriculum skill 6)

**Owner:** curriculum designer (`decisions/007`). The spec writer's `spec.md` in this folder links
here and doesn't copy it. Gaps or contradictions come back as questions.
**Date:** 2026-10-23. **Status:** draft, answered by the spec writer in round 1 (§ 14). Round 2
(2026-10-25, § 15): the proposal rule reworked for L-6. 2026-10-26, after the live sitting
(`live-sitting-2026-10-26.md`): D-4 answered (§ 14; § 5 stage 3, § 7, § 10), and HO-2's overlap
re-run on the built branch (§ 9, last note). § 16 (pacing, one idea per turn) **approved
2026-10-28** by the human, as written: where § 5 cuts the lesson into turns differently, § 16 wins.
The rule is now shared by every skill (curriculum § 2).
**Builds on:** `specs/004-ae-curriculum/curriculum.md` § 2, § 6 skill 6, § 8, § 9, § 12 (B9), § 13
(the FR-029 correction), § 14; spec 004 (approved), above all FR-005, FR-013, FR-014, FR-018 to
FR-022, FR-024, FR-028, FR-029, FR-030, FR-037, the Edge Cases table, and plan.md › Waves › Wave B.
Research: `discovery/curriculum-research/parenting-and-nulls.md`. Evidence:
`discovery/usage-notes/adobe-assistant-2026-10-08.md`,
`discovery/usage-notes/mentor-practice-state-2026-10-20.md`. Lesson shape:
`.claude/skills/ease-mentor/SKILL.md`. Shape and depth follow `specs/010-offset/teaching-design.md`
and `specs/008-speed-graph/teaching-design.md`.
**Hard prerequisite:** skill 5, Set the pivot (`specs/011-anchor/`, written in parallel; assumed
learned here, not read).
**Suggested record ID:** `parenting.null` (the skill builder names it).

Tags: **A** Adobe, **B** established teaching, **C** one tutorial or thread, **P** practitioner,
**R** repo evidence, **Guess** a design call with no evidence (also listed in § 13).

## 1. The one idea, and why

**Idea:** a parent carries its children's position, scale and rotation while they keep their own
animation. A null is an invisible handle for that: park it where the group should pivot, parent the
group to it, and animate the null.

**Why a learner needs it:** the moment a design has parts (a lower third, a logo lockup, a card with
a label), the learner wants to move them together without re-keying each one. The two classic
failures are parenting to a visible layer, so the parent's own motion drags the children around, and
fading the parent expecting the children to fade (B, Meyer, "very common"). The third is the child
that jumps the moment it's parented (B plus C, "very common").

**What Adobe's assistant can't do today, said plainly:**
- **Depth, on the jump.** Adobe reads parents: on 2026-10-08 it said Logo "isn't parented to CTRL"
  (R). So "is the parent a null" is no edge. What it couldn't do was place layers on screen:
  "Screen-position samples didn't work either, because those numbers are in each layer's own space"
  (R). Whether a child jumped is exactly a comp-space question, because parenting rewrites the
  child's numbers into the parent's space even when nothing moves (§ 6, B9). Knack checks every
  child's footprint on screen at every one of its key times, before and after. That's the real edge,
  and it's the part of the skill a learner can't easily check by eye on a long comp.
- **Memory and practice.** The review gives a "move these together" task days later and never says
  "null", so it sees whether the learner reaches for one unprompted (§ 11). Adobe parents on request
  and described no memory of the learner.

## 2. Outcome

Without help, the learner can add a null, park it where the group should turn or scale from, parent
2 to 4 layers to it without any of them jumping, and move the group by animating the null, with each
child still running its own animation.

## 3. Prerequisites

| Kind | Skill | If it's missing (C1, FR-005) |
|---|---|---|
| Hard | Set the pivot (`transform.anchor`, skill 5) | Name it and offer it first. If the learner insists, the lesson runs after one sentence ("this builds on the pivot lesson: the null's position is the point the whole group turns around"). No reteach. If the null's pivot misses the region the learner named (§ 5 stage 3), give skill 5's style of hint ("the null sits at the group's top-left, so the group would swing around that corner") and suggest skill 5 after this lesson. |
| Soft | Find what's moving it (`motion.sources`, skill 4) | Never blocks. Not built this sprint, so FR-037's hand-off never fires yet (§ 9, last rows). |

Easing isn't a prerequisite (skill 5's only hard prerequisite is keyframes), so nothing here grades
ease, and comments on the null's ease are worded for a learner who may not have met easing (§ 5
stage 7).

## 4. Focus and demo target

**Ask first.** The mentor can't read which layers belong together, so it asks: "Which layers should
move as one, like the parts of a lower third or a logo lockup?" The learner names 2 to 4 layers, or
agrees to the mentor's proposal.

**Proposal, when the learner has no answer** (the proposal rule, spec 012's H-4; revised
2026-10-25 for L-6, § 15). It answers the question an instructor asks looking at the frame: which
layers read as one thing? The parts of one thing sit together **and apart from the rest**. Closeness
alone can't tell that on a busy comp, because near neighbours chain into one crowd (R, L-6). The
rule is the tool's and deterministic; the model only says it.

1. **Link.** Two **candidate** layers (the table below, proposable ones only) link when their
   comp-space bounds at the before-read time overlap or nearly touch: a gap of at most 2% of the
   comp's width on both axes (unchanged, **Guess**). Layers that aren't proposable (hidden, parented,
   nulls, full-frame, 3D and the rest) don't link anything.
2. **Groups and crowds.** Follow the links: every layer reachable from another is in its cluster. A
   cluster of **2 to 4** layers (a matte pair counts as 2 and is never split) sits apart from the
   rest, so it's a **group**. A cluster of **5 or more** is a **crowd**: never proposed and never
   trimmed to 4, because any 4 the mentor took from it would be a guess about the learner's design.
   A layer that links to nothing is neither.
3. **Pick among groups**, in this order: (a) a group that mixes a text layer with at least one
   non-text layer, a label on something, as in a lower third, a lockup or a card with a label
   (**Guess**); then (b) more layers; then (c) the group whose top layer is highest in the stack.
   The first is the proposal; the second is kept in case the learner says no.
4. **Say it with the reason**, in one sentence: "Tile, Caption and Stamp sit together at the top
   right, apart from everything else. Want to move those as one?" If the learner says no, offer the
   second group once ("Or Chip A, Chip B and Chip C?"), then ask them to name the layers.
5. **When the signal is weak, ask.** No group but a crowd: don't propose. Say why in plain words and
   ask: "A lot of your layers sit close together, so I can't tell which ones belong together. Which
   2 to 4 should move as one?" Don't list the crowd. No group and no crowd: say so and ask the
   learner to make a small group to practice on (two shapes and a text layer). Never invent a
   grouping.

A crowd's layers aren't "left out": they're candidates the learner may name, so the left-out
sentence (below) stays about the table's reasons, and never lists them.

**Candidates** (by FR-013's visibility class, never by the eye switch alone):

| Layer | In the focus? | What the mentor says |
|---|---|---|
| Renders, 2D, no parent | Yes, the default | |
| Text layer | Yes | Nothing special: its bounds come from its text |
| Precomp layer | Yes, as one layer | "I can't see inside Icon, but it moves as a whole, so that's fine here." Inside keys aren't read and aren't needed: the check reads the precomp layer's own transform |
| Shy | Yes | "Badge is shy, so it's hidden in the timeline; turn shy off to see its Parent column" |
| Hidden by the learner (eye off) | Only if the learner wants it | "You've hidden Old Take, so I'll leave it unless you want it." Never the demo target |
| Matte, or the layer it mattes | **The pair goes in together** | "Gradient shows through Title Matte, so they should move as one: I'll count both." A matte left behind breaks the reveal. Counts toward the 4. Never the demo target (eye off by design) |
| Already parented to a null | No | "Title already follows CTRL." Re-parenting it would drop CTRL's motion from it, and chains are out of scope (§ 8) |
| Parented to a visible layer | No | One sentence naming the mistake it shows ("Subtitle follows Title, so moving Title drags it along; a null avoids that"). Fixing it changes visible motion, so it's a later lesson's focus or the learner's own choice after this one |
| Null | No (it would make a chain) | Named only if the learner picks it |
| Guide | No | It doesn't render |
| 3D layer, camera, light | No | "3D layers are a later topic" (§ 8) |
| Full-frame solid or adjustment layer | Not proposed; allowed if picked | An adjustment layer that moves carries its effect area with it; say so once if picked |

If the learner names more than 4, ask which 4 to start with. If they name 1, ask what else should
move with it (a null for one layer is fine in AE, but it isn't this lesson's idea).

Say what's left out and why, as above, in one or two sentences.

**The null.** Default: a new null the learner adds at stage 3. If the comp already has a null with
no children and no keys, the learner may use it. An existing null that already has children or keys
(CTRL in Mentor Practice) is allowed only if the learner picks it, and the mentor says once that its
other children and its existing move will come along. The lesson's null is recorded by name at
stage 3.

**Demo target rule.** The demo parents **one focus layer** to the learner's null. Pick the first
focus layer in stack order that renders, is 2D, isn't a matte, and has no expression on a keyed
Position, Scale or Rotation (the snapshot's existing flag). Prefer one with its own keys, so the
"it kept its own animation" point shows. With 2 focus layers the demo takes one and the learner
parents the other. If no focus layer qualifies, there's no demo and the mentor walks it through in
words (§ 5 stage 4).

**No null yet, no demo.** The demo needs the learner's null to exist and to have passed the stage 3
check, so it can't run first.

**On Mentor Practice (as built and as read on 2026-10-20):** its one group is already done: Title and
Subtitle follow CTRL, a null. That's the explanation's worked example (§ 5 stage 2), not a target.
The unparented content layers (Bar, Logo, Cursor, Icon) don't form a natural group, so **the live
lesson needs the second practice comp** (B-1).

## 5. Sequence

| Stage | Learner does | Mentor checks | What passes |
|---|---|---|---|
| 0. Remember | nothing | The record for this skill | n/a |
| 1. Look, ask, agree a focus | names 2 to 4 layers, or agrees to the proposal (or the second group), or answers the crowd question | Fresh read with R1 and R3. Asks first (§ 4). Only if the learner has no group in mind: the tool's proposal from § 4's rule, said with its reason ("apart from everything else"); a crowd gets the question, not a proposal; a "no" gets the second group once, then the question. The **before read** is taken now, when the focus is set: for each focus layer, its footprint in comp space at the current time and at each of its key times (§ 6, "the before read") | A focus of 2 to 4 candidates, however it was reached (named, proposed or second group) |
| 2. Explain on their comp | watches | At least one frame, real names and times. If the comp has a null with children (CTRL), use it: frames at its first and last key, "CTRL rises 40 px and Title and Subtitle rise with it, while Title still runs its own keys." Otherwise one frame of the focus group and the idea in words. Then the two facts that matter: children inherit position, scale and rotation, **not opacity or effects**; and a null never renders, so it can't drag its own look into the group | n/a |
| 3. We do: add and place the null | Adds a null (Layer > New > Null Object), says where the group should turn or scale from (a corner, an edge center, or the middle of the group), drags the null there, says "done" | Once the learner has named a place, and before they drag, **one sentence on where the null's pivot is** (D-4, § 14): "The null's pivot is the top-left corner of its square, so put that corner on the spot." Once per lesson; never the null's size. Not said for "it'll only slide" (said with the region question instead, if P5 asks for one later). Then a fresh read. § 6, N1 to N3 (a null exists, 2D, no parent; its pivot is in the named region of the group). The region is the learner's intent: the mentor asks, never picks. "It doesn't matter, it'll only slide" is a valid answer: the region check is then skipped until the null's move turns or scales (§ 6, P5). The null's transform is stored now (§ 6, "the null at parenting") | N1 to N3 |
| 4. I do (one demo) | watches, can Edit > Undo | Only when asked or clearly stuck (the mentor offers it here, the learner may decline). One write: parent the demo target to the null with no jump. Then a frame at the before-read time: "Card is exactly where it was, and its Parent column now says Group Null." The check's number goes in plain words ("it moved 0 pixels"), since two identical frames don't show much on their own | n/a |
| 5. You do (a): parent the rest | Parents the other focus layers to the null by any method, says "done" | Fresh read and diff. § 6, P1 to P3 for every focus layer. Credit the demo layer to the demo. Hints, never the fix (§ 7). **The mentor asks for the null's move only after this check passes**, so a jump is caught on its own | P1 to P3 |
| 6. You do (b): move the group | Gives the null one move (two keys on Position, Scale or Rotation), says "done" | Fresh read and diff. § 6, P1 to P5. Then frames at the null's first and last key times: "Card, Label and Badge all moved up together, and Label still fades in on its own" | All of § 6 |
| 7. Comments (never graded) | nothing | One sentence each, only when the read shows it: the null's move is linear ("the group starts and stops hard; ease the null's keys if you want it softer"), held (asked: "the group snaps at 2 s instead of sliding; is that what you want?"), or overlaps a child's own move in time (stacked motion, § 9). Naming the null is suggested once if it still has the default name | Never graded |
| 8. Record | nothing | § 12 | n/a |

**If the learner keys the null before stage 5's check** (they went ahead): fine. The check still
works, because it composes the children's own values through the null as it was when they were
parented, not as it is now (§ 6). The mentor doesn't ask them to undo anything.

**Frame claims.** As in skill 2 (§ 5 there): the mentor says where layers are on screen in a frame,
never how far along their own move they are. With R1 it now knows when a parent is moving, so it can
pick frames where only the null moves.

## 6. Pass

FR-029 sets the measures; this section says what they're measured on. Every item counts the demo
layer.

**The null** (checked at stage 3, re-checked at the end):
- **N1.** The lesson's null is a null layer (visibility class *null*).
- **N2.** It's 2D and has no parent. If it has a parent, the hint names it; if the learner says the
  chain is on purpose, N2 passes and the mentor says once that it checks one level only (ask, don't
  fail, as offset's "split on purpose").
- **N3.** Its pivot, meaning its anchor point in comp space (for an unparented null, that's its
  Position), is in the region the learner named, measured against the **group's** combined bounds at
  the current time with FR-028's per-axis rule (10% of the group's width across, 10% of its height up
  and down). Only when a region was named.

**Parenting** (checked at stage 5, re-checked at the end):
- **P1.** Every focus layer's parent is the lesson's null. Only the Parent link (R1) counts: a layer
  that follows the null through an expression isn't parented (§ 9).
- **P2. No jump.** Each focus layer's footprint (the four corners of its bounds in comp space) at the
  before-read time **and** at each of its key times is within **1 pixel** of the before read. Corners,
  not only the anchor's position, so a scale or rotation jump is caught too when the null isn't at
  100% and 0° (FR-029 names position only; § 13, S-1).
- **P3. Own animation kept.** Each focus layer's key count and key times on every keyed property match
  the before read (within half a frame). **Never compare raw key values**: parenting rewrites a
  child's Position (and, when the null is scaled or rotated, its Scale and Rotation) into the
  null's space, so the numbers change while nothing moves on screen (B9).

**The group's move** (checked at stage 6):
- **P4.** The null has at least two keys with different values on **Position, Scale or Rotation**
  (any moving dimension; separated X or Y counts). An Opacity or effect move on the null doesn't
  count, because children don't inherit it (the hint is § 7's fade row).
- **P5.** If the null's move includes Scale or Rotation, N3 must pass. If the learner skipped the
  region at stage 3, the mentor asks for it now, before grading.

**What P2 is measured on. "The before read" and "the null at parenting".**
- **The before read** is taken when the focus is set (stage 1), while the focus layers have no
  parent. Its time is the current time then, **stored**: later checks sample at that same time, not
  at whatever the current time is when the learner says "done" (FR-029 says "the current time"; § 13,
  S-2).
- **The times** are the union of every key time on the layer's Position (or X and Y), Scale and
  Rotation, plus the before-read time. Anchor Point keys aren't rewritten by parenting, but their
  times go in too, since they move the footprint. A layer with no transform keys is checked at the
  before-read time only.
- **The null at parenting** is the null's transform stored at the stage 3 check (or at the demo,
  whichever is later). P2 maps each child's own values at each time **through that stored null**,
  not through the null's current, animated transform. That way the null's own move (stage 6, or a
  learner who keyed it early) never reads as a jump, and moving the null later is the null doing its
  job. If the learner re-places the null **between** stage 3 and parenting, AE compensates against
  the new spot and the check can see a false jump; § 7's jump hint is worded so that case reads
  right.
- **What this needs from the reads** (a wave B shared-read request, § 13, B-3): R3 as outlined reads
  bounds at the current time only. P2 needs, for a layer and **a list of times**, its transform
  values (anchor, position, scale, rotation, after expressions) and its bounds at each time, plus the
  same for its parent. Recommended: the read samples values in AE, and the comp-space math (2D only)
  lives in the server, where it can be unit tested on saved snapshots.

**Not graded:** the null's ease or key type (stage 7 comments), its name, the timing between the
null's move and the children's own moves, how far or which way the group moves.

**Never stated as a target.** The mentor doesn't say "1 pixel". It says "it stayed where it was" or
"it moved 40 pixels to the right".

## 7. Common mistakes and the hint for each

| Mistake | What the check sees | Hint (where to look, never the fix) | Evidence |
|---|---|---|---|
| A visible layer as the parent | A focus layer's parent is a content layer, not the null (P1) | "Label follows Card, not the null, so anything you do to Card drags Label along. Check Label's Parent column" | B, very common |
| Child jumps when parented | P2: a footprint off by more than 1 px | Name the layer, distance and direction, no cause: "Badge is 120 px left of where it was at 0.5 s." Then where to look: "Edit > Undo and parent it again. If the null moved after you placed it, that can show up here too." Then **one question, once per lesson, never as the reason**: "Were you holding a key while you parented it? Parent with no key held." If the learner says the layer flew off when they parented it, ask that question first; the fix is still Edit > Undo and parenting with no key held. Never name Option or Shift as the cause, and never teach either (§ 8). Logged at 26.5 (L-1, B-4): holding Option keeps the child's own values and only sets the parent, so it jumps by the null's place; holding Shift moves the child onto the null. Both are one Edit > Undo, like a plain parent | B, C, very common; R (L-1) |
| Pick whip dragged from Position, not the Parent column | P1 fails (no parent); usually P2 too (the child snaps to the null's position); on a keyed Position, the snapshot also sees an expression appear | "Label's Parent column still says none, and it jumped to where the null is. There are two pick whips on a layer; the one for this is in the Parent column" | C, Adobe staff reply on two pick-whip columns |
| Parented to the wrong row | P1: parent is another focus layer or a different layer | "Badge follows Label, not the null" | Unverified (brief); plausible from 007 |
| Fading the null, expecting the group to fade | Null Opacity keyed, or set between 0 and 100 (R3), with children at 100. A static 0 never counts: AE 26.5 makes every new null at Opacity 0 (L-1), so "below 100" would fire on every lesson | "Opacity doesn't pass from a parent to its children, so Group Null's fade does nothing you can see. Fade each layer, or ask about precomps later" | B, very common |
| The null's "move" is Opacity, an effect, or one key | P4 fails | "The null has one Position key, so it holds still" / "only Opacity moves on the null, and children don't follow that" | B, C |
| The null's pivot far from where the group should turn | N3 fails (and the move rotates or scales) | In a lesson, where the pivot is, named by the square's corner (D-4): "Group Null's pivot, the top-left corner of its square, sits at the group's top-left, so the group would swing around that corner. You said the middle." It says where the pivot is, not why it's there. Never the null's size. In a review, the same without the square's corner and without "null" (§ 11) | Inference from skill 5; R (L-1: a square centred on the group's middle puts the pivot about 50 px up and left) |
| Non-uniform scale on the null | Null Scale X ≠ Y at any key or static | One sentence, never a fail: "Group Null's scale isn't even, so its children stretch, and they'll skew if it rotates" | B, occasional |
| Null Scale at 0% at a key | Null Scale 0 on a dimension | "At 1 s the null's scale is 0, so the whole group collapses to a point there" | C, occasional |
| An effect on the null, expecting it on the group | Only if the read sees an effect property on the null (keyed effects today; § 13, B-5) | "Effects don't pass down either; the null has nothing to blur" | B |

## 8. Teaching scope (not taught here)

- **Chains deeper than one** (a null parented to a null), rigs, symmetric layouts by rotating a
  central parent (brief, step 4): later, if ever. One level only.
- **Expression links** (pick-whipping one property to another, `parent` in expressions): deferred 13,
  Motion from code. Named only as the mistake in § 7.
- **3D, cameras, lights**, and 3D nulls: curriculum § 11.
- **Stacked parent and child motion as a timing problem** (DX-08): skill 4 traces it, diagnosis hints
  it. Here it's one ungraded sentence (§ 5 stage 7, § 9).
- **Unparenting**, Option or Shift parenting variants, right-click "select children", the Parent
  column shortcut: not taught. The only mention of a held key is § 7's one question after a jump
  ("parent with no key held"), a caution, never a technique. Unparenting is mentioned only if the learner asks how to undo a parent
  (Edit > Undo first; the Parent menu's none second).
- **Opacity for a group**: named as the mistake; "precomp the group" is skill 10's idea, mentioned
  only as "a later lesson".
- **Easing the null**: commented, never graded (easing isn't a prerequisite).
- Collapse Transformations, Essential Properties.

## 9. Where AE concepts overlap, and what the check must see

The visibility class (FR-013) and the motion-sources map's first step (FR-014: own keys and parent
chain, with expressions and precomp contents marked "not read") come from the shared wave B code,
not this skill's file.

| Overlap | What the check must see | What it must not do |
|---|---|---|
| Expression on a child's keyed Position, Scale or Rotation | Flagged by today's snapshot. The layer can be in the focus but isn't the demo target. P2 uses values after expressions, so a jump the expression causes still shows. If it jumps, the hint names the jump and the expression in one sentence | Blame the learner's parenting for what the expression does, or skip the layer |
| Expression on an unkeyed child property | Not read until R2 (the map's "not read" marker). If a child jumps and no keyed expression is flagged, the hint names the jump, not a cause, and says the mentor can't see expressions on unkeyed properties yet | Say the layer has no expression |
| Pick-whip link instead of a parent | P1 fails: R1's parent is the Parent link only. The child snaps to the null's Position (P2; L-3, both cases). On a keyed Position the expression flag appears and the keys stay; on an unkeyed one there's no flag (R2), so the check names the pick whip from where the child landed (on the null's place, with no parent and a jump). § 7's two-pick-whips hint fires either way (L-3) | Count an expression-linked follower as parented |
| Option or Shift held while parenting (L-1) | P1 passes (the parent is set). Option keeps the child's raw values, so P2 sees a jump by the null's place; Shift rewrites its Position keys onto the null, so P2 sees every such child land on one spot; P3 passes in both (times and counts kept). § 7's jump hint, with its one held-key question | Name the key as the cause, call it a pick-whip link, or teach either key |
| Expression on the null's Position (a float, like Adobe's CTRL suggestion) | P4 is on keys only; an expression move doesn't count as "one move". The stored null transform for P2 is read after expressions, at the stored time | Pass P4 on an expression with no keys |
| Single key on a child | Still its own animation: key count 1 and that time; P2 at that time | Treat it as a move, or skip it |
| Hold keys on a child | Sampled at its key times like any other; the hold jumps are the child's own | Call its own hold jump a parenting jump (P2 compares the same times before and after, so it can't) |
| Single key on the null | P4 fails, with the "holds still" hint | Count one key as a move |
| Hold keys on the null | P4 passes (it's a move). Stage 7 asks once whether a snap is meant | Fail it, or ease it for them |
| Separated dimensions on a child | P2 samples X and Y (and the union of their key times); P3 counts keys on X and Y separately | Read the combined Position, or miss Y's keys |
| Separated dimensions on the null | P4: X or Y moving counts | Require the combined Position |
| Effects on a child | Not inherited, not touched by parenting; effect keys count in P3's key times | Count them as moved by parenting |
| Effects on the null | Not inherited; § 7 hint only if the read sees one | Pass P4 on an effect move |
| Precomp layer as a child | A normal child: its own transform and bounds (the precomp's frame) | Say its insides moved with it correctly, or that they're fine |
| A layer inside a precomp | Can't be parented to this comp's null (parents work within one comp) and isn't read | Offer it as a focus layer |
| Hidden null (eye off), or a null at Opacity 0 (every new null at 26.5, L-1) | Correct, class *null*; it still carries its children (Edge Cases table). Nothing in the class, the candidates, the demo target or frames reads Opacity | Say "you've hidden this", call it invisible because of its Opacity, or drop it from the map |
| Eye-off child | Only if the learner wants it; P2 works from bounds, not pixels | Make it the demo target or claim it's visible in a frame |
| Matte and its layer | Proposed together (§ 4); both must pass P1 to P3; the matte isn't "hidden" | Leave the matte behind, or call it hidden (KD-001) |
| Shy child or shy null | Renders (or carries) as usual; one sentence that it's hidden in the timeline | Treat shy as not rendering |
| Guide layer | Not a candidate | Count it as visible |
| Solo on another layer | The class describes the layer itself | Call unsoloed layers hidden |
| Non-uniform parent scale | Named (§ 7) when the read sees it; P2's corners catch any distortion that makes a child move on screen at parenting | Fail on it alone |
| Null opacity keyed, or set between 0 and 100 | § 7's fade hint; never affects P1 to P5. A static 0 is AE 26.5's default for a null (L-1) and gets nothing | Pass P4 on it, or give the fade sentence for a null left at its default |
| The null itself has a parent | N2 (ask, don't fail); the map shows the chain | Grade beyond one level |
| Focus layer already parented | Not a candidate (§ 4) | Re-parent it silently |
| 3D null or 3D child | N2 or the candidate rule says 3D is out | Run the 2D math on a 3D layer |
| Auto-orient on a child | Rotation read after expressions doesn't include auto-orient (confirmed live, spec 004 T158, L-4); such a layer stays out of the focus, and the math returns its auto-orient reason | Run P2 on a rotation the read can't see |
| Stacked parent and child motion (DX-08) | When the null's move overlaps a child's own Position keys in time, one ungraded sentence: "Label's own rise and the null's move overlap from 1 to 2 s, so Label moves twice there; play it back and see." FR-037 hand-off only if skill 4 is learned (not this sprint) | Fail it, or call it a jump |
| Children of a moving parent (offset's blind spot until R1) | Skill 6 reads R1, so it has no such blind spot: it knows every focus layer's parent, and the map lists the null as a source of each child. It doesn't teach staggering. After this lesson the group's shared move lives on the null, which is what skill 3's post-R1 rule names ("they share Group Null's move") | Grade timing between children, or claim the children move apart |
| Dragging the null to a new spot after parenting | The group moves with it: that's the null working. P2 uses the null at parenting, so it isn't a jump | Call the group's move a jump |

**HO-2 re-run (2026-10-26), on the built branch.** Checked against `mentor/lib/comp-space.mjs`,
`mentor/jsx/snapshot.jsx`, `mentor/lib/null-parenting-check.mjs`, the overlap tests on the live
captures, and L-1 to L-6. The table was right except where the live facts were new: the pick-whip
row now says how the unkeyed case is caught (L-3), the Option or Shift row is new (L-1), the hidden
null and null opacity rows take AE 26.5's Opacity 0 (L-1), and auto-orient is no longer a guess
(L-4). The contract row (an expression on the null's Position) holds as built: the snapshot samples
every layer, keyed or not, after expressions (`valueAtTime(t, false)`) at the current and caller
times, so the stored null is the rendered value, and P4 reads the keyed list only. What the tests
still miss is in the hand-back (skill-builder findings), not here.

## 10. Version notes (After Effects 26.5, macOS 27.0.1)

- **Null defaults** (logged at 26.5, L-1; B-4 answered): a new null is a 100 × 100 square, at the
  top of the stack, with its anchor at the square's **top-left corner**, on its Position (the comp's
  center), so the square draws down and right of that point. Its Opacity reads 0. AE names it
  "Null" plus a number that carries on from the project's other nulls, so it's often not Null 1.
  **What the mentor says (D-4, § 14):** where the null's pivot is, once, at stage 3 (§ 5) and in the
  pivot hint (§ 7): the top-left corner of its square. It may say where a new null lands (top of
  the stack, middle of the comp) and uses the null's real name from the tools. It never gives the
  null's size and never mentions its Opacity. N3 measures the anchor, so the check doesn't change.
- **Making a null:** Layer > New > Null Object (menu path, stable across sources). No shortcut quoted.
- **The Parent & Link column:** name the column and how to show it (right-click a column heading,
  Columns, Parent & Link; the header reads "Parent & Link" at 26.5, L-1). Don't quote Shift+F4
  (function keys on a Mac may need fn). A layer has more than one pick whip: say "the pick whip in
  the Parent column" (its tooltip at 26.5: "Parent pick whip (select layer from which to inherit
  transforms)", L-1).
- **Option or Shift while parenting** (logged at 26.5, L-1; B-4 answered): Option keeps the
  child's own values and only sets the parent, so the child jumps by the null's place; Shift
  rewrites the child's Position keys so it lands on the null. Both are one Edit > Undo, under the
  same label as a plain parent. Not taught (§ 8); § 7's jump hint may ask once whether a key was
  held.
- **25.4 Quick Offset** "shifts layers without altering keyframe animations" (A, via search); with
  parented layers it's unverified. Not used in this lesson.
- **26.5:** no parenting changes found (A, community announcement).

## 11. Review (stretch this sprint; designed now so the first build includes it)

Plan.md says each skill's first build should include its review mode, because a later branch that
edits the merged tool file gets flagged (`check-branch.mjs`). So the review is specified in full here
even though skills 5 and 6's reviews are stretch (H2).

- **When:** spec 004 FR-019 to FR-021.
- **New target:** 2 to 4 candidates (§ 4) that aren't parented and aren't in the record for this
  skill on this comp, that look like a group (the § 4 proposal rule: the first group, never a
  crowd) or that the learner names. No group, no review offered; it stays due. A comp with only a
  crowd counts as no group: the review names its task, so it can't open with a question about
  which layers belong together. A group already parented to a null isn't a target
  (mention it, don't grade).
- **What it asks:** names the layers and the task, **without the word "null"**: "Card, Label and
  Badge should move as one. Set that up so you can move them together, then give them one move."
  Then the intent question: "Will the group turn or scale, and from where?" (skill 6's intent, as
  skill 5's "where's the hinge"). No demo, no walkthrough, no menu path, no mention of jumps.
- **The before read** is taken when the task is given, and "the null at parenting" is stored at the
  first check that sees the new null with no children yet. If the learner adds the null and parents
  in one go before any check, P2 uses the null's static transform at that check, or, if it's already
  keyed, its value at the before-read time (§ 13, S-3).
- **What passes:** all of § 6. The review's real test is P1 and N1: the learner reached for a null
  without being told.
- **Not a pass:** § 7's hints, no reteach. For a visible parent, the hint names what the check sees
  and stops there ("Label and Badge follow Card, so anything you do to Card drags them along"); it
  doesn't say "use a null". The pivot hint doesn't name the square's corner (D-4, § 14). Recorded as
  a review that didn't pass; "learned" stays.
- **"I already know it" (C4):** runs exactly as above.

## 12. What the record stores

Spec 004 FR-018's shared fields. In plain words in the lesson entry:
- **kind** and **targets**: the focus layers, the null's name, the comp;
- **attempted:** "Parented Card, Label and Badge to Group Null and moved it up from 2 to 3 s";
- **summary:** what the checks showed ("Badge jumped 120 px on the first try, then stayed put";
  "the null's first move was on Opacity"; "said the group only slides, so no pivot region");
- **next:** one thing ("ease Group Null's move" or "try a group that turns").

No pixel tolerances, no method (which pick whip, which key held), no motive.

## 13. Open items, with a recommended answer for each

**For the builder (B; a live AE check on the second practice comp, not Mentor Practice):**
- **B-1** Second practice comp targets (`build-practice-comp-2b.jsx`, plan.md wave B): a group of 3
  unparented layers that sit together (a shape "Card" with its own Position keys, a text "Label" with
  an Opacity fade, a "Badge" with separated Position), a second group for review runs and evals, one
  layer parented to a visible layer (the mistake, for § 4's "name it" row), and a matte pair.
  **Recommended:** build these; Mentor Practice's one group is already done (Title and Subtitle under
  CTRL), so it can serve only as the stage 2 example.
- **B-2 (curriculum B9)** When a keyed child is parented with no jump, does AE rewrite its Position
  key values (and Scale and Rotation when the null is scaled or rotated)? **Recommended:** check it
  live first, as plan.md says. The design doesn't depend on the answer, because P2 compares
  comp-space footprints and P3 compares only key counts and times; the answer confirms why raw values
  are never compared, and the eval case below uses it.
- **B-3 (wave B shared-read request)** P2 needs transform values and bounds **at a list of times**,
  for a layer and its parent (§ 6). R3 as outlined reads bounds at the current time only.
  **Recommended:** add a sampled form of R3 to the shared wave B pass (values read in AE after
  expressions, at given times), with the 2D comp-space math in the server and unit tested. It's
  shared, not skill 6's own: skill 5's footprint check and skill 8's moving matte need the same
  read. The cockpit should route this to wave B's shared owner before skill 6 builds.
- **B-4** At 26.5: the null's defaults (size, anchor, how it draws); whether holding Option or Shift
  while parenting moves the child; the two pick-whip columns' labels. **Recommended:** one short live
  check; until then the mentor says none of it (§ 10). **Answered 2026-10-26 (L-1):** § 10; what
  the mentor says is D-4 (§ 14).
- **B-5** R1 must carry **null**, **3D** and **layer kind** (text, shape, precomp, solid,
  adjustment), not only the switches listed in curriculum § 5. **Recommended:** add them to R1;
  the visibility class already needs null. An effect count per layer would let § 7's effect row fire
  on unkeyed effects; nice to have, not needed for the pass.
- **B-6** Does a rotation read after expressions include auto-orient? **Recommended:** check once;
  until then auto-oriented layers stay out of the focus. **Answered 2026-10-26 (spec 004 T158,
  L-4):** it doesn't, so they stay out.
- **B-7 (curriculum B7)** Demo write tool: parent one layer to one null with no jump, once per
  lesson, only on the demo target, only after N1 to N2 pass. My understanding is that setting a
  layer's parent in a script keeps its place and a separate call jumps (unverified). **Recommended:**
  the tool checks its own result with P2 before returning.

**For the spec writer (S):**
- **S-1** P2 measures the footprint's four corners, not only the position: FR-029 says position,
  which misses a scale or rotation jump when the null isn't at 100% and 0°. **Recommended:** reword
  FR-029 to "every corner of the layer's comp-space bounds", same 1 px.
- **S-2** FR-029's "at the current time" should be "at the before read's time, stored", so moving the
  playhead between checks doesn't read as a jump. **Recommended:** take it.
- **S-3** "The null at parenting" (§ 6): P2 composes through the null as stored at stage 3 or the
  demo, never its current transform. FR-029 doesn't say which parent transform to use, and the
  obvious one (the current one) fails every lesson at stage 6. **Recommended:** add it to FR-029,
  with the review's fallback (§ 11).
- **S-4** P4 and P5 aren't in FR-029 or curriculum § 6's pass ("the null has at least two keys with
  different values"). I narrowed the null's move to Position, Scale or Rotation, so a fade on the
  null can't pass. **Recommended:** take it; it's the fade mistake's whole point.
- **S-5** N3's region uses the group's combined bounds with FR-028's per-axis rule, and gates the
  pass only when the null's move turns or scales. **Recommended:** reuse FR-028's numbers rather than
  a new margin.
- **S-6** "Ask, don't fail" for a null with a parent (N2), as offset's D-2. **Recommended:** keep it.

**For the eval engineer (E):** a correct parenting where the child's raw Position values changed but
its footprint didn't must pass (spec 004's skill 6 case); a child that jumps on parenting gets the
distance-and-direction hint with no cause; a pick-whip link on Position is not counted as a parent;
the null faded instead of moved fails P4 with the opacity hint; a null keyed before the parenting
check doesn't make P2 fail; a matte pair is proposed together and the matte isn't called hidden; a
review where the learner parents to a visible layer fails without the word "null" in the hint.

**For the human (H):**
- **H-1** Is the stage 3 pivot question worth its time when most first groups only slide?
  **Recommended:** keep the question (it's skill 5's idea reused, and the reason 5 is the hard
  prerequisite) but gate it only when the move turns or scales, as designed.
- **H-2** The review never says "null". **Recommended:** keep it; the point of the review is whether
  the learner reaches for one unprompted.

**Guesses:** the proposal rule when the learner has no group in mind: the 2% margin, the 2-to-4
cut between a group and a crowd, and the preference for a text layer with a graphic (§ 4, § 15); "the null re-placed between stage 3 and parenting" being rare enough to handle by hint wording.
(Auto-orient's interaction with the rotation read was a guess until L-4 confirmed it, B-6.)

**Curriculum items this design settles or moves:** B7 (set parent, no jump), B9 (moved to B-2, and
no longer blocking the design), § 9's null-defaults row (B-4), § 13's FR-029 correction (refined by
S-1 to S-3).

## 14. Answers to the spec writer, round 1 (2026-10-23; D-4 added 2026-10-26)

| Q | Answer | Spec default |
|---|---|---|
| D-1 Re-store the null at every check where no focus layer is parented yet | **Agreed.** It's better than my stage 3 or demo rule: a learner who moves the null after placing it but before parenting no longer sees a false jump. § 6's "null at parenting" now means the null as stored at the **last check (or the demo) before any focus layer was parented**. The leftover case: the learner re-places the null and parents without saying "done" in between. That case stays with § 7's jump hint, which already mentions a moved null. | Kept (FR-012 as proposed) |
| D-2 A null animated only on Anchor Point | **Agreed: P4 doesn't pass.** Animating a parent's anchor does move its children on screen (the opposite way), but it moves the pivot, which is skill 5's idea, not a group move. Hint for § 7: "Group Null's keys are on its Anchor Point, which moves its pivot, not the null, so the group drifts the opposite way. The group's move goes on the null's Position, Scale or Rotation." No fail beyond P4, and an Anchor Point key next to a real move is fine. | Kept, with this wording |
| Layers matched by name; duplicate names renamed first | **Changes the teaching in one place.** The mentor never renames layers: the demo is the only change it makes. If two candidates share a name, the mentor asks the learner in one sentence, before the focus is agreed, to rename one ("two layers are both called Shape Layer 1; rename one so I can tell them apart"). The focus isn't set until the names are unique. A rename like this is never graded and never counts as an unexpected change. If the rename has to be the tool's, that's a second project change, and it comes back to me first. | Changed (§ 4, below) |
| A null with a moving parent of its own is refused unless SR-2 is approved | **Changes N2.** "Ask, don't fail" can't hold if the check can't measure it. Without SR-2: if the lesson's null has a parent that moves, the mentor says in one sentence that the null follows Logo, so the lesson can't check the group, and asks the learner to use a null with no parent (unparent it, or add a new one). That isn't a fail. A null whose parent doesn't move is still "ask, don't fail" if the matrix allows it, and is otherwise treated the same as a moving one. **Recommended: don't approve SR-2 this sprint.** Chains are out of scope (§ 8), so the refusal teaches nothing wrong. | Changed (N2, below) |

| D-3 Another layer shares the lesson null's name | **Agreed: the same one-sentence rename ask, never graded.** It happens at the stage 3 check, before the null is stored: "two layers are called Null 1; rename the one you just added so I can tell which is yours." The learner does it, never the mentor. The null isn't stored and nothing is parented-checked until the name is unique. Asking which layer it is wouldn't help: the check matches by name, so the answer couldn't be used. | Changed (FR-019's ask becomes the rename ask) |
| D-4 (2026-10-26, from L-1) May the mentor say where the null's anchor sits? | **Yes, as the spec writer recommended (the human's call, 2026-10-26).** L-1 logged the anchor at the square's top-left corner, on its Position, and N3 measures the anchor, so a learner who centres the square on the group's middle misses it by about 50 px each way, more than 10% of a 230 × 130 px group. The fact is about where to put the null, so it belongs in the "we do" step, not in a hint after a miss only. **Two places, the same fact:** (1) stage 3, once per lesson, after the learner names a place and before they drag: "The null's pivot is the top-left corner of its square, so put that corner on the spot." Not said for "it'll only slide"; if P5 later asks for a region, it goes with that question. (2) § 7's pivot hint, in a lesson, names the pivot by that corner: "Group Null's pivot, the top-left corner of its square, sits at the group's top-left, so the group would swing around that corner. You said the middle." That says where the pivot is, not why, so the "never a cause" rule holds. **Never** the null's size (100 × 100) or its Opacity. **Not in a review** (§ 11: no walkthrough, no "null"): the review's pivot hint says where the pivot of the layer they follow sits and what they said, nothing about the square. | Changed (§ 5 stage 3, § 7's pivot row, § 10) |

**Edits these answers make (read them as part of § 4 and § 6):**
- **§ 4, focus:** before the focus is agreed, candidate names must be unique. A duplicate gets the
  one-sentence rename ask above, and the learner does it.
- **§ 5 stage 3 and § 6, N1:** the lesson's null must have a name no other layer has. A duplicate
  gets the rename ask from D-3 before the null is stored.
- **§ 6, N2:** a lesson null with a moving parent is out of the lesson (one sentence, use a null with
  no parent). It isn't a fail and it isn't recorded as a miss. The "ask, don't fail" rule applies
  only where the check can measure the chain.
- **§ 6, "the null at parenting":** stored again at every check, and at the demo, while no focus
  layer is parented yet (D-1).
- **§ 7, new row:** null moved only on Anchor Point. The check sees that P4 fails with only Anchor
  Point keys on the null. D-2's hint applies. Evidence: inference from skill 5.
- **§ 5 stage 3, § 7's pivot row, § 10 (D-4, 2026-10-26):** the corner sentence at stage 3 and in
  the lesson's pivot hint; never the size or Opacity; not in a review. § 7's jump row also loses
  "unverified": B-4 is answered (L-1), so the one held-key question is allowed.

## 15. Round 2: the proposal rule after L-6 (2026-10-25)

**What happened (R, L-6).** The builder and the reviewer found that on Mentor Practice 2 as built
(`practice2b-with-wave-a.json`, wave A's 13 layers plus wave B's), the old rule (link within 2%,
propose the **largest** linked group, past 4 keep growing in stack order) proposed Blink, Spinner,
Cut and Badge. Wave A's layers sit close: Cut and Banner are 10 px apart, Dot 3 is 3 px from Card,
Peg 25 px from Cut, and Dot 1 and Dot 2 sit inside Door, so 13 layers chain into one cluster, and
"largest" rewards exactly that. The human chose to rework the rule rather than move layers in the
practice comp, because a learner's real comp is crowded the same way.

**What changed (§ 4, § 5 stage 1, § 11, § 13's guesses).**
- The link stays (overlap or within 2% of the comp's width on both axes).
- A cluster of 2 to 4 is a **group**; 5 or more is a **crowd**, never proposed or trimmed. This is
  the fix: a crowd is the signal that closeness can't tell the parts apart.
- Groups are ranked: text with a graphic first, then more layers, then highest in the stack. The
  "largest group" and "past 4, keep growing" parts are gone.
- The mentor says the reason ("apart from everything else"), offers the second group once after a
  "no", and with only a crowd asks the learner instead of proposing.
- What the lesson teaches, the stages, the pass and the hard rules are unchanged. The model still
  never picks the group's pivot region, never picks a focus the learner didn't name or agree to,
  and the proposal is still the tool's.

**What it gives on the fixture (worked by hand from `stand-in/build.mjs`'s declared layout, at
0 s, 1920 wide, so 38.4 px).**

| Cluster | Size | Kind | Top layer | What it is |
|---|---|---|---|---|
| Blink, Spinner, Cut, Badge, Peg, Banner, Card, Dot 1, Dot 2, Dot 3, Door, Plaque, Sign | 13 | | Blink (1) | Crowd: not proposed |
| **Tile, Caption, Stamp** | 3 | text with graphics | Tile (30) | **Group, proposed** (the only one with text) |
| Chip A, Chip B, Chip C (20 px apart) | 3 | shapes | Chip A (9) | Group, second (kept for a "no") |
| Row A, Row B, Row C | 3 | solids | Row A (33) | Group, third |
| Pause, Sled (30 px apart) | 2 | | Pause (13) | Group |
| Reveal Matte, Gradient | 2 (one pair) | | Reveal Matte | Group |
| Flag, Lid, Tab, Needle, Gauge, Wobble, Flip, Pop, Seal, Plate | 1 each | | | Neither |

Tile, Caption and Stamp's nearest proposable neighbours are Flag (140 px across), Row A (290 px)
and Plate (270 px down), so nothing chains into them. On `practice2b.json` (wave B only) the
proposal is still Tile, Caption and Stamp, and with them excluded it's still Row A to C, then the
matte pair, as the answer key has it. The hidden-Caption test still gives Tile and Stamp.

**Options weighed and not taken.**
- **A tighter or relative distance.** The links that make the crowd are 3 to 25 px; any margin
  that keeps a label padded a few pixels off its card keeps those too. Rejected.
- **Layers that move together or share key times.** The intended group doesn't share a key time
  (Tile 4.17 to 5.37 s, Caption 4.3 to 5.3 s, Stamp 4.67 to 5.67 s); the layers that share them
  exactly are Chip A to C (2 and 3 s), which are offset's lockstep, and Spinner's 4-second turn
  overlaps every centre layer in time. It would also make the rule harder to say in one sentence.
  Kept as a possible later tie-break (§ 13's guesses, open below).
- **Every pair in a group must touch** (a stricter cluster). Gives the same answer here, but it
  splits an evenly spaced stack (Chip A to C) for no teaching reason, and "sit together, apart from
  the rest" is easier to explain. Rejected.
- **Always ask, never propose.** Safe, but the design asks first anyway; the proposal is only for a
  learner with no answer, who is the one who most needs a starting point. Asking stays the fallback
  for a crowd.
- **Move layers in the practice comp.** The human's call: no, since it hides the problem.

**Open, from this round (recommended answers in the hand-back to the cockpit):**
- **L6-1** The review's new target on the live comp, after the lesson's group is parented, is now
  Chip A to C (higher in the stack than Row A to C), not Row A to C. Rows stays the answer on
  `practice2b.json`. **Recommended:** accept it; Chip A to C is a fair group to move together. If
  the human wants Rows, add "a group whose moving layers all share one move ranks after one whose
  layers move differently" as tie-break (b2), which also says why: the children keeping their own
  animation is what the lesson shows.
- **L6-2** The finder (skill 6's count for next-mentor) on a comp with only a crowd: counts 0 if it
  matches the proposal, so the skill wouldn't be suggested on a crowded comp. **Recommended:** count
  a crowd as "a group may be here" for the finder only, so the suggestion stays; the lesson then
  asks. The spec writer decides how.
- **L6-3** The text preference is a **Guess**. A first logged lesson where a learner without a group
  in mind accepts or rejects the proposal is the first evidence; log it in the usage notes.

## 16. Pacing: one idea per turn (approved 2026-10-28)

**Status: approved 2026-10-28 by the human, as written.** Proposed the same day. The items at the end
say who changes what. The opening turn (stage 1's question, spec 004 Phase 10) and the proposal turns
don't change. The three rules below are now curriculum § 2's shared turn rule for every skill.

**Answered 2026-10-28.** The human approved this section and skill 5's § 20 together, and answered
skill 5's three questions yes. One of them carries over here: a "do it for me" refusal doesn't
cancel the demo offer. A learner who asks before turn 4 gets the warm decline and the pending
action (rule 3), and turn 4 still ends on the offer, once. The other two (the slide sentence, the
A-then-Shift+P wait) are skill 5's own and don't apply here.

### The problem

R-ONE-IDEA ("each turn is a few sentences and moves one idea, ends by handing the learner something
to do") failed 7 of 9 runs of cases 02, 03 and 04 after the wording fix (`e82a7d2`), and 02, 04, 15
and 23 in the baseline (`product/evals/null-parenting/README.md`, "First full baseline" and "Fix
re-runs 2026-10-28"). The design caused it: § 5 stage 2 asks for a frame, the idea, an existing rig
as an example, what passes down and what doesn't, and why a null, and the build then ends that turn
on stage 3's two asks (add a null, and where the group turns from). "Keep it to a few sentences"
in `SKILL.md` can't hold six items. Read for this section:
- `results/2026-10-28-132609.json` (04), run 1, turn 2: a comment on the frame, the parent idea, "a
  null is an invisible layer…", Hatch follows Hatch Rig, not opacity or effects, never in the render,
  the menu path, the region question. Run 3, turn 3: the pick whip in the Parent & Link column, how to
  show the column, "not the one next to Position", "don't hold any key", the demo offer. Turn 4 (run
  2, per the judge): a pick-whip walk-through on top of the demo.
- `-132344` (03): "two tasks at once (add a null and choose the pivot)"; a claimed screen position.
- `-132156` (02): the one pass answered only the learner's two-part question and ended on a question.

Two of those pieces were already out by this design and leaked in anyway: § 8 says the only mention
of a held key is § 7's one question after a jump, and § 5 stage 2 never asked for the menu path.

### The rule (three parts, the same as skill 5's § 20)

1. **Every turn ends on one action or one answer, and carries only what that action needs.**
   Confirming the group, a one-clause note and the frame are context, not ideas.
2. **A fact goes in the turn where the learner acts on it.** If no turn acts on it, it's on request.
3. **A question or a request in place of the action gets its answer, in one or two sentences, then
   the same pending action again, in one sentence.** Never the next stage's content in that turn.
   "Do it for me" gets the warm decline and the pending action; the demo offer is still made once,
   at the end of turn 4, if it hasn't been yet (answered 2026-10-28).

### The new sequence (a lesson)

| Turn | The one idea | Carries | Ends on |
|---|---|---|---|
| 1. Opening, and the proposal turns | which layers | Unchanged (§ 4, § 15, stage 1) | The question, or the offer |
| 2. The idea, on their group | a parent carries its children | The group confirmed in one clause, with at most the focus notes (a matte counted, a layer bringing its child, a precomp), one clause each; one frame of the group at the before-read time, saying where layers sit only if the frame shows it; the idea in one sentence: "A layer with a parent takes on the parent's position, scale and rotation, but not its fade or effects, and keeps its own animation on top." | "Will Tile, Caption and Stamp turn or scale, or only slide? If they turn or scale, from where: a corner, the middle of an edge, or the middle of the group?" |
| 3. The handle (we do) | a null is a handle you park at the pivot | "Add a null with Layer > New > Null Object. A null never shows in the render, so it's a handle with no look of its own." Then D-4's corner sentence (§ 14), only when they named a place: "Its pivot is the top-left corner of its square, so put that corner on the middle of the group." For "only slides": "Since the group only slides, anywhere near it is fine." | "Say done when it's there." |
| Check | the null passes, or one hint | § 6 N1 to N3, § 7 (unchanged) | "Say done again", or turn 4 |
| 4. Parent the rest (you do, a) | parent to the handle | "Group Null's in place. Now parent Tile, Caption and Stamp to it with the pick whip in the Parent column, and say done." | Done. Then the demo offer as the last sentence: "I can parent Tile first so you can watch, if you like." |
| 4a. The demo (on a yes) | watch one | Stage 4, unchanged: frames, the demo, "It moved 0 pixels: it's exactly where it was, and its Parent column now says Group Null," Edit > Undo | "Now Caption and Stamp are yours; say done." No second walk-through |
| 5. Move the group (you do, b) | one move on the handle | The parenting pass in one clause ("None of them moved when you parented them") | "Now give Group Null one move: two keys on its Position, Scale or Rotation, and say done." |
| 6. The pass | they move as one, each with its own animation | Stage 6's frames and sentence; stage 7's comments (FR-020, unchanged) | Play it back, or the held question |
| 7. Record | | Unchanged | |

The same number of turns as now. The region question moves from the "add a null" turn to the end of
the idea turn, which takes away the two-asks turn (03) and gives the idea turn a real question to end
on. The learner has just seen what a parent carries, so "will it turn, and from where?" is the idea
put to use; it's the question skill 5 taught them to ask, and the review asks it the same way (§ 11).

**Picked up again, the review, and the missing-prerequisite sentence:** unchanged.

### What moved, what's on request, what goes

| Piece | Was | Now | Why |
|---|---|---|---|
| "A null never shows in the render, so it can't drag its own look into the group" | Stage 2 | Turn 3, with the menu path | It's the reason for the thing they're about to add |
| What a null is ("an invisible layer you add just to be that parent") | Stage 2 (the build) | Turn 3, folded into the sentence above | Same |
| Where the group turns or scales from | Stage 3, after "add a null" | The end of turn 2 | Ends the idea turn on an answer; turn 3 becomes one task |
| D-4's corner sentence | Stage 3, after the place is named | Turn 3 (still after the place is named, before they drag) | Unchanged in meaning |
| The existing rig as an example (CTRL; Hatch follows Hatch Rig) | Stage 2, alongside the frame | **On request** ("what does that look like?", "show me one"), named in words from the read | The frame of their own group already carries the idea; the rig doubled it. § 5 stage 2's frames at CTRL's keys were never buildable (the snapshot gives no null key times) |
| Not opacity or effects | Stage 2 | Turn 2, as a clause of the idea sentence | It's the idea's edge, and US1 #2 and eval 2 depend on it. Not a separate sentence |
| How to show the Parent & Link column (right-click a heading, Columns) | Stage 5 (the build) | **On request**: when they say they can't find the column, or a check finds no parent and they say they looked | Most timelines show it; said up front it's a second task |
| "There are two pick whips; not the one beside Position" | Stage 5 (the build) | **Hint only** (`pickwhip_position`, § 7) | A warning about a mistake they haven't made |
| "Hold no key while parenting" | Stage 5 (the build) | **Hint only** (§ 7's jump row, once) | § 8 already says so; the build leaked it |
| The shy note's "turn shy off to see its Parent column" | Stage 1 | Turn 4 | It's about the Parent column; turn 2 keeps "Badge is shy" |
| Any comment on the frame itself (too small, can't make it out) | Seen in 04 | **Goes** | A frame that's no use gets no sentence |
| A screen position the frame doesn't show | Seen in 03 | **Goes** (the hard rule already bans it) | |
| "Today's idea is…" before the opening question | Seen in 20 (unjudged) | Not changed here (the opening is out of scope); logged for C-5's check of skill 6 | |

**Kept exactly:** the opening and the proposal rule, "I do, we do, you do" (the learner adds and
places the null, the mentor parents one layer at most, the learner parents the rest and moves it),
the one demo and its target and timing (only after the null passes), "ask for the move only after
parenting passes" (FR-014), the hints (§ 7), the comments, the record and the review.

### What R-ONE-IDEA should see (the eval engineer's to change; this is only the intent)

- Turn 2: the frame and the confirmed group are context; the idea sentence (with its "not fade or
  effects" clause) plus the turn-or-scale question is one idea put to use. A second explanatory
  sentence (why a null, an example rig) fails it.
- Turn 3: the menu path, the never-renders sentence and the corner sentence are one task (add the
  handle and park it). A second ask fails it.
- Turn 4: the demo offer is the same action's alternative, as skill 5's watch offer.

### Rejected

- **Cap it in wording.** Tried (`e82a7d2`, "few sentences, no bullets"): 7 of 9 runs still failed.
- **Two explanation turns** (the parent, then the null, with "ready?" between). A "ready?" turn hands
  nothing to do; the null's sentence belongs with adding one.
- **"Not opacity or effects" only at the move** (stage 6, where the fade mistake happens). Tempting,
  since it's the moment of need, but it's the edge of the idea, US1 #2 and eval plan 2 test it in the
  explanation, and as a clause it costs nothing. The `opacity_move` hint covers the moment.
- **Keep the region question with "add a null".** Two asks in one turn (the judge's 03 note), and the
  learner answers one and forgets the other.
- **Ask the region after the null is added** (add; then where; then drag). One turn more for every
  learner, for no gain over asking it while the idea is fresh.

### Evidence and guesses

- **R:** the result files above; `product/evals/null-parenting/README.md` (both sections); the one 02
  pass (`-132156`, run 1), which answered one question and ended on a question.
- **R, live:** T340 and T341 passed with the old pacing, builder-only.
- **Guess:** that "will it turn or scale, or only slide?" makes sense before the null exists. Its
  words don't need the null; skill 5 is the hard prerequisite, so the question is familiar. Watch the
  next live lesson for "what do you mean, from where?".
- **Guess:** that most learners find the Parent column without being told. If live lessons show they
  don't, add "(right-click a column heading, Columns, Parent & Link, if you don't see it)" as a clause
  in turn 4, not a sentence.

### Items (approved 2026-10-28)

Numbers are `NNN`: the cockpit assigns them.

**For the builder (B-NNN), `SKILL.md` only, no tool change:**
1. Step 2: one frame of the group; the idea sentence above; no rig example (name one only when
   asked, from `left_out`'s names); no null, no menu path; end on the turn-or-scale question. Nothing
   about the frame itself.
2. Step 3: no region question (asked in step 2); the menu path, the never-renders sentence, then the
   corner sentence or the "only slides" line, then "say done". Pass the step 2 answer as `region`.
3. Step 5: "parent the rest with the pick whip in the Parent column, and say done", then step 4's
   offer as the last sentence. Showing the column only when asked or after a check with no parent
   and "I looked"; the two-pick-whips and held-key lines only through their hints.
   "Where things are": mark the Parent & Link and hold-no-key lines "say only when asked, or in a
   hint", so they aren't read as things to say up front.
4. Step 4: after the demo, hand the rest back in one sentence; no walk-through.
5. Step 1's shy note: "Badge is shy" at the focus; "turn shy off to see its Parent column" at step 5.
6. A new line under "Style": rule 3, as in skill 5, with the "do it for me" clause (the decline and
   the pending action; the demo offer still made once at the end of step 5's turn if it hasn't been).

**For the spec writer (S-NNN):**
- **US1 #2:** "uses CTRL with Title and Subtitle if the open comp has them, or one frame of the focus
  group otherwise" becomes "one frame of the focus group; an existing rig only when the learner asks
  for an example". "Not opacity or effects" stays.
- **FR-023:** "name the Parent & Link column and how to show it" becomes "name the Parent column; how
  to show it only when the learner can't find it (TD § 16)". "MAY warn against holding a key while
  parenting" narrows to the jump hint's one question (TD § 8 already says so).
- **FR-014, FR-016 (P5), FR-020, FR-022:** no change. The region is asked earlier, still never picked,
  and P5 still asks for it before grading if they skipped it.
- **Eval plan 2 and 3:** no change in what's tested; 3's question now comes at the end of the
  explanation.

**For the eval engineer (through the cockpit):** the readings above in the R-ONE-IDEA rubric; cases
02, 03, 04, 15 and 23 then re-run as they are. Case 03's `never_picks` break (run 1, "put it on")
came from the same pile: turn 2's general description of a null ("You put it on the spot the group
should turn or scale from…", `-132344`), said before the learner had named a place. With the null's
sentence moved to turn 3, after the learner names the place, that line has no reason to appear.
Turn 3's "put that corner on the middle of the group" uses the learner's own place and doesn't
match the check's "put it on".
