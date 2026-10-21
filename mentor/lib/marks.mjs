// Kept-linear marks (FR-038, data-model › Kept-linear mark, contracts/skill-module.md › 6). A mark
// says the learner chose constant speed for one property, and a check saw it linear. It applies only
// while that property still has exactly the same key times, no expression, and every pair linear;
// any change lapses it for good. Pure: reading the record is the caller's job.

import { segmentState } from "./analyze.mjs";

const sameTimes = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((t, i) => t === b[i]);

// The property on the named layer, by path. Layer names can repeat; any layer with the name and the
// path counts.
function findProp(snapshot, layerName, propPath) {
  for (const layer of snapshot.layers || []) {
    if (layer.name !== layerName) continue;
    const prop = layer.properties.find((p) => p.path === propPath);
    if (prop) return { layer, prop };
  }
  return null;
}

// Every pair linear at both of its own ends (the first key's out side, the next key's in side).
export function allPairsLinear(prop) {
  if (prop.keys.length < 2) return false;
  for (let i = 1; i < prop.keys.length; i++) if (segmentState(prop.keys[i - 1], prop.keys[i]) !== "linear") return false;
  return true;
}

export function applies(mark, snapshot) {
  if (!mark || mark.kind !== "kept_linear" || !snapshot) return false;
  if (mark.project !== snapshot.project || mark.comp !== (snapshot.comp && snapshot.comp.name)) return false;
  const found = findProp(snapshot, mark.layer, mark.path);
  if (!found) return false;
  const { prop } = found;
  return !prop.expression_enabled && sameTimes(prop.keys.map((k) => k.time), mark.key_times) && allPairsLinear(prop);
}

export function marksFor(record, project, comp) {
  const marks = record && Array.isArray(record.marks) ? record.marks : [];
  return marks.filter((m) => m && m.kind === "kept_linear" && m.project === project && m.comp === comp);
}

export function isKeptLinear(marks, layerName, propPath, snapshot) {
  return (marks || []).some((m) => m.layer === layerName && m.path === propPath && applies(m, snapshot));
}

// The part of a mark a lesson keeps (session.keepLinear); record_lesson adds the rest.
export function markFrom(prop, layer) {
  return { layer: layer.name, path: prop.path, property: prop.display_name, key_times: prop.keys.map((k) => k.time) };
}
