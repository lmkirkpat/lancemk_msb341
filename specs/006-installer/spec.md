# Feature Specification: Installer for Knack on a Mac

**Feature Branch**: `006-installer` (spec folder only; written on the agent branch
`worktree-agent-aea15d2ef802ee561`)

**Created**: 2026-10-20

**Status**: Approved 2026-10-20. Plan and tasks come next. Q1 is answered: option A, recorded in
`decisions/009-ship-runtime-option-a.md` (amends `decisions/005`). Still open: Q2 to Q5.

**Input**: Cockpit task, sprint 3 (`sprints/sprint-3-plan.md` › Done looks like › specs › an
installer): "an installer that lets someone who isn't a developer set up Knack on a Mac", covering
the bridge, the panel, the `ae-mentor` server and its Node runtime, the model runtime
(`decisions/005`), the runtime folder, the learner record folder, updates, uninstalling, checking
that setup worked, and what would survive a UXP rebuild.

**Why this spec**: today setup is built for developers (`discovery/ae-bridge-findings.md` › Use it,
or build our own?). Getting Knack running means cloning the repo, having Node 18+ and Claude Code
signed in, running `bash bridge/install.sh` and `bash panel/install.sh` in Terminal (which turn on
unsigned-extension loading for every Adobe app), ticking an After Effects preference by hand,
restarting AE, and running `node bridge/scripts/doctor.mjs` to see if it worked
(`specs/002-easing-slice/quickstart.md` §1, `specs/003-mentor-panel/quickstart.md` §1). No
designer in the target market will do that. So the two beliefs that most need a learner other than
the builder can't be tested yet: belief 7 (people take the result over the lesson) needs a
target-market learner on the panel (`CLAUDE.md` › Next steps 3), and memory and practice across
sessions, the part Adobe can't easily copy (`CLAUDE.md` › Positioning), only show up when someone
uses Knack for days on their own Mac. That makes keeping the learner record safe through updates and
reinstalls a first-class requirement here, not housekeeping: losing it throws away the product's
main difference.

## Which runtime this installer targets

`decisions/005` chose B1 (the panel drives headless Claude Code) for the prototype and said
shipping to others needs option A (the panel calls the Claude API directly). **This spec targets
option A**, decided in `decisions/009` (2026-10-20, amends 005; B1 stays for the builder's own
prototype until A is built). The reasons, as 009 records them:

- **B1 can't go to other people.** Each learner would need Claude Code installed and signed in,
  which is the most developer-shaped step on the list, and `decisions/005` › B1 cons flags that a
  third-party product may not offer claude.ai login to its users (still to check). An installer
  that installs Claude Code would make that step easier for a product that can't ship that way.
- **The installer is the "panel becomes the product" signal** in `decisions/005` › What would
  change our mind. Its first use is to put Knack on someone else's Mac.
- **A has a likelier UXP future** (`decisions/005` › Tradeoffs: B1 spawns processes, which UXP
  probably won't allow).

The cost: option A isn't built. The direct-API runtime (an adapter behind the seam in
`panel/lib/adapter-claude-code.js`, with the evals retargeted at it) is **its own build spec, not
this one** (number to be assigned by the cockpit). This installer depends on it for User Story 1,
and treats the runtime as one replaceable part (FR-004), so the parts that don't depend on it
(Stories 2 to 4, and the developer install in FR-024) can be planned and built first.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install Knack and start a first lesson without Terminal (Priority: P1)

I'm a designer with After Effects on my Mac. I download one file, open it, and follow a few
screens written in plain words. It tells me what it will put on my Mac before it does, asks for
the one thing it needs from me (the access key I was given, Q2), and tells me when to restart After
Effects. When AE opens again, I go to Window > Extensions > Knack, press **Start lesson** on my own
comp, and the mentor opens the lesson. I never open Terminal, install Node, install Claude Code,
or change a hidden setting myself.

**Why this priority**: it's the whole point. Without it no target-market learner can use Knack
alone, so belief 7 and memory across sessions stay untested.

**Independent Test**: on a Mac user account that has never had Knack, a developer tool, Node or
Claude Code on it, with After Effects 26.4+ installed, a tester who isn't the builder installs
from the downloaded file and reaches the mentor's opening in the panel, with the builder watching
and not helping.

**Acceptance Scenarios**:

