// Builds "Mentor Overlaps" (spec 004 wave B, tasks-wave-b T131, research R22) in the open project and
// writes its answer key. Not a lesson comp: one layer per wave B Edge Cases row, so reads R1 and R3,
// the visibility rule (FR-013) and the motion-sources map can be checked on a live capture (FR-012, SC-006).
// Dev chore, run once by the builder through the upstream bridge's ae_run_script (as spec 002 T014),
// never by the mentor:
//   node mentor/dev/assemble.mjs build-overlaps-b '{"out": "<abs path>/mentor/test/fixtures/layer-info/overlaps-expected.json"}'
// ES3 function body. Needs mentor/jsx/lib/*.jsx (propPath, toJSON) and
// ARGS = { out: "<absolute path for overlaps-expected.json>", replace: false }.
//
// It never touches "Mentor Practice", "Mentor Practice 2" or "Icon Precomp" (it adds two layers of
// Icon Precomp to its own comp, and refuses if Icon Precomp is missing). The answer key is declared
// next to each layer as it's built, never derived by running the mentor's code. AE's own answer for
// the comp-space math comes from a temporary Probe layer whose Point Control expressions call
// toComp(); the script reads them, writes them to the key as to_comp, and deletes Probe.
//
// It also reports, for T133's hand-back: which track-matte scripting call worked (curriculum B8), and
// whether AE turned the matte's eye off by itself. And, for T158, Orbit's on-screen angle from
// toComp() at three times, to compare with the snapshot's rotation sample.

var COMP_NAME = "Mentor Overlaps";
var ICON_NAME = "Icon Precomp";
var PROTECTED = ["Mentor Practice", "Mentor Practice 2", ICON_NAME];
var W = 1920, H = 1080, DUR = 6, FPS = 30, CTI = 1;
var LIN = KeyframeInterpolationType.LINEAR;
var BEZ = KeyframeInterpolationType.BEZIER;
var TR = "ADBE Transform Group/";

if (!ARGS.out) throw new Error("Pass {\"out\": \"<absolute path>/mentor/test/fixtures/layer-info/overlaps-expected.json\"}.");

function findComp(name) {
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof CompItem && it.name === name) return it;
    }
    return null;
}

var iconComp = findComp(ICON_NAME);
if (iconComp === null) throw new Error("\"" + ICON_NAME + "\" is missing. Build Mentor Practice first (mentor/dev/build-practice-comp.jsx).");
var existing = findComp(COMP_NAME);
if (existing !== null) {
    if (!ARGS.replace) throw new Error("\"" + COMP_NAME + "\" already exists. Run with {\"replace\": true} to rebuild it.");
    for (var pi = 0; pi < PROTECTED.length; pi++) {
        if (existing.name === PROTECTED[pi]) throw new Error("Refusing to remove " + PROTECTED[pi] + ".");
    }
    existing.remove();
}

var comp = app.project.items.addComp(COMP_NAME, W, H, 1, DUR, FPS);
comp.hideShyLayers = true;

function tf(layer, matchName) { return layer.property("ADBE Transform Group").property(matchName); }

function keys(prop, times, values, type) {
    for (var i = 0; i < times.length; i++) prop.setValueAtTime(times[i], values[i]);
    for (var k = 1; k <= prop.numKeys; k++) prop.setInterpolationTypeAtKey(k, type, type);
    return prop;
}

// Bezier with out influence 15 and in influence 80 on every key, speed 0: a shaped ease that's neither
// linear (easing) nor Easy Ease defaults (skill 2).
function shaped(prop) {
    var n = prop.keyInTemporalEase(1).length;
    for (var k = 1; k <= prop.numKeys; k++) {
        var a = [], b = [];
        for (var i = 0; i < n; i++) { a.push(new KeyframeEase(0, 80)); b.push(new KeyframeEase(0, 15)); }
        prop.setInterpolationTypeAtKey(k, BEZ, BEZ);
        prop.setTemporalEaseAtKey(k, a, b);
    }
    return prop;
}

