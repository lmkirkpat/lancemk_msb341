// Spec 009 T004: candidates, focus, refusals, what's left out, the demo target and the finder
// (FR-003 to FR-009, FR-015), checked against the hand-written answer key.

import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, candidates, finder, MAX_NAMED, OPACITY_PATH } from "../lib/key-types.mjs";
import { FINDERS } from "../tools/key-types.mjs";
import { answerKey, load } from "./fixtures/key-types/load.mjs";

const KEY = answerKey().fixtures;
const names = (list) => list.map((c) => `${c.layer} › ${c.property}`);
const leftOutMap = (r) => Object.fromEntries(r.left_out.map((g) => [g.reason, g]));
const B = (i) => `1/${OPACITY_PATH}/${i}`;
const mark = (snap, layer, path) => {
  const prop = snap.layers.find((l) => l.name === layer).properties.find((p) => p.path === path);
  return { kind: "kept_linear", project: snap.project, comp: snap.comp.name, layer, path, property: prop.display_name, key_times: prop.keys.map((k) => k.time) };
};

test("candidates match the answer key on every fixture that lists them", () => {
  for (const [file, key] of Object.entries(KEY)) {
    if (!key.candidates) continue;
    const snap = load(file);
    assert.deepEqual(names(candidates(snap)), key.candidates, file);
    const r = analyze(snap);
    assert.deepEqual(names(r.candidates), key.named_candidates || key.candidates.slice(0, MAX_NAMED), file);
    if (key.more_candidates != null) assert.equal(r.more_candidates, key.more_candidates, file);
    for (const nc of key.not_candidates || []) assert.ok(!names(candidates(snap)).includes(nc), `${file}: ${nc}`);
  }
});

test("Mentor Practice 2: Blink and Cut are candidates, Spinner isn't; no focus means no targets yet", () => {
  const r = analyze(load("practice2-before.json"));
  assert.deepEqual(names(r.candidates), ["Blink › Opacity", "Cut › Opacity"]);
  assert.deepEqual(r.targets, []);
  assert.equal(r.demo_target, null);
  assert.equal(r.no_demo_reason, "awaiting_focus");
  assert.equal(r.focus, null);
});

test("Mentor Practice now (FR-008): Title and Subtitle asked about, the Cursor already snaps, Logo has an expression", () => {
  const snap = load("practice-now.json");
  const r = analyze(snap);
  const key = KEY["practice-now.json"];
  assert.deepEqual(names(r.candidates), key.candidates);
  assert.deepEqual(r.held_examples, key.held_examples);
  const lo = leftOutMap(r);
  assert.deepEqual(lo.hidden.layers, key.left_out.hidden);
  assert.deepEqual(lo.precomp.layers, key.left_out.precomp);
  assert.deepEqual(names(lo.expression.properties), key.left_out.expression);
  assert.deepEqual(names(lo.already_held.properties), key.left_out.already_held);
});

test("values within 0.5 of 0 and 100 qualify; 0.6 or 80 don't (H-2)", () => {
  const base = load("practice2-before.json");
  const withCut = (a, b) => {
    const s = structuredClone(base); // in-test edit of the values only
    const keys = s.layers.find((l) => l.name === "Cut").properties[0].keys;
    keys[0].value = a;
    keys[1].value = b;
    return names(candidates(s)).includes("Cut › Opacity");
  };
  assert.equal(withCut(99.6, 0.4), true);
  assert.equal(withCut(0.4, 99.6), true);
  assert.equal(withCut(100, 0.6), false);
  assert.equal(withCut(80, 0), false);
  assert.equal(withCut(null, 0), false, "unknown values aren't candidates (row 22)");
});

test("a mixed pair counts as not held, so it's still a candidate (row 6)", () => {
  assert.ok(names(candidates(load("mixed-pair.json"))).includes("Blink › Opacity"));
  assert.ok(names(candidates(load("wrong-side.json"))).includes("Blink › Opacity"));
  assert.ok(!names(candidates(load("blink-all-held.json"))).includes("Blink › Opacity"));
});

