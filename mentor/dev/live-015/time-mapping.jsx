// Spec 015 T006 (Edge Case E22): where does a precomp's inner key land in the outer comp's time?
// Dev chore, run through ae_run_script on the practice project (Mentor Practice's Icon Precomp, id 111,
// whose Icon Shape has Position keys at 0 s (left, x 100) and 1 s (right, x 300)). ES3 function body.
//
// Builds a NEW comp "T006 time mapping" (never touches the practice comps) with four layers of the
// precomp, side by side:
//   A offset:  start time 0.5 s
//   B stretch: stretch 50%
//   C reverse: stretch -100%, start time 3.5 s
//   D remap:   time remap keys 0.5 s -> 1 s and 2.5 s -> 0 s, linear
// For each inner key it computes the outer time two ways: the formula the precomp read will use
// (start time + inner time x stretch, or the first frame whose remap value reaches the inner time), and
// AE's own sourceTime() at that frame. sourceTime() exists only in expressions, not ExtendScript, so
// each layer gets a Slider "Source time" with `sourceTime(time)` and the script reads it. The builder
// scrubs to each outer time and confirms the square is left (key 0) or right (key 1). Deleting the
// comp afterwards is the cockpit's.
// Note: with a negative stretch AE reports inPoint > outPoint (C: 3.5 and -4.5); the shown span is
// [min, max), so "shown" swaps them.

var SRC_ID = 111;
var NAME = "T006 time mapping";
var INNER = [0, 1];

for (var i = 1; i <= app.project.numItems; i++) {
  if (app.project.item(i).name === NAME) throw new Error(NAME + " already exists: delete it and run again.");
}
var src = app.project.itemByID(SRC_ID);
if (!(src instanceof CompItem) || src.name !== "Icon Precomp") throw new Error("Icon Precomp (id 111) not found.");
var comp = app.project.items.addComp(NAME, 1920, 1080, 1, 8, src.frameRate);
var fd = comp.frameDuration;

function add(name, x) {
  var L = comp.layers.add(src);
  L.name = name;
  L.property("ADBE Transform Group").property("ADBE Position").setValue([x, 540]);
  return L;
}
var D = add("D remap", 1600);
var C = add("C reverse", 1150);
var B = add("B stretch", 700);
var A = add("A offset", 250);
A.startTime = 0.5;
B.stretch = 50;
C.stretch = -100;
C.startTime = 3.5;
D.timeRemapEnabled = true;
var rm = D.property("ADBE Time Remapping");
var defaults = rm.numKeys;
rm.setValueAtTime(0.5, 1);
rm.setValueAtTime(2.5, 0);
for (var k = rm.numKeys; k >= 1; k--) {
  var t = rm.keyTime(k);
  if (Math.abs(t - 0.5) > 1e-6 && Math.abs(t - 2.5) > 1e-6) rm.removeKey(k);
}
for (var k = 1; k <= rm.numKeys; k++) rm.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);

function r3(v) { return Math.round(v * 1000) / 1000; }
function frames(t) { return Math.round(t / fd); }

// The formula the precomp read will use.
function outerTimes(L, innerT) {
  if (L.timeRemapEnabled) {
    var p = L.property("ADBE Time Remapping"), hits = [];
    for (var f = frames(L.inPoint); f < frames(L.outPoint); f++) {
      var v = p.valueAtTime(f * fd, false);
      if (Math.abs(v - innerT) < fd / 2) hits.push(r3(f * fd));
    }
    return { first: hits.length ? hits[0] : null, last: hits.length ? hits[hits.length - 1] : null, frames: hits.length };
  }
  var t = L.startTime + innerT * L.stretch / 100;
  var lo = Math.min(L.inPoint, L.outPoint), hi = Math.max(L.inPoint, L.outPoint);
  var shown = t >= lo - 1e-9 && t < hi - 1e-9;
  return { first: r3(t), shown: shown };
}
function sourceTimeProbe(L) {
  var s = L.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
  s.name = "Source time";
  s.property(1).expression = "sourceTime(time)";
  return s.property(1);
}

var out = [];
var layers = [A, B, C, D];
for (var i = 0; i < layers.length; i++) {
  var L = layers[i], st = sourceTimeProbe(L);
  var row = { layer: L.name, startTime: r3(L.startTime), stretch: L.stretch, remap: L.timeRemapEnabled,
    inPoint: r3(L.inPoint), outPoint: r3(L.outPoint), keys: [] };
  for (var j = 0; j < INNER.length; j++) {
    var o = outerTimes(L, INNER[j]);
    var check = o.first === null ? null : r3(st.valueAtTime(o.first, false));
    row.keys.push({ inner: INNER[j], pose: INNER[j] === 0 ? "left" : "right", outer: o, ae_sourceTime_at_outer: check });
  }
  out.push(row);
}
comp.time = 0;
comp.openInViewer();
return { comp: { id: comp.id, name: comp.name, fps: comp.frameRate }, remap_default_keys: defaults, layers: out };
