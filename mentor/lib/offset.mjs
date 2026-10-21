// Skill 3, break the lockstep with offset (spec 010): groups, the proposal, the demo target and the
// check. Pure, no AE calls.
//
// Every start, landing, move and exclusion comes from the shared timing analysis (timing() and
// clusters(), spec 004 FR-016); this file only applies spec 004 FR-027's floor to them (FR-002).
// Raw-key reads (other changes, per-dimension shifts, keys outside the comp) are offset-keys.mjs.

import { needsEase, segmentState } from "./analyze.mjs";
import { clusters, timing } from "./timing.mjs";
import { MentorError, registerErrors } from "../errors.mjs";
import { dimensionShifts, isMoved, matchLayer, movedApart, otherChanges, outOfComp } from "./offset-keys.mjs";

export const SKILL = "timing.offset";
const MAX_LAYERS = 5;
const SEPARATED = /^ADBE Transform Group\/ADBE Position_[012]$/;

// ---- The floor (FR-023, research R1)

// Key times are read to the millisecond, so two keys exactly 2 frames apart can read as 1.98
// frames (0.967 s and 1.033 s at 30 fps). This much of a frame is allowed for that rounding.
const READ_SLACK = 0.1;

// Spec 004 FR-027: under 2 frames apart or under 1/15 s, whichever is longer, is "the same". Never
// shown to the learner, and the only threshold this skill has.
export function floorFrames(fps) {
  return Math.max(2, fps / 15);
}

export function isSame(a, b, fps) {
  return Math.abs(a - b) * fps < floorFrames(fps) - READ_SLACK;
}

// A gap the learner picked that still reads as together (FR-007).
export const gapUnderFloor = (gapFrames, fps) => isSame(0, gapFrames / fps, fps);

// ---- The demo's refusals (FR-010), shared by the tool, the snippet's twin and the snippet's rules

export const REFUSED_MESSAGE = "I can't shift that one without changing something I shouldn't, so I've left it as it was.";
registerErrors({ OFFSET_REFUSED: REFUSED_MESSAGE });

const REFUSAL_TEXT = {
  past_comp_end: "A key would land after the end of the comp.",
  locked: "That layer is locked.",
  gap_under_floor: "That gap is small enough that it would still read as together.",
  not_whole_frames: "The gap has to be a whole number of frames, at least one.",
};
export const REFUSAL_REASONS = Object.keys(REFUSAL_TEXT);

// The error for a refusal, in plain words; `reason` stays on the error for tests and logs.
export function refused(reason) {
  const e = new MentorError("OFFSET_REFUSED", `${REFUSED_MESSAGE} ${REFUSAL_TEXT[reason] || ""}`.trim());
  e.reason = reason;
  return e;
}

// Why the demo can't shift `property_paths` on layer `layer_index` by `shift_frames`, or null.
export function demoRefusal(snapshot, { layer_index, property_paths, shift_frames }) {
  const fps = snapshot.comp.frame_rate;
  if (!Number.isInteger(shift_frames) || shift_frames < 1) return "not_whole_frames";
  if (gapUnderFloor(shift_frames, fps)) return "gap_under_floor";
  const layer = snapshot.layers.find((l) => l.index === layer_index);
  if (layer && layer.locked === true) return "locked";
  const props = layer ? layer.properties.filter((p) => property_paths.includes(p.path)) : [];
  const last = Math.max(...props.flatMap((p) => p.keys.map((k) => k.time)));
  if (props.length && last + shift_frames / fps > snapshot.comp.duration + 1e-6) return "past_comp_end";
  return null;
}

// ---- Names

const norm = (s) => String(s).trim().toLowerCase();

// The name a unit goes by in the record and to the learner: "Position" for a separated Position,
// else the property's own name ("Opacity", "Blurriness").
function unitName(snapLayer, unit) {
  if (unit.paths.every((p) => SEPARATED.test(p))) return "Position";
  const prop = snapLayer && snapLayer.properties.find((p) => p.path === unit.paths[0]);
  return prop ? prop.display_name : unit.unit.split(" › ").pop();
}

const snapLayerOf = (snapshot, index) => snapshot.layers.find((l) => l.index === index);

// Units that count for this skill: counted by the timing analysis and not among `exclude` (a
// review's past targets, FR-020).
function liveUnits(snapshot, tl, exclude) {
  const sl = snapLayerOf(snapshot, tl.layer_index);
  return tl.units
    .filter((u) => !u.excluded)
    .map((u) => ({ ...u, name: unitName(sl, u) }))
    .filter((u) => !exclude.some((e) => e.layer === tl.layer && e.property === u.name));
}

