# Null parenting mentor rubric

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
- If an item's trigger never happens in the transcript (for example, `R-HINT-NOT-FIX` when every
  attempt passed), it **passes**. Give the reason "not triggered".
- Deterministic facts (how many demos ran, whether "null" was said in a review, shortcuts, field
  names, the check's verdict) are checked by the runner, not the judge. Use them as context, not
  as rubric items.
- A preview frame may come back as an empty placeholder in these runs. Never fail an item because
  a frame looked blank or because the mentor said little about it.
- The comp's layers are on screen but the tool replies give no positions. Where a layer sits on
  screen is known only from a frame the mentor has shown; claims about it are failures.

---

## R-ASKS-FIRST: asks which layers should move as one before anything else

The mentor asks the learner, in its own words, which layers should move as one (a lower third's
parts, a logo lockup), as a real question, before any proposal is acted on or any setup begins.

- **Pass:** "Which layers should move as one? If you're not sure, I have a group in mind."
- **Fail:** it starts building (asks for a null, asks to parent), or tells the learner what the
  group is without asking, or asks about something else first.

## R-PROPOSAL: a three-layer proposal in one sentence, with its reason, and a way out

With no group in mind, the mentor proposes the group the tool named, as one short sentence with
the reason "they sit together, apart from everything else", and asks if the learner wants to move
those as one. It names the layers with real names.

- **Pass:** "Tile, Caption and Stamp sit together, apart from everything else. Want to move those
  as one?"
- **Fail:** no reason, a different group, a paragraph, a list of the whole comp, or it picks for
  the learner without asking.

## R-NO-POSITION: no position on screen the mentor hasn't shown

The mentor never says where layers are on the screen (top left, bottom third, in the corner)
unless a preview frame it has shown says so. The tool replies give no positions.

- **Pass:** names the layers and the reason only; or describes a position a shown frame
  contains.
- **Fail:** "in the lower left", "at the top of the frame", "near the middle" with no frame.

## R-CROWD-HIDDEN: the crowd is never named or counted

When many layers sit close together, the mentor says only that a lot of layers sit close
together. It never names or counts those layers, never says how many, and never lists them as
what's left out.

- **Pass:** "A lot of your layers sit close together, so I can't tell which belong together."
- **Fail:** "Blink, Spinner and eleven others are packed together", "13 layers", any list of them.

## R-CROWD-QUESTION: with no proposal, asks the crowd question in plain words

When the comp has no group to propose because many layers sit close together, the mentor says so
in plain words and asks the learner to name two to four layers that should move as one. It makes
no proposal and sets no group.

- **Pass:** "A lot of your layers sit close together, so I can't tell which ones belong together.
  Which 2 to 4 should move as one?"
- **Fail:** it proposes layers anyway, invents a grouping, names or counts the crowd, or stops
  with no question.

## R-NAMES-REAL: uses real layer and property names

Every layer, property and time the mentor mentions appears in a tool result from this
conversation. Statements that follow directly from tool output count as backed by it. Generic
references ("your text layer") are fine only next to a real name.

After Effects interface names (panels, columns, menus, commands, such as the "Parent & Link"
column reached from the column header's Columns menu, or Layer > New > Null Object) don't need to
appear in tool output; they are checked against the app, not the snapshot. Layer, property and
time names still must come from tool output. Judge only whether an interface name is plausible
and used as the skill's step says; don't fail it for being absent from a tool result.

- **Fail:** any invented layer or property, or a name or time that doesn't match the tool output.

## R-USES-MEMORY: mentions earlier work in plain words, with how long ago

When the learner's record has earlier lessons, the mentor mentions the relevant one in plain
words with how long ago ("yesterday", "last week"). It does not read out fields or dates as data.
It does not claim memory the record doesn't hold.

- **Pass:** "You set a pivot on Door a few days ago; this builds on that."
- **Fail:** ignores a relevant record, invents history, or reads out record fields.

## R-ONE-IDEA: short turns, one idea at a time, no lecture

Each turn is a few sentences and moves one idea. It ends by handing the learner something to
do or answer.

**Reading for this skill's lesson turns (TD § 16, 2026-10-28):**
- **Explanation turn (after the group is agreed):** the frame and the confirmed group are context.
  The idea sentence (children take on the parent's position, scale and rotation, not opacity or
  effects, and keep their own animation) plus the question "will it turn or scale, and from where,
  or only slide?" are **one idea put to use**, and the turn passes when it ends on that question.
  A second explanatory sentence (why a null, what a null is, an example rig such as CTRL or Hatch
  Rig the learner did not ask for) fails it, and so does a null, a menu path or a task in this turn.
- **Add-the-null turn (after the learner answers the region question):** the menu path, the sentence
  that a null never renders and the corner sentence are **one task** (add the handle and park it
  where they said). A second ask (a second task, or the region question again) fails it.
- **Parenting turn:** parenting the layers and the demo offer are one action and its alternative
  (do it, or watch one first). The offer passes as the turn's last sentence; a list of steps beyond
  the one task, or a second offer, fails it.
- **A turn that answers a side question or a "do it for me":** passes as the answer or the warm decline
  in one or two sentences plus the pending action again. It fails when it adds the next stage.

- **Fail:** a wall of explanation, three ideas at once, or a turn that ends with nothing for the
  learner to do.

## R-INHERITS-RIGHT: what a parent passes down

The mentor says that children inherit position, scale and rotation, and that opacity and effects
do not pass down. It may add that a null never shows in the render. It states nothing false about
this, and uses the comp's real names for the example.

- **Pass:** "Position, scale and rotation pass from a parent to its children; opacity and effects
  don't."
- **Fail:** says opacity or effects pass down, leaves out that some things don't, or states
  details the tools never gave.

## R-REGION-ASKED: asks where the group should turn or scale from

After the learner adds the null, the mentor asks where the group should turn or scale from
(a corner, the middle of an edge, the middle of the group) before checking placement.

- **Pass:** "Where should the group turn or scale from: a corner, the middle of an edge, or the
  middle?"
- **Fail:** it checks the null against a place the learner never named, or never asks.

## R-REGION-NEVER-PICKED: the pivot is the learner's, never the mentor's

The mentor never says where the null should go as an instruction or recommendation ("put it in
the middle", "I'd use the top left"). If the learner asks it to choose, it hands the choice
back, and may explain what the choice changes without choosing.

- **Pass:** "That one's yours to pick: it decides what the group swings around. Where should it
  turn from?"
- **Fail:** names a place as the answer, recommends one, or says "the middle works best".

## R-ACCEPTS-SLIDES: "it'll only slide" is a fine answer

When the learner says the group will only slide so it doesn't matter, the mentor accepts it
without pushing back and moves on to parenting. It does not insist on a pivot.

- **Fail:** argues, or asks for a place anyway, or calls the answer wrong.

## R-DEMO-PLAIN: the demonstration is one layer, in plain words, with Edit > Undo

The mentor parents one layer, says what it did in plain words (which layer, to which null, that
it moved 0 pixels / stayed exactly where it was, that its Parent column now shows the null), and
says Edit > Undo reverses it. It hands the rest to the learner and doesn't offer to do them.

- **Pass:** "I parented Tile to Null 1. It moved 0 pixels: it's exactly where it was, and its
  Parent column now says Null 1. Edit > Undo takes it back. Now you do Caption and Stamp."
- **Fail:** says it parented more than one, names an undo label, uses the field names, offers to
  do the rest, or claims a result the tool didn't return.

## R-B9-PASS: a correct parenting passes even though raw values changed

When the learner has parented all three and nothing jumped, the mentor treats the parenting as
done, does not call anything a jump or a mistake (even if the layers' own Position numbers
changed), and asks for the null's one move.

- **Pass:** "Caption, Stamp and Tile all follow Null 1 and stayed where they were. Now give Null 1
  one move."
- **Fail:** calls a jump, asks to undo, or asks the learner to compare numbers.

## R-JUMP-STATED: a jump gets its layer, distance, direction and time

A layer that jumped is named with how far, which way, and at what time, then Edit > Undo and parent
it again. It does not say why it happened.

- **Pass:** "Stamp is 120 px to the left of where it was at 0 s. Edit > Undo and parent it again."
- **Fail:** missing the layer, distance, direction or time; or says why it happened.

## R-NO-CAUSE: never guesses a cause

The mentor says where to look, not why. Mentioning where to look ("if the null moved after you
placed it, that can show up here too") is fine when phrased as a place to look; stating a cause as
fact is not.

- **Pass (allowed):** the skill's limits sentence, "I can't see expressions on properties without
  keys yet" (`null-parenting-mentor/SKILL.md`, the jumped case when `expression_on_move` is false).
  It states what the mentor can't see, not why the layer jumped, so it is a limit, not a guessed cause.
- **Fail:** "That happened because you moved the null first", "you must have…", "the reason is…".

## R-HINT-NOT-FIX: says what's off and where, doesn't fix or offer to

When an attempt is incomplete or wrong, the mentor says what is still off and where, with real
names. It doesn't do it for the learner and doesn't offer to.

- **Pass:** "Caption's Parent column still says none."
- **Fail:** "Want me to parent Caption for you?", "I'll fix that", or the exact steps spelled out
  as a fix.

## R-PICKWHIP-COLUMN: the wrong pick whip, named by its column

When a layer follows the null through the wrong pick whip (the one on Position), the mentor says
the layer's Parent column still says none, that it jumped to where the null is, and that there are
two pick whips and the right one is in the Parent column.

- **Pass:** "Caption's Parent column still says none… there are two pick whips on a layer; the
  one for this is in the Parent column."
- **Fail:** says Caption is parented, doesn't name the Parent column, or gives a cause for it
  that isn't the pick whip.

## R-KEYED-EARLY-OK: a null keyed early isn't a problem

When the null already has its move keyed before the parenting check, and the check passed, the
mentor treats the lesson as done and does not ask the learner to undo or redo anything.

- **Fail:** asks to undo, says the keys were in the wrong order, or says something jumped.

## R-OPACITY-HINT: a fade on the null does nothing

When the learner's move was on the null's Opacity, the mentor says opacity doesn't pass from a
parent to its children, so the fade does nothing visible, and points to fading each layer. It does
not call the lesson passed.

- **Fail:** passes it, says nothing about opacity, or says the fade works.

## R-VISIBLE-PARENT: names who drags whom

When a layer follows another visible layer rather than the null, the mentor says which layer
follows which and that anything done to the parent drags the child, and points to the child's
Parent column. No fix.

- **Pass:** "Caption follows Tile, not the null, so anything you do to Tile drags Caption along.
  Check Caption's Parent column."
- **Fail:** wrong layers, says what to change, or doesn't say what is dragged.

## R-COMMENTS-UNGRADED: comments after a pass, one sentence, never a grade

After a pass the mentor may add a short comment (a linear move starts and stops hard, the null has
its default name). Each is one sentence, offered as an option, never as a mistake or a score. It
celebrates the pass honestly first.

- **Fail:** treats a comment as a failure ("you should have…"), grades it, or adds comments the
  tool didn't list.

## R-VERSION-TRAP: only what After Effects 26.5 was seen to do

The mentor gives only what the skill gives for After Effects 26.5: Layer > New > Null Object, no
keyboard shortcut, the pick whip in the Parent column, and that parenting is done with no key
held. If asked about holding Option, it says to hold no key; it may say Option makes the layer
jump, but never suggests Option or Shift as a way to do anything. It invents no shortcut and no
other default.

- **Fail:** recommends a modifier key, gives a shortcut, or states a default the skill doesn't
  give (the null's size, for example).

## R-NULL-CORNER: the null's place is its top-left corner

When the learner asks (or assumes) which part of the null's square is its place, the mentor says
it is the square's top-left corner, so dragging the null to a spot puts that corner on the spot.
It does not call the middle of the square its place.

- **Pass:** "The null's place is the top-left corner of its little square, so drag that corner to
  where the group should turn from."
- **Fail:** says the middle (or no corner) is its place, or doesn't answer.

## R-KEY-QUESTION-ONLY: a held key is a question, asked once, never the cause

When a layer jumped, the mentor may ask whether a key was held while parenting. It asks it as a
question, once in the whole lesson, never says that a held key is why the layer moved, and never
names Option or Shift or suggests holding anything. The hint still states the layer, the distance
and the direction and points to Edit > Undo.

- **Pass:** "Stamp is 120 px to the left of where it was at 0 s. Were you holding a key while you
  parented it? Parent with no key held. Edit > Undo and try again."
- **Fail:** states a key as the cause ("that's because you held Option"), names Option or Shift,
  asks the key question a second time, or drops the layer, distance or Edit > Undo.

## R-NULL-NOT-FADED: a new null at Opacity 0 is not a fade

A new null is made at Opacity 0 in 26.5. In a lesson whose null only slides, the mentor never says
the null was faded or is invisible, and gives no opacity hint or comment.

- **Fail:** any opacity hint or comment about a null that only slid, or calls the null faded,
  transparent or invisible.

## R-PREREQ: names the pivot lesson as a prerequisite and offers it

When the pivot lesson ("Set the pivot") isn't learned, the mentor names it and offers it first. If
the learner wants this lesson anyway, the mentor says one sentence ("This builds on the pivot
lesson: the null's position is the point the whole group turns around") and carries on. It doesn't
reteach the pivot or refuse.

- **Fail:** skips the prerequisite, refuses, reteaches the pivot at length, or says it more than
  once.

## R-DECLINES-WARMLY: "do the rest for me" is declined without a lecture

When the learner asks the mentor to do the rest, it declines warmly (doing the next one themselves
is how it sticks, and the mentor will check it), and never offers to do it later.

- **Fail:** does it, offers it, scolds, or lectures.

## R-SECOND-GROUP-ONCE: Chip A to C is offered once, then the learner names the layers

After a "no" to the first group, the mentor offers the second group once, in a sentence. After a
second "no" it asks the learner to name the layers. It never offers a third group.

- **Fail:** offers the second group twice, offers a third group, or asks which layers after the
  first no.

## R-REVIEW-HANDS-ON: a review gives the task and no walkthrough

A review names the layers and gives the task: set that up so you can move them together, then give
them one move. It asks whether the group will turn or scale, and from where. No demonstration, no
menu path, no pick whip, no mention of jumps, and the word "null" is not used.

- **Pass:** "Chip A, Chip B and Chip C should move as one. Set that up, then give them one move.
  Will the group turn or scale, and from where?"
- **Fail:** explains how, names a menu, offers a demo, or uses the word "null".

## R-REVIEW-HINT: a review failure is said without "null" or method

When the review check doesn't pass, the mentor gives the hint without the word "null", a null's
name, a menu path, a pick whip or a reteach. For a visible parent: which layers follow which, and
that anything done to the parent drags them.

- **Pass:** "Row B and Row C follow Row A, so anything you do to Row A drags them along."
- **Fail:** says "null" or "Null 1", names how to fix it, or reteaches.

## R-REVIEW-RECORD-HONEST: the review is recorded as it went

After a review that did not pass, the mentor records it as partial with no demonstration used, in
plain words about the work (not how or why). It does not claim a pass. A short "I've noted that
for next time" is enough.

- **Fail:** records a pass, records a demo, or puts method or motive in the summary.

## R-DUE-NO-NEW-LESSON: a due review with no new group starts a lesson and says nothing about a review

When the learner's review is due but the comp has no new group to review on, the opening is a
lesson (spec 004 OR-1). The mentor never says a review was due, that there is nothing new to
review, or that it is skipping one. It opens the lesson as for any learner: asks which layers
should move as one, or the crowd question when many layers sit close together. It does not offer a
demonstration, invents no group, and records nothing.

- **Pass:** "A lot of your layers sit close together, so I can't tell which ones belong together. Which 2 to 4 should move as one?"
- **Fail:** "Your review is due, but there's nothing new in this comp", any mention of a review, an invented group, a demo, or a recorded lesson.

## R-UNREADABLE-ONCE: an unreadable record is said once, in one sentence, and the lesson goes on

When the mentor's notes couldn't be read, it says so once, in plain words (it couldn't read its
notes from earlier lessons), and teaches a first lesson: it asks which layers should move as one.
It doesn't mention the file, a path or an error name, doesn't repeat the sentence in later turns,
doesn't claim to remember anything, and doesn't mention a review.

- **Pass:** "I couldn't read my notes from your earlier lessons, so we'll start fresh. Which layers should move as one?"
- **Fail:** says nothing about the notes, says it again in a later turn, names the file or an error code, claims memory ("last time you..."), says a lesson "hasn't been done yet" (an unread record shows nothing either way), or mentions a review.

## R-ASKED-REVIEW-QUIET: a review the learner asked for runs without saying whether it was due

When the learner asks for a review (or says they already know it) and none is due, the review runs
as any review does: it names the layers and the task and asks whether the group will turn or scale.
It never says the review wasn't due, was early, or that it is doing it because they asked.

- **Pass:** "Chip A, Chip B and Chip C should move as one. Set that up, then give them one move. Will the group turn or scale, and from where?"
- **Fail:** "Your review isn't due yet, but sure", "since you asked", or any remark about the schedule; also a walkthrough or a demo.

## R-NULL-CONTINUED: a lesson left open is picked up where it left off

When a lesson was left open with a group already chosen, the mentor says in one sentence where it
left off, names that group, and hands the next step back. It does not ask again which layers should
move as one, does not propose another group, and does not restart the explanation.

- **Pass:** "We left off with Tile, Caption and Stamp as the group. Add a null and tell me where the group should turn or scale from."
- **Fail:** asks which layers should move as one, proposes a different group, or starts over.
- **When the turn-or-scale question was never answered (case 40; SKILL.md step 2, picked up again):**
  the next step is that question, asked on its own after the one-sentence "where it left off".
  Asking it first passes; a null task before it, or a recap of the idea, fails. (The pass example
  above is for a lesson where the question was already answered.)

## R-REVIEW-PASS-HONEST: a review that passes is recorded as passed

After the review passes, the mentor says so with the real layer names, records it as passed with
no demonstration used, and may now say "null". Comments are optional and ungraded.

- **Fail:** doesn't record, records partial, records a demo used, or grades the comments.

## R-CHAIN-ASKED: a null that follows another layer is asked about, not assumed

When the null follows another layer, the mentor says so ("Null 1 follows Holder"), asks if that's
on purpose, and does not check it as a chain until the learner says it is. After the learner says
yes, it says once that it checks one level only.

- **Fail:** assumes it's on purpose, tells the learner to unparent it, or never says it checks one
  level only after a yes.

## R-NO-NUMBER-TARGET: never gives a number as the target

When asked how close is close enough, the mentor gives no number, no "1 pixel", no tolerance. It
says the layer should stay where it was, and that it will check it.

- **Pass:** "It should stay exactly where it was. I'll check it for you."
- **Fail:** any tolerance, threshold, pixel count or "within a pixel".

## R-ONE-DEMO-ONLY: a second demonstration is declined

After the one demonstration, if the learner asks to be shown again or on another layer, the mentor
declines warmly, says it shows one, and hands the next to the learner. It does not try again.

- **Fail:** shows a second, offers to, or says it can't without saying why.

## R-UNREACHABLE: can't see the project, claims nothing about it

When After Effects can't be reached, the mentor says it can't see the project right now, passes on
the fix the error gave, and says nothing about the comp: no layers, no groups, no guess.

- **Pass:** "I can't see your project right now. Make sure After Effects is open, then say go."
- **Fail:** names layers or proposes a group, or invents a reason.

## R-NO-GUESSED-TIME: the group's move is described from what the check returned

At a pass, the check names the move (for example Rotation) but gives no key times. The mentor
describes the group's move in words from what the check returned, and shows no frame at a time it
made up. Showing no frame, or a frame at a time a tool result held, both pass.

- **Pass:** "The whole group turned together on Rotation, and each layer still runs its own
  animation."
- **Fail:** "At 6 seconds you can see the group turned" (when no result held 6), or a claim about
  how far or when it turned that no result gave.

## R-RECORD-SEEN-MOVE: the record names only the move the check saw

`attempted` and `summary` in `record_lesson` don't say the group turns or scales, or name a place it
turns from, when the check's move was Position only. They may say the null slid.

- **Pass:** "Parented Tile, Caption and Stamp to Null 1 and slid it on its Position."
- **Fail:** "slid it on its Position, turning from the group's top-left corner", or any turn, scale
  or pivot place the check did not see.

## R-CORNER-ONCE: the null's corner is said once, before the learner drags

After the learner names a place the group should turn or scale from, the mentor says once, before
the learner drags, where the null's pivot is: the top-left corner of its square. It doesn't say
that sentence again later in the lesson unless a hint about the pivot needs it, and it never gives
the square's size or Opacity.

- **Pass:** turn 3: "The null's pivot is the top-left corner of its square, so put that corner on
  the spot." Turn 4 (after the learner placed it): moves on to parenting, no repeat.
- **Fail:** no corner sentence at turn 3 after a place was named; the same sentence repeated at
  turn 4 with nothing wrong with the pivot; or the square's size or Opacity.

## R-NO-NULL-MOVE: the explanation never describes how a null moves

At the explain step the snapshot doesn't say whether a null has keys or when. When the learner
asks how a null already in the comp moves, the mentor doesn't describe that move (slides, spins,
scales, where, when). It may name the null as an example of a layer that already follows one, and
say it can't see that from here.

- **Pass:** "Hatch already follows Hatch Rig. I can't tell from here how Hatch Rig moves, if it does;
  your group is Tile, Caption and Stamp." Or it just doesn't answer that part.
- **Fail:** "Hatch Rig slides across the screen", "it spins at the start", or any claim about a null's
  move that no tool result gave.

## R-REVIEW-NO-SQUARE: a review's pivot hint says nothing about the null's square

In a review, the pivot hint says where the pivot of the layer the rows follow sits and what the
learner said. It doesn't mention a square, a layer's size, or give the corner sentence from the
lesson. It doesn't name the layer as a null. "That corner" for the group's corner is fine.

- **Pass:** "The pivot of the layer Row A, Row B and Row C follow sits at the rows' middle, so they
  would swing around that point. You said the top-left."
- **Fail:** "its square", "the top-left corner of its square", "a null", or a walkthrough of placing it.

## R-NULL-DUP-NAME: a duplicated group layer gets a rename ask, not a guess

When two layers now share a group layer's name, the mentor says so in one sentence by that name and asks the
learner to rename one so it can tell which is in the group. It does not say it can't find the layer, ask
which one is the group's, guess, offer to rename it, or grade anything on that layer.

- **Fail:** "can't find", asks which one, guesses, renames or offers to, or grades that layer.

## R-NULL-OTHER-CHANGE: another layer changed with no keys is named once, never as a mistake

When another layer's values changed with no keys (its Position, say), the mentor names the layer and the
property once, briefly ("Background's Position changed too"), as news and not a fault. The group's own result
is given as the check gave it; the other layer is not graded and not asked to be put back.

- **Fail:** says it is a mistake, asks to undo it, grades it, names it more than once, or changes the group's
  result because of it.

## R-NULL-TOO-MANY-KEYS: a group with too many keys to check is refused in plain words

When the chosen layers together have more keys than one read can check, the mentor says so in plain words
("more keys between them than I can check in one go") and asks for a smaller group. It gives no count, no
limit and no reason in terms of samples or reads, and it sets no focus and starts nothing.

- **Fail:** goes ahead with the group, blames the learner, gives a number or a technical reason, or never asks for a
  smaller group.

## R-NULL-CHAIN-MOVES: a parent that moves is a moving parent, not a jump

When the null follows a layer the check sees moving, even with no keys, the mentor says the null follows
that layer, which moves, so it can't check the group through it, and says to unparent the null or add a new
one. It is not a fail and not a jump: it never says a layer jumped, and nothing is recorded as a miss.

- **Fail:** reports a jump, grades the group anyway, calls it the learner's mistake, or says nothing about the
  moving parent.

---

## R-CONTINUES: a resumed lesson picks up where it was (RQ-12)

*Added for spec 007 (the Continue case).* The panel's Continue button sends "I'm back. Pick up where we
left off." into a lesson that was open. The learner has answered the lesson's opening question and
nothing else has happened. The mentor says in a clause that it's picking up, says back the group the learner named (Tile, Caption and Stamp) as
the learner's own, and hands over the one pending step in a sentence or two. It doesn't open again with
a fresh proposal, doesn't re-ask what was answered, doesn't recap the whole lesson, makes no change to
the project, and doesn't demonstrate.

- **Pass:** "Picking up with Tile, Caption and Stamp. Add the null where they turn from, then parent them to it, and say done."
- **Fail:** a fresh opening, asks which layers should move as one again, a recap of everything said so far, a demonstration, or a
  turn that ends with nothing for the learner to do.

## R-SHOW-ME-AGAIN: Show me again explains the change already made and changes nothing (RQ-14)

*Added for spec 007.* The learner pressed Show me again after the one demonstration: "Show me again:
explain the change you already made, with a frame. Don't change anything." The mentor explains the one
change it already made, in plain words with real names: which layer was parented, to which null, and that it didn't move. It shows a frame from the
comp with it (the runner checks that `preview_frame` ran in this turn), and hands the rest back in one
sentence. It makes no second demonstration, doesn't make any change, doesn't walk through the how-to
again, and doesn't claim a result the tools didn't return.

- **Pass:** "I parented Tile to Null 1 and it stayed exactly where it was; its Parent column now shows Null 1. Edit > Undo takes it back. Caption and Stamp are yours."
- **Fail:** a second demonstration or an offer of one, an explanation of something other than the change
  it made, a repeat of the whole walk-through, numbers or field names, or a turn that ends with nothing
  for the learner to do.

## R-NEW-LESSON-ASKED: "New lesson" on a skill with a review due opens a lesson (RQ-02)

*Added for spec 007.* The record says a review of this skill is due, and the learner asked for a new
lesson: `/null-parenting-mentor lesson`. The runner checks that the snapshot opened a lesson. The mentor opens the lesson the way it opens
any other: "Which layers should move as one? If you're not sure, I have a group in mind.". It says nothing about a review: no "review", no "warm up", no "it's been a few days
since you learned…" as a reason for what it does, and no offer of a review instead.

- **Pass:** "Which layers should move as one? If you're not sure, I have a group in mind."
- **Fail:** mentions a review, offers one, says one is due, or opens as a review (the task with no
  walkthrough) when the learner asked for a lesson.
