# Curriculum: After Effects skills beyond easing (teaching design)

**Owner:** curriculum designer (`decisions/007`). The spec writer's `spec.md` in this folder links
here and doesn't copy it. Questions or contradictions come back as questions; this file is changed
only by its owner.
**Date:** 2026-10-20. **Status:** caught up with spec 004 as approved on 2026-10-20 (H1, H2 and
spec 004's Q1 to Q3 answered; sections 3, 5, 6, 9, 12 and 13).
**Inputs:** the 15 briefs in `discovery/curriculum-research/`, `discovery/diagnosis-evidence.md`,
`specs/005-diagnosis/spec.md` (draft, branch `worktree-agent-a4ba74721dd169ee2`),
`discovery/usage-notes/adobe-assistant-2026-10-08.md`, interviews 007 and 008, `discovery/insights.md`,
`.claude/skills/ease-mentor/SKILL.md`, `mentor/jsx/snapshot.jsx`, `mentor/dev/build-practice-comp.jsx`.

Evidence tags follow the briefs: **A** official Adobe (mostly search excerpts, since helpx returned 403),
**B** established teaching, **C** one tutorial or forum thread, **P** practitioner knowledge with no
source, **R** repo evidence (interviews, usage notes, code). **Guess** marks a design call with no
evidence behind it. Guesses also show up under open questions.

---

## 1. Who this is for and where they get stuck

The learner is persona 1, the skill-builder: a designer who comes from Illustrator or Photoshop and
is adding motion to real work (titles, lower thirds, logo stings, social posts). The builder is user
#1 and is at this stage now.

Where they get stuck, by evidence:

- **They can't find what broke.** "it maybe took more time to find the error than to find a video
  that would help" (007, Did). "Everything is like hidden" (007). This is the strongest After Effects
  evidence we have, and it's one source.
- **Motion that is technically animated but reads as mechanical.** Adobe's 8 findings on Mentor
  Practice: equal durations, things landing on the same frame, stacked parent motion, a middle-key
  jolt, a fade where a cut was meant, an expression over keys, dead time, no motion blur (R, one
  builder-run session).
- **Help written for another version.** "versions of Photoshop that's like 2014 where nothing looks
  the same" (008, Did; belief 16, Hunch). In After Effects this is concrete for track mattes (23.0),
  H.264 from the Render Queue (23.0), Quick Offset (25.4), Quick Set Anchor (beta) and Effect Controls
  (26.5).
- **They learn what the project needs.** "I learn only the things that I need to complete a project"
  (008, Weak, after the pitch). So every skill starts on the learner's own comp, and diagnosis can
  pull a skill forward when the comp needs it (section 4).

## 2. How every skill teaches (same method as `/ease-mentor`)

Every skill uses the easing lesson's shape, so a learner who has done one lesson knows how the next
one runs. Per skill (section 6), this file fills in only what changes.

| Stage | Learner does | Mentor checks |
|---|---|---|
| 0. Remember | nothing | The learner record for this skill: first lesson, practicing (pick up what was still off), or learned (offer a review, below). |
| 1. Look and propose a focus | agrees to a focus or picks another | The skill's focus rule finds candidates in a fresh read. It proposes one layer (two at most) and says what it's leaving out and why (hidden, inside precomps, can't read). |
| 2. Explain on their comp | watches | Explains with at least one frame from inside the focus, using real layer names and times. Asks about intent wherever intent can't be read (section 6 marks these). |
| 3. I do (one demonstration) | watches, can Edit > Undo | Only when asked or clearly stuck. One change, on the skill's demo target. If the focus has only one target, there's no demo: the mentor walks it through in words (the easing rule for a single pair). |
| 4. We do / you do | does the rest with their own hands, says "done" | A fresh read and diff. Credits the demo to the demo. For anything still off, gives a hint (which layer, property, time, what to look for), never the fix. Declines "do the rest" warmly. |
| 5. Record | nothing | One lesson entry: what was attempted, what the checks showed, one "next". No method, no motive, no personal details. |

**Review across sessions (the practice part).** Each skill defines a **review check**: in a later
session, on a target the learner hasn't done before, the mentor asks them to apply the skill with no
demo and no walkthrough, then checks it the same way. That's what Adobe's assistant has no way to do
today (it described no memory of the learner, 2026-10-08). When the review runs (spacing, triggers) is
up to the spec writer. What the review checks is fixed per skill below.

Three rules for every review (round 1):
- **"No walkthrough" doesn't mean "no questions".** Where a skill asks about intent (1: what should
  snap; 5: where the hinge is; 3: what order), the review asks too. Without the question, the check
  grades a guess.
- **No new target, no review.** If the comp has nothing new to practice on, the review isn't offered
  and stays due. It isn't counted as missed or failed.
- **A failed review doesn't reteach.** It gives the skill's normal hints. The learner can then ask
  for a practice lesson, which may have a demo.

**Why each skill's "why" names depth and memory.** Restraint and leading are product choices Adobe
could copy with a mode switch (`decisions/002`, CLAUDE.md next step 2). What's harder to copy is
(a) depth: per-step checks on data Adobe's assistant couldn't read on 2026-10-08 (key types, ease,
influence), and (b) memory and practice across sessions. Where a skill's depth edge is small (Adobe can
read the same data), section 6 says so plainly instead of claiming one.

## 3. Decision: where "what's animating or hidden here?" lives

All four research groups suggested this skill early. **Decision: split it.** Diagnosis owns the
*telling*. The curriculum owns a skill that teaches the learner to *find it themselves*, and that
skill covers motion sources only, not visibility.

| Part | Lives in | Why |
|---|---|---|
| Reading the whole comp and saying what's off: at most 3 findings, no change to the project | Diagnosis (spec 005, DX-01 to DX-09) | That's spec 005's scope. The light "what's wrong here?" opening from CLAUDE.md next step 2 is a diagnosis entry, not a lesson. |
| The shared read of where motion comes from (parent, expressions on any property, keys inside precomps) | Built once, used by both (section 5, R1, R2, R4) | Diagnosis needs it for DX-06 and DX-08 and for its "not checked" list. The skill needs it as its answer key. |
| Teaching the learner to trace a layer's motion to its source themselves | Curriculum skill 4, **Find what's moving it** | 007's cost was hours of not finding the cause. A tool that only tells you leaves you just as stuck next time it's not open. Teaching the trace is the part that sticks, and it's the part the record can practice (review: "trace this one before I tell you"). |
| Whether a layer renders (eye, guide, solo) and "why can't I see it" | Diagnosis, and later a render skill | It's a second idea: visibility, not motion. Keeping it out keeps skill 4 to one idea. Tracing a source only touches shy layers, because a shy parent hides the source from the timeline. |

