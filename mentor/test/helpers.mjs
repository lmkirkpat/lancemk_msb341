// Shared test helpers: load fixtures, and point AE_MENTOR_HOME at a fresh temp folder before any
// module that reads mentor/paths.mjs is imported.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

export const fixture = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "synthetic", `${name}.json`), "utf8"));

export function tempHome() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ae-mentor-test-"));
  process.env.AE_MENTOR_HOME = dir;
  return dir;
}
