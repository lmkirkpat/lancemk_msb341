# Feature Specification: Move a group with a null (curriculum skill 6)

**Feature Branch**: `012-null-parenting` (spec folder only; no git branch)

**Created**: 2026-10-23

**Status**: Approved 2026-10-23. The builder took H-1, H-3, H-4 and H-5 as recommended and, for
H-2, approved SR-1 and **declined SR-2** (going with the designer). The designer's round 1 answers
(TD § 14: D-1, D-2, unique names, a null with a parent) are folded in the same day, and D-3 (the
null's own name shared: the rename ask) on 2026-10-24 (FR-019, row 40). Plan and tasks
approved 2026-10-24 with plan › Q1 and Q2 (FR-008's reading and FR-017's two refusals below) and
SR-4 (the comp's size; spec 004 tasks-wave-b.md T164, T165).

**Amendment 1 (2026-10-25, L-6): approved by the human 2026-10-25, H-6 answered.** The proposal rule is reworked
in TD § 4, § 5 stage 1, § 11 and § 15 (commit 002bf92), approved by the human word for word with
L6-1 (Chip A to C is the review's next group on the live comp, no extra tie-break) and L6-2 (the
finder counts a crowd for next-mentor only). Changed here: FR-003, FR-004, FR-005, FR-008, FR-009,
FR-012, FR-019, FR-024, new FR-005a (saying the proposal), US1 #1 and new #8 and #9, Edge Cases,
L-6, SC-001, the Eval plan (case 1, new 19 and 20), Assumptions and Open questions (H-4 amended,
L6-1 and L6-2 answered, H-6 open). FR-008, FR-009, FR-012 and FR-019 also close the review's S6
gaps (spec wording behind what `skill-6-null` already builds). The new tasks are in
[tasks-l6.md](tasks-l6.md) (T350 on), so the builder's ticked `tasks.md` isn't edited.

**Amendment 2 (2026-10-26, the live sitting, [live-sitting-2026-10-26.md](live-sitting-2026-10-26.md)):
approved by the human 2026-10-26.** Facts from L-1 to L-6 and the desk block (`4234c7e`, `6039c78`,
`3864ac5`); nothing changes a requirement's intent, and no new task. Changed here: FR-009 (the
null's place is its anchor, top-left of its square), FR-020 (a null's opacity counts when keyed or
set between 0 and 100; a static 0 never does; the default name is "Null N"), FR-023 (L-1's notes:
labels, the null's defaults, Option and Shift as a caution only, Quick Offset still out), rows 15,
22 and 40, US3 #1, #2 and new #2a (the review's group is Chip A to C), Live checks › Results, Eval
plan case 12, and new D-4 for the designer. Also quickstart § 3 and § 6, data-model's stored-null
example and research R8 and R11.

**Amendment 3 (2026-10-28, pacing, S-7): approved 2026-10-28** of this spec's parts. TD
§ 16, "Pacing: one idea per turn", was approved by the human on 2026-10-28 as written. Evidence:
R-ONE-IDEA failed 7 of 9 runs of cases 02, 03 and 04 after `e82a7d2`, and 02, 04, 15 and 23 in the
baseline (`product/evals/null-parenting/README.md` › "First full baseline" and "Fix re-runs
2026-10-28"). Changed here: US1's story and #2 (one frame of the focus group; an existing rig such
as CTRL or Hatch Rig as the example **only when the learner asks**; "not opacity or effects"
stays, as a clause of the idea), US1 #3 and Eval plan 3 (the turn-or-scale question ends the
explanation turn), FR-023 (the Parent column named, how to show it only when the learner can't
find it; the held-key line narrowed to the jump hint's one question; with it, D-4's anchor
sentence folded in), new FR-023a (the shared pacing rule in spec 004 curriculum.md § 2, by link),
Eval plan 2 and the pacing reading, Assumptions (CTRL). **No change** (TD § 16): FR-014, FR-016
(P5 still asks for the region before grading if it was skipped), FR-020, FR-022; no tool change.
New tasks T344 to T347 (tasks.md › Phase 11).

**Input**: Cockpit task, Sprint 3 wave B, round 2: "Write the build spec for curriculum skill 6,
Move a group with a null." Record ID `parenting.null` (in `mentor/curriculum/path.json`, position
6, hard prerequisite `transform.anchor`, soft `motion.sources`), short name `null-parenting`, tool
prefix `null_parent_` (spec 004 [contracts/skill-module.md](../004-ae-curriculum/contracts/skill-module.md) › 1).

**What is taught** is the curriculum designer's [teaching-design.md](teaching-design.md) (this
folder, draft 2026-10-23; `decisions/007`). This spec links to it by section (written "TD § n") and
turns it into requirements. It doesn't restate or change the teaching. Where it needs something the
design doesn't say, that's a question in Open questions › D.

