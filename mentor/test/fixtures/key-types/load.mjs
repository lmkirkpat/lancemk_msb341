// Fixture loading for spec 009's tests. A live capture wins over its stand-in: the file in this folder
// (or, for Mentor Practice 2, spec 004's mentor/test/fixtures/practice2-before.json), else
// stand-in/<name>. After the sitting (tasks T033) the stand-in folder is deleted and every test reads
// the captures with no other change. `source(name)` says which one a test got.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const KT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SHARED = path.join(KT_DIR, "..");

function candidatesFor(name) {
  const own = [path.join(KT_DIR, name)];
  if (name === "practice2-before.json") own.unshift(path.join(SHARED, name));
  return [...own, path.join(KT_DIR, "stand-in", name)];
}

export function source(name) {
  const found = candidatesFor(name).find((f) => fs.existsSync(f));
  if (!found) throw new Error(`No fixture or stand-in named ${name}`);
  return found;
}

export const load = (name) => JSON.parse(fs.readFileSync(source(name), "utf8"));
export const answerKey = () => JSON.parse(fs.readFileSync(path.join(KT_DIR, "answer-key.json"), "utf8"));
export const recordPath = (name) => path.join(KT_DIR, "records", name);
