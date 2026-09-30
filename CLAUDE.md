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

- **This sprint's goal:** Sprint 2 (`sprints/sprint-2-plan.md`): spec the product, test the
  MCP bridge, decide the architecture (`decisions/003`), build a working slice on one After
  Effects skill, and run 3 target-market interviews.
- **Progress so far:**
  - Narrowed to creative workflows (`decisions/001`), then chose the AI creative mentor
    (`decisions/002`).
  - Self-test 1, five interviews (`discovery/interviews/001`–`005`), competitor check
    (`discovery/competitors.md`), insights, personas, and a product description.
  - MCP bridge test done (`specs/001`, `discovery/ae-bridge-findings.md`). All 11 reads work,
    including temporal ease. Deep reads need custom ExtendScript through `ae_run_script`.
    Change detection means taking a snapshot and comparing. Setup is built for developers.
    CEP is retired in AE (off by default Dec 2028, removed Dec 2029), and the AE UXP public
    beta is due Nov 2026.
- **Next steps:**
  1. Read Adobe's CEP/UXP post first-hand (linked in the findings note), then write
     `decisions/003` (architecture). Leaning: prototype on the CEP bridge and keep the AE-side
     piece thin so it can move to UXP.
  2. Write the spec for the test slice in `specs/` (one skill, likely easing), then build it.
  3. Book and run 3 usage interviews in the target market. Ask about Adobe's assistant, who
     pays, and whether memory and practice matter, before pitching
     (`discovery/interviews/bet-a-interview-guide.md`).
  4. After Nov 2026, re-run the spec 001 table against the AE UXP beta.
- **Where to see it:** Nothing built yet.
- **Biggest open risk:** that leading, memory, and practice aren't worth more to people than
  Adobe's free assistant used on request. Also: learners may not pay (belief 12), people take
  the result over the lesson in practice (belief 7), and Adobe could add a teaching mode.

## How this repo works

- Non-code work is committed as files, same as code. Interviews, experiments, pricing models,
  and usability findings all live here.
- Specs go in `specs/` and are written before the work. When asked to build or produce
  something non-trivial, check for its spec first. If there is none, draft one and confirm it
  before starting. Each spec gets a numbered folder (`specs/NNN-name/spec.md`).
  - **Build work** uses GitHub Spec Kit (`decisions/004`): `/speckit-specify` →
    `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`, which add `plan.md` and
    `tasks.md` to the same folder. Project rules for it are in `.specify/memory/constitution.md`.
  - **Non-code specs** (tests, campaigns, pricing) copy `specs/000-spec-template.md` instead.
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
