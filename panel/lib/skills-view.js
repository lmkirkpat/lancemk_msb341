// The Skills tab (spec 007 FR-048, FR-049, data-model): the real path, one list, from the record and
// the path and skills-built data. Pure. The panel compares a stored review date with today and
// nothing more (FR-051); it never schedules anything.
"use strict";

const { COPY } = require("./copy.js");
const { shortDate } = require("./memory.js");

const W = COPY.skills.words;
const GLYPH = { learned: "✓", due: "↻", progress: "◐", none: "○", soon: "·" };

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// `review_due` as a plain date compare with today. Easing's review flag is false, so it never shows.
function isDue(info, built, now) {
  if (!info || info.status !== "learned" || !built || !built.review || !info.review_due) return false;
  return String(info.review_due).slice(0, 10) <= ymd(now);
}

// Days until a stored review date, for the words "tomorrow" and "in 3 days" only: the date is the
// mentor's. null with no review, no readable date, or a date that isn't ahead of today, so the date
// from before a save is never read out as the next one.
function daysUntilReview(info, built, now) {
  if (!info || !built || !built.review) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(info.review_due || ""));
  if (!m) return null;
  const days = Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  return days > 0 ? days : null;
}

function stateOfSkill(info, built, now) {
  if (!built) return "soon";
  if (isDue(info, built, now)) return "due";
  if (info && info.status === "learned") return "learned";
  if (info && info.status === "practicing") return "progress";
  return "none";
}

function recordSkills(memory) {
  return memory && memory.status === "ok" && memory.record && memory.record.skills ? memory.record.skills : {};
}

// memory, pathData, built (builtSkills' list), now → { rows, summary, learned, in_progress, total, state, due_count }.
function skillsView({ memory, pathData, built, now }) {
  const info = recordSkills(memory);
  const byId = new Map(built.map((s) => [s.id, s]));
  const list = pathData && Array.isArray(pathData.skills) ? pathData.skills : [];
  const rows = list.map((s) => {
    const cls = stateOfSkill(info[s.id], byId.get(s.id), now);
    return { id: s.id, name: s.name, cls, glyph: GLYPH[cls], word: { learned: W.learned, due: W.due, progress: W.progress, none: W.none, soon: W.later }[cls], pressable: cls !== "soon" };
  });
  const ramp = pathData && pathData.on_ramp ? [{ id: pathData.on_ramp.id, name: pathData.on_ramp.name, cls: "learned", glyph: GLYPH.learned, word: COPY.skills.assumed, pressable: false }] : [];
  const rowsOfBuilt = rows.filter((r) => r.cls !== "soon");
  const total = rowsOfBuilt.length;
  const due_count = rowsOfBuilt.filter((r) => r.cls === "due").length;
  const learned = rowsOfBuilt.filter((r) => r.cls === "learned" || r.cls === "due").length;
  const in_progress = rowsOfBuilt.filter((r) => r.cls === "progress").length;
  let summary = COPY.skills.summary(learned, total);
  if (due_count) summary += ` · ${COPY.skills.due_count(due_count)}`;
  else if (in_progress) summary += ` · ${COPY.skills.progress_count(in_progress)}`;
  let state = "few";
  if (learned === 0 && in_progress === 0) state = "empty";
  else if (total > 0 && learned === total) state = "many";
  return { rows: ramp.concat(rows), summary, learned, in_progress, total, due_count, state };
}

// Home's Practice due (FR-051): the first due skill in path order and how many more are due. `built`
// is in path order, and a skill with no review is never due.
function practiceDue({ memory, built, now }) {
  const info = recordSkills(memory);
  const due = (built || []).filter((s) => isDue(info[s.id], s, now));
  if (!due.length) return null;
  return { skill: due[0].id, name: due[0].name, last_practiced: info[due[0].id].last_practiced ? shortDate(info[due[0].id].last_practiced) : null, rest: due.length - 1 };
}

// One skill's detail, or null when `id` isn't a built skill.
function skillDetail(id, { memory, pathData, built, now }) {
  const row = built.find((s) => s.id === id);
  if (!row) return null;
  const skills = recordSkills(memory);
  const info = skills[id];
  const lessons = memory && memory.status === "ok" && memory.record && Array.isArray(memory.record.lessons)
    ? memory.record.lessons.filter((l) => l && l.skill === id).slice().reverse() : [];
  const learned = !!info && info.status === "learned";
  const names = Object.fromEntries((pathData && pathData.skills || []).map((s) => [s.id, s.name]));
  const onRamp = pathData && pathData.on_ramp ? pathData.on_ramp.id : null;
  const needs = !learned && !lessons.length ? (row.hard || []).filter((h) => h !== onRamp && !(skills[h] && skills[h].status === "learned") && names[h]).map((h) => names[h]) : [];
  return {
    id, name: row.name, command: row.command,
    state: learned && row.review ? "review" : !lessons.length && !learned ? "new" : "noreview",
    tag: learned ? (isDue(info, row, now) ? "due" : "learned") : null,
    status_line: learned && info.last_practiced ? COPY.skills.learned_on(shortDate(info.last_practiced)) : info && info.status === "practicing" ? COPY.skills.in_progress : "",
    builds_on: needs,
    history: lessons.map((l) => ({ date: l.date ? shortDate(l.date) : "", comp: l.comp || "", result: Object.prototype.hasOwnProperty.call(COPY.home.results, l.result) ? COPY.home.results[l.result] : "", summary: l.summary || "", next: l.next || "" })),
  };
}

module.exports = { skillsView, skillDetail, isDue, practiceDue, daysUntilReview, recordSkills };
