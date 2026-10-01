// Builds the "Mentor Practice" comp from specs/002-easing-slice/research.md > R8 and writes its
// answer key. Dev chore (T012/T013): run once through the upstream bridge's ae_run_script, using
//   node mentor/dev/assemble.mjs build-practice-comp
// ES3 function body. Needs mentor/jsx/lib/*.jsx (propPath, displayPath, toJSON) and
// ARGS = { out: "<absolute path for practice-expected.json>", replace: false }.
//
// The answer key is declared here, next to each property as it's built, not derived by analyzing
// the comp afterwards. That keeps it independent of the analysis code it will be used to test.

var COMP_NAME = "Mentor Practice";
var ICON_COMP_NAME = "Icon Precomp";
var W = 1920, H = 1080, DUR = 8, FPS = 30;
var LIN = KeyframeInterpolationType.LINEAR;
var BEZ = KeyframeInterpolationType.BEZIER;
var HOLD = KeyframeInterpolationType.HOLD;

function findComp(name) {
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof CompItem && it.name === name) return it;
    }
    return null;
}

var existing = findComp(COMP_NAME);
if (existing !== null) {
    if (!ARGS.replace) throw new Error("\"" + COMP_NAME + "\" already exists. Run with {\"replace\": true} to rebuild it.");
    existing.remove();
    var oldIcon = findComp(ICON_COMP_NAME);
    if (oldIcon !== null) oldIcon.remove();
}

var comp = app.project.items.addComp(COMP_NAME, W, H, 1, DUR, FPS);
var expected = [];   // { layer, path, display_path, states[] }, resolved to segment ids at the end
var skipped = [];    // { layer, path, display_path, reason }

function tf(layer, matchName) { return layer.property("ADBE Transform Group").property(matchName); }

// Sets keys and forces one interpolation type on both sides, so user preferences for new keys
// (Edit > Preferences > General > Default Spatial Interpolation, etc.) can't change the result.
function keys(prop, times, values, type) {
    for (var i = 0; i < times.length; i++) prop.setValueAtTime(times[i], values[i]);
    for (var k = 1; k <= prop.numKeys; k++) prop.setInterpolationTypeAtKey(k, type, type);
    return prop;
}

function easeArray(prop, influence) {
    var n = prop.keyInTemporalEase(1).length;
    var a = [];
    for (var i = 0; i < n; i++) a.push(new KeyframeEase(0, influence));
    return a;
}

function expect(layerName, prop, states) {
    expected.push({ layer: layerName, path: propPath(prop), display_path: displayPath(prop), states: states });
}

function skip(layerName, prop, reason) {
    skipped.push({ layer: layerName, path: propPath(prop), display_path: displayPath(prop), reason: reason });
}

// New text layers inherit AE's last-used character settings (often black text), which would be
// invisible on the dark background in preview frames. Set them explicitly.
function addText(text, name, size) {
    var layer = comp.layers.addText(text);
    layer.name = name;
    var prop = layer.property("ADBE Text Properties").property("ADBE Text Document");
    var doc = prop.value;
    doc.fontSize = size;
    doc.applyFill = true;
    doc.fillColor = [1, 1, 1];
    doc.applyStroke = false;
    doc.justification = ParagraphJustification.CENTER_JUSTIFY;
    prop.setValue(doc);
    return layer;
}

function addRect(layer, groupName, size) {
    var contents = layer.property("ADBE Root Vectors Group");
    var group = contents.addProperty("ADBE Vector Group");
    group.name = groupName;
    // Adding to a group invalidates earlier references into it, so re-fetch after each add.
    contents.property(contents.numProperties).property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
    contents.property(contents.numProperties).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
    var vectors = contents.property(contents.numProperties).property("ADBE Vectors Group");
    vectors.property(1).property("ADBE Vector Rect Size").setValue(size);
    return vectors;
}

// Layers are added bottom-up: each new layer goes to index 1, so Title (added last) ends up first.

// 10. Background: unanimated, must not appear in findings.
comp.layers.addSolid([0.09, 0.09, 0.11], "Background", W, H, 1, DUR);

