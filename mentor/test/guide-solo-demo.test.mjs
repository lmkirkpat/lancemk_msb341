// Overlap audit 2026-10-29, decisions D-OA-1 and D-OA-3 (T463 key types, T464 speed graph, T465
// offset). A guide layer never renders: it's left out of the default focus or group and is never the
// demo, but the learner can still name it. A layer another layer's solo hides (soloed_elsewhere) is
// never the demo in key types and speed graph, and is still teachable. Shy layers render, so they
// stay as they were. SYNTHETIC: derived from synthetic/matte.json and matte-eased.json here.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as kt from "../lib/key-types.mjs";
import * as sg from "../lib/speed-graph.mjs";
import * as off from "../lib/offset.mjs";
import { FIXTURES } from "./helpers.mjs";

const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "layer-info", "synthetic", name), "utf8"));
const info = (s, name) => s.layer_info.find((l) => l.name === name);
const keyed = (s, name) => s.layers.find((l) => l.name === name);
const set = (s, name, fields) => { Object.assign(info(s, name), fields); return s; };
// Wipe as an ordinary layer: eye on, not a matte, and Photo no longer matted to it.
function plainWipe(file) {
  const s = load(file);
  set(s, "Wipe", { enabled: true, is_matte: false });
  keyed(s, "Wipe").enabled = true;
  info(s, "Photo").matte = null;
  return s;
}
const on = (index) => (id) => typeof id === "string" && id.startsWith(`${index}/`);

// ---- Key types (T463): Title's 0 to 100 Opacity is an on-off candidate; Wipe's blink has two pairs.

test("key types: a guide layer's blink isn't a candidate, is left out as a guide, and can still be named", () => {
  const s = set(load("matte.json"), "Title", { guide: true });
  const a = kt.analyze(s);
  assert.ok(!a.candidates.some((c) => c.layer === "Title"), "not a candidate");
  assert.ok(!kt.finder(s).layers.includes("Title"));
  assert.deepEqual((a.left_out.find((x) => x.reason === "guide") || {}).layers, ["Title"]);
  const named = kt.analyze(s, { skill_options: { focus: [{ layer: "Title", property: "Opacity" }] } });
  assert.equal(named.targets.length, 1, "named, it's the focus");
});

test("key types: a shy layer is unchanged (still a candidate, no guide entry)", () => {
  const s = set(load("matte.json"), "Title", { shy: true });
  const a = kt.analyze(s);
  assert.ok(a.candidates.some((c) => c.layer === "Title"));
  assert.ok(!a.left_out.some((x) => x.reason === "guide"));
});

test("key types: a guide layer is never the demo", () => {
  const focus = [{ layer: "Title", property: "Opacity" }, { layer: "Wipe", property: "Opacity" }];
  const plain = kt.analyze(load("matte.json"), { skill_options: { focus } });
  assert.ok(on(2)(plain.demo_target), "before: Title's pair, the earliest");
  const a = kt.analyze(set(load("matte.json"), "Title", { guide: true }), { skill_options: { focus } });
  assert.ok(a.targets.some(on(2)), "Title is still in the focus");
  assert.ok(on(3)(a.demo_target), `the demo goes to Wipe, got ${a.demo_target}`);
  const only = kt.analyze(set(plainWipe("matte.json"), "Wipe", { guide: true }), { skill_options: { focus: [{ layer: "Wipe", property: "Opacity" }] } });
  assert.equal(only.targets.length, 2);
  assert.equal(only.demo_target, null);
  assert.equal(only.no_demo_reason, "hidden_or_null");
});

test("key types: a layer another layer's solo hides is never the demo, and is still in the focus", () => {
  const focus = [{ layer: "Title", property: "Opacity" }, { layer: "Wipe", property: "Opacity" }];
  const a = kt.analyze(set(load("matte.json"), "Wipe", { solo: true }), { skill_options: { focus } });
  assert.ok(a.targets.some(on(2)));
  assert.ok(on(3)(a.demo_target), `the demo goes to the soloed Wipe, got ${a.demo_target}`);
  assert.ok(a.candidates.some((c) => c.layer === "Title"), "still a candidate");
});

// ---- Speed graph (T464): Wipe (3) has an eased Position pair and two Opacity pairs; Card (5) one
// Position pair.

