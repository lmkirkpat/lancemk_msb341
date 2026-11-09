// Key types' tool results → rows (contracts/checklist-rows.md › Key types).
"use strict";

const { COPY } = require("../copy.js");
const { has, arr, secs, nameOf, intoSections, PAIRS, header, sentences } = require("./shared.js");

const W = COPY.check.key_types;
const VERDICTS = {
  held_by_learner: ["done", W.held_by_learner], held_by_demo: ["done", COPY.check.easing.eased_by_demo], not_held: ["off", W.not_held],
  wrong_side: ["part", W.wrong_side], removed_or_changed: ["cant", W.keys_changed], expression: ["cant", W.expression_on], unmatched: ["cant", W.unmatched],
};
const CONSTANT = { linear: ["done", W.linear_stays], not_linear: ["off", W.not_linear], expression: ["cant", W.expression] };
const NOT_CHECKED = ["none", COPY.check.not_checked];
const lookup = (t, k) => (has(t, k) ? t[k] : NOT_CHECKED);

// "Blink › Opacity 1–1.4 s" → section "Blink › Opacity", subject "1–1.4 s".
function splitPair(label) {
  const m = /^(.*) (\S+–\S+ s)$/.exec(label);
  return m ? { section: m[1], subject: m[2] } : { section: "", subject: label };
}

function check(result, opts, makeRow) {
  const labels = opts && opts.labels;
  const pairs = arr(result.pairs).filter((p) => p && typeof p === "object");
  const entries = pairs.map((p) => {
    const name = nameOf(p.id, p.label, labels);
    const { section, subject } = name ? splitPair(name) : { section: "", subject: COPY.check.a_pair };
    const [family, word] = lookup(VERDICTS, p.verdict);
    return { section, row: makeRow({ key: p.id || name || subject, family, subject, word }) };
  });
  for (const m of arr(result.should_move_held)) {
    entries.push({ section: W.keep_moving, row: makeRow({ key: `move/${m.layer}/${m.property}`, family: "off", subject: `${m.layer} › ${m.property}`, word: W.now_snaps, detail: typeof m.waits_until === "number" ? W.waits_until(secs(m.waits_until)) : null }) });
  }
  const c = result.constant_speed;
  if (c && c.ref) {
    const [family, word] = lookup(CONSTANT, c.verdict);
    entries.push({ section: W.constant_speed, row: makeRow({ key: `cs/${c.ref.layer}/${c.ref.property}`, family, subject: `${c.ref.layer} › ${c.ref.property}`, word }) });
  }
  const mine = pairs.filter((p) => p.verdict !== "held_by_demo");
  const held = mine.filter((p) => p.verdict === "held_by_learner").length;
  return {
    sections: intoSections(entries),
    summary: result.passed === true ? W.summary_passed(held, mine.length) : W.summary(held, mine.length, mine.length - held),
    outside: arr(result.extra_holds).map((h) => W.extra_hold(h.layer, h.property, secs(h.time))).concat(sentences(result.other_changes)),
    marks_demo: pairs.some((p) => p.verdict === "held_by_demo") || result.demo_undone === true,
  };
}

function labelsFrom(snapshot) {
  const out = {};
  for (const p of arr(snapshot.target_pairs)) if (p && p.id && p.label) out[p.id] = p.label;
  return out;
}

function openingRows(targets, labels, makeRow) {
  let unnamed = 0;
  const entries = [];
  for (const id of targets) {
    const name = nameOf(id, labels[id], null);
    if (!name) { unnamed++; continue; }
    const { section, subject } = splitPair(name);
    entries.push({ section, row: makeRow({ key: id, subject }) });
  }
  return { sections: intoSections(entries), unnamed };
}

const openingHeader = (state, n, focus) => header(state, n, focus, PAIRS);
const changeLine = (r) => (r && r.layer ? W.demo_line(r.layer, r.property, secs(r.from_time), secs(r.to_time)) : null);

module.exports = { check, labelsFrom, openingRows, openingHeader, changeLine };
