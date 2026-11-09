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
- A mentor remark about a blank, empty or placeholder frame ("the frame came back blank", "I can't see
  it in the preview") is a fixture artifact. Ignore it for every item, including R-ONE-IDEA: don't count
  it as an idea, as length, or as a lecture, and don't fail an item for it or for how the mentor words it.
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

**Reading for this skill's lesson turns (TD § 15, 2026-10-28):**
- **Explanation turn (the idea, and the task):** the focus confirmed in a clause, the one frame with
  at most one clause on where the layer is, and the held-example clause ("the way Dot 1 already jumps
  at 0.5 s") are context for the idea sentence ("a hold keeps the value until the next key, then
  jumps"). The how-to sentence (the start key of each pair by time, Toggle Hold Keyframe or
  right-click) and the ask are **one task**. It passes if it ends on "hold them and say done". A
  recap of every pair's values, a second explanation, frames of a held pair's jump nobody asked for,
  a bulleted list of methods, or "select all three and do them together" fails it.
- **Demo turn:** says what the one hold changed, the frames either side, Edit > Undo, and hands the
  rest back in one sentence by start time ("The 1.4 s and 1.8 s pairs are yours; say done."). It
  fails on a second walk-through of the how-to or on a second demonstration.
- **Pass turn:** "That passes" with what they held in one clause, and the linear question as its
  last sentence, are **one handover**. It fails when the linear question is missing, or when it adds
  a third thing (a menu path, a recap).
- **A turn that answers a side question or a "do it for me":** passes as the answer in one or two
  sentences plus the pending step again in one sentence. It fails when it adds the next stage or the
  walk-through a second time.

- **Fail:** a wall of explanation, three ideas at once, or a turn that ends with nothing for the
  learner to do.

## R-HINT-NOT-FIX: says what's off and where, doesn't fix or offer to

When an attempt is incomplete or wrong, the mentor says what is still off and where, with real names
(and a time where it has one). It doesn't do it for the learner and doesn't offer to.

- **Fail:** "Want me to fix that?", "I'll do the rest", or exact steps spelled out as the fix.

## R-ASK-RUNS-DEMO: "do the rest" before any demo is the ask

(Added 2026-10-28, TD § 15 item 7, amended Eval plan KT-e.) When the learner asks the mentor to
hold the rest before any demonstration, and there is something to demonstrate, that is the ask: the mentor
runs its one demonstration, says what changed in plain words, says Edit > Undo reverses it, and hands
the rest back in one sentence ("The 1.4 s and 1.8 s pairs are yours; say done."). It doesn't repeat
the how-to, and it makes no offer to do the others later.

- **Pass:** one demonstration and "The other two are yours; say done."
- **Fail:** declines instead of demonstrating, demonstrates and then lectures the how-to again,
  offers to do the others, or does more than the one.

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
right-click the key). A shortcut follows `R-KT-VERSION`: the two confirmed ones may be given on
After Effects 26.5 on a Mac, none elsewhere. (Changed 2026-10-28, after seeing results.)

- **Fail:** demonstrates, gives a shortcut the checks did not confirm (or one on another version),
  gives no walkthrough, or leaves out the menu path and the right-click.

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

## R-KT-VERSION: the confirmed menu names only, no wrong shortcut, no Freeze Frame

The mentor names Animation > Toggle Hold Keyframe or the right-click on the key (and Animation >
Keyframe Interpolation… for linear). It never says "freeze" for hold and never names Layer > Time >
Freeze Frame. Shortcuts follow KT-j as amended 2026-10-26 (L-2): on After Effects 26.5 on a Mac, the
two confirmed ones may be given (Control+Option+Command+H for Toggle Hold Keyframe, Option+Command+K
for Keyframe Interpolation); on any other version, or when the version is unknown, no shortcut at all.
Any other shortcut fails on every version.

- **Fail:** a shortcut the live checks did not confirm, either confirmed one on another version,
  "freeze", or Freeze Frame.

## R-KT-TOGGLED-OFF: a pair that was held and now isn't is told it's a toggle, once it happens

(Added 2026-10-28, TD § 15 item 4.) When a check this lesson showed a pair as held and the next check
shows it as not held, the mentor says Toggle Hold Keyframe is a toggle, so using it again on a held key
turns the hold off, and names the pair by layer, property and time. It gives a hint, not a fix: it
doesn't re-hold the pair for the learner or offer to. It never says the toggle warning before the
pair has gone from held to not held (the earlier turns, with the pair held or never touched, carry no
such warning).

