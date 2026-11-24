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

## Phase 2 (2026-11-19)

Built on two branches (mentor `014-p2-mentor`, panel `014-p2-panel`), reviewed (T060 reviewer, T061
design-reviewer), fixed in one round each, eval cases T058 and T108 on a third branch, trial-merged in a scratch
worktree and merged to `main` at `4370e67` (T062). Tests on `main`: mentor 1956 pass (1960 with 4 todo), panel 876,
helper 294, hooks 39.

**Review fixes the builder decided (2026-11-19):** "something to record" means a demo was made or a check run;
`end_lesson` refuses a lesson with either (`LESSON_HAS_PROGRESS`), so a go-deeper lesson stopped before any demo or
check writes no record. A Set the pivot offer on a layer the pivot finder rules out is refused in the tool on A.
The design review's must-fix 1 (Back or Home skips the return) was a false positive (`settleDeeper` runs at turn
end); checking it found a real race (a follow-up between the record saving and the turn ending), now fixed.

### T059: anchor set on B1

Full run at `4370e67`: 63/68 (93%), $57.87, `results/2026-11-19-145824.json`. Every hard-rule check passed.
- **60 (new, case bug):** the record and hand-back come after the learner answers the understanding check; the
  case ended at the pass. Turn 5 added; the hand-back regex takes the skill's and the panel's wording. 3/3.
- **62 (new, regex):** the skill has no verbatim trace sentence; the regex now takes the model's right wording. 3/3.
- **45 (case ambiguity):** "I set it. Done." after "tell me when the playhead is there" read as the playhead, so
  the check was skipped. Turn 3 now says what was set. 2/3; the miss left is the `away_from_rest` hint not saying
  the pivot did move. Watch list.
- **51 (mentor, not phase 2):** `/anchor-mentor lesson` sent no `mode`, so a due review opened as a review. Step 0
  led with "no options and no `mode`" and put the exceptions after it. Fixed by leading with the exception in
  anchor, null, offset and key types (`3248d21`). 3/3; null 49 (the same button) 3/3.
- **21a (mentor):** named Layer > Transform for a place other than the centre about 1 run in 3. One line added
  (`3248d21`). 21a and 21b 3/3.
- Triage and fixes $27.30 (`a29eed8`, `3248d21`). **Anchor meets T059's bar.** Offset and key types got the step 0
  fix unrun: check their lesson-button cases at the next full run.

**What it changes:** a rule followed by its exceptions reads as the rule; lead with the exception. A learner line
that could answer the mentor's last ask will be taken as that answer, so case turns say what was done.

### T059: null-parenting, next-mentor and ask on B1

**Null** (full run at `08b7729`): 52/58 (90%), $46.68, `results/2026-11-19-154146.json`; no hard-rule break.
- 56 (new): the `never` regex took "rather than on a second null" (a refusal) for an offer; it now skips a negated
  match (`1e21e8f`). Later one run echoed the prompt's own "never a second null"; both prompt lines now say "teach
  no null on top of it" (`45bdca5`). 3/3.
- 57 (new, real): step 1's `refused` handling covered a layer that follows a null but not a step that names the
  control null itself (`reason: "null"`), so the mentor called the pivot lesson a prerequisite and asked for a
  group. A route line in the rubric's Pass-line words (`4d2964b`, `3cf759b`). 3/3; 52 and 53 3/3.
- 43: the regex didn't take "keyframes … at once" (a right refusal). Fixed. 3/3.
- 08 and 30: the judge failed a suggested next move (Rotation) as invented; R-NAMES-REAL now exempts suggestions
  and example names (`1e21e8f`, builder to confirm). 11 and 55: noise, 3/3 unchanged.

**Next-mentor** (`--repeat 3` at `4d2964b`): 6/10, $5.65. Not a regression: 02 and 09 failed the same way on 11-09.
- 02 and 09: the model copied step 3's label "A review that's due" ("a quick review is due" reads as owed), then
  split "all hands-on, no demo" into a third sentence. Now: say how long it's been, never "due"; the offer is one
  question holding "all hands-on, no demo". 3/3 each.
- 04: after that edit it offered practice and dropped "up to date"; the nothing-left line is now spelled out and
  suggests nothing else. 3/3. 01, 03 and 06 re-run 3/3 (same step 3).
- 14 (new, K4): the check banned the bare word "easing", but "since you've got *Easing* down" is a fair reason;
  the regex now bans easing only as a way to change the motion (`f06c59b`). 3/3. 05: one past-lesson layer name, 5/6.
- Set: 8/10 with 07 and 08 the known FR-082 gaps (`64377de`). Triage and fixes about $4.

**Ask** (`--repeat 3` at `64377de`): 19/19 (100%), $12.36, `results/2026-11-19-171822.json`; no FR-061 check failed.
Single-run misses: 02 and 03 R-ONE-IDEA (two or three choices in the closing offer; 03 at 165 words), 11 one run
with prose next to the answer (`answer_prose_empty`, plumbing, not FR-061) and 3 refusals. Case 19 is A only.

**T059 met for all four sets.** B1 spend for T059: about $165. Offset and key types got the step 0 fix without a
run; easing, key types, speed graph and offset got the new stop rule without a run (same text in every skill):
both are checked at the ship step's six-set A run.

**What it changes:** prompt words are read as wording the model may say: a label ("A review that's due") or a
prohibition ("never a second null") comes back in the reply. Name rules without the forbidden words, and keep
labels neutral. Re-run the cases that share an edited step, not only the ones that failed.

