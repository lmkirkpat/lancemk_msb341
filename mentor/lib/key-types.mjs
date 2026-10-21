// Skill 1, key types (spec 009): the pure analysis. Finds candidates (FR-003), turns what the learner
// named into a focus by layer and property (FR-005), lists what's left out (FR-006), checks each focus
// pair against the baseline (FR-011 to FR-013, FR-016), and gives the stage 6 verdict on a move the
// learner says runs at constant speed (FR-014). No AE calls, no session, no record: the tools in
// mentor/tools/key-types.mjs do those. Pair classification is the shared one (analyze.mjs), never a
// copy (FR-022): a mixed pair is not held.

import { segments, segmentState, segmentId, parseSegmentId } from "./analyze.mjs";
import { isKeptLinear } from "./marks.mjs";
import { unexpectedChanges } from "./diff.mjs";

export const OPACITY_PATH = "ADBE Transform Group/ADBE Opacity";
export const VALUE_TOL = 0.5;
export const MAX_NAMED = 3;
// What Toggle Hold Keyframe writes at 26.5: "out" (the key's outgoing side only) or "both". Set from
// live check L-2 (spec 009 T034); mentor/jsx/key-types-demo.jsx has the same constant.
export const HOLD_SIDES = "out";

const POSITION_PATH = "ADBE Transform Group/ADBE Position";
const SEP = " › ";
const secs = (t) => String(Number(Number(t).toFixed(3)));
const r3 = (t) => Math.round(t * 1000) / 1000;
const norm = (s) => (typeof s === "string" ? s.trim().toLowerCase() : "");

const near = (v, target) => typeof v === "number" && Math.abs(v - target) <= VALUE_TOL;
const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
// One key at 0 and the other at 100, either order (FR-003, H-2: strict).
const isOnOff = (from, to) => (near(from.value, 0) && near(to.value, 100)) || (near(from.value, 100) && near(to.value, 0));
// Both values known and equal: holding it changes nothing on screen (row 16, C-2).
export const isPause = (from, to) => from.value != null && to.value != null && JSON.stringify(from.value) === JSON.stringify(to.value);
const isHeld = (from) => from.out_type === "hold";
const visible = (layer) => layer.enabled && !layer.is_null;

const pairLabel = (layer, prop, from, to) => `${layer.name}${SEP}${prop.display_name} ${secs(from.time)}–${secs(to.time)} s`;

// ---- Resolving what the learner named ({ layer, property }) against a snapshot.

function matchesProp(prop, property) {
  const n = norm(property);
  return norm(prop.display_name) === n || prop.path === property || norm(prop.display_path) === n;
}

// Position named on a separated layer means each keyed dimension (R7).
function namesPosition(property) {
  const n = norm(property);
  return n === "position" || property === POSITION_PATH || n === "transform › position";
}
const isDimension = (prop) => /^ADBE Transform Group\/ADBE Position_\d$/.test(prop.path);

// → { layers: [...], props: [{ layer, prop }] } or { reason } (not_found, precomp_inside).
// A ref with no property on a layer with exactly one keyed property means that property.
export function resolveRef(snapshot, ref) {
  const layerName = ref && ref.layer;
  const layers = (snapshot.layers || []).filter((l) => l.name === layerName);
  const isPrecomp = (snapshot.precomp_layers || []).some((l) => l.name === layerName);
  if (!layers.length) return { reason: isPrecomp ? "precomp_inside" : "not_found" };
  const property = ref.property;
  const found = [];
  for (const layer of layers) {
    let props;
    if (property == null || property === "") props = layer.properties.length === 1 ? [layer.properties[0]] : [];
    else {
      props = layer.properties.filter((p) => matchesProp(p, property));
      if (!props.length && namesPosition(property)) props = layer.properties.filter(isDimension);
    }
    for (const prop of props) found.push({ layer, prop });
  }
  if (!found.length) return { reason: isPrecomp ? "precomp_inside" : "not_found" };
  return { props: found };
}

