# Teaching design: Pick the key type on purpose (curriculum skill 1)

**Owner:** curriculum designer (`decisions/007`). The spec writer's `spec.md` in this folder links
here and doesn't copy it. Gaps or contradictions come back as questions.
**Date:** 2026-10-20; round 1 answers 2026-10-21 (§ 14). **Status:** draft, round 1 answered.
**Builds on:** `specs/004-ae-curriculum/curriculum.md` § 2, § 6 skill 1, § 8, § 9, § 12 (B1, B2), § 13;
spec 004 (approved), above all FR-004, FR-005, FR-018 to FR-022, FR-024, FR-025, FR-030, FR-031.
Research: `discovery/curriculum-research/keyframe-types-hold-and-linear.md`. Evidence:
`discovery/usage-notes/adobe-assistant-2026-10-08.md`. Lesson shape:
`.claude/skills/ease-mentor/SKILL.md`.
**Suggested record ID:** `keyframes.types` (the skill builder names it).

Tags: **A** Adobe, **B** established teaching, **C** one tutorial or thread, **R** repo evidence,
**Guess** a design call with no evidence (also listed under open items).

## 1. The one idea, and why

**Idea:** a key's type decides how the value travels to the next key. Hold makes it jump, linear runs
at constant speed, ease is natural. Choose one on purpose.

The lesson practices **hold** (the type easing never covers). Linear on purpose is the understanding
check, not a second task, so the lesson stays one idea: "the type is a choice".

**Why a learner needs it:** a blink that fades, a cut that dissolves, and a constant spin that got
eased are all type mistakes. After the easing lesson a learner's habit is "ease everything"; this
lesson is where "not everything should ease" comes in.