**The designer's S-1 to S-6 (TD § 13), taken:** all six, as recommended. S-1 (corners, not only the
position), S-2 (the stored before-read time) and S-3 (through the null as stored) are FR-011 to
FR-013; spec 004 FR-029 now keeps only the 1 px measure and "never compare raw key values" and
points here (H-1, made 2026-10-23). S-4 (the move is Position, Scale or Rotation) is FR-015; S-5
(N3 on the group's bounds with FR-028's per-axis numbers, gating only a move that turns or scales)
is FR-009 and FR-016; S-6 (ask, don't fail, for a null with a parent) is in FR-009 too, narrowed
by TD § 14 to a parent that doesn't move. S-3's timing is refined by D-1, which the designer took
(FR-012).

## Why this skill

- **The pain.** The moment a design has parts (a lower third, a logo lockup), the learner wants to
  move them together without re-keying each one, and the classic failures (a visible parent, a
  fade that doesn't pass down, a child that jumps when parented) are B-tagged "very common"
  (TD § 1).
- **What Adobe can't easily copy, said plainly** (CLAUDE.md "Next steps" 2; `decisions/002`):
  - **Depth, on the jump.** Adobe's assistant reads parents ("Logo isn't parented to CTRL",
    `discovery/usage-notes/adobe-assistant-2026-10-08.md`), so "is the parent a null" is no edge.
    What it couldn't do was place layers on screen ("those numbers are in each layer's own
    space"). Whether a child jumped is a comp-space question: Knack checks every child's
    footprint, all four corners, at every one of its key times, before and after (FR-011). That's
    the edge, and it's the part a learner can't easily check by eye on a long comp.
  - **Memory and practice.** The review gives a "move these together" task days later and never
    says "null" (FR-024), so it sees whether the learner reaches for one unprompted.
  - Restraint and leading alone don't count as an edge (`decisions/002`).
- **Diagnosis link.** Spec 005's DX-08 (stacked parent and child motion) reads the same
  motion-sources map (spec 004 FR-014). Here it's one ungraded sentence (FR-020); diagnosis is its
  own capability (spec 005).

## Decisions and rules this spec relies on

- `decisions/002`: the "why" names depth and memory, not restraint.
- `decisions/003` amended by `005`: narrow mentor tools, no open-ended scripts, learner record in
  local files, the panel only displays. This skill adds three fixed tools and one fixed demo
  snippet (FR-001, FR-017).
- `decisions/007`: the curriculum designer owns `teaching-design.md`; the skill builder owns
  `mentor/` and the skill prompt; the eval engineer owns `product/evals/` and writes the cases.
- `decisions/008`: one agent on After Effects at a time; the ownership hooks; `check-branch.mjs`
  rejects edits to existing shared files from a skill branch.
- Constitution 1.3.0: I (this spec before build), II (fixed tools only), III (eval cases), IV (no
  names in the record), V (smallest thing; plan before multi-file work), VI (the builder doesn't
  write its eval cases; numbers from the cockpit).
- **Spec 004** (approved): FR-005, FR-009, FR-013 (one visibility class), FR-014 (the
  motion-sources map; skill 6's checks read it), FR-018 to FR-022, FR-024, FR-025, **FR-028** (the
  region numbers, reused by N3), **FR-029** (the 1 px measure and no raw values; it points here,
  H-1),
  FR-030, FR-032 (add files only), FR-033 to FR-035, FR-037, its Edge Cases table; its
  [plan](../004-ae-curriculum/plan.md) › Wave B, [tasks-wave-b.md](../004-ae-curriculum/tasks-wave-b.md)
  (W1 sampled R3, W4 R1 extras, W5 auto-orient, W6 `parent_transform`, W7 and T157 Mentor Practice
  2b, T135's parented capture, T161 to T163 for this spec's SR-1 and SR-3), [data-model](../004-ae-curriculum/data-model.md) › Wave B shapes
  and the [skill-module contract](../004-ae-curriculum/contracts/skill-module.md).
- **Spec 002** (easing, built): the house lesson shape, the server rules, `record_lesson`'s session
  check, the demonstration rule.
- **The shared pacing rule** (one idea per turn; added 2026-10-28): spec 004's
  [curriculum.md](../004-ae-curriculum/curriculum.md) § 2, next to the opening rule. This skill's
  turns under it are TD § 16 (FR-023a). Linked, not copied.
- **Spec 011** (set the pivot, written in parallel): this skill's hard prerequisite. Nothing here
  reads its files or its check; N3 reuses spec 004 FR-028's numbers directly.

Spec 004 FR-029 was reworded to point here (H-1). Of this spec's three shared-code requests, SR-1
and SR-3 are approved as tasks-wave-b.md T161 to T163, and SR-2 is declined this sprint
(Dependencies › Shared-code requests).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Move a group with a null on a practice comp (Priority: P1)

I've learned to set the pivot. I start this lesson on Mentor Practice 2. The mentor asks which
layers should move as one, and when I don't know, it proposes Tile, Caption and Stamp because they
sit together. It shows me a frame of the three, says what a parent passes down, and asks whether
they'll turn or scale and from where. I say from the middle of the group, add a null, drag it there,
and say "done". It parents Tile for me
if I ask, and shows Tile didn't move. I parent the other two and say "done"; then I give the null
one move. It checks that nothing jumped, every layer kept its own animation, and the group moved.

**Why this priority**: it's the whole skill, and Mentor Practice's one group is already done
(TD § 4, last paragraph), so the live lesson runs on Mentor Practice 2's wave B layers (T157).

**Independent Test**: on Mentor Practice 2 with its wave B layers, a lesson runs from start to a
verified pass with at most one demonstration, and the check agrees with a look in After Effects.

**Acceptance Scenarios**:

1. **Given** Mentor Practice 2 as built (wave A's layers and wave B's), **When** the lesson starts
   and the learner has no group in mind, **Then** the mentor proposes Tile, Caption and Stamp in one
   sentence with its reason (they sit together, apart from everything else), names what it leaves
   out for the candidate table's reasons (Shadow follows Plate), one sentence per reason, and never
   lists the 13 wave A layers that crowd together (TD § 4, § 15).
2. **Given** a focus is agreed, **When** the mentor explains, **Then** it uses one frame of the focus
   group and says, in one sentence, that children take on the parent's position, scale and
   rotation, not opacity or effects, and keep their own animation; an existing rig (CTRL with
   Title and Subtitle, Hatch Rig with Hatch) is named as an example **only when the learner asks**
   for one ("what does that look like?"), in words from the read. The turn ends on whether the
   group will turn or scale and from where, with no null, menu path or second explanatory
   sentence (TD § 16 turn 2; amended 2026-10-28).
3. **Given** the learner said the group turns from its middle (at the end of the explanation turn,
   TD § 16) and adds a null, **When** the null
   sits at the group's top-left and they say "done", **Then** it doesn't pass and the hint names
   where the null is and what they said (TD § 7, pivot row).
4. **Given** the null passed, **When** the learner asks for the demo, **Then** the mentor parents
   Tile to the null with no jump, once, and says in plain words that Tile moved 0 pixels (TD § 5
   stage 4).
5. **Given** the learner parents Caption with the pick whip dragged from Position, **When** they
   say "done", **Then** it doesn't pass: the hint says Caption's Parent column still says none and
   it jumped to the null, and names the Parent column's pick whip (TD § 7).
6. **Given** every focus layer is parented with no jump, **When** the learner gives the null two
   Rotation keys, **Then** it passes, and the mentor shows frames at the null's first and last key
   and says Caption still fades in on its own (TD § 5 stage 6).
7. **Given** the learner fades the null instead of moving it, **When** they say "done", **Then** it
   doesn't pass and the hint says opacity doesn't pass from a parent to its children (TD § 7).
8. **Given** the proposal in #1, **When** the learner says no, **Then** the mentor offers Chip A,
   Chip B and Chip C once, and on a second no asks the learner to name the layers (TD § 4 step 4).
9. **Given** a comp whose only linked layers are one crowd of 5 or more, **When** the learner has no
   group in mind, **Then** the mentor proposes nothing, says in plain words that many layers sit
   close together so it can't tell which belong together, asks which 2 to 4 should move as one, and
   lists none of them (TD § 4 step 5).

---

### User Story 2 - A jump is caught on its own (Priority: P1)

I parent a layer the wrong way and it jumps. The mentor tells me which layer, how far and which
way, at a time I can find, without guessing why, and tells me where to look. It doesn't ask me to
animate the null until nothing has jumped.

**Why this priority**: the jump is the one failure a learner can't easily see on a long comp, and
it's the depth edge (Why). It must be right before the null's own move can confuse it.

**Independent Test**: on saved captures of a correct parenting (the children's raw Position values
rewritten) and of a jumped one, the check passes the first and fails the second with the layer,
distance and direction; with the null already keyed, the first still passes.

**Acceptance Scenarios**:

1. **Given** a correct parenting where Tile's raw Position key values changed but its footprint
   didn't, **When** checked, **Then** P2 and P3 pass (TD § 6; B9).
2. **Given** Stamp jumped 120 px left at the before-read time, **When** checked, **Then** the hint
   says "Stamp is 120 px left of where it was at 3.2 s" (real numbers), names no cause, and points
   to Edit > Undo (TD § 7).
3. **Given** the null is rotated 30° when the learner parents with a jump, **When** checked,
   **Then** the jump is caught on the corners even where the anchor point barely moved (S-1).
4. **Given** the learner keyed the null before the parenting check, **When** checked, **Then** the
   null's move doesn't read as a jump (S-3).
5. **Given** the learner moved the playhead since the focus was set, **When** checked, **Then** the
   check measures at the stored time, not the new one (S-2).

---

### User Story 3 - Review the skill in a later session (Priority: P2)

A day or more after I learned it, Knack names a new group on my comp ("Chip A, Chip B and Chip C
should move as one; set that up so you can move them together, then give them one move"), asks if
the group will turn or scale and from where, and checks the same way. It never says "null". (The
example is the live comp's review group, amended 2026-10-26 from the live sitting; it named Row A
to C.)

**Why this priority**: spec 004 H2 makes reviews for skills 5 and 6 stretch this sprint, but
plan.md says each skill's first build includes its review mode (`check-branch.mjs` flags a later
branch that edits the merged tool file), so it's built now and logged live if time allows.

**Independent Test**: with a saved record that says this skill was learned and is due, on a comp
with an unparented group not in the record, the review runs with no demonstration, no walkthrough
and no "null", checks with FR-010 to FR-016, and records a review.

**Acceptance Scenarios**:

1. **Given** a due review and a group by FR-005's rule (never a crowd) of unparented candidates not
   in the record for this skill on this comp (on Mentor Practice 2 as built, after the lesson's
   group: Chip A to C, L6-1; `practice2b.json` is now the live read of the comp as built, so it's
   Chip A to C there too, amended 2026-10-26 from the live sitting), **When** offered and accepted,
   **Then** the mentor names the layers and the task without the word "null", asks the
   turn-or-scale question, and gives no menu path and no mention of jumps (TD § 11).
2. **Given** the review's group is Chip A to C (#1, on Mentor Practice 2 as built) and the
   learner parents Chip B and Chip C to Chip A, **When** checked, **Then** it doesn't pass, the
   hint names what the check sees ("Chip B and Chip C follow Chip A, so anything you do to Chip A
   drags them along") and stops there; it's recorded as a review that didn't pass and the skill
   stays learned. (Amended 2026-10-26 from the live sitting: the live base is the comp as built, so
   the review's own group is Chip A to C, L6-1; it said Row A to C.)
2a. **Given** a review whose focus is Row A to C (set by name, as the unit tests set it on
   `review-rows-visible.json`, the answer key's "US3 #2" entry; a review proposes them only when
   FR-005 makes them its first group), **When** the learner parents Row B and Row C to Row A,
   **Then** the same as #2 with their names. This pins the hint on a group with a static member
   (Row B), not which group a review picks (added 2026-10-26 from the live sitting).
3. **Given** a due review and no unparented group on the comp (a crowd alone counts as none, TD
   § 11), **When** the session starts, **Then** no review is offered and it stays due.

---

### User Story 4 - Not ready for it (Priority: P2)

I ask for this lesson before I've learned the pivot. The mentor names that lesson and offers it
first; if I insist, it runs after one sentence, and if my null's pivot misses where I said, it
suggests the pivot lesson after this one.

**Independent Test**: with a record where `transform.anchor` isn't learned, the lesson names it
and offers it; on "go ahead", one sentence and the lesson runs (spec 004 FR-005).

**Acceptance Scenarios**:

1. **Given** skill 5 not learned, **When** the learner asks for skill 6, **Then** the mentor names
   skill 5 and offers it; on insistence, the TD § 3 sentence and no reteach.
2. **Given** skill 4 not learned (soft), **When** the lesson runs, **Then** it never blocks and no
   "trace this one first" hand-off fires (spec 004 FR-037).

---

### Edge Cases

The overlap rows are in **Edge cases where concepts overlap** below (the `/overlap-audit`
section). Other edge cases:

- **No group in the comp** (no cluster of 2 to 4 by FR-005, and the learner names none): with a
  crowd, the crowd question (FR-005a); with no crowd either, say so and ask the learner to make a
  small group to practice on (TD § 4 step 5). Never invent a grouping, and never trim a crowd to 4.
  In a review, either way: no review (TD § 11).
- **A group and a crowd on one comp** (Mentor Practice 2 as built): the group is proposed; the
  crowd's layers are never listed, and a learner may still name any of them (TD § 4).
- **The learner names 1 layer, or more than 4**: ask what else should move with it, or which 4 to
  start with (TD § 4).
- **Adding a null renumbers every layer below it.** Layers are matched by name, never by index, for
  the whole lesson (FR-019). A candidate whose name isn't unique in the comp: the mentor asks the
  learner to rename one before the focus is set (one sentence), never renames it itself, and the
  rename is never graded or counted as an other change (FR-004, TD § 14).
- **Two new nulls**, or the learner names an existing null: FR-007.
- **The lesson's null renamed** (stage 7 suggests a name): if its name is gone and exactly one null
  is the parent of every parented focus layer, that's the lesson's null; the mentor says it noticed
  the new name (FR-019).
- **A focus layer renamed or deleted mid-lesson**: the check says it can't find that layer by its
  old name and asks; it never guesses which layer it became.
- **The learner unparents a focus layer** after a pass at stage 5: P1 fails again at stage 6, named
  like any other.
- **AE busy or unreachable**: no check, no claim about the comp, pass on the fix (server rule 2).
- **Learner record unreadable**: the lesson runs; one sentence about the notes (spec 004 Edge
  Cases).

## Requirements *(mandatory)*

### Tools and files (spec 004 contract)

- **FR-001**: The skill MUST plug in only by adding the files in
  [skill-module.md](../004-ae-curriculum/contracts/skill-module.md) › 1: `mentor/tools/null-parenting.mjs`,
  `mentor/lib/null-parenting.mjs` (its own analysis and check), one demo snippet
  `mentor/jsx/null-parent-demo.jsx` and its fixture twin `mentor/fixture/null-parent-demo.mjs`,
  `mentor/test/null-parenting*.test.mjs`, `mentor/test/fixtures/null-parenting/` (captured live),
  and `.claude/skills/null-parenting-mentor/SKILL.md`; with record ID `parenting.null` and three
  tools, `null_parent_snapshot`, `null_parent_demo` and `null_parent_check`, behaving as that
  contract's › 3 says. It MUST NOT edit any existing file under `mentor/`, `bridge/`,
  `.claude/skills/*-mentor/`, `product/evals/` or `panel/` (spec 004 FR-032; `check-branch.mjs`).
  Anything more is a request (Dependencies › SR-1 to SR-3).
- **FR-002**: Every comp-space measure MUST come from `mentor/lib/comp-space.mjs`
  (`footprint`, `compPosition`, `compMatrix`, with `parent_transform`), every
  parent link and "what moves it" from `mentor/lib/motion-sources.mjs`, and every visibility
  decision from `mentor/lib/visibility.mjs` (spec 004 FR-013, FR-014). The skill sets its own
  tolerances (1 px, half a frame, FR-028's 10%) in its own file and MUST NOT copy or re-derive the
  matrix math, the parent chain or the class. No layer may be filtered by the eye switch alone.
- **FR-003**: `FINDERS["parenting.null"].focus(snapshot, { exclude })` MUST agree with the skill's
  own proposal (FR-005) on every fixture, with one exception (L6-2, approved 2026-10-25):
  - a **group** with the same `exclude`: `count` is the proposal's size and `layers` its names;
  - **no group but a crowd** (FR-005), and `exclude` empty: `count` is the largest crowd's size and
    `layers` is `[]`, so next-mentor can still suggest the skill (the lesson then asks, FR-005a) and
    never names a crowd's layers (TD § 4 step 5);
  - a crowd with a non-empty `exclude`, or with `for_review: true` (a review's question), counts 0,
    as a review never opens on a crowd (TD § 11). The gap H-6 named (a review on a comp with no past
    targets passing `exclude: []`, which looked like a lesson question) is **closed** by spec 004
    Phase 10 round 2, fix B (2026-10-28): the shared review test passes `for_review: true`;
  - neither: 0.

  This is the one place the finder and the snapshot tool differ, and only for a lesson; spec 004's
  skill-module contract › 2 ("must agree") holds for every other case. `review: true` MUST be set
  only once review mode passes its tests (contract › 2). On a snapshot without `layer_info`
  (`known: false`) or without the comp's width (SR-4), the count is 0: the skill can't place
  layers.

### Focus

- **FR-004 (candidates)**: Candidates MUST be built from `layer_info` (every layer, keyed or not),
  **not** from `layers` (keyed layers only), so a static logo part can be in a group. A candidate
  follows TD § 4's table, read from the visibility class and R1: class `renders` or `shy`, or a
  `matte` pair taken together; 2D (`three_d` false); no parent; not a null, guide, camera or light;
  not auto-oriented until L-4 settles it (TD § 9); and every one of its sample times sampled
  (`samples_truncated` false). A layer `hidden` by the learner is in only if the learner asks. A
  full-frame solid or adjustment layer is never proposed but allowed if picked. A layer that is
  itself the parent of another layer is a candidate; the mentor says once that its children come
  along. Each left-out reason gets the one sentence TD § 4 gives it. A crowd's layers (FR-005) are
  candidates, not left out: they're never in `left_out` and never listed (TD § 4). Each candidate
  carries its layer's kind (`layer_info.kind`), which FR-005's text-plus-graphic rank reads.
  **Unique names first** (TD § 14): a candidate whose name another layer in the comp shares can't
  be in the focus yet. The mentor asks the learner in one sentence, before the focus is agreed, to
  rename one ("two layers are both called Shape Layer 1; rename one so I can tell them apart"). The
  mentor never renames a layer (the demo is its only change), `null_parent_snapshot` refuses to set
  a focus while any focus name isn't unique in the comp, and the rename is never graded and never
  an other change (FR-021).
- **FR-005 (proposal; TD § 4 steps 1 to 3, § 15; amended 2026-10-25)**: The proposal is the
  tool's, deterministic and unit tested; the model only says it (FR-005a).
  1. **Link.** Two proposable candidates (bucket `default`, FR-004) link when their comp-space
     bounds at the before-read time overlap or **nearly touch**: a gap of at most **2% of the comp's
     width** on both axes (38.4 px at 1920; H-4). A matte pair is one unit of 2 that links when
     either member does. Layers that aren't proposable link nothing.
  2. **Clusters.** Every unit reachable through links is in one cluster. A cluster of **2 to 4**
     layers (a matte pair counts as 2 and is never split) is a **group**. A cluster of **5 or
     more** is a **crowd**: never proposed and never trimmed to 4. A unit that links to nothing is
     neither (a matte pair on its own is a group of 2).
  3. **Rank the groups**, first difference wins: (a) a group that has a text layer (`kind` `text`)
     and at least one layer of another kind ranks first; then (b) more layers; then (c) the group
     whose top layer is highest in the stack (lowest index). The first is `proposal`; the second is
     `next_proposal` (or `null` with one group), kept for a "no".
  4. **No group.** `proposal` and `next_proposal` are `null` and `no_proposal_reason` says why:
     `crowded` (at least one crowd), `no_group` (nothing links into a cluster of 2 or more),
     `no_comp_size` (SR-4) or `no_layer_info`.

  The old "largest group" and "past 4, keep growing in stack order" parts are gone (TD § 15).
  The same rule, with the review's `exclude` (FR-024), gives a review's target.
- **FR-005a (saying the proposal; TD § 4 steps 4 and 5, § 5 stage 1; added 2026-10-25)**: The
  skill prompt MUST ask first and propose only when the learner has no group in mind, then:
  - say `proposal` in one sentence **with its reason**, that the layers sit together apart from
    everything else ("Tile, Caption and Stamp sit together, apart from everything else. Want to move
    those as one?"; it names a place on screen only when a frame it showed says so, since the reply
    gives no positions);
  - after a "no", offer `next_proposal` **once** ("Or Chip A, Chip B and Chip C?"), and after a
    second "no", or with no `next_proposal`, ask the learner to name the layers. No third offer;
  - with `no_proposal_reason` `crowded`: propose nothing, say in plain words that many layers sit
    close together so it can't tell which belong together, and ask which 2 to 4 should move as one
    (TD § 4 step 5's line). It never lists, counts or names the crowd's layers;
  - with `no_group`: say so and ask the learner to make a small group to practice on (two shapes
    and a text layer); with `no_comp_size`: ask them to name the layers;
  - never pick a focus the learner didn't name or agree to. A focus reached by the proposal, the
    second group or the learner's own names is set the same way (FR-006).
- **FR-006 (focus set, the before read)**: The focus is 2 to 4 candidates, named by the learner or
  agreed from the proposal. The `null_parent_snapshot` call that sets it MUST start the lesson
  again from that call's read (`fresh: true`, allowed while no demo or check has run), so the
  lesson's baseline **is the before read**. Its `comp.time` is the **stored before-read time**,
  kept on the lesson and never replaced (TD § 6; S-2).
- **FR-007 (the lesson's null)**: At stage 3 the lesson's null is, in order: the null the learner
  names; else the one null that isn't in the before read; else, with several new nulls, the mentor
  asks which. An existing null with children or keys is allowed only if the learner picks it, with
  TD § 4's one sentence. Its name is stored on the lesson by the tool with `setSkillData()`, not
  by the model (SR-1), and only once no other layer in the comp has it (FR-019's rename ask, TD § 14
  D-3).
- **FR-008 (demo target)**: The demo target MUST be the first focus layer in stack order that
  renders, is 2D, isn't a matte or eye-off, **isn't locked** (the demo would refuse it, FR-017; S6,
  added 2026-10-25), and has no expression on a keyed Position, Scale or Rotation; one with its own
  transform keys is preferred over one without. None qualifies: no
  demo, and the mentor walks it through in words. There is no demo target until the null has
  passed N1 and N2 (TD § 4). **Reading (plan › Q1, approved 2026-10-24):** the analyzer sets the
  target from the focus when the lesson starts, and `null_parent_demo` refuses with `null_not_ready`
  until the tool has stored the null (it passed N1 and N2 at a check, FR-012).

### Pass

All of TD § 6, counting the demo layer.

- **FR-009 (the null, N1 to N3)**: The check MUST pass the null when it's class `null` (N1); 2D
  with no parent (N2; a null with a parent is handled below); and, only when a region was named, its anchor point in comp space is in that region of the
  **group's combined bounds** at the before-read time, using spec 004 FR-028's per-axis rule (10%
  of the group's width across, 10% of its height up and down) (N3, S-5). "It'll only slide" is a
  valid answer and skips N3 until FR-016. **The null's place is its anchor point** (for an
  unparented null, its Position), never the middle of its square: at 26.5 a new null's anchor is
  the square's top-left corner (L-1), so a square centred on the group's middle puts the anchor
  50 px up and left of it, and N3 reads that as missed (amended 2026-10-26 from the live sitting;
  the check already reads the anchor, and the stored null's anchor is (0, 0) in the tests,
  `4234c7e`).
  **A null with a parent** (N2, TD § 14): the parent **moves** when any layer above the null in its
  chain has `moves_children` true in the before read or the check read. Then the null is out of the
  lesson: the mentor says in one sentence that the null follows that layer, so the lesson can't
  check the group, and asks for a null with no parent (unparent it or add a new one). That isn't a
  fail, nothing is graded on it, and it's never recorded as a miss. When no layer above it moves,
  the parent gets the hint and, **if the learner says the chain is on purpose, N2 passes** and the
  mentor says once that it checks one level only (S-6; ask, don't fail), because FR-012 can measure
  it. "On purpose" (`chain_on_purpose`) counts **only as an answer to the `null_has_parent` hint
  for that same parent**, given at an earlier check: a `chain_on_purpose` with no such hint, or
  after the null's parent changed, is ignored and the hint is given (again) for the parent it has
  now; the answer is stored against that parent's name and lapses if the parent changes (S5, added
  2026-10-25). There's no stored-chain option (SR-2 declined), so a moving chain is never measured.
- **FR-010 (P1)**: Every focus layer's parent MUST be the lesson's null, read as the nearest entry
  of `sourcesOf(...).parents`. Only the Parent link counts: a layer that follows the null through an
  expression isn't parented.
- **FR-011 (P2, no jump; S-1)**: For each focus layer, at the stored before-read time **and** at
  each of its sample times, each of the **four corners** of its footprint in comp space MUST be
  within **1 pixel** (Euclidean) of the same corner in the before read. The times are the union of
  every key time on its Anchor Point, Position (or X and Y), Scale and Rotation in the before read,
  plus the before-read time (TD § 6). Each read asks for the before-read time through
  `takeSnapshot({ sample_times })` (W1). Before and after use the same rectangle kind (`rect`), so
  the stroke-or-letters question (spec 011's L-1) doesn't affect a jump. A time where either read
  can't give a footprint (a `reason` from the math) is reported as "couldn't check" and P2 doesn't
  pass on it; the mentor says what it couldn't see, never that the layer stayed put.
- **FR-012 (the stored null; S-3, D-1)**: P2's after-parenting footprint MUST compose each child's
  own sampled values at each time **through the null as stored** (`parent_transform`), never
  through the null's current transform. The stored null is the null's sampled anchor, position,
  scale and rotation **at the before-read time**, taken from the first check that passes N1 and N2
  and **taken again at every later check, and at the demo's fresh read, while no focus layer is
  parented to the null yet**; P2 uses the last one stored before any focus layer was parented (TD
  § 14 D-1). So a null moved after it was placed but before parenting never reads as a jump. The
  one case left (the null re-placed and focus layers parented with no check in between) gets TD
  § 7's jump hint, which names a moved null. **When nothing is stored yet** (a review, or a lesson
  where the learner parented before any check passed N1 and N2), the first check that sees the
  lesson's null passing N1 and N2 stores it, even with focus layers already parented, from that
  read's sample at the before-read time (so an already-keyed null gives its value there; TD § 11,
  S-3; S6, the lesson case added 2026-10-25). Until something is stored, P2 for a layer parented to
  the null is "couldn't check" (`not_stored`), never a pass. The tool code stores it on the lesson with `setSkillData()`
  (SR-1); the model never supplies it. For a null with a parent that doesn't move (FR-009), the
  stored null is its own transform only, and the layers above it come from each read's samples
  (W6: `parent_transform` replaces the direct parent only). A null whose chain moves never reaches
  P2 (FR-009).
- **FR-013 (P3, own animation kept)**: Each focus layer's key count and key times on every keyed
  property (transform, effects and others; separated X and Y counted apart) MUST match the before
  read within half a frame. Raw key values MUST NOT be compared (B9).
- **FR-014 (the order of checks)**: The stage 5 check grades N1 to N3 and P1 to P3 only; the mentor
  asks for the null's move only after it passes, so a jump is caught on its own (TD § 5). A null
  already keyed at stage 5 is fine and isn't mentioned as a problem (TD § 5, "If the learner keys
  the null early").
- **FR-015 (P4, the group's move; S-4)**: The null MUST have at least two keys with different values
  on **Position, Scale or Rotation** (X or Y separately counts). Keys on Opacity or an effect don't
  count, and an expression with no keys doesn't count. A null whose only keys are on **Anchor
  Point** doesn't pass P4 and gets TD § 14 D-2's hint (FR-020); that's the only fail it causes, and
  Anchor Point keys next to a real move are fine.
- **FR-016 (P5)**: If the null's move includes Scale or Rotation, N3 MUST pass; if the learner
  skipped the region, the mentor asks for it before grading (S-5).
- **Never graded** (part of FR-016's section, not a requirement of its own): the null's ease, key type, name, timing against
  the children's own moves, and how far or which way it moves (TD § 6). The mentor MUST NOT state
  "1 pixel" as a target; it says "it stayed where it was" or "it moved 40 pixels to the right".

### Demonstration

- **FR-017**: `null_parent_demo` MUST make one change: parent the lesson's demo target to the
  lesson's null **with no jump**, once per lesson, never in a review (spec 004 FR-024, FR-021); the
  session refuses any other target before AE is touched. Before writing it MUST take one fresh read
  and refuse, changing nothing, if: the null hasn't been stored yet (`null_not_ready`, FR-008,
  checked before the read); the active comp isn't the lesson's; the null or the target isn't
  found by name; the null fails N1 or N2; the null's Scale is 0 on an axis at the current time
  (`null_scale_zero`: no parenting can keep the target still under it; plan › Q2, approved
  2026-10-24); the target already has a parent, is locked, or is 3D.
  The snippet repeats the lock and parent checks itself. After writing, the tool MUST measure its
  own result with FR-011 on a second read; if the target moved more than 1 px, it says so plainly
  and points to Edit > Undo, and never retries (TD B-7). One undo step; the reply says what changed
  and "Edit > Undo" (server rule 1). The demo's fresh read also refreshes the stored null while no focus layer is parented yet
  (FR-012).
- **FR-018 (credit and fixture twin)**: The check MUST credit the demo layer to the demo while it's
  still parented to the null and count it in P1 to P3; once the learner undoes it and parents it
  themselves, it's theirs (`markChecked(passed, { demoUndone })`). The fixture twin MUST reproduce
  the parenting on a saved snapshot by rewriting the target's keyed and sampled anchor, position,
  scale and rotation into the null's space with `toLayerSpace`, so evals run without After Effects
  and the twin's result passes FR-011 and FR-013.

### Checking the learner's attempt

- **FR-019**: `null_parent_check` MUST read a fresh snapshot (with the before-read time sampled)
  and compare it with the lesson's baseline, matching layers **by name** (adding a null renumbers
  them), and return per focus layer: its parent now, the worst corner distance and its direction
  at the worst time, the times it couldn't check, and its key counts and times before and now; and
  for the null: N1 to N3, P4, P5, and what its keys move. The skill prompt turns that into TD § 7's
  hints: name the layer, the distance and direction, the time, and where to look; never the fix and
  never a cause it can't see (spec 002 FR-008). The mentor never renames a layer. **A lesson null
  whose name another layer shares** (TD § 14 D-3): at the stage 3 check, before the null is stored,
  the check returns that the name isn't unique and grades nothing else on the null; the mentor
  asks in one sentence for the null just added to be renamed ("two layers are called Null 1;
  rename the one you just added so I can tell which is yours"). The learner renames it, never the
  mentor. The rename is never graded and never an other change (FR-021), and the tool stores no
  null (FR-007, FR-012) and runs no parenting check (P1 to P3) until the name is unique in the comp.
  The mentor never asks which layer is the null: the check matches by name, so the answer couldn't
  be used.
  **Every hint has a code** (S6, added 2026-10-25), so the prompt has a sentence for each and never
  improvises one: data-model › Check result lists them all, including `null_ready` (the null passed
  and nothing is parented yet: go on to parenting), `no_null` (no lesson null found), `not_a_null`
  (N1), `three_d` (N2, a 3D null), `not_parented` (a focus layer with no parent while others are
  parented), `own_keys_changed` (P3), `effect_move` (P4: only an effect moves on the null),
  `existing_null` (an existing null with children or keys, said once, TD § 4) and `other_comp` (the
  active comp isn't the lesson's: nothing graded, `markChecked` not called). The snapshot and demo
  replies' fields (`can_teach`, `focus_set`, `no_proposal_reason`, `next_proposal`,
  `duplicate_names`, `matte_added`, `null_ready`, `couldnt_check`) are in data-model too.
- **FR-020 (comments, never graded)**: After a pass, one sentence each only when the read shows it:
  the null's move is linear; it's held (asked, as a question); it overlaps a focus layer's own
  Position, Scale or Rotation keys in time (stacked motion, from the map's `own_keys` and the
  null's key times); the null still has a default name ("Null" and a number: AE carries the number
  on from the project's other nulls, so it's often not 1, L-1; amended 2026-10-26 from the live
  sitting); the null's scale
  isn't uniform; the null's scale is 0 on a dimension at a key; the null's opacity is **keyed, or
  set between 0 and 100 (exclusive)**, while a child's isn't, and a null's static Opacity of 0
  never counts (amended 2026-10-26 from the live sitting: AE 26.5 makes every new null at
  Opacity 0, L-1, so the old "below 100" gave every passing lesson the fade sentence; the check
  already does this, `6039c78`); an effect on the null (only when `effect_count` or a keyed
  effect shows one). The non-uniform scale, zero scale, opacity and effect sentences also show
  before a pass when they explain a failure (TD § 7), and so does one more: when the null's only
  keys are on Anchor Point, TD § 14 D-2's hint (its keys move its pivot, not the null, so the group
  drifts the opposite way; the group's move goes on the null's Position, Scale or Rotation;
  overlap row 26). Worded for a learner who may not have met
  easing (TD § 3).
- **FR-021 (other changes)**: The check MUST report, as other changes and not graded, from the raw
  keys and `layer_info` of every layer (not from the focus filter): a layer outside the focus that's
  now parented to the null, or whose parent changed; keys added, moved or removed outside the
  focus; an expression turned on or off on a keyed property; a layer added or deleted (the null
  aside). A rename the mentor asked for is never one: a focus layer's (FR-004) happens before the
  focus is set, so it's already in the before read; the null's (FR-019) is a rename of a layer
  added after the before read, which is never an other change anyway. A visible layer's children brought along by the null (FR-004) are named once, not as a
  fault.
- **FR-022 (frames)**: Frame claims follow TD § 5: where layers are on screen in a frame, never how
  far along their own move they are; for the demo, a frame at the before-read time; at stage 6,
  frames at the null's first and last key times. The mentor uses `preview_frame` only, no
  `after-effects` bridge tool and no open-ended script. It never says an eye-off layer is visible
  in a frame.

### Lesson, version and record

- **FR-023 (stages and version)**: The skill prompt MUST follow TD § 5's stages and spec 004
  FR-025's server rules. Version (spec 004 FR-030; TD § 10): name Layer > New > Null Object (no
  shortcut); name the Parent column, and say how to show it (right-click a column heading,
  Columns, Parent & Link) **only when the learner can't find it**: they say so, or a check finds no
  parent and they say they looked (TD § 16; amended 2026-10-28); never Shift+F4; say "the pick whip
  in the Parent column"; never describe the null's size or Opacity, and its anchor only as TD § 14
  D-4 says (one sentence, after the learner names a place, before they drag; TD § 16 turn 3);
  never teach Option or Shift while parenting, and never mention Quick Offset, until L-1 has
  logged each at 26.5. The missing-prerequisite behaviour is TD § 3 and spec
  004 FR-005.
  **L-1's notes (amended 2026-10-26 from the live sitting):**
  - *Logged at 26.5:* the column reads "Parent & Link"; the Parent pick whip's tooltip reads
    "Parent pick whip (select layer from which to inherit transforms)". A new null is a 100 × 100
    square at the comp's center, at the top of the stack, with its **anchor at the square's
    top-left corner, on its Position** (so the null's place is that corner, not the square's
    middle; FR-009), **Opacity 0** (FR-020), and the name "Null N", where N carries on from the
    project's other nulls (Null 12, 13 and 41 in the sitting), 1 only in a project with no nulls.
    The prompt uses the null's name from the tools, never an assumed "Null 1".
  - *Option and Shift, a caution only:* holding Option while parenting keeps the child's raw
    values and only sets the parent, so the child jumps by the null's place (off the comp in the
    sitting); holding Shift rewrites the child's Position keys so its first key sits on the null,
    so it snaps onto the null. Both undo as one step under the same label as a plain parent. The
    only mention of a held key is **the jump hint's one question**, once per lesson, after a jump
    (TD § 7's jump row, § 8; narrowed 2026-10-28, TD § 16: no up-front warning). The
    "two pick whips, not the one beside Position" line likewise comes only through its hint
    (`pickwhip_position`, TD § 7). The prompt MUST NOT suggest either key, name either as the
    cause, or teach them as a technique (TD § 8, § 10). P1 to P3
    catch both jumps as they are; nothing in the check changes.
  - *Still out:* **Quick Offset** wasn't logged at L-1, so it stays out of the lesson.
  - *Open:* whether the mentor may tell the learner where the null's anchor sits (TD § 10 says the
    mentor doesn't describe the null's defaults) is the designer's call: Open questions › D-4.
- **FR-023a (pacing; added 2026-10-28, S-7)**: The skill prompt MUST follow the shared pacing rule
  (spec 004 [curriculum.md](../004-ae-curriculum/curriculum.md) § 2) as TD § 16 applies it: every
  turn ends on one action or one answer; a fact comes in the turn the learner acts on it, or only
  on request (TD § 16 › What moved, what's on request, what goes); a question or a request in place
  of the pending action gets its answer in one or two sentences and the same pending action again
  in one sentence, never the next stage's content and never the walk-through again (so after the
  demo, the rest is handed back in one sentence). After a "do it for me" refusal, the one demo offer
  is still made once if it hasn't been made yet, never a second time (the human's answer of
  2026-10-28, as for the pivot's watch offer in spec 011 FR-008). TD § 16's turn sequence governs where it groups
  things differently from § 5's stages; the opening, the proposal turns, the hints, the comments,
  the record and the review don't change. The words are TD § 16's, not copied here.
  *Checked by:* R-ONE-IDEA with TD § 16's reading (Eval plan › Pacing), on cases 02, 03, 04, 15 and
  23 with `--repeat 3`, then the full set (tasks.md T345 to T347).
- **FR-024 (review)**: `null_parent_snapshot` with `mode: "review"` MUST drop every layer in the
  record's past targets for this skill on this comp and project, and every layer already parented,
  before proposing by FR-005; its target is FR-005's first group, never a crowd and never
  `next_proposal` (a review names its task, so it can't open with a question about which layers
  belong together, TD § 11). No group left, including a comp with only a crowd, returns
  `no_new_target` and no review is offered. A review MUST
  name the layers and the task **without the word "null"**, ask whether the group will turn or
  scale and from where, and give no demo, walkthrough, menu path or mention of jumps (TD § 11). Its
  before read is the read when the task is given; its stored null is FR-012's review case. A review
  that doesn't pass gets TD § 7's hints, none of which says "null" or "use a null"; it's recorded as
  a review that didn't pass, and "learned" stays (spec 004 FR-019 to FR-021). "I already know it"
  runs the same way.
- **FR-025 (record)**: `record_lesson` MUST be called as spec 004's shared-tools contract says, with
  no new input fields. In plain words (TD § 12): `attempted` names the focus layers, the null and
  the move; `summary` says what the checks showed, including a jump and its distance, a move on
  Opacity, or "said the group only slides"; one `next`. Targets are stored as `{ layer, property:
  "Parent" }` per focus layer, so a review can find a new group. No pixel tolerances, no method
  (which pick whip, which key held), no motive, no names (spec 004 FR-022).

### Tests and evals

- **FR-026**: Each row of the overlap table below MUST have a unit test on a saved snapshot with an
  answer key, captured live where a comp has the case (Mentor Practice, Mentor Practice 2 with its
  wave B layers, Mentor Overlaps) and synthetic only where no capture exists, marked as such (spec
  004 FR-012, FR-034). The captures the skill builder adds in its own fixtures folder are listed in
  Live checks (L-2, L-3, L-5).
- **FR-027**: P2 MUST be unit tested on: the compensated parenting capture (spec 004 T135's
  `practice2b-parented.json`) passing; a jumped capture failing with the right layer, distance and
  direction; a null at Scale 150 and Rotation 30 where a jump moves the corners more than 1 px while
  the anchor moves less (S-1); a null keyed after parenting passing; and a playhead moved after the
  before read passing (S-2).
- **FR-028**: The eval engineer's cases (Eval plan) MUST run on saved snapshots without After
  Effects, and the easing set MUST stay at 25/25 or within one case after this skill merges (spec
  004 FR-035).

### Key Entities

- **Focus**: 2 to 4 layers, by name, and the matte pairs among them.
- **Before read**: the lesson's baseline, taken when the focus is set; its stored time.
- **Lesson's null**: its name, the region the learner named (or "only slides"), and the stored
  null (its transform at the before-read time, FR-012), kept as the lesson's `skill_data` (SR-1).
- **Demo target**: one focus layer (FR-008), or none.
- **Check result**: per focus layer, its parent, worst corner distance, direction and time, times
  not checked, key counts and times; for the null, N1 to N3, P4, P5; comments; other changes.

## Edge cases where concepts overlap (`/overlap-audit`, spec 004 FR-034)

Run 2026-10-23 against the snapshot code (`mentor/jsx/snapshot.jsx`), `mentor/lib/session.mjs`,
`mentor/lib/diff.mjs`, and the wave B contracts (`layer-info`, `comp-space`, `visibility`,
`motion-sources` in spec 004 data-model › Wave B shapes). Wave B's code isn't built yet, so rows
marked **contract** are checked against the data model and MUST be re-confirmed in the unit tests.
TD § 9 is the source for what each row must see; this table adds what the focus, the check and the
learner each see, and the reused filters.

**Filters used by more than one job:**

1. **The snapshot's keyed-layers list (`layers`)** decides what easing and skills 1 to 3 **teach**.
   It skips every layer with no keys, so reusing it for this skill's **candidates** would drop a
   static member of a group, and reusing it for **other changes** would miss a static layer newly
   parented. FR-004 and FR-021 read `layer_info` instead.
2. **The eye switch (`enabled`)** is easing's demo filter and wave A's hidden test. Here the class
   decides candidates (a matte is in, with its pair; a hidden null still carries children), and the
   eye switch alone decides only the demo target (an eye-off layer is never shown in a frame).
3. **The session's `focus_layers`, `targets` and `demo_target`** are keyed on layer names (for this
   skill) and fixed from the baseline. Because adding a null renumbers layers, every lookup is by
   name (FR-019); nothing reads an index from the baseline against a later read.
4. **`parent_transform` (W6)** replaces only the direct parent. Right for an unparented null; wrong
   for a null with a moving parent, where it would read the grandparent's motion as a jump. FR-009
   takes such a null out of the lesson (SR-2, a stored chain, was declined).
5. **Easing's `unexpectedChanges()`** is keyed on easing pairs and never reports a parent change.
   This skill writes its own other-changes list (FR-021).
6. **"Moves" for P4 vs. "moves children" in the map.** The map's `moves_children` counts Anchor
   Point keys; P4 counts Position, Scale or Rotation only (S-4). An Anchor Point-only animation on
   the null swings its children but isn't the lesson's move: the check names it (row 26) and P4
   doesn't pass on it.

| # | Overlap | Focus sees | Check sees | Learner is told | Right? / test |
|---|---|---|---|---|---|
| 1 | Expression on a child's keyed Position, Scale or Rotation | Candidate; not the demo target (FR-008) | P2 uses rendered values, so a jump it causes shows; P3 on keys | Jump plus the expression, one sentence | Right. Test: Mentor Practice's Logo (Rotation) as a focus layer |
| 2 | Expression on an unkeyed child property | Not read (R2; map says `not_read`) | Rendered values in `layer_info` still show a jump | The jump; that it can't see expressions on unkeyed properties yet | Right (blind spot stated). Test on Mentor Overlaps' Drift |
| 3 | Pick-whip link on Position instead of a parent | n/a | P1 fails (`parent` is the Parent link only); P2 sees the snap in rendered values; an expression flag appears only on a keyed Position | TD § 7's two-pick-whips hint | Right. Live capture L-3 (keyed and unkeyed) |
| 4 | Expression on the null's Position (a float) | n/a | P4 on keys only; the stored null read after expressions | That a move needs keys | Right. Synthetic test (**contract**) |
| 5 | Single key on a child | Candidate | P3: count 1 at that time; P2 at that time | Nothing | Right. Test |
| 6 | Hold keys on a child | Candidate | Same times before and after, so its own hold jump can't read as a parenting jump | Nothing | Right but surprising; pin with a test |
| 7 | Single key on the null | n/a | P4 fails | "holds still" | Right. Test |
| 8 | Hold keys on the null | n/a | P4 passes; stage 7 asks once | The question | Right. Test |
| 9 | Separated dimensions on a child (Stamp) | Candidate | P2 samples assembled X and Y at the union of their key times; P3 counts X and Y apart | | Right if W1 assembles position (T104). Test on 2b's Stamp |
| 10 | Separated dimensions on the null | n/a | P4: X or Y moving counts | | Right. Synthetic test |
| 11 | Effects on a child | Candidate | Effect keys count in P3; not moved by parenting | | Right. Test |
| 12 | Effects on the null | n/a | P4 never passes on them; comment only if `effect_count` or a keyed effect shows one | TD § 7's effects row | Right; `effect_count` is W4's optional field. Test |
| 13 | Precomp layer as a child | Candidate as one layer | Its own transform and rect (the precomp's frame) | "I can't see inside Icon, but it moves as a whole" | Right. Test on Mentor Practice's Icon |
| 14 | A layer inside a precomp | Not in `layer_info` (active comp only) | Not read | Not offered | Right. Test: `sourcesOf()` is `null` |
| 15 | Hidden null (eye off), or a null at Opacity 0 (every new null at 26.5, L-1; amended 2026-10-26 from the live sitting) | Class `null` | Carries children; N1 passes. The class, candidates, the demo target and frames never read Opacity, so 0 isn't "hidden" | Never "you've hidden this" | Right. Test on Mentor Overlaps' Rig, and on the live null at Opacity 0 (`null-center.json`, `6039c78`) |
| 16 | Eye-off child (hidden by the learner) | Only if asked; never the demo | P2 from bounds, not pixels | Never claimed visible in a frame | Right. Test |
| 17 | Matte and its layer (Gradient, Reveal Matte) | Proposed together, counted as 2; never the demo | Both graded P1 to P3 | Never "hidden" (KD-001) | Right with FR-004 and FR-005. Test on 2b |
| 18 | Shy child or shy null | Candidate; renders | As usual | One sentence: hidden in the timeline | Right. Test on Mentor Overlaps' Shy Parent |
| 19 | Guide layer | Not a candidate | Not graded | | Right. Test |
| 20 | Solo on another layer | Class unchanged (`soloed_elsewhere`) | As usual | Never "hidden" | Right. Test on `overlaps-solo.json` |
| 21 | Non-uniform null scale | n/a | P2's corners catch any on-screen move at parenting; comment (FR-020) | One sentence, never a fail | Right. Synthetic test plus L-2 |
| 22 | Null opacity keyed, or set between 0 and 100 (amended 2026-10-26 from the live sitting: a new null reads Opacity 0 at 26.5, L-1, so a static 0 on a null is AE's default and never a fade) | n/a | Never affects N or P except P4 not passing on it | TD § 7's fade hint (FR-020); nothing at a static 0 | Right. Test: `fade-null.json` (keyed) gives the hint; the live null at 0 gives none, at 60 does (`6039c78`) |
| 23 | The null has a parent | n/a | Parent moves: out of the lesson, nothing graded or recorded as a miss. Parent still: N2 asks; on purpose passes, measured through `parent_transform` (FR-009, FR-012) | Moving: one sentence, use a null with no parent. Still: one level only | **Gap fixed by FR-009** (filter 4). Synthetic tests: a still parent passes with no false jump; a moving one is refused and nothing is recorded |
| 24 | Focus layer already parented (Title under CTRL; Shadow under Plate) | Not a candidate | Not graded | TD § 4's sentences | Right. Test on Mentor Practice and 2b |
| 25 | 3D null or 3D child | Not a candidate; N2 says 3D is a later topic | Math returns `three_d`, never run | "3D layers are a later topic" | Right. Test on Mentor Overlaps' Depth |
| 26 | Anchor Point keys on the null only | n/a | `moves_children` true, but P4 doesn't pass | That the null's anchor moving swings the group, and that the move goes on Position, Scale or Rotation | Right with filter 6. Synthetic test |
| 27 | Auto-orient on a child | Left out until L-4 (T158) | Math returns `auto_orient` | One sentence | Right. Test on Mentor Overlaps' Orbit |
| 28 | Stacked parent and child motion (DX-08) | n/a | Comment when the null's keys overlap a child's own transform keys in time | One ungraded sentence; FR-037 hand-off only if skill 4 is learned | Right. Test |
| 29 | Children of a moving parent (offset's blind spot) | The map lists the null as each child's source | No timing graded between children | Nothing about staggering | Right. Test that no stagger wording appears (eval) |
| 30 | Null dragged after parenting, or keyed early | n/a | Measured through the stored null (FR-012), so not a jump | The null doing its job | Right. FR-027's tests |
| 31 | Null re-placed between stage 3 and parenting | n/a | Re-stored at every check before parenting (FR-012, D-1), so no false jump when a check ran in between; with none in between, a false jump is possible | TD § 7's jump hint, which names a moved null | Right. Synthetic tests for both |
| 32 | Playhead moved between checks | n/a | Stored before-read time (FR-006) | Nothing | Right. FR-027's test |
| 33 | Adding the null renumbers layers | n/a | Name matching (FR-019) | Nothing | **Gap fixed by FR-019**: index matching would compare the wrong layers. Live capture L-5 |
| 34 | A child whose rect changes over time (text, animated shape) | Candidate | Same times before and after, same rect kind | | Right. Test on 2b's Caption |
| 35 | A child outside its in and out points at a sampled time | Candidate | Transform still sampled; P2 still measured | Frames never claim it's on screen there | Right. Synthetic test |
| 36 | More than 64 sample times | Not a candidate (`samples_truncated`) | n/a | One sentence | Right. Synthetic test |
| 37 | A candidate that parents other layers (Plate) | Candidate | Its children move with it and the null; named once as other changes | "Shadow follows Plate, so it'll come along" | Right with FR-021. Test on 2b |
| 38 | A layer outside the focus parented to the null | n/a | Other change (FR-021) | Named, not graded | **Gap fixed by FR-021** (easing's list doesn't see parents). Test |
| 39 | The demo undone, then parented by the learner | n/a | Theirs (FR-018) | | Right. Test |
| 40 | The lesson's null shares its name with another layer (amended 2026-10-26 from the live sitting: AE 26.5 carries a new null's number on from the project's other nulls, L-1, so AE's own naming rarely repeats one in a comp; a shared name comes another way, a rename for one, and the row stays) | n/a | Name not unique: nothing stored, N1 to N3 and P1 to P3 not run; the rename isn't graded or an other change | One sentence: rename the null just added (TD § 14 D-3); never "which one is it?" | **Gap fixed by FR-019** (filter 3: name matching can't tell two layers of one name apart). Synthetic test: two nulls named "Null 1", then the renamed capture stores the null and checks |

## Live checks (builder, needs After Effects; not guesses)

Run under the AE lock (`decisions/008`) on Mentor Practice 2 with its wave B layers, after spec 004
T135. Results go in the hand-back and the skill's fixture README.

- **L-1 (TD B-4)**: at 26.5 on macOS 27.0.1, the null's defaults (size, anchor, how it draws);
  whether holding Option or Shift while parenting moves the child; the Parent & Link column's name
  and the two pick-whip columns' labels. Until logged, FR-023 keeps all of it out of the lesson.
- **L-2 (curriculum B9, TD B-2)**: spec 004 T135 logs whether parenting a keyed child to an
  unscaled, unrotated null rewrites its raw Position key values. This skill adds the case T135
  doesn't: a null at Scale 150 and Rotation 30, parented with the pick whip, captured as
  `mentor/test/fixtures/null-parenting/parented-rot.json`; log whether Scale and Rotation key values
  were rewritten too. The design doesn't depend on the answer (P2 compares footprints, P3 key counts
  and times); the answer pins FR-027's test and the B9 eval case.
- **L-3 (TD B-7, § 7)**: the demo snippet on Tile: setting the parent in a script keeps its place
  (FR-011 passes on a second read) and is one Edit > Undo; a parenting that jumps (the pick whip
  dragged from Position, keyed and unkeyed, and, if L-1 shows it, Option or Shift) captured as
  `jumped.json` and `pickwhip-position.json` for FR-027.
- **L-4 (TD B-6, spec 004 T158)**: whether the rotation read includes auto-orient. Until the shared
  owner acts on it, auto-oriented layers stay out of the focus (FR-004).
- **L-5 (new)**: adding a null with Layer > New > Null Object renumbers the layers below it, and a
  capture before and after shows name matching finds every focus layer (row 33).
- **L-6 (new; amended 2026-10-25)**: on Mentor Practice 2 as built (wave A's layers and wave B's),
  FR-005's rule proposes Tile, Caption and Stamp, keeps Chip A to C as `next_proposal`, and treats
  wave A's 13 close layers as a crowd it doesn't propose or list; on `practice2b.json` (wave B
  only) it still proposes Tile, Caption and Stamp. The first run (the builder and the reviewer,
  2026-10-25) found the old largest-group rule chained wave A's layers into one 13-layer group;
  the human chose to change **the rule, not the layout** (TD § 15), because a learner's real comp
  is crowded the same way. If the live read still doesn't give TD § 15's table, it goes back to
  the curriculum designer as a rule question; the practice comp's layers aren't moved.

**Results (amended 2026-10-26 from the live sitting,
[live-sitting-2026-10-26.md](live-sitting-2026-10-26.md)):** nothing found changes a requirement;
the facts below change how FR-009, FR-020, FR-023 and rows 15, 22 and 40 are worded.

- **L-1**: logged; the facts are in FR-023's notes (the null's square, anchor top-left on its
  Position, Opacity 0, "Null N"; "Parent & Link"; Option keeps raw values and jumps, Shift snaps
  onto the null, both one undo). Quick Offset not logged.
- **L-2**: Position, Scale and the unkeyed Rotation were all rewritten (Scale ÷ 1.5, Rotation
  −30°); key times and counts unchanged; footprints within 0.001 px. SC-006 on
  `parented-rot.json` passes.
- **L-3**: the demo moved Tile 0 px, one Edit > Undo ("Undo AE Mentor: null-parent-demo"); no
  snippet fix. The Position pick whip, unkeyed and keyed, reads as an expression on Position with
  no parent, so row 3's hint fires either way (`pickwhip-position-hand.json`,
  `pickwhip-position-keyed-hand.json`).
