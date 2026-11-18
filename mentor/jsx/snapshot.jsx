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
// a layer source's name or file (FR-011), what's inside a precomp (R4). Expression text is read R2,
// below (spec 015), and goes to the model only.

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

// Times stay exact for reading (a key on frame 1 at 30 fps is 1/30 s, and 0.033 s would read just
// before it); only the stored time fields are rounded to 0.001 s.
var compTimeRaw = rd(function () { return typeof comp.time === "number" ? comp.time : null; });
var compTime = compTimeRaw === null ? null : r3(compTimeRaw);
var fps = rd(function () { return comp.frameRate; });
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
                    for (var k = 1; k <= p.numKeys; k++) out.push(p.keyTime(k));
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

// The caller's stored times (takeSnapshot({ sample_times })), numbers only. A stored time is rounded
// to 0.001 s, so one within 0.0005 s of a frame is read at that frame exactly.
var callerTimes = [];
if (typeof ARGS !== "undefined" && ARGS && Object.prototype.toString.call(ARGS.sample_times) === "[object Array]") {
    for (var ci = 0; ci < ARGS.sample_times.length; ci++) {
        var ct = ARGS.sample_times[ci];
        if (typeof ct !== "number" || !isFinite(ct)) continue;
        if (typeof fps === "number" && fps > 0) {
            var onFrame = Math.round(ct * fps) / fps;
            if (Math.abs(onFrame - ct) <= 0.0005) ct = onFrame;
        }
        callerTimes.push(ct);
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
// Two times that round to the same millisecond are one sample, read at the first one seen.
function sampleTimes(index) {
    var seen = {};
    var first = [];
    var rest = [];
    function add(list, t) { var k = String(r3(t)); if (!seen[k]) { seen[k] = true; list.push(t); } }
    if (compTimeRaw !== null) add(first, compTimeRaw);
    for (var a = 0; a < callerTimes.length; a++) add(first, callerTimes[a]);
    var own = chainTimes[index].slice(0).sort(function (x, y) { return x - y; });
    for (var b = 0; b < own.length; b++) add(rest, own[b]);
    var all = first.concat(rest);
    var truncated = all.length > MAX_SAMPLES;
    if (truncated) all = all.slice(0, MAX_SAMPLES);
    all.sort(function (x, y) { return x - y; });
    return { times: all, truncated: truncated };
}

// One sample: rendered values read at the exact time t, stored with t rounded. Cameras and lights
// have no rectangle; rect_extents is read on text and shape layers only.
function sampleAt(L, t, hasRect, textOrShape) {
    return {
        time: r3(t),
        anchor: valueAt(L, "ADBE Anchor Point", t),
        position: positionAt(L, t),
        scale: valueAt(L, "ADBE Scale", t),
        rotation: valueAt(L, "ADBE Rotate Z", t),
        opacity: valueAt(L, "ADBE Opacity", t),
        rect: hasRect ? rectAt(L, t, false) : null,
        rect_extents: textOrShape ? rectAt(L, t, true) : null
    };
}

// ---- Read R2 (spec 015 research R1, R2; data-model § 1): every property with an expression, keyed
// or not, in any group. Only the side of a separable Position in use is walked (inUse), since the
// hidden half holds stale values that never draw (FR-006a). Each read is its own try. active is on
// and no error: AE 27.0 keeps an erroring expression on and gives its base value (T001).

var EXPR_TEXT_MAX = 20000;
var EXPR_ERROR_MAX = 300;
var expressions = [];
var expressionsRead = "all";
// Per layer index: { anchor|position|scale|rotation|opacity: [properties] } for the active transform
// expressions that samples[].base and the sweeps read.
var activeTransform = {};
var BASE_KEYS = {
    "ADBE Transform Group/ADBE Anchor Point": "anchor",
    "ADBE Transform Group/ADBE Position": "position",
    "ADBE Transform Group/ADBE Position_0": "position",
    "ADBE Transform Group/ADBE Position_1": "position",
    "ADBE Transform Group/ADBE Position_2": "position",
    "ADBE Transform Group/ADBE Scale": "scale",
    "ADBE Transform Group/ADBE Rotate Z": "rotation",
    "ADBE Transform Group/ADBE Opacity": "opacity"
};

function exprGroup(path) {
    var root = path.split("/")[0];
    if (root === "ADBE Transform Group") return "transform";
    if (root === "ADBE Effect Parade") return "effect";
    if (root === "ADBE Text Properties") return "text";
    if (root === "ADBE Mask Parade") return "mask";
    if (root === "ADBE Root Vectors Group") return "shape";
    return "other";
}

// Review S3 (FR-018): every property or field the walk couldn't read is counted, and a read with any
// skipped says so in expressions_read instead of "all".
var exprSkipped = 0;

function readExpression(layerIndex, p) {
    var text = String(p.expression);
    var err = "";
    try { err = p.expressionError ? String(p.expressionError) : ""; } catch (e) { exprSkipped++; }
    var enabled = false;
    try { enabled = !!p.expressionEnabled; } catch (e) { exprSkipped++; }
    var keys = 0;
    try { keys = p.numKeys; } catch (e) { exprSkipped++; }
    var path = propPath(p);
    return {
        layer: layerIndex,
        path: path,
        display_path: rd(function () { return displayPath(p); }),
        group: exprGroup(path),
        keys: keys,
        enabled: enabled,
        active: enabled && err === "",
        error: err === "" ? null : err.substring(0, EXPR_ERROR_MAX),
        text: text.length > EXPR_TEXT_MAX ? text.substring(0, EXPR_TEXT_MAX) : text,
        text_length: text.length,
        text_cut: text.length > EXPR_TEXT_MAX,
        _prop: p
    };
}

function walkExpressions(layerIndex, group, out) {
    for (var i = 1; i <= group.numProperties; i++) {
        var p;
        try { p = group.property(i); } catch (e) { exprSkipped++; continue; }
        if (p === null || p === undefined || p.matchName === "ADBE Marker") continue;
        try {
            if (p.propertyType === PropertyType.PROPERTY) {
                if (p.canSetExpression && typeof p.expression === "string" && p.expression !== "" && inUse(p)) out.push(readExpression(layerIndex, p));
            } else {
                walkExpressions(layerIndex, p, out);
            }
        } catch (e) { exprSkipped++; }
    }
}

try {
    for (var ei = 1; ei <= comp.numLayers; ei++) {
        var EL = comp.layer(ei);
        walkExpressions(ei, EL, expressions);
    }
} catch (e) {
    expressions = [];
    expressionsRead = { status: "not_read", reason: "error" };
}
if (expressionsRead === "all" && exprSkipped > 0) expressionsRead = { status: "not_read", reason: "partial", skipped: exprSkipped };
for (var ai = 0; ai < expressions.length; ai++) {
    var ax = expressions[ai];
    var bk = BASE_KEYS[ax.path];
    if (!bk || !ax.active) continue;
    if (!activeTransform[ax.layer]) activeTransform[ax.layer] = {};
    activeTransform[ax.layer][bk] = true;
}

// samples[].base: each active transform expression's property before the expression, at the
// sample's exact time (research R5). A separated Position's base is read from X, Y (and Z).
function baseAt(layer, t) {
    var want = activeTransform[layer.index];
    var out = {};
    if (want.position) {
        out.position = rd(function () {
            var p = tprop(layer, "ADBE Position");
            if (!p.dimensionsSeparated) return r3list(p.valueAtTime(t, true));
            var v = [];
            for (var d = 0; d < 3; d++) {
                var dim = tprop(layer, "ADBE Position_" + d);
                if (!dim) { if (d < 2) return null; break; }
                var x = dim.valueAtTime(t, true);
                if (typeof x !== "number") return null;
                v.push(r3(x));
            }
            return v;
        });
    }
    var others = [["anchor", "ADBE Anchor Point"], ["scale", "ADBE Scale"], ["rotation", "ADBE Rotate Z"], ["opacity", "ADBE Opacity"]];
    for (var oi = 0; oi < others.length; oi++) {
        if (!want[others[oi][0]]) continue;
        out[others[oi][0]] = (function (mn) { return rd(function () { return r3list(tprop(layer, mn).valueAtTime(t, true)); }); })(others[oi][1]);
    }
    return out;
}

var layerInfo = [];
for (var ii = 1; ii <= comp.numLayers; ii++) {
    var L = comp.layer(ii);
    var kind = rd(function () { return layerKind(L); });
    var textOrShape = kind === "text" || kind === "shape";
    var hasRect = kind !== "camera" && kind !== "light";
    var st = sampleTimes(ii);
    var samples = [];
    var nowSample = null;
    for (var si = 0; si < st.times.length; si++) {
        var sm = sampleAt(L, st.times[si], hasRect, textOrShape);
        if (activeTransform[ii]) sm.base = baseAt(L, st.times[si]);
        samples.push(sm);
        if (compTime !== null && sm.time === compTime) nowSample = sm;
    }
    // transform reuses the comp.time sample (it's always kept); only Opacity is read again.
    var now = compTimeRaw !== null ? compTimeRaw : 0;
    if (nowSample === null) nowSample = sampleAt(L, now, hasRect, textOrShape);
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
        auto_orient: rd(function () { return L.autoOrient === undefined ? null : L.autoOrient !== AutoOrientType.NO_AUTO_ORIENT; }),
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
        // Every effect, keyed or not (spec 015 FR-007). Names can be the learner's own, so they go to
        // the model only, never to the record (FR-020).
        effects: rd(function () {
            var fx = L.property("ADBE Effect Parade");
            var list = [];
            for (var fi = 1; fi <= fx.numProperties; fi++) list.push({ name: fx.property(fi).name, match_name: fx.property(fi).matchName });
            return list;
        }),
        mask_count: rd(function () { return L.property("ADBE Mask Parade").numProperties; }),
        transform: {
            anchor: nowSample.anchor,
            position: nowSample.position,
            scale: nowSample.scale,
            rotation: nowSample.rotation,
            opacity: valueAt(L, "ADBE Opacity", now)
        },
        samples: samples,
        samples_truncated: st.truncated
    });
}

