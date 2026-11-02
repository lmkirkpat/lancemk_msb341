# Knack panel: UI overhaul mockup

**Status:** Design for `specs/007-ui-overhaul` (approved; amended after this revision). Not built.
**Revision 3 (2026-11-02):** drawn around the six built skills: one checklist pattern, a progress
strip that's true without a demo, Home without diagnosis, the real path, reviews, and option A's
error kinds. Where this differs from the spec, see "Differences from spec 007".
**Revision 2 (2026-10-20):** diagnosis screens drawn against `specs/005-diagnosis`. Those screens are
unchanged and now held.
**Replaces:** the one-skill layout in `product/mockups/ae-panel.md` and `panel/` (spec 003).

## How to open it

Open `product/mockups/ui-overhaul/index.html` in any browser. It's one self-contained file with no
outside fonts, images or scripts. It opens on the six checklists side by side. The left rail lets
you:

- jump to any state; groups marked **Held** aren't part of this build
- set the panel width (260 minimum, 320, 420) and height (480, 680, 900); the six-skill states set
  themselves to 260 × 480 when opened
- turn off auto-advance to study loading states

**Open first:** `#all-checklists`, `#all-openings`, `#compare-stage`, `#compare-upnext`,
`#lesson-focus-stale`, `#home-return`, `#lesson-passed-asking`, `#skills-many`.

**Not run in a browser.** It was written with no way to open it (this agent has no shell, and the
built-in browser can't open local files). The code was read back, but nothing was seen on screen, so
fit at 260 × 480 is calculated, not checked.

### Sources

Layer names, times and results come from Mentor Practice and Mentor Practice 2, through the usage
notes (`easing-slice`, `mentor-panel`, `speed-graph`, `key-types`, `offset`, `anchor`,
`null-parenting`). Invented to show a state: Cut's "waits until 3.4 s", Bar's land-hard pair, Pop's
slide at 1 s, the review's Chip times, and the record's dates after Oct 26. No snapshot or frame was
attached, so frames are sketches. Text marked **Placeholder** is the mentor's voice, based on each
`SKILL.md`, and belongs there.

## What this revision removes

| Revision 2 | Revision 3 | Why |
|---|---|---|
| I do / We do / You do strip | **Pick / Try / Done** | Not true without a demo (below) |
| A row is "a keyframe pair" | A row is whatever the skill's check grades; one pattern | Six skills |
| Home's What's wrong here? card and question card | Gone; one held slot | Spec 005 has no plan or code |
| Up next quoting a finding | Three sources, none needing a turn | Nothing stores a recommendation |
| Practice due on Easing | Never on Easing | Easing has no review mode (spec 004 plan P5) |
| "Warm up · about 2 min", Getting rusty ◔ | Gone | Neither is defined |
| Skill groups, 11 placeholder names | The real path, one list | `path.json` has no groups |
| Show me always there | Only with a demo target | Reviews have none; many lessons have none at first |
| Up next: Graph Editor › at the end of a lesson | What's next › | Nothing to name |

Kept: three tabs, the docked checklist, Changed in your comp, Hint from the first check, the Outside
list, status lines, Ask the mentor, every lesson-in-progress rule.

## The checklist: one pattern

Each row is **glyph · subject · word · optional detail**. Rows sit in optional sections. A list can
add a footer (a fact about the whole group), **Outside this lesson · not counted**, and **Worth a
look · not graded**. No skill adds a row type.

| Glyph | Family | Means |
|---|---|---|
| ✓ | done | This part holds |
| ✗ | off | Not yet |
| ◐ | part | Partly, or close |
| ○ | none | Not checked yet, or waiting on an earlier stage |
| ◇ | prop | Proposed |
| ⊘ | cant | Can't compare; holds the pass where the tool says so |
| ? | ask | Your call; the mentor asks, and it's not a failure |

Row words are panel copy, mapped from each tool's codes. The panel never decides a state: unknown
codes read "Not checked yet" and never a pass (as `lesson.js` does today). The summary line and any
"Passed" come from the tool's own `passed`, never from counting ticks.

### Per skill

| Skill (tool) | One row is | States: glyph and word | Sections and extras |
|---|---|---|---|
| **Easing** (`diff_since_last`) | One keyframe pair | ✓ Eased by you · ✓ Demo · ✗ Still linear · ◐ Half eased (names the key) · ⊘ Keys changed (`removed`) · ⊘ Can't tell which (`unmatched`) | Section: layer. Outside: the tool's sentences. Tool's own count |
| **Key types** (`key_types_check`) | One key pair | ✓ Held by you · ✓ Demo · ✗ Not held · ◐ Hold on the wrong key · ⊘ Keys changed · ⊘ Expression on it · ⊘ Can't tell which | Section: layer › property. **Meant to keep moving**: ✗ Now snaps. **Runs at constant speed**: ✓ Linear, stays · ✗ Not linear · ⊘ Expression. Outside: `extra_holds`, `other_changes` |
| **Speed graph** (`speed_graph_check`) | One eased pair | ✓ Shaped by you · ✓ Demo · ✗ Not shaped yet · ✗ No ease on a key · ◐ Still moving as it lands · ◐ Back to the default · ◐ Long at both ends · ◐ Shaped the wrong side · ⊘ Keys changed · ⊘ Can't tell which | Section: layer. **You said it lands hard · left out**: ○ Your call. Detail: which dimension |
| **Offset, layers** (`offset_check`) | One layer in the group | ✓ On its own · ✗ With [other layer] · ? Split · ✓ Split on purpose · ⊘ Keys changed | Detail: starts, moved by, demo. A small bar for where it starts. Footer: order differs. Group line: gaps. Outside: `out_of_comp`, `other_changes` |
| **Offset, properties** | One property on one layer | ✓ Apart · ✗ With [other property] · ◐ Lands past the end · ⊘ Keys changed | As above, with start and landing |
| **Set the pivot** (`anchor_check`) | One condition on a layer | Pivot: ✓ In place · ◐ Near it · ✗ Outside, to its [side]. Layer stays: ✓ Stayed · ✗ Moved [direction]. At rest: ✗ Set away from rest. Position keys: ✓ Held · ✗ Slid at [time]. Others: ✓ Nothing did · ✗ [layer] moved. ⊘ Can't check, on any | Section: the layer (one or two). No pixel numbers (the skill's rule). Outside: panel words each `other_changes` kind |
| **Null** (`null_parent_check`) | One thing in a stage | The null: ✓ 2D, no parent · ✗ Not a null · ✗ No null yet · ? Has a parent · ✓/✗ Pivot at [region]. The group, per layer: ✓ Follows [null] · ✗ Jumped [px] [direction] · ✗ Follows [other] · ◐ Position linked, not parented · ✗ Its keys changed · ⊘ Couldn't check. The move: ○ After the group · ✓ [property] · ✗ No move yet · ✗ Opacity doesn't carry | Sections: **The null, The group, The move**, opening as the check reaches them. **Worth a look · not graded**: `comments`. Outside: panel words each kind |

