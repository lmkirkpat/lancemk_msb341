// Spec 011 FR-015, the one demonstration for skill 5: set one layer's Anchor Point to the place's
// point and its Position to what keeps the layer still at the current time, both values computed
// by the server (mentor/lib/anchor.mjs › demoValues). ES3 function body with mentor/jsx/lib/*.jsx
// prepended; run with undo, so it's one Edit > Undo.
// ARGS = { comp_id, layer_index, layer_name, anchor: [x, y], position: [x, y], rest_time }.
//
// It never keys anything: it refuses any layer whose Anchor Point or Position has keys or an
// expression, so setting a value can't add a key. Every refusal comes before any write:
// ANCHOR_REFUSED with the reason (not_found, locked, three_d, collapsed, anchor_or_position_keyed,
// expression, not_at_rest). Separated Position is written as X and Y; Z is kept. Live check L-4.

var comp = app.project.activeItem;
if (!(comp && comp instanceof CompItem)) throw new Error("NO_ACTIVE_COMP: Open the lesson's composition first.");
if (comp.id !== ARGS.comp_id) {
    throw new Error("NO_ACTIVE_COMP: The active comp isn't the lesson's comp. Switch back to it, then ask for the demonstration again.");
}

function refuse(reason) { throw new Error("ANCHOR_REFUSED: " + reason); }

if (ARGS.layer_index < 1 || ARGS.layer_index > comp.numLayers) refuse("not_found");
var layer = comp.layer(ARGS.layer_index);
if (layer.name !== ARGS.layer_name) refuse("not_found");

function num(v) { return typeof v === "number" && isFinite(v); }
function pt(v) { return v instanceof Array && v.length >= 2 && num(v[0]) && num(v[1]); }
if (!pt(ARGS.anchor) || !pt(ARGS.position)) throw new Error("anchor-demo needs anchor and position as [x, y].");

if (layer.locked) refuse("locked");
if (layer.threeDLayer) refuse("three_d");
if (layer.source instanceof CompItem && layer.collapseTransformation) refuse("collapsed");

var tg = layer.property("ADBE Transform Group");
var anchorProp = tg.property("ADBE Anchor Point");
var posProp = tg.property("ADBE Position");
var separated = false;
try { separated = !!posProp.dimensionsSeparated; } catch (e) {}
var xProp = separated ? tg.property("ADBE Position_0") : null;
var yProp = separated ? tg.property("ADBE Position_1") : null;

function hasExpression(p) { try { return !!(p.canSetExpression && p.expressionEnabled); } catch (e) { return false; } }
var written = separated ? [anchorProp, xProp, yProp] : [anchorProp, posProp];
for (var i = 0; i < written.length; i++) {
    if (written[i].numKeys > 0) refuse("anchor_or_position_keyed");
    if (hasExpression(written[i])) refuse("expression");
}
// The server already checked the playhead against the rest key on its read; the playhead may
// have moved since.
if (num(ARGS.rest_time) && Math.abs(comp.time - ARGS.rest_time) > 0.5 / comp.frameRate + 0.000001) refuse("not_at_rest");

function copy(v) {
    if (!(v instanceof Array)) return v;
    var out = [];
    for (var j = 0; j < v.length; j++) out.push(v[j]);
    return out;
}
function r3(v) { return Math.round(v * 1000) / 1000; }
function two(v) { return [r3(v[0]), r3(v[1])]; }

var anchorBefore = copy(anchorProp.value);
var positionBefore = separated ? [xProp.value, yProp.value] : copy(posProp.value);

// Anchor Point first, then Position: setValue on a property with no keys never adds one.
var newAnchor = copy(anchorBefore);
newAnchor[0] = ARGS.anchor[0];
newAnchor[1] = ARGS.anchor[1];
anchorProp.setValue(newAnchor);
if (separated) {
    xProp.setValue(ARGS.position[0]);
    yProp.setValue(ARGS.position[1]);
} else {
    var newPos = copy(positionBefore);
    newPos[0] = ARGS.position[0];
    newPos[1] = ARGS.position[1];
    posProp.setValue(newPos);
}

var anchorAfter = anchorProp.value;
var positionAfter = separated ? [xProp.value, yProp.value] : posProp.value;
if (anchorProp.numKeys > 0 || (separated ? xProp.numKeys + yProp.numKeys : posProp.numKeys) > 0) {
    throw new Error("After Effects added a key while setting the pivot. Use Edit > Undo and tell the mentor.");
}

return {
    layer: layer.name,
    anchor_before: two(anchorBefore),
    anchor_after: two(anchorAfter),
    position_before: two(positionBefore),
    position_after: two(positionAfter),
    separated: separated
};
