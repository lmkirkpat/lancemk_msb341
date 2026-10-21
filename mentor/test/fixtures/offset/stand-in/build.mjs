// Writes the cloud stand-ins for spec 010's live captures (quickstart › 3) and the permanent
// synthetics (rows 5, 18, 19). Run from the repo root:
//   node mentor/test/fixtures/offset/stand-in/build.mjs
// Deleted with the rest of stand-in/ once the live captures replace them (tasks T034). The
// synthetics it writes to ../synthetic/ stay.
//
// Sources: Mentor Practice is mentor/test/fixtures/practice-before.json changed to its 2026-10-20
// state (discovery/usage-notes/mentor-practice-state-2026-10-20.md: Title Position at 0.5, 1.5, 3,
// 4.37 s, eased; Subtitle Position at 0.3, 1.3, 4.37 s). Mentor Practice 2 is built from the answer
// key in mentor/dev/build-practice-comp-2.jsx (layer order, times, values, types), since spec 004's
// practice2-before.json is a live capture not taken yet (its T041, T042).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apply } from "../../../../fixture/offset-demo.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PRACTICE = path.resolve(HERE, "../../practice-before.json");
const clone = (x) => JSON.parse(JSON.stringify(x));
const HOST = { ae_version: "26.5x89", os: "Macintosh OS 27.0.1/64" };

function write(dir, name, snap, note) {
  const out = { synthetic: note, ...snap };
  fs.writeFileSync(path.join(ROOT, dir, name), JSON.stringify(out, null, 2) + "\n");
}
const standIn = (name, snap) => write("stand-in", name, snap, `stand-in for mentor/test/fixtures/offset/${name} (live capture, spec 010 quickstart › 3)`);

// ---- Keys and properties

const ease = (dims, speed, influence) => Array.from({ length: dims }, () => ({ speed, influence }));
function keys(times, values, { type = "linear", dims = 1, eased = false, holdFirst = false } = {}) {
  return times.map((time, i) => {
    const t = holdFirst && i === 0 ? "hold" : eased ? "bezier" : type;
    const inT = holdFirst && i === 0 ? "hold" : eased ? "bezier" : type;
    return {
      index: i + 1, time, in_type: inT, out_type: t, value: values[i],
      in_ease: ease(dims, eased ? 0 : 10, eased ? 33.33 : 16.667),
      out_ease: ease(dims, eased ? 0 : 10, eased ? 33.33 : 16.667),
    };
  });
}
const TF = "ADBE Transform Group";
function prop(path, display_path, display_name, match_name, k, { dims = 1, expression = false } = {}) {
  return { path, display_path, match_name, display_name, dimensions: dims, expression_enabled: expression, keys: k };
}
const position = (k) => prop(`${TF}/ADBE Position`, "Transform › Position", "Position", "ADBE Position", k);
const opacity = (k) => prop(`${TF}/ADBE Opacity`, "Transform › Opacity", "Opacity", "ADBE Opacity", k);
const scale = (k) => prop(`${TF}/ADBE Scale`, "Transform › Scale", "Scale", "ADBE Scale", k, { dims: 3 });
const rotation = (k, o) => prop(`${TF}/ADBE Rotate Z`, "Transform › Rotation", "Rotation", "ADBE Rotate Z", k, o);
const xPos = (k) => prop(`${TF}/ADBE Position_0`, "Transform › X Position", "X Position", "ADBE Position_0", k);
const yPos = (k) => prop(`${TF}/ADBE Position_1`, "Transform › Y Position", "Y Position", "ADBE Position_1", k);
const blur = (k) => prop("ADBE Effect Parade/ADBE Gaussian Blur 2#1/ADBE Gaussian Blur 2-0001", "Effects › Gaussian Blur › Blurriness", "Blurriness", "ADBE Gaussian Blur 2-0001", k);
const layer = (index, name, kind, properties, extra = {}) => ({ index, name, kind, enabled: true, is_null: false, properties, ...extra });

