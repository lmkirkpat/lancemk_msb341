// What to learn next (spec 004 FR-004 to FR-007, FR-020's limits; research R7, R8;
// contracts/shared-tools.md › recommend_next). Pure and deterministic: everything it needs is passed
// in, including `now`, so the same input always gives the same answer.

import { isDue, pastTargetsIn } from "./reviews.mjs";
import { applies, marksFor } from "./marks.mjs";

// "This session" for the one-review limit (research R8): an unprompted review offer counts for this
// long, and so does a practice lesson on the same skill.
export const SESSION_WINDOW_HOURS = 3;

// `record` is the learner record, or null when it can't be read (every skill then counts as not
// started). `built` is every skill ID a tool file declares; `finders` their FINDERS; `snapshot` the
// active comp, or null when AE couldn't be reached; `offers` the session's recent review offers.
export function recommend({ path, record, built, finders = {}, snapshot = null, now, offers = [], requested_skill }) {
  const skills = (record && record.skills) || {};
  const lessons = (record && Array.isArray(record.lessons)) ? record.lessons : [];
  const windowStart = now.getTime() - SESSION_WINDOW_HOURS * 3600 * 1000;
  const ordered = [...path.skills].sort((a, b) => a.position - b.position);
  const nameOf = (id) => (id === path.on_ramp.id ? path.on_ramp.name : (path.skills.find((s) => s.id === id) || {}).name ?? null);
  const learned = (id) => id === path.on_ramp.id || (skills[id] && skills[id].status === "learned");
  const isBuilt = (id) => built.includes(id);
  const hardMet = (s) => s.hard.every(learned);
  // The kept-linear marks that apply to this comp (FR-038), so a finder agrees with its analyzer.
  const kept_linear = snapshot ? marksFor(record, snapshot.project, snapshot.comp.name).filter((m) => applies(m, snapshot)) : [];
  const focusOf = (id, exclude = []) => {
    const f = finders[id];
    if (!snapshot || !f || typeof f.focus !== "function") return null;
    try {
      const r = f.focus(snapshot, { exclude, kept_linear });
      return { count: r.count || 0, layers: r.layers || [] };
    } catch {
      return { count: 0, layers: [] };
    }
  };
  const result = (skill, kind, reason, focus, offer_practice_comp = false) => ({
    skill: skill.id, skill_name: skill.name, kind, reason, focus_layers: focus ? focus.layers : null, offer_practice_comp,
  });

  let recommendation = null;

  // 1. A built skill in progress, most recently practiced first. Never one whose hard prerequisite
  //    isn't learned (SC-005), even if the learner insisted on it before.
  const practicing = ordered
    .filter((s) => isBuilt(s.id) && hardMet(s) && skills[s.id] && skills[s.id].status === "practicing")
    .sort((a, b) => String(skills[b.id].last_practiced || "").localeCompare(String(skills[a.id].last_practiced || "")));
  if (practicing.length) recommendation = result(practicing[0], "continue", "in_progress", focusOf(practicing[0].id));

  // 2. A due review, only with the comp in view (it needs a new target), at most one per session,
  //    and none on a skill practiced in this session (FR-020). Once a review has been offered in
  //    this window, only that one can come back: a repeat call offers it again while it still
  //    qualifies, and never another.
  if (!recommendation && snapshot) {
    const offered = offers.find((o) => o && Date.parse(o.at) >= windowStart);
    const practicedRecently = (id) => lessons.some((l) => l.skill === id && l.kind !== "review" && Date.parse(l.date) >= windowStart);
    for (const s of offered ? ordered.filter((x) => x.id === offered.skill) : ordered) {
      if (!isBuilt(s.id) || !learned(s.id) || !finders[s.id] || finders[s.id].review !== true) continue;
      if (!isDue(skills[s.id], now) || practicedRecently(s.id)) continue;
      const focus = focusOf(s.id, pastTargetsIn(record, s.id, snapshot.project, snapshot.comp.name));
      if (focus && focus.count > 0) {
        recommendation = result(s, "review", "review_due", focus);
        break;
      }
    }
  }

  // 3 and 4. The next built, unlearned skill whose hard prerequisites are learned: one with something
  //    to teach in the comp first; soft prerequisites only break ties.
  if (!recommendation) {
    const open = ordered.filter((s) => isBuilt(s.id) && !learned(s.id) && hardMet(s));
    const softFirst = [...open.filter((s) => s.soft.every(learned)), ...open.filter((s) => !s.soft.every(learned))];
    const withFocus = snapshot ? softFirst.find((s) => (focusOf(s.id) || { count: 0 }).count > 0) : null;
    if (withFocus) recommendation = result(withFocus, "lesson", "next_in_path", focusOf(withFocus.id));
    else if (softFirst.length) recommendation = result(softFirst[0], "lesson", "next_in_path_no_focus", null, !!snapshot);
  }

  const out = {
    looked_at_comp: !!snapshot,
    comp: snapshot ? snapshot.comp.name : null,
    record_readable: record !== null,
    recommendation,
  };
  if (!recommendation) out.reason = "nothing_left";

  if (requested_skill !== undefined && requested_skill !== null) {
    const asked = String(requested_skill).trim();
    const s = path.skills.find((x) => x.id === asked) || path.skills.find((x) => x.name.toLowerCase() === asked.toLowerCase());
    if (!s) {
      out.requested = { skill: asked, skill_name: null, built: false, learned: false, missing_prerequisites: [], has_focus: false };
    } else {
      const focus = isBuilt(s.id) ? focusOf(s.id) : null;
      out.requested = {
        skill: s.id, skill_name: s.name, built: isBuilt(s.id), learned: !!learned(s.id),
        missing_prerequisites: s.hard.filter((p) => !learned(p)).map((p) => ({ skill: p, skill_name: nameOf(p) })),
        has_focus: !!(focus && focus.count > 0),
        review_available: finders[s.id]?.review === true,
      };
    }
  }
  return out;
}
