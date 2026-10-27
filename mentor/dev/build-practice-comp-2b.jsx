// Adds wave B's targets to "Mentor Practice 2" (spec 004 wave B, tasks-wave-b T132 with T157, T160
// and T163; research R22) and writes their answer key. Dev chore, run once by the builder through the
// upstream bridge's ae_run_script, after wave A's tasks.md T041, T064 and T042, never by the mentor:
//   node mentor/dev/assemble.mjs build-practice-comp-2b '{"out": "<abs path>/mentor/test/fixtures/layer-info/practice2b-expected.json"}'
// ES3 function body. Needs mentor/jsx/lib/*.jsx (propPath, displayPath, toJSON) and
// ARGS = { out: "<absolute path for practice2b-expected.json>", replace: false }.
//
// It refuses if Mentor Practice 2 is missing, or if any 2b layer is already there (unless
// {"replace": true}, which removes only the 2b layers by name). It never changes Mentor Practice 2's
// existing layers, "Mentor Practice", "Mentor Overlaps" or "Icon Precomp" (Seal is a new layer of
// Icon Precomp). Every 2b layer goes just above Background, so the existing layers keep their indexes
// (only Background's moves down); the script checks that and stops if it isn't so.
//
// The answer key is declared next to each layer as it's built, never derived by running the mentor's
// code: its layer_info expectations, its easing pair states, its timing measures, and for skill 5
// (spec 011 SR-1) its anchor place and rest key; for skill 6 (spec 012 SR-3) the four sets. AE's own
// toComp() (from a temporary Probe, as build-overlaps-b.jsx) gives each layer's anchor in comp space
// and its corners at 0 s.
//
// Rules for every 2b layer (T132), so none is another skill's target by accident, checked below:
// no first key at 0.5 s or 2 s; every start at 3.0 s or later, at least 4 frames from any other 2b
// start and more than 2 frames from any existing layer's first key (skill 3); keys bezier at 15/80,
// never linear and never Easy Ease defaults (easing, skill 2); no Opacity between 0 and 100 (skill 1).

var COMP_NAME = "Mentor Practice 2";
var ICON_NAME = "Icon Precomp";
var NAMES_2B = [
    "Door", "Needle", "Banner", "Sign", "Lid", "Gauge", "Pop", "Sled", "Hatch", "Hatch Rig", "Tab", "Peg",
    "Plaque", "Flip", "Wobble", "Seal",
    "Tile", "Caption", "Stamp", "Row A", "Row B", "Row C", "Shadow", "Plate", "Gradient", "Reveal Matte"
];
var BEZ = KeyframeInterpolationType.BEZIER;
var LIN = KeyframeInterpolationType.LINEAR;
var TR = "ADBE Transform Group/";

if (!ARGS.out) throw new Error("Pass {\"out\": \"<absolute path>/mentor/test/fixtures/layer-info/practice2b-expected.json\"}.");

function findComp(name) {
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof CompItem && it.name === name) return it;
    }
    return null;
}
function layerNamed(c, name) {
    for (var i = 1; i <= c.numLayers; i++) if (c.layer(i).name === name) return c.layer(i);
    return null;
}

var comp = findComp(COMP_NAME);
if (comp === null) throw new Error("\"" + COMP_NAME + "\" is missing. Build it first (mentor/dev/build-practice-comp-2.jsx, tasks.md T041/T064).");
var iconComp = findComp(ICON_NAME);
if (iconComp === null) throw new Error("\"" + ICON_NAME + "\" is missing. Build Mentor Practice first (mentor/dev/build-practice-comp.jsx).");

var found2b = [];
for (var ni = 0; ni < NAMES_2B.length; ni++) if (layerNamed(comp, NAMES_2B[ni])) found2b.push(NAMES_2B[ni]);
if (found2b.length) {
    if (!ARGS.replace) throw new Error("Mentor Practice 2 already has wave B layers (" + found2b.join(", ") + "). Run with {\"replace\": true} to rebuild them.");
    for (var ri = 0; ri < found2b.length; ri++) {
        var old = layerNamed(comp, found2b[ri]);
        old.locked = false;
        old.remove();
    }
}