// Shift every key on the named layer (all its properties, or the given paths) by `frames`.
function shift(snap, layerName, frames, paths) {
  const l = snap.layers.find((x) => x.name === layerName);
  apply(snap, { layer_index: l.index, property_paths: paths || l.properties.map((p) => p.path), shift_frames: frames });
  return snap;
}
const pathOf = (snap, layerName, displayName) => snap.layers.find((l) => l.name === layerName).properties.find((p) => p.display_name === displayName).path;
const r3 = (t) => Math.round(t * 1000) / 1000;

// ---- Mentor Practice, as read on 2026-10-20

function practiceNow() {
  const s = clone(JSON.parse(fs.readFileSync(PRACTICE, "utf8")));
  s.taken_at = "2026-10-21T12:00:00.000Z";
  s.host = HOST;
  const L = (name) => s.layers.find((l) => l.name === name);
  const P = (name, display) => L(name).properties.find((p) => p.display_name === display);
  P("Title", "Position").keys = keys([0.5, 1.5, 3, 4.37], [[960, 600], [960, 540], [960, 520], [900, 520]], { eased: true });
  P("Title", "Scale").keys = keys([0.5, 1.5], [[80, 80, 100], [100, 100, 100]], { eased: true, dims: 3 });
  P("Title", "Opacity").keys = keys([0.5, 1.5], [0, 100], { eased: true });
  P("Subtitle", "Position").keys = keys([0.3, 1.3, 4.37], [[960, 760], [960, 700], [900, 700]], { eased: true });
  const subOp = P("Subtitle", "Opacity");
  subOp.keys = keys([0.3, 1.3], [0, 100]);
  subOp.keys[0].out_type = "bezier";
  P("CTRL", "Position").keys = keys([0, 1], [[960, 540], [960, 500]]);
  P("Bar", "End").keys = keys([0.2, 1.2], [0, 100], { eased: true });
  P("Bar", "X Position").keys = keys([0, 0.6, 1.2], [200, 600, 960]);
  P("Glow", "Blurriness").keys = keys([0, 1], [20, 0]);
  P("Cursor", "Opacity").keys = keys([0, 0.5, 1, 1.5, 2, 2.5], [0, 100, 0, 100, 0, 100], { type: "hold" });
  P("Logo", "Scale").keys = keys([0], [[100, 100, 100]], { dims: 3 });
  P("Logo", "Rotation").keys = keys([0, 2], [0, 90]);
  P("Old Take", "Position").keys = keys([0, 1], [[960, 300], [960, 340]]);
  return s;
}

// ---- Mentor Practice 2, from mentor/dev/build-practice-comp-2.jsx (30 fps, 8 s)

function practice2(fps = 30, id = 300) {
  const shape = (index, name, properties) => layer(index, name, "shape", properties);
  const dot1Pos = keys([0, 0.5, 1.5], [[300, 300], [300, 400], [700, 400]], { holdFirst: true });
  const layers = [
    shape(1, "Blink", [opacity(keys([1, 1.4, 1.8, 2.2], [100, 0, 100, 0], { eased: true }))]),
    shape(2, "Spinner", [rotation(keys([0.25, 4.25], [0, 360]))]),
    shape(3, "Cut", [opacity(keys([3, 3.1], [100, 0], { eased: true }))]),
    shape(4, "Card", [
      position(keys([1.2, 2.4], [[400, 700], [800, 700]], { eased: true })),
      scale(keys([1.2, 2.4], [[80, 80, 100], [100, 100, 100]], { eased: true, dims: 3 })),
    ]),
    shape(5, "Dot 1", [position(dot1Pos), opacity(keys([0.5, 1.5], [20, 100]))]),
    shape(6, "Dot 2", [
      position(keys([0.5, 1.5], [[300, 500], [700, 500]])),
      opacity(keys([0.5, 1.5], [20, 100])),
      blur(keys([0.5, 1.5], [10, 0])),
    ]),
    shape(7, "Dot 3", [xPos(keys([0.5, 1.5], [300, 700])), yPos(keys([0.5, 1.25], [600, 500])), opacity(keys([0.5, 1.5], [20, 100]))]),
    shape(8, "Badge", [scale(keys([3.5, 4.5], [[60, 60, 100], [100, 100, 100]], { dims: 3 })), opacity(keys([3.5, 4.5], [20, 100]))]),
    ...["Chip A", "Chip B", "Chip C"].map((name, i) => {
      const y = 700 + (2 - i) * 60;
      return shape(9 + i, name, [position(keys([2, 3], [[1200, y], [1400, y]])), opacity(keys([2, 3], [20, 100]))]);
    }),
    shape(12, "Flag", [position(keys([4, 4.5, 5.5], [[1500, 300], [1500, 500], [1700, 500]], { holdFirst: true }))]),
    shape(13, "Pause", [position(keys([5, 5.5, 6, 6.5], [[200, 900], [500, 900], [500, 900], [800, 900]]))]),
  ];
  return {
    taken_at: "2026-10-21T12:00:00.000Z",
    project: "Claude AE Tutor Test.aep",
    comp: { id, name: fps === 30 ? "Mentor Practice 2" : "Mentor Practice 2 60fps", duration: 8, frame_rate: fps },
    precomp_layers: [],
    layers,
    host: HOST,
  };
}

