# Decision 004: Use GitHub Spec Kit for build specs, and keep the light template for non-code specs

**Date:** 2026-09-29
**Status:** Accepted, 2026-09-29

## Context

Building starts this sprint with the easing slice, following `decisions/003`. Until now, specs
used one light template (`specs/000-spec-template.md`: problem, what we're making, out of
scope, definition of done). That works for a test like spec 001, but a build needs more: user
stories, a technical plan checked against past decisions, and a task list an agent can work
through. GitHub's Spec Kit (`specify-cli` 1.0.13) provides that as Claude Code skills.

Spec Kit numbers specs by counting folders in `specs/`. Our existing specs were flat files, so
it couldn't see them and would have reused 001.

## Options considered

1. **Spec Kit for everything.** Pros: one system. Cons: its template assumes software (user
   stories, test-first tasks) and is heavy for an interview test or a pricing experiment.
2. **Spec Kit for build work, the light template for non-code specs, both in numbered
   folders.** Pros: build work gets planning and tasks, non-code work stays light, and
   numbering stays in one sequence. Cons: two templates, so CLAUDE.md has to say which to use.
3. **Keep only the light template.** Pros: nothing new to learn or install. Cons: no
   structured plan or task list, and no automatic check against decisions before building.

Numbering: spec 001 was moved to `specs/001-ae-mcp-bridge-test/spec.md`. The rejected
alternative was an empty placeholder folder to reserve 001, which would have left two layouts
in the repo.

## Decision

**Option 2.** The deciding reason: the next few sprints are mostly building, and Spec Kit's
plan step checks each plan against a constitution that contains our rules, including decision
003's thin pipe and narrow tools. That's the check most likely to be skipped by a solo builder
moving fast.

Setup: `uv` (Homebrew) and `specify-cli` installed as machine-wide tools, not project
dependencies. Spec Kit files are in `.specify/` and `.claude/skills/speckit-*`. The
constitution is filled in from CLAUDE.md. Git branch creation is off, since the optional git
extension isn't installed.

## What would change our mind

- **Overhead:** if writing specs through Spec Kit takes longer than building the slice it
  describes, or if I start skipping `/speckit-plan`, go back to the light template for small
  builds.
- **Tool changes:** if a Spec Kit upgrade breaks the folder layout or starts making branches
  by default, pin the version or drop it.
