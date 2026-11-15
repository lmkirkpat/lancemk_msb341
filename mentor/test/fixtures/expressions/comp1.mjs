// Comp 1 with spec 015's reads, for the SC-001 to SC-003 and K2 tests.
//
// When T015's live capture `comp1.json` is here, comp1() returns it. Until then (Comp 1 is the
// builder's own project, closed during the phase 1 build), it derives the same fields from the two
// committed live reads, never by hand:
// - `expressions`: the three texts, paths and key counts from `ask/comp1-ground-truth.json` (a
//   read-only script, AE 27.0). On and error-free per the ask baseline's live check (AB follow-up,
//   spec 015 US1 scenario 1); the ground truth doesn't store those two flags.
// - `layer_info[].effects`: the ground truth's effect names (match name assumed equal to the name,
//   as the ground truth's paths use it).
// - `samples[].base` on Shake Control: Position (960, 540, 0), the ground truth's value before the
//   expression (no keys, so the same at every time); Rotation, the 0.5 s sample's own value, where
//   every impact term is sin(0) = 0, so after equals base.
// - No sweeps: `expression_sweeps` is empty, so every "how much it moves" reads as not read.
//
// `derived: true` marks the derived snapshot, so a test can say which one it ran on.

import fs from "node:fs";

const here = (name) => new URL(`./${name}`, import.meta.url);
const ask = (name) => new URL(`../ask/${name}`, import.meta.url);
const load = (url) => JSON.parse(fs.readFileSync(url, "utf8"));

export const LIVE = fs.existsSync(here("comp1.json"));

const pathOf = (gt) => {
  // Ground truth: "/ADBE Effect Parade/CC Light Sweep/CC Light Sweep-0001". The snippet's paths
  // index the Effects list's children (mentor/jsx/lib/paths.jsx).
  const parts = gt.split("/").filter(Boolean);
  if (parts[0] === "ADBE Effect Parade") parts[1] = `${parts[1]}#1`;
  return parts.join("/");
};
const displayOf = (path, name) => {
  const parts = path.split("/");
  if (parts[0] === "ADBE Transform Group") return `Transform › ${name}`;
  if (parts[0] === "ADBE Effect Parade") return `Effects › ${parts[1].replace(/#\d+$/, "")} › ${name}`;
  return name;
};
const groupOf = (path) => (path.startsWith("ADBE Transform Group/") ? "transform" : path.startsWith("ADBE Effect Parade/") ? "effect" : "other");

export function derived() {
  const snap = load(ask("comp1-snapshot.json"));
  const truth = load(ask("comp1-ground-truth.json"));
  const expressions = [];
  for (const l of truth.layers) {
    for (const a of l.animated) {
      if (typeof a.expression !== "string") continue;
      const path = pathOf(a.path);
      expressions.push({
        layer: l.index, path, display_path: displayOf(path, a.name), group: groupOf(path), keys: a.keys,
        enabled: true, active: true, error: null, text: a.expression, text_length: a.expression.length, text_cut: false,
      });
    }
  }
  for (const info of snap.layer_info) {
    const t = truth.layers.find((l) => l.index === info.index);
    info.effects = t.effects.map((name) => ({ name, match_name: name }));
  }
  const shake = snap.layer_info.find((l) => l.name === "Shake Control");
  const truthShake = truth.layers.find((l) => l.name === "Shake Control");
  const basePos = truthShake.position_pre_expr_t0.split(",").map(Number);
  const rot0 = shake.samples.find((s) => s.time === 0.5).rotation;
  for (const s of shake.samples) s.base = { position: basePos, rotation: rot0 };
  return { ...snap, expressions, expressions_read: "all", expression_sweeps: [], measured_layers: [], derived: true };
}

export const comp1 = () => (LIVE ? load(here("comp1.json")) : derived());
export const groundTruth = () => load(ask("comp1-ground-truth.json"));
