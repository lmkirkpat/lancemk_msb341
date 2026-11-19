# Ask mode build notes (spec 014)

Build-time questions and live checks for `specs/014-ask-mentor/`. Each entry: the question, the answer,
and what it changes.

## Phase 0 (2026-11-14 to 2026-11-16)

### T001: is a comp active? (research R10)

Live, AE 27.0, the practice project, read-only script `mentor/dev/live-014/comp-active.jsx` run through
`ae_run_script`; the builder set each state by hand. 2026-11-16.

| # | State | Comp open? | `activeItem` | Read as "comp active" | Right? |
|---|---|---|---|---|---|
| 0 | As left (Mentor Practice active) | yes | the comp | yes | yes |
| 1 | Comp viewer focused | yes | the comp | yes | yes |
| 2 | Clicked into the timeline, then focused the Knack panel | yes | the comp | yes | yes |
| 3 | An audio footage item clicked in the Project panel, comp still open | yes | the footage | no | **no** |
| 4 | Every comp viewer and timeline closed, empty Project click | no | null | no | yes |
| 4b | Comp reopened, then an empty spot clicked in the Project panel | yes | null | no | **no** |
| 5 | File › Close Project (AE keeps an empty untitled project) | no | null (0 items, no file) | no | yes |
| 6 | A 4 s render of a comp started, read sent right away | yes | the comp | yes | yes |

Also seen:
- In state 1, the Project panel's selection was a different comp than the active one; `activeItem` follows
  the viewer there, not the selection.
- `app.activeViewer` still reported a comp viewer (type 7612) with every comp closed (state 4), so it's
  stale and can't back up the read.
- State 6: the render ran 12:37:30 to about 12:37:34 and the read landed at 12:37:35, so it most likely
  queued behind the render, as the bridge's own instructions say ("AE answers nothing else while it
  renders"). It didn't hang or error. Not proven: a 4 s render is too short to tell queuing from timing.

**Answer:** only **yes** is reliable. Panel focus doesn't change it (state 2, the risk R10 named). But a
**no** can't tell "no comp open" from "a comp is open and the learner last clicked footage or an empty
spot in the Project panel" (states 3 and 4b). A "no" is unreliable in normal use.

**What it changes:** FR-047 (Home pauses Ask before anyone asks) would wrongly pause Ask with a comp on
screen. Per T005, this goes to the builder before T015. The mentor's own read has the same blind spot
(it captures the active comp), but the approved "no comp" copy, "No comp open. Open one, or click into
its timeline.", fixes both wrong cases with one click. The panel already treats a missing flag as
unknown and keeps Ask available (T025), so it needs no change either way.

### T002: hand-over on the fake service (research R4, R5)

Test `panel/helper/test/ask-handover.test.mjs` (merged `392ef53`). The helper already does all four: the
ask skill hands over through `Skill` (`panel/helper/lib/loop.mjs:388`, `switchTo` at `:176`), the
conversation is kept, the tool list switches to the lesson's, a `session.json` value saved before the
switch is read after it, and `/ask-mentor` switches back (`loop.mjs:547`). Run on Opus 5.5 and Haiku 5.5.
The one gap, the helper telling the mentor server it's on A, was built in T028.

**What it changes:** nothing; phase 2's hand-over builds on what's there.

### T003: practice keeps the schedule (research R18)

Test `mentor/test/practice-keeps-schedule.test.mjs` (merged `0a69de2`). A non-review lesson on a learned
skill, passed or partial, keeps status, `review_due` and `reviews_passed_in_row` (`mentor/lib/reviews.mjs:58`,
written back at `mentor/lib/learner-store.mjs:126-129`), and its entry's kind is `practice`
(`learner-store.mjs:122`). One `todo`: a skill marked learned with no lesson entries of its own (only a
hand-edited record) logs `first`, not `practice`; the schedule is still kept.

**What it changes:** nothing; the § 11 rule (asking again is normal, not a review) holds in today's code.

## Phase 1 (2026-11-16 to 2026-11-18)

### T037: the ask set on B1 (SC-006's B1 half)

**Answer:** met on 2026-11-18 at `91fd9c7`. With `--repeat 3` and majority pass, 18/18 (100%) for $11.04,
and no FR-061 hard-rule check failed. Refusals were 3 of 60 answer calls (5%), all on case 11, and each passed
on retry. Situations 4 and 5 (cases 02 to 05) passed 3 of 3. Situation 1 (case 01) passed 2 of 3 in the full
run, missing on step order (the pivot step came first and the Position step was missing), and 3 of 3 in a
re-run at the same commit. That's 5 of 6, which the builder accepted with the ordering on the watch list.
Details are in `product/evals/ask/README.md` › Results.

**How it got there:** the full runs went 0/18, 9/18, 11/18 (`8f5f764`), 16/18 (`dd18959`, repeat 3), then
18/18. Each round fixed causes in this order: plumbing, then the fixtures, then the tool, then `SKILL.md`.
- Ask fixes (a) to (n): a loose-name match (NAME_PARTIAL), Ease in own keys, `from_renders` on links,
  clarify replies that say what was taken, and pivots never read.
