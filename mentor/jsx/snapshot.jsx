// FR-001: read every animated property in the active comp (data-model.md › Snapshot). ES3
// function body, run by mentor/bridge-client.mjs with mentor/jsx/lib/*.jsx prepended. Read only.
// taken_at is added in Node (ES3 has no toISOString).

var comp = app.project.activeItem;
if (!(comp && comp instanceof CompItem)) throw new Error("NO_ACTIVE_COMP: Open a composition first.");

function r3(t) { return Math.round(t * 1000) / 1000; }

function typeName(t) {
    if (t === KeyframeInterpolationType.LINEAR) return "linear";
    if (t === KeyframeInterpolationType.HOLD) return "hold";
    return "bezier";
}

function eases(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) out.push({ speed: r3(list[i].speed), influence: r3(list[i].influence) });
    return out;
}

function layerKind(layer) {
    if (layer.nullLayer) return "null";
    if (layer instanceof TextLayer) return "text";
    if (layer instanceof ShapeLayer) return "shape";
    if (layer instanceof CameraLayer) return "camera";
    if (layer instanceof LightLayer) return "light";
    if (layer.adjustmentLayer) return "adjustment";
    if (layer.source instanceof CompItem) return "precomp";
    if (layer.source && layer.source.mainSource instanceof SolidSource) return "solid";
    return "footage";
}

// With separated dimensions the keys live on X/Y Position, not Position, and vice versa. Read only
// the side that's in use, so a property is never counted twice.
function inUse(p) {
    try {
        if (p.isSeparationFollower && !p.separationLeader.dimensionsSeparated) return false;
        if (p.isSeparationLeader && p.dimensionsSeparated) return false;
    } catch (e) {}
    return true;
}

function readProp(p) {
    var keys = [];
    for (var k = 1; k <= p.numKeys; k++) {
        var inEase = [], outEase = [];
        try { inEase = eases(p.keyInTemporalEase(k)); outEase = eases(p.keyOutTemporalEase(k)); } catch (e) {}
        keys.push({
            index: k,
            time: r3(p.keyTime(k)),
            in_type: typeName(p.keyInInterpolationType(k)),
            out_type: typeName(p.keyOutInterpolationType(k)),
            in_ease: inEase,
            out_ease: outEase
        });
    }
    var dims = 1;
    try { dims = p.keyInTemporalEase(1).length; } catch (e) {}
    return {
        path: propPath(p),
        display_path: displayPath(p),
        match_name: p.matchName,
        display_name: p.name,
        dimensions: dims,
        expression_enabled: !!(p.canSetExpression && p.expressionEnabled),
        keys: keys
    };
}

// Every property group, recursively: transform, masks, shape contents, effects, text animators.
// Markers have keys too, but they aren't motion.
function walk(group, out) {
    for (var i = 1; i <= group.numProperties; i++) {
        var p;
        try { p = group.property(i); } catch (e) { continue; }
        if (p === null || p.matchName === "ADBE Marker") continue;
        if (p.propertyType === PropertyType.PROPERTY) {
            if (p.canVaryOverTime && p.numKeys > 0 && inUse(p)) out.push(readProp(p));
        } else {
            walk(p, out);
        }
    }
}

var layers = [];
var precomps = [];
for (var li = 1; li <= comp.numLayers; li++) {
    var layer = comp.layer(li);
    // A precomp layer's own transform is read; what's inside it isn't, in this slice (R8).
    if (layer.source instanceof CompItem) precomps.push({ index: layer.index, name: layer.name });
    var props = [];
    walk(layer, props);
    if (props.length === 0) continue;
    layers.push({
        index: layer.index,
        name: layer.name,
        kind: layerKind(layer),
        enabled: layer.enabled,
        is_null: layer.nullLayer,
        properties: props
    });
}

return {
    // File name only: the folder path can contain a real name (Principle IV).
    project: app.project.file ? app.project.file.displayName : "Untitled Project",
    comp: { id: comp.id, name: comp.name, duration: r3(comp.duration), frame_rate: r3(comp.frameRate) },
    precomp_layers: precomps,
    layers: layers
};
