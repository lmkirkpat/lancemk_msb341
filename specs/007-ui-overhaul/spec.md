# Feature Specification: Panel UI overhaul (Home, Lesson, Skills)

**Feature Branch**: `007-ui-overhaul` (spec folder only; written on the agent branch
`worktree-agent-af3960255f7e0be6c`)

**Created**: 2026-10-20

**Status**: Approved 2026-10-20. Plan and tasks come next. Home A is approved for now. Open
questions 1, 3 and 5 are answered and folded in (FR-007, FR-012, FR-054, RQ-01, SC-013,
Assumptions). Still open: questions 2 and 4, and the D and C questions.

**Input**: Cockpit task, Sprint 3 parallel run 1 (wave 3): "Write the spec for the UI overhaul:
three tabs (Home, Lesson, Skills), Home option A (path-first) as recommended, the docked
checklist from the lesson's opening, the diagnosis screens matching spec 005, the
lesson-in-progress rules, and every interface state in the README's state table. Turn the
panel-needs list into requirements with IDs, and say which ones need a mentor change versus the
panel alone."

**The design this spec builds.** The UI designer's mockup, revision 2 (design-reviewed, then
revised, 2026-10-20): [`product/mockups/ui-overhaul/README.md`](../../product/mockups/ui-overhaul/README.md)
and [`index.html`](../../product/mockups/ui-overhaul/index.html). This spec links to it and turns
it into requirements; it doesn't redraw or reword it. Where this spec says "the README", it means
that file, and state ids (`home-return`, `diag-rest`, ...) are the ones in its rail and its
"Every state" table. Where the spec needs something the mockup doesn't settle, it's a question
for the designer (Open questions › D), not an edit.

## Why this overhaul

- **The panel can't hold what's coming.** Spec 003's panel is one stacked screen built for one
  skill: a fixed four-item path, a memory strip with only the last lesson, and a check list that
  appears only after the first check. Spec 004 adds ten skills, a path and reviews; spec 005 adds
  a whole-comp diagnosis. None of it fits on one screen at 260 px (README › What this redesign
  removes).
- **It's where the harder-to-copy parts become visible.** Restraint and leading are product
  choices Adobe could copy with a mode switch (`decisions/002` trigger). What Adobe's assistant
  can't easily copy is:
  1. **Depth.** The checklist shows every keyframe pair (and, from spec 004, every key and setting)
     the lesson checks, docked next to the comp from the opening, from the check's own result.
     A diagnosis finding says where, by layer, property and time. Adobe's assistant said it
     couldn't read easing at all on 2026-10-08.
  2. **Memory.** Home shows what the mentor remembers, a remembered look is always dated and tied
     to its comp, and each skill keeps its history. Today memory is one line.
  3. **Practice.** Practice due and Warm up sit on Home and in Skills, so the review spec 004
     schedules is one press away.
  The usage notes back the part that's most at risk of being lost: the check list next to the comp
  is what helped most in every panel session (`discovery/usage-notes/mentor-panel.md`, spec 003
  SC-008).
- **Home is path-first (option A).** The mentor leads (`decisions/002`), Home opens instantly and
  free from the local record, and it works before diagnosis or the curriculum ship. The
  diagnosis card and an Up next that quotes a dated finding keep B's strength, "your comp is the
  hook" (README › Home screen: two options, Recommendation). The open risk is that A reads like a
  course menu. Home A is approved for now (2026-10-20); it gets evaluated, and possibly A/B tested
  against Home B, once there are enough target-market testers (Open question 3, SC-013).
