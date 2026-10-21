// Raw-key reads for skill 3's check (spec 010 research R6, R7; FR-012 to FR-014). Pure.
//
// The timing analysis (timing.mjs) decides what to *teach*: it leaves out expressions, single keys
// and pauses. That filter is wrong for deciding what *changed* (the overlap audit's filter 1), so
// everything here reads the raw keys of every keyed property instead, and never uses timing()'s
// `excluded` or easing's unexpectedChanges() (keyed on easing pairs, filter 3).

// Shifts within half a frame are "no shift" (Quick Offset can put keys between frames, row 19).
const HALF_FRAME = 0.5;
const EPS = 1e-6;
const SEPARATED = /^ADBE Transform Group\/ADBE Position_[012]$/;

const r2 = (n) => Math.round(n * 100) / 100;
// Frames to a tenth: key times are read to the millisecond, so 4 frames can read as 3.99.
const r1 = (n) => Math.round(n * 10) / 10;
const label = (layer, prop) => `${layer.name} › ${prop.display_name}`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const known = (v) => v !== undefined && v !== null;

const named = (snap, name) => snap.layers.filter((l) => l.name === name);

// The current layer for a baseline layer (FR-012, overlap row 17): by name when the name is unique
// in both reads, so reordering the stack doesn't swap layers; by index otherwise (two layers share
// the name, or it was renamed). Null when the layer has no keys now.
export function matchLayer(baseline, current, baseLayer) {
  const inBase = named(baseline, baseLayer.name).length;
  const now = named(current, baseLayer.name);
  if (inBase === 1 && now.length === 1) return now[0];
  const atIndex = current.layers.find((l) => l.index === baseLayer.index) || null;
  if (inBase === 1 && now.length === 0) {
    // Renamed in place: the layer at its index now has a name the baseline didn't use.
    return atIndex && named(baseline, atIndex.name).length === 0 ? atIndex : null;
  }
  return atIndex;
}

// How far a property's keys moved, in frames: the first key's shift, and whether every key moved
// by that amount (same count, each within half a frame).
export function shifts(baseProp, curProp, fps) {
  if (!baseProp || !curProp || !baseProp.keys.length || !curProp.keys.length) return null;
  const frames = r1((curProp.keys[0].time - baseProp.keys[0].time) * fps);
  const uniform = baseProp.keys.length === curProp.keys.length &&
    baseProp.keys.every((k, i) => Math.abs((curProp.keys[i].time - k.time) * fps - frames) < HALF_FRAME);
  return { frames, moved: Math.abs(frames) >= HALF_FRAME, uniform };
}

// Per dimension of a separated Position (X, Y, Z by display name), the first-key shift in frames.
// The timing analysis merges the dimensions into one unit, so a split within Position is only
// visible here (overlap row 7).
export function dimensionShifts(baseLayer, curLayer, fps) {
  const out = {};
  if (!baseLayer || !curLayer) return out;
  for (const p of baseLayer.properties.filter((x) => SEPARATED.test(x.path))) {
    const s = shifts(p, curLayer.properties.find((x) => x.path === p.path), fps);
    out[p.display_name] = s ? s.frames : null;
  }
  return out;
}

export const movedApart = (a, b) => a != null && b != null && Math.abs(a - b) >= HALF_FRAME;
export const isMoved = (frames) => frames != null && Math.abs(frames) >= HALF_FRAME;

// Keys the comp never plays (FR-014): before 0 s or after the comp's end. `refs` is
// [{ layer_index, paths }] on `snapshot` (paths omitted: every keyed property on the layer).
export function outOfComp(snapshot, refs) {
  const out = [];
  for (const ref of refs) {
    const layer = snapshot.layers.find((l) => l.index === ref.layer_index);
    if (!layer) continue;
    for (const p of layer.properties.filter((x) => !ref.paths || ref.paths.includes(x.path))) {
      for (const k of p.keys) {
        if (k.time < -EPS || k.time > snapshot.comp.duration + EPS) out.push({ layer: layer.name, property: p.display_name, time: k.time });
      }
    }
  }
  return out;
}

// A pause (two neighbouring keys with equal, known values) that now has different values.
function pauseGivenValue(base, cur) {
  for (let i = 1; i < base.keys.length; i++) {
    const a = base.keys[i - 1];
    const b = base.keys[i];
    if (!known(a.value) || !known(b.value) || !same(a.value, b.value)) continue;
    const ca = cur.keys[i - 1];
    const cb = cur.keys[i];
    if (ca && cb && known(ca.value) && known(cb.value) && !same(ca.value, cb.value)) return a.time;
  }
  return null;
}

const fmt = (t) => `${r2(t)} s`;

// Changes outside the group that the timing analysis would hide (FR-013), as plain sentences for
// the mentor. `groupRefs` is [{ layer_index, paths }] on the baseline (paths omitted: the whole
// layer). Key changes inside the group are the check's to grade, so they aren't listed; an
// expression turned on or off and a property newly animated are listed everywhere.
export function otherChanges(baseline, current, groupRefs) {
  const inGroup = (layer, path) => groupRefs.some((g) => g.layer_index === layer.index && (!g.paths || g.paths.includes(path)));
  const wholeLayer = (layer) => groupRefs.some((g) => g.layer_index === layer.index);
  const out = [];
  const matched = new Set();
  for (const bl of baseline.layers) {
    const cl = matchLayer(baseline, current, bl);
    if (!cl) {
      if (!wholeLayer(bl)) out.push(`${bl.name} has no keys now`);
      continue;
    }
    matched.add(cl.index);
    for (const bp of bl.properties) {
      const cp = cl.properties.find((p) => p.path === bp.path);
      const inside = inGroup(bl, bp.path);
      if (!cp) {
        if (!inside) out.push(`${label(bl, bp)} is no longer animated`);
        continue;
      }
      if (!!bp.expression_enabled !== !!cp.expression_enabled) {
        out.push(`${label(bl, bp)}: an expression was turned ${cp.expression_enabled ? "on" : "off"}`);
      }
      if (inside) continue;
      if (bp.keys.length !== cp.keys.length) {
        out.push(`${label(bl, bp)} has ${cp.keys.length} keys now (it had ${bp.keys.length})`);
        continue;
      }
      const moved = bp.keys.some((k, i) => Math.abs(k.time - cp.keys[i].time) > EPS);
      if (moved && bp.keys.length === 1) {
        out.push(`${label(bl, bp)}: its single key moved from ${fmt(bp.keys[0].time)} to ${fmt(cp.keys[0].time)}`);
        continue;
      }
      if (moved) {
        const i = bp.keys.findIndex((k, j) => Math.abs(k.time - cp.keys[j].time) > EPS);
        out.push(`${label(bl, bp)}: its key at ${fmt(bp.keys[i].time)} moved to ${fmt(cp.keys[i].time)}`);
        continue;
      }
      const pause = pauseGivenValue(bp, cp);
      if (pause != null) {
        out.push(`${label(bl, bp)}: the pause from ${fmt(pause)} has a new value, so it moves there now`);
        continue;
      }
      if (bp.keys.some((k, i) => known(k.value) && known(cp.keys[i].value) && !same(k.value, cp.keys[i].value))) {
        out.push(`${label(bl, bp)}: a key has a new value`);
      }
    }
    for (const cp of cl.properties) {
      if (!bl.properties.some((p) => p.path === cp.path)) out.push(`${label(cl, cp)} is newly animated`);
    }
  }
  for (const cl of current.layers) {
    if (!matched.has(cl.index)) out.push(`${cl.name} is newly animated`);
  }
  return out;
}
