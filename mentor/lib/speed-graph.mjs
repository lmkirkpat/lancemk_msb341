// Skill 2, shape the ease in the speed graph (spec 008): candidates, focus, the pair check and the
// fastest part, as pure functions. No After Effects call. Reuses the shared pair reading
// (segments, segmentId, parseSegmentId, needsEase) and other-changes list (unexpectedChanges); copies
// none of them (FR-024).
//
// Shapes are spec 008 data-model.md › Analyzer result, Pair result and Check result.

import { MentorError } from "../errors.mjs";
import { needsEase, parseSegmentId, segmentId, segments } from "./analyze.mjs";
import { unexpectedChanges } from "./diff.mjs";
import { isKeptLinear } from "./marks.mjs";
import { fastestPart } from "./speed-graph-bezier.mjs";

// FR-010 (spec 004 FR-026). Never said to the learner (FR-018).
export const MIN_GAP = 20; // a: landing influence at least this many points above the start's
export const DEFAULT_INFLUENCE = 33.33; // b: Easy Ease's influence
export const DEFAULT_TOL = 1; // b: "within 1 point of" the default; also drag_sideways' test
export const REST_SHARE = 0.05; // d: landing speed at most this share of the pair's average speed (tuned on L-5)
export const REST_ABS = 0.001; // d: when values can't be read, the landing speed must be 0 within this
// FR-008, research R1: the demo's fingerprint. Change both here only (L-3); the snippet gets them as
// arguments and the twin imports them.
export const DEMO_OUT = 15.13;
export const DEMO_IN = 79.87;
export const FINGERPRINT_TOL = 0.0005;
// FR-004 and FR-021.
export const MAX_PAIRS = 5;
export const REVIEW_PAIRS = 2;

const MOVE_EPS = 1e-6; // research R4
const SLACK = 1e-9; // float noise on the comparisons above
const SEP = " › ";
const secs = (t) => String(Number(Number(t).toFixed(3)));
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isNumArray = (v) => Array.isArray(v) && v.length > 0 && v.every(isNum);

export const pairLabel = (s) => `${s.layer.name}${SEP}${s.prop.display_name} ${secs(s.from_time)}–${secs(s.to_time)} s`;

// Position (or a separated X, Y or Z Position) and Scale: the default focus (FR-004).
const DEFAULT_PROP = /^ADBE Transform Group\/ADBE (Position(_[012])?|Scale)$/;
export const isPositionOrScale = (prop) => DEFAULT_PROP.test(prop.path);

function dimLabels(prop, n) {
  if (/\/ADBE Scale$/.test(prop.path)) return ["width", "height", "depth"];
  return n > 1 ? ["X", "Y", "Z"] : [null];
}

// Research R4: the dimensions that move between the pair's two keys. Unseparated Position (and any
// spatial property) has one ease dimension, moving when the two points differ; its change is the
// straight-line distance. Unknown values: every ease dimension is graded (the strict reading).
export function movingDims(seg) {
  const n = Math.max((seg.from.out_ease || []).length, (seg.to.in_ease || []).length, 1);
  const labels = dimLabels(seg.prop, n);
  const a = seg.from.value;
  const b = seg.to.value;
  if (isNum(a) && isNum(b)) return Math.abs(b - a) > MOVE_EPS ? [{ dim: 0, delta: b - a, known: true, spatial: false, label: labels[0] }] : [];
  if (isNumArray(a) && isNumArray(b) && a.length === b.length) {
    if (n === 1) {
      const distance = Math.hypot(...a.map((x, i) => b[i] - x));
      return distance > MOVE_EPS ? [{ dim: 0, delta: distance, known: true, spatial: true, label: null }] : [];
    }
    const out = [];
    for (let d = 0; d < n && d < a.length; d++) {
      if (Math.abs(b[d] - a[d]) > MOVE_EPS) out.push({ dim: d, delta: b[d] - a[d], known: true, spatial: false, label: labels[d] || null });
    }
    return out;
  }
  return Array.from({ length: n }, (_, d) => ({ dim: d, delta: null, known: false, spatial: n === 1, label: n > 1 ? labels[d] || null : null }));
}

// Research R3: the pair's average speed in one dimension (value change over duration), or null.
export function averageSpeed(seg, m) {
  const T = seg.to_time - seg.from_time;
  if (!m || !m.known || !(T > 0)) return null;
  return Math.abs(m.delta) / T;
}

