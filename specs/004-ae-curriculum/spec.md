# Feature Specification: After Effects curriculum (ten skills beyond easing)

**Feature Branch**: `004-ae-curriculum` (spec folder only; no git branch)

**Created**: 2026-10-20

**Status**: Draft, awaiting approval. Plan and tasks come after approval and the open questions.

**Input**: Cockpit task, Sprint 3 parallel run 1 (wave 3): "Write the curriculum spec, which decides
the 10 skills and what has to exist so they can be built." The teaching design is the curriculum
designer's [`curriculum.md`](curriculum.md) (same folder, `decisions/007`). This spec links to it
and turns it into requirements. It doesn't restate or change what is taught. Where this spec needs
something the design doesn't say, it's a question for the designer (Open questions › C).

**What this spec is, and isn't.** It decides which ten skills make up the path and in what order
they get built, and it specifies the **shared pieces** every skill needs before skills can be built
in parallel: the shared reads, the visibility rule, the motion-sources map, the cross-layer timing
analysis, the path and recommendation, reviews across sessions, the learner record's shape, a
second practice comp, and who owns the shared analysis code. Each of the ten skills then gets **its
own spec** (with its own `/overlap-audit`, demo write tool, pass check and eval cases). This spec
sets only what every skill spec must meet.

## Why this curriculum

- **The pain it answers.** Learners stitch together generic videos and a text chatbot, and the
  skill fades (CLAUDE.md, interview 004). After Effects learners also lose hours finding what
  broke (interview 007, Did) and follow help written for another version (008, belief 16).
  `curriculum.md` › 1 has the evidence.
- **Adobe's lead is breadth** (many skills plus diagnosis, side-by-side 2026-10-08). Knack today
  teaches one skill. This spec closes that gap with ten more; spec 005 closes the diagnosis gap.
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
- Spec 005 (diagnosis, draft): FR-010's map from findings to skills (`curriculum.md` › 10),
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
   answers, **Then** it names the prerequisite in one sentence and offers it first (what happens if
   I insist is open question C1).
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

1. **Given** a learned skill whose review is due, **When** a session starts and no skill is in
   progress, **Then** the mentor offers that review in one sentence. It's an offer: if I decline,
   the session goes on and the review stays due.
2. **Given** a review, **When** it runs, **Then** there's no demonstration and no walkthrough,
   only the task and, after "done", the check. Hints after a check that isn't a pass are allowed.
3. **Given** a review, **When** the mentor picks a target, **Then** it's not a layer and property
   the record shows I did for this skill on this comp.
4. **Given** I pass the review, **When** it's recorded, **Then** the next review is further out
   (FR-019). **Given** I don't, **Then** the skill stays learned, the next review is the shortest
   interval, and the record's "next" names what was still off.
5. **Given** spec 005 finds something a learned skill covers, **When** it recommends, **Then** it
   offers this review on that finding (spec 005 FR-020), counted as the same review.

---

### User Story 4 - Knack sees parents, expressions, precomps and mattes (Priority: P2)

Knack reads where my layers' motion really comes from (their own keys, a parent, an expression, or
keys inside a precomp) and which layers render, and every lesson uses the same reading. A matte
that's hidden on purpose and moving is treated as moving, not as "you've hidden this".

**Why this priority**: skills 4 to 10 need these reads, and building them once (with one owner)
before those skills run in parallel stops each skill inventing its own filter (`curriculum.md` › 5,
CLAUDE.md "Edge cases"). P2: after the first skills, before the rest.

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

### User Story 5 - The rest of the path (Priority: P3)

I can take skills 4 to 10 in the path order: find what's moving it, set the pivot, move a group
with a null, draw it on with Trim Paths, show one layer through another, animate letters with a
text animator, and precompose and open the right level. Each runs the same way as the first three.

**Why this priority**: the sprint goal is ten, but each needs new reads (US4), and the sprint may
be cut back. P3 so cutting it leaves a whole, working path of three.

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
- **A skill passed as a review before its first lesson** (the learner already knew it): recorded as
  passed; the skill becomes learned (open question C4).
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
  2. else a learned skill whose review is due (FR-019);
  3. else the first built, not-learned skill in path order whose hard prerequisites are all learned
     and that has a focus candidate in the open comp;
  4. else the first built, not-learned skill in path order whose hard prerequisites are learned,
     saying the comp has nothing for it yet and offering the second practice comp.
  Soft prerequisites never block; they only break ties in step 3 (a skill whose soft prerequisites
  are learned comes first). The order of 1 and 2 is open question C2.
- **FR-005**: The mentor MUST NOT start a lesson for a skill whose hard prerequisite isn't learned
  without first naming the prerequisite and offering it. What happens when the learner insists is
  open question C1; until answered, the lesson runs after one sentence saying what it builds on.
