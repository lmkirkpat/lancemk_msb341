// Property paths (ES3). The only place paths are built, so snapshots, the answer key and set_ease
// always agree (specs/002-easing-slice/data-model.md > AnimatedProperty).
//
// path:         match names joined by "/", e.g. "ADBE Transform Group/ADBE Position". Children of
//               indexed groups (shape contents, the Effects list) get "#<index>", e.g.
//               "ADBE Root Vectors Group/ADBE Vector Group#1/...", because two rectangles or two
//               blurs share a match name. Stable across renames and AE's UI language.
// display_path: display names joined by " > " (U+203A), for people only. Never used for matching.

function __isIndexedChild(prop) {
    var parent = prop.parentProperty;
    return parent !== null && parent.propertyType === PropertyType.INDEXED_GROUP;
}

function __chain(prop) {
    var chain = [];
    var p = prop;
    while (p !== null && p.propertyDepth > 0) {
        chain.unshift(p);
        p = p.parentProperty;
    }
    return chain;
}

function propPath(prop) {
    var chain = __chain(prop);
    var parts = [];
    for (var i = 0; i < chain.length; i++) {
        var part = chain[i].matchName;
        if (__isIndexedChild(chain[i])) part += "#" + chain[i].propertyIndex;
        parts.push(part);
    }
    return parts.join("/");
}

function displayPath(prop) {
    var chain = __chain(prop);
    var parts = [];
    for (var i = 0; i < chain.length; i++) parts.push(chain[i].name);
    return parts.join(" " + String.fromCharCode(0x203A) + " ");
}

// Reverse of propPath. Throws if any step is missing or an indexed child has a different match name.
function propByPath(layer, path) {
    var parts = path.split("/");
    var cur = layer;
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        var hash = part.lastIndexOf("#");
        var next;
        if (hash > 0) {
            var name = part.substring(0, hash);
            var index = parseInt(part.substring(hash + 1), 10);
            next = (index >= 1 && index <= cur.numProperties) ? cur.property(index) : null;
            if (next !== null && next.matchName !== name) next = null;
        } else {
            next = cur.property(part);
        }
        if (next === null || next === undefined) {
            throw new Error("Property path not found on layer \"" + layer.name + "\": " + path + " (stopped at " + part + ")");
        }
        cur = next;
    }
    return cur;
}
