# Feature Specification: Diagnosis ("what's wrong here?")

**Feature Branch**: `005-diagnosis` (spec folder only; no git branch)

**Created**: 2026-10-20

**Status**: Draft, awaiting approval. Plan and tasks come after approval and the open questions.

**Input**: Cockpit task, Sprint 3 parallel run 1: "Write the spec for Knack's diagnostic
capability: reading the learner's whole After Effects comp to find what's wrong (across layers,
parents, expressions, timing and comp length, not just per keyframe pair) and recommending what
to learn next." Evidence: `discovery/diagnosis-evidence.md` (2026-10-20). Carries CLAUDE.md
"Next steps" 2.

**Why this capability**:

- **The pain.** One After Effects learner lost hours finding a mistake made early in a project:
  "it maybe took more time to find the error than to find a video that would help" (interview
  007, Did). A second, outside After Effects, lost 35 minutes not knowing why an export failed
  (008, Did). That is the "hidden cause" job: something looks wrong and the learner doesn't
  know why. It's thinly evidenced (about 2.25 points, **Low**, one After Effects source;
  `diagnosis-evidence.md` › 2). The other job under belief 1, "I know the symptom, I need the
  fix", a free chatbot with a screenshot already handles (003, 004, 006), so this spec doesn't
  aim at it.
- **This closes a gap, it doesn't open a lead.** In the 2026-10-08 side-by-side, Adobe's
  assistant read the whole Mentor Practice comp from one prompt and named 8 causes across
  layers, parents, expressions and comp length
  (`discovery/usage-notes/adobe-assistant-2026-10-08.md`). Knack today names one kind: linear
  keyframe pairs. Adobe's lead is breadth. Without diagnosis, Knack is the narrower tool.
