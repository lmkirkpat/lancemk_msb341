// Loading spec 010's fixtures and answer key in its tests, and building a lesson the way the
// session would (targets from the baseline's analysis, the learner's choices as skill_options).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyze } from "../../../lib/offset.mjs";

export const DIR = path.dirname(fileURLToPath(import.meta.url));
export const load = (rel) => JSON.parse(fs.readFileSync(path.join(DIR, rel), "utf8"));
export const KEY = load("answer-key.json");

// The two practice comps: the live captures once they exist (tasks T034), the stand-ins until then.
const firstThere = (...rels) => rels.find((r) => fs.existsSync(path.join(DIR, r)));
export const PRACTICE_NOW = firstThere("practice-now.json", "stand-in/practice-now.json");
export const PRACTICE2 = fs.existsSync(path.join(DIR, "..", "practice2-before.json")) ? "../practice2-before.json" : "stand-in/practice2-before.json";
export const PRACTICE2_60 = fs.existsSync(path.join(DIR, "..", "practice2-60fps.json")) ? "../practice2-60fps.json" : "stand-in/practice2-60fps.json";

export function lessonFor(baseline, { demo = null, exclude = [], ...skill_options } = {}) {
  const a = analyze(baseline, { exclude, skill_options });
  return {
    comp_id: baseline.comp.id, skill: "timing.offset", mode: "lesson", baseline, targets: a.targets, target_refs: a.target_refs,
    skill_options, exclude, demo: demo ? { segment_id: demo, at: "2026-10-21T12:00:00.000Z" } : null,
  };
}

export const clone = (x) => JSON.parse(JSON.stringify(x));
