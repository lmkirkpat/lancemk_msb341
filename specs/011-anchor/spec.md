# Feature Specification: Set the pivot (curriculum skill 5)

**Feature Branch**: `011-anchor` (spec folder only; no git branch)

**Created**: 2026-10-23

**Status**: Approved 2026-10-23. The builder took every recommendation in Open questions (H-1 to
H-5) and SR-1; the designer's round 1 answers (TD § 15: D-1 to D-3 and H-3's condition) are folded
in the same day. Plan and tasks approved 2026-10-24 with plan › Q1 (FR-014's reading below) and
SR-2 (the comp's size; spec 004 tasks-wave-b.md T164, T165). **Amended 2026-10-26** after live
checks L-1 to L-5 ([live-sitting-2026-10-26.md](live-sitting-2026-10-26.md), on `skill-5-anchor`)
and the desk block (T234, T235), before T236: shapes are default candidates (L-1, as built);
**the ranking prefers a layer with no keys at all** (FR-004, the builder's approach, this spec's
rule; Changes 2026-10-26 lists what was rejected); a pivot outside its layer is reported with the
side it's on (FR-019, new FR-019a); the group-anchor hint becomes two hints that match what the
read can see (FR-019, row 22); Pop's Scale-0 mistake leaves the pivot far outside (row 20);
lesson starts take two reads on Mentor Practice 2 (FR-013); rows 5, 12, 16, 21, 23, 25 and 28 and
FR-023 take the live results. Waiting on the builder's approval; one new question for the
curriculum designer, D-4 (Sled), and a list of TD wording to confirm (Open questions › D).

**Input**: Cockpit task, Sprint 3 wave B, round 2: "Write the build spec for curriculum skill 5,
'Set the pivot'." Record ID `transform.anchor`, short name `anchor`, tool prefix `anchor_`
(spec 004 [contracts/skill-module.md](../004-ae-curriculum/contracts/skill-module.md) › 1).

**What is taught** is the curriculum designer's [teaching-design.md](teaching-design.md) (this
folder, draft 2026-10-23; `decisions/007`). This spec links to it by section (written "TD § n")
and turns it into requirements. It doesn't restate or change the teaching. Where it needs
something the design doesn't say, that's a question in Open questions › D.

**The designer's S items, all taken:** S-1 (pass items 3 to 5, Scale first on a rest-key tie:
FR-011, FR-012), S-2 (the place measured in the layer's own space: FR-010), S-3 (a 3 px floor per
axis, and off-grid places go to the nearest of the nine: FR-005, FR-010), S-4 (the understanding
check is recorded and doesn't gate: FR-020). S-1 to S-3 go beyond spec 004 FR-028's text; this
spec adds them here, and spec 004 FR-028 now keeps only its two measures and points here (H-1,
made 2026-10-23).

## Why this skill

- **The pain.** "I rotated it and it swung wide" (or it spun in place when it should hinge) is the
  most common rotation failure in the anchor brief (TD § 1). It comes up the first time a designer
  animates a door, a needle, a bar growing from one end, or a badge popping up from its base. It's
  also skill 6's hard prerequisite: a null's pivot is the group's pivot (TD § 3).
- **What Adobe can't easily copy, said plainly** (CLAUDE.md "Next steps" 2; spec 004 › Why):
  - **Depth.** On 2026-10-08 Adobe's assistant couldn't sample screen positions "because those
    numbers are in each layer's own space" (`discovery/usage-notes/adobe-assistant-2026-10-08.md`).
    This skill checks the two things that make a pivot right at once, from comp-space bounds: the
    pivot is at the named place inside the layer, and the layer didn't move on screen. It also
    checks that no other layer moved (Pan Behind grabbing the wrong layer) and, on a keyed layer,
    that the pivot was set at rest. That per-layer, per-time check is the edge here.
  - **Memory and practice.** A review days later names a new layer, asks where it hinges, and
    names no tool. The record keeps whether the first try jumped, so a later lesson can say "set
    the pivot first" only to someone who had that trouble (TD § 1, § 13).
  - Restraint and leading alone don't count as an edge (`decisions/002`).
- **Diagnosis link.** None today. Spec 005 has no finding that maps to this skill, because a
  wrong pivot is only wrong against an intent the comp doesn't hold (TD § 4: the mentor asks).
  Diagnosis is its own capability (spec 005); this spec doesn't add a finding to it.

## Decisions and rules this spec relies on

- `decisions/002`: the "why" names depth, memory and practice, not restraint.
- `decisions/003` amended by `005`: narrow mentor tools, no open-ended scripts, learner record in
  local files, the panel only displays. This skill adds three fixed tools and one fixed demo
  snippet (FR-001, FR-015).
- `decisions/007`: the curriculum designer owns `teaching-design.md`; the skill builder owns
  `mentor/` and the skill prompt; the eval engineer owns `product/evals/` and writes the cases.
- `decisions/008`: one agent on After Effects at a time; the ownership hooks; `check-branch.mjs`
  rejects edits to existing shared files from a skill branch.
- Constitution 1.3.0: I (this spec before build), II (fixed tools only), III (eval cases), IV (no
  names in the record), V (smallest thing), VI (the builder doesn't write its eval cases; numbers
  from the cockpit).
- **Spec 004** (approved): FR-004, FR-005, FR-012, **FR-013** (the visibility class, never the eye
  switch alone), **FR-014** (the motion-sources map, step 1), FR-018 to FR-022, FR-024, FR-025,
  **FR-028** (this skill's two measures), **FR-030** (Pan Behind, never Quick Set Anchor),
  **FR-032** (add files only), FR-033 to FR-035, FR-037; its Edge Cases table;
  [plan.md](../004-ae-curriculum/plan.md) › Wave B; [tasks-wave-b.md](../004-ae-curriculum/tasks-wave-b.md)
  (W1 sampled R3, W2, W3, W4's extras, `comp-space.mjs`, `visibility.mjs`, T157's targets);
  [data-model.md](../004-ae-curriculum/data-model.md) › Wave B shapes; the skill-module and
  shared-tools contracts.
- **Spec 002** (easing, built): the house lesson shape, the server rules, `record_lesson`'s
  session check, the demonstration rule.

**Approved with it (2026-10-23):** tasks-wave-b.md's W1 to W7, including W1's sampled read, and this
spec's one shared-code request, SR-1, as tasks-wave-b.md T160 (Dependencies). Spec 004 FR-028 was
reworded to match (H-1).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set a layer's pivot without it moving (Priority: P1)

I want my door to swing from its left edge. I start the lesson on Mentor Practice 2. The mentor asks
which layer I want to turn from somewhere other than its middle and where it should turn from,
shows me a frame from my comp, and tells me Door's pivot is at its center. I press Y, drag the
crosshair to Door's left edge, and say "done". It checks that the pivot is on the left edge and
that Door didn't move, then asks which part will stay still when it turns, and has me drag Rotation
to see it swing.

**Why this priority**: it's the whole skill (TD § 2), on the target set built for it (spec 004
T157, as amended by T160, this spec's SR-1).

**Independent Test**: on Mentor Practice 2 with the 2b layers, a lesson on Door runs from start to a
verified pass with no demonstration, and the check agrees with a look in After Effects.

**Acceptance Scenarios**:

1. **Given** Mentor Practice 2 with the 2b layers, **When** the lesson starts and the learner has
   no layer in mind, **Then** the mentor offers one default candidate with a hinge that suits its
   shape in one sentence (TD § 4), and names what it leaves out in one sentence per reason.
2. **Given** the learner names Door and "the left edge", **When** the mentor repeats it back,
   **Then** it says "the middle of Door's left edge", says where the pivot is now in place words,
   and gives TD § 1's two sentences once, with one frame from the comp (TD § 5 stage 2).
3. **Given** the learner moves the pivot with Pan Behind, **When** they say "done", **Then** it
   passes (FR-010 to FR-012), and the mentor never says "you can see the pivot here" about a frame
   (TD § 5).
4. **Given** the learner typed a new Anchor Point value instead, **When** they say "done", **Then**
   it doesn't pass, and the hint says Door moved with its pivot and in which direction, and names
   Pan Behind (Y), never the numbers (TD § 7).
5. **Given** a focus of one layer, **When** the learner asks for a demonstration, **Then** there
   isn't one; the mentor walks it through in words (FR-014).
6. **Given** a pass, **When** the mentor asks which part stays still when it turns, **Then** a wrong
   answer gets one light correction and the pass stands (FR-020).

---

### User Story 2 - Set the pivot on a layer that's already animated (Priority: P1)

My gauge's Rotation is keyed 0 to 90. The mentor names a rest key (where Rotation is 0), asks me to
put the playhead there first, and checks the pivot at that time, so a pivot moved mid-turn doesn't
pass.

**Why this priority**: without it, a pivot set on a shrunk pop-in passes and the motion is wrong at
every other frame (S-1). It's the case the check would get wrong silently.

**Independent Test**: on Gauge and Pop (Mentor Practice 2b), the check passes a pivot set at the
rest key and fails one set away from it, with the rest-key hint.

**Acceptance Scenarios**:

1. **Given** Pop (Scale 0 → 100), **When** the lesson starts on it, **Then** the mentor names the
   full-size key as the rest key and asks for the playhead there (FR-011).
2. **Given** the learner moves Pop's pivot with the playhead at Scale 0, **When** they say "done",
   **Then** it doesn't pass, and the hint names the time where Pop is full size (TD § 7).
3. **Given** two focus layers, one a default candidate, **When** the learner asks for
   the demo, **Then** it runs on the one the learner cares less about (FR-013), with frames before
   and after at the same time, which look the same, and says both numbers changed and the layer
   didn't move.
4. **Given** the learner names Sled (Position keyed), **When** the mentor accepts it, **Then** it
   gives TD § 4's tip once, and the check holds the layer still at every Position key time too
   (FR-012 item 4). **Open (D-4, 2026-10-26):** L-2 shows Pan Behind can't pass item 4 on a layer
   with two or more Position keys, so as written this lesson has no taught way to pass.

---

### User Story 3 - Review the skill in a later session (Priority: P2)

A day or more after I learned it, Knack names a new layer ("Here's Tab. Where should it turn
from?"), and when I answer, says to set its pivot there without it moving. No demo, no walkthrough,
no tool named. It checks the same way.

**Why this priority**: practice across sessions is half this skill's edge, but reviews for 5 aren't
in the sprint baseline (spec 004 H2), so this is designed and built now (TD § 12, as specs 008 to
010) and run live as a stretch.

**Independent Test**: with a saved record that says this skill was learned and is due, on a comp
with a candidate not in the record, the review runs with no demonstration, asks the hinge first,
checks with this skill's pass, and records a review.

**Acceptance Scenarios**:

1. **Given** a due review and a default candidate not in the record for this skill on this comp,
   **When** the session starts and no skill is in progress, **Then** the review is offered (spec
   004 FR-004 step 2).
2. **Given** the review runs, **When** the mentor sets it up, **Then** it asks where the layer
   should turn from before anything else, then says to set the pivot there without it moving, and
   names no tool or shortcut (FR-024).
3. **Given** the review layer has Rotation or Scale keys, **When** it's set up, **Then** the rest key
   is still named (TD § 12).
4. **Given** no new candidate, **When** the session starts, **Then** no review is offered and it
   stays due.
5. **Given** a review that doesn't pass, **When** checked, **Then** TD § 7's hints (which may name
   Pan Behind), no reteach, recorded as a review that didn't pass; "learned" stays.

---

### Edge Cases

The overlap rows are in **Edge cases where concepts overlap** below (the `/overlap-audit` section).
Other edge cases:

- **The pivot is already in the named place** (by FR-010's measure on the baseline): not a target;
  one sentence and ask for another layer or place (TD § 4). A text layer's "middle" is never
  already there just because its pivot looks central: its pivot is on the baseline (TD § 9).
- **A place off the grid** (a shoulder, a hinge hole): the nearest of the nine for this lesson, and
  they can nudge it after (TD § 4, S-3).
- **No candidate in the comp**: offer a new solid (Layer > New > Solid, a small rectangle), then a
  fresh read (TD § 4). In a review: no review.
- **The learner names a layer the table leaves out** (null, 3D, Anchor Point keyed, expression on
  Rotation or Scale, collapsed precomp, camera, light, adjustment): one sentence from TD § 4 and ask
  for another. A hidden layer, a matte, a guide, a Position-keyed layer or a locked layer can be
  named (TD § 4; a locked one gets the unlock sentence, D-2).
- **The learner moves the playhead between reads**: the check compares at FR-011's check time,
  never at "the playhead now", so moving it isn't a change.
- **The learner drags Rotation in stage 6 and forgets Edit > Undo**: the lesson has already passed;
  the check isn't run again on it, and nothing is graded (TD § 5).
- **The learner undoes the demo**: the demo layer is back where it was; the check names it like
  any other focus layer (FR-016).
- **AE busy or unreachable**: no check, no claim about the comp, pass on the fix (server rule 2).
- **A comp-space read comes back empty** (a layer with no rectangle, a 3D chain, a time not
  sampled): the check says it can't check that layer, never that it didn't move (FR-018).
- **Learner record unreadable**: the lesson runs; one sentence about the notes (spec 004 Edge
  Cases).

## Requirements *(mandatory)*

### Tools and files (spec 004 contract)

- **FR-001**: The skill MUST plug in only by adding the files in
  [skill-module.md](../004-ae-curriculum/contracts/skill-module.md) › 1 (tool file, its own analysis
  and check in `mentor/lib/anchor.mjs` or files it alone owns, one demo snippet and its fixture
  twin, unit tests, fixtures captured live, and `.claude/skills/anchor-mentor/SKILL.md`), with
  record ID `transform.anchor` and three tools, `anchor_snapshot`, `anchor_demo` and `anchor_check`,
  behaving as that contract's › 3 says. It MUST NOT edit any existing file under `mentor/`,
  `bridge/`, `.claude/skills/*-mentor/`, `product/evals/` or `panel/` (spec 004 FR-032;
  `check-branch.mjs`). Anything more is a request to spec 004's shared-code owner (Dependencies).
- **FR-002**: Every layer fact MUST come from wave B's shared reads and code: `layerInfo()` for R1
  and R3, `classOf()` for visibility (spec 004 FR-013), `sourcesOf()` for parents and children
  (FR-014), and `comp-space.mjs` for every comp-space point, footprint and matrix. The skill sets
  its own tolerances (FR-010, FR-012) in its own file and MUST NOT re-derive the matrix math or the
  visibility class.
- **FR-003**: `FINDERS["transform.anchor"].focus(snapshot, { exclude })` MUST return a count above 0
  exactly when FR-004 finds at least one default candidate not in `exclude`, and `review: true`
  MUST be set only once review mode passes its tests (contract › 2). On a snapshot without
  `layer_info` it MUST return 0 (nothing can be checked).

### Focus

- **FR-004 (candidates)**: Candidates MUST come from `layer_info` (every layer, keyed or not), not
  from the snapshot's `layers` (keyed layers only), and follow TD § 4's candidate table row by row,
  using the visibility class:
  - **Default candidates:** class *renders* or *shy*, 2D (`three_d` false), kind solid, text,
    footage or precomp, no keys and no keyed expression on Anchor Point or Position, no expression
    on a keyed Rotation or Scale, not a precomp with `collapse` on, not locked (D-2), and its
    comp-space footprint readable at its sample times (FR-018). Shape layers are default
    candidates: **L-1 passed 2026-10-26** (Pan Behind on the selected layer moves its own Transform
    anchor and Position together, and `rect` reads the shape as drawn; `SHAPES_DEFAULT = true`,
    `RECT_KIND.shape = "rect"`, as built in T234 and T235).
  - **Allowed if named, never proposed:** Position keyed (any count,
    including one); *hidden by the learner* (with TD § 4's sentence); *matte*; *guide*; a
    **locked** layer (TD § 4's one sentence asking the learner to unlock it with the lock switch;
    never the demo, TD § 15 D-2); a full-frame layer (last resort, proposed only when nothing else
    exists).
  - **Never:** Anchor Point keyed; an expression on a keyed Rotation or Scale; 3D; a precomp with
    Collapse Transformations on; *null*, camera, light, adjustment layer. Each gets TD § 4's one
    sentence.
  - **Ranking** (TD § 4): unparented first; then **how animated the layer already is, in three
    steps: no keyed property at all, then keys but none on Rotation or Scale, then Rotation or
    Scale keys** (amended 2026-10-26; was "no Rotation or Scale keys", two steps); then a pivot
    still at the place AE put it, read as the anchor at its own rectangle's center **or** at the
    layer's own origin (0, 0), for every layer type (TD § 15 D-3; the read can't see a layer's
    history); then smaller over full-frame. Ties go to the comp's layer order. Deterministic and
    unit tested. "A keyed property" is any property with keys in the snapshot's keyed `layers`
    entry for that layer (Opacity, an effect, a mask or a text animator count, not only
    Transform). It's a ranking step, never a filter: a comp where every layer has keys still gets
    a proposal.
    **Why (2026-10-26):** with shapes on, Mentor Practice 2's older layers (Blink, Cut: key types'
    Opacity holds; Spinner, Badge) rank first by layer order, so the lesson proposed Blink and the
    review (record with Door and Needle) picked Blink too. On a learner's own comp the same thing
    happens: the layers near the top are the ones they've already animated. A layer with keys is
    finished or half-finished work; moving its pivot changes how that motion reads, and the habit
    the review looks for is "set the pivot before you key" (TD § 4's reason for the Rotation and
    Scale step). A still layer is the cleanest first target. **On Mentor Practice 2** (answer key,
    by hand): Door 1, Needle 2, Tab 3, Peg 4, Banner 5, Sign 6, Plaque 7, Row B 8, Lid 9 (pivot not
    where AE put it), Blink 10, Cut 11, Caption 12, Spinner 13, Badge 14, Gauge 15, Pop 16, Hatch
    17, Shadow 18 (parented), Flip 19 (flipped). The proposal is **Door, the middle of its left
    edge** (quickstart › 5.1); the review with Door and Needle in the record picks **Tab** of 17
    (quickstart › 6). Mentor Overlaps' ranks don't change (Photo, Drift, Still have no keys).
- **FR-005 (places)**: The nine places MUST be TD § 4's grid, each a point on the layer's own
  rectangle (`rect` at the check time): left, middle or right of `left … left + width` and top,
  middle or bottom of `top … top + height`. The mentor repeats the place in plain words with the
  layer's name. A place off the grid is mapped to the nearest of the nine by asking the learner,
  never by the mentor guessing (S-3). The places for the focus are passed to the session as
  `skill_options` (plain data, contract › 4), so a continued lesson keeps them.
- **FR-006 (intent first)**: The mentor MUST ask TD § 4's intent question before proposing a
  place, in both forms (layer in mind, or not), and MUST NOT grade a place the learner didn't name
  or agree to (spec 004 FR-021).
- **FR-007 (already there)**: A layer whose anchor already meets FR-010's measure for the named
  place on the lesson's first read MUST NOT be a target; the mentor says so in one sentence and
  asks for another layer or place. Unit tested on Sign (text, "the middle": not already there).
- **FR-008 (focus size)**: The focus MUST be one or two layers, each with its own place (TD § 4).
  The learner's layer is always in it; a second only if the learner wants to practice the demo
  first or the mentor offers a second candidate in one sentence and they agree.
- **FR-009 (what's said about leave-outs)**: Hidden layers, mattes, parents, precomp frames, text
  baselines, flipped layers and Position keys MUST each get TD § 4 or § 9's sentence, once, in
  plain words. A matte MUST never be called hidden. A parented focus layer gets one sentence naming
  the parent, and spec 004 FR-037's "trace this one first" hand-off MUST NOT fire for it (the
  parent can't change this check, TD § 9).

### Pass (per focus layer, counting the demo layer)

- **FR-010 (item 1, in the named place; spec 004 FR-028 measure plus S-2 and S-3)**: The anchor MUST be
  within **max(10% of the rectangle's width, 3 px)** of the place's point horizontally **and within
  max(10% of its height, 3 px)** vertically, both **in the layer's own space** (the anchor against
  the layer's own `rect`, not comp pixels), at the check time. So Scale not at 100%, rotation,
  negative scale or a parent's scale don't change which place is which. Unit tested on an 800 × 60
  bar (80 px and 6 px: top-left, left-middle and bottom-left stay three places), on a 30 × 400
  needle (3 px floor across), and on a 10 px line (the floor applies on both axes).
- **FR-011 (item 3, the check time; S-1)**: The **check time** MUST be:
  - for a layer with Rotation or Scale keys, its **rest key**: a key time where Rotation is 0 or a
    whole turn (within 0.5°) and Scale is at its largest key value (largest |x × y|); if no one key
    time has both, the Scale one (S-1's tie-break), and the mentor says so and asks whether that's
    how it looks at rest; with only Rotation keyed and no key at 0 or a whole turn (within 0.5°),
    the key whose Rotation is closest to 0 or a whole turn, said in one sentence with the same
    question (TD § 15 D-1).
    The learner can name another key as the rest pose instead; their answer replaces it in
    `skill_options`. Ties go to the earliest time;
  - otherwise the lesson's first read's current time.
  The mentor MUST name the rest key in plain words and ask for the playhead there before the
  learner starts (TD § 4). The check MUST measure at the check time from the sampled read (W1),
  never at "the playhead now" (W1, approved).
- **FR-012 (items 2, 4 and 5, nothing moved; spec 004 FR-028 measure plus S-1)**: The check MUST pass a
  focus layer only when all hold:
  - **Item 2:** every edge of its comp-space footprint at the check time moved by **1 px or less**
    from the first read to the check read.
  - **Item 4, only for a Position-keyed layer the learner chose:** item 2 also holds at **every
    Position key time** of the first read, so a pivot that slides the animation at other times
    doesn't pass (TD § 6 item 4, B5).
  - **Item 5:** no other layer's footprint moved by more than 1 px at any time sampled in both
    reads, except that **children of a focus layer are compared only at that layer's check time**
    (at other times they turn with the new pivot, which is the point); and Anchor Point on the
    focus layer gained no keys.
  And FR-010 holds. Nothing about how the pivot was moved is graded (TD § 5: Pan Behind, typing
  both values, Quick Set Anchor, Center Anchor Point all pass if this holds).
- **FR-013 (samples the check needs)**: For FR-011 and FR-012, both reads MUST have samples at the
  times compared, for every layer and its parent chain. `anchor_snapshot` MUST take its first read
  with `takeSnapshot()`, and, when any **needed time** (every candidate's rest-key time and Position
  key times, all buckets but never; research R4) is missing from any layer's samples, a second read
  with the needed times as `sample_times`, used as the lesson's baseline (so every layer, children
  included, is sampled at every time the check may compare); `anchor_check` MUST pass the
  baseline's check times, current time and Position key times as `sample_times`. A time missing
  from either read makes that comparison unreadable (FR-018), never a pass. (Amended 2026-10-26 to
  match research R4 as built: the old text took the second read only "when a candidate has
  Rotation, Scale or Position keys and children".)
  **On the live comp (T234):** Mentor Practice 2 has 40 layers, not the 19 the plan's stand-ins
  had, and needs **30** times (answer key `needed_practice2b`), not the 7 the sitting's `--times`
  list held. A plain read holds only the playhead and each layer's own key times, so **every lesson
  start on Mentor Practice 2 takes two reads**, and so will most real comps with more than one
  keyed candidate. That's expected, not a fault. Nothing else in this spec assumed one read:
  `anchor_check` and `anchor_demo` are one read each, as before; the 63-time cap holds with room
  to spare; SC-001 (10 minutes) isn't sensitive to a second read of about a second. The second
  read's time is measured in T236 (plan › Risks), and a lesson start over 10 s is logged as a
  finding (spec 003 SC-004's bar for a turn), not a fail.

### Demonstration

- **FR-014 (demo target, FR-024 of spec 004)**: `anchor_demo` MUST make one change on the lesson's
  demo target only, once per lesson, never in a review, and the session MUST refuse any other
  target before AE is touched. With **two** focus layers the demo target is the one the learner
  cares less about (the one the mentor offered, or the second they named), if it's a default
  candidate (FR-004; shape layers included since L-1, so Lid with Banner demos on Banner) and, if
  it has Rotation or Scale keys, the
  current time is on its rest key; else the other if it qualifies; else none. With **one** focus
  layer, none (the session's single-target rule already enforces it; a unit test pins it). The
  prompt runs it only when asked or clearly stuck (TD § 4). **Reading (plan › Q1, approved
  2026-10-24):** the target is fixed when the lesson starts, so the rest-key condition is checked
  when the demo runs: the demo target stays the second focus layer, `anchor_demo` refuses with
  `not_at_rest` if the playhead isn't on its rest key (FR-015), and the mentor asks for the
  playhead there. **L-4 (2026-10-26):** with Tab locked before the snapshot, Tab isn't a default
  candidate, so the demo went to Door (entry 0), as this rule says; locked after the snapshot,
  `anchor_demo` refused with `locked` and changed nothing. Unlike spec 010, no skip rule is needed.
- **FR-015 (what the demo writes)**: The demo MUST, from **one fresh read** of the comp (matched by
  name, refusing if the active comp isn't the lesson's), set the layer's Anchor Point to the place's
  point in its own rectangle at the current time and set Position by exactly what keeps its
  footprint still at the current time (the anchor's change through the layer's own scale and
  rotation, in its parent's space), as two values for separated X and Y, in **one undo step**. It
  MUST never key anything. It MUST refuse, changing nothing, if the layer is locked, 3D, a collapsed
  precomp, has keys or an expression on Anchor Point or Position, or has Rotation or Scale keys and
  the current time isn't within half a frame of its rest key; the snippet repeats the lock, key and
  expression checks itself. The values are computed in the server's own tested code, not in the
  snippet. The reply says what changed and "Edit > Undo" (server rule 1).
- **FR-016 (credit)**: The check MUST credit the demo layer to the demo while its anchor is within
  0.01 px of the demo's written value, and treat it as the learner's once a check has seen it
  undone or changed (`markChecked(passed, { demoUndone })`, contract › 3).
- **FR-017 (what the demo shows)**: Before it runs, the mentor asks the learner to select the demo
  layer and press A, then Shift+P; after it, a frame before and a frame after at the same time, with
  "both numbers changed, and Door didn't move." No rotated frame (TD § 4; B-7 not built).

### Checking the learner's attempt

- **FR-018 (unreadable is not unchanged)**: Any comp-space value that comes back `null` (with any of
  `comp-space.mjs`'s reasons) MUST make that layer's result "can't check", reported as such, never
  "didn't move", "in place" or a pass. A focus layer that can't be checked holds the pass. The
  mentor says it can't check that layer and why in plain words.
- **FR-019 (what the check returns)**: `anchor_check` MUST read a fresh snapshot (FR-013) and
  compare it with the lesson's baseline, matching layers by name when names are unique in the comp
  and by index otherwise, and return per focus layer: the place now in place words (the nearest of
  the nine, or "outside the layer" **with the side it's on, FR-019a**, or "between"), whether the
  anchor and Position changed, which way and roughly how far the footprint moved (in comp pixels,
  for the hint's direction only), whether the layer's own rectangle shifted with the anchor
  unchanged (what's drawn moved inside the layer: a text layer's justification, an edited path, a
  shape group's own Position; **not** a group-anchor move, which L-1 showed shifts nothing,
  FR-019b),
  whether the read's current time is the rest key, whether the layer is locked (so the hint names
the lock when it's still locked at "done", TD § 15 D-2), and items 1 to 5. And, as **other changes**, not
  graded: any other layer whose anchor changed (Pan Behind grabbed it), any layer whose eye switch
  changed (a matte's eye left on), new keys on Anchor Point or Position anywhere, and any layer
  added, removed or renamed. These MUST be read from `layer_info` for every layer, **not** from
  `unexpectedChanges()`, which sees keyed properties only and would miss every unkeyed anchor
  change (overlap filter 1). The skill prompt turns the result into TD § 7's hints: name the layer,
  what moved and where to look, never the numbers to type (spec 002 FR-008). Each TD § 7 row MUST
  map to one field combination, unit tested.
  **Set away from rest on a layer shrunk to 0 (amended 2026-10-26, L-4, row 20):** Pan Behind at
  Scale 0 looks to the learner as if nothing happened ("it wouldn't let me drag"), but AE does move
  the pivot, far outside the layer (Pop: anchor [120, 960] on a 120 × 120 layer), and at full size
  the layer now draws far off its place. The check's grading stands: one hint, set away from rest
  (the cause), and `place_now` reads outside as a fact, not a second hint. The hint MUST say that
  the pivot did move even though nothing showed, and MUST ask for **Edit > Undo first**, then the
  playhead on the rest key, so the learner doesn't start the second try from a pivot far off (the
  wording is the designer's to confirm, Open questions › D, item 5).
  **Pan Behind on the wrong layer (amended 2026-10-26, L-3, row 25):** Pan Behind moves the pivot
  of the layer **under the cursor**, not the selected one, so selecting the layer doesn't prevent
  the mistake. The wrong-layer and another-layer-moved hints MUST say to start the drag on the
  focus layer's own crosshair, and MUST NOT say that selecting it first is the fix (as built in
  T235's `SKILL.md`).
- **FR-019a (which side a pivot outside sits on; added 2026-10-26, L-1)**: When a focus layer's
  or a proposed layer's pivot is outside its layer, `anchor_snapshot` (in the `pivot_outside`
  note) and `anchor_check` (in `item1`) MUST say **which side of the layer it's on as seen on
  screen**: `above`, `below`, `left`, `right`, or a pair (`below-left`), from the anchor's
  comp-space point (`comp-space.mjs`, FR-002) against the layer's comp-space bounds at the check
  time, in the same words as item 2's direction. Null when either can't be read (FR-018), and the
  mentor then says "outside" with no side, never a guess. Measured on screen, not in the layer's
  own space, because the learner is looking for a crosshair in the Composition panel: on a
  flipped or turned layer the layer's own "left" can be the screen's right (row 18). The skill
  prompt says where to look in plain words ("select Lid in the timeline; its crosshair is below
  the lid"), and never a distance. **Why:** in L-1 the builder couldn't find Lid's crosshair (120
  px below a 60 px tall shape) until Lid was selected in the timeline, and TD § 7's own hint names
  a side ("off to its right"), which no tool returned, so `SKILL.md` could only say "look around
  the shape". Unit tested on `lid-pan`'s base (Lid: below), `door-outside` (left), and a synthetic
  flipped layer (the screen's side, not the layer's); `pop-shrunk` at its rest key reads below.
- **FR-019b (a group's pivot moved instead of the layer's; replaces the group-anchor hint,
  2026-10-26, L-1)**: L-1 found that Pan Behind on a shape's group (Contents › Rectangle 1) changes
  the **group's** Anchor and Position together, so nothing moves in the layer's own space and the
  read is identical to the base (`lid-group.json` strict-matches `practice2b.json`). Nothing this
  skill reads can see it; the old `group_anchor` hint ("its rectangle shifted") could never fire on
  it. So:
  - `group_anchor` is **renamed `content_shifted`** and keeps its field combination (anchor
    unchanged, `rect` moved in own space, item 2 fails), for any layer kind. Its hint says what's
    drawn in the layer moved while its own pivot didn't, and names no group on a text layer (L-5:
    a justification change shifts Sign's letters this way; `sign-left-check`).
  - A new hint, **`unchanged_shape`**, fires on a shape focus layer that isn't passed when its
    own Anchor Point and Position are both unchanged at the check time, item 2 holds and no other
    layer's anchor changed (not `wrong_layer`). It's added after the place hint (`outside`,
    `not_moved_enough`). Its sentence says the layer's own pivot hasn't changed and, as a
    possibility, not a claim, that a pivot dragged inside Contents belongs to the shape's group:
    select the layer itself in the timeline and drag its crosshair. It never says the learner
    moved the group's pivot (the read can't tell that from not trying yet). Answer key:
    `lid-group` → `outside`, `unchanged_shape`.
  - **Rejected:** dropping the group hint (the mistake is real, L-1 made it in one drag, and the
    learner who did it hears only "your pivot hasn't moved", which feels wrong to them); reading
    the group transforms (a new shared read, spec 004's to own, for a mistake TD § 7 rates as a
    guess; out of scope for this release).
- **FR-020 (understanding check; S-4)**: After a pass, the mentor MUST ask which part of the layer
  will stay still when it turns, at most one light correction, and record the answer in plain words
  in the summary. It MUST NOT gate the pass or change the check's result.
- **FR-021 (stages 6 and 7)**: After the understanding check the mentor invites the ungraded "try
  it" (drag Rotation or Scale, watch it, Edit > Undo), and, when Rotation or Scale is keyed, one
  sentence to play it back. No check runs on either (TD § 5).

### Lesson, version and record

- **FR-022**: The skill prompt MUST follow TD § 5's stages and spec 004 FR-025's server rules: a
  fresh read; one frame from the learner's comp with the focus layer in it; the pivot described in
  place words from the read, never claimed as visible in a frame; no `after-effects` bridge tool,
  no open-ended script.
- **FR-023 (version, spec 004 FR-030)**: The mentor MUST teach Pan Behind (Y) and may name A, P, R,
  S and Shift to add a property. It MUST NOT give Quick Set Anchor as a step, pass condition or
  hint, and in this build MUST NOT **bring it up**: R0 can't tell a beta build from the release
  (FR-030's open point), so the "only if R0 shows it" mention waits for a live check that it can
  (H-3). If the learner asks about it, the mentor answers plainly in **one or two sentences** (it's
  a beta feature, the lesson uses Pan Behind, and the check works either way), and never refuses,
  never walks them through it, and never says they don't have it (TD § 11, § 15). A learner who
  uses it anyway is checked like any method. It MAY name Layer > Transform > Center Anchor Point in
  Layer Content **by menu path only, for the center place only**, never its shortcut: **L-3
  confirmed it 2026-10-26** at 26.5 (on Lid it centred the pivot and nothing moved; as built in
  T235). It MUST NOT teach snapping the crosshair. The Properties panel gets "you may also see it
  there", no more (TD § 11).
- **FR-024 (review mode)**: `anchor_snapshot` with `mode: "review"` MUST drop every layer in the
  record's past targets for this skill on this comp and project, and pick from default candidates
  only, preferring ones with no Rotation or Scale keys (TD § 12), and within that FR-004's
  three steps (no keys at all first; amended 2026-10-26). With Door and Needle in the record,
  Mentor Practice 2 gives Tab; with Door and Gauge (quickstart › 5's two lessons), Needle. With none left, `no_new_target`
  and the review isn't offered. A review MUST ask where the layer should turn from first, then say
  to set its pivot there without it moving, with no demo (the session refuses it), no walkthrough,
  and no tool or shortcut named before "done"; it still names the rest key on a keyed layer. A
  review that doesn't pass gets TD § 7's hints, no reteach, and is recorded as a review that
  didn't pass; "learned" stays (spec 004 FR-019 to FR-021). "I already know it" runs the same way.
- **FR-025 (record)**: `record_lesson` MUST be called as spec 004's shared-tools contract says, with
  no new input fields. Targets are `{layer, property: "Anchor Point"}` per focus layer, so a review
  can find a new layer. In plain words (TD § 13): `attempted` names the layer and place ("Set
  Needle's pivot to the middle of its bottom edge"); `summary` says what the checks showed,
  including whether the first try moved the layer and whether it was set away from rest, and the
  understanding answer; one `next`. No pixel numbers, no tool or method, no motive, no names (spec
  004 FR-022).
- **FR-026 (prerequisite)**: Setting keyframes is the only hard prerequisite and an on-ramp, so the
  lesson never blocks on it (TD § 3). If skill 6 is built, the last line may name it as "next".

### Tests and evals

- **FR-027**: Each row of the overlap table below MUST have a unit test on a saved snapshot with an
  answer key, captured live where a comp has the case (Mentor Practice 2 with 2b, Mentor Overlaps,
  the skill's own captures from L-1 to L-5) and synthetic only where no capture exists, marked as
  such (spec 004 FR-012, FR-034).
- **FR-028**: The measures MUST be unit tested at their edges: 10% and the 3 px floor on each axis,
  1 px of footprint movement (0.9 passes, 1.1 doesn't), the rest key's 0.5° and tie rules, and a
  layer at Scale 200% and one at Scale [-100, 100] measured in their own space.
- **FR-029**: The demo snippet's fixture twin MUST reproduce the write on saved snapshots, and a
  unit test MUST show the twin's result keeps the footprint within 1 px on a rotated, scaled and a
  parented layer (with comp-space's math) and writes X and Y on a separated layer.
- **FR-030**: The eval engineer's cases (Eval plan) MUST run on saved snapshots without After
  Effects, and the easing set MUST stay at 25/25 or within one case after this skill merges (spec
  004 FR-035).

### Key Entities

- **Candidate**: a layer from `layer_info` with its class, kind, keys on Anchor Point, Position,
  Rotation and Scale, parent, and its rank (FR-004).
- **Focus layer**: one or two candidates the learner named or agreed to, each with a **place** (one
  of nine) and a **check time** (FR-011).
- **Demo target**: one focus layer, or none (FR-014).
- **Check result**: per focus layer, items 1 to 5, the place now, what changed and which way, and
  "can't check" reasons; plus other changes.

## Edge cases where concepts overlap (`/overlap-audit`, spec 004 FR-034)

Run 2026-10-23 against the code on main (`mentor/jsx/snapshot.jsx`, `mentor/lib/diff.mjs`,
`mentor/lib/session.mjs`) and wave B's contracts (data-model › Wave B shapes; `layer-info.mjs`,
`comp-space.mjs` and `visibility.mjs` aren't built yet, so rows marked **contract** are checked
against the contract and must be re-confirmed in the unit tests). TD § 9 is the source for what
each row must see; this table adds what the focus, the check and the learner each see.

**Filters used by more than one job:**

1. **`unexpectedChanges()`** (`diff.mjs`) is every built skill's "other changes" and walks only
   keyed properties in `layers`. This skill's subject is an **unkeyed** Anchor Point and Position,
   so reused here it would report nothing, including Pan Behind on the wrong layer. FR-019 reads
   other changes from `layer_info` instead.
2. **The snapshot's `layers`** holds keyed layers only (`snapshot.jsx`, `numKeys > 0`). It decides
   what easing and skills 1 to 3 teach; reused for candidates, every default candidate (no keys)
   would vanish. FR-004 reads `layer_info`.
3. **The eye switch** is "hidden by the learner" and "matte" at once. FR-004 uses the class; Pan
   Behind still needs the layer visible to drag, which is a teaching sentence (TD § 4), not a filter.
4. **The session's single-target rule** (`session.mjs`: no demo when targets < 2) was written for
   easing pairs; here a target is a layer. It gives TD § 4's "one focus layer, no demo" for free,
   which is right; a test pins it so a change to the rule shows up here.
5. **`footprint()`'s rectangle** (`rect` or `rect_extents`) serves both item 1 (where the place is)
   and item 2 (did it move). Both MUST use the same rectangle per layer kind, chosen by L-1 for
   shapes and L-5 for text, or a stroke could move "the bottom edge" between the two items. Both
   chose `rect` (2026-10-26). L-1's Lid has no stroke, so `rect` against a stroked shape is still
   unchecked live; TD § 9 says bounds include the stroke (Open questions › D, item 7).
6. **`comp-space.mjs`'s `null` with a reason** (`not_sampled`, `three_d`, `no_rect`, …) is one value
   for "can't read". Treated as "no movement" it would pass anything (the playbook's "unreadable
   treated as empty"); FR-018 makes it "can't check".

| # | Overlap | Focus sees | Check sees | Learner is told | Right? | Test |
|---|---|---|---|---|---|---|
| 1 | Expression on a keyed Anchor Point or Position | Not a candidate | n/a | "An expression drives Door's Position, so moving its pivot may not show" | Right | Synthetic (no capture has one); demo refuses it |
| 2 | Expression on an unkeyed Anchor Point or Position | Not read (R2); a candidate | Rendered values (after expressions, W2), so the check grades what shows; a pivot that didn't move after "done" gets TD § 9's sentence | "If something drives it, like an expression, I can't see that yet" | Right (blind spot, stated) | Mentor Overlaps' Drift (unkeyed Position expression): the check reads the rendered value |
| 3 | Expression on Rotation or Scale | Keyed: not a candidate. Unkeyed: not read (R2) | n/a | "An expression turns Logo, so I can't tell where it sits at rest"; never "the expression ignores the pivot" | Right for keyed; unkeyed is a known blind spot (Out of scope) | Mentor Practice's Logo; Mentor Overlaps' Gauge Dial |
| 4 | Keys on Anchor Point | Not a candidate | A key added on the focus fails item 5 | TD § 4 sentence; stopwatch hint (TD § 7) | Right | 2b's Wobble (SR-1); synthetic stopwatch-on case |
| 5 | Position keyed, including a single key | Allowed if named | Item 4 at every Position key time; a key added is an other change | TD § 4's tip, from L-2: Pan Behind changes or adds one Position key, at the playhead, and leaves the others, so the layer sits elsewhere at them | Right: **L-2 (2026-10-26)** playhead on a key rewrites only that key; playhead off the keys adds one there (one key or three). Item 4 fails either way when there are other keys, so **with 2 or more Position keys Pan Behind can't pass** (open question D-4) | `sled-slid` (key added at 0, worst 3.667), `sled-on-key` (worst 4.167), `sled-one-key` |
| 6 | Hold keys on Position | As row 5 | Item 4 at each key time, not between | n/a | Right; never blames the pivot for a hold jump | Synthetic hold-key Sled |
| 7 | Separated X and Y Position | Footprint from bounds, so either | As focus | n/a | Right; demo writes X and Y (FR-015) | Mentor Overlaps' Leaf 2 (separated); demo twin test |
| 8 | Effects (a glow, a Transform effect) | Footprint without effects (`rect`) | Effect points don't move; not read | Only if an effect key is a Transform effect: TD § 9 sentence | Right | Synthetic; Mentor Practice's Glow is an adjustment layer (not a candidate) |
| 9 | Precomp layer | Candidate, ranked below; edges are the precomp's frame | Footprint of the frame | "Icon's edges are its precomp's frame, 400 × 400, not the square inside it" | Right | Mentor Practice's Icon |
| 10 | Precomp with Collapse Transformations on | Not a candidate (`collapse`, W4) | n/a | One sentence | Right once W4 lands; **contract** | 2b's Seal (SR-1) |
| 11 | Hidden by the learner | Allowed if named; never the demo | As any | TD § 4 sentence | Right | Mentor Practice's Old Take |
| 12 | Matte, eye off | Allowed if named; never the demo | Its eye switch compared: left on is an other change | Never "hidden"; turn its eye on to drag, then "turn its eye back off" | Right: **L-3 (2026-10-26)** a selected eye-off matte shows no crosshair, so the eye-on sentence is needed | Mentor Overlaps' Wipe; 2b's Reveal Matte; `matte-eye-on` |
| 13 | Guide, shy | Guide allowed if named; shy a candidate, ranked below | As any | TD § 4 | Right | Mentor Overlaps' Guide Grid; synthetic shy candidate |
| 14 | Null, camera, light, adjustment | Never | n/a | Nulls: skill 6's job, only if built | Right | Mentor Practice's CTRL, Glow |
| 15 | Parented layer | Candidate, ranked below; parent named once | Comp-space footprint includes the parent; FR-037's hand-off off | "Hatch rides on Hatch Rig; that doesn't change where its own pivot goes" | Right; never grades raw Position | 2b's Hatch; T135's anchor capture |
| 16 | Layer with children | n/a | Children compared at the focus's check time only (FR-012 item 5) | n/a | Right; children at other times are meant to turn | `hatch-rig-focus` (live 2026-10-26; Hatch Rig's anchor starts at [0, 0]) |
| 17 | Scale not 100%, non-uniform, or a parent's scale | Place in the layer's own space | Same | n/a | Right (S-2) | 2b's Plaque at 200% (SR-1) |
| 18 | Negative scale (flipped), or a static rotation far from 0 | Ranked last | Own-space sides | TD § 9's sentence with the layer's name ("Flip is flipped, so I'll go by its own sides") | Right; the sentence is the only guard against screen words | 2b's Flip (SR-1) |
| 19 | Rotation keyed | Rest key named (FR-011) | Checked at the rest key | Names the rest key | Right | 2b's Gauge |
| 20 | Scale keyed from 0 (a pop-in) | Rest key = full-size key | At the rest key; a pivot set at Scale 0 fails, one hint (set away from rest); `place_now` outside, below | TD § 7 rest hint, plus "it did move, though nothing showed" and Edit > Undo first (FR-019) | Right on grading. **L-4 (2026-10-26):** AE set Pop's anchor to [120, 960], far outside, not near the place (the stand-in guessed [60, 120]); the learner saw nothing happen | `pop-shrunk` (live) |
| 21 | Text layer | Candidate; pivot starts on the baseline | `rect` is the letters' box at the check time; Source Text keys or animators change it (R6 not read) | "Title's pivot starts on its baseline, under the letters" | Right: **L-5 (2026-10-26)** `rect` is within 1 px of the ink, centred and left-justified; left-justified, the letters start 2.45 px right of the pivot (not 0), so "the middle of the left edge" still reads between places until moved | `sign-centred`, `sign-left` |
| 22 | Shape layer, and a pivot moved inside Contents | Default candidate (**L-1 passed 2026-10-26**) | Layer anchor only. A group's pivot moved by Pan Behind changes the group's Anchor and Position together: **nothing the read holds changes** (L-1). A shifted rectangle with the anchor unchanged is `content_shifted` | FR-019b: `unchanged_shape` ("its own pivot hasn't changed; a pivot inside Contents belongs to the group"), never a claim the group was moved | Right with FR-019b (amended 2026-10-26; the old group hint assumed the rectangle shifts) | `lid-pan`, `lid-group` (identical to the base) |
| 23 | Shape whose pivot sits outside it | Candidate, ranked below unkeyed layers with their pivot where AE put it | Item 1 reads outside, with the side on screen (FR-019a) | "Lid's pivot sits outside the lid, below it", and where to look: select it in the timeline | Right with FR-019a. L-1: Lid's crosshair is 120 px below the shape and the builder couldn't find it unselected. L-3: a new shape layer's pivot is at its origin, the comp's center, away from what was drawn (another case of this row) | `practice2b` (Lid), `lid-pan` |
| 24 | 3D layer | Never (`three_d`) | comp-space returns `three_d` | One sentence | Right once W4 lands; **contract** | Mentor Overlaps' Depth |
| 25 | Pan Behind on the wrong layer | n/a | Focus unchanged (item 1 fails); another layer's anchor changed with its footprint still (an other change, item 5 holds) | "Needle's pivot hasn't moved, but Background's did. Pan Behind moves the pivot of whatever layer is under the cursor, so start the drag on Needle's crosshair" (amended 2026-10-26: selecting first isn't the fix) | **Gap fixed by FR-019** (filter 1). **L-3 (2026-10-26):** with Door selected, a drag on Needle moved Needle's pivot, so the mistake is a real hand path | `wrong-layer` |
| 26 | Playhead moved between reads | n/a | Compared at the check time from samples, not at the playhead (FR-011, FR-013) | n/a | Right with FR-013; **contract** (W1) | Synthetic two reads at different `comp.time` |
| 27 | A time not sampled in one read, a layer with no rectangle | n/a | "Can't check" (FR-018) | Says it can't check that layer | **Gap fixed by FR-018** (filter 6) | Synthetic `not_sampled` and `no_rect` |
| 28 | Locked layer | Allowed if named, never proposed, never the demo (D-2) | Demo refuses; still locked at "done" is returned (FR-019) | The unlock sentence when named; the lock hint if still locked at "done" | Right; R1 reads `locked`. **L-4 (2026-10-26):** locked before the snapshot, the demo went to the other layer (FR-014); locked after, the demo refused with nothing changed | Mentor Overlaps' Locked Bar; `door-locked` |
| 29 | Auto-Orient on | n/a | comp-space returns `auto_orient` → can't check | Says it can't check | Right (blind spot until T158 answers) | Mentor Overlaps' Orbit |

## Live checks for the build (builder, under the AE lock; results logged, not guessed)

- **L-1 (TD L-1)**: shape layers: with the layer (not a group) selected, does Pan Behind move the
  layer's Transform anchor, and which of `rect` and `rect_extents` matches the visible shape,
  stroke included? Until it passes, shapes aren't default candidates (FR-004).
- **L-2 (TD B-5, curriculum B5)**: does Pan Behind rewrite existing Position keys or only the value
  at the current time, and with a single key and the playhead off it, does it add a second key?
  Captured on Sled. Decides TD § 4's tip wording and § 7's hint; FR-012 item 4 grades either way.
- **L-3 (TD B-4)**: at 26.5 on the Mac: does a Pan Behind click on another layer switch to it;
  does a selected eye-off matte show its crosshair; Layer > Transform > Center Anchor Point in
  Layer Content; where a new shape layer's pivot lands. Logged before the prompt names any of them.
- **L-4 (new)**: the four mistake captures the evals need, each captured then undone: Door with a
  typed Anchor Point value; Door dragged with the Selection tool; Pan Behind on Background with
  Needle meant; Pop's pivot set at Scale 0. Plus the demo snippet on a separated, a rotated and a
  parented layer (footprint within 1 px; one Edit > Undo reverts it) and on a locked layer
  (refuses, no partial change).
- **L-5 (new)**: on Sign, does `rect` at the check time match the letters on screen (left, top,
  width and height within 1 px of a look in AE), centred and left-justified?
- **TD B-6** (what the builder's `.aep` holds) is answered by T133's capture of Mentor Practice as
  it is; TD B-1 is spec 004 T157 plus SR-1.
- **Results (2026-10-26,** `specs/011-anchor/live-sitting-2026-10-26.md` **on `skill-5-anchor`):**
  - L-1: on the layer, Pan Behind moved Lid's Transform anchor and Position together, one undo
    step; `rect` and `rect_extents` both read the shape as drawn (FR-004, row 22). On the group,
    the group's Anchor and Position changed together and the read didn't change (FR-019b). The
    crosshair of a pivot outside the shape was hard to find (FR-019a).
  - L-2: Pan Behind changes or adds one Position key, at the playhead, and leaves the others (row
    5, D-4).
  - L-3: Pan Behind acts on the layer under the cursor (FR-019, row 25); an eye-off matte shows no
    crosshair (row 12); Center Anchor Point in Layer Content exists and centres (FR-023); a new
    shape layer's pivot is at its origin, the comp's center (row 23).
  - L-4: the four mistakes captured; Pop's pivot set at Scale 0 lands far outside (row 20); the
    demo kept the footprint within 0.001 px on separated, turned and parented layers, one undo
    each; locked refused (FR-014, row 28). No snippet fix.
  - L-5: `rect` matches the letters within 1 px, centred and left-justified (row 21).
  - Mentor Practice 2 is **comp 179** in the project, with 40 layers (the stand-ins used comp 300
    and 19). Base: `mentor/test/fixtures/anchor/practice2b.json`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A live lesson on Mentor Practice 2 (one unkeyed layer, then one keyed layer) each
  reach a verified pass in **10 minutes or less** with **at most one demonstration**. *Measured
  by:* the builder, usage notes, timings from the call log (spec 004 SC-001; TD H-1 expects 5 to 10
  minutes).
- **SC-002**: The check agrees with a look in After Effects (the pivot's crosshair and the layer's
  place on screen) in **at least 9 of 10** checks across the live runs, including at least one
  mistake from L-4. *Measured by:* the builder, usage notes.
- **SC-003**: The eval cases pass **at least 80%**, with **every hard-rule check passing**, on **at
  least 12 cases** (Eval plan). *Measured by:* eval runs.
- **SC-004**: In every eval case, the mentor names a number to type for Anchor Point or Position,
  or a tolerance ("10%", "1 pixel"), **0 times**. *Measured by:* a judge rubric item on every case,
  plus a deterministic check on the "jumped" case.
- **SC-005**: In every eval case where the learner doesn't ask about it, the mentor names Quick Set
  Anchor **0 times**; in the case where the learner asks (Eval plan 8), the mentor's answer about it
  is **at most two sentences**, gives **no steps** for it (no shortcut, no menu path), and doesn't
  refuse (FR-023). *Measured by:* a deterministic check on every case (the name's count, and no
  Shift+Tab), plus a judge rubric item on case 8.
- **SC-006**: Every overlap row and the measure edges (FR-027, FR-028) pass their unit tests:
  **100%**. *Measured by:* `npm test`.
- **SC-007**: The easing set stays at **25/25 or within one case** with no hard-rule failure after
  the merge. *Measured by:* an eval run logged with the merge.
- **SC-008**: The skill's branch changes **0 existing shared files** (FR-001). *Measured by:*
  `check-branch.mjs` and `/merge-worktree` notes.
- **SC-009 (stretch)**: One live review at least one day after the first pass, with the check
  agreeing with After Effects. *Measured by:* the builder, usage notes.

## Eval plan (cases the eval engineer writes and numbers)

The eval engineer owns the cases, their numbers and fixtures; this lists what must be covered,
including TD § 14 › E. Unit tests cover the measures; evals score the teaching.

1. **First lesson, no layer in mind**: one candidate offered with a hinge, intent asked first,
   leave-outs named once each, real names (US1 #1).
2. **First lesson, layer named**: the place repeated in plain words; TD § 1's two sentences once;
   no "you can see the pivot" about a frame.
3. **Typed Anchor Point value (jumped)**: doesn't pass; "moved with it" hint with a direction; no
   numbers (SC-004).
4. **Neighbouring place on the 800 × 60 Banner**: fails; the hint names the place it's in.
5. **Pan Behind on a Scale-200% layer** (Plaque): passes (own-space measure).
6. **Pan Behind on Background instead of the focus**: the wrong-layer hint says to start the drag
   on the focus layer's own crosshair, never that selecting it first is the fix (L-3, amended
   2026-10-26).
7. **Riskiest overlap, the pop-in** (Pop set at Scale 0): fails with the rest-key hint, says the
   pivot did move though nothing showed, and asks for Edit > Undo before the second try (spec 004
   FR-034; L-4, amended 2026-10-26).
8. **Version trap** (spec 004 FR-030; TD § 15 H-3): the learner asks about Quick Set Anchor at 26.5;
   the mentor answers plainly in one or two sentences (a beta feature, the lesson uses Pan Behind,
   the check works either way), doesn't refuse, doesn't walk them through it, never says they
   don't have it, and the lesson goes on with Pan Behind (SC-005).
9. **Matte named as the target**: never called hidden; the eye-left-on sentence if its eye changed.
10. **Text, "turn from the middle"**: told the pivot is on the baseline, not that it's already there.
11. **Demonstration with two focus layers**: on the one the learner cares less about; A and
    Shift+P asked first; frames before and after; none with one focus layer (walks it through).
12. **Understanding check**: a wrong answer gets one light correction and the pass stands.
13. **Position-keyed layer named** (Sled): the tip once; a slide at another key time fails.
14. **Incomplete attempt**: names what's off and where; doesn't fix or offer to.
15. **"Just do it for me"**: declined warmly, no offer later.
16. **Review**: due, new layer, the hinge asked first, no tool named before "done", no demo.
17. **Review with no new candidate**: not offered, stays due.
18. **Can't check** (a `not_sampled` or `no_rect` result): says it can't check that layer; never
    claims it didn't move.
19. **Pivot outside, where to look** (added 2026-10-26, FR-019a): Lid named; the mentor says its
    pivot sits outside, on which side, and to select Lid in the timeline to see the crosshair; no
    distance in pixels.
20. **A group's pivot moved** (added 2026-10-26, FR-019b): `lid-group` as the attempt; the mentor
    says Lid's own pivot hasn't changed and offers the Contents possibility without claiming it.
21. **Center Anchor Point** (replaces any "no menu path" case, L-3): asked for a menu command, the
    mentor may give Layer > Transform > Center Anchor Point in Layer Content by menu path **only
    when the place is the center**, never a shortcut; for any other place it stays with Pan
    Behind.

**Fixtures (2026-10-26):** cases run on the live captures (comp 179, 40 layers, `practice2b.json`
and the L-1 to L-5 files), not the stand-ins (comp 300, 19 layers), which are deleted. On the live
comp with T241, case 1's proposal is still Door, the middle of its left edge, and the leave-outs
are many more (14 Position-keyed layers, Wobble, Hatch Rig, Seal, Reveal Matte, Background).

Plus spec 004's cross-skill cases that touch this skill (plain speech; the matte, cross-skill 3).

## Assumptions

- **Learner:** the builder on After Effects 26.5 on macOS 27.0.1 (CLAUDE.md › My setup); R0 is still
  read each session.
- **Wave B's shared pass is merged first** (tasks-wave-b.md T100 to T163, with SR-1 as T160),
  including W1 (sampled read), W2 to W4, and T136's live answer keys for comp-space. This skill builds on them;
  its checks aren't trusted until T136 passes (tasks-wave-b.md › Implementation strategy 4).
- **Mentor Practice is unchanged**; the lessons, reviews and evals use Mentor Practice 2 with its 2b
  layers and Mentor Overlaps (spec 004 FR-031).
- **Pixel measures are in the layer's own space for item 1 and comp pixels for items 2, 4 and 5**,
  per spec 004 FR-028 as amended 2026-10-23 (H-1).

## Out of scope (build scope)

- What TD § 8 doesn't teach: 3D anchors and the 3D gizmo, cameras; shape group anchors (named in a
  hint only; **not read**: a group's pivot moved by Pan Behind is invisible to this check,
  FR-019b); effect points; Collapse Transformations; animating the anchor point; snapping the
  crosshair; Quick Set Anchor; parenting and nulls (skill 6); precomposing; fixing Position keys
  after a pivot change.
- **Expressions with no keys on Rotation or Scale** (R2, wave D): a rest pose they drive isn't seen.
- **Text animators and Source Text keys** changing the letters' box over time (R6).
- **Auto-oriented layers** until T158 answers (comp-space returns "can't check").
- **A rotated preview frame** (TD B-7, not built).
- **Any demo that keys, or that writes more than one layer.**
- **A diagnosis finding for pivots** (spec 005).
- **Ranking by the learner record across skills** (a layer another skill's lesson used ranks down;
  rejected 2026-10-26, FR-004 › Changes) and any read of shape group transforms.
- **Panel screens** for this skill (spec 007).
- **Any change to shared files** (FR-001): requests only.

## Changes

### 2026-10-26: from the live sitting and the desk block, before T236

Evidence: `specs/011-anchor/live-sitting-2026-10-26.md` and commits `96c6bcf`, `a39d827` on
`skill-5-anchor` (the answer key's notes and `SKILL.md`).

1. **Ranking (FR-004, FR-024).** The builder's approach: keep shapes as default candidates (L-1
   showed it's sound) and add a ranking rule so the lesson proposes a layer fit for this skill.
   **Chosen:** a three-step "how animated already" key (no keys at all, then keys but none on
   Rotation or Scale, then Rotation or Scale keys), where TD § 4 had two. It reads only the comp,
   so it's the same for a new learner, an eval and the builder; it's right on a real comp, where
   the layers already animated are the learner's own work; and it extends a step TD § 4 already
   has, for the same reason. Door is proposed and the review picks Tab (with Door and Needle
   recorded), as the quickstart expects. **Rejected:**
   - *Rank down a layer another skill's lesson used (the learner record).* The record only knows
     lessons run in Knack, so a learner's own animated layers, an eval and a fresh record would
     still get Blink; the snapshot tool reads only this skill's past targets today, so it would
     need a shared change (FR-001); and the proposal would change with the record, not the comp.
   - *Prefer a layer whose pivot is plainly off its natural place.* It doesn't separate Blink from
     Door (both pivots sit at their centers), and it reverses D-3's tie-break, which ranks a pivot
     still where AE put it first because moving a moved pivot is fixing, not learning.
   - *Shapes back to "allowed if named".* L-1 passed; it would hide Lid and Banner, which the set
     was built for, and a learner's own comp is often mostly shapes.
   - *Change the quickstart to expect Blink.* Blink is key types' layer with hold keys, a poor
     hinge, and it would teach on a layer the learner just finished.
2. **Pivot outside (FR-019a).** The tools now give the side on screen. Rejected: a prompt-only
   "look around the shape" (as T235 had to write; vague, and TD § 7's hint already names a side)
   and a side in the layer's own space (wrong on a flipped or turned layer, row 18).
3. **Group anchor (FR-019b, row 22).** Reworded for the case the read can see (nothing changed on
   a shape) plus the rectangle-shift case renamed. Rejected: dropping it; a group transform read.
4. **Pop at Scale 0 (FR-019, row 20).** The grading stands (set away from rest, one hint); the hint
   adds "it did move" and Edit > Undo. Rejected: grading it as outside (it names a symptom, and the
   fix is the rest key either way) or adding both hints (two hints for one mistake). The teaching
   wording goes to the designer (Open questions › D, item 5).
5. **Sample times (FR-013).** 30 needed on the live comp, two reads at every lesson start there;
   FR-013's text now matches research R4. Nothing assumed one read.
6. **Live results folded in:** rows 5, 12, 16, 20 to 23, 25, 28; FR-014 (L-4's lock cases);
   FR-019's wrong-layer wording (L-3); FR-023 (Center Anchor Point, L-3); the Live checks › Results.
7. **New open question D-4** (Sled, two or more Position keys can't pass).

## Open questions

### For the human (H): all answered 2026-10-23, as recommended

1. **H-1, spec 004 FR-028's wording.** Approved: FR-028 keeps only its two measures (per axis 10% in
   the layer's own space; 1 px at the check time) and points here for the 3 px floor, the check
   time and items 3 to 5. Made in spec 004 the same day.
2. **H-2, the 3 px floor** (S-3). Approved; tuned on the live run (SC-002) if needed.
3. **H-3, Quick Set Anchor not brought up in this build.** Approved, with the designer's condition
   (TD § 15): if the learner asks, one or two plain sentences, no refusal, no walkthrough (FR-023,
   SC-005, Eval plan 8). Revisit if a live check shows R0 can tell a beta build.
4. **H-4, a lesson this short as its own skill.** Approved: kept separate; SC-001's timing says
   whether it feels thin.
5. **H-5, the mentor suggests a hinge** when the learner has none in mind. Approved.

### For the curriculum designer (D): D-1 to D-3 answered in TD § 15; D-4 open (2026-10-26)

1. **D-1, a Rotation-only layer with no key at 0 or a whole turn**: the key closest to 0 or a
   whole turn, one sentence, "is that how it looks at rest?" (FR-011).
2. **D-2, locked layers**: allowed if named with the unlock sentence, never proposed, never the
   demo; the hint names the lock if it's still locked at "done" (FR-004, FR-019, row 28).
3. **D-3, "a pivot still where AE put it"**: widened by the designer to the rectangle's center or
   the layer's own origin (0, 0), for every layer type (FR-004's ranking).
4. **D-4, a layer with two or more Position keys (open 2026-10-26; row 5, US2 #4, eval 13).** L-2
   shows Pan Behind changes or adds one Position key, at the playhead, and leaves the others, so
   the layer always slides at its other keys and item 4 fails. As written, a lesson on Sled has no
   taught way to pass; the only fix is shifting every Position key, which TD § 8 leaves out. With
   one Position key and the playhead on it, Pan Behind rewrites that key and it passes.
   **Recommended:** two or more Position keys moves from "allowed if named" to **not a
   candidate**, with one sentence ("Sled already moves, so moving its pivot now would make it jump
   at its other keys. It's simplest to set the pivot before you key; pick a layer that doesn't move
   yet"); one Position key stays allowed if named, with the tip asking for the playhead on that
   key. Alternative: keep Sled allowed and tell the learner up front it can't pass, which teaches
   the trap but leaves a lesson that can't end in a pass. A third, untested: whether Pan Behind
   with every Position key selected shifts them all (a new live check); if it does, that could be
   the taught way. Not a T236 blocker (Door); it changes US2 #4, eval 13, a reason code and its
   tests, tasked once answered.

**TD wording to confirm (2026-10-26, for the cockpit to pass on; this spec doesn't edit
`teaching-design.md`):**

1. **§ 4 ranking:** a new step, a layer with no keys at all before one with keys (FR-004); § 12's
   review pick follows it.
2. **§ 4 candidate table and demo rule:** L-1 passed, so "shape layer: yes, once L-1 passes" and
   the demo rule's "not shape until L-1" can drop their condition. D-3's "new shape layers start at
   their origin" holds, but L-3 shows that origin is the comp's center, away from the drawn shape.
3. **§ 7, the group row:** what the check sees is **no change at all** (L-1), not "bounds moved".
   Proposed wording (FR-019b): "Lid's own pivot, under Transform, hasn't changed. If you dragged a
   pivot inside Contents, that one belongs to the shape's group: select Lid itself in the timeline
   and drag its crosshair." Plus a wording for "what's drawn moved, its pivot didn't" on any layer
   (`content_shifted`; on text, a justification change).
4. **§ 7, the outside row:** it names a side ("off to its right"), which the tool now gives
   (FR-019a). Proposed: add where to look ("select Lid in the timeline; its crosshair is below the
   lid").
5. **§ 4 rest pose and § 7's rest row, Pop at Scale 0:** § 4 says nothing visible moves, which
   L-4 confirms, but the learner reads it as "it wouldn't let me drag", and AE puts the pivot far
   outside (Pop: [120, 960]), not near the rest place. Proposed hint: "Pop is still shrunk at 3.3 s,
   so nothing showed, but its pivot did move, far below it. Edit > Undo, put the playhead on 4.3 s,
   where it's full size, and set the pivot there." § 13's "set while Badge was shrunk at first"
   still fits.
6. **§ 7, the wrong-layer and another-layer-moved rows:** "select Needle in the timeline first" is
   wrong at 26.5; Pan Behind moves the pivot under the cursor (L-3). Proposed: "start the drag on
   Needle's own crosshair".
7. **§ 9's shape row** says bounds include the stroke; L-1's Lid has no stroke, so that's
   untested. **§ 9's text row**: left-justified, the letters start 2.45 px right of the pivot
   (L-5). **§ 11 / B-4:** Center Anchor Point in Layer Content is confirmed at 26.5. **§ 7's
   slid-at-key row** ("exact wording waits for B5"): L-2 answered it; `SKILL.md` now says Pan
   Behind changed only the key at the playhead, or added one there.

### For the eval engineer (E)

- The Eval plan, with fixtures from L-4's captures and T135's anchor capture.
- **2026-10-26:** the cases on `evals-skill-5` were built on stand-ins (comp 300, 19 layers). Move
  them to the live captures (Eval plan › Fixtures) and to what changed: shapes aren't
  `shape_until_l1` any more (7 files name it); case 6's "select it first" and case 20's "no menu
  path" contradict L-3; case 7 adds Edit > Undo; cases 19 to 21 are new. Wait for T241 to T244
  before a baseline.

## Dependencies

- **Spec 004 wave B shared pass** (tasks-wave-b.md T100 to T163, approved 2026-10-23) merged, and
  T136's live answer keys passing.
- **Shared-code requests** (to spec 004's shared-code owner; not this skill's work):
  - **SR-1 (approved 2026-10-23; tasks-wave-b.md T160, amending T157 and T132):** confirm T157's skill 5 set (Door, Needle, Banner,
    Sign, Lid, Gauge, Pop, Sled, Hatch with Hatch Rig, Tab, Peg) with these details: Sign is a
    centred text layer; Gauge's Rotation keys are 0 → 90 (rest key at 0); Pop's Scale 0 → 100;
    Sled has three Position keys; Lid's pivot is outside its shape. And **add four layers** for
    overlap rows 4, 10, 17 and 18: **Plaque** (a solid at Scale 200%, no keys: the own-space
    measure), **Flip** (a solid at Scale [-100, 100], no keys: own sides), **Wobble** (a solid with
    Anchor Point keys: never a candidate), **Seal** (a layer of Icon Precomp with Collapse
    Transformations on). All follow T132's rules (no clashing names, starts, Opacity or ease).
    The answer key adds each layer's anchor place (which of the nine, or none) and its rest key, so
    this skill's tests read it. Without them rows 4, 10, 17 and 18 would be synthetic only.
  - **SR-2 (approved 2026-10-24; tasks-wave-b.md T164, T165; the same as spec 012's SR-4):** the
    comp's `width` and `height` in the snapshot, for FR-004's full-frame bucket (plan › Requests).
- **Spec 012** (null parenting, in parallel): shares Mentor Practice 2b and comp-space; no
  dependency either way beyond skill 5 being skill 6's hard prerequisite in the path.
- **Eval engineer**: the Eval plan; fixtures from L-4 and T135.
