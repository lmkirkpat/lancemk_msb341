// The review schedule and what a review needs from the record (spec 004 FR-018 to FR-021, FR-023;
// research R5; data-model › Skill state). Pure: callers read and write the record. Dates are local
// calendar days ("YYYY-MM-DD"), so a skill learned at 11 pm is due the next morning.

export const INTERVALS = [1, 3, 7, 14, 30];

const pad = (n) => String(n).padStart(2, "0");

export function localDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(ymd, n) {
  const [y, m, d] = ymd.split("-").map(Number);
  return localDate(new Date(y, m - 1, d + n));
}

// After a passed review, the next interval for a run of `run` passes in a row (1 → 3 days, … ≥ 4 → 30).
const afterPassedReview = (run) => INTERVALS[Math.min(run, INTERVALS.length - 1)];

// Fills in the review fields an older record doesn't have (FR-023): a learned skill with no
// review_due is due the day after it was last practiced; reviews_passed_in_row reads as 0. Returns
// a copy; the record itself is never rewritten by reading it.
export function withReviewFields(skill) {
  if (!skill) return skill;
  const out = { ...skill };
  if (out.reviews_passed_in_row == null) out.reviews_passed_in_row = 0;
  if (out.status === "learned" && !out.review_due && out.last_practiced) out.review_due = addDays(localDate(new Date(out.last_practiced)), INTERVALS[0]);
  return out;
}

// The skill's status, times passed and review fields after one recorded lesson (data-model › Skill
// state › Transitions). `kind` is first, practice or review; `date` the lesson's time; `wasLearned`
// defaults to whether `prev` is learned. Only reviews move a learned skill's schedule, and a review
// with no check (not_checked) moves nothing.
export function nextState(prev, { kind, result, date, wasLearned }) {
  const before = prev ? withReviewFields(prev) : { status: "not_started", times_passed: 0 };
  const learned = wasLearned ?? before.status === "learned";
  const d = localDate(date);
  const passed = result === "passed";
  const times_passed = (before.times_passed || 0) + (passed ? 1 : 0);
  const keep = () => {
    const s = { status: learned ? "learned" : "practicing", times_passed };
    if (before.review_due) s.review_due = before.review_due;
    if (learned || before.review_due) s.reviews_passed_in_row = before.reviews_passed_in_row || 0;
    return s;
  };

  if (!learned) {
    // A first pass of any kind ("already knew it" included) starts the schedule.
    if (passed) return { status: "learned", times_passed, review_due: addDays(d, INTERVALS[0]), reviews_passed_in_row: 0 };
    return keep();
  }
  if (kind !== "review" || result === "not_checked") return keep();
  if (passed) {
    const run = (before.reviews_passed_in_row || 0) + 1;
    return { status: "learned", times_passed, review_due: addDays(d, afterPassedReview(run)), reviews_passed_in_row: run };
  }
  return { status: "learned", times_passed, review_due: addDays(d, INTERVALS[0]), reviews_passed_in_row: 0 };
}

// Due when today's local date is on or after review_due. Never for a skill that isn't learned.
export function isDue(skill, now = new Date()) {
  if (!skill || skill.status !== "learned") return false;
  const s = withReviewFields(skill);
  return !!s.review_due && localDate(now) >= s.review_due;
}

const refKey = (t) => `${t.layer}\u0000${t.property}`;

// {layer, property} pairs, de-duplicated, in first-seen order.
export function uniqueRefs(refs) {
  const seen = new Set();
  const out = [];
  for (const t of refs || []) {
    if (!t || typeof t.layer !== "string" || typeof t.property !== "string") continue;
    const k = refKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ layer: t.layer, property: t.property });
  }
  return out;
}

// Past targets for a skill on one project and comp (data-model › Lesson entry › Past targets).
export function pastTargetsIn(record, skill, project, comp) {
  if (!record || !Array.isArray(record.lessons)) return [];
  return uniqueRefs(
    record.lessons
      .filter((l) => l && l.skill === skill && l.project === project && l.comp === comp && Array.isArray(l.targets))
      .flatMap((l) => l.targets),
  );
}
