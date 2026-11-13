# Ask a question: usage notes (baseline)

Live runs of asking the mentor an open question on my own comps, before any "ask" feature exists
(sprint 5, step 2). There's no spec yet; the checks below come from sprint 5's first "done" item
and become spec 014's starting evidence. Timings and cost come from `panel-turns.jsonl`
(`node panel/dev/turns.js`); the transcript from `panel-conversation.json`; ground truth from
read-only scripts on the comp afterward.

## Session 1: 2026-11-13 (baseline, today's mentor)

The panel on A (`claude-opus-5-5`, settings hash `3acbda26`), my real learner record (pivot learned
on Door the night before, review due). My own logo animation, `Comp 1` in an unsaved project: a
rock hit by a hammer three times, and a light sweep across the logo. Nothing was set up for a demo.
Opened with Find my next lesson, then asked my own questions.

### What happened

| # | I asked or did | The mentor | Matches what I needed? |
|---|---|---|---|
| a. | Find my next lesson | Proposed the pivot review on logo.png, rock.png or the graphics layer. | Partly: I didn't open the panel to review. |
| b. | "What does the sweep control layer do in this comp?" | "I can't see inside that layer from here", a general guess about control layers, then offered the review again. | **No: problem 1** |
| c. | "How can I make the rock shaking more organic, like it's vibrating from the hammer hit and not the center of the rock?" | Move rock.png's pivot to the hit point, and keep the shakes uneven and dying down. Offered the review on rock.png. | **No: problem 2** (the right idea on the wrong layer) |
| d. | "Let's do it. I want more detail than just how to move the pivot. I want to understand how to make it feel natural." | Said making it natural comes from easing, then started the pivot review anyway. | **No: problem 3** |
| e. | Picked the top-right corner. | Said rock.png is parented to Shake Control, "but that doesn't change where rock.png's own pivot goes." | **No: problem 2** |
| f. | Moved the pivot: "it didn't change how it looks at all." | "That's expected" (moving the pivot alone changes nothing). Then: Shake Control "moved up at 2.6 s", so use Edit > Undo until it's back. | **No: problems 2 and 4** |
| g. | "The pivot is in the right spot, the top-right corner of the rock where the hammer hits." | Fail: the check reads corners of the image's whole box, which has empty space around the rock. Set it on the image's corner to pass, then nudge it back. | **No: problem 5** |
| h. | "You can't see where the pivot is at all?" | It can't see the pivot in a frame; it can only place it among nine spots. Asked again for the image corner. | **No: problem 5** |
| i. | Put the pivot on the image corner. | Passed, recorded the review, then proposed *Easing* on rock.png to make the shake natural. | **No: problems 3 and 6** |

### Checks (from sprint 5's first "done" item)

| ID | Check | Result |
|---|---|---|
| B-1 | Answers an open question with steps toward my goal | **No.** Two of two questions got a one-line answer and a push into a lesson. |
| B-2 | Steps fit my comp (real layers, what's already there) | **No.** It used real layer names but missed that an expression on the parent drives the shake. |
| B-3 | Stays in the six skills and says so when outside | Not tested (both questions were inside or next to the six). |
| B-4 | Offers to go deeper into a lesson | Yes, too much: every turn offered or pushed a lesson. |
| B-5 | Turns ≤ 10 s | Yes, first activity (below). |

### The checker's verdicts against ground truth

| # | Where the pivot was | Tool's verdict | My verdict (ground truth) | Agree? |
|---|---|---|---|---|
| 1 | Near the rock's visible top-right corner (first try) | Fail, "between" | Close to where I wanted it, not exact | ✓ (it wasn't there yet) |
| 2 | On the rock's visible top-right corner, where the hammer hits | Fail, "between" | Right: this is where it goes | **✗** |
| 3 | On the image's top-right corner, in the empty space | Pass | Wrong: nowhere I'd put it in real work | **✗** |
| 4 | "Shake Control moved up at 2.6 s; Edit > Undo until it's back" | Treated as a mistake by the learner | That's the expression moving it; I changed nothing | **✗** |

**1 of 4 agree.** And none of it would change the shake (finding 2).

### Speed and cost

| Measure | Value | Target | Pass? |
|---|---|---|---|
| Turns | 9 (16:37 to 16:44, 6.6 min) | | |
| First activity, worst | 2.3 s (median 1.8 s) | ≤ 10 s (SC-004) | ✓ |
| Full reply, worst | 13.1 s (turn h) | | |
| Cost | $0.37 ($0.16 of it on loading the pivot skill) | | |