**What Adobe's assistant can't do today:**
- **Depth.** It can't read key types. On 2026-10-08 it said the Cursor "ramps evenly between 100 and 0
  every 0.5s, so it pulses rather than blinks" (R), and later confirmed the fix by measuring
  brightness in rendered frames. Knack reads each key's in and out type and checks every pair
  directly. (Whether the Cursor was really linear that day is B2, below. If it was held and Adobe
  misread it, that's stronger evidence for this "why".)
- **Memory and practice.** The review checks, in a later session, whether a new on/off change gets
  held without being shown.

## 2. Outcome

Without help, the learner can turn a pair into a hold for an on/off or cut change, and can say which
move in their comp should stay linear (constant speed) and leave it that way.

## 3. Prerequisites

| Kind | Skill | If it's missing (C1, FR-005) |
|---|---|---|
| Hard | Easing (`easing.basic`) | Name it and offer it first. If the learner insists, the lesson runs after one sentence ("this builds on easing: hold is the third choice next to linear and eased"). No reteach. Easing's typical mistake (a half-eased pair) rarely matters here; if the constant-speed check (§ 5 stage 6) finds an eased pair the learner meant to be constant, give that stage's hint, and suggest easing after this lesson only if they seem unsure what eased means. |
| Soft | none | |

## 4. Focus and demo target

**Focus rule: ask first.** The mentor can't read intent, so it asks: "Is anything here meant to snap,
like a blink, an on/off, or a cut?" It helps the learner answer by naming **candidates** from the
read: pairs on Opacity going between 0 and 100 (either direction) that aren't held, on visible,
non-null layers with no expression on the property. It names at most three.
- The learner names one or more → those pairs (all of that property's non-held pairs on that layer,
  except pause pairs: two neighbouring keys with the same value, where holding changes nothing on
  screen) are the focus. If every non-held pair in the named property is a pause, it isn't a focus:
  "it holds still between those keys, so there's nothing to snap" (§ 14, C-2).
- The learner says a candidate is meant to fade → drop it, no argument (spec 004 eval: "it's meant to
  fade" must drop the point).
- The learner names something that isn't a candidate (a Position jump, a color change) → it's
  allowed if it's a keyed pair the read can see.
- Nothing named and no candidates → offer a practice blink: the learner adds 4 Opacity keys (100, 0,
  100, 0) to a visible layer, half a second apart, and that's the focus. That's setting keyframes,
  the on-ramp, so it's allowed with a short walkthrough. Or offer the second practice comp.

Say what's left out: hidden layers, precomps ("I can't see inside these yet"), properties under an
expression, pairs that are already held ("the Cursor already snaps").

**Explaining with what's already there.** If the comp has a held pair (the Cursor in Mentor Practice
as built), stage 3 uses it: one frame either side of a jump shows what hold looks like on their own
comp, before anything changes.

**Demo target rule.** The earliest focus pair in time on a visible non-null layer. Never the
learner's only pair: with one focus pair there's no demo and the mentor walks it through in words.
The demo is one write: set that pair's first key to hold on its outgoing side, the same way Toggle
Hold Keyframe does (exactly what that writes at 26.5 is B-3).

**On Mentor Practice:** as built, the rule names two candidates, Title Opacity and Subtitle Opacity
(0 to 100 fades, not held). That's intended (§ 14, C-1; builder's H-1). The rule can't read intent,
which is why the lesson asks: the mentor names them as a question ("Title and Subtitle fade in from
see-through. Is either meant to snap on instead?"), never as mistakes. The expected answer is
"they're meant to fade", so both drop with no argument and the lesson goes to the practice blink or
the second practice comp. A learner who says one should snap gets it as the focus. The Cursor is
already held (mentioned, not a candidate), unless the builder's `.aep` differs (B2).

**On Mentor Practice 2 (spec 004 T041):** Blink is the lesson's target, built **eased** (§ 14, C-3):
a blink that fades because it got eased, the "ease everything" habit from § 1. Spinner is the
stage 6 constant-speed move (linear), and Cut is the review's on/off change (§ 11).

## 5. Sequence

| Stage | Learner does | Mentor checks | What passes |
|---|---|---|---|
| 0. Remember | nothing | The record for this skill | n/a |
| 1. Look and ask | says what should snap, or agrees to a practice blink | Fresh read. Candidates (§ 4). The answer sets the focus | A focus with at least one non-held pair |
| 2. Explain on their comp | watches | A frame in the middle of a focus pair ("at 1.0 s it's half see-through: it fades"), and if a held pair exists, frames either side of its jump. Words: hold keeps the value until the next key, then jumps | n/a |
| 3. I do (one demo) | watches, can Edit > Undo | Only when asked or clearly stuck. One write on the demo target. Frames one frame before and one frame after the next key ("it snaps at 0.5 s") | n/a |
| 4. You do | Holds the rest of the focus pairs, says "done" | Fresh read and diff. Each focus pair: is the first key's outgoing side hold? Credit the demo to the demo. Hints, never the fix | § 6 |
| 5. Check the edges | nothing | Any pair the learner **said should move** (in this lesson) that is now held → hint (§ 7, row 2) | Part of § 6 |
| 6. Understanding check: linear on purpose | Answers "Is there a move here that should run at constant speed?" | If they name one: is it linear at both ends, and not held? If it isn't linear, one sentence on how (Animation > Keyframe Interpolation, Temporal: Linear) and check again on "done". If they name none, nothing to check | Graded only if named (§ 6) |
| 7. Record | nothing | § 11 | n/a |

## 6. Pass

1. Every focus pair is held (its first key's outgoing type is hold), counting the demo pair. Pause
   pairs aren't focus pairs (§ 4): held or not, they're neither graded nor counted.
2. No pair the learner said should move in this lesson is held.
3. If the learner named a constant-speed move in stage 6, it's linear at both ends (both keys linear
   on the sides facing the pair). If they named none, this item doesn't apply.

**Mixed pair (curriculum § 8).** A pair whose first key's outgoing side is bezier or linear but whose
second key's incoming side is hold: whether After Effects jumps or travels there is B-2. Until it's
checked, the check treats it as not held (as `segmentState` does), and the mentor never tells the
learner the pair is done.

## 7. Common mistakes and the hint for each

| Mistake | What the check sees | Hint (where to look, never the fix) | Evidence |
|---|---|---|---|
| Wants a cut, gets a fade (the starting state) | Focus pair still linear or eased | A frame mid-pair: "At 1.0 s Title is still half see-through, so 0.5 s to 1.5 s still fades" | C |
| Hold on a key meant to move ("my animation is stuck": sits still, then snaps) | A pair the learner said should move is held | "Title Position doesn't move between 0.5 s and 1.5 s now; it waits and then jumps. The key at 0.5 s is a hold" | C, one thread |
| Selecting all keys and holding everything | Holds on pairs outside the focus, on the same layer or others (a held pause pair changes nothing on screen, so it isn't named) | "Holds landed on more than the blink: Scale on Title jumps now too." Then ask whether that was meant | C |
| Held the wrong side (the second key instead of the first) | Second key's incoming side hold, first key's outgoing side not | "The jump happens from the key at 0.5 s, so that's the key to hold. The one at 1.0 s holds what comes after it" | Guess (B-2 decides the wording) |
| Some of a separated property held, not the rest | X Position held, Y Position still moving | "X Position snaps now, but Y Position still slides between 0.5 s and 1.0 s" | brief, overlap |
| Mentor's own wording trap | n/a | Never say "freeze" for hold: Layer > Time > Freeze Frame is a different feature (brief) | brief |

## 8. Teaching scope (not taught here)

Auto, continuous and plain bezier (spatial; deferred motion paths); roving (deferred 14); loopOut to
keep a blink going (deferred 13, expressions); the Graph Editor (skill 2); easing (built); spatial
interpolation of hold on Position (a layer teleporting along a path is shown, not explained).

## 9. Where AE concepts overlap, and what the check must see

| Overlap | What the check must see | What it must not do |
|---|---|---|
| Expression over keys (loopOut on a blink) | A property with an expression on isn't a candidate and isn't graded; name it ("an expression drives this, so the key types may not be what you see") | Grade the keys under it |
| Expression with no keys | Not read until R2; never claim there's none | Say the focus is everything that changes |
| Single key | Not a pair; nothing to hold | Count it |
| Pause pair (two neighbouring keys, same value) | Not a candidate and not a target, even inside a named property; holding it changes nothing (§ 14, C-2). Mentor Practice 2's "Pause" layer | Grade it, or name a held one as an extra hold |
| Already held | Not a candidate; mention once; used for the explanation frame | Credit it to the learner |
| Mixed pair | § 6 note; B-2 | Call it done before B-2 is settled |
| Separated dimensions | X and Y are separate pairs, each checked; a Position jump needs both held if both move | Check the combined Position |
| Effects | Checkbox-type and menu parameters are hold-only: never candidates, never credited | Credit an automatic hold as the learner's work |
| Precomps | A held pop inside a precomp isn't visible from the parent: not checked; "I can't see inside these yet" | Say it's fine |
| Hidden layer (eye off) | Left out unless the learner wants it | Make it the demo target |
| Hold at Opacity 0 | A layer with its eye on can be invisible between keys because of a hold at 0. It isn't "hidden"; the demo's "after" frame is picked where the layer shows | Call it hidden, or show a blank frame as evidence |
| Matte (KD-001) | Until R1, a matte is left out like any eye-off layer, "unless you want it". After R1, a matte uses the visibility class; its Opacity changes the reveal and it's a valid candidate if the learner names it | Say "you've hidden this" about a matte once R1 can tell |
| Null | Its keys can be held (a jump the children follow) but it isn't a default candidate and never the demo | Demo on it |
| Parenting | none at this skill's level (curriculum § 8) | |

## 10. Version notes (After Effects 26.5, macOS 27.0.1)

- **Toggle hold:** name the menu, Animation > Toggle Hold Keyframe, and right-click on a key. The
  Windows shortcut is Ctrl+Alt+H; Mac sources conflict (C), so never quote a Mac shortcut until B-3
  reads it off the menu at 26.5.
- **Linear:** Animation > Keyframe Interpolation, Temporal Interpolation: Linear (menu location to
  confirm, B-3).
- **Interpolation types:** no change found 23.x to 26.5 (brief, medium confidence). Old tutorials'
  icons and menus look different (belief 16); describe the menu, not the icon.
- **Never** "freeze" or Freeze Frame (§ 7).

## 11. Review (in this sprint's baseline)

- **When:** spec 004 FR-019 to FR-021.
- **New target:** at least one candidate (§ 4) on a layer and property the record doesn't show for
  this skill on this comp. Already-held pairs aren't targets (nothing to do; mention, don't grade).
  No candidate → no review offered; it stays due.
- **What it asks:** the intent question first, as in the lesson ("Is anything here meant to snap?";
  FR-021). Then "Make it snap", with no demo, no walkthrough, no menu path. If the learner says
  nothing should snap, the review ends with no target: not counted, stays due. On Mentor Practice
  this is the expected path (Title and Subtitle are candidates that are meant to fade, § 4; H-1);
  watch in the live review whether it nags. On Mentor Practice 2, Cut is the review target.
- **What passes:** § 6 items 1 and 2 on the pairs they named. The stage 6 linear question isn't asked
  in a review.
- **Not a pass:** § 7's hints, no reteach; recorded as a review that didn't pass; "learned" stays.
- **"I already know it" (C4):** runs as above.

## 12. What the record stores

Spec 004 FR-018's shared fields. In plain words in the lesson entry:
- **kind** and **targets** (layer, property, pair times, comp), including a practice blink the
  learner made;
- **attempted:** "Held 3 Cursor Opacity pairs";
- **summary:** what the checks showed ("the 1.0 s pair was still fading at first"; "said Bar's Trim
  End should run at constant speed; it stayed linear");
- **next:** one thing.

What the learner said a pair is meant to do ("meant to fade", "constant speed") is the learner's
statement about their work, so it may go in the summary. It's not a motive. Whether easing and
diagnosis should read it (so easing stops proposing to ease a move the learner said is constant on
purpose) is open item S-2.

## 13. Open items

**For the builder (needs a live AE check on Mentor Practice, `discovery/Claude AE Tutor Test.aep`):**
- **B2 (curriculum):** the Cursor on 2026-10-08. The build script makes it all hold. Adobe said it
  "ramps evenly", then called it "fixed" after the learner changed it. Read the Cursor's key types
  in the builder's `.aep` now: if it's linear, Mentor Practice already has skill 1's target and the
  practice blink isn't needed there. If it's held, Adobe misread it, which goes in skill 1's "why".
- **B-1** Second practice comp (curriculum B1, FR-031; spec 004 T041): a fade that should be a cut
  ("Blink", a 4-key Opacity blink built **eased**, on a visible layer; settled in § 14, C-3, was
  "linear" in round 1), a constant-speed candidate ("Spinner", a keyed linear Rotation, no
  expression), and a second on/off target on another layer ("Cut") for review runs and evals.
- **B-2** The mixed pair: first key's outgoing side linear or bezier, second key's incoming side hold.
  Does the value travel or jump? Check with frames inside the pair. Decides § 6's note and § 7 row 4.
- **B-3** At 26.5 on the Mac: what Toggle Hold Keyframe writes (outgoing only, or both sides), its
  menu location and Mac shortcut, and where Keyframe Interpolation lives. The demo write tool
  (curriculum B7: set interpolation on one pair) writes what Toggle Hold writes, so the demo and the
  learner's own toggle look the same on the timeline.
- **B6 (curriculum):** shared analysis owner (FR-032). Skill 1 reuses `segmentState`; read access.

**For the spec writer (S):**
- **S-1** Candidates are Opacity pairs between 0 and 100. Curriculum § 6 also said "step-like
  values"; I've dropped that (no readable definition). Anything else the learner names is allowed.
- **S-2** Whether the learner's "this should stay linear" statement is kept somewhere easing and
  diagnosis (DX-05) read, so they don't push to ease it later. That touches easing's analysis, so
  it's a requirement question, not mine to settle.

**For the eval engineer (E):** "it's meant to fade" drops the candidate (spec 004 cross-skill); a
review that still asks what should snap (cross-skill 7); "hold" never worded as "freeze"; a hold at
Opacity 0 not called hidden; a learner who holds everything, including a move they said should move.

**For the human (H):** how often target learners use hold at all (brief Q1). If rarely, skill 1's
place before skill 3 is worth a second look; it doesn't change this design.

**Guesses:** "held the wrong side" as a mistake; dropping "step-like values".

**Curriculum B items this skill settles:** B1 (skill 1's targets), B2 (the Cursor), B6 (read access
only), B7 (set interpolation).

## 14. Answers to the spec writer, round 1 (2026-10-21)

The builder approved spec 009 with H-1 to H-4 as recommended; these answers assume that.

| Q | Answer | Spec default |
|---|---|---|
| C-1 Mentor Practice's fades | **The rule is what I meant; § 4's "no candidate" line was wrong.** Title and Subtitle Opacity are candidates, named as a question, never as mistakes. The expected answer is "meant to fade", which drops them with no argument and goes to the practice blink or Mentor Practice 2 (FR-008). The same goes for a review there (§ 11). That's the ask-first design working: the mentor can't read intent, so it asks. Fixed in § 4 and § 11. | Kept (spec follows the rule) |
| C-2 Pause pairs in a named property | **Agreed.** A hold on two equal values changes nothing on screen, so there's nothing to teach or check there, and grading it would ask the learner to click for no visible reason. Pauses are left out of the targets, never graded, and a held one isn't named as an extra hold. A named property whose only non-held pairs are pauses isn't a focus ("it holds still between those keys"), the same words as speed graph's pause rule (`specs/008-speed-graph/teaching-design.md` › 4). Pairs whose values can't be read stay in, as the spec has it. Fixed in § 4, § 6, § 7 and § 9. | Kept (row 16) |
| C-3 Blink's starting type | **Eased**, as spec 004 T041 and research R13 already say. My B-1 is changed to match. The reasons, in teaching terms: (1) the mistake this lesson exists for is the habit easing leaves behind, "ease everything" (§ 1), and an eased blink is that mistake exactly; (2) Mentor Practice 2 then shows all three types next to each other, eased where it should be held (Blink), linear on purpose (Spinner), and held (Flag), which is the lesson's idea, "the type is a choice"; (3) a linear Blink would be one of the pairs easing proposes to ease on that comp (T043), so one comp would have easing teach the learner to ease a blink and skill 1 teach them to undo it. Stage 2's frame and § 7 row 1 work the same either way: a symmetric ease is still about half see-through mid-pair. | Settled (no spec dependency) |

**Other designs that touch the Blink.** Neither names it. Speed graph (008): an eased Blink is an
eased pair, so its rule sees it, but it defaults to Position or Scale, so Card is still proposed on
Mentor Practice 2. A learner who picks Blink there is allowed by 008's rule as written; that's a
teaching edge to watch, not a change now. Offset (010): Blink, Spinner and Cut add layers to the
layer-start groups, so their first keys should not land on 0.5 s, or the Dots group grows past
three. The answer key (T041) lists whatever's built, so this is a build note, not a design change.
Neither file needs editing.
