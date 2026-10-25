// Skill 6, move a group with a null (spec 012): candidates, the proposal, the P2 times, the
// analyzer and the finder. Pure, no AE calls.
//
// Every layer fact comes from the shared wave B reads (FR-002): the layer list from layer_info
// (never the keyed `layers`, filter 1), the class from visibility.mjs (never the eye switch alone,
// filter 2), parents and children from motion-sources.mjs, and every comp-space measure from
// comp-space.mjs. This file only sets the skill's own numbers: the 2% "nearly touch" gap, the 95%
// full-frame size, and 2 to 4 layers in a group. Layers are matched by name (filter 3): adding a
// null renumbers every layer below it.

import { MentorError } from "../errors.mjs";
import { byName, layerInfo } from "./layer-info.mjs";
import { footprint } from "./comp-space.mjs";
import { sourcesOf } from "./motion-sources.mjs";
import { classOf } from "./visibility.mjs";

export const SKILL = "parenting.null";
export const NEAR = 0.02; // FR-005: a gap of at most 2% of the comp's width on both axes "nearly touches"
const FULL_FRAME = 0.95; // research R1: bounds this big both ways are a full-frame layer
export const MIN_FOCUS = 2;
export const MAX_FOCUS = 4;
export const MAX_P2_TIMES = 63; // the snapshot keeps comp.time and 63 caller times per layer

const TF = "ADBE Transform Group/";
// The properties whose keys move a layer's footprint (FR-011's times).
export const FOOTPRINT_PATHS = new Set(["ADBE Anchor Point", "ADBE Position", "ADBE Position_0", "ADBE Position_1", "ADBE Scale", "ADBE Rotate Z"].map((p) => TF + p));
// Position, Scale and Rotation: what a demo target's keyed expression rules out (FR-008).
const MOVE_PATHS = new Set(["ADBE Position", "ADBE Position_0", "ADBE Position_1", "ADBE Scale", "ADBE Rotate Z"].map((p) => TF + p));

const r3 = (t) => Math.round(t * 1000) / 1000 + 0;
export const keyedLayer = (snapshot, index) => (snapshot.layers || []).find((l) => l.index === index) || null;
export const compWidth = (snapshot) => (snapshot.comp && typeof snapshot.comp.width === "number" && snapshot.comp.width > 0 ? snapshot.comp.width : null);
const compHeight = (snapshot) => (snapshot.comp && typeof snapshot.comp.height === "number" && snapshot.comp.height > 0 ? snapshot.comp.height : null);

// The one layer with this name, or null (none, or more than one).
export function uniqueLayer(snapshot, name) {
  const all = byName(snapshot, name);
  return all.length === 1 ? all[0] : null;
}

const excludedNames = (exclude) => new Set((exclude || []).map((e) => (typeof e === "string" ? e : e && e.layer)).filter(Boolean));

// ---- Candidates (FR-004, research R1)

// The reason a layer can't be in the focus, first match wins, and the bucket it goes in: `never`
// (can't be in the focus), `if_named` (only if the learner asks for it) or `default`.
const NEVER = new Set(["camera", "light", "null", "guide", "three_d", "parented", "auto_orient", "samples_truncated", "name_not_unique"]);

