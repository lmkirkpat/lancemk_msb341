# `next-mentor` hand-over: open mismatches (2026-11-04)

Found by the skill builder while adding `/anchor-mentor` and `/null-parenting-mentor` to the hand-over
table (merged 2026-11-04). From reading the skills and tools; nothing was run live, and no eval set
covers `next-mentor`, so the new table rows are unproven in a real hand-over too.

## To fix later

1. **Passed-on layer names don't reach either new skill.** `next-mentor` passes them "so the lesson can
   propose them", but both skills open with a snapshot that takes no options.
   - Null's opening names no layer, and its schema has no `focus_layers` (only `skill_options.focus`, 2
     to 4 layers). So the suggestion can name layers and the lesson then asks which should move as one.
   - Anchor's schema has `focus_layers`, but its prompt doesn't use them; the proposal is the snapshot's.
2. **Null's crowded comp gives an empty layer list.** `finder` returns `{ count: crowd_size, layers: [] }`,
   so `recommend_next` says there's something to teach but names no layers. `next-mentor` step 3 says to
   name the skill and the layers, with no wording for an empty list. The table change makes this reachable.
3. **Anchor's list can be long.** Its `focus_layers` holds every default candidate, so step 3 could read
   out many names, while the skill's own rule is to list no layers.
4. **The prerequisite can be offered twice.** A learner insisting on null without the pivot gets the
   pivot offered by `next-mentor` step 4 and again by the lesson's step 0. Offset and speed graph have
   the same pattern with easing.
5. **"Review" as an argument.** All five skills with a review send `mode: "review"` only when the
   learner's own words ask, while `next-mentor` passes "review" as an argument. A due review is fine,
   because the tool picks review itself. It could matter at step 5, when a learner says they already
   know a skill they haven't learned.

## For its eval set, when it gets one

Cover items 1, 2 and 5, and a real hand-over to each of the six skills. Run it on A: B1 can't hand over
(`specs/013-api-runtime/research.md` › R6).
