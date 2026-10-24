// 2D comp-space math from read R3's samples (spec 004 wave B, research R17; data-model › Wave B
// shapes › comp-space.mjs). Pure: no AE, no tolerances (each skill sets its own), and never a guess:
// anything it can't compute comes back null with a reason.
//
// A layer's matrix is translate(position) · rotate(rotation) · scale(scale / 100) · translate(−anchor),
// composed up the Parent chain, as AE composes it. Matrices are [a, b, c, d, e, f], mapping
// (x, y) to (a·x + c·y + e, b·x + d·y + f); y points down and positive rotation turns clockwise, as on
// screen in AE.
//
// Reasons: no_layer_info (a snapshot from before wave B), no_layer (no layer with that index),
// not_sampled (a layer in the chain has no usable sample within 0.0005 s of the time), three_d,
// auto_orient (whether the rotation read includes it is tasks-wave-b T158's live check), no_rect
// (footprint only), singular (toLayerSpace only: a scale of 0 can't be inverted).

import { byIndex, layerInfo } from "./layer-info.mjs";

const TIME_TOL = 0.0005;
const r3 = (v) => Math.round(v * 1000) / 1000 + 0; // + 0 turns -0 into 0
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const pair = (v) => (Array.isArray(v) && isNum(v[0]) && isNum(v[1]) ? [v[0], v[1]] : null);

const fail = (reason, key) => ({ [key]: null, reason });

export function multiply(m, n) {
  const [a, b, c, d, e, f] = m;
  const [a2, b2, c2, d2, e2, f2] = n;
  return [a * a2 + c * b2, b * a2 + d * b2, a * c2 + c * d2, b * c2 + d * d2, a * e2 + c * f2 + e, b * e2 + d * f2 + f];
}

export function apply(m, [x, y]) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

export function invert(m) {
  const [a, b, c, d, e, f] = m;
  const det = a * d - b * c;
  if (!det || !Number.isFinite(det)) return null;
  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
}

// One layer's own matrix from { anchor, position, scale, rotation } (scale in percent, rotation in
// degrees). Null if any value is missing.
export function layerMatrix({ anchor, position, scale, rotation } = {}) {
  const an = pair(anchor);
  const po = pair(position);
  const sc = pair(scale);
  if (!an || !po || !sc || !isNum(rotation)) return null;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const sx = sc[0] / 100;
  const sy = sc[1] / 100;
  const a = cos * sx;
  const b = sin * sx;
  const c = -sin * sy;
  const d = cos * sy;
  return [a, b, c, d, po[0] - (a * an[0] + c * an[1]), po[1] - (b * an[0] + d * an[1])];
}

export function sampleAt(entry, time) {
  if (!entry || !Array.isArray(entry.samples) || !isNum(time)) return null;
  return entry.samples.find((s) => isNum(s.time) && Math.abs(s.time - time) <= TIME_TOL) || null;
}

// `parent_transform` ({ anchor, position, scale, rotation }) stands in for the direct parent's
// sampled transform (skill 6's "the null as stored at parenting"); the parent's own parents still
// come from their samples. It's ignored for a layer with no parent. There's no option for a whole
// stored chain (spec 012's SR-2 was declined).
export function compMatrix(snapshot, index, time, { parent_transform } = {}) {
  if (!layerInfo(snapshot).known) return fail("no_layer_info", "matrix");
  let entry = byIndex(snapshot, index);
  if (!entry) return fail("no_layer", "matrix");
  let m = [1, 0, 0, 1, 0, 0];
  const seen = new Set();
  let depth = 0;
  while (entry) {
    if (seen.has(entry.index)) return fail("no_layer", "matrix"); // a loop AE wouldn't allow
    seen.add(entry.index);
    if (entry.three_d) return fail("three_d", "matrix");
    if (entry.auto_orient) return fail("auto_orient", "matrix");
    const values = depth === 1 && parent_transform ? parent_transform : sampleAt(entry, time);
    const own = values ? layerMatrix(values) : null;
    if (!own) return fail("not_sampled", "matrix");
    m = multiply(own, m);
    if (entry.parent == null) break;
    const next = byIndex(snapshot, entry.parent);
    if (!next) return fail("no_layer", "matrix");
    entry = next;
    depth++;
  }
  return { matrix: m };
}

// A point in the layer's own space, in comp pixels.
export function compPoint(snapshot, index, point, time, opts) {
  const p = pair(point);
  if (!p) throw new Error("compPoint needs a point [x, y]");
  const { matrix, reason } = compMatrix(snapshot, index, time, opts);
  if (!matrix) return fail(reason, "point");
  return { point: apply(matrix, p).map(r3) };
}

// Where the layer "is": its anchor point in comp space.
export function compPosition(snapshot, index, time, opts) {
  const { matrix, reason } = compMatrix(snapshot, index, time, opts);
  if (!matrix) return fail(reason, "position");
  const anchor = pair(sampleAt(byIndex(snapshot, index), time)?.anchor);
  if (!anchor) return fail("not_sampled", "position");
  return { position: apply(matrix, anchor).map(r3) };
}

// The four corners of the layer's own rectangle in comp space (top-left, top-right, bottom-right,
// bottom-left of the rectangle) and their axis-aligned bounds. `extents: true` uses rect_extents.
export function footprint(snapshot, index, time, { extents = false, ...opts } = {}) {
  const { matrix, reason } = compMatrix(snapshot, index, time, opts);
  if (!matrix) return { corners: null, bounds: null, reason };
  const sample = sampleAt(byIndex(snapshot, index), time);
  const rect = sample && (extents ? sample.rect_extents : sample.rect);
  if (!rect || ![rect.left, rect.top, rect.width, rect.height].every(isNum)) return { corners: null, bounds: null, reason: "no_rect" };
  const { left, top, width, height } = rect;
  const corners = [[left, top], [left + width, top], [left + width, top + height], [left, top + height]]
    .map((c) => apply(matrix, c).map(r3));
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  return { corners, bounds: { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) } };
}

// The inverse: a comp-space point in the layer's own space (for fixture twins, such as skill 6's
// parenting demo).
export function toLayerSpace(snapshot, index, point, time, opts) {
  const p = pair(point);
  if (!p) throw new Error("toLayerSpace needs a point [x, y]");
  const { matrix, reason } = compMatrix(snapshot, index, time, opts);
  if (!matrix) return fail(reason, "point");
  const inv = invert(matrix);
  if (!inv) return fail("singular", "point");
  return { point: apply(inv, p).map(r3) };
}
