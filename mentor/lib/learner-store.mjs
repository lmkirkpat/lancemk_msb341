// The learner record (data-model.md › Learner record), kept in learner.json so the mentor
// remembers across sessions (FR-010). Plain JSON the learner can open and read. Writes refuse
// emails and phone numbers (FR-012, constitution IV), and only LessonEntry fields are stored, so
// there is nowhere to put a name.

import fs from "node:fs";
import { LEARNER_FILE } from "../paths.mjs";
import { MentorError } from "../errors.mjs";
import { readJson } from "./json-file.mjs";
import { localDate, nextState, pastTargetsIn, uniqueRefs } from "./reviews.mjs";
import { applies } from "./marks.mjs";

const RESULTS = ["passed", "partial", "not_checked"];
const TEXT_FIELDS = ["project", "comp", "attempted", "summary", "next"];

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// North American (801-555-0123, (801) 555 0123) and international (+44 20 7946 0958). Shaped so
// timings, percentages, frame ranges and ISO dates don't match.
const PHONE = [/\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/, /\+\d[\d\s().-]{6,}\d/];

const empty = () => ({ version: 1, skills: {}, lessons: [] });

// RECORD_UNREADABLE if the file is there but broken: it's set aside, never written over.
function read() {
  return readJson(LEARNER_FILE, {
    empty,
    valid: (r) => r && typeof r === "object" && r.skills && typeof r.skills === "object" && Array.isArray(r.lessons),
    code: "RECORD_UNREADABLE",
  });
}

