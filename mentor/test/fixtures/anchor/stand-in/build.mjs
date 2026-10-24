// Writes the cloud stand-ins for spec 011's live captures (quickstart › 3, and spec 004's
// practice2b.json and overlaps.json until T133 and T135 take them) and the permanent synthetics
// (research R9). Run from the repo root:
//   node mentor/test/fixtures/anchor/stand-in/build.mjs
// Deleted with the rest of stand-in/ once the live captures replace them (tasks T234). The
// synthetics it writes to ../synthetic/ stay.
//
// Sources: Mentor Practice 2's wave B layers from mentor/dev/build-practice-comp-2b.jsx's declared
// values (sizes, positions, scales, keys at 30 fps), and Mentor Overlaps' from build-overlaps-b.jsx.
// Mentor Practice 2's older layers (Blink to Pause, all shapes) and skill 6's other layers are left
// out: none is a default candidate while shapes wait for L-1, and the tests read by name.
// Geometry is AE's own model, computed here independently of mentor/lib/anchor.mjs: a solid's
// rectangle is [0, 0, w, h] with its anchor at the centre; a shape's (one rectangle at the group's
// origin) is centred on [0, 0] with the anchor at [0, 0]; text's anchor is on the baseline.
// Values between keys are linear here (the real keys are bezier 15/80); every sample this writes
// is at a key time or before the first key, except other layers' key times on a layer, which only
// item 5 compares, between two reads built the same way.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const HOST = { ae_version: "26.5x89", os: "Macintosh OS 27.0.1/64" };
const r3 = (v) => Math.round(v * 1000) / 1000 + 0;
const F = (frame) => r3(frame / 30);
const clone = (x) => JSON.parse(JSON.stringify(x));

// ---- Layer specs

const TF = "ADBE Transform Group";
const PROPS = {
  anchor: { path: `${TF}/ADBE Anchor Point`, display_path: "Transform › Anchor Point", display_name: "Anchor Point", match_name: "ADBE Anchor Point", dims: 1 },
  position: { path: `${TF}/ADBE Position`, display_path: "Transform › Position", display_name: "Position", match_name: "ADBE Position", dims: 1 },
  x: { path: `${TF}/ADBE Position_0`, display_path: "Transform › X Position", display_name: "X Position", match_name: "ADBE Position_0", dims: 1 },
  y: { path: `${TF}/ADBE Position_1`, display_path: "Transform › Y Position", display_name: "Y Position", match_name: "ADBE Position_1", dims: 1 },
  scale: { path: `${TF}/ADBE Scale`, display_path: "Transform › Scale", display_name: "Scale", match_name: "ADBE Scale", dims: 3 },
  rotation: { path: `${TF}/ADBE Rotate Z`, display_path: "Transform › Rotation", display_name: "Rotation", match_name: "ADBE Rotate Z", dims: 1 },
  opacity: { path: `${TF}/ADBE Opacity`, display_path: "Transform › Opacity", display_name: "Opacity", match_name: "ADBE Opacity", dims: 1 },
  blur: { path: "ADBE Effect Parade/ADBE Gaussian Blur 2#1/ADBE Gaussian Blur 2-0001", display_path: "Effects › Gaussian Blur › Blurriness", display_name: "Blurriness", match_name: "ADBE Gaussian Blur 2-0001", dims: 1 },
};

const solid = (name, w, h, position, extra = {}) => ({ name, kind: "solid", rect: { left: 0, top: 0, width: w, height: h }, anchor: [w / 2, h / 2, 0], position: [...position, 0], ...extra });
const shape = (name, w, h, position, extra = {}) => ({ name, kind: "shape", rect: { left: -w / 2, top: -h / 2, width: w, height: h }, anchor: [0, 0, 0], position: [...position, 0], extents: true, ...extra });
const text = (name, rect, position, extra = {}) => ({ name, kind: "text", rect, anchor: [0, 0, 0], position: [...position, 0], extents: true, ...extra });
const nul = (name, position, extra = {}) => ({ name, kind: "null", is_null: true, rect: { left: 0, top: 0, width: 100, height: 100 }, anchor: [50, 50, 0], position: [...position, 0], ...extra });
const precomp = (name, w, h, position, extra = {}) => ({ name, kind: "precomp", rect: { left: 0, top: 0, width: w, height: h }, anchor: [w / 2, h / 2, 0], position: [...position, 0], ...extra });

