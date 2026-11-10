# Teaching design: Diagnosis ("what's wrong here?")

**Owner:** curriculum designer (`decisions/007`). The spec writer's [spec.md](spec.md) links here and
doesn't copy it; gaps or contradictions come back as questions. The skill-builder's
`mentor/curriculum/diagnosis.json` mirrors § 4's anchors ([contracts/catalogue.md](contracts/catalogue.md)),
and `.claude/skills/diagnose-mentor/SKILL.md` takes its wording from the Pass lines here.
**Date:** 2026-11-09. **Status:** approved 2026-11-09 by the builder (§ 13 H-1 to H-3 as recommended; SW and SB items sent to the spec writer) (tasks T001). Spec question 4 answered yes;
this file is the answer.
**Builds on:** spec 005 as amended 2026-11-09 (Amendment, Resolved questions), [plan.md](plan.md),
[research.md](research.md) R3 to R11, [data-model.md](data-model.md),
[contracts/diagnosis-tools.md](contracts/diagnosis-tools.md); `specs/004-ae-curriculum/curriculum.md`
§ 2 (the opening rule, the turn rule, "do it for me"), § 3 (where "what's moving it" lives), § 10 (the
findings map); `specs/012-null-parenting/teaching-design.md` § 4, § 8, § 9 (for DX-08).
**Evidence:** `discovery/diagnosis-evidence.md`, `discovery/usage-notes/adobe-assistant-2026-10-08.md`,
`discovery/usage-notes/pacing-rebaselines.md` (the wording rules), interview 007.

Tags: **A** Adobe, **B** established teaching, **C** one tutorial or thread, **P** practitioner, **R**
repo evidence, **Guess** a design call with no evidence (also listed in § 13).

---

## 1. The one idea, and why

**The idea:** when a comp looks off and you can't say why, the cause is usually one of a few things
you can name by layer, property and time. Start with one, change it yourself, and look again.

Diagnosis isn't a skill lesson. It teaches no technique of its own and has no demonstration
(FR-011). What it teaches is a habit: **look at the whole comp, pick one place, change it with your
own hands, check it.** Each finding then leads into the lesson that teaches its fix, or into hints
where no lesson exists yet.

**Why a learner needs it:** the hidden-cause job. "it maybe took more time to find the error than to
find a video that would help" (007, Did, R). It's thinly evidenced (about 2.25 points, Low, one After
Effects source; `diagnosis-evidence.md` › 2), and SC-009's hidden-fault session is the test. A
learner who knows the symptom already gets help from a chatbot and a screenshot (003, 004, 006), so
this design is for the one who doesn't.

**What Adobe's assistant can't do today, said plainly.** Diagnosis closes a gap; it doesn't open a
lead. On 2026-10-08 Adobe read the whole comp and named 8 causes (R). What would still differ:

- **Depth inside the diagnosis.** Adobe "can read keyframe times and values but not their easing
  type" and guessed at the biggest cause ("if those keys are linear, that's likely the biggest cause
  on its own"). Knack reads every pair's ease, so DX-01 is a reading, not a guess, and DX-04 compares
  the real ease speeds either side of a key. That's why DX-01 ranks first (§ 5). It's a real edge
  today and a small one for Adobe to close.
- **Memory across sessions** (US3). What was found on this comp is re-checked next time, and a kind
  that keeps coming back on different comps is named as a pattern. Adobe described no memory of the
  learner.
- **Practice.** A finding leads into the lesson that teaches its fix, or a review if it's already
  learned, on the finding's own layer. Adobe offered "do all of it" and then did more than was asked.

Restraint (no fixing, "fix all" declined) is kept, but it's a product choice Adobe could copy with a
mode switch (`decisions/002`). Don't lean on it in the "why".

## 2. Outcome

After a diagnosis, without help, the learner can say what makes their comp look off in the comp's
own terms (which layer, what it does to the motion, when), choose one place to start, change it with
their own hands, and see from a fresh read whether it's gone. Measured by SC-007 (three sessions, a
finding resolved by the builder's own hands each time, the re-check agreeing with After Effects).

## 3. Prerequisites and where it sits

| Kind | What | If it's missing |
|---|---|---|
| Hard | Setting keyframes (the on-ramp, curriculum § 4) | Nothing to diagnose: a comp with no keys gives the clean answer (§ 6.4) and `recommend_next` |
| Soft | None | Diagnosis can run before any lesson. It pulls a skill forward when the comp needs it (curriculum § 1, 008: "I learn only the things that I need to complete a project") |

**On the path:** diagnosis isn't on the path; it's an entry into it. Its findings hand over to the
path's skills through `path.json › findings` (FR-010). What comes after a diagnosis is the lesson
for the chosen finding, or, when the comp is clean, `recommend_next`.

## 4. Catalogue

One entry per DX kind. **These anchors are the catalogue's wording keys** (contracts/catalogue.md
rule 3), and `mentor/test/diagnosis-catalogue.test.mjs` checks each key the catalogue names is here.

