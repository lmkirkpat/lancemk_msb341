#!/usr/bin/env node
// Saves a raw snapshot of the active comp (what snapshot.jsx returns) as a fixture, for unit
// tests and evals (T037). Read-only, and it bypasses the tools, so no lesson is started or changed.
// Dev chores only.
//
//   node mentor/dev/capture.mjs product/evals/easing/fixtures/before.json
//   node mentor/dev/capture.mjs --compare mentor/test/fixtures/practice-before.json
//   node mentor/dev/capture.mjs mentor/test/fixtures/layer-info/overlaps.json --times 0.5,1.2
//   node mentor/dev/capture.mjs mentor/test/fixtures/expressions/comp1.json --measure 25,26 --times 0.6 --time
//
// --times passes sample_times to the snippet (spec 004 wave B, read R3's extra sample times).
// --measure passes measure_layers (spec 015 research R9: fine sweeps for those layer indexes).
// --time prints how long the snippet took, in ms (spec 015 SC-008).

import fs from "node:fs";
import { runSnippet } from "../bridge-client.mjs";

const argv = process.argv.slice(2);
const args = {};
// A list option's numbers, removed from argv; null when the option isn't there.
function listOption(name, example, integers = false) {
  const at = argv.indexOf(name);
  if (at < 0) return null;
  const list = String(argv[at + 1] || "").split(",").map(Number);
  if (!list.length || list.some((t) => !Number.isFinite(t) || (integers && !Number.isInteger(t)))) {
    console.error(`${name} takes numbers separated by commas, for example ${name} ${example}`);
    process.exit(1);
  }
  argv.splice(at, 2);
  return list;
}
const times = listOption("--times", "0.5,1.2");
if (times) args.sample_times = times;
const measure = listOption("--measure", "25,26", true);
if (measure) args.measure_layers = measure;
const timeAt = argv.indexOf("--time");
const timed = timeAt >= 0;
if (timed) argv.splice(timeAt, 1);
const [flag, file] = argv;
if (!flag) {
  console.error("Usage: node mentor/dev/capture.mjs <out.json> | --compare <fixture.json> [--times 0.5,1.2] [--measure 25,26] [--time]");
  process.exit(1);
}

const started = process.hrtime.bigint();
const raw = await runSnippet("snapshot", args);
const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
const now = { taken_at: new Date().toISOString(), ...raw };
if (timed) console.log(`Snapshot took ${elapsedMs.toFixed(0)} ms (bridge round trip included)`);

if (flag === "--compare") {
  // Everything but taken_at and host (spec 004 R0: fixtures from before it have none), and wave B's
  // layer_info, comp.time, comp.hide_shy, comp.width and comp.height (read R1 and R3, and T165:
  // fixtures from before wave B have none, and the playhead moves), must match, key by key. Spec
  // 015's reads (expressions, sweeps) aren't compared either: fixtures from before it have none.
  const strip = ({ taken_at, host, layer_info, comp, expressions, expressions_read, expression_sweeps, measured_layers, ...rest }) => {
    const { time, hide_shy, width, height, ...compRest } = comp || {};
    return JSON.stringify({ ...rest, comp: compRest });
  };
  const was = JSON.parse(fs.readFileSync(file, "utf8"));
  if (strip(was) === strip(now)) {
    console.log(`Matches ${file}`);
    if (JSON.stringify(was.layer_info ?? null) !== JSON.stringify(now.layer_info ?? null)) {
      console.log("  note: layer_info differs (not a failure: it isn't compared)");
    }
  } else {
    console.log(`Differs from ${file}:`);
    for (const layer of now.layers) {
      const old = was.layers.find((l) => l.index === layer.index);
      if (JSON.stringify(old) !== JSON.stringify(layer)) console.log(`  layer ${layer.index} ${layer.name}`);
    }
    process.exitCode = 1;
  }
} else {
  fs.writeFileSync(flag, JSON.stringify(now, null, 2) + "\n");
  console.log(`Saved ${now.comp.name} (${now.layers.length} layers) to ${flag}`);
}
