// Writes the cloud stand-ins for spec 012's live captures (quickstart › 3, T135's parented
// capture) and the permanent synthetics the spec allows (overlap rows 4, 10, 21, 23, 26, 31, 35,
// 36, 40, the 70-time cap case and the Scale 150 / Rotation 30 null for S-1). Run from the repo
// root:
//   node mentor/test/fixtures/null-parenting/stand-in/build.mjs
// stand-in/ is deleted once the live captures replace it (tasks T338); ../synthetic/ stays.
//
// Sources: Mentor Practice 2's wave B layers as declared in mentor/dev/build-practice-comp-2b.jsx
// (T157 with T163's layout: names, sizes, positions, key times and values), its wave A layers as in
// mentor/dev/build-practice-comp-2.jsx (only in practice2b-with-wave-a.json), and the snapshot's
// shape and sampling order as in mentor/jsx/snapshot.jsx (comp.time and the caller's times first,
// then each layer's own and its descendants' key times, at most 64). Text rectangles are estimates
// (no font metrics without AE). Parented variants rewrite raw values with plain arithmetic here,
// never with the skill's own code or its fixture twin, so the tests aren't circular.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const HOST = { ae_version: "26.5x89", os: "Macintosh OS 27.0.1/64" };
const TF = "ADBE Transform Group/";
const r3 = (v) => Math.round(v * 1000) / 1000 + 0;
const F = (frame) => frame / 30;
const clone = (x) => JSON.parse(JSON.stringify(x));

// ---- Properties

const PROPS = {
  anchor: { path: TF + "ADBE Anchor Point", display_path: "Transform › Anchor Point", match_name: "ADBE Anchor Point", display_name: "Anchor Point" },
  position: { path: TF + "ADBE Position", display_path: "Transform › Position", match_name: "ADBE Position", display_name: "Position" },
  x: { path: TF + "ADBE Position_0", display_path: "Transform › X Position", match_name: "ADBE Position_0", display_name: "X Position" },
  y: { path: TF + "ADBE Position_1", display_path: "Transform › Y Position", match_name: "ADBE Position_1", display_name: "Y Position" },
  scale: { path: TF + "ADBE Scale", display_path: "Transform › Scale", match_name: "ADBE Scale", display_name: "Scale" },
  rotation: { path: TF + "ADBE Rotate Z", display_path: "Transform › Rotation", match_name: "ADBE Rotate Z", display_name: "Rotation" },
  opacity: { path: TF + "ADBE Opacity", display_path: "Transform › Opacity", match_name: "ADBE Opacity", display_name: "Opacity" },
  blur: { path: "ADBE Effect Parade/ADBE Gaussian Blur 2/ADBE Gaussian Blur 2-0001", display_path: "Effects › Gaussian Blur › Blurriness", match_name: "ADBE Gaussian Blur 2-0001", display_name: "Blurriness" },
};
const ORDER = ["anchor", "position", "x", "y", "scale", "rotation", "opacity", "blur"];
const as3 = (key, v) => (["anchor", "position"].includes(key) ? [v[0], v[1], 0] : key === "scale" ? [v[0], v[1], 100] : v);

// ---- Layers: plain specs, in stack order (index 1 first)

function layer(name, kind, o = {}) {
  const size = o.size || [100, 100];
  const [w, h] = size;
  const rect = o.rect || (kind === "shape" ? { left: -w / 2, top: -h / 2, width: w, height: h }
    : kind === "text" ? { left: -w / 2, top: -h * 0.8, width: w, height: h }
    : { left: 0, top: 0, width: w, height: h });
  const anchor = o.anchor || (kind === "shape" || kind === "text" ? [0, 0] : [w / 2, h / 2]);
  return {
    name, kind, rect, anchor, position: o.position || [960, 540], scale: o.scale || [100, 100], rotation: o.rotation || 0, opacity: o.opacity ?? 100,
    keys: o.keys || {}, type: o.type || "bezier", expr: o.expr || {}, parent: o.parent || null, enabled: o.enabled ?? true, shy: !!o.shy,
    guide: !!o.guide, three_d: !!o.three_d, auto_orient: !!o.auto_orient, is_matte: !!o.is_matte, matte: o.matte || null, locked: !!o.locked,
    effect_count: o.effect_count || 0, in_point: o.in_point ?? 0, out_point: o.out_point ?? 8, adjustment: !!o.adjustment,
    rendered: o.rendered || null, // (t) => partial sample values, for an expression the keys don't show
  };
}

