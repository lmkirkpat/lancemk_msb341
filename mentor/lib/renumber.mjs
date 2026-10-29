// Overlap audit 2026-10-29, OA-5 (spec 004 tasks-wave-b T440). Pair ids carry the layer index
// (analyze.mjs segmentId), and adding a null or duplicating a layer mid-lesson renumbers every layer
// below it. Before a check looks a pair up, this matches the baseline's layers to the comp now and
// gives back a copy of the comp now with each matched layer at its baseline index, so the stored ids
// (and the learner record, which never holds an index) stay as they are.
//
// Matching, in order:
//   1. a name that's on exactly one layer in both: that layer;
//   2. a name on more than one layer: the layer with the same keyed properties and key times, when
//      exactly one has them; if one layer of that name is left on each side, those two;
//   3. a baseline layer whose name is gone (renamed): the one unclaimed layer with the same key times,
//      else the layer at its own index when that layer's name is new.
// A baseline layer whose name is still there but can't be told apart from another is `unmatched`: it
// and the layers sharing its name are left out of both snapshots returned, and the check says it can't
// tell them apart instead of grading the wrong one. When nothing was renumbered, the comp now comes
// back unchanged (the same object), so a rename in place reads as it did before.
// Pure: no AE call, and neither snapshot is changed.

function layerList(snapshot) {
  const by = new Map();
  for (const l of snapshot.precomp_layers || []) by.set(l.index, l.name);
  for (const l of snapshot.layer_info || []) by.set(l.index, l.name);
  for (const l of snapshot.layers || []) by.set(l.index, l.name);
  return [...by].map(([index, name]) => ({ index, name })).sort((a, b) => a.index - b.index);
}

// What a layer's keys look like apart from their sides and values: each keyed property and its key
// times. A hold or an ease leaves it alone; moving a key changes it.
function keyTimes(snapshot, index) {
  const layer = (snapshot.layers || []).find((l) => l.index === index);
  if (!layer) return "[]";
  return JSON.stringify(layer.properties.map((p) => [p.path, p.keys.map((k) => k.time)]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)));
}

function remap(snapshot, toIndex, drop) {
  const s = structuredClone(snapshot);
  const at = (i) => (typeof i === "number" && toIndex.has(i) ? toIndex.get(i) : i);
  const keep = (l) => !drop.has(l.index);
  s.layers = (s.layers || []).filter(keep).map((l) => ({ ...l, index: at(l.index) }));
  if (Array.isArray(s.precomp_layers)) s.precomp_layers = s.precomp_layers.filter(keep).map((l) => ({ ...l, index: at(l.index) }));
  if (Array.isArray(s.layer_info)) {
    s.layer_info = s.layer_info.filter(keep).map((l) => {
      const out = { ...l, index: at(l.index), parent: drop.has(l.parent) ? null : at(l.parent) };
      if (l.matte && typeof l.matte.layer === "number") out.matte = { ...l.matte, layer: at(l.matte.layer) };
      return out;
    });
    s.layer_info.sort((a, b) => a.index - b.index);
  }
  s.layers.sort((a, b) => a.index - b.index);
  return s;
}

function without(snapshot, drop) {
  if (!drop.size) return snapshot;
  return remap(snapshot, new Map(), drop);
}

// → { baseline, current, unmatched: [{ index, name }], notes: [string] }. `baseline` and `current` are
// what to compare: the comp now at the baseline's indexes, and both without unmatched layers. `notes`
// are for the other-changes list.
export function alignLayers(baseline, current) {
  const B = layerList(baseline);
  const C = layerList(current);
  const same = B.length === C.length && B.every((b, i) => C[i].index === b.index && C[i].name === b.name);
  if (same) return { baseline, current, unmatched: [], notes: [] };

  const map = new Map(); // baseline index → current index
  const claimed = new Set();
  const ambiguous = new Set(); // baseline indexes
  const claim = (b, c) => { map.set(b, c); claimed.add(c); };
  const baseNames = new Set(B.map((b) => b.name));

  for (const name of baseNames) {
    const bs = B.filter((b) => b.name === name);
    const cs = C.filter((c) => c.name === name);
    if (!cs.length) continue;
    if (bs.length === 1 && cs.length === 1) { claim(bs[0].index, cs[0].index); continue; }
    const sigB = new Map(bs.map((b) => [b.index, keyTimes(baseline, b.index)]));
    const sigC = new Map(cs.map((c) => [c.index, keyTimes(current, c.index)]));
    for (const b of bs) {
      const twinsB = bs.filter((x) => sigB.get(x.index) === sigB.get(b.index)).length;
      const hits = cs.filter((c) => !claimed.has(c.index) && sigC.get(c.index) === sigB.get(b.index));
      const twinsC = cs.filter((c) => sigC.get(c.index) === sigB.get(b.index)).length;
      if (twinsB === 1 && twinsC === 1 && hits.length === 1) claim(b.index, hits[0].index);
    }
    const leftB = bs.filter((b) => !map.has(b.index));
    const leftC = cs.filter((c) => !claimed.has(c.index));
    if (leftB.length === 1 && leftC.length === 1) claim(leftB[0].index, leftC[0].index);
    else for (const b of leftB) ambiguous.add(b.index);
  }

  // Renamed layers: the name is gone from the comp now.
  const newNames = (c) => !baseNames.has(c.name);
  for (const b of B) {
    if (map.has(b.index) || ambiguous.has(b.index) || C.some((c) => c.name === b.name)) continue;
    const sig = keyTimes(baseline, b.index);
    const open = C.filter((c) => !claimed.has(c.index) && newNames(c));
    const bySig = sig === "[]" ? [] : open.filter((c) => keyTimes(current, c.index) === sig);
    const sameSigInB = B.filter((x) => !map.has(x.index) && keyTimes(baseline, x.index) === sig).length;
    if (bySig.length === 1 && sameSigInB === 1) { claim(b.index, bySig[0].index); continue; }
    const atIndex = open.find((c) => c.index === b.index);
    if (atIndex) claim(b.index, atIndex.index);
  }

  if (!ambiguous.size && [...map].every(([b, c]) => b === c)) return { baseline, current, unmatched: [], notes: [] };

  // Layers left out: the unmatched baseline layers, and in the comp now every unclaimed layer that has
  // one of their names.
  const lostNames = new Set(B.filter((b) => ambiguous.has(b.index)).map((b) => b.name));
  const dropCurrent = new Set(C.filter((c) => !claimed.has(c.index) && lostNames.has(c.name)).map((c) => c.index));
  const dropBase = new Set(ambiguous);

  // Unclaimed layers in the comp now (new ones) get indexes past every index either snapshot has.
  const toIndex = new Map();
  for (const [b, c] of map) toIndex.set(c, b);
  let next = Math.max(0, ...B.map((b) => b.index), ...C.map((c) => c.index)) + 1;
  for (const c of C) if (!claimed.has(c.index) && !dropCurrent.has(c.index)) toIndex.set(c.index, next++);

  return {
    baseline: without(baseline, dropBase),
    current: remap(current, toIndex, dropCurrent),
    unmatched: B.filter((b) => ambiguous.has(b.index)).map(({ index, name }) => ({ index, name })),
    notes: [...lostNames].map((n) => `More than one layer is named "${n}" now, so changes to them can't be told apart`),
  };
}