**Format, for the test and the skill-builder.** Every anchor in this file appears exactly once, as
an empty HTML `a` element whose `id` is the key (no other text in this file uses that markup). Each
`dx-` anchor starts a list item in this section and is followed by a bold
label and a colon; its wording is the rest of that line. Only anchors starting `dx-` are catalogue
keys. The other anchors (§ 5 to § 9, some inside table cells) are for `SKILL.md` and the evals.

**Slots.** Words in square brackets are filled from the tool's result and are never said with the
brackets: [layer], [layers], [property], [properties], [time], [start], [end], [duration],
[speed before], [speed after], [values], [last change], [comp length], [gap], [parent], [children],
and [first] or [second] (the finding's place in the list). How to fill them:

- Layer and property names exactly as the result gives them (`Title`, `X Position`, `Trim Paths End`),
  never a path with dots or underscores.
- Up to three layers by name ("Title, Subtitle and Bar"); more than three: the first two "and 3 more
  layers".
- Times in seconds as the comp shows them ("0.6 s", "1.5 s"); spans as "from 0.5 to 1.5 s".
- Speeds rounded to the nearest 10, with "about" and the unit the property moves in: "about 830
  pixels a second" (Position), "about 80% a second" (Scale, Opacity, Trim Paths), "about 45 degrees
  a second" (Rotation). Never the raw number to three decimals.

The **Effect** line is a clause, starting with a layer name wherever the kind has one: it's said as
a list line in the first answer and inside sentences elsewhere. The **Question** line is a full sentence and always names the
layer, so it can end any turn on its own. The **Where** line is the hint (§ 7). The **First** line is
the start-here reason for that kind (§ 5).

### DX-01 · Linear or half-eased pairs (style; skill: Easing)

- <a id="dx-01-title"></a>**Title:** Steady-speed moves that stop dead
- <a id="dx-01-effect"></a>**Effect:** [layers] run at one speed the whole way and stop dead at each key[; [layer]'s [property] slows at one end but stops dead at [time]]
- <a id="dx-01-question"></a>**Question:** Is the steady speed on [layers] on purpose, or should those moves slow into and out of their keys?
- <a id="dx-01-where"></a>**Where:** In the Timeline, select [layer] and press U: the keys on [property] between [start] and [end] are plain diamonds, and that shape runs at one speed from key to key.
- <a id="dx-01-first"></a>**First:** how things start and stop changes how every other move here feels, so it's the one to settle first

The bracketed clause after the semicolon is said once per half-eased pair, up to two; more than two:
"and [n] more ease at one end only". It names the linear end's time (spec 002's FR-007 amendment).

### DX-02 · Moves on different layers all last the same time (style; no skill yet)

- <a id="dx-02-title"></a>**Title:** Every move the same length
- <a id="dx-02-effect"></a>**Effect:** [layers] each take [duration] to move, so they all keep one beat
- <a id="dx-02-question"></a>**Question:** Is that one shared beat on [layers] on purpose, or should some of those moves take longer than others?
- <a id="dx-02-where"></a>**Where:** In the Timeline, press U on [layers] and compare the space between each move's first and last key: each one is [duration] long.
- <a id="dx-02-first"></a>**First:** it sets the rhythm of the whole comp

### DX-03 · Properties on one layer start and end on the same frames (style; skill: Break the lockstep with offset)

- <a id="dx-03-title"></a>**Title:** Properties that start and land together
- <a id="dx-03-effect"></a>**Effect:** [layer]'s [properties] start at [start] and land at [end] together, so they read as one block
- <a id="dx-03-question"></a>**Question:** Do you want [layer]'s [properties] to move as one block, or should one of them lead?
- <a id="dx-03-where"></a>**Where:** In the Timeline, select [layer] and press U: the keys on [properties] sit on the same frames at [start] and [end].
- <a id="dx-03-first"></a>**First:** it's all on one layer, so it's a small change you'll see right away

### DX-04 · A sudden speed change at a middle key (style; no skill yet)

- <a id="dx-04-title"></a>**Title:** A sudden change of speed
- <a id="dx-04-effect"></a>**Effect:** [layer]'s [property] goes from about [speed before] to about [speed after] at [time], so it jolts there
- <a id="dx-04-question"></a>**Question:** Is the change of speed on [layer] at [time] on purpose, or should the move flow through it?
- <a id="dx-04-where"></a>**Where:** Select [layer]'s [property], open the Graph Editor and switch it to the speed graph: at [time] the line steps from about [speed before] to about [speed after].
- <a id="dx-04-first"></a>**First:** it's a jolt inside a single move, and you'll see the difference as soon as it flows

### DX-05 · A ramp where a hold may be meant, or a hold where a ramp may be meant (ask; skill: Pick the key type on purpose)

Two shapes (research R3): (a) a fade between two values, back and forth, and (b) a lone jump on
Position, Scale or Rotation. Each line has one version per shape; the skill says the one the
result's shape gives (§ 13, SB-2).

- <a id="dx-05-title"></a>**Title:** A fade or a jump to check
- <a id="dx-05-effect"></a>**Effect:** (a) [layer]'s [property] fades back and forth between [values] from [start] to [end] · (b) [layer]'s [property] jumps at [time] instead of moving there
- <a id="dx-05-question"></a>**Question:** (a) Is [layer] meant to fade there, or to snap on and off like a blink? · (b) Is [layer] meant to jump at [time], or to move there?
- <a id="dx-05-where"></a>**Where:** In the Timeline, select [layer] and press U: the shapes of the keys on [property] from [start] to [end] tell you how it changes, diamonds and hourglasses for a gradual change, squares for a snap.
- <a id="dx-05-first"></a>**First:** it depends on what you meant, so it's a question before it's a change

### DX-06 · An expression on a keyed property (ask; skill: Find what's moving it, not built)

- <a id="dx-06-title"></a>**Title:** Keys and an expression on one property
- <a id="dx-06-effect"></a>**Effect:** [layer]'s [property] has keys and an expression turned on, so the keys may not be what moves it
- <a id="dx-06-question"></a>**Question:** Did you mean the expression to drive [layer]'s [property], or the keys?
- <a id="dx-06-where"></a>**Where:** In the Timeline, twirl open [layer]'s [property]: the expression sits under its keys, and the = switch beside the stopwatch turns it on and off.
- <a id="dx-06-first"></a>**First:** it decides whether the keys on [layer] are what you see, so it's worth knowing before you change them

Never "the keys do nothing" or "the expression overrides the keys": without the expression's text,
the mentor can't know (spec › What the mentor can read, finding 6; FR-006).

### DX-07 · Dead time (style; no skill yet)

- <a id="dx-07-title"></a>**Title:** A still stretch at the end
- <a id="dx-07-effect"></a>**Effect:** Everything I can time has stopped by [last change] and the comp runs to [comp length], so the last [gap] hold still[, apart from [layer]'s [property], which an expression keeps moving][, and I can't see motion that only an expression drives]
- <a id="dx-07-question"></a>**Question:** Is the hold after [last change] on purpose, like time to read an end card, or should something still be moving?
- <a id="dx-07-where"></a>**Where:** In the Timeline, look from [last change] to the end of the comp at [comp length]; the comp's length is in Composition > Composition Settings.
- <a id="dx-07-first"></a>**First:** [gap] of the comp holds still, which is the biggest thing left

The first bracketed clause is said for each property the result says keeps moving under an
expression (up to two). The second is the standing not-checked item (§ 6.3); it's always said with
this line, because without it "stopped by" claims more than the read saw (research R6).

### DX-08 · A layer's own motion overlaps its parent's (style; skill: Find what's moving it, not built; US4)

- <a id="dx-08-title"></a>**Title:** A layer moving twice
- <a id="dx-08-effect"></a>**Effect:** [children] run their own keys while [parent] moves them too, from [start] to [end], so they move twice at once there
- <a id="dx-08-question"></a>**Question:** Do you want [children] to move twice from [start] to [end], or should one of the two moves carry it?
- <a id="dx-08-where"></a>**Where:** In the Timeline, check [children]'s Parent column, then press U on [parent] and [children]: [parent]'s keys and theirs overlap from [start] to [end].
- <a id="dx-08-first"></a>**First:** which layer carries the move decides the timing of both, so it's worth settling before the timing

With more than one child and different spans, one span per child: "Title from 0.5 to 1 s and
Subtitle from 0.3 to 1 s" (US4 › 1: both layers and the overlapping time). Never "jump" (that's skill
6's word for something else).

### DX-09 · Motion blur off (setting; no skill; US4)

- <a id="dx-09-title"></a>**Title:** Motion blur off
- <a id="dx-09-effect"></a>**Effect:** Motion blur is off [for the comp | on every moving layer], so fast moves show as crisp steps instead of a smear
- <a id="dx-09-where"></a>**Where:** In the Timeline's switches, the motion blur switch is the one with three small circles on each layer, and the comp's own Motion Blur button sits above the layer list; blur shows only with both on.
- <a id="dx-09-first"></a>**First:** it's one setting, and it's the last thing left to change

No **Question** line: it's a setting, and the panel gives settings no "That's on purpose" button
(spec 007 FR-035). If the learner says it's off on purpose anyway, it's dropped (FR-016, § 8.3).
Said once, as a setting, never per layer (US4 › 2). The switch's look at 26.5 is a claim to verify
(§ 12).

## 5. Rank order and start-here reasons

**Order (rank_weight, 1 first):** the R5 default, kept.

| Weight | Kind | Why it's here |
|---|---|---|
| 1 | DX-01 | How a move starts and stops changes how everything else reads: equal durations, a middle-key jolt and a still ending all look different once the moves ease. It's also the depth edge (Adobe guessed it), and its lesson is built |
| 2 | DX-08 | Which layer carries the motion decides the timing of both. Retiming either before that's settled is work done twice |
| 3 | DX-04 | A jolt inside one move. It reads as a glitch more than a style, and it's often what a learner means by "something's off about the Bar" |
| 4 | DX-03 | One layer, a small change, and offset's property kind teaches it |
| 5 | DX-02 | Rhythm across the comp: best judged after the moves themselves are settled |
| 6 | DX-07 | A comp-length decision, often on purpose (an end card). It changes when timing changes, so it comes after timing |
| 7 | DX-09 | A finishing setting. Practitioners turn blur on late because it slows previews (P) |
| 8 | DX-05 | A question about intent, with a built lesson behind a "no" |
| 9 | DX-06 | A question about intent, with no lesson yet |

**Considered and rejected:** raising DX-03 above DX-04 and DX-08 so the start is more often a kind
with a built lesson. It would make the advice change every time a skill ships, for a reason that
has nothing to do with the learner's comp. The recommendation already says "no lesson yet" honestly
(§ 7). **Guess:** the order between 2 and 6 is an instructor's ordering, with no learner evidence.

**Start-here words.** The start is said as "the first one" (or "the second one" when the symptom
puts it lower), then the reason, then the start's own question, in one sentence (§ 6.1).

- <a id="start-depth"></a>**`depth`** (the start is first by the order above): I'd start with the [first] one, because [the kind's First line]:
- <a id="start-symptom"></a>**`symptom`** (the start matches what the learner said): I'd start with the [first] one, since it's on [layer] around [time], where you said it looks off:
- <a id="start-only-one"></a>**`only_one`** (one finding in all): That's the only thing I found, so let's start there:
- <a id="start-all-questions"></a>**`all_questions`** (every finding is a question): Everything I found depends on what you meant, so let's start with the first one:

