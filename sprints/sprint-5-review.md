# Sprint 5 Review

**Window:** 2026-11-11 22:32 (the plan's first commit) to 2026-11-23 20:15, Mountain time
**Sessions reviewed:** 2,737 across 1,241 project folders (Claude Code 2,737, Codex 0; 24 sessions
excluded at your request). The folders are this repo, the panel's mentor runtime folder, and 1,239
temporary folders made by eval runs and two probes.
**Not visible to this review:** nothing reported

## Where the work lives

- **lmkirkpat/lancemk_msb341** (public, shared with sdmurff): 335 commits in the window (291 not
  counting merges), on Nov 11 (9), 12 (6), 13 (2), 14 (52), 16 (139), 17 (17), 18 (3), 19 (93) and
  23 (14). Commits on `main` locally are not yet pushed; at the start of Nov 23's housekeeping,
  `main` was 331 commits ahead of `origin`.
- **Live:** none. The AE panel installs locally.

## When you worked

Work happened on 9 of the 13 days in the window: Nov 11 (evening), 12, 13, 14, 16, 17, 18, 19 and
23. No sessions or commits on Nov 15, 20, 21 or 22. Nov 16 and Nov 19 were the largest days: 139 and
93 commits, and 1,745 and 1,251 prompts counting eval runs. Your own typed prompts were highest on
Nov 16 (39), Nov 14 (30), Nov 19 (19) and Nov 23 (18).

## Where you got stuck

1. **Loading the API key for A runs (Nov 12).** The eval runner's key came back the wrong length
   several times (55, then 66 characters, with the shell's `read -s` text inside it). You re-ran it
   three more times before it loaded, then ran the timing loop and repeats. It ended with T068 closed as
   not reproduced (1,082 timed requests, 0 stalls) and the carry-over done.
2. **The ask eval set (T037, Nov 16 to 18).** The first full B1 run scored 0 of 18, from plumbing
   and rubric problems. A second run scored 9 of 18. Seventeen lettered fixes, (a) to (q), followed
   over three days in `SKILL.md`, the tools and the rubric. It ended at 18 of 18 on B1 at
   `--repeat 3` on Nov 18, after the pass bar was changed to a majority of three runs (amendment
   (h), your decision).
3. **Going deeper from an answer (Nov 19 to 23).** On A, the phase 3 ask set scored 23 of 31 on
   Nov 23, short of 80%. In sessions 2 and 3 that night, both go-deeper hand-ins landed in lessons
   that refused the step's focus. Session 1 ran on B1 because the panel loaded before the runtime
   switch. This is still open at close (SC-013 not met). The fixes are listed in
   `discovery/usage-notes/ask-sessions.md`.

Also: four of the 14 interactive sessions ran out of context six times in all and continued from a
summary, and on
Nov 16 two sessions shared the AE lock, and one waited for the other.

## What took the most time

- **Eval runs.** 2,687 of 2,737 sessions were non-interactive (`claude -p` or the Agent SDK). Most
  were eval runs of the ask set and the six skill sets, on B1 and A. They account for most of the
  prompt volume on Nov 11 (540), Nov 16 (1,745), Nov 17 (266), Nov 18 (133) and Nov 19 (1,251).
- **Building spec 014 and spec 015 through subagents.** Interactive sessions from Nov 14 to Nov 19
  sent work to eval-engineer (21 times), skill-builder (19), spec-writer (16), panel-builder (7),
  curriculum-designer (6), design-reviewer (5), reviewer (4) and ui-designer (3). Your prompts in
  these sessions were mostly approvals and answers to open questions.
- **Live work in AE.** The baseline session (Nov 13), the expression and precomp live checks (Nov 14
  to 16), the T038 live test (Nov 19) and the three sessions (Nov 23).

Who made the choices: you proposed parking diagnosis (Nov 12), the `end_lesson` tool (Nov 19),
ruling "a light sweep" general (Nov 23), ranking an asked suggestion below a due review, keeping the
thread when a lesson starts (amendment (d)) and the majority-of-three eval bar (amendment (h)). The
teaching design's H questions, spec 014's OQ-1 to OQ-5, the plan's PQ-1 to PQ-5 and spec 015's OQ-10
were the agent's recommendations, which you accepted without a stated reason, so those are the
agent's choices.

## Builder tools you used

| Building block | What it is | What you used this sprint |
|---|---|---|
| Skills you wrote | Skills in this repo or your setup | merge-worktree (11), decision (6), usage-session (3), ease-mentor (2), claude-api (2), speckit-implement (2), speckit-plan (2), speckit-analyze (2), agent-audit (1), speckit-constitution (1) |
| Course skills | The class's skills | sprint-plan (3), sprint-review (1), sprint-coach (1) |
| Plugins | Skills or subagents from a plugin | not used |
| Slash commands | Commands run in a session | ask-mentor (288), null-parenting-mentor (278), anchor-mentor (274), offset-mentor (134), speed-graph-mentor (99), next-mentor (93), ease-mentor (85), key-types-mentor (54), clear (17), mcp (5); the mentor commands are mostly eval and panel runs |
| Hooks | Scripts that run on tool calls | ran: PreToolUse:Bash (1); blocked: PreToolUse:Bash (5), PreToolUse:Write (1), the `ae_status` hook (1) |
| Subagents | Agents a session sends work to | named: eval-engineer (21), skill-builder (19), spec-writer (16), panel-builder (7), curriculum-designer (6), design-reviewer (5), reviewer (4), ui-designer (3); built-in: none |
| Messages to other sessions | Messages sent to subagents or other sessions | a subagent (44), listed reachable sessions (2), the session "Spec 014 build" (1) |
| Plan mode | Plan tool calls and turns in plan mode | not used |
| Permission mode | Turns in each mode | `default` (2,772), `bypassPermissions` (552), `auto` (63) |
| Permission prompts and denials | Prompts answered, and calls a rule or check denied | allowed by a rule (3,752), approved at a prompt (23), approved and saved a rule (1), declined at a prompt (1) |
| Where sessions ran | Interactive or headless | non-interactive, `claude -p` or the Agent SDK (2,687); interactive in a terminal or IDE (50) |
| Worktrees | Sessions run in a git worktree | none in the scan |
| Memory and instructions | Files loaded and edited | CLAUDE.md loaded 54 times, MEMORY.md 50; edited CLAUDE.md (43), `constitution.md` (8), `push-only-when-asked.md` (1) |
| Reaching outside the repo | Service CLIs, MCP servers, direct API calls | CLIs: supabase (26), vercel (23), gh (15); MCP: ae-mentor (3,814), after-effects (91); direct API: curl (8) |

Not used this sprint: plugins, plan mode, built-in subagents, worktrees (as the scan counts them).

Scan version: 2026-10-16.

## Users this sprint

No outside users this sprint. The scan flagged 1,445 lines as user reports, and every one was an eval
judge's grading prompt, not a person.

## Learning sessions

None logged this sprint.

## Axis

**Agentic Workflow.** Most of the time went into building AI into the product (the `ask-mentor`
skill, the `give_answer` tool that enforces the hard rules, `go_deeper` hand-ins) and the eval sets
that check it, with the work sent out to eight named subagents. The teaching design, mockup and spec
014 (Design) took Nov 13 to 15, a smaller share.

## Against your plan

**Goal was:** improve how the user interacts with Knack so it feels like a mentor companion that
teaches new skills or makes suggestions for a comp when needed, not a gimmicky tutorial; also finish
the option A runtime carry-over.

The work matches the goal's direction. The home screen now opens on a question, and the mentor
answers questions about your own comps with steps. The four "done looks like" items:

- **Ask and go deeper:** partly met. Asking works in all three sessions (8 of 9 step lines followed
  without asking, 7 of 7 layers right, SC-004 and SC-005 met on A). Going deeper does not: both A
  hand-ins landed in lessons that refused the focus. Left open in the plan with a note.
- **3 sessions on 3 of your own comps:** met on Nov 23, one on B1 and two on A.
- **Option A carry-over:** met on Nov 12, with T068 changed to "not reproduced".
- **Logged on most days:** sessions or eval runs happened on 9 of 13 days. The three sessions all
  came on the last day, Nov 23. The plan had them spread from Nov 18 to 24, about every two days.

The plan's Nov 12 game plan also called for one A run of the new ask set before close. It ran on Nov
23 and scored 23 of 31.

---

## Your retro

*The builder's own answers, recorded word for word in step 7.*

**Did you hit the goal?** Yes. I met the goal. The one blocker that came up was on going deeper, which I built based on the spec, but then more errors showed up in testing. I didn't expect these bugs to show up, so I would say I met the goal as I planned it two weeks ago

**What did the report show you?** The report caught some further testing I needed to do to really prove the runtime A spec was working. It noted things that likely would have been rolled up into my next sprint anyways, but it was helpful that it explicitly denoted them. It was a good reminder to me of the analytical rigor and testing required to create a good product.

**If the plan changed, why?** The first change in the plan came because it was chasing a bug that wouldn't reproduce. I changed it to avoid wasting time on a small bug that wasn't a huge problem and didn't affect runs at all. Change 2 came because I wanted to restrict the scope to waht was feasible in the sprint window. I also saw a lot of overlap between what spec 005 and spec 015 would cover, so I wanted to prioritize spec 015, which would have a greater impact on product usabiltiy and user experience than spec 005, which could be put on the backburner and then built using insights gained from spec 015.

**Actual difficulty:** 4 is about right. This build expanded the scope of how Knack can be utilized a lot and required quite a bit of restructuring of the user story and how I planned to meet those needs.

**What will you change next sprint?** Next sprint, I want to pivot to focus more on good product design. I've been in a development bubble for the past few sprints, and I want to step back and look at what creates products worth using. I plan to accomplish this by working on another project aside from Knack that has more broad usability and can be more easily tested/iterated upon.
