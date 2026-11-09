// Button labels and the fixed request each sends (contracts/button-requests.md). Eval cases 17–20
// use these exact strings (test/requests-eval-sync.test.js). Requests say what the learner wants,
// not how to teach: teaching rules stay in the skill (FR-013).
"use strict";

const REQUESTS = {
  start: { label: "Start lesson", request: "/ease-mentor" },
  continue: { label: "Continue lesson", request: "I'm back. Pick up where we left off." },
  show_me: { label: "Show me", request: "Show me how first." },
  show_me_again: { label: "Show me again", request: "Show me again: explain the pair you already eased, with a frame. Don't change anything." },
  check: { label: "Done, check it", request: "I'm done. Check my work." },
  hint: { label: "Hint", request: "Can I have a hint?" },
};

// The contract's "Shown when" column (spec 007 FR-019, FR-020). view: a LessonView (or null before a
// lesson). The check first, then Hint from the first check, then Show me or Show me again, which a
// cut-off that may have landed a demo (demo_unknown) or a review hides.
function visibleKinds(view, { lessonOpen, canContinue } = {}) {
  if (!lessonOpen) return canContinue ? ["continue", "start"] : ["start"];
  const v = view || {};
  const kinds = ["check"];
  if (v.checks > 0) kinds.push("hint");
  if (!v.demo_unknown) {
    if (v.demo_made) kinds.push("show_me_again");
    else if (v.demo_target && v.mode !== "review") kinds.push("show_me");
  }
  return kinds;
}

module.exports = { REQUESTS, visibleKinds };
