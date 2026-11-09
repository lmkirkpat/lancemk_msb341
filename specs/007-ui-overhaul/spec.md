# Feature Specification: Panel UI overhaul (Home, Lesson, Skills)

**Feature Branch**: `007-plan` (spec folder only; the build runs on its own worktree branches)

**Created**: 2026-10-20

**Status**: **Approved 2026-11-04.** [plan.md](plan.md) and [tasks.md](tasks.md) are approved with it. Corrected 2026-11-04 from
the review of that approval and reconciled with `decisions/011`, which added FR-099, FR-100, SC-018 and tasks
T075 to T079. Earlier history: approved 2026-10-20 (Home A; open questions 1, 3 and 5 answered); amended
2026-10-30 from spec 013 (FR-056 and the runtime assumption); amended 2026-11-02 to mockup revision 3 and the
builder's decisions of that date. Step 0 (contrast and the 11 px floor) shipped in `5bed931`.

**Input**: Cockpit task, Sprint 3 parallel run 1 (wave 3): "Write the spec for the UI overhaul:
three tabs (Home, Lesson, Skills), Home option A (path-first) as recommended, the docked
checklist from the lesson's opening, the diagnosis screens matching spec 005, the
lesson-in-progress rules, and every interface state in the README's state table. Turn the
panel-needs list into requirements with IDs, and say which ones need a mentor change versus the
panel alone."

**Amendment input (2026-11-02)**: Cockpit task: amend to mockup revision 3 and the builder's nine
decisions, check the mockup's claims against the code, then write the plan and tasks. What the code
check found is in [research.md](research.md).

**The design this spec builds.** The UI designer's mockup, revision 3 (2026-11-02):
[`product/mockups/ui-overhaul/README.md`](../../product/mockups/ui-overhaul/README.md),
[`index.html`](../../product/mockups/ui-overhaul/index.html) and
[`copy-pass.html`](../../product/mockups/ui-overhaul/copy-pass.html). This spec links to it and turns
it into requirements; it doesn't redraw or reword it. **The mockup's wording is the source for panel
copy** (decision 7): where this spec quotes copy, a difference means the mockup wins and this spec is
out of date. Where this spec says "the README", it means that file, and state ids (`home-return`,
`lesson-picking`, ...) are the ones in its rail and its "Every state" table. Where the spec needs
something the mockup doesn't settle, it's a question for the designer (Open questions › D), not an
edit.

## Why this overhaul

- **The panel can't hold what's coming.** Spec 003's panel is one stacked screen built for one
  skill: a fixed four-item path, a memory strip with only the last lesson, and a check list that
  appears only after the first check. Spec 004 adds ten skills, a path and reviews; spec 005 adds
  a whole-comp diagnosis. None of it fits on one screen at 260 px (README › What this revision
  removes).
- **It's where the harder-to-copy parts become visible.** Restraint and leading are product
  choices Adobe could copy with a mode switch (`decisions/002` trigger). What Adobe's assistant
  can't easily copy is:
  1. **Depth.** The checklist shows every keyframe pair (and, from spec 004, every key and setting)
     the lesson checks, docked next to the comp from the opening, from the check's own result.
     (A diagnosis finding that says where, by layer, property and time, is
     held with spec 005.) Adobe's assistant said it couldn't read easing at all on 2026-10-08.
  2. **Memory.** Home shows what the mentor remembers, a remembered look is always dated and tied
     to its comp, and each skill keeps its history. Today memory is one line.
  3. **Practice.** Practice due and Warm up sit on Home and in Skills, so the review spec 004
     schedules is one press away.
  The usage notes back the part that's most at risk of being lost: the check list next to the comp
  is what helped most in every panel session (`discovery/usage-notes/mentor-panel.md`, spec 003
  SC-008).
- **Home is path-first (option A).** The mentor leads (`decisions/002`), Home opens instantly and
  free from the local record, and it works before diagnosis ships. Home keeps one held slot directly
  under Up next (`home-held-slot`), so both starts fit above the fold when spec 005 lands and no other
  card moves. The open risk is that A reads like a course menu. Home A is approved for now
  (2026-10-20); it gets evaluated, and possibly A/B tested against Home B, once there are enough
  target-market testers (Open question 3, SC-013).
- **The overhaul also clears debts from spec 003:** developer error copy for an installer audience
  (all but the not-set-up message, which FR-055 keeps, builder-only, until spec 006) and a silent fresh
  start after AE restarts. The three colour tokens that failed contrast are already fixed (FR-074, step 0).

## Decisions and rules this spec relies on

- `decisions/002`: the mentor leads; the "why" names depth, memory and practice, never restraint
  alone.
- `decisions/003` amended by `decisions/005` and `decisions/009`: the panel only displays. It spawns
  headless Claude Code (option B1) behind one replaceable seam for the builder's prototype; shipped
  Knack uses option A (the Claude API directly, `decisions/009`) behind the same seam; it holds no
  teaching logic, never reads or changes the project except through the mentor's tools, and only
  reads the learner record (constitution 1.3.0 › II). Every requirement in "What the panel needs
  from the mentor" exists because of this rule: anything the panel shows that isn't the mentor's
  words must arrive as data.
- `decisions/006`: the product is Knack; copy says Knack.
- `decisions/007`: the UI designer owns the mockup; the curriculum designer owns what is taught
  (`curriculum.md`, and spec 005's `teaching-design.md` if one is written); the panel builder owns
  `panel/`; the skill builder owns `mentor/` and `SKILL.md`; the eval engineer owns
  `product/evals/` and writes every eval case this spec asks for.
- `decisions/008`: one agent on After Effects at a time; ownership hooks. Panel and mentor work
  for this spec run in separate worktrees.
- `decisions/011`: build on B1, finalize, user test and ship on A. Panel features are built and evaluated
  on B1, at no API credit (FR-097); the last check before a tester sees anything is on A (FR-099).
- Constitution 1.3.0: I (this spec before build), II (FR-065 to FR-068), III (FR-069 to FR-073),
  IV (FR-068), V (Build order: the smallest useful step first), VI (eval cases by the eval
  engineer; numbers from the cockpit).
- **Spec 003** (shipped): the base this replaces. Its FR-005 to FR-019 carry over unless a
  requirement here changes them, and its requests-eval-sync test rule is kept and widened
  (FR-071).
- **Spec 004** (approved): path data, recommendation, record shape and reviews (its FR-001 to
  FR-008, FR-018 to FR-023), and its waves A to D (wave C is reviews).
- **Spec 005** (approved): the diagnosis's behaviour (FR-004, FR-006 to FR-008, FR-010 to FR-017,
  FR-019) that the diagnosis screens show, and its FR-023 (the panel holds no diagnosis logic).
- **Spec 006** (approved): the installer and its setup check, whose screens this spec doesn't draw.
  Its Q1 is answered by `decisions/009` (option A), so the sign-in screen draws an access key; its
  Q2 (where the key comes from) is still open.

None needs changing. Open question 1 was answered (a) plus (c), which doesn't change how a session
that names a skill opens, so it needs no decision record.

### The builder's decisions of 2026-11-02 (folded in below)

| # | Decision | Where |
|---|---|---|
| 1 | Scope: all six built skills run live in the new panel. Diagnosis is out: `diag-*` held, RQ-03 to RQ-10 held, Home keeps a place for it. Home A stays. Setup screens wait on the installer and spec 006 Q2 | FR-006, FR-007, FR-031 to FR-047, Build order |
| 2 | Proposed mark, cheap version: rows from the opening snapshot's targets; the mark drops at the first reply or first check. No focus-accepted signal. PN-10, PN-13 and PN-14 dropped for now. `lesson-focus-stale` stays visible | FR-015, FR-098 |
| 3 | No checklist at the opening for key types, the pivot and null. Easing's opening shows all linear pairs | FR-015 |
| 4 | Pick / Try / Done. The check button reads "Done, check it"; its request stays exactly "I'm done. Check my work." Up next with nothing stored reads "Find my next lesson" and spends one `/next-mentor` turn | FR-009, FR-014, FR-016, RQ-14, RQ-15 |
| 5 | Short docks (560 px tall and under): one scrolling area at a time, swapped by the checklist's arrow; after a check the panel stays on the chat. Replaces FR-022's 30% cap | FR-022, FR-090 |
| 6 | Stale list: the note, summary and results stay full; only row labels dim, keeping 4.5:1 | FR-017, FR-075 |
| 7 | Plain copy; the mockup's wording is the source. One pass line. One short line per skill for Up next's reason | FR-021, FR-061, FR-063, FR-094 |
| 8 | Offset's small timeline stays, with a real scale | FR-088 |
| 9 | Spacing, the large toggle arrow, End lesson as a gray secondary button, and option A's error split | FR-056, FR-096 |

### The builder's decisions of 2026-11-04 (folded in below)

| # | Decision | Where |
|---|---|---|
| 1 | Yes on B1 ends next-mentor's process and starts the recommended lesson. It's the plan, not a fallback | FR-082, plan P3 |
| 2 | SC-002: 3 checks per skill from recorded lessons, plus 10 live overall | SC-002 |
| 3 | Typed text stays in the local display log for this build; revisit before the first tester | FR-068, T080 |
| 4 | "Start fresh" becomes **"Set it aside"**. "New lesson" stays, and a resumed lesson must say it's resuming | FR-026, FR-027, FR-092, D16 |
| 5 | A new case failing on a known gap is reported to the builder rather than blocking | SC-006 |
| 6 | Four real hand-over cases on A. Easing and speed graph stay out for now, and can be added at the first tester check for about $1 to $2 | T032, T078 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Knack and know what to do next (Priority: P1)

I open the Knack panel next to my comp. It opens on **Home** straight away, without waiting for
the mentor. The top card is Up next: on my first run it names Easing with **Start lesson**; after that
it reads "Your next lesson" with **Find my next lesson**, which asks the mentor to look at my history
and this comp. Below it: practice that's due, and what the mentor remembers. Three tabs across the top
(Home, Lesson, Skills) and a mark that says whether After Effects is connected.

**Why this priority**: it's the frame every other story sits in, and option A's claim (the mentor
leads, free and instant) is tested here. It works on today's mentor and record.

**Independent Test**: with saved learner records in each state (none, one lesson, several lessons
with a review due, unreadable), open the panel and compare Home with the record and the README's
`home-first`, `home-return` and `home-unreadable` states. It's complete if Home matches the record
in every case, appears without a mentor turn, and the tabs work by keyboard.

**Acceptance Scenarios**:

1. **Given** no learner record, **When** I open the panel, **Then** Home shows `home-first`: Up
   next is the path's starting skill with Start lesson, and "No lessons yet", with no error.
2. **Given** a learner record with lessons, **When** I open the panel, **Then** Home shows
   `home-return`, and every date, skill, result and note on it matches the record.
3. **Given** the record can't be read, **When** I open the panel, **Then** Home shows
   `home-unreadable` ("set aside, nothing's lost"), never `home-first`.