1. **Given** a Mac with After Effects and nothing else from this project, **When** I open the
   downloaded file, **Then** the installer runs without asking me to use Terminal, and macOS shows
   no warning beyond its standard "downloaded from the internet" prompt (Q3).
2. **Given** the installer's first screen, **When** I read it, **Then** it lists in plain words
   what it will add (the Knack panel and its connection to After Effects, the mentor, and a folder
   for my progress) and that it sends lesson text and frames from my comp to the model provider
   during lessons.
3. **Given** After Effects is open while I install, **When** the installer reaches the step that
   needs AE closed, **Then** it asks me to quit AE and waits, and never force-quits it.
4. **Given** I've entered my access key, **When** the installer checks it, **Then** it tells me
   whether it works before finishing, and if it doesn't, says what to do in plain words.
5. **Given** installation finished, **When** I restart AE and open Window > Extensions > Knack on
   a comp with keyframes, **Then** the panel opens with no setup message, and **Start lesson**
   produces the mentor's opening.
6. **Given** After Effects' "Allow Scripts to Write Files and Access Network" setting is off,
   **When** I open the panel, **Then** the panel shows me where the setting is and how to turn it
   on, with a picture, before a lesson can start (Q5).

---

### User Story 2 - Check that setup worked, and get told how to fix what didn't (Priority: P1)

When something's wrong (the panel says it can't see After Effects, or the mentor can't start), I
press **Check setup** in the panel, or open it from the installer's last screen, and get a short
list: each part of Knack, whether it's working, and for anything that isn't, one plain sentence
on what to do. If I'm still stuck, I can copy a report to send to whoever gave me Knack, and it
holds nothing personal.

**Why this priority**: interview 007 found the biggest time sink is finding what broke. An
installer that fails silently, on a Mac the builder can't see, is that same pain. It also comes
first in build order: it's how every other story is tested.

**Independent Test**: on an installed Mac, break one thing at a time (the faults in SC-003) and
run the setup check after each. It's complete if each break is named with its fix, and nothing
that works is reported as broken.

**Acceptance Scenarios**:

1. **Given** everything works and AE is open, **When** I run the setup check, **Then** every line
   shows as working, and it finishes within 15 seconds.
2. **Given** AE isn't running, **When** I run the setup check from the installer, **Then** the
   checks that need AE say "open After Effects to check this" rather than failing, and the rest
   still run.
3. **Given** one part is broken, **When** I run the setup check, **Then** that line says what's
   wrong and what to do in plain words, with no file paths, field names, error codes or commands
   to type (spec 003 FR-017's rule, applied here).
4. **Given** the check found a problem it can fix itself (for example, a missing folder or a part
   from an older version), **When** I press **Fix**, **Then** it fixes only that part, without
   Terminal, and runs the check again.
5. **Given** I press **Copy report**, **When** I paste it, **Then** it holds the versions, each
   check's result, and the macOS and AE versions, and no access key, account name, real name,
   email, phone, or folder path that includes my Mac user name.

---

### User Story 3 - Update Knack without losing my progress (Priority: P2)

When a new version is out, I download it and open it the same way. It sees Knack is already
installed, tells me which version I have and which I'm getting, replaces only Knack's own parts,
and keeps my lessons, my access key and my settings. After the update, the panel's memory shows
the same lessons as before.

**Why this priority**: memory across sessions is one of the parts Adobe can't easily copy. An
update that wipes the record breaks the product's promise to that learner for good. Needed before
a tester's second version, not before their first install.

**Independent Test**: install version N, finish a lesson so the learner record has entries, then
install version N+1. Compare the learner record before and after, and open the panel's memory.

**Acceptance Scenarios**:

1. **Given** Knack is installed with a learner record, **When** I install a newer version,
   **Then** the learner record is unchanged, the access key still works without asking again, and
   the panel's memory shows the same lessons.
2. **Given** the newer version changes the learner record's format, **When** I update, **Then** a
   copy of the old record is kept next to it before anything changes, and the panel reads the
   migrated record without error.
3. **Given** I open an older installer than the version I have, **When** it starts, **Then** it
   says a newer version is already installed and stops without changing anything.
4. **Given** a lesson is open in the panel, **When** I start an update, **Then** the installer asks
   me to quit After Effects first; nothing from the unfinished lesson is recorded (spec 003 edge
   case, AE quits mid-lesson).
5. **Given** an update finished, **When** I run the setup check, **Then** every part reports the
   new version, and none is left at the old one.

---

### User Story 4 - Uninstall Knack, and choose whether my progress stays (Priority: P3)

If I'm done with Knack, I run the uninstaller from the same downloaded file (or from the panel's
Check setup screen). It asks whether to keep my lesson history, and removes everything else it
added: the panel, the connection to After Effects, the mentor, and the stored access key. It
leaves alone anything it didn't add.