var bg = layerNamed(comp, "Background");
if (bg === null) throw new Error("Mentor Practice 2 has no Background layer. Rebuild it with build-practice-comp-2.jsx first.");
var FPS = comp.frameRate;
var W = comp.width;
var F = function (frame) { return frame / FPS; };

// What was there before, to prove nothing existing moved (Background aside).
var before = [];
var existingStarts = [];
function firstKeyTime(group, best) {
    for (var i = 1; i <= group.numProperties; i++) {
        var p = group.property(i);
        if (p === null || p.matchName === "ADBE Marker") continue;
        if (p.propertyType === PropertyType.PROPERTY) {
            if (p.canVaryOverTime && p.numKeys > 0 && (best === null || p.keyTime(1) < best)) best = p.keyTime(1);
        } else {
            best = firstKeyTime(p, best);
        }
    }
    return best;
}
for (var bi = 1; bi <= comp.numLayers; bi++) {
    var bl = comp.layer(bi);
    before.push({ name: bl.name, index: bl.index });
    var fk = firstKeyTime(bl, null);
    if (fk !== null) existingStarts.push({ layer: bl.name, time: fk });
}

function tf(layer, matchName) { return layer.property("ADBE Transform Group").property(matchName); }

// Keys bezier, out influence 15 and in influence 80 on every key, speed 0 (T132's rule).
function keys(prop, times, values) {
    for (var i = 0; i < times.length; i++) prop.setValueAtTime(times[i], values[i]);
    var n = prop.keyInTemporalEase(1).length;
    for (var k = 1; k <= prop.numKeys; k++) {
        var a = [], b = [];
        for (var d = 0; d < n; d++) { a.push(new KeyframeEase(0, 80)); b.push(new KeyframeEase(0, 15)); }
        prop.setInterpolationTypeAtKey(k, BEZ, BEZ);
        prop.setTemporalEaseAtKey(k, a, b);
    }
    return prop;
}

// Each new layer goes just above Background, in build order (so the first built ends up highest).
function place(layer) { layer.moveBefore(bg); return layer; }
function solid(name, w, h, pos) {
    var layer = comp.layers.addSolid([0.55, 0.45, 0.35], name, w, h, 1, comp.duration);
    tf(layer, "ADBE Position").setValue(pos);
    return place(layer);
}
function shape(name, size, pos) {
    var layer = comp.layers.addShape();
    layer.name = name;
    var contents = layer.property("ADBE Root Vectors Group");
    contents.addProperty("ADBE Vector Group");
    var g = contents.property(contents.numProperties).property("ADBE Vectors Group");
    g.addProperty("ADBE Vector Shape - Rect");
    g.addProperty("ADBE Vector Graphic - Fill");
    g.property(1).property("ADBE Vector Rect Size").setValue(size);
    tf(layer, "ADBE Position").setValue(pos);
    return place(layer);
}
function text(name, words, size, pos) {
    var layer = comp.layers.addText(words);
    layer.name = name;
    var td = layer.property("ADBE Text Properties").property("ADBE Text Document");
    var doc = td.value;
    doc.fontSize = size;
    doc.justification = ParagraphJustification.CENTER_JUSTIFY;
    td.setValue(doc);
    tf(layer, "ADBE Position").setValue(pos);
    return place(layer);
}

// ---- The key, declared as each layer is built.
var declared = [];   // { name, role, expect, motion, anchor_place, rest_key_time, notes }
var expected = [];   // easing: { layer, path, display_path, states }
var timingKey = [];  // { layer, units, first_start, last_landing }
var starts = [];     // { layer, time } for the rules check

