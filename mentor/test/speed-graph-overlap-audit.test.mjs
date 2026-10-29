// Overlap audit 2026-10-29, OA-3 (spec 008 tasks T441): a pair the learner said should land hard.
// The audit proposed reporting its edits as other changes. Spec 008 data-model.md › Check result says
// the opposite on purpose ("so a dropped pair the learner then changes isn't reported as an other
// change"), so this pins what the check does: a new shape on a land-hard pair isn't an other change,
// but its key values and key count still are, as for any property.

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

test("OA-3 (pinned, spec 008 data-model › Check result): reshaping a land-hard pair isn't an other change", () => {
  const was = sg("practice-now.json");
  const r = check(was, sg("planted-shared-key.json"), lessonFor(was, [P1]));
  assert.ok(!r.pairs.some((p) => p.id === P1), "the land-hard pair isn't graded");
  assert.deepEqual(r.other_changes, []);
});

test("OA-3 (pinned): a land-hard pair's key values and key count are still reported", () => {
  const was = sg("practice-now.json");
  const moved = structuredClone(sg("planted-shared-key.json"));
  moved.layers.find((l) => l.name === "Title").properties.find((p) => p.display_name === "Position").keys[0].value = [0, -40, 0];
  const r = check(was, moved, lessonFor(was, [P1]));
  assert.ok(r.other_changes.includes("Title › Position value changed at 0.5 s"), r.other_changes.join("; "));
  // planted-key-added.json adds a key to Title › Scale; its one pair is said to land hard.
  const r2 = check(was, sg("planted-key-added.json"), lessonFor(was, [KEY.ids.S]));
  assert.deepEqual(r2.other_changes, ["Title › Scale now has 3 keys (was 2)"]);
});
