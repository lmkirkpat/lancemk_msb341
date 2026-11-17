// Spec 015 FR-004a (OQ-10, research R15; data-model § 6): for a named layer, each parent-chain
// transform expression's peak footprint shift on that layer, in comp pixels. How far the layer's
// farthest box corner moves at the expression's fine peak, compared with the same layer with that
// one property at its base value. Pure, on comp-space.mjs's matrices: no AE, no new read.
//
// Never a guess: whenever the shift can't be worked out exactly from what was read, the entry is
// `shift_px: null` with a reason (three_d, auto_orient, switch_not_read, no_rect, not_sampled,
// no_fine_sweep, chain_moves, direction_unknown, singular), never an estimate, a number in degrees or percent, or 0.
//
// The samples are at the reading time, not the peak, so the conversion is exact only when every
// value it depends on is the same at both (research R15's `chain_moves` list): the transform of the
// named layer and every layer between it and the source; the source layer's Anchor Point and Scale
// (its own Position never matters, since moving a pivot or a parent doesn't change a distance); the
// Scale of every layer above the source, and their Rotation when one of them scales non-uniformly.

import { byIndex, layerInfo } from "./layer-info.mjs";
import { apply, layerMatrix, multiply, sampleAt } from "./comp-space.mjs";
import { expressionReads, expressionsRead, sampleKeyOf } from "./expressions.mjs";

const T = "ADBE Transform Group/";
const PATHS = {
  anchor: [`${T}ADBE Anchor Point`],
  position: [`${T}ADBE Position`, `${T}ADBE Position_0`, `${T}ADBE Position_1`, `${T}ADBE Position_2`],
  scale: [`${T}ADBE Scale`],
  rotation: [`${T}ADBE Rotate Z`, `${T}ADBE Rotate X`, `${T}ADBE Rotate Y`, `${T}ADBE Orientation`],
};
// Expressions on these move a child; Opacity and effects don't move the box.
const MOVES = new Set(Object.values(PATHS).flat());
const EPS = 1e-9;
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const pair = (v) => (Array.isArray(v) && isNum(v[0]) && isNum(v[1]) ? [v[0], v[1]] : null);
const r2 = (v) => Math.round(v * 100) / 100 + 0;
const uniform = (scale) => Math.abs(Math.abs(scale[0]) - Math.abs(scale[1])) < EPS;

// The layer's chain, the layer first, up to the top parent. Null on a loop or a missing parent.
function chainOf(snapshot, index) {
  const out = [];
  const seen = new Set();
  for (let e = byIndex(snapshot, index); e; e = e.parent == null ? null : byIndex(snapshot, e.parent)) {
    if (seen.has(e.index)) return null;
    seen.add(e.index);
    out.push(e);
    if (e.parent != null && !byIndex(snapshot, e.parent)) return null;
  }
  return out;
}

// Does a value on this layer change over time: keys on any of its paths, or an active expression
// on one whose sweep varies (or wasn't read, which can't vouch for it staying put).
function makeMoving(snapshot, list) {
  const keyed = new Map((snapshot.layers || []).map((l) => [l.index, new Set((l.properties || []).filter((p) => p.keys && p.keys.length > 0).map((p) => p.path))]));
  return (layerIndex, key) => {
    const paths = PATHS[key];
    const k = keyed.get(layerIndex);
    if (k && paths.some((p) => k.has(p))) return true;
    return list.some((x) => x.layer_index === layerIndex && x.active && paths.includes(x.path) &&
      (x.moves && x.moves.status === "not_read" ? x.moves.reason !== "not_running" : !(x.moves && x.moves.varies === false)));
  };
}

const movesChildren = (x) => x.active && x.group === "transform" && MOVES.has(x.path) &&
  (x.moves && x.moves.status === "not_read" ? x.moves.reason !== "not_running" : !!(x.moves && x.moves.varies === true));

