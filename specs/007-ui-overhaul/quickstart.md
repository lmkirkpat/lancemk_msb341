# Quickstart: checking the overhaul (spec 007)

**Before any sitting:** one sitting at a time. Run `ae_status`, check `.git/knack-agents/ae.lock.json` has no holder from the last
10 minutes, and use a fresh session after any merge into `mentor/`. Panel: `bash panel/install.sh`, restart AE, dock at 260 × 480.
Notes go in `discovery/usage-notes/ui-overhaul.md`.

**Protect the comps.** Title on Mentor Practice keeps its shaped ease on purpose, for speed graph review T035 (spec 004), a sprint 4
carry-over, so no reset here may lose it, whatever order the two run in. Around every sitting that changes Mentor Practice or Mentor
Practice 2:

1. **Capture:** with the comp active, `node mentor/dev/capture.mjs <scratch>/<comp>-before.json`, and File > Save a Copy of the project.
   The repo has no restore script, so the capture is the check and the copy is the restore.
2. **Reset** as the session needs, by script or by hand.
3. **Restore:** reopen the copy and save it back over the project. Check with a strict compare against the capture, including `layer_info`,
   because `capture.mjs --compare` skips it.

## 1. The comparison (SC-015)

**Current panel first, before the first `panel/` merge from this build** (T001), since the panel is linked to the main checkout. Capture and
reset Mentor Practice, then run `specs/003-mentor-panel/quickstart.md` §4, a to f,
at 260 × 480. Log time to pass, each "what do I do now?" moment, whether the answer was in view without scrolling, and what you scrolled
to. Restore. **New panel after step 1** (T028): the same capture, reset and restore, the same task, the same notes, plus which you'd rather use and why. Check the
result against the spec's success criteria.

## 2. Six live lessons (SC-014, SC-002)

| Skill | Task | Comp | Check |
|---|---|---|---|
| Easing | T028 | Mentor Practice | Opening rows, demo box, partial, pass |
| Key types | T056 | Mentor Practice 2 (Blink) | Empty slot at opening; Meant to keep moving if it comes up |
| Speed graph | T057 | Mentor Practice | Rows from the opening; `fastest` not shown |
| Offset | T058 | Mentor Practice 2 (Dots) | Timeline reads; layers kind |
| Pivot | T059 | Mentor Practice 2 | `lesson-passed-asking`, then saved |
| Null | T060 | Mentor Practice 2 | Stages open in order; Show me after the null is ready |

For each: no terminal; rows match the check and After Effects; count `lesson-focus-stale`; log the time from the turn log.

**SC-002's live tally,** across these lessons. Plan the checks, since a clean lesson won't reach these counts by itself:

| Needed | Count |
|---|---|
| Checks from the panel, each compared with the check's result (100%) and with After Effects (at least 9 of 10) | at least 10 |
| Of those, partial | at least 3 |
| Of those, with a change outside the lesson | at least 2 |
| Of those, with something undone | at least 1 |
| Openings on easing, speed graph or offset: Proposed until the first reply or check, then not | 3 of 3 |

## 3. States at 260 × 480 (SC-010)

`home-first`, `home-return`, `home-cutoff`, `lesson-open`, `lesson-partial`, `skill-keytypes-check`, `skill-speedgraph-check`,
`skill-offset-layers-check`, `skill-pivot-check`, `skill-null-parent`, `skills-many` (T062), and `practice-check` (T071, since Warm up isn't built
at T062). Nothing scrolls sideways; no button or Ask is clipped. Repeat the lesson states at 680 tall to see chat and list together.

## 4. Find my next lesson (T061)

This needs a learner home with four skills learned, read by both Home and the mentor. The CLI recipe doesn't work here: `panel/lib/runtime.js`
rewrites the runtime `.mcp.json` on every launch, and Home reads the record through `defaultHome()`.

**Untested, so T061 confirms it first.** Set `AE_MENTOR_HOME` on both the install and AE's launch:

1. `AE_MENTOR_HOME=<temp> bash panel/install.sh`, which writes `panel.json` there, and put the four-skill `learner.json` in `<temp>`.
2. Quit AE, then start it from that shell by the executable inside its app bundle, with `AE_MENTOR_HOME=<temp>` set. The Dock doesn't pass a shell's
   environment, and `open` may not.
3. Confirm: Home shows the temp record, and the mentor's suggestion matches it (the pivot, not what your real record would give).

If they disagree, stop and don't press on. Fallback, AE quit: copy the real `learner.json` aside, put the four-skill one in its place, run, and copy the
real one back. Log which way worked.

Then press Find my next lesson, say yes, and confirm it hands over to the pivot and the header follows. Afterward, quit AE and start it from the Dock.

## 5. Practice (T071)

A record with a review due, on a comp with a new target: Warm up, partial, pass, and the "Next warm-up" line. Then a comp with nothing new:
`practice-nothing-new`, and it stays due. Check `practice-check` at 260 × 480 for SC-010.

## 6. Keyboard (SC-009)

Flows 2, 3 and 5, no mouse, once.

## 7. Moving to A (FR-099, `decisions/011`)

**Free (T077):** `node product/evals/lib/ready-for-a.mjs <skill>` on all seven skills, then each set's runner with `--runtime a --dry-run`.

**Paid, only on the builder's go (T078, T079):** the eval run on A, then `bash panel/install.sh --runtime a`, restart AE, run one easing lesson and one
Find my next lesson through a hand-over, about $1 of credit. Check the rows, Show me, and that no setup or error copy changed. Then
`bash panel/install.sh --runtime b1` and restart AE.