### What doesn't fit, not hidden

1. **Offset has no pass per member.** The tool only reports which pairs are still together, so "✓" on
   a row is relative, and a layer that stayed put is correct. Gaps, rhythm and order are facts about
   the group. A row of all ✓ doesn't mean passed: an unexplained split or changed keys hold the pass.
2. **The pivot grades a layer on up to five conditions.** Treating the layer as the row would hide
   which one failed, so the layer is the section. The panel has to read `item1` to `item5` to word
   them; the tool's hint codes are the mentor's.
3. **Null is staged.** Later stages can't be graded yet, and `graded: false` (a parent on the null
   that moves) gives no verdict at all: the list stays as it was, marked like `lesson-stale`.
4. **Key types has three things that can hold a pass**, so two extra sections.
5. **Speed graph's `fastest` isn't shown, on purpose.** The tool returns it, but the lesson asks the
   learner to read it from the graph. On the list, it gives the answer away.
6. **Two shapes of "other changes".** Easing, key types, speed graph and offset send sentences; the
   pivot and null send kinds, which the panel words. A panel table, no mentor change.

### The Proposed moment (decision 2)

Reading the tools turned up two things that change how this reads.

**Easing's opening targets are every linear pair in the comp, not the mentor's proposal.** With no
`focus_layers`, `analyzeAll` returns all of them: 11 on Mentor Practice. "Let's start with Title" is
only words. Speed graph (capped at 5) and offset (its group) do match what the mentor says.

**Key types, the pivot and null have no targets at the opening, and that's deliberate.** Their skills
ask first; null's opening "names no layer and doesn't mention `proposal`". Listing candidates or the
proposal would answer the question for the learner. So their slot says what fills it: "Your list
starts once you pick the group."

