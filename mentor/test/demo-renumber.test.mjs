// Overlap audit 2026-10-29, T467 (spec 004 tasks-wave-b): the demos sent the lesson's starting layer
// index to After Effects, so a null added (or a layer duplicated) before the demo made it change the
// wrong layer. Each index-based demo (set_ease, key_types_demo, speed_graph_demo) now reads the comp,
// finds the baseline's layer in it (renumber.mjs › layerNow, the same matching as the checks' OA-5)
// and sends that index with the layer's name; the snippet refuses when the name at the index differs.
// offset_demo already matched by name (matchLayer) and now sends the name too; anchor_demo matches
// through layerNow instead of falling back to the old index; null_parent_demo targets by name.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, fixture, tempHome } from "./helpers.mjs";
import { load as ktLoad } from "./fixtures/key-types/load.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
const setProject = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
const EDITS = path.join(home, "fixture-edits.json");
const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");
const edits = () => (fs.existsSync(EDITS) ? JSON.parse(fs.readFileSync(EDITS, "utf8")) : []);

const { layerNow } = await import("../lib/renumber.mjs");
const { demoLayer } = await import("../lib/demo-layer.mjs");
const { TOOLS } = await import("../tools/index.mjs");
const call = async (name, args = {}) => JSON.parse((await TOOLS.find((t) => t.name === name).handler(args)).content[0].text);

// Insert layers at `at` (1 is the top), shifting every index at or below it, as After Effects does
// (the same helper as renumber.test.mjs).
function insertLayers(snap, at, added) {
  const s = structuredClone(snap);
  const n = added.length;
  const shift = (i) => (typeof i === "number" && i >= at ? i + n : i);
  for (const l of s.layers) l.index = shift(l.index);
  for (const l of s.precomp_layers || []) l.index = shift(l.index);
  for (const l of s.layer_info || []) {
    l.index = shift(l.index);
    l.parent = shift(l.parent);
    if (l.matte && typeof l.matte.layer === "number") l.matte.layer = shift(l.matte.layer);
  }
  added.forEach((a, k) => {
    const index = at + k;
    if (a.keyed) s.layers.push({ ...structuredClone(a.keyed), index, name: a.name });
    if (Array.isArray(s.layer_info)) {
      s.layer_info.push({ ...structuredClone(s.layer_info[0]), index, name: a.name, is_null: !!a.is_null, parent: null, matte: null, is_matte: false });
    }
  });
  s.layers.sort((x, y) => x.index - y.index);
  if (Array.isArray(s.layer_info)) s.layer_info.sort((x, y) => x.index - y.index);
  return s;
}
const nullOnTop = (snap) => insertLayers(snap, 1, [{ name: "Group Null", is_null: true }]);
const keyedNamed = (snap, name) => snap.layers.find((l) => l.name === name);
// The comp now, written where the fixture state can point at it.
function write(snap, name) {
  const file = path.join(home, name);
  fs.writeFileSync(file, JSON.stringify(snap));
  return file;
}

beforeEach(() => {
  for (const f of [SESSION, EDITS, LEARNER]) fs.rmSync(f, { force: true });
});

// ---- layerNow and demoLayer (pure)

test("layerNow: nothing renumbered gives the same layer; a null on top moves it down one", () => {
  const base = ktLoad("practice2b.json");
  const blink = keyedNamed(base, "Blink").index;
  assert.deepEqual(layerNow(base, base, blink), { index: blink, name: "Blink" });
  assert.deepEqual(layerNow(base, nullOnTop(base), blink), { index: blink + 1, name: "Blink" });
});

test("layerNow: a same-name copy that can't be told apart is not_unique; a deleted layer is gone", () => {
  const base = ktLoad("practice2b.json");
  const blink = keyedNamed(base, "Blink");
  const copy = insertLayers(base, blink.index, [{ name: "Blink", keyed: blink }]);
  assert.deepEqual(layerNow(base, copy, blink.index), { reason: "not_unique" });
  const gone = structuredClone(base);
  gone.layers = gone.layers.filter((l) => l.name !== "Blink");
  gone.layer_info = gone.layer_info.filter((l) => l.name !== "Blink");
  assert.deepEqual(layerNow(base, gone, blink.index), { reason: "gone" });
});