- **Pass:** "Blink's Opacity pair from 1.4 s to 1.8 s isn't held any more: Toggle Hold Keyframe is a
  toggle, so using it again on a held key turns the hold off. Select the key at 1.4 s and use it once more."
- **Fail:** the warning is missing, the pair isn't named, the warning comes before the pair went from
  held to not held, or the mentor re-holds it or offers to.

## R-KT-REVIEW-ENDS: "nothing should snap" ends the review and records nothing

When the learner says nothing here should snap, the mentor ends the review kindly. It records nothing,
so the skill stays due.

- **Fail:** invents a target, records the review, or lectures.

## R-KT-WRONG-SIDE: a hold on the wrong side is never called done

When a pair is held on the wrong side, the mentor does not call the pair done and points at the key at the
start of the pair as the one that should hold ("The key at 1 s decides how the value leaves it"). It must
not be required to describe the motion: the skill forbids describing it, and forbids times beyond the
pair's own key times. It does not fix it.

- **Fail:** says it is done, doesn't point at the right key, or fixes it. Not a fail: saying nothing about how the pair moves.

## R-KT-STORED-CONFIRM: what should snap is said back and confirmed before the intent question

Turn 4 comes back to a lesson the learner left after saying Blink's Opacity should snap (they worked on another
comp in between; nothing was checked). The mentor says that back in plain words as the learner's own ("last time
you said Blink's Opacity should snap"), asks whether that still holds, and stops for the answer. It does not ask
the intent question fresh, and takes no frame, demo or check, before the answer.

- **Pass:** says the focus back as theirs, asks, and waits.
- **Fail:** asks "is anything here meant to snap" as if nothing was said, carries on with the old focus silently,
  calls `preview_frame` or a demo or check before asking, says where it was kept or names a field.

## R-UNREADABLE-NOTES: an unreadable record is said once, plainly, and a first lesson follows

The snapshot reply says the notes couldn't be read. The mentor says so once, in one sentence and in
plain words ("I couldn't read my notes from your earlier lessons..."), and teaches a first lesson on
this comp as if there were no history. Nothing is said before the snapshot call.

- **Fail:** says nothing about the notes, says it more than once, blames the learner, names a file,
  a field or an error code, pretends to remember earlier lessons, or stops instead of teaching.

## R-PRACTICING-MEMORY: a practicing skill picks up what was still off, in plain words

The snapshot reply shows the skill is being practiced and what was still off. The opening mentions
the earlier work in one sentence, in plain words and with how long ago, and goes on with this lesson.
It never names a skill ID or a field.

- **Fail:** ignores the earlier work, invents work that isn't in the reply, gives no sense of when,
  or says a skill ID or field name.

## R-OR1-LESSON: a due review with nothing new on this comp opens a lesson and never mentions the review

The learner's record says a review is due, but this comp has nothing new for it. The tool opens a
lesson; the mentor teaches it (or says plainly what this comp lacks for the lesson) and never says
a review was due, offers one or says there is nothing to review.

- **Fail:** mentions a review, "due", or "nothing to review"; or invents a target.

## R-REVIEW-ASKED-NOT-DUE: a review the learner asked for runs, and nothing says it wasn't due

The learner asked for a review and none was due. The review runs the usual way: the first words ask
for the move or give the task, hands-on, no demonstration.

- **Fail:** says the review wasn't due, was early or wasn't scheduled; refuses; or turns it into a lesson.

## R-REVIEW-REOFFER: a review left open is offered again, not replaced by a lesson

The learner came back in a new session after a review was offered and never answered. The first
words offer the review again, built from the earlier work and how long ago, then stop for the answer.

- **Fail:** starts a lesson, calls a demo, asks the lesson's first question before the offer is
  accepted, or doesn't mention a review at all.

## R-UNREADABLE-NOT-A-CLAIM: with unreadable notes, nothing is claimed about what the learner has or hasn't done

When the notes couldn't be read, the mentor doesn't know whether easing (or anything else) was learned.
It may ask, or say it doesn't know or has nothing marked, or just teach. It never says they haven't done it.

- **Fail:** "you haven't learned easing", or any other statement about earlier work taken from the missing notes.

---

## R-RENUMBER-OK: a layer that moved down the stack is graded as the same layer

*Added for the overlap-audit re-run (2026-10-29, case 27).* The learner added a null above the focus
layer mid-lesson, so the layer has a new number. The check matches layers by name. The mentor grades
the focus layer from the check's result: it doesn't say the holds are missing, removed or changed
because of the new number, doesn't call the added null a mistake, and doesn't ask the learner to undo
it. It may mention the new layer, briefly and neutrally. If the check passed, it says so.