const startOf = (units) => (units.length ? Math.min(...units.flatMap((u) => u.starts)) : null);

const hasExpression = (snapLayer, paths) =>
  !!snapLayer && snapLayer.properties.some((p) => p.expression_enabled && p.keys.length > 0 && (!paths || paths.includes(p.path)));

// ---- Groups (FR-004 to FR-006, research R2)

// Every layer the comp has, with its counted units and its start under `exclude`, and why it's
// eligible or not. `allow` names layers the learner added, which may be hidden (FR-004).
function layerPool(snapshot, t, { exclude = [], allow = [] } = {}) {
  return t.layers.map((tl) => {
    const units = liveUnits(snapshot, tl, exclude);
    const start = startOf(units);
    let why = null;
    if (tl.is_null) why = "null";
    else if (tl.precomp) why = "precomp";
    else if (tl.enabled === false && !allow.includes(tl.layer)) why = "hidden";
    else if (start == null) why = "no_motion";
    return { tl, units, start, why };
  });
}

const groupRank = (a, b) => b.members.length - a.members.length || a.start - b.start || a.members[0].layer_index - b.members[0].layer_index;

function layerGroups(pool, fps) {
  const events = pool.filter((p) => !p.why).map((p) => ({ time: p.start, layer_index: p.tl.layer_index, layer: p.tl.layer, units: p.units }));
  const out = [];
  for (const cluster of clusters(events, (floorFrames(fps) - READ_SLACK) / fps)) {
    // Pairwise, not chained (FR-008): A–B and B–C the same doesn't make A–C the same.
    let rest = cluster;
    while (rest.length >= 2) {
      const g = [rest[0]];
      for (const e of rest.slice(1)) if (g.every((m) => isSame(m.time, e.time, fps))) g.push(e);
      if (g.length >= 2) {
        const members = g.sort((a, b) => a.layer_index - b.layer_index).slice(0, MAX_LAYERS)
          .map((e) => ({ layer_index: e.layer_index, layer: e.layer, label: e.layer, start: e.time, units: e.units.map((u) => u.name) }));
        out.push({ kind: "layers", members, start: Math.min(...members.map((m) => m.start)), end: null });
      }
      rest = rest.filter((e) => !g.includes(e));
    }
  }
  return out.sort(groupRank);
}

// On one layer: units with one move each whose start and landing are both the same (S-1). A unit
// joins through the first move that matches, in time order, and the group remembers which.
function propertyGroupsOn(entry, fps) {
  const { tl, units } = entry;
  const moves = units.flatMap((u, ui) => u.moves.map((m, mi) => ({ ui, u, move_index: mi + 1, start: m.start, end: m.end })))
    .sort((a, b) => a.start - b.start || a.end - b.end || a.ui - b.ui);
  const used = new Set();
  const out = [];
  for (const anchor of moves) {
    if (used.has(anchor.ui)) continue;
    const g = [anchor];
    units.forEach((u, ui) => {
      if (ui === anchor.ui || used.has(ui)) return;
      const m = moves.find((x) => x.ui === ui && g.every((y) => isSame(y.start, x.start, fps) && isSame(y.end, x.end, fps)));
      if (m) g.push(m);
    });
    if (g.length < 2) continue;
    g.forEach((m) => used.add(m.ui));
    const members = g.sort((a, b) => a.ui - b.ui).map((m) => ({
      layer_index: tl.layer_index, layer: tl.layer, unit: m.u.unit, property: m.u.name, label: m.u.name,
      paths: m.u.paths, move_index: m.move_index, start: m.start, end: m.end,
    }));
    out.push({ kind: "properties", layer: tl.layer, members, start: members[0].start, end: members[0].end });
  }
  return out;
}

function propertyGroups(pool, fps) {
  return pool.filter((p) => !p.why).flatMap((p) => propertyGroupsOn(p, fps)).sort(groupRank);
}

// Both kinds' groups, best first, and the layer pool they came from.
export function groups(snapshot, { exclude = [], focus_layers, allow = [] } = {}) {
  const t = timing(snapshot);
  const fps = t.frame_rate;
  let pool = layerPool(snapshot, t, { exclude, allow });
  if (focus_layers && focus_layers.length) pool = pool.filter((p) => focus_layers.includes(p.tl.layer));
  return { layers: layerGroups(pool, fps), properties: propertyGroups(pool, fps), pool, timing: t };
}