function solid(name, w, h, pos) {
    var layer = comp.layers.addSolid([0.4, 0.5, 0.6], name, w, h, 1, DUR);
    if (pos) tf(layer, "ADBE Position").setValue(pos);
    return layer;
}

// The key, per layer: what each read should say, declared here as the layer is built.
var declared = [];
function declare(name, row, expect, motion, notes) {
    declared.push({ name: name, edge_row: row, expect: expect, motion: motion, notes: notes || null });
}
// Defaults for every expect: what a plain 2D solid with no switches reads.
function ex(o) {
    var base = {
        kind: "solid", enabled: true, is_null: false, three_d: false, collapse: false, auto_orient: false,
        parent: null, shy: false, guide: false, locked: false, time_remap: false, stretch: 100,
        matte: null, is_matte: false, effect_count: 0, "class": "renders"
    };
    for (var k in o) if (o.hasOwnProperty(k)) base[k] = o[k];
    return base;
}
function mo(o) {
    var base = { parents: [], own_keys: [], expressions_on_keyed: [], precomp_contents: "not_a_precomp", static_as_read: false };
    for (var k in o) if (o.hasOwnProperty(k)) base[k] = o[k];
    return base;
}

// Layers are added bottom-up: each new layer goes to index 1.

// ---- Orbit: Auto-Orient along path, Position keys on a curve (T158).
var orbit = solid("Orbit", 120, 40, [300, 900]);
keys(tf(orbit, "ADBE Position"), [0, 1, 2], [[300, 900], [600, 700], [900, 900]], LIN);
orbit.autoOrient = AutoOrientType.ALONG_PATH;
declare("Orbit", "auto-orient (T158)", ex({ auto_orient: true }), mo({ own_keys: [TR + "ADBE Position"] }),
    "comp-space returns auto_orient until T158 says whether the rotation read includes it");

// ---- Depth: 3D, no keys.
var depth = solid("Depth", 100, 100, [1700, 900]);
depth.threeDLayer = true;
declare("Depth", "3D layer", ex({ three_d: true }), mo({ static_as_read: true }), "comp-space returns three_d");

// ---- Locked Bar: Position keys shaped 15/80, then locked.
var locked = solid("Locked Bar", 300, 30, [1300, 1000]);
shaped(keys(tf(locked, "ADBE Position"), [3, 4], [[1300, 1000], [1600, 1000]], LIN));
locked.locked = true;
declare("Locked Bar", "locked layer", ex({ locked: true }), mo({ own_keys: [TR + "ADBE Position"] }));

// ---- Icon Remap and Icon Stretch: layers of Icon Precomp (contents not read).
var remap = comp.layers.add(iconComp);
remap.name = "Icon Remap";
tf(remap, "ADBE Position").setValue([1700, 650]);
remap.timeRemapEnabled = true;
declare("Icon Remap", "precomp layer: time remap read, contents not read",
    ex({ kind: "precomp", time_remap: true }),
    mo({ own_keys: ["ADBE Time Remapping"], precomp_contents: "not_read" }),
    "Turning time remap on adds two Time Remap keys (linear, at the in and out points): easing sees them as a linear pair");

var stretch = comp.layers.add(iconComp);
stretch.name = "Icon Stretch";
tf(stretch, "ADBE Position").setValue([1700, 250]);
stretch.stretch = 50;
declare("Icon Stretch", "precomp layer: in and out points and stretch read, contents not read",
    ex({ kind: "precomp", stretch: 50 }), mo({ precomp_contents: "not_read", static_as_read: true }));

