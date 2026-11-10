# Installer SC-002 notes (spec 006)

## T004, the signing gate: passed 2026-11-09

Self-signed copies of the bridge and panel, unpacked by hand into test account 1's CEP extensions
folder, on After Effects 27.0 (build 27.0x78) and macOS 27.

| Check | Result | Evidence |
|---|---|---|
| Debug mode not set | Pass | `PlayerDebugMode` not set for CSXS.9 to 14 |
| Signed bridge loads | Pass | `/health` HTTP 200, bridge 1.1.0, debug mode off |
| Knack panel opens | Pass | Window > Extensions > Knack opened with no signature error (seen by the builder) |
| Setting read through the bridge, off | Pass | `0` |
| Setting read through the bridge, on | Pass | `1` |

**Decision for T005:** go to Phase 2. Plan D5 isn't needed.

### Section name (research R8)

`Main Pref Section v2`, with the plain two-argument `getPrefAsLong`.

- On 27.0 it's confirmed live through the bridge: `havePref` is true only under this section.
- On 26.5 and 26.2 it's confirmed from the Prefs files on the builder's account, which hold the key
  under the same section. It wasn't read live on those versions.

### Not tested

The task named AE 26.5, but the run was on 27.0, because this Mac has both 2026 and 2027 installed.
Signed loading on 26.5 is untested. The re-run was skipped because the signature check is CEP's and
the section name is confirmed from the file. Run T017 on 2026 to cover it.

### Findings for later tasks

- **T013:** under plain `Main Pref Section`, `havePref` is false, yet `getPrefAsLong` still returned
  the live `0` and `1` with no error. Use exactly `Main Pref Section v2`, and don't treat a returned
  number as proof that the section is right.
- **Guidance text:** the bridge's `started` time was the same in both runs, so AE didn't restart, yet
  the read changed from `0` to `1`. The Prefs file also showed `1` while AE was open, so AE doesn't
  only write it on quit. This shows the setting's value changes without a restart. It doesn't show
  that a script can write files without one.

## T017 to T019, SC-002: passed 2026-11-09

Zip `Knack-0.1.0-test-50c581a.zip` (commit `50c581a`, helper settings hash `3acbda26`). Each run used a
new account, made just for the run, on Apple silicon, macOS 27.0.1, following quickstart §2. The saved
results are in `/Users/Shared/last-check-run{1,2,3}.json` (outside the repo).

| Run | Task | Account | Type | `all_working` | Checks | Keychain dialog | Panel setup message |
|---|---|---|---|---|---|---|---|
| 1 | T017 | `test2` | Standard | true | 12 of 12 working | None | None |
| 2 | T018 | `test3` | Administrator | true | 12 of 12 working | None | None |
| 3 | T019 | `test4` | Standard | true | 12 of 12 working | None | None |

The first try at run 1 (on `betatester`, the earlier zip) failed. The install exited 0 in 0.03 s and
installed nothing, and Check setup couldn't find the private Node. There were two causes, both fixed before
these runs: npm ci's `node_modules/.bin` links, which the install refuses (`b45eea8`), and entry points
that exited silently when run through `Knack/current` (`50c581a`). Tests on fake payloads missed both.

**Passes:** all three results have `all_working: true`, and the runs include Apple silicon and a standard
user. The same results on the admin and standard accounts show the installer needs no admin rights.

### Intel: not run (no Intel Mac); Rosetta stand-in passed

On the builder's account, I unzipped the staged zip's `node/node-x64.zip` to a temp folder (`file`:
Mach-O 64-bit executable x86_64, Node v26.8.1). Under `env -i arch -x86_64`, with a temp home and
`PATH` limited to that Node:

- the helper (`panel/helper/main.mjs` from the payload) replied `ready` (runtime a, settings hash
  `3acbda26`), using a dummy key with the Keychain off and a local `base_url`
- it started `ae-mentor` as a child process, itself x86_64
- `stop` exited 0
- the payload's `ae-mentor` lists 22 tools, the same as the repo's `mentor/server.mjs`

**Partial check:** this proves that the x64 binary, the helper and `ae-mentor` run. It doesn't show
which Node an install on an Intel Mac keeps, or how Intel AE talks to the bridge.

### Findings

- **Each AE version is listed twice.** On all three runs, `ae_versions` was `26.5, 26.5, 27.0, 27.0,
  27.1, 27.1`, and the check's line read "Found After Effects 26.5, 26.5, 27.0, 27.0, 27.1 and 27.1."
  It's still marked working, but a tester would see it. Fix: remove repeated versions, and find out why
  the scan finds each install twice.
- **The install swallows its error** (from the failed first try): the child process's exit code was
  ignored, so a failed install reported success. Fix: write the error to a log file in `Knack/` and show
  that it failed.
- **Unzipping into `/Users/Shared`** leaves an installer app owned by that user, which the next account
  would find already there. For testers this doesn't matter (one account each). For our runs, unzip into
  the user's own Downloads folder.
- AE 26.5 was installed on every account, so the setup check found it. Signing (T004) was only checked
  live on 27.0, and these runs don't record which AE version opened the panel.

### Still unproven (quickstart §3)

Notarization (SC-008), real downloads, testers who aren't developers (SC-001), a lesson on an installed
copy (SC-006, and T027's scan after it), faults (SC-003), updates (SC-004), uninstall (SC-005), and Intel
hardware.

`/Users/Shared/knack-key.txt` was deleted after run 3.
