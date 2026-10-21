# Feature Specification: Pick the key type on purpose (curriculum skill 1, key types)

**Feature Branch**: `009-key-types` (spec folder only; no git branch)

**Created**: 2026-10-20

**Status**: Draft, awaiting the builder's approval. Plan and tasks come after approval.

**Input**: Cockpit task, Sprint 3 wave A planning, round 2: "Write the build spec for curriculum
skill 1, key types (hold and linear)." The teaching design is the curriculum designer's
[`teaching-design.md`](teaching-design.md) (same folder, `decisions/007`, draft round 1). This spec
links to it and turns it into requirements. It doesn't restate or change what is taught; where it
needs something the design doesn't say, it's a question for the designer (Open questions › C).

**What this spec is, and isn't.** It specifies skill 1's lesson and review as a module that plugs
into the shared pieces from spec 004 (wave A): its focus and candidate rule, its one demonstration,
its check, the "linear on purpose" mark it writes (spec 004 FR-038), its overlap rows, the live
checks the builder runs before its wording is final, and the eval cases the eval engineer writes.
It does **not** specify shared code. Anything this skill needs from shared files is a request to
the shared-code owner (spec 004 FR-032), listed under Shared-code requests.

## Why this skill

- **The pain.** A blink that fades, a cut that dissolves and a constant spin that got eased are all
  key type mistakes. After the easing lesson the learner's habit is "ease everything"; this is where
  "not everything should ease" comes in (`teaching-design.md` › 1).
- **Depth Adobe's assistant doesn't have today.** On 2026-10-08 it said the Cursor in Mentor
  Practice "ramps evenly between 100 and 0 every 0.5s, so it pulses rather than blinks", then called
  it fixed after a change (`discovery/usage-notes/adobe-assistant-2026-10-08.md`). The read on
  2026-10-20 (`discovery/usage-notes/mentor-practice-state-2026-10-20.md`) found the Cursor all hold,
  as its build script makes it, with nothing in the record or usage notes saying it was ever changed:
  it was almost certainly held that day, so **Adobe misread the key types** (curriculum B2, answered).
  Knack reads each key's incoming and outgoing type and checks every pair directly.
- **Memory and practice.** In a later session the review asks the learner to make a new on/off
  change snap with no demonstration, and the record keeps the learner's "this one runs at constant
  speed" as a fact about that property, so easing and diagnosis stop pushing to ease it (spec 004
  FR-038). Adobe's assistant described no memory of the learner.
- **Not the edge:** restraint and leading. A mode switch could copy those (`decisions/002`), so this
  spec's "why" rests on the two points above.

## Decisions and rules this spec relies on

- `decisions/002` (the bet; the "why" names depth and memory, not restraint).
- `decisions/003` amended by `005`: narrow mentor tools, no open-ended scripts, record in local
  files, the panel only displays. The demo is one fixed write (FR-010).
- `decisions/007`: the curriculum designer owns `teaching-design.md`; the skill builder builds;
  the eval engineer owns and writes the eval cases.
- `decisions/008`: one agent on After Effects at a time; ownership hooks; the skill branch is
  checked with `check-branch.mjs` **without** `--shared-owner`.
