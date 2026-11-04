# Contract: Button requests (replaces spec 003's for this panel)

Defined once in `panel/lib/requests.js`. The learner sees the label in the conversation, never the
request. Requests say what the learner wants, not how to teach.

| RQ | Kind | Label | Shown when | Request |
|---|---|---|---|---|
| RQ-01 | `start` | Start lesson | `home-first`, `lesson-exited` | The skill's command, bare (`/ease-mentor`) |
| RQ-02 | `new_lesson` | New lesson | `skill-detail*`, no lesson open | `/<skill>-mentor lesson`; easing `/ease-mentor`, which has no review to avoid |
| RQ-11 | `warm_up` | Warm up | Practice due, or `skill-detail` on a learned skill with a review | `/<skill>-mentor review`. Never easing |
| RQ-12 | `continue` | Continue lesson | `home-cutoff` | `I'm back. Pick up where we left off.` |
| RQ-13 | `retry` | Try again | `lesson-error`, passing kinds except `refused` | The last request, unchanged, under FR-030's rule |
| RQ-14 | `check` | Done, check it | A lesson with targets | `I'm done. Check my work.` **(unchanged)** |
| RQ-14 | `hint` | Hint | From the first check | `Can I have a hint?` |
| RQ-14 | `show_me` | Show me | A demo target, no demo, not `demo_unknown`, not a review | `Show me how first.` |
| RQ-14 | `show_me_again` | Show me again | `demo_made`, not `demo_unknown` | Easing: `Show me again: explain the pair you already eased, with a frame. Don't change anything.` Other five: `Show me again: explain the change you already made, with a frame. Don't change anything.` (Open question 8) |
| RQ-15 | `find_next` | Find my next lesson | `home-return` | `/next-mentor` |
| RQ-16 | `yes` | Yes, let's go | `lesson-picking`, latest `recommend_next` has a `recommendation` and no `requested`, skill in the table | A: `Yes, let's go.` B1: no text to next-mentor; the follow-on request below, in a new process |
| — | `ask` | (typed) | Lesson open | The learner's text, unchanged |

`<skill>` is `key-types`, `speed-graph`, `offset`, `anchor` or `null-parenting`. RQ-03 to RQ-10 are held with spec 005.

**Yes's follow-on request on B1** (FR-082), from `recommend_next`'s `recommendation`; `<command>` comes from the panel's skill table by `skill`:

| `kind` | `focus_layers` | Request | Same as |
|---|---|---|---|
| `review` | Any | `<command> review` | RQ-11 |
| `continue` | Any | `<command>` (the lesson resumes with its own targets) | RQ-01 |
| `lesson` | None | `<command>` | RQ-01 |
| `lesson` | Layers | `<command> focus: Door, Pop` | RQ-01 with a parameter (FR-069); untried, T032 tests it |

The learner sees the label, as with every button; layer names reach only the mentor.

## Eval handoffs (eval-engineer writes these; numbers and files are theirs)

| Set | New cases | Count |
|---|---|---|
| **next-mentor (new set and runner)** | **B1:** `/next-mentor` opening with: a skill in progress; a due review; next in path with a focus; nothing left; AE unreachable. Then four Yes-path cases that stop at the recommendation and the follow-on request: to the pivot, to null, to a review, and to a lesson with focus layers. **A only, run at T078:** `Yes, let's go.` handing over for real on those four, plus the five openings | 9 on B1; 9 on A (4 written only for A) |
| Easing | Continue; Try again after a demo that landed (expects Show me again's text); Try again after a demo with no result (expects the check) | 3 |
| Key types, speed graph, offset | The check, Hint, Show me, Show me again (new text), New lesson on a due record (expects `mode` lesson), Continue. Warm up already has its exact turn | 6 each, 18 |
| Pivot, null | As above, plus Warm up (`/<skill>-mentor review`) | 7 each, 14 |

**Total 44 cases.** Null already has one "Show me again" turn; the eval engineer should check whether it uses the new text or
needs replacing. The next-mentor runner uses the skill's own `allowed-tools`, read rather than hand-kept, with no `Skill` on B1 (013 FR-042), and takes
`--runtime a|b1` (`decisions/011`). All 44 run on B1 in this build, and the 4 A-only cases make 48 to write; on A they're counted at FR-099's paid step (plan › Mentor changes and eval cost).

The sync test's table names each case once the eval engineer hands them over (FR-071).