- **L-4**: answered by spec 004 T158 (rotation read excludes auto-orient); auto-oriented layers
  stay out (FR-004).
- **L-5**: passes; every focus layer found by name after the renumbering.
- **L-6**: passes; TD § 15's table on the live comp. Spec 004's live `practice2b.json` is the
  comp as built (wave A included), so there's no wave-B-only read any more: L-6's
  `practice2b.json` half and the stand-in `practice2b-with-wave-a.json` are the same live file.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A live lesson on Mentor Practice 2 as built (wave A's layers and wave B's), started
  with no group in mind so the tool proposes Tile, Caption and Stamp with its reason (TD § 15),
  reaches a verified pass in **15 minutes or less** with **at most one demonstration**. Whether the
  learner accepted the proposal, took the second group or named their own is logged (L6-3's first
  evidence for the text-plus-graphic Guess). *Measured by:* the builder, usage notes, timings from
  the call log (spec 004 SC-001).
- **SC-002**: The jump check agrees with a look in After Effects (each focus layer scrubbed at its
  key times, before and after parenting) in **at least 9 of 10** checks across the live runs, and
  in **every** check of a deliberate jump. *Measured by:* the builder, usage notes (spec 004
  SC-002).
- **SC-003**: The eval cases pass **at least 80%**, with **every hard-rule check passing**, on **at
  least 12 cases** (Eval plan). *Measured by:* eval runs.