const refMatches = (refs, layer, prop) =>
  (refs || []).some((r) => r && r.layer === layer.name && (matchesProp(prop, r.property) || (isDimension(prop) && namesPosition(r.property))));

// ---- Candidates (FR-003)

// Every candidate property, earliest first key time first, then layer order. Not capped: the
// analyzer names at most MAX_NAMED of them; the finder counts them all.
export function candidates(snapshot, { kept_linear, exclude = [], should_move = [] } = {}) {
  const groups = new Map();
  for (const s of segments(snapshot).segments) {
    if (s.prop.path !== OPACITY_PATH || !visible(s.layer) || s.state === "held") continue;
    if (!isNumber(s.from.value) || !isNumber(s.to.value) || !isOnOff(s.from, s.to)) continue;
    if (kept_linear && kept_linear.length && isKeptLinear(kept_linear, s.layer.name, s.prop.path, snapshot)) continue;
    if (refMatches(exclude, s.layer, s.prop) || refMatches(should_move, s.layer, s.prop)) continue;
    const key = `${s.layer.index}/${s.prop.path}`;
    let g = groups.get(key);
    if (!g) {
      g = { layer: s.layer.name, property: s.prop.display_name, first_time: s.from_time, pairs: 0, _index: s.layer.index };
      groups.set(key, g);
    }
    g.pairs++;
  }
  return [...groups.values()]
    .sort((a, b) => a.first_time - b.first_time || a._index - b._index)
    .map(({ _index, ...c }) => c);
}

// The finder (contracts/skill-module.md › 2): agrees with analyze()'s candidates for the same exclude.
export function finder(snapshot, { exclude = [], kept_linear } = {}) {
  const found = candidates(snapshot, { exclude, kept_linear });
  return { count: found.length, layers: [...new Set(found.map((c) => c.layer))] };
}

// ---- What's left out, and the held pairs stage 2 can show (FR-006)

function leftOut(snapshot, kept_linear) {
  const out = [];
  const add = (reason, items) => {
    if (!items.length) return;
    out.push({ reason, layers: [...new Set(items.map((i) => i.layer))], properties: items });
  };
  const hidden = snapshot.layers.filter((l) => !l.enabled).map((l) => ({ layer: l.name }));
  add("hidden", hidden);
  add("precomp", (snapshot.precomp_layers || []).map((l) => ({ layer: l.name })));
  const expression = [];
  const held = [];
  const kept = [];
  const unknown = [];
  for (const layer of snapshot.layers) {
    for (const prop of layer.properties) {
      if (prop.expression_enabled) { expression.push({ layer: layer.name, property: prop.display_name }); continue; }
      if (prop.keys.length < 2) continue;
      if (kept_linear && kept_linear.length && isKeptLinear(kept_linear, layer.name, prop.path, snapshot)) {
        kept.push({ layer: layer.name, property: prop.display_name });
        continue;
      }
      if (!layer.enabled) continue;
      const pairs = prop.keys.slice(1).map((to, i) => [prop.keys[i], to]);
      if (pairs.every(([from]) => isHeld(from))) held.push({ layer: layer.name, property: prop.display_name });
      else if (prop.path === OPACITY_PATH && !layer.is_null &&
        pairs.some(([from, to]) => !isHeld(from) && (!isNumber(from.value) || !isNumber(to.value)))) {
        unknown.push({ layer: layer.name, property: prop.display_name });
      }
    }
  }
  add("expression", expression);
  add("already_held", held);
  add("kept_linear", kept);
  add("unknown_values", unknown);
  return out;
}

function heldExamples(snapshot) {
  return segments(snapshot).segments
    .filter((s) => s.state === "held" && visible(s.layer) && !isPause(s.from, s.to))
    .sort((a, b) => a.to_time - b.to_time || a.layer.index - b.layer.index)
    .slice(0, 2)
    .map((s) => ({ layer: s.layer.name, property: s.prop.display_name, jump_time: s.to_time }));
}

// ---- The focus (FR-005)

