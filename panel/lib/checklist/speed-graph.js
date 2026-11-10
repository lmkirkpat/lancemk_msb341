// Speed graph's tool results → rows (contracts/checklist-rows.md › Speed graph). `fastest` is never
// shown: the lesson asks the learner to read it from the graph.
"use strict";

const { COPY } = require("../copy.js");
const { has, arr, secs, tidyTimes, nameOf, splitLabel, intoSections, PAIRS, header, sentences } = require("./shared.js");

const W = COPY.check.speed_graph;
const MISTAKES = {
  not_shaped: ["off", W.not_shaped], no_handle: ["off", W.no_handle], arrives_moving: ["part", W.arrives_moving],
  back_to_default: ["part", W.back_to_default], long_both_ends: ["part", W.long_both_ends], in_out_mixed: ["part", W.in_out_mixed],
};
const OTHER_RESULTS = { keys_changed: ["cant", W.keys_changed], removed: ["cant", W.keys_changed], unmatched: ["cant", W.unmatched] };
const NOT_CHECKED = ["none", COPY.check.not_checked];

function verdict(p) {
  if (p.result === "passed") return p.credit === "demo" ? ["done", COPY.check.easing.eased_by_demo] : p.credit === "unknown" ? ["ask", COPY.check.who_shaped] : ["done", W.shaped_by_you];
  if (p.result === "not_passed") return has(MISTAKES, p.mistake) ? MISTAKES[p.mistake] : NOT_CHECKED;
  return has(OTHER_RESULTS, p.result) ? OTHER_RESULTS[p.result] : NOT_CHECKED;
}

function check(result, opts, makeRow) {
  const labels = opts && opts.labels;
  const pairs = arr(result.pairs).filter((p) => p && typeof p === "object");
  const entries = pairs.map((p) => {
    const name = nameOf(p.id, p.label, labels);
    const { section, subject } = name ? splitLabel(name) : { section: "", subject: COPY.check.a_pair };
    const [family, word] = verdict(p);
    return { section, row: makeRow({ key: p.id || name || subject, family, subject, word, detail: typeof p.dimension === "string" ? p.dimension : null }) };
  });
  for (const label of arr(opts && opts.landing_hard)) {
    entries.push({ section: W.land_hard, row: makeRow({ key: `hard/${label}`, family: "none", subject: tidyTimes(String(label)), word: W.your_call, quiet: true }) });
  }
  const mine = pairs.filter((p) => p.credit !== "demo");
  const shaped = mine.filter((p) => p.result === "passed" && p.credit !== "unknown").length;
  return {
    sections: intoSections(entries),
    summary: result.passed === true ? W.summary_passed(shaped, mine.length) : W.summary(shaped, mine.length, mine.filter((p) => p.result !== "passed").length),
    outside: sentences(result.other_changes),
    marks_demo: pairs.some((p) => p.credit === "demo" || p.credit === "unknown") || result.demo_undone === true,
  };
}

function labelsFrom(snapshot) {
  const out = {};
  for (const p of arr(snapshot.pairs)) if (p && p.id && p.label) out[p.id] = p.label;
  return out;
}

function openingRows(targets, labels, makeRow) {
  let unnamed = 0;
  const entries = [];
  for (const id of targets) {
    const name = nameOf(id, labels[id], null);
    if (!name) { unnamed++; continue; }
    const { section, subject } = splitLabel(name);
    entries.push({ section, row: makeRow({ key: id, subject }) });
  }
  return { sections: intoSections(entries), unnamed };
}

const openingHeader = (state, n, focus) => header(state, n, focus, PAIRS);

// speed_graph_demo's "Title › Position, 0.500 s → 1.500 s" → "shaped Title › Position, 0.5–1.5 s."
function changeLine(r) {
  if (!r || typeof r.shaped !== "string") return null;
  const m = /^(.*), ([\d.]+) s → ([\d.]+) s$/.exec(r.shaped);
  return m ? W.demo_line(m[1], secs(m[2]), secs(m[3])) : null;
}

const snapshotFields = (r) => (Array.isArray(r.landing_hard_labels) ? { landing_hard: r.landing_hard_labels } : {});

module.exports = { check, labelsFrom, openingRows, openingHeader, changeLine, snapshotFields };
