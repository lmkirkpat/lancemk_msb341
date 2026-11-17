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
  // Spec 014 amendment (e): the first line of the context sent after a lesson (contracts/panel-ask.md ›
  // Context after a lesson). Not a button: nothing draws its label. Eval-synced (T104).
  ask_context: { label: null, request: "Earlier question and answer, as shown in the panel:" },
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
// cut-off that may have landed a demo (demo_unknown) or a review hides: a review never shows either (FR-052).
function visibleKinds(view, { lessonOpen, canContinue } = {}) {
  if (!lessonOpen) return canContinue ? ["continue", "start"] : ["start"];
  const v = view || {};
  const kinds = ["check"];
  if (v.checks > 0) kinds.push("hint");
  if (!v.demo_unknown && v.mode !== "review") {
    if (v.demo_made) kinds.push("show_me_again");
    else if (v.demo_target && (v.skill !== "parenting.null" || v.null_ready)) kinds.push("show_me");
  }
  return kinds;
}

// Spec 014 (contracts/panel-ask.md › Requests, research R12). A question, from Home or the thread,
// opens the ask skill, so B1 launches with its tools and A switches to it; the learner's bubble
// shows `label`, the text as typed, never the command. A follow-up goes as typed. Go deeper sends
// MU's sentence with the offer's short name, drawn from the answer's own data.
const ASK_COMMAND = "/ask-mentor";
const askRequest = (text) => ({ kind: "question", label: text, request: `${ASK_COMMAND} ${text}` });
const followUpRequest = (text) => ({ kind: "followup", label: text, request: text });
const goDeeperRequest = (tag) => ({ kind: "go_deeper", label: `Yes, go deeper on ${tag}.`, request: `Yes, go deeper on ${tag}.` });

// The first follow-up or Try again after a lesson ended the thread's conversation (contracts/panel-ask.md
// › Context after a lesson, amendment (e)). entry: the thread's latest answered entry, { text, view }.
// Its view is the AskView the panel already validated; nothing comes from prose (FR-016). A null view
// (FR-048's fallback) has no validated answer, so the send is the prefix and the text only. Empty parts
// are left out. The bubble shows `label`, the text as typed; the wrapper is in `request` only.
function contextRequest(entry, text) {
  const t = String(text);
  const v = entry && entry.view;
  if (!v) return { kind: "followup", label: t, request: `${ASK_COMMAND} ${t}` };
  const has = (x) => typeof x === "string" && x.trim() !== "";
  const lines = [`${ASK_COMMAND} ${REQUESTS.ask_context.request}`];
  if (has(entry.text)) lines.push(`Question: ${entry.text}`);
  if (has(v.explanation)) lines.push(`Answer: ${v.explanation}`);
  const steps = (v.steps || []).filter((st) => has(st.text));
  if (steps.length) {
    lines.push("Steps:");
    steps.forEach((st, i) => lines.push(`${i + 1}. ${st.text}${has(st.layer) ? ` (layer: ${st.layer})` : ""}`));
  }
  if (has(v.closing_offer)) lines.push(`Closing: ${v.closing_offer}`);
  lines.push(`Follow-up: ${t}`);
  return { kind: "followup", label: t, request: lines.join("\n") };
}

module.exports = { REQUESTS, visibleKinds, startRequest, newLessonRequest, warmUpRequest, showMeAgain, followOnRequest, ASK_COMMAND, askRequest, followUpRequest, goDeeperRequest, contextRequest };
