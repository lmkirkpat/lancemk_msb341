# Feature Specification: Mentor Panel in After Effects

**Feature Branch**: `003-mentor-panel` (spec folder only; no git branch)

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "A rudimentary version of the mentor panel inside After Effects,
built from `product/mockups/ae-panel.md` and `decisions/005` (the panel drives headless Claude
Code). The mentor's instructions, 'Ask the mentor', the Check my work / Hint / Show me again
buttons, the lesson step path, the learning path summary and memory all show up in the panel and
work. The easing lesson can run entirely within the panel. Claude Code can be open if necessary."
Scope from `sprints/sprint-2-plan.md` › Raised goals: one easing lesson (quickstart steps a–f)
from start to finish using only the panel, with memory shown read-only.

**Why this slice**: running the mentor only from a terminal blocks testing the teaching where the
learner actually works. Spec 002 proved the teaching loop in Claude Code. This spec moves the
same loop, unchanged, into a panel inside After Effects, so the next tests are about the
experience in AE rather than about switching windows. It's the "build the interface next" signal
in `decisions/003` › What would change our mind, tested at the smallest size that could answer it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Take an easing lesson without leaving After Effects (Priority: P1)

I open the AE Mentor panel from After Effects' Window menu, next to my comp. I start a lesson
from the panel. The mentor's opening appears in the panel: it names the linear keyframes it found
on my layers and proposes a focus, the same way it does in Claude Code today. It explains easing
with a rendered frame from my comp, shown inside the panel. I can press **Show me** and it eases
the first pair as a demonstration. I ease the rest myself in AE, then press **Check my work**. The
panel lists each keyframe pair in the lesson and whether it's eased, still linear, or was the
mentor's demo, and the mentor tells me what's still off. If I'm stuck I press **Hint**. If I have a
question, I type it into **Ask the mentor**. I never type in a terminal.

**Why this priority**: this is the whole point of the raise. Without it there's nothing to see
in the panel worth remembering or summarizing.

**Independent Test**: on the test project (`discovery/Claude AE Tutor Test.aep`, comp **Mentor
Practice**), run quickstart steps a–f (opening, explain with a frame, demo, partial attempt,
complete attempt) using only the panel. It's complete if every step happens in the panel, nothing
is typed in a terminal, and each check's list matches what's eased in AE.

**Acceptance Scenarios**:

1. **Given** After Effects is open with the test comp and the panel is open, **When** I start a
   lesson from the panel, **Then** the mentor's opening appears in the panel and names the layers
   and properties with linear keyframes, before I type anything.
2. **Given** the mentor is explaining easing, **When** it shows a frame from my comp, **Then** the
   frame appears inside the panel next to the explanation.
3. **Given** no demonstration has been made in this lesson, **When** I press **Show me**, **Then**
   the mentor eases only the lesson's first keyframe pair, says what it changed and that Edit >
   Undo reverses it, and the button changes to **Show me again**.
4. **Given** the demonstration has already been made, **When** I press **Show me again**, **Then**
   the mentor re-explains what the demonstrated pair does, with a frame, and doesn't change the
   project.
5. **Given** I eased some but not all of the lesson's pairs, **When** I press **Check my work**,
   **Then** the panel lists every pair in the lesson with its state (eased by me, demo, or still
   linear), and the mentor names what's still linear and gives a hint, not a fix.
6. **Given** I eased a property outside the lesson, **When** I press **Check my work**, **Then**
   the panel lists that change separately as outside the lesson, without counting it as an error.
7. **Given** I've had a check that wasn't complete, **When** I press **Hint**, **Then** the mentor
   gives one more specific hint about the remaining pairs and doesn't change the project.
8. **Given** a lesson is in progress, **When** I type a question into **Ask the mentor**, **Then**
   the answer appears in the panel and the mentor goes back to the lesson afterwards.
9. **Given** I eased every pair in the lesson, **When** I press **Check my work**, **Then** the
   panel shows the lesson as passed and the mentor records the lesson in my learner record.

---

### User Story 2 - See where I am in the lesson and the path (Priority: P2)

