// Spec 015 T005: Pan Behind on an expression-driven null (SB-2, turn f). Read-only.
// Run as an ae_run_script body. Reads Shake Control and rock.png in COMP_NAME at time T: base and
// rendered Position, Anchor Point, Rotation, and rock.png's four source corners in comp space
// (2D, through the parent chain, using rendered values). Also lists the selected layers.
// Run once before the builder's Pan Behind and once after, then diff.
var COMP_NAME = "Comp 1 T005";
var T = 0.6;

var comp = null;
for (var i = 1; i <= app.project.numItems; i++) {
  var it = app.project.item(i);
  if (it instanceof CompItem && it.name === COMP_NAME) { comp = it; break; }
}
if (!comp) return { error: "no comp named " + COMP_NAME };

function tf(layer) {
  var g = layer.property("ADBE Transform Group");
  var p = g.property("ADBE Position"), a = g.property("ADBE Anchor Point");
  var s = g.property("ADBE Scale"), r = g.property("ADBE Rotate Z");
  return {
    pos: p.valueAtTime(T, false), pos_base: p.valueAtTime(T, true),
    anchor: a.valueAtTime(T, false), anchor_keys: a.numKeys, anchor_expr: a.expression,
    scale: s.valueAtTime(T, false), rot: r.valueAtTime(T, false), rot_base: r.valueAtTime(T, true)
  };
}
// layer space point -> parent space, 2D
function up(pt, t) {
  var x = (pt[0] - t.anchor[0]) * t.scale[0] / 100, y = (pt[1] - t.anchor[1]) * t.scale[1] / 100;
  var c = Math.cos(t.rot * Math.PI / 180), s = Math.sin(t.rot * Math.PI / 180);
  return [x * c - y * s + t.pos[0], x * s + y * c + t.pos[1]];
}
function toComp(layer, pt) {
  var L = layer;
  while (L) { pt = up(pt, tf(L)); L = L.parent; }
  return pt;
}
var sc = comp.layer("Shake Control"), rock = comp.layer("rock.png");
var w = rock.source.width, h = rock.source.height;
var corners = { tl: toComp(rock, [0, 0]), tr: toComp(rock, [w, 0]), br: toComp(rock, [w, h]), bl: toComp(rock, [0, h]) };
var sel = [];
for (var k = 0; k < comp.selectedLayers.length; k++) sel.push(comp.selectedLayers[k].index + " " + comp.selectedLayers[k].name);
return {
  comp: comp.name, comp_id: comp.id, t: T, playhead: comp.time, selected: sel,
  shake_control: tf(sc), rock: tf(rock), rock_parent: rock.parent ? rock.parent.name : null,
  rock_corners: corners
};
