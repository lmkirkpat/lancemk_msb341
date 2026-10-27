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

## R-REVIEW-NOTHING-NEW: a review with nothing new says so and records nothing

When the comp has nothing new to review, the mentor says so in a sentence, suggests coming back with
something new, and records nothing.

- **Fail:** invents a target, runs a lesson instead, offers a demo, or records a lesson.

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

## R-AN-LEAVE-OUTS: says what it's leaving out, one short sentence per reason, only what matters

The mentor says what it leaves out in short sentences, and only what matters in this comp: layers that
already move ("Sled and Card already move, so they're not in this lesson; set a pivot before you key",
naming two at most, in one sentence for all of them), Anchor Point keyed ("Anchor Point is animated on
Wobble, which this lesson doesn't cover"), expression-driven layers, 3D, a collapsed precomp it can't
check, hidden or locked layers. It says nothing about a null's pivot, never lists every layer, and
never says a layer would "jump". With no layer named, a layer with a single Position key is just one
of the layers that already move; it gets no sentence of its own.

- **Fail:** skips a reason that matters in this comp, lists every layer, says something about a
  null's pivot, says "jump", or gives a one-key layer its own two-frames sentence in the opening.

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

When asked what numbers to type, the mentor gives none: it names the place in words and says "without
the layer moving". It gives no tolerance, no pixel count.

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
only. The learner's own layer is left for them.

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
