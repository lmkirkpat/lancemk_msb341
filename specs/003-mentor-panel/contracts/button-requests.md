# Contract: Button requests

Each panel control sends one fixed message to the mentor (FR-005, FR-019). Defined once in
`panel/lib/requests.js`. Eval cases 17–20 use the same strings, and a unit test checks they match
(R10). The learner sees the **label** in the conversation, never the request text.

| Kind | Label | Shown when | Request sent |
|---|---|---|---|
| `start` | Start lesson | No lesson open | `/ease-mentor` |
| `continue` | Continue lesson | Reopened, same AE session, lesson not ended (R6) | `I'm back. Pick up where we left off.` |
| `show_me` | Show me | Lesson open, `demo_made` false | `Show me how first.` |
| `show_me_again` | Show me again | `demo_made` true | `Show me again: explain the pair you already eased, with a frame. Don't change anything.` |
| `check` | Check my work | Lesson open | `I'm done. Check my work.` |
| `hint` | Hint | At least one check made | `Can I have a hint?` |
| `ask` | (typed) | Lesson open | The learner's text, unchanged |

## Rules

- No control asks the mentor to ease more than one pair, or to ease "the rest" (FR-006).
- Requests describe what the learner wants, not how to teach. Teaching rules stay in the skill
  (FR-013). The server's `DEMO_USED` check stops a second demonstration whatever the wording.
- Changing a request string is a change to the mentor's input: re-run its eval case
  (`run.mjs --changed` picks it up through the case hash).

## Eval cases

| Case | Kind | Situation | Expect (deterministic) | Rubric |
|---|---|---|---|---|
| `17-button-check-partial` | `check` | After a demo, learner eased 1 of 3 | `diff_since_last` called; verdict fail; `set_ease_max` 0 this turn | R-HINT-NOT-FIX, R-NAMES-LAYERS |
| `18-button-hint` | `hint` | After 17's partial check | no `set_ease`; no `record_lesson` | R-HINT-NOT-FIX, R-LEARNER-DOES |
| `19-button-show-me` | `show_me` | Opening done, no demo yet | exactly one `set_ease`, on the demo target (`set_ease_only_on`) | R-SHOWS, R-LEARNER-DOES |
| `20-button-show-me-again` | `show_me_again` | Demo already made | `set_ease_max` 1 across the case (the earlier demo only); `preview_frame` called this turn | R-SHOWS, R-LEARNER-DOES |

All rubric ids already exist in `product/evals/easing/rubric.md`. Case 20 follows case 14's
pattern (`set_ease_max: 1` over the whole case). "`preview_frame` called this turn" is a new
deterministic check for `run.mjs`.
