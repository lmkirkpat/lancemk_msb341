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

## R-REVIEW-NOTHING-NEW: a review with no new group says so and records nothing

When the comp has no new group to review on, the mentor says there is nothing new to review on this
comp, offers no demonstration and no walkthrough, and records nothing. If the learner would rather
use other layers it asks which two to four. It does not offer a second group.

- **Fail:** invents a group, runs a lesson instead, offers a demo, or records a lesson.

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
