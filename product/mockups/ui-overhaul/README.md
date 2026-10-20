# Knack panel: UI overhaul mockup

**Status:** Design proposal for `specs/007-ui-overhaul` (not written yet). Not built, not reviewed.
**Replaces:** the one-skill layout in `product/mockups/ae-panel.md` and `panel/` (spec 003).
**Date:** 2026-10-20 (Sprint 3, parallel run 1, wave 1).

## How to open it

Open `product/mockups/ui-overhaul/index.html` in any browser. It's one self-contained file with
no fonts, images or scripts from outside it. The left rail is for reviewers: jump to any state,
switch the panel width (260 px minimum, 320, 420), switch the home screen between option A and
option B, and turn auto-advance off to look at loading states. Click inside the panel to walk
the flows. Every button that does something shows it was pressed (spinner plus a verb) and a
status line says what's happening before it moves on. Deep links work, for example
`index.html#lesson-partial` or `index.html#compare`.

Lesson content (layers, keys, times, diagnosis findings) is real data from the **Mentor
Practice** comp, taken from `product/mockups/ae-panel.md`, `discovery/usage-notes/mentor-panel.md`
and `discovery/usage-notes/adobe-assistant-2026-10-08.md`. No snapshot or frame was attached to
this task, so frames are drawn inline as sketches. Text marked **Placeholder** is the mentor's
in-lesson voice, which belongs to `SKILL.md`. Skill names other than Keyframes and Easing are
placeholders until the curriculum spec decides them.

## What this redesign removes

| Today (spec 003) | In the overhaul | Why |
|---|---|---|
| One screen: path, stage, chat, check, buttons, ask, memory, all stacked | Three tabs: **Home**, **Lesson**, **Skills** | Eleven skills, diagnosis and practice don't fit on one stacked screen at 260 px |
| The fixed 4-item "Path · Motion basics" row | **Skills** tab, grouped, with a state per skill | A one-line path doesn't scale past about 5 skills |
| Memory strip with only the latest lesson | Memory under Home's cards, plus full per-skill history in Skills | Memory is a core difference; one line hides it |
| The check list only appears after the first check, between chat and buttons | A **checklist** docked above the buttons from the opening, collapsible | The usage notes say the check list helped most |
| Header line "Knack · lesson open" | Tab bar with a connection mark (dot plus word) | Connection is always visible without taking a row |
| Developer error copy ("Run `bash panel/install.sh`", "Open Terminal and run `claude`") | Plain copy for people who used the installer | The installer audience isn't developers |
| Silent when a lesson was lost to an AE restart | One dismissible note on Home | Today you just get a fresh start with no reason given |

Kept as is: the I do / We do / You do stage, the button set (Show me → Show me again, Check my
work, Hint from the first check on), the "outside this lesson" list, the stale greyed list, the
tool-based status lines (`panel/lib/activity.js`), and **Ask the mentor** (spec 003 FR-008). Ask
moves below the buttons as a lighter single line.

## Structure (rough, agreed before the HTML)

```
┌ Knack ─────────────────── ≡ ┐   AE panel tab and flyout
│ Home  Lesson•  Skills   ● AE│   tabs · connection (dot + word)
├─────────────────────────────┤
│ [banner: only when needed]  │   can't see AE / busy / history unreadable / AE quit
│                             │
│  HOME (option A)            │   LESSON                     SKILLS
│  ┌ Up next ──────────────┐  │   ‹ Lesson · Easing  check 2  0 of 11 ▮▮▯▯▯▯
│  │ Hold keys             │  │   [I do ✓][We do ✓][You do ●] Motion basics
│  │ why: from your comp   │  │   ┌ chat (scrolls) ───────┐   ✓ Keyframes
│  │ [Start lesson] [Pick] │  │   │ mentor · frames       │   ↻ Easing  due
│  └───────────────────────┘  │   │ "Changed in your comp"│   ▸ Hold keys next
│  ┌ ↻ Practice due ───────┐  │   └───────────────────────┘   ○ Graph Editor
│  │ Easing [Warm up]      │  │   ▾ 1 of 3 yours · 2 to go    ...
│  └───────────────────────┘  │     Title › Position ✗ Still linear
│  ┌ What's wrong here? ───┐  │     Title › Scale    ◐ Half eased
│  │ [Look at my comp]     │  │   status: Checking your keyframes…
│  └───────────────────────┘  │   [Check my work][Hint][Show me again]
│  What the mentor remembers  │   [Ask the mentor…            ⏎]
└─────────────────────────────┘
```

## User flows

Each flow lists the ways in, what happens, and the ways out. State ids match the mockup's rail.

### 1. First run after install

- **In:** the panel opens for the first time after the installer (Window › Extensions › Knack).
- **Steps:** `setup-welcome` → `setup-checking` (looks for AE) → `setup-signin` (pressed state
  waits for the browser) → `setup-ready` → `home-first`.
