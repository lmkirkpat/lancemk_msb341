# Feature Specification: Shape the ease in the speed graph (curriculum skill 2)

**Feature Branch**: `008-speed-graph` (spec folder only; no git branch)

**Created**: 2026-10-20

**Status**: Approved 2026-10-21; planned and tasked. Amended 2026-10-21 (round 6) from the
builder's cloud hand-back: FR-004 (two layers share the cap), FR-014 (changed keys hold the pass),
the fastest-part assumption for L-6, and one optional shared-contract request (Open questions ›
SR-2); the extra output fields are in the contract and data-model. The builder took H1 to H3 as
recommended (SR-1 folded into spec 004 as T060 and T061; FR-010d's 5%; the live-check order), and
the curriculum designer agreed D-1 to D-5 and S-1 (`teaching-design.md` › 14), folded in below.
Still open: nothing for the spec; the live checks L-1 to L-7 settle facts during the build.

**Input**: Cockpit task, Sprint 3 wave A planning, round 2: "Write the build spec for curriculum
skill 2, the speed graph." Number 008 assigned by the cockpit. The teaching design is the
curriculum designer's [`teaching-design.md`](teaching-design.md) (same folder, round 1 answered,
`decisions/007`). This spec links to it by section (§) and turns it into requirements. It doesn't
restate or change what is taught; gaps go back as questions (Open questions › D).

**Plugs into**: spec 004 (approved) through [`contracts/skill-module.md`](../004-ae-curriculum/contracts/skill-module.md):
record ID `easing.speed_graph`, short name `speed-graph`, tool prefix `speed_graph_`, the three tools
`speed_graph_snapshot`, `speed_graph_demo`, `speed_graph_check`, and the shared tools in
[`contracts/shared-tools.md`](../004-ae-curriculum/contracts/shared-tools.md). This skill **only
adds files** (spec 004 FR-032); anything it needs from shared code is a request (Dependencies ›
Shared-code requests), not this skill's work.

## Why this skill

- **The pain:** after easing, motion stops looking robotic but every move has the same generic
  feel (§ 1). Learners stitch videos and a chatbot together and the skill fades (CLAUDE.md,
  interview 004).
- **What Adobe's assistant can't easily copy** (`decisions/002`; CLAUDE.md "Next steps" 2):
  1. **Depth.** On 2026-10-08 Adobe's assistant taught this exact shape and then said it couldn't
     tell eased from linear, so its check was "unconfirmed" (§ 1,
     `discovery/usage-notes/adobe-assistant-2026-10-08.md`). Knack reads influence and speed on
     every side of every key and checks each pair's shape, including that it still comes to rest
     (FR-010). This edge is real today and shrinks if Adobe adds ease reads.
  2. **Memory and practice.** The lesson starts from the pairs the learner eased in an earlier
     easing lesson (FR-004), and a review days later checks whether a new ease gets shaped or left
     at the default (FR-021).
- Restraint and leading are not the edge (a mode switch could copy them); they're how the lesson
  runs, not why it's worth more.

## Decisions and rules this spec relies on

- **`decisions/002`**: the "why" above names depth and memory, not restraint.
- **`decisions/003` amended by `005`**: the demo is one fixed write tool; no open-ended scripts or
  `after-effects` tools in a lesson (FR-007, FR-024); the panel only displays.
- **`decisions/007`**: the curriculum designer owns `teaching-design.md`; this file is the spec
  writer's; the skill builder owns the code and `SKILL.md`; the eval engineer writes the cases.
- **`decisions/008`**: one agent on After Effects at a time; the live checks (L-1 to L-7) run under
  the AE lock; the build runs in a worktree and merges with `/merge-worktree`.
- **Constitution 1.3.0**: I (this spec before build), II (FR-007, FR-024), III (Eval plan), IV
  (FR-023), V (no new dependency; adds files only), VI (cases by the eval engineer; numbers from the
  cockpit; ownership hooks).
- **Spec 002** (easing): the lesson shape, the server rules, the demo-credit logic and the
  25/25 easing eval baseline (2026-10-19).
- **Spec 004** (approved): FR-004, FR-005 (prerequisites), FR-018 to FR-022 (record and reviews),
  FR-024 to FR-026 (demo and the pass margins for this skill), FR-030 (version), FR-032 (adds files
  only), FR-033 to FR-035 (evals and overlaps), FR-037 (skill 4 hand-off, after R1/R2).

None needs changing. One shared-code request (SR-1) is listed under Dependencies; approved and
tasked in spec 004 (T060, T061).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shape my eases on my own comp (Priority: P1)

I've learned easing. Knack picks a layer I eased before, asks me to open the Graph Editor and say
where the move is fastest, explains influence on my comp with a frame, shows one pair if I ask,
and then I shape the rest so they start quickly and land softly. It checks every pair and tells
me what's still off without fixing it.

