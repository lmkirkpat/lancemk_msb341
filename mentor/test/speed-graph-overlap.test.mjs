// Spec 008 › Edge cases where concepts overlap, rows 1 to 19 (FR-025, spec 004 FR-034): what the
// candidate test and the check see on each, on the fixtures (live captures when there, stand-ins
// until then) and answer-key.json.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

tempHome();
const { analyze, check } = await import("../lib/speed-graph.mjs");

const DIR = path.join(FIXTURES, "speed-graph");
const load = (name) => {
  for (const p of [path.join(DIR, name), path.join(FIXTURES, name), path.join(DIR, "stand-in", name)]) {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  }
  throw new Error(`No fixture ${name}`);
};
const KEY = JSON.parse(fs.readFileSync(path.join(DIR, "answer-key.json"), "utf8"));
const id = (k) => KEY.ids[k] || k;
const clone = (x) => JSON.parse(JSON.stringify(x));
const now = load("practice-now.json");
const lesson = (extra = {}) => ({ comp_id: now.comp.id, targets: KEY.analysis["practice-now.json"].targets.map(id), demo: null, ...extra });
const layer = (s, name) => s.layers.find((l) => l.name === name);
const pair = (r, k) => r.pairs.find((p) => p.id === id(k));
const kinds = (a, kind) => (a.left_out.find((x) => x.kind === kind) || { layers: [], refs: [] });

// Easy Ease on every key of a property (both sides), as F9 would.
function ease(prop) {
  for (const k of prop.keys) {
    k.in_type = k.out_type = "bezier";
    k.in_ease = k.in_ease.map(() => ({ speed: 0, influence: 33.333 }));
    k.out_ease = k.out_ease.map(() => ({ speed: 0, influence: 33.333 }));
  }
  return prop;
}

test("row 1: expression over keys (Logo Rotation) isn't a candidate; its key edits are other changes", () => {
  const a = analyze(now);
  assert.deepEqual(kinds(a, "expression").refs, [{ layer: "Logo", property: "Rotation" }]);
  assert.deepEqual(analyze(now, { focus_layers: ["Logo"] }).targets, [], "never a target, even if named");
  const edited = clone(now);
  ease(layer(edited, "Logo").properties.find((p) => p.display_name === "Rotation"));
  const r = check(now, edited, lesson());
  assert.ok(r.other_changes.some((c) => c.startsWith("Logo › Rotation keys were changed") && c.includes("expression")));
  assert.ok(r.pairs.every((p) => !p.id.startsWith("7/")), "never graded");
});

test("row 2: an expression with no keys isn't read, and nothing is claimed about it", () => {
  const a = analyze(now);
  // Only keyed properties are in a snapshot: no layer is said to be free of expressions.
  assert.deepEqual(a.left_out.map((x) => x.kind), ["hidden", "null", "precomp", "expression", "ease_first"]);
  assert.ok(!kinds(a, "expression").layers.includes("Title"));
  assert.ok(!JSON.stringify(a).includes("no_expression"));
});

test("row 3: an expression turned off on a keyed property: keys drive, a candidate if eased, graded", () => {
  const off = load("planted-expression-off.json");
  const a = analyze(off);
  assert.ok(!a.left_out.some((x) => x.kind === "expression"));
  assert.ok(kinds(a, "ease_first").layers.includes("Logo"), "linear as built: ease it first");
  const eased = clone(off);
  ease(layer(eased, "Logo").properties.find((p) => p.display_name === "Rotation"));
  const named = analyze(eased, { focus_layers: ["Logo"] });
  assert.deepEqual(named.targets, ["7/ADBE Transform Group/ADBE Rotate Z/1"]);
  const shaped = clone(eased);
  const rot = layer(shaped, "Logo").properties.find((p) => p.display_name === "Rotation");
  rot.keys[0].out_ease[0].influence = 15;
  rot.keys[1].in_ease[0].influence = 80;
  const r = check(eased, shaped, { comp_id: now.comp.id, targets: named.targets, demo: null });
  assert.equal(r.pairs[0].result, "passed");
  assert.ok(check(now, off, lesson()).other_changes.includes("Logo › Rotation expression was turned off"));
});

