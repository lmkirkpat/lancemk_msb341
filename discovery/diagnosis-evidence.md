# Diagnosis: what the evidence says

Prepared 2026-10-20 for the "why" of `specs/005-diagnosis`. This is evidence, not a spec: no
requirements, no design. Scores follow `discovery/insights.md` (Did 1, Said ½, Weak ¼). Nothing
in `insights.md` was changed; where this note reads a belief more narrowly than the file does,
it says so. Quotes are word for word from the interview write-ups and the Adobe transcript;
anything in my own words is marked "(summary)".

"Diagnosis" here means: the learner has a project that looks or behaves wrong, and the help
reads the project and says why. It is not "how do I do X?"

## 1. Bottom line

- Diagnosis as a pain is real but thinly evidenced for After Effects. One interview (007) is
  both a Did and an After Effects story. The rest are screenshots-to-chatbot stories in other
  apps, and most of those had a visible symptom, not a hidden cause.
- Nobody has shown they would choose a project-reading diagnosis inside a mentor over what
  they already do (screenshot to a free chatbot, or Adobe's assistant). That is the riskiest
  claim and it is untested.
- Adobe's assistant diagnosed the whole comp well in the one test we have. The bar is set by
  a competitor, not by user demand.

## 2. Interview evidence on diagnosis as a need

| Source | What happened | Tag | Points | Fits "diagnosis" how? |
|---|---|---|---|---|
| 007 (student, After Effects class) | "you'll miss a step and then 5 hours later in your project you'll be like, why is this messed up? And it's just because this one step is janky at the beginning." "I think it maybe took more time to find the error than to find a video that would help." | Did | 1 | Strongest. After Effects, a hidden early cause, hours of cost. Cause not searchable until known (summary). |
| 007, imagined use after the pitch | "it'd be easier to spot the problem ... or even ask it, be like, what's the problem here? Why does it look like this?" Then find a video or ask how to fix it. | Weak | ¼ | Said after the pitch. insights.md files it under Said (½); I read it as Weak because the pitch came first. See section 6. |
| 008 (freelance designer, Photoshop/Illustrator, not AE) | Export failed; "I tinkered around with for a while trying to figure out why it was wrong. Probably took me like 35 minutes." The app did not support the file type. | Did | 1 | Good: cost came from not knowing why. Different app, and a limit of the app, not a mistake in the project. |
| 008 | SVG discoloration: "normal Google ... just a quick fix." | Against | n/a | Some "what's wrong" moments are cheap and searchable. |
| 003 (writer, Premiere) | Took screenshots of errors and asked a chatbot "what am I looking at?" Needed YouTube first to know enough to ask: "I already had the base understanding from the YouTube to be able to ask it." | Did | 1 | Diagnosis by screenshot already works for them, but needs prior knowledge to ask. |
| 004 (student, Photoshop) | Typed "hey, the sky on my photo is really blown out. How can I fix it?" and was pointed to masking. | Did | 1 | Symptom was already named. This is "how do I fix", not "find the cause" (summary). |
| 006 (professional, Photoshop) | Photographed the Layers panel and got the clipping-mask fix. | Did | 1 | Same: the problem was known; the screenshot gave the chatbot the state (summary). |
| Self-test 1 (builder) | Screenshots caught state mismatches and shortcut conflicts. | Weak | ¼ | Own test. |

Reading (summary, mine):

- Two different jobs hide under belief 1. (a) "Something is wrong and I don't know what":
  007 and 008's export. (b) "I know the symptom, I need the fix": 004 and 006. Only (a) needs
  a tool that reads the whole project. Chatbots with a screenshot already handle (b) for free
  (belief 12).
- Only 007 is an After Effects story, and 007 left that degree and was not in After Effects
  at interview time. We have no current After Effects learner's diagnosis story outside the
  builder.
- Cost data: 007 "hours" and "5 hours later"; 008 "35 minutes". Both are self-reported times.

### Personas

- Persona 1 (skill-builder) carries the diagnosis want: "Wants help finding what broke, not
  only how to do something new" (007 only). Not in the persona's "problem in their words",
  which is 004's mouse-on-a-screen line.
- Persona 2 (occasional user) took the result under deadline; their diagnosis use (003) was a
  chatbot. Nothing in the file says they want a mentor to diagnose.
- 008 adds: "I learn only the things that I need to complete a project. ... If I could tell it
  what I want to accomplish at the end of it and it ... teaches me things relevant to that,
  especially helpful." (Weak, ¼, after the pitch.) This is a goal-led entry, adjacent to
  recommending what to learn, not the same as diagnosis. No interviewee asked unprompted for
  "tell me what to learn next from my project."

### Belief 1 as scored in insights.md

Med, about 5.5 points, 5 people plus self. Against: 008's SVG quick fix. Untested: whether
diagnosis inside the mentor beats a free chatbot with a screenshot. My caution: the 5-person
count includes 004 and 006, whose stories are "fix a known symptom" (job b). For job (a)
alone I count two Did sources (007, 008-export) and one Weak (007 post-pitch), about 2.25
points, so Low, with a single After Effects source. The file's Med is fair for the broad
wording; the narrower claim the spec will lean on is Low.

## 3. What Adobe's assistant did (side-by-side, 2026-10-08)

Source: `discovery/usage-notes/adobe-assistant-2026-10-08.md`, a hands-on test (Did, outside
research, 1 point), one session, by the builder, on the Mentor Practice comp, in the AE beta
assistant. Prompts were written to test teaching, not diagnosis. Adobe's assistant is a beta
and may have changed since 2026-10-08.

**The prompt:** "can you explain why my comp looks mechanical right now" (12:32). No screenshot,
no layer names.

**The answer** named 8 causes, all read from the project, with times and layer names:

1. Every move lasts the same 1 second (Subtitle 0.3 to 1.3s, Title 0.5 to 1.5s, CTRL 0 to 1s,
   Bar trim 0.2 to 1.2s).
2. Title scale and opacity start and finish on the same frames (both 0.5 to 1.5s).
3. Title and Subtitle are parented to CTRL, which drifts 40px from 0 to 1s while they run their
   own position keys (stacked parent motion).
4. The Bar's X Position covers 500px in 0.6s then 260px in the next 0.6s, "a visible jolt at
   0.6s".
5. The cursor's opacity ramps instead of holding, and stops at 2.5s.
6. The Logo's `time * 30` expression overrides its two rotation keyframes.
7. "The comp is 8 seconds long, but everything except the logo spin finishes by 3s" (dead
   time).
8. Motion blur off on every animated layer.

**How it got there (summary, from the transcript):** it read keyframe times and values,
expressions, parenting, and layer switches across layers, then compared them against each
other: durations across layers, start/end times within a layer, a layer's own keys against its
parent's, an expression against the keys it covers, and the comp length against when motion
stops. It also said what it could not check: "My check doesn't show the easing type on
keyframes (linear vs. Easy Ease, or custom curves). If those keys are linear, that's likely
the biggest cause on its own."

**What it did next:** offered fixes and "do all of it". When asked to teach, it gave a full
manual (not led). When asked to check, 7 properties stayed unconfirmed because it cannot read
easing type (its words: "My tools can read keyframe times and values but not their easing
type"). Its "do the rest" made changes nobody asked for.

### What per-pair checks cannot see

Our mentor reads each keyframe pair's temporal ease directly (spec 001) and grades it. Per
the 2026-10-08 notes, "The mentor only sees linear pairs." By construction, a per-pair check
looks at one property's two neighbouring keys. Of Adobe's 8 findings, these depend on
looking across pairs, properties, layers or the comp, which a per-pair check will not produce
(summary, mine; confirm against `mentor/` before relying on it):

| Adobe finding | Needs |
|---|---|
| 1. Equal durations | comparison across layers |
| 2. Scale and opacity land together | comparison across properties of one layer |
| 3. Stacked parent motion | parent chain plus both layers' keys |
| 4. Speed jump at a middle key | three keys on one property (speed between two pairs) |
| 5. Cursor fades vs. holds | key type and interpolation, plus intent (a blink) |
| 6. Expression overrides keys | expression state, not keys (the mentor already hit this: Logo > Rotation, T023 check 9) |
| 7. Dead time | comp length against all layers' last key |
| 8. Motion blur off | layer switches, not keys |

Reverse: Adobe could not tell eased from linear, and our per-pair read can. The Adobe check
of the lesson came back "unconfirmed" for the properties the mentor could grade. So the
depth edge was real in this session and a "small one for Adobe to close" (easing-slice.md).

### Strength

- Adobe diagnosis: Did (outside research), 1 point, one session, one comp, run by the builder
  with teaching prompts. It shows capability, not demand and not accuracy beyond what the
  builder judged. I have not seen a check of whether all 8 causes were true; the transcript
  gives numbers that match the later "do the rest" changes and the T023 finding on the
  expression (summary).
- Not tested: a learner other than the builder, a comp that is not the builder's own test
  comp, or whether the 8 causes are what a learner would care about. The 8 were found on a
  comp the builder built to have easing problems.

## 4. The two caveats (CLAUDE.md "Next steps" 2)

### 4a. Diagnosis is its own capability, not the last step of adding skills

Evidence for it:

- 007's cost was finding the mistake, hours after the cause, in a long project. That is
  reading the project for any fault, not teaching one named skill (Did, 1).
- Adobe's 8 causes came from reading the whole comp. Per-skill, per-pair checks do not produce
  items 1, 2, 3, 4, 7, 8 above (section 3).
- 007 imagined diagnosis first, before teaching new skills, in the after-pitch answer (Weak).
  The interview note for 007 already recorded: "diagnosis ... came up before teaching new
  skills ... a 'find what broke' check may be the strongest first job."
- Belief 1 and spec 002: spec 002 teaches a new skill (easing); it does not diagnose a broken
  project (insights.md, belief 1, Untested).

Evidence against, or limits:

- For 008 and 004/006, "what's wrong" was cheap or already named (section 2).
- A light "what's wrong here" opening early is supported only by 007 (one After Effects
  source) and the builder's read of Adobe. Nobody has been shown one and reacted.
- "Diagnosis first" is a bet about ordering. No evidence compares a learner starting from
  "what's wrong" with one starting from "teach me X".
- 003's diagnosis worked only after a base understanding from YouTube. This is a hint that
  diagnosis output has to be something the learner can act on, not that it needs lessons
  first. One source, Did (summary of my reading).

### 4b. Restraint and teaching focus are copyable; depth and memory and practice are harder

What the evidence supports:

- Adobe's own transcript shows the pieces exist. It respected "teach me without doing it for
  me" until asked for a demo, and said "I won't touch anything; you do every step." Not led,
  and it did extra when told to "do the rest". `easing-slice.md` calls the gap "one product
  decision, not a capability." The `decisions/002` trigger (Adobe adds a teaching mode)
  is described as probably closer than it looked. (Did, outside research.)
- Depth: Adobe could not read easing type in this session ("My tools can read keyframe times
  and values but not their easing type"). A real edge today, small for Adobe to close.
- Memory and practice across sessions: not compared at all (one Adobe session). Adobe's
  overview described no memory of the learner; that is the assistant's own statement of
  what it does, not a test of persistence over time. Belief 2 (skills fade) is Med, but the
  claim that people value practice over relearning on demand is Untested, and belief 12 says
  relearning basics is free. 008's memory is their old project files ("previous work ... where
  I can go in and see what I did"), and nobody has shown a cost from relearning.
- So "harder to copy" is a claim about Adobe's effort, not about what people want. It is a
  product-strategy judgment I cannot score. The user evidence says nothing yet on whether
  depth or memory change anyone's choice.

For diagnosis specifically (summary, mine): diagnosis is where Adobe is already ahead
(Adobe 8 causes vs. our linear pairs only), so a diagnosis spec closes a gap and does not
create a lead. What would still differ is what happens after: leading the learner into the
fix without doing it, and carrying what was found into the next session. Neither has user
evidence.

## 5. Claim strength table

| # | Claim | Strength | Basis |
|---|---|---|---|
| A | Finding what broke cost a learner more time than finding instructions (After Effects). | Did, 1 source (007) | "maybe took more time to find the error than to find a video that would help". n=1, left the class, friend interviewee, time self-reported. |
| B | Not knowing why something failed costs real time in Adobe apps in general. | Did, 2 sources (007, 008 export, 35 min) | 008 is not After Effects; app limit, not a project mistake. |
| C | Some people already solve "what's wrong" with a free chatbot and a screenshot. | Did, 3 sources (003, 004, 006) | These are mostly known-symptom cases (job b). |
| D | Some "what's wrong" moments are cheap and searchable. | Did, 1 (008 SVG) | Counter-evidence to A and B. |
| E | Learners would want a mentor to say "what's wrong here" before teaching. | Weak, 1 source (007, ¼) | After the pitch, imagined use. |
| F | Learners want to say their goal and be taught toward it (adjacent to recommending what to learn). | Weak, 1 source (008, ¼) | After the pitch; not an After Effects user. |
| G | Adobe's assistant diagnoses a whole comp from the project (8 causes). | Did (outside research), 1 session | Capability, one comp, builder-run, teaching-oriented prompts. |
| H | Adobe's assistant cannot read easing type. | Did (outside research), 1 session | Its own statement; may change. |
| I | Per-pair checks cannot produce six of the eight findings. | Reasoned from the transcript and spec 001/002 (summary) | Not tested against the code in this task; the Logo > Rotation overlap was found in the mentor's own T023. Mark as a claim to verify. |
| J | Adobe could copy restraint and leading; depth and memory/practice are harder to copy. | Weak (strategy judgment) | Consistent with the side-by-side; no user evidence either way. |
| K | People would pick a mentor's diagnosis over Adobe's or a chatbot's. | None | Never asked or tested. |
| L | A diagnosis result lasts: people value having it recorded across sessions. | None | Not asked. |

## 6. Counter-evidence and cautions

- The line in `insights.md` belief 1 puts 007's "what's the problem here?" under Said. It
  came after the pitch (the guide pitches near the end), so by the file's own rubric it is
  Weak (¼). Section 2 uses ¼. Worth fixing at the next `/insights-review`; I did not edit it.
- 007 and 003/004 were friends, and the guide's own notes on 007 flag politeness on the
  pitch.
- The 2026-10-08 comparison was run by the person who built the competing prototype, with
  prompts written to test teaching. The note itself says interviews carry more weight.
- Adobe's strength was shown on a comp built to be mechanical. We have not seen it on a
  learner's real, messy, broken comp, and we have not seen the mentor try diagnosis at all.
- 008: "I don't like Photoshop assistance. ... I don't find it super helpful." It is unclear
  which feature they meant, and they did not use After Effects. Do not read it as a verdict
  on the AE assistant.
- Nobody interviewed is known to have used Adobe's teaching assistant (belief 10, "Still
  true"). So the comparison "mentor vs. Adobe's diagnosis" exists only in the builder's test.
- Version mismatch (belief 16, 008, Hunch): help written for older app versions. Relevant to
  diagnosis because a reading of the live project avoids stale labels. One source, Hunch,
  not After Effects.

## 7. Open questions (diagnosis-specific)

1. Do After Effects learners other than the builder lose real time to finding what broke, and
   how often? (A rests on one friend who has left the class.)
2. Is the typical case "hidden cause" (needs the whole comp) or "known symptom, unknown fix"
   (a chatbot already works)? This decides how much diagnosis a learner would actually use.
3. Would a learner prefer a diagnosis that is a short list of what is off, or one that picks
   a single thing to teach? Nothing in the interviews speaks to list length. Adobe's 8-item
   list was the builder's "a lot at once ... a little overwhelming at first, but clear enough
   to break down" for the teaching answer, not for the diagnosis (the builder's note, summary).
4. When Adobe's assistant diagnoses, do learners act on it themselves, or say "do all of it"?
   (Belief 7: mid-project people take the result. Adobe's answer ended with an offer to fix
   everything.)
5. Does a learner trust a diagnosis from a mentor that has said it can only see some things?
   Adobe's honesty about limits ("I couldn't confirm") is the only data.
6. Which of Adobe's 8 findings are things a learner can learn and fix (durations, offsets)
   and which are plain bugs (expression overriding keys, motion blur off)? The builder's
   view; no user input.
7. Does anyone want a record of what was diagnosed over time (a repeated mistake)? Zero
   evidence.

## 8. What the next interview should ask

Riskiest claim: K, that people would use a mentor's diagnosis instead of what they have now.
Close second: that the "hidden cause" case is common in After Effects (open question 2),
because without it diagnosis is a feature for a rare problem.

Target: a current After Effects user, ideally a stranger (008's cold approach worked), who
has had a project look wrong in the last few months. Keep the pitch to the end. Questions in
the guide's style (past behavior first):

1. "Tell me about the last time something in an After Effects project looked or behaved wrong
   and you didn't know why." (Get the symptom, what they tried, in what order.)
2. "How long from noticing to knowing the cause? And from knowing the cause to fixing it?"
   (Splits finding from fixing; 007 and 008 were mixed. Keep "how long did that take?")
3. "What did you open first? Did you screenshot or paste anything into a chatbot or Adobe's
   assistant? What came back, and did it match what you saw on screen?" (Tests C, K, and
   belief 16 without leading.)
4. "What did you do with the answer? Did you fix it yourself, or have something do it?"
   (Learn vs. done in a diagnosis moment; belief 7.)
5. "Has the same kind of problem come back? What did you do the second time?" (Tests whether
   diagnosis repeats, so whether a record would matter.)
6. Only after the pitch, shown a concrete example (a short list of what is off in a comp):
   "Would you rather this told you what is off, or told you what to learn first? What would
   you do with this list?" Then "Have you tried Adobe's After Effects assistant for this?
   What would make you choose this instead?" Score everything after the pitch as Weak.
7. Gaps still open from 008, not diagnosis-specific: learn vs. done (section 5 of the
   guide), which Adobe AI they mean (generative fill vs. the assistant), whether steps match
   their version, and referrals.

A stronger test than an interview, if the spec writer wants one: give a current After Effects
user a comp with a known hidden fault and watch which of the three they reach for (mentor,
Adobe's assistant, chatbot with a screenshot) and what they do with the answer. That would be
behavior, which is the only way belief 1 on this claim can pass Med. This is a research
suggestion, not a requirement.

## 9. Sources

- `discovery/insights.md` (beliefs 1, 2, 7, 10, 12, 15, 16; open question 1), last reviewed
  2026-10-12.
- `discovery/personas.md`, last updated 2026-10-12.
- `discovery/interviews/003`, `004`, `006`, `007` (2026-10-07), `008` (2026-10-12).
- `discovery/usage-notes/adobe-assistant-2026-10-08.md` and `easing-slice.md` > SC-007
  (2026-10-08).
- Not read for this note: `discovery/competitors.md`, interviews 001, 002, 005, and the
  mentor code. Claim I is therefore reasoned from the transcript and the notes, not from the
  code.
