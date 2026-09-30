# Competitors: Adobe's AI assistants and other ways people learn creative apps

Researched 2026-09-28 for `decisions/002`. The question: **does anything already *teach*
creative software inside the user's own project?** If Adobe does, Bet A's gap is gone.

## Short answer

Adobe's own framing is the most useful finding. Adobe agrees the tools are hard to learn,
but its answer is to **remove the need to learn**, not to teach:

> "We have the opportunity ... to remove some of the friction in learning this large catalog
> of tools we have and bring all of that value to our customers at their fingertips."
> (Adobe VP, on the Firefly AI Assistant, [TechCrunch, Apr 2026][tc-firefly])

> Photoshop's PM said the company "viewed the AI tool as a way to automate tasks, rather than
> a guide to teach you the software." ([DPReview, Jun 2026][dpr-ps])

Every assistant is built around *do it for me*. But **answering how-to questions in the app
already exists**: InDesign advertises it, and my hands-on test showed the After Effects
assistant will give clear step-by-step instructions without doing the work if you ask it
to. Teaching isn't what Adobe is aiming for, but in-app Q&A is already available.

## Adobe's AI assistants, app by app

All are free public betas as of Sept 2026, with usage limits and no announced pricing.

| App | Status | What it does | Teaches? |
|---|---|---|---|
| **After Effects** | Public beta, Sept 2026 (IBC). Not in the shipping 26.5 release | Works across the whole project: reorganizes layers and files, writes and debugs expressions, fixes broken rigs, edits text layers, spell-checks and translates, generates media with Firefly. Two modes: approve each action, or auto-approve. Sees single-frame screenshots. Users report 10+ minute waits on complex tasks | **Not by design, but it does it well when asked.** Pitched as handling "tedious, technical and multi-step tasks." My hands-on test (below) showed it gives step-by-step instructions, checks my work against the actual project, and suggests an ordered list of what to learn next |
| **Photoshop** | Web and mobile beta Mar 2026, desktop beta Jun 2026 | Natural-language edits ("remove the photobomber," "make this Instagram-ready"), background swaps, resizing, layer organization, explaining error messages, identifying fonts | **No,** by Adobe's own statement. It describes the edits it makes, as a side effect |
| **Premiere** | Public beta, Jun 2026 | Prep work before the creative edit: sorting footage into bins, renaming and labeling clips, transcripts, markers, stringouts and first cuts | **No.** Focused on organization and assembly |
| **Illustrator** | Public beta, Jun 2026 | Production work: versioned files from a spreadsheet, reorganizing layers, export prep, production checks, saved reusable "Skills," can "suggest workflows needed for your goal" | **Mostly no.** Suggesting workflows is the closest it gets |
| **InDesign** | Public beta, Apr 2026 | Layout setup, bulk text, image, and style edits, **and how-to answers**: "ask ... 'How do I create a table of contents?' and learn as you go," "instant, in-context answers without leaving the app" | **Partly.** In-app Q&A, but reactive. No skill path, no practice, no checking your work |
| **Firefly AI Assistant** | Web beta, Apr 2026 | Coordinates tasks across Photoshop, Premiere, Lightroom, Express, and Illustrator. Learns your *preferences* over time | **No.** "Learning" means the tool learning about you, not you learning the tool |
| **Frame.io, Express, Photoshop Elements** | Betas | Asset organization and feedback (Frame.io), template editing (Express), consumer photo editing (Elements) | Not checked in depth. The Elements help page blocked access |
| **Adobe in Claude and Gemini** | Sept 24, 2026 | Photoshop, Illustrator, Premiere, Lightroom, InDesign, Express, Firefly, Stock, and Acrobat tools callable from a Claude chat (fewer in Gemini). **After Effects is not included** (rechecked 2026-09-29, after Adobe Developers Live Day 1). Works on cloud assets at the Express/Firefly level, not local desktop project files, so it can't stand in for an AE bridge | **No.** "Describe the outcome you want and call on our tools." |

## Adobe's non-AI learning features

- **Photoshop Discover panel:** search for tools, in-app tutorials, and "Quick Actions." Clicking
  a result shows a "floating blue guiding mark" pointing at the tool. This is the closest
  existing *visual* in-app guidance, but it's a generic tutorial library, not tied to your
  project.
