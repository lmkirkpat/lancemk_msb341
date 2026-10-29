# Pacing rules and re-baselines: usage notes

The lesson pacing rules (curriculum § 2) were put into all six skills on 2026-10-28 and 10-29, and
every eval set was re-baselined after them. This file logs the results, the cost, and what the rounds
taught. Results files are in `product/evals/<set>/results/`; each set's README logs every rubric or
check change made after seeing results, with the builder's approval.

## What changed

- **Curriculum § 2** (`specs/004-ae-curriculum/curriculum.md`):
  - **The opening rule.**
  - **Three turn rules:**
    - Every turn ends on one thing to do or answer.
    - A fact goes in the turn where it's acted on, or only if asked.
    - A side question gets one or two sentences, then the same pending step.
  - **"Do it for me":** the one demo or watch offer is made once, never twice.
  - **Show me first:** one idea sentence, the demo, then a one-sentence hand-back.
  - **A two-sentence cap** on declines and side answers.
- **Specs:** 002, 008 to 012 got their pacing requirements and tasks (T262 to T265, T344 to T347,
  T420 to T435).
- **All six `SKILL.md` files:**
  - The pacing rewrite.
  - The Style line "End every turn on one thing to do or answer, never on 'Ready?'."
  - A record summary in general terms: no times, no layer or property names, no method, no motive.
    Offset keeps its measured gaps ("about 4 and 8 frames") by the builder's decision.
- **All six rubrics:**
  - R-ONE-IDEA added to each.
  - The judge's transcript limit raised to 16000 characters in all six runners.

## Results: every set meets SC-006

SC-006 is at least 80% passing, with every hard-rule check passing. Each row is the full re-baseline
under the new pacing, followed by targeted re-runs of the failures.

| Set | Full run | Task | After the fix rounds |
|---|---|---|---|
| Easing | 25/26 (96%), 2026-10-28 | T423 | Case 07 3/3 |
| Key types | 23/25 (92%), 2026-10-28 | T427 | Cases 15 and 18 3/3 (18 needed a prompt fix and a rubric fix) |
| Speed graph | 21/25 (84%), 2026-10-28 | T431 | Cases 05, 16 and 23 3/3; case 03 2/3 |
| Offset | 29/33 (88%), 2026-10-28 | T435 | Cases 04, 08, 11 and 33 3/3; cases 13, 20 and 28 2/3; case 22 passes |
| Set the pivot | 41/46 (89%), $28.89, 2026-10-28 | T265 | Cases 11, 23a, 23c and 29 3/3; case 09 2/3 |
| Null | 39/40 (98%), $28.16, 2026-10-29 | T347 | Case 30 3/3 (after two prompt rounds) |

The pivot's first baseline was 27/44 (61%) on 2026-10-27. The self-note fix and the pacing rules
account for the rise.

## Cost

| Round | Cost |
|---|---|
| Pivot and null pacing re-runs, earlier rounds | $31.65 |
| Pivot and null fix round (two-sentence cap) | $9.70 |
| Batch 1 re-baselines (easing, key types, speed graph, offset) | $56.32 |
| Fix round 3 re-runs plus the pivot re-baseline | $50.98 |
| Fix round 4 re-runs plus the null re-baseline | $59.73 |
| Fix round 5 re-runs | $9.56 |
| Null case 30, two prompt rounds | $5.74 |
| **Total** | **$223.68** |

Estimates ran about 2x low. A case run with `--repeat 3` costs 3x a single run, not about the same.
Offset round 4 grew from 3 cases to 12 because the new record check would have flagged 11 old
records.

## Findings

1. **The model copies an example sentence word for word, even when it breaks the rule beside it.**
   - **Key types 18 (0/3):** the example "drops to 0 just after 1 s instead of staying at 100 until
     1.4 s" was repeated in all three runs, with times no tool gave.
   - **Null 30 (0/3):** the cockpit's own example "Placed a null at the group's pivot…" was copied in
     all three runs. The rubric fails a record that names a place the group turns from after a
     slide. After the example changed to the rubric's own Pass sentence, "Parented the group to a
     null and slid it with one move.", the case passed 3/3 with the rule unchanged.
   - **Offset 13 and 28:** a ban on "so that" in the next step failed 2 of 9 runs. With a worked
     example ("Stagger the properties within a single layer."), all five records followed it.
   - **Rule:** write the example first, take it from the rubric's Pass line when one exists, and
     check it against the rubric before merging.
