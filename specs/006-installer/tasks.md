---
description: "Task list for spec 006: the installer"
---

# Tasks: Installer for Knack on a Mac

**Status**: tasked 2026-11-09, awaiting the builder's approval. Nothing is built.

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/install-layout.md](contracts/install-layout.md),
[contracts/setup-check.md](contracts/setup-check.md), [quickstart.md](quickstart.md).

**Tests**: included where the spec names an automated measure. Checks of the installer are written by
the eval engineer, not its builder (constitution VI).

**Sprint 4's done line is SC-002. Phases 1 and 2 (T001 to T021) are the whole shortest path. Everything after is for later.**

## Format: `[ID] [P?] [Story?] Owner · Description`

- **Owner**: **PB** panel-builder (`panel/**`, and `installer/**` once T001 lands); **EE** eval-engineer
  (`product/evals/**`); **BL** the builder live; **SW** spec-writer; **Cockpit**. **SB** skill-builder
  has no task: `mentor/` and `bridge/` don't change.
- **AE**: needs After Effects. One sitting at a time (`decisions/008`). On a test account, quit AE on the
  builder's account first.
- **$**: spends API credit.
- **ASSUMES Qn**: planned on that open question's recommendation (plan › Assumptions to confirm).

---

## Phase 1: The gate (SC-002 PATH)

**Purpose**: find out today whether signed extensions load. If T004 fails, stop building.

- [x] T001 BL + Cockpit · Answer plan D1 (private Node), D2 (`ZXPSignCmd`, self-signed certificate), D3 (applet) and D4 (`installer/` owned by PB). The cockpit adds `installer/**` to panel-builder in `.claude/hooks/ownership.json` and to `decisions/007`'s table.
- [x] T002 PB · After D2: put `ZXPSignCmd` in `~/Library/Application Support/KnackBuild/` on the builder's Mac, outside the repo, and confirm it runs on Apple silicon (say so if it needs Rosetta, and let the builder approve that install). Create a self-signed `.p12` with organisation "Knack" and no real name, password in the builder's login Keychain. Nothing from this task is committed. Hand back the tool's version and the commands used, for `installer/build.mjs`.
- [x] T003 BL · Create test account 1 (a standard user, made-up name), log in, open After Effects 2026, sign in to Creative Cloud, quit. If Adobe's sign-in or licence won't work on a second account, SC-002 can't be run today: tell the cockpit.
- [ ] T004 BL AE · **The gate.** PB signs throwaway copies of `bridge/cep/` and `panel/` (minus `helper/`, `dev/`, `test/`, `*.sh`, `package.json`), unpacks them into test account 1's `~/Library/Application Support/Adobe/CEP/extensions/`, with `defaults read com.adobe.CSXS.12 PlayerDebugMode` showing nothing set. In AE: the bridge answers `/health` (the token is in `bridge.json`) and Window > Extensions > Knack opens with no signature error. Also read `app.preferences.getPrefAsLong("Main Pref Section v2", "Pref_SCRIPTING_FILE_NETWORK_SECURITY")` through the bridge with the setting off and on, and record the section name that works on AE 26.5 (research R8). Remove the copies after.
- [ ] T005 Cockpit · Log T004's result in `discovery/usage-notes/installer-sc002.md`. Pass: go to Phase 2. Fail: stop and bring plan D5 to the builder.

---

## Phase 2: Install on a fresh account (SC-002 PATH)

**Goal**: SC-002: install, then every setup check line passes, 3 of 3.

**Independent test**: quickstart §2, three times.

### Small changes first

- [ ] T006 [P] [US1] PB · Test first in `panel/test/`: in `panel/lib/adapter-api.js`, default the helper path to `path.join(config.repo_path, "panel", "helper", "main.mjs")`, keeping `deps.helperPath`. A dev install resolves to the same file. Merge note: 007 T023 and 013 T044 change other lines.
- [ ] T007 [P] [US2] PB · Test first: new `panel/lib/loaded-stamp.js` writes `panel-loaded.json` to the learner home with `version` from the manifest and `at`, atomically, and never throws; one call from `panel/main.js` at start-up. No record, project or key access. Merge note: 007 rebuilds `main.js`, so re-apply this one call if it lands first.
- [ ] T008 [P] [US2] PB · Do spec 013 T037 as written there and tick it in `specs/013-api-runtime/tasks.md`: `key_check` in `panel/helper/main.mjs` and `panel/helper/lib/key.mjs` returns `works`, `rejected`, `offline` or `no_key`. Check that a `key` field is accepted, since the installer checks before storing.