function valueAt(spec, key, t) {
  const k = spec.keys[key];
  if (!k || !k.length) {
    if (key === "x") return spec.position[0];
    if (key === "y") return spec.position[1];
    return spec[key === "blur" ? "opacity" : key];
  }
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      if (spec.type === "hold") return k[i - 1][1];
      const [t0, v0] = k[i - 1];
      const [t1, v1] = k[i];
      const f = (t - t0) / (t1 - t0);
      return Array.isArray(v0) ? v0.map((x, j) => x + (v1[j] - x) * f) : v0 + (v1 - v0) * f;
    }
  }
  return k[k.length - 1][1];
}

function transformAt(spec, t) {
  const sep = spec.keys.x || spec.keys.y;
  const position = sep ? [valueAt(spec, "x", t), valueAt(spec, "y", t)] : valueAt(spec, "position", t);
  const out = { anchor: valueAt(spec, "anchor", t), position, scale: valueAt(spec, "scale", t), rotation: valueAt(spec, "rotation", t), opacity: valueAt(spec, "opacity", t) };
  return spec.rendered ? { ...out, ...spec.rendered(t) } : out;
}

const easeOf = (type, dims) => Array.from({ length: dims }, () => (type === "linear" ? { speed: 10, influence: 16.667 } : { speed: 0, influence: type === "hold" ? 16.667 : 33.33 }));

function property(spec, key) {
  const def = PROPS[key];
  const type = spec.type;
  const keys = spec.keys[key].map(([time, v], i) => ({
    index: i + 1, time: r3(time), in_type: type, out_type: type, value: as3(key, v).map ? as3(key, v).map(r3) : r3(v),
    in_ease: easeOf(type, 1), out_ease: easeOf(type, 1),
  }));
  return { ...def, dimensions: 1, expression_enabled: !!spec.expr[key], keys };
}

// snapshot.jsx's order: comp.time and the caller's times first, then own and descendants' key
// times, earliest first; at most 64, then sorted.
export function sampleList(compTime, callerTimes, chainTimes) {
  const seen = new Set();
  const first = [];
  const rest = [];
  const add = (list, t) => {
    const k = String(r3(t));
    if (!seen.has(k)) {
      seen.add(k);
      list.push(t);
    }
  };
  add(first, compTime);
  for (const t of callerTimes) add(first, t);
  for (const t of [...chainTimes].sort((a, b) => a - b)) add(rest, t);
  const all = [...first, ...rest];
  return { times: all.slice(0, 64).sort((a, b) => a - b), truncated: all.length > 64 };
}

function snapshot(specs, { comp, callerTimes = [], project = "Claude AE Tutor Test.aep", note }) {
  const index = new Map();
  specs.forEach((s, i) => { if (!index.has(s.name)) index.set(s.name, i + 1); });
  const own = specs.map((s) => Object.values(s.keys).flatMap((k) => k.map(([t]) => t)));
  const chain = own.map((x) => [...x]);
  specs.forEach((s, i) => {
    let up = s.parent ? index.get(s.parent) : null;
    let guard = 0;
    while (up && guard++ < specs.length) {
      chain[up - 1].push(...own[i]);
      up = specs[up - 1].parent ? index.get(specs[up - 1].parent) : null;
    }
  });
  const layer_info = specs.map((s, i) => {
    const { times, truncated } = sampleList(comp.time, callerTimes, chain[i]);
    const rect = s.kind === "camera" || s.kind === "light" ? null : { ...s.rect };
    const sample = (t) => {
      const v = transformAt(s, t);
      return {
        time: r3(t), anchor: as3("anchor", v.anchor), position: as3("position", v.position), scale: as3("scale", v.scale), rotation: v.rotation,
        rect, rect_extents: s.kind === "text" || s.kind === "shape" ? rect : null,
      };
    };
    const now = transformAt(s, comp.time);
    return {
      index: i + 1, name: s.name, kind: s.kind, enabled: s.enabled, is_null: s.kind === "null", adjustment: s.adjustment, has_video: true,
      three_d: s.three_d, collapse: false, auto_orient: s.auto_orient, parent: s.parent ? index.get(s.parent) : null, shy: s.shy, solo: false,
      guide: s.guide, locked: s.locked, in_point: s.in_point, out_point: s.out_point, start_time: 0, stretch: 100, time_remap: false,
      matte: s.matte ? { layer: index.get(s.matte), type: "alpha" } : null, is_matte: s.is_matte, motion_blur: false, effect_count: s.effect_count,
      transform: { anchor: as3("anchor", now.anchor), position: as3("position", now.position), scale: as3("scale", now.scale), rotation: now.rotation, opacity: now.opacity },
      samples: times.map(sample), samples_truncated: truncated,
    };
  });
  const layers = specs.map((s, i) => ({ s, i })).filter(({ s }) => Object.values(s.keys).some((k) => k.length))
    .map(({ s, i }) => ({ index: i + 1, name: s.name, kind: s.kind, enabled: s.enabled, is_null: s.kind === "null", properties: ORDER.filter((k) => s.keys[k] && s.keys[k].length).map((k) => property(s, k)) }));
  return { synthetic: note, taken_at: "2026-10-24T12:00:00.000Z", project, comp: { ...comp }, host: HOST, precomp_layers: specs.map((s, i) => ({ s, i })).filter(({ s }) => s.kind === "precomp").map(({ s, i }) => ({ index: i + 1, name: s.name })), layers, layer_info };
}

