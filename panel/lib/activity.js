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
  key_types_snapshot: "Looking at your comp…",
  key_types_demo: "Holding one pair to show you…",
  key_types_check: "Checking your holds…",
  speed_graph_snapshot: "Looking at your comp…",
  speed_graph_demo: "Shaping one pair to show you…",
  speed_graph_check: "Checking your shapes…",
  offset_snapshot: "Looking at your comp…",
  offset_demo: "Moving one to show you…",
  offset_check: "Checking your stagger…",
  anchor_snapshot: "Looking at your comp…",
  anchor_demo: "Moving one pivot to show you…",
  anchor_check: "Checking your pivot…",
  null_parent_snapshot: "Looking at your comp…",
  null_parent_demo: "Parenting one layer to show you…",
  null_parent_check: "Checking your null…",
  recommend_next: "Looking at your history and this comp…",
};

function statusFor(toolName) {
  return STATUS[toolName] || "Working…";
}

module.exports = { statusFor, STATUS };