### The installer

- [ ] T009 [US1] PB · Create `installer/package.json` (`"type": "module"`, no dependencies, `"test": "node --test test/"`) and `installer/parts.json` per data-model and research R4's table. The panel and mentor parts use leave-out patterns so new files in those folders ship with no installer change.
- [ ] T010 [US1] PB · Test first, then `installer/build.mjs` with `--channel test`: refuse a dirty tree; stage per `parts.json` to a temp folder; `npm ci --omit=dev` in the staged helper from the lockfile, then remove `.d.ts`, `.map` and docs; fetch Node 26.8.1 arm64 and x64 from nodejs.org and check against hashes committed in `installer/node.json`; stamp the shared version into the **staged** manifests only (never the repo's); write `release.json` (`evals: null`, `channel: "test"`); verify the staged helper's settings hash equals the repo's; sign both extensions with T002's tool, reading the password from Keychain; compile the applet with `osacompile`; add the payload to `Contents/Resources`; ad-hoc re-sign the applet; `ditto` to one zip. Print version, commit, hash and size.
- [ ] T011 [US1] PB · Test first with a temp home, then `installer/install.mjs` and `installer/lib/preflight.mjs`, `payload.mjs`, `panel-config.mjs`, per contracts/install-layout.md's order: FR-011 version checks reading AE's `Info.plist`, stop on missing AE; a developer install (a symlink at either extension folder) stops with a plain message and changes nothing, since the replace offer is T037; a newer installed version stops (FR-017); wait for AE closed via `pgrep`, never force (FR-010); staged write then rename (FR-012); real folders in CEP extensions; `current` swap; learner home created if missing and never rewritten (FR-009); `panel.json` with `runtime: "a"`, `node_path`, `repo_path`, mode `0600`; `install-state.json`. Tests assert no `defaults write`, no writes outside the temp home, and a kill at each step leaves a state a re-run completes.
- [ ] T012 [US1] PB · Test first with a fake `security`, then `installer/lib/keychain.mjs`: check the key through the payload's helper `key_check`, store via `security -i` over stdin (research R7), service `Knack`, account `anthropic-api-key`. A test asserts the key never appears in any spawned argument list, environment, log or file. Offline: finish the install and report not yet checked (edge case). Works with any key the person was given (Q2 doesn't change this).
- [ ] T013 [US2] PB · Test first with faked inputs, then `installer/setup-check.mjs` and `installer/lib/checks.mjs`: every line and state in contracts/setup-check.md, `--json`, within 15 s, `needs_ae` when AE is closed. The `ae_scripting` line uses one fixed script with T004's section name; never test by writing a file. Text follows FR-022, with a test rejecting paths, field names, codes and commands. Writes `Knack/last-check.json`.
- [ ] T014 [US1] PB · After D3: `installer/applet/installer.applescript`. The screens: what it will add and that lesson text and frames go to the model provider (FR-007, nothing before agreement); access key with hidden answer; quit AE and wait, if open; progress; the last screen says restart AE, tick "Allow Scripts to Write Files and Access Network" with its menu path in words (ASSUMES Q5; the picture is T036), open Window > Extensions > Knack, then press **Check setup**, which shows each line and can be pressed again. A one-line `/bin/bash` step extracts Node with `ditto`, then runs `install.mjs`. Plain copy per `CLAUDE.md` › Voice. No Terminal, no admin prompt.

### Check and run