| Moment | State | What shows |
|---|---|---|
| Opening | `lesson-open` | ◇ Proposed rows. Header: "11 linear pairs found · Proposed", "From the mentor's read. Changes when it reads again." |
| First reply or check | `lesson-focus-replying` | Marks drop to ○ Not checked yet; "Updating…" while the turn runs |
| The mentor re-read (usual) | `lesson-focused` | Rows narrow to the focus |
| It didn't re-read | `lesson-focus-stale` | Old rows stay, unmarked: "From the mentor's last read. Changes at its next read or your next check." |

**What softens it:** the header names the source, not the state of agreement, so it's true in every
case, and the rows say only "not checked". Nothing says "your list" until targets narrow.

**What can't be softened:** in `lesson-focus-stale` the mentor is talking about Glow while the list
shows Title. It lasts one turn. `SKILL.md` re-reads as soon as the learner agrees, so this should be
rare (a side question, or a mentor reply that asks something first). How rare isn't measured.

### Stale (builder's decision, amends FR-017)

The note is at full contrast, row labels dim, and results don't: glyph, word and summary stay full.
**Opacity .7 on the label only.** The checklist's background is `#262626`, so `--text` at .7 is
**5.2:1** (the 5.4 figure is on `--bg`). The floor is .63. Detail lines and section heads use
`--muted`, which is 5.4:1 undimmed and would fail dimmed, so they don't dim. The same treatment
covers `lesson-othercomp`, `lesson-continued` and `lesson-exited`.

## The stage: Pick / Try / Done

**Does I do / We do / You do still tell the truth? No.** Five of the eight live lessons on the new
skills had no demo, a review never has one, and the bar still reads "We do ✓". Null runs in the other
order: the learner places the null, then the mentor demonstrates. Even in easing, "I do" lights up
while the mentor has done nothing.

**Proposal, side by side at `#compare-stage`:** a one-line **Pick · Try · Done**.

- **Pick:** agreeing what to work on. All six skills have this, reviews too.
- **Try:** from the first reply or non-empty targets.
- **Done:** the check's own `passed`.

A demo is an event, in Changed in your comp and on its row, never a step. Null's stages are the
list's sections. "I do, we do, you do" stays how the skills teach. This only changes what the bar
claims, and the change is all in `panel/lib/lesson.js`.

## Following the lesson, and engagement

The check list is what helped most in the panel sessions (`mentor-panel.md`), and the mentor now
speaks at most two sentences a turn and ends on one thing to do. So at 260 × 480 the chat holds less
history than it needs to, and the list carries more. Each change below is panel-only:

| Change | Why it earns its place |
|---|---|
| Older turns fold ("Earlier in this lesson (3)"); the newest turn is what you see | Every turn ends on your next step, so that's what should be in view |
| **Done, check it** replaces Check my work | Skills all say "say done"; the button now answers that. The request stays "I'm done. Check my work.", so no eval changes |
| Done rows fold at short docks ("✓ 3 done · show") | The open rows stay in view when the rows are showing |
| At short docks, one scrolling area at a time: the checklist is its one-line summary, and pressing it swaps the chat for the rows (builder's note, 2026-11-02; replaces FR-022's 30% cap) | Two scrolling areas with a break between them were unintuitive at 480 px |
| "Next: Position 1.5–3 s" under the summary | First open row in the tool's order. Display only; never re-ranked |
| "1 more since your last check", and a bar on changed rows | Progress you can feel, from counting two results |
| Frames small at short docks, full size on press | A 16:9 frame nearly fills the chat at 260 wide |
| **Flip** between a turn's two frames | Reads as motion, with only frames the mentor already rendered |
| Offset's small timeline (a ruler with the first key as a diamond; redrawn 2026-11-02 after the builder said the bar read as a progress bar) | Shows the stagger itself, in the panel's one picture. React to this |
| One plain pass line for every skill | "Lesson passed." (builder's note, 2026-11-02: the per-skill wordplay lines were cut) |
| "Back for a warm-up tomorrow" at a pass | Practice made visible, from `review_due` |

**Found while drawing: a pass isn't the end of a lesson.** The pivot asks what stays still, speed graph
asks for a second reading, and key types asks about constant speed, all after a passing check and
before `record_lesson`. So `lesson-passed-asking` is new: Done ticks, Ask stays, and Saved and the ways
out wait for the save.

## Home

**Order at 260 × 480 (D5):** Up next with its button, then Practice due, then memory. Calculated:
Up next's button ends at about 240 px, Practice due's at about 370. No mentor turn to open.

**The held slot:** one row directly under Up next (`#home-held-slot`), so both starts fit above the
fold when diagnosis lands, and no other card moves. Nothing in scope points at diagnosis.

### Up next's source

| Case | Shows | Source |
|---|---|---|
| No record | Easing, "The usual first stop." **Start lesson** | Path data's first skill |
| Nothing stored (today) | "Your next lesson", no skill named. **Find my next lesson** | Nothing; the press is one `/next-mentor` turn reading the record and comp live |
| Stored (later) | Skill, reason, "Suggested Oct 26". **Start lesson** | The record |

**How a reason reads:** one short line per skill, written in the product voice and kept with the path data, for
example "Control how a move starts and lands." It says what the skill gets you and doesn't recap the last one (builder's
note, 2026-11-02). The others: key types, "Choose which moves snap and which glide."; offset, "Stop everything moving at
once."; pivot, "Make a layer turn from the right spot."; null, "Move several layers as one." It names no layer and makes no claim about the comp, because nothing has looked at it since.

