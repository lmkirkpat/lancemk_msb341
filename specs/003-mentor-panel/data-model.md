# Data Model: Mentor Panel in After Effects

Phase 1 for `specs/003-mentor-panel/plan.md`. The panel adds three local files and a few derived
views. It writes nothing the mentor reads, and it only reads the learner record (constitution
1.1.0 › II). Spec 002's entities (Snapshot, Session, Check result, Learner record) are unchanged:
see `specs/002-easing-slice/data-model.md`.

All panel files live in the AEMentor folder (`~/Library/Application Support/AEMentor/`, or
`AE_MENTOR_HOME`), never in the repo.

## Panel config (`panel.json`)

Written by `panel/install.sh`, read by the panel at start (R3).

| Field | Type | Notes |
|---|---|---|
| `version` | 1 | |
| `claude_path` | string | Absolute path to the `claude` executable |
| `node_path` | string | Absolute path to `node` (Claude Code starts the mentor with it, R3) |
| `repo_path` | string | Absolute path to this repo (skill, `.mcp.json`) |

Validation: all three paths exist; `claude_path` and `node_path` are executable; `repo_path`
contains `.mcp.json`. Otherwise the panel shows the fix and
starts nothing (FR-015).

## Panel session (`panel-session.json`)

The display log that lets a lesson continue after the panel is reopened (R6, FR-016). One at a
time. A new lesson replaces it.

| Field | Type | Notes |
|---|---|---|
| `version` | 1 | |
| `claude_session_id` | uuid | Passed as `--session-id`, then `--resume` |
| `bridge_started` | ISO time or null | From the bridge status endpoint. "Same AE session" test |
| `started_at`, `updated_at` | ISO time | |
| `ended` | boolean | True once the lesson is recorded or the learner stops |
| `lesson` | LessonView | Derived state, below |
| `messages` | DisplayMessage[] | What the panel has shown, in order |

**DisplayMessage**: `{ role: "learner" | "mentor" | "notice", text, frames: string[] }`
- `learner` messages show the button label or the typed question, not the fixed request text.
- `frames` are file paths in the frames temp folder (R6), shown in order under the message.
- `notice` is a panel message such as "The mentor can't see After Effects right now".

**State transitions:**

```text
(none) ──start──▶ open ──record_lesson ok / learner stops──▶ ended
          ▲          │
          │      panel closed
          │          ▼
          └── reopened, same AE session, not ended ──▶ "Continue lesson?" ──yes──▶ open (resumed)
                                                                         └─no──▶ (none)
```

## LessonView (derived, stored inside the panel session)

Built only from tool results in the stream (R5). Never from the mentor's wording.

| Field | Type | Derived from |
|---|---|---|
| `demo_made` | boolean | a successful `set_ease` result in this lesson |
| `checks` | number | successful `diff_since_last` results with `comp_matches: true` |
| `passed` | boolean | the latest such result's `passed` |
| `stage` | `"i_do" \| "we_do" \| "you_do" \| "done"` | see Lesson stage |
| `check_list` | CheckList or null | the latest successful `diff_since_last` result |
| `recorded` | boolean | a successful `record_lesson` result |

### Lesson stage (FR-009)

| Condition, checked in order | Stage shown | Indicator |
|---|---|---|
| `passed` | `done` | ✓ ✓ ✓ |
| `checks > 0` | `you_do` | ✓ ✓ ● |
| `demo_made` | `we_do` | ✓ ● ○ |
| otherwise | `i_do` | ● ○ ○ |

A lesson where the learner skips the demo and checks straight away goes from `i_do` to `you_do`.
"I do" then shows as skipped (–), not done.

### CheckList (FR-007)

A display copy of spec 002's Check result.

| Field | From | Shown as |
|---|---|---|
| `rows[]` | `targets[]` | one row each: `label`, then the state |
| `rows[].state` | `result` | `eased_by_learner` → "you ✓", `eased_by_demo` → "demo (mentor)", `still_linear` → "linear ✗" |
| `outside[]` | `unexpected_changes[]` | listed under "Outside this lesson", not as errors |
| `summary` | `summary` | "N of M yours eased · K still linear" |

Rules:
- A result with `comp_matches: false`, or an error result (`AE_UNREACHABLE`, `AE_BUSY`), never
  replaces the list. The panel shows a notice instead, and the old list is greyed with "from your
  last check" (FR-015, edge cases).
- Unknown `result` values show as the raw value in plain words ("not checked"), never as a pass.

## Path view (FR-010)

A fixed list (spec › Assumptions), combined with the learner record and the current lesson.

| Step | Skill id | Teachable | State rule |
|---|---|---|---|
| Keyframes | none | no | always "done (assumed)", since the easing lesson needs keyframes |
| Easing | `easing.basic` | yes | done if the record says `learned` or this lesson `passed`; otherwise current |
| Graph Editor | none | no | next after Easing is done; otherwise upcoming |
| Bounce | none | no | upcoming |

## Memory view (FR-011)

Read from `learner.json` (spec 002 format, `version: 1`).

| Shown | From |
|---|---|
| Last lesson date | `lessons[-1].date`, as "Oct 3" |
| Skill | `lessons[-1].skill`, in plain words ("Easing") |
| Result | `lessons[-1].result`: `passed` → "passed ✓", `partial` → "not finished", `not_checked` → "not checked" |
| Next | `skills[lessons[-1].skill].next`, else `lessons[-1].next` |

- No file, an empty `lessons`, or an unreadable file: "No lessons yet." (edge case).
- An unknown `version`: "Memory format not recognised", with nothing else shown.
- Re-read after a successful `record_lesson` result (US3-3).
- Field names never appear (FR-017).

## Turn log (`panel-turns.jsonl`)

One line per turn, appended (R9). For SC-004 and cost.

| Field | Type | Notes |
|---|---|---|
| `at` | ISO time | When the request was sent |
| `kind` | `"start" \| "check" \| "hint" \| "show_me" \| "show_me_again" \| "ask" \| "continue"` | |
| `wait_ms` | number or null | Click to first text delta (first words). Context only. Null if none came |
| `first_event_ms` | number or null | Click to the first text delta or tool call, whichever comes first. **The SC-004 measure** (option A, research R1) |
| `lesson_passed` | boolean | True when this turn's check passed (an ok `diff_since_last` with `passed: true`). Used for lesson duration (SC-005) |
| `total_ms` | number | Click to the end of the turn |
| `cost_usd` | number or null | From the `result` event |
| `ok` | boolean | False on error, timeout or process exit |

No message text is logged here.
