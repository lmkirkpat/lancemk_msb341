# Research: Installer for Knack on a Mac

Checked against the code at `68a526f` and this Mac on 2026-11-09. "Checked" means read in the code or
run here. "Not tested" means nobody has tried it; T004 or a later named task does.

## What a fresh account doesn't have, and who needs it

| Today's code needs | Where | On a fresh account | How it gets there |
|---|---|---|---|
| Node 18+ on PATH | `bridge/install.sh`, `panel/install.sh`, `.mcp.json`, `panel.json` `node_path` | Missing | Private Node (R1) |
| npm, to fetch the SDK | `panel/install.sh` line 95 | Missing | `node_modules` is built on the builder's Mac and shipped (R3) |
| `@anthropic-ai/sdk` in `node_modules` | `panel/helper/` (not committed; 4,017 files, 27 MB here) | Missing | Same |
| A repo | `panel.json` `repo_path`, `config.js` needs `<repo_path>/.mcp.json`, `adapter-api.js` builds `.mcp.json` and `.claude/skills` from it | Missing | An install folder laid out like the repo (R4) |
| `mentor/` next to `bridge/paths.mjs` | `mentor/paths.mjs` imports `../bridge/paths.mjs` | Missing | Same layout (R4) |
| Helper beside the panel | `adapter-api.js` line 16: `__dirname/../helper` | Would sit inside the signed extension | One-line change (R5) |
| Unsigned loading | `install.sh` scripts set PlayerDebugMode for CSXS 9 to 14 | Off, and FR-006 forbids setting it | Signed extensions (R2) |
| "Allow Scripts to Write Files" | Ticked by hand | Off | Guided; verified by setup check (R8) |
| Claude Code | B1 only | Missing | Not needed on A. `panel.json` has `"runtime": "a"` and no `claude_path`, which `config.js` accepts |
| The key in the Keychain | `key.mjs` reads service `Knack`, account `anthropic-api-key` | Missing | Installer writes it (R7) |
| A working key check | `main.mjs` line 205 returns `not_implemented` when a key exists | **Not built** (013 T037 is open) | 013 T037 moves onto the SC-002 path |
| Absolute paths from the builder's machine | `install.sh` writes `panel.json` from `command -v node` and the repo | Would be wrong | Installer writes them at install time, for that user |

On this Mac: `pkgbuild`, `productbuild`, `codesign`, `osacompile` and `hdiutil` exist. `ZXPSignCmd` does
not. `security find-identity` shows 0 valid code-signing identities, so there is no Developer ID. The
machine is Apple silicon. The only Node is Homebrew's (26.8.1).

## R1. The private Node

**Decision (needs the builder, D1):** ship the official nodejs.org macOS binaries for arm64 and x64,
Node 26.8.1, `bin/node` and the licence only. The installer copies the one that matches the Mac.

**Why:** the evals were measured on Node 26.8.1 here. The same version keeps them honest. Homebrew's
binary can't be copied, because Homebrew's Node links against other Homebrew libraries.

**Alternatives:** download Node during install (fails the no-internet edge case and adds a server);
CEP's built-in Node (`decisions/010` rejected it: the helper would be tied to CEP's version);
a single-file bundle of the helper and mentor (more build risk for a saving nobody needs yet, and what
ships would differ from what the evals ran); a universal binary with `lipo` (breaks the signature).

**Cost:** roughly 100 MB of download for both architectures and about 125 MB installed for Node
(estimates, not measured). The build records each binary's SHA-256 and refuses a mismatch.

## R2. Loading without PlayerDebugMode

**Decision (needs the builder, D2):** sign both extension folders with Adobe's `ZXPSignCmd` and a
self-signed certificate, then unpack the signed `.zxp` into the user's CEP folder.

**Why:** FR-006 forbids debug mode. Self-signed is free and needs no account. From memory, CEP checks
that the signature is valid and files are unchanged, and doesn't require a commercial certificate.
**Not tested on AE 26.5 or macOS 27.** T004 is the gate. `ZXPSignCmd` may also need Rosetta on Apple
silicon.

