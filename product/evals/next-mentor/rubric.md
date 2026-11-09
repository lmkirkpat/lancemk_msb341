# Next-mentor rubric

The judge grades one eval transcript against the rubric items listed in the case's `rubric`
field. Grade only those items. Each item is **pass** or **fail**, with a one-sentence reason that
quotes or points to the turn that decided it.

**What the judge sees:** the learner's messages, the mentor's replies, and every tool call with
its input and result. Tool results are the truth about the learner's record and comp. When the
mentor's words and a tool result disagree, the tool result wins. A case may run more than one skill:
each turn's heading says which one ("next-mentor", or the lesson skill the panel starts next, in a new
conversation).

**Reply format:** JSON only, `[{ "item": "R-…", "pass": true|false, "reason": "…" }]`, one
entry per item in the case's `rubric`, in the same order.

**General rules:**
- Grade behavior, not style. A clumsy sentence that does the right thing passes.
- If an item's trigger never happens in the transcript, it **passes**. Give the reason "not
  triggered".
- Deterministic facts (which tools ran, what `recommend_next` returned, the sentence count, forbidden
  words, field names) are checked by the runner, not the judge. Use them as context.
- The suggestion turn is `next-mentor`'s: it suggests one skill and hands over on agreement. It teaches
  nothing and changes nothing. Judge the lesson turns that follow only on the items named for them.
- A preview frame may come back as an empty placeholder in these runs. Never fail an item because a
  frame looked blank.
- Skill names are said as the learner knows them ("Pick the key type on purpose", "Easing"), never by ID.
- Where a case carries a `known_gap`, its item describes the wanted behavior and may fail until that is
  built. Grade what happened, and say so plainly in the reason.

---

## R-NM-SUGGESTS: one suggestion, with its reason, as an offer

The mentor suggests **one** skill, by its name, says why in plain words, and ends on the offer. It is
at most two sentences in all, the question included (a third only for a note that it couldn't see the
comp, or the practice comp offer). It is not a menu, doesn't recite the learner's record, doesn't describe
the skill in a sentence of its own, and doesn't start teaching or hand over before the learner agrees. It
says nothing about tools, fields, or what it is about to do.

- **Pass:** "You were partway through Easing last time, so let's pick that back up on Title. Ready?"
- **Fail:** two or three suggestions, a list of what the learner has done, a paragraph about the skill, a
  field or value name, "let me check…", or a lesson started inside the suggestion.

## R-NM-IN-PROGRESS: a skill in progress is picked back up

The record says a skill is partway done. The mentor says they were partway through it last time (in plain
words, not "status practicing"), and offers to pick it up on a layer from the recommendation's list.

- **Pass:** "You were partway through Pick the key type on purpose last time, so let's pick that back up on Blink."
- **Fail:** suggests a different skill, calls it a fresh start, or names a layer that isn't in the list.

## R-NM-REVIEW-OFFER: a due review is an offer, hands-on, with no demonstration

The recommendation is a review that's due. The mentor says it's been a while since the learner learned the
skill, and offers a quick review on a layer from the list, all hands-on with no demonstration. It is an
offer: nothing is recorded if they decline, and the mentor doesn't start it.

- **Pass:** "It's been a few days since you learned Pick the key type on purpose; want a quick review on
  Cut, all hands-on, no demo?"
- **Fail:** starts the review without asking, says one is owed or overdue, offers a review of a skill that
  isn't learned, or promises a demonstration.

## R-NM-NEXT-WITH-FOCUS: next in the path, with the layers it would use

The recommendation is the next skill in the path and the comp has something for it. The mentor names the
skill and the layers from the list that it would use, and offers to start.

- **Pass:** "Next up is Pick the key type on purpose, and Blink and Cut look like they'd suit it. Want to start there?"
- **Fail:** names a skill other than the recommended one, names layers that aren't in the list, or says the
  comp has nothing for it.

## R-NM-NOTHING-LEFT: everything ready is learned

There is no recommendation. The mentor says the learner is up to date with everything that's ready and that
new skills are on the way. It suggests nothing, invents no skill, and doesn't offer a review.

- **Pass:** "You're up to date with everything that's ready, and new skills are on the way."
- **Fail:** suggests a skill or review anyway, names an unbuilt skill as available, or says nothing about what's next.

## R-NM-BLIND: After Effects couldn't be reached

The recommendation says the comp wasn't looked at. The mentor says once that it hasn't looked at their comp,
so this comes from their past lessons only. It makes no claim about the comp: no layer, no count, no state.

- **Pass:** "I haven't looked at your comp just now, so this is from your past lessons. Next up is Pick the
  key type on purpose; want to start when it's open?"
- **Fail:** names a layer or describes the comp, says nothing about not having looked, or presents the
  suggestion as if it came from the comp.

