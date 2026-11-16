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

// Case 53 (spec 015 T035): T015's live 015 Planted with the learner's new null at the bottom (Null 1 at
// index 19, copied from the live planted-renumbered.json, so nothing is renumbered) and the playhead
// moved from 0.6 s to 1.5 s, where every layer already has a sample. Const Kid rides on Const Parent,
// whose Position runs on an expression; neither is in the group.
// STAND-IN: re-derive from the T015 capture (a live read taken after adding the null at the bottom).
{
  const EXPR = path.resolve(HERE, "../../../../mentor/test/fixtures/expressions");
  const load = (f) => JSON.parse(fs.readFileSync(path.join(EXPR, f), "utf8"));
  const r = load("planted.json");
  const nul = load("planted-renumbered.json").layer_info.find((l) => l.name === "Null 1");
  nul.index = Math.max(...r.layer_info.map((l) => l.index)) + 1;
  r.layer_info.push(nul);
  if (!r.layer_info.every((l) => l.samples.some((x) => x.time === 1.5))) throw new Error("every layer needs a sample at 1.5 s");
  r.comp.time = 1.5;
  r.synthetic = "Case 53 (spec 015 T035): live 015 Planted with Null 1 added at the bottom (from planted-renumbered.json) and the playhead at 1.5 s.";
  write("planted-null-added-later.json", r);
}
// Case 55 (spec 015 T059): the case 06 flow (Tile, Caption, Stamp; Stamp ends 120 px left after the
// parenting) with an expression read added to all three reads, as if Stamp's X Position ran an
// expression (on, no error, not marked on the keyed property, so only the snapshot's motion_from
// carries it). STAND-IN: re-derive from a live read of a group layer whose own Position expression
// jumps when parented, once the builder has one (T059 note).
{
  const LAYER_INFO = path.resolve(HERE, "../../../../mentor/test/fixtures/layer-info");
  const readAny = (f) => JSON.parse(fs.readFileSync(fs.existsSync(path.join(LIVE, f)) ? path.join(LIVE, f) : path.join(LAYER_INFO, f), "utf8"));
  for (const [src, out] of [["practice2b.json", "jump-expr-base.json"], ["null-center.json", "jump-expr-null.json"], ["jumped.json", "jump-expr-jumped.json"]]) {
    const r = readAny(src);
    const stamp = r.layer_info.find((l) => l.name === "Stamp");
    r.expressions = [{
      layer: stamp.index, path: "ADBE Transform Group/ADBE Position_0", display_path: "Transform \u203a X Position", group: "transform",
      keys: 2, enabled: true, active: true, error: null, text: "value + Math.sin(time * 4) * 10", text_length: 31, text_cut: false,
    }];
    r.expressions_read = "all";
    r.expression_sweeps = [{ layer: stamp.index, path: "ADBE Transform Group/ADBE Position_0", kind: "coarse", sampled_every: 0.25, varies: true, max_offset: 10, max_at: 0.4 }];
    r.synthetic = `Case 55 (spec 015 T059): live ${src} with an expression read added: Stamp's X Position runs an expression.`;
    write(out, r);
  }
}
console.log("wrote fixtures/synthetic/*");