// keys: { prop: [[time, value], ...] }, type per prop in `types` (default bezier 15/80).
function valueOf(spec, prop, t) {
  const ks = spec.keys && spec.keys[prop];
  const base = prop === "x" ? spec.position[0] : prop === "y" ? spec.position[1] : spec[prop] ?? (prop === "scale" ? [100, 100, 100] : prop === "rotation" ? 0 : prop === "opacity" ? 100 : null);
  if (!ks || !ks.length) return base;
  const hold = spec.types && spec.types[prop] === "hold";
  if (t <= ks[0][0]) return ks[0][1];
  if (t >= ks[ks.length - 1][0]) return ks[ks.length - 1][1];
  for (let i = 1; i < ks.length; i++) {
    const [t0, v0] = ks[i - 1];
    const [t1, v1] = ks[i];
    if (t <= t1) {
      if (Math.abs(t - t1) < 1e-9) return v1;
      if (hold) return v0;
      const f = (t - t0) / (t1 - t0);
      return Array.isArray(v0) ? v0.map((v, j) => v + (v1[j] - v) * f) : v0 + (v1 - v0) * f;
    }
  }
  return ks[ks.length - 1][1];
}

const round = (v) => (Array.isArray(v) ? v.map(r3) : typeof v === "number" ? r3(v) : v);

function sampleOf(spec, t) {
  const sep = spec.keys && (spec.keys.x || spec.keys.y);
  const position = sep ? [valueOf(spec, "x", t), valueOf(spec, "y", t), spec.position[2] ?? 0] : valueOf(spec, "position", t);
  const rect = spec.no_rect ? null : spec.rectAt ? spec.rectAt(t) : spec.rect;
  return {
    time: r3(t),
    anchor: round(valueOf(spec, "anchor", t)),
    position: round(position),
    scale: round(valueOf(spec, "scale", t)),
    rotation: round(valueOf(spec, "rotation", t)),
    rect: rect ? { ...rect } : null,
    rect_extents: spec.extents && rect ? { ...rect } : null,
  };
}

const ease = (dims, influence) => Array.from({ length: dims }, () => ({ speed: 0, influence }));
function keyedEntry(spec, index) {
  const props = Object.entries(spec.keys || {}).filter(([, ks]) => ks.length).map(([name, ks]) => {
    const p = PROPS[name];
    const type = (spec.types && spec.types[name]) || "bezier";
    return {
      path: p.path, display_path: p.display_path, match_name: p.match_name, display_name: p.display_name, dimensions: p.dims,
      expression_enabled: !!(spec.expressions && spec.expressions[name]),
      keys: ks.map(([time, value], i) => ({ index: i + 1, time: r3(time), in_type: type, out_type: type, value: round(value), in_ease: ease(p.dims, 80), out_ease: ease(p.dims, 15) })),
    };
  });
  return props.length ? { index, name: spec.name, kind: spec.kind, enabled: spec.enabled !== false, is_null: !!spec.is_null, properties: props } : null;
}