**The simplest thing that would satisfy the design:** `record_lesson`'s handler also calls the existing
`recommend()` with no snapshot and writes `{ skill, skill_name, reason, at }` to the record. It's
server code with unit tests, no prompt change, and no eval re-run. Without a comp read it can't offer a
review or name layers, which is right for a line written at a lesson's end; Practice due covers
reviews. Side by side at `#compare-upnext`.

## Reviews

- **Practice due** shows when the record's `review_due` is today or earlier, on a skill with a review.
  One card, first in path order, with a count of the rest in Skills. The mentor runs one review a
  session, so more cards would promise more than it does.
- **Warm up** opens `practice`: tagged from the tool's `mode`, no Show me in any state, Hint after the
  first check, same rows as the lesson.
- **Nothing new on this comp** (`practice-nothing-new`). The panel can't see this before the press:
  a review also needs a target it hasn't used here. It says so, nothing is recorded, and it stays due.
- **Easing never shows Warm up**, even though its record has a due date (the builder's has been due
  since Oct 13). It has no review mode, so pressing it would dead-end. It offers New lesson.

## Option A's error kinds (FR-056)

Home makes no mentor turn, so a passing error can only follow a press. **Home's actions are never
replaced by one.**

| Kind | Treatment | State | Copy |
|---|---|---|---|
| `not_signed_in` | Blocking | `err-key` | Knack needs its access key. It's missing or isn't working. Check setup, then try again. |
| `out_of_credit` | Blocking | `err-credit` | The access key is out of credit. Or it's hit its spending limit. Check setup or top it up, then try again. |
| `start_failed` | Blocking | `err-mentor` | The mentor couldn't start. Close and reopen this panel. If it happens again, check setup. |
| `rate_limited` | Passing | `lesson-pass-rate` | The mentor's getting a lot of requests. Give it a minute, then try again. Your lesson's still here. |
| `service_busy` | Passing | `lesson-pass-busy` | The mentor's service is busy. Try again in a moment. Your lesson's still here. |
| `offline` | Passing | `lesson-pass-offline` | Can't reach the internet. Check your connection, then try again. Your lesson's still here. |
| `refused` | Passing, no Try again | `lesson-pass-refused` | The mentor couldn't answer that. Try saying it another way below, or carry on with your check. |
| `timeout` | Wording in `lesson-error` | `lesson-error` | The mentor took too long, so the panel stopped waiting. Your lesson and checklist are still here. |
| `process_exited` | The lesson is over | `lesson-exited` | The mentor stopped unexpectedly. That lesson has ended, and nothing from it was saved. Your comp keeps your changes. |
| Any passing kind, first turn | No lesson opened | `lesson-start-failed` | Same wording; "Nothing has started." |

On a passing error the list isn't dimmed: nothing about the comp is in doubt. **Retry after Show me:**
if the change came back, Show me again. If a demo call started with no result, the check. If no demo
call started, Show me is safe, because on option A `tool_call` is only sent for calls that will run.
Whether B1's stream can tell the same is a question for the panel builder.

## Skills