4. **Given** reading the record takes longer than 300 ms, **When** Home is drawn, **Then**
   skeleton cards show until it's read (`home-loading`).
5. **Given** any Home, **When** I press Tab and the arrow keys, **Then** I can move between the
   three tabs and into every card's actions without a mouse.
6. **Given** After Effects isn't reachable, **When** Home shows, **Then** the connection mark says
   so in a word as well as a shape, and every action that needs AE is replaced by "Needs After
   Effects." (`home-unreachable`).

---

### User Story 2 - Take a lesson with the checklist beside me from the start (Priority: P1)

I press **Start lesson**. The Lesson tab opens with the mentor's opening. Where the skill's tool has
targets at the opening (easing, speed graph, offset), the checklist docks above the buttons, each row
marked **Proposed** until my first reply or check. Where the skill asks first (key types, the pivot,
null), the slot says what fills it ("Your checklist starts once you pick the group."). When I ask
**Show me**, the one change the mentor made sits in its own "Changed in your comp" box with how to undo
it. Each **Done, check it** fills the rows from the check. When it passes, I see **Lesson passed.** and
**Saved to your history**, and two ways on.

**Why this priority**: the lesson is the product, and the checklist next to the comp helped most
in every session. Moving it to the opening is the overhaul's main teaching-facing change.

**Independent Test**: on Mentor Practice, run quickstart steps a–f (`specs/003-mentor-panel/quickstart.md`
§4) in the overhauled panel. It's complete if every step happens in the panel, the checklist
shows from the opening, each row matches the check's result every time, and nothing is typed in a
terminal.

**Acceptance Scenarios**:

1. **Given** I press Start lesson on a skill with opening targets, **When** the opening arrives,
   **Then** the checklist is docked above the buttons with one row per target, each marked
   **Proposed**, and the strip stays on Pick until my first reply, check or demo (`lesson-open`). On a skill that asks first, **Then** no rows show and the slot says
   what fills it (`skill-keytypes-open`, `skill-pivot-open`, `skill-null-open`).
2. **Given** rows say Proposed, **When** I reply or check, **Then** the mark drops to "Not checked yet"
   (`lesson-focus-replying`); **When** the mentor reads again in that turn, **Then** the rows change to
   the new targets (`lesson-focused`); **When** it doesn't, **Then** the old rows stay, unmarked, and
   say they come from the mentor's last look (`lesson-focus-stale`).
3. **Given** the tool names a demo target and no demonstration yet, **When** I press Show me, **Then**
   the change appears in a "Changed in your comp" box that says Edit > Undo reverses it, and the button
   becomes **Show me again** (`lesson-demo`). With no demo target, Show me isn't there.
4. **Given** a check that isn't a pass, **When** it returns, **Then** each row shows its state as a
   glyph and a word, Hint appears, and changes outside the focus are listed apart as "Outside this
   lesson · not counted" (`lesson-partial`, `lesson-outside`).
5. **Given** a passing check, **When** the record is written, **Then** `lesson-passed` shows
   **Saved to your history**; **When** the skill asks one more question first, **Then**
   `lesson-passed-asking` shows the check passed and Ask stays; **When** the record write fails, **Then**
   "Saved" never shows (`lesson-passed-unsaved`).
6. **Given** a panel 560 px tall or under, **When** the lesson runs, **Then** one area scrolls at a
   time: the checklist is its summary line with a toggle arrow, pressing it swaps the chat for the
   rows, and after a check the panel stays on the chat. The buttons and Ask are never clipped.

---

### User Story 3 - One lesson at a time, and never lost without a word (Priority: P1)

I can leave a lesson for Home and come back to it. While it's open, Knack won't start a second one;
it says those are "Available after your lesson". If I close the panel and reopen it, my lesson is
waiting. If After Effects quit, Home tells me once that the lesson ended. If the mentor gets cut off,
**Try again** never asks for a second demonstration.

**Why this priority**: three tabs make it easy to start something twice. The one-demonstration
rule (spec 002 FR-006) and "nothing recorded for an unfinished lesson" (spec 003) must survive the
new navigation.

**Independent Test**: from recorded turn streams and a live run, walk ‹ to Home and back, press
every start on Home with a lesson open, close and reopen the panel, restart AE, and cut off a
Show me before and after its change came back. It's complete if no path starts two lessons or a
second demonstration, and each case shows the README state named for it.

**Acceptance Scenarios**:

1. **Given** a lesson is open, **When** I press ‹, **Then** Home shows **Lesson in progress** with
   **Back to lesson** and **End lesson** (a gray secondary button), and Find my next lesson, Start
   lesson and Warm up read "Available after your lesson." (`home-lessonopen`).
2. **Given** no lesson is open, **When** I choose the Lesson tab, **Then** it says why it's empty
   and offers **Go to Home** and **Pick a skill** (`lesson-none`). The tab is never disabled.
3. **Given** I closed the panel mid-lesson in the same AE session, **When** I reopen it, **Then**
   **Your lesson is waiting** sits on top with **Continue lesson** and **Set it aside**, and Up next is
   dashed and not the primary button (`home-cutoff`).
4. **Given** AE quit mid-lesson, **When** I next open the panel and the bridge answers with a new start
   time, **Then** Home shows a one-time, dismissible note that the lesson ended and wasn't saved
   (`home-aeclosed`). **Given** the bridge is only busy or not up yet, **Then** the lesson is kept and the
   panel asks again on its next poll (FR-028).
5. **Given** Show me was cut off after its change came back, **When** the panel offers a retry,
   **Then** the button reads **Show me again**; **Given** it was cut off before any result, **Then** the
   panel offers **Done, check it** instead, and Show me stays hidden until a later snapshot or check settles
   it (`lesson-error-demo`). On option A only, if no demo call started at all, Show me may be resent (FR-030).

---

### User Story 4 - Ask "what's wrong here?" from Home and be led, not handed the fix (HELD with spec 005, decision 1)

**Held, not this build.** Kept so the screens and requirements are ready when spec 005 has a plan.

On Home I press **Look at my comp**, optionally saying what looks off. Knack reads my whole comp
and shows a dated, scoped line, the mentor's short read, and at most three findings, one marked
**Start here**, each with its kind and where it is. A finding a skill covers offers **Learn:
skill ›**; one no skill covers offers **No lesson yet · Get hints ›**; a style finding also offers
**That's on purpose**. Questions about intent come as questions with answer buttons. After I change
something, **Done, check it** reads the comp again. Every answer says what it couldn't check, and
that it only looked.

**Why this priority**: diagnosis closes the gap Adobe showed on 2026-10-08, and leading into the
fix is the part that differs. The screens are only as ready as spec 005: they ship story by story
with it (Build order).

**Independent Test**: on recorded diagnosis turn streams from spec 005's fixtures (Mentor Practice,
a clean comp, a precomp-heavy comp, a symptom match and a symptom miss), the panel shows each
README `diag-*` state from the tool result alone. Then one live look on Mentor Practice with the
builder checking each finding's where against After Effects.

**Acceptance Scenarios**:

1. **Given** a look returns, **When** `diag-results` shows, **Then** it has the scope line ("Just
   now · Mentor Practice · 7 things found"), at most 3 ranked findings with one marked Start here,
   "See the other 4 ›" and how many of those are questions, and the Couldn't check list.
2. **Given** I press See the other 4, **When** `diag-rest` shows, **Then** findings 4 to 7 are
   numbered on from 4, none of the top 3 repeats, and ask findings show as questions with their
   answer buttons, never as mistakes.
3. **Given** a symptom I typed, **When** the look returns, **Then** findings the mentor matched to
   it come first (`diag-symptom-results`), or, when none matched, "Nothing it can read explains
   that" (`diag-symptom-none`).
4. **Given** a finding no skill covers, **When** I press Get hints, **Then** `diag-hints` shows
   where to look (panel, layer, property, time) and the mentor's hint, and **Done, check it**;
   **When** I press it, **Then** the result (`diag-recheck-gone`, `-still` or `-changed`) comes from
   a read made in that turn, with what's still open.
5. **Given** a finding a built skill covers, **When** I press Learn: skill ›, **Then** a lesson for
   that skill starts with the finding's layer as the proposed focus.
6. **Given** any diagnosis answer, **When** it ends, **Then** it says "Looked only: no changes were
   made." only if no tool that can change the project ran in that turn (FR-044).
7. **Given** I press Stop looking, or the turn is cut off, **When** the panel recovers, **Then**
   nothing half-read is shown (`diag-stopped`, `diag-error`).

---

### User Story 5 - See my progress across skills and keep it fresh (Priority: P2)

The **Skills** tab lists every skill in the path with its state in a glyph and a word: learned,
practice due, in progress, not started, coming later. I pick one to see its history and start a **New
lesson** or, when it has a review, a **Warm up**. Home's **Practice due** card offers the warm-up that's
due.

**Why this priority**: memory and practice are the harder-to-copy parts, and they only matter
once a second skill and reviews exist (spec 004 waves A and C).

**Independent Test**: on saved records (nothing learned; easing learned with a due date; skill 2
practicing; all six learned, two due), the Skills tab and `skill-detail` match the record and the path
data on every row, and Easing never offers a Warm up.

**Acceptance Scenarios**:

1. **Given** the path data and a record, **When** I open Skills, **Then** every skill in the path
   shows once, in path order, with its state, and skills not built yet say "Coming later" and can't be
   started (`skills-empty`, `skills-few`, `skills-many`).
2. **Given** a skill, **When** I open it, **Then** `skill-detail` lists each lesson from the record
   read-only, and its back control says "Back to Skills".
3. **Given** a review is due on a skill with a review, **When** I open Home, **Then** Practice due names
   the first such skill in path order and how many more are due; **When** I press Warm up, **Then** a
   review starts, tagged from the tool's `mode` (`practice`); **When** the comp has nothing new for it,
   **Then** `practice-nothing-new` says so and it stays due.
4. **Given** a lesson just passed, **When** I go to Skills, **Then** that skill's state and history
   already show it, without reopening the panel.

---

### User Story 6 - Set up and recover in plain words (Priority: P2)

When something breaks, a banner says what's wrong and what to do, in words a designer understands,
with no commands to type. The first-run walk (finding After Effects, signing in, opening a comp) is
**held** until the installer and spec 006 Q2.

**Why this priority**: the installer audience isn't developers (spec 006). The error copy can
change now. The sign-in step draws option A's access-key flow (`decisions/009`); the exact key
source waits on spec 006 Q2.

**Independent Test**: fault one thing at a time (no AE, mentor can't start, record unreadable, AE
busy) and compare each banner with the README state. The option A kinds run from recorded event
streams, since B1 can't produce them. The `setup-*` walk is tested when it's built.

**Acceptance Scenarios**:

1. *(Held with spec 006.)* **Given** the panel's first open after install, **When** it opens, **Then**
   `setup-welcome` shows three steps and Get started, and each step shows its progress
   (`setup-checking`, `setup-signin`, `setup-ready`).
2. *(Held with spec 006.)* **Given** the install is incomplete, **When** the panel opens, **Then**
   `err-notsetup` offers **Open the install instructions**, which opens them in the browser.
3. **Given** the mentor can't start, **When** I try any action that needs it, **Then** `err-mentor`
   shows (`err-key` or `err-credit` on option A's kinds), and Home's actions say "Needs the mentor."
   A passing kind shows as a notice in the lesson and leaves Home's actions alone.
4. **Given** any error state, **When** I read it, **Then** it contains no file path, command, tool
   name, field name or error code.

---

### User Story 7 - Every new button is evaluated (Priority: P1)

Every fixed request a new button sends to the mentor has an eval case that sends exactly that
request, and a test fails if the two drift apart. The eval sets that the build's mentor changes touch
stay at their baselines.

**Why this priority**: constitution III, and spec 003 FR-019's rule. A button is a new way of
asking the mentor to behave; untested, it can break the teaching without anyone typing anything.

**Independent Test**: run the panel's sync test and the eval sets (each built skill and next-mentor)
without AE; get a pass or fail per case.

**Acceptance Scenarios**:

1. **Given** the panel's request list, **When** the sync test runs, **Then** every request that
   sends text has at least one named eval case whose turn is that exact text.
2. **Given** a request's wording changes, **When** its eval case doesn't, **Then** the sync test
   fails.
3. **Given** any `SKILL.md` or tool behaviour change, **When** the build merges it, **Then** that skill's
   set is re-run and stays within one case of its baseline with no hard-rule failure. This build plans
   only one such change: `next-mentor` (FR-072).

---

### Edge Cases

From the README's "States still missing" and the specs this one sits on.

- **Two lessons at once.** Never: every start is replaced while a lesson is open (FR-024).
- **A lesson also open in a terminal.** Not supported, as in spec 003; nothing the panel does may
  write the record.
- **Up next names no skill.** With nothing stored there's nothing to go stale: the press reads the
  record and comp live. The stored version is a later option (FR-093).
- **The skill has nothing to focus on in this comp.** The mentor says so in the opening (spec 004 Edge
  Cases); the checklist shows no rows, never placeholder rows.
- **Agreeing by typing, on B1.** B1 can't hand over, so a typed "yes" stays in `lesson-picking` and the mentor may tell the learner to type a
  command (013 research R6). The panel can't judge wording (FR-065), so **Yes, let's go** stays until pressed. B1 is builder-only, so this is
  accepted. On A, typed agreement hands over.
- **Find my next lesson finds nothing.** `recommend_next` returns no recommendation: the mentor's words
  show, and **Yes, let's go** doesn't (FR-082).
- **A new lesson on a comp where one was left open.** End lesson and Set it aside don't touch the mentor's
  session, which keeps one lesson per skill and comp until it passes. The next lesson there picks up the
  old lesson's start, and its demo stays spent. The panel shows what the tool returns and says it's resuming (FR-092).
- **The mentor records a lesson that didn't pass** (the learner stopped; `result: partial`). `saved: true`
  arrives with no pass. No state is drawn for this (Open question D6); until then the panel shows
  "Saved to your history." with the ways out, and no pass line.
- **`record_lesson` failed after a passing check.** `lesson-passed` shows the pass but not "Saved
  to your history", and says the lesson couldn't be saved (PN-15).
- **Who eased or shaped a demo pair, when the tool can't tell** (`demo_credit` or `credit` is `unknown`, easing and
  speed graph). The row asks with a "?" and credits nobody; the mentor asks the learner (FR-016, D13).
- **Several reviews due, past Home's card.** Home's card names the first in path order and counts the rest; the rest stay
  ↻ in Skills with their Warm up. Spec 004 FR-020's one review offered per session is the mentor's, so the panel adds no
  limit of its own and shows the `mode` the tool returns (D14).
- *Held with spec 005:* **Huge comp.** The look still leads with at most 3; the status line keeps saying what's running
  until the result arrives (spec 005 SC-004 allows 30 s).
- *Held with spec 005:* **Stop looking after the mentor already found something.** Nothing is shown from a stopped turn
  (`diag-stopped`). Nothing is recorded (spec 005 FR-017 writes only at the end of a diagnosis).
- *Held with spec 005:* **"Fix all of it" typed in Ask during a diagnosis.** A normal reply in the mentor's words (spec
  005 FR-015). There is no button that could ask for it, deliberately (FR-045).
- *Held with spec 005:* **A remembered look on a comp that changed since.** Always shown with its date, its comp and
  "not re-checked" until a new read (FR-047).
- *Held with spec 005:* **The active comp isn't the last look's comp.** `diag-othercomp`: the remembered findings aren't
  shown, and the panel asks which comp you mean.
- **Out of credit or rate-limited.** Option A's kinds; each has its own treatment (FR-056). B1 can't
  report them.
- **A second AE project open, Windows, AE's lighter brightness settings.** Not supported in this
  release (Out of scope); nothing may break, and the dark theme is used regardless.
- *Held with spec 005:* **Track mattes** shown as "hidden, set aside" in Couldn't check. The reason text is data
  (PN-04); when spec 004's visibility class lands it says a hidden layer may be a matte, with no
  panel change.
- **A record from before this spec** (spec 002 version 1, easing only). Reads as it is; fields
  that don't exist yet leave their cards out, never show an error (FR-050).
- **Narrow and short docks.** At 260 px wide and 480 px tall, every state wraps without horizontal
  scrolling. At 560 px tall and under, one area scrolls at a time (FR-022).
- **A skill's record has a due date but no review** (easing). No Warm up, no Practice due, and no "Warm-up
  due" line at a pass (FR-021, FR-051).

## Requirements *(mandatory)*

### Structure and navigation

- **FR-001**: The panel MUST have three tabs, **Home**, **Lesson** and **Skills**, as `index.html`'s
  tab bar draws them, with Home selected when the panel opens.
- **FR-002**: The tab bar MUST carry the connection mark: a shape and a word (README ›
  Accessibility, not colour alone) for After Effects connected, not connected and busy, from the
  panel's existing bridge check (spec 003).
- **FR-003**: The Lesson tab MUST always go to the open lesson. With none open, it MUST show
  `lesson-none` (why it's empty, **Go to Home**, **Pick a skill**). No tab is ever disabled.
- **FR-004**: Every back control (‹) MUST say where it goes in words: "Back to Home. Your lesson
  stays open.", "Back to Skills" (and, held with spec 005,
  "Back to the top 3").
- **FR-005**: Switching tabs MUST NOT end, restart or change a lesson, or send anything
  to the mentor.
- **FR-006**: The panel MUST implement every state in the README's "Every state" table by its id, with
  the trigger and source given there, except the option B states (Out of scope), the review views
  (`all-checklists`, `all-openings`, `compare-stage`, `compare-upnext`, `home-held-slot`, and the `cmp-*` screens inside them), `home-return-stored`
  (FR-093) and the states held until a dependency ships (Build order › States by dependency). It adds one id the
  table doesn't have, for step 1 only: `home-return-interim`, Home with a record before step 2 (plan P9). T052 removes it.

### Home (option A, path-first)

- **FR-007**: Home MUST show, in this order: **Up next** with its source (FR-009); the held slot's place
  (nothing drawn this build); **Practice due** when a review is due; **What the mentor remembers**. A card
  with no data is left out, not shown empty (except `home-first`'s "No lessons yet"). Up next's button
  MUST be above the fold at 260 × 480 px. *(Amended 2026-11-02, revision 3 and decision 1: no diagnosis
  or question card. Open question 3's "both starts above the fold" holds when spec 005 lands, in the
  held slot.)*
- **FR-008**: Home MUST be drawn from the learner record and the path data alone, with no mentor
  turn, so opening it costs nothing (README › Home). If the read takes more than 300 ms
  it MUST show `home-loading`.
- **FR-009**: Up next has two sources in this build, each with no mentor turn to draw: no record: the
  path's starting skill with **Start lesson**; a record: "Your next lesson", no skill named, with **Find
  my next lesson** (RQ-15), one `/next-mentor` turn when pressed, opening `lesson-picking`. A stored
  recommendation is a later option (FR-093).
- **FR-010**: With no record, Up next MUST be the path data's starting skill (PN-16), not a skill the
  panel picks.
- **FR-011**: The panel MUST tell a missing record from an unreadable one. Unreadable MUST show
  `home-unreadable` and MUST NOT be treated as a first run (the 2026-10-12 agent audit's rule:
  unreadable is not empty). Today's `panel/lib/memory.js` returns the same thing for both, which
  this changes.
- **FR-012**: **Start lesson** MUST send that skill's start request (RQ-01), which opens the named
  skill's lesson as today. No lesson opens with a diagnosis (Open question 1, answered (a)).
- **FR-013**: **Pick a skill** MUST go to the Skills tab.

### Lesson

- **FR-014**: The lesson header MUST show the skill's name and the focus, and a practice tag for a warm-up,
  from which tool ran and its `focus` and `mode` (no new mentor data), plus a one-line **Pick · Try · Done**
  strip, replacing I do / We do / You do. **Pick** is the start. **Try** begins at the first reply, first
  check or demo, or at once when the lesson's first snapshot returns `lesson` as `continued` or `resumed`; targets alone
  don't start it, because easing, speed graph and offset have them at the opening. A lesson reached from `lesson-picking` starts at Pick from its first
  snapshot ("Yes, let's go" isn't a reply), on both runtimes (FR-082). **Done** is the check's own `passed`. A demo is an event, in its box and on its row,
  never a step. All of it derives from tool results and sends, never the mentor's wording. *(Spec 003
  FR-009's three stages don't carry over.)*
- **FR-015**: The checklist MUST dock above the buttons. Rows at the opening come from the opening
  snapshot's targets, each marked **Proposed**, with the header naming the source ("Based on the mentor's
  last look at your comp."). The mark MUST drop at the learner's first reply or first check, whichever is
  first. Whenever a snapshot returns new targets, the rows MUST change to them, unless the rows came from
  a check: those stay until the next check (builder's decision, 2026-11-09). With no targets at the
  opening (key types, the pivot, null, by design) the slot MUST say what fills it, naming no candidate.
  Easing's opening rows are all its linear pairs (with no label yet, FR-100). There is no accept signal, so the panel MUST
  NOT claim the focus was agreed. A `continued` or `resumed` lesson isn't marked Proposed (FR-092).
- **FR-016**: After each check, the rows MUST come from that check's result, not the mentor's wording, and
  agree with it every time (spec 003 FR-007 carried over), with each state shown as a glyph and a word per
  the README's per-skill table and [contracts/checklist-rows.md](contracts/checklist-rows.md). An unknown
  code MUST read "Not checked yet", never a pass. When the tool says it doesn't know who did the work (`demo_credit` or
  `credit` is `unknown`), the row MUST be a "?" row that credits nobody (D13). The summary's "passed" and the Done step MUST come from the
  tool's `passed`, never from counting ticks. Changes outside the focus MUST be listed apart as "Outside
  this lesson · not counted". The button is labelled **Done, check it**; its request is unchanged (RQ-14).
- **FR-017**: When After Effects can't be reached mid-lesson, on another comp (`lesson-othercomp`), or on an
  ungraded null check, the list MUST be marked stale: the note, the summary and all pass and fail results
  (glyph and word) stay at full contrast; only row labels dim, to a level that keeps 4.5:1 on the list's
  own background. Detail lines and section heads don't dim. Hint MUST pause with "Hint needs After Effects."
  (`lesson-stale`). No check result is shown for that turn (spec 003 FR-015). The same treatment covers
  `lesson-continued` and `lesson-exited`. `panel/test/contrast.test.js`'s `todo` MUST be cleared.
- **FR-018**: After the lesson's demonstration, the change MUST appear in its own "Changed in your
  comp" box built from the demonstration tool's result, saying Edit > Undo reverses it and naming
  no undo label (server rule 1). Frames shown are the ones the mentor rendered in that turn; the
  panel renders none itself.
- **FR-019**: **Show me** MUST show only while the latest snapshot names a demo target (on null, also once
  the check says the null is ready), and never in a review. It reads **Show me again** after the
  demonstration. After a cut-off that may have landed a demo (`demo_unknown`, FR-030) neither shows until a later snapshot or
  check settles it. No control may ask for a second demonstration or for the mentor to do the rest (spec
  003 FR-006 carried over).
- **FR-020**: Hint MUST appear from the first check on (spec 003 FR-005).
- **FR-021**: A check's pass and the save are separate moments. A passing check with no save yet MUST show
  `lesson-passed-asking` ("Check passed.", Ask stays). `lesson-passed` MUST show **Lesson passed.**, the one
  plain line for every skill (`practice-passed`: "Review passed."), and **Saved to your history** only when
  `record_lesson` returned `saved: true` in that turn (PN-15), else `lesson-passed-unsaved`. A "Warm-up due"
  line comes from the record's `review_due`, only on a skill with a review. Its two ways out are **What's
  next ›** (to Home) and **See your skills**.
- **FR-022**: The chat MUST be the only part of the Lesson tab that shrinks. At **560 px tall and under**,
  one area scrolls at a time: the checklist is its one-line summary with a large toggle arrow and no text
  label; pressing it swaps the chat for the rows, and pressing again swaps back; after a check the panel
  stays on the chat. Taller docks keep the chat and checklist together. The buttons and Ask MUST never be
  clipped. *(Amended 2026-11-02, decision 5; replaces the 30% cap.)*

### Lesson in progress

- **FR-023**: Only one lesson may be open at a time, in the whole panel.
- **FR-024**: While a lesson is open, Home MUST show **Lesson in progress** with **Back to lesson** and **End
  lesson** (gray secondary), and MUST replace Find my next lesson, Start lesson, Warm up and Skills' New
  lesson and Warm up with "Available after your lesson." (`home-lessonopen`).
- **FR-025**: **End lesson** MUST close the lesson and return to Home. Whether ending an unfinished
  lesson records anything is Open question 2; until it's answered, nothing is recorded (spec 003
  edge case), and the panel says so in one line before ending.
