# Contract: how a skill plugs into the mentor (FR-032)

**For:** specs 008 (speed graph), 009 (key types), 010 (offset), and every later skill spec.
**Built by:** wave A's shared-code owner (tasks.md). After that merge, a skill builder **only adds
files**; `check-branch.mjs` rejects a branch that changes an existing file under `mentor/`,
`bridge/` or `.claude/skills/*-mentor/` unless it's the named owner. If a skill needs something
this contract doesn't give it, it hands back a request; it doesn't edit a shared file.

## 1. The files a skill adds

| File | Required | Holds |
|---|---|---|
| `mentor/tools/<short>.mjs` | yes | `SKILLS`, `TOOLS`, `FINDERS` (below). Found by `mentor/tools/index.mjs` |
| `mentor/lib/<short>.mjs` | usually | The skill's pure analysis and check: `analyze(snapshot, opts)` and its diff. No AE calls |
| `mentor/jsx/<snippet>.jsx` | if it has a demo | The demo write: ES3, one change, one target, run with `undo: true` |
| `mentor/fixture/<snippet>.mjs` | if it has a demo | The snippet's fixture twin (section 5) |
| `mentor/test/<short>*.test.mjs` | yes | Unit tests (FR-012, FR-034), including the overlap rows from its `/overlap-audit` |
| `mentor/test/fixtures/<short>/` | yes | Saved snapshots captured live (`mentor/dev/capture.mjs`), with its answer key |
| `.claude/skills/<short>-mentor/SKILL.md` | yes | The teaching, the six stages (`curriculum.md` › 2), the server rules |

Short names (research R4): `speed-graph` (tools prefix `speed_graph_`), `key-types` (`key_types_`),
`offset` (`offset_`).

## 2. The tool file's exports

```js
export const SKILLS = ["easing.speed_graph"];          // record IDs from mentor/curriculum/path.json

export const FINDERS = {
  "easing.speed_graph": {
    // Does this comp have something to teach this skill on? Pure, no AE call. `exclude` is the
    // past targets ([{layer, property}]) when the question is "a new target for a review".
    focus(snapshot, { exclude = [] } = {}) { return { count: 3, layers: ["Title"] }; },
    review: true,                                       // false until the skill's review mode is built
  },
};

export const TOOLS = [ /* { name, title, description, inputSchema, annotations, handler } */ ];
```

Rules:

- Every tool name starts with the skill's prefix (`speed_graph_snapshot`, `speed_graph_demo`,
  `speed_graph_check`). `index.mjs` refuses to start on a duplicate tool or skill ID.
- `FINDERS[id].focus` must agree with the skill's own `analyze()`: a count above 0 means the
  snapshot tool would find at least one target with the same `exclude`. A unit test per skill
  checks this on its fixtures.
- `review: true` is what lets `recommend_next` offer the skill's review (research R14). Set it when
  the skill's review mode passes its tests.

## 3. The three tools every skill has

A skill's tools follow easing's shape (spec 002 contract) so the six stages work the same way:

| Tool | Does | Must |
|---|---|---|
| `<prefix>_snapshot` | Read the comp and start or continue the lesson | Call `takeSnapshot()` from `mentor/lib/snapshot.mjs`, then `session.start(snapshot, { skill, analyze, focus_layers, mode })`. Accept `mode: "lesson" \| "review"` and `focus_layers`. Return `host` (from `parseHost`), the lesson kind (`new`, `continued`, `resumed`), targets and `demo_target` as the session gives them |
| `<prefix>_demo` | The one demonstration | `session.assertCanDemo(id)` **before** touching AE, then `runSnippet(name, args, { undo: true })`, then `session.recordDemo(id)`. Return what changed and `undo: "Edit > Undo"`. Skill 4 (and maybe 10) has none |
| `<prefix>_check` | Check the learner's attempt | A fresh `takeSnapshot()`, the skill's own diff against `session.currentLesson().baseline`, then `session.markChecked(passed, { demoUndone })` only when the comp matches. Never changes the baseline. Lists other changes with `unexpectedChanges()` where it grades pairs |

