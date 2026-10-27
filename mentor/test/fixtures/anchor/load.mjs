// Loading spec 011's fixtures and answer key in its tests, and building a lesson the way the session
// would (targets from the baseline's analysis, the learner's focus as skill_options).
//
// fixture(name) reads a live capture: this folder first (the 2026-10-26 sitting, tasks T233), then
// spec 004's own capture of the same name in ../layer-info/ (overlaps.json). synthetic(name) reads
// synthetic/. The stand-ins are gone (T234).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyze } from "../../../lib/anchor.mjs";

export const DIR = path.dirname(fileURLToPath(import.meta.url));
export const load = (rel) => JSON.parse(fs.readFileSync(path.join(DIR, rel), "utf8"));
export const KEY = load("answer-key.json");
export const clone = (x) => JSON.parse(JSON.stringify(x));

export function fixturePath(name) {
  const file = `${name}.json`;
  for (const rel of [file, path.join("..", "layer-info", file)]) {
    if (fs.existsSync(path.join(DIR, rel))) return rel;
  }
  throw new Error(`No anchor fixture named ${name}`);
}
export const fixture = (name) => load(fixturePath(name));
export const synthetic = (name) => load(path.join("synthetic", `${name}.json`));
export const absolute = (name) => path.join(DIR, fixturePath(name));

export const indexOf = (snapshot, name) => snapshot.layer_info.find((l) => l.name === name).index;

// A lesson as session.start() would store it for `focus` ([{ layer, place, rest_time? }]).
export function lessonFor(baseline, focus, { demo = null, demoUndone = false, exclude = [] } = {}) {
  const skill_options = focus ? { focus } : {};
  const a = analyze(baseline, { exclude, skill_options });
  return {
    comp_id: baseline.comp.id, skill: "transform.anchor", mode: "lesson", baseline,
    targets: a.targets, target_refs: a.target_refs, skill_options, exclude,
    demo: demo ? { segment_id: demo, at: "2026-10-24T12:00:00.000Z", ...(demoUndone ? { undone: "2026-10-24T12:05:00.000Z" } : {}) } : null,
  };
}

// A lesson with `focus`'s layers as targets directly, whatever the analysis says: for checks a
// lesson can't reach (Sled with three Position keys, never since D-4), kept as item 4's unit tests.
export function lessonDirect(baseline, focus) {
  const lesson = lessonFor(baseline, focus);
  lesson.targets = focus.map((f) => `anchor/${indexOf(baseline, f.layer)}`);
  lesson.target_refs = focus.map((f) => ({ layer: f.layer, property: "Anchor Point" }));
  return lesson;
}