// ---- Draft: a keyed solid the learner hid (eye off, not a matte or a null), so "hidden by the
// learner" is checked live beside the matte and the eye-off null (review S2). Linear Position keys,
// so it's an easing finding that's listed as hidden.
var draft = solid("Draft", 200, 60, [300, 500]);
keys(tf(draft, "ADBE Position"), [2.5, 3.5], [[300, 500], [500, 500]], LIN);
draft.enabled = false;
declare("Draft", "hidden by the learner (eye off, not a matte or a null)", ex({ enabled: false, "class": "hidden" }),
    mo({ own_keys: [TR + "ADBE Position"] }), "In easing's hidden_layers, with Rig (an eye-off null); Wipe isn't");

// ---- Still: no keys, no parent, no expression.
solid("Still", 100, 100, [100, 100]);
declare("Still", "layer with no keys, no parent, no expression", ex({}), mo({ static_as_read: true }),
    "Solo is turned on for Still by hand for overlaps-solo.json (T133)");

// ---- Gauge Dial: Rotation keyed 0 → 90 with an expression on (value).
var dial = solid("Gauge Dial", 20, 160, [1100, 300]);
var dialRot = keys(tf(dial, "ADBE Rotate Z"), [1, 2], [0, 90], LIN);
dialRot.expression = "value";
declare("Gauge Dial", "expression on a keyed property", ex({}),
    mo({ own_keys: [TR + "ADBE Rotate Z"], expressions_on_keyed: [TR + "ADBE Rotate Z"] }));

// ---- Drift: an expression on unkeyed Position (FR-015: in no finding, target or skip).
var drift = solid("Drift", 60, 60, [960, 300]);
tf(drift, "ADBE Position").expression = "[960 + time * 50, 300]";
declare("Drift", "expression with no keys (FR-015)", ex({}), mo({ static_as_read: true }),
    "static_as_read only in what was read: expressions.status stays not_read (read R2, wave D)");

// ---- Pivot (null, Rotation 90, Scale [200, 50], no keys) parenting Arm (200 × 40, Position keys at
// 0, 1, 2 s). Arm is parented while Pivot is still identity, so nothing is compensated, and only then
// is Pivot turned and scaled.
var pivot = comp.layers.addNull(DUR);
pivot.name = "Pivot";
tf(pivot, "ADBE Anchor Point").setValue([0, 0]);
tf(pivot, "ADBE Position").setValue([0, 0]);
var arm = solid("Arm", 200, 40, [0, 0]);
arm.parent = pivot;
keys(tf(arm, "ADBE Position"), [0, 1, 2], [[0, 0], [100, 0], [100, 100]], LIN);
tf(pivot, "ADBE Position").setValue([960, 600]);
tf(pivot, "ADBE Rotate Z").setValue(90);
tf(pivot, "ADBE Scale").setValue([200, 50, 100]);
declare("Pivot", "comp-space: rotated, non-uniformly scaled parent", ex({ kind: "null", is_null: true, "class": "null" }), mo({ static_as_read: true }));
declare("Arm", "comp-space: child of a rotated, scaled parent", ex({ parent: "Pivot" }),
    mo({ parents: [{ layer: "Pivot", "class": "null", shy: false, moves_children: false }], own_keys: [TR + "ADBE Position"] }));

// ---- Guide Grid: a guide layer, no keys.
var grid = solid("Guide Grid", 1920, 1080, [960, 540]);
grid.guideLayer = true;
declare("Guide Grid", "guide layer", ex({ guide: true, "class": "guide" }), mo({ static_as_read: true }));

// ---- Shy Parent (shy, Rotation keys) parenting Kid (no keys). Kid is parented before the keys.
var shyParent = solid("Shy Parent", 120, 120, [400, 700]);
var kid = solid("Kid", 60, 60, [500, 700]);
kid.parent = shyParent;
keys(tf(shyParent, "ADBE Rotate Z"), [0, 2], [0, 30], LIN);
shyParent.shy = true;
declare("Shy Parent", "shy parent", ex({ shy: true, "class": "shy" }), mo({ own_keys: [TR + "ADBE Rotate Z"] }),
    "timeline_hidden: the comp's shy filter is on");
