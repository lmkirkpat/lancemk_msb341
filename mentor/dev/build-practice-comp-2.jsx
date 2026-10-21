// Builds "Mentor Practice 2" (spec 004 research R13, tasks T041 and T064) in the open project and
// writes its answer key. Dev chore, run once by the builder through the upstream bridge's
// ae_run_script (as spec 002 T014), never by the mentor:
//   node mentor/dev/assemble.mjs build-practice-comp-2 '{"out": "<abs path>/mentor/test/fixtures/practice2-expected.json"}'
// ES3 function body. Needs mentor/jsx/lib/*.jsx (propPath, displayPath, toJSON) and
// ARGS = { out: "<absolute path for practice2-expected.json>", replace: false }.
// "out" is passed on the command line, so mentor/dev/assemble.mjs needs no default for this script.
//
// It never touches "Mentor Practice" or "Icon Precomp". The answer key is declared here, next to
// each property as it's built, not derived by analyzing the comp afterwards: each property's
// expected easing pair states, and each layer's timing measures (data-model › Timing measures).
//
// Wave A targets only (no layers for waves B or D):
//   Skill 1 (key types): Blink (an opacity blink built eased, should be held), Spinner (a constant
//     spin, linear, should stay linear), Cut (a second on/off change for skill 1's review, eased).
//   Skill 2's review: Card, Position and Scale at Easy Ease defaults (33.33 both sides).
//   Skill 3 and its review: Dot 1, Dot 2, Dot 3 (the first layers group, first moves at 0.5 s),
//     Chip A, Chip B, Chip C (the second group, at 2 s), and Badge (Scale and Opacity start and land
//     on the same frames).
//   Timing overlaps: Flag (a hold pair that starts a move), Pause (two neighbouring equal keys).
// Designer's rules (spec 009 teaching-design § 14, C-3; spec 010 SR-2): no first key of Blink,
// Spinner, Cut, Card, Badge, Flag or Pause at 0.5 s or 2 s, and no other layer's move starts on
// either group's frame; Blink and Cut are built eased; keys are linear unless stated; no Opacity on
// a skill 3 layer goes between 0 and 100 (20 → 100), so none is a skill 1 candidate.

var COMP_NAME = "Mentor Practice 2";
var PROTECTED = ["Mentor Practice", "Icon Precomp"];
var W = 1920, H = 1080, DUR = 8, FPS = 30;
var LIN = KeyframeInterpolationType.LINEAR;
var BEZ = KeyframeInterpolationType.BEZIER;
var HOLD = KeyframeInterpolationType.HOLD;

if (!ARGS.out) throw new Error("Pass {\"out\": \"<absolute path>/mentor/test/fixtures/practice2-expected.json\"}.");

function findComp(name) {
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof CompItem && it.name === name) return it;
    }
    return null;
}

var existing = findComp(COMP_NAME);
if (existing !== null) {
    if (!ARGS.replace) throw new Error("\"" + COMP_NAME + "\" already exists. Run with {\"replace\": true} to rebuild it.");
    for (var pi = 0; pi < PROTECTED.length; pi++) {
        if (existing.name === PROTECTED[pi]) throw new Error("Refusing to remove " + PROTECTED[pi] + ".");
    }
    existing.remove();
}

var comp = app.project.items.addComp(COMP_NAME, W, H, 1, DUR, FPS);
var expected = [];   // { layer, path, display_path, states[] }, resolved to segment ids at the end
var timingKey = [];  // { layer, units: [{ unit, moves }], first_start, last_landing }

function tf(layer, matchName) { return layer.property("ADBE Transform Group").property(matchName); }

// Sets keys and forces one interpolation type on both sides, so user preferences for new keys
// can't change the result.
function keys(prop, times, values, type) {
    for (var i = 0; i < times.length; i++) prop.setValueAtTime(times[i], values[i]);
    for (var k = 1; k <= prop.numKeys; k++) prop.setInterpolationTypeAtKey(k, type, type);
    return prop;
}

