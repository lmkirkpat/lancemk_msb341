#!/usr/bin/env node
// Saves a raw snapshot of the active comp (what snapshot.jsx returns) as a fixture, for unit
// tests and evals (T037). Read-only, and it bypasses the tools, so no lesson is started or changed.
// Dev chores only.
//
//   node mentor/dev/capture.mjs product/evals/easing/fixtures/before.json
//   node mentor/dev/capture.mjs --compare mentor/test/fixtures/practice-before.json

import fs from "node:fs";
import { runSnippet } from "../bridge-client.mjs";

const [flag, file] = process.argv.slice(2);
if (!flag) {
  console.error("Usage: node mentor/dev/capture.mjs <out.json> | --compare <fixture.json>");
  process.exit(1);
}

const now = { taken_at: new Date().toISOString(), ...(await runSnippet("snapshot", {})) };

if (flag === "--compare") {
  // Everything but taken_at must match, key by key.
  const strip = ({ taken_at, ...rest }) => JSON.stringify(rest);
  const was = JSON.parse(fs.readFileSync(file, "utf8"));
  if (strip(was) === strip(now)) {
    console.log(`Matches ${file}`);
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
