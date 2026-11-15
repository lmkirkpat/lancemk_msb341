// Spec 004 wave B, tasks-wave-b T108: FR-014's motion-sources map, step 1
// (mentor/lib/motion-sources.mjs). Synthetic first (each fixture's comment says so), then T136's live
// answer keys at the end.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { motionSources, sourcesOf } from "../lib/motion-sources.mjs";
import { FIXTURES, fixture } from "./helpers.mjs";

const synthetic = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "layer-info", "synthetic", `${name}.json`), "utf8"));
const relations = synthetic("relations");

test("synthetic: a child of a null lists the null in parents, with its class", () => {
  const leaf = sourcesOf(relations, "Leaf 1");
  assert.deepEqual(leaf.parents, [{ layer_index: 1, layer: "Rig", class: "null", shy: false, moves_children: true }]);
  assert.equal(sourcesOf(relations, "Leaf 2").parents[0].layer, "Rig", "a separated child too");
});

test("synthetic: a chain of two is nearest first", () => {
  const deep = structuredClone(relations);
  deep.layer_info.find((l) => l.name === "Rig").parent = 4; // Rig follows Shy Parent
  assert.deepEqual(sourcesOf(deep, "Leaf 1").parents.map((p) => p.layer), ["Rig", "Shy Parent"]);
});

test("synthetic: children are the direct ones", () => {
  assert.deepEqual(sourcesOf(relations, "Rig").children, [{ layer_index: 2, layer: "Leaf 1" }, { layer_index: 3, layer: "Leaf 2" }]);
  assert.deepEqual(sourcesOf(relations, "Leaf 1").children, []);
});

test("synthetic: a shy parent keyed only on Opacity doesn't move its children", () => {
  assert.deepEqual(sourcesOf(relations, "Kid").parents, [{ layer_index: 4, layer: "Shy Parent", class: "shy", shy: true, moves_children: false }]);
});

test("synthetic: own keys, by group; separated Position is two properties", () => {
  assert.deepEqual(sourcesOf(relations, "Leaf 2").own_keys.map((k) => [k.path, k.keys, k.group]), [
    ["ADBE Transform Group/ADBE Position_0", 2, "transform"],
    ["ADBE Transform Group/ADBE Position_1", 2, "transform"],
  ]);
  assert.deepEqual(sourcesOf(relations, "Kid").own_keys, []);
});

test("synthetic: a keyed property with an expression on is in own_keys and in expressions.on_keyed", () => {
  const dial = sourcesOf(relations, "Gauge Dial");
  assert.equal(dial.own_keys[0].expression_on, true);
  assert.deepEqual(dial.expressions, { status: "not_read", on_keyed: [{ property: "Rotation", path: "ADBE Transform Group/ADBE Rotate Z" }] });
});

test("synthetic: expressions.status is not_read on every layer, never none (FR-014)", () => {
  const map = motionSources(relations);
  assert.equal(map.layers.length, 10);
  for (const l of map.layers) assert.equal(l.expressions.status, "not_read", l.layer);
  assert.deepEqual(sourcesOf(relations, "Still").expressions, { status: "not_read", on_keyed: [] });
  assert.deepEqual(map.read, { own_keys: true, parents: true, expressions: "keyed_only", precomp_contents: "not_read" });
});

test("synthetic: precomp_contents is not_read on a precomp layer and not_a_precomp elsewhere", () => {
  assert.equal(sourcesOf(relations, "Icon Stretch").precomp_contents, "not_read");
  assert.equal(sourcesOf(relations, "Still").precomp_contents, "not_a_precomp");
});

test("synthetic: a layer with no keys and no parent is static as read; a child or a keyed layer isn't", () => {
  assert.equal(sourcesOf(relations, "Still").static_as_read, true);
  assert.equal(sourcesOf(relations, "Kid").static_as_read, false);
  assert.equal(sourcesOf(relations, "Gauge Dial").static_as_read, false);
});

test("synthetic: sourcesOf() by index, and null for a layer not in the comp", () => {
  assert.equal(sourcesOf(relations, 5).layer, "Kid");
  assert.equal(sourcesOf(relations, "Not Here"), null);
  assert.equal(sourcesOf(relations, 42), null);
});

test("without layer_info: parents null and read.parents not_read", () => {
  const old = fixture("hidden-layer");
  const map = motionSources(old);
  assert.equal(map.known, false);
  assert.equal(map.read.parents, "not_read");
  assert.deepEqual(map.layers.map((l) => l.layer), ["Old Take", "Title"]);
  for (const l of map.layers) {
    assert.equal(l.parents, null);
    assert.equal(l.children, null);
    assert.equal(l.static_as_read, false);
    assert.equal(l.expressions.status, "not_read");
  }
});

// ---- T136: live captures against the motion entries their build scripts declared

const LIVE = path.join(FIXTURES, "layer-info");
const live = (name) => JSON.parse(fs.readFileSync(path.join(LIVE, name), "utf8"));

