# CLAUDE.md

Loaded at the start of every Claude Code session in this repo. Keep it current. It should let
a brand new session act like a colleague who already knows what you are working on and why.

## What I am working on

- **My role:** Solo builder: discovery, specs, building, design, testing, and GTM. Want to use
  agent workflows and automations in how I work. Low priority: pricing and analytics.
- **What it is:** An AI creative mentor (`decisions/002`, `product/product-description.md`).
  A teaching layer that leads the teaching, remembers what the user has learned across
  sessions, and builds practice so skills stick, inside the user's own project. After
  Effects first, designed so other apps can be added. Adobe's After Effects assistant
  already teaches *when asked*, so the difference is leading, memory, practice, and working
  across apps. Bet B (creative-operations copilot) was dropped untested.
- **Who it is for:** Creative professionals and students in Adobe Creative Cloud, starting
  with solo or in-house designers. I'm user #1 (I design for a university department and I'm
  learning After Effects now).
- **Who uses my work:** Same as above.
- **Why they would use it:** today they stitch together YouTube (visual but generic) and a
  chatbot (project-specific but text only), and the skill fades. "I would rather see a mouse
  on a screen moving" (interview 004).

## Current state

- **This sprint's goal:** Sprint 1 is closed (`sprints/sprint-1-review.md`, retro in the
  plan). Sprint 2 isn't planned yet.
- **Progress so far:**
  - Narrowed to creative workflows (`decisions/001`), then chose the AI creative mentor
    (`decisions/002`).
  - Self-test 1, five interviews (`discovery/interviews/001`–`005`), competitor check
    (`discovery/competitors.md`), insights, personas, and a product description.
- **Next steps:**
  1. Run `/sprint-plan` for Sprint 2: write the product spec, start building, and run
     usage interviews with people squarely in the target market.
  2. Write the first spec in `specs/`, and test what an After Effects MCP bridge can read
     (keyframes, easing, effects) before choosing web app vs. plugin vs. MCP-connected app.
  3. In interviews, ask about Adobe's assistant, who pays, and whether memory and practice
     matter, before pitching (`discovery/interviews/bet-a-interview-guide.md`).
- **Where to see it:** Nothing built yet.
- **Biggest open risk:** that leading, memory, and practice aren't worth more to people than
  Adobe's free assistant used on request. Also: learners may not pay (belief 12), people take
  the result over the lesson in practice (belief 7), and Adobe could add a teaching mode.

## How this repo works

- Non-code work is committed as files, same as code. Interviews, experiments, pricing models,
  and usability findings all live here.
- Specs go in `specs/` and are written before the work. When asked to build or produce
  something non-trivial, check for its spec first. If there is none, draft one and confirm it
  before starting.
- Meaningful choices get a numbered record in `decisions/`, written when the choice is made,
  including what was rejected and why.
- Sprint plans and reviews live in `sprints/`. The plan is committed on day one.
- Never put real names, emails, or phone numbers in this repo. Anonymize.

## Tools and conventions

- **Stack or tools:** TBD, a separate decision after testing an After Effects MCP bridge.
  Options: web app, plugin, or MCP-connected app.
- **How work ships:** TBD
- **Testing and style:** AI features get an eval set in `product/evals/`.

## Working with me

- Ask before large refactors or before adding a dependency.
- When I am wrong about something technical, say so directly and explain why.
- Show me the plan before executing anything that touches more than a couple of files.

## Voice

Writing other people read (product copy, marketing, memos) sounds like: [2 or 3 adjectives,
plus one example line]
