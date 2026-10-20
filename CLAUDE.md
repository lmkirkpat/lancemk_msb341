# CLAUDE.md

Loaded at the start of every Claude Code session in this repo. Keep it current. It should let
a brand new session act like a colleague who already knows what you are working on and why.

## What I am working on

- **My role:** Solo builder: discovery, specs, building, design, testing, and GTM. Want to use
  agent workflows and automations in how I work. Low priority: pricing and analytics.
- **What it is:** **Knack** (`decisions/006`), an AI creative mentor (`decisions/002`,
  `product/product-description.md`).
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

- **This sprint's goal:** Sprint 3 (`sprints/sprint-3-plan.md`, 2026-10-13 to 2026-10-26):
  build a team of subagents with personas I can reuse on future projects, so building,
  curriculum, and evals can run in parallel. Use them to build 10 new After Effects teaching
  skills beyond easing (each run as a live lesson on my comp, with eval cases). Use them to write
  specs for the expanded curriculum, diagnostic tools, an installer, and a UI overhaul.
  Done also needs a setup README so someone else can copy the agents, proof they carry over
  (used to build my portfolio website), and one piece of work built by several agents in
  parallel, with notes on time and quality. The aim is to build faster now that the idea is
  validated and the MVP works.
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
  - **Eval set** (`product/evals/easing/`, now 25 cases, about $12 per full run, no AE needed;
    latest 25/25 on 2026-10-12, the new baseline after the agent audit): first baseline 14/16, then 15/16 (94%) after `SKILL.md` fixes. SC-006 (≥ 80%) passes. Every
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
  - Interviews: 3 of 3 target-market interviews done (`discovery/interviews/006`–`008`).
    007 (student, After Effects class) found the biggest time sink was finding what broke, not
    finding the instructions. 008 (freelance web and graphic designer, 2026-10-12) got stuck on
    help written for older app versions, left Photoshop's in-app AI for ChatGPT when it failed,
    and keeps no notes, only old project files (open question 1's first evidence; new belief 16).
  - **2026-10-08:** T046 passed (quickstart §1–§7 live: a–f in 3.7 min, one demo), and T027
    passed (evals 24/24, $8.92). T047's SC-007 note: I didn't reach for Adobe's assistant in
    6 sessions. A side-by-side on Mentor Practice
    (`discovery/usage-notes/adobe-assistant-2026-10-08.md`) found it doesn't lead, does the
    work when asked, and can't read easing, but it diagnosed the comp better (8 causes across
    layers). Logged in `discovery/insights.md` (beliefs 1, 7, 10, 15) and `decisions/002`.
  - **Positioning (2026-10-08):** Adobe's lead is breadth (many skills plus diagnosis). The
    plan is to close it in sprint 3 (more skills, then diagnosis and recommended paths), so
    what tells the mentor apart is depth, restraint, and a focus on teaching, plus memory and
    practice.
  - **Agent audit (2026-10-12):** the two small fixes from `discovery/usage-notes/mentor-panel.md`
    › To fix later (unreadable `learner.json`, "Must call diff first.") are done, plus:
    `record_lesson` checks results against the session, an empty focus can't pass, and the panel
    and evals run the mentor from a runtime folder outside the repo (`panel/lib/runtime.js`), so
    this file and my memory never reach a learner.
  - **Spec 003 shipped 2026-10-12:** continue a lesson (T028–T030), edge cases 10/10 (T033), and
    T034 (SC-004 36/36 turns ≤ 10 s, $0.38 per lesson; SC-008: the panel's check list next to the
    comp made it easier to follow, and I didn't reach for Adobe's assistant). Builder-only
    evidence, so it needs a target-market learner before it counts for belief 7.
  - **Sprint 2 closed 2026-10-12** (`sprints/sprint-2-review.md`): every "done looks like" item
    checked. Axis tags so far: Discovery (sprint 1) and AI Systems (sprint 2). Not yet touched:
    Agentic Workflow, Design, Application Architecture, and Launch and Learn (I need 5 of 6).
  - **Agent team drafted (2026-10-19, `decisions/007`):** ten personas in `.claude/agents/`, each
    owning its own files, with the main session as the cockpit. Started from
    `ai-foundry-byu/agent-team-kit`, which handles keeping agents from colliding but has no
    personas (`discovery/agent-team-kit-assessment.md`). Not yet run in parallel or audited.
