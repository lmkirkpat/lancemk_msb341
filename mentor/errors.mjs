// Error codes from specs/002-easing-slice/contracts/mentor-tools.md › Errors. The message is what
// the mentor can pass on to the learner, so it's written for a person, not a developer.

export const MESSAGES = {
  AE_UNREACHABLE:
    "I can't see your After Effects project right now. Check that After Effects is open. After a fresh install, restart AE once. " +
    "If it still fails, open Window > Extensions > AE Mentor Bridge and press Restart bridge.",
  AE_BUSY: "After Effects didn't answer in time. It may be rendering or showing a dialog. Close any dialog and try again.",
  NO_ACTIVE_COMP: "No composition is active. Open the comp you want to work on in After Effects.",
  NO_SESSION: "There's no lesson in progress. Take a snapshot of the project first.",
  DEMO_USED: "The demonstration for this lesson has already been used. The rest is for the learner to do.",
  NOT_DEMO_TARGET: "The demonstration can only be on the lesson's first keyframe pair.",
  UNKNOWN_LAYER: "That layer isn't in the comp. Use a layer name exactly as it appears in the findings.",
  UNSAFE_RECORD: "The learner record can't contain an email address or phone number. Rewrite that part without it.",
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
