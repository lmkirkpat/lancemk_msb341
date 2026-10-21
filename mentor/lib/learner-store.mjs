// The learner record (data-model.md › Learner record), kept in learner.json so the mentor
// remembers across sessions (FR-010). Plain JSON the learner can open and read. Writes refuse
// emails and phone numbers (FR-012, constitution IV), and only LessonEntry fields are stored, so
// there is nowhere to put a name.

import fs from "node:fs";
import { LEARNER_FILE } from "../paths.mjs";
import { MentorError } from "../errors.mjs";
import { readJson } from "./json-file.mjs";
import { pastTargetsIn } from "./reviews.mjs";

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
export function recordLesson(input, skills) {
  const entry = { date: new Date().toISOString(), ...validate(input, skills) };
  const record = read();
  const prev = record.skills[entry.skill] || { status: "not_started", times_passed: 0 };
  const times_passed = prev.times_passed + (entry.result === "passed" ? 1 : 0);
  const skill = {
    status: times_passed > 0 ? "learned" : "practicing",
    last_practiced: entry.date,
    times_passed,
    next: entry.next,
  };
  record.lessons.push(entry);
  record.skills[entry.skill] = skill;
  write(record);
  return { entry, skill };
}
