// Spec 015 T010 to T013: the expressions pass, effects, samples[].base and the sweeps in
// mentor/jsx/snapshot.jsx, run in node:vm against a mock After Effects (the pattern of
// snapshot-layer-info.test.mjs). The mock pins the logic only; the live answer keys are T015's
// captures in fixtures/expressions/.

import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { assemble } from "../bridge-client.mjs";

const KIT = { LINEAR: 6612, BEZIER: 6613, HOLD: 6614 };
const PropertyType = { PROPERTY: 6212, INDEXED_GROUP: 6213, NAMED_GROUP: 6214 };
const TrackMatteType = { NO_TRACK_MATTE: 1 };
const AutoOrientType = { NO_AUTO_ORIENT: 1 };
class CompItem {}
class AVLayer {}
class TextLayer extends AVLayer {}
class ShapeLayer extends AVLayer {}
class CameraLayer {}
class LightLayer {}
class SolidSource {}

// A property: `value` (static), or `fn(t)` for the base; `expr`: { text, enabled, error, fn(t, base) }
// where fn gives the value after the expression. AE 27.0 gives the base when the expression errors.
function prop(name, matchName, spec = {}) {
  const base = (t) => (spec.fn ? spec.fn(t) : spec.value);
  const e = spec.expr || null;
  return {
    name, matchName, propertyType: PropertyType.PROPERTY, propertyDepth: 2, canVaryOverTime: true,
    canSetExpression: spec.canSet !== false,
    expression: e ? e.text : "",
    expressionEnabled: e ? e.enabled !== false : false,
    expressionError: e && e.error ? e.error : "",
    numKeys: spec.keys || 0,
    keyTime: () => 0, keyValue: () => 0,
    keyInInterpolationType: () => KIT.LINEAR, keyOutInterpolationType: () => KIT.LINEAR,
    keyInTemporalEase: () => [{ speed: 0, influence: 16.667 }], keyOutTemporalEase: () => [{ speed: 0, influence: 16.667 }],
    valueAtTime(t, pre) {
      if (pre || !e || e.enabled === false || e.error) return base(t);
      return e.fn(t, base(t));
    },
  };
}

function group(name, matchName, props, type = PropertyType.NAMED_GROUP, depth = 1) {
  const g = {
    name, matchName, propertyType: type, propertyDepth: depth, numProperties: props.length,
    property: (n) => (typeof n === "number" ? props[n - 1] || null : props.find((p) => p.matchName === n) || null),
  };
  props.forEach((p, i) => { p.parentProperty = g; p.propertyIndex = i + 1; p.propertyDepth = depth + 1; });
  return g;
}

function transform(t = {}) {
  const pos = prop("Position", "ADBE Position", t.position || { value: [960, 540, 0] });
  pos.isSeparationLeader = true;
  pos.dimensionsSeparated = !!t.separated;
  const props = [prop("Anchor Point", "ADBE Anchor Point", t.anchor || { value: [0, 0, 0] }), pos];
  if (t.separated) {
    t.separated.forEach((spec, d) => {
      const dim = prop(["X Position", "Y Position"][d], `ADBE Position_${d}`, spec);
      dim.isSeparationFollower = true;
      dim.separationLeader = pos;
      props.push(dim);
    });
  }
  props.push(
    prop("Scale", "ADBE Scale", t.scale || { value: [100, 100, 100] }),
    prop("Rotation", "ADBE Rotate Z", t.rotation || { value: 0 }),
    prop("Opacity", "ADBE Opacity", t.opacity || { value: 100 }),
  );
  return group("Transform", "ADBE Transform Group", props);
}

// effects: [{ name, match_name, props: [prop] }]
function layer(index, name, spec = {}) {
  const l = Object.assign(new AVLayer(), {
    index, name, enabled: true, nullLayer: !!spec.isNull, adjustmentLayer: false, hasVideo: true, threeDLayer: false,
    collapseTransformation: false, autoOrient: AutoOrientType.NO_AUTO_ORIENT, parent: spec.parent || null,
    shy: false, solo: false, guideLayer: false, locked: false, inPoint: 0, outPoint: 4, startTime: 0,
    stretch: 100, timeRemapEnabled: false, isTrackMatte: false, hasTrackMatte: false, trackMatteLayer: null,
    trackMatteType: TrackMatteType.NO_TRACK_MATTE, motionBlur: false, propertyDepth: 0,
    source: { mainSource: new SolidSource() },
  });
  const tf = transform(spec.transform);
  const fxList = (spec.effects || []).map((f) => group(f.name, f.match_name, f.props || [], PropertyType.NAMED_GROUP, 2));
  const fx = group("Effects", "ADBE Effect Parade", fxList, PropertyType.INDEXED_GROUP);
  const marker = prop("Marker", "ADBE Marker", { value: 0, expr: { text: "value", fn: (t, v) => v } });
  const top = [marker, tf, fx];
  if (spec.text) top.push(group("Text", "ADBE Text Properties", [prop("Source Text", "ADBE Text Document", spec.text)]));
  top.forEach((g, i) => { g.parentProperty = l; g.propertyIndex = i + 1; });
  fx.propertyType = PropertyType.INDEXED_GROUP;
  l.numProperties = top.length;
  l.property = (n) => (typeof n === "number" ? top[n - 1] || null : top.find((p) => p.matchName === n) || null);
  l.sourceRectAtTime = () => ({ left: -50, top: -50, width: 100, height: 100 });
  return l;
}

