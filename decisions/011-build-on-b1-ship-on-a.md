# Decision 011: Build new features and skills on B1; finalize, user test and ship on A

**Date:** 2026-11-04
**Status:** Active. Refines `decisions/009` (A is still what ships; this says where development
happens). Changes spec 013's FR-035, FR-037 and SC-003 (spec › Amendments 2026-11-04).

## Context

Spec 013 assumed A would replace B1 as the default everywhere once A passed its evals. Every eval
run and test lesson would then spend API credit. The budget for now is a $100 credit, and one
six-set eval round has cost about $180 to $224 with its repeats (pacing and overlap rounds, part of
that the judge's share on the subscription). B1 runs on the builder's subscription, so it costs no
credit.

The same skills and `ae-mentor` tools run on both runtimes, and the panel reads the same events from
either adapter, so most work moves across without a rebuild. The two aren't equally permissive,
though (below).

## Options considered

1. **Build on B1, finalize and ship on A, with paid checkpoints on A.**
   - Pros: development spends no credit; credit goes to proving what's about to ship, not to
     versions that will change.
   - Cons: B1 passing doesn't prove A passes, so problems can surface late; two adapters to keep up;
     B1 evals still use subscription limits (seven usage-limit stalls in parallel run 3).
2. **Develop on A once it passes (spec 013 as written).**
   - Pros: tests exactly what ships, with one runtime to maintain.
   - Cons: every eval run spends credit, and $100 wouldn't survive one full round.
3. **Stay on B1 until the first release, with no A proof now.**
   - Pros: cheapest for now.
   - Cons: A's teaching quality and cost per lesson would stay unknown until a release depends on
     them. Rejected.

## Decision

Option 1. **Deciding reason: development and testing shouldn't spend API credit.**

### The rule

- **Build on B1:** new skills, tools, teaching changes and panel features, with eval runs on B1.
- **Finalize, user test and ship on A:** the last check before a tester sees anything, every tester
  lesson, and every release.
- **Runtime work is the exception:** the helper, caching, keys and A's errors only exist on A. Use
  the fake service first, then the fewest real calls that answer the question.
- **B1 is never shipped.** It stays builder-only, as `decisions/005` and `009` say.

### Moving work from B1 to A

1. **Free check** (`product/evals/lib/ready-for-a.mjs`, spec 013 T067): the skill's name and
   `allowed-tools` are valid, every tool the skill names is one it's allowed, and the runner agrees.
2. **Free dry run:** `--runtime a --dry-run` on the set.
3. **Paid eval run on A:** the set, against its B1 baseline (FR-033's bar).
4. **Live lesson on A,** switching with `bash panel/install.sh --runtime a` (spec 013 T066).
5. **Tester.**

### Where the two runtimes differ

| | B1 | A | Handled by |
|---|---|---|---|
| Tools in a lesson | Panel: easing's six, hard-coded. Runners: a hand-written list per set | Exactly the active skill's `allowed-tools`; others get an error result | T064, T065: B1 reads the same `allowed-tools` |
| Hand-over between skills | Not verified on B1 (`--tools ToolSearch` leaves out `Skill`) | `Skill` tool, or a typed command | T065 finds out and records it; hand-overs are tested on A until then |
| Skill names | Any skill in the runtime folder | `*-mentor` only | T067 |
| Model and effort | Claude Code's; `medium` is inferred, not set | `panel/helper/settings.json` | Checked at each A eval run (FR-033 compares like with like) |
| Cost, cache, latency | Not comparable | Measured | A checkpoints only |
| Keys and service errors | Claude Code's sign-in | Keychain, A's error kinds | Fake service, A only |

### When A gets paid for

- Easing and pivot, now, to prove the runtime.
- Before the first tester: all six sets.
- At each later release: only the sets whose skill, tools, helper or settings changed since their last
  A result on that basis (spec 006 FR-025, amended 2026-11-04). Other sets reuse that result.

## What would change our mind

- If a case that passes on B1 fails on A by majority, for a reason the free checks couldn't catch,
  at two checkpoints in a row, then run that kind of change on A earlier in its build.
- If a set's A score is more than 5 points below its B1 score at a checkpoint and triage can't
  explain it, then stop treating B1 results as a guide for that set until it's understood.
- If subscription limits stall B1 eval runs for more than a day in a sprint, then compare that time
  against paying for A or a cheaper model on the affected sets.
- If funding makes credit no longer the limit, or T051 finds a cheaper model that meets FR-033 and
  brings a full round under about $30, then reconsider option 2 and retire B1.
  *2026-11-04 (T031, `product/evals/easing/results/2026-11-04-150619.json`):* easing on A cost $2.03 of
  credit on Opus 5.5, with no cheaper model, against the $15 estimate. At that per-turn rate all six sets
  project to about $18 to $25 (not measured). If pivot confirms the rate, this signal has fired in
  substance: reconsider where eval runs happen. The judge's share ($2.51) stays on the subscription.
- If a tester reports teaching that a reused A result says should pass, or the service changes a model
  in a way that moves results, then re-run all six on A before the next release.
- If Claude Code changes how headless runs or subscription use work so that B1 stops matching the
  panel's needs, then move development to A and re-budget.
