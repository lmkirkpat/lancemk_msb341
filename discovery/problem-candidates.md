# Problem candidates: creative workflows

Working list from Sprint 1 ideation (2026-09-21). Direction chosen in `decisions/001`.
The next step is to test these, not build them.

## Candidates (all felt personally)

| ID | Problem | Rough product sketch | Notes |
|---|---|---|---|
| **1F** | Learning creative software is fragmented. YouTube has no structured teaching, courses are expensive, teachers are hard to find, and none of it happens inside my own projects in the apps I actually use. Felt with every Adobe app I've learned, and right now with After Effects. | An AI creative mentor. I describe my project and goal or upload screenshots, and it builds an ordered skill path around my own project, gives practice steps, and diagnoses problems from screenshots. A plugin inside the app is a stretch goal. | **Top candidate.** Adobe's AI assistants (Photoshop/Premiere beta June 2026, After Effects beta Sept 2026) do tasks for you and don't teach technique. Risk: Adobe adds a teach mode. |
| **1C** | Checking designs against brand standards by hand (colors, fonts, logo lockups, BYU brand guide). | Upload an export and get an audit of every issue with the fix. | **Safest fallback.** Narrow, easy to demo, and easy to build an eval set for. Less ambitious. |
| **1D** | Finding old assets in untagged shared drives. | The tool tags the library automatically, and people search it in plain English. | Enterprise asset-management tools, Lightroom and Google Photos partly cover this. |
| **1A** | Feedback scattered across email, Slack, PDF comments and conversations, merged into one change list by hand; contradictions between reviewers. | An agent that pulls every channel into one versioned revision checklist and flags conflicts. | Crowded: Frame.io, Filestage, Figma comments. |
| 1B | Vague design requests lead to many rounds of clarification. | An AI intake form that produces a complete creative brief. | Pairs with 1A. |
| 1E | Designers rarely document their process for portfolios. | A tool that drafts a case study from design versions and notes. | Lower frequency. |

## Two bets

- **Bet A: help the creative get better.** 1F: an AI mentor that teaches in context.
- **Bet B: help the creative ship faster.** 1A + 1C + 1D: a creative-operations copilot for
  one-person or in-house design teams. Start with one tool (probably 1C).

## Test plan (rest of Sprint 1)

1. **Manual self-test (do it by hand before building anything)**
   - Bet A: in my next After Effects session, skip YouTube. Give Claude my goal and screenshots
     and ask it to teach, not do. Log whether I learned faster and where it failed.
   - Bet B: on a current Geology project, have Claude merge the scattered feedback into one
     list and check the export against the BYU brand guide. Time both steps against my
     normal process.
2. **Interviews:** 3–5 per bet. Bet A: creatives who recently learned a new app. Bet B:
   campus designers or media staff who handle requests from others. Anonymize them
   ("in-house designer, BYU college").
3. **Score** each bet: pain and frequency · access to users · solo-buildable in a semester ·
   AI is central · fit with my PM/social-impact story. Weight the self-test result heavily.
4. **Decide:** write `decisions/002` and update the README and CLAUDE.md before Sprint 2.

## Self-test log

_(add entries: date, bet, what I tried, time taken, what worked, what broke)_

### 2026-09-23 — Bet A, self-test 1: kinetic-type intro

- **What I tried:** built an 8s vertical (1080×1920) kinetic-type intro in After Effects, cut
  to Noisestorm – Crab Rave, entirely from Claude's step-by-step instructions instead of
  YouTube. Starting knowledge: basic keyframes, nothing more.
- **Time taken:** ~29 minutes from first step to a working, audio-synced result (measured off
  screenshot timestamps), against my own estimate of 1–2 hours for something basic and usable.
- **What I built:** one text layer eased in/out on Position + Opacity, timed to the actual
  drop (confirmed against the audio waveform, not just by ear), plus a second line staggered
  onto a later beat (counted by ear once the waveform got too dense past the drop to read
  visually).
- **What worked:**
  - The actual hard part of learning from YouTube, for me, is knowing what to search for.
    Describing my goal in plain language and getting ordered, project-specific steps back
    solved that directly.
  - A taught pattern transferred within the session — I repeated Easy Ease and a paired-
    keyframe drag on the second line without being walked through it again.
  - Diagnosing my screenshots caught two things I'd have missed alone: a keyframe/playhead
    mismatch, and a Mac-specific F9/Mission Control shortcut conflict.
- **What broke / limits found:**
  - Reading the waveform visually only works for isolated transients (the drop itself). Past
    that, in a dense section, it's continuous noise — timing still comes down to my own ear/
    rhythm sense, which a screenshot can't verify.
  - What I made isn't usable on a real project — rough, two lines, no polish. That was
    expected for a "basic" bar.
- **Bottom line:** felt easier and faster than YouTube, and the understanding transferred —
  I could reapply the same principles (paired-keyframe timing, easing, cutting to a waveform)
  to a different project without re-explaining. Perceived effort matched actual time.
