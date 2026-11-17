# Feature Specification: Ask the mentor

**Feature Branch**: `014-ask-mentor` (spec folder only; no git branch)

**Created**: 2026-11-14

**Status**: Approved by the builder 2026-11-14 as written (OQ-1 to OQ-5 as recommended; OQ-1's
constitution amendment was 1.5.0, removed in 1.6.0 below). Plan and tasks approved 2026-11-14 (PQ-1 to PQ-5 as
recommended; FR-006 and FR-016 amended for PQ-5 and PQ-4, FR-019 to match PQ-4, FR-009 points at
PQ-1). Housekeeping done 2026-11-14 (T006): mockup v5, CD-2 to CD-4 answered. **Amended 2026-11-16
(T005, builder option A):** FR-047 withdrawn (T001: a "no comp" read is unreliable,
[`ask-build.md`](../../discovery/usage-notes/ask-build.md) › T001); OQ-1's answer superseded, constitution
1.6.0 removes the exception; Ask is always available on Home and `ask-nocomp` covers no comp.
**Amended 2026-11-16 (b), builder's approval relayed by the cockpit; add only:** (1) `give_answer` takes its
own snapshot for each answer about a comp, not "the session's last read", since `describe_layers` never
writes to the session (spec 015 FR-019, FR-020; contracts/ask-tools.md step 1; data-model § 1 and § 3,
research R3 and T013 say the same); (2) FR-004 gains phase 1's
size rule until spec 015 T064 lands (spec 015 OQ-10, FR-004a); (3) this header's mockup quote matches TD
§ 16 after H-7; (4) the five refusal codes the build added beyond research R3 are listed in
contracts/ask-tools.md › Refusals and data-model § 8. New OQ-6 (FR-007's order before T064). No approved
decision or FR changes.

**Input**: Cockpit task, sprint 5: "Write spec 014 (the ask mode). Settle the answer's data (explanation,
step lines, offered skills, closing offer as fields), no offered skills on B1, and the bridge's comp-active
flag, as the builder accepted them in the review. Carry the mockup's spec 007 amendments. Reference spec
015's reads; don't re-specify them."

**What this is.** A second way into the mentor: the learner asks about their own open comp and gets a short
answer with steps that fit it, on the layer that actually makes the motion, with the skill behind each step
named so they can go deeper when they want. Read first, answer second, teach on request. It also changes
four shared rules in all six skills, the learner record, and Home, which now opens ask-first.

**What is taught** is set by the curriculum designer's teaching design, which this spec links to and doesn't
copy: [`teaching-design.md`](teaching-design.md) (written "TD § n"). The panel's screens are the
ui-designer's approved mockup, v5 (2026-11-14: step 2 of the Comp 1 answer now pairs an action with the read
fact; *corrected 2026-11-16 (b):* since H-7, TD § 16's step 2 is "Open Shake Control's Rotation expression and
look at its amounts: 0.75° at most. Not something I teach yet.", with no "too small to see", and TD § 16 is
the version to copy; the mockup still carries the old wording): [`product/mockups/ask-mentor/`](../../product/mockups/ask-mentor/README.md)
(written "MU", with its state ids). Where this spec needs something those don't say, it's a question below,
not an edit to them.

**Evidence:** `discovery/usage-notes/ask-baseline.md` (written "AB", findings 1 to 7, both 2026-11-14
follow-ups, "Proposed eval cases (held)", "Edge cases to plan for"). Fixtures:
`mentor/test/fixtures/ask/comp1-snapshot.json` and `comp1-ground-truth.json`.

### Why this, and what Adobe can't easily copy

The baseline answered 0 of 2 open questions with steps and pushed a lesson every turn (AB B-1, B-4). It taught
a pivot on a layer that couldn't change the shake, coached toward an empty corner to pass a check, told the
builder to undo work they never did, and wrote that into memory (AB 2 to 6). Mid-project, people take the
result over the lesson (belief 7), and the builder said they'd have left for YouTube or a chatbot after three or
four turns. A companion for real work has to answer first.

Answering alone isn't the edge: Adobe's assistant already answers when asked (belief 10, `decisions/002`),
and restraint is a mode switch away for Adobe. What stays hard to copy (CLAUDE.md next step 4):
- **Depth.** The answer names the layer that *makes* the motion (a parent, an expression, a link), which comes
  from spec 015's reads, and its steps lead into lessons whose checks read every pair, pivot and child on that
  real layer. Adobe's check couldn't read ease on 2026-10-08.
- **Memory and practice.** An answer is remembered as "asked about" for the skills it used, so the mentor can
  bring a skill back as practice on the next comp, and can notice a learned skill being asked about again
  (TD § 1, § 11).
- **Diagnosis stays its own capability** (CLAUDE.md next step 4, spec 005, parked). Ask reads only the layers
  the question touches and answers what was asked; it never lists whole-comp findings (TD § 4, § 9).

### Decisions and rules this spec relies on

| Record | What it requires here |
|---|---|
| `decisions/002`, amended by `012` | The mentor still leads, through the follow-through (named skills, one go-deeper, memory), not at the door. 012's "what would change our mind" is SC-001's watch signal |
| `decisions/003`, `005` (constitution II) | Read-only, narrow tools; no open-ended scripts; the panel holds no teaching logic and reads the project only through the mentor's tools, with no exception (constitution 1.6.0, 2026-11-16: 1.5.0's comp-active exception was removed when FR-047 was withdrawn) |
| `decisions/004` | Spec Kit for build specs |
| `decisions/007`, `008` (constitution VI) | `SKILL.md` files and `mentor/` are the skill-builder's; `panel/` the panel-builder's; eval cases the eval engineer's; one agent on live AE at a time |
| `decisions/011` | Built and evaluated on B1; the three sessions and the ship step on A. Go deeper is checked on A (B1 stops at the offer) |
| `decisions/012` | Home opens ask-first; a due review never opens a session started with a question |
| Spec 015 (approved) | Every read the answer needs: R2, what links here, effects, how much a source moves, K2, K3, and the ask's read tool contract (015 OQ-2). This spec decides when they're called and what is said |
| Spec 013 | A's latency (SC-002) and cost (SC-004) bars; FR-033 for eval equivalence on A |
| Spec 007 | The panel this changes; amendments in FR-055 |
| Spec 005 TD § 6.3, § 7.1 c, § 7.3 | Honesty wording for what wasn't read; stop at the offer on B1; the hint shape for steps no skill covers |
| Constitution III, IV | A new eval set (FR-061); no names or quoted questions in the record (FR-045) |

## Phases

| Phase | Stories | Waits on | Unblocks |
|---|---|---|---|
| **1. Answer** | US1, US3 (P1) | Spec 015 phase 1 merged, its SC-001 to SC-003 passing (FR-063) | Asking on B1 and the eval set |
| **2. Go deeper** | US2 (P1) | Phase 1; spec 015's K3 for pivot and null | The three sessions on A (sprint 5 "done") |
| **3. Follow-through** | US4, US5, US6 (P2) | Phase 1; US6's rule 3 waits on spec 015's K2 (US3 there) | Memory on the next comp; the four shared rules in all six skills |

