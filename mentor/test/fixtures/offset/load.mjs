// Loading spec 010's fixtures and answer key in its tests, and building a lesson the way the
// session would (targets from the baseline's analysis, the learner's choices as skill_options).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyze } from "../../../lib/offset.mjs";

export const DIR = path.dirname(fileURLToPath(import.meta.url));
export const load = (rel) => JSON.parse(fs.readFileSync(path.join(DIR, rel), "utf8"));
export const KEY = load("answer-key.json");

// The practice comps, all live captures (2026-10-26). Mentor Practice 2 as built is spec 004's
// practice2b.json (its wave B layers included): the offset captures were taken on a duplicate of it.
export const PRACTICE_NOW = "practice-now.json";
export const PRACTICE2 = "../layer-info/practice2b.json";
export const PRACTICE2_60 = "../practice2-60fps.json";

// demo_undone: a check has already seen the demo undone (session markChecked, FR-011).
export function lessonFor(baseline, { demo = null, demo_undone = false, exclude = [], ...skill_options } = {}) {
  const a = analyze(baseline, { exclude, skill_options });
  return {
    comp_id: baseline.comp.id, skill: "timing.offset", mode: "lesson", baseline, targets: a.targets, target_refs: a.target_refs,
    skill_options, exclude,
    demo: demo ? { segment_id: demo, at: "2026-10-21T12:00:00.000Z", ...(demo_undone ? { undone: "2026-10-21T12:05:00.000Z" } : {}) } : null,
  };
}

export const clone = (x) => JSON.parse(JSON.stringify(x));
