# Knack panel: ask-first Home and the Ask flow

**Status:** Design for spec 014 (`specs/014-ask-mentor/`), drawn together with spec 007's T061. Not built.
**Date:** 2026-11-14. **Revised the same day** after the builder's review (teaching design § 5.1 and § 19,
"Decided 2026-11-14, from the mockup review"). **Decided by:** `decisions/012` (Home opens ask-first) and
the teaching design's § 5 to § 7, § 9, § 11, § 12 and § 19.
**Builds on:** `product/mockups/ui-overhaul/` (spec 007). Same tokens, components and state names. This
is that Home evolved, not a new look. Anything not listed here works as spec 007 draws it.

## How to open it

Open `product/mockups/ask-mentor/index.html` in any browser. It's one file with no outside fonts, images
or scripts. It opens on **The ask flow, start to finish**, six panels at 260 × 480. The left rail lets you:

- jump to any state (each tagged **new**, **changed** from spec 007, or **same**)
- set the width (260 minimum, **343 default**, 420) and height (480, 680, 900)
- switch **dark** (AE's default) and **light**
- turn off auto-advance to study the loading states

**Open first:** `#flow`, `#all-homes`, `#cmp-before-after`, `#ask-answer`, `#ask-steps-open`,
`#ask-clarify`, `#ask-deeper-lesson`, `#ask-back`.

**Walk it by hand:** on `#home-return`, type anything and press Ask (or Enter). Any question gets Comp 1's
answer in this mockup, with your words in the bubble. Then Go deeper, Done check it, Back to your steps.
Find my next lesson walks T061's screens.

**Not run in a browser.** I have no shell, and the built-in browser can't open local files, so I read the
code back but never saw it on screen. Fit at 260 × 480 and the light theme's contrast are worked out by
hand, not checked.

### Sources

The main content is Comp 1 from the ask baseline (`discovery/usage-notes/ask-baseline.md`): rock.png on
the Shake Control null, Position and Rotation driven by expressions, Sweep Control's keys at 3.37 s and
3.54 s driving a CC Light Sweep on Black Solid 1. The questions are the builder's own from that session
(turns b and c). The clarifying and outside-the-six questions are invented. The record's dates and skills,
and the Easing on Title lesson in progress on Mentor Practice, are invented to show a state. Mentor text is
marked **Placeholder**: it belongs to `SKILL.md`, which must not copy example sentences (the pacing lesson).

### The Comp 1 answer (revised 2026-11-14)

Two parts, about 125 words. **What's going on** is explanation, and **the steps** are only things to do:

> rock.png rides on Shake Control, a null moved by expressions:
> - All three hits are the same size: the Position expression reuses the first hit's size.
> - The rotation is too small to read: 0.75° at most, gone in about a third of a second.
> - The turn centers on the rock, because Shake Control sits at its middle.
>
> 1. Open Shake Control's Position expression, find where it uses the first hit's size, and make each
>    hit use its own. Not something I teach yet.
> 2. Raise the amounts in Shake Control's Rotation expression.
> 3. Select Shake Control (the null, not a letter layer) and Pan Behind its pivot to where the hammer
>    hits. *Set the pivot*
> 4. Play it back and watch where the rock turns from.
>
> Want to go deeper on step 3 with *Set the pivot*?

The explanation's parts go in order of visible effect (§ 19). They're bullets, never numbered and never
docked. Each step starts with an action on a named layer or property. Step 1 says what to look at, not the
code edit (H-2). Step 3 names the null plainly, because the builder's own Pan Behind landed on O Shakers.

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
│ What do you want it to do?               │
│ [                                     ]  │
│ Reads your layers, then       [  Ask  ]  │
│ gives you steps. Your comp                │
│ isn't changed.                            │
└──────────────────────────────────────────┘
──────────────────────────────────────────
 Find my next lesson                      ›     ← or "Pick up Easing on Title ›"
──────────────────────────────────────────
```

- **The ask card** uses spec 007's lead card (blue edge). It names no comp; the panel doesn't read the
  project (decided 2026-11-14). The visible label is "What do you want it to do?". Ask is the one primary
  button, and it's off until there's text. Enter sends; Shift+Enter adds a line.
- **The quiet line** is a full-width row between two rules: not a card, not blue, not a primary button.
  It reads one of these, in order:
  1. **A lesson open in the panel:** "Back to your lesson", with End lesson under it (`home-lessonopen`).
  2. **A lesson in progress:** "Pick up Easing on Title" with its comp and progress, and Set it aside
     under it (`home-inprogress`, spec 007's `home-cutoff`). The comp here comes from the record, not
     from a read.
  3. **Otherwise:** "Find my next lesson" (`home-return`, `home-first`).
- **Nothing else from the record is on Home.** No due review, and no badge on the Skills tab.

### Asking

Ask switches the Home tab to the **thread**: ‹ · "Ask / About the open comp", the chat, **Your steps**
(only when the answer has steps), and a follow-up bar.

- **Reading** (`ask-reading`, `ask-reading-long`): a skeleton turn and "Reading the open comp…", then
  "Still reading the open comp…" after about 6 s.
- **The answer** (`ask-answer`): the explanation as plain bullets, then the numbered steps under a thin
  rule, with skill names in bold italics. Under the closing offer, inside the same message: **Go deeper:
  Set the pivot ›**, one per skill the answer offered (two at most). It's gray, not primary, because the
  usual choice is to go try the steps.
- **Go deeper lives inside its answer.** It scrolls away with the answer and never shows up again in a
  later turn, so after "just the steps" nothing on screen keeps offering (§ 5.4).
- **Your steps (decided 2026-11-14: keep):** docked under the chat in spec 007's checklist frame, folded
  behind a twirl-down at every height. It holds **only the steps**, never the explanation. **No glyphs,
  no ticks, ever**, with "Nothing here is checked." in its header (ask mode has no check, § 7.4). At tall
  docks it opens under the chat (38% cap); at short docks it swaps with the chat, as the checklist does.
  It opens itself once when you come back from a lesson.
- **No steps, no dock.** An answer with nothing actionable (a clarifying question, the outside-the-six
  line, a describe-the-comp answer) has no Your steps and no Go deeper: `ask-clarify`, `ask-outside`,
  `ask-new-question`.
- **Follow-ups and new questions** go in the same thread (§ 6 turns 3 and 7). A new question folds
  earlier ones into "Earlier questions (n)", as lessons fold earlier turns.
- ‹ goes to Home (`home-thread`), which adds one plain link: "Back to your question ›".

### Going deeper

- **Pressed** (`ask-deeper-starting`): "Yes, go deeper on Set the pivot." shows in the thread, the
  button reads Starting…, and the status line says what's happening. This is spec 007's Yes, let's go
  pattern.
- **The lesson** (`ask-deeper-lesson`): spec 007's lesson screen with three changes. A line under the
  header reads "From your question. ‹ takes you back to it." ‹ goes back to the thread, not to Home. Pick
  is already ticked, because the answer made the choice (§ 7.2). It opens on **Shake Control**, the layer
  that makes the motion. Its rows are K7's: "Pivot where the hammer hits · ? Your call" (rule 2), plus the
  rock and the ten letters staying put.
- **Passed** (`ask-deeper-passed`): the way out is **Back to your steps ›** (primary) in place of
  What's next ›.
- **Back** (`ask-back`): the thread with a divider for the lesson's result ("Set the pivot · review
  passed"), the mentor's one hand-back sentence ("That was step 3; next is step 4: play it back…"), and
  Your steps open.

### Asking again is normal

This learner passed the pivot on Door, and the panel shows nothing about that in the thread: no
"learned" mark on the skill tag or the button, no "asked again" count, no review prompt beside the
answer. The lesson's header shows ↻ review only because the tool's mode says so, which spec 007 already
does (§ 11, H-5).

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
| `home-unreadable`, `home-unreadable-why` | changed / same | Spec 007's banners over the new Home; asking works |
| `home-unreachable`, `home-busy` | changed | Spec 007's banners; the box still takes text, Ask paused with the reason |
| `home-loading` | same | Skeleton reshaped to one card and one line |
| `home-thread` | new | Home plus "Back to your question ›" |
| `ask-typing`, `ask-sending` | new | Text in, Ask turns on; Asking…, everything else paused |
| `ask-reading`, `ask-reading-long` | new | The question in the thread, a skeleton, "Reading the open comp…", then "Still reading…" |
| `ask-answer` | new | What's going on (bullets), four steps, Go deeper inside the answer, Your steps folded |
| `ask-followup`, `ask-steps-open` | new | A follow-up and its short answer; Your steps opened (steps only) |
| `ask-clarify` | new | One clarifying question naming two layers; **no steps, no dock** |
| `ask-outside` | new | The outside line; a quiet "See what's covered ›" to Skills; no dock, no Go deeper |
| `ask-unreachable` | new | Red connection mark, the mentor saying it can't see AE, Try again resends the question |
| `ask-new-question` | new | Earlier question folded; a describe-the-comp answer (Sweep Control) with no steps, so no dock |
| `ask-deeper-starting` | new | Go deeper pressed |
| `ask-deeper-lesson` | new | Lesson in context: Shake Control, from-your-question line, Pick ticked, K7 rows |
| `ask-deeper-passed` | changed (`lesson-passed`) | Back to your steps › in place of What's next › |
| `ask-back` | new | Divider with the result, the hand-back to step 4, Your steps open |
| `skills-due` | changed | Practice due line at the top with Warm up; memory moved here |
| `lesson-none` | changed | "Ask about your comp on Home, or pick a skill." |
| `lesson-picking`, `lesson-picked`, `lesson-continued` | same | T061's and spec 007's screens |

**Removed in this revision:** `home-nocomp` (it needed the comp's name, which the panel won't have), and
the `cmp-steps` side by side.

### States still missing

- **Turn 4, "done" / "it didn't work"**: a fresh read described, no verdict. It's an ordinary turn. The
  rule for the panel is that nothing in the thread or Your steps changes to ✓ or ✗.
- **Go deeper on a skill whose check can't see the target** (§ 7.3): the mentor offers nothing, so there's
  no button.
- **Ending the deeper lesson unfinished**: the divider reads "Set the pivot · ended, not saved". Described,
  not drawn.
- **The thread while a deeper lesson is open**: the follow-up bar should pause with "Your lesson is open.
  Ask there, or end it first." Not drawn.
- **Passing runtime errors during an ask** (offline, busy, rate limited): spec 007's notices, with "Your
  question's still here." in place of "Your lesson's still here." Not drawn.
- **Two Go deeper buttons** at 260 wide wrap to two lines; not drawn.

## Open questions

### Decided 2026-11-14 (builder's mockup review)

1. **The comp's name: decided, none.** The ask card reads "Ask about the open comp" everywhere, and no
   panel copy names a comp. Adding the active comp's name to the bridge's health check (an amendment to
   constitution II) waits until the sessions show the panel feels anonymous. The mentor's own words can
   still name the comp, from its read.
2. **Panel data: decided, as recommended.** The "asked" result carries the offered skills (two at most)
   and the step lines as data, so the panel never parses the mentor's prose. Go deeper and Your steps
   draw only from that. With no step lines there's no dock; with no offered skills there's no button, and
   typing "yes" still works. A requirement for the spec writer.
3. **Docked steps: decided, keep.** Folded under the chat behind a twirl-down. The alternative (steps only
   in the answer) is rejected and removed from the mockup.

### Still open, with recommendations

4. **Go deeper on B1.** A skill can't hand over on B1 (sprint 5 step 4). **Recommend** the same screens on
   both runtimes, as T061 does: on B1 the panel starts the lesson itself. The lesson then opens without
   the answer's context (it asks its own question), and the hand-back sentence won't come, but Back to
   your steps still works because the panel kept the thread. Check one go-deeper on A early, as the sprint
   plan says.
5. **`home-first` and FR-010.** An empty record used to show Easing with Start lesson, with no mentor turn.
   012 says Find my next lesson. **Recommend Find my next lesson**: one rule, and next-mentor will usually
   say Easing anyway. Spec 007's FR-010 and T061's note need amending.
6. **Tab name: Home or Ask?** **Recommend keeping Home**: it holds the lesson line too, and renaming
   changes spec 007's tests for little gain.
7. **Stop during a long read.** None is drawn. **Recommend** none for now; add Stop if the three sessions
   show reads past about 15 s.
8. **Does a go-deeper on a skill with a review due count as the review?** Drawn as yes (↻ review, Review
   passed) because the panel follows the tool's mode. **Recommend** the spec writer confirm. If it
   shouldn't count, the panel changes nothing; the tool's mode does.
9. **Memory on Home** (`#cmp-memory`). **Recommend A: move it to Skills.** 012 allows one quiet line, and
   "Next time: a keyed swing on Door" is a lesson nudge at the door.

**The call I'm least sure of now:** where the explanation stops and the steps start, visually. A thin
rule and bullets versus numbers is a quiet difference at 260 wide. If the sessions show people reading the
bullets as things to do, give the explanation a muted label ("What's going on") rather than numbering
anything. The other option is that label from the start, which costs one line and reads more like a
form.

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
  why in words. Explanation and steps differ by bullets versus numbers and a rule, not color.
- **Keyboard:** Enter sends and Shift+Enter adds a line. Tabs use arrow keys. Go deeper, the Your steps
  twirl-down and "Earlier questions" are real buttons or `details`. After an answer, focus moves to the
  mentor's turn, as in spec 007.
- **Sizes:** body 12 px, nothing under 11.
- **The ask box has a visible label**, not only a placeholder.

## Copy (panel words only)

New strings, plain, in spec 007's style: "Ask about the open comp", "What do you want it to do?", "Reads
your layers, then gives you steps. Your comp isn't changed.", "Ask", "Asking…", "Reading the open comp…",
"Still reading the open comp…", "About the open comp", "The mentor is answering.", "Ask a follow-up…",
"Your steps · 4", "From the mentor's answer. Nothing here is checked.", "Go deeper: Set the pivot ›",
"Yes, go deeper on Set the pivot.", "From your question. ‹ takes you back to it.", "Back to your steps ›",
"Back to your question ›", "Earlier questions (1)", "Pick up Easing on Title", "Back to your lesson",
"Your lesson is open. Ask there, or end it first.", "See what's covered ›", "Not finished yet.", "Ask
about your comp on Home, or pick a skill.". The rest are spec 007's `panel/lib/copy.js` strings as they
are. No internal field names appear anywhere.

## Platform

Nothing new needs CEP. The ask card is a textarea and a button, the quiet line is a button, Your steps is
the checklist frame, and the thread is spec 007's chat. All of them map to Spectrum (textarea, action
button, accordion).