// The named layer's box corners in comp space, with `over` standing in for one chain layer's values.
function corners(chain, time, over) {
  let m = [1, 0, 0, 1, 0, 0];
  for (const e of chain) {
    const values = over && over.index === e.index ? over.values : sampleAt(e, time);
    m = multiply(layerMatrix(values), m);
  }
  const { left, top, width, height } = sampleAt(chain[0], time).rect;
  return [[left, top], [left + width, top], [left + width, top + height], [left, top + height]].map((c) => apply(m, c));
}

// Keys or an active expression outside the Transform group and the effects, or a sampled box that
// differs between samples.
const BOX_SAFE = /^(ADBE Transform Group|ADBE Effect Parade|ADBE Marker)(\/|$)/;
function boxMoves(snapshot, layer) {
  const keyed = (snapshot.layers || []).find((l) => l.index === layer.index);
  if (keyed && (keyed.properties || []).some((p) => p.keys && p.keys.length > 0 && !BOX_SAFE.test(p.path))) return true;
  if ((snapshot.expressions || []).some((x) => x.layer === layer.index && x.enabled === true && !x.error && !BOX_SAFE.test(x.path))) return true;
  const rects = (layer.samples || []).map((s) => s.rect).filter(Boolean).map((r) => JSON.stringify([r.left, r.top, r.width, r.height]));
  return new Set(rects).size > 1;
}

