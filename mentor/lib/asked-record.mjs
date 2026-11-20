// Spec 014 phase 3 (US5; data-model § 3, research R8): "asked" entries in the learner record, one per
// answer with steps. They sit in their own list (learner-store's `asked`), so no lesson reader, review
// date, past target, mark or practice rule sees them: an answer never changes a skill's state
// (FR-039, SC-008), and the mentor never tells the learner what's in them (FR-041, FR-043).
//
// What an entry holds, and never holds (FR-040, FR-044, FR-045): the comp and project from the answer's
// own read, the layers its steps were on, the goal in general motion terms, the skills its steps used,
// which of those were already learned, whether a go-deeper started, and what the learner said back,
// marked as said. Never the learner's question, expression or error text, an effect's name from the
// read, or a verdict. Every text field gets the personal-detail check.

import { MentorError, registerErrors } from "../errors.mjs";
import { askedOf, isUnsafe, peekRecord, updateAsked } from "./learner-store.mjs";

export const GOAL_MAX = 120;
export const SAID_MAX = 120;

registerErrors({
  GOAL_NOT_GENERAL:
    "Add the goal in a few general motion words (at most 120 characters): what the motion should do, never the learner's own sentence, a name, or an effect's name from the comp.",
  SAID_NOT_GENERAL:
    "Say what the learner said back in a few general words (at most 120 characters), not their sentence and no names.",
});

const isWordChar = (c) => c !== undefined && /[\p{L}\p{N}_]/u.test(c);
function holdsWhole(text, name) {
  const t = text.toLowerCase();
  const n = name.toLowerCase();
  for (let i = t.indexOf(n); i >= 0; i = t.indexOf(n, i + 1)) {
    if (!isWordChar(t[i - 1]) && !isWordChar(t[i + n.length])) return true;
  }
  return false;
}

// The names of the effects the read returned, on any layer.
function effectNames(snapshot) {
  const out = new Set();
  for (const l of snapshot && Array.isArray(snapshot.layer_info) ? snapshot.layer_info : []) {
    for (const e of Array.isArray(l.effects) ? l.effects : []) if (e && typeof e.name === "string" && e.name.trim()) out.add(e.name.trim());
  }
  return [...out];
}

// FR-040's goal: general motion terms, at most GOAL_MAX characters, no personal detail, no effect name
// from the read. Returns the trimmed goal, or null when there's none. Throws GOAL_NOT_GENERAL or
// UNSAFE_RECORD. Copied expression text is give_answer's own check (RECORD_HAS_EXPRESSION).
export function checkGoalText(goal, snapshot) {
  if (goal === undefined || goal === null) return null;
  if (typeof goal !== "string") throw new MentorError("GOAL_NOT_GENERAL");
  const g = goal.trim().replace(/\s+/g, " ");
  if (!g) return null;
  if (isUnsafe(g)) throw new MentorError("UNSAFE_RECORD");
  if (g.length > GOAL_MAX) throw new MentorError("GOAL_NOT_GENERAL");
  const effect = effectNames(snapshot).find((n) => holdsWhole(g, n));
  // T081 review: name the word, so the retry isn't blind.
  if (effect) throw new MentorError("GOAL_NOT_GENERAL", `The goal holds ${effect}, an effect's name from the comp. Say what the motion should do in general words instead, without it.`);
  return g;
}

// The note_said text: as the learner's, general terms, at most SAID_MAX characters, no personal detail.
export function checkSaidText(said) {
  if (typeof said !== "string") throw new MentorError("SAID_NOT_GENERAL");
  const s = said.trim().replace(/\s+/g, " ");
  if (!s || s.length > SAID_MAX) throw new MentorError("SAID_NOT_GENERAL");
  if (isUnsafe(s)) throw new MentorError("UNSAFE_RECORD");
  return s;
}

const learnedIn = (record, id) => !!(record && record.skills && record.skills[id] && record.skills[id].status === "learned");

// A date no entry in `list` has yet, so an entry's date is its link from the session (entry_date).
function freshDate(list, now) {
  let t = now;
  const taken = new Set(list.map((e) => (e && typeof e === "object" ? e.date : null)));
  while (taken.has(new Date(t).toISOString())) t += 1;
  return new Date(t).toISOString();
}

// Writes one asked entry and returns it, or null when nothing was written: the record can't be read
// (it's left exactly as it is), the project or comp name holds a personal detail, or there's no goal.
// `skills` are the IDs the steps used, in step order; `layers` the steps' layers. The goal must have
// passed checkGoalText. `after_learning` comes from the record, never the caller (FR-041).
export function recordAsked({ project, comp, layers = [], goal, skills = [], now = Date.now() }) {
  if (typeof goal !== "string" || !goal) return null;
  if (typeof project !== "string" || typeof comp !== "string" || isUnsafe(project) || isUnsafe(comp)) return null;
  const record = peekRecord();
  if (!record) return null;
  const ids = [...new Set(skills.filter((s) => typeof s === "string" && s))];
  const names = [...new Set(layers.filter((l) => typeof l === "string" && l && !isUnsafe(l)))];
  return updateAsked((list) => {
    const entry = {
      kind: "asked",
      date: freshDate(list, now),
      project,
      comp,
      layers: names,
      goal,
      skills: ids,
      after_learning: ids.filter((id) => learnedIn(record, id)),
      went_deeper: null,
    };
    list.push(entry);
    return structuredClone(entry);
  });
}

const findEntry = (list, date) => list.find((e) => e && typeof e === "object" && e.kind === "asked" && e.date === date) || null;

// go_deeper: the skill the learner went deeper on, on the answer's entry. True when it was set.
export function markWentDeeper(date, skill) {
  if (typeof date !== "string" || typeof skill !== "string") return false;
  return !!updateAsked((list) => {
    const e = findEntry(list, date);
    if (!e) return null;
    e.went_deeper = skill;
    return true;
  });
}

// note_said: what the learner said back, on the answer's entry, replacing an earlier one. The entry
// as saved, or null when there's no such entry or the record can't be read.
export function setSaid(date, said) {
  const s = checkSaidText(said);
  if (typeof date !== "string") return null;
  return updateAsked((list) => {
    const e = findEntry(list, date);
    if (!e) return null;
    e.said = s;
    return structuredClone(e);
  });
}

// recommend_next raised this entry's skill (FR-042: once per entry). The time is kept, so a repeat
// call in the same session window can raise it again (see recommend.mjs › askedCandidate).
export function markRaised(date, now = Date.now()) {
  if (typeof date !== "string") return false;
  return !!updateAsked((list) => {
    const e = findEntry(list, date);
    if (!e) return null;
    if (!e.raised) e.raised = new Date(now).toISOString();
    return true;
  });
}

// Whether an entry for `date` is in the record now (for note_said's NO_ANSWER).
export function hasEntry(date) {
  return !!findEntry(askedOf(peekRecord()), date);
}
