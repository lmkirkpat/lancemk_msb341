// Skill 6's check (spec 012 FR-007, FR-009 to FR-021; research R5, R6, R8): find and store the
// lesson's null, grade N1 to N3 and P1 to P5, and list comments and other changes. Pure, no AE
// calls. The tools in mentor/tools/null-parenting.mjs wire it to the session.
//
// Rules this file keeps:
// - Layers are matched by name, never by index (adding a null renumbers them; filter 3).
// - P2 compares comp-space corners from comp-space.mjs, through the null as stored at the
//   before-read time (`parent_transform`), never the null's current transform (FR-012). Raw key
//   values are never compared (B9).
// - Anything the math can't compute (every comp-space `reason`) is "couldn't check" and holds the
//   pass. It never counts as "didn't move".
// - Tolerances are this skill's: 1 px per corner, half a frame for key times, 10% of the group's
//   width and height for the region.

import { MentorError, registerErrors } from "../errors.mjs";
import { byIndex, byName, layerInfo } from "./layer-info.mjs";
import { compPosition, footprint, sampleAt, toLayerSpace } from "./comp-space.mjs";
import { sourcesOf } from "./motion-sources.mjs";
import { classOf } from "./visibility.mjs";
import { FOOTPRINT_PATHS, keyedLayer, p2Times, uniqueLayer } from "./null-parenting.mjs";

export const JUMP_PX = 1; // FR-011: never said to the learner as a target
const REGION_SHARE = 0.1; // FR-028's per-axis rule, on the group's combined bounds

const TF = "ADBE Transform Group/";
const POSITION_PATHS = new Set(["ADBE Position", "ADBE Position_0", "ADBE Position_1"].map((p) => TF + p));
const SCALE = TF + "ADBE Scale";
const ROTATION = TF + "ADBE Rotate Z";
const ANCHOR = TF + "ADBE Anchor Point";
const OPACITY = TF + "ADBE Opacity";
const MOVE_PATHS = new Set([...POSITION_PATHS, SCALE, ROTATION]);
const EFFECTS = "ADBE Effect Parade/";

export const REGIONS = ["top-left", "top-middle", "top-right", "middle-left", "center", "middle-right", "bottom-left", "bottom-middle", "bottom-right"];
const DEFAULT_NULL_NAME = /^Null \d+$/;

const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const r3 = (t) => Math.round(t * 1000) / 1000 + 0;
const pair = (v) => (Array.isArray(v) ? [v[0], v[1]] : null);
const parentOf = (snap, index) => {
  const src = sourcesOf(snap, index);
  return src && Array.isArray(src.parents) && src.parents.length ? src.parents[0] : null;
};
const props = (snap, index) => {
  const k = keyedLayer(snap, index);
  return k ? k.properties : [];
};
// OA-14: a parent with no keys can still move (an expression on an unkeyed property, which the
// reads don't reach yet), so its own samples differing across the times read count as moving.
const SAMPLED = ["anchor", "position", "scale", "rotation"];
const valuesDiffer = (a, b) => (Array.isArray(a) && Array.isArray(b)
  ? a.some((v, i) => typeof v === "number" && typeof b[i] === "number" && Math.abs(v - b[i]) > 0.01)
  : typeof a === "number" && typeof b === "number" && Math.abs(a - b) > 0.01);
function samplesMove(snap, index) {
  const e = byIndex(snap, index);
  const ss = e && Array.isArray(e.samples) ? e.samples : [];
  return ss.some((x) => SAMPLED.some((k) => valuesDiffer(ss[0][k], x[k])));
}
const parentMoves = (snap) => (p) => p.moves_children || samplesMove(snap, p.layer_index);
const distinctValues = (p) => new Set(p.keys.map((k) => JSON.stringify(k.value))).size >= 2;

// ---- Finding the lesson's null (FR-007, FR-019, research R5)

