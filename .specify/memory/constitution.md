# AI Creative Mentor Constitution

## Core Principles

### I. Spec Before Build

Anything non-trivial MUST have a spec in `specs/` before work starts. If no spec exists, one is
drafted and confirmed with the builder first. Build work uses Spec Kit
(`specs/NNN-name/spec.md`, `plan.md`, `tasks.md`). Non-code specs (tests, campaigns, pricing)
use the lighter `specs/000-spec-template.md`, saved as `specs/NNN-name/spec.md` so numbering
stays in one sequence.

**Rationale:** the spec is where scope and "out of scope" get decided. Writing it after the
work turns it into documentation instead of a decision.

### II. Decisions Are Recorded

Meaningful choices MUST get a numbered record in `decisions/`, written when the choice is made,
covering the options rejected and what would change our mind. Plans MUST respect active
decisions. In particular, `decisions/003` requires:

- The piece inside After Effects is a thin pipe with no teaching logic.
- The mentor uses narrow, tested MCP tools, with no open-ended script execution in the product.
- The mentor and the learner record live outside After Effects.

A plan that conflicts with an active decision MUST either change or propose a new decision
that supersedes it.

**Rationale:** a solo builder has no teammate to remember why a path was rejected.

### III. Teaching Quality Is Evaluated

Every AI feature MUST have an eval set in `product/evals/`. Evals MUST test whether the mentor
teaches well (leads, adapts to what the learner knows, builds practice), not only whether its
answers are correct.

**Rationale:** correctness alone puts the product level with Adobe's free assistant. Teaching
quality is the claimed difference and has to be measured.

### IV. Privacy by Default

Real names, emails, and phone numbers MUST NOT be committed to this repo. Interview notes,
usability findings, and user data MUST be anonymized.

**Rationale:** the repo holds research about real people and may be shared.

### V. Simplicity and Checkpoints

- Ask before large refactors or before adding a dependency.
- Show the plan before executing anything that touches more than a couple of files.
- Commit only when asked. Never push without being asked.
- Prefer the smallest thing that tests the current risk over building ahead.

**Rationale:** the biggest open risk is whether the product is worth using at all, so effort
goes to reaching that test, and the builder stays in control of the repo.

## Work in the Repo

- Non-code work (interviews, experiments, pricing models, usability findings) is committed as
  files, the same as code.
- Sprint plans and reviews live in `sprints/`. The plan is committed on day one of the sprint.
- `CLAUDE.md` holds current state and working context. It is kept current as work progresses.

## Spec Workflow

- Build work: `/speckit-specify` → optional `/speckit-clarify` → `/speckit-plan` →
  `/speckit-tasks` → optional `/speckit-analyze` → `/speckit-implement`.
- Non-code work: copy `specs/000-spec-template.md` into the next numbered folder.
- Each plan's constitution check MUST confirm Principles I–V, and list any active decision the
  plan depends on.

## Governance

This constitution sets the rules. `CLAUDE.md` is the day-to-day guidance file. If the two
conflict, both are updated in the same change so they agree again. Amendments are made by
editing this file, bumping the version (MAJOR: a principle removed or redefined; MINOR: a
principle or section added or materially expanded; PATCH: wording), and updating the dates
below. Every Spec Kit plan checks compliance before tasks are generated.

**Version**: 1.0.0 | **Ratified**: 2026-09-29 | **Last Amended**: 2026-09-29
