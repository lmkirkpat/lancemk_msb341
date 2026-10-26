// Fixture loading for spec 009's tests. Every snapshot is a live capture from the 2026-10-26 sitting
// (specs/009-key-types/live-sitting-2026-10-26.md) in this folder, apart from two: Mentor Practice 2
// as built, which is spec 004's live capture `../layer-info/practice2b.json`, and the one synthetic
// shape in `synthetic/` (row 22, see README.md). `source(name)` gives the file a test reads.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const KT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SHARED = {
  "practice2b.json": path.join(KT_DIR, "..", "layer-info", "practice2b.json"),
};

export function source(name) {
  const file = SHARED[name] || path.join(KT_DIR, name);
  if (!fs.existsSync(file)) throw new Error(`No key-types fixture named ${name}`);
  return file;
}

export const load = (name) => JSON.parse(fs.readFileSync(source(name), "utf8"));
export const answerKey = () => JSON.parse(fs.readFileSync(path.join(KT_DIR, "answer-key.json"), "utf8"));
export const recordPath = (name) => path.join(KT_DIR, "records", name);
