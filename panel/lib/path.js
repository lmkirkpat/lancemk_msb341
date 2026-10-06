// Path view (data-model › Path view, FR-010): a fixed list, combined with the learner record and
// the current lesson. Keyframes is an assumed prerequisite; only Easing is teachable.
"use strict";

function pathView(record, view) {
  const skill = record && record.skills && record.skills["easing.basic"];
  const easingDone = !!((skill && skill.status === "learned") || (view && view.passed));
  return [
    { name: "Keyframes", state: "done" },
    { name: "Easing", state: easingDone ? "done" : "current" },
    { name: "Graph Editor", state: easingDone ? "next" : "upcoming" },
    { name: "Bounce", state: "upcoming" },
  ];
}

module.exports = { pathView };