// ---- Parenting with no jump, by plain arithmetic (the child's raw values into the parent's space)

// The parent's static 2D transform: q = A + S⁻¹ · R⁻¹ · (p − P); scale ÷ parent scale; rotation − parent's.
function intoParentSpace(parentT) {
  const rad = (-parentT.rotation * Math.PI) / 180;
  const [sx, sy] = [parentT.scale[0] / 100, parentT.scale[1] / 100];
  const point = (p) => {
    const dx = p[0] - parentT.position[0];
    const dy = p[1] - parentT.position[1];
    const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
    return [r3(parentT.anchor[0] + rx / sx), r3(parentT.anchor[1] + ry / sy)];
  };
  return {
    point,
    scale: (s) => [r3((s[0] / (parentT.scale[0])) * 100), r3((s[1] / (parentT.scale[1])) * 100)],
    rotation: (r) => r3(r - parentT.rotation),
  };
}

// AE compensates with the parent as it is at the current time (`time`).
function parentTo(child, parentSpec, { jump = null, time = 0 } = {}) {
  const pt = transformAt(parentSpec, time);
  const m = intoParentSpace({ anchor: pt.anchor, position: pt.position, scale: pt.scale, rotation: pt.rotation });
  const c = clone(child);
  c.rendered = child.rendered;
  c.parent = parentSpec.name;
  if (c.keys.x || c.keys.y) {
    if (pt.rotation !== 0 || pt.scale[0] !== pt.scale[1]) throw new Error("separated Position under a rotated or uneven parent isn't built here");
    const [px, py] = m.point([0, 0]);
    const ox = px; // q = A + (p − P)/s, per axis
    const k = pt.scale[0] / 100;
    c.keys.x = (c.keys.x || []).map(([t, v]) => [t, r3(ox + v / k)]);
    c.keys.y = (c.keys.y || []).map(([t, v]) => [t, r3(py + v / k)]);
    c.position = [r3(ox + c.position[0] / k), r3(py + c.position[1] / k)];
  } else {
    c.position = m.point(c.position);
    if (c.keys.position) c.keys.position = c.keys.position.map(([t, v]) => [t, m.point(v)]);
  }
  c.scale = m.scale(c.scale);
  if (c.keys.scale) c.keys.scale = c.keys.scale.map(([t, v]) => [t, m.scale(v)]);
  c.rotation = m.rotation(c.rotation);
  if (c.keys.rotation) c.keys.rotation = c.keys.rotation.map(([t, v]) => [t, m.rotation(v)]);
  if (jump) jump(c);
  return c;
}

// ---- Mentor Practice 2 with its wave B layers (build-practice-comp-2b.jsx)

const COMP2 = { id: 300, name: "Mentor Practice 2", duration: 8, frame_rate: 30, time: 0, hide_shy: false, width: 1920, height: 1080 };

