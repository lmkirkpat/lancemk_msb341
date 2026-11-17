# Research: Ask the mentor (spec 014)

**Date:** 2026-11-14. **Spec:** [spec.md](spec.md) (approved 2026-11-14, OQ-1 to OQ-5 as recommended).
**Updated 2026-11-16 (T005):** T001 to T003 folded into R4, R5, R10 and R18; R10's flag dropped (FR-047
withdrawn, constitution 1.6.0).

Each item: the decision, why, and what else was considered. Items marked **Live** are settled only by a
live check (tasks Phase 0); until then the plan builds to the stated assumption and the check can change
it. Items marked **PQ-n** wait on the builder (plan › Open questions).

## R1. Where the "asked" result comes from (FR-016)

**Decision:** a mentor tool, `give_answer`, in a new file `mentor/tools/ask.mjs` (TOOLS only; no SKILLS, no
FINDERS, which `index.mjs` already allows, as spec 015's `comp-reads.mjs` does). The mentor's answer is
the call's fields: `kind`, `explanation`, `steps`, `offered_skills`, `closing_offer`. The tool checks
them (R3), normalizes them, saves the steps in `session.json` (turn 6 and the hand-in need them), and
**returns the fields it accepted**. The panel draws from that tool result, which reaches it on both
runtimes as the `tool_result` event with `json` (`panel/lib/stream.js`, the A adapter's same event). It
never reads the call's input and never reads prose.

**Why:** the panel already draws every checklist from tool results (`panel/lib/checklist/`), so this is
the existing pattern, it works the same on B1 and A, and a tool can refuse a bad answer before anyone
sees it (the agent-audit lesson: hard rules in tools, not prompts).

**Rejected:** a JSON trailer in the prose (parsing); the API's structured output on A only (B1 and the
B1 evals couldn't see it); the panel asking a second model call to split prose (cost, and parsing by
another name).

## R2. The answer turn has no prose of its own (PQ-1)

**Decision (recommended):** in an answer turn the mentor writes no words outside `give_answer`. The
call carries the explanation and the closing offer as fields; the panel draws explanation, STEPS (from
`steps`), closing offer, then Go deeper. Follow-ups (turn 3), turn 4's read and turn 6's hand-back are
ordinary prose turns with no `give_answer`.

If prose does arrive in a turn that also has a valid result, the panel draws the result and leaves the
prose out (FR-048: nothing said twice); the eval set's deterministic check `answer_prose_empty` fails the
case, so the slip is seen. With no valid result, the panel shows the prose as it came (FR-048's fallback).

**Why:** MU's "call I'm least sure of" splits the answer into fields so STEPS sits between explanation
and offer. If the mentor also wrote prose, the panel would either show it twice or have to decide which
prose is the explanation, which is parsing.

**Cost of the choice:** nothing streams during an answer; the first sign of work is the panel's own
"Reading the open comp…" and the first tool call, which spec 003 SC-004 counts. Judges read the answer
rebuilt from the call (eval-engineer's runner).

**Rejected:** prose plus a steps-only tool (order problem: the offer comes before step 3 is seen, MU's
rejected option); prose for explanation and offer with the panel splitting at the tool call (works only
if the model always calls in the middle; fragile).

## R3. What `give_answer` refuses (hard rules in the tool)

**Decision:** the tool refuses, with a plain message and a code, an answer that breaks a rule the spec
states as a MUST and the tool can see ([contracts/ask-tools.md](contracts/ask-tools.md) › Refusals):

| Rule | Check | Code |
|---|---|---|
| FR-005 | at most 4 steps; each step's text non-empty, one line, starts with a verb from AE's actions list or "Open", "Select", "Play" (warned, not refused, in phase 1: the list is a guess) | `TOO_MANY_STEPS` |
| FR-006, PQ-5 | each step's `skill` is a skill ID, `"not_taught"`, or `null` | `BAD_STEP_SKILL` |
| FR-008, FR-016 | at most 2 offered skills, each among the steps' skills (PQ-4: a `howto` may carry 1 with no steps) | `BAD_OFFER` |
| FR-008 | `closing_offer` is one sentence ending in "?" when anything is offered or steps exist | `BAD_CLOSING` |
| FR-003 | for `answer` and `describe`, `explanation`'s first line contains the comp name of `give_answer`'s own read (*corrected 2026-11-16 (b)*; contracts/ask-tools.md step 1) | `COMP_NOT_NAMED` |
| FR-009 | `explanation` has no numbered list, no "Steps:" and no step text | `STEPS_IN_EXPLANATION` |
| FR-022 (K4) | no keyframe skill (easing, key types, speed graph, offset) offered or tagged for a step whose layer's motion has no keys, from spec 015's motion-sources map | `KEYFRAME_SKILL_ON_KEYLESS` |
| FR-027 | Group with a null not offered for a step on a null that already has children (route to Set the pivot) | `ROUTE_TO_PIVOT` |
| R13 | on A, an offered skill must be hand-in ready | `OFFER_NOT_READY` |
| FR-014, FR-016 | `clarify`, `outside`, `no_comp` have no steps and no offer | `NOT_ACTIONABLE` |

Word count (FR-008, about 120) is a SHOULD and a guess, so it's an eval rubric item, not a refusal.

*Added 2026-11-16 (b):* the build (T013) refuses five more, listed in contracts/ask-tools.md › Refusals and
data-model § 8: `ANSWER_SHAPE`, `KIND_MISMATCH`, `STEP_NEEDS_LAYER`, `COMP_IS_OPEN`, `NOT_PLAIN_WORDS`.

**Why:** each one was a baseline failure or an eval risk (AB 3: Easing for keyless motion). Each refusal
costs one retry, so the set counts refusals (plan › Risks).

## R4. Where B1 is detected (FR-017)

**Decision:** the mentor server reads `AE_MENTOR_RUNTIME`; `"a"` means A, anything else (unset included)
means B1. The helper sets `AE_MENTOR_RUNTIME=a` in the server's environment (`serverEnv` in
`panel/helper/lib/mcp-client.mjs`, the allowlist it already builds). B1's runtime folder `.mcp.json` sets
nothing. On B1, `give_answer` checks the offer as on A (so the wording the evals judge is a valid offer),
then **returns `offered_skills: []`**, and `go_deeper` refuses with `NOT_ON_THIS_RUNTIME`. The panel also
drops offered skills when its own `panel.json` runtime is `b1` (a display guard; SC-011 tests it).

**Why:** fail closed (a misconfigured A shows no Go deeper rather than one that can't hand over); the B1
eval runners see the same empty field, so FR-061's "none on B1" check can run; the rule lives in the
server, not the panel (constitution II). **Live:** T002 confirms the hand-over itself on the fake service.

**Confirmed 2026-11-16 (T002, `panel/helper/test/ask-handover.test.mjs`, merged `392ef53`; on Opus 5.5 and
Haiku 5.5):** today's helper already hands over through `Skill` (`panel/helper/lib/loop.mjs`, `switchTo`),
keeps the conversation, switches the tool list to the second skill's, and switches back on a
mid-conversation `/ask-mentor`. The one gap, the helper telling the server it's on A
(`AE_MENTOR_RUNTIME=a` in `serverEnv`), was built in T028. Nothing in this decision changes.

**Rejected:** the panel alone (the B1 evals wouldn't see it); telling the model (unreliable).

## R5. The hand-in (K6, FR-025, FR-026)

**Decision:** `go_deeper({ skill, step })` checks the skill was offered in the session's latest answer
(R1) and is hand-in ready, then saves a **hand-in** in `session.json`: the skill, the comp id, the
step's layer, the step number, the saved steps, the goal in general terms, `place_named` (a yes or no)
and a time. The mentor then calls `Skill` (A). The lesson's snapshot tool, through `opening()` (R6),
takes the hand-in for its own skill and comp once, opens on that layer and returns a `hand_in` slice.
**The learner's words are not saved**: on A the lesson runs in the same conversation (spec 013), so the
lesson's model already has them (TD § 7.2), and FR-045 keeps them out of files.

**Why:** the tool decides what the lesson opens on, as `opening()` already decides lesson or review (spec
004 FR-048), so the model has nothing to restate; and the hand-in can be tested without a model.

**Rejected:** passing the context in `Skill`'s `args` (model-written, unchecked, and the learner's words
would be repeated); the panel passing it (teaching logic in the panel).

**Expiry:** a hand-in is used once, only on the same comp, and lapses after the session window (3 h,
`SESSION_WINDOW_HOURS`).

**Confirmed 2026-11-16 (T002):** a `session.json` value a tool writes before the `Skill` switch is read by a
tool after it, so the hand-in can travel in `session.json` as decided. Phase 2 builds on what's there.

## R6. The opening read's order (FR-023, FR-026, FR-032)

**Decision:** `mentor/lib/opening.mjs` gains one step before today's step 2 and one condition on step 3:

1. the `mode` the call gave (unchanged);
2. **new: a hand-in for this skill and comp → `lesson`, `mode_source: "hand_in"`, never `review`**, even
   when a review is due (FR-023: practice, never a review);
3. the mode of the lesson in progress (unchanged);
4. a due review (unchanged), **except when an ask started in the session window (FR-032, phase 3)**;
5. a lesson (unchanged).

A learned skill's hand-in lesson is recorded as `practice` by today's rule (`learner-store.mjs`: a
non-review lesson on a skill with earlier lessons), which keeps status and review date (`nextState`'s
`keep()`). T003 pins this with a test (spec › Assumptions).

## R7. Pivot on a null (K7, FR-027) and the named place (rule 2, FR-034)

**Decision:** with a hand-in, `anchor_snapshot` accepts a null with children as its focus (today it
refuses nulls). The check grades two things for it: the null's Anchor Point changed, and every child's
comp-space footprint at the **same frames** (spec 015 R7, `same-time.mjs` if T004 there made it) didn't
move, on base values for expression-driven properties (spec 015 K2). When the hand-in says
`place_named`, the check takes the place as given: the nine-spot target row is reported as `your_call`
(MU's "? Your call") and never decides the pass. Footage with padding (AB held 3) gets the same
`your_call` when the learner names a spot, with no visible-bounds read (OQ-3: out).

**Why:** a null has no footprint of its own; its children's footprints are what "nothing moved" means
(TD § 10.2 K7). Grading the place would coach toward the checker (AB 5).

## R8. Asked entries in their own list (FR-038 to FR-041)

**Decision:** the record gains a top-level `asked: []` list beside `lessons` and `skills`, written by
new functions in `learner-store.mjs` (data-model § 3). Version stays 1: a record without `asked` reads as
an empty list, and old code ignores the key.

**Why:** every existing reader of `lessons` (reviews, `pastTargets`, kept-linear marks, the practice rule,
`opening.mjs`'s slice, the panel's memory view) stays unchanged, so FR-039 ("no status, review or
practice change") holds by construction and SC-008 is a unit test, not a sweep of six readers.

**Rejected:** `lessons` entries with `kind: "asked"` (every reader would need a skip, and one missed skip
turns an answer into a lesson).

## R9. K5: a record that blames the learner for what no check saw (FR-036)

**Decision:** the session keeps a list of **attributed changes**: what each check reported as the
learner's (today's `other_changes`, moved lists and `value_changed`, after spec 015's K2). `record_lesson`
refuses (`RECORD_UNATTRIBUTED`, plain message) a `summary` or `next` that pairs a change word (undo, undid,
moved, changed, reverted, reset, by mistake, fixed) with a layer name from the session's last snapshot
that isn't in the attributed list. AB 6's summary ("moved a parent's pivot by mistake; undid that") is the
test case. The `partial` half of FR-036 (a pass reached by matching the check's spot after the learner
said it was wrong) is closed by R7 (the place doesn't decide the pass when named) and by rule 2 in
`SKILL.md`; no text test can see it.

**Why:** a word-and-name test is crude but cheap and catches AB 6's shape; it errs toward refusing, and a
refusal only asks the mentor to rewrite. **Rejected:** a model judge in the tool (cost, and non-deterministic).

## R10. ~~`comp_active` in the bridge's health check~~ (FR-047, **withdrawn 2026-11-16**)

**Was decided (2026-11-14):** `GET /health` gains `comp_active: true | false | null` from a cached,
non-blocking read of `app.project.activeItem instanceof CompItem`; Home pauses Ask (`home-nocomp`) only on
`false`. Constitution 1.5.0 allowed the panel that one read.

**Live (T001, 2026-11-16, AE 27.0, read-only `mentor/dev/live-014/comp-active.jsx`; full table in
[`ask-build.md`](../../discovery/usage-notes/ask-build.md) › T001):**

| State | Comp open? | Read | Right? |
|---|---|---|---|
| Comp viewer focused; timeline clicked then the Knack panel focused | yes | yes | yes |
| A footage item clicked in the Project panel | yes | no | **no** |
| An empty spot clicked in the Project panel | yes | no | **no** |
| Every comp closed; File › Close Project | no | no | yes |
| A 4 s render running | yes | yes (after the render, most likely queued) | yes |

Panel focus doesn't change the read (the risk this section named), but a **no** can't tell "no comp open"
from "a comp is open and the learner last clicked in the Project panel". `activeItem` follows the viewer,
not the Project selection, and `app.activeViewer` is stale with every comp closed, so it can't back the read
up. Only **yes** is reliable.

**Fallback taken (builder, option A, 2026-11-16):** drop the flag. FR-047 is withdrawn, T015 is withdrawn
(the bridge is unchanged), and constitution 1.6.0 removes the 1.5.0 exception. Ask is always available on
Home. With no comp active at ask time, the mentor's read returns `NO_ACTIVE_COMP` and `give_answer` gives a
`no_comp` answer, "No comp open. Open one, or click into its timeline." (`ask-nocomp`). The mentor's read has
the same blind spot (it reads the active comp), but that sentence's one click fixes both false-"no" cases.
The panel already treats a missing flag as unknown and keeps Ask on, so no behavior changes; its now-dead
`comp_active` reading and `home-nocomp` state are a cleanup task (tasks T101).

**Rejected (2026-11-16):** a flag that reports only `true` and `null` (it would never pause anything, so it
would carry a constitution exception for no behavior); pausing only on a `false` taken while AE had focus
(states 3 and 4b had AE focused, so it would still be wrong).

## R11. Turn log tags (FR-058)

**Decision:** panel turn-log lines gain `thread: "ask"` for every turn sent from an ask thread, and three
kinds: `question` (a new question, from Home or the thread), `followup`, and `go_deeper`. A go-deeper
lesson's turns keep the lesson kinds and `thread: "ask"`, so `panel/dev/turns.js --ask` can report
answer turns (SC-004, SC-005's $0.10) apart from go-deeper lessons (SC-005's $0.40).

**Why not kind `ask`:** `ask` already names the lesson's Ask bar turns (`panel/lib/turns.js` KINDS).

## R12. One conversation per ask thread

**Decision:** an ask thread is one conversation (B1: one Claude Code session id; A: one helper and its
saved conversation). Its go-deeper lesson continues that conversation (FR-025). The panel session file
goes to **version 3**: `thread` (questions, answers' results, the latest steps, the go-deeper state) beside
today's `lesson`. Starting a lesson from Skills or Find my next lesson while a thread exists ends the
thread (it folds into history; Back to your question goes); a new question on Home while a thread exists
adds to it (MU `home-thread`). A version 2 file reads as a lesson, as today.

*Amended 2026-11-16 (spec amendment (d), the builder's decision):* starting a lesson (Find my next lesson,
Pick up, or a Skills lesson) ends the thread's **conversation** but keeps its last question, answer and
steps saved and visible, and "Back to your question ›" still works after the lesson. Nothing is deleted.
"Folds into history; Back to your question goes" no longer applies in phase 1. A new question after such a
lesson starts a new conversation in the same visible thread. **Why:** the learner came with a question, and
a lesson shouldn't take the answer away.

**Request text:** Home's ask sends `/ask-mentor ` plus the question as typed, so B1 launches with the ask
skill's tools (`skillOf`) and A opens the ask skill (`commandOf`). Follow-ups go as typed. The first
follow-up after a go-deeper lesson, and End lesson in one, send with `/ask-mentor ` in front, so A
switches back to the ask skill (`loop.mjs` handles a command mid-conversation). Go deeper sends
"Yes, go deeper on [short name]." (MU), added to `REQUESTS` and the request-eval sync test.

## R13. Which skills can be offered (PQ-2)

**Decision:** a skill can be offered on A only when its `FINDERS` entry says `hand_in: true` (each
skill's own tool file, so `index.mjs` doesn't change). Phase 2 sets it for pivot and null; phase 3 for
the other four. On B1 nothing is offered, so B1's evals are unaffected.

## R14. Rule 5's optional clause (FR-032)

**Decision:** the MUST half (no review opens a session started with a question) is built in phase 3
(R6). The MAY half (one clause after an answer, once per session) is **not built in this release**: it
needs the review test inside `give_answer` and a clause in a field the model fills before knowing it,
and nothing in the sessions depends on it. Revisit after SC-001's watch signal.

## R15. Branches and ownership

Like spec 015 R14: `mentor/**`, `bridge/**` and `.claude/skills/*-mentor/**` are add-only shared code, so
each spec phase's skill work is **one skill-builder branch with the cockpit's `--shared-owner`**. The
panel work (including `panel/helper/`) is a **parallel panel-builder branch per phase**: it builds against
the contracts here and fixture events, so it doesn't wait on the mentor branch or on spec 015. Eval work
runs once a phase's branches are merged. Only `mentor/test/` fixtures come from spec 015's captures
(015 T015); no new live capture is needed until the sessions.

## R16. Cost and speed per answer (SC-004, SC-005)

**Decision:** keep `ask-mentor/SKILL.md` under about 2,500 words (the lesson skills run 250 to 500 lines;
the baseline spent $0.16 loading one skill); call `describe_layers` in the summary shape first and the
detail shape only for the layers the answer names (spec 015 contract); one `give_answer`; no frame by
default (FR-013). T038 measures one answer's tokens on B1 before the ship step; if the median is over
budget on A, look at what loads per turn first (spec OQ-5).

## R17. Result lines and dividers (FR-051, PQ-3)

**Decision:** the six result lines and the divider are panel copy, chosen by the check tool's `passed`
and the lesson's skill, listed in [contracts/panel-ask.md](contracts/panel-ask.md) › Result lines. The
pivot line is MU's; the other five are proposed in the same shape (what the check saw, plain, no pass or
fail words).

## R18. Practice keeps the schedule (spec › Assumptions)

**Decision:** confirmed by reading `mentor/lib/reviews.mjs` `nextState`: a `practice` result on a learned
skill returns `keep()` (status, `review_due`, `reviews_passed_in_row` unchanged). T003 adds the test so a
later change can't break FR-023 silently.

**Confirmed 2026-11-16 (T003, `mentor/test/practice-keeps-schedule.test.mjs`, merged `0a69de2`):** a
non-review lesson on a learned skill, passed or partial, keeps status, `review_due` and
`reviews_passed_in_row` (`mentor/lib/reviews.mjs`, written back in `mentor/lib/learner-store.mjs`), and its
entry's kind is `practice`. **One `todo`:** a skill marked learned with no lesson entries of its own (only a
hand-edited record) logs `first`, not `practice`; the schedule is still kept. Only a hand-edited record hits it,
so nothing changes here; TD § 11's rule (asking again is normal, not a review) holds in today's code.
