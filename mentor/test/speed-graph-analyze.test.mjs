// Spec 008 FR-003 to FR-007 and FR-002: candidates, the focus, leave-outs, "lands hard", the demo
// target, and FINDERS agreeing with analyze() on every fixture (contract › 2).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, fixture, tempHome } from "./helpers.mjs";

tempHome();
const { analyze, finder } = await import("../lib/speed-graph.mjs");
const { FINDERS } = await import("../tools/speed-graph.mjs");

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

for (const [name, want] of Object.entries(KEY.analysis)) {
  test(`analyze gives ${name} as the answer key says`, () => {
    const a = analyze(load(name));
    assert.equal(a.candidates_count, want.candidates_count);
    assert.deepEqual(a.focus, want.focus);
    assert.deepEqual(a.targets, want.targets.map(id));
    if ("demo_target" in want) assert.equal(a.demo_target, want.demo_target && id(want.demo_target));
    if ("no_demo_reason" in want) assert.equal(a.no_demo_reason, want.no_demo_reason);
    if ("ease_first_count" in want) assert.equal(a.ease_first_count, want.ease_first_count);
    if (want.left_out) assert.deepEqual(a.left_out.map(({ kind, layers }) => ({ kind, layers })), want.left_out);
    if (want.already_shaped) assert.deepEqual(a.left_out.find((x) => x.kind === "already_shaped").layers, want.already_shaped);
    if (want.parts) for (const p of a.pairs) assert.deepEqual(p.fastest.parts, want.parts[Object.keys(KEY.ids).find((k) => KEY.ids[k] === p.id)]);
  });
}

test("US1 on Mentor Practice now: Title's Position and Scale, Opacity left for the learner to pick", () => {
  const a = analyze(now);
  assert.deepEqual(a.target_refs.map((r) => `${r.layer} ${r.property}`), ["Title Position", "Title Position", "Title Position", "Title Scale"]);
  assert.deepEqual(a.pairs.map((p) => [p.from_time, p.to_time]), [[0.5, 1.5], [1.5, 3], [3, 4.37], [0.5, 1.5]]);
  assert.equal(a.pairs[0].label, "Title › Position 0.5–1.5 s");
  assert.deepEqual(a.pairs[3].moving_dims, ["width", "height"], "Scale's third dimension doesn't move");
  assert.deepEqual(a.other_candidates.map((c) => `${c.layer} ${c.property} ${c.pairs}`), ["Title Opacity 1", "Subtitle Position 2", "Bar End 1"]);
  // Each kind once, in FR-005's order; the hidden layer and the null aren't repeated as "ease first".
  const kinds = a.left_out.map((x) => x.kind);
  assert.deepEqual(kinds, [...new Set(kinds)]);
  assert.deepEqual(a.left_out.find((x) => x.kind === "expression").refs, [{ layer: "Logo", property: "Rotation" }]);
  assert.ok(!a.left_out.find((x) => x.kind === "ease_first").layers.includes("Old Take"));
});

test("eased_layers ranks a named layer first and ignores a name that's gone", () => {
  const a = analyze(now, { skill_options: { eased_layers: ["Subtitle"] } });
  assert.deepEqual(a.focus, ["Subtitle"]);
  assert.deepEqual(a.targets, ["2/ADBE Transform Group/ADBE Position/1", "2/ADBE Transform Group/ADBE Position/2"]);
  assert.deepEqual(analyze(now, { skill_options: { eased_layers: ["Gone"] } }).targets, analyze(now).targets);
  assert.deepEqual(analyze(now, { skill_options: { eased_layers: ["Gone", "Title"] } }).focus, ["Title"]);
  assert.deepEqual(analyze(now, { skill_options: { eased_layers: ["Old Take", "CTRL"] } }).focus, ["Title"], "never a hidden layer or a null by default");
});

test("land_hard drops a pair from candidates and targets (FR-006)", () => {
  const a = analyze(now, { skill_options: { land_hard: [id("P3")] } });
  assert.deepEqual(a.targets, [id("P1"), id("P2"), id("S")]);
  assert.equal(a.candidates_count, 7);
  const demo = analyze(now, { skill_options: { land_hard: [id("P1")] } });
  assert.equal(demo.demo_target, id("P2"), "the demo moves to the next focus pair");
});

test("focus_layers: Bar allows Trim Paths End alone, one target and no demo", () => {
  const a = analyze(now, { focus_layers: ["Bar"] });
  assert.deepEqual(a.targets, ["4/ADBE Root Vectors Group/ADBE Vector Group#1/ADBE Vectors Group/ADBE Vector Filter - Trim#3/ADBE Vector Trim End/1"]);
  assert.equal(a.demo_target, null);
  assert.equal(a.no_demo_reason, "single_target");
  assert.equal(a.pairs[0].display_path, "Contents › Rectangle › Contents › Trim Paths 1 › End");
});

