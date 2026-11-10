# Sprint 4 Plan

**Goal:** I will have an overhauled UI for the mentor panel that makes lessons easier to follow
and more engaging for the user. The UI will incorporate new curriculum flows built on the new
skills added during sprint 3. I will also have the option A runtime (the panel calls the Claude
API directly, `decisions/009`) and an installer built that will allow other users to download and
install Knack on their own devices.

**Why this:** The curriculum is in a solid place right now, but the actual usability still needs
work. All of the testing in Sprint 3 was done inside of Claude Code, not inside of the Knack panel
that users would actually use. Because of this, I need to merge the existing panel and the
curriculum design to make them one cohesive product. The installer is needed to set me up for
testing with real users.

**Done looks like:**

- [x] All six skills run as live lessons inside the new panel. Done 2026-11-09 on B1 (T028, T056 to T060,
      `discovery/usage-notes/ui-overhaul.md`); easing's T028 notes lack a stale count and row-by-row agreement
- [ ] A usage session comparing the new panel with the current one, checked against spec 007's
      success criteria
- [ ] The option A runtime built, with easing and pivot proven on it; the rest before the first tester (`decisions/011`, changed 2026-11-04)
- [x] Knack installed with the installer on a fresh macOS user account with only After Effects
      installed (spec 006 SC-002). Done 2026-11-09: 3 of 3 runs `all_working` (two standard, one admin; Apple
      silicon only, with a Rosetta stand-in for Intel), `discovery/usage-notes/installer-sc002.md`. Not yet proven:
      notarization, outside testers, a lesson on an installed copy, faults, update, uninstall
- [x] Carry-over from Sprint 3: eval baselines for the five new skills (key types, speed graph,
      offset, set the pivot, move a group with a null). Done 2026-10-28 to 10-29, every set meets
      SC-006 (`discovery/usage-notes/pacing-rebaselines.md`)
- [ ] Carry-over from Sprint 3: the five skills' live reviews (T035, T038, T040, T240, T343)
- [ ] Stretch: an outside tester downloads and installs Knack on their own device with the
      installer

**Predicted difficulty:** 4
