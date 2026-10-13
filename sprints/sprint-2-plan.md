# Sprint 2 Plan

**Goal:** By the end of the sprint, I will have specced the product, tested the MCP bridge,
decided the architecture, built a working slice of the product tested on a single skill in
After Effects, and interviewed 3 more people in my target market.

**Why this:** These are the first steps to turn my idea into something real. The MCP test
will verify that I can build the product the way I want to. The spec and architecture will
guide what gets built. The target-market interviews will help define who would pay for this
product and what they would pay for. The build is the first step toward an MVP and will show
whether the workflow I have in mind is viable.

**Done looks like:**

- [x] A spec for the test slice in `specs/`, committed before the build
- [x] A note on what the MCP bridge can and can't read
- [x] `decisions/003` defining the architecture
- [x] The test slice running on my own test After Effects project, with notes from using it
- [x] 3 usage interviews with people in my target market, logged in `discovery/interviews/` (`006`, `007`, `008`)

**Predicted difficulty:** 4

## Raised goals (added 2026-10-05)

Ahead of schedule on most of the plan above, so the goal grows mid-sprint. Everything above
still stands. The last remaining interview is already booked.

**Goal:** Everything in the original plan, plus a rudimentary version of the mentor panel built
inside After Effects that can run one easing lesson from start to finish and shows the learner's
memory.

**Why this:** Running the mentor entirely from Claude Code is blocking me from testing it and
expanding what it can do. It's important to test early and often. CEP is being retired, but I can
rebuild on UXP once the beta is out (Nov 2026).

**Decision needed first:** `decisions/005`, how the panel runs the mentor. Either (a) the panel
calls the Claude API directly (API key inside a CEP extension, its own tool loop, cost per use),
or (b) the panel is a front end to a Claude Code session. This changes the architecture in
`decisions/003`, so it's decided before the spec is written.

**Done looks like:**

- [x] `decisions/005` committed, choosing how the panel runs the mentor and what was rejected
- [x] A panel spec in `specs/003-*/`, committed before the build
- [x] One easing lesson (quickstart steps a–f: opening, explain with a frame, demo, partial
      attempt, complete attempt) runs start to finish using only the panel, with nothing typed in
      the Claude Code terminal. Claude Code may be running in the background if `decisions/005`
      needs it
- [x] For the same attempt, "Check my work" in the panel gives the same verdict as
      `diff_since_last` does in Claude Code
- [x] The panel shows the learner's memory from the learner record (read-only)
- [x] Notes from the panel run logged in `discovery/usage-notes/`

**Predicted difficulty:** 4

## Retro

**Actual difficulty:** 4

**Why it differed:** The difficulty was as expected because this sprint required me to learn a lot about AI application and architecture, but I still was able to finish everything in my sprint plan, even after raising the goal halfway through.

**Retro:** I did hit my goal of speccing the product, testing the MCP bridge, deciding the architecture, building a working slice, and interviewing 3 people. I also hit the raised goal of turning the slice into a functional panel inside of After Effects, essentially a stripped down MVP. Next sprint, I want to expand the capabilities of the mentor to teach more than just easing while maintaining the same disciplined, educational focus of the mentor. I also want to start working to make the user flows more intuitive and helpful by refining the panel UI.