- **FR-026**: If the panel is closed and reopened during a lesson in the same AE session, Home MUST
  show `home-cutoff`: **Your lesson is waiting** on top with **Continue lesson** and **Set it aside**, and
  Up next pushed back (dashed border, full contrast, not the primary button).
- **FR-027**: **Continue lesson** MUST reopen the lesson as `lesson-continued` (redrawn, a divider, and a
  note where a frame from before can't be shown). **Set it aside** MUST return to Home with the
  record untouched.
- **FR-028**: `home-aeclosed` MUST show only when the bridge answers with a start time different from the saved session's:
  once, dismissible, and the lesson is gone (spec 003: continuing works only within one AE session). If the bridge is busy or
  absent, the panel MUST keep the saved session, show neither `home-aeclosed` nor `home-cutoff`, and re-check on the connection
  poll (FR-091); a matching start time then shows `home-cutoff`. (`bridgeStarted()` returns null for both, including on a 2 s
  timeout, and `canContinue` reads null as "can't", so neither can decide this alone.) Starting a new lesson meanwhile replaces
  the saved session, as today. A saved session with no start time can't be compared, so it shows neither state.
- **FR-029**: When a turn is cut off without the process ending (timeout, or a turn that ends not ok), the
  panel MUST show `lesson-error` with the partial reply marked "cut off" and **Try again**, which resends the
  last request unchanged. On B1 a timeout leaves the old process running, so Try again MUST stop it and resume
  the session before resending (FR-097). `process_exited` isn't this state: it ends the lesson (FR-056).
- **FR-030**: If the cut-off turn was **Show me** and its change result had arrived, the retry MUST be **Show me
  again**. If no result had arrived, the panel MUST offer **Done, check it** instead, so a retry can never ask
  for a second demonstration (`lesson-error-demo`). **Third case, option A only:** if no demo call started,
  Show me may be resent, because A's `tool_call` is sent only for calls that will run. **B1 can't tell the same**
  ([research.md](research.md) R5), so on B1 no result always means the check. Whenever the panel can't rule out a demo (no
  result, and on A a `tool_call` was seen) it MUST set `demo_unknown`, which hides Show me and Show me again. A later snapshot
  that names a demo target clears it; a snapshot that doesn't leaves it set; a check whose rows mark a demo (`credit`,
  `demo_credit`, `held_by_demo`, `eased_by_demo`, `demo_undone`) makes it `demo_made`, and a check with no such mark clears it.
  The tools' `DEMO_USED` refusal remains the backstop on both.

### Diagnosis screens (spec 005) (HELD: FR-031 to FR-045 and FR-047 aren't this build, decision 1)

- **FR-031**: **Look at my comp** on Home MUST send the look request, without (RQ-03) or with
  (RQ-04) the symptom typed in **What looks off?**.
