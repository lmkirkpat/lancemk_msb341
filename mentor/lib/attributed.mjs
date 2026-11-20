// Spec 014 K5 (FR-036, research R9; TD § 10.1 rule 4, § 11): the record says only what a check saw or
// the learner said. Each check tool hands its result to session.markChecked, which keeps the layers it
// reported as changed (`attributed` on the lesson). record_lesson then refuses a summary or next that
// pairs a change word with a layer no check attributed: AB 6's "moved a parent layer's pivot by
// mistake; undid that", written when no check had said so.
//
// Crude on purpose (R9): a word-and-name test, no judge. It errs toward refusing, and a refusal only
// asks the mentor to rewrite. The lesson's own targets and focus always count as attributed: they're
// the learner's work, and the check grades them.

import { layerInfo } from "./layer-info.mjs";

// Keys in a check's result whose subtree reports a change (other_changes, moved_layers, changed_layers,
// moved_children, jumped, extra_holds, unexpected_changes, ...). Every `layer` (or `layers` list) inside
// counts as attributed by that check.
const CHANGE_KEY = /(^|_)(changes?|changed|moved|jumped?|holds|added|removed)(_|$)/i;

function collect(node, inChange, out) {
  if (Array.isArray(node)) {
    for (const x of node) collect(x, inChange, out);
    return;
  }
  if (!node || typeof node !== "object") return;
  const own = inChange || (typeof node.kind === "string" && /changed|moved|added|removed|jumped/i.test(node.kind));
  if (own) {
    if (typeof node.layer === "string" && node.layer) out.push({ layer: node.layer, property: typeof node.property === "string" ? node.property : null });
    if (Array.isArray(node.layers)) for (const l of node.layers) if (typeof l === "string" && l) out.push({ layer: l, property: null });
  }
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === "object") collect(v, own || CHANGE_KEY.test(k), out);
  }
}

// The changes a check's result reports, as [{ layer, property | null }], de-duplicated.
export function attributedFrom(result) {
  const out = [];
  collect(result, false, out);
  const seen = new Set();
  return out.filter((a) => {
    const k = `${a.layer}\u0000${a.property}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// R9's change words. "by mistake" counts as one.
const CHANGE_WORD = /\b(undo|undid|undone|undoing|moved|moving|changed|reverted|revert|reset|fixed|by mistake)\b/i;
const isWordChar = (c) => c !== undefined && /[\p{L}\p{N}_]/u.test(c);
function names(text, name) {
  const t = text.toLowerCase();
  const n = name.toLowerCase();
  for (let i = t.indexOf(n); i >= 0; i = t.indexOf(n, i + 1)) {
    if (!isWordChar(t[i - 1]) && !isWordChar(t[i + n.length])) return true;
  }
  return false;
}
// "a parent", "the parent layer", "its parent": stands for every layer that parents the lesson's layers.
const PARENT_WORD = /\bparents?\b/i;
// Names shorter than this are too likely to be ordinary words ("A", "BG" aside) to test.
const MIN_NAME = 3;

function parentsOf(snapshot, layerNames) {
  const { known, layers } = layerInfo(snapshot);
  if (!known) return [];
  const byIndex = new Map(layers.map((l) => [l.index, l]));
  const out = new Set();
  for (const l of layers.filter((x) => layerNames.has(x.name))) {
    const seen = new Set([l.index]);
    for (let p = byIndex.get(l.parent); p && !seen.has(p.index); p = byIndex.get(p.parent)) {
      seen.add(p.index);
      out.add(p.name);
    }
  }
  return [...out];
}

// The layers `text` says changed that no check attributed: each sentence holding a change word, and
// a layer name from the lesson's baseline (or "parent" for the lesson's layers' parents) that isn't
// the lesson's own target or focus and isn't in `attributed`. [] when nothing's off.
export function unattributed(text, { snapshot, attributed = [], own = [] }) {
  if (typeof text !== "string" || !text || !snapshot) return [];
  const allowed = new Set([...own, ...attributed.map((a) => a && a.layer)].filter((n) => typeof n === "string"));
  const info = layerInfo(snapshot);
  const all = [...new Set([...(info.known ? info.layers : []), ...(snapshot.layers || [])].map((l) => l && l.name).filter((n) => typeof n === "string" && n.length >= MIN_NAME))];
  const parents = parentsOf(snapshot, new Set(own));
  // Allowed names are taken out of the sentence first, longest first, so a shorter layer name inside
  // one ("Shake" in "Shake Control") isn't read as a second layer.
  const longestFirst = (list) => [...list].sort((a, b) => b.length - a.length);
  const blank = (sentence, n) => {
    let out = sentence;
    const lower = () => out.toLowerCase();
    for (let i = lower().indexOf(n.toLowerCase()); i >= 0; i = lower().indexOf(n.toLowerCase(), i + 1)) {
      if (!isWordChar(out[i - 1]) && !isWordChar(out[i + n.length])) out = out.slice(0, i) + " ".repeat(n.length) + out.slice(i + n.length);
    }
    return out;
  };
  const off = new Set();
  // A stop inside a name (logo.png) isn't a sentence end.
  for (const raw of text.split(/[.;!?](?=\s|$)|\n/)) {
    if (!CHANGE_WORD.test(raw)) continue;
    let sentence = raw;
    for (const n of longestFirst(allowed)) sentence = blank(sentence, n);
    for (const n of longestFirst(all)) {
      if (allowed.has(n) || !names(sentence, n)) continue;
      off.add(n);
      sentence = blank(sentence, n);
    }
    if (PARENT_WORD.test(raw)) for (const p of parents) if (!allowed.has(p)) off.add(p);
  }
  return [...off];
}