Each is followed by the start-here finding's **Question** (or, for DX-09, "want to look at where
that is?"). Drop "[time]" in `symptom` when the learner named no time.

## 6. The first answer

### 6.1 Shape (FR-007)

One turn. It's the one turn in diagnosis that holds a list, because three findings in prose run
together. The list is at most three lines, one per finding in `top`, each line the kind's **Effect**
clause and nothing else. Around it, **two sentences**:

1. What else there is: how many more and what wasn't checked (§ 6.2, § 6.3). Left out when there's
   nothing more and nothing unchecked.
2. Where to start, why, and its question (§ 5). The turn ends on that question: that's the one
   choice. If the learner answers "not on purpose", the finding is taken up (§ 7); "on purpose" drops
   it (§ 8.3); naming another finding takes that one up instead.

No greeting, no "I read your comp", no summary line above the list ("mostly it comes down to…"), no
frame (it slows the first answer past SC-004's 30 s for no gain), and nothing said about a finding
beyond its Effect line. The learner asked one question and gets the answer.

**Pass line:**

<a id="first-answer"></a>
> - [effect line of the first finding]
> - [effect line of the second finding]
> - [effect line of the third finding]
>
> [more line][ and ][not-checked line]. [start-here words] [question]

### 6.2 How many more

- <a id="first-more"></a>**More:** I found [n] more[, [k] of them questions about what you meant]
- <a id="first-rest"></a>**The rest, on request** ("show me the rest", US1 › 2): the other findings as a list numbered on from 4, each its Effect line, never repeating the first three, then: Which one do you want to look at?

The rest turn also says, in one sentence before its closing question, anything § 6.3 leaves for the
rest (precomp time, the comp's motion blur switch, a parent's expression).

### 6.3 What wasn't checked (FR-004, research R6)

| What the result's scope holds | Said in the first answer? | Words |
|---|---|---|
| A precomp (inside not read) | **Always**, by name | <a id="scope-precomp"></a>**Precomp:** I couldn't see inside [precomps] |
| A hidden, guide or soloed-elsewhere layer (set aside) | **Always**, by name, with why | <a id="scope-set-aside"></a>**Set aside:** I left out [layer] because it's [hidden \| a guide layer \| not showing while [other layer] is soloed] |
| Precomp time remapped or stretched | In the rest, and when that precomp is taken up | <a id="scope-precomp-time"></a>**Precomp time:** [precomp]'s time is [remapped \| stretched], so I didn't compare its timing with the rest |
| The comp's motion blur switch (unread) | In the rest, and on a clean comp | <a id="scope-comp-blur"></a>**Comp blur:** I didn't check the comp's motion blur switch |
| A parent's expression on a transform property (US4) | In the rest, and when that child is taken up | <a id="scope-parent-expression"></a>**Parent expression:** I can't tell how [parent]'s expression moves [children] |
| Motion only an expression drives (standing) | **Only** with DX-07 (inside its Effect line) and on a clean comp (§ 6.4) | <a id="scope-standing"></a>**Standing:** I can't see motion that only an expression drives |

<a id="first-more-scope"></a>**Sentence 1, joined:** [More line], and [Precomp line][, and I [Set aside line, from "left out"]].
With nothing more to say about the count, it starts at the Precomp line ("I couldn't see inside…");
with no precomp, at the Set aside line.

Never "everything else looks fine", "the rest is good" or any word that calls what wasn't read fine.
A matte with its eye off is never set aside and never called hidden.

### 6.4 Nothing found (FR-009)

When `top` is empty: say so, say what wasn't seen, then hand to the recommendation (`recommend_next`,
FR-026's last clause). Two sentences.

<a id="clean"></a>**Pass line:** I didn't find anything to change in what I can read here, though I can't see motion that only an expression drives[ or inside [precomps]][, and I didn't check the comp's motion blur switch]. [recommend_next's one-sentence offer, in next-mentor's words]

Never invent a finding, and never "your comp looks great".

### 6.5 A symptom nothing explains (FR-008, US1 › 3)

When `symptom_matched` is false: say so first, with what might hide it, then offer the other
findings without calling any of them the cause.

<a id="symptom-none"></a>**Pass line:** I can't see what's causing that on [layer] in what I can read[, and I couldn't see inside [precomps]]. I did find [n] other things in the comp; want to see them?

When the symptom matches, nothing changes but the order and the start-here words (`symptom`).

### 6.6 When the standing item is said

Only where the answer would otherwise suggest motion has ended (DX-07) or that nothing's wrong (§ 6.4),
as research R6 sets it. Not in every answer: it would be noise, and the learner stops hearing it.

## 7. Taking up a finding (US2)

### 7.1 The order of a take-up

| Step | Learner does | Mentor checks or says |
|---|---|---|
| a. Intent | answers the finding's Question (or it was already answered as the first answer's closing question) | Style and ask kinds only. Skipped when the learner's own words already say it isn't on purpose ("make Bar stop jolting"). DX-09 has no question |
| b. "On purpose" | nothing more | `mark_intended`, then § 8.3 |
| c. Not on purpose, a built skill covers it | agrees or doesn't | The offer (§ 7.2). On agreement, the hand-over (`/next-mentor` › step 6's table, the finding's layers, `review` for a review). On B1, stop at the offer |
| d. Not on purpose, no built skill, or the learner turns the lesson down | changes it, says "done" | The hint (§ 7.3). No change to the project |
| e. "Done" | nothing | `check_finding`, then § 8.1 |

**Turning a lesson down** (step d): FR-012 doesn't say what happens. This design gives the hint, so
every kind has a **Where** line, including the three with built skills (§ 13, SW-3).

### 7.2 Offering the lesson (FR-012, FR-020)

One sentence: what teaches it, and on which layer. Name at most two of the finding's layers; the
lesson's own focus rule narrows from there (easing takes one layer, two at most).

- <a id="offer-lesson"></a>**Lesson:** That's what [skill name] teaches; want to start it on [layer]?
- <a id="offer-practice"></a>**Practice** (learned, no review mode, today easing): You've done [skill name] before; want a practice round on [layer]?
- <a id="offer-review"></a>**Review** (learned, with a review mode): You've learned [skill name], so want to try this one yourself as a quick review on [layer], hands-on, no demo?

From the hand-over on, the lesson's rules apply (its own opening, its one demonstration, its record;
FR-011, research R11). Diagnosis says nothing more until the learner comes back to it.