function ex(o) {
    var base = {
        kind: "solid", enabled: true, is_null: false, three_d: false, collapse: false, auto_orient: false,
        parent: null, shy: false, guide: false, locked: false, time_remap: false, stretch: 100,
        matte: null, is_matte: false, effect_count: 0, "class": "renders"
    };
    for (var k in o) if (o.hasOwnProperty(k)) base[k] = o[k];
    // AE reads collapseTransformation true on every shape and text layer (live, 2026-10-26).
    if ((base.kind === "shape" || base.kind === "text") && !o.hasOwnProperty("collapse")) base.collapse = true;
    return base;
}
function mo(o) {
    var base = { parents: [], own_keys: [], expressions_on_keyed: [], precomp_contents: "not_a_precomp", static_as_read: false };
    for (var k in o) if (o.hasOwnProperty(k)) base[k] = o[k];
    return base;
}
var MIDDLE = { x: "middle", y: "middle" };
function declare(name, role, expect, motion, anchorPlace, restKeyTime, notes) {
    declared.push({ name: name, role: role, expect: expect, motion: motion, anchor_place: anchorPlace,
        rest_key_time: restKeyTime, notes: notes || null });
}
function r3(t) { return Math.round(t * 1000) / 1000; }
function m(start, end) { return { start: r3(start), end: r3(end), duration: r3(end - start), kind: "ramp" }; }
// One keyed property: its easing states (every pair eased at 15/80) and its timing unit.
function keyed(layerName, prop, unitName, times) {
    var states = [];
    var moves = [];
    for (var i = 1; i < times.length; i++) { states.push("eased"); moves.push(m(times[i - 1], times[i])); }
    expected.push({ layer: layerName, path: propPath(prop), display_path: displayPath(prop), states: states });
    return { unit: unitName || displayPath(prop), moves: moves };
}
function timed(layerName, units) {
    var first = null, last = null;
    for (var u = 0; u < units.length; u++) {
        for (var v = 0; v < units[u].moves.length; v++) {
            var mv = units[u].moves[v];
            if (first === null || mv.start < first) first = mv.start;
            if (last === null || mv.end > last) last = mv.end;
        }
    }
    timingKey.push({ layer: layerName, units: units, first_start: first, last_landing: last });
    starts.push({ layer: layerName, time: first });
}

// ================= Skill 5 (spec 011; T157 as amended by T160). Left side, x under 900.

var door = solid("Door", 300, 500, [200, 300]);
declare("Door", "skill5", ex({}), mo({ static_as_read: true }), MIDDLE, null,
    "Hinge on its left edge. T135 (b): move its anchor to the middle of its left edge with Pan Behind (Y), capture practice2b-anchor.json, then Edit > Undo");

solid("Needle", 30, 400, [420, 250]);
declare("Needle", "skill5", ex({}), mo({ static_as_read: true }), MIDDLE, null, "Hinge at the middle of its bottom edge");

var gauge = solid("Gauge", 40, 200, [500, 150]);
var gaugeTimes = [F(95), F(125)];
var gaugeUnit = keyed("Gauge", keys(tf(gauge, "ADBE Rotate Z"), gaugeTimes, [0, 90]), null, gaugeTimes);
timed("Gauge", [gaugeUnit]);
declare("Gauge", "skill5", ex({}), mo({ own_keys: [TR + "ADBE Rotate Z"] }), MIDDLE, r3(gaugeTimes[0]),
    "Rotation 0 → 90: the rest key is the one at 0");

// Lid: a 160 × 60 shape whose anchor sits 150 px below its middle, outside it.
var lid = shape("Lid", [160, 60], [640, 450]);
tf(lid, "ADBE Anchor Point").setValue([0, 150]);
declare("Lid", "skill5", ex({ kind: "shape" }), mo({ static_as_read: true }), null, null, "Its pivot sits outside the shape (row 23)");

