// Error codes from specs/002-easing-slice/contracts/mentor-tools.md › Errors. The message is what
// the mentor can pass on to the learner, so it's written for a person, not a developer.

export const MESSAGES = {
  AE_UNREACHABLE:
    "I can't see your After Effects project right now. Check that After Effects is open. After a fresh install, restart AE once. " +
    "If it still fails, open Window > Extensions > AE Mentor Bridge and press Restart bridge.",
  AE_BUSY: "After Effects didn't answer in time. It may be rendering or showing a dialog. Close any dialog and try again.",
  NO_ACTIVE_COMP: "No composition is active. Open the comp you want to work on in After Effects.",
  NO_SESSION: "There's no lesson in progress. Take a snapshot of the project first.",
  DEMO_USED: "I've already shown one pair in this lesson. The rest are yours to do, and I'll check them.",
  NOT_DEMO_TARGET: "I can only demonstrate on the one pair I picked for this lesson. The others are yours to do.",
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

export const CODES = Object.keys(MESSAGES);

export class MentorError extends Error {
  constructor(code, message) {
    if (!MESSAGES[code]) throw new Error(`Unknown MentorError code: ${code}`);
    super(message || MESSAGES[code]);
    this.name = "MentorError";
    this.code = code;
  }
}
