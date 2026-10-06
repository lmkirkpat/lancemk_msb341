// Plain status lines for the mentor's tool calls (FR-012, SC-004 option A, research R1). They say
// what the mentor is doing from which tool runs, not from its wording, so they hold no teaching.
"use strict";

const STATUS = {
  read_learner_record: "Remembering what you've practiced…",
  snapshot_project: "Looking at your comp…",
  preview_frame: "Rendering a frame from your comp…",
  set_ease: "Easing one pair to show you…",
  diff_since_last: "Checking your keyframes…",
  record_lesson: "Saving what you practiced…",
};

function statusFor(toolName) {
  return STATUS[toolName] || "Working…";
}

module.exports = { statusFor, STATUS };