- **FR-006**: A skill that isn't built MUST NOT be recommended, offered or started.
- **FR-007**: When spec 005 pulls a skill forward from a finding (its FR-020), only hard
  prerequisites apply. Skill 4's only hard prerequisite is keyframes, so diagnosis can offer it at
  any point.
- **FR-008**: The recommendation MUST be said in at most two sentences, with the reason, in plain
  words (no record IDs, field names or quoted values; server rule 5).

### Shared reads (built once, before skills 4 to 10 run in parallel)

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

  R7 (spatial tangents) is not built (Out of scope).
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
  and DX-08 MUST read it, not rebuild it.
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
  passed**. Each lesson entry MUST also say whether it was a **first lesson, practice or review**,
  and which **layers and properties it targeted, on which comp**, so a review can pick a new target.
- **FR-019**: Reviews MUST run on this schedule: the first review is due 1 day after the skill's
  first pass; after a passed review the next is due 3 days later, then 7, then 14, then 30, and
  stays at 30. After a review that isn't a pass, the next is due 1 day later and the run of passes
  goes back to 0.
- **FR-020**: Reviews MUST be offered, never forced, and at most one review MUST be offered at the
  start of a session (FR-004, step 2). A declined review stays due. A review is also offered when
  spec 005 finds something a learned skill covers (spec 005 FR-020); passing it there counts the
  same.
- **FR-021**: A review MUST have no demonstration and no walkthrough, run on a target not in the
  record for that skill on that comp, and use the skill's own pass check. Hints after a check that
  isn't a pass follow spec 002 FR-008. `record_lesson` MUST refuse a review entry that says a demo
  was used.
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

### Pass margins (measures for `curriculum.md` › 6 passes; the designer asked for these)

- **FR-026 (skill 2, speed graph)**: a focus pair passes when the landing key's incoming influence
  is at least **20 percentage points** more than the start key's outgoing influence; neither key is
  at the default on both sides, where default means within **1 point of 33.33%** influence; and both
  keys are still bezier.
- **FR-027 (skill 3, offset)**: two starts are **the same** if they are less than **2 frames apart**
  at the comp's frame rate (so a 1-frame nudge still counts as lockstep). Within a shifted layer,
  its animated properties count as moved by the same amount if their shifts differ by **less than
  half a frame**. Uneven gaps get a comment on the rhythm, never a fail (`curriculum.md` › 6).
- **FR-028 (skill 5, anchor)**: the anchor is **in the named region** if it is within **10% of the
  layer's larger bound dimension** of that region's point (corner, edge center or center). The
  layer's footprint is **unchanged** if every edge of its comp-space bounds at the current time
  moved by **1 pixel or less**.
- **FR-029 (skill 6, null)**: a child **didn't jump** if its comp-space position at the current time
  moved by **1 pixel or less**; its own keys are unchanged if key count, times (within half a frame)
  and values (within 0.01) match the read before.

### Version, practice comp and ownership

- **FR-030**: Every skill MUST read R0 at the start and give each step in the form the learner's
  version has, per `curriculum.md` › 9. Where the Mac and Windows shortcuts conflict, it names the
  menu path. Each skill's spec MUST include an eval case on its version trap.
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

`curriculum.md` › 5 recommends 2, 1 and 3 first. This is the build order; each wave can stop on its
own and leave a working path.

| Wave | Priority | Builds | Needs before it starts | If the sprint is cut here |
|---|---|---|---|---|
| **A. First skills** | P1 | Path data and recommendation (FR-001 to FR-008), record and reviews' data (FR-018, FR-023), R0, the timing analysis (FR-016), then skills **2, 1, 3** (each with its own spec and demo tool); second practice comp's skill 1 and review targets | Shared-code owner named (FR-032); skills 2, 1, 3's own specs approved | Ships easing plus 2, 1, 3, a path and a recommendation. Reviews can follow in wave B. |
| **B. Reviews and shared reads** | P2 | Reviews (FR-019 to FR-021); R1, R2, R3, R4, the visibility class, the motion-sources map, KD-001's fix | Wave A merged, easing at baseline | Ships reviews; reads in place for 4 to 10 |
| **C. The rest, in parallel** | P3 | Skills **4, 5, 6, 10** (R1 to R4); then R5, R8, R6 and skills **7, 8, 9**; the rest of the second practice comp | Wave B's reads merged; each skill's spec approved; KD-001 fixed before 8 | Any subset ships, as long as its hard prerequisites are built |

Within wave A, 2 first: it needs no new read and only a demo tool. 1 needs its practice target. 3
needs the timing analysis. Skills in wave C run in parallel worktrees (`decisions/008`); none of
them edits the shared files (FR-032).

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
- **SC-008**: In review eval cases, **100%** have no demonstration and no walkthrough and use a
  target not in the record. *Measured by:* deterministic eval checks.