The three sessions (SC-001) need phases 1 and 2 on A. Phase 3 may land between sessions (merge `panel/` only
between sittings).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - I ask about my comp and get steps that fit it (Priority: P1)

Mid-project, I type what I want my comp to do. The mentor reads the layers my question touches and their
sources, then tells me what's making it happen now (on the layer that actually makes the motion), gives me two
to four steps I can follow in AE, each tagged with the skill that teaches it, and hands the choice back to me.

**Why this priority**: it's sprint 5's first "done" item and the baseline's B-1 failure. Without it nothing
else in this spec has anything to follow through on.

**Independent Test**: on the Comp 1 fixture and the eval set's fixtures, on B1, with no go-deeper and no
panel: the answers meet FR-001 to FR-019 and the set's hard checks.

**Acceptance Scenarios**:

1. **Given** Comp 1 and "make the rock shake from where the hammer hits, not the center", **When** the learner
   asks, **Then** the first line names Comp 1; the first part says rock.png rides on Shake Control, whose
   Position and Rotation are expressions; the steps are on Shake Control, in order of visible effect (the
   Position hit sizes before the pivot, TD § 19 "Checked 2026-11-14"); the expression step pairs an action
   with the read fact and "not something I teach yet", with no edit (H-2); *Easing* is never named; the turn
   ends on one offer naming at most two skills.
2. **Given** Comp 1 and "what does the sweep control layer do?", **When** asked, **Then** the answer says its
   Position drives the Center of a CC Light Sweep on Black Solid 1, marked as inferred, and that Black Solid 1
   doesn't render (eye off, not a matte). It never says "I can't see that". It has no steps, so no STEPS block
   and no dock (MU `ask-new-question`).
3. **Given** a keyed layer and "make Title land softer", **Then** the steps are tagged *Speed graph* and the
   offer names it; no lesson starts without a yes.
4. **Given** "make it feel more natural" with keyed motion on one layer and an expression on another, **Then**
   one clarifying question names both layers and carries nothing else; after any reply, an answer follows with
   the assumption stated (TD § 5.2).
5. **Given** a question about render settings, **Then** one sentence says it's outside what the mentor covers
   and what it does cover; no general answer, no steps (TD § 9, MU `ask-outside`).
6. **Given** a precomp in the answer's reach, **Then** the answer says "I couldn't see inside [precomp]",
   never that it's empty or not animated, until spec 015 phase 2 lands (CD-1).
7. **Given** no comp is active, **Then** the mentor says no comp is open and what to do, with no steps
   (MU `ask-nocomp`).
8. **Given** "do it for me", **Then** the curriculum § 2 decline in one sentence and step 1 again; the project
   is unchanged.

---

### User Story 2 - I go deeper into a lesson on my own layer, then back to my steps (Priority: P1)

When a step uses one of the six skills, I can say yes to the offer (or press Go deeper) and the lesson opens on
the layer that makes the motion, in my words, without asking me what I want again. When it's done, the mentor
names my next step.

**Why this priority**: the follow-through is where the mentor still leads (`decisions/012`). Sprint 5's measure
needs a go-deeper in each session, and 012's watch signal is whether it happens unforced.

**Independent Test**: on A, from the Comp 1 answer, Go deeper on *Set the pivot* opens on Shake Control with
Pick done, checks that the rock and letters didn't move, and hands back to the next step (TD § 17 situation 16).

**Acceptance Scenarios**:

1. **Given** the Comp 1 answer on A, **When** the learner says yes to *Set the pivot*, **Then** the lesson opens
   on Shake Control as a continued lesson ("We're on Shake Control, …"), skips its intent question and
   proposal, and ends its opening on its own first step (TD § 7.2, K6).
