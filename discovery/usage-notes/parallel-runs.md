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
| 1 | curriculum-researcher | Group A: keyframes, timing, motion paths | no | 16:28 | 16:32 | 3.8 | done: 4 briefs (`fb7c962`). Agent reported "about 25 minutes"; the harness measured 3.8, so time agents by hand-back, not by what they say |
| 1 | curriculum-researcher | Group B: graph editor, anchor point, parenting and nulls | no | 16:28 | 16:33 | 4.3 | done: 3 briefs (`4eb8ddd`). Reported "about 40 minutes". Quick Set Anchor is still beta at 26.5: belief 16 inside my own test setup |
| 1 | curriculum-researcher | Group C: shape layers, masks, mattes, text animators | no | 16:28 | 16:33 | 4.6 | done: 4 briefs (`c889d08`). Reported "45 to 60 minutes". A correct track matte hides its matte layer, so a hidden-layer check misreads every matte |
| 1 | curriculum-researcher | Group D: precomps, effects, expressions basics, export | no | 16:28 | 16:32 | 3.9 | done: 4 briefs (`75313f5`). helpx.adobe.com returned 403 to every fetch (group A too), so Adobe claims rest on search excerpts |
| 1 | user-researcher | Evidence brief for the diagnosis spec | no | 16:28 | 16:30 | 1.5 | done: `discovery/diagnosis-evidence.md`; belief 1's diagnosis half is Low, and 007's line may be Weak, not Said (left for `/insights-review`) |
| 1 | ui-designer | UI overhaul flows and mockups | no | 16:28 | 16:38 | 9.9 | done: clickable `index.html` (37 states) plus README (`90a132a`); recommends option A, path-first. Never opened in a browser (no shell); the cockpit checked that the script parses and that there are no external refs. Reported "about 1.5 hours" |
| 1 | spec-writer | Installer spec (006) | yes | 16:28 | 16:33 | 5.1 | done: branch `worktree-agent-aea15d2ef802ee561` (`4a36dd0`), spec.md plus a checklist, 5 open questions. Reported "about 40 minutes". Not merged: waits for my approval |
| 2 | spec-writer | Diagnosis spec (005), from the evidence brief | yes | 16:32 | 16:37 | 6.0 | done: branch `worktree-agent-a4ba74721dd169ee2` (`2123f4c`), 5 open questions. Checked the brief against `mentor/` and narrowed it: 5 of Adobe's 8 findings are already in the snapshot data, just not analyzed. Found two briefs wrong about what's read. Asks for a diagnosis `teaching-design.md`. Not merged: waits for my approval |
| 2 | curriculum-designer | `specs/004-ae-curriculum/curriculum.md` from the 15 briefs | no | 16:35 | 18:25 | ~26 active (stalled 16:41–18:00) | done: 10 skills in order (`0f21faf`, 658 lines). Split the "what's moving it" idea: diagnosis tells, skill 4 teaches tracing. Rejected two researcher merges (anchor into parenting; graph editor into two). Build first: 2, 1, 3 (no new AE reads). Found a live defect: easing would skip a moving matte as "hidden" |
| 3 | spec-writer | Curriculum spec (004), linking `curriculum.md` | yes (stale base; given main-tree paths) | 18:27 | 18:32 | 6.1 | done: branch `worktree-agent-a986df89e15527a06` (`32d5802`), 6 stories, build waves A/B/C with what ships after each, KD-001 (matte defect) logged. 5 questions back to the designer (C1–C5): round 1 of the 007 signal. Recommends wave A (skills 2, 1, 3) as the sprint floor. Found an ownership gap: two skill-builders at once have no owner for shared `mentor/` code |
| 2 | design-reviewer | Review of the UI overhaul mockup | no | 16:40 | 18:24 | ~25 active (stalled 16:41–18:00) | done: "one more pass, diagnosis screens only". 6 blocking (8 findings shown flat where spec 005 allows 3; ask findings stated as fact; US4 findings shown as if read; 5 spec 005 states with no screen; remembered diagnosis shown as current; the panel-needs list incomplete), 10 should-fix, 6 nice. Would still pick A, for dependency and cost reasons, not evidence |
| 2b | ui-designer | Revision pass on the review's findings (resumed with context) | no | 18:25 | 18:34 | 9.4 | done: revision 2 (`4ae487c`). All 6 blocking, 10 should and 4 nice fixed; 4 gaps named with reasons. Rewrote the HTML whole (1392 lines). Still not opened in a browser; the cockpit re-checked that the script parses. Reported "about 1.25 hours" |
| 3 | spec-writer | UI overhaul spec (007), from mockup rev 2 and drafts 004/005/006 | yes (stale base; given main-tree paths) | 18:36 | 18:44 | 8.6 | done: branch `worktree-agent-af3960255f7e0be6c` (`3932c39`), 7 stories, FR-001–081, PN-01–16 with a "who changes what" table, RQ-01–14. Computed the contrast ratios. Found that the PN items built under specs 004 and 005 have to be passed to those specs before their plans start |
| 3 | curriculum-designer | Round 1 answers to spec-writer's C1–C5 (resumed) | no | 18:36 | 18:37 | 1.5 | done (`fba7d8b`). 4 answers change the spec: FR-027 time floor, FR-028 and FR-029 would have taught the wrong thing (a per-axis anchor region; comp-space positions for parenting), and a narrower C5 hand-off. The designer also caught the same FR-029 mistake in its own first draft |
| 3 | spec-writer | Apply round 1 answers to spec 004 (resumed) | yes | 18:38 | 18:40 | 2.8 | done (`cfd9f64`): 9 FRs changed plus new FR-037, eval plan extended. Raised 3 new conflicts (Q1–Q3) as questions with defaults written in, not a round 2. The cockpit is holding them for me rather than sending them to the designer, so the round count stays at 1 |