**Consequences:**
- The tool and certificate stay on the builder's Mac, outside the repo. The certificate uses the
  organisation name Knack and no real name. Its password lives in the builder's Keychain.
- A signature covers every file. Nothing may be added to the extension folder afterwards: no
  `.DS_Store`, no `node_modules`, no version stamping after signing. Panel and bridge don't write to
  their own folders today.
- The certificate's timestamp needs internet at build time, not at install.

**If T004 fails:** SC-002 can't pass as written today. See plan › Decisions, D5.

**Alternatives:** a commercial certificate (cost and delay, buys nothing CEP needs); ZXP installers
that need admin or a third-party tool (fails FR-013 or adds a dependency).

## R3. What ships for the helper

Build `panel/helper` with `npm ci --omit=dev` from the committed lockfile on the builder's Mac, then
remove `dev/`, `test/`, `.d.ts`, `.map` and SDK docs. No `.node` files exist in `node_modules` (checked), so one copy suits both
architectures.

`settings.mjs` hashes `settings.json`, `preamble.md`, `main.mjs` and `lib/`, so removing `dev/` and
`test/` doesn't change the hash. The build compares it to the repo's, which ties the installed helper to
what the evals measured.

## R4. An install folder laid out like the repo

**Decision:** install to `~/Library/Application Support/Knack/`, with `current` a link to
`versions/<version>/`, and inside it the same relative paths the code already expects (contracts/install-layout.md).
`panel.json`'s `repo_path` points at `current`.

**Why:** `config.js`, `adapter-api.js`, `mcp-client.mjs` and `mentor/paths.mjs` then work unchanged. The
code path is the one the evals ran. `mcp-client.mjs` already turns `"command": "node"` into the helper's
own Node, so the unchanged `.mcp.json` runs the private Node.

`mentor/server-current.mjs` skips its git check when no `.git` is above it, so no git stub dialog
appears.

**Name:** the new folder is `Knack` because FR-027 says outside-AE parts mustn't be named for AE only.
The spec's "folder names stay" assumption covers existing folders (`AEMentor`, `AEMentorBridge`, bundle
IDs), which stay.

