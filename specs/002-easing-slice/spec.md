# Feature Specification: Easing Test Slice

**Feature Branch**: `002-easing-slice` (spec folder only; no git branch)

**Created**: 2026-09-30

**Status**: Draft

**Input**: User description: "Easing test slice. A mentor session in which Claude, connected to
my open After Effects project, leads a lesson on easing: takes a snapshot of my comp and spots
linear keyframes; explains ease and shows it with a preview frame; has me apply it myself, then
checks my change against the snapshot; records what I learned in a local learner file, so the
next session builds on it. It uses the narrow tools from decision 003 (snapshot_project,
diff_since_last, preview_frame, set_ease) through a forked CEP bridge. It includes a first eval
set in product/evals/. Out of scope: other skills, other apps, and any interface beyond Claude
Code."

**Why this slice**: it's the smallest version of the product that tests the claimed difference
from Adobe's assistant (`decisions/002`): the mentor **leads**, **checks the learner's own
attempt against real project data**, and **remembers** across sessions. Easing was the first
skill learned in self-test 1 and one that carried over unprompted (belief 2,
`discovery/insights.md`). It's also where Adobe's assistant admitted a limit: it can't see ease
settings (`discovery/competitors.md`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guided easing lesson on my own comp (Priority: P1)

I open my After Effects project and start a mentor session. Without my asking what to learn,
the mentor looks at my composition, finds animation that moves at a constant (linear) speed,
and tells me what it found, naming my actual layers and properties. It explains what easing is
and why the motion looks mechanical, and shows me the difference with a rendered frame from my
comp. It then asks me to apply easing myself. When I say I'm done, it checks what I changed
against what it saw before, and tells me whether I got it, what's still off, and why.

**Why this priority**: this is the core loop (goal → step → do it yourself → check) on one
skill. Without it there's nothing to remember or evaluate.

**Independent Test**: on the test project (`discovery/Claude AE Tutor Test.aep`), run one
session from start to a verified result. It's complete if the mentor finds the linear
keyframes, I apply easing in AE myself, and the check correctly reports what I did.

**Acceptance Scenarios**:

1. **Given** an open comp with linearly interpolated keyframes on at least one layer, **When**
   I start a session, **Then** the mentor names the layers and properties with linear
   keyframes before I ask a question, and proposes easing as the lesson.
2. **Given** the mentor has proposed the lesson, **When** it explains easing, **Then** the
   explanation refers to my own layer and timing and includes at least one rendered frame
   from my comp.
3. **Given** the mentor has asked me to apply easing, **When** I ease the keyframes it pointed
   to and say I'm done, **Then** it confirms which keyframes are now eased and explains what
   the change does to the motion.
4. **Given** I only eased some of the keyframes, or eased the wrong property, **When** I say
   I'm done, **Then** it says specifically which keyframes are still linear or what changed
   that it didn't ask for, and gives me a hint rather than fixing it.
5. **Given** the mentor has asked me to apply easing, **When** I ask it to just do it for me,
   **Then** it demonstrates on the first keyframe pair if it hasn't already (FR-006), and
   otherwise explains why I should do the rest myself, without easing them for me.
6. **Given** the mentor demonstrated on the first keyframe pair, **When** it checks my attempt,
   **Then** it credits the demonstrated pair to itself and grades only the keyframes I eased.

---

### User Story 2 - The mentor remembers what I learned (Priority: P2)

At the end of a session, the mentor records what I practiced and how it went. When I start a
new session later, it knows I've already covered basic easing, doesn't re-teach it from
scratch, and either checks that it stuck (a quick review on new keyframes) or suggests the next
step in the path (for example, adjusting ease strength in the Graph Editor).

**Why this priority**: memory is one of the three differences from Adobe's assistant, but it
only matters once Story 1 works.

**Independent Test**: complete Story 1, close the session, start a new session at least one
day later, and see whether the mentor refers to the earlier lesson without being told.

**Acceptance Scenarios**:

1. **Given** I completed an easing lesson, **When** the session ends, **Then** a learner record
   exists that says what skill was practiced, when, on which project, and whether my attempt
   passed the check.
2. **Given** a learner record shows easing was learned, **When** I start a new session,
   **Then** the mentor mentions the earlier lesson in its opening and either reviews or
   advances, not re-teaches from the beginning.
3. **Given** a learner record shows my last attempt failed the check, **When** I start a new
   session, **Then** the mentor picks up from what was still wrong.
4. **Given** I read the learner record directly, **When** I open it, **Then** I can understand
   it without tools (plain language, not only codes).

---

### User Story 3 - An eval set tells me whether it teaches well (Priority: P3)

I can run a set of saved test cases against the mentor and get a score on whether it teaches
well, not only whether it's correct: does it lead, does it make me do the work, is its check
accurate, does it use what it remembers.

**Why this priority**: required by constitution Principle III for any AI feature. It's what
turns "it felt good" into evidence, but the session has to exist first.

**Independent Test**: run the eval set and get a pass/fail per case plus a summary, without AE
open.

**Acceptance Scenarios**:

1. **Given** the eval set, **When** I run it, **Then** each case reports pass or fail against
   written criteria, with the reason for any failure.
2. **Given** the eval set, **When** I look at the cases, **Then** they cover at least: finding
   linear keyframes, a correct attempt, a partial attempt, a wrong-property attempt, a "just
   do it for me" request, and a returning learner.
3. **Given** a change to the mentor's teaching behavior, **When** I re-run the eval set,
   **Then** I can compare the result to the previous run.

---

### Edge Cases

- **Nothing to ease:** the comp has no keyframes, or they're already all eased. The mentor
  says so and suggests adding a simple animation to practice on, instead of inventing a
  problem.
- **Hold keyframes or expressions:** hold keyframes and properties driven by expressions
  aren't "linear motion" and aren't flagged as mistakes.
- **Only one keyframe on a property:** there's nothing to interpolate, so it isn't flagged.
- **AE busy or unreachable:** AE is rendering, a dialog is open, or the bridge isn't running.
  The mentor says it can't see the project right now and what to check, and doesn't guess at
  the state.
- **Project changed in other ways:** between the snapshot and the check I also moved layers or
  edited text. The check reports the easing result and briefly notes other changes, without
  treating them as errors.
- **Different comp:** I switch to a different comp before the check. The mentor notices, doesn't
  grade it, and asks me to switch back to the lesson's comp by name. It starts a new lesson on the
  other comp only if I say I want to.
- **Overdone ease:** I set extreme influence (for example 100%). It passes as eased, and the
  mentor may comment on the feel but doesn't fail it.
- **Lots to fix:** the comp has many linear pairs across many layers. The mentor picks a focus
  (a layer or two) instead of listing everything, and the check grades only that focus.
- **Hidden or invisible layers:** linear pairs on a hidden layer or a null are reported, but the
  demonstration always happens on a layer the learner can see.
- **Animation inside a precomp:** the mentor says there's a precomp it can't look inside yet,
  and doesn't claim that part of the project is fine.
- **Undo:** I undo my change before the check. The mentor reports that the keyframes are still
  linear.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The mentor MUST read the current state of the open After Effects composition
  (layers, animated properties, keyframe times, and each keyframe's interpolation and ease)
  when a session starts and whenever it checks an attempt.
- **FR-002**: The mentor MUST identify keyframes with linear temporal interpolation on
  animated properties and name them by layer, property, and time, without the learner
  asking.
- **FR-003**: The mentor MUST open the session by proposing a lesson based on what it found
  and on the learner record, not by waiting for a question.
- **FR-004**: The mentor MUST explain easing in terms of the learner's own layers and timing,
  and MUST show at least one rendered frame from the learner's comp during the explanation.
- **FR-005**: The mentor MUST ask the learner to apply the easing themselves, and MUST NOT
  change the project except as allowed by FR-006.
- **FR-006**: The mentor MAY demonstrate easing by changing the project, following "I do, we
  do, you do": it eases **only the first keyframe pair on one property** of the learner's
  layer, then the learner eases the rest. Any demonstration MUST be a single step the learner
  can undo, the mentor MUST say what it changed, and the check (FR-007) MUST report the
  demonstrated pair separately from the learner's own work. The mentor MUST NOT make more than
  one demonstration per lesson, even if asked.
- **FR-007**: When the learner says they're done, the mentor MUST compare the project with its
  earlier snapshot and report, per keyframe it pointed to, whether it is now eased.
- **FR-008**: When an attempt is incomplete or wrong, the mentor MUST say what's still off and
  why, and MUST give a hint instead of fixing it.
- **FR-009**: The mentor MUST NOT report a pass or fail when it can't read the project (AE busy,
  bridge down, different comp), and MUST tell the learner what to check.
- **FR-010**: At the end of a session, the mentor MUST save a learner record entry: skill,
  date, project, what was attempted, the check result, and a short note on what to review or
  do next.
- **FR-011**: At the start of a session, the mentor MUST read the learner record and use it to
  choose between teaching, reviewing, or advancing.
- **FR-012**: The learner record MUST be stored locally on the learner's machine in a form a
  person can read and edit, and MUST NOT contain real names, emails, or phone numbers
  (constitution Principle IV).
- **FR-013**: The mentor MUST NOT have a way to run arbitrary scripts in After Effects; it can
  only use a fixed set of project reads, a rendered frame, and the one demonstration change
  (`decisions/003`).
- **FR-014**: The eval set MUST run without After Effects open, using saved project snapshots,
  and MUST score each case against written teaching-quality criteria as well as correctness.

### Key Entities

- **Keyframe pair (segment)**: two neighbouring keyframes on one property, and the motion between
  them. Easing is judged per pair. The pairs a lesson focuses on are its **targets**, and "the
  keyframes it pointed to" in the scenarios means these.
- **Project snapshot**: what the mentor saw in the comp at a moment in time: the comp, its
  layers, their animated properties, and each keyframe's time, value, interpolation, and ease.
  Two snapshots can be compared to see what the learner changed.
- **Lesson**: one session's teaching unit: the skill (easing), the keyframes it targets, the
  explanation and frame shown, any demonstration made, and the check result.
- **Learner record**: what the learner has practiced over time: a list of lesson results by
  skill and date, plus what to review or do next. Persists across sessions and projects.
- **Eval case**: a saved situation (a snapshot, optionally a second snapshot as the "attempt",
  optionally a learner record, and a learner message) plus the criteria a good mentor response
  must meet.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the practice comp, the mentor finds 100% of the linear keyframe pairs on
  animated properties (including nested, separated, and effect properties), with no false flags
  on eased pairs, hold keyframes, single keyframes, or expression-driven properties.
- **SC-002**: A full lesson, from starting the session to a verified eased result, takes 15
  minutes or less for the builder on the test project.
- **SC-003**: The mentor's check agrees with a manual inspection in AE in at least 9 of 10
  attempts, including deliberately partial and wrong attempts.
- **SC-004**: Across all sessions and eval runs, the mentor makes zero project changes other
  than the declared demonstration.
- **SC-005**: In a session started at least one day after a lesson, the mentor refers to the
  earlier lesson in its opening without being prompted, and doesn't re-teach basic easing
  from the start.
- **SC-006**: The eval set has at least 10 cases covering the scenarios in Story 3, and the
  mentor passes at least 80% of them.
- **SC-007**: In the builder's usage notes after at least three sessions, the builder records
  whether they reached for this mentor or Adobe's assistant when learning easing, and why.
  This is the `decisions/002` signal, so both answers count as a result.

## Assumptions

- **User:** the builder is the only user for this slice, on their own Mac, with After Effects
  (26.4 or later) open. Usability tests with other learners come later.
- **Connection:** reads, the rendered frame, and the one allowed change go through the forked
  After Effects bridge with narrow tools, as set in `decisions/003`. Spec 001 showed that
  keyframe interpolation and temporal ease can be read.
- **Interface:** the session runs in Claude Code (or Claude Desktop). No custom interface,
  highlights, or video. "Showing" means rendered frames and references to named layers.
- **What counts as eased:** a keyframe counts as eased if its temporal interpolation is no
  longer linear on the side(s) the mentor pointed to. The exact ease values aren't graded in
  this slice.
- **Change detection:** the mentor compares snapshots on request ("I'm done"). It doesn't
  watch the project live, since After Effects doesn't push changes (`discovery/ae-bridge-findings.md`).
- **Learner record scope:** one learner, one file, on this machine. No accounts or sync.
- **Out of scope:** other skills (Graph Editor ease shaping, motion blur, audio sync), other
  apps, a custom interface, doing tasks on request, and packaging for other users.
- **Future idea, not in this slice:** an animated demo in an extension panel that plays a
  stripped-down version of the steps the learner needs to take. It would address "showing,
  not telling" better than rendered frames, but it needs a panel interface (option 3 in
  `decisions/003`), which is a much heavier lift.
