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

- **Fail:** any invented layer or property, or a name or time that doesn't match the tool
  output (for example, "Title › Rotation" when Title has no Rotation keys, or "0.5 s → 2 s" for
  a 0.5–1.5 s pair).

## R-SHOWS: uses a frame when explaining

The first explanation of easing (or the first demo, if the learner asked for it before any
explanation) comes with a `preview_frame` call at a time inside one of the focus pairs, and the
reply refers to what the frame shows.

- **Fail:** explains with no `preview_frame` call, or the frame's time is outside every focus
  pair.

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

After a check has shown the demo pair undone, a later check that shows it eased credits the
learner for that pair. Added after panel session 1, where a redo was credited to the demo.

- **Pass:** "You redid the Position 0.5–1.5 s ease yourself after undoing mine. Nice."
- **Fail:** says the demo did that pair, or says it can't tell who eased it, when a check in this
  lesson already showed it undone.

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
