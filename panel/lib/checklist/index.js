// The checklist view (data-model › Checklist view, README › The checklist): one row pattern for
// every skill. Each skill's file maps its tool's codes to rows. A pass is only ever the tool's own
// `passed`. An unknown code is Not checked yet (FR-016).
"use strict";

const easing = require("./easing.js");
const { COPY } = require("../copy.js");

const GLYPHS = Object.freeze({ done: "✓", off: "✗", part: "◐", none: "○", prop: "◇", cant: "⊘", ask: "?" });
const FAMILIES = Object.freeze(Object.keys(GLYPHS));
const OPEN = new Set(["off", "part", "none"]);

// Tools by what they do. Steps 2 and 3 add the other five skills here.
const CHECKS = { diff_since_last: easing };
const SNAPSHOTS = { snapshot_project: easing };
const DEMOS = { set_ease: easing };

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isCheck = (tool) => has(CHECKS, tool);
const isSnapshot = (tool) => has(SNAPSHOTS, tool);
// The Changed in your comp line from a demonstration's own result (FR-018), or null.
const changeLine = (tool, result) => (has(DEMOS, tool) && result ? DEMOS[tool].changeLine(result) : null);

function makeRow({ key, family, subject, word, detail }) {
  return { key, family, glyph: GLYPHS[family], subject, word, detail: detail || null, track: null, changed: false };
}

const rowsOf = (list) => (list && Array.isArray(list.sections) ? list.sections.flatMap((s) => s.rows) : []);
const doneCount = (list) => rowsOf(list).filter((r) => r.family === "done").length;

// `previous`: the last list, used only when it came from a check.
function fromCheck(tool, result, opts) {
  const previous = opts && opts.previous && opts.previous.source === "check" ? opts.previous : null;
  const built = CHECKS[tool].check(result, opts, makeRow);
  const before = new Map(rowsOf(previous).map((r) => [r.key, r]));
  const sections = built.sections.map((s) => ({
    title: s.title,
    rows: s.rows.map((r) => {
      const was = before.get(r.key);
      return Object.assign({}, r, { changed: !!was && (was.family !== r.family || was.word !== r.word) });
    }),
  }));
  const list = { sections, passed: result.passed === true };
  const rows = rowsOf(list);
  const first = rows.find((r) => OPEN.has(r.family));
  const next = first && !list.passed ? first.subject : null;
  const gained = previous ? doneCount(list) - doneCount(previous) : 0;
  const parts = [gained > 0 ? COPY.check.more_since(gained) : null, next ? COPY.check.next(next) : null].filter(Boolean);
  const passed_note = list.passed && built.passed_note ? built.passed_note : null;
  return Object.assign(list, {
    source: "check",
    tool,
    summary: built.summary,
    sub: parts.length ? parts.join(" ") : passed_note,
    next,
    proposed: false,
    stale: null,
    stale_kind: null,
    more: null,
    footer: [],
    outside: built.outside,
    worth_a_look: [],
    target_ids: rows.map((r) => r.key),
    marks_demo: built.marks_demo,
    checked_at: (opts && opts.at) || null,
  });
}

const labelsFromSnapshot = (tool, snapshot) => SNAPSHOTS[tool].labelsFrom(snapshot);

// Rows from a snapshot's targets. opts: { labels, proposed, focus }. Null when there are no targets:
// a skill with nothing to focus on shows no rows, never placeholder rows.
function fromSnapshot(tool, targets, opts) {
  const ids = Array.isArray(targets) ? targets : [];
  if (!ids.length) return null;
  const proposed = !!opts.proposed;
  const { sections, unnamed } = SNAPSHOTS[tool].openingRows(ids, opts.labels || {}, ({ key, subject }) =>
    makeRow({ key, subject, family: proposed ? "prop" : "none", word: proposed ? COPY.check.proposed : COPY.check.not_checked }));
  const header = SNAPSHOTS[tool].openingHeader(proposed ? "proposed" : "focused", ids.length, opts.focus);
  return {
    source: proposed ? "opening" : "focus",
    tool,
    count: ids.length,
    focus: opts.focus || null,
    summary: header.summary,
    sub: header.sub,
    next: null,
    proposed,
    updating: false,
    focus_stale: false,
    stale: null,
    stale_kind: null,
    sections,
    more: unnamed > 0 ? COPY.check.unnamed_more(unnamed) : null,
    footer: [],
    outside: [],
    worth_a_look: [],
    passed: false,
    target_ids: ids,
    checked_at: null,
  };
}

// The demo pair ticks at once, before any check (T020). The header follows only on a focused list; an
// opening list is still the mentor's whole read, so it isn't "yours" yet.
function markDemo(list, id) {
  let found = false;
  const sections = list.sections.map((s) => ({
    title: s.title,
    rows: s.rows.map((r) => {
      if (r.key !== id) return r;
      found = true;
      return Object.assign({}, r, { family: "done", glyph: GLYPHS.done, word: COPY.check.easing.eased_by_demo });
    }),
  }));
  if (!found) return list;
  const out = Object.assign({}, list, { sections });
  if (list.source === "focus") {
    const open = rowsOf(out).find((r) => r.family === "none");
    out.summary = COPY.check.easing.pairs_yours(rowsOf(out).filter((r) => r.family !== "done").length);
    out.sub = open ? COPY.check.next(open.subject) : null;
  }
  return out;
}

// The learner replied to rows still marked Proposed: the marks drop, and the header says it's updating.
function dropProposed(list) {
  const sections = list.sections.map((s) => ({
    title: s.title,
    rows: s.rows.map((r) => Object.assign({}, r, { family: "none", glyph: GLYPHS.none, word: COPY.check.not_checked })),
  }));
  const header = SNAPSHOTS[list.tool].openingHeader("updating", list.count, list.focus);
  return Object.assign({}, list, header, { sections, proposed: false, updating: true });
}

// The reply's turn ended with no new read: the old rows stay and say where they came from (FR-098).
function markFocusStale(list) {
  const header = SNAPSHOTS[list.tool].openingHeader("focus_stale", list.count, list.focus);
  return Object.assign({}, list, header, { updating: false, focus_stale: true });
}

module.exports = { fromCheck, fromSnapshot, labelsFromSnapshot, dropProposed, markFocusStale, markDemo, changeLine, isCheck, isSnapshot, rowsOf, GLYPHS, FAMILIES };