**Session openings (builder's call, 2026-10-20).** In a Claude Code session started without a named
skill, the diagnosis opening comes first, and the path's skill recommendation applies only when the
comp has no findings. The builder treats that entry as low priority, so this design doesn't expand
on it.

Reasons it's not *only* diagnosis: spec 005 says diagnosis never changes the project and has no demo
of its own (FR-011). So it can hand off but it can't teach. Its own handover rule (FR-012) expects a
skill to hand to for DX-06 and DX-08, and skill 4 is that skill.

Reasons it's not *only* a curriculum skill: a skill needs a focus and a pass condition. "Tell me
everything wrong" has neither, and spec 005 has already built that job.

**Where it sits on the path.** Its only hard prerequisite is setting keyframes, so diagnosis can pull
it forward at any point (FR-020). Its default place is 4th, after three skills about how motion
feels. By then the learner's comp usually has parents, expressions or precomps to trace. That
default is a **guess**. 007 suggests earlier (open question H3).

**Least sure about:** whether a lesson whose "you do" is *naming* sources, not changing the comp,
teaches well. The check is real (the learner's answer against the read), but it's a quiz on their own
comp, which no other skill is. See open question H4.

## 4. The path

Easing (built, `easing.basic`) stays. Setting keyframes stays the assumed prerequisite (panel spec 003
FR-010 shows it as done). It isn't one of the 10 (section 7).

| # | Skill | The one idea | Hard prerequisites | Soft |
|---|---|---|---|---|
| 0 | Easing (built) | Ease slows motion into and out of keys | keyframes | |
| 1 | **Pick the key type on purpose** | Hold for a jump or cut, linear for constant motion, ease for the rest | easing | |
| 2 | **Shape the ease in the speed graph** | Influence sets how long an ease lasts, so a soft landing is a long ease into the last key | easing | 1 |
| 3 | **Break the lockstep with offset** | Shift when things start, a few frames apart, so they don't all move together | easing | |
| 4 | **Find what's moving it** | A layer's motion can come from its own keys, a parent, an expression, or keys inside a precomp. Trace it before changing anything | keyframes | 1–3 |
| 5 | **Set the pivot (anchor point)** | Rotation and scale turn around the anchor point. Move it with Pan Behind so the layer doesn't jump | keyframes | |
| 6 | **Move a group with a null** | A parent carries its children's position, scale and rotation while they keep their own animation. A null is a handle for that | 5 | 4 |
| 7 | **Draw it on with Trim Paths** | Animating Trim Paths End from 0 to 100% draws a shape's stroke on | easing | |
| 8 | **Show one layer through another (track matte)** | A matte layer's shape (alpha) or brightness (luma) decides where another layer shows, and the matte hides itself by design | a shape or text layer to use | 7 |
| 9 | **Animate letters with a text animator** | An animator changes a property across letters, and animating its range selector (not the property) makes the letters go one after another | easing | 3 |
| 10 | **Precompose and open the right level** | Precomposing moves layers and their keys inside a new comp that acts as one layer. You edit the animation by opening it | 4 | 6, 8 |

### Why each prerequisite edge exists

- **Easing → 1.** Hold only means something next to easing's words: linear is constant speed, ease
  is natural, hold is "neither, on purpose" (keyframe-types brief, B order). And the easing check
  already treats held pairs as "skip", so a learner who has eased has already seen hold as a
  separate state.
- **Easing → 2.** Every graph lesson starts with "you applied Easy Ease, now look at what it did"
  (graph-editor brief, B spine, and Adobe's own teaching order on 2026-10-08).
- **1 → 2 (soft).** Handles exist only on bezier keys. A learner who knows linear and hold keys have
  no handles doesn't get stuck on "nothing to drag" (C, "often").
- **Easing → 3.** Offsetting moves that are still linear still reads mechanical, and the check would
  be grading two things at once. Spacing is largely what easing produces (timing brief). The brief
  notes that offset could come first as a quick win. That's a reasonable alternative, and I chose
  against it so one lesson grades one thing.
- **Keyframes → 4, nothing more.** Skill 4 teaches *recognizing* each source, not making one, so it
  doesn't need parenting, expressions or precomps to be taught first. Skills 1–3 are soft
  prerequisites only so the learner has a comp with several moving layers.
- **5 → 6.** The parent's anchor is the pivot for the whole group. And "Position is where the anchor
  sits in the comp; Anchor Point is where it sits inside the layer" (anchor brief, C, plus Adobe's
  "each layer's own space", R) is the same idea that explains why a child jumps when you parent it.
- **4 → 6 (soft).** A learner who has traced a parent as a source has already seen why a null is
  better than a visible parent.
- **Easing → 7.** A draw-on only looks right eased, and Trim End is the classic second place easing
  applies (shape-layers brief). The Bar's Trim End in Mentor Practice is already in the easing
  findings.
- **7 → 8 (soft).** A matte needs a layer with real alpha. A learner who has built a shape layer and
  knows Fill lives in its Contents can see why "a shape with fill set to None" cuts nothing (the most
  common matte failure, C, several threads).
- **Easing → 9, 3 → 9 (soft).** The selector's keys get eased. The range selector is offset done
  automatically across letters, so skill 3's idea comes back at letter scale.
- **4 → 10.** "Keys inside a precomp" is one of skill 4's four sources. A learner who has already
  pressed U on a precomp, seen nothing and then opened it won't conclude their keys are gone (the
  top precomp mistake, precomps brief, A plus B).
- **6 → 10, 8 → 10 (soft).** Precomposing a layer away from its parent or matte breaks the link.
  Knowing both makes the warning step make sense. "Group by parent vs group by precomp" is the
  contrast the brief recommends.

## 5. Build order, and the reads to build once

### This sprint's baseline and build order (H2, answered 2026-10-20)

The builder set this sprint's baseline at **five skills, 2, 1, 3, 5 and 6, plus reviews for skills
2, 1 and 3**. Reviews for 5 and 6, and skills 4 and 7 to 10, are stretch or next sprint. In the
builder's words: "to make the sprint goal feasible in the timeline of the sprint and to make sure
that I can execute on the sprint goal with quality. I would rather cut back on what I'm doing and
execute well than rush and have a low quality output."

The build order follows spec 004's waves:

1. **Wave A:** skills 2, 1, 3 (below, "First skills").
2. **Wave B:** reads R1 and R3 (with the visibility classification and the parent-chain step of the
   motion-sources map), then skill 5, then skill 6 (5 is 6's hard prerequisite).
3. **Reviews:** for 2, 1 and 3 in the baseline; for 5 and 6 as stretch.
4. **Then the rest:** R2 and R4 with skills 4 and 10, then R5, R8, R6 with 7, 8, 9.

Nothing about the path changes. Skill 4 stays 4th in the path; it's built later only because it
needs the most new reads. Until it's built, the hand-off to it (section 6, skill 4) never fires, and
skills 5 and 6 name a parent or expression in one sentence and carry on.

### First skills to build (wave A)

Chosen for **no new After Effects reads** (they run on what `snapshot.jsx` reads today: key times,
in and out types, temporal ease and influence, values, the expression flag on keyed properties) and a
natural "I do one, you do the rest" (a focus with several targets).

1. **Shape the ease in the speed graph (2).** No new read: influence per key is already read. It has
   the clearest depth edge: on 2026-10-08 Adobe's check left 7 properties "unconfirmed" because it
   couldn't read ease. Title alone has 4 pairs, so demo one and the learner shapes the rest. It also
   uses memory well, by choosing pairs the learner eased in an earlier lesson.
2. **Pick the key type on purpose (1).** No new read: in and out types are read, and analysis
   already classifies held pairs. Needs a demo write tool (set one pair to hold). Mentor Practice has
   no fade-that-should-be-a-cut target (the Cursor is built all hold), so it needs a practice target
   (open question B1).
3. **Break the lockstep with offset (3).** No new read: key times are read. It needs new
   cross-layer analysis (compare first-key times across layers and across one layer's properties),
   and spec 005's DX-02, DX-03 and DX-07 already need the same analysis, so build it once. Precomp
   layers are named as not checked until R1 (layer in and out points) exists. Per spec 005, parents
   and in and out points are new reads, not existing ones.

All three extend the easing analysis. If they're built in parallel, give the shared analysis code one
owner first, or split it per skill (open question B6).

### Shared reads (build once, before the rest run in parallel)

Every read below is new to the mentor's `snapshot_project`. Some are reachable today only through the
`after-effects` bridge tools, which lessons don't use (spec 005 verified this 2026-10-20, correcting
the parenting and timing briefs).

| Read | What it returns | Used by skills | Also used by |
|---|---|---|---|
| **R0 Version** | AE version and OS (for shortcuts). Nothing personal | every skill (version traps, section 9) | diagnosis |
| **R1 Layer relations and switches** | parent, shy, solo, guide, locked, in and out points, stretch and time remap, track matte target and type, "is a matte", motion blur | 3 (precomp layers, in point), 4, 6, 8, 10 | DX-08, DX-09, easing (matte fix, below) |
| **R2 Expressions on any property** | every property with an expression, keyed or not: on or off, text, error | 4; overlap checks in 1, 2, 3, 7, 9, 10 | DX-06, the not-checked list |
| **R3 Static transforms and bounds** | anchor, position, scale, rotation, opacity when unkeyed; layer bounds in comp space at a time | 5, 6, 8 (matte opacity) | |
| **R4 Inside precomps** | the same snapshot, recursively, for each precomp's source comp; how many places it's used; duration and size | 4, 10; lifts easing's "I can't see inside these yet" | diagnosis not-checked list |
| **R5 Shape contents** | groups, paths, fill and stroke on or off and stroke width, operators (Trim Paths, Repeater) and where they sit, group eye switches | 7, 8 (does the matte shape have a fill?) | |
| **R6 Text animators** | animators, their properties and values, selectors (Start, End, Offset, Based On, units), animator on or off | 9 | |
| **R8 Mask count (light)** | number of masks and mode per layer | 7 (a mask was made instead of a shape), 8 (a mask on the matte) | |

Not needed for the 10: **R7 spatial tangents and roving** (for motion paths, deferred).

Two shared rules to build with the reads, so no skill invents its own filter (CLAUDE.md "Edge cases",
the T023 lesson):

- **One visibility classification**, from R1: *renders* / *hidden by the learner* (eye off, not a
  matte) / *matte* (eye off by design, its motion still shows) / *guide* (doesn't render) / *shy*
  (renders, hidden only from the timeline) / *null* (never renders, still carries children). Today
  `hidden_layers` means "eye off", so **easing would skip a moving matte (a wipe) as hidden**. That's
  a live regression once mattes are taught (open question B3).
- **One "motion sources" map per layer** (own keys, parent chain, expressions, precomp contents),
  from R1, R2 and R4. Skill 4's answer key, skill 6's checks and DX-06 and DX-08 all read it. Spec
  004 FR-014 builds it in two steps: own keys and the parent chain with R1 (wave B), then expressions
  and precomp contents with R2 and R4 (for skill 4). **Skill 6 needs only the first step** (section
  6, skill 6, Reads).

**Contract risk.** R2 and R4 widen what the snapshot returns. Easing's findings must not change on
Mentor Practice (25/25 baseline). Unkeyed expression properties must not become easing findings.

## 6. The skills

Each skill: the idea, why, outcome, focus, steps, pass, mistakes, what it doesn't teach, reads, and
review. Overlaps are in section 8, version traps in section 9. The record IDs are suggestions. The
skill builder names them in `mentor/tools/`.

### 1. Pick the key type on purpose (suggested `keyframes.types`)

- **Idea:** the key's type decides how the value travels. Hold makes it jump, linear runs at constant
  speed, ease is natural. Choose one on purpose.
- **Why:** a blink that fades, a cut that dissolves, and a constant spin that got eased are all type
  mistakes. Adobe's assistant couldn't read key types on 2026-10-08, so it could only guess. It said
  the Cursor "ramps evenly" while the comp script builds that Cursor all hold (claim to verify, open
  question B2). Knack checks the type of every pair. Memory: the review checks whether new on/off
  changes are held without prompting.
- **Outcome:** can turn a pair into a hold for an on/off or cut change, and leave a constant-speed
  move linear on purpose, without help.
- **Focus:** the mentor can't read intent, so it **asks**: "Is anything here meant to snap, like a
  blink or a cut?" Candidates are opacity pairs going between 0 and 100, and step-like values. If the
  learner names nothing, offer to practice on a short blink (3–4 opacity keys) they make.
- **Steps:** *I do:* set one focus pair to hold, show a frame on each side of the key ("it snaps at
  0.5 s"). *You do:* hold the rest of the focus pairs. *Understanding check:* "Is there a move here
  that should run at constant speed?" If the learner names one, the check is that it stayed linear
  (it's not eased away). Graded only if they name one.
- **Pass:** every focus pair is held (the first key's out type is hold), counting the demo. No hold
  on a pair the learner said should move.
- **Mistakes:** hold left on a first key, so the layer sits still and then snaps ("my animation is
  stuck", C). Wanting a cut and getting a fade (C). Selecting all keys and holding everything (C).
  Wording trap: some teaching uses Layer > Time > Freeze Frame for "hold", which is a different
  feature (keyframe-types brief). Never use that wording.
- **Not taught here:** auto, continuous and plain bezier (spatial, deferred motion paths); roving;
  loopOut to keep a blink going (deferred expressions); the Graph Editor (skill 2).
- **Reads:** none new. A demo write tool (set interpolation on one pair).
- **Review:** a new opacity on/off change on another comp is held without a hint.

### 2. Shape the ease in the speed graph (suggested `easing.speed_graph`)

- **Idea:** Easy Ease is a starting shape. Influence sets how long the ease lasts, so a soft landing
  is a long ease into the last key and a quick start is a short ease out of the first.
- **Why:** "Easy Ease is only a starting point" (Adobe's assistant). But its check of the learner's
  shaping came back "unconfirmed" because it can't read ease. Knack reads in and out influence on
  every key, so it checks each pair's shape. Memory: it picks pairs the learner eased in an earlier
  lesson ("you eased Title's Position last week; now make it land softly"), and reviews whether new
  eases are shaped or left at the default.
- **Outcome:** can shape a pair so it starts quickly and lands softly (unequal influence, longer on
  the landing key), and can say where the move is fastest, without help.
- **Focus:** eased pairs on Position or Scale, preferring pairs the record says the learner eased. A
  pair that is still linear is first sent to easing.
- **Steps:** *Read first (the "reading" half, checked):* the mentor can't see the Graph Editor (UI
  state isn't readable), so it asks the learner to open it, pick Edit Speed Graph, and say where the
  move is fastest. The check is their answer against the ease data (with Easy Ease, the middle).
  *I do:* shape one pair (for example a short ease out of the start, a long ease into the landing,
  like Adobe's 15/80 demo) and show frames early and late in it. *You do:* shape the other focus
  pairs. Keyframe Velocity is offered as the way to type exact numbers.
- **Pass:** every focus pair: the landing key's incoming influence is clearly longer than the start
  key's outgoing influence (the spec writer sets the margin), neither end is still at the default on
  both sides, and both keys are still bezier.
- **Mistakes:** not knowing which graph you're in, so a handle "goes the wrong way" (C, common).
  Handles missing because the keys are linear or hold (C). Near-100% influence on both ends, which
  floats and then jumps (inference). Judging by scrubbing, not playback (B habit).
- **Not taught here:** the value graph, overshoot and bounce; separating dimensions to edit the value
  graph; the jolt at a middle key (DX-04) and Rove Across Time (deferred "Smooth a middle key").
  Diagnosis can point at the jolt, and until then it hints.
- **Reads:** none new. A demo write tool (set influence on one pair; extend `set_ease`).
- **Review:** on a new move, the learner shapes a soft landing with no demo.

### 3. Break the lockstep with offset (suggested `timing.offset`)

- **Idea:** motion reads as designed when things don't all start together. Shift layers (or one
  layer's properties) a few frames apart.
- **Why:** equal start and landing frames were among Adobe's top findings (R). Honestly, Adobe can
  read key times too, so the depth edge here is small. The difference is that the learner does it,
  each layer is checked, and the record notices lockstep coming back on new comps (spec 005's
  pattern rule, FR-020). The edge is memory and practice, not depth.
- **Outcome:** can stagger a group of moves so no two start on the same frame, keeping each layer's
  properties moving together unless they mean to split them, without help.
- **Focus:** one kind per lesson. Default: 2–5 layers whose first keys share a time. Alternative:
  one layer's properties that start and land on the same frames (Title Scale and Opacity, DX-03).
  The mentor points out the pattern ("all four start at 0.5 s"). The learner picks the gap and the
  order.
- **Steps:** *I do:* shift all of one layer's keys by the learner's chosen gap, and show frames
  before and after. *You do:* offset the rest. *Hint path:* if only some of a layer's properties
  moved (Position late, Opacity early, so it pops in), point at the one left behind.
- **Pass:** no two focus layers (or properties) start on the same frame. Within a shifted layer, all
  its animated properties moved by the same amount, unless the learner said otherwise. "The same
  frame" is a floor for lockstep, not a target: the mentor never says "2 frames is enough", and the
  learner picks the gap. The floor is defined in time as well as frames, so that at 60 fps it isn't
  half as long as at 30 (round 1, C3). Uneven gaps get a comment on the rhythm, **never a fail**. Taste is the learner's (`decisions/002` restraint;
  timing brief Q3).
- **Mistakes:** everything in lockstep (R, builder-only). Offsetting one property but not the ones
  that belong with it (P). Moving a layer's in point while its key times stay put, or the reverse
  (C). The check reads key times, so the method doesn't matter.
- **Not taught here:** varying durations (DX-02, deferred "Vary durations"); Sequence Layers;
  delay expressions; follow-through; dead time (DX-07, diagnosis hints only).
- **Reads:** none new for the focus. New cross-layer analysis, shared with DX-02, DX-03 and DX-07.
  R1 later, for precomp layers' in points. A demo write tool (shift one layer's keys).
- **Review:** a new set of entrances on another comp starts staggered with no prompt.

### 4. Find what's moving it (suggested `motion.sources`)

- **Idea:** a layer's motion can come from four places: its own keys, a parent, an expression, or
  keys inside a precomp. Trace it before changing anything.
- **Why:** 007's hours went into finding the cause. Adobe's assistant can answer "why is this layer
  moving" for you, so the depth edge is small. The edge is that the learner can do it without any
  tool open, and the record practices it: in later lessons of any skill, when a source is hidden,
  the mentor asks the learner to trace it first.
- **Outcome:** for a layer in their own comp, can name every source of its motion and where they
  found each one, without help.
- **Focus:** 2–3 layers whose motion comes at least partly from somewhere other than their own keys.
  In Mentor Practice: Title (own keys plus the CTRL parent), Logo (an expression over its keys),
  Icon (keys inside a precomp).
- **Steps:** *I do:* trace one layer out loud with a frame: its own keys, then the Parent column,
  then expressions, then "is it a precomp? open it". Which order is best is a **guess**. The
  parenting brief says "check parent first". *You do:* trace the other focus layers and say what's
  moving each one. No project change, and so no demo write tool.
- **Pass:** for each focus layer, the learner names every source in the motion-sources map and
  nothing that isn't there. Their own words count, and the check is the meaning, not the
  vocabulary.
- **Mistakes:** pressing U on a precomp, seeing nothing, and deciding the keys are gone (A plus B).
  Keys showing but not driving because an expression is on (C, staff-answered). A child that moves
  with no keys of its own, because the parent moves it (B, Meyer; R, Adobe's stacked-motion finding).
- **Not taught here:** fixing any source (each fix belongs to its own skill, or to diagnosis hints);
  whether a layer renders (eye, guide, solo); writing expressions; time remap. A shy layer is covered
  only as "the source may be hidden from the timeline".
- **Reads:** R1 (parent, shy), R2, R4, and the shared motion-sources map.
- **Review:** in a later lesson, the learner traces an unfamiliar layer before the mentor explains
  it.
- **Hand-off from other skills (round 1, C5):** inside another skill's lesson, the mentor asks
  "trace this one first" only when all three hold: (a) a source other than the layer's own keys
  (expression, parent, precomp) affects that lesson's focus or its check; (b) skill 4 is learned;
  (c) it hasn't already asked this lesson. At most once per lesson. Otherwise it names the source in
  one sentence and carries on. It isn't a detour, and an unlearned skill 4 is never forced in
  mid-lesson.
- **Claim to verify before teaching:** whether **U** shows properties driven only by an expression.
  The expressions brief says no and to use EE ([B]). My memory is that U shows "keyframes or
  expressions". Test it on the builder's version (open question B4).

### 5. Set the pivot (suggested `transform.anchor`)

- **Idea:** rotation and scale turn around the anchor point. Move it with Pan Behind so the layer
  stays where it is.
- **Why:** "I rotated it and it swung wide" is the most common rotation failure (C, "very common").
  Adobe's assistant said screen-position samples didn't work "because those numbers are in each
  layer's own space". Knack can compute comp space, so it can check that the anchor moved and the
  layer didn't. That's a real depth edge. Memory: the review checks whether the anchor is set before
  rotation keys on a new layer.
- **Outcome:** can put a layer's pivot where the motion needs it (a hinge edge, a corner, a base)
  without the layer moving, without help.
- **Focus:** a layer the learner wants to rotate or scale from somewhere other than its center. The
  mentor **asks** where the hinge is. Regions are the nine positions (corners, edge centers, center),
  which also match Quick Set Anchor. Prefer a layer with no Position keys yet (open question B5).
  Avoid shape layers until their two anchors are tested.
- **Steps:** *I do:* move one layer's anchor to its hinge with Position compensated, and show a frame
  where the layer hasn't moved, then a rotated frame. *You do:* the learner's layer, with Pan Behind
  (Y).
- **Pass:** the anchor is in the named region of the layer's bounds, and the layer's comp-space
  footprint at the current time is unchanged. Measure "in the region" **on each axis against that
  axis's own size** (width for left and right, height for top and bottom). On a thin layer like an
  800 × 60 bar, one tolerance taken from the larger side would make top-left, left-center and
  bottom-left the same place.
- **Mistakes:** typing a new Anchor Point value or dragging with the Selection tool, so the layer
  jumps (C, very common). Leaving the pivot at the center for a hinge motion (C). Changing the anchor
  after Position is keyed (C, vendor source; open question B5).
- **Not taught here:** 3D anchors, shape group anchors, effect points, Collapse Transformations.
  Quick Set Anchor is mentioned only if R0 shows the learner's version has it.
- **Reads:** R3 (static anchor and position, bounds). A demo write tool (anchor plus compensating
  position).
- **Review:** a new hinge-style rotation on another layer, with the pivot set first and no jump.

### 6. Move a group with a null (suggested `parenting.null`)

- **Idea:** a parent carries its children's position, scale and rotation while they keep their own
  animation. A null is an invisible handle for that.
- **Why:** parenting to a visible layer and expecting opacity to follow are the classic mistakes (B,
  Meyer). Adobe parents on request. Knack checks every child: it didn't jump, its own keys are
  unchanged, and the parent is a null. Memory: the review gives a "move these together" task and
  sees whether the learner reaches for a null.
- **Outcome:** can make a null, parent a few layers to it without any of them jumping, and move the
  group by animating the null, without help.
- **Focus:** 2–4 layers that should move as one, which the learner picks or agrees to.
- **Steps:** *We do:* the learner adds a null and places it where the group should pivot (skill 5's
  idea). *I do:* parent one child to it, and show that the child didn't move. *You do:* parent the
  rest, then give the null one move (two keys).
- **Pass:** every focus layer's parent is the null. Each child kept its own animation: the same key
  count and key times, and the same comp-space position at each of its key times and at the current
  time (no jump). **Don't compare raw key values.** Parenting rewrites a child's Position into the
  parent's space, so the numbers change even when nothing moved on screen (claim to verify, B9). The
  null has at least two keys with different values. The parent isn't a content layer.
- **Mistakes:** a visible layer as the parent (B). Fading the null and expecting the children to fade
  (B). Opacity isn't inherited, so if the read sees the null's opacity below 100, that's the hint.
  A child jumping when parented (B).
- **Not taught here:** chains deeper than one, rigs, expression links, 3D and cameras, stacked
  parent-and-child motion as a timing problem (DX-08: skill 4 traces it, diagnosis hints).
  Non-uniform parent scale is named only if the read sees it.
- **Reads:** R1 (parent), R3 (comp-space position), the motion-sources map's **first step only** (own
  keys and parent chain, spec 004 FR-014). A demo write tool (set a parent with no jump). Skill 6
  doesn't need expression sources (R2): the pass is graded on the Parent link from R1, so a layer that
  follows the null only through an expression link is simply not parented and doesn't pass (its
  overlap row); and the no-jump check uses comp-space positions, which already include whatever an
  expression does. If a child jumps and the snapshot shows no expression on its keyed properties, the
  hint names the jump, not a cause, and the mentor says it can't see expressions on unkeyed
  properties yet (the map's "not read" marker), never that there are none. It doesn't need R4 either:
  parents work only within one comp.
- **Review:** a new group on another comp gets a null.

### 7. Draw it on with Trim Paths (suggested `shape.trim_paths`)

- **Idea:** animating Trim Paths End from 0 to 100% draws a shape's stroke on over time.
- **Why:** the first real shape-layer animation, for underlines, icons and loaders. Adobe judged the
  Bar's trim by measuring the bar's width in pixels and couldn't see its ease. Knack reads End's keys,
  ease, and where Trim sits in the Contents. Memory: the review is a draw-on on a new shape, with no
  walkthrough.
- **Outcome:** can draw a stroke-only shape layer, add Trim Paths to it, and animate an eased
  draw-on, without help.
- **Focus:** a stroke the learner wants drawn on (an underline under Title, an icon outline). Step 1
  is drawing it with **nothing selected**, so it becomes a shape layer and not a mask.
- **Steps:** *We do:* the learner draws the shape (stroke on, fill off). *I do:* if there are two or
  more shapes, add Trim Paths and key End on one. With one shape, there's no demo and the mentor
  walks through it in words. *You do:* Trim and key End (0 to 100) on the rest, then ease the keys
  (the easing check, reused).
- **Pass:** a new shape layer exists (not a mask on another layer). Trim Paths sits in the group
  that holds the stroke. End has at least two keys with different values. The stroke is on with a
  width above 0. The End pair is eased.
- **Mistakes:** a mask was made instead of a shape (C, several threads). One key on End, or the same
  value at both keys (C, Adobe employee answer). Trim Paths not found or added to the wrong group,
  and fill plus stroke behaving oddly under a trim (C, several threads).
- **Not taught here:** Repeater, Merge Paths, the Offset "chase", Illustrator or SVG import
  (deferred), duplicating fill and stroke (mentioned only if the learner wants a fill), the Stroke
  and Write-on effects.
- **Reads:** R5, R8 (to see a mask made instead). End's keys are already read. A demo write tool
  (add Trim Paths and key End on one shape).
- **Review:** a new draw-on, eased, on another shape.

### 8. Show one layer through another (suggested `matte.track`)

- **Idea:** a track matte lets one layer's shape (alpha) or brightness (luma) decide where another
  layer shows. The matte layer hides itself by design.
- **Why:** this is the clipping-mask idea Illustrator and Photoshop learners already half know
  (interview 006 looked it up again), with the stack roles reversed. The UI changed in 23.0, so most
  tutorials show the wrong menu (belief 16). Knack reads the live settings, so it never describes a
  menu the learner doesn't have, and it checks each setting: type, whether the source has alpha, the
  eye state. Memory: the review is a matte on a new comp with no walkthrough.
- **Outcome:** can make a text or shape layer the window for a fill layer, and animate the window to
  reveal, without help.
- **Focus:** a fill layer (footage, solid, gradient) and a matte source (text or shape) the learner
  names.
- **Steps:** *I do:* if there are two fill-and-matte pairs, set the matte on one. Otherwise there's
  no demo, and the mentor walks it in words: the Track Matte column (shown from the timeline's column
  menu if hidden), pick the matte layer, alpha. *You do:* set up the matte, then give the matte layer
  a two-key move to make a reveal, and ease it (reused check). The matte stays hidden while it
  moves. That's the point of this step.
- **Pass:** the fill layer's matte is the chosen layer, the type is what the learner intended, the
  matte layer's eye is off, the matte source has real alpha (a text layer, or a shape with a fill; not
  a full-frame solid), and the reveal has two eased keys. Frame checks inside the reveal confirm it.
- **Mistakes:** a matte with no transparency (a full-frame solid, or fill set to None), so nothing is
  cut or the layer vanishes (C, several threads). Turning the matte's eye back on, so it shows over
  the result (C, expert answer, "seems common"). Not finding the control: the column is hidden, or
  old videos show a four-item menu (B plus A, 23.0).
- **Not taught here:** stacked mattes, the Set Matte effect, Object Matte (26.2, a different thing
  with a confusing name), masks, luma in depth (named, not practiced), inverted mattes (one sentence).
- **Reads:** R1 (matte target, type, is-matte, eye), R5 (fill), R3 (matte opacity), preview frames.
  A demo write tool (set a track matte).
- **Review:** a text-as-window matte on another comp.

### 9. Animate letters with a text animator (suggested `text.animator`)

- **Idea:** an animator changes a property across letters, and its range selector decides which
  ones. Animate the selector, not the property, so the letters go one after another.
- **Why:** titles are what this persona animates most (a guess, but a safe one for designers). The
  structure (animator, property, selector) is hard to see, which matches 007's "everything is hidden".
  Knack reads the animator tree and checks it piece by piece. Memory: the review is a new title, and
  the mentor checks that the selector, not the property, carries the keys.
- **Outcome:** can add an animator with one property to a text layer and key its range selector so
  the letters (or words) animate in turn, eased, without help.
- **Focus:** one or two text layers (Title and Subtitle in Mentor Practice).
- **Steps:** *I do:* on one layer, add an animator with one property (for example Opacity 0, or a
  Position offset), key the selector's Start (or Offset), and show frames at three times so the
  stagger shows. *You do:* the same on the other layer, eased.
- **Pass:** an animator with the intended property set away from its default; the selector's Start,
  End or Offset has at least two keys with different values; the animator's property itself isn't
  keyed; the selector keys are eased.
- **Mistakes:** keying the animator's property instead of the selector, so the whole text moves at
  once (P). A preset applied with the playhead mid-comp, so it starts late (several guide sources).
  The range left at 0–100 with no keys (P). **This is the thinnest mistakes evidence in the set.** A
  one-learner test would replace it (text-animators brief Q1).
- **Animators first, presets later:** a **guess**, from the product thesis (teach so it sticks), not
  from tests. Presets come up only as "open one up and see the animator inside".
- **Not taught here:** advanced options (Shape, Smoothness, Ease High and Low, Randomize), wiggly and
  expression selectors, per-character 3D, text-style expressions (25.0), Create Shapes from Text.
- **Reads:** R6. Selector keys are already read by the snapshot's walk. A demo write tool (add one
  animator and key the selector).
- **Review:** a word-by-word reveal on a new title.

### 10. Precompose and open the right level (suggested `precomp.basic`)

- **Idea:** precomposing (with Move all attributes) moves layers and their keys inside a new comp
  that acts as one layer. You edit that animation by opening it.
- **Why:** the main way keys "disappear" (precomps brief, A). Adobe precomposes on request ("Precompose
  the logo layers"). Knack checks that the keys arrived inside intact and that the learner edited at
  the right level. It also lifts easing's "I can't see inside these yet" (R4). Memory: the review
  checks the learner opens a precomp before saying its keys are missing.
- **Outcome:** can precompose a few layers with their animation, name the precomp, and make a change
  inside it, without help.
- **Focus:** 2+ layers that belong together, which the learner picks. Before they precompose, the
  mentor **warns from the read** if any of them has a parent or matte outside the selection.
- **Steps:** *I do:* open an existing precomp (Icon in Mentor Practice) and show its inner keys with
  a frame. This is a read, not a change, because a precompose usually happens once per lesson. *We
  do:* the learner precomposes with Move all attributes, names it, and opens it. *You do:* one change
  inside (for example shift a key), then back to the parent comp.
- **Pass:** a new precomp layer exists, its name isn't the default "Pre-comp N", the selected layers
  are inside with their key counts and times intact, its duration covers their keys, and the
  learner's change shows in the inside read.
- **Mistakes:** pressing U on the precomp, seeing nothing, and concluding the keys are gone (A plus
  B). Editing the precomp layer's transform in the parent when they meant the inside (B). "Leave all
  attributes" greyed out with several layers, text or shape selected, so AE looks broken (A).
- **Not taught here:** Collapse Transformations (unverified against Adobe's help), pre-rendering,
  time remapping, Essential Properties, nesting deeper than one.
- **Reads:** R4, R1 (parents and mattes outside the selection, in and out points). Possibly no demo
  write tool at all (open question B7).
- **Review:** on a comp with a precomp, the learner finds an animation inside it unprompted.

## 7. Merge and split calls (the researchers' point 3), and what's deferred

| Suggestion | Call | Why |
|---|---|---|
| Fold anchor point into parenting | **Rejected.** Kept as skill 5, short, before 6 | They're two ideas with two failure signals (layer jumps when the anchor moves vs. child jumps or keeps animation when parented). The anchor brief found no B source for anchor alone, which is a reason to keep it short, not to merge it. Skill 6 reuses it. |
| Split the graph editor into reading and shaping | **One skill, with reading as its checked first step**; spotting jolts across a comp goes to diagnosis (DX-04) | A reading lesson with no change has a weak "you do". Reading is checked inside skill 2 as a prediction. The middle-key jolt is a third idea, so it's deferred. |
| Split shape layers: Trim Paths, then Repeater last or dropped | **Trim Paths is skill 7. Repeater is deferred low** | Repeater has the weakest evidence (shape-layers brief) and is a pattern tool, not a basic. |
| Defer render and export | **Deferred** | The mentor can't read AE during a render (the bridge is blocked); it writes to disk (a lock and permission decision); its value comes after a piece is finished. The H.264 version trap (23.0) is the best one to teach when it's built. |
| Hold goes with linear | **Yes, skill 1** | |
| An "Illustrator or SVG into AE" skill | **Deferred, high on the list** | No brief yet. Paste and SVG import (26.2) are version-dependent, and we don't know whether target learners start from Illustrator artwork (shape-layers brief Q2). It may be the best opening for this persona. Ask first. |
| Split expressions into "link properties" and "motion from code" | **Deferred as a whole**; if built, motion from code (loopOut on keys) first | Adobe's assistant writes and debugs expressions on request, so the edge is smallest here. Skill 4 already teaches recognizing an expression over keys, which is DX-06's teachable part. |

**Deferred, in order of next priority** (reasons in a word or two): 11 Vary durations (DX-02, no
skill covers it yet); 12 Shape the motion path (spatial, R7; separated dimensions are its main
trap); 13 Motion from code, loopOut first (expressions); 14 Smooth a middle key (DX-04, roving); 15
Illustrator or SVG into AE; 16 Effects basics (stack order, adjustment layers; the render-order
claim needs checking first); 17 Masks; 18 Render and export; 19 Repeater. Setting keyframes stays an
on-ramp, not a skill: when a comp has no keys, each skill gives the short walkthrough easing already
gives (open question H5).

## 8. Overlaps, curriculum level

Each skill's own spec runs `/overlap-audit` and adds the tests. This is what every check must see,
at curriculum level. "Expr" means expressions over keys.

| Skill | Expr | Single / hold keys | Separated dims | Effects | Precomps | Hidden / matte | Parenting |
|---|---|---|---|---|---|---|---|
| 1 Key type | An expression over held keys (loopOut) may change what shows: flag it, don't grade those keys | The core. Pair is held if the first key's out type is hold. Test the mixed case (bezier out, hold in on the next key) | X and Y each have their own types; holding X leaves Y moving | Checkbox-type effect parameters are hold-only: not the learner's work | A held pop inside a precomp isn't visible from the parent: not checked | A hold at opacity 0 hides a layer with its eye on. It isn't "hidden" | none |
| 2 Speed graph | Graph edits do nothing visible under an expression: flag before shaping | No curve on a single key; no handles on hold or linear | X and Y have separate curves; shape each | Effect keys are graphable and count | Graph shows the current comp only | An eye-off property can still be edited; leave it out of the focus | none |
| 3 Offset | Delay expressions move layers with no keys to shift | A single key has no start to offset; holds count as starts | Compare X and Y as one move | Effect keys must shift with the layer's other keys | Shifting a precomp layer moves everything inside; needs R1 | Exclude hidden layers; **include mattes** (they move) | A child's start includes its parent's motion: name it, don't grade it |
| 4 Find what's moving | The core | A single key isn't motion | Two properties, one source | An effect is not a motion source in this skill (out of scope) | The core (R4) | A hidden null still moves children: don't skip it; a shy parent hides the source | The core |
| 5 Anchor | Position or Rotation expressions may ignore the new pivot | Hold Position keys don't compensate between keys | Compensation writes X and Y | Effect points don't move with Pan Behind | Collapse Transformations changes it: out of scope | A guide or eye-off layer can't be dragged in the comp panel | The parent's anchor pivots the group (bridge to 6) |
| 6 Null | An expression-linked follower isn't a parent | A hold on the null makes children jump | Child or parent Position may be two properties | Effects aren't inherited | Parents work only within one comp | A hidden null is correct, not a problem | The core |
| 7 Trim Paths | An expression on End moves it with no keys | One key on End is the classic failure | Group transform can be separated | The Stroke and Write-on effects do the same job: read both | Precomposing moves keys inside | A group's own eye inside Contents; a shape used as a matte has its eye off | none |
| 8 Matte | Matte layer transform rules as in easing | Hold keys on the matte make the reveal jump | As easing | The Set Matte effect is the old route: read effects too | A matte works within one comp; precomposing the target breaks the link | **The core: a matte's eye is off by design. A "hidden layer" check is wrong for mattes**, and turning the eye back on is the mistake | The Track Matte and Parent columns sit side by side (a mix-up seen once, C) |
| 9 Text animator | Wiggly and expression selectors animate with no keys | One key on a selector is static; holds pop letters on | Text layer Position vs. animator Position | Typewriter plugins: an empty Effects panel doesn't mean no animation | Kept on precompose | An animator's own eye switch; text as a matte has its eye off | none |
| 10 Precompose | Expressions inside see the precomp's time | Inside keys are invisible from the parent, whatever their type | Inner read reuses the existing rule | Effects on a single layer travel inside with Move all | The core | Hidden layers inside are hidden from the parent too | Parents outside the selection are cut off: warn before |

## 9. Version traps per skill

The builder uses **After Effects 26.5 on macOS 27.0.1** (H1, answered 2026-10-20; CLAUDE.md › My
setup). Version-dependent steps and the live runs target 26.5. What that settles:

- **Skill 3:** Quick Offset shipped in 25.4, so it's present at 26.5. The gesture itself still needs
  confirming on a live run.
- **Skill 5:** Quick Set Anchor is still beta at 26.5, so skill 5 teaches **Pan Behind**. No step,
  pass check or review depends on Quick Set Anchor.
- **Skill 8:** the matte wording at 26.5 is still unsettled (one weak 2025 report of different column
  labels). Settle it on a live run before skill 8 is built.

**Rule for every skill:** read the version (R0) at the start, and give any step whose
UI changed in the form that version has. Never quote a shortcut whose Mac and Windows forms
conflict: name the menu path instead.

| Skill | Trap | What the mentor does |
|---|---|---|
| 1 | Hold shortcut: Ctrl+Alt+H on Windows; Mac sources conflict (C). "Freeze Frame" used for "hold" in some teaching | Name Animation > Toggle Hold Keyframe; never say "freeze" |
| 2 | Graph type is Auto-Select by default (speed for Position, value for the rest); 25.0 themes change how tutorials look; the Keyframe Velocity shortcut is unverified on 26.x | Ask which graph is showing; name the menu, not a picture of it |
| 3 | Quick Offset (Cmd+Option or Ctrl+Alt drag) exists only from 25.4; older help uses Sequence Layers; 26.2 changed timeline scrubbing feel | Offer Quick Offset only if R0 says 25.4+ (so at 26.5, yes, once a live run confirms the gesture); manual dragging works on every version |
| 4 | Properties panel (23.4) and Essential Properties (23.6) let you edit without opening a precomp; newer layouts have two pick-whip columns (C); the U behaviour needs checking (B4) | Teach the timeline route; mention the panel only as "you may also see it here" |
| 5 | Quick Set Anchor (Shift+Tab, nine points, 2D only) is beta from 25.1 and still listed as beta at 26.5 (A); Pan Behind (Y) is stable | Teach Pan Behind (at 26.5 too); mention Quick Set Anchor only if present, never rely on it |
| 6 | Null defaults (size, anchor corner) are from CS-era text, unverified for 26.x | Don't describe the null's defaults until tested |
| 7 | Paste and SVG import into shape layers (26.2); old tutorials use Stroke and Write-on effects | If a shape came from Illustrator, check it has a stroke before Trim |
| 8 | **23.0:** the matte can be any layer, picked from a menu or pick-whip, with two toggles; older videos show four menu items. Object Matte (26.2) is a different feature. One 2025 thread reports different column labels | Describe the picker plus toggles; warn once that old videos look different. 26.5's exact labels: settle on a live run first |
| 9 | Text-style expressions (25.0); the core animator path looks stable 2023–2026 (absence of evidence) | None beyond R0 |
| 10 | Properties panel / Essential Properties (23.x); 25.0 themes | Teach double-click to open |

## 10. Diagnosis findings to skills (for spec 005's FR-010 map)

| Finding | Skill that teaches the fix | Until it's built |
|---|---|---|
| DX-01 linear or half-eased pairs | Easing (built) | |
| DX-02 equal durations | none in the 10 (deferred 11, Vary durations) | hints |
| DX-03 properties land on the same frames | 3 (property focus) | hints |
| DX-04 middle-key jolt | none in the 10 (deferred 14) | hints |
| DX-05 ramp vs hold | 1 | hints |
| DX-06 expression on keyed property | 4 (trace it); the fix itself waits for deferred 13 | hints; ask what it's for |
| DX-07 dead time | none (a comp-length decision, not a skill) | hints |
| DX-08 own motion over parent's | 4 (trace), then hints; 6 if they want a null | hints |
| DX-09 motion blur off | none (a switch) | hints |

## 11. Teaching scope for the whole curriculum

Not taught in these 10: 3D, cameras and lights; audio sync (belief 4, parked); tracking, roto and
Object Matte; color; writing expressions; effects; masks; motion paths; render and export; Repeater;
importing from Illustrator. Diagnosis covers "why can't I see it" (visibility) and dead time as
findings with hints. Each "not taught here" line in section 6 says where its pieces go.

## 12. Open questions

### For the human (H)

1. ~~AE version and OS~~ **Answered 2026-10-20:** After Effects 26.5 on macOS 27.0.1. What it
   settles is in section 9. R0 still reads the version every session.
2. ~~Ten skills, or fewer?~~ **Answered 2026-10-20:** this sprint's baseline is skills 2, 1, 3, 5
   and 6, plus reviews for 2, 1 and 3. Reviews for 5 and 6, and skills 4 and 7 to 10, are stretch
   or next sprint. Build order and the builder's reason are in section 5.
3. **Skill 4's place:** 4th by default and pulled forward by diagnosis. Or 1st, as 007 suggests? A
   guess either way.
4. **Is "name the sources" a real "you do"?** The check is real, but nothing changes in the comp. If
   it feels like a quiz in use, add a small change (turn the expression off with =, see the keys take
   over, Edit > Undo) as the practice step.
5. **Setting keyframes as an on-ramp, not a skill:** confirm. Interview question: do target learners
   already know the stopwatch? (007 did, from a class.)
6. **Animators before presets (9)** and **anchor kept separate from parenting (5)**: confirm or
   overturn.
7. **Offset taste rule:** the mentor names the pattern and never fails on rhythm. Confirm.
8. **Spec 005 open question 4 asks for a short teaching design for diagnosis US2** (how a finding
   becomes a lesson, how to ask about intent). That's mine to write if you assign it, with a spec
   number.

### For the skill builder (B)

1. **Practice comp targets.** Mentor Practice lacks a fade that should be a cut (1), a stroke-only
   shape (7), a fill-and-matte pair (8), and a precomp-able group free of outside parents (10).
   Recommend a **second practice comp**, not editing Mentor Practice, because the easing evals and
   fixtures are built from it.
2. **Verify the Cursor on 2026-10-08:** was it held then (as the build script makes it) and Adobe
   misread it, or had it been changed? If Adobe misread it, that's evidence for skill 1's "why".
3. **Matte vs hidden in easing:** today easing would skip a moving matte as "hidden". Fix with R1's
   visibility classification before skill 8 ships.
4. **Does U show expression-only properties** on the builder's version? (Skill 4 wording.)
5. **Does Pan Behind rewrite existing Position keys,** or only the current value? This decides
   whether "set the anchor before you key" is a rule or a tip.
6. **Shared analysis code:** skills 1–3 and diagnosis all extend the easing analysis. Give it one
   owner, or split it per skill, before parallel builds.
7. **Demo write tools** each skill needs: set interpolation (1), set influence (2), shift a layer's
   keys (3), anchor with compensation (5), set parent with no jump (6), add Trim Paths and key End
   (7), set track matte (8), add an animator and key its selector (9). Skill 4 needs none, and 10
   maybe none. Each is one change, on one target, once per lesson, as `set_ease` is.
8. Track matte scripting names (`trackMatteLayer` and others), shape-layer anchors, and 26.x null
   defaults are unverified.
9. **When a keyed child is parented, does AE rewrite its Position key values** into the parent's
   space? (I believe it does, so the look stays the same.) Skill 6's "no jump" check depends on the
   answer: compare comp-space positions, not raw values.

### For the eval engineer (E)

1. Skill 4 grades a free-text answer against the motion-sources map. It needs judge rubric items
   (all sources named, nothing invented) as well as deterministic ones.
2. Every skill needs a case on its overlap traps (section 8), above all a matte with its eye off that
   must not be called hidden (8, and easing's regression).
3. Review lessons (no demo, a new target, a record that says learned) need their own cases per skill.
4. Intent questions (1's "is anything meant to snap", 5's "where's the hinge"): a case where the
   learner says "it's meant to fade" must drop the point.

### For the spec writer (S)

1. The pass margins in 2 (influence), 3 (what counts as the same frame) and 5 (how close counts as
   inside a region) are yours to set as measures.
2. The review timing and trigger are yours. What each review checks is in section 6.

## 13. Answers to the spec writer, round 1 (2026-10-20)

| Q | Answer | Spec default |
|---|---|---|
| C1 Learner insists on a skill without its hard prerequisite | **It runs**, after one sentence on what it builds on. Learners learn what the project needs (008), and a blocked learner leaves for YouTube. The lesson doesn't reteach the prerequisite. If the learner hits that prerequisite's typical mistake, the mentor gives that skill's hint and suggests the prerequisite after this lesson. If the focus rule finds nothing to teach (skill 2 with no eased pairs), it says so and offers the prerequisite. Record nothing about the gap beyond what the checks showed. | Kept |
| C2 Skill in progress vs a due review at session start | **The skill in progress comes first.** Finishing beats reviewing, and a review stays due. Still at most one review offered per session, and none after a practice lesson on the same skill. | Kept |
| C3 Under 2 frames apart counts as lockstep | **Fair as a floor**, provided it's never shown as the target (the learner picks the gap) and is defined in time as well. Use under 2 frames **or under 1/15 s, whichever is longer**. At 60 fps two frames is 33 ms, which reads as together. | **Changed** (FR-027 adds the time floor) |
| C4 Passing a review before any first lesson | **Yes, it counts as learned**, recorded as "already knew it", and the schedule starts from that pass. But the mentor never *offers* a review for an unlearned skill. It happens only when the learner says they know it. That keeps "review" meaning "try it yourself, no demo". | Kept, with that condition |
| C5 Every skill hands off to skill 4's "trace this one first" | **No, only when** another source affects that lesson's focus or check, **and** skill 4 is learned, **at most once per lesson**. Otherwise one sentence naming the source, then carry on (section 6, skill 4). | **Changed** (narrower) |
| H4 Is naming sources a real "you do"? | Still open for the human. Keep naming as the pass until one live run. If it feels like a quiz, add the reversible step (turn the expression off with =, watch the keys take over, Edit > Undo), ungraded. | n/a |
| H6 Animators before presets; anchor separate from parenting | Still the human's call. My recommendation stands; the design is unchanged. | n/a |
| H7 Offset taste rule | Still the human's call. Recommendation stands: name the pattern, never fail on rhythm. | n/a |

**Review schedule (1, 3, 7, 14, 30 days; a failed review goes back to 1; offered, at most one per
session, no demo).** It fits the design, with three additions that keep it from teaching the wrong
thing (now in section 2):
- reviews still ask the skill's intent questions;
- no new target means no review: it stays due, and doesn't count as missed;
- a failed review gives hints, not a reteach. "Back to 1 day" is fine, because "learned" isn't taken
  away.

**Pass margins:**
- **FR-026 (skill 2):** fine. Adobe's 15/80 demo and a modest 33/53 both pass; untouched Easy Ease
  fails. "Neither key at default on both sides" is right, because a key's other side belongs to the
  next pair.
- **FR-027 (skill 3):** fine with C3's time floor. Half a frame for "moved by the same amount" is
  fine.
- **FR-028 (skill 5): would teach the wrong thing.** Using 10% of the *larger* side makes regions
  overlap on thin layers: on an 800 × 60 bar the tolerance is 80 px, so top-left, left-center and
  bottom-left all pass for each other. Use 10% of **each axis's own size**. The 1 px footprint check
  is fine.
- **FR-029 (skill 6): would teach the wrong thing.** "Values within 0.01" fails every correct
  parenting if AE rewrites a keyed child's Position into the parent's space, which I believe it
  does (B9). Check that key count and times are unchanged, and that the **comp-space position at
  each key time is within 1 px**, not the raw values. The 1 px current-time check is fine.

**Spec 004's Q1 to Q3 (settled 2026-10-20 with the spec's written defaults).** The builder ran the
defaults for now. They fit this design:

| Q | Settled as | Fits because |
|---|---|---|
| Q1 Reviews and the second practice comp | A due review waits for the learner's own work. The mentor never suggests the practice comp for a review; its review targets are for the builder's live runs and evals only (spec 004 FR-021) | Section 2's "no new target, no review", and learners learn what the project needs (008) |
| Q2 A review from diagnosis and the one-per-session limit | A review on a finding the learner chose from a diagnosis doesn't count toward the limit; the limit covers only reviews the mentor offers unprompted (FR-020) | It's pulled by the learner's comp and choice, not by the schedule |
| Q3 Skill 4's hand-off vs. its review schedule | A hand-off counts as a skill 4 review only when skill 4's review is due; otherwise it's ungraded and not recorded. It never counts toward the limit (FR-037) | Skill 4's review already is "trace an unfamiliar layer in a later lesson", so a due hand-off is that review |

## 14. Claims to verify before they're taught

- U and expression-only properties (B4); Pan Behind and existing keys (B5); the Cursor on 2026-10-08
  (B2).
- Effects render order by layer type (effects brief, doubtful). That's why effects are deferred.
- Collapse Transformations behaviour (precomps brief). Out of scope until there's an official source.
- Auto Bezier turning into Continuous Bezier when moved (one source). Matters only for motion paths
  (deferred).
