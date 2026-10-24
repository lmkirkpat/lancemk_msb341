// Spec 004 wave B, tasks-wave-b T104 and T151: reads R1 and R3 in mentor/jsx/snapshot.jsx, run in
// node:vm against a mock After Effects defined here (the pattern of snippets.test.mjs, which stays
// as it is). The mock is a stand-in for the logic only; the live answer keys are T133 to T136.

import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { assemble } from "../bridge-client.mjs";

const KIT = { LINEAR: 6612, BEZIER: 6613, HOLD: 6614 };
const PropertyType = { PROPERTY: 6212, INDEXED_GROUP: 6213, NAMED_GROUP: 6214 };
const TrackMatteType = { NO_TRACK_MATTE: 1, ALPHA: 2, ALPHA_INVERTED: 3, LUMA: 4, LUMA_INVERTED: 5 };
const AutoOrientType = { NO_AUTO_ORIENT: 1, ALONG_PATH: 2, CAMERA_OR_POINT_OF_INTEREST: 3 };
class CompItem {}
class AVLayer {}
class TextLayer extends AVLayer {}
class ShapeLayer extends AVLayer {}
class CameraLayer {}
class LightLayer {}
class SolidSource {}

// Getters that must never run (FR-011): a layer source's name, file and fsName.
const forbidden = [];
function watchedSource(base, label) {
  for (const key of ["name", "file", "fsName"]) {
    Object.defineProperty(base, key, { get() { forbidden.push(`${label}.${key}`); return "secret"; } });
  }
  return base;
}

// A property with a static value or linear keys [[time, value], ...]. valueAtTime interpolates, or
// calls `expr(t)` when an expression is on (the rendered value).
function mockProp(name, matchName, spec = {}) {
  const keys = spec.keys || [];
  const lerp = (t) => {
    if (!keys.length) return spec.value;
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      if (t <= t1) {
        const u = (t - t0) / (t1 - t0);
        return Array.isArray(v0) ? v0.map((x, d) => x + (v1[d] - x) * u) : v0 + (v1 - v0) * u;
      }
    }
    return keys[keys.length - 1][1];
  };
  return {
    name, matchName, propertyType: PropertyType.PROPERTY, propertyDepth: 2, canVaryOverTime: true,
    canSetExpression: true, expressionEnabled: !!spec.expr,
    get numKeys() { return keys.length; },
    keyTime: (i) => keys[i - 1][0],
    keyValue: (i) => keys[i - 1][1],
    keyInInterpolationType: () => KIT.LINEAR,
    keyOutInterpolationType: () => KIT.LINEAR,
    keyInTemporalEase: () => [{ speed: 0, influence: 16.667 }],
    keyOutTemporalEase: () => [{ speed: 0, influence: 16.667 }],
    valueAtTime: (t, pre) => (spec.expr && !pre ? spec.expr(t) : lerp(t)),
  };
}

function group(name, matchName, props, type = PropertyType.NAMED_GROUP) {
  const g = {
    name, matchName, propertyType: type, propertyDepth: 1, numProperties: props.length,
    property: (n) => (typeof n === "number" ? props[n - 1] || null : props.find((p) => p.matchName === n) || null),
  };
  for (const p of props) p.parentProperty = g;
  return g;
}

// t: { anchor, position, scale, rotation, opacity } each a spec for mockProp; `separated` puts
// position's keys on X and Y instead.
function transformGroup(t = {}) {
  const pos = mockProp("Position", "ADBE Position", t.separated ? { value: [0, 0, 0] } : t.position || { value: [960, 540, 0] });
  const props = [mockProp("Anchor Point", "ADBE Anchor Point", t.anchor || { value: [0, 0, 0] }), pos];
  pos.isSeparationLeader = true;
  pos.dimensionsSeparated = !!t.separated;
  if (t.separated) {
    for (const [d, label] of [[0, "X Position"], [1, "Y Position"]]) {
      const dim = mockProp(label, `ADBE Position_${d}`, t.separated[d]);
      dim.isSeparationFollower = true;
      dim.separationLeader = pos;
      props.push(dim);
    }
  }
  props.push(
    mockProp("Scale", "ADBE Scale", t.scale || { value: [100, 100, 100] }),
    mockProp("Rotation", "ADBE Rotate Z", t.rotation || { value: 0 }),
    mockProp("Opacity", "ADBE Opacity", t.opacity || { value: 100 }),
  );
  return group("Transform", "ADBE Transform Group", props);
}