// What the mentor names as left out (TD § 4): nulls, hidden layers, precomps, and properties an
// expression drives.
function leftOut(pool) {
  const by = (why) => pool.filter((p) => p.why === why).map((p) => p.tl.layer);
  const out = [];
  for (const reason of ["null", "hidden", "precomp"]) {
    const layers = by(reason);
    if (layers.length) out.push({ reason, layers });
  }
  const expr = pool.filter((p) => p.why !== "null" && p.why !== "precomp" && p.why !== "hidden")
    .flatMap((p) => p.tl.units.filter((u) => u.excluded === "expression").map((u) => ({ layer: p.tl.layer, unit: u })));
  if (expr.length) {
    out.push({
      reason: "expression",
      layers: [...new Set(expr.map((e) => e.layer))],
      properties: expr.map((e) => ({ layer: e.layer, property: e.unit.unit.split(" › ").pop() })),
    });
  }
  return out;
}

// ---- The lesson's group from the learner's choices (FR-006, FR-007, research R4)

const KINDS = ["layers", "properties"];

function namedGroup(kind, names, found, snapshot, opts) {
  const refused = [];
  if (kind === "layers") {
    const members = [];
    for (const name of names) {
      const entry = found.pool.find((p) => p.tl.layer === name);
      if (!entry) continue;
      if (entry.why) {
        refused.push({ layer: name, reason: entry.why });
        continue;
      }
      members.push({ layer_index: entry.tl.layer_index, layer: name, label: name, start: entry.start, units: entry.units.map((u) => u.name) });
    }
    members.sort((a, b) => a.layer_index - b.layer_index);
    const group = members.length >= 2 ? { kind, members, start: Math.min(...members.map((m) => m.start)), end: null } : null;
    return { group, refused };
  }
  // Properties: the best group on the layers they named.
  for (const name of names) {
    const entry = found.pool.find((p) => p.tl.layer === name);
    if (entry && entry.why) refused.push({ layer: name, reason: entry.why });
  }
  const group = found.properties.find((g) => names.includes(g.layer)) || null;
  return { group, refused };
}

function matchesLabel(member, wanted) {
  const w = norm(wanted);
  return norm(member.label) === w || (member.unit && norm(member.unit) === w) || norm(`${member.layer} › ${member.label}`) === w;
}

// The members in the learner's order. Members they didn't name go after, in the group's order. The
// order counts as given once it names every member but at most the last.
function resolveOrder(group, order) {
  if (!group || !Array.isArray(order) || !order.length) return { ordered: null, unmatched: [], complete: false };
  const ordered = [];
  const unmatched = [];
  for (const o of order) {
    const m = group.members.find((x) => !ordered.includes(x) && matchesLabel(x, o));
    if (m) ordered.push(m);
    else unmatched.push(String(o));
  }
  const named = ordered.length;
  for (const m of group.members) if (!ordered.includes(m)) ordered.push(m);
  return { ordered, unmatched, complete: !unmatched.length && named >= group.members.length - 1 };
}

const targetId = (m) => (m.unit ? `${m.layer_index}/${m.unit}/${m.move_index}` : `layer/${m.layer_index}`);

function targetRefs(group) {
  if (!group) return [];
  if (group.kind === "properties") return group.members.map((m) => ({ layer: m.layer, property: m.property }));
  return group.members.flatMap((m) => m.units.map((u) => ({ layer: m.layer, property: u })));
}

// A frame inside the group's shared motion (stage 2): the middle of the time every member is moving.
function frameTogether(group, t) {
  if (!group) return null;
  const fps = t.frame_rate;
  let from;
  let to;
  if (group.kind === "properties") {
    from = Math.max(...group.members.map((m) => m.start));
    to = Math.min(...group.members.map((m) => m.end));
  } else {
    const firstMoves = group.members.map((m) => {
      const tl = t.layers.find((l) => l.layer_index === m.layer_index);
      const ms = tl.units.filter((u) => !u.excluded).flatMap((u) => u.moves).filter((x) => Math.abs(x.start - m.start) < 1e-9);
      return { start: m.start, end: Math.max(...ms.map((x) => x.end), m.start) };
    });
    from = Math.max(...firstMoves.map((x) => x.start));
    to = Math.min(...firstMoves.map((x) => x.end));
  }
  const mid = to > from ? (from + to) / 2 : from;
  return Math.round(Math.round(mid * fps) / fps * 1000) / 1000;
}

