# Research: After Effects curriculum (spec 004), sprint 3 baseline

**Date:** 2026-10-20. **Input:** [spec.md](spec.md) (approved 2026-10-20), [curriculum.md](curriculum.md),
the code in `mentor/` at `85c3a07`, `panel/lib/{memory,path,runtime}.js`,
`product/evals/easing/run.mjs`, `.claude/hooks/{ownership.json,check-branch.mjs}`.

Each entry: **Decision**, **Rationale**, **Alternatives considered**. R1 to R9 are the shared
interfaces wave A builds so skills 2, 1 and 3 can then be built in parallel by adding files only
(FR-032). R10 to R14 settle questions the spec left to the plan.

---

## What the code does today (the starting point)

- `mentor/tools/index.mjs` imports every `mentor/tools/*.mjs` except `index.mjs` and `common.mjs`,
  and collects `TOOLS` and `SKILLS`. Adding a skill file needs no edit elsewhere. **Kept.**
- `mentor/tools/easing.mjs` owns `snapshot_project`, `set_ease`, `diff_since_last`, and its own
  `takeSnapshot()` and `parseSegmentId()`.
- `mentor/lib/session.mjs` is **easing-only**: `start()` calls easing's `analyze()`, lessons are
  keyed by comp id alone, and nothing records which skill a lesson belongs to. A second skill on
  the same comp would overwrite easing's lesson, and `record_lesson`'s session check
  (`assertMatchesLesson`) can't tell whose lesson it's checking.
- `mentor/fixture.mjs` has a fixed `SNIPPETS` map (`snapshot`, `set-ease`, `preview-frame`) and
  replays only ease edits. A skill with a new demo snippet couldn't run in fixture mode (so no
  evals) without editing it.
- `mentor/errors.mjs` has a fixed code list; `bridge-client.mjs` builds its error regex from it at
  import. `DEMO_USED` and `NOT_DEMO_TARGET` say "pair".
- `mentor/server.mjs`'s instructions say the server "teaches easing" and name `set_ease` as the one
  demonstration.
- `mentor/lib/learner-store.mjs` writes `version: 1` with `status`, `last_practiced`,
  `times_passed`, `next` per skill, and lesson entries with no kind or targets.
- `snapshot.jsx` reads keyed properties only, skips layers with no keys, and reads no version.
- **Outside `mentor/`:** `panel/lib/memory.js` shows "Memory format not recognised." for any record
  whose `version` isn't 1. `panel/lib/runtime.js` links only `ease-mentor` into the runtime folder
  that the panel **and the eval runner** use. `product/evals/easing/run.mjs` lists the six mentor
  tools by name.

---

## R1. Skills plug in as new files: the skill module contract

- **Decision:** a skill is one tool file `mentor/tools/<short>.mjs` exporting `SKILLS`, `TOOLS`
  and a new `FINDERS` map (skill ID → `{ focus(snapshot, opts), review }`), plus any number of new
  files of its own (`mentor/lib/<short>.mjs`, `mentor/jsx/<snippet>.jsx`,
  `mentor/fixture/<snippet>.mjs`, `mentor/test/<short>*.test.mjs`, fixtures under
  `mentor/test/fixtures/<short>/`, and `.claude/skills/<short>-mentor/SKILL.md`). Tool names start
  with the skill's short name (`speed_graph_check`). `index.mjs` collects `FINDERS` and passes them
  to the shared tools. Full contract: [contracts/skill-module.md](contracts/skill-module.md).
- **Rationale:** `check-branch.mjs` lets parallel builders add files under `mentor/`, never change
  existing ones. Everything a skill needs from shared code has to exist before they start, and
  everything a shared tool needs from a skill (does the comp have a focus for it? does it support
  reviews?) has to come through an export the index finds.
- **Alternatives:** a registry file listing skills (a merge hot spot, `.claude/README.md` ›
  Lessons); each skill re-implementing session and record logic (FR-032 forbids copies).

## R2. One session store for every skill

- **Decision:** `session.start(snapshot, opts)` takes `skill` (default `easing.basic`), `analyze`
  (default easing's), `focus_layers`, `mode` (`lesson` or `review`, default `lesson`) and
  `exclude` (past targets, filled in by the session from the record in review mode). Lessons are
  keyed `<skill>|<comp id>`; an existing key with no `|` is read as easing's (old `session.json`
  files keep working). Each lesson stores `skill`, `mode`, `targets`, `target_refs`
  (`{layer, property}` by name, for the record), `demo_target`, `demo`, `checked`, `passed`.
  `assertCanDemo(id)`, `recordDemo(id)` and `markChecked(passed, {demoUndone})` stay as they are,
  generic over target IDs. In review mode `demo_target` is always null and `assertCanDemo` throws
  `REVIEW_NO_DEMO` (FR-021 in code).