// { name, index, found, name_unique, renamed_from, which_null, existing_null, named }
export function findNull(baseline, current, skillData = {}, { null: asked, focus = [] } = {}) {
  const stored = skillData && skillData.null && skillData.null.name;
  const name = asked || stored || null;
  const existing = (n) => {
    const b = byName(baseline, n);
    if (b.length !== 1) return false;
    const src = sourcesOf(baseline, b[0].index);
    return !!((src && src.children && src.children.length) || props(baseline, b[0].index).some((p) => p.keys.length));
  };
  if (name) {
    const all = byName(current, name);
    if (all.length > 1) return { name, index: null, found: true, name_unique: false };
    if (all.length === 1) return { name, index: all[0].index, found: true, name_unique: true, existing_null: existing(name) };
    if (!asked) {
      // Renamed (Edge Cases): exactly one null is the parent of every parented focus layer.
      const parents = focus.map((n) => uniqueLayer(current, n)).filter(Boolean).map((l) => parentOf(current, l.index)).filter(Boolean);
      const idx = new Set(parents.map((p) => p.layer_index));
      if (parents.length && idx.size === 1) {
        const p = parents[0];
        if (p.class === "null" && byName(current, p.layer).length === 1) {
          return { name: p.layer, index: p.layer_index, found: true, name_unique: true, renamed_from: name };
        }
      }
    }
    return { name, index: null, found: false, name_unique: true, named: !!asked };
  }
  // No name yet: the one null whose name is new since the before read.
  const nulls = layerInfo(current).layers.filter((l) => classOf(current, l.index) === "null");
  const fresh = [...new Set(nulls.map((l) => l.name).filter((n) => byName(current, n).length > byName(baseline, n).length))];
  if (fresh.length === 1) {
    const n = fresh[0];
    const all = byName(current, n);
    return all.length === 1
      ? { name: n, index: all[0].index, found: true, name_unique: true }
      : { name: n, index: null, found: true, name_unique: false };
  }
  return { name: null, index: null, found: false, name_unique: true, which_null: fresh.length > 1 ? fresh : null };
}

// The null's own sampled transform at the before-read time, or null when it wasn't sampled there.
export function storeNull(current, nullIndex, beforeTime, from = "check") {
  const s = sampleAt(byIndex(current, nullIndex), beforeTime);
  if (!s) return null;
  const anchor = pair(s.anchor);
  const position = pair(s.position);
  const scale = pair(s.scale);
  if (!anchor || !position || !scale || typeof s.rotation !== "number") return null;
  return { anchor, position, scale, rotation: s.rotation, time: r3(beforeTime), from };
}

// ---- P2 for one layer (FR-011, FR-012)

function direction(dx, dy) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const h = ax >= 0.5 && ax >= ay / 3 ? (dx < 0 ? "left" : "right") : null;
  const v = ay >= 0.5 && ay >= ax / 3 ? (dy < 0 ? "up" : "down") : null;
  return h && v ? `${v} and ${h}` : h || v;
}

// The layer's four corners at each of its P2 times, now (through `stored` when its parent is the
// lesson's null) against the before read. { passed, worst_px, direction, time, not_checked }.
export function p2For(baseline, current, name, { throughNull = false, stored = null, times: only = null } = {}) {
  const b = uniqueLayer(baseline, name);
  const c = uniqueLayer(current, name);
  const times = only || p2Times(baseline, name);
  const not_checked = [];
  let worst = { px: 0, dx: 0, dy: 0, time: null };
  for (const t of times) {
    if (!b || !c) {
      not_checked.push({ time: t, reason: "no_layer" });
      continue;
    }
    if (throughNull && !stored) {
      not_checked.push({ time: t, reason: "not_stored" });
      continue;
    }
    const before = footprint(baseline, b.index, t);
    const after = footprint(current, c.index, t, throughNull ? { parent_transform: stored } : {});
    if (before.reason || after.reason) {
      not_checked.push({ time: t, reason: before.reason || after.reason });
      continue;
    }
    for (let k = 0; k < 4; k++) {
      const dx = after.corners[k][0] - before.corners[k][0];
      const dy = after.corners[k][1] - before.corners[k][1];
      const px = Math.hypot(dx, dy);
      if (px > worst.px) worst = { px, dx, dy, time: t };
    }
  }
  const moved = worst.px > JUMP_PX;
  return {
    passed: !not_checked.length && !moved,
    worst_px: moved ? Math.round(worst.px) : 0,
    direction: moved ? direction(worst.dx, worst.dy) : null,
    time: moved ? r3(worst.time) : null,
    not_checked,
  };
}

// ---- P3 (FR-013)

function keyTimes(list, path) {
  const p = list.find((x) => x.path === path);
  return p ? p.keys.map((k) => k.time) : [];
}

