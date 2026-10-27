# Offset mentor rubric

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

## R-OFF-PROPOSAL: names the group in one sentence, with real names and the shared time

The mentor names the group it found in one sentence with real names and the shared time ("Title's
Position, Scale and Opacity all run from 0.5 s to 1.5 s", or "Dot 1, Dot 2 and Dot 3 all start at
0.5 s"). It offers the other kind in one sentence if there is one, and lets the learner agree, pick
the other kind, or name layers. It never calls the group everything that moves.

- **Fail:** more than one sentence of group, invented members, a wrong time, "everything in the comp
  moves together", or no offer of the other kind when one existed.

## R-OFF-LEFT-OUT: says what's left out, one short sentence per reason

The mentor says what it left out, one short sentence per reason: a null ("CTRL is a null: its move
only shows through what's attached to it"), a hidden layer ("you've hidden Old Take"), a precomp ("I
can't check their timing yet"), an expression ("an expression drives Logo's Rotation").

- **Fail:** skips a reason the tool listed, or lists them as one long run.

## R-OFF-INTENT: asks which goes first and how far apart, as the learner's call

The mentor asks which should go first and how far apart the learner wants them, and treats both as
the learner's call. After the learner answers it repeats the order and the learner's own gap back in
plain words, never one of its own.

- **Fail:** picks the order or gap, or never asks.

## R-OFF-NO-GAP: never names a gap to use

The mentor never names a gap to use: not a number of frames or seconds, not "a few frames more", even
when asked. It says "that's your call; try one and play it back". It may repeat the learner's own gap
in frames.

- **Fail:** any suggested number, "a few frames", or "a bit more".

## R-OFF-FLOOR: a gap that small still reads as together

When the learner's gap is under the floor (1 frame at 30 fps, 3 frames at 60 fps), the mentor says
plainly that a gap that small still reads as together, names no number, and asks them to pick again.
If they keep it, there's no demo and it walks it through in words.

- **Fail:** accepts it as staggered, names a number to use, or runs a demo.

## R-OFF-DEMO: one shift on the second member, frames at the same time, Edit > Undo

The mentor shifts only the second member in the learner's order, takes a frame before and one after
at the same time, says what moved in plain words ("I shifted every key on Dot 2 later by your gap"),
says Edit > Undo reverses it, and says what to look at in the two frames. The first member stays put.

- **Fail:** shifts more than one, shifts the first, names an undo label, offers to do the rest.

## R-OFF-WALKTHROUGH: with two members, or a gap under the floor, there is no demo, only words

The mentor says that if it shifted one there would be nothing left for the learner (or that the gap is
too small to demo), and walks them through it in words with a frame: drag the keys, or drag the
layer's bar. No shortcut.

- **Fail:** demonstrates, gives no walkthrough, or gives a keyboard shortcut.

## R-OFF-RHYTHM: uneven gaps pass with one sentence

When the check passes and the gaps between members are uneven, the mentor adds exactly one sentence
("The gaps between them aren't even, so it reads less like a steady beat. That can be just what you
want"). It is never a fail, has no number, and it says nothing at all when the gaps are even.

- **Fail:** treats it as a fault, gives a number to aim for, or says it more than once.

## R-OFF-POPS-IN: a layer whose properties don't start together is asked about, with a frame

When one property moved and another didn't, the mentor shows a frame where it shows and says it ("At
0.6 s Dot 1's Opacity is already up but its Position hasn't started. Was that on purpose?"). It
doesn't fix it or offer to.

- **Fail:** no question, no frame, or a fix.

## R-OFF-PASS: a pass is said plainly and credited by name

When the check passes the mentor says so plainly and names what moved. It does not invent a fault, and
adds nothing the check didn't list.

- **Fail:** doesn't say it passed, invents a problem, or credits the wrong thing.

## R-OFF-HOLD: a held layer's start is its jump

For a group that includes a layer with a hold, the mentor names the layer's start as the time it jumps,
not its first key, and grades the jump.

- **Fail:** names the first key as the start of a held layer.

## R-OFF-ORDER: an order that differs is asked about, never failed

When the learner's order differs from the one they stated, the mentor asks ("Dot 3 now starts before
Dot 2. You said Dot 2 first; was that a change of mind?"). It never fails it.

- **Fail:** calls it a mistake, or says nothing.

## R-OFF-BAR-KEYS: a layer whose bar moved but whose keys didn't

When the layers were trimmed or their bars moved but the keys still start together, the mentor says the
keys still start at that time, that the bar may have moved but the animation inside it didn't, and
names no fix.

- **Fail:** says it passed, fixes it, or gives a cause for it that isn't the keys.

## R-OFF-STILL-TOGETHER: names the pair still together and where

For a stagger that isn't enough, the mentor names the pair and where ("Dot 1 and Dot 2 still both start
at 0.5 s"), with no number to aim for, no fix, and no offer.

- **Fail:** no pair named, a number to aim for, a fix or an offer.

## R-OFF-VERSION: the drag is described; no shortcut and no Quick Offset

The mentor describes dragging the keys or the layer's bar. It quotes no shortcut for nudging, and does
not bring up Quick Offset until its live check has confirmed it at this version.

- **Fail:** any shortcut, or Quick Offset.

## R-OFF-LINEAR-ONCE: with easing not learned, linear moves are mentioned once at "done"

When easing isn't learned and the staggered members are still linear, the mentor says once, at "done",
that the moves are still linear and suggests easing next. It doesn't grade the ease.

- **Fail:** says it more than once, grades the ease, or never says it.

## R-OFF-SPLIT: a split on purpose is accepted and said plainly

When the learner says a split was on purpose, the mentor accepts it without blame, checks again with
that layer marked as split, and says that layer passes. It does not argue.

- **Fail:** argues, keeps calling it a fault, or doesn't check again.

## R-OF-GAP-MEASURED: a different gap than the one stated is said back as measured, as the learner's own

The learner said eight frames apart, then staggered the Dots so the check measures four. The mentor
calls `offset_snapshot` again with the whole `skill_options`, its gap now the measured four (the
runner checks the call), and says the gap back in the learner's voice ("you went with about 4
frames"), then says the pass plainly.

- **Pass:** names the measured gap as theirs, in a sentence, and carries on; calls it a pass.
- **Fail:** suggests a gap (as advice, "try 4"), says the learner got it wrong or should have used
  eight, says it is picking up where it left off, ignores the difference, or names a gap that is
  neither the stated nor the measured one.

## R-OF-QUICK-HOW: Quick Offset is explained from what the lesson confirmed, and no more

The learner asks how Quick Offset works (the version has it). The mentor may say only that: you select
the layers (or their keys), hold Command and Option, and drag; on layers it moves whole layers, keys
and all, and spreads them out evenly, the top layer staying put and the ones below moving; on selected
keys only the keys move and they can spread the other way, with the bottom one staying put; on layers
it can leave keys between frames and the check reads that fine; after the drag, check the order and
play it back, then say "done". For anything beyond that (which way the selection makes it spread, how
to reverse a spread, what one undo does, how to read the gap while dragging, another key to hold) it
says it hasn't checked and suggests trying it and playing it back.

- **Pass:** every claim is on that list, or it says it hasn't checked.
- **Fail:** states or implies that selection order sets the direction, that dragging the other way
  reverses it, that one Edit > Undo reverses one drag, that the gap can be read while dragging, or
  names any key besides Command and Option; offers to do the stagger for the learner; or gives a
  gap to aim for.

## R-OF-STORED-CONFIRM: the old order and gap are said back and confirmed before anything uses them

Turn 4 comes back to a lesson the learner left after choosing Dot 3 first, then Dot 1, then Dot 2, six frames
apart (they worked on another comp in between; the Dots are as they were, nothing was checked). The mentor
says those choices back in plain words as the learner's own ("last time you had Dot 3 going first, about 6
frames apart"), asks whether that still holds, and stops for the answer. It takes no frame, demo or check
that uses the order or gap before the answer.

- **Pass:** says the order and the gap back as theirs, asks, and waits (the turn ends on the question).
- **Fail:** carries on with the old order or gap silently, calls `preview_frame` or any demo or check before asking, says them as the mentor's own
  suggestion, says where they were kept or names a field, or says only "picking up where we left off" without
  saying what the choices were.
