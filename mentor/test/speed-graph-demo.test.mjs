// Spec 008 FR-007, FR-024: the demo snippet is built with the shared ES3 libraries and stays ES3;
// its fixture twin changes only the pair's two facing sides, to the fingerprint, speeds kept.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

tempHome();
const { assemble } = await import("../bridge-client.mjs");
const twin = await import("../fixture/speed-graph-demo.mjs");
const { DEMO_IN, DEMO_OUT } = await import("../lib/speed-graph.mjs");

const DIR = path.join(FIXTURES, "speed-graph");
const load = (name) => {
  const live = path.join(DIR, name);
  return JSON.parse(fs.readFileSync(fs.existsSync(live) ? live : path.join(DIR, "stand-in", name), "utf8"));
};
const POS = "ADBE Transform Group/ADBE Position";
const SCALE = "ADBE Transform Group/ADBE Scale";
const args = { comp_id: 97, layer_index: 1, property_path: POS, key_index: 1, out_influence: DEMO_OUT, in_influence: DEMO_IN };

test("the snippet is assembled with the shared ES3 libraries and its arguments", () => {
  const { code } = assemble("speed-graph-demo", args);
  assert.match(code, /function propByPath\(/);
  assert.match(code, /function displayPath\(/);
  assert.ok(code.includes(`"out_influence":${DEMO_OUT}`) && code.includes(`"in_influence":${DEMO_IN}`));
});

test("the snippet has no ES5+ syntax", () => {
  const src = fs.readFileSync(new URL("../jsx/speed-graph-demo.jsx", import.meta.url), "utf8")
    .replace(/\/\/.*$/gm, "").replace(/"(?:[^"\\]|\\.)*"/g, '""');
  assert.doesNotMatch(src, /\blet\s/);
  assert.doesNotMatch(src, /\bconst\s/);
  assert.doesNotMatch(src, /=>/);
  assert.doesNotMatch(src, /`/);
  assert.doesNotMatch(src, /\.\.\./);
  assert.doesNotMatch(src, /\bclass\s/);
});

test("run returns the demo result and saves the edit", () => {
  const saved = [];
  const r = twin.run(args, { snapshot: load("practice-now.json"), saveEdit: (e) => saved.push(e) });
  assert.deepEqual(r, {
    layer: "Title", property: "Position", display_path: "Transform › Position", from_time: 0.5, to_time: 1.5,
    dimensions: 1, out_influence: [DEMO_OUT], in_influence: [DEMO_IN],
  });
  assert.deepEqual(saved, [{ layer_index: 1, property_path: POS, key_index: 1 }]);
});

test("run on another comp throws and saves nothing", () => {
  const saved = [];
  assert.throws(() => twin.run({ ...args, comp_id: 1 }, { snapshot: load("practice-now.json"), saveEdit: (e) => saved.push(e) }), { code: "NO_ACTIVE_COMP" });
  assert.deepEqual(saved, []);
});

test("apply sets only the two facing sides, on every dimension, keeping speeds, far sides and types", () => {
  const before = load("planted-dragged-up-small.json");
  // A shared middle key with something on its far side, and an unusual speed on a facing side.
  before.layers[0].properties[0].keys[1].out_ease = [{ speed: 3, influence: 47 }];
  before.layers[0].properties[0].keys[0].out_ease = [{ speed: 5, influence: 33.333 }];
  before.layers[0].properties[0].keys[0].in_type = "linear";
  const after = JSON.parse(JSON.stringify(before));
  twin.apply(after, { layer_index: 1, property_path: POS, key_index: 1 });
  const [k1, k2, k3] = after.layers[0].properties[0].keys;
  assert.deepEqual(k1.out_ease, [{ speed: 5, influence: DEMO_OUT }]);
  assert.deepEqual(k2.in_ease, [{ speed: 8, influence: DEMO_IN }], "the landing speed is kept");
  assert.deepEqual(k2.out_ease, [{ speed: 3, influence: 47 }], "the shared key's far side is untouched");
  assert.equal(k1.in_type, "linear");
  assert.deepEqual(k3, before.layers[0].properties[0].keys[2]);
  // Everything else is as it was.
  after.layers[0].properties[0].keys[0].out_ease = before.layers[0].properties[0].keys[0].out_ease;
  after.layers[0].properties[0].keys[1].in_ease = before.layers[0].properties[0].keys[1].in_ease;
  assert.deepEqual(after, before);

  const scale = load("practice-now.json");
  twin.apply(scale, { layer_index: 1, property_path: SCALE, key_index: 1 });
  const s = scale.layers[0].properties[1].keys;
  assert.deepEqual(s[0].out_ease.map((e) => e.influence), [DEMO_OUT, DEMO_OUT, DEMO_OUT]);
  assert.deepEqual(s[1].in_ease.map((e) => e.influence), [DEMO_IN, DEMO_IN, DEMO_IN]);
  assert.deepEqual(s[0].in_ease.map((e) => e.influence), [33.333, 33.333, 33.333]);
});

test("apply on a pair that isn't there throws", () => {
  assert.throws(() => twin.apply(load("practice-now.json"), { layer_index: 1, property_path: SCALE, key_index: 2 }), /don't exist/);
});
