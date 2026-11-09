// The lesson view (data-model › Lesson view). Built only from tool results and what the learner
// sent, never from the mentor's wording (FR-014, FR-065). Pure: reduceLesson returns a new view.
"use strict";

const list = require("./checklist/index.js");
const { COPY } = require("./copy.js");

const DEMO_TOOLS = new Set(["set_ease"]);
// Sends that aren't a reply: the opening, and agreeing to a suggestion (FR-082).
const NOT_A_REPLY = new Set(["start", "yes"]);

function initialLesson(opts) {
  return {
    skill: (opts && opts.skill) || null,
    mode: "lesson",
    focus: null,
    demo_target: null,
    demo_made: false,
    demo_unknown: false,
    picked_up: false,
    continued: false,
    null_ready: false,
    replied: false,
    snapshots: 0,
    checks: 0,
    passed: false,
    saved: null,
    labels: {},
    check_list: null,
    timeline: null,
  };
}

const CLOCK = (iso) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};

function staleNote(current, kind, comp) {
  if (current.source !== "check") return COPY.check.source_stale;
  if (kind === "other_comp" && comp) return `${COPY.check.from_last_check}, ${COPY.check.on_comp} ${comp}.`;
  const at = current.checked_at && CLOCK(current.checked_at);
  return at ? `${COPY.check.from_last_check}, ${at}.` : `${COPY.check.from_last_check}.`;
}

function markStale(v, kind, comp) {
  if (!v.check_list) return v;
  return Object.assign({}, v, { check_list: Object.assign({}, v.check_list, { stale: staleNote(v.check_list, kind, comp), stale_kind: kind }) });
}

const aeLost = (ev) => !ev.ok && /AE_UNREACHABLE|AE_BUSY/.test(ev.text || "");

function sameTargets(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((x) => set.has(x));
}

function onSnapshot(v, ev) {
  const r = ev.json;
  if (aeLost(ev)) return markStale(v, "ae");
  if (!ev.ok || !r || typeof r !== "object") return v;
  const first = v.snapshots === 0;
  const picked_up = v.picked_up || (first && (r.lesson === "continued" || r.lesson === "resumed"));
  const labels = Object.assign({}, v.labels, list.labelsFromSnapshot(ev.name, r));
  const next = Object.assign({}, v, {
    snapshots: v.snapshots + 1,
    picked_up,
    labels,
    mode: r.mode || "lesson",
    focus: r.focus === undefined ? v.focus : r.focus,
    demo_target: r.demo_target || null,
    null_ready: v.null_ready || r.null_ready === true,
  });
  if (r.demo_used === true) { next.demo_made = true; next.demo_unknown = false; }
  if (r.demo_target) next.demo_unknown = false;
  const current = v.check_list;
  if (Array.isArray(r.targets) && r.targets.length && !(current && current.source === "check" && sameTargets(r.targets, current.target_ids))) {
    const proposed = !next.replied && !next.picked_up && next.checks === 0;
    next.check_list = list.fromSnapshot(ev.name, r.targets, { labels, proposed, focus: next.focus });
  }
  return next;
}

function onCheck(v, ev) {
  const r = ev.json;
  // AE unreachable or busy, a different comp, or anything unreadable: never replace the list.
  if (!ev.ok || !r || r.comp_matches !== true) {
    if (ev.ok && r && r.comp_matches === false) return markStale(v, "other_comp", r.lesson_comp);
    return markStale(v, "ae");
  }
  const built = list.fromCheck(ev.name, r, { labels: v.labels, previous: v.check_list, at: ev.at });
  const next = Object.assign({}, v, { checks: v.checks + 1, passed: built.passed, check_list: built });
  next.demo_unknown = false; // a check settles it either way (FR-030)
  if (built.marks_demo) next.demo_made = true;
  return next;
}

function onSent(v, ev) {
  const reply = !NOT_A_REPLY.has(ev.kind);
  const next = Object.assign({}, v, { replied: v.replied || reply, continued: v.continued || ev.kind === "continue" });
  if (reply && v.check_list && v.check_list.source === "opening" && v.check_list.proposed) next.check_list = list.dropProposed(v.check_list);
  return next;
}

function onTurnEnd(v) {
  if (v.check_list && v.check_list.updating) return Object.assign({}, v, { check_list: list.markFocusStale(v.check_list) });
  return v;
}

function reduceLesson(view, ev) {
  const v = view || initialLesson();
  if (!ev) return v;
  if (ev.type === "sent") return onSent(v, ev);
  if (ev.type === "turn_end") return onTurnEnd(v);
  if (ev.type !== "tool_result") return v;
  if (DEMO_TOOLS.has(ev.name)) return ev.ok ? Object.assign({}, v, { demo_made: true, demo_unknown: false }) : v;
  if (ev.name === "record_lesson") return Object.assign({}, v, { saved: ev.ok === true && !!ev.json && ev.json.saved === true });
  if (list.isSnapshot(ev.name)) return onSnapshot(v, ev);
  if (list.isCheck(ev.name)) return onCheck(v, ev);
  return v;
}

// data-model › Stage: done if passed, else try on a reply, check, demo or a picked-up lesson.
function stageOf(view) {
  const v = view || initialLesson();
  const stage = v.passed ? "done" : v.replied || v.checks > 0 || v.demo_made || v.demo_unknown || v.picked_up ? "try" : "pick";
  const order = ["pick", "try", "done"];
  const at = stage === "done" ? order.length : order.indexOf(stage);
  const steps = order.map((name, i) => ({ name, label: COPY.lesson.stages[name], state: i < at ? "done" : i === at ? "current" : "upcoming" }));
  return { stage, steps };
}

// The resuming line (D16): from the first snapshot's value alone, and not after Continue lesson.
const showsResuming = (view) => !!view && view.picked_up && !view.continued;

module.exports = { initialLesson, reduceLesson, stageOf, showsResuming };
