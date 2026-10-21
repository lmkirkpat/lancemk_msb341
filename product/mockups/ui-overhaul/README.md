# Knack panel: UI overhaul mockup

**Status:** Design proposal for `specs/007-ui-overhaul` (not written yet). Not built.
**Revision 2 (2026-10-20):** diagnosis screens redrawn against `specs/005-diagnosis` (draft) after
the design review. The rest has the review's fixes.
**Replaces:** the one-skill layout in `product/mockups/ae-panel.md` and `panel/` (spec 003).

## How to open it

Open `product/mockups/ui-overhaul/index.html` in any browser. It's one self-contained file with
no outside fonts, images or scripts. The left rail is for reviewers. It lets you:

- jump to any state
- set the panel width (260 px minimum, 320, 420) and height (480 short dock, 680, 900)
- switch Home between option A and option B
- turn off auto-advance to study loading states

Click inside the panel to walk the flows. Every button that does something shows it was pressed
(spinner plus a verb), pauses the others, and a status line says what's happening. Deep links
work, for example `index.html#diag-results` or `index.html#compare`.

Lesson and diagnosis data (layers, keys, times, findings) is real data from the **Mentor Practice**
comp, taken from `product/mockups/ae-panel.md`, `discovery/usage-notes/mentor-panel.md`,
`discovery/usage-notes/adobe-assistant-2026-10-08.md` and spec 005's table of what the mentor
reads. No snapshot or frame was attached, so frames are drawn sketches. Text marked
**Placeholder** is the mentor's voice, which belongs to `SKILL.md` (and, for diagnosis, the
`teaching-design.md` spec 005 open question 4 asks for). Skill names other than Keyframes and
Easing are placeholders until spec 004 lands.

## What this redesign removes

| Today (spec 003) | In the overhaul | Why |
|---|---|---|
| One screen: path, stage, chat, check, buttons, ask, memory, all stacked | Three tabs: **Home**, **Lesson**, **Skills** | Eleven skills, diagnosis and practice don't fit on one stacked screen at 260 px |
| The fixed 4-item "Path · Motion basics" row | **Skills** tab, grouped, with a state per skill | A one-line path doesn't scale past about 5 skills |
| Memory strip with only the latest lesson | Memory under Home's cards, plus per-skill history in Skills | Memory is a core difference; one line hides it |
| The check list appears only after the first check | A **checklist** docked above the buttons from the opening, rows **Proposed** until the focus is accepted | The usage notes say the check list helped most |
| Header line "Knack · lesson open" | Tab bar with a connection mark (dot or ring, plus a word) | Connection is always visible without taking a row |
| Developer error copy ("Run `bash panel/install.sh`", "Open Terminal and run `claude`") | Plain copy for installer users | The installer audience isn't developers |
| Silent when a lesson was lost to an AE restart | One dismissible note on Home | Today you just get a fresh start with no reason given |

Kept: the I do / We do / You do stage, the button set (Show me → Show me again, Check my work,
Hint from the first check on), the "outside this lesson" list, the stale list, the tool-based
status lines, and **Ask the mentor** (spec 003 FR-008), moved below the buttons.

## Structure

```
┌ Knack ─────────────────── ≡ ┐   AE panel tab and flyout
│ Home  Lesson•  Skills   ● AE│   tabs · connection (dot/ring + word)
├─────────────────────────────┤
│ [banner: only when needed]  │
│  HOME (A)                   │   LESSON                       DIAGNOSIS
│  ┌ Up next ──────────────┐  │   ‹ Lesson · Easing  check 2   ‹ What's wrong here?
│  │ Graph Editor          │  │   [I do ✓][We do ✓][You do ●]  Just now · Mentor Practice
│  │ why + "Oct 7 · Mentor │  │   ┌ chat (the only part that   1 Linear pairs  Style
│  │ Practice · not re-    │  │   │ shrinks) ───────────┐      [Learn: Easing] Start here
│  │ checked"              │  │   └─────────────────────┘      2 Every move 1 s  Style
│  └───────────────────────┘  │   ▾ 1 of 3 yours · 2 to go     [No lesson yet · Get hints]
│  ? A question from last look│   status line                  3 Motion ends by 3 s  Style
│  ↻ Practice due             │   [Check my work][Hint][…]     [See the other 4 ›]
│  What's wrong here? [symptom]│  [Ask the mentor…        ⏎]   Couldn't check: …
│  What the mentor remembers  │                                Looked only: no changes.
└─────────────────────────────┘
```