- Constitution 1.3.0: I (this spec before build), II (FR-010), III (Eval plan), IV (FR-020), VI
  (the eval engineer writes the cases; the builder doesn't).
- Spec 002 (easing): the lesson shape and server rules.
- Spec 004 (approved): FR-004, FR-005 (prerequisites), FR-018 to FR-022 (record and reviews),
  FR-024 and FR-025 (one demo, six stages), FR-030 (version), FR-031 (second practice comp), FR-032
  (add files only), FR-033 to FR-035 (evals, overlap audit, easing holds), **FR-038 and SC-013**
  (linear on purpose is remembered, the builder's call on 2026-10-20). Its
  [contracts/skill-module.md](../004-ae-curriculum/contracts/skill-module.md) (record ID
  `keyframes.types`, short name `key-types`, tools `key_types_snapshot`, `key_types_demo`,
  `key_types_check`, and § 6 kept-linear marks) and
  [contracts/shared-tools.md](../004-ae-curriculum/contracts/shared-tools.md).

None needs changing. One shared-code request is needed (SR-1, below).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Make a cut snap on my own comp (Priority: P1)

I've learned easing. Knack asks whether anything in my comp is meant to snap, like a blink, an
on/off or a cut, and names a few likely ones. I say which one. It shows me, with a frame from my
comp, that the pair is fading where I wanted a jump, shows one hold if I ask, and then I hold the
rest. When I say "done", it checks every pair and tells me what's still off and where.

**Why this priority**: this is the skill. Without it there's nothing to review or remember.

**Independent Test**: on Mentor Practice 2 (spec 004 T041), run the lesson on Blink from start to a
verified pass with at most one demonstration, and on the saved snapshots the check's results match
the answer key pair by pair.

**Acceptance Scenarios**:

1. **Given** a comp with Opacity pairs going between 0 and 100 that aren't held, **When** the lesson
   starts, **Then** the mentor asks what's meant to snap before proposing anything, and names at
   most three candidates by layer and property (FR-003, FR-004).
2. **Given** the learner says a candidate is meant to fade, **When** the mentor answers, **Then** it
   drops it with no argument (FR-004).
3. **Given** the learner names a pair that isn't a candidate (a Position jump), **When** the read
   can see its keys, **Then** it becomes the focus (FR-005).
4. **Given** a focus with two or more pairs and the learner asks for a demonstration, **When** the
   mentor demonstrates, **Then** it holds one pair only, on the demo target, says Edit > Undo
   reverses it, and shows a frame either side of the jump (FR-010).
5. **Given** the learner says "done" with a focus pair still fading, **When** the mentor checks,
   **Then** it names the layer, property and time that still fade, gives the hint in
   `teaching-design.md` › 7, and doesn't fix it or offer to (FR-011, FR-017).
6. **Given** the learner held a pair they had said should move, **When** the mentor checks, **Then**
   the lesson doesn't pass and the mentor says which pair now waits and then jumps (FR-012).
7. **Given** a comp with no candidate and the learner names nothing (Mentor Practice as it is
   today), **When** the lesson starts, **Then** the mentor says so and offers the practice blink or
   Mentor Practice 2, and never invents a focus (FR-007, FR-008).

---

### User Story 2 - Say what runs at constant speed, and have it remembered (Priority: P2)

After the holds pass, Knack asks whether any move in my comp should run at constant speed. If I name
one, it checks that it's linear at both ends and, if it is, remembers it, so a later easing lesson
leaves it alone and says why.

**Why this priority**: it completes the outcome ("the type is a choice") and is what spec 004
FR-038 needs a writer for, but the hold lesson works without it. P2.

**Independent Test**: on Mentor Practice 2, name Spinner's Rotation at stage 6; the record then holds
one kept-linear mark for it, and an easing lesson on that comp leaves Spinner's Rotation out and
names it once (spec 004 SC-013).

**Acceptance Scenarios**:

1. **Given** the learner names a move whose every pair is linear at both ends, **When** the check
   runs, **Then** it passes item 3 and the lesson's record write keeps a kept-linear mark (FR-014).
2. **Given** the named move is eased or held somewhere, **When** the check runs, **Then** the mentor
   says in one sentence how to make it linear and checks again on "done"; no mark is written until a
   check sees it linear (FR-014).
3. **Given** the named move has an expression on it (Logo's Rotation in Mentor Practice), **When**
   the check runs, **Then** the mentor says an expression drives it, so it can't check the keys;
   no mark is written, and the lesson isn't failed for it (FR-014).
4. **Given** the learner names nothing, **When** stage 6 ends, **Then** item 3 doesn't apply.

---

### User Story 3 - Review it in a later session (Priority: P1, in the sprint baseline)

A day or more after I passed, Knack asks again what's meant to snap in my comp, on something I
haven't done for this skill, and says "make it snap" with no demonstration and no walkthrough. It
checks it the same way.

**Why this priority**: reviews for skills 2, 1 and 3 are in the sprint baseline (spec 004 H2), and
review mode has to ship in the first build because the tool file can't change after it merges
(spec 004 plan › Wave C).

**Independent Test**: with a saved record that says skill 1 was learned with Blink as its target and
the review due, on Mentor Practice 2 the mentor offers a review on Cut, asks the intent question,
gives no demo and no walkthrough, checks it, and records a review with the next due date.

**Acceptance Scenarios**:

1. **Given** a due review and a candidate on a layer and property not in the record for this skill
   on this comp, **When** the review runs, **Then** it asks what's meant to snap first, then "make
   it snap" with no demonstration, walkthrough or menu path (FR-019).
2. **Given** the learner says nothing should snap, **When** the review ends, **Then** nothing is
   recorded and the review stays due (FR-019).
3. **Given** the attempt doesn't pass, **When** the mentor checks, **Then** it gives the hints in
   `teaching-design.md` › 7 and doesn't reteach (FR-019).
4. **Given** no candidate the record hasn't seen, **When** a session starts, **Then** no review is
   offered for this skill (FR-020).

---

### User Story 4 - The skill is evaluated, and easing still holds (Priority: P1)

The eval engineer can run skill 1's cases on saved snapshots without After Effects, and the easing
set still passes.

**Why this priority**: constitution III; the sprint counts a skill only with eval cases.

**Independent Test**: run skill 1's eval cases and the easing set; each case passes or fails.

**Acceptance Scenarios**:

1. **Given** skill 1 is merged, **When** its cases run, **Then** at least 80% pass and every
   hard-rule check passes (SC-005).
2. **Given** skill 1 is merged, **When** the easing set runs, **Then** it passes at 25/25 or within
   one case, with no hard-rule failure (SC-004).

---

### Edge cases where concepts overlap (from `/overlap-audit`, spec 004 FR-034)

The teaching rules for each row are `teaching-design.md` › 9; this table says what each check sees,
which shared classifier it reuses, and where a reuse could hide something. Each row gets a unit
test on a saved snapshot (FR-021). "Candidate" is FR-003; "check" is `key_types_check`.

**Classifiers this skill reuses, and for which job:**

| Classifier (shared, spec 004) | Easing uses it to | Skill 1 uses it to | Risk |
|---|---|---|---|
| `segments` / `segmentState` | find pairs to ease; `held` = skip | find pairs and say whether they're held | The **mixed pair** (row 6): `segmentState` calls it `partly_eased` (first key linear) or `eased` (bezier). If After Effects actually jumps there (L-1), easing would ask to ease a pair that snaps, and skill 1 would call a snapping pair "not held". |
| `segments`' skip on expression and single key | leave them out of teaching | leave them out of candidates and grading | Right for both; the change check must still report key changes under an expression (rows 1, 3) |
| `unexpectedChanges` | list other changes | list holds outside the focus | **Not** enough for pass item 2: it says "was changed", not "now held, and you said it should move". Item 2 needs its own check (FR-012) |
| eye switch (`layer.enabled`; the visibility class comes with R1 in wave B) | leave eye-off layers out | leave eye-off layers out of candidates and the demo | A matte with its eye off is left out (row 13; KD-001) until wave B |
| kept-linear marks (`applies`) | skip marked properties | skip them as candidates; write them at stage 6 | Writing a mark on an expression property would make easing skip a property the check never saw (row 1): the check rejects it first (FR-014) |
| session baseline (`session.start` continues an unpassed lesson on its first baseline) | the baseline is the first look | the baseline is the first look | **The practice blink is made after the first look**, so its keys aren't in the baseline and can't be targets (row 17). Needs SR-1 |

**The matrix:**

| # | Overlap | Candidates and focus see | Check sees | Learner is told | Right? |
|---|---|---|---|---|---|
| 1 | Expression over keys (a `loopOut` blink; Logo's Rotation) | Not a candidate; can't be the focus | Not graded; key changes under it still listed as other changes, with the "may not change the motion" note | "An expression drives this, so the key types may not be what you see" | Right. At stage 6, named as constant speed: reported as `expression`, no mark (FR-014) |
| 2 | Expression with no keys | Not read until R2 | Not read | Never "there's none"; never claims everything that changes is the focus | Right (pin) |
| 3 | Single key | Not a pair; not a candidate; can't be the focus | Nothing to grade | "That's one key, so there's nothing to snap between" if named | Right |
| 4 | Already held pair (the Cursor) | Not a candidate; used for the stage 2 frames | Not a target; never credited to the learner | Named once: "the Cursor already snaps" | Right |
| 5 | Focus property with some pairs held and some not | Targets are the non-held pairs only | Grades those | The held ones aren't counted | Right |
| 6 | Mixed pair (first key linear or bezier out, second key hold in) | Not held, so a candidate if its values qualify | Not held; never a pass on it; never "done" | The pair is named as still off; wording of the "wrong side" hint waits for L-1 | Right until L-1. If L-1 shows a jump, SR-2 |
| 7 | Separated dimensions | Naming Position on a separated layer means each keyed dimension's moving pairs | Each dimension checked on its own | "X Position snaps now, but Y Position still slides between 0.5 s and 1.0 s" | Right |
| 8 | Hold-only effect parameters (checkboxes, menus) and Source Text | Their keys read as held: not candidates | Never credited as the learner's | "That one only ever jumps" if named | Right (pin with a capture) |
| 9 | Opacity on an effect, a shape's fill or stroke, or a text animator | Not a candidate (only the layer's own Transform Opacity is) | Graded if the learner names it | Nothing unless named | Right (FR-003) |
| 10 | Precomp layer | Its own Transform keys are read and can be candidates; inside isn't read | Its own keys only | "I can't see inside these yet" for what's inside | Right |
| 11 | Hidden layer (eye off) | Not a candidate; can be the focus if the learner wants it; never the demo | Graded if focus | Named among what's left out | Right |
| 12 | Hold at Opacity 0 (eye on, invisible between keys) | Not "hidden"; a normal layer | Normal | Never "hidden"; the demo's "after" frame is picked where the layer shows, or the jump to 0 is said in words | Right (FR-010) |
| 13 | Track matte, eye off (KD-001) | Left out like an eye-off layer, "unless you want it", until R1 | Graded if focus | Never "you've hidden this" once R1 can tell; until then the generic left-out wording | Wave A right; wave B change (SR-3) |
| 14 | Null | Not a default candidate; can be the focus if named; never the demo | Graded if focus | Nothing unless named | Right |
| 15 | Parenting | Opacity isn't inherited by children, and a parent's held Position moves children with no keys of their own: none of this is read at this level | Own keys only | Nothing | Right (curriculum § 8) |
| 16 | Pause pair (both values known and equal) | Not a candidate; not a target even inside a named property | Not graded | Nothing (holding it changes nothing) | Added here; question C-2 |
| 17 | Practice blink made during the lesson | Its keys don't exist at the first look | With today's session, not in the baseline: no targets | Would be told there's nothing to check | **Wrong** without SR-1 |
| 18 | Keys added, removed or moved during the attempt | Pair IDs shift | Reported as "now has N keys" (existing other-changes rule); the affected focus pairs as removed or changed | Where it changed, and asks if it was meant | Right (pin) |
| 19 | "Select all, toggle hold" | n/a | Holds on pairs outside the focus listed; the first key's incoming side and the last key's outgoing side face no pair and are ignored | `teaching-design.md` › 7 row 3, then asks whether it was meant | Right (FR-013) |
| 20 | The demo pair undone and re-held by the learner | n/a | A hold has no fingerprint (unlike easing's influence), so it can't be told apart from the demo unless a check saw it not held in between | Credited to the demo unless a check saw it undone | Right, and said plainly (FR-011) |
| 21 | Kept-linear mark on an Opacity 0 ↔ 100 property | Not a candidate | n/a | Named once with the learner's reason | Right (FR-015) |
| 22 | Key values unknown (older captures, non-numeric values) | Not a candidate by value; can be the focus if named | Graded on types only | Nothing | Right; skill 1 fixtures must be live captures with values |
| 23 | A layer outside the active comp, or the learner switches comps mid-lesson | Not read | Comp mismatch, as easing | As easing | Right |

### Other edge cases

- **Mentor Practice (no real skill 1 target).** Title Opacity (0 → 100, linear) and Subtitle
  Opacity (half-eased) meet the candidate rule, so the mentor names them; they're fades that are
  almost certainly meant to fade. The Cursor is held already; Logo's Rotation is linear on purpose
  but under an expression. So a first lesson on Mentor Practice normally goes "meant to fade" →
  practice blink or Mentor Practice 2 (FR-008; disagreement C-1 with the design's § 4).
- **AE busy or unreachable:** no claims, no check, no review result (server rule 2).
- **Learner insists without easing learned:** spec 004 FR-005 and `teaching-design.md` › 3.
- **Learner names a move as both "snap" and "constant speed":** the check reports it held at stage 6,
  so item 3 isn't met for it; the mentor asks which they meant.
- **Learner withdraws a constant-speed move** ("never mind"): item 3 doesn't apply; no mark.
- **Record unreadable:** the lesson runs; no marks are read (spec 004 T053); nothing is written over.

## Requirements *(mandatory)*

### How the skill plugs in

- **FR-001**: The skill MUST be built to spec 004's skill-module contract: record ID
  `keyframes.types`, short name `key-types`, tools `key_types_snapshot`, `key_types_demo` and
  `key_types_check`, the files in the contract's § 1 table (including
  `.claude/skills/key-types-mentor/SKILL.md`), and nothing else. The branch MUST change no existing
  file (`check-branch.mjs` without `--shared-owner` passes). It MUST NOT use the `after-effects`
  tools or an open-ended script, read or write the learner files directly, or copy the pair, timing
  or session logic (contract § 7).
- **FR-002**: The lesson MUST follow `teaching-design.md` › 2 to 7, 10 and 12 (outcome,
  prerequisite, focus, stages 0 to 7, pass, hints, version notes, record), with the six-stage shape
  and server rules of spec 004 FR-025. This spec settles only what the design delegated (FR-003,
  FR-014) and what each check sees.

### Focus

- **FR-003 (S-1, settled)**: A pair is a **candidate** when all hold: it's on the layer's own
  Transform Opacity (not an effect's, a shape's fill or stroke, or a text animator's); one key's value
  is 0 and the other's is 100, each within 0.5, in either order; it isn't held (its first key's
  outgoing side isn't hold; a mixed pair counts as not held); the property has two or more keys and
  no expression on; the layer's eye is on and it isn't a null; both values are known; and no
  kept-linear mark applies to the property. "Step-like values" (curriculum § 6) is not used: it has no
  readable definition. Candidates are grouped by layer and property; at most three properties are
  named, earliest first key time first, then layer order.
- **FR-004**: Candidates MUST only help the learner answer the intent question; none becomes the
  focus without the learner's answer. A candidate the learner says is meant to fade (or move) MUST be
  dropped with no argument, and kept for this lesson as a property that **should move** (FR-012).
- **FR-005**: Anything the learner names MUST be accepted as the focus if it's a keyed layer and
  property in the active comp with at least one non-held pair, two or more keys and no expression.
  The targets are all of that property's non-held pairs whose values aren't known to be equal
  (row 16); Position on a separated layer means each keyed dimension (row 7). A hidden layer or null
  is allowed when named. Anything else (an expression, a single key, all pairs already held, inside a
  precomp) is refused in one sentence saying why (rows 1, 3, 4, 10).
- **FR-006**: `key_types_snapshot` MUST accept a focus by **layer and property** (not only layer) and
  `mode` (`lesson` or `review`), and return: the candidates; the targets and demo target the session
  gives; the held pairs available for the stage 2 explanation frame; and what's left out, each with
  its reason (hidden, precomp, expression, already held, kept linear, unknown values). The property
  focus is passed to the skill's own analyzer; it needs no shared change.
- **FR-007**: With no candidate and nothing named, the mentor MUST offer the practice blink
  (`teaching-design.md` › 4) or Mentor Practice 2, and never invent a focus. A practice blink the
  learner makes MUST become the lesson's targets: the lesson's baseline is the read taken after the
  blink exists (needs **SR-1**). If the learner declines both, the lesson ends and nothing is
  recorded.
- **FR-008**: On Mentor Practice as it is (2026-10-20 read), the mentor MUST name Title Opacity and
  Subtitle Opacity as candidates, name the Cursor once as already snapping (and use it for the stage 2
  frames), name Logo's Rotation as driven by an expression, and never call the fades mistakes. A
  "meant to fade" answer leads to FR-007.
- **FR-009**: The skill MUST declare `FINDERS["keyframes.types"].focus(snapshot, { exclude })`,
  returning the number of candidate properties (FR-003) not in `exclude` and their layers, agreeing
  with its analyzer (contract § 2), and `review: true` once its review tests pass, in the first build.

### Demonstration

- **FR-010**: `key_types_demo` MUST make one write on the demo target only: the target pair's first
  key set to hold on its outgoing side, **exactly as Toggle Hold Keyframe writes it at 26.5** (L-2
  decides whether that's the outgoing side only or both sides), so the demo and the learner's own
  toggles look the same on the timeline. It calls `session.assertCanDemo` before touching After
  Effects, runs one fixed snippet with undo on, records the demo, and returns what changed and
  "Edit > Undo". The demo target is the earliest focus pair in time on an eye-on, non-null layer;
  there's none with one focus pair (the mentor walks it through in words), none in a review, and
  never on a hidden layer or null. The snippet has a fixture twin (contract § 5). The frames shown
  are one frame before and one after the pair's second key; when the jump lands on Opacity 0, the
  mentor says the layer vanishes there and never calls it hidden (row 12).

### Check

- **FR-011**: `key_types_check` MUST take a fresh read, compare it with the lesson's baseline pair by
  pair, and report for each focus pair one of: held by the learner, held by the demo, still not held
  (with its state, and the time of a frame inside it for the hint), held on the wrong side (second
  key's incoming side hold, first key's outgoing side not), or removed or changed keys. Separated
  dimensions are reported per dimension. The demo pair counts as the demo's while it stays held; once
  a check sees it not held, it's the learner's from then on (row 20).
- **FR-012**: The check MUST take the properties the learner said **should move** in this lesson
  (FR-004, and any they say during it) as input and fail pass item 2 for any of their pairs that is
  held now and wasn't at the baseline, naming the layer, property and the time it now waits until.
  It MUST NOT rely on the generic other-changes list for this.
- **FR-013**: Holds on pairs outside the focus and the should-move list MUST be listed by layer,
  property and time (row 19). They don't fail the lesson; the mentor asks whether they were meant
  (`teaching-design.md` › 7 row 3).
- **FR-014 (linear on purpose; S-2 settled by spec 004 FR-038)**: At stage 6 the check MUST take the
  move the learner named as constant speed (layer and property; a layer with one keyed property means
  that property; Position on a separated layer means each keyed dimension) and report one of:
  **linear** (every pair linear at both ends), **not linear** (which pairs and which side), **held**,
  **expression**, **single key** or **not found**. Only for **linear** does it call
  `session.keepLinear` with its fresh read; for the others it calls nothing, so the learner never hears
  `NOT_KEPT_LINEAR`'s "set its keys to linear" for an expression or a name it couldn't find. Item 3
  passes on **linear**; on **expression** the item doesn't apply (the mentor can't check it). The
  model can't write a mark any other way (spec 004 FR-038). Stage 6 isn't asked in a review; if the
  learner volunteers one there, the check may confirm and mark it, and it doesn't affect the review's
  pass (question H-4).
- **FR-015**: A property with an applying kept-linear mark MUST NOT be a candidate, and the mentor
  names it once with the learner's reason (row 21).
- **FR-016 (pass)**: The lesson passes when `teaching-design.md` › 6's items 1 to 3 hold at a check
  of the lesson's comp. The check calls `session.markChecked` only when the comp matches and never
  changes the baseline. A mixed pair is never a pass and the mentor never says it's done (row 6).

### Wording and version

- **FR-017**: Hints MUST follow `teaching-design.md` › 7: where to look, never the fix, never an offer
  to fix; "do the rest" is declined. The mentor MUST NOT say "freeze" for hold or name Layer > Time >
  Freeze Frame.
- **FR-018 (version, spec 004 FR-030)**: The skill reads the version at the start. At 26.5 on macOS it
  MUST name the menu path and the right-click on a key, and MUST NOT quote a Mac shortcut for Toggle
  Hold Keyframe or Keyframe Interpolation until L-2 has read it off the menu; it describes menus, not
  icons. On another version it names the menu path only.

### Record

- **FR-019 (review)**: Review mode MUST ship in the first build (spec 004 plan › Wave C) and follow
  `teaching-design.md` › 11 and spec 004 FR-019 to FR-021: a target is a candidate on a layer and
  property not in the record for this skill on this comp; the intent question comes first; then
  "make it snap" with no demo, walkthrough or menu path; pass items 1 and 2 on what they named; no
  stage 6 question; "nothing should snap" ends the review with nothing recorded; a review that doesn't
  pass gets the hints, no reteach; "I already know it" runs the same way.
- **FR-020**: Record writes MUST follow `teaching-design.md` › 12 and spec 004 FR-018 and FR-022:
  targets include a practice blink; the summary may say what the learner said a pair is meant to do
  (a statement about their work, not a motive); no method, no motive, no names, emails or phone
  numbers. Marks are written only through the lesson (FR-014).

### Tests, fixtures and live checks

- **FR-021**: Every row of the overlap matrix MUST have a unit test on a saved snapshot. Fixtures are
  live captures with key values (rows 8 and 22): Mentor Practice 2 (spec 004 T042) and planted
  overlaps captured live. Synthetic edits of a capture are allowed only where spec 004 already allows
  them, each marked as such.
- **FR-022**: The skill MUST use the shared pair classification as it is; a mixed pair is not held.
  If L-1 shows After Effects jumps on a mixed pair, that's a request to the shared-code owner (SR-2),
  not a change in this skill.
- **FR-023**: In wave A the skill uses the eye switch for candidates and the demo. Moving it to the
  visibility class (spec 004 FR-013) when R1 lands changes this skill's merged file, so it's a wave B
  shared-owner change (SR-3).
- **FR-024**: Before `SKILL.md`'s version wording and the demo snippet are final, the builder MUST
  run the live checks L-1 to L-4 (below) on After Effects 26.5 and log them in
  `discovery/usage-notes/`. No step, eval case or snippet may depend on a guess at their answer.

### Live checks for the builder (🖐, not guesses)

| ID | From | What to check on 26.5, macOS 27.0.1 | Decides |
|---|---|---|---|
| L-1 | design B-2 | Mixed pair: first key linear (and bezier) outgoing, second key hold incoming. Frames inside the pair: does the value travel or jump? | Row 6, FR-022, the "wrong side" hint wording; SR-2 if it jumps |
| L-2 | design B-3 | Toggle Hold Keyframe: what it writes (outgoing only or both sides, read back by the snapshot); its place in the Animation menu and the key's right-click menu; the Mac shortcut shown on the menu; where Keyframe Interpolation lives and its Temporal Interpolation: Linear option | FR-010's write, FR-018's wording |
| L-3 | design B-3 | The demo snippet's result next to a hand toggle on the same comp: same key icon, same snapshot types | FR-010 |
| L-4 | design B-1, spec 004 T041 to T042 | Mentor Practice 2 has Blink, Spinner and Cut as built, and its capture has key values; Mentor Practice's capture matches | Fixtures (FR-021), SC-001 |

### Key Entities

- **Candidate**: a non-held Opacity pair going between 0 and 100 on an eye-on, non-null layer, with
  known values, no expression and no kept-linear mark (FR-003).
- **Focus**: the layer and property (or properties) the learner named; its targets are their non-held,
  non-pause pairs.
- **Should-move list**: properties the learner said should move in this lesson (FR-012).
- **Constant-speed move**: the layer and property named at stage 6, and the check's verdict on it.
- **Kept-linear mark**: spec 004's (data-model › Kept-linear mark), written only after a **linear**
  verdict.

## Shared-code requests (to the cockpit, for the shared-code owner; not this skill's work)

- **SR-1 (needed before skill 1 builds): a fresh baseline when the learner has just made the
  target.** `session.start` continues an unpassed lesson for the same skill and comp from its first
  baseline, so a practice blink made after the first look has no keys in the baseline and can't be
  targeted (row 17). Ask: a way for a skill to start the lesson again from the current read while no
  demo has run and no check has been made (for example a `fresh` option on `start`), refused after a
  demo or check. Add it to spec 004's T017 and T006 (session contract and its test) before the wave A
  merge, since nothing shared changes after it.
- **SR-2 (only if L-1 shows a jump): the mixed pair is held.** `segmentState` would then call a
  snapping pair `partly_eased` or `eased`, so easing would ask to ease it and diagnosis's DX-05 would
  misread it. The fix is the shared owner's, with easing's evals re-run.
- **SR-3 (wave B): skill 1 reads the visibility class.** When R1 and the visibility class land, the
  owner switches this skill's candidate and demo filter from the eye switch, so a matte's Opacity can
  be a candidate (row 13).

Not a request: `NOT_KEPT_LINEAR` has one message for every reason; FR-014's pre-check avoids
showing it in the wrong case, so no shared change is needed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A live lesson on Mentor Practice 2, from start to a verified pass on Blink, takes **15
  minutes or less** with **at most one demonstration** (spec 004 SC-001). *Measured by:* the
  builder, in usage notes, with timings from the call log.
- **SC-002**: The check's verdict per pair (held, not held, wrong side) agrees with a look at the
  timeline and frames in After Effects in **at least 9 of 10** checks (spec 004 SC-002). *Measured
  by:* the builder, in usage notes.
- **SC-003**: Candidates, focus, check results, demo credit and stage 6 verdicts match the answer key
  on **100%** of pairs in Mentor Practice, Mentor Practice 2 and every overlap fixture, and **every**
  matrix row has at least one test. *Measured by:* unit tests.
- **SC-004**: The merge changes **0** existing files, and the easing eval set stays at **25/25 or
  within one case** with no hard-rule failure (spec 004 FR-035). *Measured by:* `check-branch.mjs`
  and an eval run logged with the merge.
- **SC-005**: Skill 1's eval cases (Eval plan, at least the 14 named) pass **at least 80%**, and every
  hard-rule check passes, including **0** demonstrations in reviews, **0** "freeze" or Freeze Frame,
  **0** Mac shortcuts before L-2 and **0** IDs or field names shown. *Measured by:* eval runs.
- **SC-006**: A confirmed constant-speed move writes **exactly one** mark, and an expression, a
  non-linear move, a name not found or a withdrawn move writes **0**, in **100%** of unit tests and
  eval cases; in the next easing lesson on that comp the marked property is proposed **0 times**
  (spec 004 SC-013). *Measured by:* unit tests and eval case KT-i.
- **SC-007**: At least **one live review at least one day after the first pass** is logged with the
  check agreeing with After Effects (spec 004 SC-009), and review eval cases show **100%** no demo,
  no walkthrough, no menu path and the intent question asked first. *Measured by:* the builder, in
  usage notes; deterministic eval checks.
- **SC-008**: L-1 to L-4 are logged **before** the build merges, and `SKILL.md` contains **0** steps
  or shortcuts the live checks didn't confirm. *Measured by:* the usage note and a reviewer read of
  `SKILL.md`.

## Eval plan (for the eval engineer, who writes and numbers the cases)

The eval engineer owns the cases, their numbering and fixtures (constitution VI). Unit tests cover the
deterministic parts (candidates, check verdicts, marks); evals check what the mentor does with them.
At least these, on saved snapshots of Mentor Practice and Mentor Practice 2:

| Name | What it checks |
|---|---|
| KT-a First lesson | Asks what should snap before proposing; names at most three candidates; says what's left out and why; real names |
| KT-b "It's meant to fade" | On Mentor Practice, Title Opacity dropped with no argument; then the practice blink or Mentor Practice 2 is offered (spec 004 skill-specific intent case) |
| KT-c Demonstration | One hold on the demo target only, frames either side, Edit > Undo; with one focus pair, no demo and a walkthrough in words |
| KT-d Incomplete attempt | One Blink pair still fading: names it with a frame inside it, doesn't fix or offer to |
| KT-e "Do the rest" | Declined warmly, no later offer |
| KT-f Holds everything | Including a property they said should move: names where it now waits and jumps, asks about the extra holds, no fix |
| KT-g Riskiest overlap: expression over keys | Logo's Rotation named as constant speed: says an expression drives it, no mark, no "set its keys to linear"; a `loopOut` blink isn't a candidate |
| KT-h Hold at Opacity 0 | Never called hidden |
| KT-i Linear on purpose | Spinner named: confirmed and one mark in the record (deterministic); an eased move: one sentence on how, checked again |
| KT-j Version trap | No Mac shortcut (until L-2 confirms one), no "freeze" or Freeze Frame, the menu path named (deterministic) |
| KT-k Review | Learned and due, Blink in the record: intent asked first, Cut as the target, no demo, walkthrough or menu path (spec 004 cross-skill 7) |
| KT-l Review not passed | Hints, no reteach; "next" names what's off (spec 004 cross-skill 5) |
| KT-m Review, nothing snaps | The learner says nothing should snap: the review ends and nothing is recorded |
| KT-n No candidate, nothing named | The practice blink is offered; no invented focus |

KT-a to KT-g and KT-k are the spec 004 minimum (first lesson, demo, incomplete, "do the rest",
riskiest overlap, review). "Held the wrong side" (design § 7 row 4) gets a case after L-1 settles its
wording. Needs: the runtime linking every `*-mentor` skill (spec 004 plan A2) and the Mentor
Practice 2 capture (spec 004 T042).

## Assumptions

- **Learner and setup:** the builder on After Effects 26.5, macOS 27.0.1 (CLAUDE.md › My setup);
  version wording targets that.
- **Shared pieces exist:** spec 004's wave A merge (session per skill with review mode, fixture
  twins, finders, kept-linear marks and `keepLinear`, Mentor Practice 2 and its captures) is in before
  this skill builds, plus SR-1.
- **Mentor Practice 2's Blink** is built eased (spec 004 T041, research R13) or linear (design B-1);
  either is a candidate, so this spec doesn't depend on which (question C-3).
- **The property focus** goes to the skill's own analyzer, so `session.start`'s `focus_layers` is
  enough for the session's own checks.
- **"Learned" means one pass**, as spec 004.

## Out of scope (build scope)

- Teaching anything in `teaching-design.md` › 8 (auto, continuous and plain bezier; roving; `loopOut`;
  the Graph Editor; spatial interpolation of hold).
- Any change to a shared file, including `segmentState`, the session, marks, `ease-mentor` and the
  errors (requests SR-1 to SR-3 go to the owner).
- A "meant to fade" memory (only "kept linear" is remembered; question H-1).
- Reading inside precomps, expressions with no keys, layer in and out points, time remapping or
  stretch (R1, R2, R4 come later).
- The panel's screens for this skill (spec 007) and the eval cases themselves (the eval engineer's).
- Windows wording beyond naming the menu path.

## Open questions

### For the builder (H), each with a recommendation

1. **H-1. Mentor Practice's fades count as candidates.** The rule can't read intent, so Title and
   Subtitle Opacity make Mentor Practice look like it has a skill 1 focus, and once skill 1 is
   learned a review can be offered there that ends in "meant to fade" and records nothing, so it
   stays due and comes back next session. **Recommended:** accept it this sprint (at most one
   unprompted offer per 3 hours, declining is free) and watch it in SC-007's live review; if it nags,
   add a "meant to fade" mark next sprint, a shared change.
2. **H-2. Candidate values exactly 0 and 100 (within 0.5).** A 0 ↔ 80 blink wouldn't be named.
   **Recommended:** keep it strict as the designer wrote; the learner can name anything else.
3. **H-3. SR-1 goes into spec 004's wave A shared tasks** (T017's session change and T006's test)
   before the shared merge. **Recommended:** yes; without it the practice blink, the designer's
   answer for comps with no target, can't be checked.
4. **H-4. A constant-speed move the learner volunteers in a review** may be confirmed and marked,
   ungraded. **Recommended:** yes; it's the same fact, checked the same way.

### For the curriculum designer (C)

1. **C-1.** `teaching-design.md` › 4 says Mentor Practice "as built" has no candidate, but its own
   rule (Opacity pairs between 0 and 100, not held) names Title and Subtitle Opacity. This spec
   follows the rule and says what happens (FR-008). Is that the intent?
2. **C-2.** Pause pairs (two equal values) inside a named property are left out of the targets
   (row 16), where the design says "all of that property's non-held pairs". Agree?
3. **C-3.** Mentor Practice 2's Blink: the design's B-1 says built linear; spec 004 T041 says eased.
   Either works here; settle one with the shared-code owner so the answer key and eval wording agree.

## Dependencies

- [`teaching-design.md`](teaching-design.md) (curriculum designer, draft round 1): the source of what
  is taught. If it changes, this spec follows.
- Spec 004 wave A tasks: T006 and T017 (session, review mode, plus SR-1), T019 (fixture twins), T020
  (finders), T041 and T042 (Mentor Practice 2 and captures), T049 to T054 (marks and `keepLinear`);
  plan A2 (runtime linking for evals).
- `discovery/usage-notes/mentor-practice-state-2026-10-20.md` (the Cursor, Logo, what Mentor Practice
  lacks) and `discovery/usage-notes/adobe-assistant-2026-10-08.md` (the "why").
- Spec 005 (diagnosis): reads the marks this skill writes (DX-01, DX-05).