function focusPairs(snapshot, refs, exclude) {
  const refused = [];
  const pairs = [];
  const seen = new Set();
  const layers = [];
  for (const ref of refs || []) {
    const r = resolveRef(snapshot, ref);
    const refusal = (reason) => refused.push({ layer: ref.layer, property: ref.property ?? null, reason });
    if (r.reason) { refusal(r.reason); continue; }
    if (r.props.some(({ prop }) => prop.expression_enabled)) { refusal("expression"); continue; }
    const keyed = r.props.filter(({ prop }) => prop.keys.length >= 2);
    if (!keyed.length) { refusal("single_key"); continue; }
    if (exclude && exclude.length && keyed.every(({ layer, prop }) => refMatches(exclude, layer, prop))) { refusal("past_target"); continue; }
    let nonHeld = 0;
    const mine = [];
    for (const { layer, prop } of keyed) {
      if (exclude && exclude.length && refMatches(exclude, layer, prop)) continue;
      for (let i = 1; i < prop.keys.length; i++) {
        const from = prop.keys[i - 1];
        const to = prop.keys[i];
        if (isHeld(from)) continue;
        nonHeld++;
        if (isPause(from, to)) continue;
        mine.push({ id: segmentId(layer, prop, i), layer, prop, from, to });
      }
    }
    if (!nonHeld) { refusal("all_held"); continue; }
    if (!mine.length) { refusal("only_pauses"); continue; }
    for (const p of mine) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      pairs.push(p);
      if (!layers.includes(p.layer.name)) layers.push(p.layer.name);
    }
  }
  return { pairs, refused, layers };
}

// The analyzer (spec 004 contracts/skill-module.md › 4, data-model › Analyzer result). The focus comes
// from opts.skill_options.focus; before the learner names one, targets are [] (FR-004).
export function analyze(snapshot, { exclude = [], kept_linear, skill_options } = {}) {
  const opts = skill_options || {};
  const named = Array.isArray(opts.focus) ? opts.focus : [];
  const all = candidates(snapshot, { kept_linear, exclude, should_move: opts.should_move });
  const { pairs, refused, layers } = focusPairs(snapshot, named, exclude);

  let demo = null;
  let noDemoReason = null;
  if (!pairs.length) noDemoReason = all.length || named.length ? "awaiting_focus" : "no_candidate";
  else if (pairs.length < 2) noDemoReason = "single_target";
  else {
    demo = pairs.filter((p) => visible(p.layer)).sort((a, b) => a.from.time - b.from.time)[0] || null;
    if (!demo) noDemoReason = "hidden_or_null";
  }

  return {
    focus: layers.length ? layers : null,
    targets: pairs.map((p) => p.id),
    target_refs: pairs.map((p) => ({ layer: p.layer.name, property: p.prop.display_name })),
    demo_target: demo ? demo.id : null,
    no_demo_reason: noDemoReason,
    candidates: all.slice(0, MAX_NAMED),
    more_candidates: Math.max(0, all.length - MAX_NAMED),
    refused,
    held_examples: heldExamples(snapshot),
    left_out: leftOut(snapshot, kept_linear),
  };
}

// The lesson's targets in words, read from the snapshot they were taken from (the baseline), so a
// pair the learner has since held is still described. Unknown ids are left out.
export function describePairs(snapshot, ids) {
  const out = [];
  for (const id of ids || []) {
    const { layer_index, property_path, key_index: i } = parseSegmentId(id);
    const found = propAt(snapshot, layer_index, property_path);
    if (!found || !found.prop.keys[i]) continue;
    const { layer, prop } = found;
    const from = prop.keys[i - 1];
    const to = prop.keys[i];
    out.push({
      id, label: pairLabel(layer, prop, from, to), layer: layer.name, property: prop.display_name,
      from_time: from.time, to_time: to.time, state: segmentState(from, to),
      layer_visible: visible(layer), values: [from.value ?? null, to.value ?? null],
    });
  }
  return out;
}

// ---- Stage 6: is the named move linear at both ends? (FR-014, research R6)