var wobble = solid("Wobble", 80, 80, [800, 120]);
var wobbleTimes = [F(114), F(144)];
var wobbleUnit = keyed("Wobble", keys(tf(wobble, "ADBE Anchor Point"), wobbleTimes, [[40, 40], [60, 40]]), null, wobbleTimes);
timed("Wobble", [wobbleUnit]);
declare("Wobble", "skill5", ex({}), mo({ own_keys: [TR + "ADBE Anchor Point"] }), MIDDLE, null,
    "Anchor Point keys: never a candidate (row 4); its place is at 0 s, before the keys move it");

solid("Tab", 200, 50, [620, 480]);
declare("Tab", "skill5_review", ex({}), mo({ static_as_read: true }), MIDDLE, null);
solid("Peg", 30, 30, [820, 480]);
declare("Peg", "skill5_review", ex({}), mo({ static_as_read: true }), MIDDLE, null);

shape("Banner", [800, 60], [450, 640]);
declare("Banner", "skill5", ex({ kind: "shape" }), mo({ static_as_read: true }), MIDDLE, null, "800 × 60: left-middle vs the corners");

text("Sign", "Sign", 72, [200, 780]);
declare("Sign", "skill5", ex({ kind: "text" }), mo({ static_as_read: true }), null, null,
    "Centred text: its pivot starts on the baseline, between places (the baseline case)");

var plaque = solid("Plaque", 100, 60, [480, 790]);
tf(plaque, "ADBE Scale").setValue([200, 200, 100]);
declare("Plaque", "skill5", ex({}), mo({ static_as_read: true }), MIDDLE, null, "Scale 200%: places in its own space (row 17)");

var flip = solid("Flip", 100, 60, [720, 790]);
tf(flip, "ADBE Scale").setValue([-100, 100, 100]);
declare("Flip", "skill5", ex({}), mo({ static_as_read: true }), MIDDLE, null, "Scale [-100, 100]: its own sides (row 18)");

var pop = solid("Pop", 120, 120, [120, 960]);
var popTimes = [F(99), F(129)];
var popUnit = keyed("Pop", keys(tf(pop, "ADBE Scale"), popTimes, [[0, 0, 100], [100, 100, 100]]), null, popTimes);
timed("Pop", [popUnit]);
declare("Pop", "skill5", ex({}), mo({ own_keys: [TR + "ADBE Scale"] }), MIDDLE, r3(popTimes[1]),
    "Scale 0 → 100: the rest key is the one at 100 (the shrunk case)");

var sled = solid("Sled", 100, 60, [320, 960]);
var sledTimes = [F(110), F(125), F(140)];
var sledUnit = keyed("Sled", keys(tf(sled, "ADBE Position"), sledTimes, [[320, 960], [420, 960], [420, 900]]), null, sledTimes);
timed("Sled", [sledUnit]);
declare("Sled", "skill5", ex({}), mo({ own_keys: [TR + "ADBE Position"] }), MIDDLE, null, "Three Position keys (B5; spec 011 L-2)");

var hatchRig = comp.layers.addNull(comp.duration);
hatchRig.name = "Hatch Rig";
tf(hatchRig, "ADBE Position").setValue([640, 960]);
place(hatchRig);
var hatch = solid("Hatch", 150, 80, [640, 960]);
hatch.parent = hatchRig;
declare("Hatch Rig", "skill5", ex({ kind: "null", is_null: true, "class": "null" }), mo({ static_as_read: true }), null, null, "Hatch's parent");
declare("Hatch", "skill5", ex({ parent: "Hatch Rig" }),
    mo({ parents: [{ layer: "Hatch Rig", "class": "null", shy: false, moves_children: false }] }), MIDDLE, null,
    "Parented to a null (row 15)");

var seal = comp.layers.add(iconComp);
seal.name = "Seal";
tf(seal, "ADBE Position").setValue([840, 960]);
tf(seal, "ADBE Scale").setValue([30, 30, 100]);
seal.collapseTransformation = true;
place(seal);
declare("Seal", "skill5", ex({ kind: "precomp", collapse: true }), mo({ precomp_contents: "not_read", static_as_read: true }), MIDDLE, null,
    "Collapse Transformations on: never a candidate (row 10)");

