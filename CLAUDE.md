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
  Effects skill, and run 3 target-market interviews. **Raised 2026-10-05:** also a rudimentary
  mentor panel inside AE that runs one easing lesson start to finish and shows memory.
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
  - Architecture decided (`decisions/003`): a thin AE pipe (forked CEP bridge), the mentor as
    an MCP server with narrow tools run from Claude, and the learner record in local files.
  - Spec Kit set up for build specs (`decisions/004`).
  - **Easing slice built** (`specs/002-easing-slice/`, Phases 1–5 done): the forked bridge
    (`bridge/`), the `ae-mentor` MCP server (`mentor/`), the `/ease-mentor` skill
    ("I do, we do, you do": the mentor eases one pair, the learner eases the rest), and the
    learner record. Usage sessions are in `discovery/usage-notes/easing-slice.md`.
  - **Eval set** (`product/evals/easing/`, 16 cases, about $5 per full run, no AE needed):
    baseline 14/16, then 15/16 (94%) after `SKILL.md` fixes. SC-006 (≥ 80%) passes. Every
    hard-rule check passed; the failures were about wording and honesty in the learner record.
  - **Panel decided** (`decisions/005`, amends 003): the AE panel drives headless Claude Code
    (`claude -p --resume`), so it reuses the skill and server unchanged and the evals stay valid.
    Prototype only; shipping to others needs the direct API (option A). Mockup in
    `product/mockups/ae-panel.md`.
  - Spec 002 T033 (memory check) passed SC-005.
  - **Panel built** (`specs/003-mentor-panel/`, `panel/`: T001–T026, T031–T032): the lesson
    chat, the stage indicator, the path, and a read-only memory section. Panel session 1
    (2026-10-05/06, `discovery/usage-notes/mentor-panel.md`) found 3 teaching problems at
    steps c, d, and f: half-eased pairs read as linear, a one-pair focus let the demo take the
    whole lesson, and the output style leaked into headless runs. All fixed 2026-10-06: the
    `partly_eased` state, no demo when the focus has one pair, the demo fingerprint, and
    `outputStyle: default`. Eval cases 21–24 were added; the new baseline is 23/24.
  - Interviews: 2 of 3 target-market interviews done (`discovery/interviews/006`, `007`), 1 booked.
    007 (student, After Effects class) found the biggest time sink was finding what broke, not
    finding the instructions.
- **Next steps:**
  1. Panel: T017 passed in session 2 (2026-10-07: a–f clean, 5.5 min, $0.51, one quirk logged
     in `discovery/usage-notes/mentor-panel.md` › To fix later). T023 passed 2026-10-07, and the
     panel's check matched `diff_since_last` from the terminal. Next: T027 (confirm the eval
     run meets SC-007). SC-002: 10 checks, 9 agree. Check 9 missed an edit outside
     the focus (To fix later): find out why before the panel counts as trustworthy.
  2. Run the last booked interview (`008`). Ask about Adobe's assistant, who pays, and
     whether memory and practice matter, before pitching
     (`discovery/interviews/bet-a-interview-guide.md`).
  3. Spec 002 leftovers: T046 (live quickstart §2–§7) and T047 (the SC-007 note after 3 real
     sessions; panel lessons count: did I reach for this or Adobe's assistant?).
  4. Not needed for sprint 2: spec 003 T028–T030 (continue a lesson), T033–T036.
  5. After Nov 2026, re-run the spec 001 table against the AE UXP beta.
- **Where to see it:** Run `/ease-mentor` in Claude Code from this repo, with AE open on
  `discovery/Claude AE Tutor Test.aep` (the Mentor Practice comp). Setup and checks are in
  `specs/002-easing-slice/quickstart.md`. Panel: `bash panel/install.sh`, restart AE, and
  follow `specs/003-mentor-panel/quickstart.md`. Evals: `node product/evals/easing/run.mjs`
  (see its README).
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

- **Stack or tools:** `decisions/003`, amended by `decisions/005`:
  - `bridge/`: a forked CEP bridge (thin pipe into AE, no teaching logic). Changes from upstream
    are in `bridge/UPSTREAM.md`. CEP is retired, so expect a UXP rebuild after Nov 2026.
  - `mentor/`: a Node MCP server (`ae-mentor`, registered in `.mcp.json`) with six narrow tools.
    Node built-ins only. Unit tests: `cd mentor && npm test`.
  - `.claude/skills/ease-mentor/SKILL.md`: the teaching itself, run by Claude Code.
  - Learner record: local JSON files in `~/Library/Application Support/AEMentor/` (or
    `AE_MENTOR_HOME`, which tests and evals set to a temp folder), never in the repo.
  - `panel/`: the CEP panel, which spawns headless Claude Code (`decisions/005`, option B1)
    and only displays. Its tests are in `panel/test/`.
- **How work ships:** TBD
- **Testing and style:** AI features get an eval set in `product/evals/`.

## Working with me

- Ask before large refactors or before adding a dependency.
- When I am wrong about something technical, say so directly and explain why.
- Show me the plan before executing anything that touches more than a couple of files.

## Voice

Writing other people read (product copy, marketing, memos) sounds like: [2 or 3 adjectives,
plus one example line]
