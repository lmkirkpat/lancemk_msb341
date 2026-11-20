// Writes the offset set's phase 3 fixture (spec 014 T079) from a live capture, changing one thing:
//   dots-dot-2-on-plate.json  Mentor Practice 2 with spec 015's expression reads (expressions/practice2.json), and Dot 2
//                             parented to Plate, a layer with its own Position keys. The Dots' stagger is then true for
//                             Dot 2's own keys only: its motion also comes from a parent (rule 1).
// Run by hand if the source changes:  node product/evals/offset/fixtures/synthetic/make-p3-fixtures.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "../../../../../mentor/test/fixtures/expressions/practice2.json");
const snap = JSON.parse(fs.readFileSync(SRC, "utf8"));
const plate = snap.layer_info.find((l) => l.name === "Plate");
const dot2 = snap.layer_info.find((l) => l.name === "Dot 2");
if (!plate || !dot2) throw new Error("practice2.json has no Plate or Dot 2");
dot2.parent = plate.index;
const out = { synthetic: "Not a live capture: practice2.json (read R2) with Dot 2 parented to Plate, which has its own Position keys.", ...snap };
fs.writeFileSync(path.join(HERE, "dots-dot-2-on-plate.json"), JSON.stringify(out, null, 1) + "\n");
console.log("wrote dots-dot-2-on-plate.json");