// Whether a member still has a pair that's linear at either end (FR-018: said once at "done" when
// easing isn't learned; never graded here). Easing's own pair states, not a copy.
function hasLinearPairs(snapshot, m) {
  const sl = snapLayerOf(snapshot, m.layer_index);
  const props = sl ? sl.properties.filter((p) => !p.expression_enabled && (!m.paths || m.paths.includes(p.path))) : [];
  return props.some((p) => p.keys.slice(1).some((k, i) => needsEase(segmentState(p.keys[i], k))));
}

const publicMember = (snapshot) => (m) => {
  const { units, paths, ...rest } = m;
  const out = m.unit ? { ...rest } : { ...rest, properties: units };
  return { ...out, target: targetId(m), has_linear_pairs: hasLinearPairs(snapshot, m) };
};
const publicGroup = (g, snapshot) => (g ? { kind: g.kind, ...(g.layer ? { layer: g.layer } : {}), start: g.start, end: g.end, members: g.members.map(publicMember(snapshot)) } : null);

// The analyzer the session calls (spec 004 data-model › Analyzer result, plus spec 010's fields).
// `kept_linear` is accepted and has no effect: constant speed isn't timing.
export function analyze(snapshot, opts = {}) {
  const { focus_layers, exclude = [], skill_options = {} } = opts;
  const known = new Set([...snapshot.layers.map((l) => l.name), ...(snapshot.precomp_layers || []).map((l) => l.name)]);
  for (const name of [...(focus_layers || []), ...(skill_options.members || [])]) {
    if (!known.has(name)) throw new MentorError("UNKNOWN_LAYER");
  }
  const named = Array.isArray(skill_options.members) && skill_options.members.length ? skill_options.members : null;
  const found = groups(snapshot, { exclude, focus_layers, allow: named || [] });
  const fps = found.timing.frame_rate;

  const best = { layers: found.layers[0] || null, properties: found.properties[0] || null };
  const size = (k) => (best[k] ? best[k].members.length : 0);
  const proposed_kind = !best.layers && !best.properties ? null : size("properties") >= size("layers") ? "properties" : "layers";
  const other = proposed_kind === "layers" ? "properties" : "layers";
  const other_kind = proposed_kind && best[other] ? other : null;

  const kind = KINDS.includes(skill_options.kind) ? skill_options.kind : proposed_kind;
  let group = kind ? best[kind] : null;
  let refused_members = [];
  if (named && kind) ({ group, refused: refused_members } = namedGroup(kind, named, found, snapshot, opts));

  const { ordered, unmatched, complete } = resolveOrder(group, skill_options.order);
  const gap = skill_options.gap_frames;
  const gapOk = Number.isInteger(gap) && gap >= 1;

  let demo_target = null;
  let no_demo_reason = null;
  if (!group) no_demo_reason = "no_group";
  else if (group.members.length === 2) no_demo_reason = "two_members";
  else if (!complete || !gapOk) no_demo_reason = "awaiting_order";
  else if (gapUnderFloor(gap, fps)) no_demo_reason = "gap_under_floor";
  else {
    // The second in their order, or the next one with no expression on a keyed property (FR-009).
    const pick = ordered.slice(1).find((m) => {
      const sl = snapLayerOf(snapshot, m.layer_index);
      return !hasExpression(sl, m.unit ? m.paths : null) && sl.enabled !== false;
    });
    if (pick) demo_target = targetId(pick);
    else no_demo_reason = "expression";
  }

  return {
    group: publicGroup(group, snapshot),
    proposed_kind,
    other_kind,
    // The other kind's best group, offered in one sentence (FR-006).
    other_group: kind ? publicGroup(best[kind === "layers" ? "properties" : "layers"], snapshot) : null,
    left_out: leftOut(found.pool),
    refused_members,
    order: ordered && complete ? ordered.map((m) => m.label) : null,
    order_unmatched: unmatched,
    gap_frames: gapOk ? gap : null,
    gap_under_floor: gapOk ? gapUnderFloor(gap, fps) : null,
    focus: group ? [...new Set(group.members.map((m) => m.layer))] : [],
    targets: group ? group.members.map(targetId) : [],
    target_refs: targetRefs(group),
    demo_target,
    no_demo_reason,
    frame_together: frameTogether(group, found.timing),
  };
}

