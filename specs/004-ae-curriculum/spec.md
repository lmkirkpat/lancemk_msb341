# Feature Specification: After Effects curriculum (ten skills beyond easing, five this sprint)

**Feature Branch**: `004-ae-curriculum` (spec folder only; no git branch)

**Created**: 2026-10-20

**Status**: Approved 2026-10-20. Plan and tasks come next. The builder's answers are folded in the
same day: H1 (After Effects 26.5 on macOS 27.0.1), H2 (this sprint's baseline is five skills: 2, 1,
3, 5, 6) and Q1 to Q3 (the written defaults, for now). Still open: H3, H4, H5 and its shared-code
owner note (FR-032), `curriculum.md`'s H4, H6 and H7, and the B and E items. None blocks the plan.
Revised 2026-10-20 with the curriculum designer's round 1 answers (`curriculum.md` › 13): FR-004,
FR-005, FR-018 to FR-021, FR-027 to FR-029 and the new FR-037 changed; the three conflicts they
raised (Q1 to Q3) are settled.

**Input**: Cockpit task, Sprint 3 parallel run 1 (wave 3): "Write the curriculum spec, which decides
the 10 skills and what has to exist so they can be built." The teaching design is the curriculum
designer's [`curriculum.md`](curriculum.md) (same folder, `decisions/007`). This spec links to it
and turns it into requirements. It doesn't restate or change what is taught. Where this spec needs
something the design doesn't say, it's a question for the designer (Open questions › C).

**What this spec is, and isn't.** It decides which ten skills make up the path, which five are this
sprint's baseline (2, 1, 3, 5, 6; H2), and in what order they get built, and it specifies the
**shared pieces** every skill needs before skills can be built in parallel: the shared reads, the
visibility rule, the motion-sources map, the cross-layer timing analysis, the path and
recommendation, reviews across sessions, the learner record's shape, a second practice comp, and
who owns the shared analysis code. Each of the ten skills then gets **its
own spec** (with its own `/overlap-audit`, demo write tool, pass check and eval cases). This spec
sets only what every skill spec must meet.

## Why this curriculum

- **The pain it answers.** Learners stitch together generic videos and a text chatbot, and the
  skill fades (CLAUDE.md, interview 004). After Effects learners also lose hours finding what
  broke (interview 007, Did) and follow help written for another version (008, belief 16).
  `curriculum.md` › 1 has the evidence.
- **Adobe's lead is breadth** (many skills plus diagnosis, side-by-side 2026-10-08). Knack today
  teaches one skill. This spec closes that gap with ten more in the path, five of them this sprint
  (H2); spec 005 closes the diagnosis gap.
- **What Adobe's assistant can't easily copy** is not restraint or leading (a mode switch could copy
  those, `decisions/002`). It's:
  1. **Depth of the per-step checks.** Knack checks each pair, key and setting on data Adobe's
     assistant said it couldn't read on 2026-10-08: key types (skill 1), ease and influence
     (skill 2; Adobe left 7 properties "unconfirmed"), comp-space positions after an anchor move
     (skill 5), each child of a null (6), Trim End's ease and where Trim sits (7), the live matte
     settings for the learner's version (8), the text animator tree (9). This edge is real today
     and could shrink if Adobe adds those reads.
  2. **Memory and practice across sessions.** Each skill has a review check: in a later session,
     on a target the learner hasn't done, with no demo and no walkthrough (`curriculum.md` › 2).
     The record picks pairs eased last week for skill 2, notices lockstep coming back for skill
     3, and asks the learner to trace a source first in later lessons for skill 4. Adobe's
     assistant described no memory of the learner.
- **Where the edge is small, said plainly** (from `curriculum.md` › 6):
  - **Skill 3 (offset):** Adobe reads key times too. The edge is that the learner does it and the
    record notices lockstep coming back. Memory and practice, not depth.
  - **Skill 4 (find what's moving it):** Adobe's assistant can answer "why is this moving" for
    you. The edge is that the learner can trace it with no tool open, and the record practices
    it. Memory and practice, not depth.
  - **Skill 10 (precompose):** Adobe precomposes on request. Knack's added check (keys arrived
    inside intact, the edit made at the right level) is modest; the larger gain is that the
    inside-precomp read (R4) lifts easing's and diagnosis's "can't see inside" blind spot.

## Decisions and rules this spec relies on

- `decisions/002` (the bet, and the trigger if Adobe adds a teaching mode): every skill spec's "why"
  names depth or memory, never restraint alone.
- `decisions/003` amended by `005`: thin bridge, narrow tested mentor tools, no open-ended scripts,
  learner record in local files, the panel only displays. Every new read and demo write is a fixed
  mentor tool (FR-009, FR-024).
- `decisions/007`: the curriculum designer owns what is taught (`curriculum.md`); the spec writer
  owns this file; the skill builder owns `mentor/` and skill prompts; the eval engineer owns
  `product/evals/` and writes the cases.
- `decisions/008`: one agent on After Effects at a time (the lock), and ownership hooks. Parallel
  skill builds use worktrees and `/merge-worktree`.
- Constitution 1.3.0: I (each skill gets its own spec before build), II (FR-009, FR-024, FR-031),
  III (FR-033 to FR-036), IV (FR-021), V (first skills before the rest), VI (FR-012, FR-035).
- Spec 002 (easing): the lesson shape, the record, `record_lesson`'s session check, the
  demonstration rule (FR-006), and the 25/25 eval baseline (2026-10-19).
- Spec 005 (diagnosis, approved): FR-010's map from findings to skills (`curriculum.md` › 10),
  FR-020's "pull a skill forward" and "review, not a first lesson", and DX-02, DX-03, DX-07, which
  share the cross-layer timing analysis (FR-016).

None needs changing. One may need a note: see Open questions › H5 (shared code ownership when two
skill builders run at once).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Take the first three new lessons on my own comp (Priority: P1)

I've learned easing. Knack offers the next lessons, starting with shaping the ease in the speed
graph, then picking key types on purpose, then breaking the lockstep with offset. Each runs like
the easing lesson: it looks at my comp, proposes a focus, explains with a frame from my comp, does
one demonstration when I ask, and checks what I did with my own hands.