Shared tools a skill's SKILL.md also lists in `allowed-tools`: `read_learner_record`,
`preview_frame`, `record_lesson`, `recommend_next` ([shared-tools.md](shared-tools.md)).

## 4. What the shared code gives a skill

| Import | From | Use |
|---|---|---|
| `takeSnapshot()` | `mentor/lib/snapshot.mjs` | One read of the active comp, with `taken_at` and `host` |
| `parseHost(snapshot)`, `atLeast(host, "25.4")` | `mentor/lib/host.mjs` | R0, version traps (FR-030) |
| `start`, `currentLesson`, `assertCanDemo`, `recordDemo`, `markChecked` | `mentor/lib/session.mjs` | The lesson state machine, per skill and comp. Review mode: no demo (`REVIEW_NO_DEMO`), past targets passed as `exclude` |
| `segments`, `segmentState`, `segmentId`, `parseSegmentId`, `needsEase`, `linearEnd` | `mentor/lib/analyze.mjs` | Keyframe pairs and their states, the same as easing's (skills 1, 2) |
| `unexpectedChanges(baseline, current, targetIds)`, `DEMO_INFLUENCE` | `mentor/lib/diff.mjs` | "Other changes" in a check; the easing demo's fingerprint |
| `timing(snapshot)`, `clusters(events, tolSeconds)` | `mentor/lib/timing.mjs` | Cross-layer timing measures (skill 3; spec 005) |
| `runSnippet(name, args, opts)` | `mentor/bridge-client.mjs` | The only way into AE |
| `MentorError(code, message?)` | `mentor/errors.mjs` | Errors. A skill may pass its own learner-facing message with an existing code |
| `registerErrors({ CODE: "message" })` | `mentor/errors.mjs` | A skill's own codes, registered at import of its tool file |
| `json(value)` | `mentor/lib/reply.mjs` | Tool replies |
| `readPath()`, `skillName(id)` | `mentor/lib/path.mjs` | The path data and plain skill names |

### `session.start(snapshot, opts)`

| Option | Default | Meaning |
|---|---|---|
| `skill` | `"easing.basic"` | The record ID |
| `analyze` | easing's `analyze` | `(snapshot, { focus_layers, exclude }) → analyzer result` ([data-model.md](../data-model.md) › Analyzer result) |
| `focus_layers` | none | As easing |
| `mode` | `"lesson"` | `"review"`: no demo, and `exclude` is filled from the record's past targets for this skill on this comp and project |

Returns `{ lesson: "new" | "continued" | "resumed", session, analysis }`, as today. A lesson for
the same skill and comp that isn't passed is continued; a different `mode` starts a new one.
`UNKNOWN_LAYER` is thrown before any write. In review mode, a result with no targets gets
`no_demo_reason: "no_new_target"` and the skill tells the learner there's nothing new to review on
(FR-021) and records nothing.

## 5. Fixture twins (`mentor/fixture/<snippet>.mjs`)

```js
// What the snippet returns in fixture mode, given the current fixture snapshot.
export function run(args, { snapshot, saveEdit }) { /* ... */ }
// Replay a saved edit on a later snapshot of the same comp (so a demo survives between headless turns).
export function apply(snapshot, edit) { /* mutate snapshot */ }
```

`fixture.mjs` loads these by snippet name. `saveEdit(edit)` stores `{ snippet, comp_id, ...edit }`
in `fixture-edits.json`. A twin never writes a fixture file.

## 6. What a skill must not do

- Edit any existing file under `mentor/`, `bridge/`, `.claude/skills/*-mentor/` (including
  `ease-mentor`), or any file under `product/evals/` or `panel/`.
- Read or write `learner.json` or `session.json` directly. Use the session and the shared tools.
- Copy the timing analysis, the pair states or the session logic into its own file (FR-017,
  FR-032).
- Use the `after-effects` tools or any open-ended script (FR-009).
- Add an npm dependency.
