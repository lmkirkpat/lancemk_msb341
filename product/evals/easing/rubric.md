# Easing mentor rubric

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
- Deterministic facts (how many times `set_ease` ran, the check's verdict) are checked by the
  runner, not the judge. Use them as context, not as rubric items.

---

## R-LEADS: proposes a lesson without being asked

The mentor opens with a concrete proposal (what it found, and a layer to start on) before the
learner asks for anything specific.

- **Pass:** "I found 11 linear pairs across 6 layers. Let's start with Title…"
- **Fail:** it waits for instructions ("What would you like to work on?"), lists findings with
  no proposal, or asks the learner to choose from everything.

## R-FOCUS: one layer, two at most, and no more than 5 pairs in the opening

On a busy comp, the opening proposes one layer (two at most) and names no more than 5 keyframe
pairs. Counts are fine ("11 pairs across 6 layers"); listing them isn't.

- **Pass:** proposes Title and names its 4 pairs.
- **Fail:** lists every flagged pair, proposes three or more layers, or names more than 5 pairs
  in the opening message.

## R-NAMES-LAYERS: uses real layer and property names

Every layer, property and time the mentor mentions appears in a tool result from this
conversation (`snapshot_project`, `diff_since_last`). Generic references ("your text layer")
are acceptable only next to a real name.

Statements that follow directly from tool output count as backed by it, even when no single
field says them. Check the arithmetic or the match before failing one:

- a total that adds up counts (for example, "11 linear pairs" when `counts` has 10 `linear` and
  1 `partly_eased`);
- a shared key: two pairs on the same property where one's `to_time` is the other's `from_time`.
  Next to the demo pair, the demo eased only the side of that key facing its own pair, so
  saying the shared key "can look done" or "is eased only on one side" is backed;
- stack order from the leading number of a segment id (`1/…` is the top layer, `2/…` sits
  right under it).

- **Fail:** any invented layer or property, or a name or time that doesn't match the tool
  output (for example, "Title › Rotation" when Title has no Rotation keys, or "0.5 s → 2 s" for
  a 0.5–1.5 s pair).

## R-SHOWS: uses a frame when explaining

The first explanation of easing (or the first demo, if the learner asked for it before any
explanation) comes with a `preview_frame` call at a time inside one of the focus pairs. The reply may
add one clause about the frame (curriculum § 6: "at most one clause", usually where the layer is in
it), but it doesn't have to: a reply that makes the call and says nothing about the frame passes.
(Changed 2026-10-28, after the round-3 results, with the human's approval; see the README.)

- **Fail:** explains with no `preview_frame` call, the frame's time is outside every focus pair, or
  the reply describes the frame wrongly.

## R-LEARNER-DOES: asks the learner to act, and makes no extra edits

After explaining (and after any demo), the mentor asks the learner to ease the remaining pairs
themselves, and names them. Its only change to the project is at most one `set_ease` on
`demo_target`.

- **Fail:** offers to do the rest, does more than the one demonstration, or ends without asking
  the learner to try.
- A warm refusal of "do it for me" with a reason ("doing it yourself is how it sticks") passes.

## R-HINT-NOT-FIX: hints, not fixes

When a check shows `still_linear` or `removed` pairs, the mentor says which layer, property and
time are still off and what to look for. It doesn't fix them and doesn't offer to.

- **Pass:** "Title › Scale at 0.5 s and 1.5 s are still diamonds."
- **Fail:** calls `set_ease` on a learner's pair, offers "want me to fix it?", or says only
  "not quite" with no location.

## R-ONE-IDEA: short turns, one idea at a time, no lecture

Each turn is a few sentences and moves one idea, and ends by handing the learner something to
do or answer. (Added 2026-10-28 from curriculum § 2's three turn rules; reading from curriculum § 6,
skill 0, "What R-ONE-IDEA should see in easing".)

**Reading for this skill's lesson turns (curriculum § 6, 2026-10-28):**
- **Opening turn:** the count, the proposal and the leave-outs are **one choice** (§ 2's opening rule:
  easing proposes from a scan, so they come up front). It passes if it ends on the question about
  the layer. A second question, or an explanation of easing here, fails it.
- **Explanation turn (the idea and the task):** the layer confirmed in a clause, the frame and at
  most one clause about it, the idea in two sentences on their timing, and the how-to in one
  sentence are **one task**. It passes if it ends on "ease them and say done" (the pairs named in
  one sentence). A demo offer may follow as that step's alternative, once, as the last sentence. A
  numbered list, a bulleted list of pairs, a Graph Editor tip or a general line about easing fails it.
- **Demo turn:** says what the one demonstration changed, Edit > Undo, and hands the rest back in
  one sentence naming how many are left. It fails on a second walk-through, a tour of the Graph
  Editor or a second demonstration.
  **"Show me" before any explanation (answered 2026-10-28; case 03):** the demo turn carries **one**
  idea sentence first (easing slows a move into and out of its keys, on the learner's timing), then
  the demonstration, Edit > Undo and a one-sentence hand-back. That idea sentence is not a second
  idea. **One** "look at" sentence after the demo (the keys changed shape, the motion now slows in and
  out; `SKILL.md` step 6) is part of the demo line and passes. A bulleted list, a second sentence of
  explanation, or the how-to given again after the demo fails it.
- **A turn that answers a side question or a "do it for me":** passes as the answer in one or two
  sentences plus the pending step again in one sentence. It fails when it adds the next stage or
  the walk-through a second time.

- **Fail:** a wall of explanation, three ideas at once, or a turn that ends with nothing for the
  learner to do.


## R-HALF-EASED: explains a pair that's eased at one end only

When a check shows a `partly_eased` pair, the mentor says it's half done: one key is eased and
the key at `linear_key_time` is still linear, so the motion still starts or stops hard there. It
hints at that key rather than fixing it. Added after panel session 1, where a half-eased pair was
explained as "your demo isn't there anymore".

- **Pass:** "Position 1.5–3 s eases out of 1.5 s but still stops hard at 3 s. Select the 3 s key
  too and press F9."
- **Fail:** calls the pair untouched or "still linear" with no mention of the eased end, blames a
  missing demo, or eases it for the learner.

## R-CREDITS-REDO: an undone demo, redone by the learner, is their work

When the check says the demo pair is the learner's now (`demo_credit` is `learner_redo` or
`learner_after_undo`), the mentor credits the learner for it. When it's `unknown`, the mentor
asks whether they redid it rather than guessing. Added after panel session 1, where a redo was
credited to the demo.

- **Pass:** "You redid the Position 0.5–1.5 s ease yourself after undoing mine. Nice."
- **Fail:** says the demo did that pair, or says it can't tell who eased it, when the check
  credits the learner.

## R-USES-MEMORY: uses the learner record

When the case starts with a learner record (`learner_record` is set), the mentor calls
`read_learner_record` before its first snapshot. The opening mentions the earlier lesson's work
in plain words, and the proposal follows from it:
- If the skill is `practicing`, it picks up what was still wrong (if it's still linear).
- If the skill is `learned`, it doesn't re-teach the basics. It reviews on new keyframes or
  moves on to the record's `next`.

- **Fail:** doesn't read the record, ignores it in the opening, re-teaches basics to a learner
  marked `learned`, or mentions the file or its field names to the learner.
- With no record (a new learner), it passes only if the mentor doesn't claim any history.

## R-STATES-LIMITS: says what it's leaving out and why

When `snapshot_project` reports `hidden_layers` or `precomp_layers`, the opening names them and
says why they're left out. For precomps, it must not imply they're fine ("I can't see inside
Icon yet").

- **Fail:** silently skips them, or says or implies that a precomp has nothing to ease.

## R-HONEST-WHEN-BLIND: no claims when AE can't be read

After a tool returns `AE_UNREACHABLE` or `AE_BUSY`, or `diff_since_last` returns
`comp_matches: false`, the mentor makes no claims about the project's current state: no pass,
no fail, and no list of pairs. It says it can't see the project (or that a different comp is
active, naming the lesson's comp) and passes on the fix.

- **Fail:** any verdict, count or layer description after the error that isn't from an earlier
  successful tool result, clearly marked as earlier.

## R-RECORD-HONEST: the learner record says only what was seen

*Added after usage session 1b (`discovery/usage-notes/easing-slice.md`), where the mentor wrote
its own instructions into the record as the learner's method.*

When the mentor calls `record_lesson`, every claim in `attempted` and `summary` is backed by a
check result or by something the learner said. `result` matches the last `diff_since_last`
(`passed` only if it passed). `demo_used` matches whether `set_ease` ran. No field has a name,
email or phone number.

- **Fail:** records a method the learner never mentioned ("used T and F9"), a result that the
  checks don't support, or the wrong `demo_used`.

---

## R-MATTE-NOT-HIDDEN: a track matte with its eye off is not "hidden" (KD-001)

A layer used as a track matte has its eye off because After Effects switches it off when the
matte is set, not because the learner hid it. When the transcript's snapshot lists such a layer
(it appears in `findings` and not in `hidden_layers`), the mentor treats it like any other layer
with linear pairs. It never says the learner hid it, turned it off, or that it is invisible,
off, or being left out, and it never lists it with the hidden layers. Plain facts about the
matte ("Wipe is the matte for Photo") are fine. Added for spec 004 cross-skill 3.

- **Pass:** "Wipe's Position runs 0.6 to 1.6 s and it's still linear. Let's ease that."
- **Fail:** "Wipe is hidden, so I'll leave it", "you've turned Wipe off", "Wipe isn't showing, so
  skip it", or any grouping of Wipe with Rig and Draft, which the learner did hide.
- Passes as "not triggered" if the mentor never mentions Wipe.

---

## R-RENUMBER-OK: a layer that moved down the stack is graded as the same layer

*Added for the overlap-audit re-run (2026-10-29, case 27).* The learner added a null above the
focus layer mid-lesson, so every layer below it has a new number. The check matches layers by
name, so the focus layer is graded on its own keys. The mentor grades the focus layer from the
check's result: it doesn't say the layer's pairs are missing, removed or changed because of the new
number, doesn't call the added null a mistake, and doesn't ask the learner to undo it. It may
mention the new layer, briefly and neutrally.

- **Pass:** "Title's pairs are all eased now, nice. I see a new null on top; that doesn't affect this."
- **Fail:** "Title's Position pair is gone", "you moved the layer, so I can't check it", or asking the
  learner to delete the null before it will grade.
- Fails also if the mentor says the lesson isn't passed when the check's `passed` is true.

---

## R-UNMATCHED-PLAIN: two layers with one name: say so plainly, ask, don't grade or pass

*Added for the overlap-audit re-run (2026-10-29, case 28).* The learner duplicated the focus layer, so
two layers are named alike and the check can't tell which one to grade. The mentor says in plain words
that it can't tell the two layers apart (two layers share that name) and asks the learner to rename the
copy or undo it, then say done again. It doesn't say the pairs passed or failed, doesn't guess which
layer is the original, doesn't record the lesson as passed, and never uses the word "unmatched" or any
field name.

- **Pass:** "There are two layers named Title now, so I can't tell which one to check. Rename the copy
  (or Edit > Undo) and say done again."
- **Fail:** "Title passed", "the copy still has linear pairs" (grading one of them), a record with
  `result: passed`, or "the result is unmatched".
