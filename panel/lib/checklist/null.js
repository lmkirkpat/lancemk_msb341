// The null's tool results → rows (contracts/checklist-rows.md › Null): three sections that open as
// the check reaches them. The tool's `stage` says where it has got to; the panel only reads it.
"use strict";

const { COPY } = require("../copy.js");
const { has, arr, nameOf, intoSections, LAYERS, header, kindSentence } = require("./shared.js");

const W = COPY.check.null_;
const hintFor = (hints, layer) => arr(hints).filter((h) => h && h.layer === layer).map((h) => h.code);

function nullEntries(nul, codes, makeRow) {
  const section = W.the_null;
  const n = nul || {};
  const subject = n.name || W.the_null;
  const has_ = (c) => codes.includes(c);
  let family; let word;
  if (has_("no_null") || n.found === false) { family = "off"; word = W.no_null; }
  else if (has_("not_a_null")) { family = "off"; word = W.not_a_null; }
  else if (has_("null_has_parent")) { family = "ask"; word = W.has_parent; }
  else if (has_("three_d")) { family = "off"; word = W.three_d; }
  else if (has_("which_null")) { family = "ask"; word = W.which_null; }
  else if (has_("null_name_not_unique")) { family = "ask"; word = W.name_not_unique; }
  else if (n.n1 && n.n2 === true) { family = "done"; word = has_("one_level_only") || n.parent ? W.two_d_parent : W.two_d; }
  else { family = "none"; word = COPY.check.not_checked; }
  const entries = [{ section, row: makeRow({ key: "null/self", family, subject, word }) }];
  const n3 = n.n3;
  if (n3 && n3.applies) {
    const f = n3.cant_check ? "cant" : n3.passed ? "done" : "off";
    const w = n3.cant_check ? W.couldnt_check : n3.passed ? W.in_place : W.at_region(n3.region_now);
    entries.push({ section, row: makeRow({ key: "null/pivot", family: f, subject: W.pivot_at(n3.wanted), word: w }) });
  }
  return entries;
}

function layerRow(l, hints, nullName, makeRow) {
  const section = W.the_group;
  const codes = hintFor(hints, l.layer);
  const has_ = (c) => codes.includes(c);
  let family; let word; let detail = null;
  if (l.found === false || has_("not_found")) { family = "cant"; word = W.not_in_comp; }
  else if (has_("focus_name_not_unique")) { family = "ask"; word = W.name_not_unique; }
  else if (arr(l.not_checked).length) { family = "cant"; word = W.couldnt_check; }
  else if (has_("wrong_parent") || has_("visible_parent")) { family = "off"; word = W.follows(l.parent); }
  else if (has_("pickwhip_position")) { family = "part"; word = W.pickwhip; }
  else if (!l.parent) { family = "off"; word = W.not_parented; }
  else if (l.p2 && l.p2.passed === false) { family = "off"; word = W.jumped(l.p2.worst_px, l.p2.direction); detail = typeof l.p2.time === "number" ? W.at_time(l.p2.time) : null; }
  else if (l.p3 && l.p3.passed === false) { family = "off"; word = W.keys_changed; }
  else if (l.p1) { family = "done"; word = W.follows(nullName); detail = W.own_keys_kept; }
  else { family = "none"; word = COPY.check.not_checked; }
  return { section, row: makeRow({ key: `group/${l.layer}`, family, subject: l.layer, word, detail }) };
}

function moveEntries(nul, codes, makeRow) {
  const section = W.the_move;
  const has_ = (c) => codes.includes(c);
  if (has_("region_needed")) return [{ section, row: makeRow({ key: "move", family: "ask", subject: W.one_move, word: W.where_turn }) }];
  if (has_("opacity_move")) return [{ section, row: makeRow({ key: "move", family: "off", subject: W.one_move, word: W.opacity_move }) }];
  const p4 = nul && nul.p4;
  if (p4 && p4.passed) return arr(p4.on).concat(arr(nul.moves).filter((x) => !arr(p4.on).length)).filter((v, i, a) => a.indexOf(v) === i).map((p) => ({ section, row: makeRow({ key: `move/${p}`, family: "done", subject: p, word: W.moves }) }));
  return [{ section, row: makeRow({ key: "move", family: "off", subject: W.one_move, word: W.no_move }) }];
}

