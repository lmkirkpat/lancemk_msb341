---
name: merge-worktree
description: From the cockpit, merge a finished agent's branch into main and clean up - checks every changed file against the agent's ownership row and the numbers the cockpit handed out, merges one branch at a time, stops on conflicts instead of guessing, prunes the worktree, and never pushes. Use when the user says "merge the <name> branch", "integrate <name>", "bring in the skill-builder's work", "merge all the worktrees", or after a builder hands back a branch.
---

# Merge a worktree (cockpit only)

Modeled on agent-team-kit's `merge-worktree`, plus the merge-time checks from `decisions/008`.
Agents commit on their own branches and never merge; this is where their work joins `main`.

## Input

A branch name and the persona that made it (for example `skill-x skill-builder`), or "all".
If unsure what exists, run `git worktree list`.

## Steps

1. **Check you're the cockpit, on a clean tree.**
   - `git rev-parse --abbrev-ref HEAD` is `main`, and `git rev-parse --git-dir` equals
     `git rev-parse --git-common-dir` (not inside a worktree). If not, stop.
   - `git status --short` is empty. If not, stop and ask: never sweep other changes into a merge.
   - The agent is done: its worktree has no uncommitted changes. If it has some, say so rather
     than merging a stale snapshot.

2. **Check ownership.** `node .claude/hooks/check-branch.mjs <branch> <persona>`. It lists every
   file the branch changed that the persona doesn't own, which catches writes made through Bash
   that the ownership hook can't see. If it lists any, stop and show them; a file outside the
   persona's row goes back to its owner. Exceptions are the human's call, not yours.

3. **Check numbers.** `git diff --name-only --diff-filter=A main...<branch>` lists new files.
   Any new numbered file (`specs/NNN-*`, `decisions/NNN-*`, `discovery/interviews/NNN-*`, eval
   cases `NN-*.json`) must use the number the cockpit gave this agent, and must not already
   exist on `main`. A clash means renumber before merging.

4. **Run the tests the branch touches.** `cd mentor && npm test` for `mentor/`, `cd panel && npm
   test` for `panel/`, `node --test .claude/hooks/test/` for hooks. Report the real output.

5. **Merge.** `git merge --no-edit <branch>`.
   - On a conflict, stop. Show `git diff --name-only --diff-filter=U`, say what overlapped, and
     resolve only with the human's intent. Never guess. A conflict also means two agents touched
     one file: note it for the `decisions/007` signal.
   - For several branches, merge one at a time and re-run steps 2-4 for each, since each merge
     changes `main` for the next.

6. **Clean up.** `git worktree remove <path>` if the folder is still there, `git worktree prune`,
   and `git branch -d <branch>`. If `-d` refuses, the branch isn't fully merged: find out why;
   never `-D`.

7. **Report, don't push.** What merged, test results, any check that stopped you, and that it's
   on `main` locally. Push only when the human asks.