test("row 4: a single key (Logo Scale) isn't a pair", () => {
  const a = analyze(now, { focus_layers: ["Logo"] });
  assert.deepEqual(a.targets, []);
  assert.equal(a.no_demo_reason, "none_in_focus");
  assert.ok(!JSON.stringify(a.left_out).includes("Scale"));
});

test("row 5: hold or linear facing sides (Cursor, CTRL) aren't candidates; a focus pair turned linear fails c", () => {
  const a = analyze(now, { focus_layers: ["Cursor", "CTRL"] });
  assert.deepEqual(a.targets, []);
  const cur = clone(now);
  layer(cur, "Title").properties[0].keys[1].out_type = "linear";
  const p2 = pair(check(now, cur, lesson()), "P2");
  assert.deepEqual([p2.result, p2.mistake, p2.key_time], ["not_passed", "no_handle", 1.5]);
  assert.ok(p2.failed.includes("c"));
});

test("row 6: half eased (Subtitle Opacity) isn't a candidate but 'ease first'; a focus pair half eased fails c", () => {
  const a = analyze(now);
  assert.ok(kinds(a, "ease_first").refs.some((r) => r.layer === "Subtitle" && r.property === "Opacity"));
  assert.ok(!a.other_candidates.some((c) => c.layer === "Subtitle" && c.property === "Opacity"));
  const cur = clone(now);
  layer(cur, "Title").properties[1].keys[1].in_type = "linear";
  const s = pair(check(now, cur, lesson()), "S");
  assert.deepEqual([s.mistake, s.key_time], ["no_handle", 1.5]);
});

test("row 7: bezier out, hold in on the landing key: not a candidate, and fails c", () => {
  const held = load("planted-hold-in.json");
  assert.ok(!analyze(held).targets.includes(id("P1")));
  assert.ok(!kinds(analyze(held), "ease_first").refs.some((r) => r.layer === "Title"), "not easing's either");
  const p1 = pair(check(now, held, lesson()), "P1");
  assert.equal(p1.mistake, "no_handle");
  assert.ok(p1.failed.includes("c"));
});

test("row 8: separated dimensions (Bar X Position) are their own pairs, named by their own name", () => {
  const cur = clone(now);
  ease(layer(cur, "Bar").properties.find((p) => p.display_name === "X Position"));
  const a = analyze(cur, { focus_layers: ["Bar"] });
  const x = a.pairs.filter((p) => p.property === "X Position");
  assert.equal(x.length, 2);
  assert.deepEqual(x.map((p) => p.label), ["Bar › X Position 0–0.6 s", "Bar › X Position 0.6–1.2 s"]);
  assert.deepEqual(x[0].moving_dims, [], "one dimension: nothing to name");
});

test("row 9: Scale's third dimension doesn't move, so it isn't graded; a moving one off is named", () => {
  const cur = clone(now);
  const scale = layer(cur, "Title").properties[1];
  scale.keys[0].out_ease = [{ speed: 0, influence: 15 }, { speed: 0, influence: 15 }, { speed: 0, influence: 33.333 }];
  scale.keys[1].in_ease = [{ speed: 0, influence: 80 }, { speed: 0, influence: 80 }, { speed: 0, influence: 33.333 }];
  assert.equal(pair(check(now, cur, lesson()), "S").result, "passed");
  assert.equal(pair(check(now, load("planted-one-scale-dim.json"), lesson()), "S").dimension, "height");
});

test("row 10: a hidden layer (Old Take) is left out, allowed if named, never the demo", () => {
  const cur = clone(now);
  ease(layer(cur, "Old Take").properties[0]);
  assert.deepEqual(kinds(analyze(cur), "hidden").layers, ["Old Take"]);
  assert.deepEqual(analyze(cur).focus, ["Title"]);
  const named = analyze(cur, { focus_layers: ["Old Take", "Title"] });
  assert.ok(named.targets.includes("8/ADBE Transform Group/ADBE Position/1"));
  assert.ok(!named.demo_target.startsWith("8/"));
  assert.equal(analyze(cur, { focus_layers: ["Old Take"] }).demo_target, null);
});

test("row 11: a null (CTRL) isn't a default candidate; allowed if named; never the demo", () => {
  const cur = clone(now);
  ease(layer(cur, "CTRL").properties[0]);
  assert.deepEqual(kinds(analyze(cur), "null").layers, ["CTRL"]);
  assert.ok(!analyze(cur).targets.some((t) => t.startsWith("3/")));
  const named = analyze(cur, { focus_layers: ["CTRL", "Title"] });
  assert.ok(named.targets.includes("3/ADBE Transform Group/ADBE Position/1"));
  assert.equal(named.demo_target, id("P1"), "the demo stays on a visible, non-null layer");
});

