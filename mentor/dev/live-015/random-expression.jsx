// Spec 015 T002 (Edge Case E18): does an expression with a random element and no seed give a different
// value when read twice at the same time? Dev chore, run by the skill-builder through the upstream
// bridge's ae_run_script (paste this file as the script body), never by the mentor. ES3 function
// body; no ARGS needed.
//
// Run it twice. The first run plants two nulls on the duplicate "Comp 1 015 live" (made by
// error-expression.jsx, or here if missing): "Probe Random" with `value + [random(10), 0]` on Position
// and "Probe Wiggle" with `wiggle(5, 20)`. Every run (the first included) reads each Position after the
// expression twice at one time (READ_AT) and once at the playhead, and returns them; compare the two
// runs' values by hand. Never touches Comp 1 or its precomps; opens no dialog. Deleting the duplicate
// afterwards is the cockpit's (the AE script guard blocks deletes for subagents).

var SOURCE_ID = 1;              // Comp 1
var DUP_NAME = "Comp 1 015 live";
var READ_AT = 1;
var PLANTS = [
    { name: "Probe Random", base: [300, 300], expr: "value + [random(10), 0]" },
    { name: "Probe Wiggle", base: [600, 300], expr: "wiggle(5, 20)" }
];

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
function full(v) {
    // Full precision, so a difference in the last digits still shows.
    if (v && v.length !== undefined) { var o = []; for (var i = 0; i < v.length; i++) o.push(v[i]); return o; }
    return v;
}

var comp = dupComp();
if (comp.id === SOURCE_ID) throw new Error("Refusing to plant on Comp 1.");

var planted = [];
var out = [];
for (var i = 0; i < PLANTS.length; i++) {
    var spec = PLANTS[i];
    var layer = null;
    try { layer = comp.layer(spec.name); } catch (e) {}
    if (!layer) {
        layer = comp.layers.addNull();
        layer.name = spec.name;
        var p0 = layer.property("ADBE Transform Group").property("ADBE Position");
        p0.setValue(spec.base);
        p0.expression = spec.expr;
        planted.push(spec.name);
    }
    var pos = layer.property("ADBE Transform Group").property("ADBE Position");
    out.push({
        layer: spec.name,
        expression: pos.expression,
        enabled: pos.expressionEnabled,
        error: pos.expressionError,
        base: full(pos.valueAtTime(READ_AT, true)),
        read_1: full(pos.valueAtTime(READ_AT, false)),
        read_2: full(pos.valueAtTime(READ_AT, false)),
        at_playhead: { time: comp.time, value: full(pos.value) }
    });
}

// With ARGS = { renumber: true } (a third run, after the two plain ones): move Probe Random to the top,
// read both again at READ_AT, then put it back. Answers whether a layer's index feeds the result
// (adding a null renumbers every layer below it).
var renumber = null;
if (typeof ARGS !== "undefined" && ARGS && ARGS.renumber) {
    var R = comp.layer("Probe Random"), W = comp.layer("Probe Wiggle");
    var rd = function (L) { return full(L.property("ADBE Transform Group").property("ADBE Position").valueAtTime(READ_AT, false)); };
    var snap = function () { return { random_index: R.index, wiggle_index: W.index, random: rd(R), wiggle: rd(W) }; };
    renumber = { before: snap() };
    R.moveToBeginning();
    renumber.after_reorder = snap();
    R.moveAfter(W);
    renumber.moved_back = snap();
}

return { ae: app.version, comp: { id: comp.id, name: comp.name }, read_at: READ_AT, planted_now: planted, reads: out, renumber: renumber };