// AE's sample times (snapshot.jsx): comp.time and the caller's times first, then the layer's own
// and its descendants' key times, earliest first; at most 64.
function sampleTimes(specs, i, compTime, callerTimes) {
  const ownTimes = (s) => Object.values(s.keys || {}).flatMap((ks) => ks.map((k) => k[0]));
  const chain = [...ownTimes(specs[i])];
  specs.forEach((s, j) => {
    let up = s.parent;
    let guard = 0;
    while (up && guard++ < specs.length) {
      if (up === specs[i].name && j !== i) chain.push(...ownTimes(s));
      up = (specs.find((x) => x.name === up) || {}).parent;
    }
  });
  const seen = new Set();
  const first = [];
  const rest = [];
  const add = (list, t) => { const k = String(r3(t)); if (!seen.has(k)) { seen.add(k); list.push(t); } };
  add(first, compTime);
  for (const t of callerTimes) add(first, t);
  for (const t of chain.sort((a, b) => a - b)) add(rest, t);
  let all = [...first, ...rest];
  const truncated = all.length > 64;
  if (truncated) all = all.slice(0, 64);
  return { times: all.sort((a, b) => a - b), truncated };
}

function build({ id, name, width = 1920, height = 1080, duration = 8, time = 0, hide_shy = false, project = "Claude AE Tutor Test.aep" }, specs, callerTimes = []) {
  const layers = [];
  const info = specs.map((s, i) => {
    const index = i + 1;
    const k = keyedEntry(s, index);
    if (k) layers.push(k);
    const st = sampleTimes(specs, i, time, callerTimes);
    const samples = (s.drop_times ? st.times.filter((t) => !s.drop_times.some((d) => Math.abs(d - t) < 1e-6)) : st.times).map((t) => sampleOf(s, t));
    const now = sampleOf(s, time);
    const parentIdx = s.parent ? specs.findIndex((x) => x.name === s.parent) + 1 : null;
    const matteIdx = s.matte ? specs.findIndex((x) => x.name === s.matte) + 1 : null;
    return {
      index, name: s.name, kind: s.kind,
      enabled: s.enabled !== false, is_null: !!s.is_null, adjustment: s.kind === "adjustment", has_video: true,
      three_d: !!s.three_d, collapse: !!s.collapse, auto_orient: !!s.auto_orient,
      parent: parentIdx, shy: !!s.shy, solo: false, guide: !!s.guide, locked: !!s.locked,
      in_point: 0, out_point: duration, start_time: 0, stretch: 100, time_remap: false,
      matte: matteIdx ? { layer: matteIdx, type: "alpha" } : null, is_matte: specs.some((x) => x.matte === s.name),
      motion_blur: false, effect_count: s.effect_count || 0,
      transform: { anchor: now.anchor, position: now.position, scale: now.scale, rotation: now.rotation, opacity: round(valueOf(s, "opacity", time)) },
      samples, samples_truncated: st.truncated,
    };
  });
  return {
    taken_at: "2026-10-24T12:00:00.000Z", project,
    comp: { id, name, duration, frame_rate: 30, time, hide_shy, width, height },
    precomp_layers: info.filter((l) => l.kind === "precomp").map((l) => ({ index: l.index, name: l.name })),
    layers, layer_info: info, host: HOST,
  };
}

function write(dir, file, snap, note) {
  fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
  fs.writeFileSync(path.join(ROOT, dir, file), JSON.stringify({ synthetic: note, ...snap }) + "\n");
}

// Pan Behind as After Effects does it, by its own model: the anchor moves to `to`, and Position by
// the anchor's change through the layer's own scale and rotation at time t, so nothing moves at t.
// `positionKey`: with Position keyed, the key whose value AE rewrites (spec 011 L-2 decides which).
function panBehind(spec, to, t, { positionKey = null } = {}) {
  const A = valueOf(spec, "anchor", t);
  const s = valueOf(spec, "scale", t);
  const rot = (valueOf(spec, "rotation", t) * Math.PI) / 180;
  const dx = to[0] - A[0];
  const dy = to[1] - A[1];
  const sx = (s[0] / 100) * dx;
  const sy = (s[1] / 100) * dy;
  const mx = Math.cos(rot) * sx - Math.sin(rot) * sy;
  const my = Math.sin(rot) * sx + Math.cos(rot) * sy;
  spec.anchor = [to[0], to[1], A[2] ?? 0];
  if (spec.keys && spec.keys.position && spec.keys.position.length) {
    const ks = spec.keys.position;
    const i = positionKey ?? 0;
    ks[i] = [ks[i][0], [ks[i][1][0] + mx, ks[i][1][1] + my, ks[i][1][2] ?? 0]];
  } else {
    spec.position = [spec.position[0] + mx, spec.position[1] + my, spec.position[2] ?? 0];
  }
  return spec;
}