function waveB() {
  return [
    layer("Door", "solid", { size: [300, 500], position: [200, 300] }),
    layer("Needle", "solid", { size: [30, 400], position: [420, 250] }),
    layer("Gauge", "solid", { size: [40, 200], position: [500, 150], keys: { rotation: [[F(95), 0], [F(125), 90]] } }),
    layer("Lid", "shape", { size: [160, 60], position: [640, 450], anchor: [0, 150] }),
    layer("Wobble", "solid", { size: [80, 80], position: [800, 120], keys: { anchor: [[F(114), [40, 40]], [F(144), [60, 40]]] } }),
    layer("Tab", "solid", { size: [200, 50], position: [620, 480] }),
    layer("Peg", "solid", { size: [30, 30], position: [820, 480] }),
    layer("Banner", "shape", { size: [800, 60], position: [450, 640] }),
    layer("Sign", "text", { size: [130, 70], position: [200, 780] }),
    layer("Plaque", "solid", { size: [100, 60], position: [480, 790], scale: [200, 200] }),
    layer("Flip", "solid", { size: [100, 60], position: [720, 790], scale: [-100, 100] }),
    layer("Pop", "solid", { size: [120, 120], position: [120, 960], keys: { scale: [[F(99), [0, 0]], [F(129), [100, 100]]] } }),
    layer("Sled", "solid", { size: [100, 60], position: [320, 960], keys: { position: [[F(110), [320, 960]], [F(125), [420, 960]], [F(140), [420, 900]]] } }),
    layer("Hatch Rig", "null", { position: [640, 960] }),
    layer("Hatch", "solid", { size: [150, 80], position: [50, 50], parent: "Hatch Rig" }), // [640, 960] in comp space, under the rig at [640, 960] with anchor [50, 50]
    layer("Seal", "precomp", { size: [200, 200], position: [840, 960], scale: [30, 30] }),
    layer("Tile", "shape", { size: [200, 100], position: [1200, 150], keys: { position: [[F(125), [1200, 150]], [F(155), [1240, 150]]], scale: [[F(131), [100, 100]], [F(161), [110, 110]]] } }),
    layer("Caption", "text", { size: [130, 34], position: [1220, 215], keys: { opacity: [[F(129), 20], [F(159), 100]] } }),
    layer("Stamp", "solid", { size: [80, 80], position: [1290, 190], keys: { x: [[F(140), 1290], [F(170), 1310]], y: [[F(140), 190], [F(170), 200]] } }),
    layer("Row A", "solid", { size: [240, 60], position: [1740, 120], keys: { position: [[F(144), [1740, 120]], [F(174), [1760, 120]]] } }),
    layer("Row B", "solid", { size: [240, 60], position: [1740, 145] }),
    layer("Row C", "solid", { size: [240, 60], position: [1740, 170], keys: { position: [[F(155), [1740, 170]], [F(185), [1760, 170]]] } }),
    layer("Plate", "solid", { size: [200, 120], position: [1200, 560], keys: { position: [[F(159), [1200, 560]], [F(189), [1230, 560]]] } }),
    layer("Shadow", "solid", { size: [200, 120], position: [115, 75], parent: "Plate" }), // [1215, 575] in comp space
    layer("Reveal Matte", "solid", { size: [240, 140], position: [1740, 560], is_matte: true, enabled: false }),
    layer("Gradient", "solid", { size: [240, 140], position: [1740, 560], matte: "Reveal Matte", keys: { position: [[F(163), [1740, 560]], [F(193), [1760, 560]]] } }),
    layer("Background", "solid", { size: [1920, 1080], position: [960, 540] }),
  ];
}

