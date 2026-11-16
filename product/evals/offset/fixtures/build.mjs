#!/usr/bin/env node
// Builds spec 015's offset fixture (case 44, T035) from this set's own synthetic dots-extras pair.
// Run from anywhere: node product/evals/offset/fixtures/build.mjs
// Both reads carry spec 015's fields (expressions, `base` on the samples), as a read after phase 1
// does. Tab has no keys and a Position expression that follows Dot 3, so when the learner staggers
// the Dots, Tab's value after its expression changes at the shared time (0.5 s) while its base
// Position does not. Neither the learner nor the layer was edited. Each file says `synthetic` at the
// top; the runner scrubs that before the mentor sees it.
//
// STAND-IN: re-derive from the T015 capture. The expression layer here is hand-added to the Dots
// comp; a live capture of a comp with an expression that follows a staggered layer replaces it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYN = path.join(HERE, "synthetic");
const read = (f) => JSON.parse(fs.readFileSync(path.join(SYN, f), "utf8"));
const write = (name, obj) => fs.writeFileSync(path.join(SYN, name), JSON.stringify(obj, null, 2) + "\n");

const BASE_POS = [620, 480, 0];
function withTabExpression(file, followed, note) {
  const r = read(file);
  const tab = r.layer_info.find((l) => l.name === "Tab");
  if ((r.layers || []).some((l) => l.name === "Tab")) throw new Error("Tab should have no keys");
  const t0 = { ...tab.samples[0], base: { position: BASE_POS } };
  tab.samples = [t0, { ...t0, time: 0.5, position: followed, base: { position: BASE_POS } }];
  for (const l of r.layer_info) if (!l.effects) l.effects = [];
  r.expressions = [{
    layer: tab.index, path: "ADBE Transform Group/ADBE Position", display_path: "Transform › Position", group: "transform", keys: 0,
    enabled: true, active: true, error: null,
    text: 'thisComp.layer("Dot 3").transform.position + [0, 200]', text_length: 52, text_cut: false,
  }];
  r.expressions_read = "all";
  r.expression_sweeps = [];
  r.measured_layers = [];
  r.synthetic = note;
  return r;
}

write("dots-extras-expression-follows.json", withTabExpression("dots-extras.json", [640, 360, 0],
  "Case 44 (spec 015 T035): dots-extras.json with spec 015's fields; Tab's Position expression follows Dot 3 (before the stagger)."));
write("dots-extras-expression-follows-staggered.json", withTabExpression("dots-extras-bars-dragged.json", [700, 360, 0],
  "Case 44 (spec 015 T035): dots-extras-bars-dragged.json with spec 015's fields; Tab's value after its expression moved with Dot 3, its base Position unchanged."));
console.log("wrote offset fixtures");