const byName = (specs, name) => specs.find((s) => s.name === name);
const variant = (specs, change) => { const c = clone(specs); change(c); return c; };

// ---- Mentor Practice 2 with the 2b layers (build-practice-comp-2b.jsx), in the order the script
// leaves them (each new layer goes just above Background, so the first built is highest).

const SIGN_RECT = { left: -64, top: -53, width: 128, height: 68 };
function practice2b() {
  return [
    solid("Door", 300, 500, [200, 300]),
    solid("Needle", 30, 400, [420, 250]),
    solid("Gauge", 40, 200, [500, 150], { keys: { rotation: [[F(95), 0], [F(125), 90]] } }),
    shape("Lid", 160, 60, [640, 450], { anchor: [0, 150, 0] }),
    solid("Wobble", 80, 80, [800, 120], { keys: { anchor: [[F(114), [40, 40, 0]], [F(144), [60, 40, 0]]] } }),
    solid("Tab", 200, 50, [620, 480]),
    solid("Peg", 30, 30, [820, 480]),
    shape("Banner", 800, 60, [450, 640]),
    text("Sign", SIGN_RECT, [200, 780]),
    solid("Plaque", 100, 60, [480, 790], { scale: [200, 200, 100] }),
    solid("Flip", 100, 60, [720, 790], { scale: [-100, 100, 100] }),
    solid("Pop", 120, 120, [120, 960], { keys: { scale: [[F(99), [0, 0, 100]], [F(129), [100, 100, 100]]] } }),
    solid("Sled", 100, 60, [320, 960], { keys: { position: [[F(110), [320, 960, 0]], [F(125), [420, 960, 0]], [F(140), [420, 900, 0]]] } }),
    nul("Hatch Rig", [640, 960]),
    solid("Hatch", 150, 80, [50, 50], { parent: "Hatch Rig" }),
    precomp("Seal", 400, 400, [840, 960], { scale: [30, 30, 100], collapse: true }),
    solid("Reveal Matte", 240, 140, [1740, 560], { enabled: false }),
    solid("Gradient", 240, 140, [1740, 560], { matte: "Reveal Matte", keys: { position: [[F(163), [1740, 560, 0]], [F(193), [1760, 560, 0]]] } }),
    solid("Background", 1920, 1080, [960, 540]),
  ];
}
// The --times list for every Mentor Practice 2 capture (answer-key.json › times): every candidate's
// rest key and Position key times, as neededTimes() asks for.
const P2_TIMES = [F(95), F(110), F(125), F(129), F(140), F(163), F(193)];
const P2 = { id: 300, name: "Mentor Practice 2" };
const p2 = (specs, extra = {}) => build({ ...P2, ...extra }, specs, P2_TIMES);
const standIn = (file, snap, live) => write("stand-in", file, snap, `stand-in for ${live || `mentor/test/fixtures/anchor/${file}`} (live capture, spec 011 quickstart › 3)`);

const base = practice2b();
standIn("practice2b.json", p2(base), "mentor/test/fixtures/layer-info/practice2b.json (spec 004 T135) captured with --times");
standIn("practice2b-no-size.json", (() => { const s = p2(base); delete s.comp.width; delete s.comp.height; return s; })(),
  "a capture from before spec 004 T165 (no comp width or height)");