### 7.3 The hint shape, for a finding no skill covers (FR-013)

Two sentences. The first says there's no lesson for it yet and where to look: the **Where** line,
which names the panel, the layer, the property and the time, and what to look for there. The second
hands the change to the learner. Never the change itself: no menu path for the fix, no value to type,
no "rove it", "delete the middle key", "turn the expression off" or "trim the comp".

<a id="hint"></a>**Pass line:** There's no lesson for this one yet, so here's where to look: [the kind's Where line] Change it the way you want it, then say done.

When the learner turned a built lesson down, the first clause is "Here's where to look:" instead.

**A frame (Guess).** When the finding has one time to show (DX-04's key, DX-07's still stretch,
DX-08's overlap, DX-05's first changing key), the hint turn may carry one `preview_frame` at that
time, with nothing said about the frame itself. Not for DX-01, DX-02 or DX-09: a still can't show
speed, rhythm or blur.

**Stuck, or "how do I do that?"** The turn rule (curriculum § 2, rule 3): one or two sentences that
answer the question with where, never the change, then the pending step again in one sentence. A
second "done" that comes back "still there" gets the Where line narrowed to the one key, property or
switch; still never the change.

### 7.4 "Fix all of it", "do the rest", "just do it for me" (FR-015)

One sentence with the reason, no offer to do it later or any other way, then the next finding.

<a id="fix-all"></a>**Pass line:** I'll leave the changes to you, since making them yourself is what makes them stick. [n] still open; next: [the next finding's Question]

