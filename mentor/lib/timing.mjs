// The cross-layer timing analysis (spec 004 FR-016, FR-017; research R11; data-model › Timing
// measures). Measures in seconds and frames, never verdicts: each consumer (skill 3, spec 005)
// applies its own threshold, through clusters() or its own rule. Pure and deterministic.

const r3 = (t) => Math.round(t * 1000) / 1000;
const SEPARATED = /^ADBE Transform Group\/ADBE Position_[012]$/;

// Equal neighbouring values (both known) are a pause: nothing moves between the keys.
const isPause = (a, b) => a.value != null && b.value != null && JSON.stringify(a.value) === JSON.stringify(b.value);

// One property's moves: every key pair that isn't a pause is its own move. A pair whose first key
// holds is an instant change at the second key's time.
function propMoves(prop) {
  const moves = [];
  for (let i = 1; i < prop.keys.length; i++) {
    const from = prop.keys[i - 1];
    const to = prop.keys[i];
    if (isPause(from, to)) continue;
    if (from.out_type === "hold") moves.push({ start: to.time, end: to.time, duration: 0, kind: "instant" });
    else moves.push({ start: from.time, end: to.time, duration: r3(to.time - from.time), kind: "ramp" });
  }
  return moves;
}

const byTime = (a, b) => a.start - b.start || a.end - b.end;

// Separated X, Y, Z: a move merges with moves of a *different* dimension that overlap or touch it,
// so X and Y moving together are one move. Two moves of one dimension are never merged directly,
// though both can join a move of another dimension that overlaps them (T059).
function mergeDimensions(tagged) {
  const n = tagged.length;
  const parent = tagged.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = tagged[i];
      const b = tagged[j];
      if (a.dim !== b.dim && a.move.start <= b.move.end && b.move.start <= a.move.end) parent[find(i)] = find(j);
    }
  }
  const groups = new Map();
  tagged.forEach((t, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(t.move);
  });
  return [...groups.values()].map((ms) => {
    const start = Math.min(...ms.map((m) => m.start));
    const end = Math.max(...ms.map((m) => m.end));
    return { start, end, duration: r3(end - start), kind: ms.some((m) => m.kind === "ramp") ? "ramp" : "instant" };
  }).sort(byTime);
}

function measureUnit(name, props) {
  const allKeys = props.flatMap((p) => p.keys.map((k) => k.time));
  const counted = props.filter((p) => !p.expression_enabled && p.keys.length >= 2);
  let excluded = null;
  let moves = [];
  if (!counted.length) {
    excluded = props.some((p) => p.expression_enabled) ? "expression" : "single_key";
  } else if (props.length > 1 || SEPARATED.test(props[0].path)) {
    moves = mergeDimensions(counted.flatMap((p) => propMoves(p).map((move) => ({ dim: p.path, move }))));
  } else {
    moves = propMoves(counted[0]).sort(byTime);
  }
  if (!excluded && !moves.length) excluded = "no_change";
  return {
    unit: name,
    paths: props.map((p) => p.path),
    excluded,
    first_key: allKeys.length ? Math.min(...allKeys) : null,
    last_key: allKeys.length ? Math.max(...allKeys) : null,
    moves,
    starts: moves.map((m) => m.start),
    landings: moves.map((m) => m.end),
  };
}

// Units in the order their first property appears: separated Position dimensions are one
// "Position" unit, everything else is its own unit by display path.
function unitsOf(layer) {
  const order = [];
  const props = new Map();
  for (const p of layer.properties) {
    const name = SEPARATED.test(p.path) ? "Position" : p.display_path;
    if (!props.has(name)) {
      props.set(name, []);
      order.push(name);
    }
    props.get(name).push(p);
  }
  return order.map((name) => measureUnit(name, props.get(name)));
}

function byFrame(events, frameRate) {
  const groups = new Map();
  for (const e of events) {
    const frame = Math.round(e.time * frameRate);
    if (!groups.has(frame)) groups.set(frame, []);
    const at = groups.get(frame);
    if (!at.some((x) => x.layer_index === e.layer_index && x.unit === e.unit)) at.push({ layer_index: e.layer_index, layer: e.layer, unit: e.unit });
  }
  return [...groups.entries()]
    .filter(([, at]) => at.length >= 2)
    .sort(([a], [b]) => a - b)
    .map(([frame, at]) => ({ frame, time: r3(frame / frameRate), at }));
}

export function timing(snapshot) {
  const frame_rate = snapshot.comp.frame_rate;
  const precomps = new Set((snapshot.precomp_layers || []).map((l) => l.index));
  const layers = snapshot.layers.map((layer) => {
    const units = unitsOf(layer);
    const live = units.filter((u) => !u.excluded);
    const starts = live.flatMap((u) => u.starts);
    const landings = live.flatMap((u) => u.landings);
    return {
      layer_index: layer.index, layer: layer.name, kind: layer.kind, enabled: layer.enabled, is_null: layer.is_null,
      precomp: precomps.has(layer.index),
      units,
      first_start: starts.length ? Math.min(...starts) : null,
      last_landing: landings.length ? Math.max(...landings) : null,
    };
  });
  // A precomp layer with no keys of its own is still listed, so it can be named as not looked into.
  for (const p of snapshot.precomp_layers || []) {
    if (layers.some((l) => l.layer_index === p.index)) continue;
    layers.push({ layer_index: p.index, layer: p.name, kind: "precomp", enabled: null, is_null: false, precomp: true, units: [], first_start: null, last_landing: null });
  }
  layers.sort((a, b) => a.layer_index - b.layer_index);

  const starts = [];
  const landings = [];
  for (const l of layers) {
    for (const u of l.units) {
      if (u.excluded) continue;
      for (const t of u.starts) starts.push({ time: t, layer_index: l.layer_index, layer: l.layer, unit: u.unit });
      for (const t of u.landings) landings.push({ time: t, layer_index: l.layer_index, layer: l.layer, unit: u.unit });
    }
  }
  return {
    frame_rate,
    comp_duration: snapshot.comp.duration,
    layers,
    starts_by_frame: byFrame(starts, frame_rate),
    landings_by_frame: byFrame(landings, frame_rate),
    last_motion_end: landings.length ? Math.max(...landings.map((e) => e.time)) : null,
  };
}

// Events ({ time, ... }) grouped in time order, where each neighbour is within `toleranceSeconds`
// of the one before it. The caller chooses the tolerance (FR-017).
export function clusters(events, toleranceSeconds) {
  const sorted = [...events].sort((a, b) => a.time - b.time);
  const out = [];
  for (const e of sorted) {
    const last = out[out.length - 1];
    if (last && e.time - last[last.length - 1].time <= toleranceSeconds + 1e-9) last.push(e);
    else out.push([e]);
  }
  return out;
}
