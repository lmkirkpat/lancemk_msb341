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
