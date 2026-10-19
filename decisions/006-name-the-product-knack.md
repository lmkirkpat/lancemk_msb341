# Decision 006: Name the product Knack

**Date:** 2026-10-19 (brainstorm 2026-10-13 to 10-14, name and tagline chosen 2026-10-19)
**Status:** Active. Tentative name for the portfolio and the prototype. Revisit before anything
ships to people outside this repo (see the installer spec in `sprints/sprint-3-plan.md`).

## Context

Before sprint 3 I wanted a name so the project could be shown clearly on my portfolio. The README
said `[Product name TBD]` and the panel called itself "AE Mentor", which describes one app and
sounds like a feature, not a product.

Facts that shaped the choice:

- **Scope is wider than After Effects.** `decisions/002` says AE first, other Creative Cloud apps
  later, so the name can't be an animation-only term.
- **The difference from Adobe's assistant is leading, memory, and practice** (`CLAUDE.md`,
  `discovery/usage-notes/adobe-assistant-2026-10-08.md`). A name that only says "help" sits on
  Adobe's ground.
- **First reader is a recruiter or hiring manager**, so the name and tagline have to read in a few
  seconds without explanation. The playful voice in `CLAUDE.md` › Voice is for marketing later.
- **Name conflicts (checked by memory in the brainstorm, not searched):** Knack is a no-code
  database and app builder (knack.com), a different field. Autodesk SketchBook is a creative tool.
  *No domain or trademark search has been done yet.*

Source: the brainstorm in Claude Code session `9b6e51be` (this repo, 2026-10-13 to 10-14, and
10-19) and the portfolio-site session on 2026-10-19, where the name and tagline were confirmed.

## Options considered

About 60 names in three rounds, grouped by idea.

1. **Knack** (chosen): a skill so practiced it feels natural.
   - *Pros:* one syllable, warm, works with any app. "Get the knack of After Effects" sounds like
     normal speech. It's "second nature" in one word, which is the memory-and-practice promise.
   - *Cons:* knack.com owns the .com and the search results. Different field, so no confusion for
     a creative user, but a public launch may need a qualifier ("Knack Studio", "getknack").
2. **Ingrained**: deepest meaning (stuck for good, plus wood grain for craft).
   - *Cons:* it's an adjective. "Open Ingrained" and "Ingrained says your easing is off" read
     oddly. Shortlisted, rejected as the name.
3. **Gauge**: precise and crafty, suggests checking your work.
   - *Cons:* it leads with measuring, not teaching, so it could feel like a grade, and it points at
     diagnosis, which is Adobe's strength. Shortlisted, rejected as the name.
4. **Sketchbook**: familiar, suggests a practice habit, answers interview 008's "keeps no notes."
   - *Cons:* Autodesk SketchBook is a well-known creative app. Too close. Shortlisted, rejected.
5. **Second Nature**: the clearest promise and the brainstorm's first pick.
   - *Cons:* two common words, hard to own or search. Knack says the same thing in one.

**Rejected outright (one line each):**
- **Jig** (a woodworking guide that lets go once the skill holds): best fit for how the product
  teaches, but people think of the dance first, so the pitch starts with a correction.
- **Studio Habit:** "habit" has baggage, it describes a routine rather than a product, and two
  plain words give nothing to hold onto.
- **Animation terms** (Ease In, Tween, Onion Skin, Keyframe, Follow Through, Overshoot): too narrow
  once other apps arrive (`decisions/002`).
- **Apprentice terms** (Atelier, Understudy, Second Chair, Journeyman, Guild): not picked;
  Understudy was a first-round favourite but put the theatre ahead of the craft.
- **Common words** (Study, Feel, Layer, Proof, Natural): impossible to search for or own.
- **Rare words** (Pentimento, Underpainting, Registration): memorable but need a sentence of
  explanation before a recruiter gets it.
- Anything with "After", "Adobe", or "Creative Cloud": trademark risk and looks like an Adobe
  product.

None of the names were tested on anyone outside the brainstorm.

### Tagline

- **Chosen:** "Your project is the tutorial." Secondary line, optional: "Learn inside the work
  you're already doing."
- **Runner-up:** "Learn by making. Keep what you learn." (and "Make the work. Keep the skill.").
  It leads with memory, the harder-to-copy moat, but reads less plainly to someone who doesn't
  know the product.
- **Parked for marketing** (the playful voice): "Your skills, on autosave", "Undo the tutorial
  spiral" (now the Voice example line in `CLAUDE.md`), "Watch one, ease the rest" (panel or
  onboarding).
- **Rejected:** "Skills that stay ingrained" (too plain for the voice), "From 'wait, how?' to
  'watch this'" (a feeling, not what the product does).

### Parked feature names

Not decided, kept for later specs: **Gauge** for the diagnosis feature, **Sketchbook** for the
learner record shown in the panel (check the Autodesk conflict again before using it in UI).

## Decision

**Knack**, with the tagline **"Your project is the tutorial."**

Deciding reason: **it names the promise (a skill that becomes second nature) in one warm word
that works for every app the mentor will teach**, not just After Effects. The tagline was picked
for the same reader: it says what the product does in five words a recruiter gets on first read.

Applied 2026-10-19: README title and the panel's visible text (window title, header,
Window > Extensions menu, install messages). Bundle IDs (`com.aementor.*`), the `AEMentorPanel`
link, the `ae-mentor` MCP server name and the `AEMentor` learner-record folder were deliberately
left unchanged so existing installs and learner records keep working.

## What would change our mind

- **If a domain or trademark search** finds a "Knack" mark covering software, education, or
  creative tools, **then** add a qualifier (Knack Studio) or rename before any public launch. Do
  the search before the installer ships to anyone else.
- **If target-market interviewees** (the next round, `CLAUDE.md` › Next steps 3) mention knack.com
  or another product when they hear the name, **then** add a qualifier.
- **If people shown the name and tagline** for five seconds (portfolio readers or interviewees)
  can't say what the product does, **then** change the tagline first, not the name.
- **If memory across sessions becomes the lead pitch** (for example, interviews or the side-by-side
  show "in your own project" is something Adobe's assistant already covers in people's minds),
  **then** switch to the runner-up tagline, "Learn by making. Keep what you learn."
- **If the product ships beyond the prototype**, **then** decide whether the internal IDs, the MCP
  server name and the learner-record folder move to Knack, with a migration for existing records.
