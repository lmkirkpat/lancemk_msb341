# Decision 012: Home opens ask-first

**Date:** 2026-11-14
**Status:** Active
**Amends `decisions/002`:** where the mentor leads. It still leads, but through the follow-through
after an answer, not at the moment the learner opens the panel.

## Context

Sprint 5's goal is a mentor companion I'd use on my own work, not a tutorial. The baseline on my own
logo comp (`discovery/usage-notes/ask-baseline.md`, 2026-11-13) opened with Find my next lesson. A
due review won, so the first thing I saw mid-project was a pivot review offer. It felt like a quiz
(finding 7), and every later turn pushed toward a lesson too. I'd have left for YouTube or a chatbot
after three or four turns.

Spec 014's teaching design (`specs/014-ask-mentor/teaching-design.md` § 12) designs an ask mode. It
reads the comp first, answers second, and teaches only when the learner asks. The open choice was what
the learner meets when they open the panel.

Facts it rests on:
- One session, me as the user, on one real comp (the baseline). The opening is only one of seven
  findings, but it set the tone for the rest.
- Belief 7 (Low): people take the result over the lesson in practice. Interview 008 said "learn
  only what I need".
- `decisions/002`'s difference from Adobe's assistant is leading, memory, and practice. Adobe answers
  when asked (the 2026-10-08 side-by-side).

## Options considered

1. **Ask-first.** A place to ask about the open comp. Under it, one quiet line from the record: a
   lesson in progress, or else Find my next lesson. A due review never opens a session the learner
   started with a question; it's a line in Skills, or one clause after an answer.
   - Pros: matches how I'd actually open it mid-project, and drops the quiz feeling at the door.
     Lessons stay one tap away.
   - Cons: gives up "it takes the lead" at the door, the one place the current product leads most
     plainly. Looks more like Adobe's assistant from outside.
2. **Lesson-first with an Ask button** (today's Home plus a button).
   - Pros: keeps leading at the door; least build.
   - Cons: the quiz feeling stays the first thing seen, which is the baseline's problem.
3. **Detect "mid-project" and switch the opening.**
   - Pros: each kind of learner gets the right door.
   - Cons: the read can't reliably tell a learner's own project from a practice comp, and an opening
     that flips on a guess would feel random. Rejected without testing.
4. **A chooser ("Ask or learn?").**
   - Pros: explicit.
   - Cons: a menu before any help is the scripted feeling in another form. Rejected without testing.

## Decision

**Ask-first (option 1).** The deciding reason: the product has to be something people open on their
own work, and the baseline showed that leading at the door is what made it feel like a tutorial. The
lead moves to the follow-through. Each answer names the skill behind each step and offers one
go-deeper, and memory brings a skill back on the next comp (teaching design § 11).

## What would change our mind

- **If** none of sprint 5's three sessions on my own comps goes deeper into a lesson without my forcing
  it, **then** the lead has been lost, not moved. Revisit this decision and `decisions/002` before
  sprint 6 (Knack is drifting toward Adobe's "answer when asked").
- **If** a target-market learner (not me) opens the panel and asks for a lesson first, or goes looking
  for Find my next lesson in two or more sessions, **then** give lesson-first a more visible place on
  Home.
- **If** Adobe's assistant starts reading expressions or parent motion and answering with steps tied to
  the comp, **then** the ask mode alone no longer sets Knack apart. Weight the follow-through (memory,
  go-deeper) more heavily, and revisit with `decisions/002`'s Adobe signal.
