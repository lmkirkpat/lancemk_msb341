# Decision 003: Thin After Effects bridge, with the mentor as an MCP server run from Claude

**Date:** 2026-09-29
**Status:** Accepted, 2026-09-29. Covers the Sprint 2 test slice and the prototype. Revisit
after the AE UXP beta (Nov 2026).

## Context

Decision 002 chose the AI creative mentor and left the architecture open until the bridge
was tested. Spec 001 and `discovery/ae-bridge-findings.md` settled what the bridge can do:

- **Access works.** All 11 reads in spec 001 worked through the community CEP bridge,
  including temporal ease. Deep reads need custom ExtendScript.
- **Something has to run on the user's Mac, inside AE.** A hosted web app can't reach AE
  directly. There are no pushed events, so change detection means taking a snapshot and
  comparing.
- **The container is changing.** Adobe is retiring CEP
  ([Adobe developer blog, Sept 2026][uxp-post]). In AE, UXP reaches public beta in Nov 2026.
  CEP is turned off by default in Dec 2028 and removed in Dec 2029. ExtendScript is not
  affected. At Adobe Developers Live (2026-09-29), Adobe repeated that each flagship app gets
  at least two years from its UXP public beta before CEP is removed. The UXP Hub
  ([announcement][uxp-hub]) doesn't list After Effects as a host yet. Nothing I found from
  today says whether an AE UXP plugin can call ExtendScript or run a local server.
- **Adobe's official MCP connector doesn't cover After Effects.** "Adobe for Creativity"
  (GA in Claude since 2026-04-28) covers Photoshop, Lightroom, Illustrator, Firefly, Premiere,
  Express, InDesign, and Stock at the Express/Firefly level, working on cloud assets rather
  than local desktop projects ([Adobe blog][adobe-claude], [overview][adobe-mcp]). For now, reading a live AE project
  still needs our own bridge.

What's left to decide is where the teaching interface and the AI live, and how much to build
before the slice tests whether leading, memory, and practice beat Adobe's assistant.

## Options considered

1. **Thin AE bridge + mentor as an MCP server, run from Claude (Code or Desktop).** Fork the
   CEP bridge. Replace `ae_run_script` with a few narrow tools (`snapshot_project`,
   `diff_since_last`, `preview_frame`, `set_ease`). The mentor's teaching behavior lives in a
   prompt/skill, and the learner record lives in local files the MCP server reads and writes.
   Pros: the fastest way to a working slice. Almost everything built (narrow tools, learner
   record, teaching prompt, evals) carries into any later option. The AE piece stays a pipe,
   so moving it to UXP is a contained job. Cons: the interface is a chat window outside AE, so
   "showing, not telling" is limited to preview frames and annotated screenshots. Real users
   won't install Claude Code plus a developer bridge, so this isn't what ships.
2. **Local companion app (desktop or localhost web UI) with its own agent loop on the Claude
   API.** Pros: full control of the interface (highlights, clips, a progress view) and of
   memory. Cons: weeks of building the interface and agent loop before learning whether the
   teaching is any good. Still needs the same AE bridge underneath.
3. **Everything inside an AE panel (CEP now, UXP later).** Pros: lives where the user works,
   the closest thing to Adobe's assistant, and UXP brings marketplace installs. Cons: a CEP
   panel would be rewritten for UXP within two years. A UXP panel can't be built until the
   Nov 2026 beta, and even then we don't know whether it can reach ExtendScript or hold the
   connection. It also ties the product to one app, which works against decision 002's
   design across apps.
4. **Hosted web app.** Rejected: it can't reach AE without a local piece anyway (findings
   note), so it's option 2 plus a server.

## Decision

**Option 1 for the Sprint 2 slice and the prototype.** Three layers, kept separate so each can
be replaced on its own:

| Layer | Now | Later |
|---|---|---|
| **AE pipe** | Forked CEP bridge: tokenized localhost connection plus ExtendScript snippets. No teaching logic. | UXP plugin after the beta, if it can reach ExtendScript (or equivalent) and hold a connection |
| **Mentor tools (MCP server, Node)** | Narrow tools: `snapshot_project`, `diff_since_last`, `preview_frame`, `set_ease`, plus reading and writing the learner record | Same tools; other apps (Resolve, Blender) added as more pipes behind them |
| **Teaching (AI + interface)** | Claude Code / Claude Desktop, driven by a mentor prompt/skill. Learner record as local JSON/Markdown | A companion app or in-app panel (option 2 or 3), if the slice shows the teaching is worth it |

**Amended 2026-10-05 by `decisions/005`:** the interface moves into a CEP panel in AE that drives
headless Claude Code (same skill, MCP server and learner record). The AE pipe and mentor tools
rows are unchanged.

**The deciding reason:** the biggest open risk is whether the teaching is worth more than
Adobe's assistant, not whether we can build an interface. Option 1 reaches that test fastest,
and almost everything it builds survives whichever interface wins later.

## What would change our mind

- **UXP beta (Nov 2026):** if an AE UXP plugin can't call ExtendScript and the native API
  can't read temporal ease, tangents, expressions, and effect parameters, rethink the AE pipe
  (re-run the spec 001 table first). If UXP can host a capable panel with marketplace
  installs, move option 3 up.
- **Using the slice:** if chat outside AE makes the teaching feel worse than Adobe's
  in-app assistant (I keep switching back, or the lack of on-screen showing is what kills
  it), build the interface next (option 2 or 3) before adding more skills.
- **Adobe:** if Adobe for Creativity or another official MCP adds After Effects with
  project-level reads, use it instead of our own pipe.

[uxp-post]: https://blog.developer.adobe.com/en/publish/2026/09/investing-in-the-future-of-creative-cloud-extensibility-uxp-comes-to-our-flagship-applications
[uxp-hub]: https://blog.developer.adobe.com/en/publish/2026/09/introducing-the-uxp-hub
[adobe-claude]: https://blog.adobe.com/en/publish/2026/09/24/adobe-comes-to-gemini-expands-what-you-can-do-in-claude
[adobe-mcp]: https://www.usecarly.com/blog/adobe-mcp/
