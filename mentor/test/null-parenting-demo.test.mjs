// Spec 012 FR-017, FR-018: the demo snippet builds with the shared ES3 libraries and uses no ES5+
// syntax; against a mock After Effects it sets one layer's parent and nothing else, and refuses
// before any write; its fixture twin parents on a saved snapshot with no jump.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { assemble } from "../bridge-client.mjs";
import { apply, run } from "../fixture/null-parent-demo.mjs";
import { p2For, p3For, storeNull } from "../lib/null-parenting-check.mjs";
import { clone, load } from "./fixtures/null-parenting/load.mjs";

const JSX = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "jsx", "null-parent-demo.jsx");
const ARGS = { comp_id: 300, layer_index: 18, layer_name: "Tile", null_index: 1, null_name: "Null 1" };

test("assemble builds null-parent-demo with the shared ES3 libraries and its ARGS", () => {
  const { code } = assemble("null-parent-demo", ARGS);
  assert.ok(code.includes("function propByPath("), "lib/paths.jsx is prepended");
  assert.ok(code.includes(`var ARGS = ${JSON.stringify(ARGS)};`));
  assert.ok(code.includes("NULL_PARENT_REFUSED"));
});

test("null-parent-demo.jsx uses no ES5+ syntax or ES5 array methods", () => {
  const src = fs.readFileSync(JSX, "utf8").replace(/\/\/.*$/gm, "");
  for (const [what, re] of [
    ["let/const", /\b(let|const)\s/], ["arrow functions", /=>/], ["template strings", /`/], ["classes", /\bclass\s/],
    ["spread", /\.\.\./], ["for...of", /\bfor\s*\([^)]*\bof\b/],
    ["ES5 array methods", /\.(forEach|map|filter|reduce|some|every|indexOf|lastIndexOf|find|findIndex|includes)\(/],
    ["JSON", /\bJSON\./], ["Object.keys", /Object\.(keys|assign|entries|values)/], ["trim", /\.trim\(/],
  ]) assert.doesNotMatch(src, re, what);
});

// ---- A mock After Effects: one comp of layers whose writes are counted.

function mockAE({ locked = false, parented = false, nullLayer = true, compId = 300, names = ["Null 1", "Tile"] } = {}) {
  const writes = [];
  const layers = names.map((name, i) => {
    const l = { name, index: i + 1, nullLayer: i === 0 ? nullLayer : false, threeDLayer: false, locked: i === 1 ? locked : false, _parent: null };
    Object.defineProperty(l, "parent", { get: () => l._parent, set: (v) => { writes.push({ layer: l.name, parent: v && v.name }); l._parent = v; } });
    return l;
  });
  if (parented) layers[1]._parent = { name: "Someone" };
  function CompItem() {}
  const comp = Object.assign(Object.create(CompItem.prototype), { id: compId, numLayers: layers.length, layer: (i) => layers[i - 1] });
  return { context: { app: { project: { activeItem: comp } }, CompItem }, writes, layers };
}

function runSnippet(mock, args) {
  const { code } = assemble("null-parent-demo", args);
  const fn = vm.runInNewContext(`(function () {\n${code}\n})`, mock.context);
  return fn();
}

const MOCK_ARGS = { comp_id: 300, layer_index: 2, layer_name: "Tile", null_index: 1, null_name: "Null 1" };

test("the snippet sets the parent only, and returns what changed", () => {
  const m = mockAE();
  const r = runSnippet(m, MOCK_ARGS);
  assert.deepEqual(m.writes, [{ layer: "Tile", parent: "Null 1" }]);
  assert.deepEqual({ ...r }, { layer: "Tile", null: "Null 1", parent: "Null 1" });
});

for (const [why, opts, args] of [
  ["locked", { locked: true }, MOCK_ARGS],
  ["already_parented", { parented: true }, MOCK_ARGS],
  ["null_fails_n1", { nullLayer: false }, MOCK_ARGS],
  ["not_found", {}, { ...MOCK_ARGS, layer_name: "Tile copy" }],
  ["not_found", { names: ["Null 1", "Tile", "Tile"] }, MOCK_ARGS],
]) {
  test(`the snippet refuses (${why}) before any write`, () => {
    const m = mockAE(opts);
    assert.throws(() => runSnippet(m, args), new RegExp(`^Error: NULL_PARENT_REFUSED: ${why}$`));
    assert.deepEqual(m.writes, []);
  });
}

test("the snippet refuses another comp than the lesson's", () => {
  const m = mockAE({ compId: 999 });
  assert.throws(() => runSnippet(m, MOCK_ARGS), /^Error: NO_ACTIVE_COMP/);
  assert.deepEqual(m.writes, []);
});

// ---- The fixture twin

function twinParent(snap, name) {
  const s = clone(snap);
  const nul = s.layer_info.find((l) => l.name === "Null 1");
  const t = s.layer_info.find((l) => l.name === name);
  let edit = null;
  run({ comp_id: s.comp.id, layer_index: t.index, layer_name: name, null_index: nul.index, null_name: "Null 1" }, { snapshot: s, saveEdit: (e) => (edit = e) });
  apply(s, edit);
  return { s, edit, stored: storeNull(s, nul.index, s.comp.time) };
}

for (const [baseFile, placedFile, name] of [
  ["practice2b.json", "null-center.json", "Tile"],
  ["practice2b.json", "null-center.json", "Stamp"],
  ["practice2b.json", "null-center.json", "Caption"],
  ["synthetic/s1-before.json", "synthetic/s1-placed.json", "Card"],
]) {
  test(`the twin parents ${name} under ${placedFile} with no jump: P2 and P3 pass, raw values rewritten`, () => {
    const base = load(baseFile);
    const placed = load(placedFile);
    const { s, stored } = twinParent(placed, name);
    const t = s.layer_info.find((l) => l.name === name);
    assert.equal(t.parent, s.layer_info.find((l) => l.name === "Null 1").index);
    const p2 = p2For(base, s, name, { throughNull: true, stored });
    assert.equal(p2.passed, true, JSON.stringify(p2));
    assert.equal(p3For(base, s, name).passed, true);
    const before = placed.layer_info.find((l) => l.name === name).transform.position;
    assert.notDeepEqual(t.transform.position, before, "raw Position rewritten into the null's space");
  });
}

test("under the Scale 150 / Rotation 30 null the twin rewrites Scale and Rotation too", () => {
  const { s } = twinParent(load("synthetic/s1-placed.json"), "Card");
  const card = s.layer_info.find((l) => l.name === "Card");
  assert.deepEqual(card.transform.scale.slice(0, 2), [66.667, 66.667]);
  assert.equal(card.transform.rotation, -30);
  const scaleKeys = s.layers.find((l) => l.name === "Card").properties.find((p) => p.display_name === "Scale").keys;
  assert.deepEqual(scaleKeys.map((k) => k.value.slice(0, 2)), [[66.667, 66.667], [73.333, 73.333]]);
});

test("a null at Scale 0 on an axis: the twin refuses null_scale_zero and saves nothing", () => {
  const s = load("synthetic/zero-scale-null.json");
  let saved = 0;
  assert.throws(() => run({ comp_id: s.comp.id, layer_index: 2, layer_name: "Card", null_index: 1, null_name: "Null 1" }, { snapshot: s, saveEdit: () => saved++ }),
    (e) => e.code === "NULL_PARENT_REFUSED" && e.reason === "null_scale_zero" && !/null_scale_zero/.test(e.message));
  assert.equal(saved, 0);
});

test("the twin refuses a locked or already-parented target, by name and index", () => {
  const s = load("null-center.json");
  const tile = s.layer_info.find((l) => l.name === "Tile");
  const args = { comp_id: 300, layer_index: tile.index, layer_name: "Tile", null_index: 1, null_name: "Null 1" };
  const lockedSnap = clone(s);
  lockedSnap.layer_info.find((l) => l.name === "Tile").locked = true;
  assert.throws(() => run(args, { snapshot: lockedSnap, saveEdit: () => assert.fail("saved") }), (e) => e.reason === "locked");
  assert.throws(() => run({ ...args, layer_index: tile.index + 1 }, { snapshot: s, saveEdit: () => assert.fail("saved") }), (e) => e.reason === "not_found");
  const shadow = s.layer_info.find((l) => l.name === "Shadow");
  assert.throws(() => run({ ...args, layer_index: shadow.index, layer_name: "Shadow" }, { snapshot: s, saveEdit: () => assert.fail("saved") }), (e) => e.reason === "already_parented");
});