While a lesson runs, the panel shows the lesson's stage (I do, We do, You do) and a short
learning path (for example: Keyframes, Easing, Graph Editor, Bounce) with what I've done, what
I'm on, and what's next. I can tell at a glance where I am without scrolling back through the
mentor's messages.

**Why this priority**: it makes "the mentor leads" visible, which is one of the three claimed
differences from Adobe's assistant (`decisions/002`). But the lesson works without it.

**Independent Test**: during the Story 1 run, compare the stage indicator and the path with what
actually happened (demo made or not, attempts made, lesson passed) and with the learner record.

**Acceptance Scenarios**:

1. **Given** a lesson has started and no demo has been made, **When** I look at the stage
   indicator, **Then** it shows "I do" as the current stage.
2. **Given** the mentor has made its demonstration, **When** I look at the stage indicator,
   **Then** "I do" is done and "We do" or "You do" is current, matching the mentor's last
   message.
3. **Given** the lesson passes, **When** I look at the path, **Then** Easing shows as done and the
   next skill shows as next.
4. **Given** the learner record says I've already done a skill, **When** I open the panel,
   **Then** the path shows that skill as done before any lesson starts.

---

### User Story 3 - See what the mentor remembers (Priority: P2)

At the bottom of the panel, I can see what the mentor remembers from earlier lessons: when I last
practiced, what skill, whether it passed, and what's next. It's the same thing the mentor reads at
the start of a lesson, so I can tell why it opens the way it does.

**Why this priority**: memory is one of the three claimed differences, and showing it makes it
something I can check rather than take on trust. It's read-only, so it's small.

**Independent Test**: with a learner record from an earlier lesson, open the panel and compare
the memory section with the record file, line by line.

**Acceptance Scenarios**:

1. **Given** a learner record with at least one lesson, **When** I open the panel, **Then** the
   memory section shows the most recent lesson's date, skill, result, and the "next" note.
2. **Given** no learner record exists yet, **When** I open the panel, **Then** the memory section
   says there are no lessons yet, without an error.
3. **Given** a lesson just passed and was recorded, **When** the lesson ends, **Then** the memory
   section updates to show that lesson without reopening the panel.
4. **Given** the memory section, **When** I look for a way to edit it, **Then** there's none: the
   panel only shows the record.

---

### User Story 4 - The panel's buttons are evaluated (Priority: P3)

The buttons send the mentor fixed requests that a typed message never did ("check my work",
"hint", "show me again"). I can run the eval set and see that the mentor still teaches well when
those requests come from buttons.

**Why this priority**: required by constitution Principle III for any change in how the mentor
is asked to behave. The teaching itself doesn't change, so this adds cases rather than a new set.

**Independent Test**: run the eval set, including the new button cases, without After Effects
open, and get a pass/fail per case.

**Acceptance Scenarios**:

1. **Given** the eval set, **When** I look at the cases, **Then** there's at least one case each
   for Check my work, Hint, Show me, and Show me again after a demo was already made.
2. **Given** the full eval set with the new cases, **When** I run it, **Then** it passes at least
   80%, and the existing spec 002 cases still pass at their previous rate or better.

---

### Edge Cases

- **Mentor can't start:** the program the panel relies on to run the mentor isn't installed,
  isn't signed in, or fails to start. The panel says so in plain words and what to check, and
  shows no lesson state.
- **AE busy or unreachable:** AE is rendering, a dialog is open, or the bridge isn't running. The
  mentor says it can't see the project (spec 002 FR-009). The panel shows no check result for that
  turn, never an old one.
- **Slow turn:** the mentor takes several seconds to start replying. The panel shows that it's
  working, and the buttons and the input are paused until it finishes, so a second click can't
  send a duplicate request.
- **Show me after the demo:** the button already reads **Show me again**, and nothing the panel
  sends can cause a second demonstration (spec 002 FR-006).
- **Check before any change:** I press Check my work without changing anything. The list shows
  every pair still linear, and the mentor says so.
- **Undo:** I undo the demo or my own change before checking. The list reports what's actually in
  the project, not what was there before.
