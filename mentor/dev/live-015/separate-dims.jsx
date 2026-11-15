// Spec 015 T003 (Edge Case E7): with separated dimensions, which property's expression is active?
// Dev chore, run by the skill-builder through the upstream bridge's ae_run_script (paste this file as
// the script body), never by the mentor. ES3 function body; no ARGS needed.
//
// Plants two nulls on the duplicate "Comp 1 015 live" (made by error-expression.jsx, or here if
// missing):
//   A. "Probe Sep A": an expression on Position (`value + [100, 50]`), then Separate Dimensions.
//   B. "Probe Sep B": Separate Dimensions, expressions on X Position (`value + 30`) and Y Position
//      (`value + 20`), then join them again.
//   C. Each toggled back (A joined, B separated), to see whether a dropped expression comes back.
//   D. With B separated, try to set an expression on the hidden Position.
// In each state it reads, for Position, X Position and Y Position: expression, expressionEnabled,
// expressionError, the value before and after the expression at READ_AT, and dimensionsSeparated.
// What renders comes from a Point Control on the probe whose expression is `toComp(anchorPoint)`
// (a null's anchor is [0, 0], so this is where AE draws the layer); its value is read too. Never
// touches Comp 1 or its precomps; opens no dialog. Deleting the duplicate afterwards is the cockpit's
// (the AE script guard blocks deletes for subagents).

var SOURCE_ID = 1;              // Comp 1
var DUP_NAME = "Comp 1 015 live";
var READ_AT = 1;
var TR = "ADBE Transform Group";

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
function readOne(p) {
    return {
        expression: safe(function () { return p.expression; }),
        enabled: safe(function () { return p.expressionEnabled; }),
        error: safe(function () { return p.expressionError; }),
        base: safe(function () { return r3(p.valueAtTime(READ_AT, true)); }),
        after: safe(function () { return r3(p.valueAtTime(READ_AT, false)); })
    };
}
function readState(layer) {
    var tr = layer.property(TR);
    var pos = tr.property("ADBE Position");
    return {
        separated: safe(function () { return pos.dimensionsSeparated; }),
        position: readOne(pos),
        x: readOne(tr.property("ADBE Position_0")),
        y: readOne(tr.property("ADBE Position_1")),
        renders_at: safe(function () {
            return r3(layer.property("ADBE Effect Parade").property("Where").property(1).valueAtTime(READ_AT, false));
        })
    };
}
function newProbe(comp, name, base) {
    var old = null;
    try { old = comp.layer(name); } catch (e) {}
    if (old) throw new Error("\"" + name + "\" is already in " + DUP_NAME + ": delete the duplicate and run again.");
    var layer = comp.layers.addNull();
    layer.name = name;
    layer.property(TR).property("ADBE Position").setValue(base);
    var where = layer.property("ADBE Effect Parade").addProperty("ADBE Point Control");
    where.name = "Where";
    where.property(1).expression = "toComp(anchorPoint)";
    return layer;
}

var comp = dupComp();
if (comp.id === SOURCE_ID) throw new Error("Refusing to plant on Comp 1.");

// A: expression on Position, then separate.
var A = newProbe(comp, "Probe Sep A", [400, 700]);
var aPos = A.property(TR).property("ADBE Position");
aPos.expression = "value + [100, 50]";
var a1 = readState(A);
aPos.dimensionsSeparated = true;
var a2 = readState(A);

// B: separate, expressions on X and Y, then join.
var B = newProbe(comp, "Probe Sep B", [800, 700]);
var bPos = B.property(TR).property("ADBE Position");
bPos.dimensionsSeparated = true;
B.property(TR).property("ADBE Position_0").expression = "value + 30";
B.property(TR).property("ADBE Position_1").expression = "value + 20";
var b1 = readState(B);
bPos.dimensionsSeparated = false;
var b2 = readState(B);

// C: toggle each back, to see whether the dropped expression was only hidden or is gone.
aPos.dimensionsSeparated = false;
var a3 = readState(A);
bPos.dimensionsSeparated = true;
var b3 = readState(B);

// D: B is separated now. Can a script put an expression on the hidden Position at all?
var dSet = { can_set_expression: safe(function () { return bPos.canSetExpression; }) };
dSet.set = safe(function () { bPos.expression = "value + [5, 5]"; return "ok"; });
dSet.state = readState(B);

return {
    ae: app.version,
    comp: { id: comp.id, name: comp.name },
    read_at: READ_AT,
    a_position_expression_then_separate: { joined: a1, separated: a2, joined_again: a3 },
    b_xy_expressions_then_join: { separated: b1, joined: b2, separated_again: b3 },
    d_position_expression_while_separated: dSet
};