const COMMENTS = {
  linear: () => W.c_linear, held: () => W.c_held, stacked: (c) => W.c_stacked(c.layer), default_name: () => W.c_default_name,
  non_uniform_scale: () => W.c_non_uniform, zero_scale_at_key: (c) => W.c_zero_scale(c.time), opacity: () => W.c_opacity, effect: () => W.c_effect,
};

function check(result, opts, makeRow) {
  const nul = result.null || {};
  const hints = arr(result.hints);
  const codes = hints.map((h) => h && h.code).concat(arr(result.codes));
  const layers = arr(result.layers).filter((l) => l && typeof l === "object");
  const entries = nullEntries(nul, codes, makeRow);
  // The group opens on the null itself. A pivot that's off keeps the summary on the null (the mockup's
  // skill-null-place); one that can't be checked never resolves, so it can't hold anything.
  const selfOk = entries[0].row.family === "done";
  const pivotOff = !!(nul.n3 && nul.n3.applies && !nul.n3.cant_check && !nul.n3.passed);
  if (!selfOk && layers.length) {
    entries.push({ section: W.the_group, row: makeRow({ key: "group/wait", family: "none", subject: layers.map((l) => l.layer).join(", "), word: W.after_null, quiet: true }) });
  } else {
    for (const l of layers) entries.push(layerRow(l, hints, nul.name, makeRow));
  }
  const move = result.stage === "move";
  if (move) entries.push(...moveEntries(nul, codes, makeRow));
  else entries.push({ section: W.the_move, row: makeRow({ key: "move/wait", family: "none", subject: W.one_move, word: W.after_group, quiet: true }) });
  const stage = move ? "move" : selfOk && !pivotOff ? "parent" : "place";
  let summary;
  if (stage === "place") {
    const rows = entries.filter((e) => e.section === W.the_null);
    summary = W.null_summary(rows.filter((e) => e.row.family === "done").length, rows.length);
  } else if (stage === "parent") {
    const rows = entries.filter((e) => e.section === W.the_group && !e.row.quiet);
    summary = W.group_summary(rows.filter((e) => e.row.family === "done").length, rows.length, nul.name || W.the_null.toLowerCase());
  } else {
    summary = result.passed === true ? `${W.the_move} · ${COPY.check.passed_word}` : W.move_summary;
  }
  return {
    sections: intoSections(entries),
    summary,
    outside: arr(result.other_changes).map(kindSentence),
    worth_a_look: arr(result.comments).filter((c) => c && has(COMMENTS, c.code)).map((c) => COMMENTS[c.code](c)),
    marks_demo: layers.some((l) => l.credit === "demo") || result.demo_undone === true,
    view_fields: { null_stage: stage },
  };
}

// parent/<layer> → the layer.
function labelsFrom(snapshot) {
  const out = {};
  for (const id of arr(snapshot.targets)) if (typeof id === "string" && id.startsWith("parent/")) out[id] = id.slice(7);
  return out;
}

function openingRows(targets, labels, makeRow) {
  let unnamed = 0;
  const entries = [];
  for (const id of targets) {
    const name = nameOf(id, labels[id], null);
    if (!name) { unnamed++; continue; }
    entries.push({ section: "", row: makeRow({ key: id, subject: name }) });
  }
  return { sections: intoSections(entries), unnamed };
}

const openingHeader = (state, n, focus) => header(state, n, focus, LAYERS);
const changeLine = (r) => (r && r.layer && r.null ? W.demo_line(r.layer, r.null) : null);

module.exports = { check, labelsFrom, openingRows, openingHeader, changeLine };
