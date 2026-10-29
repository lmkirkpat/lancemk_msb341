// Skill 5, set the pivot (spec 011): the nine places, the rest key and check time, the candidates
// and their ranking, the lesson's focus and targets, the samples each read needs, and the demo's
// values. Pure, no AE calls.
//
// Every layer fact comes from wave B's shared reads (FR-002): layerInfo() for every layer, keyed or
// not (filter 2), classOf() for visibility (never the eye switch, filter 3), sourcesOf() for parents
// and children, and comp-space.mjs for every comp-space value. This file sets only its own
// tolerances, and reads any comp-space `reason` as "can't read", never as a value (filter 6).

import { MentorError, registerErrors } from "../errors.mjs";
import { compPosition, footprint, layerMatrix, sampleAt } from "./comp-space.mjs";
import { byIndex, byName, layerInfo } from "./layer-info.mjs";
import { sourcesOf } from "./motion-sources.mjs";
import { classOf } from "./visibility.mjs";

export const SKILL = "transform.anchor";

// ---- Tolerances (this skill's own; never said to the learner, SC-004)

export const PLACE_FRACTION = 0.1; // FR-010: 10% of the rectangle's width (or height)...
export const PLACE_FLOOR_PX = 3; //   ...or 3 px, whichever is larger, per axis (S-3)
export const MOVE_PX = 1; // FR-012: an edge of the footprint moving more than this has moved
export const TURN_TOL_DEG = 0.5; // FR-011: Rotation within this of 0 or a whole turn
export const DEMO_MATCH_PX = 0.01; // FR-016: the demo's anchor still as written
export const AS_PLACED_PX = 0.5; // FR-004 ranking: the anchor "where AE put it" (D-3)
export const FULL_FRAME = 0.95; // FR-004: bounds covering this much of the comp both ways
export const MAX_NEEDED_TIMES = 63; // comp.time takes the 64th sample (spec 004 data-model › Sample times)
const VALUE_TOL = 0.01; // two read values the same (they're rounded to 0.001)
const TIME_TOL = 0.0005;

// ---- Live-check switches (desk block, tasks T235)

// L-1 (passed 2026-10-26 at 26.5): Pan Behind moves a shape layer's own anchor and Position
// together, and its bounds match what's drawn, so shapes are default candidates. While false, they
// were allowed if named, never proposed (reason shape_until_l1).
export const SHAPES_DEFAULT = true;
// Which rectangle item 1 (where the place is) and item 2 (did it move) both use, per layer kind
// (filter 5): "rect" or "rect_extents". L-1 (shapes: rect and rect_extents both read the shape as
// drawn, no stroke) and L-5 (text: rect within 1 px of the ink, centred and left-justified) kept
// "rect" for both.
export const RECT_KIND = { shape: "rect", text: "rect", default: "rect" };

export const rectKind = (kind) => (Object.hasOwn(RECT_KIND, kind) ? RECT_KIND[kind] : RECT_KIND.default);
export const footprintOpts = (kind) => ({ extents: rectKind(kind) === "rect_extents" });
export function rectOf(sample, kind) {
  if (!sample) return null;
  const r = rectKind(kind) === "rect_extents" ? sample.rect_extents : sample.rect;
  return r && [r.left, r.top, r.width, r.height].every(isNum) ? r : null;
}

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const r3 = (v) => Math.round(v * 1000) / 1000 + 0;
const pair = (v) => (Array.isArray(v) && isNum(v[0]) && isNum(v[1]) ? [v[0], v[1]] : null);

// ---- The nine places (FR-005, research R2), in the layer's own space

export const PLACES = [
  "top-left", "top-middle", "top-right",
  "middle-left", "center", "middle-right",
  "bottom-left", "bottom-middle", "bottom-right",
];
const PLACE_FRACTIONS = {
  "top-left": [0, 0], "top-middle": [0.5, 0], "top-right": [1, 0],
  "middle-left": [0, 0.5], center: [0.5, 0.5], "middle-right": [1, 0.5],
  "bottom-left": [0, 1], "bottom-middle": [0.5, 1], "bottom-right": [1, 1],
};
export const isPlace = (p) => Object.hasOwn(PLACE_FRACTIONS, p);

export function placePoint(rect, place) {
  if (!isPlace(place)) throw new Error(`Not one of the nine places: ${place}`);
  const [fx, fy] = PLACE_FRACTIONS[place];
  return [r3(rect.left + fx * rect.width), r3(rect.top + fy * rect.height)];
}

// Per axis: max(10% of that side, 3 px), in the layer's own pixels.
export function tolerance(rect) {
  return [Math.max(PLACE_FRACTION * Math.abs(rect.width), PLACE_FLOOR_PX), Math.max(PLACE_FRACTION * Math.abs(rect.height), PLACE_FLOOR_PX)];
}

// Item 1, the already-there rule (FR-007) and the review's leave-out all use this one test.
// A tiny slack absorbs the 0.001 rounding of read values, so "exactly at 10%" is in.
export function inPlace(anchor, rect, place) {
  const a = pair(anchor);
  if (!a || !rect) return false;
  const [px, py] = placePoint(rect, place);
  const [tx, ty] = tolerance(rect);
  return Math.abs(a[0] - px) <= tx + 1e-6 && Math.abs(a[1] - py) <= ty + 1e-6;
}

