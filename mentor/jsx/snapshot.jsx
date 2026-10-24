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

// Numbers and number arrays only (Position, Scale, Opacity, effect sliders). Shape paths, text
// documents and the like come back null: they're big, and the diff only needs motion values.
function keyValue(p, k) {
    var v;
    try { v = p.keyValue(k); } catch (e) { return null; }
    if (typeof v === "number") return r3(v);
    if (v instanceof Array) {
        var out = [];
        for (var i = 0; i < v.length; i++) {
            if (typeof v[i] !== "number") return null;
            out.push(r3(v[i]));
        }
        return out;
    }
    return null;
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
            value: keyValue(p, k),
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

// ---- Reads R1 and R3 (spec 004 wave B, research R16, R17; data-model › Wave B shapes): one
// layer_info entry per layer, keyed or not, in a second loop so the one above stays as it was.
// Every read is its own try, so one that fails is null and the snapshot still returns. Never read:
// a layer source's name or file (FR-011), expression text (read R2), what's inside a precomp (R4).

function rd(f) { try { var v = f(); return v === undefined ? null : v; } catch (e) { return null; } }
function r3n(v) { return typeof v === "number" ? r3(v) : null; }
function r3list(v) {
    if (typeof v === "number") return r3(v);
    if (Object.prototype.toString.call(v) !== "[object Array]") return null;
    var out = [];
    for (var i = 0; i < v.length; i++) {
        if (typeof v[i] !== "number") return null;
        out.push(r3(v[i]));
    }
    return out;
}

var compTime = rd(function () { return r3(comp.time); });
var hideShy = rd(function () { return !!comp.hideShyLayers; });

function tprop(layer, matchName) {
    return layer.property("ADBE Transform Group").property(matchName);
}
function valueAt(layer, matchName, t) {
    return rd(function () { return r3list(tprop(layer, matchName).valueAtTime(t, false)); });
}
// Position is read from X, Y (and Z) when its dimensions are separated.
function positionAt(layer, t) {
    return rd(function () {
        var p = tprop(layer, "ADBE Position");
        if (!p.dimensionsSeparated) return r3list(p.valueAtTime(t, false));
        var out = [];
        for (var d = 0; d < 3; d++) {
            var dim = tprop(layer, "ADBE Position_" + d);
            if (!dim) { if (d < 2) return null; break; }
            var v = dim.valueAtTime(t, false);
            if (typeof v !== "number") return null;
            out.push(r3(v));
        }
        return out;
    });
}
function rectAt(layer, t, extents) {
    return rd(function () {
        var r = layer.sourceRectAtTime(t, extents);
        return { left: r3(r.left), top: r3(r.top), width: r3(r.width), height: r3(r.height) };
    });
}

// Every key time on the layer's own keyed properties (the same properties walk() reads).
function keyTimes(group, out) {
    for (var i = 1; i <= group.numProperties; i++) {
        var p;
        try { p = group.property(i); } catch (e) { continue; }
        if (p === null || p.matchName === "ADBE Marker") continue;
        try {
            if (p.propertyType === PropertyType.PROPERTY) {
                if (p.canVaryOverTime && p.numKeys > 0 && inUse(p)) {
                    for (var k = 1; k <= p.numKeys; k++) out.push(r3(p.keyTime(k)));
                }
            } else {
                keyTimes(p, out);
            }
        } catch (e) {}
    }
}

function matteOf(layer) {
    return rd(function () {
        var type = layer.trackMatteType;
        if (type === TrackMatteType.NO_TRACK_MATTE) return null;
        var m = layer.trackMatteLayer;
        // Before AE 23 there's no trackMatteLayer: the matte is always the layer above (curriculum
        // B8; which names work at 26.5 is checked live in tasks-wave-b T133).
        if (m === undefined && layer.hasTrackMatte && layer.index > 1) m = layer.containingComp.layer(layer.index - 1);
        if (!m) return null;
        var name = "alpha";
        if (type === TrackMatteType.ALPHA_INVERTED) name = "alpha_inverted";
        else if (type === TrackMatteType.LUMA) name = "luma";
        else if (type === TrackMatteType.LUMA_INVERTED) name = "luma_inverted";
        return { layer: m.index, type: name };
    });
}

// The caller's stored times (takeSnapshot({ sample_times })), numbers only.
var callerTimes = [];
if (typeof ARGS !== "undefined" && ARGS && Object.prototype.toString.call(ARGS.sample_times) === "[object Array]") {
    for (var ci = 0; ci < ARGS.sample_times.length; ci++) {
        var ct = ARGS.sample_times[ci];
        if (typeof ct === "number" && isFinite(ct)) callerTimes.push(r3(ct));
    }
}
var MAX_SAMPLES = 64;

var parentOf = {};
var ownTimes = {};
for (var pi = 1; pi <= comp.numLayers; pi++) {
    var pl = comp.layer(pi);
    parentOf[pi] = rd(function () { return pl.parent ? pl.parent.index : null; });
    var kt = [];
    try { keyTimes(pl, kt); } catch (e) {}
    ownTimes[pi] = kt;
}
// A parent is sampled wherever a child (or grandchild) is: each layer's key times go up its chain.
var chainTimes = {};
for (var qi = 1; qi <= comp.numLayers; qi++) chainTimes[qi] = ownTimes[qi].slice(0);
for (var ui = 1; ui <= comp.numLayers; ui++) {
    var up = parentOf[ui];
    var guard = 0;
    while (up !== null && up !== undefined && chainTimes[up] && guard++ < comp.numLayers) {
        chainTimes[up] = chainTimes[up].concat(ownTimes[ui]);
        up = parentOf[up];
    }
}

// comp.time and the caller's times first, so a cap never drops them; then the rest, earliest first.
function sampleTimes(index) {
    var seen = {};
    var first = [];
    var rest = [];
    function add(list, t) { var k = String(t); if (!seen[k]) { seen[k] = true; list.push(t); } }
    if (compTime !== null) add(first, compTime);
    for (var a = 0; a < callerTimes.length; a++) add(first, callerTimes[a]);
    var own = chainTimes[index].slice(0).sort(function (x, y) { return x - y; });
    for (var b = 0; b < own.length; b++) add(rest, own[b]);
    var all = first.concat(rest);
    var truncated = all.length > MAX_SAMPLES;
    if (truncated) all = all.slice(0, MAX_SAMPLES);
    all.sort(function (x, y) { return x - y; });
    return { times: all, truncated: truncated };
}

var layerInfo = [];
for (var ii = 1; ii <= comp.numLayers; ii++) {
    var L = comp.layer(ii);
    var kind = rd(function () { return layerKind(L); });
    var textOrShape = kind === "text" || kind === "shape";
    var st = sampleTimes(ii);
    var samples = [];
    for (var si = 0; si < st.times.length; si++) {
        var t = st.times[si];
        samples.push({
            time: t,
            anchor: valueAt(L, "ADBE Anchor Point", t),
            position: positionAt(L, t),
            scale: valueAt(L, "ADBE Scale", t),
            rotation: valueAt(L, "ADBE Rotate Z", t),
            rect: rectAt(L, t, false),
            rect_extents: textOrShape ? rectAt(L, t, true) : null
        });
    }
    var now = compTime !== null ? compTime : 0;
    layerInfo.push({
        index: rd(function () { return L.index; }),
        name: rd(function () { return L.name; }),
        kind: kind,
        enabled: rd(function () { return !!L.enabled; }),
        is_null: rd(function () { return !!L.nullLayer; }),
        adjustment: rd(function () { return !!L.adjustmentLayer; }),
        has_video: rd(function () { return !!L.hasVideo; }),
        three_d: rd(function () { return !!L.threeDLayer; }),
        collapse: rd(function () { return L.collapseTransformation === true; }),
        auto_orient: rd(function () { return L.autoOrient !== AutoOrientType.NO_AUTO_ORIENT; }),
        parent: parentOf[ii],
        shy: rd(function () { return !!L.shy; }),
        solo: rd(function () { return !!L.solo; }),
        guide: rd(function () { return !!L.guideLayer; }),
        locked: rd(function () { return !!L.locked; }),
        in_point: rd(function () { return r3(L.inPoint); }),
        out_point: rd(function () { return r3(L.outPoint); }),
        start_time: rd(function () { return r3(L.startTime); }),
        stretch: rd(function () { return r3(L.stretch); }),
        time_remap: rd(function () { return !!L.timeRemapEnabled; }),
        matte: matteOf(L),
        is_matte: rd(function () { return !!L.isTrackMatte; }),
        motion_blur: rd(function () { return !!L.motionBlur; }),
        effect_count: rd(function () { return L.property("ADBE Effect Parade").numProperties; }),
        transform: {
            anchor: valueAt(L, "ADBE Anchor Point", now),
            position: positionAt(L, now),
            scale: valueAt(L, "ADBE Scale", now),
            rotation: valueAt(L, "ADBE Rotate Z", now),
            opacity: valueAt(L, "ADBE Opacity", now)
        },
        samples: samples,
        samples_truncated: st.truncated
    });
}

// R0 (spec 004 research R10): the AE version and OS. mentor/lib/host.mjs keeps only the version
// and OS name from these, never anything else in the strings (FR-011).
var aeVersion = null;
var osName = null;
try { aeVersion = app.version; } catch (e) {}
try { osName = $.os; } catch (e) {}

return {
    // File name only: the folder path can contain a real name (Principle IV).
    project: app.project.file ? app.project.file.displayName : "Untitled Project",
    comp: { id: comp.id, name: comp.name, duration: r3(comp.duration), frame_rate: r3(comp.frameRate), time: compTime, hide_shy: hideShy },
    precomp_layers: precomps,
    layers: layers,
    layer_info: layerInfo,
    host: { ae_version: aeVersion, os: osName }
};