for (const [file, keyFile] of [["overlaps.json", "overlaps-expected.json"], ["practice2b.json", "practice2b-expected.json"]]) {
  test(`live ${file}: every declared layer's entry is as declared (parents, own keys, keyed expressions, precomp contents, static)`, () => {
    const snap = live(file);
    for (const d of live(keyFile).layers) {
      const m = sourcesOf(snap, d.name);
      assert.ok(m, d.name);
      const view = {
        parents: m.parents.map(({ layer, class: cls, shy, moves_children }) => ({ layer, class: cls, shy, moves_children })),
        own_keys: m.own_keys.map((k) => k.path),
        expressions_on_keyed: m.expressions.on_keyed.map((k) => k.path),
        precomp_contents: m.precomp_contents,
        static_as_read: m.static_as_read,
      };
      for (const [field, want] of Object.entries(d.motion)) assert.deepEqual(view[field], want, `${d.name}.${field}`);
      assert.equal(m.expressions.status, "not_read", `${d.name}: never "none" (FR-014)`);
    }
  });
}

test("live practice-r1.json: Title's map lists its own keys and CTRL (US4 scenario 2)", () => {
  const snap = live("practice-r1.json");
  const title = sourcesOf(snap, "Title");
  const keyed = snap.layers.find((l) => l.name === "Title").properties;
  assert.deepEqual(title.own_keys.map((k) => [k.path, k.keys]), keyed.map((p) => [p.path, p.keys.length]));
  assert.deepEqual(title.parents.map((p) => [p.layer, p.class]), [["CTRL", "null"]]);
  assert.equal(title.parents[0].moves_children, true, "CTRL's Position is keyed");
  assert.ok(sourcesOf(snap, "CTRL").children.some((c) => c.layer === "Title"));
});

// ---- Spec 015 T019 (FR-005, K3; data-model § 3): expressions in the map

import { comp1, LIVE as COMP1_LIVE } from "./fixtures/expressions/comp1.mjs";
import { comp as mockComp, layer as mockLayer, run as runMock } from "./fixtures/expressions/mock-ae.mjs";

test(`SC-003: rock.png's parent Shake Control moves its children by expression (Comp 1, ${COMP1_LIVE ? "live" : "derived"})`, () => {
  const snap = comp1();
  const map = motionSources(snap);
  assert.equal(map.read.expressions, "all");
  const rock = sourcesOf(snap, "rock.png");
  assert.deepEqual(rock.parents.map(({ layer, moves_children, moves_by }) => ({ layer, moves_children, moves_by })), [
    { layer: "Shake Control", moves_children: true, moves_by: "expression" },
  ]);
  assert.deepEqual(rock.expressions, { status: "read", list: [] });
  const shake = sourcesOf(snap, "Shake Control");
  assert.deepEqual(shake.expressions.list.map((x) => [x.property, x.active]), [["Position", true], ["Rotation", true]]);
  assert.equal(shake.static_as_read, false, "no keys and no parent, but its own expressions move it");
  assert.equal(sourcesOf(snap, "Sweep Control").static_as_read, false, "keyed");
  assert.equal(sourcesOf(snap, "White Solid 1").static_as_read, true, "no keys, no parent, no expression, all read");
});

test("E19: a parent whose expression never varies doesn't move its children; one that varies does", () => {
  const layers = mockComp();
  layers.push(mockLayer(10, "Still Kid", { parent: layers[6] }), mockLayer(11, "Shaker Kid", { parent: layers[0] }));
  const snap = runMock(layers);
  const still = sourcesOf(snap, "Still Kid").parents[0];
  assert.deepEqual([still.layer, still.moves_children, still.moves_by], ["Still", false, null]);
  const shaker = sourcesOf(snap, "Shaker Kid").parents[0];
  assert.deepEqual([shaker.layer, shaker.moves_children, shaker.moves_by], ["Shaker", true, "expression"]);
});

test("an older snapshot keeps keyed_only, on_keyed and the parent shape it had", () => {
  const snap = comp1();
  delete snap.expressions;
  const map = motionSources(snap);
  assert.equal(map.read.expressions, "keyed_only");
  const rock = sourcesOf(snap, "rock.png");
  assert.deepEqual(rock.expressions, { status: "not_read", on_keyed: [] });
  assert.deepEqual(Object.keys(rock.parents[0]), ["layer_index", "layer", "class", "shy", "moves_children"]);
  assert.equal(rock.parents[0].moves_children, false, "as before: keys only, so the read can't see the shake");
});

test("live E19 (015 Planted): Const Parent's value expression doesn't move Const Kid", () => {
  const snap = JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", "planted.json"), "utf8"));
  const p = sourcesOf(snap, "Const Kid").parents[0];
  assert.deepEqual([p.layer, p.moves_children, p.moves_by], ["Const Parent", false, null]);
});

test("live 015 Rig: rock.png's parent moves it by expression, from the sweep (varies), not only as unread", () => {
  const snap = JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", "rig.json"), "utf8"));
  const p = sourcesOf(snap, "rock.png").parents[0];
  assert.deepEqual([p.layer, p.moves_children, p.moves_by], ["Shake Control", true, "expression"]);
  assert.ok(sourcesOf(snap, "Shake Control").expressions.list.every((x) => x.moves.varies === true));
});
