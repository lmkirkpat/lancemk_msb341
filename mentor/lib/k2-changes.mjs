// Spec 015 K2 for the checks that compare keys (offset, key types, speed graph; T025, SC-005,
// US3 scenario 4): changes to a layer's unkeyed transform values, which those checks' key diffs
// can't see. Compared at the same times in both reads, on `base` (before the expression) where a
// property has an active expression, so an expression's motion (the playhead, or a renumber under a
// wiggle) is never one. Pan Behind changes Anchor Point and Position together, so an anchor change
// is reported alone. Keyed properties are left to each check's own key diff.
//
// Pure, from layer_info's samples; a snapshot without layer_info gives nothing (it can't be read).

import { layerInfo } from "./layer-info.mjs";

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const TOL = 0.01;
const TIME_TOL = 0.0005;
const TF = "ADBE Transform Group/";
const PATHS = {
  anchor: [TF + "ADBE Anchor Point"],
  position: [TF + "ADBE Position", TF + "ADBE Position_0", TF + "ADBE Position_1", TF + "ADBE Position_2"],
  scale: [TF + "ADBE Scale"],
  rotation: [TF + "ADBE Rotate Z"],
};
const NAMES = { anchor: "Anchor Point", position: "Position", scale: "Scale", rotation: "Rotation" };

const compareValue = (s, k) => (s && s.base && s.base[k] != null ? s.base[k] : s ? s[k] : null);
const differs = (a, b) => (Array.isArray(a) && Array.isArray(b)
  ? a.some((v, i) => isNum(v) && isNum(b[i]) && Math.abs(v - b[i]) > TOL)
  : isNum(a) && isNum(b) && Math.abs(a - b) > TOL);

// Each baseline layer's match in the comp now, by name: the one layer with it, or, when the same
// number of layers share it on both sides, the k-th in stack order. Otherwise not compared.
function matches(baseline, current) {
  const byName = (snap) => {
    const m = new Map();
    for (const l of [...layerInfo(snap).layers].sort((a, b) => a.index - b.index)) m.set(l.name, [...(m.get(l.name) || []), l]);
    return m;
  };
  const b = byName(baseline);
  const c = byName(current);
  const out = [];
  for (const [name, list] of b) {
    const now = c.get(name) || [];
    if (now.length === list.length) list.forEach((l, i) => out.push([l, now[i]]));
  }
  return out.sort((x, y) => x[0].index - y[0].index);
}

const keyedPaths = (snap, index) => new Set(((snap.layers || []).find((l) => l.index === index) || { properties: [] }).properties.map((p) => p.path));

// [{ layer, property }] in layer order: each unkeyed transform value that changed.
export function unkeyedChanges(baseline, current) {
  if (!layerInfo(baseline).known || !layerInfo(current).known) return [];
  const out = [];
  for (const [b, c] of matches(baseline, current)) {
    const keyed = new Set([...keyedPaths(baseline, b.index), ...keyedPaths(current, c.index)]);
    const times = (b.samples || []).map((s) => s.time).filter((t) => (c.samples || []).some((u) => Math.abs(u.time - t) <= TIME_TOL));
    const at = (e, t) => (e.samples || []).find((s) => Math.abs(s.time - t) <= TIME_TOL);
    const changed = (k) => !PATHS[k].some((p) => keyed.has(p)) && times.some((t) => differs(compareValue(at(b, t), k), compareValue(at(c, t), k)));
    const props = ["anchor", "position", "scale", "rotation"].filter(changed);
    for (const k of props) {
      if (k === "position" && props.includes("anchor")) continue;
      out.push({ layer: b.name, property: NAMES[k] });
    }
  }
  return out;
}

// The sentences the keyed checks list, in their own wording ("… was changed (not part of this
// lesson)", as diff.mjs says it for keyed properties).
export const unkeyedChangeNotes = (baseline, current) =>
  unkeyedChanges(baseline, current).map((c) => `${c.layer} › ${c.property} was changed (not part of this lesson)`);