// 9. Icon: a precomp layer. The animation inside isn't read in this slice (listed, not analyzed).
var iconComp = app.project.items.addComp(ICON_COMP_NAME, 400, 400, 1, DUR, FPS);
var iconShape = iconComp.layers.addShape();
iconShape.name = "Icon Shape";
addRect(iconShape, "Square", [120, 120]);
keys(tf(iconShape, "ADBE Position"), [0, 1], [[100, 200], [300, 200]], LIN);
var icon = comp.layers.add(iconComp);
icon.name = "Icon";
tf(icon, "ADBE Position").setValue([1700, 200]);

// 8. Old Take: hidden layer with linear keys. Reported, but never the demo target.
var oldTake = addText("Old take", "Old Take", 48);
expect("Old Take", keys(tf(oldTake, "ADBE Position"), [0, 1], [[200, 900], [400, 900]], LIN), ["linear"]);
oldTake.enabled = false;

// 7. Logo: Rotation driven by an expression (skipped) and Scale with a single key (skipped).
var logo = comp.layers.addShape();
logo.name = "Logo";
addRect(logo, "Mark", [100, 100]);
tf(logo, "ADBE Position").setValue([1700, 900]);
var logoRot = keys(tf(logo, "ADBE Rotate Z"), [0, 2], [0, 90], LIN);
logoRot.expression = "time * 30";
skip("Logo", logoRot, "expression");
var logoScale = tf(logo, "ADBE Scale");
logoScale.setValueAtTime(0, [100, 100, 100]);
skip("Logo", logoScale, "single_key");

// 6. Cursor: blinking with hold keys. Held segments are not mistakes.
var cursor = addText("|", "Cursor", 72);
expect("Cursor", keys(tf(cursor, "ADBE Opacity"), [0, 0.5, 1, 1.5, 2, 2.5], [100, 0, 100, 0, 100, 0], HOLD),
    ["held", "held", "held", "held", "held"]);

// 5. Glow: adjustment layer with an animated effect parameter.
var glow = comp.layers.addSolid([1, 1, 1], "Glow", W, H, 1, DUR);
glow.adjustmentLayer = true;
glow.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
var blurriness = glow.property("ADBE Effect Parade").property(1).property("ADBE Gaussian Blur 2-0001");
expect("Glow", keys(blurriness, [0, 1], [20, 0], LIN), ["linear"]);

// 4. Bar: Trim Paths nested in shape contents, and Position with separated dimensions.
var bar = comp.layers.addShape();
bar.name = "Bar";
var barVectors = addRect(bar, "Rectangle", [800, 60]);
barVectors.addProperty("ADBE Vector Filter - Trim");
var trimEnd = bar.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group")
    .property("ADBE Vector Filter - Trim").property("ADBE Vector Trim End");
expect("Bar", keys(trimEnd, [0.2, 1.2], [0, 100], LIN), ["linear"]);
tf(bar, "ADBE Position").dimensionsSeparated = true;
tf(bar, "ADBE Position_1").setValue(900);
expect("Bar", keys(tf(bar, "ADBE Position_0"), [0, 0.6, 1.2], [200, 700, 960], LIN), ["linear", "linear"]);

// 3. CTRL: a null that parents Title and Subtitle. Its keys count, but it's never the demo target.
var ctrl = comp.layers.addNull();
ctrl.name = "CTRL";
expect("CTRL", keys(tf(ctrl, "ADBE Position"), [0, 1], [[960, 540], [960, 500]], LIN), ["linear"]);