// One entry for the expression `x` on chain[k] (k ≥ 1), moving chain[0].
function shiftFor(snapshot, chain, k, x, time, moving) {
  const src = chain[k];
  const head = { from_layer_index: src.index, from_layer: src.name, property: x.property };
  const no = (reason) => ({ ...head, shift_px: null, reason });
  const named = chain[0];
  const key = sampleKeyOf(x.path);

  if (chain.some((e) => e.three_d === true) || !["anchor", "position", "scale", "rotation"].includes(key) || /Rotate [XY]|Orientation|Position_2/.test(x.path)) return no("three_d");
  if (chain.some((e) => e.auto_orient === true)) return no("auto_orient");
  // Review S2: a 3D or Auto-Orient switch the snapshot couldn't read (null, or absent) can't vouch for 2D.
  if (chain.some((e) => typeof e.three_d !== "boolean" || typeof e.auto_orient !== "boolean")) return no("switch_not_read");
  if (named.is_null || named.kind === "camera" || named.kind === "light" || named.has_video === false) return no("no_rect");

  const sweeps = Array.isArray(snapshot.expression_sweeps) ? snapshot.expression_sweeps : [];
  const fine = sweeps.find((w) => w.layer === src.index && w.path === x.path && w.kind === "fine" && w.status !== "not_read" && isNum(w.max_offset) && isNum(w.max_at));
  if (!fine) return no("no_fine_sweep");

  const samples = chain.map((e) => sampleAt(e, time));
  if (samples.some((s) => !s || !layerMatrix(s))) return no("not_sampled");
  const rect = samples[0].rect;
  if (!rect || ![rect.left, rect.top, rect.width, rect.height].every(isNum)) return no("no_rect");

  // Does the answer need the peak's direction? Rotation and a separated dimension never do, unless a
  // layer above the source scales non-uniformly (then a turn's sign changes the length); Position and
  // Anchor Point do only through a non-uniform scale; Scale always does.
  const above = samples.slice(k + 1);
  const aboveUniform = above.every((s) => uniform(s.scale));
  const separated = /Position_[01]$/.test(x.path);
  let needsDirection;
  if (key === "scale") needsDirection = true;
  else if (key === "rotation" || separated) needsDirection = !aboveUniform;
  else if (key === "position") needsDirection = !aboveUniform;
  else needsDirection = !aboveUniform || !uniform(samples[k].scale); // anchor

  // chain_moves (research R15).
  const deps = [];
  for (let i = 0; i < k; i++) for (const p of ["anchor", "position", "scale", "rotation"]) deps.push([chain[i].index, p]);
  for (const p of ["anchor", "scale"]) if (p !== key) deps.push([src.index, p]);
  // The source's own Rotation turns an Anchor Point or Scale offset; Position applies in the parent's space.
  if ((key === "anchor" || key === "scale") && needsDirection) deps.push([src.index, "rotation"]);
  for (let i = k + 1; i < chain.length; i++) {
    deps.push([chain[i].index, "scale"]);
    if (!aboveUniform) deps.push([chain[i].index, "rotation"]);
  }
  if (deps.some(([i, p]) => moving(i, p))) return no("chain_moves");
  // Review S1: a text or shape layer's box can change over time (Source Text, animators, Rectangle
  // Size, Path), so the box at the peak may not be the box now. Effects and markers don't change it.
  if ((named.kind === "text" || named.kind === "shape") && boxMoves(snapshot, named)) return no("chain_moves");
  // With a direction, the peak value is compared with the base, which must then be the same at the
  // peak as now: a keyed source property can't give it.
  const baseNow = samples[k].base && samples[k].base[key] != null ? samples[k].base[key] : null;
  const peak = fine.max_value;
  if (needsDirection) {
    if (peak === undefined || peak === null) return no("direction_unknown");
    const keyed = (snapshot.layers || []).find((l) => l.index === src.index);
    if (keyed && keyed.properties.some((p) => p.path === x.path && p.keys && p.keys.length > 0)) return no("chain_moves");
    if (baseNow === null) return no("not_sampled");
  }

  if (samples.some((s) => !s.scale[0] || !s.scale[1])) return no("singular");

  // The source's values at its base and at its peak; everything else as sampled.
  const at = samples[k];
  const v0 = { ...at };
  const v1 = { ...at };
  if (key === "rotation") {
    const r0 = isNum(baseNow) ? baseNow : at.rotation;
    v0.rotation = r0;
    v1.rotation = needsDirection ? Number(Array.isArray(peak) ? peak[0] : peak) : r0 + fine.max_offset;
  } else if (separated) {
    const d = x.path.endsWith("_0") ? 0 : 1;
    const p0 = pair(baseNow) || pair(at.position);
    v0.position = [...p0];
    v1.position = [...p0];
    if (needsDirection) v1.position[d] = Number(Array.isArray(peak) ? peak[0] : peak);
    else v1.position[d] = p0[d] + fine.max_offset;
  } else if (needsDirection) {
    const b = pair(baseNow);
    const p = pair(peak);
    if (!b || !p) return no("direction_unknown");
    v0[key] = b;
    v1[key] = p;
  } else {
    // A pure translation of the children through uniform scales: any direction gives the same length.
    const b = pair(baseNow) || pair(at[key]);
    v0[key] = b;
    v1[key] = [b[0] + fine.max_offset, b[1]];
  }
  if (!layerMatrix(v0) || !layerMatrix(v1)) return no("not_sampled");
  const c0 = corners(chain, time, { index: src.index, values: v0 });
  const c1 = corners(chain, time, { index: src.index, values: v1 });
  const shift = Math.max(...c0.map((c, i) => Math.hypot(c1[i][0] - c[0], c1[i][1] - c[1])));
  return { ...head, shift_px: r2(shift), at: fine.max_at, sampled_every: fine.sampled_every, sampled: true, measured_on: "box" };
}

// FR-004a: [entry] for the layer at `index` at `time` (one per active parent-chain transform
// expression that moves it), [] when it has none, or not_read when read R2 or layer_info is missing.
export function footprintShifts(snapshot, index, time) {
  const read = expressionsRead(snapshot);
  if (read !== "all") return read;
  if (!layerInfo(snapshot).known) return { status: "not_read", reason: "no_layer_info" };
  const chain = chainOf(snapshot, index);
  if (!chain) return { status: "not_read", reason: "not_found" };
  const { list } = expressionReads(snapshot);
  const moving = makeMoving(snapshot, list);
  const out = [];
  for (let k = 1; k < chain.length; k++) {
    for (const x of list.filter((e) => e.layer_index === chain[k].index && movesChildren(e))) {
      out.push(shiftFor(snapshot, chain, k, x, time, moving));
    }
  }
  return out;
}
