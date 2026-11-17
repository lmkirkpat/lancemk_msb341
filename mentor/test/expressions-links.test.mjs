// Spec 015 T021 (FR-008 to FR-011; data-model § 2): what links into each layer, and whether the
// layer holding the expression renders. SC-002 on Comp 1; E14 to E16 on the live captures' layers.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { expressionReads, linksIn, rendersAt } from "../lib/expressions.mjs";
import { comp1 } from "./fixtures/expressions/comp1.mjs";
import { FIXTURES } from "./helpers.mjs";

const C1 = comp1();
const live = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "layer-info", `${name}.json`), "utf8"));
const idxOf = (snap, name) => snap.layer_info.find((l) => l.name === name).index;
const expressionReadsOf = (snap, name) => expressionReads(snap).list.find((x) => x.layer === name);

test("SC-002: exactly 1 link into Sweep Control, from Black Solid 1's CC Light Sweep Center, which doesn't render (eye off)", () => {
  const links = linksIn(C1);
  const sweep = links.get(idxOf(C1, "Sweep Control"));
  assert.equal(sweep.status, "read");
  assert.equal(sweep.unresolved_in_comp, 0);
  assert.equal(sweep.links.length, 1);
  const [l] = sweep.links;
  assert.deepEqual(
    { from: l.from_layer, prop: l.from_property, reads: l.property, how: l.how, inferred: l.inferred, shared: l.shared_name },
    { from: "Black Solid 1", prop: "Effects › CC Light Sweep › Center", reads: "Position", how: "name", inferred: true, shared: false },
  );
  assert.deepEqual([l.from_renders.renders, l.from_renders.why], [false, "eye_off"], "E14");
});

test("T037 fix (l): a link's render state is the from layer's (Black Solid 1, eye off), never the linked null's own", () => {
  const [l] = linksIn(C1).get(idxOf(C1, "Sweep Control")).links;
  assert.equal(l.target_renders, undefined, "the old name is gone");
  assert.deepEqual(l.from_renders, rendersAt(C1, idxOf(C1, "Black Solid 1"), C1.comp.time));
  assert.equal(rendersAt(C1, idxOf(C1, "Sweep Control"), C1.comp.time).why, "null", "the null's own state differs");
});

test("SC-002: every other Comp 1 layer has the read run, 0 links and 0 unresolved, never left blank", () => {
  const links = linksIn(C1);
  assert.equal(links.size, 29);
  for (const [index, entry] of links) {
    if (index === idxOf(C1, "Sweep Control")) continue;
    assert.deepEqual(entry, { status: "read", links: [], unresolved_in_comp: 0 }, String(index));
  }
});

test("FR-010: with an unresolved reference anywhere in the comp, every layer says how many, so 'no links' isn't said", () => {
  const snap = structuredClone(C1);
  snap.expressions.push({ ...snap.expressions[0], layer: idxOf(C1, "logo.png"), text: 'thisComp.layer("Sweep " + name).position', text_length: 40 });
  for (const [, entry] of linksIn(snap)) assert.equal(entry.unresolved_in_comp, 1);
});

test("E27: an older snapshot gives not read for every layer, never an empty list", () => {
  const snap = structuredClone(C1);
  delete snap.expressions;
  const links = linksIn(snap);
  assert.equal(links.size, 29);
  for (const [, entry] of links) assert.deepEqual(entry, { status: "not_read", reason: "older_snapshot" });
});

test("E15: a matte renders through its fill layer, eye off by design (live practice2b and overlaps)", () => {
  for (const [file, name] of [["practice2b", "Reveal Matte"], ["overlaps", "Wipe"]]) {
    const snap = live(file);
    assert.deepEqual(rendersAt(snap, idxOf(snap, name), 1), { renders: true, why: "matte_renders", at_time: 1 }, name);
  }
});

test("E16: a guide layer doesn't render; a layer outside its in and out at the time read isn't on screen then", () => {
  const snap = live("overlaps");
  assert.deepEqual(rendersAt(snap, idxOf(snap, "Guide Grid"), 1), { renders: false, why: "guide", at_time: 1 });
  const icon = idxOf(snap, "Icon Stretch"); // in 0, out 4
  assert.deepEqual(rendersAt(snap, icon, 1).why, "renders");
  assert.deepEqual(rendersAt(snap, icon, 4).why, "outside_in_out", "the out point is the first time it's gone");
  assert.deepEqual(rendersAt(snap, idxOf(snap, "Draft"), 1).why, "eye_off");
  assert.deepEqual(rendersAt(snap, idxOf(snap, "Rig"), 1).why, "null");
});

test("a reversed layer (in after out, as AE reports a negative stretch) is on screen between the two", () => {
  const snap = live("overlaps");
  const s = structuredClone(snap);
  const e = s.layer_info.find((l) => l.name === "Still");
  Object.assign(e, { in_point: 3.5, out_point: -4.5 });
  assert.equal(rendersAt(s, e.index, 1).why, "renders");
  assert.equal(rendersAt(s, e.index, 3.5).why, "outside_in_out");
});

// ---- T015's live planted capture (015 Planted)

const P = JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", "planted.json"), "utf8"));
const linksTo = (name) => linksIn(P).get(idxOf(P, name));

test("live E15 and E16: Ctrl's links from a matte (renders) and a guide (doesn't), plus the run-time name it can't resolve", () => {
  const ctrl = linksTo("Ctrl");
  const from = Object.fromEntries(ctrl.links.map((l) => [l.from_layer, [l.property, l.from_renders.why]]));
  assert.deepEqual(from["Matte Link"], ["Rotation", "matte_renders"]);
  assert.deepEqual(from["Guide Link"], ["Position", "guide"]);
  assert.equal(ctrl.unresolved_in_comp, 2, "Runtime Name's thisComp.layer(n), and Comp Ref's comp() (review S7)");
  assert.ok(!ctrl.links.some((l) => l.from_layer === "Runtime Name"));
});

test("live E11: by index (layer 1) and by index - 1, each marked inferred", () => {
  const one = linksTo("Ctrl").links.find((l) => l.from_layer === "Index Link");
  assert.deepEqual([one.how, one.inferred, one.property], ["index", true, "Position"]);
  const above = linksTo("Index Link").links.find((l) => l.from_layer === "Offset Link");
  assert.deepEqual([above.how, above.property], ["index_offset", "Rotation"]);
});

test("live E13: comp(\"Mentor Practice\") isn't followed, and links into no layer here", () => {
  const ref = expressionReadsOf(P, "Comp Ref");
  assert.deepEqual(ref.refs.map((r) => [r.how, r.target_name, r.comp]), [["other_comp", "Mentor Practice", "not_followed"]]);
  for (const [, e] of linksIn(P)) assert.ok(!e.links.some((l) => l.from_layer === "Comp Ref"));
});
