# Decision 005: How the AE panel runs the mentor

**Date:** 2026-10-05
**Status:** Accepted, 2026-10-05 (option B1). Covers the Sprint 2 panel and the prototype.
Raised in `sprints/sprint-2-plan.md` › Raised goals. Amends `decisions/003` (Teaching row).

## Context

The raised Sprint 2 goal is a rudimentary panel inside After Effects that runs one easing lesson
from start to finish (quickstart steps a–f) with nothing typed in the Claude Code terminal, and
shows the learner's memory. Mockup: `product/mockups/ae-panel.md`.

Today the teaching runs in Claude Code (`decisions/003`, option 1): Claude reads
`.claude/skills/ease-mentor/SKILL.md` and calls the `ae-mentor` MCP server (`mentor/`), which talks
to AE through the forked CEP bridge (`bridge/`). The panel needs *something* to run the model. That
is the choice here. It changes the "Teaching (AI + interface)" row of decision 003's table, which
already named an in-app panel as the "later" option if the slice earned it.

Facts that shape the choice:

- **The CEP panel can run Node.** `bridge/cep/CSXS/manifest.xml` sets `--enable-nodejs` and
  `--mixed-context`, so a panel can spawn processes, read files and open network connections.
  Whether an AE **UXP** plugin can do any of that is unknown until the Nov 2026 beta.
- **The evals already drive headless Claude Code.** `product/evals/easing/run.mjs` spawns
  `claude -p ... --output-format json`. The baseline (14/16) and the fixed run (15/16) measure the
  skill *as it runs inside Claude Code*.
- **Real cost so far** (`discovery/usage-notes/easing-slice.md`): a full eval run of 16 cases cost
  $4.65–$4.92, about $0.30 per case including the judge. Single opening turns cost $0.12–$0.19. A
  full a–f lesson is several turns, so **estimate roughly $0.50–$1.50 per lesson** at current
  settings. That's an estimate, not a measurement. Measure it during the panel run.
- **API prices** (Anthropic, cached 2026-09-25, per million tokens in/out): Opus 5.5 $4 / $20,
  Sonnet 5.5 $2 / $10, Haiku 4.5 $1 / $5.
- **Much of the panel doesn't need the model at all.** In the mockup, the PATH row, the
  I do / We do / You do stepper, the MEMORY strip and the CHECK list are all *data*: they come
  from the learner record and from `diff_since_last`. Only the mentor's words (explanations, hints,
  answers to "Ask the mentor") need the model. This is true under every option below and makes
  each one smaller.

## Options considered

### A. The panel calls the Claude API directly

The panel's Node side runs its own agent loop with `@anthropic-ai/sdk` (the SDK's Tool Runner, or
a manual loop). The mentor tools are imported from `mentor/tools.mjs` as plain functions (no MCP
hop), and `SKILL.md` becomes the system prompt.

- **Pros**
  - **This is the version that could ship.** Real users won't install Claude Code
    (`decisions/003` › option 1 cons). This removes that dependency.
  - **Full control of the conversation.** The panel gets structured events directly (each tool
    call and result), so buttons, the check list and streaming text are simple to wire.
  - **Fast per turn.** There's no CLI process start-up, and prompt caching on the system prompt
    and tools keeps repeat turns cheap.
  - **Ports more easily.** It's plain JS plus HTTPS, so it's the likeliest to move to UXP if UXP
    allows network calls. It also suits decision 002's cross-app goal: the loop can later move
    into a local service that panels in several apps share.
- **Cons**
  - **More to build this week.** The agent loop, conversation state, streaming, error handling,
    and prompt caching are all new code, on top of the panel UI.
  - **An API key inside an AE extension.** It must live in the macOS Keychain or an env var,
    never in the repo or the extension folder. Any CEP extension with Node can read your files, so
    treat the key as exposed to anything else installed in AE.
  - **You pay per use, on API billing.** It's separate from any Claude subscription. Fine for one
    user. At scale it's a pricing question, and belief 12 says learners may not pay.
  - **The evals stop measuring what runs.** The skill was tuned inside Claude Code, which adds its
    own system prompt and harness. On the raw API, behavior can shift (tone, tool order, the
    one-demo rule). Re-running the evals means pointing `run.mjs` at the new loop, which is more
    work, or accepting that the evals and the panel differ.
  - **Model choice becomes yours.** Opus 5.5 is the default. Sonnet 5.5 is half the price. Either
    choice needs an eval run to confirm the teaching holds.

### B1. The panel drives headless Claude Code (chosen)

The panel spawns `claude -p` with `--output-format stream-json`, resumes the same session each
turn (`--resume <session id>`), and runs it in the repo, so it picks up `SKILL.md`, `.mcp.json`
and the `ae-mentor` server exactly as today. The panel renders the streamed text and reads tool
results (for example `diff_since_last`) out of the stream to fill the CHECK list. MEMORY and PATH
read the learner record files directly.

- **Pros**
  - **The least new code.** No agent loop, caching or conversation state to write. The panel is a
    UI plus a process runner. This is the only option that fits comfortably in a week alongside
    T033–T047.
  - **The evals stay valid.** The panel runs the same harness `run.mjs` already tests, so 15/16
    still describes what you're using. That keeps the sprint about *testing the teaching in AE*,
    which is the point of the raise.
  - **It runs on your existing Claude login.** That's fine for you as user #1 on your own machine.
  - **Matches the done criterion exactly:** "nothing typed in the terminal; Claude Code may be
    running in the background."
