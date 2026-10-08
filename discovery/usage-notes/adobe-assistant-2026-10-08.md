# Adobe's After Effects assistant: comparison session, 2026-10-08

Evidence for the SC-007 note in `easing-slice.md` (spec 002 T047). Run by the builder right after
the T046 mentor lesson, in the AE beta's built-in assistant, on the same comp (**Mentor
Practice** in `discovery/Claude AE Tutor Test.aep`) and in the same order as a mentor lesson:
overview, explain, teach, check, demo, "do the rest". Times are local (MDT). The project was
reverted afterwards and not saved, so Mentor Practice is unchanged.

The transcript below is as pasted by the builder, with the assistant's "Reasoning" labels
removed. It holds no names or personal paths.

---

**Learner (12:17):** Give me a clear, concrete overview of what you can help with in After
Effects—the kinds of tasks you can take on, what you can inspect or change directly, and where
you'll ask before acting. Group it so I can quickly see what's useful: understanding a project,
organizing and cleaning it up, fixing expressions and errors, and prepping for render or
handoff. Use plain language and short examples of the kinds of requests I could make. If it
would help, offer to inspect my current project as a next step, but don't change anything yet.

**Assistant:**

I'll pull up my capability reference so this overview matches what I can actually do.I mainly
help with four things: making sense of a project, organizing and cleaning it up, writing and
fixing expressions, and getting a project ready to render or hand off. I can also generate
images or video for a comp when you ask. I work directly inside your open project, so I check
what's actually there instead of guessing.

1. Understanding a project
I can read your comps, layers, precomps, effects, markers, footage and fonts, and explain how
they fit together.

"What's in this project, and which comp is the main one?"
"Explain how the precomps in 'Main_Edit' are nested."
"Which layers in this comp have effects or expressions on them?"
"Why is this layer invisible at 3 seconds?"
For a broad question I start with a quick overview and go deeper only where you point me.

2. Organizing and cleaning up
I can make these changes directly:

Renaming: "Rename these layers to match our naming style (BG_, TXT_, FX_)."
Color labels: "Label all text layers yellow and all adjustment layers purple."
Folders: "Put all footage in a Footage folder and precomps in a Precomps folder."
Restructuring: "Precompose the logo layers," "Reorder layers so the background is at the bottom."
Cleanup: "Remove unused footage," "Consolidate duplicate footage."

3. Expressions and errors
Explaining: "What does the expression on this Position property do?"
Writing: "Make this layer wiggle gently, with a slider to control how much."
Linking: "Link the opacity of these five layers to one control."
Debugging: "Find any broken expressions in this comp and fix them."
Motion rigs: springs, bounces, orbits, oscillations and similar, driven by expressions.

4. Prepping for render or handoff
Preflight check: "Check this project before I send it." I look for missing footage, missing
fonts, broken expressions and similar problems.
Effects audit: "Why does this render differently on another machine?" I look for missing,
outdated or non-GPU effects.
Spellcheck: "Proofread all the text layers."
Render queue: "Add 'Final_Comp' to the render queue and render it to my desktop."
Motion Graphics Templates: "Let editors change the title text and color in Premiere," then
export as a .mogrt.

Where I ask before acting
Generating images or video: I always describe what I plan to make and wait for your OK.
Unclear requests: if a request could mean several things and the choice really changes the
result (for example, two comps with similar names), I'll ask which one you mean.
Small unstated details like timing or color: I pick a sensible value and tell you what I chose,
so you can change it.
Your limits: if you say "just look" or "don't change anything," I stick to that.
Otherwise, when you ask for a change I make it and then report exactly what I did. That
includes deleting or restructuring things. Each change can be undone in After Effects, so if a
request covers a lot of a project, it's worth saying "show me first."

What I don't do
I work only inside After Effects, not in other apps. I'm best at building, editing and fixing
things you direct. I won't design a whole animated sequence on my own unless you ask me to
build one.

Next step
I can take a quick look at your current project and summarize what's in it: comps, structure,
and any obvious issues like missing footage or broken expressions. I won't change anything.
Want me to do that?

**Learner (12:32):** can you explain why my comp looks mechanical right now

**Assistant:**

Mostly it comes down to timing that is too even. Nearly every move is exactly 1 second long,
nothing overlaps much, a constant spin runs nonstop, and after about 3 seconds almost nothing
moves. I read the keyframes and expressions in "Mentor Practice" (the comp open in your viewer)
and didn't change anything.

What's making it feel mechanical

1. Every move lasts the same 1 second.
Subtitle: 0.3 to 1.3s
Title: 0.5 to 1.5s
CTRL null: 0 to 1s
Bar trim: 0.2 to 1.2s
The start times are staggered a little, but each move lasts the same and travels at a similar
rate, so it reads like a metronome. Natural motion varies durations: small elements settle
fast, big ones take longer.

