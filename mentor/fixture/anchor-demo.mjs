// Fixture twin of mentor/jsx/anchor-demo.jsx (spec 004 contracts/skill-module.md › 5; spec 011
// FR-015, FR-029): writes the server's Anchor Point and Position into one layer of a saved
// snapshot, its `transform` and every sample (neither is keyed, so they're constant), and leaves
// `rect` alone, so evals run without After Effects. Same refusals as the snippet, before anything
// is saved.

import { MentorError } from "../errors.mjs";
import { byIndex } from "../lib/layer-info.mjs";
import { demoRefusal, keyedLayer, refused } from "../lib/anchor.mjs";

const r3 = (v) => Math.round(v * 1000) / 1000 + 0;
const two = (v) => [r3(v[0]), r3(v[1])];
const SEPARATED = /^ADBE Transform Group\/ADBE Position_[01]$/;

export function run(args, { snapshot, saveEdit }) {
  if (snapshot.comp.id !== args.comp_id) {
    throw new MentorError("NO_ACTIVE_COMP", "The active comp isn't the lesson's comp. Switch back to it, then ask for the demonstration again.");
  }
  const entry = byIndex(snapshot, args.layer_index);
  if (!entry || entry.name !== args.layer_name) throw refused("not_found");
  const reason = demoRefusal(snapshot, entry, { rest_time: args.rest_time ?? null });
  if (reason) throw refused(reason);
  const before = entry.transform || {};
  saveEdit({ layer_index: args.layer_index, anchor: [...args.anchor], position: [...args.position] });
  const kl = keyedLayer(snapshot, entry.index);
  return {
    layer: entry.name,
    anchor_before: Array.isArray(before.anchor) ? two(before.anchor) : null,
    anchor_after: two(args.anchor),
    position_before: Array.isArray(before.position) ? two(before.position) : null,
    position_after: two(args.position),
    // A saved read only shows separation on a keyed Position; the snippet reads it from AE.
    separated: !!(kl && kl.properties.some((p) => SEPARATED.test(p.path))),
  };
}

// Writes x and y of the anchor and position (keeping z) into `transform` and every sample.
export function apply(snapshot, edit) {
  const entry = byIndex(snapshot, edit.layer_index);
  if (!entry) throw new Error(`Fixture has no layer ${edit.layer_index} to replay the pivot demo on`);
  const set = (v, xy) => (Array.isArray(v) ? [xy[0], xy[1], ...v.slice(2)] : [xy[0], xy[1]]);
  if (entry.transform) {
    entry.transform.anchor = set(entry.transform.anchor, edit.anchor);
    entry.transform.position = set(entry.transform.position, edit.position);
  }
  for (const s of entry.samples || []) {
    s.anchor = set(s.anchor, edit.anchor);
    s.position = set(s.position, edit.position);
  }
  return snapshot;
}
