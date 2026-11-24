# Ask the mentor: usage notes

Live sessions of asking the mentor about my own comps (spec 014, T092 to T094), against the success criteria in
`specs/014-ask-mentor/spec.md`. Timings and cost come from `panel-turns.jsonl` and `calls.jsonl` in the learner
home (`node panel/dev/turns.js --ask`).

## Session 1: 2026-11-23 (T092)

My own logo project (its comp is named Comp 1), `main` at `c74967b` with phase 3 merged. **It ran on B1, not A:** AE had been open
since Nov 19, 19:56, the panel loaded then (`panel-loaded.json`), and `panel.json` was switched to `"a"` at 21:05
that night (T091). The panel reads its runtime at load, so every turn logged `"runtime":"b1"`, on the Nov 19 panel
code. Nobody restarted AE before the session, and the cockpit's pre-session check read `panel.json` but not when
AE started.

### Steps

| Step | What happened | Matches? |
|---|---|---|
| a. Ask: how to make the text that falls out of the rock not shake like the rock | One read (`describe_layers` on layer 1), one answer: the fall is the text's own 2 eased Position keys, the shake is from riding on Shake Control (a null moved by expressions). Two steps: set Parent & Link to None; play it back and check the fall. Goal saved as "keep a falling layer's own move while dropping a parent's shake" | Yes |
| b. "Let's go deeper on step 1" | `go_deeper` refused `NOT_ON_THIS_RUNTIME`; "open Group with a null from the Skills tab" | Correct for B1, but **No: problem 1** (the offer showed at all) |
| c. Started Group with a null from the Skills tab | Lesson opened, ended about 47 s later (`end_lesson`). "Almost entirely unhelpful for what I was trying to do" | **No: problem 2** |
| d. "Okay done, is that right?" | Whole-comp read, then 7 sentences: "I don't have my earlier read", the shake's numbers again, a pivot it can't confirm, "which step did you just do?" | **No: problem 3** |
| e. "I set the layer 1 parent control to None" | Read layer 1 again: "Yes, it worked", no parent now, its own eased keys are all that move it; play it back to check | Yes |

### SC-002 and SC-003: steps followed, layer named

| # | Step line | Followed without asking? | Layer named | Right in AE? |
|---|---|---|---|---|
| 1 | Set Parent & Link of DISCOVER the past to INSPIRE the future from Shake Control to None | ✓ | DISCOVER the past to INSPIRE the future | ✓ |
| 2 | Play it back and check the text still falls and lands where you want | ✓ | none | n/a |

2 of 2 followed, 0 explanation-only. 1 of 1 layer right. Builder: "the steps were very clear to follow and super
helpful", and every layer name in the thread was accurate.

### Verdicts

| # | What I did | Mentor's verdict | My verdict | Agree? |
|---|---|---|---|---|
| 1 | Parent of the text set to None | "Yes, it worked": no parent, its own keys move it | Done, and it falls without the shake | ✓ |

### SC-004 and SC-005: speed and cost (B1, so cost doesn't count toward SC-005)

| Measure | Value | Target | Pass? |
|---|---|---|---|
| First activity, question | 3.0 s (whole turn 14.7 s) | ≤ 10 s | ✓ |
| First activity, follow-ups | 2.7 s, 4.3 s, 1.8 s | ≤ 10 s | ✓ |
| Answer turn cost | $0.62 (B1, notional) | ≤ $0.10 on A | n/a on B1 |

### Findings

1. **The go-deeper offer showed on B1, then couldn't run.** The answer carried `parenting.null` and the closing
   "Try it, or want to go deeper on step 1 with *Group with a null*?". B1 should strip offers. The Nov 19 panel
   was running, so this may already be fixed on `main`; check it in session 2 only if it's B1 again. On A it's
   the intended path.