- **What would still differ comes after the diagnosis**, and none of it has user evidence yet:
  1. **Leading into the fix without doing it.** Adobe offered to "do all of it" and, when told
     to, made changes nobody asked for. Knack names what's off, picks one place to start, and
     the learner fixes it with their own hands (spec 002's "I do, we do, you do").
  2. **Memory and practice.** What was found is carried into the next session: what's still
     open, what got fixed, and a kind of problem that keeps coming back becomes the next thing
     to practice. Adobe's assistant described no memory of the learner.
  3. **Depth inside the diagnosis.** Adobe said its tools "can read keyframe times and values
     but not their easing type", and left 7 properties unconfirmed. Knack reads each pair's
     ease (spec 001), so its diagnosis includes the one cause Adobe guessed at ("if those keys
     are linear, that's likely the biggest cause on its own"). This is a real edge today and a
     small one for Adobe to close.
  Restraint and leading are product choices Adobe could copy with a mode switch
  (`decisions/002` trigger). Depth, memory and practice are the harder parts to copy, and this
  spec's P1 and P2 stories are built around them.
- **Diagnosis is its own capability, not the last step of adding skills.** Adobe's answer came
  from comparing things with each other (durations across layers, a layer against its parent,
  comp length against when motion stops). Adding more per-skill, per-pair checks won't produce
  that (see "What the mentor can read today" below). So diagnosis gets its own reads and its
  own entry, and is not folded into each skill's opening.

## What the mentor can read today (verified 2026-10-20)

Checked against `mentor/jsx/snapshot.jsx`, `mentor/lib/analyze.mjs` and `mentor/tools/` on
`main` at `7fde798`. The evidence brief reasoned this from the transcript (its claim I); this
section confirms it against the code and makes it more precise.

**What the snapshot already reads:** comp name, duration and frame rate; every layer that has
at least one keyed property, with its name, kind (null, text, shape, precomp, adjustment, and
so on) and whether it's hidden; for each keyed property, every key's time, in and out type
(linear, bezier or hold), temporal ease, and value (numbers only: Position, Scale, Opacity,
effect sliders; shapes and text come back empty); whether an expression is turned on; and with
separated dimensions, only the side in use.

**What it doesn't read:** parenting; layer switches (motion blur, shy, solo, 3D) and the comp's
motion blur switch; whether a layer is a track matte; layer in and out points; expression text;
anything inside a precomp, or its time remapping; any layer with no keys (including properties
moved only by an expression); the work area.

Two curriculum briefs assume more than this. `discovery/curriculum-research/parenting-and-nulls.md`
says "the current tools already pass `layer.parent`", and `timing-spacing-and-offset.md` lists
"layer start/end" and parenting as existing reads. That's true of the `after-effects` bridge
tools (which the lesson may not use), not of the mentor's snapshot. The mentor reads neither.

**What reaches the model:** `snapshot_project` returns only linear and half-eased pairs, the
properties it skipped (with "expression" or "single key" as the reason), hidden layers,
precomp layers, the comp's name and duration, and counts. The rest of the snapshot stays in
the server.

| Adobe's finding (2026-10-08) | Data needed | Read today? | Reaches the model today? |
|---|---|---|---|
| 1. Every move lasts the same 1 s | key times across layers | Yes | No |
| 2. Scale and opacity land on the same frames | key times across one layer's properties | Yes | No |
| 3. Title and Subtitle ride a moving parent | parenting, plus both layers' keys | **No** (no parent read) | No |
| 4. Speed jump at a middle key on Bar | three keys' times and values on one property | Yes | No |
| 5. Cursor fades instead of blinking, stops at 2.5 s | key types and times, plus intent | Types and times yes; intent can't be read | Only as a count of held pairs, no location |
| 6. Logo's expression overrides its rotation keys | expression on or off over keys, and its text to know whether it overrides, adds to, or uses the keys | On or off yes; text **no** | Yes, as a skipped property |
| 7. Dead time: motion ends by 3 s in an 8 s comp | comp length and every layer's last key | Yes, for keyed layers only | Comp length yes, last keys no |
| 8. Motion blur off on every animated layer | layer and comp switches | **No** | No |
| (Knack only) Linear and half-eased pairs | temporal ease per pair | Yes | Yes |

So the brief's claim holds for what the mentor *says* today: none of the 8 reaches the learner
as a diagnosis. But it overstates the build: findings 1, 2, 4, 5 and 7 need only new analysis
and output over data the snapshot already reads. Only 3 and 8 need new reads from After
Effects. Finding 6 is readable only as "there's an expression on these keys": an expression can
override keys (`time * 30`), add to them (`wiggle`), or depend on them (`loopOut`)
(`curriculum-research/expressions-basics.md`), so without the expression text the mentor has to
ask rather than say the keys do nothing. That split sets the priorities below (US1 runs on today's reads; US4 adds the new
ones).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ask "what's wrong here?" and get a short, honest answer (Priority: P1)

My comp looks off and I can't say why. I ask Knack "what's wrong here?" (or "why does this look
mechanical?"). It reads my whole comp and tells me, in a few sentences, the few things most
likely making it look that way, by layer, property and time, in my layers' names. It says which
one it would start with and why. It says what it couldn't see (inside my precomps, layers it
can't read) instead of calling those fine. It changes nothing in my project.

**Why this priority**: it's the gap Adobe showed and the "hidden cause" job from interview
007. It runs on data the mentor already reads (findings 1, 2, 4, 5, 6, 7 and linear pairs), so
it's the smallest thing that tests whether diagnosis is worth anything to a learner.

**Independent Test**: on the Mentor Practice comp (`discovery/Claude AE Tutor Test.aep`), ask
"why does my comp look mechanical?" from Claude Code. It's complete if the answer names the
causes in the answer key for that comp that today's reads can see, ranks no more than 3 up
front, names one to start with, states what it couldn't see, and the comp is unchanged
afterwards.

**Acceptance Scenarios**:

1. **Given** the Mentor Practice comp is open, **When** I ask what's wrong, **Then** the mentor
   names at most 3 causes up front, each with a layer, property and time from my comp, says how
   many more it found, and names one to start with.
2. **Given** the same comp, **When** I ask to see the rest, **Then** it lists every other
   finding briefly, without repeating the first three.
3. **Given** I name a symptom ("Title feels stiff when it lands"), **When** the mentor answers,
   **Then** findings on that layer and moment come first, and if nothing it can read explains
   the symptom, it says so instead of offering an unrelated finding as the cause.
4. **Given** my comp has precomp layers or layers it can't read, **When** it answers, **Then**
   it names them as not checked, and never says they're fine.
5. **Given** a comp where none of the checks find anything, **When** I ask what's wrong,
   **Then** it says it found nothing it can check, names what it can't see, and doesn't invent a
   problem.
6. **Given** any diagnosis, **When** it ends, **Then** the project is exactly as it was before I
   asked.

---

### User Story 2 - Be led into the fix, not handed it (Priority: P1)

I pick one of the findings (or take the one Knack suggested). If a skill in the curriculum
covers it, Knack offers to start that lesson on the layer the finding is on, and the lesson runs
by its own rules. If no skill covers it yet, Knack says what to look at and where, in hints, and
I change it myself. When I say "done", it reads the comp again and tells me whether that finding
is gone, and what's still open. If I say "just fix all of it", it declines warmly and points me
at the first one.

**Why this priority**: this is the part that differs from Adobe's "do all of it". Without it,
diagnosis is a narrower copy of Adobe's answer. It's P1 with US1 because together they're the
smallest test of the claimed difference.

**Independent Test**: on Mentor Practice, after a US1 diagnosis, pick the dead-time finding and
the linear-pairs finding in turn. It's complete if the mentor leads each without changing the
project (outside a skill lesson's own demonstration), the re-check after "done" matches what's
in After Effects, and "fix all of it" is declined.

**Acceptance Scenarios**:

1. **Given** a finding a skill in the curriculum covers (for example linear pairs → the easing
   lesson), **When** I pick it, **Then** the mentor offers that lesson with the finding's layer
   as the proposed focus, and the lesson's own rules (one demonstration, hints not fixes) apply
   from then on.
2. **Given** a finding no skill covers yet, **When** I pick it, **Then** the mentor tells me what
   to look for and where (panel, layer, property, time), asks me to change it myself, and makes
   no change.
3. **Given** I've changed something and say "done", **When** the mentor checks, **Then** it
   reads the comp again and says, for that finding, whether it's gone, still there, or changed
   into something else, and names what's still open from the diagnosis.
4. **Given** a diagnosis, **When** I ask the mentor to fix everything, or to "do the rest",
   **Then** it declines, says why in one sentence (doing it yourself is how it sticks), and
   points at the next finding. It doesn't offer to do it later either.
5. **Given** a finding that may be on purpose (a fade that might be meant as a blink, equal
   durations that might be a style), **When** the mentor raises it, **Then** it asks whether it's
   intended before treating it as something to fix, and drops it if I say yes.

---

### User Story 3 - What was found carries into the next session (Priority: P2)

Next time I open Knack, it remembers what it found last time on this comp: what I fixed, what's
still open, and what it suggested learning next. It reads the comp again before saying any of
it is still true. If the same kind of problem shows up across sessions (say, every move the same
length, on two different projects), it says so and suggests that as the thing to practice.

**Why this priority**: memory and practice are the harder-to-copy parts (`decisions/002`), and
"what to learn next" needs them. P2 because it only matters once US1 and US2 are worth using,
and nobody has asked for it yet (claim L, no evidence).

**Independent Test**: run a US1 diagnosis on Mentor Practice, fix one finding, stop. Start a new
session on the same comp. It's complete if the opening names the open findings that are still in
the comp, drops the one fixed, doesn't claim anything before re-reading, and the record file
holds no method, motive, name, email or phone number.

**Acceptance Scenarios**:

1. **Given** a previous diagnosis on this comp, **When** I start a session, **Then** the mentor
   reads the record and the comp, and opens with what's still open in one or two sentences.
2. **Given** a finding from last time that's no longer in the comp, **When** the session opens,
   **Then** it says that one looks fixed, and doesn't list it as open.
3. **Given** the same kind of finding in two or more diagnoses (on any comps), **When** the
   mentor recommends what to learn next, **Then** it names that kind as a pattern and suggests
   the skill in the curriculum that covers it.
4. **Given** a finding a skill covers that the record says I've already learned, **When** it
   recommends, **Then** it suggests a short review on this finding, not a first lesson.
5. **Given** the learner record can't be read, **When** I ask what's wrong, **Then** the
   diagnosis still runs, and the mentor says once that it couldn't read its notes from before.

---

### User Story 4 - Diagnosis sees parents and switches (Priority: P2)

Knack's diagnosis also catches a layer whose own motion fights its parent's, and motion blur
switched off on animated layers, the two of Adobe's 8 that need reads the mentor doesn't have.

**Why this priority**: closes the rest of the 2026-10-08 gap. P2 because it needs new reads
from After Effects and new test fixtures, and US1 tests the idea first on reads that exist.

**Independent Test**: on Mentor Practice, the diagnosis names CTRL's drift under Title and
Subtitle, and motion blur off, and both match an inspection in After Effects.

**Acceptance Scenarios**:

1. **Given** a child layer with its own position keys under a parent that also moves in the same
   time span, **When** I ask what's wrong, **Then** the mentor names both layers and the
   overlapping time.
2. **Given** animated layers with motion blur off (on the layer or for the comp), **When** I ask,
   **Then** the mentor names it once, as a setting, not per layer.
3. **Given** a parent that doesn't move, **When** I ask, **Then** parenting isn't raised.

---

### User Story 5 - Diagnosis is evaluated (Priority: P1)

I can run an eval set for diagnosis without After Effects open and see whether the mentor
diagnoses and leads well, not only whether the findings are right.

**Why this priority**: constitution Principle III. Diagnosis changes what the mentor says, so it
needs evals before it ships, and the easing evals must still pass.

**Independent Test**: run the diagnosis evals and the easing evals on saved snapshots; get a pass
or fail per case.

**Acceptance Scenarios**:

1. **Given** the diagnosis eval set, **When** I run it, **Then** it passes at least 80% and every
   hard-rule check passes in every case.
2. **Given** the easing eval set, **When** I run it after diagnosis is added, **Then** it passes
   at its current baseline (25/25 on 2026-10-19) or within one case of it, with no hard-rule
   failure.

---

### Edge Cases

The overlaps from CLAUDE.md › "Edge cases where concepts overlap", with what each check must see.
A rule that's right for teaching can hide something from diagnosis, so each one gets a unit test
on a saved snapshot (FR-031).

| Overlap | What the diagnosis must see | What it must not do |
|---|---|---|
| **Expressions over keys** | Report the expression as the finding, on the property it's on, and ask what it's for: it may override, add to, or loop the keys. | Say the keys "have no effect" without reading the expression. Judge the timing or easing of those keys, or count them in durations, landing-together or dead time. |
| **Expression-only motion** (no keys) | Say it can't see motion that comes only from an expression, when the comp has any. (Today such properties aren't read at all.) | Call motion "finished" (dead time) without saying so. |
| **Single keys** | Treat a single key as a set value, not a move. | Count it as a move of zero length in equal-durations or dead time. |
| **Hold keys** | Treat a held pair as a jump, not a move. A run of holds (a blink) is a pattern, not a fault. | Count a held pair's span as a move's duration. Call a fade "wrong" without asking whether a blink was meant (US2 › 5). |
| **Half-eased pairs** | Count as not eased, with the linear end named (spec 002 FR-007 amendment). | Count as eased in the linear-pairs finding. |
| **Separated dimensions** | Treat X and Y Position of one layer as one move when comparing durations and landing-together. | Flag X and Y landing together as a finding. |
| **Effects** | Include keyed effect properties (Trim Paths, sliders) as motion. | Skip effect motion in equal-durations or dead time. |
| **Precomps** | Read the precomp layer's own transform. Name the precomp as not checked inside. | Claim dead time, or "nothing wrong", across a comp whose precomps it can't see into, without saying so. |
| **Hidden layers** | Set hidden layers aside, as the easing lesson does, and say so. | Include them in comparisons or dead time. |
| **Track mattes** (hidden by design) | A matte layer's eye switch is off on purpose and its motion still shows through the layer it mattes (`curriculum-research/track-mattes.md`). Until matte status is read, say a hidden layer may be a matte rather than calling it unused. | Call a hidden matte unused, or leave its motion out of dead time once matte status is read. |
| **Precomp time remapping or stretch** | Not read today; named under what wasn't checked if the comp has precomps. | Compare a precomp's own key times with the parent's as if time ran the same inside. |
| **Null and other invisible layers** | Use a null's motion for the parent check (US4). | Present a null as something the viewer sees. |
| **Layers with no keys** | Treat static layers as static. | Report them as missing or broken. |

Other edge cases:

- **AE busy or unreachable:** no diagnosis and no claims about the comp; pass on the fix (spec
  002 FR-009, server rule 2).
- **No comp open, or a different comp than last time:** ask the learner to open the comp they
  mean. A remembered diagnosis is shown only for the comp it was made on.
- **Huge comp** (many layers): the answer still leads with at most 3; the full list is on
  request.
- **Comp changed during the diagnosis conversation:** every "is it fixed?" answer comes from a
  fresh read, never from the earlier one.
- **The learner undoes a fix:** the next check reports the finding as back.
- **The learner fixes something other than the chosen finding:** the check credits whatever is
  gone and names what's still open; changes outside the findings aren't treated as mistakes.
- **A finding a skill lesson then changes:** when a skill lesson ends, the diagnosis's open list
  reflects the lesson's result on the next read.
- **Intentional style:** the learner says a finding is on purpose. It's dropped for this comp
  and recorded as intended, so it isn't raised again there.

## Requirements *(mandatory)*

### Reading the comp

- **FR-001**: Diagnosis MUST read the whole active comp each time it runs: every readable layer
  and keyed property, the comp's length, and (from US4) parenting and motion blur switches.
- **FR-002**: Diagnosis MUST read the comp only through fixed, read-only mentor tools. It MUST
  NOT use open-ended scripts or the `after-effects` tools (`decisions/003`, spec 002 FR-013).
- **FR-003**: Diagnosis analysis MUST be deterministic for the same snapshot, so a saved snapshot
  and an answer key can prove it (as spec 002 SC-001 does for easing).
- **FR-004**: Every diagnosis MUST name what it couldn't check in this comp: precomp interiors,
  expression-only motion, and any kind of layer or setting it doesn't read. It MUST NOT describe
  anything it didn't read as fine.

### Findings

- **FR-005**: Diagnosis MUST check for each kind in the catalogue below, in the story that adds
  it. Each finding names the layer(s), property and time, from the comp.

  | ID | Finding | Kind | Story |
  |---|---|---|---|
  | DX-01 | Linear or half-eased keyframe pairs | style | US1 |
  | DX-02 | Moves on different layers all last the same time | style | US1 |
  | DX-03 | Two or more properties on one layer start and end on the same frames | style | US1 |
  | DX-04 | A sudden speed change at a middle key | style | US1 |
  | DX-05 | A ramp where a hold may be meant, or holds where a ramp may be meant | ask | US1 |
  | DX-06 | An expression is on a keyed property, so the keys may not be what drives it | ask | US1 |
  | DX-07 | Dead time: all readable motion ends well before the comp does | style | US1 |
  | DX-08 | A layer's own motion overlaps its parent's motion | style | US4 |
  | DX-09 | Motion blur off on animated layers or the comp | setting | US4 |

  **Kinds:** a *conflict* is something the learner set that has no effect (none in US1: DX-06
  becomes a conflict only if a later read sees the expression text and it ignores the keys); a
  *style* finding
  explains why motion looks mechanical and may be intended; an *ask* finding depends on intent
  and is raised as a question; a *setting* is a switch. Thresholds (what counts as "the same
  time", "sudden", "well before") are set in the plan and fixed by the answer key.
- **FR-006**: The mentor MUST NOT call a style or ask finding a mistake. It says what it does to
  the motion and asks whether it's intended (US2 › 5).
- **FR-007**: The first answer MUST lead with at most 3 findings, ranked, name one to start
  with and why, and say how many more there are. The full list MUST be available on request.
- **FR-008**: When the learner names a symptom, findings on that layer and moment MUST rank
  first. If none of the findings explains the symptom, the mentor MUST say so.
- **FR-009**: When nothing is found, the mentor MUST say so and MUST NOT invent a problem.
- **FR-010**: Each finding MUST map to the skill in the curriculum that teaches its fix, or to
  "no skill yet". The map is data, kept with the catalogue, and is updated when the curriculum
  (spec 004) adds skills.

### Leading into the fix

- **FR-011**: Diagnosis MUST NOT change the project, in any step. It has no demonstration of its
  own. A skill lesson started from a finding keeps that lesson's own demonstration rule (spec
  002 FR-006) and nothing more.
- **FR-012**: When the learner picks a finding a skill covers, the mentor MUST offer that skill's
  lesson with the finding's layer as the proposed focus, and hand over to the lesson's rules.
- **FR-013**: When no skill covers the finding, the mentor MUST give hints (what to look for,
  where) and ask the learner to make the change, as spec 002 FR-008.
- **FR-014**: When the learner says "done" on a finding, the mentor MUST re-read the comp and
  report that finding as gone, still there, or changed, and list what's still open. It MUST NOT
  answer from an earlier read.
- **FR-015**: When asked to fix everything or "do the rest", the mentor MUST decline in one
  sentence with the reason, MUST NOT offer to do it later, and MUST point at the next finding
  (server rule 7).
- **FR-016**: Findings the learner says are intended MUST be dropped for that comp and not raised
  again there.

### Memory and what to learn next

- **FR-017**: At the end of a diagnosis, the mentor MUST save to the learner record: the comp,
  each finding's catalogue ID, layer and time, and whether it was fixed, still open, or intended;
  and one recommended next thing to learn.
- **FR-018**: The record MUST hold only what the checks showed or the learner said: no method
  (which shortcut or panel), no guessed motive, and no names, emails or phone numbers (spec 002
  FR-012, the 2026-10-12 agent audit).
- **FR-019**: At the start of a session on a comp with an earlier diagnosis, the mentor MUST
  re-read the comp before saying any finding is still open, and MUST say which look fixed.
- **FR-020**: The recommendation of what to learn next MUST use both the findings and the learner
  record: a kind found in two or more diagnoses is named as a pattern; a skill already learned
  gets a review, not a first lesson; a finding with no skill yet is named as not teachable yet.
- **FR-021**: Diagnosis records MUST NOT mark any skill as learned or practiced. Only a skill
  lesson's passing check does that (spec 002 FR-010, `record_lesson`'s session check).

### Hard rules (the mentor's, unchanged)

- **FR-022**: All ae-mentor server rules apply to diagnosis: Edit > Undo with no undo label; no
  claims after AE is unreachable or busy; real names from tool output; no field or value names
  shown to the learner; no announced calls or rules; hints, not fixes; no personal details in
  the record.
- **FR-023**: Diagnosis MUST work from Claude Code and from the panel without the panel holding
  any diagnosis logic (`decisions/005`, constitution II). How the panel shows a diagnosis belongs
  to the UI overhaul spec.

### Evals and tests

- **FR-024**: Every catalogue finding and every overlap row in Edge Cases MUST have a unit test on
  a saved snapshot with an answer key.
- **FR-025**: Diagnosis MUST have its own eval set in `product/evals/`, run on saved snapshots
  without After Effects, scored on teaching quality (leads, restraint, honesty about limits) as
  well as correctness (Eval plan, below).

### Key Entities

- **Diagnosis**: one reading of one comp for what's off. Holds the comp, the snapshot it came
  from, the findings, what wasn't checked, and the learner's symptom if they gave one.
- **Finding**: one entry from the catalogue (DX-ID), with layers, property, times, kind, rank,
  the skill that covers it (or none), and its state: open, fixed, intended, or changed.
- **Finding catalogue**: the list of finding kinds with their kind, thresholds, and the map to
  skills in the curriculum (FR-010).
- **Diagnosis record**: what's kept in the learner record from a diagnosis (FR-017, FR-018). It
  sits beside lesson entries and doesn't change skill status (FR-021).
- **Not-checked list**: what the diagnosis couldn't see in this comp (FR-004).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On at least 6 saved snapshots with planted findings (Mentor Practice plus one per
  overlap group), the analysis finds 100% of the answer key's findings for the stories built and
  reports 0 findings the key marks false. *Measured by:* unit tests.