## User flows

State ids match the mockup's rail.

### 1. First run after install

- **In:** the panel opens for the first time after the installer.
- **Steps:** `setup-welcome` → `setup-checking` → `setup-signin` → `setup-ready` → `home-first`.
- **Failure exits:**
  - `err-notsetup`: install incomplete. **Open the install instructions** opens them in the browser.
  - `err-mentor`: the mentor can't start, or you were signed out.
  - `home-unreachable`: no AE.

### 2. Picking a skill, or being recommended one

- **Recommended:** Home's **Up next**. Its skill and reason come from the mentor, through the
  record. When the reason quotes a diagnosis, it's a *style* finding, dated and tied to its comp
  ("Oct 7 · Mentor Practice · not re-checked"). An *ask* finding never becomes a reason until the
  learner answers it. Until then it's its own card, **A question from your last look**.
- **From a diagnosis:** **Learn: skill ›** on a finding a skill covers. The finding's layer is the
  proposed focus (spec 005 FR-012).
- **Yourself:** **Pick another skill**, or the Skills tab → `skill-detail` → **New lesson** or
  **Warm up**.

### 3. Starting a lesson

1. `lesson-starting`: buttons paused, with the reason in words.
2. `lesson-open`: I do. The checklist rows say **Proposed** until the learner's next turn accepts
   the focus.
3. **Show me** → `lesson-demo`: We do. The one change sits in its own "Changed in your comp" box,
   with the Undo route, and the button becomes **Show me again**.
4. **Check my work** → `lesson-partial`: You do, and Hint appears.
5. Repeat until `lesson-passed`.