// L-4's four mistakes.
standIn("door-typed.json", p2(variant(base, (s) => { byName(s, "Door").anchor = [0, 250, 0]; })));
standIn("door-dragged.json", p2(variant(base, (s) => { byName(s, "Door").position = [260, 340, 0]; })));
standIn("wrong-layer.json", p2(variant(base, (s) => { panBehind(byName(s, "Background"), [400, 300], 0); })));
standIn("pop-shrunk.json", p2(variant(base, (s) => { panBehind(byName(s, "Pop"), [60, 120], F(99)); }), { time: F(99) }));
// Correct Pan Behind on Door, Plaque; Banner a place off.
standIn("door-pass.json", p2(variant(base, (s) => { panBehind(byName(s, "Door"), [0, 250], 0); })));
standIn("plaque-pass.json", p2(variant(base, (s) => { panBehind(byName(s, "Plaque"), [0, 30], 0); })));
standIn("banner-neighbour.json", p2(variant(base, (s) => { panBehind(byName(s, "Banner"), [-400, 30], 0); })));
// L-2: Pan Behind on Sled with the playhead before its keys: AE rewrote only the first key (a guess
// L-2 replaces), so Sled holds still at 0 s and at its first key, and slides at the other two.
standIn("sled-slid.json", p2(variant(base, (s) => { panBehind(byName(s, "Sled"), [0, 30], 0, { positionKey: 0 }); })));
// L-2 with one key: Sled with a single Position key, and a second key added by the change.
const oneKey = variant(base, (s) => { byName(s, "Sled").keys.position = [[F(110), [320, 960, 0]]]; });
standIn("sled-one-key-before.json", p2(oneKey));
standIn("sled-one-key.json", p2(variant(oneKey, (s) => {
  const sled = byName(s, "Sled");
  sled.anchor = [0, 30, 0];
  sled.keys.position = [[0, [270, 960, 0]], [F(110), [320, 960, 0]]];
})));
// L-1: Pan Behind on Lid's own anchor; a group's anchor moved instead (its rectangle shifts in the
// layer's own space, the layer's anchor doesn't change).
standIn("lid-pan.json", p2(variant(base, (s) => { panBehind(byName(s, "Lid"), [-80, 0], 0); })));
standIn("lid-group.json", p2(variant(base, (s) => { const lid = byName(s, "Lid"); lid.rect = { ...lid.rect, left: lid.rect.left + 40, top: lid.rect.top + 20 }; })));
standIn("hatch-rig-focus.json", p2(variant(base, (s) => { panBehind(byName(s, "Hatch Rig"), [0, 0], 0); })));
standIn("sign-centred.json", p2(base));
standIn("sign-left.json", p2(variant(base, (s) => { byName(s, "Sign").rect = { ...SIGN_RECT, left: 0 }; })));
// L-4's demo runs (the snippet's write, by Pan Behind's model): Tab, Peg turned 30° (rotated) and
// Hatch (parented); then the demo undone.
standIn("demo-separated.json", p2(variant(base, (s) => { panBehind(byName(s, "Tab"), [0, 25], 0); })));
const turned = variant(base, (s) => { byName(s, "Peg").rotation = 30; });
standIn("demo-rotated-before.json", p2(turned));
standIn("demo-rotated.json", p2(variant(turned, (s) => { panBehind(byName(s, "Peg"), [0, 0], 0); })));
standIn("demo-parented.json", p2(variant(base, (s) => { panBehind(byName(s, "Hatch"), [0, 40], 0); })));
standIn("demo-undone.json", p2(base));
standIn("matte-eye-on.json", p2(variant(base, (s) => { byName(s, "Reveal Matte").enabled = true; })));
// Gauge and Pop, keyed (T220).
standIn("gauge-at-rest.json", p2(variant(base, (s) => { panBehind(byName(s, "Gauge"), [20, 200], F(95)); }), { time: F(95) }));
standIn("gauge-away.json", p2(variant(base, (s) => { panBehind(byName(s, "Gauge"), [20, 200], F(125)); }), { time: F(125) }));
standIn("pop-pass.json", p2(variant(base, (s) => { panBehind(byName(s, "Pop"), [60, 120], F(129)); }), { time: F(129) }));
standIn("gauge-before-at-rest.json", p2(base, { time: F(95) }));
standIn("stopwatch.json", p2(variant(base, (s) => {
  const door = byName(s, "Door");
  panBehind(door, [0, 250], 0);
  door.keys = { anchor: [[0, [0, 250, 0]]] };
})));
standIn("door-locked.json", p2(variant(base, (s) => { byName(s, "Door").locked = true; })));
standIn("door-outside.json", p2(variant(base, (s) => { panBehind(byName(s, "Door"), [-200, 250], 0); })));
standIn("needle-near-middle.json", p2(variant(base, (s) => { panBehind(byName(s, "Needle"), [15, 260], 0); })));
standIn("door-renamed.json", p2(variant(base, (s) => { byName(s, "Tab").name = "Tab 2"; })));
standIn("door-layer-added.json", p2([...variant(base, () => {}), solid("New Solid", 100, 100, [960, 540])]));