- **Out:** Home (first run). Failure exits: `err-notsetup` (install incomplete), `err-mentor`
  (can't start or signed out), `home-unreachable` (no AE).
- **Note:** step 3 ("open a comp") is advice, not a check. The panel never reads the project, so
  it can't confirm a comp until the mentor looks.

### 2. Picking a skill, or being recommended one

- **Recommended:** Home's **Up next** card (`home-first`, `home-return`). Its skill and its reason
  come from the mentor, through the learner record (the next skill, or the last diagnosis). The
  reason quotes the comp when there's a diagnosis ("the Cursor fades when it should blink").
- **From diagnosis:** each finding has a **Learn: skill** chip (`diag-results`).
- **Picking yourself:** **Pick another skill** or the Skills tab (`skills-empty`, `skills-few`)
  → `skill-detail` → **New lesson** or **Warm up**.
- **Out:** `lesson-starting`.

### 3. Starting a lesson

`lesson-starting` (tool status lines, skeleton, buttons paused) → `lesson-open` (I do, mentor
opening with a frame, checklist with the focus pairs "not checked yet") → **Show me** →
`lesson-demo` (We do, the one change stated in its own "Changed in your comp" box with the Undo
route, before/after frames, button now **Show me again**) → **Check my work** → `lesson-partial`
(You do, Hint appears) → repeat → `lesson-passed`. Side states at any check: `lesson-outside`,
`lesson-stale`, `lesson-othercomp`, `lesson-error`.

### 4. Continuing a lesson

- **In:** the panel was closed mid-lesson in the same AE session. Home shows **Your lesson is
  waiting** above Up next (`home-cutoff`), with where you were (stage, how many yours eased,
  when).
- **Continue** → `lesson-continued`: earlier messages redrawn, a divider "Picked up where you left
  off", missing frames say so, the checklist is greyed "from before the break" until the next check.
- **Start fresh** → Home, record kept.
- **AE quit instead:** no continue (spec 003 edge case 10), and Home says so once
  (`home-aeclosed`).
- **Mentor cut off mid-answer** (timeout, crash): `lesson-error` keeps the partial reply marked
  "cut off" and offers **Try again**, which resends the same request.

### 5. "What's wrong here?" (light diagnosis)

- **In:** Home card (option A) or the main button (option B).
- **Steps:** `diag-running` (one mentor turn; lines from the tools running; **Stop looking**) →
  `diag-results`: a short mentor read (placeholder), then numbered findings, each with *where*
  and *which skill*. The mentor's pick is marked **Start here**. Findings the mentor can read and
  Adobe's assistant couldn't on 2026-10-08 (linear vs eased) carry an **only Knack** tag.
  **Couldn't check** lists what was skipped (precomps, hidden layers: the overlap list in
  CLAUDE.md). It always ends "Only looked. Nothing in your comp changed."
- **Other outcomes:** `diag-clean` (nothing found), `diag-nocomp` (no active comp), AE busy or
  unreachable (same banners as Home).
- **Out:** a lesson via a chip or **Start with Easing**, or back to Home.

### 6. Finishing a lesson, and progress across many skills

- `lesson-passed`: all three stages done, a **Lesson passed** banner, **Saved to your history**
  (shown only after the record is written), the checklist collapsed to its summary, and two ways
  out: **Up next: skill ›** (Home) and **See your skills**.
