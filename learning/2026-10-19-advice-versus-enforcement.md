# Learning log: Advice Versus Enforcement

**Section:** [Advice Versus Enforcement](https://byu-strategy.github.io/product-management/02-directing-the-agent.html#advice-versus-enforcement)
**Date:** 2026-10-19
**Time:** 2026-10-19 22:03 to 2026-10-20 12:52 (one session over two days with a break; active time not measured)
**Finished:** yes
**Axis:** Agentic Workflow
**Starting point:** Proficient (shown: Proficient)

This log is a record of learning, not a score. Taken together with
[Blast Radius](2026-10-19-blast-radius.md) in one session, to prepare for sprint 3's parallel agents.

## What I asked about

- Chose this section and Blast Radius over Delegation and Parallel Work, as what I still need before running agents unattended in sprint 3.
- Otherwise followed the default path.

## In my own words

> A CLAUDE.md rule will be weighed against the prompt instructions from the user. If the user asks for a push, even with a CLAUDE.md rule, the model may still push. To make sure it doesn't push, you have to add a permissions rule that runs as a PreToolUse hook

Correction given: a permission rule and a PreToolUse hook are two separate mechanisms (a settings line vs. your own script); either can stop a plain `git push`.

## Misconceptions

- A hook on `Edit|Write` covers every way of editing a file (missed that Bash `sed -i` gets past the matcher): resolved after one hint
- `exit 1` in a Claude Code hook blocks the action (it fails open; only `exit 2` blocks): resolved, tested with a crashed-hook case and `onFailure: block`
- A permission rule "runs as" a PreToolUse hook: corrected at the end, not retested

## Check

2/2 (Strong), of which 1 from the practice form. Know it 1/1, Use it 0/0, Predict it 1/1.
Missed: none. (Combined check with Blast Radius: 4/4. With this few questions the band is a rough guide.)

## Confidence

Proficient to Strong ("mostly just details I'm still getting familiar with")

## Pictures

None.

## Still wondering

Nothing specific: "mostly just details I'm still getting familiar with"
