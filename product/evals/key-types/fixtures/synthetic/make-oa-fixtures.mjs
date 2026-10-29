// Overlap-audit re-run fixtures (2026-10-29, cases 27 to 31). Derived from the live Mentor Practice 2
// capture (mentor/test/fixtures/layer-info/practice2b.json), so they track it. Run: node make-oa-fixtures.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(HERE, "..", "..", "..", "..", "..", "mentor", "test", "fixtures", "layer-info", "practice2b.json");
const load = () => JSON.parse(fs.readFileSync(BASE, "utf8"));
const save = (name, d) => fs.writeFileSync(path.join(HERE, name), JSON.stringify(d, null, 2) + "\n");
const OPACITY = "ADBE Transform Group/ADBE Opacity";
const layer = (d, name) => d.layers.find((l) => l.name === name);
const prop = (d, name) => layer(d, name).properties.find((p) => p.path === OPACITY);

// Hold every Blink opacity pair the right way: the hold is on the key at the start of each pair.
function holdBlink(d) {
  const keys = prop(d, "Blink").keys;
  keys.forEach((k, i) => { if (i < keys.length - 1) k.out_type = "hold"; });
  return d;
}
// Insert a layer at `at`; every layer from there down moves one place.
function shiftDown(d, at) {
  const bump = (i) => (typeof i === "number" && i >= at ? i + 1 : i);
  for (const l of d.layers) l.index = bump(l.index);
  for (const l of d.precomp_layers || []) l.index = bump(l.index);
  for (const l of d.layer_info || []) {
    l.index = bump(l.index);
    l.parent = l.parent == null ? l.parent : bump(l.parent);
    if (l.matte && typeof l.matte.layer === "number") l.matte.layer = bump(l.matte.layer);
  }
}
function insertLayer(d, at, entry, info) {
  shiftDown(d, at);
  d.layers.push(entry);
  d.layers.sort((a, b) => a.index - b.index);
  d.layer_info.push(info);
  d.layer_info.sort((a, b) => a.index - b.index);
}
const blankLayer = (name, index, kind) => ({ index, name, kind, enabled: true, is_null: kind === "null", properties: [] });

// 27: Blink held correctly, and a null added at the top (Blink is layer 2 now).
{
  const d = holdBlink(load());
  const info = structuredClone(d.layer_info.find((l) => l.name === "Blink"));
  Object.assign(info, { index: 1, name: "Null 1", kind: "null", is_null: true, samples: [] });
  insertLayer(d, 1, blankLayer("Null 1", 1, "null"), info);
  save("blink-held-null-added.json", d);
}
// 28: Blink held, then an expression turned on over its opacity.
{
  const d = holdBlink(load());
  prop(d, "Blink").expression_enabled = true;
  save("blink-held-expression-on.json", d);
}
// 29: Blink held, and Cut's pair (3 s to 3.1 s) held on its END key only: the mixed pair.
{
  const d = holdBlink(load());
  const keys = prop(d, "Cut").keys;
  keys[1].in_type = "hold";
  save("cut-held-on-end.json", d);
}
// 30: Blink is a guide layer.
{
  const d = load();
  d.layer_info.find((l) => l.name === "Blink").guide = true;
  save("blink-guide.json", d);
}
// 31: Blink duplicated, the copy right under it (same name, Spinner and below move down one).
{
  const d = load();
  const copy = structuredClone(layer(d, "Blink"));
  copy.index = 2;
  const info = structuredClone(d.layer_info.find((l) => l.name === "Blink"));
  info.index = 2;
  insertLayer(d, 2, copy, info);
  save("blink-copied.json", d);
}