test("effect, fill and text-animator Opacity aren't candidates (row 9); hidden layers and nulls aren't either (rows 11, 14)", () => {
  assert.deepEqual(names(candidates(load("nested-opacity.json"))), ["Blink › Opacity", "Cut › Opacity"]);
  const c = names(candidates(load("overlap-layers.json")));
  for (const n of ["Ghost › Opacity", "Matte › Opacity", "Rig › Opacity", "Old Values › Opacity"]) assert.ok(!c.includes(n), n);
});

test("focus cases match the answer key: targets, demo target, refusals", () => {
  for (const [file, key] of Object.entries(KEY)) {
    for (const f of key.focus || []) {
      const r = analyze(load(file), { skill_options: { focus: f.refs } });
      const label = `${file}: ${f.name}`;
      assert.deepEqual(r.targets, f.targets, label);
      assert.deepEqual(r.refused, f.refused, label);
      if ("demo_target" in f) assert.equal(r.demo_target, f.demo_target, label);
      if (f.no_demo_reason) assert.equal(r.no_demo_reason, f.no_demo_reason, label);
      assert.equal(r.target_refs.length, r.targets.length, label);
    }
  }
});

test("a named property gives all its non-held, non-pause pairs; the demo is the earliest on a visible, non-null layer", () => {
  const snap = load("practice2-before.json");
  const r = analyze(snap, { skill_options: { focus: [{ layer: "Cut", property: "Opacity" }, { layer: "Blink", property: "Opacity" }] } });
  assert.deepEqual(r.targets, [`3/${OPACITY_PATH}/1`, B(1), B(2), B(3)]);
  assert.equal(r.demo_target, B(1), "earliest in time, not first named");
  assert.deepEqual(r.focus, ["Cut", "Blink"]);
  assert.deepEqual(r.target_refs[0], { layer: "Cut", property: "Opacity" });
});

test("a held pair in a named property isn't a target; a named property that's all held is refused", () => {
  const r = analyze(load("blink-one-held.json"), { skill_options: { focus: [{ layer: "Blink", property: "Opacity" }] } });
  assert.deepEqual(r.targets, [B(1), B(3)]);
  const all = analyze(load("blink-all-held.json"), { skill_options: { focus: [{ layer: "Blink", property: "Opacity" }] } });
  assert.deepEqual(all.refused, [{ layer: "Blink", property: "Opacity", reason: "all_held" }]);
});

test("names are matched by display name (any case) or by path", () => {
  const snap = load("practice2-before.json");
  for (const property of ["Opacity", "opacity", OPACITY_PATH, "Transform › Opacity"]) {
    assert.deepEqual(analyze(snap, { skill_options: { focus: [{ layer: "Blink", property }] } }).targets, [B(1), B(2), B(3)], property);
  }
});

test("a candidate the learner said should move drops out of candidates (FR-004)", () => {
  for (const [file, key] of Object.entries(KEY)) {
    if (!key.should_move) continue;
    const r = analyze(load(file), { skill_options: { should_move: key.should_move.refs } });
    assert.deepEqual(names(r.candidates), key.should_move.candidates, file);
    if (key.should_move.no_demo_reason) assert.equal(r.no_demo_reason, key.should_move.no_demo_reason, file);
  }
});

test("a property with an applying kept-linear mark isn't a candidate, and is named as left out (FR-015, row 21)", () => {
  const snap = load("overlap-layers.json");
  const key = KEY["overlap-layers.json"].with_fader_kept_linear;
  const r = analyze(snap, { kept_linear: [mark(snap, "Fader", OPACITY_PATH)] });
  assert.deepEqual(names(r.candidates), key.candidates);
  assert.equal(r.more_candidates, 0);
  assert.deepEqual(names(leftOutMap(r).kept_linear.properties), key.left_out.kept_linear);
  // A lapsed mark (other key times) changes nothing.
  const lapsed = { ...mark(snap, "Fader", OPACITY_PATH), key_times: [0, 1] };
  assert.ok(names(candidates(snap, { kept_linear: [lapsed] })).includes("Fader › Opacity"));
});