- "Next" is the highest-ranked open finding that isn't the one in hand (or the start, if nothing's
  in hand). For DX-09, "next: [Effect line]; want to look at where that is?"
- No "for now", "later", "if you get stuck", "I can show you", "after the lesson I could". No apology.
- The lesson offer in § 7.2 is not an offer to do the fix, and doesn't go in this turn.
- Diagnosis has no demonstration, so curriculum § 2's "do it for me is the ask" never applies here.
  Inside a lesson started from a finding, the lesson's own rule does.

## 8. Re-checks and intent

### 8.1 After "done" (FR-014; `check_finding`)

Everything said comes from the call made in that turn, never an earlier read. Two sentences: the
result for the finding in hand, then what's still open and the next question.

- <a id="recheck-gone"></a>**Gone:** That's gone from [layer]'s [property] now[, and [other layer]'s [title, lower case] is gone too].
- <a id="recheck-still"></a>**Still there:** Still there: [Effect line, as the fresh read gives it]. Have another look at [layer]'s [property] around [time], then say done.
- <a id="recheck-changed"></a>**Changed:** That's changed rather than gone: [the new Effect line]. [its Question, or the next line]
- <a id="recheck-unmatched"></a>**Two layers, one name:** Two layers are called [layer] now, so I can't tell which one you changed; rename one and say done.
- <a id="recheck-open"></a>**What's still open:** [n] still open[, including a new one on [layer]][, and [layer]'s [title, lower case] is back]; next: [the next finding's Question]
- <a id="recheck-all-clear"></a>**Nothing open:** That was the last one I found; [recommend_next's one-sentence offer]

"Gone", "still there", "changed": never "fixed", "correct", "wrong" or "broken". A new finding is
named as new, never as something the learner broke (edge case: changes outside the findings aren't
mistakes). An undone change reads as still there (or "back" for a finding the learner wasn't on).

### 8.2 Words to avoid everywhere

The mentor never calls a style or ask finding a mistake (FR-006). In diagnosis turns it doesn't say:
mistake, wrong, error, broken, problem, issue, bad, "doesn't work", "do nothing", "should" in a
statement (it's fine inside a question), or "fix" for what the learner does (say "change"). It never
echoes "what's wrong" back. These are for the eval rubric too (§ 13, EE-1).

### 8.3 Intended (FR-016; `mark_intended`)

<a id="intended"></a>**Pass line:** Got it, I'll leave that one alone on [comp]. [n] still open; next: [the next finding's Question]

If nothing's left open: "Got it, I'll leave that one alone on [comp]." and then § 8.1's Nothing
open line.

## 9. Openings, memory and the pattern

### 9.1 The short opening (FR-026; low priority)

Only in a session started without a named skill, outside the panel. One or two sentences, one place
to start, and the same honesty about limits as the first answer, in a clause. No list.

<a id="opening"></a>**Pass line:** I had a look at [comp] and found [n] things[, not counting inside [precomps]][ or [set-aside layer], which is [hidden]]; I'd start with [layer], because [the start's First line]. [its Question]

Clean comp: "I had a look at [comp] and didn't find anything to change in what I can read." followed
by `recommend_next`'s offer.

### 9.2 Coming back to a comp (US3, gated; FR-019)

Only after the fresh read. One or two sentences: when, what looks gone, what's still there, then the
next question. Another comp's diagnosis is never mentioned.

<a id="since"></a>**Pass line:** Last time on [comp], on [date], I found [n] things; [m] look gone now[, you said [k] were on purpose], and [j] are still there. Next: [the start's Question]

All gone: "Last time on [comp], on [date], I found [n] things, and they all look gone now." then the
new findings, if any, as a first answer (§ 6), or the clean line.

<a id="notes-unreadable"></a>**Notes unreadable** (US3 › 5): I couldn't read my notes from before, so this is a fresh look. Said once, as the first clause of the turn.

### 9.3 The pattern and the review (FR-020, US3 › 3 and 4)

A pattern is named once, in the turn that offers the start, in general terms: the kind, by its title,
and the comps. Never why it keeps happening, never a habit of the learner's ("you tend to…"), never
a method.

- <a id="pattern-skill"></a>**Pattern, with a lesson:** [Title] has come up on [comp] and [other comp] now, so it's worth practicing: want to start [skill name] on [layer]?
- <a id="pattern-no-skill"></a>**Pattern, no lesson yet:** [Title] has come up on [comp] and [other comp] now, so it's worth practicing; there's no lesson for it yet, so here's where to look: [Where line]
- **A learned skill:** § 7.2's Review or Practice line, never a first lesson.

**The record holds no sentences.** The diagnosis record is IDs, names, times and states, written by
the tools (data-model › Diagnosis record, FR-018). So diagnosis has no record summary to word, and
nothing here should become one.

## 10. Overlaps: what the learner hears

The spec's Edge Cases and plan.md › Overlaps say what the analysis sees. This is only what the
mentor says, so no rule that's right for the analysis turns into a wrong sentence.

| Overlap | Said | Never said |
|---|---|---|
| Expression on a keyed property | DX-06's question | "the keys do nothing", "overridden", any claim about what the expression does |
| Expression-only motion | The standing item, with DX-07 and on a clean comp | "nothing moves after…" without it |
| Single key | Nothing (it's a set value) | It as a move, or as "missing a key" |
| Hold keys | A held pair is a jump; a run of holds says nothing | A blink called a jump to check |
| Half-eased pair | DX-01's clause naming the end that stops dead | "eased" for that pair |
| Separated X and Y | One Position ("X Position" when only X moves) | X and Y "landing together" |
| Effects | Effect properties by name in any Effect line ("Glow's Blurriness") | |
| Precomps | Named as not seen inside, always | "Icon is fine", "nothing inside Icon" |
| Hidden, guide, soloed elsewhere | Named as left out, with why | Counted, or "unused" |
| Track matte, eye off | Nothing special: it's counted as moving | "hidden", "unused" |
| Null | Only through its children (DX-08) | A null as something the viewer sees |
| Layer trimmed | Nothing for moves outside its time | A move nobody can see |
| Static layer | Nothing | "missing", "no animation" as a finding |
| Renumbered layers | Names only | Layer numbers, ever |

## 11. Teaching scope (not taught here)

- **Any skill's idea.** Diagnosis names and points; the lesson teaches. It doesn't explain easing,
  holds or offset on the way past (curriculum § 2 rule 2: a fact goes in the turn that acts on it).
- **The fix,** in any form (spec › Out of scope). No demonstration, no menu path for the change.
- **What an expression does or why it errors** (deferred 13, Motion from code; skill 4 traces it).
- **Taste.** No "make it better", no verdict on rhythm. Every style finding is a question first.
- **Render, export, performance, other apps.**
- **Where to find what's moving a layer** (skill 4, not built): DX-06 and DX-08 hint at where to look,
  not how to trace.

## 12. The DX-08 question: should it map to *Move a group with a null*?

**Answer: no. Keep DX-08 → *Find what's moving it* (`motion.sources`), with hints until that's built.
No change to `path.json`.**

Why:

1. **The hand-over would land on a lesson that refuses its focus.** DX-08 fires on a child that
   already has a moving parent. Skill 6's candidate rule leaves out any layer already parented to a
   null ("Title already follows CTRL", `specs/012-null-parenting/teaching-design.md` § 4) or to a
   visible layer. On Diagnosis Practice, every DX-08 child is already CTRL's. The lesson would open
   by saying it can't use the layers diagnosis just handed it.
2. **It's a different idea.** Skill 6 teaches making the parent link. The learner who triggers DX-08
   already made it. What's off is the timing of two stacked moves, and the choice is where the motion
   should live: on the parent, on the child, or both, apart in time.
3. **Skill 6 rules it out on purpose.** Its teaching scope says: "Stacked parent and child motion as
   a timing problem (DX-08): skill 4 traces it, diagnosis hints it" (§ 8 there), and its stage 7
   gives it only one ungraded sentence.
4. **Offset doesn't fit either.** Offset grades layers that start on the same frame; CTRL (0 to 1 s)
   and Title (0.5 to 1.5 s) don't, so its check wouldn't see the change.

So DX-08 stays "not teachable yet" and gets § 7.3's hint. When skill 4 is built, the hand-over
teaches tracing the two sources; the timing change itself stays a hint.

**One line in `curriculum.md` is now wrong**, and it's mine to fix once the builder approves (proposed
in the hand-back, not edited): § 10's DX-08 row says "4 (trace), then hints; 6 if they want a null".
"6 if they want a null" contradicts skill 6's focus rule above.

## 13. Open questions

### For the builder (H)

1. **The first answer's list.** The cockpit's rule is two sentences per turn. The first answer has a
   list of up to three lines plus two sentences (§ 6.1), because three findings with layers and
   times in two sentences run together. Approve, or ask for prose? **Recommended: approve the list.** *Approved 2026-11-09.*
2. **Asking intent at the end of the first answer.** The first answer ends on the start's own
   "on purpose?" question, not "want to start there?", so US2 › 5 is met without an extra round
   trip. A learner who wanted to see the rest first can say so. **Guess.** *Approved 2026-11-09; watch the first live session for it feeling like a quiz.*
3. **Frames in a hint** (§ 7.3): one frame at the finding's time, or none? **Recommended: one, as
   written, and drop it if live sessions show it slows the turn without helping.** *Approved 2026-11-09.*

### For the spec writer (SW)

*All resolved 2026-11-09, as proposed, with SB-1 too (spec `b0fa184`). `first_non_ask` was dropped.*

1. **Symptom on an ask finding.** Research R5 and T014 pick the highest-ranked non-ask as the start,
   even when a symptom puts an ask first. If the learner says "Cursor looks wrong" and Cursor's fade
   (DX-05) is the only match, the start would skip to an unrelated finding, which is what US1 › 3
   says not to do. **Proposed:** with a matched symptom, start at the highest-ranked non-ask among the
   matched findings; if they're all asks, the first matched one (reason `symptom`). Without a
   symptom, R5's rule as written.
2. **Reason codes.** With the weights above, asks rank last, so `first_non_ask` can only happen
   through a symptom, and under SW-1 not at all. And there's no code for "every finding is a
   question". **Proposed:** add `all_questions` (words in § 5) and keep `first_non_ask` only if SW-1
   isn't taken.
3. **Turning a lesson down.** FR-012 says what happens on agreement, not on "no thanks, just tell
   me". This design gives the hint (§ 7.1 d), so every kind has a Where line, while
   contracts/catalogue.md calls `where_key` the "no-skill hint". **Proposed:** a line in US2 or FR-013
   saying hints also apply when the learner turns the lesson down.
4. **The panel's "Get hints" for DX-01, 03 and 05** would follow from SW-3; spec 007 FR-035 shows hints
   only when no skill is built. A question for T054.
5. **A fade counted twice.** On Diagnosis Practice, Cursor's Opacity ramps linearly (T002), so its
   pairs could raise DX-01 ("stop dead, could ease") as well as DX-05 ("fade or blink?"). Teaching
   both at once contradicts itself: the question is whether it should change at all, not how it
   eases. **Proposed:** a property raised as DX-05 shape (a) is left out of DX-01, the way an
   expression's keys are left out of DX-01 to DX-05. An Edge Cases row and an answer-key line (T003)
   if accepted.

### For the skill-builder (SB)

1. **`first` anchors.** Each kind has a `dx-NN-first` anchor (the start-here reason) that the
   contract's wording keys don't list. Either add an optional `first_key` to the catalogue, or have
   `SKILL.md` read § 4 directly. **Recommended: add `first_key`**, so the test covers it.
2. **DX-05's two shapes.** The skill needs to know which shape (a fade or a lone jump) a DX-05 finding
   is, to pick the line. data-model › Finding doesn't list DX-05's measures. **Proposed:**
   `measures.shape: "fade" | "jump"`.
3. **DX-07's measures text.** T013 has the result carry "keeps moving, can't be timed" as a string.
   The contract says replies carry data, not sentences: carry the layer and property, and take the
   words from `dx-07-effect`.
4. **`SKILL.md` takes Pass lines, not the § 14 example.** The example's names and numbers would be
   copied word for word onto other comps (pacing-rebaselines finding 1).

### For the eval engineer (EE)

1. § 8.2's word list and § 6.3's "never call what wasn't read fine" are good deterministic checks
   alongside plain speech (spec eval item 14).
2. The rubric's "doesn't lecture the whole list" reads, for the first answer: at most three list
   lines, each one clause, and nothing about a finding beyond its Effect line.

### Claims to verify before they're taught (on 26.5, at T049)

- The motion blur switch's look and the comp button's place (DX-09's Where line): Adobe's 2026-10-08
  answer (R) and practitioner knowledge (P), not checked live.
- Key shapes: plain diamonds for linear, hourglasses for eased, squares for hold (DX-01 and DX-05's
  Where lines): Adobe's 2026-10-08 answer (R), B.
- The speed graph shows a step at a middle key whose speeds differ (DX-04's Where line): B.

## 14. A worked first answer, for the rubric and evals only

**Not for `SKILL.md`.** It's illustrative, written from `build-practice-comp.jsx` as Diagnosis
Practice copies it (T002); T003's answer key decides the real findings, counts and order. US1 only
(DX-08 and DX-09 off).

> - Title, Subtitle and 2 more layers run at one speed the whole way and stop dead at each key; Subtitle's Opacity slows at one end but stops dead at 1.3 s
> - Bar's X Position goes from about 830 to about 430 pixels a second at 0.6 s, so it jolts there
> - Title's Scale and Opacity start at 0.5 s and land at 1.5 s together, so they read as one block
>
> I found 4 more, 2 of them questions about what you meant, and I couldn't see inside Icon, and I left out Old Take because it's hidden. I'd start with the first one, because how things start and stop changes how every other move here feels, so it's the one to settle first: is the steady speed on Title, Subtitle and 2 more layers on purpose, or should those moves slow into and out of their keys?

What a judge should see: three lines, no lead-in, no frame; how many more and how many are questions;
Icon and Old Take named; one start with its reason; a single question at the end; no "mistake", no
"wrong", no field names.

## 15. Evidence and guesses

- **R:** interview 007 (the hidden-cause job); the 2026-10-08 Adobe session (8 findings, "do all of
  it", the guessed easing cause); pacing-rebaselines findings 1 and 6 (example sentences copied, the
  mentor saying more than the tool reported), which is why every line here is a template with slots
  and § 14 is fenced off.
- **B:** "I do, we do, you do" and hints-not-fixes, as in every skill (curriculum § 2).
- **Guess:** the rank order between 2 and 6 (§ 5); ending the first answer on the start's intent
  question (H-2); a frame in hint turns (H-3); the list as the one exception to two sentences (H-1);
  "the first one" as the way to point at the start.
