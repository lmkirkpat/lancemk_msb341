# Research: Diagnosis (spec 005)

Phase 0 for [plan.md](plan.md). Each entry gives the decision, why, and what else was considered.
Facts about the code were checked against `main` at `9d06b19` (2026-11-09) by reading, not by
running tests (eval batches were running from the main checkout).

## R1. What the snapshot reads now (corrects spec › "What the mentor can read today")

- **Finding:** the spec's table (verified 2026-10-20 at `7fde798`) is out of date. Spec 004 wave B
  (reads R1 and R3) added a `layer_info` entry for **every** layer, keyed or not, with: `kind`,
  `enabled`, `is_null`, `adjustment`, `three_d`, `auto_orient`, `parent` (index), `shy`, `solo`,
  `guide`, `locked`, `in_point`, `out_point`, `start_time`, `stretch`, `time_remap`, `matte`,
  `is_matte`, `motion_blur` (the layer switch), `effect_count`, `mask_count`, and transform samples
  (`mentor/jsx/snapshot.jsx` lines 282 to 334). The comp now carries `hide_shy`, `width`, `height`
  and `time`, and the snapshot carries `host` (AE version, OS).
- **Still not read:** the comp's own motion blur switch (`comp.motionBlur`), expression text and
  expressions on unkeyed properties (read R2), anything inside a precomp (R4), the work area, and
  shape or text key values.
- **So:** Adobe's findings 3 (stacked parent motion) and 8 (motion blur) no longer need new reads,
  except the comp switch. Every row in the spec's "Reaches the model today?" column is still "No",
  so the spec's main claim (none of Adobe's 8 reaches the learner as a diagnosis) holds.
- **Decision:** US1 uses no new read. US4 adds one: `motion_blur` on the snapshot's `comp` object.
  The spec is amended to match (R16; spec › Amendment 2026-11-09).

## R2. Where the analysis lives, and what it reuses

- **Decision:** new pure modules in `mentor/lib/` (`diagnosis*.mjs`) and one tool file,
  `mentor/tools/diagnosis.mjs`, that `tools/index.mjs` finds by itself. Reuse:
  - `timing.mjs` › `timing()` for moves per unit (separated dimensions merged, holds as instant
    changes, expressions and single keys excluded, precomps listed), `last_motion_end`, and
    `clusters()`. Its header says it measures without verdicts so "each consumer (skill 3, spec 005)
    applies its own threshold".
  - `analyze.mjs` › `segments()` and `segmentState()` for DX-01 (linear and `partly_eased`), so
    diagnosis and the easing lesson never disagree about a pair.
  - `motion-sources.mjs` for parent chains and whether a parent moves its children (DX-08).
  - `visibility.mjs` for the one visibility class per layer (null, matte, hidden, guide, shy,
    renders) and `soloed_elsewhere`.
- **Why:** these are the rules the six skills already pass their overlap audits with. A second
  copy would drift (the 2026-10-29 overlap audit found a renumbering bug that broke three skills at
  once because each had its own filter).
- **Alternatives:** folding diagnosis into each skill's finder (rejected by the spec: per-skill
  checks can't compare across layers); one large `diagnosis.mjs` (rejected: the detectors, the
  ranking and the identity rules are tested separately and change for different reasons).

## R3. Thresholds (spec FR-005: "set in the plan and fixed by the answer key")

All times are compared in whole comp frames (round(t × frame rate)), as `timing.mjs` › `byFrame`
does. **Counted** means: on a layer whose visibility class is `renders` or `matte`, not soloed
elsewhere, not a null (except in DX-08), on a property that isn't excluded (no expression, two or
more keys), and inside the layer's in and out points.

