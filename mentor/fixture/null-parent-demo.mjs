// Fixture twin of mentor/jsx/null-parent-demo.jsx (spec 004 contracts/skill-module.md › 5; spec 012
// FR-018): parents one layer to the lesson's null with no jump on a saved snapshot, so evals run
// without After Effects. As After Effects does, it rewrites the layer's keyed and sampled position,
// scale and rotation into the null's space, using the null as it is at the current time, and leaves
// the anchor point alone. Same refusals as the snippet, before anything is saved.

import { MentorError } from "../errors.mjs";
import { refused } from "../lib/null-parenting-check.mjs";
import { compMatrix, invert, apply as applyMatrix } from "../lib/comp-space.mjs";
import { byIndex } from "../lib/layer-info.mjs";

const TF = "ADBE Transform Group/";
const r3 = (v) => Math.round(v * 1000) / 1000 + 0;

const refuse = refused;

// The layer at `index` with `name`, or null: a renumbered or renamed layer is never guessed.
const match = (snapshot, index, name) => {
  const l = byIndex(snapshot, index);
  return l && l.name === name ? l : null;
};

// The null's comp-space matrix at `time`, split into what a child's own values need. Null when it
// can't be inverted (a Scale of 0) or wasn't sampled.
function nullSpace(snapshot, nullIndex, time) {
  const { matrix } = compMatrix(snapshot, nullIndex, time);
  const inv = matrix ? invert(matrix) : null;
  if (!inv) return null;
  const [a, b, c, d] = matrix;
  const sx = Math.hypot(a, b);
  return { inv, sx, sy: (a * d - b * c) / sx, rotation: (Math.atan2(b, a) * 180) / Math.PI };
}

export function run(args, { snapshot, saveEdit }) {
  if (snapshot.comp.id !== args.comp_id) {
    throw new MentorError("NO_ACTIVE_COMP", "The active comp isn't the lesson's comp. Switch back to it, then ask for the demonstration again.");
  }
  const target = match(snapshot, args.layer_index, args.layer_name);
  const nul = match(snapshot, args.null_index, args.null_name);
  if (!target || !nul) throw refuse("not_found");
  if (!nul.is_null) throw refuse("null_fails_n1");
  if (nul.three_d) throw refuse("null_fails_n2");
  if (target.locked === true) throw refuse("locked");
  if (target.parent != null) throw refuse("already_parented");
  if (target.three_d) throw refuse("three_d");
  if (!nullSpace(snapshot, nul.index, snapshot.comp.time)) throw refuse("null_scale_zero");
  saveEdit({ layer_name: target.name, null_name: nul.name, time: snapshot.comp.time });
  return { layer: target.name, null: nul.name, parent: nul.name };
}

function rewrite(space, { position, scale, rotation }) {
  const out = {};
  if (Array.isArray(position)) {
    const [x, y] = applyMatrix(space.inv, [position[0], position[1]]);
    out.position = [r3(x), r3(y), ...position.slice(2)];
  }
  if (Array.isArray(scale)) out.scale = [r3(scale[0] / space.sx), r3(scale[1] / space.sy), ...scale.slice(2)];
  if (typeof rotation === "number") out.rotation = r3(rotation - space.rotation);
  return out;
}

// Replays the parenting on a later snapshot of the same comp (layers found by name).
export function apply(snapshot, edit) {
  const info = snapshot.layer_info || [];
  const target = info.find((l) => l.name === edit.layer_name);
  const nul = info.find((l) => l.name === edit.null_name);
  if (!target || !nul) throw new Error(`Fixture has no ${edit.layer_name} or ${edit.null_name} to replay the parenting on`);
  if (target.parent === nul.index) return snapshot; // already replayed
  const space = nullSpace(snapshot, nul.index, edit.time);
  if (!space) throw new Error("The null can't be inverted at the demo's time");
  const keyed = (snapshot.layers || []).find((l) => l.index === target.index);
  const props = keyed ? keyed.properties : [];
  // Separated X and Y first, while the samples still hold comp-space values (the layer has no
  // parent yet): each key's other dimension is the layer's sample at that time.
  const atTime = (t) => (target.samples || []).find((x) => Math.abs(x.time - t) < 0.0005);
  for (const [path, dim] of [[TF + "ADBE Position_0", 0], [TF + "ADBE Position_1", 1]]) {
    const prop = props.find((p) => p.path === path);
    for (const k of prop ? prop.keys : []) {
      const s = atTime(k.time) || { position: target.transform.position };
      const pt = dim === 0 ? [k.value, s.position[1]] : [s.position[0], k.value];
      k.value = r3(applyMatrix(space.inv, pt)[dim]);
    }
  }
  for (const s of target.samples || []) Object.assign(s, rewrite(space, s));
  if (target.transform) Object.assign(target.transform, rewrite(space, target.transform));
  target.parent = nul.index;
  for (const p of props) {
    if (p.path === TF + "ADBE Position") for (const k of p.keys) k.value = rewrite(space, { position: k.value }).position;
    if (p.path === TF + "ADBE Scale") for (const k of p.keys) k.value = rewrite(space, { scale: k.value }).scale;
    if (p.path === TF + "ADBE Rotate Z") for (const k of p.keys) k.value = rewrite(space, { rotation: k.value }).rotation;
  }
  return snapshot;
}
