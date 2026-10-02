// FR-006, the one demonstration: Easy Ease (speed 0, influence 33.33%) on key i out and key i+1 in,
// keeping each key's other side as it was. ES3 function body with mentor/jsx/lib/*.jsx prepended.
// ARGS = { comp_id, layer_index, property_path, key_index }. Runs inside one undo group.

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

var BEZ = KeyframeInterpolationType.BEZIER;

// One KeyframeEase per temporal dimension; Scale reports 3 even on a 2D layer, so always ask AE.
function easy() {
    var n = prop.keyInTemporalEase(1).length;
    var a = [];
    for (var d = 0; d < n; d++) a.push(new KeyframeEase(0, 33.33));
    return a;
}

// Interpolation first: switching Linear to Bezier resets the ease, so the ease goes on after.
prop.setInterpolationTypeAtKey(i, prop.keyInInterpolationType(i), BEZ);
prop.setTemporalEaseAtKey(i, prop.keyInTemporalEase(i), easy());
prop.setInterpolationTypeAtKey(i + 1, BEZ, prop.keyOutInterpolationType(i + 1));
prop.setTemporalEaseAtKey(i + 1, easy(), prop.keyOutTemporalEase(i + 1));

function r3(t) { return Math.round(t * 1000) / 1000; }
function influences(list) {
    var out = [];
    for (var d = 0; d < list.length; d++) out.push(r3(list[d].influence));
    return out;
}

if (prop.keyOutInterpolationType(i) !== BEZ || prop.keyInInterpolationType(i + 1) !== BEZ) {
    throw new Error("After Effects didn't apply the ease to " + displayPath(prop) + ". Use Edit > Undo and tell the mentor.");
}

return {
    layer: layer.name,
    display_name: prop.name,
    display_path: displayPath(prop),
    from_time: r3(prop.keyTime(i)),
    to_time: r3(prop.keyTime(i + 1)),
    dimensions: prop.keyInTemporalEase(1).length,
    out_influence: influences(prop.keyOutTemporalEase(i)),
    in_influence: influences(prop.keyInTemporalEase(i + 1))
};