**Why this priority**: these three run on what the mentor already reads (`curriculum.md` › 5,
"First skills"), so they're the smallest test of "more skills, same depth". If the sprint is cut
back to two or three skills, this story is what ships. Skill 2 has the clearest depth edge (Adobe
couldn't confirm ease).

**Independent Test**: with only skills 2, 1 and 3 built, run each as a live lesson on the
builder's own comp (Mentor Practice, and the second practice comp for skill 1's target). It's
complete if each lesson reaches a verified result, with at most one demonstration, and the
easing evals still pass at baseline.

**Acceptance Scenarios**:

1. **Given** the record says easing is learned, **When** I start a session without naming a
   skill, **Then** the mentor recommends one of the built first skills by the path rule (FR-004)
   and says why in one sentence.
2. **Given** I start skill 2, 1 or 3, **When** the lesson runs, **Then** it follows the six stages
   in `curriculum.md` › 2, with that skill's focus, steps and pass from `curriculum.md` › 6, and
   the margins in FR-026 to FR-029.
3. **Given** a focus with only one target, **When** I ask for a demonstration, **Then** there
   isn't one, and the mentor walks me through it in words (`curriculum.md` › 2, stage 3).
4. **Given** I say "done" with something still off, **When** the mentor checks, **Then** it names
   which layer, property and time are off and doesn't fix it.
5. **Given** any of the three is merged, **When** the easing eval set runs, **Then** it passes at
   25/25 or within one case, with no hard-rule failure.

---

### User Story 2 - Know what to learn next, and why (Priority: P1)

After a lesson, or at the start of a session, Knack tells me which skill comes next and why, picked
from what I've learned, what's still in progress, and what my comp has in it. If I ask for a skill I
don't have the groundwork for, it tells me which one comes first.

**Why this priority**: with more than one skill, a path nobody can see isn't a curriculum. It's
also what spec 005 hands to (FR-010, FR-020). P1 because it's small and needed as soon as a second
skill exists.

**Independent Test**: on saved learner records in each state (nothing learned; easing learned;
skill 2 practicing; skills 1–3 learned with a review due; a hard prerequisite missing), the
recommendation matches FR-004 every time. Then one live check in a session.

**Acceptance Scenarios**:

1. **Given** a skill I'm practicing (passed never, attempted before), **When** a session starts,
   **Then** that skill is offered first, picking up what was still off.
2. **Given** no skill in progress, **When** a session starts, **Then** the mentor offers the first
   built, not-yet-learned skill in path order whose hard prerequisites I've learned, preferring
   one my open comp has a focus for (FR-004).
3. **Given** I ask for a skill whose hard prerequisite I haven't learned, **When** the mentor
   answers, **Then** it names the prerequisite in one sentence and offers it first. If I still want my
   skill, the lesson runs without reteaching the prerequisite (FR-005).
4. **Given** the path, **When** a skill isn't built yet, **Then** it's never recommended or started.
5. **Given** a recommendation, **When** I pick a different built skill whose hard prerequisites
   I've learned, **Then** that lesson starts.

---

### User Story 3 - Review a skill in a later session (Priority: P2)

A few days after I learned a skill, Knack asks me to use it again on something I haven't done
before, without a demonstration or a walkthrough, and checks it the same way. If I get it, the
next review is further out. If something's off, it tells me what, and reviews it sooner.

**Why this priority**: this is the practice half of the "why", and the part Adobe has no way to do
today. P2 because it only matters once a skill has been learned, and the first skills come first.

**Independent Test**: with a saved record that says skill 2 was learned three or more days ago,
start a session on a comp with a new eased pair. It's complete if the mentor offers a review, gives
no demonstration and no walkthrough, picks a target not in the record for that skill, checks it
with the skill's own pass, and records it as a review with the next review date (FR-018, FR-019).

**Acceptance Scenarios**:

1. **Given** a learned skill whose review is due and a new target in my comp, **When** a session
   starts and no skill is in progress, **Then** the mentor offers that review in one sentence. It's
   an offer: if I decline, the session goes on and the review stays due.
2. **Given** a review, **When** it runs, **Then** there's no demonstration and no walkthrough: the
   task, the skill's intent questions (what should snap, where the hinge is, what order), and after
   "done", the check. Hints after a check that isn't a pass are allowed; a reteach isn't.
3. **Given** a review, **When** the mentor picks a target, **Then** it's not a layer and property
   the record shows I did for this skill on this comp.
4. **Given** I pass the review, **When** it's recorded, **Then** the next review is further out
   (FR-019). **Given** I don't, **Then** the skill stays learned, the next review is the shortest
   interval, and the record's "next" names what was still off. I can then ask for a practice
   lesson, which may have a demonstration.
5. **Given** spec 005 finds something a learned skill covers, **When** it recommends, **Then** it
   offers this review on that finding (spec 005 FR-020), counted as the same review.
6. **Given** a review is due but my comp has nothing new to practice it on, **When** the session
   starts, **Then** no review is offered, and it stays due without counting as missed or failed.
7. **Given** a skill I haven't learned, **When** I say I already know it, **Then** the mentor runs
   it as a review (no demo, no walkthrough); if I pass, the skill is learned, recorded as "already
   knew it", and its schedule starts from that pass. The mentor never offers this unprompted.

---

### User Story 4 - Knack sees parents, expressions, precomps and mattes (Priority: P2)

Knack reads where my layers' motion really comes from (their own keys, a parent, an expression, or
keys inside a precomp) and which layers render, and every lesson uses the same reading. A matte
that's hidden on purpose and moving is treated as moving, not as "you've hidden this".

**Why this priority**: skills 4 to 10 need these reads, and building them once (with one owner)
before those skills run in parallel stops each skill inventing its own filter (`curriculum.md` › 5,
CLAUDE.md "Edge cases"). P2: after the first skills, before the rest. Part of it is in this
sprint's baseline (H2): R1, R3, the visibility class, the parent-chain part of the map and KD-001's
fix come before skills 5 and 6 (wave B), so scenarios 1, 2 and 5 are baseline. Scenarios 3 and 4
need R2 and R4, which come with skill 4 (wave D, stretch).

**Independent Test**: on saved snapshots with an answer key (Mentor Practice plus planted
overlaps), the shared reads, the visibility class and the motion-sources map match the key on
every layer, and the easing analysis's findings on Mentor Practice are unchanged.

**Acceptance Scenarios**:

1. **Given** a matte layer with its eye off and Position keys, **When** an easing lesson looks at
   the comp, **Then** the matte's pairs are in the findings and it isn't left out as hidden
   (Known defect KD-001 fixed).
2. **Given** Title in Mentor Practice (own keys plus the CTRL parent), **When** the motion-sources
   map is read, **Then** it lists both.
