# Spec 001: After Effects MCP bridge test

**Status:** Done
**Date:** 2026-09-28

## Problem

The mentor has to see the user's real project to teach inside it. The product description
and `decisions/002` both assume it can do that by reading the live After Effects project
through an MCP bridge. That assumption is untested. Adobe's own assistant said it couldn't
see keyframe ease values (`discovery/competitors.md`), and ease is exactly the kind of detail
a mentor needs to check a user's work. The architecture choice (web app, plugin, or
MCP-connected app) in `decisions/003` depends on what a bridge can and can't read.

## What we're making

A local test of a community bridge,
[LiamcKerr/after-effects-mcp](https://github.com/LiamcKerr/after-effects-mcp) (v1.1.0, MIT),
connected to Claude Code and run against `Claude AE Tutor Test.aep` in After Effects 2026
(26.5). The results go in the table below and become the "what the bridge can and can't
read" note in the Sprint 2 plan.

For each item, record **Works**, **Partial**, or **No**, plus how it was read (a built-in
tool, or a custom ExtendScript through `ae_run_script`) and anything surprising.

| # | What to read | Why the mentor needs it | Result | How / notes |
|---|---|---|---|---|
| 1 | Bridge status, open project, active comp | Know what the user is working on | Works | `ae_status`: AE 26.5, project path, unsaved flag, active comp, render queue. `ae_list_items` lists comps and footage with ids. |
| 2 | Comps and layers (names, types, order, parenting) | Talk about the user's project in its own terms | Works | `ae_comp_info`: index, name, kind, in/out, transform, keyframe counts, selected layers, current time. It leaves out parenting when there is none, so parent came from a script (`layer.parent`). |
| 3 | Keyframes: count, times, values per property | Check animation work | Works | Counts from `ae_comp_info`. Times and values need a script (`keyTime`, `keyValue`) that walks every property. |
| 4 | Temporal ease (speed and influence, in and out) | Check easing, the first skill we'd teach | Works | Script: `keyInTemporalEase` and `keyOutTemporalEase` give exact speed and influence. Read the test file as Easy Ease on every key (speed 0, 33.3%). This is the thing Adobe's assistant said it couldn't see. |
| 5 | Spatial interpolation and keyframe type (linear, Bezier, hold) | Explain motion paths and holds | Works | Script: in and out interpolation type, spatial tangents, roving, auto-Bezier, continuous. |
| 6 | Effects applied and their settings | Teach effects in context | Works | The test file had no effects, so a script added Gaussian Blur, read name, matchName, enabled, and every parameter value, then removed it in the same undo step. Group parameters (Compositing Options) come back null and need a deeper walk. |
| 7 | Expressions on properties | Teach and debug expressions | Works | Same add, read, remove approach. Reads the expression text, the enabled flag, the evaluated value, and AE's full error message for a broken one. That's useful for debugging help. |
| 8 | Text layer content and styling | Common beginner work | Works | Content from `ae_comp_info`. Font, size, fill, stroke, tracking, and leading from a script (`TextDocument`). Justification comes back as a raw enum number (7413), so it needs mapping. |
| 9 | Preview a frame as an image | Show and compare visually | Works | `ae_preview_frame` returns a PNG that Claude can see. At 3.6 s it showed "moving text" running off the right edge, a real teaching moment the numbers alone wouldn't show. |
| 10 | Notice what the user just changed (read, user edits, read again) | Check practice attempts | Works | Same script before and after, then compare. Without being told, it found the one change: "Test" Position key 2 moved 2.500 s to 2.567 s (2 frames), and Opacity key 2 stayed at 2.500 s, so the fade now ends before the move. AE doesn't send change events, so the mentor has to take a snapshot and compare, and it only sees what changed, not how the user did it. |
| 11 | Write a change and undo it (for example, ease one keyframe) | "I do" step of I do, we do, you do | Works | Script: `setTemporalEaseAtKey` changed ease-in influence 33.3% to 80%, and a read-back confirmed it. One Edit > Undo restored 33.3%. The undo showed up under a different label than the `undo_name` the bridge set ("Claude: ease ..."), so a mentor can't count on telling the user "look for Undo Claude: ...". |

## Out of scope

- Choosing the architecture. That's `decisions/003`, written after this test.
- Building any of the mentor (teaching, memory, practice).
- Other bridges, other apps (Resolve, Blender), the After Effects Beta, and Windows.
- Rendering and importing, beyond a single frame preview.

## Definition of done

- [x] Bridge installed and `node scripts/doctor.mjs` passes with After Effects 2026 open
- [x] Every row in the table has a result and a note
- [x] A short summary below: what this means for the architecture, and setup friction a
      user would hit
- [x] Results committed before `decisions/003` is written

## Results summary

All 11 rows work. The bridge reads everything the mentor needs, including exact temporal ease,
which Adobe's assistant said it couldn't see. The one gap is that change detection means
polling and comparing.

**What it means for the architecture (`decisions/003`):**

- The bridge's built-in tools only cover the basics (status, item list, layer summary, frame
  preview). Anything deeper, such as keyframe times, ease, interpolation, effect parameters,
  expressions, and text styling, came from custom ExtendScript through `ae_run_script`. In
  practice the limit is the ExtendScript DOM, not the bridge. The mentor needs its own
  "project snapshot" script, and that is a small piece of code it owns, whichever
  architecture wins.
- A frame preview plus the numbers covers both the look and the detail. The preview caught a
  layout problem (text running off the frame) that the numbers didn't show.
- Noticing practice attempts works by taking a snapshot before and after and comparing them. It
  can say what changed, but not how the user got there or when, unless it polls.
- Writing works and lands as one undo step, so "I do" (the mentor makes the change and the user
  can undo it) is possible. Don't rely on the undo label the user sees.
- Surprises to handle: some values come back as raw enum numbers (justification 7413,
  interpolation 6613), group parameters read as null, and any script that opens a dialog
  freezes AE until someone clicks.

**Setup friction a user would hit:** clone a GitHub repo, have Node 18+, run `install.sh`,
which turns on unsigned-extension loading (PlayerDebugMode) for six CEP versions, restart AE,
and register the MCP server with Claude Code. `doctor.mjs` makes it diagnosable, but that's a
developer's install, not a designer's. The target user (a solo or in-house designer) won't
do this. If the product rides on this approach, it needs a packaged, signed extension or a
one-click installer.