2. **When a design moves a turn, the case scripts need rewriting, not only their checks.**
   - Four of the pivot's five failures were scripts written before § 20 moved the watch offer and
     the walk-through to a later turn. The learner's lines landed one turn early.
   - Re-scripting changed what two cases test. Case 09 no longer covers a matte that's already
     there. Case 11 no longer covers turning down a show-me before the walk-through. The builder
     accepted both on 2026-10-29 as coverage to restore later.
3. **Rubrics drift from prompts without anyone noticing.**
   - R-KT-WRONG-SIDE wanted the mentor to say the pair "still fades", which the prompt already
     banned. It only surfaced when the case's other faults were fixed.
   - R-AN-NO-NUMBER wanted the place repeated in a hand-back turn where pacing rule 3 says to hand
     the step back.
   - Both were changed with the builder's approval and logged in the set READMEs.
4. **Checks that require the exact words of an example sentence break when the wording changes.**
   - Null 02 wanted "opacity" where the skill says "fade".
   - Offset 26 wanted "stays" where the mentor said "staying".
   - Key types 13 rejected the shortcut written out in words.
   - Speed graph 15 had a stale frame check.
   - Offset's record check banned the word "bar", which is also a practice layer's name.
5. **A check that reports only its first hit hides the others.** Offset's record check stops at the
   first problem, so fixing one fault can expose another that was there all along. Quote whole
   records when sizing a fix.
6. **The mentor says more than the tool reported.** In key types 18 it invented what a wrong-side hold
   does. In offset 11 it added a fault to a passed check. The prompt fix ("say only what the check
   shows") worked: both went from 0/3 to 3/3. A tool that returns the sentence to say would make it
   stick (future item below).

## Process lessons (the cockpit's)

- **Use `sed -i ''` on macOS, or edit with Python.** BSD `sed -i` without the empty suffix failed
  silently, and one case 02 re-run ($1.01) ran on an unchanged file.
- **Chain merge guards with `&&`, not `;`.** A `;` let `pacing-evals-2` merge past a flagged check.
  The flags turned out to be the eval-engineer's own task ticks, which the builder said to keep.
- **Wait on the process, not the notification.** Batch 1's first attempt died at 19:26, and the agent
  waited about two hours for a notification that never came. Runs now check the process is still
  alive (`kill -0`), and the cockpit checks `claude -p "say ok"` answers before a long batch.
- **Never merge new skill commits into an eval branch while a run is going.** The runner reads
  `SKILL.md` from its own worktree.
- **Size a re-run by replaying the new check against stored records first.** It costs nothing.

## Open

- **Watch list, each 2/3 with a different cause per run, no prompt change yet:**
  - Pivot 09: says the matte's eye is off without a tool saying so.
  - Speed graph 03: promises to talk the learner through the steps, then explains the curve
    instead.
  - Offset 20: makes the linear point twice.
  - Offset 28: "for an even rhythm" gives a motive in the summary.
- **Future items, not approved:**
  - `record_lesson` refuses summaries with focus layer names or key times. This is shared code.
  - The easing snapshot returns the layer count.
  - The offset check flags properties that land early.
  - `anchor_demo` accepts the layer name.
  - Key types and offset checks return the sentence to say.
- **Coverage to restore:** pivot case 09 (a matte that's already there) and case 11 (turning down a
  show-me before the walk-through).
- **Spec 004 Phase 10:** T413 to T415 are still unticked in `specs/004-ae-curriculum/tasks-wave-b.md`.
  The re-baselines show no self-note failures, so check whether they can be ticked. T416 (the live
  first lesson and review) is open.
