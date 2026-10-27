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
FR-023 take the live results. **Amended again 2026-10-26 (round 2)** from the designer's answers
(TD § 16, approved by the builder, `8ab6adc`): D-4 closed, so a layer with Position keys at two or
more times is never a candidate (new reason `position_moves`, FR-004), and the hints for rows 20,
22, 23 and 25 point at TD § 7 and § 16 for their wording instead of carrying this spec's own
(FR-019, FR-019a, FR-019b). New tasks T245 to T248 (tasks.md › Phase 8c). Three small wording
questions for the designer (D-5 to D-7). Approved by the builder; T245 to T247 built on
`skill-5-anchor`. **Amended again 2026-10-26 (round 3)**, both items approved by the builder:
the watch offer with one focus layer (TD § 17, `f7545e2`: FR-008, US1 #5 and #7, a new
`watch_offer` field, Eval plan 11 and 23) and the lesson-start speed after T236 and T237's
10 to 12 s snapshots (FR-013a, SC-010); plus FR-004's precedence rule and rows 12, 28 and 29 from
Phase 8c's hand-back. New tasks T249 to T253 (tasks.md › Phase 8d). **Amended again 2026-10-26
(round 4)** from the designer's answers to D-8 and D-9 (TD § 18, `47c90bd`, approved by the
builder): a one-key layer whose rest key is on another frame stays `position_moves` but gets
TD § 18's two-frames sentence, and the tool says which case it is with both times (new
`moves_case`, FR-004, B-9; US2 #6, row 5b, Eval plan 24); `watch_offer` never picks a full-frame
layer (FR-008, D-9). D-8 and D-9 closed. New tasks T254 to T256 (tasks.md › Phase 8e).
**Amended again 2026-10-26 (round 5), awaiting the builder's approval** of this spec's parts
(TD § 19 itself was approved by the human the same day): the opening turn carries one choice
(memory clause only for this skill's history, the intent question, the proposal) and no
leave-outs or statement of the idea; each leave-out's sentence is said when the learner names that
layer (TD § 19, S-5: new FR-006a, FR-009, US1 #1, Edge Cases, Eval plan 1); D-7 is withdrawn
from the opening. The `one_key_off_rest` entry gets ready-to-say time labels, so the mentor never
rounds a time itself (new **`position_key_label`** and **`rest_label`**, FR-004, B-11), and the
short fallback when a time can't be read is written down (FR-004, accepted by the human). The Eval
plan lists cases 25 to 31 (kept by the eval engineer) and splits 11 (the one-focus watch offer)
from 26 (the two-layer demo). New tasks T257 and T258 (tasks.md › Phase 8f) and an HO-1 update.
**Amended again 2026-10-26 (round 6), awaiting the builder's approval** of this spec's parts
(TD § 19a itself was decided by the human the same day): a practicing lesson always proposes the
read's `proposal`, and the record's `next` gives only the memory clause (FR-006a, US1 #8); a
named null, camera, light or adjustment layer gets TD § 19a's sentence, then the proposal, with
no pointer to the null lesson (FR-004, FR-009, US1 #9, Edge Cases, row 14); a continued lesson
with no focus yet opens as a new one (FR-006a, the builder's call as built; Open questions ›
D-10). Eval plan 32 to 37 (two from TD § 19a, three the builder suggested in round 5, and a
same-label case). New task T259 (tasks.md › Phase 8g, B-12) and an HO-1 update.
**Amended again 2026-10-26 (round 7), awaiting the builder's approval** of this spec's parts
(TD § 19b, S-6, decided by the cockpit under the human's go-ahead the same day): a full-frame
layer is never proposed, so with no default candidate `proposal` is null and the opening is the
new-solid line (FR-004, FR-006a, Edge Cases); nothing is said about effects in this release
(row 8); "own sides" is for flipped layers only, and a static rotation far from 0 ranks last with
no sentence (row 18); live check **L-8** (an expression on an unkeyed Anchor Point or Position)
joins L-6 at the next sitting, and row 2 stays "blind spot, stated" until it's seen; **D-10
answered** (a continued lesson with no focus opens as a new lesson, with the practicing memory
clause when the record says practicing; FR-006a, US1 #10). The Eval plan follows the eval
engineer's rounds 5 and 6 (case 1 in one turn; case 34's checked turn is turn 2; the universal
`no_text_before_snapshot` check). New tasks T260 (B-13, `SKILL.md`) and T261 (L-8, 🖐)
(tasks.md › Phase 8h).

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
   no layer in mind, **Then** the mentor's first turn asks the intent question, offers one default
   candidate with a hinge that suits its shape in one sentence as the fallback (TD § 4), and ends
   on the learner's choice. It names no leave-outs, doesn't state the lesson's idea, and recaps no
   other skill (FR-006a, TD § 19, amended round 5). A leave-out's sentence comes only on the turn
   the learner names that layer (FR-009).
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
   isn't one on their layer; the mentor walks it through in words (FR-014) and, on a first lesson,
   offers a watch on another layer once (FR-008, TD § 17); a yes runs it there, never on theirs.
6. **Given** a pass, **When** the mentor asks which part stays still when it turns, **Then** a wrong
   answer gets one light correction and the pass stands (FR-020).
7. **Given** a first lesson (no pass of this skill in the record) with Door as the one focus layer
   on Mentor Practice 2, **When** the mentor invites the learner to try, **Then** the turn's last
   sentence offers a watch on Needle (`watch_offer`) once, in one sentence, and `anchor_demo` isn't
   called; **When** the learner says no, just tries, or says "done", **Then** there's no second
   offer, not after a failed check either; **When** they say yes, **Then** the focus becomes Door
   then Needle, the mentor names Needle's place in one sentence, and the demo runs on Needle only
   (FR-008, FR-014).
8. **Given** a practicing lesson (this skill has history, and the record's `next` names a layer,
   say Pop), **When** the lesson starts, **Then** the first turn opens with one memory clause from
   `next`, asks the intent question, and proposes the snapshot's `proposal` layer at its
   `suggested_place`, not the layer `next` names; **When** the learner names Pop instead, **Then**
   Pop is handled like any named layer (FR-006a, TD § 19a item 1; round 6).
9. **Given** the learner names a null (Mentor Practice's CTRL), a camera, a light or an adjustment
   layer, **When** the mentor answers, **Then** it says TD § 19a item 2's sentence once, with the
   layer's name and kind, then the proposal in one sentence, ending on the offer; no turn mentions
   a null's pivot, the null lesson or another skill (FR-009, TD § 19a item 2; round 6).
10. **Given** a lesson left open before a layer and place were chosen (no focus in the session),
    **When** it's continued, **Then** it opens as a new lesson, with no "where we left off" line:
    the intent question and the proposal, preceded by one memory clause only when the record shows
    this skill practicing (FR-006a, TD § 19b item 5c, D-10; round 7).

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
4. **Given** the learner names Sled (Position keys at three times), **When** the mentor answers,
   **Then** it says TD § 4's leave-out sentence for a layer that already moves once, runs no
   lesson on Sled, and offers another layer as usual (FR-004 `position_moves`; TD § 16 D-4). It
   never says Sled would "jump".
5. **Given** a layer with one Position key and no Rotation or Scale keys, named by the learner,
   **When** the lesson is set up, **Then** the mentor names the key's time and asks for the
   playhead right on it before the drag (TD § 4); **When** the learner drags with the playhead off
   the key, **Then** it doesn't pass (FR-012 item 4) and the slid hint asks for Edit > Undo
   (FR-019).
6. **Given** the learner names a layer with one Position key whose rest key (the tool's, or their
   own `rest_time`) is more than half a frame from it (round 4, D-8), **When** the mentor answers,
   **Then** it says TD § 18's two-frames sentence once, with both times as the tool's labels
   give them (`position_key_label`, `rest_label`; round 5, B-11), runs no lesson on it, and offers
   another layer as usual (FR-004 `moves_case`). It never says "its other keys" or "jump" about
   that layer. If either time is missing, it says FR-004's short "already moves" line instead.
   Synthetic only: Mentor Practice 2 has no such layer (FR-004).

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
- **No candidate in the comp**: no default candidate (a background doesn't count; round 7, TD
  § 19b item 1), so `proposal` is null: offer a new solid (Layer > New > Solid, a small
  rectangle), then a fresh read (TD § 4). A background, hidden layer or matte the learner names is
  still handled as named (FR-004); the mentor never offers one. In a review: no review.
- **The learner names a layer the table leaves out** (null, 3D, Anchor Point keyed, expression on
  Rotation or Scale, collapsed precomp, camera, light, adjustment): one sentence from TD § 4 and ask
  for another. A null, camera, light or adjustment layer gets TD § 19a item 2's sentence instead,
  then the proposal, and never a pointer to the null lesson or a word about a null's pivot (round
  6, FR-009). A layer whose Position is keyed at two or more times is left out the same way
  (TD § 4's "already moves" sentence, D-4), and so is a one-key layer whose rest key is on another
  frame, with TD § 18's two-frames sentence instead (D-8, FR-004 `moves_case`). A hidden layer, a matte, a guide, a layer with one
  Position key (on the check time, FR-004) or a locked layer can be named (TD § 4; a locked one
  gets the unlock sentence, D-2), unless it already moves: "never" comes first (FR-004
  precedence). Each of these sentences is said on the turn the learner names the layer, never in
  the opening (FR-009, TD § 19).
- **The learner asks which layers they can use, or why a layer wasn't suggested** (round 5,
  TD § 19): the mentor answers that question, naming up to three default candidates, and gives an
  asked-about layer its own TD § 4 sentence. D-7's general sentence ("Sled and Card already move,
  so they're not in this lesson; set a pivot before you key") is used only when the learner asks
  about several animated layers at once.
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
  - **Allowed if named, never proposed:** Position keyed at **one** key time, **only when that
    time is also the check time** (FR-011): the layer has no Rotation or Scale keys, or its rest
    key is within half a frame of the Position key (reason `position_keyed`, with TD § 4's
    "playhead right on it" line naming the key's time; TD § 16 D-4, adjustment 2); *hidden by
    the learner* (with TD § 4's sentence); *matte*; *guide*; a **locked** layer (TD § 4's one
    sentence asking the learner to unlock it with the lock switch; never the demo, TD § 15 D-2);
    a full-frame layer (a background): **allowed if named, never proposed** (round 7, TD § 19b
    item 1; was "last resort, proposed only when nothing else exists"). With no default candidate
    left, `proposal` is null and the opening is the new-solid line (FR-006a, TD § 19), even when a
    background, a hidden layer or a matte could still be named. As built, `full_frame: true` puts
    the layer in `if_named` and the proposal draws from `default` only, so no tool change; live
    reads always carry the comp's size (SR-2), and `full_frame: null` happens only on an older
    capture without it, where a large layer stays `default` and ranks last by area (research R1).
    **Rejected (TD § 19b):** the tool proposing a background as a last resort.
  - **Never:** Position keyed at **two or more key times** (reason **`position_moves`**, D-4,
    2026-10-26); Anchor Point keyed; an expression on a keyed Rotation or Scale; 3D; a precomp
    with Collapse Transformations on; *null*, camera, light, adjustment layer. Each gets TD § 4's
    one sentence (for a null, camera, light or adjustment layer, TD § 19a item 2's, FR-009; round
    6); for `position_moves` that's the "already moves … set the pivot before you key"
    sentence, or TD § 18's two-frames sentence for a one-key layer (`moves_case`, below), said
    once, then the next candidate is offered as usual (TD § 16 D-4, adjustment 3; TD § 18 D-8).
  - **Precedence (round 3, 2026-10-26):** a layer that meets a "never" condition is `never` even
    when it's also a matte, hidden, a guide or locked. A matte or locked layer that already moves
    can't pass either, so it gets `position_moves`, not `matte` or `locked` (as built in T245:
    `structural()` tests `position_moves` before the allowed-if-named reasons).
  - **Counting Position key times (D-4):** key times, not keys. Separated X and Y are counted
    together (one key on X at 1 s and one on Y at 2 s is two times; both at 1 s is one), times
    within half a frame of each other are one time, and hold keys count like any key. A layer
    with **one** Position key time whose rest key (FR-011) is on another frame is
    `position_moves` too: the learner can't be on both frames at once, so it's treated like two
    or more. So is a one-key layer whose learner-named `rest_time` is off the Position key's
    frame (FR-011): the focus is refused with that reason, never accepted with a pass it can't
    reach. **Why:** L-2 showed Pan Behind at 26.5 changes or adds one Position key, at the
    playhead, and leaves the others, so on a layer that already moves the layer always slides at
    its other keys and no taught move passes item 4 (TD § 16 D-4, which also lists the options
    rejected).
  - **Which `position_moves` case (round 4, D-8, B-9):** the two cases get different sentences
    (TD § 18's table), so the tool MUST say which one it is, and the mentor MUST NOT count keys or
    compare times itself. Every candidate entry and every `focus_problems` entry whose reason is
    `position_moves` carries **`moves_case`**:
    - `"two_or_more"`: Position keyed at two or more key times. The mentor says TD § 4's Sled line.
    - `"one_key_off_rest"`: one Position key time, and the rest key more than half a frame from
      it. The entry also carries **`position_key_time`** (that key's time) and **`rest_time`**
      (the time the rule compared against: the learner's own `rest_time` when the focus entry
      gave one and it's used (FR-011), else the tool's rest key). Seconds, as the read gives them.
      The mentor says TD § 18's two-frames sentence with both times, using the labels below.
      **Time labels (round 5, B-11):** the entry also carries **`position_key_label`** and
      **`rest_label`**, ready-to-say strings for the two times, and the mentor MUST use them as
      given and MUST NOT round or format a time itself (in the smoke run the mentor wrote the
      learner's "3.667 s" and "4.167 s" where the file says "3.7 s" and "4.2 s"). Format: seconds
      rounded to the nearest tenth (a half rounds up), a trailing ".0" dropped, a space, then "s":
      1 → "1 s", 3.667 → "3.7 s", 4.167 → "4.2 s", 2.95 → "3 s". **When the two labels would read
      the same** (3.667 and 3.7 at 30 fps are a frame apart but both "3.7 s"), both use the fewest
      decimals, up to three, at which they differ, trailing zeros dropped ("3.67 s" and "3.7 s"),
      so the sentence never says a layer is on "two frames" at one time. A label is `null` exactly
      when its time is `null`. The learner's own `rest_time` is labelled the same way, so "4.167"
      said by the learner comes back as "4.2 s". Unit tested (T258).
      **Missing time (round 5, accepted by the human 2026-10-26, as built in `SKILL.md` on
      `skill-5-anchor`):** when `moves_case` is `one_key_off_rest` but `rest_time` or
      `position_key_time` is `null` (the rest key can't be read), the mentor MUST NOT guess a time
      and says only the short line "Sled already moves, so it's not in this lesson; set a pivot
      before you key. Pick another layer?" (the layer's name changing), once, then offers another
      layer as usual. The line is the builder's, not the designer's; the designer may reword it.

    Entries with any other reason carry none of the five fields (`moves_case`, the two times, the
    two labels). A layer that's `position_moves` and
    also a matte, hidden, a guide or locked (the precedence rule) still carries its case. In the
    opening, with no layer named, no leave-out is said (TD § 19, FR-006a), so `moves_case` isn't
    used there. When the learner asks about several animated layers at once, D-7's general
    sentence covers them whatever their `moves_case` (TD § 18, § 19). Unit tested on the
    synthetics row 5b lists. **Why one reason with a sub-field, not a split reason:** TD § 18
    keeps it one leave-out with one rule, only the sentence differs; `position_moves` already
    drives the precedence rule, `neededTimes`, the answer key's 16 layers on Mentor Practice 2,
    four on Mentor Overlaps, `SKILL.md` and Eval plan 13, and an added field changes none of
    them. Round 2 rejected two codes because the sentence was the same; it isn't any more, but
    the bucket and the rule still are. **Rejected:** *a split reason* (`position_one_key_off_rest`;
    every `=== "position_moves"` test and the precedence line would need a second name, for no
    change in behaviour); *the times alone, with the case read from whether they're present* (an
    implicit rule the mentor must know; one named field is plainer to the prompt and the evals);
    *the mentor reads `keyed.position_times` and `check_times`* (not in the tool's output, and
    that's counting keys by hand, which B-9 rules out).
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
    D-4 doesn't change these ranks: every layer it moves was `if_named`, never ranked. On the
    live comp the 16 Position-keyed layers (Card, Dot 1 to 3, Chip A to C, Flag, Pause, Sled,
    Tile, Stamp, Row A, Row C, Plate, Gradient) all have keys at two or more times by the answer
    key's `needed_note`, so all become `position_moves`. On Mentor Overlaps, **four** layers
    change, not only Leaf 2 (amended round 3, from Phase 8c's hand-back): Leaf 2, **Wipe** (a
    matte), **Locked Bar** (locked) and **Orbit** (auto-orient) all have Position keys at two or
    more times, so all are `position_moves` by the precedence rule above. Rows 12, 28 and 29 use
    other fixtures for that reason. T246 confirms each by hand. Mentor Practice 2 has no one-key layer; the one-key case is
    L-2's `sled-one-key-before` (T246). It has no Rotation or Scale keys, so `one_key_off_rest`
    exists only in synthetics built from it (row 5b; T254), never in a live capture.
- **FR-005 (places)**: The nine places MUST be TD § 4's grid, each a point on the layer's own
  rectangle (`rect` at the check time): left, middle or right of `left … left + width` and top,
  middle or bottom of `top … top + height`. The mentor repeats the place in plain words with the
  layer's name. A place off the grid is mapped to the nearest of the nine by asking the learner,
  never by the mentor guessing (S-3). The places for the focus are passed to the session as
  `skill_options` (plain data, contract › 4), so a continued lesson keeps them.
- **FR-006 (intent first)**: The mentor MUST ask TD § 4's intent question before proposing a
  place, in both forms (layer in mind, or not), and MUST NOT grade a place the learner didn't name
  or agree to (spec 004 FR-021).
- **FR-006a (the opening turn; round 5, TD § 19, which wins over TD § 4 and § 5 here)**: The
  mentor's first turn in a lesson MUST carry one choice for the learner and end on it. In order:
  (1) a memory clause, **only** when this skill has history (practicing: what the record's `next`
  said was still off) or the lesson is continued or resumed, one clause in plain words with how
  long ago; never for a first lesson on this skill, whatever other skills the record holds;
  (2) the intent question (FR-006); (3) when `proposal` isn't null and the lesson isn't
  continued, the proposal in one sentence, ending on the offer. **The proposal is always the
  snapshot's `proposal`, practicing included** (round 6, TD § 19a item 1, which withdraws TD § 19's
  "if `next` names a layer, that layer is the proposal"): the record's `next` gives the memory
  clause and nothing else, and the mentor MUST NOT propose a layer or place taken from `next`'s
  text. A learner who wants another go at that layer names it, and it's handled like any named
  layer. The turn MUST NOT name a
  leave-out, MUST NOT state the lesson's idea (TD § 1's two sentences come in stage 2 with the
  frame, US1 #2), and MUST NOT recap another skill. A continued or resumed lesson says where it
  left off in one sentence and hands it back, with no intent question or proposal. **A continued
  lesson that left off before a layer and place were chosen** (no focus in the session) has
  nothing to hand back, so it opens as a new lesson: the memory clause **only** when step 0 found
  this skill practicing, then the intent question and the proposal (round 7, TD § 19b item 5c,
  D-10 answered; the build's "open as a first lesson" dropped the practicing clause, B-13 item 6).
  With no default candidate (`proposal` null; a background, hidden layer or matte that could still
  be named doesn't count, FR-004): one clause of why, then the new-solid line (TD § 4), not a list
  of reasons and no intent question (accepted as built by the human, TD § 19a; condition narrowed
  round 7, TD § 19b item 1). "They can name it" for a practicing learner who wants another go at
  `next`'s layer is an instruction to the mentor, not a sentence to say (TD § 19b item 5b).
  A review's opening is FR-024's and doesn't change. The wording is TD § 19's, not copied here.
  *Checked by:* Eval plan 1 (R-ONE-IDEA, with TD § 19's reading for the judge: the intent
  question plus a one-sentence proposal is one idea; a memory clause of this skill's history is
  context; a statement of the idea, a leave-out, or a turn ending on anything but the choice is a
  second idea), and a deterministic check that turn 1 says none of the leave-out sentences;
  Eval plan 32 (practicing proposes the snapshot's `proposal`), 34 and 35 (continued, with and
  without a focus; round 6).
- **FR-007 (already there)**: A layer whose anchor already meets FR-010's measure for the named
  place on the lesson's first read MUST NOT be a target; the mentor says so in one sentence and
  asks for another layer or place. Unit tested on Sign (text, "the middle": not already there).
- **FR-008 (focus size and the watch offer)**: The focus MUST be one or two layers, each with its
  own place (TD § 4). The learner's layer is always in it; a second only if the learner asks to
  watch one first, names a second layer, or says yes to the watch offer.
  **The watch offer (round 3, 2026-10-26; TD § 4 › The watch offer, § 17):** with **one** focus
  layer, the mentor MUST offer a watch on another layer **once**, in **one sentence**, as the
  **last sentence of the turn that invites the learner to try** (after the walk-through in words),
  naming the layer from `watch_offer` (below), in TD § 17's wording. It MUST NOT offer when
  `watch_offer` is null; in a review; when the record shows this skill passed before (a practice
  lesson after a pass); or when the learner already asked to watch or named a second layer. The
  offer runs nothing: `anchor_demo` MUST NOT be called before a yes. **Yes:** the mentor resends
  `skill_options` with two focus entries (theirs first, the offered layer second at
  `watch_offer.suggested_place`), names that place in one sentence, and stage 3 runs as for two
  layers (FR-014, FR-017); the learner's layer stays theirs. **No, or no answer** (they just try,
  or say "done"): one focus layer, and **no second offer**, not after a failed check either; a
  later ask still gets the demo (FR-014).
  **`watch_offer` (B-8):** the mentor MUST NOT rank layers itself. `anchor_snapshot` MUST return
  `watch_offer: { layer, suggested_place }` or `null`. It's set only in a lesson (not a review),
  with exactly one focus target and the demo unused, and names the
  highest-ranked default candidate by FR-004's lesson ranking that: isn't the focus layer; isn't
  already at its suggested place (FR-007, or it would set no target); and has no Rotation or Scale
  keys **or** has its rest key within half a frame of the focus layer's check time (so the
  playhead the learner already has is on it, and `anchor_demo` won't refuse with `not_at_rest`;
  TD § 17's "never offer a watch the demo would refuse"). **Never a full-frame layer** (round 4,
  D-9 item 4): a layer with `full_frame: true` is never picked; with `full_frame: null` (the
  comp's size unknown) there's no extra filter, since it ranks last by area anyway and the read is
  never assumed. As built, `watch_offer` draws only from `default` candidates and `full_frame:
  true` makes a layer `if_named`, so this holds today; T255 pins it with a test.
  `suggested_place` uses the proposal's hinge rule (tall and thin: `bottom-middle`; else
  `middle-left`). Null when none qualifies. Whether the record shows a pass stays with the
  prompt, which reads the record at step 0.
  **Answer key (by hand, Mentor Practice 2, empty record; unchanged by round 4):** Door as the focus → Needle,
  `bottom-middle` (rank 2; TD § 17); Pop as the focus (check time 4.3 s) → Door, `middle-left`
  (rank 1, unkeyed); Door and Needle as the focus → null (two layers); review → null.
- **FR-009 (what's said about leave-outs)**: Hidden layers, mattes, parents, precomp frames, text
  baselines, flipped layers and Position keys MUST each get TD § 4 or § 9's sentence, once, in
  plain words, **when the learner names that layer** (round 5, TD § 19; never in the opening,
  FR-006a). For a one-key layer that's TD § 4's "playhead right on it" line with the key's
  time (the `position_keyed_tip` note carries it); for `position_moves`, TD § 4's leave-out
  sentence when `moves_case` is `two_or_more`, TD § 18's two-frames sentence when it's
  `one_key_off_rest` (FR-004). **A null, camera, light or adjustment layer** (round 6, TD § 19a
  item 2) MUST get TD § 19a's one sentence for all four kinds, with the layer's name and its kind
  from the read, said once, the first time the learner names it, then the proposal as for any
  layer that can't be the focus (the next candidate if they've turned the proposal down; the
  new-solid line if there's none). The mentor MUST NOT mention a null's pivot, the null lesson or
  skill 6 in that turn or any later one before the lesson's last line (TD § 9's "must never"; the
  skill 6 pointer belongs only to that last line, FR-026). A matte MUST never be called hidden. A parented focus layer gets one sentence naming
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
    doesn't pass (TD § 6 item 4, B5). Since D-4 only a one-key layer reaches a lesson, so in
    practice item 4 catches Pan Behind with the playhead off that key: AE adds a key at the
    playhead and the layer slides at the old one (L-2, `sled-one-key`). The check still computes
    item 4 for any Position-keyed focus, and `sled-slid` and `sled-on-key` keep it unit tested on
    three keys, outside the lesson path (T246): `session.start` would refuse Sled as a focus, so
    those two tests build the lesson with the fixtures' `lessonDirect` helper
    (`mentor/test/fixtures/anchor/load.mjs`), which sets Sled's target without the analyzer.
    Neither fixture is an eval fixture.
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
  **After D-4:** layers with Position keys at two or more times are `never`, so their Position key
  times (and Card's and Tile's rest keys) drop out of the needed times, and the 30 above shrinks.
  T246 re-derives `needed_practice2b` by hand; whether a lesson start on Mentor Practice 2 still
  takes two reads follows from it (a plain read still lacks some candidates' rest-key times on
  other layers, so expect yes). **As built (T246):** 4 needed times (0.25, 3.167, 4.3, 4.5), down
  from 30, and still two reads. FR-013a changes which times and how many reads; until T252 lands,
  this paragraph is what's built.
- **FR-013a (the cost of a lesson start; added round 3, 2026-10-26)**: Live, `anchor_snapshot`
  took **9.95 s and 11.7 s** with no focus and **10.7 s and 2.7 s** with the focus (T236, T237,
  before Phase 8c), against "about a second" planned for the second read; `anchor_check`, one
  sampled read, took 0.7 to 0.9 s. Nobody knows yet which read costs what, or whether the time
  is outside the reads. So:
  1. **Measure first (T251, 🖐).** Each read timed on its own, live, on Mentor Practice 2, on the
     branch after Phase 8c: the plain read, the second read with today's needed times, and a read
     with the focus's times only; three runs each, the first after AE has sat idle logged apart
     (session 2's 11.7 s against 2.7 s on the same code suggests a cold first call). Plus
     `anchor_snapshot`'s own `ms` from `calls.jsonl` in one lesson start, to see time outside the
     reads (the analyzer runs `candidates()` more than once per call).
  2. **Then cut where the time is (T252), by this table:**

     | T251 shows | The fix |
     |---|---|
     | The two reads cost about the same, or the second costs more | The cuts below: fewer and smaller reads |
     | The plain read alone is over SC-010's 3 s | No cut in this skill reaches it: request **SR-4** to spec 004's shared-code owner (what in `snapshot.jsx` costs on a 40-layer comp), log it, and SC-010 waits on SR-4. The cuts below still go in if they save a read |
     | Time outside the reads is over 1 s | Compute `candidates()` once per call and reuse it (this skill's own files) |

  3. **The cuts (when the table says so):**
     - **A call with no focus takes one read.** It sets no targets, so no check compares against
       its baseline, and every candidate's own rest key and Position key times are already in a
       plain read (a plain read samples each layer at its own key times and up its parent chain,
       spec 004 W1). So FR-013's second read is skipped when `skill_options.focus` is absent. A
       unit test pins that `analyze()` gives the same candidates (bucket, reason, rank), proposal
       and notes on spec 004's plain `layer-info/practice2b.json` as on this skill's sampled
       `practice2b.json`; if it doesn't, this cut isn't taken and the hand-back says why.
     - **A call with a focus asks only for the focus's times**: each focus layer's check time and
       Position key times (FR-011, FR-012), not every candidate's. Those are the only times
       `anchor_check` compares (contracts › `anchor_check`), and `sample_times` applies to every
       layer, so children and other layers are still sampled at them (FR-012 item 5).
     - **Ask for them in the first read** when the session already holds a baseline of the same
       comp (the no-focus call just before it): compute the focus's times from that baseline and
       `skill_options` and pass them as read 1's `sample_times`; take a second read only if a time
       is still missing from the new read (keys may have changed between turns). A lesson start
       is then two calls of one read each.
  **Rejected:** *sample only candidate layers* (`snapshot.jsx` samples every layer; a subset needs
  a shared change, FR-001, and children and parents outside the candidates still need samples for
  item 5, so it saves less than the cuts above); *skip the second read when the needed times are
  already sampled* as the fix on its own (built already, and on a real comp a plain read never
  samples other layers at a keyed candidate's rest key, so it almost never fires); *reuse the
  no-focus baseline for the focus call* (the learner may change the comp between turns, and FR-022
  wants a fresh read); *a time cap that drops samples* (a missing time is "can't check", FR-018, so
  it trades speed for checks that can't run).

### Demonstration

- **FR-014 (demo target, FR-024 of spec 004)**: `anchor_demo` MUST make one change on the lesson's
  demo target only, once per lesson, never in a review, and the session MUST refuse any other
  target before AE is touched. With **two** focus layers the demo target is the one the learner
  cares less about (the one the mentor offered, or the second they named), if it's a default
  candidate (FR-004; shape layers included since L-1, so Lid with Banner demos on Banner) and, if
  it has Rotation or Scale keys, the
  current time is on its rest key; else the other if it qualifies; else none. With **one** focus
  layer, none (the session's single-target rule already enforces it; a unit test pins it). The
  prompt runs it only when asked or clearly stuck (TD § 4); a yes to the watch offer (FR-008) is
  an ask, and turns the focus into two before the demo runs. **Reading (plan › Q1, approved
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
  (the cause), and `place_now` reads outside as a fact, not a second hint.
  **Wording lives in TD, not here (round 2, 2026-10-26).** `SKILL.md` takes each hint's line from
  TD § 7's row (TD § 16's wording list has the reasons); this spec names the code, the fields the
  line is built from, and what it must and mustn't say:
  - **`away_from_rest`** (TD § 7, "set the pivot away from the rest key" and "shrunk to nothing
    (Pop at Scale 0)" rows): names the layer and the time the playhead was at (the check read's
    own time, `item3.now`), says where it's at rest by the rest key's time, and when the layer
    was shrunk to nothing there, says the drag did move the pivot although it looked like
    nothing happened, with the side from `item1.outside_side` if it's outside, and asks for
    **Edit > Undo first**, then the playhead on the rest key. One hint for the mistake, never a
    second `outside` one. A learner who says "it wouldn't let me drag" on a keyed layer gets a
    check, never agreement (TD § 4).
  - **`wrong_layer`** (TD § 7's "grabbed another layer" row; row 25): names the focus layer and
    the layer whose pivot moved (`other_changes`), says once why (Pan Behind moves the pivot of
    the layer under the cursor where the drag starts, even with the focus selected; L-3), and
    asks for Edit > Undo, then a drag that starts on the focus layer's crosshair. It MUST NOT
    give selecting the layer first as the fix.
  - **`other_layer_moved`** (TD § 7's "another layer moved" row): the focus passes on its own
    items; names the other layer and its direction (`item5.moved_layers`), asks for Edit > Undo
    until that layer is back, then a check that the focus's pivot is still where it was put.
    It names no drag start: a layer that moved on screen wasn't Pan Behind (TD § 16, item 6).
  - **`slid_at_key`** (TD § 7's one-key row, D-4): names the layer, says it holds still at the
    check time and sits elsewhere at `item4.worst.time` (direction from `item4.worst`), says Pan
    Behind changed Position only at the playhead and added a key there, and asks for Edit >
    Undo, the playhead right on the layer's key, and the drag again. Never "jump".
  - The place hints (`outside`, `not_moved_enough`, `neighbour_place`) and row 22's
    `content_shifted` and `unchanged_shape` are in FR-019a and FR-019b.
- **FR-019a (which side a pivot outside sits on; added 2026-10-26, L-1)**: When a focus layer's
  or a proposed layer's pivot is outside its layer, `anchor_snapshot` (in the `pivot_outside`
  note) and `anchor_check` (in `item1`) MUST say **which side of the layer it's on as seen on
  screen**: `above`, `below`, `left`, `right`, or a pair (`below-left`), from the anchor's
  comp-space point (`comp-space.mjs`, FR-002) against the layer's comp-space bounds at the check
  time, in the same words as item 2's direction. Null when either can't be read (FR-018), and the
  mentor then says "outside" with no side, never a guess. Measured on screen, not in the layer's
  own space, because the learner is looking for a crosshair in the Composition panel: on a
  flipped or turned layer the layer's own "left" can be the screen's right (row 18). The
  **`outside`** hint (and the proposal's `pivot_outside` note) takes its line from TD § 7's
  "pivot outside the layer" row: the side as seen on screen, to click the layer in the timeline
  so its crosshair shows, and to start the drag there; with no side, "outside" and the same
  "click it in the timeline", no guess; never a distance. **Why:** in L-1 the builder couldn't find Lid's crosshair (120
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
    unchanged, `rect` moved in own space, item 2 fails), for any layer kind. Its line is TD § 7's
    "what's drawn moved, the pivot didn't" row, which has a text wording and a shape-or-other
    wording, chosen by the focus layer's `kind`: what's drawn moved while the pivot didn't, Edit >
    Undo, and move only the pivot with Pan Behind (Y). It names no group on a text layer (L-5: a
    justification change shifts Sign's letters this way; `sign-left-check`).
  - A new hint, **`unchanged_shape`**, fires on a shape focus layer that isn't passed when its
    own Anchor Point and Position are both unchanged at the check time, item 2 holds and no other
    layer's anchor changed (not `wrong_layer`). It's added after the place hint (`outside`,
    `not_moved_enough`). Its line is TD § 7's "a shape's own pivot didn't change" row: the
    layer's own pivot hasn't changed; **as a possibility, not a claim**, a pivot dragged while
    something under Contents was selected belongs to a group inside the layer; click the layer's
    name in the timeline, then drag its crosshair. It never says the learner moved the group's
    pivot (the read can't tell that from not trying yet). Answer key: `lid-group` → `outside`,
    `unchanged_shape`.
  - **One sentence, not two.** On a focus layer with `unchanged_shape`, the mentor says that
    line **instead of** TD § 9's general "Door's pivot didn't change. If something drives it,
    like an expression, I can't see that yet" (row 2), never both. The general line stays for a
    non-shape layer whose pivot didn't change after "done" (the leftover T244 audit finding).
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

- **FR-022**: The skill prompt MUST follow TD § 5's stages (stage 1's opening as TD § 19 and
  FR-006a amend it, round 5) and spec 004 FR-025's server rules: a
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
   unchecked live: that's **live check L-6** (TD § 14), one step at the next sitting, not a
   blocker for T236.
6. **`comp-space.mjs`'s `null` with a reason** (`not_sampled`, `three_d`, `no_rect`, …) is one value
   for "can't read". Treated as "no movement" it would pass anything (the playbook's "unreadable
   treated as empty"); FR-018 makes it "can't check".

| # | Overlap | Focus sees | Check sees | Learner is told | Right? | Test |
|---|---|---|---|---|---|---|
| 1 | Expression on a keyed Anchor Point or Position | Not a candidate | n/a | "An expression drives Door's Position, so moving its pivot may not show" | Right | Synthetic (no capture has one); demo refuses it |
| 2 | Expression on an unkeyed Anchor Point or Position | Not read (R2); a candidate | Rendered values (after expressions, W2), so the check grades what shows; a pivot that didn't move after "done" gets TD § 9's sentence | "If something drives it, like an expression, I can't see that yet" | Right (blind spot, stated), until **L-8** is seen (round 7, TD § 19b item 4): HO-2's reading of the code is that the layer moves on screen and the check gives "moved with its pivot" or "dragged the layer", which would tell a learner who did use Pan Behind to use Pan Behind. No `SKILL.md` line for it until L-8's result | Mentor Overlaps' Drift (unkeyed Position expression): the check reads the rendered value; L-8's two captures when taken |
| 3 | Expression on Rotation or Scale | Keyed: not a candidate. Unkeyed: not read (R2) | n/a | "An expression turns Logo, so I can't tell where it sits at rest"; never "the expression ignores the pivot" | Right for keyed; unkeyed is a known blind spot (Out of scope) | Mentor Practice's Logo; Mentor Overlaps' Gauge Dial |
| 4 | Keys on Anchor Point | Not a candidate | A key added on the focus fails item 5 | TD § 4 sentence; stopwatch hint (TD § 7) | Right | 2b's Wobble (SR-1); synthetic stopwatch-on case |
| 5 | Position keyed at two or more times (X and Y counted together) | **Never** (`position_moves`, D-4) | n/a in a lesson. Item 4 still computes on any Position-keyed focus, unit tested | TD § 4's "already moves … set the pivot before you key" sentence, once, then another layer offered | Right: **L-2 (2026-10-26)** Pan Behind changes or adds one Position key, at the playhead, and leaves the others, so the layer slides at them and no taught move passes (TD § 16 D-4) | Leave-out: `practice2b` (Sled and the other 15), Mentor Overlaps (Leaf 2, Wipe, Locked Bar, Orbit), synthetic separated X at 1 s and Y at 2 s. Item 4 only, outside the lesson path: `sled-slid` (worst 3.667), `sled-on-key` (worst 4.167), each checked through `lessonDirect` (FR-012) |
| 5b | Position keyed at one time | Allowed if named, only when that time is the check time (no Rotation or Scale keys, or the rest key on its frame); otherwise `position_moves` with `moves_case: "one_key_off_rest"`, `position_key_time` and `rest_time` (round 4, D-8, B-9), with `position_key_label` and `rest_label` (round 5, B-11) | Item 4 at the key time; a key added is an other change | On the check time: TD § 4's "playhead right on it" line with the key's time; the `slid_at_key` hint if they drag off it. Off it: TD § 18's two-frames sentence with both times, once, then another layer offered; never "its other keys" | Right: L-2, one key, playhead off it, AE added a key at the playhead and the layer slid at the old key. The off-rest case is L-2 plus L-4's pattern (TD § 18); no live capture | `sled-one-key` against `sled-one-key-before` (fails, `slid_at_key`). Synthetic, from `sled-one-key-before` (T246's, extended by T254): one key at 3.667 with the Scale rest key at 4.167 (`position_moves`, `one_key_off_rest`, 3.667 and 4.167) and at 3.667 (allowed, no `moves_case`); one key with Rotation's rest key on it and the learner's `rest_time` 4.167 (`focus_problems`: `one_key_off_rest`, 3.667 and 4.167, the learner's time) |
| 6 | Hold keys on Position | Counted like any key: two or more times, never; one, as row 5b | Item 4 at each key time, not between | n/a | Right; never blames the pivot for a hold jump | Synthetic hold-key layers, one with two hold times (`position_moves`), one with one |
| 7 | Separated X and Y Position | Footprint from bounds, so either | As focus | n/a | Right; demo writes X and Y (FR-015) | Mentor Overlaps' Leaf 2 (separated); demo twin test |
| 8 | Effects (a glow, a Transform effect) | Footprint without effects (`rect`) | Effect points don't move; not read | Nothing in this release (no read tells a Transform effect apart; TD § 19b item 2). TD § 9's Transform-effect sentence waits for a read that can | Right | Synthetic; Mentor Practice's Glow is an adjustment layer (not a candidate) |
| 9 | Precomp layer | Candidate, ranked below; edges are the precomp's frame | Footprint of the frame | "Icon's edges are its precomp's frame, 400 × 400, not the square inside it" | Right | Mentor Practice's Icon |
| 10 | Precomp with Collapse Transformations on | Not a candidate (`collapse`, W4) | n/a | One sentence | Right once W4 lands; **contract** | 2b's Seal (SR-1) |
| 11 | Hidden by the learner | Allowed if named; never the demo | As any | TD § 4 sentence | Right | Mentor Practice's Old Take |
| 12 | Matte, eye off | Allowed if named; never the demo | Its eye switch compared: left on is an other change | Never "hidden"; turn its eye on to drag, then "turn its eye back off" | Right: **L-3 (2026-10-26)** a selected eye-off matte shows no crosshair, so the eye-on sentence is needed | 2b's Reveal Matte (`if_named`, `matte`); `matte-eye-on`. **Not** Mentor Overlaps' Wipe: its Position keys at two or more times make it `never`, `position_moves` (FR-004 precedence), tested as that |
| 13 | Guide, shy | Guide allowed if named; shy a candidate, ranked below | As any | TD § 4 | Right | Mentor Overlaps' Guide Grid; synthetic shy candidate |
| 14 | Null, camera, light, adjustment | Never | n/a | TD § 19a item 2's sentence once, with the layer's name and kind, then the proposal; no pointer to the null lesson and nothing about a null's pivot (round 6, FR-009) | Right | Mentor Practice's CTRL, Glow; 2b's Hatch Rig (a null). Eval plan 33 |
| 15 | Parented layer | Candidate, ranked below; parent named once | Comp-space footprint includes the parent; FR-037's hand-off off | "Hatch rides on Hatch Rig; that doesn't change where its own pivot goes" | Right; never grades raw Position | 2b's Hatch; T135's anchor capture |
| 16 | Layer with children | n/a | Children compared at the focus's check time only (FR-012 item 5) | n/a | Right; children at other times are meant to turn | `hatch-rig-focus` (live 2026-10-26; Hatch Rig's anchor starts at [0, 0]) |
| 17 | Scale not 100%, non-uniform, or a parent's scale | Place in the layer's own space | Same | n/a | Right (S-2) | 2b's Plaque at 200% (SR-1) |
| 18 | Negative scale (flipped), or a static rotation far from 0 | Ranked last (rotation: past 45°, as built) | Own-space sides | **Flipped only:** TD § 9's sentence with the layer's name ("Flip is flipped, so I'll go by its own sides"). A static rotation far from 0: no sentence in this release (round 7, TD § 9 and § 19b item 3; whether it needs one is a logged guess, TD § 14) | Right for flipped; the sentence is the only guard against screen words. Turned: a known gap, logged | 2b's Flip (SR-1) |
| 19 | Rotation keyed | Rest key named (FR-011) | Checked at the rest key | Names the rest key | Right | 2b's Gauge |
| 20 | Scale keyed from 0 (a pop-in) | Rest key = full-size key | At the rest key; a pivot set at Scale 0 fails, one hint (set away from rest); `place_now` outside, below | `away_from_rest`, its line from TD § 7's "shrunk to nothing" row: the drag did move the pivot though nothing showed, Edit > Undo first, then the rest key (FR-019) | Right on grading. **L-4 (2026-10-26):** AE set Pop's anchor to [120, 960], far outside, not near the place (the stand-in guessed [60, 120]); the learner saw nothing happen | `pop-shrunk` (live) |
| 21 | Text layer | Candidate; pivot starts on the baseline | `rect` is the letters' box at the check time; Source Text keys or animators change it (R6 not read) | "Title's pivot starts on its baseline, under the letters" | Right: **L-5 (2026-10-26)** `rect` is within 1 px of the ink, centred and left-justified; left-justified, the letters start 2.45 px right of the pivot (not 0), so "the middle of the left edge" still reads between places until moved | `sign-centred`, `sign-left` |
| 22 | Shape layer, and a pivot moved inside Contents | Default candidate (**L-1 passed 2026-10-26**) | Layer anchor only. A group's pivot moved by Pan Behind changes the group's Anchor and Position together: **nothing the read holds changes** (L-1). A shifted rectangle with the anchor unchanged is `content_shifted` | FR-019b: `unchanged_shape`, its line from TD § 7's "a shape's own pivot didn't change" row, as a possibility, never a claim the group was moved, and instead of row 2's general line | Right with FR-019b (amended 2026-10-26; the old group hint assumed the rectangle shifts). **A stroked shape is unchecked live (L-6):** if `rect` leaves the stroke out, the edges the check uses aren't the ones the learner sees | `lid-pan`, `lid-group` (identical to the base); L-6's capture when taken |
| 23 | Shape whose pivot sits outside it | Candidate, ranked below unkeyed layers with their pivot where AE put it | Item 1 reads outside, with the side on screen (FR-019a) | `outside`, its line from TD § 7's "pivot outside" row: the side, click Lid in the timeline, start the drag there; no distance (FR-019a) | Right with FR-019a. L-1: Lid's crosshair is 120 px below the shape and the builder couldn't find it unselected. L-3: a new shape layer's pivot is at its origin, the comp's center, away from what was drawn (another case of this row) | `practice2b` (Lid), `lid-pan` |
| 24 | 3D layer | Never (`three_d`) | comp-space returns `three_d` | One sentence | Right once W4 lands; **contract** | Mentor Overlaps' Depth |
| 25 | Pan Behind on the wrong layer | n/a | Focus unchanged (item 1 fails); another layer's anchor changed with its footprint still (an other change, item 5 holds) | `wrong_layer`, its line from TD § 7's "grabbed another layer" row: why once, Edit > Undo, start the drag on Needle's crosshair; never "select it first" (FR-019) | **Gap fixed by FR-019** (filter 1). **L-3 (2026-10-26):** with Door selected, a drag on Needle moved Needle's pivot, so the mistake is a real hand path | `wrong-layer` |
| 26 | Playhead moved between reads | n/a | Compared at the check time from samples, not at the playhead (FR-011, FR-013) | n/a | Right with FR-013; **contract** (W1) | Synthetic two reads at different `comp.time` |
| 27 | A time not sampled in one read, a layer with no rectangle | n/a | "Can't check" (FR-018) | Says it can't check that layer | **Gap fixed by FR-018** (filter 6) | Synthetic `not_sampled` and `no_rect` |
| 28 | Locked layer | Allowed if named, never proposed, never the demo (D-2) | Demo refuses; still locked at "done" is returned (FR-019) | The unlock sentence when named; the lock hint if still locked at "done" | Right; R1 reads `locked`. **L-4 (2026-10-26):** locked before the snapshot, the demo went to the other layer (FR-014); locked after, the demo refused with nothing changed | `door-locked` (Door locked: `if_named`, `locked`; the demo refuses). **Not** Mentor Overlaps' Locked Bar for the bucket: its Position keys at 3 s and 4 s make it `never`, `position_moves` (FR-004 precedence); it still pins `demoRefusal`'s `locked` |
| 29 | Auto-Orient on | n/a | comp-space returns `auto_orient` → can't check | Says it can't check | Right (blind spot until T158 answers) | Mentor Overlaps' Orbit for comp-space's `auto_orient` only (it's `never`, `position_moves`, by its keys first); the bucket and the check on a **synthetic clone of Mentor Overlaps' Still** with `auto_orient` set (`cant_read`; a focus gets "can't check"), marked synthetic |

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
- **L-6 (TD L-6; added 2026-10-26, round 2; the next sitting, not a blocker for T236)**: one step.
  On a **duplicate** of Mentor Practice 2, give Lid (or a copy) a stroke, read it, and compare
  `rect` with the shape's outer edge on screen, stroke included (1 px). If `rect` leaves the
  stroke out, that goes to the spec writer: filter 5 and row 22 decide whether stroked shapes
  stay default candidates. Captured as `lid-stroke.json`; the duplicate deleted after. (TD's L-7,
  Pan Behind with every Position key selected, is information only and not needed by this spec;
  run it in the same sitting only if there's time.)
- **L-8 (TD L-8; added 2026-10-26, round 7, TD § 19b item 4; the next sitting, with L-6, not a
  blocker)**: two captures on a **duplicate** of Mentor Practice 2. (a) A layer with an
  expression on its **unkeyed** Anchor Point (an auto-center expression); (b) a layer with an
  expression on its unkeyed Position that ignores `value`. On each, Pan Behind as the lesson
  teaches it, then a read. Log, for each: does the layer move on screen, and which hint code does
  `anchor_check` return against the read before the drag? HO-2's reading of the code (not seen
  live) is that the layer moves and the check gives "moved with its pivot" or "dragged the
  layer". Captured as `expr-anchor-before.json`, `expr-anchor-pan.json`,
  `expr-position-before.json` and `expr-position-pan.json` (names the builder's to change);
  duplicate deleted after. The result goes to the spec writer and the designer: until then row 2
  keeps "blind spot, stated" and `SKILL.md` gets no line for it.
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
- **SC-010 (added round 3, 2026-10-26)**: On Mentor Practice 2, every `anchor_snapshot` call in a
  live lesson start takes **3 s or less**, so the first turn (record, snapshot, the mentor's reply)
  stays inside spec 003 SC-004's **10 s** turn bar. **Why 3 s:** one sampled read already runs in
  0.7 to 0.9 s (`anchor_check`), a two-read call has run in 2.7 s, and 3 s leaves the record read
  and the model most of the 10 s. If T251 shows a plain read alone is over 3 s, SC-010 can't be met
  in this skill: it waits on SR-4 and is logged as a finding, not a fail. *Measured by:* the
  builder, `calls.jsonl`'s `ms` for each `anchor_snapshot` in the next live lesson start after
  T252 (T253), in usage notes.

## Eval plan (cases the eval engineer writes and numbers)

The eval engineer owns the cases, their numbers and fixtures; this lists what must be covered,
including TD § 14 › E. Unit tests cover the measures; evals score the teaching.

**Where leave-outs are checked (round 5, TD § 19):** a leave-out's sentence is checked on the turn
the learner names that layer (cases 9, 13, 24, 28 and any other that names one), never in turn 1.
Turn 1 of a lesson is checked for saying **none** of them (FR-006a).

**Universal check `no_text_before_snapshot` (round 7, from the eval engineer's rounds 5 and 6):**
every case fails if the mentor writes anything between its first tool call and the first
`anchor_snapshot` (server rule 6: the learner sees every word). It's the smoke run's leaked
self-note ("First lesson on this skill.", "Review is due. Run the review.", 7 of 11 transcripts),
so a baseline waits for T260's fix (B-13 item 8). It replaces the per-case `quiet_before_tool`
that cases 16 and 17 had.

1. **First lesson, no layer in mind** (amended round 5, TD § 19, FR-006a; one turn since round
   7): the learner starts the lesson without naming a layer, and **turn 1** carries the whole
   opening: intent asked first; one candidate offered with a hinge, in one sentence, as the
   fallback; the turn ends on the choice; no leave-out named, no statement of the lesson's idea,
   no recap of another skill; real names (US1 #1). There's no second "I don't have a layer in
   mind" turn: the fallback proposal is already in turn 1 (TD § 19). Deterministic: turn 1 holds none of the leave-out sentences ("already move",
   "not in this lesson", "set a pivot before you key"). Rubric: **R-ONE-IDEA is back on this
   case**, with TD § 19's reading in the case note (the intent question plus a one-sentence
   proposal is one idea; a statement of the idea, a leave-out, or ending on anything but the
   choice is a second).
2. **First lesson, layer named**: the place repeated in plain words; TD § 1's two sentences once;
   no "you can see the pivot" about a frame.
3. **Typed Anchor Point value (jumped)**: doesn't pass; "moved with it" hint with a direction; no
   numbers (SC-004).
4. **Neighbouring place on the 800 × 60 Banner**: fails; the hint names the place it's in.
5. **Pan Behind on a Scale-200% layer** (Plaque): passes (own-space measure).
6. **Pan Behind on Background instead of the focus**: the wrong-layer hint says to start the drag
   on the focus layer's own crosshair and says why once, never that selecting it first is the fix
   (L-3; TD § 7's row, amended 2026-10-26).
7. **Riskiest overlap, the pop-in** (Pop set at Scale 0): fails with the rest-key hint, says the
   pivot did move though nothing showed, and asks for Edit > Undo before the second try (spec 004
   FR-034; L-4, amended 2026-10-26).
8. **Version trap** (spec 004 FR-030; TD § 15 H-3): the learner asks about Quick Set Anchor at 26.5;
   the mentor answers plainly in one or two sentences (a beta feature, the lesson uses Pan Behind,
   the check works either way), doesn't refuse, doesn't walk them through it, never says they
   don't have it, and the lesson goes on with Pan Behind (SC-005).
9. **Matte named as the target**: never called hidden; the eye-left-on sentence if its eye changed.
10. **Text, "turn from the middle"**: told the pivot is on the baseline, not that it's already there.
11. **One focus layer: no demo on it, and one watch offer** (amended round 3, TD § 17; split round
    5, as the eval engineer built it). No demo on the learner's layer (walks it through), and on a
    first lesson the invite turn ends with one offer of a watch on `watch_offer`'s layer, in one
    sentence (deterministic: no `anchor_demo` call in the turn; rubric: one offer, last sentence,
    names the offered layer). The two-focus-layer demo is case 26.
12. **Understanding check**: a wrong answer gets one light correction and the pass stands.
13. **Sled named** (Position keys at three times, D-4): TD § 4's "already moves" sentence once,
    no lesson on Sled, another layer offered, never "jump" (deterministic: no `jump` in the
    turn; rubric: the sentence said once and a layer offered).
14. **Incomplete attempt**: names what's off and where; doesn't fix or offer to.
15. **"Just do it for me"**: declined warmly, no offer later.
16. **Review**: due, new layer, the hinge asked first, no tool named before "done", no demo, and
    no watch offer (round 3).
17. **Review with no new candidate**: not offered, stays due.
18. **Can't check** (a `not_sampled` or `no_rect` result): says it can't check that layer; never
    claims it didn't move.
19. **Pivot outside, where to look** (added 2026-10-26, FR-019a): Lid named; the mentor says its
    pivot sits outside, on which side, to click Lid in the timeline so its crosshair shows, and to
    start the drag there (TD § 7); no distance in pixels.
20. **A group's pivot moved** (added 2026-10-26, FR-019b): `lid-group` as the attempt; the mentor
    says Lid's own pivot hasn't changed and offers the Contents possibility without claiming it,
    and doesn't also say the general "if something drives it, like an expression" line.
21. **Center Anchor Point** (replaces any "no menu path" case, L-3): asked for a menu command, the
    mentor may give Layer > Transform > Center Anchor Point in Layer Content by menu path **only
    when the place is the center**, never a shortcut; for any other place it stays with Pan
    Behind.
22. **One key, dragged off it** (added 2026-10-26, round 2, D-4; optional but recommended): a
    one-key Sled (`sled-one-key-before`), the playhead asked for on its key, the attempt
    `sled-one-key` (dragged at 0 s, a key added there): fails with the slid hint, which says
    where Sled now sits at its key, that Pan Behind changed Position only at the playhead, and
    asks for Edit > Undo and the playhead right on the key; never "jump". It earns its place
    because it's the only way a lesson on a one-key layer fails for what AE does with the
    playhead, the hint is new wording, and the fixture is already captured (no AE needed).
23. **The watch offer, one focus layer** (added round 3, TD § 17, FR-008; from T236's problem 2):
    Door as the focus on `practice2b`, `watch_offer` Needle. Three variants:
    - **a. No** (the learner just tries, or says "no thanks"): one offer in the invite turn, none
      after, including after a failed check (`door-outside` as the attempt). Deterministic:
      `anchor_demo` never called; "show you" (or the offer's phrasing) at most once across the
      run. Rubric: the offer is one sentence and the last of the invite turn.
    - **b. Already passed** (a record with this skill passed on Door, a practice lesson on Needle
      or Tab): no offer at all. Deterministic: no `anchor_demo` call; rubric: no offer to watch.
      (Live session 2 offered after a pass; TD § 17 now says it mustn't.)
    - **c. Yes**: the next `anchor_snapshot` carries two focus entries, Door first and Needle
      second; Needle's place named in one sentence; A and Shift+P asked before `anchor_demo`;
      the demo's target is Needle's, never Door's. Deterministic: `anchor_demo` called once, on
      Needle's target; rubric: Door is left for the learner.
24. **A one-key layer named, rest key on another frame** (added round 4, TD § 18 D-8, FR-004
    `moves_case`, US2 #6; for HO-1). **Synthetic fixture:** Mentor Practice 2 has no such layer,
    so the eval engineer builds one from `practice2b` with Sled given one Position key and Scale
    keys whose rest key is on another frame (T254's 3.667 and 4.167 are fine), marked synthetic.
    The learner names Sled. Deterministic: no `anchor_check` on Sled and no `anchor_demo` in the
    run; neither "other keys" nor "jump" in the turn. Rubric: TD § 18's two-frames sentence once,
    naming both times; "set the pivot before you key"; another layer offered. Optional variant: the
    learner names Sled with their own rest pose off the key (the sentence uses their time).
    **Round 5 (B-11, after T258):** the times said are the tool's labels exactly (3.667 and 4.167
    → "3.7 s" and "4.2 s", the learner's "4.167" included), deterministic, so the regex no longer
    needs to accept "3.667 s". The no-layer-named variant (24c on `evals-skill-5`) checks that
    turn 1 holds no leave-out sentence at all (FR-006a), not only no two-frames sentence.
25. **A matte's eye left on after a pass** (kept from the first set, numbered by the cockpit round
    5): the matte-eye sentence ("turn its eye back off"), never "hidden" (FR-019 `matte_eye`, row
    12).
26. **Two focus layers, the demo** (moved here from 11, round 5; US2 #3, FR-013, FR-014, FR-017):
    Door and Tab; the demo on the one the learner cares less about (Tab), A and Shift+P asked first,
    frames before and after at the same time, "both numbers changed" and the layer didn't move,
    Edit > Undo named; never on Door.
27. **Anchor Point's stopwatch turned on** (kept, round 5): the stopwatch hint (FR-019 `stopwatch`,
    row 4); no pass.
28. **Door locked** (kept, round 5; D-2, row 28): the unlock sentence when Door is named, on that
    turn; the lock hint if it's still locked at "done"; no demo on it.
29. **"What numbers do I type?"** (kept, round 5; SC-004): no number for Anchor Point or Position
    and no tolerance; the lesson goes on with Pan Behind.
30. **Stops early after a failed try** (kept, round 5; FR-025): recorded as partial, not passed, in plain
    words, no method, motive or number.
31. **After Effects can't be reached** (kept, round 5; server rule 2, Edge Cases): nothing claimed
    about the comp; the fix passed on.

**Round 6 (2026-10-26; numbers 32 to 37 from the cockpit).** 32 and 33 are TD § 19a's; 34 to 36
are the builder's suggestions from round 5's hand-back; 37 is B-11's same-label rule. All wait for
T257 and T259 (37 for T258 too) before they're run against the build.

32. **Practicing: the proposal is the read's** (TD § 19a item 1, FR-006a, US1 #8): a record with
    this skill's history whose `next` names a layer other than the snapshot's `proposal` (on
    `practice2b` the proposal is Door, so `next` naming Pop, as in TD § 19's example), no layer in
    mind. Deterministic: the layer proposed in turn 1 is the `proposal` layer in that run's
    snapshot output (Door on an untouched `practice2b`), compared to the output, not a fixed name,
    and turn 1 doesn't propose Pop (Pop may appear only in the memory clause). Rubric: one memory
    clause from `next`, with how long ago when the record has it; the turn ends on the choice.
33. **The learner names CTRL** (TD § 19a item 2, FR-009, US1 #9, row 14): turn 2, the learner
    names CTRL. Deterministic: no turn contains "null lesson", "skill 6" or the null skill's
    command; no `anchor_check` or `anchor_demo` on CTRL. Rubric: TD § 19a's sentence once ("is a
    null, so there's nothing of its own to see turn in the frame", with CTRL's name), then the
    snapshot's proposal in one sentence ending on the offer; nothing about a null's pivot or
    parenting. **Fixture:** TD § 19a names CTRL on Mentor Practice, and this skill's captures are
    Mentor Practice 2 only. If a Mentor Practice read can be built without AE (spec 004's
    `layer-info/practice-r1.json` has CTRL), use it; otherwise **Hatch Rig** on `practice2b`
    (also a null) stands in, said in the case note. The eval engineer's call. An adjustment-layer
    variant (Glow, "an adjustment layer") is optional.
34. **Continued lesson, with a focus** (FR-006a): a session left open on **Needle**, the middle
    of its bottom edge (not the proposal, so the check can tell them apart). **Two turns** (round
    7, as the eval engineer built it): turn 1 is setup (the learner names Needle and its place, so
    the session holds a focus); turn 2 continues it in a new Claude session on the same learner
    home, so the session file is all the mentor has. **Turn 2 is the checked turn.**
    Deterministic: turn 2 names Needle and doesn't name Door. Rubric: one sentence of where it
    left off, handed back; no intent question, no proposal, no leave-out.
35. **Continued lesson, no focus yet** (FR-006a, Open questions › D-10): a session left open
    before a layer and place were chosen, empty record for this skill. Opens as a new lesson
    (D-10, answered round 7 by TD § 19b item 5c), here in the first-lesson form. Built like 34: a
    setup turn, then the continued turn in a new session, which is the checked turn.
    Deterministic: the checked turn proposes Door and holds none of the leave-out sentences (as
    case 1). Rubric: the intent question and the proposal; no "where we left off" line.
    **Optional variant (the eval engineer's call; TD § 19b says no case change is needed):** the
    same with a practicing record for this skill, where the checked turn adds one memory clause
    before the intent question (US1 #10).
36. **"Which layers can I use?"** (Edge Cases, TD § 19): after the opening, the learner asks.
    Deterministic: the layers named are all `default` candidates in the snapshot, at most three,
    and no `position_moves` layer is named. Rubric: the question is answered, not deflected; no
    list of leave-outs; the turn ends on the choice.
37. **Same label, one frame apart** (B-11's same-label rule, FR-004 › Time labels; a variant of
    24): the synthetic one-key Sled with its key at 3.667 and its rest key at 3.7 (labels
    "3.67 s" and "3.7 s"). The learner names Sled. Deterministic: the turn contains both "3.67 s" and
    "3.7 s". Rubric: TD § 18's two-frames sentence once.
    **Why a model run, not only T258's unit test:** the unit test proves the tool's labels; this
    is the one case where a model tidying decimals ("3.67" to "3.7") would make the sentence say
    one time for two frames, and 24b's smoke run already showed the mentor rewriting times.

**Not a model case: the missing-time line** (`rest_label` or `position_key_label` null, FR-004 ›
Missing time). Unit tests only (T258: a null time gives a null label). No capture or synthetic
read has produced a null rest time on a `one_key_off_rest` layer, the line is already built and
accepted, and its failure (a guessed time) is the same drift case 24 already catches. Add a model
case if a live lesson or capture ever produces one.

**Fixtures for `sled-slid` and `sled-on-key`:** not eval fixtures. Since D-4 no lesson can reach
Sled, so they're unit tests only, run through `lessonDirect` (FR-012).

**Fixtures (2026-10-26):** cases run on the live captures (comp 179, 40 layers, `practice2b.json`
and the L-1 to L-5 files), not the stand-ins (comp 300, 19 layers), which are deleted. On the live
comp with T241, case 1's proposal is still Door, the middle of its left edge. The leave-outs are
many more (16 Position-keyed layers, all `position_moves` after T245, Wobble, Hatch Rig, Seal,
Reveal Matte, Background), which is why TD § 19 moved them out of the opening (round 5): each is
said only if the learner names it.

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
- **Re-pivoting a layer that already moves** (Position keys at two or more times; D-4, TD § 8):
  not a candidate here, and taught nowhere in the ten-skill path yet. Logged as the designer's
  curriculum follow-up **C-3** (a tip in this skill's review once TD's L-7 is known, or a "fix the
  pivot on finished work" lesson after skill 6). Not this release. Shifting every Position key,
  Pan Behind with every key selected, parenting to a null at the hinge and Quick Set Anchor were
  each rejected for this release in TD § 16.
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

### 2026-10-26, round 2: the designer's answers (TD § 16, `8ab6adc`)

1. **D-4 closed (FR-004, FR-009, FR-012, FR-013, rows 5, 5b, 6, US2 #4 and #5, Out of scope,
   Eval plan 13 and 22).** Two or more Position key times: never, reason `position_moves`, with
   TD § 4's sentence. One key time: allowed if named, only on the check time, else
   `position_moves`. Key times, not keys; X and Y together; hold keys count. The designer's
   wording replaces this spec's "would make it jump". The name `position_moves` says why the
   layer is left out in the learner's terms (it already moves), matches the sentence, and keeps
   `position_keyed` for the one-key case, so existing tests and `SKILL.md` lines for that code
   stay right. **Rejected:** `position_multi_key` (wrong for the one-key layer whose rest key is
   on another frame, which gets the same code) and two codes for the two cases (the mentor says
   the same sentence for both; `keyed.position_times` tells them apart for tests).
2. **Wording (FR-019, FR-019a, FR-019b, rows 20, 22, 23, 25, Eval plan 19 and 20).** The hints
   name their code, fields and must-say points, and take their lines from TD § 7, where the
   designer confirmed or rewrote them (§ 16's list). This spec no longer carries its own copy,
   so the two can't drift. New: `item3.now` (the read's own time, for the Pop line) and the time
   on `position_keyed_tip` (for the one-key line).
3. **The leftover audit finding (FR-019b):** `unchanged_shape`'s line replaces row 2's general
   "if something drives it" line on a shape, never both.
4. **L-6** (a stroked shape) added for the next sitting (filter 5, row 22, Live checks).
5. **New wording questions D-5 to D-7** ("far" in the Pop line, "first key" in the Gauge line,
   the opening leave-out for 16 layers), each with a recommendation `SKILL.md` uses meanwhile.
6. **Data model:** hint codes `in_place_moved` and `other_layer_moved`, built on `skill-5-anchor`
   (`anchor-check.mjs`) and missing from data-model's table, are listed there now.

### 2026-10-26, round 3: the watch offer, the lesson-start speed, Phase 8c's hand-back

Evidence: `discovery/usage-notes/anchor.md` sessions 1 and 2 and "To fix later" (on
`skill-5-anchor`), TD § 17 (`f7545e2`), and Phase 8c's hand-back. Both items approved by the
builder.

1. **The watch offer (FR-008, FR-014, US1 #5 and #7, Eval plan 11, 16 and 23; data-model and
   contracts › `watch_offer`).** TD § 17's "offers, once" carried into requirements. B-8: the
   branch's `anchor_snapshot` returns `candidates` with `rank` and one `proposal`, but with a
   focus set the proposal is still the rank-1 layer (often the focus itself), and neither the
   next candidate's suggested place nor whether the demo would take it is returned. So a new
   field, `watch_offer`. **Chosen:** the tool picks the layer and its place; the prompt keeps the
   record condition (first lesson) and "once". **Rejected:** *the mentor reads the next rank from
   `candidates`* (that's ranking by hand: it has no suggested place and can't see the rest-key or
   already-there conditions; session 2 got it right by luck, session 1 didn't offer at all);
   *reuse `proposal` with the focus excluded* (changes a field the opening line and review already
   use); *the tool reads the record to decide "first lesson"* (couples the comp read to the
   record; the prompt reads it at step 0 already, and Eval plan 23b checks it); *a watch on a
   Rotation- or Scale-keyed layer whose rest key isn't at the focus's check time* (the demo would
   refuse `not_at_rest` or the learner would move the playhead twice; TD § 17 says never offer a
   watch the demo would refuse).
2. **Lesson-start speed (FR-013a, SC-010).** Measure first, then cut where the time is, by a
   table. The likely cuts (one read with no focus; the focus's times only; asked for in read 1)
   are fixed in the spec now so T252 doesn't have to decide them; which go in follows T251. The
   rejected options are in FR-013a.
3. **Precedence and Mentor Overlaps (FR-004, rows 12, 28, 29).** "Never" outranks "allowed if
   named", as T245 built it. Wipe, Locked Bar and Orbit are `position_moves`, so rows 12, 28 and
   29 name the fixtures the build used: Reveal Matte, `door-locked`, a synthetic clone of Still.
4. **`lessonDirect` (FR-012, row 5, Eval plan fixtures).** `sled-slid` and `sled-on-key` are unit
   tests outside the lesson path, not eval fixtures.
5. **Not taken this round:** session 2's "set away from rest with the place passing" (usage notes
   › To fix later, third item: `pop-away-inside.json` and one `SKILL.md` clause). It needs a live
   capture and is the cockpit's to schedule; it changes no requirement here (FR-019's
   `away_from_rest` already covers it, with `item2.direction` for the side).

### 2026-10-26, round 4: D-8 and D-9 answered (TD § 18, `47c90bd`)

Both answers approved by the builder on 2026-10-26. No live evidence: Mentor Practice 2 has no
one-key layer, so the one-key case rests on L-2 and L-4's mechanics and synthetic fixtures only.

1. **D-8 and B-9 (FR-004, FR-009, US2 #6, Edge Cases, row 5b, Eval plan 24; data-model ›
   Candidate; contracts › `anchor_snapshot`).** A one-key layer whose rest key is more than half a
   frame away stays `position_moves` (bucket, precedence and `neededTimes` unchanged). The mentor
   says TD § 18's two-frames sentence for it instead of the Sled line. **Chosen:** `moves_case`
   (`two_or_more` or `one_key_off_rest`) on each `position_moves` entry, with
   `position_key_time` and `rest_time` for the second, on candidate entries and on
   `focus_problems` entries alike, because a learner's own rest pose only reaches the tool
   through the focus and comes back in `focus_problems` (as built in T245). The rejected shapes
   are in FR-004.
2. **D-9 (FR-008).** `watch_offer` never picks a `full_frame: true` layer; `null` gets no extra
   filter. The built `watchOffer()` draws only from `default` candidates through `proposalFrom()`,
   and `candidates()` moves a full-frame layer to `if_named` with reason `full_frame`, so the code
   already does this; T255 is the test that pins it, with code only if the test fails. FR-008's
   answer key on Mentor Practice 2 is unchanged.
3. **Closed:** Open questions › D-8 and D-9. D-5 to D-7 stay open, with the recommendations in use.

### 2026-10-26, round 5: the opening turn (TD § 19), time labels, the Eval plan's numbers

TD § 19 was approved by the human on 2026-10-26; the fallback line (item 3) was accepted by the
human the same day; B-11 (item 4) was approved for the next build. This spec's wording of them
awaits the builder's approval.

1. **The opening turn (TD § 19, S-5; new FR-006a, FR-009, FR-022, US1 #1, Edge Cases, Eval plan 1
   and the note above it, Fixtures).** The opening carries one choice: a memory clause only for
   this skill's own history, the intent question, and the proposal as its fallback, ending on the
   offer. No leave-outs, no statement of the idea, no recap of other skills. Each leave-out
   sentence is said, and checked, on the turn the learner names that layer. Rejected options are
   TD § 19's, not repeated here.
2. **D-7 withdrawn from the opening.** Its general sentence is kept only for a learner who asks
   about several moving layers at once (Edge Cases; FR-004's note on `moves_case`). Open questions
   › D-7 is closed.
3. **The missing-time fallback (FR-004, US2 #6).** `one_key_off_rest` with `rest_time` or
   `position_key_time` null gets the short "already moves, so it's not in this lesson" line, as
   built in `SKILL.md` on `skill-5-anchor`. Already built; T258 keeps it, keyed on the labels.
4. **Time labels (B-11; FR-004, US2 #6, row 5b, Eval plan 24; data-model › Candidate; contracts ›
   `anchor_snapshot`).** `position_key_label` and `rest_label` on every `one_key_off_rest` entry
   (candidates and `focus_problems`), so the prompt never rounds a time. **Chosen:** labels next
   to the raw times, not instead of them (the raw times stay for the tests, the evals'
   `rest_time` checks and any later comparison). **Same-label rule:** when two times a frame or
   more apart round to the same tenth, both get more decimals (up to three), since "at 3.7 s, but
   at rest at 3.7 s" would contradict the sentence. **Rejected:** *a rounding instruction in
   `SKILL.md`* (what drifted in 24b's smoke run); *frames instead of seconds* (the file and every
   other skill say seconds); *one label for the whole sentence* (puts TD § 18's wording in the
   tool, where the designer can't change it); *labels on every time the tool returns* (the
   playhead line's `position_keyed_tip.time`, `check_times`, the hints' times): not seen drifting
   yet; Open questions › H-6.
5. **The Eval plan (items 11, 24 to 31).** The eval set on `evals-skill-5` kept seven cases the
   plan didn't list; the cockpit numbered them 25 to 31 and they're listed now. Item 11 is now the
   one-focus case with the watch offer, and the two-layer demo is 26, as the eval engineer built
   them.

### 2026-10-26, round 6: TD § 19a (the practicing proposal; a named null, camera, light or adjustment layer)

TD § 19a was decided by the human on 2026-10-26 (B-12). This spec's wording awaits the builder's
approval.

1. **The practicing proposal (TD § 19a item 1; FR-006a, US1 #8, Eval plan 32).** The proposal is
   always the snapshot's `proposal`; `next` gives only the memory clause. TD § 19's "if `next`
   names a layer, that layer is the proposal" is withdrawn by the design, and this spec never
   carried it.
2. **A named null, camera, light or adjustment layer (TD § 19a item 2; FR-004, FR-009, US1 #9,
   Edge Cases, row 14, Eval plan 33).** TD § 19a's one sentence, then the proposal; no pointer to
   the null lesson and nothing about a null's pivot. Row 14's "skill 6's job, only if built" is
   withdrawn.
3. **A continued lesson with no focus yet (FR-006a, Eval plan 35).** Opens as a new lesson. The
   builder's call as built on `skill-5-anchor`; written down here so it's checked, and sent to
   the designer as D-10. The two calls the human accepted as built (no candidate: no intent
   question; "Yesterday" for "Last time") are in FR-006a.
4. **The Eval plan (32 to 37).** Two cases from TD § 19a, the builder's three from round 5
   (continued with and without a focus, "which layers can I use?"), and the same-label case. The
   missing-time line stays unit-tested only (Eval plan, after 37).

### 2026-10-26, round 7: TD § 19b (after HO-2 and HO-3; S-6)

TD § 19b was decided by the cockpit under the human's go-ahead on 2026-10-26. This spec's wording
awaits the builder's approval.

1. **A background is never proposed (S-6 item 1; FR-004, FR-006a, Edge Cases).** The full-frame
   bucket was "last resort, proposed only when nothing else exists", while the tool never proposed
   one, so `SKILL.md` had two instructions. Now: allowed if named, never proposed; no default
   candidate means `proposal` null and the new-solid line. No tool change (as built). Rejected
   options are TD § 19b's.
2. **Effects: nothing said (S-6 item 2; row 8).** No read tells a Transform effect apart.
3. **"Own sides" for flipped layers only (S-6 item 3; row 18).** A static rotation far from 0
   ranks last with no sentence; whether it needs one is TD § 14's logged guess.
4. **L-8 (S-6 item 4; Live checks, row 2; T261).** An expression on an unkeyed Anchor Point or
   Position, at the next sitting with L-6. Row 2 keeps "blind spot, stated" until it's seen.
5. **D-10 answered (S-6 item 5; FR-006a, US1 #10, Eval plan 35).** A continued lesson with no
   focus opens as a new lesson, with the practicing memory clause when the record says
   practicing. FR-006a also notes "they can name it" is not a line to say (TD § 19b item 5b).
6. **The Eval plan follows the eval engineer's rounds 5 and 6:** case 1 is one turn; 34 (and 35)
   check turn 2 after a setup turn; the universal `no_text_before_snapshot` check.
7. **Tasks (Phase 8h):** T260, B-13's seven `SKILL.md` items plus an eighth from the smoke run
   (the record read and the snapshot back to back, nothing written in between); T261, L-8.

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

**New, round 5 (2026-10-26):**

6. **H-6, labels on the other times the tool returns.** B-11 labels only the two
   `one_key_off_rest` times, where the drift was seen. The prompt still writes other times itself:
   the playhead line (`position_keyed_tip`'s time, "at 3.7 s"), the rest key (`check_times`), and
   the slid and rest hints. **Recommended:** not now; add the same labels to those, with the same
   helper, only if an eval or live lesson shows one drifting. Each is a single time, so the
   same-label clash can't happen there, and widening the tool now touches five fields and most of
   the eval set's time checks for a drift not yet seen.

### For the curriculum designer (D): D-1 to D-3 answered in TD § 15, D-4 and the wording list in TD § 16, D-8 and D-9 in TD § 18, D-7 in TD § 19, D-10 in TD § 19b; D-5 and D-6 open (round 2, 2026-10-26)

1. **D-1, a Rotation-only layer with no key at 0 or a whole turn**: the key closest to 0 or a
   whole turn, one sentence, "is that how it looks at rest?" (FR-011).
2. **D-2, locked layers**: allowed if named with the unlock sentence, never proposed, never the
   demo; the hint names the lock if it's still locked at "done" (FR-004, FR-019, row 28).
3. **D-3, "a pivot still where AE put it"**: widened by the designer to the rectangle's center or
   the layer's own origin (0, 0), for every layer type (FR-004's ranking).
4. **D-4, a layer with two or more Position keys: closed 2026-10-26 (TD § 16).** Accepted with
   three adjustments: count key times (X and Y together, hold keys included); the one-key
   exception only when the key is on the check time; the designer's sentence ("would shift where
   it sits", not "jump"). In this spec: FR-004 (`position_moves`), FR-009, FR-012 item 4, FR-013,
   rows 5, 5b and 6, US2 #4 and #5, Out of scope (C-3), Eval plan 13 and 22; tasks T245 to T247.

**TD wording list (Open questions › D, items 1 to 7 of 2026-10-26): answered in TD § 16.**
Items 1, 2 and 7 were confirmed as proposed and are already in FR-004, FR-014, FR-023 and rows
21 to 23. Items 3 to 6 were reworded by the designer; this spec now points at TD § 7's rows for
the lines and keeps only the hint codes and what each must say: item 3 → `unchanged_shape` and
`content_shifted` (FR-019b); item 4 → `outside` (FR-019a); item 5 → `away_from_rest` (FR-019);
item 6 → `wrong_layer` and `other_layer_moved` (FR-019). The spec's earlier proposed lines are
withdrawn, not kept as a second copy.

**New, round 2 (wording only; none blocks T236, T237 or HO-1, and `SKILL.md` uses the
recommendation until answered):**

5. **D-5, "far" in the Pop line.** TD § 7: "it did move Pop's pivot, far below it." The tool gives
   the side (`item1.outside_side`), not a distance, so "far" is a claim nothing measures; in the
   one capture (L-4) it was true. **Recommended:** keep "far below it" only when `item1.place_now`
   is `outside` with a side (L-4's pattern: AE reads the cursor's comp point as a layer point),
   and drop the clause otherwise, never a guess.
6. **D-6, "its first key" in the Gauge line.** TD § 7's rest row: "Put the playhead on its first
   key, where it's at rest." The rest key isn't always the first (Pop's is its last), and the tool
   returns a time and a basis, not an ordinal. **Recommended:** the time only ("its key at
   3.2 s"), as TD § 16's last note says times come from the read.
7. **D-7, the opening leave-out for layers that already move.** TD § 4's sentence is for a learner
   who names Sled ("Pick a layer that doesn't move yet?"). With no layer in mind, US1 #1 names
   leave-outs once per reason, and on Mentor Practice 2 that's 16 layers. **Recommended:** one
   general sentence naming at most two of them ("Sled and Card already move, so they're not in
   this lesson; set a pivot before you key"), designer's wording.
   **Closed 2026-10-26 (round 5, TD § 19): withdrawn from the opening.** The opening names no
   leave-outs; each layer's sentence is said when the learner names it (FR-006a, FR-009). The
   general sentence is kept only for a learner who asks about several moving layers at once (Edge
   Cases).

**Round 3, closed 2026-10-26 (TD § 18, `47c90bd`; carried in as round 4):**

8. **D-8, the "already moves" sentence on a one-key layer: answered.** A second sentence, about
   the two frames, for a layer with one Position key whose rest key (the tool's, or the
   learner's `rest_time`) is more than half a frame away; the Sled line stays for two or more key
   times. Both are said once when the learner names the layer; in the opening a one-key layer
   falls under D-7's general sentence. The designer rewrote this spec's draft ("I can't set its
   pivot" made it the mentor's limit). In this spec: FR-004 (`moves_case`), FR-009, US2 #6, the
   Edge Cases list, row 5b, Eval plan 24; tasks T254 and T256. The sentence is TD § 18's, not
   copied here.
9. **D-9, which layer the watch is on: confirmed, with one clarification.** The spec's reading
   stands (a default candidate other than the focus, not already at its place, a Rotation- or
   Scale-keyed layer only with its rest key on the focus's check time), plus: never a full-frame
   layer (`full_frame: true`); `null` gets no extra filter. In this spec: FR-008; task T255. The
   answer key on Mentor Practice 2 is unchanged.

**Round 6, closed 2026-10-26 (TD § 19b; carried in as round 7):**

10. **D-10, a continued lesson that left off before a layer and place were chosen.** TD § 19's
    continued form says where it left off and hands it back, with no intent question or proposal;
    with no focus in the session there's nothing to hand back. The builder made a call
    (`SKILL.md` step 1 on `skill-5-anchor`): open as a first lesson. **Recommended:** confirm, with
    one widening the spec already makes: open as a new lesson *by the record*, so a practicing
    learner still gets the memory clause (FR-006a). Eval plan 35 checks it.
    **Answered 2026-10-26 (round 7, TD § 19b item 5c), as recommended:** a new lesson, with the
    practicing memory clause when step 0 found this skill practicing; the build's "open as a
    first lesson" dropped it, so B-13 item 6 (T260) changes `SKILL.md`. In this spec: FR-006a,
    US1 #10, Eval plan 35.

### For the eval engineer (E)

- The Eval plan, with fixtures from L-4's captures and T135's anchor capture.
- **2026-10-26:** the cases on `evals-skill-5` were built on stand-ins (comp 300, 19 layers). Move
  them to the live captures (Eval plan › Fixtures) and to what changed: shapes aren't
  `shape_until_l1` any more (7 files name it); case 6's "select it first" and case 20's "no menu
  path" contradict L-3; case 7 adds Edit > Undo; cases 19 to 21 are new. Wait for T241 to T244
  before a baseline.
- **2026-10-26, round 2:** case 13 is now Sled as a leave-out (D-4), case 20 adds "not both
  lines", case 22 (one key, dragged off it) is new and optional. Rubric wording for the hints
  comes from TD § 7's rows, not this spec. Wait for T245 to T247 before a baseline.
- **2026-10-26, round 3:** case 11 is now "none on the learner's layer; one offer on another";
  case 16 adds "no watch offer"; case 23 (the watch offer: no, already passed, yes) is new and
  comes from T236's problem 2. The cases read `watch_offer` from the tool, so wait for T249 and
  T250 before writing 11 and 23 against the build, and before a baseline. FR-013a (T251 to T253)
  doesn't touch the evals: fixture mode doesn't time AE or take sampled reads.
- **2026-10-26, round 4:** case 24 (a one-key layer named, its rest key on another frame: TD
  § 18's two-frames sentence) is new, on a synthetic fixture since no live capture has such a
  layer. It reads `moves_case`, `position_key_time` and `rest_time` from the tool, so wait for
  T254 and T256 before writing it against the build, and before a baseline. Case 13's Sled
  (three key times) is `two_or_more` and doesn't change. D-9 changes no case.
- **2026-10-26, round 5 (TD § 19, B-11):** cases that look for a leave-out sentence in turn 1
  move that check to the turn the layer is named, and turn 1 is checked for none (case 1, 24c);
  R-ONE-IDEA goes back on case 1 with TD § 19's reading in its case note; case 24's time checks
  take the tool's labels exactly once T258 lands; cases 25 to 31 and the 11/26 split are now in
  the Eval plan as built. Wait for T257 (and T258 for case 24) before re-running them, and before
  a baseline.
- **2026-10-26, round 6 (TD § 19a, B-12):** cases 32 to 37 are new (Eval plan › Round 6): 32
  practicing proposes the snapshot's `proposal`, 33 the learner names CTRL (or Hatch Rig, your
  call on the fixture), 34 and 35 a continued lesson with and without a focus, 36 "which layers
  can I use?", 37 the same-label times. Wait for T259 (and T258 for 37) before writing them
  against the build. The missing-time line is unit-tested only.
- **2026-10-26, round 7 (TD § 19b, S-6):** no case change needed. The Eval plan now matches
  what you built in rounds 5 and 6 (case 1 in one turn; 34 and 35 checked on turn 2 after a setup
  turn; the universal `no_text_before_snapshot`). Two optional additions, your call: 35's
  practicing variant (one memory clause, US1 #10), and TD § 19b's background-only comp (opens
  with the new-solid line and never offers the background). Re-run the seven transcripts that
  leaked a self-note once T260 lands, before a baseline.

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
  - **SR-4 (conditional, round 3; raised only if T251 shows a plain read alone is over 3 s):**
    find what a plain `snapshot.jsx` read costs on a 40-layer comp (per-layer samples at every key
    time, `layer_info`, the bridge) and make it cheaper, for SC-010. The same read serves every
    skill, so easing's `snapshot_project` would gain too. (SR-3 is the branch's tool-file order
    request.)
- **Spec 012** (null parenting, in parallel): shares Mentor Practice 2b and comp-space; no
  dependency either way beyond skill 5 being skill 6's hard prerequisite in the path.
- **Eval engineer**: the Eval plan; fixtures from L-4 and T135.
