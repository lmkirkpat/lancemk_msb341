// Spec 015 T020 (FR-008 to FR-010, research R4): layer references found in an expression's text.
// Comp 1's own reference is from the live reads; the rest are text cases (E11 to E13, E26)
// resolved against Comp 1's live layer list, so names, indexes and parents are real.

import { test } from "node:test";
import assert from "node:assert/strict";
import { expressionReads, referencesIn, resolveRefs } from "../lib/expressions.mjs";
import { comp1 } from "./fixtures/expressions/comp1.mjs";

const C1 = comp1();
const idx = (name) => C1.layer_info.find((l) => l.name === name).index;
const ROCK = idx("rock.png");
const pick = (refs, ...keys) => refs.map((r) => Object.fromEntries(keys.map((k) => [k, r[k] ?? null])));

test("Comp 1: the Sweep Center reads Sweep Control's Position, by name, inferred", () => {
  const sweep = expressionReads(C1).list.find((x) => x.group === "effect");
  assert.deepEqual(sweep.refs, [{ how: "name", target_index: idx("Sweep Control"), target_name: "Sweep Control", property: "Position", shared_name: false, inferred: true }]);
  for (const x of expressionReads(C1).list.filter((e) => e.layer === "Shake Control")) assert.deepEqual(x.refs, [], x.property);
});

test("E10: a name two layers share resolves to the topmost, flagged", () => {
  for (const name of ["G Shakers", "Y Fragments"]) {
    const [ref] = resolveRefs(C1, ROCK, `thisComp.layer("${name}").transform.position`);
    const same = C1.layer_info.filter((l) => l.name === name).map((l) => l.index).sort((a, b) => a - b);
    assert.equal(same.length, 2, name);
    assert.deepEqual([ref.target_index, ref.shared_name, ref.inferred], [same[0], true, true], name);
  }
});

test("E11: by index, index ± N, thisLayer and parent are resolved where the text is plain, all inferred", () => {
  const refs = resolveRefs(C1, ROCK, "a = thisComp.layer(26).position; b = thisComp.layer(index - 1).rotation; c = thisLayer.name; d = parent.transform.position; e = thisComp.layer(thisLayer.index + 1).opacity;");
  assert.deepEqual(pick(refs, "how", "target_name", "property", "inferred"), [
    { how: "index", target_name: "Sweep Control", property: "Position", inferred: true },
    { how: "index_offset", target_name: "General Logo Animation Graphics.png", property: "Rotation", inferred: true },
    { how: "index_offset", target_name: "White Solid 1", property: "Opacity", inferred: true },
    { how: "parent", target_name: "Shake Control", property: "Position", inferred: true },
    { how: "this_layer", target_name: "rock.png", property: null, inferred: true },
  ]);
  assert.deepEqual(pick(resolveRefs(C1, ROCK, "thisLayer.parent.rotation"), "how", "target_name"), [{ how: "parent", target_name: "Shake Control" }]);
  assert.deepEqual(pick(resolveRefs(C1, idx("White Solid 1"), "parent.position"), "how", "target_name", "not_found"), [{ how: "parent", target_name: null, not_found: true }], "no parent");
});

test("E12: a name built at run time or held in a variable can't be resolved", () => {
  for (const text of ['n = "Sweep"; thisComp.layer(n + " Control").position', "thisComp.layer(effect(\"Pick\")(\"Layer\").value).position", 'thisComp.layer("Fragment " + 2)']) {
    assert.deepEqual(pick(resolveRefs(C1, ROCK, text), "how", "target_index"), [{ how: "unresolved", target_index: null }], text);
  }
});

test("E13 and E26: another comp's reference is listed as not followed, and its layer() isn't this comp's", () => {
  const refs = resolveRefs(C1, ROCK, 'comp("Comp 1").layer("Sweep Control").position');
  assert.deepEqual(pick(refs, "how", "target_name", "target_index", "comp"), [{ how: "other_comp", target_name: "Comp 1", target_index: null, comp: "not_followed" }]);
  assert.deepEqual(pick(resolveRefs(C1, ROCK, "comp(name).layer(1)"), "how", "target_name"), [{ how: "other_comp", target_name: null }]);
});

test("a plain name or index that matches no layer is not found, not unresolved", () => {
  assert.deepEqual(pick(resolveRefs(C1, ROCK, 'thisComp.layer("Gone").position'), "how", "target_index", "not_found"), [{ how: "name", target_index: null, not_found: true }]);
  assert.deepEqual(pick(resolveRefs(C1, ROCK, "thisComp.layer(99)"), "how", "not_found"), [{ how: "index", not_found: true }]);
});

test("the referenced property: effect(…)(…), effect(…).param(…), and none for a chain that isn't plain", () => {
  assert.deepEqual(referencesIn('thisComp.layer("A").effect("Slider Control")("Slider")').map((r) => r.property), ["Effects › Slider Control › Slider"]);
  assert.deepEqual(referencesIn("thisComp.layer('A').effect('Blur').param('Blurriness')").map((r) => r.property), ["Effects › Blur › Blurriness"]);
  assert.deepEqual(referencesIn('thisComp.layer("A").toComp([0,0])').map((r) => r.property), [null]);
  assert.deepEqual(referencesIn('// thisComp.layer("A")\n"thisComp.layer(1)"'), [], "comments and strings aren't references");
});
