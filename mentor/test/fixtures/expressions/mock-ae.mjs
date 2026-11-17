// A mock After Effects for spec 015's snapshot passes (the pattern of snapshot-layer-info.test.mjs),
// shared by the snippet test and the Node-side tests that run end to end through the real
// snapshot.jsx. It stands in for the logic only; the live answer keys are T015's captures.

import vm from "node:vm";
import { assemble } from "../../../bridge-client.mjs";

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
export function prop(name, matchName, spec = {}) {
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
export function layer(index, name, spec = {}) {
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

export function run(layers, args = {}) {
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
export const LONG = "value + [0, 0] // " + "x".repeat(20100);

export function comp() {
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