**Wall-clock:** 16:28 to 18:44, 2 h 16 min, of which about 80 min was the usage-limit stall, so
about 56 min of active run time. 15 agent jobs (10 launches plus 5 resumes), at most 7 at once.

**My hands-on time:** two messages ("go ahead", "commit as they land"). The cockpit (main
session) did the prompting, committing, logging and relaying: roughly 20 short turns. My review of
the four specs and the mockup is still ahead and isn't counted here.

**Solo estimate:** 15 research briefs, a 658-line curriculum, a 37-state clickable mockup with a
review and a revision, and four specs of 500–700 lines each. In one session, one thing at a time,
this is about 2–3 working days for me with Claude, mostly because research and specs would
run one after another and the reviews wouldn't happen at all. The parallel run did it in under an
hour of active time. The catch: the depth of *checking* (spec 005 checking the brief against
the code, the design review, round 1 catching two wrong margins) came from the hand-offs, and
each hand-off depends on me to approve, which hasn't happened yet.

**Ownership at merge** (`check-branch.mjs`, 18:44): all four spec branches hold only
spec-writer files (2 each). Main-tree outputs were committed by the cockpit by name, one hand-off
at a time.

**Guardrails:** (fill in as the run goes)

| Check | Count | Notes |
|---|---|---|
| Ownership hook blocks | 0 | |
| Git guard blocks | 1 | Diagnosis spec-writer tried to fast-forward its stale worktree to main; blocked, correctly. It worked around it by reading the main tree |
| AE lock waits | 0 | No agent in this run touches AE |
| Two agents edited the same file | 0 | |
| Designer ↔ spec-writer question rounds | 1 (spec 004) | 5 questions, answered in 1.5 min. Two pass margins would have taught the wrong thing, so the split between teaching design and spec paid off here: the spec-writer set numbers, the designer checked what they teach |

**Quality:**