The real path, in order, no groups, counted over built skills. Six built, five "Coming later" and not
pressable, Setting keyframes "Assumed known". States: ✓ learned, ↻ practice due, ◐ in progress
(`practicing`), ▸ up next (only with a source), ○ not started, · coming later. Warm-up length and
Getting rusty aren't drawn. `skill-detail-new` says "Builds on…" from the path's hard prerequisites,
and never blocks, as the skills don't.

## D1 to D5

| | Status |
|---|---|
| **D1, the checklist from the opening** | Settled by decision 2, for skills with opening targets. Key types, the pivot and null start empty |
| **D2, keep Ask** | Settled: keep it on Lesson. It's how you answer most turns. Not on Home or Skills |
| **D3, frames vs a moving demo** | Settled for now: the frames the mentor rendered, plus Flip. A real moving demo stays open |
| **D4, What happened?** | Settled: one paragraph, no action (`home-unreadable-why`). Recovery would be its own spec |
| **D5, Home's order** | Settled, above |

## What the panel needs from the mentor

**New, and needed:**

1. **Which skills are built and which have a review, readable by the panel.** `path.json` says neither
   on purpose: built comes from the tool files, review from `FINDERS`. The panel can't read those.
   Simplest: a small generated data file, with a test against the tool files. **No eval cost.**
2. **Two rows in `next-mentor/SKILL.md`'s hand-over table.** It lists four skills; Set the pivot and
   Move a group with a null are missing, though `recommend_next` can recommend them. Up next can dead-end
   there. **A small eval cost**, next-mentor's cases only. This looks like a bug whatever happens to
   this design.

**Later, if decided:** the stored recommendation, above. **No eval cost.**

**No longer needed, from revision 2's list:**

- The accept signal (decision 2).
- Lesson title and focus as new data: the skill comes from which tool ran, the focus from `focus`, and
  the mode from `mode`.
- A learner-facing next note: since the pacing rules `next` reads plainly, so it's shown as it is. If a
  real one reads badly, that's the case for it.
- A warm-up's length, and Getting rusty.
- The record-failed signal: `saved: true` already exists.

**Panel-only, from tool results already there:** a tool-to-skill table; row words per code; status
lines for each skill's tools; Show me from `demo_target` and, on null, the check's `null_ready` hint.