**Why this priority**: this is the skill. It's wave A's first skill (spec 004 › Build order) and
the clearest depth edge.

**Independent Test**: on Mentor Practice as it is on 2026-10-20
(`discovery/usage-notes/mentor-practice-state-2026-10-20.md`), the builder runs one lesson live.
It's complete if the focus is Title (Position 0.5–1.5 s, 1.5–3 s, 3–4.37 s and Scale 0.5–1.5 s),
the demo (if asked) lands on Title Position 0.5–1.5 s only, and the check agrees with the Graph
Editor on every pair.

**Acceptance Scenarios**:

1. **Given** easing is learned and the comp has eased, unshaped pairs, **When** the lesson starts,
   **Then** it follows § 5's stages 0 to 7 and proposes one layer (two at most) with no more than
   5 pairs, preferring a layer the record shows I eased (FR-003, FR-004).
2. **Given** the proposal, **When** the mentor speaks, **Then** it says what it left out and why,
   one sentence per kind (FR-005).
3. **Given** the read-the-graph step, **When** I say where it's fastest, **Then** the answer is
   checked against the ease data, gets at most one hint, and is recorded, and it never blocks the
   pass (FR-016).
4. **Given** I ask for a demonstration and the focus has two or more pairs, **When** the mentor
   shows one, **Then** exactly one pair changes, only on its two facing sides, as one undo step
   (FR-007).
5. **Given** a focus with one pair, **When** I ask for a demonstration, **Then** there isn't one,
   and the mentor walks me through it in words (FR-007).
6. **Given** I say "done" with a pair whose landing I dragged up instead of sideways, **When** the
   mentor checks, **Then** that pair doesn't pass, and the hint says where it arrives moving and
   which way to drag, without fixing it (FR-010, FR-012).
7. **Given** every focus pair starts quickly and lands softly and still comes to rest, **When** I
   say "done", **Then** the lesson passes and is recorded (FR-010, FR-023).

---

### User Story 2 - Review it in a later session (Priority: P1)

A few days after I learned it, Knack asks me to shape a new eased move on my comp, with no demo,
no walkthrough and no graph-reading step, and checks it the same way.

**Why this priority**: reviews for skills 2, 1 and 3 are in this sprint's baseline (spec 004 H2,
wave C), and the review mode must ship in this skill's first build (spec 004 plan › Wave C: a later
change to a merged tool file needs a shared-owner branch).

**Independent Test**: with a saved record that says this skill was learned on Title in Mentor
Practice three or more days ago, start a review on a comp with another eased, unshaped pair (for
example "Card" in Mentor Practice 2). It's complete if the target isn't Title Position or Title
Scale, there's no demo and no walkthrough, the check is FR-010, and it's recorded as a review.

**Acceptance Scenarios**:

1. **Given** a review, **When** it starts, **Then** the target is one or two candidate pairs on a
   layer and property the record doesn't show for this skill on this comp (FR-021).
2. **Given** a review, **When** I ask for a demonstration, **Then** there isn't one (FR-021).
3. **Given** a review that isn't a pass, **When** the mentor answers, **Then** it gives § 7's hints,
   no reteach, and I can ask for a practice lesson (FR-021).
4. **Given** a due review and no new target in my comp, **When** a session starts, **Then** no
   review is offered and nothing is recorded (FR-021).
5. **Given** the skill isn't learned and I say I already know it, **When** it runs, **Then** it
   runs as the review above (FR-022).

---

### User Story 3 - Sent to easing when I'm not ready (Priority: P2)

If I ask for this lesson before I've learned easing, or my comp has nothing eased to shape, Knack
says so and offers easing first.

**Why this priority**: spec 004 FR-005's own example; small, but the first thing a learner who
skips ahead meets.

**Independent Test**: with a record where easing isn't learned, ask for this lesson on Mentor
Practice as built (only Subtitle Position eased); then on a comp with no eased pair.

**Acceptance Scenarios**:

1. **Given** easing isn't learned, **When** I ask for this lesson, **Then** the mentor names easing
   and offers it first; if I insist, the lesson runs after one sentence and doesn't reteach easing
   (FR-002).
2. **Given** no candidate pair in the comp, **When** the lesson starts, **Then** it says there's
   nothing eased to shape and offers easing instead (FR-002).
3. **Given** a focus pair that's half eased or linear, **When** I try to shape it, **Then** I get
   easing's hint and a suggestion to take easing after this lesson (FR-002, FR-012).

---

### Edge cases where concepts overlap (`/overlap-audit`, spec 004 FR-034)

Source rows: § 9. The shared filters this skill reuses, and every job each one does today:

