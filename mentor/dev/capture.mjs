#!/usr/bin/env node
// Saves a raw snapshot of the active comp (what snapshot.jsx returns) as a fixture, for unit
// tests and evals (T037). Read-only, and it bypasses the tools, so no lesson is started or changed.
// Dev chores only.
//
//   node mentor/dev/capture.mjs product/evals/easing/fixtures/before.json
//   node mentor/dev/capture.mjs --compare mentor/test/fixtures/practice-before.json
//   node mentor/dev/capture.mjs mentor/test/fixtures/layer-info/overlaps.json --times 0.5,1.2
//
// --times passes sample_times to the snippet (spec 004 wave B, read R3's extra sample times).

import fs from "node:fs";
import { runSnippet } from "../bridge-client.mjs";

const argv = process.argv.slice(2);
const timesAt = argv.indexOf("--times");
let args = {};
if (timesAt >= 0) {
  const times = String(argv[timesAt + 1] || "").split(",").map(Number);
  if (!times.length || times.some((t) => !Number.isFinite(t))) {
    console.error("--times takes seconds separated by commas, for example --times 0.5,1.2");
    process.exit(1);
  }
  args = { sample_times: times };
  argv.splice(timesAt, 2);
}
const [flag, file] = argv;
if (!flag) {
  console.error("Usage: node mentor/dev/capture.mjs <out.json> | --compare <fixture.json> [--times 0.5,1.2]");
  process.exit(1);
}

const now = { taken_at: new Date().toISOString(), ...(await runSnippet("snapshot", args)) };

if (flag === "--compare") {
  // Everything but taken_at and host (spec 004 R0: fixtures from before it have none), and wave B's
  // layer_info, comp.time and comp.hide_shy (read R1 and R3: fixtures from before wave B have none,
  // and the playhead moves), must match, key by key.
  const strip = ({ taken_at, host, layer_info, comp, ...rest }) => {
    const { time, hide_shy, ...compRest } = comp || {};
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