2. **Given** that lesson, **When** checked, **Then** the check grades the children's comp-space footprints
   (they didn't move), and the learner's named spot ("where the hammer hits") is taken as given and recorded as
   theirs (K7, TD § 10.1 rule 2). It never asks for a spot the learner called wrong.
3. **Given** the lesson passes, **When** it ends, **Then** its last line hands back: "That was step [n]; next
   is [step n+1]." from the answer's saved steps, and the panel shows `ask-back` with Your steps open.
4. **Given** the learner already learned *Set the pivot*, **When** they go deeper, **Then** it runs as
   practice: no "review" anywhere, a miss says what's still off and where with no fail words, and the record
   isn't a failed review (TD § 19).
5. **Given** B1, **Then** no Go deeper control appears, and a yes gets no hand-over (TD § 7.1, § 19).
6. **Given** a step whose lesson can't check the real target and nothing on it is checkable, **Then** the offer
   isn't made, and the steps stand on their own (TD § 7.3).
7. **Given** keyless, expression-driven motion, **Then** no keyframe skill (easing, key types, speed graph,
   offset) is offered (K4, AB 3).

---

### User Story 3 - Home opens on a place to ask (Priority: P1)

When I open the panel, I see a place to ask about the open comp, and under it one quiet line: the lesson I'm in
the middle of, or Find my next lesson. A due review never greets me at the door.

**Why this priority**: `decisions/012`. The baseline's first turn was a review offer mid-project and felt like a
quiz (AB 7).

**Independent Test**: panel tests drive every new and changed Home and Ask state in MU's States table from
fixture events, with no mentor.

**Acceptance Scenarios**:

1. **Given** a record with a review due and no lesson in progress, **When** Home opens, **Then** it matches
   `home-return` (`home-review-due` is identical on purpose); the review shows only in Skills.
2. **Given** a lesson in progress, **Then** the quiet line reads "Pick up [skill] on [layer]" with Set it aside
   (`home-inprogress`, formerly `home-cutoff`).
3. **Given** an empty record, **Then** Home shows "Welcome to Knack.", the ask card and Find my next lesson
   (`home-first`), not Easing with Start lesson.
4. **Given** no comp is active, **Then** Ask on Home stays available, and asking gets "No comp open. Open one,
   or click into its timeline." from the mentor's read, with no steps (`ask-nocomp`). (Amended 2026-11-16: was
   Ask paused on Home from the bridge's flag, `home-nocomp`; FR-047 withdrawn.)
5. **Given** an answer with step data, **Then** the panel draws explanation, then STEPS and the numbered list
   from the step data, then the closing offer, then one Go deeper per offered skill; Your steps docks folded,
   with no ticks (`ask-answer`).

---

### User Story 4 - I follow up, try the steps, and say how it went (Priority: P2)

I can ask "why the null?" or "where's Pan Behind?", say "done" or "it didn't work", and ask a new question in
the same thread. The mentor reads again and says what changed, without grading me or blaming me.

**Why this priority**: the turns after the answer (TD § 6). P2 because one answer and one go-deeper already
make a session; these make it hold up for longer.

**Independent Test**: eval cases for turns 3, 4 and 7 on fixtures (TD § 17 situations 8, 19), on B1.

**Acceptance Scenarios**:

1. **Given** a follow-up question, **Then** one or two sentences answer it, then the pending step again in one
   sentence.
2. **Given** "it didn't work" after a change landed on the wrong layer, **Then** a fresh read of the same layers
   says where it landed, as a hint, with no pass or fail words.
3. **Given** "done" with the playhead moved and an expression-driven parent, **Then** no "you moved" and no
   Undo advice about the parent (rule 3, spec 015 K2).
4. **Given** "just the steps", **Then** no further lesson offer in this thread until the learner asks, gets
   stuck, or asks a new question.
5. **Given** a new question, **Then** the earlier one folds and the dock shows only the new answer's steps, or
   goes away if it has none.

---

### User Story 5 - The mentor remembers what I asked, without judging me (Priority: P2)

What I asked about is kept in general terms with the skills the steps used, so a later "what's next" can bring a
skill back on my own work. Asking about something I've already learned is treated as normal.

**Why this priority**: memory is half of what Adobe can't easily copy (TD § 1). P2 because the sessions can
run before it, but it must land before the third.

**Independent Test**: unit tests on the record after fixture answers, plus TD § 17 situations 17 and 18.

**Acceptance Scenarios**:

1. **Given** an answer, **Then** one "asked" entry is written with the comp, the layers the steps were on, the
   goal in general motion terms, the skills referenced, and whether a go-deeper started; no skill's status or
   review date changes.
2. **Given** a learned skill asked about again, **Then** the entry notes it for scheduling only; the mentor
   never says "you already learned this", "remember when" or "as we covered", and may bridge only by crediting
   the learner (TD § 11).
3. **Given** a later `/next-mentor` on a comp where an asked-about, unlearned skill fits, **Then** it may raise
   it ("last week you asked about …"), at most once.

---

### User Story 6 - Every lesson traces the motion first and never coaches to the checker (Priority: P2)

Whatever way I start a lesson, it checks where my layer's motion comes from before teaching on it, takes the
place I name over the check's grid, never calls a change mine unless it really was, and records only what a
check saw or I said.

**Why this priority**: AB 2, 4, 5 and 6 came from the lessons, not the opening. Pivot and null get it in phase
2 (for go-deeper); the other four in phase 3.

**Independent Test**: each set's eval cases for the four rules (Eval plan), plus unit tests for K4, K5 and K7.

**Acceptance Scenarios**:

1. **Given** a pivot lesson on a child whose turn comes from an expression-driven parent, **Then** the lesson
   says so in one sentence and teaches on the parent, or says it can't change that motion here (rule 1).
2. **Given** a padded PNG and a spot the learner names on the art, **Then** the lesson grades only "the layer
   didn't move" and never asks for the box's corner (rule 2, AB held case 3).
3. **Given** a record summary that says the learner undid a change the session's checks never attributed,
   **Then** the record is refused and the mentor rewrites it (K5, AB 6).
4. **Given** a due review and a session the learner started with a question, **Then** the review isn't the
   opening; at most one clause after an answer, once per session, only if it fits the comp (rule 5).

---

### Edge Cases

Overlaps the answer and turn 4's fresh read must get right (CLAUDE.md "Edge cases where concepts overlap";
TD § 13, which this table turns into requirements without restating its wording). Lessons keep their own
overlap tables; FR-033 to FR-037 change them. **015** = the read comes from spec 015.

| # | Overlap (TD § 13 row) | Requirement | Read from | Eval situation (TD § 17) |
|---|---|---|---|---|
| A1 | Expressions over keys | FR-010: say both; "builds on" only as inferred; no step edits keys as if they drive it | 015 FR-001, FR-002 | New case (EE-4) |
| A2 | Expression-only motion | FR-022: no keyframe skill offered; FR-003 names the source | 015 FR-005 | 5 |
| A3 | Parents (keys or expressions) | FR-003: "[layer] rides on [parent]"; steps on the source layer | 015 FR-005, K3 | 1 |
| A4 | Separated dimensions | FR-010: name the dimension that moves; never an inactive Position expression as a driver | 015 FR-006 | New case (EE-4) |
| A5 | Effects | FR-004: effect names from the read, never "can't see" | 015 FR-007 | 6 |
| A6 | What links to a layer | FR-004: link described, marked inferred; target's rendering said | 015 FR-008 to FR-011 | 6 |
| A7 | Precomps | FR-012: "I couldn't see inside [precomp]" until 015 phase 2 and CD-1 | 015 phase 2 | 14 |
| A8 | Hidden layers | FR-012: a matte is never "hidden"; a null "never renders but moves its children" | Spec 004 FR-013 | 15 |
| A9 | Padded footage | FR-034: the learner's named spot, never the box's corner | OQ-3 (visible bounds) | AB held 3 (pivot set) |
| A10 | Single and hold keys | FR-010: a hold is a jump, a single key "set, not animated" | Snapshot today | New case (EE-4) |
| A11 | Motion between reads | FR-027, FR-035: never "you moved it" or Undo for expression motion | 015 FR-012, FR-013 | 2, 19 |
| A12 | Locked, 3D, Collapse | FR-015: said in the step it blocks | Snapshot today | New case (EE-4) |
| A13 | Same-name layers | FR-014: one clarifying question naming up to three | 015 FR-017 | 12 |
| A14 | Asked layer ≠ moving layer, and a pivot lesson refuses the moving layer | FR-024: offer on the real layer once K7 lands; a stand-in only per H-4 | K7 | 16 |

## Requirements *(mandatory)*

### Functional Requirements

**The read before the answer (US1)**

- **FR-001**: Every answer MUST come after a read of the layers the question names plus their motion sources
  and links (parents up the chain, expressions, effects, what links to them, how much each source moves them),
  not the whole comp (TD § 8). The read is spec 015's read tool (015 OQ-2); this spec decides when it's
  called. A question that names no layer, or names one ambiguously, reads enough to list candidates.
- **FR-002**: The ask mode MUST NOT change the project. Its skill's allowed tools MUST include no
  demonstration tool and no tool that changes the project, and the panel's "Reads your comp. Changes nothing."
  MUST stay true (TD § 5.4; the diagnosis precedent, spec 005).

**The answer (US1; TD § 5)**

- **FR-003**: The mentor's first line MUST name the comp it read ("In Comp 1, …"), as the wrong-comp safeguard
  (TD § 19). The first part MUST say what makes the motion now, on the layer that makes it, with its source
  (own keys, a parent, an expression, an effect, inside a precomp); when the asked and moving layers differ, it
  MUST name both (TD § 5.1 part 1).