2. **The Skills-tab lesson didn't fit the question.** Started cold, Group with a null teaches putting layers under
   a null, while the step was taking one layer *out* of a parent. On A the hand-in would carry the layer and the
   step into the lesson (FR-034, phase 3's hand-in for null), which is what needs testing; a cold lesson is the
   wrong comparison. The step's skill tag is still debatable: unparenting is part of parenting, but the lesson
   never teaches it. **Watch on A:** does the hand-in lesson start from "take this layer off its parent"?
3. **The "done, is that right?" reply is the eval finding, live.** 7 sentences (the eval caps are 3 to 5), and a
   pivot comment unrelated to the question. Its "I don't have my earlier read" is true: the follow-up came after
   a lesson, and the wrapper (amendment (e)) carries the last question and answer but not the read. It still
   asked "which step did you do?" when the answer had one change step. Same shape as ask 21, 26 and 30, all 0/3
   on A. Strengthens the case for `ask-build.md` › Phase 3 merge fix 1 (a cap on the try-went reply) and fix 2.
4. **The shake's numbers moved between turns.** The answer gave Position about 12 px near 1.5 s and Rotation 0.59°
   near 2.6 s; the whole-comp read in step d gave 12 px near 2.5 s and 0.28° near 1.7 s. Likely measured on
   different layers (the text vs. the comp summary), but the reply doesn't say so, so it reads as
   inconsistent. Not noticed by the builder.

**Proposed eval case (ask 32):** a follow-up "done, is that right?" after a lesson ended mid-thread (wrapper, no
earlier read), on `comp1.json` with layer 1's parent now None. `expect`: first tool `describe_layers` on layer 1,
prose ≤ 4 sentences, never "pivot" or "anchor", never asks which step when the answer had one change step.
Rubric: R-TRY-READ.

**Caveat:** builder as user, one session, on B1. The steps and layer names count toward SC-002 and SC-003. The
go-deeper doesn't count toward SC-001 or SC-013: it was never handed in. **Before session 2: quit and restart AE**,
then check `panel-loaded.json`'s time is after the restart and the first turn logs `"runtime":"a"`.

## Session 2: 2026-11-23 (T093)

A different project from session 1, with a rotating logo (Logo 1 to 4); its comp is also named Comp 1, AE's
default name, so the reads and the logs can't tell the two apart by name. `main` at `7fa5667`. AE restarted first:
`panel-loaded.json` 18:36, and every turn logs `"runtime":"a"` (`claude-opus-5-5`, medium, settings `ff52218a`).

### Steps

| Step | What happened | Matches? |
|---|---|---|
| a. Ask: what's controlling the logo's rotation, and how to speed it up | Three reads (`logo`, the whole comp, Logo 1 in detail), then `give_answer` refused 3 times (`NOT_PLAIN_WORDS`) before the fourth was accepted. The answer: Logo 1's two Rotation keys plus an expression's springy overshoot (about 17°, set by an effect); Logo 2 to 4 turn with it and add their own 3°, 6°, 10°. Four steps, two tagged Offset, one "not something I teach yet" | Steps yes; **No: problem 1** (46 s to the answer) |
| b. "I want to go deeper on step 1" | `go_deeper` accepted (`timing.offset`, step 1), the panel showed the lesson smoothly, `offset_snapshot` ran | Yes |
| c. Inside the Offset lesson | Opened with "builds on *Easing*", then "I couldn't start the lesson on Logo 1": an expression drives its Rotation, so the lesson leaves it out, and nothing else starts together, so there's nothing to stagger. Then "I can't check that from here. My tools in this lesson can't read Logo 1's key times", twice. Ended at the builder's stop | **No: problems 2 and 3** |
| d. Hand-back | "That was step 1. Next is step 2: ..." | Yes |
| e. "It already feels like the other logo layers are keeping up. Is that true?" | Read Logo 1 to 4: "Partly": they ride on Logo 1, but their own keyed turns still peak after its overshoot | Yes |
| f. "Done" | Read again: the extra turns now peak about 4 frames earlier, bigger overshoots, Logo 1's peak and Logo 2's Scale unmoved; then the effect step | Content yes; **8 sentences**, the same length problem as session 1 and ask 21/26/30 |
| g. Earlier questions (after going back to the Ask tab) | Shows every question since Nov 19, from session 1's project, B1 sessions and before | **No: problem 4** |

### SC-002 and SC-003

| # | Step line | Followed without asking? | Layer named | Right in AE? |
|---|---|---|---|---|
| 1 | Select Logo 1, press R, drag its second key earlier | ✓ | Logo 1 | ✓ |
| 2 | Drag the second Rotation key earlier on Logo 2, 3 and 4 | ✓ (after asking whether it was needed, step e) | Logo 2, 3, 4 | ✓ |
| 3 | Look at Logo 1's elastic rotation effect in Effect Controls ("not something I teach yet") | not tried | Logo 1 | ✓ |
| 4 | Play it back and watch the turn | ✓ | none | n/a |

Running tally with session 1: 5 of 6 step lines followed without asking (step 2 here prompted a question, but
a "do I need this?" question, not "how"), 0 explanation-only. Layers: 4 of 4 right.

### SC-004 and SC-005: speed and cost (A)

| Measure | Value | Target | Pass? |
|---|---|---|---|
| First activity, all 7 turns | 1.7 to 4.6 s | ≤ 10 s | ✓ |
| The question's whole turn | 46.5 s (3 refusals) | (reads past 15 s logged) | logged |
| Answer turn cost | $0.18 | median ≤ $0.10 | ✗ (one turn; the refusals tripled it) |
| Follow-ups | $0.15 (the go-deeper hand-in), $0.10, $0.05 | | |
| Go-deeper lesson (3 lesson turns plus the hand-in) | about $0.20 | ≤ $0.40 | ✓ |

### Builder's notes

- "The transition into a lesson is smooth, but once you get into the lesson it's really clunky. It doesn't answer
  questions in the same way the ask tab does... It also doesn't take the lead teaching enough to really feel like a
  lesson. It feels like the ask tab routes you to a 'specialist' that's supposed to help you go deeper on a
  specific topic, but that specialist is actually incompetent and can't do what you want it to."
- Response times, layer names and the ask tab's steps all good.
- Earlier questions should show only this comp and this session.
- Both go-deepers (sessions 1 and 2) were taken for the test, not because the builder wanted one: SC-001's watch
  signal is 0 of 2 so far.

### Findings

1. **The answer took 46 s because `give_answer` refused three drafts for `NOT_PLAIN_WORDS`.** First activity was
   fast, so SC-004 passes, but the learner waited. The refused text isn't logged, so the cause can't be read
   (already an eval follow-up: log a refused closing's text; this extends it to every refusal).
2. **The ask offered a lesson that can't take the step.** Step 1 ("drag Logo 1's second key earlier") was tagged
   Offset and offered. Offset's finder leaves out a layer whose Rotation an expression drives, so the hand-in
   landed in a lesson with nothing to teach. `go_deeper` accepted it: its hand-in guards cover a layer with no
   keys (`435c810`) but not a layer the lesson's own finder excludes. The tag is also a stretch: making one turn
   faster is timing on one layer, and Offset is about staggering starts across layers. **Fix:** `go_deeper`
   (and the offer in `give_answer`) runs the lesson's finder on the step's layer and refuses (or never offers)
   when it would be left out; plus a tagging rule in `ask-mentor/SKILL.md` that a step's skill is the one whose
   lesson changes that thing. **Eval case:** ask 33, this comp's Logo 1 (expression on Rotation), a "speed it
   up" question: never offers Offset on the expression layer.
3. **Inside the lesson the mentor reads less than the ask did.** The ask read Logo 1's keys, expression and
   children; the Offset lesson's tools couldn't read Logo 1's key times at all, and said so twice. This is the
   "incompetent specialist": a go-deeper moves the learner from the broad reader to a narrow one. Lessons were
   built to check their own skill's edits, not to answer questions. **Design question for sprint 6, not a patch:**
   should a handed-in lesson keep the ask's reads (`describe_layers`) for questions, and should it lead from the
   step it was handed instead of re-running its own opening (it opened with a prerequisite line and its own
   finder)?
4. **Earlier questions shows the whole history.** Every saved question since Nov 19, from another project (session 1's, whose comp has the same default name) and B1
   sessions. The builder expects this comp and this session. **Fix (panel):** filter the earlier-questions list
   to the active comp and the current session, or group by comp with this session first; check what spec 014's
   FR on the asked list says first, since the record itself keeps everything for memory.
5. **The try-went reply is long again** (8 sentences), though everything in it was right and useful. Third live
   example, with ask 21/23/26/30 at 0/3 on A.

**Caveat:** builder as user, a second project, one go-deeper. Finding 3 is a product-level signal from the
one user who has used both modes: it bears on `decisions/012` (ask-first Home) and on belief 7 (people take the
result over the lesson). Worth a `/decision` revisit note on 012 once session 3 is in.

## Session 3: 2026-11-23 (T094)

A third project: a music-video comp (I Need Thee Every Hour Music Video Linked Comp 02) holding Nested Sequence 01,
which holds the text precomps. `main` at `cffc666`, AE restarted (`panel-loaded.json` 19:06), every turn on A.

### Steps

| Step | What happened | Matches? |
|---|---|---|
| a. "Are the text layers eased right now? What controls their motion?" | In Nested Sequence 01: the text is inside three precomps, none has keys, expressions or effects of its own here, and it can't see inside; asks the learner to open one | Yes (a read limit, said honestly) |
| b. to d. "It's open now" ×3 | Each precomp read in turn: two eased Position keys on each text layer, nothing else moving it; the third precomp holds only an unkeyed shape layer. One `COMP_NOT_NAMED` refusal | Yes |
| e. "Make them smoother, they stop a little abrupt" | The active comp was now the top comp. The answer's only step was navigation ("double-click Nested Sequence 01, then SEEK JESUS THIS EASTER, and ask again"), after `UNKNOWN_LAYER` and `STEP_NEEDS_LAYER` refusals (22 s) | **No: problem 1** |
| f. "The precomp is open" | Already eased, so a softer landing is the speed graph: drag the last key's incoming handle further left; play back. Tagged Speed graph, offered | Yes |
| g. "Yes, go deeper on Speed graph" | Handed in. The lesson: "builds on *Easing*"; "I can't run the lesson on this text, because its keys already have the shape the lesson teaches"; then the step in prose. The learner edited and said "Done, check it": the check saw a change but had nothing to compare against; "I've noted that for next time"; recorded as practicing | **No: problem 2** |
| h. Hand-back | "That was step 1. Next is step 2: Play it back and watch the landing." | Yes |
| i. "Does it look right to you?" | Honest: its read doesn't show the curve's shape, the keys are still eased, play it back at full speed | Yes, **but problem 3** |
| j. "It looks good to me" | `note_said`, then two sentences: do the same in the other precomp | Yes |
| k. The ask box after each send | The typed text stays in the box | **No: problem 4** |

### SC-002 and SC-003

| # | Step line | Followed without asking? | Layer named | Right in AE? |
|---|---|---|---|---|
| 1 | Double-click Nested Sequence 01, then SEEK JESUS THIS EASTER, and ask again | ✓ | Nested Sequence 01, SEEK JESUS THIS EASTER | ✓ |
| 2 | Select the Position keys, open the speed graph, drag the last key's incoming handle left | ✓ | the text layer | ✓ |
| 3 | Play it back and watch the landing | ✓ | none | n/a |

### SC-004 and SC-005 (A)

| Measure | Value | Target | Pass? |
|---|---|---|---|
| First activity, all 10 turns | 1.4 to 5.9 s | ≤ 10 s | ✓ |
| Longest whole turn | 22.0 s (step e, two refusals) | reads past 15 s logged | logged |
| Answer turns (6) | median about $0.04 (first $0.27) | median ≤ $0.10 | ✓ |
| Go-deeper lesson (hand-in and check) | about $0.23 | ≤ $0.40 | ✓ |

### Builder's notes

- "The speed graph go deeper lesson worked slightly better than the other go deeper lessons, but still wasn't
  great. I think that's a technical limitation of what the mentor can read on the speed graph, because the ask page
  performed the same way."
- The ask box keeps the typed text after every turn; it should clear on send.
- Layer names good, steps clear.
- "The mentor did a very good job handling the mess of precomps on this project, so I was impressed by that."

### Findings

1. **A step that only navigates.** With the top comp active, the answer's one step was "open the precomp and ask
   again", after two refusals. It worked, but a navigation-only answer is really a clarify with steps to come;
   spec 015's phase 2 (reading inside precomps, T041) would remove the round trips in steps a to f entirely.
   Five of this session's ten turns were the learner opening precomps for the mentor.
2. **The hand-in landed in a lesson that refused the focus, again.** The ask said "a softer landing comes from the
   speed graph"; the lesson said the keys "already have the shape the lesson teaches" (they start quickly and land
   softly by its rule), so it couldn't run, then recorded a practice anyway. **2 of 2 go-deepers on A hit this**
   (session 2: Offset excluded an expression layer). Same fix as session 2's finding 2: `go_deeper` runs the
   lesson's finder on the step's layer before accepting, and the ask doesn't offer a lesson that would refuse. Also
   a teaching gap: the learner felt the landing was abrupt while the lesson's rule called it soft. The rule's
   threshold isn't the learner's taste; the lesson could take "it feels abrupt" as the focus instead of refusing.
3. **The builder's read on the speed graph is half right.** The ask's read (`describe_layers`) can't see the
   curve's shape, so the after-lesson "does it look right?" couldn't answer. But the mentor *can* read ease
   influence: the speed graph lesson's own snapshot and check do. It's the ask mode that lacks it, and the lesson
   refused before using it. Same root as session 2's finding 3: the two modes read different things, and neither
   hands its read to the other.
4. **The ask box doesn't clear on send.** Panel fix.
5. **The record can't tell the projects apart.** Every asked entry from sessions 2 and 3 saved its project as
   "Untitled Project", though they were different saved projects. **Cause (checked after the session):** each was an
   `.aep` from an older AE, opened from Finder in AE 27.0, which opens it as an untitled "(converted)" copy, such as
   "INTEH End Graphic (converted)". Until Save As, `app.project.file` is null (`ae_status`: "(unsaved project)"), and
   `mentor/jsx/snapshot.jsx:584` falls back to "Untitled Project". The bridge reads AE correctly. This will be common
   right after anyone upgrades AE. So the project name can't be the key for the asked list or earlier questions.
   **Fix:** key on something that survives a conversion (the comp's ID plus its name, scoped to the AE session), and
   when there's no file say "an unsaved project" rather than a made-up title. Check whether any lesson check that
   compares `project` (offset, null, anchor, `marks.mjs`, `reviews.mjs`) treats two converted projects as one.
6. **Strong on precomps.** Each read said exactly what it could and couldn't see and asked for the one thing it
   needed. The builder called this out unprompted.

**Caveat:** builder as user, a third project, one go-deeper.

## Tally across sessions 1 to 3 (T095, partial)

- **Projects:** three, all my own and not set up for demos (session 1 on B1 because of a stale panel).
- **SC-002:** 8 of 9 step lines followed without asking, 0 explanation-only. Met.
- **SC-003:** every named layer right (7 of 7). Met so far; 10 needed.
- **SC-001 (a go-deeper per session):** 3 of 3 sessions had one; 0 of 3 wanted (all for the test).
- **SC-013 (3 of 3 hand-ins across two skills):** 2 hand-ins on A (Offset, Speed graph), both accepted and both
  handed back, but both lessons refused the focus. Session 1's never handed in (B1). Not met.
- **SC-004:** all 17 A turns' first activity ≤ 10 s. Met. **SC-005:** median answer cost under $0.10 across
  sessions 2 and 3; go-deeper lessons about $0.20 and $0.23. Met.
- **The headline:** asking works: steps clear, layers right, fast, honest about what it can't see. Going deeper
  doesn't yet: every hand-in landed in a lesson that couldn't take the step it was given, or read less than the
  ask did.

## To fix later

- **Ask box keeps the text after send** (session 3, finding 4). Panel ask input; clear on send.
- **Asked entries save "Untitled Project" for every converted project** (session 3, finding 5). A converted
  `.aep` has no file until Save As. Key the asked list and earlier questions on the comp's ID and name within the
  AE session; `snapshot.jsx:584` says "an unsaved project" instead. Test: two fixtures with `project` null and
  different comps never share earlier questions. Audit the lesson checks that compare `project`.

- **`go_deeper` hands into a lesson whose finder excludes the layer** (session 2, finding 2). `mentor/tools/ask.mjs`
  `go_deeper` and the offer check in `give_answer`; run the skill's finder on the step's layer, refuse with a code
  and never offer. Test: Logo 1 with a Rotation expression, Offset refused.
- **Earlier questions unscoped** (session 2, finding 4). Panel ask thread; scope to the active comp and session.
- **Refusal text not logged** (session 2, finding 1). Log each refused `give_answer` draft's failing field to
  `calls.jsonl` so `NOT_PLAIN_WORDS` loops can be read.

- **Pre-session check misses a stale panel.** `panel.json` can say `"a"` while a panel loaded earlier runs B1.
  Proposed: the panel shows its loaded runtime (or the turn log's `runtime`) in the Home footer, and
  `/usage-session` compares `panel-loaded.json` to AE's start time before a sitting.
- **Numbers across turns** (finding 4): when a follow-up's read is wider than the answer's, say which layer the
  numbers are measured on.

## Edge cases to plan for

- **Two projects, one comp name.** Sessions 1 and 2 were different projects whose comps are both named Comp 1 (AE's
  default). Anything keyed on the comp name alone (the earlier-questions list, the asked entries, "same comp"
  checks, notes like these) mixes them. Key on the project file plus the comp, and say the project when two
  match. Session 3 found a converted `.aep` (opened in a newer AE) has no file at all until Save As, so every one saves as
  "Untitled Project" and the name alone won't do. Checked in session 2's earlier-questions list.