**Why this priority**: a tester has to be able to leave cleanly, and the privacy promise
(constitution Principle IV) includes removing what we stored. It's not needed for the first
lesson.

**Independent Test**: list every file, Keychain item and system setting before install, after
install, and after uninstall (keep history, then again with remove history). Compare.

**Acceptance Scenarios**:

1. **Given** Knack is installed, **When** I uninstall and choose to keep my history, **Then**
   everything Knack added is gone except the learner record folder, and the uninstaller says where
   the history is kept, in plain words.
2. **Given** I uninstall and choose to remove my history, **Then** the learner record folder is
   removed too, and nothing Knack added is left.
3. **Given** I had another After Effects extension that relies on a system setting Knack never
   changed (for example, the upstream Claude Bridge and its debug setting), **When** I uninstall
   Knack, **Then** that extension still works.
4. **Given** I uninstall and later install again with history kept, **When** I open the panel,
   **Then** the memory shows my earlier lessons.

---

### User Story 5 - The builder makes a release only from a version that passed its evals (Priority: P2)

As the builder, I make the installer file with one command from a clean commit. It refuses unless
that commit's mentor passed its eval set at the required rate, and it records which commit and
which eval results file it was built from, so I know the lesson a tester gets is the lesson I
measured.

**Why this priority**: constitution Principle III, and `decisions/005`'s reason to keep the evals
honest. Without it a tester could get an untested mentor. It's needed before any release, but not
to try the installer on the builder's own Mac.

**Independent Test**: try to build a release from a commit with no passing eval results, then from
one with them. The first is refused with a reason; the second produces an installer whose version
info names the commit and results file.

**Acceptance Scenarios**:

1. **Given** a commit whose latest full eval run, against the runtime the installer ships, is
   below the eval set's target, **When** I build a release, **Then** it's refused with the score
   and the target.
2. **Given** uncommitted changes in the repo, **When** I build a release, **Then** it's refused.
3. **Given** a release was built, **When** I or a tester runs the setup check, **Then** it shows
   the version, and the copied report includes the commit it came from.

---

### Edge Cases

- **A developer install is already there** (the builder's Mac: symlinks from `bridge/install.sh`
  and `panel/install.sh`, PlayerDebugMode on, `panel.json` pointing at the repo). Both installs
  can't load at once (same extension identities). The installer names what it found and offers to
  replace it or cancel; it never deletes or edits the repo, and keeps the existing learner record.
- **The upstream Claude Bridge is installed** (spec 002 research R1). It keeps working, before and
  after install and uninstall.
- **After Effects isn't installed, or is older than the supported version.** The installer says so
  before installing anything and stops.
- **Several After Effects versions are installed.** Knack loads in every supported one; the setup
  check names which versions it checked.
- **No admin password.** A designer on a university or company Mac may not have one. The install
  works without it (FR-013); if a managed Mac blocks the install outright, the installer or setup
  check says the Mac's management settings are blocking it and to ask IT, rather than failing
  silently.
- **No internet during install.** Everything installs; the key check says it couldn't reach the
  service and will retry from the panel; the setup check shows it as not yet checked, not broken.
- **The access key stops working later** (revoked, spend limit reached). The panel says the
  mentor can't start and points to Check setup, which names the key as the cause (spec 003 FR-015's
  rule).
- **The bridge's port is taken** by another program. The setup check names it as "something else
  is using Knack's connection to After Effects" and the fix.
- **Adobe turns CEP off by default** (Dec 2028) or removes it (Dec 2029). The setup check
  recognises that the panel can't load for that reason and says so, rather than reporting a
  generic missing panel.
- **The learner record is unreadable** (corrupt or edited by hand). The installer and update never
  overwrite it. The setup check reports it as unreadable and keeps it (the 2026-10-12 agent audit
  fix: unreadable is not empty).
