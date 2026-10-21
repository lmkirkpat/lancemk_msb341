# Contract: the shared mentor tools after wave A

Changes to the tools every skill shares (`mentor/tools/common.mjs`). Easing's own tools
(`snapshot_project`, `set_ease`, `diff_since_last`) are unchanged, inputs and outputs, so the
easing evals see what they saw (FR-035). Server rules and errors at the end.

## `read_learner_record` (changed output, same input)

Returns the record as today, plus, per skill, the worked-out review fields so the mentor never
does date arithmetic:

```json
{
  "version": 1,
  "skills": {
    "easing.basic": { "status": "learned", "last_practiced": "…", "times_passed": 2, "next": "…",
                      "review_due": "2026-10-13", "reviews_passed_in_row": 0, "review_is_due": true }
  },
  "lessons": [ … ],
  "path": "…/learner.json"
}
```

`review_due` is filled in from `last_practiced` when the file has none (FR-023); the file itself
isn't rewritten by a read. `review_is_due` is computed for today's local date.

## `record_lesson` (same input, new checks, new stored fields)

Input schema unchanged (`skill`, `project`, `comp`, `attempted`, `result`, `demo_used`, `summary`,
`next`); `skill`'s enum is every built skill's ID. New rules, all `RECORD_MISMATCH` (not for the
learner):

- `skill` must be the current lesson's skill.
- `demo_used: true` is refused for a review (FR-021). (It's also impossible: review mode can't
  demonstrate.)
- The existing result and demo checks, generic over skills: "the demonstration ran" instead of
  "set_ease ran".

Stored: the entry plus `kind`, `already_knew` and `targets` from the current lesson, and the skill
state per [data-model.md](../data-model.md) › Skill state. Reply unchanged: `{ saved: true, skill:
{ status, next } }` (the existing tool test asserts it word for word).

Also: `record_lesson` writes the current lesson's `kept_linear` list to the record's `marks`
(replacing a mark on the same comp, layer and path) and removes marks for this comp that have
lapsed in the lesson's baseline (data-model › Kept-linear mark). `read_learner_record` returns
`marks` as stored.

## `recommend_next` (new)

```json
{ "requested_skill": "easing.speed_graph" }      // optional: a skill the learner asked for
```

Reads the record, tries one snapshot of the active comp, and returns:

```json
{
  "looked_at_comp": true,
  "comp": "Mentor Practice",
  "record_readable": true,
  "recommendation": {
    "skill": "easing.speed_graph",
    "skill_name": "Shape the ease in the speed graph",
    "kind": "continue" ,
    "reason": "in_progress",
    "focus_layers": ["Title"],
    "offer_practice_comp": false
  },
  "requested": {
    "skill": "parenting.null", "skill_name": "Move a group with a null",
    "built": false, "learned": false,
    "missing_prerequisites": [{ "skill": "transform.anchor", "skill_name": "Set the pivot" }],
    "has_focus": false
  }
}
```

| `kind` | `reason` | When (FR-004, in order) |
|---|---|---|
| `continue` | `in_progress` | 1. A built skill the record says is practicing (most recent first) |
| `review` | `review_due` | 2. A learned, built skill with `review: true`, review due, a new target in the comp, no unprompted review offered in the last 3 hours, and no practice lesson on it in that window (FR-020; research R8). Path order breaks ties |
| `lesson` | `next_in_path` | 3. The first built, not-learned skill in path order whose hard prerequisites are learned and that has a focus in the comp; among those, one whose soft prerequisites are all learned comes first |
| `lesson` | `next_in_path_no_focus` | 4. As 3 without a focus; `offer_practice_comp: true` |
| — | `nothing_left` | `recommendation: null`: every built skill is learned and no review is offered |

- **AE unreachable or busy:** `looked_at_comp: false`; steps 2 to 4 skip the "in the comp" tests,
  step 2 offers nothing (a review needs a target), and step 3 falls to step 4's wording without
  offering the practice comp. The mentor says it hasn't looked at the comp (Edge Cases).
- **Record unreadable:** `record_readable: false`, every skill treated as not started, the file not
  written (Edge Cases).
- **A review recommendation is remembered** in `session.json` › `review_offers`. Declining needs
  no call: the review stays due.
- **`requested_skill`:** `built: false` means the mentor says it isn't ready yet and never starts it
  (FR-006). `missing_prerequisites` lists unlearned **hard** prerequisites only (FR-005, FR-007).
- **Never:** recommends an unbuilt skill or one with an unlearned hard prerequisite (SC-005), or
  offers a review for an unlearned skill (FR-020).
- The output has IDs for the mentor; `skill_name` is what it says (FR-008, server rule 5).

## Server instructions (`mentor/server.mjs`)

The opening line says the tools teach After Effects skills in the learner's comp, not easing only.
Rule 3 becomes: "At most one demonstration per lesson, with the lesson's own demonstration tool
(`set_ease` for easing), on its demo target only, and none in a review; the learner does the
rest." The other seven rules are unchanged, word for word.

## Errors (`mentor/errors.mjs`)

| Code | Message (for the learner) | New? |
|---|---|---|
| `DEMO_USED` | "I've already shown you one in this lesson. The rest are yours to do, and I'll check them." | reworded (was "one pair") |
| `NOT_DEMO_TARGET` | "I can only demonstrate on the one I picked for this lesson. The others are yours to do." | reworded |
| `NOT_KEPT_LINEAR` | "That one isn't linear all the way through yet, so I can't note it as constant speed. Set its keys to linear first." | new |
| `REVIEW_NO_DEMO` | "This one's a review, so it's all yours this time. Have a go and I'll check it." | new |
| everything else | unchanged | |

`registerErrors(map)` adds a skill's own codes; `bridge-client.mjs` builds its error pattern when
first needed, not at import, so registered codes are recognised from snippets too.
