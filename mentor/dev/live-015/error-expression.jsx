// Spec 015 T001 (Edge Case E4): does AE keep an erroring expression on, and what value does it give?
// Dev chore, run by the skill-builder through the upstream bridge's ae_run_script (paste this file as
// the script body), never by the mentor. ES3 function body; no ARGS needed.
//
// Plants on a duplicate of Comp 1 only ("Comp 1 015 live", made here if missing; the same duplicate
// T002 and T003 use). It adds one null, "Probe Error", with an expression that refers to a layer name
// that doesn't exist on Position (a transform property) and on a Slider Control's Slider (an effect
// property), then reads expressionEnabled, expressionError, valueAtTime(t, true) (before the
// expression) and valueAtTime(t, false) (after it) at two times. expressionEnabled and
// expressionError are read before and after the value reads, since AE may only evaluate (and turn the
// expression off) when a value is asked for. Never touches Comp 1 or its precomps; opens no dialog.
// Deleting the duplicate afterwards is the cockpit's (the AE script guard blocks deletes for subagents).

var SOURCE_ID = 1;              // Comp 1
var DUP_NAME = "Comp 1 015 live";
var PROBE = "Probe Error";
var BAD_POS = "thisComp.layer(\"No Such Layer 015\").transform.position";
var BAD_SLIDER = "thisComp.layer(\"No Such Layer 015\").transform.opacity";
var TIMES = [0.6, 2];

function findComp(name) {
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof CompItem && it.name === name) return it;
    }
    return null;
}
function dupComp() {
    var c = findComp(DUP_NAME);
    if (c !== null) return c;
    var src = app.project.itemByID(SOURCE_ID);
    if (!(src instanceof CompItem) || src.name !== "Comp 1") throw new Error("Comp 1 (id 1) not found.");
    c = src.duplicate();
    c.name = DUP_NAME;
    return c;
}
function r3(v) {
    if (typeof v === "number") return Math.round(v * 1000) / 1000;
    if (v && v.length !== undefined) { var o = []; for (var i = 0; i < v.length; i++) o.push(r3(v[i])); return o; }
    return v;
}
function safe(f) { try { return f(); } catch (e) { return "THREW: " + e.toString(); } }
function state(p) {
    return {
        expression_enabled: safe(function () { return p.expressionEnabled; }),
        expression_error: safe(function () { return p.expressionError; }),
        can_set_expression: safe(function () { return p.canSetExpression; })
    };
}
function readProp(p) {
    var out = { before_value_reads: state(p), set_value: safe(function () { return r3(p.value); }), at: [] };
    for (var i = 0; i < TIMES.length; i++) {
        var t = TIMES[i];
        out.at.push({
            time: t,
            pre_expression: safe(function () { return r3(p.valueAtTime(t, true)); }),
            post_expression: safe(function () { return r3(p.valueAtTime(t, false)); })
        });
    }
    out.after_value_reads = state(p);
    return out;
}

var comp = dupComp();
if (comp.id === SOURCE_ID) throw new Error("Refusing to plant on Comp 1.");
var old = null;
try { old = comp.layer(PROBE); } catch (e) {}
if (old) throw new Error("\"" + PROBE + "\" is already in " + DUP_NAME + ": delete the duplicate and run again.");

var probe = comp.layers.addNull();
probe.name = PROBE;
var pos = probe.property("ADBE Transform Group").property("ADBE Position");
pos.setValue([100, 200]);
var fx = probe.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
fx.name = "Probe Slider";
var slider = fx.property(1);
slider.setValue(42);

var setPos = safe(function () { pos.expression = BAD_POS; return "ok"; });
var setSlider = safe(function () { slider.expression = BAD_SLIDER; return "ok"; });

return {
    ae: app.version,
    comp: { id: comp.id, name: comp.name, fps: comp.frameRate },
    probe: PROBE,
    position: { set_expression: setPos, base: [100, 200], read: readProp(pos) },
    slider: { set_expression: setSlider, base: 42, read: readProp(slider) },
    comp1_untouched_check: { id: SOURCE_ID, layers: app.project.itemByID(SOURCE_ID).numLayers }
};