- **Two macOS users on one Mac.** Each user's install and learner record are their own.
- **Disk full or the install is interrupted.** Either the install finishes or the previous state
  is kept; a re-run completes it. The learner record is never left half-written.
- **Apple silicon and Intel Macs.** Both work.

## Requirements *(mandatory)*

### Functional Requirements

**Install**

- **FR-001**: Knack MUST install from one downloaded file on macOS, with no Terminal, no repo
  checkout and no developer tools. Every step a person does is a click, a typed access key, or
  restarting After Effects.
- **FR-002**: The installer MUST put in place every piece a lesson needs: the After Effects pipe
  (the forked bridge in `bridge/`), the panel (`panel/`), the mentor tools (`mentor/`) and the
  skill text they serve, the private Node runtime they run on (FR-003), the model runtime
  (FR-004), and the learner record folder (FR-009). After it, the panel opens with no setup
  message (spec 003 FR-015's messages never show on a good install).
- **FR-003**: Any Node runtime Knack needs MUST be private to Knack: installed with it, used only
  by it, and removed with it. The installer MUST NOT require Node to be installed, MUST NOT change
  the user's PATH or shell files, and MUST NOT replace or depend on a Node the user already has.
- **FR-004**: The model runtime MUST be option A (`decisions/009`), and the installer MUST treat it
  as one replaceable part, so swapping runtimes changes that part and not the rest of the installer.
  For option A: the installer asks for an access key once, checks it works before finishing, and
  stores it only in the macOS Keychain, never in a file, the extension folder, a log or the copied
  report. The installer MUST NOT install Claude Code.
- **FR-005**: The installed product MUST NOT depend on the repo, and no builder file may reach a
  learner's lesson: no `CLAUDE.md`, auto-memory, sprint notes, eval fixtures or test settings
  (the same rule `panel/lib/runtime.js` enforces for the builder's own panel runs). The installed
  copy holds only what lessons need.
- **FR-006**: The installed extensions MUST load in After Effects with Adobe's default security
  settings. The installer MUST NOT turn on loading of unsigned extensions (PlayerDebugMode),
  because that setting lowers security for every Adobe app on the Mac.
- **FR-007**: The installer MUST say before installing what it will add and that lesson text and
  frames from the learner's comp are sent to the model provider during lessons, and MUST NOT
  install anything before the person agrees.
- **FR-008**: The "Allow Scripts to Write Files and Access Network" AE setting MUST either be set
  for the person or shown to them step by step with a picture (Q5), and the setup check MUST verify
  it once AE is open.
- **FR-009**: The learner record folder MUST be created if missing and kept if present, in the same
  place the mentor already uses (`~/Library/Application Support/AEMentor/`), so an existing record
  carries over. The installer MUST NOT write, reset or reformat an existing record except by the
  migration in FR-016.
- **FR-010**: The installer MUST ask the person to quit After Effects when a step needs it closed,
  and wait; it MUST NOT force-quit AE.
- **FR-011**: The installer MUST check before installing that macOS and After Effects are versions
  Knack supports, and stop with a plain message if not.
- **FR-012**: Install MUST be safe to re-run: running it again on a working install leaves it
  working and the learner record unchanged. An interrupted install MUST leave either the previous
  state or a state a re-run completes.
- **FR-013**: Install MUST work for a standard (non-admin) macOS user, affecting only that user's
  account.
- **FR-014**: The installer MUST be signed and notarized so macOS opens it with no warning beyond
  its standard prompt for downloaded files (pending Q3).

**Update**

- **FR-015**: Opening a newer installer over an installed Knack MUST update every Knack part to the
  new version together, show the old and new version numbers, and keep the learner record, the
  stored access key and the person's settings.
- **FR-016**: If a new version changes the learner record's format, the update MUST keep a copy of
  the old record before changing it, and the migrated record MUST read correctly in the panel and
  the mentor.
- **FR-017**: An installer older than the installed version MUST stop without changing anything.

**Uninstall**

- **FR-018**: Knack MUST be uninstallable without Terminal, from the downloaded file or from the
  panel's setup screen.
- **FR-019**: Uninstall MUST remove everything Knack installed or stored (extensions, mentor,
  private runtime, config, Keychain item, runtime and cache folders), and MUST ask whether to keep
  the learner record, keeping it by default.
- **FR-020**: Uninstall MUST NOT change anything Knack didn't add: other extensions, other
  extensions' settings, PlayerDebugMode if something else set it, and the upstream Claude Bridge.

**Check setup**

- **FR-021**: A setup check MUST be reachable from the installer's last screen and from the
  panel, with no Terminal, and MUST report, for each part: the macOS and AE versions; that each
  extension is in place and loads; that the bridge answers (when AE is open); the AE scripting
  setting (FR-008); that the model runtime is reachable and the access key works; that the learner
  record folder can be written and the record can be read; that every part is the same version;
  and whether After Effects can still load this kind of extension (the CEP shutdown edge case).
  It replaces `node bridge/scripts/doctor.mjs` for learners; the doctor stays for development.
- **FR-022**: Each failing line MUST say what's wrong and what to do in one or two plain sentences,
  with no paths, field names, error codes or commands. Checks that need AE open MUST say so rather
  than fail when it's closed. Where a fix is safe to do automatically (FR-012 re-run of one part,
  a missing folder), the check MUST offer it as a button.
- **FR-023**: The setup check MUST offer **Copy report**: versions, the release's commit, and each
  check's result, with no access key, real names, emails, phone numbers, or paths containing the
  Mac user name (constitution Principle IV). Knack MUST NOT send the report or any usage data
  anywhere on its own.

**Builder and release**

- **FR-024**: The builder's developer install (`bridge/install.sh`, `panel/install.sh`, running
  from the repo) MUST keep working for development and evals. The installer MUST detect it, name
  it, and offer to replace it or cancel, never deleting or editing the repo (edge case).