test("left out on the overlap layers: hidden, precomp, unknown values (rows 10, 11, 13, 22)", () => {
  const lo = leftOutMap(analyze(load("overlap-layers.json")));
  const key = KEY["overlap-layers.json"].left_out;
  assert.deepEqual(lo.hidden.layers, key.hidden);
  assert.deepEqual(lo.precomp.layers, key.precomp);
  assert.deepEqual(names(lo.unknown_values.properties), key.unknown_values);
});

test("no demo with one target, on a hidden layer or on a null", () => {
  const snap = load("overlap-layers.json");
  const one = analyze(snap, { skill_options: { focus: [{ layer: "Cut", property: "Opacity" }] } });
  assert.equal(one.demo_target, null);
  assert.equal(one.no_demo_reason, "single_target");
  // Ghost (hidden) starts at 6 s and Rig (a null) at 6 s, both before Fader at 7 s: the demo still goes to Fader.
  const mixed = analyze(snap, { skill_options: { focus: [{ layer: "Ghost", property: "Opacity" }, { layer: "Rig", property: "Opacity" }, { layer: "Fader", property: "Opacity" }] } });
  assert.equal(mixed.demo_target, `20/${OPACITY_PATH}/1`);
  const none = analyze(snap, { skill_options: { focus: [{ layer: "Ghost", property: "Opacity" }, { layer: "Rig", property: "Opacity" }] } });
  assert.equal(none.demo_target, null);
  assert.equal(none.no_demo_reason, "hidden_or_null");
});

test("no candidate and nothing named: no_candidate", () => {
  const r = analyze(load("practice-blink-before.json"), { skill_options: { should_move: [{ layer: "Title", property: "Opacity" }, { layer: "Subtitle", property: "Opacity" }] } });
  assert.deepEqual(r.candidates, []);
  assert.equal(r.no_demo_reason, "no_candidate");
});

test("exclude drops past targets from candidates and refuses them as a focus (review)", () => {
  const snap = load("practice2-before.json");
  const key = KEY["practice2-before.json"].review_exclude;
  for (const k of Object.values(key)) assert.deepEqual(names(analyze(snap, { exclude: k.exclude }).candidates), k.candidates);
  const r = analyze(snap, { exclude: key.blink.exclude, skill_options: { focus: [{ layer: "Blink", property: "Opacity" }] } });
  assert.deepEqual(r.targets, []);
  assert.deepEqual(r.refused, [{ layer: "Blink", property: "Opacity", reason: "past_target" }]);
});

test("the finder's count equals the candidate properties not in exclude, on every fixture", () => {
  const f = FINDERS["keyframes.types"];
  for (const file of Object.keys(KEY)) {
    const snap = load(file);
    for (const exclude of [[], [{ layer: "Blink", property: "Opacity" }], [{ layer: "Blink", property: "Opacity" }, { layer: "Cut", property: "Opacity" }]]) {
      const found = f.focus(snap, { exclude });
      const all = candidates(snap, { exclude });
      assert.equal(found.count, all.length, `${file} ${JSON.stringify(exclude)}`);
      assert.deepEqual(found.layers, [...new Set(all.map((c) => c.layer))]);
      assert.equal(found.count > 0, analyze(snap, { exclude }).candidates.length > 0, file);
    }
  }
  assert.deepEqual(finder(load("practice2-before.json")), { count: 2, layers: ["Blink", "Cut"] });
});

test("the finder accepts kept_linear marks and skips those properties", () => {
  const snap = load("overlap-layers.json");
  const f = FINDERS["keyframes.types"];
  assert.equal(f.focus(snap).count, 4);
  assert.equal(f.focus(snap, { kept_linear: [mark(snap, "Fader", OPACITY_PATH)] }).count, 3);
});