| Shared piece | Used today for | Reused here for | Risk |
|---|---|---|---|
| `segments()` (skips properties with an enabled expression or one key) | Easing's teaching (findings, targets) **and** easing's change check | Candidates (FR-003) and the check | Right for both jobs here: a skipped property is never a target, and changes to it are still reported by `unexpectedChanges` through its own keys signature |
| `segmentState()` | Easing's states | Not the candidate test on its own | It calls a bezier-out → **hold-in** pair "eased" (only a hold *out* side is "held"). This skill's own test is "both facing sides bezier" (FR-003, FR-010c), so it doesn't inherit that. Observation for the shared owner, not a request (L-7) |
| `unexpectedChanges()` | Easing's "other changes" | The same | Its pair signature covers only the two facing sides, so a shared middle key's sides stay with their own pairs (row 12) |
| `layer.enabled` (eye) | Easing's hidden-layer leave-out (KD-001 until R1) | The same leave-out, never the demo | A matte looks hidden until R1 (row 10) |

The matrix (what each job sees, filled from the code, each row to be pinned by a unit test,
FR-025):

| # | Overlap | Candidate test sees | Check sees | Learner is told | Right? |
|---|---|---|---|---|---|
| 1 | Expression over keys (Logo › Rotation) | Skipped (`segments()`): not a candidate | Key edits reported as "other changes, it has an expression" | One sentence: an expression drives it, so graph edits won't show; never graded, even if named | Yes |
| 2 | Expression with no keys | Not read (R2 not built) | Not read | Nothing; never "this layer has no expression" | Yes, as spec 004 FR-014 |
| 3 | Expression turned off on a keyed property | Keys drive: a candidate if eased | Graded | As any pair | Yes |
| 4 | Single key (Logo › Scale) | Not a pair | Not graded | Nothing | Yes |
| 5 | Hold or linear facing side (Cursor › Opacity, CTRL) | Not a candidate | A focus pair turning linear or hold fails FR-010c | "The key at 1.5 s is linear, so it has no handle" (§ 7 row 3) | Yes |
| 6 | Half eased (Subtitle › Opacity) | Not a candidate; counted as "ease these first" | A focus pair turning half eased fails FR-010c | Easing's hint (FR-002) | Yes |
| 7 | Bezier out, **hold in** on the landing key | Not a candidate (this skill's own facing-sides test) | Fails FR-010c | § 7 row 3's hint | Yes here; easing calls it "eased" (observation, L-7) |
| 8 | Separated dimensions (Bar › X Position) | X and Y are separate properties, separate pairs | Each graded on its own | By its own name ("X Position") | Yes |
| 9 | Multi-dimension ease (Scale reads 3 on a 2D layer) | One pair | Every **moving** dimension graded (FR-011) | Names the dimension that's off | Yes (D-4 agreed), pending L-2 |
| 10 | Hidden layer (Old Take) / matte before R1 | Left out unless the learner wants it; never the demo | Graded if chosen | "You've hidden this…" (a matte reads the same until R1, KD-001) | Yes until R1 |
| 11 | Null (CTRL) | Not a default candidate; allowed if picked; never the demo | Graded if chosen | Its move can't be seen in a frame | Yes |
| 12 | Shared middle key (Title Position 1.5 s, 3 s) | Each pair owns its facing side | Pair 1's landing change never counts for pair 2, and back | The shared-key hint (§ 9) | Yes, pending L-4 (does AE tie the two sides?) |
| 13 | Precomp (Icon) | Inside keys not read; its own transform keys are candidates if eased | Same | "I can't see inside these yet" | Yes |
| 14 | Effect or shape-content pair (Bar › Trim Paths End, eased) | A candidate if picked; not in the default focus | Graded | By its real name | Yes |
| 15 | Parenting (Title rides CTRL, 0–1 s) | Not read until R1 | Only the layer's own keys | Nothing in wave A; after R1, one sentence or spec 004 FR-037 | Yes for wave A: frame claims say only where the layer is on screen, never how far along its move (FR-019, D-5 agreed) |
| 16 | Pair with no value change (Mentor Practice 2 "Pause") | Not a candidate | Not graded | Nothing, unless the learner picks it: "it holds still between those keys, so there's nothing to shape" (FR-004) | Yes (D-1 agreed) |
| 17 | Keys added, removed or moved on a focus property mid-lesson | n/a | Those pairs aren't graded (pair IDs follow key order) | The keys changed; asks if on purpose (FR-014) | Yes |
| 18 | Demo undone, or redone by the learner | n/a | Demo credit: demo / learner redo / after undo / unknown (FR-008) | Credit to whoever did it | Yes |
| 19 | Easy Ease applied again after shaping | Still a candidate (unshaped) | Fails FR-010a and b; "back to default" | § 7 row 5's hint | Yes (the hint's cause is a Guess, L-6) |

Other edge cases:

- **AE busy or unreachable:** no claims, no check, no record result (spec 002 server rule 2).
- **Learner on another comp at "done":** no grade; asks them to switch back (as easing).
- **The learner says a move should land hard** (an impact): that pair leaves the focus without
  argument (FR-006). Overshoot and bounce aren't checked (Out of scope).