// FINDERS["timing.offset"].focus: the members of the group the snapshot tool would propose with
// the same `exclude` (contract › 2).
export function finder(snapshot, { exclude = [] } = {}) {
  const a = analyze(snapshot, { exclude });
  return { count: a.group ? a.group.members.length : 0, layers: a.focus };
}

// ---- The check (FR-008, FR-011 to FR-015, research R6)

// Frames to a tenth: key times are read to the millisecond, so 4 frames can read as 3.99.
const r1 = (n) => Math.round(n * 10) / 10;
const frames = (a, b, fps) => (a == null || b == null ? null : r1((b - a) * fps));

// The lesson's members, rebuilt from its target IDs on the baseline.
function lessonMembers(baseline, lesson, bt) {
  const exclude = lesson.exclude || [];
  return (lesson.targets || []).map((id) => {
    const lm = /^layer\/(\d+)$/.exec(id);
    if (lm) {
      const tl = bt.layers.find((l) => l.layer_index === Number(lm[1]));
      const units = tl ? liveUnits(baseline, tl, exclude) : [];
      return { id, kind: "layers", layer_index: tl.layer_index, layer: tl.layer, label: tl.layer, units, start: startOf(units) };
    }
    const first = id.indexOf("/");
    const last = id.lastIndexOf("/");
    const index = Number(id.slice(0, first));
    const unit = id.slice(first + 1, last);
    const move_index = Number(id.slice(last + 1));
    const tl = bt.layers.find((l) => l.layer_index === index);
    const u = liveUnits(baseline, tl, []).find((x) => x.unit === unit);
    const move = u.moves[move_index - 1];
    return { id, kind: "properties", layer_index: index, layer: tl.layer, label: u.name, unit, paths: u.paths, move_index, moves: u.moves.length, start: move.start, end: move.end };
  });
}

function creditFor(member, lesson, startNow, fps) {
  if (!lesson.demo || lesson.demo.segment_id !== member.id) return null;
  const gap = lesson.skill_options && lesson.skill_options.gap_frames;
  if (startNow == null) return "learner";
  if (Number.isInteger(gap) && Math.abs((startNow - member.start) * fps - gap) < 0.5) return "demo";
  if (Math.abs((startNow - member.start) * fps) < 0.5) return "undone";
  return "learner";
}

