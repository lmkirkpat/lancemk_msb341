// Overlap audit 2026-10-29, OA-3 (spec 008 tasks T441, changed by the builder in T466): a pair the
// learner said should land hard. It isn't graded, and since T466 its edits are other changes like any
// pair outside the lesson's targets: a new shape, its key values and its key count.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyze, check } from "../lib/speed-graph.mjs";
import { FIXTURES } from "./helpers.mjs";

const sg = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "speed-graph", name), "utf8"));
const KEY = sg("answer-key.json");
const P1 = KEY.ids.P1;

function lessonFor(baseline, landHard) {
  const skill_options = { eased_layers: ["Title"], land_hard: landHard };
  const a = analyze(baseline, { skill_options });
  return { comp_id: baseline.comp.id, targets: [...a.targets, ...landHard], skill_options, demo: null };
}

test("OA-3 (T466): reshaping a land-hard pair is an other change, and the pair isn't graded", () => {
  const was = sg("practice-now.json");
  const r = check(was, sg("planted-shared-key.json"), lessonFor(was, [P1]));
  assert.ok(!r.pairs.some((p) => p.id === P1), "the land-hard pair isn't graded");
  assert.ok(r.other_changes.some((n) => n.startsWith("Title › Position")), r.other_changes.join("; "));
});

test("OA-3: a land-hard pair's key values and key count are still reported", () => {
  const was = sg("practice-now.json");
  const moved = structuredClone(sg("planted-shared-key.json"));
  moved.layers.find((l) => l.name === "Title").properties.find((p) => p.display_name === "Position").keys[0].value = [0, -40, 0];
  const r = check(was, moved, lessonFor(was, [P1]));
  assert.ok(r.other_changes.includes("Title › Position value changed at 0.5 s"), r.other_changes.join("; "));
  // planted-key-added.json adds a key to Title › Scale; its one pair is said to land hard.
  const r2 = check(was, sg("planted-key-added.json"), lessonFor(was, [KEY.ids.S]));
  assert.deepEqual(r2.other_changes, ["Title › Scale now has 3 keys (was 2)"]);
});