function run(layers, args = {}) {
  const comp = Object.assign(new CompItem(), {
    id: 9, name: "Mock Expressions", duration: 4, frameRate: 30, time: 0.6, hideShyLayers: false,
    width: 1920, height: 1080, numLayers: layers.length, layer: (i) => layers[i - 1],
  });
  for (const l of layers) l.containingComp = comp;
  const ctx = vm.createContext({
    app: { project: { activeItem: comp, file: { displayName: "Mock.aep" } }, version: "27.0x1" }, $: { os: "Macintosh OS 27.0.1" },
    CompItem, TextLayer, ShapeLayer, CameraLayer, LightLayer, SolidSource, PropertyType, TrackMatteType,
    AutoOrientType, KeyframeInterpolationType: KIT,
  });
  const { code } = assemble("snapshot", args);
  return JSON.parse(JSON.stringify(vm.runInContext(`(function (log) {\n${code}\n})`, ctx)(() => {})));
}

const shake = (t) => (t < 0.5 ? 0 : Math.sin(8 * (t - 0.5) * 2 * Math.PI) * 12 * Math.exp(-4 * (t - 0.5)));
const LONG = "value + [0, 0] // " + "x".repeat(20100);

function comp() {
  const shaker = layer(1, "Shaker", {
    isNull: true,
    transform: {
      position: { value: [960, 540, 0], expr: { text: "value + offset", fn: (t, v) => [v[0] + shake(t), v[1] + shake(t) / 2, v[2]] } },
      rotation: { value: 0, expr: { text: "value + rot", fn: (t, v) => v + shake(t) / 16 } },
    },
  });
  const child = layer(2, "Child", { parent: shaker });
  const swept = layer(3, "Swept", {
    effects: [{ name: "CC Light Sweep", match_name: "CC Light Sweep", props: [prop("Center", "CC Light Sweep-0001", { value: [0, 0], expr: { text: 'thisComp.layer("Shaker").transform.position', fn: () => [5, 5] } })] }, { name: "Blur", match_name: "ADBE Gaussian Blur 2" }],
  });
  const broken = layer(4, "Broken", { transform: { position: { value: [100, 100, 0], expr: { text: 'thisComp.layer("Gone").position', error: "Expression disabled. Error at line 1", fn: () => [0, 0, 0] } } } });
  const off = layer(5, "Off", { transform: { scale: { value: [100, 100, 100], expr: { text: "[50, 50]", enabled: false, fn: () => [50, 50, 100] } } } });
  // Separated: X has the expression; Position (the hidden leader) holds a stale one that must be skipped.
  const sep = layer(6, "Sep", {
    transform: {
      position: { value: [960, 540, 0], expr: { text: "stale", fn: () => [0, 0, 0] } },
      separated: [{ value: 300, expr: { text: "value + time * 10", fn: (t, v) => v + t * 10 } }, { value: 200 }],
    },
  });
  const still = layer(7, "Still", { transform: { position: { value: [10, 10, 0], expr: { text: "value", fn: (t, v) => v } } } });
  const long = layer(8, "Long", { transform: { opacity: { value: 100, expr: { text: LONG, fn: (t, v) => v } } } });
  const words = layer(9, "Words", { text: { value: 0, canSet: true, expr: { text: '"Hi " + thisLayer.name', fn: (t, v) => v } } });
  return [shaker, child, swept, broken, off, sep, still, long, words];
}

test("T010: every expression, keyed or not, in any group; markers and the hidden dimension skipped", () => {
  const s = run(comp());
  assert.equal(s.expressions_read, "all");
  assert.deepEqual(s.expressions.map((x) => [x.layer, x.path, x.group]), [
    [1, "ADBE Transform Group/ADBE Position", "transform"],
    [1, "ADBE Transform Group/ADBE Rotate Z", "transform"],
    [3, "ADBE Effect Parade/CC Light Sweep#1/CC Light Sweep-0001", "effect"],
    [4, "ADBE Transform Group/ADBE Position", "transform"],
    [5, "ADBE Transform Group/ADBE Scale", "transform"],
    [6, "ADBE Transform Group/ADBE Position_0", "transform"],
    [7, "ADBE Transform Group/ADBE Position", "transform"],
    [8, "ADBE Transform Group/ADBE Opacity", "transform"],
    [9, "ADBE Text Properties/ADBE Text Document", "text"],
  ]);
  const sweep = s.expressions.find((x) => x.layer === 3);
  assert.equal(sweep.display_path, "Effects › CC Light Sweep › Center");
  assert.deepEqual([sweep.enabled, sweep.active, sweep.error, sweep.keys, sweep.text_cut], [true, true, null, 0, false]);
  assert.equal(sweep.text, 'thisComp.layer("Shaker").transform.position');
  assert.ok(!("_prop" in sweep), "no live handle leaves the snippet");
});

