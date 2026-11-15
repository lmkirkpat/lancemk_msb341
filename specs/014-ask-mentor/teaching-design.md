# Teaching design: Ask the mentor (spec 014)

**Owner:** curriculum designer (`decisions/007`). The spec writer's `spec.md` in this folder links
here and doesn't copy it; gaps or contradictions come back as questions. The ui-designer's Ask entry
and screens (with spec 007 T061) follow from § 12; this file says what the learner should meet, not
how it's drawn.
**Date:** 2026-11-13. **Status:** draft for the builder's review. Number 014 assigned by the cockpit.
**Builds on:** `specs/004-ae-curriculum/curriculum.md` § 2 (the method, the opening rule, the turn
rule, "do it for me"), § 3 (where "what's moving it" lives), § 4 (the path), § 5 (reads R1 to R4 and
the motion-sources map), § 8 (overlaps); `.claude/skills/next-mentor/SKILL.md` (the hand-over);
`specs/011-anchor/teaching-design.md` § 4, § 6, § 9, § 13; `specs/005-diagnosis/teaching-design.md`
§ 6.3 (saying what wasn't read), § 7.3 (the hint shape), § 10.
**Evidence:** `discovery/usage-notes/ask-baseline.md` (session 1, 2026-11-13, `262b81a`; cited as
**AB** with its finding number), `sprints/sprint-5-plan.md`, `discovery/insights.md` beliefs 1, 7, 14,
15 and 16, `decisions/002`, `product/product-description.md`. Research:
`discovery/curriculum-research/expressions-basics.md`, `parenting-and-nulls.md`, `anchor-point.md`,
`effects-basics.md`. There's no brief on "answering open questions" as such; this is an interaction
design built on the skill briefs, so its claims about learners are mostly **R** (one builder session)
or **Guess**.

Tags: **A** Adobe, **B** established teaching, **C** one tutorial or thread, **P** practitioner, **R**
repo evidence, **Guess** a design call with no evidence (also listed in § 19).

---

## 1. The one idea, and why

**The idea, for the learner:** say what you want your comp to do, and get the few steps that get it
there *in this comp*: on the layer that actually makes the motion, in the order that works, with the
skill each step uses named so you can go deeper when you want to.

**The idea, for the mentor (the overhaul):** **read first, answer second, teach on request.** Today
every entry is a lesson, and a lesson's check decides what the lesson talks about. In the baseline
that turned a question into a pivot review on a layer that couldn't change the shake (AB 2, 3), a
check that coached toward an empty corner (AB 5), and a false "undo that" (AB 4). The fix isn't a
better pivot lesson. It's a second way in, where the learner's goal leads and the lessons are tools
the answer can reach for.

**Why a learner needs it:**
- **They learn what the project needs.** "I learn only the things that I need to complete a project"
  (008, Weak). Mid-project, people take the result over the lesson (belief 7, Low, 003, 005, 007).
  The builder, mid-project on their own logo: every reply pushing a lesson "would get annoying fast",
  and they'd have left "for YouTube or a chatbot after 3 to 4 turns" (AB, Said, builder only).
- **The cause is hidden in the comp.** The shake lived on a parent null as expressions, with no keys
  on the layer they asked about (AB ground truth). That's belief 1's "knowing what's wrong is the hard
  part" in its most ordinary form: the learner asked about the layer that *shows* the motion, not the
  one that *makes* it.
- **Generic help gets the setup wrong.** A YouTube answer to "make the shake organic" assumes the
  shake is keyframed on the rock. This comp's isn't (belief 16's cousin: right steps, wrong project).

**What Adobe's assistant can't do today (CLAUDE.md next step 2).** Adobe already answers when asked
(belief 10, `decisions/002`), so answering alone is not the edge. What still differs:
- **Depth.** The answer's steps can lead into a lesson whose check reads every pair, pivot and child
  on the learner's real layer (key types, ease, influence, comp-space footprints). Adobe's check left
  7 properties "unconfirmed" on 2026-10-08 because it can't read ease (R). The ask mode only keeps
  that edge if the lessons it hands to can check the layer it names (§ 7).
- **Memory and practice.** An answer is remembered as "asked about" for the skills it used (§ 11), so
  the mentor can bring that skill back as practice on the learner's next comp, and can notice a
  learned skill being asked about again (a sign it's fading, belief 2). Adobe described no memory of
  the learner.
- **Restraint** (the learner does the steps; the mentor never makes the change) is kept but not
  leaned on: it's a mode switch away for Adobe (`decisions/002`).

## 2. Outcome

After an answer, without more help, the learner can follow the steps to what they wanted on their own
comp, and can say which layer the change belongs on and why (where the motion comes from). When a
step uses one of the six skills, they know its name and can start its lesson on that layer.

Sprint 5's measure: 3 sessions on 3 of the builder's own comps, each with a question, steps they could
follow, and at least one go-deeper (sprint 5 "done").

## 3. What changes, in one paragraph

Two ways in, one mentor. **Ask** is new: a question about the learner's goal gets a read of the
layers it touches, then a short answer with steps, then the learner chooses. **Lessons** keep the
"I do, we do, you do" method unchanged, but can now start from an answer's context, and four shared
rules change in every skill (§ 10.1): trace the motion before teaching on a layer; the learner's named
spot outranks the check's geometry; a change the check can't attribute is never called the learner's;
and the record says only what a check saw or the learner said.

## 4. Where it sits

| | |
|---|---|
| **Prerequisites** | None. A comp open in AE. Setting keyframes is not needed to ask |
| **Relation to the path** | Not on the path; an entry into it, like diagnosis (spec 005 TD § 3). Steps name path skills; a go-deeper starts one |
| **Relation to `/next-mentor`** | Reuses its hand-over (step 6's table, prerequisite rule, review rule, "never say a command"). Doesn't call `recommend_next` to answer; the question decides the skill, not the path |
| **Relation to diagnosis (spec 005, parked)** | Diagnosis reads the **whole comp** and says what's off, unasked. Ask reads **only the layers the question touches** and their sources, and answers what was asked. It reuses diagnosis's honesty rules (§ 6.3 there: name what wasn't read; never call it fine) and its hint shape for steps no skill covers. It never lists findings the learner didn't ask about (§ 9) |
| **Relation to skill 4, *Find what's moving it* (not built)** | Ask *tells* the source. Skill 4 would *teach the learner to trace it*. Once skill 4 is built, an answer whose key fact was a hidden source offers it as the go-deeper (§ 7.1) |

## 5. The answer (Q1)

### 5.1 Shape

One turn, three parts, in this order. **About 120 words at most, list included** (Guess; tune on the
three sessions).

1. **What's making it happen now** (one or two sentences). From the read, on the layer that actually
   makes the motion, by name, with the source: own keys, a parent, an expression, an effect, inside a
   precomp. This is the sentence the baseline never said (AB 2). When the asked-about layer and the
   moving layer differ, it says both: "[asked layer] has no motion of its own; it rides on [parent],
   whose [properties] are driven by expressions."
   **What's going on can run longer than a sentence or two, as its own short list** when the cause has
   parts (each source of motion and how much it moves the layer, in order of visible effect, § 19
   "Checked 2026-11-14"). This is explanation, not steps: it's never numbered as steps or called
   "steps", and the panel never docks it as steps.
2. **The steps** (a numbered list, two to four lines). **A step is only something the learner does in
   AE**: it starts with an action (select, move, drag, change, play back) on a named layer or property,
   and the learner could follow it without asking what to do. "The rotation is too small to see" is
   explanation, not a step; "Raise Shake Control's rotation amounts, then play it back" is a step
   (builder, 2026-11-14: "when the user sees 'steps' they assume they're followable"). If nothing in
   the answer is actionable yet (only explanation, or one clarifying question), there are no steps and
   nothing is docked. Each line: what to do, on which layer, in AE's
   words for the learner's version, and, when one of the six teaches it, the skill's name in a short
   tag at the end ("*Set the pivot*"). The list is the one exception to the two-sentence turn rule, for
   the reason diagnosis's first answer has one: several steps with layers and places in prose run
   together (spec 005 TD § 13 H-1, approved 2026-11-09). If the goal needs more than four steps, give
   the first three and say there's more ("that gets the hit point right; the size of each hit is the
   next part").
3. **Handing it back** (one sentence). The learner chooses: try the steps, ask about one, or go deeper
   on a named skill. One sentence, ending on a question, naming at most two skills (§ 7.1).

No greeting, no "great question", no recap of their question, no list of what's fine. No frame by
default: a frame costs time and rarely helps an answer (diagnosis § 6.1). One `preview_frame` is
allowed when the answer's first sentence points at something that shows at one time (where the null
sits, a layer that's off-screen then). Guess.

### 5.2 Steps, or one clarifying question?

**Default: answer.** An answer with a stated assumption beats a question, because a question before
any help is the thing that made the baseline feel scripted (AB, the builder's words). Ask **one**
clarifying question instead of answering only when **both** hold:
- the read can't settle it (it isn't something the mentor can look up), **and**
- the two readings lead to **different first steps** (not just different taste).

Examples:
- "Make the rock shake from where the hammer hits": answer. The hit point is a place on the art; take
  their words, state it ("I'm taking 'where the hammer hits' as the rock's top-right edge").
- "Make it feel more natural", with a keyed move *and* an expression on different layers in the
  answer's reach: ask which one, naming both layers. The first step differs (ease keys vs. change the
  expression).
- "Fix the logo": ask what should look different. A goal with no motion word gives the read nothing
  to answer from.
- Layer ambiguity ("the rock" when there are rock.png and Rock Shadow): ask, naming up to three
  layers, unless one is clearly the moving one.

A clarifying question is one sentence, names the choices from the read, and carries nothing else. One
per question; after the reply, answer even if the reply is vague, stating the assumption.

### 5.3 Honest about what was read

Three kinds of claim, worded differently (Guess on wording; the rule is not a guess, AB 1, 4, 6):

| Kind | Said as | Example shape |
|---|---|---|
| **Read** (a tool returned it) | Plain statement | "[layer] is parented to [parent]." |
| **Inferred from the read** (the mentor's reasoning) | Marked: "so", "which means", "looks like" | "…so it turns around [parent]'s pivot, at the comp's center." |
| **Not read** | Named specifically, with what's missing | "I can't read the expression's text, so I can't tell whether moving [parent] keeps its shake." |

- **Never "I can't see that" when the ask read could look** (AB 1). The ask mode reads before it
  answers (§ 8); "can't see" is said only about what the reads don't reach, and names it.
- **Never call something unread fine**, empty or absent (diagnosis § 6.3's rule). "I couldn't see
  inside [precomp]", never "nothing inside [precomp]".
- **A step that depends on something unread says so in the step**, not in a footnote: "If [parent]'s
  Position expression builds on its own value, moving its pivot keeps the shake; I can't read that
  yet, so play it back after."
- **A guess about intent is stated as an assumption**, once, in the first part.

### 5.4 Leaving the learner in charge

- The answer ends on the learner's choice, never on a lesson starting. A lesson starts only on a yes
  (§ 7).
- **No push after a no.** If they say "just the steps" or ignore the offer, no further lesson offer in
  this thread until they ask, get stuck (§ 6, turn 4), or start a new question.
- **"Do it for me"** gets the curriculum § 2 decline, in one sentence ("I'll leave the changes to you,
  since making them yourself is what makes them stick"), then step 1 again in one sentence. The ask
  mode has **no demonstration of its own**; the one demo lives in the lesson, and "show me" is a yes
  to the go-deeper (§ 7.1).
- The steps are the learner's. The mentor never changes the project in ask mode.

## 6. Turn by turn

Curriculum § 2 asks every new skill to lay its turns out this way. The ask mode isn't a lesson, but
the same rule keeps its turns honest.

| Turn | The one thing | Carries | Ends on |
|---|---|---|---|
| 1. Ask | (the learner asks) | | |
| 1a. Clarify (only per § 5.2) | which one they mean | The choices, from the read | One question |
| 2. Answer | the steps | § 5.1's three parts | "Try them, or want to go deeper on [skill]?" (§ 7.1's line) |
| 3. A follow-up question ("why the null?", "where's Pan Behind?") | the answer to it | One or two sentences, then step N again in one sentence (curriculum § 2 rule 3) | The pending step |
| 4. "It didn't work" / "done" | what the read sees now | A fresh ask read of the same layers. What changed and what didn't, in the § 5.3 kinds. **Not a pass or fail:** ask mode has no check, only a read (§ 7.4). If the change landed somewhere else (wrong layer), say where, as a hint. Then the next step, or one offer to go deeper on the step that didn't land | The next step, or the offer |
| 5. Go deeper (on a yes) | the lesson | The hand-over (§ 7.2); from here the lesson's rules apply | The lesson's opening |
| 6. Back from a lesson | the next step | "That was step [n]; next is [step n+1]." in one sentence, from the ask's saved steps | The next step |
| 7. A new question | a new answer | Turn 2 again. Memory of this session's answer is context, not recited | |

**Turn 4's "what changed" is not a check.** It reads and describes, with the same honesty kinds. It
never says "pass", never "you did X" unless the change is in the read between two reads **at the same
time** on a property **not** driven by an expression (§ 10.1 rule 3), and never tells the learner to
undo something they may not have done (AB 4).

## 7. Going deeper (Q2)

### 7.1 When an answer offers a lesson

- **One offer per answer, in the handing-back sentence**, naming the skill(s) the steps tagged: one,
  or two at most ("want to go deeper on *Set the pivot* for step 1?"). Not one offer per step. Guess:
  the baseline shows too many offers lose people (AB 3, B-4); one per answer is the least that keeps
  the go-deeper findable. The panel may show a "go deeper" control per tagged skill; that's the
  ui-designer's, and it doesn't add words.
- **Offer only a lesson whose check can see the learner's real target** (§ 7.3). Never route to a
  lesson whose snapshot will find nothing there (AB 3: Easing proposed for keyless, expression-driven
  motion).
- **A learned skill is offered as practice or review** in `/next-mentor`'s words (its step 4), never
  as a first lesson. Asking about a learned skill is not a failed review and isn't recorded as one.
- **A missing hard prerequisite** follows `/next-mentor` step 4: named in one sentence, the asked
  lesson still runs if they want it (curriculum § 13 C1).
- **On B1**, a skill can't hand over (sprint 5 plan, step 4): stop at the offer, as diagnosis does
  (spec 005 TD § 7.1 c).

### 7.2 Starting the lesson from the learner's setup

The hand-over passes the answer's context to the lesson, so the lesson opens on their layer and their
words, not a practice-comp proposal:
- **the layer that makes the motion** (from the read), not the one they asked about if they differ;
- **the learner's intent in their words** ("turn from where the hammer hits"), plus any place the
  learner named;
- **the goal sentence**, so the lesson's last line can hand back to the ask's next step (§ 6, turn 6).

What the lesson does with it:
- **The opening's choice is already made.** The lesson skips its intent question and its proposal and
  opens like a continued lesson ("We're on [layer], [intent in their words]."), ending on the first
  step of its own sequence (anchor: A, then Shift+P). Curriculum § 2's opening rule still holds: one
  thing to do.
- **The lesson's own rules apply from there:** the one demonstration, hints not fixes, the check, the
  record. A demo needs a second layer (every skill's demo target rule); on a real comp the lesson
  proposes one from its ranking, or walks it through in words.
- **If the lesson's focus rule would refuse the layer** (today: the pivot skill refuses nulls; the
  null skill refuses already-parented layers), the ask doesn't offer that lesson until § 10's change
  lands for that case. It says what the lesson would teach and offers it on a layer the check can see,
  with one sentence on why ("I can't check a pivot on Shake Control yet; want to learn it on rock.png's
  shadow first, then do Shake Control yourself?"). Guess on whether a stand-in is wanted; see H-4.

### 7.3 When the lesson can't check the real target

Some answers point at things no lesson can grade yet: an expression's text, a parent whose motion is
all expression, a precomp's insides, padded footage before § 8's visible-bounds read exists. Then:
- **say it plainly in the offer:** "*Set the pivot* teaches this, but I can't check it on [layer]
  because [the read it's missing]";
- **offer the lesson with that part ungraded only if the rest is checkable** (e.g. "the children
  didn't move" is checkable even when "where the pivot is on the art" isn't): the learner's named spot
  is taken as given (§ 10.1 rule 2), and the record says so (§ 11);
- **otherwise, no lesson offer.** The steps stand on their own.

### 7.4 Why the ask mode doesn't check

A check needs a pass condition, and an open goal ("more organic") has none the mentor can grade.
Grading it would put taste in the checker's hands, which the curriculum refuses everywhere (offset's
taste rule, curriculum § 6 skill 3). The ask mode reads and describes; lessons check. Turn 4's fresh
read is description, never a verdict.

## 8. What the mentor must read before answering (Q3)

Reads the **teaching** needs; spec-writer and the builder decide the tools. The scope is **the layers
the question names plus their sources and links**, not the whole comp. That keeps the answer fast
(B-5, turns ≤ 10 s) and keeps it from turning into diagnosis.

| # | Read | Why the answer needs it | Today (snapshot, `motion-sources.mjs`) | Spec 005's plan | Gap |
|---|---|---|---|---|---|
| Q1 | **Layer basics:** kind (null, footage, shape, text, solid, precomp, adjustment), visibility class, switches, parent, children, in and out | Every answer's first sentence; "it's a null, it never renders" | Built (`layer_info`, spec 005 research R1) | Uses it | None |
| Q2 | **Motion sources, full chain:** own keys; own expressions **on any property, keyed or not**; each parent up the chain with *its* keys **and expressions** | AB 2: rock.png had no keys and a parent moved only by expressions | Own keys and parent chain built; expressions only on keyed properties; `moves_children` counts **keys only**, so an expression-driven parent reads as not moving its children | DX-08 uses the chain; a parent's transform expression is a "not checked" note (TD § 6.3). R2 is **not built and not in spec 005's scope** | **R2 (expressions on any property)** and `moves_children` counting transform expressions. **Needed** |
| Q3 | **Expression text, on or off, error, and whether it builds on its own value** (`value`) or sets its own | Whether moving a parent or its pivot keeps the motion (§ 5.3's example); "each hit uses the first hit's size" (AB ground truth); the most direct "what broke" signal (expressions brief) | Not read | Not read (standing not-checked item) | **R2's text and error. Needed.** "Builds on its value" can be a plain text test; mark it inferred (§ 5.3) |
| Q4 | **What links to a layer:** other properties whose expressions reference it (by name or index), including effect properties | AB 1: Sweep Control's Position drives a CC Light Sweep's Center on another layer. "What does this layer do?" can't be answered without it | Not read | Not planned | **New read.** A search of R2's texts for the layer's name; mark name-matches as inferred (an expression can build a name at run time) |
| Q5 | **Effects on a layer:** names, and which properties are keyed or expression-driven | Q4's links land on effect properties; "the shine is a CC Light Sweep" | `effect_count`; keyed effect properties only | Keyed effect properties as motion (plan › Overlaps) | **Effect names, unkeyed.** Recommended |
| Q6 | **Visible bounds of footage with alpha** (the art, not the image box) | AB 5: the pivot's nine spots on a padded PNG put the art's corner "between" and an empty corner "right" | Layer rectangle = source size | Not planned | **New read.** Recommended for answers ("the rock's top-right edge sits inside the image's box"); **needed** for the pivot check (§ 10.2 K1) |
| Q7 | **Values at one time, after expressions** (rendered), and the comp's current time | Any "what changed" (turn 4) must compare at one time and leave out expression-driven values (AB 4) | Comp `time` read; samples at key times and the playhead | Not needed by diagnosis | **Needed for turn 4 and every check** (anchor TD § 10 already recommended "rendered values" and "at a given time") |
| Q8 | **Inside precomps** (R4) | "Why doesn't U show anything on Icon?" | Not read | Not read (named as not checked) | Not needed for v1; say "I couldn't see inside [precomp]" |
| Q9 | **Which layers are selected** (optional) | "This layer" and "the selected one" without a clarifying question | Not read in lessons | Not planned | Nice to have; a clarifying question covers it |

**What spec 005's reads give the ask mode:** Q1 fully; Q2's parent chain (keys only); its honesty
rules and not-checked wording. **What they don't:** R2 (Q2's expressions, Q3), the link search (Q4),
unkeyed effects (Q5), visible bounds (Q6). These are the reads the baseline's findings 1, 2 and 5 turn
on, so **the ask mode isn't worth shipping without R2 and Q4**: without them it would answer Comp 1's
two questions as wrongly as the baseline did, only more politely. Q6 can wait if the pivot check takes
the learner's named spot (§ 10.1 rule 2).

## 9. Scope (Q4)

Three bands, decided per **step**, not per question:

| Band | What it is | What the answer does |
|---|---|---|
| **Inside** | A step one of the six skills teaches (easing, key types, speed graph, offset, pivot, null) | The step, tagged with the skill; the go-deeper offer (§ 7) |
| **Describing the comp** | What a layer is, what moves it, what links to it, what's hidden or not read | **Always in scope**, whatever the skill: it's a read, and every step depends on it. This is skill 4's idea, told rather than taught (§ 4) |
| **Next to the six** | A step outside the six that the read can see (an expression's text, an effect's setting, a comp setting) | Say what the read shows and where it is, in one step line, in diagnosis's hint shape (spec 005 TD § 7.3): where to look and what's there, plus "not something I teach yet". The learner decides. **No code written or rewritten**, no new expression, no effect recipe. Pointing at a token the read saw ("uses the first hit's size for every hit") is a read fact, not code; whether to say which token to change is H-2 |
| **Outside** | Nothing in the comp to read, and no skill: color, render and export, audio, 3D and cameras, typography choice, other apps, general AE trivia | One sentence: it's outside what the mentor covers, and what it does cover in one clause. No answer from general knowledge, no link list |

Rules that keep it from becoming a general chatbot:
- **Every answer is about this comp.** A question with nothing in the comp to read ("what's the best
  wiggle frequency?") gets the "outside" line, or a pointer to the layer it might mean. Guess: the
  builder may want general how-tos inside the six skills answered even without a comp target (H-3).
- **A goal partly outside** (AB's shake: the pivot part is inside; the even hits part is an
  expression) gets both bands in one list: the inside steps tagged, the outside step as a "where to
  look" line. The answer never drops the outside part to stay neat (that's AB 3: "make it natural" got
  a lesson that didn't apply).
- **Taste stays the learner's.** No "make it better" verdicts; steps toward what they said.
- **No whole-comp findings.** The answer never adds "also, your Title is linear". That's diagnosis
  (parked). One exception: a fact about the **asked layers** that will stop a step from working (a
  lock, an eye off, a Collapse switch) goes in that step.

## 10. What the six skills change to fit (Q5)

### 10.1 Shared teaching rules (every `SKILL.md`; teaching rules unless marked)

1. **Trace before teaching on a layer.** Before a lesson teaches on its focus, it checks where the
   focus's motion comes from (own keys, own expression, a parent's keys or expressions). If the
   motion the learner cares about comes from somewhere else, the lesson says so in one sentence and
   teaches on the layer that makes it, or says it can't change that motion here. **Replaces** the
   pivot skill's parent note ("that doesn't change where its own pivot goes") wherever the parent
   carries Rotation or Scale motion: that sentence is true and beside the point (AB 2). Needs Q2
   (tool: K3).
2. **The learner's intent outranks the check's geometry. Never coach toward the checker.** When the
   learner names a place the check can't place (a spot on the art, off the nine-spot grid, on padded
   footage), the mentor says what it can check ("I can check that Door didn't move, but not that the
   pivot is on the rock's corner, since I read the image's box, not the rock") and grades only that.
   It **never** asks the learner to put something somewhere they said is wrong so the check passes,
   not even with "then nudge it back" (AB 5). Teaching rule now; the tool change K1 makes it rarer.
3. **A change the check can't attribute is never the learner's.** "You changed X" and "Edit > Undo
   until it's back" only when two reads **at the same time** differ on a property **not** driven by an
   expression. Otherwise: "[layer] looks different from my last read; that may be its expression
   moving it" or nothing. Edit > Undo is never advised for a change the learner didn't say they made
   and the check can't attribute (AB 4: following it would have undone real work). Tool: K2.
4. **The record says only what a check saw or the learner said** (§ 11). Teaching rule, with a guard
   (K5).
5. **A due review never opens a session the learner started with a question** (§ 12). It may be one
   clause after an answer, at most once per session, only when the review's skill fits the comp.
6. **Hand-in from an answer** (§ 7.2): when a lesson starts from an answer's context, it skips its
   intent question and proposal, opens on the given layer, and its last line hands back to the ask's
   next step.

### 10.2 Tool changes (for the builder; the teaching needs, not the design of the tools)

| ID | Change | Skills | From |
|---|---|---|---|
| K1 | Place the nine spots on the **visible art** for footage with alpha (Q6), and accept a learner-named spot on the art: grade "pivot moved, layer didn't move" and record the place as the learner's | Pivot (also null placement in skill 6) | AB 5 |
| K2 | Every "other layers moved" comparison compares **at one time** and **leaves out expression-driven properties**; a change between reads at different times is not a learner change | Pivot (`anchor-check.mjs` item 5), and any skill with an "other changes" list | AB 4 |
| K3 | `moves_children` (and every skill's snapshot) counts **transform expressions** on parents; each snapshot reports when the focus's motion comes from a parent or an expression | All six; pivot and null first | AB 2 |
| K4 | `recommend_next` and the ask's offer never propose a keyframe skill (easing, key types, speed graph, offset) for motion that has no keys | Next, Ask | AB 3 |
| K5 | `record_lesson` rejects a summary that attributes a change the session's checks didn't attribute (extends today's `RECORD_MISMATCH`, which checks results against the session) | All six | AB 6 |
| K6 | Each skill's snapshot accepts a hand-in focus (layer, the learner's words, the goal) and opens as a continued lesson | All six | § 7.2 |
| K7 | Pivot: a **null with children** can be a focus when the ask names it as the parent carrying the motion. Its check is the children's comp-space footprints (they didn't move), since a null has none of its own | Pivot | AB ground truth (the fix is Shake Control's pivot) |

### 10.3 Per skill

| Skill | What changes | Rule or tool |
|---|---|---|
| Easing | Not offered for keyless motion (K4). If the focus's parent carries motion by expression, one sentence that easing this layer's keys won't change that part | Tool K4; rule 1 |
| Key types | Same as easing for parent and expression motion. No geometry check, so rule 2 doesn't touch it | Rule 1 |
| Speed graph | Same; "shape the landing" on a layer whose landing is its parent's is said, not taught | Rule 1 |
| Offset | Already names a child's parent motion without grading it (curriculum § 8); add expression-driven parents (K3) | K3 |
| **Set the pivot** | The most changed. Trace first (rule 1) and teach on the parent when it turns the layer (K7); nine spots on visible art and the learner's named spot (rule 2, K1); same-time, expression-aware "other layers" (rule 3, K2); the parent note in step 2 rewritten | Rules 1 to 3; K1, K2, K3, K7 |
| Move a group with a null | Today refuses already-parented layers. An ask about an *existing* control null ("move Shake Control to the hit point without the letters jumping") is the pivot skill with K7, not this one; this skill keeps teaching how to make the link. Its "no jump" check gets K2's same-time rule | K2; routing note for spec-writer |

## 11. Memory (Q6)

**What the record keeps when the learner got an answer, not a lesson** (an "asked" entry; the
spec-writer names the fields):
- **the comp** and **the layers the steps were on** (as lesson entries keep `attempted`);
- **the goal, in general motion terms**, never quoting the learner ("turn a shake from a point on the
  art", not their sentence, which may hold names or client details);
- **which skills the steps referenced**, and **whether a go-deeper started** (and which);
- **what the learner said back**, marked as said ("said the steps worked"), only when they said it.

**What it never keeps:** a verdict on the goal (ask mode has no check, § 7.4); method or motive; what
a tool inferred, stated as what the learner did.

**What an answer changes, and doesn't:**
- It **never changes a skill's status.** Not learned, not practicing, not a review passed or failed.
- A skill referenced in an answer, not yet learned, becomes a **candidate the next "what's next"
  can raise on the learner's own work** ("last week you asked about turning a shake from the hit
  point; *Set the pivot* is the lesson behind that"). Guess on whether that's welcome; it's the
  memory edge (§ 1).
- A **learned** skill the learner asks about again is noted as "asked about after learning". The
  spec-writer can use it to pull that skill's review forward (belief 2: skills fade without use).
  Guess; H-5.
- **Asking again is normal, and the mentor treats it that way** (builder, 2026-11-14, H-5). Each comp
  is different, and the link between a new comp and a skill learned on another one often isn't
  obvious, so asking about a learned skill will be frequent. The mentor answers it as helpfully as a
  first question and is reaffirming: it never makes the learner feel forgetful or behind. It doesn't
  say "you already learned this", "remember when", or "as we covered", and it doesn't turn the
  answer into a review or a quiz. Bringing up the earlier lesson is fine only as a bridge that credits
  the learner ("this is the same pivot move you did on Door, just on the null"). The "asked about after
  learning" note is for scheduling, never for something the mentor says about the learner.

**The rule that holds for every entry, lesson or answer:** **the record never states something only a
tool guessed.** Every sentence is one of: a check's result, an attribution the check made under
§ 10.1 rule 3, or something the learner said (marked as said). A review passed only because the
learner matched the check's spot after saying it was wrong doesn't count as passed; with rule 2 in
place it shouldn't happen, and if it does the entry is `partial` with "place set to pass the check"
(AB 6: the record kept "moved a parent's pivot by mistake; undid that", which never happened).

## 12. The opening (Q7): a teaching recommendation

**Recommendation: ask-first when the learner opens the panel; lesson-first stays one tap away.**
The cockpit writes the decision record; the ui-designer draws it.

- **What the learner meets:** a place to ask about their comp, with the open comp's name. Under it,
  **one quiet line** of lead from the record: the lesson in progress if there is one ("Pick up *Easing*
  on Title"), otherwise "Find my next lesson". A due review is **not** the opening; it's a line in
  Skills, or one clause after an answer (§ 10.1 rule 5).
- **Why ask-first:** the baseline's first turn was a review offer to someone mid-project, and it felt
  like a quiz (AB 7). Belief 7 (Low) and 008's "learn only what I need" point the same way, and the
  sprint goal is a companion for real work.
- **What it costs:** "it takes the lead" is one of the product's three differences (`decisions/002`,
  product description step 6). Ask-first gives up leading **at the door**. The design moves the lead
  to **the follow-through**: the answer names the skill behind each step, offers one go-deeper, and
  memory brings it back on the next comp (§ 11). That's leading by what the learner just needed, not by
  the path. **This is the call I'm least sure of** (H-1): if three sessions show the builder never
  goes deeper, the lead has been lost, not moved.
- **Rejected:** *lesson-first with an Ask button* (the baseline's shape, plus a button: the quiz
  feeling stays the first thing seen). *Detecting "mid-project" and switching* (the read can't tell a
  learner's project from a practice comp reliably, and a guess that flips the opening would feel
  random). *A chooser ("Ask or learn?")*: a menu before any help, which is the scripted feeling in
  another form.

## 13. Where AE concepts overlap (ask mode)

What the read must see, what the answer says, and what it must never do. Lessons keep their own
overlap tables; this is for answers and turn 4's fresh read.

| Overlap | What the read must see | What the answer says | Never |
|---|---|---|---|
| **Expressions over keys** | Keys and an enabled expression on one property (built for keyed properties); the text, to tell "builds on value" from "sets its own" (Q3) | "[property] has keys and an expression; [whether it builds on them, if read, or that it can't tell]" | "the keys do nothing" or "the expression overrides them" without the text (diagnosis § 4 DX-06); steps that edit those keys as if they drive it |
| **Expression-only motion** (no keys) | Expressions on unkeyed properties (R2, Q2) | The source by name; that a keyframe skill doesn't apply here | Propose easing, key types, speed graph or offset (K4, AB 3); "it doesn't move" from keys alone |
| **Parents** (keys or expressions) | The full chain with each parent's motion (Q2, K3); children of the asked layer | "[layer] rides on [parent]; [parent]'s [properties] move it", and which layer a step belongs on | Teach on the child when the parent makes the motion (AB 2); call a parent's motion "doesn't change" the asked thing without checking |
| **Separated dimensions** | X and Y Position as two properties, each with its own keys or expression | "Position" as one move; "X Position" when only X moves | Steps that name "Position" keys when only X Position has them; an expression on Position when the dimensions are separate |
| **Effects** | Effect names (Q5); keyed or expression-driven effect properties; links into them (Q4) | "[layer]'s [effect]'s [property] follows [other layer]'s Position" | Effects as "not something I can see" when the read has them (AB 1); recipes for effects outside the six |
| **What links to a layer** | Expressions elsewhere that reference it (Q4), marked inferred on a name match | "[control layer]'s Position drives [effect] on [layer]" | "I can't see inside that layer" for a null or control layer (AB 1); "nothing uses it" when the search didn't run |
| **Precomps** | Precomp layer, not read inside (R4) | "I couldn't see inside [precomp]" in any answer that touches it | "nothing inside", "it isn't animated" |
| **Hidden layers** | Visibility class: hidden by the learner, matte (eye off by design), guide, shy, solo elsewhere, null | Hidden: named with why, if the question touches it. A matte is never "hidden". A null "never renders but moves its children" | Skip a hidden null that carries children; call a matte hidden; call a shy layer missing |
| **Padded footage** | Visible bounds vs. the image box (Q6) | Places on the art in the learner's words; "the image's box is bigger than the [art]" when it matters to a step | Name places by the image box ("the image's corner") when the learner means the art (AB 5) |
| **Single and hold keys** | One key (a set value, not a move); hold pairs (jumps) | A hold as a jump; a single key as "set, not animated" | A single key as a move; easing steps for a hold the learner meant |
| **Motion between reads** | Two reads at the same time, expression-driven values left out (Q7, K2) | "looks different from my last read; that may be its expression" | "You moved it", "Edit > Undo until it's back" (AB 4) |
| **Locked, 3D, Collapse Transformations** | Switches (built: locked, 3D; Collapse is anchor TD's open B-3) | In the step that it blocks ("unlock rock.png first") | Steps that can't work on that layer, unsaid |

## 14. Mistakes beginners make here, and what the mentor does

| Mistake | What it looks like | What the mentor does | Evidence |
|---|---|---|---|
| **Asking about the layer that shows the motion, not the one that makes it** | "Make the rock shake from the hit" on a child of a shaking null | The answer's first part names the source layer; steps go there | R (AB, builder only) |
| **Changing the right idea on the wrong layer** | Moves the child's pivot; nothing changes (AB f: "it didn't change how it looks at all") | Turn 4: the fresh read says what changed and why it can't show; points at the source layer | R (AB) |
| **Expecting keyframe tools to change expression motion** | Eases keys under an expression, or looks for keys that aren't there (U shows nothing) | Says which properties an expression drives; never offers a keyframe step there | C (expressions brief, staff-answered thread); R (AB 3) |

## 15. Teaching scope (not taught here)

- **Any skill's idea.** The answer names the skill and gives the step; the lesson teaches it
  (curriculum § 2 rule 2).
- **Writing or fixing expressions** (deferred 13, *Motion from code*). The answer can point at what the
  read sees in one (§ 9).
- **Tracing a source yourself** (skill 4, not built). The answer tells; skill 4 will teach.
- **Whole-comp diagnosis** (spec 005, parked).
- **Effects, color, render, 3D, audio, other apps** (curriculum § 11).
- **Doing the steps** for the learner, in any form.

## 16. A worked answer (for the rubric and evals only; not for `SKILL.md`)

Written from AB's ground truth, assuming Q2 to Q4 exist. The model copies example sentences word for
word (pacing re-baselines, main lesson), so `SKILL.md` takes § 5's shape and § 5.3's kinds, never this
text.

> rock.png has no motion of its own: it rides on Shake Control, a null whose Position and Rotation are
> expressions, so the shake turns around Shake Control's pivot at the comp's center, not the rock.
>
> 1. Move Shake Control's pivot to where the hammer hits, without the rock or letters moving. *Set the
>    pivot*
> 2. Its Position expression uses the first hit's size and decay for all three hits (`amps[1]`,
>    `decays[1]`), which is part of why it feels mechanical; Rotation uses each hit's own. That's an
>    expression, which I don't teach yet.
> 3. Play it back and check the rock now rocks from the hit.
>
> Want to go deeper on step 1 with *Set the pivot*, on Shake Control?

What a judge should see: the source layer named first; read facts plain, the inference marked ("so");
three steps, one tagged, one marked outside; no Easing; one offer at the end, naming one skill, on the
null; no review; no "great question". Whether step 2 may quote the tokens is H-2.

## 17. Situations an eval set should cover (for the eval engineer, after the spec)

Grouped; each needs a fixture shaped like the real case. The first five are AB's held cases.

1. A child with no keys, parent null moved by Position and Rotation expressions; "shake from the hit
   point" (AB's case). Names the parent and its expressions first; step on the parent; no Easing.
2. Same, playhead moved since the last read; "done". No "Undo" about the parent; no "you moved".
3. Padded PNG; learner names a spot on the art. The pivot lesson never asks for a spot off the art;
   passes on "didn't move" with the place taken as given.
4. A review is due; the learner's first message is a question. Answer first; no lesson or review offer
   before the answer.
5. "Make the shake natural" on all-expression motion. No keyframe skill proposed.
6. "What does [control null] do?" where its Position drives an effect on another layer. Describes the
   link; never "I can't see that".
7. A question fully inside one skill on a keyed layer ("make Title land softer"). Steps plus one offer
   of *Shape the ease in the speed graph*; no lesson starts without a yes.
8. "Just the steps" after an answer. No further offer until asked.
9. "Do it for me". The decline in one sentence and step 1 again; no project change.
10. A question fully outside (render settings, color). The outside line; no general answer.
11. A partly outside question. Inside steps tagged; outside part as a "where to look" line; nothing
    dropped.
12. Ambiguous layer ("the rock" with two rock layers). One clarifying question naming them; then an
    answer.
13. A vague goal with two first steps (keys on one layer, an expression on another). One question;
    then an answer with the assumption stated.
14. A precomp in the answer's reach. "I couldn't see inside [precomp]"; never "nothing inside".
15. A matte with its eye off in the answer's reach. Never "hidden".
16. Go-deeper hand-over (on A). The lesson opens on the given layer, skips its intent question, and
    hands back to the next step at the end.
17. Record after an answer: no status change; goal in general terms; nothing tool-inferred as the
    learner's action.
18. A learned skill asked about. Offered as practice or review, never a first lesson.
19. Turn 4 "it didn't work" where the change landed on the wrong layer. Says where it landed, as a
    hint; no pass or fail words.

Rubric reading for the answer (intent only): R-ONE-IDEA reads "one answer, ending on one choice", with
the step list allowed; length about 120 words; every claim in one of § 5.3's kinds.

## 18. Evidence and guesses

- **R:** AB findings 1 to 7 and ground truth (one builder session, one comp, the first comp not built
  for the mentor). Every design rule in § 10.1 traces to one finding.
- **R, older:** curriculum § 2's turn rule and the pacing lesson (examples get copied); diagnosis's
  list exception and honesty rules (approved 2026-11-09); the 2026-10-08 Adobe side-by-side.
- **Weak / Low:** belief 7 (mid-project, take the result), 008's "learn only what the project needs".
- **C:** expressions over keys confuse beginners (expressions brief).
- **Guess:** 120 words and two to four steps; one offer per answer; ask-first giving up the lead at
  the door but keeping it in the follow-through; "asked about" pulling a review forward; a stand-in
  layer for a lesson that can't check the real target; one optional frame.

## 19. Open questions

### For the builder (H), each with a recommendation

**Decided 2026-11-14: all six as recommended.**
- **H-1:** yes, ask-first (`decisions/012`).
- **H-2:** start with the recommendation, and add more detail if testing shows it's needed.
- **H-5:** plus the builder's rule in § 11: asking again is normal, and the mentor is helpful and
  reaffirming, never making the learner feel forgetful.

**Decided 2026-11-14, from the mockup review** (`product/mockups/ask-mentor/`):
- **Steps are only actionable things the learner does** (§ 5.1, part 2). An explanation broken into
  parts stays, as good information design, but it's never labeled or docked as steps.
- **Steps dock under the chat**, folded behind a disclosure, and never get ticks (ask mode has no
  check).
- **A "STEPS" label sits between the explanation and the numbered list** in the answer itself (mockup
  comments, 2026-11-14). The panel draws it from the step data, not from the mentor's words, so it
  appears only when there are steps, and `SKILL.md` never writes "Steps:" itself.
- **The comp's name:** the ask card says "Ask about the open comp" for now. Adding the comp name to
  the bridge's health check (constitution II) waits until the sessions show the panel feels anonymous.
- **Panel data:** the "asked" result carries the offered skills (two at most) and the step lines as
  data, so the panel never parses the mentor's prose. A requirement for the spec writer.

1. **Ask-first, with the lead moved to the follow-through (§ 12).** **Recommended: yes**, and watch
   the three sessions for go-deepers. If none of the three goes deeper without the builder forcing it,
   revisit: the product may be drifting toward Adobe's "answer when asked".
2. **May an "outside the six" step say what to change, at the token level?** (§ 16 step 2: "uses the
   first hit's size for all three hits" vs. adding "use each hit's own instead"). **Recommended: name
   what the read sees and what it does to the motion, not the edit.** It's still useful (the learner
   can find it), it stays a read fact, and it keeps the mentor out of writing expressions, where
   Adobe's edge is biggest (curriculum § 7).
3. **General how-tos inside the six with no comp target** ("how does the speed graph work?").
   **Recommended: answer in two sentences and offer the lesson**, since the skill is ours; still no
   answers outside the six.
4. **A lesson that can't check the real target: offer a stand-in layer, or no lesson?** (§ 7.2, § 7.3)
   **Recommended: offer the lesson on the real layer with the uncheckable part ungraded when K7 or K1
   covers the rest; a stand-in only when nothing on the real layer is checkable.** A stand-in is the
   practice-comp feeling the sprint is trying to leave.
5. **Should "asked about a learned skill" pull its review forward?** (§ 11) **Recommended: record it
   now, decide the schedule later**; it's cheap to keep and there's no evidence yet on spacing.
6. **Is R2 plus the link search (Q2 to Q4) in sprint 5's build?** **Recommended: yes, as the first
   build task.** Without them the ask mode repeats findings 1 and 2. If it doesn't fit, the ask mode
   ships with "I can't read expressions yet" said plainly wherever one is in reach, and the three
   sessions should avoid expression-driven comps, which defeats the point of using real comps.

### For the spec writer (SW)

1. Field names and success criteria for the "asked" record entry (§ 11), and how K5's guard is
   measured.
2. Routing: an existing control null's pivot goes to *Set the pivot* (K7), not *Move a group with a
   null* (§ 10.3). An FR for each skill's hand-in (K6).
3. B-5's ≤ 10 s applies to the ask read too; § 8 scopes the read to the asked layers and their sources
   so it can.

### For the skill-builder (SB)

1. The tools Q2 to Q7 and K1 to K7 don't exist yet; they're listed as needs, not designs.
2. **Claim to verify live:** Pan Behind on a null whose Position is an expression that builds on
   `value` keeps the children still and moves the rotation center; on one that sets its own value it
   doesn't. § 16's step 1 depends on it.
3. **Claim to verify:** `sourceRectAtTime` on footage returns the full frame, not the alpha bounds (my
   understanding), so Q6 needs the frame's alpha, not that call.

**Checked 2026-11-14** (cockpit, read-only script on Comp 1; `discovery/usage-notes/ask-baseline.md` ›
Follow-up):
- **SB-3 confirmed:** `sourceRectAtTime` returns the full image box on padded footage.
- **SB-2 confirmed by reading the expression, not by hand:** Shake Control's Position expression ends
  in `value + offset`.
- **New rule for § 5 and § 16:** read how much each source moves the layer before naming a fix, and
  put steps in order of visible effect. On Comp 1 the rotation (≤ 0.75°, gone in about 1/3 s) moves the
  rock's far end about 12 px from a corner pivot, no more than the Position shake. The builder couldn't
  see the pivot change by hand, so § 16's step 1 (move the null's pivot) is right in principle but
  nearly invisible, and the Position hits' sizes (the `amps[1]` bug) should lead.

### For the eval engineer (EE)

1. § 17's situations; the first five are AB's held cases.
2. § 5.3's kinds as a rubric item ("every claim is read, inferred and marked, or named as not read"),
   plus deterministic checks for "I can't see" when the read had the layer, and for "Undo" about an
   expression-driven layer.

### Needs a look at the live host app (not driven by me)

- Comp 1 (the baseline comp) as a fixture: the cockpit or builder captures it, since this design's
  worked answer and eval situations 1, 2 and 6 are built on it.