declare("Kid", "shy parent's child", ex({ parent: "Shy Parent" }),
    mo({ parents: [{ layer: "Shy Parent", "class": "shy", shy: true, moves_children: true }] }));

// ---- Rig (null, eye off, Position keys 1 → 2 s) parenting Leaf 1 (own Scale keys) and Leaf 2
// (separated X and Y Position keys).
var rig = comp.layers.addNull(DUR);
rig.name = "Rig";
tf(rig, "ADBE Position").setValue([1400, 500]);
var leaf1 = solid("Leaf 1", 80, 80, [1350, 600]);
var leaf2 = solid("Leaf 2", 80, 80, [1500, 600]);
leaf1.parent = rig;
leaf2.parent = rig;
keys(tf(leaf1, "ADBE Scale"), [0, 1], [[100, 100, 100], [150, 150, 100]], LIN);
tf(leaf2, "ADBE Position").dimensionsSeparated = true;
var lx = tf(leaf2, "ADBE Position_0").value;
var ly = tf(leaf2, "ADBE Position_1").value;
keys(tf(leaf2, "ADBE Position_0"), [0, 1], [lx, lx + 100], LIN);
keys(tf(leaf2, "ADBE Position_1"), [0, 1], [ly, ly + 50], LIN);
keys(tf(rig, "ADBE Position"), [1, 2], [[1400, 500], [1600, 500]], LIN);
rig.enabled = false;
var rigParent = [{ layer: "Rig", "class": "null", shy: false, moves_children: true }];
declare("Rig", "hidden null with children", ex({ kind: "null", is_null: true, enabled: false, "class": "null" }), mo({ own_keys: [TR + "ADBE Position"] }));
declare("Leaf 1", "hidden null's child", ex({ parent: "Rig" }), mo({ parents: rigParent, own_keys: [TR + "ADBE Scale"] }));
declare("Leaf 2", "separated child", ex({ parent: "Rig" }),
    mo({ parents: rigParent, own_keys: [TR + "ADBE Position_0", TR + "ADBE Position_1"] }));

// ---- Photo matted by Wipe (alpha matte, eye off; Position linear 0.6 → 1.6 s, a moving matte,
// KD-001; an Opacity blink 100 → 0 → 100 shaped at 3 to 4 s, for skill 1's T124).
var photo = solid("Photo", 800, 450, [480, 300]);
var wipe = solid("Wipe", 800, 450, [80, 300]);
keys(tf(wipe, "ADBE Position"), [0.6, 1.6], [[80, 300], [880, 300]], LIN);
shaped(keys(tf(wipe, "ADBE Opacity"), [3, 3.5, 4], [100, 0, 100], LIN));
var matteMethod = null;
try {
    photo.setTrackMatte(wipe, TrackMatteType.ALPHA);
    matteMethod = "setTrackMatte(layer, TrackMatteType.ALPHA)";
} catch (e1) {
    // Before AE 23: the matte is the layer directly above, and the type goes on the matted layer.
    wipe.moveBefore(photo);
    photo.trackMatteType = TrackMatteType.ALPHA;
    matteMethod = "trackMatteType = TrackMatteType.ALPHA (matte directly above)";
}
var aeTurnedEyeOff = wipe.enabled === false;
wipe.enabled = false;
declare("Wipe", "track matte, eye off (KD-001)", ex({ enabled: false, is_matte: true, "class": "matte" }),
    mo({ own_keys: [TR + "ADBE Position", TR + "ADBE Opacity"] }),
    "Its Position pair is linear: an easing candidate, never hidden and never the demo (eye off)");
declare("Photo", "layer matted by a moving matte", ex({ matte: { layer: "Wipe", type: "alpha" } }), mo({ static_as_read: true }));

comp.time = CTI;

