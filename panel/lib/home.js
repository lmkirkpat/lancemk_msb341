// Home (FR-007, FR-008, FR-010): from the learner record and the path data alone, with no mentor
// turn. First run: the path's first skill. With a record: Find my next lesson, naming no skill,
// because nothing stores a recommendation (FR-009, FR-013).
"use strict";

const nodeFs = require("fs");
const path = require("path");
const { memoryView } = require("./memory.js");
const { REQUESTS } = require("./requests.js");
const { COPY } = require("./copy.js");

// Which skill Up next starts on a first run.
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

function helloLine(m) {
  const what = [m.skill, m.result].filter(Boolean).join(", ");
  return m.date ? `${COPY.home.last_lesson} ${m.date}: ${what}.` : `${COPY.home.last_lesson}: ${what}.`;
}

// memory: readLearnerRecord's result. pathData: readPathData's result.
function homeView({ memory, pathData }) {
  const unreadable = memory.status === "unreadable";
  const lessons = memory.status === "ok" && memory.record && Array.isArray(memory.record.lessons) ? memory.record.lessons : [];
  const has_history = lessons.length > 0;
  const skills = pathData && Array.isArray(pathData.skills) ? pathData.skills : [];
  const names = Object.fromEntries(skills.map((s) => [s.id, s.name]));
  const first = skills[0] || null;

  const view = memoryView(memory.status === "ok" ? memory.record : null, { names });
  let hello = null;
  if (!unreadable) hello = has_history ? { text: COPY.home.welcome_back, sub: helloLine(view) } : { text: COPY.home.welcome_first, sub: null };

  let up_next = null;
  if (has_history) {
    up_next = { kicker: COPY.home.up_next, name: COPY.home.your_next, why: COPY.home.your_next_why, start: null, find: { label: COPY.buttons.find_next }, pick_skill: COPY.buttons.pick_skill };
  } else if (first) {
    const req = startRequest(first.id);
    up_next = {
      kicker: COPY.home.up_next,
      name: first.name,
      skill: first.id,
      why: COPY.reasons[first.id] || "",
      start: req ? { kind: "start", label: req.label, request: req.request } : null,
      pick_skill: COPY.buttons.pick_skill,
    };
  }

  return { has_history, unreadable, hello, up_next, memory: view, memory_title: COPY.home.memory_title };
}

module.exports = { homeView, readPathData, startRequest };
