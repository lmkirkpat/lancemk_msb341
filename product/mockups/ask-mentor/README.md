# Knack panel: ask-first Home and the Ask flow

**Status:** Design for spec 014 (`specs/014-ask-mentor/`), drawn together with spec 007's T061. Not built.
**Date:** 2026-11-14. **Revised the same day** twice: after the builder's review (teaching design § 5.1 and
§ 19, "Decided 2026-11-14, from the mockup review"), then after the design review (see
[Design review 2026-11-14](#design-review-2026-11-14); the builder approved every finding).
**Decided by:** `decisions/012` (Home opens ask-first) and the teaching design's § 5 to § 7, § 9, § 11,
§ 12 and § 19.
**Builds on:** `product/mockups/ui-overhaul/` (spec 007). Same tokens, components and state names. This
is that Home evolved, not a new look. Anything not listed here works as spec 007 draws it.

## How to open it

Open `product/mockups/ask-mentor/index.html` in any browser. It's one file with no outside fonts, images
or scripts. It opens on **The ask flow, start to finish**, six panels at 260 × 480. The left rail lets you:

- jump to any state (each tagged **new**, **changed** from spec 007, or **same**)
- set the width (260 minimum, **343 default**, 420) and height (480, 680, 900)
- switch **dark** (AE's default) and **light**
- turn off auto-advance to study the loading states

**Open first:** `#flow`, `#all-homes`, `#deeper-paths`, `#cmp-before-after`, `#ask-answer`,
`#ask-steps-open`, `#ask-clarify`, `#ask-deeper-lesson`, `#ask-deeper-notyet`, `#ask-back`, `#home-nocomp`,
`#ask-busy`.

**Walk it by hand:** on `#home-return`, type anything and press Ask (or Enter). Any question gets Comp 1's
answer in this mockup, with your words in the bubble. Then Go deeper, Done check it, Back to your steps.
While the lesson is open, try the Home tab and the lesson's Back button: both lead to paused screens.
Find my next lesson walks T061's screens.

**Not run in a browser.** I have no shell, and the built-in browser can't open local files, so I read the
code back but never saw it on screen. Fit at 260 × 480, tag wrapping and the light theme's contrast are
worked out by hand, not checked.

### Sources

The main content is Comp 1 from the ask baseline (`discovery/usage-notes/ask-baseline.md`): rock.png on
the Shake Control null, Position and Rotation driven by expressions, Sweep Control's keys at 3.37 s and
3.54 s driving a CC Light Sweep on Black Solid 1. The questions are the builder's own from that session
(turns b and c). The clarifying and outside-the-six questions are invented. The record's dates and skills,
the Easing on Title lesson in progress on Mentor Practice, and the "about 40 px left" miss in
`ask-deeper-notyet` are invented to show a state. Mentor text is marked **Placeholder**: it belongs to
`SKILL.md`, which must not copy example sentences (the pacing lesson). No snapshot or frame was attached.

### The Comp 1 answer (revised after the design review)

Three parts, about 121 words in all (§ 5.1's cap is about 120). Only the first and last are the mentor's
words; the middle is drawn by the panel from the step data:

> *Mentor (prose):* In Comp 1, rock.png rides on Shake Control, a null moved by expressions:
> - All three hits are the same size.
> - Rotation is too small to see: 0.75° at most, gone in about 1/3 s.
> - The turn centers on the rock, where Shake Control sits.
>
> *Panel (from step data):* **STEPS**
> 1. Open Shake Control's Position expression and look at how it sets each hit's size: it uses the first
>    hit's size for all three. Not something I teach yet.
> 2. Open Shake Control's Rotation expression and look at its amounts: 0.75° at most, too small to see. Not something I teach yet.
> 3. Select Shake Control (the null, not a letter) and Pan Behind its pivot to where the hammer hits.
>    *Set the pivot*
> 4. Play it back and watch the turn.
>
> *Mentor (prose):* Try them, or want to go deeper on step 3 with *Set the pivot*?

- **The first line names the comp it read.** The panel shows no comp name, so this line is the
  wrong-comp safeguard: if the learner meant another comp, they see it in the first words.
- **The explanation's parts** go in order of visible effect (§ 19). They're bullets, never numbered, never
  called steps, never docked.
- **Step 1 states a read fact with an action, never the edit** (H-2): what to open, what to look at, and
  what the read sees there. It doesn't say what to change in the code.
- **Step 3 names the null plainly**, because the builder's own Pan Behind landed on O Shakers.
- **The STEPS heading and the numbered list come from the step data, decided.** The panel draws both, so
  they appear only when there are steps, and the mentor's prose leaves the steps out entirely (no list,
  no "Steps:"). In the mockup that block is marked "Panel · from step data", the way mentor prose is
  marked "Placeholder"; the built panel shows only "Steps".
- **So the panel can place the steps between the explanation and the hand-back without parsing prose**,
  the "asked" result carries the hand-back sentence as its own field, next to the step lines and the
  offered skills. A requirement for the spec writer (see the call I'm least sure of).

## What this removes from spec 007's Home

| Spec 007 Home (built) | Ask-first | Why |
|---|---|---|
| Welcome back, last lesson line | Gone (first run keeps "Welcome to Knack.") | One quiet line from the record (012) |
| **Up next** card: Find my next lesson (primary), Pick a skill | Find my next lesson is the **quiet line**. Pick a skill is the Skills tab | Lesson-first is one tap away, not the door |
| **Practice due** card with Warm up | A line at the top of **Skills**, with Warm up. Never on Home | A due review never opens the session (012, § 10.1 rule 5) |
| **Your lesson is waiting** card (`home-cutoff`) | The quiet line: "Pick up Easing on Title" | Same lead, quieter |
| **What the mentor remembers** | Moves to Skills, under the path | See the memory choice |
| Held diagnosis slot | Gone | Diagnosis is parked; ask covers "what moves this" (§ 9) |

**Added:** the ask card, "Ask about the open comp", first and largest.

## The design

### Home

```
Home  Lesson  Skills                    ● AE
┌──────────────────────────────────────────┐
│ Ask about the open comp                  │
│ What do you want to know or change?      │
│ [                                     ]  │
│ Reads your comp. Changes      [  Ask  ]  │
│ nothing.                                 │
└──────────────────────────────────────────┘
──────────────────────────────────────────
 Find my next lesson                      ›     ← or "Pick up Easing on Title ›"
──────────────────────────────────────────
```

- **The ask card** uses spec 007's lead card (blue edge). It names no comp; the panel doesn't read the
  project (decided 2026-11-14). The visible label is "What do you want to know or change?", which welcomes
  both "why is it doing this" and "how do I make it do that". Ask is the one primary button. It's off
  until there's text, and off with a reason when AE can't take a question; off, it stays focusable
  (`aria-disabled`) and its reason is linked to it. Enter sends; Shift+Enter adds a line. The hint and
  reasons wrap rather than cut off.
- **The quiet line** is a full-width row between two rules: not a card, not blue, not a primary button.
  It reads one of these, in order:
  1. **A lesson open in the panel:** "Back to your lesson", with End lesson under it (`home-lessonopen`,
     or `home-lessonopen-deeper` when the lesson came from Go deeper).
  2. **A lesson in progress:** "Pick up Easing on Title" with its comp and progress, and Set it aside
     under it (`home-inprogress`, spec 007's `home-cutoff`). The comp here comes from the record, not
     from a read.
  3. **Otherwise:** "Find my next lesson" (`home-return`, `home-first`).
  Long lesson or comp names truncate to one line; the full text is in a tooltip and in the button's
  accessible name (the text is only drawn short, not cut).
- **Nothing else from the record is on Home.** No due review, and no badge on the Skills tab.
- **No comp open** (`home-nocomp`): AE is connected but no comp is active. The card says "No comp open.
  Open one, or click into its timeline." in place of the hint, Ask is paused with that reason, and the
  line reads "Find my next lesson · Needs an open comp." You can still type. This needs the health check
  to say whether a comp is active (yes or no, no name); until it does, the same case shows after Ask as
  `ask-nocomp` (see Still open).

### Asking

Ask switches the Home tab to the **thread**: Back · "Ask / About the open comp", the chat, **Your steps**
(only when the answer has steps), and a follow-up bar.

- **Reading** (`ask-reading`, `ask-reading-long`): a skeleton turn and "Reading the open comp…", then
  "Still reading the open comp…" after about 6 s.
- **The answer** (`ask-answer`): the three parts above, with skill names in bold italics. Under the
  hand-back, inside the same message: **Go deeper: Set the pivot ›**, one per skill the answer offered
  (two at most). It's gray, not primary, because the usual choice is to go try the steps.
- **Go deeper lives inside its answer.** It scrolls away with the answer and never shows up again in a
  later turn, so after "just the steps" nothing on screen keeps offering (§ 5.4). While a lesson from it
  is open, it becomes **Back to your lesson ›** with "Your Set the pivot lesson is open." under it
  (`ask-lessonopen`), so it can never be pressed a second time. Once the lesson is over, it's gone from
  the answer.
- **Your steps (decided 2026-11-14: keep):** docked under the chat in spec 007's checklist frame, folded
  behind a twirl-down at every height. It holds **only the steps**, never the explanation. **No glyphs,
  no ticks, ever**, with "From the answer. Knack doesn't track these." in its header (ask mode has no
  check, § 7.4). At tall docks it opens under the chat (38% cap); at short docks it swaps with the chat,
  as the checklist does. It opens itself once when you come back from a lesson.
- **After a new question, the dock shows only the latest answer's steps.** An earlier answer's steps stay
  in its folded turn; if the new answer has no steps, the dock goes away (`ask-new-question`).
- **No steps, no dock.** An answer with nothing actionable (a clarifying question, the outside-the-six
  line, a describe-the-comp answer, no comp open) has no Your steps and no Go deeper: `ask-clarify`,
  `ask-outside`, `ask-new-question`, `ask-nocomp`.
- **Follow-ups and new questions** go in the same thread (§ 6 turns 3 and 7). A new question folds
  earlier ones into "Earlier questions (n)", as lessons fold earlier turns.
- **The follow-up bar stays single-line.** It's spec 007's lesson Ask bar, shared with every lesson, and
  a follow-up is a short question (§ 6 turn 3). A long new question has Home's multi-line box, one Back
  away (`home-thread`). If the sessions show people cramming long follow-ups into it, make the shared bar
  grow to three lines, which changes lessons too.
- **AE busy during an ask** (`ask-busy`): the connection mark turns amber, the status line says "After
  Effects is busy. Your answer will come when it's free.", and the answer waits. The thread still scrolls
  and Your steps still opens; the follow-up bar and Go deeper pause with "Waiting for After Effects."
- Back goes to Home (`home-thread`), which adds one plain link: "Back to your question ›".

### Going deeper

- **Pressed** (`ask-deeper-starting`): "Yes, go deeper on Set the pivot." shows in the thread, the
  button reads Starting…, and the status line says what's happening. This is spec 007's Yes, let's go
  pattern. **On A the lesson takes over in the same conversation, with the answer's context** (§ 7.2).
  **On B1 the mentor stops at the offer; B1 is for building and evals, the sessions run on A** (§ 7.1).
- **The lesson** (`ask-deeper-lesson`): spec 007's lesson screen with three changes. A line under the
  header reads "From your question. Back returns you to it." The Back button goes to the thread
  (`ask-lessonopen`), not to Home. Pick is already ticked, because the answer made the choice (§ 7.2). It
  opens on **Shake Control**, the layer that makes the motion. Its rows are K7's: "Pivot where the hammer
  hits · ? Your call" (rule 2), plus the rock and the ten letters staying put.
- **While it's open, nothing reopens the question live.** The Home tab goes to `home-lessonopen-deeper`
  (Ask paused, the line back to this lesson, End lesson under it). The lesson's Back goes to
  `ask-lessonopen` (the thread readable, the follow-up bar paused with "Your lesson is open. Ask there,
  or end it first.", Go deeper turned into Back to your lesson).
- **Not there yet** (`ask-deeper-notyet`): the check says what's still off and where: the rows read
  "! Moved, about 40 px left" for the rock and the letters, and the mentor says the null moved, not just
  its pivot. No fail, no review, nothing saved as a miss. Done, check it is there again.
- **Done** (`ask-deeper-passed`): the tag reads "✓ Done", the result line says what the check saw ("Pivot
  moved, nothing else did."), and the way out is **Back to your steps ›** (primary) in place of
  What's next ›.
- **Back** (`ask-back`): the thread with a divider ("Set the pivot · practiced on Shake Control"), the
  mentor's one hand-back sentence ("That was step 3; next is step 4: play it back and watch the turn."),
  and Your steps open. Go deeper is gone from the answer.
- **Ended early** (`ask-ended`, from End lesson): the divider reads "Set the pivot · ended, not saved",
  and the mentor still names the next step.

### Asking again is normal

This learner passed the pivot on Door, and the panel shows nothing about that in the thread: no
"learned" mark on the skill tag or the button, no "asked again" count, no review prompt beside the
answer. When they go deeper, the lesson's tag reads **Practice**, never review, and its results say what
the check saw, with no pass or fail words (§ 11). Asking about a learned skill isn't a failed review and
isn't recorded as one (§ 7.1).

### Short skill tags (for spec 014 to adopt)

A tag sits at the end of a step and inside the Go deeper button, so the skills' full names are too long
for it ("Go deeper: Shape the ease in the speed graph ›" is about 320 px; the answer has about 190 px at
260 wide and 270 px at 343). Tags and buttons now wrap instead of overflowing, but short names keep them
on one line:

| Skill (full name, Skills tab) | Tag and Go deeper name |
|---|---|
| Easing | Easing |
| Pick the key type on purpose | Key types |
| Shape the ease in the speed graph | Speed graph |
| Break the lockstep with offset | Offset |
| Set the pivot (anchor point) | Set the pivot |
| Move a group with a null | Group with a null |

The lesson header and the Skills tab keep the full names.

## How T061 fits

T061's flow (Find my next lesson → `lesson-picking` → Yes → `lesson-picking-starting` →
`lesson-picked`) is **unchanged from `lesson-picking` on**. Only the entry moves:

| | Spec 007 | Ask-first |
|---|---|---|
| Entry | Up next card, primary button | Home's quiet line, "Find my next lesson ›" |
| `home-first` | Easing, Start lesson (FR-010, path's first skill, no mentor turn) | The same Home as a returning learner, plus "Welcome to Knack.", with Find my next lesson (one mentor turn) |
| Pick a skill | On the Up next card and `lesson-picking` | Skills tab, and still on `lesson-picking` |
| A due review | Practice due card on Home; Find my next lesson may suggest it | Only in Skills; Find my next lesson may still suggest it, because the learner asked for a lesson |

So T061's live check needs a small edit: `home-first` should now show the ask card and Find my next
lesson, not Easing with Start lesson. The press, the suggestion and the hand-over are the same.
`lesson-picked` keeps spec 007's review tag, because there the learner asked for the due review.

## States

**New** = not in spec 007. **Changed** = a spec 007 state that looks different. **Same** = drawn only so
the flow clicks through.

| Id | Kind | What shows |
|---|---|---|
| `home-return` | changed | Ask card and Find my next lesson |
| `home-first` | changed | Same, plus "Welcome to Knack." (was Easing, Start lesson) |
| `home-inprogress` | changed (was `home-cutoff`) | Quiet line: Pick up Easing on Title · Mentor Practice; Set it aside |
| `home-review-due` | changed | Identical to `home-return`, on purpose; the review is in Skills |
| `home-lessonopen` | changed | Ask paused ("Your lesson is open. Ask there, or end it first."); line goes back to the lesson; End lesson |
| `home-lessonopen-deeper` | new | The same, for a lesson from Go deeper; End lesson goes to `ask-ended` |
| `home-nocomp` | new (restored) | No comp named; "No comp open. Open one, or click into its timeline."; Ask and the line paused |
| `home-unreadable`, `home-unreadable-why` | changed / same | Spec 007's banners over the new Home; asking works |
| `home-unreachable`, `home-busy` | changed | Spec 007's banners; the box still takes text, Ask paused with the reason |
| `home-loading` | same | Skeleton reshaped to one card and one line |
| `home-thread` | new | Home plus "Back to your question ›" |
| `ask-typing`, `ask-sending` | new | Text in, Ask turns on; Asking…, everything else paused |
| `ask-reading`, `ask-reading-long` | new | The question in the thread, a skeleton, "Reading the open comp…", then "Still reading…" |
| `ask-answer` | new | Comp named first; explanation (bullets); STEPS from step data; hand-back; Go deeper; Your steps folded |
| `ask-followup`, `ask-steps-open` | new | A follow-up and its short answer; Your steps opened (steps only) |
| `ask-clarify` | new | One clarifying question naming two layers; **no steps, no dock** |
| `ask-outside` | new | The outside line; a quiet "See what's covered ›" to Skills; no dock, no Go deeper |
| `ask-unreachable` | new | Red connection mark, the mentor saying it can't see AE, Try again resends the question |
| `ask-nocomp` | new | The mentor's read found no comp; it says so, no dock; Try again resends |
| `ask-busy` | new | Amber mark, the answer waiting, the thread still readable, follow-up and Go deeper paused |
| `ask-new-question` | new | Earlier question folded; a describe-the-comp answer (Sweep Control) with no steps, so no dock |
| `ask-deeper-starting` | new | Go deeper pressed |
| `ask-deeper-lesson` | new | Lesson in context: Shake Control, from-your-question line, Pick ticked, K7 rows, Practice tag |
| `ask-deeper-notyet` | new | The check sees the rock and letters moved; says where and how far |
| `ask-deeper-passed` | changed (`lesson-passed`) | ✓ Done, what the check saw, Back to your steps › in place of What's next › |
| `ask-lessonopen` | new | The thread while its lesson is open: follow-up paused, Go deeper is Back to your lesson |
| `ask-back` | new | Divider "practiced on Shake Control", the hand-back to step 4, Your steps open, no Go deeper |
| `ask-ended` | new | Divider "ended, not saved", the mentor names the next step |
| `skills-due` | changed | Practice due line at the top with Warm up; memory moved here |
| `lesson-none` | changed | "Ask about your comp on Home, or pick a skill." |
| `lesson-picking`, `lesson-picked`, `lesson-continued` | same | T061's and spec 007's screens |

**Removed earlier:** the `cmp-steps` side by side (docked steps decided).

### States still missing

- **Turn 4, "done" / "it didn't work"**: a fresh read described, no verdict. It's an ordinary turn. The
  rule for the panel is that nothing in the thread or Your steps changes to ✓ or ✗.
- **Go deeper on a skill whose check can't see the target** (§ 7.3): the mentor offers nothing, so there's
  no button.
- **Go deeper on B1**: the mentor stops at the offer. Not drawn, since the sessions run on A. Recommend
  the "asked" result carries no offered skills on B1, so no button shows that would stop short.
- **Passing runtime errors during an ask** (offline, rate limited): spec 007's notices, with "Your
  question's still here." in place of "Your lesson's still here." Not drawn. (AE busy is now drawn.)
- **Two Go deeper buttons** at 260 wide: they wrap to two lines, and a long one wraps inside itself. Not
  drawn.

## Open questions

### Decided 2026-11-14 (builder's mockup review)

1. **The comp's name: decided, none.** The ask card reads "Ask about the open comp" everywhere, and no
   panel copy names a comp. Adding the active comp's name to the bridge's health check (an amendment to
   constitution II) waits until the sessions show the panel feels anonymous. The mentor's first line
   names the comp it read.
2. **Panel data: decided, as recommended.** The "asked" result carries the offered skills (two at most)
   and the step lines as data, so the panel never parses the mentor's prose. Go deeper, the STEPS heading
   and list, and Your steps draw only from that. With no step lines there's no STEPS block and no dock;
   with no offered skills there's no button, and typing "yes" still works. A requirement for the spec
   writer. (The design review adds the hand-back sentence as its own field; see below.)
3. **Docked steps: decided, keep.** Folded under the chat behind a twirl-down. The alternative (steps only
   in the answer) is rejected and removed from the mockup.

### Decided 2026-11-14 (design review)

4. **Go deeper on B1: decided, stop at the offer** (§ 7.1). On A the lesson takes over in the same
   conversation with the answer's context (§ 7.2). B1 is for building and evals; the sessions run on A.
8. **Go deeper on a skill with a review due: settled.** It's practice, never a review: the tag says
   Practice, the result says what the check saw, a miss says what's still off and where, and nothing reads
   as pass or fail. Asking about a learned skill isn't a failed review and isn't recorded as one (§ 7.1).
   Whether a clean practice also moves the review's date is the spec writer's, under H-5 (record now,
   schedule later).

### Still open, with recommendations

5. **`home-first` and FR-010.** An empty record used to show Easing with Start lesson, with no mentor turn.
   012 says Find my next lesson. **Recommend Find my next lesson**: one rule, and next-mentor will usually
   say Easing anyway. Spec 007's FR-010 and T061's note need amending (listed below).
6. **Tab name: Home or Ask?** **Recommend keeping Home**: it holds the lesson line too, and renaming
   changes spec 007's tests for little gain.
7. **Stop during a long read.** None is drawn. **Recommend** none for now; add Stop if the three sessions
   show reads past about 15 s.
9. **Memory on Home** (`#cmp-memory`). **Recommend A: move it to Skills.** 012 allows one quiet line, and
   "Next time: a keyed swing on Door" is a lesson nudge at the door.
10. **No comp open before Ask** (`home-nocomp`). The panel can only pause Ask if the bridge's health check
    says whether a comp is active. A yes or no carries no name, but it's still the panel learning
    something about the project, so it may need the same constitution II amendment as the comp name.
    **Recommend** adding the yes or no with spec 014 (it's one flag, and it saves a wasted mentor turn);
    if the builder holds it with the comp name, ship `ask-nocomp` alone, which works today.

**The call I'm least sure of now:** splitting the answer into three fields (explanation, step lines,
hand-back) so the panel can draw STEPS between the mentor's prose. It keeps the order § 5.1 asks for
and never parses prose, but it adds one more field the mentor must fill correctly every time, and a
missing hand-back field would leave the steps last with no offer. The other option: the mentor writes
one block of prose (explanation and hand-back), and the panel draws STEPS after the whole message. No new
field, but the offer ("go deeper on step 3") then comes before the learner has seen step 3.

## Design review 2026-11-14

The design-reviewer's findings, all approved by the builder, and what changed.

| # | Finding | Resolved |
|---|---|---|
| A | Go deeper on B1 started the lesson from the panel | Removed. On B1 the mentor stops at the offer; on A the lesson takes over with the answer's context. Noted in `ask-deeper-starting` and here |
| B | Step 1 named the edit | Now a read fact with an action (H-2): "Open Shake Control's Position expression and look at how it sets each hit's size: it uses the first hit's size for all three. Not something I teach yet." |
| 1 | No-comp-open state was removed | Restored as `home-nocomp` (no name; Ask paused, focusable, with the reason) and `ask-nocomp` (the read finds it, works today). Open question 10 |
| 2 | Home during a go-deeper lesson led to a live thread with Go deeper pressable | Home tab goes to `home-lessonopen-deeper`; the lesson's Back goes to `ask-lessonopen`; Go deeper becomes Back to your lesson while it's open and is gone after |
| 3 | No wrong-comp safeguard | The mentor's first line names the comp it read ("In Comp 1, rock.png rides on Shake Control…") |
| 4 | Steps looked like the mentor's prose | STEPS heading and list sit outside the prose, marked "Panel · from step data"; the mentor's prose has no steps; the hand-back is its own field. Described as decided, not open |
| 5 | Skill tags didn't wrap | `nowrap` removed; Go deeper buttons wrap too. Short tag names proposed above |
| 6 | Review/quiz feeling after Go deeper | Practice tag, "✓ Done", "Pivot moved, nothing else did.", divider "practiced on Shake Control"; `ask-deeper-notyet` for a miss. Open question 8 settled |
| 7 | Copy | Hint "Reads your comp. Changes nothing." in both files; dock header "From the answer. Knack doesn't track these."; "From your question. Back returns you to it." (no glyph named); hand-back ends like § 6 turn 2 |
| 8 | Accessibility | Ask uses `aria-disabled` with `aria-describedby`; the steps toggle has `aria-controls` and `aria-expanded`; STEPS is a heading labelling its section; a busy press keeps focus on the control or moves it to the status line |
| 9 | Long names cut with no fallback | Quiet line has a full-text tooltip; its accessible name is the full text; the ask card's reasons wrap instead of truncating |
| 10 | AE busy during an ask wasn't drawn | `ask-busy` |
| 11 | Notes | Answer about 121 words; box label "What do you want to know or change?"; the dock shows only the latest answer's steps; follow-up bar stays single-line, with why |

Kept, as the reviewer asked: the quiet line, `home-review-due` matching `home-return`, no dock and no Go
deeper when an answer has no steps, Go deeper inside its answer and never repeated, no "learned" or
"asked again" mark, paused controls saying why, "Back to your steps", and the hand-back that names the
next step.

### Spec 007 amendments spec 014 must carry

- **FR-006, the state table:** `home-cutoff` becomes `home-inprogress` (the quiet line); add
  `home-lessonopen-deeper`, `home-nocomp` and `home-thread`.
- **FR-007 and FR-009:** the Up next card is gone. Find my next lesson is Home's quiet line; Pick a skill
  is the Skills tab (and still on `lesson-picking`).
- **FR-010:** an empty record shows Find my next lesson (with "Welcome to Knack."), not Easing with Start
  lesson.
- **SC-010's state list:** the Home states change as above; add the ask states at the default dock and
  at 260 × 480.
- **T061's `home-first` note:** check for the ask card and Find my next lesson.
- **FR-008 still holds.**

## Accessibility

- **Contrast, dark:** spec 007's tokens, unchanged.
- **Contrast, light** (worked by hand from sRGB luminance; check with a tool before building): muted
  `#5c5c5c` on `#e3e3e3` (5.2:1) and `#ececec` (5.7:1), with body text `#2a2a2a` well above that; accent
  text `#0a58b5` 5.3:1 on `#e3e3e3`. `#0d66d0` failed at 4.3:1, so it isn't used for text. White on
  `#1473e6` is 4.5:1, the same as dark. ok `#0b6e4f` 4.9:1, bad `#b3261e` 5.1:1, warn `#7a5200` 5.4:1,
  placeholder `#6e6e6e` 4.8:1 on `#f7f7f7`.
- **Light theme in the built panel:** today's panel has no light theme. CEP gets AE's brightness from
  `AppSkinInfo`, and UXP from Spectrum's theme, so wire it through tokens only and keep it portable.
- **Not color alone:** the quiet line is set apart by position and rules, not blue. Paused controls say
  why in words. Explanation and steps differ by bullets versus numbers and the STEPS heading. The
  not-there-yet rows carry "!" and "Moved, about 40 px left".
- **Paused Ask:** `aria-disabled="true"`, not `disabled`, so it stays in the tab order; `aria-describedby`
  points at the reason on screen, or at "Type a question first." (screen-reader only) when the box is
  empty. A paused Go deeper works the same way.
- **Your steps:** the twirl-down is a button with `aria-expanded` and `aria-controls` pointing at the
  list. **STEPS** in the answer is a heading that labels its section.
- **Focus:** a press that pauses the panel keeps focus on the pressed control, or moves it to the status
  line (which announces what's happening); it never drops to the page. After an answer, focus moves to
  the mentor's turn, as in spec 007.
- **Keyboard:** Enter sends and Shift+Enter adds a line. Tabs use arrow keys. Go deeper, the Your steps
  twirl-down and "Earlier questions" are real buttons or `details`.
- **Sizes:** body 12 px, nothing under 11.
- **The ask box has a visible label**, not only a placeholder.

## Copy (panel words only)

New strings, plain, in spec 007's style: "Ask about the open comp", "What do you want to know or
change?", "Reads your comp. Changes nothing.", "Ask", "Asking…", "Type a question first.", "Reading the
open comp…", "Still reading the open comp…", "About the open comp", "The mentor is answering.", "Ask a
follow-up…", "Steps", "Your steps · 4", "From the answer. Knack doesn't track these.", "Go deeper: Set
the pivot ›", "Yes, go deeper on Set the pivot.", "From your question. Back returns you to it.", "Back to
your lesson ›", "Your Set the pivot lesson is open.", "Practice", "✓ Done", "Pivot moved, nothing else
did.", "Set the pivot · practiced on Shake Control", "Set the pivot · ended, not saved", "Back to your
steps ›", "Back to your question ›", "Earlier questions (1)", "Pick up Easing on Title", "Back to your
lesson", "Your lesson is open. Ask there, or end it first.", "No comp open. Open one, or click into its
timeline.", "Needs an open comp.", "After Effects is busy. Your answer will come when it's free.",
"Waiting for After Effects.", "See what's covered ›", "Not finished yet.", "Ask about your comp on Home,
or pick a skill.". The rest are spec 007's `panel/lib/copy.js` strings as they are. No internal field
names appear anywhere.

"Pivot moved, nothing else did." and the "practiced on Shake Control" divider are drawn from the
check's result for this lesson; each skill needs its own plain line, which the spec writer should list.

## Platform

Nothing new needs CEP. The ask card is a textarea and a button, the quiet line is a button, Your steps is
the checklist frame, and the thread is spec 007's chat. All of them map to Spectrum (textarea, action
button, accordion). `home-nocomp` needs one yes or no from the bridge's health check, which a UXP rebuild
would carry the same way.
