// Fixture twin of mentor/jsx/speed-graph-demo.jsx (spec 004 contracts/skill-module.md › 5; spec 008
// contracts/tools.md): the same edit on a saved snapshot, so evals and tests run without After
// Effects. Never writes a fixture file.

import { MentorError } from "../errors.mjs";
import { DEMO_IN, DEMO_OUT } from "../lib/speed-graph.mjs";

function findPair(snapshot, { layer_index, property_path, key_index }) {
  const layer = snapshot.layers.find((l) => l.index === layer_index);
  const prop = layer && layer.properties.find((p) => p.path === property_path);
  if (!prop) throw new Error(`Fixture has no property ${layer_index}/${property_path}`);
  const from = prop.keys[key_index - 1];
  const to = prop.keys[key_index];
  if (!from || !to) throw new Error(`Keys ${key_index} and ${key_index + 1} don't exist on ${prop.display_path}.`);
  return { layer, prop, from, to };
}

// Key i's out side and key i+1's in side to the fingerprint, speeds kept; nothing else changes.
export function apply(snapshot, edit) {
  const { layer, prop, from, to } = findPair(snapshot, edit);
  from.out_type = "bezier";
  from.out_ease = (from.out_ease || []).map((e) => ({ speed: e.speed, influence: DEMO_OUT }));
  to.in_type = "bezier";
  to.in_ease = (to.in_ease || []).map((e) => ({ speed: e.speed, influence: DEMO_IN }));
  return { layer, prop, from, to };
}

export function run(args, { snapshot, saveEdit }) {
  if (snapshot.comp.id !== args.comp_id) throw new MentorError("NO_ACTIVE_COMP");
  const edit = { layer_index: args.layer_index, property_path: args.property_path, key_index: args.key_index };
  const { layer, prop, from, to } = apply(snapshot, edit);
  saveEdit(edit);
  return {
    layer: layer.name,
    property: prop.display_name,
    display_path: prop.display_path,
    from_time: from.time,
    to_time: to.time,
    dimensions: Math.max(from.out_ease.length, to.in_ease.length),
    out_influence: from.out_ease.map((e) => e.influence),
    in_influence: to.in_ease.map((e) => e.influence),
  };
}
