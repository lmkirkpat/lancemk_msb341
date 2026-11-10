// Helpers every skill's row file shares (contracts/checklist-rows.md). Words live in copy.js.
"use strict";

const { COPY } = require("../copy.js");

const SEP = " › ";
const secs = (t) => Number(Number(t).toFixed(2));
// A label's trailing time ("Position 1.3–4.367 s", "Dot 2 0.5 s") rounds the way the mentor says it:
// two decimals at most, trailing zeros dropped. Layer names with numbers in them are left alone.
const tidyTimes = (label) =>
  typeof label !== "string" ? label : label.replace(/(\d+(?:\.\d+)?)(?:–(\d+(?:\.\d+)?))? s$/, (_, a, b) => `${secs(a)}${b === undefined ? "" : `–${secs(b)}`} s`);
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const arr = (x) => (Array.isArray(x) ? x : []);

// "Title › Position 0.5–1.5 s" → { section: "Title", subject: "Position 0.5–1.5 s" }.
function splitLabel(label) {
  const at = label.indexOf(SEP);
  return at < 0 ? { section: "", subject: label } : { section: label.slice(0, at), subject: label.slice(at + SEP.length) };
}

// A label is a name only if it isn't the id itself (FR-100). `labels` are those kept from the lesson.
function nameOf(id, label, labels) {
  if (typeof label === "string" && label && label !== id) return tidyTimes(label);
  const kept = labels && labels[id];
  return typeof kept === "string" && kept && kept !== id ? tidyTimes(kept) : null;
}

// Rows in the tool's order, grouped by section where the section appears first.
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

const count = (n, noun) => `${n} ${n === 1 ? noun[0] : noun[1]}`;
const PAIRS = ["pair", "pairs"];
const LAYERS = ["layer", "layers"];
const PROPERTIES = ["property", "properties"];

// The header for rows from a snapshot, for every skill but easing. state: proposed, updating,
// focus_stale or focused. `together`: offset's "start together".
function header(state, n, focus, noun, together) {
  const W = COPY.check;
  const label = count(n, noun);
  const on = Array.isArray(focus) && focus.length === 1 ? focus[0] : null;
  const named = on && !together ? `${label} on ${on}` : label;
  if (state === "proposed") return { summary: `${named}${together ? " start together" : ""} · ${W.proposed}`, sub: W.source_full };
  if (state === "updating") return { summary: named, sub: W.source_updating };
  if (state === "focus_stale") return { summary: W.source_stale, sub: W.source_stale_sub };
  return { summary: `${named} · ${W.not_checked.toLowerCase()}`, sub: null };
}

const placeWord = (place) => {
  const P = COPY.check.pivot.places;
  return typeof place === "string" && has(P, place) ? P[place] : String(place || "").replace(/-/g, " ");
};

// The pivot's and null's `other_changes` kinds in panel words (FR-086).
function kindSentence(c) {
  const W = COPY.check.other;
  const k = c && c.kind;
  const F = {
    layer_removed: () => W.layer_removed(c.layer), layer_added: () => W.layer_added(c.layer), renamed: () => W.renamed(c.layer, c.now),
    eye_changed: () => W.eye_changed(c.layer, c.eye_on), anchor_changed: () => W.anchor_changed(c.layer), keys_added: () => W.keys_added(c.property, c.layer),
    parented_to_null: () => W.parented_to_null(c.layer), parent_changed: () => W.parent_changed(c.layer), keys_changed: () => W.keys_changed(c.layer),
    value_changed: () => W.value_changed(c.layer), expression_toggled: () => W.expression_toggled(c.layer), children_brought: () => W.children_brought(c.layer),
  };
  return k && has(F, k) ? F[k]() : W.something;
}

const sentences = (list) => arr(list).map(String);

module.exports = { SEP, secs, tidyTimes, has, arr, splitLabel, nameOf, intoSections, count, PAIRS, LAYERS, PROPERTIES, header, placeWord, kindSentence, sentences };
