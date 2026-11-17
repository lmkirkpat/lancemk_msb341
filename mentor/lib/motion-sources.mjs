// FR-014's motion-sources map, step 1 (spec 004 wave B, research R19; data-model › Motion-sources
// map): per layer, its own keys and its Parent chain, with "not_read" wherever the reads don't reach.
// It never says a layer has no expressions or that a precomp is empty: what's inside a precomp
// waits for read R4.
//
// Spec 015 (FR-005, data-model § 3): with read R2 in the snapshot, `read.expressions` is "all", each
// layer's `expressions` is { status: "read", list }, and a parent moves its children when it has
// keys on a moving transform property or a source transform expression (on, no error) whose sweep
// varies (K3; a constant one doesn't, E19). An older snapshot keeps "keyed_only" and `on_keyed`.
//
// Without layer_info: `known: false`, one entry per keyed layer, `parents` and `children` null and
// `read.parents` "not_read".

import { layerInfo } from "./layer-info.mjs";
import { visibility } from "./visibility.mjs";
import { expressionReads, expressionsRead } from "./expressions.mjs";

// Keys on these are inherited by a child; Opacity and effects aren't.
const MOVES = new Set([
  "ADBE Anchor Point", "ADBE Position", "ADBE Position_0", "ADBE Position_1", "ADBE Position_2",
  "ADBE Scale", "ADBE Rotate Z", "ADBE Rotate X", "ADBE Rotate Y", "ADBE Orientation",
]);
const TRANSFORM = "ADBE Transform Group/";

const groupOf = (path) => (path.startsWith(TRANSFORM) ? "transform" : path.startsWith("ADBE Effect Parade/") ? "effect" : "other");

function ownKeys(keyedLayer) {
  return (keyedLayer ? keyedLayer.properties : []).map((p) => ({
    property: p.display_name, path: p.path, display_path: p.display_path, keys: p.keys.length,
    group: groupOf(p.path), expression_on: !!p.expression_enabled,
  }));
}

const keysMove = (keyedLayer) =>
  !!keyedLayer && keyedLayer.properties.some((p) => p.keys.length > 0 && p.path.startsWith(TRANSFORM) && MOVES.has(p.path.slice(TRANSFORM.length)));

// A source transform expression on a property a child inherits moves the children when its sweep
// varies. With no sweep read for it, it counts as moving: "may move" is safer than "still".
const exprMoves = (list) => list.some((x) => x.active && x.group === "transform" && MOVES.has(x.path.slice(TRANSFORM.length)) &&
  (x.moves.status === "not_read" ? x.moves.reason !== "not_running" : x.moves.varies === true));

function movedBy(keyedLayer, exprList) {
  const k = keysMove(keyedLayer);
  const e = !!exprList && exprMoves(exprList);
  return { moves_children: k || e, moves_by: k && e ? "both" : k ? "keys" : e ? "expression" : null };
}

export function motionSources(snapshot) {
  const { known, layers: info } = layerInfo(snapshot);
  const keyed = new Map((snapshot.layers || []).map((l) => [l.index, l]));
  const classes = new Map(visibility(snapshot).map((v) => [v.layer_index, v.class]));
  const precomps = new Set((snapshot.precomp_layers || []).map((l) => l.index));
  const er = expressionReads(snapshot);
  const exprRead = er.read === "all";
  const exprOf = new Map();
  for (const x of er.list) exprOf.set(x.layer_index, [...(exprOf.get(x.layer_index) || []), x]);
  const read = { own_keys: true, parents: known ? true : "not_read", expressions: exprRead ? "all" : "keyed_only", precomp_contents: "not_read" };

  const entry = (index, name, isPrecomp, parents, children) => {
    const own = ownKeys(keyed.get(index));
    const mine = exprOf.get(index) || [];
    const expressions = exprRead
      ? { status: "read", list: mine }
      : { status: "not_read", on_keyed: own.filter((k) => k.expression_on).map(({ property, path }) => ({ property, path })) };
    return {
      layer_index: index, layer: name, class: classes.get(index) ?? null,
      own_keys: own,
      parents,
      children,
      expressions,
      precomp_contents: isPrecomp ? "not_read" : "not_a_precomp",
      // Static only as far as the reads reach: with read R2, no own keys, no own source expression
      // and no parents. Without it, the same as before (keys and parents only), since read.expressions
      // already says "keyed_only".
      static_as_read: own.length === 0 && Array.isArray(parents) && parents.length === 0 && !(exprRead && mine.some((x) => x.active)),
    };
  };

  if (!known) {
    return { known, read, layers: (snapshot.layers || []).map((l) => entry(l.index, l.name, precomps.has(l.index), null, null)) };
  }

  const byIdx = new Map(info.map((l) => [l.index, l]));
  const layers = info.map((l) => {
    const parents = [];
    const seen = new Set([l.index]);
    for (let p = byIdx.get(l.parent); p && !seen.has(p.index); p = byIdx.get(p.parent)) {
      seen.add(p.index);
      const by = movedBy(keyed.get(p.index), exprRead ? exprOf.get(p.index) || [] : null);
      parents.push({ layer_index: p.index, layer: p.name, class: classes.get(p.index) ?? null, shy: p.shy, ...(exprRead ? by : { moves_children: by.moves_children }) });
    }
    const children = info.filter((c) => c.parent === l.index).map((c) => ({ layer_index: c.index, layer: c.name }));
    return entry(l.index, l.name, l.kind === "precomp" || precomps.has(l.index), parents, children);
  });
  return { known, read, layers };
}

// One layer's entry by index or name, or null for a layer that isn't in the active comp. With two
// layers of the same name, the first in index order: callers that need a specific one use the index.
export function sourcesOf(snapshot, nameOrIndex) {
  const { layers } = motionSources(snapshot);
  const match = typeof nameOrIndex === "number" ? (l) => l.layer_index === nameOrIndex : (l) => l.layer === nameOrIndex;
  return layers.find(match) || null;
}

// Spec 015 FR-015 (K3; data-model § 4): where a layer's motion comes from, for the pivot and null
// snapshot tools only (OQ-3). { own_keys, own_expressions, parents: [{ layer, by }] } with only the
// parents that move their children, or not_read when read R2 or layer_info isn't in the snapshot,
// so a parent's expression is never said to be absent.
export function motionFrom(snapshot, index) {
  const map = motionSources(snapshot);
  // The read's own reason: older_snapshot, error or partial (review).
  if (map.read.expressions !== "all") return expressionsRead(snapshot);
  if (!map.known) return { status: "not_read", reason: "no_layer_info" };
  const e = map.layers.find((l) => l.layer_index === index);
  if (!e) return { status: "not_read", reason: "not_found" };
  return {
    own_keys: e.own_keys.length > 0,
    own_expressions: e.expressions.list.filter((x) => x.active).map((x) => x.property),
    parents: e.parents.filter((p) => p.moves_children).map((p) => ({ layer: p.layer, by: p.moves_by })),
  };
}
