// Spec 010 FR-010, FR-024: the demo snippet builds with the shared ES3 libraries and uses no ES5+
// syntax; run against a mock After Effects it re-creates every key later with every attribute kept,
// and refuses before any write; its fixture twin shifts key times on a saved snapshot and keeps
// everything else.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { assemble } from "../bridge-client.mjs";
import { apply, run } from "../fixture/offset-demo.mjs";
import { clone, load, PRACTICE2 } from "./fixtures/offset/load.mjs";

const JSX = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "jsx", "offset-demo.jsx");
const ARGS = { comp_id: 300, layer_index: 6, property_paths: ["ADBE Transform Group/ADBE Position"], shift_frames: 4 };

test("assemble builds offset-demo with the shared ES3 libraries and its ARGS", () => {
  const { code } = assemble("offset-demo", ARGS);
  assert.ok(code.includes("function propByPath("), "lib/paths.jsx is prepended");
  assert.ok(code.includes(`var ARGS = ${JSON.stringify(ARGS)};`));
  assert.ok(code.includes("OFFSET_REFUSED"));
});

test("offset-demo.jsx uses no ES5+ syntax or ES5 array methods", () => {
  const src = fs.readFileSync(JSX, "utf8").replace(/\/\/.*$/gm, "");
  for (const [what, re] of [
    ["let/const", /\b(let|const)\s/], ["arrow functions", /=>/], ["template strings", /`/], ["classes", /\bclass\s/],
    ["spread", /\.\.\./], ["for...of", /\bfor\s*\([^)]*\bof\b/],
    ["ES5 array methods", /\.(forEach|map|filter|reduce|some|every|indexOf|lastIndexOf|find|findIndex|includes)\(/],
    ["JSON", /\bJSON\./], ["Object.keys", /Object\.(keys|assign|entries|values)/], ["Array.isArray", /Array\.isArray/], ["trim", /\.trim\(/],
  ]) assert.doesNotMatch(src, re, what);
});

// ---- A mock After Effects, enough for the snippet: one comp, layers, keyed properties.

const LINEAR = 6612;
const BEZIER = 6613;
const HOLD = 6614;

function mockProp(name, keys, { spatial = false } = {}) {
  const ks = keys.map((k) => ({ label: 0, tCont: false, tAuto: false, sCont: false, sAuto: false, roving: false, inTan: [0, 0], outTan: [0, 0], ...k }));
  const p = {
    name, isSpatial: spatial, keys: ks, writes: 0,
    get numKeys() { return ks.length; },
    keyTime: (k) => ks[k - 1].time,
    keyValue: (k) => ks[k - 1].value,
    keyInInterpolationType: (k) => ks[k - 1].inType,
    keyOutInterpolationType: (k) => ks[k - 1].outType,
    keyInTemporalEase: (k) => ks[k - 1].inEase,
    keyOutTemporalEase: (k) => ks[k - 1].outEase,
    keyTemporalContinuous: (k) => ks[k - 1].tCont,
    keyTemporalAutoBezier: (k) => ks[k - 1].tAuto,
    keyLabel: (k) => ks[k - 1].label,
    keyInSpatialTangent: (k) => ks[k - 1].inTan,
    keyOutSpatialTangent: (k) => ks[k - 1].outTan,
    keySpatialContinuous: (k) => ks[k - 1].sCont,
    keySpatialAutoBezier: (k) => ks[k - 1].sAuto,
    keyRoving: (k) => ks[k - 1].roving,
    // A new key gets the interpolated value and default attributes, as AE would.
    addKey(t) {
      p.writes++;
      const k = { time: t, value: null, inType: LINEAR, outType: LINEAR, inEase: [{ speed: 0, influence: 16.667 }], outEase: [{ speed: 0, influence: 16.667 }], label: 0, tCont: false, tAuto: false, sCont: false, sAuto: false, roving: false, inTan: [0, 0], outTan: [0, 0] };
      ks.push(k);
      ks.sort((a, b) => a.time - b.time);
      return ks.indexOf(k) + 1;
    },
    removeKey(k) { p.writes++; ks.splice(k - 1, 1); },
    setValueAtKey(k, v) { ks[k - 1].value = v; },
    setTemporalEaseAtKey(k, i, o) { ks[k - 1].inEase = i; ks[k - 1].outEase = o; ks[k - 1].inType = BEZIER; ks[k - 1].outType = BEZIER; },
    setInterpolationTypeAtKey(k, i, o) { ks[k - 1].inType = i; ks[k - 1].outType = o; },
    setTemporalContinuousAtKey(k, v) { ks[k - 1].tCont = v; },
    setTemporalAutoBezierAtKey(k, v) { ks[k - 1].tAuto = v; },
    setSpatialTangentsAtKey(k, i, o) { ks[k - 1].inTan = i; ks[k - 1].outTan = o; },
    setSpatialContinuousAtKey(k, v) { ks[k - 1].sCont = v; },
    setSpatialAutoBezierAtKey(k, v) { ks[k - 1].sAuto = v; },
    setRovingAtKey(k, v) { ks[k - 1].roving = v; },
    setLabelAtKey(k, v) { ks[k - 1].label = v; },
  };
  return p;
}

function mockAE({ locked = false, duration = 8, fps = 30 } = {}) {
  const pos = mockProp("Position", [
    { time: 0, value: [300, 300], inType: HOLD, outType: HOLD, inEase: [{ speed: 0, influence: 16.667 }], outEase: [{ speed: 0, influence: 16.667 }], label: 3 },
    { time: 0.5, value: [300, 400], inType: HOLD, outType: BEZIER, inEase: [{ speed: 0, influence: 16.667 }], outEase: [{ speed: 0, influence: 33.33 }], tCont: true, sCont: true, inTan: [0, -10], outTan: [0, 10] },
    { time: 1.5, value: [700, 400], inType: BEZIER, outType: LINEAR, inEase: [{ speed: 0, influence: 75 }], outEase: [{ speed: 5, influence: 16.667 }], sAuto: true, inTan: [-40, 0], outTan: [40, 0] },
  ], { spatial: true });
  const opacity = mockProp("Opacity", [
    { time: 0.5, value: 20, inType: LINEAR, outType: LINEAR, inEase: [{ speed: 0, influence: 16.667 }], outEase: [{ speed: 80, influence: 16.667 }] },
    { time: 1.5, value: 100, inType: LINEAR, outType: LINEAR, inEase: [{ speed: 80, influence: 16.667 }], outEase: [{ speed: 0, influence: 16.667 }] },
  ]);
  const transform = { matchName: "ADBE Transform Group", children: { "ADBE Position": pos, "ADBE Opacity": opacity } };
  transform.property = (n) => transform.children[n] || null;
  const layer = { name: "Dot 2", locked, property: (n) => (n === "ADBE Transform Group" ? transform : null) };
  for (const p of [pos, opacity]) {
    p.parentProperty = transform;
    p.propertyDepth = 2;
    p.matchName = p === pos ? "ADBE Position" : "ADBE Opacity";
  }
  transform.parentProperty = layer;
  transform.propertyDepth = 1;
  transform.name = "Transform";
  layer.propertyDepth = 0;
  function CompItem() {}
  const comp = Object.assign(new CompItem(), { id: 300, frameRate: fps, duration, numLayers: 6, layer: (i) => (i === 6 ? layer : null) });
  return { comp, pos, opacity, CompItem };
}

const PropertyType = { PROPERTY: 6212, INDEXED_GROUP: 6213, NAMED_GROUP: 6214 };

function runJsx(ae, args) {
  const { code } = assemble("offset-demo", args);
  const ctx = vm.createContext({ app: { project: { activeItem: ae.comp } }, CompItem: ae.CompItem, PropertyType, Math });
  return vm.runInContext(`(function () {\n${code}\n})()`, ctx);
}

const PATHS = ["ADBE Transform Group/ADBE Position", "ADBE Transform Group/ADBE Opacity"];
const snapshotOf = (p) => p.keys.map((k) => ({ ...k }));

test("the snippet re-creates every key 4 frames later and keeps value, types, ease, tangents and the rest", () => {
  const ae = mockAE();
  const before = { pos: snapshotOf(ae.pos), opacity: snapshotOf(ae.opacity) };
  const r = runJsx(ae, { comp_id: 300, layer_index: 6, property_paths: PATHS, shift_frames: 4 });
  assert.deepEqual(JSON.parse(JSON.stringify(r)), { layer: "Dot 2", properties: ["Position", "Opacity"], shift_frames: 4, keys_moved: 5 });
  for (const [name, prop] of [["pos", ae.pos], ["opacity", ae.opacity]]) {
    assert.equal(prop.keys.length, before[name].length, `${name}: no key lost or added`);
    prop.keys.forEach((k, i) => {
      const want = before[name][i];
      assert.ok(Math.abs(k.time - (want.time + 4 / 30)) < 1e-9, `${name} key ${i + 1} time`);
      assert.deepEqual({ ...k, time: 0 }, { ...want, time: 0 }, `${name} key ${i + 1} keeps every attribute`);
    });
  }
});

for (const [why, setup, args] of [
  ["past_comp_end", { duration: 1.6 }, { shift_frames: 4 }],
  ["locked", { locked: true }, { shift_frames: 4 }],
  ["gap_under_floor", {}, { shift_frames: 1 }],
  ["gap_under_floor", { fps: 60 }, { shift_frames: 3 }],
  ["not_whole_frames", {}, { shift_frames: 2.5 }],
  ["not_whole_frames", {}, { shift_frames: 0 }],
]) {
  test(`the snippet refuses (${why}${setup.fps ? " at 60 fps" : ""}) before touching any key`, () => {
    const ae = mockAE(setup);
    const before = JSON.stringify([ae.pos.keys, ae.opacity.keys]);
    assert.throws(() => runJsx(ae, { comp_id: 300, layer_index: 6, property_paths: PATHS, ...args }), new RegExp(`^Error: OFFSET_REFUSED: ${why}$|OFFSET_REFUSED: ${why}`));
    assert.equal(JSON.stringify([ae.pos.keys, ae.opacity.keys]), before);
    assert.equal(ae.pos.writes + ae.opacity.writes, 0);
  });
}

test("the snippet refuses another comp, naming no change", () => {
  const ae = mockAE();
  assert.throws(() => runJsx(ae, { comp_id: 999, layer_index: 6, property_paths: PATHS, shift_frames: 4 }), /NO_ACTIVE_COMP/);
  assert.equal(ae.pos.writes, 0);
});

// ---- The fixture twin

const mp2 = load(PRACTICE2);
const dot2 = (s) => s.layers.find((l) => l.name === "Dot 2");

test("the twin's apply adds shift_frames / frame_rate to every key on the given paths and keeps the rest", () => {
  const s = clone(mp2);
  const paths = dot2(s).properties.map((p) => p.path);
  apply(s, { layer_index: 6, property_paths: paths, shift_frames: 4 });
  dot2(s).properties.forEach((p, pi) => {
    const was = dot2(mp2).properties[pi];
    p.keys.forEach((k, i) => {
      assert.equal(k.time, Math.round((was.keys[i].time + 4 / 30) * 1000) / 1000);
      assert.deepEqual({ ...k, time: 0 }, { ...was.keys[i], time: 0 }, "value, types and ease kept");
    });
  });
  assert.deepEqual(s.layers.filter((l) => l.name !== "Dot 2"), mp2.layers.filter((l) => l.name !== "Dot 2"), "nothing else moves");
});

test("the twin's apply on part of a layer moves only those paths", () => {
  const s = clone(mp2);
  apply(s, { layer_index: 6, property_paths: ["ADBE Transform Group/ADBE Opacity"], shift_frames: 6 });
  assert.equal(dot2(s).properties.find((p) => p.display_name === "Opacity").keys[0].time, 0.7);
  assert.equal(dot2(s).properties.find((p) => p.display_name === "Position").keys[0].time, 0.5);
});

test("the twin's run saves the edit and returns what moved", () => {
  const saved = [];
  const r = run({ comp_id: 300, layer_index: 6, property_paths: dot2(mp2).properties.map((p) => p.path), shift_frames: 4 }, { snapshot: clone(mp2), saveEdit: (e) => saved.push(e) });
  assert.deepEqual(r, { layer: "Dot 2", properties: ["Position", "Opacity", "Blurriness"], shift_frames: 4, keys_moved: 6 });
  assert.equal(saved.length, 1);
  assert.deepEqual(saved[0].property_paths, dot2(mp2).properties.map((p) => p.path));
});

for (const [why, args, change] of [
  ["past_comp_end", { shift_frames: 200 }, null],
  ["gap_under_floor", { shift_frames: 1 }, null],
  ["not_whole_frames", { shift_frames: 2.5 }, null],
  ["not_whole_frames", { shift_frames: 0 }, null],
  ["locked", { shift_frames: 4 }, (s) => (dot2(s).locked = true)],
]) {
  test(`the twin's run refuses (${why}) with OFFSET_REFUSED and saves nothing`, () => {
    const saved = [];
    const s = clone(mp2);
    if (change) change(s);
    assert.throws(
      () => run({ comp_id: 300, layer_index: 6, property_paths: dot2(mp2).properties.map((p) => p.path), ...args }, { snapshot: s, saveEdit: (e) => saved.push(e) }),
      (e) => e.code === "OFFSET_REFUSED" && e.reason === why && !/_/.test(e.message),
    );
    assert.equal(saved.length, 0);
  });
}