- **SC-004**: In every review eval case, the mentor says "null" **0 times** before a pass.
  *Measured by:* a deterministic check on the review cases.
- **SC-005**: Every overlap row and FR-027's P2 cases pass their unit tests: **100%**. *Measured
  by:* `npm test`.
- **SC-006**: A correct parenting whose raw child values changed **never** fails (0 false jumps on
  `practice2b-parented.json` and `parented-rot.json`). *Measured by:* unit tests on the live
  captures.
- **SC-007**: The easing set stays at **25/25 or within one case** with no hard-rule failure after
  the merge. *Measured by:* an eval run logged with the merge.
- **SC-008**: The skill's branch changes **0 existing shared files** (FR-001). *Measured by:*
  `check-branch.mjs` and `/merge-worktree` notes.
- **SC-009 (stretch, spec 004 H2)**: one live review at least one day after the first pass, logged
  with the check agreeing with After Effects. *Measured by:* the builder, usage notes.

## Eval plan (cases the eval engineer writes and numbers)

The eval engineer owns the cases, their numbers and fixtures; this lists what must be covered (TD
§ 13 E, spec 004's skill 6 case). Unit tests cover the measures (FR-026, FR-027); evals score the
teaching.

**Pacing: R-ONE-IDEA's reading (2026-10-28, TD § 16, FR-023a):** the reading is TD § 16 › What
R-ONE-IDEA should see, not restated here. In short: the explanation turn passes as the frame, the
confirmed group, the idea sentence and the turn-or-scale question, and a second explanatory
sentence (why a null, an example rig) fails it; the add-the-null turn is one task (menu path, the
never-renders sentence, the corner sentence), and a second ask fails it; the parenting turn's demo
offer is that action's alternative. Cases 02, 03, 04, 15 and 23 are re-run as they are.

1. **First lesson** on Mentor Practice 2 as built (the stand-in `practice2b-with-wave-a.json`'s
   layout, then its live capture; TD § 15): asks first; with no group in mind, proposes Tile, Caption and Stamp in one sentence with its reason
   (apart from everything else); names what's left out for the table's reasons (Shadow under
   Plate); never lists wave A's crowd; never calls the matte "hidden"; real names (US1 #1).
2. **Explain** on the focus group's frame: position, scale and rotation, not opacity or effects,
   as one sentence; CTRL or another rig only if the learner asks for an example (amended
   2026-10-28, US1 #2). What's tested is unchanged (TD § 16).
3. **Pivot question**: asked at the end of the explanation turn (TD § 16), never picked for the
   learner; "it'll only slide" accepted.
4. **Demonstration**: one parenting on the demo target, "moved 0 pixels" in plain words; none
   before the null passes.
5. **Riskiest overlap, B9**: a correct parenting where the child's raw Position values changed
   passes (spec 004's skill 6 case).
6. **Jump**: distance, direction and time, no cause, Edit > Undo.
7. **Pick whip from Position**: not counted as a parent; the Parent column named.
8. **Null keyed before the parenting check**: P2 still passes, nothing asked to be undone.
9. **Fade instead of move**: P4 fails with the opacity hint.
10. **Visible parent**: the hint names who drags whom.
11. **Comments**: linear move, held move (asked), stacked motion, default name; never graded.
12. **Version trap** (spec 004 FR-030): no Shift+F4, no null defaults, no Option/Shift parenting
    before L-1; the menu path for Null Object. After L-1 (amended 2026-10-26 from the live
    sitting): never suggests holding Option or Shift and never names a held key as the cause (one
    question in the jumped hint is fine, FR-023); never Quick Offset; uses the null's real name
    from the tools, not an assumed "Null 1"; the null's defaults only as D-4 settles.
13. **Missing prerequisite**: skill 5 not learned; named and offered; on insistence one sentence.
14. **Incomplete attempt**: names what's still off and where; doesn't fix or offer to.
15. **"Do the rest"**: declined warmly, and the one demo offer is still made once if it hasn't been
    made yet (never a second time; amended 2026-10-28, FR-023a).
16. **Review**: due, new group, no "null", turn-or-scale question, no demo (SC-004).
17. **Review, visible parent**: fails without "null" in the hint; skill stays learned.
18. **Review with no new group**: not offered, stays due.
19. **Second group** (added 2026-10-25): the learner says no to Tile, Caption and Stamp; Chip A to C
    offered once; a second no gets "which layers?", and no third offer (US1 #8, FR-005a).
20. **Crowd only** (added 2026-10-25): a comp whose linked layers form one crowd; no proposal, the
    plain-words crowd question, no layer of the crowd named or counted (US1 #9, FR-005a).

Plus spec 004's cross-skill cases that touch this skill (plain speech on every case; cross-skill
case 3, the matte, KD-001).

## Assumptions

- **Learner:** the builder on After Effects 26.5 on macOS 27.0.1 (CLAUDE.md › My setup); R0 is still
  read each session.
- **Wave B's shared pass is merged first** (spec 004 tasks-wave-b.md T100 to T163, including W1's
  sampled read, W4, W5, W6, T157's 2b targets as amended by T163 (SR-3), and T161 and T162
  (SR-1)), and its T136 live answer keys
  pass. This skill builds on them and is blocked until they land.
- **Mentor Practice is unchanged**; its CTRL group is an example only when the learner asks for one
  (TD § 16). The lesson and the
  review targets are on Mentor Practice 2's wave B layers (spec 004 FR-031).
- **Layer names in a lesson are unique**: the focus by FR-004's rename ask, the null by FR-019's
  rename ask (D-3); a stable layer id isn't read in wave B.
- **The proposal rule's numbers are Guesses** (TD § 13, § 15; H-4, amended 2026-10-25): 2% of the
  comp's width for "nearly touch", the cut between a group (2 to 4) and a crowd (5 or more), and
  ranking a text-plus-graphic group first. Checked on Mentor Practice 2 as built (L-6); the first
  logged lesson where a learner without a group accepts or rejects the proposal is the first
  evidence for the text preference (L6-3, SC-001).

## Out of scope (build scope)

- What TD § 8 doesn't teach: chains deeper than one, rigs, expression links, 3D layers and nulls,
  cameras and lights, stacked motion as a timing problem, unparenting variants, opacity for a group
  (precomps), easing the null as a graded step, Collapse Transformations, Essential Properties.
- **Grading** anything TD § 6 lists as not graded.
- **A demo that does more** than parent one layer (no null creation, no placement, no keys on the
  null).
- **Reading expressions on unkeyed properties** (R2, wave D) and inside precomps (R4).
- **Stable layer ids** (duplicate names are asked to be renamed instead).
- **Panel screens** for this skill (spec 007).
- **Any change to shared files** (FR-001): requests only (SR-1 and SR-3, approved).
- **A lesson null under a moving parent** (SR-2 declined this sprint): refused in one sentence
  (FR-009), never measured.

## Open questions

### For the human (H): answered 2026-10-23

1. **H-1, spec 004 FR-029 vs. this spec.** Approved: FR-029 keeps only the 1 px measure and "never
   compare raw key values" and points to FR-011 to FR-013 here. Made in spec 004 the same day.
2. **H-2, SR-1 and SR-2.** SR-1 approved (tasks-wave-b.md T161, T162). **SR-2 declined** this
   sprint, going with the designer (TD § 14): a lesson null whose parent moves is refused in one
   sentence and not recorded as a miss (FR-009, FR-012).
3. **H-3, SR-3** (2b's layout). Approved (tasks-wave-b.md T163, amending T157).
4. **H-4, "nearly touch" = 2% of the comp's width** (FR-005). Approved; L-6 checks it on 2b.
   **Amended 2026-10-25:** L-6 found the largest-group rule chains wave A's layers; the human
   approved TD § 15's group-and-crowd rule word for word (FR-005, FR-005a), keeping the 2% link.
6. **L6-1, the review's next group on the live comp** (TD § 15). Answered 2026-10-25: Chip A to C,
   accepted with no extra tie-break (US3 #1; tasks-l6.md supersedes T343's "Row A to C").
7. **L6-2, the finder on a crowd-only comp** (TD § 15). Answered 2026-10-25: the finder counts a
   crowd for next-mentor only, so the skill can still be suggested (FR-003).

### For the human (H): open, from amendment 1

1. **H-6, a review question on a crowd-only comp with no past targets there.** `recommend_next`
   asks the finder the same way for a lesson and for a review whose past targets are on another
   comp (`exclude: []`), so FR-003 can't tell them apart: on such a comp it could offer a review
   that `null_parent_snapshot` then answers with `no_new_target`. **Recommended:** accept it for
   this sprint (the review step already says "nothing new to review" and records nothing, so the
   learner sees one offer withdrawn, not a wrong lesson), and log it as a shared-code request for
   spec 004's owner: `recommend_next` passes `{ review: true }` to a finder in its review step, so
   the crowd exception can be lesson-only exactly. That's a change to `mentor/lib/recommend.mjs`,
   which this skill can't make (FR-001). Related, same owner: next-mentor's prompt names
   `focus_layers`, which is `[]` for a crowd; it should then name the skill without layers.
   **Answered 2026-10-25: accepted for this sprint as recommended; the shared-code request goes
   to spec 004's next shared owner.** **The review-vs-lesson gap is closed (2026-10-28)** by spec 004
   Phase 10 round 2, fix B: the shared review test passes `for_review: true` and null's finder
   counts a crowd 0 then (FR-003). **Still open:** next-mentor naming the skill without layers when
   `focus_layers` is `[]`.
5. **H-5, the designer's H-1 and H-2** (TD § 13). Approved; this spec is written to them.

### For the curriculum designer (D)

1. **D-1, when the stored null is taken.** Answered (TD § 14): re-stored at every check, and at the
   demo, while no focus layer is parented (FR-012).
2. **D-2, a null animated only on Anchor Point.** Answered (TD § 14): P4 doesn't pass, with the
   designer's hint (FR-015, FR-020).
3. **D-3, the lesson's null shares its name with another layer.** Answered (TD § 14, 2026-10-23):
   the same one-sentence rename ask, for the null just added, at the stage 3 check; never graded,
   never done by the mentor; the null isn't stored until its name is unique (FR-007, FR-019,
   row 40). Folded in 2026-10-24.
4. **D-4, telling the learner where the null's anchor sits** (open; raised 2026-10-26 from the
   live sitting). TD § 10 says the mentor doesn't describe the null's defaults, and B-4 says "until
   then [L-1] the mentor says none of it". L-1 has now logged them: a new null's anchor is its
   square's **top-left corner**, on its Position. N3 measures the anchor, so a learner who centres
   the square on the group's middle puts the anchor 50 px up and left, which misses the middle on
   a group the size of Tile, Caption and Stamp (230 × 130 px: 10% is 23 px across). The skill
   prompt (`3864ac5`) already says the null's place is that corner when they drag it. Should
   § 10 let the mentor say so? **Recommended: yes, one sentence at stage 3**, when the learner
   places the null ("the null's pivot is the top-left corner of its square, so put that corner
   on the spot"), and in the `pivot_region` hint; never its size. If the designer says no, the
   prompt's sentence comes out and N3's misses are left to the existing hint. Also for § 10 and
   § 7's jump row: B-4 is answered (Option and Shift both jump; FR-023's notes), so "unverified"
   can go.
   **Answered 2026-10-26 (TD § 14 D-4): yes.** One sentence at stage 3, once per lesson, after the
   learner names a place and before they drag ("The null's pivot is the top-left corner of its
   square, so put that corner on the spot"); not for "it'll only slide" (it goes with the
   `region_needed` question if that comes up). The lesson's `pivot_region` hint names the pivot by
   that corner (where, never why). Never the null's size or Opacity, and none of it in a review.
   **Still to fold in (spec writer):** ~~FR-023's "never describe the null's default size or
   anchor" becomes "never its size or Opacity; its anchor only as TD § 14 D-4 says"; "(TD § 7's
   jump row allows it once B-4 confirms)" becomes "(TD § 7's jump row)"~~ (folded in 2026-10-28,
   amendment 3); row 3 says an unkeyed pick whip is
   caught by where the child lands; new row 41, Option or Shift held while parenting (TD § 9).

### Settled here

- **S-1 to S-6** taken as recommended (header).
- **TD B-5** (R1 carries null, 3D, kind; an effect count) is spec 004 W4. **TD B-3** is W1 and W6.
  **TD B-6** is W5 and T158. **TD B-1** is W7 and T157, amended by SR-3.

## Dependencies

- **Spec 004 wave B's shared pass** (tasks-wave-b.md T100 to T163, approved 2026-10-23) merged.
- **Shared-code requests** (to spec 004's shared-code owner; not this skill's work):
  - **SR-1 (approved; tasks-wave-b.md T161 tests, T162 code, `setSkillData()`), skill lesson data:** `mentor/lib/session.mjs` gains one function
    a skill's tool calls to store plain-JSON data on the current lesson (for this skill: the null's
    name, the region, the stored null), separate from the model-supplied `skill_options`, kept on
    continue and resume, refused in another skill's or comp's lesson, never read by the session.
    Why: FR-007 and FR-012 need the check and demo tools (not the model, and not only the snapshot
    tool) to store what they measured.
  - **SR-2 (declined 2026-10-23; no task), a stored parent chain:** `compMatrix` (and so `footprint`) takes
    `parent_matrix`, a stored comp-space matrix that replaces the direct parent **and everything
    above it**, next to W6's `parent_transform`. Declined, going with the designer: chains are out
    of scope (TD § 8), so FR-009 refuses a null whose parent moves instead.
  - **SR-3 (approved; tasks-wave-b.md T163, amending T157), Mentor Practice 2b's skill 6 layout:** keep T157's names (Tile,
    Caption, Stamp; Row A to C; Shadow under Plate; Gradient matted by Reveal Matte) and add: Tile,
    Caption and Stamp's bounds overlap at 0 s; Row A to C overlap each other; each of the four sets
    (the group, the Row group, Plate and Shadow, the matte pair) is more than 10% of the comp's width
    from the others; **Row B has no keys** (a static group member, filter 1); Tile has Position and
    Scale keys (so a rotated null's rewrite shows on Scale, L-2). Before T135.
  - **SR-4 (approved 2026-10-24; tasks-wave-b.md T164, T165, before T133; the same as spec 011's
    SR-2):** the comp's `width` and `height` in the snapshot, for FR-005's "nearly touch" (2% of
    the comp's width) and so the proposal (plan › Requests).
- **Spec 011**: skill 5 must be built for the prerequisite to be learnable; nothing of its code is
  read here.
- **Eval engineer**: the Eval plan; fixtures from the live captures above.