- [ ] T015 [P] [US1] EE · `product/evals/installer/scan.mjs <staged folder>`, written apart from the build: no `CLAUDE.md`, auto-memory, sprint notes, eval fixtures, `test/` or `.git`; `mentor/fixture/` absent; no `sk-ant-` strings; no `/Users/<name>` paths; the two extension folders contain no `node_modules` (FR-005, SC-007's install half).
- [ ] T016 [US1] PB · From a clean commit, run `node installer/build.mjs --channel test`, `cd installer && npm test`, and T015's scan on the staged folder. Smoke test the staged tree with no inherited environment and a temp home: the private Node starts the helper, the helper starts `ae-mentor`, and the tool list matches the repo's. Copy the zip to `/Users/Shared`. Depends on T006 to T015.
- [ ] T017 [US1] BL AE · Run 1, on test account 1 (standard user, Apple silicon), per quickstart §2. Note any Keychain dialog. Copy `last-check.json` to `/Users/Shared`. Pass: `all_working: true`.
- [ ] T018 [US1] BL AE · Run 2, on a new admin account, the same way. Use Intel for this or T019 if an Intel Mac is available.
- [ ] T019 [US1] BL AE · Run 3, on a new standard account, the same way.
- [ ] T020 Cockpit · Check the three results, log them and any finding in `discovery/usage-notes/installer-sc002.md`, tick SC-002 in `sprints/sprint-4-plan.md`, noting what's still unproven (quickstart §3) and whether Intel was run.
- [ ] T021 [US1] BL AE $ · Optional, about $0.40: on the last account, press Start lesson and read the mentor's opening. SC-002 doesn't require it, but it's the first sign SC-006 can pass.

**Stop here for sprint 4.**

---

## Phase 3: Check setup finished (US2, P1)

**Goal**: FR-022 and FR-023 and SC-003. **Independent test**: break each of 11 faults; each is named with a plain fix, with no false failures.

- [ ] T022 [P] [US2] PB · No internet and AE closed behave per US2 scenario 2 and the edge case, in `installer/lib/checks.mjs`.
- [ ] T023 [P] [US2] PB · Bridge port taken (`/health` fails with something listening on the port) names the cause, in `installer/lib/checks.mjs`.
- [ ] T024 [P] [US2] PB · CEP loading disabled is named, not a generic missing panel, in `installer/lib/checks.mjs`.
- [ ] T025 [US2] PB · `installer/lib/fixes.mjs`: **Fix** re-runs one part or creates a missing folder, then re-checks (FR-022). Never touches the learner record.
- [ ] T026 [US2] PB · `installer/lib/report.mjs`: **Copy report** with versions, commit and results, and no key, name or user path (FR-023).
- [ ] T027 [US2] EE · Extend `product/evals/installer/scan.mjs` to the installed tree, logs and caches after a full lesson, and to a sample report (SC-007).
- [ ] T028 [US2] PB · Add Fix and Copy report to `installer/applet/installer.applescript`.
- [ ] T029 [US2] EE · `product/evals/installer/faults.test.mjs`: every SC-003 fault that can be faked without AE, plus a working install with no false failures.
- [ ] T030 [US2] BL AE · The faults that need AE. Read every message against FR-022. 11 of 11.
- [ ] T031 [P] [US2] PB · Unreadable learner record, and a managed Mac blocking the install, each named plainly, in `installer/lib/checks.mjs` and `installer/lib/preflight.mjs`.
- [ ] T032 [P] [US2] PB · Several AE versions: the check names which it looked at, in `installer/lib/checks.mjs`.
- [ ] T033 [US2] PB · **Waits for spec 007** (its FR-059, D9): panel's Check setup entry runs the check and shows its lines, in `panel/main.js` and `panel/lib/`.

---

## Phase 4: Ready for a tester (US1 remainder, US5)

- [ ] T034 [US1] PB · **Waits for spec 007**: the panel shows the scripting setting's location with a picture when it's off (US1 scenario 6), in `panel/`. ASSUMES Q5. Mockup from the UI designer.
- [ ] T035 [US1] PB · **Coordinate with 007's FR-056**: `panel/lib/config.js`'s messages say `bash panel/install.sh`, which a learner must not see on a broken install (FR-022).
- [ ] T036 [US1] PB · The picture for the installer's last screen, in `installer/applet/`, with the asset from the UI designer. ASSUMES Q5.
- [ ] T037 [US1] PB · FR-024: name a developer install and offer replace or cancel, never touching the repo, in `installer/lib/preflight.mjs` and `payload.mjs`.
- [ ] T038 [US1] PB · Upstream Claude Bridge keeps working before and after install, with a test in `installer/test/`.
- [ ] T039 BL · ASSUMES Q3: enrol in Apple's Developer ID program. Can take days. Identity on the builder's Mac only.
- [ ] T040 [US1] PB · ASSUMES Q3: sign and notarize the applet and its Node binaries in `installer/build.mjs`; check Node still runs with no quarantine trouble after a real download.
- [ ] T041 [US1] BL · ASSUMES Q3: SC-008, on a Mac that has never opened it, from a real download.
- [ ] T042 [US5] EE · `product/evals/installer/release-gate.test.mjs`: refusal on a dirty tree, a low score, a missing run; a passing release records commit and results.
- [ ] T043 [US5] PB · `installer/build.mjs --channel release`: FR-025's gate, with reuse per its 2026-11-04 amendment, recording each set's results file in `release.json`.
- [ ] T044 EE $ · All six sets on A on the first tester's commit (four were measured on an older helper). Results in `product/evals/*/results/`.
- [ ] T045 Cockpit · **HELD on Q2, on purpose.** How a tester gets a key and who pays. The installer doesn't change; this is the handout and any spend limit, in `decisions/`. Blocks T048 only.
- [ ] T046 Cockpit · `decisions/006` says to revisit the name before anything reaches people outside this repo. Do that before the first tester.
- [ ] T047 [US1] BL AE $ · SC-006: spec 003 quickstart §4 a to f on an installed copy, no repo on the account.
- [ ] T048 [US1] BL · ASSUMES Q4: SC-001 with up to 3 testers via `/usage-session`. Depends on T041, T045, T047.

---

## Phase 5: Update (US3, P2)

- [ ] T049 [US3] PB · Show old and new versions; refuse older (FR-015, FR-017), in `installer/lib/preflight.mjs`.
- [ ] T050 [US3] PB · Update every part together, keep key and record, drop the old version folder only after success, in `installer/lib/payload.mjs`.
- [ ] T051 [US3] PB · FR-016: keep a copy before migrating, in `installer/lib/migrate.mjs`. No format change exists yet, so test with a made-up one.
- [ ] T052 [US3] EE · `product/evals/installer/update.test.mjs`: SC-004's record comparison across 3 updates.
- [ ] T053 [US3] BL AE · SC-004's live check of the panel's memory.

---

## Phase 6: Uninstall (US4, P3)

- [ ] T054 [US4] PB · `installer/lib/uninstall.mjs` from `install-state.json`, keep history by default; never touches debug mode or the upstream bridge (FR-019, FR-020).
- [ ] T055 [US4] PB · Uninstall from the downloaded app, in `installer/applet/installer.applescript`.
- [ ] T056 [US4] PB · Uninstall from the panel's Check setup screen, in `panel/`. Depends on T033.
- [ ] T057 [US4] EE · `product/evals/installer/inventory-diff.mjs`: SC-005, keep and remove.

---

## Phase 7: Polish

- [ ] T058 BL AE · An Intel run, if one wasn't in Phase 2 and an Intel Mac turns up.
- [ ] T059 PB · Audit `installer/parts.json` and folder names against FR-026 and FR-027.
- [ ] T060 PB · `installer/README.md`: how to build and what stays outside the repo.
- [ ] T061 SW · After Phase 2, reconcile this spec and plan with what T004 and T017 found, in `specs/006-installer/`.

---

## Dependencies

- T001 before everything. T002 and T003 before T004. **T004 passing before T006 onward.**
- T006 to T008 before T016 (the panel is signed, so its changes must be in first).
- T009 before T010, T011. T010 to T015 before T016. T016 before T017. T017 to T019 before T020.
- Phases 3 to 7 follow Phase 2. T033, T034 and T035 wait on spec 007. T045 waits on the builder and blocks only T048.

## Parallel

- After T005: T006, T007, T008, T015 at once, with T011, T012, T013 once T009 is in. All of T011 to T013 touch separate files.
- Only one AE sitting at a time: T004, T017, T018, T019.

## Implementation strategy

SC-002 first: T001 to T020. Then US2, since it's how every later fault is found, then a tester-ready build, then update and uninstall.

| Owner | Tasks | Count |
|---|---|---|
| PB | T002, T006–T014, T016, T022–T026, T028, T031–T038, T040, T043, T049–T051, T054–T056, T059, T060 | 35 |
| EE | T015, T027, T029, T042, T044, T052, T057 | 7 |
| BL | T003, T004, T017–T019, T021, T030, T039, T041, T047, T048, T053, T058 (and T001) | 13 + T001 |
| Cockpit | T005, T020, T045, T046 (and T001) | 4 + T001 |
| SW | T061 | 1 |

61 tasks. SC-002 path: 21, of which T021 is optional.
