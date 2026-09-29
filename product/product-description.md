# Product description: AI creative mentor (name TBD)

**Status:** Draft, 2026-09-28. Follows `decisions/002`.

**In one sentence:** an AI mentor that teaches you creative software inside your own
project, starting with After Effects. It plans what to learn next, has you do the work, checks
your attempt, and remembers what you've learned so the skills stick.

## The problem

Learning a creative app like After Effects is scattered and slow. YouTube is visual but
generic: you have to know what to search for, then translate someone else's project into
yours. Chatbots can work on your project but aren't visual, and you need to know enough to
ask the right question. Courses are expensive and built around practice projects you don't
care about. So people get by with guess-and-check, stitch these sources together, and
lose the skill when they don't use it for a while ("I'm probably already rusty").

Evidence: self-test 1 (`discovery/problem-candidates.md`), interviews 001–005, and
`discovery/insights.md`.

## Who it's for

**People learning a creative app for skills they'll keep using:** designers adding motion
to their work, students, and creatives picking up a new tool for their job. I'm user #1: an
in-house university designer learning After Effects.

**Not for (yet):** someone who just needs one thing done by Friday. That person is better
served by Adobe's own assistant doing the task (belief 7).

## How it works

1. **Set a goal on your own project.** "I want this title to hit the beat drop." The mentor
   reads your After Effects project (how it connects is still to be decided; see below).
2. **Get a path, not an answer.** It breaks the goal into an ordered set of skills
   (keyframes → easing → syncing to audio → motion blur) and skips what you already know.
3. **Learn one step at a time, and do it yourself.** Short, visual instructions tied to your
   actual layers and timing. The mentor can **show** you how something is done, but it's
   a tutor, not an assistant: it demonstrates to teach, and doesn't do tasks on request.
4. **Get your attempt checked.** It checks what you did against the project and explains
   what's off and why, like catching a keyframe that doesn't match the playhead.
5. **It remembers.** It keeps track of what you've learned, across sessions and projects.
   Next time it builds on that, and it brings back skills you haven't used in a while so
   they don't fade.
6. **It takes the lead.** It suggests the next skill without waiting to be asked, because
   most learners don't know what to ask.

## Why use it over what exists

| Instead of... | That falls short because... | This mentor... |
|---|---|---|
| YouTube | Generic, and you have to know what to search for | Starts from your goal and your project |
| A general chatbot | Not visual, can't see your project, starts fresh every time | Reads your project and remembers what you know |
| Courses | Expensive, built around made-up practice projects | Teaches through the thing you're actually making |
| Adobe's AI assistant | Built to do the task. It teaches only when asked, forgets you between sessions, and covers one app | Leads the teaching, tracks your progress, and is built to work across apps |

The honest risk: Adobe's assistant already does a lot of this **when asked**
(`discovery/competitors.md`). What makes this product different is **taking the lead,
memory, and practice**, and that needs proving. See `decisions/002`.

## Scope for this semester

**In:**
- After Effects only.
- The core loop above: goal → path → step → check → remember.
- Me as the main user, plus a few learners for usability tests.
- An eval set for teaching quality in `product/evals/`.

**Out:**
- Other apps (Resolve, Blender, Figma). The design allows for them, but they won't be built
  this semester.
- Doing tasks on request. Demonstrations are in scope because they teach. Doing the work
  for the user isn't, and Adobe's assistant already does it.
- A full course library or content marketplace.
- Pricing, payments, and accounts beyond what testing needs.
- Mobile.

## Open questions

- **How it connects to After Effects:** a web app with screenshots, an MCP bridge that reads
  the live project, or a plugin inside the app. Next step: test what an After Effects MCP
  bridge can actually read. This gets its own decision record.
- **Where showing ends and doing starts:** the principle is settled (tutor, not assistant),
  but the rule isn't. One candidate is "I do, we do, you do," the gradual-handoff model
  from teaching: the mentor demonstrates once (for example, eases the first keyframe), you
  do the next with guidance, then you do the rest alone and it checks. It could also
  demonstrate on a copy of the layer, so your project stays yours. Decide this in the spec,
  and test it with learners.
- **Stack:** decided after the connection question.
- **Whether taking the lead, memory, and practice matter to anyone besides me:** test in
  Sprint 2 interviews and with a prototype.
- **Name.**
