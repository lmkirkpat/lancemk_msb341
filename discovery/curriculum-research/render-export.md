# Brief: Render and export (Render Queue, Media Encoder, H.264)

**AE version: unknown** (cockpit task did not say). Sources describe 2022 (23.0 beta) to 2026. Research date: 2026-10-20.
**Group D, wave 1.** Researcher: curriculum-researcher.

**Source note.** helpx.adobe.com returned 403 to direct fetches; Adobe claims come from search excerpts. **[B]** means background knowledge, not re-checked this session. Most "mistakes" evidence is from forum threads and blog posts and is weak.

## What it is

Getting finished work out of After Effects as a video (or image sequence) file. Two paths: the Render Queue with an Output Module, and sending the comp to Adobe Media Encoder (AME). Since AE 2023, H.264 (.mp4) can also be made from the Render Queue itself.

## Prerequisites

- A working comp with a sensible work area/duration. Nothing else is strictly required, so this skill can follow almost any other.
- Layers and comps; understanding that the comp's size, frame rate and duration drive the output.
- Relates to easing and keyframing only as the thing being exported; it is also where a learner first checks their motion at full quality.
- Relation to precomps and expressions: they render the same as in preview, but precomp duration issues and expression errors show up here (blank frames, missing animation).

## How it is usually taught, in order

1. Choose the right comp, set work area (B and N shortcuts) **[B]**.
2. Add to the Render Queue (Composition > Add to Render Queue, or File > Export > Add to Render Queue).
3. Render Settings and Output Module (format, codec, channels, audio on/off), Output To (destination).
4. Render.
5. Alternative: Add to Adobe Media Encoder Queue, choose an H.264 preset.

**Where good sources differ (show the designer):**

- Several beginner guides (Noble Desktop, CG Director, softwarehow-style how-tos) steer beginners to Media Encoder for MP4: wider codec choice (H.265, WebM), presets, and AME lets you keep working while it encodes. (Established teaching and blog posts.) One source reports AME renders being slower than the Render Queue was.
- Adobe's own help page, **last updated April 2026**, teaches exporting H.264 straight from the Render Queue (Output Module Settings > Format H.264), using AME's interface and encoding engine inside AE, with hardware and software encoding, and a default of "H.264 - Match Render Settings - 15 Mbps". It points to AME via Dynamic Link for finer control. (Adobe help, official.)
- Some posts (CG Director) say AE "got rid of" MP4 output; true of old versions (CC 2014 to 2022) and false since AE 2023. Their help is older than the feature. **This is the version trap from belief 16 in its cleanest form.**

## What beginners get wrong (and what it looks like)

Frequency unmeasured; counts are how many of my search results show it.

| Mistake | What a wrong result looks like | Source and strength |
|---|---|---|
| Output Module left at a lossless default (QuickTime Animation, or a ProRes) | 1080p file of several GB, huge and will not play smoothly or upload | Adobe forum thread plus a how-to; 3 of ~9 results (weak) |
| Wrong comp or wrong work area rendered | Output is shorter than expected or the wrong comp entirely, or the whole project length though only a clip was meant | [B] |
| Looking for H.264/MP4 in the Output Module in older help and not finding it, or vice versa | "AE cannot make MP4" is stated in help written for older versions, so learners go to AME needlessly; or an older UI is described | CG Director vs Adobe help (disagreement) |
| Black or blank output | Layer set as a Guide Layer is not rendered; a hidden or shy layer; or Premiere Pro/AME conflicts; a forum answer pointed to the Guide Layer right-click setting | Adobe forum threads (weak) |
| Resolution or frame rate mismatch | "Output file will be resized" warning; render frame rate in Render Settings differs from comp; audio drifts after changing frame rate | Adobe forum threads (weak); resized-warning is an encoder-limit effect |
| Audio missing | "Audio Output" unchecked in Output Module; a render called audio-only when video is off | Adobe forum thread (weak) |
| Rendering with Draft or low Resolution (Half/Quarter) | Soft, blocky output | [B] |
| Starting a render and using AE at the same time | AE locked until the render ends; any dialog or script blocked | `discovery/ae-bridge-findings.md`: the bridge "is blocked while AE renders or shows a dialog" |
| Expecting the file where the project is | Cannot find the output; default destination is wherever Output To points | [B] |
| Assuming the saved project contains the exported video | They have an `.aep`, not a movie; the deliverable does not exist | [B] |
| H.264 hardware encoding failing, driver or GPU errors | A render error number mid-way | AME/Render error threads in search results (weak, specific hardware) |

## Where it overlaps other AE concepts

- **Hidden layers.** A layer with its video switch off, or a guide layer, does not render. The preview a learner liked may not be what exports. The mentor's `enabled` read helps; guide layers (`layer.guideLayer`) are not in the snapshot.
- **Precomps.** A precomp shorter than its use renders as blank after it ends; a precomp set to be a guide layer is not rendered. Collapse Transformations and nested comps render at the nested size unless continuously rasterized **[B]**.
- **Expressions over keys.** Expression errors can produce blank or default values at render time while looking acceptable in preview; any expression with an error is a render risk. See `expressions-basics.md`.
- **Effects.** Heavy effects slow renders, and some fail on hardware encoding. Render uses full resolution for effects that scale with comp size **[B]**.
- **Single and hold keys, separated dimensions, easing.** No special interaction; they render as seen. A hold-key comp that looked right in preview will look right in export.
- **The product's own constraint.** AE does not answer the bridge while rendering, so the mentor cannot read state during a render. For long renders the AE MCP tools recommend `ae_render` with `wait false` and polling; any lesson that exports needs to hand control back to the learner (or accept polling) and cannot coach mid-render.

