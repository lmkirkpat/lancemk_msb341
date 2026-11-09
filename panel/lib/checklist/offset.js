// Offset's tool results → rows (contracts/checklist-rows.md › Offset), and the timeline's one scale
// per lesson (plan P5). No per-member verdict: ✓ is relative, and all ✓ doesn't mean passed.
"use strict";

const { COPY } = require("../copy.js");
const { arr, secs, nameOf, intoSections, count, LAYERS, PROPERTIES, header, sentences } = require("./shared.js");

const W = COPY.check.offset;

function withOther(label, still_same) {
  for (const pair of arr(still_same)) {
    if (Array.isArray(pair) && pair.includes(label)) return pair[0] === label ? pair[1] : pair[0];
  }
  return null;
}

function movedText(moved_by) {
  const frames = Object.values(moved_by || {}).filter((v) => typeof v === "number");
  const most = frames.length ? Math.max(...frames.map(Math.abs)) : 0;
  return most ? W.moved(most) : W.stayed;
}

function layerRow(m, r, makeRow) {
  const other = withOther(m.label, r.still_same);
  let family; let word;
  if (m.status === "keys_changed") { family = "cant"; word = W.keys_changed; }
  else if (other) { family = "off"; word = W.with_other(other); }
  else if (m.split && m.split.on_purpose) { family = "done"; word = W.split_on_purpose; }
  else if (m.split) { family = "ask"; word = W.split; }
  else { family = "done"; word = W.on_its_own; }
  const parts = [typeof m.start_now === "number" ? W.starts(secs(m.start_now)) : null, m.status === "keys_changed" ? null : movedText(m.moved_by), m.credit === "demo" ? W.demo : null].filter(Boolean);
  return { section: "", row: makeRow({ key: m.target || m.label, family, subject: m.label, word, detail: parts.join(" · "), time: m.start_now }) };
}

function propertyRow(m, r, makeRow) {
  const other = withOther(m.label, r.still_same);
  let family; let word;
  if (m.status === "keys_changed") { family = "cant"; word = W.keys_changed; }
  else if (m.lands_in_comp === false) { family = "part"; word = W.lands_past; }
  else if (other) { family = "off"; word = W.with_other(other); }
  else { family = "done"; word = W.apart; }
  const at = m.label.indexOf(" › ");
  const subject = at < 0 ? m.label : m.label.slice(at + 3);
  const moved = m.moved_by && typeof m.moved_by.start === "number" && m.moved_by.start ? W.moved(Math.abs(m.moved_by.start)) : W.stayed;
  const range = typeof m.start_now === "number" && typeof m.end_now === "number" ? `${secs(m.start_now)}–${secs(m.end_now)} s` : null;
  const detail = [range, m.status === "keys_changed" ? null : moved, m.credit === "demo" ? W.demo : null].filter(Boolean).join(" · ");
  return { section: m.layer || "", row: makeRow({ key: m.target || m.label, family, subject, word, detail, time: m.start_now }) };
}

const asOutside = (o) => (typeof o === "string" ? o : (o && (o.label || o.layer)) || "");
const pastEnd = (o) => W.past_end(asOutside(o));

function check(result, opts, makeRow) {
  const members = arr(result.members).filter((m) => m && typeof m === "object");
  const kind = result.kind === "properties" ? "properties" : "layers";
  const entries = members.map((m) => (kind === "properties" ? propertyRow(m, result, makeRow) : layerRow(m, result, makeRow)));
  const pairs = arr(result.still_same);
  let summary;
  if (pairs.length === 1 && Array.isArray(pairs[0])) summary = W.together(pairs[0][0], pairs[0][1]);
  else if (pairs.length) summary = W.pairs_together(pairs.length);
  else if (result.passed === true) summary = `${W.all_apart} · ${COPY.check.passed_word}`;
  else {
    const gaps = arr(result.gaps_frames);
    summary = gaps.length ? `${W.all_apart} · ${W.gaps(gaps.join(" f, "))}` : W.all_apart;
  }
  return {
    sections: intoSections(entries),
    summary,
    outside: arr(result.out_of_comp).map(pastEnd).concat(sentences(result.other_changes)),
    footer: result.order_differs === true ? [W.order_differs] : [],
    marks_demo: members.some((m) => m.credit === "demo") || result.demo_undone === true,
    view_fields: { offset_kind: kind, timeline: widen(opts && opts.timeline, startsAndEnds(members, true), kind) },
  };
}

function labelsFrom(snapshot) {
  const out = {};
  for (const m of arr(snapshot.group && snapshot.group.members)) if (m && m.target && m.label) out[m.target] = m.label;
  return out;
}

function openingRows(targets, labels, makeRow, snapshot) {
  const members = new Map(arr(snapshot && snapshot.group && snapshot.group.members).map((m) => [m && m.target, m]));
  let unnamed = 0;
  const entries = [];
  for (const id of targets) {
    const name = nameOf(id, labels[id], null);
    if (!name) { unnamed++; continue; }
    const m = members.get(id);
    entries.push({ section: "", row: makeRow({ key: id, subject: name, time: m ? m.start : null, detail: m && typeof m.start === "number" ? W.starts(secs(m.start)) : null }) });
  }
  return { sections: intoSections(entries), unnamed };
}

const noun = (snapshot) => (snapshot && snapshot.group && snapshot.group.kind === "properties" ? PROPERTIES : LAYERS);
const openingHeader = (state, n, focus, nounOf) => header(state, n, focus, nounOf || LAYERS, true);

function changeLine(r) {
  if (!r || !r.layer) return null;
  const n = Number(r.shift_frames) || 0;
  return W.demo_line(r.layer, n);
}

// The start and end times this lesson has seen, snapshot or check. Plan P5.
function startsAndEnds(members, fromCheck) {
  const starts = [];
  const ends = [];
  for (const m of members) {
    if (!m) continue;
    for (const v of fromCheck ? [m.start_before, m.start_now] : [m.start]) if (typeof v === "number") starts.push(v);
    for (const v of fromCheck ? [m.end_before, m.end_now] : [m.end]) if (typeof v === "number") ends.push(v);
  }
  return { starts, ends };
}

// One scale for the lesson, in seconds: earliest start; on layers the latest start, on properties the
// latest landing, padded 25%, span at least 1 s; clamped to the comp's length unless a key is past it;
// widened and never narrowed.
function widen(prev, seen, kind) {
  const times = kind === "properties" && seen.ends.length ? seen.ends : seen.starts;
  if (!seen.starts.length || !times.length) return prev || null;
  const start = Math.min(...seen.starts);
  const latest = Math.max(...times);
  let end = latest + (latest - start) * 0.25;
  end = Math.max(end, start + 1);
  const duration = prev && prev.duration;
  if (duration && latest <= duration) end = Math.min(end, duration);
  if (!prev) return { start, end, duration: null };
  return { start: Math.min(prev.start, start), end: Math.max(prev.end, end), duration };
}

function snapshotFields(r, view) {
  const group = r.group;
  if (!group || !Array.isArray(group.members)) return {};
  const duration = r.comp && typeof r.comp.duration === "number" ? r.comp.duration : view && view.timeline ? view.timeline.duration : null;
  const seen = startsAndEnds(group.members, false);
  const prev = Object.assign({}, view && view.timeline, { duration });
  const had = view && view.timeline ? prev : { duration, start: Infinity, end: -Infinity };
  return { offset_kind: group.kind, timeline: widen(had, seen, group.kind) };
}

module.exports = { check, labelsFrom, openingRows, openingHeader, changeLine, snapshotFields, noun };