// ---- How much each active transform expression moves its property (spec 015 FR-004, research R9):
// a coarse sweep of 24 times over [0, duration) for every one, and a fine sweep for the layers in
// ARGS.measure_layers at max(1 frame, duration / 240). Distance from base: vector length for arrays,
// absolute for numbers. varies: the result changed across the sweep **and** the expression's own
// part of it did, so keys passing through a value expression aren't counted as the expression's
// motion, and a constant expression never varies (E19).

var SWEEP_TOL = 0.01;
var COARSE_SAMPLES = 24;
var FINE_SAMPLES = 240;
var measureLayers = [];
if (typeof ARGS !== "undefined" && ARGS && Object.prototype.toString.call(ARGS.measure_layers) === "[object Array]") {
    for (var mi = 0; mi < ARGS.measure_layers.length; mi++) {
        if (typeof ARGS.measure_layers[mi] === "number") measureLayers.push(ARGS.measure_layers[mi]);
    }
}
function isMeasured(index) {
    for (var i = 0; i < measureLayers.length; i++) if (measureLayers[i] === index) return true;
    return false;
}
function vec(v) {
    if (typeof v === "number") return [v];
    if (Object.prototype.toString.call(v) !== "[object Array]") return null;
    for (var i = 0; i < v.length; i++) if (typeof v[i] !== "number") return null;
    return v;
}
function dist(a, b) {
    var s = 0;
    for (var i = 0; i < Math.min(a.length, b.length); i++) s += (a[i] - b[i]) * (a[i] - b[i]);
    return Math.sqrt(s);
}
function sweep(x, kind, step) {
    var p = x._prop;
    var dur = comp.duration;
    var n = Math.max(1, Math.floor(dur / step - 1e-9) + 1);
    var maxOff = 0, maxAt = 0, maxVal = null, after0 = null, part0 = null, resultMoves = false, partMoves = false;
    var offsets = [];
    for (var i = 0; i < n; i++) {
        var t = i * step;
        var after = vec(p.valueAtTime(t, false));
        var base = vec(p.valueAtTime(t, true));
        if (!after || !base) return { layer: x.layer, path: x.path, kind: kind, status: "not_read", reason: "not_a_number" };
        var part = [];
        for (var d = 0; d < after.length; d++) part.push(after[d] - (d < base.length ? base[d] : 0));
        var off = dist(after, base);
        offsets.push(r3(off));
        if (off > maxOff + 1e-9) { maxOff = off; maxAt = t; maxVal = after; }
        if (after0 === null) { after0 = after; part0 = part; continue; }
        if (dist(after, after0) > SWEEP_TOL) resultMoves = true;
        if (dist(part, part0) > SWEEP_TOL) partMoves = true;
    }
    var out = { layer: x.layer, path: x.path, kind: kind, sampled_every: r3(step), varies: resultMoves && partMoves, max_offset: r3(maxOff), max_at: r3(maxAt) };
    // FR-004a (research R15): a fine sweep also keeps the after-expression value it read at its peak,
    // the peak's direction. Coarse sweeps, the only ones a skill's snapshot runs, are unchanged.
    if (kind === "fine" && maxVal !== null) out.max_value = maxVal.length === 1 ? r3(maxVal[0]) : r3list(maxVal);
    // Spec 014 T037 fix (o): a fine sweep also keeps every sample's distance from base, at i * sampled_every,
    // so Node can say when a parent's shift is last over 1 px on a child's box. offsets_every is the step
    // unrounded (to 1e-6), since sampled_every's 3 places drift by a frame over a long comp.
    if (kind === "fine") { out.offsets = offsets; out.offsets_every = Math.round(step * 1e6) / 1e6; }
    return out;
}

