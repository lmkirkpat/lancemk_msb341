// FR-013's one visibility class per layer (spec 004 wave B, research R18; data-model › Visibility
// class). First match wins: null → matte → hidden → guide → shy → renders. Solo never changes the
// class; `soloed_elsewhere` says another layer is soloed and this one isn't.
//
// Without layer_info (a snapshot from before wave B): `known: false`, one entry per keyed layer in
// `layers`, classed null, hidden (eye off) or renders, so every consumer behaves as it did before.
// What wasn't read (solo, shy) is null there, never false.

import { layerInfo } from "./layer-info.mjs";

export const CLASSES = ["null", "matte", "hidden", "guide", "shy", "renders"];

function classify(l) {
  if (l.is_null) return "null";
  if (l.is_matte) return "matte";
  if (l.enabled === false) return "hidden";
  if (l.guide) return "guide";
  if (l.shy) return "shy";
  return "renders";
}

export function visibility(snapshot) {
  const { known, layers } = layerInfo(snapshot);
  if (!known) {
    return (snapshot.layers || []).map((l) => ({
      layer_index: l.index, layer: l.name, class: classify({ is_null: l.is_null, enabled: l.enabled }), known: false,
      enabled: l.enabled, solo: null, soloed_elsewhere: null, shy: null, timeline_hidden: null,
    }));
  }
  const anySolo = layers.some((l) => l.solo === true);
  const hideShy = !!(snapshot.comp && snapshot.comp.hide_shy);
  return layers.map((l) => ({
    layer_index: l.index, layer: l.name, class: classify(l), known: true,
    enabled: l.enabled, solo: l.solo, soloed_elsewhere: anySolo && l.solo !== true, shy: l.shy,
    timeline_hidden: l.shy === true && hideShy,
  }));
}

// The class of the layer at `index`, or null when there's no such layer (in what was read).
export function classOf(snapshot, index) {
  const entry = visibility(snapshot).find((v) => v.layer_index === index);
  return entry ? entry.class : null;
}