## What changed between versions (2022 to 2026)

- **AE 2023 (23.0), October 2022:** native H.264 export from the Render Queue added (first in beta build 23.0x11), reusing AME's UI and encoding engine. Before this, MP4 from AE required AME or QuickTime-based workarounds. (Adobe Community "Feature focus" post, Adobe staff, official but informal.)
- **Adobe's H.264 help page was last updated April 2026** and describes hardware and software encoding and the 15 Mbps default. Not all AME settings appear in AE; resolution, frame rate and color management still come from Render Settings or Output Module Settings. (Adobe help.)
- **2024 (24.x):** I found no H.264-specific change in the release notes I could reach. Unconfirmed.
- **2025 (25.0):** new interface and themes; menu looks differ from 2022 and earlier tutorials. (Secondary.)
- **26.x (2026):** no export change found in the 26.2, 26.3 or 26.5 summaries I could see; those summaries cover Object Matte, guides, 3D depth of field, ACES 2.0 color management (26.5). Color management changes (OpenColorIO 2.5.1, ACES 2.0) may affect export color settings. Not verified for export.
- **Net:** any tutorial written before late 2022 saying "use Media Encoder for MP4" is incomplete; any saying "the Render Queue cannot make MP4" is wrong for current AE.

## What the mentor could check

Reachable now:
- Which comp is the active one, its duration, frame size and rate (`snapshot_project` gives comp duration and frame rate).
- Layers with `enabled` false; layers that are guide layers (needs a small read).
- Whether any layer has an expression with an error.

Needs a new read (ExtendScript through `ae_run_script`, since the mentor tools do not expose it):
- The Render Queue items: status, comp, Output Module format and codec, output path, Render Settings quality and resolution, whether audio is on.
- Whether the output file exists and its size (needs a file read, possibly outside the mentor's scope).
- Preview frame of the rendered result versus comp (compare `ae_preview_frame`).

Signs of wrong: a render queue item whose Output Module is Animation or an uncompressed format; "Resolution: Half"; Output To pointing to the Desktop default or unknown folder; the queue item set to a different comp than the learner's; a queued item that is stuck on "Queued" while AE is waiting for a dialog.

## Open questions

1. Is a render lesson best placed last (a capstone: "get your animation out") or early (so the learner can share something)? Sources put it last; interview 008's 35-minute export failure (Photoshop/SVG, not AE) suggests export is a high-cost moment. Interview 008 is not about AE; treat as a pattern, not evidence.
2. Which path would a target learner actually take: RQ or AME? Depends on installed Creative Cloud apps.
3. Release notes for 24.x and 25.x export changes: could not reach Adobe's feature summary pages; needs a source fetch.
4. Teaching the mentor anything that writes to disk (render) may need a decision about the AE lock and permissions; not mine to decide.
5. Color management: how ACES 2.0 in 26.5 interacts with a default H.264 export is untested.

## Sources

| Title | Link | Version | Date | Strength |
|---|---|---|---|---|
| Exporting H.264 from the After Effects Render Queue (Adobe help) | https://helpx.adobe.com/bg/after-effects/desktop/render-and-export/export-h-264-from-the-after-effects/exporting-h264-from-the-after-effects-render-queue.html | current (2023 feature) | page updated Apr 2026, via search excerpt | Official, second-hand |
| Feature focus: exporting H.264 from the AE Render Queue, now available in AE 2023 (Adobe Community) | https://community.adobe.com/t5/after-effects-beta-discussions/feature-focus-exporting-h-264-from-the-after-effects-render-queue-now-available-in-ae-2023/m-p/13276298 | 23.0 | Oct 2022 | Official, informal |
| Export Options: Render Queue vs. Media Encoder (Noble Desktop) | https://www.nobledesktop.com/learn/after-effects/export-options-render-queue | not stated | not stated | Training provider |
| How to Export an MP4 from After Effects (CG Director) | https://www.cgdirector.com/export-mp4-after-effects/ | claims pre-2023 behavior | not stated | Single blog; out of date on RQ MP4 |
| Black screen after rendering the video (Adobe forum) | https://community.adobe.com/questions-529/black-screen-after-rendering-the-video-69571 | not stated | not stated | Weak |
| AE renders videos too big of a filesize (Adobe forum) | https://community.adobe.com/t5/after-effects-discussions/after-effects-renders-videos-too-big-of-a-filesize-how-to-reduce-filesize/m-p/9585272 | older | not stated | Weak |
| What's new in After Effects (Adobe help) | https://helpx.adobe.com/id_en/after-effects/desktop/what-s-new/whats-new.html | 26.2 to 26.5 | 2026 | Official, second-hand |
| Repo: `discovery/ae-bridge-findings.md` | local | n/a | 2026-09-28 | Product evidence |
| Interview 008 | `discovery/interviews/008-freelance-web-graphic-designer.md` | n/a | 2026-10-12 | Product evidence |
