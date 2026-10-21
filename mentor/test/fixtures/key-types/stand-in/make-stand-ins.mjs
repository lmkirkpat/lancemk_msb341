// Writes the synthetic stand-ins in this folder (spec 009 research R8). Run once by hand:
//   node mentor/test/fixtures/key-types/stand-in/make-stand-ins.mjs
// Every file says what live capture it stands in for. This whole folder is deleted after the live
// sitting (tasks T033), when the tests point at the captures instead. Nothing here is read by the
// mentor; tests read the JSON files it wrote.
//
// Mentor Practice 2 follows mentor/dev/build-practice-comp-2.jsx (spec 004 T041, T064), which hasn't
// been run yet, so practice2-before.json is itself a stand-in for spec 004 T042's capture. Mentor
// Practice follows discovery/usage-notes/mentor-practice-state-2026-10-20.md, with values added.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const T = "ADBE Transform Group";
const HOST = { ae_version: "26.5x89", os: "Macintosh OS 27.0.1/64" };
const PROJECT = "Claude AE Tutor Test.aep";

const easeList = (dims, influence, speed = 0) => Array.from({ length: dims }, () => ({ speed, influence }));

// types: "L" linear, "B" eased (Easy Ease, 33.33), "H" hold; per key [in, out].
function key(i, time, value, inT, outT, dims) {
  const name = { L: "linear", B: "bezier", H: "hold" };
  return {
    index: i, time, in_type: name[inT], out_type: name[outT], value,
    in_ease: easeList(dims, inT === "B" ? 33.33 : 16.667), out_ease: easeList(dims, outT === "B" ? 33.33 : 16.667),
  };
}

