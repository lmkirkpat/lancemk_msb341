// Spec 008 FR-010 to FR-014: the pair check, the mistake each fail matches, shared keys, key
// changes and demo credit. Pure: pairShape() and check() on small pairs and on the planted fixtures
// (live captures when there, stand-ins until then; answer-key.json).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

tempHome();
const sg = await import("../lib/speed-graph.mjs");
const { pairShape, check, MIN_GAP, DEFAULT_INFLUENCE, DEFAULT_TOL, REST_SHARE, REST_ABS, DEMO_OUT, DEMO_IN } = sg;

const DIR = path.join(FIXTURES, "speed-graph");
const load = (name) => {
  const live = path.join(DIR, name);
  return JSON.parse(fs.readFileSync(fs.existsSync(live) ? live : path.join(DIR, "stand-in", name), "utf8"));
};
const KEY = JSON.parse(fs.readFileSync(path.join(DIR, "answer-key.json"), "utf8"));
const id = (k) => KEY.ids[k] || k;
const clone = (x) => JSON.parse(JSON.stringify(x));

// A one-dimension pair from 0 to 40 over 1 s (average speed 40), both facing sides bezier.
function pair({ out = 33.333, inn = 33.333, outSpeed = 0, inSpeed = 0, outType = "bezier", inType = "bezier", from = 0, to = 40, dims = 1, path: p = "ADBE Transform Group/ADBE Opacity" } = {}) {
  const e = (inf, speed) => Array.from({ length: dims }, () => ({ speed, influence: inf }));
  const fromKey = { index: 1, time: 0, in_type: "linear", out_type: outType, value: from, in_ease: e(16.667, 0), out_ease: e(out, outSpeed) };
  const toKey = { index: 2, time: 1, in_type: inType, out_type: "linear", value: to, in_ease: e(inn, inSpeed), out_ease: e(16.667, 0) };
  return { id: `1/${p}/1`, layer: { index: 1, name: "L", enabled: true, is_null: false }, prop: { path: p, display_name: "Opacity" }, from: fromKey, to: toKey, from_time: 0, to_time: 1, display_path: "Transform › Opacity" };
}

test("the pass margins are the spec's, by name", () => {
  assert.equal(MIN_GAP, 20);
  assert.equal(DEFAULT_INFLUENCE, 33.33);
  assert.equal(DEFAULT_TOL, 1);
  assert.equal(REST_SHARE, 0.05);
  assert.equal(REST_ABS, 0.001);
  assert.ok(Math.abs(DEMO_OUT - 15) < 0.5 && Math.abs(DEMO_IN - 80) < 0.5, "FR-008: within 0.5 of 15 and 80");
  assert.ok(!Number.isInteger(DEMO_OUT) && !Number.isInteger(DEMO_IN), "not values a learner types");
});

test("15/80 passes; 33/33 fails b (and a)", () => {
  assert.deepEqual(pairShape(pair({ out: 15, inn: 80 })).failed, []);
  assert.equal(pairShape(pair({ out: 15, inn: 80 })).passed, true);
  const easy = pairShape(pair());
  assert.equal(easy.passed, false);
  assert.deepEqual(easy.failed, ["a", "b"]);
});

test("a: the landing 20 points above the start passes, 19.9 fails", () => {
  assert.equal(pairShape(pair({ out: 15, inn: 35 })).passed, true);
  assert.deepEqual(pairShape(pair({ out: 15, inn: 34.9 })).failed, ["a"]);
  assert.equal(pairShape(pair({ out: 33.33, inn: 53.33 })).passed, true, "exactly 20 above the default, despite float noise");
});

test("b: both facing sides within 1 point of 33.33 fails; one side outside doesn't", () => {
  assert.ok(pairShape(pair({ out: 32.4, inn: 34.3 })).failed.includes("b"));
  assert.ok(!pairShape(pair({ out: 32.2, inn: 34.3 })).failed.includes("b"));
});

test("c: a linear or hold facing side fails c", () => {
  assert.ok(pairShape(pair({ out: 15, inn: 80, outType: "linear" })).failed.includes("c"));
  assert.ok(pairShape(pair({ out: 15, inn: 80, inType: "hold" })).failed.includes("c"));
  assert.ok(pairShape(pair({ out: 15, inn: 80, outType: "hold" })).failed.includes("c"));
});

test("d: landing speed at 5% of the average passes, above fails; unknown values need 0", () => {
  assert.equal(pairShape(pair({ out: 15, inn: 80, inSpeed: 2 })).passed, true, "5% of 40");
  assert.deepEqual(pairShape(pair({ out: 15, inn: 80, inSpeed: 2.01 })).failed, ["d"]);
  assert.deepEqual(pairShape(pair({ out: 15, inn: 80, inSpeed: -2.5 })).failed, ["d"], "either direction");
  const unknown = pair({ out: 15, inn: 80, inSpeed: 0.001, from: null, to: null });
  assert.equal(pairShape(unknown).passed, true);
  assert.deepEqual(pairShape(pair({ out: 15, inn: 80, inSpeed: 0.002, from: null, to: null })).failed, ["d"]);
});