**New fixed requests, each needing an eval case:** Start lesson and New lesson for each skill (New
lesson has to ask for a lesson, or the tool may choose a due review); Warm up for the five with reviews;
Find my next lesson (`/next-mentor`); "Yes, let's go" (next-mentor's set).

Everything under **Held** keeps revision 2's list: spec 007's PN-01 to PN-08 and PN-12.

## Differences from spec 007

For the spec writer.

| Spec | This revision |
|---|---|
| FR-007 | Order is Up next, Practice due, memory, plus a held slot. No diagnosis card or question card. Look at my comp not above the fold, for now |
| FR-009, FR-012, PN-09 | Up next has three sources; with nothing stored it names no skill and sends `/next-mentor`, not a skill's start request |
| FR-013 | Label is Pick a skill |
| FR-014 | Pick / Try / Done replaces I do / We do / You do. Title and focus from tool names and results, no new data |
| FR-015, PN-14, SC-002 | No accept signal: the mark drops at the first reply or check (decision 2). Rows come only from opening targets, so key types, the pivot and null start empty. On easing that's every linear pair, not the mentor's proposal. US2 scenarios 1 and 2 change to match |
| FR-017 | Only row labels dim (.7); note, results and summary stay full. Builder's decision |
| FR-019 | Show me shows only with a demo target; never in a review |
| FR-016, US2 | Check my work is labelled Done, check it; the request is unchanged. Row states are per skill (table above) |
| FR-021 | A check's pass and the save are separate moments (`lesson-passed-asking`). The way out is What's next ›, not Up next: skill › |
| FR-024 | No question card or Look at my comp to replace. Skills' New lesson and Warm up as written |
| FR-030 | Adds a third case: no demo call started, so Show me may be resent |
| FR-048 | No groups; ▸ only with a source |
| FR-049 | Warm up only on a learned skill **with a review**; Easing has none |
| FR-051, PN-11 | Same, and no expected length. Can still lead to `practice-nothing-new` |
| FR-056 | Blocking: own wording in `err-mentor`, plus `err-key` and `err-credit`. Passing: a notice in the lesson, Home untouched. `process_exited` ends the lesson |
| FR-046 | Ask also on `lesson-picking`, `lesson-passed-asking` |
| PN-10, PN-13, PN-16 | PN-10 and PN-13 dropped for now. PN-16 needs its built flag from a new data file, plus a review flag |
| FR-070 | New requests above. RQ-03 to RQ-10 held |
| Build order, States by dependency | Diagnosis out of this sprint; new states added below. `setup-signin` still says "opens your browser", against FR-054, and stays until spec 006 Q2 |

## User flows

State ids match the rail.

1. **First run:** `setup-welcome` → `setup-checking` → `setup-signin` → `setup-ready` → `home-first`.
   Unchanged, waiting on the installer and the access-key question.
2. **Recommended:** `home-return` → Find my next lesson → `lesson-picking` → Yes → the lesson. Or
   `home-return-stored` → Start lesson, later. **Yourself:** Pick a skill → `skills-*` →
   `skill-detail` → New lesson or Warm up.
3. **A lesson:** `lesson-starting` → `lesson-open` → `lesson-focus-replying` → `lesson-focused` →
   `lesson-demo` (if asked) → `lesson-partial` → `lesson-passed-asking` (if the skill asks) →
   `lesson-passed`. Side states: `lesson-outside`, `lesson-stale`, `lesson-othercomp`, `lesson-error`,
   `lesson-error-demo`, `lesson-pass-*`, `lesson-exited`, `lesson-passed-unsaved`.
4. **Continuing:** as revision 2: `home-lessonopen`, `home-cutoff` → `lesson-continued`, `home-aeclosed`.
5. **A review:** `home-return` or `skill-detail` → Warm up → `practice` → `practice-check` →
   `practice-passed`, or `practice-nothing-new`.

## Every state

Source: **R** learner record, **Pa** path data, **P** the panel's own files or the turn's tool stream,
**T** a mentor tool result, **M** the mentor's words.

| Id | State | What shows | Source |
|---|---|---|---|
| `all-checklists`, `all-openings`, `compare-stage`, `compare-upnext`, `home-held-slot` | Review views, not states | Side by side at 260 × 480 | n/a |
| `setup-welcome`, `-checking`, `-signin`, `-ready`, `err-notsetup` | First run | As revision 2 | P |
| `err-mentor`, `err-key`, `err-credit` | Blocking errors | Red banner; Home says "Needs the mentor." | P |
| `home-loading` | Loading | Skeleton over 300 ms | R |
| `home-first` | Empty | Path's first skill, "No lessons yet" | Pa |
| `home-return` | Normal, nothing stored | Your next lesson, Practice due, memory | R, Pa |
| `home-return-stored` | Normal, stored (later) | Skill and reason | R |
| `home-lessonopen`, `home-cutoff`, `home-aeclosed` | Lesson open, waiting, ended | As revision 2 | P |
| `home-unreachable`, `home-busy` | AE | Banner; AE actions say why | P, T |
| `home-unreadable`, `home-unreadable-why` | History | Banner; one paragraph | P |
| `skills-empty`, `-few`, `-many` | Progress | The real path | R, Pa |
| `skill-detail`, `-noreview`, `-new` | One skill | History; Warm up only with a review | R, Pa |
| `lesson-none` | Empty | Why, and two ways on | P |
| `lesson-starting` | Loading | Skeleton, list slot, status | P |
| `lesson-picking` | Suggestion | Mentor's one suggestion, no strip or list | M |
| `lesson-open` | Pick | ◇ rows | T, M |
| `lesson-focus-replying`, `lesson-focus-stale`, `lesson-focused` | The Proposed moment | Above | P, T |
| `lesson-demo` | Try, after a demo | Changed box, Flip | T, M |
| `lesson-partial`, `lesson-outside` | Try | Rows from the check | T, M |
| `lesson-stale`, `lesson-othercomp` | Can't compare | Note full, labels dim | T |
| `lesson-error`, `lesson-error-demo`, `lesson-continued` | Cut off, picked up | As revision 2, relabelled | P, T |
| `lesson-pass-rate`, `-busy`, `-offline`, `-refused`, `lesson-start-failed`, `lesson-exited` | Option A errors | Notice | P |
| `lesson-passed-asking` | Check passed, not saved yet | Ask stays | T, M |
| `lesson-passed`, `lesson-passed-pivot`, `lesson-passed-unsaved` | Done | Pass line, Saved only on `saved: true` | T, R |
| `practice`, `practice-check`, `practice-passed`, `practice-nothing-new` | Review | Above | T, R, M |
| `skill-easing-check`, `skill-keytypes-open`, `-check`, `skill-speedgraph-open`, `-check`, `skill-offset-layers-open`, `-check`, `skill-offset-props-check`, `skill-pivot-open`, `-check`, `-keyed`, `skill-null-open`, `-place`, `-parent`, `-move` | Six skills | At 260 × 480 | T, M |
| `homeB-first`, `homeB-return`, `compare` | **Held: option B, not this build** | As revision 2 | |
| every `diag-*` state | **Held for spec 005, not this build** | Unchanged from revision 2 | |

## States still missing

- A check that comes back ungraded on null (`graded: false`) has no state of its own; described in its
  note.
- A review with more than one due skill, past Home's card: what Skills does after the session's one
  review.
- Who shaped or eased a demo pair when the tool can't tell (`demo_credit` or `credit` unknown, easing and
  speed graph): the mentor asks. It would be a "?" row; it isn't drawn.
