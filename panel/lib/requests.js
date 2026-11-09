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
  find_next: { label: "Find my next lesson", request: "/next-mentor" },
  yes: { label: "Yes, let's go", request: "Yes, let's go." },
  show_me_again_other: { label: "Show me again", request: "Show me again: explain the change you already made, with a frame. Don't change anything." },
};

const EASING_COMMAND = "/ease-mentor";

// A skill's start request (RQ-01), New lesson (RQ-02) and Warm up (RQ-11). Easing has no review to
// avoid, so its New lesson is the bare command. `command`: the skill table's.
const startRequest = (command) => ({ kind: "start", label: "Start lesson", request: command });
const newLessonRequest = (command) => ({ kind: "new_lesson", label: "New lesson", request: command === EASING_COMMAND ? command : `${command} lesson` });
const warmUpRequest = (command) => ({ kind: "warm_up", label: "Warm up", request: `${command} review` });

// Open question 8: easing's text names the pair; the other five say "the change".
const showMeAgain = (skillId) => (skillId === "easing.basic" || !skillId ? REQUESTS.show_me_again : REQUESTS.show_me_again_other);

// FR-082: Yes's follow-on on B1, from recommend_next's `recommendation` and the skill's command.
// focus_layers is never sent, whatever it holds. Kind "yes" keeps the turn out of "reply" counting.
function followOnRequest(recommendation, command) {
  const request = recommendation && recommendation.kind === "review" ? `${command} review` : command;
  return { kind: "yes", label: REQUESTS.yes.label, request };
}

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
    else if (v.demo_target && v.mode !== "review" && (v.skill !== "parenting.null" || v.null_ready)) kinds.push("show_me");
  }
  return kinds;
}

module.exports = { REQUESTS, visibleKinds, startRequest, newLessonRequest, warmUpRequest, showMeAgain, followOnRequest };
