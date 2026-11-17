#!/usr/bin/env node
// Builds the ask set's fixtures from spec 015 T015's captures (spec 014 T031). Nothing is written by hand:
// every file here is a capture or a mechanical change to one (a rename, a subset, a switch flipped), so a
// new live capture only needs this script re-run.
//
//   node product/evals/ask/fixtures/build.mjs            write the fixtures
//   node product/evals/ask/fixtures/build.mjs --check    exit 1 if a fixture on disk differs from what it would write
//
// Sources (mentor/test/fixtures/expressions/):
//   comp1.mjs        Comp 1 with spec 015's reads. Derived from the committed ground truth until T015's live
//                    `comp1.json` lands; then `comp1()` returns that and `expression_sweeps` fills in.
//   practice.json    Mentor Practice with expression reads (live, AE 27.0, 2026-11-15)
//   planted.json     18 layers that plant one overlap each (live, AE 27.0, 2026-11-15)
//
// The comp and layer names are the builder's project content or generic words. No personal names.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { comp1 } from "../../../../mentor/test/fixtures/expressions/comp1.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, "..", "..", "..", "..", "mentor", "test", "fixtures", "expressions");
const clone = (o) => JSON.parse(JSON.stringify(o));
const load = (name) => JSON.parse(fs.readFileSync(path.join(SRC, name), "utf8"));

// Keeps the listed layers (old indexes), numbered 1..n in their old order, and carries every cross
// reference (parent, matte, expressions, sweeps, measured layers, precomp list) with them.
export function subset(snap, keep, { rename = {}, comp } = {}) {
  const s = clone(snap);
  const order = [...keep].sort((a, b) => a - b);
  const map = new Map(order.map((old, i) => [old, i + 1]));
  const remap = (i) => (i == null ? null : map.has(i) ? map.get(i) : null);
  const keepOnly = (arr) => arr.filter((x) => map.has(x.index));
  s.layers = keepOnly(s.layers).map((l) => ({ ...l, name: rename[l.index] ?? l.name, index: map.get(l.index) }));
  s.layer_info = keepOnly(s.layer_info).map((l) => ({
    ...l, name: rename[l.index] ?? l.name, index: map.get(l.index), parent: remap(l.parent),
    matte: l.matte ? { ...l.matte, layer: remap(l.matte.layer) } : null,
  }));
  const own = (arr) => (arr || []).filter((x) => map.has(x.layer)).map((x) => ({ ...x, layer: map.get(x.layer) }));
  if (s.expressions) s.expressions = own(s.expressions);
  if (s.expression_sweeps) s.expression_sweeps = own(s.expression_sweeps);
  if (s.measured_layers) s.measured_layers = s.measured_layers.filter((i) => map.has(i)).map((i) => map.get(i));
  s.precomp_layers = (s.precomp_layers || []).filter((x) => map.has(x.index)).map((x) => ({ ...x, index: map.get(x.index), name: rename[x.index] ?? x.name }));
  if (comp) s.comp = { ...s.comp, name: comp };
  return s;
}

const renameLayer = (s, index, name) => {
  for (const l of s.layers) if (l.index === index) l.name = name;
  for (const l of s.layer_info) if (l.index === index) l.name = name;
  for (const l of s.precomp_layers || []) if (l.index === index) l.name = name;
};

export function fixtures() {
  const out = {};

  // 1. Comp 1 as captured: rock.png rides on Shake Control (expressions), Sweep Control (two keys) drives
  //    CC Light Sweep on Black Solid 1, 20 precomps, no matte, no locked layer.
  out["comp1.json"] = comp1();

  // 2. Comp 1 with a second "rock" layer that moves on its own keys (the layers 26 keys, copied), so "the
  //    rock" names two layers whose first steps differ: rock.png's motion comes from Shake Control's
  //    expressions, Small Rock.png's from its own keys. Layer 22 (outline.png) is the one changed.
  {
    const s = clone(comp1());
    const donor = s.layers.find((l) => l.name === "Sweep Control");
    const donorInfo = s.layer_info.find((l) => l.name === "Sweep Control");
    const target = s.layers.findIndex((l) => l.index === 22);
    const entry = { index: 22, name: "Small Rock.png", kind: "footage", enabled: true, is_null: false, properties: clone(donor.properties) };
    if (target >= 0) s.layers[target] = entry;
    else { s.layers.push(entry); s.layers.sort((a, b) => a.index - b.index); }
    const info = s.layer_info.find((l) => l.index === 22);
    // Footage that renders, not outline.png's switched-off layer and not the null's zero opacity: keep
    // outline.png's own flags (footage, has_video, not a guide or matte), switch it on, and take the null's
    // Position along the keys. Anchor, scale, rotation, opacity and rect are outline.png's (an ordinary
    // 1588 x 535 image at full opacity); only Position follows the donor.
    const own = clone(info);
    info.name = "Small Rock.png";
    info.parent = null;
    info.enabled = true;
    info.transform = { ...clone(own.transform), position: clone(donorInfo.transform.position) };
    info.samples = clone(donorInfo.samples).map((smp) => {
      const base = own.samples[0];
      return { ...smp, anchor: clone(base.anchor), scale: clone(base.scale), rotation: base.rotation, opacity: base.opacity, rect: clone(base.rect), rect_extents: base.rect_extents };
    });
    out["comp1-two-rocks.json"] = s;
  }

  // 3. Mentor Practice, as captured: Title (linear keys), Subtitle (eased), CTRL parent, Bar (separated X
  //    Position), Cursor (holds), Logo (one Scale key; Rotation keys under an expression), Icon (a precomp).
  out["practice.json"] = load("practice.json");

  // 4. Mentor Practice with Title locked: the one switch flipped.
  {
    const s = clone(load("practice.json"));
    s.layer_info.find((l) => l.name === "Title").locked = true;
    out["practice-title-locked.json"] = s;
  }

  // 5. Two layers in reach with different first steps: Card (two Scale keys, no active expression) and Glow
  //    (an expression, wiggle(5, 20), and no keys). From planted layers 4 and 18.
  {
    const p = load("planted.json");
    const s = subset(p, [4, 18], { rename: { 4: "Card", 18: "Glow" }, comp: "Intro" });
    s.expressions = s.expressions.filter((e) => /wiggle/.test(e.text)); // Card's disabled "[50, 50]" would muddy "keys only"
    out["card-and-glow.json"] = s;
  }

  // 6. A track matte with its eye off by design: Window Matte (is_matte, eye off), Photo (uses it), and
  //    Ctrl, whose rotation drives the matte. From planted layers 1, 9 and 10.
  {
    const p = load("planted.json");
    out["matte-eye-off.json"] = subset(p, [1, 9, 10], { rename: { 9: "Window Matte", 10: "Photo" }, comp: "Intro" });
  }
  return out;
}

const write = process.argv.includes("--check") ? false : true;
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let differs = 0;
  for (const [name, snap] of Object.entries(fixtures())) {
    const text = JSON.stringify(snap, null, 1) + "\n";
    const file = path.join(HERE, name);
    if (write) {
      fs.writeFileSync(file, text);
      console.log(`wrote ${name} (${snap.comp.name}, ${snap.layer_info.length} layers)`);
    } else if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text) {
      console.error(`${name} differs from what build.mjs would write`);
      differs++;
    }
  }
  if (differs) process.exit(1);
}
