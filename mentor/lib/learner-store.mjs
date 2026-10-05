// The learner record (data-model.md › Learner record), kept in learner.json so the mentor
// remembers across sessions (FR-010). Plain JSON the learner can open and read. Writes refuse
// emails and phone numbers (FR-012, constitution IV), and only LessonEntry fields are stored, so
// there is nowhere to put a name.

import fs from "node:fs";
import { LEARNER_FILE } from "../paths.mjs";
import { MentorError } from "../errors.mjs";

const SKILLS = ["easing.basic"];
const RESULTS = ["passed", "partial", "not_checked"];
const TEXT_FIELDS = ["project", "comp", "attempted", "summary", "next"];

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// North American (801-555-0123, (801) 555 0123) and international (+44 20 7946 0958). Shaped so
// timings, percentages, frame ranges and ISO dates don't match.
const PHONE = [/\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/, /\+\d[\d\s().-]{6,}\d/];

const empty = () => ({ version: 1, skills: {}, lessons: [] });

function read() {
  try {
    return JSON.parse(fs.readFileSync(LEARNER_FILE, "utf8"));
  } catch {
    return empty();
  }
}

function write(record) {
  const tmp = `${LEARNER_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(record, null, 2) + "\n");
  fs.renameSync(tmp, LEARNER_FILE);
}

function isUnsafe(text) {
  return EMAIL.test(text) || PHONE.some((re) => re.test(text));
}

// Returns a clean LessonEntry (without date), or throws before anything is written.
function validate(input) {
  if (!SKILLS.includes(input.skill)) throw new Error(`skill must be one of: ${SKILLS.join(", ")}`);
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

// Appends the lesson and updates the skill's state. `learned` after one pass, and it stays learned:
// a later partial is practice, not forgetting.
export function recordLesson(input) {
  const entry = { date: new Date().toISOString(), ...validate(input) };
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