- **FR-032**: While a look runs, the panel MUST show the tool status lines and **Stop looking**,
  and pause every other start (`diag-running`, `diag-symptom-running`, which also shows "You said
  …").
- **FR-033**: `diag-results` MUST show: the scope line (when, which comp, how many found, PN-03);
  the mentor's short read (its words); at most 3 findings in the rank the result gives, one marked
  **Start here** (PN-01); "See the other N ›" and how many of those are questions (PN-02); and the
  Couldn't check list (PN-04). The panel MUST NOT rank, filter or count findings itself beyond
  showing the result.
- **FR-034**: Each finding MUST show its kind (Style, ? Question, and Setting once spec 005 US4
  ships) as a glyph and a word, its title and its where, from the result. Ask findings MUST also
  have a dashed border.
- **FR-035**: A finding's action MUST be: **Learn: skill ›** when its covering skill is built
  (RQ-05); **No lesson yet · Get hints ›** when it has none or the skill isn't built (RQ-06); and,
  for style findings, also **That's on purpose** (RQ-08). An unbuilt skill MUST NOT be offered
  (spec 004 FR-006).
- **FR-036**: **See the other N** MUST show `diag-rest` from the result already in hand, with no
  new turn: findings numbered on from 4, never repeating the top 3, ask findings as questions with
  the answer buttons the result gives for them (RQ-09).
- **FR-037**: Panel text MUST NOT call a finding a mistake or say keys "do nothing" (spec 005
  FR-006, Edge Cases). Finding titles and answer wording are data from the catalogue, not panel
  copy.
- **FR-038**: `diag-hints` MUST show **Where to look** (panel, layer, property, time; PN-05), the
  mentor's hint, and **Done, check it** (RQ-07).
- **FR-039**: A re-check MUST show `diag-recheck-gone`, `-still` or `-changed`, plus what's still
  open, only from a re-check result produced in that turn (PN-07). If the turn has no fresh result,
  no re-check state is shown (spec 005 FR-014).
- **FR-040**: After **That's on purpose** or an "on purpose" answer, `diag-intended` MUST say the
  finding is dropped for this comp, and the rest stay open.
- **FR-041**: A symptom look MUST show `diag-symptom-results` with matched findings first, or
  `diag-symptom-none` when the result says nothing matched (PN-06). A clean result MUST show
  `diag-clean` with the scope line and the Couldn't check list.
- **FR-042**: A repeat look on the same comp MUST show `diag-again`: **Since date** with what looks
  fixed, what changed, and what was marked on purpose, then the still-open top 3 (PN-08). A look
  whose comp isn't the remembered look's comp MUST show `diag-othercomp`, hide the remembered
  findings, and offer **Look at this comp instead** (RQ-10).
- **FR-043**: Failures MUST show `diag-nocomp`, `diag-unreachable` (no claims about the comp),
  `diag-busy`, `diag-error` (nothing partial shown, Try again) and `diag-stopped` (nothing partial
  shown, Look again). A findings list MUST be drawn only from a complete result.
- **FR-044**: Every diagnosis answer MUST end "Looked only: no changes were made." only when every
  tool that ran in that turn is on the panel's list of tools known not to change the project. If
  any other tool ran, or the panel can't tell, the line MUST be left out (fail closed).
- **FR-045**: The diagnosis screens MUST offer no control that asks the mentor to fix a finding,
  fix everything, or do the rest (spec 005 FR-011, FR-015).
- **FR-046**: **Ask the mentor** MUST be available on the Lesson tab below the buttons (spec 003 FR-008),
  including `lesson-picking`, `lesson-passed-asking` and, from 2026-11-09, after a pass (`lesson-passed`,
  `lesson-passed-unsaved`), in the same mentor session; not on Home or Skills (D2, settled). A question after a
  pass MUST NOT write a second lesson record. Builder's decision after T028; a separate Ask tab is later work.

### Skills, memory and practice

- **FR-047**: A remembered diagnosis shown anywhere (Up next's reason, the question card,
  `diag-again`) MUST carry its date, its comp and "not re-checked" until the mentor reads that comp
  again.
- **FR-048**: The Skills tab MUST list every skill in the path data once, in path order, in one list with no
  groups, counted over built skills, with its state as a glyph and a word: learned ✓, practice due ↻, in
  progress ◐, not started ○, coming later · (not built, not pressable). The on-ramp reads "We assume you know
  this". Up next ▸ shows only with a source, so not in this build. Getting rusty isn't drawn.
- **FR-049**: `skill-detail` MUST list the skill's lessons from the record, read-only, with **New lesson**
  (RQ-02) and, on a learned skill **with a review**, **Warm up** (RQ-11). `skill-detail-new` says what it builds
  on from the path's hard prerequisites and never blocks.
- **FR-050**: **What the mentor remembers** MUST show the record's recent lessons with their date, skill, result
  and the `next` note as written (PN-10 dropped: since the pacing rules it's written plainly; a real one that
  reads badly is the case for bringing PN-10 back). Missing fields from an older record MUST leave that part
  out, never show an error or an internal note.
- **FR-051**: **Practice due** MUST show when the record's `review_due` is today or earlier on a learned skill
  with a review: one card, the first in path order, with a count of the rest in Skills, and no expected length.
  The panel MUST compare the stored date with today and nothing more; it MUST NOT compute a schedule. Easing
  never shows it, whatever its record's date says.
- **FR-052**: A warm-up MUST open as `practice`: tagged from the tool's `mode`, no Show me in any state, Hint after
  the first check, the same rows as a lesson, Proposed where the tool has targets. `no_new_target` MUST show
  `practice-nothing-new`.
- **FR-053**: Home, Skills and `skill-detail` MUST update when a lesson is recorded,
  without reopening the panel (spec 003 FR-011 carried over).

### Setup and errors

- **FR-054**: *(Held until the installer and spec 006 Q2; this spec doesn't try to resolve Q2.)* On the first
  open after install, the panel MUST walk `setup-welcome`, `setup-checking`, `setup-signin` and `setup-ready` to
  `home-first`. `setup-signin` draws option A's access-key flow (`decisions/009`); the mockup still draws a
  browser sign-in, and stays so until Q2.
- **FR-055**: *(Held with FR-054.)* An incomplete install MUST show `err-notsetup` with **Open the install
  instructions**. Until then the panel's existing not-set-up message stays, for the builder only, and is the one
  named exception to FR-058's scan.
- **FR-056**: Errors MUST follow the README's option A table, by kind, in the mockup's final wording:
  - **Blocking** (Home's actions say "Needs the mentor."): `start_failed` → `err-mentor`; `not_signed_in` →
    `err-key`; `out_of_credit` → `err-credit`.
  - **Passing** (a notice in the lesson; the list isn't dimmed; Home's actions are left alone): `rate_limited`
    → `lesson-pass-rate`; `service_busy` → `lesson-pass-busy`; `offline` → `lesson-pass-offline`; `refused` →
    `lesson-pass-refused` with no Try again. On a lesson's first turn, any of them → `lesson-start-failed`.
  - `timeout` → wording in `lesson-error`.
  - `process_exited` → `lesson-exited`: the lesson is over and nothing was saved.
  - **On B1** only `start_failed`, `not_signed_in`, `timeout`, `process_exited` and the logged-only `bad_stream` occur.
    `not_signed_in` there means Claude Code's sign-in, not an access key, so B1 shows `err-mentor` and logs the detail. The
    other kinds are tested from recorded streams (`decisions/011`: A's errors use the fake service).
  - **Logged only, never shown:** `bad_stream`, `busy`, `bad_command` and `not_implemented`. They MUST be listed by name
    ahead of the fallback that sends an unknown kind to `start_failed`, so one bad stream line can't block a lesson.
  - **Check setup** has no screen until spec 006, so this build draws no Check setup button (Open question D9).
  This replaces `panel/lib/errors-a.js`'s interim wording (spec 013's contract expects it).
- **FR-057**: When After Effects is unreachable or busy, Home MUST show `home-unreachable` (red,
  AE actions replaced by "Needs After Effects.") or `home-busy` (amber).
- **FR-058**: Errors, banners and status lines MUST NOT contain a file path, a command, a tool name, a
  field name or an error code. Developer detail MAY go to the panel's log, which follows FR-068.
- **FR-059**: The panel's Check setup screen is spec 006's. This spec only places its entry (the
  panel flyout and the `err-*` banners) once spec 006 builds it.

### Buttons, status lines and copy

- **FR-060**: Every button that sends something MUST show it was pressed (spinner and a verb),
  pause every other action, and show a status line, until the turn ends (spec 003 FR-012 carried
  over: no duplicate requests).
- **FR-061**: A paused or replaced action MUST say why in words ("Hint needs After Effects.", "Available after
  your lesson.", "Buttons turn on after the mentor looks at your comp.").
- **FR-062**: Status lines MUST come from which mentor tool is running, as `panel/lib/activity.js` does, extended
  to every tool in all six skills and next-mentor. A line MUST claim only what its tool does. A test MUST fail
  if a tool in any `*-mentor` skill's `allowed-tools` has no line, except `Skill`, which never reaches the panel (`stream.js`
  passes on only `ae-mentor` tools).
- **FR-063**: Product copy MUST be the mockup's wording (`index.html`, with `copy-pass.html` keeping the before
  and after), plain, with a little natural voice. Errors say what to do. The mentor's words are the skill's and
  aren't panel copy.
- **FR-064**: The panel MUST NOT show internal field names, record or catalogue ids, tool names or
  raw data (spec 003 FR-017 carried over).

### Rules carried from the decisions

- **FR-065**: The panel MUST hold no teaching or diagnosis logic: it MUST NOT rank findings, pick a
  focus, recommend a skill, schedule a review, judge a check, or decide a lesson's stage from the
  mentor's wording (constitution II, spec 005 FR-023). Everything it shows besides the mentor's
  words comes from tool results, the learner record or the path data.
- **FR-066**: The panel MUST NOT read or change the After Effects project except through the
  mentor's tools (spec 003 FR-014).
- **FR-067**: The panel MUST only read the learner record and the path data, never write or copy
  them. A lesson's data MAY be kept in memory for display. It MUST NOT be saved across sessions, with one exception: the
  display log (`panel-session.json` and `panel-frames/`, FR-026), which holds one lesson's view and messages so it can continue
  and is replaced by the next lesson. The turn log (`panel-turns.jsonl`) holds timings and no message text. The panel writes
  nothing else in the learner's home.
- **FR-068**: The panel MUST add no real names, emails or phone numbers to anything it stores or logs (constitution IV).
  What a learner types in Ask is sent to the mentor and kept only in the local display log, never in the turn log or console output. That stands for this build, and the builder revisits it before the first tester (T080).
  A typed symptom *(held with spec 005)* is sent to the mentor, not stored by the panel.

### Requests and evals

- **FR-069**: Every fixed request the panel sends MUST be written once, in one place, as spec
  003's `panel/lib/requests.js` is. A request MAY have parameters (a skill, a finding, a layer, a
  symptom, an answer); its fixed wording around them is the request.
- **FR-070**: Every request in the table below that sends text and isn't held MUST have at least one eval case
  that sends it, written by the eval engineer in the eval set named, scored on that set's teaching rubric (spec
  003 FR-019's rule). Exact text per skill: [contracts/button-requests.md](contracts/button-requests.md).

  | ID | Request (button) | Sends text? | Eval set | Notes |
  |---|---|---|---|---|
  | RQ-01 | Start lesson (`home-first`, `lesson-exited`) | Yes, `/ease-mentor` or the lesson's own command | each built skill's set | Cases already exist with the bare command |
  | RQ-02 | New lesson (a skill picked in Skills) | Yes: `/<skill>-mentor lesson`; easing `/ease-mentor` | the five sets with reviews | Must ask for a lesson, or the tool may choose a due review. One case each on a due record |
  | RQ-03 to RQ-10 | Diagnosis requests | **Held with spec 005** | diagnosis | Kept as written on 2026-10-20 in git history; come back with spec 005's plan |
  | RQ-11 | Warm up | Yes: `/<skill>-mentor review` | five sets | Key types, speed graph and offset have this exact turn; the pivot and null need a case. Never easing |
  | RQ-12 | Continue lesson | Yes (exists) | all six | No set has a case today; one each |
  | RQ-13 | Try again | Resends the last request | easing | Two cases: Show me again after a cut-off demo that landed; the check after a cut-off demo with no result |
  | RQ-14 | Done, check it; Hint; Show me; Show me again | Yes. Text unchanged, except Show me again on the five new skills, whose wording can't say "pair" or "eased" | all six | Easing's cases 17 to 20 are unchanged. None of the other five sets has these turns; one each |
  | RQ-15 | Find my next lesson | Yes: `/next-mentor` | next-mentor (new set) | No such set exists today |
  | RQ-16 | Yes, let's go | A: `Yes, let's go.` B1: starts the recommended lesson (FR-082) | next-mentor (new set) | Four cases each way, covering the usage note's items 1, 2 and 5. B1's stop at the recommendation and the follow-on start; real hand-overs run on A only (contract) |
  | — | Set it aside, End lesson, Pick a skill, tabs, back, fold, Flip, the checklist's arrow | No | — | Panel tests (FR-073), not evals |


- **FR-071**: The panel's requests-eval-sync test (`panel/test/requests-eval-sync.test.js`) MUST be kept and
  widened: for each request that sends text and isn't held, on each skill, it names a case and checks that the
  named turn is that exact request. A change to a request without its case fails the test. *(Amended 2026-11-02:*
  easing's cases keep "every turn is a panel request"; on key types, the pivot and null a case has to answer
  in typed words before any button can apply, because those skills ask first, so there the rule is the named
  turn only.) Case numbers and files are the eval engineer's; the test only names them.
- **FR-072**: This build's only `SKILL.md` or tool behaviour change is `next-mentor`'s hand-over table (PN-17, already on `main`, `6094ee9`), so
  **no existing set needs a full re-run** because of the panel: new cases run with `--only`. If a new case fails
  and is fixed with a `SKILL.md` change, that skill's whole set is re-run and MUST stay within one case of its
  baseline (easing 27/28, key types 29/30, speed graph 29/29, offset 33/37, pivot 48/50, null 42/44, on
  2026-10-29) with no hard-rule failure.
- **FR-073**: Actions that send no text (the last row above) MUST each have a panel test. End lesson and Set it
  aside MUST also have a test that the learner record is unchanged afterwards.

### Accessibility (README › Accessibility)

- **FR-074**: Every text colour MUST reach 4.5:1 contrast on the background it sits on. Step 0 fixed the three tokens
  that failed: muted `#8a8a8a` → `#9a9a9a` (4.10:1 → 5.03:1 on raised cards); red `#e5534b` → `#ff7b72` (4.24:1 → 6.23:1);
  and the filled primary button's background `#2d8ceb` → `#1473e6` (white text 3.46:1 → 4.54:1). New colours keep to this.
- **FR-075**: A state MUST NOT rely on colour alone: each has a glyph and a word; ask rows have "?"; the connection
  mark changes shape. Pushed-back cards are dashed, not faded, and keep full contrast. Stale lists follow FR-017:
  only row labels dim. Offset's timeline is hidden from screen readers, and its detail line says the same.
- **FR-076**: Body text MUST be 12 px, and text MUST NOT be under 11 px anywhere, in every panel script, subfolders included.
- **FR-077**: The tabs MUST be a real tablist (`role="tab"`, `aria-selected`, `aria-controls`, a
  tabpanel) with roving tabindex and Left, Right, Home and End keys.
- **FR-078**: After a tab change, focus MUST stay on the tab. After an action, focus MUST move to
  the newest mentor message or notice, else the banner, else the screen's title.
- **FR-079**: Every action MUST be reachable and usable by keyboard alone.
- **FR-080**: With reduced motion on, the spinner MUST slow and skeletons MUST stop animating.
- **FR-081**: At 260 px wide (the minimum) and 480 px tall, a state MUST NOT scroll sideways, and
  long text MUST wrap.

### Added 2026-11-02 (mockup revision 3)

- **FR-082**: `lesson-picking`: Find my next lesson MUST open the Lesson tab with the mentor's one suggestion, no
  strip and no checklist. **Yes, let's go** (RQ-16) MUST show only when the latest `recommend_next` result has a `recommendation`
  and no `requested`, and the recommended skill is in the panel's skill table; otherwise Pick a skill is the way on. **Pick a skill**
  MUST end the picking process, with nothing recorded. Yes MUST get the learner into the recommended lesson on both runtimes:
  - **On B1,** which can't hand over (013 research R6, FR-042: hand-overs are tested on A only), the panel MUST end next-mentor's process,
    send it nothing more, and start the recommended skill's own lesson with that skill's list, by the request
    [contracts/button-requests.md](contracts/button-requests.md) maps from `recommendation.skill` and `kind`: the plain command, or `review`, never layers. It works the same when `focus_layers` is empty, null or very long. The panel only reads
    those fields and looks the skill up in its table; it doesn't choose the skill or the lesson's focus (FR-065, `decisions/005`).
  - **On A,** Yes MUST send `Yes, let's go.` in the same conversation, and the real hand-over runs (013 T060). The lesson's skill comes from the
    next tool that runs.
  - **What the learner sees on either:** "Yes, let's go" in the chat, the button's "Starting…" and the status line "Getting your lesson ready…",
    other actions paused; then the lesson's opening under the suggestion, with the skill's header, the strip on Pick and its checklist slot. On B1
    the mentor starts a new conversation, so its opening may repeat the suggestion, and the header changes at the press. A failed start shows
    `lesson-start-failed`, and nothing is recorded.
  - **Known gap:** the suggestion may name layers, and then the lesson asks or proposes as it does today, on its own terms. The suggestion's wording is the mentor's, so an
    empty or very long layer list is a known risk there, not a panel fix ([plan.md](plan.md) › Risks).
- **FR-085**: Following the lesson, all panel-only, per README › Following the lesson: older turns fold ("Earlier in
  this lesson (3)"); done rows fold at short docks; "Next: …" under the summary is the first open row in the tool's
  order, never re-ranked; "1 more since your last check" and a bar on changed rows come from comparing two results;
  frames are small at short docks and full size on press; **Flip** moves between a turn's frames, manually. Each is
  a real button or `details`.
- **FR-086**: Each skill's rows MUST follow the one pattern (glyph, subject, word, optional detail; optional sections,
  footer, Outside, Worth a look), mapped from its check tool per [contracts/checklist-rows.md](contracts/checklist-rows.md).
  Speed graph's `fastest` MUST NOT show. The pivot and null's `other_changes` kinds get panel words.
- **FR-087**: The panel MUST run all six skills and next-mentor on B1, each on its own `allowed-tools` from the launch (spec 013 FR-042, landed with
  013 T065; [plan.md](plan.md) › Shared work with spec 013), without `Skill`, which FR-042 forbids. Every start and resume MUST pass the skill, as `main.js` now does for easing, because a
  skill's frontmatter grants its tools for one turn only: without the launch list a lesson works once and is denied on its second turn (013 research
  R6). A test MUST compare the list with the `SKILL.md` files. Option A's helper already reads each skill's list itself, so this is B1's gap alone; the status
  lines (FR-062) are a gap on both.