export function candidates(snapshot) {
  const { known, layers } = layerInfo(snapshot);
  if (!known) return [];
  const width = compWidth(snapshot);
  const height = compHeight(snapshot);
  const t = snapshot.comp.time;
  return layers.map((l) => {
    const cls = classOf(snapshot, l.index);
    const src = sourcesOf(snapshot, l.index);
    const fp = footprint(snapshot, l.index, t);
    const b = fp.bounds;
    // The matte pair: the matted layer names its matte; the matte is found from the layer it mattes.
    let partner = null;
    if (l.matte && typeof l.matte.layer === "number") partner = layers.find((x) => x.index === l.matte.layer) || null;
    else if (l.is_matte) partner = layers.find((x) => x.matte && x.matte.layer === l.index) || null;

    let reason = null;
    if (l.kind === "camera") reason = "camera";
    else if (l.kind === "light") reason = "light";
    else if (cls === "null") reason = "null";
    else if (cls === "guide") reason = "guide";
    else if (l.three_d) reason = "three_d";
    else if (l.parent != null) reason = "parented";
    else if (l.auto_orient) reason = "auto_orient"; // until live check L-4 (spec 004 T158)
    else if (l.samples_truncated) reason = "samples_truncated";
    else if (byName(snapshot, l.name).length > 1) reason = "name_not_unique";
    else if (cls === "hidden") reason = "hidden";
    else if (l.kind === "adjustment" || l.adjustment) reason = "adjustment";
    else if (!b) reason = "cant_read";
    else if (width && height && b.right - b.left >= FULL_FRAME * width && b.bottom - b.top >= FULL_FRAME * height) reason = "full_frame";

    const entry = {
      layer: l.name, index: l.index, bucket: reason == null ? "default" : NEVER.has(reason) ? "never" : "if_named", reason, class: cls,
      matte_pair: partner ? partner.name : null, bounds: b || null,
      has_children: !!(src && src.children && src.children.length),
      children: src && src.children ? src.children.map((c) => c.layer) : [],
    };
    if (reason === "parented" && src && src.parents && src.parents[0]) {
      entry.parent = src.parents[0].layer;
      entry.parent_is_null = src.parents[0].class === "null";
    }
    return entry;
  });
}

// ---- The proposal (FR-005, research R2)

function gapOk(a, b, tol) {
  const gx = Math.max(b.left - a.right, a.left - b.right);
  const gy = Math.max(b.top - a.bottom, a.top - b.bottom);
  return gx <= tol + 1e-9 && gy <= tol + 1e-9;
}

// Proposable units: a layer on its own, or a matte pair taken whole (both members proposable).
function units(cands, exclude) {
  const out = new Set(excludedNames(exclude));
  const ok = (c) => c && c.bucket === "default" && c.bounds && !out.has(c.layer);
  const byLayer = new Map(cands.map((c) => [c.layer, c]));
  const seen = new Set();
  const list = [];
  for (const c of cands) {
    if (seen.has(c.layer)) continue;
    if (c.matte_pair) {
      const p = byLayer.get(c.matte_pair);
      seen.add(c.layer);
      if (p) seen.add(p.layer);
      if (ok(c) && ok(p)) list.push({ members: [c, p].sort((a, b) => a.index - b.index) });
      continue;
    }
    seen.add(c.layer);
    if (ok(c)) list.push({ members: [c] });
  }
  for (const u of list) u.top = Math.min(...u.members.map((m) => m.index));
  return list.sort((a, b) => a.top - b.top);
}

const linked = (u, v, tol) => u.members.some((a) => v.members.some((b) => gapOk(a.bounds, b.bounds, tol)));

// { proposal: [names in stack order] | null, reason: null | "no_layer_info" | "no_comp_size" | "no_group" }
export function proposal(snapshot, { exclude = [] } = {}) {
  if (!layerInfo(snapshot).known) return { proposal: null, reason: "no_layer_info" };
  const width = compWidth(snapshot);
  if (!width) return { proposal: null, reason: "no_comp_size" }; // never a default size (SR-4)
  const tol = NEAR * width;
  const us = units(candidates(snapshot), exclude);

  // Linked groups by union-find over the units.
  const parent = us.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < us.length; i++) for (let j = i + 1; j < us.length; j++) if (linked(us[i], us[j], tol)) parent[find(i)] = find(j);
  const groups = new Map();
  us.forEach((u, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(u);
  });
  const size = (g) => g.reduce((n, u) => n + u.members.length, 0);
  const ranked = [...groups.values()].filter((g) => size(g) >= MIN_FOCUS)
    .sort((a, b) => size(b) - size(a) || Math.min(...a.map((u) => u.top)) - Math.min(...b.map((u) => u.top)));
  if (!ranked.length) return { proposal: null, reason: "no_group" };

  // Past 4: start from the top unit, then keep adding the first unit in stack order that links to
  // one already kept, until 4 (so the kept set is always one linked group). A matte pair is added
  // whole or not at all.
  const kept = [ranked[0][0]];
  let n = kept[0].members.length;
  for (;;) {
    const next = ranked[0].find((u) => !kept.includes(u) && n + u.members.length <= MAX_FOCUS && kept.some((k) => linked(k, u, tol)));
    if (!next || n >= MAX_FOCUS) break;
    kept.push(next);
    n += next.members.length;
  }
  const names = kept.flatMap((u) => u.members).sort((a, b) => a.index - b.index).map((m) => m.layer);
  return names.length >= MIN_FOCUS ? { proposal: names, reason: null } : { proposal: null, reason: "no_group" };
}