- **Premiere's built-in learning:** interview 003 tried it and found it "not as much [help] as
  what I was doing."

## Everything else

- **YouTube plus a general chatbot (ChatGPT, Gemini, Claude):** the real competitor according
  to interview 003 and my own self-test. It's free and flexible. The downsides: YouTube is
  generic, the chatbot isn't visual, and you already need some knowledge to know what to ask.
- **Courses (Udemy, Skillshare, Domestika, LinkedIn Learning):** structured and visual, but
  generic, built around practice projects, and paid. "Updated for 2026 with AI" means
  teaching Adobe's AI features, not AI-powered teaching.
- **AI plugins for other apps (Figma copilots, etc.):** all about generating or doing, not
  teaching.
- **AI tutor startups for creative software:** the only one found is a generic Blender
  chat tutor that can't see your project (see the non-Adobe section). None found that teach
  inside the user's own project. That could be a limit of web search, so it's worth a manual
  check on Product Hunt and in design communities.

## After Effects assistant: hands-on test (2026-09-28)

Tested in the After Effects beta on the self-test 1 project, asking it to teach rather than do.

1. **"Teach me" (easing text in):** fairly clear step-by-step instructions, and it didn't take
   over the task.
2. **"Can you check my work to make sure I followed the instructions correctly?"**
   - Read the real project state, not a screenshot: exact keyframe frames (64→75, 93→104),
     durations, distance (1078 px), opacity, and the 29-frame stagger between layers.
   - Confirmed the two layers matched, that Position and Opacity lined up, and that the move
     was "snappy," with a fix if it felt abrupt. Tied the feedback back to its own earlier
     instructions ("match both layers," "step 2").
   - **Limits it named itself:** it can't see ease settings (Influence, speed graph), so it
     taught me how to check them myself with the Graph Editor and asked me to report back.
     It also couldn't compare against my earlier version ("I can't compare this to your
     timing from before").
3. **"What should I learn next for this project?"**
   - Described my project correctly (vertical comp, two staggered text layers, music track)
     and gave **six skills in order**, each tied to it: sync to the music with markers,
     motion blur (because the move is fast), overshoot, text animators, nulls and parenting,
     and exporting for vertical video. Recommended starting with #1 and #2.
   - Offered to walk through any of them step by step.
   - For deeper learning it pointed to **generic resources**: the Learn panel, Adobe Learn,
     help pages, and the forum.

**Verdict:** on request, the assistant already does most of what Bet A describes: in-project
instructions, checking work, and an ordered skill path. Because it reads project data
directly, it sees details a screenshot-based web app can't.

**What it didn't do, from this test:**
- **Take the lead.** It only taught, checked, and suggested because I knew to ask. A user
  who says "make this" gets it done for them (belief 7).
- **Remember across sessions.** It had no record of my earlier attempt, no progress
  tracking, nothing about what I've already learned.
- **Help skills stick.** No practice or review later on. Deeper learning got handed off to
  generic tutorials.
- **Work outside Adobe or after the beta:** After Effects beta only, with daily limits and
  pricing not yet announced.

## What this means for Bet A

1. **The gap is smaller than the marketing suggests.** Adobe says teaching isn't the goal,
   and none of its announcements mention it. But the hands-on test showed the After Effects
   assistant gives feedback on your work and a skill path when asked. Judge Adobe by what
   the tools do, not what the announcements say.
2. **Adobe confirms the problem.** Its own leadership calls the tool catalog a learning
   burden. That supports the problem even though their solution goes the other way.
