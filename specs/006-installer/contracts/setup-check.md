# Contract: Setup check

`node <current>/setup/setup-check.mjs [--json]`, on the private Node. Called by the installer's last
screen today, and later by the panel (T033). Finishes within 15 s. Changes nothing, except a transient
test file for the folder-write check. Exit 0 only if every line is `working`.

## Output (`--json`)

```json
{ "version": "0.1.0", "channel": "test", "commit": "abc1234", "macos": "27.0.1", "arch": "arm64",
  "ae_versions": ["26.5"], "all_working": true,
  "checks": [{ "id": "bridge_answers", "part": "ae-pipe", "state": "working", "text": "...", "fix": null }] }
```

No path, key, user name, or account name anywhere in it.

## Lines (FR-021)

| id | Working when | If AE is closed |
|---|---|---|
| `macos` | Supported version | runs |
| `ae_version` | At least one AE 26.4+ installed; names each it found | runs |
| `ext_bridge` | Folder present with signature files | runs |
| `ext_panel` | Folder present with signature files | runs |
| `bridge_answers` | `GET /health` answers `ok` with `bridge.json`'s token | `needs_ae` |
| `panel_loads` | Stamp exists with this version | `needs_ae`, or "open Knack once" |
| `ae_scripting` | Fixed pref read through `POST /run` returns 1 (research R8) | `needs_ae` |
| `cep_can_load` | Bridge answers, or AE older than the shutdown; else names the CEP cause | `needs_ae` |
| `key` | Helper `key_check` returns `works`; `rejected` is `not_working`; `offline` is `not_checked`; never passes the key as an argument | runs |
| `record_folder` | Learner home writable (test file, then removed) | runs |
| `record_read` | Learner record missing (new) or parses; unreadable is `not_working` and is never changed | runs |
| `versions_match` | `release.json`, manifests and stamp agree | runs |

`text` and `fix` obey FR-022: one or two plain sentences; no paths, field names, error codes or commands.

The bridge's token comes from `bridge.json` and is never printed.