// Review S4: a budget, so an expression-heavy comp never slows every skill's snapshot. Sweeps run for
// the measured layers first, then the rest in order, until SWEEP_MAX_COUNT sweeps or SWEEP_BUDGET_MS
// have gone; every sweep left is marked not_read "budget". Nothing here can fail the snapshot.
var SWEEP_MAX_COUNT = 60;
var SWEEP_BUDGET_MS = 300;
var expressionSweeps = [];
var measuredLayers = [];
try {
    var sweepStart = new Date().getTime();
    var sweepsRun = 0;
    var overBudget = function () { return sweepsRun >= SWEEP_MAX_COUNT || new Date().getTime() - sweepStart > SWEEP_BUDGET_MS; };
    var runSweep = function (wx, kind, step) {
        if (overBudget()) return { layer: wx.layer, path: wx.path, kind: kind, status: "not_read", reason: "budget" };
        sweepsRun++;
        try { return sweep(wx, kind, step); } catch (e) { return { layer: wx.layer, path: wx.path, kind: kind, status: "not_read", reason: "error" }; }
    };
    var frame = typeof fps === "number" && fps > 0 ? 1 / fps : comp.duration / FINE_SAMPLES;
    var swept = [];
    for (var wi = 0; wi < expressions.length; wi++) {
        if (expressions[wi].group === "transform" && expressions[wi].active) swept.push(expressions[wi]);
    }
    var ordered = [];
    for (var oa = 0; oa < swept.length; oa++) if (isMeasured(swept[oa].layer)) ordered.push(swept[oa]);
    for (var ob = 0; ob < swept.length; ob++) if (!isMeasured(swept[ob].layer)) ordered.push(swept[ob]);
    var byKey = {};
    for (var wj = 0; wj < ordered.length; wj++) {
        var wx = ordered[wj];
        var got = [runSweep(wx, "coarse", comp.duration / COARSE_SAMPLES)];
        if (isMeasured(wx.layer)) got.push(runSweep(wx, "fine", Math.max(frame, comp.duration / FINE_SAMPLES)));
        byKey[wx.layer + "|" + wx.path] = got;
    }
    // Back in expression order, as before the budget.
    for (var wk = 0; wk < swept.length; wk++) {
        var list = byKey[swept[wk].layer + "|" + swept[wk].path];
        for (var wl = 0; wl < list.length; wl++) expressionSweeps.push(list[wl]);
    }
} catch (e) {
    expressionSweeps = [];
}
for (var mj = 0; mj < measureLayers.length; mj++) measuredLayers.push(measureLayers[mj]);
// The live property handles stay in the snippet.
for (var xi = 0; xi < expressions.length; xi++) delete expressions[xi]._prop;

// R0 (spec 004 research R10): the AE version and OS. mentor/lib/host.mjs keeps only the version
// and OS name from these, never anything else in the strings (FR-011).
var aeVersion = null;
var osName = null;
try { aeVersion = app.version; } catch (e) {}
try { osName = $.os; } catch (e) {}

return {
    // File name only: the folder path can contain a real name (Principle IV).
    project: app.project.file ? app.project.file.displayName : "Untitled Project",
    comp: { id: comp.id, name: comp.name, duration: r3(comp.duration), frame_rate: r3(comp.frameRate), time: compTime, hide_shy: hideShy, width: comp.width, height: comp.height },
    precomp_layers: precomps,
    layers: layers,
    layer_info: layerInfo,
    expressions: expressions,
    expressions_read: expressionsRead,
    expression_sweeps: expressionSweeps,
    measured_layers: measuredLayers,
    host: { ae_version: aeVersion, os: osName }
};
