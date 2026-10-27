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

---

## Run 2: Wave A code, shared pieces plus skills 2, 1 and 3 (2026-10-21)

**Goal:** the first parallel *code* run. Spec 004's shared pieces (one shared-code owner), then
the cloud part of skills 2 (speed graph, spec 008), 1 (key types, 009) and 3 (offset, 010) built
by three skill-builders at once, add-only. It serves the "one piece of work built by several
agents in parallel" done item, and three of the five baseline skills. Run from a cloud session
(no After Effects), so every 🖐 live task waits for a Mac sitting. Times are UTC, from launch
and hand-back (merge commits), not from what agents said.

**Numbers handed out:** spec 004 tasks T058–T069 (T058–T065 used). No new specs, decisions or
eval cases. Specs 008–010 kept their numbers for Spec Kit (`--number`).

**Waves:**

| Wave | Agent | Task | Worktree? | Start | Hand-back | Wall-clock | Outcome |
|---|---|---|---|---|---|---|---|
| 1 | spec-writer | Fold my approvals into 004 plan/tasks and 008–010; shared-code requests become T058–T065 | yes | 19:14 | 19:21 | 7.0 | done (`0b29dc2`). Took the designer's answers mid-run by message. Reported "about 35 minutes" |
| 1 | curriculum-designer | Key types C-1 to C-3 (Blink built eased) | no | 19:14 | 19:16 | 1.5 | done (`96e954b`). Reported "about 20 minutes" |
| 2 | skill-builder (shared owner) | Spec 004 T001–T065, everything without AE | yes | 19:22 | 19:50 | 27.9 | done (`4c2a78f`): 96 → 245 tests, 64 files, changed-files table matched exactly. Reported "about 3 hours" |
| 2 | panel-builder | `runtime.js` links every `*-mentor` skill (plan P3); then `npm test` on Node 22 | yes | 19:22 | 19:26 | 3.6 | done (`b6723fe`, `fab563f`), 82/82. One follow-up by message |
| 2 | spec-writer | Plans and tasks for 008, 009, 010 (Spec Kit) | yes | 19:23 | 19:41 | 18.0 | done: 35, 38, 40 tasks, add-only tables checked. Reported "about 2.5 hours" |
| 3 | reviewer | Read the shared code before builders build on it | yes | 20:09 | 20:12 | 3.5 | done: ready after fixes, 9 findings (1 blocking for skill 1) |
| 3 | skill-builder (shared owner) | Fix the review's findings; then update wave A's own tests | yes | 20:13 | 20:20 | 7.5 | done (`a876301`, `a69cc0e`), 274/274. Resumed once for the tests |
| 3 | skill-builder | Skill 2, speed graph, cloud part | yes | 20:09 | 20:28 | 19.2 | done (`9fd101e`): 115 tests, 33 files. Reported "about 2.5 hours" |
| 3 | skill-builder | Skill 1, key types, cloud part | yes | 20:09 | 20:26 | 17.0 | done (`0e73e3c`): 78 tests, 38 files. Reported "roughly 2.5 hours" |
| 3 | skill-builder | Skill 3, offset, cloud part | yes | 20:27 | 20:49 | 22.1 | done (`7e2ccef`): 128 tests, 45 files. Reported "roughly 2.5 hours" |
| 4 | eval-engineer | Easing eval run after wave A (004 T046) | yes | 20:58 | 22:00 | 41.3 | **20/25** (80%, just meets SC-006), $5.90, vs 25/25 on 10-19; no hard-rule failure. Repeats (3 each): 02, 03, 07 noise; 08 fails 4/4, 15 fails 3/4. Both state things no tool reports (which side of a shared key the demo eased, layer stack order). Those `SKILL.md` lines date from 10-05, so the cause isn't confirmed as wave A. About $14 with repeats (`ca9fa99`) |
| 4 | spec-writer | Fold the builders' findings and my five offset confirmations into the specs | yes | 20:58 | 21:04 | 5.7 | done (`d75beac`): 21 spec files, 5 build-vs-spec conflicts flagged for me |