- **The overhaul also clears debts from spec 003:** developer error copy ("Run `bash
  panel/install.sh`") for an installer audience, a silent fresh start after AE restarts, and
  three colour tokens that fail contrast (FR-074).

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

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Knack and know what to do next (Priority: P1)

I open the Knack panel next to my comp. It opens on **Home** straight away, without waiting for
the mentor. The top card says what to learn next and why, with the date and comp if the reason
came from a look at my comp. Below it: a question from my last look if there is one, practice
that's due, **What's wrong here?** with a box for what looks off, and what the mentor remembers.
Three tabs across the top (Home, Lesson, Skills) and a mark that says whether After Effects is
connected.

**Why this priority**: it's the frame every other story sits in, and option A's claim (the mentor
leads, free and instant) is tested here. It works on today's mentor and record.

**Independent Test**: with saved learner records in each state (none, one lesson, several lessons
with a review due, unreadable), open the panel and compare Home with the record and the README's
`home-first`, `home-return` and `home-unreadable` states. It's complete if Home matches the record
in every case, appears without a mentor turn, and the tabs work by keyboard.

**Acceptance Scenarios**:

1. **Given** no learner record, **When** I open the panel, **Then** Home shows `home-first`: Up
   next is the path's starting skill, the diagnosis card, and "No lessons yet", with no error.
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

I press **Start lesson**. The Lesson tab opens with the mentor's opening and, docked above the
buttons, the checklist of what this lesson will check, each row marked **Proposed** until I say
yes to the focus. When I ask **Show me**, the one change the mentor made sits in its own "Changed
in your comp" box with how to undo it. Each **Check my work** fills the rows with what's eased,
still off, or outside the lesson. When it passes, I see **Lesson passed** and **Saved to your
history**, and two ways on.

**Why this priority**: the lesson is the product, and the checklist next to the comp helped most
in every session. Moving it to the opening is the overhaul's main teaching-facing change.

**Independent Test**: on Mentor Practice, run quickstart steps a–f (`specs/003-mentor-panel/quickstart.md`
§4) in the overhauled panel. It's complete if every step happens in the panel, the checklist
shows from the opening, each row matches the check's result every time, and nothing is typed in a
terminal.

**Acceptance Scenarios**:

1. **Given** I press Start lesson, **When** the opening arrives, **Then** the checklist is docked
   above the buttons with one row per proposed focus target, each marked **Proposed**
   (`lesson-open`).
2. **Given** the checklist says Proposed, **When** my next turn accepts the focus, **Then** the
   rows stop saying Proposed; **When** the mentor changes the focus instead, **Then** the rows
   change to the new focus.
3. **Given** no demonstration yet, **When** I press Show me, **Then** the change appears in a
   "Changed in your comp" box that says Edit > Undo reverses it, and the button becomes **Show me
   again** (`lesson-demo`).
4. **Given** a check that isn't a pass, **When** it returns, **Then** each row shows its state as a
   glyph and a word, Hint appears, and changes outside the focus are listed apart as "Outside this
   lesson · not counted" (`lesson-partial`, `lesson-outside`).
5. **Given** a passing check, **When** the record is written, **Then** `lesson-passed` shows
   **Saved to your history**; **When** the record write fails, **Then** "Saved" never shows.
6. **Given** a panel 480 px tall, **When** the lesson runs, **Then** only the chat shrinks, the
   checklist takes at most 30% of the height, and the buttons and Ask are never clipped.

---

### User Story 3 - One lesson at a time, and never lost without a word (Priority: P1)

I can leave a lesson for Home and come back to it. While it's open, Knack won't start a second one
or a diagnosis; it says those are "Available after your lesson". If I close the panel and reopen
it, my lesson is waiting. If After Effects quit, Home tells me once that the lesson ended. If the
mentor gets cut off, **Try again** never asks for a second demonstration.

**Why this priority**: three tabs make it easy to start something twice. The one-demonstration
rule (spec 002 FR-006) and "nothing recorded for an unfinished lesson" (spec 003) must survive the
new navigation.

**Independent Test**: from recorded turn streams and a live run, walk ‹ to Home and back, press
every start on Home with a lesson open, close and reopen the panel, restart AE, and cut off a
Show me before and after its change came back. It's complete if no path starts two lessons or a
second demonstration, and each case shows the README state named for it.

**Acceptance Scenarios**:

1. **Given** a lesson is open, **When** I press ‹, **Then** Home shows **Lesson in progress** with
   **Back to lesson** and **End lesson**, and Start lesson, Warm up, the question card and **Look
   at my comp** read "Available after your lesson" (`home-lessonopen`).
2. **Given** no lesson is open, **When** I choose the Lesson tab, **Then** it says why it's empty
   and offers **Go to Home** and **Pick a skill** (`lesson-none`). The tab is never disabled.
3. **Given** I closed the panel mid-lesson in the same AE session, **When** I reopen it, **Then**
   **Your lesson is waiting** sits on top with **Continue** and **Start fresh**, and Up next is
   dashed and not the primary button (`home-cutoff`).
4. **Given** AE quit mid-lesson, **When** I next open the panel, **Then** Home shows a one-time,
   dismissible note that the lesson ended and wasn't saved (`home-aeclosed`).
5. **Given** Show me was cut off after its change came back, **When** the panel offers a retry,
   **Then** the button reads **Show me again**; **Given** it was cut off before any result,
   **Then** the panel offers **Check my work** instead (`lesson-error-demo`).

---

### User Story 4 - Ask "what's wrong here?" from Home and be led, not handed the fix (Priority: P1 with spec 005 US1 and US2)

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
practice due, in progress, up next, not started, coming later. I pick one to see its history and
start a **New lesson** or a **Warm up**. Home's **Practice due** card offers the warm-up that's due.

**Why this priority**: memory and practice are the harder-to-copy parts, and they only matter
once a second skill and reviews exist (spec 004 waves A and C).

**Independent Test**: on saved records in spec 004's states (nothing learned; easing learned;
skill 2 practicing; skills 1 to 3 learned with a review due), the Skills tab and `skill-detail`
match the record and the path data on every row.

**Acceptance Scenarios**:

1. **Given** the path data and a record, **When** I open Skills, **Then** every skill in the path
   shows once, in path order, with its state, and skills not built yet say "coming later" and
   can't be started (`skills-few`, `skills-many`).
2. **Given** a skill, **When** I open it, **Then** `skill-detail` lists each lesson from the record
   read-only, and its back control says "Back to Skills".
3. **Given** a review is due, **When** I open Home, **Then** Practice due names the skill and the
   warm-up's expected length; **When** I press Warm up, **Then** a review starts, tagged as
   practice, with rows Proposed (`practice`).
4. **Given** a lesson just passed, **When** I go to Skills, **Then** that skill's state and history
   already show it, without reopening the panel.

---

### User Story 6 - Set up and recover in plain words (Priority: P2)

The first time I open Knack after installing, it walks me through three steps: finding After
Effects, signing in, and opening a comp. When something breaks, a banner says what's wrong and
what to do, in words a designer understands, with no commands to type.

**Why this priority**: the installer audience isn't developers (spec 006). The error copy can
change now. The sign-in step draws option A's access-key flow (`decisions/009`); the exact key
source waits on spec 006 Q2.

**Independent Test**: on a fresh learner home, open the panel and walk `setup-welcome` to
`home-first`; then fault one thing at a time (no AE, mentor can't start, record unreadable, AE
busy, install incomplete) and compare each banner with the README state.

**Acceptance Scenarios**:

1. **Given** the panel's first open after install, **When** it opens, **Then** `setup-welcome`
   shows three steps and Get started, and each step shows its progress (`setup-checking`,
   `setup-signin`, `setup-ready`).
2. **Given** the install is incomplete, **When** the panel opens, **Then** `err-notsetup` offers
   **Open the install instructions**, which opens them in the browser.
3. **Given** the mentor can't start or I was signed out, **When** I try any action that needs it,
   **Then** `err-mentor` shows, and Home's actions say "Needs the mentor."
4. **Given** any error state, **When** I read it, **Then** it contains no file path, command, tool
   name, field name or error code.

---

### User Story 7 - Every new button is evaluated (Priority: P1)

Every fixed request a new button sends to the mentor has an eval case that sends exactly that
request, and a test fails if the two drift apart. The easing evals still pass at baseline.

**Why this priority**: constitution III, and spec 003 FR-019's rule. A button is a new way of
asking the mentor to behave; untested, it can break the teaching without anyone typing anything.

**Independent Test**: run the panel's sync test and the eval sets (easing, diagnosis, each built
skill) without AE; get a pass or fail per case.

**Acceptance Scenarios**:

1. **Given** the panel's request list, **When** the sync test runs, **Then** every request that
   sends text has at least one named eval case whose turn is that exact text.
2. **Given** a request's wording changes, **When** its eval case doesn't, **Then** the sync test
   fails.
3. **Given** the full easing set, **When** it runs after the overhaul's mentor changes, **Then** it
   passes at 25/25 or within one case, with no hard-rule failure.

---

### Edge Cases

From the README's "States still missing" and the specs this one sits on.

- **Two lessons, or a lesson and a look, at once.** Never: every start is replaced while a lesson
  or a look is open (FR-024, FR-032).
- **A lesson also open in a terminal.** Not supported, as in spec 003; nothing the panel does may
  write the record.
- **Up next is older than today.** The stored recommendation was made at the end of the last
  session; a review may have come due since. Home shows both cards as stored; Start lesson sends
  Up next's skill and the mentor's opening can change it, saying why (spec 004 FR-004 runs in the
  mentor, not the panel).
- **The recommended skill has nothing to focus on in this comp.** The mentor says so in the
  opening (spec 004 Edge Cases); the checklist shows no rows, never placeholder rows.
- **`record_lesson` failed after a passing check.** `lesson-passed` shows the pass but not "Saved
  to your history", and says the lesson couldn't be saved (PN-15).
- **Huge comp.** The look still leads with at most 3; the status line keeps saying what's running
  until the result arrives (spec 005 SC-004 allows 30 s).
- **Stop looking after the mentor already found something.** Nothing is shown from a stopped turn
  (`diag-stopped`). Nothing is recorded (spec 005 FR-017 writes only at the end of a diagnosis).
- **"Fix all of it" typed in Ask during a diagnosis.** A normal reply in the mentor's words (spec
  005 FR-015). There is no button that could ask for it, deliberately (FR-045).
- **A remembered look on a comp that changed since.** Always shown with its date, its comp and
  "not re-checked" until a new read (FR-047).
- **The active comp isn't the last look's comp.** `diag-othercomp`: the remembered findings aren't
  shown, and the panel asks which comp you mean.
- **Out of credit or rate-limited.** Shown as `err-mentor` with plain copy; the panel doesn't guess
  the cause beyond what the runtime reports.
- **A second AE project open, Windows, AE's lighter brightness settings.** Not supported in this
  release (Out of scope); nothing may break, and the dark theme is used regardless.
- **Track mattes** shown as "hidden, set aside" in Couldn't check. The reason text is data
  (PN-04); when spec 004's visibility class lands it says a hidden layer may be a matte, with no
  panel change.
- **A record from before this spec** (spec 002 version 1, easing only). Reads as it is; fields
  that don't exist yet leave their cards out, never show an error (FR-050).
- **Narrow and short docks.** At 260 px wide and 480 px tall, every state wraps without
  horizontal scrolling; only the chat shrinks.

## Requirements *(mandatory)*

### Structure and navigation

- **FR-001**: The panel MUST have three tabs, **Home**, **Lesson** and **Skills**, as the README's
  Structure section shows, with Home selected when the panel opens.
- **FR-002**: The tab bar MUST carry the connection mark: a shape and a word (README ›
  Accessibility, not colour alone) for After Effects connected, not connected and busy, from the
  panel's existing bridge check (spec 003).
- **FR-003**: The Lesson tab MUST always go to the open lesson. With none open, it MUST show
  `lesson-none` (why it's empty, **Go to Home**, **Pick a skill**). No tab is ever disabled.
- **FR-004**: Every back control (‹) MUST say where it goes in words: "Back to Home. Your lesson
  stays open.", "Back to Skills", "Back to the top 3".
- **FR-005**: Switching tabs MUST NOT end, restart or change a lesson or a look, or send anything
  to the mentor.
- **FR-006**: The panel MUST implement every state in the README's "Every state" table by its id,
  with the trigger and source given there, except the option B states (`homeB-first`,
  `homeB-return`; Out of scope) and the states held until a dependency ships (Build order ›
  States by dependency).

### Home (option A, path-first)

- **FR-007**: Home MUST show, in this order: **Up next** with its reason; **A question from your
  last look** when there is an unanswered ask finding; **Practice due** when a review is due;
  **What's wrong here?** with an optional **What looks off?** input; **What the mentor
  remembers**. A card with no data is left out, not shown empty (except `home-first`'s "No lessons
  yet"). Up next's **Start lesson** and the diagnosis card's **Look at my comp** MUST both be
  above the fold at 260 × 480 px (Open question 3). The card order that does it is the UI
  designer's revision (D5); until it lands, the order above stands.
- **FR-008**: Home MUST be drawn from the learner record and the path data alone, with no mentor
  turn, so opening it costs nothing (README › Home, cost row). If the read takes more than 300 ms
  it MUST show `home-loading`.
- **FR-009**: Up next MUST show the skill and reason the mentor stored (PN-09). When the reason
  comes from a diagnosis it MUST be a style finding, shown with its date and comp and "not
  re-checked" until a newer read. An ask finding MUST NOT be a reason until it's answered; until
  then it's the question card.
- **FR-010**: With no record, Up next MUST be the path data's starting skill (PN-16), not a skill
  the panel picks.
- **FR-011**: The panel MUST tell a missing record from an unreadable one. Unreadable MUST show
  `home-unreadable` and MUST NOT be treated as a first run (the 2026-10-12 agent audit's rule:
  unreadable is not empty). Today's `panel/lib/memory.js` returns the same thing for both, which
  this changes.
- **FR-012**: **Start lesson** on Up next MUST send that skill's start request (RQ-01), which opens
  the named skill's lesson as today, with no diagnosis opening. Diagnosis stays a separate press,
  **Look at my comp** (Open question 1, answered (a); spec 005 FR-026).
- **FR-013**: **Pick another skill** MUST go to the Skills tab.

### Lesson

- **FR-014**: The lesson header MUST show the lesson's title, skill and focus, and a practice tag
  for a warm-up, from data (PN-13), plus the I do / We do / You do stage derived from tool results
  as spec 003 FR-009 does.
- **FR-015**: The checklist MUST be docked above the buttons from the lesson's opening, one row per
  proposed focus target, each marked **Proposed** until the mentor's data says the focus was
  accepted, then without the mark (PN-14). If the focus changes, the rows MUST change to the new
  focus.
- **FR-016**: After each check, the rows MUST come from that check's comparison result, not from
  the mentor's wording, and agree with it every time (spec 003 FR-007 carried over), with each
  state shown as a glyph and a word. Changes outside the focus MUST be listed apart as "Outside
  this lesson · not counted".
- **FR-017**: When After Effects can't be reached mid-lesson, the list MUST be marked stale (rows
  dimmed to 70%, the note at full contrast), and Hint MUST pause with "Hint needs After Effects."
  (`lesson-stale`). No check result is shown for that turn (spec 003 FR-015).
- **FR-018**: After the lesson's demonstration, the change MUST appear in its own "Changed in your
  comp" box built from the demonstration tool's result, saying Edit > Undo reverses it and naming
  no undo label (server rule 1). Frames shown are the ones the mentor rendered in that turn; the
  panel renders none itself.
- **FR-019**: The demo button MUST read **Show me** before the demonstration and **Show me again**
  after, and no control may ask for a second demonstration or for the mentor to do the rest (spec
  003 FR-006 carried over).
- **FR-020**: Hint MUST appear from the first check on (spec 003 FR-005).
- **FR-021**: `lesson-passed` MUST show **Lesson passed** on a passing check, and **Saved to your
  history** only when the record write succeeded in that turn (PN-15). Its two ways out are **Up
  next: skill ›** and **See your skills**.
- **FR-022**: The chat MUST be the only part of the Lesson tab that shrinks. At 480 px tall the
  checklist MUST cap at 30% of the panel height, and the buttons and Ask MUST never be clipped.

### Lesson in progress

- **FR-023**: Only one lesson may be open at a time, in the whole panel.
- **FR-024**: While a lesson is open, Home MUST show **Lesson in progress** with **Back to
  lesson** and **End lesson**, and MUST replace Start lesson, Warm up, the question card's answers,
  **Look at my comp** and Skills' New lesson and Warm up with "Available after your lesson"
  (`home-lessonopen`).
- **FR-025**: **End lesson** MUST close the lesson and return to Home. Whether ending an unfinished
  lesson records anything is Open question 2; until it's answered, nothing is recorded (spec 003
  edge case), and the panel says so in one line before ending.
- **FR-026**: If the panel is closed and reopened during a lesson in the same AE session, Home MUST
  show `home-cutoff`: **Your lesson is waiting** on top with **Continue** and **Start fresh**, and
  Up next pushed back (dashed border, full contrast, not the primary button).
- **FR-027**: **Continue** MUST reopen the lesson as `lesson-continued` (redrawn, a divider, and a
  note where a frame from before can't be shown). **Start fresh** MUST return to Home with the
  record untouched.
- **FR-028**: If AE quit during a lesson, the next open MUST show `home-aeclosed` once, dismissible,
  and the lesson is gone (spec 003: continuing works only within one AE session).
- **FR-029**: When a turn is cut off (timeout, exit, dropped stream), the panel MUST show
  `lesson-error` with the partial reply marked "cut off" and **Try again**, which resends the last
  request unchanged.
- **FR-030**: If the cut-off turn was **Show me** and its change result had arrived, the retry
  MUST be **Show me again**. If no result had arrived, the panel MUST offer **Check my work**
  instead, so a retry can never ask for a second demonstration (`lesson-error-demo`).

### Diagnosis screens (spec 005)

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
- **FR-046**: **Ask the mentor** MUST be available on the Lesson tab and on diagnosis screens,
  below the buttons (spec 003 FR-008). Whether it's also on Home is Open question D2.

### Skills, memory and practice

- **FR-047**: A remembered diagnosis shown anywhere (Up next's reason, the question card,
  `diag-again`) MUST carry its date, its comp and "not re-checked" until the mentor reads that comp
  again.
- **FR-048**: The Skills tab MUST list every skill in the path data once, in path order, with its
  state as a glyph and a word: learned ✓, practice due ↻, in progress ◐, up next ▸, not started ○,
  coming later (not built). "Getting rusty ◔" is shown only once the curriculum defines it (Open
  questions › C1).
- **FR-049**: `skill-detail` MUST list the skill's lessons from the record, read-only, with **New
  lesson** (RQ-02) and, when the skill is learned, **Warm up** (RQ-11).
- **FR-050**: **What the mentor remembers** MUST show the record's recent lessons with their date,
  skill, result and the learner-facing next note (PN-10). Missing fields from an older record MUST
  leave that part out, never show an error or an internal note.
- **FR-051**: **Practice due** MUST show when the record says a review is due on or before today,
  with the skill and the warm-up's expected length (PN-11). The panel MUST compare the stored due
  date with today and nothing more; it MUST NOT compute a schedule.
- **FR-052**: A warm-up MUST open as `practice`: the practice tag, rows Proposed, the same
  checklist rules as a lesson.
- **FR-053**: Home, Skills and `skill-detail` MUST update when a lesson or look is recorded,
  without reopening the panel (spec 003 FR-011 carried over).

### Setup and errors

- **FR-054**: On the first open after install, the panel MUST walk `setup-welcome`,
  `setup-checking`, `setup-signin` and `setup-ready` to `home-first`. `setup-signin` draws option
  A's access-key flow (`decisions/009`, Open question 5): the key is entered once and checked
  before setup finishes. Where the key comes from waits on spec 006 Q2. Everything else uses the
  panel's own checks.
- **FR-055**: An incomplete install MUST show `err-notsetup` with **Open the install
  instructions**, which opens them in the browser.
- **FR-056**: When the mentor can't start, exits, or isn't signed in, the panel MUST show
  `err-mentor`, and actions that need the mentor MUST say "Needs the mentor."
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
- **FR-061**: A paused or replaced action MUST say why in words ("Hint needs After Effects.",
  "Available after your lesson.", "Buttons wake up when the mentor has looked.").
- **FR-062**: Status lines MUST come from which mentor tool is running, as `panel/lib/activity.js`
  does, extended to every new tool (diagnosis, each skill's demo and reads). A line MUST claim
  only what its tool does.
- **FR-063**: Product copy MUST follow CLAUDE.md "Voice" (README › Copy). Errors stay plain and
  say what to do. The mentor's words are the skill's and aren't panel copy.
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
  them. A look's or lesson's data from the current panel session MAY be kept in memory for
  display; it MUST NOT be saved by the panel across sessions.
- **FR-068**: Nothing the panel stores or logs may contain real names, emails or phone numbers
  (constitution IV). A typed symptom is sent to the mentor, not stored by the panel.

### Requests and evals

- **FR-069**: Every fixed request the panel sends MUST be written once, in one place, as spec
  003's `panel/lib/requests.js` is. A request MAY have parameters (a skill, a finding, a layer, a
  symptom, an answer); its fixed wording around them is the request.
- **FR-070**: Every request in the table below that sends text MUST have at least one eval case
  that sends it, written by the eval engineer in the eval set named, scored on that set's teaching
  rubric (spec 003 FR-019's rule).

  | ID | Request (button) | Sends text? | Eval set | Notes |
  |---|---|---|---|---|
  | RQ-01 | Start lesson (Up next's skill) | Yes | each built skill's set | Replaces `/ease-mentor`; opens the named skill, no diagnosis opening (Open question 1) |
  | RQ-02 | New lesson (a skill picked in Skills) | Yes, RQ-01's template | each built skill's set | One case where the picked skill isn't Up next |
  | RQ-03 | Look at my comp | Yes | diagnosis | |
  | RQ-04 | Look at my comp, with a symptom | Yes | diagnosis | Cases for a match and a miss |
  | RQ-05 | Learn: skill › (from a finding) | Yes | diagnosis | Hands over with the finding's layer as focus (spec 005 FR-012) |
  | RQ-06 | Get hints | Yes | diagnosis | |
  | RQ-07 | Done, check it | Yes | diagnosis | Fixture: an after-fix snapshot (spec 005 FR-014) |
  | RQ-08 | That's on purpose | Yes | diagnosis | |
  | RQ-09 | An answer to an ask finding | Yes | diagnosis | One case per answer kind: intended, not intended, not sure |
  | RQ-10 | Look at this comp instead | Yes | diagnosis | |
  | RQ-11 | Warm up | Yes | each built skill's set | A spec 004 review: no demo, no walkthrough |
  | RQ-12 | Continue lesson | Yes (exists) | easing | Add a case if it has none today |
  | RQ-13 | Try again | Resends the last request | easing | Two cases: Show me again after a cut-off demo that landed; Check my work after a cut-off demo with no result |
  | RQ-14 | Check my work, Hint, Show me, Show me again | Yes (exist) | easing | Cases 17 to 20, unchanged |
  | — | Start fresh, End lesson, Stop looking, See the other N, tabs, back | No | — | Panel tests (FR-073), not evals |

- **FR-071**: The panel's requests-eval-sync test (spec 003, `panel/test/requests-eval-sync.test.js`)
  MUST be kept and widened: for each request that sends text, it checks that the named case's turn
  is that exact request (with the case's parameters filled in), and that every turn of a button
  case is a panel request. A change to a request without its case fails the test. Case numbers and
  files are the eval engineer's; the test only names them.
- **FR-072**: The easing eval set MUST pass at 25/25 or within one case, with no hard-rule failure,
  after the overhaul's mentor changes (PN-10, PN-13, PN-14). Diagnosis and skill sets meet their
  own specs' targets.
- **FR-073**: Actions that send no text (the last row above) MUST each have a panel test. Stop
  looking and End lesson MUST also have a test that the learner record is unchanged afterwards.

### Accessibility (README › Accessibility)

- **FR-074**: Every text colour MUST reach 4.5:1 contrast on the background it sits on. Three of
  today's tokens fail and MUST change: muted `#8a8a8a` → `#9a9a9a` (4.10:1 → 5.03:1 on raised
  cards); red `#e5534b` → `#ff7b72` (4.24:1 → 6.23:1); and the filled primary button's background
  → `#1473e6` (white text 3.46:1 on today's `#2d8ceb` → 4.54:1).
- **FR-075**: A state MUST NOT rely on colour alone: each has a glyph and a word; practice due and
  getting rusty differ in glyph; ask findings have a dashed border and "? Question"; the connection
  mark changes shape. Pushed-back cards are dashed, not faded, and keep full contrast; only stale
  rows dim, their note doesn't.
- **FR-076**: Body text MUST be 12 px, and text MUST NOT be under 11 px anywhere. (Today's section headings,
  `h2` in `panel/panel.css`, are 10 px.)
- **FR-077**: The tabs MUST be a real tablist (`role="tab"`, `aria-selected`, `aria-controls`, a
  tabpanel) with roving tabindex and Left, Right, Home and End keys.
- **FR-078**: After a tab change, focus MUST stay on the tab. After an action, focus MUST move to
  the newest mentor message or notice, else the banner, else the screen's title.
- **FR-079**: Every action MUST be reachable and usable by keyboard alone.
- **FR-080**: With reduced motion on, the spinner MUST slow and skeletons MUST stop animating.
- **FR-081**: At 260 px wide (the minimum) and 480 px tall, a state MUST NOT scroll sideways, and
  long text MUST wrap.

## What the panel needs from the mentor

The README's 15 items (› What the panel needs from the mentor), each as a requirement, plus one
the mockup implies (PN-16). The panel only displays, so each must arrive as data. **Change**
says what has to change for the panel to get it; **Built under** says which spec's plan builds the
producing side. Items built under specs 004 and 005 are this spec's requirements on those specs'
tool and record shapes; the cockpit should pass them on, since this spec can't edit theirs.

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

- **PN-09**: Up next: the skill, its reason, and when the reason is a finding, the finding, its
  date and its comp. Today the record has only a free-text `next` note.
- **PN-10**: A learner-facing next note per skill. Today's `next` is written for the mentor ("check
  key selection before F9").
- **PN-11**: Per skill, when its next review is due, and per skill the warm-up's expected length
  ("about 2 min").
- **PN-12**: Unanswered ask findings from the last look on each comp, for the question card.

**Lesson** (from tool results in the turn stream):

- **PN-13**: The lesson's title, skill and focus, and whether it's a lesson or a warm-up.
- **PN-14**: The proposed focus rows at the opening, and a signal when the focus is accepted or
  changed.
- **PN-15**: Whether `record_lesson` saved. Its result already says `saved: true` on success; the
  panel MUST treat anything else, including no result, as not saved.

**Path data**:

- **PN-16**: The path's skills in order, each with its learner-facing name, whether it's built,
  and which is the starting skill for a learner with no record, readable by the panel from the one
  place spec 004 FR-001 keeps it. It replaces the fixed list in `panel/lib/path.js`.

**Who changes what**:

| Item | Panel alone? | Mentor change | Built under | Needs an eval case? |
|---|---|---|---|---|
| PN-01 | No | Tools (diagnosis result shape); catalogue data (titles, answers) | Spec 005 | Covered by RQ-03 to RQ-09 |
| PN-02 | **Yes**, given PN-01 | — | This spec | No |
| PN-03 | No | Tools | Spec 005 | No (data only) |
| PN-04 | No | Tools | Spec 005 (FR-004) | Covered by spec 005's cases |
| PN-05 | No | Tools; catalogue data | Spec 005 | Covered by RQ-06 |
| PN-06 | No | Tools (symptom in, match flag out) | Spec 005 (FR-008) | Covered by RQ-04 |
| PN-07 | No | Tools (re-check) | Spec 005 (FR-014) | Covered by RQ-07 |
| PN-08 | No | Tools and learner record (diagnosis record) | Spec 005 (FR-017, FR-019) | Spec 005 case 11 |
| PN-09 | No | Learner record and skill (store the recommendation at each session's end) | Spec 004 (FR-004) with spec 005 (FR-020) | **Yes**: a case that the stored Up next and reason match the record |
| PN-10 | No | Learner record (new field), skill (writes it) | This spec | **Yes**: the note is learner-facing, plain, and holds no method or motive |
| PN-11 | No | Learner record (spec 004 FR-018 has the due date); path data (warm-up length) | Spec 004 | No (data only) |
| PN-12 | No | Learner record (ask findings' answered state) | Spec 005 (FR-017) | Covered by RQ-09 |
| PN-13 | No | Tools (opening result) | This spec, then every skill spec | **Yes**: easing opening case checks the result |
| PN-14 | No | Tools and skill (declare and accept the focus) | This spec, then every skill spec | **Yes**: opening, accepted, and changed focus |
| PN-15 | **Yes** | — (existing result) | This spec | No; a panel test with a failure fixture |
| PN-16 | No | Path data readable by the panel, with the built flag and starting skill | Spec 004 (FR-001, FR-003) | No |
| Status lines | **Yes** | — (tool names from specs 004, 005) | This spec | No |
| "Looked only" | **Yes** | — (FR-044's read-only list) | This spec | No |

Three items (PN-10, PN-13, PN-14) need the easing skill, its tools or the record to change under
this spec; they're the only mentor changes this spec builds itself. Each later skill spec carries
PN-13 and PN-14 for its own lesson.

## Build order and priorities

Each step can stop on its own and leave a working panel.

| Step | Priority | Builds | Needs | Ships |
|---|---|---|---|---|
| **0. Contrast fixes** | P1 | FR-074's three tokens and FR-076's 11 px floor, in today's `panel/panel.css` | Nothing | Can ship **ahead of the overhaul**, on spec 003's panel, as one small change with its own test (SC-008). |
| **1. Shell and lesson** | P1 | Tabs, Home A from today's record, the Lesson tab with the docked checklist, lesson-in-progress rules, plain errors, accessibility, the widened sync test | PN-10, PN-13, PN-14 (easing skill and tools), their eval cases | Easing only, in the new layout. Up next comes from today's fixed path (`panel/lib/path.js`) until spec 004's path data exists. |
| **2. Curriculum wave A** | P1 | Skills tab, path from data, Up next from the stored recommendation, Start lesson and New lesson for any built skill | Spec 004 wave A (PN-09, PN-16) | Easing plus skills 2, 1, 3; skills 5 and 6 (spec 004 wave B) arrive through the same screens |
| **3. Diagnosis** | P1 | The `diag-*` screens, story by story with spec 005 | Spec 005 US1, then US2, then US3 | See the next table |
| **4. Reviews** | P2 | Practice due, Warm up, the practice state | Spec 004 wave C (PN-11) | Practice across sessions |
| **5. First run** | P2 | `setup-*` screens and the Check setup entry, with option A's access-key sign-in | Spec 006 (its Q1 answered by `decisions/009`; the key source waits on its Q2) and the option A runtime spec | The installer path |

### If only diagnosis US1 and curriculum wave A exist

The sprint may be cut back. With only spec 005 US1 (ask and get a short, honest answer) and spec
004 wave A (path, recommendation, skills 2, 1, 3), this ships:

- **Home A**, with Up next from the stored recommendation (no finding as its reason), the
  diagnosis card, and memory. No question card and no Practice due card.
- **Lesson** in full (steps 1 and 2), for easing and skills 2, 1 and 3.
- **Skills** with learned, in progress, up next, not started and coming later (skills 4 to 10).
  No practice due or getting rusty.
- **Diagnosis, read-only**: `diag-running`, `diag-symptom-running`, `diag-results`, `diag-rest`,
  `diag-symptom-results`, `diag-symptom-none`, `diag-clean`, the Couldn't check list, "Looked
  only", and every failure state (`diag-nocomp`, `-unreachable`, `-busy`, `-error`, `-stopped`).
  Findings show kind and where but **no action buttons**: no Learn, Get hints, That's on purpose,
  or answer buttons, because leading into the fix is spec 005 US2. Ask findings still read as
  questions. **Ask the mentor** is the way to follow up.

### States by dependency

| Held until | States |
|---|---|
| Spec 005 US1 | `diag-running`, `diag-symptom-running`, `diag-results`, `diag-rest`, `diag-symptom-results`, `diag-symptom-none`, `diag-clean`, `diag-nocomp`, `diag-unreachable`, `diag-busy`, `diag-error`, `diag-stopped` |
| Spec 005 US2 | `diag-hints`, `diag-recheck-gone`, `diag-recheck-still`, `diag-recheck-changed`, `diag-intended`; finding actions and answer buttons |
| Spec 005 US3 | `diag-again`, `diag-othercomp`, Home's question card, Up next quoting a finding |
| Spec 004 wave A | `skills-few`, `skills-many`, Start lesson for skills other than easing |
| Spec 004 wave C | Practice due, `practice`, Warm up, the practice due state |
| Curriculum designer (C1) | Getting rusty |
| Spec 006 | `setup-welcome`, `setup-checking`, `setup-signin`, `setup-ready`, `err-notsetup` |
| Nothing (step 1) | Every other state in the README's table |

## Key Entities

- **Tab**: Home, Lesson or Skills; one selected at a time; never disabled.
- **Home card**: one of Up next, question, Practice due, What's wrong here?, memory, Lesson in
  progress, Your lesson is waiting; each drawn from the record, the path data or the panel session.
- **Panel state**: one README state id, with its trigger and source (R, P, T, M as the README
  defines them).
- **Fixed request**: one RQ entry: a label, its fixed wording, its parameters, and its eval cases.
- **Checklist row**: one focus target with its state (proposed, then each check's result), glyph
  and word.
- **Diagnosis view**: a look's scope line, findings in rank order, not-checked list, symptom echo,
  and since-last-time, all from one result (PN-01 to PN-08).
- **Skill row**: a path skill with its display state (FR-048), from the path data and the record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The builder completes quickstart steps a–f on Mentor Practice in the overhauled
  panel in **15 minutes or less**, with **zero** characters typed in a terminal, and the checklist
  visible from the opening. *Measured by:* the builder, in a usage session, timed from the call
  log.
- **SC-002**: Across at least 10 checks from the panel (at least 3 partial, 2 outside the lesson,
  1 undone), the checklist matches the check's result in **10 of 10** and a manual inspection in
  After Effects in **at least 9 of 10**; and across at least 3 openings, rows say Proposed until
  the accept signal, then not, in **3 of 3**. *Measured by:* panel tests on recorded streams, plus
  the builder in usage notes.
- **SC-003**: **100%** of the README's state ids in scope (FR-006) have a panel test that drives
  the panel into that state from a recorded stream or a saved record and checks what shows.
  *Measured by:* panel tests, with a list of ids checked against the README.
- **SC-004**: Home shows its cards with **zero** mentor turns, within **1 second** of the panel
  opening on a record of at least 20 lessons. *Measured by:* a panel test (no spawn) and a timing
  in usage notes.
- **SC-005**: Across every recorded diagnosis stream in spec 005's fixtures, the panel shows at most
  3 findings first in **100%**, never repeats a top-3 finding in the rest, shows the Couldn't check
  list whenever the result has one, shows "Looked only" **0 times** when a non-listed tool ran, and
  shows nothing from a stopped or cut-off turn. *Measured by:* panel tests.
- **SC-006**: Every request in FR-070 that sends text has at least one eval case, the sync test
  passes, the easing set passes at **25/25 or within one case** with no hard-rule failure, and
  each new case passes its set's rubric. *Measured by:* the sync test and eval runs.
- **SC-007**: In every panel test and usage session, **0** paths open two lessons, start a look
  during a lesson, or send Show me after a demonstration was made, including every cut-off retry.
  *Measured by:* panel tests on recorded streams, and the call log in usage sessions.
- **SC-008**: Every text token reaches **4.5:1** on its background, and **no** text is under 11 px.
  *Measured by:* an automated check over the panel's colour tokens and font sizes.
- **SC-009**: A keyboard-only walk of flows 2, 3 and 5 in the README (pick a skill, a lesson, a
  diagnosis) completes without a mouse, and focus lands where FR-078 says after each action, in
  **100%** of steps. *Measured by:* the builder, once, logged in usage notes.
- **SC-010**: At 260 × 480 px, in at least 12 states (named in the plan, including `lesson-partial`,
  `diag-results` and `home-cutoff`), nothing scrolls sideways and no button or the Ask input is
  clipped. *Measured by:* the builder, against the mockup at the same size.
- **SC-011**: **0** panel strings contain a file path, command, tool name, field name or error
  code. *Measured by:* an automated scan of the panel's copy and its error mappings.
- **SC-012**: "Saved to your history" shows **0 times** without a successful save, including on a
  failure fixture. *Measured by:* a panel test.
- **SC-013**: After at least 3 sessions with the overhaul, the builder's usage notes say which
  start each session used (Up next, Look at my comp, Skills), whether Up next was what they wanted,
  and whether they reached for Adobe's assistant. Either answer counts; it feeds Open question 3.
  *Measured by:* the builder, in usage notes. *Later:* these notes are the start of evaluating
  Home A. Once there are enough target-market testers for a comparison to mean something, Home A
  gets evaluated with them and possibly A/B tested against Home B (Open question 3); with the
  builder alone, the notes don't settle it.

## Assumptions

- **Runtime:** for the builder's prototype, the panel keeps running the mentor through headless
  Claude Code (`decisions/005`, B1) behind its one seam. Shipped Knack uses option A
  (`decisions/009`), built in its own runtime spec; when it lands, only the seam and the sign-in
  step change.
- **Container:** CEP, as today; nothing in the mockup needs more than the panel already uses
  (README › Open questions 9). A UXP port is its own work after the Nov 2026 beta.
- **User:** the builder on their own Mac with After Effects 26.5 on macOS 27.0.1, then the
  installer's
  testers.
- **Design source:** the README and `index.html` at revision 2. Text marked Placeholder there is
  the mentor's voice (the skill's) or catalogue wording (spec 005's), not panel copy.
- **Warm up is spec 004's review.** The button says Warm up; the record calls it a review.
- **Skill names** shown in the panel come from the path data (PN-16), not from the mockup.
- **Diagnosis entry:** on Home only, by the learner's press (Look at my comp). A lesson's opening
  never includes a diagnosis in the panel (Open question 1, answered; spec 005 FR-026).

## Out of scope (build scope)

- **Home option B** (diagnose-first) now. It may come back later as the other arm of an A/B test,
  once there are enough target-market testers (Open question 3).
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
- **Ask the mentor on Home or Skills** (Open question D2).

## Open questions

### For the human and the cockpit (these change the spec)

1. **What does Start lesson send, given Home A and spec 005's open question 2?** Spec 005
   recommends a short diagnosis opening when a session starts without a named skill; on Home A
   every Start lesson names a skill, so the two can't both be the default (README › Two caveats,
   2). Options: (a) Start lesson opens the named skill's lesson as today, and diagnosis stays a
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
   press Look at my comp first" undercounts it (README › Two caveats, 1). Options: put both starts
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
   session (cost per look and time to first finding, on Mentor Practice) before step 3's plan**;
   keep diagnosis on press only (no read on open) either way.
5. **Which sign-in model does the first-run flow draw?** `setup-signin` and `err-mentor` differ
   between B1 (Claude Code signed in) and option A (an access key, spec 006 Q1 and Q2).
   **Recommended: build steps 0 to 4 now and hold step 5 until spec 006's Q1 decision record**;
   until then `err-mentor`'s copy names no runtime ("The mentor can't start. Check setup.").
   **Answered 2026-10-20 by `decisions/009`:** step 5's first-run sign-in draws option A's
   access-key flow (FR-054). The exact key source still waits on spec 006 Q2.

### For the UI designer (D, don't block approval)

1. **Checklist from the opening** (README › Open questions 3): this spec requires it (FR-015,
   PN-14) and pays for it with a tool and skill change. Confirm the rows and the Proposed tag are
   still wanted at that cost.
2. **Keep Ask the mentor?** This spec keeps it on Lesson and diagnosis screens (FR-046,
   spec 003 FR-008). **Recommended:** keep it there; draw Ask outside a lesson only if usage notes
   show the builder needs it.
3. **Before and after frames vs. a moving demo** (interview 004): this spec shows only the frames
   the mentor renders. A before frame needs the skill to render one before the change.
4. **What does "What happened?" lead to** on `home-unreadable`?
5. **Card order on Home** now that Open question 3 is answered "both above the fold" (FR-007).

### For the curriculum designer (C, don't block approval)

1. **"Getting rusty"**: is it a state the curriculum wants (for example, a review overdue by some
   number of days), and what defines it? Until defined, the panel doesn't show it (FR-048).
2. **The warm-up's expected length** per skill (PN-11), and **skill groups** in the Skills tab (the
   mockup groups them; the path data has no groups). Until given, Skills is one list in path order
   and the length is left out.
3. **Finding titles, where wording and answer options** are catalogue wording (spec 005 open
   question 4's `teaching-design.md`), not panel copy.

## Dependencies

- **Mockup:** `product/mockups/ui-overhaul/README.md` and `index.html`, revision 2 (2026-10-20),
  UI designer's.
- **Spec 003** (shipped): the panel, its requests and sync test, its activity map, and its
  quickstart (used by SC-001).
- **Spec 004** (approved): path data (PN-16), the stored recommendation (PN-09), the record's review
  fields (PN-11), and waves A and C.
- **Spec 005** (approved): the diagnosis result (PN-01 to PN-08), the diagnosis record (PN-08, PN-12),
  its fixtures for SC-005, and its stories US1 to US3.
- **Spec 006** (approved): first run and sign-in (step 5), Check setup (FR-059).
- **Decisions:** `002`, `003`, `005`, `006`, `007`, `008`, and `009` (option A for shipped Knack,
  amends 005); none changes. Open question 1 was answered (a) plus (c), so no new one is needed.
- **Constitution 1.3.0**, Principles I to VI.
- **Eval engineer:** writes every case in FR-070 and owns their numbers and fixtures.