function waveA() {
  return [
    layer("Blink", "shape", { size: [40, 120], keys: { opacity: [[1, 100], [1.4, 0], [1.8, 100], [2.2, 0]] } }),
    layer("Spinner", "shape", { size: [120, 20], keys: { rotation: [[0.25, 0], [4.25, 360]] }, type: "linear" }),
    layer("Cut", "shape", { size: [200, 200], keys: { opacity: [[3, 100], [3.1, 0]] } }),
    layer("Card", "shape", { size: [300, 180], position: [400, 700], keys: { position: [[1.2, [400, 700]], [2.4, [800, 700]]], scale: [[1.2, [80, 80]], [2.4, [100, 100]]] } }),
    layer("Dot 1", "shape", { size: [50, 50], position: [300, 300], keys: { position: [[0, [300, 300]], [0.5, [300, 400]], [1.5, [700, 400]]] } }),
    layer("Dot 2", "shape", { size: [50, 50], position: [300, 500], keys: { position: [[0.5, [300, 500]], [1.5, [700, 500]]] } }),
    layer("Dot 3", "shape", { size: [50, 50], position: [300, 600], keys: { x: [[0.5, 300], [1.5, 700]], y: [[0.5, 600], [1.25, 500]] } }),
    layer("Badge", "shape", { size: [100, 100], keys: { scale: [[3.5, [60, 60]], [4.5, [100, 100]]] } }),
    layer("Chip A", "shape", { size: [120, 40], position: [1200, 820], keys: { position: [[2, [1200, 820]], [3, [1400, 820]]] } }),
    layer("Chip B", "shape", { size: [120, 40], position: [1200, 760], keys: { position: [[2, [1200, 760]], [3, [1400, 760]]] } }),
    layer("Chip C", "shape", { size: [120, 40], position: [1200, 700], keys: { position: [[2, [1200, 700]], [3, [1400, 700]]] } }),
    layer("Flag", "shape", { size: [60, 100], position: [1500, 300], keys: { position: [[4, [1500, 300]], [4.5, [1500, 500]], [5.5, [1700, 500]]] } }),
    layer("Pause", "shape", { size: [80, 80], position: [200, 900], keys: { position: [[5, [200, 900]], [5.5, [500, 900]], [6, [500, 900]], [6.5, [800, 900]]] } }),
  ];
}

// The group's combined bounds at 0 s: Tile 1100..1300 × 100..200, Caption 1155..1285 × 187.8..221.8,
// Stamp 1250..1330 × 150..230, so 1100..1330 × 100..230; its middle is (1215, 165).
const CENTER = [1215, 165];
const TOP_LEFT = [1100, 100];
const nullAt = (name, position, o = {}) => layer(name, "null", { position, ...o });
const GROUP = ["Tile", "Caption", "Stamp"];
const ROWS = ["Row A", "Row B", "Row C"];
// The P2 times of the group, passed by null_parent_check (quickstart › 3's --times).
export const GROUP_TIMES = [0, 4.167, 4.367, 4.667, 5.167, 5.367, 5.667];

const withNull = (nul, specs, parented = [], { jumps = {}, time = 0 } = {}) =>
  [nul, ...specs.map((s) => (parented.includes(s.name) ? parentTo(s, nul, { jump: jumps[s.name], time }) : s))];

function writeTo(dir, name, snap) {
  fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
  fs.writeFileSync(path.join(ROOT, dir, name), JSON.stringify(snap, null, 2) + "\n");
}
const standIn = (name, specs, o = {}) => writeTo("stand-in", name, snapshot(specs, { comp: { ...COMP2, ...(o.comp || {}) }, callerTimes: o.times ?? GROUP_TIMES, note: `stand-in for mentor/test/fixtures/null-parenting/${name} (live capture, spec 012 quickstart › 3${o.why ? `; ${o.why}` : ""})` }));