function prop(pathTail, display, displayPath, dims, times, values, types, { expression = false } = {}) {
  const t = typeof types === "string" ? times.map(() => [types, types]) : types;
  return {
    path: pathTail, display_path: displayPath, match_name: pathTail.split("/").pop().replace(/#\d+$/, ""), display_name: display,
    dimensions: dims, expression_enabled: expression,
    keys: times.map((time, i) => key(i + 1, time, values[i], t[i][0], t[i][1], dims)),
  };
}

const tf = (match, display, dims, times, values, types, o) => prop(`${T}/${match}`, display, `Transform › ${display}`, dims, times, values, types, o);
const opacity = (times, values, types, o) => tf("ADBE Opacity", "Opacity", 1, times, values, types, o);
const layer = (index, name, kind, properties, { enabled = true } = {}) => ({ index, name, kind, enabled, is_null: kind === "null", properties });

// ---- Mentor Practice 2 as the build script makes it.
function practice2() {
  return {
    taken_at: "2026-10-21T12:00:00.000Z",
    project: PROJECT,
    comp: { id: 300, name: "Mentor Practice 2", duration: 8, frame_rate: 30 },
    precomp_layers: [],
    layers: [
      layer(1, "Blink", "shape", [opacity([1, 1.4, 1.8, 2.2], [100, 0, 100, 0], "B")]),
      layer(2, "Spinner", "shape", [tf("ADBE Rotate Z", "Rotation", 1, [0.25, 4.25], [0, 360], "L")]),
      layer(3, "Cut", "shape", [opacity([3, 3.1], [100, 0], "B")]),
      layer(4, "Card", "shape", [
        tf("ADBE Position", "Position", 1, [1.2, 2.4], [[400, 700, 0], [800, 700, 0]], "B"),
        tf("ADBE Scale", "Scale", 3, [1.2, 2.4], [[80, 80, 100], [100, 100, 100]], "B"),
      ]),
      layer(5, "Dot 1", "shape", [
        tf("ADBE Position", "Position", 1, [0, 0.5, 1.5], [[300, 300, 0], [300, 400, 0], [700, 400, 0]], [["H", "H"], ["L", "L"], ["L", "L"]]),
        opacity([0.5, 1.5], [20, 100], "L"),
      ]),
      layer(6, "Dot 2", "shape", [
        tf("ADBE Position", "Position", 1, [0.5, 1.5], [[300, 500, 0], [700, 500, 0]], "L"),
        opacity([0.5, 1.5], [20, 100], "L"),
        prop("ADBE Effect Parade/ADBE Gaussian Blur 2#1/ADBE Gaussian Blur 2-0001", "Blurriness", "Effects › Gaussian Blur › Blurriness", 1, [0.5, 1.5], [10, 0], "L"),
      ]),
      layer(7, "Dot 3", "shape", [
        tf("ADBE Position_0", "X Position", 1, [0.5, 1.5], [300, 700], "L"),
        tf("ADBE Position_1", "Y Position", 1, [0.5, 1.25], [600, 500], "L"),
        opacity([0.5, 1.5], [20, 100], "L"),
      ]),
      layer(8, "Badge", "shape", [
        tf("ADBE Scale", "Scale", 3, [3.5, 4.5], [[60, 60, 100], [100, 100, 100]], "L"),
        opacity([3.5, 4.5], [20, 100], "L"),
      ]),
      ...["Chip A", "Chip B", "Chip C"].map((name, ci) => layer(9 + ci, name, "shape", [
        tf("ADBE Position", "Position", 1, [2, 3], [[1200, 820 - ci * 60, 0], [1400, 820 - ci * 60, 0]], "L"),
        opacity([2, 3], [20, 100], "L"),
      ])),
      layer(12, "Flag", "shape", [tf("ADBE Position", "Position", 1, [4, 4.5, 5.5], [[1500, 300, 0], [1500, 500, 0], [1700, 500, 0]], [["H", "H"], ["L", "L"], ["L", "L"]])]),
      layer(13, "Pause", "shape", [tf("ADBE Position", "Position", 1, [5, 5.5, 6, 6.5], [[200, 900, 0], [500, 900, 0], [500, 900, 0], [800, 900, 0]], "L")]),
    ],
    host: HOST,
  };
}

// ---- Mentor Practice as read on 2026-10-20, with values.
function practiceNow() {
  return {
    taken_at: "2026-10-21T12:00:00.000Z",
    project: PROJECT,
    comp: { id: 97, name: "Mentor Practice", duration: 8, frame_rate: 30 },
    precomp_layers: [{ index: 9, name: "Icon" }],
    layers: [
      layer(1, "Title", "text", [
        tf("ADBE Position", "Position", 1, [0.5, 1.5, 3, 4.37], [[960, 640, 0], [960, 540, 0], [960, 520, 0], [960, 520, 0]], "B"),
        tf("ADBE Scale", "Scale", 3, [0.5, 1.5], [[80, 80, 100], [100, 100, 100]], "B"),
        opacity([0.5, 1.5], [0, 100], "B"),
      ]),
      layer(2, "Subtitle", "text", [
        tf("ADBE Position", "Position", 1, [0.3, 1.3, 4.37], [[960, 760, 0], [960, 720, 0], [960, 720, 0]], "B"),
        opacity([0.3, 1.3], [0, 100], [["L", "B"], ["L", "L"]]),
      ]),
      layer(3, "CTRL", "null", [tf("ADBE Position", "Position", 1, [0, 1], [[960, 540, 0], [1000, 540, 0]], "L")]),
      layer(4, "Bar", "shape", [
        prop("ADBE Root Vectors Group/ADBE Vector Group#1/ADBE Vectors Group/ADBE Vector Filter - Trim#3/ADBE Vector Trim End", "End",
          "Contents › Rectangle › Contents › Trim Paths 1 › End", 1, [0.2, 1.2], [0, 100], "B"),
        tf("ADBE Position_0", "X Position", 1, [0, 0.6, 1.2], [460, 960, 1220], "L"),
      ]),
      layer(5, "Glow", "adjustment", [
        prop("ADBE Effect Parade/ADBE Gaussian Blur 2#1/ADBE Gaussian Blur 2-0001", "Blurriness", "Effects › Gaussian Blur › Blurriness", 1, [0, 1], [20, 0], "L"),
      ]),
      layer(6, "Cursor", "text", [opacity([0, 0.5, 1, 1.5, 2, 2.5], [100, 0, 100, 0, 100, 0], "H")]),
      layer(7, "Logo", "shape", [
        tf("ADBE Scale", "Scale", 3, [0], [[100, 100, 100]], "L"),
        tf("ADBE Rotate Z", "Rotation", 1, [0, 2], [0, 90], "L", { expression: true }),
      ]),
      layer(8, "Old Take", "text", [tf("ADBE Position", "Position", 1, [0, 1], [[760, 540, 0], [960, 540, 0]], "L")], { enabled: false }),
    ],
    host: HOST,
  };
}

const find = (snap, layerName, propName) => snap.layers.find((l) => l.name === layerName).properties.find((p) => p.display_name === propName);
const setKey = (snap, layerName, propName, k, inT, outT) => {
  const kk = find(snap, layerName, propName).keys[k - 1];
  if (inT) kk.in_type = inT;
  if (outT) kk.out_type = outT;
};
const nextIndex = (snap) => Math.max(...snap.layers.map((l) => l.index), 14) + 1; // Background (14) has no keys

const files = {};
const stand = (name, liveFile, snap) => { files[name] = { synthetic: `stand-in for ${liveFile}`, ...snap }; };
const variant = (change) => { const s = practice2(); change(s); return s; };

stand("practice2-before.json", "mentor/test/fixtures/practice2-before.json (spec 004 T042, not captured yet)", practice2());
stand("practice-now.json", "mentor/test/fixtures/key-types/practice-now.json", practiceNow());

stand("blink-one-held.json", "mentor/test/fixtures/key-types/blink-one-held.json", variant((s) => setKey(s, "Blink", "Opacity", 2, null, "hold")));
stand("blink-all-held.json", "mentor/test/fixtures/key-types/blink-all-held.json",
  variant((s) => { for (const k of [1, 2, 3, 4]) setKey(s, "Blink", "Opacity", k, "hold", "hold"); }));
// Quickstart › 3 says "every key on Title", but Title is on Mentor Practice; on Mentor Practice 2 the
// same shape is everything selected: Blink, Cut (said to fade), Card and Pause.
stand("select-all-hold.json", "mentor/test/fixtures/key-types/select-all-hold.json", variant((s) => {
  for (const [l, p, n] of [["Blink", "Opacity", 4], ["Cut", "Opacity", 2], ["Card", "Position", 2], ["Card", "Scale", 2], ["Pause", "Position", 4]]) {
    for (let k = 1; k <= n; k++) setKey(s, l, p, k, "hold", "hold");
  }
}));
stand("wrong-side.json", "mentor/test/fixtures/key-types/wrong-side.json", variant((s) => setKey(s, "Blink", "Opacity", 2, "hold", null)));
stand("mixed-pair.json", "mentor/test/fixtures/key-types/mixed-pair.json", variant((s) => {
  setKey(s, "Blink", "Opacity", 1, null, "linear");
  setKey(s, "Blink", "Opacity", 2, "hold", null);
}));
stand("separated-x-held.json", "mentor/test/fixtures/key-types/separated-x-held.json", variant((s) => setKey(s, "Dot 3", "X Position", 1, null, "hold")));
stand("hold-at-zero.json", "mentor/test/fixtures/key-types/hold-at-zero.json", variant((s) => setKey(s, "Blink", "Opacity", 2, null, "hold")));
stand("loopout-blink.json", "mentor/test/fixtures/key-types/loopout-blink.json", variant((s) => {
  s.layers.push(layer(nextIndex(s), "Loop Blink", "shape", [opacity([6, 6.25], [100, 0], "L", { expression: true })]));
}));
stand("hold-only-effect.json", "mentor/test/fixtures/key-types/hold-only-effect.json", variant((s) => {
  s.layers.push(layer(nextIndex(s), "Toggle", "shape", [
    prop("ADBE Effect Parade/ADBE Checkbox Control#1/ADBE Checkbox Control-0001", "Checkbox", "Effects › Checkbox Control › Checkbox", 1, [6, 6.5], [1, 0], "H"),
  ]));
  s.layers.push(layer(nextIndex(s), "Label", "text", [
    prop("ADBE Text Properties/ADBE Text Document", "Source Text", "Text › Source Text", 1, [6, 7], [null, null], "H"),
  ]));
}));
stand("nested-opacity.json", "mentor/test/fixtures/key-types/nested-opacity.json", variant((s) => {
  s.layers.push(layer(nextIndex(s), "Swatch", "shape", [
    prop("ADBE Root Vectors Group/ADBE Vector Group#1/ADBE Vectors Group/ADBE Vector Graphic - Fill#2/ADBE Vector Fill Opacity", "Opacity",
      "Contents › Rectangle 1 › Contents › Fill 1 › Opacity", 1, [6, 6.5], [0, 100], "L"),
  ]));
  s.layers.push(layer(nextIndex(s), "Caption", "text", [
    prop("ADBE Text Properties/ADBE Text Animators/ADBE Text Animator#1/ADBE Text Animator Properties/ADBE Text Opacity", "Opacity",
      "Text › Animators › Animator 1 › Properties › Opacity", 1, [6, 6.5], [100, 0], "L"),
  ]));
}));
stand("spinner-eased.json", "mentor/test/fixtures/key-types/spinner-eased.json", variant((s) => setKey(s, "Spinner", "Rotation", 1, null, "bezier")));
stand("after-demo.json", "mentor/test/fixtures/key-types/after-demo.json", variant((s) => setKey(s, "Blink", "Opacity", 1, null, "hold")));
stand("after-demo-undone.json", "mentor/test/fixtures/key-types/after-demo-undone.json", practice2());
stand("after-demo-reheld.json", "mentor/test/fixtures/key-types/after-demo-reheld.json", variant((s) => setKey(s, "Blink", "Opacity", 1, null, "hold")));
stand("keys-moved.json", "mentor/test/fixtures/key-types/keys-moved.json", variant((s) => {
  const k = find(s, "Blink", "Opacity").keys[2];
  k.time = 1.9;
}));

// Overlap rows 10, 11, 13, 14, 16 (a named property that only pauses), 21, 22: not in quickstart › 3's table; a capture to add in the sitting.
stand("overlap-layers.json", "mentor/test/fixtures/key-types/overlap-layers.json (to add to quickstart › 3)", variant((s) => {
  s.precomp_layers.push({ index: 15, name: "Icon" });
  s.layers.push(layer(15, "Icon", "precomp", [opacity([6, 6.2], [0, 100], "L")]));
  s.layers.push(layer(16, "Ghost", "shape", [opacity([6, 6.2, 6.4], [100, 0, 100], "L")], { enabled: false }));
  s.layers.push(layer(17, "Matte", "shape", [opacity([6.5, 6.6], [0, 100], "L")], { enabled: false }));
  s.layers.push(layer(18, "Rig", "null", [opacity([6, 6.3], [100, 0], "L"), tf("ADBE Position", "Position", 1, [6, 7], [[0, 0, 0], [100, 0, 0]], "L")]));
  s.layers.push(layer(19, "Old Values", "shape", [opacity([6, 6.5], [null, null], "L")]));
  s.layers.push(layer(20, "Fader", "shape", [opacity([7, 7.5], [0, 100], "L")]));
  s.layers.push(layer(21, "Still", "shape", [tf("ADBE Position", "Position", 1, [6, 7], [[200, 200, 0], [200, 200, 0]], "L")]));
}));

// Row 17: a duplicate of Mentor Practice before and after the learner adds a 4-key blink to Logo.
const dup = () => { const s = practiceNow(); s.comp = { ...s.comp, id: 98, name: "Mentor Practice Blink" }; return s; };
stand("practice-blink-before.json", "mentor/test/fixtures/key-types/practice-blink-before.json", dup());
const after = dup();
after.layers.find((l) => l.name === "Logo").properties.push(opacity([3, 3.5, 4, 4.5], [100, 0, 100, 0], "L"));
stand("practice-blink-after.json", "mentor/test/fixtures/key-types/practice-blink-after.json", after);

for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(DIR, name), JSON.stringify(data, null, 2) + "\n");
console.log(`Wrote ${Object.keys(files).length} stand-ins to ${DIR}`);
