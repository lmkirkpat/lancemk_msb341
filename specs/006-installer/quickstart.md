# Quickstart: Proving the installer

## 1. Build a test build (builder's Mac)

Needs: T002's tools. From a clean commit: `node installer/build.mjs --channel test`. Expect one zip with
one app inside, and a printed version, commit and helper hash. Then `cd installer && npm test`, and the
eval engineer's scan: `node product/evals/installer/scan.mjs <staged folder>` (no banned file, no key, no
user-name path).

## 2. SC-002 (one run; do it 3 times)

Quit After Effects on the builder's account first: two copies would compete for the bridge's port.

1. System Settings > Users & Groups: add a new user. Standard for runs 1 and 3, Administrator for run 2. Use
   a made-up name.
2. Log in as that user. Open AE, sign in to Creative Cloud, quit AE.
3. Confirm nothing is there: no `node` in Terminal for this user is not required, but no CEP extensions,
   no `Knack` folder.
4. From `/Users/Shared`, unzip and open the installer. Follow the dialogs. Paste the access key.
5. Open AE. Tick After Effects > Settings > Scripting & Expressions > Allow Scripts to Write Files and
   Access Network. Restart AE if it asks.
6. Open Window > Extensions > Knack on any comp. Expect no setup message.
7. On the installer's last screen, press Check setup. Expect every line working.
8. Keep the saved result, `Knack/last-check.json`, and copy it to `/Users/Shared`.
9. Log out. Remove the test user before the next run, or use a new one.

**Passes when** all three saved results have `all_working: true`, and the runs include Apple silicon and a
standard user. Intel if one is available; if not, the note says so.

## 3. Things SC-002 doesn't prove

Notarization (SC-008), real downloads, non-developer testers (SC-001), a lesson on an installed copy
(SC-006), faults (SC-003), updates (SC-004), uninstall (SC-005).

## 4. Later

- **Faults (SC-003):** break each of the 11 and run the check; compare against the expected line.
- **Update (SC-004):** version N, one lesson, version N+1; compare the learner record.
- **Uninstall (SC-005):** inventory before and after, for keep and remove.
- **SC-006:** spec 003 quickstart §4 a to f on an installed copy, with no repo on the account.