const nearDefault = (inf) => isNum(inf) && Math.abs(inf - DEFAULT_INFLUENCE) <= DEFAULT_TOL + SLACK;
const facingBezier = (seg) => seg.from.out_type === "bezier" && seg.to.in_type === "bezier";
const ORDER = ["a", "b", "c", "d"];

// FR-010 a to d on every moving dimension (FR-011). `dimension` names the failing one when only some
// moving dimensions fail. `dims` keeps each dimension's own failures for the mistake (R7).
export function pairShape(seg) {
  const failed = new Set();
  if (!facingBezier(seg)) failed.add("c");
  const moving = movingDims(seg);
  const dims = moving.map((m) => {
    const o = (seg.from.out_ease || [])[m.dim];
    const i = (seg.to.in_ease || [])[m.dim];
    const f = [];
    if (!o || !i || !isNum(o.influence) || !isNum(i.influence)) {
      f.push("a", "b", "d");
    } else {
      if (!(i.influence - o.influence >= MIN_GAP - SLACK)) f.push("a");
      if (nearDefault(o.influence) && nearDefault(i.influence)) f.push("b");
      const avg = averageSpeed(seg, m);
      const limit = avg == null ? REST_ABS : REST_SHARE * avg;
      if (!isNum(i.speed) || !(Math.abs(i.speed) <= limit + SLACK)) f.push("d");
    }
    for (const x of f) failed.add(x);
    return { ...m, failed: f, out_influence: o ? o.influence : null, in_influence: i ? i.influence : null };
  });
  const failing = dims.filter((d) => d.failed.length);
  const dimension = dims.length > 1 && failing.length > 0 && failing.length < dims.length ? failing[0].label : null;
  return {
    passed: dims.length > 0 && failed.size === 0,
    failed: ORDER.filter((x) => failed.has(x)),
    dimension,
    dims,
  };
}

// FR-016, research R2: where the move is fastest, on the moving dimension with the largest change.
export function fastestFor(seg) {
  const moving = movingDims(seg);
  if (!moving.length) return { parts: [] };
  const m = moving.reduce((best, x) => (Math.abs(x.delta ?? 0) > Math.abs(best.delta ?? 0) ? x : best), moving[0]);
  const o = (seg.from.out_ease || [])[m.dim] || {};
  const i = (seg.to.in_ease || [])[m.dim] || {};
  let delta = m.known ? m.delta : 1;
  let s0 = m.known && isNum(o.speed) ? o.speed : 0;
  let s1 = m.known && isNum(i.speed) ? i.speed : 0;
  if (m.spatial) {
    // AE reports spatial speeds as magnitudes: they follow the distance.
    delta = Math.abs(delta);
    s0 = Math.abs(s0);
    s1 = Math.abs(s1);
  }
  const { parts } = fastestPart({
    duration: seg.to_time - seg.from_time,
    delta,
    out: { speed: s0, influence: o.influence },
    in: { speed: s1, influence: i.influence },
  });
  return { parts };
}

// Per target, what the mentor needs to talk about it (data-model › Analyzer result › pairs).
function pairInfo(seg) {
  return {
    id: seg.id,
    label: pairLabel(seg),
    layer: seg.layer.name,
    property: seg.prop.display_name,
    display_path: seg.display_path,
    from_time: seg.from_time,
    to_time: seg.to_time,
    moving_dims: movingDims(seg).map((m) => m.label).filter(Boolean),
    fastest: fastestFor(seg),
  };
}

// The targets' pair info as the comp is now (falls back to `fallback`, the baseline, for a pair the
// current snapshot no longer has).
export function pairsFor(snapshot, ids, fallback) {
  const now = new Map(segments(snapshot).segments.map((s) => [s.id, s]));
  const before = fallback ? new Map(segments(fallback).segments.map((s) => [s.id, s])) : new Map();
  return ids.map((id) => now.get(id) || before.get(id)).filter(Boolean).map(pairInfo);
}

function readOptions(skill_options) {
  const so = skill_options && typeof skill_options === "object" && !Array.isArray(skill_options) ? skill_options : {};
  const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);
  return { eased_layers: strings(so.eased_layers), land_hard: new Set(strings(so.land_hard)) };
}

const refOf = (s) => ({ layer: s.layer.name, property: s.prop.display_name });
function group(kind, refs) {
  const layers = [...new Set(refs.map((r) => r.layer))];
  const seen = new Set();
  const unique = refs.filter((r) => {
    const k = `${r.layer}\u0000${r.property}`;
    return seen.has(k) ? false : (seen.add(k), true);
  });
  return { kind, layers, refs: unique };
}