test("row 12: shared middle key: each pair owns its facing side", () => {
  const r = check(now, load("planted-shared-key.json"), lesson());
  assert.equal(pair(r, "P1").result, "passed");
  assert.equal(pair(r, "P2").result, "not_passed");
  assert.equal(pair(r, "P2").mistake, "not_shaped");
});

test("row 13: a precomp (Icon): its inside isn't read, its own transform keys are candidates if eased", () => {
  assert.deepEqual(kinds(analyze(now), "precomp").layers, ["Icon"]);
  const cur = clone(now);
  cur.layers.push({ index: 9, name: "Icon", kind: "precomp", enabled: true, is_null: false, properties: [ease({
    path: "ADBE Transform Group/ADBE Position", display_path: "Transform › Position", display_name: "Position", dimensions: 1, expression_enabled: false,
    keys: [0, 1].map((t, i) => ({ index: i + 1, time: t, in_type: "linear", out_type: "linear", value: [[100, 200], [300, 200]][i], in_ease: [{ speed: 0, influence: 16.667 }], out_ease: [{ speed: 0, influence: 16.667 }] })),
  })] });
  const a = analyze(cur, { focus_layers: ["Icon"] });
  assert.deepEqual(a.targets, ["9/ADBE Transform Group/ADBE Position/1"]);
  assert.deepEqual(kinds(a, "precomp").layers, ["Icon"], "still said: I can't see inside it");
});

test("row 14: an effect or shape-content pair (Bar Trim Paths End) is allowed if named, not the default", () => {
  assert.ok(!analyze(now).targets.some((t) => t.startsWith("4/")));
  assert.ok(analyze(now).other_candidates.some((c) => c.layer === "Bar" && c.display_path.endsWith("Trim Paths 1 › End")));
  assert.equal(analyze(now, { focus_layers: ["Bar"] }).targets.length, 1);
});

test("row 15: parenting (Title rides CTRL): only the layer's own keys", () => {
  const a = analyze(now);
  assert.ok(a.targets.every((t) => t.startsWith("1/")));
  assert.ok(a.pairs.every((p) => p.layer === "Title"));
  assert.ok(!JSON.stringify(a.pairs).includes("CTRL"));
});

test("row 16: a pair with no value change (Mentor Practice 2 Pause) isn't a candidate", () => {
  const p2 = load("practice2-before.json");
  ease(layer(p2, "Pause").properties[0]);
  const a = analyze(p2, { focus_layers: ["Pause"] });
  assert.deepEqual(a.targets, ["13/ADBE Transform Group/ADBE Position/1", "13/ADBE Transform Group/ADBE Position/3"]);
  assert.ok(!JSON.stringify(a.left_out).includes("Pause"), "left out silently");
});

test("row 17: keys added on a focus property: those pairs aren't graded", () => {
  const r = check(now, load("planted-key-added.json"), lesson());
  assert.equal(pair(r, "S").result, "keys_changed");
  assert.equal(r.passed, false);
  assert.ok(r.other_changes.includes("Title › Scale now has 3 keys (was 2)"));
});

test("row 18: demo undone or redone: credit to whoever did it", () => {
  const demo = { segment_id: id("P1"), at: "2026-10-21T00:00:00.000Z" };
  assert.equal(pair(check(now, load("after-demo.json"), lesson({ demo })), "P1").credit, "demo");
  assert.equal(pair(check(now, load("after-demo-undone.json"), lesson({ demo })), "P1").credit, "learner_after_undo");
  assert.equal(pair(check(now, load("after-demo-redone.json"), lesson({ demo })), "P1").credit, "learner_redo");
});

test("row 19: Easy Ease again after shaping: still a candidate, and 'back to default'", () => {
  const again = load("planted-easy-ease-again.json");
  assert.ok(analyze(again).targets.includes(id("S")));
  const s = pair(check(now, again, lesson(), { seen_shaped: [id("S")] }), "S");
  assert.deepEqual(s.failed, ["a", "b"]);
  assert.equal(s.mistake, "back_to_default");
});