test("a moving dimension failing alone is named; a dimension that doesn't move isn't graded", () => {
  const p = "ADBE Transform Group/ADBE Scale";
  const s = pair({ out: 15, inn: 80, dims: 3, from: [80, 80, 100], to: [100, 100, 100], path: p });
  assert.equal(pairShape(s).passed, true, "the third Scale dimension stays at 33/33 and isn't graded");
  s.to.in_ease[2] = { speed: 50, influence: 1 };
  assert.equal(pairShape(s).passed, true);
  s.from.out_ease[1] = { speed: 0, influence: 33.333 };
  s.to.in_ease[1] = { speed: 0, influence: 33.333 };
  const r = pairShape(s);
  assert.equal(r.passed, false);
  assert.equal(r.dimension, "height");
});

// --- check() against the baseline

const baseline = load("practice-now.json");
const lessonFor = (extra = {}) => ({ comp_id: baseline.comp.id, targets: KEY.analysis["practice-now.json"].targets.map(id), demo: null, ...extra });

function expectPair(got, want, where) {
  assert.ok(got, `${where}: missing`);
  assert.equal(got.result, want.result, `${where}: result`);
  if ("failed" in want) assert.deepEqual(got.failed, want.failed, `${where}: failed`);
  if ("mistake" in want) assert.equal(got.mistake, want.mistake, `${where}: mistake`);
  if ("dimension" in want) assert.equal(got.dimension, want.dimension, `${where}: dimension`);
  else if (got.result !== "keys_changed") assert.equal(got.dimension, undefined, `${where}: no dimension`);
  if ("key_time" in want) assert.equal(got.key_time, want.key_time, `${where}: key_time`);
  if ("drag_sideways" in want) assert.equal(got.drag_sideways, want.drag_sideways, `${where}: drag_sideways`);
  if ("credit" in want) assert.equal(got.credit, want.credit, `${where}: credit`);
  if ("parts" in want) assert.deepEqual(got.fastest.parts, want.parts, `${where}: fastest`);
}

for (const [name, want] of Object.entries(KEY.check)) {
  test(`check grades ${name} as the answer key says`, () => {
    const file = want.file || name;
    const lesson = lessonFor(want.demo ? { demo: { segment_id: id(want.demo), at: "2026-10-21T00:00:00.000Z" } } : {});
    const r = check(baseline, load(file), lesson, { seen_shaped: (want.seen_shaped || []).map(id) });
    assert.equal(r.comp_matches, true);
    assert.equal(r.passed, want.passed);
    for (const p of r.pairs) {
      const key = Object.keys(want.pairs).find((k) => id(k) === p.id);
      expectPair(p, key ? want.pairs[key] : KEY.untouched, `${name} ${p.id}`);
    }
    for (const note of want.other_changes || []) assert.ok(r.other_changes.includes(note), `${name}: other change "${note}"`);
  });
}

test("drag_sideways only when the landing influence stayed within 1 point of the baseline's", () => {
  const cur = load("planted-dragged-up-large.json");
  cur.layers[0].properties[0].keys[1].in_ease[0].influence = 40;
  const r = check(baseline, cur, lessonFor());
  const p1 = r.pairs.find((p) => p.id === id("P1"));
  assert.equal(p1.mistake, "arrives_moving");
  assert.equal(p1.drag_sideways, false);
});

test("back to default only once a check has seen the pair shaped; seen_shaped is returned", () => {
  const shaped = check(baseline, load("planted-15-80.json"), lessonFor());
  assert.ok(shaped.seen_shaped.includes(id("P1")));
  assert.ok(!shaped.seen_shaped.includes(id("P2")), "a pair at the default isn't 'seen shaped'");
  const again = check(baseline, load("planted-33-33.json"), lessonFor(), { seen_shaped: shaped.seen_shaped });
  assert.equal(again.pairs.find((p) => p.id === id("P1")).mistake, "back_to_default");
  assert.ok(again.seen_shaped.includes(id("P1")), "the list only grows within a lesson");
});

test("long on both ends needs a failing and both sides at least 50", () => {
  const cur = clone(baseline);
  const scale = cur.layers[0].properties[1];
  scale.keys[0].out_ease.forEach((e) => (e.influence = 49));
  scale.keys[1].in_ease.forEach((e) => (e.influence = 60));
  const r = check(baseline, cur, lessonFor());
  assert.equal(r.pairs.find((p) => p.id === id("S")).mistake, "not_shaped");
});

