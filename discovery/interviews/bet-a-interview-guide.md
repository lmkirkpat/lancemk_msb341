# Interview guide: Bet A (AI creative mentor)

**Updated 2026-10-08** after interviews 001–007 and the insights review. The early interviews
established the pain and the workaround (beliefs 1, 2, 5, 14 are Med). This version spends
the time on what's still a Hunch, Low, or untested: the claims the product most depends on.

**Who to talk to:** people who do creative work for pay or for their job at least weekly, and
who learned or relearned something in a creative app in the past 3 months. Working designers
(in-house or solo) first; students only if they also work. Prefer people I don't know well.
Four of seven so far were friends.

**Length:** 35 min (★ questions alone fit in 20). Log each one with `000-interview-template.md`, anonymized, and score the
evidence with the rubric in `discovery/insights.md`.

## What these interviews need to answer now

In order of priority. ★ questions below are the ones to protect if time runs short.

1. **Do memory and practice matter more than relearning on demand?** (open question 1;
   beliefs 2, 12). No interview has tested this before the pitch.
2. **What do people do once they know Adobe's assistant exists?** (open question 2;
   belief 10). So far nobody has used it.
3. **Is wanting the lesson about the moment?** Mid-project they take the result. Do they
   ever come back to learn after the deadline? (belief 7, Low)
4. **Is in-app help worth more than another tab?** (belief 6, Hunch, though the build
   already depends on it)
5. **Has anyone paid for anything to get better at creative work, and who pays for their
   apps?** (belief 12: no pay behavior yet)
6. **Do people with apps from several companies want one tutor?** (open question 3)

Already answered well enough; don't spend time confirming them: that learning is painful,
that YouTube + chatbot is the workaround, and that a good person is the best help.

## Rules for myself

Kept from the first version:

- Ask about **what they've actually done**. "Tell me about the last time..." beats "Would
  you...?" Every question below starts from a real event.
- **Don't pitch until the end.** Everything said after the pitch scores ¼. If an answer
  matters, get it before the pitch.
- When they're vague, dig: "Can you tell me more?" "What happened next?"
- Let silence do the work. Write down their exact words.

Added because of what went wrong in 001–007:

- **No praise of their work until the end** (006, 007). It warms up every answer after it.
- **Never answer my own question with my own experience**, especially on pay (007 changed
  their mind because of my example). If they say "I don't know," wait, then ask about what
  they've done, not what I'd do.
- **Don't describe the product's features in a question** (005's memory reaction, 003's
  "dumb practice projects"). Ask about the problem; let them bring up the feature.
- **For every story, ask what it cost:** minutes, hours, a worse result. "How long did that
  take?" is the follow-up that made 007's interview useful.
- **Ask for referrals before the last question**, not after. Two transcripts cut off at the
  close.
- **Say who's talking when the recording starts** ("This is Lance asking...") or take quick
  notes on speaker turns. Transcripts merge both voices, and 007's pay answer was nearly
  credited to the wrong person.

## Questions

### 1. Warm-up (2 min)

- What creative apps do you use, and what for? Which come from companies other than
  Adobe? *(open question 3)*
- Who pays for them: you, your school, your employer? *(belief 12, sets up section 5)*

### 2. The last thing they learned (8 min)

- ★ Tell me about the last time you had to learn something new in a creative app for a real
  project. What was it? How did you figure it out? How long did it take?
- When you used YouTube or a chatbot for it, where was it on your screen? What was it like
  going back and forth? *(belief 6: listen for whether switching actually bothers them)*
- Did you finish it the way you wanted, or settle for something simpler?

### 3. When something breaks (5 min)

- ★ Tell me about the last time something in a project looked wrong and you didn't know
  why. How did you find the cause? How long did it take? *(belief 1)*
- Tell me about a time help made things worse: a video, an AI answer, or a person.
  *(belief 15)*

### 4. Skills that fade (7 min, the most important section)

- ★ Think of something you used to know how to do in an app and had to look up again. What
  happened? How long did it take to get back? *(belief 2)*
- ★ Was there a time getting a skill back cost you more than a few minutes? What was the
  skill? *(open question 1: whether fading costs enough on deeper skills)*
- After you learn something for a project, do you ever practice it or come back to it? Tell
  me about the last time. *(belief 2)*
- Do you keep anything to remember what you've learned: notes, saved videos, bookmarks?
  Show me if you can. *(open question 1, and what memory would compete with)*

### 5. Learn vs. just get it done (4 min)

- ★ The last time you were stuck right before a deadline, what did you do? And the last
  time you were stuck with no deadline? *(belief 7: compare the two)*
- ★ After a project was done, have you ever gone back to learn the thing you had skipped or
  had done for you? What made you go back, or not? *(belief 7, untested)*

### 6. Tools they already have (3 min)

- ★ Have you opened the AI assistant built into [their Adobe app]? What did you ask it? Did
  it help? *(belief 10)* If they've never noticed it, note that and move on. Don't describe it.
- What have you paid for to get better at creative work: courses, presets, templates,
  plugins, fonts, a tutor? What made it worth it, or not? *(belief 12: pay behavior)*

### 7. Reaction (5 min, only at the end)

If they're in person with After Effects open, **show the panel instead of pitching**: run
the easing lesson on the Mentor Practice comp and let them do the "you do" step. Watch where
they hesitate, what they ask, and whether they try to get it to do the rest. What they do
there is the strongest evidence available. Note it as product use, separate from the
interview.

Otherwise, the pitch (describes what exists, no adjectives):

> "I've built a mentor inside After Effects. It reads your comp, picks something to teach
> (right now, easing), shows you once on one keyframe pair, and then you do the rest while it
> checks your work. It remembers what you've learned for next time. It won't do the work
> for you."

- What's your first reaction?
- Earlier you said you [their skill-fade story]. Would this have changed that? How?
  *(ties the pitch to their own story, not a hypothetical)*
- Adobe's assistant can answer how-to questions in your project when you ask. What would
  make you use this instead, or neither? *(open question 2)*
- Would you want the same mentor in [their non-Adobe app]? *(open question 3)*
- Who would you expect to pay for this: you, your school, your employer, Adobe? Don't
  follow up with my opinion.

### 8. Close (1 min)

- Who else do you know who learned or relearned something in a creative app recently?
  (Ask this first.)
- Can I follow up when there's something for you to try?

## After each interview

Write it up the same day in `discovery/interviews/NNN-<descriptor>.md` using the template.
For each belief it touches, tag the evidence **Did**, **Said**, or **Weak** (the rubric in
`discovery/insights.md`), then update that belief's points and confidence. Anything that
answers an open question goes there first.
