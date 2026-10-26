# Agent carry-over: Operation Food Critic (and the portfolio site)

**Date:** 2026-10-26
**Serves:** Sprint 3 "done looks like" › "Proof the agents carry over" (`sprints/sprint-3-plan.md`).
The plan named the portfolio website; the carry-over actually happened on a new personal project,
Operation Food Critic (`../Operation Food Critic`), set up and tested on 2026-10-26.
**Sources:** that repo's `decisions/001-agent-team-and-workflow-setup.md`,
`discovery/usage-notes/parallel-runs.md` (run 1), `.claude/` and git history (`211dd88` to
`f101796`). Times come from commits and the run log, not from what agents said about themselves.

## Summary

Operation Food Critic is an app for rating restaurants and dishes and putting the "places to
try" lists from Notes, Notion, Instagram and Pinterest in one place. It's a solo learning project
whose main goal is building an app end to end with an agent team.

- **The kit and workflow came over almost whole.** I had a session read this repo's agents, keep
  the ones that apply, change them, and add new ones. Ownership, the git guard,
  `check-branch.mjs`, the identity probe and their tests, `/merge-worktree`, Spec Kit, and the
  cockpit pattern were all copied.
- **The roster went from ten personas to seven.** Five were kept and adapted, two were merged
  into one, one came from the portfolio site, and three were dropped. The roles are the part
  that had to change; the pattern of owners and read-only checkers didn't.
- **The first parallel run worked.** Two researchers did competitor and alternatives research in
  parallel, with no collisions and no guardrail blocks. The work took about 4 minutes of
  wall-clock time and about 5 minutes of my hands-on time, against a solo estimate of 1 to 2
  hours.
- **Setup took about 30 minutes.** The repo was set up at 13:05, the probe passed at 13:10, and
  the run was logged at 13:35, all on the same day.

## Persona mapping (Knack → Operation Food Critic)

| Knack | Operation Food Critic | Change and why |
|---|---|---|
| `user-researcher` | `user-researcher` | Kept; competitor focus moved to Beli |
| `spec-writer` | `spec-writer` | Kept |
| `ui-designer` | `ui-designer` | Kept; checks against the platform's conventions instead of the AE panel's |
| `design-reviewer` | `design-reviewer` | Kept, read-only |
| `reviewer` | `reviewer` | Kept, read-only |
| `skill-builder` + `panel-builder` | `app-builder` (new) | Merged: there's one code area (`product/`), not a mentor and a panel |
| none (from the portfolio site) | `qa-auditor` | A tool-measured "is it done?" gate (build, lint, tests, Lighthouse, screen widths, keyboard); an app's "done" can be measured by tools |
| `eval-engineer` | none yet | `product/evals/` stays outside app-builder's ownership for a future eval engineer |
| `curriculum-designer`, `curriculum-researcher` | Dropped | Specific to teaching After Effects |

## What came over from this repo and the kit

| Piece | Came over? | Notes |
|---|---|---|
| Ownership hook + `ownership.json` | Yes | New rows for the seven personas; checkers own nothing |
| Git guard, `check-branch.mjs`, hook tests | Yes | As is |
| Identity probe (`decisions/008`) | Yes | Re-run on Claude Code 2.1.310: passed, $0.42. Subagent calls still carry `agent_type`/`agent_id` and share the cockpit's `session_id` |
| AE lock, ExtendScript guard | No | No shared app to lock |
| `/merge-worktree`, numbers handed out by the cockpit | Yes | |
| Spec Kit (`decisions/004`) | Yes | `specify init` v1.0.13 |
| Sprint and learning skills | Yes | Renamed to `plan-sprint` and `review-sprint` |
| agent-team-kit pieces | Some | Kept: main by default, worktree mode for unattended fan-out, `mockup`, the working-discipline section, about a dozen web memory items. Held until the stack is chosen: `dev-port`, schema lock, `pre-push`, size and import guards, release skills. Skipped: `spec`/`build-spec`, the launchers that skip permissions, team memory |

One new lesson came out of the setup: `origin` pointed at the course template repo, and the
Agent tool cuts worktrees from `origin/main`, so worktrees would have started from the template.
It was fixed before the first run: a private repo is now `origin`, and the template is a
fetch-only remote. Any project cloned from a template has the same trap.

## Parallel run 1: competitor research (2026-10-26)

Logged in full in that repo's `discovery/usage-notes/parallel-runs.md`.

| Agent | Task | Start | Hand-back | Outcome |
|---|---|---|---|---|
| user-researcher (A, Sonnet) | Beli desk research and the side-by-side script | 13:30 | 13:33 | done |
| user-researcher (B, Sonnet) | What each saved-places source can export, plus alternatives | 13:30 | 13:35 | done |

- **Design:** two copies of one persona working on separate files. Neither edited
  `insights.md`; the cockpit merged the beliefs they proposed.
- **Guardrails:** 0 ownership blocks, 0 git guard blocks, 0 files outside the persona's
  ownership, 0 shared-file edits.
- **Quality:** both labelled their sources honestly (some claims rest on secondary sources
  because vendor help pages wouldn't load), and both found on their own that import is the gap
  and place lookup is the hard step. All of it is still Hunch-level until I run the Beli script
  myself. The work wasn't reviewed.
- **Compared with Knack's runs:** this was the easiest kind of run: documents only, two agents,
  no shared code. That matches Knack run 1 (specs and research first). The real test of the
  team is the first run with shared code, as in Knack run 2.

## Earlier evidence: the portfolio site (2026-10-12 to 10-19)

The portfolio's agents came before Knack's team, so they don't show carry-over. They do show the
same pattern working in a different stack: three personas (`case-study-editor` and read-only
`design-reviewer` and `qa-auditor`), and spec → approve → build → review → I merge. Nine specs
shipped, in PRs #10 to #23. Its `qa-auditor` is the persona that later moved into Operation Food
Critic.

## What this shows

- **Roles depend on the project; the pattern doesn't.** Across three projects, the parts that
  stayed the same were one owner per file, checkers that can't edit, gated specs, and the
  cockpit handing out numbers. The roster changed every time. The setup README should say so:
  copy the hooks and the pattern, then rebuild the roster.
- **Personas can move between projects.** Knack's personas and the portfolio's `qa-auditor`
  were combined in a new project, so the agents work as a library, not a fixed team.
- **Copying with a model is quick.** Having a session read the source repo, choose, adapt and
  write a decision took about 30 minutes, including the probe.

## Open

- The Food Critic run was documents only. Whether the team holds up on shared code there waits
  for its stack decision (that repo's `decisions/001` › "Stack decision lands").
- Food Critic's `decisions/001` cites this note by its old name (`portfolio-carry-over.md`) and
  describes the portfolio as a carry-over. Update that line there.