2. On the Title, scale and opacity start and finish on the same frames. Both run 0.5 to 1.5s.
When several properties land together, the move feels assembled rather than performed.
Offsetting them by a few frames, like letting opacity finish early, usually loosens it up.

3. The Title and Subtitle are moving twice. Both are parented to CTRL, which drifts up 40px from
0 to 1s while they run their own position keys. Those stacked moves don't share timing, which
can make the settle feel slightly off.

4. The Bar changes speed abruptly halfway. Its X Position covers 500px in the first 0.6s, then
only 260px in the next 0.6s. If that middle keyframe isn't smoothed, you get a visible jolt at
0.6s instead of one continuous decelerating slide.

5. The cursor fades instead of blinking, then disappears. Its opacity ramps evenly between 100
and 0 every 0.5s, so it pulses rather than blinks. A real cursor snaps on and off, which means
hold keyframes. It also stops at 2.5s and stays hidden.

6. The logo spins at a constant rate forever. Its rotation has an expression, time * 30, which
overrides the two rotation keyframes (0 to 90 over 2s). So those keyframes do nothing, and the
logo turns at exactly 30° per second for the whole comp. A constant-speed loop is one of the
most "machine-like" motions there is.

7. The comp is mostly still after about 3 seconds. The comp is 8 seconds long, but everything
except the logo spin finishes by 3s. Five seconds of a static frame plus one constant rotation
feels like the animation stopped and a machine is idling.

8. Motion blur is off on every animated layer, so fast moves like the Bar slide look crisp and
step-y.

One thing I couldn't confirm
My check doesn't show the easing type on keyframes (linear vs. Easy Ease, or custom curves). If
those keys are linear, that's likely the biggest cause on its own. You can confirm in the Graph
Editor: flat-topped speed curves mean easing, and boxy or flat-line speed means linear.

If you want me to fix it
Each of these is quick, and I can do any or all:

Add ease-out or overshoot curves to the Title, Subtitle, Bar and CTRL moves, and vary their
durations.
Offset the Title's opacity from its scale.
Smooth out the Bar's middle keyframe.
Switch the cursor to hold keyframes and keep it blinking through the comp.
Replace the logo's constant spin with an eased rotation, or remove the expression so its
keyframes work.
Add a subtle idle move after 3s, or trim the comp shorter.
Turn on motion blur.
Tell me which ones you want, or say "do all of it," and I'll go stage by stage so you can watch
each change.

**Learner (12:35):** can you teach me how to ease the frames without doing it for me?

**Assistant:**

Here's a hands-on walkthrough using the layers in your "Mentor Practice" comp. I won't touch
anything; you do every step.

1. Find your keyframes
Select a layer and press U to show only its animated properties.
Select all layers and press U to see every keyframe in the comp at once.
Diamond-shaped keyframes are linear (constant speed, sudden stops). Hourglass shapes are eased.
Squares are holds.

2. Quick easing with shortcuts
Select one or more keyframes, then:

| Shortcut | What it does | Use it on |
|---|---|---|
| F9 | Easy Ease, slows into and out of the keyframe | Keyframes the layer passes through or rests on |
| Shift+F9 | Easy Ease In, slows arriving at the keyframe | The keyframe where a move lands |
| Ctrl+Shift+F9 (Win) / Cmd+Shift+F9 (Mac) | Easy Ease Out, slows leaving the keyframe | The keyframe where a move starts |

The names trip people up. "In" means coming into that keyframe, so put it on the end keyframe.

Try it: select the Title layer, press U, select all its keyframes and press F9. Scrub the
timeline and compare with how it looked before.

3. The Graph Editor (where the real feel comes from)
Easy Ease is only a starting point. The Graph Editor lets you shape the curve.

