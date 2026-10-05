# Upstream

This folder is a fork of the CEP panel and install scripts from
[LiamcKerr/after-effects-mcp](https://github.com/LiamcKerr/after-effects-mcp) (MIT, © 2026 Liam
Kerr / Bitloop Labs), version 1.1.0 at commit **`2cfff1a`**, copied on 2026-09-30. The upstream
`LICENSE` is kept unchanged in this folder.

Why a fork, and why it keeps its own identity: `decisions/003` (thin AE pipe) and
`specs/002-easing-slice/research.md` › R1 (runs next to the upstream install).

## What was copied

| Upstream | Here |
|---|---|
| `cep/` (all files) | `cep/` |
| `scripts/doctor.mjs` | `scripts/doctor.mjs` |
| `install.sh`, `uninstall.sh`, `install.ps1`, `uninstall.ps1` | same names |
| `server/paths.mjs` | `paths.mjs` (the doctor imports it; upstream's `server/` isn't copied) |
| `.gitattributes` | `.gitattributes` (keeps `.ps1` as CRLF, everything else LF) |
| `LICENSE` | `LICENSE` (unchanged) |

Not copied: `server/server.mjs` and `server/tools.mjs` (replaced by `mentor/`, which adapts parts
of them), `test/`, `package.json` (the copied files need only Node built-ins), `README.md`,
`AGENTS.md`, `CLAUDE.md`.

## Changes

**Identity, so both bridges run side by side in AE:**

| What | Upstream | Fork |
|---|---|---|
| Bundle ID | `com.bitloop.claudebridge` | `com.aementor.bridge` |
| Extension IDs, restart event | `com.bitloop.claudebridge.host` / `.panel` / `.restart` | `com.aementor.bridge.host` / `.panel` / `.restart` |
| Name in Window > Extensions | Claude Bridge | AE Mentor Bridge |
| Config and token folder | `~/Library/Application Support/ClaudeAEBridge` | `~/Library/Application Support/AEMentorBridge` |
| Default port | 47670 | 47671 |
| CEP extensions link | `.../CEP/extensions/ClaudeBridge` | `.../CEP/extensions/AEMentorBridge` |
| ExtendScript global | `$.global.__claudeAE` | `$.global.__aeMentorBridge` |
| CEP window state | `window.__claudeBridgeState` | `window.__aeMentorBridgeState` |

The ExtendScript global matters most: every CEP extension in AE shares one ExtendScript engine,
so two bridges defining `__claudeAE` would overwrite each other's code.

The new name is also used in comments, the panel and host `<title>`s, the manifest's menu
comment, and the doctor's fix hints ("Window > Extensions > AE Mentor Bridge > Restart bridge").

**Install behavior:**

- `install.sh` / `install.ps1` **no longer register an MCP server.** Upstream registers
  `after-effects` at user scope, which would have replaced the upstream registration. The mentor
  server is registered by the repo's `.mcp.json` as `ae-mentor`.
- `uninstall.sh` / `uninstall.ps1` **no longer remove** the `after-effects` registration.
- `scripts/doctor.mjs` checks for `ae-mentor` instead of `after-effects`, imports
  `../paths.mjs`, and prints install commands relative to the repo root
  (`bash bridge/install.sh`). To run `claude mcp get ae-mentor` from the repo root (so the CLI
  sees `.mcp.json`), its `run()` helper takes a `cwd` argument. The check passes when the output
  contains `mentor/server.mjs`, and its fix hint points at `.mcp.json` instead of
  `claude mcp add`.
- The usage lines and final messages in all four scripts use repo-root paths
  (`node bridge/scripts/doctor.mjs`) and say to start Claude Code *in the repo*.

**Not changed:** the pipe itself. `host.js` still listens on localhost, checks the Bearer token,
and passes code to ExtendScript through `evalScript`; `bridge.jsx` still runs it inside one undo
group. No teaching logic lives here (`decisions/003`). `paths.mjs` and `.gitattributes` differ
only by the config folder name, or not at all.

**Testing notes:** upstream's `install.sh` and `uninstall.sh` said "not yet tested on macOS".
That note was dropped from `install.sh`, which ran live on macOS in T011 (both bridges showed in
Window > Extensions, and the doctor passed). `uninstall.sh` hasn't been run in this project.
**Windows:** the `.ps1` scripts carry the same edits, with an "untested" note added, and are
untested here.

## Checking this list

Last checked 2026-10-05 (T044) by diffing every copied file against a fresh clone of upstream at
`2cfff1a`. Every difference is listed above, and `LICENSE` is byte-identical. To re-check:

```sh
git clone https://github.com/LiamcKerr/after-effects-mcp.git /tmp/up && git -C /tmp/up checkout 2cfff1a
diff -r /tmp/up/cep bridge/cep; diff /tmp/up/LICENSE bridge/LICENSE
for f in scripts/doctor.mjs install.sh uninstall.sh install.ps1 uninstall.ps1; do diff /tmp/up/$f bridge/$f; done
diff /tmp/up/server/paths.mjs bridge/paths.mjs
```