## Ship step (2026-11-19)

### T088 to T091: free checks, A runs, panel on A

**T088** at `051ebc2`: all eight skills ready for A; dry runs valid (ask 20 of 20 on A, anchor 68, null 58,
next-mentor 10 of 14).

**T089 and T090** at `051ebc2` (A, about $9.15 credit; the judge on subscription):
- Anchor 65/68 (B1 63/68) and null 53/58 (B1 52/58): both meet FR-033. Every hard check passed.
- Ask 15/20 (B1 19/19). 8 of 16 refusals were `OFFER_NOT_READY` for easing, key types and speed graph, which
  `main` rightly refuses until phase 3's hand-ins (T073); that explains 05 and 17. `BAD_CLOSING` 7 of 37, every
  one fixed on the retry (B1 shows the same). 12 noise (2/3), 13 a fixture slip (`practice.json`'s 140° next to
  `time * 30`; 3/3 on repeat). SC-006's A half is re-run on phase 3's merge commit.
- **Case 19 (situation 16, the whole go-deeper on A):** `handover@N` could never pass on A. The helper reports a
  hand-over as `skill_loaded`, not a `Skill` call, and no runner mapped it (`cbae7b9`). Phase 2's B1 cases
  never hit that path. The lesson keeps its understanding question, so the case got a fifth turn. Then 3/3.
  **One real gap:** in 1 of 9 runs the mentor invited a try after the understanding check and stopped, with no
  record and no hand-back. The prompt fix goes on the phase 3 branch (anchor "From an answer" item 6).
- Triage: anchor 07's learner line was ambiguous ("I set it" read as the playhead); anchor 60's and ask 19's
  hand-back regexes were too strict. Repeats about $4.6 credit. Merged `014-a-triage`.

**T091:** `bash panel/install.sh --runtime a` done; AE lock free; learner record is the builder's own.
Restart AE before session 1.

**What it changes:** the paid runtime's own paths (here the hand-over event) are first tested at the ship
step, because B1 can't take them. Write an A-only adapter test when a feature adds an event B1 never emits.

## Phase 3 merge (2026-11-23)

### T083 and the ask set on A at `c4b2d88`

- **Merge:** mentor `07e02f6` first, then evals `4231201` and panel `c4b2d88`. The evals branch already held an
  older merge of the mentor branch, so its ownership check flagged 40 skill-builder files until the mentor
  branch was on `main`; its own commits touch only `product/evals/`. Same final tree in either order. Suites
  match the trial merge (mentor 2036 + 4 todo, panel 894, helper 294, hooks 39, evals 166, dry runs valid).
- **Before the full run:** ask 19 and 31 pass on A ($1.00).
- **Full run: 23/31 (74%, target 80%)**, $1.86 credit. Refusals 12 of 45 answer calls (27%), 9 of them
  `BAD_CLOSING`: plan › Risks says loosen a guard above 10%, so this one is the signal.
- **Repeats ×3 on A** (about $2.1 credit):

| Case | Repeat | Reading |
|---|---|---|
| 07 outside the six | 3/3 | noise |
| 18 follow-up after a lesson | 3/3 | plumbing (`service_busy` on the full run) |
| 19 whole go-deeper | 2/3 | majority pass; the miss is the hand-back line in turn 5 |
| 12 matte eye off | 1/3 | judge R-HONEST-KINDS (a value said as fact); a known A weak spot from 051ebc2 |
| 25 goal full of names | 1/3 | the goal said "a light sweep"; the effect is CC Light Sweep. The guard refuses only the whole name, the case banned "Light Sweep". **Builder's call (2026-11-23): "a light sweep" is general.** Bare "Light Sweep" dropped from the case's `never_names`; then 3/3 on A |
| 21 done after the playhead moved | 0/3 | turn 4 prose 8 to 10 sentences (cap 5); 2 of 3 say "you dragged" |
| 23 just the steps | 0/3 | turns 2 and 3 run 10 to 12 sentences (cap 6) |
| 26 the learner says it worked | 0/3 | 5 sentences (cap 3); once said "saved" |
| 30 repeat card on turn 4 | 0/3 | `note_said` called before the reread; prose 8 to 10 sentences |

- **Eval plumbing fixed:** the runner's ask-turn allow list (`ASK_ALLOWED`) was still phase 1's three tools, so
  any `note_said` call failed `only_ask_tools` (26 and 30 on the full run). `note_said` added, and
  `test/allowed.test.mjs` now ties the list to the skill's `allowed-tools` (fails on the old list).
- **Real findings, for `ask-mentor/SKILL.md` (not changed tonight; a prompt change moves every hash):**
  1. **Turn 4 runs long on A.** The "Done / it didn't work" rule has no sentence cap; the follow-up rule's
     "three sentences at most" isn't reaching it. Proposed: give the try-went rule its own cap (two or three
     sentences plus the next step).
  2. **Two rules both say "first".** "Done / how a try went" says read with `describe_layers` first; "they say
     how the steps went" says `note_said` first. A message like "I did step 3 and it still shakes" is both.
     Proposed: read first, then `note_said`, then the reply.
  3. **"You dragged"** in 21: the rule says a difference is theirs only when they said they made it.
- Phase 3's cases 21 to 31 had only been dry-run; this is their first live run on any runtime, so there's no
  B1 number to compare. **SC-006's A half is not met** at `c4b2d88`; it re-runs after the fixes above, with
  T080.
- **What to watch in the sessions:** replies after "done" or "it worked" that run long, or credit you with a
  change you didn't make.
