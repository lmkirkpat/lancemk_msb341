#!/usr/bin/env node
// Builds case 37's synthetic fixtures from the live capture practice-now.json (Subtitle Position has two
// Easy Ease pairs sharing the key at 1.3 s). Run: node product/evals/speed-graph/fixtures/build.mjs
//   subtitle-opening.json  Title linear; Subtitle Position untouched (the opening)
//   subtitle-pair1-shaped.json  pair 1 shaped (0.3 s out 15, 1.3 s in 80); pair 2 default
//   subtitle-far-side-shaped.json  the above plus 4.367 s in 80; the shared key's out side (1.3 s) still default
//   subtitle-both-shaped.json   every Subtitle Position handle shaped
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LIVE = path.resolve(HERE, "../../../../mentor/test/fixtures/speed-graph/practice-now.json");

function make(note, edits) {
  const p = JSON.parse(fs.readFileSync(LIVE, "utf8"));
  // Title is left linear (its shaped ease is only in the builder's other copy of the file, T057 finding 3),
  // so Subtitle Position is the lesson's focus, as in the live lesson.
  for (const prop of p.layers.find((l) => l.name === "Title").properties) {
    for (const k of prop.keys) {
      k.in_type = "linear"; k.out_type = "linear";
      for (const e of [...(k.in_ease || []), ...(k.out_ease || [])]) { e.influence = 16.667; }
    }
  }
  const pos = p.layers.find((l) => l.name === "Subtitle").properties.find((x) => x.display_name === "Position");
  for (const [index, side, influence] of edits) pos.keys[index - 1][side][0].influence = influence;
  p.synthetic = note;
  return p;
}
const write = (name, obj) => fs.writeFileSync(path.join(HERE, "synthetic", name), JSON.stringify(obj, null, 2) + "\n");

write("subtitle-opening.json", make("Case 36 and 37: practice-now with Title linear, Subtitle Position on Easy Ease (the lesson's focus).", []));
write("subtitle-pair1-shaped.json", make("Case 37: practice-now with Subtitle Position pair 1 shaped (key 1 out 15, key 2 in 80).",
  [[1, "out_ease", 15], [2, "in_ease", 80]]));
write("subtitle-far-side-shaped.json", make("Case 37: pair 1 shaped, plus key 3 in 80; the shared key (1.3 s) out side is still default.",
  [[1, "out_ease", 15], [2, "in_ease", 80], [3, "in_ease", 80]]));
write("subtitle-both-shaped.json", make("Case 37: every Subtitle Position handle shaped.",
  [[1, "out_ease", 15], [2, "in_ease", 80], [2, "out_ease", 15], [3, "in_ease", 80]]));