function write(record) {
  const tmp = `${LEARNER_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(record, null, 2) + "\n");
  fs.renameSync(tmp, LEARNER_FILE);
}

function isUnsafe(text) {
  return EMAIL.test(text) || PHONE.some((re) => re.test(text));
}

// Returns a clean LessonEntry (without date), or throws before anything is written. `skills` is
// every skill ID the tool files declare (mentor/tools/index.mjs), so the store keeps no list.
function validate(input, skills) {
  if (!skills.includes(input.skill)) throw new Error(`skill must be one of: ${skills.join(", ")}`);
  if (!RESULTS.includes(input.result)) throw new Error(`result must be one of: ${RESULTS.join(", ")}`);
  if (typeof input.demo_used !== "boolean") throw new Error("demo_used must be true or false");
  for (const field of TEXT_FIELDS) {
    if (typeof input[field] !== "string") throw new Error(`${field} is required and must be text`);
    if (isUnsafe(input[field])) throw new MentorError("UNSAFE_RECORD");
  }
  const { skill, project, comp, attempted, result, demo_used, summary, next } = input;
  return { skill, project, comp, attempted, result, demo_used, summary, next };
}

export function readRecord() {
  return { ...read(), path: LEARNER_FILE };
}

// For code that only needs to look (the session's past targets and marks, recommend_next): the
// record, or null if it's there but unreadable. Unlike readRecord(), a broken file is left exactly
// where it is, so looking never changes anything.
export function peekRecord() {
  let text;
  try {
    text = fs.readFileSync(LEARNER_FILE, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") return empty();
    return null;
  }
  try {
    const r = JSON.parse(text);
    return r && typeof r === "object" && r.skills && typeof r.skills === "object" && Array.isArray(r.lessons) ? r : null;
  } catch {
    return null;
  }
}

// The {layer, property} targets of every lesson for this skill on this project and comp (FR-021:
// a review needs a target not among them). Another comp or project counts as new (Edge Cases).
// An unreadable record has none.
export function pastTargets(skill, project, comp) {
  return pastTargetsIn(peekRecord(), skill, project, comp);
}

// Appends the lesson and updates the skill's state. `learned` after one pass, and it stays learned:
// a later partial is practice, not forgetting.
//
// With `context.lesson` (the session's current lesson; record_lesson always passes it), spec 004's
// fields come from the session, never from the model: the entry's kind, already_knew and targets,
// the skill's review schedule (reviews.nextState), and the lesson's kept-linear marks. Without it,
// exactly the behaviour from before spec 004.
export function recordLesson(input, skills, context = {}) {
  const lesson = context.lesson || null;
  const now = new Date();
  const entry = { date: now.toISOString(), ...validate(input, skills) };
  // FR-038: only a passing check writes a mark, so a lesson's marks are written only with a pass.
  const newMarks = lesson && entry.result === "passed" ? marksToWrite(lesson, entry.skill, now) : [];
  const targets = lesson ? uniqueRefs(lesson.target_refs) : [];
  for (const t of targets) if (isUnsafe(t.layer) || isUnsafe(t.property)) throw new MentorError("UNSAFE_RECORD");
  const record = read();
  const prev = record.skills[entry.skill] || { status: "not_started", times_passed: 0 };

  if (!lesson) {
    const times_passed = prev.times_passed + (entry.result === "passed" ? 1 : 0);
    const skill = {
      status: times_passed > 0 ? "learned" : "practicing",
      last_practiced: entry.date,
      times_passed,
      next: entry.next,
    };
    // The review schedule isn't this call's to change: carry it over as it was.
    if (prev.review_due) skill.review_due = prev.review_due;
    if (prev.reviews_passed_in_row != null) skill.reviews_passed_in_row = prev.reviews_passed_in_row;
    record.lessons.push(entry);
    record.skills[entry.skill] = skill;
    write(record);
    return { entry, skill };
  }

  const wasLearned = prev.status === "learned";
  const kind = lesson.mode === "review" ? "review" : record.lessons.some((l) => l.skill === entry.skill) ? "practice" : "first";
  entry.kind = kind;
  if (kind === "review" && !wasLearned && entry.result === "passed") entry.already_knew = true;
  entry.targets = targets;
  const state = nextState(prev, { kind, result: entry.result, date: now, wasLearned });
  const skill = { status: state.status, last_practiced: entry.date, times_passed: state.times_passed, next: entry.next };
  if (state.review_due) skill.review_due = state.review_due;
  if (state.reviews_passed_in_row != null) skill.reviews_passed_in_row = state.reviews_passed_in_row;

  updateMarks(record, lesson, newMarks);
  record.lessons.push(entry);
  record.skills[entry.skill] = skill;
  write(record);
  return { entry, skill };
}

// The lesson's kept-linear list as full marks (data-model › Kept-linear mark), checked for personal
// details before anything is written.
function marksToWrite(lesson, skillId, now) {
  const base = lesson.baseline;
  const list = Array.isArray(lesson.kept_linear) ? lesson.kept_linear : [];
  if (!list.length) return [];
  if (!base) throw new Error("A lesson with kept-linear marks needs its baseline.");
  return list.map((m) => {
    if (isUnsafe(m.layer) || isUnsafe(m.property)) throw new MentorError("UNSAFE_RECORD");
    return {
      kind: "kept_linear", project: base.project, comp: base.comp.name, layer: m.layer, path: m.path,
      property: m.property, key_times: [...m.key_times], skill: skillId, date: localDate(now),
    };
  });
}

// Drops this comp's marks that have lapsed in the lesson's baseline, then adds the new ones, each
// replacing a mark on the same comp, layer and path. Other comps' marks are left alone. A record
// that never had marks only gains the field when there's one to keep.
function updateMarks(record, lesson, newMarks) {
  const base = lesson.baseline;
  if (!base || (!Array.isArray(record.marks) && !newMarks.length)) return;
  const here = (m) => m.project === base.project && m.comp === base.comp.name;
  let marks = (Array.isArray(record.marks) ? record.marks : []).filter((m) => !(m && m.kind === "kept_linear" && here(m) && !applies(m, base)));
  for (const m of newMarks) {
    marks = marks.filter((x) => !(x && x.kind === "kept_linear" && here(x) && x.layer === m.layer && x.path === m.path));
    marks.push(m);
  }
  record.marks = marks;
}