// ---- Mentor Overlaps (build-overlaps-b.jsx), the rows this skill reads; CTI 1 s.
function overlaps() {
  return [
    solid("Orbit", 120, 40, [300, 900], { auto_orient: true, types: { position: "linear" }, keys: { position: [[0, [300, 900, 0]], [1, [600, 700, 0]], [2, [900, 900, 0]]] } }),
    solid("Depth", 100, 100, [1700, 900], { three_d: true }),
    solid("Locked Bar", 300, 30, [1300, 1000], { locked: true, keys: { position: [[3, [1300, 1000, 0]], [4, [1600, 1000, 0]]] } }),
    solid("Still", 100, 100, [100, 100]),
    solid("Gauge Dial", 20, 160, [1100, 300], { types: { rotation: "linear" }, keys: { rotation: [[1, 0], [2, 90]] }, expressions: { rotation: true } }),
    // Drift: an expression on unkeyed Position, so its rendered Position moves and nothing is keyed.
    solid("Drift", 60, 60, [960, 300]),
    solid("Guide Grid", 1920, 1080, [960, 540], { guide: true }),
    nul("Rig", [1400, 500], { enabled: false, types: { position: "linear" }, keys: { position: [[1, [1400, 500, 0]], [2, [1600, 500, 0]]] } }),
    solid("Leaf 2", 80, 80, [150, 150], { parent: "Rig", types: { x: "linear", y: "linear" }, keys: { x: [[0, 150], [1, 250]], y: [[0, 150], [1, 200]] } }),
    solid("Wipe", 800, 450, [80, 300], { enabled: false, types: { position: "linear" }, keys: { position: [[0.6, [80, 300, 0]], [1.6, [880, 300, 0]]], opacity: [[3, 100], [3.5, 0], [4, 100]] } }),
    solid("Photo", 800, 450, [480, 300], { matte: "Wipe" }),
  ];
}
// Drift's Position under its expression: [960 + time × 50, 300] at every sample.
function withDrift(snap) {
  const d = snap.layer_info.find((l) => l.name === "Drift");
  for (const s of d.samples) s.position = [r3(960 + s.time * 50), 300, 0];
  d.transform.position = [r3(960 + snap.comp.time * 50), 300, 0];
  return snap;
}
const OV = { id: 310, name: "Mentor Overlaps", duration: 6, time: 1, hide_shy: true };
standIn("overlaps.json", withDrift(build(OV, overlaps())), "mentor/test/fixtures/layer-info/overlaps.json (spec 004 T133)");
standIn("overlaps-still-pass.json", withDrift(build(OV, variant(overlaps(), (s) => { panBehind(byName(s, "Still"), [0, 0], 1); }))), "a live capture of Mentor Overlaps with Still's pivot moved (spec 011 sitting)");
standIn("leaf2-pass.json", withDrift(build(OV, variant(overlaps(), (s) => {
  // Separated Position keys, every X key rewritten by the same amount (L-2 decides what AE does).
  const leaf = byName(s, "Leaf 2");
  leaf.anchor = [0, 40, 0];
  leaf.keys.x = leaf.keys.x.map(([t, v]) => [t, v - 40]);
}))), "a live capture of Mentor Overlaps with Leaf 2's pivot moved (spec 011 sitting)");

