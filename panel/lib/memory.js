// Reading the learner record (spec 007 FR-011, FR-050, FR-095, data-model › Record reading). Only
// reads learner.json (constitution II); the mentor's record_lesson tool is the only writer.
"use strict";

const nodeFs = require("fs");
const path = require("path");
const { defaultHome } = require("./config.js");
const { COPY } = require("./copy.js");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FILE = "learner.json";
const SET_ASIDE = `${FILE}.unreadable-`;

// The mentor's own test (mentor/lib/learner-store.mjs).
function isValidRecord(r) {
  return !!r && typeof r === "object" && !Array.isArray(r) && !!r.skills && typeof r.skills === "object" && Array.isArray(r.lessons);
}

// → { status: "missing" | "unreadable" | "ok", record }. The mentor moves a broken file aside on its
// first read, so a missing file with a set-aside copy next to it is unreadable, not a first run.
function readLearnerRecord(opts) {
  const fs = (opts && opts.fs) || nodeFs;
  const home = (opts && opts.home) || defaultHome();
  let text;
  try {
    text = fs.readFileSync(path.join(home, FILE), "utf8");
  } catch (e) {
    if (e.code !== "ENOENT") return { status: "unreadable", record: null };
    return { status: hasSetAside(fs, home) ? "unreadable" : "missing", record: null };
  }
  try {
    const record = JSON.parse(text);
    return isValidRecord(record) ? { status: "ok", record } : { status: "unreadable", record: null };
  } catch (e) {
    return { status: "unreadable", record: null };
  }
}

// The same read for the panel's start-up, so a slow disk can't hold up the first paint (FR-008, SC-004).
function readLearnerRecordAsync(opts) {
  const fs = (opts && opts.fs) || nodeFs;
  const home = (opts && opts.home) || defaultHome();
  return new Promise((resolve) => {
    fs.readFile(path.join(home, FILE), "utf8", (err, text) => {
      const buffered = err
        ? { readFileSync: () => { throw err; }, readdirSync: fs.readdirSync.bind(fs) }
        : { readFileSync: () => text };
      resolve(readLearnerRecord({ fs: buffered, home }));
    });
  });
}

function hasSetAside(fs, home) {
  try {
    return fs.readdirSync(home).some((f) => f.startsWith(SET_ASIDE));
  } catch (e) {
    return false;
  }
}

// id → name, from the path data. Empty when it can't be read; a name is then "A skill", never an id.
function readSkillNames(opts) {
  const fs = (opts && opts.fs) || nodeFs;
  try {
    const data = JSON.parse(fs.readFileSync(path.join(opts.repoPath, "mentor", "curriculum", "path.json"), "utf8"));
    return Object.fromEntries(data.skills.map((s) => [s.id, s.name]));
  } catch (e) {
    return {};
  }
}

// "Oct 3", in the learner's local time.
function shortDate(iso) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function resultWord(result) {
  if (!result) return "";
  return Object.prototype.hasOwnProperty.call(COPY.home.results, result) ? COPY.home.results[result] : COPY.home.results.not_checked;
}

// → { empty: true, text } or { empty: false, date, skill, result, next }, for the latest lesson. A
// field the record doesn't have is "", and the card leaves it out.
function memoryView(record, opts) {
  const names = (opts && opts.names) || { "easing.basic": "Easing" };
  const lessons = record && Array.isArray(record.lessons) ? record.lessons.filter((l) => l && typeof l === "object") : [];
  if (!lessons.length) return { empty: true, text: COPY.home.memory_empty };
  const last = lessons[lessons.length - 1];
  const skill = record.skills && record.skills[last.skill];
  return {
    empty: false,
    date: last.date ? shortDate(last.date) : "",
    skill: names[last.skill] || COPY.home.a_skill,
    result: resultWord(last.result),
    next: (skill && skill.next) || last.next || "",
  };
}

module.exports = { readLearnerRecord, readLearnerRecordAsync, isValidRecord, memoryView, readSkillNames, shortDate };
