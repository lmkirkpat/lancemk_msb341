# Teaching design: Move a group with a null (curriculum skill 6)

**Owner:** curriculum designer (`decisions/007`). The spec writer's `spec.md` in this folder links
here and doesn't copy it. Gaps or contradictions come back as questions.
**Date:** 2026-10-23. **Status:** draft, not yet answered by the spec writer.
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

**Proposal, when the learner has no answer** (**Guess**: no evidence on how beginners group): up to 4
**candidate** layers (below) whose comp-space bounds at the current time overlap or nearly touch (R3
bounds). Name them in one sentence ("Card, Label and Badge sit together at the bottom left"). If
nothing qualifies, say so and ask the learner to make a small group to practice on (two shapes and a
text layer). Never invent a grouping.

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
| 1. Look, ask, agree a focus | names or agrees to 2 to 4 layers | Fresh read with R1 and R3. § 4. The **before read** is taken now, when the focus is set: for each focus layer, its footprint in comp space at the current time and at each of its key times (§ 6, "the before read") | A focus of 2 to 4 candidates |
| 2. Explain on their comp | watches | At least one frame, real names and times. If the comp has a null with children (CTRL), use it: frames at its first and last key, "CTRL rises 40 px and Title and Subtitle rise with it, while Title still runs its own keys." Otherwise one frame of the focus group and the idea in words. Then the two facts that matter: children inherit position, scale and rotation, **not opacity or effects**; and a null never renders, so it can't drag its own look into the group | n/a |
| 3. We do: add and place the null | Adds a null (Layer > New > Null Object), says where the group should turn or scale from (a corner, an edge center, or the middle of the group), drags the null there, says "done" | Fresh read. § 6, N1 to N3 (a null exists, 2D, no parent; its pivot is in the named region of the group). The region is the learner's intent: the mentor asks, never picks. "It doesn't matter, it'll only slide" is a valid answer: the region check is then skipped until the null's move turns or scales (§ 6, P5). The null's transform is stored now (§ 6, "the null at parenting") | N1 to N3 |
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
| Child jumps when parented | P2: a footprint off by more than 1 px | Name the layer, distance and direction, no cause: "Badge is 120 px left of where it was at 0.5 s." Then where to look: "Edit > Undo and parent it again. If the null moved after you placed it, that can show up here too." Holding a key while parenting (Option, or Shift) changes how AE places the child (C; unverified at 26.5, B-4), so it's mentioned only once B-4 confirms it | B, C, very common |
| Pick whip dragged from Position, not the Parent column | P1 fails (no parent); usually P2 too (the child snaps to the null's position); on a keyed Position, the snapshot also sees an expression appear | "Label's Parent column still says none, and it jumped to where the null is. There are two pick whips on a layer; the one for this is in the Parent column" | C, Adobe staff reply on two pick-whip columns |
| Parented to the wrong row | P1: parent is another focus layer or a different layer | "Badge follows Label, not the null" | Unverified (brief); plausible from 007 |
| Fading the null, expecting the group to fade | Null Opacity keyed, or static below 100 (R3), with children at 100 | "Opacity doesn't pass from a parent to its children, so Group Null's fade does nothing you can see. Fade each layer, or ask about precomps later" | B, very common |
| The null's "move" is Opacity, an effect, or one key | P4 fails | "The null has one Position key, so it holds still" / "only Opacity moves on the null, and children don't follow that" | B, C |
| The null's pivot far from where the group should turn | N3 fails (and the move rotates or scales) | "The null sits at the group's top-left, so the group would swing around that corner. You said the middle" | Inference from skill 5 |
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
  column shortcut: not taught. Unparenting is mentioned only if the learner asks how to undo a parent
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
| Pick-whip link instead of a parent | P1 fails: R1's parent is the Parent link only. The child usually snaps to the null's Position (P2). On a keyed Position the expression flag appears; on an unkeyed one it doesn't (R2) | Count an expression-linked follower as parented |
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
| Hidden null (eye off) | Correct, class *null*; it still carries its children (Edge Cases table) | Say "you've hidden this", or drop it from the map |
| Eye-off child | Only if the learner wants it; P2 works from bounds, not pixels | Make it the demo target or claim it's visible in a frame |
| Matte and its layer | Proposed together (§ 4); both must pass P1 to P3; the matte isn't "hidden" | Leave the matte behind, or call it hidden (KD-001) |
| Shy child or shy null | Renders (or carries) as usual; one sentence that it's hidden in the timeline | Treat shy as not rendering |
| Guide layer | Not a candidate | Count it as visible |
| Solo on another layer | The class describes the layer itself | Call unsoloed layers hidden |
| Non-uniform parent scale | Named (§ 7) when the read sees it; P2's corners catch any distortion that makes a child move on screen at parenting | Fail on it alone |
| Null opacity below 100 | § 7's fade hint; never affects P1 to P5 | Pass P4 on it |
| The null itself has a parent | N2 (ask, don't fail); the map shows the chain | Grade beyond one level |
| Focus layer already parented | Not a candidate (§ 4) | Re-parent it silently |
| 3D null or 3D child | N2 or the candidate rule says 3D is out | Run the 2D math on a 3D layer |
| Auto-orient on a child | Rotation read after expressions doesn't include auto-orient (**Guess**, B-6); leave such a layer out of the focus until B-6 is checked | Run P2 on a rotation the read can't see |
| Stacked parent and child motion (DX-08) | When the null's move overlaps a child's own Position keys in time, one ungraded sentence: "Label's own rise and the null's move overlap from 1 to 2 s, so Label moves twice there; play it back and see." FR-037 hand-off only if skill 4 is learned (not this sprint) | Fail it, or call it a jump |
| Children of a moving parent (offset's blind spot until R1) | Skill 6 reads R1, so it has no such blind spot: it knows every focus layer's parent, and the map lists the null as a source of each child. It doesn't teach staggering. After this lesson the group's shared move lives on the null, which is what skill 3's post-R1 rule names ("they share Group Null's move") | Grade timing between children, or claim the children move apart |
| Dragging the null to a new spot after parenting | The group moves with it: that's the null working. P2 uses the null at parenting, so it isn't a jump | Call the group's move a jump |

## 10. Version notes (After Effects 26.5, macOS 27.0.1)

- **Null defaults** (size, where its anchor sits, how it draws in the comp panel): CS-era text says
  100 × 100 with the anchor at the top-left (brief, VERSION). Unverified at 26.5 (B-4). The mentor
  doesn't describe them. It speaks of "the null's anchor point" as its pivot, and N3 measures the
  anchor, so the defaults don't change the check.
- **Making a null:** Layer > New > Null Object (menu path, stable across sources). No shortcut quoted.
- **The Parent & Link column:** name the column and how to show it (right-click a column heading,
  Columns, Parent & Link). Don't quote Shift+F4 (function keys on a Mac may need fn). Newer layouts
  show two pick-whip columns (C, Adobe staff): say "the pick whip in the Parent column".
- **Option or Shift while parenting** changes whether the child keeps its place (brief, step 6; C).
  Unverified at 26.5 (B-4); not taught.
- **25.4 Quick Offset** "shifts layers without altering keyframe animations" (A, via search); with
  parented layers it's unverified. Not used in this lesson.
- **26.5:** no parenting changes found (A, community announcement).

## 11. Review (stretch this sprint; designed now so the first build includes it)

Plan.md says each skill's first build should include its review mode, because a later branch that
edits the merged tool file gets flagged (`check-branch.mjs`). So the review is specified in full here
even though skills 5 and 6's reviews are stretch (H2).

- **When:** spec 004 FR-019 to FR-021.
- **New target:** 2 to 4 candidates (§ 4) that aren't parented and aren't in the record for this
  skill on this comp, that look like a group (the § 4 proposal rule) or that the learner names. No
  group, no review offered; it stays due. A group already parented to a null isn't a target
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
  doesn't say "use a null". Recorded as a review that didn't pass; "learned" stays.
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
  check; until then the mentor says none of it (§ 10).
- **B-5** R1 must carry **null**, **3D** and **layer kind** (text, shape, precomp, solid,
  adjustment), not only the switches listed in curriculum § 5. **Recommended:** add them to R1;
  the visibility class already needs null. An effect count per layer would let § 7's effect row fire
  on unkeyed effects; nice to have, not needed for the pass.
- **B-6** Does a rotation read after expressions include auto-orient? **Recommended:** check once;
  until then auto-oriented layers stay out of the focus.
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

**Guesses:** the proposal rule (bounds that overlap or nearly touch) when the learner has no group in
mind; "the null re-placed between stage 3 and parenting" being rare enough to handle by hint wording;
auto-orient's interaction with the rotation read.

**Curriculum items this design settles or moves:** B7 (set parent, no jump), B9 (moved to B-2, and
no longer blocking the design), § 9's null-defaults row (B-4), § 13's FR-029 correction (refined by
S-1 to S-3).

## 14. Answers to the spec writer, round 1 (2026-10-23)

| Q | Answer | Spec default |
|---|---|---|
| D-1 Re-store the null at every check where no focus layer is parented yet | **Agreed.** It's better than my stage 3 or demo rule: a learner who moves the null after placing it but before parenting no longer sees a false jump. § 6's "null at parenting" now means the null as stored at the **last check (or the demo) before any focus layer was parented**. The leftover case: the learner re-places the null and parents without saying "done" in between. That case stays with § 7's jump hint, which already mentions a moved null. | Kept (FR-012 as proposed) |
| D-2 A null animated only on Anchor Point | **Agreed: P4 doesn't pass.** Animating a parent's anchor does move its children on screen (the opposite way), but it moves the pivot, which is skill 5's idea, not a group move. Hint for § 7: "Group Null's keys are on its Anchor Point, which moves its pivot, not the null, so the group drifts the opposite way. The group's move goes on the null's Position, Scale or Rotation." No fail beyond P4, and an Anchor Point key next to a real move is fine. | Kept, with this wording |
| Layers matched by name; duplicate names renamed first | **Changes the teaching in one place.** The mentor never renames layers: the demo is the only change it makes. If two candidates share a name, the mentor asks the learner in one sentence, before the focus is agreed, to rename one ("two layers are both called Shape Layer 1; rename one so I can tell them apart"). The focus isn't set until the names are unique. A rename like this is never graded and never counts as an unexpected change. If the rename has to be the tool's, that's a second project change, and it comes back to me first. | Changed (§ 4, below) |
| A null with a moving parent of its own is refused unless SR-2 is approved | **Changes N2.** "Ask, don't fail" can't hold if the check can't measure it. Without SR-2: if the lesson's null has a parent that moves, the mentor says in one sentence that the null follows Logo, so the lesson can't check the group, and asks the learner to use a null with no parent (unparent it, or add a new one). That isn't a fail. A null whose parent doesn't move is still "ask, don't fail" if the matrix allows it, and is otherwise treated the same as a moving one. **Recommended: don't approve SR-2 this sprint.** Chains are out of scope (§ 8), so the refusal teaches nothing wrong. | Changed (N2, below) |

**Edits these answers make (read them as part of § 4 and § 6):**
- **§ 4, focus:** before the focus is agreed, candidate names must be unique. A duplicate gets the
  one-sentence rename ask above, and the learner does it.
- **§ 6, N2:** a lesson null with a moving parent is out of the lesson (one sentence, use a null with
  no parent). It isn't a fail and it isn't recorded as a miss. The "ask, don't fail" rule applies
  only where the check can measure the chain.
- **§ 6, "the null at parenting":** stored again at every check, and at the demo, while no focus
  layer is parented yet (D-1).
- **§ 7, new row:** null moved only on Anchor Point. The check sees that P4 fails with only Anchor
  Point keys on the null. D-2's hint applies. Evidence: inference from skill 5.