- **The record names an easing layer that's gone:** ranking skips it; no claim about it.
- **Fixtures assume three Title Position keys:** they mustn't; Title has four since a lesson added
  4.37 s (state note).

## Requirements *(mandatory)*

### The lesson

- **FR-001**: The skill MUST teach what § 1 to § 7 and § 11 of the teaching design say, in § 5's
  stages, under the server rules (spec 004 FR-025). It MUST plug in by adding only the files the
  skill-module contract lists (`mentor/tools/speed-graph.mjs`, its lib, demo snippet and fixture
  twin, tests and fixtures, `.claude/skills/speed-graph-mentor/SKILL.md`), with `SKILLS =
  ["easing.speed_graph"]` and the three tools named in the contract.
- **FR-002**: Prerequisites MUST follow § 3 and spec 004 FR-005: easing is hard (name it, offer it
  first; if the learner insists, one sentence and no reteach; no candidate in the comp → say so and
  offer easing; a focus pair that's half eased or linear → easing's hint and a suggestion to take
  easing after). Key types (skill 1) is soft and never blocks.

### Focus and leave-outs

- **FR-003**: A pair MUST be a candidate only when all hold: the start key's out side and the
  landing key's in side are both bezier; the property has no enabled expression; the layer is read
  in the open comp; the pair doesn't already pass FR-010; its value changes across the pair
  (D-1, TD § 4); and the learner hasn't said it should land hard (FR-006).
- **FR-004**: Without a learner's pick, the focus MUST be Position or Scale candidates on one layer
  (two at most), no more than 5 pairs, ranked by § 4: layers the record shows an easing lesson
  targeted first, then the rest in layer order. Any candidate the learner names (Opacity, Rotation,
  an effect, a null, a hidden layer) MUST be allowed. A pair with no value change is left out
  silently; if the learner picks one, the mentor says it holds still between those keys, so there's
  nothing to shape, and offers the next pair (TD § 4). When the learner names two layers, they
  share the 5-pair cap one pair at a time, in turn (as built, 2026-10-21). The ranking MUST be deterministic given the
  layer names the mentor takes from `read_learner_record` (from lesson entries' targets; for
  entries written before spec 004, a layer whose exact name appears in the entry's text); the
  skill MUST NOT read the record file itself.
- **FR-005**: The proposal MUST name what it leaves out, one sentence per kind, as § 4 says: hidden
  layers, nulls, precomps, pairs under an expression, linear or half-eased pairs, and pairs already
  shaped. It MUST NOT say a precomp is fine or that a layer has no expression.
- **FR-006**: If the learner says a focus pair should land hard, that pair MUST leave the focus for
  the rest of the lesson, with no argument, and the check MUST NOT grade it. The skill keeps the dropped pairs in the session's
  `skill_options` (spec 004 contracts/skill-module.md › 4, tasks T060 and T061), so a continued or
  resumed lesson still leaves them out.

### The demonstration

- **FR-007**: `speed_graph_demo` MUST be the one demo write (spec 004 FR-024): on the demo target
  only (§ 4: the first focus pair in layer, property, then time order, on a visible non-null layer,
  no expression), at most once per lesson, never with a one-pair focus and never in a review, as
  enforced by the session before After Effects is touched. The write MUST set the start key's
  out-side influence to about 15% and the landing key's in-side influence to about 80% on every
  dimension, leave speeds and key types unchanged, leave each key's other side untouched, and be
  one undo step. It returns what changed and that Edit > Undo reverses it.
- **FR-008**: The demo values MUST carry a fingerprint (within 0.5 of 15 and 80, but not values a
  learner would type; exact values in the plan), so the check can say who shaped the demo pair as
  easing does: the demo, the learner after undoing it, the learner redoing it, or unknown (the
  mentor asks once).
- **FR-009**: After the demo, the mentor MUST show frames early and late in the pair and say what
  changed in plain words (§ 5, stage 4).

### The check

- **FR-010** (settles S-1): `speed_graph_check` MUST pass a focus pair when, on every moving
  dimension (FR-011):
  - a. the landing key's in-side influence is at least **20 points** above the start key's out-side
    influence (spec 004 FR-026);
  - b. the pair's two facing sides are not both within **1 point of 33.33%** (spec 004 FR-026). Only
    the facing sides count; a key's far side belongs to the neighbouring pair (TD § 6 item 2, D-2
    agreed). b is implied by a and stays to drive the "back to default" hint;
  - c. both facing sides are bezier (spec 004 FR-026);
  - d. **still comes to rest:** the landing key's in-side speed is at most **5% of the pair's
    average speed** in that dimension (the value change divided by the pair's duration; for
    unseparated Position, the straight-line distance between the two key values). Where the value
    can't be read, the speed must be 0 (within 0.001). The 5% is approved (2026-10-21) and tuned on L-5 before the build is
    merged; if L-5 changes it, only toward catching a visible bump, never toward passing more pairs
    (TD § 14, S-1).
  The lesson passes when every graded focus pair passes. The demo pair counts while the demo is in
  place, and as the learner's pair after it's undone. The check MUST read the comp fresh, never
  change the baseline, and not grade on another comp.
