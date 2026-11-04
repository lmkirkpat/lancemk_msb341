# Feature Specification: Option A Runtime (the Panel Calls the Claude API Directly)

**Feature Branch**: `013-api-runtime` (spec folder only; no git branch)

**Created**: 2026-10-30

**Status**: Approved 2026-10-30 by the builder, with all five open questions answered as
recommended (see Resolved Questions). Q1 is recorded in `decisions/010`. Plan and tasks written
2026-10-30 ([plan.md](plan.md), [tasks.md](tasks.md)); the preamble approved the same day. Amended
2026-10-30 after the `013-helper` build and review (merged `d934115`): the builder's decisions D1 to
D3 and the review's smaller items, listed under [Amendments](#amendments-2026-10-30-after-the-013-helper-review);
four follow-up questions answered the same day (Resolved Questions 6 to 9). Amended again
2026-10-30 after `013-evals` and `013-adapter` merged (`5963fef`): the builder's decisions on review
S1 and M1 and the merged code's protocol, listed under
[Amendments after the merge](#amendments-2026-10-30-after-the-013-evals-and-013-adapter-merge). Amended
2026-11-04 by `decisions/011` (build on B1, ship on A): FR-035, FR-037, SC-003 and new FR-041 to FR-043,
listed under [Amendments 2026-11-04](#amendments-2026-11-04-build-on-b1-ship-on-a).

**Input**: Cockpit task, sprint 4 (`sprints/sprint-4-plan.md` › Done looks like: "The option A
runtime built, with the evals moved onto it"). "The panel calls the Claude API directly instead of
spawning headless Claude Code. A second adapter behind the seam in
`panel/lib/adapter-claude-code.js`. The six skills' prompts and narrow tools are reused unchanged,
so the eval results stay meaningful. The evals are retargeted at it, with equivalence to the B1
baselines shown." Decided in `decisions/009-ship-runtime-option-a.md`.

**Why this spec**: it's the critical path to anyone other than the builder using Knack. Spec 006
(the installer) User Story 1 and spec 007 (UI overhaul) step 5's sign-in screens both wait on it,
and those are what put a target-market learner on the panel, which belief 7 still needs
(`CLAUDE.md` › Next steps 5). B1 can't go to other people: every learner would need Claude Code
installed and signed in (`decisions/005` › B1 cons, `decisions/009`).

**Why it matters for the product, not only the plumbing.** What Adobe can't easily copy is depth
(per-pair checks Adobe's assistant can't do today), memory across sessions, and practice
(`CLAUDE.md` › Next steps 4). All three live in the six `SKILL.md` files, the `ae-mentor` tools and
the learner record, and all three are proven only by the eval sets and the live lessons, which ran
on B1. If the new runtime quietly changes how the skills behave, the product's difference goes
with it while every test still says green. So this spec is mostly about **running the same skills
and tools with nothing added, and proving it**, not about the API call itself.

## How this spec relates to active decisions

- **`decisions/009`** (option A for shipped Knack; B1 stays for the builder until A is built). This
  spec is the "own build spec" 009 names. It follows 009's signals: the eval bar (FR-030 to
  FR-034), cost (FR-026, SC-004), and the UXP note (FR-040).
- **`decisions/005`** (amended by 009). Its rule stands: everything that talks to the model sits
  behind one adapter, the panel only displays, and only the `ae-mentor` server calls the bridge.
  005's sketch of option A ("the mentor tools are imported from `mentor/tools.mjs` as plain
  functions, no MCP hop") is **not** what this spec does (Q1, `decisions/010`): it runs the
  `ae-mentor` server as it is and talks to it over its existing connection.
- **`decisions/003`** (thin AE pipe, mentor as an MCP server, learner record in local files):
  unchanged. Nothing here touches `bridge/`, adds a tool, or moves the learner record.
- **`decisions/007` and `008`**: the agent team's ownership and hooks. Nothing here changes them.
  The `SKILL.md` files, `mentor/` and the eval cases stay with their owners; this runtime reads them.
- **Constitution 1.3.0.** Principle II: the runtime holds no teaching logic (FR-012), the panel
  still doesn't read or change the project (FR-003), and opens no new way to run scripts in AE
  (FR-008). Principle III: the evals move with the runtime (FR-030 to FR-036). Principle IV: the
  access key and the conversation never reach the repo (FR-021, FR-024). Principle V: adding a
  dependency needs the builder's yes (given 2026-10-30 for the official Anthropic Node SDK, Q3).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The builder takes a full lesson in the panel on option A (Priority: P1)

I open the Knack panel in After Effects with the option A runtime selected. I press Start lesson.
The lesson looks and feels exactly as it does today: the mentor's opening names my layers, it shows
a frame from my comp, it demonstrates once if I ask, the check list fills from the check's result,
the stage moves from I do to You do, and the memory section updates when the lesson is recorded.
Nothing about the panel tells me the runtime changed, except that Claude Code isn't running.

**Why this priority**: it's the whole feature. If a quickstart lesson doesn't run end to end on A,
nothing downstream (installer, sign-in screens, testers) can start.

**Independent Test**: spec 003's quickstart steps a–f (`specs/003-mentor-panel/quickstart.md` §4)
on Mentor Practice, with the panel set to option A, Claude Code not running, and no terminal used
during the lesson. Complete when every step happens in the panel and each check's list matches
what's eased in AE.

**Acceptance Scenarios**:

1. **Given** the panel is set to option A and a working access key is stored, **When** I press
   Start lesson, **Then** the mentor's opening streams into the panel and names the layers with
   linear pairs, and no Claude Code process is started at any point in the lesson.
2. **Given** the mentor calls a tool, **When** the call is running, **Then** the panel shows the
   same plain-words activity line it shows on B1 (spec 003 FR-012), and the check list, stage and
   memory update from the tool results exactly as on B1 (spec 003 FR-007, FR-009, FR-011).
3. **Given** a demonstration was made, **When** I press Show me again, **Then** the project is not
   changed (spec 003 SC-003), because the one-demo rule is still enforced by the tool, not the
   runtime.
4. **Given** the lesson passes, **When** the mentor records it, **Then** the learner record has the
   same fields and wording rules as a B1 lesson, and nothing about the runtime (model name, cost,
   key, session id) is in it.

---

### User Story 2 - The evals run on option A and show it teaches the same as B1 (Priority: P1)

I run any of the six eval sets against option A with one flag. The cases, fixtures, rubric,
deterministic checks and results file are the same as today; only what runs the mentor changes.
The summary tells me how this run compares with the latest B1 baseline for that set. Once all six
sets meet the bar, option A becomes the runners' default and B1 becomes the flag.

**Why this priority**: without it, the eval baselines stop describing what learners get
(`decisions/005` › A cons: "the evals stop measuring what runs"), and 009's "evals fall below B1"
signal can't be read. Spec 006 SC-006 also needs "a passing full eval run against its runtime"
before any release.

**Independent Test**: run the easing set on A with `AE_MENTOR_FIXTURE_*` fixtures and no After
Effects; compare its results file with the 2026-10-29 B1 baseline. Complete when every deterministic
check is computed from A's transcript the same way it is from B1's, and the judge sees transcripts
in the same shape.

**Acceptance Scenarios**:

1. **Given** an eval case, **When** it runs on A, **Then** the mentor gets exactly the tools the
   skill's `allowed-tools` line lists and nothing else, the same fixtures are served by the same
   `ae-mentor` server, and the transcript records every learner line, mentor line, tool call and
   tool result in the shape the runner's checks and judge already read.
2. **Given** a full run of a set on A, **When** it finishes, **Then** the summary line shows pass
   rate, the SC-006 target, cost, the model and effort used, and the difference from that set's
   latest B1 baseline (cases that pass on B1 and fail on A, and the reverse).
3. **Given** a case passes on B1 and fails on A, **When** it is re-run with `--repeat 3` on A,
   **Then** a majority failure counts as a regression to fix (FR-033), and a majority pass counts
   as noise, as the eval READMEs already define.

---

### User Story 3 - A learner's access key works, stays secret, and its problems are explained (Priority: P2)

On a Mac where Knack was installed (spec 006) or set up by the builder, the panel finds the
access key where it was stored. If there's no key, the key is wrong, it has run out of credit, the
service is busy, or the Mac is offline, the panel says so in plain words with what to do, and never
shows a check result for that turn. The key never appears in anything Knack writes: no file, log,
transcript, eval result, report or error message.

**Why this priority**: it's what makes A shippable. Spec 006 FR-004 and FR-021 and spec 007
FR-054 and FR-056 depend on it, but the builder can prove User Stories 1 and 2 with their own key
first.

**Independent Test**: fault injection without After Effects (fake service responses for each
fault), plus one scan of every file Knack wrote during a full lesson and a full eval run for the
key's text.

**Acceptance Scenarios**:

1. **Given** no key is stored, **When** I press Start lesson, **Then** the panel says the mentor
   can't start because it has no access key and where to add one, and makes no request to the
   service.
2. **Given** a stored key the service rejects, **When** a turn is sent, **Then** the panel says the
   key isn't working and to check setup; no part of the key, the raw response, or an error code is
   shown.
3. **Given** the service says the account is out of credit or over its limit, a rate limit, or
   that it's overloaded, **When** retries are used up, **Then** the panel shows the matching plain
   message (FR-027) and the lesson can continue when the learner tries again.
4. **Given** a full lesson and a full eval run have finished, **When** every file under the learner
   home, the runtime's logs and the eval results are searched for the key, **Then** it's found
   nowhere.
5. **Given** the setup check or the installer asks whether the key works, **When** it checks,
   **Then** the answer comes from one request that costs nothing and changes nothing (FR-020).

---

### User Story 4 - Continue a lesson after closing the panel (Priority: P2)

I close the panel mid-lesson and reopen it in the same AE session. It offers to continue, as it
does on B1 (spec 003 FR-016). When I continue, the mentor knows what it already showed and whether
it already demonstrated, and picks up where we were.

**Why this priority**: it's an existing promise of the panel (spec 003 FR-016, T028–T030), and on
B1 it came free from Claude Code's saved sessions. On A the runtime has to keep the conversation
itself.

**Independent Test**: start a lesson, get past the demo, close and reopen the panel, continue,
then ask for Show me. Complete if the mentor doesn't demonstrate again and refers to the earlier
part of the lesson correctly.

**Acceptance Scenarios**:

1. **Given** an unfinished lesson in the same AE session, **When** I reopen the panel and press
   Continue lesson, **Then** the mentor's next turn uses the whole earlier conversation, exactly as
   it was sent before (nothing summarised, reordered or edited).
2. **Given** a new lesson is started, **When** it starts, **Then** the previous lesson's saved
   conversation is deleted, the same way the panel's display log is replaced today.
3. **Given** the saved conversation is unreadable or from another version, **When** the panel
   opens, **Then** it doesn't offer to continue and says nothing alarming (spec 003's rule for an
   unreadable display log).

---

### User Story 5 - The builder sees what each lesson costs and how fast it answers (Priority: P3)

After a lesson on A, the panel's turn log has each turn's time to first activity, time to first
words, total time, cost, model, and how much of the prompt was read from cache, so I can compare A
with B1's $0.38 per lesson and 10-second bar without reading API dashboards.

**Why this priority**: `decisions/009`'s cost signal and spec 003 SC-004 both need these numbers,
and on A cost is computed by Knack, not reported by Claude Code. It doesn't block a lesson.

**Independent Test**: run `node panel/dev/turns.js` (or its successor) after three quickstart
lessons on A; it reports per-lesson cost and SC-004 timings the same way it does for B1.

**Acceptance Scenarios**:

1. **Given** a lesson on A, **When** each turn ends, **Then** the turn log line has the same fields
   as B1's plus model, runtime, token counts by kind, and no message text (spec 003 data-model ›
   Turn log rule).
