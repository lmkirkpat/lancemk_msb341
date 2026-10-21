// SC-004, FR-015: easing's findings on Mentor Practice are exactly what they were before spec 004's
// shared branch (practice-findings-baseline.json, saved in T002 before any code changed).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyze } from "../lib/analyze.mjs";
import { FIXTURES } from "./helpers.mjs";

const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, name), "utf8"));
const snapshot = load("practice-before.json");
const baseline = load("practice-findings-baseline.json");

test("analyze() on Mentor Practice, all layers, equals the saved baseline", () => {
  assert.deepEqual(analyze(snapshot), baseline.all_layers);
});

test("analyze() on Mentor Practice with a Title focus equals the saved baseline", () => {
  assert.deepEqual(analyze(snapshot, { focus_layers: ["Title"] }), baseline.focus_title);
});

test("options other skills pass (exclude, skill_options, no marks) don't change easing's result", () => {
  assert.deepEqual(analyze(snapshot, { exclude: [{ layer: "Title", property: "Position" }], skill_options: { x: 1 }, kept_linear: [] }), baseline.all_layers);
});
