// LessonView (data-model › LessonView, CheckList). Built only from tool results in the stream,
// never from the mentor's wording (research R5, FR-007). Pure: reduceLesson returns a new view.
"use strict";

const STATE_LABELS = {
  eased_by_learner: "you ✓",
  eased_by_demo: "demo (mentor)",
  still_linear: "linear ✗",
};

function initialLesson() {
  return { demo_made: false, checks: 0, passed: false, check_list: null, recorded: false };
}

function checkListFrom(result) {
  const targets = Array.isArray(result.targets) ? result.targets : [];
  const rows = targets.map((t) => ({
    label: String(t.label || ""),
    state: t.result,
    shown: STATE_LABELS[t.result] || "not checked", // unknown values are never a pass
    ok: t.result === "eased_by_learner" || t.result === "eased_by_demo",
  }));
  const s = result.summary || {};
  const learnerEased = Number(s.learner_eased) || 0;
  const total = Number(s.total_for_learner) || 0;
  const still = Number(s.still_linear) || 0;
  return {
    rows,
    outside: Array.isArray(result.unexpected_changes) ? result.unexpected_changes.map(String) : [],
    summary: `${learnerEased} of ${total} yours eased · ${still} still linear`,
    passed: result.passed === true,
    stale: false,
  };
}

function reduceLesson(view, ev) {
  const v = view || initialLesson();
  if (!ev || ev.type !== "tool_result") return v;
  if (ev.name === "set_ease") {
    return ev.ok ? Object.assign({}, v, { demo_made: true }) : v;
  }
  if (ev.name === "record_lesson") {
    return ev.ok ? Object.assign({}, v, { recorded: true }) : v;
  }
  if (ev.name === "diff_since_last") {
    const r = ev.json;
    // AE unreachable or busy, a different comp, or anything unreadable: never replace the list.
    if (!ev.ok || !r || r.comp_matches !== true) {
      return v.check_list ? Object.assign({}, v, { check_list: Object.assign({}, v.check_list, { stale: true }) }) : v;
    }
    const list = checkListFrom(r);
    return Object.assign({}, v, { checks: v.checks + 1, passed: list.passed, check_list: list });
  }
  return v;
}

// Lesson stage (data-model › Lesson stage, FR-009), checked in order. "I do" is skipped, not
// done, when the learner checks without a demo.
function stageOf(view) {
  const v = view || initialLesson();
  const stage = v.passed ? "done" : v.checks > 0 ? "you_do" : v.demo_made ? "we_do" : "i_do";
  const order = ["i_do", "we_do", "you_do"];
  const at = stage === "done" ? order.length : order.indexOf(stage);
  const steps = order.map((name, i) => {
    let s = i < at ? "done" : i === at ? "current" : "upcoming";
    if (name === "i_do" && s === "done" && !v.demo_made) s = "skipped";
    return { name, label: { i_do: "I do", we_do: "We do", you_do: "You do" }[name], state: s };
  });
  return { stage, steps };
}

module.exports = { initialLesson, reduceLesson, stageOf, STATE_LABELS };