- **Different comp:** I switch to another comp before checking. The mentor asks me to switch back
  (spec 002 edge case), and the panel shows no check result for that turn.
- **Panel closed mid-lesson:** I close the panel and reopen it in the same AE session. The panel
  offers to continue the unfinished lesson. If I start over instead, nothing in the learner record
  is lost.
- **AE quits mid-lesson:** nothing is recorded for the unfinished lesson. The next panel session
  starts from the learner record as it was.
- **Lesson also open in a terminal:** I run `/ease-mentor` in a terminal while the panel lesson is
  open. This isn't supported. The panel doesn't need to detect it, but nothing it does may
  corrupt the learner record (one lesson writes at a time).
- **Long or off-topic question:** the mentor answers briefly and returns to the lesson, as in
  spec 002's usage notes.
- **Narrow panel:** the panel is docked at its narrowest useful width. The lesson list, buttons,
  and input stay usable without horizontal scrolling. Long mentor messages wrap.
- **Missing or unreadable learner record:** the memory section and the path say there's no
  history yet, and the lesson starts as a first lesson.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The panel MUST open from After Effects' Window > Extensions menu and dock like other
  AE panels.
- **FR-002**: The learner MUST be able to start an easing lesson from the panel, and the mentor's
  opening MUST appear in the panel without the learner typing anything outside it.
- **FR-003**: Everything the mentor says MUST appear in the panel as it's produced, in a
  scrollable conversation with the newest message visible.
- **FR-004**: Frames the mentor renders from the learner's comp MUST appear inside the panel, next
  to the message they belong to.
- **FR-005**: The panel MUST offer **Check my work**, **Hint**, and **Show me** buttons. Each
  sends the mentor one fixed request. The mentor answers with the same teaching rules as spec 002
  (FR-005 to FR-009 there apply unchanged).
- **FR-006**: Before the lesson's demonstration, the demo button MUST read **Show me**. After it,
  the button MUST read **Show me again**, and pressing it MUST only re-explain the demonstrated
  pair with a frame, never change the project. The panel MUST NOT offer any control that asks for
  more than one demonstration per lesson, or asks the mentor to ease the rest.
- **FR-007**: After each check, the panel MUST list every keyframe pair in the lesson's focus with
  its state (eased by the learner, the mentor's demo, or still linear), plus any changes outside
  the lesson listed separately. The list MUST come from the check's comparison result itself, not
  from the mentor's wording, and MUST agree with it every time.
- **FR-008**: The panel MUST have an **Ask the mentor** input for free-text questions, answered in
  the panel.
- **FR-009**: The panel MUST show the lesson's stage (I do, We do, You do) and update it as the
  lesson moves: the demo moves past "I do", and a learner attempt moves to "You do".
- **FR-010**: The panel MUST show a short learning path with each skill as done, current, or next,
  based on the learner record and the current lesson.
- **FR-011**: The panel MUST show a read-only memory section with the most recent lesson's date,
  skill, result, and "next" note from the learner record, and MUST update it when a lesson is
  recorded.
- **FR-012**: While the mentor is working, the panel MUST show that it's working and MUST NOT send
  another request until the current one finishes.
- **FR-013**: The panel MUST hold no teaching rules of its own. What to teach, when to demonstrate,
  how to grade, and what to record are decided by the mentor exactly as in spec 002
  (`decisions/003`, `decisions/005`).
- **FR-014**: The panel MUST NOT read or change the After Effects project itself. Every project
  read, rendered frame, and the one demonstration goes through the mentor's existing tools, so
  undo and the one-demo limit behave as they do in spec 002.
- **FR-015**: When the mentor can't run, or can't see the project, the panel MUST say so in plain
  words with what to check, and MUST NOT show a check result for that turn.
- **FR-016**: If the panel is closed and reopened during a lesson in the same AE session, it MUST
  offer to continue that lesson.
- **FR-017**: The panel MUST NOT show the learner internal field names, tool names, or raw data
  (spec 002 skill rule "Speak plainly"). Lists and labels are written for the learner.
- **FR-018**: Nothing the panel stores or logs may contain real names, emails, or phone numbers
  (constitution Principle IV).
- **FR-019**: The eval set MUST include cases for each button's request (Check my work, Hint,
  Show me, Show me again after a demo), scored on the same teaching-quality rubric as spec 002.