- **SC-009**: For each first skill (2, 1, 3), at least **one live review at least one day after its
  first pass** is logged, with the check agreeing with After Effects. *Measured by:* the builder, in
  usage notes.
- **SC-010**: Parallel skill builds in wave C cause **0 merge conflicts** in the shared analysis
  files (FR-032). *Measured by:* `/merge-worktree` notes and git history, in the parallel-run notes.
- **SC-011**: KD-001 is fixed before skill 8 ships: a moving matte with its eye off is in easing's
  findings in the unit test and the eval case **every time**. *Measured by:* a unit test and eval
  case 3.

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
- **Skill 3:** a 1-frame offset is still called lockstep; uneven gaps get a rhythm comment, never a
  fail.

**Cross-skill:**

1. **Recommendation:** session start with easing learned, no skill named: recommends by FR-004,
   in at most two sentences, no IDs shown.
2. **Missing prerequisite:** the learner asks for skill 6 with 5 not learned: names 5 and offers it.
3. **Matte (KD-001, easing regression):** a comp with a moving matte, eye off. The easing lesson
   includes it and doesn't say "you've hidden this".
4. **Review declined:** the session goes on; nothing is recorded as a review.
5. **Review not passed:** hints, not the fix; the record's "next" names what's off.
6. **Unreadable record:** lessons still run; one sentence about the notes; no recommendation from
   history.
7. **Plain speech:** no record IDs, field names or quoted values in anything the learner sees (on
   every case, deterministic).

Rubric additions: the recommendation gives a reason; a review is clearly a "try it yourself", not a
lesson again.

## Assumptions

- **Learner:** the builder on their own Mac with After Effects 26.x (the 2026-10-08 session ran a
  26.5-era beta; spec 005 assumes 26.4 or later), then target-market learners. Pending H1.
- **Where lessons run:** from Claude Code and from the panel, with no curriculum logic in the panel
  (constitution II). The panel's path today is a fixed list (spec 003 FR-010, Assumptions); showing
  the real path is the UI overhaul spec's job, reading the path data and the record.
- **Skill specs:** each skill gets its own Spec Kit spec and its own teaching design note if the
  curriculum designer wants one; their numbers come from the cockpit.
- **"Learned" means one pass**, as today; reviews add practice, they don't take "learned" away.
- **Second practice comp:** a separate comp built by its own script; whether it lives in the same
  `.aep` or its own file is a plan choice, as long as FR-031 holds.
- **Claims to verify** in `curriculum.md` › 13 (U and expression-only properties, Pan Behind and
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
- **The panel's screens** for the path, reviews and recommendations (UI overhaul spec).
- **Other apps,** accounts, sync of the record across machines, pricing and analytics.
- **A setting-keyframes skill** (an on-ramp only, pending H4).

## Open questions

### For the human (H)

1. **Your AE version and OS** (`curriculum.md` H1). They decide skill 3's Quick Offset, 5's Quick
   Set Anchor, 8's wording and every shortcut, and SC-001's live runs. **Recommended:** tell me
   (After Effects > About After Effects); R0 reads it each session anyway, and the spec assumes 26.x
   on macOS until then.
2. **Ten skills this sprint, or fewer?** (`curriculum.md` H2.) **Recommended:** commit to wave A
   (2, 1, 3, plus the path and recommendation) as this sprint's floor, and count wave B and C as
   stretch. The sprint goal says ten, but each of 4 to 10 needs new reads that don't exist yet.
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

### For the curriculum designer (C) — what is taught, not decided here

1. **Missing hard prerequisite, learner insists** (FR-005): does the lesson run anyway, or does the
   mentor hold to the prerequisite? Spec's default until answered: it runs after one sentence
   saying what it builds on (restraint: the learner chooses).
2. **Practicing skill vs. a due review at session start** (FR-004 steps 1 and 2): which comes first?
   Spec's default: the practicing skill.
3. **Skill 3's "same frame"** (FR-027): is treating starts under 2 frames apart as lockstep a fair
   reading of "a few frames apart", or should only an exact same frame fail?
4. **Passing a review before a first lesson:** if the learner already knows a skill and passes on
   the first try with no demo, is that "learned"? Spec's default: yes.
5. **Skill 4's review inside other lessons** ("trace this one before I tell you"): every skill's
   lesson would need to hand to it when a focus layer's motion has another source. Confirm that's
   the intent, so each skill spec carries it. Also still open from `curriculum.md`: H4 (is naming
   sources a real "you do"), H6 (animators before presets, anchor kept separate) and H7 (the offset
   taste rule).

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
- **Spec 005** (diagnosis, draft): uses FR-001's finding map, FR-014's map and FR-016's analysis;
  its FR-020 triggers reviews here.
- **The UI overhaul spec** (number from the cockpit): shows the path, recommendations and reviews.
- **The research briefs** in `discovery/curriculum-research/`, through `curriculum.md`.