// Easy Ease defaults on every key, both sides (33.33% influence, speed 0), as F9 would.
function easyEase(prop) {
    var n = prop.keyInTemporalEase(1).length;
    for (var k = 1; k <= prop.numKeys; k++) {
        var a = [], b = [];
        for (var i = 0; i < n; i++) { a.push(new KeyframeEase(0, 33.33)); b.push(new KeyframeEase(0, 33.33)); }
        prop.setTemporalEaseAtKey(k, a, b);
        prop.setInterpolationTypeAtKey(k, BEZ, BEZ);
    }
    return prop;
}

function expect(layerName, prop, states) {
    expected.push({ layer: layerName, path: propPath(prop), display_path: displayPath(prop), states: states });
    return prop;
}

// m(start, end) is a ramp; m(t, t, true) an instant change (a hold pair) at t.
function m(start, end, instant) {
    return { start: start, end: end, duration: Math.round((end - start) * 1000) / 1000, kind: instant ? "instant" : "ramp" };
}

function timed(layerName, units, firstStart, lastLanding) {
    timingKey.push({ layer: layerName, units: units, first_start: firstStart, last_landing: lastLanding });
}

function addRect(layer, size) {
    var contents = layer.property("ADBE Root Vectors Group");
    contents.addProperty("ADBE Vector Group");
    contents.property(contents.numProperties).property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
    contents.property(contents.numProperties).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
    contents.property(contents.numProperties).property("ADBE Vectors Group").property(1).property("ADBE Vector Rect Size").setValue(size);
}

function shape(name, size) {
    var layer = comp.layers.addShape();
    layer.name = name;
    addRect(layer, size);
    return layer;
}

// Layers are added bottom-up: each new layer goes to index 1, so Blink (added last) ends up first.

// Background: unanimated.
comp.layers.addSolid([0.09, 0.09, 0.11], "Background", W, H, 1, DUR);

// Pause: two neighbouring keys with equal values (5.5 s and 6 s): a pause, not a move. For easing
// all three pairs are still linear.
var pause = shape("Pause", [80, 80]);
expect("Pause", keys(tf(pause, "ADBE Position"), [5, 5.5, 6, 6.5], [[200, 900], [500, 900], [500, 900], [800, 900]], LIN),
    ["linear", "linear", "linear"]);
timed("Pause", [{ unit: "Transform › Position", moves: [m(5, 5.5), m(6, 6.5)] }], 5, 6.5);

// Flag: a hold pair that starts a move: held at 4 s, jumps at 4.5 s, then ramps to 5.5 s.
var flag = shape("Flag", [60, 100]);
var flagPos = keys(tf(flag, "ADBE Position"), [4, 4.5, 5.5], [[1500, 300], [1500, 500], [1700, 500]], LIN);
flagPos.setInterpolationTypeAtKey(1, HOLD, HOLD);
expect("Flag", flagPos, ["held", "linear"]);
timed("Flag", [{ unit: "Transform › Position", moves: [m(4.5, 4.5, true), m(4.5, 5.5)] }], 4.5, 5.5);

// The second layers group (skill 3's reviews and evals): Chip A, B, C, Position and Opacity
// (20 → 100) starting at 2 s, linear.
var chipNames = ["Chip C", "Chip B", "Chip A"];
for (var ci = 0; ci < chipNames.length; ci++) {
    var chip = shape(chipNames[ci], [120, 40]);
    var y = 700 + ci * 60;
    expect(chipNames[ci], keys(tf(chip, "ADBE Position"), [2, 3], [[1200, y], [1400, y]], LIN), ["linear"]);
    expect(chipNames[ci], keys(tf(chip, "ADBE Opacity"), [2, 3], [20, 100], LIN), ["linear"]);
    timed(chipNames[ci], [
        { unit: "Transform › Position", moves: [m(2, 3)] },
        { unit: "Transform › Opacity", moves: [m(2, 3)] }
    ], 2, 3);
}