// ================= Skill 6 (spec 012; T157 as amended by T163). Right side, x from 1100.

// The group: Tile, Caption and Stamp overlap one another at 0 s.
var tile = shape("Tile", [200, 100], [1200, 150]);
var tilePosTimes = [F(125), F(155)];
var tileScaleTimes = [F(131), F(161)];
var tilePos = keyed("Tile", keys(tf(tile, "ADBE Position"), tilePosTimes, [[1200, 150], [1240, 150]]), null, tilePosTimes);
var tileScale = keyed("Tile", keys(tf(tile, "ADBE Scale"), tileScaleTimes, [[100, 100, 100], [110, 110, 100]]), null, tileScaleTimes);
timed("Tile", [tilePos, tileScale]);
declare("Tile", "skill6_group", ex({ kind: "shape" }), mo({ own_keys: [TR + "ADBE Position", TR + "ADBE Scale"] }), null, null,
    "Position and Scale keys, starting 6 frames apart so they aren't a skill 3 properties group");

var caption = text("Caption", "Caption", 36, [1220, 215]);
var captionTimes = [F(129), F(159)];
var captionUnit = keyed("Caption", keys(tf(caption, "ADBE Opacity"), captionTimes, [20, 100]), null, captionTimes);
timed("Caption", [captionUnit]);
declare("Caption", "skill6_group", ex({ kind: "text" }), mo({ own_keys: [TR + "ADBE Opacity"] }), null, null,
    "Opacity 20 → 100, so it isn't a skill 1 candidate");

var stamp = solid("Stamp", 80, 80, [1290, 190]);
tf(stamp, "ADBE Position").dimensionsSeparated = true;
var stampTimes = [F(140), F(170)];
keys(tf(stamp, "ADBE Position_0"), stampTimes, [1290, 1310]);
keys(tf(stamp, "ADBE Position_1"), stampTimes, [190, 200]);
var sx = { layer: "Stamp", path: propPath(tf(stamp, "ADBE Position_0")), display_path: displayPath(tf(stamp, "ADBE Position_0")), states: ["eased"] };
var sy = { layer: "Stamp", path: propPath(tf(stamp, "ADBE Position_1")), display_path: displayPath(tf(stamp, "ADBE Position_1")), states: ["eased"] };
expected.push(sx, sy);
timed("Stamp", [{ unit: "Position", moves: [m(stampTimes[0], stampTimes[1])] }]);
declare("Stamp", "skill6_group", ex({}), mo({ own_keys: [TR + "ADBE Position_0", TR + "ADBE Position_1"] }), null, null, "Separated Position keys");

// The review group: Row A, B and C overlap one another; Row B has no keys.
var rowA = solid("Row A", 240, 60, [1740, 120]);
var rowATimes = [F(144), F(174)];
timed("Row A", [keyed("Row A", keys(tf(rowA, "ADBE Position"), rowATimes, [[1740, 120], [1760, 120]]), null, rowATimes)]);
declare("Row A", "skill6_rows", ex({}), mo({ own_keys: [TR + "ADBE Position"] }), null, null);
solid("Row B", 240, 60, [1740, 145]);
declare("Row B", "skill6_rows", ex({}), mo({ static_as_read: true }), null, null, "No keys: a static group member (filter 1)");
var rowC = solid("Row C", 240, 60, [1740, 170]);
var rowCTimes = [F(155), F(185)];
timed("Row C", [keyed("Row C", keys(tf(rowC, "ADBE Position"), rowCTimes, [[1740, 170], [1760, 170]]), null, rowCTimes)]);
declare("Row C", "skill6_rows", ex({}), mo({ own_keys: [TR + "ADBE Position"] }), null, null);

