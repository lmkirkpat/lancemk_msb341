// Spec 009 T007: the demo snippet (mentor/jsx/key-types-demo.jsx) against a mock AE in node:vm, and its
// fixture twin. Pins the logic before live checks L-2 and L-3; doesn't replace them.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { assemble, buildSource } from "../bridge-client.mjs";
import { JSX_DIR } from "../paths.mjs";
import { HOLD_SIDES, OPACITY_PATH } from "../lib/key-types.mjs";
import * as twin from "../fixture/key-types-demo.mjs";
import { load } from "./fixtures/key-types/load.mjs";

const SRC = path.join(JSX_DIR, "key-types-demo.jsx");
const KIT = { LINEAR: 6612, BEZIER: 6613, HOLD: 6614 };
const PropertyType = { PROPERTY: 6212, INDEXED_GROUP: 6213, NAMED_GROUP: 6214 };
class CompItem {}

function mockOpacity(keys) {
  const k = keys.map(([time, inT, outT, value]) => ({ time, inT, outT, value, ease: "kept" }));
  return {
    name: "Opacity", matchName: "ADBE Opacity", propertyType: PropertyType.PROPERTY, propertyDepth: 2, keys: k,
    get numKeys() { return k.length; },
    keyTime: (i) => k[i - 1].time,
    keyInInterpolationType: (i) => k[i - 1].inT,
    keyOutInterpolationType: (i) => k[i - 1].outT,
    setInterpolationTypeAtKey(i, inT, outT) { k[i - 1].inT = inT; k[i - 1].outT = outT; },
  };
}

function run(prop, args, code) {
  const transform = { name: "Transform", matchName: "ADBE Transform Group", propertyType: PropertyType.NAMED_GROUP, propertyDepth: 1 };
  const layer = { name: "Blink", propertyDepth: 0, property: (n) => (n === "ADBE Transform Group" ? transform : null) };
  transform.parentProperty = layer;
  transform.property = (n) => (n === prop.matchName ? prop : null);
  prop.parentProperty = transform;
  const comp = Object.assign(new CompItem(), { id: 300, numLayers: 1, layer: () => layer });
  const ctx = vm.createContext({ app: { project: { activeItem: comp } }, CompItem, PropertyType, KeyframeInterpolationType: KIT });
  const full = { comp_id: 300, layer_index: 1, property_path: OPACITY_PATH, key_index: 1, ...args };
  const src = code ? code(full) : assemble("key-types-demo", full).code;
  return JSON.parse(JSON.stringify(vm.runInContext(`(function (log) {\n${src}\n})`, ctx)(() => {})));
}

const blink = () => mockOpacity([[1, KIT.BEZIER, KIT.BEZIER, 100], [1.4, KIT.BEZIER, KIT.BEZIER, 0], [1.8, KIT.BEZIER, KIT.BEZIER, 100]]);

test("the snippet assembles with the shared ES3 libraries and uses no ES5+ syntax", () => {
  const { code } = assemble("key-types-demo", { comp_id: 1, layer_index: 1, property_path: OPACITY_PATH, key_index: 1 });
  assert.match(code, /function propByPath/);
  assert.doesNotThrow(() => new vm.Script(`(function (log) {\n${code}\n})`));
  assert.doesNotMatch(fs.readFileSync(SRC, "utf8"), /\b(let|const|class)\s|=>|`/);
});

test("the snippet and the lib agree on HOLD_SIDES", () => {
  const m = /var HOLD_SIDES = "(out|both)";/.exec(fs.readFileSync(SRC, "utf8"));
  assert.ok(m, "HOLD_SIDES is set at the top of the snippet");
  assert.equal(m[1], HOLD_SIDES);
});

test("out: the key's outgoing side becomes hold, its incoming side and every other key stay", () => {
  const prop = blink();
  const r = run(prop, { key_index: 2 });
  assert.deepEqual([prop.keys[1].inT, prop.keys[1].outT], [KIT.BEZIER, KIT.HOLD]);
  assert.deepEqual([prop.keys[0].inT, prop.keys[0].outT, prop.keys[2].inT, prop.keys[2].outT], [KIT.BEZIER, KIT.BEZIER, KIT.BEZIER, KIT.BEZIER]);
  assert.deepEqual(prop.keys.map((k) => k.value), [100, 0, 100]);
  assert.deepEqual(r, { layer: "Blink", property: "Opacity", display_path: "Transform › Opacity", from_time: 1.4, to_time: 1.8, in_type: "bezier", out_type: "hold" });
});

test("both: with HOLD_SIDES set to both, the incoming side is held too", () => {
  const prop = blink();
  const r = run(prop, {}, (args) => {
    const file = path.join(JSX_DIR, "key-types-demo.jsx");
    const { code } = buildSource(file, args);
    return code.replace('var HOLD_SIDES = "out";', 'var HOLD_SIDES = "both";');
  });
  assert.deepEqual([prop.keys[0].inT, prop.keys[0].outT], [KIT.HOLD, KIT.HOLD]);
  assert.equal(r.in_type, "hold");
});

test("the snippet refuses another comp and a key pair that doesn't exist, changing nothing", () => {
  const prop = blink();
  assert.throws(() => run(prop, { comp_id: 999 }), /lesson's comp/);
  assert.throws(() => run(prop, { key_index: 3 }), /don't exist/);
  assert.equal(prop.keys[0].outT, KIT.BEZIER);
});

test("the twin's apply sets only the out side (HOLD_SIDES out) and keeps values, eases and other keys", () => {
  const snap = load("practice2-before.json");
  const before = structuredClone(snap);
  twin.apply(snap, { layer_index: 1, property_path: OPACITY_PATH, key_index: 1 });
  const keys = snap.layers[0].properties[0].keys;
  assert.equal(keys[0].out_type, "hold");
  assert.equal(keys[0].in_type, HOLD_SIDES === "both" ? "hold" : before.layers[0].properties[0].keys[0].in_type);
  const strip = (s) => { const c = structuredClone(s); delete c.layers[0].properties[0].keys[0].out_type; delete c.layers[0].properties[0].keys[0].in_type; return c; };
  assert.deepEqual(strip(snap), strip(before));
});

test("the twin's run returns the demo result and saves the edit", () => {
  const snap = load("practice2-before.json");
  const saved = [];
  const r = twin.run({ comp_id: 300, layer_index: 1, property_path: OPACITY_PATH, key_index: 1 }, { snapshot: snap, saveEdit: (e) => saved.push(e) });
  assert.deepEqual(r, { layer: "Blink", property: "Opacity", display_path: "Transform › Opacity", from_time: 1, to_time: 1.4, in_type: "bezier", out_type: "hold" });
  assert.deepEqual(saved, [{ layer_index: 1, property_path: OPACITY_PATH, key_index: 1 }]);
  assert.throws(() => twin.run({ comp_id: 1, layer_index: 1, property_path: OPACITY_PATH, key_index: 1 }, { snapshot: snap, saveEdit: () => {} }), { code: "NO_ACTIVE_COMP" });
});