// The place the anchor is in (the nearest, if a tiny layer's places overlap), else "outside" when
// it's beyond the rectangle by more than the tolerance on an axis, else "between". Null if unread.
export function placeNow(anchor, rect) {
  const a = pair(anchor);
  if (!a || !rect) return null;
  const [tx, ty] = tolerance(rect);
  const hits = PLACES.filter((p) => inPlace(a, rect, p));
  if (hits.length) {
    const dist = (p) => {
      const [px, py] = placePoint(rect, p);
      return Math.hypot((a[0] - px) / tx, (a[1] - py) / ty);
    };
    return hits.sort((p, q) => dist(p) - dist(q))[0];
  }
  const left = Math.min(rect.left, rect.left + rect.width);
  const right = Math.max(rect.left, rect.left + rect.width);
  const top = Math.min(rect.top, rect.top + rect.height);
  const bottom = Math.max(rect.top, rect.top + rect.height);
  if (a[0] < left - tx - 1e-6 || a[0] > right + tx + 1e-6 || a[1] < top - ty - 1e-6 || a[1] > bottom + ty + 1e-6) return "outside";
  return "between";
}

// Which side of the layer a pivot outside it sits on, as seen on screen (FR-019a): the anchor's
// comp-space point (compPosition) against the layer's comp-space bounds (footprint) at `time`.
// "above", "below", "left", "right" or a pair ("below-left"). An axis counts when the point is past
// that edge by more than item 1's tolerance on the bounds (so a pivot far below and level with the
// right edge is "below"), else by more than 1 px. Null when either can't be read (FR-018), or when the
// point sits within the bounds on screen (a turned layer), so the mentor never guesses a side.
export function outsideSide(snapshot, index, time, kind) {
  if (!isNum(time)) return null;
  const pos = compPosition(snapshot, index, time);
  const fp = footprint(snapshot, index, time, footprintOpts(kind));
  const p = pos && !pos.reason ? pair(pos.position) : null;
  const b = fp && !fp.reason ? fp.bounds : null;
  if (!p || !b || ![b.left, b.top, b.right, b.bottom].every(isNum)) return null;
  const [tx, ty] = tolerance({ width: b.right - b.left, height: b.bottom - b.top });
  let v = p[1] < b.top - ty ? "above" : p[1] > b.bottom + ty ? "below" : null;
  let h = p[0] < b.left - tx ? "left" : p[0] > b.right + tx ? "right" : null;
  if (!v && !h) {
    v = p[1] < b.top - MOVE_PX ? "above" : p[1] > b.bottom + MOVE_PX ? "below" : null;
    h = p[0] < b.left - MOVE_PX ? "left" : p[0] > b.right + MOVE_PX ? "right" : null;
  }
  return v && h ? `${v}-${h}` : v || h || null;
}

// ---- Keys, from the snapshot's keyed `layers` (the only place keys are read)

const TR = "ADBE Transform Group/";
const ANCHOR = `${TR}ADBE Anchor Point`;
const POSITION_PATHS = [`${TR}ADBE Position`, `${TR}ADBE Position_0`, `${TR}ADBE Position_1`, `${TR}ADBE Position_2`];
const ROTATION = `${TR}ADBE Rotate Z`;
const SCALE = `${TR}ADBE Scale`;

export const keyedLayer = (snapshot, index) => (snapshot.layers || []).find((l) => l.index === index) || null;
const propsOf = (kl, paths) => (kl ? kl.properties.filter((p) => paths.includes(p.path)) : []);
const keyedProps = (kl, paths) => propsOf(kl, paths).filter((p) => p.keys.length > 0);

export function keyFlags(kl) {
  const has = (paths) => keyedProps(kl, paths).length > 0;
  const expr = (paths) => keyedProps(kl, paths).some((p) => p.expression_enabled);
  return {
    anchor: has([ANCHOR]),
    position: has(POSITION_PATHS),
    rotation: has([ROTATION]),
    scale: has([SCALE]),
    expression_anchor_position: expr([ANCHOR, ...POSITION_PATHS]),
    expression_rotation_scale: expr([ROTATION, SCALE]),
    // FR-004's ranking: any property with keys at all (Opacity, an effect, a mask or a text
    // animator counts, not only Transform).
    any: !!kl && kl.properties.some((p) => p.keys.length > 0),
  };
}

export const anchorKeyCount = (kl) => propsOf(kl, [ANCHOR]).reduce((n, p) => n + p.keys.length, 0);
export const positionKeyCount = (kl) => propsOf(kl, POSITION_PATHS).reduce((n, p) => n + p.keys.length, 0);

export function positionKeyTimes(kl) {
  return uniqueTimes(keyedProps(kl, POSITION_PATHS).flatMap((p) => p.keys.map((k) => k.time)));
}

// Half a frame at the read's frame rate (FR-004's "within half a frame"), or the read tolerance
// when the frame rate is missing.
export function halfFrame(snapshot) {
  const fps = snapshot && snapshot.comp && snapshot.comp.frame_rate;
  return isNum(fps) && fps > 0 ? 0.5 / fps + 1e-6 : TIME_TOL;
}

