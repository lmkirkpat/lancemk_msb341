// spec 008 FR-005: one sentence per kind. A hidden layer or a null whose pairs are already shaped is
// left out as hidden (or null) only, not also as already shaped, matching ease_first's leave-out.
// Fixture: the live practice2b.json capture, copied in memory with one field changed per test
// (Gauge's eye turned off; Wobble made a null). Both have shaped pairs in the live capture.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyze } from "../lib/speed-graph.mjs";
import { FIXTURES } from "./helpers.mjs";

const live = JSON.parse(fs.readFileSync(path.join(FIXTURES, "layer-info", "practice2b.json"), "utf8"));
const kind = (a, k) => (a.left_out.find((x) => x.kind === k) || { layers: [] }).layers;

test("live base: Gauge and Wobble are already shaped, visible, not nulls", () => {
  const a = analyze(live);
  assert.ok(kind(a, "already_shaped").includes("Gauge"));
  assert.ok(kind(a, "already_shaped").includes("Wobble"));
  assert.ok(!kind(a, "hidden").includes("Gauge"));
});

test("a hidden layer with shaped pairs is left out as hidden, not as already shaped", () => {
  const s = structuredClone(live);
  s.layers.find((l) => l.name === "Gauge").enabled = false;
  for (const l of s.layer_info || []) if (l.name === "Gauge" && "enabled" in l) l.enabled = false;
  const a = analyze(s);
  assert.ok(kind(a, "hidden").includes("Gauge"));
  assert.ok(!kind(a, "already_shaped").includes("Gauge"));
  assert.ok(kind(a, "already_shaped").includes("Wobble"), "other shaped layers still listed");
});

test("a null with shaped pairs is left out as a null, not as already shaped", () => {
  const s = structuredClone(live);
  s.layers.find((l) => l.name === "Wobble").is_null = true;
  for (const l of s.layer_info || []) if (l.name === "Wobble") l.is_null = true;
  const a = analyze(s);
  assert.ok(kind(a, "null").includes("Wobble"));
  assert.ok(!kind(a, "already_shaped").includes("Wobble"));
  assert.ok(kind(a, "already_shaped").includes("Gauge"));
});
