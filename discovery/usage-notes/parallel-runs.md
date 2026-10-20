# Parallel runs: time and quality

Sprint 3's "done" needs at least one piece of work built by several agents in parallel, with
notes on time and quality compared with building it alone. One section per run, filled in
**while the run happens**, not after. The signals in `decisions/007` and `decisions/008` are
checked against these notes.

## Template

### Run N: <what was built> (YYYY-MM-DD)

**Goal:** what the run had to produce, and which "done looks like" item it serves.

**Numbers handed out:** specs, decisions, eval cases (so collisions can be checked).

**Waves:**

| Wave | Agent | Task | Worktree? | Start | Hand-back | Wall-clock | Outcome |
|---|---|---|---|---|---|---|---|
| 1 | persona | one line | yes/no | HH:MM | HH:MM | min | done / blocked / redo |

**My hands-on time:** minutes I spent prompting, reading hand-backs, answering questions and
merging (not waiting).

**Solo estimate:** how long the same work would have taken me in one session, and why.

**Guardrails:**

| Check | Count | Notes |
|---|---|---|
| Ownership hook blocks | | which agent, which file, was the block right? |
| Git guard blocks | | |
| AE lock waits | | |
| Files outside the persona's row at merge (`check-branch.mjs`) | | |
| Merge conflicts | | which file; does the ownership table need a fix? |
| Two agents edited the same file | | `decisions/007` signal |
| Designer ↔ spec-writer question rounds | | `decisions/007` signal: more than two means merge them |

**Quality:**

| Output | Reviewer findings | Redo needed? | Better or worse than solo, and why |
|---|---|---|---|
| | | | |

**What broke or surprised:** hand-backs that needed more context, agents that stopped early,
prompts that should change.

**Verdict:** faster or slower than solo, worth it or not, and what changes before the next run.

---

## Run 1: Sprint 3 specs and curriculum research (2026-10-20)

**Goal:** the four Sprint 3 specs (curriculum, diagnosis, installer, UI overhaul) and the
research the curriculum stands on. Mostly docs, so the first run tests coordination before the
riskier parallel code run on shared `mentor/` and `SKILL.md`.

**Numbers handed out:** `specs/004-ae-curriculum`, `specs/005-diagnosis`,
`specs/006-installer`, `specs/007-ui-overhaul`. No decisions or eval cases.

**Waves (planned):**

1. In parallel: `curriculum-researcher` ×4 (skill groups A–D), `user-researcher` (diagnosis
   evidence), `ui-designer` (UI overhaul mockups), `spec-writer` (installer spec 006, worktree).
2. After wave 1: `curriculum-designer` (`specs/004-ae-curriculum/curriculum.md`),
   `design-reviewer` (UI mockups), `spec-writer` (diagnosis spec 005, worktree).
3. After wave 2: `spec-writer` (curriculum spec 004 and UI overhaul spec 007, worktrees).

Each spec stops at `spec.md` for my approval before plan and tasks.

**Waves (actual):**

| Wave | Agent | Task | Worktree? | Start | Hand-back | Wall-clock | Outcome |
|---|---|---|---|---|---|---|---|
| 1 | curriculum-researcher | Group A: keyframes, timing, motion paths | no | 16:28 | | | |
| 1 | curriculum-researcher | Group B: graph editor, anchor point, parenting and nulls | no | 16:28 | | | |
| 1 | curriculum-researcher | Group C: shape layers, masks, mattes, text animators | no | 16:28 | | | |
| 1 | curriculum-researcher | Group D: precomps, effects, expressions basics, export | no | 16:28 | | | |
| 1 | user-researcher | Evidence brief for the diagnosis spec | no | 16:28 | 16:30 | 1.5 | done: `discovery/diagnosis-evidence.md`; belief 1's diagnosis half is Low, and 007's line may be Weak, not Said (left for `/insights-review`) |
| 1 | ui-designer | UI overhaul flows and mockups | no | 16:28 | | | |
| 1 | spec-writer | Installer spec (006) | yes | 16:28 | | | |
| 2 | spec-writer | Diagnosis spec (005), from the evidence brief | yes | 16:32 | | | |

**My hands-on time:**

**Solo estimate:**

**Guardrails:** (fill in as the run goes)

**Quality:**

**What broke or surprised:**

- **Two cockpits, one tree.** A second session of mine was amending `decisions/008` and
  `.claude/hooks/` (16:27–16:30) while this run started. The ownership hook only covers
  subagents, so nothing stops two cockpits from editing the same file. No collision this time
  (this run doesn't touch those files), but it's a gap the 007 table doesn't cover.
- **Worktrees start from the last commit.** The diagnosis spec-writer's worktree couldn't see the
  uncommitted evidence brief, so I passed it the absolute path in the main tree. Either commit
  wave outputs before the next wave starts, or keep handing over paths.

**Verdict:**
