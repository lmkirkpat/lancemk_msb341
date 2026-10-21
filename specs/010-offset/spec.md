# Feature Specification: Break the lockstep with offset (curriculum skill 3)

**Feature Branch**: `010-offset` (spec folder only; no git branch)

**Created**: 2026-10-20

**Status**: Approved 2026-10-21; planned and tasked. Amended 2026-10-21 (round 6) with five
choices the builder confirmed as built: the proposal on Mentor Practice 2 (US2 #1), the 0.1-frame
read allowance in "same" (FR-008), "pops in" on any moved property (FR-008, FR-012), members whose
moves changed (FR-008, row 8), and the demo's fresh read (FR-010). Amended again 2026-10-21 (round
7, builder's decision): a member whose moves changed now holds the pass until the learner answers,
as in spec 008 FR-014, replacing "2 or more graded members pass anyway" (FR-008, row 8). The builder took B-3 (properties kind on
a tie) and B-4 (the rhythm threshold reuses FR-027's floor) as recommended, and both shared requests
are tasked in spec 004 (SR-1 as T058 and T059, SR-2 as T064 and T065). The curriculum designer's
round 1 answers (`teaching-design.md` › 14) are folded in: D-1 changed (a gap under the floor is
caught at the intent step), D-2 agreed plus the up-front case. Still open: nothing for the spec;
live checks L-1 to L-4 settle facts during the build.

**Input**: Cockpit task, Sprint 3 wave A planning, round 2: "Write the build spec for curriculum
skill 3, offset." Record ID `timing.offset`, short name `offset`, tool prefix `offset_`
(spec 004 [contracts/skill-module.md](../004-ae-curriculum/contracts/skill-module.md) › 1).

**What is taught** is the curriculum designer's [teaching-design.md](teaching-design.md) (this
folder, round 1 answered 2026-10-20; `decisions/007`). This spec links to it by section (written
"TD § n") and turns it into requirements. It doesn't restate or change the teaching. Where it needs
something the design doesn't say, that's a question in Open questions › D.

## Why this skill

- **The pain.** Equal starts and landings were among Adobe's top findings on the builder's comp
  ("On the Title, scale and opacity start and finish on the same frames",
  `discovery/usage-notes/adobe-assistant-2026-10-08.md`). It's the step from "animated" to "reads
  as designed" (TD § 1).
- **What Adobe can't easily copy, said plainly** (CLAUDE.md "Next steps" 2; spec 004 › Why):
  Adobe's assistant reads key times too, so the **depth edge is small** here. The edge is **memory
  and practice**: the learner staggers with their own hands, each layer and property is checked,
  a review days later checks a new group with no demo, and the record notices lockstep coming back
  on new comps (spec 005 FR-020's pattern rule). Restraint and leading alone don't count as an
  edge (`decisions/002`).
- **Diagnosis link.** Spec 005's DX-03 ("two or more properties on one layer start and end on the
  same frames") maps to this skill (spec 004 `path.json` › `findings`). Diagnosis is its own
  capability (spec 005); this skill is where a learner goes to fix that finding by hand and keep
  the habit.

## Decisions and rules this spec relies on

- `decisions/002`: the "why" names memory and practice, not restraint.
- `decisions/003` amended by `005`: narrow mentor tools, no open-ended scripts, learner record in
  local files, the panel only displays. This skill adds three fixed tools and one fixed demo
  snippet (FR-001, FR-016).
- `decisions/007`: the curriculum designer owns `teaching-design.md`; the skill builder owns
  `mentor/` and the skill prompt; the eval engineer owns `product/evals/` and writes the cases.
- `decisions/008`: one agent on After Effects at a time; the ownership hooks; `check-branch.mjs`
  rejects edits to existing shared files from a skill branch.
- Constitution 1.3.0: I (this spec before build), II (fixed tools only), III (eval cases, FR-033
  of spec 004), IV (no names in the record), V (smallest thing; plan before multi-file work), VI
  (the builder doesn't write its eval cases; numbers from the cockpit).
- **Spec 004** (approved): FR-004, FR-005, FR-016, FR-017, FR-018 to FR-022, FR-024, FR-025,
  **FR-027** (this skill's margins), FR-030, FR-032, FR-034, FR-035, FR-037; its
  [plan](../004-ae-curriculum/plan.md), [data-model](../004-ae-curriculum/data-model.md) (Timing
  measures, Analyzer result, Lesson entry), [skill-module contract](../004-ae-curriculum/contracts/skill-module.md)
  and [shared-tools contract](../004-ae-curriculum/contracts/shared-tools.md).
- **Spec 002** (easing, built): the house lesson shape ("I do, we do, you do"), the server rules,
  `record_lesson`'s session check, the demonstration rule.
- **Spec 005** (diagnosis, approved): DX-02, DX-03 and DX-07 read the same timing analysis
  (its FR-016 dependency on spec 004), never a copy.

None needs changing. One shared-code request and one fixture request went back to spec 004's owner
(Dependencies › Shared-code requests); both are approved and tasked there (T058 to T059, T064 to
T065).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Stagger one layer's properties on my own comp (Priority: P1)

I've learned easing. I start the offset lesson on Mentor Practice. The mentor says Title's
Position, Scale and Opacity all run 0.5 s to 1.5 s, shows me a frame where they all move at once,
and asks which should go first and how far apart. It shifts one property for me if I ask, and I do
the rest by hand. When I say "done" it checks that no two of them still start and land together.

**Why this priority**: it's the target Mentor Practice actually has (the 2026-10-20 state read:
Title's three properties are the only group bigger than two), so it's the lesson the builder can
run live first. It's also exactly spec 005's DX-03 finding.

**Independent Test**: on Mentor Practice as it is now, a lesson runs from start to a verified
pass with at most one demonstration, and the check agrees with a look in After Effects.

**Acceptance Scenarios**:

1. **Given** Mentor Practice as read on 2026-10-20, **When** the lesson starts, **Then** the mentor
   proposes Title's Position, Scale and Opacity (the properties kind, the larger group), offers the
   layers kind in one sentence (Bar and Glow at 0 s), and names what it leaves out (TD § 4): the
   null CTRL, the hidden Old Take, Logo's Rotation under an expression, the Icon precomp.
2. **Given** the learner picks an order and a gap, **When** they ask for a demonstration, **Then**
   the mentor shifts every key of the second property in their order by their gap, once, and
   shows a frame before and after at the same time (TD § 5 stage 4).
3. **Given** the learner moves only Opacity's landing 4 frames earlier and shifts Scale later,
   **When** they say "done", **Then** it passes: no two properties both start and land the same
   (FR-008, S-1).
4. **Given** the learner moves Scale by 1 frame, **When** they say "done", **Then** it doesn't
   pass, and the hint names Position and Scale without naming a gap to use (TD § 7, FR-027 of
   spec 004).
5. **Given** a focus of two properties, **When** the learner asks for a demonstration, **Then**
   there isn't one; the mentor walks it through in words.

---

### User Story 2 - Stagger a group of layers (Priority: P1)

On a comp where three or four entrances all start together, the mentor names them, asks which goes
first and the gap, shifts the second layer for me if I ask, and checks that no two start together
and that each layer's properties moved together.

**Why this priority**: it's the headline idea of the skill (TD § 1, § 2) and half of its pass.
Mentor Practice has only pairs for it, so it runs on the second practice comp (spec 004 FR-031,
T041).

**Independent Test**: on Mentor Practice 2's layer group, a lesson runs to a verified pass, and on
its saved snapshots each mistake in TD § 7 gets its hint.

**Acceptance Scenarios**:

1. **Given** Mentor Practice 2, **When** the lesson starts, **Then** the mentor proposes Dot 2's
   three properties first (its group of 3 ties with Dot 1 to 3, and FR-006 sends a tie to the
   properties kind) and offers the Dots in one sentence; **when** the learner picks the Dots, it
   names them and their shared start in one sentence and asks the intent question (as built,
   2026-10-21).
2. **Given** the demo, **When** it runs, **Then** it shifts every keyed property on the second
   layer in the learner's order (effects and separated X and Y included), keys only, by the
   learner's gap (TD § 4).
3. **Given** the learner shifts a layer's Opacity but not its Position, **When** they say "done",
   **Then** it doesn't pass and the hint shows a frame where Opacity is up and Position hasn't
   started (TD § 7, "pops in"), unless they'd said they want them split; if they answer that the
   split is on purpose, that layer passes on the next check (FR-012).
4. **Given** staggered starts with uneven gaps, **When** checked, **Then** it passes with one
   sentence on the rhythm, never a fail (FR-011).
5. **Given** staggered starts in a different order from the one the learner said, **When**
   checked, **Then** the mentor asks if that was a change of mind and doesn't fail it (TD § 7).

---

### User Story 3 - Review the skill in a later session (Priority: P1)

A day or more after I learned it, Knack names a new group on my comp ("Chip A, Chip B and Chip C
all start at 2 s"), asks which goes first, and says to stagger them however I like. No demo, no
walkthrough. It checks the same way.

**Why this priority**: reviews for skill 3 are in this sprint's baseline (spec 004 H2, SC-009,
SC-012), and practice across sessions is this skill's whole edge.

**Independent Test**: with a saved record that says this skill was learned and is due, on a comp
with a group not in the record, the review runs with no demonstration and no walkthrough, asks the
order, checks with this skill's pass, and records a review.

**Acceptance Scenarios**:

1. **Given** a due review and a group of either kind on layers and properties the record doesn't
   show for this skill on this comp, **When** the session starts and no skill is in progress,
   **Then** the review is offered (spec 004 FR-004 step 2).
2. **Given** the review runs, **When** the mentor sets it up, **Then** it names the group, asks
   "which goes first?", says "stagger them however you like", and gives no demo, no method and no
   gap (TD § 11).
3. **Given** a due review and no new group in the comp, **When** the session starts, **Then** no
   review is offered and it stays due.
4. **Given** a review that doesn't pass, **When** checked, **Then** TD § 7's hints, no reteach, and
   the skill stays learned.

---

### Edge Cases

The overlap rows are in **Edge cases where concepts overlap** below (the `/overlap-audit`
section). Other edge cases:

- **Easing not learned** (hard prerequisite): name it and offer it; if the learner insists, one
  sentence and the lesson runs; if the focus moves are linear, say so once at "done" and suggest
  easing next (TD § 3, spec 004 FR-005).
- **No group in the comp** (no two eligible layers or properties share a start): say so in one
  sentence and offer the second practice comp (spec 004 FR-004 step 4). In a review: no review.
- **A group already staggered** in review: not a target; mention it, don't grade (TD § 11).
- **The learner asks what gap to use**: it's their call; try one and play it back (TD § 4). The
  mentor never names a number of frames or seconds as a target (FR-007).
- **The learner reorders layers in the stack** to set the order: key times are unchanged, so the
  group is still in lockstep; the hint says the order in the stack isn't when they move (Overlap
  row 17).
- **The learner undoes the demo**: the demo layer or property is back in lockstep; the check names
  it like any other (FR-010).
- **AE busy or unreachable**: no check, no claim about the comp, pass on the fix (server rule 2).
- **Learner record unreadable**: the lesson runs; one sentence about the notes (spec 004 Edge
  Cases).

## Requirements *(mandatory)*

### Tools and files (spec 004 contract)

- **FR-001**: The skill MUST plug in only by adding the files in
  [skill-module.md](../004-ae-curriculum/contracts/skill-module.md) › 1 (tool file, its own analysis
  and check, one demo snippet and its fixture twin, unit tests, fixtures captured live, and
  `.claude/skills/offset-mentor/SKILL.md`), with record ID `timing.offset` and three tools,
  `offset_snapshot`, `offset_demo` and `offset_check`, behaving as that contract's › 3 says. It
  MUST NOT edit any existing file under `mentor/`, `bridge/`, `.claude/skills/*-mentor/`,
  `product/evals/` or `panel/` (spec 004 FR-032; `check-branch.mjs`). Anything more it needs is a
  request to spec 004's shared-code owner (Dependencies).
- **FR-002**: Every timing measure MUST come from the shared analysis (`timing()` and `clusters()`,
  spec 004 FR-016); the skill applies spec 004 FR-027's thresholds in its own file and MUST NOT
  copy or re-derive starts, landings, moves or exclusions (spec 004 FR-017).
- **FR-003**: `FINDERS["timing.offset"].focus(snapshot, { exclude })` MUST agree with the skill's
  own analysis on every fixture (a count above 0 exactly when the snapshot tool would find a group
  with the same `exclude`), and `review: true` MUST be set only once review mode passes its tests
  (contract › 2).

### Focus

- **FR-004**: A **layer is eligible** when its eye is on, it isn't a null, it isn't a precomp, and
  it has a start (at least one counted move, from `first_start`). Its start is the earliest start
  of its counted properties (TD § 4). A **property is eligible** when it's a counted unit (not
  excluded) on an eligible layer. Until spec 004's R1 lands, "eye on" is the only visibility test,
  so a matte with its eye off is left out with "unless you want it" (TD § 9, Matte row); the
  learner can add any left-out layer except a null or a precomp.
- **FR-005**: Two kinds of group, one per lesson (TD § 4), using spec 004 FR-027's "same" (less than
  2 frames apart or 1/15 s, whichever is longer):
  - **Layers:** 2 to 5 eligible layers whose starts are the same. If more than 5 share a start, the
    first 5 in the comp's layer order.
  - **Properties:** 2 or more eligible properties on one layer that have **one move each whose start
    and landing are both the same** (S-1). A property with several moves (Title's Position has keys
    at 0.5, 1.5, 3 and 4.37 s) takes part through the move that matches; the group remembers which
    move of each property it is (its position among that property's moves).
- **FR-006**: The mentor MUST propose the kind with the **larger group** (counting eligible members
  of the largest group of each kind); **on a tie it proposes the properties kind** (S-3: one layer
  is a smaller lesson, and it's the same finding as spec 005's DX-03). Within a kind, a tie goes to
  the earlier start, then the comp's layer order (tie rule approved 2026-10-21, B-3). It offers the other kind in one sentence when
  both exist, and names what it left out in one sentence per reason (TD § 4). The learner can agree,
  pick the other kind, or name the layers. The rule is deterministic and unit tested.
- **FR-007**: After the learner agrees, the mentor MUST ask the intent question (which goes first)
  and the gap, and repeat both back in plain words, along with any layer the learner says up front
  they want split (TD § 4, stage 3). If the gap is under spec 004 FR-027's floor, the mentor MUST
  say in plain words that a gap that small still reads as together and ask them to pick again,
  naming no number; if they keep it, there's no demo (the mentor walks it through in words) and
  the check applies the floor as usual (TD § 5 stage 3, D-1). It MUST NOT name a gap, a number of frames or a
  number of seconds to use, even when asked (TD § 4, spec 004 FR-027, curriculum H7). Converting
  the learner's own gap into frames to say it back is allowed.

### Pass

- **FR-008 (pass, settles S-1)**: The check MUST pass when, on the lesson's group:
  - **Layers:** no two group layers start the same, counting the demo layer (TD § 6 L1); and in
    each group layer where **any counted property moved** (not only where the layer's start moved),
    every counted property's start moved by the same amount within half a frame (TD § 6 L2),
    unless the learner said they wanted that layer's properties split (FR-012). Keyed to any moved
    property because a layer whose later property (say Opacity) moved alone keeps its start, so a
    start-only rule would never fire the "pops in" hint (as built, 2026-10-21; TD § 6 to be
    mirrored by the curriculum designer).
  - **Properties:** no two group properties have their group moves **both start and land** the
    same. Shifting a whole property, moving only its start, or moving only its landing each breaks
    the lockstep (TD § 6 P1).
  - **Both:** nothing about the size or evenness of the gaps is graded (TD § 6; H7).
  - **Members whose moves changed:** a member whose number of moves changed since the baseline
    (properties kind: its remembered move is gone; layers kind: it has no start any more) is
    reported as `keys_changed` and isn't graded; the mentor says that member's keys changed and
    asks if that was on purpose. Such a member **holds the pass** until the learner answers: the
    check doesn't pass while any member is `keys_changed`, however many others pass. It's never
    graded around. This is speed graph's rule (spec 008 FR-014), so both skills treat changed keys
    the same (decided by the builder 2026-10-21, replacing the earlier "2 or more graded members
    pass anyway" rule).
  "Same" is spec 004 FR-027's floor everywhere, with **0.1 frame allowed for rounding**: key times
  are read to the millisecond, so two keys exactly 2 frames apart at 30 fps (0.967 s and 1.033 s)
  read as 1.98 frames, and must still count as 2 (as built, 2026-10-21; FR-023's cases don't
  change). The comparison is pairwise (two members within the floor are the same even when a chain
  of near neighbours would link others).

### Demonstration

- **FR-009**: `offset_demo` MUST make one change on the lesson's demo target only, once per lesson,
  never in a review (spec 004 FR-024, FR-021), and the session MUST refuse any other target before
  AE is touched. The demo target is set from the learner's stated order (TD § 4): the second member
  in that order, or the next one in that order if the second has an expression on a keyed
  property; **none** when the group has two members. Until the learner has given an
  order, there's no demo target. A gap the learner kept under the floor means no demo (FR-007).
- **FR-010**: The demo MUST shift keys only (not the layer's in or out point) by a whole, positive
  number of frames equal to the learner's gap:
  - **Layers kind:** every keyed property on the demo layer, including effect keys, both separated
    dimensions, and single keys (so the layer stays intact as dragging its keys would leave it).
  - **Properties kind:** every key of the demo property (both dimensions if separated).
  It MUST keep each key's value, interpolation types, temporal ease, and spatial tangents, and run
  as one undo step. It MUST refuse, changing nothing, if any shifted key would land after the comp's
  end, if the layer is locked, or if the gap isn't a whole number of frames of at least 1. It MUST also refuse, changing nothing,
  a gap under spec 004 FR-027's floor at the comp's frame rate, so the one demo always shows a real
  stagger (TD § 5, D-1). Before writing, `offset_demo` MUST take **one fresh read** of the comp
  (not the lesson's baseline): it matches the demo layer by name in that read (so a layer moved in
  the stack is still the right one), refuses if the active comp isn't the lesson's, and applies
  the refusals above to the comp as it is now, so a key the learner already pushed toward the end,
  or a lock, is caught before After Effects is written to; the snippet repeats the lock and end
  checks itself (as built, 2026-10-21). The reply says what moved and "Edit > Undo" (server rule
  1).
- **FR-011 (credit)**: The check MUST credit the demo member to the demo while its shift is still in
  place, count it in "no two start the same", and treat it as the learner's once they've undone it
  and moved it themselves (`markChecked(passed, { demoUndone })`, contract › 3).

### Checking the learner's attempt

- **FR-012**: `offset_check` MUST read a fresh snapshot and compare it with the lesson's baseline,
  matching layers by name when names are unique in the comp and by index otherwise, and return per
  member: its start (and landing, properties kind) before and now, how far each counted property
  moved, and which pairs are still the same. The skill prompt turns that into TD § 7's hints: name
  the layers, properties and times, never the fix (spec 002 FR-008). For the layers kind, a split
  inside a layer with any moved property gets the "pops in" hint (FR-008); if the learner answers that the split is on purpose,
  the next check counts that layer as split by intent. A split the learner asked for up front
  (FR-007) counts from the first check. Ask, don't fail (TD § 6 L2, D-2 agreed).
- **FR-013**: The check MUST report, as other changes and not graded, any change outside the group
  that the timing analysis would hide: key times or count on a property outside the group, a single
  key moved, an expression turned on or off, a property that's newly animated or no longer animated.
  It MUST read these from the raw keys of every keyed property, **not** from the timing analysis's
  counted units (the lesson behind `/overlap-audit`: a filter that's right for teaching hid a
  change from checking).
- **FR-014**: The check MUST flag, as a hint and not a pass condition, any key of a group member
  that now sits before 0 s or after the comp's end ("it never finishes"), and MUST NOT count such a
  landing as a landing the comp plays (TD § 7, § 9).
- **FR-015 (rhythm, layers kind)**: After a pass with 3 or more layers, the mentor MUST add one
  sentence on the rhythm when the gaps between consecutive starts (in time order) differ by the
  floor or more (largest gap minus smallest), and say nothing about rhythm otherwise. Never a fail
  (TD § 5 stage 6). The floor reuses spec 004 FR-027, so no new number enters the product (approved
  2026-10-21, B-4; the designer agreed, TD § 14).

### Lesson, version and record

- **FR-016**: The skill prompt MUST follow TD § 5's stages and spec 004 FR-025's server rules: a
  fresh read; one frame from the learner's comp where the group visibly moves together (stage 2);
  frames before and after at the same time for the demo (stage 4); "done" checks by any method, as
  the check reads key times only (Quick Offset, dragging layer bars, dragging keys, Sequence
  Layers). No `after-effects` bridge tool, no open-ended script.
- **FR-017 (version, spec 004 FR-030)**: The mentor MUST teach dragging keys and dragging layer bars
  on every version. It MUST NOT mention Quick Offset until the builder's live run has confirmed the
  gesture on 26.5 (Live run L-1) and then only when R0 reads 25.4 or later (`atLeast(host,
  "25.4")`); with an unknown version (`host.known: false`) it isn't mentioned. It MUST NOT quote
  nudge shortcuts (TD § 10). It MUST NOT teach Sequence Layers, but a check after it is graded the
  same.
- **FR-018**: On a missing easing prerequisite the mentor MUST follow TD § 3 and spec 004 FR-005,
  and say once at "done" if the group's moves are linear, without grading ease.
- **FR-019**: `record_lesson` MUST be called as spec 004's shared-tools contract says, with no new
  input fields. In plain words (TD § 12): `attempted` names the kind and the members in the
  learner's order ("Staggered Title's Position, Scale and Opacity, in that order"); `summary` says
  what the checks showed, including the gaps as measured ("gaps about 4 and 8 frames"), which is a
  measure of the work, not a method, and any split the learner kept on purpose ("split Title's
  Opacity on purpose"); one `next`. The targets stored are the group's members as
  `{layer, property}` (every counted property of each layer for the layers kind), so a review can
  find a new group (spec 004 data-model › Lesson entry). No names, motive or method (spec 004
  FR-022).

### Review mode (in this sprint's baseline)

- **FR-020**: `offset_snapshot` with `mode: "review"` MUST drop every `{layer, property}` in the
  record's past targets for this skill on this comp and project before forming groups, so a review
  group has no member the learner has done (TD § 11; spec 004 FR-021). A group already staggered is
  never a group. With no group left, it returns `no_new_target` and the review isn't offered.
- **FR-021**: A review MUST name the group in one sentence, ask "which goes first?", say to stagger
  them however the learner likes, and then check with FR-008's pass for that kind. No demo (the
  session refuses it), no walkthrough, no method, no gap. A review that doesn't pass gets TD § 7's
  hints, no reteach, and is recorded as a review that didn't pass; "learned" stays (spec 004
  FR-019 to FR-021). "I already know it" runs the same way (C4).

### Tests and evals

- **FR-022**: Each row of the overlap table below MUST have a unit test on a saved snapshot with an
  answer key, captured live where the comp has the case (Mentor Practice, Mentor Practice 2, its 60
  fps duplicate) and synthetic only where no capture exists, marked as such (spec 004 FR-012,
  FR-034).
- **FR-023**: The floor MUST be unit tested at 30 fps (1 frame apart is the same, 2 frames apart
  isn't) and 60 fps (3 frames apart is the same, 4 isn't), for starts and for landings.
- **FR-024**: The demo snippet's fixture twin MUST reproduce the shift on saved snapshots so evals
  run without After Effects, and a unit test MUST show the twin keeps key types and ease.
- **FR-025**: The eval engineer's cases (Eval plan) MUST run on saved snapshots without After
  Effects, and the easing set MUST stay at 25/25 or within one case after this skill merges (spec
  004 FR-035).

### Key Entities

- **Group**: the lesson's focus. Kind (layers or properties), members (layers, or one layer's
  properties with the matching move of each), the shared start (and landing).
- **Intent**: the learner's order and gap, and any layer they said to split (up front or after the
  "pops in" hint).
- **Demo target**: one member, from the order (FR-009), or none.
- **Check result**: per member, start and landing before and now, per-property shift, the pairs
  still the same, other changes, out-of-comp keys.

## Edge cases where concepts overlap (`/overlap-audit`, spec 004 FR-034)

Run 2026-10-20 against the snapshot code (`mentor/jsx/snapshot.jsx`), the easing analysis and
diff, and the timing contract (spec 004 data-model › Timing measures; `timing.mjs` isn't built
yet, so rows marked **contract** are checked against the contract and must be re-confirmed in the
unit tests). TD § 9 is the source for what each row must see; this table adds what the focus,
the check and the learner each see, and the reused filters.

**Filters used by more than one job:**

1. **`timing()`'s `excluded`** (expression, single key, no change) decides what to **teach** (the
   group) and would, if reused, decide what **changed**. It's right for teaching and wrong for
   change detection: a single key moved, an expression switched off, or a pause given a new value
   would all go unreported. FR-013 makes the check read raw keys for other changes.
2. **The eye switch** (`enabled`) is today both "hidden by the learner" and "matte" (KD-001). Wave A
   has no R1, so this skill can't tell them apart; it leaves both out with "unless you want it"
   (FR-004) and switches to the visibility class when R1 lands.
3. **Easing's `unexpectedChanges()`** is keyed on easing pairs; it doesn't report a moved single
   key. This skill writes its own other-changes list (FR-013) rather than relying on it.
4. **The snapshot skips layers with no keys and unkeyed properties**, so a delay expression with no
   keys is invisible (TD § 9, R2). The mentor never says the group is everything that moves.

| # | Overlap | Focus sees | Check sees | Learner is told | Right? / test |
|---|---|---|---|---|---|
| 1 | Expression on a keyed property (Logo Rotation) | Unit excluded; not a member; if it's a layer's only counted motion, no start | Keys excluded from grading; a key-time change or the expression toggled is an other change (FR-013) | "An expression drives Logo's Rotation, so its keys aren't what you see" | Right if FR-013 holds. Test on Mentor Practice |
| 2 | Expression with no keys | Not read (R2) | Not read | Nothing claimed about other motion | Right (blind spot, stated). Test: focus wording never says "everything" (eval) |
| 3 | Single key (Logo Scale) | No start | Not graded; moved single key is an other change | Nothing, unless it moved | Right with FR-013. Test on Mentor Practice |
| 4 | Hold pair (Cursor Opacity, 6 hold keys) | Start = the second key's time, a jump with no duration (S-2, **contract**) | Shift measured at the jump | "The Cursor's first jump is at 0.5 s" | Right per data-model. Test: Cursor's start is 0.5 s, not 0 s; Mentor Practice 2's "Flag" (hold then ramp) |
| 5 | Two held jumps on one layer at the same time | Both start and land the same → a properties group | Pass once either jump moves past the floor | As any pair | Right but surprising; pin with a synthetic test |
| 6 | Hold jump vs. a ramp starting together | Starts same, landings differ → not a properties group (S-1); same start for the layers kind | As focus | | Right; pin with a test |
| 7 | Separated dimensions (Bar X Position) | One "Position" unit; start is the earlier of X and Y | X shifted and Y not reads as a changed Position move, and the layer's Position start moves only if X was first; flagged as a split within Position | "Bar's Y Position didn't move with X" | **Gap**: the contract merges dimensions into one unit, so the check needs per-dimension shifts from the raw keys. Skill-local (its own diff). Test on Mentor Practice 2's separated layer |
| 8 | Several moves in one property (Title Position: 0.5, 1.5, 3, 4.37 s) | Matches its first move against Scale and Opacity | Compares the remembered move (FR-005); if its move count changed, says so, doesn't grade that property, and asks if that was on purpose; that property holds the pass until the learner answers (FR-008, as spec 008 FR-014) | | Pinned by spec 004 T058 and T059 (SR-1): each key pair is its own move, so the matching move is found. Test on Mentor Practice |
| 9 | Two neighbouring keys with equal values (a pause) | Not a move | A value given to a paused key makes a new move: other change | | Right with FR-013. Mentor Practice 2 "Pause" |
| 10 | Effect keys (Glow's blur) | Count in the layer's start | Must move with the layer's other keys; moved with it = pass | | Right per contract. Test: Glow shifted with its layer passes |
| 11 | Adjustment layer (Glow) | Eligible (renders); it's an odd "entrance" (TD § 4) | As any layer | | Right; no special case |
| 12 | Precomp layer (Icon) | Not eligible until R1 | Not graded | "I can't check their timing yet" | Right. Test |
| 13 | Hidden layer (Old Take) and matte, eye off | Left out until R1 | Not graded unless added | "unless you want it" | Right for wave A (KD-001 caveat, filter 2). Test |
| 14 | Null (CTRL) | Not eligible; never the demo | Not graded | One sentence | Right. Test, including a learner who adds it (refused) |
| 15 | Parenting (Title, Subtitle under CTRL, which moves 0 to 1 s) | Own keys only; a child's visible start includes the parent's motion, not read in wave A | Own keys only | Nothing about parents in wave A, and never a claim that the children no longer move together on screen (TD § 9) | Known blind spot until R1 (designer confirmed, TD § 14): staggering two children of one moving parent passes on their own keys while the parent's motion still moves them together. Stated in Out of scope |
| 16 | Layer bar dragged vs. in point trimmed | Not read (in points are R1) | Bar drag: keys move, so the check sees it (**live check L-3**). Trim: keys unchanged, still lockstep | "Its bar may have moved, but the animation inside it didn't" | Right if L-3 confirms key times are read in comp time after a drag |
| 17 | Layer reordered in the stack | n/a | Matched by name (FR-012); key times unchanged → still lockstep | "The order in the stack isn't when they move" | **Gap fixed by FR-012** (index matching would see a different layer). Test |
| 18 | Keys before 0 s or after the comp's end | n/a | Flag (FR-014); not a landing the comp plays | TD § 7 hint | Right with FR-014. Synthetic test |
| 19 | Sub-frame key times (Quick Offset's even spacing, B-2) | Floor compares in seconds | Half-frame tolerance on per-property shifts | | **Live check L-1**; test with a synthetic half-frame case |
| 20 | 60 fps comp | Floor = 1/15 s = 4 frames | 3 frames is still the same | Same hint, no number | Right per spec 004 FR-027. Test on the 60 fps capture |
| 21 | Locked layer as demo target | n/a (lock not read until R1) | Demo refuses, nothing changed (FR-010) | Plain sentence | **Live check L-4** |
| 22 | Text animator, mask path, shape keys | Counted like any keyed property | Counted | | Right; no special case |

**Trap layers in Mentor Practice 2** (spec 004 T064, from SR-2): Dot 2 with an effect key, Dot 3
with separated Position, Dot 1 hold then ramp, and a second layers group (Chip A to C, 2 s) for
reviews.

## Live run (builder, needs After Effects; not guesses)

- **L-1 (TD B-2)**: Quick Offset at 26.5 on the Mac: the gesture (Cmd+Option drag of layers, or of
  selected keys across layers); whether it moves effect keys; whether it moves the layer (in point
  and keys) or keys only; whether its even spacing puts keys between frames. Until logged, FR-017
  keeps it out of the lesson.
- **L-2 (TD B-3)**: the demo snippet on all of a layer's keyed properties (including an effect and
  separated X and Y), by whole frames, keys only: each key keeps its type, ease and spatial
  tangents; one Edit > Undo reverts it.
- **L-3 (new)**: after dragging a layer bar, the snapshot's key times are the new comp times; after
  trimming the in point, they're unchanged.
- **L-4 (new)**: the demo on a locked layer refuses without a partial change.
- **TD B-4** is answered by `discovery/usage-notes/mentor-practice-state-2026-10-20.md`: Title's
  Position now has 4 keys (0.5, 1.5, 3, 4.37 s), so fixtures and tests MUST NOT assume three.
- **TD B-1** (the second practice comp) is spec 004 T041 plus T064.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A live lesson on Mentor Practice (properties kind) and one on Mentor Practice 2
  (layers kind) each reach a verified pass in **15 minutes or less** with **at most one
  demonstration**. *Measured by:* the builder, usage notes, timings from the call log (spec 004
  SC-001).
- **SC-002**: The check agrees with a look in After Effects (scrubbing starts and landings) in **at
  least 9 of 10** checks across the live runs. *Measured by:* the builder, usage notes (spec 004
  SC-002).
- **SC-003**: The eval cases pass **at least 80%**, with **every hard-rule check passing**, on **at
  least 12 cases** (Eval plan). *Measured by:* eval runs.
- **SC-004**: In every eval case, the mentor names a gap to use **0 times** (including when asked).
  *Measured by:* a judge rubric item on every case, plus a deterministic check on the "what gap?"
  case.
- **SC-005**: Every overlap row and the floor cases (FR-022, FR-023) pass their unit tests:
  **100%**. *Measured by:* `npm test`.
- **SC-006**: At least **one live review at least one day after the first pass** is logged with the
  check agreeing with After Effects (spec 004 SC-009 for skill 3). *Measured by:* the builder,
  usage notes.
- **SC-007**: The easing set stays at **25/25 or within one case** with no hard-rule failure after
  the merge. *Measured by:* an eval run logged with the merge.
- **SC-008**: The skill's branch changes **0 existing shared files** (FR-001). *Measured by:*
  `check-branch.mjs` and `/merge-worktree` notes.

## Eval plan (cases the eval engineer writes and numbers)

The eval engineer owns the cases, their numbers and fixtures; this lists what must be covered.
Unit tests cover the measures (FR-022, FR-023); evals score the teaching.

1. **First lesson, properties kind** on Mentor Practice: proposes Title's three properties, offers
   the layers kind once, names what's left out, asks order and gap, real names (US1 #1).
2. **First lesson, layers kind** on Mentor Practice 2: Dot 2's properties proposed first (the tie),
   the Dots offered in one sentence, the learner picks them (US2 #1).
3. **Demonstration**: one shift on the second member in the learner's order; frames before and
   after; none with a two-member group (walks it through in words).
4. **"What gap should I use?"**: it's their call, no number (SC-004).
5. **Lockstep floor**: a 1-frame offset at 30 fps and a 3-frame offset at 60 fps are still called
   together, with no number given (TD § 13 E).
6. **Uneven gaps**: passes with one rhythm sentence, never a fail.
7. **Pops in**: Opacity moved and Position didn't; the hint shows the frame, no fix.
8. **Effect key moved with its layer** passes.
9. **Properties kind, only the landing moved** passes (S-1).
10. **Riskiest overlap, the hold pair**: a group with a held layer; the mentor names its start as
    the jump time and grades the jump (spec 004 FR-034).
11. **Order differs from the stated one**: asks, doesn't fail.
12. **Trimmed in point, keys unchanged**: the bar-vs-keys hint.
13. **Incomplete attempt**: names what's still the same and where; doesn't fix or offer to.
14. **"Do the rest"**: declined warmly, no offer later.
15. **Review**: due, new group, no demo or walkthrough, asks which goes first (SC-008 of spec 004).
16. **Review with no new group**: not offered, stays due.
17. **Version trap** (spec 004 FR-030): unknown or pre-25.4 version never mentions Quick Offset;
    after L-1, 26.5 offers it alongside dragging.
18. **Missing prerequisite**: easing not learned; one sentence, the lesson runs, linear moves
    mentioned once at "done".
19. **Gap under the floor at the intent step** (D-1): the learner picks 1 frame at 30 fps; the
    mentor says a gap that small still reads as together, names no number, and asks again; if they
    keep it and ask for the demo, there's none and it walks it through in words.
20. **Split on purpose** (D-2): said up front, or in answer to the "pops in" hint; that layer passes
    on the next check, and the summary says it in plain words.

Plus spec 004's cross-skill cases that touch this skill (plain speech on every case).

## Assumptions

- **Learner:** the builder on After Effects 26.5 on macOS 27.0.1 (CLAUDE.md › My setup); R0 is still
  read each session.
- **Wave A shared pieces are merged first** (spec 004 tasks T001 to T065): `timing()`,
  `clusters()`, the per-skill session with review mode, R0, `record_lesson`'s new checks, Mentor
  Practice 2. This skill builds on them and is blocked until they land.
- **Mentor Practice is unchanged** for this skill; the layers-kind lesson and reviews use Mentor
  Practice 2 (spec 004 FR-031).
- **Spec 005's DX-03** sets its own threshold (spec 004 FR-017); if it's looser than FR-027's floor,
  a diagnosis finding could name a pair this skill doesn't see as a group. Recommended to spec 005's
  plan: use the same floor for DX-03 so a finding is always a skill 3 focus.

## Out of scope (build scope)

- What TD § 8 doesn't teach: varying durations (DX-02), Sequence Layers as a technique, delay
  expressions, follow-through and overlap, dead time (DX-07), keys inside precomps, time remapping.
- **Parents' motion** in a child's start (a known blind spot until R1: children of a moving parent
  can pass while still moving together on screen), in points, out points, stretch and precomp timing: not
  read until R1 (wave B); nothing said about them in wave A (TD § 9).
- **Expressions with no keys** (R2, wave D).
- **Grading the gap** (size or evenness), and any demo that shifts in points or more than one
  member.
- **Negative demo shifts** (moving a member earlier): the demo only moves later; the learner may do
  either.
- **Panel screens** for this skill (spec 007).
- **Any change to shared files** (FR-001): requests only.

## Open questions

All answered (designer 2026-10-20, `teaching-design.md` › 14; builder 2026-10-21). Kept with their
answers for the record.

### For the curriculum designer (D)

1. **D-1, a demo gap under the floor.** If the learner picks 1 frame at 30 fps and asks for the
   demo, should the demo run (and the check then call it still together), or should the mentor
   say a gap that small still reads as together and ask them to pick another, without naming a
   number? **Recommended:** don't run it; say it in plain words and let them pick again, so the
   one demo shows a real stagger. **Answered, changed:** catch it earlier, at stage 3 when the gap
   is repeated back; if they keep it, no demo and the check applies the floor (FR-007, FR-009,
   FR-010).
2. **D-2, "unless they said they want them split".** TD § 6 L2 assumes the learner said it
   beforehand. **Recommended:** the check gives the "pops in" hint first; if the learner answers
   that the split is on purpose, that layer passes on the next check (as TD § 7's Sequence Layers
   row: ask, don't fail). **Answered: agreed**, plus saying it up front at stage 3 counts, and the
   summary says it in plain words (FR-007, FR-012, FR-019).

### For the builder (B)

3. **The tie-break (S-3).** **Recommended:** on a tie, the properties kind (FR-006), as above.
   **Approved 2026-10-21.**
4. **Rhythm threshold (FR-015).** **Recommended:** reuse FR-027's floor for "uneven" (largest minus
   smallest gap), so no new number enters the product. **Approved 2026-10-21.**

### Settled here

- **S-1** agreed: the properties kind passes when no two properties both start **and** land the
  same (FR-005, FR-008). The designer updated curriculum.md § 6 to match (2026-10-20).
- **S-2**: already pinned by spec 004's contract (data-model › Timing measures: a hold pair is an
  instant move at the second key's time; tasks T040), so it isn't a shared-code request. Spec 004's
  Edge Cases "Hold pair" row now says "an instant move at the second key's time" (2026-10-21).

## Dependencies

- **Spec 004 wave A** (tasks T001 to T065) merged, including T037 to T043 (timing and Mentor
  Practice 2).
- **Shared-code requests** (to spec 004's shared-code owner; not this skill's work):
  - **SR-1 (timing, T040 and data-model):** pin whether consecutive ramp pairs in **one** property
    (or one dimension) are separate moves or one move. **Recommended:** each key pair is its own
    move, pauses dropped, and only moves from **different** separated dimensions merge. Add a test
    with Title's 4-key Position. Without it, the properties group on Mentor Practice (FR-005) may
    not form. **Approved and tasked 2026-10-21:** spec 004 T058 (tests) and T059 (code).
  - **SR-2 (Mentor Practice 2, T041):** TD B-1's layer target needs more than "Dot 1 to 3, first
    Position keys at 0.5 s": each Dot with two animated properties, one with an effect key, one
    with separated Position, a hold-then-ramp member, and a **second layers group** on other layers
    for reviews and evals. **Approved and tasked 2026-10-21:** spec 004 T064 (build, live) and T065
    (tests); the second group is Chip A, B and C at 2 s, and no skill 3 layer's Opacity goes
    between 0 and 100, so none is a skill 1 candidate.
- **Spec 005**: DX-03's threshold (Assumptions).
- **Eval engineer**: the Eval plan; fixtures from the live captures above.