3. **Given** Logo (an expression over its keys) and Icon (keys inside a precomp), **When** the map
   is read, **Then** it lists the expression and the precomp contents.
4. **Given** a property moved only by an expression with no keys, **When** the easing lesson
   looks, **Then** it isn't an easing finding.
5. **Given** a hidden null that moves its children, **When** the map is read, **Then** the null is
   in each child's sources.

---

### User Story 5 - The rest of the path (Priority: P2 for skills 5 and 6, P3 for 4 and 7 to 10)

I can take skills 4 to 10 in the path order: find what's moving it, set the pivot, move a group
with a null, draw it on with Trim Paths, show one layer through another, animate letters with a
text animator, and precompose and open the right level. Each runs the same way as the first three.

**Why this priority**: the sprint goal said ten, but each needs new reads (US4). The builder set
this sprint's baseline at five (H2, 2026-10-20): skills **5 (set the pivot) and 6 (move a group
with a null)** are in it, P2, after the first three and after the reads they need (R3 and R1).
Skills **4, 7, 8, 9 and 10** are stretch or next sprint, P3, so cutting them leaves a whole,
working path of five.

**Independent Test**: per skill, its own spec's independent test. At curriculum level: each built
skill has passed its own eval set and one live lesson logged in usage notes (SC-001, SC-007).

**Acceptance Scenarios**:

1. **Given** a skill from 4 to 10 is built, **When** I take it, **Then** it follows the six stages,
   its `curriculum.md` › 6 entry, and its version row in `curriculum.md` › 9.
2. **Given** skill 4's lesson, **When** I name a layer's sources, **Then** the check compares my
   answer's meaning with the motion-sources map, and nothing in my project changes.
3. **Given** skill 8 is built, **When** any lesson runs, **Then** KD-001 is already fixed.

---

### User Story 6 - Every skill is evaluated, and easing still holds (Priority: P1)

I can run an eval set for each built skill without After Effects open and see whether it teaches
well, and the easing set still passes.

**Why this priority**: constitution III. The sprint's "done" counts a skill only with eval cases.

**Independent Test**: run each built skill's eval cases and the easing set on saved snapshots; get
a pass or fail per case.

**Acceptance Scenarios**:

1. **Given** a built skill's eval cases, **When** they run, **Then** at least 80% pass and every
   hard-rule check passes.
2. **Given** any skill or shared read is merged, **When** the easing set runs, **Then** it passes at
   25/25 or within one case.

---

### Edge Cases

Skill-level overlaps are in `curriculum.md` › 8. Each skill's own spec turns its row into tests
(FR-034). These are the overlaps the **shared pieces** must get right, each with a unit test on a
saved snapshot (FR-012):

