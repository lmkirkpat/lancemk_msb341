# Contract: what the panel reads and draws for Ask (spec 014)

The panel draws from the record, the path data and tool results (not `comp_active`: FR-047 was withdrawn
2026-11-16, research R10; constitution 1.6.0). It never parses the
mentor's prose (FR-016) and holds no teaching logic (constitution II). States are MU's ids
([`product/mockups/ask-mentor/README.md`](../../../product/mockups/ask-mentor/README.md) › States); copy is
MU › Copy, plus the lines below.

## Inputs

| Input | From | Used for |
|---|---|---|
| `give_answer` tool result | `tool_result` event, `json` | AskView (data-model § 7); `ask-answer`, `ask-clarify`, `ask-outside`, `ask-new-question`, `ask-nocomp` by `kind` |
| `go_deeper` tool result | `tool_result` | `ask-deeper-starting` → the lesson |
| A snapshot tool result with `mode_source: "hand_in"` | `tool_result` | `ask-deeper-lesson`: "From your question. Back returns you to it.", Pick ticked, Practice tag when `hand_in.practice` |
| The check tool's `passed` | `tool_result` (today's checklist) | `ask-deeper-passed`'s result line (below) |
| `record_lesson`'s `hand_back` | `tool_result` | `ask-back`: the thread's hand-back line, drawn from data |
| ~~`comp_active`~~ | ~~`GET /health`~~ | Withdrawn 2026-11-16 (FR-047): nothing read; Ask is always on, and no comp is `ask-nocomp` from the answer's `kind` |
| `panel.json` runtime | config | Display guard: no Go deeper on `b1` |

## Drawing an answer (FR-048, FR-049)

1. A valid AskView: explanation (bullets as bullets), then, only with steps, the **Steps** heading and the
   numbered list with each step's tag (short name, bold italic), or no tag for a not-taught step (its text
   already ends "Not something I teach yet.", contracts/ask-tools.md step 3a) or a look step, then the closing
   offer, then one gray **Go deeper: [tag] ›** per offer inside the same message. The turn's prose, if
   any, isn't drawn (research R2).
2. AskView `null`: the mentor's words as they came; no Steps, no dock, no Go deeper.
3. **Your steps** docks under the chat, folded, only with steps; header "From the answer. Knack doesn't
   track these."; no glyphs or ticks, ever; it holds only the latest answer's steps, and goes away when the
   latest answer has none; opens itself once on returning from a lesson.
4. Go deeper appears only inside its answer; while its lesson is open it's **Back to your lesson ›**; after
   the lesson it's gone (FR-050).
5. *Added 2026-11-16 (spec amendment (d), the builder's decision):* starting any other lesson (Find my next
   lesson, Pick up, or a Skills lesson) ends the thread's conversation but keeps its last question, answer and
   steps saved and visible; "Back to your question ›" still works after the lesson. Nothing is deleted
   (FR-052's note, research R12).

## Requests (added to `REQUESTS`, eval-synced)

| Press | Request | Turn kind |
|---|---|---|
| Ask (Home or thread box) | `/ask-mentor ` + the text as typed | `question` |
| Follow-up bar | the text as typed; the first one after a go-deeper lesson gets `/ask-mentor ` in front | `followup` |
| Follow-up bar or Try again, first send after any other lesson (amendment (e)) | `/ask-mentor ` + the context wrapper below + the text as typed | `followup` |
| Go deeper | "Yes, go deeper on [short name]." | `go_deeper` |
| End lesson (go-deeper lesson) | "/ask-mentor I've ended that lesson." | `followup` |

*Added 2026-11-16 (spec amendment (d)), a new question in the follow-up bar:* when a follow-up turn returns
a `give_answer` result of kind `answer`, `describe` or `howto`, the panel treats it as a new question: it
folds the earlier entries, logs the turn as `question`, and Go deeper acts on the newest answer. Decided from
the tool's data, never the prose (FR-031's note, FR-016). Any other kind stays a `followup`.

All carry `thread: "ask"` in the turn log. The learner's bubble shows the text as typed (or MU's "Yes, go
deeper on Set the pivot."), never the `/ask-mentor ` prefix; End lesson shows only the divider.

### Context after a lesson (added 2026-11-16, spec amendment (e), the builder's decision)

