// Writes synthetic/unknown-values.json (spec 009 overlap row 22), the one key-types shape that can't be
// captured live: a snapshot that reads Opacity keys with no values. A live plant always reads values,
// so the 2026-10-26 sitting's overlap-layers.json has no "Old Values" layer (live-sitting log, T032).
// Built from live captures only: Mentor Practice 2 as built (layer-info/practice2b.json) plus one shape
// layer, "Old Values", at index 41, shaped like the live Fader layer in overlap-layers.json (same kind,
// switches and layer_info read) with its two Opacity keys at 6 and 6.5 s and their values unknown.
// Run by hand when either source changes:
//   node mentor/test/fixtures/key-types/synthetic/make-unknown-values.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(fs.readFileSync(path.join(HERE, p), "utf8"));
const base = read("../../layer-info/practice2b.json");
const overlap = read("../overlap-layers.json");

const INDEX = 41;
const NAME = "Old Values";
const fader = structuredClone(overlap.layers.find((l) => l.name === "Fader"));
const faderInfo = structuredClone(overlap.layer_info.find((l) => l.name === "Fader"));
const times = [6, 6.5];

const layer = { ...fader, index: INDEX, name: NAME };
const prop = layer.properties[0];
prop.keys = times.map((time, i) => ({
  ...prop.keys[i], index: i + 1, time, value: null,
  in_ease: [{ speed: 0, influence: 16.667 }], out_ease: [{ speed: 0, influence: 16.667 }],
}));
const info = {
  ...faderInfo, index: INDEX, name: NAME,
  transform: { ...faderInfo.transform, opacity: null },
  samples: faderInfo.samples.slice(0, 1),
};

const snap = {
  synthetic: "Not a live capture: practice2b.json plus an Old Values layer whose Opacity keys read no values (row 22). See README.md.",
  ...structuredClone(base),
};
snap.layers.push(layer);
snap.layer_info.push(info);
fs.writeFileSync(path.join(HERE, "unknown-values.json"), JSON.stringify(snap, null, 2) + "\n");
console.log("wrote synthetic/unknown-values.json");