- **FR-025**: A release MUST be built by one command from a clean commit, and MUST be refused
  unless that commit has a full eval run, against the runtime the release ships, at or above the
  eval set's target (spec 002 SC-006: 80%). The release MUST record its version, commit and eval
  results file, and the setup check MUST show the version.

**Built to survive a UXP rebuild**

- **FR-026**: The installer MUST keep the After Effects-side parts (the bridge and panel
  extensions, their loading and their checks) separate from the parts that live outside AE (mentor
  tools, private runtime, model runtime, access key, learner record, setup check, update and
  uninstall), so a UXP rebuild replaces the AE-side part and keeps the rest (see the table below).
- **FR-027**: The parts outside AE MUST NOT be named or organised as After Effects-only, so another
  app's pipe can be added next to the AE one (`decisions/002`, across apps; `decisions/003` ›
  Mentor tools row › Later).

### What survives a UXP rebuild

After Effects' UXP public beta is due Nov 2026; CEP is off by default Dec 2028 and removed Dec
2029 (`discovery/ae-bridge-findings.md` › CEP vs. UXP). What the beta allows is unknown, so this
table is a design target to re-check against the spec 001 re-run (`CLAUDE.md` › Next steps 4).

| Part | On UXP | Why |
|---|---|---|
| Download, signing and notarization of the installer itself | Survives | A macOS concern, not an Adobe one |
| Learner record folder, its format, migration and backup | Survives | Lives outside AE (`decisions/003`) |
| Access key in Keychain, key check | Survives | Belongs to the model runtime, which is outside AE |
| Model runtime (option A) | Survives, maybe moves | Plain HTTPS. If UXP can make network calls, it can run in the panel; if not, in a local helper (`decisions/005` › UXP signal) |
| Mentor tools and private Node runtime | Survives if a local helper exists | Findings: UXP probably can't run a local server, so a UXP plugin would connect *out* to a local helper. Then the installer also installs and starts that helper |
| Setup check framework, the report, update and uninstall flows | Survives; the AE lines change | Only the AE-side checks are CEP-specific |
| CEP extension placement and signing | Replaced | UXP plugins install as `.ccx` files or through Adobe's marketplace, which may do this part for us |
| PlayerDebugMode handling | Goes away | Already avoided by FR-006 |
| Bridge listening on localhost inside AE | Replaced | Probably reversed: the plugin connects out to the helper |
| AE scripting setting (FR-008) | Unknown | Depends on whether UXP reaches ExtendScript |
| B1 (Claude Code) runtime | Doesn't survive | Spawns processes (`decisions/005`); one more reason this spec targets A |

### Key Entities