// Key counts and times on every keyed property, within half a frame. Raw values never compared.
export function p3For(baseline, current, name) {
  const b = uniqueLayer(baseline, name);
  const c = uniqueLayer(current, name);
  const bp = b ? props(baseline, b.index) : [];
  const cp = c ? props(current, c.index) : [];
  const half = 0.5 / (baseline.comp.frame_rate || 30);
  const changed = [];
  for (const path of [...new Set([...bp, ...cp].map((p) => p.path))]) {
    const bt = keyTimes(bp, path);
    const ct = keyTimes(cp, path);
    const same = bt.length === ct.length && bt.every((t, i) => Math.abs(t - ct[i]) <= half + 1e-9);
    if (!same) changed.push({ property: (cp.find((p) => p.path === path) || bp.find((p) => p.path === path)).display_name, before: bt.length, now: ct.length });
  }
  return { passed: !changed.length, changed };
}

// ---- N3 (FR-009, S-5)

function unionBounds(list) {
  return list.reduce((u, b) => (u ? { left: Math.min(u.left, b.left), top: Math.min(u.top, b.top), right: Math.max(u.right, b.right), bottom: Math.max(u.bottom, b.bottom) } : { ...b }), null);
}

function regionPoint(g, code) {
  const [ys, xs] = code === "center" ? ["middle", "middle"] : code.split("-");
  const x = { left: g.left, middle: (g.left + g.right) / 2, right: g.right }[xs];
  const y = { top: g.top, middle: (g.top + g.bottom) / 2, bottom: g.bottom }[ys];
  return [x, y];
}

// Where the null's pivot is against the group's combined bounds in the before read.
export function regionOf(point, g) {
  const tx = Math.max(REGION_SHARE * (g.right - g.left), 1);
  const ty = Math.max(REGION_SHARE * (g.bottom - g.top), 1);
  const inside = (code) => {
    const [x, y] = regionPoint(g, code);
    return Math.abs(point[0] - x) <= tx && Math.abs(point[1] - y) <= ty;
  };
  const hit = REGIONS.find(inside);
  if (hit) return hit;
  const out = point[0] < g.left - tx || point[0] > g.right + tx || point[1] < g.top - ty || point[1] > g.bottom + ty;
  return out ? "outside" : "between";
}

function n3For(baseline, current, focus, nullIndex, region) {
  if (!region || region === "slides_only") return null;
  const t0 = baseline.comp.time;
  const bounds = focus.map((n) => uniqueLayer(baseline, n)).map((l) => (l ? footprint(baseline, l.index, t0).bounds : null));
  const pos = compPosition(current, nullIndex, t0);
  if (bounds.some((b) => !b) || !pos.position) return { applies: true, passed: false, cant_check: true, region_now: null, wanted: region };
  const now = regionOf(pos.position, unionBounds(bounds));
  return { applies: true, passed: now === region, cant_check: false, region_now: now, wanted: region };
}

// ---- P4 and P5 (FR-015, FR-016)

function p4For(current, nullIndex) {
  const list = props(current, nullIndex);
  const moving = list.filter((p) => MOVE_PATHS.has(p.path) && p.keys.length >= 2 && distinctValues(p));
  const anchorMoves = list.some((p) => p.path === ANCHOR && p.keys.length >= 2 && distinctValues(p));
  const opacityMoves = list.some((p) => p.path === OPACITY && p.keys.length >= 1);
  const effectKeys = list.some((p) => p.path.startsWith(EFFECTS) && p.keys.length >= 1);
  const oneKey = list.some((p) => MOVE_PATHS.has(p.path) && p.keys.length >= 1);
  let why = null;
  if (!moving.length) why = anchorMoves ? "anchor_only" : opacityMoves ? "opacity_move" : effectKeys ? "effect_move" : oneKey ? "one_key" : "no_move";
  const turnsOrScales = moving.some((p) => p.path === SCALE || p.path === ROTATION);
  return {
    p4: { passed: moving.length > 0, on: [...new Set(moving.map((p) => (POSITION_PATHS.has(p.path) ? "Position" : p.display_name)))], anchor_only: why === "anchor_only" },
    why, turnsOrScales, moving,
  };
}

// ---- Comments (FR-020, research R8), never graded