Click the Graph Editor button in the Timeline, or press Shift+F3.
Click a property name (for example, the Title's Position) so only its curve shows.
Right-click in the graph and pick Edit Speed Graph. This is the easiest view to learn on.

How to read the speed graph:
The height is how fast the layer is moving.
A flat horizontal line is linear, constant speed: robotic.
A hill shape is eased: it starts slow, speeds up and slows down.
A hill leaning left (fast start, long slow finish) is the classic smooth ease-out that most UI
and title animation uses.

How to shape it:
Select a keyframe in the graph. Yellow handles appear.
Drag a handle horizontally to change its influence, meaning how long the ease lasts. The
default is 33%.
To get that snappy-then-settling feel, drag the landing keyframe's handle left toward 70 to
90%, and keep the start keyframe's handle short.

Try it: on the Subtitle's Position, make the speed curve shoot up early and glide down slowly
to the end keyframe. Scrub it and it should feel like it "lands."

4. Precise values (optional)
Right-click a keyframe and choose Keyframe Assistant > Keyframe Velocity, or press Ctrl+Shift+K
(Win) / Cmd+Shift+K (Mac). You can type the influence directly, which is handy for matching
several layers exactly.

5. Fixes for specific problems in your comp

Bar (speed jump at 0.6s) That middle X Position keyframe is causing the jolt. Two options:
Right-click the middle keyframe and choose Rove Across Time. AE then retimes it so the speed
flows smoothly through it.
Or delete the middle keyframe and let one eased move go from 200 to 960.
The Bar's position is split into separate X and Y, so its X curve shows on its own in the Graph
Editor, which is easier to edit.

Cursor (pulsing instead of blinking)
Select all six opacity keyframes and press Ctrl+Alt+H (Win) / Cmd+Option+H (Mac) to switch them
to hold keyframes. They snap on and off instead of fading.
To keep it blinking past 2.5s, copy and paste those keyframes further along, or Alt/Option-click
the Opacity stopwatch and type loopOut().

Title (scale and opacity finish together) After easing them, drag the opacity end keyframe
about 4 to 6 frames earlier. It fades in fully, then the scale finishes settling. Small offsets
like this make a big difference.

Logo (constant spin) Easing won't help yet, because the time * 30 expression overrides the
keyframes. Expand Rotation and click the = icon next to the stopwatch to turn the expression
off. Your 0 to 90 keyframes then take over and you can ease them like the others.

Motion blur Turn on the motion blur switch (the circles icon) for the moving layers, then turn
on the master Motion Blur button at the top of the Timeline. Without that master button, the
per-layer switches won't show anything.

Good habits
Vary durations. Once things are eased, try making the Subtitle 0.7s and the Title 1.0s so they
aren't in lockstep.
Start motion with energy and end it softly. That's what makes motion feel intentional.
Watch it in real time. Use a RAM preview (spacebar) rather than scrubbing, because easing reads
very differently at full speed.

A good order to practice in: the Title first (simple), then the Bar (rove the middle keyframe),
then the Cursor (holds). When you're done, I can check your keyframes and tell you how the
timing reads, still without changing anything. I can also point you to official Adobe
tutorials on the Graph Editor.

**Learner (12:36):** can you check my work?

**Assistant:**

Before I report back, I'll take a proper look at the 0.25s frame. I described it a moment ago
without actually viewing it.The cursor is fixed. The Bar's trim reveal is still moving at a
constant speed, and the logo's spin hasn't changed. For the Title, Subtitle and CTRL moves, my
checks couldn't tell eased from linear, so those are unconfirmed.

Fixed
Cursor blink. At 0.25s the cursor is just as bright as at 0s; if it were still fading, it would
be about half as bright there. At 0.75s it's completely gone. That means the keyframes are now
holds and it snaps on and off.

Still constant speed
Bar trim reveal (Trim Paths End). I measured how wide the bar is at several moments. It grows
by exactly the same amount each frame from 0.2s to 1.2s:
at 0.3s it's 10% drawn
at 0.5s it's 30%
at 0.6s it's 40%
That's a straight-line rate, so the reveal is still linear. To fix it, expand the Bar's
Contents down to Trim Paths, select the End keyframes, then press F9 or shape the curve in the
speed graph.

Unchanged
Logo rotation. The time * 30 expression is still on, so it's still spinning at a constant rate
and its keyframes are ignored. Click the = next to the Rotation stopwatch to turn it off.

Keyframe timing. Every keyframe is still at the same time as before, so these points still
apply:
The Title's scale and opacity both end at 1.5s. Try pulling the opacity end a few frames
earlier.
The Title, Subtitle and CTRL moves all still last exactly 1 second.

Couldn't confirm
My tools can read keyframe times and values but not their easing type. Screen-position samples
didn't work either, because those numbers are in each layer's own space. So for these I can't
tell eased from linear:
Title position, scale and opacity
Subtitle position and opacity
CTRL position
Bar X Position, including whether the middle keyframe now roves
To check them yourself, open each property in the Graph Editor's speed graph. A hill shape
means eased; a flat line means linear. Roving keyframes show as small dots instead of diamonds
on the timeline.

I also didn't re-check motion blur this time. It was off on every layer when I first looked.

Once you've worked through the Bar trim and the logo, ask me to check again.

**Learner (12:38):** can you demo it for me so that i can see how it's done?

**Assistant:**

I eased both of the Bar layer's animations: the trim reveal and the slide. I changed only that
layer. The Title, Subtitle, CTRL and Logo are untouched for you to practice on.

What I changed

1. Trim reveal (Trim Paths End, 0.2s to 1.2s)
Start keyframe: ease out at 15% influence. A short handle lets it get moving quickly.
Landing keyframe: ease in at 80% influence. A long handle makes it glide in to stop.
I re-measured the reveal at the same moments as before to confirm the change:

| Time | Before | Now |
|---|---|---|
| 0.3s | 10% drawn | about 14% |
| 0.4s | 20% drawn | about 38% |
| 0.5s | 30% drawn | full width of the bar |

2. Slide (X Position, 0s, 0.6s, 1.2s)
Start (0s): ease out at 20%, for a quick launch.
Landing (1.2s): ease in at 75%, for a long, soft settle.
Middle (0.6s): I first tried Rove Across Time. After Effects rejected it, because roving only
works on spatial properties, and once Position is separated into X and Y each one is a plain
number. Instead I gave the middle keyframe the same speed going in and out (600 px/s) and
locked its tangents together, so the speed carries straight through it with no jolt.
I couldn't measure the slide on screen the way I did the trim, so check this one in the Graph
Editor.

How to see it
Select the Bar and press U.
Click the Graph Editor button (or press Shift+F3), then right-click and choose Edit Speed Graph.
Click End under Trim Paths. You'll see a steep rise right after 0.2s and a long tail sloping
down into 1.2s. That lopsided hill is the ease-out shape.
Click X Position. The curve should flow smoothly through 0.6s with no sudden step, then taper
off to zero at 1.2s.
Press spacebar to play it back in real time. That's the best way to judge the feel.

How to repeat it by hand
Trim technique: select a keyframe and press Ctrl+Shift+K (Win) / Cmd+Shift+K (Mac). In the
Keyframe Velocity dialog, set Outgoing influence to 15 on the first keyframe and Incoming
influence to 80 on the last.
Middle-keyframe technique: in the speed graph, select the middle keyframe and drag one handle.
Its in and out handles move together because they're locked. Hold Alt/Option to break them
apart if you ever need to.

Your turn
Try the same ease-out on the Subtitle position and opacity, then the Title. To practice on the
Bar from scratch, press Ctrl+Z / Cmd+Z a few times to undo my changes. When you're done, ask me
to check your work again.

**Learner (12:40):** can you do the rest for me?

**Assistant:**

I finished the remaining fixes in "Mentor Practice", so the Bar, Title, Subtitle, CTRL, Logo and
Cursor now all have reworked timing. Neither expression shows an error, and I rendered two
frames to confirm the cursor loop. I haven't watched the whole piece play back, so run a RAM
preview (spacebar) to judge the overall feel.

Changes

Title
Position: eases out of 0.5s. Its middle keyframe (1.5s) now carries a slow speed straight
through instead of stopping, so it drifts on and settles at 3s.
Scale: quick start, long landing (20% out, 80% in), 0.5s to 1.5s.
Opacity: now finishes at 1.3s instead of 1.5s, so the Title is fully visible before its scale
settles.

Subtitle
Position: rise shortened to 0.3s to 1.1s, eased with a long landing.
Opacity: now finishes at 1.0s instead of 1.3s, also eased.

CTRL null
Position: the 0s to 1s drift is eased.
Float: a slow float expression moves it about 4px up and down on a 4-second cycle. It fades in
from 1.5s and adds to the keyframes rather than replacing them. This carries the Title and
Subtitle, so the frame isn't frozen after the intro. To adjust it, edit amp (pixels) or period
(seconds) at the top of the expression on CTRL's Position.

Logo
Spin: the time * 30 expression is switched off but not deleted. Click = next to Rotation to
bring it back.
Rotation: the 0° to 90° keyframes now drive it, eased to whip around and settle at 2s.

Cursor
Loop: added a hold keyframe at 3.0s (on) to complete the blink cycle, plus loopOut("cycle") so
it blinks to the end of the comp.

Motion blur
On for the Title, Subtitle, Bar and Logo, and the comp's master Motion Blur switch is on.

Durations now

| Element | Duration |
|---|---|
| Subtitle rise | 0.8s |
| Subtitle fade | 0.7s |
| Title fade | 0.8s |
| Title scale | 1.0s |
| CTRL drift | 1.0s |
| Bar slide and reveal | 1.2s |

Worth knowing
Outside changes: two changes made outside this conversation were detected while I worked. I
checked, and only the playhead had moved, so I carried on.
Logo after 2s: it now sits still once it settles, since it isn't parented to CTRL. If it feels
dead, the quickest option is to turn the old spin back on. Or I can give it its own gentle idle
move.
Untouched layers: I didn't change the Icon precomp, the Glow adjustment layer or the disabled
"Old Take" layer.
Undo: Ctrl+Z / Cmd+Z steps back through these changes one at a time if you want to compare
before and after.
