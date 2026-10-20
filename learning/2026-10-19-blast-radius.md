# Learning log: Blast Radius

**Section:** [Blast Radius](https://byu-strategy.github.io/product-management/02-directing-the-agent.html#blast-radius)
**Date:** 2026-10-19
**Time:** 2026-10-19 22:03 to 2026-10-20 12:52 (one session over two days with a break; active time not measured)
**Finished:** yes
**Axis:** Agentic Workflow
**Starting point:** Developing (shown: Developing)

This log is a record of learning, not a score. Taken together with
[Advice Versus Enforcement](2026-10-19-advice-versus-enforcement.md) in one session, to prepare
for sprint 3's parallel agents.

## What I asked about

- Chose this section and Advice Versus Enforcement as what I still need before running agents unattended in sprint 3.
- Otherwise followed the default path.

## In my own words

> A CLAUDE.md rule will be weighed against the prompt instructions from the user. If the user asks for a push, even with a CLAUDE.md rule, the model may still push. To make sure it doesn't push, you have to add a permissions rule that runs as a PreToolUse hook

(One retrieval answer covered both sections: an unattended push is a group 3 action.)

## Misconceptions

- `/rewind` undoes everything local and uncommitted, including `rm -rf` (it only restores Edit-tool changes): resolved
- Without a commit, an Edit + `mv` rename can still be fully undone with git or `/rewind` (git only restores the last commit's version; `/rewind` skips `mv`): resolved by explanation, not retested
- A CLAUDE.md "never push without asking" holds for an unattended agent in Auto mode (it is weighed against the task, and Auto's classifier allows pushes to the working repo): resolved, tested with the `npm run release` wrapper case

## Check

2/2 (Strong), of which 1 from the practice form. Know it 0/0, Use it 1/1, Predict it 1/1.
Missed: none. (Combined check with Advice Versus Enforcement: 4/4. With this few questions the band is a rough guide.)

## Confidence

Proficient to Strong ("mostly just details I'm still getting familiar with")

## Pictures

None.

## Still wondering

Nothing specific: "mostly just details I'm still getting familiar with"