- Round 5 (o) to (q):
  - No time worked out from an expression's text. A read for each shift's span over 1 px was added, which
    waits on a fresh Comp 1 capture.
  - The children are named when there are 5 or fewer.
  - Follow-ups are at most three sentences.
- In the eval set:
  - The two-rocks fixture's second rock is now Small Rock.png, since "Rock Shadow" read as the rock's
    shadow.
  - R-OUTSIDE follows FR-018.

**What it changes:**
- Single runs flip, so the ask set's bar is now repeat 3 with majority pass.
- A prompt line asking the model to mark a number as inferred didn't hold while the worked answer modeled
  that number. Making the number a read, or taking it out of the example, did.
- Watch list: 01's step order, 08 (export filed as not taught), 11 (an offer with no step tags), 12
  `never_hidden`, 15 `single_key_said`.
- Follow-ups:
  - The curriculum designer rewords TD § 5.1a and § 16 (a time no read gives), § 16's "The turn centers
    on the rock…", and line 210's "Rock Shadow".
  - At T040 the spec-writer checks round 4's and round 5's edits to spec 015's contract and data model
    (the skill-builder made them, on the builder's approval), rewords FR-011 and US2's "target", and
    closes 014's OQ-8.
  - Re-capture Comp 1 live so `over_1px` reaches the fixtures.

### T038: live B1 smoke in the panel (2026-11-19)

Builder's hands, AE 27.0, Comp 1, panel on B1 at `c0aec58` (AE restarted first). Logs: `panel-turns.jsonl` and
`calls.jsonl` in the learner home; thread kept in `panel-session.json`.

| # | Check | Result |
|---|---|---|
| 1 | Rock question: first line names Comp 1 | pass |
| 2 | Steps on Shake Control, biggest shift first (Position 12 px, Rotation 9 px) | pass |
| 3 | Steps from the read; Your steps folded | pass |
| 4 | No Go deeper on B1 (SC-011) | pass |
| 5 | Keyboard focus on Your steps | pass |
| 6 | Close while reading shows "Your question's still here." | pass |
| 7 | Sweep question: no Steps, no dock | **fail on the first try**: the read took Y Shakers as the active comp (below); the retry 30 s later read Comp 1 and answered right |
| 8 | Start a lesson from the thread | not a phase 1 check: on B1 the only way in is Skills (Go deeper is phase 2). Started from Skills; the thread was kept |
| 9 | Follow-up after a lesson | **fail, then pass**: see "end lesson in words" below. After ending with the button, sends went to the thread |
| 10 | No comp: Ask available, fixed line shown | **fail, then pass**: the box was locked only because the lesson was still open. On retest, typing worked and the panel showed "No comp open. Open one, or click into its timeline." |
| 11 | Footage clicked: same line; a timeline click fixes it | pass (the next question read Comp 1, 29 layers) |
| 12 | `turns.js --ask`: first sign ≤ 10 s | pass: 4/4, median 2.2 s (the retest's 6 also under 4.5 s) |

**Finding 1: "end lesson" in words left the lesson open in the panel.** The learner typed "end lesson" right after
a pivot opening. The mentor said "we'll stop here" but recorded nothing (nothing to note), and the panel only
closes a lesson on the End lesson button or a saved `record_lesson`. So `panel-session.json` stayed
`ended: false`, Home's Ask was paused ("Your lesson is open…"), its box was locked (`panel/lib/screens.js:69`),
and follow-ups went into the lesson with "Done, check it" still showing. One cause, three symptoms (9 to 11).
**Fix:** T106 to T108 (`fac1ed7`). The builder chose (2026-11-19): a stop with something to record calls
`record_lesson` as before; a stop with nothing to record calls the new `end_lesson`, which the panel treats like
End lesson.

**Finding 2: the read took a precomp as the active comp.** At 17:40 `describe_layers` read **Y Shakers**, one of
Comp 1's two Shakers precomps (layers 4 and 19), and the mentor answered about it ("In Y Shakers, the comp open
now…"). The builder had Y Shakers open in a viewer tab, but not focused: Comp 1 was active in both the viewer and
the timeline. That doesn't match T001 state 1 (`activeItem` followed the viewer). Not explained yet. To try at a
sitting: Comp 1 and a precomp tab open, focus Comp 1, read `activeItem`; then the same after a double-click into
the precomp and back. Possible fix if it reproduces: when a follow-up's comp differs from the one the thread has
been about, the answer says so ("Y Shakers is the active comp now; click into Comp 1's timeline to ask about it").
Watch for it in the three sessions.

**Finding 3: the no-comp answer's prose varies, and one cost $0.25.** The panel showed the fixed line each time,
but the mentor's own sentence under it changed every turn. The second no-comp follow-up ("what about now") cost
$0.249 for an answer that read nothing, most likely the resumed thread's context. Two of the first four answer
turns were over SC-005's $0.10 aim ($0.12 and $0.16; median $0.028). B1 cost isn't A cost: recheck at T089.
Tokens (R16) aren't logged on B1, so they're measured on A at T089.

**What it changes:** T106 to T108 added; finding 2 goes on the sessions' watch list; finding 3 goes to T089.