// FR-003 to FR-007. Options: focus_layers, exclude (review: past targets), kept_linear (marks that
// apply), skill_options ({ eased_layers, land_hard }), and mode ("review": one layer and property,
// one or two pairs; the snapshot tool passes it, since the session doesn't).
export function analyze(snapshot, { focus_layers, exclude = [], kept_linear, skill_options, mode = "lesson" } = {}) {
  const { eased_layers, land_hard } = readOptions(skill_options);
  const focus = focus_layers && focus_layers.length ? [...focus_layers] : null;
  if (focus) {
    const known = new Set([...snapshot.layers.map((l) => l.name), ...(snapshot.precomp_layers || []).map((l) => l.name)]);
    const unknown = focus.filter((name) => !known.has(name));
    if (unknown.length) {
      throw new MentorError("UNKNOWN_LAYER", `No layer named ${unknown.map((n) => `"${n}"`).join(", ")} in this comp. ` +
        "Use the layer's name exactly as it appears in the comp.");
    }
  }
  const excluded = (s) => (exclude || []).some((e) => e && e.layer === s.layer.name && e.property === s.prop.display_name);
  const kept = (s) => !!(kept_linear && kept_linear.length && isKeptLinear(kept_linear, s.layer.name, s.prop.path, snapshot));

  const { segments: all, skipped } = segments(snapshot);
  const candidates = [];
  const easeFirst = [];
  const alreadyShaped = [];
  for (const s of all) {
    if (kept(s)) continue;
    if (!facingBezier(s)) {
      if (needsEase(s.state)) easeFirst.push(s);
      continue; // a hold side, or bezier into hold (overlap row 7): not a candidate
    }
    if (!movingDims(s).length) continue; // holds still: nothing to shape, left out silently (D-1)
    if (pairShape(s).passed) {
      alreadyShaped.push(s);
      continue;
    }
    if (land_hard.has(s.id) || excluded(s)) continue;
    candidates.push(s);
  }

  // Which layer's pairs (FR-004): a named focus, else the first visible, non-null layer with a
  // Position or Scale candidate, layers from easing lessons first.
  let pool;
  let focusOut;
  if (focus) {
    pool = candidates.filter((s) => focus.includes(s.layer.name));
    focusOut = focus;
  } else {
    const eligible = candidates.filter((s) => isPositionOrScale(s.prop) && s.layer.enabled && !s.layer.is_null);
    const ranked = [
      ...snapshot.layers.filter((l) => eased_layers.includes(l.name)),
      ...snapshot.layers.filter((l) => !eased_layers.includes(l.name)),
    ];
    const chosen = ranked.find((l) => eligible.some((s) => s.layer === l));
    pool = chosen ? eligible.filter((s) => s.layer === chosen) : [];
    focusOut = chosen ? [chosen.name] : [];
  }

  let picked;
  if (mode === "review") {
    // FR-021: one layer and property, one or two pairs, Position or Scale first.
    const first = pool.find((s) => isPositionOrScale(s.prop)) || pool[0];
    picked = first ? pool.filter((s) => s.layer === first.layer && s.prop === first.prop).slice(0, REVIEW_PAIRS) : [];
    if (!focus) focusOut = first ? [first.layer.name] : [];
  } else {
    picked = pool.slice(0, MAX_PAIRS);
  }

  const targets = picked.map((s) => s.id);
  const visible = picked.find((s) => s.layer.enabled && !s.layer.is_null);
  const demo = picked.length >= 2 && visible ? visible : null;
  const noDemoReason = picked.length === 0
    ? (candidates.length === 0 ? "nothing_to_shape" : "none_in_focus")
    : picked.length === 1 ? "single_target" : demo ? null : "no_visible_layer";

  // FR-005: what's left out, one entry per kind, in this order.
  const inFocus = new Set(focusOut);
  const leftOut = [];
  const hidden = snapshot.layers.filter((l) => !l.enabled && !inFocus.has(l.name)).map((l) => l.name);
  if (hidden.length) leftOut.push({ kind: "hidden", layers: hidden });
  const nulls = snapshot.layers.filter((l) => l.is_null && !inFocus.has(l.name)).map((l) => l.name);
  if (nulls.length) leftOut.push({ kind: "null", layers: nulls });
  const precomps = (snapshot.precomp_layers || []).map((l) => l.name);
  if (precomps.length) leftOut.push({ kind: "precomp", layers: precomps });
  const expr = skipped.filter((x) => x.reason === "expression").map((x) => ({ layer: x.layer, property: x.property }));
  if (expr.length) leftOut.push(group("expression", expr));
  const hiddenOrNull = new Set([...hidden, ...nulls]);
  const ef = easeFirst.filter((s) => !hiddenOrNull.has(s.layer.name)).map(refOf);
  if (ef.length) leftOut.push(group("ease_first", ef));
  if (alreadyShaped.length) leftOut.push(group("already_shaped", alreadyShaped.map(refOf)));

  // Candidates outside the focus, so the mentor can offer them by name.
  const targetSet = new Set(targets);
  const others = [];
  for (const s of candidates) {
    if (targetSet.has(s.id)) continue;
    const last = others[others.length - 1];
    if (last && last.layer === s.layer.name && last.property === s.prop.display_name) last.pairs++;
    else others.push({ layer: s.layer.name, property: s.prop.display_name, display_path: s.display_path, pairs: 1 });
  }

  return {
    focus: focusOut,
    targets,
    target_refs: picked.map(refOf),
    demo_target: demo ? demo.id : null,
    no_demo_reason: noDemoReason,
    candidates_count: candidates.length,
    left_out: leftOut,
    ease_first_count: easeFirst.length,
    other_candidates: others,
    pairs: picked.map(pairInfo),
    skipped,
  };
}