// The mistake row: Shadow follows Plate, a visible layer.
var plate = solid("Plate", 200, 120, [1200, 560]);
var plateTimes = [F(159), F(189)];
timed("Plate", [keyed("Plate", keys(tf(plate, "ADBE Position"), plateTimes, [[1200, 560], [1230, 560]]), null, plateTimes)]);
var shadow = solid("Shadow", 200, 120, [1215, 575]);
shadow.parent = plate;
declare("Plate", "skill6_mistake", ex({}), mo({ own_keys: [TR + "ADBE Position"] }), null, null, "Shadow's parent, a visible layer");
declare("Shadow", "skill6_mistake", ex({ parent: "Plate" }),
    mo({ parents: [{ layer: "Plate", "class": "renders", shy: false, moves_children: true }] }), null, null);

// The matte pair: Gradient matted by Reveal Matte (eye off).
var reveal = solid("Reveal Matte", 240, 140, [1740, 560]);
var gradient = solid("Gradient", 240, 140, [1740, 560]);
var gradTimes = [F(163), F(193)];
timed("Gradient", [keyed("Gradient", keys(tf(gradient, "ADBE Position"), gradTimes, [[1740, 560], [1760, 560]]), null, gradTimes)]);
var matteMethod = null;
try {
    gradient.setTrackMatte(reveal, TrackMatteType.ALPHA);
    matteMethod = "setTrackMatte(layer, TrackMatteType.ALPHA)";
} catch (e1) {
    gradient.trackMatteType = TrackMatteType.ALPHA; // Reveal Matte is directly above (built first)
    matteMethod = "trackMatteType = TrackMatteType.ALPHA (matte directly above)";
}
reveal.enabled = false;
declare("Reveal Matte", "skill6_matte", ex({ enabled: false, is_matte: true, "class": "matte" }), mo({ static_as_read: true }), null, null);
declare("Gradient", "skill6_matte", ex({ matte: { layer: "Reveal Matte", type: "alpha" } }), mo({ own_keys: [TR + "ADBE Position"] }), null, null);

var SETS = [
    { set: "group", layers: ["Tile", "Caption", "Stamp"] },
    { set: "rows", layers: ["Row A", "Row B", "Row C"] },
    { set: "mistake", layers: ["Plate", "Shadow"] },
    { set: "matte_pair", layers: ["Gradient", "Reveal Matte"] }
];

// ================= Checks: the T132 rules, before anything is written.

var problems = [];
for (var si = 0; si < starts.length; si++) {
    var s = starts[si];
    var fr = Math.round(s.time * FPS);
    if (s.time < 3 - 1e-6) problems.push(s.layer + " starts before 3 s");
    if (Math.abs(s.time - 0.5) < 1e-6 || Math.abs(s.time - 2) < 1e-6) problems.push(s.layer + " has a first key at 0.5 s or 2 s");
    for (var sj = si + 1; sj < starts.length; sj++) {
        if (Math.abs(fr - Math.round(starts[sj].time * FPS)) < 4) problems.push(s.layer + " and " + starts[sj].layer + " start under 4 frames apart");
    }
    for (var se = 0; se < existingStarts.length; se++) {
        if (Math.abs(fr - Math.round(existingStarts[se].time * FPS)) <= 2) problems.push(s.layer + " starts within 2 frames of " + existingStarts[se].layer);
    }
}
for (var ai = 0; ai < before.length; ai++) {
    if (before[ai].name === "Background") continue;
    var now = layerNamed(comp, before[ai].name);
    if (!now || now.index !== before[ai].index) problems.push(before[ai].name + " moved from index " + before[ai].index);
}

// ================= AE's own answer: a temporary Probe calling toComp().

function keyTimesOf(group, out) {
    for (var i = 1; i <= group.numProperties; i++) {
        var p = group.property(i);
        if (p === null || p.matchName === "ADBE Marker") continue;
        if (p.propertyType === PropertyType.PROPERTY) {
            if (p.canVaryOverTime && p.numKeys > 0) for (var k = 1; k <= p.numKeys; k++) out.push(r3(p.keyTime(k)));
        } else {
            keyTimesOf(p, out);
        }
    }
    return out;
}
function uniqueSorted(list) {
    list.sort(function (a, b) { return a - b; });
    var out = [];
    for (var i = 0; i < list.length; i++) if (i === 0 || list[i] !== list[i - 1]) out.push(list[i]);
    return out;
}