## R-NM-EMPTY-LIST: a suggestion that has no layers to name doesn't invent any

The recommendation is a lesson with an empty layer list: the comp has things to teach it on, but the tool
names none. The mentor names the skill and why, and offers to start, without naming a layer, giving a count,
or saying the comp has nothing for it. In the lesson that follows, the skill's own opening asks; no layer is
named that the lesson's own snapshot didn't offer.

- **Pass:** "Next up is Move a group with a null, and this comp has layers that could move together. Want to start?"
- **Fail:** names any layer, gives a count of layers, says the comp has nothing for the skill, or says it
  is offering the practice comp when the tool didn't say so.

## R-NM-LAYERS-NAMED: the layers named are the recommendation's, and only those

The recommendation lists layers. The mentor names layers from that list and no others. If the list is
short (up to three) it names them; it never reads out a long list.

- **Pass:** "Next up is Set the pivot, and Cursor and Icon look like they'd suit it."
- **Fail:** names a layer not in `focus_layers`, drops all of a short list, or reads out ten names.

## R-NM-LESSON-OPENS: the lesson that follows opens as its own lesson, on its own snapshot

The learner agreed (on B1, the panel starts the lesson with a plain request in a new conversation; on A, the
mentor hands over). The lesson's turn starts with its skill's own snapshot tool and opens the way that skill
opens: it speaks from that snapshot, names only layers the snapshot offers, makes no claim about the comp from
the earlier suggestion, and doesn't mention the suggestion, `recommend_next`, or a hand-over. It doesn't ask
the learner to type a command or say it can't start the lesson.

- **Pass:** the lesson opens with its first question and real layer names from its own snapshot, as it does
  when started on its own.
- **Fail:** speaks before its snapshot, names a layer the snapshot doesn't hold, refers to "the other
  assistant" or "the suggestion", or tells the learner to type a command.

## R-NM-LAYERS-KEPT: when the suggestion named layers, the lesson uses them (KNOWN GAP, FR-082)

The suggestion named layers, and the lesson's own snapshot offers them. The lesson either proposes one of
them or asks about them. It does not open as if the learner had said nothing: an open question with none of
the named layers in it is the fail. This item describes the wanted behavior; spec 007 FR-082 records that
today the layers don't reach the lesson (`discovery/usage-notes/next-mentor-handover.md`, item 1). A failure
is reported with that note, with no `SKILL.md` change planned.

- **Pass:** the lesson opens on Cursor or Icon (or asks which of the two).
- **Fail:** the lesson opens with a general question ("Which layer do you want to turn from somewhere
  other than its middle?") and names neither layer, or proposes a layer the suggestion didn't name.

## R-NM-REVIEW-HANDS-ON: a review that follows is the task and nothing more

The lesson that follows a review offer opens as a review: it names the move and gives the task in a sentence
or two. No demonstration, no walkthrough, no menu path or tips on how, and no reteach. If the learner asks
for a demo it says this one is all theirs.

- **Pass:** "Cut should snap. Set that up and say done."
- **Fail:** explains how, names a menu or panel, offers a demonstration, or reteaches.

## R-NM-HANDS-OVER: "Yes, let's go." hands over to the right lesson (A only)

After the learner agrees, the mentor hands over to the skill it suggested (the runner checks that the hand-over
tool ran with that skill, and with "review" for a review) and the lesson opens in the same conversation. It
doesn't say it can't, doesn't ask the learner to type the command, and doesn't teach inside `next-mentor`.

- **Pass:** a short bridge at most, then the lesson's own opening.
- **Fail:** "type /anchor-mentor", a lesson taught without the hand-over, a different skill than suggested, or
  nothing said after the hand-over.

## R-NM-ALREADY-KNEW: "I already know it" on a skill not learned yet is a review, not a lesson (A only)

The learner says they already know a skill that isn't learned. The mentor asks `recommend_next` for it (the
runner checks), doesn't offer a review as if it were due, and, when `review_available` is true, offers a
review with no demonstration so that a pass counts as already knowing it. If they agree, it hands over as a
review. If `review_available` were false it would offer a practice lesson instead.

- **Pass:** "Then let's do a quick one together and you can fly through it." — then a review hand-over on agreement.
- **Fail:** teaches the skill from the start, hands over as a lesson, claims the skill is learned already, or
  offers a demonstration.

## R-NAMES-REAL: uses real skill and layer names

Every skill name, layer and time the mentor mentions appears in a tool result from this conversation
(`recommend_next`, the lesson's snapshot). Memory mentions of earlier lessons from the record are fine, in
plain words. The record is never recited back in detail.

- **Fail:** an invented skill or layer, or a name that doesn't match the tool output.