// Position's key times as FR-004 counts them (D-4): key times, not keys; separated X and Y (and Z)
// together; hold keys like any key; a time within half a frame of the last one kept is merged into it.
export function positionTimes(snapshot, kl) {
  const tol = halfFrame(snapshot);
  const all = keyedProps(kl, POSITION_PATHS).flatMap((p) => p.keys.map((k) => k.time)).filter(isNum).sort((a, b) => a - b);
  const out = [];
  for (const t of all) if (!out.length || t - out[out.length - 1] > tol) out.push(r3(t));
  return out;
}

// Which Position rule applies (FR-004, D-4): null with no Position keys; "position_moves" for two
// or more key times, or for one that isn't on the check time (the rest key, the learner's or the
// default, more than half a frame from it); else "position_keyed". Pan Behind changes or adds one
// Position key, at the playhead (L-2), so a layer that already moves slides at its other keys and
// no taught move can pass.
export function positionRule(snapshot, kl, opts = {}) {
  const pc = positionCase(snapshot, kl, opts);
  return pc ? pc.rule : null;
}

// The Position rule with its case (FR-004 › Which position_moves case, B-9), so the rule lives in
// one place: null with no Position keys; { rule: "position_keyed" }; or { rule: "position_moves",
// moves_case }, where moves_case is "two_or_more", or "one_key_off_rest" with position_key_time (the
// one key's time) and rest_time (the time it was compared against: the learner's rest_time when
// restKey used it, else the tool's rest key).
export function positionCase(snapshot, kl, { rest_time } = {}) {
  const times = positionTimes(snapshot, kl);
  if (!times.length) return null;
  if (times.length >= 2) return { rule: "position_moves", moves_case: "two_or_more" };
  const rk = restKey(kl, { rest_time });
  if (!rk) return { rule: "position_keyed" };
  if (isNum(rk.time) && Math.abs(rk.time - times[0]) <= halfFrame(snapshot)) return { rule: "position_keyed" };
  return { rule: "position_moves", moves_case: "one_key_off_rest", position_key_time: times[0], rest_time: isNum(rk.time) ? rk.time : null };
}

// A time in seconds as the mentor says it (FR-004 › Time labels, B-11): rounded half up to
// `decimals` places, trailing zeros and a bare "." dropped, then " s". null for a non-number.
export function timeLabel(t, decimals = 1) {
  if (!isNum(t)) return null;
  const f = 10 ** decimals;
  const text = (Math.round(t * f + 1e-9) / f).toFixed(decimals).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return `${text} s`;
}

// The two labels of a one_key_off_rest entry, [position_key_label, rest_label]. When both times
// read the same at a tenth (3.667 and 3.7), both take the fewest decimals, up to three, at which
// they differ ("3.67 s", "3.7 s"), so the sentence never puts the two frames at one time. A label
// is null exactly when its time is.
export function timeLabels(keyTime, restTime) {
  let d = 1;
  while (d < 3 && isNum(keyTime) && isNum(restTime) && timeLabel(keyTime, d) === timeLabel(restTime, d)) d += 1;
  return [timeLabel(keyTime, d), timeLabel(restTime, d)];
}

// The moves_case fields of a position_moves entry, for spreading into a candidate or a
// focus_problems entry: the case, and for one_key_off_rest the two times and their labels (B-11);
// {} for any other reason.
export function movesFields(c) {
  if (!c || c.reason !== "position_moves" || !c.moves_case) return {};
  if (c.moves_case !== "one_key_off_rest") return { moves_case: c.moves_case };
  const [position_key_label, rest_label] = timeLabels(c.position_key_time, c.rest_time);
  return { moves_case: c.moves_case, position_key_time: c.position_key_time, rest_time: c.rest_time, position_key_label, rest_label };
}

function uniqueTimes(list) {
  const out = [];
  for (const t of list.filter(isNum).sort((a, b) => a - b)) if (!out.some((u) => Math.abs(u - t) <= TIME_TOL)) out.push(r3(t));
  return out;
}

// ---- The rest key and the check time (FR-011, research R3)

const turnOff = (deg) => {
  const m = ((deg % 360) + 360) % 360;
  return Math.min(m, 360 - m);
};
export const isWholeTurn = (deg) => isNum(deg) && turnOff(deg) <= TURN_TOL_DEG + 1e-9;
const scaleSize = (v) => (Array.isArray(v) && isNum(v[0]) && isNum(v[1]) ? Math.abs(v[0] * v[1]) : null);

