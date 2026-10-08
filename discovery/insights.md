# Running Insights

> Synthesis, not a diary. Keep it to the 5–10 things you currently believe about your market,
> each with evidence. Revise beliefs in place; note the date of last change. Numbers are
> stable because decisions and specs cite them: merged or parked beliefs keep a stub.

Last reviewed 2026-10-08, after interviews 001–007, self-test 1, and the second hands-on test of
Adobe's assistant (`discovery/usage-notes/adobe-assistant-2026-10-08.md`).

## How confidence is rated

Each piece of evidence is scored by what kind it is, not just how many people said it:

| Evidence | Points |
|---|---|
| **Did:** a real past story, told before the pitch | 1 |
| **Did (outside research):** a hands-on competitor test, or a competitor's own public statement | 1 |
| **Said:** a stated preference, before the pitch | ½ |
| **Weak:** a reaction after the pitch, a hypothetical, an answer I led, or my own self-test | ¼ |

| Level | Rule |
|---|---|
| **Hunch** | Under 1.5 points, or only one source |
| **Low** | 1.5–3 points |
| **Med** | 3+ points from 3+ people (or sources), with no strong counter-evidence |
| **High** | Med, and it held up when people could choose otherwise (they used the mentor, came back, or paid) |

Rules for applying it:

- **Interviews alone top out at Med.** High needs behavior with the product.
- **Rate the claim as written.** Keep claims narrow. Anything the claim implies but the
  evidence doesn't show goes on an **Untested** line, not into the rating.
- **Counter-evidence gets its own line** and can hold a belief at Low however many points
  it has.
- Friends and informal chats score the same as anyone else, but the note should say so.

## Beliefs

### 1. The hard part is knowing what's wrong; diagnosing from the project is the most-wanted job

People can follow steps. What costs them is not knowing what went wrong or what to search
for. In a long project it's worse: a step missed early breaks things hours later.

- **Confidence:** Med (≈4.5 points, 4 people + self)
- **Did:** 003 sent screenshots asking "what am I looking at?" (needed YouTube first to know
  enough to ask). 004 typed "the sky on my photo is really blown out" and was pointed to
  masking. 006 photographed their Layers panel and got the clipping-mask fix. 007: "it maybe
  took more time to find the error than to find a video that would help." Self-test 1 caught
  state mismatches and shortcut conflicts from screenshots.
- **Said:** 007, after the pitch, named diagnosis first: "what's the problem here? Why does it
  look like this?"
- **Against:** none yet.
- **Untested:** whether diagnosis inside the mentor is worth more than a free chatbot with a
  screenshot, which is what 003, 004, and 006 already use. Spec 002 teaches a new skill
  (easing); it doesn't diagnose a broken project.
- **The bar moved (2026-10-08):** Adobe's assistant already diagnoses from the project. Asked
  why Mentor Practice looked mechanical, it named 8 causes across layers (equal durations,
  properties landing together, stacked parent motion, a speed jump, a fading cursor, an
  expression overriding keys, dead time, no motion blur). The mentor only sees linear pairs.
  So the comparison is now Adobe in the app, not a chatbot with a screenshot. This is a
  competitor fact, not evidence of what people want, so it doesn't change the rating.
- **Sources:** `problem-candidates.md` self-test 1; interviews 003, 004, 006, 007;
  `discovery/usage-notes/adobe-assistant-2026-10-08.md`