- Long skill names at 260 in the lesson header wrap to two lines; not checked on screen.
- Out of scope, as before: AE's lighter themes, Windows, a second project open, updates, uninstall.

## Accessibility

Rules FR-074 to FR-081 apply; these are the new parts.

- **Contrast:** `--accent-fill #1473e6` is only ever a filled button. Text accent is `#4b9cf5` (about
  5.0:1 on cards). Stale figures are above.
- **Not colour alone:** every row has a glyph and a word; the changed-row bar repeats what the summary
  says in words; offset's bar is hidden from screen readers, and its detail line says the same.
- **Sizes:** body 12 px, nothing under 11.
- **Keyboard:** fold, Flip, frame size and Earlier are real buttons or `details`.
- **Motion:** Flip is manual, so nothing moves on its own.
- **Paused buttons say why** ("Buttons wake up once there's a list.").
- **Short docks:** only the chat shrinks. Done rows and padding give up room first.

## Copy

Product copy follows CLAUDE.md "Voice". Errors stay plain and say what to do. Mentor text is Placeholder,
from `SKILL.md`.

## Open questions

1. **Find my next lesson vs Start lesson** on the unnamed card (the decision I was least sure about). The
   brief calls it Start lesson. I relabelled it because it doesn't start one until you say yes. The other
   option: keep Start lesson, and let the suggestion be the lesson's first turn.
2. **Done, check it**: does the builder want the label moved, given spec text and habit say Check my work?
3. **Offset's start bar**: worth a picture in one skill only?
4. **Which skill Practice due names when several are due:** first in path order is display, not a choice,
   but it could disagree with the mentor if a review's comp has nothing new.
5. **How often does `lesson-focus-stale` happen?** Countable from eval transcripts (a first reply with no
   re-read in that turn), before building.
6. **"Worth a look" on null:** the mentor already says these in a sentence. Keep the list, or leave them to
   the mentor?
7. **`setup-signin`** still draws a browser sign-in, against FR-054. It stays as asked.
8. **End lesson:** does ending an unfinished lesson record anything? Still spec 007 open question 2.
9. **UXP port:** tabs, cards, alerts, `details` and the progress circle map to Spectrum. Nothing new needs
   CEP.

## Builder's decisions, 2026-11-02

Made while reviewing revision 3, for the spec writer to fold into spec 007.

- **Stage:** Pick / Try / Done replaces I do / We do / You do.
- **Check button:** "Done, check it". The request it sends is unchanged.
- **Up next with nothing stored:** "Find my next lesson".
- **No checklist at the opening** for key types, the pivot and null.
- **Short docks:** one scrolling area at a time, toggled by the checklist's arrow, with no text label. After a check the panel stays on the chat. Taller docks keep the chat and checklist together.
- **Offset's timeline stays.** Its scale needs a real source (the comp's length or the group's time range).
- **Spacing:** 12 px side margins and looser gaps on every screen.
- **Toggle arrows:** one large, bright arrow style, on the checklist and on "Earlier in this lesson".
- **End lesson** uses the gray secondary button.
- **Copy:** plain, with a little natural voice ("Take me in"). Applied from `copy-pass.html`, which keeps the before and after.