- **FR-088**: Offset's small timeline MUST place rows on one shared scale per lesson, taken from the tool's results as
  [plan.md](plan.md) P5 defines. It's a ruler with the first key as a diamond, never a meter.
- **FR-090**: Panel CSS and scripts MUST use only what AE 26.5's CEP browser runs (CEF 99, Chromium 99): no `:has`, no
  container queries, and no newer script features such as `toSorted` or `Object.groupBy`. The short-dock rule uses a height
  media query and a class set by script (plan.md P4). An automated scan over `panel.css`, `index.html`, `main.js` and
  `panel/lib/**` MUST fail on the features it lists (plan.md P4). `panel/helper/` runs under Node, not CEF, so it's out. There's
  no CEF in the tests, so the scan is a named list, not proof; the live sittings cover the rest.
- **FR-091**: The connection mark and `home-unreachable` / `home-busy` MUST come from the bridge's `/health` alone, polled
  (plan.md P6): an answer is connected, nothing listening is not connected, no answer within 2 s is busy; a tool's
  `AE_BUSY` or `AE_UNREACHABLE` also sets it. It carries no project data (FR-066).
- **FR-092**: End lesson and Set it aside MUST NOT claim the next lesson starts over. They end the panel's lesson and
  record nothing. If the next snapshot says the lesson is `continued` or `resumed`, the panel shows what it returns: its
  targets, unmarked and with the strip on Try, with Show me only if it names a demo target (Open question 6, answered). The panel MUST
  say it's resuming, whichever button started it, New lesson included, from the tool's `lesson` value alone (D16).
- **FR-093**: **Later option, not this build:** a stored recommendation (`home-return-stored`). The mockup's simplest
  design: `record_lesson`'s handler also calls `recommend()` with no snapshot and writes `{ skill, skill_name, reason, at }`
  to the record. It's server code with unit tests and no prompt change. It adds a field to what `read_learner_record`
  returns, so re-run easing and next-mentor if it's built.
- **FR-094**: The per-skill reason lines from the README (for example, offset: "Stop everything moving at once.") MUST be
  kept in the panel's copy, ready for FR-093. Easing's line in this build is `home-first`'s. They name no layer and make no
  claim about the comp.
- **FR-095**: `home-unreadable` MUST also show when `learner.json` is gone and a `learner.json.unreadable-*` file sits beside
  it, because the mentor moves a broken file aside on its first read; that is not a first run. Validity MUST match the
  mentor's: an object with a `skills` object and a `lessons` array.