test("mixed up isn't said when the start key's in side is another focus pair's landing (D-3)", () => {
  const cur = load("planted-shared-key.json");
  const r = check(baseline, cur, lessonFor());
  assert.equal(r.pairs.find((p) => p.id === id("P2")).mistake, "not_shaped");
  // With pair 1 dropped (it lands hard), the same change on pair 2's start key is "mixed up".
  const dropped = check(baseline, cur, lessonFor({ skill_options: { land_hard: [id("P1")] } }));
  assert.equal(dropped.pairs.find((p) => p.id === id("P1")), undefined, "a dropped pair isn't graded");
  assert.equal(dropped.pairs.find((p) => p.id === id("P2")).mistake, "in_out_mixed");
});

test("shared middle key (FR-013): pair 2's start shaped never counts for pair 1, and back", () => {
  const cur = clone(baseline);
  const pos = cur.layers[0].properties[0];
  pos.keys[1].out_ease[0].influence = 15; // pair 2's start side of the 1.5 s key
  pos.keys[2].in_ease[0].influence = 80; // pair 2's landing
  const r = check(baseline, cur, lessonFor());
  assert.equal(r.pairs.find((p) => p.id === id("P2")).result, "passed");
  assert.equal(r.pairs.find((p) => p.id === id("P1")).result, "not_passed");
  const back = check(baseline, load("planted-shared-key.json"), lessonFor());
  assert.equal(back.pairs.find((p) => p.id === id("P1")).result, "passed");
  assert.equal(back.pairs.find((p) => p.id === id("P2")).result, "not_passed");
});

test("keys added, removed or moved on a focus property (FR-014): not graded, and no pass", () => {
  const moved = clone(baseline);
  moved.layers[0].properties[1].keys[1].time = 1.6;
  const r = check(baseline, moved, lessonFor());
  assert.equal(r.pairs.find((p) => p.id === id("S")).result, "keys_changed");
  const passing = clone(baseline);
  for (const p of passing.layers[0].properties.slice(0, 2)) {
    for (let k = 0; k < p.keys.length; k++) {
      p.keys[k].out_ease.forEach((e) => (e.influence = 15));
      p.keys[k].in_ease.forEach((e) => (e.influence = 80));
    }
  }
  assert.equal(check(baseline, passing, lessonFor()).passed, true, "every focus pair shaped passes");
  const added = clone(passing);
  added.layers[0].properties[1].keys.push({ ...clone(added.layers[0].properties[1].keys[1]), index: 3, time: 2 });
  assert.equal(check(baseline, added, lessonFor()).passed, false, "a key change holds the pass until the mentor asks");
});

test("demo credit (FR-008): demo, learner after undo, learner redo, unknown", () => {
  const demo = { segment_id: id("P1"), at: "2026-10-21T00:00:00.000Z" };
  const credit = (file, lesson = {}) => check(baseline, typeof file === "string" ? load(file) : file, lessonFor({ demo, ...lesson })).pairs.find((p) => p.id === id("P1"));
  assert.equal(credit("after-demo.json").credit, "demo");
  // One facing side still within 0.0005 of the fingerprint is enough.
  const oneSide = load("after-demo.json");
  oneSide.layers[0].properties[0].keys[1].in_ease[0].influence = 90;
  assert.equal(credit(oneSide).credit, "demo");
  const near = load("after-demo.json");
  near.layers[0].properties[0].keys[0].out_ease[0].influence = DEMO_OUT + 0.0004;
  near.layers[0].properties[0].keys[1].in_ease[0].influence = DEMO_IN - 0.0004;
  assert.equal(credit(near).credit, "demo");
  const off = load("after-demo.json");
  off.layers[0].properties[0].keys[0].out_ease[0].influence = DEMO_OUT + 0.001;
  off.layers[0].properties[0].keys[1].in_ease[0].influence = DEMO_IN + 0.001;
  assert.equal(credit(off).credit, "learner_redo");
  assert.equal(credit("after-demo-undone.json").credit, "learner_after_undo");
  assert.equal(credit("after-demo-redone.json").credit, "learner_redo");
  assert.equal(credit("after-demo.json", { demo: { ...demo, undone: "2026-10-21T00:01:00.000Z" } }).credit, "learner_after_undo",
    "once a check saw it undone, it's the learner's pair");
  const unknown = load("after-demo.json");
  unknown.layers[0].properties[0].keys[0].out_ease = [{ speed: 0, influence: null }];
  assert.equal(credit(unknown).credit, "unknown");
  const r = check(baseline, load("after-demo-redone.json"), lessonFor({ demo }));
  assert.equal(r.demo_undone, true);
  assert.equal(check(baseline, load("after-demo.json"), lessonFor({ demo })).demo_undone, false);
});

test("another comp isn't graded; the baseline is never changed", () => {
  const before = JSON.stringify(baseline);
  const other = load("practice2-before.json");
  const r = check(baseline, other, lessonFor());
  assert.equal(r.comp_matches, false);
  assert.equal(r.lesson_comp, "Mentor Practice");
  assert.deepEqual(r.pairs, []);
  assert.equal(r.passed, false);
  check(baseline, load("planted-15-80.json"), lessonFor());
  assert.equal(JSON.stringify(baseline), before);
});
