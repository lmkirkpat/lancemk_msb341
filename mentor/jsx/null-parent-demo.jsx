// Spec 012 FR-017, the one demonstration for skill 6: parent one layer to the lesson's null, and
// nothing else. ES3 function body with mentor/jsx/lib/*.jsx prepended; run with undo, so it's one
// Edit > Undo. ARGS = { comp_id, layer_index, layer_name, null_index, null_name }.
//
// Setting layer.parent in a script keeps the layer where it is on screen, as the pick whip in the
// Parent column does (live check L-3 confirms it at 26.5; the tool measures the result on a second
// read and never retries). Both layers are matched by index and name, so a renumbered or renamed
// layer is refused, never guessed. Every refusal comes before any write: NULL_PARENT_REFUSED with
// the reason (not_found, null_fails_n1, null_fails_n2, locked, already_parented, three_d).

var comp = app.project.activeItem;
if (!(comp && comp instanceof CompItem)) throw new Error("NO_ACTIVE_COMP: Open the lesson's composition first.");
if (comp.id !== ARGS.comp_id) {
    throw new Error("NO_ACTIVE_COMP: The active comp isn't the lesson's comp. Switch back to it, then ask for the demonstration again.");
}

function refuse(reason) { throw new Error("NULL_PARENT_REFUSED: " + reason); }

function layerAt(index, name) {
    if (typeof index !== "number" || index < 1 || index > comp.numLayers) return null;
    var l = comp.layer(index);
    return l.name === name ? l : null;
}

function nameCount(name) {
    var n = 0;
    for (var i = 1; i <= comp.numLayers; i++) if (comp.layer(i).name === name) n++;
    return n;
}

var layer = layerAt(ARGS.layer_index, ARGS.layer_name);
var nul = layerAt(ARGS.null_index, ARGS.null_name);
if (layer === null || nul === null) refuse("not_found");
if (nameCount(ARGS.layer_name) !== 1 || nameCount(ARGS.null_name) !== 1) refuse("not_found");
if (!nul.nullLayer) refuse("null_fails_n1");
if (nul.threeDLayer) refuse("null_fails_n2");
if (layer.locked) refuse("locked");
if (layer.parent !== null) refuse("already_parented");
if (layer.threeDLayer) refuse("three_d");

layer.parent = nul;

return {
    layer: layer.name,
    "null": nul.name,
    parent: layer.parent ? layer.parent.name : null
};
