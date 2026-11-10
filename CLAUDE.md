# CLAUDE.md

Loaded at the start of every Claude Code session in this repo. Keep it current. It should let
a brand new session act like a colleague who already knows what you are working on and why.

## What I am working on

- **My role:** Solo builder: discovery, specs, building, design, testing, and GTM. Want to use
  agent workflows and automations in how I work. Low priority: pricing and analytics.
- **What it is:** **Knack** (`decisions/006`; the 2026-11-09 name check found live KNACK marks in
  education software, so keep it for the prototype and get a clearance search before a public launch),
  an AI creative mentor (`decisions/002`,
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
  curriculum, and evals can run in parallel. Use them to build 5 new After Effects teaching
  skills beyond easing as the baseline (key types, speed graph, offset, set the pivot, move a
  group with a null; cut from 10 on 2026-10-20 for quality), each run as a live lesson on my comp,
  with eval cases. Use them to write
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
  - **Eval set** (`product/evals/easing/`, now 26 cases, about $12 per full run, no AE needed;
    latest 25/26 on 2026-10-28 under the pacing rules; 25/25 on 2026-10-19 after the
    `mentor/tools/` split; 25/25 on
    2026-10-12 after the agent audit): first baseline 14/16, then 15/16 (94%) after `SKILL.md` fixes. SC-006 (≥ 80%) passes. Every
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
    personas (`discovery/agent-team-kit-assessment.md`).
  - **Agent audit and guardrails (2026-10-19):** `/agent-audit` on the personas found 10 issues;
    the prompt fixes are in (skill-builder lost `record_lesson`, Spec Kit gets the cockpit's
    `--number`, subagents hand back instead of asking). `decisions/008`: our own hooks, keyed
    on which agent is calling (hooks get `agent_type` and `agent_id`; subagents share the
    cockpit's `session_id`, so the kit's locks can't tell them apart), plus the kit's
    `merge-worktree` and worktree mode. Built the same day: `.claude/hooks/` (AE lock, ownership,
    git guard, `check-branch.mjs`; 24 tests) and `/merge-worktree`. Ownership and the git guard
    were checked live in a headless run; the AE lock too on 2026-10-19 (a subagent got AE and
    released it on stop, a second was blocked while the cockpit held it). The cockpit never
    stops, so it stays off AE while a builder needs it.
  - **Specs (2026-10-20 to 10-24):** curriculum (`specs/004`, with `curriculum.md`), diagnosis
    (005), installer (006) and UI overhaul (007) approved. **Spec 005 (2026-11-09):** plan and 56 tasks
    approved (`9285e03`): three read-only tools on the existing reads, a `/diagnose-mentor` skill with no demo
    tool, and memory saved by the tools. US4 (parents and switches) comes right after the first version (US1,
    US2, US5); only US3 (memory) waits for the hidden-fault session. **Next:** T001 (the curriculum designer's
    teaching design, which gates the wording) and T002 (rebuild Diagnosis Practice with the cursor fading).
    **Spec 006 status (2026-11-09):** plan and 61 tasks; Phase 1 done (T001 to T016): T004's gate passed
    (signed extensions load with debug mode off), the installer is built (`installer/`) and a test zip is
    staged. **SC-002 passed 2026-11-09 (T017 to T020):** three new accounts (two standard, one admin, Apple silicon) on the zip from `50c581a`, each `all_working: true` with no Keychain dialog; no Intel Mac, so a Rosetta stand-in ran (partial); `discovery/usage-notes/installer-sc002.md`. The first try failed on two bugs that tests on fake payloads missed (`b45eea8`, `50c581a`). The shared key file is deleted. **To fix:** the setup check lists each AE version twice, and the install swallows its error (log it to a file). T045 is held on Q2 (testers' keys). T046 is done (the name kept for now; see `decisions/006`). **Next:** T061 (reconcile the spec with T004 and T017) and the US2 tasks.
    Spec 007's plan and 80 tasks were approved 2026-11-04; its mockup matches.
    **Spec 007 status (2026-11-09):** phases 0 to 5 are built and merged, practice included (T063 to T070, merge
    `dc6eab2`; panel tests 605 pass). T001 and T028 (the comparison) passed: the builder prefers the new panel. All
    six skills ran a live lesson in it on B1 (T028, T056 to T060), so sprint 4's first "done" item is ticked; logs in
    `discovery/usage-notes/ui-overhaul.md`. SC-002's live half is met (16 checks, all matching AE, and Proposed
    openings 3 of 3: easing's miss was a resume of an unfinished lesson, which FR-092 keeps unproposed).
    T062 passed: ten states clean at the default right-side dock (about 343 pt), and SC-010 was amended to that
    size. Finding: row times show three decimals; fixed and merged 2026-11-09 (`ef17f39`, panel tests
    610/610), live at AE's next start. **Next:** T061 (Find my next lesson, plus `home-first`), T071
    (a warm-up, `practice-check` at 260 × 480), T072 (keyboard), T073 (three sessions' notes), then T074 (close);
    EE's T038 and T077; paid T078 and T079 on the builder's go. The four mentor findings from the
    live lessons are fixed (eval cases `d50330a`: speed graph 36 and 37, pivot 54, null 52; `SKILL.md` `ad4a257`),
    plus a `no_slash_command` check in every runner (it caught offset and key types offering `/ease-mentor`). Full B1
    runs after: speed graph 34/37, pivot 56/59, null 45/52, all at SC-006; repeats showed the rest as noise or
    plumbing. Spec 007's request cases that failed from before (speed graph 34, a hard rule; pivot 50; null 45 and
    46) are fixed in `SKILL.md` (`b630cc8`, each 3/3 on B1). **Open:** for eval-engineer, null 45's `no_offer`
    regex lets a "so you can watch" offer through, pin case 15's offer to turn 3, and pivot 50's one-pixel preview;
    watch pivot 45; the runners should parse a malformed judge reply leniently.
    **Live sittings:** the panel is linked to the main checkout, so a `panel/` merge is live at AE's next restart;
    merge only between sittings. `mentor/dev/capture.mjs` captures the *active* comp (check the name it prints),
    and the Save a Copy for a restore goes outside the repo.
    The five baseline skills each have a teaching design, spec, plan and tasks: speed graph (008),
    key types (009), offset (010), set the pivot (011), move a group with a null (012).
  - **Parallel runs** (`discovery/usage-notes/parallel-runs.md`, with its template): run 1 specs
    and research (10-20), run 2 wave A code (10-21: spec 004's shared code plus skills 008 to 010
    in 96 minutes, an estimated 4 to 5 days solo), run 3 wave B plus skills 011 and 012 (10-23 to
    10-25, seven usage-limit stalls; one Opus agent at a time after the second). Agents misreport
    their own time by 6 to 10x; times in the notes come from commits.
  - **Skills built:** `/speed-graph-mentor`, `/key-types-mentor`, `/offset-mentor`,
    `/next-mentor`, `/null-parenting-mentor` (skill 6, merged `31fe72d`) and `/anchor-mentor`
    (skill 5, merged 2026-10-26 `f6effae`) are on `main`; all six have passed a first live
    lesson (below; null in `discovery/usage-notes/null-parenting.md`). All six eval sets are on
    `main` under `product/evals/` (easing 26 cases, key types 25, speed graph 25, offset 33, pivot
    46, null 40).
  - **Pacing rules in every skill and all six sets re-baselined (2026-10-28 to 10-29,**
    `discovery/usage-notes/pacing-rebaselines.md`**):**
    - **Rules:** curriculum § 2's opening rule, three turn rules, "do it for me", show-me-first, and
      the two-sentence cap are in all six `SKILL.md` files. Record summaries use general terms: no
      times, names, method or motive, though offset keeps its measured gaps.
    - **Results:** every set meets SC-006 with every hard-rule check passing. Easing 25/26, key
      types 23/25, speed graph 21/25, offset 29/33, pivot 41/46 (it was 27/44), null 39/40. Failures
      were fixed in rounds 3 to 5 and re-run 3/3, and T265, T347, T423, T427, T431 and T435 are
      ticked.
    - **Cost:** about $224 in all.
    - **Main lesson:** the model copies a prompt's example sentence word for word, so take examples
      from the rubric's Pass line.
  - **Overlap audit (2026-10-29,** `discovery/usage-notes/overlap-audit-2026-10-29.md`**):** all five new
    skills audited; 16 misses fixed (the worst: adding a null renumbered layers and broke the easing,
    speed graph and key types checks), guide and solo-hidden layers never the demo, land-hard edits
    reported, demos safe after a renumber, all five spec matrices updated. Mentor tests 1494 pass.
    Evals re-run the same day with 25 new cases (all pass): easing 27/28, key types 29/30, speed
    graph 29/29, offset 33/37, pivot 48/50, null 42/44, every set at SC-006. Two `record_plain`
    leaks (offset 23, pivot 30: the record's `next` named layers or the method) and offset 20's
    double "still linear" were fixed in `SKILL.md` and re-run 3/3 each; null's R-NO-CAUSE accepts
    the limits sentence. About $180 in all. Runs time out (`ETIMEDOUT`) when the machine is loaded;
    count those as plumbing. **Next:** a live check of the demo guard in AE (add a null, then a
    demo); the locked-child (D-OA-2) and key types locked-layer rules; 8 unpinned right-but-
    surprising rows.
  - **Easing after wave A:** the drop to 20/25 was the judge, not the mentor (`23b37e9`); baseline
    24/25.
  - **Spec 004 live sitting (2026-10-26,** `specs/004-ae-curriculum/live-sitting-2026-10-26.md`**):**
    Mentor Practice 2 (with its 2b layers) and Mentor Overlaps are built in the `.aep`, with 11
    live captures and answer keys. Findings: the snapshot's rotation read doesn't include
    auto-orient; parenting with the pick whip rewrites the children's raw Position keys, and
    adding a null renumbers every layer below it; `setTrackMatte` works in 26.5 and AE turns the
    matte's eye off itself; a snapshot takes about 0.2 s. Key-types and offset stand-ins now
    derive from the live base; mentor tests 747 pass, 0 fail. Decided the same day: shape and
    text layers read Collapse on (key fixed), and offset lists Transform properties before
    effects (`offset-order`). Easing case 26 (matte, eye off) passes 3/3 even without T123's
    line, because the tool already keeps mattes out of `hidden_layers` (`evals-matte`).
- **Sprint 4 (`sprints/sprint-4-plan.md`): option A runtime, spec 013 (`specs/013-api-runtime/`,
  `decisions/010`), paused 2026-10-30.** Built and merged (local `main`, not pushed): the helper
  (`panel/helper/`, SDK `@anthropic-ai/sdk` 1.3.0), the A adapter (`panel.json` `"runtime": "a"`),
  and `--runtime a|b1` in all six eval runners (B1 the default, dry runs byte-identical). 45 of 68 tasks done; two reviews fixed five history bugs. After a fresh checkout, run `npm ci` in
  `panel/helper/` (the SDK isn't committed). **Next, in order:**
  1. Done 2026-11-03/04: the API key is in the Keychain (a $100 credit, the lean budget for now; about
     $0.40 spent), the smoke check (T016), and the hand-over change (T060, merged `2185304`).
  2. Phase 11 (`decisions/011`, no credit): T062 and T063 before T031, then T064 to T067.
  3. All six sets on A done 2026-11-04; pivot and easing re-run 2026-11-06 after the fixes (T035, T068, T069):
     pivot B1 51/51 and A 50/51 at `c2d5f8d`, easing A 27/28, no timeouts. All six meet FR-033. About $26.85 of
     credit spent. The other four were measured on the older helper, so they re-run on the first tester's
     commit. Spec 006 T008 (2026-11-09, the key check) moved the settings hash off `0d5cda88`, so pivot and
     easing re-run on that commit too (no lesson code changed). T021 passed 2026-11-09 (three easing lessons on A, 18/18 turns ≤ 10 s, median $0.22 a lesson;
     `discovery/usage-notes/api-runtime.md`; the third was a review, so two ran with a demo). T048 passed the same day
     (SC-002 18/18, median 2.4 s against B1's 1.7 s; SC-004 median $0.22; R8 no gap over 5 min; helper start 0.15 s).
     T045 passed 2026-11-09 (SC-007; a close during a demo ended the lesson, fixed `151c64f`, panel tests 628/628,
     then re-run clean). **A re-runs on `3acbda26` (2026-11-09, at `f5d6ab9`, about $16 credit):** pivot 57/59 and key types 34/36 meet FR-033; easing 27/33 (every failure passed on repeat, but 15 points under B1 on the full run), speed graph 36/37 (case 30 0/3, R-ONE-IDEA) and offset 37/43 (07 and 18 1/3) are open for a fix or the builder's written acceptance (each set's README). **Null is held for the morning.** T046 and T047 merged 2026-11-09 (`94cb8f0`, panel tests 621/621): the turn log records the
     runtime, tokens and `start_ms`, and `node panel/dev/turns.js` reports per runtime (`--last N`); its `at` is
     the send time. Lines before the merge have no runtime and show as B1. T068's cause is still open.
  4. **Saved conversation (2026-11-09):** T043 (`panel/helper/lib/conversation.mjs`, 51 tests) and T056 (the
     helper's README) merged (`085cf1a`). It moved the settings hash from `4bc1686c` to `06339ff3` (no lesson code
     changed). The data model for T044 (the wiring, with `loop.mjs`) was approved 2026-11-09 (`5ea2b26`, OQ-C1 to
     OQ-C3 as recommended): file version 2 saves the prompt state with a `request_hash`, a continue that doesn't
     match starts fresh, and `stop` finishes a running call and saves. T044 merged 2026-11-09 (`27dd7c6`, helper tests 270/270, panel 623/623); the choices the builder accepted are in
     data-model › Saving and clearing. It moved the settings hash to `3acbda26` (no lesson code changed), so the A
     evals re-run on this commit. Spec 006's FR-019,
     T054 and T057 now always remove the conversation files, even when the learner keeps their history.
  5. `decisions/011`'s cost signal has fired; the rule stands until the builder decides. Later releases may
     reuse a set's A result if nothing it depends on changed (spec 006 FR-025).
  6. **Pinned (2026-11-02): where testers' access keys come from** (spec 006 Q2). On A every user
     needs a key; the question is who supplies and pays for it. The builder is thinking it over and
     exploring funding options; don't push for an answer. It doesn't block spec 013, but it does
     block the installer's plan.
- **Next steps:**
  1. Spec 004 is done (T047 passed 2026-10-26 after a two-sentence fix to `next-mentor/SKILL.md`; for a
     live test on a temp learner home, set `AE_MENTOR_HOME` in an MCP config's `env` and run
     `claude --strict-mcp-config --mcp-config <file>`, since a shell `export` didn't reach the server). T143's gate
     passed 2026-10-26 (branch 24/25 vs base 25/25; case 17's layer-count rubric item flaked and
     passed on re-run, see `discovery/usage-notes/easing-slice.md`); offset-order, T123 and
     case 26 are merged, and the easing set is now 26 cases.
  2. Live tasks, in order. First lessons passed 2026-10-26: speed graph (T032, `speed-graph.md`:
     3 min 35 s, one demo, SC-002 4 of 4), key types (T035, `key-types.md`: 3 min 58 s, one demo,
     SC-002 4 of 4), and offset's properties kind (T036, `offset.md`: about 3 min 46 s, no demo,
     SC-002 3 of 3; ran on a stale mentor server). All three ran on a mentor
     server from before that day's merges, so they need a note saying so. Offset's layers kind
     passed too (T037, `offset.md` session 2, fresh server: 2 min 5 s, no demo, first check, Quick
     Offset offered and used, so FR-017 is met live; SC-002 4 of 4 so far, 10 needed). Every "to
     fix" from these four lessons is on `main` (spec 004 wave B, 2026-10-26/27; marked in each usage
     note). Comps checked 2026-10-29: Mentor Practice 2 matches `practice2b.json` (strict compare),
     and Mentor Practice's key times match its captures; Title keeps the ease influences shaped in
     T032, on purpose, for the speed graph review.
     - **Skill 5 (set the pivot, spec 011): merged 2026-10-26 (`f6effae`).** Hand-back in
       `discovery/usage-notes/anchor-build.md`; lessons and timings in `anchor.md`; sitting in
       `specs/011-anchor/live-sitting-2026-10-26.md`. Mentor tests 1148 pass, hooks 39/39.
       - **Lessons:** T236 Door (2 min 56 s) and T237 Pop (3 min 54 s), no demo in either. SC-001
         met; SC-002 4 of 4, 10 needed. Both ran on the old opening.
       - **Built after the lessons** (spec rounds 2 to 7, teaching design § 16 to § 19b): layers
         with Position keys at two or more times are left out (`position_moves`), and a one-key
         layer gets a two-frames sentence with ready-to-say time labels; one watch offer on a
         one-layer lesson; the opening asks one thing (no idea, no leave-out list; each leave-out
         said when the learner names that layer); practicing always proposes the snapshot's
         proposal; a background is never proposed. HO-2 (overlaps) and HO-3 (review) passed.
       - **Live findings:** Pan Behind on a shape's group is invisible to the snapshot; with Position
         keyed it changes or adds one key at the playhead; it acts on the layer under the cursor.
         A lesson start's 10 s was AE throttled in the background (App Nap), not the reads; T252
         and T253 are deferred until the panel shows whether it still matters.
       - **Next:**
         1. **The self-note fix (spec 004 Phase 10, approved 2026-10-27, every OR recommendation
            taken):** the snapshot tool reads the record and picks lesson or review itself
            (FR-048 to FR-052, SC-015, SC-016; tasks T400 to T416, in the T400s because spec 011's
            tasks use T201 to T261). Merged to `main` 2026-10-27 (`1a28b1d`):
            `mentor/lib/opening.mjs`, `reviewFor()` exported from `recommend.mjs`, the five
            `SKILL.md` files open with the snapshot and no longer list `read_learner_record`.
            The reviewer's two should-fixes are in (a review still open is offered again in key
            types, offset and speed graph; speed graph ranks by the record's eased layers on every
            call). Mentor tests 1430 (1427 pass, 3 todo, 0 fail), hooks 39/39. T412: branch 24/26 vs
            base 26/26, rubric only (the opening miscounting layers, as case 17 did on 10-26), both
            passed on repeat; easing's code path is unchanged, so taken as met. Choices to watch: a
            declined review still uses the session's one review; the panel's "Remembering…" label
            is easing-only (a panel-builder request); PR-1 (the unreadable-notes message) is open.
            T413 to T415 checked and ticked 2026-10-29. **Next:** T416 (the live first lesson and
            review) is open.
         2. **Baselines: done.** The pivot went from 27/44 (61%) on 10-27 to 41/46 (89%) on 10-28,
            and null is 39/40 (98%) on 10-29. See "Pacing rules" under Progress. Watch list (2/3,
            no prompt change yet): pivot 09, speed graph 03, offset 20 and 28. Coverage to restore:
            pivot case 09 (a matte already there) and case 11 (turning down a show-me before the
            walk-through).
         3. A short first lesson on the new opening; watch for "what do you mean by turn from?".
         4. T240, the review, a day or more after T237. T248 (a stroke) and T261 (L-8, an unkeyed
            expression on Anchor Point or Position) at the next sitting.
         Open: H-6 (label the other times the mentor says, if one drifts); C-6 (where the practicing
         memory clause comes from, every skill); C-4 (the watch offer for skills 2 to 4); SR-3 (the
         tool file stays `transform-anchor.mjs`).
     - **Sitting method** (from skill 5, worth copying):
         - plant by script on the real comp and reset;
         - use duplicates only for hand moves, so the builder can do several in a row;
         - check every reset with a strict compare, because `capture.mjs --compare` skips
           `layer_info` (static layers).
     - **Offset's remaining SC-002 checks (6 more):** run the hints neither lesson hit, on purpose,
       on the Dots: a pair still together, a layer that pops in, a trimmed in point, a gap under
       the floor. They can ride along with the offset review (T040) or a short extra lesson.
     - **A day or more after a first pass:** speed graph review T035, key types review T038 (on
       Cut), offset review T040 (on the Chips).
     - **Skill 6 (move a group with a null, spec 012): merged 2026-10-26 (`31fe72d`).** Hand-back
       in `discovery/usage-notes/null-parenting-build.md`. T340 (3 min 51 s, one demo) and T341
       (4 min 28 s, no demo, Tile, Caption and Stamp proposed and taken) passed: SC-001 met,
       SC-002 8 of 8 plus 2 of 2 deliberate jumps, 10 needed. **Then:** review T343 (SC-009,
       stretch; it carries the last 2 SC-002 checks), and pivot review T240 (stretch).
     - **After the live lessons:** skills 5 and 6 are merged, and every eval set is merged and
       baselined (see "Pacing rules" under Progress). Still open from the live sitting: snapshots
     are sampled only at the playhead and key times (skills 5 and 6 may need more).
  3. Sprint 3 closes 2026-10-26: the carry-over is logged
     (`discovery/usage-notes/agent-carry-over.md`: on Operation Food Critic, a new project, the
     hooks and workflow copied over, ten personas trimmed to seven, and a two-researcher
     parallel run with no collisions; the portfolio site came first, so it's supporting
     evidence only). All five skills are merged and passed a first live lesson (speed graph, key
     types, offset in both kinds, the pivot on Door and Pop, and null in T340 and T341). "With eval
     cases" was partial at close: every set was built but none was merged or baselined. All six were
     merged and baselined by 2026-10-29, so `/sprint-review` should note that the baselines landed
     after close. Carry the reviews into sprint 4. Run `/overlap-audit` for each new skill (see "Edge cases where concepts
     overlap" below). Parallel agents share `SKILL.md`, the eval set, and `mentor/`, so the
     cockpit cuts their worktrees from local `main` (the agent tool's worktree option starts
     from `origin/main`). The git guard blocks any command containing `merge-base`, even a read.
  4. Carry these two caveats into the diagnosis and curriculum specs (from the 2026-10-08 Adobe
     side-by-side):
     - Diagnosis is its own capability, not the last step of adding skills. Adobe's answer
       came from reading the whole comp (equal durations, stacked parent motion, dead time),
       which per-skill, per-pair checks won't produce. Give it its own spec, and consider a
       light "what's wrong here" opening early, since belief 1 and interview 007 say finding
       what broke is the biggest pain.
     - Restraint and a teaching focus are product choices Adobe could copy with a mode switch
       (the `decisions/002` trigger). The harder-to-copy parts are depth (per-pair checks Adobe
       can't do today) and memory and practice across sessions. Keep those in each spec's "why".
  5. Gaps 008 left for the next interviews: learn vs. done (section 5), which Adobe AI people
     mean (generative fill vs. the assistant), whether steps match their version (belief 16),
     and referrals. A target-market learner on the panel is still needed for belief 7.
  6. After Nov 2026, re-run the spec 001 table against the AE UXP beta.
- **My setup:** After Effects 26.5 on macOS 27.0.1 (stated 2026-10-20). Version-dependent
  steps and shortcuts in specs and lessons target this.
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
- **Build on B1, ship on A** (`decisions/011`): new features and skills are built and evaluated on B1
  (no API credit), then finalized, user tested and shipped on A. Only A ships. Runtime work is the
  exception. Switch with `bash panel/install.sh --runtime a|b1` once spec 013 T066 lands.
- Meaningful choices get a numbered record in `decisions/`, written when the choice is made,
  including what was rejected and why.
- Sprint plans and reviews live in `sprints/`. The plan is committed on day one.
- Never put real names, emails, or phone numbers in this repo. Anonymize.

## Tools and conventions

- **Stack or tools:** `decisions/003`, amended by `decisions/005`:
  - `bridge/`: a forked CEP bridge (thin pipe into AE, no teaching logic). Changes from upstream
    are in `bridge/UPSTREAM.md`. CEP is retired, so expect a UXP rebuild after Nov 2026.
  - `mentor/`: a Node MCP server (`ae-mentor`, registered in `.mcp.json`) with six narrow tools. Each skill's tools are their own file in `mentor/tools/`, found by
    `index.mjs`; `common.mjs` holds the shared ones (frame, learner record).
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
  - `.claude/hooks/` (`decisions/008`, wired in `.claude/settings.json`): the AE lock, file
    ownership (`ownership.json`, mirrors 007's table) and the git guard, keyed on the calling
    subagent. Tests: `node --test .claude/hooks/test/*.test.mjs`. Merge agent branches with `/merge-worktree`.
    The AE lock keys on session plus agent (amended 2026-10-26), but AE has one active comp, so
    run one sitting or live lesson at a time: before starting one, run `ae_status` and check
    `.git/knack-agents/ae.lock.json` has no other holder from the last 10 minutes. MCP servers
    survive `/clear`, so after any merge into `mentor/`, run a live lesson in a fresh session.
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

Writing other people read outside the product (marketing, memos) sounds like: warm, playful, and
encouraging, like a friend a few steps ahead of you in the studio. Use creative-tool language,
and poke fun at the struggle, never at the learner. Example line: "Undo the tutorial spiral."

Copy inside the panel is plain (decided 2026-11-02): say what happened and what to do, in the
fewest words. A little voice is fine when it's short and natural, like "Take me in". No slogans
or wordplay; those read as AI-written. The mentor's in-lesson voice lives in `SKILL.md` and is
covered by the eval set.
