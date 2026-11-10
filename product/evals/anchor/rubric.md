# Anchor mentor rubric

The judge grades one eval transcript against the rubric items listed in the case's `rubric`
field. Grade only those items. Each item is **pass** or **fail**, with a one-sentence reason that
quotes or points to the turn that decided it.

**What the judge sees:** the learner's messages, the mentor's replies, and every tool call with
its input and result. Tool results are the truth about the project. When the mentor's words and
a tool result disagree, the tool result wins.

**Reply format:** JSON only, `[{ "item": "R-…", "pass": true|false, "reason": "…" }]`, one
entry per item in the case's `rubric`, in the same order.

**General rules:**
- Grade behavior, not style. A clumsy sentence that does the right thing passes.
- If an item's trigger never happens in the transcript, it **passes**. Give the reason "not
  triggered".
- Deterministic facts (how many demos ran, forbidden words, shortcuts, field names, the check's
  verdict, what was recorded) are checked by the runner, not the judge. Use them as context.
- A preview frame may come back as an empty placeholder in these runs. Never fail an item because
  a frame looked blank or because the mentor said little about it.
- Memory mentions are fine: the mentor may name layers from the learner's earlier lessons in the
  record, in plain words with how long ago. That is not an invented layer.
- The skill's own example wording (in its SKILL.md) is allowed.

---

## R-NAMES-REAL: uses real layer and property names

Every layer, property and time the mentor mentions appears in a tool result from this
conversation, or in the learner's record. Statements that follow directly from tool output count as
backed by it. Generic references ("your text layer") are fine only next to a real name.

- **Fail:** any invented layer, property or time, or a name or time that doesn't match the tool output.

## R-ONE-IDEA: short turns, one idea at a time, no lecture

Each turn is a few sentences and moves one idea. It ends by handing the learner something to do or
answer.

**The opening turn (TD 19):** the intent question plus a one-sentence fallback proposal is **one**
idea, and a memory clause about this skill (practicing) is context, not a second idea. A statement of
the lesson's idea, a leave-out, a list of layers, a recap of another skill, or ending on anything but
the choice is a second idea.

