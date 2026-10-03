# [Product name TBD]: AI creative mentor

> An AI mentor that teaches creative professionals and students creative software inside
> their own projects, starting with After Effects, and remembers what they've learned so
> the skills stick.

**Where to see it:** In progress: the easing test slice (`specs/002-easing-slice`), built as an
After Effects bridge (`bridge/`) plus an MCP mentor server (`mentor/`). Not yet tested live;
run it with `specs/002-easing-slice/quickstart.md`. Product description: `product/product-description.md`.
**Built by:** Lance Kirkpatrick, MSB 341 Product Management, BYU

## Context

Fill this in during Sprint 1 and keep it current. Every sprint is read against it.

- **My role:** Solo builder, working the beginning of the product stack: product discovery and
spec development, building features, designing flows and interfaces, and testing, plus GTM
strategy. Want to bring operational efficiency (agent workflows/automations) into how I work.
Not expecting to spend much time on pricing/business model or analytics given the current
project scope, but that could change.
- **What I am working on:** An AI creative mentor: a teaching layer that leads the teaching,
remembers what the user has learned across sessions, and builds practice so skills stick,
inside the user's own project. After Effects first, designed so other apps can be added.
See `product/product-description.md` and `decisions/002`.
- **Who it is for:** Creative professionals and students who work in Adobe Creative Cloud,
starting with solo or in-house designers like me (design role at a university department).
- **Who uses my work:** Same as the customer segment above. I'm also user #1 and test on
myself weekly.

**What changed (2026-09-21):** Dropped the student school-work-life balance direction and a
later student-club-operations idea, and narrowed to creative workflows. See
`decisions/001-narrow-to-creative-workflows.md`.

**What changed (2026-09-28):** Chose Bet A, the AI creative mentor, and dropped Bet B (the
creative-operations copilot) without testing it. Repositioned Bet A after finding that
Adobe's After Effects assistant already teaches when asked. See
`decisions/002-choose-bet-a-ai-creative-mentor.md`.

If your situation changes, revise this and note what changed. That is normal; a silent
mismatch between this file and your work is not.

## What is in this repo

| Folder | What lives here |
|---|---|
| `sprints/` | One plan and one review per sprint |
| `discovery/` | Interviews, personas, what you learned about your user |
| `design/` | Flows, screens, usability test notes |
| `product/` | The work itself: code, a pricing model, a copy deck, an automation |
| `specs/` | One spec per piece of work, written before you make it |
| `gtm/` | Launch, channels, copy, experiments |
| `metrics/` | What you measure and what it says |
| `decisions/` | Numbered records of what you decided and why |

Not everyone in this course ships software. An interview, a pricing model, a landing page
draft, and a usability finding are all artifacts, and they get committed like anything else.
Use the folders that fit your role and ignore the rest.

If you build an AI feature, put its eval set in `product/evals/`. A test set is how you know
whether a change to a prompt helped or hurt.

## Running it

[If your work includes code: how to run it locally. Delete this section if it does not.]

## Sprints

Each sprint:

```bash
/sprint-plan # day one, then commit the plan
# ...do the work...
/sprint-review # last day, then commit the report and write your retro
```

## Ground rules

- **Spec before work.** For anything non-trivial, the spec's commit should predate the
work's commits.
- **Decisions get recorded.** When you make a real choice, write it in `decisions/` with the
alternatives you rejected.
- **No real customer contact details anywhere in this repo.** Anonymize people in interview
notes: "dental office manager, Provo" rather than a name and an email.
- **Keep `CLAUDE.md` current.** It is what your agent knows about your work. Stale context
produces bad output.