2. **Given** lessons on both runtimes are in the log, **When** the builder runs the turn report,
   **Then** it shows cost per lesson and the SC-004 numbers separately for each runtime.

---

### User Story 6 - B1 keeps working for the builder until A is proven (Priority: P3)

While A is being built and compared, my panel and evals still run on B1 exactly as today, and I
choose the runtime with one setting. After A meets every success criterion here, A becomes the
default; B1 stays selectable until a later change removes it.

**Why this priority**: `decisions/009` says B1 stays until A is built. Losing B1 mid-build would
leave no working panel and no baseline to compare against.

**Independent Test**: with the setting on B1, run the panel's unit tests and one easing eval run;
both match their results before this feature.

**Acceptance Scenarios**:

1. **Given** the runtime setting is B1, **When** I use the panel or the evals, **Then** behavior,
   files and results are the same as before this feature.
2. **Given** the runtime setting is missing (an existing `panel.json`), **When** the panel loads,
   **Then** it uses B1 until A's success criteria pass, then A.

---

### Edge Cases

- **A lesson that needs many tool calls in one turn.** A turn ends after the same 12-step limit
  B1 uses (`--max-turns 12`), with the panel told the turn ended without an answer; never an
  unbounded loop.
- **The model calls a tool the active skill doesn't allow** (another skill's tool, one declared but
  hidden, or one that doesn't exist). The call isn't run; the mentor gets an error result with the
  fixed text "That tool isn't available in this lesson." (FR-012), as Claude Code returns an error
  for a tool outside `--allowedTools`, and the tool's name is logged (never its input).
- **The `ae-mentor` server fails to start or exits mid-lesson.** The turn ends with a "mentor can't
  start" error (spec 003 FR-015); the next send starts it again. No project claims are made.
- **After Effects unreachable or busy.** Unchanged from today: the tool returns `AE_UNREACHABLE` or
  `AE_BUSY`, the server instructions' rule (2) governs what the mentor says, and the panel's
  bridge status shows it. The runtime doesn't add its own message for this.