export function constantSpeed(snapshot, ref) {
  const named = { layer: ref && ref.layer, property: ref && ref.property != null ? ref.property : null };
  const r = resolveRef(snapshot, ref || {});
  if (r.reason) return { ref: named, verdict: "not_found", detail: [], properties: [] };
  const properties = r.props.map(({ layer, prop }) => ({ layer: layer.name, property: prop.display_name }));
  if (r.props.some(({ prop }) => prop.expression_enabled)) return { ref: named, verdict: "expression", detail: [], properties };
  const keyed = r.props.filter(({ prop }) => prop.keys.length >= 2);
  if (!keyed.length) return { ref: named, verdict: "single_key", detail: [], properties };
  const notLinear = [];
  let held = false;
  for (const { layer, prop } of keyed) {
    for (let i = 1; i < prop.keys.length; i++) {
      const from = prop.keys[i - 1];
      const to = prop.keys[i];
      const state = segmentState(from, to);
      if (state === "linear") continue;
      if (state === "held") held = true;
      const startOk = from.out_type === "linear";
      const endOk = to.in_type === "linear";
      notLinear.push({
        pair: pairLabel(layer, prop, from, to), from_time: from.time, to_time: to.time,
        side: !startOk && !endOk ? "both" : !startOk ? "start" : "end",
      });
    }
  }
  const resolved = keyed.map(({ layer, prop }) => ({ layer: layer.name, property: prop.display_name }));
  if (held) return { ref: named, verdict: "held", detail: notLinear, properties: resolved };
  if (notLinear.length) return { ref: named, verdict: "not_linear", detail: notLinear, properties: resolved };
  return { ref: named, verdict: "linear", detail: [], properties: resolved };
}

// ---- The check (FR-011 to FR-013, FR-016, research R5)

function propAt(snapshot, layerIndex, path) {
  const layer = snapshot.layers.find((l) => l.index === layerIndex);
  const prop = layer && layer.properties.find((p) => p.path === path);
  return prop ? { layer, prop } : null;
}

const frameTime = (from, to, fps) => {
  const mid = (from.time + to.time) / 2;
  return fps ? r3(Math.round(mid * fps) / fps) : r3(mid);
};

// Items and pass from a check result (data-model › Check result). In a review, a volunteered
// constant-speed move doesn't count towards the pass (H-4).
export function grade(result, { mode = "lesson" } = {}) {
  const cs = result.constant_speed;
  const items = {
    held: result.pairs.length > 0 && result.pairs.every((p) => p.verdict === "held_by_learner" || p.verdict === "held_by_demo"),
    none_should_move_held: result.should_move_held.length === 0,
    constant_speed: !cs || cs.verdict === "expression" || mode === "review" ? null : cs.verdict === "linear",
  };
  return { ...result, items, passed: !!(result.comp_matches && items.held && items.none_should_move_held && items.constant_speed !== false) };
}

