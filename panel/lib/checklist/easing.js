// Easing's tool results → checklist rows (contracts/checklist-rows.md › Easing). The words are the
// README's; the panel maps codes and never decides a state.
"use strict";

const { COPY } = require("../copy.js");

const SEP = " › ";
const W = COPY.check.easing;
const secs = (t) => Number(Number(t).toFixed(2));

const CODES = {
  eased_by_learner: ["done", W.eased_by_learner],
  eased_by_demo: ["done", W.eased_by_demo],
  still_linear: ["off", W.still_linear],
  partly_eased: ["part", W.partly_eased],
  removed: ["cant", W.removed],
  unmatched: ["cant", W.unmatched],
};

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

// "Title › Position 0.5–1.5 s" → { section: "Title", subject: "Position 0.5–1.5 s" }.
function splitLabel(label) {
  const at = label.indexOf(SEP);
  return at < 0 ? { section: "", subject: label } : { section: label.slice(0, at), subject: label.slice(at + SEP.length) };
}

// A label is a name only if it isn't the id itself (FR-100). `labels` are those kept from the lesson.
function nameOf(id, label, labels) {
  if (typeof label === "string" && label && label !== id) return label;
  const kept = labels && labels[id];
  return typeof kept === "string" && kept && kept !== id ? kept : null;
}

// Rows in the tool's order, grouped by layer where the layer appears first.
function intoSections(entries) {
  const sections = [];
  const byTitle = new Map();
  for (const { section, row } of entries) {
    let s = byTitle.get(section);
    if (!s) {
      s = { title: section, rows: [] };
      byTitle.set(section, s);
      sections.push(s);
    }
    s.rows.push(row);
  }
  return sections;
}

function checkRows(result, opts, makeRow) {
  const labels = opts && opts.labels;
  const targets = Array.isArray(result.targets) ? result.targets : [];
  const entries = targets.filter((t) => t && typeof t === "object").map((t) => {
    const name = nameOf(t.segment_id, t.label, labels);
    const { section, subject } = name ? splitLabel(name) : { section: "", subject: COPY.check.a_pair };
    let [family, word] = has(CODES, t.result) ? CODES[t.result] : ["none", COPY.check.not_checked];
    if (t.result === "eased_by_demo" && t.demo_credit === "unknown") [family, word] = ["ask", COPY.check.who_eased];
    const detail = t.result === "partly_eased" && typeof t.linear_key_time === "number" ? W.key_still_linear(secs(t.linear_key_time)) : null;
    return { section, row: makeRow({ key: t.segment_id || name || subject, family, subject, word, detail }) };
  });
  return intoSections(entries);
}

function check(result, opts, makeRow) {
  const s = result.summary || {};
  const learner = Number(s.learner_eased) || 0;
  const total = Number(s.total_for_learner) || 0;
  const still = (Number(s.still_linear) || 0) + (Number(s.partly_eased) || 0);
  return {
    sections: checkRows(result, opts, makeRow),
    summary: result.passed === true ? W.summary_passed(learner, total) : W.summary(learner, total, still),
    outside: Array.isArray(result.unexpected_changes) ? result.unexpected_changes.map(String) : [],
    marks_demo: (Array.isArray(result.targets) ? result.targets : []).some((t) => t && (t.result === "eased_by_demo" || t.demo_credit !== undefined || t.demo_undone === true)),
  };
}

// id → label for every pair the snapshot names. Findings are the pairs that still need ease.
function labelsFrom(snapshot) {
  const out = {};
  for (const f of Array.isArray(snapshot.findings) ? snapshot.findings : []) {
    for (const seg of (f && Array.isArray(f.segments) ? f.segments : [])) {
      if (seg && seg.id) out[seg.id] = `${f.layer}${SEP}${f.property} ${secs(seg.from_time)}–${secs(seg.to_time)} s`;
    }
  }
  return out;
}

// Rows for the snapshot's targets. Targets with no label yet are only counted (FR-100, D15).
function openingRows(targets, labels, makeRow) {
  const entries = [];
  let unnamed = 0;
  for (const id of targets) {
    const name = nameOf(id, labels[id], null);
    if (!name) { unnamed++; continue; }
    const { section, subject } = splitLabel(name);
    entries.push({ section, row: makeRow({ key: id, subject }) });
  }
  return { sections: intoSections(entries), unnamed };
}

// The header for rows from a snapshot. `state`: proposed, updating, focus_stale or focused.
function openingHeader(state, count, focus) {
  if (state === "proposed") return { summary: `${COPY.check.pairs_found(count)} · ${COPY.check.proposed}`, sub: COPY.check.source_full };
  if (state === "updating") return { summary: COPY.check.pairs_found(count), sub: COPY.check.source_updating };
  if (state === "focus_stale") return { summary: COPY.check.source_stale, sub: COPY.check.source_stale_sub };
  const on = Array.isArray(focus) && focus.length === 1 ? focus[0] : null;
  return { summary: on ? W.pairs_on(count, on) : W.pairs(count), sub: null };
}

module.exports = { check, labelsFrom, openingRows, openingHeader };