// FINDERS["easing.speed_graph"].focus (spec 004 contract › 2): agrees with analyze() for the same
// exclude and kept_linear.
export function finder(snapshot, { exclude = [], kept_linear } = {}) {
  const a = analyze(snapshot, { exclude, kept_linear });
  return { count: a.targets.length, layers: a.targets.length ? a.focus : [] };
}

// --- The check (FR-010 to FR-015) ---

const propKey = (id) => {
  const { layer_index, property_path } = parseSegmentId(id);
  return `${layer_index}/${property_path}`;
};
function propsByKey(snapshot) {
  const map = new Map();
  for (const layer of snapshot.layers) for (const prop of layer.properties) map.set(`${layer.index}/${prop.path}`, { layer, prop });
  return map;
}
const sameTimes = (a, b) => a.keys.length === b.keys.length && a.keys.every((k, i) => Math.abs(k.time - b.keys[i].time) < FINGERPRINT_TOL);
const sameEase = (x, y) => JSON.stringify(x || []) === JSON.stringify(y || []);
const hasFingerprint = (eases, value) => Array.isArray(eases) && eases.length > 0 &&
  eases.every((e) => e && isNum(e.influence) && Math.abs(e.influence - value) < FINGERPRINT_TOL);
const knowsEase = (eases) => Array.isArray(eases) && eases.length > 0 && eases.every((e) => e && isNum(e.influence));

// FR-008: who shaped the demo pair now. "demo" while one facing side still has the fingerprint;
// after an undo it's the learner's: back as it was ("learner_after_undo") or shaped again
// ("learner_redo"); "unknown" when the ease can't be read (the mentor asks once).
export function demoCredit(seg, baseSeg, lesson) {
  if (lesson.demo && lesson.demo.undone) return "learner_after_undo";
  if (!knowsEase(seg.from.out_ease) || !knowsEase(seg.to.in_ease)) return "unknown";
  if (facingBezier(seg) && (hasFingerprint(seg.from.out_ease, DEMO_OUT) || hasFingerprint(seg.to.in_ease, DEMO_IN))) return "demo";
  const asBefore = baseSeg && seg.from.out_type === baseSeg.from.out_type && seg.to.in_type === baseSeg.to.in_type &&
    sameEase(seg.from.out_ease, baseSeg.from.out_ease) && sameEase(seg.to.in_ease, baseSeg.to.in_ease);
  return asBefore ? "learner_after_undo" : "learner_redo";
}