- **FR-096**: Spacing (12 px side margins and the looser gaps), the one large bright toggle arrow (checklist and "Earlier in
  this lesson") and End lesson's gray secondary button MUST match the mockup.
- **FR-097**: The panel MUST be built and evaluated on B1 throughout this build, as `decisions/011` rules for panel features,
  and MUST NOT wait on spec 013's unfinished runtime work (013 T043, T044). Option A's kinds are mapped and tested from recorded
  streams only. Work both specs touch has one owning task, whichever spec gets there first ([plan.md](plan.md) › Shared work with
  spec 013). If this build merges into `panel/` before 013's open tasks run: 013 T049 checks B1 against the panel as merged (with
  `adapter-claude-code.js` changed by this spec's T023 and `main.js` by its T041 and T052), 013 T044 wires into `panel-session.json`
  version 2, which keeps `claude_session_id` (P8), and 013 T021 follows the same steps with the new labels. The requests don't
  change, so no eval is affected.
- **FR-098**: `lesson-focus-stale` MUST be shown honestly, not hidden: when a reply gets no re-read, the old rows stay,
  unmarked, saying "Based on the mentor's last look" and "Updates at your next check." The live lessons MUST log how
  often it happens (SC-014).

### Added 2026-11-04 (review of the approval, `decisions/011`)

- **FR-099**: Before any tester sees the overhauled panel, it MUST go through `decisions/011`'s path from B1 to A: the free check
  (`product/evals/lib/ready-for-a.mjs`, 013 T067); a free dry run (`--runtime a --dry-run`) on each set with new cases and on the
  next-mentor set; a paid run on A at spec 013 FR-033's bar; a live lesson on A (`bash panel/install.sh --runtime a`, 013 T066).
  The two free steps belong to this build (T077). The paid steps wait for the builder's go and don't hold this build's stop
  points open (T078, T079).
- **FR-100**: Easing's opening rows take their labels from `findings`, kept by id, and `findings` lists only pairs that still need
  ease. A `continued` or `resumed` lesson takes `targets` from its baseline, so a target can have no label, and FR-092 makes that
  a normal path. Targets without a label MUST be one count line under the labelled rows until the next check names them (D15). A
  check's `label` can be the id itself (`mentor/lib/diff.mjs`); a label equal to the row's `segment_id` MUST read as an unnamed
  pair (D15). No id ever shows (FR-064).

## What the panel needs from the mentor

Revision 3 needs far less than revision 2 did. **One mentor change left in this build: PN-16's data file. PN-17's table rows are done (`6094ee9`).** PN-01 to PN-08, PN-09 and PN-12 are held; PN-10, PN-13 and PN-14 are dropped for now. Items built under other
specs are this spec's requirements on those specs' shapes; the cockpit should pass them on.

**Diagnosis result** (one structured result per look, as `diff_since_last` is today):

- **PN-01**: Per finding: rank, which one to start with, kind (style, ask, setting), state (open,
  fixed, changed, intended), the learner-facing title and where, the layer to propose as a lesson
  focus (spec 005 FR-012), the covering skill or none, and, for ask findings, the answer options
  and which of them means "on purpose". The result MUST hold every finding in rank order, not
  only the first 3.
- **PN-02**: The count beyond the first 3 and how many of those are ask findings. Given PN-01's
  full list, the panel counts it; no separate field is needed.
- **PN-03**: The comp's id and name, and the read's date and time.
- **PN-04**: A not-checked list: what, and why (inside a precomp, expression-only motion, not read
  yet, hidden), as plain reasons.
- **PN-05**: For findings without a skill: where to look (panel, layer, property, time).
- **PN-06**: The symptom as received, and whether any finding matched it.
- **PN-07**: A re-check result per finding (gone, still, changed) plus the still-open list, from a
  fresh read in that turn.
- **PN-08**: On a repeat look at the same comp, "since last time": fixed, changed (with before and
  after counts), intended, and the date of the earlier look.

**Learner record** (read by the panel; written only by the mentor):

- **PN-09**: *(Later, FR-093.)* Up next: the skill, its reason, and when it was suggested. Today the record has only a
  free-text `next` note.
- **PN-10**: *(Dropped for now, decision 2 and README.)* `next` is shown as it is (FR-050).
- **PN-11**: Per skill, when its next review is due: `review_due`, already there. *(Amended: no expected length.)*
- **PN-12**: Unanswered ask findings from the last look on each comp, for the question card.

**Lesson** (from tool results in the turn stream):

- **PN-13**: *(Dropped for now.)* Title and focus come from tool names and results; the mode from `mode`.
- **PN-14**: *(Dropped for now, decision 2.)* No accept signal. Opening rows come from existing `targets`.
- **PN-15**: Whether `record_lesson` saved. Its result already says `saved: true` on success; the
  panel MUST treat anything else, including no result, as not saved.

**Path data**:

- **PN-16**: The path's skills in order with their names, from `mentor/curriculum/path.json` (exists), plus which skills
  are built and which have a review, from a **new small generated data file** (`mentor/curriculum/skills-built.json`,
  written from the tool files' `SKILLS` and `FINDERS`, with a test that fails if it's out of date). Skill-builder owns it;
  the panel only reads it. The starting skill is position 0. It replaces the fixed list in `panel/lib/path.js`.

**Skill hand-over**:

- **PN-17**: `next-mentor/SKILL.md`'s hand-over table MUST list all six skills. **Done on `main` (`6094ee9`).** It had omitted Set the pivot and Move a group with a
  null, though `recommend_next` does suggest them (checked by running it: [research.md](research.md) R2). Only A follows this table (FR-082), and its rows are unproven until T078.

**Who changes what**:

| Item | Status | Change | Built under | Eval cost |
|---|---|---|---|---|
| PN-01 to PN-08, PN-12 | Held | Diagnosis tools and record | Spec 005 | Spec 005's |
| PN-09 | Later | `record_lesson`'s handler | Later decision | Easing and next-mentor re-run if built |
| PN-10, PN-13, PN-14 | Dropped for now | None | — | None |
| PN-11 | Panel alone | None: `review_due` exists | This spec | None |
| PN-15 | Panel alone | None: `saved: true` exists | This spec | None; a panel test with a failure fixture |
| PN-16 | **Mentor (new files only)** | Generated data file, generator, test | This spec, skill-builder | None |
| PN-17 | **Done, `6094ee9`** | Two table rows, used by the real hand-over on A | Skill-builder, on `main` | next-mentor's new set, which doesn't exist yet (RQ-15, RQ-16) |
| Status lines, rows, stage, allowlist | Panel alone | None | This spec | None |

## Build order and priorities

Each step can stop on its own and leave a working panel. Tasks are in [tasks.md](tasks.md).

| Step | Priority | Builds | Needs | Ships |
|---|---|---|---|---|
| **0. Contrast fixes** | Done | FR-074, FR-076 | — | Shipped in `5bed931` |
| **1. Shell and easing** | P1 | Tabs, Home A from the record and path, the Lesson tab with the checklist, short docks, Pick / Try / Done, lesson-in-progress rules, the error split, accessibility. Up next is always the path's first skill (`home-return-interim` with a record); the Skills tab is a one-line interim | Nothing from the mentor | Easing in the new layout. Other skills stay in Claude Code |
| **2. Six skills and Skills** | P1 | The other five checklists, the demo and Changed box per skill, status lines, a start path per skill, the Skills tab, skill detail, New lesson, Find my next lesson and `lesson-picking`, the widened sync test | PN-16, eval cases | All six as live lessons |
| **3. Practice** | P2 | Practice due, Warm up, the `practice*` states, the "Warm-up due" lines | Step 2, eval cases | Practice across sessions |
| **To A** | Before the first tester | `decisions/011`'s path (FR-099): free check and dry run in this build; paid run and live lesson on the builder's go | Step 2 or 3, 013 T064 to T067 | Nothing new; the proof a tester's panel needs |
| **Held** | — | Diagnosis screens; first run and Check setup | Spec 005's plan; the installer and spec 006 Q2 | — |

### States by dependency

| Held until | States |
|---|---|
| Spec 005 | Every `diag-*` state, finding actions and answer buttons, the question card, Up next quoting a finding |
| Spec 006 and its Q2 | `setup-welcome`, `setup-checking`, `setup-signin`, `setup-ready`, `err-notsetup` |
| A later decision (FR-093) | `home-return-stored` |
| Curriculum designer (C1) | Getting rusty |
| Not this build (option B) | `homeB-first`, `homeB-return`, `compare` |
| Step 2 | `home-return`, `lesson-picking`, `skills-empty`, `skills-few`, `skills-many`, `skill-detail`, `skill-detail-noreview`, `skill-detail-new`, every `skill-*-open` and `skill-*-check` except easing's |
| Step 3 | `practice`, `practice-check`, `practice-passed`, `practice-nothing-new`, `lesson-passed-pivot` |
| Step 1 | Every other state in the README's table, plus `home-return-interim` until T052 |

## Key Entities

- **Tab**: Home, Lesson or Skills; one selected at a time; never disabled.
- **Home card**: one of Up next, Practice due, memory, Lesson in progress, Your lesson is waiting; each drawn from the
  record, the path data or the panel session.
- **Panel state**: one README state id, with its trigger and source (R, P, T, M as the README
  defines them).
- **Fixed request**: one RQ entry: a label, its fixed wording, its parameters, and its eval cases.
- **Checklist row**: one thing the skill's check grades: glyph, subject, word, optional detail, in optional sections
  ([data-model.md](data-model.md)).
- **Diagnosis view** *(held)*: a look's scope line, findings, not-checked list, symptom echo and since-last-time.
- **Skill row**: a path skill with its display state (FR-048), from the path data, the generated data file and the record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The builder completes quickstart steps a–f on Mentor Practice in the overhauled
  panel in **15 minutes or less**, with **zero** characters typed in a terminal, and the checklist
  visible from the opening. *Measured by:* the builder, in a usage session, timed from the call
  log.
- **SC-002**: *Test half:* on **each of the six skills**, across at least 3 checks from recorded streams, the checklist matches
  the check's result in **100%**. *Live half:* across the live lessons, at least 10 checks from the panel (at least 3 partial, 2
  outside the lesson, 1 undone), the checklist matches the check's result in **100%** and a manual inspection in After Effects
  in **at least 9 of 10**; and across at least 3 openings on skills with targets, rows say Proposed until the first reply or
  check, then not, in **3 of 3**. *Measured by:* panel tests (T054), and the builder's tally in usage notes (quickstart §2).
- **SC-003**: **100%** of the README's state ids in scope (FR-006) have a panel test that drives
  the panel into that state from a recorded stream or a saved record and checks what shows.
  *Measured by:* panel tests, with a list of ids checked against the README.
- **SC-004**: Home shows its cards with **zero** mentor turns, within **1 second** of the panel
  opening on a record of at least 20 lessons. *Measured by:* a panel test (no spawn) and a timing
  in usage notes.
- **SC-005** *(Held with spec 005.)*: Across every recorded diagnosis stream in spec 005's fixtures, the panel shows at most
  3 findings first in **100%**, never repeats a top-3 finding in the rest, shows the Couldn't check list whenever the result
  has one, shows "Looked only" **0 times** when a non-listed tool ran, and shows nothing from a stopped or cut-off turn.
  *Measured by:* panel tests.
- **SC-006**: Every request in FR-070 that sends text and isn't held has at least one eval case, the sync test passes, each
  new case passes its set's rubric with no hard-rule failure (a new case failing on a known gap in the plan's Risks is reported to the builder rather than blocking, with no
  `SKILL.md` change planned), and any set re-run under FR-072 stays within one case of its
  baseline. *Measured by:* the sync test and eval runs.
- **SC-007**: In every panel test and usage session, **0** paths open two lessons or send Show me after a demonstration was
  made, including every cut-off retry and a retry after `demo_unknown`. *Measured by:* panel tests on recorded streams, and the call log in usage sessions.
- **SC-008**: Every text token reaches **4.5:1** on its background, and **no** text is under 11 px.
  *Measured by:* an automated check over the panel's colour tokens and font sizes.
- **SC-009**: A keyboard-only walk of flows 2, 3 and 5 in the README (pick a skill, a lesson, a review) completes without a
  mouse, and focus lands where FR-078 says after each action, in **100%** of steps. *Measured by:* the builder, once, logged
  in usage notes.
- **SC-010**: At 260 × 480 px, in at least 12 states (named in [quickstart.md](quickstart.md), including `lesson-partial`, each
  skill's mid-lesson state and `home-cutoff`), nothing scrolls sideways and no button or the Ask input is clipped. *Measured
  by:* the builder, in the real panel in AE, since the mockup itself hasn't been seen at that size.
- **SC-011**: **0** panel strings contain a file path, command, tool name, field name or error
  code. *Measured by:* an automated scan of the panel's copy and its error mappings.
- **SC-012**: "Saved to your history" shows **0 times** without a successful save, including on a
  failure fixture. *Measured by:* a panel test.
- **SC-013**: After at least 3 sessions with the overhaul, the builder's usage notes say which start each session used (Up
  next, Skills), whether the suggestion was what they wanted, and whether they reached for Adobe's assistant. Either answer
  counts; it feeds Open question 3.
  *Measured by:* the builder, in usage notes. *Later:* these notes are the start of evaluating
  Home A. Once there are enough target-market testers for a comparison to mean something, Home A
  gets evaluated with them and possibly A/B tested against Home B (Open question 3); with the
  builder alone, the notes don't settle it.
- **SC-014**: **All six skills complete one live lesson in the new panel** (sprint 4's first "done" item), each with no
  terminal, the checklist agreeing with the check, and `lesson-focus-stale` counted. *Measured by:* the builder, with the
  turn log, in `discovery/usage-notes/ui-overhaul.md`.
- **SC-015**: **A usage session compares the new panel with the current one** on the same task (quickstart a to f on Mentor
  Practice, at 260 × 480, from a reset comp), and the notes check it against this section. It records time to pass, times the
  builder had to work out what to do next, whether the answer was in view without scrolling, and which panel they'd rather
  use and why. Target: not slower, and fewer "what now?" moments; either result is logged. *Measured by:* the builder, in
  usage notes; the current panel's half is run before the first `panel/` merge from this build, because the panel is linked
  to the main checkout and any merge changes it (T001).
- **SC-016**: At 560 px tall and under exactly one of chat and rows shows, and above it both do, in **100%** of panel tests; a
  check leaves the chat showing. *Measured by:* panel tests, plus the builder at 480 and 680 in AE.
- **SC-017**: **0** CSS or script features on the scan's list (FR-090) in the panel, and every skill's every tool has a status
  line (except `Skill`, FR-062), and every tool but `Skill` is on the B1 allowlist. *Measured by:* automated checks.
- **SC-018**: Before any tester sees the panel: `ready-for-a` and the dry runs pass on all seven skills (this build, T077); the new
  cases and the next-mentor set meet spec 013 FR-033's bar on A, including the real hand-over cases, which run nowhere else, and one lesson and one hand-over run live on A (on the builder's
  go, T078, T079). *Measured by:* the free check and dry runs, eval runs on A, and the builder in usage notes.

## Assumptions