var probe = comp.layers.addNull(comp.duration);
probe.name = "Probe";
var effects = probe.property("ADBE Effect Parade");
function probePoint(expr) {
    var fx = effects.addProperty("ADBE Point Control");
    var p = fx.property(1);
    p.expression = expr;
    return p;
}
function readPoint(p, t) {
    var v = p.valueAtTime(t, false);
    if (p.expressionError) throw new Error("Probe expression failed: " + p.expressionError);
    return [r3(v[0]), r3(v[1])];
}
function pointExpr(name, corner) {
    var L = "thisComp.layer(\"" + name + "\")";
    if (corner === null) return "var L = " + L + "; var p = L.toComp(L.anchorPoint); [p[0], p[1]]";
    return "var L = " + L + "; var r = L.sourceRectAtTime(time, false); " +
        "var p = L.toComp([r.left + " + corner[0] + " * r.width, r.top + " + corner[1] + " * r.height]); [p[0], p[1]]";
}

var toComp = [];
var boundsAt0 = {};
var CORNERS = [[0, 0], [1, 0], [1, 1], [0, 1]];
for (var di = 0; di < declared.length; di++) {
    var name = declared[di].name;
    var target = layerNamed(comp, name);
    var times = keyTimesOf(target, [0, 1, 2]);
    if (target.parent) keyTimesOf(target.parent, times);
    times = uniqueSorted(times);
    var ctl = probePoint(pointExpr(name, null));
    var points = [];
    for (var ti = 0; ti < times.length; ti++) points.push({ time: times[ti], point: readPoint(ctl, times[ti]) });
    toComp.push({ layer: name, points: points });
    var xs = [], ys = [];
    for (var ci = 0; ci < CORNERS.length; ci++) {
        var c = readPoint(probePoint(pointExpr(name, CORNERS[ci])), 0);
        xs.push(c[0]);
        ys.push(c[1]);
    }
    boundsAt0[name] = {
        left: Math.min.apply(null, xs), top: Math.min.apply(null, ys),
        right: Math.max.apply(null, xs), bottom: Math.max.apply(null, ys)
    };
}
probe.remove();

// T163: within a set every two layers overlap at 0 s; each set is more than 10% of the comp's width
// from every other set and from every skill 5 layer (on at least one axis).
function overlaps(a, b) { return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom; }
function gap(a, b) { return Math.max(b.left - a.right, a.left - b.right, b.top - a.bottom, a.top - b.bottom); }
function union(names) {
    var u = null;
    for (var i = 0; i < names.length; i++) {
        var b = boundsAt0[names[i]];
        u = u === null ? { left: b.left, top: b.top, right: b.right, bottom: b.bottom } :
            { left: Math.min(u.left, b.left), top: Math.min(u.top, b.top), right: Math.max(u.right, b.right), bottom: Math.max(u.bottom, b.bottom) };
    }
    return u;
}
var MIN_GAP = 0.1 * W;
var setsOut = [];
for (var a1 = 0; a1 < SETS.length; a1++) {
    var members = SETS[a1].layers;
    for (var x1 = 0; x1 < members.length; x1++) {
        for (var x2 = x1 + 1; x2 < members.length; x2++) {
            if (!overlaps(boundsAt0[members[x1]], boundsAt0[members[x2]])) problems.push(members[x1] + " and " + members[x2] + " don't overlap at 0 s");
        }
    }
    var ub = union(members);
    setsOut.push({ set: SETS[a1].set, layers: members, bounds_at_0: ub });
    for (var a2 = a1 + 1; a2 < SETS.length; a2++) {
        if (gap(ub, union(SETS[a2].layers)) <= MIN_GAP) problems.push("sets " + SETS[a1].set + " and " + SETS[a2].set + " are within 10% of the comp's width");
    }
    for (var d5 = 0; d5 < declared.length; d5++) {
        if (declared[d5].role.indexOf("skill5") !== 0) continue;
        if (gap(ub, boundsAt0[declared[d5].name]) <= MIN_GAP) problems.push("set " + SETS[a1].set + " is within 10% of the comp's width of " + declared[d5].name);
    }
}
if (problems.length) throw new Error("Mentor Practice 2b breaks its own rules; nothing was written. Edit > Undo, adjust the script, and run again:\n" + problems.join("\n"));

