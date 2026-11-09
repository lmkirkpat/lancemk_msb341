# Contract: What the install puts where

All per-user (FR-013). Nothing outside the home folder. No shell files, no PATH, no `defaults write`.

```text
~/Library/Application Support/
├── Adobe/CEP/extensions/
│   ├── AEMentorBridge/          # AE side: signed, real folder (not a link)
│   └── AEMentorPanel/           # AE side: signed; no helper inside
├── AEMentor/                    # Learner home: created if missing, contents never replaced
│   └── panel.json               # written by the installer (data-model)
├── AEMentorBridge/              # Written by the bridge when AE starts; the installer doesn't touch it
└── Knack/                       # Outside AE (FR-026, FR-027)
    ├── install-state.json
    ├── current -> versions/<v>
    └── versions/<v>/
        ├── release.json
        ├── .mcp.json            # unchanged: command "node", args mentor/server.mjs
        ├── .claude/skills/*-mentor/
        ├── mentor/              # no test/, dev/, fixture/
        ├── bridge/paths.mjs
        ├── panel/helper/        # with production node_modules; no test/, dev/
        ├── runtime/node/bin/node
        └── setup/               # setup-check.mjs and its lib
```

Keychain: login keychain, service `Knack`, account `anthropic-api-key` (spec 013 research R11).

## Order of an install

1. Agreement (FR-007). Nothing is written first.
2. Checks: macOS and AE versions (FR-011); a developer install or a newer version present stops it on the
   SC-002 path.
3. Ask for the key; check it with the payload's own Node and helper (needs no install); hold it in memory.
4. AE closed? If not, ask and wait; never force-quit (FR-010).
5. Write `versions/<v>/` beside anything already there; verify it.
6. Replace the two extension folders, each by unpacking to a temporary sibling and renaming.
7. Swap `current`. Create the learner home if missing. Write `panel.json` and `install-state.json`.
8. Store the key unless the service rejected it. A key that couldn't be checked (offline, or no answer) is stored, and the setup check retries it (edge case; decided 2026-11-09).
9. Last screen: restart AE, tick the setting, open the panel, press Check setup.

A failure in 5 to 7 leaves the previous state or something a re-run completes (FR-012).

## Never

Touch the learner record's contents, delete a symlink that points into a repo, set PlayerDebugMode, use
Terminal, ask for an admin password, force-quit AE, write a key to a file or argument list.