// ---- The P2 times (FR-011, research R4)

// The before-read time plus every key time on the layer's Anchor Point, Position (or X and Y),
// Scale and Rotation in the baseline, sorted.
export function p2Times(baseline, name) {
  const times = [r3(baseline.comp.time)];
  const info = uniqueLayer(baseline, name);
  const keyed = info ? keyedLayer(baseline, info.index) : null;
  for (const p of keyed ? keyed.properties : []) {
    if (FOOTPRINT_PATHS.has(p.path)) for (const k of p.keys) times.push(r3(k.time));
  }
  return [...new Set(times)].sort((a, b) => a - b);
}

// The union over the focus, at most 63 (the snapshot's cap less comp.time): the before-read time
// always, then the earliest of the rest; sorted.
export function allP2Times(baseline, focus) {
  const t0 = r3(baseline.comp.time);
  const rest = [...new Set((focus || []).flatMap((n) => p2Times(baseline, n)))].filter((t) => t !== t0).sort((a, b) => a - b);
  return [t0, ...rest.slice(0, MAX_P2_TIMES - 1)].sort((a, b) => a - b);
}

// ---- The focus the learner named (FR-004, FR-006)

// What stops `names` from being the focus: names another layer shares (`rename_needed`), names not
// in the comp (`unknown`), layers that can't be in a group (`refused`, with the reason), and a size
// outside 2 to 4 once matte partners are added (`size`). `focus` is the names with partners added,
// in stack order.
export function focusProblems(snapshot, names, { exclude = [] } = {}) {
  const cands = candidates(snapshot);
  const byLayer = new Map(cands.map((c) => [c.layer, c]));
  const out = excludedNames(exclude);
  const asked = [...new Set((names || []).map(String))];
  const rename_needed = asked.filter((n) => byName(snapshot, n).length > 1);
  const unknown = asked.filter((n) => byName(snapshot, n).length === 0);
  const refused = [];
  const focus = new Set();
  const added = [];
  for (const n of asked) {
    if (rename_needed.includes(n) || unknown.includes(n)) continue;
    const c = byLayer.get(n);
    if (c.bucket === "never" || out.has(n)) {
      refused.push({ layer: n, reason: out.has(n) ? "past_target" : c.reason, ...(c.parent ? { parent: c.parent } : {}) });
      continue;
    }
    focus.add(n);
    if (c.matte_pair && !focus.has(c.matte_pair) && !asked.includes(c.matte_pair)) {
      const p = byLayer.get(c.matte_pair);
      if (p && p.bucket !== "never") {
        focus.add(p.layer);
        added.push(p.layer);
      }
    }
  }
  const ordered = [...focus].sort((a, b) => byLayer.get(a).index - byLayer.get(b).index);
  const size = rename_needed.length || unknown.length || refused.length ? null
    : ordered.length < MIN_FOCUS ? "too_few" : ordered.length > MAX_FOCUS ? "too_many" : null;
  const ok = !rename_needed.length && !unknown.length && !refused.length && !size;
  return { ok, focus: ok ? ordered : null, rename_needed, unknown, refused, size, matte_added: added };
}

// ---- The demo target (FR-008, research R7)