| Overlap | What the shared piece must see | What it must not do |
|---|---|---|
| Track matte, eye off | Visibility class *matte*; its motion counts | Class it *hidden by the learner*; leave it out of easing, offset or diagnosis motion (KD-001) |
| Hidden null with children | Class *null*; in each child's motion sources | Drop it from the map because its eye is off |
| Shy parent | The child's map names the parent, marked as hidden from the timeline | Treat shy as not rendering |
| Guide layer | Class *guide* (doesn't render) | Count it as visible motion |
| Solo on another layer | Read solo; the visibility class still describes the layer itself | Call every unsoloed layer hidden |
| Expression on a keyed property | The map lists the expression and the keys | Count those keys in cross-layer timing |
| Expression with no keys | The map lists it (R2) | Make it an easing finding (contract risk) |
| Expression turned off | Listed as off; keys drive | List it as a source |
| Precomp layer | Its own transform keys, plus "contents" as a source once R4 exists | Compare inner key times to the parent's as if time ran the same (time remap or stretch, R1) |
| Single key | A set value, not a move, in timing | A move of zero length |
| Hold pair | A start, in timing (`curriculum.md` › 8, skill 3) | A move with a duration |
| Separated dimensions | X and Y as one move in timing | Two moves landing together |
| Effect keys | Motion, in timing | Skipped |
| Layer with no keys, no parent, no expression | Static | Missing or broken |
| A layer outside the active comp | Not read | Claimed as checked |

Other edge cases:

- **AE busy or unreachable:** no recommendation that depends on the comp, no check, no review
  result; pass on the fix (spec 002 FR-009, server rule 2). A recommendation from the record alone
  is fine and says it hasn't looked at the comp.
- **Learner record unreadable:** lessons still run; the mentor says once it couldn't read its notes
  and treats every skill as not started for recommendations, without writing over the file
  (today's `RECORD_UNREADABLE` behaviour).
- **Record from before this spec** (easing only, version 1): reads as it is; easing's review is due
  by FR-019 from its `last_practiced`.
- **No focus for the recommended skill in this comp:** say so, and offer the second practice comp
  or the next skill that does have a focus (FR-004).
- **The learner did a review target before in another comp:** counts as new only if it's a
  different layer and property or a different comp (FR-018).
- **Two skills could teach the same finding** (skill 3 and spec 005's DX-03): the path decides
  which is offered (`curriculum.md` › 10).
- **A skill passed as a review before its first lesson** (the learner said they already know it):
  recorded as passed and "already knew it"; the skill becomes learned (FR-020, `curriculum.md` › 13
  C4).
- **Different AE version from last session:** R0 is read every session; version-dependent steps
  follow today's version.

## Requirements *(mandatory)*

### The path

- **FR-001**: The curriculum MUST be the ten skills in `curriculum.md` › 4, in that path order, with
  easing (built) before them and setting keyframes as an on-ramp, not a skill (pending open question
  H4). The path's skills, their hard and soft prerequisites, and spec 005's findings-to-skills map
  (`curriculum.md` › 10) MUST be kept as data in one place.
- **FR-002**: A test MUST check that the path data matches `curriculum.md` › 4 and › 10 (skills,
  order, hard and soft prerequisites, finding map). A change to the design changes the data and this
  test in the same merge.
- **FR-003**: Each skill MUST have its own record ID, named by the skill builder (`curriculum.md`
  suggests them). The path data maps each ID to its path position. Only skills whose tool file is
  present count as built.
- **FR-004**: The recommended next skill MUST follow this rule, in order:
  1. a skill the record says is *practicing*;
  2. else a learned skill whose review is due (FR-019) and that has a new target in the open comp
     (FR-021);
  3. else the first built, not-learned skill in path order whose hard prerequisites are all learned
     and that has a focus candidate in the open comp;
  4. else the first built, not-learned skill in path order whose hard prerequisites are learned,
     saying the comp has nothing for it yet and offering the second practice comp.
  Soft prerequisites never block; they only break ties in step 3 (a skill whose soft prerequisites
  are learned comes first). Practicing before a due review is the designer's answer
  (`curriculum.md` › 13, C2).
- **FR-005**: The mentor MUST NOT start a lesson for a skill whose hard prerequisite isn't learned
  without first naming the prerequisite and offering it. If the learner insists, the lesson runs
  after one sentence saying what it builds on (`curriculum.md` › 13, C1), and:
  - it MUST NOT reteach the prerequisite;
  - if the learner makes that prerequisite's typical mistake, the mentor gives the prerequisite
    skill's hint and suggests the prerequisite after this lesson;
  - if the skill's focus rule finds nothing to teach in the comp (skill 2 with no eased pairs), it
    says so and offers the prerequisite instead;
  - the record holds nothing about the gap beyond what the checks showed (FR-022).
- **FR-006**: A skill that isn't built MUST NOT be recommended, offered or started.
- **FR-007**: When spec 005 pulls a skill forward from a finding (its FR-020), only hard
  prerequisites apply. Skill 4's only hard prerequisite is keyframes, so diagnosis can offer it at
  any point.
- **FR-008**: The recommendation MUST be said in at most two sentences, with the reason, in plain
  words (no record IDs, field names or quoted values; server rule 5).

### Shared reads (built once, before the skills that need them run in parallel)

- **FR-009**: The mentor MUST add the reads in `curriculum.md` › 5 (R0 to R6, and R8) as fixed,
  read-only mentor tools or as part of `snapshot_project`. No lesson may use the `after-effects`
  bridge tools or an open-ended script to get them (`decisions/003`, spec 002 FR-013).
- **FR-010**: Each read MUST be built before the first skill that needs it, by this map:

  | Read | Needed before |
  |---|---|
  | R0 version and OS | skill 3 (Quick Offset), and every skill's version traps (FR-030) |
  | R1 layer relations and switches | skills 4, 6, 8, 10; KD-001's fix; skill 3's precomp in points |
  | R2 expressions on any property | skill 4; overlap checks in 1, 2, 3, 7, 9, 10 |
  | R3 static transforms and bounds | skills 5, 6, 8 |
  | R4 inside precomps | skills 4, 10 |
  | R5 shape contents | skills 7, 8 |
  | R6 text animators | skill 9 |
  | R8 mask count | skills 7, 8 |

  R7 (spatial tangents) is not built (Out of scope). With this sprint's baseline of skills 2, 1,
  3, 5 and 6 (H2), **R0, R1 and R3 are baseline reads**; R2, R4, R5, R6 and R8 come with the
  stretch skills that need them.
- **FR-011**: R0 MUST return the AE version and OS only, nothing personal (no user name, path or
  machine name).
- **FR-012**: Every read and both shared rules (FR-013, FR-014) MUST have unit tests on saved
  snapshots with an answer key, covering each row of the Edge Cases table above. Fixtures come from
  live reads, not written by hand.
- **FR-013**: There MUST be one visibility classification, from R1, used by every skill and by
  diagnosis: *renders*, *hidden by the learner* (eye off, not a matte), *matte* (eye off by design,
  its motion still counts), *guide*, *shy* (renders, hidden from the timeline only), *null* (never
  renders, still carries children) (`curriculum.md` › 5). No skill may filter layers by the eye
  switch alone.
- **FR-014**: There MUST be one motion-sources map per layer (own keys, parent chain, expressions,
  precomp contents), from R1, R2 and R4. Skill 4's answer key, skill 6's checks and spec 005's DX-06
  and DX-08 MUST read it, not rebuild it. It's built in two steps: own keys and the parent chain
  with R1 (wave B, for skill 6), then expressions and precomp contents when R2 and R4 land (wave D,
  for skill 4). Until the second step, the map MUST say expressions and precomp contents weren't
  read, never that a layer has none.
- **FR-015**: Adding R2 and R4 MUST NOT change the easing findings on Mentor Practice (a saved
  snapshot compared before and after), and an unkeyed property moved only by an expression MUST
  NOT become an easing finding.

### Cross-layer timing analysis (shared with spec 005)

- **FR-016**: There MUST be one cross-layer timing analysis, used by skill 3 and by spec 005's DX-02,
  DX-03 and DX-07. Per layer and per animated property it gives the first and last key times and
  the move durations; across layers it gives which starts and landings share a frame. It follows
  the Edge Cases table's timing rows (single keys, holds, separated dimensions, effects,
  expressions). It's deterministic for a given snapshot.
- **FR-017**: The analysis MUST give measures, not verdicts. Each consumer applies its own
  threshold: skill 3's are in FR-027; spec 005's are set in its plan. Neither consumer may copy the
  analysis into its own file.

### Reviews and the learner record

- **FR-018**: The learner record MUST hold, per skill: its status (*not started*, *practicing*,
  *learned*, as today; *learned* stays learned), when it was last practiced, how many times it
  passed, the "next" note, **when its next review is due**, and **how many reviews in a row it has
  passed**. Each lesson entry MUST also say whether it was a **first lesson, practice or review**
  (a review run before any first lesson is marked **"already knew it"**, FR-020), and which **layers and properties it targeted, on which comp**, so a review can pick a new target.
- **FR-019**: Reviews MUST run on this schedule: the first review is due 1 day after the skill's
  first pass; after a passed review the next is due 3 days later, then 7, then 14, then 30, and
  stays at 30. After a review that isn't a pass, the next is due 1 day later and the run of passes
  goes back to 0. A review not offered because the comp has no new target (FR-021) changes
  nothing: it stays due and isn't counted as missed or failed.
- **FR-020**: Reviews MUST be offered, never forced, and at most one review MUST be offered per
  session (FR-004, step 2), and none after a practice lesson on the same skill in that session
  (`curriculum.md` › 13, C2). A declined review stays due. A review is also offered when spec 005
  finds something a learned skill covers (spec 005 FR-020); passing it there counts the same. A
  review offered from a diagnosis finding the learner picked doesn't count toward the one per
  session: the limit covers only reviews the mentor offers unprompted (Q2, settled). The mentor MUST
  NOT offer a review for a skill that isn't learned. If the learner says they already know an
  unlearned skill, the mentor runs it as a review; a pass makes it learned, marked "already knew
  it", and FR-019's schedule starts from that pass (C4).
- **FR-021**: A review MUST have no demonstration and no walkthrough, run on a target not in the
  record for that skill on that comp, and use the skill's own pass check. It MUST still ask the
  skill's intent questions where the skill has them (1: what should snap; 3: what order; 5: where
  the hinge is), so the check doesn't grade a guess. If the open comp has no new target, the review
  isn't offered and waits for the learner's own work: the mentor MUST NOT suggest opening the second
  practice comp for a review, whose review targets are for the builder's live runs and evals only
  (FR-019; Q1, settled). After a check that isn't a pass it gives the skill's normal hints (spec 002
  FR-008) and doesn't reteach; the learner can then ask for a practice lesson, which may have a
  demonstration and is recorded as practice (`curriculum.md` › 2). `record_lesson` MUST refuse a
  review entry that says a demo was used.
- **FR-022**: Every record write MUST keep spec 002's rules: what the checks showed, one "next", no
  method, no motive, no names, emails or phone numbers; and a result must match what the session's
  check saw.
- **FR-023**: A record written before this spec (version 1, easing only) MUST still read, with no
  migration step the learner has to run. Missing review fields are worked out from
  `last_practiced`.

### Demonstrations and lessons

- **FR-024**: Each skill's demonstration MUST be one fixed write tool that makes one change, on one
  target, at most once per lesson, as `set_ease` is (`curriculum.md` › 12, B7). Skill 4 has none;
  skill 10 may have none. No skill gets a general "change the project" tool.
- **FR-025**: Every skill MUST follow the six stages in `curriculum.md` › 2 and the server rules
  (spec 002 FR-005 to FR-013; Edit > Undo with no undo label; no claims when AE is unreachable or
  busy; real layer names; no field names shown; no announced calls; hints, not fixes).
- **FR-037**: Inside any other skill's lesson, the mentor MUST ask the learner to "trace this one
  first" only when all three hold: a source other than the layer's own keys (parent, expression,
  precomp contents, from the motion-sources map) affects that lesson's focus or its check; skill 4
  is learned; and it hasn't asked already in this lesson. Otherwise it names the source in one
  sentence and carries on (`curriculum.md` › 6, skill 4, hand-off; › 13, C5). A hand-off is
  recorded as a skill 4 review only when skill 4's review is due; otherwise it's ungraded and not
  recorded. It never counts toward the one-review-per-session limit (Q3, settled).