// A layer's opacity is untouched: no Opacity keys and at 100.
function fullOpacity(snap, name) {
  const l = uniqueLayer(snap, name);
  if (!l) return false;
  return !props(snap, l.index).some((p) => p.path === OPACITY && p.keys.length) && !(l.transform && typeof l.transform.opacity === "number" && l.transform.opacity < 100);
}

function comments(baseline, current, focus, nul, moving, { explaining = null } = {}) {
  const out = [];
  const info = byIndex(current, nul.index);
  const list = props(current, nul.index);
  const moveKeys = moving.flatMap((p) => p.keys);
  if (moveKeys.length && moveKeys.every((k) => k.in_type === "linear" && k.out_type === "linear")) out.push({ code: "linear", null: nul.name });
  if (moveKeys.some((k) => k.in_type === "hold" || k.out_type === "hold")) out.push({ code: "held", null: nul.name });
  if (moveKeys.length) {
    const nt = moveKeys.map((k) => k.time);
    const [n0, n1] = [Math.min(...nt), Math.max(...nt)];
    for (const name of focus) {
      const l = uniqueLayer(current, name);
      const own = l ? props(current, l.index).filter((p) => MOVE_PATHS.has(p.path) && p.keys.length >= 2).flatMap((p) => p.keys.map((k) => k.time)) : [];
      if (!own.length) continue;
      const from = Math.max(n0, Math.min(...own));
      const to = Math.min(n1, Math.max(...own));
      if (from < to) out.push({ code: "stacked", layer: name, from: r3(from), to: r3(to) });
    }
  }
  if (DEFAULT_NULL_NAME.test(nul.name)) out.push({ code: "default_name", null: nul.name });
  const scaleProp = list.find((p) => p.path === SCALE);
  const scales = [...(scaleProp ? scaleProp.keys.map((k) => ({ v: k.value, time: k.time })) : []), ...(info && info.transform ? [{ v: info.transform.scale, time: null }] : [])]
    .filter((s) => Array.isArray(s.v));
  if (scales.some((s) => Math.abs(s.v[0] - s.v[1]) > 0.001)) out.push({ code: "non_uniform_scale", null: nul.name });
  const zero = scaleProp ? scaleProp.keys.find((k) => Array.isArray(k.value) && (k.value[0] === 0 || k.value[1] === 0)) : null;
  if (zero) out.push({ code: "zero_scale_at_key", null: nul.name, time: r3(zero.time) });
  // FR-020: the null's opacity keyed or below 100 while a child's isn't. AE 26.5 makes every new
  // null at Opacity 0 (spec 012 L-1; older versions at 100), so on a null a static 0 is AE's
  // default, not a fade: only a value between 0 and 100 counts there.
  const op = info && info.transform ? info.transform.opacity : null;
  const staticFade = typeof op === "number" && op < 100 && !(info.is_null === true && op <= 0);
  const nullFades = list.some((p) => p.path === OPACITY && p.keys.length) || staticFade;
  if (nullFades && focus.some((n) => fullOpacity(current, n))) {
    out.push({ code: "opacity", null: nul.name });
  }
  if ((info && info.effect_count > 0) || list.some((p) => p.path.startsWith(EFFECTS) && p.keys.length)) out.push({ code: "effect", null: nul.name });
  if (!explaining) return out;
  // Before a pass, only the ones that explain the failure.
  return out.filter((c) => explaining.includes(c.code));
}

// ---- Other changes (FR-021), from every layer, not the focus filter

function nameCounts(snap) {
  const m = new Map();
  for (const l of layerInfo(snap).layers) m.set(l.name, (m.get(l.name) || 0) + 1);
  return m;
}

const SAMPLED_NAMES = { anchor: "Anchor Point", position: "Position", scale: "Scale", rotation: "Rotation" };

// The transform values that differ between the two reads at the before-read time; Opacity only when
// both reads are at that time (it isn't sampled at other times). Nothing when either isn't sampled.
function valuesChanged(baseline, b, current, c) {
  const t0 = baseline.comp.time;
  const bs = sampleAt(b, t0);
  const cs = sampleAt(c, t0);
  if (!bs || !cs) return [];
  const out = SAMPLED.filter((k) => valuesDiffer(bs[k], cs[k])).map((k) => SAMPLED_NAMES[k]);
  const sameTime = current.comp && typeof current.comp.time === "number" && Math.abs(current.comp.time - t0) < 0.0005;
  if (sameTime && b.transform && c.transform && valuesDiffer(b.transform.opacity, c.transform.opacity)) out.push("Opacity");
  return out;
}