test("focus_layers allows Opacity, a hidden layer or a null if they have candidates; never the demo on them", () => {
  const title = analyze(now, { focus_layers: ["Title"] });
  assert.ok(title.targets.includes("1/ADBE Transform Group/ADBE Opacity/1"));
  const eased = clone(now);
  for (const l of eased.layers.filter((x) => x.name === "CTRL" || x.name === "Old Take")) {
    for (const k of l.properties[0].keys) {
      k.in_type = k.out_type = "bezier";
      k.in_ease = [{ speed: 0, influence: 33.333 }];
      k.out_ease = [{ speed: 0, influence: 33.333 }];
    }
  }
  assert.deepEqual(analyze(eased).focus, ["Title"], "not by default");
  const both = analyze(eased, { focus_layers: ["CTRL", "Old Take"] });
  assert.equal(both.targets.length, 2);
  assert.equal(both.demo_target, null);
  assert.equal(both.no_demo_reason, "no_visible_layer");
  assert.ok(!both.left_out.some((x) => x.kind === "hidden" || x.kind === "null"), "what's named isn't 'left out'");
});

test("an unknown layer name throws before anything else", () => {
  assert.throws(() => analyze(now, { focus_layers: ["Nope"] }), { code: "UNKNOWN_LAYER" });
  assert.deepEqual(analyze(now, { focus_layers: ["Icon"] }).targets, [], "a precomp is a known name");
});

test("a pause (no value change) is never a candidate and isn't listed", () => {
  const p = clone(now);
  const sub = p.layers.find((l) => l.name === "Subtitle").properties[0];
  sub.keys[2].value = [...sub.keys[1].value];
  const a = analyze(p, { focus_layers: ["Subtitle"] });
  assert.deepEqual(a.targets, ["2/ADBE Transform Group/ADBE Position/1"]);
  assert.ok(!a.left_out.some((x) => (x.refs || []).some((r) => r.layer === "Subtitle" && r.property === "Position")));
});

test("a pair that already passes is 'already shaped', never a candidate", () => {
  const a = analyze(load("planted-15-80.json"));
  assert.ok(!a.targets.includes(id("P1")));
  assert.deepEqual(a.left_out.find((x) => x.kind === "already_shaped").refs, [{ layer: "Title", property: "Position" }]);
});

test("exclude drops matching {layer, property} (review's past targets)", () => {
  const a = analyze(now, { exclude: [{ layer: "Title", property: "Position" }] });
  assert.deepEqual(a.targets, [id("S")]);
  const b = analyze(now, { exclude: [{ layer: "Title", property: "Position" }, { layer: "Title", property: "Scale" }] });
  assert.deepEqual(b.focus, ["Subtitle"]);
});

test("review mode: one layer and property, one or two pairs, Position or Scale first", () => {
  const a = analyze(now, { mode: "review" });
  assert.deepEqual(a.targets, [id("P1"), id("P2")]);
  const card = analyze(load("practice2-before.json"), { mode: "review" });
  assert.deepEqual(card.targets, [id("CARD_P")]);
  const named = analyze(now, { mode: "review", focus_layers: ["Bar"] });
  assert.equal(named.targets.length, 1);
});

test("kept-linear marks: the property is skipped and not 'ease first' (spec 004 FR-038)", () => {
  const mark = { kind: "kept_linear", project: now.project, comp: now.comp.name, layer: "Glow", path: "ADBE Effect Parade/ADBE Gaussian Blur 2#1/ADBE Gaussian Blur 2-0001", property: "Blurriness", key_times: [0, 1] };
  const a = analyze(now, { kept_linear: [mark] });
  assert.equal(a.ease_first_count, 5);
  assert.ok(!a.left_out.find((x) => x.kind === "ease_first").layers.includes("Glow"));
});

// US3 (FR-002)
test("Mentor Practice as built: only Subtitle Position, one pair, no demo", () => {
  const a = analyze(load("practice-before.json"));
  assert.deepEqual(a.focus, ["Subtitle"]);
  assert.equal(a.targets.length, 1);
  assert.equal(a.demo_target, null);
});

test("a comp with nothing eased: nothing to shape, and some pairs to ease first", () => {
  const a = analyze(fixture("linear-basic"));
  assert.deepEqual(a.targets, []);
  assert.equal(a.no_demo_reason, "nothing_to_shape");
  assert.ok(a.ease_first_count > 0);
  const elsewhere = analyze(now, { focus_layers: ["Glow"] });
  assert.equal(elsewhere.no_demo_reason, "none_in_focus", "candidates exist, just not on the named layer");
});

test("FINDERS agrees with analyze() on every fixture, with and without exclude", () => {
  const files = [
    ...fs.readdirSync(path.join(DIR, "stand-in")).filter((f) => f.endsWith(".json")),
    ...fs.readdirSync(DIR).filter((f) => f.endsWith(".json") && f !== "answer-key.json"),
  ];
  const excludes = [[], [{ layer: "Title", property: "Position" }], [{ layer: "Title", property: "Position" }, { layer: "Title", property: "Scale" }, { layer: "Subtitle", property: "Position" }], [{ layer: "Card", property: "Position" }, { layer: "Card", property: "Scale" }]];
  const f = FINDERS["easing.speed_graph"];
  for (const file of [...new Set(files), "practice-before.json"]) {
    const snap = load(file);
    if (!Array.isArray(snap.layers)) continue; // the learner record, not a snapshot
    for (const exclude of excludes) {
      const found = f.focus(snap, { exclude });
      for (const mode of ["lesson", "review"]) {
        const a = analyze(snap, { exclude, mode });
        assert.equal(found.count > 0, a.targets.length > 0, `${file} ${mode} ${JSON.stringify(exclude)}`);
      }
      assert.deepEqual(found, finder(snap, { exclude }));
    }
    assert.deepEqual(f.focus(snap, { exclude: [], kept_linear: undefined }), f.focus(snap));
  }
});
