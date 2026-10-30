# Decision 010: Option A's agent loop runs in a local helper process that starts the mentor server

**Date:** 2026-10-30
**Status:** Active. Amends `decisions/005` › option A (how the tools are reached) and refines
`decisions/009`. Raised in `specs/013-api-runtime/spec.md` › Open Questions 1 and 3, approved with
the spec on 2026-10-30.

## Context

`decisions/009` chose option A (the panel calls the Claude API directly) for shipped Knack. Spec 013
builds it as a second adapter behind the seam in `panel/lib/adapter-claude-code.js`. `decisions/005`
sketched option A as an agent loop in the panel's Node side, with the mentor tools imported from
`mentor/` as plain functions (no MCP hop). Writing spec 013 showed that sketch skips parts of the
mentor that the evals measure: the server's start-up instructions, its call log and its error
wrapping (013 FR-004, FR-011). The evals also need to run exactly what the panel runs, without
faking the panel.

## Options considered

1. **A local Node helper process.** The A adapter starts a small Node process (on Knack's private
   Node, spec 006 FR-003). The helper runs the agent loop, sends the panel the adapter's existing
   events, and starts the `ae-mentor` server over stdio as `.mcp.json` describes.
   - Pros: same shape as B1 (the adapter starts a process and reads events), so the panel change is
     smallest; the eval runners start the same helper, so they test what the panel runs; the server
     is untouched (instructions, fixtures mode, call log); CEP's built-in Node version doesn't limit
     the loop; and it's already the local helper a UXP panel would need.
   - Cons: one more process to start, watch and ship (the installer carries it, spec 006).
2. **The loop inside the panel's Node, talking to the server over stdio.** Pros: one less process.
   Cons: tied to CEP's Node version and the panel page's lifetime; the evals would have to fake the
   panel to run it; it moves again on UXP.
3. **Import `mentor/tools/` directly (005's sketch).** Pros: no server process at all. Cons: bypasses
   the server's instructions, call log and error wrapping, so the six eval baselines would no
   longer describe what learners get.

Rejected outright: writing the loop against Node's built-in `https` only (013 Q3). It matches
`mentor/`'s built-ins-only rule but means hand-writing streaming, retries on rate limits and
overload, and typed errors, which are where 013 FR-022 and FR-027 are most likely to go wrong.
Not tested; rejected on build risk.

## Decision

**Option 1: a local helper process.** The deciding reason: the evals run the same helper the panel
runs, so the six 2026-10-29 baselines and spec 013's equivalence bar (FR-033) measure what learners
actually get.

With it, the builder approved (constitution V) **the official Anthropic Node SDK, version pinned**,
as the helper's one new dependency. `mentor/` (the `ae-mentor` server) stays Node built-ins only.

## What would change our mind

- **UXP (beta due Nov 2026):** if a UXP panel can't start or talk to a local process, the loop moves
  into the panel (option 2) on UXP, and the helper's code is reused there. If UXP can, nothing
  changes.
- **Start-up time:** if the helper plus server start adds more than 2 s to a lesson's first turn
  (measured against 013's latency criterion), try keeping the helper running between lessons
  before folding it into the panel.
- **The SDK:** if the pinned SDK blocks something 013 needs (a streaming or caching feature, or a
  size the installer can't carry), replace that part with built-in `https` and log it here.
- **Evals:** if A misses FR-033 and triage points at the MCP hop rather than the prompt or the model,
  test option 3 on easing before changing any skill.
