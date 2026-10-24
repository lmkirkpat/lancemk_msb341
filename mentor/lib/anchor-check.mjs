// Skill 5's check (spec 011 FR-010 to FR-019, research R7): items 1 to 5 per focus layer, the
// other changes, and one hint code per TD § 7 row. Pure, no AE calls.
//
// Items 2, 4 and 5 compare comp-space footprints (comp-space.mjs) at the same time in both reads;
// item 1 is measured in the layer's own space against the same rectangle (RECT_KIND, filter 5).
// Any comp-space `reason` on a focus layer makes it "can't check" and holds the pass; on another
// layer it drops that comparison and lists it in not_compared, never "didn't move" (FR-018, filter
// 6). Other changes come from layer_info for every layer, never unexpectedChanges(), which walks
// keyed properties only and would miss every unkeyed anchor change (filter 1).

import * as compSpace from "./comp-space.mjs";
import { byIndex, byName, layerInfo } from "./layer-info.mjs";
import { motionSources } from "./motion-sources.mjs";
import { classOf } from "./visibility.mjs";
import {
  analyze, anchorKeyCount, DEMO_MATCH_PX, footprintOpts, inPlace, keyedLayer, MOVE_PX, placeNow, placePoint,
  positionKeyCount, positionKeyTimes, rectOf,
} from "./anchor.mjs";

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const r3 = (v) => Math.round(v * 1000) / 1000 + 0;
const VALUE_TOL = 0.01;
const TIME_TOL = 0.0005;
const differ = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return a !== b;
  return Math.abs(a[0] - b[0]) > VALUE_TOL || Math.abs(a[1] - b[1]) > VALUE_TOL;
};

// ---- Matching (FR-019): by name when it's unique in both reads, else by index

export function matchLayer(baseline, current, entry) {
  const b = byName(baseline, entry.name);
  const c = byName(current, entry.name);
  if (b.length === 1 && c.length === 1) return c[0];
  if (c.length >= 1) return c.find((x) => x.index === entry.index) || null;
  // The name is gone: the same index and kind, with a name the baseline doesn't have, when no layer
  // was added or removed, is this layer renamed.
  const sameCount = layerInfo(baseline).layers.length === layerInfo(current).layers.length;
  const x = sameCount ? byIndex(current, entry.index) : null;
  return x && x.kind === entry.kind && byName(baseline, x.name).length === 0 ? x : null;
}

// ---- Footprint comparisons

function edges(fb, fc) {
  const e = {
    left: r3(Math.abs(fc.bounds.left - fb.bounds.left)), top: r3(Math.abs(fc.bounds.top - fb.bounds.top)),
    right: r3(Math.abs(fc.bounds.right - fb.bounds.right)), bottom: r3(Math.abs(fc.bounds.bottom - fb.bounds.bottom)),
  };
  const dx = (fc.bounds.left + fc.bounds.right - fb.bounds.left - fb.bounds.right) / 2;
  const dy = (fc.bounds.top + fc.bounds.bottom - fb.bounds.top - fb.bounds.bottom) / 2;
  return { edges_px: e, max: Math.max(e.left, e.top, e.right, e.bottom), dx: r3(dx), dy: r3(dy) };
}

function direction(dx, dy) {
  const v = Math.abs(dy) > MOVE_PX ? (dy > 0 ? "down" : "up") : null;
  const h = Math.abs(dx) > MOVE_PX ? (dx > 0 ? "right" : "left") : null;
  return v && h ? `${v}-${h}` : v || h || null;
}

// Footprints of the same layer at time t in both reads: { moved, ...edges } or { reason }.
function compare(space, baseline, bi, current, ci, t, kind) {
  if (!isNum(t)) return { reason: "not_sampled" };
  const fb = space.footprint(baseline, bi, t, footprintOpts(kind));
  if (fb.reason || !fb.bounds) return { reason: fb.reason || "no_rect", side: "before" };
  const fc = space.footprint(current, ci, t, footprintOpts(kind));
  if (fc.reason || !fc.bounds) return { reason: fc.reason || "no_rect", side: "now" };
  const e = edges(fb, fc);
  return { moved: e.max > MOVE_PX + 1e-9, ...e };
}

const timesOf = (entry) => (entry && Array.isArray(entry.samples) ? entry.samples.map((s) => s.time).filter(isNum) : []);
const common = (a, b) => a.filter((t) => b.some((u) => Math.abs(u - t) <= TIME_TOL));

// Every layer below a focus layer in the Parent chain (children turn with its new pivot at other
// times, which is the point, FR-012 item 5).
function descendantsOf(baseline, index) {
  const ms = motionSources(baseline);
  return (ms.layers || []).filter((l) => Array.isArray(l.parents) && l.parents.some((p) => p.layer_index === index)).map((l) => l.layer_index);
}