- **Cons**
  - **Prototype only, it can't ship.** Every user would need Claude Code installed and logged in.
    Also (verify in the Agent SDK docs before relying on this): Anthropic doesn't allow
    third-party products to offer claude.ai login or subscription limits to their users, so a
    shipped product needs API-key auth, which means option A eventually.
  - **Slower turns.** Each turn starts a CLI process and reconnects the MCP server: likely a few
    seconds before the first text. Fine for a lesson, worth noting in usage notes.
  - **Parsing the stream.** The panel depends on Claude Code's `stream-json` event format, which
    can change between versions. Keep the parsing in one small module.
  - **Probably no path to UXP.** It needs to spawn processes, which UXP may not allow. Expect to
    replace this layer, not port it.
  - **Two Node processes talk to the bridge.** The MCP server (spawned by Claude Code) and the
    panel both run in AE's world. Only the MCP server should call the bridge, and the panel should
    read results from the stream, so the bridge token and undo groups behave as they do today.

### B2. The panel as a remote control for an interactive Claude Code session

An interactive terminal session stays open, and the panel relays messages into it (for example
through an MCP tool that waits for panel input).

- **Rejected.** It's the most fragile of the three: two UIs share one conversation, the terminal
  has to stay focused and open, and there's no supported way to inject user turns from outside.
  It has all of B1's cons plus its own, and no pro B1 lacks.

### Not an option: a hosted backend

The model call could run on a server you host. It's rejected for now for the same reason as
decision 003 › option 4: it still needs the local pieces, and it adds hosting, accounts and a
privacy surface before the teaching is proven.

## Tradeoffs at a glance

| What to weigh | A. Direct API | B1. Headless Claude Code |
|---|---|---|
| Build time this sprint | High: loop, state, streaming, caching, plus UI | Low: UI plus process runner and stream parser |
| Reuses `SKILL.md`, MCP server, `.mcp.json` | Tools yes (as imports), skill rewritten as a system prompt | All of it, unchanged |
| Evals still describe what runs | No, unless `run.mjs` is retargeted | Yes |
| Auth | API key in Keychain or env, separate billing | Your Claude Code login |
| Cost visibility | Exact, per request (`usage`) | Reported per run (`total_cost_usd`), as in the evals |
| Turn latency | Low (one HTTPS call, streamed) | Higher (CLI and MCP start each turn) |
| Can it ship to other users | Yes, with key handling and a pricing answer | No |
| Path to UXP (Nov 2026) | Likely, if UXP allows network calls | Unlikely (spawns processes) |
| Fits decision 002 (across apps) | Yes: the loop can become a shared local service | Partly: tied to a repo and a CLI |
| Biggest risk | Behavior drift from the tuned skill, and the week runs out | Stream format changes, and turns feel slow in a panel |

## Questions to answer before choosing

1. **What is this panel for: learning or shipping?** If it's for learning whether the teaching
   works *in AE* (the sprint goal), B1 is enough. If it's the first piece of what users install,
   A is the real start.
2. **Will you pay API rates while testing?** At roughly $0.50–$1.50 a lesson (estimate), a week of
   your own use is a few dollars to a few tens of dollars. A needs an API key either way.
3. **How much does turn speed matter to you in the panel?** If a few seconds before the mentor
   starts talking breaks the feel you want, that points to A.
4. **Do you want the evals to keep meaning something this sprint?** B1 keeps them as they are. A
   needs work in `run.mjs` before the numbers apply again.

## Decision

**B1: the panel drives headless Claude Code, built so the runtime can be swapped.** Everything
that talks to the model sits behind one small adapter (send a message, get back a stream of text,
tool calls and tool results). The data-only parts (MEMORY, PATH, CHECK) read the learner record
and tool results, never model text. Only the `ae-mentor` MCP server calls the bridge. Moving to
option A later means replacing the adapter, not rebuilding the panel.

**Deciding reason:** the raised goal is to *test the teaching inside AE soon*. B1 gets there with
the least new code and keeps the eval numbers honest, while the adapter keeps A open as the ship
path.

**Rejected:** A for now (too much to build this week, and the evals would stop describing what
runs; it stays the likely ship path). B2 (fragile, no pro B1 lacks). A hosted backend (adds
hosting, accounts and a privacy surface before the teaching is proven).

**Still to check:** the claude.ai-login policy for shipped products (B1 › cons). It doesn't
affect this sprint, only when to move to A.

## What would change our mind

- **Turns are too slow:** if B1's start-up delay makes the panel feel broken in use (logged in
  usage notes), switch to A sooner.
- **The panel becomes the product:** once the panel test shows leading, memory and practice
  hold up in AE and the next step is other users, move to A and retarget the evals.
- **UXP beta (Nov 2026):** if AE UXP can't spawn processes, B1 has no future on UXP. If UXP can't
  make network calls either, the model loop moves to a local service outside the panel, under
  either option.
- **Claude Code changes `stream-json`** in a way that breaks the panel more than once: move to A.
- **Cost:** if measured cost per lesson is far above the estimate, test Sonnet 5.5 against the
  evals before going further.