- **FR-004**: When the cause has parts, the explanation MAY be a short bulleted list, in order of visible effect
  (spec 015 FR-004's "how much"). It MUST NOT be numbered, called steps, or docked.
  *Amended 2026-11-16 (b), spec 015 OQ-10:* **phase 1, until spec 015 T064 lands**, the skill gives each
  source's size in the read's own units (pixels for Position and Anchor Point, degrees for Rotation, percent
  for Scale; spec 015 FR-004's `moves`) and never drops a source or calls it too small to see for being small.
  **After T064**, it uses the comp-pixel `shifts` on the asked layer (spec 015 FR-004a) and TD § 5.1a's 1 px
  floor (under 1 px: never named as a cause, never a step; 1 px and up: its size, not an adjective).
- **FR-005**: Step lines MUST be things the learner does in AE: each starts with an action on a named layer or
  property, in AE's words for the builder's version (AE 27.0), followable without asking what to do. Two to
  four lines; past four, the first three and a sentence saying there's more. Explanation is never a step
  (TD § 5.1 part 2, builder 2026-11-14).
- **FR-006**: Each step line that changes something MUST carry either one skill tag (FR-021's short names) or
  "not taught yet"; a step that only plays back or looks may carry no tag (`skill: null`, drawn untagged;
  amended 2026-11-14, plan PQ-5). A "not taught yet" step's text always ends with "Not something I teach
  yet.": the answer tool appends it when missing, since the panel draws no separate tag for it
  (contracts/ask-tools.md step 3a, amended 2026-11-14 after the T035 review). A
  step outside the six MUST pair an action with what the read sees there ("Open …'s Position expression and
  look at how it sets each hit's size: it uses the first hit's size for all three."), never the edit, never new
  or rewritten code (H-2, TD § 19).
- **FR-007**: Steps MUST be ordered by visible effect when the read gives how much each source moves the layer
  (TD § 19 "Checked 2026-11-14"), and MUST NOT name a fix before that has been read.
- **FR-008**: The turn MUST end on one closing offer: one sentence, a question, naming at most two skills, both
  among the step tags (TD § 5.1 part 3, § 7.1). No greeting, no "great question", no recap, no list of what's
  fine. The whole answer, step lines included, SHOULD be about 120 words (a guess to tune on the sessions).
- **FR-009**: The mentor's prose MUST NOT contain the step list or a "Steps:" label. The steps reach the learner
  only from the step data (FR-016) (TD § 19). The answer turn has no prose at all; its words are only the
  answer tool's fields (plan › PQ-1).
- **FR-010**: Every claim MUST be one of TD § 5.3's three kinds: read (plain), inferred (marked "so", "which
  means", "looks like"), or not read (named, with what's missing). A step that depends on something unread MUST
  say so in the step. An assumption about intent is stated once, in the first part.
- **FR-011**: The mentor MUST NOT say it can't see a layer, effect or link that the read returned (AB 1).
- **FR-012**: Nothing unread MUST be called fine, empty or absent: a precomp is "I couldn't see inside
  [precomp]" until spec 015 phase 2 lands and the curriculum designer answers CD-1; a matte is never "hidden".
- **FR-013**: At most one frame per answer, only when the first part points at something that shows at one
  time (TD § 5.1). No frame by default.
- **FR-014**: The mentor MUST ask one clarifying question instead of answering only when the read can't settle
  it **and** the readings lead to different first steps (TD § 5.2). The question is one sentence naming the
  choices from the read (up to three layers) and carries nothing else. After any reply, it MUST answer, stating
  its assumption. A clarifying turn has no step data and no offer.
- **FR-015**: A fact about an asked layer that stops a step from working (locked, eye off, Collapse) MUST go in
  that step. No other finding about the comp MAY be added (TD § 9, no whole-comp findings).
- **FR-016**: **Each answer turn MUST produce a structured "asked" result** with four fields, so the panel never
  parses prose (cockpit item 1; MU › Open question 2 and design review 4):
  1. **explanation**: the mentor's words for part 1;
  2. **steps**: the step lines in order, each with its skill (a skill ID, "not taught yet", or none for a
     step that only plays back or looks, FR-006); a not-taught step's text ends with "Not something I teach
     yet.", added by the tool if missing (FR-006);
  3. **offered skills**: zero to two skill IDs, each among the steps' skills, except that a how-to answer with
     no comp target (FR-019) may carry one offered skill and no steps; its go-deeper hands over with no layer
     and the lesson opens as it would from Skills (amended 2026-11-14, plan PQ-4);
  4. **closing offer**: the hand-back sentence, as its own field.
  A turn with nothing actionable has empty steps and offered skills. A clarifying question, the outside line,
  a describe-the-comp answer and "no comp open" all have empty steps.
- **FR-017**: **On B1, the result MUST carry no offered skills**, so no Go deeper control appears (cockpit item
  2). The closing offer's wording is unchanged on B1, so the eval set still judges it there; a yes on B1 MUST
  NOT hand over and gets TD § 7.1's one sentence pointing to the Skills tab (CD-4, answered 2026-11-14). The
  plan says where B1 is detected.
- **FR-018**: Scope by step (TD § 9): **inside** the six, tag and offer; **describing the comp**, always in
  scope; **next to the six**, FR-006's line; **outside** (color, render, export, audio, 3D, typography, other
  apps, general trivia, or nothing in the comp to read), one sentence that it's outside what the mentor covers
  and what it does cover, and nothing from general knowledge. A goal partly outside gets both bands in one list;
  the outside part is never dropped.
- **FR-019**: A how-to inside the six with no comp target ("how does the speed graph work?") MUST get two
  sentences and an offer of the lesson (H-3, decided as recommended). Its result carries no steps and one
  offered skill, the lesson it offers (on B1, none, FR-017); Go deeper hands over with no layer, and the lesson
  opens as it would from Skills (amended 2026-11-14, plan PQ-4; FR-016 item 3).
- **FR-020**: "Do it for me" MUST get the curriculum § 2 decline in one sentence, then step 1 again in one
  sentence. "Show me" is a yes to the go-deeper; the ask mode has no demonstration (TD § 5.4).

**Skill names (US1, US3)**

- **FR-021**: Tags and Go deeper MUST use these short names; the lesson header and Skills keep the full names
  (MU › Short skill tags; TD § 19):

  | Skill | Tag and Go deeper |
  |---|---|
  | Easing | Easing |
  | Pick the key type on purpose | Key types |
  | Shape the ease in the speed graph | Speed graph |
  | Break the lockstep with offset | Offset |
  | Set the pivot (anchor point) | Set the pivot |
  | Move a group with a null | Group with a null |

  The step data carries skill IDs; the names come from the path data, so the mentor never spells them.

**Going deeper (US2; TD § 7)**

- **FR-022**: The offer MUST name only a skill whose lesson's check can see the learner's real target, and MUST
  NOT name a keyframe skill (easing, key types, speed graph, offset) for motion with no keys (K4). The same rule
  MUST hold in `recommend_next` (K4).
- **FR-023**: A learned skill MUST be offered and run as **practice**, never a review: the lesson starts without
  review mode, no "review" label or "Review passed" shows, a miss says what's still off and where with no fail
  words, and it's recorded as practice, so status and review date stay as they were (TD § 19; the record's
  existing practice rule). An unlearned skill runs as a first lesson. A missing hard prerequisite is named in
  one sentence and the lesson still runs if wanted (`/next-mentor` step 4).
- **FR-024**: When a lesson's focus rule would refuse the moving layer, or the check can't see part of the
  target (TD § 7.2, § 7.3, H-4 decided as recommended): offer the lesson on the real layer with the uncheckable
  part ungraded when the rest is checkable, and say what isn't checked in the offer; offer a stand-in layer only
  when nothing on the real layer is checkable; otherwise no offer.
- **FR-025**: **On A**, a yes (typed or pressed) MUST hand over in the same conversation with the answer's
  context: the layer that makes the motion, the learner's intent in their words and any place they named, and
  the goal sentence plus the saved steps (TD § 7.2; `/next-mentor` step 6's hand-over, never saying a command).
- **FR-026**: **Hand-in (K6), every skill:** a lesson started from an answer MUST skip its intent question and
  proposal, open as a continued lesson on the given layer in the learner's words, end its opening on its own
  first step, and keep its own rules (one demonstration, hints not fixes, the check, the record). Its last line
  MUST hand back: "That was step [n]; next is [step n+1]." from the saved steps (TD § 6 turns 5 and 6, § 10.1
  rule 6). Ended early, the mentor still names the next step (MU `ask-ended`).
- **FR-027**: **Pivot on a null (K7):** *Set the pivot* MUST accept a null with children as its focus when the
  answer names it as the parent carrying the motion, and grade "the children's comp-space footprints didn't
  move" plus the learner's named place as given. An existing control null's pivot routes to *Set the pivot*,
  never *Group with a null* (TD § 10.3, SW-2). The null skill keeps refusing already-parented layers.

**Turns after the answer (US4; TD § 6)**

- **FR-028**: A follow-up question MUST get one or two sentences, then the pending step again in one sentence.
- **FR-029**: "Done" or "it didn't work" MUST trigger a fresh read of the same layers and a description in
  FR-010's kinds: what changed, what didn't, and where a change landed if on another layer. It MUST NOT say
  pass, fail or "you did X" unless two reads at the same time differ on a base value (spec 015 FR-012,
  FR-013), and MUST NOT advise Undo for a change the learner didn't say they made. Then the next step, or one
  offer to go deeper on the step that didn't land.
- **FR-030**: After "just the steps", or an offer ignored, no further lesson offer in the thread until the
  learner asks, gets stuck (turn 4), or asks a new question (TD § 5.4).
- **FR-031**: A new question MUST get a fresh answer (turn 2 again); the session's earlier answer is context,
  not recited.
- **FR-032**: A due review MUST NOT open a session the learner started with a question. It MAY appear as one
  clause after an answer, at most once per session, only when its skill fits the comp (TD § 10.1 rule 5).

**Shared rules in all six skills (US6; TD § 10.1, § 10.2)**

- **FR-033**: **Rule 1, trace before teaching.** Before teaching on its focus, every skill MUST check where the
  focus's motion comes from (spec 015's motion-sources map with K3). If the motion the learner cares about
  comes from elsewhere, it says so in one sentence and teaches on that layer, or says it can't change that
  motion here. The pivot skill's parent note is rewritten where the parent carries Rotation or Scale motion.
  Pivot and null in phase 2; easing, key types, speed graph and offset in phase 3, with their K3 snapshot field
  (spec 015 OQ-3).
- **FR-034**: **Rule 2, the learner's intent outranks the check's geometry.** When the learner names a place
  the check can't place, the lesson says what it can check, grades only that, and MUST NEVER ask the learner
  to put something where they said it's wrong, not even "then nudge it back" (AB 5).
- **FR-035**: **Rule 3, a change the check can't attribute is never the learner's.** Teaching wording on top of
  spec 015's K2 tool change: "[layer] looks different from my last read; that may be its expression moving
  it", or nothing.
- **FR-036**: **Rule 4 and K5, the record says only what a check saw or the learner said.** `record_lesson`
  MUST refuse an entry that attributes to the learner a change the session's checks didn't attribute
  (extending today's result-against-session check). A result reached only by matching the check's spot after
  the learner said it was wrong is `partial`, never `passed`.
- **FR-037**: **Rules 5 and 6** are FR-032 and FR-026, in every `SKILL.md`.

**Memory (US5; TD § 11)**

- **FR-038**: Each answer with steps MUST write one **asked** entry (fields in Key Entities): date, project,
  comp, the layers the steps were on, the goal in general motion terms, the skills referenced, whether a
  go-deeper started and which, and what the learner said back, marked as said, only when they said it.
- **FR-039**: An asked entry MUST NOT change any skill's status, times passed, review date or reviews in a row,
  and MUST NOT be a review, passed or failed.
- **FR-040**: The goal MUST be in general motion terms, never the learner's sentence (it may hold names or
  client details). It MUST NOT hold a verdict on the goal, method or motive, expression or error text, effect
  names from a read, or anything a tool inferred stated as the learner's action.
- **FR-041**: A learned skill referenced again MUST be marked "asked about after learning" on the entry, for
  scheduling only. It MUST NOT change the review schedule in this build (H-5: record now, schedule later), and
  the mentor MUST NOT mention it to the learner. The mentor answers it as helpfully as a first question and
  never says "you already learned this", "remember when" or "as we covered", nor turns it into a quiz; a bridge
  that credits the learner ("the same pivot move you did on Door, just on the null") is allowed.
- **FR-042**: `/next-mentor` MAY raise an unlearned skill from an asked entry as a candidate on the learner's
  own comp when its focus finder finds something for it, once per entry, below a lesson in progress (TD § 11).
- **FR-043**: The panel MUST NOT show asked entries in "What the mentor remembers" or anywhere as "asked again"
  (MU › Asking again is normal). Whether they show at all is left to a later spec.

**Privacy (constitution IV)**

- **FR-044**: No asked entry, eval fixture or usage note MAY hold a real name, email or phone number;
  `record_lesson`'s and the asked entry's personal-detail check (today's `UNSAFE_RECORD`) MUST cover every new
  text field.
- **FR-045**: Expression text, error text and the learner's question MUST stay in the conversation only; the
  record never stores them (spec 015 FR-020). The saved conversation (spec 013) is cleared as today.

**Panel (US3; MU, spec 007 amendments)**

- **FR-046**: The panel MUST implement every **new** and **changed** state in MU's States table by its id, as
  drawn, with spec 007's tokens and components. "Same" states keep spec 007's behavior.
- **FR-047** (**Withdrawn 2026-11-16**, builder option A): ~~The bridge's health check MUST add whether a comp
  is active (yes or no, no name, no other project detail) so Home can pause Ask before anyone asks
  (`home-nocomp`).~~ **Why withdrawn:** T001 found only a "yes" reliable. With a comp open, clicking a footage
  item or an empty spot in the Project panel reads as no comp (states 3 and 4b in
  [`ask-build.md`](../../discovery/usage-notes/ask-build.md) › T001), so Home would pause Ask with a comp on
  screen. **Instead:** Ask is always available on Home; when no comp is active at ask time, the mentor's read
  gives "No comp open. Open one, or click into its timeline." (`ask-nocomp`), and that one click fixes both
  false-"no" cases too. The bridge's health check is unchanged, and constitution 1.6.0 removed the 1.5.0
  exception. The ID stays so references resolve.
- **FR-048**: The panel MUST draw an answer as: the explanation, then (only with step lines) the STEPS heading
  and numbered list from the step data, then the closing offer, then one gray **Go deeper: [tag] ›** per offered
  skill inside that answer. Nothing is said twice. If the result is missing or malformed, the panel MUST show
  the mentor's words as they came, with no STEPS block, no dock and no Go deeper (fail closed).
- **FR-049**: **Your steps** MUST dock under the chat, folded, holding only the latest answer's steps, with no
  glyphs or ticks ever and "From the answer. Knack doesn't track these." in its header. No steps, no dock. It
  opens itself once on returning from a lesson (MU › Asking).
- **FR-050**: Go deeper MUST appear only inside its answer, never again in a later turn; while its lesson is
  open it becomes **Back to your lesson ›**; after the lesson it's gone (MU `ask-lessonopen`, `ask-back`).
- **FR-051**: A go-deeper lesson MUST show "From your question. Back returns you to it.", Pick already done, a
  Practice tag for a learned skill, and on a pass **Back to your steps ›** in place of What's next ›. The result
  line and the return divider come from the check's result for each skill (plain lines listed in the plan for
  all six, e.g. pivot "Pivot moved, nothing else did.", divider "[Skill] · practiced on [layer]" or "· ended,
  not saved") (MU › Going deeper).
- **FR-052**: While a go-deeper lesson is open, Home MUST show `home-lessonopen-deeper` and the thread
  `ask-lessonopen` (follow-up and Ask paused, with the reason in words); AE busy shows `ask-busy`.
- **FR-053**: Panel copy MUST be MU › Copy's strings, plain (CLAUDE.md › Voice), with no field names, tool
  names or commands (spec 007 SC-011).
- **FR-054**: Accessibility per MU › Accessibility: Ask paused with `aria-disabled` and its reason linked; the
  steps toggle with `aria-expanded` and `aria-controls`; STEPS a heading; focus never dropped to the page;
  Enter sends, Shift+Enter adds a line; nothing under 11 px.

**Spec 007 amendments this spec carries** (written into spec 007 after approval; housekeeping below)

- **FR-055**: Spec 007 is amended as follows (MU › Spec 007 amendments, plus three the mockup didn't list):
  - **FR-006:** `home-cutoff` becomes `home-inprogress`; add `home-lessonopen-deeper`, `home-nocomp`,
    `home-thread` and MU's ask states. (`home-nocomp` is moot since FR-047 was withdrawn, 2026-11-16; spec 007
    FR-006 still lists it until it's tidied.)
  - **FR-007 and FR-009:** the Up next card is gone. Home is the ask card and one quiet line (a lesson open,
    else a lesson in progress, else Find my next lesson). Pick a skill is the Skills tab (still on
    `lesson-picking`).
  - **FR-010:** an empty record shows Find my next lesson with "Welcome to Knack.", not the path's first skill
    with Start lesson.
  - **FR-026:** "Your lesson is waiting" becomes the quiet line "Pick up [skill] on [layer]" with Set it aside.
  - **FR-046 (not in MU's list):** "not on Home or Skills (D2, settled)" is overridden by `decisions/012`: Ask
    is on Home; the Lesson tab's Ask stays.
  - **FR-050 and FR-051 (not in MU's list):** What the mentor remembers and Practice due move from Home to
    Skills (MU › What this removes; OQ-2).
  - **SC-010:** the Home state list changes as above, and the ask states are added (OQ-4 on sizes).
  - **T061:** `home-first` is checked for the ask card and Find my next lesson; the flow from
    `lesson-picking` on is unchanged.
  - **FR-008 still holds:** Home is drawn from the record and path data, with no mentor turn until a press.

**Runtime, speed and cost (decisions/011, spec 013)**

- **FR-056**: The ask skill and every change here MUST be built and evaluated on B1, then pass
  `ready-for-a` and a dry run, then one paid A run of the ask set, before the three sessions; the sessions run
  on A (`bash panel/install.sh --runtime a`).
- **FR-057**: The ask skill's name MUST be `*-mentor` (A's rule) and its allowed tools MUST list the read tool,
  `preview_frame`, the record tools it writes, and the hand-over; nothing that changes the project.
- **FR-058**: Every ask turn MUST show the first sign of the mentor working within 10 s (spec 003 SC-004, spec
  013 SC-002), and the turn log MUST tag ask turns so `panel/dev/turns.js` reports them apart from lessons.

**Dependencies on spec 015**

- **FR-059**: These requirements MUST NOT be built against stand-in reads; each waits on a spec 015
  deliverable:

  | 014 requirement | Waits on (spec 015) |
  |---|---|
  | FR-001, FR-003, FR-010, FR-011 (expressions, parents, sources) | FR-001, FR-002, FR-005, FR-016 to FR-018 (phase 1, US1) and the read tool contract (015 OQ-2) |
  | FR-004 (effects, links) and US1 scenario 2 | FR-007 to FR-011 (phase 1, US2) |
  | FR-007 (order by visible effect) | FR-004 (how much) |
  | FR-022 (K4: no keyframe skill for keyless motion) | FR-005 (expressions in the motion-sources map) |
  | FR-027 (K7) and FR-033 for pivot and null | FR-015 (K3 snapshot field, pivot and null) |
  | FR-033 for the other four | Spec 015 OQ-3: the K3 field arrives with this rule |
  | FR-029, FR-035 (turn 4, rule 3) | FR-012 to FR-014 (K2, US3) |
  | FR-012's precomp wording changing | Phase 2 (US4) and CD-1 |

- **FR-060**: The ask skill MUST NOT go to the three sessions until spec 015 phase 1 is merged with its SC-001
  to SC-003 passing (TD § 8: "isn't worth shipping without R2 and Q4").

**Evals (constitution III)**

- **FR-061**: The ask mode MUST have its own eval set, `product/evals/ask/`, built by the eval engineer from TD
  § 17's 19 situations (the first five are AB's held cases), with fixtures shaped like the real cases, Comp 1's
  among them. It MUST include deterministic checks for: no project-changing tool called; at most two offered
  skills, each among the step tags; none on B1; no keyframe skill offered for keyless motion; no "can't see"
  about a layer the read returned; no "Undo" about an expression-driven layer; no lesson started without a yes;
  the first line names the comp; no slash command named; no "review" in a learned-skill go-deeper; no step
  list in the prose; and the asked entry changing no skill state. Rubric items include TD § 5.3's kinds and
  R-ONE-IDEA read as "one answer, ending on one choice" (TD § 17).
- **FR-062**: The six skills' sets MUST get cases for rules 1, 2, 5 and 6 and K5 (Eval plan), and re-run after
  each `SKILL.md` change (SC-007).

### Key Entities

- **Ask read**: spec 015's read for the asked layers and their sources (two shapes, read status). Defined there.
- **Asked result** (one per answer turn): `explanation`, `steps` (each: `text`, `skill` as a skill ID, not taught
  yet, or none for a look or playback step (FR-006; the data model's `"not_taught"` and `null`), `layer`), `offered_skills` (0 to 2 skill IDs; empty on B1), `closing_offer`, and
  `comp` (the name the first line uses). The panel draws from it; no prose is parsed.
- **Asked entry** (learner record, a new kind beside lessons): `kind: "asked"`, `date`, `project`, `comp`,
  `layers` (the steps' layers), `goal` (general terms), `skills` (IDs referenced), `after_learning` (IDs of
  those already learned), `went_deeper` (skill ID or null), `said` (optional, marked as the learner's words in
  general terms). Never `summary` text from a tool, never expression text. Field names are proposed; the plan's
  data model may rename them with a reason.
- **Hand-in** (K6): `layer`, `intent` (the learner's words, conversation only), `place` (if named), `goal`,
  `steps`, `step_index`. Passed to the lesson; not stored in the record.
- **Saved steps**: the latest answer's steps, kept for the session so turn 6 and the dock can name the next one.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **Sprint 5's measure.** 3 sessions on A, on 3 of the builder's own comps not set up for demos,
  each logged in a usage note with the question, the steps, whether they could be followed, and at least one
  go-deeper into a lesson. **Watch signal (`decisions/012`):** in at least 1 of the 3, the go-deeper happens
  without the builder forcing it; if none, revisit 012 and `decisions/002` before sprint 6. *Measured by:* the
  builder, in `discovery/usage-notes/`.
- **SC-002**: **Followable steps.** Across the sessions, at least **80%** of step lines are followed without
  the builder having to ask what to do, and **0** step lines are explanation only (FR-005). *Measured by:* the
  builder, per step line in the usage notes.
- **SC-003**: **Right layer.** The answer's first part names the layer that makes the motion, agreeing with a
  look in AE, in at least **9 of 10** answers across the sessions (spec 004 SC-002's bar), and in the Comp 1
  fixture case 3 of 3. *Measured by:* the builder against ground truth; the eval set.
- **SC-004**: **Speed on A.** First sign of the mentor working within **10 s** in at least **9 of 10** ask turns,
  over at least 10 turns, median reported (spec 013 SC-002). Any read past 15 s is logged; two or more in the
  sessions puts a Stop control back on the table (MU open question 7). *Measured by:* `panel/dev/turns.js`.
- **SC-005**: **Cost on A.** Median cost of an answer turn at most **$0.10**, and a go-deeper lesson's median at
  most **$0.40** (spec 013 SC-004). A first guess (OQ-5). *Measured by:* the turn log, over the sessions.
- **SC-006**: **Ask eval set.** On B1, at least **80%** of cases pass and **every** hard-rule check passes on
  the merge commit; TD § 17's first five (AB's held cases) pass **3 of 3**. Before sprint 5 closes, one full A
  run meets spec 013 FR-033 against that B1 baseline. *Measured by:* eval runs, logged in the set's README.
- **SC-007**: **The six skills hold.** After the shared-rule changes, each set still meets its own SC-006 on B1
  with every hard-rule check passing, and the new rule cases (Eval plan) pass 3 of 3; sets whose skill changed
  re-run on A before the first tester (`decisions/011`). *Measured by:* eval runs.
- **SC-008**: **Memory is honest.** In unit tests and in the builder's record after the sessions: **0** asked
  entries change a skill's status or review fields; **0** hold the learner's question verbatim, expression
  text or a personal detail; **0** entries (asked or lesson) state as the learner's a change no check
  attributed; AB 6's summary is refused (K5). *Measured by:* unit tests and a read of the record.
- **SC-009**: **Honesty.** **0** answers in the eval set and the sessions say "can't see" about something the read
  returned, call an unread precomp empty, call a matte hidden, or advise Undo for expression motion.
  *Measured by:* the set's deterministic checks; the builder in usage notes.
- **SC-010**: **Asking again is normal.** In TD § 17 situation 18 and every session answer about a learned
  skill, **0** uses of "you already learned", "remember when", "as we covered", "review" or fail language.
  *Measured by:* a deterministic check plus a rubric item; the builder.
- **SC-011**: **Panel states.** **100%** of MU's new and changed state ids have a panel test that drives them
  (spec 007 SC-003's bar); a malformed or missing asked result shows no STEPS, dock or Go deeper in 100% of
  tests; B1 shows **0** Go deeper controls. *Measured by:* panel tests.
- **SC-012**: **Fit.** At the default dock (about 343 pt) at the heights in spec 007 SC-010, in every new ask
  state, nothing scrolls sideways and no button, tag or the ask box is clipped. *Measured by:* the builder in AE
  (OQ-4 on 260 × 480).
- **SC-013**: **Hand-in.** On A, a go-deeper from an answer opens on the moving layer with no intent question in
  **3 of 3** tries across at least two skills, and hands back to the next step at the end in 3 of 3.
  *Measured by:* the sessions and the eval case for TD § 17 situation 16 on A.

## Eval plan (for the eval engineer; cases are theirs)

| Set | Situations | Notes |
|---|---|---|
| **Ask (new)** | TD § 17, all 19. AB held cases: 1 (parent named first), 4 (answer before a review), 5 (no keyframe skill for expression motion) are situations 1, 4, 5 | Comp 1 fixtures exist. Hard checks per FR-061. Situation 16 (hand-in) runs on A only |
| **Pivot** | AB held 1 via hand-in (K7: the null as focus); AB held 3 (padded PNG, rule 2); rule 1 on a child of an expression-driven parent | AB held 2 (Undo) is spec 015's |
| **Null** | Rule 1 (a group whose motion comes from a parent above it); routing: an existing control null is not this skill's | |
| **Easing, key types, speed graph, offset** | Rule 1 (parent or expression motion said in one sentence); rule 5 (review not the opening after a question); hand-in (K6) | Phase 3 |
| **Next** | K4: never a keyframe skill for keyless motion; FR-042's asked candidate | |
| **EE-4 (new rows)** | TD § 13 rows with no § 17 situation: expressions over keys, separated dimensions, single and hold keys, locked or Collapse | One case each in the ask set |

## Out of scope

- **Writing, fixing or suggesting expression edits**, effect recipes, or any code (TD § 15, H-2). A step may
  point at what the read sees, nothing more.
- **Answers outside the six** beyond FR-006's hint shape and FR-018's outside line: no general how-tos for
  other topics, no link lists, no general AE trivia.
- **Doing the steps**, in any form; the ask mode has no demonstration.
- **Checking the goal.** The ask mode reads and describes; only lessons check (TD § 7.4).
- **Whole-comp diagnosis** (spec 005, parked) and skill 4 (*Find what's moving it*): the answer tells the
  source, it doesn't teach tracing.
- **The reads themselves** (spec 015), including inside precomps.
- **Visible bounds of padded footage (Q6, K1's first half)** unless OQ-3 says otherwise; rule 2 covers it
  meanwhile.
- **Selected layers (Q9).**
- **Changing the review schedule from asked entries** (H-5: record now, schedule later).
- **The comp's name on the panel** or in the health check (TD § 19, MU open question 1). Since FR-047's
  withdrawal the health check carries nothing about the project.
- **A Stop control during a long read** (MU open question 7) and a growing follow-up bar.
- **The light theme's build** (MU › Accessibility notes it; spec 007's tokens only).
- **Go deeper on B1.**
- **Shipping to testers.** Spec 006 Q2 (testers' keys) is pinned and not pushed.

## Assumptions

- The three sessions run on AE 27.0 with the builder's own comps, one AE driver at a time; comps the builder
  uses are captured as fixtures only with no real names (constitution IV).
- The sessions' learner record is the builder's real one (rolled back after the baseline, AB 6).
- The hand-over on A uses the `Skill` tool in the same conversation (`decisions/011`, spec 013); B1's
  hand-over is unverified, which FR-017 makes moot.
- The record's existing practice rule (a non-review lesson on a learned skill keeps status and review date)
  is what FR-023 relies on; the plan confirms it with a test.
- 120 words, two to four steps, one offer per answer and one optional frame are the curriculum designer's
  guesses (TD § 18), tuned on the sessions, not gates.
- SC-005's $0.10 is a guess from the baseline ($0.37 for nine turns, $0.16 of it loading a skill) and A's
  lesson median ($0.22).
- The tab stays named **Home** (MU open question 6, recommended); renaming would change spec 007's tests.

## Open questions

### For the builder (each with a recommendation)

- **OQ-1 (answered 2026-11-14, as recommended; superseded 2026-11-16: FR-047 withdrawn after T001, and
  constitution 1.6.0 removed the 1.5.0 exception, so this no longer applies): How is the
  comp-active flag allowed (FR-047)?** Constitution II says the panel reads the project only
  through the mentor's tools. A yes or no carries no name, but it is still the panel learning something about
  the project. **Recommended: a constitution amendment (1.5.0, MINOR), proposed by the cockpit, that lets the
  panel read one thing from the bridge's health check, whether a comp is active, with no name or other
  detail.** The comp name stays out (TD § 19). If held, `ask-nocomp` ships alone and works today.
- **OQ-2: What the mentor remembers and Practice due move from Home to Skills?** `decisions/012` allows one quiet
  line; MU moved both (and open question 9 recommends moving memory). Spec 007 FR-050 and FR-051 put them on Home.
  **Recommended: move both to Skills**, Practice due as the top line with Warm up (`skills-due`). A lesson nudge
  at the door is the quiz feeling 012 removed.
- **OQ-3: Visible bounds for padded footage (K1's first half) in this spec?** Spec 015 left it out; TD § 8 says
  it can wait if rule 2 holds. **Recommended: out for now.** Rule 2 grades "didn't move" with the named place
  as given. Add it as a later story only if a session's pivot lands on padded art and the answer needed the
  art's edges.
- **OQ-4: Ask states at 260 × 480?** MU asks for both sizes, but spec 007 SC-010 was amended on 2026-11-09 to the
  default dock only. **Recommended: the default dock is the gate (SC-012); check `ask-answer`, `ask-steps-open`
  and `ask-deeper-lesson` at 260 × 480 once, logged, not a gate.**
- **OQ-5: Cost target per answer turn (SC-005)?** **Recommended: $0.10 median on A**, measured over the
  sessions; if it's over, look first at what loads per turn (the baseline spent $0.16 loading one skill)
  before changing the bar.
- **OQ-6 (new 2026-11-16 (b)): FR-007's order before spec 015 T064.** FR-007 orders steps by visible effect
  "when the read gives how much each source moves the layer". Until T064, sizes come in mixed units (a
  parent's 12 px Position and its 0.59° Rotation), which can't be compared without guessing. **Recommended:
  until T064, order by size only among sources in pixels, put degree and percent sources after them in the
  read's order, and keep 014's FR-007 test on Comp 1 waiting for T064 (as spec 015's tasks already say).**
  If no: the mentor would rank across units by feel, which TD § 5.1a was written to stop.

### For the curriculum designer (hand-off, not edits)

- **CD-1** (also spec 015's CD-1): once spec 015 phase 2 reads precomps, what does an answer say about what's
  inside, and does TD § 13's precomps row change?
- **CD-2 (answered 2026-11-14: TD § 16 rewritten as FR-016's four fields, hit sizes first, pivot step 3; it
  is now the one version the rubric, evals and `SKILL.md` take): TD § 16 is out of date with § 19.** The worked answer puts the pivot step first and closes "on step 1";
  § 19 "Checked 2026-11-14" says the Position hit sizes lead, and the design review's step shape ("Open … and
  look at …") replaced § 16's step 2. MU's revised Comp 1 answer has the new order. The eval rubric needs one
  version.
- **CD-3 (answered 2026-11-14: TD § 7.1 now says practice, never a review): TD § 7.1 says a learned skill
  "is offered as practice or review"**, while § 19 decides "practice, never
  a review". This spec follows § 19 (FR-023); please align § 7.1.
- **CD-4 (answered 2026-11-14, TD § 7.1: one plain sentence saying the lesson can't start from here and to open
  it from the Skills tab, naming the skill, never a command; nothing hands over, the steps stay):** on B1 the
  closing offer still names a skill but nothing hands over (FR-017). What should the mentor
  say to a yes on B1? Builder-only, so one plain sentence and the pending step is enough unless you want more.

### For the eval engineer (EE)

- Build `product/evals/ask/` per FR-061 and the Eval plan. Note FR-017: on B1 the offered-skills field is
  empty, so B1 runs judge the offer's wording and the step tags; the field itself is checked on the A run.

### Spec housekeeping (mine, after approval)

- Done 2026-11-14 (T007): FR-055's amendments are in `specs/007-ui-overhaul/spec.md` and T061's note in its
  `tasks.md`.
- Done 2026-11-16 (T005): T001 to T003 folded into research R4, R5, R10, R18 and data-model § 6; FR-047
  withdrawn and OQ-1 superseded (builder option A); data-model § 7 has the panel's thread-entry fields;
  `give_answer`'s not-taught normalization (contracts/ask-tools.md step 3a) is in FR-006 and data-model § 1.
- Open, not mine to edit here: spec 007 FR-006 still lists `home-nocomp`; MU's `home-nocomp` row and open
  question 10 are moot (a request for the ui-designer).
- Open, not mine to edit here (2026-11-16 (b)): MU's step 2 and rotation bullet still say "too small to see"
  (`README.md` and `index.html`); TD § 16 has the current wording (a request for the ui-designer).