3. **Most of Bet A's core loop is already available, if the user asks.** The hands-on test
   showed in-project instructions, checking work against real project data, and an ordered
   next-skills path, all free in the After Effects beta. None of that sets Bet A apart
   anymore. What's left: **taking the lead** (teaching without being asked), **memory and
   progress across sessions**, **practice so skills stick** (belief 2, and "I'm already
   rusty" from interview 003), and **apps Adobe doesn't cover**. The product would have to
   stand on those, and they're easier for Adobe to add than the core loop was.
4. **"Do it for me" is getting free and good.** That makes belief 7 (under deadline, people
   want the result) sharper. Bet A has to target people who *want* the skill, or show why
   learning beats delegating. Delegating also has its own weaknesses: slow, limited daily
   use, and unreliable on complex motion work.
5. **The plugin question now has a competitor angle.** Adobe's assistants live *inside* the
   app. A separate web app starts at a disadvantage against that (see belief 6).

## Non-Adobe apps (checked 2026-09-28)

| App | Built-in AI assistant? | Teaches? | Can an outside tool read the project? |
|---|---|---|---|
| **Figma** | Yes: Figma Design Agent, beta since May 2026, on the canvas. Generates and edits designs, gives design and accessibility feedback, summarizes comments | **Yes, Q&A.** The docs say "You can ask how-to questions directly in the chat," with answers drawn from the Help Center | Yes, Figma has opened the canvas to outside agents |
| **DaVinci Resolve** | **No built-in chat assistant.** AI is limited to specific features. v21.1 (Sept 9, 2026) added a **built-in MCP server** so Claude, Claude Code, or ChatGPT Codex can analyze projects, organize media, adjust settings, and render | No | **Yes, officially,** but only in **Resolve Studio** (paid). Python scripting also moved to Studio only |
| **Blender** | **No official assistant.** Add-ons: BlendAI (one-click "Feature Explain" for settings and nodes), Vibe4D (chat that can read and edit the scene), 3D-Agent. Separate "AI Blender Tutor" (My Clever AI): generic chat lessons, no view of your scene, subscription | Add-ons explain features. The tutor product teaches but isn't tied to your project | Yes, through Blender's open Python API; add-ons already do it |
| **Final Cut Pro** | **No assistant.** Apple added AI *features* (Generate Captions, Edit Detection, Auto Mask; Creator Studio, Jun 2026), not a chat | No | Limited. It's a closed app without an agent-friendly way in |

### The access finding: my tool could read the project too

The hands-on test's biggest advantage for Adobe was that its assistant reads real project
data while my product would rely on screenshots. **That advantage isn't exclusive:**

- **After Effects:** several community MCP servers (for example
  [LiamcKerr/after-effects-mcp][ae-mcp-liam], tested against AE 26.4 and 26.5) use a CEP panel
  and ExtendScript to let Claude inspect comps, read layer properties, preview frames, and
  run scripts. They're community-built, not official, and the user has to install a panel.
  ExtendScript can also read keyframe ease values, which Adobe's own assistant said it
  couldn't see. Confirm this before relying on it.
- **Resolve:** an official MCP server (Studio only).
- **Blender:** an open Python API, with community MCP bridges.

So a Claude-based tutor could see the user's actual project in After Effects, Resolve, and
Blender, which would remove the screenshot disadvantage.

### What this means

1. **Every app's own assistant covers one app, works when asked, does the task first, and
   has no memory.** Figma and InDesign answer how-to questions. After Effects answers,
   checks work, and suggests a path when asked. None of them tracks what you've learned
   across sessions, let alone across apps.
2. **Where a gap remains:** a **teaching layer that works across apps**, with a record of
   what the user knows that carries from After Effects to Resolve to Blender. It would
   connect to each app through MCP bridges instead of competing on a single app's built-in
   access. No app maker has a reason to build a tutor that works across competitors' apps.
3. **Least crowded apps:** Resolve (official MCP but no built-in assistant) and Blender (no
   official assistant, a huge self-taught community living on YouTube). Final Cut is hard
   to connect to.
4. **Caveats:** relying on community bridges for After Effects is fragile and adds setup.
   Resolve's MCP needs the paid Studio edition. I can't build for Blender or Resolve from
   my own experience yet. The "works across apps" angle needs interviewees who actually
   use more than one app, which interview 003 hinted at.

## Open follow-ups

- [x] **Hands-on test (2026-09-28):** see "After Effects assistant: hands-on test" below.
- [ ] Check the Photoshop and Premiere assistant help pages directly (blocked for automated
      access) for any how-to or Q&A ability.
- [ ] Check what an After Effects MCP bridge can actually read (ease values, keyframes, effects)
      with a quick local test before choosing a stack.
- [ ] Manual search for AI tutor startups for creative software (Product Hunt, r/AfterEffects,
      design Discords).

## Sources

- [CG Channel: After Effects 26.5 and new AI Assistant][cg-ae]
- [CineD: After Effects AI Assistant enters public beta][cined-ae]
- [Adobe Community: New in After Effects Beta, AI Assistant][adobe-ae]
- [Adobe Blog: Premiere and After Effects innovations, Sept 8 2026][adobe-blog-sep]
- [Adobe News: creative agent expansion, Jun 2026][adobe-jun]
- [DPReview: Photoshop's AI assistant comes to desktop][dpr-ps]
- [TechCrunch: AI assistant for Photoshop, Mar 2026][tc-ps]
- [Adobe Community: AI Assistant live in InDesign 21.4 beta][adobe-id]
- [Adobe Help: AI Assistant in Illustrator beta][adobe-ai]
- [TechCrunch: Firefly AI Assistant][tc-firefly]
- [Adobe Blog: Adobe in Gemini and Claude, Sept 24 2026][adobe-claude]
- [Adobe Help: Photoshop Discover panel][adobe-discover]
- [Adobe Help: Premiere AI Assistant overview][adobe-pr]

- [Resolve 21.1 MCP integration (CineD)][resolve-mcp]
- [Figma agent help: how-to questions][figma-agent]
- [TechCrunch: Figma adds AI assistant to canvas][figma-tc]
- [Best AI tools for Blender 2026][blender-tools]
- [AI Blender Tutor][blender-tutor]
- [Final Cut Pro Creator Studio AI update (CineD)][fcp]
- [After Effects MCP server (community)][ae-mcp-liam]

[cg-ae]: https://www.cgchannel.com/2026/09/adobe-releases-after-effects-26-5-and-new-ai-assistant-in-beta/
[cined-ae]: https://www.cined.com/adobe-after-effects-ai-assistant-enters-public-beta-whole-project-scope-expression-rigs-and-project-cleanup/
[adobe-ae]: https://community.adobe.com/announcements-532/new-in-after-effects-beta-after-effects-ai-assistant-1635658
[adobe-blog-sep]: https://blog.adobe.com/en/publish/2026/09/08/generate-create-directly-in-your-timeline-with-new-ai-powered-innovations-in-premiere-after-effects
[adobe-jun]: https://news.adobe.com/news/2026/06/adobe-unveils-major-expansion
[dpr-ps]: https://www.dpreview.com/news/1952544048/adobe-photoshop-ai-assistant-desktop-beta/
[tc-ps]: https://www.techcrunch.com/2026/03/10/adobe-is-debuting-an-ai-assistant-for-photoshop/
[adobe-id]: https://community.adobe.com/announcements-670/ai-assistant-is-now-live-in-indesign-21-4-beta-1557550
[adobe-ai]: https://helpx.adobe.com/illustrator/desktop/use-ai-assistant/about-using-ai-assistant-in-illustrator.html
[tc-firefly]: https://techcrunch.com/2026/04/15/adobes-new-firefly-ai-assistant-can-use-creative-cloud-apps-to-complete-tasks/
[adobe-claude]: https://blog.adobe.com/en/publish/2026/09/24/adobe-comes-to-gemini-expands-what-you-can-do-in-claude
[adobe-discover]: https://helpx.adobe.com/photoshop/desktop/get-started/learn-the-basics/access-discover-panel.html
[adobe-pr]: https://helpx.adobe.com/premiere/desktop/premiere-ai-assistant/overview.html
[ae-mcp-liam]: https://github.com/LiamcKerr/after-effects-mcp
[resolve-mcp]: https://www.cined.com/davinci-resolve-21-1-released-ai-assistant-integration-via-mcp-individual-hdr-trims-and-python-scripting-moves-to-studio/
[figma-agent]: https://help.figma.com/hc/en-us/articles/37998629035799-Work-with-the-Figma-agent-in-design-files
[figma-tc]: https://techcrunch.com/2026/05/20/figma-adds-an-ai-assistant-to-its-collaborative-canvas/
[blender-tools]: https://www.3daistudio.com/blog/best-ai-tools-for-blender-2026
[blender-tutor]: https://mycleverai.com/ai-blender-tutor
[fcp]: https://www.cined.com/apple-creator-studio-update-adds-generate-captions-edit-detection-and-auto-mask-to-final-cut-pro/