Side states at any check: `lesson-outside`, `lesson-stale` (Hint paused: "Hint needs After
Effects"), `lesson-othercomp`, `lesson-error`, `lesson-error-demo`.

**‹ in a lesson** goes Home, and the lesson stays open (`home-lessonopen`). Home then shows
**Lesson in progress** with **Back to lesson** and **End lesson**. Start lesson, Warm up, the
question card and **Look at my comp** are replaced by "Available after your lesson", so two lessons
never run at once. The Lesson tab always goes to the open lesson. With no lesson it shows
`lesson-none`, which says why and offers two ways to start, instead of a disabled tab.

### 4. Continuing a lesson

- **Panel closed mid-lesson, same AE session:** `home-cutoff`. **Your lesson is waiting** sits on
  top. Up next is pushed back: dashed, not faded, and its Start isn't the primary button.
  - **Continue** → `lesson-continued`.
  - **Start fresh** → Home. The record is kept.
- **AE quit instead:** `home-aeclosed`, a one-time note.
- **Mentor cut off mid-answer:** `lesson-error`. **Try again** resends the same request, with one
  exception (`lesson-error-demo`):
  - If **Show me** was cut off after its change came back, the retry button reads **Show me
    again**, so a retry can never ask for a second demo.
  - If it was cut off before any result, the panel can't know whether the pair was eased. It
    offers **Check my work**, which reads the comp.

### 5. "What's wrong here?" (spec 005, US1 reads)

- **In:** Home's card (A) or the main button (B). Both have an optional **What looks off?** input.
  - Empty → `diag-running` → `diag-results`.
  - With a symptom → `diag-symptom-running` → `diag-symptom-results` (findings on that layer
    rank first, FR-008), or `diag-symptom-none` ("Nothing it can read explains that").
- **First answer, `diag-results` (FR-007):**
  - A dated and scoped line ("Just now · Mentor Practice · 7 things found").
  - The mentor's short read (placeholder).
  - At most **3 ranked findings**, one marked **Start here**, then **See the other 4 ›** and
    "Includes 2 questions for you."
  - Each finding has a **kind** (Style, ? Question; Setting arrives with US4) and *where*.
  - Its action:
    - **Learn: Easing ›** when a skill covers it.
    - **No lesson yet · Get hints ›** when none does (FR-013). This is the usual case until spec
      004 lands.
    - Style findings also offer **That's on purpose** (FR-016).
- **`diag-rest`:** findings 4 to 7, numbered on, never repeating the top 3. The two ask
  findings are questions with answer buttons:
  - "Cursor fades: meant to blink?" → **Meant to fade** / **Meant to blink**.
  - "Logo's Rotation has an expression on its keys: what's it for?" → **The spin is on purpose**
    / **Not sure**.
  - Neither is called a mistake, and nothing says keys "do nothing" (FR-006, Edge Cases).
- **Hints → do it → re-check:**
  1. `diag-hints`: **Where to look** (panel, layer, property, time) plus the mentor's hint.
  2. **Done, check it** re-reads the comp, never answering from the earlier read (FR-014). The
     result is one of:
     - `diag-recheck-gone`
     - `diag-recheck-still`
     - `diag-recheck-changed`
  3. Each re-check result also lists what's still open.
- **On purpose:** `diag-intended`. It's dropped for this comp and won't come up again there.
- **Couldn't check (FR-004), on every answer:**
  - inside the Icon precomp
  - motion that comes only from an expression
  - parenting (not read yet)
  - motion blur switches (not read yet)
  - Old Take (hidden, set aside)

  US4's two findings (parenting overlap, motion blur) are left out of the main state. When US4
  ships, they join the findings and leave this list.
- **Again on the same comp, `diag-again` (FR-019):** **Since Oct 7** shows what looks fixed,
  what changed (linear pairs 11 → 7 after the Title lesson), and what was marked on purpose. Then
  the still-open top 3.
- **Other comp:** `diag-othercomp`: "This isn't the comp from last time." It doesn't show the
  remembered findings, and asks which comp you mean.
- **Failures:** `diag-nocomp`, `diag-unreachable`, `diag-busy`, `diag-error` (cut off or failed:
  nothing half-read is shown), and `diag-stopped` (after **Stop looking**).
- Every diagnosis answer ends "Looked only: no changes were made." The source is the turn's
  tool stream: no tool that changes anything ran (see the data list below).

### 6. Finishing a lesson, and progress across many skills

`lesson-passed` shows the **Lesson passed** banner and **Saved to your history**, which appears
only once the record is written. Two ways out: **Up next: skill ›** and **See your skills**.
Progress lives in the Skills tab:

- `skills-few`: a week in.
- `skills-many`: learned ✓, practice due ↻, getting rusty ◔, in progress ◐, up next ▸, not
  started ○, coming later.

### 7. Memory and practice over sessions

- Home shows **What the mentor remembers** and a **Practice due** card.
- `skill-detail` lists each lesson, read-only.
- **Warm up** → `practice`. What a warm-up contains is the curriculum's call.
- A remembered diagnosis always carries its date, comp and "not re-checked" until the mentor reads
  the comp again.

## Home screen: two options

Side by side at `#compare`, with the trade-off table.

**A. Path-first.** The cards, in order:

1. **Up next**, with a dated reason.
2. A question from the last look, if there is one.
3. **Practice due**.
4. **What's wrong here?**, with an optional symptom.
5. Memory.

**B. Diagnose-first.** **Look at my comp** with a symptom input on top. On return, the **Last
look** card (dated, comp, not re-checked, top 3 plus a count) doubles as the to-do list.

| | A · Path-first | B · Diagnose-first |
|---|---|---|
| Who leads | The mentor (`decisions/002`) | The learner, by asking: closer to Adobe's assistant used on request |
| Evidence for | The mentor-chosen focus worked in every panel session; the check list next to the comp helped most | Interview 007: finding what broke was the biggest time sink; belief 1 |
| Cost and speed to open | Free and instant, from the local record | A fresh look is a whole-comp turn whenever the comp changes. Not measured; spec 005 SC-004 allows 30 s |
| Works before diagnosis ships | Yes | No, and until spec 004 most findings have no lesson, only hints |
| Main risk | Feels like a course menu if Up next ignores what's on screen | Goes head-on with Adobe's strength; memory and practice pushed down |
| Mitigation | Up next quotes a dated style finding | "Last look" from saved data, dated, so a return visit costs nothing |

**Recommendation: A, path-first.** It keeps the mentor leading, opens instantly at no cost, and
doesn't depend on diagnosis or the curriculum shipping first. B's strength (your comp is the
hook) is kept by the diagnosis card and by Up next quoting the last look.

**Two caveats from the design review:**

1. **"People press Look at my comp first" is a biased signal on A.** Diagnosis is A's third card
   (fourth when there's a question), so that count undercounts it. A fair test puts both starts
   above the fold at 480 px, or gives some learners B.
2. **Spec 005 open question 2 has to be reconciled with A before spec 007.** That question
   recommends a short diagnosis opening when a session starts without a named skill. On A, that
   could be:
   - the **Start lesson** turn opening with one or two diagnosis sentences, or
   - a lesson that doesn't start until the learner picks.

   The two can't both be the default. This decision belongs to the cockpit with the curriculum
   designer. It changes what Start lesson sends, and every opening's eval cases.

## Every state

Source: **R** = learner record (local, read-only), **P** = the panel's own files, the bridge check
or the turn's tool stream, **T** = a mentor tool result (structured), **M** = the mentor's words.

| Id | State | Trigger | What shows | Source |
|---|---|---|---|---|
| `setup-welcome` | First run | First open after install | 3 steps, Get started | P |
| `setup-checking` | Loading | Looking for AE | Spinner on step 1, status line | P |
| `setup-signin` | Sign in | AE found | Sign in; pressed: "Waiting for your browser…" | P |
| `setup-ready` | Ready | Signed in | Steps done, "open a comp" advice | P |
| `err-notsetup` | Error | Install incomplete | Red banner, Open the install instructions | P |
| `err-mentor` | Error | Not signed in, failed to start, exited | Red banner; Home actions say "Needs the mentor." | P |
| `home-loading` | Loading | Record read > 300 ms | Skeleton cards | R |
| `home-first` | Empty | No record | Up next = first skill, diagnosis card, "No lessons yet" | R |
| `home-return` | Normal | Record exists | Dated Up next, question card, Practice due, diagnosis, memory | R |
| `home-lessonopen` | Lesson open | ‹ from a lesson | Lesson in progress; other starts replaced by "Available after your lesson" | P |
| `home-cutoff` | Partway | Unfinished lesson, same AE session | Lesson waiting on top, Up next dashed | P |
| `home-aeclosed` | Info | Unfinished lesson, AE restarted | One-time note | P |
| `home-unreachable` | Can't connect | Bridge unreachable | Red banner; AE actions replaced by "Needs After Effects." | P / T |
| `home-busy` | AE busy | Rendering or a dialog | Amber banner | T |
| `home-unreadable` | Error | `RECORD_UNREADABLE` | Amber banner, "set aside, nothing's lost" | T |
| `homeB-first`, `homeB-return` | Option B | Same | Diagnose-first; dated Last look, top 3 + count | R / T |
| `diag-running` | Working | Look at my comp | Tool status lines, Stop looking | P (tool names) |
| `diag-symptom-running` | Working | Look with a symptom | "You said …" plus status | P |
| `diag-results` | First answer | Look returns | Scope line, mentor read, top 3 with kind and action, count, Couldn't check | T + M |
| `diag-rest` | The rest | See the other 4 | Findings 4–7, ask findings as questions | T |
| `diag-intended` | On purpose | Marked as on purpose / an "on purpose" answer | Info banner, still open | T |
| `diag-hints` | No lesson yet | Get hints / Meant to blink / Not sure | Where to look, mentor hint, Done, check it | T + M |
| `diag-recheck-gone` / `-still` / `-changed` | Re-check | Done, check it | Fresh read: the finding's state, still open | T + M |
| `diag-symptom-results` | Symptom | Symptom matches findings | Findings on that layer first | T + M |
| `diag-symptom-none` | Symptom | Nothing explains it | "Nothing it can read explains that" | T + M |
| `diag-clean` | Empty | No findings | Scope line, Couldn't check | T + M |
| `diag-again` | Since last time | Look again, same comp | Fixed / fewer / on purpose, then still open | T + R |
| `diag-othercomp` | Other comp | Active comp ≠ last look's | Amber banner, which comp? | T + R |
| `diag-nocomp` | Error | No active comp | Amber banner, Try again | T |
| `diag-unreachable` | Can't connect | AE unreachable mid-look | Red banner, no claims | T |
| `diag-busy` | AE busy | AE busy mid-look | Amber banner | T |
| `diag-error` | Cut off | Timeout, exit, dropped turn | Notice, nothing partial, Try again | P |
| `diag-stopped` | Stopped | Stop looking | Nothing partial, Look again | P |
| `skills-empty` / `-few` / `-many` | Progress | Record | Grouped skills, glyph + word | R |
| `skill-detail` | Memory | Pick a skill | History, Warm up / New lesson; ‹ "Back to Skills" | R |
| `lesson-none` | Empty | Lesson tab, no lesson | Why, and Go to Home / Pick a skill | P |
| `lesson-starting` | Loading | Start lesson | Skeleton, status, buttons paused with reason | P (tool names) |
| `lesson-open` | I do | Opening returns | Mentor, frame, checklist **Proposed** | M + T |
| `lesson-demo` | We do | Show me | "Changed in your comp", before/after, Show me again | T + M |
| `lesson-partial` | You do | Check, not passed | Checklist rows, Hint | T |
| `lesson-outside` | You do | Edit outside the focus | "Outside this lesson · not counted" | T |
| `lesson-stale` | Can't connect | AE unreachable mid-lesson | Notice, list marked, Hint paused "Hint needs After Effects." | T |
| `lesson-othercomp` | Error | Different comp active | Mentor asks to switch back, list marked | T + M |
| `lesson-error` | Cut off | Timeout, exit, dropped turn | Partial reply "cut off", Try again | P |
| `lesson-error-demo` | Cut off | Cut off during Show me | Show me again, not a resend | P + T |
| `lesson-continued` | Partway | Continue lesson | Redrawn, divider, missing frame note | P |
| `lesson-passed` | Done | Check passes and record written | Banner, Saved, Up next / See your skills | T |
| `practice` | Practice | Warm up | Practice tag, Proposed rows | T + M |
| any | Narrow / short | 260 px wide, 480 px tall | Wraps; only the chat shrinks; checklist capped at 30% | — |
| any button | Pressed | Any action | Spinner, verb, others paused, status line | P |

## States still missing

- **Learner says "fix all of it"** in Ask during a diagnosis (FR-015). It's handled in the mentor's
  words; the panel shows a normal reply. There's no panel state, deliberately, so there's no button
  that could ask for it.
- **A pattern across sessions** (spec 005 US3-3, FR-020), for example "every move the same length,
  on two projects", as an Up next reason. Not drawn, because US3 is held until SC-009.
- **Huge comp** (diagnosis slow but within 30 s), and what **Stop looking** reports if the mentor
  had already found something.
- **record_lesson failed** after a passing check (needs the signal below).
- **Ask the mentor outside a lesson or a diagnosis.**
- **Out of credit or rate-limited**, updates, uninstall.
- **AE's lighter brightness settings**, Windows, a second AE project open.
- **Track mattes:** a hidden layer that may be a matte (spec 005 Edge Cases). Today it reads
  "hidden, set aside"; it should say it may be a matte once the mentor can tell.

## What the panel needs from the mentor (for the spec writer)

The panel only displays, so all of this has to arrive as data. Items marked **eval** need an eval
case, because they change what the mentor is asked or how it answers.

**Diagnosis result (one structured result per look, like `diff_since_last` today):**

1. Per finding: **rank**, **kind** (style / ask / setting), **state** (open, fixed, changed,
   intended), the learner-facing title and *where*, the layer to use as the lesson focus (FR-012),
   and the covering skill id or none.
2. **The count beyond the first 3**, and how many of those are ask findings.
3. **The comp's id and name, and the read's date and time**, so a remembered look can be dated and
   tied to its comp, and the panel can show `diag-othercomp`.
4. **A structured not-checked list** (what, and why: precomp, expression-only, not read yet,
   hidden).
5. **Where to look** for findings without a skill: panel, layer, property, time.
6. **The symptom echo**, and whether any finding matched it (`diag-symptom-none`).
7. **Re-check result** per finding (gone / still / changed) plus the still-open list, from a
   fresh read (FR-014).
8. **"Since last time"** on a repeat look (FR-019).

**"Looked only: no changes were made":** the panel can back this from the turn's tool stream (no
change tool ran). If the spec writer doesn't want the panel to depend on tool names for it, the
copy should soften to "It only looks" (no claim about this turn).

**Learner record:**

9. **Up next and its reason**, including the source finding, its date and its comp. Today the
   record has only a free-text `next` note.
10. A **learner-facing next note**. Today's `next` is written for the mentor ("check key
    selection before F9").
11. **Practice due / getting rusty** per skill, and the **warm-up's expected length** ("about 2
    min").
12. **Open questions** from the last look (unanswered ask findings), so Home can show the
    question card.

**Lesson:**

13. **Lesson title, focus and skill**, and a **practice flag** (lesson or warm-up), for the header
    and Home's cards.
14. **The proposed focus rows at the opening**, and when they're accepted.
15. **A `record_lesson` failed signal**, so "Saved to your history" never shows without a save.

**Status lines:** a tool → status-line mapping for the diagnosis tools ("Reading your whole
comp…" and any others), same as `panel/lib/activity.js`. A line may only claim what its tool does.

**New fixed requests (each needs an eval case):**

- Look at my comp (with and without a symptom)
- Learn from a finding (skill + focus layer)
- Get hints on a finding
- Done, check it
- That's on purpose
- Answer to an ask finding (each answer)
- Look at this comp instead (`diag-othercomp`)
- Warm up
- Continue lesson (exists)
- Start fresh
- End lesson
- Try again (resends the last request, but becomes Show me again after a cut-off Show me)
- Stop looking (ends the turn; check nothing is recorded)

## Accessibility

- **Contrast:** two tokens from `panel/panel.css` change (muted `#8a8a8a` → `#9a9a9a`, red
  `#e5534b` → `#ff7b72`), and the filled primary button uses `#1473e6`. The stale-list note stays
  at full contrast; only its rows dim to 70%. A pushed-back card is dashed, not faded, so its
  buttons keep their contrast.
- **Not colour alone:** every state has a glyph and a word. Practice due ↻ and getting rusty ◔
  differ in glyph too. Ask findings have a dashed border and "? Question". The connection mark
  changes shape.
- **Sizes:** body 12 px, nothing under 11 px (tags, "Mentor", the placeholder label raised from
  10.5).
- **Tabs:** a real tablist (`role="tab"`, `aria-selected`, `aria-controls`) with a tabpanel,
  roving tabindex, and Left / Right / Home / End. No tab is disabled; the empty Lesson tab says
  why in visible text.
- **Focus after a re-render:** after a tab, focus stays on the tab. After an action, it moves to
  the newest mentor message or notice, else the banner, else the screen's title, so screen
  readers hear what changed. Each ‹ says where it goes ("Back to Home. Your lesson stays open.",
  "Back to Skills", "Back to the top 3").
- **Paused buttons say why** in words ("Hint needs After Effects.", "Available after your
  lesson.", "Buttons wake up when the mentor has looked.").
- **Short docks:** only the chat shrinks. At 480 px tall the checklist caps at 30% and padding
  tightens, so buttons and Ask are never clipped.
- **Motion:** spinner slows and skeletons stop with reduced motion.

## Copy

Product copy follows CLAUDE.md "Voice": "Undo the tutorial spiral.", "Your comp, your classroom.",
"Smooth landing. Lesson passed.", "Nothing's jumping out." Errors stay plain and say what to do.
Finding titles are catalogue wording (data), written as plain statements or questions, never as
"mistake" and never "does nothing". Everything the mentor says is a placeholder.

## Open questions

1. **Spec 005 open question 2 vs. option A** (above): who decides what Start lesson opens with?
2. **Diagnosis cost and speed** per look: this decides whether B is affordable at all.
3. **Checklist from the opening** needs the focus rows as data (item 14). Worth the tool change?
4. **Keep Ask the mentor?** It's still open from `ae-panel.md`.
5. **Before/after frames vs. a moving demo** (interview 004's "mouse on a screen moving").
6. **Recovering an unreadable history:** what does **What happened?** lead to?
7. **Sign-in model** (`decisions/005` option A) shapes setup and `err-mentor`.
8. **End lesson:** does ending an unfinished lesson record anything (spec 003 says nothing is
   recorded for an unfinished lesson)? The mockup says it isn't saved.
9. **UXP port:** tabs, cards, in-line alerts and the progress circle map to Spectrum components.
   Nothing here needs CEP beyond what the panel already uses.
