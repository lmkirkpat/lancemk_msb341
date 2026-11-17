// Spec 015 T016 (FR-021, SC-004): adding read R2 changes no keyframe or timing finding.
//
// The committed easing baseline (practice-findings-baseline.json) is pinned on practice-before.json by
// analyze-unchanged.test.mjs, which still passes as it was. Mentor Practice has changed since that
// capture (Title and Subtitle have more keys), so the live half here is a same-state pair: T015
// captured each practice comp with main's snapshot.jsx (at b1cde83, *-main-snippet.json) and with
// spec 015's, back to back. All five analyses must be identical on the two.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyze as easing } from "../lib/analyze.mjs";
import { analyze as speedGraph } from "../lib/speed-graph.mjs";
import { analyze as keyTypes } from "../lib/key-types.mjs";
import { analyze as offset } from "../lib/offset.mjs";
import { timing } from "../lib/timing.mjs";
import { comp1, LIVE } from "./fixtures/expressions/comp1.mjs";
import { FIXTURES } from "./helpers.mjs";

const EX = path.join(FIXTURES, "expressions");
const load = (name) => JSON.parse(fs.readFileSync(path.join(EX, name), "utf8"));
const ANALYSES = { easing, speedGraph, keyTypes, offset, timing };
const NEW_FIELDS = ["expressions", "expressions_read", "expression_sweeps", "measured_layers"];
const withoutR2 = (snap) => {
  const s = structuredClone(snap);
  for (const k of NEW_FIELDS) delete s[k];
  for (const l of s.layer_info) {
    delete l.effects;
    for (const sm of l.samples) delete sm.base;
  }
  return s;
};
const strip = ({ taken_at, ...rest }) => rest;

for (const name of ["practice", "practice2", "overlaps"]) {
  const now = load(`${name}.json`);
  const main = load(`${name}-main-snippet.json`);
  test(`live ${name}: main's snippet and spec 015's read the same comp identically, apart from read R2`, () => {
    assert.deepEqual(strip(withoutR2(now)), strip(main));
    assert.deepEqual(now.layers, main.layers, "layers, which every keyframe analysis reads, byte for byte");
  });
  for (const [label, fn] of Object.entries(ANALYSES)) {
    test(`live ${name}: ${label} is identical with and without read R2`, () => {
      assert.deepEqual(fn(now), fn(main));
      assert.deepEqual(fn(now), fn(withoutR2(now)));
    });
  }
}

test("live practice: easing still finds Title and Logo's pairs; Logo's Rotation expression is read (E1)", () => {
  const now = load("practice.json");
  const r = easing(now);
  assert.ok(r.findings.some((f) => f.layer === "Title"));
  const logo = now.layer_info.find((l) => l.name === "Logo");
  assert.deepEqual(now.expressions.map((x) => [x.layer, x.path, x.keys, x.enabled]), [[logo.index, "ADBE Transform Group/ADBE Rotate Z", 2, true]]);
});

const names = (result) => JSON.stringify(result);
for (const [label, snap] of [[`Comp 1 (${LIVE ? "live" : "derived"})`, comp1()], ["the live 015 Rig", load("rig.json")]]) {
  test(`${label}: no keyframe or timing analysis finds anything on Shake Control or Black Solid 1's Sweep Center (FR-021)`, () => {
    for (const [a, fn] of Object.entries(ANALYSES)) {
      const r = names(fn(snap));
      assert.ok(!r.includes('"Shake Control"'), `${a} names Shake Control`);
      assert.ok(!r.includes('"Black Solid 1"'), `${a} names Black Solid 1`);
    }
  });
}
