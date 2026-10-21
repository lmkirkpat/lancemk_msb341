// A sample skill's pure analysis (contracts/skill-module.md › 1): one target per keyed Opacity
// property, by name, leaving out past targets in `exclude`. Not a real skill; it's here so the
// skill-module contract can be tested, and so the cockpit can copy it for quickstart › 6 (copy
// this file to mentor/lib/sample.mjs and ../tools/sample.mjs to mentor/tools/sample.mjs).

function candidates(snapshot, exclude = []) {
  const out = [];
  for (const layer of snapshot.layers) {
    for (const prop of layer.properties) {
      if (prop.display_name !== "Opacity" || prop.expression_enabled || prop.keys.length < 2) continue;
      if (exclude.some((e) => e.layer === layer.name && e.property === prop.display_name)) continue;
      out.push({ id: `${layer.index}/${prop.path}`, layer: layer.name, property: prop.display_name });
    }
  }
  return out;
}

export function analyze(snapshot, { focus_layers, exclude = [] } = {}) {
  const focus = focus_layers && focus_layers.length ? [...focus_layers] : null;
  const found = candidates(snapshot, exclude).filter((c) => !focus || focus.includes(c.layer));
  return {
    targets: found.map((c) => c.id),
    target_refs: found.map(({ layer, property }) => ({ layer, property })),
    demo_target: found.length >= 2 ? found[0].id : null,
    no_demo_reason: found.length === 0 ? "nothing_to_teach" : found.length === 1 ? "single_target" : null,
    focus,
  };
}

export function focus(snapshot, { exclude = [] } = {}) {
  const found = candidates(snapshot, exclude);
  return { count: found.length, layers: [...new Set(found.map((c) => c.layer))] };
}
