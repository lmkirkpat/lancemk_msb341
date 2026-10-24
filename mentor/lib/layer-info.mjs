// Reads R1 and R3 per layer (spec 004 wave B, research R16; data-model › Wave B shapes): every layer
// in the active comp, keyed or not, from the snapshot's `layer_info`. A snapshot from before wave B
// has none, and `known: false` is how every consumer falls back to what it did before.

export function layerInfo(snapshot) {
  const list = snapshot && Array.isArray(snapshot.layer_info) ? snapshot.layer_info : null;
  return list ? { known: true, layers: list } : { known: false, layers: [] };
}

export function byIndex(snapshot, index) {
  return layerInfo(snapshot).layers.find((l) => l.index === index) || null;
}

// AE allows two layers with the same name, so this returns every one; callers that need one use the
// index.
export function byName(snapshot, name) {
  return layerInfo(snapshot).layers.filter((l) => l.name === name);
}