// Badge: Scale and Opacity (20 → 100) start and land on the same frames (3.5 s and 4.5 s), linear.
var badge = shape("Badge", [100, 100]);
expect("Badge", keys(tf(badge, "ADBE Scale"), [3.5, 4.5], [[60, 60, 100], [100, 100, 100]], LIN), ["linear"]);
expect("Badge", keys(tf(badge, "ADBE Opacity"), [3.5, 4.5], [20, 100], LIN), ["linear"]);
timed("Badge", [
    { unit: "Transform › Scale", moves: [m(3.5, 4.5)] },
    { unit: "Transform › Opacity", moves: [m(3.5, 4.5)] }
], 3.5, 4.5);

// The first layers group (skill 3): Dot 1, 2, 3, each with Position and Opacity (20 → 100) whose
// first moves start at 0.5 s.
// Dot 3: Position separated, X (0.5-1.5 s) and Y (0.5-1.25 s) both keyed: one Position move.
var dot3 = shape("Dot 3", [50, 50]);
tf(dot3, "ADBE Position").dimensionsSeparated = true;
expect("Dot 3", keys(tf(dot3, "ADBE Position_0"), [0.5, 1.5], [300, 700], LIN), ["linear"]);
expect("Dot 3", keys(tf(dot3, "ADBE Position_1"), [0.5, 1.25], [600, 500], LIN), ["linear"]);
expect("Dot 3", keys(tf(dot3, "ADBE Opacity"), [0.5, 1.5], [20, 100], LIN), ["linear"]);
timed("Dot 3", [
    { unit: "Position", moves: [m(0.5, 1.5)] },
    { unit: "Transform › Opacity", moves: [m(0.5, 1.5)] }
], 0.5, 1.5);

// Dot 2: an effect key pair (Gaussian Blur's Blurriness) starting at 0.5 s counts in its start.
var dot2 = shape("Dot 2", [50, 50]);
expect("Dot 2", keys(tf(dot2, "ADBE Position"), [0.5, 1.5], [[300, 500], [700, 500]], LIN), ["linear"]);
expect("Dot 2", keys(tf(dot2, "ADBE Opacity"), [0.5, 1.5], [20, 100], LIN), ["linear"]);
dot2.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
var dot2Blur = dot2.property("ADBE Effect Parade").property(1).property("ADBE Gaussian Blur 2-0001");
expect("Dot 2", keys(dot2Blur, [0.5, 1.5], [10, 0], LIN), ["linear"]);
timed("Dot 2", [
    { unit: "Transform › Position", moves: [m(0.5, 1.5)] },
    { unit: "Transform › Opacity", moves: [m(0.5, 1.5)] },
    { unit: "Effects › Gaussian Blur › Blurriness", moves: [m(0.5, 1.5)] }
], 0.5, 1.5);

// Dot 1: Position is hold then ramp: a hold key at 0 s, a jump at 0.5 s (its start), then a ramp
// to 1.5 s.
var dot1 = shape("Dot 1", [50, 50]);
var dot1Pos = keys(tf(dot1, "ADBE Position"), [0, 0.5, 1.5], [[300, 300], [300, 400], [700, 400]], LIN);
dot1Pos.setInterpolationTypeAtKey(1, HOLD, HOLD);
expect("Dot 1", dot1Pos, ["held", "linear"]);
expect("Dot 1", keys(tf(dot1, "ADBE Opacity"), [0.5, 1.5], [20, 100], LIN), ["linear"]);
timed("Dot 1", [
    { unit: "Transform › Position", moves: [m(0.5, 0.5, true), m(0.5, 1.5)] },
    { unit: "Transform › Opacity", moves: [m(0.5, 1.5)] }
], 0.5, 1.5);

// Card (skill 2's review): Position and Scale at Easy Ease defaults, 1.2-2.4 s.
var card = shape("Card", [300, 180]);
expect("Card", easyEase(keys(tf(card, "ADBE Position"), [1.2, 2.4], [[400, 700], [800, 700]], LIN)), ["eased"]);
expect("Card", easyEase(keys(tf(card, "ADBE Scale"), [1.2, 2.4], [[80, 80, 100], [100, 100, 100]], LIN)), ["eased"]);
timed("Card", [
    { unit: "Transform › Position", moves: [m(1.2, 2.4)] },
    { unit: "Transform › Scale", moves: [m(1.2, 2.4)] }
], 1.2, 2.4);