// `lesson`: the session's lesson (targets, demo, comp_id, skill_options, mode). `opts.should_move` is
// added to the stored list (union); `opts.constant_speed` is stage 6's named move, or null.
export function check(baseline, current, lesson, { should_move = [], constant_speed = null } = {}) {
  const demoId = lesson.demo ? lesson.demo.segment_id : null;
  const mode = lesson.mode || "lesson";
  if (current.comp.id !== lesson.comp_id) {
    return grade({
      comp_matches: false, lesson_comp: baseline.comp.name, pairs: [], should_move_held: [], extra_holds: [], other_changes: [],
      constant_speed: null, demo_undone: !!(lesson.demo && lesson.demo.undone),
    }, { mode });
  }
  const fps = current.comp.frame_rate;
  const targets = lesson.targets || [];
  const targetSet = new Set(targets);

  let demoUndone = !!(lesson.demo && lesson.demo.undone);
  const pairs = targets.map((id) => {
    const { layer_index, property_path, key_index: i } = parseSegmentId(id);
    const was = propAt(baseline, layer_index, property_path);
    const now = propAt(current, layer_index, property_path);
    const label = was && was.prop.keys[i] ? pairLabel(was.layer, was.prop, was.prop.keys[i - 1], was.prop.keys[i]) : id;
    const out = { id, label };
    const changed = !was || !now || now.prop.keys.length !== was.prop.keys.length ||
      now.prop.keys[i - 1].time !== was.prop.keys[i - 1].time || now.prop.keys[i].time !== was.prop.keys[i].time;
    if (changed) {
      out.verdict = "removed_or_changed";
      if (id === demoId) demoUndone = true;
      return out;
    }
    const from = now.prop.keys[i - 1];
    const to = now.prop.keys[i];
    if (isHeld(from)) {
      out.verdict = id === demoId && !demoUndone ? "held_by_demo" : "held_by_learner";
      return out;
    }
    if (id === demoId) demoUndone = true;
    if (to.in_type === "hold") {
      out.verdict = "wrong_side";
      return out;
    }
    out.verdict = "not_held";
    out.state = segmentState(from, to);
    out.frame_time = frameTime(from, to, fps);
    return out;
  });
  // A demo pair seen not held in this check is the learner's from now on (row 20), whatever order the
  // pairs came in.
  if (demoUndone && demoId) for (const p of pairs) if (p.id === demoId && p.verdict === "held_by_demo") p.verdict = "held_by_learner";
  if (demoUndone) for (const p of pairs) if (p.id === demoId) p.demo_undone = true;

  // Should-move holds (FR-012): their own check, not the generic other-changes list.
  const stored = lesson.skill_options && Array.isArray(lesson.skill_options.should_move) ? lesson.skill_options.should_move : [];
  const moveRefs = [...stored, ...(should_move || [])];
  const shouldMoveHeld = [];
  const moveProps = new Set();
  for (const ref of moveRefs) {
    const r = resolveRef(current, ref);
    if (r.reason) continue;
    for (const { layer, prop } of r.props) {
      const key = `${layer.index}/${prop.path}`;
      if (moveProps.has(key)) continue;
      moveProps.add(key);
      const was = propAt(baseline, layer.index, prop.path);
      if (!was) continue;
      for (let i = 1; i < prop.keys.length && i < was.prop.keys.length; i++) {
        const from = prop.keys[i - 1];
        const to = prop.keys[i];
        if (targetSet.has(segmentId(layer, prop, i)) || !isHeld(from) || isHeld(was.prop.keys[i - 1]) || isPause(from, to)) continue;
        shouldMoveHeld.push({ layer: layer.name, property: prop.display_name, from_time: from.time, waits_until: to.time });
      }
    }
  }

  // Extra holds (FR-013): pairs outside the focus and the should-move list that became held since the
  // baseline, except pauses. Properties whose keys were added or removed are left to other_changes.
  const before = new Map(segments(baseline).segments.map((s) => [s.id, s]));
  const extra = [];
  const extraProps = new Set();
  for (const s of segments(current).segments) {
    if (targetSet.has(s.id) || moveProps.has(`${s.layer.index}/${s.prop.path}`)) continue;
    const was = before.get(s.id);
    if (!was || was.prop.keys.length !== s.prop.keys.length) continue;
    if (s.state !== "held" || was.state === "held" || isPause(s.from, s.to)) continue;
    extra.push({ layer: s.layer.name, property: s.prop.display_name, time: s.from_time });
    extraProps.add(`${s.layer.name}${SEP}${s.prop.display_name}`);
  }
  for (const s of shouldMoveHeld) extraProps.add(`${s.layer}${SEP}${s.property}`);

  // Everything else that changed, without repeating what the lists above already say.
  const other = unexpectedChanges(baseline, current, targetSet).filter((note) => {
    const m = /^(.*) was changed \(not part of this lesson\)$/.exec(note);
    return !(m && extraProps.has(m[1]));
  });

  return grade({
    comp_matches: true,
    lesson_comp: baseline.comp.name,
    pairs,
    should_move_held: shouldMoveHeld,
    extra_holds: extra,
    other_changes: other,
    constant_speed: constant_speed ? constantSpeed(current, constant_speed) : null,
    demo_undone: demoUndone,
  }, { mode });
}
