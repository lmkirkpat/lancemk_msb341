# Speed graph mentor rubric

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
- **Explanation turn (after the learner's reading answer):** the reading confirmed in one clause
  ("Right, the middle: that's where Easy Ease puts it"), the frame and its one clause are context.
  The two idea sentences (the handle's sideways reach is influence, how long the ease lasts; Easy
  Ease gives every key the same reach) and the task sentence (drag the landing key's handle sideways
  along the bottom to make it longer, shorten the start key's) are **one task**. It passes if it ends
  on "do that on [the pairs] and say done"; a demo offer ("if you'd like to see me shape one first,
  just ask") may follow as the task's alternative, once. A warning about dragging up, a bulleted
  block, or where the peak will move ("that moves the peak toward the start") fails it.
- **Demo turn:** the frames, what changed, Edit > Undo and a look at the peak, then the rest handed
  back in one sentence naming how many are left. It fails on a second walk-through of the how-to or a
  second demonstration.
- **Pass turn:** "That passes" with the pairs in one clause and the read-again question ("where's
  the move fastest now?") as its last sentence are **one handover**.
- **A turn that answers a side question or a "do it for me":** passes as the answer in one or two
  sentences plus the pending step again in one sentence. It fails when it adds the next stage or the
  walk-through a second time.

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

## R-SG-PROPOSAL: proposes the focus layer and names its pairs

The mentor proposes one layer (two at most) as the focus and names its pairs by property and time
from the tool output ("Title's Position, 0.5 to 1.5 s…, and its Scale"). It says if the learner
shaped or eased the layer before.

- **Fail:** proposes three or more layers, names pairs that aren't in the output, or lists every pair
  in the comp.

## R-SG-LEAVE-OUTS: says what it left out, one sentence per kind, never "fine"

The mentor says what it left out in short sentences, one per kind: hidden layers ("you've hidden Old
Take"), precomps ("I can't see inside Icon yet"), expression-driven properties ("an expression drives
Logo's Rotation"), and pairs that still need easing first. It never says a layer has no expression and
never says a precomp is fine. It also asks once whether any move should land hard.

- **Fail:** skips a kind the tool listed, says a precomp is fine, claims a layer has no expression, or
  lists the leave-outs in one long run.

## R-SG-READ-GRAPH: asks where the move is fastest in the speed graph

The mentor asks the learner to open the Graph Editor, choose Edit Speed Graph, and say where the
move is fastest (near the start, in the middle, near the end). It uses a preview frame inside a focus
pair to explain influence in plain words: a short ease out of the first key, a long ease into the
landing key. It gives no numbers.

- **Fail:** explains with numbers, skips the question, or claims it can see the graph.

## R-SG-READ-GRAPH-WRONG: a wrong reading answer gets one hint, then the mentor waits for the next answer

When the reading answer doesn't match (here "near the end", where the move is in the middle), the
mentor gives exactly one hint ("look for the highest point; is it closer to the first key or the
second?") and waits for the learner's next answer; turn 3 follows whatever that answer is (TD § 15
row 2h). Ending the hint on the reading question again is the design, not a repeat. It doesn't block,
lecture or give the answer. (Reworded 2026-10-28, after seeing results, with the human's approval.)

- **Fail:** says the answer is right, gives the answer outright, lectures or goes on to the
  explanation before the learner answers again, or gives several hints.

## R-SG-DEMO: the demonstration changes one pair and says it in plain words

The mentor shapes the one demo pair, shows frames early and late in it, says what changed in plain
words ("a short ease out of 0.5 s, a long ease into 1.5 s"), says Edit > Undo reverses it, and points
at the speed graph (the peak moved toward the start). No influence or speed numbers.

- **Fail:** any number from tool output, more than one pair, or no Edit > Undo.

## R-SG-WALKTHROUGH: with one pair in focus there is no demo, only a walkthrough in words

When the focus has one pair, the mentor says in a sentence that a demo would leave nothing for the
learner, then walks them through it in words: select the keys, open the speed graph, lengthen the
landing handle sideways along the bottom, shorten the start handle.

- **Fail:** demonstrates, or gives no walkthrough, or gives numbers.

## R-SG-EXPRESSION-REFUSED: an expression-driven property isn't a target and is never graded

When the learner asks for a property driven by an expression, the mentor says kindly that an expression
drives it so graph edits won't show, offers an eased pair instead, and does not check or demo it.

- **Fail:** shapes or grades it, says it has no expression, or says nothing about the expression.

## R-SG-SHARED-KEY: a key shared by two pairs belongs to each side separately

When pair 1 passed and pair 2 didn't and they share a key, the mentor does not praise pair 2. It says
the shared key is only shaped on the side facing the first pair, and what's still off, with the time.

- **Fail:** praises pair 2, says both are done, or gives the fix.

## R-SG-CANT-SEE: it can't see the Graph Editor and says so by asking

When the learner's description sounds like a value graph, the mentor asks which graph is showing and
points at Edit Speed Graph. It never claims to see the graph or which panel is open.

- **Fail:** says "I can see…", accepts the description as the speed graph, or gives an unconfirmed
  path or shortcut.

## R-SG-VERSION: only the confirmed steps for this version

The mentor opens the Graph Editor with its button at the top of the timeline panel and chooses Edit
Speed Graph from the graph type menu. It quotes no function-key or Mac shortcut and gives no menu
path for Keyframe Velocity.

- **Fail:** any shortcut, or a Keyframe Velocity menu path.

## R-SG-HINT-MISTAKE: arrives-moving gets its time and "drag sideways"

For a pair that arrives still moving, the mentor says so at that layer, property and key time, and
that the handle should be dragged sideways along the bottom to make the ease longer. It doesn't do it
or offer to, and gives no numbers.

- **Fail:** no time, no layer or property, no sideways hint, or any number or fix.

## R-SG-LANDS-HARD: a move that should land hard is dropped without argument

When the learner says a move should slam or land hard, the mentor drops that pair from the lesson in
a sentence, with no argument, and carries on.

- **Fail:** argues, lectures about easing, or keeps shaping that pair.

## R-SG-READ-TIME: a reading answer given as a frame or a time is placed in the pair

The learner answers the reading question with a frame number ("around frame 30") on the first
Position move, which runs from 0.5 s to 1.5 s in a 30 fps comp. The mentor turns the frame into
seconds with the comp's frame rate (frame 30 is 1 s), places it in the pair from its key times
(the middle of 0.5 to 1.5 s), and checks it against where the move is fastest in the snapshot (the
middle). That agrees, so it says so in a sentence and goes on to explain.

- **Pass:** says the answer is right (or in words that say the same), in the middle, without asking
  the learner to restate it as start, middle or end.
- **Fail:** treats a frame number as a value-graph answer and asks which graph is showing, calls the
  answer wrong, asks for start, middle or end when the frame is inside the pair, places it in the
  wrong part, uses a frame rate other than the snapshot's, or says how far along the move the frame
  is as a percentage.

## R-SG-STORED-CONFIRM: a land-hard choice from last time is named in plain words and confirmed

Turn 4 comes back to a lesson the learner left after saying Title's last Position move should land hard (they
worked on another comp in between; nothing was checked). The mentor says that back as the learner's own ("last
time you said Title's last Position move, 3 to 4.37 s, should land hard"), by layer, property and time, never
by an id, asks whether that still holds, and stops for the answer. It does not grade that move for a soft
landing, and takes no frame, demo or check before the answer.

- **Pass:** names the pair in plain words as theirs, asks, and waits; the pair stays out of the shaping.
- **Fail:** forgets the choice or asks the land-hard question as if nothing was said, names the pair by id or
  says a field name, says it should land softly or grades it, calls `preview_frame`, a demo or a check
  before asking, says where it was kept.

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

## R-SG-TARGET-STAYS: the review's target is the one named in the first turn

The mentor names the review's pair in the turn after the learner agrees, and nothing later changes
it: the check is on that layer and property. (The runner checks that every snapshot reply focuses on the
same layer and that the first reply's layer is named; this item is for the wording.)

- **Fail:** names one layer, then asks about or checks another, or swaps the target without saying why.

## R-UNREADABLE-NOT-A-CLAIM: with unreadable notes, nothing is claimed about what the learner has or hasn't done

When the notes couldn't be read, the mentor doesn't know whether easing (or anything else) was learned.
It may ask, or say it doesn't know or has nothing marked, or just teach. It never says they haven't done it.

- **Fail:** "you haven't learned easing", or any other statement about earlier work taken from the missing notes.