// Cut (skill 1's review): a second on/off change, 100 → 0 at 3-3.1 s, built eased (C-3).
var cut = shape("Cut", [200, 200]);
expect("Cut", easyEase(keys(tf(cut, "ADBE Opacity"), [3, 3.1], [100, 0], LIN)), ["eased"]);
timed("Cut", [{ unit: "Transform › Opacity", moves: [m(3, 3.1)] }], 3, 3.1);

// Spinner (skill 1): a constant spin, Rotation 0 → 360 over 4 s (0.25-4.25 s), linear: should stay linear.
var spinner = shape("Spinner", [120, 20]);
expect("Spinner", keys(tf(spinner, "ADBE Rotate Z"), [0.25, 4.25], [0, 360], LIN), ["linear"]);
timed("Spinner", [{ unit: "Transform › Rotation", moves: [m(0.25, 4.25)] }], 0.25, 4.25);

// Blink (skill 1): 4 Opacity keys alternating 100 and 0 (1-2.2 s), built eased: should be held.
var blink = shape("Blink", [40, 120]);
expect("Blink", easyEase(keys(tf(blink, "ADBE Opacity"), [1, 1.4, 1.8, 2.2], [100, 0, 100, 0], LIN)), ["eased", "eased", "eased"]);
timed("Blink", [{ unit: "Transform › Opacity", moves: [m(1, 1.4), m(1.4, 1.8), m(1.8, 2.2)] }], 1, 2.2);

// ---- Resolve the answer key (layer indexes are final only now) and check its totals.
var segments = [];
var totals = { linear: 0, eased: 0, held: 0 };
for (var e = 0; e < expected.length; e++) {
    var ex = expected[e];
    var index = comp.layer(ex.layer).index;
    for (var s = 0; s < ex.states.length; s++) {
        segments.push({ id: index + "/" + ex.path + "/" + (s + 1), layer: ex.layer, display_path: ex.display_path, state: ex.states[s] });
        totals[ex.states[s]]++;
    }
}
if (totals.linear !== 21 || totals.eased !== 6 || totals.held !== 2) {
    throw new Error("Answer key totals are " + totals.linear + " linear, " + totals.eased + " eased, " + totals.held +
        " held (expected 21, 6, 2).");
}
var timingOut = [];
for (var t = 0; t < timingKey.length; t++) {
    timingOut.push({
        layer_index: comp.layer(timingKey[t].layer).index, layer: timingKey[t].layer, units: timingKey[t].units,
        first_start: timingKey[t].first_start, last_landing: timingKey[t].last_landing
    });
}
var layerList = [];
for (var li = 1; li <= comp.numLayers; li++) layerList.push({ index: li, name: comp.layer(li).name });

var key = {
    generated_by: "mentor/dev/build-practice-comp-2.jsx",
    comp: { name: comp.name, width: W, height: H, duration: DUR, frame_rate: FPS },
    layers: layerList,
    segments: segments,
    skipped: [],
    hidden_layers: [],
    precomp_layers: [],
    totals: totals,
    timing: {
        layers: timingOut,
        // The two layers groups: every first move starts on these frames, and no other layer's move
        // starts on either (frames at 30 fps; at 60 fps they're 30 and 120).
        groups: [
            { time: 0.5, frame_30: 15, frame_60: 30, layers: ["Dot 1", "Dot 2", "Dot 3"] },
            { time: 2, frame_30: 60, frame_60: 120, layers: ["Chip A", "Chip B", "Chip C"] }
        ],
        same_frames: [{ layer: "Badge", start: 3.5, landing: 4.5, units: ["Transform › Scale", "Transform › Opacity"] }],
        last_motion_end: 6.5
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

comp.openInViewer();
return { comp: comp.name, layers: comp.numLayers, totals: totals, answer_key: ARGS.out };
