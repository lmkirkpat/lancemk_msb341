#!/usr/bin/env node
// Prints a dev script from mentor/dev/ with the shared ES3 libraries (mentor/jsx/lib/*.jsx) and
// its ARGS prepended, ready to paste into the upstream bridge's ae_run_script. Dev chores only;
// the mentor itself can't run these (FR-013).
//
//   node mentor/dev/assemble.mjs build-practice-comp
//   node mentor/dev/assemble.mjs build-practice-comp '{"replace": true}'

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSource } from "../bridge-client.mjs";

const DEV_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(DEV_DIR, "..", "..");

// Per-script defaults, so the common case needs no arguments.
const DEFAULTS = {
  "build-practice-comp": {
    out: path.join(REPO, "mentor", "test", "fixtures", "practice-expected.json"),
    replace: false,
  },
};

const [name, json] = process.argv.slice(2);
if (!name || !/^[\w-]+$/.test(name)) {
  console.error("Usage: node mentor/dev/assemble.mjs <script-name> ['{\"arg\": value}']");
  process.exit(1);
}
const file = path.join(DEV_DIR, `${name}.jsx`);
if (!fs.existsSync(file)) {
  console.error(`No dev script at ${path.relative(REPO, file)}`);
  process.exit(1);
}
const args = { ...(DEFAULTS[name] || {}), ...(json ? JSON.parse(json) : {}) };
process.stdout.write(buildSource(file, args).code + "\n");
