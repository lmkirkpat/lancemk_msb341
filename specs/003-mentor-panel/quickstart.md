# Quickstart: Mentor Panel in After Effects

How to install the panel and prove spec 003 works. Steps a–f are the same lesson script as
`specs/002-easing-slice/quickstart.md` §4, run from the panel. Details are in
[data-model.md](data-model.md) and [contracts/](contracts/), not repeated here.

## Prerequisites

- Spec 002 set up and working: bridge installed, AE 26.4+ with "Allow Scripts to Write Files and
  Access Network" on, `/ease-mentor` runs in Claude Code (`specs/002-easing-slice/quickstart.md`
  §1–§4).
- Claude Code installed and signed in (`claude` works in Terminal).
- `discovery/Claude AE Tutor Test.aep` with the **Mentor Practice** comp.

## 1. Install the panel

```sh
bash panel/install.sh
```

Expected: `OK` lines for the CEP link (`AEMentorPanel`) and for `panel.json` with the `claude`,
`node` and repo paths. Restart AE. **Window > Extensions > AE Mentor** opens the panel.

## 2. Unit tests (no AE, no cost)

```sh
cd panel && npm test
```

Covers the stream mapping, check list, stage, path, memory, safe text rendering, and that eval
cases 17–20 use the strings in `requests.js`. Mentor tests are unchanged: `cd mentor && npm test`.

## 3. Drive the adapter from Terminal (fixture mode, no AE)

```sh
node panel/dev/drive.js --fixture before
```

Runs the same adapter the panel uses against the mentor's fixture mode and prints each event.
Expected: `turn_start`, a `tool_call` or `text_delta` within 10 s, `tool_call snapshot_project`, `tool_result`
with JSON, `turn_end` with a cost. Type `check` or `show_me` to send button requests. This is the
fastest way to debug the stream without AE.

## 4. Live lesson in the panel (US1, SC-001 to SC-003, SC-005)

Open AE on the test project, open the Mentor Practice comp, open the panel. **Don't type in any
terminal from here to the end of step f.**

| Step | Do | Expect |
|---|---|---|
| a. Opening | Press **Start lesson** | Mentor's opening in the panel names the linear pairs and proposes a focus. Stage: I do. Memory and path filled from the record |
| b. Explain with a frame | Ask "Why does it look mechanical?" in Ask the mentor | Explanation with a frame from the comp, inside the panel |
| c. Demo | Press **Show me** | One pair eased in AE; mentor names it and says Edit > Undo reverses it. Button now reads **Show me again**. Stage: We do |
| c2. Again | Press **Show me again** | Re-explanation with a frame. **Nothing changes in AE** (check the timeline) |
| d. Partial | Ease one of the remaining pairs in AE, press **Check my work** | List: demo row, your row ✓, the rest linear ✗. Mentor hint, no fix. Stage: You do |
| e. Hint | Press **Hint** | A more specific hint. Nothing changes in AE |
| f. Complete | Ease the rest, press **Check my work** | All rows eased. Lesson passed. Stage all done. Memory updates without reopening. Path: Easing done, Graph Editor next |

Then compare each check list with the Graph Editor in AE and log it in
`discovery/usage-notes/mentor-panel.md` (SC-002 needs 10 checks: at least 3 partial, 2 outside
the lesson, 1 undone; spread them over several lessons).

## 5. Same mentor as the evals (R2)

```sh
node product/evals/easing/run.mjs --only 17
node product/evals/easing/run.mjs --only 20
```

Expected: both pass. Then the full set once (`node product/evals/easing/run.mjs`), with at least
80% passing and cases 01–16 at their previous rate or better (SC-007). Commit the results file.

## 6. Edge cases (spot check)

| Do | Expect |
|---|---|
| Rename `panel.json`, reopen the panel | Plain message with the fix, nothing starts (FR-015) |
| Quit the bridge (or close AE's scripting access), press Check my work | "Can't see After Effects" notice; the last list greyed as "from your last check" |
| Switch to another comp, press Check my work | Mentor asks to switch back; no new list |
| Close the panel mid-lesson, reopen it | **Continue lesson** offered; continuing shows the earlier messages and frames |
| Quit and reopen AE, open the panel | No continue; new lesson; memory as recorded |
| Click Check my work twice fast | One turn; buttons disabled while the mentor works |
| Dock the panel narrow | No horizontal scroll; messages wrap |
| Delete `learner.json` (back it up first) | "No lessons yet"; lesson starts as a first lesson |

## 7. Speed and cost (SC-004)

```sh
node panel/dev/turns.js
```

Expected: the share of turns whose first activity (a status line or words) came within 10 s
(target: at least 9 of 10), lesson durations (SC-005), and the cost per lesson. Copy both into the usage notes. If SC-004 fails, that's the `decisions/005`
signal to look at option A sooner.

## 8. Usage notes (SC-008)

After at least 2 panel lessons, write in `discovery/usage-notes/mentor-panel.md` whether the panel
changed how you learn compared with the terminal, and whether you reached for Adobe's assistant
instead.
