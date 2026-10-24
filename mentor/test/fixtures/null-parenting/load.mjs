// Loading spec 012's fixtures in its tests: a live capture in this folder first, then spec 004's
// capture read in place (mentor/test/fixtures/layer-info/), then the stand-in. Synthetics are
// read from synthetic/ by name. Also builds a lesson the way the session would.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyze } from "../../../lib/null-parenting.mjs";

export const DIR = path.dirname(fileURLToPath(import.meta.url));
const SPEC004 = path.resolve(DIR, "..", "layer-info");
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

// The path of a named fixture ("jumped.json", or "synthetic/row4-null-expression.json").
export function where(name) {
  if (name.startsWith("synthetic/") || name.startsWith("records/")) return path.join(DIR, name);
  for (const p of [path.join(DIR, name), path.join(SPEC004, name), path.join(DIR, "stand-in", name)]) if (fs.existsSync(p)) return p;
  throw new Error(`No fixture called ${name} (live, spec 004's or stand-in)`);
}

export const load = (name) => read(where(name));
export const KEY = read(path.join(DIR, "answer-key.json"));
export const clone = (x) => JSON.parse(JSON.stringify(x));

// A lesson as session.start would make it: the baseline, the focus from skill_options and the
// demo target from the analyzer.
export function lessonFor(baseline, { focus, skill_data = {}, demo = null, mode = "lesson", exclude = [] } = {}) {
  const a = analyze(baseline, { exclude, skill_options: { focus } });
  return {
    comp_id: baseline.comp.id, skill: "parenting.null", mode, baseline, focus: a.focus, targets: a.targets, target_refs: a.target_refs,
    demo_target: mode === "review" ? null : a.demo_target, demo: demo ? { segment_id: demo, at: "2026-10-24T12:00:00.000Z" } : null,
    skill_data, exclude,
  };
}