### Pass margins (measures for `curriculum.md` › 6 passes; the designer asked for these)

- **FR-026 (skill 2, speed graph)**: a focus pair passes when the landing key's incoming influence
  is at least **20 percentage points** more than the start key's outgoing influence; neither key is
  at the default on both sides, where default means within **1 point of 33.33%** influence; and both
  keys are still bezier.
- **FR-027 (skill 3, offset)**: two starts are **the same** if they are less than **2 frames apart
  at the comp's frame rate or less than 1/15 s apart, whichever is longer** (so a 1-frame nudge
  still counts as lockstep, and at 60 fps so do 3 frames). This is a floor the check uses, never a
  target: the mentor MUST NOT tell the learner a gap to use; the learner picks it
  (`curriculum.md` › 13, C3). Within a shifted layer,
  its animated properties count as moved by the same amount if their shifts differ by **less than
  half a frame**. Uneven gaps get a comment on the rhythm, never a fail (`curriculum.md` › 6).
- **FR-028 (skill 5, anchor)**: the anchor is **in the named region** if it is within **10% of the
  layer's width** of that region's point horizontally **and within 10% of its height** vertically
  (corner, edge center or center). Each axis uses its own size, so regions don't overlap on thin
  layers (on an 800 × 60 bar: 80 px across, 6 px up and down). The
  layer's footprint is **unchanged** if every edge of its comp-space bounds at the current time
  moved by **1 pixel or less**.
- **FR-029 (skill 6, null)**: a child **didn't jump** if its comp-space position at the current time
  moved by **1 pixel or less**. It **kept its own animation** if its key count and key times (within
  half a frame) match the read before, and its **comp-space position at each of its key times** is
  within **1 pixel** of the read before. The check MUST NOT compare raw key values: parenting may
  rewrite a child's Position into the parent's space, which would fail every correct parenting
  (`curriculum.md` › 12, B9, unverified; › 13).

### Version, practice comp and ownership

- **FR-030**: Every skill MUST read R0 at the start and give each step in the form the learner's
  version has, per `curriculum.md` › 9. Where the Mac and Windows shortcuts conflict, it names the
  menu path. Each skill's spec MUST include an eval case on its version trap. At the builder's
  version (After Effects 26.5 on macOS 27.0.1, H1), the briefs say:
  - **Skill 3, Quick Offset:** released in 25.4 (Aug 2025), so it's in 26.5
    (`discovery/curriculum-research/timing-spacing-and-offset.md`). The brief doesn't test the
    gesture on 26.5 itself; the live run confirms it.
  - **Skill 5, Quick Set Anchor:** still listed as a beta feature in Adobe's 26.5 announcement
    (`discovery/curriculum-research/anchor-point.md`, high confidence). Skill 5 MUST teach Pan
    Behind and MUST NOT rely on Quick Set Anchor: no step, pass check or eval case may need it.
    Whether R0 can tell a beta build from the release (so the mentor can mention it only when
    present, `curriculum.md` › 9) isn't in the brief; it's settled on the live run.
  - **Skill 8, matte wording:** the brief found no Track Matte UI change after 23.0 (the layer
    picker plus two toggles) but couldn't read the 24 to 26 release notes, and one weak 2025 report
    mentions different column labels (`discovery/curriculum-research/track-mattes.md`). The brief
    doesn't settle 26.5's wording; skill 8's spec settles it on a live run before it's written.
- **FR-031**: A **second practice comp** MUST hold the targets Mentor Practice lacks
  (`curriculum.md` › 12, B1): a fade that should be a cut (skill 1), a stroke-only shape (7), a
  fill-and-matte pair (8), a group with no outside parents to precompose (10), and at least one new
  target per first skill for review lessons. It MUST be built by its own script. Mentor Practice,
  its build script, and the easing fixtures MUST stay unchanged.
- **FR-032**: The shared analysis code (today's easing analysis, which skills 1 to 3 and diagnosis
  extend) MUST have **one owner at a time**: one build task makes the shared pieces (FR-013, FR-014,
  FR-016, and the parts of the easing analysis others reuse) before skills build in parallel. After
  that, each skill keeps its own analysis in its own file, and parallel skill builds MUST NOT edit
  the shared files; a change goes back to the owner as a request (`curriculum.md` › 12, B6;
  `decisions/007` signal 1).