- **Runtime** (`decisions/011`): for the builder's prototype and this build's evals, the panel keeps running the mentor through headless
  Claude Code (`decisions/005`, B1) behind its one seam. Shipped Knack uses option A
  (`decisions/009`), built in its own runtime spec. *(Amended 2026-10-30:* spec 013 builds it, and
  more than the seam and the sign-in step change: the new error causes (FR-056), the key check that
  `setup-signin` and Check setup call (spec 013 FR-020), and a runtime setting (B1 or A, spec 013
  FR-037) in `panel.json`. The setting is builder-only: learners only ever get A, so no screen draws
  it. Continuing a lesson works the same on both, from the helper's saved conversation on A.)
- **Container:** CEP, as today; nothing in the mockup needs more than the panel already uses
  (README › Open questions 9). A UXP port is its own work after the Nov 2026 beta.
- **User:** the builder on their own Mac with After Effects 26.5 on macOS 27.0.1, then the
  installer's
  testers.
- **Design source:** the README, `index.html` and `copy-pass.html` at revision 3. Text marked Placeholder there is the mentor's
  voice (the skill's), not panel copy. The mockup hasn't been seen in a browser, by its own note, so fit is checked in AE (SC-010).
- **Warm up is spec 004's review.** The button says Warm up; the record calls it a review.
- **Skill names** shown in the panel come from the path data (PN-16), not from the mockup.
- **Diagnosis entry:** held. When it lands it's on Home only, by the learner's press; a lesson's opening never includes a
  diagnosis in the panel (Open question 1, answered; spec 005 FR-026).

## Out of scope (build scope)

- **Home option B** (diagnose-first) now. It may come back later as the other arm of an A/B test,
  once there are enough target-market testers (Open question 3).
- **Diagnosis** (all `diag-*` states, RQ-03 to RQ-10): no spec 005 code exists (decision 1).
- **First-run screens, `err-notsetup` and Check setup** until the installer and spec 006 Q2.
- **A stored recommendation** (FR-093), an accept signal, a learner-facing next note, a warm-up's length, Getting rusty.
- **A mentor change so End lesson or Set it aside really resets a lesson** (Open question 6).
- **Running the build on option A** (`decisions/011`), apart from FR-099's check before a tester. Spec 013 keeps its own track;
  the panel doesn't wait for it (FR-097).
- **What the mentor says and teaches:** `SKILL.md` wording, the diagnosis catalogue and its
  analysis, the path rule, the review schedule and what a warm-up contains. They belong to specs
  002, 004 and 005 and the curriculum design; this spec only shows them.
- **Spec 005 US4's findings** in the main list (parenting overlap, motion blur). They arrive as
  data with the "setting" kind; until then they're in Couldn't check. No panel change is planned
  for them beyond the kind label.
- **A pattern across sessions** as Up next's reason (spec 005 US3-3, FR-020), held with spec 005
  US3 until its SC-009.
- **The installer, the Check setup screen and the sign-in mechanism** (spec 006 and the runtime
  spec). This spec draws only the panel's own first-run steps.
- **A moving demonstration** or new frame renders for before and after; the panel shows the frames
  the mentor rendered (Open question D3).
- **Editing the learner record** from the panel, cost display, usage analytics, accounts, update
  notices, uninstall, Windows, AE's lighter brightness themes, a second open project, and more
  than one comp at a time.
- **Ask the mentor on Home or Skills** (D2, settled).

## Open questions

### For the human and the cockpit (these change the spec)

1. **What does Start lesson send, given Home A and spec 005's open question 2?** Spec 005
   recommends a short diagnosis opening when a session starts without a named skill; on Home A
   every Start lesson names a skill, so the two can't both be the default. Options: (a) Start lesson opens the named skill's lesson as today, and diagnosis stays a
   separate press; (b) Start lesson's opening starts with one or two diagnosis sentences, then the
   skill; (c) a session started any other way (typing in Claude Code, no skill) gets spec 005's
   opening, and the panel never does. **Recommended: (a) for the panel plus (c) for Claude Code.**
   Home A already puts the diagnosis one press away, (b) adds a whole-comp read to every lesson's
   first turn (cost and the 10 s first-activity bar, spec 003 SC-004), and it changes every
   skill's opening eval cases. **Answered 2026-10-20: (a) for the panel plus (c) for Claude Code**,
   as recommended. Folded into FR-012, RQ-01, Assumptions › Diagnosis entry, and spec 005 FR-026.
   No decision record needed.
2. **Does ending an unfinished lesson record anything?** Spec 003 says nothing is recorded for an
   unfinished lesson; the mockup says End lesson isn't saved. But "attempted, not passed" is what
   spec 004's *practicing* state and the next session's pick-up need. **Recommended: record
   nothing from End lesson in this spec** (FR-025), as today, and ask the curriculum designer
   whether an ended lesson with at least one check should count as *practicing*. If yes, End lesson
   sends a request (it gets an eval case) and the mentor records it with `result: partial`.
3. **How do we test A fairly against B?** On A the diagnosis card is third or fourth, so "people
   press Look at my comp first" undercounts it. Options: put both starts
   above the fold at 480 px on A, or give some learners B. **Recommended: both starts above the
   fold on A, no B build.** With one builder and at most 5 testers, a split gives no usable
   numbers; SC-013's notes, plus the first target-market sessions, answer it. This changes Home's
   card order, so it goes back to the UI designer as a revision. **Answered 2026-10-20: the
   default** (both starts above the fold on A, FR-007; no B build now). The builder's follow-up:
   **evaluate Home A, and potentially A/B test it against Home B, later**, once there are enough
   target-market testers for a comparison to mean something (SC-013's notes).
4. **What does one look cost and how long does it take?** It decides whether a diagnosis card on
   Home is affordable to press often, and whether `diag-again` can re-read on every open. Not
   measured; spec 005 SC-004 allows 30 s. **Recommended: measure it in spec 005's first usage
   session (cost per look and time to first finding, on Mentor Practice) before the diagnosis screens are planned**;
   keep diagnosis on press only (no read on open) either way.
5. **Which sign-in model does the first-run flow draw?** `setup-signin` and `err-mentor` differ
   between B1 (Claude Code signed in) and option A (an access key, spec 006 Q1 and Q2).
   **Recommended: build everything else now and hold first run until spec 006's Q1 decision record**;
   until then `err-mentor`'s copy names no runtime ("The mentor can't start. Check setup.").
   **Answered 2026-10-20 by `decisions/009`:** the first-run sign-in draws option A's
   access-key flow (FR-054). The exact key source still waits on spec 006 Q2.
6. **What should the next lesson do after End lesson or Set it aside, on the same skill and comp?** The mentor keeps one lesson
   per skill and comp until it passes, and once there's a demo or check neither time nor `fresh` restarts it. So the next lesson
   resumes the old start, with the demo spent. **Answered 2026-11-04: accept it for this build** (FR-092). The one-demo rule holds. A
   real reset needs a tool change in all six skills and their re-runs, about $180. D16 settles the labels.
7. **Is a new next-mentor eval set acceptable?** The README expected "next-mentor's cases", but no such set exists, and B1 can't hand over (013 research R6). **Answered 2026-11-04: yes, about 9 cases on a small new runner**, about $5 to $10 a run; its Yes-path cases stop at the follow-on start on B1, and real hand-overs run on A only (FR-082). Constitution III requires
   one, and Find my next lesson is Home's main button.
8. **What should Show me again say on the five new skills?** Today's text says "the pair you already eased". **Answered 2026-11-04: easing
   keeps its text (case 20 holds); the five share "Show me again: explain the change you already made, with a frame. Don't change
   anything."**, with one new case each.
9. **Raise the panel's minimum height?** The manifest allows 400 px; this spec's floor is 480. **Answered 2026-11-04: raise `MinSize` to 480**,
   so no state is built for a height nobody checks.

### For the UI designer (D, don't block approval)

D1 to D5 are settled in revision 3 (README › D1 to D5). New, from the code check; each has a default so none blocks approval:

6. **A lesson saved without a pass** (`result: partial`) has no state. Default: "Saved to your history." with the ways out.
7. **Missing row words.** The pivot: a pivot at another named place (the tool's `neighbour_place`) isn't in the table; default "✗ At
   [place]". Null: `three_d`, `region_needed`, `null_name_not_unique`, `focus_name_not_unique`, `which_null`, `not_found`; defaults in
   [contracts/checklist-rows.md](contracts/checklist-rows.md).
8. **Easing-only wording.** `lesson-error-demo` says "the demo pair is already eased". Default for the other five: "the mentor stopped
   before finishing, but its change is already in your comp."
9. **"Check setup" with no screen.** `err-*` copy says to check setup, and FR-059's screen is spec 006's. Default: the words stay, no
   button.
10. **`home-unreadable-why`** says the file was moved aside; that's only true after the mentor's first read. Default: as drawn.
11. **README Open question 6, "Worth a look" on null.** Default: as drawn.
12. **`lesson-error-demo` with no result.** The mockup draws only the landed case, and D8's line claims a change is in the comp. Default for
    the no-result case, making no claim about the comp: "The mentor stopped before finishing. Press Done, check it to see where things stand."
13. **Who did it, when the tool can't tell** (README › States still missing). Default: "? Who eased it?" on easing, "? Who shaped it?" on speed
    graph, crediting nobody, while the mentor asks.
14. **Several reviews due, past Home's card** (README › States still missing). Default: Home's card keeps following the date rule, the rest stay ↻
    in Skills, and the panel shows the `mode` the tool returns.
15. **Easing rows with no label** (FR-100). Defaults: a count line, "3 more pairs. They get names at your next check."; at a check, a row with no
    name reads "A pair".
16. **The label for setting a lesson aside. Closed 2026-11-04, the builder's decision:** "Start fresh" becomes **"Set it aside"**, because the next lesson on that skill
    and comp resumes with the demo spent (Open question 6). "New lesson" stays, and a resumed lesson says it's resuming (FR-092). This overrides the mockup until it's updated. Default for
    that line, for the designer to confirm: "Picking up your earlier lesson on this comp."

### For the curriculum designer (C, don't block approval)

1. **"Getting rusty"**: is it a state the curriculum wants, and what defines it? Until defined, the panel doesn't show it (FR-048).
2. **The warm-up's expected length** and **skill groups**: not drawn in revision 3. Skills is one list in path order.
3. **Finding titles, where wording and answer options** are catalogue wording (spec 005 open
   question 4's `teaching-design.md`), not panel copy.

## Dependencies

- **Mockup:** `product/mockups/ui-overhaul/README.md`, `index.html` and `copy-pass.html`, revision 3 (2026-11-02), UI designer's.
- **Spec 003** (shipped): the panel, its requests and sync test, its activity map, and its
  quickstart (used by SC-001).
- **Spec 004** (approved, built): path data, the record's review fields, reviews.
- **Spec 005** (approved, no plan): held; the diagnosis screens wait on it.
- **Spec 006** (approved, no plan): held; first run and Check setup wait on it and its Q2.
- **Spec 013**: the option A kinds this panel maps, and shared B1 work with one owning task each ([plan.md](plan.md) › Shared work
  with spec 013). This build doesn't wait on its runtime work (FR-097).
- **Decisions:** `002`, `003`, `005`, `006`, `007`, `008`, `009` (option A for shipped Knack, amends 005), `010` (the helper) and
  `011` (build on B1, ship on A); none changes. Open question 1 was answered (a) plus (c), so no new one is needed.
- **Constitution 1.3.0**, Principles I to VI.
- **Eval engineer:** writes every case in FR-070, the next-mentor set, and owns their numbers and fixtures.
- **Skill-builder:** PN-16 (PN-17 is done). **Panel-builder:** `panel/`.
