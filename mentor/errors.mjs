// Error codes from specs/002-easing-slice/contracts/mentor-tools.md › Errors, plus spec 004's
// (contracts/shared-tools.md › Errors). The message is what the mentor can pass on to the learner,
// so it's written for a person, not a developer.

export const MESSAGES = {
  AE_UNREACHABLE:
    "I can't see your After Effects project right now. Check that After Effects is open. After a fresh install, restart AE once. " +
    "If it still fails, open Window > Extensions > AE Mentor Bridge and press Restart bridge.",
  AE_BUSY: "After Effects didn't answer in time. It may be rendering or showing a dialog. Close any dialog and try again.",
  NO_ACTIVE_COMP: "No composition is active. Open the comp you want to work on in After Effects.",
  NO_SESSION: "There's no lesson in progress. Take a snapshot of the project first.",
  DEMO_USED: "I've already shown you one in this lesson. The rest are yours to do, and I'll check them.",
  NOT_DEMO_TARGET: "I can only demonstrate on the one I picked for this lesson. The others are yours to do.",
  REVIEW_NO_DEMO: "This one's a review, so it's all yours this time. Have a go and I'll check it.",
  NOT_KEPT_LINEAR:
    "That one isn't linear all the way through yet, so I can't note it as constant speed. Set its keys to linear first.",
  KEEP_LINEAR_NO_CHECK:
    "I need to check your comp before I can note that one as constant speed. Let me look at it first.",
  KEEP_LINEAR_OTHER_COMP:
    "That's a different comp from the one we're working in, so I can't note it here. Switch back to our comp and I'll check again.",
  LESSON_UNDERWAY: "We've already started on this one, so I'll keep checking it against where we began.",
  UNKNOWN_LAYER: "That layer isn't in the comp. Use the layer's name exactly as it appears in the comp.",
  UNSAFE_RECORD: "The learner record can't contain an email address or phone number. Rewrite that part without it.",
  // Not for the learner: the record doesn't match what this lesson's checks saw. The message names
  // the field to fix.
  RECORD_MISMATCH: "The record doesn't match this lesson's checks.",
  SESSION_UNREADABLE:
    "I couldn't pick up the lesson that was in progress, so I'll start a fresh one. Your project hasn't changed.",
  RECORD_UNREADABLE:
    "I couldn't read my notes from your earlier lessons. They're kept as they were, and I'll start new notes from this lesson.",
};

// A live view: registerErrors() adds to this same array, so anything holding it sees new codes.
export const CODES = Object.keys(MESSAGES);

// A skill's own codes, registered when its tool file is imported (contracts/skill-module.md › 4).
// Registering a code again with the same message is fine; with a different one it's a mistake.
export function registerErrors(map) {
  for (const [code, message] of Object.entries(map)) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(code)) throw new Error(`Error codes are upper case with underscores: ${code}`);
    if (typeof message !== "string" || !message) throw new Error(`Error ${code} needs a message for the learner.`);
    if (code in MESSAGES) {
      if (MESSAGES[code] !== message) throw new Error(`Error code ${code} already exists with a different message.`);
      continue;
    }
    MESSAGES[code] = message;
    CODES.push(code);
  }
}

export class MentorError extends Error {
  constructor(code, message) {
    if (!MESSAGES[code]) throw new Error(`Unknown MentorError code: ${code}`);
    super(message || MESSAGES[code]);
    this.name = "MentorError";
    this.code = code;
  }
}
