# Implementation Plan: Installer for Knack on a Mac

**Branch**: `006-installer` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md) (approved 2026-10-20,
amended 2026-10-30 and 2026-11-04)

**Status**: awaiting the builder's approval. Nothing is built.

**Input**: `specs/006-installer/spec.md`. Q2 stays pinned and this plan doesn't depend on it. Q3 to Q5
are planned on their recommendations, marked as assumptions (below). Q6 is decided in research R11.

## Summary

One downloaded app, made with macOS's own `osacompile`, carrying everything a fresh account lacks: a
private Node, the helper with its SDK, the mentor, the skills, and the two extensions, signed so AE
loads them without debug mode. It installs into the user's own Library. The install folder has the same
relative paths as the repo, so the panel, helper and mentor run unchanged. That's the main design choice:
what's installed is the code the evals measured, and only two small panel changes are needed.

Sprint 4's done line is SC-002. Phases are ordered so its shortest path comes first.

## The shortest path to SC-002

Scope: tasks T001 to T021 in [tasks.md](tasks.md).

1. Builder approves D1 to D4.
2. Get the Adobe signing tool and make a certificate.
3. **Gate:** on a fresh account, prove AE loads signed copies with debug mode off.
4. Two small panel changes, and the helper's key check (013 T037).
5. Build the parts list, the build command, the install logic, the setup check and the dialogs.
6. Scan the build; build it.
7. Three runs on fresh accounts, saving each check's result.

