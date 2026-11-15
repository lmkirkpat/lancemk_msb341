// Home, ask-first (spec 014 FR-055 amending spec 007 FR-007 to FR-010, decisions/012, MU › Home):
// from the learner record and the path data alone, with no mentor turn (FR-008 still holds). Home is
// the ask card and one quiet line; the line itself depends on the lesson state, so screens.js picks
// it. What the mentor remembers and Practice due are worked out here but drawn on Skills (FR-050,
// FR-051 moved), so nothing from the record leads at the door.
"use strict";

const nodeFs = require("fs");
const path = require("path");
const { memoryView } = require("./memory.js");
const { practiceDue } = require("./skills-view.js");
const { REQUESTS } = require("./requests.js");
const { COPY } = require("./copy.js");

// Which skill Start lesson means with no skill named (the app's act("start"); Home no longer draws it).
const START_REQUESTS = { "easing.basic": REQUESTS.start };

function startRequest(skillId) {
  return Object.prototype.hasOwnProperty.call(START_REQUESTS, skillId) ? START_REQUESTS[skillId] : null;
}

// → the parsed path.json, or null when it can't be read.
function readPathData(opts) {
  const fs = (opts && opts.fs) || nodeFs;
  try {
    const data = JSON.parse(fs.readFileSync(path.join(opts.repoPath, "mentor", "curriculum", "path.json"), "utf8"));
    return data && Array.isArray(data.skills) ? data : null;
  } catch (e) {
    return null;
  }
}

// memory: readLearnerRecord's result. pathData: readPathData's result. built and now: for Practice due.
function homeView({ memory, pathData, built, now }) {
  const unreadable = memory.status === "unreadable";
  const lessons = memory.status === "ok" && memory.record && Array.isArray(memory.record.lessons) ? memory.record.lessons : [];
  const has_history = lessons.length > 0;
  const skills = pathData && Array.isArray(pathData.skills) ? pathData.skills : [];
  const names = Object.fromEntries(skills.map((s) => [s.id, s.name]));
  // FR-010 as amended: an empty record is the same Home plus a welcome. A returning learner gets no
  // line from the record here: one quiet line is all Home shows (decisions/012).
  const hello = !unreadable && !has_history ? { text: COPY.home.welcome_first, sub: null } : null;
  const practice = built && now ? practiceDue({ memory, built, now }) : null;
  return { has_history, unreadable, hello, practice, memory: memoryView(memory.status === "ok" ? memory.record : null, { names }), memory_title: COPY.home.memory_title };
}

module.exports = { homeView, readPathData, startRequest };
