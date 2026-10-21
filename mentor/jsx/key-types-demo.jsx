// Spec 009 FR-010, skill 1's one demonstration: hold on the demo pair's first key, exactly as Animation >
// Toggle Hold Keyframe writes it at 26.5 (live check L-2 decides the sides). ES3 function body with
// mentor/jsx/lib/*.jsx prepended. ARGS = { comp_id, layer_index, property_path, key_index }, where the
// pair runs from key key_index to key_index + 1. Runs inside one undo group (undo: true).

// "out": the key's outgoing side only, its incoming side as it was. "both": both sides. Keep in step
// with HOLD_SIDES in mentor/lib/key-types.mjs (its fixture twin reads that one).
var HOLD_SIDES = "out";

var comp = app.project.activeItem;
if (!(comp && comp instanceof CompItem)) throw new Error("NO_ACTIVE_COMP: Open the lesson's composition first.");
if (comp.id !== ARGS.comp_id) {
    throw new Error("The active comp isn't the lesson's comp. Switch back to it, then try the demonstration again.");
}
if (ARGS.layer_index < 1 || ARGS.layer_index > comp.numLayers) throw new Error("Layer " + ARGS.layer_index + " isn't in this comp.");

var layer = comp.layer(ARGS.layer_index);
var prop = propByPath(layer, ARGS.property_path);
var i = ARGS.key_index;
if (i < 1 || i + 1 > prop.numKeys) throw new Error("Keys " + i + " and " + (i + 1) + " don't exist on " + displayPath(prop) + ".");

var HOLD = KeyframeInterpolationType.HOLD;

function typeName(t) {
    if (t === KeyframeInterpolationType.LINEAR) return "linear";
    if (t === HOLD) return "hold";
    return "bezier";
}
function r3(t) { return Math.round(t * 1000) / 1000; }

var inSide = HOLD_SIDES === "both" ? HOLD : prop.keyInInterpolationType(i);
prop.setInterpolationTypeAtKey(i, inSide, HOLD);

if (prop.keyOutInterpolationType(i) !== HOLD || prop.keyInInterpolationType(i) !== inSide) {
    throw new Error("After Effects didn't set the hold on " + displayPath(prop) + ". Use Edit > Undo and tell the mentor.");
}

return {
    layer: layer.name,
    property: prop.name,
    display_path: displayPath(prop),
    from_time: r3(prop.keyTime(i)),
    to_time: r3(prop.keyTime(i + 1)),
    in_type: typeName(prop.keyInInterpolationType(i)),
    out_type: typeName(prop.keyOutInterpolationType(i))
};
