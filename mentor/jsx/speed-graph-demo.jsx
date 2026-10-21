// Spec 008 FR-007, research R6: the speed-graph lesson's one demonstration. On one keyframe pair, a
// short ease out of the start key and a long ease into the landing key: key i's out-side influence
// and key i+1's in-side influence set on every dimension, speeds kept, each key's other side and both
// keys' types left as they were. ES3 function body with mentor/jsx/lib/*.jsx prepended.
// ARGS = { comp_id, layer_index, property_path, key_index, out_influence, in_influence }; the two
// influences are DEMO_OUT and DEMO_IN from mentor/lib/speed-graph.mjs (the fingerprint, FR-008).
// Runs inside one undo group.

var comp = app.project.activeItem;
if (!(comp && comp instanceof CompItem)) throw new Error("NO_ACTIVE_COMP: Open the lesson's composition first.");
if (comp.id !== ARGS.comp_id) {
    throw new Error("The active comp isn't the lesson's comp. Switch back to it, then try the demonstration again.");
}
if (ARGS.layer_index < 1 || ARGS.layer_index > comp.numLayers) throw new Error("Layer " + ARGS.layer_index + " isn't in this comp.");
if (typeof ARGS.out_influence !== "number" || typeof ARGS.in_influence !== "number") {
    throw new Error("The demonstration needs its two influence values.");
}

var layer = comp.layer(ARGS.layer_index);
var prop = propByPath(layer, ARGS.property_path);
var i = ARGS.key_index;
if (i < 1 || i + 1 > prop.numKeys) throw new Error("Keys " + i + " and " + (i + 1) + " don't exist on " + displayPath(prop) + ".");

var BEZ = KeyframeInterpolationType.BEZIER;

function copyEases(list) {
    var out = [];
    for (var d = 0; d < list.length; d++) out.push(new KeyframeEase(list[d].speed, list[d].influence));
    return out;
}
// The same speeds, a new influence, on every dimension (Scale reports 3 even on a 2D layer).
function withInfluence(list, influence) {
    var out = [];
    for (var d = 0; d < list.length; d++) out.push(new KeyframeEase(list[d].speed, influence));
    return out;
}

// What must not change: each key's far side (a shared middle key's other pair) and its type.
var keepIn = prop.keyInInterpolationType(i);
var keepOut = prop.keyOutInterpolationType(i + 1);
var farIn = copyEases(prop.keyInTemporalEase(i));
var farOut = copyEases(prop.keyOutTemporalEase(i + 1));
var newOut = withInfluence(prop.keyOutTemporalEase(i), ARGS.out_influence);
var newIn = withInfluence(prop.keyInTemporalEase(i + 1), ARGS.in_influence);

// setTemporalEaseAtKey can make both sides of a key Bezier (set-ease.jsx, seen live in spec 002
// T026), so set the eases, then put each far side's type back.
prop.setTemporalEaseAtKey(i, farIn, newOut);
prop.setTemporalEaseAtKey(i + 1, newIn, farOut);
prop.setInterpolationTypeAtKey(i, keepIn, BEZ);
prop.setInterpolationTypeAtKey(i + 1, BEZ, keepOut);

function r3(t) { return Math.round(t * 1000) / 1000; }
function influences(list) {
    var out = [];
    for (var d = 0; d < list.length; d++) out.push(r3(list[d].influence));
    return out;
}
function sameEases(a, b) {
    if (a.length !== b.length) return false;
    for (var d = 0; d < a.length; d++) {
        if (Math.abs(a[d].speed - b[d].speed) > 0.001 || Math.abs(a[d].influence - b[d].influence) > 0.001) return false;
    }
    return true;
}

// Verify: both facing sides Bezier, the far sides' types and eases as they were.
var ok = prop.keyOutInterpolationType(i) === BEZ && prop.keyInInterpolationType(i + 1) === BEZ &&
    prop.keyInInterpolationType(i) === keepIn && prop.keyOutInterpolationType(i + 1) === keepOut;
if (ok && keepIn === BEZ) ok = sameEases(prop.keyInTemporalEase(i), farIn);
if (ok && keepOut === BEZ) ok = sameEases(prop.keyOutTemporalEase(i + 1), farOut);
if (!ok) {
    throw new Error("After Effects didn't apply the change to " + displayPath(prop) + " as expected. Use Edit > Undo and tell the mentor.");
}

return {
    layer: layer.name,
    property: prop.name,
    display_path: displayPath(prop),
    from_time: r3(prop.keyTime(i)),
    to_time: r3(prop.keyTime(i + 1)),
    dimensions: prop.keyInTemporalEase(1).length,
    out_influence: influences(prop.keyOutTemporalEase(i)),
    in_influence: influences(prop.keyInTemporalEase(i + 1))
};