- **Updated:** 2026-10-08 (merged old belief 3; Adobe's diagnosis)

### 2. Skills stick when used in real work and fade when not

- **Confidence:** Med (≈4.5 points, 5 people + self)
- **Did:** 004 now uses ChatGPT less in Lightroom because they "picked up on my normal
  routines." Fading: 003 "I'm probably already rusty" on Premiere. 005 let Photoshop lapse.
  006 had done clipping masks before and still had to look one up. 007 drilled shortcuts for a
  test and forgot them "the day after." Self-test 1: easing carried over unprompted on a
  second repetition.
- **Against:** none yet.
- **Untested:** whether practice built into real projects slows the fade, and whether anyone
  would value not forgetting over relearning on demand (see belief 12: relearning basics is
  free). This is the core claim behind memory and practice, and no interview has tested it
  before the pitch.
- **Sources:** self-test 1; interviews 003, 004, 005, 006, 007
- **Updated:** 2026-10-08

### 3. → merged into belief 1 (2026-10-08)

### 4. → parked (see below)

### 5. Today's workaround is YouTube + a free chatbot + trial and error; nobody uses paid courses

The real competitor is that combination, not courses. YouTube is visual but generic; the
chatbot is project-specific but text only. People stitch them together, plus a person when
they have one.

- **Confidence:** Med (≈5.5 points, 6 people)
- **Did:** 001 guess-and-check (informal, paraphrased). 003 YouTube + ChatGPT/Gemini + an
  in-house editor: "I couldn't have done it probably with one or the other." 004 chat first,
  then asks chat for a YouTube link. 005 a teacher's overview, then trial and error, YouTube,
  Google. 006 AI first now, since you "don't have to like watch a video or like search
  Google." 007 YouTube and retracing steps; finding the right video took "hours." Nobody has
  paid for a course; 004 never has.
- **Against:** none. Built-in app tutorials were tried and dropped (003).
- **Sources:** interviews 001, 003, 004, 005, 006, 007
- **Updated:** 2026-10-08 (absorbed the competitor half of old belief 8)

### 6. Help should be inside the app

- **Confidence:** Hunch (≈1 point). The architecture already bets on this (`decisions/003`,
  `decisions/005`), so it needs testing more than any other Hunch.
- **Said:** 003 suggested without prompting merging the built-in tips with your own project
  (½). 002 strongly prefers a plugin (informal, after the pitch, ¼). 006 would trust it
  *more* built in: "if anything's going to understand this software, it would be this"
  (after the pitch, ¼).
- **Against:** everyone's actual workaround (belief 5) lives in another tab and works.
- **Sources:** interviews 002, 003, 006
- **Updated:** 2026-10-08

### 7. Whether people want the lesson depends on the moment: mid-project, they take the result

The biggest risk to a teaching-first product. People value learning, and authorship is a
real reason for it, but the more time already sunk into a project, the less they want the
lesson.

- **Confidence:** Low (≈2.5 points toward "the moment decides")
- **Did:** 003, on a crunch: "it was more just to get the project done." 005 had Canva's AI
  "do the task for me." 007 described their own habit before the pitch: "If I've done 4 hours
  on it, I don't want to do it."
- **Said (why people want the lesson):** 006, before the pitch: "I'd want it to be like my
  work ... being able to walk someone through my design." 007: "If AI makes it, it's not
  yours." 005 (hypothetical) would want AI to teach them.
- **Against:** 006 followed AI's steps themselves mid-task rather than finding a way to have
  it done, but no do-it-for-you option was in front of them. Adobe's assistant puts one in
  front of them: it offered "do all of it" after explaining, and did the whole comp when asked
  (2026-10-08 test).
- **Untested:** whether people come back to learn *after* the deadline. If they do, the
  mentor's moment is after the crunch, not during it.
- **Sources:** interviews 003, 005, 006, 007; `product/product-description.md`
- **Updated:** 2026-10-08

### 8. Text-only help falls short in an app the learner doesn't know yet

- **Confidence:** Low (≈2.5 points)
- **Did:** 004 chains them: "if I still don't get it, I have chat give me a YouTube link." 003
  used YouTube for the visuals and chat for their own project.
- **Said:** 004, for Photoshop: "I would rather see a mouse on a screen moving."
- **Against:** 006 finds text fine in apps they know well; real layer names made it feel "a
  little visual in its own sense." That fits the "doesn't know yet" limit but narrows it.
- **Sources:** interviews 003, 004, 006
- **Updated:** 2026-10-08 (competitor half moved to belief 5)

### 9. → merged into belief 10 (2026-10-08)

### 10. Adobe's assistant already teaches on request, but nobody we've talked to has used it

Adobe's stated strategy is to remove the need to learn, but in practice its After Effects
assistant gives step-by-step instructions, checks work against the project data it can read,
diagnoses a whole comp, and suggests next skills, when asked. Every app's assistant covers
one app, works only when asked, and has no memory of the learner. What's left for the
mentor: leading, restraint, depth on each skill it teaches, memory, practice, and working
across apps. Adobe's lead is breadth: many skills plus diagnosis.

- **Confidence:** Med (≈5.5 points; desk research, two hands-on tests, 2 interviews)
- **Did (research):** hands-on test of the After Effects assistant (one session). Adobe's
  public statements never mention teaching. Figma answers how-to questions in the canvas;
  Resolve and Blender have no official assistant but let outside AI read the project.
- **Did (research, 2026-10-08):** a side-by-side with the mentor on Mentor Practice
  (`discovery/usage-notes/adobe-assistant-2026-10-08.md`, `easing-slice.md` › SC-007). It
  diagnosed the comp well and respected "teach me without doing it for me". But it never led:
  "teach me" got a whole manual in one turn. Its "demo" eased a whole layer, and "do the rest"
  did the comp plus changes nobody asked for. It also can't read easing type ("My tools can
  read keyframe times and values but not their easing type"), so its check left 7 properties
  unconfirmed.
- **Did (interviews):** 006, a daily Photoshop user, hadn't noticed its assistant. 007 thinks
  of Adobe's help as the help button: "how helpful is it really?" (½, after the pitch).
- **Against:** none yet. Judge Adobe by hands-on tests, not announcements.
- **Untested:** whether people would pick the mentor over Adobe's assistant once they know
  it exists. Also how far Adobe is from a "lead the lesson" mode: restraint and leading are
  product choices, not capabilities, and the 2026-10-08 test shows it already has most of the
  pieces. Memory wasn't compared (one session each time).
- **Builder's plan (2026-10-08):** close the breadth gap (sprint 3: more skills, then
  diagnosis and recommended paths), so that what's left to tell them apart is depth,
  restraint, and a focus on teaching.