- **FR-011**: A moving dimension MUST be one whose value differs between the pair's two keys;
  dimensions that don't move are not graded (D-4 agreed; pending L-2). When only some moving dimensions
  pass, the check MUST say which one is off in a way the mentor can say plainly.
- **FR-012**: For each pair that doesn't pass, the check MUST say which of a to d failed and which
  of § 7's mistakes it matches, so the mentor gives that hint and never the fix:
  - arrives moving (d fails; when the landing influence is also within 1 point of the baseline,
    the hint adds "drag sideways, along the bottom");
  - no handle (c fails: linear or hold);
  - long on both ends (a fails and both influences are at least 50%);
  - back to default (b fails and an earlier check in this lesson saw the pair shaped);
  - in and out mixed up (the start key's in side changed from the baseline while its out side
    didn't, and that in side isn't another focus pair's landing);
  - otherwise, not shaped yet.
  Judging by scrubbing (§ 7 last row) isn't checkable; the mentor says it once at "done".
- **FR-013**: On a shared middle key, the in side MUST belong to the earlier pair and the out side
  to the later one; a change to one side MUST NOT count for the other pair.
- **FR-014**: If a focus property's key count or key times change during the lesson, its pairs
  MUST NOT be graded; the check says the keys changed and the mentor asks if that was on purpose.
  Such a pair, or a focus pair that's gone, **holds the pass** until the learner answers: the
  lesson doesn't pass while any focus pair is ungraded for this reason (as built, 2026-10-21).
  Other changes are listed as easing lists them, leaving out the pairs the learner said should land
  hard (FR-006).
- **FR-015**: The check MUST call the session's `markChecked` only when the comp matches, and list
  other changes with the shared `unexpectedChanges`.

### Reading the graph (settles S-2 and S-3)

- **FR-016**: Stage 2 (read the graph) and stage 6 (read again) MUST be recorded and MUST NOT gate
  the pass. For each focus pair the check MUST give where the move is fastest, as the first part,
  the middle or the last part of the pair's duration (thirds), worked out from the pair's ease
  (both influences and both speeds, on the moving dimension with the largest change) by the
  standard bezier curve After Effects uses for temporal ease. Within **0.05 of the pair's duration**
  of a boundary, either neighbouring part counts. On Easy Ease it's the middle; on 15/80 it's the
  first part. A wrong answer gets at most one hint, then the lesson goes on.
- **FR-017**: The mentor MUST NOT claim it sees the Graph Editor. If an answer fits a value graph,
  it asks which graph is showing (§ 7 row 1).

### What the learner hears

- **FR-018**: The mentor MUST NOT state the pass margins (20 points, 33.33%, 5%) or 15/80 as a
  target; it says "make the landing ease clearly longer than the start" (§ 6). It MUST NOT show
  record IDs, field names or quoted values (server rule 5).
- **FR-019**: Claims about motion MUST come from frames only, and describe only where the layer is on
  screen in a frame, never how far along its own move it is; no percentage of distance travelled
  (§ 5, "Claims from frames"; D-5 agreed). This holds until R1 lets the mentor pick frames where no
  parent is moving.
- **FR-020**: Version steps MUST follow § 10 and spec 004 FR-030: the Graph Editor by its timeline
  button, never Shift+F3; always ask the learner to choose Edit Speed Graph; the Keyframe Velocity
  menu path and shortcut quoted only in the form L-1 confirms at 26.5, and until then not quoted.
  At another version, the menu path only.

### Review

- **FR-021**: Review mode MUST follow § 11 and spec 004 FR-019 to FR-021: `speed_graph_snapshot`
  in `mode: "review"` picks one or two candidate pairs on one layer and property not in the record
  for this skill on this comp (Position or Scale first); no demonstration, walkthrough, reading
  step or handle-direction tip; the light intent check of § 4 still applies; the check is FR-010;
  a fail gets FR-012's hints, no reteach, and the skill stays learned; no new target means nothing
  offered and nothing recorded. `FINDERS["easing.speed_graph"].focus` MUST agree with the analysis
  for the same `exclude`, and `review: true` MUST be set in this skill's first build once its review
  tests pass.
- **FR-022**: "I already know it" for an unlearned skill MUST run exactly as the review (spec 004
  FR-020).

### Record

- **FR-023**: `record_lesson` entries MUST follow § 12 and spec 004 FR-018 and FR-022: kind and
  targets from the session; attempted pairs; a summary that includes the reading answers in plain
  words and what was still off; one "next". No influence or speed numbers the learner never saw, no
  method (panel, drag or dialog), no motive, no names. The result and demo flag must match the
  session.

### Reuse, ownership and tests

- **FR-024**: The skill MUST reuse the shared reads and logic (`takeSnapshot`, `segments`,
  `segmentId`, `parseSegmentId`, `unexpectedChanges`, the session, `parseHost`) and MUST NOT copy
  them; its own analysis and check are pure functions in its own file. No `after-effects` tools, no
  open-ended script, no npm dependency, no edit to an existing file (spec 004 FR-032;
  `check-branch.mjs` clean without `--shared-owner`).
- **FR-025**: Every row of the overlap matrix MUST have a unit test on a fixture captured live
  (spec 004 FR-012, FR-034): the current Mentor Practice, Mentor Practice 2, and planted shapes
  (15/80, 33/33, dragged up, one Scale dimension shaped if L-2 shows it can happen, hold-in landing,
  shared key shaped on one side) captured from a **duplicate** comp that's deleted before the file
  is saved. Mentor Practice, its build script and the easing fixtures MUST NOT change.
- **FR-026**: After merge, the easing eval set MUST pass at 25/25 or within one case with no
  hard-rule failure (spec 004 FR-035).

### Key Entities

- **Candidate pair**: two neighbouring keys on one property whose facing sides are bezier, with
  its layer, property, times and ease per dimension.
- **Focus**: the layer (or two) and up to 5 candidate pairs for this lesson, minus pairs the learner
  said land hard.
- **Pair result**: per focus pair, pass or not, which of FR-010 a to d failed, the matching § 7
  mistake, the dimension that's off, where it's fastest, and the demo credit for the demo pair.
- **Lesson entry**: spec 004's shared fields (FR-018); nothing new in structure (§ 12).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first lesson on Mentor Practice runs from start to a verified pass in **15 minutes
  or less** with **at most one demonstration** (spec 004 SC-001). *Measured by:* the builder, live,
  in usage notes with timings from the call log.
- **SC-002**: The check agrees with the builder's own look in the Graph Editor on **at least 9 of
  10** pairs, including at least one dragged-up landing and one Scale pair (spec 004 SC-002).
  *Measured by:* the builder, live, in usage notes.
- **SC-003**: On the saved fixtures, the pass rule gives the expected result on **100%** of planted
  shapes: 15/80 passes; 33/33 fails; dragged up fails on "comes to rest"; a linear or hold side
  fails; a shared key shaped for one pair isn't credited to the other. *Measured by:* unit tests.
- **SC-004**: The fastest-part answer matches the expected part on **100%** of fixture pairs, and on
  **3 of 3** pairs the builder compares with the speed graph's peak by eye (L-6). *Measured by:*
  unit tests and the builder, live.
- **SC-005**: The skill's eval cases pass **at least 80%**, every hard-rule check passes, with **at
  least 6 cases** (spec 004 SC-007), including the cases named in the Eval plan. *Measured by:* eval
  runs by the eval engineer.
- **SC-006**: In review cases, **100%** have no demonstration, no walkthrough and no reading step,
  and use a target not in the record (spec 004 SC-008). *Measured by:* deterministic eval checks.
- **SC-007**: At least **one live review at least one day after the first pass** is logged, with the
  check agreeing with After Effects (spec 004 SC-009). *Measured by:* the builder, in usage notes.
- **SC-008**: The easing eval set stays at **25/25 or within one case** after this skill merges.
  *Measured by:* an eval run, logged with the merge.
- **SC-009**: The branch changes **0** existing files under `mentor/`, `bridge/` or
  `.claude/skills/*-mentor/`. *Measured by:* `check-branch.mjs` at merge.

## Live checks for the build (run under the AE lock; results logged, not guessed)

These settle facts the spec can't. **When (H3, approved 2026-10-21):** L-1 to L-4 are the build's
first live task, before `SKILL.md`'s wording is final; L-5 to L-7 run with the fixture captures.
The builder runs them on a duplicate comp (deleted before
saving) and logs results in `discovery/usage-notes/`. Where one changes a requirement, it comes back
to this spec.

- **L-1 (designer B-2):** at 26.5 on macOS 27.0.1, the Keyframe Velocity menu path and Mac shortcut,
  and the Graph Editor's graph-type menu labels (Edit Speed Graph, Auto-Select). Decides FR-020's
  wording.
- **L-2 (designer B-3):** on a 2D layer's Scale, does dragging an influence handle in the speed
  graph change every dimension together; does Keyframe Velocity show one field or one per
  dimension; and does the read show the third (unused) Scale dimension moving? Decides FR-011 and
  whether "one dimension shaped" can happen.
- **L-3 (designer B-4):** the demo write on Title Position 0.5–1.5 s: only the two facing sides
  change, speeds and key types stay, the out side of 1.5 s (pair 2's start) is untouched, the
  fingerprint values read back exactly, one undo step, Edit > Undo restores it.
- **L-4:** on a shared middle key (Title Position 1.5 s), does dragging the in-side influence handle
  in the speed graph change the out side's influence or speed? Decides FR-013's hint wording.
- **L-5:** drag a landing handle up a little and a lot on Position and on Scale; log the speeds the
  read shows and whether each looks like it arrives moving. Tunes FR-010d's 5%.
- **L-6:** on 33/33, 15/80 and one in-between pair, compare FR-016's fastest part with the speed
  graph's peak (15/80 is expected at about 0.13 of the pair, Assumptions); also look at one pair
  whose facing influences add up to more than 100 (for example 60/70), to check the scaling
  assumption (logged, not one of SC-004's 3); and press Easy Ease on a shaped pair to see it reset both facing sides (§ 7's Guess).
- **L-7:** a pair with a bezier out side and a hold in side on the landing key: what After Effects
  plays, and what the read shows. Pins row 7; if AE holds the move, it's a note for the shared owner
  about easing's `segmentState`.

## Eval plan (cases the eval engineer writes and numbers)

The eval engineer owns the cases, their numbers and fixtures. Unit tests cover the pass rule,
fastest part and overlap rows; evals check what the mentor does with them.

1. **First lesson on Mentor Practice:** proposes Title (Position and Scale, 4 pairs), names the
   leave-outs one sentence each (Old Take hidden, Icon precomp, Logo expression, the linear pairs
   as easing's), a frame inside the focus, real names, then the read-the-graph step.
2. **Demonstration:** one write on Title Position 0.5–1.5 s only, frames after, Edit > Undo; and
   none when the focus has one pair (Bar's Trim Paths End picked alone).
3. **Incomplete attempt:** Scale still at default; names it, no fix, no offer.
4. **"Do the rest":** declined warmly, no offer to do it later.
5. **Riskiest overlap:** the learner names Logo's Rotation (expression over keys): refused kindly as
   a target, never graded. Second overlap: a shared key shaped for pair 1 only isn't praised as
   pair 2.
6. **Review:** record says learned and due; Card in Mentor Practice 2; no demo, no walkthrough, no
   reading step; a new target.
7. **Version trap:** the learner's answer fits a value graph (Scale opens there under Auto-Select):
   asks which graph is showing and to choose Edit Speed Graph; never quotes Shift+F3 or an
   unconfirmed Keyframe Velocity path.
8. **Skill-specific (spec 004):** a 15/80 pair passes; a 33/33 pair doesn't.
9. **Dragged up (S-1):** speed changed, influence not; doesn't pass; the hint says it arrives moving
   and to drag sideways.
10. **Scale shaped on one dimension only** (if L-2 shows it can happen): names which part is off.
11. **Not ready:** easing not learned, or no eased pair: offers easing (US3).
12. **Lands hard:** the learner says Title's last move should slam: dropped, no argument.
13. **Reading answer wrong:** one hint, recorded, and the lesson still passes on the shapes.
14. **Record honesty (deterministic plus rubric):** the summary has the reading answers; no
   influence numbers, method or motive; no thresholds in anything the learner sees.

## Assumptions

- **Learner and setup:** the builder on After Effects 26.5, macOS 27.0.1 (CLAUDE.md › My setup).
- **Mentor Practice now** (state note, 2026-10-20): Title Position has four eased keys (three
  pairs), Title Scale and Opacity and Bar's Trim Paths End are eased, Subtitle Position has two
  eased pairs. So designer B-1 is answered: the live lesson runs on Mentor Practice as it is, with
  Title Position 0.5–1.5 s as the demo target. The live review uses Mentor Practice 2's "Card"
  (spec 004 T041) or a new eased move on the builder's own comp.
- **Wave A shared pieces are merged first** (spec 004 tasks T001–T065), so the session takes an
  analyzer, review mode and fixture twins exist.
- **Speeds and influence** are read per dimension as easing reads them today; no new read is needed
  (spec 004: skill 2 needs no new read).
- **The temporal bezier model** for FR-016 is the standard one (influence sets the handle's length
  as a share of the time to the next key, speed sets its slope); L-6 confirms it against the graph.
  **When the two facing influences add up to more than 100**, the build scales both down to sum to
  100 so time never runs backwards; this is an assumption, and L-6 MUST check it on a pair whose
  influences add up to more than 100. On 15/80 the model puts the fastest part at about 0.13 of the
  pair, not the 0.3 research R2's first draft said; L-6 checks that against the speed graph's peak
  too (as built, 2026-10-21).

## Out of scope (build scope)

- The value graph, overshoot and bounce, separating dimensions to edit the value graph, motion
  paths and spatial tangents (R7), the speed jolt at a middle key and Rove Across Time, Graph Editor
  options (§ 8; spec 004 Out of scope).
- Checking the start key's out-side speed (a "slammed" start isn't graded; only the landing must
  come to rest).
- Parent motion, expressions with no keys, and inside-precomp keys (R1, R2, R4 aren't in wave A);
  the skill 4 hand-off (spec 004 FR-037) comes with them.
- Any change to shared code, `ease-mentor`, the panel or the eval runners (requests only).
- Per-move demo values (fixed about 15/80, § 13 Guess).

## Open questions

All answered 2026-10-21. Kept here with their answers for the record.

### For the builder (H), each with a recommendation

1. **SR-1, a shared-code request** (below): may the session keep a skill's own analyzer options
   across a continued lesson, so a "lands hard" pair stays out? **Recommended:** yes, fold it into
   spec 004 T017 before the shared owner starts. Without it, FR-006 works only if the mentor
   re-sends the dropped pairs on every call, which a resumed headless turn can forget.
   **Approved 2026-10-21:** spec 004 T060 and T061 (`skill_options`).
2. **FR-010d's tolerance:** 5% of the pair's average speed, tuned on L-5. **Recommended:** approve;
   change only the number if L-5 shows a bump below it. **Approved 2026-10-21.**
3. **When the live checks run:** **Recommended:** L-1 to L-4 as the build's first live task, before
   `SKILL.md`'s wording is final; L-5 to L-7 with the fixture captures. None blocks the plan.
   **Approved 2026-10-21.**

### For the curriculum designer (D)

All five agreed as recommended (`teaching-design.md` › 14, 2026-10-20); folded into FR-003, FR-004,
FR-010b, FR-011, FR-012, FR-019 and the overlap rows 9, 15 and 16.

1. **D-1, pairs that don't move:** a pair whose two keys have the same value (Mentor Practice 2
   "Pause") has nothing to shape. **Recommended:** not a candidate; added to § 4's focus rule and § 9.
2. **D-2, "neither key at the default on both sides"** (§ 6 item 2): read literally it grades each
   key's far side, which belongs to the neighbouring pair (§ 9's shared-key row). This spec reads it
   as the pair's two facing sides; then it's implied by item 1 and only drives the "back to default"
   hint. **Recommended:** confirm, or say what else item 2 should catch.
3. **D-3, the "mixed up" hint** (§ 7 row 6): on a shared key, the start key's in side is the earlier
   pair's landing, so a long in side there may be right. **Recommended:** give the hint only when
   that side isn't another focus pair's landing (FR-012).
4. **D-4, non-moving dimensions:** Scale's third dimension on a 2D layer doesn't move. **Recommended:**
   "every dimension" in § 6 means every moving one (FR-011), pending L-2.
5. **D-5, frames while a parent moves:** Title rides CTRL from 0 to 1 s, so a frame at 0.7 s shows
   CTRL's move too, and in wave A the mentor can't know it. **Recommended:** keep § 9's "say
   nothing" for wave A, but have frame claims describe only where the layer is on screen, never how
   far along its own move it is, until R1 lets the mentor avoid frames while a parent moves.

### For spec 004's shared-code owner (optional, raised 2026-10-21)

4. **SR-2, pass `mode` to the analyzer.** `session.start` takes `mode` but doesn't pass it to the
   skill's analyzer, so this skill's tool wraps the analyzer to pass it (contract ›
   `speed_graph_snapshot`). **Recommended:** optional; a later shared-contract change could have
   the session pass `mode` in the analyzer's options (spec 004 contracts/skill-module.md), and the
   wrapper would then be dropped. Not a task here; nothing in this skill waits on it.

### For the eval engineer (E)

The cases above, plus § 13's E items (expression-over-keys named, dragged up, one Scale dimension,
15/80 vs 33/33), are covered by Eval plan 5, 9, 10 and 8.

## Dependencies

- **Spec 004 wave A shared pieces** (tasks T001–T065) merged first: the session with an analyzer and
  review mode (T017), fixture twins (T019), finders (T020), shared errors (T009), Mentor Practice 2
  with "Card" (T041, T042).
- **Shared-code requests** (to the cockpit for the shared owner, not this skill's work):
  - **SR-1:** `session.start` keeps the skill's own analyzer options (here, the pairs left out for
    a hard landing) with the lesson and passes them again when it re-runs the analyzer on a
    continued or resumed lesson. **Approved and tasked 2026-10-21:** spec 004 T060 (test) and T061
    (code), built into T017's rewrite, as the `skill_options` option.
- **Panel-builder request** (spec 004 plan P3): `panel/lib/runtime.js` links every
  `.claude/skills/*-mentor` folder, before any eval run of this skill.
- **Eval engineer:** this skill's eval set and its runner's tool list.
- **Teaching design** (`teaching-design.md`, round 1 answered): if it changes again, this spec
  follows.
