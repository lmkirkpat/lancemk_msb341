# Feature Specification: Expression and precomp reads

**Feature Branch**: `015-expression-precomp-reads` (spec folder only; no git branch)

**Created**: 2026-11-14

**Status**: **Phase 1 shippable (2026-11-16, T040)**: spec 014 can build on it. Phase 2 (US4) not
started (next: T041). Phase 1 follow-up FR-004a (OQ-10, 2026-11-16) is open: T064. Approved by the builder 2026-11-14 as written (OQ-1 to OQ-5 as recommended). Plan and tasks approved 2026-11-14 ([plan.md](plan.md), [tasks.md](tasks.md)) with OQ-6 and OQ-7 as recommended. FR-015 narrowed to pivot and null (OQ-3). Phase 1's results are in Success Criteria › Phase 1 results.

**Amendment 1 (2026-11-14, Phase 0 live checks, T008; approved by the builder 2026-11-14 with OQ-8 as recommended):** evidence in
`discovery/usage-notes/expression-reads.md` (session 1) and the corrected finding 4 in
`discovery/usage-notes/ask-baseline.md`. **AB turn f was most likely a real edit** (Pan Behind took
Shake Control and changed its anchor), not playhead or expression motion. The
check was right to see a change; the failure was that it named a side effect ("moved up at 2.6 s")
instead of the cause (Shake Control's pivot moved, not rock.png's). Also: an erroring expression stays
on in AE 27.0 and gives its base value; values don't change between reads at one time, but `wiggle`
changes when the layer's index changes; separating or joining dimensions clears the expression. Changed
here: US1 #6, US3 (story, why, test, scenarios), FR-006, FR-012 to FR-014, new FR-013a and FR-014a,
SC-005, Edge Cases E4, E7, E17, E18 and new E28, Eval plan, Assumptions, and OQ-8 (new).

