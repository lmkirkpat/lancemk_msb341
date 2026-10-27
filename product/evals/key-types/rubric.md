# Key types mentor rubric

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

## R-KT-INTENT-FIRST: asks what is meant to snap before proposing anything

The mentor asks, as a real question, whether anything here is meant to snap (a blink, an on/off, a
cut) before proposing a focus or telling the learner what to hold. It does not start by explaining or
by setting a focus itself.

- **Pass:** "Is anything here meant to snap, like a blink, an on/off, or a cut?"
- **Fail:** proposes the focus first, starts building, or never asks.

## R-KT-CANDIDATES-AS-QUESTIONS: candidates are questions, never mistakes, at most three

The mentor names at most three candidates, by layer and property, as questions ("Blink and Cut fade in
and out. Is either meant to snap instead?"). A fade is usually meant to fade; it never calls a fade a
mistake or says what the learner should hold.

- **Fail:** more than three, a candidate stated as a mistake, or an instruction to hold.

## R-KT-DROP-NO-ARGUMENT: "it's meant to fade" is accepted

When the learner says a candidate is meant to fade, the mentor drops it without argument ("Got it, that
one stays a fade"). If nothing is left it says nothing here is meant to snap and never invents a focus.

- **Fail:** argues, suggests it should snap anyway, or invents another focus.

## R-KT-PRACTICE-OFFER: with nothing to snap, offers a practice blink or Mentor Practice 2

When no candidate remains, the mentor offers to make a practice blink (four Opacity keys, half a
second apart, at 100, 0, 100, 0) or to use Mentor Practice 2, which has a blink. If the learner
declines both it ends kindly.

- **Fail:** invents a focus, ends with no offer, or sets the focus on a fade.

## R-KT-DEMO: the demonstration holds one pair and says it plainly

The mentor holds the one demo pair, says what changed in plain words with the layer, property and time,
shows the frames it returned, and says Edit > Undo reverses it. If the jump lands on Opacity 0 it says
the layer vanishes there. It hands the rest to the learner.

- **Fail:** holds more than one, names an undo label, offers to do the rest, or shows a blank frame as
  proof of the jump.

## R-KT-WALKTHROUGH: with one focus pair there is no demo, only a walkthrough in words

With one focus pair the mentor says that if it held it there would be nothing left for the learner,
and walks them through it in words, with the menu named (Animation > Toggle Hold Keyframe, or
right-click the key) and no shortcut.

- **Fail:** demonstrates, gives a shortcut, or gives no walkthrough.

## R-KT-SHOULD-MOVE-HELD: a property that should fade but now holds is named, gently

When the learner held everything including a layer they said should fade, the mentor says where it now
waits and then jumps ("Cut doesn't fade between 3 s and 3.1 s now; it waits and then jumps"), asks
about any extra holds elsewhere ("Card's Position jumps now too, was that meant?"), and gives no fix.
Extra holds don't fail the lesson.

- **Fail:** fixes it, offers to, scolds, or ignores the extra holds.

## R-KT-EXPRESSION: an expression-driven property is never marked or told to go linear

When the learner names a constant-speed move that an expression drives, the mentor says an expression
drives it so it can't check its keys, says that is fine, notes nothing against the learner, and does
not tell them to set its keys to linear.

- **Fail:** says it is linear, says to set the keys to linear, or counts it against the learner.

## R-KT-LEFT-OUT: says what's left out and why, in one short sentence each

The mentor says what it left out, one short sentence per reason: an expression drives it, already
held, hidden, a precomp it can't see inside. A layer driven by an expression is never offered as a
candidate to snap.

- **Fail:** offers the expression layer as a candidate, or says nothing about why it is out.

## R-KT-NOT-HIDDEN: a see-through layer is never called hidden

A layer held at Opacity 0 has its eye on; it vanishes there. The mentor says "vanishes" or "see-through",
never "hidden". "Hidden" is only for a layer whose eye is off.

- **Fail:** calls Blink (or any eye-on layer) hidden.

## R-KT-LINEAR-CHECK: linear on purpose is the understanding check

Once every focus pair is held, the mentor asks whether any move should run at constant speed. If the
learner names one that is linear, it confirms it will stay that way. If it is eased, it says in one
sentence which pair and which end isn't linear, and how to set those keys to Linear, and checks again
on "done". It does not fix it.

- **Fail:** skips the question, says an eased move is linear, or fixes it.

## R-KT-VERSION: the confirmed menu names only, no shortcut, no Freeze Frame

The mentor names Animation > Toggle Hold Keyframe or the right-click on the key. It quotes no keyboard
shortcut, never says "freeze" for hold, and never names Layer > Time > Freeze Frame.

- **Fail:** any shortcut, "freeze", or Freeze Frame.

## R-KT-REVIEW-ENDS: "nothing should snap" ends the review and records nothing

When the learner says nothing here should snap, the mentor ends the review kindly. It records nothing,
so the skill stays due.

- **Fail:** invents a target, records the review, or lectures.

## R-KT-WRONG-SIDE: a hold on the wrong side is never called done

When a pair is held on the wrong side, the mentor says the pair still fades and points at the key at the
start of the pair ("The key at 1 s decides how the value leaves it"). It does not call it done and does
not fix it.

- **Fail:** says it is done, doesn't point at the right key, or fixes it.

## R-KT-STORED-CONFIRM: what should snap is said back and confirmed before the intent question

Turn 4 comes back to a lesson the learner left after saying Blink's Opacity should snap (they worked on another
comp in between; nothing was checked). The mentor says that back in plain words as the learner's own ("last time
you said Blink's Opacity should snap"), asks whether that still holds, and stops for the answer. It does not ask
the intent question fresh, and takes no frame, demo or check, before the answer.

- **Pass:** says the focus back as theirs, asks, and waits.
- **Fail:** asks "is anything here meant to snap" as if nothing was said, carries on with the old focus silently,
  calls `preview_frame` or a demo or check before asking, says where it was kept or names a field.