- **Release**: one installable version of Knack: a version number, the commit it was built from,
  the eval results file it passed (FR-025), and the version of each part.
- **Part**: one thing the installer puts in place (AE pipe, panel, mentor tools, private runtime,
  model runtime, learner record folder). Each has a version, an AE-side or outside-AE label
  (FR-026), and its own setup check line.
- **Setup check result**: one line per check: part, working / not working / needs AE open / not yet
  checked, and a plain fix. The copied report is a list of these plus versions.
- **Access key**: the credential the model runtime uses (Q2). Lives only in the Keychain.
- **Learner record**: as in spec 002. The installer creates its folder, never its contents, and
  only touches it to migrate (FR-016) or, if asked, remove it (FR-019).
- **Install inventory**: the list of every file, folder, Keychain item and setting a release adds,
  which uninstall and SC-005 check against.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a moderated usage session (`/usage-session`), at least 2 of 3 testers who aren't
  developers and aren't the builder go from the downloaded file to the mentor's opening in the
  panel in 15 minutes or less, unassisted, with zero Terminal use. *Measured by:* a person (the
  builder observing), timed, logged in `discovery/usage-notes/`.
- **SC-002**: On a fresh macOS user account with only After Effects installed, install then setup
  check passes every line, in 3 of 3 runs (at least one on Apple silicon, one on Intel if
  available, and one without admin rights). *Measured by:* scripted test on a clean account,
  setup-check output saved.
- **SC-003**: For each of these faults, the setup check names the right cause with a plain fix: AE
  scripting setting off, bridge extension missing, panel extension missing, AE closed, access key
  wrong, no internet, learner record folder not writable, learner record unreadable, parts at
  mixed versions, bridge port taken, CEP loading disabled. Target: 11 of 11 named correctly, and no
  false failures on a working install. *Measured by:* fault-injection tests (automated where the
  fault can be faked without AE), plus the builder reading every message against FR-022.
