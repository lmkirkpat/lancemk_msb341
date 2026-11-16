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