**What ships, by deny-list** (so spec 007's new panel files need no installer change):

| Source | Goes to | Left out |
|---|---|---|
| `bridge/cep/` | CEP extensions `AEMentorBridge` (signed) | nothing |
| `panel/` | CEP extensions `AEMentorPanel` (signed) | `helper/`, `dev/`, `test/`, `*.sh`, `package.json` |
| `panel/helper/` | `current/panel/helper/` | `dev/`, `test/` |
| `mentor/` | `current/mentor/` | `test/`, `dev/`, `fixture/`, `package.json` |
| `bridge/paths.mjs` | `current/bridge/paths.mjs` | the rest of `bridge/` outside `cep/` |
| `.claude/skills/*-mentor/` | `current/.claude/skills/` | every other skill |
| `.mcp.json` | `current/.mcp.json` | |

`mentor/fixture.mjs` ships: `bridge-client.mjs` imports it statically. It's code, and its data
(`mentor/fixture/`, `test/`) doesn't ship. It only acts when a fixture variable is set, and the panel
passes none (the adapter's environment allowlist).

## R5. The panel changes the SC-002 path needs

Two small changes, both panel-builder's:

1. `adapter-api.js`: default the helper path to `<repo_path>/panel/helper/main.mjs` instead of
   `__dirname/../helper`. On a dev install it's the same file. Otherwise the helper would sit in the
   signed extension and FR-026 would be broken.
2. A stamp: on load, the panel writes its version to `panel-loaded.json` in the learner home. Nothing
   outside AE can otherwise tell that the panel loaded. The menu item is not proof: as far as we know, AE
   lists an extension that then refuses to open. It needs a new file and one call in `main.js`.

Overlap: `adapter-api.js` is shared with 007 T023 and 013 T044, on different lines. `main.js` is being
reworked by 007. Both changes are small; the cockpit merges one at a time.

## R6. The installer's shape

**Decision:** an AppleScript applet made by `osacompile` (built into macOS, no new dependency), holding
the payload in `Contents/Resources`. Dialogs do the talking; the work is done by `.mjs` files run on the
private Node, which are unit-testable.

**Why:** it needs consent, a hidden key field, a wait for AE to quit, and a final check, for a standard
user. It can be codesigned and notarized later without changing shape. After resources are added, the
applet must be re-signed ad hoc, or Apple silicon can refuse it.

**Alternatives:**
- A `.pkg` installs per-user, but has no supported way to ask for and check a key. Rejected.
- A SwiftUI app: nicer screens, more to build, no reason today. Revisit if testers find the dialogs
  poor.
- A web page served by the private Node: a browser tab asking for a key is the wrong signal.
- A double-clickable `.command`: opens Terminal, fails FR-001.

Only `/bin/bash`, `ditto`, `security`, `defaults` and `pgrep` are assumed from macOS. No Python, no git.

## R7. Storing the key

The installer sends `add-generic-password -U -s Knack -a anthropic-api-key -w <key>` to `security -i`
over stdin, so the key is never in a process list or a file. Created and read by the same
`/usr/bin/security`, so no access dialog should appear (not tested; T017 sees it). The key check goes
first: the helper's `key_check` takes a `key` field, so a bad key is never stored.

**Q2 doesn't affect this.** The installer takes whatever key the person was given and stores it the same
way. What Q2 decides is how a tester receives one and who pays. That's held out of the SC-002 path (T045).

## R8. The After Effects scripting setting (Q5)

**Assumption, plan on Q5's recommendation: guide, don't set.** The reason is the spec's: it's a security
setting the person should choose, and writing AE's preferences risks their settings.

The setup check reads it with a fixed script over the bridge's `POST /run`:
`app.preferences.getPrefAsLong("Main Pref Section v2", "Pref_SCRIPTING_FILE_NETWORK_SECURITY")`.
The section name varies by AE version, so T004 confirms it. Never test by writing a file: with the
setting off, AE shows a dialog that freezes it.

The check's script is one fixed string, not a way to run arbitrary code, so constitution II holds.

## R9. Signing and notarizing the installer (Q3)

**Assumption, plan on Q3's recommendation: buy the Developer ID, before the first tester.** Macs block an
unnotarized download, and a trip to System Settings is the developer-shaped step this spec removes.

**SC-002 doesn't need it.** Moving the build through `/Users/Shared` puts no quarantine mark on it, so
macOS doesn't block it. That's the honest limit of today's result: SC-008 and FR-014 stay open, and
nobody outside this Mac can install the test build without a bypass. Enrollment can take days, so it
can't be planned into today.

## R10. Who the first release is for (Q4)

**Assumption, plan on Q4's recommendation: at most 5 invited testers.** It keeps support to copied
reports, and the manual download with no update notifications stays in scope.

## R11. A Mac without git (Q6, which the spec says to decide here)

**Decision, narrower than the spec's recommendation:** no separate check of the running mentor. On A,
the helper starts a new mentor process per lesson and updates need AE closed, so a running server from
an older version can't exist. Setup check's "every part is the same version" line covers the rest.

## R12. Setup check and the existing doctor

`bridge/scripts/doctor.mjs` stays for development. It can't be reused: its output is developer-shaped,
it fails when debug mode is off, and it looks for repo symlinks. The new check reuses its method: `/health`
with the token from `bridge.json`.

"In place" is checked from files; "loads" from the bridge's answer (bridge) and the stamp (panel).

## R13. The test build and the eval gate

FR-025 applies to a release. The SC-002 path produces a **test build**: `channel: "test"`, labelled so in
the setup check's version line, never given to a tester. Four of the six eval sets were measured on an
older helper and re-run on the first tester's commit anyway (`CLAUDE.md`). The gate is T043.