### Evals and tests

- **FR-033**: Each built skill MUST have its own eval cases in `product/evals/`, run on saved
  snapshots without After Effects, written by the eval engineer (constitution VI), scored on
  teaching (leads, restraint, honesty about limits) as well as correctness. The Eval plan below is
  the minimum.
- **FR-034**: Each skill's spec MUST run `/overlap-audit`, turn its `curriculum.md` › 8 row into unit
  tests, and add an eval case for its riskiest overlap.
- **FR-035**: The easing eval set MUST pass at 25/25 or within one case of it, with no hard-rule
  failure, after every merge of a skill or shared piece.
- **FR-036**: Recommendation (FR-004 to FR-007) and review scheduling (FR-019) MUST be deterministic
  and unit tested on saved records.

### Known defects in built skills

- **KD-001 (easing, built): a moving matte is left out as "hidden".** Today the snapshot's
  `hidden_layers` means "eye off", and the easing lesson leaves those out ("you've hidden this, so
  I'll leave it unless you want it", `.claude/skills/ease-mentor/SKILL.md` step 2). A track matte's
  eye is off by design and its motion shows through the layer it mattes, so an easing lesson would
  skip a moving matte (a wipe) as hidden (`curriculum.md` › 5). It's harmless today only because no
  skill teaches mattes yet. **Fix:** use the visibility class (FR-013) in easing. **When:** with R1,
  and MUST be fixed before skill 8 ships. **Proof:** a unit test on a matte snapshot and an easing
  eval case (Eval plan 3). Spec 005's Edge Cases "Track mattes" row has the same issue for
  diagnosis.

### Key Entities

- **Skill**: one teachable idea from `curriculum.md` › 6, with a record ID, its path position, hard
  and soft prerequisites, a focus rule, a pass check, a review check, and (except 4, maybe 10) one
  demo write tool.
- **Path**: the ordered skills plus prerequisites and spec 005's finding map, kept as data (FR-001).
- **Skill state** (in the learner record): status, last practiced, times passed, next, next review
  due, reviews passed in a row (FR-018).
- **Lesson entry**: as spec 002, plus kind (first lesson, practice, review) and the targets.
- **Shared read** (R0 to R6, R8): what `curriculum.md` › 5 lists, read by fixed tools.
- **Visibility class**: one of six, per layer (FR-013).
- **Motion-sources map**: per layer, what moves it (FR-014).
- **Timing measures**: per layer and property, start, landing and durations, plus shared frames
  (FR-016).
- **Second practice comp**: the extra targets (FR-031).

## Build order and priorities

`curriculum.md` › 5 recommends 2, 1 and 3 first. The builder set **this sprint's baseline at five
skills: 2, 1, 3, 5 and 6** (H2, 2026-10-20); skills 4 and 7 to 10 are stretch or next sprint, and
their designs and requirements stay in this spec. This is the build order; each wave can stop on its
own and leave a working path.

| Wave | Priority | Builds | Needs before it starts | If the sprint is cut here |
|---|---|---|---|---|
| **A. First skills** (baseline) | P1 | Path data and recommendation (FR-001 to FR-008), record and reviews' data (FR-018, FR-023), R0, the timing analysis (FR-016), then skills **2, 1, 3** (each with its own spec and demo tool); second practice comp's skill 1 and review targets | Shared-code owner named (FR-032); skills 2, 1, 3's own specs approved | Ships easing plus 2, 1, 3, a path and a recommendation. Below the baseline. |
| **B. Reads for 5 and 6, then skills 5 and 6** (baseline) | P2 | R1, R3, the visibility class (FR-013), the motion-sources map's first step (own keys and parent chain, FR-014), KD-001's fix (it comes with R1); then skills **5, 6** | Wave A merged, easing at baseline; skills 5 and 6's own specs approved | Ships the baseline: easing plus 2, 1, 3, 5, 6. |
| **C. Reviews** (stretch) | P2 | Reviews (FR-019 to FR-021) | Wave A merged | Ships practice across sessions for every built skill |
| **D. The rest, in parallel** (stretch or next sprint) | P3 | R2, R4 and the map's second step, then skills **4, 10**; then R5, R8, R6 and skills **7, 8, 9**; the rest of the second practice comp | Wave B's reads merged; each skill's spec approved; KD-001 fixed before 8 | Any subset ships, as long as its hard prerequisites are built |

Within wave A, 2 first: it needs no new read and only a demo tool. 1 needs its practice target. 3
needs the timing analysis. Within wave B, 5 before 6 (5 is 6's hard prerequisite); R3 is 5's only
new read, and 6 needs R1 and R3. Waves B and C don't depend on each other. Skills 5 and 6, and the
skills in wave D, run in parallel worktrees once the shared pieces they need are merged
(`decisions/008`); none of them edits the shared files (FR-032).

Reviews (wave C) aren't in the five-skill baseline as H2 was answered. That makes SC-009 and US3
stretch for this sprint, even though memory and practice are half of the "why".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every built skill has a live lesson on the builder's comp, from start to a verified
  result, in **15 minutes or less** with **at most one demonstration**. *Measured by:* the builder,
  in usage notes, with timings from the call log.
- **SC-002**: Each built skill's check agrees with a manual inspection in After Effects in **at
  least 9 of 10** checks (as spec 002 SC-003). *Measured by:* the builder, in usage notes.
- **SC-003**: The easing eval set stays at **25/25 or within one case**, with no hard-rule failure,
  after every merge (FR-035). *Measured by:* eval runs, logged per merge.
- **SC-004**: On the saved Mentor Practice snapshot, the easing findings are **identical** before
  and after each shared read lands (FR-015). *Measured by:* a unit test.
- **SC-005**: The recommendation and review schedule match FR-004 and FR-019 on **100%** of at least
  **12 saved record states**, and recommend a skill with an unlearned hard prerequisite or an
  unbuilt skill **0 times**. *Measured by:* unit tests.
- **SC-006**: The shared reads, visibility class, motion-sources map and timing analysis match the
  answer key on **100%** of layers in at least **6 saved snapshots** (Mentor Practice, the second
  practice comp, and planted overlaps from the Edge Cases table), and the timing analysis gives
  skill 3 and spec 005 the same numbers from one place. *Measured by:* unit tests.
- **SC-007**: Each built skill's eval cases pass **at least 80%**, every hard-rule check passes,
  and there are **at least 6 cases per skill** (Eval plan). *Measured by:* eval runs.
- **SC-008**: In review eval cases, **100%** have no demonstration and no walkthrough, use a
  target not in the record, ask the skill's intent questions where it has them, and offer no review
  when the comp has no new target. *Measured by:* deterministic eval checks.
- **SC-009** (stretch, with wave C): For each first skill (2, 1, 3), at least **one live review at
  least one day after its first pass** is logged, with the check agreeing with After Effects.
  *Measured by:* the builder, in usage notes.
- **SC-010**: Parallel skill builds (waves B and D) cause **0 merge conflicts** in the shared
  analysis files (FR-032). *Measured by:* `/merge-worktree` notes and git history, in the
  parallel-run notes.
- **SC-011**: KD-001 is fixed with R1 (wave B), and always before skill 8 ships: a moving matte
  with its eye off is in easing's findings in the unit test and the eval case **every time**.
  *Measured by:* a unit test and eval case 3.
- **SC-012**: This sprint's baseline (H2): skills **2, 1, 3, 5 and 6** are each built and each
  meet SC-001, SC-002 and SC-007. Skills 4 and 7 to 10 don't count against the sprint.
  *Measured by:* the usage notes and eval runs behind those criteria, listed in the sprint review.

## Eval plan (outline, for the eval engineer)

The eval engineer writes the cases and owns their numbering and fixtures. Unit tests cover the
deterministic parts (reads, visibility class, motion-sources map, timing analysis, pass margins,
recommendation, review schedule); evals don't repeat them.

**Per built skill (at least 6 cases each):**

1. First lesson on its focus: proposes one layer (two at most), says what it leaves out and why,
   explains with a frame, real names.
2. Demonstration: one change on the demo target only; none when the focus has one target.
3. Incomplete attempt: names what's off and where, doesn't fix it, doesn't offer to.
4. "Do the rest": declined warmly, no offer to do it later.
5. Its riskiest overlap from `curriculum.md` › 8 (FR-034).
6. A review: record says learned and due; no demo, no walkthrough, a new target.

Plus its version trap (FR-030) where the skill has one.

**Skill-specific:**

- **Skill 4 (find what's moving it):** the learner's answer is free text graded against the
  motion-sources map. Deterministic checks (the mentor's reply names the layers in the map; no
  project change) plus **judge rubric items**: credits every source the learner named correctly,
  in their own words; names each one they missed, without telling them where it is; doesn't accept
  a source that isn't in the map; doesn't invent a source. Cases: all named; one missed; one
  invented; correct in loose words ("the box it's attached to" for a parent).
- **Intent questions (skills 1, 5):** the learner says "it's meant to fade" (1) or names a hinge
  the mentor didn't expect (5); the point is dropped or the focus follows the learner.
- **Skill 2:** a pair at Easy Ease's default on both ends doesn't pass; a pair 15/80 does.
- **Skill 3:** a 1-frame offset at 30 fps and a 3-frame offset at 60 fps are still called lockstep;
  the mentor never names a gap to use; uneven gaps get a rhythm comment, never a fail.
- **Skill 5:** on a thin layer (an 800 × 60 bar), an anchor at left-center doesn't pass for
  top-left.
- **Skill 6:** a correct parenting where the child's raw Position values changed but its comp-space
  positions at its key times didn't passes.

**Cross-skill:**

1. **Recommendation:** session start with easing learned, no skill named: recommends by FR-004,
   in at most two sentences, no IDs shown.
2. **Missing prerequisite:** the learner asks for skill 6 with 5 not learned: names 5 and offers it.
   If the learner insists, the lesson runs without reteaching 5; making 5's typical mistake gets
   5's hint.
3. **Matte (KD-001, easing regression):** a comp with a moving matte, eye off. The easing lesson
   includes it and doesn't say "you've hidden this".
4. **Review declined:** the session goes on; nothing is recorded as a review.
5. **Review not passed:** hints, not the fix and not a reteach; the record's "next" names what's
   off.
6. **Review with no new target:** a due review on a comp with nothing new; no review is offered,
   and the record doesn't count it as missed.
7. **Review asks intent:** a skill 1 review still asks what's meant to snap before checking.
8. **"I already know it":** the learner says so for an unlearned skill; it runs as a review, and a
   pass is recorded as learned, "already knew it". No review is ever offered unprompted for an
   unlearned skill.
9. **Skill 4 hand-off:** in a skill 2 lesson with skill 4 learned and the focus layer riding a
   moving parent, the mentor asks "trace this one first" once; with skill 4 not learned, it names the
   parent in one sentence and carries on.
10. **Unreadable record:** lessons still run; one sentence about the notes; no recommendation from
   history.
11. **Plain speech:** no record IDs, field names or quoted values in anything the learner sees (on
   every case, deterministic).

Rubric additions: the recommendation gives a reason; a review is clearly a "try it yourself", not a
lesson again.

## Assumptions

- **Learner:** the builder on their own Mac with After Effects 26.5 on macOS 27.0.1 (H1, and
  CLAUDE.md › My setup), then target-market learners. Version-dependent steps, shortcuts and
  SC-001's live runs target 26.5; R0 still reads the version each session (FR-030).
- **Where lessons run:** from Claude Code and from the panel, with no curriculum logic in the panel
  (constitution II). The panel's path today is a fixed list (spec 003 FR-010, Assumptions); showing
  the real path is the UI overhaul spec's job, reading the path data and the record.
- **Skill specs:** each skill gets its own Spec Kit spec and its own teaching design note if the
  curriculum designer wants one; their numbers come from the cockpit.
- **"Learned" means one pass**, as today; reviews add practice, they don't take "learned" away.
- **Second practice comp:** a separate comp built by its own script; whether it lives in the same
  `.aep` or its own file is a plan choice, as long as FR-031 holds.
- **Claims to verify** in `curriculum.md` › 14 (U and expression-only properties, Pan Behind and
  existing keys, the Cursor on 2026-10-08) are settled in the affected skill's spec, before it's
  built.

## Out of scope (build scope)

- **Each skill's own spec:** focus rules, demo write tools, steps, wording and eval cases beyond the
  minimum above. This spec only sets what they must meet.
- **The diagnosis itself** (spec 005): its catalogue, thresholds, entry and screens. This spec only
  provides the path, the finding map data, the timing analysis and the motion-sources map it uses.
- **Render and export**, including the H.264 version trap (deferred 18).
- **Expressions** as a skill (writing, debugging or linking; deferred 13). Skill 4 only recognizes
  one.
- **Repeater** (deferred 19), Merge Paths, the Offset chase.
- **Illustrator or SVG import** (deferred 15).
- **R7 spatial tangents and motion paths** (deferred 12), middle-key jolts and roving (deferred 14),
  vary durations (deferred 11), effects (16), masks (17).
- **Everything in `curriculum.md` › 11's teaching scope**: 3D, cameras, lights, audio sync,
  tracking, roto, Object Matte, color.
- **Skills 4, 7, 8, 9 and 10 this sprint** (H2): stretch or next sprint. Their designs and the
  requirements for them stay in this spec; nothing about them is cut, only scheduled later
  (wave D).
- **The panel's screens** for the path, reviews and recommendations (UI overhaul spec).
- **Other apps,** accounts, sync of the record across machines, pricing and analytics.
- **A setting-keyframes skill** (an on-ramp only, pending H4).

## Open questions

### For the human (H)

1. **Your AE version and OS** (`curriculum.md` H1). **Answered 2026-10-20:** After Effects 26.5
   on macOS 27.0.1. Folded into Assumptions and FR-030 (Quick Offset in; Quick Set Anchor still
   beta, so skill 5 doesn't rely on it; skill 8's wording left for the live run).
2. **Ten skills this sprint, or fewer?** (`curriculum.md` H2.) **Answered 2026-10-20:** this
   sprint's baseline is five skills, 2, 1, 3, 5 and 6; skills 4 and 7 to 10 are stretch or next
   sprint. Folded into US4, US5, FR-010, FR-014, Build order, SC-012 and Out of scope. Reviews
   (wave C) aren't in the baseline as answered.
3. **Skill 4 first, or 4th?** (`curriculum.md` H3; interview 007 suggests earlier.)
   **Recommended:** keep it 4th in the path. It needs three new reads (R1, R2, R4), the most of any
   skill, so making it first would delay every lesson; diagnosis can still pull it forward at any
   time (FR-007).
4. **Setting keyframes stays an on-ramp, not a skill?** (`curriculum.md` H5.) **Recommended:** yes,
   as FR-001 and Out of scope say, and ask the next interview whether target learners already know
   the stopwatch.
5. **Review schedule (FR-019): 1, 3, 7, 14, 30 days, offered not forced, at most one per session.**
   **Recommended:** approve as written; revisit after SC-009's live reviews. A shared-code note:
   FR-032 needs one builder named as the shared-code owner for wave A; if two skill builders run at
   once, `decisions/007`'s table names only "skill-builder" for `mentor/`, so a one-line note there
   (or in the plan) saying who owns the shared files during a parallel run would help.

### Answered by the curriculum designer, round 1 (`curriculum.md` › 13)

C1 (insisting on a missing prerequisite: the lesson runs, no reteach; FR-005), C2 (in progress
before a due review, none after a practice lesson on the same skill; FR-004, FR-020), C3 (lockstep
floor in time as well as frames, never shown as the target; FR-027), C4 ("already knew it", never
offered unprompted; FR-018, FR-020), C5 (a narrower skill 4 hand-off; FR-037). The designer also
changed FR-028 (per-axis region) and FR-029 (comp-space positions at key times, not raw values), and
added three review rules (intent questions still asked, no new target means no review, no reteach;
FR-019, FR-021). Still open for you from `curriculum.md` › 12: **H4** (is naming sources a real "you
do"), **H6** (animators before presets; anchor kept separate) and **H7** (the offset taste rule).

### Conflicts the round 1 answers raise (Q)

**Settled 2026-10-20:** the builder accepted the written defaults for all three, for now ("run the
defaults for now"). Each is folded into its requirement; the designer can still revisit them.

1. **Reviews and the second practice comp.** "No new target, no review" (FR-021) means a learner
   whose comp has nothing new never reviews. FR-031 puts review targets in the second practice comp
   for testing. May the mentor *suggest* opening the practice comp for a due review, or does the
   review simply wait for the learner's own work? **Recommended:** it waits (the designer's rule;
   learners learn what the project needs), and the practice comp's review targets are for the
   builder's live runs and evals only. **Settled: the default** (FR-021).
2. **A review from diagnosis and the one-per-session limit.** FR-020 allows one review per session,
   and spec 005 FR-020 offers a review when a finding is covered by a learned skill. If a review ran
   at session start, can diagnosis offer another? **Recommended:** yes. A review on a finding the
   learner chose is pulled by their comp, not by the schedule, so the limit covers only reviews the
   mentor offers unprompted. **Settled: the default** (FR-020; noted in spec 005 FR-020).
3. **Skill 4's hand-off vs. its review schedule.** FR-037 fires whenever skill 4 is learned, not
   when its review is due, and skill 4's review *is* "trace an unfamiliar layer in a later lesson".
   Is each hand-off a scheduled review (recorded, moves FR-019's schedule, counts toward the
   one-per-session limit) or ungraded practice? **Recommended:** a hand-off is recorded as a skill 4
   review only when skill 4's review is due; otherwise it's ungraded and not recorded. It never
   counts toward the one-per-session limit. **Settled: the default** (FR-037).

### For the skill builder (B) and eval engineer (E)

Carried from `curriculum.md` › 12 and settled in each skill's spec or the plan, not here: B1 (the
second practice comp's targets, FR-031), B2 (the Cursor), B3 (KD-001), B4 (U and expressions), B5
(Pan Behind), B6 (FR-032), B7 (FR-024), B8 (scripting names); E1 to E4 (the Eval plan above).

## Dependencies

- **`curriculum.md`** (this folder, the curriculum designer's, draft 2026-10-20): the source for
  every skill's idea, focus, steps, pass, review, overlaps and version traps. If it changes, FR-002's
  test and this spec follow.
- **Spec 002** (built): the lesson shape, the record, `record_lesson`, the server rules, the easing
  analysis and its evals.
- **Spec 003** (built): the panel, which reads the record for its path section.
- **Spec 005** (diagnosis, approved): uses FR-001's finding map, FR-014's map and FR-016's analysis;
  its FR-020 triggers reviews here.
- **Spec 007** (UI overhaul, approved): shows the path, recommendations and reviews.
- **The research briefs** in `discovery/curriculum-research/`, through `curriculum.md`.