After a lesson ends the thread's conversation (item 5 above), the next send into the thread starts a fresh
mentor conversation. So that first follow-up or Try again carries the thread's last question and its answer,
and the mentor sees what the learner sees on screen. Exact request, one item per line:

```
/ask-mentor Earlier question and answer, as shown in the panel:
Question: [the entry's text as typed]
Answer: [explanation]
Steps:
[n]. [step text] (layer: [layer])
Closing: [closing offer]
Follow-up: [the text as typed]
```

- **Source:** the panel's saved thread only: the latest entry with a valid AskView (its `text`, and the
  view's `explanation`, `steps[].text`, `steps[].layer` and `closing_offer`). Data the mentor produced and the
  panel already validated; nothing parsed from prose (FR-016), no teaching logic (constitution II).
- **Bounded:** that one question and answer only, no earlier entries, no tags, offers or kind.
- **Omitted parts:** no `Steps:` block when there are none; no ` (layer: …)` when a step's layer is `null`; no
  `Closing:` line when it's `null`. If the latest entry's AskView is `null` (FR-048's fallback), there's no
  validated answer: the send is the prefix and the text only.
- **Once:** only the first send after the lesson; later sends are the plain follow-up. Try again resends the
  same request it retries.
- **Never shown:** the bubble shows the text as typed; the wrapper is in the request only. The wrapper's first
  line is a constant in `REQUESTS`, eval-synced (T104).
- **What the mentor does with it:** treats the learner's text as a follow-up to that question and answer, and
  reads the comp again before answering, since the lesson may have changed it. The context is what was on
  screen, not the comp's state (`ask-mentor/SKILL.md`, T103). *Clarified 2026-11-16 (f):* reading again
  means `describe_layers`; it does not mean `give_answer`. A follow-up gets prose (FR-028: one or two sentences,
  then the pending step). Only a send that is really a new question gets `give_answer`, with kind `answer`,
  `describe` or `howto`, and the panel treats it as new (amendment (d), above).

## Result lines and dividers (FR-051, PQ-3)

Drawn on a passing check in a go-deeper lesson, by skill. Plain, no pass or fail words; the ui-designer
may revise before T056.

| Skill | Result line (`ask-deeper-passed`) |
|---|---|
| Easing | "Pairs eased, nothing else changed." |
| Key types | "Keys set the way you wanted." |
| Speed graph | "Ease shaped, still comes to rest." |
| Offset | "Staggered, and each one still lands." |
| Set the pivot | "Pivot moved, nothing else did." (MU) |
| Group with a null | "The group moves as one. Nothing jumped." |

Divider on return (`ask-back`): "[short name] · practiced on [layer]" for any lesson whose record was saved
(first lesson or practice); "[short name] · ended, not saved" otherwise (`ask-ended`). Hand-back line in the
thread: "That was step [n]; next is step [n+1]: [next_step]." or "That was the last step."

## Home (FR-055's amendments)

Ask card first ("Ask about the open comp", "What do you want to know or change?", "Reads your comp. Changes
nothing."), then one quiet line in MU's order: a lesson open → "Back to your lesson"; a lesson in progress →
"Pick up [skill] on [layer]" with Set it aside; *(added 2026-11-16, amendment (e))* its comp name comes from the snapshot
result the panel saved with the lesson (every lesson snapshot returns the comp), not the learner record, and
it shows no last-check time (MU's two lines; spec 007's card line is superseded); else "Find my next lesson". No due review, Practice due or
memory on Home; they're in Skills (`skills-due`). Empty record: "Welcome to Knack." with the same Home
(`home-first`). Ask is always on; no comp shows after a press as `ask-nocomp` ("No comp open. Open one, or
click into its timeline."). `home-nocomp` is withdrawn with FR-047 (2026-11-16; tasks T101 removes it).

## Tests (panel-builder)

- One test per new and changed MU state id, driven from fixture events (SC-011).
- Fail closed: every malformed `give_answer` result (missing, not JSON, unknown `kind`, 5 steps, 3 offers,
  an offer no step uses, wrong types) draws no Steps, dock or Go deeper.
- A `b1` panel draws no Go deeper for any result.
- No panel string contains an underscore field name, a tool name or a slash command (FR-053); no bubble
  shows the `/ask-mentor ` prefix.
