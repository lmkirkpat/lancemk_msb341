# Quickstart: checking the overhaul (spec 007)

**Before any sitting:** one sitting at a time. Run `ae_status`, check `.git/knack-agents/ae.lock.json` has no holder from the last
10 minutes, and use a fresh session after any merge into `mentor/`. Panel: `bash panel/install.sh`, restart AE, dock at 260 × 480.
Notes go in `discovery/usage-notes/ui-overhaul.md`.

## 1. The comparison (SC-015)

**Current panel first, before step 1 merges** (T001). Reset Mentor Practice, then run `specs/003-mentor-panel/quickstart.md` §4, a to f,
at 260 × 480. Log time to pass, each "what do I do now?" moment, whether the answer was in view without scrolling, and what you scrolled
to. **New panel after step 1** (T028): the same comp reset, the same task, the same notes, plus which you'd rather use and why. Check the
result against the spec's success criteria.

## 2. Six live lessons (SC-014, SC-002)

| Skill | Task | Comp | Check |
|---|---|---|---|
| Easing | T028 | Mentor Practice | Opening rows, demo box, partial, pass |
| Key types | T056 | Mentor Practice | Empty slot at opening; Meant to keep moving if it comes up |
| Speed graph | T057 | Mentor Practice | Rows from the opening; `fastest` not shown |
| Offset | T058 | Mentor Practice 2 (Dots) | Timeline reads; layers kind |
| Pivot | T059 | Mentor Practice 2 | `lesson-passed-asking`, then saved |
| Null | T060 | Mentor Practice 2 | Stages open in order; Show me after the null is ready |

For each: no terminal; rows match the check and After Effects; count `lesson-focus-stale`; log the time from the turn log.

## 3. States at 260 × 480 (SC-010)

`home-first`, `home-return`, `home-cutoff`, `lesson-open`, `lesson-partial`, `skill-keytypes-check`, `skill-speedgraph-check`,
`skill-offset-layers-check`, `skill-pivot-check`, `skill-null-parent`, `practice-check`, `skills-many`. Nothing scrolls sideways; no button or
Ask is clipped. Repeat the lesson states at 680 tall to see chat and list together.

## 4. Find my next lesson (T061)

On a temp learner home (set `AE_MENTOR_HOME` in the MCP config's `env`) with four skills learned: press it, say yes, and confirm it hands over to
the pivot and the header follows.

## 5. Practice (T071)

A record with a review due, on a comp with a new target: Warm up, partial, pass, and the "Next warm-up" line. Then a comp with nothing new:
`practice-nothing-new`, and it stays due.

## 6. Keyboard (SC-009)

Flows 2, 3 and 5, no mouse, once.