function otherChanges(baseline, current, focus, nullName, alreadyNamed = []) {
  const out = [];
  const bc = nameCounts(baseline);
  const cc = nameCounts(current);
  for (const [n, k] of cc) if (k > (bc.get(n) || 0) && n !== nullName) out.push({ kind: "layer_added", layer: n });
  for (const [n, k] of bc) if (k > (cc.get(n) || 0) && !focus.includes(n)) out.push({ kind: "layer_removed", layer: n });
  for (const [n, k] of bc) {
    if (k !== 1 || cc.get(n) !== 1 || n === nullName) continue;
    const b = uniqueLayer(baseline, n);
    const c = uniqueLayer(current, n);
    const inFocus = focus.includes(n);
    if (!inFocus) {
      const bp = parentOf(baseline, b.index);
      const cp = parentOf(current, c.index);
      const from = bp ? bp.layer : null;
      const to = cp ? cp.layer : null;
      if (from !== to) out.push(to && to === nullName ? { kind: "parented_to_null", layer: n } : { kind: "parent_changed", layer: n, from, to });
      const p3 = p3For(baseline, current, n);
      if (!p3.passed) out.push({ kind: "keys_changed", layer: n, properties: p3.changed.map((x) => x.property) });
      // OA-4: what it renders at the before-read time changed with no key or parent change (an
      // expression on a property with no keys, say). Reported only, never graded (FR-021).
      if (from === to && p3.passed) {
        const changed = valuesChanged(baseline, b, current, c);
        if (changed.length) out.push({ kind: "value_changed", layer: n, properties: changed });
      }
    }
    // Expressions on keyed properties: a focus layer's Position belongs to the pick-whip hint.
    const bp = props(baseline, b.index);
    for (const p of props(current, c.index)) {
      if (inFocus && POSITION_PATHS.has(p.path)) continue;
      const was = bp.find((x) => x.path === p.path);
      if (was && !!was.expression_enabled !== !!p.expression_enabled) out.push({ kind: "expression_toggled", layer: n, property: p.display_name, on: !!p.expression_enabled });
    }
  }
  for (const n of focus) {
    if (alreadyNamed.includes(n)) continue;
    const c = uniqueLayer(current, n);
    const src = c ? sourcesOf(current, c.index) : null;
    const kids = src && src.children ? src.children.map((x) => x.layer).filter((x) => !focus.includes(x) && x !== nullName) : [];
    if (kids.length) out.push({ kind: "children_brought", layer: n, children: kids });
  }
  return out;
}

// ---- The check (data-model › Check result)