| ID | Fires when | Reported as |
|---|---|---|
| DX-01 | At least one counted pair is `linear` or `partly_eased`, leaving out properties raised as DX-05's fade shape (SW-5, approved 2026-11-09) | **One finding per comp**: the layers and properties, pair count, and each half-eased pair's linear end |
| DX-02 | At least 3 counted ramp moves on **3 or more different layers** share one duration within ±1 frame, and they are at least half of all counted ramp moves in the comp | One finding per comp: the shared duration and the layers |
| DX-03 | On one layer, two or more units have a ramp move that starts on the same frame **and** lands on the same frame (separated Position is one unit) | One finding per layer: the units and the span |
| DX-04 | A property with 3 or more numeric keys where two neighbouring ramp moves meet at a key and their speeds differ by a ratio of **1.5 or more** (multi-value: straight-line distance per second; a bezier middle key uses its in and out ease speeds, a linear one the two average speeds) | One per property: the key's time and both speeds |
| DX-05 | (a) a property whose keys alternate between exactly two values for 3 or more keys with ramps between them (a blink that fades), or (b) a lone held pair (not part of a run of two or more) on Position, Scale or Rotation between two different values | One per property, kind **ask**, with `measures.shape` `fade` (a) or `jump` (b) |
| DX-06 | A keyed property has an expression turned on | One per property, kind **ask** |
| DX-07 | The last change in the frame (latest counted landing, instant change, or a counted layer's in or out point inside the comp) is at least **2 s and at least 25%** of the comp's length before the comp ends | One per comp: the last change's time, the comp's length, the gap, and the layers and properties an expression keeps moving (data only; the words are `dx-07-effect`'s) |
| DX-08 | A counted layer has its own ramp on a transform property its parent chain also moves (`motion-sources` › MOVES), and the two spans overlap by at least 1 frame | One finding per parent: its children and each overlap span (US4) |
| DX-09 | The comp's motion blur switch is off, **or** every counted layer with a transform ramp has its layer switch off; at least one such layer exists | One per comp, kind **setting** (US4) |

- **Why these numbers:** each is the smallest rule that finds Adobe's example on Mentor Practice
  and nothing the overlap rows say must not fire. DX-02's "3 layers, half of moves" keeps a
  two-layer coincidence out; DX-04's 1.5 catches Bar's 833 vs 433 px/s (1.9) and leaves out the gentle
  differences of a hand-shaped path; DX-07's "2 s and 25%" catches 3 s of motion in an 8 s comp and
  leaves out a short hold at the end of a 4 s comp.
- **They live in data** (`curriculum/diagnosis.json`), so tuning one is a data change with its
  answer-key test, not a code change.
- **Alternatives:** per-learner thresholds (no evidence to set them); Adobe's wording as the
  target (it isn't a spec; it's one session).

## R4. Shape: one finding per comp, layer or property

- **Decision:** the "reported as" column above. DX-01, DX-02, DX-07 and DX-09 are one finding per
  comp, so a mechanical comp doesn't fill the top 3 with one kind. DX-03 is per layer, DX-04 to DX-06
  per property, DX-08 per parent.
- **Why:** FR-007's "at most 3 up front" only means something if the three are different causes.
  Mentor Practice gives about 9 findings (Adobe's 8 plus linear pairs) instead of 20 or more.

## R5. Ranking and "start here" (FR-007, FR-008)

- **Decision:** a fixed order, in data, applied by `diagnosis-rank.mjs`:
  1. **Symptom first** (FR-008): when the call passes `symptom_layers` (and optionally
     `symptom_time`), findings on any of those layers, and covering that time if given (±0.5 s),
     rank first. If none match, `symptom_matched: false`; the skill then says nothing it can read
     explains it (acceptance US1 › 3).
  2. **Rank weight by kind**, default: DX-01, DX-08, DX-04, DX-03, DX-02, DX-07, DX-09, DX-05, DX-06.
     Depth first (what Adobe guessed was the biggest cause and couldn't read), then motion that fights
     itself, then style across the comp, then settings, then the questions.
  3. Ties: more layers involved first, then the earliest time.
  **Start here** *(amended 2026-11-09, teaching design SW-1 and SW-2, approved)*:
  - **With a matched symptom:** the highest-ranked non-ask among the matched findings; if every
    matched finding is an ask, the first matched one. Reason `symptom`.
  - **Without one** (or none matched): the highest-ranked non-ask finding. Reason `depth`; `only_one`
    when there's one finding in all; `all_questions` when every finding is an ask (then rank 1).
  The reply carries `start_here_reason` as one of `depth`, `symptom`, `only_one`, `all_questions`,
  which the skill turns into the design's § 5 words. `first_non_ask` is dropped: with asks weighted
  last and the symptom rule above, the start is never below an ask for that reason.
- **Teaching design owns the reasons:** which cause to start with is partly a teaching choice. The
  curriculum designer may change the weights in `teaching-design.md` (T001); the catalogue mirrors
  them and the answer keys follow.
- **The model picks the words, not the order:** the skill maps what the learner said to layer names
  from the result's `layers` list and passes them back. Matching free text in the tool was rejected
  (it would be guessing in code).

## R6. The not-checked list (FR-004)

- **Decision:** `diagnosis-scope.mjs` returns two lists:
  - **set aside** (read, not compared): hidden, guide, and soloed-elsewhere layers, by name.
  - **not checked** (not read): each precomp's inside (by name), precomp time remap or stretch (by
    name), the comp motion blur switch when unread, and a **standing** item, motion driven only by an
    expression, which is always present because it can't be detected (R1).
- The skill says the standing item only when the answer would otherwise imply motion has ended
  (DX-07) or that nothing's wrong (a clean comp). It always names precomps. The deterministic eval
  check for SC-005 keys on the precomp and set-aside lists.
- **Alternatives:** reading expressions on unkeyed properties now (a read the spec put out of scope);
  saying the standing item every time (noise in every answer).

## R7. Finding identity across reads (FR-014, edge cases)

- **Decision:** a finding's **key** is its DX ID plus layer **names** (sorted) plus the property's
  display path (none for per-comp kinds). Times and measures aren't part of the key. On a fresh read:
  - **gone**: no finding with that key;
  - **still there**: same key, same measures;
  - **changed**: same key, different measures (DX-01 with fewer pairs; DX-02 with fewer layers), or
    the key is gone but a new finding sits on the same layer and property under another DX ID (a
    fade turned into holds that now raise something else);
  - **unmatched**: a layer name in the key is now on two layers.
  Changes outside the findings are never reported as mistakes; anything gone counts, whichever
  finding the learner was working on (edge case).
- **Why names:** adding a null renumbers every layer below it (spec 004 live sitting), and the
  2026-10-29 audit's worst bug was index-keyed matching.

## R8. Where the open diagnosis lives during a session

- **Decision:** `diagnosis.json` in the learner home, keyed by `project` + comp name, holding the
  last result's findings (keys, states), the intended marks, and `taken_at`. It's read and written on
  every call, never cached, like `session.json`. An unreadable file is set aside, as `json-file.mjs`
  does for the others (`DIAGNOSIS_UNREADABLE`), and the diagnosis still runs.
- **Why not `session.json`:** `session.mjs` is shared and every skill's lesson state machine depends
  on it, so editing it would touch every skill and its tests (add-only rule).
- **The diagnosis for a different comp** is kept but not shown (edge case: a remembered diagnosis is
  shown only for the comp it was made on).

## R9. Writing the learner record (FR-017, FR-018, FR-021)

- **Decision:** the tools write it; there's no `record_diagnosis` tool for the model to call or
  forget. After every **complete** `diagnose_comp`, `check_finding` or `mark_intended`,
  `diagnosis-store.mjs` upserts one entry in `learner.json › diagnoses` for this comp and this
  diagnosis (`id`): finding keys, DX IDs, layer and property names, times, states, and the
  recommendation. That's done through a new `saveDiagnosis()` exported from `learner-store.mjs`
  (one shared edit), so there's still one writer of `learner.json` and one personal-details check.
- **No free text:** no summary, no method, no motive. Layer and property names are checked with the
  existing email and phone patterns; a match refuses the save (`UNSAFE_RECORD`), and the diagnosis
  is still shown.
- **Skill status untouched:** `saveDiagnosis` writes only `diagnoses` (FR-021). A unit test proves
  `skills` and `lessons` are byte-identical before and after.
- **Conflict flagged:** spec 007's held edge case says "nothing is recorded (spec 005 FR-017 writes
  only at the end of a diagnosis)" for a stopped turn. With the tools' way, a tool call that
  completed before the learner pressed Stop is recorded. Recommended: accept it (a complete read is
  true, and the record never claims a skill), and amend spec 007's edge case. **Approved 2026-11-09**;
  spec 007's amendment is T054.
- **Alternatives:** the model calls a record tool at the end (record_lesson's pattern). Rejected:
  "end of a diagnosis" has no clear event, and the 2026-10-12 audit's lesson was to enforce
  record rules in tools.
- **When it's built:** with US3, which is gated on spec Q1 (R15). Until then the tools write only
  `diagnosis.json` (R8), which is enough for US2's re-checks and for intended marks to hold on that
  comp (FR-016). The learner record, and so the panel's memory, show no diagnoses until US3.

## R10. What to learn next (FR-020)

- **Decision:** `diagnosis-recommend.mjs`, pure, from the result, `path.json`, the record and the
  built skill IDs (`tools/index.mjs` › `SKILLS`):
  1. The start-here finding's skill from `path.json › findings`.
  2. **Not teachable yet** when it maps to `null` or to a skill no tool file declares
     (`motion.sources` today, for DX-06 and DX-08).
  3. **Review** when the skill is learned and has a review mode (`FINDERS[...].review`); a
     **practice lesson** when learned without one (easing); else a **lesson**.
  4. **Pattern** when the same DX ID is open (or was) in 2 or more diagnoses in the record, on any
     comps.
  It never calls `session.recordReviewOffer`, so it doesn't use spec 004's one review per session
  (FR-020, spec 004 Q2). When the comp has no findings, the skill calls `recommend_next` instead
  (FR-026's last clause).
- **US2 builds steps 1 to 3** (needed to offer a lesson). **US3 adds the pattern** and the
  learned → review path's evals.

## R11. Handing over to a lesson (FR-012)

- **Decision:** `/diagnose-mentor` hands over exactly as `/next-mentor` does: the `Skill` tool with
  the skill's command, the finding's layer names as arguments, and `review` for a review. On B1 the
  `Skill` tool isn't available in headless runs (spec 013 research R6), so the skill stops at the
  offer and the panel's follow-on request starts the lesson (spec 007 RQ-05). Hand-over eval cases
  are A-only, as in the next-mentor set.
- **Known gap inherited:** next-mentor's cases 06, 07 and 10 record that named layers don't always
  reach the lesson. Diagnosis adds no workaround of its own; it gets whatever fixes next-mentor.
- **The lesson's rules apply from the hand-over on** (FR-011, FR-012): the lesson opens with its own
  snapshot tool, its own one demonstration and its own record. Nothing in diagnosis counts toward it.

## R12. Server instructions stay unchanged

- **Decision:** `mentor/server.mjs`'s `INSTRUCTIONS` aren't edited. Rule (3) (one demonstration per
  lesson) and (7) (don't fix and don't offer to) already cover diagnosis; rule (4) ("start with the
  lesson's own snapshot tool") reads correctly with `diagnose_comp` as diagnosis's snapshot tool.
  Diagnosis-specific rules (at most 3, start here, ask before calling it wrong, decline "fix all")
  go in its `SKILL.md` and the tool descriptions.
- **Why:** the instructions are in every skill's prompt on both runtimes. Changing them moves every
  set's baseline and every A result (spec 006 FR-025).

## R13. The skill's name and tools

- **Decision:** `/diagnose-mentor` (`.claude/skills/diagnose-mentor/`). The `-mentor` suffix is what
  the panel's runtime folder links and what A accepts (`decisions/011` table, spec 013 T067).
  `allowed-tools`: `mcp__ae-mentor__diagnose_comp`, `check_finding`, `mark_intended`,
  `preview_frame`, `read_learner_record`, `recommend_next`, `Skill`.
- **Description triggers:** "/diagnose-mentor", "what's wrong here", "why does this look
  mechanical/off/stiff", "what broke", and a session started without naming a skill or asking what
  to learn next (FR-026). `decisions/006` parks "Gauge" as a feature name; not used (naming isn't
  this plan's).

## R14. Fixtures: planted comps, captured live

- **Finding:** Mentor Practice no longer looks as it did on 2026-10-08. Title is eased and shaped (the
  speed graph lesson, kept on purpose for its review), Title's Position has a fourth key, and Cursor
  holds. And the build script (`mentor/dev/build-practice-comp.jsx` line 124) builds Cursor with
  **holds**, while Adobe described it as a fade. So Adobe's finding 5 may have been a misread, or
  the comp had been changed that day. **Approved 2026-11-09:** SC-002 runs on the rebuilt Diagnosis
  Practice below, with Cursor fading, and finding 5 counts there.
- **Decision:** a new dev script, `mentor/dev/build-diagnosis-comps.jsx`, builds comps in the
  practice project without touching existing comps:
  1. **Diagnosis Practice**: `build-practice-comp.jsx`'s layers as of 10-08 (linear Title, CTRL
     parent, Bar's jolt, Logo's `time * 30`, Icon precomp, Old Take hidden), with Cursor **ramping**
     so Adobe's finding 5 exists to find, and motion blur off.
  2. **Diagnosis Clean**: eased, offset, varied durations, motion to the end, motion blur on.
     Nothing to find.
  3. **Diagnosis Precomps**: mostly precomp layers, one with time remap, one stretched.
  Plus the existing captures already in `mentor/test/fixtures/layer-info/` (Mentor Overlaps,
  Mentor Practice 2 and 2b, parented and anchor variants), reused for the overlap rows. With 3 new
  live captures, that gives at least 6 for SC-001.
- After-fix captures for US2 (Diagnosis Practice with Bar's middle key eased, then undone) are
  taken in the same sitting.
- **Answer keys** are written by hand from the build script, not by running the code (spec 004's
  T037 method), then the live capture is compared strictly (`capture.mjs --compare` skips
  `layer_info`, so the strict compare from the sitting method is used).

## R15. Order and gates

- **US1 + US2 + US5 are the MVP**, as the spec's Q1 recommendation says.
- **US3 waits for spec Q1** (SC-009: one hidden-fault session with a target-market learner).
  Its tasks are written so the builder can release them without re-planning.
- **US4 is cheap now** (R1): DX-08 and DX-09 are analysis plus one comp field. The spec held US4 with
  US3 because it needed new reads. **Approved 2026-11-09:** US4 is built right after the first
  version (after US5) and isn't gated; only US3 waits for T005.
- **FR-026's entry** is last and small (the builder's note).

## R16. Spec facts to amend (T053, done 2026-11-09: spec › Amendment 2026-11-09, approved)

1. "What the mentor can read today": now reads parenting, layer switches, mattes, in and out points
   (R1); US4's "needs new reads" becomes "needs one new read".
2. US5 › 2 and SC-006: the easing baseline is 27/28 (2026-10-29), not 25/25 (2026-10-19).
3. Assumptions › Curriculum not ready: the skill map exists (`path.json › findings`); DX-06 and DX-08
   map to `motion.sources`, which isn't built, so both are "no skill yet" today.
4. Edge Cases: add the trimmed-layer row and the guide and solo row (plan › Overlaps).
5. SC-002: name the comp it runs on (Diagnosis Practice, R14).
6. Spec question 4 answered (teaching design: yes), and the other questions recorded as resolved.