At most three Opus agents at once (the README's rule from run 1). Wave 3 launched the reviewer
and two builders together; the shared fixes took the reviewer's slot and offset took the next.

**Wall-clock:** 19:14 to 20:50, 96 minutes for waves 1–3, with no usage-limit stall (run 1
stalled 80). About 2.0 M subagent tokens across 10 jobs.

**My hands-on time:** four short messages ("all are approved, start work", "approve all", "go
ahead and start cloud work now", "keep all five"). The cockpit merged 9 branches, answered
hand-backs and relayed between agents in about 30 short turns.

**Output:** 180 files changed (123 new): about 7,500 lines of code, 3,400 of specs and docs,
49,500 of JSON fixtures (mostly synthetic stand-in snapshots). Mentor tests 96 at the start of
wave A, 595 at the end, all green; panel 82/82; hooks 33/33. Four new skills:
`/speed-graph-mentor`, `/key-types-mentor`, `/offset-mentor`, `/next-mentor`.

**Solo estimate:** the shared pieces alone (65 tasks, 64 files) are a long day for me with
Claude; each skill's cloud part another day; the plans half a day. About 4–5 working days in one
session, one thing at a time. The run took 96 minutes. The catch is the same as run 1's: all of
it still has to meet After Effects, and stand-in fixtures are only as good as the build script
they were derived from.

**Guardrails:**

| Check | Count | Notes |
|---|---|---|
| Ownership hook blocks | 0 | none reported |
| Git guard blocks | 0 | none reported. In a worktree the guard allows `reset --hard`, which is how every agent rebased onto the integration branch |
| AE lock waits | 0 | no AE in a cloud container |
| Files outside the persona's row at merge (`check-branch.mjs`) | 0 real, 1 false run | The panel-builder's first check ran against `main` (the script's default base) while work lives on another branch, so it listed 14 earlier spec files. My command didn't stop on it; the merge was a fast-forward and a re-run against the right base showed 3/3 panel files. Every later merge passed the base and chained with `&&` |
| `--shared-owner` branches | 2 | both rounds of the shared owner; every skill branch was clean without it |
| Merge conflicts | 0 | |
| Two agents edited the same file | 0 at once | `specs/004-ae-curriculum/tasks.md` was edited by the spec-writer and then the shared owner, one after the other |
| Designer ↔ spec-writer question rounds | 1 | key types C-1 to C-3, relayed mid-run |

**Quality:**

| Output | Reviewer findings | Redo needed? | Better or worse than solo, and why |
|---|---|---|---|
| Shared code (spec 004) | 9: 1 blocking for skill 1 (a kept-linear mark could be written with no check, on the wrong comp), server rule 4 would have sent every skill to easing's snapshot, 6 should-fix, 2 nits | yes, 7.5 min | Better than solo on breadth and tests; the review caught what I'd have hit live. Two flagged choices were judged fine |
| Skills 2, 1, 3 (cloud parts) | not yet reviewed beyond merge checks; `/agent-audit` not available in the container | no | Each followed add-only with zero changes to shared files. All three hit the same shared test and each worked around missing AE captures the same way (stand-ins with an auto-switch) |
| Specs | spec-writer found a T042 conflict on its own, the same one the shared owner flagged | no | Two agents independently catching one conflict is a good sign the hand-offs carry context |

**What broke or surprised:**

- **A shared test that couldn't survive add-only.** `skill-module.test.mjs` asserted `SKILLS`
  was exactly `["easing.basic"]`, so every new skill failed it. All three builders reported it.
  Fixed by the cockpit (`c300cff`) to test what it meant: `index.mjs` and `common.mjs` add none.
  Rule for the shared owner next time: no shared test may enumerate the skills.
- **"No existing test edited" needed a base.** The rule protects tests from before the wave;
  wave A's own tests are fair to update when a review changes behaviour. I checked each file
  against `be9c9b1` before allowing it.
- **The worktree base is still `origin/main`.** Run 1's fix (push first) didn't apply, because
  this session pushes to a feature branch, not main. Every prompt told the agent to fetch the
  integration branch and `reset --hard` to it, and every agent did. It worked but it's a line
  every prompt must carry.
- **Agents misreport their own time, by 6–10x.** Same as run 1: "3 hours" was 28 minutes,
  "2.5 hours" was 17–22.
- **The live gate.** Spec 004 said builders start only after its full merge, including the 🖐
  tasks. I asked and started the cloud parts anyway; the shared code they depend on was merged,
  and the 🖐 tasks only add captures. It held: nothing a builder needed was missing.
- **Reviewing shared code before the builders start paid off.** Two of its findings would have
  broken skills 1 and 3 in their first live lesson. The fixes landed while builders 2 and 1 were
  mid-build; a heads-up message to each kept them aligned.

**Verdict:** worth it, and far faster than solo: 96 minutes for what I'd estimate at 4–5 days,
with zero collisions and no stall. The add-only rule and the one shared owner did their job. What
changes before wave B:

1. `check-branch.mjs` should default its base to the merge-base with the current branch, not
   `main`, or the cockpit must always pass it.
2. Shared tests must not enumerate skills.
3. A worktree base setting (or a standing prompt line) for runs off a feature branch.
4. Run the reviewer on each skill branch too, and `/agent-audit` on the Mac before evals.
5. Easing dropped from 25/25 to 20/25 after wave A (cases 08 and 15 fail on repeat). Find the
   cause before wave B: run case 08 at the pre-wave commit to separate wave A from model drift.
6. The Mac sitting is now the bottleneck: spec 004's Mentor Practice 2 build and captures first,
   then skills 2, 1, 3 in order.

---

## Run 3: Wave B, reads for skills 5 and 6, then skills 5 and 6 (2026-10-23)

**Goal:** spec 004's wave B (plan › Waves › Wave B): the second shared-owner pass (R1, R3, the
visibility class, the motion-sources map's first step, KD-001's fix), then skills 5 (set the
pivot, spec 011) and 6 (move a group with a null, spec 012) in parallel, add-only. Serves the
"5 new skills" done item (the last two of the baseline). Run from the Mac, local `main`, while
wave A's live testing waits for a sitting. Times are local (MDT), from launch and hand-back.

**Numbers handed out:** `specs/011-anchor`, `specs/012-null-parenting`; spec 004 wave B tasks
T100–T199 in `tasks-wave-b.md` (T150 onward held for the skill specs' shared-code requests). No
decisions or eval cases yet.

**Gate:** spec 004 says wave B code starts with easing at baseline. It isn't: 20/25 after wave A
(cases 08 and 15), and a second session was editing `product/evals/easing/rubric.md` when this
run started. Round 1–2 are docs only, so they go ahead; code waits for the easing result and my
approval of 011, 012 and the wave B tasks.

**Waves:**

| Wave | Agent | Task | Worktree? | Start | Hand-back | Wall-clock | Outcome |
|---|---|---|---|---|---|---|---|
| 1 | curriculum-designer | Skill 5 teaching design (`specs/011-anchor/teaching-design.md`) | no | 13:02 | 13:09 | 6.9 | done (`057b6da`, 431 lines). Adds a "rest key" pass rule beyond FR-028; asks for R3 extras (own rectangle, current time, bounds at a given time) and 3D and Collapse switches in R1. Reported "about 1.5 hours" |
| 1 | curriculum-designer | Skill 6 teaching design (`specs/012-null-parenting/teaching-design.md`) | no | 13:02 | 16:53 | ~8 active | done (`057b6da`, which already had its one-row fix). Wrote the file before the limit hit and handed back on resume. Its main read request is R3 sampled at a list of times (each child's key times), with the on-screen corner math in the server; FR-029 to say "every corner within 1 px, through the null as stored". Reported "about an hour" |
| 1 | spec-writer | Spec 004 wave B shared pass: plan detail, data model, `tasks-wave-b.md` | yes | 13:02 | | | hit the usage limit before committing; the worktree was cleaned up, so the work was lost. Restarted 16:52 and told to commit as it goes. Resumed run handed back 17:55 (6.4 min): 46 tasks (T100–T158) in 5 commits, merged `0e60cbb`, `check-branch.mjs` 5/5 spec-writer files. The git guard blocked the hard reset to `main` in a worktree (run 2 allowed it), so it cut a fresh worktree from local `main` by hand, which also fixes the stale-base problem. 5 open questions, one of them an `ownership.json` change (`tasks-*.md` for the skill-builder) left for me |
| 2 | spec-writer | Spec 011, set the pivot (`spec.md`, stop for approval) | yes, cut from local `main` | 17:57 | 18:03 | 6.9 | done (`4e1e3cd`): 30 FRs, 29 overlap rows. The audit caught two reused filters that would pass wrong work (keyed-only change detection misses an unkeyed anchor; a "can't measure" null read as "didn't move"). 1 SR, 5 H-questions, 3 back to the designer (round 1, relayed). Reported "about 45 minutes" |
| 2 | spec-writer | Spec 012, move a group with a null (`spec.md`, stop for approval) | yes, cut from local `main` | 17:57 | 18:03 | 7.0 | done (`587dbc2`): 28 FRs, 39 overlap rows. Found that adding a null renumbers layers (match by name), and that the session has nowhere for a tool to store what it measured (SR-1). 3 SRs, 5 H-questions, 2 back to the designer (round 1, relayed). Reported "about 75 minutes" |
| 2b | curriculum-designer ×2 | Round 1 answers to specs 011 (D-1 to D-3) and 012 (D-1, D-2) (resumed) | no | 18:04 | 18:05 | <1 each | done (`5381f60`, `00e9711`). Agreed with every default; widened 011 D-3 to every layer type; 012 changed the teaching in two places (the mentor asks for renames, never makes them; a null with a moving parent is refused). Disagreed with the spec writer on 012 SR-2; I chose the designer |
| 3 | spec-writer | Fold my approvals into 004 (wave B tasks), 011, 012; mark approved | yes, cut from local `main` | 19:26 | 19:34 | 7.9 | done (`0e6f870`), 9 files, `check-branch.mjs` clean. T100–T163. Caught that my prompt over-stated the designer's rule ("any parented null" vs "a moving parent") and wrote it to the design, flagged |
| 4 | skill-builder (shared owner) | `tasks-wave-b.md`, everything without AE | yes, cut from local `main` | 19:35 | 22:52 | 61 active (stalled 19:40–21:51) | done (8 commits). 40/50 tasks; mentor 597 → 697 tests (678 pass, 16 skip waiting on live captures, 3 todo); `check-branch.mjs --shared-owner` 33/33. T123 held (its gate checks 1 and 2 fail, as designed). Flagged 7 spec gaps, including three wave A `SKILL.md` lines that may call a matte "hidden". Reported "about 3.5 hours" |
| 4 | spec-writer | Plans and tasks for 011 and 012 (stop for approval) | yes, cut from local `main` | 19:35 | | | hit the usage limit while still reading; held until the shared owner hands back, so only one Opus agent runs |
| 5 | reviewer | Read `shared-owner-b` before skills 5 and 6 build on it | yes (read-only) | 22:52 | 00:57 | 125 (it reported "about 40 minutes") | ready after fixes: 1 blocking (KD-001 also drops eye-off nulls from "hidden", untested), 5 should-fix (sample times rounded before reading; no live learner-hidden layer; 2 s goal unverified; two wave A `SKILL.md` lines), 6 nits. Hand-checked the corner math on the chain fixture: clean. The git guard blocked its `git merge-base` probe |
| 5b | skill-builder (shared owner) | Fix B1, S1, S2, N5, cheap S4 (resumed) | yes | 01:09 | | | B1 committed (`de3dd58`); stopped by the usage limit about 01:30 and again about 03:30, each time mid-`snapshot.jsx` (uncommitted, but the hand-cut worktree kept it). Resumed 03:10 and 10:53; handed back 10:55: `9226cbc` (S1, S4, N5), `aaa4c02` (tests), `a801909` (S2). 706 tests, 686 pass. Early merge `d009d35` with `--shared-owner`, 33/33 files |
| 6 | spec-writer | Plans and tasks for 011 and 012, plus spec 004 doc fixes N1, N2, S5 (resumed) | yes | 10:56 | 11:33 | 37 | done (`badbcb8`, 17 files, 8 commits): 011 T201–T240 (40), 012 T301–T343 (43), both add-only. Found one shared gap (no comp width or height in the snapshot). The git guard blocked `git merge --ff-only` for a subagent too, so it cut a fresh worktree. Reported "about 2.5 hours" |
| 6b | spec-writer | Record my approvals of 011 and 012 plans and tasks; spec 004 T164–T165 | yes | 11:57 | 12:00 | 3.0 | done (`6600396`, 12 files). Extended T165 to `capture.mjs --compare` so T134 won't fail on the new fields |
| 7 | skill-builder (shared owner) | T164–T165, comp width and height | yes | 12:30 | 12:31 | 1.3 | done (`0dfebc7`), 4 files, 708 tests (688 pass). Two-line diff read by the cockpit instead of a reviewer |
| 8 | skill-builder | Skill 5, set the pivot (011 T201–T240, cloud part), add-only | yes | 12:32 | 12:55 | 22.8 | done (6 commits, 75 new files): 30/40 tasks, mentor 708 → 848 tests (828 pass), `check-branch.mjs` 75/75 without `--shared-owner`. Renamed its tool file to `transform-anchor.mjs` because `skill-module.test.mjs` assumes easing loads first (a wave A test that depends on load order). Reported "about 3 hours" |
| 9 | reviewer | Read `skill-5-anchor` before merge | yes (read-only) | 12:56 | 13:02 | 6.4 | ready after fixes: 1 blocking (merging now contradicts the branch's own plan: stand-ins in, settings still guesses, and on merge `/next-mentor` would offer an untested lesson), 6 should-fix (two failures with no hint; the prompt reads two fields the tools don't return; an unreadable other layer counts as "didn't move"; demo values only the prompt holds back; the rename not recorded), 7 nits. Hand-checked the pivot math and the per-axis floor. I chose: hold the merge until after the sitting |
| 9b | skill-builder + curriculum-designer | Skill 5 review fixes S1–S4, S6; two new hint wordings (designer) | yes / no | 13:03 | | | S2 and S3 committed, then the usage limit again about 13:20; resumed 16:35; handed back 16:36: S6 `6ffbbac`, S1 `40c78d5`, S4 `b42f56e`. 854 tests (834 pass), 75/75 add-only. Widened "in place but moved" to Scale and Rotation so every failure has a hint. Branch held for the sitting (B1) |
| 10 | skill-builder | Skill 6, null parenting (012 T301–T343, cloud part), add-only | yes | 16:37 | | | Given skill 5's review lessons in its prompt up front. Committed Phases 1–2 part 1 (`a5301c1`), then the usage limit stopped it (the sixth stall; reset 21:30); resumed 21:40. Committed Phase 2 (`eb45f1d`, `404dcf8`), then hit the weekly limit with the demo snippet uncommitted (the seventh stall, and the first weekly one). Resumed 2026-10-25 12:10 from its transcript; nothing was lost, because the worktree kept the uncommitted files |
| 11 | reviewer | Review `skill-6-null` | — | 15:46 | 15:53 | 7 min | 1 blocker (B1: a review ends at step 2), S1–S6, 6 nits. Confirmed L-6: the 2% link rule chains the practice comp's wave A layers together. Verdict: ready to hold after B1 |
| 12 | curriculum-designer | Rework skill 6's group-proposal rule (H-4, L-6); the user chose this over moving layers | — | 17:54 | 18:00 | 6 min | Groups of 2–4, crowds of 5+ never proposed, text-plus-graphic first; proposes Tile, Caption and Stamp (worked by hand). Wrote into the skill 6 worktree instead of main; the cockpit moved it to main (`002bf92`). The user approved the rule, L6-1 and L6-2 |
| 13 | skill-builder | Skill 6 review fixes (B1, S1–S3, S5, tests, `SKILL.md` nits), in parallel with 12 | yes | 17:54 | 17:57 | 3 min | One commit (`5c9de8c`, +144/−22). 894 tests, 873 pass, 0 fail. A new missing test showed a real offset under a moving visible parent had been hidden by the visible-parent hint; it now reports a jump |
| 14 | spec-writer | Spec 012: FR-005 new rule, data-model S6 gaps, new `tasks-l6.md` (T350+) so the branch's `tasks.md` ticks don't conflict | — | 19:12 | 19:21 | 9 min | Amendment 1 (`45f4920`): FR-005 rule, FR-005a, finder exception (L6-2), S6 gaps, `tasks-l6.md` T350–T362. Raised H-6; the user approved the amendment and accepted H-6 with a spec 004 request (`17bcdc6`). The cockpit merged main into `skill-6-null` (`417819d`) so the builder has the spec |
| 15 | skill-builder | Skill 6: amendment 1, T350–T362 | yes | 23:34 | 23:37 | 3 min | Tests first, red on purpose (`363d88e`), then code and prompt (`c72bd97`). Proposes Tile, Caption and Stamp, then Chip A–C; wave A is a crowd of 13. 906 tests, 886 pass, 0 fail. The audit dropped a "top right" example the tool never reads |
| 16 | reviewer | Scoped review of amendment 1 (`417819d..c72bd97`) | — | 23:38 | 23:41 | 3 min (it reported ~25) | Ready to hold: no blockers, no should-fix, 3 nits. Found no weakened tests: the answer key was compared key by key, and the old "past 4" test was replaced rather than loosened. Nits: "at the top right" is still in FR-005a, TD § 4 and T358; the review's second-group wording; the answer-key re-indent. The 3-minute build held up under review |
| 17 | cockpit | Review nits 1 and 2: the spec's proposal example names no position (`d574b8a`); a review never offers a second group (`239f73e`). Nit 3 (answer-key re-indent) left as is | — | 23:56 | 23:56 | 2 min | Done by hand; too small to send out |
| 18 | eval-engineer | Skill 6 eval set (HO-1) on stand-ins: dry-run plus a 2–3 case smoke run, under $3; full baseline after the sitting | `evals-skill-6` (from `skill-6-null`) | 23:56 | 00:09 | 13 min | 26 cases (`d04b8bd`), dry-run clean. Smoke run: 6 runs for $1.99; 3 check bugs fixed, 1 real finding (case 01 run 3 proposed in the same message as the question; SKILL.md step 1 needs "ask and stop"). Full run estimated at $13–17. Gate passed, so the queue moved to step 1 |
| 19 | eval-engineer | Queued overnight, after the skill 6 set checks out: wave A sets (specs 008, 009, 010), then skill 5 (011). Dry-runs plus small smoke runs, about $3 per skill | `evals-wave-a` (from main), `evals-skill-5` (from `skill-5-anchor`), cut 00:01 | 00:09 | 00:41 | 45 min (it reported ~3 h) | Four sets, all dry-run green with `--strict-sources`: speed-graph 18 cases, key-types 19, offset 24 (`evals-wave-a`), anchor 25 (`evals-skill-5`). Smoke runs $12.61 (anchor $0.18 over its cap; noted in its README). Real findings: a leaked review self-note before the first tool call in key-types, offset and anchor; anchor's demo claimed "opposite directions". Skill 6 plus these four: $14.60 overnight. No baselines. Ran with no permission stops and no usage-limit stalls |

**Usage-limit stall:** about 13:10 to 16:50 (3 h 40 min). Three Opus agents at once, the README's
cap, still used up the window, and this time a worktree agent lost uncommitted work when its
worktree was cleaned up. Next time, worktree agents commit as they go, and a run started late in
a window gets two agents, not three.

**Second usage-limit stall:** about 19:40 to 21:50. Two Opus agents, both still reading, ran out the window that had just reset at 16:50 (it covered rounds 1–3 too). After this, one Opus agent at a time on this plan, critical path first.

**Third and fourth stalls:** about 01:30 to 03:10 and 03:30 to 10:53. One Opus agent alone on the fix round still ran the window out twice. Overnight, nobody resumes at reset time, so a stall lasts until the next cockpit turn, not until the reset.

**The other session's easing work landed** (`23b37e9`, committed by the cockpit on request): the 20/25 was the judge, not wave A; new easing baseline 24/25. So wave A didn't regress easing, and spec 004's gate is met for wave B.

**Guard false positive (cockpit):** the git guard matched the hard-reset command's text inside a
heredoc that only wrote these notes. It blocks by string, not by what runs. Harmless, but worth a
note in `decisions/008`'s signals.

**Fifth to seventh stalls:** about 13:20 to 16:35 on 10-24 (skill 5's fix round), about 17:30
to 21:40 (skill 6's build), and the weekly limit from about 23:00 on 10-24 to 12:10 on 10-25
(skill 6, demo snippet uncommitted). All with one Opus agent running. Nothing was lost after the
first stall, because the hand-cut worktrees kept uncommitted files and agents committed by phase.

**Wall-clock:** 10-23 13:02 to 10-26 00:41, about 60 hours on the calendar. About 35 of them were
the seven usage-limit stalls, and most of the rest was waiting on me (approvals, overnight, the
L-6 choice). Agent time, summed from launch and hand-back, is about 13 hours across 24 jobs. 5.5
of those are skill 6's build, spread over three windows, so read that figure as "time open", not
time working. The critical path was one agent at a time from the second stall on, so this run
was close to serial.

**My hands-on time:** not timed. Nine decisions: approve wave B tasks and specs 011 and 012
(10-23 19:26); side with the designer on 012 SR-2; approve the plans and tasks (10-24 12:29);
approve the comp-size request; hold skill 5's merge until the sitting; redesign skill 6's
proposal rule rather than move layers; approve the L-6 rule; approve amendment 1 and H-6; queue
the overnight evals. Each was a short message; the cockpit did the prompting, merging and these
notes (153 commits from 10-23 to 10-26).

**Output:** wave B's shared reads (40 of 50 tasks, 33 files); two teaching designs; specs 011
and 012 with plans and 83 tasks; skill 5 (75 new files, held on `skill-5-anchor`); skill 6 (84
files, merged in `31fe72d` after its live lessons); five eval sets on stand-ins (112 cases,
$14.60 of smoke runs). Mentor tests 597 at the start, 906 on `skill-6-null` at hand-back, every
one passing or skipped waiting on a live capture.

**Solo estimate:** about 5 to 6 working days. Wave B's shared pass is a day; each skill is a day
and a half with its spec, plan and review fixes; the five eval sets another day. Run 2 did a
similar load in 96 minutes. This run took 60 hours, mainly because of the usage limit, not the
agents: without the stalls and the overnight waits it would have been one to two working days.
Parallel work still saved days, but on this plan the limit, not coordination, sets the pace.

**Guardrails:**

| Check | Count | Notes |
|---|---|---|
| Ownership hook blocks | 0 | none reported |
| Git guard blocks | 3 real, 1 false | Blocked: a spec writer's hard reset to `main` in a worktree, the reviewer's `git merge-base` read, a spec writer's `git merge --ff-only`. Each agent worked around it by cutting a fresh worktree or reading the main tree. The guard didn't change between runs (`.claude/hooks/` has no commit from 10-20 to 10-26). It picks its rules from the agent's working folder, not the repo the command touches, so the same reset passes when run from inside the worktree (run 2) and is blocked when run from the main tree with `-C` or `cd` (most likely run 3). The other way round is a hole: a subagent sitting in a worktree can hard-reset the main tree (probed 2026-10-26). False: the cockpit's heredoc above |
| AE lock waits | 0 | no AE in the build. The lock's gap showed up later, in offset's live lesson (two sessions on AE, fixed in `35acf9c`) |
| Files outside the persona's row at merge (`check-branch.mjs`) | 0 | Clean on every branch: spec writer 5/5 and 9/9, shared owner 33/33 with `--shared-owner`, skill 5 75/75 without it, skill 6 84 files with no shared file touched (SC-008). One file landed in the wrong *tree*, not the wrong row: the designer wrote the L-6 rule into the skill 6 worktree, and the cockpit moved it to main (`002bf92`) |
| `--shared-owner` branches | 2 | `shared-owner-b` and `shared-owner-b2` |
| Merge conflicts | 0 | 15 merges, including `main` into `skill-6-null` twice so the builder saw spec changes |
| Two agents edited the same file | 0 at once | Waves 12 and 13 ran side by side on skill 6 (designer on the teaching design, builder on code) without touching the same file |
| Designer ↔ spec-writer question rounds | 1 each for 011 and 012, plus 012's amendment | 5 questions in round 1, under a minute each. One disagreement (012 SR-2), settled by me. The amendment was a redesign after review, not a back-and-forth, so the 007 signal (more than two rounds) didn't fire |
| Usage-limit stalls | 7 (6 window, 1 weekly) | Work lost once, in the first. The biggest cost of the run |

**Quality** (written 2026-10-26, after both skills' first live lessons):

| Output | Reviewer findings | Redo needed? | Better or worse than solo, and why |
|---|---|---|---|
| Teaching designs 011, 012 | none from a reviewer; 5 designer questions in round 1 | 012's group-proposal rule (wave 12, 6 min) | Mixed. Round 1 changed 012's teaching in two places for the better. But the first proposal rule (the 2% link) chained wave A's 13 layers into one group; the skill 6 reviewer caught it from the live comp's data, not the designer |
| Wave B shared code | 1 blocking (KD-001 also dropped eye-off nulls from "hidden"), 5 should, 6 nits | yes, the 5b fix round | Better than solo: the reviewer hand-checked the corner math and caught B1, which no test covered. Live, the sitting still found what no desk agent could: rotation without auto-orient, the pick whip rewriting raw Position keys |
| Specs 011, 012 | none from a reviewer; overlap audits by the spec writer | 011 amended five times (T241 to T258), mostly from the sitting | The audits caught two reused filters that would have passed wrong work (011) and predicted the null renumbering the sitting then confirmed (012). The amendments are AE facts (Pan Behind on a shape group, keyed Position can't pass), the cost of speccing before the sitting, not of parallel work |
| Skill 5 (`skill-5-anchor`) | 1 blocking (merge would ship stand-ins and an untested lesson in `/next-mentor`), 6 should, 7 nits | yes, S1 to S6 | Live: Door and Pop both passed, SC-002 4 of 4, no wrong verdict. Problems were speed (10 to 12 s snapshot, App Nap), a watch offer that comes only by chance, and a mistake shape no fixture covered |
| Skill 6 (`skill-6-null`) | 1 blocking (a review ended at step 2), S1 to S6, 6 nits; amendment 1's review: 3 nits | yes, 3 min; amendment 1, 3 min | Live: both sessions passed, SC-002 8 of 8 plus 2 of 2 deliberate jumps. The fix round's new test found a real bug (a visible-parent hint hiding an offset). Live problems were the check not returning the null's key times and one wrong sentence in the record |
| Eval sets (4 skills, stand-ins) | smoke runs only | 3 check bugs in the harness | Found three real prompt problems before any baseline: a review self-note leaking before the first tool call (key types, offset, pivot: three builders, same mistake), the pivot demo's "opposite directions", and skill 6 step 1 not stopping after its question |

**What broke or surprised:**

- **The usage limit set the pace.** Three Opus agents at once ran out the window in about 10
  minutes; after the second stall, one at a time still did it five more times. This run was
  parallel in its plan but mostly serial in practice. Staggering waves isn't enough on this plan;
  a run with this much code needs Sonnet for anything that isn't building, or a bigger plan.
- **Hand-cut worktrees beat the tool's.** The git guard blocked the reset-to-`main` move run 2
  used (see Guardrails: same guard, different working folder), so agents cut their own worktrees
  from local `main`. That fixed run 1's stale-base problem for good, and those worktrees kept
  uncommitted files through every later stall.
- **The git guard judges by working folder, and that cuts both ways.** Probed 2026-10-26 with
  five payloads: a subagent can reset its own worktree from inside it, can't reset it from the
  main tree with `git -C`, *can* reset the main tree from inside a worktree (with `git -C` or
  `cd`), and can't run `git merge-base`, a read. The hole is the one that matters: the shared
  tree is the thing the guard exists to protect. **Fixed the same day** (`decisions/008`,
  amendment "the git guard judges where git acts"): shared-tree rules now follow the folder each
  git call acts on, relax only for the agent's own worktree, and treat "can't tell" as shared.
  Testing the fix also found that any git option before the subcommand (`--no-pager`) hid it from
  every rule; that's closed too.
- **Holding a branch is a real option.** Skill 5's reviewer said merging would put an untested
  lesson in `/next-mentor`. Holding it until the sitting meant the cockpit merges `main` into the
  branch for every spec change, which is extra merges, but nothing a learner could open was
  untested.
- **Reviews scoped to a commit range are cheap.** Amendment 1's review (`417819d..c72bd97`)
  took 3 minutes and checked the answer key key by key. A full review took 6 to 7.
- **The reviewer's 125 minutes on the shared code** is launch to hand-back across a quiet stretch,
  not 2 hours of reading; it said "about 40". Neither number is exact, so read time from commits.
- **Agents still misreport their time**, by about the same 6 to 10× as runs 1 and 2 ("about 3
  hours" for a 23-minute skill 5 build).
- **Passing review lessons forward didn't visibly cut findings.** Skill 6's builder got skill 5's
  review findings in its first prompt, and its review still came back with one blocker and six
  should-fix, the same as skill 5's.

**Verdict:** worth it for quality, much less so for time. Ownership held again: zero blocks,
zero conflicts, every branch clean. Both skills passed their live lessons with no wrong verdict
(see the cross-run section below). But seven stalls turned one to two days of work into 60 hours on
the calendar, and from the second stall on, the run was one agent at a time. What changes for
the next run:

1. **Size the run to the plan.** On this plan, one Opus builder at a time, with researchers,
   reviewers and eval runs on Sonnet; or plan around reset times.
2. **Cut worktrees from local `main` by hand**, and commit by phase. Make it the standing prompt
   line, since the tool's worktree option still starts from `origin/main`.
3. **The sitting first**, before the desk build (see the cross-run section).
4. **Scoped reviews** for amendments and fix rounds: the commit range only.

---

## Quality across the runs: parallel vs. solo (2026-10-26)

Sprint 3's done item asks for quality next to building alone. Time is covered per run above
(run 1: about 56 active minutes for 2 to 3 days' work; run 2: 96 minutes for 4 to 5 days). This
section asks the harder question: was the work any good once it met After Effects?

### What the live lessons say

All five skills built in parallel have now run live on my comps, on Mentor Practice and Mentor
Practice 2 (usage notes `speed-graph.md`, `key-types.md`, `offset.md`, `anchor.md` on
`skill-5-anchor`, `null-parenting.md`).

| Skill | Built in | Reviewer pass before live? | Live lessons | Check agreed with my look | Wrong verdicts |
|---|---|---|---|---|---|
| Speed graph (008) | run 2 | no | 1, passed | 4 of 4 | 0 |
| Key types (009) | run 2 | no | 1, passed | 4 of 4 | 0 |
| Offset (010) | run 2 | no | 2, passed | 4 of 4 | 0 |
| Set the pivot (011) | run 3 | yes, 1 blocking | 2, passed | 4 of 4 | 0 |
| Null (012) | run 3 | yes, 1 blocking, plus a scoped one | 2, passed | 8 of 8, plus 2 of 2 deliberate jumps | 0 |

**24 of 24 live verdicts matched what I saw in After Effects, plus both deliberate jumps.** Every
first lesson passed with at most one demo, inside SC-001's time. The part that has to be right
(the check) was right every time. Builder-only: I was the learner, I built the comps, and I knew
the answers, so this is evidence about the checks, not about teaching (belief 7).

### What the live lessons found, sorted by cause

1. **AE facts no desk agent could know** (most of them). Pan Behind on a shape's group is
   invisible to the snapshot, and with Position keyed it changes one key, so those layers can't
   pass; the pick whip rewrites raw Position keys; rotation reads miss auto-orient; App Nap makes
   a background AE about 5× slower. Solo would hit every one of these too. Parallel made them land
   later and cost more: the desk work ran ahead of the sitting, so spec 011 was amended five times
   after it.
2. **Showing, not checking.** Frames on a busy comp don't show which shape is the focus (key
   types, null, pivot); the null check returns no key times, so the pass can't show the group
   move; a frame number as a reading answer isn't covered. These are spec gaps, and solo would
   have them too.
3. **Prompt wording and honesty.** The pivot's watch offer comes only by chance; the mentor made up
   a Quick Offset claim; the null record said the group turned when it only slid; a gap the learner
   changes without saying isn't said back. The same kind of finding the easing slice had, built
   solo (`easing-slice.md`), so not a parallel cost.
4. **Created by parallel work itself** (the real cost). Two sessions drove AE at once during
   offset's first lesson (fixed in `35acf9c`, the lock now keys on session plus agent). Three
   lessons ran on an MCP server older than that day's merges, because merges land in the tree
   while the running server keeps old code. The designer wrote the L-6 rule into the skill 6
   worktree instead of main. My own prompt over-stated the designer's rule, and the spec writer
   caught it. None of these changed a verdict, but each cost a re-check or a note.

### Better than solo

- **Every check was reviewed by someone who didn't build it.** Solo, I'd have skipped review, as
  run 1 found. The reviewers found four blocking issues across the runs (the kept-linear mark,
  KD-001's eye-off nulls, skill 5's merge, skill 6's step 2) plus the 2% link rule, and each
  would have shown up as a failed or wrong live lesson.
- **Overlap audits from a separate spec writer** caught reused filters that would have passed
  wrong work, before any code.
- **The split between designer and spec writer paid off every round.** Run 1's two pass margins
  that would have taught the wrong thing, and 012's two teaching changes, came from that hand-off.
- **Tests.** Mentor tests went from 96 to 927 across the sprint, written alongside the code by the
  builder that wrote it, with a reviewer checking that none were loosened.

### Worse than solo

- **One mistake, copied by every builder.** Three builders leaked the same review self-note, and
  in wave A all three hit the same shared test. Parallel builders start from the same template
  and the same skill, so a defect in that starting point lands on every branch at once. Fix it in
  the template, then send it to every branch, not one at a time.
- **Stand-ins drift from the live comp.** Desk-built fixtures and four eval sets were built before
  the sitting; key types and offset's stand-ins had to be re-derived from the live base, and the
  pivot and null sets still need moving to live captures before a baseline.
- **Context lost at hand-offs.** A worktree on a stale base, a file written in the wrong tree, a
  rule paraphrased wrong by me. Solo carries all of that in one head.
- **Wave A skipped the reviewer.** Skills 2, 1 and 3 merged on merge checks only. They still
  passed live, and the reviewed skills 5 and 6 had just as many live problems. Two skills each
  way is too few to say whether the reviewer pass changes what a live lesson finds.

### Verdict on quality

Parallel work didn't cost correctness: no wrong verdict in 24 live checks, every first lesson
passed, and the reviews caught four blockers and a bad proposal rule I'd have shipped alone. It cost **rework and
re-checks**: most of it from building ahead of the AE sitting, and a smaller share from
coordination (two sessions on AE, a stale server, files in the wrong tree). For the next project:

1. **Sitting before desk build** for anything that reads a host app: capture first, then spec and
   build on the real captures, not stand-ins.
2. **Fix the template before fanning out.** When one builder hits a defect in shared starting
   material, stop the others and fix it once.
3. **A reviewer on every branch**, including the "small" ones; it's 3 to 7 minutes each.
4. **Restart the MCP server after any merge into `mentor/`** before a live lesson (now in
   CLAUDE.md), and check the AE lock first.