// ---- Stand-ins

const now = practiceNow();
standIn("practice-now.json", now);

// Properties kind on Title: Opacity lands 4 frames early, Scale shifted 4 frames later (US1 #3).
{
  const s = clone(now);
  const op = s.layers.find((l) => l.name === "Title").properties.find((p) => p.display_name === "Opacity");
  op.keys[1].time = r3(op.keys[1].time - 4 / 30);
  shift(s, "Title", 4, [pathOf(s, "Title", "Scale")]);
  standIn("props-pass-landing.json", s);
}
// Scale moved 1 frame (US1 #4): still together.
standIn("props-one-frame.json", shift(clone(now), "Title", 1, [pathOf(now, "Title", "Scale")]));
// Logo's single Scale key moved (row 3), on top of a passing stagger.
{
  const s = clone(now);
  shift(s, "Title", 4, [pathOf(s, "Title", "Scale")]);
  shift(s, "Title", 8, [pathOf(s, "Title", "Opacity")]);
  s.layers.find((l) => l.name === "Logo").properties.find((p) => p.display_name === "Scale").keys[0].time = 0.2;
  standIn("single-key-moved.json", s);
}
// Logo's expression turned off (row 1).
{
  const s = clone(now);
  s.layers.find((l) => l.name === "Logo").properties.find((p) => p.display_name === "Rotation").expression_enabled = false;
  standIn("expression-toggled.json", s);
}

const mp2 = practice2();
standIn("practice2-before.json", mp2);
standIn("practice2-60fps.json", practice2(60, 301));

standIn("layers-pass.json", shift(shift(clone(mp2), "Dot 2", 4), "Dot 3", 8));
standIn("layers-uneven.json", shift(shift(clone(mp2), "Dot 2", 4), "Dot 3", 12));
standIn("layers-one-frame.json", shift(shift(clone(mp2), "Dot 2", 1), "Dot 3", 2));
// Dot 1's Opacity moved, its Position not ("pops in", FR-012).
standIn("pops-in.json", shift(shift(shift(clone(mp2), "Dot 1", 6, [pathOf(mp2, "Dot 1", "Opacity")]), "Dot 2", 4), "Dot 3", 8));
// Staggered Dot 1, Dot 3, Dot 2: not the stated order.
standIn("order-differs.json", shift(shift(clone(mp2), "Dot 3", 4), "Dot 2", 8));
// Dot 2 shifted with its Blurriness key (row 10).
standIn("effect-with-layer.json", shift(shift(clone(mp2), "Dot 2", 4), "Dot 3", 10));
// Dot 3's X Position and Opacity moved, Y Position not (row 7).
standIn("separated-x-only.json", shift(shift(clone(mp2), "Dot 2", 4), "Dot 3", 8, [pathOf(mp2, "Dot 3", "X Position"), pathOf(mp2, "Dot 3", "Opacity")]));
// Dots reordered in the stack, key times unchanged (row 17): Dot 1 and Dot 3 swap places.
{
  const s = clone(mp2);
  const d1 = s.layers.find((l) => l.name === "Dot 1");
  const d3 = s.layers.find((l) => l.name === "Dot 3");
  [d1.index, d3.index] = [d3.index, d1.index];
  s.layers.sort((a, b) => a.index - b.index);
  standIn("reordered.json", s);
}
// L-3's two shapes (row 16): a dragged bar moves the keys; a trimmed in point doesn't.
standIn("bar-dragged.json", shift(clone(mp2), "Dot 3", 6));
standIn("in-point-trimmed.json", clone(mp2));
// Dot 1's hold key moved, its jump not (row 4): its start is still the jump.
{
  const s = shift(shift(clone(mp2), "Dot 2", 4), "Dot 3", 8);
  s.layers.find((l) => l.name === "Dot 1").properties.find((p) => p.display_name === "Position").keys[0].time = 0.1;
  standIn("hold-group.json", s);
}
// The demo (Dot 2, 4 frames), its undo, and the learner's own shift after the undo (FR-011).
standIn("after-demo.json", shift(clone(mp2), "Dot 2", 4));
standIn("after-demo-undone.json", clone(mp2));
standIn("after-demo-redone.json", shift(shift(clone(mp2), "Dot 2", 6), "Dot 3", 12));

