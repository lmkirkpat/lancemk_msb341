// SC-001: on the practice comp, analysis of a real snapshot (practice-before.json, taken live in
// T025) matches the answer key written when the comp was built (practice-expected.json, T012).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyze, segments } from "../lib/analyze.mjs";
import { FIXTURES } from "./helpers.mjs";

const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, name), "utf8"));
const snapshot = load("practice-before.json");
const key = load("practice-expected.json");
const byId = (list) => [...list].sort((a, b) => a.id.localeCompare(b.id));

test("every segment has the expected id, display_path and state", () => {
  const got = segments(snapshot).segments.map((s) => ({ id: s.id, layer: s.layer.name, display_path: s.display_path, state: s.state }));
  assert.deepEqual(byId(got), byId(key.segments));
});

test("findings are exactly the answer key's linear pairs, and counts match its totals", () => {
  const a = analyze(snapshot);
  const linear = a.findings.flatMap((f) => f.segments.map((s) => s.id)).sort();
  assert.deepEqual(linear, key.segments.filter((s) => s.state === "linear").map((s) => s.id).sort());
  assert.deepEqual(a.counts, { linear: key.totals.linear, eased: key.totals.eased, held: key.totals.held });
});

test("skipped properties, hidden layers and precomps match", () => {
  const a = analyze(snapshot);
  const pick = (s) => `${s.layer_index}/${s.path}:${s.reason}`;
  assert.deepEqual(a.skipped.map(pick).sort(), key.skipped.map(pick).sort());
  assert.deepEqual(a.hidden_layers, key.hidden_layers);
  assert.deepEqual(a.precomp_layers, key.precomp_layers.map((l) => l.name));
});

test("the demo target is Title › Position, first pair (not CTRL or Old Take)", () => {
  assert.equal(analyze(snapshot).demo_target, "1/ADBE Transform Group/ADBE Position/1");
});
