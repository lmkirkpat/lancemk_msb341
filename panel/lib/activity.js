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
  // Spec 014's ask tools (ask-mentor's allowed-tools). The ask thread draws its own timed status
  // (MU ask-reading, then ask-reading-long at 6 s), not these, so a tool call there never changes the
  // line; these are for FR-062's one-line-per-tool rule and any lesson that calls them.
  describe_layers: "Reading the open comp…", // MU's own line (COPY.ask.reading)
  give_answer: "Writing the answer…", // MU has no line for this; the shortest plain one, for design review
  // Spec 014 phase 2: Go deeper's hand-over (MU ask-deeper-starting's own status line) and T106's stop.
  go_deeper: "Getting your lesson ready…",
  end_lesson: "Ending your lesson…", // not in MU; the shortest plain line, for design review
  // Spec 014 phase 3: the learner said how the steps went (turn 4). Called inside the ask thread, whose
  // own timed line stays, so it's normally unseen; it still needs a line (FR-062), never "Working…".
  note_said: "Noting how the steps went…", // not in MU; plain, for design review
};

function statusFor(toolName) {
  return STATUS[toolName] || "Working…";
}

module.exports = { statusFor, STATUS };