export function check(baseline, current, lesson, { split = [] } = {}) {
  const comp_matches = !!current && current.comp.id === lesson.comp_id && current.project === baseline.project;
  if (!comp_matches) {
    return { comp_matches: false, lesson_comp: baseline.comp.name, members: [], still_same: [], order_differs: false, out_of_comp: [], other_changes: [], rhythm: null, gaps_frames: [], passed: false, demo_undone: false };
  }
  const fps = baseline.comp.frame_rate;
  const duration = current.comp.duration;
  const bt = timing(baseline);
  const ct = timing(current);
  const opts = lesson.skill_options || {};
  const splitBy = new Set([...(Array.isArray(opts.split) ? opts.split : []), ...(Array.isArray(split) ? split : [])]);
  const members = lessonMembers(baseline, lesson, bt);
  const kind = members.length && members[0].kind;

  const results = members.map((m) => {
    const bl = snapLayerOf(baseline, m.layer_index);
    const cl = matchLayer(baseline, current, bl);
    const ctl = cl ? ct.layers.find((l) => l.layer_index === cl.index) : null;
    const out = { target: m.id, label: m.kind === "layers" ? m.layer : `${m.layer} › ${m.label}`, layer: m.layer, layer_index_now: cl ? cl.index : null };
    if (m.kind === "layers") {
      const nowUnits = ctl ? m.units.map((u) => ctl.units.find((x) => x.unit === u.unit && !x.excluded) || null) : [];
      const startNow = ctl ? startOf(nowUnits.filter(Boolean)) : null;
      const moved_by = {};
      m.units.forEach((u, i) => (moved_by[u.name] = nowUnits[i] ? frames(Math.min(...u.starts), Math.min(...nowUnits[i].starts), fps) : null));
      const dims = dimensionShifts(bl, cl, fps);
      const shiftsList = Object.values(moved_by);
      const anyMoved = shiftsList.some(isMoved) || Object.values(dims).some(isMoved);
      let splitInfo = null;
      if (anyMoved) {
        const ref = shiftsList.find(isMoved) ?? 0;
        const unitsApart = shiftsList.some((s) => s == null || movedApart(s, ref));
        const dimVals = Object.values(dims).filter((d) => d != null);
        const dimsApart = dimVals.some((d) => movedApart(d, dimVals[0]));
        if (unitsApart || dimsApart) {
          const names = Object.keys(moved_by);
          splitInfo = {
            moved: names.filter((n) => isMoved(moved_by[n])),
            stayed: names.filter((n) => !isMoved(moved_by[n])),
            within_position: dimsApart ? { moved: Object.keys(dims).filter((d) => isMoved(dims[d])), stayed: Object.keys(dims).filter((d) => !isMoved(dims[d])) } : null,
            on_purpose: splitBy.has(m.layer),
          };
        }
      }
      Object.assign(out, {
        start_before: m.start, start_now: startNow, moved_by, dimensions: Object.keys(dims).length ? dims : null,
        split: splitInfo, credit: creditFor(m, lesson, startNow, fps),
        status: startNow == null ? "keys_changed" : "graded",
      });
    } else {
      const nowUnit = ctl ? ctl.units.find((x) => x.unit === m.unit && !x.excluded) : null;
      const sameCount = nowUnit && nowUnit.moves.length === m.moves;
      const move = sameCount ? nowUnit.moves[m.move_index - 1] : null;
      const lands = move ? move.end <= duration + 1e-6 : false;
      Object.assign(out, {
        start_before: m.start, start_now: move ? move.start : null,
        end_before: m.end, end_now: move ? move.end : null,
        lands_in_comp: move ? lands : null,
        moved_by: { start: move ? frames(m.start, move.start, fps) : null, end: move ? frames(m.end, move.end, fps) : null },
        credit: creditFor(m, lesson, move ? move.start : null, fps),
        status: move ? "graded" : "keys_changed",
      });
    }
    return out;
  });

  const graded = results.filter((r) => r.status === "graded");
  const still_same = [];
  for (let i = 0; i < graded.length; i++) {
    for (let j = i + 1; j < graded.length; j++) {
      const a = graded[i];
      const b = graded[j];
      const startSame = isSame(a.start_now, b.start_now, fps);
      const together = kind === "layers" ? startSame : startSame && a.lands_in_comp && b.lands_in_comp && isSame(a.end_now, b.end_now, fps);
      if (together) still_same.push([a.label, b.label]);
    }
  }
  const unexplainedSplit = kind === "layers" && graded.some((r) => r.split && !r.split.on_purpose);

  // The learner's stated order against the order the starts now play in (TD § 7: ask, never fail).
  const order = Array.isArray(opts.order) ? opts.order : [];
  const stated = [];
  for (const o of order) {
    const i = members.findIndex((m, k) => results[k].status === "graded" && !stated.includes(results[k]) && matchesLabel(m, o));
    if (i >= 0) stated.push(results[i]);
  }
  let order_differs = false;
  for (let i = 0; i < stated.length; i++) {
    for (let j = i + 1; j < stated.length; j++) {
      if (stated[j].start_now < stated[i].start_now && !isSame(stated[i].start_now, stated[j].start_now, fps)) order_differs = true;
    }
  }

  // A member whose keys changed can't be compared, so it holds the pass until the learner says
  // whether that was on purpose and it's graded again or undone (spec 008 FR-014's rule, here too):
  // an ungraded member could still be in lockstep.
  const passed = graded.length >= 2 && graded.length === results.length && still_same.length === 0 && !unexplainedSplit;
  const starts = graded.map((r) => r.start_now).sort((a, b) => a - b);
  const gaps = starts.slice(1).map((s, i) => s - starts[i]);
  const gaps_frames = gaps.map((g) => Math.round(g * fps * 10) / 10);
  const rhythm = kind === "layers" && passed && graded.length >= 3
    ? { uneven: !isSame(Math.max(...gaps), Math.min(...gaps), fps) }
    : null;

  const refsNow = results.filter((r) => r.layer_index_now != null).map((r) => {
    const m = members.find((x) => x.id === r.target);
    return { layer_index: r.layer_index_now, ...(m.paths ? { paths: m.paths } : {}) };
  });
  const groupRefs = members.map((m) => ({ layer_index: m.layer_index, ...(m.paths ? { paths: m.paths } : {}) }));

  return {
    comp_matches: true,
    lesson_comp: baseline.comp.name,
    kind,
    members: results.map(({ layer_index_now, ...r }) => r),
    still_same,
    order_differs,
    out_of_comp: outOfComp(current, refsNow),
    other_changes: otherChanges(baseline, current, groupRefs),
    rhythm,
    gaps_frames,
    passed,
    demo_undone: results.some((r) => r.credit === "undone"),
  };
}
