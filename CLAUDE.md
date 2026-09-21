# CLAUDE.md

Loaded at the start of every Claude Code session in this repo. Keep it current. It should let
a brand new session act like a colleague who already knows what you are working on and why.

## What I am working on

- **My role:** Solo builder: discovery, specs, building, design, testing, and GTM. Want to use
  agent workflows and automations in how I work. Low priority: pricing and analytics.
- **What it is:** A tool for creative workflows. The specific problem isn't chosen yet; it's
  between two bets:
  - **Bet A: AI creative mentor.** Teaches creative software (starting with After Effects)
    inside the user's own project, as an ordered skill path with practice steps and screenshot
    diagnosis. The gap: Adobe's in-app AI assistants (2026 betas) *do* tasks and don't *teach*.
  - **Bet B: creative-operations copilot.** For solo or in-house designers: brand-compliance
    audit (likely first tool), merging feedback into one change list, and asset search.
- **Who it is for:** Creative professionals and students in Adobe Creative Cloud, starting
  with solo or in-house designers. I'm user #1 (I design for a university department and I'm
  learning After Effects now).
- **Who uses my work:** Same as above.
- **Why they would use it:** Bet A: "YouTube is scattered, courses are expensive, and none of
  it is built into the projects I'm actually working on." Bet B: to be confirmed in interviews.

## Current state

- **This sprint's goal:** Sprint 1: know what I'll build this semester, who it's for, and why
  it needs to exist (`sprints/sprint-1-plan.md`).
- **Progress so far:**
  - Narrowed to creative workflows (`decisions/001`).
  - Candidate problems and test plan are in `discovery/problem-candidates.md`.
- **Next steps:**
  1. Run a manual self-test for each bet and log it in `discovery/problem-candidates.md`.
  2. Do 3–5 anonymized interviews per bet, saved in `discovery/`.
  3. Score both bets.
  4. Write `decisions/002` choosing one, then update the README and this file.
- **Where to see it:** Nothing built yet.
- **Biggest open risk:** Picking a problem only I have. Also for Bet A, Adobe adding a
  "teach me" mode to its assistants.

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

- **Stack or tools:** TBD after `decisions/002`. Likely a web app to start; an Adobe plugin
  would be a stretch goal for Bet A.
- **How work ships:** TBD
- **Testing and style:** AI features get an eval set in `product/evals/`.

## Working with me

- Ask before large refactors or before adding a dependency.
- When I am wrong about something technical, say so directly and explain why.
- Show me the plan before executing anything that touches more than a couple of files.

## Voice

Writing other people read (product copy, marketing, memos) sounds like: [2 or 3 adjectives,
plus one example line]
