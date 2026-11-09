// The lesson view (data-model › Lesson view). Built only from tool results and what the learner
// sent, never from the mentor's wording (FR-014, FR-065). Pure: reduceLesson returns a new view.
"use strict";

const list = require("./checklist/index.js");
const { TABLE, skillIdForTool } = require("./skills.js");
const { COPY } = require("./copy.js");
const { shortDate } = require("./memory.js");

const DEMO_TOOLS = new Set(TABLE.map((s) => s.demo));
// Sends that aren't a reply: the openings, and agreeing to a suggestion (FR-082).
const NOT_A_REPLY = new Set(["start", "new_lesson", "warm_up", "find_next", "yes"]);

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
    offset_kind: null,
    pivot_keyed: false,
    null_stage: null,
    landing_hard: [],
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
  if (kind === "exited") return COPY.check.before_stopped;
  if (kind === "continued") {
    const when = current.checked_at && [shortDate(current.checked_at), CLOCK(current.checked_at)].filter(Boolean).join(", ");
    return when ? `${COPY.check.from_last_check}, ${when}.` : `${COPY.check.from_last_check}.`;
  }
  if (kind === "other_comp" && comp) return `${COPY.check.from_last_check}, ${COPY.check.on_comp} ${comp}.`;
  const at = current.checked_at && CLOCK(current.checked_at);
  return at ? `${COPY.check.from_last_check}, ${at}.` : `${COPY.check.from_last_check}.`;
}

function markStale(v, kind, comp) {
  if (!v.check_list) return v;
  return Object.assign({}, v, { check_list: Object.assign({}, v.check_list, { stale: staleNote(v.check_list, kind, comp), stale_kind: kind }) });
}

const aeLost = (ev) => !ev.ok && /AE_UNREACHABLE|AE_BUSY/.test(ev.text || "");
// The mentor's refusal of a second save: the lesson is saved, even if the panel never saw the first.
const alreadySaved = (ev) => !ev.ok && /^LESSON_ALREADY_SAVED/.test(ev.text || "");

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
  // FR-015: rows from a check are only ever replaced by the next check.
  const fromCheck = v.check_list && v.check_list.source === "check";
  if (Array.isArray(r.targets) && r.targets.length && !fromCheck) {
    const proposed = !next.replied && !next.picked_up && next.checks === 0;
    next.check_list = list.fromSnapshot(ev.name, r.targets, { labels, proposed, focus: next.focus, snapshot: r });
  }
  return Object.assign(next, list.snapshotFields(ev.name, r, v));
}

function onCheck(v, ev) {
  const r = ev.json;
  // AE unreachable or busy, a different comp, or anything unreadable: never replace the list.
  if (!ev.ok || !r || r.comp_matches !== true) {
    if (ev.ok && r && r.comp_matches === false) return markStale(v, "other_comp", r.lesson_comp);
    return markStale(v, "ae");
  }
  if (list.isUngraded(ev.name, r)) return markStale(v, "ungraded");
  const built = list.fromCheck(ev.name, r, { labels: v.labels, previous: v.check_list, at: ev.at, landing_hard: v.landing_hard, timeline: v.timeline });
  // A pass whose save has answered is over: a later check, asked for after it (FR-046), updates the
  // rows but can't unsay the result.
  const over = v.passed && typeof v.saved === "boolean";
  const next = Object.assign({}, v, { checks: v.checks + 1, passed: over || built.passed, check_list: built });
  if (built.view_fields) Object.assign(next, built.view_fields);
  if (Array.isArray(r.codes) && r.codes.includes("null_ready")) next.null_ready = true;
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

// A turn ended early. demo_unknown if a demonstration may have landed unseen (FR-030): no result came
// back and either the runtime can't promise it never started, or a demo call was seen on A.
function onCutOff(v, ev) {
  const maybeDemo = !ev.demoResult && !v.demo_made && ((ev.kind === "show_me" && !ev.announcesCalls) || ev.demoCallSeen);
  return maybeDemo ? Object.assign({}, v, { demo_unknown: true }) : v;
}

function onDemo(v) {
  const next = Object.assign({}, v, { demo_made: true, demo_unknown: false });
  if (v.check_list && v.demo_target) next.check_list = list.markDemo(v.check_list, v.demo_target);
  return next;
}

function reduceLesson(view, ev) {
  let v = view || initialLesson();
  if (!ev) return v;
  // Whichever tool ran says whose lesson this is (a real hand-over on A changes it).
  const tool = ev.type === "tool_result" ? skillIdForTool(ev.name) : null;
  if (tool && v.skill !== tool) v = Object.assign({}, v, { skill: tool });
  if (ev.type === "sent") return onSent(v, ev);
  if (ev.type === "turn_end") return onTurnEnd(v);
  if (ev.type === "cut_off") return onCutOff(v, ev);
  if (ev.type === "continued") return markStale(v, "continued");
  if (ev.type === "exited") return markStale(v, "exited");
  if (ev.type !== "tool_result") return v;
  if (DEMO_TOOLS.has(ev.name)) return ev.ok ? onDemo(v) : v;
  if (ev.name === "record_lesson") return Object.assign({}, v, { saved: v.saved === true || alreadySaved(ev) || (ev.ok === true && !!ev.json && ev.json.saved === true) }); // a refused second record can't unsay the first
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

module.exports = { initialLesson, reduceLesson, stageOf, showsResuming, DEMO_TOOLS };
