# Decision 009: Shipped Knack runs the model through the Claude API (option A)

**Date:** 2026-10-20
**Status:** Accepted, 2026-10-20. Amends `decisions/005` (B1 stays for the builder's own prototype
until A is built). Raised in `specs/006-installer/spec.md` › Open Questions 1.

## Context

`decisions/005` chose B1 (the panel drives headless Claude Code) for the Sprint 2 prototype, and
said shipping to other people needs option A (the panel calls the Claude API directly). Spec 006,
the installer, is the first work meant to put Knack on someone else's Mac, which is 005's "the
panel becomes the product" signal. The installer has to know which runtime it sets up: with B1 it
installs or checks Claude Code and a sign-in; with A it asks for an access key.

## Options considered

1. **A: the panel calls the Claude API directly** (005 › A). Pros: no Claude Code install or
   sign-in for the learner, the likelier path on UXP (plain HTTPS, no spawned processes), and the
   installer's runtime part is kept, not thrown away. Cons: the direct-API runtime isn't built, so
   spec 006 User Story 1 waits for its own build spec, and the evals must be retargeted at it.
2. **B1 tester build first** (at most 5 testers who already have Claude Code). Pros: a
   target-market learner on the panel sooner (belief 7). Cons: the installer installs or checks
   Claude Code (the most developer-shaped step), the claude.ai-login policy for shipped products is
   still unchecked, B1 probably has no future on UXP, and its runtime part is thrown away later.

## Decision

**A.** The deciding reason: B1 can't go to other people, and the installer exists to put Knack on
other people's Macs. Building the installer around B1 would make a step easier for a product that
can't ship that way. Agreed with spec 006's recommendation.

What follows:

- The direct-API runtime is its own build spec (number from the cockpit), an adapter behind the
  seam in `panel/lib/adapter-claude-code.js`, with the evals retargeted at it. Spec 006's parts that
  don't depend on it (Stories 2 to 4, the developer install in FR-024) can be planned first.
- Until A is built, the builder's own panel and the evals keep running on B1, unchanged.
- Spec 007's first-run sign-in screens (step 5) draw the access-key flow, not a Claude Code sign-in.
- Spec 006 Q2 to Q5 (where the key comes from, Developer ID, who the first release is for, the AE
  scripting preference) are still open.

Rejected: a B1 tester build first (above). A hosted backend stays rejected for the reasons in 005.

## What would change our mind

- **A slips past the first tester date:** if the direct-API runtime isn't working by the time a
  target-market tester is lined up, a B1 build for that one tester (who already has Claude Code) is
  cheaper than waiting. Log it as dated evidence here.
- **UXP beta (Nov 2026):** if AE UXP can't make network calls from the panel, A's loop moves to a
  local helper outside the panel (005 › UXP signal); that changes the installer, not this choice.
- **Evals on A fall below the B1 baseline** (25/25 on 2026-10-19) and the gap can't be closed with
  prompt or tool fixes: revisit before shipping.
- **Cost:** if measured cost per lesson on A is far above B1's ($0.38 per lesson, spec 003 T034),
  test Sonnet 5.5 against the evals before the first tester.