export function demoTarget(snapshot, focus) {
  const byLayer = new Map(candidates(snapshot).map((c) => [c.layer, c]));
  const qualifies = [];
  for (const name of focus || []) {
    const c = byLayer.get(name);
    const info = uniqueLayer(snapshot, name);
    if (!c || !info) continue;
    if (!(c.class === "renders" || c.class === "shy") || info.enabled === false) continue;
    if (c.matte_pair || info.three_d || info.locked === true) continue;
    const keyed = keyedLayer(snapshot, info.index);
    const props = keyed ? keyed.properties : [];
    if (props.some((p) => MOVE_PATHS.has(p.path) && p.keys.length && p.expression_enabled)) continue;
    qualifies.push({ name, index: info.index, ownKeys: props.some((p) => FOOTPRINT_PATHS.has(p.path) && p.keys.length) });
  }
  qualifies.sort((a, b) => Number(b.ownKeys) - Number(a.ownKeys) || a.index - b.index);
  return qualifies.length ? `parent/${qualifies[0].name}` : null;
}

// ---- The analyzer (data-model › Analyzer result) and the finder (FR-003)

export function analyze(snapshot, opts = {}) {
  const { exclude = [], skill_options = {} } = opts;
  if (!layerInfo(snapshot).known) {
    return {
      known: false, candidates: [], proposal: null, no_proposal_reason: "no_layer_info", left_out: [], rename_needed: [],
      focus: null, targets: [], target_refs: [], demo_target: null, no_demo_reason: "no_layer_info",
      before_time: snapshot.comp ? snapshot.comp.time : null, p2_times: {}, notes: [],
    };
  }
  const cands = candidates(snapshot);
  const { proposal: proposed, reason } = proposal(snapshot, { exclude });
  const named = skill_options && Array.isArray(skill_options.focus) ? skill_options.focus : null;

  let focus = null;
  let rename_needed = [];
  let problems = null;
  if (named) {
    problems = focusProblems(snapshot, named, { exclude });
    rename_needed = problems.rename_needed;
    if (problems.unknown.length) throw new MentorError("UNKNOWN_LAYER", `${problems.unknown.join(", ")} isn't in the comp. Use the layer's name exactly as it appears in the comp.`);
    if (problems.ok) focus = problems.focus;
  }

  const ex = excludedNames(exclude);
  const left_out = cands.filter((c) => c.reason && c.reason !== "name_not_unique" && !ex.has(c.layer))
    .map((c) => ({ layer: c.layer, reason: c.reason, ...(c.parent ? { parent: c.parent, parent_is_null: c.parent_is_null } : {}) }));
  const notes = [];
  for (const name of focus || proposed || []) {
    const c = cands.find((x) => x.layer === name);
    if (!c) continue;
    if (c.has_children) notes.push({ layer: name, note: "brings_children", children: c.children });
    if (c.matte_pair) notes.push({ layer: name, note: "matte_pair", with: c.matte_pair });
    if (c.class === "shy") notes.push({ layer: name, note: "shy" });
    const info = layerInfo(snapshot).layers.find((l) => l.index === c.index);
    if (info && info.kind === "precomp") notes.push({ layer: name, note: "precomp" });
  }

  const demo_target = focus ? demoTarget(snapshot, focus) : null;
  const p2_times = {};
  for (const n of focus || []) p2_times[n] = p2Times(snapshot, n);
  return {
    known: true,
    candidates: cands,
    proposal: proposed,
    no_proposal_reason: reason,
    left_out,
    rename_needed,
    duplicate_names: [...new Set(cands.filter((c) => c.reason === "name_not_unique").map((c) => c.layer))],
    focus_problems: problems && !problems.ok ? { refused: problems.refused, size: problems.size, rename_needed: problems.rename_needed } : null,
    matte_added: problems ? problems.matte_added : [],
    focus,
    targets: (focus || []).map((n) => `parent/${n}`),
    target_refs: (focus || []).map((n) => ({ layer: n, property: "Parent" })),
    demo_target,
    no_demo_reason: !focus ? "awaiting_focus" : demo_target ? null : "no_qualifying_layer",
    before_time: snapshot.comp.time,
    p2_times,
    notes,
  };
}

// The size of the group null_parent_snapshot would propose with the same `exclude`; 0 without
// layer_info or the comp's size.
export function finder(snapshot, { exclude = [] } = {}) {
  const { proposal: p } = proposal(snapshot, { exclude });
  return { count: p ? p.length : 0, layers: p || [] };
}