test("demoLayer: the layer's index and name now, or a refusal the learner can read", () => {
  const base = ktLoad("practice2b.json");
  const blink = keyedNamed(base, "Blink");
  const lesson = { comp_id: base.comp.id, baseline: base };
  assert.deepEqual(demoLayer(lesson, nullOnTop(base), blink.index), { layer_index: blink.index + 1, layer_name: "Blink" });
  const other = structuredClone(base);
  other.comp.id = base.comp.id + 1;
  assert.throws(() => demoLayer(lesson, other, blink.index), { code: "NO_ACTIVE_COMP" });
  const copy = insertLayers(base, blink.index, [{ name: "Blink", keyed: blink }]);
  assert.throws(() => demoLayer(lesson, copy, blink.index), (e) => e.code === "DEMO_LAYER_UNCLEAR" && !/_|\{/.test(e.message));
});

// ---- The tools, in fixture mode: the lesson starts, a null goes on top, then the demo.

test("set_ease: after a null is added on top, the demo eases the same layer at its new index", async () => {
  const base = fixture("attempt-before");
  setProject(write(base, "easing-base.json"));
  const snap = await call("snapshot_project");
  assert.ok(snap.demo_target, snap.no_demo_reason);
  const was = Number(snap.demo_target.split("/")[0]);
  setProject(write(nullOnTop(base), "easing-null.json"));
  await call("set_ease", { segment_id: snap.demo_target });
  assert.equal(edits().length, 1);
  assert.equal(edits()[0].layer_index, was + 1);
});

test("key_types_demo: after a null is added on top, the demo holds Blink at its new index", async () => {
  const base = ktLoad("practice2b.json");
  setProject(write(base, "kt-base.json"));
  const snap = await call("key_types_snapshot", { skill_options: { focus: [{ layer: "Blink", property: "Opacity" }] } });
  assert.ok(snap.demo_target, snap.no_demo_reason);
  const blink = keyedNamed(base, "Blink").index;
  setProject(write(nullOnTop(base), "kt-null.json"));
  const r = await call("key_types_demo", { segment_id: snap.demo_target });
  assert.equal(r.layer, "Blink");
  assert.equal(edits()[0].layer_index, blink + 1);
});

test("key_types_demo: a same-name copy is refused before anything runs, and the demo isn't used", async () => {
  const base = ktLoad("practice2b.json");
  setProject(write(base, "kt-base.json"));
  const snap = await call("key_types_snapshot", { skill_options: { focus: [{ layer: "Blink", property: "Opacity" }] } });
  const blink = keyedNamed(base, "Blink");
  setProject(write(insertLayers(base, blink.index, [{ name: "Blink", keyed: blink }]), "kt-copy.json"));
  await assert.rejects(call("key_types_demo", { segment_id: snap.demo_target }), { code: "DEMO_LAYER_UNCLEAR" });
  assert.deepEqual(edits(), []);
  setProject(write(base, "kt-base.json"));
  await call("key_types_demo", { segment_id: snap.demo_target }); // still available
  assert.equal(edits().length, 1);
});

test("speed_graph_demo: after a null is added on top, the demo shapes the same layer at its new index", async () => {
  const base = JSON.parse(fs.readFileSync(path.join(FIXTURES, "speed-graph", "practice-now.json"), "utf8"));
  setProject(write(base, "sg-base.json"));
  const snap = await call("speed_graph_snapshot");
  assert.ok(snap.demo_target, snap.no_demo_reason);
  const was = Number(snap.demo_target.split("/")[0]);
  const name = base.layers.find((l) => l.index === was).name;
  setProject(write(nullOnTop(base), "sg-null.json"));
  const r = await call("speed_graph_demo", { segment_id: snap.demo_target });
  assert.equal(r.layer, name);
  assert.equal(edits()[0].layer_index, was + 1);
});

// ---- The snippets' backstop: a name that differs at the index is refused (fixture twins here; the
// jsx is read in snippets-layer-name below).

test("the twins refuse when the layer at the index has another name", async () => {
  const kt = await import("../fixture/key-types-demo.mjs");
  const sg = await import("../fixture/speed-graph-demo.mjs");
  const base = ktLoad("practice2b.json");
  const blink = keyedNamed(base, "Blink");
  const opa = blink.properties.find((p) => p.display_name === "Opacity").path;
  const ctx = { snapshot: structuredClone(base), saveEdit: () => assert.fail("nothing is saved") };
  const args = { comp_id: base.comp.id, layer_index: blink.index, layer_name: "Cut", property_path: opa, key_index: 1 };
  assert.throws(() => kt.run(args, ctx), { code: "DEMO_LAYER_MOVED" });
  assert.throws(() => sg.run({ ...args, out_influence: 15, in_influence: 80 }, ctx), { code: "DEMO_LAYER_MOVED" });
});

test("every index-based demo snippet checks the layer's name before it writes", () => {
  const JSX = path.join(path.dirname(FIXTURES), "..", "jsx");
  for (const name of ["set-ease", "key-types-demo", "speed-graph-demo", "offset-demo"]) {
    const src = fs.readFileSync(path.join(JSX, `${name}.jsx`), "utf8");
    const at = src.indexOf("var layer = comp.layer(ARGS.layer_index);");
    const guard = src.indexOf("DEMO_LAYER_MOVED");
    assert.ok(at >= 0 && guard > at, `${name}.jsx checks the name right after it takes the layer`);
    const firstWrite = src.search(/\.set(TemporalEaseAtKey|InterpolationTypeAtKey|ValueAtTime)\(|\.removeKey\(/);
    assert.ok(firstWrite < 0 || guard < firstWrite, `${name}.jsx checks before any write`);
  }
});
