# Implementation Plan: Ask the mentor

**Branch**: `014-ask-mentor` (spec folder only; build branches are the cockpit's) | **Date**: 2026-11-14 |
**Spec**: [spec.md](spec.md) (approved 2026-11-14, OQ-1 to OQ-5 as recommended; constitution 1.5.0)

**Status**: Approved by the builder 2026-11-14 (PQ-1 to PQ-5 as recommended).

**Inputs**: [teaching-design.md](teaching-design.md) (TD; § 5.1, § 7, § 16 and § 19 as updated 2026-11-14), the
approved mockup [`product/mockups/ask-mentor/`](../../product/mockups/ask-mentor/README.md) (MU, README and
`index.html` v5), spec 015's plan and contract ([`describe_layers`](../015-expression-precomp-reads/contracts/describe-layers.md)),
spec 013 (runtime A), spec 007 (the panel).

## Summary

A second way into the mentor: a question about the open comp gets a read of the layers it touches
(spec 015's `describe_layers`), then one answer whose words and steps reach the panel **as tool data**,
then the learner's choice. Three spec phases, as the spec orders them, plus a ship step:

- **Phase 1, Answer (US1, US3).** A new `ask-mentor` skill and a new tool file `mentor/tools/ask.mjs`
  with `give_answer`: the mentor's answer is the call's four fields, checked by the tool (two offered
  skills at most, each among the steps' skills, no keyframe skill on keyless motion, the comp named
  first, none offered on B1). The panel opens ask-first, draws the answer from `give_answer`'s result
  (never from prose), docks Your steps, and pauses Ask from the bridge's new `comp_active` flag.
- **Phase 2, Go deeper (US2).** `go_deeper` saves a hand-in in `session.json` and the mentor hands over
  with the `Skill` tool on A. The pivot and null snapshot tools read the hand-in and open on the moving
  layer (K6); the pivot takes a null with children as its focus and grades the children's footprints
  (K7); `record_lesson`'s reply carries the hand-back. The panel draws the go-deeper states.
- **Phase 3, Follow-through (US4, US5, US6).** Asked entries in the learner record (a new `asked` list,
  so no lesson reader changes), `note_said`, the asked candidate in `recommend_next`, K5's record guard,
  rule 5 in the opening read, and the four shared rules plus hand-in in the other four skills.
- **Ship step.** `ready-for-a`, a dry run and one paid A run of the ask set, then the three sessions on
  A (SC-001).

**MVP** = phases 1 and 2 on A: one answer with steps and one go-deeper on pivot or null, which is what a
session needs. Phase 3 may land between sessions; it must land before the third (US5).

## Technical Context

**Language/Version**: Node ≥ 18 (ES modules, built-ins only) for `mentor/` and `panel/helper/`; CEP's Node
(CommonJS, no `?.` or `??`) for `panel/lib/`; ES3 for any snippet; the bridge's `cep/host.js` (CEP Node).

**Primary Dependencies**: none new (constitution V). The helper's SDK (`@anthropic-ai/sdk`) is unchanged.

**Storage**: the learner record gains an `asked` list (additive, version stays 1); `session.json` gains an
`ask` block (answer, hand-in); `panel-session.json` goes to version 3 (an ask thread). Nothing in the repo.

**Testing**: `node --test` in `mentor/test/` on fixtures from spec 015's live captures; `panel/test/` from
fixture events, no mentor; `panel/helper/test/` with the fake service; a new eval set `product/evals/ask/`
on B1, with situation 16 on A; the six sets and next-mentor re-run on B1.

**Target Platform**: macOS, After Effects 27.0, the forked CEP bridge; runtime B1 for building, A for the
sessions.

**Project Type**: MCP server tools + skills + CEP panel + one bridge field.

**Performance Goals**: first sign of the mentor working ≤ 10 s in 9 of 10 ask turns on A (SC-004); median
answer turn ≤ $0.10 and go-deeper lesson ≤ $0.40 on A (SC-005). The read is spec 015's (≤ 0.5 s added to
a snapshot); the cost is mostly the skill's prompt, so `ask-mentor/SKILL.md` stays short (research R16).

**Constraints**: ask mode never changes the project (FR-002); the panel never parses prose (FR-016, FR-048);
no stand-in reads (FR-059); learner's words never in the record (FR-040, FR-045); the panel reads only the
yes or no `comp_active` from the bridge (constitution II, 1.5.0).

**Scale/Scope**: one skill (new), three tools (new), changes to the six lesson skills and `/next-mentor`,
about 30 panel state ids (MU › States), one eval set (about 25 cases).

## Constitution Check

*GATE: passed before Phase 0 research; re-checked after design (below).*

| Principle | How this plan meets it |
|---|---|
| I. Spec before build | Spec 014 approved 2026-11-14; teaching design and mockup approved the same day |
| II. Decisions recorded | `decisions/003`, `005`: the ask tools are narrow and fixed (no script argument); `give_answer`, `go_deeper` and `note_said` touch only `session.json` and the record, never AE. The panel draws from tool results and the record, holds no teaching logic (which skill to offer, B1's empty offer and every guard are the server's), and reads one thing from the bridge: `comp_active` as true, false or null, **no name** (the 1.5.0 exception). `decisions/012`: Home ask-first, no review at the door. No new decision needed |
| III. Teaching quality evaluated | New set `product/evals/ask/` (FR-061) built by the eval engineer, not the skill-builder; the six sets and next-mentor get the rule cases (FR-062) and re-run after each `SKILL.md` change |
| IV. Privacy | The question, expression text and effect names stay in the conversation; the hand-in keeps no learner words (research R5); asked entries hold general terms only and pass the personal-detail check on every text field (FR-044) |
| V. Simplicity and checkpoints | No new dependency. Many files, so this plan and tasks go to the builder first. Asked entries go in a new list so no existing reader changes (R8) |
| VI. One owner per file | `mentor/**`, `bridge/**` and `.claude/skills/*-mentor/**`: skill-builder, one `--shared-owner` branch per spec phase (R15). `panel/**` (helper included): panel-builder, its own branch per phase, in parallel. `product/evals/**`: eval-engineer. Spec 007 and 014 spec files: spec-writer. TD: curriculum-designer (no TD edit is needed by this plan). One AE driver at a time |
| Build on B1, ship on A (`decisions/011`) | Built and evaluated on B1. Go deeper exists only on A (B1 carries no offered skills, FR-017), so situation 16 and SC-013 are A checks. **Moving to A:** steps 1 and 2 (`ready-for-a`, `--runtime a --dry-run`) on the ask, pivot, null and next sets; step 3, one paid A run of the ask set against its B1 baseline; step 4, the three sessions on A (`bash panel/install.sh --runtime a`). The other changed sets re-run on A before the first tester (SC-007), not before the sessions |

**Active decisions relied on:** 002 (amended by 012), 003, 004, 005, 007, 008, 011, 012. Specs relied on:
013 (A, FR-033), 015 (the reads, K2, K3), 007 (the panel), 004 (record, opening read).

**Re-check after design:** still passes. Choices worth naming: the answer's words come only from
`give_answer` (PQ-1), so the panel has nothing to parse; B1 is detected by the server from the helper's
environment, fail-closed to B1 (R4); `comp_active` is `null`, never a guess, when AE is busy (R10).

## Project Structure

### Documentation (this feature)

```text
specs/014-ask-mentor/
├── spec.md
├── teaching-design.md          # curriculum designer's
├── plan.md                     # this file
├── research.md                 # R1 to R18
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ask-tools.md            # give_answer, go_deeper, note_said
│   ├── hand-in.md              # K6 hand-in, K7, hand-back, opening order
│   └── panel-ask.md            # what the panel reads and draws; result lines; comp_active
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
mentor/
├── tools/ask.mjs               # new: give_answer, go_deeper, note_said (TOOLS only)
├── lib/ask-answer.mjs          # new: validate and normalize the asked result
├── lib/runtime-flag.mjs        # new: "a" or "b1" from AE_MENTOR_RUNTIME
├── lib/asked-record.mjs        # new (phase 3): asked entries, K5 helpers
├── lib/session.mjs             # changed: ask block, hand-in, attributed changes (K5)
├── lib/opening.mjs             # changed: hand-in before review; no review after a question
├── lib/learner-store.mjs       # changed (phase 3): asked list, personal-detail check
├── lib/recommend.mjs           # changed (phase 3): asked candidate; K4 test first
├── lib/anchor.mjs, anchor-check.mjs        # changed (phase 2): K7 null focus, place given
├── tools/transform-anchor.mjs, null-parenting.mjs   # changed (phase 2): hand-in
├── tools/easing.mjs, key-types.mjs, speed-graph.mjs, offset.mjs   # changed (phase 3): motion_from, hand-in
├── tools/common.mjs            # changed: hand_back in record_lesson's reply; K5 guard
├── curriculum/path.json        # changed: short_name per skill (FR-021)
└── test/*.test.mjs             # new tests per FR

bridge/cep/host.js              # changed: /health adds comp_active (UPSTREAM.md noted)

.claude/skills/
├── ask-mentor/SKILL.md         # new
├── anchor-mentor/, null-parenting-mentor/       # changed (phase 2)
├── ease-, key-types-, speed-graph-, offset-mentor/  # changed (phase 3)
└── next-mentor/SKILL.md        # changed (phase 3): asked candidate

panel/
├── lib/ask-result.js           # new: give_answer's result → AskView, fail closed
├── lib/ask-thread.js           # new: the thread model (questions, folding, latest steps, go-deeper)
├── lib/home.js, screens.js, view-state.js, copy.js, requests.js, connection.js,
│   panel-session.js, turns.js, skills-view.js, memory.js, app.js, lesson.js   # changed
├── helper/lib/mcp-client.mjs   # changed: AE_MENTOR_RUNTIME=a for the server
├── dev/turns.js                # changed: ask turns reported apart
└── test/*.test.js              # new and changed

product/evals/ask/              # new set (eval-engineer)
product/evals/{anchor,null-parenting,easing,key-types,speed-graph,offset,next-mentor}/  # rule cases
```

**Structure Decision**: everything fits the existing three parts (mentor server, skills, panel). New logic
goes in new files where it can, so shared-file edits stay small; asked entries get their own list so the
lesson code paths don't change.

## Phases

| Phase | Tasks | Waits on | Gate |
|---|---|---|---|
| **0. Before build** | T001 to T007 | Nothing | `comp_active` live facts and the hand-over test folded into research |
| **1. Answer** (US1, US3) | T008 to T040 | Mentor half: spec 015 T040 (phase 1 shippable). Panel half: nothing | Ask set on B1 (SC-006's B1 half for phase 1 cases); panel states (SC-011 for phase 1 ids) |
| **2. Go deeper** (US2) | T041 to T063 | Phase 1 merged; spec 015 T026 (`motion_from`, pivot and null) and T023 (K2 in the pivot check) | Pivot, null, ask sets on B1; go-deeper panel states |
| **3. Follow-through** (US4, US5, US6) | T064 to T087 | Phase 1; FR-029 and FR-035 wait on spec 015 T022 to T025 (K2) | All six sets, next and ask on B1 (SC-006, SC-007) |
| **Ship** | T088 to T100 | Phases 1 and 2 merged; spec 015 SC-001 to SC-003 passing (FR-060); phase 3 before session 3 | SC-001 to SC-005, SC-012, SC-013 on A |

## Risks

- **The model writes prose next to `give_answer`** (PQ-1). The eval set's deterministic check catches it,
  and the panel draws the fields either way (nothing said twice).
- **The tool's guards refuse too often** and cost turns (each refusal is a retry). The ask set's runs
  count refusals per case; a guard that fires on more than 1 in 10 good answers gets loosened.
- **Cost per answer over $0.10** because the skill's prompt is large (the baseline spent $0.16 loading one
  skill). R16 keeps `SKILL.md` short and the read to the summary shape first.
- **`comp_active` is wrong while the CEP panel has focus** (T001 checks); if so, the flag stays `null`
  and `ask-nocomp` covers it.
- **Spec 015 slips.** The panel half of phase 1 and every test on 015's captures can start; the skill half
  can't (FR-059).
- **Usage limits stall the eval gates** (seven stalls in parallel run 3). One set at a time.

## Open questions for the builder (PQ)

Each changes something in the tasks; each has a recommendation. Details in research.

- **PQ-1: The answer turn has no prose; its words are only `give_answer`'s fields** (R2). The panel draws
  them; the evals read them from the call. **Recommended: yes.** Otherwise the panel either shows the
  answer twice or has to tell which prose is which, which is parsing.
- **PQ-2: Until phase 3, only skills with a hand-in (pivot and null) can be offered** (R13). The spec puts
  the other four's hand-in in phase 3 (US6 rule 6). An answer whose steps are tagged *Speed graph* before
  then has the tag but no offer. **Recommended: keep the spec's order**, with the server gate; SC-013 needs
  two skills, and pivot and null are them. If session 1 finds the missing offer gets in the way, pull
  T073 (hand-in for the four) into phase 2.
- **PQ-3: The six result lines and the return divider** (FR-051; [contracts/panel-ask.md](contracts/panel-ask.md)
  › Result lines). **Recommended: accept the table** as the build's copy; the ui-designer may revise it
  before T056 is built.
- **PQ-4: A how-to with no comp target can't offer its lesson as data** (conflict: FR-019 wants an offer;
  FR-016 says offered skills are among the steps' skills, and a how-to has none). **Recommended: amend
  FR-016 so a `howto` answer may carry one offered skill with no steps**; its go-deeper hands over with no
  layer, and the lesson opens as it would from Skills.
- **PQ-5: A step with no tag** (conflict: TD § 16 step 4, "Play it back and watch the turn.", has no tag;
  FR-006 says every step has a skill tag or "not taught yet"). **Recommended: amend FR-006 to allow an
  untagged step that only plays back or looks** (`skill: null`), drawn with no tag; a step that changes
  something still needs a tag or "not taught yet".

## Complexity Tracking

No constitution violations to justify.