**Rough size:** about 16 build tasks, perhaps 800 lines with tests, and 3 to 4 hours of agent time if no
usage limit stalls it (a guess from run 2; agents' own timing is unreliable). Builder's hands: about 1.5
hours. Approvals, one spike sitting, and three account runs, each with a Creative Cloud sign-in.

**Left out of this path on purpose:** notarization, Fix buttons, Copy report, the panel's Check setup,
updates, uninstall, the release eval gate, and the key handout (Q2).

## Technical Context

**Language/Version**: JavaScript ES modules on the private Node for installer logic and the setup check;
AppleScript for dialogs; `/bin/bash` 3.2 only for extracting Node. CommonJS in the panel changes.

**Primary Dependencies**: runtime: none new beyond D1's Node. Build-only: Adobe's `ZXPSignCmd` (D2), not
committed. `@anthropic-ai/sdk` is already approved and pinned.

**Storage**: per contracts/install-layout.md; Keychain item as spec 013 defined.

**Testing**: `node:test` in `installer/test/` with a temp home and fake `security`; a scan and inventory
diff owned by the eval engineer in `product/evals/installer/`; the builder on fresh accounts.

**Target Platform**: macOS current and previous, AE 26.4+, arm64 and x64 (x64 untested unless an Intel Mac
turns up).

**Project Type**: installer plus a local check, no server.

**Performance Goals**: setup check within 15 s; SC-001's 15 minutes later.

**Constraints**: no Terminal, admin, PlayerDebugMode, repo, git or Claude Code. Signed folders stay
byte-identical after signing. The key never appears in an argument, file or log.

**Scale/Scope**: about 8 new modules in `installer/`, 2 small panel changes, 1 helper change already
specified in 013.

## Assumptions to confirm (Q3 to Q5)

| Q | Planned on | Reason | Effect if you say otherwise |
|---|---|---|---|
| Q3 Developer ID | **Yes, before the first tester.** Not needed for SC-002 | Without it, a downloaded installer is blocked and needs System Settings | No: T039 to T041 become a picture-guided bypass and SC-001's time loosens |
| Q4 First release | **At most 5 invited testers** | Support stays at copied reports; no update notifications or terms | Public: adds notifications, support and a privacy notice to scope |
| Q5 AE scripting setting | **Guide, then verify** | It's a security setting, and writing AE's preferences risks the person's settings | Set it: needs a new spike and a consent screen |

## Decisions for the builder

| # | Decision | Recommendation | Alternatives |
|---|---|---|---|
| D1 | Bundle a runtime | Official Node 26.8.1 binaries for arm64 and x64, private to Knack | Download at install; CEP's Node; a single-file bundle (research R1) |
| D2 | New build tool and certificate | Adobe's `ZXPSignCmd`, self-signed certificate, both outside the repo | Commercial certificate; third-party installer (R2) |
| D3 | Installer shape | AppleScript applet from `osacompile`; no new dependency | `.pkg`; SwiftUI app; local web page (R6) |
| D4 | Where the code lives | New `installer/`, owned by panel-builder; the cockpit adds it to `ownership.json` and `decisions/007` | Inside `panel/` (it isn't panel code, and it would collide with 007) |
| D5 | If T004 shows signed loading fails | Stop and say SC-002 is missed. A run using debug mode can be logged as a **partial, not SC-002**, because FR-006 forbids it | Amend FR-006 for test builds, your call |

D1, D2 and D4 are needed before T002. D3 is needed before T014. D5 only matters if T004 fails.

## Constitution Check

*Constitution 1.4.0.*

| Principle | Check | Status |
|---|---|---|
| I. Spec Before Build | Spec approved; this plan precedes any build | Pass |
| II. Decisions Are Recorded | Depends on `003` (thin pipe; the bridge is unchanged), `005` (panel only displays; the stamp isn't teaching or project access), `006` (name: revisit before the first tester, T046), `007`/`008` (owners, hooks), `009` (A ships), `010` (helper on private Node), `011` (ships on A). D1 to D3 should each get a line in a decision record when answered; the cockpit assigns the number | Pass |
| III. Teaching Quality Is Evaluated | Installer changes no teaching. The helper hash ties installed to measured. FR-025's gate is T043; a test build is labelled and never goes to a tester | Pass |
| IV. Privacy by Default | Report and result hold no names or user paths; scanned by EE. The certificate holds no real name | Pass |
| V. Simplicity and Checkpoints | Node and `ZXPSignCmd` are new and put to the builder (D1, D2). No Xcode, no framework. Commit only as asked | Pass, pending D1 and D2 |
| VI. One Owner per File | `installer/` needs an owner (D4). Checks by EE, not the installer's builder. Fresh-account runs are one AE sitting at a time | Pass, pending D4 |
| B1 then A (`011`) | Runtime work is the exception: only A is installed. The key check uses a free request, and the path spends no lesson credit unless the optional T021 runs | Pass |

No violations. Complexity Tracking is empty.

## Project Structure

```text
specs/006-installer/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md, tasks.md
├── contracts/install-layout.md, contracts/setup-check.md
└── checklists/requirements.md

installer/                   # NEW, panel-builder (D4)
├── parts.json               # what ships
├── build.mjs                # staged tree, signing, applet, zip
├── install.mjs              # entry run on the private Node
├── setup-check.mjs          # the check's entry
├── applet/installer.applescript
├── lib/                     # preflight, payload, keychain, panel-config, checks
├── package.json
└── test/

product/evals/installer/     # NEW, eval-engineer: scan.mjs, inventory-diff.mjs
panel/lib/adapter-api.js     # helper default path
panel/lib/loaded-stamp.js    # NEW
panel/main.js                # one call
panel/helper/                # 013 T037
```

`installer/` has no import from `panel/` or `mentor/` except through what it ships. `bridge/` and
`mentor/` are unchanged. `panel/install.sh` and `bridge/install.sh` stay as the developer install (FR-024).

## Coordination

| File | Who else | Handling |
|---|---|---|
| `panel/lib/adapter-api.js` | 007 T023, 013 T044 | Different lines; merge one at a time |
| `panel/main.js` | 007 rebuilds it | One added call; if 007 lands first, re-apply there |
| `panel/CSXS/manifest.xml` | 007 T025 | Installer never edits the repo copy. It stamps the staged copy before signing |
| `panel/lib/config.js` messages | 007's error copy (its FR-056) | Stay out on the SC-002 path; broken-install copy goes to T035 |
| Check setup entry | 007 FR-059, D9 | T033 waits for 007 |
| First-run screens | 007 FR-054, held | Not needed; the installer asks for the key |

The test build ships the panel from today's `main`. Spec 007 doesn't have to land first.

## Phases

1. **Gate** (T001 to T005): approvals, tools, and whether signed loading works.
2. **SC-002 path** (T006 to T021).
3. **Check setup finished** (US2).
4. **Ready for a tester** (US1's remainder, then US5).
5. **Update** (US3), **uninstall** (US4), polish.

## Complexity Tracking

None.