- **SC-004**: Across at least 3 updates (including one that changes the learner record's format),
  the learner record is unchanged, or migrated with the old copy kept, in 3 of 3, and the panel's
  memory shows the same lessons after as before. *Measured by:* integration test comparing the
  record before and after, plus one live check in the panel.
- **SC-005**: After uninstall, comparing the Mac's files, Keychain and settings before install and
  after uninstall shows nothing left from the install inventory (except the learner record when
  kept), and nothing changed that Knack didn't add. *Measured by:* inventory diff test, run for
  both keep and remove.
- **SC-006**: The lesson a tester gets is the lesson that was measured: every release names a
  passing full eval run against its runtime (at least 80%), and quickstart steps a–f
  (`specs/003-mentor-panel/quickstart.md` §4) pass on an installed copy with no repo on the Mac.
  *Measured by:* the release command's refusal test (US5) plus one live run by the builder.
- **SC-007**: No installed file, log, cache or copied report contains the access key, a real name,
  email or phone number, or a path with the Mac user name. *Measured by:* an automated scan of the
  install inventory and a sample report after a full lesson.
- **SC-008**: macOS opens the downloaded installer showing only its standard "downloaded from the
  internet" prompt, with no trip to System Settings. *Measured by:* a person, on a Mac that has
  never opened it, on the current macOS release.

## Assumptions

- **First users:** a small group of invited testers (at most 5, from the target market), not a
  public download (Q4). Support is the builder reading copied reports.
- **Platform:** macOS only, current and previous major releases, After Effects 26.4 or later (the
  versions the slice was tested on). Windows scripts exist in `bridge/` but are untested and out of
  scope.
- **Folder names stay as they are** (`AEMentor`, `AEMentorBridge`, the `com.aementor.*` bundle
  IDs) in this release, so the builder's existing learner record carries over. A rename to Knack is
  a later change with its own migration; `decisions/006` is tentative anyway.
- **Container:** CEP for this release, knowing it's retired. FR-026 keeps the rebuild contained.
- **Updates are manual:** the person downloads and opens the newer file. The panel shows its
  version; it doesn't check for updates.
- **Unsigned is a developer-only path:** the builder's `install.sh` scripts keep PlayerDebugMode
  for development; signed extensions are only for releases.
- **New tools for packaging and signing** (an Apple Developer ID, an extension signing
  certificate, packaging tools) are dependencies the plan must ask for (constitution Principle V).

## Out of Scope

- Building the option A runtime and retargeting the evals at it (its own build spec; this spec
  depends on it).
- A B1 build for other people, or installing Claude Code for anyone.
- Windows; Linux.
- A UXP plugin, `.ccx` packaging, or an Adobe marketplace listing (re-check after the Nov 2026 beta).
- Automatic or background updates, update notifications, and any server the installer talks to
  other than the model provider.
- Accounts, sign-up, payment, pricing, or spend dashboards (belief 12 is a separate question).
- Usage analytics or crash reporting sent anywhere.
- Installing or updating After Effects, and installing on Macs managed by IT (MDM) beyond saying
  when management blocks it.
- Renaming internal folders and bundle IDs to Knack.
- Other apps' pipes (FR-027 only keeps the door open).
- Changes to teaching, the skill, or the mentor's tools.

## Dependencies and decisions this spec relies on

- **Constitution 1.1.0.** Principle II: the installer adds no teaching logic and no new way to
  touch the project; the panel still only reads the learner record. Principle III: FR-025 and
  SC-006. Principle IV: FR-023, SC-007. Principle V: packaging and signing tools are new
  dependencies to ask for.
- **`decisions/002`**: across apps (FR-027).
- **`decisions/003`**: the three layers (thin AE pipe, mentor tools, teaching outside AE) map onto
  FR-026's AE-side and outside-AE split.
- **`decisions/005`**, amended by **`decisions/009`** (2026-10-20): 009 acts on 005's "panel
  becomes the product" signal and chooses option A for shipped Knack (Q1). 005's open check on
  claude.ai login for shipped products is part of why.
- **`decisions/006`**: says to revisit the name "before anything ships to people outside this
  repo". The first tester release is that moment.
- **The option A runtime build spec** (number to be assigned): User Story 1 and SC-001, SC-006 can't
  pass until it exists. Stories 2 to 4, FR-024 and FR-025 can be planned without it.
- **Specs 002 and 003** as shipped: the learner record, the panel's setup messages (003 FR-015),
  and the quickstart lesson used by SC-006.

## Open Questions

Each changes the spec. Recommended answer first.

1. **Runtime: option A, or a B1 tester build first?** **Answered 2026-10-20: A**, recorded in
   `decisions/009-ship-runtime-option-a.md` (amends 005). The option A runtime is its own build
   spec, number from the cockpit. The reasoning as asked: *Recommended: A.* B1 can't go to other
   people (Claude Code install and sign-in, and the unchecked claude.ai-login policy), and won't
   survive UXP. The cost is that User Story 1 waits for the option A build. The alternative, a B1
   build for at most 5 testers who already have Claude Code, gets a learner on the panel sooner
   (belief 7) but means the installer installs or checks Claude Code, and its runtime part is
   thrown away later.
2. **Where does the access key come from?** *Recommended: the builder issues one key per tester,
   each with its own spend limit, revocable.* Testers don't create an Anthropic account, the
   builder sees cost per tester, and a leaked key costs at most its limit. Alternatives: each
   tester brings their own key (a developer-shaped step, and a pricing signal for belief 12), or
   one shared key built in (rejected: `decisions/005` › A cons says anything in AE can read it).
3. **Pay for Apple's Developer ID (yearly fee) so the installer is notarized?** *Recommended: yes,
   before the first tester.* Without it, recent macOS blocks the file and the tester has to
   approve it in System Settings › Privacy & Security, which fails SC-008 and is exactly the
   developer-shaped step this spec removes. If no, FR-014 and SC-008 become a picture-guided
   bypass, and SC-001's time target likely needs loosening.
4. **Who is the first release for?** *Recommended: at most 5 invited target-market testers
   (for example, people from interviews 006–008), not a public download.* That keeps support to
   copied reports, makes per-tester keys (Q2) workable, and is what belief 7 needs. A public
   download would add update notifications, a support channel, terms and a privacy notice to scope.
5. **Set AE's "Allow Scripts to Write Files and Access Network" for the person, or guide them?**
   *Recommended: guide them, with a picture, and verify it in the setup check.* Setting it means
   editing After Effects' own preferences file while AE is closed, which changes between AE
   versions and could damage the person's AE settings. Guiding costs one click-through in SC-001's
   15 minutes.