// { time, basis } for a layer with Rotation or Scale keys, else null. A learner's rest_time that's
// one of those key times wins (basis "learner"); any other value is ignored and flagged.
export function restKey(kl, { rest_time } = {}) {
  const rot = keyedProps(kl, [ROTATION])[0];
  const sc = keyedProps(kl, [SCALE])[0];
  if (!rot && !sc) return null;
  const rotKeys = rot ? rot.keys.filter((k) => isNum(k.time) && isNum(k.value)) : [];
  const scKeys = sc ? sc.keys.filter((k) => isNum(k.time) && scaleSize(k.value) != null) : [];
  const allTimes = uniqueTimes([...rotKeys, ...scKeys].map((k) => k.time));

  let ignored = false;
  if (rest_time !== undefined && rest_time !== null) {
    const hit = isNum(rest_time) && allTimes.find((t) => Math.abs(t - rest_time) <= TIME_TOL);
    if (hit !== undefined && hit !== false) return { time: hit, basis: "learner" };
    ignored = true;
  }
  const flag = (r) => (ignored ? { ...r, rest_time_not_a_key: true } : r);
  if (!allTimes.length) return flag({ time: null, basis: "unreadable" });

  const at = (keys, t) => keys.find((k) => Math.abs(k.time - t) <= TIME_TOL);
  const maxSize = scKeys.length ? Math.max(...scKeys.map((k) => scaleSize(k.value))) : null;
  const scaleMax = (k) => k && Math.abs(scaleSize(k.value) - maxSize) <= 1e-6 * Math.max(1, maxSize);
  const rotOk = (t) => !rot || (at(rotKeys, t) && isWholeTurn(at(rotKeys, t).value));
  const scOk = (t) => !sc || scaleMax(at(scKeys, t));

  const both = allTimes.find((t) => rotOk(t) && scOk(t));
  if (both !== undefined) return flag({ time: both, basis: "both" });
  if (sc && scKeys.length) {
    const k = scKeys.filter(scaleMax).sort((a, b) => a.time - b.time)[0];
    return flag({ time: r3(k.time), basis: "scale" });
  }
  const k = [...rotKeys].sort((a, b) => turnOff(a.value) - turnOff(b.value) || a.time - b.time)[0];
  return flag(k ? { time: r3(k.time), basis: "closest_rotation" } : { time: null, basis: "unreadable" });
}

// The rest key's time for a layer with Rotation or Scale keys, else the read's own comp.time.
export function checkTime(snapshot, index, opts = {}) {
  const rk = restKey(keyedLayer(snapshot, index), opts);
  if (rk) return rk;
  const t = snapshot.comp && isNum(snapshot.comp.time) ? snapshot.comp.time : null;
  return { time: t, basis: "current" };
}

// ---- Candidates (FR-004, research R1)

const DEFAULT_KINDS = new Set(["solid", "text", "footage", "precomp"]);

// OA-12: masks hide part of the layer, but its places come from the whole, unmasked rectangle. An
// unreadable count (null) counts, as in the frame tool; an older read without it (undefined) doesn't.
const masked = (entry) => !!entry && (entry.mask_count === null || (isNum(entry.mask_count) && entry.mask_count > 0));
// OA-13: the layer isn't drawn at time t (before its in point, or at or after its out point), so
// neither is its crosshair.
const offScreen = (entry, t) => !!entry && isNum(t) &&
  ((isNum(entry.in_point) && t < entry.in_point - TIME_TOL) || (isNum(entry.out_point) && t > entry.out_point - TIME_TOL));

// The bucket and reason from what's structural, before any footprint is read. `opts.rest_time` is
// the learner's own rest pose for this layer, if any (it decides a one-key layer, FR-004).
function structural(snapshot, entry, flags, cls, kl = null, opts = {}) {
  const kind = entry.kind;
  if (cls === "null" || kind === "null") return ["never", "null"];
  if (kind === "camera") return ["never", "camera"];
  if (kind === "light") return ["never", "light"];
  if (kind === "adjustment" || entry.adjustment === true) return ["never", "adjustment"];
  if (entry.three_d === true) return ["never", "three_d"];
  if (kind === "precomp" && entry.collapse === true) return ["never", "collapsed"];
  if (flags.anchor) return ["never", "anchor_keyed"];
  if (flags.expression_rotation_scale) return ["never", "expression_rotation_scale"];
  if (flags.expression_anchor_position) return ["never", "expression_anchor_position"];
  if (!kind || (!DEFAULT_KINDS.has(kind) && kind !== "shape")) return ["never", "cant_read"];
  // Never outranks allowed-if-named: a matte, hidden, guide or locked layer that already moves can't
  // pass either.
  if (flags.position && positionRule(snapshot, kl, opts) === "position_moves") return ["never", "position_moves"];
  if (cls === "matte") return ["if_named", "matte"];
  if (cls === "hidden") return ["if_named", "hidden"];
  if (cls === "guide") return ["if_named", "guide"];
  if (entry.locked === true) return ["if_named", "locked"];
  if (masked(entry)) return ["if_named", "masked"];
  if (kind === "shape" && !SHAPES_DEFAULT) return ["if_named", "shape_until_l1"];
  if (flags.position) return ["if_named", "position_keyed"];
  return ["default", null];
}

