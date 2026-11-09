// Model → one README state id (spec 007 FR-006, data-model › View state). Pure: the panel's model
// comes from tool results, the record and the panel's own files. Step 2 and 3 fields (offset_kind,
// pivot_keyed, null_stage, no_new_target) are filled in by those tasks. test/view-state.test.js
// checks STATE_IDS against the README's table.
"use strict";

// The README's ids that draw the same screen as another: the gallery view of a lesson state.
const ALIASES = Object.freeze({ "skill-easing-check": "lesson-partial" });
// The one id the README doesn't have: step 1's Home with a record (plan P9). T052 removes it.
const INTERIM_IDS = Object.freeze(["home-return-interim"]);

const SKILL_SLUGS = {
  "keyframes.types": "keytypes",
  "easing.speed_graph": "speedgraph",
  "timing.offset": "offset",
  "transform.anchor": "pivot",
  "parenting.null": "null",
};

const STATE_IDS = Object.freeze([
  "err-mentor", "err-key", "err-credit",
  "home-loading", "home-first", "home-return", "home-lessonopen", "home-cutoff", "home-aeclosed",
  "home-unreachable", "home-busy", "home-unreadable", "home-unreadable-why",
  "skills-empty", "skills-few", "skills-many", "skills-after-review",
  "skill-detail", "skill-detail-noreview", "skill-detail-new",
  "lesson-none", "lesson-starting", "lesson-picking", "lesson-picking-starting", "lesson-picked",
  "lesson-open", "lesson-focus-replying", "lesson-focus-stale", "lesson-focused", "lesson-demo",
  "lesson-partial", "lesson-outside", "lesson-stale", "lesson-othercomp", "lesson-continued",
  "lesson-error", "lesson-error-demo", "lesson-error-demo-other", "lesson-error-demo-unknown",
  "lesson-resumed", "lesson-resumed-check",
  "lesson-pass-rate", "lesson-pass-busy", "lesson-pass-offline", "lesson-pass-refused", "lesson-start-failed", "lesson-exited",
  "lesson-passed-asking", "lesson-passed", "lesson-passed-pivot", "lesson-passed-unsaved",
  "practice", "practice-check", "practice-passed", "practice-nothing-new",
  "skill-keytypes-open", "skill-keytypes-check", "skill-speedgraph-open", "skill-speedgraph-check",
  "skill-offset-layers-open", "skill-offset-layers-check", "skill-offset-props-check",
  "skill-pivot-open", "skill-pivot-check", "skill-pivot-keyed",
  "skill-null-open", "skill-null-place", "skill-null-parent", "skill-null-move",
  "skill-easing-who", "skill-speedgraph-who",
  ...INTERIM_IDS,
]);

function homeState(m) {
  if (m.error && m.error.blocks_home) return m.error.state;
  if (m.record && m.record.status === "loading") return "home-loading";
  if (m.lesson_open) return "home-lessonopen";
  if (m.saved === "waiting") return "home-cutoff";
  if (m.saved === "aeclosed") return "home-aeclosed";
  const conn = m.connection && m.connection.state;
  if (conn === "not_connected") return "home-unreachable";
  if (conn === "busy") return "home-busy";
  if (m.record && m.record.status === "unreadable" && !m.unreadable_dismissed) return m.unreadable_why ? "home-unreadable-why" : "home-unreadable";
  if (!m.has_history) return "home-first";
  return m.step === 1 ? "home-return-interim" : "home-return";
}

function skillsState(m) {
  if (m.skill_detail === "review") return "skill-detail";
  if (m.skill_detail) return `skill-detail-${m.skill_detail}`;
  if (m.step === 1 || !m.skills_state) return null; // step 1's one-line interim (plan P9) has no id
  return m.skills_state === "after_review" ? "skills-after-review" : `skills-${m.skills_state}`;
}

function errorState(m, v) {
  const e = m.error;
  if (e.treatment !== "cut_off") return e.state;
  const showMe = !!m.turn && m.turn.kind === "show_me";
  if (showMe && v.demo_unknown) return "lesson-error-demo-unknown";
  if (showMe && v.demo_made) return v.skill === "easing.basic" ? "lesson-error-demo" : "lesson-error-demo-other";
  return e.state;
}

const hasAsk = (l) => !!l && (l.sections || []).some((s) => (s.rows || []).some((r) => r.family === "ask"));

function checkedSkillState(v, slug) {
  if (slug === "offset") return v.offset_kind === "properties" ? "skill-offset-props-check" : "skill-offset-layers-check";
  if (slug === "pivot") return v.pivot_keyed ? "skill-pivot-keyed" : "skill-pivot-check";
  if (slug === "null") return `skill-null-${v.null_stage || "place"}`;
  return `skill-${slug}-check`;
}

function openSkillState(slug) {
  return slug === "offset" ? "skill-offset-layers-open" : `skill-${slug}-open`;
}

function lessonState(m) {
  const v = m.lesson;
  if (m.error && v) return errorState(m, v);
  if (m.error) return m.error.state;
  if ((!m.lesson_open && !m.lesson_over) || !v) return "lesson-none";
  if (m.picking === "suggesting") return "lesson-picking";
  if (m.picking === "starting") return "lesson-picking-starting";
  if (v.no_new_target) return "practice-nothing-new";
  const l = v.check_list;
  if (l && l.stale_kind === "continued") return "lesson-continued";
  if (l && l.stale_kind === "other_comp") return "lesson-othercomp";
  if (l && l.stale_kind) return "lesson-stale";
  if (v.passed) {
    if (v.saved === false) return "lesson-passed-unsaved";
    if (v.saved !== true) return "lesson-passed-asking";
    if (v.mode === "review") return "practice-passed";
    return m.review_date ? "lesson-passed-pivot" : "lesson-passed";
  }
  if (v.snapshots === 0 && v.checks === 0 && m.turn && m.turn.busy) return "lesson-starting";
  if (m.from_picking && !v.replied) return "lesson-picked";
  if (v.mode === "review") return v.checks > 0 ? "practice-check" : "practice";
  const slug = SKILL_SLUGS[v.skill];
  const resumed = v.picked_up && !v.continued;
  if (resumed && v.checks === 0) return "lesson-resumed";
  if (hasAsk(l) && v.skill === "easing.basic") return "skill-easing-who";
  if (hasAsk(l) && slug === "speedgraph") return "skill-speedgraph-who";
  if (resumed && !slug) return "lesson-resumed-check";
  if (slug) return v.checks > 0 ? checkedSkillState(v, slug) : openSkillState(slug);
  if (v.checks > 0) return l && l.outside && l.outside.length ? "lesson-outside" : "lesson-partial";
  if (v.demo_made) return "lesson-demo";
  if (l && l.focus_stale) return "lesson-focus-stale";
  if (l && l.updating) return "lesson-focus-replying";
  if (l && l.source === "focus") return "lesson-focused";
  return "lesson-open";
}

// m: { config_ok, tab, step, record, has_history, connection, lesson_open, lesson, turn, error, saved,
// unreadable_why, picking, from_picking, review_date, skills_state, skill_detail }.
function stateOf(m) {
  if (!m || !m.config_ok) return null; // the not-set-up message stays as it is (FR-055)
  if (m.tab === "lesson") return lessonState(m);
  if (m.tab === "skills") return skillsState(m);
  return homeState(m);
}

module.exports = { stateOf, STATE_IDS, ALIASES, INTERIM_IDS };