// 2. Subtitle: Position already eased (no false flag), Opacity half-eased (counts as linear).
var subtitle = addText("An easing lesson", "Subtitle", 56);
subtitle.parent = ctrl;
var subPos = tf(subtitle, "ADBE Position");
subPos.setValueAtTime(0.3, [0, 160]);
subPos.setValueAtTime(1.3, [0, 110]);
for (var sk = 1; sk <= 2; sk++) {
    subPos.setTemporalEaseAtKey(sk, easeArray(subPos, 33.33), easeArray(subPos, 33.33));
    subPos.setInterpolationTypeAtKey(sk, BEZ, BEZ);
}
expect("Subtitle", subPos, ["eased"]);
var subOp = tf(subtitle, "ADBE Opacity");
subOp.setValueAtTime(0.3, 0);
subOp.setValueAtTime(1.3, 100);
subOp.setTemporalEaseAtKey(1, easeArray(subOp, 33.33), easeArray(subOp, 33.33));
subOp.setInterpolationTypeAtKey(1, LIN, BEZ);   // key 1 out eased...
subOp.setInterpolationTypeAtKey(2, LIN, LIN);   // ...key 2 in linear, so the pair is linear
expect("Subtitle", subOp, ["linear"]);

// 1. Title: the basic case and the demo target (Position, first pair). Scale on a 2D layer still
//    reports 3 temporal-ease dimensions (checked live 2026-09-30), so ease arrays come from AE.
var title = addText("Mentor Practice", "Title", 110);
title.parent = ctrl;
expect("Title", keys(tf(title, "ADBE Position"), [0.5, 1.5, 3], [[0, -60], [0, -100], [0, -110]], LIN), ["linear", "linear"]);
expect("Title", keys(tf(title, "ADBE Scale"), [0.5, 1.5], [[80, 80, 100], [100, 100, 100]], LIN), ["linear"]);
expect("Title", keys(tf(title, "ADBE Opacity"), [0.5, 1.5], [0, 100], LIN), ["linear"]);

// ---- Resolve the answer key (layer indexes are final only now) and check it against R8.
var segments = [];
var totals = { linear: 0, eased: 0, held: 0 };
for (var e = 0; e < expected.length; e++) {
    var ex = expected[e];
    var index = comp.layer(ex.layer).index;
    for (var s = 0; s < ex.states.length; s++) {
        segments.push({
            id: index + "/" + ex.path + "/" + (s + 1),
            layer: ex.layer, display_path: ex.display_path, state: ex.states[s]
        });
        totals[ex.states[s]]++;
    }
}
var skippedOut = [];
for (var q = 0; q < skipped.length; q++) {
    skippedOut.push({
        layer: skipped[q].layer, layer_index: comp.layer(skipped[q].layer).index,
        path: skipped[q].path, display_path: skipped[q].display_path, reason: skipped[q].reason
    });
}
if (totals.linear !== 11 || totals.eased !== 1 || totals.held !== 5 || skippedOut.length !== 2) {
    throw new Error("Answer key doesn't match research R8: " + totals.linear + " linear, " + totals.eased +
        " eased, " + totals.held + " held, " + skippedOut.length + " skipped (expected 11, 1, 5, 2).");
}

var layerList = [];
for (var li = 1; li <= comp.numLayers; li++) layerList.push({ index: li, name: comp.layer(li).name });

var key = {
    generated_by: "mentor/dev/build-practice-comp.jsx",
    comp: { name: comp.name, width: W, height: H, duration: DUR, frame_rate: FPS },
    layers: layerList,
    segments: segments,
    skipped: skippedOut,
    hidden_layers: ["Old Take"],
    precomp_layers: [{ index: icon.index, name: "Icon" }],
    totals: { linear: totals.linear, eased: totals.eased, held: totals.held, skipped: skippedOut.length, precomp: 1 }
};

var wrote = null;
if (ARGS.out) {
    var f = new File(ARGS.out);
    f.encoding = "UTF-8";
    f.lineFeed = "Unix";
    if (!f.open("w")) {
        throw new Error("Couldn't write " + ARGS.out + ". In AE, turn on Settings > Scripting & Expressions > " +
            "Allow Scripts to Write Files and Access Network, then run again with {\"replace\": true}.");
    }
    f.write(toJSON(key, "  ") + "\n");
    f.close();
    wrote = ARGS.out;
}

comp.openInViewer();
return { comp: comp.name, layers: comp.numLayers, totals: key.totals, answer_key: wrote };
