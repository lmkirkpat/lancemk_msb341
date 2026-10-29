#!/usr/bin/env node
// Builds this eval set's own synthetic fixtures (overlap audit, 2026-10-29) from the live captures and
// synthetics in mentor/test/fixtures/null-parenting/. Run from anywhere:
//   node product/evals/null-parenting/fixtures/build.mjs
// Cases name them "eval-synthetic/<file>". Each file says `synthetic` at the top; the runner scrubs
// that before the mentor sees it. The edits follow mentor/test/null-parenting-audit.test.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LIVE = path.resolve(HERE, "../../../../mentor/test/fixtures/null-parenting");
const read = (f) => JSON.parse(fs.readFileSync(path.join(LIVE, f), "utf8"));
const write = (name, obj) => fs.writeFileSync(path.join(HERE, "synthetic", name), JSON.stringify(obj, null, 2) + "\n");

// Case 41 (OA-16): the group parented under Null 1, with Caption duplicated: two layers named Caption.
{
  const r = read("parented-center.json");
  const cap = r.layer_info.find((l) => l.name === "Caption");
  r.layer_info.push({ ...JSON.parse(JSON.stringify(cap)), index: Math.max(...r.layer_info.map((l) => l.index)) + 1, parent: null });
  r.synthetic = "Case 41 (OA-16): live parented-center.json with a second layer named Caption added.";
  write("parented-center-dup-caption.json", r);
}

// Case 42 (OA-4): the group parented under Null 1, and Background (no keys) now sits 40 px to the right
// at every sampled time, as if an expression had been added to its Position.
{
  const r = read("parented-center.json");
  const bg = r.layer_info.find((l) => l.name === "Background");
  if ((r.layers || []).some((l) => l.name === "Background")) throw new Error("Background should have no keys");
  for (const s of bg.samples) s.position = [s.position[0] + 40, s.position[1], s.position[2]];
  r.synthetic = "Case 42 (OA-4): live parented-center.json with Background's sampled Position moved 40 px right (no keys).";
  write("parented-center-background-changed.json", r);
}

// Case 44 (OA-14): the row 23 comp (the null follows Holder, which has no keys), with Holder's Position
// sample at 3 s moved: Holder moves through an expression the reads can't see.
{
  const r = read("synthetic/row23-still-parent.json");
  const holder = r.layer_info.find((l) => l.name === "Holder");
  if ((r.layers || []).some((l) => l.name === "Holder")) throw new Error("Holder should have no keys");
  holder.samples.find((s) => s.time === 3).position = [340, 300, 0];
  r.synthetic = "Case 44 (OA-14): synthetic row23-still-parent.json with Holder's Position sample at 3 s moved to (340, 300).";
  write("row23-expression-grandparent.json", r);
}
console.log("wrote fixtures/synthetic/*");