### Ground truth (read from the comp afterward)

- **The shake isn't on rock.png.** rock.png has no keys and no expressions. It is parented to
  **Shake Control**, a null at the comp's center (960, 540), and the shake is two expressions on that
  null: Position (decaying sine waves from three hits at 0.5, 1.5 and 2.5 s) and Rotation (the same
  hits, 0.25° to 0.75°). Ten letter "Shakers" layers are parented to it too.
- So the rotation turns around **the null's position, the comp center**, not the rock's center and
  not the rock's own pivot. Moving rock.png's pivot can never change the shake. What would: moving
  Shake Control to the hit point without its children jumping, which is skill 6 (move a group with a
  null) plus a pivot idea, or changing the expressions.
- **The Position expression has a bug that makes it feel mechanical:** `amp=amps[1]; decay=decays[1];`
  uses index 1 for every hit instead of `i`, so all three hits shake at 12 px with the same decay. The
  Rotation one uses `amps[i]` correctly. That's a real "make it more organic" answer, and it's outside
  every skill's checks.
- **Sweep Control** is a null with two Position keys (3.37 s and 3.54 s), and its Position drives the
  Center of a CC Light Sweep on Black Solid 1 by expression. So it moves the shine across the logo.
  The mentor said it couldn't see this. It wasn't asked to look, and no tool reads effects plus the
  expressions that point at a layer.
- rock.png's source is 1588 × 535. The mentor's claim that the image has empty space around the
  rock wasn't checked here.

### Findings

1. **A plain question about the comp got "I can't see that."** Turn b. The panel was in Find my next
   lesson, which has no tool for reading a layer's effects or the expressions that point at it, so the
   mentor guessed at what control layers usually are. The question was easy to answer. **Fix:** the ask
   mode needs a general, read-only "what's this layer and what drives it" read (effects, expressions,
   parent, children, what links to it). This is where spec 005's diagnosis reads overlap, and it argues
   for building a light version of them into the ask mode.
2. **The mentor named the right idea on the wrong layer, and dismissed the parent it had just read.**
   Turns c, e and f. `anchor_snapshot` reported that the parent is Shake Control, and the mentor said
   that "doesn't change where rock.png's own pivot goes", which is true but beside the point: the
   motion lives on the parent. The pivot skill reads only the focus layer's own Rotation and Position
   keys, so an expression on a parent is invisible to it. **Cause:** an overlap (a parent plus
   expressions instead of keys) that the pivot spec's overlap list doesn't cover. **Fix:** before
   teaching a pivot for "it turns from the wrong place", check where the turn comes from (own keys,
   own expression, or a parent's motion) and teach on that layer, or say that the shake is driven by
   an expression on Shake Control and the pivot that matters is that null's.
3. **The mentor answered "how do I make it natural" with a lesson, twice, and the second lesson
   doesn't apply.** Turns d and i. I asked for the "natural" part outright, and it ran the pivot review
   anyway, then proposed *Easing*, which works on keyframe pairs. There are no keys on the shake, so
   the easing snapshot would find nothing. **Cause:** `next-mentor` and the skills can only route to a
   lesson; there's no answer mode, and the recommendation reads the record and skill names, not how the
   motion is made. **Fix:** this is spec 014's core (an answer first, a lesson only on request).
4. **The mentor told me to undo something I didn't do.** Turn f. The check compared positions and
   saw Shake Control at a different place, so it said Shake Control "moved up at 2.6 s" and told me to
   use Edit > Undo until it's back. The null moves because of its expression at every frame; the
   playhead was at a different time. If I'd followed it, I'd have undone real work. **Cause:** the
   check's "something else moved" warning compares across times or treats expression motion as a
   learner edit. **Fix:** compare at the same time and skip properties driven by an expression, then
   add the eval case below. Worst finding: it's a step toward damaging the learner's project.
5. **The check made me put the pivot somewhere useless to pass.** Turns g to i. The check places the
   pivot among nine spots on the layer's whole image box. On a PNG with empty space around the art, the
   box's corner isn't the art's corner, so the right spot fails and an empty spot passes. Its own reply
   said "set the pivot on the image's corner... afterward you can nudge it back", which is teaching to
   the test. **Fix:** read the visible pixels' bounds (`sourceRectAtTime` or the frame's alpha) for the
   nine spots, and accept "where the learner said" when they name a spot on the art, like "where the
   hammer hits".
