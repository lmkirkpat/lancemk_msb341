# Research: Easing Test Slice

**Date**: 2026-09-30 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

Sources checked: the installed upstream bridge (`~/after-effects-mcp`, LiamcKerr/after-effects-mcp
v1.1.0 at commit `2cfff1a`), `specs/001-ae-mcp-bridge-test/spec.md`, `decisions/003`, and the
local toolchain (Node 26.8.1, Claude Code 2.1.285).

## R1. Where the fork lives, and how it coexists with the upstream bridge

- **Decision:** copy the upstream CEP panel and install scripts into `bridge/` in this repo, with
  its own bundle ID (`com.aementor.bridge`), config folder
  (`~/Library/Application Support/AEMentorBridge/`), and default port. Keep upstream's MIT
  `LICENSE` and record the source commit in `bridge/UPSTREAM.md`.
- **Rationale:** the upstream bridge (`com.bitloop.claudebridge`) is installed and useful for
  dev work, such as creating a practice comp (R8). Separate IDs let both panels run in AE side
  by side, so installing the fork doesn't break the dev tool. Keeping it in this repo puts the
  spec, code, and evals in one place, which suits a solo builder.
- **Alternatives considered:** replace the upstream install (simpler, but loses `ae_run_script`
  for dev chores); a separate repo for the fork (cleaner for open-sourcing later, but splits
  one small project across two repos).

## R2. What goes in code vs. what Claude decides

- **Decision:** everything with a right answer is **deterministic code in the MCP server**:
  finding linear keyframe pairs, comparing snapshots, attributing the demo, and enforcing the
  one-demo rule. **Claude decides only the teaching:** what to say, in what order, when to
  hint, and whether to review or advance.
- **Rationale:** SC-001 (100% detection) and SC-003 (check agrees with manual inspection 9 of
  10 times) need repeatable answers that unit tests can prove. If Claude did the analysis from
  raw keyframe dumps, a correct check would depend on the model's attention on that turn. It
  also shrinks what the evals have to judge: correctness comes from unit tests, and the evals
  focus on teaching quality (constitution Principle III).
- **Alternatives considered:** return raw keyframe data and let Claude analyze it (fewer tools,
  but untestable and wordier); put analysis in ExtendScript inside AE (breaks the thin-pipe
  rule of `decisions/003`, and ES3 is hard to test).

## R3. FR-006 and FR-013 are enforced by the server, not the prompt

- **Decision:** the `set_ease` tool only accepts the **first flagged pair on a flagged
  property**, works **once per lesson**, and returns an error otherwise. The mentor has no
  tool that runs arbitrary ExtendScript; the server sends only fixed snippets from
  `mentor/jsx/`.
- **Rationale:** a prompt can be talked out of a rule ("just do all of them"), and a tool
  can't. It turns "tutor, not assistant" into a guarantee and makes SC-004 (zero unrequested
  changes) testable.
- **Note:** the CEP panel still evaluates whatever code the server sends, protected by the
  localhost token. Limiting the panel to named snippets is possible hardening for later, but
  it would move snippet knowledge into the AE side, so it's deferred.

## R4. Session state must survive restarts

- **Decision:** the lesson's baseline snapshot and demo record are written to
  `session.json` in the mentor's data folder, not held only in memory.
- **Rationale:** the MCP server process lives only as long as the Claude session. In real use,
  the learner may restart Claude Code between "try it" and "I'm done", and in evals each
  `claude -p` turn starts a **new** server process (R6). A check with no saved baseline would
  have nothing to compare against.