test("speed graph: a guide layer isn't the default focus, is still offered, and can be named", () => {
  const before = sg.analyze(plainWipe("matte-eased.json"));
  assert.deepEqual(before.focus, ["Wipe"]);
  const s = set(plainWipe("matte-eased.json"), "Wipe", { guide: true });
  const a = sg.analyze(s);
  assert.deepEqual(a.focus, ["Card"]);
  assert.deepEqual(sg.finder(s).layers, ["Card"]);
  assert.ok(a.other_candidates.some((c) => c.layer === "Wipe"), "offered by name");
  const named = sg.analyze(s, { focus_layers: ["Wipe"] });
  assert.ok(named.targets.length >= 2 && named.targets.every(on(3)));
  assert.equal(named.demo_target, null, "but never the demo");
  assert.equal(named.no_demo_reason, "no_visible_layer");
});

test("speed graph: a shy layer is unchanged", () => {
  assert.deepEqual(sg.analyze(set(plainWipe("matte-eased.json"), "Wipe", { shy: true })).focus, ["Wipe"]);
});

test("speed graph: a guide layer is never the demo when the focus has another layer", () => {
  const plain = sg.analyze(plainWipe("matte-eased.json"), { focus_layers: ["Wipe", "Card"] });
  assert.ok(on(3)(plain.demo_target), "before: Wipe's pair");
  const a = sg.analyze(set(plainWipe("matte-eased.json"), "Wipe", { guide: true }), { focus_layers: ["Wipe", "Card"] });
  assert.ok(on(5)(a.demo_target), `the demo goes to Card, got ${a.demo_target}`);
});

test("speed graph: a layer another layer's solo hides is never the demo, and is still in the focus", () => {
  const s = set(plainWipe("matte-eased.json"), "Card", { solo: true });
  const a = sg.analyze(s, { focus_layers: ["Wipe", "Card"] });
  assert.ok(a.targets.some(on(3)));
  assert.ok(on(5)(a.demo_target), `the demo goes to the soloed Card, got ${a.demo_target}`);
  const only = sg.analyze(s, { focus_layers: ["Wipe"] });
  assert.equal(only.demo_target, null);
  assert.equal(only.no_demo_reason, "no_visible_layer");
  assert.deepEqual(sg.analyze(s).focus, ["Wipe"], "still the default focus");
});

// ---- Offset (T465): Wipe (3), Card (5) and Chip (6) each start a Position move at 0.6 s.

function withMates() {
  const s = plainWipe("matte.json");
  const pos = keyed(s, "Wipe").properties[0];
  for (const [index, name] of [[5, "Card"], [6, "Chip"]]) {
    s.layers.push({ index, name, kind: "solid", enabled: true, is_null: false, properties: [structuredClone(pos)] });
    s.layer_info.push({ ...structuredClone(info(s, "Wipe")), index, name });
  }
  return s;
}
const memberNames = (a) => (a.group ? a.group.members.map((m) => m.layer) : []);

test("offset: a guide layer is left out of the proposed group as a guide, and can still be named", () => {
  assert.deepEqual(memberNames(off.analyze(withMates())), ["Wipe", "Card", "Chip"]);
  const s = set(withMates(), "Chip", { guide: true });
  const a = off.analyze(s);
  assert.deepEqual(memberNames(a), ["Wipe", "Card"]);
  assert.ok(!off.finder(s).layers.includes("Chip"));
  assert.deepEqual((a.left_out.find((x) => x.reason === "guide") || {}).layers, ["Chip"]);
  const named = off.analyze(s, { skill_options: { kind: "layers", members: ["Wipe", "Card", "Chip"] } });
  assert.deepEqual(memberNames(named), ["Wipe", "Card", "Chip"]);
  assert.deepEqual(named.refused_members, []);
});

test("offset: a shy layer is unchanged", () => {
  assert.deepEqual(memberNames(off.analyze(set(withMates(), "Chip", { shy: true }))), ["Wipe", "Card", "Chip"]);
});

test("offset: a guide layer is never the demo", () => {
  const opts = { skill_options: { kind: "layers", members: ["Wipe", "Card", "Chip"], order: ["Card", "Chip", "Wipe"], gap_frames: 3 } };
  assert.equal(off.analyze(withMates(), opts).demo_target, "layer/6", "before: Chip, second in their order");
  const a = off.analyze(set(withMates(), "Chip", { guide: true }), opts);
  assert.equal(a.demo_target, "layer/3", "the next one, Wipe");
});