export function buildStandIns() {
  const base = waveB();
  writeTo("stand-in", "practice2b.json", snapshot(base, { comp: COMP2, note: "stand-in for spec 004's mentor/test/fixtures/layer-info/practice2b.json (T135), Mentor Practice 2's wave B layers only, at 0 s" }));
  writeTo("stand-in", "practice2b-with-wave-a.json", snapshot([...waveA(), ...base], { comp: COMP2, note: "stand-in for practice2b.json with Mentor Practice 2's 13 wave A layers too, as the live comp has them (L-6)" }));

  const n1 = nullAt("Null 1", CENTER);
  standIn("null-center.json", withNull(n1, base), { why: "a null added at the group's middle, nothing parented; also renumbered-after.json (L-5)" });
  standIn("null-top-left.json", withNull(nullAt("Null 1", TOP_LEFT), base), { why: "the null at the group's top-left (US1 #3)" });
  writeTo("stand-in", "practice2b-parented.json", snapshot(withNull(n1, base, GROUP), { comp: COMP2, callerTimes: GROUP_TIMES, note: "stand-in for spec 004's practice2b-parented.json (T135 a): Tile, Caption and Stamp parented to Null 1 with no jump, raw values rewritten, footprints unchanged" }));
  standIn("jumped.json", withNull(n1, base, GROUP, { jumps: { Stamp: (c) => { c.keys.x = c.keys.x.map(([t, v]) => [t, v - 120]); c.position[0] -= 120; } } }), { why: "Stamp parented 120 px left of where it was (L-3)" });
  // A copy: the base specs are shared by every stand-in.
  const snapped = (c) => ({ ...clone(c), rendered: () => ({ position: CENTER }), expr: { position: true } });
  const pick = withNull(n1, base, ["Tile", "Stamp"]).map((s) => (s.name === "Caption" ? snapped(s) : s));
  standIn("pickwhip-position.json", pick, { why: "Caption linked by the pick whip dragged from Position: no parent, snapped to the null (L-3)" });
  const tile = base.find((s) => s.name === "Tile");
  standIn("visible-parent.json", withNull(n1, base, ["Tile", "Stamp"]).map((s) => (s.name === "Caption" ? parentTo(s, tile) : s)), { why: "Caption parented to Tile, a visible layer" });
  const keyed = (o) => withNull(nullAt("Null 1", CENTER, o), base, GROUP);
  standIn("null-keyed-early.json", keyed({ keys: { position: [[6, CENTER], [7, [CENTER[0], CENTER[1] + 200]]] } }), { why: "the null keyed before the parenting check (row 30)" });
  standIn("fade-null.json", keyed({ keys: { opacity: [[6, 100], [7, 0]] } }), { why: "the null faded instead of moved (P4)" });
  standIn("rotate-null.json", keyed({ keys: { rotation: [[6, 0], [7, 90]] } }), { why: "the null given two Rotation keys (P4 passes)" });
  standIn("slide-null.json", keyed({ keys: { position: [[6, CENTER], [7, [CENTER[0] + 300, CENTER[1]]]] }, type: "linear" }), { why: "the null slides, linear keys (P4, comments)" });
  standIn("anchor-only-null.json", keyed({ keys: { anchor: [[6, [50, 50]], [7, [150, 50]]] } }), { why: "the null keyed on Anchor Point only (row 26)" });
  standIn("one-key-null.json", keyed({ keys: { position: [[6, CENTER]] } }), { why: "one Position key on the null (P4)" });
  // Row 31: the null moved after a check, before parenting; then parented against the new spot.
  const moved = nullAt("Null 1", [1300, 300]);
  standIn("null-moved.json", withNull(moved, base), { why: "the null dragged to a new spot after the stage 3 check (row 31)" });
  standIn("null-moved-before-parenting.json", withNull(moved, base, GROUP), { why: "the group parented to the null at its new spot (row 31)" });
  // Row 40: an existing "Null 1" in the before read, then a second one, then the new one renamed.
  const spare = nullAt("Null 1", [1800, 1000]);
  writeTo("stand-in", "practice2b-null1.json", snapshot([spare, ...base], { comp: COMP2, note: "stand-in: practice2b.json with an existing, empty null called Null 1 (row 40's before read)" }));
  standIn("two-nulls-same-name.json", [nullAt("Null 1", CENTER), spare, ...base], { why: "a second layer called Null 1 added at the group's middle (row 40)" });
  standIn("two-nulls-renamed.json", [nullAt("Group Null", CENTER), spare, ...base], { why: "the new null renamed Group Null (row 40)" });
  // The null renamed after parenting (Edge Cases).
  const renamed = nullAt("Group Null", CENTER);
  standIn("null-renamed.json", withNull(renamed, base, GROUP), { why: "the lesson's null renamed after parenting" });
  // Row 38: a layer outside the focus parented to the null as well.
  standIn("plate-parented-too.json", withNull(n1, base, [...GROUP, "Plate"]), { why: "Plate parented to the null too (row 38)" });
  // S-2: the playhead moved since the before read.
  standIn("playhead-moved.json", withNull(n1, base, GROUP), { comp: { time: 2.5 }, why: "the playhead at 2.5 s (S-2)" });
  // US3: the review group.
  const rowA = base.find((s) => s.name === "Row A");
  standIn("review-rows-visible.json", base.map((s) => (s.name === "Row B" || s.name === "Row C" ? parentTo(s, rowA) : s)), { times: [0, 4.8, 5.167, 5.8, 6.167], why: "Row B and Row C parented to Row A (US3 #2)" });
  const rowNull = nullAt("Null 1", [1740, 145]);
  standIn("review-rows-null.json", withNull(rowNull, base), { times: [0, 4.8, 5.167, 5.8, 6.167], why: "a null added at the rows' middle, nothing parented (review)" });
  standIn("review-rows-pass.json", withNull(nullAt("Null 1", [1740, 145], { keys: { position: [[6.5, [1740, 145]], [7.5, [1740, 300]]] } }), base, ROWS), { times: [0, 4.8, 5.167, 5.8, 6.167], why: "Row A to C parented to a null that slides (review pass)" });
  standIn("review-rows-parented-in-one-go.json", withNull(nullAt("Null 1", [1740, 145]), base, ROWS), { times: [0, 4.8, 5.167, 5.8, 6.167], why: "the null added and the rows parented before any check (review, TD § 11)" });
}