**Amendment 2 (2026-11-14, Phase 0 session 2, T008's second fold):** evidence in
`discovery/usage-notes/expression-reads.md` session 2 (`9d05420`, `cf37e7e`) and
`mentor/test/fixtures/precomps/time-mapping-key.json`. T005 confirmed by hand that Pan Behind on
Shake Control moves its base Position and Anchor Point together (+561, −120), keeps the children
still (0.07 px) and leaves the shake running, the same edit as T004's fit (572, −114); it took Shake
Control, which was both selected and under the cursor; which rule decides is open (T034). The hidden half of a
separable Position holds stale values that don't draw. T006 confirmed the time-mapping formula on all
eight keys, with three rules: a negative stretch reports the in point after the out point, a remapped
key holds over a range, and "places used" counts layers, not comps. Changed here: US3's why, new
FR-006a, FR-023 to FR-025 tightened, SC-005 (a), SC-011, SC-012, Edge Cases E21, E22, E23 and new
E29, Assumptions. No approved decision changes.

**Amendment 3 (2026-11-16, the T031 review of phase 1; fixes on `015-reads-p1`):** documentation
to match the build, add or tighten only. Changed here: FR-018 (partial walks and the sweep budget),
OQ-7 (the guard as built, plus a note for spec 014), new OQ-9 (`session.json` holds expression text)
and an open item for T034 (which layer Pan Behind takes). Data model § 1, § 3, § 4 and § 5 match the
build (`effect` omitted when nothing moved; `motion_from` absent on older snapshots;
`static_as_read`'s old meaning on older snapshots; `k2-changes.mjs`).

**Amendment 4 (2026-11-16, builder decisions on OQ-8 and OQ-9; T033's Comp 1 capture, merge `1499819`):**
add or tighten only. OQ-9 answered: the session baseline keeps expression text and errors during a
lesson and blanks them when the record is saved or a new lesson replaces the baseline; refused
`record_lesson` calls are logged without the refused text; spec 006's uninstall always removes the
session file. OQ-8 widened: the pivot and null `motion_from` wording is carried here (from 011 TD § 21
and 012 TD § 17), and the 1 px "too small to see" floor (014 TD § 5.1a, H-7) is approved, the "hard to
tell apart" band deferred. New edge case E30 and an Assumptions line: AE 27.0 gives expression text
with `\r` line ends. Changed here: Edge Cases (E30), Out of scope (the one pivot line becomes the pivot
and null `motion_from` lines), Assumptions, OQ-8, OQ-9; `contracts/describe-layers.md` (a parent's
`moves` said once in a summary); tasks T057 to T060 (new, phase 1 follow-ups). No approved decision
changes.

**Amendment 5 (2026-11-16, T040 and T060: phase 1's gate results):** evidence in
`discovery/usage-notes/expression-reads.md` session 3 (T033, T034), each eval set's README (T036,
`1c6789b`) and tasks T033 to T039, T057 to T059 and T061 to T063. Every phase 1 SC is met; SC-006's
3-of-3 clause and SC-008's whole-turn half are met as the notes under Phase 1 results say, not by the
letter of a fresh run, and both notes are there for anyone who disagrees. T034 settled which layer Pan
Behind takes on AE 27.0 (the selected layer; with nothing selected, the top layer under the cursor).
T060: the 1 px floor is recorded as approved and handed to spec 014 (OQ-8). New OQ-10: the floor is
measured in screen pixels on the asked layer, which FR-004 doesn't give. Changed here: Status, Success
Criteria (Phase 1 results), Assumptions (T034, A runs), OQ-8, the T034 open item (answered), OQ-10
(new). No requirement or approved decision changes.

**Amendment 6 (2026-11-16, OQ-10 answered by the builder as recommended):** add only. New FR-004a: for
each parent expression that moves an asked layer, `describe_layers` gives the peak shift of that layer's
box in comp pixels, worked out in the mentor from values the sweep already reads, so the 1 px floor
(014 TD § 5.1a) applies to Rotation and Scale as well as Position. Changed here: Status, FR-004a, new
SC-003a (with a Phase 1 results row), SC-007's note, Edge Cases (new E31), OQ-10 (answered), new
OQ-11; plan (summary, structure), research (new R15), data model (§ 1 sweeps, § 6),
`contracts/describe-layers.md` (the field), tasks T064 (new). FR-004's fields don't change. No approved
decision changes.

**Input**: Cockpit task, sprint 5: "Two shared read capabilities for the ae-mentor server, not
teaching skills. Build the reads now, and queue skills 4 (*Find what's moving it*) and 10
(*Precompose*) as lessons for later. Expressions first, precomps as a later phase." Builder decision,
2026-11-14.

**What this is.** Spec 004's reads **R2** (expressions on any property) and **R4** (inside precomps)
from `specs/004-ae-curriculum/curriculum.md` § 5, plus the "what links here" read that spec 014's
teaching design asks for (TD Q4), and the tool change K2 that stops a check calling expression motion a
learner edit. Spec 004 planned R2 and R4 to arrive *with* skills 4 and 10 (wave D, FR-010). This spec
builds them without those skills, because spec 014's ask mode needs them first.

**What the reads must give** is set by two teaching documents this spec links to and doesn't copy:
- `specs/014-ask-mentor/teaching-design.md` (written "TD 014 § n"): § 8 (reads Q2 to Q8), § 10.2 (K2,
  K3), § 13 (overlaps), § 19 (SB items and "Checked 2026-11-14").
- `specs/004-ae-curriculum/curriculum.md` § 5 (R2, R4, the motion-sources map, the contract risk) and
  `specs/004-ae-curriculum/spec.md` FR-010, FR-012 to FR-015 and its Edge Cases table.

Where this spec needs something those don't say, it's a question below, not an edit to them.

**Evidence:** `discovery/usage-notes/ask-baseline.md` (written "AB"): findings 1, 2 and 4, and both
2026-11-14 follow-ups. The second, "live checks for the expression and precomp reads", is this
spec's live evidence. Fixtures: `mentor/test/fixtures/ask/comp1-snapshot.json` (the mentor's
snapshot today: 3 of 29 layers) and `comp1-ground-truth.json` (every layer, effects, and every keyed
or expression-driven property with its full text).

### Why this, and what Adobe can't easily copy

The baseline answered "what does Sweep Control do?" with "I can't see inside that layer", taught a
pivot on a layer that couldn't change the shake, and told the builder to undo motion they never made
(AB 1, 2, 4). All three came from reads the mentor doesn't have: expressions on unkeyed properties,
what points at a layer, and motion inside precomps (where 347 of Comp 1's keyed properties live).
Real comps are built this way; the practice comps weren't.

Adobe's assistant already reads a whole comp and diagnosed one well (2026-10-08 side-by-side), so
reading alone isn't the edge. **Depth** is: these reads feed per-property, per-layer facts into checks
that are honest about what they saw (a base value vs. the value after an expression, at one time; a
link marked as inferred; "not read" never said as "none"). And they're what lets **memory and
practice** reach the learner's own comps: a lesson can only come back on a real project if the mentor
can see how that project's motion is made. These are the parts CLAUDE.md next step 4 says to keep in
every spec's "why".

### Decisions and rules this spec relies on

| Record | What it requires here |
|---|---|
| `decisions/003`, `005` (constitution II) | Reads run as fixed, read-only snippets through the bridge. No open-ended script execution, no change to the project, no teaching logic in the bridge or panel |
| `decisions/004` | Spec Kit for build specs |
| `decisions/007`, `008` (constitution VI) | `mentor/` is the builder's; eval cases are the eval engineer's; one agent on live AE at a time |
| `decisions/011` | Built and evaluated on B1. Moves to A with spec 014 (Constitution check in the plan says how) |
| `decisions/012` | Ask-first Home. These reads are what make an ask answer possible (TD 014 § 8: "the ask mode isn't worth shipping without R2 and Q4") |
| Spec 004 FR-012 to FR-015 | Fixtures from live reads; one visibility class; one motion-sources map; easing findings on Mentor Practice unchanged |
| Constitution IV | No real names in fixtures; the learner record never stores expression text |

**Supersedes:** TD 014 Q8 ("inside precomps: not needed for v1"). This spec adds it as phase 2. The
TD's owner is asked to update Q8 and the § 13 precomps row (CD-1 below). Spec 004 FR-010 says R2 and R4
come before skills 4 and 10; that still holds, they just come sooner (OQ note, spec 004 amendment
proposed in Open questions).

## Phases

| Phase | Stories | Unblocks |
|---|---|---|
| **1. Expressions** | US1, US2, US3 (all P1) | Spec 014's ask mode; K2 and K3 in the six skills |
| **2. Inside precomps** | US4 (P2) | Answers that touch a precomp; later skill 10; easing's "can't see inside" blind spot (as data only, see Out of scope) |

Phase 1 ships on its own. Phase 2 starts after phase 1 is merged and its SCs pass.

## User Scenarios & Testing *(mandatory)*

The "user" of a read is the mentor (a skill or the ask mode); the person who benefits is the learner
whose comp is read. Scenarios are written from the learner's side where it matters.

### User Story 1 - The mentor sees every expression, keyed or not (Priority: P1)

When I ask about a layer, the mentor knows which of its properties (and its parents' properties) run
on expressions, even with no keys: transform, effect, text and any other property. It knows whether
each is on, whether it has an error, what it says, whether it builds on the property's own value or
keys, and what the property's value is before and after the expression at a given time. So it can tell
me "rock.png rides on Shake Control, whose Position and Rotation are expressions", not "rock.png
doesn't move".

**Why this priority**: AB 2 and AB 3 both come from this gap (TD 014 Q2, Q3). Without it, the ask mode
answers Comp 1 "as wrongly as the baseline did, only more politely" (TD 014 § 8).

**Independent Test**: on a fresh live capture of Comp 1 plus planted cases, the expression read
matches `comp1-ground-truth.json` and each planted case's answer key, with no other story built.

**Acceptance Scenarios**:

1. **Given** Comp 1, **When** the expressions are read, **Then** exactly three are found: Shake
   Control's Position and Rotation and Black Solid 1's CC Light Sweep Center, each on, no error, 0
   keys, with text identical to the ground truth.
2. **Given** the same, **Then** Shake Control's two are marked "builds on its own value" and the Sweep
   Center "sets its own value", each marked as inferred from the text.
3. **Given** Shake Control at 0.6 s, **When** Position is read at that time, **Then** the base value is
   (960, 540) and the value after the expression is about (952.4, 542.5) (AB follow-up).
4. **Given** rock.png (no keys, parented to Shake Control), **When** its motion sources are read,
   **Then** Shake Control is in its parent chain as moving its children, with the Position and
   Rotation expressions named as the reason.
5. **Given** an expression turned off on a keyed property, **Then** it's listed as off and not as a
   source; the keys are.
6. **Given** an expression with an error (planted), **Then** it's listed as on, with its error, and not
   counted as a source of motion; its value after the expression is the base value (T001: AE 27.0 keeps
   it on and falls back to the base).
7. **Given** Shake Control's Position expression, **When** how much it moves the layer is read, **Then**
   the read gives the largest distance from the base value over the comp's duration and when it
   peaks, so an answer can order steps by visible effect (TD 014 § 19 "Checked 2026-11-14").

---

### User Story 2 - The mentor knows what links to a layer, and whether that shows (Priority: P1)

When I ask "what does Sweep Control do?", the mentor can say that its Position drives the Center of a
CC Light Sweep on Black Solid 1, and that Black Solid 1's eye is off, so the sweep never renders.

**Why this priority**: AB 1 was the simplest question in the baseline and got "I can't see that" (TD
014 Q4, Q5). The hidden target is the surprise from the 2026-11-14 live check.

**Independent Test**: on Comp 1 and planted cases, "what links here" for each layer matches the answer
key, with US1's read as its input and nothing else built.

**Acceptance Scenarios**:

1. **Given** Comp 1, **When** what links to Sweep Control is read, **Then** it lists one link: Black
   Solid 1 › CC Light Sweep › Center reads Sweep Control's Position, matched by the layer's name and
   marked as inferred.
2. **Given** the same link, **Then** the target layer is reported as not rendering: eye off, not a
   matte, not used as a matte by any layer.
3. **Given** any other Comp 1 layer, **When** what links to it is read, **Then** the result is "no
   expression links" with the read marked as run (never left blank); Shake Control's children come
   from the parent chain, not from this read.
4. **Given** Black Solid 1, **When** its effects are read, **Then** CC Light Sweep is named even
   though none of its properties are keyed (TD 014 Q5).
5. **Given** an expression that names a layer whose name two layers share (planted; Comp 1 already has
   two "G Shakers" and two "Y Fragments"), **Then** the link goes to the one After Effects uses (the
   topmost) and is flagged as a shared name.
6. **Given** an expression that refers to a layer by index, or builds the name at run time, or reaches
   into another comp with `comp(...)`, **Then** the index link is marked inferred, the built name is
   listed as "a reference I can't resolve", and the other-comp reference is listed as not followed
   (known limit).

---

### User Story 3 - A check reports what I changed, in my terms, and never an expression's motion (Priority: P1)

When I do a lesson step and the mentor checks, a change I really made outside the focus is reported
as **the property I changed, on the layer I changed it on**: "Shake Control's pivot moved, not
rock.png's", not a side effect such as "Shake Control moved up at 2.6 s". Motion that only comes from
an expression (the playhead moved, or a layer's index changed under a `wiggle`) is never reported as
mine.

**Why this priority**: in AB turn f the check saw a real edit (Pan Behind took Shake Control,
`expression-reads.md` T004) but named its side effect, so neither the builder nor the mentor could tell
what had happened, and the advice was "Edit > Undo until it's back" for a move the builder didn't
recognize. The other half of K2 (TD 014 § 10.1 rule 3) still stands: expression motion must never be
called an edit. Both are fixes to shipped skills, not new capability.

**Independent Test**: unit tests on fixtures derived from the Comp 1 capture: AB turn f's fitted anchor
edit, the same reads with only the playhead moved, and a renumber under a `wiggle`, through every skill
check that reports other changes, with US1 built and no ask mode.

**Acceptance Scenarios**:

1. **Given** a pivot lesson on rock.png and turn f's edit (Shake Control's Anchor Point changed by Pan
   Behind), **When** the learner checks, **Then** the check reports one change: Shake Control's
   Anchor Point (its pivot), with how far its footprint moved folded in as that change's visible
   effect, and no separate "Shake Control moved" entry.
2. **Given** a pivot lesson on rock.png, Shake Control moving by expression, and only the playhead
   moved since the first read, **When** the learner checks, **Then** nothing is reported about Shake
   Control and the reply has no Undo advice about it.
2a. **Given** a layer with a `wiggle` on a transform property, and a layer added above it (so its index
   changes, as the null skill's null does), **When** checked, **Then** its new wiggle values are not
   reported as a change.
2b. **Given** the learner changed Shake Control's base Position by hand, **When** checked, **Then** it's
   reported as Shake Control's Position.
3. **Given** two reads with no shared time for a layer, **When** compared, **Then** that layer is
   "not compared", never "moved".
4. **Given** each skill with an "other changes" list (pivot, null, offset, key types, speed graph),
   **Then** the same rules hold in each.
5. **Given** a parent whose transform runs on an expression whose result varies over time, **When** a
   skill's snapshot reads its children, **Then** the parent is reported as moving its children (K3).

---

### User Story 4 - The mentor sees inside precomps (Priority: P2, phase 2)

When I ask why a letter shakes, or what's inside "O Shakers", the mentor can see the keys and
expressions inside the precomp, which comp it means when two share a name, how many places that comp
is used, and how the precomp's time lines up with the comp I'm in. If something inside never shows
because the precomp is shorter, offset, stretched or time-remapped, it says so.

**Why this priority**: most of Comp 1's motion is inside precomps (347 keyed properties on 123 inner
layers), and "I can't see inside these yet" hides it (AB follow-up). P2 because the ask mode can ship
saying "I couldn't see inside [precomp]" (TD 014 § 13), and expressions are the bigger gap.

**Independent Test**: on a fresh capture of Comp 1's whole project, Mentor Practice's Icon, and
planted time-mapping cases, the inside read matches each answer key, with phase 1 built.

**Acceptance Scenarios**:

1. **Given** Comp 1, **When** precomps are read, **Then** all 20 precomp layers are read, every comp is
   named by its id, and "U Fragments" 353 and the "U Fragments" 321 it holds are told apart (likewise
   "B Fragments" 242 and 131).
2. **Given** O Shakers, **When** read, **Then** its inner layers O1 to O7 each show 3 Position and 3
   Rotation keys and no expressions, matching a ground-truth capture.
3. **Given** a comp used in more than one place, **Then** the number of places is reported.
4. **Given** a precomp layer with a start offset, a stretch, or time remap (Icon or planted), **When**
   inner key times are reported in the outer comp's time, **Then** each is within half a frame of the
   answer key, and a time-remapped precomp's mapping comes from its remap values.
5. **Given** a precomp longer than the time the outer layer shows (10 of Comp 1's are 30 s in a 5 s
   comp), **Then** inner keys outside the shown time are counted and flagged as never showing.
6. **Given** nesting deeper than the depth limit, **Then** the deeper level is "not read: too deep",
   never empty.

---

### Edge Cases

Overlaps the reads must get right (CLAUDE.md "Edge cases where concepts overlap"; spec 004's Edge
Cases table rows for expressions and precomps; TD 014 § 13). Each row gets a unit test on a fixture
from a live read (spec 004 FR-012). **Live** = needs a planted case in AE (listed in Assumptions).

| # | Overlap | What the read must report | Must never | Fixture |
|---|---|---|---|---|
| E1 | Expression over keys | Both; whether the text builds on value or keys (inferred) | "The keys do nothing" or "the expression overrides" as fact | Mentor Practice Logo |
| E2 | Expression, no keys | The expression as the source | No source; an easing finding (FR-015) | Comp 1 Shake Control |
| E3 | Expression turned off | Off; keys drive | Count it as a source | Live |
| E4 | Expression with an error | On, with the error; value after = base value (T001) | Count it as a source; call it off; call it working because it's on | Live (T001 done; planted copy) |
| E5 | Functions that build on value without the word (`wiggle`, `loopOut`, `smooth`, `temporalWiggle`) | Builds on value or keys | "Sets its own value" | Planted text (unit) |
| E6 | `value` only inside a comment or a string | Not counted | Builds on value | Planted text (unit) |
| E7 | Separated dimensions | The expression on the side in use (Position, or X and Y). Separating or joining clears the expression (T003), and a script can't make the hidden-side state, so it has no fixture | An expression on Position as driving separated X and Y | UI separate or join not tested |
| E8 | Effect property expression | Effect and property by name | Skipped because it isn't transform | Comp 1 Sweep |
| E9 | Source Text and other non-transform properties | Listed with their group | Counted as moving children | Planted |
| E10 | Link by name, name shared by two layers | Link to the topmost, flagged shared | Link to both, or pick silently | Comp 1 (G Shakers, Y Fragments) plus planted |
| E11 | Link by index, `thisLayer`, `parent` | Resolved where the text is plain; inferred | Treated as certain | Planted |
| E12 | Name built at run time, or a variable | "A reference I can't resolve" | "Nothing links here" | Planted text |
| E13 | `comp("…")` reference | Listed as not followed (known limit) | Followed by name across same-name comps | Planted text |
| E14 | Link target eye off, not a matte | Doesn't render | Call it hidden by the learner without the matte check | Comp 1 Black Solid 1 |
| E15 | Link target is a matte (eye off by design) | Renders through its fill layer | "Hidden" (spec 004 FR-013) | Mentor Practice 2 matte |
| E16 | Link target is a guide layer, or outside its in and out at the times read | Doesn't render (guide); not on screen then (in and out) | "Renders" | Planted |
| E17 | Real edit to a layer that has an expression (AB turn f: Pan Behind on Shake Control) | The property that changed on that layer (Anchor Point), with the footprint shift as its effect | A side effect as the change ("moved up at 2.6 s"); the focus layer named instead | Comp 1 capture plus T004's fitted edit (`turn-f-check-reply.json`) |
| E17a | Expression-driven parent, only the playhead moved | Nothing | "You moved it"; Undo | Comp 1 capture (T004 test 1) |
| E18 | `random()` without a seed, `wiggle()` | Same value between reads at one time on the same index (T002) | A learner change | Live (T002 done) |
| E19 | Parent expression that's constant (`value`) | Doesn't move children (sampled result never varies) | Moves children | Planted |
| E20 | Same-name comps, nested | By id | By name | Comp 1 (353/321, 242/131) |
| E21 | Comp used in several places | Count of **layers** using it (T006: Icon Precomp is in 3 comps but 4 layers) | Count the comps `usedIn` lists; read once and assume it shows the same everywhere | Comp 1, Mentor Practice (Icon) |
| E22 | Start offset, stretch (including negative), time remap | Inner times mapped to outer time; with a negative stretch, the in point is after the out point and the shown span is [lower, upper); with time remap, a key whose remap value is flat maps to a **range** of outer frames | Inner key times as outer times; assume in < out; one time for a held remap | T006 answer key (`time-mapping-key.json`) |
| E23 | Precomp longer than it's shown, or a key landing exactly on the span's end | Keys outside the shown time flagged; a key on the end of [lower, upper) never shows (T006's reversed copy) | Counted as visible motion | Comp 1 (30 s precomps in a 5 s comp), T006 copy C |
| E24 | Collapse Transformations on a precomp layer | Reported with the precomp | Ignored | Live |
| E25 | Depth limit, or a cycle | "Not read: too deep" or "not read: loop" | Empty | Planted (cycle: unit only; AE prevents one) |
| E26 | Expressions inside a precomp that reference the outer comp | Not followed (as E13) | Resolved | Planted text |
| E27 | Older snapshot or fixture without the new fields | "Not read" | "None" | Comp 1's committed snapshot |
| E29 | Hidden half of a separable Position (X/Y when joined, Position when separated) | Skipped: its values are stale and never draw (FR-006a) | Report its value, keys or expression | Planted (T015) |
| E28 | A layer's index changes under a `wiggle` (a layer added or removed above it, such as the null skill's null) | Its after-expression values change with no edit (T002: about 6 px); compared on base, so nothing is reported | A learner change on that layer | Planted (T015) |
| E30 | Expression text with `\r` line ends (AE 27.0 returns them; Amendment 4) | A `//` comment ends at `\r`, `\r\n`, `\n`, U+2028 or U+2029, so `value` after it counts (Shake Control builds on value); the snapshot keeps AE's text raw, and only `describe_layers` detail and text comparisons normalize line ends (`normalizeLineEnds()`) | Read the rest of the text as one comment and report "sets its own value"; a line-end-only difference reported as "text changed" | Comp 1 live capture (T015, `1499819`) plus unit text |
| E31 | A parent's Rotation or Scale expression moves a child by an amount in degrees or percent (FR-004a) | The child's peak shift in comp pixels, through its distance from the parent's pivot; `shift_px: null` with a reason when the chain is 3D, auto-oriented, boxless, moving, or the direction wasn't recorded | Degrees or percent given as the size; a hand estimate; 0 for "couldn't work it out" | Comp 1 capture (Shake Control's Rotation, 0.589° fine peak) plus planted unit fixtures |

## Requirements *(mandatory)*

### Functional Requirements

**Phase 1: expressions (US1)**

- **FR-001**: The shared read MUST find every property with an expression on every layer of the active
  comp, keyed or not, in any group (transform, effects, text, masks, shapes, other), and report for
  each: layer index and name, the property's display path, its group, keys count, whether it's on,
  its error text if any, and its full text. (R2; TD 014 Q2, Q3.)
- **FR-002**: For each expression, the read MUST say whether it **builds on the property's own value
  or keys**, **sets its own value**, or **can't tell**, always marked as inferred from the text. The
  test MUST ignore comments and strings, and MUST count the functions that build on value or keys
  without naming it (E5). The plan lists the functions.
- **FR-003**: For any property with an expression, at any time the caller gives (default: the comp's
  current time), the read MUST give both the **base value** (before the expression) and the **value
  after it** (TD 014 Q7).
- **FR-004**: For expression-driven **transform** properties of the layers a caller asks about and
  each of their parents, the read MUST give **how much** the expression moves the property: the
  largest difference from the base value over the comp's duration (in the property's units: pixels,
  degrees, percent), the time of that peak, and whether the result varies at all. The sampling step
  is set in the plan; the result is marked as sampled (TD 014 § 19 "Checked 2026-11-14"; see OQ-4).
- **FR-004a** *(added 2026-11-16, OQ-10)*: For each layer a caller names, and for each active
  transform expression on a layer in its parent chain that moves it (FR-005's `moves_children` by
  expression), `describe_layers` MUST give that expression's **peak footprint shift on the named
  layer, in comp pixels**: how far the named layer's farthest box corner moves at the expression's
  peak, compared with the same layer with that one property at its base value. It also gives the peak's
  time and `sampled_every` from FR-004's fine sweep, and is marked as sampled and as measured on the
  layer's box, not its visible pixels (OQ-11). This is what 014 TD § 5.1a's 1 px floor and "say its
  size" are measured in, for Position, Anchor Point, Rotation and Scale alike.
  - **Worked out, never read anew:** computed in the mentor (Node) with the existing comp-space math,
    from the fine sweep's peak and the snapshot's transform samples. No new AE write, no extra
    snapshot call, and FR-004's fields stay as they are. The sweep MAY record the value it already
    read at its peak (additive; research R15).
  - **Never a guess:** when the shift can't be worked out exactly from what was read, the entry is
    `shift_px: null` with a reason, never an estimate, a property-unit number in its place, or 0.
    At least: a 3D layer anywhere in the chain (`three_d`); Auto-Orient on (`auto_orient`); the named
    layer has no box (a null, camera, light or audio layer; `no_rect`); a layer in the chain has no
    sample at the reading time (`not_sampled`); no fine sweep for that expression, because the budget
    cut it, it errored, or the snapshot is older (`no_fine_sweep`; a coarse peak is never used); a value
    the shift depends on could differ between the reading time and the peak, because it has keys or
    a varying active expression (`chain_moves`; research R15 lists which values count); the peak's
    direction is needed but wasn't recorded (a Scale source, or a Position or Anchor Point source
    through a non-uniform scale, on a snapshot without the sweep's peak value; `direction_unknown`); a
    scale of 0 (`singular`).
  - **Scope:** only layers named in `layers` (not a whole-comp summary, which says the read as
    `not_read: "not_asked"`), and only parent-chain expressions, as approved. Opacity and non-transform
    expressions get no entry (they don't move the box). Each expression is converted on its own; two
    sources together are not combined (the deferred "hard to tell apart" band, 014 TD § 5.1a).
- **FR-005**: The motion-sources map (spec 004 FR-014) MUST include expressions on any property: its
  read status for expressions changes from keyed-only to all, and each parent's `moves_children` MUST
  be true when the parent has keys on a moving transform property **or** an on, error-free transform
  expression whose sampled result varies (K3; E19). The reason (keys, expression, or both) MUST be
  given.
- **FR-006**: An expression is **active** only when it's on **and** has no error. An expression that
  is off or has an error MUST NOT count as a source of motion, and an erroring one MUST be reported as
  on with an error, never as working (AE 27.0 keeps it on and gives the base value, T001). Only the
  side of a separable Position in use is read (E3, E4, E7).
- **FR-006a**: Every read that walks properties (the expression read, base values, sweeps, and phase 2's
  inner keyed and expression reads) MUST skip the hidden half of a separable Position: Position when
  its dimensions are separated, X, Y and Z Position when they're joined. The hidden half holds stale
  values that never draw (T005 session: joined X/Y read 960, 540; separated Position reads the last
  joined value) and MUST NOT be reported as a value, a key or a source (E29).
- **FR-007**: Effects on every layer MUST be named, keyed or not, with which of their properties are
  keyed or expression-driven (TD 014 Q5).

**Phase 1: what links here (US2)**

- **FR-008**: For any layer in the active comp, the read MUST list every expression in the same comp
  that references it: by name, by index, or through `thisLayer` or `parent`, including expressions on
  effect properties. Each link gives the source layer, property and the referenced property when the
  text names one (for example, Position, or an effect's slider).
- **FR-009**: Every link MUST be marked as **inferred** (found in the text, not confirmed by After
  Effects). A name shared by two or more layers MUST be flagged and resolved to the topmost, as After
  Effects does (E10).
- **FR-010**: References the read can't resolve (a name built at run time, a variable) MUST be listed
  per expression as "can't resolve", and references to another comp as "not followed" (E12, E13).
  "No links" MUST only be said when the search ran and every reference in the comp resolved.
- **FR-011**: Every link MUST say whether its target **renders**, using spec 004's visibility class
  (FR-013) plus whether the target is inside its in and out points at the time read. A matte is never
  "doesn't render" (E14 to E16).

**Phase 1: checks (US3)**

- **FR-012**: Every check in the six skills that reports changes the learner made outside the focus
  ("other changes", "other layers moved", a jump) MUST compare two reads **at the same comp time**. A
  layer with no shared time is "not compared", never "moved" (K2). (T004 found the pivot check already
  does this; the requirement stays for every check.)
- **FR-013**: For a property driven by an active expression, those checks MUST compare the **base
  value**, not the value after the expression. A layer whose comp-space footprint differs at the same
  time while no base value on it or its parents differs MUST NOT be attributed to the learner; the
  check MAY report it as "may be its expression" (TD 014 § 10.1 rule 3). See OQ-1.
- **FR-013a**: A change in a layer's index between two reads (a layer added or removed above it) MUST
  NOT be reported as a change to that layer's values. Expression results that depend on the index
  (`wiggle`) are covered by FR-013's base comparison (E28).
- **FR-014**: A change to an expression itself (turned on or off, text changed, new error) MUST be
  reported as an expression change, never as the layer moving.
- **FR-014a**: A real change outside the focus MUST be reported as **the property that changed, on the
  layer that changed** (Anchor Point, Position, parent, an expression), with any footprint shift it
  caused attached to that entry as its visible effect, not reported as a separate "moved" entry. A
  footprint shift with no property change behind it on the layer or a parent is reported as moved only
  when FR-013 doesn't rule it out (E17). How the skill words it is OQ-8.
- **FR-015**: The pivot and null skills' snapshots MUST report, for their focus layers, when their
  motion comes from a parent's motion or an own expression rather than their own keys, from the
  motion-sources map (K3). The other four skills get it with spec 014's rule 1 change (OQ-3, answered).

**Phase 1: reply shape and honesty (all stories)**

- **FR-016**: The reads MUST come in two shapes. A **summary** (per layer: expression count and
  properties, on and error flags, builds-on-value flags, how much each transform expression moves,
  incoming and outgoing link counts, effect names, and read status), with **no expression text**. A
  **detail** for named layers (index, or name when unique), with each expression's text, capped at a
  length set in the plan with a "cut short" flag and the full length (SC-007).
- **FR-017**: A layer asked for by a name two layers share MUST return the candidates (index and
  parent) instead of guessing.
- **FR-018**: A read that didn't run, ran only in part, or met an older snapshot MUST say "not read"
  with the reason, never "none", empty or false (E27). The motion-sources map's existing pattern
  (`not_read`) is kept. A read that ran only in part (a property threw during the expression walk)
  MUST say **partial**, never "all". A sweep skipped for its time budget MUST say not read with the
  reason "budget", so "doesn't vary" is never inferred from a sweep that didn't run (data-model § 1).
- **FR-019**: The reads MUST be read-only: no change to the project, its selection, the playhead or
  the active comp. They run as fixed snippets through the bridge, with no script text from the model
  (constitution II).
- **FR-020**: The learner record MUST NOT store expression text, error text, or effect names taken from
  a read (constitution IV; TD 014 § 11's "never states what only a tool guessed").
- **FR-021**: Adding the reads MUST NOT change the easing findings on Mentor Practice, and an unkeyed
  property moved only by an expression MUST NOT become a finding in any keyframe skill (spec 004
  FR-015, carried to all six).

**Phase 2: inside precomps (US4)**

- **FR-022**: The read MUST read inside every precomp layer, recursively: the same keys, expressions,
  links and effects as phase 1, for each inner comp. Every comp MUST be identified by its **id**, with
  its name as a label only (E20).
- **FR-023**: For each comp read, the read MUST give its duration, size, frame rate and how many
  layers across the project use it as a source, counted by **layers**, not by the comps that hold
  them (one comp can hold it twice; E21).
- **FR-024**: For each precomp layer, inner key times MUST be mapped to the outer comp's time through
  start time, stretch (including negative) and time remap, and nested mappings MUST compound (E22).
  Without remap, outer = start time + inner time × stretch / 100. With remap, an inner key maps to every
  outer frame whose remap value equals it, and a run of such frames MUST be reported as a **range**
  (first, last, frame count), not one time.
- **FR-025**: Inner keys and expression peaks that map outside the precomp layer's shown span, or
  outside the outer comp, MUST be counted and flagged as never showing (E23). The shown span is
  [lower, upper) of the in and out points, whichever order AE reports them in (a negative stretch
  reports in after out), so a key landing exactly on the upper end never shows.
- **FR-026**: Recursion MUST stop at a depth limit (set in the plan; OQ-5) and on a repeated comp id,
  reporting the reason (E25). Each comp's contents are read once and shared across the places it's
  used.
- **FR-027**: The phase 2 summary MUST give per precomp layer: inner layer count, keyed and
  expression-driven property counts, the mapped key time span in outer time, and keys never shown,
  with detail per inner comp on request (FR-016's two shapes).
- **FR-028**: Phase 2 MUST NOT change any skill's findings or wording; the contents are data in the
  motion-sources map (`precomp_contents` moves from `not_read` to read) for the ask mode and later
  skills (Out of scope).

**Tests**

- **FR-029**: Every FR above MUST have unit tests on fixtures from live reads with an answer key
  (spec 004 FR-012), covering every Edge Cases row. Comp 1's answer key is `comp1-ground-truth.json`,
  extended by a fresh capture with the new reads; phase 2 needs a ground-truth capture of the inner
  comps.

### Key Entities

- **Expression read**: one property's expression on one layer (or inner comp layer): where it is, its
  group, keys count, on, error, text (detail only), builds-on-value (inferred), how much it moves the
  property (transform only, sampled), and the references found in its text.
- **Link**: from an expression to the layer it references: the source layer and property, the target
  layer and property if named, how it was matched (name, index, `thisLayer`, `parent`), inferred,
  shared-name flag, and whether the target renders.
- **Layer summary / layer detail**: the two reply shapes (FR-016).
- **Read status**: per read and per layer, "read" or "not read" with a reason (older snapshot, too deep,
  loop, other comp, can't resolve).
- **Comp contents** (phase 2): an inner comp by id, its size, duration, frame rate, places used, and its
  layers' reads.
- **Time mapping** (phase 2): per precomp layer, how its inner time maps to the outer comp's (start,
  stretch, remap), and which inner keys never show.

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Phase 1**

- **SC-001**: On Comp 1, the read finds **exactly 3** expressions, with text identical to the ground
  truth, on, no error, 0 keys, and builds-on-value right on all 3 (2 build on value, 1 sets its own).
  *Measured by:* unit test on a fresh live capture.
- **SC-002**: On Comp 1, what links to Sweep Control is **exactly 1** link (Black Solid 1's CC Light
  Sweep Center), marked inferred, with its target reported as not rendering; every other layer reports
  0 expression links with the read marked as run. *Measured by:* unit test.
- **SC-003**: On Comp 1, rock.png's motion sources name Shake Control as moving its children by
  expression, and Shake Control's Position shows a base of (960, 540) and an after-expression value
  within 0.1 px of (952.4, 542.5) at 0.6 s. *Measured by:* unit test plus one live read.
- **SC-003a** *(added 2026-11-16, FR-004a)*: On the live Comp 1 capture
  (`mentor/test/fixtures/expressions/comp1.json`), Shake Control's Rotation (fine peak 0.589° at
  2.569 s) gives a footprint shift on **every one of the 13 layers it moves**, each within 0.05 px of a
  hand calculation from the fixture's own values (2·r·sin(θ/2), r the farthest box corner's distance
  from Shake Control's pivot), and **none under 1 px**. rock.png's is **between 8.6 and 9.4 px**, the
  range of 014 TD § 16's hand estimate ("about 9 px"). Shake Control's Position (fine peak 12.147 px)
  gives about 12.1 px on each (no layer above it). Every `null` reason in FR-004a has a unit test on a
  planted or edited fixture, and none returns a number. *Measured by:* unit tests (T064).
- **SC-004**: The easing findings on Mentor Practice are **identical** before and after phase 1 and
  after phase 2 (spec 004 SC-004), and Comp 1 yields 0 keyframe-skill findings from Shake Control or
  the Sweep Center. *Measured by:* unit test.
- **SC-005**: Through each skill check with an other-changes list (pivot, null, offset, key types,
  speed graph), on fixtures derived from the Comp 1 capture:
  - (a) AB turn f's edit (T004's fitted Anchor Point change on Shake Control, confirmed by T005's
    hand edit of the same kind, +561, −120) gives **exactly one**
    change, Shake Control's Anchor Point, with its footprint shift attached, and **no** separate moved
    entry for Shake Control (pivot and null; the keyed-value checks report the anchor change);
  - (b) the same reads with only the playhead moved give **0** changes (E17a);
  - (c) a renumber under a `wiggle` gives **0** changes on that layer (E28);
  - (d) a planted hand edit to Shake Control's base Position is reported as its Position in **100%** of
    those checks.
  *Measured by:* unit tests, one set per skill.
- **SC-006**: All six eval sets (easing, key types, speed graph, offset, pivot, null) meet their own
  SC-006 bar on B1 (at least 80% passing, every hard-rule check passing) on the merge commit of each
  phase, and the eval engineer's new K2 cases (Eval plan) pass 3 of 3. *Measured by:* eval runs, logged
  in each set's README.
- **SC-007**: Reply size: the summary for one layer and its sources on Comp 1 is **at most 4 KB**, the
  whole-comp summary **at most 12 KB**, the summary holds **no** expression text, and one expression's
  detail is capped (FR-016). *Measured by:* unit test on Comp 1 and a planted comp with 30 expressions.
  The caps are a first guess (Comp 1's full ground truth, with all text, is 7.5 KB); the plan may
  tune them with a reason. FR-004a's shifts count toward the same caps (*2026-11-16*).
- **SC-008**: Read time: phase 1 adds **at most 0.5 s** to a snapshot of Comp 1 and of Mentor Practice,
  and a whole-turn first activity on a skill stays **≤ 10 s** (spec 003 SC-004). Measured live today:
  60 ms for all 4,720 of Comp 1's properties. *Measured by:* the builder, timings in usage notes.
- **SC-009**: In **100%** of fixture states where a read didn't run (an older snapshot, an unresolvable
  reference, another comp, too deep), the output says "not read" or "can't resolve", never "none" or
  empty. *Measured by:* unit tests.
- **SC-010**: The read's facts agree with a look in After Effects in **at least 9 of 10** spot checks
  (spec 004 SC-002's bar) across Comp 1 and the planted cases, including at least one off and one error
  expression. *Measured by:* the builder, in usage notes.

**Phase 1 results (T040, 2026-11-16).** Phase 1 merged at `a3300e3`; the follow-ups (T057 to T059, T061
to T063) merged after it. "Live" means AE 27.0.

| SC | Result | Evidence |
|---|---|---|
| SC-001 | Met | Unit test on the live Comp 1 capture (T015, `91fd02b`): 3 expressions, text identical, 2 build on value, 1 sets its own. The capture found the `\r` fault (E30), fixed at `1499819` |
| SC-002 | Met | T021's tests on the same capture; spot checks 3 and 4 live (T034) |
| SC-003 | Met | Unit test, plus T033's live read: base (960, 540), after (952.352, 542.492) at 0.6 s; rock.png's source is Shake Control by expression |
| SC-003a | Open (added by Amendment 6) | T064 |
| SC-004 | Met (phase 1 half) | T016's test; T033: Mentor Practice's easing findings identical before and after the merge, old code on a pre-merge capture and new code on a new one |
| SC-005 | Met | T022 to T025's unit tests, one set per skill check |
| SC-006 | Met, with the builder's reading of the 3-of-3 clause | T036 at `edc0a1e` (`1c6789b`): easing 32/33, key types 35/36, speed graph 35/37, offset 42/44, pivot 61/64, null 50/55; every hard-rule check passes. The K2 cases (pivot 55, 56; null 53, 54; offset 44) and T059's (pivot 57 to 59, null 55) passed 3/3 on B1 earlier (T035, T059; null 53, 54 and pivot 58 again after T061) and passed once each in the full run at `edc0a1e`; the builder took that as meeting 3 of 3, with no repeat at that commit. After the run, T063 changed one line each in key types, speed graph and offset `SKILL.md` (`84693de`); those cases re-ran on B1 (`c7167ea`: offset 41 3/3, key types 33 and speed graph 16 2/3 on other items, already counted as fails above), so every set stays at its bar |
| SC-007 | Met | T027's tests; live Comp 1 whole-comp summary 10.5 KB (was 12.4 KB before a parent's `moves` was said once, `1499819`; contracts/describe-layers.md › Limits) |
| SC-008 | Snapshot half met live; whole-turn half met by margin, not re-measured | T033: Comp 1 about 165 to 210 ms (+45 ms), Mentor Practice about 129 to 137 ms (+8 ms), budget 0.5 s. No lesson has run in the panel since the merge. The turn log's worst first activity before it is 9.1 s on B1 and 5.3 s on A (all within 10 s), and the snapshot adds under 0.05 s. The first live turns after the merge (spec 014 T038, or the next lesson) confirm it |
| SC-009 | Met | T028's honesty sweep |
| SC-010 | Met, 10 of 10 | T034 (`expression-reads.md` session 3), including one off and one erroring expression |

Not SCs but carried by phase 1: the record guard (FR-020, T029) and OQ-9's blanking (T057); the pivot
and null `motion_from` wording (T058, eval cases T059); the unkeyed and erroring expression rules in
the pivot and null tools (T061, T062). Every set needs a fresh A run at spec 014's ship step (T037;
Assumptions).

**Phase 2**

- **SC-011**: On Comp 1, **all 20** precomp layers are read; inner keyed-property and layer counts
  match a ground-truth capture (expected 347 and 123); the two same-name nested pairs are told apart by
  id; and places-used counts (layers, not comps) match; on the practice project, Icon Precomp's is 4.
  *Measured by:* unit test on a fresh capture.
- **SC-012**: On T006's four copies (`time-mapping-key.json`), **all 8** inner keys map within half an
  outer frame of the answer key: the remapped copy's two keys as ranges matching `outer_first`,
  `outer_last` and `frames`, and the reversed copy's inner 0 flagged as never shown. Keys outside the
  shown time are flagged on Comp 1's 30 s precomps if any exist. *Measured by:* unit tests on live captures.
- **SC-013**: A whole-project read of Comp 1 (22 comps, 33,447 properties) takes **at most 1.5 s**
  (measured live: 292 ms for the walk alone), and the precomp summary for all 20 layers is **at most
  12 KB**. *Measured by:* the builder live, and a unit test for size.

## Eval plan (for the eval engineer; cases are theirs)

This spec adds no new AI feature, so it needs no new set. It changes what six skills' tools return, so
every set re-runs (SC-006). Cases requested, from AB's held table, once US3 merges:

| Set | Situation | Hard check | Rubric item |
|---|---|---|---|
| Pivot | rock.png in a pivot lesson; Pan Behind took the parent null (turn f's edit); "done" | The reply names Shake Control's pivot; no "moved up" | "Says which layer's pivot moved, in the learner's terms, not a side effect" |
| Pivot | rock.png in a pivot lesson; parent null moved by expression; only the playhead moved since the first read; "done" | No "Undo" about the parent | "Doesn't call expression motion a learner change" |
| Null | A child of an expression-driven parent; jump check with the playhead moved | No jump reported for that child | Same |
| Null | The learner's new null renumbers a layer with a `wiggle` below it; "done" | Nothing reported on that layer | Same |
| Offset or key types | An expression-driven layer outside the focus | Not in other changes | Same |

AB's other held cases (parent named first, padded PNG, answer before a review, no Easing for keyless
motion) belong to spec 014's set and to pivot K1, not here.

## Out of scope

- **Writing, fixing or suggesting expression edits** (TD 014 § 15, H-2). The reads report text and
  errors; nothing writes one.
- **The two lessons:** skill 4 (*Find what's moving it*) and skill 10 (*Precompose*). Queued for later
  specs.
- **Any skill's teaching or `SKILL.md` wording** (except the pivot and null `motion_from` lines OQ-8
  carries, T058, *amended 2026-11-16*). Rule 1 ("trace before teaching") and the other § 10.1
  rules are spec 014's and the skill-builder's. This spec only changes what the tools return (K2, K3).
- **Lifting easing's "I can't see inside these yet"** or making inner keys findings in any skill. Phase
  2 gives the data; a later spec decides how lessons use it.
- **Visible bounds of footage (TD 014 Q6, pivot K1)**, owned elsewhere.
- **Cross-comp `comp("…")` references.** Listed as not followed. None in Comp 1 (known limit).
- **K4 to K7** (no keyframe skill for keyless motion, the record guard, hand-in, a null as a pivot
  focus): spec 014.
- **Selected layers (TD 014 Q9).**
- **The ask mode itself**, its tool's allowed list and when it calls the reads: spec 014.

## Assumptions

- Live captures are taken by the cockpit or builder (one AE driver at a time, constitution VI), on AE
  27.0, with `mentor/dev/capture.mjs` on the named comp. Planted cases go on duplicates and are reset
  with a strict compare (the sitting method in CLAUDE.md).
- **Planted cases needed** (none exist in Comp 1): an off expression, an erroring expression (planted
  on a copy; T001), a `wiggle` under a renumber (E28), a run-time name, a `comp(...)` reference, a link to a guide and to a
  matte, and precomps with start offset, stretch, negative stretch and time remap (Mentor Practice's
  Icon covers some).
- **Checked live 2026-11-14 (Phase 0, `expression-reads.md`):** in AE 27.0 an erroring expression
  stays on and its value is the base value (T001; earlier versions weren't tested, and the product
  targets 27.0); values don't change between reads at one time, but `wiggle` follows the layer's index
  (T002); separating or joining dimensions clears the expression, and the hidden-side state can't be
  made by script (T003, so E7 is "UI not tested"); turn f was a real anchor edit, by inference from the
  saved reply (T004).
- **Checked by hand 2026-11-14 (T005, session 2):** Pan Behind on the expression-driven
  null changes its base Position and Anchor Point together (+561, −120), keeps the children still
  (0.07 px) and leaves the shake running (SB-2); it took Shake Control, which was both selected and under the cursor; which rule decides is
  open (T034). The edit matches
  T004's fit for turn f within a few pixels. T006 confirmed the time mapping on all eight keys against
  AE's `sourceTime()` (an expression-only function, so the read can't call it) and the builder's eye.
- **Checked by hand 2026-11-16 (T034, session 3):** Pan Behind on AE 27.0 takes the **selected** layer,
  even with the cursor over another; with nothing selected, the top layer under the cursor (which AE
  then selects). Turn f fits: Shake Control was selected. This overturns the pivot `SKILL.md` lines from
  spec 011's AE 26.5 session; T058 rewrote them.
- **Checked live 2026-11-16 (T015 Comp 1 capture, merge `1499819`):** AE 27.0 returns expression text
  with `\r` line ends. The snapshot keeps the text as AE gives it; only `describe_layers` detail (shown
  with `\n`) and text comparisons (SC-001, FR-014's "text changed") normalize, through
  `normalizeLineEnds()` (E30). Fixtures derived by hand had `\n` and hid this.
- Expression text stays in tool replies to the model only, never in the repo except in fixtures made
  from the builder's own comps with no real names. On the learner's machine it sits in `session.json`
  only while a lesson runs (OQ-9, answered 2026-11-16).
- Moving to A (`decisions/011`): the reads don't depend on the runtime. Each set's A result goes stale
  when the tools change; the A re-runs happen in spec 014's ship step, not here. *T037 (2026-11-16):*
  all six sets are ready for A and their A dry runs are valid; the settings hash is unchanged at
  `3acbda26`, but it covers the helper's settings, not `mentor/`, so no earlier A result carries over:
  all six need a fresh A run.
- Read time was measured on one machine with one comp; the 0.5 s and 1.5 s budgets leave room for
  larger projects, which haven't been measured.

## Open questions

### For the builder (each with a recommendation)

**Answered 2026-11-14: all five as recommended** (spec approved, `944cd8c`).

- **OQ-1: K2's rule. Skip expression-driven properties, or compare their base values?** TD 014 K2 and
  the brief say "leave out". Comparing the base value at the same time catches a real hand edit to an
  expression-driven null (Pan Behind changes the base) and still ignores the expression's motion.
  **Recommended: compare base values (FR-013 as written).** Skipping would hide a real edit to exactly
  the null the ask mode will send learners to (K7).
- **OQ-2: Who owns the ask's read tool?** The ask mode needs a read-only "describe these layers" call
  with FR-016's two shapes. **Recommended: this spec defines its contract (inputs, two shapes, read
  status) in the plan; spec 014 decides when it's called and which skills may use it.** Otherwise 014's
  plan re-specifies every field here.
- **OQ-3: K3's snapshot field in all six skills now, or pivot and null first?** A new field in a skill's
  snapshot that its `SKILL.md` doesn't use yet can still leak into replies and move evals. **Recommended:
  pivot and null in phase 1 (TD 014 K3 says "first"), the other four with spec 014's rule 1 change.**
  FR-015 would then name those two.
- **OQ-4: Is "how much it moves" (FR-004) in phase 1?** It wasn't in the brief, but TD 014 § 19's new
  rule says the answer must read it before naming a fix, and Comp 1's answer turns on it (0.75° of
  rotation vs. 12 px of position). **Recommended: yes, for transform expressions only, on the asked
  layers and their parents.** It's a sampled read of values phase 1 already reads.
- **OQ-5: Phase 2's depth limit.** Comp 1 nests 2 deep. **Recommended: 5 levels**, reported as "not
  read: too deep" past that; tune if a real comp hits it.

### New from the plan (2026-11-14), each with a recommendation

- **OQ-6: Phase 2's eval gate.** *Answered 2026-11-14: as recommended.* SC-006 asks for all six sets on B1 at each phase's merge (about
  $180 a round). Phase 2 changes no skill tool's output by design (FR-028). **Recommended: for phase
  2 only, a unit test that every skill tool's reply on every eval fixture is byte-identical before and
  after (tasks T050), plus a free dry run per set, stands in for the paid re-run.** If any reply
  differs, the full re-run is required. Amends SC-006 for phase 2.
- **OQ-7: How FR-020 is enforced.** *Answered 2026-11-14: as recommended.* The model writes the record, so a rule in `SKILL.md` alone can
  slip. **Recommended: `record_lesson` refuses a summary or `next` holding 24 or more characters
  copied from an expression's text or error in the session's last snapshot (T029).** The cost: a
  refusal is one more turn in a lesson, and evals could see it; no current case writes expression
  text, so none should.
  **As built (T029, T031 review, 2026-11-16):** the guard compares against **the current lesson's
  starting snapshot**, not the session's latest read, and does nothing when no lesson is running.
  Copies under 24 characters pass by design. It guards `attempted` as well as the summary and `next`.
  **Note for spec 014:** the ask mode runs with no lesson, so this guard doesn't cover an "asked"
  record entry. Spec 014 needs its own guard (or a snapshot to compare against) for FR-020 to hold
  there; this spec doesn't change spec 014.

### New from Phase 0 (2026-11-14)

- **OQ-8: Who changes how the pivot skill says turn f's change?** *Answered 2026-11-14: as recommended.* FR-014a makes the tool report the
  cause (Shake Control's Anchor Point) with the side effect attached. Whether the mentor then says "you
  moved Shake Control's pivot, not rock.png's" depends on the pivot `SKILL.md`, which this spec keeps
  out of scope. **Recommended: tool change first (T023); if the new pivot eval case (Eval plan, row 1)
  still fails on wording, one narrow pivot `SKILL.md` line in this spec (a new task after T036), not
  spec 014's rule changes.** Expands Out of scope by that one line if needed.
  **Widened by the builder 2026-11-16 (Amendment 4):** this spec carries the `motion_from` wording
  for both pivot and null, from `specs/011-anchor/teaching-design.md` § 21 and
  `specs/012-null-parenting/teaching-design.md` § 17 (T058), with eval cases pivot 57 and null 55
  written from those sections' Pass lines, plus a case where the learner asks about Shake Control's
  shake and hears that it builds on the null's own Position (the answer the `\r` bug got wrong, E30)
  (T059). The 1 px "too small to see" floor in `specs/014-ask-mentor/teaching-design.md` § 5.1a (H-7)
  is approved; the "hard to tell apart" band is deferred until after spec 014's three sessions (T060
  records both).
  **T060 (2026-11-16):** recorded here and handed to spec 014 through the cockpit. 014's teaching
  design already carries it (§ 5.1a, H-7 answered, `d56b19d`): the first three bullets of § 5.1a are in
  force, the fourth waits on 014's three sessions. Spec 015 builds nothing for the band. What the floor
  needs from the reads is OQ-10.

### New from the T031 review (2026-11-16)

- **OQ-9: `session.json` now holds expression text and effect names on disk.** The lesson baseline
  stored in the session file includes the snapshot's new fields. It isn't the learner record, so FR-020
  holds, but it is a file on the learner's machine with text from their project (constitution IV),
  and spec 006's uninstall removes the conversation files (FR-019, T054, T057), not necessarily this
  one. **Recommended: keep it (the checks need the baseline), have the session file drop expression
  text and keep only its length and a hash (enough for FR-014's "text changed"), and ask spec 006 to
  confirm its uninstall removes `session.json` with the conversation files.** Changes what the
  baseline stores, so it's the builder's call; it doesn't block the phase 1 merge if the builder
  prefers to keep the text and only fix the uninstall.
  **Answered 2026-11-16 (builder, Amendment 4): keep the text during a lesson, then blank it.**
  - The session baseline keeps expression text and errors while a lesson runs, because the record
    guard (OQ-7, `copiesExpression` in `mentor/tools/common.mjs`) needs them across turns, and on B1
    each turn is a fresh server that only has the file.
  - They're blanked as soon as the lesson's record is saved, or when a new lesson replaces the
    baseline.
  - `calls.jsonl` logs a refused `record_lesson` call without the refused text.
  - Spec 006's uninstall always removes `session.json` and its leftovers, even with "keep my
    history" (spec 006 FR-019, amended 2026-11-16).
  - **Rejected: length plus hash** (the recommendation above, withdrawn by the cockpit). It serves
    FR-014's "text changed" but not the guard: a substring check needs the text, and a hash that
    could answer it would have to be reversible.
  Built by T057.
- **Answered 2026-11-16 by T034: the selected layer; with nothing selected, the top layer under the
  cursor** (Assumptions). T058 rewrote the `SKILL.md` lines. The item as it stood:
  **Open item for T034 (the next live sitting): which layer does Pan Behind act on?**
  `.claude/skills/anchor-mentor/SKILL.md` lines 378 to 381 say it acts on the layer under the cursor
  even when another layer is selected (spec 011's live finding, 2026-10-26). T005 moved the selected
  layer (Shake Control, which was also over the rock). Test at T034: select layer A, start a Pan
  Behind drag over layer B (not over A), and see which layer's Anchor Point moves. Until then this
  spec doesn't change that `SKILL.md` line, and Amendment 2 names only the layer it took in T005, not a
  general rule.

### New from T040 (2026-11-16)

- **OQ-10: Who gives a source's peak in screen pixels on the asked layer?** *Answered 2026-11-16: as
  recommended (FR-004a).* The approved 1 px floor
  (014 TD § 5.1a) and "say its size" are measured as **screen pixels on the asked layer** (014 TD's
  needs, item 4). FR-004 gives each expression's peak in **the property's own units**: pixels for a
  parent's Position, but degrees for Rotation and percent for Scale, which turn into pixels on a child
  only through its distance from the pivot. On Comp 1 that's the case that matters: Shake Control's
  Rotation peaks at 0.59° (T034), which 014 TD § 16 puts at about 9 px on rock.png by hand. Without
  it, the ask mode can't apply the floor to a rotation or scale source, and § 16's "about 9 px" stays an
  estimate. **Recommended: spec 015 adds it as a phase 1 follow-up**, a new FR-004a and one
  skill-builder task: for the asked layer, each parent expression's peak shift of the layer's footprint
  in comp pixels, worked out in the mentor from the values the sweep already reads (no new AE write,
  no change to FR-004's fields). It doesn't block 014's mentor half (T008 to T014); it's needed before
  014's FR-007 ordering is tested on Comp 1 and before the three sessions. *If no:* 014 states
  rotation and scale in their own units and applies the floor to Position only, and TD § 5.1a needs the
  curriculum designer to say so.
  **Answered 2026-11-16 (builder): as recommended.** FR-004a, SC-003a, E31; built by T064 (skill-builder).
  It must land before 014's FR-007 ordering test on Comp 1 and before 014's three sessions; 014's
  mentor half (014 T008 to T016) doesn't wait for it. Once it merges, § 16's "about 9 px" can be
  replaced with the tool's number (014 TD SB-4, the curriculum designer's edit).

### New from Amendment 6 (2026-11-16)

- **OQ-11: The shift is measured on the layer's box, not its visible pixels. Is that the floor's
  edge?** 014 TD § 5.1a says "the asked layer's farthest edge". The reads have the layer's box only
  (visible bounds are pivot K1, out of scope here), so a padded PNG or a full-frame precomp reads
  larger than what shows: Comp 1's ten Shakers precomps have 1920 × 1080 boxes and read about 11.3 px,
  and rock.png's box is padded (the AB baseline). The error runs one way: a box never makes a visible
  move look smaller, so the floor never hides a real cause, but it can give a size to a move the eye
  can't see. **Recommended: measure on the box for now, say so in the field (FR-004a), and ask the
  curriculum designer (through the cockpit) whether § 5.1a should say "its box's farthest edge" until
  visible bounds exist.** Doesn't block T064.
  **Answered 2026-11-16 by the builder, as recommended:** measure on the box for now; the curriculum
  designer words § 5.1a to match until visible bounds exist.

### For the curriculum designer (hand-off, not edits)

- **CD-1:** TD 014 Q8 says inside precomps is "not needed for v1", and § 13's precomps row says "I
  couldn't see inside [precomp]". With phase 2, what should an answer say once the contents are read,
  and does the § 13 row change? Also: with FR-004, does § 5.1's "in order of visible effect" want a
  threshold for "too small to see"?
- **CD-2:** Easing's "I can't see inside these yet" stays accurate only until phase 2 lands. Should the
  lesson wording become "this lesson doesn't check inside precomps"? (A skill wording change, out of
  scope here.)

### Spec housekeeping (mine, after approval)

- Add an amendment note to spec 004 FR-010 and its wave D row: R2 and R4 come from spec 015, before
  and independent of skills 4 and 10 (builder, 2026-11-14). No decision record needed: the order of
  reads is within spec 004's own rule (reads before the skills that need them).