- Progress lives in the Skills tab: `skills-few` (a week in, matches today's record) and
  `skills-many` (a few weeks in: learned, practice due, getting rusty, in progress, up next, not
  started, coming later). Each state has a glyph **and** a word.

### 7. Memory and practice over sessions

- Home shows **What the mentor remembers** (last lesson and its next note, same as spec 003 FR-011)
  and a **Practice due** card when the record says a skill is due.
- `skill-detail` lists every lesson for that skill with its result and next note, read-only, with
  "only the mentor writes it."
- **Warm up** starts `practice`: labelled as practice (tag and kicker), on the learner's current
  comp. What a warm-up contains is the curriculum designer's call; the mockup shows only that it
  looks different from a lesson.

## Home screen: two options

Side by side in the mockup at `#compare`, with the trade-off table.

**A. Path-first.** The mentor leads. One **Up next** card with its reason, then **Practice due**,
then **What's wrong here?** as a door, then memory.

**B. Diagnose-first.** The comp leads. One big **Look at my comp** button. On return, the last
look's findings double as the to-do list (learned or not). Practice and the skill list are below.

| | A · Path-first | B · Diagnose-first |
|---|---|---|
| Who leads | The mentor (`decisions/002`: leading is a core difference) | The learner, by asking: closer to Adobe's assistant used on request |
| Evidence for | The mentor-chosen focus worked in every panel session; the check list next to the comp helped most | Interview 007: finding what broke was the biggest time sink, and their first imagined ask was "what's the problem here?" Belief 1 |
| Cost and speed to open | Free and instant, built from the local record. No mentor turn until a button is pressed | A fresh look is a whole-comp mentor turn whenever the comp changes. Not measured; a lesson averages $0.38 |
| Works before diagnosis ships | Yes: diagnosis is one optional card | No: diagnosis is the front door, and it's the newest, least-tested capability |
| Main risk | Feels like a course menu if Up next ignores what's on screen | Goes head-on with Adobe's strength (8 causes on 2026-10-08) and pushes memory and practice down |
| Mitigation | Up next quotes the comp when a diagnosis exists | Show "Last look" from saved data so a return visit costs nothing |

**Recommendation: A, path-first.** It keeps the mentor leading, which is the one difference
Adobe can't claim today. It opens instantly and costs nothing. And it doesn't depend on diagnosis
shipping first. B's real strength (your comp is the hook) is kept in two ways: the diagnosis card
is always on Home, and Up next quotes the last diagnosis. If target-market learners on the panel
press **Look at my comp** first more often than **Start lesson**, that's the signal to switch to B.

## Every state

Source: **R** = learner record (local, read-only), **P** = panel's own files or bridge check,
**T** = a mentor tool result (structured), **M** = the mentor's words. The panel holds no
teaching logic (`decisions/005`, constitution II), so every row names where its data comes from.

| Id | State | Trigger | What shows | Source |
|---|---|---|---|---|
| `setup-welcome` | First run | First open after install | 3 steps, Get started | P |
| `setup-checking` | Loading | Looking for AE | Spinner on step 1, status line | P (bridge check) |
| `setup-signin` | Sign in | AE found | Sign in; pressed: "Waiting for your browser…" | P |
| `setup-ready` | Ready | Signed in | Steps done, "open a comp" advice | P |
| `err-notsetup` | Error | Install incomplete (today: `panel.json` missing) | Red banner, plain fix | P |
| `err-mentor` | Error | Not signed in, failed to start, exited | Red banner, Sign in again / Try again | P |
| `home-loading` | Loading | Record read slower than 300 ms | Skeleton cards, status line | R |
| `home-first` | Empty | No record | Up next = first skill, diagnosis card, "No lessons yet" | R |
| `home-return` | Normal | Record exists | Up next with reason, Practice due, diagnosis, memory | R |
| `home-cutoff` | Partway | Unfinished lesson, same AE session | "Your lesson is waiting", Continue / Start fresh | P (`panel-session.json`) |
| `home-aeclosed` | Info | Unfinished lesson, AE restarted | One-time note, Got it | P |
| `home-unreachable` | Can't connect | Bridge unreachable | Red banner, AE actions disabled with "Needs After Effects"; Skills still works | P / T |
| `home-busy` | AE busy | Rendering or a dialog | Amber banner, Try again | T |
| `home-unreadable` | Error | `RECORD_UNREADABLE` | Amber banner, "set aside, nothing's lost" | T |
| `homeB-first`, `homeB-return` | Option B | Same triggers | Diagnose-first layout | R / T |
| `diag-running` | Working | Look at my comp | Tool status steps, Stop looking | T (tool names) |
| `diag-results` | Done | Diagnosis returns | Mentor read, findings → skills, Couldn't check | T + M |
| `diag-clean` | Empty | No findings | "Nothing's jumping out", what was read | T + M |
| `diag-nocomp` | Error | No active comp | Amber banner, Try again | T |
| `skills-empty` | Empty | No record | All not started, Easing up next | R |
| `skills-few` | Normal | Some lessons | States per skill, meter | R |
| `skills-many` | Many | Many lessons | Learned, due, rusty, in progress, coming later | R |
| `skill-detail` | Memory | Pick a skill | History, next note, Warm up / New lesson | R |
| `lesson-starting` | Loading | Start lesson | Skeleton, status, buttons paused | T (tool names) |
| `lesson-open` | I do | Opening returns | Mentor, frame, checklist "not checked yet" | M + T |
| `lesson-demo` | We do | Show me | "Changed in your comp" box, before/after, Show me again | T + M |
| `lesson-partial` | You do | Check, not passed | Checklist rows, Hint appears | T |
| `lesson-outside` | You do | Edit outside the focus | "Outside this lesson · not counted" | T |
| `lesson-stale` | Can't connect | AE unreachable mid-lesson | Notice, list greyed and dated, Check again | T |
| `lesson-othercomp` | Error | Different comp active | Mentor asks to switch back, list stale | T + M |
| `lesson-error` | Cut off | Timeout, exit, dropped turn | Partial reply marked "cut off", Try again | P |
| `lesson-continued` | Partway | Continue lesson | Redrawn conversation, divider, missing frame note | P |
| `lesson-passed` | Done | Check passes and is recorded | Banner, Saved, Up next / See your skills | T |
| `practice` | Practice | Warm up | Practice tag, checklist, no demo button | T + M |
| any | Narrow | Docked at 260 px | Everything wraps, no horizontal scroll (rail: 260) | — |
| any button | Pressed | Any action | Spinner, verb ("Checking…"), others paused, status line | P |

## States still missing

- **Lesson in progress when Home is opened.** The Lesson tab has a dot, but Home doesn't yet show
  "lesson open" as its top card.
- **Ask the mentor while a lesson isn't open** (for example, from Home). Not designed; spec 003
  only allows Ask in a lesson.
- **Diagnosis on a huge comp** (slow or partial results) and **Stop looking** mid-turn: what the
  mentor reports when stopped.
- **Signed in but out of credit or rate-limited.** Depends on the decisions/005 option A account
  model.
- **Updates** (a new panel or skill version), **uninstall**, and the installer itself (outside
  the panel).
- **AE's lighter brightness settings** and Windows. The mockup is the darkest AE theme only.
- **A second AE project** open, or a lesson started in a terminal at the same time (spec 003 says
  unsupported).
- **Practice result and "getting rusty"** rules: how they're shown is drawn, when they happen is
  the curriculum's.

## What the panel would need from the mentor (for the spec writer)

The panel only displays, so these need to arrive as data, not be worked out by the panel:

1. **Up next and its reason** in the learner record, written by the mentor (`record_lesson` or a
   diagnosis tool). Today the record has only a free-text `next` note.
2. **Practice due / getting rusty** per skill, in the record, decided by the mentor.
3. **A structured diagnosis result** (findings with where, skill id or none, the mentor's pick,
   and what couldn't be checked), the same way the check list comes from `diff_since_last` today.
4. **The lesson's focus pairs at the opening**, so the checklist can show "not checked yet" rows
   before the first check. Today the list only exists after a check.
5. **A generic check-row shape across skills** (label, range, state, detail). Hold keys,
   parenting or expressions won't be "pairs", so the state words need to come from the skill.
6. **A list of skills with groups and a "coming later" flag**, from the curriculum, so the
   Skills tab isn't hard-coded like today's path.

## Accessibility

- **Contrast:** two tokens from `panel/panel.css` change. Muted text `#8a8a8a` was about 4.1:1 on
  cards and is now `#9a9a9a` (about 5:1). Red `#e5534b` was about 4:1 for 12 px text and is now
  `#ff7b72`. The filled primary button uses `#1473e6` so white text passes 4.5:1; today's
  `#2d8ceb` doesn't.
- **Not colour alone:** every state has a glyph and a word (✓ Eased by you, ✗ Still linear,
  ◐ Half eased, ↻ Practice due). The connection mark changes shape (filled dot, outlined ring)
  and has a word.
- **Sizes:** body 12 px (AE's own), labels at least 11 px (today's are 10 px).
- **Keyboard:** everything is a real button or input, tab order follows reading order, visible
  focus ring, Enter sends Ask, the checklist toggles with Enter or Space.
- **Screen readers:** status lines and notices are live regions; stage steps say "done",
  "current" or "to come"; frames have captions.
- **Motion:** the spinner slows and skeletons stop pulsing with reduced motion.

## Copy

Product copy (setup, Home, banners, empty states) follows CLAUDE.md "Voice": "Undo the tutorial
spiral.", "Your comp, your classroom.", "Smooth landing. Lesson passed.", "Nothing's jumping out."
Error copy stays plain and says what to do. Everything the mentor says is a placeholder.

## Open questions

1. **Diagnosis cost and speed.** One whole-comp turn per look: what does it cost and how long
   does it take? That decides whether option B is affordable at all, and whether `diag-running`
   needs more than a status line.
2. **Checklist from the opening** needs the focus as data (item 4 above). Is that worth a tool
   change, or does the checklist stay hidden until the first check?
3. **Keep Ask the mentor?** The `ae-panel.md` question is still open. The overhaul keeps it but
   makes it lighter. Removing it would make "the mentor leads" clearer and keep the panel from
   being a second chat next to Adobe's.
4. **Before/after frames vs. a moving demo.** Interview 004 wants "a mouse on a screen moving."
   Two frames is the most the current tools give. A short frame strip or a rendered clip needs a
   tool change and is out of scope for spec 003's rules.
5. **Recovering an unreadable history.** The banner says it was set aside; what does
   **What happened?** lead to for someone who isn't a developer?
6. **Sign-in model** for installer users (`decisions/005` option A) shapes `setup-signin` and
   `err-mentor`.
7. **UXP port.** Nothing here depends on CEP-only features except what the panel already uses
   (Node for spawning). Tabs, cards and banners map to Spectrum components (tabs, cards, in-line
   alerts, progress circle).