| Output | Reviewer findings | Redo needed? | Better or worse than solo, and why |
|---|---|---|---|
| UI overhaul mockup | 6 blocking, 10 should, 6 nice | yes, diagnosis screens | Mixed. Breadth (37 states, flows, accessibility) beyond what I'd draw solo in an evening. But it was built in parallel with spec 005, so it couldn't follow a spec that didn't exist yet: every blocking finding is a mismatch with 005. That's an ordering cost, not a quality problem: design that depends on a spec should start after it |

**What broke or surprised:**

- **Parallel work against a spec that didn't exist yet.** The mockup and spec 005 ran at the same
  time, and the review's 6 blocking findings are all mismatches between them. The review step
  caught them cheaply, but next time, start a design after the spec it shows.

- **Two cockpits, one tree.** A second session of mine was amending `decisions/008` and
  `.claude/hooks/` (16:27–16:30) while this run started. The ownership hook only covers
  subagents, so nothing stops two cockpits from editing the same file. No collision this time
  (this run doesn't touch those files), but it's a gap the 007 table doesn't cover.
- **Worktrees start from `origin/main`, not local `main`.** Both spec-writer worktrees were cut
  at `47726cd`, 17 unpushed commits behind: no `decisions/007`/`008`, no `mentor/tools/` split,
  none of this run's commits. So committing as outputs land (started 16:33) does *not* reach a
  worktree; only pushing does, or pointing agents at main-tree paths. The installer spec only
  adds a folder, so it's unharmed. The diagnosis writer was told by message (16:36) to read
  `mentor/tools/` and the briefs from the main tree. Fix before the code run: push first, or find
  a worktree base setting; a builder on a stale `mentor/` would merge against code it never saw.
- **Agents misreport their own time.** The four researchers said 25, 25–30, 40 and 45–60
  minutes; the harness measured 3.8–4.6. Wall-clock in this table comes from launch and
  hand-back times only.
- **The researchers converged without coordinating.** All four groups proposed an early "what's
  animating or hidden here?" skill and treating the new reads as shared infrastructure. Parallel
  research that agrees independently is stronger evidence than one researcher saying it.
- **The run hit the plan's usage limit at about 16:41.** Nine Opus-heavy agents in about 13
  minutes used up the session window. The curriculum designer and the design reviewer both
  stopped mid-task. The limit reset at 17:30, and both were resumed from where they stopped at
  18:00 (by message, not restarted), so no work was lost, but the run's wall-clock now includes a
  ~80-minute stall. Parallel runs spend the limit faster in proportion. Before the code run:
  stagger the waves, or move the researchers (3 of 10 personas already run on Sonnet) and
  reviewers to Sonnet.
- **helpx.adobe.com returned 403 to every fetch** (all four groups), so official Adobe claims
  rest on search excerpts. A gap in the researcher's tools, not its prompt.

**Verdict:** worth it for docs work, and much faster than solo. Ownership held: zero blocks,
zero collisions, every branch clean at merge. The guardrails were never the bottleneck. The
real costs were in the setup *around* the agents:

1. **Stale worktree base** (`origin/main`, 17+ commits behind). Worked around with main-tree
   paths for specs, but it would break a code run. Fix before the code run: push first, or
   find a base-ref setting.
2. **The usage limit.** Nine Opus agents in 13 minutes ran it out. Stagger the waves, or move
   researchers and reviewers to Sonnet.
3. **Ordering.** The mockup ran at the same time as the spec it had to show, so every blocking
   review finding was a mismatch with it. Start a design after the spec it depends on.
4. **Two cockpits in one tree** aren't covered by the ownership hook.
5. **The 4 specs depend on each other** (007's PN items land in 004 and 005; 005's open question
   2 conflicts with 007's Home A), so approving them means approving them together.

Before the parallel *code* run: fix 1 and 2, name one owner for shared `mentor/` code
(spec 004 FR-032), and re-run the identity probe.
