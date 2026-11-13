# Sprint 5 Plan

**Goal:** Improve the design of how the user interacts with Knack. The lessons teach well, but the
current usage paradigm doesn't match how I'd use the app on my own. In two weeks, the app should
feel like an actual mentor companion that I'd use to teach me new skills or make suggestions for my
composition when I need it, not like a gimmicky tutorial. Also finish the option A runtime
carry-over.

**Why this:** After my own testing, I don't think I'm close enough to an MVP to ship it. If there
are major problems I can see, and I built the product, I expect it would be very difficult for
anyone else to use. I want to solve some of those problems before I try to ship anything to someone
else.

**Done looks like:**

- [ ] I can ask the mentor an open-ended question about something I want to accomplish in a comp,
      limited to what the six skills cover, and it gives me steps to get there, with the option to
      go deeper into a lesson on any skill it references
- [ ] 3 sessions on 3 of my own comps that aren't set up for demos, each logged in a usage note:
      the question I asked, the steps it gave, whether I could follow them, and at least one
      go-deeper into a skill lesson
- [x] Option A runtime carry-over done: pivot proven in a live lesson on A, the null set run on A,
      easing, speed graph and offset meeting FR-033 on A, T068's cause found (changed Nov 12:
      not reproduced in 1,082 timed requests, log left on), and T066 (the install switch) landed
- [ ] Sessions and/or eval runs logged on most days of the sprint, so the work doesn't pile up at
      the end

**Predicted difficulty:** 4

**Changes:**

- Nov 12: T068 closed as not reproduced instead of "cause found". 1,082 timed A requests showed
  0 re-sends or stalls (`c67d00d`), and the timing log stays on, so if it comes back it will be
  caught. Chasing a bug that won't reproduce isn't worth the sprint's time.
- Nov 12: game plan for the rest of the sprint. Diagnosis (spec 005) is parked: the companion only
  answers questions I ask within the six skills, and adding comp-level diagnosis would double the
  scope. A baseline session comes before any design.
  1. **Nov 12:** pivot's live lesson on A, which closes the option A carry-over.
  2. **Nov 13 to 15:** a baseline session (ask today's mentor an open question on one of my own
     comps, log it with `/usage-session`), then the teaching design (curriculum-designer) and a
     panel mockup for an Ask entry designed together with spec 007's T061 (ui-designer), a
     decision record on whether the home screen goes ask-first, and spec 014 through Spec Kit.
  3. **Nov 16 to 20:** build on B1 (`decisions/011`): an `/ask-mentor` skill that reuses
     `next-mentor`'s hand-over, the panel's Ask entry, and a small eval set. One Opus agent writes
     code at a time.
  4. **Nov 18 to 24:** the three sessions on my own comps, about every two days, with fixes in
     between (merge `panel/` only between sittings). Check at least one go-deeper on A early,
     since a skill can't hand over on B1. Before close, one A run of the new set.