// ================= Resolve indexes and write the key.

var segments = [];
for (var e = 0; e < expected.length; e++) {
    var exd = expected[e];
    var idx = layerNamed(comp, exd.layer).index;
    for (var st = 0; st < exd.states.length; st++) {
        segments.push({ id: idx + "/" + exd.path + "/" + (st + 1), layer: exd.layer, display_path: exd.display_path, state: exd.states[st] });
    }
}
var timingOut = [];
for (var tk = 0; tk < timingKey.length; tk++) {
    timingOut.push({ layer_index: layerNamed(comp, timingKey[tk].layer).index, layer: timingKey[tk].layer, units: timingKey[tk].units,
        first_start: timingKey[tk].first_start, last_landing: timingKey[tk].last_landing });
}
var layersOut = [];
for (var dd = 0; dd < declared.length; dd++) {
    var dl = declared[dd];
    var L2 = layerNamed(comp, dl.name);
    var rect = L2.sourceRectAtTime(0, false);
    var entry = {
        name: dl.name, index: L2.index, role: dl.role, expect: dl.expect, motion: dl.motion,
        notes: dl.notes, rect_at_0: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        bounds_at_0: boundsAt0[dl.name]
    };
    // Skill 5's layers only (spec 011 SR-1): which of the nine places the anchor is in as built
    // ({ x, y }, or null for none), and the rest key's time (null without Rotation or Scale keys).
    if (dl.role.indexOf("skill5") === 0) {
        entry.anchor_place = dl.anchor_place;
        entry.rest_key_time = dl.rest_key_time;
    }
    layersOut.push(entry);
}
layersOut.sort(function (p, q) { return p.index - q.index; });
var existingAfter = [];
for (var ea = 0; ea < before.length; ea++) existingAfter.push({ name: before[ea].name, before: before[ea].index, after: layerNamed(comp, before[ea].name).index });

var key = {
    generated_by: "mentor/dev/build-practice-comp-2b.jsx",
    comp: { name: comp.name, width: W, height: comp.height, duration: comp.duration, frame_rate: FPS, time_at_capture: 0 },
    matte_method: matteMethod,
    existing_layers: existingAfter,
    layers: layersOut,
    segments: segments,
    timing: { layers: timingOut },
    sets: setsOut,
    set_gap_min_px: MIN_GAP,
    to_comp: toComp,
    by_hand: {
        parented: "T135 (a): add a null, parent Tile, Caption and Stamp to it with the pick whip in the Parent column, capture practice2b-parented.json at 0 s, then Edit > Undo",
        anchor: "T135 (b): move Door's anchor to the middle of its left edge with Pan Behind (Y), capture practice2b-anchor.json at 0 s, then Edit > Undo"
    }
};

var f = new File(ARGS.out);
f.encoding = "UTF-8";
f.lineFeed = "Unix";
if (!f.open("w")) {
    throw new Error("Couldn't write " + ARGS.out + ". In AE, turn on Settings > Scripting & Expressions > " +
        "Allow Scripts to Write Files and Access Network, then run again with {\"replace\": true}.");
}
f.write(toJSON(key, "  ") + "\n");
f.close();

comp.time = 0;
comp.openInViewer();
return { comp: comp.name, added: declared.length, layers: comp.numLayers, matte_method: matteMethod, answer_key: ARGS.out };