// Research R7: the first mistake that matches, for a pair that didn't pass.
function mistakeFor(seg, baseSeg, shape, { seen, targetSet }) {
  const out = { mistake: "not_shaped" };
  if (shape.failed.includes("c")) {
    out.mistake = "no_handle";
    out.key_time = seg.from.out_type !== "bezier" ? seg.from.time : seg.to.time;
    return out;
  }
  const rest = shape.dims.find((d) => d.failed.includes("d"));
  if (rest) {
    out.mistake = "arrives_moving";
    out.key_time = seg.to.time;
    const was = baseSeg && (baseSeg.to.in_ease || [])[rest.dim];
    out.drag_sideways = !!(was && isNum(was.influence) && isNum(rest.in_influence) && Math.abs(rest.in_influence - was.influence) <= DEFAULT_TOL + SLACK);
    return out;
  }
  if (shape.failed.includes("b") && seen.has(seg.id)) {
    out.mistake = "back_to_default";
    return out;
  }
  const aFails = shape.dims.filter((d) => d.failed.includes("a"));
  if (aFails.length && aFails.every((d) => d.out_influence >= 50 && d.in_influence >= 50)) {
    out.mistake = "long_both_ends";
    return out;
  }
  if (baseSeg) {
    const { layer_index, property_path, key_index } = parseSegmentId(seg.id);
    const inChanged = seg.from.in_type !== baseSeg.from.in_type || !sameEase(seg.from.in_ease, baseSeg.from.in_ease);
    const outSame = seg.from.out_type === baseSeg.from.out_type && sameEase(seg.from.out_ease, baseSeg.from.out_ease);
    const earlier = `${layer_index}/${property_path}/${key_index - 1}`;
    if (inChanged && outSame && !targetSet.has(earlier)) out.mistake = "in_out_mixed";
  }
  return out;
}

// FR-010 to FR-015 (data-model › Check result). `lesson` is the session's current lesson. Never
// changes anything: the tool calls markChecked.
export function check(baseline, current, lesson, { seen_shaped = [] } = {}) {
  const landHard = readOptions(lesson.skill_options).land_hard;
  const targets = (lesson.targets || []).filter((id) => !landHard.has(id));
  const seen = new Set(Array.isArray(seen_shaped) ? seen_shaped.filter((x) => typeof x === "string") : []);
  const demoId = lesson.demo ? lesson.demo.segment_id : null;

  if (current.comp.id !== lesson.comp_id) {
    return {
      comp_matches: false, lesson_comp: baseline.comp.name, pairs: [], other_changes: [], passed: false,
      demo_undone: !!(lesson.demo && lesson.demo.undone), seen_shaped: [...seen],
    };
  }

  const was = new Map(segments(baseline).segments.map((s) => [s.id, s]));
  const now = new Map(segments(current).segments.map((s) => [s.id, s]));
  const propsBefore = propsByKey(baseline);
  const propsNow = propsByKey(current);
  const targetSet = new Set(targets);
  let demoUndone = !!(lesson.demo && lesson.demo.undone);

  const pairs = targets.map((id) => {
    const baseSeg = was.get(id);
    const label = baseSeg ? pairLabel(baseSeg) : id;
    const before = propsBefore.get(propKey(id));
    const after = propsNow.get(propKey(id));
    if (!after || !before) return { id, label, result: "removed" };
    if (!sameTimes(before.prop, after.prop)) return { id, label, result: "keys_changed" };
    const seg = now.get(id);
    if (!seg) return { id, label, result: "removed" }; // an expression turned on: other_changes says so
    const shape = pairShape(seg);
    const r = { id, label, result: shape.passed ? "passed" : "not_passed", failed: shape.failed, mistake: null };
    if (!shape.passed) Object.assign(r, mistakeFor(seg, baseSeg, shape, { seen, targetSet }));
    if (shape.dimension) r.dimension = shape.dimension;
    r.fastest = fastestFor(seg);
    if (id === demoId) {
      r.credit = demoCredit(seg, baseSeg, lesson);
      if (r.credit === "learner_after_undo" || r.credit === "learner_redo") demoUndone = true;
    }
    if (!shape.failed.includes("b") && !shape.failed.includes("c")) seen.add(id);
    return r;
  });

  const graded = pairs.filter((p) => p.result === "passed" || p.result === "not_passed");
  return {
    comp_matches: true,
    lesson_comp: baseline.comp.name,
    pairs,
    other_changes: unexpectedChanges(baseline, current, new Set([...(lesson.targets || []), ...landHard])),
    // Every focus pair graded and passed: keys changed or a pair gone holds the pass until the
    // learner says whether that was on purpose (FR-014).
    passed: graded.length > 0 && graded.length === pairs.length && graded.every((p) => p.result === "passed"),
    demo_undone: demoUndone,
    seen_shaped: [...seen],
  };
}