- **Sources:** `discovery/competitors.md`; `discovery/usage-notes/adobe-assistant-2026-10-08.md`;
  interviews 006, 007
- **Updated:** 2026-10-08 (merged old beliefs 9 and 11; second hands-on test)

### 11. → merged into belief 10 (2026-10-08)

### 12. Nobody pays to relearn basics; free AI and YouTube set that price at zero

- **Confidence:** Med for the claim as written (≈3.75 points, 3 people)
- **Did:** 004 has never paid to learn. 006 fixed a forgotten clipping mask with free AI in
  minutes. 007 didn't try AI at all because a class banned it ("you will get kicked out of
  class and like reported"), a second barrier for students.
- **Weak (after the pitch):** 004: "I couldn't justify paying ... I would rather do it myself."
  006: "that would depend on my skill level"; might pay to go "deeper." 007: "I don't know";
  suggested a student price and a professional price, billed yearly like Adobe. 004 and 006
  both suggested selling it with the Adobe plan. My own example led 007's pro answer.
- **Against:** none.
- **Untested:** whether anyone pays for depth, and who pays (learner, school, employer,
  Adobe). No pay behavior at all yet.
- **Sources:** interviews 004, 006, 007; `decisions/002`; `decisions/005`
- **Updated:** 2026-10-08

### 13. → parked (see below)

### 14. The best help people have had is a person who explains, not one who takes over

The mentor's job is to get as close to a good teacher as possible, not just to beat YouTube.

- **Confidence:** Med (≈4 points, 4 people)
- **Did:** 003 leaned on an in-house video editor. 005: a teacher was the best help they had.
  006 learned partly from a parent who is a graphic designer. 007's classmate "just took my
  keyboard" instead of saying the step: help from a person can be bad too.
- **Said:** 005 would still pick an in-person teacher over an AI mentor, but the mentor over
  YouTube (hypothetical, ¼).
- **Sources:** interviews 003, 005, 006, 007
- **Updated:** 2026-10-08

### 15. Trust breaks if it's wrong, takes a side path, or does the work for you

The direct evidence for demo-once (`specs/002`, the `set_ease` limit).

- **Confidence:** Low (≈1.75 points)
- **Did:** 007 was frustrated when a classmate took over instead of explaining.
- **Weak (self-test, 2026-10-08):** in the side-by-side, Adobe's assistant jumping ahead and
  doing the work felt "disconcerting as a learner, like it was trying to jump four steps
  ahead before I understood step one." The builder only (¼).
- **Weak (after the pitch):** 006 would stop if it "take[s] you on a different path" or
  "isn't direct." 007 would stop "if it was wrong," "if I have to ask it multiple times," or
  "if it does it for me ... starts filling in stuff." 007 on demo-once: "That's cool."
- **Against:** none yet. Untested in a real lesson with someone other than me.
- **Sources:** interviews 006, 007; `discovery/usage-notes/adobe-assistant-2026-10-08.md`
- **Updated:** 2026-10-08 (new; the builder's side-by-side)

## Open questions with no evidence yet

The questions the product most depends on, and no interview has tested before the pitch:

1. **Do memory and practice matter more than relearning on demand?** (beliefs 2, 10, 12)
2. **When people know Adobe's assistant exists, do they still want a mentor that leads?**
3. **Do people who use apps from several companies want one tutor across them?** 004 and
   007 are the best fits so far; neither was asked.

## Parked

Not wrong, just not supported by interviews and not driving decisions now. Bring one back
if new evidence shows up.

- **Old belief 4 (audio timing):** reading a waveform to hit a beat only works for isolated
  transients; in a dense section it's back to ear and rhythm. A limit on diagnosing
  audio-timed work from screenshots. Self-test 1 only. Cited by `decisions/002`.
- **Old belief 13 (copying a look):** what makes people want to learn is often a look they
  want to copy, not a list of skills. 004 saves creators' tip reels to copy later and
  suggested creators could sell techniques like presets. n=1; not seen in the six other
  interviews, but no one else was asked.
