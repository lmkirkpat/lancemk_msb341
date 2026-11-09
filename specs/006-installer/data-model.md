# Data Model: Installer for Knack on a Mac

No field holds a key, real name, email, phone, or a path containing the Mac user name, except `panel.json`,
which is local to that user and isn't part of the copied report.

## Parts list (`installer/parts.json`, repo)

Source of truth for what ships (research R4). One entry per part:

| Field | Rule |
|---|---|
| `id` | One of `ae-pipe`, `panel`, `mentor`, `node`, `helper`, `skills` |
| `side` | `ae` or `outside` (FR-026) |
| `from`, `to` | Repo-relative source; destination under the install folder or CEP extensions |
| `leave_out` | Deny patterns. MUST include `test`, `dev` for code parts |

## Release file (`release.json`, in the installed version and the payload)

| Field | Rule |
|---|---|
| `version` | Semver. Compared for update and downgrade (FR-015, FR-017) |
| `channel` | `test` or `release`. Only `release` may go to a tester |
| `commit` | Full hash of a clean commit (FR-025) |
| `parts` | `{ id: version }` for every part; one shared version per release |
| `node` | `{ version, arm64_sha256, x64_sha256 }` |
| `helper_hash` | The settings hash (`settings.mjs`); must equal the repo's at build |
| `evals` | `null` on `test`. On `release`: for each set, results file, commit, and reused or fresh (FR-025) |

## Install inventory (`install-state.json`, in `~/Library/Application Support/Knack/`)

Everything this install added, for update, uninstall and SC-005: `version`, `files` (top-level paths it
created), `keychain` (service and account), `settings_changed` (always empty: FR-006, FR-020).

States of an install, from what's on disk:

```text
none -> staged (versions/<v> written, complete) -> active (current points at <v>, extensions swapped)
```

An interrupted install leaves `none` or the previous `active`, plus at most an unused staged folder a
re-run replaces (FR-012).

## Panel config (`panel.json`, in the learner home; existing shape)

Written by the installer: `version: 1`, `runtime: "a"`, `node_path` (the private Node through `current`),
`repo_path` (`current`). No `claude_path`. `0600`.

## Panel stamp (`panel-loaded.json`, in the learner home)

`version` (the manifest's bundle version), `at` (ISO time). Rewritten on each panel load. The stamp
counts only if `version` matches the install.

## Setup check result (contracts/setup-check.md)

One line per check: `id`, `part`, `state` (`working`, `not_working`, `needs_ae`, `not_checked`), `text`,
`fix`. `text` and `fix` follow FR-022.

## Learner record

Unchanged. The installer only creates the folder if missing (FR-009).
