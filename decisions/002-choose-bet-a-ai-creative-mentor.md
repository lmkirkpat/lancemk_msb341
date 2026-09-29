# Decision 002: Build Bet A, an AI creative mentor, as a teaching layer across apps

**Date:** 2026-09-28
**Status:** Accepted, 2026-09-28, after interviews 001–005. Open questions below carry into
Sprint 2.

## Context

Decision 001 narrowed the direction to creative workflows, with two bets left: **A**, an AI
mentor that teaches creative software inside the user's own project, and **B**, a
creative-operations copilot (brand-compliance audits, merging feedback, finding assets).
Sprint 1 ends around 2026-09-30 and needs one direction.

Evidence so far:

- **Self-test (Bet A, 2026-09-23):** built a kinetic-type intro in After Effects from Claude's
  instructions in about 29 minutes, against an estimate of 1–2 hours. The skills carried over
  to a second layer without being re-taught. See `discovery/problem-candidates.md`.
- **Four conversations** (`discovery/interviews/001`–`004`): all four struggled to learn
  Adobe apps. Their workaround is guess-and-check, or YouTube plus a general chatbot used
  together. One said that under deadline they wanted the result, not the lesson (belief 7).
  Interview 004 added three things: chatbot text steps stop working once the app gets
  complex ("I would rather see a mouse on a screen moving"); they have never paid to learn
  and wouldn't (belief 12); and they use apps from more than one company (Lightroom,
  Photoshop, Final Cut, Snapseed), though they weren't asked about a tutor across apps.
- **Competitor check** (`discovery/competitors.md`): Adobe says its assistants are meant to
  do tasks, not teach. But in my hands-on test, the After Effects beta assistant, **when
  asked**, gave clear instructions, checked my work against real project data, and suggested
  an ordered list of what to learn next. Figma's agent and InDesign's assistant answer
  how-to questions too. What no app's assistant does: take the lead in teaching, remember
  what the user has learned across sessions, build practice so skills stick, or work across
  apps. Resolve (official MCP), Blender (Python API), and community After Effects bridges
  let an outside tool read the user's project.
- **Bet B was never tested.** No self-test or interviews.

## Options considered

1. **Bet A as originally framed: an After Effects mentor with screenshot diagnosis.** Pros:
   the self-test worked, and it's my own workflow. Cons: Adobe's free assistant already does
   most of this core loop when asked, and it reads the project directly while this version
   relies on screenshots. It would only be different in teaching style.
2. **Bet A repositioned: a teaching layer that works across apps.** It takes the lead
   instead of waiting to be asked, keeps a record of what the user knows, and builds practice
   so skills stick. It connects to each app's project through MCP bridges. Start with
   After Effects, and design so Resolve and Blender can be added. Pros: the only version with
   a gap no single-app assistant covers, and app makers have no reason to build a tutor that
   works across competitors' apps. It's still my own workflow, and a real building stretch
   (MCP, agent design, memory, evals). Cons: the gap is thin and Adobe could close parts of
   it (memory, a teaching mode). The After Effects bridges are community-built. No
   interviewee has asked for a tool across apps yet, though one (004) uses apps from several
   companies.
3. **Bet A for apps without an assistant only (Resolve, Blender).** Pros: least crowded. Cons:
   I don't use either app, so I lose the weekly self-testing that drove decision 001.
4. **Bet B (creative-operations copilot, starting with brand audits).** Pros: narrow, easy to
   demo, easy to build evals for. Cons: untested, a smaller building stretch, and
   Illustrator's assistant now runs "production checks," so it faces a similar threat from
   Adobe. Rejected without a self-test because I can only run one bet properly this semester,
   and the evidence I *do* have points to A.

## Decision

**Option 2.** Build an AI creative mentor as a **teaching layer**: it leads the teaching,
remembers what the user has learned, and builds practice so skills stick, inside the user's
own project. **After Effects first**, designed so other apps can be added later.

**The deciding reason:** I'm my own user for it every week, and it stretches my building
skills furthest. Both matter for a semester-long class project. Bet B's first tool would be
mostly one pipeline: upload an export, compare it to a brand guide, get a report. This bet
makes me build and learn a full AI product:

- **Connecting AI to a real app:** reading live After Effects project state through an MCP
  bridge (CEP and ExtendScript), then adding other apps through their own interfaces.
- **Agent design:** a mentor that decides what to teach next, when to step in, and when to
  let me try on my own, instead of just answering or doing the task.
- **Memory and learner modeling:** keeping track of what a user knows across sessions and
  projects, and using it to plan practice and review.
- **Seeing the work:** working from screenshots and rendered frames as well as project data,
  and knowing the limits of each (see belief 4 on audio timing).
- **Evals for teaching quality:** an eval set in `product/evals/` that tests whether the
  mentor teaches well, not just whether it's correct. This is harder and more interesting
  than evaluating a checklist.
- **Product work around it:** onboarding, a progress view, usability tests with real
  learners, and possibly a plugin inside the app later.

Every part is something I'll use while learning After Effects this semester, so I get quick
feedback on whether it works. **Market viability isn't proven.** It depends on whether a teacher that leads, remembers, and builds practice is
worth more to people than Adobe's free assistant used on request. The next sprint has to
test that.

Separate decisions still to make: web app vs. plugin vs. MCP-connected app (after testing
what an After Effects bridge can read), and the stack.

Open questions this decision doesn't settle yet:

- **Who pays.** The one learner asked (004, a student) won't pay, because AI and YouTube are
  free. Their suggestion was an Adobe bundle. Possible payers: working professionals, their
  employers, schools. Pricing is low priority this semester, but Sprint 2 interviews should
  ask.
- **Showing, not only telling.** Two interviewees (003, 004) use YouTube because it shows the
  steps visually. Text steps alone put the mentor level with Adobe's assistant and ChatGPT.
  The first prototype needs some visual way to show where to click (highlights, annotated
  screenshots, or short clips).

## What would change our mind

- **My own usage:** if, while learning After Effects, I keep reaching for Adobe's assistant
  instead of my prototype, the difference isn't real.
- **Interviews:** by the end of Sprint 2, if most people who recently learned a creative app
  say Adobe's assistant or a chatbot on request is enough, and don't value a record of their
  progress or structured practice, fall back to Option 4 or treat this openly as a learning
  project.
- **Adobe:** if the After Effects assistant ships a teaching mode that leads, or memory of
  what the user has learned, shift the first app to Resolve or Blender (Option 3).
- **Access:** if no After Effects bridge can reliably read project state (keyframes, easing,
  effects), rethink starting with After Effects. Screenshot-only puts the product behind
  Adobe from day one.