// ---- AE's own answer: a temporary Probe with Point Control expressions calling toComp().
function keyTimesOf(group, out) {
    for (var i = 1; i <= group.numProperties; i++) {
        var p = group.property(i);
        if (p === null || p.matchName === "ADBE Marker") continue;
        if (p.propertyType === PropertyType.PROPERTY) {
            if (p.canVaryOverTime && p.numKeys > 0) for (var k = 1; k <= p.numKeys; k++) out.push(Math.round(p.keyTime(k) * 1000) / 1000);
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

var probe = comp.layers.addNull(DUR);
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
    return [Math.round(v[0] * 1000) / 1000, Math.round(v[1] * 1000) / 1000];
}
function anchorExpr(name) {
    return "var L = thisComp.layer(\"" + name + "\"); var p = L.toComp(L.anchorPoint); [p[0], p[1]]";
}

var PROBED = ["Arm", "Leaf 1", "Leaf 2", "Kid", "Wipe"];
var toComp = [];
for (var pr = 0; pr < PROBED.length; pr++) {
    var target = comp.layer(PROBED[pr]);
    var times = keyTimesOf(target, [0, 1, 2]);
    var up = target.parent;
    while (up) { keyTimesOf(up, times); up = up.parent; }
    times = uniqueSorted(times);
    var ctl = probePoint(anchorExpr(PROBED[pr]));
    var points = [];
    for (var ti = 0; ti < times.length; ti++) points.push({ time: times[ti], point: readPoint(ctl, times[ti]) });
    toComp.push({ layer: PROBED[pr], points: points });
}

// T158: Orbit's on-screen angle, from its anchor and a point one rectangle-width along its x axis.
var orbitAnchor = probePoint(anchorExpr("Orbit"));
var orbitAxis = probePoint("var L = thisComp.layer(\"Orbit\"); var r = L.sourceRectAtTime(time, false); " +
    "var p = L.toComp([L.anchorPoint[0] + r.width, L.anchorPoint[1]]); [p[0], p[1]]");
var orbitCheck = [];
var ORBIT_TIMES = [0.5, 1, 1.5];
for (var oi = 0; oi < ORBIT_TIMES.length; oi++) {
    var a = readPoint(orbitAnchor, ORBIT_TIMES[oi]);
    var b = readPoint(orbitAxis, ORBIT_TIMES[oi]);
    var angle = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    orbitCheck.push({ time: ORBIT_TIMES[oi], anchor: a, x_axis: b, screen_angle: Math.round(angle * 1000) / 1000 });
}
probe.remove();

// ---- Resolve names to indexes (final only now) and write the key.
var layersOut = [];
for (var d = 0; d < declared.length; d++) {
    var dl = declared[d];
    var L = comp.layer(dl.name);
    var r = L.sourceRectAtTime(CTI, false);
    layersOut.push({
        name: dl.name, index: L.index, edge_row: dl.edge_row, expect: dl.expect, motion: dl.motion, notes: dl.notes,
        // AE's own values, read here so the key doesn't depend on Icon Precomp's duration.
        in_point: Math.round(L.inPoint * 1000) / 1000, out_point: Math.round(L.outPoint * 1000) / 1000,
        rect: { left: r.left, top: r.top, width: r.width, height: r.height }
    });
}
layersOut.sort(function (x, y) { return x.index - y.index; });
if (layersOut.length !== comp.numLayers) throw new Error("Declared " + layersOut.length + " layers but the comp has " + comp.numLayers + ".");

var key = {
    generated_by: "mentor/dev/build-overlaps-b.jsx",
    comp: { name: comp.name, width: W, height: H, duration: DUR, frame_rate: FPS, time: CTI, hide_shy: true },
    matte_method: matteMethod,
    matte_eye_turned_off_by_ae: aeTurnedEyeOff,
    layers: layersOut,
    to_comp: toComp,
    orbit_check: orbitCheck
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

comp.openInViewer();
return { comp: comp.name, layers: comp.numLayers, matte_method: matteMethod, matte_eye_turned_off_by_ae: aeTurnedEyeOff, answer_key: ARGS.out };
