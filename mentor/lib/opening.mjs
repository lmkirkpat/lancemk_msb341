// The opening read (spec 004 FR-048, FR-049; contracts/skill-module.md § 4): a snapshot tool of a
// skill with a review calls this right after takeSnapshot(), so the tool, not the model, decides
// lesson or review, and the reply carries this skill's slice of the learner record. The mentor then
// opens with one call and has nothing to narrate before it.
//
// The mode, in FR-048's order: 1. the `mode` the call gave (asked); 2. the mode of the lesson this
// call carries on (in_progress, session.openMode); 3. a review when this skill's review may be
// offered now, by the same test recommend_next applies (review_due, recommend.reviewFor); 4. a lesson
// (default). A due review with nothing new on this comp is a lesson (OR-1).

import { MentorError, MESSAGES } from "../errors.mjs";
import { readRecord } from "./learner-store.mjs";
import { readPath, skillName } from "./path.mjs";
import { reviewFor } from "./recommend.mjs";
import { isDue, localDate } from "./reviews.mjs";
import * as session from "./session.mjs";

const MODES = ["lesson", "review"];
const STATUSES = ["not_started", "practicing", "learned"];

// The record as read_learner_record reads it: a broken file is set aside next to the original and
// never written over. Unlike read_learner_record, this never throws for it: it returns the same
// code and message as `error`, and the record as null.
function readOnce() {
  try {
    const { path: _file, ...record } = readRecord();
    return { record, error: null };
  } catch (e) {
    if (e instanceof MentorError && e.code === "RECORD_UNREADABLE") return { record: null, error: { code: e.code, message: e.message } };
    // Any other read failure (permissions, say) leaves the file where it is: the same sentence.
    return { record: null, error: { code: "RECORD_UNREADABLE", message: MESSAGES.RECORD_UNREADABLE } };
  }
}

// Whole local calendar days from `iso` to `now` (0 today, 1 yesterday), or null.
function daysSince(iso, now) {
  const t = typeof iso === "string" ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return null;
  const day = (d) => { const [y, m, dd] = localDate(d).split("-").map(Number); return new Date(y, m - 1, dd); };
  return Math.round((day(now) - day(new Date(t))) / 86400000);
}

// FR-049's `learner`: this skill's slice and nothing more (no skill ID, no file name or path, no
// lesson list, no other skill's state beyond other_skills).
function slice({ skill, record, error, finder, now }) {
  const path = readPath();
  const skills = (record && record.skills) || {};
  const entry = skills[skill] || null;
  const mine = (record && Array.isArray(record.lessons) ? record.lessons : []).filter((l) => l && l.skill === skill);
  let newest = null;
  for (const l of mine) if (!newest || String(l.date || "") >= String(newest.date || "")) newest = l;
  const learnedId = (id) => !!(skills[id] && skills[id].status === "learned");
  const own = path.skills.find((s) => s.id === skill);
  const hard = own ? own.hard.filter((id) => id !== path.on_ramp.id) : [];
  const mentions = finder && Array.isArray(finder.mentions) ? finder.mentions.filter((id) => !hard.includes(id)) : [];

  const out = { readable: !error };
  if (error) out.error = error;
  Object.assign(out, {
    status: entry && STATUSES.includes(entry.status) ? entry.status : "not_started",
    times_passed: entry && Number.isFinite(entry.times_passed) ? entry.times_passed : 0,
    next: entry && typeof entry.next === "string" ? entry.next : null,
    last_attempted: newest && typeof newest.attempted === "string" ? newest.attempted : null,
    days_since_practiced: entry ? daysSince(entry.last_practiced, now) : null,
    review_due: isDue(entry, now),
    other_skills: [
      ...hard.map((id) => ({ skill_name: skillName(id), learned: learnedId(id), hard: true })),
      ...mentions.map((id) => ({ skill_name: skillName(id), learned: learnedId(id), hard: false })),
    ],
  });
  return out;
}

// `finder` is the skill's FINDERS entry (its focus, review flag and mentions). `fresh` is the call's
// own fresh flag, for a tool that takes one. Returns { mode, mode_source, learner, record }; `record`
// is the record as read (null when unreadable) for a tool that needs more of it, and never goes in
// a reply. Reads the record once and writes nothing to it.
export function opening({ skill, mode, snapshot, fresh = false, finder, now = new Date() }) {
  const compId = snapshot.comp.id;
  // The session first: an unreadable session file fails here as it would in session.start(),
  // before the record is read (so an unreadable record isn't set aside unsaid).
  const carried = session.openMode(skill, compId, snapshot, { fresh });
  const { record, error } = readOnce();
  const learner = slice({ skill, record, error, finder, now });
  const done = (m, source) => ({ mode: m, mode_source: source, learner, record });

  if (mode !== undefined && mode !== null) return done(mode, "asked"); // session.start checks it
  if (MODES.includes(carried)) return done(carried, "in_progress");
  if (record) {
    const offers = session.reviewOffers();
    if (reviewFor({ skill, record, finders: { [skill]: finder }, snapshot, now, offers })) {
      // Remembered as recommend_next remembers its offers, so FR-020's one review per session holds
      // whichever tool offered it. Offering it again doesn't add another.
      if (!offers.some((o) => o && o.skill === skill)) {
        try {
          session.recordReviewOffer(skill);
        } catch {
          // Best effort: the review still stands.
        }
      }
      return done("review", "review_due");
    }
  }
  return done("lesson", "default");
}