### Key Entities

- **Panel session**: one run of the mentor started from the panel, from opening to the lesson
  being recorded or abandoned. It holds the conversation and the current lesson. It can be
  continued after the panel is reopened in the same AE session (FR-016).
- **Button request**: a fixed message a button sends to the mentor (check, hint, show me, show me
  again). Each is written once and is an eval case (FR-019).
- **Check result**: the per-pair outcome of one comparison (eased by learner, demo, still linear,
  outside the lesson), shown as the panel's list. Defined in spec 002 (FR-007 there).
- **Lesson stage**: where the lesson is in I do, We do, You do. Derived from what has happened
  (demo made, attempts checked), not from the mentor's wording.
- **Learner record**: as in spec 002. The panel only reads it, for the path and memory sections.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The builder completes quickstart steps a–f on the test comp using only the panel,
  with zero characters typed in a terminal during the lesson.
- **SC-002**: Across at least 10 checks run from the panel (at least 3 partial, 2 outside the
  lesson, 1 undone), the panel's list matches the check's comparison result in 10 of 10, and
  matches a manual inspection in AE in at least 9 of 10.
- **SC-003**: Across all panel sessions, the project is changed only by the one declared
  demonstration per lesson, never by the panel or by Show me again.
- **SC-004**: After a button press or question, the mentor's reply starts appearing within 10
  seconds in at least 9 of 10 turns. (This is the main risk of `decisions/005`; log every turn's
  wait in usage notes.)
- **SC-005**: A full lesson in the panel, from starting it to a passing check, takes 15 minutes or
  less for the builder, the same bar as spec 002 SC-002.
- **SC-006**: The memory section matches the learner record in 100% of checks (at least 3: no
  record, after one lesson, after a second lesson).
- **SC-007**: The eval set, with the new button cases, passes at least 80%.
- **SC-008**: After at least 2 panel lessons, the builder's usage notes say whether the panel
  changed how they learn compared with the terminal, and whether they reached for Adobe's
  assistant instead. Either answer counts as a result.

## Assumptions

- **Runtime:** the panel runs the mentor by driving Claude Code in the background, per
  `decisions/005` (option B1). Claude Code is installed and signed in on the builder's Mac. The
  mentor's skill, tools and learner record are the ones from spec 002, unchanged except for any
  fixes the new eval cases find.
- **Model-facing code behind one seam:** everything that talks to the mentor sits behind one
  replaceable part, so moving to a direct API connection later (`decisions/005` option A) means
  replacing that part, not the panel.
- **User:** the builder is the only user, on their own Mac, with After Effects 26.4 or later.
  No other users, no installer, no Windows testing.
- **Container:** a CEP panel, knowing CEP is being retired (off by default Dec 2028). It's rebuilt
  on UXP after the AE UXP beta (Nov 2026) if this test earns it.
- **Look:** follows `product/mockups/ae-panel.md` loosely and fits AE's dark UI. Visual polish
  isn't graded in this slice.
- **Learning path:** a fixed, short list for easing's neighbours (Keyframes, Easing, Graph Editor,
  Bounce). Only Easing is teachable. The others are labels.
- **Continue after reopening:** only within the same AE session. After AE restarts, a new lesson
  starts from the learner record.
- **Out of scope:** other skills, other apps, a direct API connection, UXP, packaging for other
  users, cost display, accounts, editing the learner record from the panel, animated demos, and
  live change detection (checks stay on request).

## Dependencies

- Spec 002's mentor (skill, tools, learner record, evals) works as of `5d1e7c8` and later.
- `decisions/005` (the panel drives Claude Code in the background).
- **Constitution 1.1.0** (amended 2026-10-05): Principle II now allows a panel inside AE that
  starts the mentor and shows what it says, as long as it holds no teaching logic, touches the
  project only through the mentor's tools, and only reads the learner record. FR-013, FR-014 and
  US3 › scenario 4 are how this spec meets it.