// ---- Permanent synthetics (spec 010 FR-022 allows these three rows as synthetic)

const small = (name, id, duration, layers) => ({
  taken_at: "2026-10-21T12:00:00.000Z", project: "Synthetic.aep", comp: { id, name, duration, frame_rate: 30 }, precomp_layers: [], layers,
});
const synthetic = (name, snap, row) => write("synthetic", name, snap, `synthetic: overlap row ${row}, no live case (spec 010 FR-022)`);

// Row 5: two held jumps on one layer at the same time.
synthetic("two-held-jumps.json", small("Two Jumps", 500, 4, [
  layer(1, "Lamp", "shape", [
    scale(keys([0, 1], [[50, 50, 100], [100, 100, 100]], { type: "hold", dims: 3 })),
    opacity(keys([0, 1], [20, 100], { type: "hold" })),
  ]),
]), 5);

// Row 18: keys pushed after the comp's end (3 s). Card's Opacity lands at 3.2 s; B starts at 3.1 s.
const pastEndBefore = small("Past End", 501, 3, [
  layer(1, "Card", "shape", [position(keys([1, 2], [[100, 100], [300, 100]])), opacity(keys([1, 2], [20, 100]))]),
  layer(2, "A", "shape", [position(keys([1, 2], [[100, 300], [300, 300]]))]),
  layer(3, "B", "shape", [position(keys([1, 2], [[100, 500], [300, 500]]))]),
]);
synthetic("past-end-before.json", pastEndBefore, 18);
{
  const s = clone(pastEndBefore);
  s.layers[0].properties[1].keys[1].time = 3.2;
  for (const k of s.layers[2].properties[0].keys) k.time = r3(k.time + 2.1);
  synthetic("past-end.json", s, 18);
}

// Row 19: Quick Offset's even spacing puts keys between frames. D2 moved 2.5 frames, D3 5 frames,
// and D2's Opacity a hair more than its Position (within half a frame).
const halfBefore = small("Half Frame", 502, 4, ["D1", "D2", "D3"].map((n, i) =>
  layer(i + 1, n, "shape", [position(keys([0.5, 1.5], [[100, 100 * (i + 1)], [300, 100 * (i + 1)]])), opacity(keys([0.5, 1.5], [20, 100]))])));
synthetic("half-frame-before.json", halfBefore, 19);
{
  const s = clone(halfBefore);
  for (const p of s.layers[1].properties) for (const k of p.keys) k.time = r3(k.time + 2.5 / 30);
  for (const k of s.layers[1].properties[1].keys) k.time = r3(k.time + 0.2 / 30);
  for (const p of s.layers[2].properties) for (const k of p.keys) k.time = r3(k.time + 5 / 30);
  synthetic("half-frame.json", s, 19);
}

console.log("Stand-ins and synthetics written to", ROOT);