- **Alternatives considered:** in-memory state (breaks both cases); storing state in the AE
  project (writes to the user's file, which violates the thin-pipe rule).

## R5. Learner record format and location

- **Decision:** one JSON file, `learner.json`, in `~/Library/Application Support/AEMentor/`,
  overridable with the `AE_MENTOR_HOME` environment variable (used by evals and tests). Every
  entry has plain-language `summary` and `next` fields, so it reads without tools (FR-012,
  scenario 2.4).
- **Rationale:** JSON is reliable to read and write from code, and a person can still open
  and edit it. The override keeps eval runs from touching the real record.
- **Alternatives considered:** Markdown with front matter (nicer to read, but fragile to
  parse and update); SQLite (not readable without tools, and a dependency); a file in the repo
  (would mix personal learning data into the repo and risks Principle IV in usability tests).

## R6. How evals run without After Effects

- **Decision:** the eval runner (`product/evals/easing/run.mjs`) drives **headless Claude Code**
  (`claude -p`) with the mentor skill and the mentor MCP server in **fixture mode**
  (`AE_MENTOR_FIXTURE_STATE` points at a file that says which saved snapshot is "the project"
  right now). Multi-turn cases use `--resume <session_id>`, and the runner swaps the current
  fixture between turns (for example, from "before" to "after my attempt"). Scoring has two
  parts:
  1. **Deterministic checks** from the server's tool-call log: `set_ease` called at most once,
     a snapshot taken before any claim about the project, the check verdict matches the
     fixture, no project claims when the bridge is "down".
  2. **A rubric judge**: a second `claude -p` call grades the transcript against
     `rubric.md` (leads, makes the learner do the work, names real layers, uses memory) and
     returns JSON pass/fail with reasons.
- **Rationale:** no new dependencies and no API key, since it uses the Claude Code sign-in
  already on this machine (Principle V). It also tests the mentor the way it's really used,
  through the same skill and tools.
- **Alternatives considered:** the Anthropic SDK with a custom agent loop and mocked tools
  (more control and cheaper per case, but it adds a dependency and an API key, and
  reimplements what Claude Code already does; revisit when evals need to run in CI); manual
  review only (fails Principle III).
- **Known limits:** runs aren't deterministic, so a case can flip between runs. The runner
  supports `--repeat N` to count passes over several runs. Each case costs real usage.
- **Keeping usage down without losing rigor:**
  1. **Correctness lives in unit tests, not evals.** Detection and grading are proven by
     `node:test` against the answer key (free, instant), so no eval case exists only to
     check a count. Evals cover teaching behavior.
  2. **Skip the judge when a case already failed.** If a deterministic check fails (for
     example, `set_ease` called twice), the case fails with that reason and the judge call is
     skipped. `--judge-always` overrides this when the teaching feedback is wanted.
  3. **Run only what changed during development.** Each result records a hash of the skill,
     the server's tool code, the case, and its fixtures. `--changed` re-runs only cases whose
     hash differs from the last passing run. A **full run** is required before committing
     changes to the skill or tools, and for any result reported against SC-006.
  4. **`--only <case id or FR>`** runs a subset while iterating on one behavior.
  5. **Bounded turns:** each `claude -p` turn uses `--max-turns` so a confused run can't loop.
  6. **Not done:** a cheaper judge model. Judging teaching quality is the part most likely to
     degrade, so the judge stays on the same model as the mentor unless a calibration check
     (judge verdicts vs. my own on 10 transcripts) shows a cheaper one agrees.

  A full run stays at about 25–40 calls. A typical development run (`--changed` or `--only`)
  is about 3–8.

## R7. Detection and check rules (ExtendScript facts)

- **Decision:** work in **segments** (a keyframe pair: key *i* → key *i+1* on one property):
  - A segment is **linear** if `keyOutInterpolationType(i)` or `keyInInterpolationType(i+1)` is
    `KeyframeInterpolationType.LINEAR`.
  - A segment is **eased** if neither side is LINEAR, and **held** if key *i* out is HOLD.
  - Skip properties with fewer than 2 keys, properties where `expressionEnabled` is true, and
    held segments (spec edge cases).
  - **Walk every property recursively** (transform, contents of shape layers, effects, text
    animators), reading only properties where `canVaryOverTime` and `numKeys > 0`. With
    separated dimensions, AE puts the keys on X/Y Position, not Position.
  - Record each layer's `enabled` flag, and list precomp layers (`source instanceof CompItem`)
    without reading inside them.
  - **Demo target:** the first linear pair, in layer order, on a visible, non-null layer
    within the lesson's focus. The one-pair demo is only useful if the learner can see it,
    so a null (CTRL) or a hidden layer never gets it.
  - The demo applies Easy Ease (speed 0, influence 33.33%) to key *i* out and key *i+1* in,
    using `setInterpolationTypeAtKey` and `setTemporalEaseAtKey`. It keeps the other side of
    each key as it was, and uses one `KeyframeEase` per temporal dimension
    (1 for Position/Opacity/Rotation; **3 for Scale even on a 2D layer**, checked live on 2026-09-30).
    Always ask AE (`keyInTemporalEase(1).length`) rather than assuming a count.
- **Rationale:** the spec talks about "keyframe pairs", and the demo covers one pair. Linear
  is a property of the segment between two keys, so flagging segments matches both the spec
  and how AE draws motion. Spec 001 rows 4, 5, and 11 confirmed these calls work.
- **Also from spec 001, row 11:** AE showed the undo under a different label than the one the
  bridge set. The mentor tells learners to use **Edit > Undo** and never names the undo label.

## R8. The practice comp: a realistic lower third with built-in traps

Spec 001 row 4 found every key in the test file already has Easy Ease, so the mentor would have
nothing to teach there. That comp stays as-is and becomes the **"nothing to ease"** case. For
everything else, a new comp tests the mentor's limits.

- **Decision:** build **"Mentor Practice"** (1920×1080, 30 fps, 8 s), a lower-third title
  animation like real in-house work. It's generated by `mentor/dev/build-practice-comp.jsx`,
  run once through the upstream bridge's `ae_run_script` (a dev chore, not a product feature),
  and saved into `discovery/Claude AE Tutor Test.aep`. The same script writes a hand-checked
  **answer key**, `mentor/test/fixtures/practice-expected.json`, listing every segment's
  expected state. SC-001 is scored against it.

| # | Layer | Animated property (keys) | Expected | What it tests |
|---|---|---|---|---|
| 1 | Title (text) | Position (3, linear) | 2 linear | Basic case; **demo target** (Title › Position, first pair) |
| | | Scale on a 2D layer (2, linear) | 1 linear | Multi-dimension ease: AE reports 3 dimensions here, and a wrong count throws |
| | | Opacity (2, linear) | 1 linear | |
| 2 | Subtitle (text) | Position (2, already Easy Ease) | 1 eased | No false flag on correct work |
| | | Opacity (2: key 1 out Bezier, key 2 in linear) | 1 linear | Half-eased pair: either side linear counts as linear |
| 3 | CTRL (null, parent of 1–2) | Position (2, linear) | 1 linear | Invisible layer that still drives motion; parenting |
| 4 | Bar (shape) | Contents › Rectangle › Trim Paths › End (2, linear) | 1 linear | Deeply nested property path |
| | | X Position (3, linear), separated dimensions | 2 linear | Position split into X/Y; code can't assume `Transform/Position` |
| 5 | Glow (adjustment) | Effects › Gaussian Blur › Blurriness (2, linear) | 1 linear | Animated effect parameter |
| 6 | Cursor (text) | Opacity (6, hold) | 5 held | Blinking cursor: held is not a mistake |
| 7 | Logo (shape) | Rotation (2 keys + expression `time*30`) | skipped: expression | Expression overrides keys |
| | | Scale (1 key) | skipped: single key | Nothing to interpolate |
| 8 | Old Take (text, **hidden**) | Position (2, linear) | 1 linear, layer hidden | Limit: should it teach on a layer you can't see? |
| 9 | Icon (**precomp** layer; inside, a shape with 2 linear Position keys) | none on the layer | listed as precomp, not analyzed | Limit: the mentor can't see inside precomps in this slice and should say so |
| 10 | Background (solid) | none | ignored | Unanimated layers don't clutter findings |

**Totals:** 11 linear segments (10 on visible layers), 1 eased, 5 held, 2 skipped, 1 precomp noted.

- **Why this shape:**
  - **Every trap maps to a specific way detection could go wrong.** Separated dimensions, a
    nested shape property, an effect parameter, a multi-dimension ease, a half-eased pair,
    holds, an expression, and a single key. Any of these would break code that only checks
    `Transform/Position`.
  - **Ten targets is too many for one lesson on purpose.** It tests whether the mentor
    **picks a focus** (for example, Title first) instead of reading out a list. That's a
    teaching limit the simple comp couldn't expose. `snapshot_project` takes an optional
    `focus_layers` so the mentor chooses the scope and code still grades it (see the
    contract).
  - **The hidden layer and the precomp test honesty about limits,** not only detection: the
    mentor should say what it can't or won't check.
- **Alternatives considered:**
  - The simple two-layer comp from the first draft of this plan: too easy, and doesn't
    exercise traversal or focus.
  - Asking the learner to build their own animation first: a good lesson later, but not a
    controlled test.
  - A separate `.aep`: splits the test assets.
  - Reading inside precomps now: real projects nest a lot, but it adds recursion and "which
    comp is the lesson in" questions. Deferred to a later slice, and the precomp layer
    documents the gap.

## R9. Where the teaching behavior lives

- **Decision:** a Claude Code skill, `.claude/skills/ease-mentor/SKILL.md`, invoked as
  `/ease-mentor`. The MCP server's `instructions` field repeats the hard rules (Edit > Undo,
  one demo, don't guess when AE is unreachable) for clients without the skill.
- **Rationale:** a skill is a readable, versioned prompt in the repo, and the eval runner can
  load it the same way a person does. Out of scope per the spec: an interface beyond Claude
  Code. MCP "prompts" would work in Claude Desktop, and can come later.

## R10. Language, testing, performance

- **Decision:** plain JavaScript ES modules on Node 18+ (dev machine has 26.8.1), no npm
  dependencies, the same as upstream. Unit tests with the built-in `node:test`. ExtendScript
  snippets in ES3.
- **Rationale:** matches the forked code, and adding TypeScript or a test framework would
  mean adding dependencies (Principle V) for about 1,500 lines of code.
- **Performance targets:** a snapshot of a comp with up to 50 layers returns in under 2 s,
  and a check in under 5 s, so a lesson turn never feels stalled (SC-002: full lesson in
  15 minutes or less).
