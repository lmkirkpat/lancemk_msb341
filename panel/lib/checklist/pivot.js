// The pivot's tool results → rows (contracts/checklist-rows.md › Pivot): the layer is the section,
// each row one condition, no pixel numbers. Hint codes stay the mentor's.
"use strict";

const { COPY } = require("../copy.js");
const { arr, secs, nameOf, intoSections, count, LAYERS, header, placeWord, kindSentence } = require("./shared.js");

const W = COPY.check.pivot;

function layerEntries(l, makeRow) {
  const section = l.layer || "";
  const cant = new Set(arr(l.cant_check).map((c) => c && c.what));
  const entries = [];
  const add = (key, subject, family, word, what) => {
    const useCant = what && cant.has(what);
    entries.push({ section, row: makeRow({ key: `${section}/${key}`, subject, family: useCant ? "cant" : family, word: useCant ? W.cant_check : word }) });
  };
  if (cant.has("layer")) { add("layer", section, "cant", W.cant_check); return entries; }
  const i1 = l.item1;
  if (i1) {
    const wanted = i1.wanted;
    const now = i1.place_now;
    let family; let word;
    if (i1.passed) { family = "done"; word = W.in_place; }
    else if (now === "between" || (now === "center" && wanted !== "center")) { family = "part"; word = W.near_it; }
    else if (now === "outside") { family = "off"; word = W.outside(i1.outside_side); }
    else if (now) { family = "off"; word = W.at(placeWord(now)); }
    else { family = "none"; word = COPY.check.not_checked; }
    add("pivot", W.pivot_on(placeWord(wanted)), family, word, "pivot");
  }
  const i2 = l.item2;
  if (i2) add("stays", W.stays(section), i2.passed ? "done" : "off", i2.passed ? W.stayed : W.moved(i2.direction), "footprint");
  const i3 = l.item3;
  if (i3 && i3.set_away_from_rest === true) add("rest", W.at_rest, "off", W.set_away);
  const i4 = l.item4;
  if (i4 || cant.has("position_key")) {
    const worst = i4 && i4.worst;
    add("keys", W.position_keys, i4 && i4.passed ? "done" : "off", i4 && i4.passed ? W.held : worst && typeof worst.time === "number" ? W.slid_at(secs(worst.time)) : W.slid, "position_key");
  }
  const i5 = l.item5;
  if (i5) {
    const moved = arr(i5.moved_layers).map((x) => (typeof x === "string" ? x : x && x.layer)).filter(Boolean);
    add("others", W.others, i5.passed ? "done" : "off", i5.passed ? W.nothing_did : moved.length ? W.other_moved(moved[0]) : W.something_moved);
  }
  return entries;
}

function check(result, opts, makeRow) {
  const layers = arr(result.layers).filter((l) => l && typeof l === "object");
  const entries = layers.flatMap((l) => layerEntries(l, makeRow));
  const name = layers.length === 1 ? (layers[0].layer || "") : count(layers.length, LAYERS);
  const done = entries.filter((e) => e.row.family === "done").length;
  return {
    sections: intoSections(entries),
    summary: result.passed === true ? `${name} · ${COPY.check.passed_word}` : W.summary(name, done, entries.length),
    outside: arr(result.other_changes).map(kindSentence),
    marks_demo: layers.some((l) => l.credit === "demo") || result.demo_undone === true,
    view_fields: { pivot_keyed: layers.some((l) => l.item4) },
  };
}

// anchor_snapshot's targets line up with its focus names.
function labelsFrom(snapshot) {
  const out = {};
  const focus = arr(snapshot.focus);
  arr(snapshot.targets).forEach((id, i) => { if (typeof focus[i] === "string") out[id] = focus[i]; });
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
const changeLine = (r) => (r && r.layer ? W.demo_line(r.layer, placeWord(r.place)) : null);

module.exports = { check, labelsFrom, openingRows, openingHeader, changeLine };
