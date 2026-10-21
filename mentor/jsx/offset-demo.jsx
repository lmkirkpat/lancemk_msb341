// Spec 010 FR-010, the one demonstration for skill 3: shift every key on the given properties of
// one layer later by a whole number of frames, keys only (never the layer's in or out point). ES3
// function body with mentor/jsx/lib/*.jsx prepended; run with undo, so it's one Edit > Undo.
// ARGS = { comp_id, layer_index, property_paths, shift_frames }.
//
// ExtendScript has no "move key", so each key is re-created at its new time with every attribute
// copied, then the old one is removed, from the last key to the first so a moved key never lands
// on one not yet moved (research R5). Every refusal comes before any write: OFFSET_REFUSED with the
// reason (past_comp_end, locked, gap_under_floor, not_whole_frames). Live checks L-2 and L-4.

var comp = app.project.activeItem;
if (!(comp && comp instanceof CompItem)) throw new Error("NO_ACTIVE_COMP: Open the lesson's composition first.");
if (comp.id !== ARGS.comp_id) {
    throw new Error("NO_ACTIVE_COMP: The active comp isn't the lesson's comp. Switch back to it, then ask for the demonstration again.");
}
if (ARGS.layer_index < 1 || ARGS.layer_index > comp.numLayers) throw new Error("Layer " + ARGS.layer_index + " isn't in this comp.");

var layer = comp.layer(ARGS.layer_index);
var shift = ARGS.shift_frames;
var fps = comp.frameRate;

function refuse(reason) { throw new Error("OFFSET_REFUSED: " + reason); }

// Spec 004 FR-027's floor: under 2 frames or under 1/15 s, whichever is longer, still reads as
// together (mentor/lib/offset.mjs › floorFrames, isSame).
function floorFrames(rate) { return Math.max(2, rate / 15); }

if (typeof shift !== "number" || shift < 1 || Math.floor(shift) !== shift) refuse("not_whole_frames");
if (shift < floorFrames(fps) - 0.1) refuse("gap_under_floor");
if (layer.locked) refuse("locked");

var by = shift / fps;
var props = [];
for (var i = 0; i < ARGS.property_paths.length; i++) {
    var p = propByPath(layer, ARGS.property_paths[i]);
    if (p.numKeys < 1) throw new Error(displayPath(p) + " has no keys to shift.");
    if (p.keyTime(p.numKeys) + by > comp.duration + 0.000001) refuse("past_comp_end");
    props.push(p);
}

function safe(fn) { try { return fn(); } catch (e) { return null; } }

// Everything a key has that the shift must keep.
function readKey(p, k) {
    var key = {
        time: p.keyTime(k),
        value: p.keyValue(k),
        inType: p.keyInInterpolationType(k),
        outType: p.keyOutInterpolationType(k),
        inEase: safe(function () { return p.keyInTemporalEase(k); }),
        outEase: safe(function () { return p.keyOutTemporalEase(k); }),
        tCont: safe(function () { return p.keyTemporalContinuous(k); }),
        tAuto: safe(function () { return p.keyTemporalAutoBezier(k); }),
        label: safe(function () { return p.keyLabel(k); }),
        spatial: false
    };
    if (p.isSpatial) {
        key.spatial = true;
        key.inTan = safe(function () { return p.keyInSpatialTangent(k); });
        key.outTan = safe(function () { return p.keyOutSpatialTangent(k); });
        key.sCont = safe(function () { return p.keySpatialContinuous(k); });
        key.sAuto = safe(function () { return p.keySpatialAutoBezier(k); });
        key.roving = safe(function () { return p.keyRoving(k); });
    }
    return key;
}

// Ease first (setting ease can turn both sides Bezier), then the types, then the rest.
function writeKey(p, k, key) {
    p.setValueAtKey(k, key.value);
    if (key.inEase !== null && key.outEase !== null) p.setTemporalEaseAtKey(k, key.inEase, key.outEase);
    p.setInterpolationTypeAtKey(k, key.inType, key.outType);
    if (key.tCont !== null) p.setTemporalContinuousAtKey(k, key.tCont);
    if (key.tAuto !== null) p.setTemporalAutoBezierAtKey(k, key.tAuto);
    if (key.spatial) {
        if (key.inTan !== null && key.outTan !== null) p.setSpatialTangentsAtKey(k, key.inTan, key.outTan);
        if (key.sCont !== null) p.setSpatialContinuousAtKey(k, key.sCont);
        if (key.sAuto !== null) p.setSpatialAutoBezierAtKey(k, key.sAuto);
        if (key.roving !== null) safe(function () { p.setRovingAtKey(k, key.roving); return true; });
    }
    if (key.label !== null) safe(function () { p.setLabelAtKey(k, key.label); return true; });
}

var expected = [];
var moved = 0;
for (var pi = 0; pi < props.length; pi++) {
    var prop = props[pi];
    var times = [];
    for (var k = prop.numKeys; k >= 1; k--) {
        var key = readKey(prop, k);
        var at = prop.addKey(key.time + by);
        writeKey(prop, at, key);
        prop.removeKey(k);
        times.unshift(key.time + by);
        moved++;
    }
    expected.push(times);
}

// Verify: every key where it should be, and no key lost.
for (var vi = 0; vi < props.length; vi++) {
    var vp = props[vi];
    if (vp.numKeys !== expected[vi].length) {
        throw new Error("After Effects didn't keep every key on " + displayPath(vp) + ". Use Edit > Undo and tell the mentor.");
    }
    for (var vk = 1; vk <= vp.numKeys; vk++) {
        if (Math.abs(vp.keyTime(vk) - expected[vi][vk - 1]) > 0.001) {
            throw new Error("After Effects didn't move every key on " + displayPath(vp) + ". Use Edit > Undo and tell the mentor.");
        }
    }
}

var names = [];
for (var ni = 0; ni < props.length; ni++) names.push(props[ni].name);

return {
    layer: layer.name,
    properties: names,
    shift_frames: shift,
    keys_moved: moved
};
