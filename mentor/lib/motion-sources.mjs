// FR-014's motion-sources map, step 1 (spec 004 wave B, research R19; data-model › Motion-sources
// map): per layer, its own keys and its Parent chain, with "not_read" wherever the reads don't reach.
// It never says a layer has no expressions or that a precomp is empty: expressions on unkeyed or
// turned-off properties wait for read R2, and what's inside a precomp for read R4 (wave D).
//
// Without layer_info: `known: false`, one entry per keyed layer, `parents` and `children` null and
// `read.parents` "not_read".

import { layerInfo } from "./layer-info.mjs";
import { visibility } from "./visibility.mjs";

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

const movesChildren = (keyedLayer) =>
  !!keyedLayer && keyedLayer.properties.some((p) => p.keys.length > 0 && p.path.startsWith(TRANSFORM) && MOVES.has(p.path.slice(TRANSFORM.length)));

export function motionSources(snapshot) {
  const { known, layers: info } = layerInfo(snapshot);
  const keyed = new Map((snapshot.layers || []).map((l) => [l.index, l]));
  const classes = new Map(visibility(snapshot).map((v) => [v.layer_index, v.class]));
  const precomps = new Set((snapshot.precomp_layers || []).map((l) => l.index));
  const read = { own_keys: true, parents: known ? true : "not_read", expressions: "keyed_only", precomp_contents: "not_read" };

  const entry = (index, name, isPrecomp, parents, children) => {
    const own = ownKeys(keyed.get(index));
    return {
      layer_index: index, layer: name, class: classes.get(index) ?? null,
      own_keys: own,
      parents,
      children,
      expressions: { status: "not_read", on_keyed: own.filter((k) => k.expression_on).map(({ property, path }) => ({ property, path })) },
      precomp_contents: isPrecomp ? "not_read" : "not_a_precomp",
      static_as_read: own.length === 0 && Array.isArray(parents) && parents.length === 0,
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
      parents.push({ layer_index: p.index, layer: p.name, class: classes.get(p.index) ?? null, shy: p.shy, moves_children: movesChildren(keyed.get(p.index)) });
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