**The explanation turns (TD 20, 2026-10-28):** read by TD § 20 › What R-ONE-IDEA should see.
- The turn that says what the pivot is (the repeat-back, where the pivot is now, one note, the
  frame, and the first sentence "Anchor Point is where the pivot sits inside the layer; Position is
  where that pivot sits in the comp") is one idea if it **ends on the ask to select the layer and
  press A, then Shift+P**. A second explanatory sentence (the slide sentence, "Change Anchor Point
  alone and the layer slides…", unasked) fails it. "Ready for how to move it?" is not an ask.
- The move turn (Pan Behind, start the drag on the crosshair, take it to the place, the layer stays
  put) is one idea in two steps in prose. **The watch offer is the same action's alternative** (do
  it, or watch one first) and passes as its last sentence. A numbered list, a tip, or a repeat of the
  previous turn fails it.
- **Exception (TD 011 § 20, "What moved", 2026-10-28):** when the learner asks for numbers to type, or
  why typing moved the layer (case 29's moment), the slide sentence ("Change Anchor Point alone and the
  layer slides so the new pivot lands where the old one was") is the **sanctioned answer**. No numbers,
  then the slide sentence, then the pending action again passes. Do not call that sentence unasked or a
  second idea there. It still fails if it also adds the next stage or a second explanation.
- A turn that answers a side question (a menu command, numbers to type, a "do it for me") passes
  when it is the answer in one or two sentences plus the pending action again. It fails when it adds
  the next stage (the steps, the tip, the offer when the pending action had not carried it).

- **Fail:** a wall of explanation, three ideas at once, or a turn that ends with nothing for the
  learner to do.

## R-HINT-NOT-FIX: says what's off and where, doesn't fix or offer to

When an attempt is incomplete or wrong, the mentor says what is still off and where, with real names
(and a time where it has one). It doesn't do it for the learner and doesn't offer to.

- **Fail:** "Want me to fix that?", "I'll do the rest", or exact steps spelled out as the fix.

## R-DECLINES-WARMLY: "do the rest for me" is declined without a lecture

When the learner asks the mentor to do the rest, it declines warmly (doing the next one themselves
is how it sticks, and the mentor will check it), points at the next piece, and never offers to do it
later.

- **Fail:** does it, offers it, scolds, or lectures.

## R-USES-MEMORY: mentions earlier work in plain words, with how long ago

When the record holds earlier lessons that matter here, the mentor mentions one in plain words
("you eased Title last week"). A "how long ago" is a plus, not required unless the skill asks for it.
It doesn't read out fields or dates as data and doesn't claim memory the record doesn't hold.

- **Fail:** ignores a relevant record, invents history, or reads out record fields.

## R-PREREQ-EASING: easing isn't known: named and offered, not reteached

When easing isn't learned (or nothing is eased yet), the mentor names easing as the place to start
and offers it, in a sentence or two. If the learner insists on this lesson it says once that it
builds on easing and goes on. It doesn't reteach easing or refuse.

- **Fail:** skips the prerequisite silently, refuses, or reteaches easing at length.

## R-UNREACHABLE: can't see the project, claims nothing about it

When After Effects can't be reached, the mentor says it can't see the project right now, passes on
the fix the error gave, and says nothing about the comp: no layers, no guess.

- **Fail:** names layers, proposes a focus, or invents a reason.

## R-DEMO-PLAIN: the demonstration is one change, in plain words, with Edit > Undo

The mentor makes one change, says what it did in plain words with real names, says Edit > Undo
reverses it, and hands the rest to the learner without offering to do them.

- **Fail:** says it changed more than one thing, names an undo label, uses field names, offers to do
  the rest, or claims a result the tool didn't return.

## R-ONE-DEMO-ONLY: a second demonstration is declined

After the one demonstration, if the learner asks to be shown again or on another layer, the mentor
declines warmly, says it shows one, and hands the next to the learner. It does not try again.

- **Fail:** shows a second, offers to, or says it can't without saying why.

## R-REVIEW-HANDS-ON: a review gives the task and no walkthrough

A review names the move and gives the task in a sentence or two. No demonstration, no walkthrough,
no menu path or tips on how, and no reteach. If the learner asks for a demo it says this one is all
theirs. Mentioning that a separate practice lesson (which may have a demo) is available is allowed;
doing a demo or walkthrough inside the review is not.

- **Fail:** explains how, names a menu or panel, offers a demo, or reteaches.

## R-REVIEW-NOTHING-NEW: retired (2026-10-27)

No case uses this item any more. A due review with nothing new on the comp is no longer a dead end:
the snapshot tool starts a lesson instead (spec 004 OR-1, FR-048 step 4). See R-AN-DUE-NOTHING-NEW-LESSON.

## R-RECORD-HONEST: the record says what the checks showed

After a lesson that stopped early, the mentor records it as partial (if it checked) or not checked
(if it never did), with demo use stated truthfully, and tells the learner in a short line that it has
noted it. The record is about the work only: no numbers from tool output, no method, no motive, no
names.

- **Fail:** records a pass that didn't happen, hides a demo, or puts method, motive or numbers in
  the summary.

## R-REVIEW-HINT: a review that doesn't pass gets hints, not a reteach

When the review's check doesn't pass, the mentor says what is still off and where (layer, property,
time), without reteaching, demonstrating, naming a menu path or offering a fix. The learner can try
again.

- **Fail:** reteaches, names the menu or steps, offers to fix, or says it passed.

## R-AN-INTENT-FIRST: asks which layer should turn or grow from where, before naming any place

The mentor asks, as a real question, which layer the learner wants to turn or grow from somewhere
other than its middle, and where it should turn from (a corner, an edge, or the middle), before it
names any place itself.

- **Pass:** "Which layer do you want to turn from somewhere other than its middle? And where from?"
- **Fail:** names a place first, starts building, or never asks.

## R-AN-PROPOSAL-HINGE: with no layer in mind, offers one layer with a hinge, in one sentence

When the learner has no layer in mind, the mentor offers the one candidate with a hinge place from
the read ("Door could swing from its left edge. Want to try that one?"). They can name another
place or layer.

- **Fail:** offers several, gives no hinge, or picks without asking.

## R-AN-LEAVE-OUTS: a leave-out is said on the turn the learner names that layer

The opening says none of this lesson's leave-outs (TD 19). When the learner names a layer the lesson
leaves out, the mentor says that layer's one sentence once, on that turn ("Sled and Card already move"
is only for a question about several layers at once): Anchor Point keyed, an expression-driven layer,
3D, a collapsed precomp, a layer that already moves, hidden or locked. It then offers the proposal or
the next candidate. It says nothing about a null's pivot, never lists every layer, and never says a
layer would "jump".

- **Fail:** a leave-out in the opening, a sentence about a layer the learner did not name, "jump", or
  the same sentence twice.

## R-AN-REPEAT-BACK: repeats the place in plain words and says where the pivot is now

After the learner names a layer and a place, the mentor repeats it in plain words with the layer's
name ("So Door turns from the middle of its left edge"), says where the pivot is now in place words,
gives the two sentences once (Anchor Point is where the pivot sits inside the layer; Position is
where that pivot sits in the comp; Pan Behind changes both together), shows one frame, and never
says the pivot shows in the frame.

- **Fail:** place codes, numbers, claims the pivot is visible in the frame, or the two sentences
  missing.

## R-AN-MOVED-WITH-PIVOT: a typed Anchor Point that moved the layer

When the pivot is in the right place but the layer moved with it, the mentor says so with the layer's
name and the direction, says Edit > Undo then Pan Behind (Y), and gives no numbers.

- **Fail:** no direction, any number, a fix, or "it passed".

## R-AN-NEIGHBOUR: a pivot one place off names where it is

For a pivot at a neighbouring place, the mentor names the place it is in and the place the learner
wanted, and which way they differ, in plain words, without numbers or fix.

- **Fail:** vague ("not quite"), place codes, numbers or a fix.

## R-AN-PASS: a correct Pan Behind passes, by layer and place

When the check passes the mentor says so plainly, by layer and place, and does not invent a fault.

- **Fail:** doesn't say it passed, or invents a fault.

## R-AN-WRONG-LAYER: the pivot moved on the wrong layer

When another layer's pivot moved instead, the mentor names both: the focus layer's pivot hasn't moved
and the other layer's did. It says Pan Behind moves the pivot of whatever layer is under the cursor
when the drag starts, so to Edit > Undo and start the drag right on the focus layer's own crosshair.
Selecting the layer first is never given as the fix (the learner may have had it selected). It does
not fix it.

- **Fail:** misses the other layer, says selecting the focus layer first is the fix, gives no
  Edit > Undo, or fixes it.

## R-AN-REST-KEY: a pivot set away from the layer's rest pose

For a layer with a rest key, the mentor names the rest key and the time before the learner starts
("Pop is full size at 4.3 s. Put the playhead there first"). If the pivot was set away from it, the
hint says the pivot did move though nothing may have shown (the layer is shrunk, or part-way through a
turn, at the time they set it), asks for Edit > Undo first, and only then for the playhead on the rest
key's time. The time the playhead was at is the one the check read; the rest time is the layer's own.
It says "far below it" (or another side) only when the tool gave the side; never a guess.

- **Fail:** no rest time, a wrong time, the playhead before Edit > Undo, says nothing moved, or a fix.

## R-AN-QUICK-SET: Quick Set Anchor is answered plainly, once, and the lesson goes on

When asked about Quick Set Anchor, the mentor answers in one or two sentences: it is a beta feature,
this lesson uses Pan Behind, and the check works whichever way they move the pivot. It never refuses,
gives no steps or shortcut, never says they don't have it, and carries on with Pan Behind.

- **Fail:** refuses, gives steps, says they don't have it, or ignores the question.

## R-AN-MATTE: a matte can be named, never called hidden

If the learner names a matte, the mentor accepts it and says Pan Behind needs it visible, so they may
turn its eye on to drag and should turn it back off after. It never calls a matte hidden.

- **Fail:** refuses the matte, calls it hidden, or omits the eye note.

## R-AN-MATTE-EYE: a matte's eye left on is mentioned, not scolded

After a pass in which a matte's eye was left on, the mentor says once to turn its eye back off, as a
note and not a mistake.

- **Fail:** treats it as a failure or never mentions it.

## R-AN-BASELINE: a text layer's pivot starts on its baseline

For a text layer the learner wants to turn from "the middle", the mentor says the pivot starts on the
baseline, under the letters, not in their middle, and never says it is already there.

- **Fail:** says it is already at the middle, or says nothing about the baseline.

## R-AN-DEMO: the demonstration moves one pivot without the layer moving

The mentor asks the learner to select the demo layer and press A then Shift+P, takes a frame, moves
that one pivot, takes a frame at the same time, and says both numbers changed and the layer didn't
move (the two frames look the same, on purpose), and that Edit > Undo reverses it. It never reads out
the values, and it adds no claim past what the tool showed: it never says the two numbers changed "in
opposite directions" or "by the same amount" (the 2026-10-26 smoke run did).

- **Fail:** reads out values, moves two pivots, shows a rotated frame, names an undo label, or
  describes how the numbers changed beyond "both changed".

## R-AN-WALKTHROUGH: with one focus layer there is no demo, only words

With one focus layer the mentor says that if it moved it there would be nothing left for the learner,
and walks them through it: select the layer, press Y, drag the crosshair to the place, and watch the
layer stay put. A second offer of a watch is not made (see R-AN-WATCH-OFFER).

- **Fail:** demonstrates, gives no walkthrough, or offers a watch a second time.

## R-AN-UNDERSTANDING: after a pass, which part stays still; a mix-up gets one light correction

After a pass the mentor asks which part of the layer will stay still when it turns. A right answer is
agreed in a few words; a wrong one gets one light correction ("the left edge, where the pivot is
now"). Either way the pass stands.

- **Fail:** doesn't ask, lectures, or takes back the pass.

## R-AN-SLID: one Position key, dragged with the playhead off it

When a layer with a single Position key was dragged with the playhead off that key, the hint names the
layer, says where it now sits at its key's time (in words: to the right, lower), that Pan Behind
changed Position only where the playhead was (and added a key there), and asks for Edit > Undo and the
playhead right on the key's time before dragging again. Never how far, and never "jump". Before the
try, the mentor said once that the playhead should be on that key.

- **Fail:** no time, no Edit > Undo, no playhead on the key, a distance, "jump", or a fix.

## R-AN-DRAGGED: the layer was dragged, not the pivot

When the layer moved and the pivot is still at its centre, the mentor says Pan Behind drags the pivot,
not the layer, and names the layer. No fix, no offer.

- **Fail:** no mention of Pan Behind, a fix, or an offer.

## R-AN-STOPWATCH: the stopwatch on Anchor Point

When Anchor Point's stopwatch is on, the mentor says the pivot would move over time, to turn it off and
keep the pivot they set.

- **Fail:** doesn't mention the stopwatch, or turns it off for them.

## R-AN-LOCKED: a locked layer is unlocked first

When the layer is locked the mentor says Pan Behind can't move it, to unlock it first (the lock switch
in the timeline), and does not offer to.

- **Fail:** no unlock sentence, or offers to unlock it.

## R-AN-CANT-CHECK: says it can't check that layer; never claims it didn't move

When a layer can't be read, the mentor says plainly that it can't check that layer right now and why.
It never says it didn't move, is in place, or passed.

- **Fail:** claims anything about the layer's pivot, or passes it.

## R-AN-CENTER-MENU: a menu path for the center place only, never a shortcut

If asked for a menu command to center the anchor point, the mentor may give Layer > Transform > Center
Anchor Point in Layer Content by menu path **only when the learner's place is the center**. It never
gives a keyboard shortcut. For any other place it gives no menu path and carries on with Pan Behind.

- **Fail:** gives the path for a place that isn't the center, gives a shortcut, refuses the center
  path when the place is the center, or drops Pan Behind for a non-center place.

## R-AN-NO-NUMBER: never a number to type, never a tolerance

When asked what numbers to type, the mentor gives none and hands the pending step back (pacing rule 3,
teaching design § 20). It need not repeat the place in words. It gives no tolerance, no pixel count.

- **Fail:** any number to type, any tolerance.

## R-AN-WATCH-OFFER: one offer of a watch, the last sentence of the invite turn

With one focus layer on a first lesson, after the walk-through in words and the invite to try, the
mentor ends that turn with one sentence offering to show the learner on another layer ("I could show
you on Needle first, if you like."), naming only the layer, never its place, and says nothing after
it. The offer runs nothing. It is made once: not after "no", not after a failed check, not later.

- **Fail:** no offer on a first lesson with one focus layer, two sentences of offer, anything after
  it in the turn, naming the place, a second offer, or running the demo before a yes.

## R-AN-NO-WATCH-OFFER: no watch offer where the skill says there is none

Where this skill has already been passed, in a review, or with two focus layers, the mentor makes no
offer to watch a demonstration at all and does not mention one.

- **Fail:** any offer or mention of showing the learner on another layer.

## R-AN-WATCH-YES: a yes to the watch offer runs the two-layer demo on the offered layer only

After a yes the mentor sets up two focus layers (the learner's first, the offered layer second), says
the offered layer's place in one sentence, asks for that layer to be selected with Anchor Point and
Position showing (A, then Shift+P) before it moves anything, then demonstrates on the offered layer
only. The learner's own layer is left for them in one sentence, with no second walk-through of the
steps (TD 20: the move turn already gave them). The ask for A and Shift+P comes in the turn **before**
the demo; the asking turn itself runs nothing.

- **Fail:** demonstrates on the learner's layer, skips the A and Shift+P ask, or names no place.

## R-AN-ALREADY-MOVES: a layer that already moves is left out, once, and another is offered

When the learner names a layer whose Position is keyed at two or more times, the mentor says once that
it already moves, so moving its pivot now would shift where it sits at its other keys, to set the pivot
before keying, and asks for a layer that doesn't move yet. It teaches no lesson on that layer, runs no
check or demo, and never says the layer would "jump".

- **Fail:** teaches on the layer, says "jump", says the sentence more than once, or offers no other
  layer.

## R-AN-TWO-FRAMES: a one-key layer with its rest on another frame gets the two-frames sentence

When the learner names a layer with a single Position key whose rest pose is at a different time, the
mentor says: its Position key is at one time but it is at rest at another, so moving its pivot now
would shift where it sits on one of those two frames; set the pivot before you key; pick another
layer. The two times are real and, when the learner named their own rest pose, the second is theirs.
It is said once, only because they named the layer. It is never "its other keys" (there are none) and
never "jump". It teaches no lesson on that layer and runs no check or demo.

- **Fail:** the Sled sentence ("its other keys"), a wrong or missing time, the tool's time when the
  learner gave their own, "jump", teaching on the layer, or no other layer offered.

## R-AN-OUTSIDE: a pivot outside the shape says which side and where to look

When the learner's layer has its pivot outside the shape, the mentor says it sits outside, on which
side as seen on screen (in words), that this is why it would swing wide, and to click the layer in the
timeline so its crosshair shows and start the drag there. No distance.

- **Fail:** no side where one is known, a side guessed, a distance, or no instruction on where to look.

## R-AN-GROUP-PIVOT: a shape's own pivot unchanged; a group's may have moved

When a shape layer's own pivot hasn't changed after "done", the mentor says so by layer name and offers
one possibility, that a pivot dragged while something under Contents was selected belongs to a group
inside the layer, and to click the layer's name in the timeline and drag its crosshair. It offers it
as a possibility, never as what they did, and does not also say the general "if something drives it,
like an expression" line.

- **Fail:** claims they moved the group's pivot, says the expression line too, fixes it, or never
  says the layer's own pivot is unchanged.

## R-AN-PRACTICING-PROPOSAL: practicing opens with one memory clause and the snapshot's proposal

When this skill is practicing, the first turn carries one clause from the record's `next`, with how long
ago when the record has it, then the intent question, then the **snapshot's own proposal** in one sentence
ending on the offer. The layer `next` names is not proposed; the learner can ask for it.

- **Fail:** proposes the layer `next` names instead of the snapshot's proposal, no memory clause, two
  clauses of memory, or the turn does not end on the choice.

## R-AN-NAMED-NULL: a named null gets one sentence, then the proposal

When the learner names a null, a camera, a light or an adjustment layer, the mentor says once that it is
that kind of layer, so there is nothing of its own to see turn in the frame (with its name), then offers
the snapshot's proposal in one sentence ending on the offer. It says nothing about a null's pivot, about
parenting, and never points at another lesson. It runs no check or demo on it.

- **Fail:** a pointer to another lesson, a word about a null's pivot or parenting, teaching on the
  layer, no proposal, or the sentence twice.

## R-AN-CONTINUED: a continued lesson is handed back in one sentence

When a lesson with a layer and place chosen is reopened, the mentor says where it left off in one
sentence (the layer and its place) and hands it back ("Ready to set it?"). No intent question, no
proposal, no leave-out, no restart.

- **Fail:** asks the intent question again, proposes a layer, names a leave-out, or names a layer that
  was not the one left open.

## R-AN-WHICH-LAYERS: the question is answered

Asked which layers can be used, the mentor names up to three layers the lesson can take, best first, in
plain words, without a list of leave-outs, and ends on the choice.

- **Fail:** deflects, lists every layer, names a layer that already moves, explains leave-outs, or ends
  with nothing to choose.

## R-AN-NO-CANDIDATE: a comp with no candidate gets one clause of why and the new-solid line

When the snapshot's proposal is null (the comp holds only a background, which is allowed if named and never
proposed), the mentor says in one clause why nothing here is a clean first pivot, then asks the learner to make a
small solid (Layer > New > Solid) and tell it when it's there. It never offers the background, a hinge on it, or a
list of reasons, and runs no check or demo.

- **Fail:** proposes the background (or any layer), names a place on it, lists several reasons, gives no
  way forward, or runs a demo or check.

## R-AN-ASKS-PLACE: a layer named with no place is asked for its place

When the learner names a layer and gives no place, the mentor asks where it should turn from (a corner, the
middle of an edge, or the center) before anything else. It doesn't pick a place for them, doesn't repeat a place
back as if chosen, and doesn't demonstrate or check. Saying where the layer's pivot is now, while still asking, is fine.

- **Fail:** chooses a place (even the layer's natural hinge), says "so Needle turns from ...", never asks, or
  demonstrates.

## R-AN-DUE-NOTHING-NEW-LESSON: a due review with nothing new starts a lesson and says nothing about the review

The learner's notes say a review is due, but every layer that could take it was used before. The first
turn is the ordinary lesson opening: the intent question (which layer, where it turns from), and the
proposal if there is one. The review is not mentioned, not offered, not declined, and the comp is not
described as having "nothing new".

- **Fail:** says there is a review, that it is due, that there is nothing new to review, or offers a
  review instead of the question; invents a target; runs a demo.

## R-AN-UNREADABLE-RECORD: one sentence about the notes, then a first lesson

The mentor's earlier notes couldn't be read. It says so once, in plain words, in one sentence, and goes
straight into a first lesson (the intent question, the proposal). Beyond that sentence it claims nothing about what the learner
did before, doesn't blame the learner, and shows no error code, file name or field.

- **Fail:** says nothing about the notes, says it more than once, makes a claim about earlier work,
  names a code or file, stops to ask the learner to fix it, or doesn't go on to the lesson.

## R-REVIEW-ASKED-NONE-DUE: a review asked for is a review, and nothing says it was not due

The learner asks for a review of a skill whose review is not due. A review runs: the mentor names a layer
and asks where it should turn from, no demonstration, no walkthrough. It never says the review wasn't due,
was early, or that this is a "bonus"; it does not lecture about the schedule.

- **Fail:** refuses or redirects to a lesson, says it isn't due or is early, demonstrates, or explains how
  before "done".

## R-AN-MASKED: a masked layer the learner names is taught, with one sentence about the mask

When the learner names a layer that has a mask, the mentor takes it and teaches as usual. It says once, in one
sentence, that it goes by the whole layer's edges, not just the part that shows. It does not refuse the layer,
ask for another, or lecture about masks.

- **Fail:** refuses the layer or asks for another, says nothing about the mask, or explains masks at length.

## R-AN-MASKED-NOT-OFFERED: a masked layer is not the mentor's own proposal

When the mentor proposes a layer itself, it is not the masked one (the snapshot ranks a masked layer as
"only if named"). The proposal is the snapshot's own, named by its real layer name.

- **Fail:** proposes or suggests the masked layer, or names a layer the snapshot didn't propose.

## R-AN-NOT-ON-SCREEN: a focus layer not drawn at its check time gets one plain sentence

If the layer isn't showing at the time the check will read, the mentor says so once in plain words (its
crosshair won't show either) and tells the learner to move the playhead into the layer's bar first. It says
no more than that and gives no time or number the tool didn't give.

- **Fail:** no mention, blames the learner, a long explanation, or a guessed time.

## R-AN-DONE-BEFORE-WALKTHROUGH: a "done" before the walk-through gets the walk-through, not a hint

The learner was asked to show both numbers (A, then Shift+P), then says a bare "done" with nothing changed in
the comp, before the walk-through (step 3) has run. The mentor treats it as "ready for the move" and gives the
walk-through for the layer: select it, press Y for Pan Behind, start the drag on the layer's crosshair, take it
to the place; the layer stays put. It names the layer and Pan Behind.

- **Pass line:** "Press Y for Pan Behind, start your drag right on Door's crosshair, and take it to the middle
  of its left edge. It changes both numbers together, so Door stays put." Nothing says or implies the learner
  tried and it didn't work.
- **Fail:** says the attempt failed or that something is off or unchanged, a hint for a failed check, asks the
  learner to try again, offers to move the pivot, or has no walk-through. Step 4's one watch offer on
  another layer ("I could show you on Needle first, if you like.") is allowed here (2026-11-06).

---

## R-CONTINUES: a resumed lesson picks up where it was (RQ-12)

*Added for spec 007 (the Continue case).* The panel's Continue button sends "I'm back. Pick up where we
left off." into a lesson that was open. The learner has answered the lesson's opening question and
nothing else has happened. The mentor says in a clause that it's picking up, says back the layer and the place the learner named (Door, the middle of its left edge) as
the learner's own, and hands over the one pending step in a sentence or two. It doesn't open again with
a fresh proposal, doesn't re-ask what was answered, doesn't recap the whole lesson, makes no change to
the project, and doesn't demonstrate.

- **Pass:** "Picking up with Door turning from the middle of its left edge. Set its pivot with Pan Behind and say done."
- **Fail:** a fresh opening, asks "which layer do you want to turn from somewhere other than its middle?" again, a recap of everything said so far, a demonstration, or a
  turn that ends with nothing for the learner to do.

## R-SHOW-ME-AGAIN: Show me again explains the change already made and changes nothing (RQ-14)

*Added for spec 007.* The learner pressed Show me again after the one demonstration: "Show me again:
explain the change you already made, with a frame. Don't change anything." The mentor explains the one
change it already made, in plain words with real names: which layer's pivot moved and that the layer itself didn't, never the values. It shows a frame from the
comp with it (the runner checks that `preview_frame` ran in this turn), and hands the rest back in one
sentence. It makes no second demonstration, doesn't make any change, doesn't walk through the how-to
again, and doesn't claim a result the tools didn't return.

- **Pass:** "Tab's pivot moved to the middle of its left edge, and the layer didn't move. The two frames look the same, on purpose. Edit > Undo takes it back. Door is yours."
- **Fail:** a second demonstration or an offer of one, an explanation of something other than the change
  it made, a repeat of the whole walk-through, numbers or field names, or a turn that ends with nothing
  for the learner to do.

## R-NEW-LESSON-ASKED: "New lesson" on a skill with a review due opens a lesson (RQ-02)

*Added for spec 007.* The record says a review of this skill is due, and the learner asked for a new
lesson: `/anchor-mentor lesson`. The runner checks that the snapshot opened a lesson. The mentor opens the lesson the way it opens
any other: "Which layer do you want to turn from somewhere other than its middle? And where from?". It says nothing about a review: no "review", no "warm up", no "it's been a few days
since you learned…" as a reason for what it does, and no offer of a review instead.

- **Pass:** "Which layer do you want to turn from somewhere other than its middle? And where from?"
- **Fail:** mentions a review, offers one, says one is due, or opens as a review (the task with no
  walkthrough) when the learner asked for a lesson.

## R-AN-NOTHING-CHANGED-NO-GUESS: when nothing changed, it says so and asks, without guessing a cause (T059, 2026-11-09)

The check shows Door's pivot exactly as it was at the last check, and the learner hasn't said the pivot snapped
back or that something fought them. The mentor says plainly that Door's pivot is where it was (or "didn't
change"), and asks what they did or to try Pan Behind again. It doesn't offer a cause it cannot see (an expression,
a lock, a setting). Door has no expression here.

- **Fail:** names or hints at a cause ("something may be driving it", "like an expression", "a setting could be
  fighting you") the tool never reported, or says nothing about the lack of change.
