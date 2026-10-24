// Spec 011 FR-015, FR-029 (research R6): demoValues keeps the footprint still with comp-space's own
// math; the snippet builds with the shared ES3 libraries, never keys, writes X and Y on a separated
// layer and refuses before any write; its fixture twin writes the same values into a saved
// snapshot and refuses the same way.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { assemble } from "../bridge-client.mjs";
import { footprint, sampleAt } from "../lib/comp-space.mjs";
import { demoValues, placeNow, rectOf } from "../lib/anchor.mjs";
import { apply, run } from "../fixture/anchor-demo.mjs";
import { clone, fixture, indexOf, synthetic } from "./fixtures/anchor/load.mjs";

const JSX = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "jsx", "anchor-demo.jsx");

// Demo `name` to `place` at time t on a copy of `snap`; the footprint before and after.
function demoOn(snap, name, place, t) {
  const after = clone(snap);
  const entry = after.layer_info.find((l) => l.name === name);
  const s = sampleAt(entry, t);
  const values = demoValues(s, rectOf(s, entry.kind), place);
  apply(after, { layer_index: entry.index, ...values });
  return { before: footprint(snap, entry.index, t), after: footprint(after, entry.index, t), values, sample: sampleAt(entry, t) };
}
const maxEdge = (a, b) => Math.max(...["left", "top", "right", "bottom"].map((k) => Math.abs(a.bounds[k] - b.bounds[k])));
const maxCorner = (a, b) => Math.max(...a.corners.flatMap((c, i) => [Math.abs(c[0] - b.corners[i][0]), Math.abs(c[1] - b.corners[i][1])]));

for (const [what, snap, name, place, t] of [
  ["a rotated layer (Peg at 30°)", () => fixture("demo-rotated-before"), "Peg", "top-left", 0],
  ["a scaled layer (Plaque at 200%)", () => fixture("practice2b"), "Plaque", "middle-left", 0],
  ["a flipped layer (Flip at [-100, 100])", () => fixture("practice2b"), "Flip", "bottom-right", 0],
  ["a parented layer (Hatch on Hatch Rig)", () => fixture("practice2b"), "Hatch", "middle-left", 0],
  ["a layer whose parent is turned 90° (Hand on Arm at 2 s)", () => synthetic("row16-before"), "Hand", "top-left", 2],
]) {
  test(`demoValues keeps the footprint within 1 px on ${what}`, () => {
    const r = demoOn(snap(), name, place, t);
    assert.ok(!r.before.reason && !r.after.reason);
    assert.ok(maxEdge(r.before, r.after) <= 1, `bounds moved ${maxEdge(r.before, r.after)} px`);
    assert.ok(maxCorner(r.before, r.after) <= 0.01, "every corner stays put, not only the bounds");
    assert.equal(placeNow(r.sample.anchor, r.sample.rect), place, "and the pivot is in the place");
  });
}

test("demoValues on a layer at Scale 0 on one axis: no inversion, no singular, Position unchanged on that axis", () => {
  const s = clone(fixture("practice2b"));
  const tab = s.layer_info.find((l) => l.name === "Tab");
  for (const sm of tab.samples) sm.scale = [100, 0, 100];
  const r = demoOn(s, "Tab", "bottom-middle", 0);
  assert.ok(maxEdge(r.before, r.after) <= 1);
  const before = sampleAt(tab, 0);
  assert.equal(r.values.position[1], before.position[1], "a zero-scale axis doesn't shift Position");
});

test("assemble builds anchor-demo with the shared ES3 libraries and its ARGS", () => {
  const args = { comp_id: 300, layer_index: 1, layer_name: "Door", anchor: [0, 250], position: [50, 300], rest_time: null };
  const { code } = assemble("anchor-demo", args);
  assert.ok(code.includes("function propByPath("), "lib/paths.jsx is prepended");
  assert.ok(code.includes(`var ARGS = ${JSON.stringify(args)};`));
  assert.ok(code.includes("ANCHOR_REFUSED"));
});