// ---- Synthetics (rows the spec allows, research R9): they stay after merge.

const SYN = (id, name, extra = {}) => ({ id, name, duration: 6, project: "Synthetic.aep", ...extra });
const syn = (file, note, snap) => write("synthetic", file, snap, `SYNTHETIC: ${note}`);

// FR-028's measure edges.
const measures = [
  solid("Bar", 800, 60, [960, 200]),
  solid("Needle", 30, 400, [200, 600]),
  solid("Line", 10, 2, [500, 600]),
  solid("Big", 100, 60, [800, 600], { scale: [200, 200, 100] }),
  solid("Mirror", 100, 60, [1100, 600], { scale: [-100, 100, 100] }),
];
syn("measures.json", "FR-028's edges: an 800 × 60 bar, a 30 × 400 needle, a 10 × 2 line, Scale 200%, Scale [-100, 100]", build(SYN(330, "Synthetic Measures"), measures));
syn("measures-moved.json", "measures.json with Big and Mirror's pivots moved by Pan Behind to their top-left corners",
  build(SYN(330, "Synthetic Measures"), variant(measures, (s) => { panBehind(byName(s, "Big"), [0, 0], 0); panBehind(byName(s, "Mirror"), [0, 0], 0); })));

// Item 2's 0.9 and 1.1 px edges: Door moved by those amounts.
const plain = [solid("Door", 300, 500, [200, 300]), solid("Other", 100, 100, [900, 300])];
syn("edge-before.json", "two solids, for item 2's and item 5's 1 px edges", build(SYN(331, "Synthetic Edges"), plain));
for (const [file, dx] of [["edge-0.9.json", 0.9], ["edge-1.1.json", 1.1]]) {
  syn(file, `Door's pivot moved to its left edge, and Door ${dx} px right of where it was`,
    build(SYN(331, "Synthetic Edges"), variant(plain, (s) => { panBehind(byName(s, "Door"), [0, 250], 0); byName(s, "Door").position[0] += dx; })));
}
syn("edge-other-moved.json", "Door passed, Other moved 2 px (item 5)",
  build(SYN(331, "Synthetic Edges"), variant(plain, (s) => { panBehind(byName(s, "Door"), [0, 250], 0); byName(s, "Other").position[0] += 2; })));
// Two layers with one name (matching by index).
const twins = [solid("Card", 200, 100, [300, 300]), solid("Card", 200, 100, [700, 300])];
syn("dup-before.json", "two layers named Card", build(SYN(332, "Synthetic Duplicates"), twins));
syn("dup-second-pass.json", "the second Card's pivot moved to its left edge",
  build(SYN(332, "Synthetic Duplicates"), variant(twins, (s) => { panBehind(s[1], [0, 50], 0); })));

// Row 1: expressions on keyed Position and on keyed Rotation; row 8: an effect key.
syn("row1-expressions.json", "row 1: Slide's keyed Position has an expression on; Spin's keyed Rotation has one (row 3); Glowy has a keyed effect (row 8)",
  build(SYN(333, "Synthetic Expressions"), [
    solid("Slide", 100, 100, [300, 300], { keys: { position: [[1, [300, 300, 0]], [2, [500, 300, 0]]] }, expressions: { position: true } }),
    solid("Spin", 100, 100, [700, 300], { keys: { rotation: [[1, 0], [2, 90]] }, expressions: { rotation: true } }),
    solid("Glowy", 100, 100, [1100, 300], { effect_count: 1, keys: { blur: [[1, 10], [2, 0]] } }),
  ]));
