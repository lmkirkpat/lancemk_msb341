// The fixed ExtendScript snippets (mentor/jsx/*.jsx), run against a mock AE in node:vm. This pins
// down their logic before a live session (T025/T026); it doesn't replace the live checks.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { assemble } from "../bridge-client.mjs";
import { JSX_DIR } from "../paths.mjs";

const SNIPPETS = fs.readdirSync(JSX_DIR).filter((f) => f.endsWith(".jsx")).map((f) => f.replace(/\.jsx$/, ""));

test("every snippet compiles as a function body and sticks to ES3 syntax", () => {
  for (const name of SNIPPETS) {
    const { code } = assemble(name, {});
    assert.doesNotThrow(() => new vm.Script(`(function (log) {\n${code}\n})`), name);
    const src = fs.readFileSync(path.join(JSX_DIR, `${name}.jsx`), "utf8");
    assert.doesNotMatch(src, /\b(let|const|class)\s|=>|`/, `${name}.jsx uses non-ES3 syntax`);
  }
});

// ---- A minimal After Effects for set-ease.jsx
const KIT = { LINEAR: 6612, BEZIER: 6613, HOLD: 6614 };
const PropertyType = { PROPERTY: 6212, INDEXED_GROUP: 6213, NAMED_GROUP: 6214 };
function KeyframeEase(speed, influence) { this.speed = speed; this.influence = influence; }
class CompItem {}

function mockProp(name, matchName, dims, keys) {
  const ease = (inf) => Array.from({ length: dims }, () => new KeyframeEase(0, inf));
  const k = keys.map(([time, inT, outT]) => ({ time, inT, outT, inE: ease(16.667), outE: ease(16.667) }));
  return {
    name, matchName, propertyType: PropertyType.PROPERTY, propertyDepth: 2, keys: k,
    get numKeys() { return k.length; },
    keyTime: (i) => k[i - 1].time,
    keyInInterpolationType: (i) => k[i - 1].inT,
    keyOutInterpolationType: (i) => k[i - 1].outT,
    keyInTemporalEase: (i) => k[i - 1].inE,
    keyOutTemporalEase: (i) => k[i - 1].outE,
    // Like AE: switching a side from Linear to Bezier resets that side's ease.
    setInterpolationTypeAtKey(i, inT, outT) {
      const key = k[i - 1];
      if (key.inT === KIT.LINEAR && inT === KIT.BEZIER) key.inE = ease(16.667);
      if (key.outT === KIT.LINEAR && outT === KIT.BEZIER) key.outE = ease(16.667);
      key.inT = inT;
      key.outT = outT;
    },
    // Like AE (seen live in T026): setting temporal ease makes both sides of the key Bezier.
    setTemporalEaseAtKey(i, inE, outE) {
      if (inE.length !== dims || outE.length !== dims) throw new Error("wrong number of dimensions");
      Object.assign(k[i - 1], { inE, outE, inT: KIT.BEZIER, outT: KIT.BEZIER });
    },
  };
}

function runSetEase(prop, args) {
  const transform = { name: "Transform", matchName: "ADBE Transform Group", propertyType: PropertyType.NAMED_GROUP, propertyDepth: 1 };
  const layer = { name: "Title", propertyDepth: 0, property: (n) => (n === "ADBE Transform Group" ? transform : null) };
  transform.parentProperty = layer;
  transform.property = (n) => (n === prop.matchName ? prop : null);
  prop.parentProperty = transform;
  const comp = Object.assign(new CompItem(), { id: 200, numLayers: 1, layer: () => layer });
  const ctx = vm.createContext({
    app: { project: { activeItem: comp } }, CompItem, KeyframeEase, PropertyType,
    KeyframeInterpolationType: KIT,
  });
  const { code } = assemble("set-ease", { comp_id: 200, layer_index: 1, key_index: 1, ...args });
  // Round-trip through JSON, as the bridge does (and so vm-realm arrays compare normally).
  return JSON.parse(JSON.stringify(vm.runInContext(`(function (log) {\n${code}\n})`, ctx)(() => {})));
}

test("set-ease eases key 1 out and key 2 in, and keeps the other sides", () => {
  const pos = mockProp("Position", "ADBE Position", 1, [[0, KIT.LINEAR, KIT.LINEAR], [1, KIT.LINEAR, KIT.LINEAR], [2, KIT.LINEAR, KIT.LINEAR]]);
  const r = runSetEase(pos, { property_path: "ADBE Transform Group/ADBE Position" });
  assert.deepEqual([pos.keys[0].inT, pos.keys[0].outT, pos.keys[1].inT, pos.keys[1].outT], [KIT.LINEAR, KIT.BEZIER, KIT.BEZIER, KIT.LINEAR]);
  assert.equal(pos.keys[2].inT, KIT.LINEAR, "the next pair is the learner's");
  assert.deepEqual(r.out_influence, [33.33]);
  assert.deepEqual(r.in_influence, [33.33]);
  assert.equal(r.display_path, "Transform › Position");
});

test("set-ease uses one ease per dimension (Scale reports 3 on a 2D layer)", () => {
  const scale = mockProp("Scale", "ADBE Scale", 3, [[0.5, KIT.LINEAR, KIT.LINEAR], [1.5, KIT.LINEAR, KIT.LINEAR]]);
  const r = runSetEase(scale, { property_path: "ADBE Transform Group/ADBE Scale" });
  assert.equal(r.dimensions, 3);
  assert.deepEqual(r.out_influence, [33.33, 33.33, 33.33]);
});

test("set-ease refuses a different comp than the lesson's", () => {
  const pos = mockProp("Position", "ADBE Position", 1, [[0, KIT.LINEAR, KIT.LINEAR], [1, KIT.LINEAR, KIT.LINEAR]]);
  assert.throws(() => runSetEase(pos, { property_path: "ADBE Transform Group/ADBE Position", comp_id: 999 }), /lesson's comp/);
  assert.equal(pos.keys[0].outT, KIT.LINEAR);
});