6. **The record now says a review passed on a pivot that doesn't do anything.** The record's `next` is
   "Shape a natural, settling shake on rock.png with easing", which won't work (finding 3). Its summary
   also says I "once moved a parent layer's pivot by mistake; undid that", which never happened: it's
   finding 4's false warning, written into memory as fact. **Fix (done 2026-11-13):** the entry is
   rolled back in `learner.json` (the pivot is back to its state after the Door lesson, review due;
   the file before the rollback is kept next to it as `learner.json.bak-ask-baseline`). Going forward,
   a review passed only by matching the checker's spot shouldn't count, and the record should never
   say the learner did something a tool only guessed.
7. **Opening with a due review felt like a quiz, not a mentor.** Turn a. Find my next lesson is
   built to propose a lesson, and a due review always wins. That's right for a learner opening the panel
   to learn. It's wrong for someone in the middle of their own project, which is the whole point of
   sprint 5.

### Proposed eval cases (held)

**Not added yet (decided 2026-11-13).** These findings go straight into the curriculum designer's
brief for spec 014. Fixing them likely means overhauling how teaching works, not patching the pivot
skill, so new eval cases wait until that design shows what the mentor should do. The table records
the situations to cover when that happens.

| Set | Situation | Turns | `expect` | Rubric item |
|---|---|---|---|---|
| Pivot | rock.png has no keys; its parent null has Rotation and Position expressions; learner asks to shake from the hit point | Ask, then pick a spot | No `anchor_check` pass is the lesson's end; the reply names the parent | "Says the motion comes from the parent's expression, and that the pivot that matters is the parent's" |
| Pivot | Same, playhead moved since the snapshot; the parent moves by expression | "Done" | Reply doesn't contain "Undo" about the parent | "Doesn't call expression motion a learner change" |
| Pivot | PNG with transparent padding; learner names the art's corner and sets it there | "Done" | Passes, or explains why not without asking for the box's corner | "Never asks the learner to set a spot that's off the art to pass" |
| Next | Review due; learner's first message is a question about a layer | One question | No lesson offer before an answer | "Answers the question first" |
| Next | "Make the shake natural"; the shake is all expressions | One question | Doesn't propose *Easing* | "Doesn't propose a keyframe skill for expression-driven motion" |

The last two belong in spec 014's eval set more than in the current skills.

**Caveat:** I'm the builder and the only user, on one comp, in one session. But this comp is the
first one not built for the mentor, and every problem came from things real comps have that the
practice comps don't: a control null, expressions instead of keys, a padded PNG. A second comp in
the three sessions will show whether that pattern holds.

## To fix later

- **The pivot check warns about expression motion as a learner edit** (finding 4). In the check's
  "other layers moved" comparison (item 5, `mentor/lib/anchor-check.mjs:221`), a null has no
  footprint, so it falls back to comparing the raw transform (`rawChanged`) at times sampled in two
  reads taken with the playhead in different places. Compare at one time and skip
  expression-driven properties. Test: a parent with a wiggle or sine expression, the
  playhead moved, no warning.
- **The nine spots read the image box, not the art** (finding 5). In `mentor/lib/anchor.mjs`, place spots by
  `sourceRectAtTime()` for footage with alpha, or accept a learner-named spot within the art. Test: a
  padded PNG with the pivot on the art's corner passes.
- **Motion on a parent is invisible to the pivot skill** (finding 2). The snapshot should report
  when the focus layer's parent has Rotation, Scale or Position keys or expressions, and the skill
  should teach on the layer that actually turns. Test: a fixture shaped like Comp 1.

## Edge cases to plan for

- **Motion on the parent, by expression.** A layer with no keys of its own, parented to a null whose
  transform runs on expressions (a common shake or wiggle setup). Skills that read only the focus
  layer's own keys will see nothing moving and teach the wrong layer. This touches pivot, null and
  easing at least. Run `/overlap-audit` on "motion that comes from a parent" for all six.
- **Footage with transparent padding.** The layer's box isn't the art. Anything that names places by
  the box (the pivot's nine spots, "the left edge") is wrong for padded PNGs, which logo work is full
  of.
- **Expression-driven motion between check times.** Any check that compares positions should
  compare at one time and leave out expression-driven values.