function mockLayer(spec) {
  const Cls = spec.cls || AVLayer;
  const layer = Object.assign(new Cls(), {
    enabled: true, nullLayer: false, adjustmentLayer: false, hasVideo: true, threeDLayer: false,
    collapseTransformation: false, autoOrient: AutoOrientType.NO_AUTO_ORIENT, parent: null,
    shy: false, solo: false, guideLayer: false, locked: false, inPoint: 0, outPoint: 4, startTime: 0,
    stretch: 100, timeRemapEnabled: false, isTrackMatte: false, hasTrackMatte: false,
    trackMatteLayer: null, trackMatteType: TrackMatteType.NO_TRACK_MATTE, motionBlur: false,
    propertyDepth: 0,
  }, spec.attrs || {});
  layer.index = spec.index;
  layer.name = spec.name;
  if (spec.source) layer.source = spec.source;
  const transform = transformGroup(spec.transform);
  const effects = group("Effects", "ADBE Effect Parade", [], PropertyType.INDEXED_GROUP);
  effects.numProperties = spec.effects || 0;
  const marker = { name: "Marker", matchName: "ADBE Marker", propertyType: PropertyType.PROPERTY, numKeys: 1 };
  const top = [marker, transform, effects];
  layer.numProperties = top.length;
  layer.property = (n) => (typeof n === "number" ? top[n - 1] || null : top.find((p) => p.matchName === n) || null);
  transform.parentProperty = layer;
  effects.parentProperty = layer;
  const rect = spec.rect || { left: -50, top: -50, width: 100, height: 100 };
  layer.sourceRectAtTime = spec.rectThrows
    ? () => { throw new Error("no rect"); }
    : (t, extents) => (extents ? { ...rect, left: rect.left - 2, width: rect.width + 4 } : rect);
  for (const [key, fn] of Object.entries(spec.throwing || {})) Object.defineProperty(layer, key, { get: fn });
  return layer;
}

function mockComp(layers, { time = 0.5, hideShy = true } = {}) {
  const comp = Object.assign(new CompItem(), {
    id: 300, name: "Mock Overlaps", duration: 6, frameRate: 30, time, hideShyLayers: hideShy,
    numLayers: layers.length, layer: (i) => layers[i - 1],
  });
  for (const l of layers) l.containingComp = comp;
  return comp;
}

function runSnapshot(comp, args = {}) {
  const projectFile = watchedSource({ displayName: "Mock.aep" }, "project.file");
  Object.defineProperty(projectFile, "displayName", { value: "Mock.aep" });
  const ctx = vm.createContext({
    app: { project: { activeItem: comp, file: projectFile }, version: "26.5x12" }, $: { os: "Macintosh OS 27.0.1" },
    CompItem, TextLayer, ShapeLayer, CameraLayer, LightLayer, SolidSource, PropertyType, TrackMatteType,
    AutoOrientType, KeyframeInterpolationType: KIT,
  });
  const { code } = assemble("snapshot", args);
  return JSON.parse(JSON.stringify(vm.runInContext(`(function (log) {\n${code}\n})`, ctx)(() => {})));
}

const solidSource = (label) => watchedSource(Object.assign({}, { mainSource: new SolidSource() }), label);

// The comp T104 asks for, plus a grandparent (Root) for T151's chain.
function overlapsComp(opts) {
  const root = mockLayer({ index: 3, name: "Root", attrs: { nullLayer: true } });
  const ctrl = mockLayer({ index: 2, name: "Ctrl", attrs: { nullLayer: true, parent: root } });
  const title = mockLayer({
    index: 1, name: "Title", cls: TextLayer, attrs: { parent: ctrl },
    transform: { position: { keys: [[0, [100, 200, 0]], [1, [300, 200, 0]]] } },
  });
  const wipe = mockLayer({ index: 4, name: "Wipe", cls: ShapeLayer, attrs: { enabled: false, isTrackMatte: true } });
  const box = mockLayer({ index: 5, name: "Box", source: solidSource("box.source"), attrs: { hasTrackMatte: true, trackMatteLayer: wipe, trackMatteType: TrackMatteType.ALPHA } });
  const guide = mockLayer({ index: 6, name: "Grid", source: solidSource("grid.source"), attrs: { guideLayer: true } });
  const shy = mockLayer({ index: 7, name: "Shy One", source: solidSource("shy.source"), attrs: { shy: true }, effects: 2 });
  const locked = mockLayer({
    index: 8, name: "Locked Bar", source: solidSource("locked.source"), attrs: { locked: true },
    transform: { separated: [{ keys: [[0, 10], [2, 30]] }, { keys: [[0, 50], [2, 50]] }] },
  });
  const pre = mockLayer({
    index: 9, name: "Icon Stretch", source: watchedSource(new CompItem(), "precomp.source"),
    attrs: { stretch: 50, outPoint: 2, collapseTransformation: true, timeRemapEnabled: true },
  });
  const broken = mockLayer({
    index: 10, name: "Broken", source: solidSource("broken.source"), rectThrows: true,
    throwing: { stretch: () => { throw new Error("unreadable"); } },
  });
  return mockComp([title, ctrl, root, wipe, box, guide, shy, locked, pre, broken], opts);
}