- **A turn fails partway** (the connection drops mid-answer, the service errors, the turn times out,
  the answer is refused or cut off mid tool call). Text already streamed stays on screen, and the
  turn ends with its error kind. The history keeps every complete exchange the turn made and takes
  back only the incomplete tail (FR-015, D1, amended 2026-10-30), so a retry never sends half an
  answer back, and a demonstration or a `record_lesson` that already ran stays in the history: the
  mentor still knows it demonstrated, and the one-demo rule holds after a failed turn. A turn that
  ends at the step limit keeps everything, as it already did. A call still running when the turn
  fails (a timeout, or `ae-mentor` exiting mid-call) is answered "That call didn't finish, so it may
  or may not have changed the project." and kept, even as the answer's first call (amended
  2026-10-30, review S1).
- **The model's answer is cut off inside a tool call** (`max_tokens` reached while a call's input
  was being written). The call is never run, the incomplete answer is taken back, and the turn ends
  failed with no error event, as the step limit does (added 2026-10-30, `panel/helper/lib/loop.mjs`).
  An answer with no tool call cut off at `max_tokens` is kept and the turn ends `ok` (FR-015).
- **The service refuses a request** (a safety refusal). The turn ends with a plain "the mentor
  couldn't answer that; try rephrasing" message, and the refusal is logged with its category, never
  the learner's text.
- **A skill hand-over** (`/next-mentor` hands the lesson to another skill, or a message starts with
  another mentor skill's command). The handed-over skill's `SKILL.md` and allowed tools apply from
  then on, without editing earlier turns (FR-014). If the model's reply right after the new skill's
  text is empty, that text is taken back off the end and goes in again before the next request:
  the one removal from the history that's allowed besides a failed turn's tail (review fix M1,
  2026-10-30).
- **A frame is in the conversation when the lesson is continued later.** Frames are kept as files
  (as the panel already does) and sent again from those files, so continuing doesn't depend on
  memory.
- **The price of a model changes.** Costs are computed from a dated price table kept in one file;
  a missing price makes cost "unknown" rather than zero.
- **Long pauses while the learner works in AE.** The cached prompt may expire between turns; the
  turn still works, at a higher cost that the turn log shows (FR-025).
- **The builder's own settings.** Nothing from the repo's `CLAUDE.md`, auto-memory, output style,
  agents, hooks or builder skills reaches a lesson (FR-016), and no builder setting changes the
  mentor's voice (the `outputStyle` leak from panel session 1 can't happen on A).
- **Two lessons at once** (a panel lesson and an eval run on the same Mac). They use separate
  homes and separate `ae-mentor` processes, as today.

## Requirements *(mandatory)*

### Functional Requirements

**The seam**

- **FR-001**: Option A MUST be a second adapter with the same interface and events as
  `specs/003-mentor-panel/contracts/mentor-adapter.md` (`start`, `send`, `stop`, `on`; `turn_start`,
  `text_delta`, `text`, `tool_call`, `tool_result`, `turn_end`, `error`, `exit`), so `main.js`,
  `lesson.js`, `panel-session.js`, `turns.js` and the display code need no change beyond choosing
  the adapter (FR-037) and the new error kinds (FR-027).
- **FR-002**: The adapter MUST accept the same request texts the panel sends today
  (`panel/lib/requests.js`), including a skill command such as `/ease-mentor` or
  `/offset-mentor review`. A message that starts with a mentor skill's command MUST load that skill
  (FR-010) and pass the rest of the text on as Claude Code does, so the button-request eval cases
  (spec 003 FR-019) stay valid.
- **FR-003**: The panel MUST still never read or change the AE project, `session.json` or
  `learner.json` itself; the adapter MUST NOT either (spec 003 contract › Guarantees). Only the
  `ae-mentor` server calls the bridge (`decisions/005`).

**Running the mentor's tools**