test("anchor-demo.jsx uses no ES5+ syntax, and never sets a key", () => {
  const src = fs.readFileSync(JSX, "utf8").replace(/\/\/.*$/gm, "");
  for (const [what, re] of [
    ["let/const", /\b(let|const)\s/], ["arrow functions", /=>/], ["template strings", /`/], ["classes", /\bclass\s/],
    ["spread", /\.\.\./], ["for...of", /\bfor\s*\([^)]*\bof\b/],
    ["ES5 array methods", /\.(forEach|map|filter|reduce|some|every|indexOf|lastIndexOf|find|findIndex|includes)\(/],
    ["JSON", /\bJSON\./], ["Object.keys", /Object\.(keys|assign|entries|values)/], ["Array.isArray", /Array\.isArray/], ["trim", /\.trim\(/],
    ["setValueAtTime", /setValueAtTime/], ["addKey", /addKey/], ["setValueAtKey", /setValueAtKey/],
  ]) assert.doesNotMatch(src, re, what);
});

// ---- A mock After Effects: one comp, one layer, its transform.

function mockProp(value, { keys = 0, expression = false } = {}) {
  const p = { value, numKeys: keys, canSetExpression: true, expressionEnabled: expression, writes: [] };
  p.setValue = (v) => { p.writes.push(v); p.value = v; };
  return p;
}
function mockAE({ separated = false, locked = false, three_d = false, collapse = false, anchorKeys = 0, positionKeys = 0, expression = false, time = 0, name = "Door" } = {}) {
  function CompItem() {}
  const anchor = mockProp([150, 250, 0], { keys: anchorKeys });
  const position = mockProp([200, 300, 0], { keys: separated ? 0 : positionKeys, expression: !separated && expression });
  const x = mockProp(200, { keys: positionKeys, expression });
  const y = mockProp(300);
  position.dimensionsSeparated = separated;
  const props = { "ADBE Anchor Point": anchor, "ADBE Position": position, "ADBE Position_0": x, "ADBE Position_1": y };
  const transform = { property: (n) => props[n] || null };
  const layer = {
    name, locked, threeDLayer: three_d, collapseTransformation: collapse,
    source: collapse ? new CompItem() : {},
    property: (n) => (n === "ADBE Transform Group" ? transform : null),
  };
  const comp = Object.assign(new CompItem(), { id: 300, frameRate: 30, time, numLayers: 1, layer: (i) => (i === 1 ? layer : null) });
  return { comp, CompItem, anchor, position, x, y };
}
function runJsx(ae, args) {
  const { code } = assemble("anchor-demo", args);
  const ctx = vm.createContext({ app: { project: { activeItem: ae.comp } }, CompItem: ae.CompItem, PropertyType: {}, Math, isFinite });
  return vm.runInContext(`(function () {\n${code}\n})()`, ctx);
}
const ARGS = { comp_id: 300, layer_index: 1, layer_name: "Door", anchor: [0, 250], position: [50, 300], rest_time: null };
const plain = (v) => JSON.parse(JSON.stringify(v));

test("the snippet writes Anchor Point then Position, keeps Z, adds no key, and reports before and after", () => {
  const ae = mockAE();
  const r = plain(runJsx(ae, ARGS));
  assert.deepEqual(r, { layer: "Door", anchor_before: [150, 250], anchor_after: [0, 250], position_before: [200, 300], position_after: [50, 300], separated: false });
  assert.deepEqual(plain(ae.anchor.value), [0, 250, 0]);
  assert.deepEqual(plain(ae.position.value), [50, 300, 0]);
  assert.equal(ae.anchor.numKeys + ae.position.numKeys, 0);
});

test("the snippet writes X and Y on a separated layer, and leaves Position alone", () => {
  const ae = mockAE({ separated: true });
  const r = plain(runJsx(ae, ARGS));
  assert.equal(r.separated, true);
  assert.deepEqual(ae.x.writes, [50]);
  assert.deepEqual(ae.y.writes, [300]);
  assert.deepEqual(ae.position.writes, []);
});

for (const [why, setup, args] of [
  ["locked", { locked: true }, {}],
  ["three_d", { three_d: true }, {}],
  ["collapsed", { collapse: true }, {}],
  ["anchor_or_position_keyed", { anchorKeys: 1 }, {}],
  ["anchor_or_position_keyed", { positionKeys: 2 }, {}],
  ["anchor_or_position_keyed", { separated: true, positionKeys: 2 }, {}],
  ["expression", { expression: true }, {}],
  ["not_at_rest", { time: 2 }, { rest_time: 3.167 }],
  ["not_found", { name: "Not Door" }, {}],
]) {
  test(`the snippet refuses (${why}: ${JSON.stringify(setup)}) before any write`, () => {
    const ae = mockAE(setup);
    assert.throws(() => runJsx(ae, { ...ARGS, ...args }), (e) => String(e.message) === `ANCHOR_REFUSED: ${why}`);
    for (const p of [ae.anchor, ae.position, ae.x, ae.y]) assert.deepEqual(p.writes, []);
  });
}

test("the snippet refuses another comp with NO_ACTIVE_COMP", () => {
  assert.throws(() => runJsx(mockAE(), { ...ARGS, comp_id: 999 }), /^Error: NO_ACTIVE_COMP|NO_ACTIVE_COMP/);
});

// ---- The twin

test("the twin's apply writes anchor and position into transform and every sample, keeping Z, and leaves rect alone", () => {
  const s = clone(fixture("practice2b"));
  const door = s.layer_info.find((l) => l.name === "Door");
  const rects = door.samples.map((x) => clone(x.rect));
  apply(s, { layer_index: door.index, anchor: [0, 250], position: [50, 300] });
  assert.deepEqual(door.transform.anchor, [0, 250, 0]);
  assert.deepEqual(door.transform.position, [50, 300, 0]);
  for (const sm of door.samples) {
    assert.deepEqual(sm.anchor, [0, 250, 0]);
    assert.deepEqual(sm.position, [50, 300, 0]);
  }
  assert.deepEqual(door.samples.map((x) => x.rect), rects);
});

test("the twin's run saves the edit and returns what the snippet returns", () => {
  const saved = [];
  const s = fixture("practice2b");
  const r = run({ ...ARGS, layer_index: indexOf(s, "Door") }, { snapshot: s, saveEdit: (e) => saved.push(e) });
  assert.deepEqual(r, { layer: "Door", anchor_before: [150, 250], anchor_after: [0, 250], position_before: [200, 300], position_after: [50, 300], separated: false });
  assert.deepEqual(saved, [{ layer_index: indexOf(s, "Door"), anchor: [0, 250], position: [50, 300] }]);
});

const twinCase = (name, change, extra = {}) => {
  const s = clone(fixture("practice2b"));
  const entry = s.layer_info.find((l) => l.name === name);
  change(s, entry);
  return { snapshot: s, args: { ...ARGS, layer_index: entry.index, layer_name: name, ...extra } };
};
for (const [why, make] of [
  ["locked", () => twinCase("Door", (s, e) => { e.locked = true; })],
  ["three_d", () => twinCase("Door", (s, e) => { e.three_d = true; })],
  ["collapsed", () => twinCase("Seal", () => {})],
  ["anchor_or_position_keyed", () => twinCase("Wobble", () => {})],
  ["anchor_or_position_keyed", () => twinCase("Sled", () => {})],
  ["expression", () => twinCase("Sled", (s) => { s.layers.find((l) => l.name === "Sled").properties[0].expression_enabled = true; })],
  ["not_at_rest", () => twinCase("Gauge", () => {}, { rest_time: 3.167 })],
  ["not_found", () => twinCase("Door", () => {}, { layer_name: "Window" })],
]) {
  test(`the twin's run refuses with ANCHOR_REFUSED (${why}) and saves nothing`, () => {
    const { snapshot, args } = make();
    const saved = [];
    assert.throws(() => run(args, { snapshot, saveEdit: (e) => saved.push(e) }), (e) => e.code === "ANCHOR_REFUSED" && e.reason === why);
    assert.deepEqual(saved, []);
  });
}

test("the twin's run at the rest key goes ahead", () => {
  const s = fixture("gauge-before-at-rest");
  const saved = [];
  run({ ...ARGS, layer_index: indexOf(s, "Gauge"), layer_name: "Gauge", anchor: [20, 200], position: [500, 250], rest_time: 3.167 }, { snapshot: s, saveEdit: (e) => saved.push(e) });
  assert.equal(saved.length, 1);
});