- **Rationale:** easing's tool file keeps calling `session.start(snapshot, { focus_layers })`
  unchanged, so `tools/easing.mjs` and the 15 session tests keep passing; new skills pass their own
  analyzer. Keying by skill and comp means a speed-graph lesson on Mentor Practice doesn't overwrite
  an unfinished easing lesson there.
- **Alternatives:** one session file per skill (more files, the same logic copied); keep comp-only
  keys (two skills on one comp collide).

## R3. The learner record stays `version: 1`, with additive fields

- **Decision:** don't bump the version. Add per skill `review_due` (a local calendar date,
  `YYYY-MM-DD`) and `reviews_passed_in_row`; add per lesson `kind` (`first`, `practice`,
  `review`), `already_knew` (true only on a review of a skill that wasn't learned) and `targets`
  (`[{layer, property}]`). Older records without these fields read as they are; `review_due` is
  worked out when it's missing (R5). `record_lesson`'s **input doesn't change**: `kind`, `targets`
  and `already_knew` come from the session's current lesson, never from the model.
- **Rationale:** FR-023 (old records read with no migration). And `panel/lib/memory.js` (the
  panel-builder's) rejects any `version` other than 1, so a bump would blank the panel's memory
  strip. Taking `kind` and `targets` from the session means the model can't record a review that
  wasn't run as one, and the easing skill's `record_lesson` calls and evals don't change.
- **Alternatives:** `version: 2` with a migration (breaks the panel until panel-builder changes
  it); the model passing `kind` (a field it can get wrong, checked only by evals).
- **Room for spec 005:** diagnosis records (spec 005 FR-017) go in a separate top-level
  `diagnoses` array, added by spec 005's plan. Nothing here uses that name.

## R4. Record IDs for all ten skills, fixed now

- **Decision:** the path data uses `curriculum.md` › 6's suggested IDs: `keyframes.types` (1),
  `easing.speed_graph` (2), `timing.offset` (3), `motion.sources` (4), `transform.anchor` (5),
  `parenting.null` (6), `shape.trim_paths` (7), `matte.track` (8), `text.animator` (9),
  `precomp.basic` (10), with `easing.basic` (built) before them. Short names for files and tool
  prefixes: `key-types`/`key_types`, `speed-graph`/`speed_graph`, `offset`/`offset`, and for later
  skills `sources`, `anchor`, `null`, `trim`, `matte`, `text-animator`, `precomp`.
- **Rationale:** FR-003 lets the skill builder name the IDs; the shared-code owner is a skill
  builder, and fixing all ten now means the path data and its test never change when a skill lands
  (an existing-file change a parallel builder couldn't make). Specs 008 to 010 must use these.
- **Alternatives:** each skill names its own ID on arrival (the path data would need editing each
  time, by the owner).

## R5. Review schedule in local calendar days

- **Decision:** a pure `mentor/lib/reviews.mjs`:
  - First pass of a skill (any kind): `review_due` = that day + 1, `reviews_passed_in_row` = 0.
  - A passed review: `reviews_passed_in_row` + 1, `review_due` = that day + 3, 7, 14, 30 for runs of
    1, 2, 3, 4 or more.
  - A review that isn't a pass (`partial`): run back to 0, `review_due` = that day + 1.
  - A review recorded `not_checked` (stopped before any check): schedule unchanged.
  - A practice or first lesson on an already-learned skill: schedule unchanged.
  - Missing `review_due` on a learned skill (old record): that day + 1 from `last_practiced`.
  - **Due** means today's local date is on or after `review_due`.
- **Rationale:** FR-019 as written. Calendar days, not 24-hour periods, so a skill learned at 11 pm
  is due the next morning, as a learner would expect from "a day later". The two "unchanged" rules
  aren't stated in FR-019; they follow from it (only reviews move the schedule, and a review with no
  check has no result). Open question P1 asks the builder to confirm.
- **Alternatives:** timestamps plus 24 h (reviews due at odd hours); letting practice lessons push
  the review out (a practice with a demo would count as spaced practice, which it isn't).

## R6. Path data in one JSON file, checked against `curriculum.md`

- **Decision:** `mentor/curriculum/path.json` holds the on-ramp (keyframes), easing and the ten
  skills in path order, each with its ID, plain name, hard and soft prerequisites (skill IDs, or a
  `needs_in_comp` note such as skill 8's "a shape or text layer"), and the finding map DX-01 to
  DX-09 → skill ID or `null`. `mentor/test/path.test.mjs` parses the tables in `curriculum.md` › 4
  and › 10 and compares them field by field (FR-002). "Built" is computed, never stored: a skill is
  built when a tool file declares its ID (FR-003).
- **Rationale:** FR-001 wants one place; a test that reads the designer's file itself means a design
  change that isn't mirrored fails the build, which is the only way the two can't drift. JSON so the
  panel (CommonJS) and spec 005 can read it without importing ES modules.
- **Alternatives:** a JS module (the panel would need a dynamic import); a hand-copied answer key in
  the test (could drift with the data it checks).

## R7. Recommendation is a pure function plus one tool

- **Decision:** `mentor/lib/recommend.mjs` exports `recommend({ path, record, built, finders,
  snapshot, now, offers })`, deterministic, implementing FR-004 to FR-007 and FR-020's limits. The
  shared tool `recommend_next` (in `tools/common.mjs`) reads the record, tries one snapshot
  (record-only if AE is unreachable, and says so), calls it, and returns one recommendation and,
  if `requested_skill` was passed, that skill's built state and missing hard prerequisites. Offers
  of unprompted reviews are remembered in `session.json` (`review_offers`). Output fields:
  [contracts/shared-tools.md](contracts/shared-tools.md).
- **Rationale:** FR-036 wants it unit tested on saved records; a tool means the rule is in code, not
  in five prompts. The "one review per session" limit needs a memory across headless turns, and
  `session.json` is the store that already survives them.
- **Alternatives:** the rule in each SKILL.md (untestable, copied five times).

## R8. "This session" for the one-review limit is a 3-hour window

- **Decision:** an unprompted review offer counts against the limit for 3 hours after it's made,
  and "none after a practice lesson on the same skill in that session" looks at practice lessons in
  the record from the last 3 hours. The constant is `SESSION_WINDOW_HOURS` in `recommend.mjs`.
- **Rationale:** the mentor can't see conversation boundaries. In the panel and the evals each turn
  is a new server process (`decisions/005`), so process lifetime doesn't work either. A window is
  testable and errs toward fewer offers. Open question P2.
- **Alternatives:** the model passing "a review was already offered" (it can forget); process
  lifetime (resets every panel turn).

## R9. Fixture mode gets snippet plugins

- **Decision:** `fixture.mjs` keeps `snapshot`, `set-ease` and `preview-frame` built in and also
  loads `mentor/fixture/<snippet>.mjs` files, each exporting `run(args, ctx)` (what the snippet
  returns) and `apply(snapshot, edit)` (replays a saved edit on later snapshots). Saved edits gain a
  `snippet` field; old edits without one are ease edits.
- **Rationale:** each skill's demo snippet needs a fixture twin for its evals and unit tests, added
  as a new file (constitution VI keeps evals running without AE).
- **Alternatives:** each skill editing `fixture.mjs` (a shared-file change in parallel).

## R10. R0 (version and OS) rides in the snapshot

- **Decision:** `snapshot.jsx` adds `host: { ae_version: app.version, os: $.os }`.
  `mentor/lib/host.mjs` turns it into `{ known, version: "26.5", os: "macOS 27.0.1", platform:
  "mac" | "win", beta: null }` and `atLeast(host, "25.4")`, and drops anything else. Snapshots
  without `host` (every fixture today) give `{ known: false }`. Easing's `snapshot_project` output
  **doesn't** add it this wave, so the easing evals see exactly what they saw. New skills pass
  `host` through in their own snapshot tools (FR-030). `mentor/dev/capture.mjs --compare` ignores
  `host`.
- **Rationale:** FR-009 allows R0 "as part of `snapshot_project`"; one more line in the read costs
  nothing and every skill gets it on every read (the edge case "different AE version from last
  session"). `$.os` is a product string ("Macintosh OS 27.0.1/64"), no user or machine name (FR-011,
  unit test on the normalizer). Whether `app.version` tells a beta build apart (FR-030, skill 5) is
  left to the live check in quickstart › 2; `beta` stays `null` until it's known.
- **Alternatives:** a separate `read_host` tool (one more call per lesson, one more thing to
  forget).

## R11. The timing analysis: measures in seconds and frames, no thresholds

- **Decision:** `mentor/lib/timing.mjs` exports `timing(snapshot)` and `clusters(events,
  toleranceSeconds)`. Per layer and per move unit it gives first and last key, each move's start,
  end and duration, and its starts and landings; across layers, the starts and landings that fall
  on the same frame; and the comp's last motion end. Rules from the spec's Edge Cases timing rows:
  a single key is a set value; a pair with a hold out side is an instant change (a start with
  duration 0); a pair with equal values is a pause, not a move; X, Y (and Z) Position separated are
  one unit; effect keys count; a property with an expression on is listed with `excluded:
  "expression"` and its keys don't count; precomp layers are marked `precomp: true` (their inner
  time isn't read until R1 and R4). `clusters()` groups events within a tolerance the caller gives,
  so skill 3 passes FR-027's floor and spec 005 its own. Shape: [data-model.md](data-model.md) ›
  Timing measures.
- **Rationale:** FR-016 and FR-017. Pure and deterministic, so SC-006's answer keys apply.
- **Alternatives:** returning lockstep verdicts (FR-017 forbids); skill 3 owning it (spec 005 would
  copy it).

## R12. What the easing analysis shares, and how

- **Decision:** exported from `mentor/lib/analyze.mjs`: `segments`, `segmentState`, `segmentId`,
  `needsEase`, `linearEnd` (already exported), plus `parseSegmentId` (moved from
  `tools/easing.mjs`). From `mentor/lib/diff.mjs`: `unexpectedChanges(baseline, current,
  targetIds)` and `DEMO_INFLUENCE` (exported). Shared snapshot taking moves to
  `mentor/lib/snapshot.mjs` (`takeSnapshot()`). No behavior changes: the easing tests and the
  saved Mentor Practice findings are compared before and after (SC-004).
- **Rationale:** skills 1 and 2 grade keyframe pairs (types, influence) and need the same pairs,
  states and IDs easing uses, so their checks agree with easing on what a pair is. Skill 3 uses
  timing (R11). `curriculum.md` › 12 B6.
- **Alternatives:** each skill re-deriving pairs (the T023 lesson: two filters disagree).

## R13. The second practice comp: same `.aep`, its own script, wave A targets plus empty slots

- **Decision:** `mentor/dev/build-practice-comp-2.jsx` builds **"Mentor Practice 2"** in
  `discovery/Claude AE Tutor Test.aep` and writes its own answer key
  (`mentor/test/fixtures/practice2-expected.json`), declared next to each property as it's built,
  as the first script does. Wave A targets: skill 1's fade that should be a cut (an opacity blink,
  eased) and a constant spin left linear (the "is there a move that should run at constant speed"
  check); new eased pairs at Easy Ease defaults for skill 2's review; a second on/off change for
  skill 1's review; three layers whose first keys share a time plus one layer whose Scale and
  Opacity start and land together, for skill 3 and its review; and two timing overlaps Mentor
  Practice lacks (a hold pair that starts a move, and two neighbouring keys with equal values). The
  comp is 30 fps like Mentor Practice; FR-027's 60 fps case is a unit test on a 60 fps capture of a
  duplicate of this comp (quickstart › 3). Wave D's layers (stroke-only shape, fill-and-matte pair, precomposable group) are
  **not** built now. Mentor Practice, its script and the easing fixtures don't change (FR-031).
- **Rationale:** a second comp in the same file is one thing to open for live runs; its own script
  and answer key keep Mentor Practice's 25/25 baseline untouched. Wave D layers come with the reads
  that can check them, so their answer key is written once.
- **Alternatives:** a separate `.aep` (splits the test assets, as spec 002 research R8 found);
  building wave D's layers now (an answer key nobody can check yet, and the script would change
  again anyway).
- **Owner of the `.aep`:** nobody in `ownership.json` (the cockpit). The builder runs the script
  live and saves the file (quickstart › 3).

## R14. What lives outside `mentor/` and who changes it

- **The panel and eval runtime link only `ease-mentor`** (`panel/lib/runtime.js`, panel-builder).
  Until it links every `.claude/skills/*-mentor` folder, new skills can't run in the evals or the
  panel. This is a **request to the panel-builder**, needed before any wave A eval run of a new
  skill (Open question P3). It's a few lines; it doesn't change what the panel shows.
- **The eval runner's tool list** (`product/evals/easing/run.mjs`, eval-engineer): new eval sets
  need their own list or a wider one. The eval engineer's call.
- **The panel's path** stays a fixed list (spec 003); the UI overhaul (spec 007) reads
  `mentor/curriculum/path.json` and the record.
- **`ease-mentor/SKILL.md`** isn't changed in wave A (KD-001's fix in wave B changes it). Its
  record calls work unchanged (R3). Easing reviews aren't offered this sprint: its tool file
  doesn't declare `review: true` (R1), and recommendations only offer reviews for skills that do.

## Dependencies

No new npm dependency. Node built-ins only (`node:fs`, `node:path`, `node:test`). The
`curriculum.md` table parser in `path.test.mjs` is a few lines of string splitting.