// `lesson` is the session's lesson (baseline, focus, skill_data, demo, mode); `input` the
// learner's answers (null, region, chain_on_purpose). Returns { result, skill_data }: what to
// store with setSkillData (null when nothing may be stored), and the reply.
export function check(baseline, current, lesson, input = {}) {
  const focus = lesson.focus || [];
  const t0 = baseline.comp.time;
  const sd = clone(lesson.skill_data) || {};
  sd.null = { ...(sd.null || {}) };
  if (input.region) sd.null.region = input.region;

  const hints = [];
  const add = (code, extra = {}) => hints.push({ code, ...extra });
  const finish = (r, data = sd) => {
    const codes = [...new Set(r.hints.map((h) => h.code))];
    return { result: { ...r, codes }, skill_data: data };
  };

  const comp_matches = !!(current.comp && current.comp.id === baseline.comp.id && (baseline.project === undefined || current.project === baseline.project));
  const base = { comp_matches, lesson_comp: baseline.comp.name, before_time: r3(t0), stage: "parenting", parenting_passed: false, passed: false, graded: true };
  if (!comp_matches) return { result: { ...base, graded: false, codes: ["other_comp"], hints: [{ code: "other_comp", comp: baseline.comp.name }], null: null, layers: [], comments: [], other_changes: [] }, skill_data: null };
  if (!layerInfo(current).known) {
    return finish({ ...base, graded: false, hints: [{ code: "cant_check", what: "comp" }], null: null, layers: [], comments: [], other_changes: [] }, null);
  }

  // The null.
  const nul = findNull(baseline, current, sd, { null: input.null, focus });
  const nullOut = { name: nul.name, found: nul.found, name_unique: nul.name_unique, n1: null, n2: null, n3: null, p4: null, p5: null, moves: [], renamed_from: nul.renamed_from || null, which_null: nul.which_null || null, stored_now: false };
  if (nul.found && !nul.name_unique) {
    // D-3: ask for the rename; nothing stored, nothing else graded on the null, no P1 to P3.
    add("null_name_not_unique", { null: nul.name });
    return finish({ ...base, hints, null: nullOut, layers: [], comments: [], other_changes: [] });
  }
  let nullOk = false;
  if (nul.found) {
    const info = byIndex(current, nul.index);
    nullOut.n1 = classOf(current, nul.index) === "null";
    if (!nullOut.n1) add("not_a_null", { null: nul.name });
    const chain = (sourcesOf(current, nul.index) || {}).parents || [];
    const before = uniqueLayer(baseline, nul.name);
    const chainBefore = before ? (sourcesOf(baseline, before.index) || {}).parents || [] : [];
    if (info.three_d) {
      nullOut.n2 = false;
      add("three_d", { null: nul.name });
    } else if (chain.length) {
      if (chain.some(parentMoves(current)) || chainBefore.some(parentMoves(baseline))) {
        // FR-009: out of the lesson. Nothing graded, nothing recorded as a miss, no markChecked.
        nullOut.n2 = "moves";
        add("null_parent_moves", { null: nul.name, parent: chain[0].layer });
        return finish({ ...base, graded: false, hints, null: nullOut, layers: [], comments: [], other_changes: [] });
      }
      // "On purpose" counts only as an answer to the hint about this same parent (S-6): taken
      // when an earlier check asked about it, and only while the null still follows it.
      const parentName = chain[0].layer;
      if (input.chain_on_purpose === true && sd.null.parent_asked === parentName) sd.null.chain_on_purpose = parentName;
      if (sd.null.chain_on_purpose === parentName) {
        nullOut.n2 = true;
        if (!sd.null.one_level_said) {
          add("one_level_only", { null: nul.name, parent: chain[0].layer });
          sd.null.one_level_said = true;
        }
      } else {
        nullOut.n2 = false;
        sd.null.parent_asked = parentName;
        add("null_has_parent", { null: nul.name, parent: parentName });
      }
    } else {
      nullOut.n2 = true;
    }
    if (nul.renamed_from) add("null_renamed", { from: nul.renamed_from, to: nul.name });
    if (nul.existing_null && !sd.null.existing_said) {
      add("existing_null", { null: nul.name });
      sd.null.existing_said = true;
    }
    nullOk = nullOut.n1 && nullOut.n2 === true;
    if (nullOk) sd.null.name = nul.name;
  } else if (nul.which_null) {
    add("which_null", { nulls: nul.which_null });
  } else {
    add("no_null", nul.named ? { named: nul.name } : {});
  }

  // Each focus layer's parent now, by name.
  const found = focus.map((name) => ({ name, c: uniqueLayer(current, name) }));
  const parentOfName = new Map(found.map(({ name, c }) => [name, c ? parentOf(current, c.index) : null]));
  const toNull = (name) => {
    const p = parentOfName.get(name);
    return !!(nul.found && nul.index != null && p && p.layer_index === nul.index);
  };
  const parentedNow = focus.some(toNull);

  // The stored null (FR-012, D-1): re-stored while nothing is parented to it; once something is,
  // never again. With nothing stored yet (a review, or parenting before any check), the first
  // check that sees the null stores it at the before-read time.
  if (nullOk) {
    if ((!sd.parented_seen && !parentedNow) || !sd.stored) {
      const s = storeNull(current, nul.index, t0, "check");
      if (s) {
        sd.stored = s;
        nullOut.stored_now = true;
      }
    }
    if (parentedNow) sd.parented_seen = true;
  }
  nullOut.n3 = nul.found && nul.index != null ? n3For(baseline, current, focus, nul.index, sd.null.region) : null;
  if (nullOut.n3 && nullOut.n3.cant_check) add("cant_check", { what: "null", null: nul.name });
  else if (nullOut.n3 && !nullOut.n3.passed) add("pivot_region", { null: nul.name, region_now: nullOut.n3.region_now, wanted: nullOut.n3.wanted });
  const n3ok = !nullOut.n3 || nullOut.n3.passed;

  // P1 to P3 per focus layer.
  const demoLayer = lesson.demo && typeof lesson.demo.segment_id === "string" ? lesson.demo.segment_id.replace(/^parent\//, "") : null;
  let demoUndone = false;
  const nullPos = nul.found && nul.index != null ? compPosition(current, nul.index, t0).position : null;
  const layers = found.map(({ name, c }) => {
    if (!c) {
      // OA-16, D-3 for a focus layer: two layers share its name now, so ask for the rename and
      // grade nothing on it.
      if (byName(current, name).length > 1) {
        add("focus_name_not_unique", { layer: name });
        return { layer: name, found: true, name_unique: false };
      }
      add("not_found", { layer: name });
      return { layer: name, found: false };
    }
    const parent = parentOfName.get(name);
    const p1 = toNull(name);
    const p2 = p2For(baseline, current, name, { throughNull: p1, stored: sd.stored || null });
    const p3 = p3For(baseline, current, name);
    let credit = "learner";
    if (demoLayer === name && lesson.demo) {
      if (!p1) demoUndone = true;
      else if (!lesson.demo.undone) credit = "demo";
    }
    let pickwhip = false;
    if (!parent) {
      const b = uniqueLayer(baseline, name);
      const exprNow = props(current, c.index).some((p) => POSITION_PATHS.has(p.path) && p.expression_enabled);
      const exprBefore = b ? props(baseline, b.index).some((p) => POSITION_PATHS.has(p.path) && p.expression_enabled) : false;
      const at = compPosition(current, c.index, t0).position;
      const onNull = !!(nullPos && at && Math.hypot(at[0] - nullPos[0], at[1] - nullPos[1]) <= JUMP_PX);
      pickwhip = !!nul.found && ((exprNow && !exprBefore) || (onNull && !p2.passed));
      if (pickwhip) add("pickwhip_position", { layer: name, null: nul.name });
      else if (parentedNow) add("not_parented", { layer: name });
    } else if (!p1) {
      if (parent.class === "null") add("wrong_parent", { layer: name, parent: parent.layer });
      else add("visible_parent", { layer: name, parent: parent.layer });
    }
    // A visible or other parent that moves explains the offset: its hint says so, not a jump's.
    // Only when the layer was where it was at the before-read time; an offset there is a real jump.
    const draggedByParent = !!(parent && !p1 && parent.moves_children && p2For(baseline, current, name, { times: [t0] }).passed);
    if (p2.worst_px > JUMP_PX && !pickwhip && !draggedByParent) add("jumped", { layer: name, px: p2.worst_px, direction: p2.direction, time: p2.time });
    if (p2.not_checked.length) add("cant_check", { layer: name, times: [...new Set(p2.not_checked.map((n) => n.time))] });
    if (!p3.passed) add("own_keys_changed", { layer: name, properties: p3.changed });
    const expression_on_move = props(current, c.index).some((p) => MOVE_PATHS.has(p.path) && p.keys.length && p.expression_enabled);
    return { layer: name, found: true, credit, parent: parent ? parent.layer : null, expression_on_move, p1, p2: { passed: p2.passed, worst_px: p2.worst_px, direction: p2.direction, time: p2.time }, not_checked: p2.not_checked.map((n) => n.time), p3 };
  });

  const layersOk = layers.length > 0 && layers.every((l) => l.found && l.p1 && l.p2.passed && l.p3.passed);
  const parenting_passed = !!(nullOk && n3ok && layersOk);
  // Ready only once the null is stored; a null that couldn't be read at the before-read time is
  // "couldn't check", never fine.
  if (nullOk && !sd.stored) add("cant_check", { what: "null", null: nul.name });
  else if (nullOk && n3ok && !parentedNow && focus.every((n) => !parentOfName.get(n)) && !hints.some((h) => h.code === "pickwhip_position")) add("null_ready", { null: nul.name });

  // P4 and P5, only once the parenting has passed (FR-014).
  let passed = false;
  let moving = [];
  let p4fail = null;
  if (parenting_passed) {
    const m = p4For(current, nul.index);
    moving = m.moving;
    nullOut.p4 = m.p4;
    nullOut.moves = m.p4.on;
    if (m.why) {
      p4fail = m.why;
      add(m.why, { null: nul.name });
    }
    if (m.turnsOrScales) {
      const region = sd.null.region;
      if (!region || region === "slides_only") {
        nullOut.p5 = { passed: false, region_needed: true };
        add("region_needed", { null: nul.name });
      } else {
        nullOut.p5 = { passed: n3ok, region_needed: false };
      }
    }
    passed = m.p4.passed && (!nullOut.p5 || nullOut.p5.passed);
  }

  // Comments: all of them after a pass; before one, only those that explain a failure.
  let notes = [];
  if (nul.found && nul.index != null) {
    if (passed) notes = comments(baseline, current, focus, nul, moving);
    else {
      const explaining = [];
      if (layers.some((l) => l.found && l.p2 && l.p2.worst_px > JUMP_PX)) explaining.push("non_uniform_scale", "zero_scale_at_key");
      if (p4fail && p4fail !== "opacity_move") explaining.push("opacity");
      if (p4fail && p4fail !== "effect_move") explaining.push("effect");
      notes = comments(baseline, current, focus, nul, moving, { explaining });
    }
  }
  const other = otherChanges(baseline, current, focus, nul.name, sd.children_named || []);
  const brought = other.filter((o) => o.kind === "children_brought").map((o) => o.layer);
  if (brought.length) sd.children_named = [...new Set([...(sd.children_named || []), ...brought])];

  return finish({
    ...base,
    stage: parenting_passed ? "move" : "parenting",
    parenting_passed,
    passed,
    demo_undone: demoUndone,
    hints,
    null: nullOut,
    layers,
    comments: notes,
    other_changes: other,
  });
}

// ---- The demo's refusals (FR-017), read from a fresh snapshot before any write

export const REFUSED_MESSAGE = "I can't parent that one without it moving or changing something I shouldn't, so I've left it as it was.";
registerErrors({ NULL_PARENT_REFUSED: REFUSED_MESSAGE });

// One plain sentence per reason; `reason` stays on the error for tests and logs.
const REFUSAL_TEXT = {
  null_not_ready: "I need to check your null first.",
  not_found: "I can't find that layer or the null by name.",
  null_fails_n1: "The layer we're using as the handle isn't a null.",
  null_fails_n2: "The null is 3D or follows another layer.",
  already_parented: "That layer already follows something.",
  locked: "That layer is locked.",
  three_d: "That layer is 3D.",
  null_scale_zero: "The null's Scale is 0, so nothing attached to it can stay where it is.",
};
export const REFUSAL_REASONS = Object.keys(REFUSAL_TEXT);

export function refused(reason) {
  const e = new MentorError("NULL_PARENT_REFUSED", `${REFUSED_MESSAGE} ${REFUSAL_TEXT[reason] || ""}`.trim());
  e.reason = reason;
  return e;
}

// { reason } or { reason: null, target, nul } with both layers found by name.
export function demoRefusal(current, lesson) {
  const sd = lesson.skill_data || {};
  const name = typeof lesson.demo_target === "string" ? lesson.demo_target.replace(/^parent\//, "") : null;
  const nullName = sd.null && sd.null.name;
  const target = name ? uniqueLayer(current, name) : null;
  const nul = nullName ? uniqueLayer(current, nullName) : null;
  if (!target || !nul) return { reason: "not_found" };
  if (classOf(current, nul.index) !== "null") return { reason: "null_fails_n1" };
  const chain = (sourcesOf(current, nul.index) || {}).parents || [];
  if (nul.three_d || (chain.length && (sd.null.chain_on_purpose !== chain[0].layer || chain.some(parentMoves(current))))) return { reason: "null_fails_n2" };
  if (target.parent != null) return { reason: "already_parented" };
  if (target.locked === true) return { reason: "locked" };
  if (target.three_d) return { reason: "three_d" };
  const s = sampleAt(nul, current.comp.time);
  const zero = s && Array.isArray(s.scale) && (s.scale[0] === 0 || s.scale[1] === 0);
  if (zero || toLayerSpace(current, nul.index, [0, 0], current.comp.time).reason === "singular") return { reason: "null_scale_zero" };
  return { reason: null, target, nul };
}

// FOOTPRINT_PATHS is re-exported for tests that build P2 times by hand.
export { FOOTPRINT_PATHS };