// The layer's own sampled anchor, position, scale or rotation differ between two reads at one time.
function rawChanged(bs, cs) {
  if (!bs || !cs) return false;
  for (const k of ["anchor", "position", "scale"]) {
    const a = bs[k];
    const b = cs[k];
    if (Array.isArray(a) && Array.isArray(b) && a.some((v, i) => isNum(v) && isNum(b[i]) && Math.abs(v - b[i]) > VALUE_TOL)) return true;
  }
  return isNum(bs.rotation) && isNum(cs.rotation) && Math.abs(bs.rotation - cs.rotation) > VALUE_TOL;
}

// ---- Other changes (FR-019), from layer_info for every layer

export function otherChanges(baseline, current, focusIndexes = []) {
  const out = [];
  const base = layerInfo(baseline).layers;
  const cur = layerInfo(current).layers;
  const matched = new Set();
  for (const b of base) {
    const c = matchLayer(baseline, current, b);
    if (!c) { out.push({ kind: "layer_removed", layer: b.name }); continue; }
    matched.add(c.index);
    if (c.name !== b.name) out.push({ kind: "renamed", layer: b.name, now: c.name });
    if (b.enabled !== c.enabled && typeof b.enabled === "boolean" && typeof c.enabled === "boolean") {
      out.push({ kind: "eye_changed", layer: b.name, eye_on: c.enabled, was_class: classOf(baseline, b.index) });
    }
    if (!focusIndexes.includes(b.index)) {
      const ts = common(timesOf(b), timesOf(c));
      const at = (e, t) => compSpace.sampleAt(e, t);
      if (ts.some((t) => at(b, t) && at(c, t) && Array.isArray(at(b, t).anchor) && Array.isArray(at(c, t).anchor) && differ(at(b, t).anchor, at(c, t).anchor))) {
        out.push({ kind: "anchor_changed", layer: b.name });
      }
    }
    const bk = keyedLayer(baseline, b.index);
    const ck = keyedLayer(current, c.index);
    if (anchorKeyCount(ck) > anchorKeyCount(bk)) out.push({ kind: "keys_added", layer: b.name, property: "Anchor Point" });
    if (positionKeyCount(ck) > positionKeyCount(bk)) out.push({ kind: "keys_added", layer: b.name, property: "Position" });
  }
  for (const c of cur) if (!matched.has(c.index)) out.push({ kind: "layer_added", layer: c.name });
  return out;
}

// ---- Hints (data-model › Hint codes): one code per TD § 7 row, from one field combination each

export function hintCodes(r, others = []) {
  if (r.cant_check && r.cant_check.length) return ["cant_check"];
  if (r.passed) return others.some((o) => o.kind === "eye_changed" && o.was_class === "matte" && o.eye_on) ? ["matte_eye"] : [];
  if (r.locked) return ["locked"];
  const codes = [];
  const i1 = r.item1;
  const i2 = r.item2;
  const away = !!(r.item3 && r.item3.set_away_from_rest);
  const wrongLayer = !r.anchor_changed && others.some((o) => o.kind === "anchor_changed");
  if (away) codes.push("away_from_rest");
  else if (!i2.passed) {
    if (r.anchor_changed && !r.position_changed) codes.push("moved_with_pivot");
    else if (r.position_changed && !r.anchor_changed) codes.push("layer_dragged");
    else if (r.rect_shifted) codes.push("group_anchor");
    // TD § 7 "in place but moved": the pivot is where they wanted it, but the layer moved too
    // (both values changed, or something else of its own did).
    else if (i1.passed) codes.push("in_place_moved");
    // Not in place and moved: the layer moved with whatever changed.
    else codes.push(r.anchor_changed ? "moved_with_pivot" : "layer_dragged");
  }
  if (wrongLayer) codes.push("wrong_layer");
  else if (i2.passed && !i1.passed) {
    if (i1.place_now === "outside") codes.push("outside");
    else if (i1.place_now === "between" || (i1.place_now === "center" && i1.wanted !== "center")) codes.push("not_moved_enough");
    else if (i1.place_now) codes.push("neighbour_place");
  }
  if (r.item4 && !r.item4.passed && i2.passed) codes.push("slid_at_key");
  if (r.item5 && r.item5.anchor_keys_added) codes.push("stopwatch");
  // TD § 7 "another layer moved": the focus layer holds items 1 to 4, and another layer's bounds
  // moved (item5.moved_layers names it and which way). Separate from wrong_layer, where the focus
  // layer's pivot never moved.
  if (!wrongLayer && i1.passed && i2.passed && (!r.item4 || r.item4.passed) && r.item5 && r.item5.moved_layers.length) codes.push("other_layer_moved");
  if (others.some((o) => o.kind === "eye_changed" && o.was_class === "matte" && o.eye_on)) codes.push("matte_eye");
  return codes;
}

