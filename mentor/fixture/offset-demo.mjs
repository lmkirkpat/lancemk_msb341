// Fixture twin of mentor/jsx/offset-demo.jsx (spec 004 contracts/skill-module.md › 5; spec 010
// FR-024): shifts every key on the given properties of one layer later by a whole number of frames,
// keeping each key's value, types and ease, so evals run without After Effects. Same refusals as
// the snippet, before anything is saved.

import { MentorError } from "../errors.mjs";
import { demoRefusal, refused } from "../lib/offset.mjs";

const r3 = (t) => Math.round(t * 1000) / 1000;

export function run(args, { snapshot, saveEdit }) {
  if (snapshot.comp.id !== args.comp_id) {
    throw new MentorError("NO_ACTIVE_COMP", "The active comp isn't the lesson's comp. Switch back to it, then ask for the demonstration again.");
  }
  const layer = snapshot.layers.find((l) => l.index === args.layer_index);
  if (!layer) throw new Error(`Layer ${args.layer_index} isn't in this comp.`);
  const props = args.property_paths.map((p) => {
    const prop = layer.properties.find((x) => x.path === p);
    if (!prop) throw new Error(`Fixture has no property ${args.layer_index}/${p}`);
    return prop;
  });
  const reason = demoRefusal(snapshot, args);
  if (reason) throw refused(reason);
  saveEdit({ layer_index: args.layer_index, property_paths: [...args.property_paths], shift_frames: args.shift_frames });
  return {
    layer: layer.name,
    properties: props.map((p) => p.display_name),
    shift_frames: args.shift_frames,
    keys_moved: props.reduce((n, p) => n + p.keys.length, 0),
  };
}

// Adds shift_frames / frame_rate to every key time on the edit's properties; nothing else changes.
export function apply(snapshot, edit) {
  const layer = snapshot.layers.find((l) => l.index === edit.layer_index);
  if (!layer) throw new Error(`Fixture has no layer ${edit.layer_index} to replay the offset demo on`);
  const by = edit.shift_frames / snapshot.comp.frame_rate;
  for (const prop of layer.properties.filter((p) => edit.property_paths.includes(p.path))) {
    for (const k of prop.keys) k.time = r3(k.time + by);
  }
  return snapshot;
}
