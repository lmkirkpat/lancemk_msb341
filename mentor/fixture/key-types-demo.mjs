// Fixture twin of mentor/jsx/key-types-demo.jsx (spec 004 contracts/skill-module.md › 5, spec 009
// contracts/tools.md): the same one write on a saved snapshot. The key's outgoing side becomes hold;
// its incoming side too only when HOLD_SIDES is "both". Values, eases and every other key stay.

import { MentorError } from "../errors.mjs";
import { HOLD_SIDES } from "../lib/key-types.mjs";

function findKey(snapshot, { layer_index, property_path, key_index }) {
  const layer = snapshot.layers.find((l) => l.index === layer_index);
  const prop = layer && layer.properties.find((p) => p.path === property_path);
  if (!prop) throw new Error(`Fixture has no property ${layer_index}/${property_path}`);
  const from = prop.keys[key_index - 1];
  const to = prop.keys[key_index];
  if (!from || !to) throw new Error(`Fixture has no key pair ${key_index} on ${prop.display_path}`);
  return { layer, prop, from, to };
}

export function apply(snapshot, edit) {
  const { from } = findKey(snapshot, edit);
  from.out_type = "hold";
  if (HOLD_SIDES === "both") from.in_type = "hold";
  return snapshot;
}

export function run(args, { snapshot, saveEdit }) {
  if (snapshot.comp.id !== args.comp_id) throw new MentorError("NO_ACTIVE_COMP");
  const edit = { layer_index: args.layer_index, property_path: args.property_path, key_index: args.key_index };
  apply(snapshot, edit);
  const { layer, prop, from, to } = findKey(snapshot, edit);
  saveEdit(edit);
  return {
    layer: layer.name, property: prop.display_name, display_path: prop.display_path,
    from_time: from.time, to_time: to.time, in_type: from.in_type, out_type: from.out_type,
  };
}