// Row 6: hold keys on Position.
const hold = [solid("Hopper", 100, 60, [300, 600], { types: { position: "hold" }, keys: { position: [[1, [300, 600, 0]], [2, [500, 600, 0]], [3, [700, 600, 0]]] } })];
syn("row6-hold-before.json", "row 6: Hopper's Position has three hold keys", build(SYN(334, "Synthetic Hold"), hold, [1, 2, 3]));
syn("row6-hold-slid.json", "row 6: Hopper's pivot moved with only its first hold key rewritten, so it sits elsewhere at 2 s and 3 s",
  build(SYN(334, "Synthetic Hold"), variant(hold, (s) => { panBehind(byName(s, "Hopper"), [0, 30], 0, { positionKey: 0 }); }), [1, 2, 3]));
syn("row6-hold-pass.json", "row 6: Hopper's pivot moved with every hold key rewritten the same",
  build(SYN(334, "Synthetic Hold"), variant(hold, (s) => {
    const h = byName(s, "Hopper");
    h.anchor = [0, 30, 0];
    h.keys.position = h.keys.position.map(([t, v]) => [t, [v[0] - 50, v[1], 0]]);
  }), [1, 2, 3]));
// Rows 13 and 16: a shy candidate; a parent with Rotation keys and a child.
const fam = [
  solid("Arm", 200, 40, [600, 500], { keys: { rotation: [[1, 0], [2, 90]] } }),
  solid("Hand", 40, 40, [180, 20], { parent: "Arm" }),
  solid("Quiet", 100, 100, [1200, 500], { shy: true }),
  solid("Loud", 100, 100, [1500, 500]),
];
syn("row16-before.json", "row 16: Arm (Rotation 0 → 90) parents Hand; row 13: Quiet is shy, Loud isn't", build(SYN(335, "Synthetic Family", { hide_shy: true }), fam, [1, 2]));
syn("row16-pass.json", "row 16: Arm's pivot moved to its left edge at its 0° key: Hand turns with it at 2 s",
  build(SYN(335, "Synthetic Family", { hide_shy: true, time: 1 }), variant(fam, (s) => { panBehind(byName(s, "Arm"), [0, 20], 1); }), [1, 2]));
// Row 26: the playhead moved between reads; row 27: a time not sampled and a layer with no rectangle.
syn("row26-moved-playhead.json", "row 26: edge-before.json with Door's pivot moved by Pan Behind, read with the playhead at 2 s",
  build(SYN(331, "Synthetic Edges", { time: 2 }), variant(plain, (s) => { panBehind(byName(s, "Door"), [0, 250], 0); })));
syn("row26-untouched.json", "row 26: edge-before.json read again with the playhead at 2 s, nothing changed",
  build(SYN(331, "Synthetic Edges", { time: 2 }), plain));
syn("row27-not-sampled.json", "row 27: Door's pivot moved, but this read has no sample at the lesson's check time (0 s)",
  build(SYN(331, "Synthetic Edges", { time: 2 }), variant(plain, (s) => { panBehind(byName(s, "Door"), [0, 250], 0); byName(s, "Door").drop_times = [0]; byName(s, "Other").drop_times = [0]; })));
syn("row27-no-rect.json", "row 27: Door's pivot moved, but this read has no rectangle for it",
  build(SYN(331, "Synthetic Edges"), variant(plain, (s) => { panBehind(byName(s, "Door"), [0, 250], 0); byName(s, "Door").no_rect = true; })));
// The 70-key cap.
const busyTimes = Array.from({ length: 70 }, (_, i) => r3(0.05 + i * 0.08));
const busy = [solid("Door", 300, 500, [200, 300]), solid("Busy", 100, 100, [900, 300], { keys: { opacity: busyTimes.map((t, i) => [t, i % 2 ? 0 : 100]) } })];
syn("cap70-before.json", "Busy has 70 Opacity keys, past the 64-sample cap", build(SYN(336, "Synthetic Cap"), busy));
syn("cap70-pass.json", "Door's pivot moved; read with three caller times, so Busy keeps fewer of its late keys",
  build(SYN(336, "Synthetic Cap"), variant(busy, (s) => { panBehind(byName(s, "Door"), [0, 250], 0); }), [5.5, 5.6, 5.7]));
console.log("wrote anchor stand-ins and synthetics");