const SPEC_002_FIELDS = ["enabled", "index", "is_null", "kind", "name", "properties"];
const INFO_FIELDS = [
  "adjustment", "auto_orient", "collapse", "effect_count", "enabled", "has_video", "in_point", "index",
  "is_matte", "is_null", "kind", "locked", "matte", "motion_blur", "name", "out_point", "parent",
  "samples", "samples_truncated", "shy", "solo", "start_time", "stretch", "three_d", "time_remap",
  "transform", "guide",
].sort();

test("layer_info has one entry per layer in index order, unkeyed layers included", () => {
  forbidden.length = 0;
  const snap = runSnapshot(overlapsComp());
  assert.deepEqual(snap.layer_info.map((l) => l.index), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(snap.layer_info.map((l) => l.name), ["Title", "Ctrl", "Root", "Wipe", "Box", "Grid", "Shy One", "Locked Bar", "Icon Stretch", "Broken"]);
  for (const entry of snap.layer_info) assert.deepEqual(Object.keys(entry).sort(), INFO_FIELDS, entry.name);
});

test("layers keeps only keyed layers, each with exactly spec 002's fields; precomp_layers and host as before", () => {
  const snap = runSnapshot(overlapsComp());
  assert.deepEqual(snap.layers.map((l) => l.name), ["Title", "Locked Bar"]);
  for (const l of snap.layers) assert.deepEqual(Object.keys(l).sort(), SPEC_002_FIELDS);
  assert.deepEqual(snap.layers[1].properties.map((p) => p.path), ["ADBE Transform Group/ADBE Position_0", "ADBE Transform Group/ADBE Position_1"]);
  assert.deepEqual(snap.precomp_layers, [{ index: 9, name: "Icon Stretch" }]);
  assert.deepEqual(snap.host, { ae_version: "26.5x12", os: "Macintosh OS 27.0.1" });
  assert.equal(snap.project, "Mock.aep");
});

test("comp.time and comp.hide_shy are read", () => {
  const snap = runSnapshot(overlapsComp({ time: 1.23456, hideShy: false }));
  assert.equal(snap.comp.time, 1.235);
  assert.equal(snap.comp.hide_shy, false);
  assert.equal(runSnapshot(overlapsComp()).comp.hide_shy, true);
});

test("each R1 field has the mock's value", () => {
  const info = Object.fromEntries(runSnapshot(overlapsComp()).layer_info.map((l) => [l.name, l]));
  assert.equal(info.Title.kind, "text");
  assert.equal(info.Title.parent, 2);
  assert.equal(info.Ctrl.parent, 3);
  assert.equal(info.Ctrl.is_null, true);
  assert.equal(info.Ctrl.kind, "null");
  assert.equal(info.Root.parent, null);
  assert.equal(info.Wipe.enabled, false);
  assert.equal(info.Wipe.is_matte, true);
  assert.equal(info.Wipe.kind, "shape");
  assert.deepEqual(info.Box.matte, { layer: 4, type: "alpha" });
  assert.equal(info.Box.kind, "solid");
  assert.equal(info.Title.matte, null);
  assert.equal(info.Grid.guide, true);
  assert.equal(info["Shy One"].shy, true);
  assert.equal(info["Shy One"].effect_count, 2);
  assert.equal(info["Locked Bar"].locked, true);
  assert.equal(info["Icon Stretch"].kind, "precomp");
  assert.equal(info["Icon Stretch"].stretch, 50);
  assert.equal(info["Icon Stretch"].out_point, 2);
  assert.equal(info["Icon Stretch"].time_remap, true);
  assert.equal(info["Icon Stretch"].collapse, true);
  assert.equal(info.Title.collapse, false);
  assert.equal(info.Title.three_d, false);
  assert.equal(info.Title.auto_orient, false);
  for (const l of Object.values(info)) {
    assert.equal(l.solo, false);
    assert.equal(l.adjustment, false);
    assert.equal(l.has_video, true);
    assert.equal(l.motion_blur, false);
    assert.equal(l.in_point, 0);
    assert.equal(l.start_time, 0);
  }
});

test("transform holds rendered values at comp.time; position is assembled from X and Y when separated", () => {
  const info = Object.fromEntries(runSnapshot(overlapsComp()).layer_info.map((l) => [l.name, l]));
  assert.deepEqual(info.Title.transform, { anchor: [0, 0, 0], position: [200, 200, 0], scale: [100, 100, 100], rotation: 0, opacity: 100 });
  assert.deepEqual(info["Locked Bar"].transform.position, [15, 50]);
});

test("a rendered value comes from after the expression", () => {
  const layer = mockLayer({ index: 1, name: "Gauge Dial", transform: { rotation: { keys: [[0, 0], [1, 90]], expr: () => 45 } } });
  const [entry] = runSnapshot(mockComp([layer], { time: 0 })).layer_info;
  assert.equal(entry.transform.rotation, 45);
  assert.ok(entry.samples.every((s) => s.rotation === 45));
});

test("samples: comp.time and own key times, each with rect; rect_extents on text and shape only", () => {
  const info = Object.fromEntries(runSnapshot(overlapsComp()).layer_info.map((l) => [l.name, l]));
  assert.deepEqual(info.Title.samples.map((s) => s.time), [0, 0.5, 1]);
  assert.deepEqual(info.Title.samples[2], {
    time: 1, anchor: [0, 0, 0], position: [300, 200, 0], scale: [100, 100, 100], rotation: 0,
    rect: { left: -50, top: -50, width: 100, height: 100 }, rect_extents: { left: -52, top: -50, width: 104, height: 100 },
  });
  assert.equal(info.Box.samples[0].rect_extents, null);
  assert.notEqual(info.Wipe.samples[0].rect_extents, null);
  assert.deepEqual(info["Locked Bar"].samples.map((s) => s.time), [0, 0.5, 2]);
  assert.deepEqual(info.Box.samples.map((s) => s.time), [0.5]);
  for (const l of Object.values(info)) assert.equal(l.samples_truncated, false);
});

test("a parent with no keys is sampled at its child's key times, and a grandparent at its grandchild's", () => {
  const info = Object.fromEntries(runSnapshot(overlapsComp()).layer_info.map((l) => [l.name, l]));
  assert.deepEqual(info.Ctrl.samples.map((s) => s.time), [0, 0.5, 1]);
  assert.deepEqual(info.Root.samples.map((s) => s.time), [0, 0.5, 1]);
});

test("sample_times from the caller appear on every layer", () => {
  const snap = runSnapshot(overlapsComp(), { sample_times: [2.5, "bad", 0.5] });
  for (const l of snap.layer_info) assert.ok(l.samples.some((s) => s.time === 2.5), l.name);
  assert.deepEqual(snap.layer_info[0].samples.map((s) => s.time), [0, 0.5, 1, 2.5]);
});

test("70 key times truncate at 64, keeping comp.time and the caller's times", () => {
  const keys = Array.from({ length: 70 }, (_, k) => [k * 0.05, k]);
  const layer = mockLayer({ index: 1, name: "Busy", transform: { opacity: { keys } } });
  const [entry] = runSnapshot(mockComp([layer], { time: 3.333 }), { sample_times: [9.5] }).layer_info;
  assert.equal(entry.samples.length, 64);
  assert.equal(entry.samples_truncated, true);
  const times = entry.samples.map((s) => s.time);
  assert.ok(times.includes(3.333) && times.includes(9.5));
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
  assert.equal(new Set(times).size, 64);
});

test("a read that throws gives null for that field and the snapshot still returns", () => {
  const info = Object.fromEntries(runSnapshot(overlapsComp()).layer_info.map((l) => [l.name, l]));
  assert.equal(info.Broken.stretch, null);
  assert.equal(info.Broken.samples[0].rect, null);
  assert.equal(info.Broken.in_point, 0, "other fields still read");
});

test("a layer source's name, file and fsName are never read (FR-011)", () => {
  forbidden.length = 0;
  runSnapshot(overlapsComp(), { sample_times: [1] });
  assert.deepEqual(forbidden, []);
});
