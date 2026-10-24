# Feature Specification: Set the pivot (curriculum skill 5)

**Feature Branch**: `011-anchor` (spec folder only; no git branch)

**Created**: 2026-10-23

**Status**: Draft, awaiting approval. Plan and tasks come after the builder's yes.

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
spec keeps FR-028's two measures and adds the rest here, and the matching edit to FR-028 is H-1.

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

**Assumed approved:** tasks-wave-b.md's W1 to W4 and W7 as recommended (Q1). If W1 (sampled read)
is declined, FR-011's fallback applies and Position-keyed layers stay out entirely (TD § 10).
**Needs changing:** spec 004 FR-028's wording (H-1). One shared-code request goes to spec 004's
owner as T160 onward (Dependencies › SR-1).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set a layer's pivot without it moving (Priority: P1)

I want my door to swing from its left edge. I start the lesson on Mentor Practice 2. The mentor asks
which layer I want to turn from somewhere other than its middle and where it should turn from,
shows me a frame from my comp, and tells me Door's pivot is at its center. I press Y, drag the
crosshair to Door's left edge, and say "done". It checks that the pivot is on the left edge and
that Door didn't move, then asks which part will stay still when it turns, and has me drag Rotation
to see it swing.

**Why this priority**: it's the whole skill (TD § 2), on the target set built for it (spec 004
T157, as amended by SR-1).

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
   (FR-012 item 4).

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
  for another. A hidden layer, a matte, a guide or a Position-keyed layer can be named (TD § 4).
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
    comp-space footprint readable at its sample times (FR-018). Shape layers become default
    candidates only after live check L-1 passes; until then they're allowed if named.
  - **Allowed if named, never proposed:** shape layers before L-1; Position keyed (any count,
    including one); *hidden by the learner* (with TD § 4's sentence); *matte*; *guide*; a
    full-frame layer (last resort, proposed only when nothing else exists).
  - **Never:** Anchor Point keyed; an expression on a keyed Rotation or Scale; 3D; a precomp with
    Collapse Transformations on; *null*, camera, light, adjustment layer. Each gets TD § 4's one
    sentence.
  - **Ranking** (TD § 4): unparented first; then no Rotation or Scale keys; then a pivot still at
    the place AE put it (D-3 says how that's read); then smaller over full-frame. Ties go to the
    comp's layer order. Deterministic and unit tested.
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
    how it looks at rest; with only Rotation keyed and no key at 0 or a whole turn, D-1's rule.
    The learner can name another key as the rest pose instead; their answer replaces it in
    `skill_options`. Ties go to the earliest time;
  - otherwise the lesson's first read's current time.
  The mentor MUST name the rest key in plain words and ask for the playhead there before the
  learner starts (TD § 4). The check MUST measure at the check time from the sampled read (W1),
  never at "the playhead now". If W1 is declined, the check instead requires the check read's
  current time within half a frame of the rest key, and the hint asks for it (TD § 6 item 3).
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
  with `takeSnapshot()`, and, when a candidate has Rotation, Scale or Position keys and children,
  a second read with those key times as `sample_times`, used as the lesson's baseline (so its
  children are sampled at the rest key); `anchor_check` MUST pass the baseline's check times,
  current time and Position key times as `sample_times`. A time missing from either read makes
  that comparison unreadable (FR-018), never a pass.

### Demonstration

- **FR-014 (demo target, FR-024 of spec 004)**: `anchor_demo` MUST make one change on the lesson's
  demo target only, once per lesson, never in a review, and the session MUST refuse any other
  target before AE is touched. With **two** focus layers the demo target is the one the learner
  cares less about (the one the mentor offered, or the second they named), if it's a default
  candidate (FR-004, shape layers excluded until L-1) and, if it has Rotation or Scale keys, the
  current time is on its rest key; else the other if it qualifies; else none. With **one** focus
  layer, none (the session's single-target rule already enforces it; a unit test pins it). The
  prompt runs it only when asked or clearly stuck (TD § 4).
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
  the nine, or "outside the layer", or "between"), whether the anchor and Position changed, which
  way and roughly how far the footprint moved (in comp pixels, for the hint's direction only),
  whether the layer's own rectangle shifted with the anchor unchanged (a shape group's anchor),
  whether the read's current time is the rest key, and items 1 to 5. And, as **other changes**, not
  graded: any other layer whose anchor changed (Pan Behind grabbed it), any layer whose eye switch
  changed (a matte's eye left on), new keys on Anchor Point or Position anywhere, and any layer
  added, removed or renamed. These MUST be read from `layer_info` for every layer, **not** from
  `unexpectedChanges()`, which sees keyed properties only and would miss every unkeyed anchor
  change (overlap filter 1). The skill prompt turns the result into TD § 7's hints: name the layer,
  what moved and where to look, never the numbers to type (spec 002 FR-008). Each TD § 7 row MUST
  map to one field combination, unit tested.
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
  hint, and in this build MUST NOT mention it at all: R0 can't tell a beta build from the release
  (FR-030's open point), so the "only if R0 shows it" mention waits for a live check that it can.
  A learner who uses it anyway is checked like any method. It MUST NOT name Center Anchor Point in
  Layer Content until L-3 confirms the menu path at 26.5, and then by menu path only, for the center
  place. It MUST NOT teach snapping the crosshair. The Properties panel gets "you may also see it
  there", no more (TD § 11).
- **FR-024 (review mode)**: `anchor_snapshot` with `mode: "review"` MUST drop every layer in the
  record's past targets for this skill on this comp and project, and pick from default candidates
  only, preferring ones with no Rotation or Scale keys (TD § 12). With none left, `no_new_target`
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
   shapes and L-5 for text, or a stroke could move "the bottom edge" between the two items.
6. **`comp-space.mjs`'s `null` with a reason** (`not_sampled`, `three_d`, `no_rect`, …) is one value
   for "can't read". Treated as "no movement" it would pass anything (the playbook's "unreadable
   treated as empty"); FR-018 makes it "can't check".

| # | Overlap | Focus sees | Check sees | Learner is told | Right? | Test |
|---|---|---|---|---|---|---|
| 1 | Expression on a keyed Anchor Point or Position | Not a candidate | n/a | "An expression drives Door's Position, so moving its pivot may not show" | Right | Synthetic (no capture has one); demo refuses it |
| 2 | Expression on an unkeyed Anchor Point or Position | Not read (R2); a candidate | Rendered values (after expressions, W2), so the check grades what shows; a pivot that didn't move after "done" gets TD § 9's sentence | "If something drives it, like an expression, I can't see that yet" | Right (blind spot, stated) | Mentor Overlaps' Drift (unkeyed Position expression): the check reads the rendered value |
| 3 | Expression on Rotation or Scale | Keyed: not a candidate. Unkeyed: not read (R2) | n/a | "An expression turns Logo, so I can't tell where it sits at rest"; never "the expression ignores the pivot" | Right for keyed; unkeyed is a known blind spot (Out of scope) | Mentor Practice's Logo; Mentor Overlaps' Gauge Dial |
| 4 | Keys on Anchor Point | Not a candidate | A key added on the focus fails item 5 | TD § 4 sentence; stopwatch hint (TD § 7) | Right | 2b's Wobble (SR-1); synthetic stopwatch-on case |
| 5 | Position keyed, including a single key | Allowed if named | Item 4 at every Position key time; a key added is an other change | TD § 4's tip | Right if L-2 shows how Pan Behind treats keys; item 4 catches a slide either way | 2b's Sled; L-2 capture with one key and playhead off it |
| 6 | Hold keys on Position | As row 5 | Item 4 at each key time, not between | n/a | Right; never blames the pivot for a hold jump | Synthetic hold-key Sled |
| 7 | Separated X and Y Position | Footprint from bounds, so either | As focus | n/a | Right; demo writes X and Y (FR-015) | Mentor Overlaps' Leaf 2 (separated); demo twin test |
| 8 | Effects (a glow, a Transform effect) | Footprint without effects (`rect`) | Effect points don't move; not read | Only if an effect key is a Transform effect: TD § 9 sentence | Right | Synthetic; Mentor Practice's Glow is an adjustment layer (not a candidate) |
| 9 | Precomp layer | Candidate, ranked below; edges are the precomp's frame | Footprint of the frame | "Icon's edges are its precomp's frame, 400 × 400, not the square inside it" | Right | Mentor Practice's Icon |
| 10 | Precomp with Collapse Transformations on | Not a candidate (`collapse`, W4) | n/a | One sentence | Right once W4 lands; **contract** | 2b's Seal (SR-1) |
| 11 | Hidden by the learner | Allowed if named; never the demo | As any | TD § 4 sentence | Right | Mentor Practice's Old Take |
| 12 | Matte, eye off | Allowed if named; never the demo | Its eye switch compared: left on is an other change | Never "hidden"; "turn its eye back off" | Right | Mentor Overlaps' Wipe; 2b's Reveal Matte |
| 13 | Guide, shy | Guide allowed if named; shy a candidate, ranked below | As any | TD § 4 | Right | Mentor Overlaps' Guide Grid; synthetic shy candidate |
| 14 | Null, camera, light, adjustment | Never | n/a | Nulls: skill 6's job, only if built | Right | Mentor Practice's CTRL, Glow |
| 15 | Parented layer | Candidate, ranked below; parent named once | Comp-space footprint includes the parent; FR-037's hand-off off | "Hatch rides on Hatch Rig; that doesn't change where its own pivot goes" | Right; never grades raw Position | 2b's Hatch; T135's anchor capture |
| 16 | Layer with children | n/a | Children compared at the focus's check time only (FR-012 item 5) | n/a | Right; children at other times are meant to turn | 2b's Hatch Rig as focus (synthetic until L-4) |
| 17 | Scale not 100%, non-uniform, or a parent's scale | Place in the layer's own space | Same | n/a | Right (S-2) | 2b's Plaque at 200% (SR-1) |
| 18 | Negative scale (flipped), or a static rotation far from 0 | Ranked last | Own-space sides | "Banner is flipped, so I'll go by its own sides" | Right; the sentence is the only guard against screen words | 2b's Flip (SR-1) |
| 19 | Rotation keyed | Rest key named (FR-011) | Checked at the rest key | Names the rest key | Right | 2b's Gauge |
| 20 | Scale keyed from 0 (a pop-in) | Rest key = full-size key | At the rest key; a pivot set at Scale 0 fails | TD § 7 rest hint | Right; the case S-1 exists for | 2b's Pop, with L-4's "set while shrunk" capture |
| 21 | Text layer | Candidate; pivot starts on the baseline | `rect` is the letters' box at the check time; Source Text keys or animators change it (R6 not read) | "Title's pivot starts on its baseline, under the letters" | Right if L-5 confirms `rect` matches the letters | 2b's Sign |
| 22 | Shape layer | Allowed if named until L-1 | Layer anchor only; a shifted rectangle with the anchor unchanged is the group-anchor hint | TD § 7 group hint | Waits for L-1 | 2b's Lid, Banner; L-1 capture |
| 23 | Shape whose pivot sits outside it | Candidate (after L-1) | Item 1 reads "outside the layer" | "Lid's pivot sits outside the lid" | Right | 2b's Lid |
| 24 | 3D layer | Never (`three_d`) | comp-space returns `three_d` | One sentence | Right once W4 lands; **contract** | Mentor Overlaps' Depth |
| 25 | Pan Behind on the wrong layer | n/a | Focus unchanged (item 1 fails); another layer's anchor changed with its footprint still (an other change, item 5 holds) | "Needle's pivot hasn't moved, but Background's did. Select Needle in the timeline first" | **Gap fixed by FR-019** (filter 1) | L-4 capture |
| 26 | Playhead moved between reads | n/a | Compared at the check time from samples, not at the playhead (FR-011, FR-013) | n/a | Right with FR-013; **contract** (W1) | Synthetic two reads at different `comp.time` |
| 27 | A time not sampled in one read, a layer with no rectangle | n/a | "Can't check" (FR-018) | Says it can't check that layer | **Gap fixed by FR-018** (filter 6) | Synthetic `not_sampled` and `no_rect` |
| 28 | Locked layer | Not a default candidate (D-2) | Demo refuses | One sentence | Right; R1 reads `locked` | Mentor Overlaps' Locked Bar |
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
- **SC-005**: In every eval case, Quick Set Anchor is named **0 times**, including when the learner
  asks for it (FR-023). *Measured by:* a deterministic check.
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
6. **Pan Behind on Background instead of the focus**: "select it first" hint.
7. **Riskiest overlap, the pop-in** (Pop set at Scale 0): fails with the rest-key hint (spec 004
   FR-034).
8. **Version trap** (spec 004 FR-030): the learner asks for Quick Set Anchor at 26.5; not walked
   through it, not named, Pan Behind taught (SC-005).
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

Plus spec 004's cross-skill cases that touch this skill (plain speech; the matte, cross-skill 3).

## Assumptions

- **Learner:** the builder on After Effects 26.5 on macOS 27.0.1 (CLAUDE.md › My setup); R0 is still
  read each session.
- **Wave B's shared pass is merged first** (tasks-wave-b.md T100 to T158, plus SR-1), including W1
  (sampled read), W2 to W4, and T136's live answer keys for comp-space. This skill builds on them;
  its checks aren't trusted until T136 passes (tasks-wave-b.md › Implementation strategy 4).
- **Mentor Practice is unchanged**; the lessons, reviews and evals use Mentor Practice 2 with its 2b
  layers and Mentor Overlaps (spec 004 FR-031).
- **Pixel measures are in the layer's own space for item 1 and comp pixels for items 2, 4 and 5**,
  per spec 004 FR-028's split once H-1 is approved.

## Out of scope (build scope)

- What TD § 8 doesn't teach: 3D anchors and the 3D gizmo, cameras; shape group anchors (named in a
  hint only); effect points; Collapse Transformations; animating the anchor point; snapping the
  crosshair; Quick Set Anchor; parenting and nulls (skill 6); precomposing; fixing Position keys
  after a pivot change.
- **Expressions with no keys on Rotation or Scale** (R2, wave D): a rest pose they drive isn't seen.
- **Text animators and Source Text keys** changing the letters' box over time (R6).
- **Auto-oriented layers** until T158 answers (comp-space returns "can't check").
- **A rotated preview frame** (TD B-7, not built).
- **Any demo that keys, or that writes more than one layer.**
- **A diagnosis finding for pivots** (spec 005).
- **Panel screens** for this skill (spec 007).
- **Any change to shared files** (FR-001): requests only.

## Open questions

### For the human (H), each with a recommendation

1. **H-1, spec 004 FR-028's wording** (the cockpit's known conflict). FR-028 says "10% of the
   layer's width" without a space, and "comp-space bounds at the current time". This spec measures
   the place in the layer's own space (S-2), adds a 3 px floor (S-3), checks at the rest key rather
   than the current time, and adds items 4 and 5 (S-1). **Recommended:** amend FR-028 to keep only
   its two measures (per-axis 10%, 1 px), say "in the layer's own space" for the first and "at the
   check time" for the second, and point to spec 011 for the floor, the check time and items 3 to
   5. A spec-writer task on spec 004, not done here.
2. **H-2, the 3 px floor** (S-3, a guess). **Recommended:** take it now and tune it on the live run
   (SC-002); it only matters on layers under 30 px on an axis.
3. **H-3, Quick Set Anchor never mentioned this build** (FR-023). FR-030 allows one sentence "only
   if R0 shows a build that has it", but R0 can't tell a beta build today. **Recommended:** never
   mention it in this build; revisit if a live check shows R0 can tell.
4. **H-4, a lesson this short as its own skill** (TD H-1, curriculum H6). **Recommended:** keep it
   separate as decided; SC-001's timing on the live run says whether it feels thin.
5. **H-5, the mentor suggests a hinge** when the learner has none in mind (TD H-2). **Recommended:**
   keep it, as skill 1 does with a practice blink; the learner can always name another place.

### For the curriculum designer (D)

1. **D-1, a Rotation-only layer with no key at 0 or a whole turn** (say 30° → 90°). TD § 4's rest
   rule doesn't cover it. **Recommended:** the key closest to 0 (mod 360), said in one sentence,
   and ask whether that's how it looks at rest (as the Scale tie-break does).
2. **D-2, locked layers.** TD § 4's table doesn't list them; Pan Behind can't drag a locked layer.
   **Recommended:** allowed if named, with one sentence to unlock it (the lock switch), never
   proposed and never the demo.
3. **D-3, "a pivot still where AE put it"** (TD § 4's ranking). The read can't see a layer's
   history. **Recommended:** read it as the anchor at the rectangle's center (solids, precomps,
   footage) or at the text origin (0, 0) for text, which is where AE puts it; anything else ranks
   below.

### For the eval engineer (E)

- The Eval plan, with fixtures from L-4's captures and T135's anchor capture.

## Dependencies

- **Spec 004 wave B shared pass** (tasks-wave-b.md T100 to T158) merged, with W1 to W4 and W7
  approved, and T136's live answer keys passing.
- **Shared-code requests** (to spec 004's shared-code owner, for tasks-wave-b.md T160 onward; not
  this skill's work):
  - **SR-1 (T157 targets, as T160 and T161):** confirm T157's skill 5 set (Door, Needle, Banner,
    Sign, Lid, Gauge, Pop, Sled, Hatch with Hatch Rig, Tab, Peg) with these details: Sign is a
    centred text layer; Gauge's Rotation keys are 0 → 90 (rest key at 0); Pop's Scale 0 → 100;
    Sled has three Position keys; Lid's pivot is outside its shape. And **add four layers** for
    overlap rows 4, 10, 17 and 18: **Plaque** (a solid at Scale 200%, no keys: the own-space
    measure), **Flip** (a solid at Scale [-100, 100], no keys: own sides), **Wobble** (a solid with
    Anchor Point keys: never a candidate), **Seal** (a layer of Icon Precomp with Collapse
    Transformations on). All follow T132's rules (no clashing names, starts, Opacity or ease).
    The answer key adds each layer's anchor place (which of the nine, or none) and its rest key, so
    this skill's tests read it. **Recommended: yes**; four layers in an existing script, and without
    them rows 4, 10, 17 and 18 are synthetic only.
- **Spec 012** (null parenting, in parallel): shares Mentor Practice 2b and comp-space; no
  dependency either way beyond skill 5 being skill 6's hard prerequisite in the path.
- **Eval engineer**: the Eval plan; fixtures from L-4 and T135.