test("T010: an erroring expression is on with its error and not active (T001); an off one is off", () => {
  const s = run(comp());
  const broken = s.expressions.find((x) => x.layer === 4);
  assert.deepEqual([broken.enabled, broken.active, broken.error], [true, false, "Expression disabled. Error at line 1"]);
  const off = s.expressions.find((x) => x.layer === 5);
  assert.deepEqual([off.enabled, off.active, off.error], [false, false, null]);
});

test("T010: text over 20,000 characters is cut with its full length; an error is cut at 300", () => {
  const s = run(comp());
  const long = s.expressions.find((x) => x.layer === 8);
  assert.equal(long.text.length, 20000);
  assert.equal(long.text_length, LONG.length);
  assert.equal(long.text_cut, true);
  const layers = comp();
  layers[3].property("ADBE Transform Group").property("ADBE Position").expressionError = "e".repeat(400);
  assert.equal(run(layers).expressions.find((x) => x.layer === 4).error.length, 300);
});

test("T011: every effect is named, keyed or not", () => {
  const s = run(comp());
  assert.deepEqual(s.layer_info.find((l) => l.name === "Swept").effects, [
    { name: "CC Light Sweep", match_name: "CC Light Sweep" }, { name: "Blur", match_name: "ADBE Gaussian Blur 2" },
  ]);
  assert.deepEqual(s.layer_info.find((l) => l.name === "Child").effects, []);
});

test("T012: samples carry base only for active transform expressions, read before the expression", () => {
  const s = run(comp(), { sample_times: [1.3] });
  const shaker = s.layer_info.find((l) => l.name === "Shaker");
  const at = shaker.samples.find((x) => x.time === 1.3);
  assert.deepEqual(Object.keys(at.base).sort(), ["position", "rotation"]);
  assert.deepEqual(at.base.position, [960, 540, 0]);
  assert.equal(at.base.rotation, 0);
  assert.notDeepEqual(at.position, at.base.position, "the sample's own value is after the expression");
  // Separated: the base Position comes from X and Y before the expression.
  const sep = s.layer_info.find((l) => l.name === "Sep").samples.find((x) => x.time === 1.3);
  assert.deepEqual(sep.base, { position: [300, 200] });
  assert.deepEqual(sep.position, [313, 200]);
  // No base on an erroring, off, effect-only or expression-free layer.
  for (const n of ["Child", "Swept", "Broken", "Off", "Words"]) {
    assert.ok(s.layer_info.find((l) => l.name === n).samples.every((x) => !("base" in x)), n);
  }
});

test("T013: a coarse sweep for every active transform expression; a fine one only for measure_layers", () => {
  const coarse = run(comp());
  assert.deepEqual(coarse.expression_sweeps.map((w) => [w.layer, w.path.split("/")[1], w.kind]), [
    [1, "ADBE Position", "coarse"], [1, "ADBE Rotate Z", "coarse"], [6, "ADBE Position_0", "coarse"],
    [7, "ADBE Position", "coarse"], [8, "ADBE Opacity", "coarse"],
  ]);
  assert.deepEqual(coarse.measured_layers, []);
  const pos = coarse.expression_sweeps[0];
  assert.equal(pos.sampled_every, 0.167);
  assert.equal(pos.varies, true);
  assert.ok(pos.max_offset > 5 && pos.max_offset < 14, String(pos.max_offset));
  const still = coarse.expression_sweeps.find((w) => w.layer === 7);
  assert.deepEqual([still.varies, still.max_offset], [false, 0], "a constant expression doesn't vary (E19)");

  const fine = run(comp(), { measure_layers: [1] });
  assert.deepEqual(fine.measured_layers, [1]);
  const f = fine.expression_sweeps.filter((w) => w.kind === "fine");
  assert.deepEqual(f.map((w) => w.path.split("/")[1]), ["ADBE Position", "ADBE Rotate Z"]);
  assert.equal(f[0].sampled_every, Math.round((1 / 30) * 1000) / 1000, "one frame: 4 s / 240 is shorter");
  assert.ok(f[0].max_offset >= pos.max_offset, "the fine sweep finds at least the coarse peak");
  assert.ok(f[0].max_at >= 0.5 && f[0].max_at < 0.7, String(f[0].max_at));
});

test("without the new args the snippet still returns every older field as before", () => {
  const s = run(comp());
  for (const k of ["project", "comp", "precomp_layers", "layers", "layer_info", "host"]) assert.ok(k in s, k);
  assert.ok(s.layer_info.every((l) => typeof l.effect_count === "number"));
});
