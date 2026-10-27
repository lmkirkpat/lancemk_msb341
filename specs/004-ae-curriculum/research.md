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
- **`ease-mentor/SKILL.md`** gets one change in wave A: step 2 names a kept-linear property among
  what it leaves out (R15). KD-001's fix in wave B changes it again. Its record calls work unchanged
  (R3). Easing reviews aren't offered this sprint: its tool file
  doesn't declare `review: true` (R1), and recommendations only offer reviews for skills that do.

## R15. Linear on purpose: a mark that lapses when the keys change (FR-038)

- **Decision:** a top-level `marks` array in the record (still `version: 1`), each mark tied to a
  project, comp, layer, property path and the key times the check confirmed. Only a check writes
  one, through `session.keepLinear()` and `record_lesson`. It applies only while those keys are
  unchanged and all linear; any change to them lapses it for good, and the next record write
  removes it. Easing skips a marked property (`skipped`, reason `kept_linear`) and names it once
  among what it leaves out; `ease-mentor/SKILL.md` gets that one line. Naming it as the focus
  doesn't lift it.
- **Rationale:** the builder's call (2026-10-20, from `specs/009-key-types/teaching-design.md` S-2,
  `discovery/usage-notes/mentor-practice-state-2026-10-20.md`): a learner who says "constant
  speed" shouldn't be pushed to ease it every lesson. Tying the mark to the key times makes taking it
  back automatic and visible on the timeline (ease it, and it's a normal pair again), with no extra
  tool. Writing it only from a check keeps the record to what the checks showed (FR-022).
- **Alternatives:** a "forget this" tool (one more write tool and one more rule to evaluate); a mark
  that lasts until removed by hand (a learner who eases it later would see it skipped, then
  un-eased by undo, inconsistently); storing it in lesson summaries only (free text easing can't
  read reliably).

## Wave B (added 2026-10-23, for [tasks-wave-b.md](tasks-wave-b.md))

Research IDs continue at R16. Note the two numberings: "research R16" is an entry here; "read R1"
and "read R3" are `curriculum.md` › 5's shared reads. Every entry below is about reads R1 and R3,
the visibility class (FR-013) and the motion-sources map's first step (FR-014). Inputs: the code at
`057b6da`, `specs/011-anchor/teaching-design.md` › 10 and › 14 (B-2, B-3), and
`specs/012-null-parenting/teaching-design.md` › 6, › 9 and › 13 (B-3, B-5, B-6).

## R16. Reads R1 and R3 go in a separate `layer_info` array, one entry per layer

- **Decision:** `snapshot.jsx` keeps `layers` (keyed layers only, spec 002's fields), `precomp_layers`
  and `host` exactly as they are, and adds a top-level `layer_info` array with **one entry for every
  layer in the active comp**, keyed or not, in index order. It also adds two fields to `comp`:
  `time` (the current time, rounded like key times) and `hide_shy` (the comp's shy filter). R1's
  switches and relations and R3's values live in each entry (data-model › Wave B). Consumers read it
  through `mentor/lib/layer-info.mjs`, which returns `{ known: false }` for a snapshot without it
  (every fixture and eval fixture before wave B), so each consumer falls back to today's behaviour.
- **Rationale:** easing's `hidden_layers`, `analyze()`, `diff()` and every skill's stand-in fixture
  read `layers`. Adding unkeyed layers there would change what easing sees (SC-004) and break the
  fixtures built from it. A separate array means old snapshots stay valid and the only code that
  changes behaviour is code that reads `layer_info` on purpose. `comp.time` is needed by skill 5
  (011 › 10: "the check can't tell the playhead moved") and by every sampled read (R17).
- **Alternatives:** unkeyed layers in `layers` with an empty `properties` (changes easing's input;
  every consumer has to learn to skip them); a second snippet `read_layers` (two reads per check that
  can disagree if the learner changes something between them, and one more call for each skill to
  forget).

## R17. Read R3 is sampled: transforms and rectangles at a list of times, comp-space math in Node

- **Decision:** one read serves skills 5 and 6 (and later skill 8). Each `layer_info` entry has
  `transform` (anchor, position, scale, rotation, opacity at `comp.time`) and `samples`: at each
  sample time, the layer's **rendered** anchor, position, scale and rotation (`valueAtTime(t, false)`,
  so after expressions), and its own rectangle (`sourceRectAtTime(t, false)`; for shape and text
  layers also with extents, since which one matches what the learner sees is spec 011's L-1). The
  sample times for a layer are the union of:
  1. `comp.time`;
  2. every key time on any of the layer's own keyed properties (so skill 5's rest key and Position
     key times, and skill 6's child key times, are always there);
  3. the sample times of each of its children, recursively (so a parent is sampled wherever a child
     needs composing through it);
  4. the caller's `sample_times` (`takeSnapshot({ sample_times })`, passed to the snippet as args),
     for a time the skill stored earlier: skill 6's before-read time (012 § 6, S-2).
  Deduplicated, sorted, rounded to the millisecond, capped at 64 per layer (`samples_truncated:
  true` past that). The **2D comp-space math** is pure code in `mentor/lib/comp-space.mjs`: a layer's
  matrix is translate(position) · rotate(rotation) · scale(scale / 100) · translate(−anchor), composed
  up the parent chain; a point in the layer's own space maps to the comp through it. It gives a
  layer's comp-space position, its **footprint** (the four corners of its own rectangle in the comp)
  and their axis-aligned bounds, at any sampled time, and the inverse (comp to layer space, for
  fixture twins such as skill 6's parenting demo). It also takes a **stored parent transform** in
  place of the parent's sampled one, which is how skill 6 measures "through the null as stored at
  parenting" (012 § 6, S-3) without a read of its own. It returns `null` with a reason, never a
  guess, when a needed sample is missing (`not_sampled`), a layer in the chain is 3D (`three_d`),
  auto-orients (`auto_orient`), or the snapshot has no `layer_info` (`no_layer_info`).
- **Rationale:** skill 6's P2 needs footprints at each child's key times and at a stored time, for
  the child and its parent (012 › 6, B-3); skill 5's checks need the layer's own rectangle and
  footprint at the current time, the rest key and each Position key time (011 › 10, B-2). AE gives
  each of those values directly through `valueAtTime` and `sourceRectAtTime`, read only; doing the
  matrix math in Node keeps it unit tested on saved snapshots (FR-012) and identical for every skill
  (FR-032). Rule 3 means a parent never lacks a sample its child needs. Rule 4 covers the one time
  the skill knows and the comp doesn't. Sampling only these times keeps the read small (a 20-layer
  comp with a few keys each is a few hundred `valueAtTime` calls; the 2 s snapshot goal is checked
  live).
- **Fixture mode:** a saved capture can't be sampled at a new time, so `sample_times` is ignored in
  fixture mode and a missing time gives `not_sampled`. Skill stand-ins and eval fixtures that need a
  stored time must be captured with the CTI at that time (or with `sample_times` passed to
  `capture.mjs`). Each skill spec says which captures it needs.
- **Alternatives:** R3 at the current time only, as outlined (fails skill 6's P2 at every key time
  and skill 5's rest key unless the learner moves the playhead, 011 › 10); computing values at key
  times in Node from the key values and ease (wrong for spatial curves, expressions and holds);
  AE's `toComp()` (only inside expressions, so it would mean writing a temporary expression into the
  learner's project: not read only); a separate `sample_layer(times)` tool for skill 6 (skill 5 needs
  the same read, and two reads can disagree).
- **Open for the human (tasks-wave-b › Open questions, Q1):** this widens R3 beyond the outline, and
  it shapes `layer_info`. Recommended: take it.

## R18. One visibility class, with an order, and a fallback without `layer_info`

- **Decision:** `mentor/lib/visibility.mjs` gives each layer one of FR-013's six classes, first match
  wins: `null` (a null layer) → `matte` (used as a track matte by another layer, whatever its eye) →
  `hidden` (eye off) → `guide` (guide layer) → `shy` → `renders`. It also returns the raw facts a
  skill may need beside the class: `enabled`, `solo`, `soloed_elsewhere` (another layer is soloed and
  this one isn't), `shy` and `timeline_hidden` (shy and the comp's shy filter on). Solo never changes
  the class (Edge Cases, "Solo on another layer"). Cameras, lights, audio-only and adjustment layers
  are classed by the same rules; `kind` tells them apart, and no skill this sprint teaches them.
  Without `layer_info` it returns `known: false` and classes keyed layers by today's rule (`null` if
  a null, `hidden` if eye off, else `renders`), so old fixtures behave as today.
- **Rationale:** a null with its eye off is still a null (Edge Cases, "Hidden null with children");
  a matte with its eye off is a matte (KD-001); a guide with its eye off is first hidden by the
  learner. The fallback is what keeps every existing test and eval unchanged.
- **Alternatives:** several flags and no class (each skill would combine them its own way, which
  FR-013 forbids); `matte` before `null` (a null can't be a useful matte, and a null's children are
  the fact that matters).

## R19. The motion-sources map, step 1: own keys and the parent chain, with "not read" markers

- **Decision:** `mentor/lib/motion-sources.mjs` gives, per layer: `own_keys` (each keyed property:
  name, path, key count, `group` transform / effect / other, `expression_on`), `parents` (nearest
  first: index, name, class, shy, and `moves_children`, true when the parent has keys on anchor,
  position, scale or rotation; opacity and effects aren't inherited), `children` (direct),
  `expressions: { status: "not_read", on_keyed: [...] }` (only keyed properties with an expression on
  are known; unkeyed and turned-off expressions wait for read R2), `precomp_contents: "not_read"` for
  a precomp layer and `"not_a_precomp"` otherwise, and `static_as_read` (no own keys and no parents,
  meaning only what was read; consumers still check `expressions.status`). `sourcesOf(snapshot,
  layer)` returns `null` for a layer that isn't in the active comp. Without `layer_info`, `parents`
  is `null` and `read.parents` is `"not_read"`.
- **Rationale:** FR-014: "never that a layer has none". The map says what it read and what it
  didn't, so skill 6, DX-08 and later skill 4 can't mistake "not read" for "none".
- **Alternatives:** leave `expressions` out until R2 (a consumer would read absence as none).

## R20. KD-001's fix: `hidden_layers` leaves mattes out; nothing else in easing changes

- **Decision:** in `analyze()`, `hidden_layers` lists keyed layers whose class is `hidden` when
  `layer_info` is known, and today's eye-off list otherwise. The output keeps its shape (no new
  field). The demo picker keeps `enabled && !is_null`, so an eye-off matte is still never the demo
  (the frame wouldn't show the matte itself). `ease-mentor/SKILL.md` step 2 gets one line: a layer
  not in `hidden_layers` is never called hidden, and a track matte is never in it.
- **Rationale:** the smallest change that fixes KD-001. Every easing eval fixture lacks
  `layer_info`, so the eval set sees exactly today's output (FR-035's risk is only the one
  `SKILL.md` line). A new `matte_layers` field would add a line to every case's tool output while
  the easing set is at 20/25.
- **Alternatives:** a `matte_layers` field so the mentor can say "Wipe is the matte for Photo"
  (nicer; deferred to skill 8, which teaches mattes); demo on mattes (the frame shows the reveal, not
  the matte, so "watch this pair" is hard to follow).

## R21. Skills 1 to 3 switch to the visibility class in this pass; their other R1 changes come later

- **Decision:** this pass changes the eye-switch tests in `mentor/lib/key-types.mjs`,
  `speed-graph.mjs` and `offset.mjs` to the visibility class when `layer_info` is known, as each
  skill's spec already says (009 SR-3 and FR-023; 008 row 10; 010 FR-004, filter 2). Each skill's
  demo rule follows its own spec (skill 1: candidate and demo filter, SR-3; skill 2: a matte is a
  candidate, never the demo; skill 3: mattes eligible, demo rule unchanged unless spec 010 says
  otherwise). The rest of what those specs say happens "when R1 lands" (naming a parent in one
  sentence, frames chosen while no parent moves, precomp layers eligible through in points, stretch
  and time remap, a locked layer as the demo target) is **teaching** change: each needs its own spec
  update, `SKILL.md` lines and eval cases, so each is a later per-skill branch (tasks-wave-b › Later
  per-skill branches).
- **Rationale:** FR-013 ("No skill may filter layers by the eye switch alone") becomes checkable the
  moment the class exists, and the switch is mechanical and unit tested. Teaching changes in three
  skills would triple this pass's eval risk and hold up skills 5 and 6.
- **Alternatives:** leave all three to per-skill branches (FR-013 broken until then, and three more
  shared-owner branches for one-line filters); do everything here (see above).

## R22. Live fixtures: a planted-overlaps comp, Mentor Practice 2's wave B layers, and AE's own toComp as the answer

- **Decision:** two new dev scripts, each writing its own answer key:
  - `mentor/dev/build-overlaps-b.jsx` builds **"Mentor Overlaps"** in the same `.aep`: one layer per
    wave B Edge Cases row (a moving matte with its eye off, a hidden null with children, a shy parent,
    a guide layer, an expression on a keyed property, an expression on unkeyed Position, a static
    layer, precomp layers with stretch and with time remap, a locked layer, a 3D layer, an
    auto-oriented layer, a rotated and non-uniformly scaled parent chain, a separated-Position child).
    It isn't a lesson comp. For the comp-space answer key the script adds a temporary probe layer
    whose Point Control expressions call AE's own `toComp()` for chosen layers, reads their values at
    each sample time, writes them into the answer key, and deletes the probe. The solo row is a
    second capture with Solo turned on by hand.
  - `mentor/dev/build-practice-comp-2b.jsx` adds skills 5 and 6's targets to **Mentor Practice 2**
    (after wave A's captures of it), never touching its existing layers.
- **Rationale:** FR-012 wants live captures with an answer key. Planted overlaps (solo above all)
  would wreck a lesson comp, so they get their own. AE's `toComp()` is the ground truth for the math
  in R17, and a dev script may write to the project; the mentor's snapshot never does. Mentor
  Practice 2's answer key and wave A's captures stay as they are because 2b runs after them and has
  its own key.
- **Alternatives:** synthetic snapshots for the overlaps (FR-012 forbids, except pure-math unit
  cases marked synthetic); a fourth comp for skills 5 and 6 (plan › Wave B put them in the second
  practice comp, so the learner opens one comp for every new skill).

## R23. The easing eval gate for this pass

- **Decision:** FR-035 is already open (20/25 after wave A, cases 08 and 15), and another session is
  working on it in `product/evals/easing/`. This pass's merge condition is: the easing run on the
  branch is **no worse than a run on its merge base the same day** (no new failing case, no
  hard-rule failure), and FR-035 itself closes when that other work lands. The eval engineer runs
  both.
- **Rationale:** with no `layer_info` in any easing fixture, the only easing change the evals can see
  is the `SKILL.md` line (R20). Holding wave B until an unrelated regression is fixed would stall
  skills 5 and 6 for no safety gain. Open for the human (Q4).
- **Alternatives:** wait for 25/25 or 24/25 first (FR-035 as written).

## R24. The focus layer's bounds in a frame come from read R3, not a new read (FR-045)

- **Decision:** `preview_frame` with `layer` takes one snapshot with `sample_times: [time]`, then
  `footprint(snapshot, index, time, { extents })` from `mentor/lib/comp-space.mjs` gives the four
  corners and the axis-aligned bounds in comp pixels. `extents` is true when the sample has a
  `rect_extents` (shape and text layers: strokes and letters as drawn), else the layer's `rect`. The
  snippet behind this is read R3's existing `sourceRectAtTime(t, false / true)` plus the rendered
  transform at `t` (ES3, in `snapshot.jsx`); no new ExtendScript. The PNG's own width and height are
  read from its header in Node (the IHDR chunk, bytes 16 to 23), so no dependency.
- **What's proven live:** the transform math, against AE's own `toComp()` (T136); `rect` and
  `rect_extents` both matching a shape as drawn (spec 011 L-1). **What isn't:** whether
  `saveFrameToPng` renders at the comp's full size or at the viewer's resolution (the reply carries
  both sizes either way); whether a text layer's `rect_extents` matches its letters on screen; whether
  a guide layer shows in the saved frame (FR-045 treats it as not shown until checked). All three are
  tasks-wave-b.md T181 (🖐).
- **Rationale:** the bounds need no project change and reuse the math every wave B skill already
  trusts. A snapshot costs about 0.2 s live (spec 004 live sitting), well inside SC-004's 10 s.
- **Alternatives:** a second image with the other layers dimmed (solo or opacity changes the project,
  so it would need an undo in the same step or a duplicate comp; bounds were chosen over it with the
  seven loose ends, 2026-10-26);
  AE's `toComp()` through an expression probe (adds and deletes a layer, which is a write; it stays a
  dev-script answer key only).
- **Amended 2026-10-26, second pass (the reviewer, on the merged code):** `sourceRectAtTime` is the
  layer's own rectangle before masks and effects, and a precomp's is its whole comp size, so the
  bounds can be far larger than what shows (a small masked square "fills the frame"). The prompt
  can't stop this, because key types' `target_pairs` carries no layer kind or effect count. **Fix in
  the tool:** `preview_frame` gives no bounds, with a reason, for these, in this order after the
  existing class and timing checks and before `footprint()`: `precomp` (`layer_info.kind`),
  `effects` (`effect_count` above 0, or `null`), `masked` (a new `layer_info.mask_count`, above 0 or
  `null`) and `transparent` (a new per-sample `opacity`, the rendered Opacity at that time, under
  1). The two new reads are one ES3 line each in `snapshot.jsx`, read the same guarded way as
  `effect_count` (`property("ADBE Mask Parade").numProperties`; `transform.opacity.valueAtTime(t,
  false)`). Any mask counts, whatever its mode, and any effect counts, even one that doesn't move
  pixels (Fill, Tint): no bounds only costs the pointer, and the mentor then describes the frame as
  it did before FR-045, which is safe; a wrong pointer isn't. Opacity under 1% rather than exactly 0,
  because a layer fading in at 0.4% can't be seen either. A field absent from an older capture is
  unknown and gives no reason, so T178's tests on those captures hold. Footage with transparent
  areas has the same flaw and is left in (spec LE-6). **Alternatives:** reading each mask's path and
  each effect's output to clip the bounds (masks are readable, but feathers, expansion, modes and
  every effect's own geometry aren't, without a render); sending the kind and effect count to the
  prompt (it would still guess the shape, and the field list would reach every skill's reply).

## R25. Telling a stale server from a current one (FR-044)

- **Decision:** the tree hash of `mentor/` at `HEAD` (`git rev-parse HEAD:./`, run with the working
  directory set to the folder holding `server.mjs`, found from `import.meta.url`, never
  `process.cwd()`), read once when the server starts and again on each call that returns
  `server_current`, with a short time-out. Any failure gives `null`, which the skills treat as current.
- **Rationale:** a merge into `mentor/` changes the tree hash and nothing else does (a commit elsewhere
  in the repo doesn't), so a long session isn't flagged for an unrelated commit. Resolving from the
  server's own folder works from the panel's runtime folder, whose `.mcp.json` points at the repo's
  `server.mjs` by an absolute path (`panel/lib/runtime.js`), and from a worktree. Uncommitted edits
  in `mentor/` aren't seen; that's fine, because live lessons run on merged code.
- **Alternatives:** file modification times under `mentor/` (a checkout or an editor's save changes
  them without a code change); a version number bumped by hand (forgotten); the server process's start
  time (every panel turn starts a new server, so it says nothing about the code).
- **Amended 2026-10-26, second pass (the reviewer, on the merged code):**
  - **Hash only what the server runs.** The whole-tree hash changes on every commit to `mentor/test/`
    or `mentor/dev/`, and the sitting method commits captures in the middle of a session, so the
    mentor told the learner to restart for nothing. Now: `git ls-tree HEAD` run in the folder
    holding `server.mjs` (it lists that folder's entries, each with its object hash, with paths
    relative to that folder), the `test` and `dev` lines dropped, and the rest hashed in Node
    (`node:crypto`, sha256 of the listing as text). Everything else counts, including `fixture/`
    and `fixture.mjs` (evals run them) and `package.json`, so a new runtime folder is covered
    without a list to keep up; a new non-runtime folder at the top costs a false warning, never a
    missed one. **Alternatives:** a list of what to include (a new runtime folder would be missed
    silently); one `git rev-parse` per runtime entry (several processes per call for the same
    answer); hashing the files on disk (that sees uncommitted edits, so a builder's save mid-lesson
    would flag; and it reads every file on every call).
  - **Don't start git where there's no checkout.** On a Mac without the command-line tools,
    `/usr/bin/git` is a stub that opens an install dialog, on every call, so the learner would see
    a dialog with each snapshot. Git runs only when a `.git` folder or file (a worktree's) exists in
    the server's folder or any folder above it, checked with `fs.existsSync` on each read before
    spawning; otherwise the read is `null` and nothing starts. An installed copy (spec 006) has no
    `.git`, so it never runs git. **Alternatives:** `xcode-select -p` first (another process, and
    it's Mac-only); `git --version` first (that's the call that opens the dialog).

## R26. A resumed lesson: compare the targets' layers, and say when choices came back (FR-043, FR-046)

- **Decision:** in `session.start`, for an open lesson that was never checked and has no demo, and
  is about to be **resumed**, compare its `baseline` with this snapshot on **the layers its targets
  and focus name**: every name in the stored `target_refs[].layer`, and in `focus` when that's a
  list of names. For each name, the layers with that name, in index order, must have in both
  snapshots: the same keyed properties (`path`), each with the same `expression_enabled` and the
  same `keys` exactly as the snapshot reports them (times, values, interpolation, temporal ease; the
  snapshot's own rounding, no further tolerance); and, when both snapshots have `layer_info`, the
  same `in_point`, `out_point`, `start_time` and `parent`. A name found in neither snapshot matches
  (nothing to compare); found in one and not the other, it doesn't. Any difference makes the lesson
  stale, and it's replaced as if it didn't exist. A lesson with no targets and no focus yet (key
  types before the learner names one) always matches.
- **`stored_choices`:** `start()` returns it with `lesson`, `session` and `analysis`: `true` only when
  the result is `resumed`, the lesson already held `skill_options` from an earlier call, and this
  call sent none; `false` otherwise (new, continued, or a call that sent its own). It's not stored.
  The three merged lesson snapshot tools add it to their replies as it is; the prompt reads the
  choices themselves from fields each reply already has (FR-046).
- **Rationale:** the four tests that failed (T061, T063, spec 012 SR-1) resume on the same capture,
  so they match and keep their choices; T037's case matches too, and is now caught by the confirm
  question instead of a reset. Comparing only the named layers means an edit elsewhere in the comp
  doesn't throw a lesson away; comparing timing and parent too catches offset (whole layers moved)
  and the null (parenting rewrites keys and the parent link). Names, not indexes, because adding a
  layer (a null) renumbers everything below it (spec 004 live sitting). The rule stays in the
  session, so no skill's analyzer changes, and it applies to every skill, easing included.
- **Alternatives:** comparing the whole comp (any edit anywhere, even a new guide layer, would reset
  the lesson); comparing target ids only (offset's targets and key types before a focus name none);
  a per-skill "is this stale" hook in each analyzer (five files for one rule, and skills 5 and 6
  are out of this pass); a stored "the learner confirmed" flag (the confirm is a conversation step,
  and a later resume should ask again); returning the choices themselves in a new field (each reply
  already shows them, in the skill's own words).

## Dependencies

No new npm dependency. Node built-ins only (`node:fs`, `node:path`, `node:test`). The
`curriculum.md` table parser in `path.test.mjs` is a few lines of string splitting.