const shoelace = (c) => Math.abs(c.reduce((s, p, i) => { const q = c[(i + 1) % c.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;

function fullFrame(snapshot, bounds) {
  const w = snapshot.comp && snapshot.comp.width;
  const h = snapshot.comp && snapshot.comp.height;
  if (!isNum(w) || !isNum(h) || w <= 0 || h <= 0 || !bounds) return null; // unknown, never a default size (SR-2)
  const cx = Math.min(bounds.right, w) - Math.max(bounds.left, 0);
  const cy = Math.min(bounds.bottom, h) - Math.max(bounds.top, 0);
  return cx >= FULL_FRAME * w && cy >= FULL_FRAME * h;
}

function asPlaced(anchor, rect) {
  const a = pair(anchor);
  if (!a || !rect) return false;
  const c = [rect.left + rect.width / 2, rect.top + rect.height / 2];
  return (Math.abs(a[0] - c[0]) <= AS_PLACED_PX && Math.abs(a[1] - c[1]) <= AS_PLACED_PX) ||
    (Math.abs(a[0]) <= AS_PLACED_PX && Math.abs(a[1]) <= AS_PLACED_PX);
}

const flipped = (sample) => !!sample && Array.isArray(sample.scale) && (sample.scale[0] < 0 || sample.scale[1] < 0);
const turnedFar = (sample, flags) => !flags.rotation && !!sample && isNum(sample.rotation) && turnOff(sample.rotation) > 45;

// Every layer of layer_info, in index order, each in exactly one bucket with one reason, and the
// default ones ranked. `rest_times` maps a layer name to the learner's own rest pose.
export function candidates(snapshot, { rest_times = {} } = {}) {
  const { known, layers } = layerInfo(snapshot);
  if (!known) return [];
  const out = layers.map((entry) => {
    const kl = keyedLayer(snapshot, entry.index);
    const flags = keyFlags(kl);
    const cls = classOf(snapshot, entry.index);
    const src = sourcesOf(snapshot, entry.index);
    const parents = (src && src.parents) || [];
    const ct = checkTime(snapshot, entry.index, { rest_time: rest_times[entry.name] });
    const sample = isNum(ct.time) ? sampleAt(entry, ct.time) : null;
    const rect = rectOf(sample, entry.kind);
    let [bucket, reason] = structural(snapshot, entry, flags, cls, kl, { rest_time: rest_times[entry.name] });
    const fp = isNum(ct.time) ? footprint(snapshot, entry.index, ct.time, footprintOpts(entry.kind)) : { corners: null, bounds: null, reason: "not_sampled" };
    const readable = !fp.reason && fp.corners && shoelace(fp.corners) > 1e-6 && !!rect && !!pair(sample && sample.anchor);
    const ff = readable ? fullFrame(snapshot, fp.bounds) : null;
    if (bucket !== "never" && !readable) [bucket, reason] = ["never", "cant_read"];
    else if (bucket === "default" && ff === true) [bucket, reason] = ["if_named", "full_frame"];
    const b = readable ? fp.bounds : null;
    const moves = reason === "position_moves" ? movesFields({ reason, ...positionCase(snapshot, kl, { rest_time: rest_times[entry.name] }) }) : {};
    return {
      layer: entry.name, index: entry.index, bucket, reason, rank: null, ...moves,
      class: cls, kind: entry.kind,
      parent: parents.length ? parents[0].layer : null,
      has_children: !!(src && src.children && src.children.length),
      keyed: { anchor: flags.anchor, position: flags.position, rotation: flags.rotation, scale: flags.scale, any: flags.any, position_times: positionTimes(snapshot, kl) },
      pivot_as_placed: asPlaced(sample && sample.anchor, rect),
      full_frame: ff,
      place_now: readable ? placeNow(sample.anchor, rect) : null,
      check_time: ct,
      flipped: flipped(sample),
      locked: entry.locked === true,
      area: b ? (b.right - b.left) * (b.bottom - b.top) : null,
      _bounds: b,
      _demoted: cls === "shy" || entry.kind === "precomp" || flipped(sample) || turnedFar(sample, flags),
      _tall: !!rect && Math.abs(rect.height) >= 2 * Math.abs(rect.width),
    };
  });
  // Without the comp's size, a layer as big as everything in the comp still ranks last (a
  // tie-break only: the bucket stays as read, full_frame stays null).
  const union = out.filter((c) => c._bounds).reduce((u, c) => (u ? {
    left: Math.min(u.left, c._bounds.left), top: Math.min(u.top, c._bounds.top),
    right: Math.max(u.right, c._bounds.right), bottom: Math.max(u.bottom, c._bounds.bottom),
  } : { ...c._bounds }), null);
  for (const c of out) {
    const coversUnion = !!(union && c._bounds) &&
      c._bounds.right - c._bounds.left >= FULL_FRAME * (union.right - union.left) &&
      c._bounds.bottom - c._bounds.top >= FULL_FRAME * (union.bottom - union.top);
    c._large = c.full_frame === true || (c.full_frame === null && coversUnion && out.filter((x) => x._bounds).length > 1);
  }
  out.filter((c) => c.bucket === "default").sort(rankOrder()).forEach((c, i) => { c.rank = i + 1; });
  // FR-019a: where a pivot outside its layer sits, on screen, at the check time (else null).
  for (const c of out) c.outside_side = c.place_now === "outside" ? outsideSide(snapshot, c.index, c.check_time.time, c.kind) : null;
  for (const c of out) { delete c._bounds; }
  return out;
}

// How animated a layer already is (FR-004, amended 2026-10-26), three steps: 0 no keyed property at
// all, 1 keys but none on Rotation or Scale, 2 Rotation or Scale keys. A ranking step, never a
// filter: a comp where every layer has keys still gets a proposal.
export const animationStep = (c) => (c.keyed.rotation || c.keyed.scale ? 2 : c.keyed.any ? 1 : 0);

// FR-004's ranking, one comparator: a full-frame layer only when nothing else exists (FR-004's last
// resort, so this key comes first); shy, precomp and flipped or turned layers below the rest (TD § 4,
// rows 9, 13, 18); unparented first; how animated it already is (animationStep); the pivot where AE
// put it; then the comp's layer order. A review puts the animation step ahead of all but full-frame
// (R8), so "no Rotation or Scale keys" still comes first there, and no keys at all within that.
export function rankOrder({ review = false } = {}) {
  const keys = [
    (c) => (c._large ? 1 : 0),
    (c) => (c._demoted ? 1 : 0),
    (c) => (c.parent ? 1 : 0),
    animationStep,
    (c) => (c.pivot_as_placed ? 0 : 1),
  ];
  if (review) keys.splice(1, 0, keys.splice(3, 1)[0]);
  return (a, b) => {
    for (const k of keys) { const d = k(a) - k(b); if (d) return d; }
    return a.index - b.index;
  };
}

const publicCandidate = (c) => {
  const { _demoted, _large, _tall, ...rest } = c;
  return rest;
};

// The one layer to offer when the learner has none in mind, with a hinge that suits its shape (H-5):
// tall and thin turns from the middle of its bottom edge, anything else from the middle of its left
// edge. Null when no default candidate is left.
export function proposalFrom(list, { exclude = [], review = false, only = null } = {}) {
  const pool = list.filter((c) => c.bucket === "default" && !isExcluded(c.layer, exclude) && (!only || only.includes(c.layer)));
  const order = rankOrder({ review });
  const best = pool.sort(order)[0];
  if (!best) return null;
  return { layer: best.layer, suggested_place: best._tall ? "bottom-middle" : "middle-left" };
}

// The review's pick (FR-024): default candidates not in the record, no Rotation or Scale keys first,
// and within that no keys at all first.
export function reviewProposal(snapshot, { exclude = [] } = {}) {
  return layerInfo(snapshot).known ? proposalFrom(candidates(snapshot), { exclude, review: true }) : null;
}

export const isExcluded = (layer, exclude) => (exclude || []).some((e) => e && e.layer === layer && e.property === "Anchor Point");

// ---- The samples each read needs (FR-013, research R4)

// Every candidate's (all but the structurally never) rest-key time and Position key times, sorted,
// at most 63, so the lesson's baseline holds every time the check compares on every layer. A layer
// that already moves (position_moves, D-4) is never, so its key times drop out.
export function neededTimes(snapshot) {
  const { known, layers } = layerInfo(snapshot);
  if (!known) return [];
  const times = [];
  for (const entry of layers) {
    const kl = keyedLayer(snapshot, entry.index);
    const flags = keyFlags(kl);
    const [bucket] = structural(snapshot, entry, flags, classOf(snapshot, entry.index), kl);
    if (bucket === "never") continue;
    const rk = restKey(kl);
    if (rk && isNum(rk.time)) times.push(rk.time);
    times.push(...positionKeyTimes(kl));
  }
  return uniqueTimes(times).slice(0, MAX_NEEDED_TIMES);
}

// The times a read lacks: any needed time missing from any layer's samples.
export function missingTimes(snapshot, needed = neededTimes(snapshot)) {
  const { layers } = layerInfo(snapshot);
  return needed.filter((t) => layers.some((l) => !sampleAt(l, t)));
}

// ---- The lesson's focus (FR-005 to FR-009, FR-014, research R5)

const WHY_NOT_TARGET = new Set(["never"]);

function resolveFocus(snapshot, focus) {
  return (focus || []).slice(0, 2).map((f) => {
    const name = f && typeof f.layer === "string" ? f.layer : null;
    const matches = name ? byName(snapshot, name) : [];
    return { entry: f || {}, name, matches };
  });
}

function notesFor(snapshot, c) {
  const notes = [];
  if (c.parent) notes.push({ layer: c.layer, note: "parent", parent: c.parent });
  if (c.kind === "text") notes.push({ layer: c.layer, note: "text_baseline" });
  if (c.flipped) notes.push({ layer: c.layer, note: "flipped" });
  if (c.kind === "precomp") {
    const s = isNum(c.check_time.time) ? sampleAt(byIndex(snapshot, c.index), c.check_time.time) : null;
    const r = rectOf(s, c.kind);
    notes.push({ layer: c.layer, note: "precomp_frame", ...(r ? { width: r3(r.width), height: r3(r.height) } : {}) });
  }
  // A one-key layer (the only Position-keyed layer a lesson reaches, D-4), with its key's time for
  // TD § 4's "put the playhead right on it" line.
  if (c.keyed.position && c.keyed.position_times.length === 1) notes.push({ layer: c.layer, note: "position_keyed_tip", time: c.keyed.position_times[0] });
  if (c.class === "matte") notes.push({ layer: c.layer, note: "matte" });
  if (c.class === "hidden") notes.push({ layer: c.layer, note: "hidden" });
  if (c.class === "shy") notes.push({ layer: c.layer, note: "shy" });
  if (c.locked) notes.push({ layer: c.layer, note: "locked" });
  const entry = byIndex(snapshot, c.index);
  if (masked(entry)) notes.push({ layer: c.layer, note: "masked" });
  if (offScreen(entry, c.check_time.time)) notes.push({ layer: c.layer, note: "not_on_screen" });
  // A focus layer's or the proposal's pivot outside it, with the side it's on as seen on screen
  // (FR-019a; null when it can't be read, and then the mentor names no side).
  if (c.place_now === "outside") notes.push({ layer: c.layer, note: "pivot_outside", side: c.outside_side ?? null });
  return notes;
}

// The watch offer with one focus layer (spec FR-008, TD § 17, B-8): the highest-ranked default
// candidate by the lesson ranking that isn't the focus layer, has a name no other layer shares,
// isn't already at its suggested place (FR-007, or it would set no target), and has no Rotation or
// Scale keys or its rest key within half a frame of the focus's check time (else the demo would
// refuse not_at_rest, or the learner would move the playhead twice). The place is proposalFrom's
// hinge rule. Null when none qualifies. Whether this is a first lesson is the prompt's (the record).
export function watchOffer(snapshot, list, focusLayer, focusTime, { exclude = [] } = {}) {
  const tol = halfFrame(snapshot);
  const skip = [...exclude, { layer: focusLayer, property: "Anchor Point" }];
  for (;;) {
    const offer = proposalFrom(list, { exclude: skip });
    if (!offer) return null;
    skip.push({ layer: offer.layer, property: "Anchor Point" });
    if (byName(snapshot, offer.layer).length !== 1) continue;
    const c = list.find((x) => x.layer === offer.layer);
    const t = c.check_time.time;
    if (c.keyed.rotation || c.keyed.scale) {
      if (!isNum(t) || !isNum(focusTime) || Math.abs(t - focusTime) > tol) continue;
    }
    const sample = isNum(t) ? sampleAt(byIndex(snapshot, c.index), t) : null;
    const rect = rectOf(sample, c.kind);
    if (!sample || !rect || !pair(sample.anchor)) continue;
    if (inPlace(sample.anchor, rect, offer.suggested_place)) continue;
    return offer;
  }
}

// The analyzer session.start() calls (spec 004 contract › 4). `skill_options.focus`: one or two
// { layer, place, rest_time? }, entry 0 the learner's layer, entry 1 the one they care less about.
export function analyze(snapshot, { focus_layers, exclude = [], skill_options = {} } = {}) {
  const info = layerInfo(snapshot);
  const empty = {
    known: info.known, candidates: [], proposal: null, focus: null, places: {}, check_times: {},
    already_there: [], targets: [], target_refs: [], demo_target: null,
    no_demo_reason: info.known ? "awaiting_focus" : "no_layer_info", needed_times: [], notes: [], focus_problems: [],
    watch_offer: null,
  };
  if (!info.known) return empty;

  if (Array.isArray(focus_layers)) {
    const missing = focus_layers.filter((n) => byName(snapshot, n).length === 0);
    if (missing.length) throw new MentorError("UNKNOWN_LAYER", `${missing.join(", ")} isn't in the comp. Use the layer's name exactly as it appears in the comp.`);
  }
  const focus = Array.isArray(skill_options && skill_options.focus) ? skill_options.focus : null;
  const unknown = (focus || []).filter((f) => f && typeof f.layer === "string" && byName(snapshot, f.layer).length === 0).map((f) => f.layer);
  if (unknown.length) throw new MentorError("UNKNOWN_LAYER", `${unknown.join(", ")} isn't in the comp. Use the layer's name exactly as it appears in the comp.`);

  const rest_times = {};
  for (const f of focus || []) if (f && typeof f.layer === "string" && f.rest_time !== undefined) rest_times[f.layer] = f.rest_time;
  const list = candidates(snapshot, { rest_times });
  const only = Array.isArray(focus_layers) ? focus_layers : null;
  const proposal = proposalFrom(list, { exclude, only });

  const result = {
    ...empty,
    candidates: list,
    proposal,
    needed_times: neededTimes(snapshot),
    notes: [],
  };

  if (!focus || !focus.length) {
    if (proposal) result.notes = notesFor(snapshot, list.find((c) => c.layer === proposal.layer));
    result.candidates = list.map(publicCandidate);
    return result;
  }

  const resolved = resolveFocus(snapshot, focus);
  const names = [];
  const targetEntries = [];
  for (const { entry, name, matches } of resolved) {
    if (!name) { result.focus_problems.push({ layer: null, problem: "no_layer" }); continue; }
    names.push(name);
    if (matches.length > 1) { result.focus_problems.push({ layer: name, problem: "name_not_unique" }); continue; }
    const c = list.find((x) => x.index === matches[0].index);
    if (!isPlace(entry.place)) { result.focus_problems.push({ layer: name, problem: "no_place" }); continue; }
    if (WHY_NOT_TARGET.has(c.bucket)) { result.focus_problems.push({ layer: name, problem: "not_a_candidate", reason: c.reason, ...movesFields(c) }); continue; }
    if (isExcluded(name, exclude)) { result.focus_problems.push({ layer: name, problem: "past_target" }); continue; }
    if (entry.rest_time !== undefined && c.check_time.rest_time_not_a_key) result.rest_time_not_a_key = [...(result.rest_time_not_a_key || []), name];
    const sample = sampleAt(byIndex(snapshot, c.index), c.check_time.time);
    const rect = rectOf(sample, c.kind);
    result.places[name] = { place: entry.place, point: placePoint(rect, entry.place) };
    result.check_times[name] = { time: c.check_time.time, basis: c.check_time.basis };
    result.notes.push(...notesFor(snapshot, c));
    if (inPlace(sample.anchor, rect, entry.place)) {
      result.already_there.push({ layer: name, place: entry.place });
      continue;
    }
    targetEntries.push(c);
  }
  result.focus = names.length ? names : null;
  result.targets = targetEntries.map((c) => `anchor/${c.index}`);
  result.target_refs = targetEntries.map((c) => ({ layer: c.layer, property: "Anchor Point" }));

  // FR-014: entry 1 (the one they care less about) if it's a default candidate, else entry 0, else none.
  const isDefault = (c) => c && c.bucket === "default";
  const ordered = [targetEntries.find((c) => c.layer === names[1]), targetEntries.find((c) => c.layer === names[0])];
  const demo = ordered.find(isDefault) || null;
  result.demo_target = demo ? `anchor/${demo.index}` : null;
  result.no_demo_reason = demo ? null : targetEntries.length ? "not_a_default_candidate" : "awaiting_focus";
  // One focus layer that is a target: the watch offer (FR-008). Two focus layers, or one that's
  // already there or refused: none.
  if (focus.length === 1 && targetEntries.length === 1) {
    const f = targetEntries[0];
    result.watch_offer = watchOffer(snapshot, list, f.layer, f.check_time.time, { exclude });
  }
  result.candidates = list.map(publicCandidate);
  return result;
}

// FINDERS["transform.anchor"].focus (FR-003): default candidates not among `exclude`.
export function finder(snapshot, { exclude = [] } = {}) {
  if (!layerInfo(snapshot).known) return { count: 0, layers: [] };
  const layers = candidates(snapshot).filter((c) => c.bucket === "default" && !isExcluded(c.layer, exclude)).map((c) => c.layer);
  return { count: layers.length, layers };
}

// ---- The demo (FR-015, research R6)

// New anchor A′ = the place's point; new Position P′ = P + L·(A′ − A), where L is the layer's own
// rotation and scale (layerMatrix's linear part). The layer's matrix is T(P)·R·S·T(−A), so every
// point of the layer stays where it was, through any parent chain. No inversion, so a Scale 0 axis
// can't make it singular.
export function demoValues(sample, rect, place) {
  const m = layerMatrix(sample || {});
  if (!m || !rect) return null;
  const [a, b, c, d] = m;
  const A = pair(sample.anchor);
  const P = pair(sample.position);
  const A2 = placePoint(rect, place);
  const dx = A2[0] - A[0];
  const dy = A2[1] - A[1];
  return { anchor: A2, position: [r3(P[0] + a * dx + c * dy), r3(P[1] + b * dx + d * dy)] };
}

export const REFUSED_MESSAGE = "I can't move that pivot without changing something I shouldn't, so I've left it as it was.";
registerErrors({ ANCHOR_REFUSED: REFUSED_MESSAGE });

const REFUSAL_TEXT = {
  locked: "That layer is locked.",
  three_d: "That layer is 3D.",
  collapsed: "That precomp passes its layers through.",
  anchor_or_position_keyed: "Its Anchor Point or Position has keys.",
  expression: "An expression drives its Anchor Point or Position.",
  not_at_rest: "The playhead isn't on its rest key.",
  not_found: "That layer isn't in the comp now.",
  cant_read: "I can't read that layer right now.",
};
export const REFUSAL_REASONS = Object.keys(REFUSAL_TEXT);

export function refused(reason) {
  const e = new MentorError("ANCHOR_REFUSED", `${REFUSED_MESSAGE} ${REFUSAL_TEXT[reason] || ""}`.trim());
  e.reason = reason;
  return e;
}

// Why the demo can't run on `entry` in `snapshot`, from what the read shows, or null. `rest_time`
// (the lesson's rest key, or null) gives not_at_rest when the playhead is more than half a frame off.
export function demoRefusal(snapshot, entry, { rest_time = null } = {}) {
  if (!entry) return "not_found";
  if (entry.locked === true) return "locked";
  if (entry.three_d === true) return "three_d";
  if (entry.kind === "precomp" && entry.collapse === true) return "collapsed";
  const kl = keyedLayer(snapshot, entry.index);
  const flags = keyFlags(kl);
  if (flags.anchor || flags.position) return flags.expression_anchor_position ? "expression" : "anchor_or_position_keyed";
  if (isNum(rest_time)) {
    const fps = snapshot.comp && snapshot.comp.frame_rate;
    const t = snapshot.comp && snapshot.comp.time;
    if (!isNum(t) || !isNum(fps) || Math.abs(t - rest_time) > 0.5 / fps + 1e-6) return "not_at_rest";
  }
  return null;
}
