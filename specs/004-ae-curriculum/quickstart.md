# Quickstart: validating spec 004's shared pieces (wave A)

How to prove wave A's shared branch works before the three skill builders start. Skill lessons
themselves are validated in specs 008 to 010's quickstarts. Shapes and rules are in
[data-model.md](data-model.md) and [contracts/](contracts/); this file only says what to run and
what to expect.

## Prerequisites

- The shared-code owner's branch checked out (or merged), Node 18+.
- For sections 2 and 3: After Effects 26.5 on macOS 27.0.1 with `discovery/Claude AE Tutor
  Test.aep` open, the AE Mentor Bridge running, and **nobody else holding the AE lock**
  (`decisions/008`; the cockpit stays off AE).

## 1. Unit tests (no AE)

```bash
cd mentor && npm test
```

Expect every test to pass, including the existing easing ones unchanged, and these new files:
`path.test.mjs` (path data matches `curriculum.md` › 4 and › 10), `reviews.test.mjs` (FR-019's
schedule), `recommend.test.mjs` (at least 12 record states, SC-005), `timing.test.mjs` (FR-016's
rows), `host.test.mjs` (R0, FR-011), `session-skills.test.mjs` (per-skill lessons, review mode),
`learner-store-v1.test.mjs` (old records read; new fields stored), `fixture-plugins.test.mjs`,
`skill-module.test.mjs` (a sample skill added as files only), `analyze-unchanged.test.mjs`
(SC-004), `recommend-tool.test.mjs` and `record-tool.test.mjs` (the tools in fixture mode).

Then the hook tests, to be sure nothing under `.claude/hooks/` was touched:

```bash
node --test .claude/hooks/test/*.test.mjs
```

## 2. R0 live check (🖐, AE open)

```bash
node mentor/dev/capture.mjs /tmp/host-check.json
```

Expect `host.ae_version` to start with `26.5` and `host.os` to name macOS 27.0.1 and nothing else
(no user or machine name). Write down whether the version string shows anything that marks a beta
build (FR-030, skill 5): this decides whether `host.beta` can ever be set. Then:

```bash
node mentor/dev/capture.mjs --compare mentor/test/fixtures/practice-before.json
```

With Mentor Practice active, write down what it reports (T042, decided 2026-10-21). The live comp
has changed since `practice-before.json` was captured (lessons eased properties and added keys), so
"Matches" isn't required: the list of differences is the result, and `practice-before.json` stays
the answer key for the comp as built. The `host` field must not appear among the differences.

## 3. The second practice comp (🖐, AE open)

1. `node mentor/dev/assemble.mjs build-practice-comp-2`, paste into the upstream bridge's
   `ae_run_script` (dev chore, as in spec 002 T012). Expect "Mentor Practice 2" in the project and
   `mentor/test/fixtures/practice2-expected.json` written.
2. Save the `.aep`. Check that **Mentor Practice** is untouched:
   `node mentor/dev/capture.mjs --compare mentor/test/fixtures/practice-before.json` with Mentor
   Practice active reports the same differences as step 2, and nothing new.
3. With Mentor Practice 2 active, capture `mentor/test/fixtures/practice2-before.json`.
4. Duplicate Mentor Practice 2, set the duplicate to 60 fps (Composition Settings), capture it as
   `mentor/test/fixtures/practice2-60fps.json`, then delete the duplicate and save.
5. Re-run `npm test`: the timing answer-key tests on both captures pass.

## 4. Easing still holds (FR-035, SC-003, SC-004)

- `mentor/test/analyze-unchanged.test.mjs` (in section 1) compares the Mentor Practice findings with the copy saved
  before the branch. Expect identical (SC-004).
- **Eval engineer:** run `node product/evals/easing/run.mjs` on the merged branch. Expect 25/25 or
  24/25 with no hard-rule failure. Log it with the merge.

## 5. Recommendation, live once (🖐, AE open, Claude Code)

With a test learner home (`AE_MENTOR_HOME` pointing at a temp folder) holding a record where easing
is learned, start Claude Code in the repo and type `/next-mentor`. Expect, in at most two sentences
and with no IDs or field names, an offer of the first built skill the path allows (before skills
2, 1, 3 are merged: "nothing new is ready yet"; after: the one FR-004 picks), and why. Then ask
for a skill that isn't built: it says so and doesn't start it.

## 6. Add-only check, before the parallel builders start

The cockpit, after merging the shared branch:

```bash
node .claude/hooks/check-branch.mjs <a sample skill branch> skill-builder
```

on a throwaway branch that adds `mentor/tools/sample.mjs`, `mentor/lib/sample.mjs` and a test
(from `skill-module.test.mjs`'s sample) and changes nothing else. Expect "All N files are
skill-builder's" and no shared-file lines. Delete the branch.