- **Next steps:**
  1. Sprint 3, agent team. Still to do: run `/agent-audit` on the personas; decide which kit
     pieces to adopt (`decisions/008`), together with an After Effects lock hook (only one agent
     drives AE at a time) and the rule that the cockpit hands out spec, decision and eval
     numbers; split `mentor/tools.mjs` per skill before the parallel build; write the setup
     README; a template for the parallel-run notes on time and quality. Then the curriculum
     spec, which decides the 10 skills, before building them. Run `/overlap-audit` for each new
     skill (see "Edge cases where concepts overlap" below). Parallel agents share `SKILL.md`,
     the eval set, and `mentor/`, so isolate them (for example, worktrees).
  2. Carry these two caveats into the diagnosis and curriculum specs (from the 2026-10-08 Adobe
     side-by-side):
     - Diagnosis is its own capability, not the last step of adding skills. Adobe's answer
       came from reading the whole comp (equal durations, stacked parent motion, dead time),
       which per-skill, per-pair checks won't produce. Give it its own spec, and consider a
       light "what's wrong here" opening early, since belief 1 and interview 007 say finding
       what broke is the biggest pain.
     - Restraint and a teaching focus are product choices Adobe could copy with a mode switch
       (the `decisions/002` trigger). The harder-to-copy parts are depth (per-pair checks Adobe
       can't do today) and memory and practice across sessions. Keep those in each spec's "why".
  3. Gaps 008 left for the next interviews: learn vs. done (section 5), which Adobe AI people
     mean (generative fill vs. the assistant), whether steps match their version (belief 16),
     and referrals. A target-market learner on the panel is still needed for belief 7.
  4. After Nov 2026, re-run the spec 001 table against the AE UXP beta.
- **Where to see it:** Run `/ease-mentor` in Claude Code from this repo, with AE open on
  `discovery/Claude AE Tutor Test.aep` (the Mentor Practice comp). Setup and checks are in
  `specs/002-easing-slice/quickstart.md`. Panel: `bash panel/install.sh`, restart AE, and
  follow `specs/003-mentor-panel/quickstart.md`. Evals: `node product/evals/easing/run.mjs`
  (see its README).
- **Biggest open risk:** that leading, memory, and practice aren't worth more to people than
  Adobe's free assistant used on request. Also: learners may not pay (belief 12), people take
  the result over the lesson in practice (belief 7), and Adobe could add a teaching mode. The
  2026-10-08 side-by-side made that last one look closer: restraint and leading are product
  choices, and Adobe already has most of the pieces.

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
  - **Teaching specs** have two files: the curriculum designer's `teaching-design.md` (what is
    taught; `curriculum.md` for the curriculum spec) and the spec writer's `spec.md`, which
    links to it rather than copying it (`decisions/007`).
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
  - `.claude/agents/`: the agent team (`decisions/007`). Each persona owns its own files (the
    table in 007), and anyone checking work (reviewer, design-reviewer, eval-engineer) never
    edits what it checks. The main session is the cockpit: it sends work out, assigns numbers,
    and merges. Project details are in each persona's "In this repo" section, so copying an
    agent to another project means rewriting that section.
- **How work ships:** TBD
- **Testing and style:** AI features get an eval set in `product/evals/`.
- **Edge cases where concepts overlap:** when adding a teaching skill, list in its spec where
  AE concepts overlap (expressions over keys, single and hold keys, separated dimensions,
  effects, precomps, hidden layers) and test what the check sees for each. A rule that's right
  for teaching can hide changes from checking (`discovery/usage-notes/mentor-panel.md` › Edge
  cases to plan for).

## Working with me

- Ask before large refactors or before adding a dependency.
- When I am wrong about something technical, say so directly and explain why.
- Show me the plan before executing anything that touches more than a couple of files.

## Voice

Writing other people read (product copy, marketing, memos) sounds like: warm, playful, and
encouraging, like a friend a few steps ahead of you in the studio. Use creative-tool language,
and poke fun at the struggle, never at the learner. Example line: "Undo the tutorial spiral."
This is for product copy and marketing only. The mentor's in-lesson voice lives in `SKILL.md`
and is covered by the eval set.