- **FR-004**: The runtime MUST reach the mentor's tools through the `ae-mentor` server as it runs
  today, over its existing standard connection (`.mcp.json`'s stdio server), not by importing
  `mentor/tools/` into the panel (Q1, `decisions/010`). The server's code, tool list, schemas, results
  and call log (`calls.jsonl`) MUST be unchanged by this feature.
- **FR-005**: The tools **available to the model** at any point in a lesson MUST be exactly those in
  the active skill's `allowed-tools` frontmatter that the server lists, with the server's own names,
  descriptions and schemas, so a new skill needs no change to the runtime. A request MAY also
  *declare* other tools from the same sources (the server's list and the hand-over tool) as hidden
  (`defer_loading`), which the model can't see or call until they're made available; that is how a
  hand-over changes the tools without editing the request's tool list (FR-014, D2, amended
  2026-10-30). A call to any tool that isn't available, declared or not, MUST NOT run and MUST get an
  error result.
- **FR-006**: Tool results MUST go back to the model whole: text, JSON and images (rendered frames)
  as the server returned them, and errors marked as errors, as Claude Code passes them.
- **FR-007**: One user message MUST run at most 12 model steps (B1's `--max-turns 12`), and one
  turn MUST time out after 5 minutes (B1's turn timeout). The timeout ends the turn with a `timeout`
  error event; the step limit ends it with a failed `turn_end` and no error event, as B1 does today
  (clarified 2026-10-30 by `/speckit-analyze`).
- **FR-008**: The runtime MUST offer the model no tool that runs code, reads or writes files,
  searches the web, or touches AE outside the `ae-mentor` tools. The only runtime-provided tool
  allowed is the skill hand-over (FR-014), and only where a skill lists it.
- **FR-009**: The `ae-mentor` server MUST be started with an environment that has no access key,
  and with the same learner home and fixture variables (`AE_MENTOR_HOME`, `AE_MENTOR_FIXTURE_*`)
  the evals and panel pass it today.

**What the model is told**

- **FR-010**: A skill's instructions MUST be the body of its `.claude/skills/<name>-mentor/SKILL.md`,
  read at lesson start, unedited. Frontmatter is used only for the tool list (FR-005). Where in the
  request it goes: the system prompt, with Claude Code's message placement as the fallback (Q5);
  either way the text is byte-for-byte the file's.
- **FR-011**: The `ae-mentor` server's instructions (`mentor/server.mjs` `INSTRUCTIONS`, the eight
  rules Claude Code injects today) MUST be taken from the server's own start-up reply at run time
  and given to the model on every lesson, so there is one source and they can't drift.
- **FR-012**: The runtime MUST add nothing to what the model sees except the **allowlisted runtime
  text**, all of it fixed, versioned in the helper's files (covered by the settings hash) and
  approved by the builder:
  1. the preamble, one file (`panel/helper/preamble.md`, plan › The preamble);
  2. the hand-over tool's definition, one file (`panel/helper/skill-tool.json`);
  3. the hand-over tool's result, "Loaded <skill>." or, with arguments, "Loaded <skill>. Arguments:
     <args>" (the skill's name and the arguments the model itself passed);
  4. "That skill isn't available." (a hand-over to a skill that can't be loaded);
  5. "That tool isn't available in this lesson." (a call to a tool that isn't available, FR-005);
  6. "That call didn't run." (a call that never started because the turn failed after an earlier
     call in the same answer ran or was in flight, FR-015);
  7. "That call didn't finish, so it may or may not have changed the project." (a call that was
     sent to `ae-mentor` and was still running when the turn failed, FR-015).

  Items 6 and 7 always go back with `is_error: true`. Items 2 to 5 approved 2026-10-30 (D3, review
  S8); item 6 approved 2026-10-30 (resolved question 7); item 7 approved 2026-10-30 (the builder's
  decision on review S1 after the `013-adapter` build). None of it may hold a teaching rule (what to
  teach, when to demonstrate, how to grade, what to record); if a skill needs a rule, it goes in
  `SKILL.md` through its owner, not here. Adding or changing any of it is a builder approval plus a
  change to this list and to the allowlist check (FR-016, T023).
- **FR-013**: The parts above MUST be assembled in a fixed order with nothing that changes between
  turns (no date, time, paths or ids) before the conversation, so the stable part can be cached
  (FR-025).
- **FR-014**: A skill that lists the hand-over tool (`next-mentor`'s `Skill`) MUST be able to hand
  the lesson to another mentor skill with an optional argument (`review`, focus layer names): the
  runtime loads that skill's `SKILL.md` and allowed tools from then on, without editing earlier
  turns. A learner's or the panel's message that starts with another mentor skill's command (FR-002)
  hands over the same way. Only `*-mentor` skills can be loaded. How (D2, amended 2026-10-30):
  - **On Claude Opus 5.5 and Claude Sonnet 5.5**: every tool a lesson can reach is declared in the
    first request, those outside the starting skill hidden (FR-005); a hand-over appends a
    mid-conversation system message that makes the new skill's tools available and the old skill's
    unavailable (the service's mid-conversation tool changes, research R5), and the new skill's
    `SKILL.md` body as a mid-conversation system message. The request's tool list never changes
    during a lesson.
  - **On Claude Haiku 5.5** (no mid-conversation tool changes): the fallback built in the
    `013-helper` branch: the tool list is replaced with the new skill's, and from then on every
    request asks the service to drop the reasoning blocks the change invalidates instead of refusing
    the request (R10).
- **FR-015**: The conversation history sent each turn MUST be append-only: every earlier message
  and content block (including any reasoning blocks the service returns) is sent back exactly as
  received, in order. Nothing is summarised, trimmed or rewritten during a lesson. Three exceptions,
  each at the very end of the history and nowhere else (amended 2026-10-30):
  1. **A failed turn's incomplete tail** (D1). A **complete exchange** is either an answer from the
     model with no tool call, or an answer with tool calls together with the message that returns a
     result for every one of those calls. When a turn fails, the history keeps the learner's message
     and every complete exchange that followed it, and takes back only what comes after the last
     one: an answer refused or never finished, an answer cut off inside a tool call (`max_tokens`
     reached while a call's input was being written), or calls whose results weren't all returned.
     An answer with no tool call that's cut off at `max_tokens` isn't taken back: it's a complete
     answer, kept, and the turn ends `ok` (amended 2026-10-30 to match the code). If a call in an
     answer already ran, or was still running, when the turn failed, that answer is completed
     instead of taken back: the calls that ran keep their results; the call still running when the
     turn failed (the turn timed out, or `ae-mentor` exited mid-call) gets the error result "That
     call didn't finish, so it may or may not have changed the project."; and each call that never
     started gets the error result "That call didn't run." (both `is_error: true`, FR-012 items 6
     and 7). This holds even when the call in flight is the answer's first, because it may have
     changed the project (the builder's decision on review S1, 2026-10-30). A call `ae-mentor`
     wasn't running to take counts as never started. If no exchange completed, the learner's
     message is taken back too, so a retry doesn't send it twice (resolved questions 6 and 7).
     Whatever a kept exchange did (a demonstration, `record_lesson`, a hand-over) stays in force. A
     turn that hits the step limit ends on a complete exchange, so nothing is taken back.
  2. **A handed-over skill's text, when the reply right after it is empty** (review fix M1): it's
     taken back and goes in again before the next request.
  3. **After a server-side fallback** mid-answer, the declined attempt's reasoning and tool-call
     blocks aren't sent back, as the service requires (its fallback echo rule; research R10); the
     answer that was served is sent back as received.

  **Never two user messages in a row** (review fix M1 as built, amended 2026-10-30). When the
  history ends with a user message (a kept failure's tool results, the step limit, or an empty reply
  after a hand-over), the learner's or panel's next text goes into that message as a text block
  after its `tool_result` blocks, not as a new message. A later turn that completes nothing takes
  back only that added block (item 1), never the tool results it was added to.

**Isolation (what replaces the runtime folder)**

- **FR-016**: On A, everything the model receives MUST come from an allowlist: the allowlisted
  runtime text (FR-012: the preamble, the hand-over tool's definition, its three fixed results,
  "That call didn't run." and "That call didn't finish, so it may or may not have changed the
  project."),
  the server's instructions (FR-011), the `SKILL.md` body of the starting skill and of any skill
  handed over to (FR-010, FR-014), the server's tool definitions (FR-005, including hidden ones), the
  mid-conversation messages that make tools available or unavailable by name (FR-014), the
  learner's and panel's messages, tool results, and the model's own earlier answers. No
  `CLAUDE.md`, auto-memory, output style, settings, agents, hooks, builder skills, sprint notes or
  eval fixtures (beyond what the server serves as "the project") can reach it. A test MUST check
  every request built during an eval run against the allowlist.
- **FR-017**: Skill files MUST be read from a skills folder given in configuration, holding only
  `*-mentor` skill folders: the repo's `.claude/skills/` for the builder (filtered by the same
  pattern `panel/lib/runtime.js` uses) or the installed copy (spec 006 FR-005). Option A MUST NOT
  need the runtime folder `panel/lib/runtime.js` builds; that folder stays for B1.

**The access key**

- **FR-018**: The panel MUST read the access key from the macOS Keychain item spec 006 FR-004
  defines (one item, Knack's own service name). For the builder's eval runs only, the runner MAY
  read it from an environment variable in the builder's own shell; the panel never reads it from a
  file or the environment.
- **FR-019**: The key MUST be held only in memory, only by the part that calls the service, and
  only for as long as that part runs. It MUST NOT be passed to the `ae-mentor` server, any other
  child process's environment, the model, the panel's display, or any file.
- **FR-020**: The runtime MUST offer a key check (works / rejected / out of credit / can't reach the
  service) that costs nothing and changes nothing (2026-10-30: "out of credit" only where a free
  request can show it, which plan task T038 checks; otherwise the check says "works" and the first
  lesson turn reports `out_of_credit`), for spec 006 FR-021's setup check, spec 006's
  installer and spec 007's `setup-signin` to call. Where the key comes from (spec 006 Q2) and who
  writes it to the Keychain (installer or sign-in screen) are not this spec's.
- **FR-021**: Every error message, log line, turn log entry, saved conversation, eval results file
  and copied report MUST be free of the key. Text from the service that is shown or logged MUST be
  scrubbed of anything shaped like a key before use. What the service reports it changed in a
  request (its list of dropped reasoning blocks, R10) is logged as each entry's type, reason and
  position only, never any text (added 2026-10-30).
- **FR-021a**: Every request MUST opt into the service's check that the history is unchanged (the
  reasoning-block binding, research R10): refuse the request on a changed history. On Opus 5.5 and
  Sonnet 5.5, once FR-014's tool changes are built, it refuses for the whole lesson. Dropping the
  affected reasoning blocks instead is only for a hand-over that replaces the tool list (Haiku 5.5's
  fallback, and every model until T060 lands), from that hand-over on (resolved question 8). Why:
  accounts created before 2026-08-31 aren't checked unless a request asks, so without this an edit
  to the history would pass silently on the builder's account and fail only on learners' (added
  2026-10-30, review M2).

**Streaming and continuing**

- **FR-022**: The mentor's words MUST stream into the panel as they're written (`text_delta`), with
  a complete `text` event per block, and `tool_call` emitted once the model's whole answer is in,
  only for calls that will run (never for a call from an attempt the service declined before a
  fallback, or from an answer cut off mid-call), so the panel never shows a call that didn't happen
  (amended 2026-10-30, review S6; research R9). "Will run" means the helper will try it: a call to
  a tool that isn't available still gets its `tool_call` (and its error `tool_result`), and a call
  the turn's failure answers with "That call didn't run." or "That call didn't finish, …" keeps its
  `tool_call` and gets no `tool_result` (clarified 2026-10-30 to match the merged code,
  `panel/helper/lib/loop.mjs` and contracts/helper-protocol.md). The hand-over tool's own call isn't emitted, as B1
  emits only `ae-mentor` calls. Spec 003 SC-004's "first sign of the mentor working" clock still
  starts at the first `text_delta` or `tool_call`. Reasoning blocks are never shown.
- **FR-023**: Each lesson's conversation MUST be saved after each complete exchange to one file in
  the learner home next to `panel-session.json`, keyed by the same session id the panel already
  stores, with frames saved as files rather than inline (as `panel-frames/` does). It's replaced
  when a new lesson starts, removed by uninstall (spec 006), and never written to the repo or the
  learner record.
- **FR-024**: The saved conversation holds what the learner typed and the tool results, the same
  content Claude Code keeps today under `~/.claude/projects/`. It MUST NOT be sent anywhere except
  back to the model for that lesson, and MUST be covered by spec 006's install inventory.

**Cost, caching and speed**

- **FR-025**: The stable part of each request (FR-013) and the growing conversation MUST use
  prompt caching. The cache lifetime (5 minutes or 1 hour) MUST be chosen in the plan from the
  measured gap between turns in the builder's B1 turn log, and the turn log MUST show cache reads
  and writes so the choice can be checked.
- **FR-026**: Each turn's cost MUST be computed from the service's reported token counts by kind
  (input, cache write, cache read, output) and a dated price table in one file, and reported in
  `turn_end.cost_usd`. A lesson's cost is the sum of its turns.
- **FR-027**: The adapter MUST report these error kinds, each with a plain message the panel can
  show (spec 003 FR-015, spec 007 FR-056, FR-058): `not_signed_in` (no key, or the key is rejected),
  `out_of_credit` (billing or spend limit), `rate_limited` and `service_busy` (after the runtime's
  own retries), `offline` (can't reach the service), `refused` (a safety refusal, see Edge Cases), `timeout`,
  `start_failed` (the `ae-mentor` server can't start, or a fault in the request or the helper that
  isn't the learner's, research R10). Existing kinds keep their meaning. None of the messages contain
  a status code, path, tool name or the key. Two protocol kinds, `bad_command` and `not_implemented`,
  are never shown to a learner (contracts/helper-protocol.md).
- **FR-028**: The model and its settings (effort, cache lifetime) MUST be set in one place in
  configuration, not in code paths spread across the panel and the evals, so the panel and the
  evals always run the same settings (Q2). An eval run MAY name another settings file as an
  experiment (Q2's cheaper models, Q5's placement trial); such a run records its settings and is
  never a baseline (clarified 2026-10-30).
- **FR-029**: Every turn log line and eval result MUST record the runtime, model and effort that
  actually served it. If the service answers with a different model than configured, that turn is
  marked, and an eval run that has any such turn is flagged in its summary.

**Evals**

- **FR-030**: All six eval runners (`product/evals/*/run.mjs`) MUST be able to run the mentor on A
  through the same runtime module the panel uses (not a copy), with fixtures served by the same
  `ae-mentor` server. A switch chooses the runtime per run; the results file records which.
- **FR-031**: On A, a runner's transcript MUST have the same events and fields as on B1 (learner
  lines, mentor lines, tool calls with input, tool results with ok and text), so every deterministic
  check and the judge prompt work unchanged. A test MUST compare A's and B1's transcript shapes on
  a recorded case.
- **FR-032**: During the comparison (FR-033), the judge MUST stay exactly as it runs today, so the
  only thing that changes between a B1 and an A score is the mentor's runtime. Moving the judge off
  Claude Code is a separate, later change with its own re-baseline (Out of scope).
- **FR-033**: Option A is equivalent for a set when, on a full run of that set on A: (a) no
  deterministic hard-rule check fails; (b) the pass rate meets SC-006 (≥ 80%); (c) the pass rate is
  no more than 5 percentage points below that set's latest B1 baseline; and (d) every case that
  passed on B1 and failed on A has been re-run with `--repeat 3` on A, and each majority failure is
  either fixed (in `SKILL.md` or a tool, through its owner, then re-run on both runtimes) or
  accepted in writing by the builder in the set's README. The latest B1 baselines are those in
  `CLAUDE.md` › Overlap audit (2026-10-29): easing 27/28, key types 29/30, speed graph 29/29, offset
  33/37, pivot 48/50, null 42/44.
- **FR-034**: If a `SKILL.md` or tool change is made to close a gap, the B1 baseline for that set
  MUST be re-run on the same commit before the comparison counts, so neither runtime is compared
  against an older prompt.
- **FR-035** *(amended 2026-11-04, `decisions/011`)*: B1 MUST stay the runners' default, so an eval
  run never spends API credit unless `--runtime a` is asked for. When a set meets FR-033, its README
  MUST record the A baseline (results file, model, effort, cost) next to its B1 baseline, and the
  commit it was measured on. The B1 baseline stays the one development compares against.
- **FR-036**: The runners MUST keep their existing options (`--only`, `--changed`, `--repeat`,
  `--judge-always`, `--dry-run`) on A, and `--changed`'s hash MUST cover the runtime's files and
  settings (model, effort, preamble) so changing the model invalidates earlier passes.

**Keeping B1, and the panel's choice**

- **FR-037**: The panel's configuration MUST name the runtime (B1 or A). With B1 selected, the
  panel, `runtime.js`, `adapter-claude-code.js`, `stream.js` and the evals behave exactly as before
  this feature, except FR-042's tool list. A missing setting means B1 (*amended 2026-11-04,
  `decisions/011`*); anything installed for a tester MUST write `"runtime": "a"` itself (spec 006).
- **FR-038**: Option A MUST work with no Claude Code installed or signed in on the Mac, and MUST
  NOT read `~/.claude/` or the repo's `.claude/settings*.json`.
- **FR-039**: A builder-only way to run any of the six skills on A against the live comp without
  the panel (a terminal chat over the same runtime module) MUST exist, so live checks of skills the
  panel can't start yet (until spec 007) can run on A. It is not installed for learners.

**Carrying over to UXP**

- **FR-040**: The runtime's service calls MUST be plain HTTPS from Node with no CEP-only API, and
  the agent loop MUST NOT depend on the panel's page. It runs in a local helper process from the
  start (Q1, `decisions/010`), so a UXP panel after the Nov 2026 beta can start the same helper
  (`decisions/009` › UXP signal; spec 006 › What survives a UXP rebuild).

### What survives a UXP rebuild

| Part | On UXP | Why |
|---|---|---|
| Agent loop, prompt assembly, cost and caching | Survives | Plain Node and HTTPS in the local helper from the start (FR-040, `decisions/010`) |
| `ae-mentor` server over stdio | Survives | The helper starts it; same as spec 006's mentor-tools row |
| Keychain read | Survives in a helper; unknown in a UXP panel | UXP's access to the Keychain is unknown |
| Adapter events and the panel's display code | Survives as a contract; the panel code is rewritten | The UXP panel would consume the same events |
| B1 adapter | Doesn't survive | Spawns Claude Code (`decisions/005`) |

### Key Entities

- **Runtime setting**: which runtime the panel uses (B1 or A, in the panel's per-Mac configuration,
  FR-037) and, separately, A's model, effort and cache lifetime (one shared file the panel and the
  evals both read, FR-028). The evals choose the runtime per run (FR-030).
- **Lesson prompt**: the fixed, ordered parts the model sees before the conversation: preamble,
  server instructions, active skill body, tool definitions (FR-010 to FR-013). Has a hash recorded
  in eval results.
- **Lesson conversation**: the append-only list of messages for one lesson (FR-015, FR-023), saved
  in the learner home, keyed by the panel session's id; frames as files. Made of complete exchanges
  (FR-015); a failed turn's incomplete tail is never in it.
- **Price table**: per-model prices by token kind, with the date they were checked (FR-026).
- **Turn log entry**: spec 003's entry plus runtime, model, effort and token counts by kind; no text
  (FR-029).
- **Access key**: the credential in the Keychain (spec 006). Never stored by this feature anywhere
  else (FR-018 to FR-021).
- **Equivalence record**: per set, the A run, the B1 baseline it's compared with, the cases that
  differ, their repeat results, and each one's outcome (fixed or accepted) (FR-033).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The builder completes quickstart steps a–f on Mentor Practice in the panel on A, with
  zero terminal use and no Claude Code process running, in 3 of 3 lessons, and spec 003 SC-002's
  rule holds: each check's list matches the check's result every time. *Measured by:* the builder,
  logged with `/usage-session` in `discovery/usage-notes/`.
- **SC-002**: The panel shows the first sign of the mentor working within 10 seconds in at least 9
  of 10 turns on A (spec 003 SC-004's bar), over at least 10 turns, and the median is reported next
  to B1's (spec 003 T034, `discovery/usage-notes/mentor-panel.md`). *Measured by:* the turn log (FR-029).
- **SC-003** *(amended 2026-11-04, `decisions/011`)*: Easing and pivot meet FR-033 on A (no hard-rule
  failure, ≥ 80%, within 5 points of their B1 baseline, every regression fixed or accepted). The
  other four sets MUST do the same on the commit given to the first tester, as a gate on that
  hand-off rather than on this spec. *Measured by:* the results files and each set's README.
- **SC-004**: The median cost of a full quickstart lesson on A, over at least 3 lessons, is at most
  $0.40 (B1 measured $0.38 per lesson in spec 003 T034, before the pacing rules). If it's higher,
  the cheaper-model comparison in Q2 runs before the first tester. *Measured by:* the
  turn log.
- **SC-005**: The access key's text appears in none of the files under the learner home, the
  runtime's logs, the saved conversations, the six eval results files from SC-003, or a copied
  setup report, and in no child process's environment. *Measured by:* an automated scan after a
  full lesson and a full eval run (0 occurrences).
- **SC-006**: For each of 7 faults (no key, rejected key, out of credit, rate limited, service
  overloaded, offline, `ae-mentor` server can't start), the panel shows the right plain message and
  no check result, in 7 of 7, and no message contains a status code, path, tool name or key.
  *Measured by:* fault-injection tests with faked service responses, plus the builder reading each
  message.
- **SC-007**: Continuing a lesson after closing and reopening the panel works in 3 of 3 tries: the
  mentor never demonstrates a second time and refers to the earlier part of the lesson correctly.
  *Measured by:* the builder, in the usage notes, plus an automated test that the resumed request's
  history equals what was sent before.
- **SC-008**: In every request built during one full eval run of any set, the content matches the
  allowlist in FR-016, in 100% of requests. *Measured by:* an automated test.
- **SC-009**: With the setting on B1, the panel's unit tests pass and an easing eval run scores
  within the noise of its 2026-10-29 baseline, after this feature is merged. *Measured by:*
  `cd panel && npm test` and one easing run.

## Assumptions

- **Who runs it first:** the builder, on their own Mac (AE 26.5, macOS 27.0.1), with their own
  access key, before any tester. Testers come through spec 006.
- **The panel is still easing-first** until spec 007 lands: the panel's Start lesson sends
  `/ease-mentor`. A is skill-generic anyway (FR-005, FR-010), and the other five skills are proven
  on A through the evals (SC-003) and the builder's terminal chat (FR-039).
- **Which model B1 used isn't recorded.** The B1 baselines ran on Claude Code's default model and
  effort for the builder's account at the time, which the results files don't save. The plan
  records what that was (from a fresh B1 run's output) before choosing A's first settings, so the
  first comparison changes the runtime only, not the model too.
- **Claude Code adds its own system prompt** (its harness instructions, environment details) that
  the skills were tuned under. A doesn't copy it (FR-012). That's the main source of possible drift,
  and why FR-033's bar exists.
- **The tool list loads up front on A.** On B1 the mentor finds its tools through Claude Code's
  tool search first; on A it gets them directly. Expected to help, not hurt; the evals will show.
- **Costs and prices** as checked 2026-10-30 (per million tokens, input / output): Opus 5.5 $4 /
  $20 (cache reads $0.20), Sonnet 5.5 $2 / $10 (cache reads $0.20), Haiku 5.5 $0.10 / $0.50. Cache
  writes cost 1.25x input for 5 minutes, 2x for 1 hour. These go in the price table (FR-026) with
  their date.
- **Eval budget:** one full easing run cost about $15 on B1 (2026-10-29), and the
  2026-10-29 re-runs of all six sets cost about $180 including repeats. Expect similar per run on A
  at similar settings. Budget in Q4.
- **Data sent to the service** is what B1 already sends (the learner's words, tool results, frames
  from their comp). No new kind of data leaves the Mac.

## Out of Scope

- Where the access key comes from, who issues it, spend limits per tester (spec 006 Q2), and
  writing it into the Keychain (the installer, spec 006, or the sign-in screen, spec 007).
- The installer, Check setup screen, sign-in screens and their designs (specs 006 and 007); this
  spec only provides the key check and error kinds they use (FR-020, FR-027).
- Changes to any `SKILL.md`, `mentor/` tool, the server's instructions, eval cases, fixtures or
  rubrics. If the comparison finds a gap, the fix goes to that file's owner as its own change.
- Moving the judge off Claude Code, or changing the judge's model (a later change with its own
  re-baseline).
- Removing B1. It stays selectable after A becomes the default; removing it is a later change.
- A hosted backend, accounts, payment, pricing, or a spend dashboard (`decisions/005`, belief 12).
- Server-side compaction, context editing or anything else that rewrites the conversation; lessons
  are short (FR-015).
- Starting skills other than easing from the panel (spec 007).
- A UXP build (after the Nov 2026 beta).
- Windows.

## Dependencies and decisions this spec relies on

- **`decisions/009`** (option A ships; B1 until A is built), amending **`decisions/005`**, on top of
  **`decisions/003`**.
- **`decisions/007` and `008`**: ownership. Eval runner changes belong to the eval engineer, panel
  changes to the panel builder, `mentor/` and `SKILL.md` stay untouched.
- **Spec 003** as shipped: the adapter contract, the turn log, the panel session, SC-002 to SC-004
  and FR-015 to FR-019.
- **Spec 006** (approved): FR-004 (Keychain only), FR-005 (no builder files), FR-021 (key check),
  SC-006 (a release names a passing eval run against its runtime).
- **Spec 007** (approved): FR-054 (sign-in draws the access-key flow), FR-056 and FR-058 (error
  wording).
- **`decisions/010`** (written by the cockpit): the agent loop runs in a local helper process started
  by the A adapter, which starts `ae-mentor` over stdio (Q1); amends `decisions/005`'s option-A
  sketch. The cockpit also amends `decisions/009`'s signals.
- **The builder's yes to the official Anthropic Node SDK**, pinned (Q3, constitution Principle V),
  given 2026-10-30. `ae-mentor` stays built-ins only.

## Resolved Questions

All answered by the builder on 2026-10-30, each as recommended: 1 to 5 before the plan, 6 to 9
after the `013-helper` review (they were OQ-1 to OQ-4). The spec above is written to them.

1. **Where the agent loop runs.** In its own small local Node helper process that the A adapter
   starts (on Knack's private Node, spec 006 FR-003); it speaks the adapter's events to the panel
   and starts `ae-mentor` over stdio exactly as `.mcp.json` describes. Why: same shape as B1 (the
   adapter starts a process and reads events), the evals run the same helper so they test what the
   panel runs, the server and its instructions, call log and fixtures stay untouched, CEP's Node
   doesn't limit it, and it's already the local helper a UXP panel would need. Rejected: the loop in
   the panel's Node (tied to CEP and the page; evals would fake the panel), and importing
   `mentor/tools/` (bypasses the server's instructions, call log and error wrapping). Recorded in
   `decisions/010`, which amends `decisions/005`'s option-A sketch.
2. **Model, effort and cost.** Opus 5.5 first, at the effort B1's Claude Code used (found first,
   see Assumptions), so the first comparison changes only the runtime. Once easing meets FR-033,
   run easing and pivot on Sonnet 5.5 and Haiku 5.5 at the same effort; switch the default only if
   a cheaper model meets FR-033 on all six sets. Target: at most $0.40 per lesson (SC-004). Effort is
   always set explicitly (Opus 5.5's default is medium and reasoning can't be turned off).
3. **SDK.** The official Anthropic Node SDK, version pinned and shipped with the runtime; approved as
   a new dependency (constitution V). It handles streaming, retries and typed errors, where FR-022
   and FR-027 would otherwise go wrong. `ae-mentor` stays built-ins only.
4. **Eval budget.** About $115: easing first (about $15); if it meets FR-033, the other five sets
   (about $70), then repeats for regressions (about $30). Stop and triage after easing if it misses
   by more than 5 points. About $60 more if Q2's cheaper-model runs happen.
5. **Where `SKILL.md` goes.** In the system prompt, after the preamble and the server's
   instructions; a hand-over (FR-014) adds the new skill as a mid-conversation system message, so
   earlier turns are never edited. If FR-033 shows drift the prompt can't explain, switch to Claude
   Code's placement (the skill as a message) before touching any `SKILL.md`. The plan keeps the
   placement a one-setting switch.
6. **A failed turn that completed nothing** (was OQ-1). The learner's message comes off too, so a
   retry doesn't send it twice. Once one exchange has completed, it stays (FR-015).
7. **A failure between tool calls in one answer** (was OQ-2). The exchange is completed instead of
   taken back: calls that ran keep their results, and each call that didn't run gets the error
   result "That call didn't run.", approved as runtime text (FR-012, FR-015, FR-016, T023). Why: a
   demo that ran must stay in the history, which is the case D1 exists for. T059 tests it.
   *Amended 2026-10-30 (the builder's decision on review S1):* a call that was still running when
   the turn failed (timeout, or `ae-mentor` exiting mid-call) gets "That call didn't finish, so it
   may or may not have changed the project." (`is_error: true`, FR-012 item 7), and completes the
   answer even when it's the answer's first call, since AE may have changed. "That call didn't
   run." stays for calls that never started.
8. **The history check after D2** (was OQ-3). On Opus 5.5 and Sonnet 5.5, `error` for the whole
   lesson once T060 is built, so any edit still fails loudly; `drop_block` stays only for Haiku 5.5's
   swap fallback (FR-021a, T060).
9. **D2 before the easing baseline** (was OQ-4). T060 lands before T031, because D2 changes every
   Opus 5.5 request's tool list and T031 is the run the stop rule reads.

No decision record for D1 to D3: the builder ruled spec 013 enough (2026-10-30).

## Amendments 2026-10-30 (after the `013-helper` review)

The helper (T002 to T016) was built on branch `013-helper`, reviewed, and merged to `main`
(`d934115`). The builder approved three decisions the review raised; the rest are the review's
smaller items, written in to match what was built.

| ID | What changed | Where |
|---|---|---|
| D1 (review S1) | A failed turn keeps every complete exchange and takes back only the incomplete tail; "complete exchange" defined; the M1 removal named as the other sanctioned one. Not built yet: T059 | FR-015, Edge Cases, data-model › Lesson conversation |
| D2 (review S2) | Hand-over by declaring all tools up front and changing them mid-conversation on Opus 5.5 and Sonnet 5.5; the built swap plus drop is Haiku 5.5's fallback; "tools offered" reworded to allow hidden tools. Not built yet: T060 | FR-005, FR-014, research R5, R8 |
| D3 (review S8) | The runtime text allowlist names exactly the preamble, the hand-over tool's definition and its three fixed results; "That call didn't run." added by resolved question 7 | FR-012, FR-016, T023 |
| M2 | Every request opts into the history check; `error` before a hand-over, `drop_block` after; dropped blocks logged as type, reason and position | FR-021, FR-021a, research R10 |
| S3, S5 | Statuses the error table doesn't list become `start_failed`; non-API, non-network errors become `start_failed` (logged `internal_error`); only network errors are `offline` | FR-027, research R10 |
| S6 | `tool_call` once the whole answer is in, only for calls that will run | FR-022, research R9 |
| S7 | Thinking display `updates` (B1's, T001) forced to `omitted` on Haiku 5.5; `max_tokens` 32000 | data-model › Runtime settings |
| Other | Every `ANTHROPIC_*` variable stripped (R3); `skill-tool.json` in the settings hash; the protocol's test-only `base_url`, `bad_command`, `not_implemented`, `turn_end` extras, missing-key and server-start retries (contracts/helper-protocol.md); `install.sh` without Claude Code on A (T061); T037's scrubber note; T016's checkpoint and the three real-service unknowns | research, data-model, contracts, tasks |

## Amendments 2026-10-30 (after the `013-evals` and `013-adapter` merge)

The eval runners on A (T022 to T029), the A adapter and panel wiring (T017 to T020, T059, T061) and
the review fixes merged to `main` (`5963fef`). The builder approved S1 and M1 as below; the rest
writes the merged code's protocol into the contracts.

| ID | What changed | Where |
|---|---|---|
| S1 (builder's decision) | A call still running when the turn fails gets "That call didn't finish, so it may or may not have changed the project." (`is_error: true`) and completes the answer, even as its first call; "That call didn't run." stays for calls that never started. Approved runtime text item 7 | FR-012, FR-015, FR-016, Edge Cases, Resolved Question 7, data-model › Lesson conversation, T023 |
| M1 (as built) | Never two user messages in a row: the learner's next text joins a history-ending user message as a text block after its `tool_result` blocks; a later turn that completes nothing takes back only that block | FR-015, data-model › Lesson conversation |
| FR-015 item 1 | Narrowed: an answer cut off at `max_tokens` is taken back only when it's cut off inside a tool call; a text-only one is kept and the turn ends `ok` | FR-015, Edge Cases |
| S3 (helper, panel) | `start` takes a test-only `keychain: false`, accepted only with a local `base_url`; `drive.js --fault` and the panel's tests use it, so no fault run or test reads the real Keychain | contracts/helper-protocol.md, T040 |
| S5 (helper, adapter) | The start command's own `error` carries `during: "start"`, so the adapter tells it from a turn's | contracts/helper-protocol.md |
| S6 (adapter) | The adapter's backstop (30 s past the helper's 5-minute timeout) ends the turn as `process_exited` and stops the helper | contracts/helper-protocol.md |
| Adapter events | The A adapter's `turn_end` carries the helper's extras plus `error_kind` and, on the first turn, `start_ms`; `tool_call` carries `input`. Noted against spec 003's adapter contract, which this spec doesn't edit | contracts/helper-protocol.md › The A adapter against spec 003's contract |
| Evals | `skill-tool.json` in the `--changed` hash; the request-field allowlist; the README's `A-comparison baseline:` line; `non_baseline`, `settings_file` and `cost_unknown_turns` in results; the real tool-change block shape owed by T060 | contracts/eval-runtime.md, data-model › Eval results, T060 |

## Amendments 2026-11-04 (build on B1, ship on A)

Approved by the builder 2026-11-04. From `decisions/011`: new work is built on B1, then
finalized, user tested and shipped on A. Evidence: the builder's $100 credit, and a read-only
comparison of each runtime's tool lists on 2026-11-04.

| ID | What changed | Why |
|---|---|---|
| FR-035 | B1 stays the runners' default; A baselines are recorded alongside B1's | Eval runs shouldn't spend credit by default |
| FR-037 | A missing setting stays B1; tester installs write `"runtime": "a"` themselves | The builder's setup stays on B1 |
| SC-003 | Easing and pivot now; the other four before the first tester | Skills will change during development, so proving them now would be paid for twice |
| FR-041 (new) | One command switches runtime: `bash panel/install.sh --runtime a\|b1` | Moving between them should be one step |
| FR-042 (new) | B1's tool lists MUST come from the skill's `allowed-tools`, in the runners and the panel's adapter | B1 is more permissive than A, so a mistake could pass in development and fail for a tester |
| FR-043 (new) | A free check MUST say whether a skill is ready for A | Catch what can be caught before spending credit |

- **FR-041**: `panel/install.sh --runtime a|b1` MUST set the runtime in `panel.json`, add what that
  runtime needs (the Claude Code path for B1), and say which runtime is now on. With no flag, the
  installer keeps today's behavior.
- **FR-042**: The B1 runners and `adapter-claude-code.js` MUST build `--allowedTools` from the active
  skill's `allowed-tools`, with no hand-kept lists. The runners' lists MUST stay the same set as the
  2026-10-29 baselines used, so those baselines stay valid. A runner MAY still recognize
  `read_learner_record` so that a call to it is reported.
- **FR-043**: `product/evals/lib/ready-for-a.mjs <skill>` MUST, with no service call and no credit,
  check that the skill's name is one A accepts, its `allowed-tools` are listed by the server, every
  `ae-mentor` tool named in its `SKILL.md` body is allowed, and its runner's `--runtime a --dry-run`
  passes.

**Found on 2026-11-04, for these tasks:**

- The panel's B1 adapter hard-codes easing's six tools (`panel/lib/adapter-claude-code.js`). The other
  five skills' first lessons ran in plain Claude Code sessions, so they've never run on the B1 panel.
  Whether a skill's own `allowed-tools` frontmatter grants its tools in a headless run isn't known.
- `next-mentor`'s hand-over hasn't been checked on B1; `--tools ToolSearch` leaves out `Skill`.
- The five non-easing runners already leave `read_learner_record` out of what they allow, and their
  lists appear to match each skill's today, so research R6's "Found while planning" note looks out of
  date. Nothing enforces the match.

