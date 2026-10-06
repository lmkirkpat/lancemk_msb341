// Memory view (data-model › Memory view, FR-011). Only reads learner.json (constitution 1.1.0 › II);
// the mentor's record_lesson tool is the only writer.
"use strict";

const nodeFs = require("fs");
const path = require("path");
const { defaultHome } = require("./config.js");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SKILLS = { "easing.basic": "Easing" };
const RESULTS = { passed: "passed ✓", partial: "not finished", not_checked: "not checked" };

// The parsed record, or null when it's missing or unreadable.
function readLearnerRecord(opts) {
  const fs = (opts && opts.fs) || nodeFs;
  const home = (opts && opts.home) || defaultHome();
  try {
    return JSON.parse(fs.readFileSync(path.join(home, "learner.json"), "utf8"));
  } catch (e) {
    return null;
  }
}

// "Oct 3", in the learner's local time.
function shortDate(iso) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function plainSkill(id) {
  return SKILLS[id] || String(id || "").split(".")[0].replace(/^\w/, (c) => c.toUpperCase()) || "A skill";
}

// → { empty: true, text } or { empty: false, date, skill, result, next }
function memoryView(record) {
  if (!record || typeof record !== "object") return { empty: true, text: "No lessons yet." };
  if (record.version !== 1) return { empty: true, text: "Memory format not recognised." };
  const lessons = Array.isArray(record.lessons) ? record.lessons : [];
  if (!lessons.length) return { empty: true, text: "No lessons yet." };
  const last = lessons[lessons.length - 1];
  const skill = record.skills && record.skills[last.skill];
  return {
    empty: false,
    date: shortDate(last.date),
    skill: plainSkill(last.skill),
    result: RESULTS[last.result] || "not checked",
    next: (skill && skill.next) || last.next || "",
  };
}

module.exports = { readLearnerRecord, memoryView, shortDate };