- **SC-002**: On Mentor Practice, live, the diagnosis names at least 6 of Adobe's 8 findings
  after US1 (1, 2, 4, 5, 6, 7), and 8 of 8 after US4, each with layer names and times that
  match an inspection in After Effects, plus the linear pairs Adobe couldn't see. *Measured
  by:* the builder, in a usage session.
- **SC-003**: Across every diagnosis in usage sessions and evals, the project is changed 0 times
  by diagnosis (outside a skill lesson's one demonstration). *Measured by:* the mentor's call log
  and a before-and-after snapshot comparison.
- **SC-004**: From asking "what's wrong?" to the first finding shown takes 30 seconds or less in
  at least 9 of 10 turns. *Measured by:* call log and turn timings in usage notes.
- **SC-005**: In 100% of diagnosis eval cases, the first answer leads with at most 3 findings,
  names one to start with, and names what it couldn't check when the comp has any. *Measured
  by:* deterministic eval checks.
- **SC-006**: The diagnosis eval set has at least 10 cases and passes at least 80%, with every
  hard-rule check passing; the easing set stays at its baseline within one case. *Measured by:*
  eval runs.
- **SC-007**: In at least 3 builder sessions, the builder resolves at least one finding with
  their own hands after the mentor's lead, and the re-check agrees with After Effects each time.
  *Measured by:* the builder, in usage notes.
- **SC-008** (US3): In 3 of 3 checks (no earlier diagnosis, one finding fixed since, all fixed
  since), the next session's opening matches a fresh read of the comp. *Measured by:* eval cases
  plus one usage session.
- **SC-009** (the riskiest assumption, open question 1): at least one target-market After
  Effects user (not the builder) does the hidden-fault test, and the notes record which help they
  reached for first and what they did with the answer. Either result counts. *Measured by:* a
  person, logged in `discovery/` and re-scored at the next `/insights-review`.

## Eval plan (outline, for the eval engineer)

What unit tests prove (free, deterministic): the catalogue findings, ranking and thresholds, the
overlap rows, the not-checked list, and the skill map. Evals don't repeat these.

What needs the model, as cases on saved snapshots (the eval engineer writes them and owns the
numbering and fixtures):

1. **Open on Mentor Practice:** "why does my comp look mechanical?" At most 3 up front, one
   named to start, precomp named as not checked, no project change. The Logo expression is
   raised as a question, not as "these keys do nothing".
2. **Symptom named:** a symptom on one layer ranks that layer first; a symptom nothing explains
   gets "I can't see what's causing that".
3. **Clean comp:** nothing found, nothing invented.
4. **Precomp-heavy comp:** never "nothing wrong" without naming what's unseen.
5. **"Fix all of it" / "do the rest":** declined in one sentence, no offer to do it later, next
   finding named.
6. **Pick a finding a skill covers:** hands over to that lesson with the finding's layer as
   focus; the lesson's demo rule holds.
7. **Pick a finding no skill covers:** hints only, no change.
8. **"Done" on a finding:** answer comes from a fresh read (fixture: after-fix snapshot).
9. **Intent:** the cursor fade is raised as a question; "it's meant to fade" drops it.
10. **AE unreachable:** no claims, fix passed on.
11. **Next session with an open diagnosis:** opens with what's still open after re-reading;
    a fixed finding is called fixed.
12. **Pattern across sessions:** a learner record with DX-02 twice; the recommendation names the
    pattern.
13. **Learned skill:** a finding covered by a learned skill gets a review, not a first lesson.
14. **Plain speech:** no catalogue IDs, field names or quoted values in anything the learner
    sees (applies to every case as a deterministic check).

Rubric additions: leads with one place to start; honest about limits; asks about intent before
calling something wrong; doesn't lecture the whole list. Fixtures need snapshots with parenting
and motion blur once US4's reads exist; take them from live reads, not by hand.

## Assumptions

- **Entry:** diagnosis is its own entry ("what's wrong here?", its own skill), and also offered
  as the opening when a session starts without a named skill (the light opening from CLAUDE.md
  "Next steps" 2). Existing skill lessons keep their own openings. Pending open question 2.
- **Learner:** the builder on their own Mac with After Effects 26.4 or later, then target-market
  learners. No accounts, no other apps.
- **One comp at a time:** the active comp. Other comps in the project aren't read.
- **Curriculum not ready:** until spec 004 lands, the skill map has one entry (DX-01 → the easing
  lesson) and every other finding maps to "no skill yet" (FR-013 hints apply).
- **Adobe's bar:** the 8 findings are from one beta session on 2026-10-08; Adobe may have changed
  since. Open question 5.
- **Parked name:** `decisions/006` parks **Gauge** as a possible name for this feature. Not used
  here; naming isn't decided by this spec.

## Out of scope (build scope)

- **Fixing anything,** in any form: one-click fixes, "do the rest", applying a finding's fix as a
  demonstration. A skill lesson's own one demonstration is the only change, under that lesson.
- **The panel's diagnosis screens:** belong to the UI overhaul spec. This spec only requires that
  the panel holds no diagnosis logic (FR-023).
- **Reading inside precomps,** expression text, expression-only motion, track matte status, and
  layer in and out points. Named as not checked. The curriculum briefs ask for most of these as
  new reads for their skills; when a skill's spec adds one, the catalogue can use it in a later
  diagnosis spec.
- **Catalogue entries beyond DX-01 to DX-09** that the briefs suggest (a layer whose in-point
  moved but its keys didn't, a faded null expected to fade its children, leading dead time,
  non-uniform parent scale). They're candidates for a later revision, not this one.
- **Debugging expressions** (what an expression does or why it errors).
- **Export, render, performance and app problems** (008's export story is an app limit, not a
  project mistake).
- **Audio, 3D cameras and lights, masks' shapes, text content, and footage.**
- **Screenshot or image-based diagnosis,** and creative critique ("make it better", taste).
- **More than one comp,** a whole-project scan, and live watching for changes.
- **New skill lessons:** the curriculum (spec 004) decides and builds those; this spec only maps
  findings to them.
- **Other apps,** pricing, and analytics.

## Open questions (need a decision)

1. **The riskiest assumption: would learners use Knack's diagnosis over what they have now**
   (a chatbot with a screenshot, or Adobe's assistant)? Claim K in the brief, no evidence. The
   brief's test: give a current After Effects user (ideally a stranger) a comp with a known
   hidden fault, and watch which of the three they reach for and what they do with the answer;
   or, at minimum, the brief's interview questions 1 to 6 with the pitch last.
   **Recommended:** approve US1, US2 and US5 for planning now, and hold US3 and US4 until at
   least one hidden-fault session is logged (SC-009). If the learner reaches for a chatbot and
   is satisfied, rethink before building memory and new reads.
2. **Entry point:** diagnosis only on request, or also as the default opening when a session
   starts without a named skill? **Recommended:** both, as in Assumptions. The opening is one or
   two sentences ("I see three things that make this look mechanical; want to start with
   Title?"), so it tests the light "what's wrong here" opening without changing any skill.
3. **How many findings up front:** a ranked short list, or one finding only? Nothing in the
   interviews speaks to it; the builder found Adobe's 8 "a lot at once". **Recommended:** at most
   3 ranked, one named to start, the rest on request (FR-007). Revisit after SC-009.
4. **Does diagnosis need a `teaching-design.md` from the curriculum designer?** US2 (how a
   finding becomes a lesson, how to ask about intent, the wording of each kind) is teaching
   design, which this spec shouldn't write (`decisions/007`). **Recommended:** yes, a short one
   for US2 and the DX kinds, next to this spec, before `/speckit-plan`. This spec then links to
   it instead of the wording in US2 › 5 and FR-006.
5. **Re-run the Adobe side-by-side before planning?** The bar (8 findings, no easing read) is one
   beta session from 2026-10-08. **Recommended:** a 15-minute re-run of the same prompt on Mentor
   Practice before `/speckit-plan`, so SC-002 targets the current bar.

## Dependencies

- **Spec 004 (curriculum), in progress:** the skill map (FR-010, FR-012, FR-020) needs its skill
  IDs. Until then, see Assumptions › Curriculum not ready.
- **Spec 002 mentor:** the snapshot, the ae-mentor server and its rules, the learner record, and
  the easing lesson (DX-01's skill). The `mentor/tools/` per-skill layout (`b1875f1`) lets
  diagnosis be its own tool file without editing the easing tools.
- **Decisions it relies on:** `decisions/002` (the bet and its Adobe trigger), `003` (thin
  bridge, narrow tools, local learner record), `005` (panel shows only), `007` (ownership; the
  teaching design is the curriculum designer's), `008` (hooks; one agent on AE at a time).
  None needs changing. A new decision is needed only if open question 2's answer changes how
  every session opens for every skill.
- **Constitution 1.3.0:** I (this spec before build), II (FR-002, FR-023), III (FR-025, US5),
  IV (FR-018), VI (the eval engineer writes the cases, not the builder).
- **Evidence:** `discovery/diagnosis-evidence.md` (not yet committed on `main` as of
  2026-10-20), `discovery/usage-notes/adobe-assistant-2026-10-08.md`, and
  `discovery/curriculum-research/` (expressions-basics, parenting-and-nulls, precomps-nesting,
  timing-spacing-and-offset, track-mattes) for the reads and overlaps above.