// ---- Permanent synthetics (spec 012 FR-026: only rows the spec allows)

const COMPS = { id: 600, name: "Synthetic Group", duration: 8, frame_rate: 30, time: 1, hide_shy: false, width: 1920, height: 1080 };
const syn = (name, specs, note, o = {}) => writeTo("synthetic", name, snapshot(specs, { comp: { ...COMPS, ...(o.comp || {}) }, callerTimes: o.times ?? [1, 2, 3], project: "Synthetic.aep", note: `SYNTHETIC (spec 012 ${note}). Never from AE.` }));

function small() {
  return [
    layer("Card", "solid", { size: [100, 100], position: [500, 500], keys: { position: [[2, [500, 500]], [3, [520, 500]]] } }),
    layer("Label", "solid", { size: [100, 40], position: [500, 570] }),
  ];
}

export function buildSynthetics() {
  const base = small();
  syn("before.json", base, "the before read for the synthetic rows: Card (Position keys at 2 and 3 s) and Label (static), touching");
  const at = [500, 520];
  // Row 4: an expression drives the null's Position, no keys.
  syn("row4-null-expression.json", withNull(nullAt("Null 1", at, { rendered: (t) => ({ position: [at[0] + 50 * t, at[1]] }) }), base, ["Card", "Label"], { time: 1 }), "row 4: an expression with no keys moves the null; P4 counts keys only");
  // Row 10: the null keyed on X Position only.
  syn("row10-null-separated.json", withNull(nullAt("Null 1", at, { keys: { x: [[4, at[0]], [5, at[0] + 200]] } }), base, ["Card", "Label"]), "row 10: separated Position on the null, X keyed");
  // Row 21: uneven null scale, parented with no jump.
  syn("row21-nonuniform.json", withNull(nullAt("Null 1", at, { scale: [150, 100], keys: { position: [[4, at], [5, [at[0] + 200, at[1]]]] } }), base, ["Card", "Label"]), "row 21: null Scale 150 × 100, parented with no jump");
  // Row 23: the null has a parent, still or moving.
  const holder = layer("Holder", "solid", { size: [50, 50], position: [300, 300] });
  const nulUnder = nullAt("Null 1", [at[0] - 300 + 25, at[1] - 300 + 25], { parent: "Holder" }); // at in comp space
  const still = [holder, ...withNull(nulUnder, base)];
  syn("row23-still-parent-placed.json", still, "row 23: the lesson's null under Holder, which doesn't move; nothing parented yet");
  const nulComp = nullAt("Null 1", at);
  syn("row23-still-parent.json", [holder, nulUnder, ...base.map((s) => parentTo(s, nulComp))], "row 23: the group parented to the null under a still Holder, no jump");
  const mover = layer("Holder", "solid", { size: [50, 50], position: [300, 300], keys: { position: [[4, [300, 300]], [5, [400, 300]]] } });
  syn("row23-moving-parent.json", [mover, ...withNull(nulUnder, base)], "row 23: the lesson's null under Holder, which moves");
  // Row 26: Anchor Point keys only on the null.
  syn("row26-anchor-only.json", withNull(nullAt("Null 1", at, { keys: { anchor: [[4, [50, 50]], [5, [150, 50]]] } }), base, ["Card", "Label"]), "row 26: the null keyed on Anchor Point only");
  // Row 31: placed, moved with or without a check in between, parented against the new spot.
  syn("row31-placed.json", withNull(nullAt("Null 1", at), base), "row 31: the null placed, nothing parented");
  const moved = nullAt("Null 1", [at[0] + 100, at[1] + 60]);
  syn("row31-moved.json", withNull(moved, base), "row 31: the null dragged to a new spot, nothing parented");
  syn("row31-parented.json", withNull(moved, base, ["Card", "Label"]), "row 31: parented against the null's new spot");
  // Row 35: Label's in point after a sampled time; still sampled.
  syn("row35-out-of-range.json", base.map((s) => (s.name === "Label" ? { ...s, in_point: 4 } : s)), "row 35: Label starts at 4 s, sampled at 1, 2 and 3 s anyway");
  // Row 36: a layer past the 64-sample cap.
  const many = layer("Ticker", "solid", { size: [60, 60], position: [560, 500], keys: { position: Array.from({ length: 70 }, (_, i) => [r3(i * 0.1), [560 + i, 500]]) } });
  syn("row36-truncated.json", [...base, many], "row 36: Ticker with 70 key times, past the snapshot's 64-sample cap");
  // Row 40: two layers called Null 1 (the new one and Label renamed to it is the same case).
  syn("row40-two-nulls.json", [nullAt("Null 1", at), nullAt("Null 1", [900, 900]), ...base], "row 40: two layers called Null 1, both new");
  // The cap: three children with 23 key times each (69 times) under one null. Card and Label are
  // the focus (46 P2 times passed); Extra isn't.
  const t23 = (off) => Array.from({ length: 23 }, (_, i) => r3(off + i * 0.1));
  const cards = [
    layer("Card", "solid", { size: [100, 100], position: [500, 500], keys: { position: t23(0.2).map((t, i) => [t, [500 + i, 500]]) } }),
    layer("Label", "solid", { size: [100, 40], position: [500, 570], keys: { position: t23(2.55).map((t, i) => [t, [500 + i, 570]]) } }),
    layer("Extra", "solid", { size: [40, 40], position: [700, 700], keys: { position: t23(5.05).map((t, i) => [t, [700 + i, 700]]) } }),
  ];
  const capNull = nullAt("Null 1", at);
  const focusTimes = [1, ...t23(0.2), ...t23(2.55)];
  syn("cap70-before.json", cards, "the 70-time cap: Card and Label with 23 Position keys each, Extra with 23 more", { times: [] });
  syn("cap70-parented.json", [capNull, ...cards.map((s) => parentTo(s, capNull))], "the 70-time cap: all three parented to Null 1 (69 child key times plus comp.time), read with the focus's 47 P2 times passed", { times: focusTimes });
  syn("cap70-parented-no-times.json", [capNull, ...cards.map((s) => parentTo(s, capNull))], "the 70-time cap: as cap70-parented.json, read without the P2 times passed", { times: [] });
  // S-1: a null at Scale 150 and Rotation 30. Parented with no jump; and with Rotation not
  // rewritten, so the corners swing while the anchor stays put.
  const rot = nullAt("Null 1", at, { scale: [150, 150], rotation: 30 });
  const centred = [layer("Card", "solid", { size: [100, 100], position: [500, 500], keys: { position: [[2, [500, 500]], [3, [520, 500]]], scale: [[2, [100, 100]], [3, [110, 110]]] } }), base[1]];
  syn("s1-before.json", centred, "S-1's before read: Card with Position and Scale keys, Label static");
  syn("s1-placed.json", withNull(rot, centred), "S-1: a null at Scale 150, Rotation 30 placed, nothing parented");
  syn("s1-parented.json", withNull(rot, centred, ["Card", "Label"]), "S-1: parented with no jump (raw Position, Scale and Rotation rewritten)");
  syn("s1-jumped.json", withNull(rot, centred, ["Card", "Label"], { jumps: { Card: (c) => { c.rotation += 30; } } }), "S-1: Card's Rotation not rewritten, so its corners turn 30° about its anchor");
  syn("zero-scale-null.json", withNull(nullAt("Null 1", at, { scale: [0, 100] }), base), "the null at Scale 0 × 100 (the demo's null_scale_zero)");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildStandIns();
  buildSynthetics();
  console.log("Wrote stand-in/ and synthetic/ under", path.relative(process.cwd(), ROOT));
}
