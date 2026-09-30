# After Effects MCP bridge: what we learned

**Date:** 2026-09-28
**Source:** `specs/001-ae-mcp-bridge-test.md` (results table), plus a read of the bridge's source
([LiamcKerr/after-effects-mcp](https://github.com/LiamcKerr/after-effects-mcp) v1.1.0, MIT).
Input to `decisions/003`.

## How it works

```
Claude Code ──MCP──▶ server.mjs ──HTTP (localhost:47670, token)──▶ Claude Bridge panel in AE ──evalScript──▶ ExtendScript
                     (Node, on the Mac)                            (host.js, hidden CEP extension)             (AE's script engine)
```

- Claude Code starts `server.mjs`, which turns each MCP tool call into an HTTP request.
- A hidden CEP panel inside AE listens on localhost only, checks a token from
  `~/Library/Application Support/ClaudeAEBridge/bridge.json`, and passes the code to
  ExtendScript through `evalScript`. The result comes back along the same path.
- Every built-in tool (`ae_comp_info` and the rest) is just a canned ExtendScript sent through
  that same path. `ae_run_script` is the general version: it runs any script.

## What it can and can't do

**Built-in tools** give a summary: status, item list, layer names and kinds, current transform
values, keyframe *counts*, and a frame preview as a PNG.

**`ae_run_script`** reaches whatever ExtendScript can, which is almost the whole project: keyframe
times and values, temporal ease (speed and influence), interpolation and spatial tangents,
effect parameters, expression text and errors, text styling, and writes (as one undo step).
Every deep read in the test went through this, and nothing used another mechanism.

**Real limits.** These come from ExtendScript and AE, not from the bridge:

- It sees the result, not what the user did. There's no event stream, so it can't see how or when
  the user changed something. Change detection means taking a snapshot and comparing.
- Nothing is pushed. AE never announces a change, so the mentor has to ask on request or poll.
- It can't see the UI. No open panels, Graph Editor view, or mouse, only selected layers, the
  playhead, and rendered frames.
- It's blocked while AE renders or shows a dialog, and a dialog opened by a script freezes AE.
- It only works on the same machine. Something has to run on the user's Mac; a hosted web
  app can't reach AE directly.

## Use it, or build our own?

**Use it as-is for prototyping, and copy it into our own code (fork) for the product.** Don't
write one from scratch.

- The install is built for developers: clone a repo, have Node 18+, run `install.sh` (which turns
  on unsigned-extension loading), restart AE, and register the MCP server. A designer won't
  do this, so the product needs a signed, one-click package.
- `ae_run_script` (run any code, including file writes) is too broad for a product. Replace it
  with a few narrow, tested tools, such as `snapshot_project`, `diff_since_last`, `set_ease`,
  and `preview_frame`, which the eval set can also test against.
- It's small (about 1,000 lines) and MIT licensed, so copying it is cheap. The piece worth keeping
  is the tokenized localhost connection into AE.
- Whatever the architecture, some piece has to run inside AE on the user's Mac. What's left to
  decide is where the teaching interface and the AI live.

## Node, in one paragraph

Node.js runs JavaScript as a normal program instead of inside a browser, so it can read files,
open network connections, and run servers. `server.mjs` and `doctor.mjs` are Node programs, and
CEP panels include their own copy of Chrome and Node, which is how the panel runs a server
inside AE. Most designers don't have Node installed, so a packaged product has to bundle it or
avoid needing it.

## CEP vs. UXP (checked 2026-09-28)

The bridge is a CEP extension. Adobe announced this month that CEP is being retired in favor of
UXP ([Adobe developer blog, Sept 2026](https://blog.developer.adobe.com/en/publish/2026/09/investing-in-the-future-of-creative-cloud-extensibility-uxp-comes-to-our-flagship-applications)).

**After Effects timeline:**

| When | What happens in AE |
|---|---|
| Now | CEP only. There is no UXP in AE yet, not even a beta. |
| Nov 2026 | UXP plugins reach public beta in AE. |
| Dec 2028 | Adobe stops accepting new CEP submissions for AE, and CEP is turned off by default. |
| Dec 2029 | CEP is removed from AE entirely. |

For comparison, Photoshop's CEP cutoff comes a year earlier (Dec 2027). InDesign has had UXP
since 2023. Premiere has UXP at GA, plus "hybrid" plugins that bridge the parts the two
platforms don't share.

**ExtendScript stays.** Adobe: "ExtendScripts are not affected by this transition." That's
the language every read in spec 001 ran in. What's being retired is the *container*: the CEP
panel that hosts the localhost server and hands scripts to ExtendScript.

**Is UXP necessary?** Not for Sprint 2 or a first prototype, since CEP is the only option in AE
today and works through 2028. It will be required for anything that ships to users past
Dec 2028. What we don't know until the AE beta lands:

- Whether an AE UXP plugin can call ExtendScript, or only a new UXP-native AE API, and whether
  that API covers temporal ease, spatial tangents, expressions, and effect parameters as
  ExtendScript does. If it doesn't, the spec 001 results have to be re-run on UXP.
- How the pipe works. In other apps, as far as we know, UXP can make outbound network calls
  (fetch, WebSocket client) but can't run a local server the way this CEP panel does. The
  UXP version would probably have to connect *out* to a local helper instead of listening.
  To be confirmed in the beta.

**Adobe Developers Live, Day 1 (2026-09-29).** Nothing new for AE beyond the timeline above.
Adobe confirmed that every flagship app gets at least two years from its UXP public beta before
CEP is removed, which matches Nov 2026 → Dec 2029 for AE. Adobe also launched the
[UXP Hub](https://blog.developer.adobe.com/en/publish/2026/09/introducing-the-uxp-hub), one
place for UXP docs, packaging, and marketplace publishing. AE isn't listed as a host there yet.
Neither open question below (ExtendScript access, local server) was answered in anything
published. Check the session recordings once they're posted.

**The upside:** UXP plugins install through the Creative Cloud marketplace, which could remove
most of the setup friction from spec 001 (unsigned-extension flags, cloning repos).

**What this means:** prototype on the CEP bridge now, but keep the piece inside AE thin (a pipe
plus ExtendScript snippets) so it can move to UXP. Re-run the spec 001 table against the AE UXP
beta after Nov 2026 before building anything big on either platform. Factor this into
`decisions/003`.