- **Pass:** "That passes: Blink snaps at every blink now. I see a new null on top; that doesn't change this."
- **Fail:** "Blink's keys were removed or changed", "I can't find Blink", or asking to delete the null first.

## R-KT-EXPRESSION-FOCUS: an expression turned on over a focus pair is named, not graded

*Added 2026-10-29 (case 28).* The learner held the pairs and then an expression was turned on over that
property. The mentor says an expression drives it now, so it can't check those keys, and asks whether
that was meant. It doesn't say the holds worked or failed, doesn't tell the learner to remove the
expression, and doesn't say the lesson passed.

- **Pass:** "An expression drives Blink's Opacity now, so I can't check its keys. Was that meant?"
- **Fail:** "Blink snaps now, nice", "your holds are missing", "delete the expression", or a record of `passed`.

## R-KT-GUIDE-OUT: a guide layer is left out in plain words and never the demo

*Added 2026-10-29 (case 30).* A candidate that is a guide layer is named as left out, with its reason
in one short sentence ("it never shows in the render"), and offered back only if wanted. If the learner
names it anyway, the mentor teaches it in words and holds nothing for them, since a frame wouldn't show it.

- **Pass:** "Blink is a guide layer, so it never shows in the render; I'll leave it unless you want it."
- **Fail:** proposes the guide layer as a candidate without saying it's a guide, calls it hidden, or
  holds it as the demonstration.

## R-KT-DEMO-REFUSED: a demonstration the tool refused is said plainly and nothing is claimed

*Added 2026-10-29 (case 31).* The learner copied the focus layer, so two layers share its name and the
demo tool refuses. The mentor says in plain words that two layers have that name now, asks the learner
to rename the copy or undo it and ask again, and doesn't hold anything on either layer. It doesn't say
a demo happened, doesn't pick one of the layers, and uses no error code or field name.

- **Pass:** "There are two layers named Blink now, so I can't tell which to show it on. Rename the copy
  or Edit > Undo, then ask again."
- **Fail:** says it held a pair, shows a frame as if held, names an error code, or offers to hold the copy.

---

## R-CONTINUES: a resumed lesson picks up where it was (RQ-12)

*Added for spec 007 (the Continue case).* The panel's Continue button sends "I'm back. Pick up where we
left off." into a lesson that was open. The learner has answered the lesson's opening question and
nothing else has happened. The mentor says in a clause that it's picking up, says back what was meant to snap (Blink's Opacity) as
the learner's own, and hands over the one pending step in a sentence or two. It doesn't open again with
a fresh proposal, doesn't re-ask what was answered, doesn't recap the whole lesson, makes no change to
the project, and doesn't demonstrate.

- **Pass:** "Picking up with Blink's Opacity. Hold the pairs you meant to snap and say done."
- **Fail:** a fresh opening, asks "is anything here meant to snap" again, a recap of everything said so far, a demonstration, or a
  turn that ends with nothing for the learner to do.

## R-SHOW-ME-AGAIN: Show me again explains the change already made and changes nothing (RQ-14)

*Added for spec 007.* The learner pressed Show me again after the one demonstration: "Show me again:
explain the change you already made, with a frame. Don't change anything." The mentor explains the one
change it already made, in plain words with real names: which pair is held and that it now snaps. It shows a frame from the
comp with it (the runner checks that `preview_frame` ran in this turn), and hands the rest back in one
sentence. It makes no second demonstration, doesn't make any change, doesn't walk through the how-to
again, and doesn't claim a result the tools didn't return.

- **Pass:** "Blink's Opacity is held on its first pair now, so it snaps there instead of fading. Edit > Undo takes it back. The other pair is yours."
- **Fail:** a second demonstration or an offer of one, an explanation of something other than the change
  it made, a repeat of the whole walk-through, numbers or field names, or a turn that ends with nothing
  for the learner to do.

## R-NEW-LESSON-ASKED: "New lesson" on a skill with a review due opens a lesson (RQ-02)

*Added for spec 007.* The record says a review of this skill is due, and the learner asked for a new
lesson: `/key-types-mentor lesson`. The runner checks that the snapshot opened a lesson. The mentor opens the lesson the way it opens
any other: "Is anything here meant to snap, like a blink, an on/off, or a cut?". It says nothing about a review: no "review", no "warm up", no "it's been a few days
since you learned…" as a reason for what it does, and no offer of a review instead.

- **Pass:** "Is anything here meant to snap, like a blink, an on/off, or a cut?"
- **Fail:** mentions a review, offers one, says one is due, or opens as a review (the task with no
  walkthrough) when the learner asked for a lesson.