// ---- The check

// `lesson`: { comp_id, baseline, targets, skill_options, exclude?, demo? }. `space` stands in for
// comp-space.mjs in tests (a wrapped call returning a reason, such as singular).
export function check(baseline, current, lesson, { space = compSpace } = {}) {
  const compMatches = !!current.comp && current.comp.id === lesson.comp_id &&
    (baseline.project === undefined || current.project === baseline.project);
  if (!compMatches) {
    return { comp_matches: false, passed: false, lesson_comp: baseline.comp.name, layers: [], other_changes: [], demo_undone: false };
  }
  const a = analyze(baseline, { exclude: lesson.exclude || [], skill_options: lesson.skill_options || {} });
  const targets = (lesson.targets || []).map((id) => Number(String(id).split("/")[1]));
  const focusEntries = targets.map((i) => byIndex(baseline, i)).filter(Boolean);
  const focusIndexes = focusEntries.map((e) => e.index);
  const others = otherChanges(baseline, current, focusIndexes);
  const fps = baseline.comp.frame_rate;
  const half = isNum(fps) && fps > 0 ? 0.5 / fps + 1e-6 : 0;
  const demoIndex = lesson.demo && lesson.demo.segment_id ? Number(String(lesson.demo.segment_id).split("/")[1]) : null;
  let demoUndone = false;

  // Item 5 is one look at every layer outside the focus.
  const childrenAt = new Map(); // child index -> the focus layer's check time
  for (const e of focusEntries) {
    const t = a.check_times[e.name] ? a.check_times[e.name].time : null;
    for (const d of descendantsOf(baseline, e.index)) if (!focusIndexes.includes(d)) childrenAt.set(d, t);
  }
  const moved = [];
  const notCompared = [];
  for (const b of layerInfo(baseline).layers) {
    if (focusIndexes.includes(b.index)) continue;
    const c = matchLayer(baseline, current, b);
    if (!c) continue; // a removed layer is an other change
    const times = childrenAt.has(b.index) ? [childrenAt.get(b.index)] : common(timesOf(b), timesOf(c));
    let worst = null;
    let rawMoved = null;
    for (const t of times) {
      const cmp = compare(space, baseline, b.index, current, c.index, t, b.kind);
      if (cmp.reason) {
        notCompared.push({ layer: b.name, time: isNum(t) ? r3(t) : null, reason: cmp.reason });
        // Review S4: the footprint can't be read, but the layer's own transform can. A change there
        // means it moved (how far on screen isn't known), never "didn't move".
        if (!rawMoved && isNum(t) && rawChanged(space.sampleAt(b, t), space.sampleAt(c, t))) rawMoved = { layer: b.name, time: r3(t) };
        continue;
      }
      if (cmp.moved && (!worst || cmp.max > worst.max)) worst = { layer: b.name, time: r3(t), max: cmp.max, dx: cmp.dx, dy: cmp.dy };
    }
    if (worst) moved.push({ layer: worst.layer, time: worst.time, distance_px: r3(Math.hypot(worst.dx, worst.dy)), direction: direction(worst.dx, worst.dy) });
    else if (rawMoved) moved.push({ layer: rawMoved.layer, time: rawMoved.time, distance_px: null, direction: null, from_transform: true });
  }

  const layers = focusEntries.map((b) => {
    const place = a.places[b.name] ? a.places[b.name].place : null;
    const ct = a.check_times[b.name] || { time: null, basis: "current" };
    const t = ct.time;
    const c = matchLayer(baseline, current, b);
    const cant = [];
    const out = { layer: b.name, credit: "learner", check_time: isNum(t) ? r3(t) : null, basis: ct.basis };
    if (!c) {
      return { ...out, item1: null, item2: null, item3: null, item4: null, item5: null, cant_check: [{ what: "layer", reason: "not_found" }], passed: false, hints: ["cant_check"] };
    }
    const bs = isNum(t) ? space.sampleAt(b, t) : null;
    const cs = isNum(t) ? space.sampleAt(c, t) : null;
    const bRect = rectOf(bs, b.kind);
    const cRect = rectOf(cs, c.kind);
    if (!bs || !cs) cant.push({ what: "pivot", reason: "not_sampled" });
    else if (!bRect || !cRect) cant.push({ what: "pivot", reason: "no_rect" });

    // Item 1, in the layer's own space at the check time.
    const item1 = cs && cRect && place ? { passed: inPlace(cs.anchor, cRect, place), place_now: placeNow(cs.anchor, cRect), wanted: place } : { passed: false, place_now: null, wanted: place };

    // Item 2, comp space at the check time.
    const cmp = compare(space, baseline, b.index, current, c.index, t, b.kind);
    if (cmp.reason) cant.push({ what: "footprint", reason: cmp.reason });
    const item2 = cmp.reason ? { passed: false, edges_px: null, direction: null, distance_px: null }
      : { passed: !cmp.moved, edges_px: cmp.edges_px, direction: cmp.moved ? direction(cmp.dx, cmp.dy) : null, distance_px: r3(Math.hypot(cmp.dx, cmp.dy)) };

    // Item 3: is the read's own time the rest key, and was the pivot set away from it?
    const now = current.comp.time;
    const atRest = isNum(now) && isNum(t) && Math.abs(now - t) <= half;
    let away = null;
    if (isNum(now) && space.sampleAt(b, now) && space.sampleAt(c, now)) {
      const atNow = compare(space, baseline, b.index, current, c.index, now, b.kind);
      away = atNow.reason ? null : !item2.passed && !cmp.reason && !atNow.moved;
    }
    const item3 = { at_rest: atRest, set_away_from_rest: away };

    // Item 4: a Position-keyed layer holds still at every Position key time of the first read.
    let item4 = null;
    const pkt = positionKeyTimes(keyedLayer(baseline, b.index));
    if (pkt.length) {
      let worst = null;
      let readAll = true;
      for (const k of pkt) {
        const ck = compare(space, baseline, b.index, current, c.index, k, b.kind);
        if (ck.reason) { readAll = false; cant.push({ what: "position_key", time: r3(k), reason: ck.reason }); continue; }
        if (!worst || ck.max > worst.max) worst = { time: r3(k), dx: ck.dx, dy: ck.dy, max: ck.max };
      }
      item4 = { passed: readAll && !!worst && worst.max <= MOVE_PX + 1e-9, worst: worst ? { time: worst.time, dx: worst.dx, dy: worst.dy } : null };
    }

    const anchorKeysAdded = anchorKeyCount(keyedLayer(current, c.index)) > anchorKeyCount(keyedLayer(baseline, b.index));
    const item5 = { passed: moved.length === 0 && !anchorKeysAdded, moved_layers: moved, anchor_keys_added: anchorKeysAdded, not_compared: notCompared };

    const anchorChanged = !!(bs && cs) && differ(bs.anchor, cs.anchor);
    const positionChanged = !!(bs && cs) && differ(bs.position, cs.position);
    const rectShifted = !anchorChanged && !!(bRect && cRect) && (Math.abs(bRect.left - cRect.left) > VALUE_TOL || Math.abs(bRect.top - cRect.top) > VALUE_TOL);

    // Credit (FR-016): the demo's while its anchor is as the demo wrote it.
    if (demoIndex === b.index) {
      if (lesson.demo.undone) out.credit = "learner";
      else {
        const written = bRect && place ? placePoint(bRect, place) : null;
        const same = written && cs && Array.isArray(cs.anchor) && Math.abs(cs.anchor[0] - written[0]) <= DEMO_MATCH_PX && Math.abs(cs.anchor[1] - written[1]) <= DEMO_MATCH_PX;
        out.credit = same ? "demo" : "undone";
        if (!same) demoUndone = true;
      }
    }

    const r = {
      ...out, item1, item2, item3, item4, item5,
      anchor_changed: anchorChanged, position_changed: positionChanged, rect_shifted: rectShifted,
      locked: c.locked === true, cant_check: cant,
    };
    r.passed = cant.length === 0 && item1.passed && item2.passed && (!item4 || item4.passed) && item5.passed;
    r.hints = hintCodes(r, others);
    return r;
  });

  return {
    comp_matches: true,
    // The check read's own time (where the playhead was), so the rest hint names a real time.
    time: isNum(current.comp.time) ? r3(current.comp.time) : null,
    passed: layers.length > 0 && layers.every((l) => l.passed),
    layers,
    other_changes: others,
    demo_undone: demoUndone,
  };
}

// What anchor_check samples (FR-013): the focus layers' check times, the baseline's comp.time and
// the focus layers' Position key times.
export function checkSampleTimes(baseline, lesson) {
  const a = analyze(baseline, { exclude: lesson.exclude || [], skill_options: lesson.skill_options || {} });
  const times = [];
  for (const ct of Object.values(a.check_times)) if (isNum(ct.time)) times.push(ct.time);
  if (isNum(baseline.comp.time)) times.push(baseline.comp.time);
  for (const id of lesson.targets || []) times.push(...positionKeyTimes(keyedLayer(baseline, Number(String(id).split("/")[1]))));
  const out = [];
  for (const t of times.sort((x, y) => x - y)) if (!out.some((u) => Math.abs(u - t) <= TIME_TOL)) out.push(r3(t));
  return out;
}
